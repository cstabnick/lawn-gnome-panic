// The layer plan (music-ui-and-tech.md 1.2 to 1.4): for the game's state, the gain each layer of the Mossgrave score should
// sit at. Pure, so the mood rules are unit-tested without the audio engine. The music controller ramps the layers to these.
import type { Level } from './tension';

export interface LayerInput {
  level: Level;        // the tension level (tension.ts)
  fight: boolean;      // a hit or an attack lately
  inHaven: boolean;
  night: boolean;
  hush: boolean;       // zone trait HUSH: the level is capped
  sacred: boolean;     // zone trait SACRED: no drums
  wet: boolean;        // zone trait MOSSY or FLOODS: the drip
  thin: boolean;       // zone trait HIGH or DARK: a thinner pad
}

export interface LayerPlan {
  pad: number; day: number; night: number; haven: number; drip: number;
  pulse: number; ostinato: number; drums: number; stabs: number;
}

/** HUSH never goes past Tense (level 2). */
export const HUSH_MAX_LEVEL: Level = 2;

export function layerPlan(i: LayerInput): LayerPlan {
  const level = i.hush ? (Math.min(i.level, HUSH_MAX_LEVEL) as Level) : i.level;
  const h = i.inHaven;
  const threat = !h;
  return {
    pad: h ? 0.6 : i.thin ? 0.8 : 1,
    // Day, night and the haven are gains; the threat tiers stay silent inside the haven.
    day: h ? 0.3 : i.night ? 0 : 1,
    night: h ? 0.2 : i.night ? 1 : 0,
    haven: h ? 1 : 0,
    drip: threat && i.wet ? 1 : 0,
    pulse: threat && level >= 1 ? 1 : 0,
    ostinato: threat && level >= 2 ? 1 : 0,
    drums: threat && !i.sacred && level >= 3 ? 1 : 0,
    stabs: threat && level >= 3 && i.fight ? 1 : 0,
  };
}
