// Player cabs, pure state (docs/roadmaps/gta-sim-jobs-and-tubing.md). A player on foot calls a cab: their client OWNS
// a SYS.cab call entity (protocol.ts CabCallWire) and publishes it; taxi drivers mirror it, and one sends CAB_CMD.take.
// The rider side decides (first take wins) and the record's takenBy tells every driver who got it. No DOM, no hub.
import { CAB_CMD, JOB_WIRE } from './protocol';
import type { CabCallWire, CabStateCode } from './protocol';

/** A call nobody took is dropped after this long, ms. */
export const CALL_TTL_MS = 120_000;

export type RiderPhase = 'idle' | 'calling' | 'assigned' | 'riding';

export interface RiderCab {
  phase: RiderPhase;
  /** Call number (1..); a new call gets the next one. 0 before the first call. */
  id: number;
  dest: string;
  name: string;
  x: number;
  z: number;
  driver: number | null;
  /** Clock (ms) when the call was made / last re-opened. */
  at: number;
}

export type RiderNote =
  | { t: 'assigned'; driver: number }
  | { t: 'riding'; driver: number }
  | { t: 'paid'; driver: number; fare: number; stars: number }
  | { t: 'reopened' }
  | { t: 'expired' }
  | { t: 'left' }
  | null;

export function riderIdle(): RiderCab {
  return { phase: 'idle', id: 0, dest: '', name: '', x: 0, z: 0, driver: null, at: 0 };
}

/** Start a call (only from 'idle'; returns false otherwise). id becomes r.id + 1; driver null; at = now. */
export function riderCall(r: RiderCab, name: string, x: number, z: number, dest: string, now: number): boolean {
  if (r.phase !== 'idle') return false;
  r.id = r.id >= JOB_WIRE.maxId ? 1 : r.id + 1;
  r.phase = 'calling';
  r.name = name;
  r.x = x;
  r.z = z;
  r.dest = dest;
  r.driver = null;
  r.at = now;
  return true;
}

/** Back to idle (the caller's entity stops being published). driver null. */
export function riderCancel(r: RiderCab): void {
  r.phase = 'idle';
  r.driver = null;
}

/** Keep the published position current (any phase but idle). */
export function riderMoved(r: RiderCab, x: number, z: number): void {
  if (r.phase === 'idle') return;
  r.x = x;
  r.z = z;
}

/** The record to publish, or null while idle. state = stateOf(phase); takenBy = driver. */
export function riderWire(r: RiderCab): CabCallWire | null {
  if (r.phase === 'idle') return null;
  return {
    id: r.id, x: r.x, z: r.z, takenBy: r.driver, state: stateOf(r.phase), dest: r.dest, name: r.name,
  };
}

/**
 * A command from player `from` to call `id` (ignored, null, when id !== r.id or phase is idle).
 * take (c 1): phase calling -> assigned to `from`, note 'assigned'. (assigned/riding: ignored; the record shows who has it.)
 * drop (c 2): from === driver and `drop` given -> idle, note 'paid' with fare and stars.
 * giveup (c 3): from === driver -> calling again (driver null, at = now), note 'reopened'.
 */
export function riderCommand(
  r: RiderCab, from: number, id: number, c: number, drop: { fare: number; stars: number } | null, now: number,
): RiderNote {
  if (id !== r.id || r.phase === 'idle') return null;
  if (c === CAB_CMD.take) {
    if (r.phase !== 'calling') return null;
    r.phase = 'assigned';
    r.driver = from;
    return { t: 'assigned', driver: from };
  }
  if (c === CAB_CMD.drop) {
    if (from !== r.driver || !drop) return null;
    r.phase = 'idle';
    r.driver = null;
    return { t: 'paid', driver: from, fare: drop.fare, stars: drop.stars };
  }
  if (c === CAB_CMD.giveup) {
    if (from !== r.driver) return null;
    r.phase = 'calling';
    r.driver = null;
    r.at = now;
    return { t: 'reopened' };
  }
  return null;
}

