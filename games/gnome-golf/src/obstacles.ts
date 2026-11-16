// Things a ball (or a flying gnome) can hit above the ground: trees (trees.ts) and parked golf carts.
// Pure module state, no three.js scene: physics.ts and discPhysics.ts call collide() every simulation step.
// Deterministic: no randomness, so every client replays a shot the same way.
import type { XYZ } from './config';
import { CART_BOX } from './config';
import { heightAt } from './course';
import { PINE_TIER_H, PINE_TIER_R, PINE_TIER_Y, TREES, lobeCentres } from './trees';

/** A parked cart for collisions: its origin on the ground and its facing yaw (box size: CART_BOX in config.ts). */
export interface CartObstacle {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

let carts: CartObstacle[] = [];

/** Sets the parked carts that shots can hit. round.ts calls this right before simulating each shot. */
export function setCarts(list: CartObstacle[]): void {
  carts = list.slice();
}

/** The carts set by the last setCarts() call. */
export function getCarts(): readonly CartObstacle[] {
  return carts;
}

// ---- Tree colliders ------------------------------------------------------

type Collider =
  | { kind: 'trunk'; x: number; z: number; r: number; y0: number; y1: number }
  | { kind: 'leaves'; x: number; y: number; z: number; rx: number; ry: number; rz: number };

/** Spatial hash cell size, yards. */
const CELL = 16;
/** Colliders are stored in every cell their box reaches, grown by this margin (yd). Queries only read the ball's
 * own cell, so the margin must be at least the largest ball radius. */
const MARGIN = 2;

const cells = new Map<number, Collider[]>();

function cellKey(cx: number, cz: number): number {
  return (cx + 512) * 1024 + (cz + 512);
}

function store(c: Collider, x0: number, x1: number, z0: number, z1: number): void {
  const cx0 = Math.floor((x0 - MARGIN) / CELL);
  const cx1 = Math.floor((x1 + MARGIN) / CELL);
  const cz0 = Math.floor((z0 - MARGIN) / CELL);
  const cz1 = Math.floor((z1 + MARGIN) / CELL);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cz = cz0; cz <= cz1; cz++) {
      const k = cellKey(cx, cz);
      const list = cells.get(k);
      if (list) list.push(c);
      else cells.set(k, [c]);
    }
  }
}

function addTrunk(x: number, z: number, r: number, y0: number, y1: number): void {
  store({ kind: 'trunk', x, z, r, y0, y1 }, x - r, x + r, z - r, z + r);
}

function addLeaves(x: number, y: number, z: number, rx: number, ry: number, rz: number): void {
  store({ kind: 'leaves', x, y, z, rx, ry, rz }, x - rx, x + rx, z - rz, z + rz);
}

// Built once from the same trees the world draws (trees.ts).
for (const t of TREES.broadleaf) {
  const gy = heightAt(t.x, t.z);
  const s = t.s;
  addTrunk(t.x, t.z, 0.2 * s, gy, gy + 4 * s);
  addLeaves(t.x, gy + 4.5 * s, t.z, 3 * s, 3 * s, 3 * s);
}
for (const t of TREES.palms) {
  const gy = heightAt(t.x, t.z);
  const s = t.s;
  addTrunk(t.x, t.z, 0.3 * s, gy, gy + 7 * s);
  addLeaves(t.x, gy + 7 * s, t.z, 3.6 * s, 0.6 * s, 3.6 * s);
}
for (const t of TREES.oaks) {
  const gy = heightAt(t.x, t.z);
  const s = t.s;
  addTrunk(t.x, t.z, 1.3 * s, gy, gy + 12 * s);
  addLeaves(t.x, gy + 15 * s, t.z, 11 * s, 8 * s, 11 * s);
  for (const l of lobeCentres(t)) addLeaves(l.x, l.y, l.z, 7 * s, 5.5 * s, 7 * s);
}
for (const t of TREES.pines) {
  const gy = heightAt(t.x, t.z);
  const s = t.s;
  addTrunk(t.x, t.z, 0.7 * s, gy, gy + 18 * s);
  for (let k = 0; k < PINE_TIER_Y.length; k++) {
    const rr = PINE_TIER_R[k] * s * 0.7;
    addLeaves(t.x, gy + PINE_TIER_Y[k] * s, t.z, rr, (PINE_TIER_H[k] * s) / 2, rr);
  }
}

