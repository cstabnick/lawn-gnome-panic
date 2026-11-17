// The ethereal plane: a seeded chain of floating islands that falls away downhill. Each island slopes toward the next,
// ends in a big kicker aimed across the gap, and has rollers, side kickers and rails to play on. Ley-lines (glowing
// grind rails in the sky) arc between islands. Past the last island an aether gate warps you back to the first.
// Pure: data + height queries, no rendering.
import * as THREE from 'three';

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
  /** Bounding sphere, for quick rejects. */
  center: THREE.Vector3;
  radius: number;
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

function makeRail(pts: THREE.Vector3[], ley: boolean): Rail {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const box = new THREE.Box3().setFromPoints(pts);
  const center = box.getCenter(new THREE.Vector3());
  let radius = 0;
  for (const p of pts) radius = Math.max(radius, p.distanceTo(center));
  return { pts, cum, len: cum[cum.length - 1], ley, center, radius };
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

export function generateWorld(seed: number): World {
  const rnd = mulberry32(seed);
  const range = (a: number, b: number): number => a + (b - a) * rnd();
  const islands: Island[] = [];
  const rails: Rail[] = [];
  const decor: Decor[] = [];
  const pipes: Pipe[] = [];
  const links: World['links'] = [];

  const makeRun = (id: number, cx: number, cz: number, yaw: number, r: number, st: number, slope: number): Island => {
    const waves = [
      { amp: range(1.5, 3.5), len: range(70, 130), phase: rnd() * 6.28 },
      { amp: range(0.6, 1.4), len: range(28, 50), phase: rnd() * 6.28 },
    ];
    return {
      id, cx, cz, r, baseY: 0, dx: Math.sin(yaw), dz: Math.cos(yaw), slope, stretch: st, waves,
      bank: { amp: range(0.04, 0.09), len: range(140, 260), phase: rnd() * 6.28 },
      joinStart: false, joinEnd: false, blendLen: 0, bumps: [], kickers: [], color: id % 6,
    };
  };

  let isl = makeRun(0, 0, 0, 0, 64, 3.4, 0.2);
  isl.baseY = 600;
  let yaw = 0;
  let gate: World['gate'] = { pos: new THREE.Vector3(), r: 16, yaw: 0 };

  for (let i = 0; i < RUNS; i++) {
    const { cx, cz, r, dx, dz, slope } = isl;
    const st = isl.stretch;
    const ra = r * st; // half-length down the fall line
    const link = i === RUNS - 1 ? 'jump' : LINK_CYCLE[i % LINK_CYCLE.length];
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
    const sideCount = Math.round(range(1.5, 2.5) * st);
    for (let k = 0; k < sideCount; k++) {
      const [x, z] = at(along01(-1, 0.95), (k % 2 === 0 ? 1 : -1) * range(0.15, 0.5) * r);
      isl.kickers.push({ x, z, yaw: yaw + range(-0.5, 0.5), len: range(6, 8), width: range(6, 8), height: range(1.8, 2.6), big: false });
    }
    // The exit: a big kicker for a jump.
    const len = 10;
    if (link === 'jump') {
      const [x, z] = at(ra - 2 - len, 0);
      isl.kickers.push({ x, z, yaw, len, width: 14, height: 3.4, big: true });
    }
    // Rails down the run, following the ground 1.1 m up.
    const railCount = Math.max(1, Math.round(range(0.5, 1.1) * st));
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
      if (pts.length > 8) rails.push(makeRail(pts, false));
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
    const nr = range(56, 72);
    const nst = range(2.6, 4.8);
    const nra = nr * nst;
    const nslope = range(0.16, 0.24);
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
      const vx = PLAN_SPEED * Math.cos(launch);
      const vy = PLAN_SPEED * Math.sin(launch);
      const drop = range(6, 12);
      const dist = vx * (vy + Math.sqrt(vy * vy + 2 * 30 * drop)) / 30;
      anchorX = lipX + dx * dist;
      anchorZ = lipZ + dz * dist;
      anchorY = lipY - drop;
      // Land on the top part of the next run, whose near end is at least GAP_MIN past the lip.
      upstream = Math.max(nra * 0.55, nra - (dist - GAP_MIN));
      if (i === RUNS - 1) {
        gate = { pos: new THREE.Vector3(anchorX, anchorY + 6, anchorZ), r: 16, yaw };
        break;
      }
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
    if (i % 2 === 1) {
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

  const s0 = islands[0];
  const sx = s0.cx - s0.dx * s0.r * s0.stretch * 0.85;
  const sz = s0.cz - s0.dz * s0.r * s0.stretch * 0.85;
  const spawn = { pos: new THREE.Vector3(sx, (surfaceY(s0, sx, sz) ?? s0.baseY), sz), heading: Math.atan2(s0.dx, s0.dz) };
  const lowest = islands.reduce((m, o) => Math.min(m, o.baseY - o.slope * o.r * o.stretch), Infinity);
  return { seed, islands, rails, pipes, links, spawn, gate, voidY: Math.min(lowest, gate.pos.y) - 90, decor };
}
