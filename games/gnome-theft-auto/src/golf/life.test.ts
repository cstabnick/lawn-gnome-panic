import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { buildHedgeworthLife } from './life';
import { HEDGEWORTH_CAST, PEOPLE_SPOTS, inPlay } from './types';

describe('Hedgeworth life', () => {
  beforeAll(() => { installFakeDom(); });

  const build = () => {
    const scene = new THREE.Scene();
    const life = buildHedgeworthLife(scene);
    return { scene, life };
  };
  const groups = (scene: THREE.Scene, prefix: string): THREE.Object3D[] => {
    const out: THREE.Object3D[] = [];
    scene.traverse((o) => { if (o.name.startsWith(prefix)) out.push(o); });
    return out;
  };

  it('has at least three vignettes in each of the four areas', () => {
    const { scene } = build();
    for (const area of ['tee', 'course', 'shed', 'fence']) {
      expect(groups(scene, `vignette-${area}-`).length, area).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps vignettes out of play (the bunker rake is the one exception)', () => {
    const { scene } = build();
    scene.updateMatrixWorld(true);
    for (const g of groups(scene, 'vignette-')) {
      if (g.name === 'vignette-course-rake-prints') continue;
      g.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
        expect(inPlay(p.x, p.z, 1), `${g.name} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`).toBe(false);
      });
    }
  });

  it('puts Peony, Basil and Thrift within 1.5 m of their spots', () => {
    const { scene } = build();
    for (const key of Object.keys(HEDGEWORTH_CAST) as ('peony' | 'basil' | 'thrift')[]) {
      const g = groups(scene, `hedgeworth-${key}`)[0];
      expect(g, key).toBeTruthy();
      const s = PEOPLE_SPOTS[key];
      expect(Math.hypot(g.position.x - s.x, g.position.z - s.z)).toBeLessThan(1.5);
    }
  });

  it('updates for 10 s of frames, and does nothing far away', () => {
    const { life } = build();
    for (let i = 0; i < 600; i++) expect(() => life.update(1 / 60, i / 60, -1060, 470)).not.toThrow();
    expect(() => life.update(0.1, 11, 5000, 5000)).not.toThrow();
  });
});
