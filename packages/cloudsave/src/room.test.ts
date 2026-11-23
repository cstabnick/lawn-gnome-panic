import { describe, expect, it } from 'vitest';
import { createRoomSaves, fnvBytes, ROOM_MAX_BYTES, ROOM_PART_BYTES, type RoomDeps } from './room';

class ConnectError extends Error {
  constructor(public code: number) {
    super('connect error');
  }
}

const NOT_FOUND = 5;
const ABORTED = 10;
const GNOMOMIA = 7;

interface StoredRoom {
  code: string;
  title: string;
  revision: bigint;
  tick: bigint;
  summary: string;
  parts: Map<bigint, Uint8Array[]>;
  hashes: Map<bigint, string[]>;
  totalBytes: Map<bigint, bigint>;
}

/** An in-memory RoomSaveService. Applies the same revision rule as the server: a commit must name the current revision. */
function makeFakeService() {
  const rooms = new Map<string, StoredRoom>();
  const uploads = new Map<string, Map<number, Uint8Array>>();
  let nextCode = 0;

  const room = (code: string) => {
    const r = rooms.get(code);
    if (!r) throw new ConnectError(NOT_FOUND);
    return r;
  };
  const info = (r: StoredRoom) => ({
    code: r.code,
    game: GNOMOMIA,
    title: r.title,
    creatorId: 'me',
    memberIds: ['me'],
    inviteOnly: false,
    closed: false,
    revision: r.revision,
    tick: r.tick,
    updatedAt: { seconds: 1_700_000_000n, nanos: 500_000_000 },
    summary: r.summary,
  });

  const client = {
    async createRoom(req: { game: number; title: string }) {
      const code = `ROOM${++nextCode}`;
      const r: StoredRoom = {
        code,
        title: req.title,
        revision: 0n,
        tick: 0n,
        summary: '',
        parts: new Map(),
        hashes: new Map(),
        totalBytes: new Map(),
      };
      rooms.set(code, r);
      return { room: info(r) };
    },
    async joinRoom(req: { code: string; invite: string }) {
      return { room: info(room(req.code)) };
    },
    async listMyRooms(_req: { game: number }) {
      return { rooms: [...rooms.values()].map(info) };
    },
    async getRoomSave(req: { code: string }) {
      const r = room(req.code);
      if (r.revision === 0n) throw new ConnectError(NOT_FOUND);
      return {
        manifest: {
          code: r.code,
          revision: r.revision,
          tick: r.tick,
          hostId: 'me',
          partCount: r.hashes.get(r.revision)!.length,
          totalBytes: r.totalBytes.get(r.revision)!,
          partHashes: r.hashes.get(r.revision)!,
          summary: r.summary,
        },
      };
    },
    async getRoomSavePart(req: { code: string; revision: bigint; index: number }) {
      const parts = room(req.code).parts.get(req.revision);
      const part = parts?.[req.index];
      if (!part) throw new ConnectError(NOT_FOUND);
      return { data: part };
    },
    async putRoomSavePart(req: { code: string; uploadId: string; index: number; data: Uint8Array }) {
      room(req.code);
      let up = uploads.get(req.uploadId);
      if (!up) uploads.set(req.uploadId, (up = new Map()));
      up.set(req.index, req.data);
      return {};
    },
    async commitRoomSave(req: {
      code: string;
      baseRevision: bigint;
      uploadId: string;
      tick: bigint;
      partCount: number;
      totalBytes: bigint;
      partHashes: string[];
      summary: string;
    }) {
      const r = room(req.code);
      if (req.baseRevision !== r.revision) throw new ConnectError(ABORTED);
      const up = uploads.get(req.uploadId) ?? new Map<number, Uint8Array>();
      const parts: Uint8Array[] = [];
      for (let i = 0; i < req.partCount; i++) parts.push(up.get(i) ?? new Uint8Array());
      const rev = r.revision + 1n;
      r.revision = rev;
      r.tick = req.tick;
      r.summary = req.summary;
      r.parts.set(rev, parts);
      r.hashes.set(rev, req.partHashes);
      r.totalBytes.set(rev, req.totalBytes);
      return {
        manifest: {
          code: r.code,
          revision: rev,
          tick: r.tick,
          hostId: 'me',
          partCount: req.partCount,
          totalBytes: req.totalBytes,
          partHashes: req.partHashes,
          summary: r.summary,
        },
      };
    },
  };
  return { rooms, client };
}

