// E33 mountain routes, composed for app.ts: the route surfaces and guard rails, then each area module (dressing, life,
// progress). Each area module builds its scenery once and returns an Area the app updates every frame.
// Contract: docs/roadmaps/gta-batch-3/E33/contracts.md.
import type * as THREE from 'three';
import type { World } from '../types';
import { createBrimGapDressing } from './brimGap';
import type { Area, MountainDeps } from './deps';
import { createHatbrimDressing } from './hatbrim';
import { createMountainLife } from './life';
import { createRouteProgress } from './progress';
import { buildGuardRails } from './rails';
import { createSpineCutDressing } from './spine';
import { buildRouteSurfaces } from './surface';

export function createMountainRoutes(scene: THREE.Scene, world: World, deps: MountainDeps): Area {
  buildRouteSurfaces(scene);
  buildGuardRails(scene, world.boxes);
  const areas: Area[] = [
    createBrimGapDressing(scene, world, deps),
    createHatbrimDressing(scene, world, deps),
    createSpineCutDressing(scene, world, deps),
    createMountainLife(scene, world, deps),
    createRouteProgress(scene, world, deps),
  ];
  return {
    update(dt, px, pz, night) {
      for (const a of areas) a.update(dt, px, pz, night);
    },
    blips: () => areas.flatMap((a) => a.blips()),
  };
}
