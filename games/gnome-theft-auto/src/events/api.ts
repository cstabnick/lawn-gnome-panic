// One door for tools (the trainer) to list and force-start any world event by id: the six timed "challenge" events
// (worldEvents.ts, ids = WorldEventKind) and every street event (director.ts, ids from catalog/). app.ts binds the
// running systems once; until then the list is still available but triggering returns false.
import { EVENT_ROTATION, EVENT_TITLES, type WorldEventKind, type WorldEvents } from '../worldEvents';
import { STREET_EVENTS } from './catalog';
import type { EventDirector } from './director';
import type { EventCategory } from './types';

export interface WorldEventInfo {
  id: string;
  title: string;
  /** 'challenge' = a timed worldEvents.ts event; otherwise the street event's category. */
  category: 'challenge' | EventCategory;
}

let challenge: WorldEvents | null = null;
let street: EventDirector | null = null;

/** app.ts only: the running systems. */
export function bindWorldEvents(c: WorldEvents | null, s: EventDirector | null): void {
  challenge = c;
  street = s;
}

export function listWorldEvents(): WorldEventInfo[] {
  return [
    ...EVENT_ROTATION.map((k) => ({ id: k, title: EVENT_TITLES[k], category: 'challenge' as const })),
    ...STREET_EVENTS.map((d) => ({ id: d.id, title: d.title, category: d.category })),
  ];
}

/** Start an event by id now, near the player. False for an unknown id or before the game is running. */
export function triggerWorldEvent(id: string): boolean {
  if ((EVENT_ROTATION as readonly string[]).includes(id)) {
    if (!challenge) return false;
    challenge.trigger(id as WorldEventKind);
    return true;
  }
  return street ? street.trigger(id) : false;
}

/** What is running right now (both systems). */
export function activeWorldEvents(): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  const c = challenge?.activeEvent();
  if (c) out.push({ id: c.kind, title: c.title });
  if (street) out.push(...street.active().map((a) => ({ id: a.id, title: a.title })));
  return out;
}

/** End every street event now (the challenge event keeps its own timer). */
export function clearStreetEvents(): void {
  street?.clear();
}
