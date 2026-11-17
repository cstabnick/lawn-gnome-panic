import { checkName } from './net/textFilter';
import { generateGamertags } from './br/names';
import { WORLDS, levelInWorld, SOLO_LEVELS, CHARACTERS, type CharacterId, META_UPGRADES, SAVE_KEY, upgradeCost, type MetaSave, type MetaUpgradeId } from './config';

function defaultSave(): MetaSave {
  return { version: 1, acorns: 0, totalAcornsEarned: 0, runs: 0, bestTimeS: 0, bossKills: 0,
    name: generateGamertags(1)[0],
    character: 'gnorman',
    worldUnlocked: WORLDS.map(() => 1),
    upgrades: { sprintDuration: 0, sprintRecharge: 0, jumpHeight: 0, moveSpeed: 0, hearts: 0, magnet: 0, wisdom: 0, luck: 0 } };
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Reads the save from localStorage, filling any missing fields with defaults. */
export function loadSave(): MetaSave {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    const save = defaultSave();
    if (!parsed || typeof parsed !== 'object') return save;
    const src = parsed as Record<string, unknown>;
    const numericKeys = ['acorns', 'totalAcornsEarned', 'runs', 'bestTimeS', 'bossKills'] as const;
    for (const key of numericKeys) {
      const v = src[key];
      if (isFiniteNumber(v)) save[key] = v;
    }
    // Old saves had one count across all levels (only world 1 existed): it becomes world 1's count.
    if (isFiniteNumber(src.levelsUnlocked)) save.worldUnlocked[0] = Math.min(levelInWorld(0).count, Math.max(1, Math.floor(src.levelsUnlocked)));
    if (Array.isArray(src.worldUnlocked)) {
      WORLDS.forEach((w, i) => {
        const v = (src.worldUnlocked as unknown[])[i];
        const count = SOLO_LEVELS.filter((d) => d.world === w).length;
        if (isFiniteNumber(v)) save.worldUnlocked[i] = Math.min(count, Math.max(1, Math.floor(v)));
      });
    }
    const named = checkName(src.name);
    if (named.ok) save.name = named.name;
    if (typeof src.character === 'string' && src.character in CHARACTERS) save.character = src.character as CharacterId;
    const upgrades = src.upgrades;
    if (upgrades && typeof upgrades === 'object') {
      const up = upgrades as Record<string, unknown>;
      for (const def of META_UPGRADES) {
        const v = up[def.id];
        if (isFiniteNumber(v)) {
          save.upgrades[def.id] = Math.min(def.maxLevel, Math.max(0, Math.floor(v)));
        }
      }
    }
    return save;
  } catch {
    return defaultSave();
  }
}

/** Writes the save to localStorage. Failures (quota, private mode) are ignored. */
export function writeSave(save: MetaSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // ignore: the run still works without persistence
  }
}

/** Buys the next level of `id` if affordable and not maxed: deducts acorns, increments, writes. Returns success. */
export function tryBuy(save: MetaSave, id: MetaUpgradeId): boolean {
  const def = META_UPGRADES.find((d) => d.id === id);
  if (!def) return false;
  const level = save.upgrades[id];
  if (level >= def.maxLevel) return false;
  const cost = upgradeCost(def, level);
  if (save.acorns < cost) return false;
  save.acorns -= cost;
  save.upgrades[id] = level + 1;
  writeSave(save);
  return true;
}
