// 12 Gnome-inspired MOBA items (4 Weapon, 4 Vitality, 4 Spirit) + stat aggregation.
import { FLOW_BONUSES } from './config';
import type { HeroDef } from './heroes';

export type ItemCategory = 'weapon' | 'vitality' | 'spirit';
export type ItemTier = 1 | 2 | 3;

export interface ItemStats {
  weaponDmgMult?: number;
  fireRateMult?: number;
  ammoBonus?: number;
  maxHp?: number;
  hpRegen?: number;
  spiritPower?: number;
  cooldownHaste?: number; // 0.15 = 15% faster cooldowns
  moveSpeed?: number;
  staminaBonus?: number;
  bulletLifesteal?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  cost: number;
  prefabId: string;
  desc: string;
  stats: ItemStats;
}

export const ITEMS: readonly ItemDef[] = [
  // ---- Weapon (4) ----
  {
    id: 'heavy-trowel',
    name: 'Heavy Dibber',
    category: 'weapon',
    tier: 1,
    cost: 500,
    prefabId: 'dibber',
    desc: '+18% Weapon Damage, +40 Max HP',
    stats: { weaponDmgMult: 0.18, maxHp: 40 },
  },
  {
    id: 'acorn-magazine',
    name: 'Acorn Drum',
    category: 'weapon',
    tier: 1,
    cost: 500,
    prefabId: 'acorn',
    desc: '+18% Fire Rate, +4 Mag Size',
    stats: { fireRateMult: 0.18, ammoBonus: 4 },
  },
  {
    id: 'tall-eye-lens',
    name: 'Tall-Eye Sight',
    category: 'weapon',
    tier: 2,
    cost: 1250,
    prefabId: 'hand-saw',
    desc: '+34% Weapon Damage, +12% Fire Rate',
    stats: { weaponDmgMult: 0.34, fireRateMult: 0.12 },
  },
  {
    id: 'golden-secateurs',
    name: 'Golden Secateurs',
    category: 'weapon',
    tier: 3,
    cost: 2500,
    prefabId: 'pinecone-blunderbuss',
    desc: '+52% Weapon Damage, +24% Fire Rate, +12% Bullet Lifesteal',
    stats: { weaponDmgMult: 0.52, fireRateMult: 0.24, bulletLifesteal: 0.12 },
  },

  // ---- Vitality (4) ----
  {
    id: 'sprout-salve',
    name: 'Clay Glaze Patch',
    category: 'vitality',
    tier: 1,
    cost: 500,
    prefabId: 'glaze-pot',
    desc: '+130 Max HP, +4 HP/s Regen',
    stats: { maxHp: 130, hpRegen: 4 },
  },
  {
    id: 'clover-boots',
    name: 'Clover-Tread Stride',
    category: 'vitality',
    tier: 1,
    cost: 500,
    prefabId: 'feather',
    desc: '+1.2 m/s Move Speed, +1 Max Stamina, +60 Max HP',
    stats: { moveSpeed: 1.2, staminaBonus: 1, maxHp: 60 },
  },
  {
    id: 'garden-plate',
    name: 'Terracotta Buckler',
    category: 'vitality',
    tier: 2,
    cost: 1250,
    prefabId: 'round-shield',
    desc: '+280 Max HP, +7 HP/s Regen',
    stats: { maxHp: 280, hpRegen: 7 },
  },
  {
    id: 'root-tonic',
    name: 'Ancient Root Tonic',
    category: 'vitality',
    tier: 3,
    cost: 2500,
    prefabId: 'watering-can',
    desc: '+460 Max HP, +14 HP/s Regen, +15% Weapon Damage',
    stats: { maxHp: 460, hpRegen: 14, weaponDmgMult: 0.15 },
  },

  // ---- Spirit (4) ----
  {
    id: 'glaze-ampoule',
    name: 'Kiln Spark Jar',
    category: 'spirit',
    tier: 1,
    cost: 500,
    prefabId: 'clay-jar',
    desc: '+26 Spirit Power, +10% Cooldown Haste',
    stats: { spiritPower: 26, cooldownHaste: 0.1 },
  },
  {
    id: 'wind-pinwheel',
    name: 'Gale Torch',
    category: 'spirit',
    tier: 1,
    cost: 500,
    prefabId: 'torch',
    desc: '+18 Spirit Power, +1.0 m/s Speed, +1 Max Stamina',
    stats: { spiritPower: 18, moveSpeed: 1.0, staminaBonus: 1 },
  },
  {
    id: 'dewdrops-flask',
    name: 'Dewdrop Vessel',
    category: 'spirit',
    tier: 2,
    cost: 1250,
    prefabId: 'tin-pail',
    desc: '+52 Spirit Power, +18% Cooldown Haste, +100 Max HP',
    stats: { spiritPower: 52, cooldownHaste: 0.18, maxHp: 100 },
  },
  {
    id: 'sun-lantern',
    name: 'Bramble Sun-Brew',
    category: 'spirit',
    tier: 3,
    cost: 2500,
    prefabId: 'weed-killer',
    desc: '+95 Spirit Power, +26% Cooldown Haste, +18% Fire Rate',
    stats: { spiritPower: 95, cooldownHaste: 0.26, fireRateMult: 0.18 },
  },
];

