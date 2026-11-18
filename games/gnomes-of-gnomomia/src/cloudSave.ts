// Cloud saves: when the player is signed in (on the arcade's /me/ page), the localStorage save
// (SAVE_KEY, written by save.ts) is mirrored to the platform service's SaveService, so it follows them
// to other devices and other copies of the arcade. Not signed in: nothing here does anything.
//
// The service guards writes with a revision. This module remembers, in localStorage under SYNC_KEY,
// the revision it last synced and a hash of the save text it synced then, so at startup it can tell
// which side changed: only the account's → take it; only this browser's → push it; both → ask.
//
// The platform client (OIDC + Connect) is loaded with a dynamic import() only when signed in.

import type * as Platform from '@lawn/platform';
import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
import { SAVE_KEY, type ClassDef, type ClassId, type ZoneDef, type ZoneId } from './config';
import { ZONES } from './content';
import { CLASSES } from './data/classes';

/** What this module uses from @lawn/platform (tests pass a fake). */
export type PlatformApi = Pick<typeof Platform, 'getAccessToken' | 'saveClient' | 'ConnectError' | 'Code' | 'Game'>;

/** Everything from outside, so tests can replace it (vitest runs in Node: no localStorage, no network). */
export interface CloudDeps {
  /** localStorage, or null when it is unavailable. */
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** True when accounts are on and a session is stored (default: accountsEnabled() && hasStoredSession()). */
  signedIn: () => boolean;
  /** Loads the platform client (default: () => import('@lawn/platform')). */
  load: () => Promise<PlatformApi>;
  /** Milliseconds clock for the push throttle (default: () => performance.now()). */
  now: () => number;
}

/** localStorage key of the sync bookkeeping: JSON { rev: number, hash: string }. */
export const SYNC_KEY = 'gnomomia.cloud.v1';

/** Minimum gap between two pushes (ms). */
const PUSH_WINDOW_MS = 30_000;

function defaultStorage(): CloudDeps['storage'] {
  try {
    const s = localStorage;
    s.getItem(SYNC_KEY); // throws when storage is blocked
    return s;
  } catch {
    return null;
  }
}

function defaultDeps(): CloudDeps {
  return {
    storage: defaultStorage(),
    signedIn: () => {
      try {
        return accountsEnabled() && hasStoredSession();
      } catch {
        return false;
      }
    },
    load: () => import('@lawn/platform'),
    now: () => performance.now(),
  };
}

let deps: CloudDeps = defaultDeps();
let status: CloudStatus = 'off';
const listeners = new Set<(s: CloudStatus) => void>();
/** A conflict waiting for resolveConflict(). */
let pending: { revision: bigint; data: string } | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** Clock time of the last push that started; null before the first. */
let lastPush: number | null = null;
let inFlight = false;
/** A push was requested while one was in flight: run one more after it. */
let wantPush = false;
/** Bumped by each syncAtStartup() and by setCloudDepsForTest(); an older sync stops changing state. */
let syncGen = 0;

/** Replaces some deps and resets all module state (status, timers, pending conflict). For tests only. */
export function setCloudDepsForTest(partial: Partial<CloudDeps>): void {
  deps = { ...deps, ...partial };
  if (pushTimer !== null) clearTimeout(pushTimer);
  pushTimer = null;
  lastPush = null;
  inFlight = false;
  wantPush = false;
  pending = null;
  syncGen++;
  status = 'off';
}

/** What the player sees about one side of a conflict. */
export interface SaveInfo {
  /** summarize() of that save, e.g. "Level 7 Warden, Mossbottom". */
  summary: string;
  /** When it was last written, ISO 8601; '' when unknown (this browser's save). */
  updatedAt: string;
}

/** Result of syncAtStartup(). */
export type StartupSync =
  /** Not signed in, accounts off, or the service could not be reached in time: play from localStorage as before. */
  | { kind: 'off' }
  /** Synced: localStorage now holds the save to play (it may have been replaced by the account's). Call loadGame(). */
  | { kind: 'ok'; pulled: boolean }
  /** Both changed since the last sync: ask the player, then call resolveConflict(choice), then loadGame(). */
  | { kind: 'conflict'; local: SaveInfo; remote: SaveInfo };

/** Shown in the HUD/title: off (not signed in), synced, syncing, or stopped (another device changed the save). */
export type CloudStatus = 'off' | 'synced' | 'syncing' | 'stopped';

interface SyncMeta {
  rev: number;
  hash: string;
}

