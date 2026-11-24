// Painted marks for the Turfton grid (docs/roadmaps/gta-parks-and-fringe.md): crosswalks at every crossing that has
// none, manholes, drains, oil stains, chalk on the sidewalks, and graffiti and posters on street-facing walls in Old
// Brick, the industrial quarter and Park & Arts. Adds to `plan.marks` only; the rules keep marks from overlapping.
import { mulberry32 } from '@lawn/level';
import { CITY_HALF, ROAD_LINES } from '../config';
import { districtAt } from '../districts';
import { heightAt } from '../terrain';
import type { Site } from './site';
import type { DressPlan, Mark, MarkTile } from './types';

const LIFT = 0.045;
const STRIPES = [-3.6, -2.2, -0.8, 0.8, 2.2, 3.6];
const WALL_TILES: readonly MarkTile[] = ['tag-a', 'tag-b', 'tag-c', 'tag-d', 'poster-a', 'poster-b', 'poster-c'];
const MAX_WALL = 60;

const nearCrossing = (t: number, gap: number): boolean => ROAD_LINES.some((c) => Math.abs(t - c) < gap);

export function planMarks(site: Site, plan: DressPlan): void {
  const rnd = mulberry32(9090);
  const flat = (tile: MarkTile, x: number, z: number, yaw: number, w: number, h: number): void => {
    plan.marks.push({ tile, x, y: heightAt(x, z) + LIFT, z, yaw, w, h, upright: false });
  };

  // 1. Crosswalks at every crossing but the nine downtown ones (districts.ts has those).
  for (const ix of ROAD_LINES) {
    for (const iz of ROAD_LINES) {
      if (Math.abs(ix) <= 60 && Math.abs(iz) <= 60) continue;
      for (const s of [-1, 1]) {
        for (const off of STRIPES) {
          flat('stripe', ix + off, iz + s * 7.2, 0, 0.7, 2.6);
          flat('stripe', ix + s * 7.2, iz + off, 0, 2.6, 0.7);
        }
      }
    }
  }

  // 2-5. Along every street: (x, z) of a point `t` along the street `w` at `off` from its centre line.
  const at = (axis: 'x' | 'z', w: number, t: number, off: number): [number, number] => (axis === 'x' ? [t, w + off] : [w + off, t]);
  for (const axis of ['x', 'z'] as const) {
    // A street along x has yaw 0 for things laid along it; along z, PI / 2.
    const along = axis === 'x' ? 0 : Math.PI / 2;
    for (const w of ROAD_LINES) {
      for (let t = -200; t <= 200; t += 30) {
        if (nearCrossing(t, 12)) continue;
        const [x, z] = at(axis, w, t, 2.5);
        flat('manhole', x, z, 0, 0.9, 0.9);
      }
      let side = 1;
      for (let t = -205; t <= 205; t += 24) {
        if (nearCrossing(t, 12)) continue;
        const [x, z] = at(axis, w, t, 4.55 * side);
        flat('drain', x, z, along, 0.9, 0.45);
        side = -side;
      }
      for (let t = -205; t <= 205; t += 10) {
        const r = rnd(), s = rnd() < 0.5 ? -1 : 1, yaw = rnd() * Math.PI, c = rnd(), cs = rnd() < 0.5 ? -1 : 1;
        if (nearCrossing(t, 12)) continue;
        if (r < 0.15) {
          const [x, z] = at(axis, w, t, 3.4 * s);
          flat('oil', x, z, yaw, 1.0, 0.6);
        }
        const [cx, cz] = at(axis, w, t, 6.3 * cs);
        const d = districtAt(cx, cz);
        if (c < 0.05 && (d === 'park-arts' || d === null) && Math.abs(cx) <= CITY_HALF && Math.abs(cz) <= CITY_HALF) {
          flat('chalk', cx, cz, along, 0.8, 2.0);
        }
      }
    }
  }

  // 6. Graffiti and posters on street-facing walls.
  let walls = 0;
  for (const b of site.world.boxes) {
    if (walls >= MAX_WALL) break;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    if (Math.abs(cx) > CITY_HALF || Math.abs(cz) > CITY_HALF) continue;
    const g = heightAt(cx, cz);
    if (b.h - g < 2.5) continue;
    // Candidate faces: [face centre x, z, outward yaw, face length, distance to the nearest parallel street].
    const faces: [number, number, number, number][] = [
      [cx, b.minZ, Math.PI, b.maxX - b.minX], [cx, b.maxZ, 0, b.maxX - b.minX],
      [b.minX, cz, -Math.PI / 2, b.maxZ - b.minZ], [b.maxX, cz, Math.PI / 2, b.maxZ - b.minZ],
    ];
    for (const [fx, fz, yaw, len] of faces) {
      if (len < 3) continue;
      const facesZ = Math.abs(Math.cos(yaw)) > 0.5; // the face looks along z: the street runs along x at some z.
      const v = facesZ ? fz : fx;
      const dir = facesZ ? Math.cos(yaw) : Math.sin(yaw);
      // The street the face looks at: the nearest road line on its outward side, 9-16 m away.
      const street = ROAD_LINES.find((w) => (w - v) * dir > 0 && Math.abs(w - v) >= 9 && Math.abs(w - v) <= 16);
      if (street === undefined) continue;
      const d = districtAt(fx, fz);
      if (d !== 'old-brick' && d !== 'industrial' && d !== 'park-arts') continue;
      const tile = WALL_TILES[Math.floor(rnd() * WALL_TILES.length)];
      const poster = tile.startsWith('poster');
      const ox = Math.sin(yaw) * 0.04, oz = Math.cos(yaw) * 0.04;
      const m: Mark = { tile, x: fx + ox, y: heightAt(fx, fz) + 1.6, z: fz + oz, yaw, w: poster ? 1.0 : 2.2, h: poster ? 1.4 : 1.3, upright: true };
      plan.marks.push(m);
      walls++;
      break;
    }
  }
}
