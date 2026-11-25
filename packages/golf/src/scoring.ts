// Scoring names, seeded wind, water drops and the sea mower: golf rules that need no course and no scene.
import type { Lie, Wind } from './tuning';

/** Score name for strokes relative to par. */
export function scoreName(strokes: number, par: number, mode: 'golf' | 'disc' = 'golf'): string {
  if (strokes === 1) return mode === 'disc' ? 'ACE! Gnome in the chains!' : 'Hole in one!';
  const d = strokes - par;
  const names: Record<string, string> = { '-3': 'Albatross!', '-2': 'Eagle!', '-1': 'Birdie!', '0': 'Par', '1': 'Bogey', '2': 'Double bogey', '3': 'Triple bogey' };
  return names[String(d)] ?? `+${d}`;
}

/** Chance that a sea mower leaps out of the water and catches a ball (or gnome) that lands in it. */
export const SEA_MOWER_CHANCE = 0.25;

/**
 * Whether a sea mower catches this water shot. Decided from where it hit the water, not Math.random, so every
 * client (Together viewers, the race) sees the same thing. Cosmetic only: the penalty is the same either way.
 */
export function seaMowerCatch(f: { end: { x: number; z: number }; endLie: Lie }): boolean {
  if (f.endLie !== 'water') return false;
  const h = Math.sin(Math.round(f.end.x * 100) * 12.9898 + Math.round(f.end.z * 100) * 78.233) * 43758.5453;
  return h - Math.floor(h) < SEA_MOWER_CHANCE;
}

/** The lie a ball at rest at (x, z) is played from: never water (a drop that ran out of steps plays from the rough). */
export function playableLie(lieAt: (x: number, z: number) => Lie, x: number, z: number): Lie {
  const lie = lieAt(x, z);
  return lie === 'water' ? 'rough' : lie;
}

/**
 * Where a finished flight leaves the ball, and the penalty strokes it costs. A water ball (pond or sea) costs one
 * stroke and goes back to where it was struck from, Super Battle Golf style (stroke and distance); any other ball
 * stays where it stopped. `from` is always dry: every ball is played from a playable lie.
 */
export function restingSpot(
  from: { x: number; z: number },
  f: { end: { x: number; z: number }; endLie: Lie },
): { x: number; z: number; penalty: 0 | 1 } {
  if (f.endLie !== 'water') return { x: f.end.x, z: f.end.z, penalty: 0 };
  return { x: from.x, z: from.z, penalty: 1 };
}

/** Online: the same wind for everyone on a hole, from the round seed. */
export function seededWindFrom(seed: number, hole: number, maxWind: number): Wind {
  let a = (seed ^ Math.imul(hole + 1, 2654435761)) >>> 0;
  const rnd = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { yaw: rnd() * Math.PI * 2, mph: Math.round(rnd() * maxWind) };
}
