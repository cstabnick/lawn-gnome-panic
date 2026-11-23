// The wind bed: a filtered noise loop whose brightness and level follow the district, the zone traits, the night and the
// weather (world-ambience.md). Pure: the audio controller turns these numbers into Web Audio parameters.
import type { DistrictId, Trait, WeatherKind } from '../sim/types';

export interface BedParams {
  cutoff: number;   // Hz, lowpass on the wind noise: higher is airier
  gain: number;     // 0..1 before the Ambience bus level
  gust: number;     // 0..1 depth of the slow swell on the cutoff
}

const DISTRICT_BED: Record<DistrictId, BedParams> = {
  'lychgate': { cutoff: 900, gain: 0.5, gust: 0.4 },
  'old-rows': { cutoff: 700, gain: 0.45, gust: 0.3 },
  'yew-walk': { cutoff: 1100, gain: 0.5, gust: 0.5 },
  'gnome-garden': { cutoff: 1300, gain: 0.45, gust: 0.5 },
  'wreathwood': { cutoff: 800, gain: 0.5, gust: 0.4 },
  'compost': { cutoff: 600, gain: 0.4, gust: 0.25 },
  'columbarium': { cutoff: 500, gain: 0.35, gust: 0.15 },
  'bell-chapel': { cutoff: 650, gain: 0.4, gust: 0.2 },
  'mausoleum-hill': { cutoff: 1000, gain: 0.55, gust: 0.6 },
  'lawn-section': { cutoff: 1200, gain: 0.45, gust: 0.45 },
  'drowned-corner': { cutoff: 550, gain: 0.45, gust: 0.25 },
  'shed': { cutoff: 750, gain: 0.4, gust: 0.35 },
};

const SILENT: BedParams = { cutoff: 300, gain: 0, gust: 0 };

export function bedFor(district: DistrictId | null, traits: readonly Trait[], night: boolean, weather: WeatherKind): BedParams {
  if (district === null) return SILENT;
  const base = DISTRICT_BED[district];
  let { cutoff, gain } = base;
  if (traits.includes('HUSH')) gain *= 0.6;
  if (traits.includes('DARK')) cutoff *= 0.8;
  if (traits.includes('HIGH')) gain *= 1.2;
  if (night) { cutoff *= 0.8; gain *= 1.1; }
  if (weather === 'rain' || weather === 'drizzle') { cutoff *= 1.8; gain *= 1.3; }
  if (weather === 'storm') { cutoff *= 2; gain *= 1.6; }
  if (weather === 'fog') gain *= 0.7;
  return { cutoff: Math.round(cutoff), gain: Math.min(1, gain), gust: base.gust };
}
