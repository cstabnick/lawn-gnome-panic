import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { buildCourtLife } from './life';
import { COURT, COURT_SITE } from './types';

describe('Drainpipe Court life', () => {
  beforeAll(() => { installFakeDom(); });

  const build = () => {
    const scene = new THREE.Scene();
    return { scene, life: buildCourtLife(scene) };
  };
  const named = (scene: THREE.Scene, name: string): THREE.Object3D | undefined => scene.getObjectByName(name);

  it('has colliders off the painted court and inside the site plus 3 m', () => {
    const { life } = build();
    expect(life.boxes.length).toBeGreaterThan(0);
    for (const b of life.boxes) {
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      const onCourt = Math.abs(cx - COURT.x) < COURT.halfX && Math.abs(cz - COURT.z) < COURT.halfZ;
      expect(onCourt, `box at ${cx},${cz}`).toBe(false);
      expect(cx).toBeGreaterThan(COURT_SITE.minX - 3);
      expect(cx).toBeLessThan(COURT_SITE.maxX + 3);
      expect(cz).toBeGreaterThan(COURT_SITE.minZ - 3);
      expect(cz).toBeLessThan(COURT_SITE.maxZ + 3);
    }
  });

  it('has at least three vignettes', () => {
    const { scene } = build();
    let n = 0;
    scene.traverse((o) => { if (o.name.startsWith('vignette-court-')) n++; });
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it('hides the three players in a game and keeps Burdock', () => {
    const { scene, life } = build();
    life.update(0.016, 1, COURT.x, COURT.z, false);
    expect(named(scene, 'court-cardoon')?.visible).toBe(true);
    life.update(0.016, 2, COURT.x, COURT.z, true);
    expect(named(scene, 'court-cardoon')?.visible).toBe(false);
    expect(named(scene, 'court-lintel')?.visible).toBe(false);
    expect(named(scene, 'court-pansy')?.visible).toBe(false);
    expect(named(scene, 'court-benchley')?.visible).toBe(true);
    life.cheer();
    life.update(0.016, 3, COURT.x, COURT.z, true);
    expect(named(scene, 'court-benchley')?.visible).toBe(true);
  });

  it('runs a long update loop with the player far away', () => {
    const { life } = build();
    expect(() => {
      for (let i = 0; i < 2000; i++) life.update(0.05, i * 0.05, 900, 900, false);
    }).not.toThrow();
  });

  it('runs a long update loop with the player at the court', () => {
    const { life } = build();
    expect(() => {
      for (let i = 0; i < 1500; i++) life.update(0.05, i * 0.05, COURT.x, COURT.z + 12, i % 400 > 300);
    }).not.toThrow();
  });
});
