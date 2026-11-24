import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hasSound } from '../sound/bus';
import { createClippings } from './clippings';
import { MOW_SOUND_IDS, registerMowSounds } from './sounds';

function scaleOf(m: THREE.Matrix4): number {
  const e = m.elements;
  return Math.hypot(e[0], e[1], e[2]);
}

describe('clippings', () => {
  it('bursts into visible instances and hides them again after they fade', () => {
    const c = createClippings(new THREE.Scene(), 16);
    c.burst(0, 0, 0, 0x33aa33, 5, 0.3);
    c.update(0.05);
    const m = new THREE.Matrix4();
    let visible = 0;
    for (let i = 0; i < c.object.count; i++) {
      c.object.getMatrixAt(i, m);
      if (scaleOf(m) > 0) visible++;
    }
    expect(visible).toBeGreaterThan(0);

    for (let t = 0; t < 3; t += 0.05) c.update(0.05);
    for (let i = 0; i < c.object.count; i++) {
      c.object.getMatrixAt(i, m);
      expect(scaleOf(m)).toBe(0);
    }
  });

  it('a burst bigger than the pool does not throw and keeps at most max alive', () => {
    const scene = new THREE.Scene();
    const c = createClippings(scene, 16);
    expect(() => c.burst(1, 0, 1, 0x44cc44, 40, 0.5)).not.toThrow();
    c.update(0.01);
    const m = new THREE.Matrix4();
    let visible = 0;
    for (let i = 0; i < c.object.count; i++) {
      c.object.getMatrixAt(i, m);
      if (scaleOf(m) > 0) visible++;
    }
    expect(visible).toBeLessThanOrEqual(16);
    expect(visible).toBeGreaterThan(0);
  });

  it('registers all four mow sounds on the bus, twice without error', () => {
    registerMowSounds();
    expect(() => registerMowSounds()).not.toThrow();
    for (const id of MOW_SOUND_IDS) expect(hasSound(id)).toBe(true);
    expect(hasSound('mow-snip')).toBe(true);
    expect(hasSound('mow-chop')).toBe(true);
    expect(hasSound('mow-thunk')).toBe(true);
    expect(hasSound('mow-rustle')).toBe(true);
  });
});
