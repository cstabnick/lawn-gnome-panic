// @lawn/mp wire protocol for Gnomelock (host-authoritative 2v2 MOBA).
import type { PlayerInfo } from '@lawn/mp';
import type { AbilitySlot, HeroId, Team } from '../sim/config';
import type { HeroActionInput, SlotSetup } from '../sim/world';

export interface ClientInputMsg {
  t: 'input';
  inp: HeroActionInput;
}

export interface ClientHeroPickMsg {
  t: 'pick';
  heroId: HeroId;
}

export interface ClientBuyMsg {
  t: 'buy';
  itemId: string;
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

export type GameNetMsg = ClientInputMsg | ClientHeroPickMsg | ClientBuyMsg | WorldSnapshotMsg;

const DEFAULT_BOTS: readonly { heroId: HeroId; name: string }[] = [
  { heroId: 'bramble', name: 'Bramble Bot' },
  { heroId: 'tansy', name: 'Tansy Bot' },
  { heroId: 'fernwick', name: 'Fernwick Bot' },
  { heroId: 'potsworth', name: 'Potsworth Bot' },
];

/**
 * Builds the 4-slot 2v2 roster from online PlayerInfo[] + bots, preserving PlayerInfo.userId
 * for gear sync (`docs/gear-sync.md`).
 */
export function buildRosterSlots(
  players: readonly PlayerInfo[],
  picks: ReadonlyMap<number, HeroId>,
  localHeroId: HeroId,
  localId?: number,
): { slots: SlotSetup[]; slotForPlayerId: Map<number, number> } {
  const slots: SlotSetup[] = [];
  const slotForPlayerId = new Map<number, number>();

  for (let i = 0; i < 4; i++) {
    const p = players[i];
    if (p) {
      const heroId = p.id === localId ? localHeroId : (picks.get(p.id) ?? DEFAULT_BOTS[i].heroId);
      slots.push({
        heroId,
        name: p.name,
        isBot: false,
        userId: p.userId,
        characterCode: p.character,
      });
      slotForPlayerId.set(p.id, i);
    } else {
      const fallback = DEFAULT_BOTS[i];
      slots.push({
        heroId: fallback.heroId === localHeroId && i === 1 ? 'fernwick' : fallback.heroId,
        name: fallback.name,
        isBot: true,
      });
    }
  }
  return { slots, slotForPlayerId };
}
