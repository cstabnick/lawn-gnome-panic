// Capwood, the toadstool forest (E14, site `toadstool-forest`): giant toadstools, glowing caps at night, spores,
// fairy rings, Warden Chanterelle Stook's stalk hut, signs, story vignettes and the forest's sounds.
import type * as THREE from 'three';
import type { World } from '../types';
import { EMPTY_AREA, type Area, type AreaDeps } from '../dirtCountry/types';

export function createCapwoodForest(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  void scene; void world; void deps;
  return EMPTY_AREA;
}
