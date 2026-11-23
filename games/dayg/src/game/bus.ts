// The game's event bus: every system talks through these events.
import type { BoardId, CropId, DistrictId, DeathCause, FactionId, HavenId, ItemId, ItemStack, NpcId, QuestId, QuestTemplate, Rank, RegionId, SkillId, TalkVerb } from '../sim/types';
import type { NetStatus } from './types';
import type { ClimbRouteDef } from '../world/types';
import type { DamageCause, PieceKind } from '../base/types';
import type { BodyPart, ClimbVia, CrackLevel, InfectionStage, RecipeId } from './types';

export interface GameEvents {
  'noise': { x: number; z: number; radius: number; source: 'step' | 'attack' | 'fire' | 'climb' | 'other' };
  'player-hit': { strength: number; from: { x: number; z: number } };  // a Hatless scratch; strength 0..1
  'fell': { height: number };                                          // landed after falling more than 2 gm
  'climbed': { height: number; via: ClimbVia };                        // reached a top more than 1.6 gm above the start
  'route-placed': { route: ClimbRouteDef; fromY: number; topY: number };
  'hint': { text: string };
  'container-opened': { containerId: string; region: RegionId | null; items: ItemStack[] };
  'item-taken': { stack: ItemStack };
  'ate': { def: ItemId }; 'drank': { clean: boolean; litres: number };
  'recipe-done': { recipe: RecipeId; ok: boolean };
  'campfire-lit': { x: number; z: number };
  'infection': { stage: InfectionStage | 'turned'; part: BodyPart };
  'infection-cured': { stage: InfectionStage };
  'cracked': { part: BodyPart; level: CrackLevel; cause: 'hit' | 'fall' | 'cold' | 'scrape' };
  'hatless-destroyed': { region: RegionId | null };
  'dusk': { day: number }; 'dawn': { day: number };
  'entered-region': { region: RegionId };
  'haven': { inside: boolean; haven: HavenId };
  'slept': { hours: number };
  'player-shattered': { cause: DeathCause };
  'sim-tick': { tick: number };
  'base-claimed': { region: RegionId; x: number; z: number };
  'base-abandoned': { region: RegionId };
  'piece-placed': { id: string; kind: PieceKind };
  'piece-damaged': { id: string; kind: PieceKind; hp: number; maxHp: number; cause: DamageCause };
  'piece-broken': { id: string; kind: PieceKind; cause: DamageCause };
  'piece-repaired': { id: string; kind: PieceKind };
  'base-slept': { hours: number; sealed: boolean; locked: boolean };
  'entered-building': { building: string; region: RegionId; door: string | null };  // walked in (never on the first frame)
  'left-building': { building: string };
  'talked': { npc: NpcId; verb: TalkVerb; ok: boolean };
  'quest-taken': { quest: QuestId }; 'quest-done': { quest: QuestId; template: QuestTemplate }; 'quest-failed': { quest: QuestId };
  'joined-faction': { faction: FactionId }; 'rank-changed': { faction: FactionId; rank: Rank };
  'board-opened': { board: BoardId };
  'world-loaded': { tick: number };                       // SimHost.load replaced the world (systems re-read it)
  'net-status': { status: NetStatus }; 'host-changed': { me: boolean }; 'desync': { tick: number };
  'respawned': { at: HavenId; taught: boolean };
  'skill-up': { skill: SkillId; level: number };
  'piece-built': { kind: PieceKind; id: number }; 'harvested': { crop: CropId; food: number }; 'trap-sprung': { kind: PieceKind };
  'lantern-lit': { id: string; lit: number }; 'bell-rung': { survived: boolean };
  'mowing': { district: DistrictId; here: boolean };
}
export interface Bus { on<K extends keyof GameEvents>(k: K, fn: (e: GameEvents[K]) => void): () => void; emit<K extends keyof GameEvents>(k: K, e: GameEvents[K]): void }

export function createBus(): Bus {
  const handlers = new Map<keyof GameEvents, Set<(e: never) => void>>();
  return {
    on(k, fn) {
      let set = handlers.get(k);
      if (!set) { set = new Set(); handlers.set(k, set); }
      set.add(fn as (e: never) => void);
      return () => { set.delete(fn as (e: never) => void); };
    },
    emit(k, e) {
      const set = handlers.get(k);
      if (!set) return;
      for (const fn of [...set]) (fn as (e: GameEvents[typeof k]) => void)(e);
    },
  };
}
