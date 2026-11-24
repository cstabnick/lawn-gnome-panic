import { describe, expect, it } from 'vitest';
import { acceptStory, completeStory, createInitialStoryState, outcomeSummary } from './survivorStories';

describe('branching survivor stories', () => {
  it('completing a story locks out its rival and updates survivor disposition', () => {
    const s = createInitialStoryState();
    expect(acceptStory(s, 'story-gate-ration')).toBe(true);
    const res = completeStory(s, 'story-gate-ration');
    expect(res.ok).toBe(true);
    expect(res.locked).toContain('story-tap-pipeworks');
    expect(s.stories['story-tap-pipeworks']).toBe('locked');
    expect(acceptStory(s, 'story-tap-pipeworks')).toBe(false);
    expect(completeStory(s, 'story-tap-pipeworks').ok).toBe(false);
    expect(s.survivors.barnaby.disposition).toBe(35);
    expect(s.survivors.clod.disposition).toBe(-25);
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
