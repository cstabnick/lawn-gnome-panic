import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildCampusGrounds } from './grounds';
import { CAMPUS, CAMPUS_BUILDINGS } from './types';

const inside = (b: Box, x: number, z: number, m = 0): boolean =>
  x >= b.minX - m && x <= b.maxX + m && z >= b.minZ - m && z <= b.maxZ + m;

describe('Rootwell grounds', () => {
  let boxes: Box[] = [];
  beforeAll(() => {
    installFakeDom();
    boxes = [];
    buildCampusGrounds(new THREE.Scene(), boxes);
  });

  it('places colliders', () => {
    expect(boxes.length).toBeGreaterThan(20);
  });

  it('keeps every door spot clear (1 m margin)', () => {
    for (const bd of CAMPUS_BUILDINGS) {
      for (const b of boxes) expect(inside(b, bd.door.x, bd.door.z, 1), `box on the door of ${bd.id}`).toBe(false);
    }
  });

  it('keeps the drive centre line clear', () => {
    const { from, to } = CAMPUS.drive;
    for (let x = from.x; x <= to.x; x += 4) {
      for (const b of boxes) expect(inside(b, x, from.z), `box on the drive at x ${x}`).toBe(false);
    }
  });

  it('keeps every collider inside the campus site', () => {
    const s = CAMPUS.site;
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(s.minX);
      expect(b.maxX).toBeLessThanOrEqual(s.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(s.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(s.maxZ);
    }
  });

  it('keeps colliders off every building footprint', () => {
    for (const bd of CAMPUS_BUILDINGS) {
      const swap = Math.abs(Math.sin(bd.yaw)) > 0.5;
      const hx = (swap ? bd.d : bd.w) / 2, hz = (swap ? bd.w : bd.d) / 2;
      for (const b of boxes) {
        const overlap = b.minX < bd.x + hx && b.maxX > bd.x - hx && b.minZ < bd.z + hz && b.maxZ > bd.z - hz;
        expect(overlap, `box overlaps ${bd.id}`).toBe(false);
      }
    }
  });

  it('leaves the quad open except the centrepiece and the hedge rows', () => {
    const q = CAMPUS.quad, c = CAMPUS.quadCentre;
    const hedgeRows = [q.minZ + 3.8, q.maxZ - 3.8];
    for (let x = q.minX; x <= q.maxX; x += 6) {
      for (let z = q.minZ; z <= q.maxZ; z += 6) {
        if (Math.hypot(x - c.x, z - c.z) < 5) continue;
        if (hedgeRows.some((hz) => Math.abs(z - hz) < 2)) continue;
        for (const b of boxes) expect(inside(b, x, z), `box in the quad at ${x},${z}`).toBe(false);
      }
    }
  });
});
