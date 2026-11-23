// Engine sounds for the NPC aircraft (sound/engines.ts). Each behaviour sets Vehicle.variant to one of these ids, so
// enginePool.ts plays a distant drone a little different from the player's own craft of that kind.
import { registerEngineSound } from '../sound/engines';

export const SKY_SOUNDS = {
  prop: 'sky-prop',
  sport: 'sky-sport',
  copter: 'sky-copter',
  balloon: 'sky-balloon',
} as const;

let done = false;

/** Register once (createSkyTraffic calls it). */
export function registerSkySounds(): void {
  if (done) return;
  done = true;
  // A heavier, lower prop drone than the player's Crop Duster: heard from far off, never loud.
  registerEngineSound(SKY_SOUNDS.prop, { wave: 'drone', idleHz: 30, maxHz: 62, gears: 0, bright: 0.45, rough: 0.3, gain: 0.8, chop: 0.45, idleLevel: 0.6 });
  // The sport plane: buzzier, for the circuit and the sky-writer.
  registerEngineSound(SKY_SOUNDS.sport, { wave: 'drone', idleHz: 36, maxHz: 80, gears: 0, bright: 0.6, rough: 0.25, gain: 0.8, chop: 0.35 });
  // Copters: slow chop with a turbine whine.
  registerEngineSound(SKY_SOUNDS.copter, {
    wave: 'drone', idleHz: 24, maxHz: 48, gears: 0, bright: 0.4, rough: 0.3, gain: 0.85, chop: 0.55, turbo: 0.2, whineRatio: 13,
  });
  // The balloon's burner: a low roar.
  registerEngineSound(SKY_SOUNDS.balloon, { wave: 'chug', idleHz: 8, maxHz: 16, gears: 0, bright: 0.2, rough: 0.9, gain: 0.55, noise: 1.6, idleLevel: 0.35 });
}
