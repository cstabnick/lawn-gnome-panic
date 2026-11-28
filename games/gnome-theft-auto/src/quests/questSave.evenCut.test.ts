import { describe, expect, it } from 'vitest';
import { activeWorldChanges } from '../worldChanges/defs';
import { catchUpHeld, isBeforeTheEvenCut, isCatchUp } from './questSave';
import { STORY_ROWS } from './storyRows';
import type { QuestSave } from './types';

const done = (doneAt?: number): QuestSave => ({ state: 'done', step: 0, cracked: [], ...(doneAt !== undefined ? { doneAt } : {}) });

/** Inserted rows (D7) have ids `mNN-...`; kept rows were in the story before batch 3. */
const inserted = (id: string): boolean => /^m\d\d-/.test(id);
const rowOf = (id: string): number => STORY_ROWS[id];
const ids = Object.keys(STORY_ROWS);

describe('D7 catch-up and the even cut (questSave.ts)', () => {
  it('normal play: every row up to 53 done holds no catch-up', () => {
    const s: Record<string, QuestSave> = {};
    for (const id of ids) if (rowOf(id) <= 53) s[id] = done();
    expect(isCatchUp('m54-the-heist-board', s)).toBe(false);
    expect(catchUpHeld('m54-the-heist-board', s)).toBe(false);
  });

  describe('mid-act-IV veteran', () => {
    const s: Record<string, QuestSave> = {};
    for (const id of ids) {
      const row = rowOf(id);
      if (!inserted(id) && row <= 59) s[id] = done();
      if (inserted(id) && row <= 53) s[id] = done();
    }

    it('marks the act IV inserted rows as catch-ups, in order', () => {
      expect(isCatchUp('m54-the-heist-board', s)).toBe(true);
      expect(isCatchUp('m56-mortar-for-a-mower', s)).toBe(true);
      expect(isCatchUp('m58-the-reeves-barn', s)).toBe(true);
      expect(catchUpHeld('m54-the-heist-board', s)).toBe(false);
      expect(catchUpHeld('m56-mortar-for-a-mower', s)).toBe(true);
      expect(catchUpHeld('m58-the-reeves-barn', s)).toBe(true);
    });

    it('releases the chain one row at a time', () => {
      const afterM54 = { ...s, 'm54-the-heist-board': done() };
      expect(catchUpHeld('m56-mortar-for-a-mower', afterM54)).toBe(false);
      expect(catchUpHeld('m58-the-reeves-barn', afterM54)).toBe(true);
      const afterM56 = { ...afterM54, 'm56-mortar-for-a-mower': done() };
      expect(catchUpHeld('m58-the-reeves-barn', afterM56)).toBe(false);
    });
  });

  describe('isBeforeTheEvenCut', () => {
    const withFinale = (fin?: QuestSave, extra: Record<string, QuestSave> = {}): Record<string, QuestSave> => ({
      'ch5-even-cut': fin ?? done(40),
      ...extra,
    });

    it('is false while the finale is not done', () => {
      expect(isBeforeTheEvenCut('m54-the-heist-board', {})).toBe(false);
      expect(isBeforeTheEvenCut('m54-the-heist-board', { 'ch5-even-cut': { state: 'active', step: 1, cracked: [] } })).toBe(false);
    });

    it('is true for an unplayed act IV row once the finale is done', () => {
      expect(isBeforeTheEvenCut('m54-the-heist-board', withFinale())).toBe(true);
    });

    it('compares stamps: a row finished after the finale is before-the-cut only when later', () => {
      expect(isBeforeTheEvenCut('m54-the-heist-board', withFinale(undefined, { 'm54-the-heist-board': done(41) }))).toBe(true);
      expect(isBeforeTheEvenCut('m54-the-heist-board', withFinale(undefined, { 'm54-the-heist-board': done(30) }))).toBe(false);
    });

    it('a kept row finished with no stamp was done before the finale', () => {
      expect(isBeforeTheEvenCut('ch4-runway-flares', withFinale(undefined, { 'ch4-runway-flares': done() }))).toBe(false);
    });

    it('with no stamps on either side, an inserted row counts as after the finale', () => {
      const s: Record<string, QuestSave> = { 'ch5-even-cut': done(), 'm54-the-heist-board': done() };
      expect(isBeforeTheEvenCut('m54-the-heist-board', s)).toBe(true);
    });

    it('is false outside act IV (finale parts, row 53) and true for an unplayed act IV part', () => {
      expect(isBeforeTheEvenCut('ch5-even-cut-p1', withFinale())).toBe(false);
      expect(isBeforeTheEvenCut('ch3-tundra-drift-run', withFinale())).toBe(false);
      expect(isBeforeTheEvenCut('m64-all-hats-p1', withFinale())).toBe(true);
    });
  });

  describe('world changes after the finale', () => {
    // Every quest done. Inserted act IV rows (54-69) finished after the finale (doneAt 41+) or before it (doneAt 10).
    const veteran = (rowStamp: (id: string) => number): Record<string, QuestSave> => {
      const s: Record<string, QuestSave> = {};
      for (const id of ids) {
        const row = rowOf(id);
        const stamp = inserted(id) && row >= 54 && row <= 69 ? rowStamp(id) : undefined;
        s[id] = done(stamp);
      }
      s['ch5-even-cut'] = done(40);
      return s;
    };

    it('after the finale: W17 on, W15 and W16 off', () => {
      const s = veteran((id) => 41 + rowOf(id));
      const active = activeWorldChanges(s);
      expect(active).toContain('W17');
      expect(active).not.toContain('W15');
      expect(active).not.toContain('W16');
    });

    it('normal play (rows finished before the finale): W15, W16 and W17 on', () => {
      const s = veteran(() => 10);
      const active = activeWorldChanges(s);
      expect(active).toContain('W15');
      expect(active).toContain('W16');
      expect(active).toContain('W17');
    });
  });
});
