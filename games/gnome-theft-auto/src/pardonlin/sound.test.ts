import { describe, expect, it } from 'vitest';
import { PL_SOUND_IDS } from './sounds.recipes';
import { SOUND_SPOTS } from './sound';

describe('Pardonlin sound spots', () => {
  it('every spot is inside Pardonlin', () => {
    for (const s of SOUND_SPOTS) {
      expect(s.x, s.id).toBeGreaterThanOrEqual(-1800);
      expect(s.x, s.id).toBeLessThanOrEqual(-1398);
      expect(s.z, s.id).toBeGreaterThanOrEqual(-900);
      expect(s.z, s.id).toBeLessThanOrEqual(1100);
    }
  });

  it('every interval is ordered', () => {
    for (const s of SOUND_SPOTS) expect(s.every[0], s.id).toBeLessThanOrEqual(s.every[1]);
  });

  it('every sound id is prefixed pl-', () => {
    for (const id of PL_SOUND_IDS) expect(id.startsWith('pl-')).toBe(true);
  });
});
