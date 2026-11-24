// Skyway colliders and column bents: pure (no three.js). mesh.ts draws what this file decides, so the drawn columns and
// the colliders in world.boxes are always the same ones.
//
//   - Embankment walls: on every solid stretch, a thin box along each rail, as tall as the rail top. They stop every body
//     that uses world.boxes (traffic, police, gnomes, cameras) from driving into a ramp's side, and keep a car on a ramp
//     inside its rails. Solid stretches lie on axis-aligned legs (skyways.ts rule), so the boxes are tight.
//   - Column bents: on viaduct stretches, a pair of square columns just outside the rails, at most SKYWAY.bentSpacing
//     apart. A column's box top is the deck underside, so a body on the deck (higher) ignores it.
// No column stands on a road: a bent that would land within ROAD_KEEP of a road centre line (highways and the city
// grid) slides along the deck until it is clear, or is dropped.
import { CITY_HALF, HIGHWAYS, ROAD_LINES, ROAD_PITCH, ROAD_WIDTH } from '../config';
import type { Box } from '../types';
import { deckContactsAt, deckSamples, skywayDefs, type DeckSample } from './deck';
import { SKYWAY } from './skyways';

/** A column centre must be at least this far from any road centre line. */
export const ROAD_KEEP = ROAD_WIDTH / 2 + 2.5;

export interface Bent {
  skyway: string;
  /** Centre-line point the bent stands under. */
  x: number;
  z: number;
  /** Deck top and the land there. */
  deckY: number;
  land: number;
  /** Unit travel direction of the deck. */
  dirX: number;
  dirZ: number;
  /** The two column centres (left, right), each SKYWAY.columnSize square, from the land up to deckY - SKYWAY.slab. */
  columns: [{ x: number; z: number }, { x: number; z: number }];
}

function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax, vz = bz - az;
  const l2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
  return Math.hypot(x - (ax + vx * t), z - (az + vz * t));
}

/**
 * The city street a deck sample runs right above (its centre line within 1 m of a grid line, travelling along it, inside
 * Turfton), or null. Columns of such a stretch stand on that street's pavements.
 */
export function followedStreet(s: { x: number; z: number; dirX: number; dirZ: number }): { axis: 'x' | 'z'; line: number } | null {
  const inCity = Math.abs(s.x) <= CITY_HALF && Math.abs(s.z) <= CITY_HALF;
  if (!inCity) return null;
  for (const v of ROAD_LINES) {
    if (Math.abs(s.dirZ) < 1e-6 && Math.abs(s.z - v) < 1) return { axis: 'z', line: v };
    if (Math.abs(s.dirX) < 1e-6 && Math.abs(s.x - v) < 1) return { axis: 'x', line: v };
  }
  return null;
}

/** A column next to a followed street keeps this far from its centre line (on the pavement, clear of the carriageway). */
export const PAVEMENT_KEEP = ROAD_WIDTH / 2 + 0.7;

/** Distance from (x, z) to the nearest road centre line: every highway, and the city grid streets inside Turfton. */
export function roadDistance(x: number, z: number, skip?: { axis: 'x' | 'z'; line: number } | null): number {
  let d = Infinity;
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      d = Math.min(d, segDist(x, z, ax, az, bx, bz));
    }
  }
  if (Math.abs(x) <= CITY_HALF + ROAD_KEEP && Math.abs(z) <= CITY_HALF + ROAD_KEEP) {
    for (const v of ROAD_LINES) {
      if (Math.abs(z) <= CITY_HALF && !(skip && skip.axis === 'x' && skip.line === v)) d = Math.min(d, Math.abs(x - v));
      if (Math.abs(x) <= CITY_HALF && !(skip && skip.axis === 'z' && skip.line === v)) d = Math.min(d, Math.abs(z - v));
    }
  }
  return d;
}

function columnsAt(s: DeckSample, width: number): [{ x: number; z: number }, { x: number; z: number }] {
  const off = width / 2 + SKYWAY.columnSize / 2 + 0.3;
  // Right of travel = (dirZ, -dirX).
  return [
    { x: s.x - s.dirZ * off, z: s.z + s.dirX * off },
    { x: s.x + s.dirZ * off, z: s.z - s.dirX * off },
  ];
}

