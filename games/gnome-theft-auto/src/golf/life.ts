// Hedgeworth's life (STUB: issue A8 fills it in): vignettes, signs, Peony, Basil and Thrift at their places, members,
// sprinklers and ambient sound.
import type * as THREE from 'three';
import type { Box } from '../types';

export interface HedgeworthLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player. */
  update(dt: number, t: number, px: number, pz: number): void;
}

export function buildHedgeworthLife(_scene: THREE.Scene): HedgeworthLife {
  return { boxes: [], update() {} };
}
