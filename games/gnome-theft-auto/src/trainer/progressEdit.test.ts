import { describe, expect, it } from 'vitest';
import { QUESTS } from '../quests/defs';
import { emptyHuntSave } from '../hunting/huntSave';
import type { QuestSave } from '../quests/types';
import {
  clearJournal,
  completeQuest,
  emptyBag,
  fillJournal,
  questState,
  resetQuest,
  setLicensed,
  storyStartAt,
  storyStartOfChapter,
  type Saves,
} from './progressEdit';

const story = QUESTS.filter((q) => q.chapter !== undefined);
const sides = QUESTS.filter((q) => q.chapter === undefined);
const doneEntry = (id: string): QuestSave => {
  const q = QUESTS.find((x) => x.id === id)!;
  return { state: 'done', step: q.objectives.length, cracked: [] };
};

describe('progressEdit: story', () => {
  it('has chapters 1..5 with story quests and side quests', () => {
    expect(story.length).toBeGreaterThan(0);
    expect(new Set(story.map((q) => q.chapter))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(sides.length).toBeGreaterThan(0);
  });

  it('chapter 1 start removes every story quest', () => {
    const saves: Saves = {
      [story[0].id]: { state: 'active', step: 1, cracked: ['x'] },
      [story[story.length - 1].id]: doneEntry(story[story.length - 1].id),
    };
    const out = storyStartOfChapter(saves, QUESTS, 1);
    for (const q of story) expect(questState(out, q.id)).toBe('none');
  });

  it('chapter 2 start: chapter 1 done, nothing of chapter 2+', () => {
    const out = storyStartOfChapter({}, QUESTS, 2);
    const ch1 = story.filter((q) => q.chapter === 1);
    const later = story.filter((q) => (q.chapter ?? 0) >= 2);
    expect(ch1.length).toBeGreaterThan(0);
    for (const q of ch1) expect(out[q.id]).toEqual(doneEntry(q.id));
    for (const q of later) expect(out[q.id]).toBeUndefined();
  });

  it('keeps side quest entries', () => {
    const side = sides[0];
    const saves: Saves = { [side.id]: { state: 'active', step: 2, cracked: ['a'] } };
    const out = storyStartOfChapter(saves, QUESTS, 3);
    expect(out[side.id]).toEqual(saves[side.id]);
    const out2 = storyStartAt(saves, QUESTS, story[0].id);
    expect(out2[side.id]).toEqual(saves[side.id]);
  });

  it('n past the last chapter makes every story quest done', () => {
    const out = storyStartOfChapter({}, QUESTS, 6);
    for (const q of story) expect(out[q.id]).toEqual(doneEntry(q.id));
  });

  it('unknown id returns an unchanged copy', () => {
    const saves: Saves = { [story[0].id]: doneEntry(story[0].id) };
    const out = storyStartAt(saves, QUESTS, 'no-such-quest');
    expect(out).toEqual(saves);
    expect(out).not.toBe(saves);
  });

  it('storyStartAt a story quest removes it and later, completes earlier ones', () => {
    const idx = 2;
    const out = storyStartAt({}, QUESTS, story[idx].id);
    story.slice(0, idx).forEach((q) => expect(out[q.id]).toEqual(doneEntry(q.id)));
    story.slice(idx).forEach((q) => expect(out[q.id]).toBeUndefined());
  });
});

describe('progressEdit: quests', () => {
  it('completeQuest marks done with every step and no cracks', () => {
    const q = QUESTS[0];
    const out = completeQuest({}, q);
    expect(out[q.id]).toEqual({ state: 'done', step: q.objectives.length, cracked: [] });
    expect(questState(out, q.id)).toBe('done');
  });

  it('resetQuest removes the entry', () => {
    const q = QUESTS[0];
    const saves: Saves = { [q.id]: { state: 'active', step: 0, cracked: [] } };
    const out = resetQuest(saves, q.id);
    expect(out[q.id]).toBeUndefined();
    expect(questState(out, q.id)).toBe('none');
  });

  it('does not mutate inputs', () => {
    const q = QUESTS[0];
    const saves: Saves = { [q.id]: { state: 'active', step: 1, cracked: ['c'] } };
    const snap = JSON.stringify(saves);
    completeQuest(saves, q);
    resetQuest(saves, q.id);
    storyStartOfChapter(saves, QUESTS, 2);
    storyStartAt(saves, QUESTS, story[0].id);
    expect(JSON.stringify(saves)).toBe(snap);
  });
});

describe('progressEdit: hunting', () => {
  it('setLicensed toggles only the license', () => {
    const d = emptyHuntSave();
    const on = setLicensed(d, true);
    expect(on.licensed).toBe(true);
    expect(setLicensed(on, false).licensed).toBe(false);
    expect(d.licensed).toBe(false);
  });

  it('fillJournal gives every species an entry and keeps existing numbers', () => {
    const d = emptyHuntSave();
    d.journal = { fox: { taken: 4, keepsakes: 2, first: '2026-01-01', bestShot: 9 } };
    const out = fillJournal(d, ['fox', 'snow-hare'], '2026-11-23');
    expect(out.journal.fox).toEqual({ taken: 4, keepsakes: 2, first: '2026-01-01', bestShot: 9 });
    expect(out.journal['snow-hare']).toEqual({ taken: 1, keepsakes: 0, first: '2026-11-23', bestShot: 0 });
    expect(d.journal['snow-hare']).toBeUndefined();
  });

  it('clearJournal and emptyBag clear only their part', () => {
    const d = emptyHuntSave();
    d.bag = { 'tuft-fox': 3 };
    d.journal = { 'snow-hare': { taken: 1, keepsakes: 0, first: '2026-11-23', bestShot: 0 } };
    d.licensed = true;
    expect(clearJournal(d).journal).toEqual({});
    expect(clearJournal(d).bag).toEqual({ 'tuft-fox': 3 });
    expect(emptyBag(d).bag).toEqual({});
    expect(emptyBag(d).journal).toEqual(d.journal);
    expect(emptyBag(d).licensed).toBe(true);
    expect(d.bag).toEqual({ 'tuft-fox': 3 });
  });
});
