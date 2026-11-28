import { describe, expect, it } from 'vitest';
import { angerFor, cheerFor, fleeStyleFor, gaitFor, startleFor } from './persona';
import { createIdleFidget } from './playerIdle';

/** A repeating sequence of numbers in [0, 1): deterministic "random". */
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };
/** A seeded pseudo-random source (LCG), so a fidget run varies but is repeatable. */
const lcg = (seed: number) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const NIGHT_OFF = { night: 0 };

describe('townsgnome gaits', () => {
  it('is stable for the same id and keeps speedMul within 0.9..1.12', () => {
    for (let id = 0; id < 200; id++) {
      const g1 = gaitFor(id, 'plain', Math.random, NIGHT_OFF);
      const g2 = gaitFor(id, 'plain', Math.random, NIGHT_OFF);
      expect(g2).toEqual(g1);
      expect(g1.speedMul).toBeGreaterThanOrEqual(0.9);
      expect(g1.speedMul).toBeLessThanOrEqual(1.12);
    }
    expect(gaitFor('gnome-7', 'swagger', Math.random, NIGHT_OFF).speedMul).toBeGreaterThanOrEqual(0.9);
  });
  it('gives plain walkers at least three different styles over ids 0..199', () => {
    const styles = new Set<string | null>();
    for (let id = 0; id < 200; id++) styles.add(gaitFor(id, 'plain', Math.random, NIGHT_OFF).style);
    expect(styles.size).toBeGreaterThanOrEqual(3);
    for (const s of styles) expect([null, 'walk-easy', 'walk-brisk', 'walk-amble']).toContain(s);
  });
  it('keeps the archetype walk for other personas', () => {
    expect(gaitFor(5, 'swagger', Math.random, NIGHT_OFF).style).toBe('walk-swagger');
    expect(gaitFor(5, 'sulk', Math.random, NIGHT_OFF).style).toBe('walk-sulk');
  });
});

describe('reaction pickers', () => {
  it('flee arms are panic, a run variant, or null', () => {
    const seen = new Set<string | null>();
    for (let i = 0; i < 200; i++) seen.add(fleeStyleFor(lcg(i + 1)));
    for (const s of seen) expect([null, 'panic', 'run-cover-head', 'run-look-back', 'run-arms-up']).toContain(s);
    expect(fleeStyleFor(seq(0.1))).toBe('panic');
    expect(fleeStyleFor(seq(0.99))).toBeNull();
  });
  it('startle, anger and cheer only pick from their lists', () => {
    expect(['jump-back', 'startle-hop']).toContain(startleFor('nervous', lcg(3)));
    for (let i = 0; i < 100; i++) {
      expect(['startle-horn', 'startle-hop', 'startle-spin']).toContain(startleFor('plain', lcg(i + 1)));
      expect(['shake-fist', 'fist-wave-both', 'stomp-off']).toContain(angerFor(lcg(i + 1)));
      expect(['cheer', 'cheer-jump', 'cheer-whistle']).toContain(cheerFor('spectator', lcg(i + 1)));
      expect(['clap', 'cheer']).toContain(cheerFor('normal', lcg(i + 1)));
    }
    expect(startleFor('plain', seq(0.05))).toBe('startle-spin');
  });
});

describe('player idle fidgets', () => {
  it('never returns the same fidget twice in a row, even with a fixed random', () => {
    for (const r of [seq(0.3), lcg(42)]) {
      const fidget = createIdleFidget(r);
      let last: string | null = null;
      for (let i = 0; i < 50; i++) {
        const id = fidget.update(100, true, 'parkland', 0);
        expect(id).not.toBeNull();
        expect(id).not.toBe(last);
        last = id;
      }
    }
  });
});
