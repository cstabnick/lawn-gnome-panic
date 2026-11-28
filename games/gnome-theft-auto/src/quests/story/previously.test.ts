import { describe, expect, it } from 'vitest';
import { STORY_ROWS } from '../storyRows';
import { questById } from '../defs';
import { PREVIOUSLY, previouslyOf } from './previously';
import { REWARD_EXTRAS, rewardChip } from './rewards';

const rowIds = Object.keys(STORY_ROWS).filter((id) => !/-p\d+$/.test(id));
const words = (s: string) => s.trim().split(/\s+/).length;

describe('previously lines', () => {
  it('has a line for every story row', () => {
    for (const id of rowIds) expect(PREVIOUSLY[id], id).toBeTruthy();
    expect(rowIds.length).toBe(70);
  });

  it('is unlabelled narrator prose of at most 28 words', () => {
    for (const [id, line] of Object.entries(PREVIOUSLY)) {
      expect(line, id).not.toMatch(/^previously/i);
      expect(line, id).not.toMatch(/^[A-Z][\w ]{0,24}:/);
      expect(words(line), id).toBeLessThanOrEqual(28);
      expect(line, id).toMatch(/[.!?]$/);
    }
  });

  it('shares a row line with its parts', () => {
    expect(previouslyOf({ id: 'm46-starfall-at-the-anthill-p1' })).toBe(PREVIOUSLY['m46-starfall-at-the-anthill']);
  });
});

describe('reward extras', () => {
  it('keys are known quests and labels are short', () => {
    for (const [id, labels] of Object.entries(REWARD_EXTRAS)) {
      expect(STORY_ROWS[id] !== undefined || questById(id) !== undefined, id).toBe(true);
      for (const l of labels) {
        expect(words(l), `${id}: ${l}`).toBeLessThanOrEqual(4);
        expect(l, id).not.toMatch(/\.$/);
      }
    }
  });

  it('shows extras alone when no acorns are paid', () => {
    expect(rewardChip({ id: 'm24-the-burrow-door', rewardAcorns: 0 }).text).not.toContain('🌰');
  });
});
