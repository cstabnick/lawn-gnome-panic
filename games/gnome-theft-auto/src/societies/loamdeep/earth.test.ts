import { describe, expect, it } from 'vitest';
import { LOAMDEEP, type Rect } from '../config';
import { carveEarth } from './earth';

const area = (r: Rect): number => (r.maxX - r.minX) * (r.maxZ - r.minZ);

function overlaps(a: Rect, b: Rect): boolean {
  const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  return ox > 1e-9 && oz > 1e-9;
}

function inside(x: number, z: number, r: Rect): boolean {
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;
}

/** Every [x, z] pair in a nested record / array of XZ points. */
function flattenXZ(v: unknown, out: [number, number][] = []): [number, number][] {
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') {
    out.push([v[0], v[1]]);
  } else if (Array.isArray(v)) {
    for (const x of v) flattenXZ(x, out);
  } else if (v && typeof v === 'object') {
    for (const x of Object.values(v)) flattenXZ(x, out);
  }
  return out;
}

describe('carveEarth', () => {
  it('carves a 2 x 2 hole out of a 10 x 10 bounds into rectangles of total area 96', () => {
    const bounds: Rect = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const hole: Rect = { minX: 4, maxX: 6, minZ: 4, maxZ: 6 };
    const solid = carveEarth(bounds, [hole], 1);
    const total = solid.reduce((s, r) => s + area(r), 0);
    expect(total).toBe(96);
    for (const r of solid) expect(overlaps(r, hole)).toBe(false);
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        expect(overlaps(solid[i], solid[j])).toBe(false);
      }
    }
  });

  it('is deterministic', () => {
    const bounds: Rect = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const hole: Rect = { minX: 1, maxX: 3, minZ: 6, maxZ: 9 };
    expect(carveEarth(bounds, [hole], 1)).toEqual(carveEarth(bounds, [hole], 1));
  });
});

describe('carveEarth on the Loamdeep layout', () => {
  const bounds: Rect = {
    minX: -LOAMDEEP.size.w / 2,
    maxX: LOAMDEEP.size.w / 2,
    minZ: -LOAMDEEP.size.d / 2,
    maxZ: LOAMDEEP.size.d / 2,
  };
  const open: Rect[] = [...Object.values(LOAMDEEP.halls), ...Object.values(LOAMDEEP.tunnels)];
  const solid = carveEarth(bounds, open, 1);

  it('never overlaps open floor, and no two solid rects overlap', () => {
    for (const s of solid) {
      for (const o of open) expect(overlaps(s, o)).toBe(false);
    }
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        expect(overlaps(solid[i], solid[j])).toBe(false);
      }
    }
  });

  it('open + solid area equals the room area (within 1 m²)', () => {
    // Open area as a union, counted on the same 1 m grid.
    let openArea = 0;
    for (let x = bounds.minX + 0.5; x < bounds.maxX; x++) {
      for (let z = bounds.minZ + 0.5; z < bounds.maxZ; z++) {
        if (open.some((o) => inside(x, z, o))) openArea++;
      }
    }
    const solidArea = solid.reduce((s, r) => s + area(r), 0);
    const roomArea = (bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ);
    expect(Math.abs(openArea + solidArea - roomArea)).toBeLessThanOrEqual(1);
  });

  it('keeps every hall centre and every spot in open floor', () => {
    const points: [number, number][] = [];
    for (const h of Object.values(LOAMDEEP.halls)) points.push([(h.minX + h.maxX) / 2, (h.minZ + h.maxZ) / 2]);
    flattenXZ(LOAMDEEP.spots, points);
    expect(points.length).toBeGreaterThan(0);
    for (const [x, z] of points) {
      expect(solid.some((s) => inside(x, z, s))).toBe(false);
    }
  });

  it('uses fewer than 120 rectangles', () => {
    expect(solid.length).toBeLessThan(120);
  });
});
