// Sky presence (L20): how long a looping NPC aircraft stays up, how long it stays away, and the start-of-session
// delay. Pure functions, no three.js. The runtime passes Math.random (or a seeded rnd in tests).
import type { SkyBehaviourDef } from './types';

/** A random value in [r[0], r[1]]. */
export function rollRange(r: readonly [number, number], rnd: () => number): number {
  return r[0] + (r[1] - r[0]) * rnd();
}

/** Absolute time it should leave: Infinity when forced or without presence. */
export function presenceUntil(def: SkyBehaviourDef, time: number, forced: boolean, rnd: () => number): number {
  if (forced || !def.presence) return Infinity;
  return time + rollRange(def.presence.onFor, rnd);
}

/** Seconds it stays away after leaving: rolled offFor with presence, else def.cooldown. */
export function awayFor(def: SkyBehaviourDef, rnd: () => number): number {
  return def.presence ? rollRange(def.presence.offFor, rnd) : def.cooldown;
}

/** Start-of-session delay so not every behaviour is up at once: rollRange([0, presence.offFor[0]]) with presence, else 0. */
export function initialDelay(def: SkyBehaviourDef, rnd: () => number): number {
  return def.presence ? rollRange([0, def.presence.offFor[0]], rnd) : 0;
}
