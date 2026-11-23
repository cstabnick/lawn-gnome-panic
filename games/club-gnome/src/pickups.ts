// Acorns lying around outdoors: walk over one to pick it up (+PICKUPS.acorns into the Oakcount). STUB: issue 2J.
import type { MapDef } from './config';
import type { World } from './world';

export interface Pickups {
  /** Places this map's pickups (outdoor maps only; none indoors). Call after world.load(map). */
  load(map: MapDef): void;
  /** Spins the acorns and collects any within PICKUPS.radius of my gnome at (x, z). */
  update(dt: number, x: number, z: number): void;
}

export function createPickups(world: World, onPicked: (acorns: number) => void): Pickups {
  void world;
  void onPicked;
  return { load() {}, update() {} };
}
