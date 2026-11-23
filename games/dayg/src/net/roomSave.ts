// Room saves (roadmap 8.9): the host saves the room's world to the cloud every NET.saveEverySec real seconds, on a
// host hand-off and when it leaves; every member keeps a local copy; any member can reopen the newest copy.
import type { Bus } from '../game/bus';
import type { NetSession, RoomSaver, SimHost } from '../game/types';
import { NET } from '../config';
import { createRoomSaves, type RoomSaves } from '@lawn/cloudsave/room';
import { packSnapshot, unpackSnapshot } from './snapshot';
import type { Snapshot } from './protocol';

export type { RoomSaves } from '@lawn/cloudsave/room';

let defaultRooms: RoomSaves | null = null;
function roomsOrDefault(rooms?: RoomSaves): RoomSaves {
  if (rooms) return rooms;
  if (!defaultRooms) defaultRooms = createRoomSaves({ game: 'DAYG' });
  return defaultRooms;
}

export function createRoomSaver(deps: { host: SimHost; session: NetSession; rooms?: RoomSaves; bus?: Bus }): RoomSaver {
  const { host, session } = deps;
  const rooms = roomsOrDefault(deps.rooms);
  let elapsed = 0;
  let lastSavedAt: number | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const dayOf = (tick: number): number => Math.floor(tick / host.world.tuning.clock.ticksPerDay) + 1;
  const playersOf = (): number => Object.values(host.world.players).filter((p) => p.online).length;

  async function doSave(): Promise<boolean> {
    const code = session.code;
    if (!code) return false;
    const snap: Snapshot = host.snapshot();
    const bytes = await packSnapshot(snap);
    await rooms.local.put(code, bytes, snap.tick);
    if (host.role !== 'host' || !rooms.available()) return false;

    const summary = `Day ${dayOf(snap.tick)}, ${playersOf()} players`;
    const mark = (): boolean => { lastSavedAt = performance.now(); return true; };

    let res = await rooms.push(code, bytes, snap.tick, summary);
    if (res.ok) return mark();
    if (res.reason !== 'stale') return false;

    // Someone saved a newer revision: keep theirs if it is at least as far along, else push ours once more.
    const remote = await rooms.pull(code);
    if (remote && remote.tick >= snap.tick) return false;
    res = await rooms.push(code, bytes, snap.tick, summary);
    return res.ok ? mark() : false;
  }

  // Saves run one after another, so a hand-off save never overlaps a timer save.
  function saveNow(reason: 'timer' | 'handoff' | 'leave'): Promise<boolean> {
    void reason;
    const run = queue.then(() => doSave().catch(() => false), () => doSave().catch(() => false));
    queue = run;
    return run;
  }

  deps.bus?.on('host-changed', (e) => {
    if (e.me) void saveNow('handoff');
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => { void saveNow('leave'); });
  }

  return {
    update(dt: number): void {
      if (!session.code) { elapsed = 0; return; }
      elapsed += dt;
      if (elapsed < NET.saveEverySec) return;
      elapsed = 0;
      void saveNow('timer');
    },
    saveNow,
    lastSaved: (): number | null => lastSavedAt,
  };
}

/** The newer copy by tick of the cloud save and the local copy; null when neither exists. */
export async function loadRoom(code: string, rooms?: RoomSaves): Promise<Snapshot | null> {
  const r = roomsOrDefault(rooms);
  let remote: Awaited<ReturnType<RoomSaves['pull']>> = null;
  try {
    remote = await r.pull(code);
  } catch {
    remote = null; // unreachable or a bad part: the local copy still opens the room
  }
  const local = await r.local.get(code);
  const pick = remote && (!local || remote.tick >= local.tick) ? remote.data : local?.data ?? null;
  if (!pick) return null;
  return unpackSnapshot(pick);
}
