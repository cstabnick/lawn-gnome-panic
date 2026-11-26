import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import './mownScar';
import { worldChangeBuilder } from '../registry';
import { TEST_LINE } from './mownScar';
import { CLUBHOUSE, HOLES, SHED, inYard } from '../../golf/types';

describe('the mown scar (W14)', () => {
  it('builds the lane, its props and the Flock', () => {
    const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 1, ending: () => 'A' as const };
    const built = worldChangeBuilder('W14')!(ctx);
    expect(built.root.children.length).toBeGreaterThanOrEqual(10);
    expect(built.root.getObjectByName('W14-scar')).toBeTruthy();
    expect(() => built.update?.(0.1, 1)).not.toThrow();
  });

  it('puts every flat piece on a draw layer', () => {
    const ctx = { scene: new THREE.Scene(), groundY: () => 0, night: () => 0, ending: () => 'A' as const };
    const built = worldChangeBuilder('W14')!(ctx);
    const flats = built.root.children.filter((o) => o.name.startsWith('W14-')) as THREE.Mesh[];
    expect(flats.length).toBeGreaterThan(3);
    for (const m of flats) expect((m.material as THREE.Material).polygonOffset).toBe(true);
  });

  it('keeps the lane in the yard, off every green, tee and building', () => {
    const half = TEST_LINE.width / 2;
    const [ax, az] = TEST_LINE.a;
    const [bx, bz] = TEST_LINE.b;
    for (let k = 0; k <= 100; k++) {
      const x = ax + ((bx - ax) * k) / 100;
      const z = az + ((bz - az) * k) / 100;
      expect(inYard(x, z, 1)).toBe(true);
      for (const h of HOLES) {
        expect(Math.hypot(x - h.green.x, z - h.green.z)).toBeGreaterThan(h.green.r + half);
        expect(Math.max(Math.abs(x - h.tee.x), Math.abs(z - h.tee.z))).toBeGreaterThan(2.5 + half);
        for (const b of h.bunkers) expect(Math.hypot(x - b.x, z - b.z)).toBeGreaterThan(b.r + half);
      }
      for (const b of [CLUBHOUSE, SHED]) {
        const dx = Math.max(0, Math.abs(x - b.x) - b.w / 2);
        const dz = Math.max(0, Math.abs(z - b.z) - b.d / 2);
        expect(Math.hypot(dx, dz)).toBeGreaterThan(half);
      }
    }
  });
});
