import { describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { questById } from '../quests/defs';
import { STORY_ROWS } from '../quests/storyRows';
import type { QuestSave } from '../quests/types';
import { WORLD_CHANGES, activeWorldChanges, endingOf, isChanged, worldBulletinKey } from './defs';
import { worldChangeBuilder } from './registry';
import './rows';

const done: QuestSave = { state: 'done', step: 0, cracked: [] };

describe('world change table', () => {
  it('has unique ids, story-row beats, real hides, and planned rows that are not built yet', () => {
    const ids = WORLD_CHANGES.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of WORLD_CHANGES) {
      expect(w.after.length, w.id).toBeGreaterThan(0);
      for (const a of w.after) expect(STORY_ROWS[a], `${w.id} after ${a}`).toBeDefined();
      for (const h of w.hides ?? []) expect(ids, `${w.id} hides ${h}`).toContain(h);
      if (w.planned) {
        expect(STORY_ROWS[w.planned], w.id).toBeDefined();
        // When E20-E22 build the planned quest, move `after` onto it (and drop `planned`).
        expect(questById(w.planned), `${w.planned} is built: move ${w.id} onto it`).toBeUndefined();
      }
    }
  });

  it('every change whose quests are all built has a builder', () => {
    for (const w of WORLD_CHANGES) {
      if (w.after.every((a) => questById(a))) expect(worldChangeBuilder(w.id), w.id).toBeDefined();
    }
  });

  it('turns on from the quest save, and later changes hide the ones they supersede', () => {
    expect(activeWorldChanges({})).toEqual([]);
    expect(activeWorldChanges({ 'm02-roof-on-credit': done })).toEqual(['W01']);
    const raid = { 'ch3-salvage-raid': done, 'm34-forty-seven-wrenches': done };
    expect(activeWorldChanges(raid)).toContain('W08');
    expect(activeWorldChanges(raid)).not.toContain('W07');
    const finale = { 'ch3-salvage-raid': done, 'm07-even-estates': done, 'ch5-even-cut': done };
    const on = activeWorldChanges(finale);
    expect(on).toContain('W17');
    expect(on).toContain('W18');
    expect(on).not.toContain('W08');
    expect(on).not.toContain('W02');
    expect(isChanged('W17', finale)).toBe(true);
  });

  it('W17 follows the recorded ending, A by default', () => {
    expect(endingOf({ 'ch5-even-cut': done })).toBe('A');
    expect(endingOf({ 'ch5-even-cut': { ...done, ending: 'B' } })).toBe('B');
    expect(worldBulletinKey('W17', 'B')).toBe('world-W17-B');
    expect(worldBulletinKey('W03', 'B')).toBe('world-W03');
  });
});
