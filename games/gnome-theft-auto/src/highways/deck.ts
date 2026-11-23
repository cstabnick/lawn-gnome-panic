// Skyway decks as ground: pure geometry over the data in skyways.ts. No three.js, no DOM.
//
// The land (terrain.ts heightAt) stays single-valued: it is the ground UNDER a skyway. A deck is a second level on top:
//   - groundAt(x, z, y) in terrain.ts is the one level-aware height query (land, bridges and decks);
//   - terrainProbe() (the wheel rays of every physics chassis) hits a deck top when the ray starts above it;
//   - pushOutOfDecks keeps a body on a deck inside its rails, and a body beside a deck out of its side.
// Profiles are built lazily from heightAt at the control points; resetDecks() drops them (terrain.ts calls it whenever
// the terrain options change).
import type { GroundHit, Vec3 } from '@lawn/vehicle';
import type { Pushed } from '../collide';
import { heightAt } from '../terrain';
import { SKYWAY, SKYWAYS, type SkywayDef } from './skyways';

interface Leg {
  ax: number; az: number; bx: number; bz: number;
  /** Unit direction a -> b and length. */
  dx: number; dz: number; len: number;
  /** Deck top (world y) at a and at b. */
  ya: number; yb: number;
  /** Centre-line distance from the skyway's start to a. */
  start: number;
}

interface Profile { def: SkywayDef; legs: Leg[]; length: number; minX: number; maxX: number; minZ: number; maxZ: number }

let profiles: Profile[] | null = null;

function buildProfile(def: SkywayDef): Profile {
  const legs: Leg[] = [];
  let start = 0;
  const pad = def.width / 2 + SKYWAY.columnSize + 2;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let k = 0; k + 1 < def.points.length; k++) {
    const a = def.points[k];
    const b = def.points[k + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1e-9;
    legs.push({
      ax: a.x, az: a.z, bx: b.x, bz: b.z, dx: (b.x - a.x) / len, dz: (b.z - a.z) / len, len,
      ya: heightAt(a.x, a.z) + a.h, yb: heightAt(b.x, b.z) + b.h, start,
    });
    start += len;
  }
  for (const p of def.points) {
    minX = Math.min(minX, p.x - pad); maxX = Math.max(maxX, p.x + pad);
    minZ = Math.min(minZ, p.z - pad); maxZ = Math.max(maxZ, p.z + pad);
  }
  return { def, legs, length: start, minX, maxX, minZ, maxZ };
}

function all(): Profile[] {
  if (!profiles) profiles = SKYWAYS.map(buildProfile);
  return profiles;
}

/** Forget the built profiles (deck heights follow the land at their control points). terrain.ts calls this. */
export function resetDecks(): void {
  profiles = null;
}

/** Every skyway definition. */
export function skywayDefs(): readonly SkywayDef[] {
  return SKYWAYS;
}

/** One point on a skyway's centre line. */
export interface DeckSample {
  skyway: string;
  x: number;
  z: number;
  /** Deck top, world y. */
  y: number;
  /** The land under the centre line here (heightAt). */
  land: number;
  /** Centre-line distance from the skyway's start. */
  along: number;
  /** Unit travel direction (start -> end). */
  dirX: number;
  dirZ: number;
  /** True where the deck is an embankment (y - land < SKYWAY.solidBelow), false where it is a viaduct. */
  solid: boolean;
}

function sampleAt(p: Profile, along: number): DeckSample {
  const a = Math.max(0, Math.min(p.length, along));
  let leg = p.legs[p.legs.length - 1];
  for (const l of p.legs) {
    if (a <= l.start + l.len) { leg = l; break; }
  }
  const t = Math.max(0, Math.min(leg.len, a - leg.start));
  const x = leg.ax + leg.dx * t;
  const z = leg.az + leg.dz * t;
  const y = leg.ya + ((leg.yb - leg.ya) * t) / leg.len;
  const land = heightAt(x, z);
  return { skyway: p.def.id, x, z, y, land, along: a, dirX: leg.dx, dirZ: leg.dz, solid: y - land < SKYWAY.solidBelow };
}

