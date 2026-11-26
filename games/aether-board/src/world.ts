// The ethereal plane: a seeded chain of floating islands that falls away downhill. Each island slopes toward the next,
// ends in a big kicker aimed across the gap, and has rollers, side kickers and rails to play on. Ley-lines (glowing
// grind rails in the sky) arc between islands. Past the last island an aether gate warps you back to the first.
// Pure: data + height queries, no rendering.
import * as THREE from 'three';
import type { HillParams } from './descent/types';

export interface Kicker {
  /** Start of the ramp (its low end) on the island surface. */
  x: number;
  z: number;
  /** Launch direction: (sin yaw, 0, cos yaw). */
  yaw: number;
  len: number;
  width: number;
  /** Lip height above the island surface. */
  height: number;
  big: boolean;
}

/** A smooth hill (h > 0) or dip (h < 0) on an island: h * exp(-(d/r)²). */
export interface Bump { x: number; z: number; r: number; h: number }

export interface Island {
  id: number;
  cx: number;
  cz: number;
  r: number;
  /** Height at the centre. */
  baseY: number;
  /** Downhill direction (unit, horizontal). */
  dx: number;
  dz: number;
  /** Height lost per metre downhill. */
  slope: number;
  /** Footprint: an ellipse, r across the fall line and r * stretch along it (1 = round). */
  stretch: number;
  /** Long rolls down the run: amp (m) * sin(2π along / len + phase). */
  waves: { amp: number; len: number; phase: number }[];
  /** Banking: the cross slope swings side to side down the run (per metre across, at its peak). */
  bank: { amp: number; len: number; phase: number };
  /** Joined to the previous / next run without a gap: no rim roll-off at that end. */
  /** Descent cliffs (empty in free ride). */
  drops: Drop[];
  joinStart: boolean;
  joinEnd: boolean;
  /** Joined below another run: over its first blendLen metres the ground eases from that run's surface to this one's. */
  blendLen: number;
  bumps: Bump[];
  kickers: Kicker[];
  /** Top colour (ISLAND_TOPS index). */
  color: number;
}

export interface Rail {
  /** Polyline about 1 m apart, and the arc length at each point. */
  pts: THREE.Vector3[];
  cum: number[];
  len: number;
  /** Ley-lines float in the sky and push you along; plain rails sit on islands. */
  ley: boolean;
  /** Present on rails that pop out of the side of a mountain: unit outward horizontal direction. */
  side?: { outX: number; outZ: number };
  /** Bounding sphere, for quick rejects. */
  center: THREE.Vector3;
  radius: number;
}

/**
 * A Descent hazard on a run: touch it below its top (y + h) and you bail. y = ground at x, z; r = collision radius.
 * spike: a cluster of aether spikes (r 1.6..2.6, h 1.6..2.4: jump them). tree: a snowy pine (r = trunk, about
 * 0.7..1, h 9..16: go round). rock: a boulder (r 1.4..3, h 1.2..2.6).
 */
export type HazardKind = 'spike' | 'tree' | 'rock';
export interface Hazard { kind: HazardKind; x: number; y: number; z: number; r: number; h: number; island: number }

/**
 * A cliff drop across part of a run (Descent): approaching it the ground rises gently to a ledge h metres above the
 * run over `lead` metres, then falls away sheer at `al` (metres along the fall line from the island centre). Only
 * where |side| < half (easing to nothing over CLIFF_EDGE metres past that), so a partial cliff can be ridden round.
 */
export interface Drop { al: number; h: number; half: number; lead: number }

/**
 * A bumper (free ride): a padded wall you bounce off instead of bailing. A capsule: the segment a..b (horizontal) with
 * radius r, standing h metres up from the ground (ya at a, yb at b). wall: the bowling-lane bumpers along both sides of
 * a run, which keep you on the mountain; post: a pinball bumper on the run that kicks you away. island: the run it is on.
 */
export interface Bumper {
  kind: 'wall' | 'post';
  ax: number; az: number; ya: number;
  bx: number; bz: number; yb: number;
  r: number;
  h: number;
  island: number;
}

export interface Decor { x: number; y: number; z: number; s: number; kind: 'rock' | 'crystal' | 'cloud'; rot: number }

/**
 * A halfpipe chute connecting island `from` to the next one: a straight U channel down the fall line. Cross-section:
 * a flat floor (|v| <= flatHalf), then walls rising to wallH at |v| = halfW, curving up as ((|v| - flatHalf) /
 * (halfW - flatHalf)) ** exp, so the lips are nearly vertical. Floor height at u (0..len) is y0 - slope * u.
 */
export interface Pipe {
  from: number;
  sx: number;
  sz: number;
  yaw: number;
  len: number;
  y0: number;
  slope: number;
  halfW: number;
  flatHalf: number;
  wallH: number;
  exp: number;
}

export interface World {
  seed: number;
  islands: Island[];
  rails: Rail[];
  pipes: Pipe[];
  /** How each run continues into the next: joined (no gap), a jump off a big kicker, or a halfpipe chute. */
  links: ('join' | 'jump' | 'pipe')[];
  spawn: { pos: THREE.Vector3; heading: number };
  /** Ride through this ring to warp back to the spawn. */
  gate: { pos: THREE.Vector3; r: number; yaw: number };
  /** Fall below this and the aether catches you (respawn). */
  voidY: number;
  decor: Decor[];
  /** Rocks and spikes that bail you: Descent's sliders, or free ride's race obstacles. */
  hazards: Hazard[];
  /** Free ride only (empty in Descent and Flood): side walls and pinball posts you bounce off. */
  bumpers: Bumper[];
  /** Look: the candy aether plane (free ride) or a snowy pine mountain (Descent). */
  theme: 'aether' | 'snow';
}

export interface Ground {
  y: number;
  normal: THREE.Vector3;
  /** The island (for a pipe: the island it leaves from). */
  island: number;
  /** Index into World.pipes when the ground is a halfpipe, else -1. */
  pipe: number;
}

// ---------------------------------------------------------------- tuning
/** Edge roll-off: the last share of the radius curves down this far, so you can launch off any rim. */
const RIM_START = 0.86;
const RIM_DROP = 3;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- heights

