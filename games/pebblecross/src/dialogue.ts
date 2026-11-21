import type { Resident } from './config';
import { FRIEND_MIN_POINTS } from './config';

/** A non-negative modulo, so a negative pick still indexes a list. */
function nonNegMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function pickFrom(list: string[], pick: number): string {
  return list[nonNegMod(pick, list.length)];
}

export function talkLine(r: Resident, total: number, points: number, pick: number): string {
  const hour = (((total % 1440) + 1440) % 1440) / 60;
  if (points >= FRIEND_MIN_POINTS && nonNegMod(pick, 3) === 0) return pickFrom(r.lines.close, pick);
  let list: string[];
  if (hour >= 5 && hour < 11) list = r.lines.morning;
  else if (hour >= 11 && hour < 17) list = r.lines.day;
  else if (hour >= 17 && hour < 22) list = r.lines.evening;
  else list = r.lines.night;
  return pickFrom(list, pick);
}

export function giftLine(r: Resident, favourite: boolean, pick: number): string {
  return pickFrom(favourite ? r.lines.favourite : r.lines.gift, pick);
}
