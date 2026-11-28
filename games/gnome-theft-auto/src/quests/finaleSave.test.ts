// E22: a save from before the finale was split into parts (questSave.ts migrateFinaleSave).
import { describe, expect, it } from 'vitest';
import { FINALE_PARTS, mergeQuestSaves, migrateFinaleSave } from './questSave';
import { questById } from './defs';
import type { QuestSave } from './types';

const done: QuestSave = { state: 'done', step: 0, cracked: [] };

describe('finale save migration', () => {
  it('the finale is three parts and a final in the old objective order', () => {
    const kinds = [...FINALE_PARTS, 'ch5-even-cut'].flatMap((id) => questById(id)!.objectives.map((o) => o.kind));
    expect(kinds).toEqual(['crack', 'air-drop', 'boss-combine', 'boss-combine', 'crack', 'choice']);
    expect(questById('ch5-even-cut')!.prereq).toBe('ch5-even-cut-p3');
  });

  it('a finished old finale stays finished and its parts are marked done', () => {
    const s: Record<string, QuestSave> = { 'ch5-even-cut': { ...done, ending: 'B', doneAt: 17 } };
    expect(migrateFinaleSave(s)).toBe(true);
    expect(s['ch5-even-cut']).toEqual({ ...done, ending: 'B', doneAt: 17 });
    for (const id of FINALE_PARTS) expect(s[id].state).toBe('done');
    expect(migrateFinaleSave(s)).toBe(false);
  });

  it('an active old finale resumes in the part that holds its step', () => {
    for (const [step, part, partStep] of [[0, 'ch5-even-cut-p1', 0], [1, 'ch5-even-cut-p2', 0], [2, 'ch5-even-cut-p3', 0], [3, 'ch5-even-cut', 1], [4, 'ch5-even-cut', 2]] as const) {
      const s: Record<string, QuestSave> = { 'ch5-even-cut': { state: 'active', step, cracked: ['vanguard-hoa-1'] } };
      migrateFinaleSave(s);
      expect(s[part]).toMatchObject({ state: 'active', step: partStep });
      const actives = Object.values(s).filter((v) => v.state === 'active');
      expect(actives).toHaveLength(1);
      if (step < 3) expect(s['ch5-even-cut']).toBeUndefined();
    }
  });

  it('a new-layout save is left alone', () => {
    const s: Record<string, QuestSave> = { 'ch5-even-cut-p1': done, 'ch5-even-cut-p2': { state: 'active', step: 0, cracked: [] } };
    expect(migrateFinaleSave(s)).toBe(false);
  });

  it('a merge keeps the recorded ending', () => {
    const a = JSON.stringify({ 'ch5-even-cut': { ...done, ending: 'B' } });
    const b = JSON.stringify({ 'ch5-even-cut': done });
    expect(JSON.parse(mergeQuestSaves(a, b))['ch5-even-cut'].ending).toBe('B');
  });
});
