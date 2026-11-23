import { describe, expect, it } from 'vitest';
import { EVENT_SOUNDS } from './eventSfx';

describe('event sounds', () => {
  it('gives every mapped event a positive cooldown', () => {
    for (const rule of Object.values(EVENT_SOUNDS)) {
      expect(rule!.cooldown).toBeGreaterThan(0);
    }
  });

  it('keeps the loud ones from repeating too fast', () => {
    expect(EVENT_SOUNDS.mowing!.cooldown).toBeGreaterThanOrEqual(EVENT_SOUNDS.fell!.cooldown);
  });
});