/** Kicker height at (x, z), 0 off the ramp. Quadratic profile: flat at the start, steepest at the lip. */
export function kickerHeight(k: Kicker, x: number, z: number): number {
  const fx = Math.sin(k.yaw);
  const fz = Math.cos(k.yaw);
  const px = x - k.x;
  const pz = z - k.z;
  const u = px * fx + pz * fz;
  if (u < 0 || u > k.len) return 0;
  const v = Math.abs(px * fz - pz * fx);
  const hw = k.width / 2;
  if (v > hw) return 0;
  // Rounded side edges over the last 1.5 m so the sides are not knife walls.
  const e = v > hw - 1.5 ? 1 - (v - (hw - 1.5)) / 1.5 : 1;
  const side = e * e * (3 - 2 * e);
  const f = u / k.len;
  return k.height * f * f * side;
}

/** 1 inside a kicker's footprint, easing to 0 over 3 m around it. */
function kickerShield(k: Kicker, x: number, z: number): number {
  const fx = Math.sin(k.yaw);
  const fz = Math.cos(k.yaw);
  const px = x - k.x;
  const pz = z - k.z;
  const u = px * fx + pz * fz;
  const v = Math.abs(px * fz - pz * fx);
  const du = u < 0 ? -u : u > k.len ? u - k.len : 0;
  const dv = Math.max(0, v - k.width / 2);
  const d = Math.hypot(du, dv);
  if (d >= 3) return 0;
  const t = 1 - d / 3;
  return t * t * (3 - 2 * t);
}

/** Ease across a cliff's side edge (m). */
const CLIFF_EDGE = 8;
/** Horizontal run of a cliff face (m): short enough that the board leaves the ground at any riding speed. */
const CLIFF_FACE = 1.2;

/** Extra height from a cliff at (along, side) in its island's frame: the ledge ramp, then the sheer face. */
export function dropHeight(dr: Drop, al: number, sd: number): number {
  const s = Math.abs(sd);
  if (s >= dr.half + CLIFF_EDGE) return 0;
  const du = al - dr.al; // + downstream of the edge
  if (du <= -dr.lead || du >= CLIFF_FACE) return 0;
  const c0 = s <= dr.half ? 1 : 1 - (s - dr.half) / CLIFF_EDGE;
  const across = c0 * c0 * (3 - 2 * c0);
  const along = du < 0 ? 1 + du / dr.lead : 1 - du / CLIFF_FACE;
  return dr.h * along * across;
}

/** Island surface height at (x, z), or null off the island. Includes bumps, kickers and the rim roll-off. */
export function surfaceY(isl: Island, x: number, z: number): number | null {
  const ox = x - isl.cx;
  const oz = z - isl.cz;
  // Elliptical footprint: normalised distance (1 at the rim) with the long axis down the fall line.
  const al = ox * isl.dx + oz * isl.dz;
  const sd = ox * isl.dz - oz * isl.dx;
  const d = Math.hypot(al / isl.stretch, sd);
  if (d > isl.r) return null;
  let y = isl.baseY - isl.slope * al;
  // Rolls and banking fade out over the last 40 m at each end, so joins meet on a plain slope.
  const env = Math.min(1, Math.max(0, (isl.r * isl.stretch - Math.abs(al)) / 40));
  if (env > 0) {
    let roll = 0;
    for (const wv of isl.waves) roll += wv.amp * Math.sin((2 * Math.PI * al) / wv.len + wv.phase);
    y += env * env * (3 - 2 * env) * (roll + sd * isl.bank.amp * Math.sin((2 * Math.PI * al) / isl.bank.len + isl.bank.phase));
  }
  for (const b of isl.bumps) {
    const q = ((x - b.x) ** 2 + (z - b.z) ** 2) / (b.r * b.r);
    if (q < 9) y += b.h * Math.exp(-q);
  }
  let kick = 0;
  let shield = 0; // 1 on and right around a kicker: no rim roll-off there (it would flatten or wall the ramp)
  for (const k of isl.kickers) {
    kick += kickerHeight(k, x, z);
    shield = Math.max(shield, kickerShield(k, x, z));
  }
  // Where two runs join there is no roll-off at that end (it would be a ditch across the join).
  if ((isl.joinEnd && al > 0) || (isl.joinStart && al < 0)) {
    shield = Math.max(shield, Math.min(1, Math.max(0, (0.8 * isl.r - Math.abs(sd)) / (0.15 * isl.r))));
  }
  const rim = d / isl.r;
  if (rim > RIM_START) {
    const k = (rim - RIM_START) / (1 - RIM_START);
    y -= k * k * RIM_DROP * (1 - shield);
  }
  y += kick;
  for (const dr of isl.drops) y += dropHeight(dr, al, sd);
  return y;
}

const EPS = 0.06;

/** Gentler of the two one-sided slopes: a lip or rim right beside you never tilts the normal. */
function slope1(c: number, ahead: number | null, behind: number | null): number {
  const f = ahead === null ? null : (ahead - c) / EPS;
  const b = behind === null ? null : (c - behind) / EPS;
  if (f === null) return b ?? 0;
  if (b === null) return f;
  return Math.abs(f) < Math.abs(b) ? f : b;
}

/** Surface normal of one island (one-sided differences, see slope1). */
export function surfaceNormal(isl: Island, x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  const c = surfaceY(isl, x, z) ?? 0;
  const gx = slope1(c, surfaceY(isl, x + EPS, z), surfaceY(isl, x - EPS, z));
  const gz = slope1(c, surfaceY(isl, x, z + EPS), surfaceY(isl, x, z - EPS));
  return out.set(-gx, 1, -gz).normalize();
}

/** Pipe-local coordinates: u along the pipe from its start, v across it (+ = right of the travel direction). */
export function pipeLocal(pp: Pipe, x: number, z: number): { u: number; v: number } {
  const fx = Math.sin(pp.yaw);
  const fz = Math.cos(pp.yaw);
  const px = x - pp.sx;
  const pz = z - pp.sz;
  return { u: px * fx + pz * fz, v: -(px * fz - pz * fx) };
}

/** Halfpipe surface height at (x, z), or null outside its footprint. */
export function pipeY(pp: Pipe, x: number, z: number): number | null {
  const { u, v } = pipeLocal(pp, x, z);
  if (u < 0 || u > pp.len) return null;
  const av = Math.abs(v);
  if (av > pp.halfW) return null;
  const wall = av > pp.flatHalf ? pp.wallH * ((av - pp.flatHalf) / (pp.halfW - pp.flatHalf)) ** pp.exp : 0;
  return pp.y0 - pp.slope * u + wall;
}

function pipeNormal(pp: Pipe, x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  const c = pipeY(pp, x, z) ?? 0;
  const gx = slope1(c, pipeY(pp, x + EPS, z), pipeY(pp, x - EPS, z));
  const gz = slope1(c, pipeY(pp, x, z + EPS), pipeY(pp, x, z - EPS));
  return out.set(-gx, 1, -gz).normalize();
}

