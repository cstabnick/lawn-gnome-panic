import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { homeOf } from '../homes/data';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildObservatory, installObservatory } from './observatory';
import { OBSERVATORY } from './types';

const inside = (b: Box, x: number, z: number, m = 0): boolean =>
  x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m;

describe('observatory', () => {
  const restore = installFakeDom();
  const boxes: Box[] = [];
  buildObservatory(new THREE.Scene(), boxes);
  restore();

  it('has the dome and keeps the run-up and landing area clear', () => {
    expect(boxes.length).toBeGreaterThan(0);
    const c = OBSERVATORY.leapClear;
    for (const b of boxes) {
      expect(b.maxX < 1234 || b.minX > 1242 || b.maxZ < 117 || b.minZ > 182).toBe(true);
      expect(b.maxX < c.minX || b.minX > c.maxX || b.maxZ < c.minZ || b.minZ > c.maxZ).toBe(true);
    }
  });

  it('leaves the door, the road end and the north ant door open', () => {
    const n = OBSERVATORY.antDoors[0];
    const ox = n.x + Math.sin(n.yaw) * 2.5, oz = n.z + Math.cos(n.yaw) * 2.5;
    for (const b of boxes) {
      expect(inside(b, OBSERVATORY.door.x, OBSERVATORY.door.z, 1)).toBe(false);
      expect(inside(b, OBSERVATORY.roadEnd.x, OBSERVATORY.roadEnd.z, 1)).toBe(false);
      if (Math.hypot((b.minX + b.maxX) / 2 - n.x, (b.minZ + b.maxZ) / 2 - n.z) < 1.5) continue; // the door itself
      // No other collider reaches into the 3 m circle round the spot outside the door.
      const cx = Math.max(b.minX, Math.min(ox, b.maxX)), cz = Math.max(b.minZ, Math.min(oz, b.maxZ));
      expect(Math.hypot(cx - ox, cz - oz)).toBeGreaterThan(3);
    }
  });

  it("sets Sextant's door and runs", () => {
    expect(homeOf('betony')!.door).toBeTruthy();
    const restore2 = installFakeDom();
    const deps = { player: { x: 1240, z: 150 }, scene: new THREE.Scene(), timeLabel: () => null } as never;
    expect(() => installObservatory(deps).update!(0.1, 1)).not.toThrow();
    restore2();
  });
});
