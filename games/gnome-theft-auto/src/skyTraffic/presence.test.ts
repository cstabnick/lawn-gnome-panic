import { describe, it, expect } from 'vitest';
import { SKY_BEHAVIOURS } from './behaviours';
import { awayFor, initialDelay, presenceUntil, rollRange } from './presence';
import type { SkyBehaviourDef } from './types';

const byId = (id: string): SkyBehaviourDef => {
  const def = SKY_BEHAVIOURS.find((b) => b.id === id);
  if (!def) throw new Error(`no behaviour ${id}`);
  return def;
};

describe('sky presence', () => {
  it('rollRange maps the rnd extremes onto the range', () => {
    expect(rollRange([10, 20], () => 0)).toBe(10);
    expect(rollRange([10, 20], () => 0.5)).toBe(15);
    expect(rollRange([10, 20], () => 0.999)).toBeLessThanOrEqual(20);
  });

  it('presenceUntil is Infinity when forced or without presence', () => {
    expect(presenceUntil(byId('banner-tow'), 100, true, () => 0.5)).toBe(Infinity);
    expect(presenceUntil(byId('watch-copter'), 100, false, () => 0.5)).toBe(Infinity);
  });

  it('presenceUntil lands inside time + onFor otherwise', () => {
    const def = byId('banner-tow');
    const [lo, hi] = def.presence?.onFor ?? [0, 0];
    const until = presenceUntil(def, 50, false, () => 0.5);
    expect(until).toBeGreaterThanOrEqual(50 + lo);
    expect(until).toBeLessThanOrEqual(50 + hi);
  });

  it('awayFor falls back to cooldown without presence', () => {
    expect(awayFor(byId('mail-drop'), () => 0.5)).toBe(byId('mail-drop').cooldown);
    expect(awayFor(byId('watch-copter'), () => 0.9)).toBe(byId('watch-copter').cooldown);
  });

  it('awayFor rolls offFor with presence', () => {
    const def = byId('banner-tow');
    const [lo, hi] = def.presence?.offFor ?? [0, 0];
    const away = awayFor(def, () => 0.5);
    expect(away).toBeGreaterThanOrEqual(lo);
    expect(away).toBeLessThanOrEqual(hi);
  });

  it('initialDelay is 0 without presence and within offFor[0] with it', () => {
    expect(initialDelay(byId('mail-drop'), () => 0.9)).toBe(0);
    const def = byId('banner-tow');
    expect(initialDelay(def, () => 0.999)).toBeLessThanOrEqual(def.presence?.offFor[0] ?? 0);
  });

  it('banner tow flies about 2 minutes and stays away 3 to 5 minutes', () => {
    const def = byId('banner-tow');
    expect(def.presence?.onFor).toEqual([100, 140]);
    expect(def.presence?.offFor).toEqual([180, 300]);
  });

  it('every def with presence has positive, ordered ranges; watch-copter has none', () => {
    for (const def of SKY_BEHAVIOURS) {
      if (!def.presence) continue;
      for (const [lo, hi] of [def.presence.onFor, def.presence.offFor]) {
        expect(lo).toBeGreaterThan(0);
        expect(hi).toBeGreaterThanOrEqual(lo);
      }
    }
    expect(byId('watch-copter').presence).toBeUndefined();
  });
});
