import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installSocietyAchievements } from './achievements';
import { SOCIETY_ACH, SOCIETY_EVENTS, SOCIETY_SAVE_KEY, type SocietyDeps } from './config';
import { emptySocietySave } from './save';

function memStorage(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
    clear: () => data.clear(),
    key: () => null,
    get length() { return data.size; },
  };
}

function fakeDeps() {
  const unlock = vi.fn();
  const increment = vi.fn();
  const deps = {
    unlock,
    increment,
    player: { x: 0, y: 0, z: 0, yaw: 0 },
  } as unknown as SocietyDeps;
  return { deps, unlock, increment };
}

describe('installSocietyAchievements', () => {
  beforeEach(() => {
    const save = emptySocietySave();
    save.moleJobs = { roots: 1, lamps: 1, post: 1, dig: 1 };
    save.updraftRides = 0;
    vi.stubGlobal('localStorage', memStorage({ [SOCIETY_SAVE_KEY]: JSON.stringify(save) }));
    vi.stubGlobal('window', new EventTarget());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('catches up from the save: honest dirt and every hall unlock at install', () => {
    const { deps, unlock } = fakeDeps();
    installSocietyAchievements(deps);
    expect(unlock).toHaveBeenCalledWith(SOCIETY_ACH.honestDirt);
    expect(unlock).toHaveBeenCalledWith(SOCIETY_ACH.everyHall);
    expect(unlock).not.toHaveBeenCalledWith(SOCIETY_ACH.verticality);
  });

  it('unlocks verticality on the updraft event', () => {
    const { deps, unlock } = fakeDeps();
    installSocietyAchievements(deps);
    unlock.mockClear();
    window.dispatchEvent(new Event(SOCIETY_EVENTS.updraft));
    expect(unlock).toHaveBeenCalledWith(SOCIETY_ACH.verticality);
  });

  it('unlocks honest dirt and increments every hall on a first mole job', () => {
    vi.stubGlobal('localStorage', memStorage({
      [SOCIETY_SAVE_KEY]: JSON.stringify({ ...emptySocietySave(), moleJobs: { roots: 1, lamps: 0, post: 0, dig: 0 } }),
    }));
    const { deps, unlock, increment } = fakeDeps();
    installSocietyAchievements(deps);
    unlock.mockClear();
    window.dispatchEvent(new CustomEvent(SOCIETY_EVENTS.moleJobDone, { detail: { job: 'roots', stars: 3, pay: 10 } }));
    expect(unlock).toHaveBeenCalledWith(SOCIETY_ACH.honestDirt);
    expect(increment).toHaveBeenCalledWith(SOCIETY_ACH.everyHall);
  });

  it('does not increment every hall on a repeat job', () => {
    vi.stubGlobal('localStorage', memStorage({
      [SOCIETY_SAVE_KEY]: JSON.stringify({ ...emptySocietySave(), moleJobs: { roots: 3, lamps: 0, post: 0, dig: 0 } }),
    }));
    const { deps, increment } = fakeDeps();
    installSocietyAchievements(deps);
    window.dispatchEvent(new CustomEvent(SOCIETY_EVENTS.moleJobDone, { detail: { job: 'roots', stars: 2, pay: 5 } }));
    expect(increment).not.toHaveBeenCalled();
  });
});
