// Room saves: the snapshot is kept against the room code (roadmap 8.9). Step 0 stub: nothing is saved.
import type { NetSession, RoomSaver, SimHost } from '../game/types';
import type { Snapshot } from './protocol';

/** Where a room's snapshot lives. The storage is chosen in roadmap 8.9; Step 0 only fixes the shape the stub accepts. */
export interface RoomSaves {
  load(code: string): Promise<Snapshot | null>;
  save(code: string, snap: Snapshot): Promise<boolean>;
}

export function createRoomSaver(deps: { host: SimHost; session: NetSession; rooms?: RoomSaves }): RoomSaver {
  return {
    update: (dt: number): void => { /* roadmap 8.9 */ },
    saveNow: async (reason: 'timer' | 'handoff' | 'leave'): Promise<boolean> => false,
    lastSaved: (): number | null => null,
  };
}

export async function loadRoom(code: string, rooms?: RoomSaves): Promise<Snapshot | null> { return null; }
