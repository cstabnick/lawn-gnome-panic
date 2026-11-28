// The Gutter Bowls' ridable shape (batch 3 E19): SKATE_PIECES as one height function, the rails in world coordinates,
// the ground the board rides (terrain + park), and stepped colliders so walkers and vehicles respect the pieces.
import type { Box } from '../types';
import { heightAt, surfaceAt } from '../terrain';
import { SKATE_ORIGIN, SKATE_PIECES, SKATE_RAILS, SKATE_SITE } from './types';
import type { SkateGround, SkatePiece, SkateRail } from './types';

/** Profile of a trough / bowl at distance `d` from its centre line (or centre): null outside. */
function profile(p: { flat: number; radius: number; height: number; deck: number }, d: number): number | null {
  if (d <= p.flat) return 0;
  const t = d - p.flat;
  const tEnd = Math.sqrt(p.radius * p.radius - (p.radius - p.height) * (p.radius - p.height));
  if (t <= tEnd) return p.radius - Math.sqrt(p.radius * p.radius - t * t);
  if (t <= tEnd + p.deck) return p.height;
  return null;
}

/** Height of one piece above the ground at park-frame (u, v), or null when (u, v) is outside the piece. */
export function pieceHeight(p: SkatePiece, u: number, v: number): number | null {
  switch (p.kind) {
    case 'halfpipe':
      if (u < p.u0 || u > p.u1) return null;
      return profile(p, Math.abs(v - p.v));
    case 'bowl':
      return profile(p, Math.hypot(u - p.u, v - p.v));
    case 'wedge': {
      const du = u - p.u, dv = v - p.v;
      const along = du * Math.sin(p.yaw) + dv * Math.cos(p.yaw);
      const across = du * Math.cos(p.yaw) - dv * Math.sin(p.yaw);
      if (along < 0 || along > p.length || Math.abs(across) > p.width / 2) return null;
      return (along / p.length) * p.height;
    }
    case 'box':
      return Math.abs(u - p.u) <= p.hw && Math.abs(v - p.v) <= p.hd ? p.height : null;
    case 'stairs': {
      const du = u - p.u, dv = v - p.v;
      const along = du * Math.sin(p.yaw) + dv * Math.cos(p.yaw);
      const across = du * Math.cos(p.yaw) - dv * Math.sin(p.yaw);
      if (along < 0 || along >= p.steps * p.run || Math.abs(across) > p.width / 2) return null;
      return p.top - (Math.floor(along / p.run) + 1) * p.rise;
    }
  }
}

interface Rect { minU: number; maxU: number; minV: number; maxV: number }

function reach(p: { flat: number; radius: number; height: number; deck: number }): number {
  return p.flat + Math.sqrt(p.radius * p.radius - (p.radius - p.height) * (p.radius - p.height)) + p.deck;
}

/** Park-frame bounding rect of a piece. */
function pieceRect(p: SkatePiece): Rect {
  switch (p.kind) {
    case 'halfpipe': {
      const e = reach(p);
      return { minU: p.u0, maxU: p.u1, minV: p.v - e, maxV: p.v + e };
    }
    case 'bowl': {
      const e = reach(p);
      return { minU: p.u - e, maxU: p.u + e, minV: p.v - e, maxV: p.v + e };
    }
    case 'box':
      return { minU: p.u - p.hw, maxU: p.u + p.hw, minV: p.v - p.hd, maxV: p.v + p.hd };
    case 'wedge':
    case 'stairs': {
      const len = p.kind === 'wedge' ? p.length : p.steps * p.run;
      const s = Math.sin(p.yaw), c = Math.cos(p.yaw), hw = p.width / 2;
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (const a of [0, len]) {
        for (const b of [-hw, hw]) {
          const u = p.u + a * s + b * c, v = p.v + a * c - b * s;
          minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v);
        }
      }
      return { minU, maxU, minV, maxV };
    }
  }
}

const RECTS: Rect[] = SKATE_PIECES.map(pieceRect);

/** Height of the park's pieces above the ground at world (x, z): the highest piece there, 0 outside every piece. */
export function parkHeight(x: number, z: number): number {
  const u = x - SKATE_ORIGIN.x, v = z - SKATE_ORIGIN.z;
  let best = 0;
  for (let i = 0; i < SKATE_PIECES.length; i++) {
    const r = RECTS[i];
    if (u < r.minU || u > r.maxU || v < r.minV || v > r.maxV) continue;
    const h = pieceHeight(SKATE_PIECES[i], u, v);
    if (h !== null && h > best) best = h;
  }
  return best;
}

