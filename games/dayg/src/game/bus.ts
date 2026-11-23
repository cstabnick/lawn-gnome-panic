// The game's event bus: every system talks through these events.
import type { DeathCause, HavenId, ItemId, ItemStack, RegionId } from '../sim/types';
import type { ClimbRouteDef } from '../world/types';
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