export const ITEM_BY_ID = new Map<string, ItemDef>(ITEMS.map((it) => [it.id, it]));

export interface ComputedStats {
  maxHp: number;
  hpRegen: number;
  weaponDmgMult: number;
  fireRateMult: number;
  magSize: number;
  spiritPower: number;
  cooldownMult: number;
  moveSpeedBonus: number;
  maxStamina: number;
  bulletLifesteal: number;
}

export function computeHeroStats(
  hero: HeroDef,
  itemIds: readonly string[],
  level: number,
  flowTier: 0 | 1 | 2 | 3,
  hasRelicBlessing: boolean,
): ComputedStats {
  let maxHp = hero.baseHp + (level - 1) * hero.hpPerLevel;
  let hpRegen = 2.0 + (level - 1) * 0.4;
  let weaponDmgMult = 1.0 + (level - 1) * 0.055;
  let fireRateMult = 1.0;
  let ammoBonus = 0;
  let spiritPower = (level - 1) * 6;
  let cooldownHaste = 0;
  let moveSpeedBonus = hero.speedBonus;
  let maxStamina = 3;
  let bulletLifesteal = 0;

  for (const id of itemIds) {
    const it = ITEM_BY_ID.get(id);
    if (!it) continue;
    const s = it.stats;
    if (s.maxHp) maxHp += s.maxHp;
    if (s.hpRegen) hpRegen += s.hpRegen;
    if (s.weaponDmgMult) weaponDmgMult += s.weaponDmgMult;
    if (s.fireRateMult) fireRateMult += s.fireRateMult;
    if (s.ammoBonus) ammoBonus += s.ammoBonus;
    if (s.spiritPower) spiritPower += s.spiritPower;
    if (s.cooldownHaste) cooldownHaste += s.cooldownHaste;
    if (s.moveSpeed) moveSpeedBonus += s.moveSpeed;
    if (s.staminaBonus) maxStamina += s.staminaBonus;
    if (s.bulletLifesteal) bulletLifesteal += s.bulletLifesteal;
  }

  const flow = FLOW_BONUSES[flowTier];
  weaponDmgMult *= flow.dmgMult;
  fireRateMult *= flow.fireRateMult;

  if (hasRelicBlessing) {
    weaponDmgMult *= 1.2;
    spiritPower += 25;
  }

  return {
    maxHp: Math.round(maxHp),
    hpRegen,
    weaponDmgMult,
    fireRateMult,
    magSize: hero.weapon.magSize + ammoBonus,
    spiritPower,
    cooldownMult: Math.max(0.5, 1 - Math.min(0.45, cooldownHaste)),
    moveSpeedBonus,
    maxStamina,
    bulletLifesteal,
  };
}
