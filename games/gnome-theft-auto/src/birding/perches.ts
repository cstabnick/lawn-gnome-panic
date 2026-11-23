// Birding: perch spots (roofs, fence and wall tops, tree and post tops, ground, water and shore).
import type { Box } from '../types';
import type { PerchKind, PerchSpot } from './types';

export interface PerchIndex {
  /** Writes a perch of one of `kinds` (tried in order) within `radius` of (x, z) into `out`; false when none. */
  find(kinds: readonly PerchKind[], x: number, z: number, radius: number, rnd: () => number, out: PerchSpot): boolean;
  /** Box perches indexed so far (0 until the first find). */
  size(): number;
}

type BoxClass = 'roof' | 'fence' | 'tree';

interface Entry { b: Box; kind: BoxClass }

const CELL = 32;

/** What a collider is to a bird: a roof, a fence or wall top, a tree or post top, or nothing (null). */
export function classifyBox(b: Box, groundY: number): BoxClass | null {
  const height = b.h - groundY;
  if (height < 0.6 || height > 25) return null;
  const w = b.maxX - b.minX;
  const d = b.maxZ - b.minZ;
  const short = Math.min(w, d);
  const long = Math.max(w, d);
  if (long <= 1.6 && height >= 1.5) return 'tree';
  if (short <= 0.8 && long >= 1.6 && height <= 3.5) return 'fence';
  if (short >= 2.5 && height >= 2) return 'roof';
  return null;
}

export function createPerchIndex(
  boxes: readonly Box[], ground: (x: number, z: number) => number, water: (x: number, z: number) => number | null,
): PerchIndex {
  // Built lazily and rebuilt when the box list grows. Keys are numbers: cx * 100003 + cz.
  let grid: Map<number, Entry[]> | null = null;
  let builtLen = -1;
  let count = 0;

  // Reused scratch list for candidates (cleared with length = 0, never reallocated per frame).
  const candidates: Entry[] = [];

  const cellKey = (cx: number, cz: number) => cx * 100003 + cz;

  function build(): void {
    const g = new Map<number, Entry[]>();
    let n = 0;
    for (const b of boxes) {
      const cx0 = (b.minX + b.maxX) / 2;
      const cz0 = (b.minZ + b.maxZ) / 2;
      const kind = classifyBox(b, ground(cx0, cz0));
      if (kind === null) continue;
      n++;
      const entry: Entry = { b, kind };
      const ix = Math.floor(cx0 / CELL);
      const iz = Math.floor(cz0 / CELL);
      const key = cellKey(ix, iz);
      const list = g.get(key);
      if (list) list.push(entry);
      else g.set(key, [entry]);
    }
    grid = g;
    count = n;
    builtLen = boxes.length;
  }

  function findBox(kind: BoxClass, x: number, z: number, radius: number, rnd: () => number, out: PerchSpot): boolean {
    if (!grid || builtLen !== boxes.length) build();
    const g = grid!;
    candidates.length = 0;
    const cx0 = Math.floor((x - radius) / CELL);
    const cx1 = Math.floor((x + radius) / CELL);
    const cz0 = Math.floor((z - radius) / CELL);
    const cz1 = Math.floor((z + radius) / CELL);
    const r2 = radius * radius;
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const list = g.get(cellKey(cx, cz));
        if (!list) continue;
        for (const e of list) {
          if (e.kind !== kind) continue;
          const bx = (e.b.minX + e.b.maxX) / 2 - x;
          const bz = (e.b.minZ + e.b.maxZ) / 2 - z;
          if (bx * bx + bz * bz <= r2) candidates.push(e);
        }
      }
    }
    const n = candidates.length;
    if (n === 0) return false;
    const pick = candidates[Math.min(n - 1, Math.floor(rnd() * n))];
    const b = pick.b;
    if (kind === 'roof') {
      out.x = b.minX + 0.4 + rnd() * (b.maxX - b.minX - 0.8);
      out.z = b.minZ + 0.4 + rnd() * (b.maxZ - b.minZ - 0.8);
      out.y = b.h;
    } else if (kind === 'fence') {
      const w = b.maxX - b.minX;
      const d = b.maxZ - b.minZ;
      const t = rnd();
      if (w >= d) {
        out.x = b.minX + t * w;
        out.z = (b.minZ + b.maxZ) / 2;
      } else {
        out.x = (b.minX + b.maxX) / 2;
        out.z = b.minZ + t * d;
      }
      out.y = b.h;
    } else {
      out.x = (b.minX + b.maxX) / 2;
      out.z = (b.minZ + b.maxZ) / 2;
      out.y = b.h;
    }
    out.kind = kind;
    return true;
  }

  function randomInCircle(x: number, z: number, radius: number, rnd: () => number): [number, number] {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * radius;
    return [x + Math.cos(a) * r, z + Math.sin(a) * r];
  }

  function findOne(kind: PerchKind, x: number, z: number, radius: number, rnd: () => number, out: PerchSpot): boolean {
    switch (kind) {
      case 'roof':
      case 'fence':
      case 'tree':
        return findBox(kind, x, z, radius, rnd, out);
      case 'ground': {
        for (let i = 0; i < 6; i++) {
          const [px, pz] = randomInCircle(x, z, radius, rnd);
          if (water(px, pz) !== null) continue;
          out.x = px; out.y = ground(px, pz); out.z = pz; out.kind = 'ground';
          return true;
        }
        return false;
      }
      case 'water': {
        for (let i = 0; i < 8; i++) {
          const [px, pz] = randomInCircle(x, z, radius, rnd);
          const surface = water(px, pz);
          if (surface === null) continue;
          out.x = px; out.y = surface; out.z = pz; out.kind = 'water';
          return true;
        }
        return false;
      }
      case 'shore': {
        for (let i = 0; i < 10; i++) {
          const [px, pz] = randomInCircle(x, z, radius, rnd);
          if (water(px, pz) !== null) continue;
          const near =
            water(px + 3, pz) !== null || water(px - 3, pz) !== null ||
            water(px, pz + 3) !== null || water(px, pz - 3) !== null;
          if (!near) continue;
          out.x = px; out.y = ground(px, pz); out.z = pz; out.kind = 'shore';
          return true;
        }
        return false;
      }
      default:
        return false;
    }
  }

  return {
    find(kinds, x, z, radius, rnd, out) {
      for (const kind of kinds) {
        if (findOne(kind, x, z, radius, rnd, out)) return true;
      }
      return false;
    },
    size() {
      return grid ? count : 0;
    },
  };
}
