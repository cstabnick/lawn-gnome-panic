// Weather tuning (E06). Every number a human may want to tweak lives here.
import type { Tier } from '../quality';
import type { Climate, RegionId, WeatherKind } from './types';

export const WEATHER = {
  /** Wall-clock seconds per weather block: everyone online sees the same block (no network message needed). */
  blockSeconds: 600,
  /** Seconds to fade a kind fully in or out (intensity 0 <-> 1). A change of kind fades out, then in. */
  fadeSeconds: 18,
  /** Weakest and strongest intensity a block rolls (before the region's rainMax). */
  minIntensity: 0.35,
  maxIntensity: 1,
  /** Seconds out in rain (on foot or in an open vehicle) for "Caught in the Rain"; in snow for "Glazed Over". */
  rainAchievementS: 120,
  snowAchievementS: 60,
  /** Weather that counts for those achievements is at least this strong. */
  achievementMinIntensity: 0.3,
} as const;

/**
 * How each kind dims the sky through the atmosphere (atmosphere.ts setWeatherLook), at intensity 1. `overcast` greys the
 * sky and dims the sun; `mist` pulls the fog in.
 */
export const WEATHER_LOOK: Record<WeatherKind, { overcast: number; mist: number }> = {
  clear: { overcast: 0, mist: 0 },
  cloud: { overcast: 0.35, mist: 0 },
  mist: { overcast: 0.25, mist: 1 },
  rain: { overcast: 0.75, mist: 0.25 },
  snow: { overcast: 0.5, mist: 0.4 },
};

/**
 * Particle and cloud budgets per render tier (quality.ts). Phones start on 'medium': about 40 percent of the desktop
 * count, and no cloud layer on 'low' and 'min'.
 */
export const WEATHER_TIERS: Record<Tier, { rain: number; snow: number; clouds: number }> = {
  high: { rain: 1600, snow: 1100, clouds: 14 },
  medium: { rain: 640, snow: 440, clouds: 8 },
  low: { rain: 360, snow: 260, clouds: 0 },
  min: { rain: 200, snow: 150, clouds: 0 },
};

/**
 * Climate per region. Every region rolls against the same block number, so a wet block is wet across most of the map
 * at once (a passing front) while the dry regions stay mostly dry. Order matters only for that shared roll: kinds are
 * stacked clear, cloud, mist, rain, snow.
 */
export const CLIMATE: Record<RegionId, Climate> = {
  turfton: { weights: { clear: 0.5, cloud: 0.25, mist: 0.07, rain: 0.18 } },
  'dust-flats': { weights: { clear: 0.8, cloud: 0.15, rain: 0.05 }, rainMax: 0.6 },
  'mossy-wood': { weights: { clear: 0.35, cloud: 0.25, mist: 0.15, rain: 0.25 } },
  // Frost glaze, not snow (critters/fells.ts). It looks a lot like snow.
  'frostbite-fells': { weights: { clear: 0.3, cloud: 0.2, snow: 0.5 } },
  'cloverfield-farms': { weights: { clear: 0.5, cloud: 0.25, mist: 0.05, rain: 0.2 } },
  'loch-moss': { weights: { clear: 0.25, cloud: 0.25, mist: 0.3, rain: 0.2 } },
  'tallgrass-commons': { weights: { clear: 0.55, cloud: 0.25, mist: 0.03, rain: 0.17 } },
  // Snowcap Rise.
  'north-highlands': { weights: { clear: 0.3, cloud: 0.2, mist: 0.05, snow: 0.45 } },
  // Saltbucket Shore: sea mist rolls in off the Saltwater.
  'south-shore': { weights: { clear: 0.45, cloud: 0.2, mist: 0.25, rain: 0.1 } },
  // Rootwell.
  'east-campus': { weights: { clear: 0.5, cloud: 0.3, rain: 0.2 } },
  // Trellisdown.
  'west-estates': { weights: { clear: 0.55, cloud: 0.25, mist: 0.05, rain: 0.15 } },
  // Pardonlin: the continental drizzle (often, never hard).
  pardonlin: { weights: { clear: 0.3, cloud: 0.3, rain: 0.4 }, rainMax: 0.45 },
  'the-unmown': { weights: { clear: 0.5, cloud: 0.25, mist: 0.05, rain: 0.2 } },
};

/** Toast lines when the weather turns, one picked per change (shown at most once per kind per few minutes). */
export const WEATHER_LINES: Record<WeatherKind, readonly string[]> = {
  clear: ['The sky clears. The Tall Ones must have turned the sprinkler off.', 'Sun\'s back. Somebody fetch the lawn chairs.'],
  cloud: ['Clouds rolling in. Good weather for being suspicious.', 'Overcast. Perfect light for a getaway.'],
  mist: ['A mist settles in. Every gnome looks like a suspect now.', 'Fog. Drive like your hat depends on it.'],
  rain: ['Rain. Glazed gnomes are waterproof; your paint job may not be.', 'It\'s raining. The worms are throwing a party.'],
  snow: ['It\'s snowing. (The Fells folk will tell you it is frost glaze.)', 'Flakes falling. Mind the ice, mind the hat.'],
};