/** Trunk: vertical cylinder. Pushes p out to the surface and reflects the horizontal velocity. */
function hitTrunk(c: Extract<Collider, { kind: 'trunk' }>, p: XYZ, v: XYZ, r: number): boolean {
  if (p.y < c.y0 || p.y > c.y1) return false;
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const d = Math.hypot(dx, dz);
  const R = c.r + r;
  if (d >= R) return false;
  const nx = d > 1e-9 ? dx / d : 1;
  const nz = d > 1e-9 ? dz / d : 0;
  p.x = c.x + nx * R;
  p.z = c.z + nz * R;
  const vn = v.x * nx + v.z * nz;
  if (vn < 0) {
    const tx = v.x - vn * nx;
    const tz = v.z - vn * nz;
    const outVn = -vn * 0.5;
    v.x = tx * 0.8 + nx * outVn;
    v.z = tz * 0.8 + nz * outVn;
  }
  return true;
}

/** Canopy: ellipsoid. A ball inside loses most of its speed (no push-out: it drops through). */
function inLeaves(c: Extract<Collider, { kind: 'leaves' }>, p: XYZ): boolean {
  const a = (p.x - c.x) / c.rx;
  const b = (p.y - c.y) / c.ry;
  const d = (p.z - c.z) / c.rz;
  return a * a + b * b + d * d < 1;
}

// ---- Cart colliders ------------------------------------------------------

/**
 * Cart: an oriented box (CART_BOX, grown by the ball radius). Local x is the cart's right (-cos a, 0, sin a),
 * local z its forward (sin a, 0, cos a), y up from the cart's origin. Pushes p out along the axis of least
 * penetration (a side, an end or the roof) and reflects that velocity component.
 */
function hitCart(c: CartObstacle, p: XYZ, v: XYZ, r: number): boolean {
  const sa = Math.sin(c.yaw);
  const ca = Math.cos(c.yaw);
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  let lx = -ca * dx + sa * dz;
  let lz = sa * dx + ca * dz;
  let ly = p.y - c.y;
  const hx = CART_BOX.halfWidth + r;
  const hz = CART_BOX.halfLength + r;
  const top = CART_BOX.height + r;
  if (ly < -r || ly > top) return false;
  if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) return false;

  // Least penetration: 0 = +x side, 1 = -x side, 2 = +z end, 3 = -z end, 4 = roof.
  const pens = [hx - lx, hx + lx, hz - lz, hz + lz, top - ly];
  let axis = 0;
  for (let i = 1; i < pens.length; i++) if (pens[i] < pens[axis]) axis = i;

  // Velocity in the cart's frame: [right, forward, up].
  const arr = [-ca * v.x + sa * v.z, sa * v.x + ca * v.z, v.y];
  let k: number;
  let s: number;
  switch (axis) {
    case 0: k = 0; s = 1; lx = hx; break;
    case 1: k = 0; s = -1; lx = -hx; break;
    case 2: k = 1; s = 1; lz = hz; break;
    case 3: k = 1; s = -1; lz = -hz; break;
    default: k = 2; s = 1; ly = top; break;
  }
  if (arr[k] * s < 0) {
    arr[k] = -arr[k] * 0.55;
    for (let j = 0; j < 3; j++) if (j !== k) arr[j] *= 0.8;
    v.x = -ca * arr[0] + sa * arr[1];
    v.z = sa * arr[0] + ca * arr[1];
    v.y = arr[2];
  }
  p.x = c.x - ca * lx + sa * lz;
  p.z = c.z + sa * lx + ca * lz;
  p.y = c.y + ly;
  return true;
}

/**
 * Checks a ball of radius r at p moving with velocity v against every tree and cart.
 * On a hit: moves p just outside the obstacle, reflects and damps v (mutating both) and returns what was hit:
 * 'trunk' (a tree trunk), 'leaves' (a canopy: most speed lost, the ball drops), 'cart'. Returns null when clear.
 * Carts are checked first, then trunks, then canopies.
 */
export function collide(p: XYZ, v: XYZ, r: number): 'trunk' | 'leaves' | 'cart' | null {
  for (const c of carts) {
    if (hitCart(c, p, v, r)) return 'cart';
  }
  const list = cells.get(cellKey(Math.floor(p.x / CELL), Math.floor(p.z / CELL)));
  if (!list) return null;
  for (const c of list) {
    if (c.kind === 'trunk' && hitTrunk(c, p, v, r)) return 'trunk';
  }
  for (const c of list) {
    if (c.kind === 'leaves' && inLeaves(c, p)) {
      v.x *= 0.85;
      v.z *= 0.85;
      if (v.y > 0) v.y *= 0.85;
      return 'leaves';
    }
  }
  return null;
}
