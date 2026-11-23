import { describe, expect, it } from 'vitest';
import { EVENT_SOUNDS, type EventSound } from './eventSfx';
import { renderEvent } from './eventSynth';

describe('event sound recipes', () => {
  const sounds = [...new Set(Object.values(EVENT_SOUNDS).map((r) => r!.sound))] as EventSound[];

  it('covers every sound the table names', () => {
    expect(sounds.length).toBe(10);
  });

  for (const sound of sounds) {
    it(`${sound}: finite, bounded, under 1.5 s`, () => {
      const s = renderEvent(sound, 44100);
      expect(s.length / 44100).toBeLessThan(1.5);
      let peak = 0;
      for (const v of s) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak).toBeLessThanOrEqual(0.61);
    });
  }
});
