// The quest save text (localStorage SAVE_KEY 'gta-quests-v1': { [questId]: QuestSave }) and how two copies merge.
// Pure and import-light, so cloudSave.ts can merge quests before the game (and quests.ts with it) loads.
import type { QuestSave } from './types';

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