/** Samples along a skyway's centre line every `step` metres, both ends and every control point included, in order. */
export function deckSamples(id: string, step: number = SKYWAY.sample): DeckSample[] {
  const p = all().find((q) => q.def.id === id);
  if (!p) return [];
  const out: DeckSample[] = [];
  for (const leg of p.legs) {
    const n = Math.max(1, Math.ceil(leg.len / step));
    for (let i = 0; i < n; i++) out.push(sampleAt(p, leg.start + (leg.len * i) / n));
  }
  const last = p.legs[p.legs.length - 1];
  const end = sampleAt(p, p.length);
  // The last sample belongs to the last leg (sampleAt's search would hand a joint to the earlier leg).
  end.dirX = last.dx;
  end.dirZ = last.dz;
  out.push(end);
  return out;
}

/** Total centre-line length of a skyway, metres (0 for an unknown id). */
export function skywayLength(id: string): number {
  return all().find((q) => q.def.id === id)?.length ?? 0;
}

/** Where a point is relative to one skyway. */
export interface DeckContact {
  skyway: SkywayDef;
  /** Centre-line distance from the skyway's start to the nearest centre-line point. */
  along: number;
  /** Signed distance from the centre line (+ = right of the travel direction). */
  across: number;
  /** Distance from the nearest centre-line point (corners: from the joint). */
  dist: number;
  /** Nearest centre-line point. */
  cx: number;
  cz: number;
  /** Deck top at that point, world y. */
  surfaceY: number;
  /** Land under that centre-line point. */
  land: number;
  /** Embankment (true) or viaduct (false) here. */
  solid: boolean;
  /** Travel direction of the leg, and its grade (rise per metre along it). */
  dirX: number;
  dirZ: number;
  grade: number;
}

/** Nearest-leg contact for (x, z) within `reach` of the centre line, or null. Beyond the first or last point: null. */
function contactOf(p: Profile, x: number, z: number, reach: number): DeckContact | null {
  if (x < p.minX - reach || x > p.maxX + reach || z < p.minZ - reach || z > p.maxZ + reach) return null;
  let best: DeckContact | null = null;
  const lastK = p.legs.length - 1;
  for (let k = 0; k <= lastK; k++) {
    const l = p.legs[k];
    const t = (x - l.ax) * l.dx + (z - l.az) * l.dz;
    // The ends are cut square: nothing before the first point or after the last one.
    if ((k === 0 && t < 0) || (k === lastK && t > l.len)) continue;
    const tc = Math.max(0, Math.min(l.len, t));
    const cx = l.ax + l.dx * tc;
    const cz = l.az + l.dz * tc;
    const dist = Math.hypot(x - cx, z - cz);
    if (dist > reach) continue;
    if (best && dist >= best.dist) continue;
    const across = (x - l.ax) * l.dz - (z - l.az) * l.dx;
    const surfaceY = l.ya + ((l.yb - l.ya) * tc) / l.len;
    const land = heightAt(cx, cz);
    best = {
      skyway: p.def, along: l.start + tc, across, dist, cx, cz, surfaceY, land,
      solid: surfaceY - land < SKYWAY.solidBelow, dirX: l.dx, dirZ: l.dz, grade: (l.yb - l.ya) / l.len,
    };
  }
  return best;
}

/** Every deck whose footprint (between the rails) holds (x, z). Usually zero or one. */
export function deckContactsAt(x: number, z: number): DeckContact[] {
  const out: DeckContact[] = [];
  for (const p of all()) {
    const c = contactOf(p, x, z, p.def.width / 2);
    if (c) out.push(c);
  }
  return out;
}

/** The highest deck top over (x, z) at or below maxY, or null. */
export function deckSurfaceBelow(x: number, z: number, maxY: number): number | null {
  let best: number | null = null;
  for (const p of all()) {
    const c = contactOf(p, x, z, p.def.width / 2);
    if (c && c.surfaceY <= maxY && (best === null || c.surfaceY > best)) best = c.surfaceY;
  }
  return best;
}

