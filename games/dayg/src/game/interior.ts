// Interior tracker: which building the player is in, which storey, what the camera and view cut away. Step 0 stub (roadmap 10, issue 1.3 fills it).
import type { Bus } from './bus';
import type { Vec3 } from '../world/collide';
import type { BuildingIndex } from '../world/spaces';

export interface InteriorState { building: string | null; storey: number; skip: ReadonlySet<string>; ceilY: number | null; door: string | null }
export interface InteriorTracker { readonly state: InteriorState; update(pos: Vec3, dt: number): void }

export function createInteriorTracker(deps: { index: BuildingIndex; bus: Bus }): InteriorTracker {
  const state: InteriorState = { building: null, storey: 0, skip: new Set<string>(), ceilY: null, door: null };
  return { state, update() {} };
}
