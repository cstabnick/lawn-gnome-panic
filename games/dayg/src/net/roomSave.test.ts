// Room saver tests (roadmap 8.9). Pure: a fake RoomSaves and a fake host and session, no network, no IndexedDB.
import { describe, it, expect, vi } from 'vitest';
import type { RoomSaves } from '@lawn/cloudsave/room';
import type { NetSession, SimHost, SimRole } from '../game/types';
import type { Snapshot } from './protocol';
import { NET } from '../config';
import { createRoomSaver, loadRoom } from './roomSave';

type Pushed = { code: string; tick: number; summary: string };

function fakeRooms(opts: { available?: boolean; pushResults?: Array<{ ok: true; revision: number } | { ok: false; reason: 'stale' | 'error' }>; remote?: { tick: number; data: Uint8Array } | null } = {}) {
  const pushes: Pushed[] = [];
  const local = new Map<string, { data: Uint8Array; tick: number }>();
  let remote = opts.remote ?? null;
  const results = opts.pushResults ? [...opts.pushResults] : [];
  const rooms: RoomSaves & { pushes: Pushed[]; local: RoomSaves['local'] & { map: typeof local }; setRemote(r: typeof remote): void } = {
    pushes,
    available: () => opts.available ?? true,
    create: async () => { throw new Error('unused'); },
    join: async () => { throw new Error('unused'); },
    list: async () => [],
    pull: async () => remote ? { data: remote.data, revision: 1, tick: remote.tick, summary: '' } : null,
    push: async (code, _data, tick, summary) => {
      pushes.push({ code, tick, summary });
      const next = results.shift() ?? { ok: true as const, revision: 2 };
      return next;
    },
    local: {
      map: local,
      get: async (code) => local.get(code) ?? null,
      put: async (code, data, tick) => { local.set(code, { data, tick }); },
    },
    setRemote(r) { remote = r; },
  };
  return rooms;
}

function fakeHost(role: SimRole, tick = 100) {
  const snap = { v: 1, seed: 1, map: 'full', tuningHash: 'x', tick, hash: 'h', world: '{}', streams: {}, log: [] } as unknown as Snapshot;
  const host = {
    role,
    world: { tick, tuning: { clock: { ticksPerDay: 1440 } }, players: { a: { online: true }, b: { online: false } } },
    snapshot: () => snap,
  } as unknown as SimHost;
  return { host, snap };
}

function fakeSession(code: string | null): NetSession {
  return { code } as unknown as NetSession;
}

describe('room saver', () => {
  it('timer saves only push to the cloud as host; a guest keeps a local copy', async () => {
    const guest = fakeRooms();
    const { host: gHost } = fakeHost('guest');
    const gSaver = createRoomSaver({ host: gHost, session: fakeSession('ABCD'), rooms: guest });
    gSaver.update(NET.saveEverySec);
    await vi.waitFor(() => expect(guest.local.map.get('ABCD')?.tick).toBe(100), { timeout: 10000 });
    expect(guest.pushes).toHaveLength(0);

    const hostRooms = fakeRooms();
    const { host: hHost } = fakeHost('host');
    const hSaver = createRoomSaver({ host: hHost, session: fakeSession('ABCD'), rooms: hostRooms });
    hSaver.update(NET.saveEverySec);
    await vi.waitFor(() => expect(hostRooms.pushes).toHaveLength(1), { timeout: 10000 });
    expect(hostRooms.pushes).toEqual([{ code: 'ABCD', tick: 100, summary: 'Day 1, 1 players' }]);
    expect(hSaver.lastSaved()).not.toBeNull();
  });

  it('no timer save before the interval, and none without a room code', async () => {
    const rooms = fakeRooms();
    const { host } = fakeHost('host');
    const saver = createRoomSaver({ host, session: fakeSession(null), rooms });
    saver.update(NET.saveEverySec * 2);
    await new Promise((r) => setTimeout(r, 200));
    expect(rooms.pushes).toHaveLength(0);
    expect(rooms.local.map.size).toBe(0);
  });

  it('a stale push with an older remote pulls, then retries and wins', async () => {
    const rooms = fakeRooms({ pushResults: [{ ok: false, reason: 'stale' }, { ok: true, revision: 5 }], remote: { tick: 50, data: new Uint8Array([1]) } });
    const { host } = fakeHost('host', 100);
    const saver = createRoomSaver({ host, session: fakeSession('ABCD'), rooms });
    expect(await saver.saveNow('handoff')).toBe(true);
    expect(rooms.pushes).toHaveLength(2);
    expect(saver.lastSaved()).not.toBeNull();
  });

  it('a stale push with a newer remote gives up and returns false', async () => {
    const rooms = fakeRooms({ pushResults: [{ ok: false, reason: 'stale' }], remote: { tick: 200, data: new Uint8Array([1]) } });
    const { host } = fakeHost('host', 100);
    const saver = createRoomSaver({ host, session: fakeSession('ABCD'), rooms });
    expect(await saver.saveNow('timer')).toBe(false);
    expect(rooms.pushes).toHaveLength(1);
    expect(saver.lastSaved()).toBeNull();
  });

  it('off (not signed in) still writes the local copy and reports no cloud save', async () => {
    const rooms = fakeRooms({ available: false });
    const { host } = fakeHost('host', 42);
    const saver = createRoomSaver({ host, session: fakeSession('ABCD'), rooms });
    expect(await saver.saveNow('leave')).toBe(false);
    expect(rooms.pushes).toHaveLength(0);
    expect(rooms.local.map.get('ABCD')?.tick).toBe(42);
  });

  it('a host-changed event to me saves as a hand-off', async () => {
    const rooms = fakeRooms();
    const { host } = fakeHost('host', 7);
    const handlers: Array<(e: { me: boolean }) => void> = [];
    const bus = { on: (_k: string, fn: (e: { me: boolean }) => void) => { handlers.push(fn); return () => {}; }, emit: () => {} };
    createRoomSaver({ host, session: fakeSession('ABCD'), rooms, bus: bus as never });
    handlers[0]({ me: false });
    handlers[0]({ me: true });
    await vi.waitFor(() => expect(rooms.pushes).toHaveLength(1), { timeout: 10000 });
  });
});

describe('loadRoom', () => {
  it('picks the newer copy by tick, remote or local', async () => {
    const { snap } = fakeHost('host', 9);
    const { packSnapshot } = await import('./snapshot');
    const newer = await packSnapshot({ ...snap, tick: 9 });
    const older = await packSnapshot({ ...snap, tick: 5 });

    const remoteNewer = fakeRooms({ remote: { tick: 9, data: newer } });
    remoteNewer.local.put('ABCD', older, 5);
    expect((await loadRoom('ABCD', remoteNewer))?.tick).toBe(9);

    const localNewer = fakeRooms({ remote: { tick: 5, data: older } });
    await localNewer.local.put('ABCD', newer, 9);
    const got = await loadRoom('ABCD', localNewer);
    expect(got?.tick).toBe(9);
  });

  it('null when neither copy exists', async () => {
    expect(await loadRoom('ZZZZ', fakeRooms())).toBeNull();
  });
});
