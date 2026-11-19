// The four biomes around Turfton (desert, forest, tundra, farmland), Fort Sandpit and the airfield: STUB (issue 1I).
// world.ts owns the ground meshes, the city and the highways; this module builds what stands on the biome ground.
import type * as THREE from 'three';
import type { Box, ParkedSpot } from './types';

export interface BiomeBuild {
  /** Static colliders of everything built here (tree trunks, rocks, fort walls, hangars, cabins...). */
  boxes: Box[];
  /** Places pedestrians wander between (villages, the fort yard, farm yards). Never inside a box. */
  walkPoints: { x: number; z: number }[];
  /** Empty mowers to steal, kerb-side or yard-side in the biomes (not the planes: those are AIRFIELD.planeSpots). */
  parked: ParkedSpot[];
  /** Animate scenery (banners, windsock). Called every frame by world.update. */
  update(dt: number): void;
}

/** `rnd` is a seeded 0..1 generator: the same world every run. */
export function buildBiomes(_scene: THREE.Scene, _rnd: () => number): BiomeBuild {
  return { boxes: [], walkPoints: [], parked: [], update() {} };
}
