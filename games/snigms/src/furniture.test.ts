// Every FURNITURE entry has a real prefab that fits its footprint. Pure: builds prefabs with three, no DOM, no WebGL.
// Run: npm test -w games/snigms -- src/furniture.test.ts
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { FURNITURE } from './config';

const SLACK = 0.15;

describe('FURNITURE', () => {
  for (const [key, def] of Object.entries(FURNITURE)) {
    describe(key, () => {
      it('has a prefab that exists', () => {
        expect(getPrefab(def.prefab), `prefab '${def.prefab}'`).toBeDefined();
      });

      if (def.kind === 'rug') {
        // A rug is a flat floor covering: it may be any size, but never less than a tile.
        it('is at least 1 tile wide', () => {
          const box = new THREE.Box3().setFromObject(buildPrefab(def.prefab));
          const size = box.getSize(new THREE.Vector3());
          expect(size.x, 'width').toBeGreaterThanOrEqual(1);
          expect(size.z, 'depth').toBeGreaterThanOrEqual(1);
        });
      } else {
        it(`fits its ${def.w} x ${def.d} footprint`, () => {
          const box = new THREE.Box3().setFromObject(buildPrefab(def.prefab));
          const size = box.getSize(new THREE.Vector3());
          expect(size.x, 'width').toBeLessThanOrEqual(def.w + SLACK);
          expect(size.z, 'depth').toBeLessThanOrEqual(def.d + SLACK);
        });
      }

      if (def.use) {
        it('has a use with at least one positive rate', () => {
          const rates = Object.values(def.use!.rates);
          expect(rates.some((r) => (r ?? 0) > 0), 'positive rate').toBe(true);
        });
      }

      it('is keyed by its kind', () => {
        expect(def.kind).toBe(key);
      });
    });
  }
});
