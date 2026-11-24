// @lawn/mp wire protocol for Gnomelock (host-authoritative 2v2 MOBA with customizable players & teams).
import type { PlayerInfo } from '@lawn/mp';
import type { AbilitySlot, HeroId, Team } from '../sim/config';
import type { HeroActionInput, SlotSetup } from '../sim/world';

export type TeamMode = 'versus' | 'coop' | 'custom';

export interface MatchCustomConfig {
  mode: TeamMode;
  localSlotPref: number; // 0..3
  botHeroes: [HeroId, HeroId, HeroId, HeroId];
  botSkills: [number, number, number, number];
}

export interface ClientInputMsg {
  t: 'input';
  inp: HeroActionInput;
}

export interface ClientHeroPickMsg {
  t: 'pick';
  heroId: HeroId;
}

export interface ClientSlotMsg {
  t: 'slot';
  slot: number;
  heroId: HeroId;
}

export interface ClientBuyMsg {
  t: 'buy';
  itemId: string;
}

export interface HostLobbyStateMsg {
  t: 'lobby';
  mode: TeamMode;
  slots: {
    slot: number;
    playerId: number | null;
    name: string;
    heroId: HeroId;
    isBot: boolean;
    botSkill: number;
  }[];
  started: boolean;
}

export interface NetHeroSnap {
  slot: number;
  team: Team;
  heroId: HeroId;
  name: string;
  isBot: boolean;
  userId?: string;
  characterCode?: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  shield: number;
  alive: boolean;
  respawnTimer: number;
  acorns: number;
  totalAcorns: number;
  level: number;
  kills: number;
  deaths: number;
  lastHits: number;
  orbsConfirmed: number;
  orbsDenied: number;
  stamina: number;
  maxStamina: number;
  flowTier: 0 | 1 | 2 | 3;
  sliding: boolean;
  flipTimer: number;
  ammo: number;
  cooldowns: Record<AbilitySlot, number>;
  items: string[];
}

export interface NetCreepSnap {
  id: number;
  team: Team;
  kind: 'melee' | 'ranged' | 'super';
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
}

export interface NetOrbSnap {
  id: number;
  team: Team;
  x: number;
  y: number;
  z: number;
}

export interface NetStructureSnap {
  id: string;
  hp: number;
  invulnerable: boolean;
  targetId: string | null;
}

export interface WorldSnapshotMsg {
  t: 'snap';
  timeS: number;
  winner: Team | null;
  relicSpawned: boolean;
  relicAlive: boolean;
  relicHp: number;
  relicClaimedBy: Team | null;
  heroes: NetHeroSnap[];
  creeps: NetCreepSnap[];
  orbs: NetOrbSnap[];
  structures: NetStructureSnap[];
}

export type GameNetMsg =
  | ClientInputMsg
  | ClientHeroPickMsg
  | ClientSlotMsg
  | ClientBuyMsg
  | HostLobbyStateMsg
  | WorldSnapshotMsg;

export const DEFAULT_BOT_HEROES: readonly [HeroId, HeroId, HeroId, HeroId] = [
  'bramble',
  'tansy',
  'fernwick',
  'potsworth',
];

export interface BuildRosterOptions {
  mode?: TeamMode;
  picks?: ReadonlyMap<number, HeroId>;
  slotPrefs?: ReadonlyMap<number, number>;
  botHeroes?: readonly HeroId[];
  botSkills?: readonly number[];
  localHeroId?: HeroId;
  localId?: number;
}

/**
 * Builds the 4-slot 2v2 roster from online PlayerInfo[] + customizable bots, preserving PlayerInfo.userId
 * for gear sync (`docs/gear-sync.md`).
 * - 'versus' (1H+1B vs 1H+1B): fill order [0, 2, 1, 3]
 * - 'coop'   (2H vs 2B):       fill order [0, 1, 2, 3]
 * - 'custom':                  places each human at their slotPrefs[id] if available
 */
export function buildRosterSlots(
  players: readonly PlayerInfo[],
  opts: BuildRosterOptions = {},
): {
  slots: SlotSetup[];
  slotForPlayerId: Map<number, number>;
  botSkills: [number, number, number, number];
} {
  const mode = opts.mode ?? 'versus';
  const picks = opts.picks ?? new Map<number, HeroId>();
  const slotPrefs = opts.slotPrefs ?? new Map<number, number>();
  const botHeroes = opts.botHeroes ?? DEFAULT_BOT_HEROES;
  const rawSkills = opts.botSkills ?? [1, 1, 1, 1];
  const botSkills: [number, number, number, number] = [
    rawSkills[0] ?? 1,
    rawSkills[1] ?? 1,
    rawSkills[2] ?? 1,
    rawSkills[3] ?? 1,
  ];

  const assigned: (PlayerInfo | null)[] = [null, null, null, null];
  const slotForPlayerId = new Map<number, number>();

  if (mode === 'custom') {
    const unplaced: PlayerInfo[] = [];
    for (const p of players) {
      const pref = slotPrefs.get(p.id);
      if (pref !== undefined && pref >= 0 && pref < 4 && !assigned[pref]) {
        assigned[pref] = p;
        slotForPlayerId.set(p.id, pref);
      } else {
        unplaced.push(p);
      }
    }
    for (const p of unplaced) {
      const free = assigned.findIndex((x) => x === null);
      if (free >= 0) {
        assigned[free] = p;
        slotForPlayerId.set(p.id, free);
      }
    }
  } else {
    const order = mode === 'versus' ? [0, 2, 1, 3] : [0, 1, 2, 3];
    for (let i = 0; i < players.length && i < 4; i++) {
      const targetSlot = order[i];
      assigned[targetSlot] = players[i];
      slotForPlayerId.set(players[i].id, targetSlot);
    }
  }

  const slots: SlotSetup[] = [];
  for (let i = 0; i < 4; i++) {
    const p = assigned[i];
    if (p) {
      const heroId =
        p.id === opts.localId && opts.localHeroId
          ? opts.localHeroId
          : (picks.get(p.id) ?? botHeroes[i] ?? DEFAULT_BOT_HEROES[i]);
      slots.push({
        heroId,
        name: p.name,
        isBot: false,
        userId: p.userId,
        characterCode: p.character,
      });
    } else {
      const botHero = botHeroes[i] ?? DEFAULT_BOT_HEROES[i];
      slots.push({
        heroId: botHero,
        name: `${botHero.charAt(0).toUpperCase() + botHero.slice(1)} Bot`,
        isBot: true,
      });
    }
  }

  return { slots, slotForPlayerId, botSkills };
}
