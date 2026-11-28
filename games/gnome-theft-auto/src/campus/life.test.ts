// Campus life (E13 A18): residents never walk through a building or the statue, and sleep when the player is far.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { campusWalkerPositions, installCampusLife } from './life';
import { CAMPUS, CAMPUS_BUILDINGS } from './types';

function footprints(): { minX: number; maxX: number; minZ: number; maxZ: number }[] {
  return CAMPUS_BUILDINGS.map((b) => {
    const swap = Math.abs(Math.sin(b.yaw)) > 0.5;
    const hw = (swap ? b.d : b.w) / 2, hd = (swap ? b.w : b.d) / 2;
    return { minX: b.x - hw, maxX: b.x + hw, minZ: b.z - hd, maxZ: b.z + hd };
  });
}

describe('campus life', () => {
  beforeAll(() => { installFakeDom(); });

  it('keeps every walker off buildings and the statue', () => {
    const player = { x: 1145, z: -202 };
    const part = installCampusLife({ scene: new THREE.Scene(), player } as never);
    const fp = footprints();
    for (let n = 0; n < 600; n++) {
      part.update?.(0.1, n * 0.1);
      for (const p of campusWalkerPositions()) {
        for (const f of fp) {
          const inside = p.x > f.minX - 0.5 && p.x < f.maxX + 0.5 && p.z > f.minZ - 0.5 && p.z < f.maxZ + 0.5;
          expect(inside, `${p.x},${p.z}`).toBe(false);
        }
        expect(Math.hypot(p.x - CAMPUS.quadCentre.x, p.z - CAMPUS.quadCentre.z)).toBeGreaterThan(4);
      }
    }
  });

  it('does nothing when the player is far away', () => {
    const player = { x: 0, z: 0 };
    const part = installCampusLife({ scene: new THREE.Scene(), player } as never);
    const before = JSON.stringify(campusWalkerPositions());
    for (let n = 0; n < 100; n++) part.update?.(0.1, n * 0.1);
    expect(JSON.stringify(campusWalkerPositions())).toBe(before);
  });
});
