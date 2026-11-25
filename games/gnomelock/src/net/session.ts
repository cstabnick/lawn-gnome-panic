// @lawn/mp network session wrapper for Gnomelock with instant Lobby Creator & live match sync.
import { createNetClient, serverUrl, type NetClient, type PlayerInfo } from '@lawn/mp';
import { steadyInterval } from '@lawn/mp/background';
import { getMyGnome } from '@lawn/gnome';
import type { HeroId } from '../sim/config';
import type { HeroActionInput, MatchState, SlotSetup } from '../sim/world';
import type { LobbyState } from './lobby';
import type { GameNetMsg, HostStartMatchMsg, WorldSnapshotMsg } from './protocol';

export interface OnlineSession {
  client: NetClient<GameNetMsg>;
  isHost: () => boolean;
  myId: () => number;
  roster: () => PlayerInfo[];
  sendInput: (inp: HeroActionInput) => void;
  sendBuy: (itemId: string) => void;
  sendPick: (heroId: HeroId) => void;
  sendClaimSlot: (slot: number) => void;
  sendLobbyState: (state: LobbyState) => void;
  sendStartMatch: (
    slots: SlotSetup[],
    botSkills: [number, number, number, number],
    slotForPlayerId: [number, number][],
  ) => void;
  broadcastSnapshot: (state: MatchState) => void;
  close: () => void;
}

