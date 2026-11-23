// Region ambience beds (city hum, forest, tundra wind, desert, farmland, water, crowds) and their spot sounds.
// (Stub: filled in by Epic 2.)
import type { BiomeId } from '../types';

export interface AmbienceFrame {
  dt: number;
  /** Listener position. */
  x: number;
  z: number;
  biome: BiomeId;
  /** 0 day .. 1 night (atmosphere.nightFactor()). */
  night: number;
  /** atmosphere.timeLabel(): 'Morning' | 'Noon' | 'Golden Hour' | 'Dusk' | 'Neon Night' | 'Dawn'. */
  timeLabel: string;
  /** districts.ts districtAt(x, z) id, or null outside the city districts. */
  district: string | null;
  /** How many gnomes (NPCs) are within 25 m: crowd density. */
  people: number;
  /** True while flying or parachuting (wind rushes, ground beds thin out). */
  airborne: boolean;
}

export interface Ambience {
  update(f: AmbienceFrame): void;
}

export function createAmbience(): Ambience {
  return { update() {} };
}
