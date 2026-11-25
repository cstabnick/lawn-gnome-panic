import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '@lawn/achievements';
import { BAND_ACHIEVEMENTS, bandAchievement } from './bandAchievements';

describe('band achievements', () => {
  it('maps each band biome to its achievement', () => {
    expect(bandAchievement('highland')).toBe('gta-band-highlands');
    expect(bandAchievement('coast')).toBe('gta-band-shore');
    expect(bandAchievement('campus')).toBe('gta-band-campus');
    expect(bandAchievement('estate')).toBe('gta-band-estates');
    expect(bandAchievement('continental')).toBe('gta-band-pardonlin');
    expect(bandAchievement('preserve')).toBe('gta-band-unmown');
  });

  it('gives no achievement for ordinary biomes', () => {
    expect(bandAchievement('city')).toBeNull();
    expect(bandAchievement('forest')).toBeNull();
  });

  it('only points at achievements that exist in the catalog', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const id of Object.values(BAND_ACHIEVEMENTS)) {
      expect(ids.has(id!), `missing catalog entry ${id}`).toBe(true);
    }
  });
});
