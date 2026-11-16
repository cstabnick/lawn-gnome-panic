// Pure RPG rules (dice, to-hit, mitigation, weapon and armor numbers, enemy stats). Formulas from docs/design/gnomomia/combat.md.
// No imports from state or events: this module stays a pure leaf.
import type { DamageType, EnemyDef, EquipSlot, Family, ItemDef, Rank, Rarity } from './config';

/** Sum of `count` dice with `sides` faces each. */
export function rollDice(count: number, sides: number, rng: () => number = Math.random): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(rng() * sides) + 1;
  return total;
}

/** Old RuneScape-style attribute bonus. Kept for ui/panels.ts; combat uses power() instead. */
export function attributeMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

/** Old skill bonus. Kept for compatibility; combat uses accuracyFromSkill() and damageFromSkill() instead. */
export function skillBonus(level: number): number {
  return Math.floor(level / 5);
}

/** Uses of a skill needed to reach the next level. */
export function skillXpToNext(level: number): number {
  return 2 + Math.floor(level / 2);
}

/** Attribute power multiplier: 10 is 1.0. P(a) = 1 + (a - 10) / 40. */
export function power(a: number): number {
  return 1 + (a - 10) / 40;
}

/** Accuracy granted by a skill level: floor(level / 20). */
export function accuracyFromSkill(level: number): number {
  return Math.floor(level / 20);
}

/** Damage bonus (fraction) granted by a skill level: level / 400. */
export function damageFromSkill(level: number): number {
  return level / 400;
}

/**
 * d20 to-hit roll. Natural 20 always hits and crits; natural 1 always misses;
 * otherwise a hit needs roll + accuracy >= 9 + min(defense, 6). A hit crits when its roll is >= critRange.
 */
export function attackRoll(
  accuracy: number,
  defense: number,
  critRange = 20,
  rng: () => number = Math.random,
): { hit: boolean; crit: boolean; roll: number } {
  const roll = rollDice(1, 20, rng);
  const hit = roll === 20 || (roll !== 1 && roll + accuracy >= 9 + Math.min(defense, 6));
  const crit = hit && roll >= critRange;
  return { hit, crit, roll };
}

/** Damage reduction from armor: A / (A + 40 + 20 L), capped at 60%. L is the attacker's level. */
export function mitigation(armor: number, attackerLevel: number): number {
  if (armor <= 0) return 0;
  return Math.min(0.6, armor / (armor + 40 + 20 * attackerLevel));
}

const RARITY_BONUS: Record<Rarity, number> = { plain: 0, sprouted: 0.08, blooming: 0.16, heirloom: 0.25, kilnfired: 0.35 };

/** [min, max] damage of a weapon, from its item level. damageOverride wins. */
export function weaponRange(item: ItemDef): [number, number] {
  if (item.damageOverride) return [item.damageOverride[0], item.damageOverride[1]];
  let avg = 3 + 2 * (item.ilvl ?? 1);
  if (item.hands === 2) avg *= 1.4;
  if (item.weaponClass === 'blowpipe') avg *= 0.8;
  avg *= 1 + RARITY_BONUS[item.rarity ?? 'plain'];
  return [Math.max(1, Math.round(0.6 * avg)), Math.max(1, Math.round(1.4 * avg))];
}

const ARMOR_TYPE_FACTOR: Record<NonNullable<ItemDef['armorType']>, number> = { cloth: 0.11, leather: 0.25, plate: 0.55, shield: 0.25 };
const SLOT_SHARE: Partial<Record<EquipSlot, number>> = { body: 0.4, legs: 0.2, head: 0.15, hands: 0.15, feet: 0.1 };

/** Armor value of a piece of armor or an offhand; 0 for everything else. `armor` wins when set. */
export function armorValue(item: ItemDef): number {
  if (item.kind !== 'armor' && item.kind !== 'offhand') return 0;
  if (item.armor !== undefined) return item.armor;
  const typeFactor = ARMOR_TYPE_FACTOR[item.armorType ?? 'cloth'];
  const share = item.armorType === 'shield' ? 1 : (item.slot ? SLOT_SHARE[item.slot] ?? 1 : 1);
  return (40 + 20 * (item.ilvl ?? 0)) * typeFactor * share;
}

function row(slash: number, crush: number, pierce: number, sun: number, rain: number, bloom: number): Record<DamageType, number> {
  return { slash, crush, pierce, sun, rain, bloom };
}

/** Weakness and resistance per family (combat.md section 7). */
const TYPE_TABLE: Record<Family, Record<DamageType, number>> = {
  soft: row(1.25, 0.75, 1, 1.5, 0.5, 1),
  shelled: row(0.75, 1.25, 0.75, 1, 1, 1),
  furred: row(1, 1, 1, 1.25, 1, 1),
  winged: row(1, 0.75, 1.5, 1, 1.25, 1),
  plant: row(1.25, 1, 0.75, 1.5, 0.5, 0),
  fired: row(0.75, 1.25, 0.75, 0.5, 1.25, 1),
  unfired: row(1.25, 1, 1, 2, 0.75, 1),
  metal: row(0.5, 1, 0.5, 0.75, 1.5, 1),
};

/** Damage multiplier for a damage type against a family. */
export function typeMultiplier(type: DamageType, family: Family): number {
  return TYPE_TABLE[family][type];
}

const RANK_HP: Record<Rank, number> = { trivial: 0.6, normal: 1, elite: 2.5, miniboss: 4, boss: 6, worldboss: 12, final: 1 };
const RANK_DAMAGE: Record<Rank, number> = { trivial: 0.6, normal: 1, elite: 1.3, miniboss: 1.4, boss: 1.5, worldboss: 1.6, final: 1 };
const RANK_ACCURACY: Record<Rank, number> = { trivial: 1, normal: 2, elite: 4, miniboss: 4, boss: 5, worldboss: 5, final: 5 };
/** Armor as a fraction of (40 + 20 L), by family. */
const FAMILY_ARMOR: Record<Family, number> = { soft: 0, shelled: 0.55, metal: 0.9, furred: 0.11, winged: 0.11, plant: 0.11, fired: 0.11, unfired: 0.11 };

/** Expected hit of a level-appropriate Plain weapon at level L: (3 + 2L)(1 + (L - 1) / 20). */
export function avgHit(level: number): number {
  return (3 + 2 * level) * (1 + (level - 1) / 20);
}

/** Combat numbers of an enemy. The only place EnemyDef's combat fields are read. */
export function enemyStats(def: EnemyDef): {
  hp: number;
  damage: [number, number];
  armor: number;
  accuracy: number;
  defense: number;
} {
  const L = def.level;
  const hp = def.hpOverride ?? Math.max(1, Math.round(avgHit(L) * Math.min(5, 3 + L / 5) * RANK_HP[def.rank]));
  let damage: [number, number];
  if (def.damageOverride) {
    damage = [def.damageOverride[0], def.damageOverride[1]];
  } else {
    const avg = (3 + 1.7 * L) * RANK_DAMAGE[def.rank];
    damage = [Math.max(1, Math.round(avg * 0.7)), Math.max(1, Math.round(avg * 1.3))];
  }
  return {
    hp,
    damage,
    armor: FAMILY_ARMOR[def.family] * (40 + 20 * L),
    accuracy: RANK_ACCURACY[def.rank],
    defense: (def.defense ?? 0) + (def.family === 'winged' ? 2 : 0),
  };
}