const smooth01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** 0..1: how close (x, z) is to a run's rim (1 at the rim, 0 inside 88 % of it). */
function rimness(o: Island, x: number, z: number): number {
  const ox = x - o.cx;
  const oz = z - o.cz;
  const dn = Math.hypot((ox * o.dx + oz * o.dz) / o.stretch, ox * o.dz - oz * o.dx) / o.r;
  return smooth01((dn - 0.88) / 0.12);
}

/** 0..1: how close (x, z) is to a run's side edge, relative to its width there (the tips do not count). */
function sideness(o: Island, x: number, z: number): number {
  const ox = x - o.cx;
  const oz = z - o.cz;
  const ra = o.r * o.stretch;
  const al = ox * o.dx + oz * o.dz;
  const half = o.r * Math.sqrt(Math.max(1e-6, 1 - (al / ra) ** 2));
  return smooth01((Math.abs(ox * o.dz - oz * o.dx) / half - 0.88) / 0.12);
}

/**
 * The weight of the lower run b in a join's overlap: 0 at b's top tip, 1 past its blend zone; it also goes fully to
 * b near the upper run a's rim and fully to a near b's sides, so leaving either footprint is never a step.
 */
function blendT(a: Island, b: Island, x: number, z: number): number {
  const al = (x - b.cx) * b.dx + (z - b.cz) * b.dz;
  const t = smooth01((al + b.r * b.stretch) / b.blendLen);
  return Math.max(t, rimness(a, x, z)) * (1 - sideness(b, x, z));
}

/**
 * A run's ground height including its joins: where two joined runs overlap, both return the same value, easing from
 * the upper run's surface to the lower one's, so there is never a ledge or a wall at a join.
 */
export function runY(w: World, isl: Island, x: number, z: number): number | null {
  const y = surfaceY(isl, x, z);
  if (y === null) return null;
  if (isl.blendLen > 0) {
    const prev = w.islands[isl.id - 1];
    const py = surfaceY(prev, x, z);
    if (py !== null) return py + (y - py) * blendT(prev, isl, x, z);
  }
  const next = w.islands[isl.id + 1];
  if (isl.joinEnd && next && next.blendLen > 0) {
    const ny = surfaceY(next, x, z);
    if (ny !== null) return y + (ny - y) * blendT(isl, next, x, z);
  }
  return y;
}

function runNormal(w: World, isl: Island, x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  const c = runY(w, isl, x, z) ?? 0;
  const gx = slope1(c, runY(w, isl, x + EPS, z), runY(w, isl, x - EPS, z));
  const gz = slope1(c, runY(w, isl, x, z + EPS), runY(w, isl, x, z - EPS));
  return out.set(-gx, 1, -gz).normalize();
}

/**
 * The ground under (x, z) whose surface is at or below maxY (the highest such island), or null.
 * Pass maxY = (where you were last step) + a little, so an island overhead never grabs you from below.
 */
export function groundAt(w: World, x: number, z: number, maxY: number, out?: Ground): Ground | null {
  let best: Island | null = null;
  let bestY = -Infinity;
  for (const isl of w.islands) {
    const dx = x - isl.cx;
    const dz = z - isl.cz;
    const ra = isl.r * isl.stretch;
    if (dx * dx + dz * dz > ra * ra) continue;
    const y = runY(w, isl, x, z);
    if (y === null || y > maxY || y <= bestY) continue;
    best = isl;
    bestY = y;
  }
  let bestPipe = -1;
  for (let i = 0; i < w.pipes.length; i++) {
    const y = pipeY(w.pipes[i], x, z);
    if (y === null || y > maxY || y <= bestY) continue;
    bestPipe = i;
    bestY = y;
  }
  if (!best && bestPipe < 0) return null;
  const g = out ?? { y: 0, normal: new THREE.Vector3(), island: 0, pipe: -1 };
  g.y = bestY;
  if (bestPipe >= 0) {
    const pp = w.pipes[bestPipe];
    g.island = pp.from;
    g.pipe = bestPipe;
    pipeNormal(pp, x, z, g.normal);
  } else if (best) {
    g.island = best.id;
    g.pipe = -1;
    runNormal(w, best, x, z, g.normal);
  }
  return g;
}

// ---------------------------------------------------------------- rails

function makeRail(pts: THREE.Vector3[], ley: boolean, side?: { outX: number; outZ: number }): Rail {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const box = new THREE.Box3().setFromPoints(pts);
  const center = box.getCenter(new THREE.Vector3());
  let radius = 0;
  for (const p of pts) radius = Math.max(radius, p.distanceTo(center));
  return side ? { pts, cum, len: cum[cum.length - 1], ley, side, center, radius } : { pts, cum, len: cum[cum.length - 1], ley, center, radius };
}

/** Point and unit tangent (toward increasing s) at arc length s (clamped). */
export function railAt(r: Rail, s: number, outPos: THREE.Vector3, outTan: THREE.Vector3): void {
  const cs = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = r.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.cum[mid] <= cs) lo = mid;
    else hi = mid;
  }
  const a = r.pts[lo];
  const b = r.pts[hi];
  const seg = r.cum[hi] - r.cum[lo] || 1;
  const f = (cs - r.cum[lo]) / seg;
  outPos.copy(a).lerp(b, f);
  outTan.copy(b).sub(a).normalize();
}

const tmpAB = new THREE.Vector3();
const tmpAP = new THREE.Vector3();
const tmpQ = new THREE.Vector3();

/** Nearest point on a rail to p: arc length s and distance. */
export function nearestOnRail(r: Rail, p: THREE.Vector3): { s: number; dist: number } {
  let bestD = Infinity;
  let bestS = 0;
  for (let i = 0; i < r.pts.length - 1; i++) {
    const a = r.pts[i];
    tmpAB.copy(r.pts[i + 1]).sub(a);
    tmpAP.copy(p).sub(a);
    const ll = tmpAB.lengthSq() || 1;
    const f = Math.max(0, Math.min(1, tmpAP.dot(tmpAB) / ll));
    tmpQ.copy(a).addScaledVector(tmpAB, f);
    const d = tmpQ.distanceToSquared(p);
    if (d < bestD) {
      bestD = d;
      bestS = r.cum[i] + f * (r.cum[i + 1] - r.cum[i]);
    }
  }
  return { s: bestS, dist: Math.sqrt(bestD) };
}

