// Horn note lists. Run: npx vitest run games/gnome-theft-auto/src/horns.test.ts
import { describe, expect, it } from 'vitest';
import { HORN_IDS } from '@lawn/glaze';
import { hornNotes } from './horns';

describe('hornNotes', () => {
  it('gives at least one note per horn id with finite fields and sane levels', () => {
    for (const id of HORN_IDS) {
      const notes = hornNotes(id);
      expect(notes.length, id).toBeGreaterThanOrEqual(1);
      for (const n of notes) {
        for (const v of [n.freq, n.start, n.dur, n.gain]) expect(Number.isFinite(v), id).toBe(true);
        if (n.slideTo !== undefined) expect(Number.isFinite(n.slideTo), id).toBe(true);
        if (n.vibrato !== undefined) expect(Number.isFinite(n.vibrato), id).toBe(true);
        expect(n.gain, id).toBeLessThanOrEqual(0.35);
        expect(n.gain, id).toBeGreaterThan(0);
      }
      const length = Math.max(...notes.map((n) => n.start + n.dur));
      expect(length, id).toBeLessThanOrEqual(1.2);
    }
  });

  it('falls back to the stock notes for an unknown id', () => {
    expect(hornNotes('no-such-horn')).toEqual(hornNotes('stock'));
  });

  it('gives moo a slide', () => {
    expect(hornNotes('moo').some((n) => n.slideTo !== undefined)).toBe(true);
  });

  it('returns copies, so callers cannot change the table', () => {
    const a = hornNotes('stock');
    a[0].freq = 1;
    expect(hornNotes('stock')[0].freq).toBe(420);
  });
});
