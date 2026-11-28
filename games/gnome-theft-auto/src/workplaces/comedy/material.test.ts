import { describe, expect, it } from 'vitest';
import { BIT_IDS, DANCE_IDS, EMOTE_B_IDS, EMOTE_IDS, IDLE_IDS, REACT_IDS } from '../../anim/types';
import { DOUBLE_DOWN_LINES, HECKLERS, HECKLES, SETS, VERDICTS, setFor } from './material';

const ANIMS = new Set<string>([...EMOTE_IDS, ...EMOTE_B_IDS, ...IDLE_IDS, ...BIT_IDS, ...DANCE_IDS, ...REACT_IDS]);

describe('comedy material', () => {
  it('has five sets with the right lengths', () => {
    expect(SETS.map((s) => s.level)).toEqual([1, 2, 3, 4, 5]);
    expect(SETS.map((s) => s.beats.length)).toEqual([7, 8, 9, 10, 12]);
  });

  it('uses only real animation ids', () => {
    for (const s of SETS) for (const beat of s.beats) if (beat.anim) expect(ANIMS.has(beat.anim), beat.anim).toBe(true);
  });

  it('has one pity-clap per set and keeps every string short', () => {
    for (const s of SETS) expect(s.beats.filter((x) => x.react === 'pity-clap')).toHaveLength(1);
    const all: string[] = [...HECKLES, ...DOUBLE_DOWN_LINES, ...VERDICTS];
    for (const s of SETS) all.push(s.title, s.intro, s.closer, ...s.beats.flatMap((x) => [x.line, x.heckle ?? '']));
    for (const t of all) expect(t.length, t).toBeLessThanOrEqual(120);
    expect(HECKLES).toHaveLength(24);
    expect(DOUBLE_DOWN_LINES).toHaveLength(12);
    expect(VERDICTS).toHaveLength(5);
  });

  it('has eight hecklers in unique seats 0..9', () => {
    expect(HECKLERS).toHaveLength(8);
    const seats = HECKLERS.map((h) => h.seat);
    expect(new Set(seats).size).toBe(seats.length);
    for (const n of seats) expect(n >= 0 && n <= 9).toBe(true);
  });

  it('picks the level-1 set at level 1', () => {
    expect(setFor(1, 0)?.level).toBe(1);
  });
});