/** FNV-1a 32-bit, as 8 hex characters. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

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

function readMeta(storage: NonNullable<CloudDeps['storage']>): SyncMeta | null {
  try {
    const raw = storage.getItem(SYNC_KEY);
    if (raw === null) return null;
    const m = JSON.parse(raw) as Partial<SyncMeta> | null;
    if (!m || typeof m.rev !== 'number' || typeof m.hash !== 'string') return null;
    return { rev: m.rev, hash: m.hash };
  } catch {
    return null;
  }
}

function writeMeta(storage: NonNullable<CloudDeps['storage']>, meta: SyncMeta): void {
  storage.setItem(SYNC_KEY, JSON.stringify(meta));
}

function setStatus(next: CloudStatus): void {
  if (next === status) return;
  status = next;
  for (const cb of [...listeners]) {
    try {
      cb(next);
    } catch {
      // a listener must not break the sync
    }
  }
}

function isoOf(ts: Platform.Save['updatedAt']): string {
  if (!ts) return '';
  const ms = Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1_000_000);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

/** Pushes local text as a new revision on top of baseRevision. Returns the new revision, or 'aborted'. */
async function pushStartup(
  api: PlatformApi,
  text: string,
  baseRevision: bigint,
): Promise<{ rev: number } | 'aborted'> {
  try {
    const res = await api.saveClient().putSave({
      game: api.Game.GNOMOMIA,
      data: text,
      summary: summarize(text),
      baseRevision,
    });
    return { rev: Number(res.save?.revision ?? baseRevision + 1n) };
  } catch (e) {
    if (e instanceof api.ConnectError && e.code === api.Code.Aborted) return 'aborted';
    throw e;
  }
}

/**
 * Run once at startup, before loadGame() and the title. Never rejects; gives up after timeoutMs (→ 'off').
 */
export async function syncAtStartup(timeoutMs = 4000): Promise<StartupSync> {
  const gen = ++syncGen;
  const off: StartupSync = { kind: 'off' };
  const current = () => gen === syncGen;
  try {
    const storage = deps.storage;
    if (!storage || !deps.signedIn()) {
      setStatus('off');
      return off;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });
    try {
      const work = syncWork(storage, current).catch(() => {
        setStatus('off');
        return off;
      });
      const result = await Promise.race([work, timeout]);
      if (result === null) {
        syncGen++; // abandon the work still running
        setStatus('off');
        return off;
      }
      return result;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  } catch {
    setStatus('off');
    return off;
  }
}

async function syncWork(
  storage: NonNullable<CloudDeps['storage']>,
  current: () => boolean,
): Promise<StartupSync> {
  const off: StartupSync = { kind: 'off' };
  const api = await deps.load();
  if (!current()) return off;
  const token = await api.getAccessToken();
  if (!current()) return off;
  if (token === null) {
    setStatus('off');
    return off;
  }

  const local = storage.getItem(SAVE_KEY);
  const meta = readMeta(storage);
  let remote: Platform.Save | null;
  try {
    remote = (await api.saveClient().getSave({ game: api.Game.GNOMOMIA })).save ?? null;
  } catch (e) {
    if (e instanceof api.ConnectError && e.code === api.Code.NotFound) remote = null;
    else throw e;
  }
  if (!current()) return off;

  const pull = (r: Platform.Save): StartupSync => {
    storage.setItem(SAVE_KEY, r.data);
    writeMeta(storage, { rev: Number(r.revision), hash: hash(r.data) });
    setStatus('synced');
    return { kind: 'ok', pulled: true };
  };

  // 1. nothing on either side
  if (remote === null && local === null) {
    setStatus('synced');
    return { kind: 'ok', pulled: false };
  }

  // 2. only this browser has a save: push it as the first revision
  if (remote === null) {
    const pushed = await pushStartup(api, local as string, 0n);
    if (pushed === 'aborted') {
      setStatus('stopped');
      return off;
    }
    writeMeta(storage, { rev: pushed.rev, hash: hash(local as string) });
    if (current()) setStatus('synced');
    return { kind: 'ok', pulled: false };
  }

  // 3. only the account has a save: take it
  if (local === null) {
    if (!current()) return off;
    return pull(remote);
  }

  // 4. both have a save
  const localHash = hash(local);
  if (localHash === hash(remote.data)) {
    writeMeta(storage, { rev: Number(remote.revision), hash: localHash });
    setStatus('synced');
    return { kind: 'ok', pulled: false };
  }
  const localChanged = !meta || localHash !== meta.hash;
  const remoteChanged = !meta || Number(remote.revision) !== meta.rev;

  if (!localChanged) {
    if (!current()) return off;
    return pull(remote);
  }

  if (!remoteChanged) {
    const pushed = await pushStartup(api, local, remote.revision);
    if (pushed === 'aborted') {
      setStatus('stopped');
      return off;
    }
    writeMeta(storage, { rev: pushed.rev, hash: localHash });
    if (current()) setStatus('synced');
    return { kind: 'ok', pulled: false };
  }

  // both changed: the player chooses
  pending = { revision: remote.revision, data: remote.data };
  if (current()) setStatus('syncing');
  return {
    kind: 'conflict',
    local: { summary: summarize(local), updatedAt: '' },
    remote: {
      summary: remote.summary || summarize(remote.data),
      updatedAt: isoOf(remote.updatedAt),
    },
  };
}

