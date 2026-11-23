// Recipes for the event sounds in eventSfx.ts. Pure: rendered to samples like synth.ts.
import type { EventSound } from './eventSfx';
import { blip, mix, noise, normalise, rng } from './synth';

export function renderEvent(sound: EventSound, sr: number): Float32Array {
  const r = rng(11);
  switch (sound) {
    case 'fall': return normalise(noise(sr, 0.25, 300, 20, r), 0.6);                      // a heavy thump
    case 'crack': return normalise(mix(noise(sr, 0.12, 3000, 35, r, 0.8), blip(sr, 0.08, 400, 200, 30)), 0.5);
    case 'loot': return normalise(noise(sr, 0.14, 2500, 30, r), 0.3);                    // a rustle
    case 'eat': return normalise(blip(sr, 0.06, 500, 350, 40), 0.25);
    case 'drink': return normalise(blip(sr, 0.08, 300, 600, 30), 0.2);
    case 'build': return normalise(noise(sr, 0.05, 1500, 60, r, 1), 0.45);              // a knock
    case 'break': return normalise(noise(sr, 0.35, 2000, 12, r), 0.55);
    case 'trap': return normalise(mix(blip(sr, 0.15, 900, 300, 10), noise(sr, 0.02, 4000, 80, r, 1)), 0.35);
    case 'harvest': return normalise(blip(sr, 0.1, 700, 900, 15), 0.2);
    case 'mow': return normalise(noise(sr, 0.8, 800, 3, r), 0.25);                      // a long low drone
  }
}
