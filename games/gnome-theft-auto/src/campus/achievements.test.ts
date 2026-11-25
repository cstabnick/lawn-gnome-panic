import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JobsDeps } from '../jobs/types';
import type { Vehicle } from '../types';
import { WIND_FARM, CAMPUS_BUILDINGS, ROOTWELL_ACH, ROOTWELL_SAVE_KEY, TELESCOPE_EVENT } from './types';
import { installRootwellAchievements, loadTour, onRootwellRunway, saveTour, windfallBand } from './achievements';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (key: string) => m.get(key) ?? null,
    setItem: (key: string, value: string) => {
      m.set(key, value);
    },
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
}

function fakeDeps(player: { x: number; z: number; vehicle: Vehicle | null }) {
  const unlock = vi.fn();
  const increment = vi.fn();
  const toast = vi.fn();
  const deps = { player, unlock, increment, hud: { toast } } as unknown as JobsDeps;
  return { deps, unlock, increment, toast };
}

const tour = CAMPUS_BUILDINGS.filter((b) => b.tour);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('onRootwellRunway', () => {
  it('is inside the runway rectangle and outside it', () => {
    expect(onRootwellRunway(1300, 600)).toBe(true);
    expect(onRootwellRunway(1290, 400)).toBe(true);
    expect(onRootwellRunway(1300, 900)).toBe(false);
    expect(onRootwellRunway(1250, 600)).toBe(false);
  });
});

describe('windfallBand', () => {
  const p = WIND_FARM.pinwheels[3];

  it('hits the pinwheel at a flying height', () => {
    expect(windfallBand(p.x, p.z, 20)).toBe(3);
    expect(windfallBand(p.x + 10, p.z - 15, 5)).toBe(3);
  });

  it('misses below 4 m, above the vane tips, or away from the pinwheel', () => {
    expect(windfallBand(p.x, p.z, 2)).toBe(-1);
    expect(windfallBand(p.x, p.z, 40)).toBe(-1);
    expect(windfallBand(p.x + 15, p.z + 30, 20)).toBe(-1);
    expect(windfallBand(p.x + 200, p.z, 20)).toBe(-1);
  });
});

describe('tour save', () => {
  it('round-trips the doors through storage', () => {
    const s = fakeStorage();
    saveTour(s, new Set(['long-shelf', 'cloche']));
    expect(JSON.parse(s.m.get(ROOTWELL_SAVE_KEY) ?? '{}')).toEqual({ v: 1, doors: ['long-shelf', 'cloche'] });
    expect([...loadTour(s)].sort()).toEqual(['cloche', 'long-shelf']);
  });

  it('is empty for missing or broken saves, and never throws', () => {
    expect(loadTour(fakeStorage()).size).toBe(0);
    expect(loadTour(null).size).toBe(0);
    const bad = fakeStorage();
    bad.m.set(ROOTWELL_SAVE_KEY, '{nope');
    expect(loadTour(bad).size).toBe(0);
    expect(() => saveTour(throwingStorage(), new Set(['x']))).not.toThrow();
    expect(loadTour(throwingStorage()).size).toBe(0);
  });
});

describe('installRootwellAchievements', () => {
  it('counts each campus door once, and saves it', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const player = { x: 0, z: 0, vehicle: null as Vehicle | null };
    const { deps, increment, toast } = fakeDeps(player);
    const part = installRootwellAchievements(deps);
    const a = tour[0];
    const b = tour[1];

    player.x = a.door.x;
    player.z = a.door.z;
    part.update?.(0.3, 1);
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenLastCalledWith(ROOTWELL_ACH.honours);
    expect(toast).toHaveBeenLastCalledWith(expect.stringContaining('1/12'));

    player.x = b.door.x;
    player.z = b.door.z;
    part.update?.(0.3, 2);
    expect(increment).toHaveBeenCalledTimes(2);

    // Standing at the first door again does not count it twice; a fresh install (a reload) reads the saved tour.
    player.x = a.door.x;
    player.z = a.door.z;
    part.update?.(0.3, 3);
    expect(increment).toHaveBeenCalledTimes(2);

    const reload = fakeDeps(player);
    installRootwellAchievements(reload.deps).update?.(0.3, 4);
    expect(reload.increment).not.toHaveBeenCalled();
  });

  it('unlocks stargazer on a night telescope event only', () => {
    const listeners: ((e: Event) => void)[] = [];
    vi.stubGlobal('window', {
      addEventListener: (type: string, cb: (e: Event) => void) => {
        if (type === TELESCOPE_EVENT) listeners.push(cb);
      },
    });
    const player = { x: 0, z: 0, vehicle: null as Vehicle | null };
    const { deps, unlock } = fakeDeps(player);
    installRootwellAchievements(deps);
    const fire = (night: boolean) => {
      const ev = new Event(TELESCOPE_EVENT);
      Object.assign(ev, { detail: { night } });
      for (const cb of listeners) cb(ev);
    };
    fire(false);
    expect(unlock).not.toHaveBeenCalledWith(ROOTWELL_ACH.stargazer);
    fire(true);
    expect(unlock).toHaveBeenCalledWith(ROOTWELL_ACH.stargazer);
  });
});
