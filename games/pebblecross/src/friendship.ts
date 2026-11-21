import type { GiftId, ResidentId, Save } from './config';
import { FRIEND_LEVELS, FRIEND_MIN_POINTS, GIFT_FAVOURITE_POINTS, GIFT_OTHER_POINTS, MAX_POINTS, SAVE_KEY, START_HOUR, TALK_POINTS } from './config';

/** The default storage, or undefined when there is none (no window, or storage blocked). Never throws. */
function defaultStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function emptySave(): Save {
  return { v: 1, clock: START_HOUR * 60, bag: {}, points: {}, talkedDay: {}, giftedDay: {}, giftsGiven: 0 };
}

export function readSave(storage?: Pick<Storage, 'getItem'>): Save | null {
  try {
    const store = storage ?? defaultStorage();
    if (!store) return null;
    const raw = store.getItem(SAVE_KEY);
    if (raw === null || raw === undefined) return null;
    const data: unknown = JSON.parse(raw);
    if (!isObject(data)) return null;
    if (data.v !== 1) return null;
    if (typeof data.clock !== 'number' || !Number.isFinite(data.clock)) return null;
    if (!isObject(data.bag) || !isObject(data.points) || !isObject(data.talkedDay) || !isObject(data.giftedDay)) return null;
    if (typeof data.giftsGiven !== 'number') return null;
    return data as unknown as Save;
  } catch {
    return null;
  }
}

export function writeSave(save: Save, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const store = storage ?? defaultStorage();
    if (!store) return false;
    store.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function levelOf(points: number): { index: number; name: string } {
  const p = Math.min(MAX_POINTS, Math.max(0, points));
  let index = 0;
  for (let i = 0; i < FRIEND_LEVELS.length; i++) {
    if (FRIEND_LEVELS[i].min <= p) index = i;
  }
  return { index, name: FRIEND_LEVELS[index].name };
}

export function isFriend(save: Save, id: ResidentId): boolean {
  return (save.points[id] ?? 0) >= FRIEND_MIN_POINTS;
}

export function friendCount(save: Save): number {
  let n = 0;
  for (const key of Object.keys(save.points) as ResidentId[]) {
    if ((save.points[key] ?? 0) >= FRIEND_MIN_POINTS) n += 1;
  }
  return n;
}

export function canTalk(save: Save, id: ResidentId, day: number): boolean {
  return (save.talkedDay[id] ?? -1) !== day;
}

export function talk(save: Save, id: ResidentId, day: number): number {
  if (!canTalk(save, id, day)) return 0;
  save.talkedDay[id] = day;
  const before = save.points[id] ?? 0;
  const after = Math.min(MAX_POINTS, before + TALK_POINTS);
  save.points[id] = after;
  return after - before;
}

export function bagCount(save: Save, item: GiftId): number {
  return save.bag[item] ?? 0;
}

export function addToBag(save: Save, item: GiftId, n = 1): void {
  save.bag[item] = bagCount(save, item) + n;
}

export function canGive(save: Save, id: ResidentId, item: GiftId, day: number): boolean {
  return bagCount(save, item) > 0 && (save.giftedDay[id] ?? -1) !== day;
}

export function give(save: Save, id: ResidentId, item: GiftId, day: number, favourite: boolean): number {
  if (!canGive(save, id, item, day)) return 0;
  const left = bagCount(save, item) - 1;
  if (left > 0) save.bag[item] = left;
  else delete save.bag[item];
  save.giftedDay[id] = day;
  save.giftsGiven += 1;
  const before = save.points[id] ?? 0;
  const after = Math.min(MAX_POINTS, before + (favourite ? GIFT_FAVOURITE_POINTS : GIFT_OTHER_POINTS));
  save.points[id] = after;
  return after - before;
}
