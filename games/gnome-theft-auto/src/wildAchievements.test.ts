import { describe, expect, it } from 'vitest';
import { getAchievement } from '@lawn/achievements';
import { CRITTER_ACHIEVEMENTS, HELMED_KEY, HELM_BOATS, recordHelm, type HelmStorage } from './wildAchievements';

function memStorage(initial: Record<string, string> = {}): HelmStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

describe('CRITTER_ACHIEVEMENTS', () => {
  it('every value is a catalog achievement', () => {
    for (const id of Object.values(CRITTER_ACHIEVEMENTS)) {
      expect(getAchievement(id), id).toBeDefined();
    }
  });
});

describe('recordHelm', () => {
  it('is true once per boat kind, false on a repeat', () => {
    const s = memStorage();
    for (const kind of HELM_BOATS) {
      expect(recordHelm(kind, s)).toBe(true);
      expect(recordHelm(kind, s)).toBe(false);
    }
  });

  it('is false for a ride-on and for Tessie', () => {
    const s = memStorage();
    expect(recordHelm('ride-on', s)).toBe(false);
    expect(recordHelm('tessie', s)).toBe(false);
  });

  it('survives a new call with the same storage', () => {
    const s = memStorage();
    expect(recordHelm('walnut-dinghy', s)).toBe(true);
    expect(JSON.parse(s.data[HELMED_KEY])).toContain('walnut-dinghy');
    expect(recordHelm('walnut-dinghy', s)).toBe(false);
  });

  it('treats garbage JSON as empty', () => {
    const s = memStorage({ [HELMED_KEY]: '{not json' });
    expect(recordHelm('gravy-boat', s)).toBe(true);
    expect(recordHelm('gravy-boat', s)).toBe(false);
  });
});
