// The societies save, gta-societies-v1 (E17): mole job shifts and bests, DJ Moleman's visit, Updraft rides, sermons
// stood. Tolerant parse: anything broken falls back field by field to the empty save. Counts only grow (cloud merge
// takes the larger of each).
import { notifySaveChanged } from '../saveHook';
import { MOLE_JOB_IDS, SOCIETY_SAVE_KEY, type MoleJobId, type SocietySave } from './config';

export { SOCIETY_SAVE_KEY };

type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;

const zeroJobs = (): Record<MoleJobId, number> => ({ roots: 0, lamps: 0, post: 0, dig: 0 });

export function emptySocietySave(): SocietySave {
  return { v: 1, moleJobs: zeroJobs(), moleBest: zeroJobs(), molemanVisits: false, molemanMet: 0, updraftRides: 0, sermonsStood: 0 };
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);

/** Parse a stored save; anything malformed falls back field by field to emptySocietySave(). */
export function parseSocietySave(raw: string | null): SocietySave {
  const out = emptySocietySave();
  if (!raw) return out;
  let p: unknown;
  try { p = JSON.parse(raw); } catch { return out; }
  if (!isRec(p)) return out;
  for (const id of MOLE_JOB_IDS) {
    if (isRec(p.moleJobs)) out.moleJobs[id] = count(p.moleJobs[id]) ?? 0;
    if (isRec(p.moleBest)) out.moleBest[id] = Math.min(5, count(p.moleBest[id]) ?? 0);
  }
  if (typeof p.molemanVisits === 'boolean') out.molemanVisits = p.molemanVisits;
  out.molemanMet = count(p.molemanMet) ?? 0;
  out.updraftRides = count(p.updraftRides) ?? 0;
  out.sermonsStood = count(p.sermonsStood) ?? 0;
  return out;
}

/** Cloud merge: every count and best takes the larger side; Moleman's visit stays once made. */
export function mergeSocietySave(a: string, b: string): string {
  const x = parseSocietySave(a);
  const y = parseSocietySave(b);
  const m = emptySocietySave();
  for (const id of MOLE_JOB_IDS) {
    m.moleJobs[id] = Math.max(x.moleJobs[id], y.moleJobs[id]);
    m.moleBest[id] = Math.max(x.moleBest[id], y.moleBest[id]);
  }
  m.molemanVisits = x.molemanVisits || y.molemanVisits;
  m.molemanMet = Math.max(x.molemanMet, y.molemanMet);
  m.updraftRides = Math.max(x.updraftRides, y.updraftRides);
  m.sermonsStood = Math.max(x.sermonsStood, y.sermonsStood);
  return JSON.stringify(m);
}

function storage(): SaveStorage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

/** The current save (re-read from storage on every call, so other modules and devices stay in step). */
export function loadSocietySave(s: SaveStorage | null = storage()): SocietySave {
  try { return parseSocietySave(s?.getItem(SOCIETY_SAVE_KEY) ?? null); } catch { return emptySocietySave(); }
}

/** Change the save and write it back (no-op storage in tests). Returns the new save. */
export function updateSocietySave(change: (s: SocietySave) => void, s: SaveStorage | null = storage()): SocietySave {
  const save = loadSocietySave(s);
  change(save);
  try { s?.setItem(SOCIETY_SAVE_KEY, JSON.stringify(save)); notifySaveChanged(); } catch { /* full or blocked storage: keep playing */ }
  return save;
}
