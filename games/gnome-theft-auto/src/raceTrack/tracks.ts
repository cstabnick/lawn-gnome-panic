// The race-track registry (E14): every Track in the world, by id. terrain.ts shapes the ground for each (in this
// order), surfaces.ts asks each what its road drives like, terrain.waterAt asks each for ford water, and the 'race'
// objective (quests/objectivesRace.ts) runs on `trackById(obj.trackId ?? 'lost-and-found')`.
// To add a track (E26 street circuits, a beach run...): write a TrackDef in defs/, add it to TRACK_IDS and TRACKS
// below, keep tracks.test.ts green. Contract: docs/roadmaps/gta-batch-3/E14/contracts.md.
import type { SurfaceKind } from '../surfaces';
import { CAPWOOD_RUN } from './defs/capwoodRun';
import { RUTBOTTOM } from './defs/rutbottom';
import { SPEEDWAY } from './track';
import { createTrack, type FordHit, type Track } from './trackDef';

export const TRACK_IDS = ['lost-and-found', 'rutbottom', 'capwood-run'] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export const TRACKS: Readonly<Record<TrackId, Track>> = {
  'lost-and-found': SPEEDWAY,
  rutbottom: createTrack(RUTBOTTOM),
  'capwood-run': createTrack(CAPWOOD_RUN),
};

/** Every track, in registry order. */
export const ALL_TRACKS: readonly Track[] = TRACK_IDS.map((id) => TRACKS[id]);

/** The track with this id (throws on an unknown id). */
export function trackById(id: string): Track {
  const t = (TRACKS as Record<string, Track>)[id];
  if (!t) throw new Error(`unknown track '${id}'`);
  return t;
}

/** The surface of whichever track's road is at (x, z), or null off every track road. */
export function trackSurfaceAt(x: number, z: number): SurfaceKind | null {
  for (const t of ALL_TRACKS) {
    const s = t.surfaceAt(x, z);
    if (s) return s;
  }
  return null;
}

/** Ford water (Cap-water) at (x, z) on any track, or null. */
export function fordWaterAt(x: number, z: number): FordHit | null {
  for (const t of ALL_TRACKS) {
    const f = t.fordAt(x, z);
    if (f) return f;
  }
  return null;
}

/**
 * True within `margin` metres outside the barriers of any track (or on it). Scenery scatter uses it to keep trees and
 * clutter off the roads, chiefly the Capwood Run, which crosses open country outside any rectangular slot.
 */
export function nearTrack(x: number, z: number, margin = 0): boolean {
  for (const t of ALL_TRACKS) {
    const b = t.bounds();
    if (x < b.minX - margin || x > b.maxX + margin || z < b.minZ - margin || z > b.maxZ + margin) continue;
    const reach = t.def.barrierOffset + margin;
    const spot = t.locate(x, z, reach);
    if (spot && Math.abs(spot.lat) <= reach) return true;
  }
  return false;
}
