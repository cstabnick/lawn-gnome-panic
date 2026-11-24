// Sim jobs and tubing online (docs/roadmaps/gta-sim-jobs-and-tubing.md), on the online-sync pattern
// (docs/roadmaps/gta-online-sync.md): no new net.ts message kinds. Three SYS systems on the hub's generic channel; an
// OWNER publishes integer records, every other client MIRRORS them, and requests go to the owner as 'cmd'.
//
//   SYS.cab (6)  owner = a player who called a cab. One entity per call (id = the caller's call number, 1..).
//                record [id, qPos(x), qPos(z), takenBy (-1 = open), state (CAB_STATE)], string `${dest}|${name}`.
//                Drivers on taxi duty mirror open calls; 'take' / 'drop' / 'giveup' are commands to the caller.
//                The caller ends a call by no longer publishing it (the mirror drops it).
//   SYS.pax (7)  owner = a driver on a job. One entity (id 1) while NPC passengers or parcels are aboard:
//                record [1, parcels, seat, lookSeed, seat, lookSeed, ...] (at most 4 seats). Others seat NPC models
//                in the owner's vehicle (remotes.vehicleOf(owner)) so passengers are seen by everyone.
//   SYS.tow (8)  owner = a boat driver with the tow line out. One entity (id 1):
//                record [1, on (0/1), score, gates, then per slot 0..2: who, qPos(x), qPos(z), qAngle(yaw)].
//                who = a player id (a real rider: their own pose shows the tube), TOW_NPC (an NPC rider: drawn from
//                this record) or TOW_EMPTY. Riders send 'hook' / 'unhook' / 'points' commands to the driver and find
//                their slot by their own id in the record. Every client draws the ropes from the record.
import { qAngle, qPos, uqAngle, uqPos } from '../online/protocol';

export { qAngle, qPos, uqAngle, uqPos };

/** Cab call states on the wire. Append only. */
export const CAB_STATE = { open: 0, assigned: 1, riding: 2 } as const;
export type CabStateCode = (typeof CAB_STATE)[keyof typeof CAB_STATE];

/** Commands a driver sends to a caller's call entity. c values; args in the comment. */
export const CAB_CMD = {
  /** I take this call. args []. */
  take: 1,
  /** You have arrived. args [fare Acorns 0..5000, stars 1..5]. */
  drop: 2,
  /** I give the call up (it goes back to open). args []. */
  giveup: 3,
} as const;

/** Commands a tube rider sends to a boat driver's tow entity. */
export const TOW_CMD = {
  /** Hook me on (driver answers by putting my id in a free slot of the record). args []. */
  hook: 1,
  /** I let go or fell off (driver empties my slot). args []. */
  unhook: 2,
  /** My points this run so far. args [points 0..10_000_000]. Sent at most once a second. */
  points: 3,
} as const;

/** Tow slot `who` values that are not player ids. */
export const TOW_EMPTY = -1;
export const TOW_NPC = -2;

export const JOB_WIRE = {
  /** Call ids: 1..maxId. */
  maxId: 0x7fffffff,
  /** dest: a places.ts LAND_PLACES id. */
  destRe: /^[a-z0-9-]{1,40}$/,
  /** Caller name: 1..24 characters, no '|'. */
  maxName: 24,
  maxFare: 5000,
  /** pax: at most 4 seats; seat 1..7, lookSeed 0..9999; parcels 0..50. */
  maxPaxSeats: 4,
  maxSeat: 7,
  maxSeed: 9999,
  maxParcels: 50,
  /** tow: 3 slots, score 0..10_000_000, gates 0..99. */
  slots: 3,
  maxPoints: 10_000_000,
  maxGates: 99,
} as const;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
/** Round and clamp to lo..hi; NaN and infinity fall to lo. */
const clampInt = (v: number, lo: number, hi: number): number =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : lo;

// ---- SYS.cab ----

export interface CabCallWire {
  id: number;
  x: number;
  z: number;
  /** Driver's player id, or null while open. */
  takenBy: number | null;
  state: CabStateCode;
  dest: string;
  name: string;
}

/** [id, qPos(x), qPos(z), takenBy ?? -1, state] and `${dest}|${name}` (name cut to maxName, '|' removed). */
export function encodeCab(c: CabCallWire): { rec: number[]; str: string } {
  const rec = [c.id, qPos(c.x), qPos(c.z), c.takenBy ?? -1, c.state];
  const name = c.name.replace(/\|/g, '').slice(0, JOB_WIRE.maxName);
  return { rec, str: `${c.dest}|${name}` };
}

/** Null when malformed: wrong length, id outside 1..maxId, state not a CAB_STATE, takenBy < -1, a bad dest or name.
 *  str undefined (not received yet) -> dest '' and name ''. */
