// Which object and spawn markers have no entry in the game's packs. Pure apart from the default lookup, so tests pass their own.
import type { MarkerDef } from '@lawn/level';
import { OBJECTS, SPAWNS } from '@gnomomia/content';

/** What the packs know. Tests pass their own. */
export interface MarkerKnown {
  object(id: string): boolean;
  spawn(id: string): boolean;
}

export const PACK_KNOWN: MarkerKnown = {
  object: (id) => OBJECTS[id] !== undefined,
  spawn: (id) => SPAWNS.some((s) => s.id === id),
};

/** The `object` and `spawn` markers whose id has no pack entry. Markers of any other kind are never reported. */
export function unknownMarkers(markers: readonly MarkerDef[] | undefined, known: MarkerKnown = PACK_KNOWN): MarkerDef[] {
  return (markers ?? []).filter((m) => (m.kind === 'object' && !known.object(m.id)) || (m.kind === 'spawn' && !known.spawn(m.id)));
}
