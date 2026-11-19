// Where ghosts are kept. One best run per course and vehicle.
//
// GhostStore is the seam for the global leaderboard (see PR 177, server authority): a platform-backed store
// implements the same two calls (load the run to race against, save a finished run) and nothing else changes.
import type { CourseId, VehicleId } from './config';
import { isBetter, parseGhostRun, type GhostRun } from './ghost';

export interface GhostStore {
  /** The best run to race against for this course and vehicle, or null when there is none. */
  load(course: CourseId, vehicle: VehicleId): Promise<GhostRun | null>;
  /** Keeps run when it beats the stored best. Resolves true when it became the new best. Never rejects. */
  save(run: GhostRun): Promise<boolean>;
}

export const GHOST_KEY_PREFIX = 'lawn-prix.ghost.v1.';

export function ghostKey(course: CourseId, vehicle: VehicleId): string {
  return `${GHOST_KEY_PREFIX}${course}.${vehicle}`;
}

/** A GhostStore over any Storage-like object (localStorage in the game, a fake in tests). */
export function createLocalGhostStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null): GhostStore {
  function read(course: CourseId, vehicle: VehicleId): GhostRun | null {
    try {
      const text = storage?.getItem(ghostKey(course, vehicle));
      if (!text) return null;
      const run = parseGhostRun(JSON.parse(text));
      // Stored under the wrong key (or hand-edited): ignore it.
      return run && run.course === course && run.vehicle === vehicle ? run : null;
    } catch {
      return null; // unreadable or storage blocked: no ghost
    }
  }
  return {
    load: (course, vehicle) => Promise.resolve(read(course, vehicle)),
    save(run) {
      const valid = parseGhostRun(run);
      if (!valid || !isBetter(valid, read(valid.course, valid.vehicle))) return Promise.resolve(false);
      try {
        storage?.setItem(ghostKey(valid.course, valid.vehicle), JSON.stringify(valid));
        return Promise.resolve(storage !== null);
      } catch {
        return Promise.resolve(false); // private window or quota: the run is not kept
      }
    },
  };
}

/** The store the game uses: this browser's localStorage. */
export function createBrowserGhostStore(): GhostStore {
  let storage: Storage | null = null;
  try {
    storage = localStorage;
  } catch { /* blocked */ }
  return createLocalGhostStore(storage);
}
