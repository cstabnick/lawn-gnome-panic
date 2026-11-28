// Online world sync on the wire (docs/roadmaps/gta-online-sync.md). net.ts carries these as { k: 'w', d: WireMsg }.
//
// Everything that is not a player's own pose goes through one generic channel: an OWNER publishes entity records
// (number arrays, quantized) to the peers near each entity, and every other client MIRRORS them. Systems (SYS) are
// hunting quarry, bird flocks, sky traffic, street events, the Sling-Lift and each player's activity (emote, rod,
// binoculars). Records are plain integers so change detection is exact and the JSON stays small.
//
// 'ent' owner -> peer: records (each starts with the entity id) and optional strings per id (sent once, then again on
//       keyframes), and ids the peer should drop (g). t = the owner's performance.now() (for interpolation).
// 'cmd' peer -> owner: do command c to entity i (shoot, comb, flush, crack...), with a few integer args.
// 'pay' owner -> peer: you earned n Acorns for r (a street event you resolved on someone else's world).

/** System codes. Append only: a code is its number on the wire. */
/** cab, pax, tow: sim jobs and tubing (jobs/protocol.ts, docs/roadmaps/gta-sim-jobs-and-tubing.md). */
/** sea: the host's wave clock and sea state (online/seaSync.ts, docs/roadmaps/gta-water-waves.md). */
/** park: stationary vehicles that were moved, taken, damaged, stored or left behind (online/parkSync.ts,
 *  docs/roadmaps/gta-multiplayer-audit.md). */
/** race: each player's street-race / race-mode lobby and progress (online/raceSync.ts, docs/roadmaps/gta-batch-3/E26/contracts.md). */
export const SYS = { quarry: 0, flock: 1, sky: 2, event: 3, sling: 4, act: 5, cab: 6, pax: 7, tow: 8, sea: 9, park: 10, race: 11 } as const;
export type SysCode = (typeof SYS)[keyof typeof SYS];
export const SYS_COUNT = 12;

export type WireMsg =
  | { o: 'ent'; y: SysCode; t: number; e: number[][]; s?: [number, string][]; g?: number[] }
  | { o: 'cmd'; y: SysCode; i: number; c: number; a?: number[] }
  | { o: 'pay'; n: number; r: string };

/** Most records / strings / gone ids one 'ent' message may carry (the publisher splits above this). */
export const MAX_RECS = 48;
/** Most numbers in one record. */
export const MAX_REC_LEN = 24;
/** Longest string attached to an entity (a gnome look code, a prefab id, an emote id). */
export const MAX_STR = 160;
/** Biggest Acorn payment one 'pay' may carry. */
export const MAX_PAY = 5000;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isSys = (v: unknown): v is SysCode => isInt(v) && v >= 0 && v < SYS_COUNT;
/** Records carry integers within +-2^31 (positions in decimetres fit with room to spare). */
const isRecNum = (v: unknown): v is number => isInt(v) && Math.abs(v) <= 0x7fffffff;

/** Read a WireMsg off the wire; anything malformed is null. */
export function parseWireMsg(d: unknown): WireMsg | null {
  if (typeof d !== 'object' || d === null) return null;
  const o = d as Record<string, unknown>;
  if (o.o === 'ent') {
    if (!isSys(o.y) || !isNum(o.t) || !Array.isArray(o.e) || o.e.length > MAX_RECS) return null;
    for (const r of o.e) {
      if (!Array.isArray(r) || r.length < 1 || r.length > MAX_REC_LEN || !r.every(isRecNum)) return null;
    }
    const msg: WireMsg = { o: 'ent', y: o.y, t: o.t, e: o.e as number[][] };
    if (o.s !== undefined) {
      if (!Array.isArray(o.s) || o.s.length > MAX_RECS) return null;
      for (const p of o.s) {
        if (!Array.isArray(p) || p.length !== 2 || !isRecNum(p[0]) || typeof p[1] !== 'string' || p[1].length > MAX_STR) return null;
      }
      msg.s = o.s as [number, string][];
    }
    if (o.g !== undefined) {
      if (!Array.isArray(o.g) || o.g.length > MAX_RECS * 4 || !o.g.every(isRecNum)) return null;
      msg.g = o.g as number[];
    }
    return msg;
  }
  if (o.o === 'cmd') {
    if (!isSys(o.y) || !isRecNum(o.i) || !isInt(o.c) || o.c < 0 || o.c > 255) return null;
    if (o.a === undefined) return { o: 'cmd', y: o.y, i: o.i, c: o.c };
    if (!Array.isArray(o.a) || o.a.length > 8 || !o.a.every(isRecNum)) return null;
    return { o: 'cmd', y: o.y, i: o.i, c: o.c, a: o.a as number[] };
  }
  if (o.o === 'pay') {
    if (!isInt(o.n) || o.n <= 0 || o.n > MAX_PAY || typeof o.r !== 'string' || o.r.length > 60) return null;
    return { o: 'pay', n: o.n, r: o.r };
  }
  return null;
}

// ---- Quantizers: what records are made of ----

