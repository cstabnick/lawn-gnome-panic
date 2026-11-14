// Online play over the shared matchmaking server (@lawn/mp): quick match or a room code, one host runs the
// party and relays PartyMsg, everyone else pings the host. See _common.md and 2D-net.md.
import type { PlayerInfo } from '@lawn/mp/protocol';
import { GAMES, type ServerMsg } from '@lawn/mp/protocol';
import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
import { getMyGnome, prefetchLooks } from '@lawn/gnome';
import type { PartyMsg } from './config';
import { GAME_ID } from './config';

export interface NetStatus {
  status: 'off' | 'connecting' | 'queued' | 'playing' | 'error';
  /** Human-readable line for the menu ("Waiting for players: 2 / 4, starts in 12 s", "Could not reach the server"). */
  message: string;
  /** Room code while queued with one, else null. */
  code: string | null;
}
export interface MatchInfo { players: PlayerInfo[]; hostId: number; you: number; seed: number }

export interface PartyNet {
  readonly status: NetStatus;
  readonly isHost: boolean;
  readonly myId: number | null;
  /** True when serverUrl() is '' (online not set up for this build): the menu hides online buttons. */
  readonly unavailable: boolean;
  quickMatch(name: string): void;
  /** code: 4-8 of A-Z 0-9 (upper-case it). */
  joinRoom(code: string, name: string): void;
  leave(): void;
  /** Host -> everyone else. */
  broadcast(m: PartyMsg): void;
  /** Anyone -> the host (no-op on the host). */
  sendToHost(m: PartyMsg): void;
  onStatus(fn: (s: NetStatus) => void): void;
  onMatch(fn: (m: MatchInfo) => void): void;
  onMessage(fn: (fromId: number, m: PartyMsg) => void): void;
  onLeft(fn: (id: number) => void): void;
  /** The server named a new host (fires for everyone, including the new host). */
  onHost(fn: (hostId: number) => void): void;
  /** The connection or match is gone (closed socket, 'ended'). The party is over for this screen. */
  onLost(fn: (reason: string) => void): void;
  /** Every frame: non-hosts send { k:'ping' } to the host every 2 s while playing, so the server never times them out. */
  update(dt: number): void;
}

const PING_EVERY_S = 2;
const PARTY_MSG_KINDS: readonly string[] = ['party', 'snap', 'in', 'roll', 'ping'];
const MAX_PLAYERS = GAMES[GAME_ID].maxPlayers;

/** Shape check for a relayed message: an object with a known string `k`. Anything else is dropped. */
function isPartyMsg(d: unknown): d is PartyMsg {
  if (typeof d !== 'object' || d === null) return false;
  const k = (d as Record<string, unknown>).k;
  return typeof k === 'string' && PARTY_MSG_KINDS.includes(k);
}

