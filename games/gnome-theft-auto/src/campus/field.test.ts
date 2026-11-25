import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildRootwellField, installFieldLife } from './field';
import { ROOTWELL_FIELD as F } from './types';

/** Distance from a point to a box (0 inside). */
function distTo(b: Box, x: number, z: number): number {
  return Math.hypot(Math.max(b.minX - x, 0, x - b.maxX), Math.max(b.minZ - z, 0, z - b.maxZ));
}

function overlapsRect(b: Box, minX: number, maxX: number, minZ: number, maxZ: number): boolean {
  return b.maxX > minX && b.minX < maxX && b.maxZ > minZ && b.minZ < maxZ;
}

describe('Rootwell Field', () => {
  it('keeps the runway, taxiway, drive and parking spots free, and stays inside the site', () => {
    const restore = installFakeDom();
    try {
      const boxes: Box[] = [];
      buildRootwellField(new THREE.Scene(), boxes);
      expect(boxes.length).toBeGreaterThan(0);
      const r = F.runway, t = F.taxiway, a = F.access;
      const spots: [number, number][] = [[1238, 570], [1238, 592], [1238, 614], [F.pad.x, F.pad.z]];
      const dx = a.to.x - a.from.x, dz = a.to.z - a.from.z;
      for (const b of boxes) {
        expect(b.minX).toBeGreaterThanOrEqual(1200);
        expect(b.maxX).toBeLessThanOrEqual(1380);
        expect(b.minZ).toBeGreaterThanOrEqual(370);
        expect(b.maxZ).toBeLessThanOrEqual(830);
        expect(overlapsRect(b, r.x - r.width / 2 - 1.5, r.x + r.width / 2 + 1.5, r.z - r.length / 2 - 1.5, r.z + r.length / 2 + 1.5)).toBe(false);
        expect(overlapsRect(b, t.minX, t.maxX, t.minZ, t.maxZ)).toBe(false);
        // Access drive: no box corner within half the drive's width of its centre line.
        for (const cx of [b.minX, b.maxX]) {
          for (const cz of [b.minZ, b.maxZ]) {
            const f = Math.max(0, Math.min(1, ((cx - a.from.x) * dx + (cz - a.from.z) * dz) / (dx * dx + dz * dz)));
            expect(Math.hypot(cx - (a.from.x + dx * f), cz - (a.from.z + dz * f))).toBeGreaterThan(a.width / 2);
          }
        }
        for (const [sx, sz] of spots) expect(distTo(b, sx, sz)).toBeGreaterThanOrEqual(7);
        expect(distTo(b, 1250, 545)).toBeGreaterThanOrEqual(5);
      }
    } finally {
      restore();
    }
  });

  it('installFieldLife updates without throwing and lights the runway at night', () => {
    const restore = installFakeDom();
    try {
      const scene = new THREE.Scene();
      buildRootwellField(scene, []);
      const part = installFieldLife({ player: { x: 1240, z: 600 }, scene, timeLabel: () => 'Neon Night' } as never);
      expect(() => part.update?.(0.1, 1)).not.toThrow();
      const glow = scene.getObjectByName('rootwell-field-glow') as THREE.Mesh;
      expect((glow.material as THREE.MeshBasicMaterial).color.r).toBeGreaterThan(0.9);
    } finally {
      restore();
    }
  });
});
