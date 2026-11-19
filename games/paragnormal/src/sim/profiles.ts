// The five Gnome-Souls of the Tall House. Each one hunts a different way, and the numbers here are the whole difference
// between them: how far it sees you (lantern lit or dark, hiding or standing), how far it hears a sprint, whether
// hiding works on it at all, and which part of the house it patrols.
import type { MonsterKind } from './types';

export interface MonsterProfile {
  kind: MonsterKind;
  name: string;
  baseSpeed: number;
  sightLit: number; // sight range while your lantern is lit
  sightDark: number; // sight range while it is dark
  hideLit: number; // sight range while you hide under furniture with the lantern lit
  hideDark: number; // sight range while you hide in the dark
  hearMul: number; // multiplies how far a sprint carries
  ignoresHiding: boolean; // crawls under the furniture after you
  patrol: readonly [number, number]; // share of the house's waypoints it walks, front to back
  startRoom: number;
}

export const MONSTER_PROFILES: Readonly<Record<MonsterKind, MonsterProfile>> = {
  gardener: {
    kind: 'gardener',
    name: 'The Hollow Gardener',
    baseSpeed: 1.85,
    sightLit: 9.5,
    sightDark: 4.0,
    hideLit: 2.2,
    hideDark: 1.2,
    hearMul: 1,
    ignoresHiding: false,
    patrol: [0, 0.7],
    startRoom: 2,
  },
  watcher: {
    kind: 'watcher',
    name: 'The Porcelain Watcher',
    baseSpeed: 1.95,
    sightLit: 9.5,
    sightDark: 4.0,
    hideLit: 2.2,
    hideDark: 1.2,
    hearMul: 1,
    ignoresHiding: false,
    patrol: [0.4, 1],
    startRoom: 5,
  },
  lamplighter: {
    kind: 'lamplighter',
    name: 'The Lamplighter',
    baseSpeed: 1.6,
    sightLit: 15, // a lit lantern is a beacon: it sees you from across the room
    sightDark: 3.0, // blind in the dark, so the switch is a real defence
    hideLit: 4.5, // hiding helps less when the flame gives you away
    hideDark: 1.0,
    hearMul: 1,
    ignoresHiding: false,
    patrol: [0.2, 0.6],
    startRoom: 1,
  },
  crawler: {
    kind: 'crawler',
    name: 'The Dripping Nanny',
    baseSpeed: 1.5,
    sightLit: 6.5,
    sightDark: 3.0,
    hideLit: 4.0,
    hideDark: 2.0,
    hearMul: 1.2,
    ignoresHiding: true, // it comes in under the table after you
    patrol: [0.5, 1],
    startRoom: 3,
  },
  hush: {
    kind: 'hush',
    name: 'The Hush',
    baseSpeed: 1.7,
    sightLit: 2.5,
    sightDark: 1.5,
    hideLit: 1.2,
    hideDark: 0.8,
    hearMul: 1.6, // it hears a sprint from much farther away than anything else
    ignoresHiding: false,
    patrol: [0.1, 0.9],
    startRoom: 4,
  },
};

/** The waypoint indices a monster walks between: [first, last], always at least one step apart. */
export function patrolWindow(p: MonsterProfile, waypointCount: number): [number, number] {
  const min = Math.max(1, Math.floor(waypointCount * p.patrol[0]));
  const max = Math.min(waypointCount - 1, Math.max(min + 1, Math.floor(waypointCount * p.patrol[1])));
  return [min, max];
}

/** The two Gnome-Souls every house has. Each house adds one more, drawn from SEEDED_KINDS by its seed. */
export const FIXED_KINDS: readonly MonsterKind[] = ['gardener', 'watcher'];
export const SEEDED_KINDS: readonly MonsterKind[] = ['lamplighter', 'crawler', 'hush'];
