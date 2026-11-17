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
const ISLANDS = 22;
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
  let y = isl.baseY - isl.slope * (ox * isl.dx + oz * isl.dz);
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
    const y = surfaceY(isl, x, z);
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
    surfaceNormal(best, x, z, g.normal);
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

/** Typical speed off a big kicker, for spacing the next island (the landing zone covers about 22..48 m/s). */
const PLAN_SPEED = 32;
/** Horizontal clearance between a kicker's lip and the next island's near rim (m). */
const GAP_MIN = 16;

export function generateWorld(seed: number): World {
  const rnd = mulberry32(seed);
  const range = (a: number, b: number): number => a + (b - a) * rnd();
  const islands: Island[] = [];
  const rails: Rail[] = [];
  const decor: Decor[] = [];
  const pipes: Pipe[] = [];

  let yaw = 0;
  let cx = 0;
  let cz = 0;
  let r = 58;
  let st = 1; // this island's stretch (along radius = r * st)
  let baseY = 240;
  let gate: World['gate'] = { pos: new THREE.Vector3(), r: 16, yaw: 0 };

  for (let i = 0; i < ISLANDS; i++) {
    const dx = Math.sin(yaw);
    const dz = Math.cos(yaw);
    const slope = i === 0 ? 0.2 : range(0.15, 0.26);
    const isl: Island = { id: i, cx, cz, r, baseY, dx, dz, slope, stretch: st, bumps: [], kickers: [], color: i % 6 };
    islands.push(isl);
    const ra = r * st; // along the fall line

    // Exit kicker: lip 2 m in from the rim, straight down the fall line.
    const len = 10;
    const big: Kicker = {
      x: cx + dx * (ra - 2 - len), z: cz + dz * (ra - 2 - len), yaw, len, width: 13, height: 3.4, big: true,
    };

    // Rollers: smooth hills and dips away from the spawn end and the exit kicker.
    const bumpCount = Math.round((3 + Math.floor(rnd() * 3)) * st);
    for (let b = 0; b < bumpCount; b++) {
      // Off the line to the exit kicker (rollers to play on, not speed traps).
      const along = range(-0.3, 0.45) * ra;
      const side = (rnd() < 0.5 ? -1 : 1) * range(0.22, 0.6) * r;
      isl.bumps.push({
        x: cx + dx * along + dz * side, z: cz + dz * along - dx * side,
        r: range(5, 10), h: rnd() < 0.75 ? range(1.2, 2.8) : -range(0.8, 1.6),
      });
    }
    // Side kickers: small, angled off the fall line.
    const sideCount = Math.round((1 + Math.floor(rnd() * 2)) * st);
    for (let k = 0; k < sideCount; k++) {
      const along = range(-0.5, 0.45) * ra;
      const side = (k % 2 === 0 ? 1 : -1) * range(0.25, 0.5) * r;
      isl.kickers.push({
        x: cx + dx * along + dz * side, z: cz + dz * along - dx * side,
        yaw: yaw + range(-0.5, 0.5), len: 6, width: 6, height: 2.1, big: false,
      });
    }
    // Every fourth gap is a halfpipe chute instead of a jump (never the first or the last).
    const pipeHere = i % 4 === 2 && i < ISLANDS - 1;
    if (!pipeHere) isl.kickers.push(big);

    // A plain rail down part of the slope, on most islands.
    if (i > 0 && rnd() < 0.7) {
      const side = (rnd() < 0.5 ? 1 : -1) * range(0.3, 0.5) * r;
      const a0 = range(-0.35, -0.05) * ra;
      const railLen = range(16, 26) * st; // long islands get long rails
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= railLen; s += 1) {
        const along = a0 + s;
        const x = cx + dx * along + dz * side;
        const z = cz + dz * along - dx * side;
        const y = isl.baseY - slope * along; // the base plane: bumps do not lift the rail
        pts.push(new THREE.Vector3(x, y + 1.1, z));
      }
      rails.push(makeRail(pts, false));
    }

    // Where a typical launch off the exit kicker comes down.
    const lipX = cx + dx * (ra - 2);
    const lipZ = cz + dz * (ra - 2);
    const lipY = (surfaceY(isl, lipX - dx * 0.01, lipZ - dz * 0.01) ?? baseY) + 0.01;
    const launch = 0.42; // rad above horizontal, roughly
    const vx = PLAN_SPEED * Math.cos(launch);
    const vy = PLAN_SPEED * Math.sin(launch);
    const drop = range(6, 12);
    const tFlight = (vy + Math.sqrt(vy * vy + 2 * 30 * drop)) / 30;
    const dist = vx * tFlight;
    let landX = lipX + dx * dist;
    let landZ = lipZ + dz * dist;
    let landY = lipY - drop;
    // How far upstream of the next island's centre the landing (or pipe end) sits, as a share of its radius.
    let upstream = 0.55;
    if (pipeHere) {
      const startX = cx + dx * (ra - r * 0.38);
      const startZ = cz + dz * (ra - r * 0.38);
      const y0 = surfaceY(isl, startX, startZ) ?? baseY;
      const plen = range(85, 115);
      pipes.push({ from: i, sx: startX, sz: startZ, yaw, len: plen, y0, slope, halfW: 9, flatHalf: 3.5, wallH: 7.5, exp: 2.6 });
      landX = startX + dx * plen;
      landZ = startZ + dz * plen;
      landY = y0 - slope * plen;
      upstream = 0.72;
    }

    if (i === ISLANDS - 1) {
      gate = { pos: new THREE.Vector3(landX, landY + 6, landZ), r: 16, yaw };
      break;
    }

    // Next island: the landing point sits 55 % of its radius upstream of its centre (faster riders fly further and
    // still land on it). Turn a little, but never back
    // over an island we already placed.
    const nr = range(48, 62);
    // Some islands are long: a stretched ellipse down the fall line (more room for rollers, rails and lines).
    const nst = rnd() < 0.45 ? range(1.4, 2.2) : 1;
    const nra = nr * nst;
    // A jump's next island must start clear of this one: its near rim at least GAP_MIN past the lip, so a long
    // island never reaches back over the kicker (you would land inside it). Long islands land nearer their start.
    if (!pipeHere) upstream = Math.min(0.88, Math.max(upstream, 1 - (dist - GAP_MIN) / nra));
    let nyaw = yaw;
    let ncx = 0;
    let ncz = 0;
    for (let tries = 0; tries < 12; tries++) {
      nyaw = yaw + range(-0.4, 0.4);
      if (pipeHere) nyaw = yaw + range(-0.15, 0.15); // a chute runs straight into the next island
      ncx = landX + Math.sin(nyaw) * nra * upstream;
      ncz = landZ + Math.cos(nyaw) * nra * upstream;
      // Never over an island already placed, and clear of the one we are leaving.
      const clash = islands.some((o) => o.id < i && Math.hypot(o.cx - ncx, o.cz - ncz) < o.r * o.stretch + nra + 12)
        || Math.hypot(cx - ncx, cz - ncz) < ra + (1 - upstream) * nra + GAP_MIN * 0.5;
      if (!clash) break;
    }
    const nslope = range(0.15, 0.26);
    // Surface at the landing point = landY: baseY - slope * (-upstream r).
    const nbase = landY - nslope * upstream * nra;

    // Every third gap: a ley-line from beside the exit kicker arcing high over to the next island.
    if (i % 3 === 1) {
      const side = (rnd() < 0.5 ? 1 : -1) * range(0.35, 0.5) * r;
      const sx = cx + dx * (ra * 0.35) + dz * side;
      const sz = cz + dz * (ra * 0.35) - dx * side;
      const sy = (surfaceY(isl, sx, sz) ?? baseY) + 1.2;
      const p0 = new THREE.Vector3(sx, sy, sz);
      const ex = ncx - Math.sin(nyaw) * nra * 0.1 + Math.cos(nyaw) * side * 0.6;
      const ez = ncz - Math.cos(nyaw) * nra * 0.1 - Math.sin(nyaw) * side * 0.6;
      const ey = nbase + nslope * nra * 0.1 + 1.6; // 1.6 m above the surface where it ends
      const p2 = new THREE.Vector3(ex, ey, ez);
      const p1 = p0.clone().lerp(p2, 0.5);
      p1.y = Math.max(p0.y, p2.y) + range(8, 16);
      p1.x += dz * side * 0.4;
      p1.z -= dx * side * 0.4;
      rails.push(makeRail(bezier(p0, p1, p2), true));
    }

    // Decor around the gap: drifting rocks, crystals, clouds.
    for (let d = 0; d < 7; d++) {
      const t = rnd();
      const off = range(30, 90) * (rnd() < 0.5 ? 1 : -1);
      decor.push({
        x: lipX + (landX - lipX) * t + dz * off, z: lipZ + (landZ - lipZ) * t - dx * off,
        y: landY + range(-40, 30), s: range(2, 9), kind: rnd() < 0.45 ? 'rock' : rnd() < 0.6 ? 'crystal' : 'cloud', rot: rnd() * 6.28,
      });
    }

    yaw = nyaw;
    cx = ncx;
    cz = ncz;
    r = nr;
    st = nst;
    baseY = nbase;
  }

  const s0 = islands[0];
  const sx = s0.cx - s0.dx * s0.r * s0.stretch * 0.62;
  const sz = s0.cz - s0.dz * s0.r * s0.stretch * 0.62;
  const spawn = { pos: new THREE.Vector3(sx, (surfaceY(s0, sx, sz) ?? s0.baseY), sz), heading: Math.atan2(s0.dx, s0.dz) };
  const lowest = islands.reduce((m, isl) => Math.min(m, isl.baseY), Infinity);
  return { seed, islands, rails, pipes, spawn, gate, voidY: Math.min(lowest, gate.pos.y) - 90, decor };
}
