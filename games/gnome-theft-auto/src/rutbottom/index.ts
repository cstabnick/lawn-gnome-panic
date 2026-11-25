// The Rutbottom Dirt Bowl in the running game (E14): track surface, barriers, starter's tower, pits, signs, story
// vignettes, Marshal Clary Mudguard and the bowl's sounds. Track geometry: raceTrack/defs/rutbottom.ts.
import type * as THREE from 'three';
import type { World } from '../types';
import { EMPTY_AREA, type Area, type AreaDeps } from '../dirtCountry/types';

export function createRutbottom(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  void scene; void world; void deps;
  return EMPTY_AREA;
}
