// Before a save: object and spawn markers that have no pack entry would make the game fail to load. Pure apart from the confirm callback.
import type { MarkerDef } from '@lawn/level';
import { unknownMarkers, type MarkerKnown } from './markerCheck';

export interface UnknownRef {
  zone: string;
  kind: string;
  id: string;
}

const LIST_MAX = 10;

/** Every unknown object or spawn marker in the given zones, in zone order. */
export function findUnknownRefs(zones: { id: string; markers?: readonly MarkerDef[] }[], known?: MarkerKnown): UnknownRef[] {
  const refs: UnknownRef[] = [];
  for (const z of zones) {
    for (const m of unknownMarkers(z.markers, known)) refs.push({ zone: z.id, kind: m.kind, id: m.id });
  }
  return refs;
}

/** The confirmation text: up to ten refs, then how many were cut. */
export function unknownMessage(refs: readonly UnknownRef[]): string {
  const shown = refs.slice(0, LIST_MAX).map((r) => `${r.kind} "${r.id}" in ${r.zone}`);
  const more = refs.length - shown.length;
  return [
    "These markers have no entry in the game's packs, so the game would fail to load:",
    ...shown.map((s) => `  - ${s}`),
    ...(more > 0 ? [`  and ${more} more`] : []),
    'Save anyway only if you are about to add them to a pack in another file.',
  ].join('\n');
}

/** Does nothing when every marker is known. Otherwise asks; a refusal throws, which blocks the save. */
export function checkMarkersBeforeSave(
  zones: { id: string; markers?: readonly MarkerDef[] }[],
  confirm: (msg: string) => boolean,
  known?: MarkerKnown,
): void {
  const refs = findUnknownRefs(zones, known);
  if (refs.length === 0) return;
  if (confirm(unknownMessage(refs))) return;
  throw new Error('Save cancelled: ' + refs.map((r) => r.id).join(', '));
}