/** After a 'conflict': keep this browser's save (and push it) or take the account's (written to localStorage). */
export async function resolveConflict(choice: 'local' | 'remote'): Promise<void> {
  const p = pending;
  pending = null;
  if (!p) return;
  const storage = deps.storage;
  if (!storage) {
    setStatus('off');
    return;
  }
  try {
    if (choice === 'remote') {
      storage.setItem(SAVE_KEY, p.data);
      writeMeta(storage, { rev: Number(p.revision), hash: hash(p.data) });
      setStatus('synced');
      return;
    }
    const api = await deps.load();
    const token = await api.getAccessToken();
    if (token === null) {
      setStatus('off');
      return;
    }
    const text = storage.getItem(SAVE_KEY) ?? '';
    const res = await api.saveClient().putSave({
      game: api.Game.GNOMOMIA,
      data: text,
      summary: summarize(text),
      baseRevision: p.revision,
    });
    writeMeta(storage, { rev: Number(res.save?.revision ?? p.revision + 1n), hash: hash(text) });
    setStatus('synced');
  } catch {
    setStatus('off');
  }
}

/** Call right after every saveGame(). Pushes the current localStorage save, at most once per 30 s. Never throws. */
export function pushSave(): void {
  try {
    const storage = deps.storage;
    if (status !== 'synced' || !storage) return;
    const text = storage.getItem(SAVE_KEY);
    const meta = readMeta(storage);
    if (text === null || (meta && hash(text) === meta.hash)) return; // nothing new to push
    const now = deps.now();
    if (lastPush === null || now - lastPush >= PUSH_WINDOW_MS) {
      void push();
      return;
    }
    if (pushTimer === null) {
      pushTimer = setTimeout(() => {
        pushTimer = null;
        if (status === 'synced') void push();
      }, Math.max(0, PUSH_WINDOW_MS - (now - lastPush)));
    }
  } catch {
    // never throws
  }
}

/** One push of the current save. Never two in flight; a request during a push runs once more after it. */
async function push(): Promise<void> {
  if (inFlight) {
    wantPush = true;
    return;
  }
  const storage = deps.storage;
  if (!storage) return;
  inFlight = true;
  lastPush = deps.now();
  let api: PlatformApi | null = null;
  try {
    const text = storage.getItem(SAVE_KEY);
    const meta = readMeta(storage);
    if (text === null || (meta && hash(text) === meta.hash)) return;
    api = await deps.load();
    const token = await api.getAccessToken();
    if (token === null) {
      setStatus('off');
      return;
    }
    const res = await api.saveClient().putSave({
      game: api.Game.GNOMOMIA,
      data: text,
      summary: summarize(text),
      baseRevision: BigInt(meta?.rev ?? 0),
    });
    const rev = res.save ? Number(res.save.revision) : (meta?.rev ?? 0) + 1;
    writeMeta(storage, { rev, hash: hash(text) });
  } catch (e) {
    if (api && e instanceof api.ConnectError && e.code === api.Code.Aborted) {
      wantPush = false;
      setStatus('stopped');
    }
    // other errors: stay 'synced'; the next pushSave() retries
  } finally {
    inFlight = false;
    if (wantPush) {
      wantPush = false;
      pushSave();
    }
  }
}

/** The current status. */
export function cloudStatus(): CloudStatus {
  return status;
}

/** Calls cb whenever the status changes. Returns an unsubscribe function. */
export function onCloudStatus(cb: (s: CloudStatus) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
