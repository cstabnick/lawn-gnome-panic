import { describe, expect, it } from 'vitest';
import { LAMP_TUNNELS } from '../config';
import {
  MOLE_JOBS, dropRoots, jobLine, lightLamp, recordNook, recordSorting, shiftPay, shiftStars, startShift, takeRoots, tickShift,
  type MoleShift,
} from './jobs';

/** mulberry32: a small seeded PRNG returning 0..1. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drive a Root Run to the end: take, then drop at the asked hall each time. */
function runRoots(seed: number): MoleShift {
  const rand = seeded(seed);
  let s = startShift('roots', rand);
  while (!s.over) {
    s = takeRoots(s, rand);
    if (s.rootTo) s = dropRoots(s, s.rootTo);
  }
  return s;
}

describe('MOLE_JOBS', () => {
  it('has a friendly blurb for every job', () => {
    for (const j of Object.values(MOLE_JOBS)) expect(j.blurb.length).toBeGreaterThan(10);
  });
});

describe('startShift', () => {
  it('starts a clean shift with the job clock', () => {
    const s = startShift('post', seeded(1));
    expect(s).toMatchObject({ job: 'post', left: 60, done: 0, misses: 0, rootTo: null, tunnel: null, lit: [], over: false });
  });

  it('picks a lamp tunnel and four unlit lamps for the Lamplighter', () => {
    const s = startShift('lamps', () => 0.99);
    expect(s.tunnel).toBe(LAMP_TUNNELS[2]);
    expect(s.lit).toEqual([false, false, false, false]);
    expect(startShift('lamps', () => 0).tunnel).toBe(LAMP_TUNNELS[0]);
  });
});

describe('tickShift', () => {
  it('counts down and marks the shift over at zero, freezing the clock', () => {
    let s = startShift('dig', seeded(2));
    s = tickShift(s, 60);
    expect(s.left).toBe(30);
    expect(s.over).toBe(false);
    s = tickShift(s, 100);
    expect(s.left).toBe(0);
    expect(s.over).toBe(true);
    s = tickShift(s, 5);
    expect(s.left).toBe(0);
    expect(s.over).toBe(true);
  });

  it('does not mutate its argument', () => {
    const s = startShift('dig', seeded(2));
    tickShift(s, 10);
    expect(s.left).toBe(90);
  });
});

describe('Root Run', () => {
  it('a full Root Run reaches 4/4 and is over', () => {
    const s = runRoots(7);
    expect(s.done).toBe(4);
    expect(s.over).toBe(true);
  });

  it('never gives the same hall twice in a row (50 draws)', () => {
    const rand = seeded(42);
    let prev: string | null = null;
    for (let i = 0; i < 50; i++) {
      // A fresh shift each draw (a shift ends after four drops), carrying the previous drop as lastTo.
      const s = takeRoots({ ...startShift('roots', rand), lastTo: prev as 'mothers' | null }, rand);
      expect(s.rootTo).not.toBeNull();
      expect(s.rootTo).not.toBe(prev);
      prev = s.rootTo;
    }
  });

  it('takes a bundle only when carrying nothing', () => {
    const rand = seeded(3);
    const s = takeRoots(startShift('roots', rand), rand);
    expect(takeRoots(s, rand)).toBe(s);
  });

  it('dropping at the wrong hall changes nothing', () => {
    const rand = seeded(5);
    const s = takeRoots(startShift('roots', rand), rand);
    const wrongHall = (['mothers', 'lamplight', 'postern', 'hearth', 'underChorus'] as const).find((h) => h !== s.rootTo)!;
    expect(dropRoots(s, wrongHall)).toBe(s);
  });

  it('dropping at the right hall counts one and clears the bundle', () => {
    const rand = seeded(9);
    const s = takeRoots(startShift('roots', rand), rand);
    const d = dropRoots(s, s.rootTo!);
    expect(d.done).toBe(1);
    expect(d.rootTo).toBeNull();
    expect(d.lastTo).toBe(s.rootTo);
    expect(s.done).toBe(0);
  });
});

