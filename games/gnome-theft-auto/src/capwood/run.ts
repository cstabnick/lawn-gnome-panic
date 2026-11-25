// The Capwood Run's dressing (E14, site `rally-route`): the road surface, start paddock and pavilion, finish arch,
// stage flags, the Cap-water ford pools and their signs, story vignettes and the rally marshal. Route geometry:
// raceTrack/defs/capwoodRun.ts.
import type * as THREE from 'three';
import type { World } from '../types';
import { EMPTY_AREA, type Area, type AreaDeps } from '../dirtCountry/types';

export function createCapwoodRunDressing(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  void scene; void world; void deps;
  return EMPTY_AREA;
}
