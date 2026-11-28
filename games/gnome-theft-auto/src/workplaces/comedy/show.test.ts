import { describe, expect, it } from 'vitest';
import { createShow } from './show';
import type { ComedySet, ShowEvent } from './types';

// A tiny inline set (no material.ts): three beats, one of which draws a tomato.
const SET: ComedySet = {
  id: 'test-set',
  title: 'Test: Hedges',
  level: 1,
  intro: 'Welcome to the test.',
  beats: [
    { line: 'Beat A', s: 2.5, react: 'groan' },
    { line: 'Beat B', s: 2.5, react: 'tomato' },
    { line: 'Beat C', s: 2.5, react: 'cough' },
  ],
  closer: 'Goodnight.',
};

const OPTS = {
  heckles: ['Get off!', 'Boring!'],
  hecklers: [{ name: 'Mabel', seat: 3 }, { name: 'Ted', seat: 7 }],
  doubleDownLines: ['Again, but worse.', 'Louder this time.'],
  seed: 42,
};

/** Step in 0.1 s ticks for `seconds`, collecting every event. */
function run(show: ReturnType<typeof createShow>, seconds: number): ShowEvent[] {
  const out: ShowEvent[] = [];
  const ticks = Math.round(seconds / 0.1);
  for (let i = 0; i < ticks; i++) out.push(...show.step(0.1));
  return out;
}

/** Step until an event matches `pred`, returning everything seen up to and including it. */
function runUntil(show: ReturnType<typeof createShow>, pred: (e: ShowEvent) => boolean): ShowEvent[] {
  const out: ShowEvent[] = [];
  for (let i = 0; i < 2000; i++) {
    const evs = show.step(0.1);
    out.push(...evs);
    if (evs.some(pred)) return out;
  }
  throw new Error('event never came');
}

describe('comedy show clock', () => {
  it('walks intro, lines, reactions, closer and end in order', () => {
    const show = createShow(SET, OPTS);
    const types = run(show, 30).map((e) => (e.t === 'react' ? `react:${e.kind}` : e.t));
    expect(types).toEqual([
      'intro',
      'line', 'react:groan',
      'line', 'react:tomato', 'tomato',
      'line', 'react:cough',
      'closer', 'end',
    ]);
    expect(show.done()).toBe(true);
  });

  it('emits nothing after the end', () => {
    const show = createShow(SET, OPTS);
    run(show, 30);
    expect(show.step(5)).toEqual([]);
  });

  it('is the same for the same seed', () => {
    const a = JSON.stringify(run(createShow(SET, OPTS), 30));
    const b = JSON.stringify(run(createShow(SET, OPTS), 30));
    expect(a).toBe(b);
  });

  it('gives a tomato beat one tomato event with a seat 0..9', () => {
    const tomatoes = run(createShow(SET, OPTS), 30).filter((e) => e.t === 'tomato');
    expect(tomatoes).toHaveLength(1);
    const seat = (tomatoes[0] as { seat: number }).seat;
    expect(Number.isInteger(seat)).toBe(true);
    expect(seat).toBeGreaterThanOrEqual(0);
    expect(seat).toBeLessThanOrEqual(9);
  });

  it('lets a Double Down right after a groan escalate it to a boo', () => {
    const show = createShow(SET, OPTS);
    runUntil(show, (e) => e.t === 'react' && e.kind === 'groan');
    expect(show.canDoubleDown()).toBe(true);
    expect(show.doubleDown()).toBe(true);
    expect(show.doubleDowns()).toBe(1);
    const first = show.step(0.1);
    expect(first.some((e) => e.t === 'doubled')).toBe(true);
    const later = run(show, 3.2);
    expect(later.some((e) => e.t === 'react' && e.kind === 'boo')).toBe(true);
  });

  it('refuses a Double Down during a line', () => {
    const show = createShow(SET, OPTS);
    runUntil(show, (e) => e.t === 'line');
    expect(show.canDoubleDown()).toBe(false);
    expect(show.doubleDown()).toBe(false);
    expect(show.doubleDowns()).toBe(0);
  });

  it('has 2 stars for a finished set with no Double Downs', () => {
    const show = createShow(SET, OPTS);
    run(show, 30);
    expect(show.cringe()).toBeLessThan(80);
    expect(show.stars()).toBe(2);
  });
});