export function decodeCab(rec: readonly number[], str: string | undefined): CabCallWire | null {
  if (rec.length !== 5 || !rec.every(isInt)) return null;
  const [id, qx, qz, takenRaw, state] = rec;
  if (id < 1 || id > JOB_WIRE.maxId || takenRaw < -1) return null;
  if (state !== 0 && state !== 1 && state !== 2) return null;
  let dest = '';
  let name = '';
  if (str !== undefined) {
    const bar = str.indexOf('|');
    if (bar < 0) return null;
    dest = str.slice(0, bar);
    name = str.slice(bar + 1);
    if (!JOB_WIRE.destRe.test(dest)) return null;
    if (name.length < 1 || name.length > JOB_WIRE.maxName) return null;
  }
  return {
    id, x: uqPos(qx), z: uqPos(qz), takenBy: takenRaw === -1 ? null : takenRaw,
    state: state as CabStateCode, dest, name,
  };
}

/** Args of a CAB_CMD.drop, clamped to bounds: fare 0..maxFare (int), stars 1..5. Null when malformed. */
export function decodeDropArgs(a: readonly number[]): { fare: number; stars: number } | null {
  if (a.length !== 2 || !isInt(a[0]) || !isInt(a[1])) return null;
  return { fare: clampInt(a[0], 0, JOB_WIRE.maxFare), stars: clampInt(a[1], 1, 5) };
}

// ---- SYS.pax ----

export interface PaxWire {
  parcels: number;
  /** [seat, lookSeed] pairs. */
  seats: [number, number][];
}

/** [1, parcels, seat, seed, ...]; at most maxPaxSeats pairs (extra pairs are dropped), values clamped to bounds. */
export function encodePax(p: PaxWire): number[] {
  const rec = [1, clampInt(p.parcels, 0, JOB_WIRE.maxParcels)];
  for (const [seat, seed] of p.seats.slice(0, JOB_WIRE.maxPaxSeats)) {
    rec.push(clampInt(seat, 1, JOB_WIRE.maxSeat), clampInt(seed, 0, JOB_WIRE.maxSeed));
  }
  return rec;
}

/** Null when malformed (odd pair count, too many pairs, seat outside 1..maxSeat, seed outside 0..maxSeed, parcels out of bounds). */
export function decodePax(rec: readonly number[]): PaxWire | null {
  if (rec.length < 2 || rec.length % 2 !== 0 || !rec.every(isInt) || rec[0] !== 1) return null;
  if ((rec.length - 2) / 2 > JOB_WIRE.maxPaxSeats) return null;
  const parcels = rec[1];
  if (parcels < 0 || parcels > JOB_WIRE.maxParcels) return null;
  const seats: [number, number][] = [];
  for (let i = 2; i < rec.length; i += 2) {
    const seat = rec[i];
    const seed = rec[i + 1];
    if (seat < 1 || seat > JOB_WIRE.maxSeat || seed < 0 || seed > JOB_WIRE.maxSeed) return null;
    seats.push([seat, seed]);
  }
  return { parcels, seats };
}

// ---- SYS.tow ----

export interface TowSlotWire {
  /** Player id, TOW_NPC or TOW_EMPTY. */
  who: number;
  x: number;
  z: number;
  yaw: number;
}

export interface TowWire {
  on: boolean;
  score: number;
  gates: number;
  /** Always exactly JOB_WIRE.slots entries. */
  slots: TowSlotWire[];
}

/** [1, on, score, gates, (who, qPos(x), qPos(z), qAngle(yaw)) x 3] = 16 numbers. Missing slots encode as empty. */
export function encodeTow(t: TowWire): number[] {
  const rec = [
    1, t.on ? 1 : 0, clampInt(t.score, 0, JOB_WIRE.maxPoints), clampInt(t.gates, 0, JOB_WIRE.maxGates),
  ];
  for (let i = 0; i < JOB_WIRE.slots; i++) {
    const s = t.slots[i];
    if (!s) {
      rec.push(TOW_EMPTY, 0, 0, 0);
      continue;
    }
    rec.push(Number.isFinite(s.who) ? Math.round(s.who) : TOW_EMPTY, qPos(s.x), qPos(s.z), qAngle(s.yaw));
  }
  return rec;
}

/** Null when malformed (length not 16, who < -2, score/gates out of bounds). */
export function decodeTow(rec: readonly number[]): TowWire | null {
  if (rec.length !== 16 || !rec.every(isInt) || rec[0] !== 1) return null;
  const on = rec[1];
  const score = rec[2];
  const gates = rec[3];
  if (on !== 0 && on !== 1) return null;
  if (score < 0 || score > JOB_WIRE.maxPoints || gates < 0 || gates > JOB_WIRE.maxGates) return null;
  const slots: TowSlotWire[] = [];
  for (let i = 0; i < JOB_WIRE.slots; i++) {
    const o = 4 + i * 4;
    const who = rec[o];
    if (who < TOW_NPC) return null;
    slots.push({ who, x: uqPos(rec[o + 1]), z: uqPos(rec[o + 2]), yaw: uqAngle(rec[o + 3]) });
  }
  return { on: on === 1, score, gates, slots };
}
