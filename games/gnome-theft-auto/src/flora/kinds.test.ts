import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { PLANT_KINDS, mowableAt, plantKind } from './kinds';

/** Unscaled height (m) of a prefab, measured the way the kinds table comments record it. */
function unscaledHeight(id: string): number {
  return new THREE.Box3().setFromObject(buildPrefab(id, { lights: false })).max.y;
}

describe('plant kinds table', () => {
  it('names real prefabs, once each', () => {
    const ids = PLANT_KINDS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(getPrefab(id), id).toBeTruthy();
  });

  it('gives every mowable kind sane tuning', () => {
    for (const k of PLANT_KINDS.filter((x) => x.mowable)) {
      expect(k.slow, k.id).toBeGreaterThanOrEqual(0.8);
      expect(k.slow, k.id).toBeLessThanOrEqual(1);
      expect(k.regrow[0], k.id).toBeGreaterThanOrEqual(30);
      expect(k.regrow[1], k.id).toBeGreaterThanOrEqual(k.regrow[0]);
      expect(k.regrow[1], k.id).toBeLessThanOrEqual(300);
      expect(['tiny', 'small', 'big']).toContain(k.size);
      if (k.size === 'big') expect(k.slow, k.id).toBeLessThan(1);
      if (k.size === 'tiny') expect(k.slow, k.id).toBe(1);
    }
  });

  it('classifies by kind and placed height', () => {
    expect(mowableAt('flower-bed', 0.6)).toBe(true);
    expect(mowableAt('flower-bed', 2)).toBe(false);
    expect(mowableAt('hedgerow', 1)).toBe(false);
    expect(mowableAt('topiary-cone', 1)).toBe(false);
    expect(mowableAt('not-a-plant', 0.1)).toBe(false);
  });

  it('mows the park rose bushes, allotment beds and Pebblewick flowering bushes', () => {
    for (const id of ['rose-bush', 'flowering-bush', 'allotment-bed']) {
      expect(plantKind(id)?.mowable, id).toBe(true);
      const h = unscaledHeight(id);
      expect(h, id).toBeLessThanOrEqual(1.8);
      expect(mowableAt(id, h), id).toBe(true);
    }
  });
});