/** A world coordinate (m) as integer decimetres. */
export const qPos = (v: number): number => (Number.isFinite(v) ? Math.round(v * 10) : 0);
/** Back to metres. */
export const uqPos = (q: number): number => q / 10;
/** An angle (rad) as 0..255. */
export function qAngle(a: number): number {
  if (!Number.isFinite(a)) return 0;
  const t = a / (Math.PI * 2);
  return ((Math.round((t - Math.floor(t)) * 256) % 256) + 256) % 256;
}
/** Back to radians in [-PI, PI). */
export function uqAngle(q: number): number {
  const a = (q / 256) * Math.PI * 2;
  return a >= Math.PI ? a - Math.PI * 2 : a;
}
/** A value in [-max, max] as a signed byte -127..127. */
export const qSigned = (v: number, max: number): number =>
  Number.isFinite(v) ? Math.round((Math.max(-max, Math.min(max, v)) / max) * 127) : 0;
export const uqSigned = (q: number, max: number): number => (q / 127) * max;
/** A 0..1 value as 0..100. */
export const qUnit = (v: number): number => (Number.isFinite(v) ? Math.round(Math.max(0, Math.min(1, v)) * 100) : 0);
export const uqUnit = (q: number): number => q / 100;

// ---- Player activity (SYS.act): one record per player, id 0, the owner is the player ----

/** What a player is doing with their hands, besides driving and guns (those ride on the pose). Append only. */
export const ACT = { none: 0, rod: 1, scope: 2 } as const;
/** Fishing phases on the wire (fishing/types.ts FishPhase). Append only. */
export const FISH_PHASES = ['idle', 'charge', 'flight', 'wait', 'bite', 'reel', 'landed', 'lost'] as const;

/** A remote player's activity as remotes.ts shows it. */
export interface RemoteActivity {
  /** The emote playing (an anim row id, or 'lawn:' + a @lawn/emotes id), or null. */
  emote: string | null;
  /** Bumped by the sender each time an emote starts, so the same emote twice in a row plays twice. */
  emoteSeq: number;
  /** ACT.none / ACT.rod / ACT.scope. */
  mode: number;
  /** Fishing (mode ACT.rod): the rod id (fishing/tackle.ts rodById; '' = unknown, show RODS[0]), the phase, seconds in it
   *  (sent as 0: the mirror counts its own time from when the phase changed), cast charge 0..1. */
  rod: string;
  phase: (typeof FISH_PHASES)[number];
  phaseT: number;
  charge: number;
  /** The bobber in the water (phases wait / bite / reel), else null. */
  bobber: { x: number; y: number; z: number } | null;
  /** Binoculars (mode ACT.scope): where they look, radians (yaw 0 = +z; pitch + = up). */
  lookYaw: number;
  lookPitch: number;
}

/**
 * The activity record: [0, emoteSeq, mode, phase, phaseT*10 (capped 255), charge 0..100, hasBobber, bx, by, bz (dm),
 * lookYaw byte, lookPitch signed byte (max 1.5 rad)]. The string is `${emote ?? ''}|${rod}`.
 * phaseT is coarse (0.1 s, capped) and only sent with the phase, so the record does not change every frame.
 */
export function encodeActivity(a: RemoteActivity): { rec: number[]; str: string } {
  const phase = Math.max(0, FISH_PHASES.indexOf(a.phase));
  const rec = [
    0, a.emoteSeq & 0xffff, a.mode, phase, Math.min(255, Math.round(a.phaseT * 10)), qUnit(a.charge),
    a.bobber ? 1 : 0, a.bobber ? qPos(a.bobber.x) : 0, a.bobber ? qPos(a.bobber.y) : 0, a.bobber ? qPos(a.bobber.z) : 0,
    qAngle(a.lookYaw), qSigned(a.lookPitch, 1.5),
  ];
  return { rec, str: `${a.emote ?? ''}|${a.rod}` };
}

const EMOTE_RE = /^(lawn:)?[a-z0-9-]{1,48}$/;
const ROD_RE = /^[a-z0-9-]{0,48}$/;

/** Read an activity record (and its string, if known yet). Null when the record is malformed. */
export function decodeActivity(rec: readonly number[], str: string | undefined): RemoteActivity | null {
  if (rec.length !== 12) return null;
  const [, seq, mode, phase, pt, charge, hasBob, bx, by, bz, yawQ, pitchQ] = rec;
  if (mode < 0 || mode > 2 || phase < 0 || phase >= FISH_PHASES.length) return null;
  const [emoteRaw, rodRaw] = (str ?? '|').split('|');
  const emote = emoteRaw && EMOTE_RE.test(emoteRaw) ? emoteRaw : null;
  const rod = rodRaw !== undefined && ROD_RE.test(rodRaw) ? rodRaw : '';
  return {
    emote, emoteSeq: seq, mode, rod, phase: FISH_PHASES[phase], phaseT: pt / 10, charge: uqUnit(charge),
    bobber: hasBob === 1 ? { x: uqPos(bx), y: uqPos(by), z: uqPos(bz) } : null,
    lookYaw: uqAngle(yawQ), lookPitch: uqSigned(pitchQ, 1.5),
  };
}
