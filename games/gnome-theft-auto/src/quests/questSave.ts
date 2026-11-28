// The quest save text (localStorage SAVE_KEY 'gta-quests-v1': { [questId]: QuestSave }) and how two copies merge.
// Pure and import-light, so cloudSave.ts can merge quests before the game (and quests.ts with it) loads.
import type { QuestSave } from './types';
import { STORY_ROWS } from './storyRows';

export function parseSavesJson(raw: string | null): Record<string, QuestSave> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, QuestSave>) : {};
  } catch {
    return {};
  }
}

/** Both devices' quests: done beats active, the furthest step and every cracked target are kept. */
export function mergeQuestSaves(local: string | null, remote: string): string {
  const a = parseSavesJson(local);
  const b = parseSavesJson(remote);
  const out: Record<string, QuestSave> = {};
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) {
    const sa = a[id];
    const sb = b[id];
    if (!sa) { out[id] = sb; continue; }
    if (!sb) { out[id] = sa; continue; }
    const state: 'active' | 'done' = sa.state === 'done' || sb.state === 'done' ? 'done' : 'active';
    const step = Math.max(sa.step ?? 0, sb.step ?? 0);
    const cracked = [...new Set([...(sa.cracked ?? []), ...(sb.cracked ?? [])])];
    out[id] = { state, step, cracked };
    // E23 L101: the checkpoint of the side whose step is the merged step (local first).
    const cp = [sa.checkpoint, sb.checkpoint].find((c) => c && c.step === step);
    if (cp) out[id].checkpoint = cp;
    // The Tessie trigger beat (tessieUnlock.ts): this device's roll wins, so the beat never changes under the player.
    const beat = sa.beat ?? sb.beat;
    if (beat) out[id].beat = beat;
    // E22: the finale's recorded ending (W17) and the pacing stamp survive a merge.
    const ending = sa.ending ?? sb.ending;
    if (ending) out[id].ending = ending;
    const doneAt = sa.doneAt ?? sb.doneAt;
    if (doneAt !== undefined) out[id].doneAt = doneAt;
  }
  return JSON.stringify(out);
}

/** The finale's parts (E22): the old single quest ch5-even-cut is now p1, p2, p3 and the final (which keeps the id). */
export const FINALE_PARTS = ['ch5-even-cut-p1', 'ch5-even-cut-p2', 'ch5-even-cut-p3'] as const;

/**
 * E22 save compatibility: the pre-E22 finale was one quest of five objectives (0 Vanguard, 1 air-drop, 2 boss-combine,
 * 3 crack Vesper, 4 choice). It is now three parts and a final: p1 = 0, p2 = 1, p3 = the deck fight half of 2, the final
 * = [the jam half of 2, 3, 4]. A save made before that (the finale recorded, none of its parts) is rewritten in place:
 * a finished finale marks the parts done too (nothing replays, nothing resets); an active one resumes in the part that
 * holds its step. Returns true when it changed anything (the caller stores the saves). Idempotent.
 */
export function migrateFinaleSave(saves: Record<string, QuestSave>): boolean {
  const fin = saves['ch5-even-cut'];
  if (!fin || FINALE_PARTS.some((id) => saves[id])) return false;
  const done = (): QuestSave => ({ state: 'done', step: 0, cracked: [], ...(fin.doneAt !== undefined ? { doneAt: fin.doneAt } : {}) });
  if (fin.state === 'done') {
    for (const id of FINALE_PARTS) saves[id] = done();
    return true;
  }
  const step = Math.max(0, fin.step ?? 0);
  if (step <= 2) {
    // Old step 0 -> p1, 1 -> p2, 2 -> p3, each from its start (the Vanguard keeps the targets already cracked).
    for (let i = 0; i < step; i++) saves[FINALE_PARTS[i]] = done();
    saves[FINALE_PARTS[step]] = { state: 'active', step: 0, cracked: step === 0 ? [...(fin.cracked ?? [])] : [] };
    delete saves['ch5-even-cut'];
    return true;
  }
  // Old steps 3 (crack Vesper) and 4 (the choice) are the final's steps 1 and 2.
  for (const id of FINALE_PARTS) saves[id] = done();
  saves['ch5-even-cut'] = { state: 'active', step: Math.min(step - 2, 2), cracked: [...(fin.cracked ?? [])] };
  return true;
}

// ---- D7 (FX21): veteran saves and act IV, the catch-up chain queue ---------------------------------------------------
// Rows with a new id (`mNN-...`) were inserted into the story after old saves existed; a save that already finished the
// kept row after one (its "old-chain successor") meets it as a catch-up quest. Catch-ups come one at a time, in story
// order (the chain queue), and act IV catch-ups played after the finale are framed "Before the Even Cut".

/** Spine row -> the row's own quest id (the final part, which keeps the row id). */
const ROW_IDS: ReadonlyMap<number, string> = new Map(
  Object.entries(STORY_ROWS).filter(([id]) => !/-p\d+$/.test(id)).map(([id, row]) => [row, id]),
);
const FINALE = 'ch5-even-cut';
const doneIn = (saves: Record<string, QuestSave>, id: string | undefined): boolean => !!id && saves[id]?.state === 'done';

/** A row whose id was there before batch 3 (old saves may have it done); rows `mNN-...` were inserted later. */
function isKeptRow(row: number): boolean {
  const id = ROW_IDS.get(row);
  return !!id && !/^m\d\d-/.test(id);
}

/** The first kept row after `row` (the row's successor in the old chain), or undefined. */
function oldSuccessor(row: number): string | undefined {
  for (let r = row + 1; r <= 70; r++) if (isKeptRow(r)) return ROW_IDS.get(r);
  return undefined;
}

/** True when quest `id` (a row id or one of its parts) is an inserted row whose old-chain successor is already done. */
export function isCatchUp(id: string, saves: Record<string, QuestSave>): boolean {
  const row = STORY_ROWS[id];
  if (row === undefined || isKeptRow(row)) return false;
  return doneIn(saves, oldSuccessor(row));
}

/**
 * D7 chain queue: a catch-up row waits while an earlier catch-up row is still unfinished, so a save that skipped
 * several inserted rows gets them one at a time, in story order (m54, then m56, then m58, ...). Normal play is never
 * held (it has no catch-ups).
 */
export function catchUpHeld(id: string, saves: Record<string, QuestSave>): boolean {
  if (!isCatchUp(id, saves)) return false;
  const row = STORY_ROWS[id];
  for (let r = 1; r < row; r++) {
    const rid = ROW_IDS.get(r);
    if (rid && !isKeptRow(r) && !doneIn(saves, rid) && isCatchUp(rid, saves)) return true;
  }
  return false;
}

/**
 * D7: an act IV row (54-69) met by a save whose finale is already done: not yet played, or played after the finale.
 * Such a row files under "Before the Even Cut" in the journal, its `previously` line reads "Before the Even Cut: ...",
 * and while W17 is on its world change and its Turfton FM bulletin are skipped. A row finished before the finale is not.
 */
export function isBeforeTheEvenCut(id: string, saves: Record<string, QuestSave>): boolean {
  const row = STORY_ROWS[id];
  if (row === undefined || row < 54 || row > 69) return false;
  const fin = saves[FINALE];
  if (fin?.state !== 'done') return false;
  const s = saves[id];
  if (s?.state !== 'done') return true;
  if (s.doneAt !== undefined && fin.doneAt !== undefined) return s.doneAt > fin.doneAt;
  // No stamps to compare: an inserted row cannot have been finished before an old finale; a kept row was.
  return !isKeptRow(row);
}
