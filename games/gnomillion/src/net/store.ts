// localStorage helpers for the net session. Pure functions over the global localStorage (no DOM, no network),
// so store.test.ts can run them on an in-memory stub. Storage can be full or blocked (private mode): every write
// is best effort and every read falls back to "nothing saved".
import { KEY_LAST_ROOM, KEY_ME, KEY_PENDING, KEY_ROOM } from '../config';
import type { Player, Room } from '../engine';
import type { PendingAnswer, PublicRoom } from './protocol';

/** Which room this device was last in, and whether it hosted it. */
export interface LastRoom { code: string; host: boolean }

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or blocked: the game keeps working, it just cannot save this change
  }
}

export function loadMe(): Player | null {
  const me = read<Player>(KEY_ME);
  return me && typeof me.pid === 'string' && typeof me.name === 'string' ? me : null;
}

export function saveMe(me: Player): void {
  write(KEY_ME, { pid: me.pid, name: me.name });
}

/** The host saves the whole Room under KEY_ROOM(code) after every change, and marks it as the last room. */
export function saveHostRoom(room: Room): void {
  write(KEY_ROOM(room.code), room);
  saveLast({ code: room.code, host: true });
}

export function loadHostRoom(code: string): Room | null {
  return read<Room>(KEY_ROOM(code));
}

/** A guest keeps the last PublicRoom it was sent, so the UI works while the host is away. */
export function saveGuestRoom(room: PublicRoom): void {
  write(KEY_ROOM(room.code), room);
  saveLast({ code: room.code, host: false });
}

export function loadGuestRoom(code: string): PublicRoom | null {
  return read<PublicRoom>(KEY_ROOM(code));
}

export function loadLast(): LastRoom | null {
  const last = read<LastRoom>(KEY_LAST_ROOM);
  return last && typeof last.code === 'string' && typeof last.host === 'boolean' ? last : null;
}

export function saveLast(last: LastRoom): void {
  write(KEY_LAST_ROOM, last);
}

export function clearLast(): void {
  try {
    storage()?.removeItem(KEY_LAST_ROOM);
  } catch {
    // nothing to clear
  }
}

/** Pending answers, optionally only those for one room code. */
export function listPending(code?: string): PendingAnswer[] {
  const all = read<PendingAnswer[]>(KEY_PENDING) ?? [];
  return code === undefined ? all : all.filter((p) => p.code === code);
}

function saveAllPending(all: PendingAnswer[]): void {
  write(KEY_PENDING, all);
}

/** Adds an answer; an earlier one from the same player for the same round is replaced. */
export function addPending(p: PendingAnswer): void {
  const kept = listPending().filter((x) => !(x.code === p.code && x.pid === p.pid && x.round === p.round));
  saveAllPending([...kept, p]);
}

export function removePending(code: string, pid: string, round: number): void {
  saveAllPending(listPending().filter((x) => !(x.code === code && x.pid === pid && x.round === round)));
}

/** Drops this room's answers for rounds before `round` (they can no longer count). */
export function prunePending(code: string, round: number): void {
  saveAllPending(listPending().filter((x) => !(x.code === code && x.round < round)));
}
