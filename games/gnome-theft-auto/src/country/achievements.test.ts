import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobsDeps } from '../jobs/types';
import { deerWithin } from '../critters/countryside';
import { emitHarvest } from '../farm/events';
import { CAMPS } from './camps';
import { COUNTRY_ACH, COUNTRY_SAVE_KEY, EVEN_ESTATES, MANOR } from './types';
import { installCountryAchievements, loadCountrySave, saveCountrySave } from './achievements';

vi.mock('../critters/countryside', () => ({ deerWithin: vi.fn(() => [] as number[]) }));

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

function fakeDeps(player: { x: number; z: number; vehicle: null }) {
  const unlock = vi.fn();
  const increment = vi.fn();
  const toast = vi.fn();
  const deps = { player, unlock, increment, hud: { toast } } as unknown as JobsDeps;
  return { deps, unlock, increment, toast };
}

/** One check tick, well after the spawn settles. */
function tick(part: { update?(dt: number, t: number): void }, t = 3): void {
  part.update?.(0.5, t);
}

const site = EVEN_ESTATES[0];
const hoardingCentre = {
  x: (site.hoarding.minX + site.hoarding.maxX) / 2,
  z: (site.hoarding.minZ + site.hoarding.maxZ) / 2,
};

beforeEach(() => {
  vi.mocked(deerWithin).mockReturnValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('country save', () => {
  it('round-trips the visits through storage', () => {
    const s = fakeStorage();
    const saved = { sites: ['construction-1'], camps: ['camp-west-1'], deer: 3, mansion: true };
    saveCountrySave(s, saved);
    expect(JSON.parse(s.m.get(COUNTRY_SAVE_KEY) ?? '{}')).toEqual({ v: 1, ...saved });
    expect(loadCountrySave(s)).toEqual(saved);
  });

  it('is empty for missing or broken saves', () => {
    const empty = { sites: [], camps: [], deer: 0, mansion: false };
    expect(loadCountrySave(null)).toEqual(empty);
    const bad = fakeStorage();
    bad.m.set(COUNTRY_SAVE_KEY, '{nope');
    expect(loadCountrySave(bad)).toEqual(empty);
  });
});

describe('installCountryAchievements', () => {
  it('counts walking into a hoarding once per site', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const player = { x: hoardingCentre.x, z: hoardingCentre.z, vehicle: null };
    const { deps, increment } = fakeDeps(player);
    const part = installCountryAchievements(deps);

    tick(part);
    tick(part, 4);
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenCalledWith(COUNTRY_ACH.levelBest);
    expect(loadCountrySave(storage).sites).toEqual([site.id]);

    // A reload reads the saved site and does not count it again.
    const reload = fakeDeps(player);
    tick(installCountryAchievements(reload.deps));
    expect(reload.increment).not.toHaveBeenCalled();
  });

  it('counts a camp once and toasts it', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const camp = CAMPS[0];
    const player = { x: camp.x + 1, z: camp.z, vehicle: null };
    const { deps, increment, toast } = fakeDeps(player);
    const part = installCountryAchievements(deps);

    tick(part);
    tick(part, 4);
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenCalledWith(COUNTRY_ACH.campCrasher);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining(`Camp found: ${camp.name} (1/10)`));
  });

  it('unlocks Mansion on the Hill once at the manor door', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const player = { x: MANOR.door.x, z: MANOR.door.z, vehicle: null };
    const { deps, unlock } = fakeDeps(player);
    const part = installCountryAchievements(deps);

    tick(part);
    tick(part, 4);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith(COUNTRY_ACH.mansion);
  });

  it('does nothing during the first 2 seconds after install', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const player = { x: MANOR.door.x, z: MANOR.door.z, vehicle: null };
    const { deps, unlock } = fakeDeps(player);
    tick(installCountryAchievements(deps), 1);
    expect(unlock).not.toHaveBeenCalled();
  });

  it('unlocks First Sprout for a crop and Oak Patience for the oak', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const { deps, unlock } = fakeDeps({ x: 0, z: 0, vehicle: null });
    installCountryAchievements(deps);

    emitHarvest({ crop: 'radish', n: 4, bed: 0 });
    expect(unlock).toHaveBeenLastCalledWith(COUNTRY_ACH.firstSprout);
    emitHarvest({ crop: 'oak', n: 2, bed: null });
    expect(unlock).toHaveBeenLastCalledWith(COUNTRY_ACH.oakPatience);
  });

  it('counts each deer once, up to twelve', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const ids = Array.from({ length: 15 }, (_, i) => i + 1);
    vi.mocked(deerWithin).mockReturnValue(ids);
    const { deps, increment } = fakeDeps({ x: 0, z: 0, vehicle: null });
    const part = installCountryAchievements(deps);

    tick(part);
    tick(part, 4);
    expect(increment).toHaveBeenCalledTimes(12);
    expect(increment).toHaveBeenCalledWith(COUNTRY_ACH.deerMe);
    expect(loadCountrySave(storage).deer).toBe(12);
  });
});
