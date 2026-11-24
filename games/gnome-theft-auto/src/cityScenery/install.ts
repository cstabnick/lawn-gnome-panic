// Parks, street scenery and the fringe (docs/roadmaps/gta-parks-and-fringe.md), put into a built world. app.ts calls
// installCityDressing once, after every system that adds colliders (so this keeps clear of all of them), before the
// first frame. Kept out of buildWorld on purpose: the golden layout test snapshots buildWorld only.
import type * as THREE from 'three';
import type { World } from '../types';
import { insideBox } from '../collide';
import { createSite, type Site } from './site';
import { buildDressPlan } from './build';
import { planStreet } from './street';
import { planMarks } from './marks';
import type { DressPlan } from './types';
import { planParks } from '../parks/layouts';
import { createParkLife, type ParkLife } from '../parks/life';
import { planFringe } from '../fringe/plan';

export interface CityDressingPlan { site: Site; parks: DressPlan; street: DressPlan; fringe: DressPlan }

/** Plans everything (pure apart from measuring prefabs): parks first, then the street, then the fringe. */
export function planCityDressing(world: World): CityDressingPlan {
  const site = createSite(world);
  const parks = planParks(site);
  const street = planStreet(site);
  planMarks(site, street);
  const fringe = planFringe(site);
  return { site, parks, street, fringe };
}

export interface CityDressing { update(dt: number, px: number, pz: number): void }

export function installCityDressing(scene: THREE.Scene, world: World): CityDressing {
  const { site, parks, street, fringe } = planCityDressing(world);
  buildDressPlan(scene, parks, 'parks');
  buildDressPlan(scene, street, 'street');
  buildDressPlan(scene, fringe, 'fringe');
  world.boxes.push(...site.colliders);
  // Walk points now inside a new collider go; the park paths' walk points come in.
  for (let i = world.walkPoints.length - 1; i >= 0; i--) {
    const p = world.walkPoints[i];
    if (insideBox(p.x, 0.5, p.z, site.colliders)) world.walkPoints.splice(i, 1);
  }
  for (const p of [...parks.walk, ...street.walk, ...fringe.walk]) {
    if (!insideBox(p.x, 0.5, p.z, world.boxes)) world.walkPoints.push(p);
  }
  const life: ParkLife = createParkLife(scene, parks);
  return { update: (dt, px, pz) => life.update(dt, px, pz) };
}
