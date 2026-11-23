// Tuft hunting: footprints. Pure: a ring of prints each quarry leaves behind as it walks, aged and dropped after
// HUNT.trackLife seconds. trackView.ts draws them; hunting.ts reads them for the "fresh tracks" hint.
import type { Quarry } from './quarry';
import { HUNT, type SpeciesId } from './species';

export interface Print {
  x: number;
  z: number;
  /** Direction the quarry was heading, radians (same convention as Quarry.yaw: 0 = +z, PI/2 = +x). */
  yaw: number;
  /** Seconds since it was left. */
  age: number;
  /** Alternates left/right foot. */
  left: boolean;
  species: SpeciesId;
}

export interface Tracks {
  readonly prints: readonly Print[];
  add(p: Omit<Print, 'age'>): void;
  /** Age every print by dt and drop the ones older than the life. */
  update(dt: number): void;
  /** Prints within r of (x, z), newest first. */
  near(x: number, z: number, r: number): Print[];
  clear(): void;
}

export function createTracks(max: number = HUNT.maxPrints, life: number = HUNT.trackLife): Tracks {
  // Oldest first: add() pushes to the end, so the front is always the oldest print.
  const prints: Print[] = [];
  return {
    prints,
    add(p) {
      prints.push({ ...p, age: 0 });
      while (prints.length > max) prints.shift();
    },
    update(dt) {
      for (const p of prints) p.age += dt;
      // Every print ages at the same rate, so the oldest ones are always at the front.
      let drop = 0;
      while (drop < prints.length && prints[drop].age > life) drop++;
      if (drop > 0) prints.splice(0, drop);
    },
    near(x, z, r) {
      const r2 = r * r;
      return prints
        .filter((p) => (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) <= r2)
        .sort((a, b) => a.age - b.age);
    },
    clear() { prints.length = 0; },
  };
}

// Which foot a quarry places next, per quarry. Not saved: a fresh quarry starts on the left.
const nextLeft = new WeakMap<Quarry, boolean>();

/** Call after stepQuarry: leaves a print when the quarry has moved a stride on the ground. */
export function leavePrints(tracks: Tracks, q: Quarry): void {
  if (q.mode === 'hidden' || q.mode === 'burrowed' || q.mode === 'flying' || q.lift > 0.05) return;
  if (q.moved < q.species.stride) return;

  const left = !(nextLeft.get(q) ?? false);
  nextLeft.set(q, left);
  // Feet sit either side of the line of travel; drags (a shell in the sand) leave one centred trail.
  const side = q.species.print === 'drag' ? 0 : (left ? -1 : 1) * q.species.radius * 0.35;
  // Sideways = perpendicular to the heading (forward = (sin yaw, cos yaw)).
  const x = q.x + Math.cos(q.yaw) * side;
  const z = q.z - Math.sin(q.yaw) * side;
  tracks.add({ x, z, yaw: q.yaw, left, species: q.species.id });
  q.moved = 0;
}
