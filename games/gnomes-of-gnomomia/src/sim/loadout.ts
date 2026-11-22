import {
  EQUIP_SLOTS,
  type ClassId,
  type EquipSlot,
  type ItemDef,
  type Rarity,
} from '../config';
import { ITEMS } from '../content';
import { BRANCHES, CLASSES, TALENTS, TIER_GATE } from '../data/classes';
import { ATTRIBUTES, SKILLS } from '../data/core';
import { skillCap } from '../progression';
import { armorValue, weaponRange } from '../rules';
import { maxHp, maxMp, newGameState, state, type GameState } from '../state';
import { ECONOMY } from '../data/economy';
import { economySkills } from './skillFill';
import type { BuildPreset, GearTier, LoadoutSpec } from './types';

const RARITY_ORDER: Record<Rarity, number> = {
  plain: 0,
  sprouted: 1,
  blooming: 2,
  heirloom: 3,
  kilnfired: 4,
};

const PRESET_BRANCHES: Record<Exclude<BuildPreset, 'classless'>, readonly string[]> = {
  shieldwall: ['bulwark', 'hedgecutter', 'groundbreaker'],
  lawnwrecker: ['groundbreaker', 'hedgecutter', 'bulwark'],
  deadeye: ['acorneer', 'thornshot', 'trapper'],
  beastwarden: ['trapper', 'acorneer', 'thornshot'],
  sunburst: ['sun', 'rain', 'bloom'],
  groundskeeper: ['bloom', 'rain', 'sun'],
};

const DEFAULT_PRESET: Record<ClassId, Exclude<BuildPreset, 'classless'>> = {
  warden: 'shieldwall',
  slinger: 'deadeye',
  mage: 'sunburst',
};

export function totalSkillPointsForLevel(level: number): number {
  let pts = Math.max(0, level - 1);
  if (level >= 6) pts += 1;
  if (level >= 11) pts += 1;
  if (level >= 12) pts += 1;
  if (level >= 16) pts += 1;
  if (level >= 20) pts += 1;
  if (level >= 25) pts += 1;
  return Math.min(35, pts);
}

function allocateTalents(s: GameState, preset: BuildPreset): void {
  if (!s.classId || preset === 'classless') return;
  const branches = PRESET_BRANCHES[preset] ?? BRANCHES[s.classId];
  let points = totalSkillPointsForLevel(s.level);
  const branchPts: Record<string, number> = {};
  for (const b of branches) branchPts[b] = 0;
  let capstones = 0;

  for (const branch of branches) {
    if (points <= 0) break;
    const list = Object.values(TALENTS)
      .filter((t) => t.classId === s.classId && t.branch === branch)
      .sort((a, b) => a.tier - b.tier);

    let progressed = true;
    while (points > 0 && progressed) {
      progressed = false;
      for (const t of list) {
        if (points <= 0) break;
        const cur = s.talents[t.id] ?? 0;
        if (cur >= t.maxRank) continue;
        if (branchPts[branch] < TIER_GATE[t.tier]) continue;
        if (t.tier === 6 && cur === 0 && capstones >= 2) continue;
        s.talents[t.id] = cur + 1;
        branchPts[branch] += 1;
        if (t.tier === 6 && cur === 0) capstones += 1;
        points -= 1;
        progressed = true;
      }
    }
  }
  s.skillPoints = points;
}

function allowedRarities(tier: GearTier): Set<Rarity> {
  if (tier === 'zone-sprouted') return new Set(['plain', 'sprouted', 'blooming']);
  if (tier === 'zone-bis') return new Set(['plain', 'sprouted', 'blooming', 'heirloom', 'kilnfired']);
  return new Set(['plain']);
}

function isAllowedWeapon(item: ItemDef, classId: ClassId | null): boolean {
  if (item.kind !== 'weapon') return false;
  const wc = item.weaponClass ?? 'melee';
  if (classId === 'slinger') return wc === 'sling' || wc === 'blowpipe' || wc === 'thrown';
  if (classId === 'mage') return wc === 'staff' || wc === 'wand';
  return wc === 'melee';
}

