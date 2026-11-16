// Saves the character to localStorage as one JSON blob, and loads it back. Version 2 saves; version 1 saves are migrated on load.
import { EQUIP_SLOTS, INVENTORY_SIZE, SAVE_KEY, START_SKILL, type Attribute, type EquipSlot, type InvSlot, type ZoneId } from './config';
import { ATTRIBUTES } from './data/core';
import { ZONES } from './content';
import { ORIGINS } from './data/layout';
import { player } from './player';
import { maxHp, maxMp, newGameState, state, type GameState, type QuestProgress, type SkillState } from './state';
import { loadZone } from './zones';

/** The key version 1 saves were written under. Left in place after migration. */
const V1_KEY = 'gnomomia.save.v1';

interface SaveData {
  v: 2;
  state: Partial<GameState>;
  zone: ZoneId;
  x: number;
  z: number;
  /** 1 when x and z are world positions (the open world). Older saves hold zone-local positions: loadGame moves them. */
  w?: 1;
}

interface SaveDataV1 {
  v: 1;
  state: Record<string, unknown>;
  x: number;
  z: number;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function readText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Checks the shape of a parsed version 2 save. Returns it typed, or null if it is broken. */
function parseSave(raw: unknown): SaveData | null {
  if (!isObject(raw)) return null;
  const d = raw as Partial<SaveData>;
  if (d.v !== 2) return null;
  if (typeof d.state !== 'object' || d.state === null) return null;
  const inventory = (d.state as Partial<GameState>).inventory;
  if (!Array.isArray(inventory) || inventory.length !== INVENTORY_SIZE) return null;
  if (typeof d.zone !== 'string' || !Object.prototype.hasOwnProperty.call(ZONES, d.zone)) return null;
  if (!Number.isFinite(d.x) || !Number.isFinite(d.z)) return null;
  return d as SaveData;
}

/** Checks the shape of a parsed version 1 save. Returns it typed, or null if it is broken. */
function parseSaveV1(raw: unknown): SaveDataV1 | null {
  if (!isObject(raw)) return null;
  const d = raw as Partial<SaveDataV1>;
  if (d.v !== 1) return null;
  if (!isObject(d.state)) return null;
  const inventory = d.state.inventory;
  if (!Array.isArray(inventory) || inventory.length !== INVENTORY_SIZE) return null;
  if (!Number.isFinite(d.x) || !Number.isFinite(d.z)) return null;
  return d as SaveDataV1;
}

/** Builds a version 2 state from a version 1 save's state (see combat.md §12). */
function migrateV1(old: Record<string, unknown>): GameState {
  const s = newGameState();

  // Character level stays. XP restarts at the level's start; each level after the first is one skill point.
  const level = Math.max(1, Math.floor(num(old.level, 1)));
  s.level = level;
  s.xp = 0;
  s.skillPoints = level - 1;
  s.classId = null;
  s.zone = 'mossbottom';

  // Skills: renamed ones keep their level and xp; new ones start at 5. Every level is capped at 5 + 4 × level.
  const cap = 5 + 4 * level;
  const oldSkills = isObject(old.skills) ? old.skills : {};
  const fromOld = (key: string): SkillState => {
    const o = isObject(oldSkills[key]) ? oldSkills[key] : {};
    return { level: num(o.level, START_SKILL), xp: num(o.xp, 0) };
  };
  const clamp = (sk: SkillState): SkillState => ({ level: Math.min(cap, Math.max(0, sk.level)), xp: sk.xp });
  s.skills = {
    blade: clamp(fromOld('blade')),
    blunt: clamp(fromOld('blunt')),
    block: clamp(fromOld('block')),
    toughness: clamp(fromOld('armor')),
    sun: clamp(fromOld('destruction')),
    bloom: clamp(fromOld('restoration')),
    marksmanship: clamp({ level: 5, xp: 0 }),
    rain: clamp({ level: 5, xp: 0 }),
  };

  const oldAttributes = isObject(old.attributes) ? old.attributes : {};
  for (const a of ATTRIBUTES) s.attributes[a as Attribute] = num(oldAttributes[a], s.attributes[a as Attribute]);

  // Equipment: the shield becomes the off-hand; every slot the old save did not have is empty.
  const oldEquipment = isObject(old.equipment) ? old.equipment : {};
  const equipment = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) {
    const item = oldEquipment[slot];
    equipment[slot] = typeof item === 'string' ? item : null;
  }
  if (equipment.offhand === null && typeof oldEquipment.shield === 'string') equipment.offhand = oldEquipment.shield;
  s.equipment = equipment;

  // Kept as they were.
  s.inventory = old.inventory as (InvSlot | null)[];
  s.gold = num(old.gold, s.gold);
  s.quests = (isObject(old.quests) ? old.quests : {}) as Record<string, QuestProgress>;
  s.hp = Math.min(num(old.hp, maxHp(s)), maxHp(s));
  s.mp = Math.min(num(old.mp, maxMp(s)), maxMp(s));
  return s;
}

function writeSave(x: number, z: number): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, w: 1, state, zone: state.zone, x, z }));
  } catch {
    // Storage full or blocked: the game keeps running without a save.
  }
}

export function saveGame(): void {
  if (player.dead) return;
  writeSave(player.position.x, player.position.z);
}

/** Loads a save into `state` and places the player. False if there is none (or it is broken). */
export function loadGame(): boolean {
  const text = readText(SAVE_KEY);
  if (text) {
    const data = parseSave(parseJson(text));
    if (!data) return false;

    const fresh = newGameState();
    const loaded = data.state;
    Object.assign(state, fresh, loaded);
    // Merge nested records so fields added in later versions keep their defaults.
    state.attributes = { ...fresh.attributes, ...loaded.attributes };
    state.skills = { ...fresh.skills, ...loaded.skills };
    state.equipment = { ...fresh.equipment, ...loaded.equipment };
    state.flags = { ...fresh.flags, ...loaded.flags };
    state.talents = { ...fresh.talents, ...loaded.talents };
    state.objects = { ...fresh.objects, ...loaded.objects };
    state.booksRead = Array.isArray(loaded.booksRead) ? loaded.booksRead.filter((b) => typeof b === 'string') : [];
    state.hotbar = Array.isArray(loaded.hotbar) && loaded.hotbar.length === 8 ? loaded.hotbar : fresh.hotbar;
    state.zone = data.zone;

    const shift = data.w === 1 ? { x: 0, z: 0 } : ORIGINS[data.zone];
    loadZone(state.zone, data.x + shift.x, data.z + shift.z);
    return true;
  }

  // No version 2 save: migrate a version 1 save if there is one. The v1 key is left in place.
  const v1Text = readText(V1_KEY);
  if (!v1Text) return false;
  const old = parseSaveV1(parseJson(v1Text));
  if (!old) return false;

  Object.assign(state, migrateV1(old.state));
  writeSave(old.x, old.z);
  loadZone(state.zone, old.x, old.z);
  return true;
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage blocked: nothing to delete.
  }
}
