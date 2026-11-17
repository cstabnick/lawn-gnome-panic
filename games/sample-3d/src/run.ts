import { CHARACTERS } from './config';
import { PASSIVE_DEFS, WEAPON_DEFS, type MetaSave, type PassiveId, type PlayerStats, type RunState, type UpgradeChoice, type WeaponId, type WorldTheme } from './config';
import { computeStats } from './stats';
/** A fresh run: level 1, slingshot level 1, full hearts, rerolls from stats. */
export function createRun(save: MetaSave): RunState {
  const s = computeStats(save, null);
  return { level: 1, xp: 0, xpToNext: xpToNext(1), hearts: s.maxHearts, invulnS: 0, kills: 0, acorns: 0, elapsedS: 0,
    weapons: { ...CHARACTERS[save.character].startingWeapons }, passives: {}, rerollsLeft: s.rerolls, bossSpawned: false, bossDefeated: false };
}
/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number { return Math.round(5 + 4 * level * Math.sqrt(level)); }
/** Adds XP, levelling up as many times as it covers. Returns the number of level-ups gained. */
export function addXp(run: RunState, amount: number): number {
  run.xp += amount;
  let count = 0;
  while (run.xp >= run.xpToNext) {
    run.xp -= run.xpToNext;
    run.level += 1;
    run.xpToNext = xpToNext(run.level);
    count++;
  }
  return count;
}
/** Up to `count` distinct choices; a heal card if nothing else is available. Desert-only powers appear only in the desert. */
export function rollChoices(run: RunState, count: number, theme: WorldTheme = 'lawn'): UpgradeChoice[] {
  const pool: UpgradeChoice[] = [];
  for (const id of Object.keys(WEAPON_DEFS) as WeaponId[]) {
    const def = WEAPON_DEFS[id];
    if (def.desertOnly && theme !== 'desert') continue;
    const lvl = run.weapons[id] ?? 0;
    const max = def.levelText.length;
    if (lvl < max) {
      pool.push({ kind: 'weapon', id, nextLevel: lvl + 1, title: def.name, description: def.levelText[lvl], isNew: lvl === 0 });
    }
  }
  for (const id of Object.keys(PASSIVE_DEFS) as PassiveId[]) {
    const def = PASSIVE_DEFS[id];
    if (def.desertOnly && theme !== 'desert') continue;
    const lvl = run.passives[id] ?? 0;
    if (lvl < def.maxLevel) {
      pool.push({ kind: 'passive', id, nextLevel: lvl + 1, title: def.name, description: `${def.effect}. ${def.blurb}`, isNew: lvl === 0 });
    }
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  if (pool.length === 0) {
    return [{ kind: 'heal', id: 'heal', nextLevel: 0, title: 'Mulch Sandwich', description: 'Restore 1 heart. Delicious. Mostly mulch.', isNew: false }];
  }
  return pool.slice(0, count);
}
export function applyChoice(run: RunState, choice: UpgradeChoice, stats: PlayerStats): void {
  if (choice.kind === 'weapon') {
    run.weapons[choice.id as WeaponId] = choice.nextLevel;
  } else if (choice.kind === 'passive') {
    run.passives[choice.id as PassiveId] = choice.nextLevel;
  } else {
    run.hearts = Math.min(stats.maxHearts, run.hearts + 1);
  }
}