/** Quadratic Bezier sampled about every metre. */
function bezier(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3): THREE.Vector3[] {
  const approx = p0.distanceTo(p1) + p1.distanceTo(p2);
  const n = Math.max(8, Math.ceil(approx));
  const out: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    out.push(new THREE.Vector3(
      a * p0.x + b * p1.x + c * p2.x,
      a * p0.y + b * p1.y + c * p2.y,
      a * p0.z + b * p1.z + c * p2.z,
    ));
  }
  return out;
}

// ---------------------------------------------------------------- generation
//
// A mountain, not an archipelago: about a dozen long runs (several hundred metres each) going downhill, mostly
// joined end to end so you ride without a break, with long rolls and banked turns down each one. Every few runs the
// line breaks for a big moment: a gap jump off a big kicker, or a halfpipe chute down to the next run.

/** Typical speed off a big kicker, for spacing the next run (the landing zone covers about 22..48 m/s). */
const PLAN_SPEED = 32;
/** Horizontal clearance between a kicker's lip and the next run's near end (m). */
const GAP_MIN = 16;
const RUNS = 12;
/** How each run continues (cycled), and the last always jumps through the aether gate. */
const LINK_CYCLE: readonly ('join' | 'jump' | 'pipe')[] = ['join', 'join', 'jump', 'join', 'pipe', 'join', 'jump'];

/** Inside an island's footprint (horizontally), with a margin in metres. */
function insideIsland(o: Island, x: number, z: number, margin: number): boolean {
  const ox = x - o.cx;
  const oz = z - o.cz;
  const al = ox * o.dx + oz * o.dz;
  const sd = ox * o.dz - oz * o.dx;
  return Math.hypot(al / o.stretch, sd) < o.r + margin;
}

/** Along and across coordinates of (x, z) in an island's fall-line frame. */
function frame(o: Island, x: number, z: number): { al: number; sd: number } {
  const ox = x - o.cx;
  const oz = z - o.cz;
  return { al: ox * o.dx + oz * o.dz, sd: ox * o.dz - oz * o.dx };
}

/** True where a cliff changes the ground (its ledge or its face), for rail placement. */
function cliffAt(isl: Island, x: number, z: number): boolean {
  const { al, sd } = frame(isl, x, z);
  return isl.drops.some((dr) => dropHeight(dr, al, sd) !== 0);
}

/** Hazard rule: on a cliff's ledge or in the 20 m below its face. */
function nearCliff(isl: Island, x: number, z: number): boolean {
  const { al, sd } = frame(isl, x, z);
  return isl.drops.some((dr) => Math.abs(sd) < dr.half + 8 && al >= dr.al - dr.lead && al <= dr.al + 20);
}

/** Hazard rule: within a kicker's middle reach, 14 m of its lip, or in the 30 m straight ahead of the lip. */
function nearKicker(isl: Island, x: number, z: number): boolean {
  for (const k of isl.kickers) {
    const fx = Math.sin(k.yaw);
    const fz = Math.cos(k.yaw);
    const mx = k.x + fx * k.len / 2;
    const mz = k.z + fz * k.len / 2;
    if (Math.hypot(x - mx, z - mz) < k.len / 2 + 8) return true;
    const lx = k.x + fx * k.len;
    const lz = k.z + fz * k.len;
    if (Math.hypot(x - lx, z - lz) < 14) return true;
    const u = (x - lx) * fx + (z - lz) * fz;
    const v = Math.abs((x - lx) * fz - (z - lz) * fx);
    if (u >= 0 && u <= 30 && v <= k.width / 2 + 3) return true;
  }
  return false;
}

