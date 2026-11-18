// @lawn/cloudsave: cloud saves for signed-in players. A "slot" mirrors one localStorage save (saveKey) to the
// platform service's SaveService (one save per account per game), so it follows the player to other devices and
// other copies of the arcade. Not signed in, or the service unreachable: nothing here does anything and the game
// plays from localStorage as before.
//
// Writes on the service are guarded by a revision. Each slot remembers, under syncKey, the revision it last synced
// and a hash of the local save text it synced then. Two modes for when both sides changed since then:
// - 'choose' (one line of progress, e.g. an RPG character): syncAtStartup returns a conflict, the game asks the
//   player and calls resolveConflict. During play, a write refused because another device wrote first stops the
//   sync for the session ('stopped').
// - 'merge' (data that only grows, e.g. achievements, best photos): the slot merges the two with the game's merge()
//   and pushes the result. No conflict is ever shown; a refused write is re-read, merged and retried.
//
// The platform client (OIDC + Connect) is loaded with a dynamic import() only when signed in.
import type * as Platform from '@lawn/platform';
import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';

/** What a slot uses from @lawn/platform (tests pass a fake). */
export type PlatformApi = Pick<typeof Platform, 'getAccessToken' | 'saveClient' | 'ConnectError' | 'Code' | 'Game'>;

/** Names of gnome.common.v1.Game values, e.g. 'GNOMOMIA', 'ARCADE'. */
export type GameName = Exclude<keyof typeof Platform.Game, 'UNSPECIFIED'>;

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

export interface CloudSlotOptions {
  /** Which save on the service: a gnome.common.v1.Game value name. */
  game: GameName;
  /** localStorage key of the game's save text. */
  saveKey: string;
  /** localStorage key of this slot's sync bookkeeping (JSON { rev, hash }). */
  syncKey: string;
  /** Short human-readable description of a save text ("Level 7 Warden, Mossbottom"), shown on conflicts. */
  summarize: (text: string) => string;
  /** See the file comment. Default 'choose'. */
  mode?: 'choose' | 'merge';
  /**
   * 'merge' mode only (required there): combines this browser's save text (null = none) with the account's (in
   * cloud form, see toCloud) into the new local save text. Must be deterministic and idempotent.
   */
  merge?: (local: string | null, remote: string) => string;
  /** Local save text → what is uploaded (e.g. photos shrunk to thumbnails). Default: the text itself. */
  toCloud?: (local: string) => string | Promise<string>;
  /** Called after the slot wrote a new local save text outside syncAtStartup's return (merge mode), so live caches reload. */
  onLocalChanged?: (text: string) => void;
  /** Minimum gap between two pushes in ms. Default 30000. */
  pushWindowMs?: number;
  /** Replaces some deps (tests). */
  deps?: Partial<CloudDeps>;
}

/** What the player sees about one side of a conflict. */
export interface SaveInfo {
  /** summarize() of that save. */
  summary: string;
  /** When it was last written, ISO 8601; '' when unknown (this browser's save). */
  updatedAt: string;
}

/** Result of syncAtStartup(). */
export type StartupSync =
  /** Not signed in, accounts off, or the service could not be reached in time: play from localStorage as before. */
  | { kind: 'off' }
  /** Synced: localStorage now holds the save to play (pulled = it was replaced or merged from the account's). */
  | { kind: 'ok'; pulled: boolean }
  /** 'choose' mode, both changed since the last sync: ask the player, then call resolveConflict(choice). */
  | { kind: 'conflict'; local: SaveInfo; remote: SaveInfo };

/** off (not signed in / unreachable), synced, syncing, or stopped (another device changed the save; choose mode). */
export type CloudStatus = 'off' | 'synced' | 'syncing' | 'stopped';

export interface CloudSlot {
  /** Run once at startup, before the game reads its save. Never rejects; gives up after timeoutMs (→ 'off'). */
  syncAtStartup(timeoutMs?: number): Promise<StartupSync>;
  /** After a 'conflict': keep this browser's save (and push it) or take the account's (written to localStorage). */
  resolveConflict(choice: 'local' | 'remote'): Promise<void>;
  /** Call right after every local save write. Pushes it, at most once per pushWindowMs. Never throws. */
  pushSave(): void;
  status(): CloudStatus;
  /** Calls cb whenever the status changes. Returns an unsubscribe function. */
  onStatus(cb: (s: CloudStatus) => void): () => void;
}

/** The service's limit on one save (UTF-8 bytes). Bigger cloud texts are not pushed. */
export const MAX_SAVE_BYTES = 512 * 1024;