function isAllowedArmor(item: ItemDef, classId: ClassId | null, slot: EquipSlot): boolean {
  if (item.slot !== slot) return false;
  if (slot === 'trinket') return item.kind === 'trinket';
  if (slot === 'offhand') {
    if (item.kind !== 'offhand') return false;
    if (item.armorType === 'shield') return classId === null || classId === 'warden';
    return true;
  }
  if (item.kind !== 'armor') return false;
  const allowed: readonly string[] = classId ? CLASSES[classId].armor : ['cloth', 'leather'];
  return allowed.includes(item.armorType ?? 'cloth');
}

function scoreWeapon(item: ItemDef, build?: BuildPreset | Record<string, number>): number {
  const [lo, hi] = weaponRange(item);
  const avg = (lo + hi) / 2;
  const rarity = RARITY_ORDER[item.rarity ?? 'plain'];
  let pref = 0;
  if (build === 'lawnwrecker' && item.hands === 2) pref += 100;
  if (build === 'shieldwall' && (item.hands ?? 1) === 1) pref += 100;
  if (build === 'deadeye' && item.weaponClass === 'sling') pref += 50;
  return pref + (item.ilvl ?? 1) * 10 + avg + rarity * 5;
}

function scoreArmor(item: ItemDef): number {
  const rarity = RARITY_ORDER[item.rarity ?? 'plain'];
  const statSum = Object.values(item.stats ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  return (item.ilvl ?? 0) * 10 + armorValue(item) + statSum * 2 + rarity * 5;
}

function selectEquipment(
  classId: ClassId | null,
  level: number,
  tier: GearTier,
  build?: BuildPreset | Record<string, number>,
): Record<EquipSlot, string | null> {
  const eq = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) eq[slot] = null;
  if (tier === 'naked') return eq;

  const maxIlvl = tier === 'undergeared' ? Math.max(1, level - 4) : level;
  const rarities = allowedRarities(tier);
  const allItems = Object.values(ITEMS);

  // Pick weapon first
  const weapons = allItems.filter(
    (it) => isAllowedWeapon(it, classId) && (it.ilvl ?? 1) <= maxIlvl && rarities.has(it.rarity ?? 'plain'),
  );
  if (weapons.length > 0) {
    weapons.sort((a, b) => scoreWeapon(b, build) - scoreWeapon(a, build));
    eq.weapon = weapons[0].id;
  } else {
    const fallback = allItems.filter((it) => isAllowedWeapon(it, classId));
    fallback.sort((a, b) => (a.ilvl ?? 1) - (b.ilvl ?? 1));
    if (fallback.length > 0) eq.weapon = fallback[0].id;
  }

  const twoHanded = eq.weapon ? ITEMS[eq.weapon]?.hands === 2 : false;

  for (const slot of EQUIP_SLOTS) {
    if (slot === 'weapon') continue;
    if (slot === 'offhand' && twoHanded) {
      eq.offhand = null;
      continue;
    }
    const candidates = allItems.filter(
      (it) => isAllowedArmor(it, classId, slot) && (it.ilvl ?? 0) <= maxIlvl && rarities.has(it.rarity ?? 'plain'),
    );
    if (candidates.length > 0) {
      candidates.sort((a, b) => scoreArmor(b) - scoreArmor(a));
      eq[slot] = candidates[0].id;
    }
  }

  return eq;
}

function defaultHealPotion(level: number): string {
  if (level >= 20 && ITEMS['ruby-draught']) return 'ruby-draught';
  if (level >= 10 && ITEMS['rose-draught']) return 'rose-draught';
  return 'red-potion';
}