describe('Lamplighter', () => {
  it('lighting the same lamp twice counts once', () => {
    let s = startShift('lamps', seeded(1));
    s = lightLamp(s, 2);
    expect(s.done).toBe(1);
    expect(s.lit).toEqual([false, false, true, false]);
    const again = lightLamp(s, 2);
    expect(again).toBe(s);
    expect(again.done).toBe(1);
  });

  it('lighting all four is over; out-of-range indices change nothing', () => {
    let s = startShift('lamps', seeded(1));
    expect(lightLamp(s, 4)).toBe(s);
    expect(lightLamp(s, -1)).toBe(s);
    for (const i of [0, 1, 2, 3]) s = lightLamp(s, i);
    expect(s.done).toBe(4);
    expect(s.over).toBe(true);
  });
});

describe('Post Sorting and Dig a Nook', () => {
  it('records the sorting result and ends the shift', () => {
    const s = recordSorting(startShift('post', seeded(1)), 8, 2);
    expect(s).toMatchObject({ done: 8, misses: 2, over: true });
    expect(recordSorting(startShift('post', seeded(1)), 99, 0).done).toBe(10);
  });

  it('counts good nooks and misses, ending when all are accounted for', () => {
    let s = startShift('dig', seeded(1));
    s = recordNook(s, true);
    s = recordNook(s, false);
    expect(s).toMatchObject({ done: 1, misses: 1, over: false });
    s = recordNook(s, true);
    expect(s.over).toBe(true);
  });
});

describe('stars and pay', () => {
  it('is 0 stars and 0 pay for nothing done', () => {
    const s = startShift('roots', seeded(1));
    expect(shiftStars(s)).toBe(0);
    expect(shiftPay(s)).toBe(0);
  });

  it('gives 5 stars for a fast clean full shift', () => {
    const s = { ...startShift('dig', seeded(1)), done: 3, left: 80, over: true };
    expect(shiftStars(s)).toBe(5);
    expect(shiftPay(s)).toBe(Math.round((3 * 15 * 5) / 3));
  });

  it('a full shift that finishes slowly gets 4 stars', () => {
    const s = { ...startShift('dig', seeded(1)), done: 3, left: 10, over: true };
    expect(shiftStars(s)).toBe(4);
  });

  it('misses cost stars', () => {
    const clean = { ...startShift('dig', seeded(1)), done: 3, left: 80, over: true };
    const messy = { ...clean, misses: 4 };
    expect(shiftStars(messy)).toBe(shiftStars(clean) - 2);
    expect(shiftStars({ ...clean, done: 1, misses: 30 })).toBe(1);
  });

  it('pays less with fewer stars', () => {
    const base = { ...startShift('post', seeded(1)), done: 5, over: true };
    expect(shiftPay({ ...base, left: 60 })).toBeGreaterThan(shiftPay({ ...base, left: 0, misses: 4 }));
  });
});

describe('jobLine', () => {
  it('reads the roots shift as a HUD strip', () => {
    const s = { ...startShift('roots', seeded(1)), done: 2, rootTo: 'hearth' as const, left: 101 };
    expect(jobLine(s)).toBe('Root Run · 2/4 · to Hearth Hall · 1:41');
  });

  it('capitalises the Mother\'s Hall and shows a pick-up prompt when empty-handed', () => {
    const s = { ...startShift('roots', seeded(1)), rootTo: 'mothers' as const, left: 150 };
    expect(jobLine(s)).toBe("Root Run · 0/4 · to The Mother's Hall · 2:30");
    expect(jobLine({ ...s, rootTo: null })).toBe('Root Run · 0/4 · fetch roots · 2:30');
  });

  it('shows the lamps, the post and the nooks', () => {
    expect(jobLine({ ...startShift('lamps', seeded(1)), done: 3, left: 12 })).toBe('Lamplighter · 3/4 · 0:12');
    expect(jobLine({ ...startShift('post', seeded(1)), left: 0 })).toBe('Post Sorting · 0:00');
    expect(jobLine({ ...startShift('dig', seeded(1)), done: 1, left: 5 })).toBe('Dig a Nook · 1/3 · 0:05');
  });
});
