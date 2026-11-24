import { describe, expect, it } from 'vitest';
import {
  BRANCH_STORIES,
  acceptStory,
  advanceStory,
  completeStory,
  createInitialStoryState,
  dispositionTier,
  getStoryStage,
  outcomeSummary,
} from './survivorStories';

describe('branching survivor stories', () => {
  it('completing a story locks out its rival and updates survivor disposition', () => {
    const s = createInitialStoryState();
    expect(acceptStory(s, 'story-gate-ration')).toBe(true);
    expect(getStoryStage(s, 'story-gate-ration')).toBe(1);
    const res = completeStory(s, 'story-gate-ration');
    expect(res.ok).toBe(true);
    expect(res.locked).toContain('story-tap-pipeworks');
    expect(s.stories['story-tap-pipeworks']).toBe('locked');
    expect(acceptStory(s, 'story-tap-pipeworks')).toBe(false);
    expect(completeStory(s, 'story-tap-pipeworks').ok).toBe(false);
    expect(s.survivors.barnaby.disposition).toBe(35);
    expect(s.survivors.clod.disposition).toBe(-25);
  });

  it('advances through 3 stages before completing and locking out rivals', () => {
    const s = createInitialStoryState();
    expect(getStoryStage(s, 'story-iron-barricade')).toBe(0);

    const s1 = advanceStory(s, 'story-iron-barricade');
    expect(s1.ok).toBe(true);
    expect(s1.stage).toBe(1);
    expect(s1.completed).toBe(false);
    expect(s.stories['story-iron-barricade']).toBe('active');

    const s2 = advanceStory(s, 'story-iron-barricade');
    expect(s2.ok).toBe(true);
    expect(s2.stage).toBe(2);
    expect(s2.completed).toBe(false);

    const s3 = advanceStory(s, 'story-iron-barricade');
    expect(s3.ok).toBe(true);
    expect(s3.stage).toBe(3);
    expect(s3.completed).toBe(false);
    expect(s.stories['story-hedge-path']).toBe('available');

    const done = advanceStory(s, 'story-iron-barricade');
    expect(done.ok).toBe(true);
    expect(done.stage).toBe(3);
    expect(done.completed).toBe(true);
    expect(done.locked).toContain('story-hedge-path');
    expect(s.stories['story-iron-barricade']).toBe('completed');
    expect(s.stories['story-hedge-path']).toBe('locked');
    expect(s.survivors.maren.disposition).toBe(35);
    expect(s.survivors.pip.disposition).toBe(-25);
    expect(advanceStory(s, 'story-hedge-path').ok).toBe(false);
  });

  it('defines 3-stage descriptions for all 8 stories and classifies disposition tiers', () => {
    expect(BRANCH_STORIES).toHaveLength(8);
    for (const st of BRANCH_STORIES) {
      expect(st.stages).toHaveLength(3);
      expect(st.stages[0].length).toBeGreaterThan(10);
      expect(st.stages[1].length).toBeGreaterThan(10);
      expect(st.stages[2].length).toBeGreaterThan(10);
    }
    expect(dispositionTier(-30)).toBe('Rival');
    expect(dispositionTier(-5)).toBe('Wary');
    expect(dispositionTier(0)).toBe('Stranger');
    expect(dispositionTier(35)).toBe('Ally');
    expect(dispositionTier(70)).toBe('Confidant');
  });

  it('produces distinct outcome combinations for different choices', () => {
    const a = createInitialStoryState();
    completeStory(a, 'story-gate-ration');
    completeStory(a, 'story-angel-purge');

    const b = createInitialStoryState();
    completeStory(b, 'story-tap-pipeworks');
    completeStory(b, 'story-moss-truce');

    expect(outcomeSummary(a)).not.toEqual(outcomeSummary(b));
    expect(outcomeSummary(a)).toHaveLength(2);
    expect(outcomeSummary(b)).toHaveLength(2);
  });
});
