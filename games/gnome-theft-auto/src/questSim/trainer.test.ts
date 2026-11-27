// The Quest sim tab's chapter list: which runs 'Play chapter' queues.
import './globals';
import { describe, expect, it } from 'vitest';
import { chapterRuns } from './trainer';

describe('chapterRuns', () => {
  it('chapter 1 has seventeen story runs (rows 1-15 + the two Founders Boot parts), starting with the prologue', () => {
    const runs = chapterRuns(1);
    expect(runs).toHaveLength(17);
    expect(runs[0].questId).toBe('prologue-fresh-kiln');
  });

  it('chapter 5 plays the finale parts, then both endings of the choice quest', () => {
    expect(chapterRuns(5)).toEqual([
      { questId: 'ch5-even-cut-p1' },
      { questId: 'ch5-even-cut-p2' },
      { questId: 'ch5-even-cut-p3' },
      { questId: 'ch5-even-cut', variant: 'A' },
      { questId: 'ch5-even-cut', variant: 'B' },
    ]);
  });
});