/** hill: Descent sliders (see descent/types.ts). Omitted = the free-ride mountain, exactly as before. */
export function generateWorld(seed: number, hill?: HillParams): World {
  const rnd = mulberry32(seed);
  const range = (a: number, b: number): number => a + (b - a) * rnd();
  const islands: Island[] = [];
  const rails: Rail[] = [];
  const decor: Decor[] = [];
  const pipes: Pipe[] = [];
  const links: World['links'] = [];
  const hazards: Hazard[] = [];
  // Descent sliders (0 when free ride). Descent-only randomness comes from hrnd, never from rnd.
  const hz = hill?.hazard ?? 0;
  const sp = hill?.steep ?? 0;
  const tr = hill?.tricky ?? 0;
  const nRuns = hill ? hill.runs : RUNS;
  const hrnd = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const srnd = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const srange = (a: number, b: number): number => a + (b - a) * srnd();

  const makeRun = (id: number, cx: number, cz: number, yaw: number, r: number, st: number, slope: number): Island => {
    const waves = [
      { amp: range(1.5, 3.5), len: range(70, 130), phase: rnd() * 6.28 },
      { amp: range(0.6, 1.4), len: range(28, 50), phase: rnd() * 6.28 },
    ];
    return {
      id, cx, cz, r, baseY: 0, dx: Math.sin(yaw), dz: Math.cos(yaw), slope, stretch: st, waves,
      bank: { amp: range(0.04, 0.09), len: range(140, 260), phase: rnd() * 6.28 },
      joinStart: false, joinEnd: false, blendLen: 0, bumps: [], kickers: [], drops: [], color: id % 6,
    };
  };

  let isl = makeRun(0, 0, 0, 0, 64, 3.4, hill ? 0.12 + 0.04 * sp : 0.2);
  isl.baseY = 600;
  let yaw = 0;
  let gate: World['gate'] = { pos: new THREE.Vector3(), r: 16, yaw: 0 };
  // Descent: where earlier jumps land (the runs they land on keep their cliffs and hazards clear of these).
  const landings: { x: number; z: number }[] = [];

  for (let i = 0; i < nRuns; i++) {
    const { cx, cz, r, dx, dz, slope } = isl;
    const st = isl.stretch;
    const ra = r * st; // half-length down the fall line
    let link: 'join' | 'jump' | 'pipe';
    if (i === nRuns - 1) link = 'jump';
    else if (hill) {
      const roll = hrnd();
      const jumpT = 0.12 + 0.05 * hz + 0.04 * tr;
      link = i === 0 ? 'join' : roll < jumpT ? 'jump' : roll < jumpT + 0.08 + 0.05 * tr ? 'pipe' : 'join';
    } else link = LINK_CYCLE[i % LINK_CYCLE.length];
    links.push(link);
    if (link === 'join') isl.joinEnd = true;
    islands.push(isl);
    const at = (along: number, side: number): [number, number] => [cx + dx * along + dz * side, cz + dz * along - dx * side];
    // Features stay out of the first and last 35 m of a run (joins, landings and the exit stay clean).
    const span = Math.max(10, ra - 35);
    const along01 = (a: number, b: number): number => range(a, b) * span;

    // Rollers along the run, off the centre line (rollers to play on, not speed traps).
    const bumpCount = Math.round(range(4, 6) * st);
    for (let b = 0; b < bumpCount; b++) {
      const [x, z] = at(along01(-1, 1), (rnd() < 0.5 ? -1 : 1) * range(0.2, 0.62) * r);
      isl.bumps.push({ x, z, r: range(5, 11), h: rnd() < 0.75 ? range(1.2, 3) : -range(0.8, 1.6) });
    }
    // Side kickers all the way down, angled off the fall line.
    const sideCount = hill ? Math.round(range(1.5, 2.5) * st * (0.4 + 0.35 * tr)) : Math.round(range(1.5, 2.5) * st);
    for (let k = 0; k < sideCount; k++) {
      const [x, z] = at(along01(-1, 0.95), (k % 2 === 0 ? 1 : -1) * range(0.15, 0.5) * r);
      isl.kickers.push({ x, z, yaw: yaw + range(-0.5, 0.5), len: range(6, 8), width: range(6, 8), height: hill ? range(1.8, 2.6) + 0.3 * tr : range(1.8, 2.6), big: false });
    }
    // The exit: a big kicker for a jump.
    const len = 10;
    if (link === 'jump') {
      const [x, z] = at(ra - 2 - len, 0);
      isl.kickers.push({ x, z, yaw, len, width: 14, height: 3.4, big: true });
    }
    // Descent: a fork (a tree strip with a trick line on one side), then cliff drops. Both come before the rails, so
    // the rails can skip the ledges. Descent-only randomness: hrnd.
    let fork: { a0: number; len: number } | null = null;
    if (hill && (hz >= 1 || tr >= 2) && hrnd() < Math.min(0.85, 0.35 + 0.08 * (hz + tr))) {
      const forkLen = 90 + 50 * hrnd();
      const a0 = -span + hrnd() * Math.max(0, 2 * span - forkLen);
      const tside = hrnd() < 0.5 ? -1 : 1;
      fork = { a0, len: forkLen };
      const want = 2 + Math.round(tr / 2);
      const placed: number[] = [];
      for (let k = 0; k < want; k++) {
        for (let att = 0; att < 30; att++) {
          const a = a0 + hrnd() * forkLen;
          if (placed.some((b) => Math.abs(a - b) < 25)) continue;
          placed.push(a);
          const [x, z] = at(a, tside * (0.3 + 0.25 * hrnd()) * r);
          isl.kickers.push({
            x, z, yaw: yaw + (hrnd() * 2 - 1) * 0.2, len: 6 + 2 * hrnd(), width: 6 + 2 * hrnd(),
            height: 1.8 + 0.8 * hrnd() + 0.3 * tr, big: false,
          });
          break;
        }
      }
    }
    if (hill) {
      const cliffCount = Math.round((0.25 * sp + 0.1 * tr) * (0.6 + 0.8 * hrnd()));
      for (let c = 0; c < cliffCount; c++) {
        for (let att = 0; att < 6; att++) {
          const al = -span + 30 + hrnd() * (2 * span - 60);
          const h = 2.5 + 0.8 * sp + 1.5 * hrnd();
          const lead = 18 + 10 * hrnd();
          const half = r * (hrnd() < 0.35 + 0.08 * sp ? 1.05 : 0.3 + 0.35 * hrnd());
          if (isl.drops.some((d) => Math.abs(d.al - al) < 40)) continue;
          const kickerHit = isl.kickers.some((k) => {
            const ends = [frame(isl, k.x, k.z).al, frame(isl, k.x + Math.sin(k.yaw) * k.len, k.z + Math.cos(k.yaw) * k.len).al];
            return ends.some((ka) => ka >= al - lead - 10 && ka <= al + 25);
          });
          if (kickerHit) continue;
          if (landings.some((l) => surfaceY(isl, l.x, l.z) !== null && Math.abs(frame(isl, l.x, l.z).al - al) < 35)) continue;
          isl.drops.push({ al, h, half, lead });
          break;
        }
      }
    }

    // Rails down the run, following the ground 1.1 m up.
    const railCount = hill
      ? Math.max(tr > 0 ? 1 : 0, Math.round(range(0.5, 1.1) * st * (0.3 + 0.35 * tr)))
      : Math.max(1, Math.round(range(0.5, 1.1) * st));
    for (let k = 0; k < railCount; k++) {
      const a0 = along01(-1, 0.6);
      const side = (rnd() < 0.5 ? 1 : -1) * range(0.25, 0.5) * r;
      const railLen = range(18, 34);
      const pts: THREE.Vector3[] = [];
      for (let s2 = 0; s2 <= railLen; s2 += 1) {
        const [x, z] = at(a0 + s2, side);
        const y = surfaceY(isl, x, z);
        if (y === null) break;
        pts.push(new THREE.Vector3(x, y + 1.1, z));
      }
      if (pts.length > 8 && !(hill && pts.some((p) => cliffAt(isl, p.x, p.z)))) rails.push(makeRail(pts, false));
    }

    // Side-mountain rails: start near the edge of the run, curve out past the rim over the void, and curve back in.
    const sideRailCount = hill
      ? Math.max(tr > 0 ? 1 : 0, Math.round(srange(0.35, 0.7) * st * (0.25 + 0.35 * tr)))
      : Math.max(1, Math.round(srange(0.4, 0.75) * st));
    const placedSide: { a0: number; a1: number; sgn: number }[] = [];
    for (let k = 0; k < sideRailCount; k++) {
      const sgn = srnd() < 0.5 ? 1 : -1;
      const railLen = srange(24, 38);
      const a0 = srange(-0.55, 0.3) * ra;
      const a1 = a0 + railLen;
      if (a1 > 0.65 * ra) continue;
      if (placedSide.some((o) => o.sgn === sgn && a0 < o.a1 + 12 && a1 > o.a0 - 12)) continue;
      const halfAt = (al: number): number => r * Math.sqrt(Math.max(0.01, 1 - (al / ra) ** 2));
      const [x0, z0] = at(a0, sgn * 0.78 * halfAt(a0));
      const [x1, z1] = at(a1, sgn * 0.78 * halfAt(a1));
      const y0 = surfaceY(isl, x0, z0);
      const y1 = surfaceY(isl, x1, z1);
      if (y0 === null || y1 === null) continue;
      const outFactor = srange(1.14, 1.26);
      const pts: THREE.Vector3[] = [];
      for (let s2 = 0; s2 <= railLen; s2 += 1) {
        const u = s2 / railLen;
        const al = a0 + s2;
        const sd = sgn * halfAt(al) * (0.78 + (outFactor - 0.78) * Math.sin(Math.PI * u));
        const [x, z] = at(al, sd);
        const surf = surfaceY(isl, x, z);
        const base = y0 + (y1 - y0) * u + 0.8 * Math.sin(Math.PI * u);
        const y = Math.max(base + 1.05, surf !== null ? surf + 1.05 : -Infinity);
        pts.push(new THREE.Vector3(x, y, z));
      }
      if (pts.length > 8 && !(hill && pts.some((p) => insideIsland(isl, p.x, p.z, 0) && cliffAt(isl, p.x, p.z)))) {
        placedSide.push({ a0, a1, sgn });
        rails.push(makeRail(pts, false, { outX: sgn * dz, outZ: -sgn * dx }));
      }
    }
    // Descent hazards on this run: edge forests always; glades, a fork strip, rock gardens and spikes as the sliders
    // ask. Descent-only randomness: hrnd.
    if (hill) {
      const free = (x: number, z: number, clear: number): number | null => {
        const y = surfaceY(isl, x, z);
        if (y === null || nearKicker(isl, x, z) || nearCliff(isl, x, z)) return null;
        if (rails.some((rl) => rl.pts.some((p) => Math.hypot(x - p.x, z - p.z) < 6))) return null;
        if (hazards.some((o) => Math.hypot(x - o.x, z - o.z) < clear)) return null;
        if (landings.some((l) => Math.hypot(x - l.x, z - l.z) < 25)) return null;
        return y;
      };
      // Edge forests: pines along both sides, with gaps.
      for (const sgn of [-1, 1]) {
        for (let a = -ra + 10; a <= ra - 10; a += 7 + 4 * hrnd()) {
          if (hrnd() < 0.25) continue;
          const [x, z] = at(a, sgn * (0.82 + 0.15 * hrnd()) * r);
          const y = free(x, z, 4);
          if (y === null) continue;
          hazards.push({ kind: 'tree', x, y, z, r: 0.7 + 0.3 * hrnd(), h: 9 + 7 * hrnd(), island: i });
        }
      }
      // Glades: loose groups of trees to weave through.
      if (hz >= 1) {
        const glades = Math.round(hz * 0.5 * st / 3.4 + hrnd());
        for (let g = 0; g < glades; g++) {
          const glen = 30 + 30 * hrnd();
          const a0 = -span + hrnd() * Math.max(0, 2 * span - glen);
          const target = Math.round((4 + 3 * hz) * glen / 40);
          const clr = Math.max(6, 11 - hz);
          for (let t = 0; t < target; t++) {
            for (let att = 0; att < 10; att++) {
              const [x, z] = at(a0 + hrnd() * glen, (hrnd() * 2 - 1) * 0.8 * r);
              const y = free(x, z, clr);
              if (y === null) continue;
              hazards.push({ kind: 'tree', x, y, z, r: 0.7 + 0.3 * hrnd(), h: 9 + 7 * hrnd(), island: i });
              break;
            }
          }
        }
      }
      // Fork strip: a thin row of trees down the middle of a fork, splitting the safe line from the trick line.
      if (fork && hz >= 1) {
        for (let a = fork.a0; a < fork.a0 + fork.len; a += 5 + 2 * hrnd()) {
          const n = hrnd() < 0.5 ? 1 : 2;
          for (let q = 0; q < n; q++) {
            const [x, z] = at(a, (hrnd() * 2 - 1) * 5);
            const y = free(x, z, 3);
            if (y === null) continue;
            hazards.push({ kind: 'tree', x, y, z, r: 0.7 + 0.3 * hrnd(), h: 9 + 7 * hrnd(), island: i });
          }
        }
      }
      // Rock gardens: clusters of boulders.
      if (hz >= 2) {
        const gardens = Math.round((hz - 1) * 0.4 * st / 3.4 + hrnd() * 0.6);
        for (let g = 0; g < gardens; g++) {
          const [gx, gz] = at(-span + 2 * span * hrnd(), (hrnd() * 2 - 1) * 0.7 * r);
          const n = 4 + Math.floor(hrnd() * 5);
          for (let q = 0; q < n; q++) {
            for (let att = 0; att < 10; att++) {
              const ang = hrnd() * Math.PI * 2;
              const d = 12 * Math.sqrt(hrnd());
              const x = gx + Math.cos(ang) * d;
              const z = gz + Math.sin(ang) * d;
              const y = free(x, z, 4);
              if (y === null) continue;
              hazards.push({ kind: 'rock', x, y, z, r: 1.4 + 1.6 * hrnd(), h: 1.2 + 1.4 * hrnd(), island: i });
              break;
            }
          }
        }
      }
      // Spikes (aether flavour): the top slider only.
      if (hz >= 3) {
        const spikes = Math.round(hz * (1.0 + 0.6 * hrnd()) * st / 3.4 * 0.4);
        for (let s = 0; s < spikes; s++) {
          for (let att = 0; att < 8; att++) {
            const [x, z] = at((hrnd() * 2 - 1) * span, (hrnd() * 2 - 1) * 0.7 * r);
            const y = free(x, z, 12);
            if (y === null) continue;
            hazards.push({ kind: 'spike', x, y, z, r: 1.6 + 1.0 * hrnd(), h: 1.6 + 0.8 * hrnd(), island: i });
            break;
          }
        }
      }
    }

    // Decor along both sides of the run.
    for (let d = -ra; d < ra; d += 45) {
      for (const sgn of [-1, 1]) {
        if (rnd() < 0.5) continue;
        const [x, z] = at(d + range(-15, 15), sgn * (r + range(25, 80)));
        decor.push({
          x, z, y: isl.baseY - slope * d + range(-40, 25), s: range(2, 9),
          kind: rnd() < 0.45 ? 'rock' : rnd() < 0.6 ? 'crystal' : 'cloud', rot: rnd() * 6.28,
        });
      }
    }

    // Where the next run starts, and its height there.
    let nyaw = yaw + range(-0.3, 0.3);
    const nr = hill ? range(56, 72) * (1 - 0.05 * hz) : range(56, 72);
    const nst = range(2.6, 4.8);
    const nra = nr * nst;
    const nslope = hill ? range(0.10, 0.14) + 0.045 * sp : range(0.16, 0.24);
    let anchorX: number;
    let anchorZ: number;
    let anchorY: number;
    let upstream: number; // how far the anchor sits upstream of the next run's centre (m)

    if (link === 'join') {
      // End to end: the next run starts just inside this one's end, 0.3 m lower.
      [anchorX, anchorZ] = at(ra * 0.97, 0);
      anchorY = surfaceY(isl, anchorX, anchorZ) ?? isl.baseY;
      upstream = nra * 0.94;
    } else if (link === 'pipe') {
      const [sx, sz] = at(ra - r * 0.38, 0);
      const y0 = surfaceY(isl, sx, sz) ?? isl.baseY;
      const plen = range(85, 115);
      pipes.push({ from: i, sx, sz, yaw, len: plen, y0, slope, halfW: 9, flatHalf: 3.5, wallH: 7.5, exp: 2.6 });
      anchorX = sx + dx * plen;
      anchorZ = sz + dz * plen;
      anchorY = y0 - slope * plen;
      nyaw = yaw + range(-0.12, 0.12); // a chute runs straight into the next run
      upstream = nra - 10; // the chute ends 10 m inside the next run's top end
    } else {
      // A jump off the big kicker: where a typical launch comes down.
      const [lipX, lipZ] = at(ra - 2, 0);
      const lipY = (surfaceY(isl, lipX - dx * 0.01, lipZ - dz * 0.01) ?? isl.baseY) + 0.01;
      const launch = 0.42;
      const planSpeed = hill ? 30 + 4.5 * sp : PLAN_SPEED;
      const vx = planSpeed * Math.cos(launch);
      const vy = planSpeed * Math.sin(launch);
      const drop = hill ? range(6, 12) * (1 + 0.25 * sp) : range(6, 12);
      const dist = vx * (vy + Math.sqrt(vy * vy + 2 * 30 * drop)) / 30;
      anchorX = lipX + dx * dist;
      anchorZ = lipZ + dz * dist;
      anchorY = lipY - drop;
      // Land on the top part of the next run, whose near end is at least GAP_MIN past the lip.
      upstream = Math.max(nra * 0.55, nra - (dist - GAP_MIN));
      if (i === nRuns - 1) {
        gate = { pos: new THREE.Vector3(anchorX, anchorY + 6, anchorZ), r: 16, yaw };
        break;
      }
      if (hill) landings.push({ x: anchorX, z: anchorZ });
    }

    // Place the next run (turning a little, never over an earlier run), then set its height to meet the anchor.
    let next = makeRun(i + 1, 0, 0, nyaw, nr, nst, nslope);
    for (let tries = 0; tries < 12; tries++) {
      if (tries > 0) nyaw = yaw + range(-0.3, 0.3) * (link === 'pipe' ? 0.4 : 1);
      const ncx = anchorX + Math.sin(nyaw) * upstream;
      const ncz = anchorZ + Math.cos(nyaw) * upstream;
      next = makeRun(i + 1, ncx, ncz, nyaw, nr, nst, nslope);
      next.joinStart = link !== 'jump';
      let clash = false;
      for (let k = 0; k < 16 && !clash; k++) {
        const th = (k / 16) * Math.PI * 2;
        const al = Math.cos(th) * nra;
        const sd = Math.sin(th) * nr;
        const x = ncx + next.dx * al + next.dz * sd;
        const z = ncz + next.dz * al - next.dx * sd;
        clash = islands.some((o) => o.id < i && insideIsland(o, x, z, 10));
      }
      if (!clash) break;
    }
    next.baseY = 0;
    next.baseY = anchorY - (surfaceY(next, anchorX, anchorZ) ?? 0);
    // A join blends across the whole overlap: from the next run's top tip to the end of this one.
    if (link === 'join') {
      // Blend over 85 % of the overlap measured down the next run: it finishes before this run ends.
      const endX = cx + dx * ra;
      const endZ = cz + dz * ra;
      const alEnd = (endX - next.cx) * next.dx + (endZ - next.cz) * next.dz;
      next.blendLen = Math.max(4, (alEnd + nra) * 0.85);
    }

    // Every other run: a ley-line from this run's lower half arcing high over to the next one.
    if (hill ? tr >= 3 || (tr >= 1 && i % 2 === 1) : i % 2 === 1) {
      const side = (rnd() < 0.5 ? 1 : -1) * range(0.35, 0.5) * r;
      const [sx, sz] = at(ra * 0.45, side);
      const p0 = new THREE.Vector3(sx, (surfaceY(isl, sx, sz) ?? isl.baseY) + 1.2, sz);
      const ex = next.cx - next.dx * next.r * next.stretch * 0.6 + next.dz * side * 0.6;
      const ez = next.cz - next.dz * next.r * next.stretch * 0.6 - next.dx * side * 0.6;
      const p2 = new THREE.Vector3(ex, (surfaceY(next, ex, ez) ?? next.baseY) + 1.6, ez);
      const p1 = p0.clone().lerp(p2, 0.5);
      p1.y = Math.max(p0.y, p2.y) + range(8, 16);
      p1.x += dz * side * 0.4;
      p1.z -= dx * side * 0.4;
      rails.push(makeRail(bezier(p0, p1, p2), true));
    }

    yaw = nyaw;
    isl = next;
  }

  if (hill) {
    // Hazards are placed run by run, before later runs' rails exist: drop any that ended up within 6 m of a rail.
    for (let q = hazards.length - 1; q >= 0; q--) {
      const hzd = hazards[q];
      if (rails.some((rl) => rl.pts.some((p) => Math.hypot(hzd.x - p.x, hzd.z - p.z) < 6))) hazards.splice(q, 1);
    }
  }

  const s0 = islands[0];
  const sx = s0.cx - s0.dx * s0.r * s0.stretch * 0.85;
  const sz = s0.cz - s0.dz * s0.r * s0.stretch * 0.85;
  const spawn = { pos: new THREE.Vector3(sx, (surfaceY(s0, sx, sz) ?? s0.baseY), sz), heading: Math.atan2(s0.dx, s0.dz) };
  const lowest = islands.reduce((m, o) => Math.min(m, o.baseY - o.slope * o.r * o.stretch), Infinity);
  const w: World = { seed, islands, rails, pipes, links, spawn, gate, voidY: Math.min(lowest, gate.pos.y) - 90, decor, hazards, bumpers: [], theme: hill ? 'snow' : 'aether' };
  if (!hill) addRaceCourse(w);
  return w;
}

