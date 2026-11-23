import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { dopplerRatio, engineProfile, firingHz, newEngineState, stepEngine, targetRevs } from './engineModel';

describe('engineProfile', () => {
  it('gives every vehicle a sane engine, new kinds included', () => {
    for (const spec of Object.values(VEHICLES)) {
      const p = engineProfile(spec);
      expect(p.idleHz).toBeGreaterThan(10);
      expect(p.maxHz).toBeGreaterThan(p.idleHz);
      expect(p.maxHz).toBeLessThan(130);
      expect(p.gain).toBeGreaterThan(0.5);
    }
  });

  it('makes a heavy vehicle lower than a light one', () => {
    const light = engineProfile({ maxSpeed: 34, accel: 20, mass: 2, flies: false });
    const heavy = engineProfile({ maxSpeed: 15, accel: 6, mass: 6, flies: false });
    expect(heavy.maxHz).toBeLessThan(light.maxHz);
    expect(heavy.gears).toBeGreaterThan(0);
    expect(light.gears).toBe(0);
  });
});

describe('revs', () => {
  it('rise with speed and drop back at a gear change', () => {
    expect(targetRevs(0.5, 0, 0)).toBeGreaterThan(targetRevs(0.2, 0, 0));
    const before = targetRevs(0.249, 1, 4);
    const after = targetRevs(0.251, 1, 4);
    expect(after).toBeLessThan(before);
  });

  it('have inertia: no jump in one frame, settle in about a second', () => {
    const st = newEngineState();
    stepEngine(st, 1, 1, 1 / 60);
    expect(st.revs).toBeLessThan(0.2);
    for (let i = 0; i < 90; i++) stepEngine(st, 1, 1, 1 / 60);
    expect(st.revs).toBeGreaterThan(0.95);
  });

  it('change pitch smoothly frame to frame (no zipper)', () => {
    const p = engineProfile({ maxSpeed: 25, accel: 12.5, mass: 2, flies: false });
    const st = newEngineState();
    let last = firingHz(p, st.revs);
    for (let i = 0; i < 120; i++) {
      const target = i < 60 ? 1 : 0; // floor it, then let go
      stepEngine(st, target, target, 1 / 60);
      const hz = firingHz(p, st.revs);
      expect(Math.abs(hz - last) / last).toBeLessThan(0.15);
      last = hz;
    }
  });
});

describe('dopplerRatio', () => {
  it('raises the pitch of an approaching source and lowers a receding one', () => {
    expect(dopplerRatio(0, -50, 0, 30, 0, 0, 0, 0)).toBeGreaterThan(1.05);
    expect(dopplerRatio(0, 50, 0, 30, 0, 0, 0, 0)).toBeLessThan(0.95);
    expect(dopplerRatio(0, 50, 0, 0, 0, 0, 0, 0)).toBe(1);
  });

  it('is clamped', () => {
    expect(dopplerRatio(0, -50, 0, 900, 0, 0, 0, 0)).toBeLessThanOrEqual(1.25);
  });
});
