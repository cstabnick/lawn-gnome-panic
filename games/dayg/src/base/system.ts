// Base system: owns the base state, claims, pieces, damage, work. STUB (roadmap 9 step 0): everything is a no-op; issue 2.1 replaces it.
import type { WorldState } from '../sim/types';
import type { Bus } from '../game/bus';
import type { CampSystem, HatlessSystem, PlayerState, Vec3 } from '../game/types';
import type { Collider } from '../world/collide';
import type { Aim, BaseState, Cost, DamageCause, PieceKind, PieceState, PlotDef } from './types';

export interface BaseDeps { seed: number; world: WorldState; collider: Collider; bus: Bus; hatless: HatlessSystem; camp: CampSystem; getPlayer: () => PlayerState }
export interface BaseSystem {
  state(): BaseState | null;
  claim(plot: PlotDef): boolean;
  abandon(): void;
  place(kind: PieceKind, aim: Aim): PieceState | null;
  damage(id: string, amount: number, cause: DamageCause): void;
  repair(id: string): void;
  reinforce(id: string): void;
  dismantle(id: string): Cost[];
  setDoor(id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean;
  setLadderUp(id: string, up: boolean): void;
  touch(): void;                                   // contents changed (chest): save and notify
  strike(origin: Vec3, facing: number, reach: number, damage: number): boolean;
  sealedAt(pos: Vec3): boolean;
  startWork(label: string, seconds: number, done: () => void): boolean;
  busy(): { label: string; progress: number } | null;
  cancelWork(): void;
  update(dt: number, sunHours: number): void;
  onChange(fn: () => void): () => void;
}

export function createBaseSystem(deps: BaseDeps): BaseSystem {
  void deps;
  return {
    state: () => null,
    claim: () => false,
    abandon: () => {},
    place: () => null,
    damage: () => {},
    repair: () => {},
    reinforce: () => {},
    dismantle: () => [],
    setDoor: () => false,
    setLadderUp: () => {},
    touch: () => {},
    strike: () => false,
    sealedAt: () => false,
    startWork: () => false,
    busy: () => null,
    cancelWork: () => {},
    update: () => {},
    onChange: () => () => {},
  };
}
