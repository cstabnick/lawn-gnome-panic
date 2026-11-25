// The neighbour's yard round Hedgeworth Links (STUB: issue A6 fills it in): the board fence with the Kicked Board and
// the Members' Gate, hedge walls and arches, tall grass (mowable) and giant plants (soft, drive-through).
import type * as THREE from 'three';
import type { Box } from '../types';

export interface YardScenery {
  /** Every collider except the Kicked Board's (fence, gate, hedges). */
  boxes: Box[];
  /** The Kicked Board's collider while it stands; the runtime splices it out of world.boxes when it breaks. */
  boardBox: Box;
  /** Show the board broken (planks on the ground, the gap). Idempotent. */
  breakBoard(): void;
  /** Giant plants you can drive through (no collider): the runtime slows and rustles inside them. */
  soft: readonly { x: number; z: number; r: number }[];
  update(dt: number, t: number): void;
}

export function buildYard(_scene: THREE.Scene, _opts: { boardBroken: boolean }): YardScenery {
  return { boxes: [], boardBox: { minX: -1001.8, maxX: -1000.2, minZ: 637.4, maxZ: 642.6, h: 1 }, breakBoard() {}, soft: [], update() {} };
}
