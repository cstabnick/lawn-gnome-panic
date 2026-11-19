// Pure walking rules: click-to-walk toward a target, sliding along buildings and blockers, clamped to the map.
// No three.js, no DOM.
import { WALK, type MapDef, type PortalDef, type Rect, type SpotDef } from './config';

export interface Walker {
  x: number;
  z: number;
  /** Yaw in radians, 0 = facing +z. */
  facing: number;
  target: { x: number; z: number } | null;
  moving: boolean;
  /** Seconds spent making almost no progress toward the current target (reset when the target clears). */
  stuck?: number;
}

export function newWalker(x: number, z: number): Walker {
  return { x, z, facing: 0, target: null, moving: false };
}

/** Every rectangle that blocks walking on this map: its buildings and its blockers. */
export function obstacles(map: MapDef): Rect[] {
  return [...map.buildings, ...map.blockers];
}

/** True when a gnome (radius WALK.radius) standing at (x, z) overlaps an obstacle or leaves the map. */
export function isBlocked(map: MapDef, x: number, z: number): boolean {
  const lx = map.w / 2 - WALK.edge;
  const lz = map.d / 2 - WALK.edge;
  if (Math.abs(x) > lx || Math.abs(z) > lz) return true;
  const rad = WALK.radius;
  for (const r of obstacles(map)) {
    if (Math.abs(x - r.x) < r.w / 2 + rad && Math.abs(z - r.z) < r.d / 2 + rad) return true;
  }
  return false;
}

/** Wraps an angle into [-PI, PI]. */
function wrapAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  else if (r < -Math.PI) r += Math.PI * 2;
  return r;
}

/** Moves w toward w.target for dt seconds. Returns true on the step it stopped (arrived, or blocked). */
export function stepWalker(w: Walker, dt: number, map: MapDef): boolean {
  const t = w.target;
  if (!t) {
    w.moving = false;
    return false;
  }

  const dx = t.x - w.x;
  const dz = t.z - w.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= WALK.arrive) {
    w.x = t.x;
    w.z = t.z;
    w.target = null;
    w.moving = false;
    w.stuck = 0;
    return true;
  }

  w.moving = true;
  const step = Math.min(dist, WALK.speed * dt);
  const ux = dx / dist;
  const uz = dz / dist;
  const fullX = w.x + ux * step;
  const fullZ = w.z + uz * step;

  // Full move first, then the x part only, then the z part only (slides along walls).
  let nx: number | null = null;
  let nz: number | null = null;
  if (!isBlocked(map, fullX, fullZ)) {
    nx = fullX;
    nz = fullZ;
  } else if (!isBlocked(map, fullX, w.z)) {
    nx = fullX;
    nz = w.z;
  } else if (!isBlocked(map, w.x, fullZ)) {
    nx = w.x;
    nz = fullZ;
  }

  if (nx === null || nz === null) {
    // Nowhere free to go this step: give up on the target.
    w.target = null;
    w.moving = false;
    w.stuck = 0;
    return true;
  }

  const mx = nx - w.x;
  const mz = nz - w.z;
  const newDist = Math.hypot(t.x - nx, t.z - nz);
  const progress = dist - newDist;

  w.x = nx;
  w.z = nz;

  if (mx !== 0 || mz !== 0) {
    const want = Math.atan2(mx, mz);
    const diff = wrapAngle(want - w.facing);
    const maxTurn = WALK.turn * dt;
    const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
    w.facing = wrapAngle(w.facing + turn);
  }

  if (progress < 0.02) {
    w.stuck = (w.stuck ?? 0) + dt;
    if (w.stuck >= 0.4 - 1e-9) {
      w.target = null;
      w.moving = false;
      w.stuck = 0;
      return true;
    }
  }

  return false;
}

/** The portal whose trigger circle (r) contains (x, z), or null. */
export function portalAt(map: MapDef, x: number, z: number): PortalDef | null {
  for (const p of map.portals) {
    if (Math.hypot(p.x - x, p.z - z) <= p.r) return p;
  }
  return null;
}

/** The nearest spot whose circle (r) contains (x, z), or null. */
export function spotNear(map: MapDef, x: number, z: number): SpotDef | null {
  let best: SpotDef | null = null;
  let bestD = Infinity;
  for (const s of map.spots) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d <= s.r && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/** The nearest walkable point to (x, z) (pushed out of obstacles and inside the bounds). */
export function nearestWalkable(map: MapDef, x: number, z: number): { x: number; z: number } {
  const lx = map.w / 2 - WALK.edge;
  const lz = map.d / 2 - WALK.edge;
  const cx = Math.max(-lx, Math.min(lx, x));
  const cz = Math.max(-lz, Math.min(lz, z));
  if (!isBlocked(map, cx, cz)) return { x: cx, z: cz };

  for (let ring = 1; ring <= 24; ring++) {
    const r = ring * 0.25;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const pz = cz + Math.sin(a) * r;
      if (!isBlocked(map, px, pz)) return { x: px, z: pz };
    }
  }
  return { x: cx, z: cz };
}
