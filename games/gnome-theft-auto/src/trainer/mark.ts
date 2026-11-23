// The trainer-modified mark and the pre-trainer backup.
//
// How trainer changes meet the cloud save (decided in docs/roadmaps/gta-save-trainer.md):
//   - Progress the trainer edits (quests, Acorns, hunting, Lock-Up...) goes through each system's own save path, so it
//     syncs to the cloud like any play. Before the FIRST such change on a save, the whole bundle is copied to
//     TRAINER_BACKUP_KEY (this device only), and Save > "Restore pre-trainer backup" puts it back.
//   - TRAINER_KEY is in GTA_SAVE_KEYS: the mark travels with exports and the cloud copy, so a trained save stays marked
//     on every device until a Reset (a reset tombstones it like every other key).
//   - Save > "Cloud sync: paused" (cloudSave.ts setCloudPaused, CLOUD_PAUSE_KEY, this device only) stops pulling and
//     pushing entirely, for experiments that must not reach the account. Quest rewinds need it: the cloud merge keeps
//     the furthest quest progress, so a rewind made while syncing comes back.
//   - Achievements (@lawn/achievements) are account-wide and shared by every game: the trainer only reads them. Gear is
//     tried on for the session (not saved), perk overrides stay on this device (gta-perks-v1 is not in the bundle).
import { exportSaveBundle, type StorageLike } from '../saveIO';
import { notifySaveChanged } from '../saveHook';

/** In GTA_SAVE_KEYS (saveIO.ts). JSON: TrainerMark. */
export const TRAINER_KEY = 'gta-trainer-v1';
/** Not in GTA_SAVE_KEYS: this device only. JSON: a GtaSaveBundle taken just before the first trainer change. */
export const TRAINER_BACKUP_KEY = 'gta-trainer-backup-v1';

export interface TrainerMark {
  modified: true;
  /** ISO time of the first trainer change on this save. */
  first: string;
  /** ISO time of the latest one. */
  last: string;
  count: number;
  /** The latest changes, newest last, at most 20 ('acorns 9999', 'quest ch2 start', ...). */
  what: string[];
}

function store(): StorageLike | undefined {
  return typeof localStorage !== 'undefined' ? localStorage : undefined;
}

export function readTrainerMark(storage: StorageLike | undefined = store()): TrainerMark | null {
  try {
    const raw = storage?.getItem(TRAINER_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<TrainerMark>;
    if (!m || m.modified !== true) return null;
    return {
      modified: true,
      first: String(m.first ?? ''),
      last: String(m.last ?? ''),
      count: Number(m.count) || 0,
      what: Array.isArray(m.what) ? m.what.map(String).slice(-20) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Call after (or right before) any trainer action that changes saved progress. The first call on an unmarked save copies
 * the whole bundle to TRAINER_BACKUP_KEY (unless a backup is already there). Never throws.
 */
export function markTrainerModified(what: string, storage: StorageLike | undefined = store(), now: Date = new Date()): TrainerMark | null {
  if (!storage) return null;
  try {
    const prev = readTrainerMark(storage);
    if (!prev && storage.getItem(TRAINER_BACKUP_KEY) === null) {
      storage.setItem(TRAINER_BACKUP_KEY, JSON.stringify(exportSaveBundle(storage)));
    }
    const iso = now.toISOString();
    const next: TrainerMark = {
      modified: true,
      first: prev?.first || iso,
      last: iso,
      count: (prev?.count ?? 0) + 1,
      what: [...(prev?.what ?? []), what].slice(-20),
    };
    storage.setItem(TRAINER_KEY, JSON.stringify(next));
    notifySaveChanged();
    return next;
  } catch {
    return null;
  }
}

/** The pre-trainer backup's JSON text (a gta-save/v1 bundle, importSaveBundle takes it), or null. */
export function readTrainerBackup(storage: StorageLike | undefined = store()): string | null {
  try {
    return storage?.getItem(TRAINER_BACKUP_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearTrainerBackup(storage: StorageLike | undefined = store()): void {
  try {
    storage?.removeItem(TRAINER_BACKUP_KEY);
  } catch {
    // ignore
  }
}
