// Weather (E06, docs/roadmaps/gta-batch-3/E06/contracts.md): the shared types. Import-light: no three.js, no DOM.
import type { RegionId } from '../levels';

/** What the sky is doing. 'mist' is fog only (no particles); 'snow' on the Fells is frost glaze, as the locals insist. */
export type WeatherKind = 'clear' | 'cloud' | 'mist' | 'rain' | 'snow';

export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'cloud', 'mist', 'rain', 'snow'];

/** The weather at one place and moment. `intensity` is 0..1 (0 = none of it yet, 1 = the full downpour). */
export interface WeatherState {
  kind: WeatherKind;
  intensity: number;
}

/** A region's climate: relative weights of each kind (any scale) and the strongest rain it gets. */
export interface Climate {
  weights: Partial<Record<WeatherKind, number>>;
  /** Rain intensity cap, 0..1 (Pardonlin drizzles). Default 1. */
  rainMax?: number;
}

export type { RegionId };
