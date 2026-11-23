// Gnomomia's game messages on top of the shared relay server (packages/mp). The world is one public room: every player
// owns their own character (src/state.ts, saved in localStorage) and tells the room about it. Nothing here is
// authoritative: other players only draw what they are told.
//
// Moving characters to the server later: the server would keep GameState by CharacterCard.cid and build the card
// itself (the same characterCard() below), so clients stop sending 'card' and the rest stays as it is.
import type { ClassId, DamageType, StatusId, ZoneId } from '../config';
import { ITEMS, ZONES } from '../content';
import type { AttackKind } from '../playerVisuals';
import { maxHp, type GameState } from '../state';
import { isEmoteId } from '@lawn/emotes';
import { CHAT_MAX, censorText, tidyText } from '@lawn/mp/textFilter';

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

/** [slot, name, x, z, facing, dead, swings, y, hatColor, shirtColor, level, cls, pers, sit].
 * level: the gnome's own level (0 = unknown: an older client). cls: index into CLASS_WIRE in
 * src/companionGear.ts (-1 = unknown). pers: index into PERSONALITY_ORDER in src/companionLogic.ts (-1 = unknown).
 * sit: 1 while sitting on the ground, else 0. The last four are optional for older senders; readCompanionList
 * always fills them. */
export type CompanionPose = [
  number, string, number, number, number, number, number, number, number, number,
  number?, number?, number?, number?,
];

/** [key, x, z, facing, hp, dead (0/1), inCombat (0/1), swings, deadFor]. */
export type EnemySync = [string, number, number, number, number, number, number, number, number];

/** [itemId, count]. */
export type LootItem = [string, number];

/** [syncKey, zone, x, z, items, gold, ttlSeconds]. */
export type LootSync = [string, ZoneId, number, number, LootItem[], number, number];

/** [itemId, count] offered in a player-to-player trade (never quest items). */
export type TradeItem = [string, number];

/** Most players in an online party (the leader included). */
export const PARTY_WIRE_MAX = 4;
/** A Wayfarer the leader hired, as members see it: [name, level]. */
export type PartyHelperWire = [string, number];

/** Bitmask flags carried on `pos` messages for synced player animations & cosmetics. */
export const ANIM_SITTING = 1 << 0;
export const ANIM_SMOKING = 1 << 1;
export const ANIM_TIPSY = 1 << 2;
const ANIM_FLAGS_MASK = ANIM_SITTING | ANIM_SMOKING | ANIM_TIPSY;
const ATTACK_KINDS: readonly AttackKind[] = ['chop', 'thrust', 'ranged', 'cast'];

export type GnoMsg =
  /** My public card: sent to everyone on joining and whenever it changes, and to a newcomer when they join. */
  | { k: 'card'; c: CharacterCard }
  /** Where I am: zone, pose, clock, plus optional animation flags (sitting/smoking/tipsy), attackKind and block counter. */
  | { k: 'pos'; z: ZoneId; p: Pose; t: number; f?: number; ak?: AttackKind; blk?: number }
  /** Where my AI companions are: zone, companion poses, and clock. */
  | { k: 'comp'; z: ZoneId; l: CompanionPose[]; t: number }
  /** Zone authority's enemy state snapshot for a zone. */
  | { k: 'esync'; z: ZoneId; l: EnemySync[]; t: number }
  /** Zone authority handoff when yielding authority to a newcomer. */
  | { k: 'ehand'; z: ZoneId; l: EnemySync[] }
  /** Non-authority player hit an enemy; sent to zone authority. */
  | { k: 'ehit'; z: ZoneId; e: string; d: number; dt?: DamageType; c?: boolean; sp?: boolean }
  /** Non-authority player applied a status to an enemy; sent to zone authority. */
  | { k: 'estat'; z: ZoneId; e: string; s: StatusId; sec: number; p: number }
  /** Zone authority broadcasts that an enemy died and who landed the killing blow. */
  | { k: 'ekill'; z: ZoneId; e: string; by: number }
  /** Zone authority tells a remote player that an enemy swung at them. */
  | { k: 'eatk'; z: ZoneId; e: string }
  /** Dynamic enemy spawn (defend wave, boss summon, etc.). */
  | { k: 'espawn'; z: ZoneId; e: string; def: string; x: number; zp: number }
  /** A player dropped items on the ground (broadcast on drop, or unicast to newcomers). */
  | { k: 'ldrop'; l: LootSync }
  /** A player picked up all or part of a synced loot pile; r/g are what remains on the ground. */
  | { k: 'ltake'; key: string; r: LootItem[]; g: number }
  /** Trade request sent from initiator to target. */
  | { k: 'treq'; tid: string }
  /** Target accepts the trade request; both open the trade window. */
  | { k: 'tacc'; tid: string }
  /** Either side declines a request or cancels/closes an active trade. */
  | { k: 'tdec'; tid: string; r?: string }
  /** Updated trade offer from one side; resets both players' ready state. */
  | { k: 'toff'; tid: string; items: TradeItem[]; gold: number; rev: number }
  /** One side toggles ready/accept for the current (myRev, peerRev) offer snapshot. */
  | { k: 'tok'; tid: string; myRev: number; peerRev: number; ok: boolean }
  /** Lower-id player finalizes the trade once both sides are ready at matching revisions. */
  | { k: 'tdone'; tid: string; myRev: number; peerRev: number }
  /** Party invite from the (would-be) leader. pid = '<leaderId>:<seq>'. */
  | { k: 'pinv'; pid: string }
  /** The invited player's answer, sent to the inviter. */
  | { k: 'pans'; pid: string; ok: boolean }
  /** Leader -> each member: the party now. m = online member ids, leader included; h = the leader's Wayfarer helpers. */
  | { k: 'prost'; pid: string; lead: number; m: number[]; h: PartyHelperWire[] }
  /** Member -> leader: I left. Leader -> member: you are out (kicked, disbanded, or the party was full). */
  | { k: 'pleave'; pid: string }
  /** A party chat line, sent to each member. */
  | { k: 'pchat'; pid: string; t: string }
  /** An animated emote (@lawn/emotes id), broadcast to everyone. */
  | { k: 'emo'; e: string };

