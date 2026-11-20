// Quest data. A quest is plain data (see defs.ts): who gives it, the objectives, and optionally its own cutscene. The
// systems that run it (quests.ts, cutscene.ts) know nothing about any one quest, so a new quest is a new entry in defs.ts.
import type { GnomeLook } from '@lawn/gnome';

/** A place that hands out quests: a building the player walks up to and presses Enter at. */
export interface GiverDef {
  id: string;
  /** Prompt label, e.g. "Enter The Mulch Club". */
  label: string;
  /** Where the player stands to use it (and the minimap marker). */
  x: number; z: number;
  /** Where the player is put (and which way they face) when they come back out. */
  exit: { x: number; z: number; yaw: number };
  /** The cutscene set this giver plays its quests in. */
  room: 'mulch-club';
}

/** A gnome to be cracked. `near` is snapped to the closest place gnomes walk. Missing look colours are random. */
export interface TargetDef {
  id: string;
  name: string;
  near: [number, number];
  look?: Partial<GnomeLook>;
  /** One short clue shown in the tracker, e.g. "Mossy Wood". */
  hint: string;
}

/**
 * What the player has to do. Add a new `kind` here and a handler in quests.ts (the `OBJECTIVE_KINDS` table); a quest
 * lists as many objectives as it likes and they run one after another.
 */
export type ObjectiveDef =
  | { kind: 'crack'; text: string; targets: TargetDef[] }
  | { kind: 'visit'; text: string; at: [number, number]; radius: number; hint: string };

export interface QuestDef {
  id: string;
  title: string;
  giver: string;
  /** Plays when the quest is taken (silent; built from this quest's data unless a hand-made one is named). */
  cutscene?: { kind: 'contract' };
  objectives: ObjectiveDef[];
  /** Achievement unlocked on completion (an id from @lawn/achievements). */
  achievement?: string;
  /** Shown as a DEMO quest: a note in the tracker and on completion that more is coming. */
  demo?: boolean;
  /** Toast on completion. */
  doneText: string;
}

/** Saved progress. */
export interface QuestSave {
  state: 'active' | 'done';
  /** Index of the objective being worked on. */
  step: number;
  /** Target ids already cracked in this quest. */
  cracked: string[];
}