/**
 * Every frame. seatedWith = the host whose vehicle I ride as a passenger (net riding()?.host), or null.
 * assigned and seatedWith === driver -> riding (note 'riding'). riding and seatedWith !== driver -> idle (note 'left').
 * calling and now - at > CALL_TTL_MS -> idle (note 'expired'). Otherwise null.
 */
export function riderTick(r: RiderCab, now: number, seatedWith: number | null): RiderNote {
  if (r.phase === 'assigned' && seatedWith !== null && seatedWith === r.driver) {
    r.phase = 'riding';
    return { t: 'riding', driver: seatedWith };
  }
  if (r.phase === 'riding' && seatedWith !== r.driver) {
    r.phase = 'idle';
    r.driver = null;
    return { t: 'left' };
  }
  if (r.phase === 'calling' && now - r.at > CALL_TTL_MS) {
    r.phase = 'idle';
    r.driver = null;
    return { t: 'expired' };
  }
  return null;
}

// ---- Driver side: the mirror of everyone's calls ----

export interface SeenCall {
  owner: number;
  call: CabCallWire;
  seenAt: number;
}

export interface DriverCabs {
  /** By callKey(owner, id). */
  calls: Map<string, SeenCall>;
  /** The call I sent 'take' for, or null. */
  job: string | null;
}

export type JobStatus = 'pending' | 'ok' | 'lost' | 'gone' | null;

export function callKey(owner: number, id: number): string {
  return `${owner}:${id}`;
}

export function driverIdle(): DriverCabs {
  return { calls: new Map(), job: null };
}

/** A call record was added or changed on the mirror. */
export function driverSee(d: DriverCabs, owner: number, call: CabCallWire, now: number): void {
  d.calls.set(callKey(owner, call.id), { owner, call, seenAt: now });
}

/** A call record was removed from the mirror (cancelled, done, stale, owner left). */
export function driverForget(d: DriverCabs, owner: number, id: number): void {
  d.calls.delete(callKey(owner, id));
}

/** Calls still open (state open and takenBy null), nearest first from (x, z). */
export function openCalls(d: DriverCabs, x: number, z: number): SeenCall[] {
  const open: SeenCall[] = [];
  for (const sc of d.calls.values()) {
    if (sc.call.state === 0 && sc.call.takenBy === null) open.push(sc);
  }
  const dist2 = (sc: SeenCall): number => (sc.call.x - x) ** 2 + (sc.call.z - z) ** 2;
  return open.sort((a, b) => dist2(a) - dist2(b));
}

/** Take call `key` if it is open and I have no job: job = key, returns { owner, id } for CAB_CMD.take; else null. */
export function driverTake(d: DriverCabs, key: string): { owner: number; id: number } | null {
  if (d.job !== null) return null;
  const sc = d.calls.get(key);
  if (!sc || sc.call.state !== 0 || sc.call.takenBy !== null) return null;
  d.job = key;
  return { owner: sc.owner, id: sc.call.id };
}

/**
 * My job's status from the mirror: null (no job), 'pending' (record still open), 'ok' (takenBy === myId),
 * 'lost' (takenBy is someone else: job cleared to null), 'gone' (record not in calls: job cleared to null).
 */
export function driverStatus(d: DriverCabs, myId: number): JobStatus {
  if (d.job === null) return null;
  const sc = d.calls.get(d.job);
  if (!sc) {
    d.job = null;
    return 'gone';
  }
  if (sc.call.takenBy === myId) return 'ok';
  if (sc.call.takenBy !== null) {
    d.job = null;
    return 'lost';
  }
  return 'pending';
}

/** End my job (delivered or given up): job = null; returns { owner, id } for the drop / giveup command, or null. */
export function driverEnd(d: DriverCabs): { owner: number; id: number } | null {
  if (d.job === null) return null;
  const [owner, id] = d.job.split(':');
  d.job = null;
  return { owner: Number(owner), id: Number(id) };
}

/** The wire state code for a rider phase. */
export function stateOf(p: RiderPhase): CabStateCode {
  return p === 'riding' ? 2 : p === 'assigned' ? 1 : 0;
}
