import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SEA_MOWER_CHANCE, seaMowerCatch } from './round';

describe('sea mower', () => {
  it('catches about one water ball in four, the same every time for the same spot, never on land', () => {
    let caught = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const end = new THREE.Vector3(Math.cos(i) * 300 + i * 0.013, 0, Math.sin(i * 1.7) * 300);
      const c = seaMowerCatch({ end, endLie: 'water' });
      expect(seaMowerCatch({ end: end.clone(), endLie: 'water' })).toBe(c);
      if (c) caught++;
      expect(seaMowerCatch({ end, endLie: 'rough' })).toBe(false);
    }
    expect(caught / n).toBeGreaterThan(SEA_MOWER_CHANCE - 0.03);
    expect(caught / n).toBeLessThan(SEA_MOWER_CHANCE + 0.03);
  });
});
