// Puts the skyways into a built world (app.ts calls it once, right after buildWorld, before vehicles and gnomes are made):
// the colliders go into world.boxes, the meshes into the scene, and nothing that buildWorld planned is left inside an
// embankment or standing in a ramp's way (parked vehicles, pedestrian walk points).
// Kept out of buildWorld on purpose: the golden layout test snapshots buildWorld, and the skyways are not part of it.
import type * as THREE from 'three';
import type { World } from '../types';
import { skywayColliders } from './colliders';
import { deckContactsAt } from './deck';
import { buildSkywayMeshes } from './mesh';
import { addSkywayRoads } from './roads';
import { addMountainRoads } from '../mountainRoutes/graph';
import { buildSkywaySites } from './sites';
import { SKYWAY } from './skyways';

/** True when a ground spot at (x, z) is inside, under the low part of, or right beside a skyway (keep spawns off it). */
export function blockedBySkyway(x: number, z: number, margin = 3): boolean {
  for (const dx of [0, margin, -margin]) {
    for (const dz of [0, margin, -margin]) {
      for (const c of deckContactsAt(x + dx, z + dz)) {
        if (c.solid || c.surfaceY - c.land < SKYWAY.solidBelow + SKYWAY.bodyHeight) return true;
      }
    }
  }
  return false;
}

export function installSkyways(scene: THREE.Scene, world: World): void {
  world.boxes.push(...skywayColliders());
  // The road skyways join the road graph (deck nodes), before traffic, police and the GPS read it.
  addSkywayRoads(world.roads);
  // E33: the mountain roads (the Brim Gap Road, the Spine Cut) join it too, as ground nodes.
  addMountainRoads(world.roads);
  for (let i = world.parked.length - 1; i >= 0; i--) {
    const p = world.parked[i];
    if (blockedBySkyway(p.x, p.z)) world.parked.splice(i, 1);
  }
  for (let i = world.walkPoints.length - 1; i >= 0; i--) {
    const p = world.walkPoints[i];
    if (blockedBySkyway(p.x, p.z, 1.5)) world.walkPoints.splice(i, 1);
  }
  scene.add(buildSkywayMeshes());
  // Local 404's work sites: prefab dressing and its colliders.
  const sites = buildSkywaySites();
  world.boxes.push(...sites.boxes);
  scene.add(sites.group);
}
