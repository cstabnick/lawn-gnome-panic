import type { PlaceId, Resident, ScheduleSlot } from './config';
import { hourOf, isWeekend } from './clock';

export interface Activity { at: PlaceId; doing: string; asleep: boolean }

function slotMatches(slot: ScheduleSlot, h: number): boolean {
  if (slot.from <= slot.to) return slot.from <= h && h < slot.to;
  return h >= slot.from || h < slot.to;
}

export function activityAt(r: Resident, total: number): Activity {
  const h = hourOf(total);
  const list = isWeekend(total) ? r.weekend : r.weekday;
  const slot = list.find((s) => slotMatches(s, h));
  if (!slot) return { at: r.home, doing: 'at home', asleep: false };
  return { at: slot.at, doing: slot.doing, asleep: slot.doing === 'asleep' };
}
