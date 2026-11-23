// Level and gear rules for Wayfarers (AI adventurer gnomes), pure. Used by src/companions.ts (local gnomes) and
// src/net/mmo.ts (other players' gnomes), which must get identical loadouts from the same (class, level, personality,
// seed). Keep it deterministic: no Math.random, no state, no three.js.
import { EQUIP_SLOTS, type ClassId, type EquipSlot, type ItemDef, type Rarity } from './config';
import { ITEMS } from './content';
import { CLASSES } from './data/classes';
import { ECONOMY } from './data/economy';
import { mulberry32 } from './data/interiors';
import { PERSONALITY_ORDER, type CompanionPersonalityId } from './companionLogic';

/** A level suits a zone with band [lo, hi] when lo - LEVEL_BELOW_BAND <= level <= hi + LEVEL_ABOVE_BAND. */
export const LEVEL_BELOW_BAND = 2;
export const LEVEL_ABOVE_BAND = 3;

/** -1, 0 or +1 by companion id ((id % 3) - 1, safe for negative ids), so Wayfarers on one quest differ. */
export function levelOffset(id: number): number {
  return (((id % 3) + 3) % 3) - 1;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Level while doing a quest of level questLevel: questLevel + levelOffset(id), clamped to 1..ECONOMY.levelCap. */
export function questLevelFor(questLevel: number, id: number): number {
  return clamp(questLevel + levelOffset(id), 1, ECONOMY.levelCap);
}

/** Level of a Wayfarer that belongs in a zone of band [lo, hi] with no quest: clamp(playerLevel, lo, hi) +
 * levelOffset(id), then clamped to [max(1, lo), min(ECONOMY.levelCap, hi + 1)]. */
export function zoneLevelFor(band: readonly [number, number], playerLevel: number, id: number): number {
  const [lo, hi] = band;
  const raw = clamp(playerLevel, lo, hi) + levelOffset(id);
  return clamp(raw, Math.max(1, lo), Math.min(ECONOMY.levelCap, hi + 1));
}

/** True when level suits the band (see LEVEL_BELOW_BAND / LEVEL_ABOVE_BAND). */
export function levelFitsZone(level: number, band: readonly [number, number]): boolean {
  return level >= band[0] - LEVEL_BELOW_BAND && level <= band[1] + LEVEL_ABOVE_BAND;
}

export interface GearStyle {
  /** Highest rarity worn. */
  maxRarity: Rarity;
  /** Items are at most level - lag (min 1). */
  lag: number;
  /** 0..1: chance each slot other than weapon and body is left empty. */
  gapChance: number;
  /** Never fills the head slot, so the coloured hat stays visible. */
  keepsHat: boolean;
}

export const GEAR_STYLE: Record<CompanionPersonalityId, GearStyle> = {
  tryhard:    { maxRarity: 'heirloom',  lag: 0, gapChance: 0,    keepsHat: false },
  lorehound:  { maxRarity: 'blooming',  lag: 1, gapChance: 0.15, keepsHat: true },
  lootgoblin: { maxRarity: 'kilnfired', lag: 1, gapChance: 0.1,  keepsHat: false },
  wanderer:   { maxRarity: 'sprouted',  lag: 3, gapChance: 0.4,  keepsHat: true },
  helper:     { maxRarity: 'blooming',  lag: 0, gapChance: 0.05, keepsHat: false },
};

export const RARITY_RANK: Record<Rarity, number> = { plain: 0, sprouted: 1, blooming: 2, heirloom: 3, kilnfired: 4 };

/** Items more than this many levels under the gear cap are only used when nothing newer fits. */
export const GEAR_WINDOW = 8;

/** Same rule as sim/loadout.ts isAllowedWeapon: kind 'weapon'; weaponClass (default 'melee') must be
 * sling/blowpipe/thrown for slinger, staff/wand for mage, melee for warden. */
export function companionWeaponAllowed(item: ItemDef, classId: ClassId): boolean {
  if (item.kind !== 'weapon') return false;
  const wc = item.weaponClass ?? 'melee';
  if (classId === 'slinger') return wc === 'sling' || wc === 'blowpipe' || wc === 'thrown';
  if (classId === 'mage') return wc === 'staff' || wc === 'wand';
  return wc === 'melee';
}

/** Same rule as sim/loadout.ts isAllowedArmor with a non-null class: item.slot === slot; trinket slot needs kind
 * 'trinket'; offhand slot needs kind 'offhand', and a shield (armorType 'shield') only for warden; other slots
 * need kind 'armor' with armorType (default 'cloth') in CLASSES[classId].armor. */
export function companionArmorAllowed(item: ItemDef, classId: ClassId, slot: EquipSlot): boolean {
  if (item.slot !== slot) return false;
  if (slot === 'trinket') return item.kind === 'trinket';
  if (slot === 'offhand') {
    if (item.kind !== 'offhand') return false;
    if (item.armorType === 'shield') return classId === 'warden';
    return true;
  }
  if (item.kind !== 'armor') return false;
  const allowed: readonly string[] = CLASSES[classId].armor;
  return allowed.includes(item.armorType ?? 'cloth');
}

/** A deterministic loadout. Algorithm (keep exactly, both clients must agree):
 *  rng = mulberry32((seed + 1) * 7919 + level * 31 + CLASS_WIRE.indexOf(classId));
 *  style = GEAR_STYLE[personality]; cap = Math.max(1, level - style.lag); lo = cap - GEAR_WINDOW;
 *  eligible(it) = !it.questItem && RARITY_RANK[it.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity] && (it.ilvl ?? 1) <= cap;
 *  pick(cands): pool = cands with (ilvl ?? 1) >= lo, or all cands when that is empty; sort by score descending
 *    (score = (ilvl ?? 1) * 10 + RARITY_RANK[rarity ?? 'plain'] * 5; ties by id ascending);
 *    return pool[Math.floor(rng() * Math.min(3, pool.length))].id, or null when pool is empty (no rng call then).
 *  1. weapon = pick(items allowed by companionWeaponAllowed and eligible); if null, the allowed weapon with the
 *     lowest ilvl (ties by id), ignoring eligible; null if the class has none.
 *  2. twoHanded = weapon !== null && items[weapon].hands === 2.
 *  3. for slot of EQUIP_SLOTS in order, skipping 'weapon':
 *     offhand && twoHanded -> null; head && style.keepsHat -> null;
 *     else if slot !== 'body' && rng() < style.gapChance -> null;
 *     else pick(items allowed by companionArmorAllowed(it, classId, slot) and eligible).
 *  Iterate items as Object.values(items) sorted by id, so the order never depends on object key order. */
export function companionEquipment(
  classId: ClassId, level: number, personality: CompanionPersonalityId, seed: number,
  items: Record<string, ItemDef> = ITEMS,
): Record<EquipSlot, string | null> {
  const rng = mulberry32((seed + 1) * 7919 + level * 31 + CLASS_WIRE.indexOf(classId));
  const style = GEAR_STYLE[personality];
  const cap = Math.max(1, level - style.lag);
  const lo = cap - GEAR_WINDOW;
  const sorted = Object.values(items).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const eligible = (it: ItemDef): boolean =>
    !it.questItem
    && RARITY_RANK[it.rarity ?? 'plain'] <= RARITY_RANK[style.maxRarity]
    && (it.ilvl ?? 1) <= cap;

  const pick = (cands: ItemDef[]): string | null => {
    const inWindow = cands.filter((it) => (it.ilvl ?? 1) >= lo);
    const pool = inWindow.length > 0 ? inWindow : cands;
    if (pool.length === 0) return null;
    const score = (it: ItemDef): number => (it.ilvl ?? 1) * 10 + RARITY_RANK[it.rarity ?? 'plain'] * 5;
    pool.sort((a, b) => (score(b) - score(a)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return pool[Math.floor(rng() * Math.min(3, pool.length))].id;
  };

  const eq = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) eq[slot] = null;

  // 1. Weapon.
  eq.weapon = pick(sorted.filter((it) => companionWeaponAllowed(it, classId) && eligible(it)));
  if (eq.weapon === null) {
    const fallback = sorted.filter((it) => companionWeaponAllowed(it, classId));
    if (fallback.length > 0) {
      fallback.sort((a, b) => (a.ilvl ?? 1) - (b.ilvl ?? 1));
      eq.weapon = fallback[0].id;
    }
  }

  // 2. Two-handed weapons leave the offhand empty.
  const twoHanded = eq.weapon !== null && items[eq.weapon]?.hands === 2;

  // 3. Armour and trinkets.
  for (const slot of EQUIP_SLOTS) {
    if (slot === 'weapon') continue;
    if (slot === 'offhand' && twoHanded) { eq[slot] = null; continue; }
    if (slot === 'head' && style.keepsHat) { eq[slot] = null; continue; }
    if (slot !== 'body' && rng() < style.gapChance) { eq[slot] = null; continue; }
    eq[slot] = pick(sorted.filter((it) => companionArmorAllowed(it, classId, slot) && eligible(it)));
  }
  return eq;
}

/** Max hp: base = 16 + 5 * level; x1.25 for warden; then x(1 + 0.04 * n) where n counts filled slots among
 * head, body, legs, hands, feet, offhand; Math.round. (With no gear this equals today's companion hp.) */
export function companionMaxHp(level: number, classId: ClassId, equipment: Record<EquipSlot, string | null>): number {
  let hp = 16 + 5 * level;
  if (classId === 'warden') hp *= 1.25;
  const slots: EquipSlot[] = ['head', 'body', 'legs', 'hands', 'feet', 'offhand'];
  const n = slots.filter((s) => equipment[s] !== null).length;
  return Math.round(hp * (1 + 0.04 * n));
}

/** One hit: Math.max(1, Math.round((1 + 0.4 * level) * (equipment.weapon ? 1 : 0.7))). */
export function companionHitDamage(level: number, equipment: Record<EquipSlot, string | null>): number {
  return Math.max(1, Math.round((1 + 0.4 * level) * (equipment.weapon ? 1 : 0.7)));
}

/** Wire indexes for the companion pose (src/net/protocol.ts). */
export const CLASS_WIRE: readonly ClassId[] = ['warden', 'slinger', 'mage'];
export function classToWire(classId: ClassId): number {
  return CLASS_WIRE.indexOf(classId);
}
export function classFromWire(n: number): ClassId | null {
  return Number.isInteger(n) && n >= 0 && n < CLASS_WIRE.length ? CLASS_WIRE[n] : null;
}
export function personalityToWire(p: CompanionPersonalityId): number {
  return PERSONALITY_ORDER.indexOf(p);
}
export function personalityFromWire(n: number): CompanionPersonalityId | null {
  return Number.isInteger(n) && n >= 0 && n < PERSONALITY_ORDER.length ? PERSONALITY_ORDER[n] : null;
}