export function createNet(): PartyNet {
  const status: NetStatus = { status: 'off', message: '', code: null };

  let client: NetClient<PartyMsg> | null = null;
  /** True from quickMatch/joinRoom until leave(), a failed connection or a lost one. Messages are ignored otherwise. */
  let active = false;
  /** True once the server has started a match for us. */
  let playing = false;
  /** True while connect() is in progress (a socket close then belongs to the connect call, not to a lost match). */
  let opening = false;
  let hostId: number | null = null;
  let pingAcc = 0;

  const statusListeners: ((s: NetStatus) => void)[] = [];
  const matchListeners: ((m: MatchInfo) => void)[] = [];
  const messageListeners: ((fromId: number, m: PartyMsg) => void)[] = [];
  const leftListeners: ((id: number) => void)[] = [];
  const hostListeners: ((hostId: number) => void)[] = [];
  const lostListeners: ((reason: string) => void)[] = [];

  function setStatus(s: Partial<NetStatus>): void {
    Object.assign(status, s);
    for (const fn of statusListeners) fn(status);
  }

  /** The shared client; created on first use. The hello name is only a default: queue() sends the real one. */
  function getClient(name: string): NetClient<PartyMsg> {
    if (!client) {
      const c = createNetClient<PartyMsg>(serverUrl(), GAME_ID, { name, character: getMyGnome()?.code ?? 'gnorman' });
      c.onMessage(handle);
      c.onClose(() => {
        if (!opening) lost('Connection lost');
      });
      client = c;
    }
    return client;
  }

  /** The connection died (or the server ended our match). Only a match in progress counts as lost. */
  function lost(reason: string): void {
    if (!active) return;
    const wasPlaying = playing;
    active = false;
    playing = false;
    hostId = null;
    setStatus({ status: 'off', message: '', code: null });
    client?.drop(); // runs our close listener again; active is already false, so it does nothing
    if (wasPlaying) for (const fn of lostListeners) fn(reason);
  }

  function handle(m: ServerMsg<PartyMsg>): void {
    if (!active) return;
    switch (m.t) {
      case 'queued':
        if (playing) return;
        setStatus({
          status: 'queued',
          message: `Waiting for players: ${m.players} / ${MAX_PLAYERS}, starts in ${Math.ceil(m.startsInS)} s`,
          code: m.code,
        });
        return;
      case 'match': {
        void prefetchLooks(m.players); // decode saved gnomes before the players appear
        playing = true;
        hostId = m.hostId;
        setStatus({ status: 'playing', message: '' });
        const info: MatchInfo = { players: m.players, hostId: m.hostId, you: m.you, seed: m.seed };
        for (const fn of matchListeners) fn(info);
        return;
      }
      case 'relay': {
        if (!isPartyMsg(m.d)) return;
        const from = m.from;
        for (const fn of messageListeners) fn(from, m.d);
        return;
      }
      case 'left':
        for (const fn of leftListeners) fn(m.id);
        return;
      case 'host':
        hostId = m.hostId;
        for (const fn of hostListeners) fn(m.hostId);
        return;
      case 'ended':
        lost(m.reason);
        return;
      case 'error':
        if (m.code === 'bad-name') {
          active = false;
          setStatus({ status: 'error', message: 'Pick another name', code: null });
          return;
        }
        if (playing) return; // chat-rate and similar: not a reason to leave the party
        active = false;
        setStatus({ status: 'error', message: m.message, code: null });
        return;
      default:
        return; // welcome, joined, beat, chat
    }
  }

  async function start(code: string | null, name: string): Promise<void> {
    if (active) return;
    active = true;
    playing = false;
    hostId = null;
    setStatus({ status: 'connecting', message: 'Connecting…', code });
    const c = getClient(name);
    opening = true;
    try {
      await c.connect();
    } catch {
      opening = false;
      if (!active) return;
      active = false;
      setStatus({ status: 'error', message: 'Could not reach the server', code });
      return;
    }
    opening = false;
    if (!active) return; // left while connecting
    c.queue(code, getMyGnome()?.code ?? 'gnorman', name);
  }

  return {
    get status() { return status; },
    get isHost() { return playing && hostId !== null && client?.id === hostId; },
    get myId() { return client?.id ?? null; },
    get unavailable() { return serverUrl() === ''; },
    quickMatch(name: string): void {
      void start(null, name);
    },
    joinRoom(code: string, name: string): void {
      void start(code.trim().toUpperCase(), name);
    },
    leave(): void {
      active = false;
      playing = false;
      hostId = null;
      client?.leave();
      setStatus({ status: 'off', message: '', code: null });
    },
    broadcast(m: PartyMsg): void {
      if (!playing || client?.id !== hostId) return;
      client?.send(null, m);
    },
    sendToHost(m: PartyMsg): void {
      if (!playing || hostId === null || client?.id === hostId) return;
      client?.send(hostId, m);
    },
    onStatus(fn) { statusListeners.push(fn); },
    onMatch(fn) { matchListeners.push(fn); },
    onMessage(fn) { messageListeners.push(fn); },
    onLeft(fn) { leftListeners.push(fn); },
    onHost(fn) { hostListeners.push(fn); },
    onLost(fn) { lostListeners.push(fn); },
    update(dt: number): void {
      if (!playing || !client || hostId === null || client.id === hostId) {
        pingAcc = 0;
        return;
      }
      pingAcc += dt;
      if (pingAcc >= PING_EVERY_S) {
        pingAcc = 0;
        client.send(hostId, { k: 'ping' });
      }
    },
  };
}