const CLASS_IDS: readonly ClassId[] = ['warden', 'slinger', 'mage'];
const DAMAGE_TYPES: readonly DamageType[] = ['slash', 'crush', 'pierce', 'sun', 'rain', 'bloom'];
const STATUS_IDS: readonly StatusId[] = [
  'chipped', 'poisoned', 'burning', 'soaked', 'slowed', 'rooted', 'staggered', 'stunned', 'cracked', 'glazed', 'marked',
];

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

/** A list of companion poses from the wire, checked; null when broken. */
export function readCompanionList(raw: unknown): CompanionPose[] | null {
  if (!Array.isArray(raw) || raw.length > 8) return null;
  const out: CompanionPose[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || (item.length !== 10 && item.length !== 14)) return null;
    const slot = finite(item[0], 0, 15);
    const name = typeof item[1] === 'string' ? item[1].slice(0, 24) : null;
    const x = finite(item[2], -1e4, 1e4);
    const z = finite(item[3], -1e4, 1e4);
    const f = finite(item[4], -100, 100);
    const dead = finite(item[5], 0, 1);
    const swings = finite(item[6], 0, 1e9);
    const y = finite(item[7], -1e4, 1e4);
    const hat = finite(item[8], 0, 0xffffff);
    const shirt = finite(item[9], 0, 0xffffff);
    if (
      slot === null || name === null || x === null || z === null || f === null ||
      dead === null || swings === null || y === null || hat === null || shirt === null
    ) return null;
    let level = 0;
    let cls = -1;
    let pers = -1;
    let sit = 0;
    if (item.length === 14) {
      const lv = finite(item[10], 0, 99);
      const c = finite(item[11], -1, 15);
      const p = finite(item[12], -1, 15);
      const s = finite(item[13], 0, 1);
      if (lv === null || c === null || p === null || s === null) return null;
      level = Math.floor(lv);
      cls = Math.floor(c);
      pers = Math.floor(p);
      sit = s >= 0.5 ? 1 : 0;
    }
    out.push([Math.floor(slot), name, x, z, f, dead, swings, y, Math.floor(hat), Math.floor(shirt), level, cls, pers, sit]);
  }
  return out;
}

export function readDamageType(raw: unknown): DamageType | null {
  return typeof raw === 'string' && DAMAGE_TYPES.includes(raw as DamageType) ? (raw as DamageType) : null;
}

export function readStatusId(raw: unknown): StatusId | null {
  return typeof raw === 'string' && STATUS_IDS.includes(raw as StatusId) ? (raw as StatusId) : null;
}

/** A list of enemy sync tuples from the wire, checked; null when broken. */
export function readEnemySyncList(raw: unknown): EnemySync[] | null {
  if (!Array.isArray(raw) || raw.length > 256) return null;
  const out: EnemySync[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length !== 9) return null;
    const key = typeof item[0] === 'string' && item[0].length > 0 && item[0].length <= 32 ? item[0] : null;
    const x = finite(item[1], -1e4, 1e4);
    const z = finite(item[2], -1e4, 1e4);
    const f = finite(item[3], -100, 100);
    const hp = finite(item[4], 0, 1e6);
    const dead = finite(item[5], 0, 1);
    const inCombat = finite(item[6], 0, 1);
    const swings = finite(item[7], 0, 1e9);
    const deadFor = finite(item[8], 0, 1e5);
    if (
      key === null || x === null || z === null || f === null || hp === null ||
      dead === null || inCombat === null || swings === null || deadFor === null
    ) return null;
    out.push([key, x, z, f, hp, dead, inCombat, swings, deadFor]);
  }
  return out;
}

