// @lawn/mp network session wrapper for Gnomelock with customizable 2v2 teams & slots.
import { createNetClient, serverUrl, type NetClient, type PlayerInfo } from '@lawn/mp';
import { getMyGnome } from '@lawn/gnome';
import type { HeroId } from '../sim/config';
import type { HeroActionInput, MatchState } from '../sim/world';
import {
  buildRosterSlots,
  type GameNetMsg,
  type HostLobbyStateMsg,
  type MatchCustomConfig,
  type WorldSnapshotMsg,
} from './protocol';

export interface OnlineSession {
  client: NetClient<GameNetMsg>;
  isHost: () => boolean;
  myId: () => number;
  roster: () => PlayerInfo[];
  picks: Map<number, HeroId>;
  slotPrefs: Map<number, number>;
  slotForPlayerId: () => Map<number, number>;
  sendInput: (inp: HeroActionInput) => void;
  sendBuy: (itemId: string) => void;
  sendPick: (heroId: HeroId) => void;
  sendSlotPref: (slot: number, heroId: HeroId) => void;
  sendLobbyState: (msg: HostLobbyStateMsg) => void;
  broadcastSnapshot: (state: MatchState) => void;
  close: () => void;
}

export function startOnlineSession(
  roomCode: string | null,
  localHeroId: HeroId,
  customConfig: MatchCustomConfig,
  mpOverride: string | undefined,
  callbacks: {
    onStatus: (msg: string) => void;
    onMatchReady: (isHost: boolean, players: PlayerInfo[]) => void;
    onRosterChanged: (players: PlayerInfo[]) => void;
    onHostTakeover: () => void;
    onGuestInput: (playerId: number, inp: HeroActionInput) => void;
    onGuestBuy: (playerId: number, itemId: string) => void;
    onSlotPref?: (playerId: number, slot: number, heroId: HeroId) => void;
    onLobbyState?: (msg: HostLobbyStateMsg) => void;
    onSnapshot: (snap: WorldSnapshotMsg) => void;
    onError: (msg: string) => void;
  },
): OnlineSession {
  const mine = getMyGnome();
  const url = mpOverride || serverUrl();
  const picks = new Map<number, HeroId>();
  const slotPrefs = new Map<number, number>();
  let roster: PlayerInfo[] = [];
  let slotMap = new Map<number, number>();
  let hostFlag = false;
  let myId = -1;
  const charCode = mine?.code ?? 'gnorman';
  const myName = mine?.name ?? 'Gnome';

  const client = createNetClient<GameNetMsg>(url, 'gnomelock', {
    name: myName,
    character: charCode,
    resumable: true,
  });

  function recomputeMap(): void {
    const built = buildRosterSlots(roster, {
      mode: customConfig.mode,
      picks,
      slotPrefs,
      botHeroes: customConfig.botHeroes,
      botSkills: customConfig.botSkills,
      localHeroId,
      localId: myId,
    });
    slotMap = built.slotForPlayerId;
  }

  client.onMessage((m) => {
    if (m.t === 'queued') {
      callbacks.onStatus(`Queued (${m.players} in queue)...`);
    } else if (m.t === 'match') {
      myId = m.you;
      hostFlag = m.hostId === myId;
      roster = [...m.players];
      slotPrefs.set(myId, customConfig.localSlotPref);
      recomputeMap();
      client.send(null, { t: 'slot', slot: customConfig.localSlotPref, heroId: localHeroId });
      callbacks.onMatchReady(hostFlag, roster);
    } else if (m.t === 'joined') {
      roster.push(m.player);
      recomputeMap();
      callbacks.onRosterChanged(roster);
    } else if (m.t === 'left') {
      roster = roster.filter((p) => p.id !== m.id);
      recomputeMap();
      callbacks.onRosterChanged(roster);
    } else if (m.t === 'host') {
      hostFlag = m.hostId === myId;
      if (hostFlag) callbacks.onHostTakeover();
    } else if (m.t === 'relay') {
      const msg = m.d;
      if (msg.t === 'pick') {
        picks.set(m.from, msg.heroId);
      } else if (msg.t === 'slot') {
        picks.set(m.from, msg.heroId);
        slotPrefs.set(m.from, msg.slot);
        recomputeMap();
        callbacks.onSlotPref?.(m.from, msg.slot, msg.heroId);
      } else if (msg.t === 'lobby') {
        callbacks.onLobbyState?.(msg);
      } else if (msg.t === 'input') {
        callbacks.onGuestInput(m.from, msg.inp);
      } else if (msg.t === 'buy') {
        callbacks.onGuestBuy(m.from, msg.itemId);
      } else if (msg.t === 'snap') {
        callbacks.onSnapshot(msg);
      }
    } else if (m.t === 'error') {
      callbacks.onError(m.message || 'Connection error');
    }
  });

  client.onClose(() => {
    callbacks.onStatus('Disconnected from relay');
  });

  callbacks.onStatus('Connecting to Bramble relay...');
  void client.connect().then(() => {
    client.queue(roomCode, charCode, myName);
  }).catch(() => {
    callbacks.onError('Could not connect to relay');
  });

  return {
    client,
    isHost: () => hostFlag,
    myId: () => myId,
    roster: () => roster,
    picks,
    slotPrefs,
    slotForPlayerId: () => slotMap,
    sendInput(inp) {
      client.send(null, { t: 'input', inp });
    },
    sendBuy(itemId) {
      client.send(null, { t: 'buy', itemId });
    },
    sendPick(heroId) {
      client.send(null, { t: 'pick', heroId });
    },
    sendSlotPref(slot, heroId) {
      client.send(null, { t: 'slot', slot, heroId });
    },
    sendLobbyState(msg) {
      client.send(null, msg);
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
      client.drop();
    },
  };
}