let railCache: SkateRail[] | null = null;

/** SKATE_RAILS in world coordinates (y absolute: the ground height there plus the rail's height). */
export function parkRails(): SkateRail[] {
  if (!railCache) {
    railCache = SKATE_RAILS.map((r) => {
      const ax = SKATE_ORIGIN.x + r.a.u, az = SKATE_ORIGIN.z + r.a.v;
      const bx = SKATE_ORIGIN.x + r.b.u, bz = SKATE_ORIGIN.z + r.b.v;
      return { id: r.id, ax, ay: heightAt(ax, az) + r.a.y, az, bx, by: heightAt(bx, bz) + r.b.y, bz };
    });
  }
  return railCache;
}

const PAVED = new Set(['asphalt', 'gravel', 'rock', 'ice']);
let groundCache: SkateGround | null = null;

/** The ground a skateboard rides anywhere in the world: terrain plus the park, paved surfaces, the park's rails. */
export function skateGround(): SkateGround {
  if (!groundCache) {
    groundCache = {
      height: (x, z) => heightAt(x, z) + parkHeight(x, z),
      paved: (x, z) =>
        (x >= SKATE_SITE.minX && x <= SKATE_SITE.maxX && z >= SKATE_SITE.minZ && z <= SKATE_SITE.maxZ) ||
        PAVED.has(surfaceAt(x, z)),
      rails: parkRails(),
    };
  }
  return groundCache;
}

const CELL = 0.5;
let boxCache: Box[] | null = null;

/** Colliders for walkers and vehicles: the pieces as boxes whose tops never rise above the ridable surface. */
export function parkBoxes(): Box[] {
  if (boxCache) return boxCache;
  const out: Box[] = [];
  SKATE_PIECES.forEach((p, i) => {
    if (p.kind === 'box') {
      const x = SKATE_ORIGIN.x + p.u, z = SKATE_ORIGIN.z + p.v;
      out.push({ minX: x - p.hw, maxX: x + p.hw, minZ: z - p.hd, maxZ: z + p.hd, h: heightAt(x, z) + p.height });
      return;
    }
    const r = RECTS[i];
    const u0 = Math.floor(r.minU / CELL), u1 = Math.ceil(r.maxU / CELL);
    const v0 = Math.floor(r.minV / CELL), v1 = Math.ceil(r.maxV / CELL);
    for (let cv = v0; cv < v1; cv++) {
      let from = 0, to = 0, rh = 0, open = false;
      const flush = () => {
        if (!open) return;
        const cx = SKATE_ORIGIN.x + ((from + to) * CELL) / 2;
        const cz = SKATE_ORIGIN.z + (cv + 0.5) * CELL;
        out.push({
          minX: SKATE_ORIGIN.x + from * CELL, maxX: SKATE_ORIGIN.x + to * CELL,
          minZ: SKATE_ORIGIN.z + cv * CELL, maxZ: SKATE_ORIGIN.z + (cv + 1) * CELL,
          h: heightAt(cx, cz) + rh,
        });
        open = false;
      };
      for (let cu = u0; cu < u1; cu++) {
        const h = cellHeight(p, cu * CELL, cv * CELL);
        if (h === null) { flush(); continue; }
        if (open && Math.abs(rh - h) < 1e-9) to = cu + 1;
        else { flush(); from = cu; to = cu + 1; rh = h; open = true; }
      }
      flush();
    }
  });
  boxCache = out;
  return out;
}

/** Collider height of one grid cell (park-frame corner u, v): the lowest sample, rounded down to 0.1; null when skipped. */
function cellHeight(p: SkatePiece, u: number, v: number): number | null {
  const pts: Array<[number, number]> = [
    [u, v], [u + CELL, v], [u, v + CELL], [u + CELL, v + CELL], [u + CELL / 2, v + CELL / 2],
  ];
  // A trough or bowl profile only rises away from its flat, so its lowest point is the cell point nearest the flat.
  if (p.kind === 'halfpipe') pts.push([u + CELL / 2, Math.min(v + CELL, Math.max(v, p.v))]);
  if (p.kind === 'bowl') pts.push([Math.min(u + CELL, Math.max(u, p.u)), Math.min(v + CELL, Math.max(v, p.v))]);
  let m = Infinity;
  for (const [pu, pv] of pts) {
    const h = pieceHeight(p, pu, pv);
    if (h === null) return null;
    if (h < m) m = h;
  }
  const q = Math.floor(m * 10 + 1e-9) / 10;
  return q < 0.1 - 1e-9 ? null : q;
}
