import { describe, expect, it } from 'vitest';
import { computePhotoScore, gradeFromTotal } from './scoring';

describe('snap photo scoring', () => {
  it('awards high scores for centered, well-sized, facing shots with special action', () => {
    const score = computePhotoScore({
      coverage: 0.45,
      centerDist: 0.05,
      facingDot: 0.95,
      action: 'dancing',
      inFrameCount: 2,
      clipped: false,
    });
    expect(score.size).toBe(1000);
    expect(score.framing).toBeGreaterThan(900);
    expect(score.pose).toBeGreaterThan(900);
    expect(score.special).toBeGreaterThanOrEqual(1000);
    expect(score.grade).toBe('Divine');
    expect(score.specialLabels.some((l) => l.includes('Flute Dance'))).toBe(true);
    expect(score.specialLabels.some((l) => l.includes('Group Shot'))).toBe(true);
  });

  it('penalizes clipped and off-center shots', () => {
    const clean = computePhotoScore({
      coverage: 0.3,
      centerDist: 0.1,
      facingDot: 0.5,
      action: 'idle',
      inFrameCount: 1,
      clipped: false,
    });
    const clipped = computePhotoScore({
      coverage: 0.3,
      centerDist: 0.9,
      facingDot: 0.5,
      action: 'idle',
      inFrameCount: 1,
      clipped: true,
    });
    expect(clipped.framing).toBeLessThan(clean.framing);
    expect(clipped.total).toBeLessThan(clean.total);
  });

  it('maps totals to the four Gnome Jesus grades', () => {
    expect(gradeFromTotal(3500)).toBe('Divine');
    expect(gradeFromTotal(2700)).toBe('Gold');
    expect(gradeFromTotal(1800)).toBe('Silver');
    expect(gradeFromTotal(900)).toBe('Bronze');
  });
});