/** True when a column at (x, z) of skyway `id` would stand inside (or right beside) another deck's footprint. */
function underOtherDeck(id: string, x: number, z: number): boolean {
  const r = SKYWAY.columnSize;
  for (const dx of [0, r, -r]) {
    for (const dz of [0, r, -r]) {
      if (deckContactsAt(x + dx, z + dz).some((c) => c.skyway.id !== id)) return true;
    }
  }
  return false;
}

/**
 * Columns are clear when they keep ROAD_KEEP from every road centre line, except the city street the deck runs above,
 * from which they keep PAVEMENT_KEEP (they stand on its pavements), and stand under no other deck.
 */
function columnsClear(id: string, s: DeckSample, c: { x: number; z: number }[]): boolean {
  const street = followedStreet(s);
  return c.every((p) => roadDistance(p.x, p.z, street) >= ROAD_KEEP
    && (!street || Math.abs((street.axis === 'z' ? p.z : p.x) - street.line) >= PAVEMENT_KEEP)
    && !underOtherDeck(id, p.x, p.z));
}

/**
 * Above a city street the bents stand mid-block only (half a block from every crossing street): clear of the crossings,
 * the street lamps and the corner props. True when a sample there is a mid-block point (within 1 m).
 */
function midBlock(s: DeckSample): boolean {
  const street = followedStreet(s);
  if (!street) return true;
  const u = street.axis === 'z' ? s.x : s.z;
  return ROAD_LINES.some((v) => Math.abs(Math.abs(u - v) - ROAD_PITCH / 2) < 1);
}

/** Every column bent of every skyway, in order along each one. */
export function skywayBents(): Bent[] {
  const out: Bent[] = [];
  for (const def of skywayDefs()) {
    const samples = deckSamples(def.id, 2);
    let lastAlong = -Infinity;
    let viaductStart = -Infinity;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.solid) { viaductStart = -Infinity; continue; }
      if (viaductStart === -Infinity) viaductStart = s.along;
      // The first bent of a stretch where it starts (the end of the embankment), then every bentSpacing; a bent that
      // would stand on a road is pushed on to the next clear sample.
      const street = followedStreet(s);
      const due = street
        ? midBlock(s) && s.along - lastAlong > 4
        : lastAlong === -Infinity || s.along - lastAlong >= SKYWAY.bentSpacing || s.along - viaductStart < 1e-6;
      const lastSample = i === samples.length - 1;
      if (!due && !(lastSample && !street && s.along - lastAlong > SKYWAY.bentSpacing / 3)) continue;
      // Keep the drop under a crack clear: no bent within 3 m of its gap.
      if ((def.cracks ?? []).some((c) => Math.abs(s.along - c.along) < c.length / 2 + 3)) continue;
      const columns = columnsAt(s, def.width);
      if (!columnsClear(def.id, s, columns)) continue;
      out.push({ skyway: def.id, x: s.x, z: s.z, deckY: s.y, land: s.land, dirX: s.dirX, dirZ: s.dirZ, columns });
      lastAlong = s.along;
    }
  }
  return out;
}

/**
 * Where the side-`side` rail line of a corner sample `p` meets the rail line of the next segment, i.e. the mitre point
 * of the corner. The incoming segment (unit dir d1) and the outgoing one (unit dir d2) each carry their rail offset
 * (side * dz, -side * dx) * off; the two offset lines cross at the mitre. Walls end there: the outer side closes with no
 * gap, the inner side stops short of the other road. Null when the lines are parallel or the mitre is too far out.
 */
type Dir = { x: number; z: number };