// ---------------------------------------------------------------- free ride: the race course
//
// Free ride is a race to the gate at the bottom. On top of the classic mountain (left exactly as it was: this uses its
// own random stream) every run gets bumper walls down both sides, pinball posts and bumper bars to bounce off, and
// rocks and aether spikes that bail you. The jump landings, kickers, rails and the first stretch of the mountain stay
// clear.

/** Bumper walls: how far out (share of the run's half width), how tall, how thick (capsule radius), segment length. */
const WALL_SIDE = 0.84;
const WALL_H = 1.3;
const WALL_R = 0.45;
const WALL_SEG = 6;

function addRaceCourse(w: World): void {
  const rnd = mulberry32((w.seed ^ 0x2545f491) >>> 0);
  const range = (a: number, b: number): number => a + (b - a) * rnd();
  const nearRail = (x: number, z: number, d: number): boolean =>
    w.rails.some((rl) => Math.hypot(x - rl.center.x, z - rl.center.z) < rl.radius + d && rl.pts.some((p) => Math.hypot(x - p.x, z - p.z) < d));
  const inOther = (id: number, x: number, z: number): boolean => w.islands.some((o) => o.id !== id && insideIsland(o, x, z, 2));
  const nearPipe = (x: number, z: number): boolean => w.pipes.some((pp) => {
    const { u, v } = pipeLocal(pp, x, z);
    return u > -25 && u < pp.len + 25 && Math.abs(v) < pp.halfW + 6;
  });

  for (const isl of w.islands) {
    const i = isl.id;
    const ra = isl.r * isl.stretch;
    const at = (al: number, sd: number): [number, number] => [isl.cx + isl.dx * al + isl.dz * sd, isl.cz + isl.dz * al - isl.dx * sd];
    const halfAt = (al: number): number => isl.r * Math.sqrt(Math.max(0.01, 1 - (al / ra) ** 2));
    const ground = (x: number, z: number): number | null => runY(w, isl, x, z);
    const onKicker = (x: number, z: number): boolean => isl.kickers.some((k) => kickerShield(k, x, z) > 0);
    // The 45 m run-up to the exit kicker stays open, so the fast line to the jump is never blocked.
    const onApproach = (x: number, z: number, r: number): boolean => isl.kickers.some((k) => {
      if (!k.big) return false;
      const fx = Math.sin(k.yaw);
      const fz = Math.cos(k.yaw);
      const u = (x - k.x) * fx + (z - k.z) * fz;
      const v = Math.abs((x - k.x) * fz - (z - k.z) * fx);
      return u > -45 && u < 0 && v < k.width / 2 + 4 + r;
    });

    // Side walls: a chain of capsules at WALL_SIDE of the half width, from 88 % up the run to 88 % down it. Gaps where
    // a rail crosses (side-mountain rails go out over the void), at kickers, where another run overlaps, at a chute.
    for (const sgn of [-1, 1]) {
      for (let al = -0.88 * ra; al + WALL_SEG <= 0.88 * ra; al += WALL_SEG) {
        const [ax, az] = at(al, sgn * WALL_SIDE * halfAt(al));
        const [bx, bz] = at(al + WALL_SEG, sgn * WALL_SIDE * halfAt(al + WALL_SEG));
        const mx = (ax + bx) / 2;
        const mz = (az + bz) / 2;
        const ya = ground(ax, az);
        const yb = ground(bx, bz);
        if (ya === null || yb === null) continue;
        if (nearRail(mx, mz, 4) || onKicker(ax, az) || onKicker(bx, bz) || onKicker(mx, mz)) continue;
        if (inOther(i, ax, az) || inOther(i, bx, bz) || nearPipe(mx, mz)) continue;
        w.bumpers.push({ kind: 'wall', ax, az, ya, bx, bz, yb, r: WALL_R, h: WALL_H, island: i });
      }
    }

    // Obstacles on the run itself, away from the start, joins, kickers, rails and jump landings.
    const afterJump = i > 0 && w.links[i - 1] === 'jump';
    const top = i === 0 ? -ra + 90 : afterJump ? -0.3 * ra : -ra + 40;
    const bottom = ra - 40;
    if (bottom - top < 30) continue;
    const taken: { x: number; z: number; r: number }[] = [];
    const free = (x: number, z: number, r: number, clear: number): number | null => {
      if (inOther(i, x, z) || nearPipe(x, z) || nearKicker(isl, x, z) || nearRail(x, z, r + 5)) return null;
      if (onApproach(x, z, r)) return null;
      if (taken.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r + clear)) return null;
      if (w.hazards.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r + clear)) return null;
      return ground(x, z);
    };
    const place = (r: number, clear: number, across: number, fn: (x: number, y: number, z: number) => void): void => {
      for (let att = 0; att < 12; att++) {
        const al = range(top, bottom);
        const [x, z] = at(al, range(-across, across) * halfAt(al));
        const y = free(x, z, r, clear);
        if (y === null) continue;
        taken.push({ x, z, r });
        fn(x, y, z);
        return;
      }
    };

    const span = (bottom - top) / 100; // obstacles per 100 m of run
    // Pinball posts: bounce you, no bail.
    for (let n = Math.round(span * range(1.6, 2.4)); n > 0; n--) {
      const r = range(1.1, 1.6);
      place(r, 8, 0.6, (x, y, z) => w.bumpers.push({ kind: 'post', ax: x, az: z, ya: y, bx: x, bz: z, yb: y, r, h: 2.2, island: i }));
    }
    // Bumper bars: short walls angled across the fall line, to carve round or glance off.
    for (let n = Math.round(span * range(0.6, 1.1)); n > 0; n--) {
      const len = range(7, 11);
      const ang = (rnd() < 0.5 ? 1 : -1) * range(0.5, 1.0); // off the fall line
      place(len / 2 + 0.5, 8, 0.5, (x, y, z) => {
        const yaw = Math.atan2(isl.dx, isl.dz) + ang;
        const hx = Math.sin(yaw) * len / 2;
        const hz = Math.cos(yaw) * len / 2;
        const ya = ground(x - hx, z - hz) ?? y;
        const yb = ground(x + hx, z + hz) ?? y;
        w.bumpers.push({ kind: 'wall', ax: x - hx, az: z - hz, ya, bx: x + hx, bz: z + hz, yb, r: WALL_R, h: WALL_H, island: i });
      });
    }
    // Rocks (go round) and aether spike clusters (go round or jump them): these bail you.
    for (let n = Math.round(span * range(1.2, 1.8)); n > 0; n--) {
      const r = range(1.4, 2.4);
      place(r, 7, 0.7, (x, y, z) => w.hazards.push({ kind: 'rock', x, y, z, r, h: range(1.2, 2.2), island: i }));
    }
    for (let n = Math.round(span * range(0.5, 0.9)); n > 0; n--) {
      const r = range(1.6, 2.4);
      place(r, 9, 0.6, (x, y, z) => w.hazards.push({ kind: 'spike', x, y, z, r, h: range(1.6, 2.2), island: i }));
    }
  }
}
