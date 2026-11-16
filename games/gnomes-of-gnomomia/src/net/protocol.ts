// Gnomomia's game messages on top of the shared relay server (packages/mp). The world is one public room: every player
// owns their own character (src/state.ts, saved in localStorage) and tells the room about it. Nothing here is
// authoritative: other players only draw what they are told.
//
// Moving characters to the server later: the server would keep GameState by CharacterCard.cid and build the card
// itself (the same characterCard() below), so clients stop sending 'card' and the rest stays as it is.
import type { ClassId, ZoneId } from '../config';
import { ZONES } from '../content';
import { maxHp, type GameState } from '../state';

export const GAME_ID = 'gnomomia' as const;
/** Bump when a message changes shape; cards from another version are ignored. */
export const NET_VERSION = 2;
/** Position updates per second while moving, and while standing still (also the keepalive for MATCH_SILENT_S). */
export const POS_HZ_MOVING = 10;
export const POS_HZ_IDLE = 2;
/** How often the card is rebuilt and, if it changed, sent (s). */
export const CARD_CHECK_S = 1;

/** What everyone may know about a character: its public profile. Built from the owner's GameState. */
export interface CharacterCard {
  v: number;
  /** Stable character id (per browser for now; the future server's save key). */
  cid: string;
  level: number;
  classId: ClassId | null;
  hp: number;
  hpMax: number;
}

/**
 * A pose sample: x, z, facing (rad), dead (0/1), swing count (goes up by one per swing), y (the height the gnome
 * stands at: on the ground, a deck or a ramp). x, z and y are world coordinates.
 */
export type Pose = [number, number, number, number, number, number];

export type GnoMsg =
  /** My public card: sent to everyone on joining and whenever it changes, and to a newcomer when they join. */
  | { k: 'card'; c: CharacterCard }
  /** Where I am: zone, pose, and my clock (performance.now()) when it was taken. */
  | { k: 'pos'; z: ZoneId; p: Pose; t: number };

const CLASS_IDS: readonly ClassId[] = ['warden', 'slinger', 'mage'];

export function characterCard(cid: string, s: GameState): CharacterCard {
  return { v: NET_VERSION, cid, level: s.level, classId: s.classId, hp: Math.max(0, Math.round(s.hp)), hpMax: maxHp(s) };
}

function finite(v: unknown, lo: number, hi: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
}

export function isZoneId(v: unknown): v is ZoneId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(ZONES, v);
}

/** A card from the wire, checked; null when it is broken or from another version. */
export function readCard(raw: unknown): CharacterCard | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;
  if (c.v !== NET_VERSION) return null;
  const level = finite(c.level, 1, 99);
  const hpMax = finite(c.hpMax, 1, 1e6);
  const hp = finite(c.hp, 0, 1e6);
  if (level === null || hpMax === null || hp === null) return null;
  const classId = CLASS_IDS.includes(c.classId as ClassId) ? (c.classId as ClassId) : null;
  const cid = typeof c.cid === 'string' ? c.cid.slice(0, 40) : '';
  return { v: NET_VERSION, cid, level: Math.floor(level), classId, hp: Math.min(hp, hpMax), hpMax };
}

/** A pose from the wire, checked; null when broken. */
export function readPose(raw: unknown): Pose | null {
  if (!Array.isArray(raw) || raw.length !== 6) return null;
  const x = finite(raw[0], -1e4, 1e4);
  const z = finite(raw[1], -1e4, 1e4);
  const f = finite(raw[2], -100, 100);
  const dead = finite(raw[3], 0, 1);
  const swings = finite(raw[4], 0, 1e9);
  const y = finite(raw[5], -1e4, 1e4);
  if (x === null || z === null || f === null || dead === null || swings === null || y === null) return null;
  return [x, z, f, dead, swings, y];
}