/** The lowest viaduct underside over (x, z) that is above y, or null (cameras under a skyway stay below it). */
export function deckCeilingAbove(x: number, z: number, y: number): number | null {
  let best: number | null = null;
  for (const p of all()) {
    const c = contactOf(p, x, z, p.def.width / 2);
    if (!c || c.solid) continue;
    const under = c.surfaceY - SKYWAY.slab;
    if (under > y && (best === null || under < best)) best = under;
  }
  return best;
}

function deckNormal(c: DeckContact): Vec3 {
  const nx = -c.dirX * c.grade;
  const nz = -c.dirZ * c.grade;
  const l = Math.hypot(nx, 1, nz);
  return { x: nx / l, y: 1 / l, z: nz / l };
}

/**
 * Where a downward ray meets a deck top, or null. A ray that starts below a deck's top (a wheel under the viaduct)
 * never hits it, and a ray that starts outside every footprint misses (a wheel over the edge sees the land).
 */
export function castDeck(origin: Vec3, dir: Vec3, maxDist: number): GroundHit | null {
  if (dir.y > -0.2) return null;
  let best: GroundHit | null = null;
  for (const p of all()) {
    const half = p.def.width / 2;
    const c0 = contactOf(p, origin.x, origin.z, half);
    if (!c0 || origin.y < c0.surfaceY - 0.05) continue;
    let t = (origin.y - c0.surfaceY) / -dir.y;
    let c: DeckContact | null = c0;
    for (let i = 0; i < 4; i++) {
      const q = contactOf(p, origin.x + dir.x * t, origin.z + dir.z * t, half);
      if (!q) { c = null; break; }
      c = q;
      t = (origin.y - q.surfaceY) / -dir.y;
    }
    if (!c || !(t >= 0 && t <= maxDist)) continue;
    if (best && best.distance <= t) continue;
    best = { distance: t, normal: deckNormal(c), point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t, z: origin.z + dir.z * t } };
  }
  return best;
}

/**
 * Keep a circle (x, z, radius r) whose base is at height baseY out of the deck sides:
 *   - on a deck (baseY at or above its top minus SKYWAY.step): inside the rails;
 *   - beside one (lower, and tall enough to reach its side: an embankment, or a viaduct's slab): outside it.
 * Beyond a skyway's ends nothing pushes (a ramp foot is open; the Unfinished Span's end is a drop).
 * (nx, nz) is the last push direction; (0, 0) when nothing was hit.
 */
export function pushOutOfDecks(x: number, z: number, r: number, baseY: number): Pushed {
  let px = x, pz = z;
  let hit = false, nx = 0, nz = 0;
  for (const p of all()) {
    const half = p.def.width / 2;
    const c = contactOf(p, px, pz, half + r);
    if (!c || c.dist < 1e-6) continue;
    const ux = (px - c.cx) / c.dist;
    const uz = (pz - c.cz) / c.dist;
    const level = baseY >= c.surfaceY - SKYWAY.step;
    // Centre off the deck but level with its top (beside a ramp foot): free to step on, no wall.
    if (level && c.dist > half) continue;
    if (level) {
      if (c.dist <= half - r) continue;
      px = c.cx + ux * (half - r);
      pz = c.cz + uz * (half - r);
      nx = -ux; nz = -uz;
      hit = true;
    } else {
      const bottom = c.solid ? -Infinity : c.surfaceY - SKYWAY.slab;
      if (baseY + SKYWAY.bodyHeight <= bottom) continue;
      px = c.cx + ux * (half + r);
      pz = c.cz + uz * (half + r);
      nx = ux; nz = uz;
      hit = true;
    }
  }
  return hit ? { x: px, z: pz, hit, nx, nz } : { x, z, hit: false, nx: 0, nz: 0 };
}
