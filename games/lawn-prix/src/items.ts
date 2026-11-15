// STUB (Epic 2 fills stepItems and cpuItemUse): item boxes, picking up, using items, acorns in flight. Pure functions
// of plain data: no three.js, no DOM, no Math.random (randomness comes from itemRoll below).
import { ITEMS, type KartInput, type RaceState } from './config';
import { pointAt, type Track } from './track';

/** Item box positions, in the order of RaceState.boxes: each row in course.boxRows, ITEMS.boxesPerRow across. */
export function boxSpots(track: Track): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const n = ITEMS.boxesPerRow;
  for (const f of track.course.boxRows) {
    const p = pointAt(track, f * track.length);
    for (let i = 0; i < n; i++) {
      // Spread across the track, inside the edges: offsets from +w/2 to -w/2 with a margin of 1.2 m.
      const off = (track.width / 2 - 1.2) * (1 - (2 * i) / (n - 1));
      out.push({ x: p.x + p.tz * off, z: p.z - p.tx * off });
    }
  }
  return out;
}

/** Deterministic 0..1 "random" number from a race time and a kart/box index (no rng is passed to the sim). */
export function itemRoll(t: number, a: number, b: number): number {
  let h = (Math.floor(t * 600) * 374761393 + a * 668265263 + b * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** One step of items: box pickups and respawns, item use on a fresh press of input.item, acorns flying and hitting.
 *  Called by stepRace after the karts moved. Returns events for sound/HUD. */
export function stepItems(race: RaceState, track: Track, inputs: readonly (KartInput | null)[], dt: number): ItemEvents {
  void race; void track; void inputs; void dt;
  return { picked: [], used: [], hits: [] };
}

export interface ItemEvents {
  /** Kart indices that picked up an item this step. */
  picked: number[];
  /** Kart indices that used their item this step. */
  used: number[];
  /** Kart indices hit by an acorn this step. */
  hits: number[];
}

/** Should CPU kart i press the item button this step? */
export function cpuItemUse(race: RaceState, track: Track, index: number): boolean {
  void race; void track; void index;
  return false;
}
