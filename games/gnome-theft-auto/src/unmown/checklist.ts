// The Unmown checklist (E31): "Spot the Species", the preserve's own little activity. Twelve things to see in the
// Unmown: birds (ticked when the birding journal has them), animals (ticked by standing near one inside the preserve)
// and one plant (the Last Dandelion). Local to this browser, saved under CHECKLIST_KEY. Pure: no three.js, no DOM.
import type { CritterKind } from '../critters';
import { LAST_DANDELION } from '../living/config';

export type ChecklistKind = 'bird' | 'animal' | 'plant';

export interface ChecklistEntry {
  id: string;
  name: string;
  kind: ChecklistKind;
  /** Where to look, in the rangers' words (shown in the checklist app). */
  hint: string;
  /** Ticked when the birding journal (gta-birding-v1) has seen this species. */
  birdId?: string;
  /** Ticked when the player is within SIGHT_RANGE of a critter of this kind inside the Unmown. */
  critter?: CritterKind;
  /** Ticked when the player is within SIGHT_RANGE of this spot. */
  spot?: { x: number; z: number };
}

export const CHECKLIST_KEY = 'gta-unmown-checklist-v1';
/** Metres: close enough to count an animal or the plant as spotted. */
export const SIGHT_RANGE = 12;

export const CHECKLIST: readonly ChecklistEntry[] = [
  { id: 'bittern', name: 'Reedmere Bittern', kind: 'bird', birdId: 'reedmere-bittern', hint: 'Hides in the Reedmere reeds by standing very still and pretending to be one. Listen for the boom.' },
  { id: 'harrier', name: 'Marsh Harrier', kind: 'bird', birdId: 'marsh-harrier', hint: 'Quarters low over the marsh and the Long Meadow when the wind is up.' },
  { id: 'cuckoo', name: 'Meadow Cuckoo', kind: 'bird', birdId: 'meadow-cuckoo', hint: 'Heard far more than seen. Try the Meadow Hide in the morning.' },
  { id: 'skylark', name: 'Tallgrass Skylark', kind: 'bird', birdId: 'tallgrass-skylark', hint: 'Singing very high over the Long Meadow, early in the day.' },
  { id: 'heron', name: 'Grey Reed Heron', kind: 'bird', birdId: 'reed-heron', hint: 'Standing at the edge of Reedmere, waiting for something. Bring patience.' },
  { id: 'kestrel', name: 'Verge Kestrel', kind: 'bird', birdId: 'verge-kestrel', hint: 'Hovering over the meadow edges on a gusty day.' },
  { id: 'hare', name: 'Unmown Hare', kind: 'animal', critter: 'hare', hint: 'Boxing in the Long Meadow. Approach slowly or not at all.' },
  { id: 'hedgehog', name: 'Hedgehog', kind: 'animal', critter: 'hedgehog', hint: 'Snuffling along the edge of Oldroot Wood, mostly at dusk.' },
  { id: 'fox', name: 'Fox', kind: 'animal', critter: 'fox', hint: 'Crosses the trail near the Wood Hide when nobody is looking. Be nobody.' },
  { id: 'frog', name: 'Reedmere Frog', kind: 'animal', critter: 'frog', hint: 'Under the boardwalk, loudly.' },
  { id: 'dragonfly', name: 'Dragonfly', kind: 'animal', critter: 'dragonfly', hint: 'Patrolling the marsh from the viewing platform.' },
  { id: 'dandelion', name: 'The Last Dandelion', kind: 'plant', spot: LAST_DANDELION, hint: 'In a ring of stones in the Long Meadow. Do not pick it. Do not even think about blowing on it.' },
];

export interface ChecklistStore {
  /** Ids ticked so far. */
  seen(): ReadonlySet<string>;
  /** Tick an entry. True only the first time (unknown ids are ignored and return false). */
  mark(id: string): boolean;
  /** Every entry ticked. */
  complete(): boolean;
}

/** Storage holds a JSON array of ticked ids under CHECKLIST_KEY. Missing, throwing or garbage storage starts empty and
 *  keeps an in-memory set instead (like the other GTA stores). */
export function createChecklistStore(storage?: Pick<Storage, 'getItem' | 'setItem'> | null): ChecklistStore {
  const ids = new Set(CHECKLIST.map((e) => e.id));
  const seen = new Set<string>();
  try {
    const raw = storage?.getItem(CHECKLIST_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) for (const v of arr) if (typeof v === 'string' && ids.has(v)) seen.add(v);
  } catch { /* garbage: start empty */ }
  return {
    seen: () => seen,
    mark(id) {
      if (!ids.has(id) || seen.has(id)) return false;
      seen.add(id);
      try { storage?.setItem(CHECKLIST_KEY, JSON.stringify([...seen])); } catch { /* memory only */ }
      return true;
    },
    complete: () => seen.size === ids.size,
  };
}

/**
 * The entries a moment of looking ticks: animals within SIGHT_RANGE of the player, spots within SIGHT_RANGE, birds the
 * journal has seen. `inUnmown` false: only birds count (the journal is global; animals and the plant must be seen in
 * the preserve). Returns entry ids not yet in `already`.
 */
export function sightings(
  px: number, pz: number, inUnmown: boolean,
  critters: readonly { kind: CritterKind; x: number; z: number }[],
  birdSeen: (birdId: string) => boolean,
  already: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const r2 = SIGHT_RANGE * SIGHT_RANGE;
  for (const e of CHECKLIST) {
    if (already.has(e.id)) continue;
    if (e.birdId && birdSeen(e.birdId)) out.push(e.id);
    else if (inUnmown && e.critter && critters.some((c) => c.kind === e.critter && (c.x - px) ** 2 + (c.z - pz) ** 2 <= r2)) out.push(e.id);
    else if (inUnmown && e.spot && (e.spot.x - px) ** 2 + (e.spot.z - pz) ** 2 <= r2) out.push(e.id);
  }
  return out;
}
