// The base hook in the headless sim: no base means no change, pushes and noise, fall and determinism.
import { describe, it, expect } from 'vitest';
import { setSimBase, stepBase, takeBaseDamage } from './base';
import { createWorld, hashWorld, runWorld, stepWorld } from './world';
import { TUNING, withOverrides } from './tuning';
import type { WorldState } from './types';

const BASE = { region: 'leaning-rows' as const, x: 0, z: 0, hp: 1000, maxHp: 1000, warmth: 0 };

function rowsJson(w: WorldState): string { return JSON.stringify(w.daily); }

describe('sim base hook', () => {
  it('no base, no change', () => {
    const a = runWorld(7, 20);
    const b = runWorld(7, 20);
    expect(hashWorld(a.world)).toBe(hashWorld(b.world));
    expect(rowsJson(a.world)).toBe(rowsJson(b.world));

    const { world: w, streams: s } = createWorld(7);
    setSimBase(w, null);
    for (let i = 0; i < 20 * w.tuning.clock.ticksPerDay; i++) stepWorld(w, s);
    expect(hashWorld(w)).toBe(hashWorld(a.world));
  });

  it('a base in the Hatless region takes damage', () => {
    const { world: w, streams: s } = createWorld(7);
    setSimBase(w, { ...BASE });
    for (let i = 0; i < 48; i++) stepWorld(w, s);
    expect(w.base!.hp).toBeLessThan(1000);
    const dmg = takeBaseDamage(w);
    expect(dmg).toBeGreaterThan(0);
    expect(takeBaseDamage(w)).toBe(0);
  });

  it('a promoted region is simulated by the game, so the base takes no push', () => {
    const { world: w, streams: s } = createWorld(7);
    setSimBase(w, { ...BASE });
    for (let i = 0; i < 48; i++) {
      w.promoted.region = 'leaning-rows';
      stepWorld(w, s);
    }
    expect(w.base!.hp).toBe(1000);
  });

  it('warmth raises the noise of the base region', () => {
    const { world: w, streams: s } = createWorld(7);
    setSimBase(w, { ...BASE, warmth: 2 });
    const before = w.horde.noise['leaning-rows'];
    stepBase(w, s.base);
    expect(w.horde.noise['leaning-rows']).toBeGreaterThan(before);
  });

  it('a base with 1 hp falls, once, with one chronicle line', () => {
    const t = withOverrides(TUNING, { base: { pushShare: 1 } });
    const { world: w, streams: s } = createWorld(7, t);
    setSimBase(w, { ...BASE, hp: 1 });
    for (let i = 0; i < 48; i++) stepWorld(w, s);
    expect(w.flags['base-fell']).toBe(true);
    expect(w.base!.fallenTick).not.toBeNull();
    const lines = w.chronicle.filter((c) => c.text.includes('lone gnome'));
    expect(lines.length).toBe(1);
  });

  it('is deterministic with a base', () => {
    const run = (): number => {
      const { world: w, streams: s } = createWorld(11);
      setSimBase(w, { ...BASE });
      for (let i = 0; i < 48; i++) stepWorld(w, s);
      return w.base!.hp;
    };
    expect(run()).toBe(run());
  });
});
