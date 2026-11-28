// E31 living world: everything static it adds to the world, in one call from world.ts (after the coast). Each builder
// owns its own file; see docs/roadmaps/gta-batch-3/E31/. All of it is static scenery batched per cell (cull.ts), with
// colliders pushed into `boxes`.
import type * as THREE from 'three';
import type { Box } from '../types';
import { buildRangerStation } from '../unmown/station';
import { buildReedmere } from '../unmown/marsh';
import { buildUnmownHides } from '../unmown/hides';
import { buildUnmownTrails } from '../unmown/trails';
import { buildUnmownVignettes } from '../unmown/vignettes';
import { buildEspalierEnd } from './hamletEspalier';
import { buildMittenholt } from './hamletMittenholt';
import { buildDunelow } from './hamletDunelow';
import { buildHighTarn } from './highTarn';
import { buildRoadside } from './roadside';

export function buildLivingWorld(scene: THREE.Scene, boxes: Box[]): void {
  // The Unmown preserve.
  buildRangerStation(scene, boxes);
  buildReedmere(scene, boxes);
  buildUnmownHides(scene, boxes);
  buildUnmownTrails(scene, boxes);
  buildUnmownVignettes(scene, boxes);
  // Pushing the bands out: hamlets, the High Tarn, roadside life.
  buildEspalierEnd(scene, boxes);
  buildMittenholt(scene, boxes);
  buildDunelow(scene, boxes);
  buildHighTarn(scene, boxes);
  buildRoadside(scene, boxes);
}
