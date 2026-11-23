// Loadout values: the stock loadout, cleaning, a compact text code (for saves and the network), and what a change costs.
import {
  BEAM_IDS, BUMPER_IDS, CANOPY_IDS, DECAL_IDS, EXHAUST_IDS, EXTRA_IDS, FINISH_IDS, GRILLE_IDS, HORN_IDS, LAMP_IDS, MIRROR_IDS,
  ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS,
} from './ids';
import { modById, PRICES } from './catalog';
import {
  CAMBER_MAX, CAMBER_MIN, ExtraId, Loadout, MAX_EXTRAS, SlotId, WHEEL_SIZE_MAX, WHEEL_SIZE_MIN,
} from './types';

/** The stock vehicle in this body colour: every slot at its factory setting. */
export function defaultLoadout(paint: number): Loadout {
  return {
    paint: paint & 0xffffff, finish: 'gloss', decal: 'none', decalColor: 0xffffff, decalNumber: 7,
    tyre: 'stock', rim: 'stock', rimColor: 0xc8ccd2, wheelSize: 1, camberFront: 0, camberRear: 0, rideHeight: 0,
    steer: 'stock', lamp: 'stock', beam: 'warm', spoiler: 'none', seat: 'none', ornament: 'none', extras: [], underglow: null,
    grille: 'stock', bumper: 'stock', canopy: 'none', mirror: 'none', exhaust: 'none', horn: 'stock',
  };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
/** Round to a number of decimals; the `+ 0` turns -0 into 0 so codes and comparisons stay clean. */
const roundTo = (x: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(x * f) / f + 0;
};

function pickId<T extends string>(list: readonly T[], v: unknown): T | undefined {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** Any input (a saved blob, a decoded code, a half-filled object) -> a valid Loadout: unknown ids become stock, numbers are clamped, extras deduped and capped. Never throws. */
export function normalizeLoadout(input: Partial<Loadout> | null | undefined, paintFallback = 0xd8342c): Loadout {
  const out = defaultLoadout(paintFallback);
  if (typeof input !== 'object' || input === null) return out;
  const src: Record<string, unknown> = { ...input };

  const paint = src.paint;
  if (isNum(paint)) out.paint = paint & 0xffffff;
  const finish = pickId(FINISH_IDS, src.finish);
  if (finish !== undefined) out.finish = finish;
  if (src.decal === 'none') out.decal = 'none';
  else {
    const decal = pickId(DECAL_IDS, src.decal);
    if (decal !== undefined) out.decal = decal;
  }
  const decalColor = src.decalColor;
  if (isNum(decalColor)) out.decalColor = decalColor & 0xffffff;
  const decalNumber = src.decalNumber;
  if (isNum(decalNumber)) out.decalNumber = clamp(Math.round(decalNumber), 0, 99);
  const tyre = pickId(TYRE_IDS, src.tyre);
  if (tyre !== undefined) out.tyre = tyre;
  const rim = pickId(RIM_IDS, src.rim);
  if (rim !== undefined) out.rim = rim;
  const rimColor = src.rimColor;
  if (isNum(rimColor)) out.rimColor = rimColor & 0xffffff;
  const wheelSize = src.wheelSize;
  if (isNum(wheelSize)) out.wheelSize = roundTo(clamp(wheelSize, WHEEL_SIZE_MIN, WHEEL_SIZE_MAX), 2);
  const camberFront = src.camberFront;
  if (isNum(camberFront)) out.camberFront = roundTo(clamp(camberFront, CAMBER_MIN, CAMBER_MAX), 1);
  const camberRear = src.camberRear;
  if (isNum(camberRear)) out.camberRear = roundTo(clamp(camberRear, CAMBER_MIN, CAMBER_MAX), 1);
  const rideHeight = src.rideHeight;
  if (isNum(rideHeight)) out.rideHeight = roundTo(clamp(rideHeight, -1, 1), 2);
  const steer = pickId(STEER_IDS, src.steer);
  if (steer !== undefined) out.steer = steer;
  const lamp = pickId(LAMP_IDS, src.lamp);
  if (lamp !== undefined) out.lamp = lamp;
  const beam = pickId(BEAM_IDS, src.beam);
  if (beam !== undefined) out.beam = beam;
  if (src.spoiler === 'none') out.spoiler = 'none';
  else {
    const spoiler = pickId(SPOILER_IDS, src.spoiler);
    if (spoiler !== undefined) out.spoiler = spoiler;
  }
  if (src.seat === 'none') out.seat = 'none';
  else {
    const seat = pickId(SEAT_IDS, src.seat);
    if (seat !== undefined) out.seat = seat;
  }
  if (src.ornament === 'none') out.ornament = 'none';
  else {
    const ornament = pickId(ORNAMENT_IDS, src.ornament);
    if (ornament !== undefined) out.ornament = ornament;
  }
  const extras: unknown = src.extras;
  if (Array.isArray(extras)) {
    const picked: ExtraId[] = [];
    for (const v of extras as unknown[]) {
      const id = pickId(EXTRA_IDS, v);
      if (id !== undefined && !picked.includes(id) && picked.length < MAX_EXTRAS) picked.push(id);
    }
    out.extras = picked;
  }
  const underglow = src.underglow;
  if (underglow === null) out.underglow = null;
  else if (isNum(underglow)) out.underglow = underglow & 0xffffff;
  const grille = pickId(GRILLE_IDS, src.grille);
  if (grille !== undefined) out.grille = grille;
  const bumper = pickId(BUMPER_IDS, src.bumper);
  if (bumper !== undefined) out.bumper = bumper;
  if (src.canopy === 'none') out.canopy = 'none';
  else {
    const canopy = pickId(CANOPY_IDS, src.canopy);
    if (canopy !== undefined) out.canopy = canopy;
  }
  if (src.mirror === 'none') out.mirror = 'none';
  else {
    const mirror = pickId(MIRROR_IDS, src.mirror);
    if (mirror !== undefined) out.mirror = mirror;
  }
  if (src.exhaust === 'none') out.exhaust = 'none';
  else {
    const exhaust = pickId(EXHAUST_IDS, src.exhaust);
    if (exhaust !== undefined) out.exhaust = exhaust;
  }
  const horn = pickId(HORN_IDS, src.horn);
  if (horn !== undefined) out.horn = horn;
  return out;
}

// Codes are indices into the id lists in ids.ts, so REORDERING OR INSERTING AN ID IN THOSE LISTS BREAKS EVERY OLD CODE.
// Append new ids at the end of a list only, and never reorder.

const FIELD_COUNT = 26;
const CODE_PREFIX = 'g1.';
const CODE_MAX = 120;

const hex6 = (c: number): string => c.toString(16).padStart(6, '0');
const b36 = (n: number): string => Math.round(n).toString(36);
const indexOf36 = (list: readonly string[], id: string): string => list.indexOf(id).toString(36);

/** Compact, URL-safe text for a loadout: starts with 'g1.', only [A-Za-z0-9._-], at most 120 characters. */
export function encodeLoadout(l: Loadout): string {
  const n = normalizeLoadout(l);
  const fields = [
    hex6(n.paint),
    indexOf36(FINISH_IDS, n.finish),
    n.decal === 'none' ? '-' : indexOf36(DECAL_IDS, n.decal),
    hex6(n.decalColor),
    b36(n.decalNumber),
    indexOf36(TYRE_IDS, n.tyre),
    indexOf36(RIM_IDS, n.rim),
    hex6(n.rimColor),
    b36(n.wheelSize * 100),
    b36(n.camberFront * 10 + 300),
    b36(n.camberRear * 10 + 300),
    b36(n.rideHeight * 100 + 100),
    indexOf36(STEER_IDS, n.steer),
    indexOf36(LAMP_IDS, n.lamp),
    indexOf36(BEAM_IDS, n.beam),
    n.spoiler === 'none' ? '-' : indexOf36(SPOILER_IDS, n.spoiler),
    n.seat === 'none' ? '-' : indexOf36(SEAT_IDS, n.seat),
    n.ornament === 'none' ? '-' : indexOf36(ORNAMENT_IDS, n.ornament),
    n.extras.length > 0 ? n.extras.map((e) => indexOf36(EXTRA_IDS, e)).join('') : '-',
    n.underglow === null ? '-' : hex6(n.underglow),
    indexOf36(GRILLE_IDS, n.grille),
    indexOf36(BUMPER_IDS, n.bumper),
    n.canopy === 'none' ? '-' : indexOf36(CANOPY_IDS, n.canopy),
    n.mirror === 'none' ? '-' : indexOf36(MIRROR_IDS, n.mirror),
    n.exhaust === 'none' ? '-' : indexOf36(EXHAUST_IDS, n.exhaust),
    indexOf36(HORN_IDS, n.horn),
  ];
  return CODE_PREFIX + fields.join('.');
}

const num36 = (s: string): number | null => (/^[0-9a-z]+$/.test(s) ? parseInt(s, 36) : null);
const hex = (s: string): number | null => (/^[0-9a-f]{6}$/.test(s) ? parseInt(s, 16) : null);
function pickIdField<T extends string>(list: readonly T[], s: string): T | null {
  const i = num36(s);
  return i !== null && i < list.length ? (list[i] as T) : null;
}
function pickNoneField<T extends string>(list: readonly T[], s: string): T | 'none' | null {
  return s === '-' ? 'none' : pickIdField(list, s);
}

/** The inverse of encodeLoadout; null for anything that is not a valid code (wrong prefix, bad length, bad characters). decode(encode(l)) deep-equals normalize(l). */
export function decodeLoadout(code: string): Loadout | null {
  if (typeof code !== 'string' || code.length > CODE_MAX || !code.startsWith(CODE_PREFIX)) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(code)) return null;
  const f = code.slice(CODE_PREFIX.length).split('.');
  if (f.length !== FIELD_COUNT) return null;
  const [
    paint = '', finish = '', decal = '', decalColor = '', decalNumber = '', tyre = '', rim = '', rimColor = '',
    wheelSize = '', camberFront = '', camberRear = '', rideHeight = '', steer = '', lamp = '', beam = '',
    spoiler = '', seat = '', ornament = '', extras = '', underglow = '',
    grille = '', bumper = '', canopy = '', mirror = '', exhaust = '', horn = '',
  ] = f;

  const pc = hex(paint), fin = pickIdField(FINISH_IDS, finish), dec = pickNoneField(DECAL_IDS, decal);
  const dc = hex(decalColor), dn = num36(decalNumber), ty = pickIdField(TYRE_IDS, tyre), rm = pickIdField(RIM_IDS, rim);
  const rc = hex(rimColor), ws = num36(wheelSize), cf = num36(camberFront), cr = num36(camberRear);
  const rh = num36(rideHeight), st = pickIdField(STEER_IDS, steer), lp = pickIdField(LAMP_IDS, lamp);
  const bm = pickIdField(BEAM_IDS, beam), sp = pickNoneField(SPOILER_IDS, spoiler), se = pickNoneField(SEAT_IDS, seat);
  const or = pickNoneField(ORNAMENT_IDS, ornament);
  const ug: number | null | undefined = underglow === '-' ? null : hex(underglow) ?? undefined;
  const gr = pickIdField(GRILLE_IDS, grille), bp = pickIdField(BUMPER_IDS, bumper), cp = pickNoneField(CANOPY_IDS, canopy);
  const mr = pickNoneField(MIRROR_IDS, mirror), ex = pickNoneField(EXHAUST_IDS, exhaust), hn = pickIdField(HORN_IDS, horn);

  let ex_list: ExtraId[] | null = [];
  if (extras !== '-') {
    for (const ch of extras) {
      const e = pickIdField(EXTRA_IDS, ch);
      if (e === null || ex_list === null) {
        ex_list = null;
        break;
      }
      ex_list.push(e);
    }
  }

  if (
    pc === null || fin === null || dec === null || dc === null || dn === null || ty === null || rm === null || rc === null
    || ws === null || cf === null || cr === null || rh === null || st === null || lp === null || bm === null || sp === null
    || se === null || or === null || ex_list === null || ug === undefined
    || gr === null || bp === null || cp === null || mr === null || ex === null || hn === null
  ) return null;

  return normalizeLoadout({
    paint: pc, finish: fin, decal: dec, decalColor: dc, decalNumber: dn, tyre: ty, rim: rm, rimColor: rc,
    wheelSize: ws / 100, camberFront: (cf - 300) / 10, camberRear: (cr - 300) / 10, rideHeight: (rh - 100) / 100,
    steer: st, lamp: lp, beam: bm, spoiler: sp, seat: se, ornament: or, extras: ex_list, underglow: ug,
    grille: gr, bumper: bp, canopy: cp, mirror: mr, exhaust: ex, horn: hn,
  });
}

/** True when every field is equal (extras compared as sets). */
export function sameLoadout(a: Loadout, b: Loadout): boolean {
  const keys: readonly (keyof Loadout)[] = [
    'paint', 'finish', 'decal', 'decalColor', 'decalNumber', 'tyre', 'rim', 'rimColor', 'wheelSize', 'camberFront',
    'camberRear', 'rideHeight', 'steer', 'lamp', 'beam', 'spoiler', 'seat', 'ornament', 'underglow',
    'grille', 'bumper', 'canopy', 'mirror', 'exhaust', 'horn',
  ];
  for (const k of keys) if (a[k] !== b[k]) return false;
  const sb = new Set(b.extras);
  const sa = new Set(a.extras);
  if (sa.size !== sb.size) return false;
  return a.extras.every((e) => sb.has(e));
}

/** True when nothing but (maybe) the paint colour differs from defaultLoadout. */
export function isStockLoadout(l: Loadout): boolean {
  return sameLoadout(l, defaultLoadout(l.paint));
}

export interface CostLine { label: string; price: number }

const PRODUCT_SLOTS = [
  'tyre', 'rim', 'steer', 'lamp', 'spoiler', 'seat', 'ornament', 'grille', 'bumper', 'canopy', 'mirror', 'exhaust', 'horn',
] as const satisfies readonly SlotId[];

/** What the shop charges, line by line, to turn what the player already owns into `wanted`: only things that CHANGE are charged (see PRICES and each ModDef.price in catalog.ts). */
export function loadoutCostLines(owned: Loadout, wanted: Loadout): CostLine[] {
  const o = normalizeLoadout(owned);
  const w = normalizeLoadout(wanted);
  const lines: CostLine[] = [];
  const add = (label: string, price: number): void => {
    if (price > 0) lines.push({ label, price });
  };

  if (o.paint !== w.paint) add('Body colour', PRICES.paint);

  if (o.finish !== w.finish) {
    const d = modById('finish', w.finish);
    if (d) add(d.name, d.price);
  }

  const decalChanged = o.decal !== w.decal;
  if (decalChanged && w.decal !== 'none') {
    const d = modById('decal', w.decal);
    if (d) add(d.name, d.price);
  }
  if (w.decal !== 'none' && !decalChanged && (o.decalColor !== w.decalColor || o.decalNumber !== w.decalNumber)) {
    add('Spray colour', PRICES.decalColor);
  }

  for (const slot of PRODUCT_SLOTS) {
    const next = w[slot];
    if (o[slot] === next || next === 'stock' || next === 'none') continue;
    const d = modById(slot, next);
    if (d) add(d.name, d.price);
  }

  const rimChanged = o.rim !== w.rim;
  if (o.rimColor !== w.rimColor && !rimChanged) add('Rim colour', PRICES.rimColor);

  if (o.beam !== w.beam) {
    const d = modById('beam', w.beam);
    if (d) add(d.name, d.price);
  }

  if (Math.abs(o.wheelSize - w.wheelSize) > 0.004) add('Wheel size', PRICES.wheelSize);
  if (o.camberFront !== w.camberFront || o.camberRear !== w.camberRear) add('Camber', PRICES.camber);
  if (Math.abs(o.rideHeight - w.rideHeight) > 0.004) add('Ride height', PRICES.rideHeight);

  if (o.underglow === null && w.underglow !== null) add('Underglow', PRICES.underglow);
  else if (o.underglow !== null && w.underglow !== null && o.underglow !== w.underglow) add('Underglow colour', PRICES.rimColor);

  for (const id of w.extras) {
    if (o.extras.includes(id)) continue;
    const d = modById('extra', id);
    if (d) add(d.name, d.price);
  }
  return lines;
}

export function loadoutCost(owned: Loadout, wanted: Loadout): number {
  return loadoutCostLines(owned, wanted).reduce((n, l) => n + l.price, 0);
}
