// @lawn/cloudsave/room: shared world saves for rooms. A room has one save of up to ROOM_MAX_BYTES, sent to the
// platform's RoomSaveService in ROOM_PART_BYTES parts. Each push is committed as a new revision on top of the one the
// client last saw (baseRevision); a refused commit is 'stale' and the caller pulls and decides (highest tick wins).
// A local copy of the newest save lives in IndexedDB, so a room can be opened offline.
//
// Not signed in, or the service unreachable: nothing here reaches the network and the game plays from its local copy.
import type * as Platform from '@lawn/platform';
import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
import type { GameName } from './index';

export const ROOM_PART_BYTES = 512 * 1024;
export const ROOM_MAX_BYTES = 8 * 1024 * 1024;

export interface RoomInfo {
  code: string;
  title: string;
  creatorId: string;
  memberIds: string[];
  inviteOnly: boolean;
  closed: boolean;
  revision: number;
  tick: number;
  updatedAt: string;
  summary: string;
}

/** Everything from outside, so tests can replace it (vitest runs in Node: no IndexedDB, no network). */
export interface RoomDeps {
  /** True when accounts are on and a session is stored (default: accountsEnabled() && hasStoredSession()). */
  signedIn: () => boolean;
  /** Loads the platform client (default: () => import('@lawn/platform')). */
  load: () => Promise<Pick<typeof Platform, 'roomSaveClient' | 'ConnectError' | 'Code' | 'Game'>>;
  /** Small key-value store for the local copy (default: IndexedDB database 'lawn-cloudsave-rooms', store 'rooms'). */
  kv: {
    get(key: string): Promise<Uint8Array | null>;
    set(key: string, value: Uint8Array): Promise<void>;
    getMeta(key: string): Promise<string | null>;
    setMeta(key: string, value: string): Promise<void>;
  };
}

export type PushResult = { ok: true; revision: number } | { ok: false; reason: 'stale' | 'too-big' | 'off' | 'error' };

export interface RoomSaves {
  /** True when signed in. */
  available(): boolean;
  /** Rejects when not available. */
  create(title: string): Promise<RoomInfo>;
  join(code: string, invite?: string): Promise<RoomInfo>;
  /** Empty when not available. */
  list(): Promise<RoomInfo[]>;
  /** null: no save yet or off. */
  pull(code: string): Promise<{ data: Uint8Array; revision: number; tick: number; summary: string } | null>;
  push(code: string, data: Uint8Array, tick: number, summary: string): Promise<PushResult>;
  local: {
    get(code: string): Promise<{ data: Uint8Array; tick: number } | null>;
    put(code: string, data: Uint8Array, tick: number): Promise<void>;
  };
}