/** FNV-1a 32-bit, as 8 hex characters. */
export function hashText(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function defaultStorage(): CloudDeps['storage'] {
  try {
    const s = localStorage;
    s.getItem('cloudsave.probe'); // throws when storage is blocked
    return s;
  } catch {
    return null;
  }
}

export function defaultDeps(): CloudDeps {
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

interface SyncMeta {
  rev: number;
  hash: string;
}

type Store = NonNullable<CloudDeps['storage']>;

function isoOf(ts: Platform.Save['updatedAt']): string {
  if (!ts) return '';
  const ms = Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1_000_000);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

function tooBig(text: string): boolean {
  return new TextEncoder().encode(text).length > MAX_SAVE_BYTES;
}

export function createCloudSlot(opts: CloudSlotOptions): CloudSlot {
  const mode = opts.mode ?? 'choose';
  if (mode === 'merge' && !opts.merge) throw new Error('cloudsave: merge mode needs a merge function');
  const deps: CloudDeps = { ...defaultDeps(), ...opts.deps };
  const pushWindowMs = opts.pushWindowMs ?? 30_000;
  const toCloud = opts.toCloud ?? ((t: string) => t);

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
  /** Bumped by each syncAtStartup(); an older (timed-out) sync stops changing state. */
  let syncGen = 0;

  function readMeta(storage: Store): SyncMeta | null {
    try {
      const raw = storage.getItem(opts.syncKey);
      if (raw === null) return null;
      const m = JSON.parse(raw) as Partial<SyncMeta> | null;
      if (!m || typeof m.rev !== 'number' || typeof m.hash !== 'string') return null;
      return { rev: m.rev, hash: m.hash };
    } catch {
      return null;
    }
  }

  function writeMeta(storage: Store, meta: SyncMeta): void {
    storage.setItem(opts.syncKey, JSON.stringify(meta));
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

  const gameOf = (api: PlatformApi) => api.Game[opts.game];
  const isCode = (api: PlatformApi, e: unknown, code: 'NotFound' | 'Aborted') =>
    e instanceof api.ConnectError && e.code === api.Code[code];

  async function getRemote(api: PlatformApi): Promise<Platform.Save | null> {
    try {
      return (await api.saveClient().getSave({ game: gameOf(api) })).save ?? null;
    } catch (e) {
      if (isCode(api, e, 'NotFound')) return null;
      throw e;
    }
  }

  /** Pushes a local text (converted with toCloud) on top of baseRevision. Returns the new revision, 'aborted', or 'skipped' (too big). */
  async function put(api: PlatformApi, local: string, baseRevision: bigint): Promise<{ rev: number } | 'aborted' | 'skipped'> {
    const data = await toCloud(local);
    if (tooBig(data)) {
      console.warn(`cloudsave: ${opts.game} save is over ${MAX_SAVE_BYTES} bytes; not uploaded`);
      return 'skipped';
    }
    try {
      const res = await api.saveClient().putSave({ game: gameOf(api), data, summary: opts.summarize(local).slice(0, 200), baseRevision });
      return { rev: Number(res.save?.revision ?? baseRevision + 1n) };
    } catch (e) {
      if (isCode(api, e, 'Aborted')) return 'aborted';
      throw e;
    }
  }

  /**
   * Merge mode: merge this browser's save with the account's and upload the result, re-reading and retrying when
   * another device wrote first (up to 3 times). Writes the merged text locally. Returns whether the local text changed.
   */
  async function mergeAndPush(api: PlatformApi, storage: Store, remote: Platform.Save | null, current: () => boolean): Promise<boolean | 'off'> {
    let changed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!current()) return 'off';
      const local = storage.getItem(opts.saveKey);
      const merged = remote ? (opts.merge as NonNullable<CloudSlotOptions['merge']>)(local, remote.data) : local;
      if (merged === null) return changed; // nothing on either side
      if (merged !== local) {
        storage.setItem(opts.saveKey, merged);
        changed = true;
      }
      const base = remote ? remote.revision : 0n;
      if (remote && (await toCloud(merged)) === remote.data) {
        writeMeta(storage, { rev: Number(remote.revision), hash: hashText(merged) });
        return changed;
      }
      const res = await put(api, merged, base);
      if (res === 'skipped') return changed;
      if (res !== 'aborted') {
        writeMeta(storage, { rev: res.rev, hash: hashText(merged) });
        return changed;
      }
      remote = await getRemote(api); // another device wrote first: merge again
    }
    return changed;
  }

  async function syncWork(storage: Store, current: () => boolean): Promise<StartupSync> {
    const off: StartupSync = { kind: 'off' };
    const api = await deps.load();
    if (!current()) return off;
    const token = await api.getAccessToken();
    if (!current()) return off;
    if (token === null) {
      setStatus('off');
      return off;
    }
    const remote = await getRemote(api);
    if (!current()) return off;

    if (mode === 'merge') {
      const changed = await mergeAndPush(api, storage, remote, current);
      if (changed === 'off' || !current()) return off;
      setStatus('synced');
      return { kind: 'ok', pulled: changed };
    }

    const local = storage.getItem(opts.saveKey);
    const meta = readMeta(storage);
    const pull = (r: Platform.Save): StartupSync => {
      storage.setItem(opts.saveKey, r.data);
      writeMeta(storage, { rev: Number(r.revision), hash: hashText(r.data) });
      setStatus('synced');
      return { kind: 'ok', pulled: true };
    };
    const pushLocal = async (text: string, base: bigint): Promise<StartupSync> => {
      const pushed = await put(api, text, base);
      if (pushed === 'aborted') {
        setStatus('stopped');
        return off;
      }
      if (pushed !== 'skipped') writeMeta(storage, { rev: pushed.rev, hash: hashText(text) });
      if (current()) setStatus(pushed === 'skipped' ? 'off' : 'synced');
      return { kind: 'ok', pulled: false };
    };

    // 1. nothing on either side
    if (remote === null && local === null) {
      setStatus('synced');
      return { kind: 'ok', pulled: false };
    }
    // 2. only this browser has a save: push it as the first revision
    if (remote === null) return pushLocal(local as string, 0n);
    // 3. only the account has a save: take it
    if (local === null) return pull(remote);
    // 4. both have a save
    const localHash = hashText(local);
    if (localHash === hashText(remote.data)) {
      writeMeta(storage, { rev: Number(remote.revision), hash: localHash });
      setStatus('synced');
      return { kind: 'ok', pulled: false };
    }
    const localChanged = !meta || localHash !== meta.hash;
    const remoteChanged = !meta || Number(remote.revision) !== meta.rev;
    if (!localChanged) return pull(remote);
    if (!remoteChanged) return pushLocal(local, remote.revision);
    // both changed: the player chooses
    pending = { revision: remote.revision, data: remote.data };
    setStatus('syncing');
    return {
      kind: 'conflict',
      local: { summary: opts.summarize(local), updatedAt: '' },
      remote: { summary: remote.summary || opts.summarize(remote.data), updatedAt: isoOf(remote.updatedAt) },
    };
  }

  async function syncAtStartup(timeoutMs = 4000): Promise<StartupSync> {
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
          if (current()) setStatus('off');
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

  async function resolveConflict(choice: 'local' | 'remote'): Promise<void> {
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
        storage.setItem(opts.saveKey, p.data);
        writeMeta(storage, { rev: Number(p.revision), hash: hashText(p.data) });
        setStatus('synced');
        return;
      }
      const api = await deps.load();
      const token = await api.getAccessToken();
      if (token === null) {
        setStatus('off');
        return;
      }
      const text = storage.getItem(opts.saveKey) ?? '';
      const res = await put(api, text, p.revision);
      if (res === 'aborted') {
        setStatus('stopped');
        return;
      }
      if (res !== 'skipped') writeMeta(storage, { rev: res.rev, hash: hashText(text) });
      setStatus(res === 'skipped' ? 'off' : 'synced');
    } catch {
      setStatus('off');
    }
  }

  function pushSave(): void {
    try {
      const storage = deps.storage;
      if (status !== 'synced' || !storage) return;
      const text = storage.getItem(opts.saveKey);
      const meta = readMeta(storage);
      if (text === null || (meta && hashText(text) === meta.hash)) return; // nothing new to push
      const now = deps.now();
      if (lastPush === null || now - lastPush >= pushWindowMs) {
        void push();
        return;
      }
      if (pushTimer === null) {
        pushTimer = setTimeout(() => {
          pushTimer = null;
          if (status === 'synced') void push();
        }, Math.max(0, pushWindowMs - (now - lastPush)));
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
      const text = storage.getItem(opts.saveKey);
      const meta = readMeta(storage);
      if (text === null || (meta && hashText(text) === meta.hash)) return;
      api = await deps.load();
      const token = await api.getAccessToken();
      if (token === null) {
        setStatus('off');
        return;
      }
      if (mode === 'merge') {
        const res = await put(api, text, BigInt(meta?.rev ?? 0));
        if (res === 'aborted') {
          // another device wrote first: merge with its save and push again
          const changed = await mergeAndPush(api, storage, await getRemote(api), () => true);
          if (changed === true) opts.onLocalChanged?.(storage.getItem(opts.saveKey) ?? '');
        } else if (res !== 'skipped') {
          writeMeta(storage, { rev: res.rev, hash: hashText(text) });
        }
        return;
      }
      const res = await put(api, text, BigInt(meta?.rev ?? 0));
      if (res === 'aborted') {
        wantPush = false;
        setStatus('stopped');
      } else if (res !== 'skipped') {
        writeMeta(storage, { rev: res.rev, hash: hashText(text) });
      }
    } catch {
      // network or service error: stay 'synced'; the next pushSave() retries
    } finally {
      inFlight = false;
      if (wantPush) {
        wantPush = false;
        pushSave();
      }
    }
  }

  return {
    syncAtStartup,
    resolveConflict,
    pushSave,
    status: () => status,
    onStatus(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
