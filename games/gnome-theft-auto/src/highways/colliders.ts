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
import { CITY_HALF, HIGHWAYS, ROAD_LINES, ROAD_WIDTH } from '../config';
import type { Box } from '../types';
import { deckSamples, skywayDefs, type DeckSample } from './deck';
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

/** Distance from (x, z) to the nearest road centre line: every highway, and the city grid streets inside Turfton. */
export function roadDistance(x: number, z: number): number {
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
      if (Math.abs(z) <= CITY_HALF) d = Math.min(d, Math.abs(x - v));
      if (Math.abs(x) <= CITY_HALF) d = Math.min(d, Math.abs(z - v));
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

const columnsClear = (c: { x: number; z: number }[]): boolean => c.every((p) => roadDistance(p.x, p.z) >= ROAD_KEEP);

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
      const due = lastAlong === -Infinity || s.along - lastAlong >= SKYWAY.bentSpacing || s.along - viaductStart < 1e-6;
      const lastSample = i === samples.length - 1;
      if (!due && !(lastSample && s.along - lastAlong > SKYWAY.bentSpacing / 3)) continue;
      const columns = columnsAt(s, def.width);
      if (!columnsClear(columns)) continue;
      out.push({ skyway: def.id, x: s.x, z: s.z, deckY: s.y, land: s.land, dirX: s.dirX, dirZ: s.dirZ, columns });
      lastAlong = s.along;
    }
  }
  return out;
}

/** The boxes a skyway adds to world.boxes: embankment walls on solid stretches, then the bent columns. */
export function skywayColliders(): Box[] {
  const boxes: Box[] = [];
  const t = 0.3;
  for (const def of skywayDefs()) {
    const samples = deckSamples(def.id, SKYWAY.sample);
    for (let i = 0; i + 1 < samples.length; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      if (!a.solid && !b.solid) continue;
      const top = Math.max(a.y, b.y) + SKYWAY.railHeight;
      const off = def.width / 2 + t;
      for (const side of [-1, 1]) {
        const ax = a.x + side * a.dirZ * off, az = a.z - side * a.dirX * off;
        const bx = b.x + side * a.dirZ * off, bz = b.z - side * a.dirX * off;
        boxes.push({
          minX: Math.min(ax, bx) - t, maxX: Math.max(ax, bx) + t,
          minZ: Math.min(az, bz) - t, maxZ: Math.max(az, bz) + t, h: top,
        });
      }
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
