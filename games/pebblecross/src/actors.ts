import type * as THREE from 'three';
import { createGnomeModel, toModelLook, type Look } from '@lawn/gnome';
import type { PlaceId, Resident } from './config';
import { PLAYER_SPEED, RESIDENT_SPEED } from './config';
import { activityAt } from './schedule';
import type { Nav, Pt } from './nav';
import type { Town } from './town';

/** Within this many metres of a waypoint, the walker counts it as reached. */
const REACH = 0.05;

/** The look a player gets when they have no custom gnome (same colours as the gnome package's default). */
export const DEFAULT_PLAYER_LOOK: Look = {
  hatRgb: 0xd93636,
  coatRgb: 0x2f64c9,
  pantsRgb: 0x6b4a2e,
  bootsRgb: 0x222222,
  skinRgb: 0xf1c27d,
  beardRgb: 0xf4f4f4,
  freckles: false,
  dress: false,
  glasses: false,
};

export class Walker {
  readonly object: THREE.Object3D;
  private readonly town: Town;
  private readonly speed: number;
  private x: number;
  private z: number;
  private path: Pt[] = [];

  constructor(object: THREE.Object3D, town: Town, start: Pt, speed: number) {
    this.object = object;
    this.town = town;
    this.speed = speed;
    this.x = start.x;
    this.z = start.z;
    this.placeObject();
  }

  get pos(): Pt {
    return { x: this.x, z: this.z };
  }

  get moving(): boolean {
    return this.path.length > 0;
  }

  setPath(points: Pt[]): void {
    this.path = points.slice();
  }

  stop(): void {
    this.path = [];
  }

  update(dt: number): void {
    // Drop waypoints that are already reached (or were given as the current spot).
    while (this.path.length > 0 && distance(this.pos, this.path[0]) <= REACH) {
      this.path.shift();
    }
    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dz = target.z - this.z;
      const dist = Math.hypot(dx, dz);
      const step = Math.min(this.speed * dt, dist);
      this.x += (dx / dist) * step;
      this.z += (dz / dist) * step;
      this.object.rotation.y = Math.atan2(dx, dz);
      if (distance(this.pos, target) <= REACH) this.path.shift();
    }
    this.placeObject();
  }

  private placeObject(): void {
    this.object.position.x = this.x;
    this.object.position.z = this.z;
    this.object.position.y = this.town.heightAt(this.x, this.z);
  }
}

function distance(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export interface ResidentActor { resident: Resident; walker: Walker; place: PlaceId | null; doing: string; asleep: boolean }

export function createResidentActor(scene: THREE.Scene, town: Town, resident: Resident, total: number): ResidentActor {
  const model = createGnomeModel(toModelLook(resident.look));
  scene.add(model.object);
  const act = activityAt(resident, total);
  const spot = town.places[act.at] ?? town.places[resident.home] ?? town.spawn;
  const walker = new Walker(model.object, town, { x: spot.x, z: spot.z }, RESIDENT_SPEED);
  model.object.visible = !act.asleep;
  return { resident, walker, place: act.at, doing: act.doing, asleep: act.asleep };
}

const PLACE_TRIES = 12;

export function updateResidentActors(actors: ResidentActor[], town: Town, nav: Nav, total: number, random: () => number): void {
  for (const actor of actors) {
    const act = activityAt(actor.resident, total);
    actor.doing = act.doing;
    actor.asleep = act.asleep;
    const object = actor.walker.object;

    if (act.asleep) {
      // Hidden and still at home. Forgetting the place makes the actor walk out again on waking.
      object.visible = false;
      actor.walker.stop();
      actor.place = null;
      continue;
    }
    object.visible = true;
    if (act.at === actor.place) continue;

    const place = town.places[act.at];
    if (!place) continue;
    const target = pickFreeSpot(place.x, place.z, place.r, nav, random);
    const path = nav.findPath(actor.walker.pos, target);
    if (path === null) {
      // Unreachable for now: stay put, keep the old place so the next call retries.
      actor.walker.stop();
      continue;
    }
    actor.place = act.at;
    actor.walker.setPath(path);
  }
}

/** A random free point within r of (cx, cz); the centre if none of the tries is free. */
function pickFreeSpot(cx: number, cz: number, r: number, nav: Nav, random: () => number): Pt {
  for (let i = 0; i < PLACE_TRIES; i++) {
    const angle = random() * Math.PI * 2;
    const dist = r * Math.sqrt(random());
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;
    if (nav.isFree(x, z)) return { x, z };
  }
  return { x: cx, z: cz };
}

export function createPlayerWalker(scene: THREE.Scene, town: Town, look: Look | null): Walker {
  const model = createGnomeModel(toModelLook(look ?? DEFAULT_PLAYER_LOOK));
  scene.add(model.object);
  return new Walker(model.object, town, { x: town.spawn.x, z: town.spawn.z }, PLAYER_SPEED);
}