function mitreAt(p: { x: number; z: number }, d1: Dir, d2: Dir, side: number, off: number) {
  const cross = d1.x * d2.z - d1.z * d2.x;
  if (Math.abs(cross) < 1e-6) return null;
  const n1x = side * d1.z * off, n1z = -side * d1.x * off;
  const n2x = side * d2.z * off, n2z = -side * d2.x * off;
  // p + n1 + t*d1 = p + n2 + u*d2, solved for t (Cramer's rule).
  const rx = n2x - n1x, rz = n2z - n1z;
  const t = (-rx * d2.z + d2.x * rz) / -cross;
  const x = p.x + n1x + t * d1.x, z = p.z + n1z + t * d1.z;
  if (Math.hypot(x - p.x, z - p.z) > 2.5 * off) return null;
  return { x, z };
}

/** The boxes a skyway adds to world.boxes: embankment walls on solid stretches, then the bent columns. */
export function skywayColliders(): Box[] {
  const boxes: Box[] = [];
  const t = 0.3;
  for (const def of skywayDefs()) {
    const samples = deckSamples(def.id, SKYWAY.sample);
    const off = def.width / 2 + t;
    const n = samples.length - 1;
    // Unit travel direction of segment i (samples i -> i+1), or null for a zero-length segment.
    const dirOf = (i: number) => {
      const a = samples[i], b = samples[i + 1];
      const l = Math.hypot(b.x - a.x, b.z - a.z);
      return l < 1e-9 ? null : { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
    };
    // Wall point at sample k on `side`, between the incoming direction d1 and the outgoing d2: the mitre where they
    // turn, else the offset point along the leg.
    const at = (k: number, side: number, d1: Dir, d2: Dir): { x: number; z: number } => {
      const p = samples[k];
      if (d1.x * d2.x + d1.z * d2.z < 0.999) {
        const m = mitreAt(p, d1, d2, side, off);
        if (m) return m;
      }
      return { x: p.x + side * d2.z * off, z: p.z - side * d2.x * off };
    };
    // Walk the straight legs (runs of segments with one direction). Each wall is cut along a leg, and its ends at a
    // corner are the mitre, so the outer side closes and the inner side stops short of the other road.
    let i0 = 0;
    while (i0 < n) {
      const d = dirOf(i0);
      if (!d) { i0++; continue; }
      let i1 = i0 + 1;
      while (i1 < n) {
        const e = dirOf(i1);
        if (!e || d.x * e.x + d.z * e.z < 0.999) break;
        i1++;
      }
      const before = i0 > 0 ? dirOf(i0 - 1) ?? d : d;
      const after = i1 < n ? dirOf(i1) ?? d : d;
      const dirAtSample = (k: number): [Dir, Dir] => [k === i0 ? before : d, k === i1 ? after : d];
      // Contiguous runs of walled segments inside this leg (a solid stretch, away from another deck's junction).
      const walled = (j: number) => {
        const a = samples[j], b = samples[j + 1];
        if (!a.solid && !b.solid) return false;
        return !deckContactsAt(a.x, a.z).some((c) => c.skyway.id !== def.id) && !deckContactsAt(b.x, b.z).some((c) => c.skyway.id !== def.id);
      };
      let j = i0;
      while (j < i1) {
        if (!walled(j)) { j++; continue; }
        const p0 = j;
        while (j < i1 && walled(j)) j++;
        const p1 = j;
        let y = -Infinity;
        for (let k = p0; k <= p1; k++) y = Math.max(y, samples[k].y);
        const top = y + SKYWAY.railHeight;
        for (const side of [-1, 1]) {
          const [s1, s2] = dirAtSample(p0);
          const [e1, e2] = dirAtSample(p1);
          const s = at(p0, side, s1, s2);
          const e = at(p1, side, e1, e2);
          boxes.push({
            minX: Math.min(s.x, e.x) - t, maxX: Math.max(s.x, e.x) + t,
            minZ: Math.min(s.z, e.z) - t, maxZ: Math.max(s.z, e.z) + t, h: top,
          });
        }
      }
      i0 = i1;
    }
  }
  const half = SKYWAY.columnSize / 2;
  for (const bent of skywayBents()) {
    for (const c of bent.columns) {
      boxes.push({ minX: c.x - half, maxX: c.x + half, minZ: c.z - half, maxZ: c.z + half, h: bent.deckY - SKYWAY.slab });
    }
  }
  return boxes;
}
