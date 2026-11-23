// Raid content checks (docs/roadmaps/gnomomia-rebalance-raids.md): every raid and reforging recipe the packs add.
// Passes trivially while no raid content exists. Run one raid with `-t raid-keep`.
import { describe, expect, it } from 'vitest';
import { ENEMIES, ITEMS, OBJECTS, RAIDS, RECIPES, SPAWNS } from './content';
import { RAID_TUNING } from './data/raidTuning';
import type { RaidDef } from './raidTypes';
import { terrain } from './terrain';
import { spawnCircleClearOfTowns } from './towns';

const SPAWN_CLEARANCE = 6;
const OPEN_ANGLES = 24;
const OPEN_RADII = [0, 4, 8, 12];
const OPEN_MIN_FRACTION = 0.97;

describe.each(Object.values(RAIDS))('raid $id', (raid: RaidDef) => {
  const enemyIds = [raid.boss, ...raid.waves.map((w) => w.enemy)];

  it('has bosses and adds that exist and never respawn or pay', () => {
    for (const id of enemyIds) {
      const def = ENEMIES[id];
      expect(def, `enemy ${id}`).toBeDefined();
      expect(def.noReward, `${id} noReward`).toBe(true);
      expect(def.respawnSeconds, `${id} respawnSeconds`).toBe(0);
    }
  });

  it('has boss summons that exist and pay nothing', () => {
    for (const move of ENEMIES[raid.boss]?.moves ?? []) {
      if (!move.summon) continue;
      const def = ENEMIES[move.summon.enemy];
      expect(def, `summon ${move.summon.enemy}`).toBeDefined();
      expect(def.noReward, `${move.summon.enemy} noReward`).toBe(true);
    }
  });

  it('has five drops of raid gear one level above the raid', () => {
    expect(raid.drops).toHaveLength(5);
    for (const id of raid.drops) {
      const item = ITEMS[id];
      expect(item, `item ${id}`).toBeDefined();
      expect(item.source, `${id} source`).toBe('raid');
      expect(item.ilvl, `${id} ilvl`).toBe(raid.level + 1);
    }
  });

  it('has a horn post in the raid zone next to the arena', () => {
    const horn = OBJECTS[raid.horn];
    expect(horn, `horn ${raid.horn}`).toBeDefined();
    expect(horn.model).toBe('horn');
    expect(horn.zone).toBe(raid.zone);
    expect(Math.hypot(horn.x - raid.x, horn.z - raid.z)).toBeLessThanOrEqual(raid.r + 4);
  });

  it('keeps the arena clear of towns', () => {
    expect(spawnCircleClearOfTowns(raid.x, raid.z, raid.r)).toBe(true);
  });

  it('keeps the arena clear of the ambient spawn circles of its zone', () => {
    for (const g of SPAWNS) {
      if (g.zone !== raid.zone) continue;
      const d = Math.hypot(g.x - raid.x, g.z - raid.z);
      expect(d, `spawn ${g.id ?? g.enemy}`).toBeGreaterThanOrEqual(g.spread + raid.r + SPAWN_CLEARANCE);
    }
  });

  it('has an open arena (no solid ground in most sample points)', () => {
    let open = 0;
    let total = 0;
    for (let a = 0; a < OPEN_ANGLES; a++) {
      const angle = (a / OPEN_ANGLES) * Math.PI * 2;
      for (const r of [...OPEN_RADII, raid.r]) {
        total++;
        if (!terrain.staticSolidAt(raid.x + Math.cos(angle) * r, raid.z + Math.sin(angle) * r)) open++;
      }
    }
    expect(open / total).toBeGreaterThanOrEqual(OPEN_MIN_FRACTION);
  });

  it('has waves inside the time limit and a minimum level at or below the raid level', () => {
    for (const w of raid.waves) expect(w.at).toBeLessThan(RAID_TUNING.maxSeconds);
    expect(raid.minLevel).toBeLessThanOrEqual(raid.level);
  });
});

describe('raid content as a whole', () => {
  it('has a raid registry (an empty one is fine until raid content lands)', () => {
    expect(typeof RAIDS).toBe('object');
    expect(typeof RECIPES).toBe('object');
  });

  it('checks every reforging recipe: anvil station, real items, craft-only output, gold', () => {
    for (const recipe of Object.values(RECIPES)) {
      const station = OBJECTS[recipe.station];
      expect(station, `station ${recipe.station} (${recipe.id})`).toBeDefined();
      expect(station.model, `${recipe.id} station model`).toBe('anvil');
      expect(ITEMS[recipe.makes], `${recipe.id} makes`).toBeDefined();
      expect(ITEMS[recipe.makes].source, `${recipe.id} makes source`).toBe('craft');
      for (const n of recipe.needs) expect(ITEMS[n.item], `${recipe.id} needs ${n.item}`).toBeDefined();
      expect(recipe.gold, `${recipe.id} gold`).toBeGreaterThan(0);
    }
  });

  it('reforges every raid drop, except those of the highest-level raid', () => {
    const raids = Object.values(RAIDS);
    if (raids.length === 0) return;
    const top = Math.max(...raids.map((r) => r.level));
    const needed = new Set(Object.values(RECIPES).flatMap((r) => r.needs.map((n) => n.item)));
    const orphans = raids
      .filter((r) => r.level < top)
      .flatMap((r) => r.drops)
      .filter((id) => !needed.has(id));
    expect(orphans).toEqual([]);
  });
});
