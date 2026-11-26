// Side-quest pacing (E18, L67; design docs/design/gnome-theft-auto/side-quest-schedule.md). Pure: no DOM, no three.js.
//
// The unlock table (unlocks.ts) says when a side quest may be taken at all. Pacing decides which of the unlocked ones
// are *offered*: shown in the journal's Open tab, marked on the map, announced with a "new side job" notice. The rest
// stay takeable from their giver in the world and sit on the journal's Later shelf. Nothing is saved for this: it is
// derived from the quest saves every time, so old saves need no migration.
//
// Rules:
// - Story beats are the main quests the save has finished, in spine-row order (storyRows.ts).
// - A side quest whose table beat is done joins a queue at that beat (table order). At each beat, offers older than
//   OFFER_WINDOW beats (their own and three more) leave the offer list, then the queue fills free slots up to the cap
//   of that act (offerCap: 3 / 4 / 6). This is simulated as if the player played no side quests, so it is stable.
// - At runtime, quests the player has started or finished free their slot: the live offer list is the simulated offers
//   plus the queue, minus anything taken, cut to the cap. Chain follow-ups (a `prereq` that is a side quest) the player
//   just earned come first: they are offered for OFFER_WINDOW beats from when the prereq was finished (`doneAt`).
// - Everything unlocked, not taken and not offered is on the Later shelf.
import { STORY_ROWS, OFFER_WINDOW, offerCap } from './storyRows';
import { SIDE_UNLOCKS, unlockMet, unlockRule } from './unlocks';
import type { QuestSave } from './types';

/** The part of a QuestDef pacing reads. */
export interface PacingQuest {
  id: string;
  chapter?: number;
  prereq?: string;
}

export interface SidePacing {
  /** The furthest finished main row (0 before the first story quest is done). */
  row: number;
  /** How many main quests are done (story beats lived). */
  beats: number;
  /** The offer cap in force at `row`. */
  cap: number;
  /** Offered side quests (at most `cap`), in priority order: chain follow-ups, then oldest offers, then the queue. */
  offered: string[];
  /** Unlocked side quests that can be taken (no save entry, prereq met) but are not offered: the Later shelf. */
  later: string[];
  /** Locked side quests that unlock with the next story quest (a hint for the journal; at most a few). */
  upcoming: string[];
}

const SIDE_SET = new Set(SIDE_UNLOCKS.map((u) => u.questId));

/** Is this quest governed by pacing (listed in the unlock table)? Unlisted side quests are always shown as before. */
export function isPaced(questId: string): boolean {
  return SIDE_SET.has(questId);
}

/** The number of finished main quests (story beats) in a save. Use it to fill QuestSave.doneAt. */
export function beatsDone(saves: Record<string, QuestSave>, quests: readonly PacingQuest[]): number {
  let n = 0;
  for (const q of quests) if (q.chapter !== undefined && saves[q.id]?.state === 'done') n++;
  return n;
}

/** Side quests (pacing) for a save. `quests` is the full quest list (QUESTS, or the engine's list). */
export function sidePacing(saves: Record<string, QuestSave>, quests: readonly PacingQuest[]): SidePacing {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const rowOf = (id: string): number => STORY_ROWS[id] ?? Number.POSITIVE_INFINITY;
  const mains = quests.filter((q) => q.chapter !== undefined).sort((a, b) => rowOf(a.id) - rowOf(b.id));
  const doneMains = mains.filter((q) => saves[q.id]?.state === 'done');
  const beats = doneMains.length;
  const row = doneMains.reduce((m, q) => Math.max(m, Number.isFinite(rowOf(q.id)) ? rowOf(q.id) : 0), 0);
  const cap = offerCap(row);

  const isSide = (id: string | undefined): boolean => !!id && byId.has(id) && byId.get(id)!.chapter === undefined;
  /** A chain follow-up: its prereq is another side quest. */
  const isFollowUp = (id: string): boolean => isSide(byId.get(id)?.prereq);
  const takeable = (id: string): boolean => {
    const q = byId.get(id);
    if (!q || saves[id] || !unlockMet(id, saves)) return false;
    return !q.prereq || saves[q.prereq]?.state === 'done';
  };

  // Simulate the beats the save has lived, with no side play: queue at the beat, expire, fill to the cap.
  const queue: string[] = [];
  let simOffered: { id: string; start: number }[] = [];
  const roots = SIDE_UNLOCKS.filter((u) => byId.has(u.questId) && !isFollowUp(u.questId));
  doneMains.forEach((m, i) => {
    for (const u of roots) if (u.after === m.id) queue.push(u.questId);
    simOffered = simOffered.filter((o) => i - o.start < OFFER_WINDOW);
    const c = offerCap(Number.isFinite(rowOf(m.id)) ? rowOf(m.id) : row);
    while (simOffered.length < c && queue.length > 0) simOffered.push({ id: queue.shift()!, start: i });
  });

  // Chain follow-ups the player earned: offered for OFFER_WINDOW beats from the later of the prereq's finish and the beat.
  const followUps: { id: string; start: number }[] = [];
  for (const u of SIDE_UNLOCKS) {
    if (!byId.has(u.questId) || !isFollowUp(u.questId) || !takeable(u.questId)) continue;
    const pre = saves[byId.get(u.questId)!.prereq!];
    if (pre?.doneAt === undefined) continue;
    const beatAt = doneMains.findIndex((m) => m.id === u.after) + 1; // beats done when the table beat finished
    const start = Math.max(pre.doneAt, beatAt);
    if (beats - start < OFFER_WINDOW) followUps.push({ id: u.questId, start });
  }
  followUps.sort((a, b) => b.start - a.start);

  const candidates = [...followUps.map((f) => f.id), ...simOffered.map((o) => o.id), ...queue];
  const offered: string[] = [];
  for (const id of candidates) {
    if (offered.length >= cap) break;
    if (!offered.includes(id) && takeable(id)) offered.push(id);
  }
  const later = SIDE_UNLOCKS.map((u) => u.questId).filter((id) => byId.has(id) && takeable(id) && !offered.includes(id));

  const next = mains.find((q) => saves[q.id]?.state !== 'done');
  const upcoming = next
    ? SIDE_UNLOCKS.filter((u) => u.after === next.id && byId.has(u.questId) && !saves[u.questId] && !isFollowUp(u.questId))
      .map((u) => u.questId)
      .slice(0, 3)
    : [];

  return { row, beats, cap, offered, later, upcoming };
}

/** Why a side quest is where it is, for the journal: its table row's beat (a main quest id), or undefined. */
export function pacingBeat(questId: string): string | undefined {
  return unlockRule(questId)?.after;
}
