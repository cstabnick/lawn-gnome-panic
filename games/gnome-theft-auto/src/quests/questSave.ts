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
    // The Tessie trigger beat (tessieUnlock.ts): this device's roll wins, so the beat never changes under the player.
    const beat = sa.beat ?? sb.beat;
    if (beat) out[id].beat = beat;
  }
  return JSON.stringify(out);
}
