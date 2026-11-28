import { describe, expect, it } from 'vitest';
import { WORLD_HALF } from '../config';
import { questById } from './defs';
import { VEHICLES } from '../config';
import { STORY_MARKS, storyGrants, storyItems, storyMarkers } from './storyMarks';

describe('story marks', () => {
  it('keys are real quest ids', () => {
    for (const id of Object.keys(STORY_MARKS)) expect(questById(id), id).toBeTruthy();
  });

  it('markers lie inside the world', () => {
    for (const m of Object.values(STORY_MARKS).flatMap((s) => s.markers ?? [])) {
      expect(Math.abs(m.x)).toBeLessThanOrEqual(WORLD_HALF);
      expect(Math.abs(m.z)).toBeLessThanOrEqual(WORLD_HALF);
    }
  });

  it('item ids are unique', () => {
    const ids = Object.values(STORY_MARKS).flatMap((s) => s.items ?? []).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns nothing when no quest is done', () => {
    expect(storyMarkers(() => false)).toEqual([]);
    expect(storyItems(() => false)).toEqual([]);
  });

  it('reveals a finished quest and dedupes', () => {
    const only = (id: string) => (q: string): boolean => q === id;
    expect(storyMarkers(only('m32-driftwoods-chart')).map((m) => m.label)).toEqual(['The dune line']);
    expect(storyItems(only('m32-driftwoods-chart')).map((i) => i.title)).toEqual(["Driftwood's chart"]);
    const all = storyMarkers(() => true);
    expect(all.length).toBe(new Set(all.map((m) => m.label)).size);
  });
  it('grants (E22) name real vehicle kinds, have unique ids and only appear once their quest is done', () => {
    const all = storyGrants(() => true);
    expect(all.length).toBe(new Set(all.map((g) => g.id)).size);
    for (const g of all) {
      expect(g.deed || g.vehicle, g.id).toBeTruthy();
      if (g.vehicle) expect(VEHICLES[g.vehicle.kind], g.id).toBeTruthy();
    }
    expect(storyGrants(() => false)).toEqual([]);
  });
});