/** FNV-1a 32-bit over bytes, as 8 lowercase hex characters. */
export function fnvBytes(b: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < b.length; i++) {
    h ^= b[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const UPLOAD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** 24 random characters (rejection sampling keeps the alphabet uniform). */
function newUploadId(): string {
  const out: string[] = [];
  const buf = new Uint8Array(48);
  while (out.length < 24) {
    globalThis.crypto.getRandomValues(buf);
    for (const byte of buf) {
      if (byte < 248 && out.length < 24) out.push(UPLOAD_ALPHABET[byte % 62]);
    }
  }
  return out.join('');
}

function defaultSignedIn(): boolean {
  try {
    return accountsEnabled() && hasStoredSession();
  } catch {
    return false;
  }
}

const DB_NAME = 'lawn-cloudsave-rooms';
const STORE = 'rooms';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** The default local store: IndexedDB, opened on first use. */
function defaultKv(): RoomDeps['kv'] {
  return {
    async get(key) {
      const v = await idb<unknown>('readonly', (s) => s.get(key));
      return v instanceof Uint8Array ? v : null;
    },
    async set(key, value) {
      await idb('readwrite', (s) => s.put(value, key));
    },
    async getMeta(key) {
      const v = await idb<unknown>('readonly', (s) => s.get(key));
      return typeof v === 'string' ? v : null;
    },
    async setMeta(key, value) {
      await idb('readwrite', (s) => s.put(value, key));
    },
  };
}

type RoomLike = {
  code: string;
  title: string;
  creatorId: string;
  memberIds: string[];
  inviteOnly: boolean;
  closed: boolean;
  revision: bigint;
  tick: bigint;
  updatedAt?: { seconds: bigint; nanos: number } | undefined;
  summary: string;
};

function isoOf(ts: RoomLike['updatedAt']): string {
  if (!ts) return '';
  const ms = Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1_000_000);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

function toInfo(r: RoomLike): RoomInfo {
  return {
    code: r.code,
    title: r.title,
    creatorId: r.creatorId,
    memberIds: [...r.memberIds],
    inviteOnly: r.inviteOnly,
    closed: r.closed,
    revision: Number(r.revision),
    tick: Number(r.tick),
    updatedAt: isoOf(r.updatedAt),
    summary: r.summary,
  };
}

export function createRoomSaves(opts: { game: GameName; deps?: Partial<RoomDeps> }): RoomSaves {
  const deps: RoomDeps = {
    signedIn: defaultSignedIn,
    load: () => import('@lawn/platform'),
    kv: defaultKv(),
    ...opts.deps,
  };

  const revKey = (code: string) => `room:${code}:rev`;
  const tickKey = (code: string) => `room:${code}:tick`;
  const dataKey = (code: string) => `data:${code}`;

  async function rememberRevision(code: string, revision: number): Promise<void> {
    try {
      await deps.kv.setMeta(revKey(code), String(revision));
    } catch {
      // local bookkeeping is best effort
    }
  }

  async function rememberedRevision(code: string): Promise<number> {
    try {
      const raw = await deps.kv.getMeta(revKey(code));
      const n = raw === null ? 0 : Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  const isCode = (api: Pick<typeof Platform, 'ConnectError' | 'Code'>, e: unknown, code: 'NotFound' | 'Aborted') =>
    e instanceof api.ConnectError && e.code === api.Code[code];

  return {
    available() {
      return deps.signedIn();
    },

    async create(title) {
      if (!deps.signedIn()) throw new Error('room saves: not signed in');
      const api = await deps.load();
      const res = await api.roomSaveClient().createRoom({ game: api.Game[opts.game], title });
      if (!res.room) throw new Error('room saves: createRoom returned no room');
      return toInfo(res.room);
    },

    async join(code, invite = '') {
      if (!deps.signedIn()) throw new Error('room saves: not signed in');
      const api = await deps.load();
      const res = await api.roomSaveClient().joinRoom({ code, invite });
      if (!res.room) throw new Error('room saves: joinRoom returned no room');
      return toInfo(res.room);
    },

    async list() {
      if (!deps.signedIn()) return [];
      const api = await deps.load();
      const res = await api.roomSaveClient().listMyRooms({ game: api.Game[opts.game] });
      return res.rooms.map(toInfo);
    },

    async pull(code) {
      if (!deps.signedIn()) return null;
      const api = await deps.load();
      const client = api.roomSaveClient();
      let manifest: Awaited<ReturnType<typeof client.getRoomSave>>['manifest'];
      try {
        manifest = (await client.getRoomSave({ code })).manifest;
      } catch (e) {
        if (isCode(api, e, 'NotFound')) return null;
        throw e;
      }
      if (!manifest) return null;

      const revision = manifest.revision;
      const parts: Uint8Array[] = [];
      for (let i = 0; i < manifest.partCount; i++) {
        const part = (await client.getRoomSavePart({ code, revision, index: i })).data;
        if (fnvBytes(part) !== manifest.partHashes[i]) {
          throw new Error(`room saves: part ${i} of ${code} r${revision} failed its hash`);
        }
        parts.push(part);
      }
      const total = parts.reduce((n, p) => n + p.length, 0);
      if (BigInt(total) !== manifest.totalBytes) {
        throw new Error(`room saves: ${code} r${revision} is ${total} bytes, manifest says ${manifest.totalBytes}`);
      }
      const data = new Uint8Array(total);
      let at = 0;
      for (const p of parts) {
        data.set(p, at);
        at += p.length;
      }
      await rememberRevision(code, Number(revision));
      return { data, revision: Number(revision), tick: Number(manifest.tick), summary: manifest.summary };
    },

    async push(code, data, tick, summary) {
      if (data.length > ROOM_MAX_BYTES) return { ok: false, reason: 'too-big' };
      if (!deps.signedIn()) return { ok: false, reason: 'off' };
      let api: Awaited<ReturnType<typeof deps.load>>;
      try {
        api = await deps.load();
      } catch {
        return { ok: false, reason: 'error' };
      }
      const client = api.roomSaveClient();
      const uploadId = newUploadId();
      const partCount = Math.max(1, Math.ceil(data.length / ROOM_PART_BYTES));
      const parts: Uint8Array[] = [];
      for (let i = 0; i < partCount; i++) {
        parts.push(data.subarray(i * ROOM_PART_BYTES, Math.min(data.length, (i + 1) * ROOM_PART_BYTES)));
      }
      const partHashes = parts.map(fnvBytes);
      try {
        for (let i = 0; i < partCount; i++) {
          await client.putRoomSavePart({ code, uploadId, index: i, data: parts[i] });
        }
        const baseRevision = BigInt(await rememberedRevision(code));
        const res = await client.commitRoomSave({
          code,
          baseRevision,
          uploadId,
          tick: BigInt(tick),
          partCount,
          totalBytes: BigInt(data.length),
          partHashes,
          summary,
        });
        const revision = Number(res.manifest?.revision ?? baseRevision + 1n);
        await rememberRevision(code, revision);
        return { ok: true, revision };
      } catch (e) {
        if (isCode(api, e, 'Aborted')) return { ok: false, reason: 'stale' };
        return { ok: false, reason: 'error' };
      }
    },

    local: {
      async get(code) {
        try {
          const data = await deps.kv.get(dataKey(code));
          if (data === null) return null;
          const tickRaw = await deps.kv.getMeta(tickKey(code));
          const tick = tickRaw === null ? 0 : Number(tickRaw);
          return { data, tick: Number.isFinite(tick) ? tick : 0 };
        } catch {
          return null;
        }
      },
      async put(code, data, tick) {
        try {
          await deps.kv.set(dataKey(code), data);
          await deps.kv.setMeta(tickKey(code), String(tick));
        } catch {
          // no IndexedDB: the game keeps playing without a local copy
        }
      },
    },
  };
}
