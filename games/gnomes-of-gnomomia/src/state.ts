// The player's character sheet and belongings: one mutable object, saved as JSON.
import {
  ATTRIBUTES, INVENTORY_SIZE, ITEMS, SKILLS, START_ATTRIBUTE, START_EQUIPMENT, START_GOLD, START_INVENTORY, START_SKILL,
  type Attribute, type EquipSlot, type InvSlot, type SkillId,
} from './config';

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
}

export function newGameState(): GameState {
  const attributes = {} as Record<Attribute, number>;
  for (const a of ATTRIBUTES) attributes[a] = START_ATTRIBUTE;
  const skills = {} as Record<SkillId, SkillState>;
  for (const s of SKILLS) skills[s.id] = { level: START_SKILL, xp: 0 };
  const inventory: (InvSlot | null)[] = new Array(INVENTORY_SIZE).fill(null);
  START_INVENTORY.forEach((slot, i) => (inventory[i] = { ...slot }));
  const s: GameState = {
    level: 1, skillUps: 0, hp: 0, mp: 0, attributes, skills, inventory,
    equipment: { ...START_EQUIPMENT }, gold: START_GOLD, quests: {},
  };
  s.hp = maxHp(s);
  s.mp = maxMp(s);
  return s;
}

/** The one live game state. Replace its contents with Object.assign(state, loaded); never reassign the export. */
export const state: GameState = newGameState();

export function maxHp(s: GameState = state): number {
  return 20 + s.attributes.endurance + (s.level - 1) * 5;
}

export function maxMp(s: GameState = state): number {
  return 10 + s.attributes.intelligence * 2;
}

/** Sum of the armor values of everything equipped. */
export function equippedArmor(s: GameState = state): number {
  let total = 0;
  for (const id of Object.values(s.equipment)) if (id) total += ITEMS[id]?.armor ?? 0;
  return total;
}

/** The equipped weapon's ItemDef, or null when fighting with fists (1d2 blunt). */
export function equippedWeapon(s: GameState = state) {
  const id = s.equipment.weapon;
  return id ? ITEMS[id] ?? null : null;
}
