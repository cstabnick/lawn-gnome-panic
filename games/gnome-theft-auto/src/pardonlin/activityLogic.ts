// Pardonlin's activity state machines (E30): the queue, the baguette round, the portrait and the flaneur set. Pure
// logic: no three.js, no DOM. activities.ts drives these from the frame loop and draws the markers and toasts.

// ---- Queued for Nothing ----------------------------------------------------------------------------------------------
/** Queue points, tail (index 0) to front (last), 4.5 m apart along z at x -1488.2. */
export const QUEUE_POINTS: readonly (readonly [number, number])[] = Array.from({ length: 9 }, (_, i) => [-1488.2, -196 - i * 4.5] as const);
export const QUEUE_STEP_S = 7;
export const QUEUE_LEASH = 1.6;
export const QUEUE_LINES: readonly string[] = [
  'The queue shuffles forward. Nobody knows why.',
  'A gnome ahead checks a clipboard, sighs and nods you forward.',
  'Someone behind you asks if this is the queue for the queue.',
  'A pigeon takes the place of a gnome. Nobody objects.',
  'The line lurches. A bench is reached. Somebody sits on it.',
  'A gnome ahead lets you go first. This is not allowed. You both go back.',
  'The queue has been moved to a different queue. You follow.',
  'A tuba plays somewhere. The queue advances to the tuba.',
  'Your neighbour offers you a sandwich. You accept. The queue moves on.',
  'A clerk calls out a number. It is not yours. It is close.',
];

export interface QueueState { active: boolean; index: number; timer: number }
export type QueueEvent = { kind: 'lost' } | { kind: 'shuffle'; index: number; line: string } | { kind: 'front' };

export function startQueue(): QueueState {
  return { active: true, index: 0, timer: 0 };
}

/** Advances the queue by dt seconds with the player at (x, z). Returns what happened this step. */
export function stepQueue(q: QueueState, dt: number, x: number, z: number): QueueEvent[] {
  if (!q.active) return [];
  const [px, pz] = QUEUE_POINTS[q.index];
  if (Math.hypot(x - px, z - pz) > QUEUE_LEASH) {
    q.active = false;
    return [{ kind: 'lost' }];
  }
  q.timer += dt;
  if (q.timer < QUEUE_STEP_S) return [];
  q.timer -= QUEUE_STEP_S;
  q.index++;
  if (q.index >= QUEUE_POINTS.length - 1) {
    q.index = QUEUE_POINTS.length - 1;
    q.active = false;
    return [{ kind: 'front' }];
  }
  return [{ kind: 'shuffle', index: q.index, line: QUEUE_LINES[q.index % QUEUE_LINES.length] }];
}

// ---- The Baguette Round ----------------------------------------------------------------------------------------------
export interface DropPoint { id: string; name: string; x: number; z: number; line: string }
export const ROUND_DROPS: readonly DropPoint[] = [
  { id: 'cafe-pardon', name: 'Café Pardon', x: -1525, z: 139, line: 'Café Pardon: We ordered this yesterday. Perfect.' },
  { id: 'bean-kiosk', name: 'the Bean Tower kiosk', x: -1520, z: -320, line: 'Bean Tower kiosk: Bread. Finally. The beans were getting lonely.' },
  { id: 'opera-forecourt', name: 'the Opera Hall forecourt', x: -1688, z: -96, line: 'Opera Hall: The tenor is not ready. Leave it on the step.' },
  { id: 'beetle-market', name: 'the Beetle Market', x: -1733, z: 128, line: 'Beetle Market: Put it by the beetle. He likes the crust.' },
  { id: 'basin-quay', name: 'Basin Quay', x: -1500, z: 1022, line: 'Basin Quay: Wrapped? No. Thank you anyway.' },
];
export const ROUND_TIME_S = 240;
export const ROUND_WARN_S = 60;
export const ROUND_REACH = 5;
export const ROUND_TRIKE_KIND = 'baguette-trike';

export interface RoundState { timeLeft: number; done: boolean[]; lastOnTrike: boolean; warned: boolean; over: boolean }

export function startRound(): RoundState {
  return { timeLeft: ROUND_TIME_S, done: ROUND_DROPS.map(() => false), lastOnTrike: false, warned: false, over: false };
}

/** Ticks the round clock. Returns 'warn' once when a minute is left, 'fail' when time runs out, else null. */
export function tickRound(r: RoundState, dt: number): 'warn' | 'fail' | null {
  if (r.over) return null;
  r.timeLeft -= dt;
  if (r.timeLeft <= 0) {
    r.timeLeft = 0;
    r.over = true;
    return 'fail';
  }
  if (!r.warned && r.timeLeft <= ROUND_WARN_S) {
    r.warned = true;
    return 'warn';
  }
  return null;
}

/** Delivers to the first undelivered drop within reach of (x, z). Returns its index, or -1. */
export function deliverAt(r: RoundState, x: number, z: number, vehicle: string | null): number {
  if (r.over) return -1;
  for (let i = 0; i < ROUND_DROPS.length; i++) {
    if (r.done[i]) continue;
    const d = ROUND_DROPS[i];
    if (Math.hypot(x - d.x, z - d.z) <= ROUND_REACH) {
      r.done[i] = true;
      r.lastOnTrike = vehicle === ROUND_TRIKE_KIND;
      return i;
    }
  }
  return -1;
}

export function roundComplete(r: RoundState): boolean {
  return !r.over && r.done.every(Boolean);
}

export function roundReward(r: RoundState): number {
  return 150 + (r.lastOnTrike ? 50 : 0);
}

// ---- Portrait of a Croissant -----------------------------------------------------------------------------------------
export const PORTRAIT_HOLD_S = 20;
export const PORTRAIT_LEASH = 1.0;
export const PORTRAIT_MARKS = [5, 10, 15] as const;

export interface PortraitState { elapsed: number; announced: number; done: boolean }
export type PortraitEvent = { kind: 'moved' } | { kind: 'progress'; at: number } | { kind: 'done' };

export function startPortrait(): PortraitState {
  return { elapsed: 0, announced: 0, done: false };
}

/** Steps the sitting. inPlace = on foot and within PORTRAIT_LEASH of the spot. */
export function stepPortrait(p: PortraitState, dt: number, inPlace: boolean): PortraitEvent[] {
  if (p.done) return [];
  if (!inPlace) {
    if (p.elapsed <= 0) return [];
    p.elapsed = 0;
    p.announced = 0;
    return [{ kind: 'moved' }];
  }
  p.elapsed += dt;
  const events: PortraitEvent[] = [];
  for (const at of PORTRAIT_MARKS) {
    if (p.elapsed >= at && p.announced < at) {
      p.announced = at;
      events.push({ kind: 'progress', at });
    }
  }
  if (p.elapsed >= PORTRAIT_HOLD_S) {
    p.done = true;
    events.push({ kind: 'done' });
  }
  return events;
}

// ---- Flaneur -----------------------------------------------------------------------------------------------------------
/** Parses the saved visited-district list; anything malformed reads as an empty list. */
export function parseVisited(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** The visited list with `id` added, or null when the district was already visited. */
export function visitDistrict(visited: readonly string[], id: string): string[] | null {
  if (visited.includes(id)) return null;
  return [...visited, id];
}