function makeSaves(opts: { signedIn?: boolean } = {}) {
  const fake = makeFakeService();
  const kvStore = new Map<string, Uint8Array | string>();
  const deps: Partial<RoomDeps> = {
    signedIn: () => opts.signedIn ?? true,
    load: async () =>
      ({
        roomSaveClient: () => fake.client,
        ConnectError,
        Code: { NotFound: NOT_FOUND, Aborted: ABORTED },
        Game: { ARCADE: 8, GNOMOMIA: GNOMOMIA },
      }) as never,
    kv: {
      async get(key) {
        const v = kvStore.get(key);
        return v instanceof Uint8Array ? v : null;
      },
      async set(key, value) {
        kvStore.set(key, value);
      },
      async getMeta(key) {
        const v = kvStore.get(key);
        return typeof v === 'string' ? v : null;
      },
      async setMeta(key, value) {
        kvStore.set(key, value);
      },
    },
  };
  const saves = createRoomSaves({ game: 'GNOMOMIA', deps });
  return { saves, fake, kvStore };
}

/** Deterministic bytes of a given length. */
function bytesOf(n: number, seed = 1): Uint8Array {
  const out = new Uint8Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out[i] = x >>> 24;
  }
  return out;
}

describe('fnvBytes', () => {
  it('is FNV-1a 32 as 8 lowercase hex characters', () => {
    expect(fnvBytes(new Uint8Array())).toBe('811c9dc5');
    expect(fnvBytes(new TextEncoder().encode('a'))).toBe('e40c292c');
  });
});

describe('rooms', () => {
  it('create, join and list map the room fields', async () => {
    const { saves } = makeSaves();
    expect(saves.available()).toBe(true);
    const made = await saves.create('Mossbottom Watch');
    expect(made).toMatchObject({
      title: 'Mossbottom Watch',
      creatorId: 'me',
      memberIds: ['me'],
      inviteOnly: false,
      closed: false,
      revision: 0,
      tick: 0,
      updatedAt: '2023-11-14T22:13:20.500Z',
    });
    const joined = await saves.join(made.code, 'invite');
    expect(joined.code).toBe(made.code);
    const listed = await saves.list();
    expect(listed.map((r) => r.code)).toEqual([made.code]);
  });

  it('create rejects when signed out; list is empty and push is off', async () => {
    const { saves } = makeSaves({ signedIn: false });
    expect(saves.available()).toBe(false);
    await expect(saves.create('x')).rejects.toThrow();
    expect(await saves.list()).toEqual([]);
    expect(await saves.push('ROOM1', new Uint8Array([1]), 1, 's')).toEqual({ ok: false, reason: 'off' });
    expect(await saves.pull('ROOM1')).toBeNull();
  });
});

describe('push and pull', () => {
  it('a 1.2 MiB save is split into 3 parts and pulls back equal', async () => {
    const { saves } = makeSaves();
    const room = await saves.create('Big');
    const data = bytesOf(Math.round(1.2 * 1024 * 1024));
    expect(Math.ceil(data.length / ROOM_PART_BYTES)).toBe(3);

    expect(await saves.push(room.code, data, 42, 'Day 3')).toEqual({ ok: true, revision: 1 });
    const pulled = await saves.pull(room.code);
    expect(pulled).not.toBeNull();
    expect(pulled!.revision).toBe(1);
    expect(pulled!.tick).toBe(42);
    expect(pulled!.summary).toBe('Day 3');
    expect(pulled!.data.length).toBe(data.length);
    expect(pulled!.data.every((byte, i) => byte === data[i])).toBe(true);
  });

  it('a stale push (another client committed first) is refused as stale', async () => {
    const a = makeSaves();
    const room = await a.saves.create('Shared');
    expect((await a.saves.push(room.code, new Uint8Array([1]), 1, 'a')).ok).toBe(true);

    // a second client with its own remembered revision (0) pushes on top of an old base
    const b = makeSaves();
    b.fake.rooms.set(room.code, a.fake.rooms.get(room.code)!);
    expect(await b.saves.push(room.code, new Uint8Array([2]), 2, 'b')).toEqual({ ok: false, reason: 'stale' });
  });

  it('a push over ROOM_MAX_BYTES is too-big', async () => {
    const { saves } = makeSaves();
    const room = await saves.create('Huge');
    const result = await saves.push(room.code, new Uint8Array(ROOM_MAX_BYTES + 1), 1, 's');
    expect(result).toEqual({ ok: false, reason: 'too-big' });
  });

  it('pull returns null when the room has no save yet', async () => {
    const { saves } = makeSaves();
    const room = await saves.create('Empty');
    expect(await saves.pull(room.code)).toBeNull();
  });
});

describe('local copy', () => {
  it('put stores the data and its tick; get returns both', async () => {
    const { saves } = makeSaves();
    expect(await saves.local.get('ROOM9')).toBeNull();
    await saves.local.put('ROOM9', new Uint8Array([7, 8, 9]), 12);
    const got = await saves.local.get('ROOM9');
    expect(got).not.toBeNull();
    expect(Array.from(got!.data)).toEqual([7, 8, 9]);
    expect(got!.tick).toBe(12);
  });
});
