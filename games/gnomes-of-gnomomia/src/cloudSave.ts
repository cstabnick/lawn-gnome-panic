// Cloud saves for Gnomomia: when the player is signed in (on the arcade's /me/ page), the localStorage save
// (SAVE_KEY, written by save.ts) is mirrored to the platform's SaveService in 'choose' mode, so it follows them to
// other devices; when both this browser and the account changed, the player picks. The logic is @lawn/cloudsave;
// this file keeps the game's API (main.ts, save.ts, ui/title.ts) and the save summary.
import {
  createCloudSlot,
  defaultDeps,
  type CloudDeps,
  type CloudSlot,
  type CloudStatus,
  type PlatformApi,
  type SaveInfo,
  type StartupSync,
} from '@lawn/cloudsave';
import { SAVE_KEY, type ClassDef, type ClassId, type ZoneDef, type ZoneId } from './config';
import { ZONES } from './content';
import { CLASSES } from './data/classes';

export type { CloudDeps, CloudStatus, PlatformApi, SaveInfo, StartupSync };

/** localStorage key of the sync bookkeeping: JSON { rev: number, hash: string }. */
export const SYNC_KEY = 'gnomomia.cloud.v1';

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** "Level <n> <Class>, <Zone name>" from a save text (save.ts format), or "A saved gnome" when it can't be read. */
export function summarize(saveText: string): string {
  try {
    const raw: unknown = JSON.parse(saveText);
    if (typeof raw !== 'object' || raw === null) return 'A saved gnome';
    const d = raw as { state?: unknown; zone?: unknown };
    if (typeof d.state !== 'object' || d.state === null) return 'A saved gnome';
    const st = d.state as { level?: unknown; classId?: unknown };
    if (typeof st.level !== 'number' || !Number.isFinite(st.level)) return 'A saved gnome';
    if (typeof d.zone !== 'string' || !hasOwn(ZONES, d.zone)) return 'A saved gnome';
    const zone: ZoneDef = ZONES[d.zone as ZoneId];
    const cls: ClassDef | undefined =
      typeof st.classId === 'string' && hasOwn(CLASSES, st.classId) ? CLASSES[st.classId as ClassId] : undefined;
    return `Level ${st.level} ${cls ? cls.name : 'gnome'}, ${zone.name}`;
  } catch {
    return 'A saved gnome';
  }
}

let deps: CloudDeps = defaultDeps();
const listeners = new Set<(s: CloudStatus) => void>();
let slot: CloudSlot = makeSlot();

function makeSlot(): CloudSlot {
  const next = createCloudSlot({ game: 'GNOMOMIA', saveKey: SAVE_KEY, syncKey: SYNC_KEY, summarize, mode: 'choose', deps });
  next.onStatus((st) => {
    for (const cb of [...listeners]) cb(st);
  });
  return next;
}

/** Replaces some deps and resets all state (status, timers, pending conflict). For tests only. */
export function setCloudDepsForTest(partial: Partial<CloudDeps>): void {
  deps = { ...deps, ...partial };
  slot = makeSlot();
}

/** Run once at startup, before loadGame() and the title. Never rejects; gives up after timeoutMs (→ 'off'). */
export function syncAtStartup(timeoutMs = 4000): Promise<StartupSync> {
  return slot.syncAtStartup(timeoutMs);
}

/** After a 'conflict': keep this browser's save (and push it) or take the account's (written to localStorage). */
export function resolveConflict(choice: 'local' | 'remote'): Promise<void> {
  return slot.resolveConflict(choice);
}

/** Call right after every saveGame(). Pushes the current localStorage save, at most once per 30 s. Never throws. */
export function pushSave(): void {
  slot.pushSave();
}

/** The current status. */
export function cloudStatus(): CloudStatus {
  return slot.status();
}

/** Calls cb whenever the status changes. Returns an unsubscribe function. */
export function onCloudStatus(cb: (s: CloudStatus) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
