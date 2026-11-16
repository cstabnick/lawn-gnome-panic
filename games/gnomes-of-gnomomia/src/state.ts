// The player's character sheet and belongings: one mutable object, saved as JSON.
import {
  INVENTORY_SIZE, START_ATTRIBUTE, START_GOLD, START_SKILL,
  type Attribute, type ClassId, type EquipSlot, type InvSlot, type SkillId, type StatKey, type ZoneId,
} from './config';
import { ATTRIBUTES, SKILLS, START_EQUIPMENT, START_INVENTORY } from './data/core';
import { bus } from './events';
import { ITEMS } from './content';
import { armorValue } from './rules';

export interface SkillState {
  level: number;
  /** Uses toward the next level; the level rises when xp >= skillXpToNext(level) (rules.ts). */
  xp: number;
}

export interface QuestProgress {
  /** Index into QuestDef.stages. */
  stage: number;
  /** Kills counted for a 'kill' objective on this stage. */
  count: number;
  done: boolean;
}

export interface GameState {
  level: number;
  /** Skill increases since the last character level (TUNING.skillUpsPerLevel to level up). */
  skillUps: number;
  /** Experience toward the next character level (progression.ts). */
  xp: number;
  /** The class the player picked, or null before the choice. */
  classId: ClassId | null;
  /** Unspent talent points. */
  skillPoints: number;
  /** Talent id -> ranks learned. */
  talents: Record<string, number>;
  /** Story flags set by dialogue and objects: name -> value. */
  flags: Record<string, string>;
  /** Zone the player is in. */
  zone: ZoneId;
  /** World object id -> number of times used. */
  objects: Record<string, number>;
  /** Hotbar slots: an ability id, or null when empty. Always 8 entries. */
  hotbar: (string | null)[];
  hp: number;
  mp: number;
  attributes: Record<Attribute, number>;
  skills: Record<SkillId, SkillState>;
  /** Exactly INVENTORY_SIZE entries; null = empty slot. */
  inventory: (InvSlot | null)[];
  equipment: Record<EquipSlot, string | null>;
  gold: number;
  /** Quests the player has started, by quest id. Absent = never started. */
  quests: Record<string, QuestProgress>;
  /** Lore the player has read (BOOKS ids), in the order first read. The lore journal lists these. */
  booksRead: string[];
}

export function newGameState(): GameState {
  const attributes = {} as Record<Attribute, number>;
  for (const a of ATTRIBUTES) attributes[a] = START_ATTRIBUTE;
  const skills = {} as Record<SkillId, SkillState>;
  for (const s of SKILLS) skills[s.id] = { level: START_SKILL, xp: 0 };
  const inventory: (InvSlot | null)[] = new Array(INVENTORY_SIZE).fill(null);
  START_INVENTORY.forEach((slot, i) => (inventory[i] = { ...slot }));
  const s: GameState = {
    level: 1, skillUps: 0, xp: 0, classId: null, skillPoints: 0, talents: {}, flags: {}, zone: 'mossbottom', objects: {},
    hotbar: ['flare', 'mend', null, null, null, null, null, null],
    hp: 0, mp: 0, attributes, skills, inventory,
    equipment: { ...START_EQUIPMENT }, gold: START_GOLD, quests: {}, booksRead: [],
  };
  s.hp = maxHp(s);
  s.mp = maxMp(s);
  return s;
}

/** The one live game state. Replace its contents with Object.assign(state, loaded); never reassign the export. */
export const state: GameState = newGameState();

/** Sum of an item stat across all equipped slots. */
export function equippedStat(key: StatKey, s: GameState = state): number {
  let total = 0;
  for (const id of Object.values(s.equipment)) {
    if (id) total += ITEMS[id]?.stats?.[key] ?? 0;
  }
  return total;
}

/** Base attribute plus equipped item bonuses. */
export function effectiveAttribute(attr: Attribute, s: GameState = state): number {
  return s.attributes[attr] + equippedStat(attr, s);
}

/** Endurance from levels is already in the 12 per level, so only Endurance above that adds. Wardens get x1.25. */
export function maxHp(s: GameState = state): number {
  const extraEndurance = Math.max(0, effectiveAttribute('endurance', s) - 10 - (s.level - 1));
  const base = 40 + 12 * (s.level - 1) + 2 * extraEndurance;
  const clay = 1 + 0.04 * (s.talents['warden-thick-clay'] ?? 0);
  return Math.round(base * (s.classId === 'warden' ? 1.25 : 1) * clay);
}

export function maxMp(s: GameState = state): number {
  return 20 + 4 * (effectiveAttribute('intelligence', s) - 10) + 3 * s.level;
}

/** Sets a story flag, then tells the listeners and the panels. */
export function setFlag(flag: string, value: string): void {
  state.flags[flag] = value;
  bus.emit('flag-set', { flag, value });
  bus.emit('changed', {});
}

/** Opens a book in the reader and records it in the lore journal. Unknown ids are ignored by the reader. */
export function readBook(book: string): void {
  const first = !state.booksRead.includes(book);
  if (first) state.booksRead.push(book);
  bus.emit('book-open', { book, first });
  if (first) bus.emit('changed', {});
}

/** Sum of the armor values of everything equipped. */
export function equippedArmor(s: GameState = state): number {
  let total = 0;
  for (const id of Object.values(s.equipment)) if (id) total += ITEMS[id] ? armorValue(ITEMS[id]) : 0;
  return total;
}

/** The equipped weapon's ItemDef, or null when fighting with fists (1d2 blunt). */
export function equippedWeapon(s: GameState = state) {
  const id = s.equipment.weapon;
  return id ? ITEMS[id] ?? null : null;
}
