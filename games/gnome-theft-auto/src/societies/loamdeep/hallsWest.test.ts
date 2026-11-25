// Loamdeep's west halls (B9): colliders stay inside the halls and tunnels, clear of every spot and lamp, and the
// Mother's Hall, Rootway and Postern halls keep their 2 m walking lanes.
import { describe, expect, it } from 'vitest';
import type { PlacedInterior } from '../../interiors/registry';
import { INTERIOR_THEMES } from '../../interiors/registry';
import { createKit } from '../../interiors/kit';
import { LAMP_TUNNELS, LOAMDEEP } from '../config';
import { buildHallsWest } from './hallsWest';

type Box = { minX: number; maxX: number; minZ: number; maxZ: number; h: number };
type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
type XZ = readonly [number, number];

const SPOT_POINTS: XZ[] = (() => {
  const pts: XZ[] = [];
  const add = (v: unknown): void => {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      for (const p of Object.values(v)) add(p);
    } else if (Array.isArray(v) && typeof v[0] === 'number') {
      pts.push(v as unknown as XZ);
    } else if (Array.isArray(v)) {
      for (const p of v) add(p);
    }
  };
  add(LOAMDEEP.spots);
  return pts;
})();
const LAMP_POINTS: XZ[] = LAMP_TUNNELS.flatMap((t) => [...LOAMDEEP.lamps[t]]);
const RECTS: Rect[] = [...Object.values(LOAMDEEP.halls), ...Object.values(LOAMDEEP.tunnels)];

const inRect = (x: number, z: number, r: Rect): boolean =>
  x >= r.minX - 1e-6 && x <= r.maxX + 1e-6 && z >= r.minZ - 1e-6 && z <= r.maxZ + 1e-6;

const inUnion = (x: number, z: number): boolean => RECTS.some((r) => inRect(x, z, r));

/** Distance from a point to an axis-aligned box (0 when inside). */
function distToBox(px: number, pz: number, b: Box): number {
  const dx = Math.max(b.minX - px, 0, px - b.maxX);
  const dz = Math.max(b.minZ - pz, 0, pz - b.maxZ);
  return Math.hypot(dx, dz);
}

const boxCentre = (b: Box): XZ => [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];

function placedHalls() {
  const placed: PlacedInterior = {
    def: {
      id: 'loamdeep',
      name: 'Loamdeep',
      door: { x: 0, z: 0, yaw: 0 },
      exit: { x: 0, z: 0, yaw: 0 },
      size: LOAMDEEP.size,
      theme: 'burrow',
      build() {},
    },
    origin: { x: 0, y: 0, z: 0 },
    large: true,
    theme: INTERIOR_THEMES.burrow,
  };
  const { kit, build } = createKit(placed);
  kit.room();
  const shell = build.boxes.length;
  buildHallsWest(kit);
  return { build, added: build.boxes.slice(shell) as Box[] };
}

/** Samples points across a box and checks each lies in the halls-and-tunnels union. */
function boxInUnion(b: Box): boolean {
  for (let x = b.minX; x <= b.maxX + 1e-9; x += 0.1) {
    for (let z = b.minZ; z <= b.maxZ + 1e-9; z += 0.1) {
      if (!inUnion(x, z)) return false;
    }
  }
  return true;
}

/** Whether any collider (other than the chair on the tumblesoil spot) blocks a 2 m band along a segment. */
function laneBlocked(added: Box[], a: XZ, b: XZ): boolean {
  const [ax, az] = a;
  const [bx, bz] = b;
  const len = Math.hypot(bx - ax, bz - az);
  const nx = -(bz - az) / len, nz = (bx - ax) / len;
  const chairTop = LOAMDEEP.spots.tumblesoil;
  for (let t = 0; t <= 1 + 1e-9; t += 0.05) {
    for (let o = -1; o <= 1 + 1e-9; o += 0.1) {
      const x = ax + (bx - ax) * t + nx * o;
      const z = az + (bz - az) * t + nz * o;
      for (const box of added) {
        const c = boxCentre(box);
        if (Math.hypot(c[0] - chairTop[0], c[1] - chairTop[1]) < 0.5) continue;
        if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) return true;
      }
    }
  }
  return false;
}

describe('Loamdeep west halls', () => {
  it('adds colliders only inside the halls and tunnels', () => {
    const { added } = placedHalls();
    expect(added.length).toBeGreaterThan(0);
    for (const b of added) {
      expect(boxInUnion(b)).toBe(true);
    }
  });

  it('keeps every collider 1.0 m clear of every spot and lamp (the tumblesoil chair excepted)', () => {
    const { added } = placedHalls();
    for (const b of added) {
      const c = boxCentre(b);
      const isChair = Math.hypot(c[0] - LOAMDEEP.spots.tumblesoil[0], c[1] - LOAMDEEP.spots.tumblesoil[1]) < 0.5;
      if (isChair) continue;
      for (const [px, pz] of [...SPOT_POINTS, ...LAMP_POINTS]) {
        expect(distToBox(px, pz, b)).toBeGreaterThanOrEqual(1.0);
      }
    }
  });

  it('keeps a 2 m walking lane through each hall between its tunnel mouths', () => {
    const { added } = placedHalls();
    // Mother's Hall: west gallery to east gallery, and the entry to the north tunnel (round the chair).
    expect(laneBlocked(added, [-12, 18], [12, 18])).toBe(false);
    expect(laneBlocked(added, [0, 26], [0, 6])).toBe(false);
    // Rootway Hall: the north tunnel to the west gallery mouth.
    expect(laneBlocked(added, [-40, 12], [-30, 18])).toBe(false);
    // Postern Hall: the west rise to the north-west tunnel mouth.
    expect(laneBlocked(added, [-40, -22], [-30, -30])).toBe(false);
  });

  it('adds no spots and no npcs', () => {
    const { build } = placedHalls();
    expect(build.spots).toHaveLength(0);
    expect(build.npcs).toHaveLength(0);
  });
});
