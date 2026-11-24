import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { REGIONS } from '../sim/regions';
import { WORLD_LANDMARKS } from './worldLandmarks';

describe('worldLandmarks', () => {
  it('defines at least 25 unique DayG landmark buildings backed by valid @lawn/prefabs', () => {
    expect(WORLD_LANDMARKS.length).toBeGreaterThanOrEqual(25);
    const ids = new Set<string>();
    const regionIds = new Set(REGIONS.map((r) => r.id));

    for (const lm of WORLD_LANDMARKS) {
      expect(ids.has(lm.id), `duplicate landmark ${lm.id}`).toBe(false);
      ids.add(lm.id);
      expect(regionIds.has(lm.region), `unknown region ${lm.region}`).toBe(true);
      expect(getPrefab(lm.prefabId), `missing prefab ${lm.prefabId}`).toBeDefined();
    }
  });
});
