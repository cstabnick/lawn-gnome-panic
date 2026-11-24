import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { REGIONS } from './regions';
import { LORE_NOTES } from './loreNotes';

describe('loreNotes', () => {
  it('defines 42 unique environmental storytelling moments backed by valid @lawn/prefabs', () => {
    expect(LORE_NOTES.length).toBeGreaterThanOrEqual(42);
    const ids = new Set<string>();
    const regionIds = new Set(REGIONS.map((r) => r.id));
    let pre = 0;
    let post = 0;

    for (const note of LORE_NOTES) {
      expect(ids.has(note.id), `duplicate note ${note.id}`).toBe(false);
      ids.add(note.id);
      expect(regionIds.has(note.region), `unknown region ${note.region}`).toBe(true);
      expect(getPrefab(note.prefabId), `missing prefab ${note.prefabId}`).toBeDefined();
      expect(note.author.length).toBeGreaterThan(0);
      expect(note.body.length).toBeGreaterThan(20);
      if (note.era === 'pre-breakout') pre++;
      else post++;
    }
    expect(pre).toBeGreaterThan(5);
    expect(post).toBeGreaterThan(15);
  });
});
