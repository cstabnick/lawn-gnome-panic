// src/net/session.ts: the matchmaking connection, the lobby and the match roster.
// Owns the WebSocket to the shared matchmaking server; hands relay messages to host.ts or guest.ts.
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import type { ServerMsg } from '@lawn/mp/protocol';
import { getMyGnome, prefetchLooks } from '@lawn/gnome';
import type { Game } from '../config';
import type { GuestSync } from './guest';
import type { HostSync } from './host';
import { applyHumans, lobby, netHooks, netLink, netState } from './state';
import type { FrontMsg, GuestMsg, HostMsg } from './protocol';

export interface Session {
  /** Every frame: handles lobby.request, then runs host.update or guest.update for the current role. */
  update(dt: number): void;
}

export function createSession(game: Game, host: HostSync, guest: GuestSync): Session {
  /** The live connection, or null. Callbacks ignore any client that is no longer `link`. */
  let link: NetClient<FrontMsg> | null = null;
  /** True once the queue request was sent on the current connection. */
  let queued = false;

  function inMatch(): boolean {
    return lobby.status === 'in' || lobby.status === 'joining';
  }

  /** Leaving rules for a match you were in. A host keeps playing alone; a guest reloads to start fresh. */
  function leaveMatch(msg: string): void {
    const wasGuest = netState.role === 'guest';
    netLink.me = -1;
    netLink.hostId = -1;
    netLink.roster = [];
    netLink.send = () => {};
    host.reset();
    guest.reset();
    netState.humans = [];
    applyHumans(game, -1);
    if (wasGuest) {
      // The world on screen was the host's, so start fresh.
      netState.role = 'solo';
      lobby.status = 'error';
      lobby.message = msg + ' Reloading...';
      setTimeout(() => location.reload(), 2500);
    } else {
      // The host keeps playing; remote humans became bots again through applyHumans.
      netState.role = 'solo';
      lobby.status = 'off';
      lobby.message = msg;
    }
  }

  function join(name: string, code: string | null): void {
    const url = serverUrl();
    if (url === '') {
      lobby.status = 'error';
      lobby.message = 'Online play is not set up for this build.';
      return;
    }
    if (inMatch()) return;
    if (link) {
      const old = link;
      link = null;
      old.drop();
    }
    const client = createNetClient<FrontMsg>(url, 'gnome-front', { name, character: getMyGnome()?.code ?? 'gnorman' });
    link = client;
    queued = false;
    lobby.status = 'connecting';
    lobby.message = '';
    lobby.code = code;

    client.onMessage((m) => {
      if (link === client) onServer(client, m);
    });
    client.onClose(() => {
      if (link !== client) return;
      if (inMatch()) {
        link = null;
        leaveMatch('Lost the connection to the match.');
      } else if (queued) {
        link = null;
        lobby.status = 'error';
        lobby.message = 'Lost the connection to the matchmaking server.';
      }
    });
    client.connect().then(() => {
      if (link !== client) return;
      queued = true;
      client.queue(code, 'gnorman', name);
      lobby.status = 'queued';
    }, (err: unknown) => {
      if (link !== client) return;
      link = null;
      lobby.status = 'error';
      lobby.message = err instanceof Error ? err.message : 'Could not reach the matchmaking server.';
    });
  }

  function leave(): void {
    const old = link;
    link = null;
    if (old) {
      old.leave();
      old.drop();
    }
    if (inMatch()) {
      leaveMatch('You left the match.');
    } else {
      lobby.status = 'off';
      lobby.message = '';
    }
  }

  function onServer(client: NetClient<FrontMsg>, m: ServerMsg<FrontMsg>): void {
    switch (m.t) {
      case 'queued': {
        lobby.players = m.players;
        lobby.startsInS = m.startsInS;
        lobby.code = m.code;
        lobby.status = 'queued';
        break;
      }
      case 'match': {
        netLink.me = m.you;
        netLink.hostId = m.hostId;
        netLink.roster = m.players.map((p) => ({ ...p }));
        void prefetchLooks(netLink.roster);
        netLink.send = (to, d) => {
          if (link === client) client.send(to, d);
        };
        if (m.hostId === m.you) {
          netState.role = 'host';
          guest.reset();
          host.reset();
          host.reconcile();
          lobby.status = 'in';
          netHooks.startMatch?.();
        } else {
          // guest.ts sets 'in' and calls startMatch once the first snapshot places this player.
          netState.role = 'guest';
          host.reset();
          guest.reset();
          lobby.status = 'joining';
        }
        break;
      }
      case 'joined': {
        if (!netLink.roster.some((p) => p.id === m.player.id)) netLink.roster.push({ ...m.player });
        if (netState.role === 'host') host.reconcile();
        break;
      }
      case 'left': {
        netLink.roster = netLink.roster.filter((p) => p.id !== m.id);
        if (netState.role === 'host') host.reconcile();
        break;
      }
      case 'host': {
        netLink.hostId = m.hostId;
        if (m.hostId === netLink.me && netState.role === 'guest') {
          // The old host left; I already have the world from its snapshots, so I carry on from here.
          netState.role = 'host';
          guest.reset();
          host.reset();
          host.reconcile();
          if (lobby.status === 'joining') {
            lobby.status = 'in';
            netHooks.startMatch?.();
          }
        }
        break;
      }
      case 'relay': {
        if (netState.role === 'host') {
          host.onRelay(m.from, m.d as GuestMsg);
        } else if (netState.role === 'guest' && m.from === netLink.hostId) {
          guest.onRelay(m.from, m.d as HostMsg);
        }
        break;
      }
      case 'ended': {
        if (link === client) link = null;
        client.drop();
        if (inMatch()) {
          leaveMatch(m.reason);
        } else {
          lobby.status = 'error';
          lobby.message = m.reason;
        }
        break;
      }
      case 'error': {
        if (!inMatch()) {
          lobby.status = 'error';
          lobby.message = m.message;
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    update(dt: number) {
      const req = lobby.request;
      if (req !== null) {
        lobby.request = null;
        if (req === 'leave') leave();
        else join(req.name, req.code);
      }
      if (lobby.status === 'in' || lobby.status === 'joining') {
        if (netState.role === 'host') host.update(dt);
        else if (netState.role === 'guest') guest.update(dt);
      }
    },
  };
}