function defaultManaPotion(level: number): string {
  if (level >= 20 && ITEMS['spigot-water']) return 'spigot-water';
  if (level >= 10 && ITEMS['sky-tonic']) return 'sky-tonic';
  return 'blue-potion';
}

export function buildLoadout(spec: LoadoutSpec): GameState {
  const s = newGameState();
  s.level = Math.max(1, Math.min(ECONOMY.levelCap, spec.level));
  s.classId = spec.classId === undefined ? (s.level >= 5 ? 'warden' : null) : spec.classId;

  const primary = s.classId ? CLASSES[s.classId].primary : 'strength';
  for (const a of ATTRIBUTES) {
    s.attributes[a] = 10 + (s.level - 1) + (a === primary ? s.level - 1 : 0);
  }

  // Skills: a fixed share of the cap when the spec asks for one, else what the economy sim's player of this class
  // had at this level (src/sim/skillFill.ts), so the arena and the economy sim assume the same skills.
  const fromEconomy = spec.skillFill === undefined ? economySkills(s.classId, s.level) : null;
  const filled = Math.max(5, Math.round(skillCap(s.level) * (spec.skillFill ?? 0)));
  for (const sk of SKILLS) {
    s.skills[sk.id] = { level: fromEconomy ? Math.max(5, fromEconomy[sk.id]) : filled, xp: 0 };
  }

  if (s.classId) {
    if (typeof spec.build === 'object' && spec.build !== null) {
      s.talents = { ...spec.build };
    } else {
      const preset = (spec.build as BuildPreset | undefined) ?? DEFAULT_PRESET[s.classId];
      allocateTalents(s, preset);
    }
  }

  const eq = selectEquipment(s.classId, s.level, spec.gearTier ?? 'zone-plain', spec.build);
  if (spec.equipmentOverrides) {
    for (const [slot, itemId] of Object.entries(spec.equipmentOverrides)) {
      eq[slot as EquipSlot] = itemId ?? null;
    }
  }
  s.equipment = eq;

  // Populate hotbar: 0=flare, 1=mend, 2..7=learned active class abilities
  const hotbar: (string | null)[] = ['flare', 'mend', null, null, null, null, null, null];
  if (s.classId) {
    const actives = CLASSES[s.classId].abilities.filter((a) => {
      if (a.kind === 'passive' || a.kind === 'summon') return false;
      return a.fromTalent ? (s.talents[a.fromTalent] ?? 0) >= 1 : a.level <= s.level;
    });
    for (let i = 0; i < Math.min(6, actives.length); i++) {
      hotbar[2 + i] = actives[i].id;
    }
  }
  s.hotbar = hotbar;

  // Populate potions
  s.inventory.fill(null);
  const healId = spec.potions?.heal ?? defaultHealPotion(s.level);
  const healCount = spec.potions?.healCount ?? 2;
  let invIdx = 0;
  if (healCount > 0 && ITEMS[healId]) {
    s.inventory[invIdx++] = { item: healId, count: healCount };
  }
  const manaId = spec.potions?.mana ?? defaultManaPotion(s.level);
  const manaCount = spec.potions?.manaCount ?? (s.classId === 'mage' ? 2 : 0);
  if (manaCount > 0 && ITEMS[manaId]) {
    s.inventory[invIdx++] = { item: manaId, count: manaCount };
  }

  s.hp = maxHp(s);
  s.mp = maxMp(s);
  return s;
}

export function applyLoadout(spec: LoadoutSpec): GameState {
  const built = buildLoadout(spec);
  Object.assign(state, built);
  return state;
}

export function formatLoadoutLabel(spec: LoadoutSpec): string {
  const cls = spec.classId === undefined ? (spec.level >= 5 ? 'warden' : 'classless') : (spec.classId ?? 'classless');
  const build = typeof spec.build === 'string' && spec.build !== cls ? `/${spec.build}` : '';
  const tier = spec.gearTier ?? 'zone-plain';
  return `L${spec.level} ${cls}${build} (${tier})`;
}
