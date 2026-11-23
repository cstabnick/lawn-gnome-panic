// The gnome animation table: every row from the five category files, looked up by id. Play one with animator.ts.
// The debug trainer and the emote menu list from here (listAnims), so a new row shows up everywhere by itself.
import { DANCE_ANIMS } from './dances';
import { EMOTE_ANIMS } from './emotes';
import { EMOTE_B_ANIMS } from './emotesB';
import { HUNT_ANIMS } from './hunt';
import { IDLE_ANIMS } from './idles';
import { REACT_ANIMS } from './reacts';
import { REACT_B_ANIMS } from './reactsB';
import { RIDE_ANIMS } from './ride';
import { ROLE_ANIMS } from './roles';
import { WORK_ANIMS } from './work';
import type { AnimCategory, AnimDef, AnimId } from './types';

export * from './types';

/** Every animation, in menu order: emotes, dances, idles, jobs, work, hunting, riding, reactions. */
export const ANIMS: readonly AnimDef[] = [
  ...EMOTE_ANIMS, ...EMOTE_B_ANIMS, ...DANCE_ANIMS, ...IDLE_ANIMS, ...ROLE_ANIMS, ...WORK_ANIMS, ...HUNT_ANIMS,
  ...RIDE_ANIMS, ...REACT_ANIMS, ...REACT_B_ANIMS,
];

/** Menu tabs: category and title, in order. */
export const ANIM_TABS: readonly { category: AnimCategory; title: string }[] = [
  { category: 'emote', title: 'Emotes' }, { category: 'dance', title: 'Dances' }, { category: 'idle', title: 'Poses' },
  { category: 'role', title: 'Jobs' }, { category: 'work', title: 'Work' }, { category: 'hunt', title: 'Hunt' },
  { category: 'ride', title: 'Ride' }, { category: 'react', title: 'Reactions' },
];

const byId = new Map<string, AnimDef>(ANIMS.map((a) => [a.id, a]));

/** The row for an id, or undefined (any string is accepted, so debug tools can pass what the user typed). */
export function animById(id: string): AnimDef | undefined {
  return byId.get(id);
}

/** Rows filtered by category and/or the emote-menu flag. */
export function listAnims(filter: { category?: AnimCategory; emote?: boolean } = {}): readonly AnimDef[] {
  return ANIMS.filter((a) => (filter.category === undefined || a.category === filter.category)
    && (filter.emote === undefined || a.emote === filter.emote));
}

/** True when the row moves only the arms, so it may keep playing while the gnome walks. */
export function upperBodyOnly(def: AnimDef): boolean {
  return def.parts.every((p) => p === 'armL' || p === 'armR') && !def.pose(0).lift;
}

/** A stable pick from `ids` for a key (a gnome's id or name), so the same gnome always gets the same idle. */
export function pickFor<T>(key: string, ids: readonly T[]): T {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ids[(h >>> 0) % ids.length];
}

export type { AnimId };