/** Validates a list of [itemId, count] tuples; optionally rejects quest items. */
function readItemPairs(raw: unknown, allowQuestItems: boolean): LootItem[] | null {
  if (!Array.isArray(raw) || raw.length > 28) return null;
  const out: LootItem[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length !== 2) return null;
    const item = typeof entry[0] === 'string' && Object.prototype.hasOwnProperty.call(ITEMS, entry[0]) ? entry[0] : null;
    const count = finite(entry[1], 1, 9999);
    if (item === null || count === null || Math.floor(count) !== count) return null;
    if (!allowQuestItems && ITEMS[item]?.questItem) return null;
    out.push([item, count]);
  }
  return out;
}

export function readLootItems(raw: unknown): LootItem[] | null {
  return readItemPairs(raw, true);
}

export function readTradeItems(raw: unknown): TradeItem[] | null {
  return readItemPairs(raw, false);
}

/** Validates a synced dropped loot tuple from the wire; null when malformed. */
export function readLootSync(raw: unknown): LootSync | null {
  if (!Array.isArray(raw) || raw.length !== 7) return null;
  const key = typeof raw[0] === 'string' && raw[0].length > 0 && raw[0].length <= 32 ? raw[0] : null;
  if (key === null || !isZoneId(raw[1])) return null;
  const x = finite(raw[2], -1e4, 1e4);
  const z = finite(raw[3], -1e4, 1e4);
  const items = readLootItems(raw[4]);
  const gold = finite(raw[5], 0, 1e9);
  const ttl = finite(raw[6], 0.1, 600);
  if (x === null || z === null || items === null || gold === null || ttl === null) return null;
  if (items.length === 0 && gold === 0) return null;
  return [key, raw[1], x, z, items, Math.floor(gold), ttl];
}

export function readTradeId(raw: unknown): string | null {
  return typeof raw === 'string' && raw.length > 0 && raw.length <= 32 ? raw : null;
}

export function readAnimFlags(raw: unknown): number {
  const n = finite(raw, 0, 255);
  return n === null ? 0 : Math.floor(n) & ANIM_FLAGS_MASK;
}

export function readAttackKind(raw: unknown): AttackKind {
  return typeof raw === 'string' && ATTACK_KINDS.includes(raw as AttackKind) ? (raw as AttackKind) : 'chop';
}

export function readBlockCount(raw: unknown): number {
  const n = finite(raw, 0, 1e9);
  return n === null ? 0 : Math.floor(n);
}

/** A party id from the wire: a string of 3..32 chars matching /^\d+:\d+$/, else null. */
export function readPartyId(raw: unknown): string | null {
  return typeof raw === 'string' && raw.length >= 3 && raw.length <= 32 && /^\d+:\d+$/.test(raw) ? raw : null;
}

/**
 * A roster from the wire, else null. lead: integer 0..1e6. m: array of 2..PARTY_WIRE_MAX distinct integers 0..1e6
 * that includes lead; returned sorted ascending. h: array of at most PARTY_WIRE_MAX - 1 entries [name, level], name a
 * string (tidyText, then sliced to 24 chars, must be non-empty), level an integer 1..99; anything malformed -> null.
 */
export function readPartyRoster(lead: unknown, m: unknown, h: unknown): { lead: number; m: number[]; h: PartyHelperWire[] } | null {
  const leadId = finite(lead, 0, 1e6);
  if (leadId === null || Math.floor(leadId) !== leadId) return null;
  if (!Array.isArray(m) || m.length < 2 || m.length > PARTY_WIRE_MAX) return null;
  const ids: number[] = [];
  for (const raw of m) {
    const id = finite(raw, 0, 1e6);
    if (id === null || Math.floor(id) !== id) return null;
    if (ids.includes(id)) return null;
    ids.push(id);
  }
  if (!ids.includes(leadId)) return null;
  if (!Array.isArray(h) || h.length > PARTY_WIRE_MAX - 1) return null;
  const helpers: PartyHelperWire[] = [];
  for (const entry of h) {
    if (!Array.isArray(entry) || entry.length !== 2) return null;
    const name = typeof entry[0] === 'string' ? tidyText(entry[0]).slice(0, 24) : '';
    const level = finite(entry[1], 1, 99);
    if (name.length === 0 || level === null || Math.floor(level) !== level) return null;
    helpers.push([name, level]);
  }
  return { lead: leadId, m: ids.sort((a, b) => a - b), h: helpers };
}

/** A party chat line from the wire: tidyText, censorText, sliced to CHAT_MAX; null when not a string or empty after tidying. */
export function readPartyChat(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = tidyText(raw);
  if (text.length === 0) return null;
  return censorText(text).slice(0, CHAT_MAX);
}

/** An emote id from the wire when @lawn/emotes knows it, else null. */
export function readEmoteId(raw: unknown): string | null {
  return isEmoteId(raw) ? raw : null;
}
