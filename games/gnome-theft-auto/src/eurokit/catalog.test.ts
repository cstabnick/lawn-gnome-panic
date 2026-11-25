import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { EURO_BUILDINGS, EURO_FURNITURE, EURO_GARDEN } from './catalog';

describe('euro kit sizes', () => {
  for (const b of EURO_BUILDINGS) {
    it(`${b.id} matches the table`, () => {
      expect(getPrefab(b.id)).toBeDefined();
      const box = new THREE.Box3().setFromObject(buildPrefab(b.id));
      const xMax = b.width / 2 + (b.role === 'corner' ? (b.sideApron ?? 0) : 0);
      expect(box.min.x).toBeGreaterThanOrEqual(-b.width / 2 - 0.1);
      expect(box.max.x).toBeLessThanOrEqual(xMax + 0.1);
      expect(box.min.z).toBeGreaterThanOrEqual(-b.depth / 2 - 0.1);
      expect(box.max.z).toBeLessThanOrEqual(b.depth / 2 + b.apron + 0.1);
      expect(Math.abs(box.max.y - b.height)).toBeLessThanOrEqual(0.3);
    });
  }
  it('every furniture and garden id exists', () => {
    for (const id of [...EURO_FURNITURE, ...EURO_GARDEN]) expect(getPrefab(id), id).toBeDefined();
  });
});
