import type { BiomeId } from './types';

/** The batch-3 band biomes (E01) and the achievement the first visit unlocks (packages/achievements catalog.ts). */
export const BAND_ACHIEVEMENTS: Readonly<Partial<Record<BiomeId, string>>> = {
  highland: 'gta-band-highlands', coast: 'gta-band-shore', campus: 'gta-band-campus', estate: 'gta-band-estates',
  continental: 'gta-band-pardonlin', preserve: 'gta-band-unmown',
};

/** The achievement to unlock on entering `biome`, or null. */
export function bandAchievement(biome: BiomeId): string | null {
  return BAND_ACHIEVEMENTS[biome] ?? null;
}
