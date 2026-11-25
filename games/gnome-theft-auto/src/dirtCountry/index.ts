// E14 dirt country, composed for app.ts: the Rutbottom Dirt Bowl, Capwood and the Capwood Run's dressing.
import type * as THREE from 'three';
import type { World } from '../types';
import { createCapwoodForest } from '../capwood/forest';
import { createCapwoodRunDressing } from '../capwood/run';
import { createRutbottom } from '../rutbottom';
import type { Area, AreaDeps } from './types';

export function createDirtCountry(scene: THREE.Scene, world: World, deps: AreaDeps): Area {
  const areas: Area[] = [
    createRutbottom(scene, world, deps),
    createCapwoodForest(scene, world, deps),
    createCapwoodRunDressing(scene, world, deps),
  ];
  return {
    update(dt, px, pz, night) {
      for (const a of areas) a.update(dt, px, pz, night);
    },
    blips: () => areas.flatMap((a) => a.blips()),
  };
}
