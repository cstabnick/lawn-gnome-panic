// The Quest sim tab's chapter list: which runs 'Play chapter' queues.
import './globals';
import { describe, expect, it } from 'vitest';
import { chapterRuns } from './trainer';

describe('chapterRuns', () => {
  it('chapter 1 has six story runs, starting with the prologue', () => {
    const runs = chapterRuns(1);
    expect(runs).toHaveLength(6);
    expect(runs[0].questId).toBe('prologue-fresh-kiln');
  });

  it('chapter 5 plays both endings of the choice quest', () => {
    expect(chapterRuns(5)).toEqual([
      { questId: 'ch5-even-cut', variant: 'A' },
      { questId: 'ch5-even-cut', variant: 'B' },
    ]);
  });
});
