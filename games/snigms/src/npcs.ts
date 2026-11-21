// The neighbours walk the town: each goes to the spot its routine says for the time of day, idles there, and wanders a little.
// When the gnome is in town and a neighbour is near it, that neighbour runs about close by ("let them run around near us").
// Pure: no THREE. The view places a puppet at each neighbour's x and z.
import { PEOPLE, personById, spotAt, type PersonId } from './people';
import { townSpot } from './town';
import { findPath, isWalkable, type Tile } from './world';
import type { Lot } from './types';

export interface Neighbour {
  id: PersonId;
  /** Continuous position in tile units (tile (tx, ty) has its centre at tx + 0.5, ty + 0.5). */
  x: number;
  z: number;
  /** Yaw as the view uses it (0 faces +z). */
  facing: number;
  walking: boolean;
  running: boolean;
  path: Tile[];
  step: number;
  /** Counts down to the next wander target (or to the next run-around target while the gnome is near). */
  idle: number;
  /** Seconds left of a chat: the neighbour stands still. */
  pause: number;
  /** The spot id the routine says they should be at now. */
  spot: string;
}

export interface Neighbours {
  list(): Neighbour[];
  get(id: PersonId): Neighbour;
  /** The neighbour nearest (x, z) within radius tiles, or null. Paused neighbours count. */
  nearest(x: number, z: number, radius: number): Neighbour | null;
  /** The neighbour stands still for `seconds` (a chat). */
  pause(id: PersonId, seconds: number): void;
  /** Advance by dt real seconds. `gnome` is the gnome's tile position while it is in town, else null. */
  update(dt: number, lot: Lot, minuteOfDay: number, gnome: { x: number; z: number } | null): void;
}

const WALK_SPEED = 1.3; // tiles per real second
const RUN_SPEED = 3.4;
const NEAR_GNOME = 9; // tiles: within this, a neighbour runs about the gnome
const RUN_RADIUS = 3; // tiles around the gnome for a run-around target
const SPOT_RADIUS = 2; // tiles around the routine spot for an ordinary wander target

const tileOf = (x: number, z: number): Tile => ({ tx: Math.floor(x), ty: Math.floor(z) });

export function createNeighbours(lot: Lot, minuteOfDay: number, rng: () => number = Math.random): Neighbours {
  const list: Neighbour[] = PEOPLE.map((p) => {
    const spot = spotAt(p, minuteOfDay);
    const t = townSpot(spot);
    return { id: p.id, x: t.tx + 0.5, z: t.ty + 0.5, facing: 0, walking: false, running: false, path: [], step: 0, idle: rng() * 2, pause: 0, spot };
  });

  /** A path from `from` to a random walkable tile within `radius` of `centre`, or null if none. */
  function randomPath(l: Lot, from: Tile, centre: Tile, radius: number): Tile[] | null {
    for (let i = 0; i < 10; i++) {
      const t = { tx: centre.tx + Math.round((rng() * 2 - 1) * radius), ty: centre.ty + Math.round((rng() * 2 - 1) * radius) };
      if (!isWalkable(l, t.tx, t.ty)) continue;
      const p = findPath(l, from, t);
      if (p) return p;
    }
    return null;
  }

  function walk(n: Neighbour, dt: number): void {
    let budget = (n.running ? RUN_SPEED : WALK_SPEED) * dt;
    while (budget > 0 && n.step < n.path.length) {
      const t = n.path[n.step];
      const tx = t.tx + 0.5;
      const tz = t.ty + 0.5;
      const dx = tx - n.x;
      const dz = tz - n.z;
      const d = Math.hypot(dx, dz);
      if (d > 1e-6) n.facing = Math.atan2(dx, dz);
      if (d <= budget) {
        n.x = tx;
        n.z = tz;
        budget -= d;
        n.step++;
      } else {
        n.x += (dx / d) * budget;
        n.z += (dz / d) * budget;
        budget = 0;
      }
    }
    if (n.step >= n.path.length) {
      n.walking = false;
      n.running = false;
      n.path = [];
    }
  }

  return {
    list: () => list,
    get(id: PersonId): Neighbour {
      const n = list.find((x) => x.id === id);
      if (!n) throw new Error(`No neighbour "${id}"`);
      return n;
    },
    nearest(x: number, z: number, radius: number): Neighbour | null {
      let best: Neighbour | null = null;
      let bestD = radius;
      for (const n of list) {
        const d = Math.hypot(n.x - x, n.z - z);
        if (d <= bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    },
    pause(id: PersonId, seconds: number): void {
      const n = list.find((x) => x.id === id);
      if (!n) return;
      n.pause = seconds;
      n.walking = false;
      n.running = false;
      n.path = [];
    },
    update(dt: number, l: Lot, minuteOfDay: number, gnome: { x: number; z: number } | null): void {
      for (const n of list) {
        if (n.pause > 0) {
          n.pause -= dt;
          continue;
        }
        const spot = spotAt(personById(n.id), minuteOfDay);
        if (spot !== n.spot) {
          n.spot = spot;
          n.idle = 0; // the routine moved them on: pick a target at the new spot now
          n.walking = false;
        }
        const near = gnome !== null && Math.hypot(gnome.x - n.x, gnome.z - n.z) < NEAR_GNOME;
        n.idle -= dt;
        if (n.idle <= 0 && (!n.walking || near)) {
          const from = tileOf(n.x, n.z);
          const path = near && gnome ? randomPath(l, from, tileOf(gnome.x, gnome.z), RUN_RADIUS) : randomPath(l, from, townSpot(n.spot), SPOT_RADIUS);
          n.running = near;
          n.idle = near ? 1 + rng() * 1.5 : 2 + rng() * 3;
          if (path && path.length > 1) {
            n.path = path;
            n.step = 1;
            n.walking = true;
          }
        }
        if (n.walking) walk(n, dt);
      }
    },
  };
}