export function startOnlineSession(
  roomCode: string | null,
  mpOverride: string | undefined,
  callbacks: {
    onStatus: (msg: string) => void;
    onMatchReady: (isHost: boolean, players: PlayerInfo[]) => void;
    onPlayerJoined?: (player: PlayerInfo) => void;
    onPlayerLeft?: (playerId: number) => void;
    onHostTakeover?: (newHostId: number) => void;
    onHeroPick?: (playerId: number, heroId: HeroId) => void;
    onClaimSlot?: (playerId: number, slot: number) => void;
    onLobbyState?: (state: LobbyState) => void;
    onStartMatch?: (msg: HostStartMatchMsg) => void;
    onGuestInput: (playerId: number, inp: HeroActionInput) => void;
    onGuestBuy: (playerId: number, itemId: string) => void;
    onSnapshot: (snap: WorldSnapshotMsg) => void;
    onError: (msg: string) => void;
  },
): OnlineSession {
  const mine = getMyGnome();
  const url = mpOverride || serverUrl();
  let roster: PlayerInfo[] = [];
  let hostFlag = false;
  let myId = -1;
  let inMatch = false;
  let closed = false;
  const charCode = mine?.code ?? 'gnorman';
  const myName = mine?.name ?? 'Gnome';

  const client = createNetClient<GameNetMsg>(url, 'gnomelock', {
    name: myName,
    character: charCode,
    resumable: true,
  });

  // Keep match alive in the lobby (server drops members silent for MATCH_SILENT_S = 8s).
  const stopHb = steadyInterval(() => {
    if (inMatch && !closed) {
      client.send(null, { t: 'hb' });
    }
  }, 3000);

  client.onMessage((m) => {
    if (closed) return;
    if (m.t === 'queued') {
      callbacks.onStatus(`Joining lobby (${m.players} in queue)...`);
    } else if (m.t === 'match') {
      inMatch = true;
      myId = m.you;
      hostFlag = m.hostId === myId;
      roster = [...m.players];
      callbacks.onMatchReady(hostFlag, roster);
    } else if (m.t === 'joined') {
      if (!roster.some((p) => p.id === m.player.id)) {
        roster.push(m.player);
      }
      callbacks.onPlayerJoined?.(m.player);
    } else if (m.t === 'left') {
      roster = roster.filter((p) => p.id !== m.id);
      callbacks.onPlayerLeft?.(m.id);
    } else if (m.t === 'host') {
      hostFlag = m.hostId === myId;
      callbacks.onHostTakeover?.(m.hostId);
    } else if (m.t === 'relay') {
      const msg = m.d;
      if (msg.t === 'hb') {
        return;
      } else if (msg.t === 'pick') {
        callbacks.onHeroPick?.(m.from, msg.heroId);
      } else if (msg.t === 'claim') {
        callbacks.onClaimSlot?.(m.from, msg.slot);
      } else if (msg.t === 'lobby') {
        callbacks.onLobbyState?.(msg.state);
      } else if (msg.t === 'start') {
        callbacks.onStartMatch?.(msg);
      } else if (msg.t === 'input') {
        callbacks.onGuestInput(m.from, msg.inp);
      } else if (msg.t === 'buy') {
        callbacks.onGuestBuy(m.from, msg.itemId);
      } else if (msg.t === 'snap') {
        callbacks.onSnapshot(msg);
      }
    } else if (m.t === 'error') {
      callbacks.onError(m.message || 'Connection error');
    } else if (m.t === 'ended') {
      inMatch = false;
      callbacks.onError(m.reason || 'Lobby ended');
    }
  });

  client.onClose(() => {
    inMatch = false;
    if (!closed) {
      callbacks.onStatus('Disconnected from relay');
    }
  });

  callbacks.onStatus(roomCode ? `Connecting to room ${roomCode}...` : 'Connecting to Bramble relay...');
  void client
    .connect()
    .then(() => {
      if (!closed) client.queue(roomCode, charCode, myName);
    })
    .catch(() => {
      if (!closed) callbacks.onError('Could not connect to relay');
    });

  return {
    client,
    isHost: () => hostFlag,
    myId: () => myId,
    roster: () => roster,
    sendInput(inp) {
      client.send(null, { t: 'input', inp });
    },
    sendBuy(itemId) {
      client.send(null, { t: 'buy', itemId });
    },
    sendPick(heroId) {
      client.send(null, { t: 'pick', heroId });
    },
    sendClaimSlot(slot) {
      client.send(null, { t: 'claim', slot });
    },
    sendLobbyState(state) {
      client.send(null, { t: 'lobby', state });
    },
    sendStartMatch(slots, botSkills, slotForPlayerId) {
      client.send(null, { t: 'start', slots, botSkills, slotForPlayerId });
    },
    broadcastSnapshot(state) {
      const snap: WorldSnapshotMsg = {
        t: 'snap',
        timeS: state.timeS,
        winner: state.winner,
        relicSpawned: state.relic.spawned,
        relicAlive: state.relic.alive,
        relicHp: state.relic.hp,
        relicClaimedBy: state.relic.claimedByTeam,
        heroes: state.heroes.map((h) => ({
          slot: h.slot,
          team: h.team,
          heroId: h.heroId,
          name: h.name,
          isBot: h.isBot,
          userId: h.userId,
          characterCode: h.characterCode,
          x: h.move.pos.x,
          y: h.move.pos.y,
          z: h.move.pos.z,
          vx: h.move.vel.x,
          vy: h.move.vel.y,
          vz: h.move.vel.z,
          yaw: h.yaw,
          pitch: h.pitch,
          hp: h.hp,
          maxHp: h.maxHp,
          shield: h.shield,
          alive: h.alive,
          respawnTimer: h.respawnTimer,
          acorns: Math.round(h.acorns),
          totalAcorns: Math.round(h.totalAcorns),
          level: h.level,
          kills: h.kills,
          deaths: h.deaths,
          lastHits: h.lastHits,
          orbsConfirmed: h.orbsConfirmed,
          orbsDenied: h.orbsDenied,
          stamina: h.move.stamina,
          maxStamina: h.move.maxStamina,
          flowTier: h.move.flowTier,
          sliding: h.move.sliding,
          flipTimer: h.move.flipTimer,
          ammo: h.ammo,
          cooldowns: { ...h.cooldowns },
          items: [...h.items],
        })),
        creeps: state.creeps.map((c) => ({
          id: c.id,
          team: c.team,
          kind: c.kind,
          x: c.x,
          y: c.y,
          z: c.z,
          hp: c.hp,
          maxHp: c.maxHp,
        })),
        neutrals: state.neutrals.map((n) => ({
          id: n.id,
          campId: n.campId,
          kind: n.kind,
          x: n.x,
          y: n.y,
          z: n.z,
          hp: n.hp,
          maxHp: n.maxHp,
        })),
        orbs: state.orbs.map((o) => ({
          id: o.id,
          team: o.team,
          x: o.x,
          y: o.y,
          z: o.z,
        })),
        structures: state.structures.map((s) => ({
          id: s.id,
          hp: s.hp,
          invulnerable: s.invulnerable,
          targetId: s.targetId,
        })),
      };
      client.send(null, snap);
    },
    close() {
      closed = true;
      inMatch = false;
      stopHb();
      client.drop();
    },
  };
}
