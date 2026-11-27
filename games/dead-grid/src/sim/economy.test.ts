import { describe, expect, it } from 'vitest';
import { cloneLootTable, createSim, DEFAULT_LOOT_TABLE, DEFAULT_PARAMS } from './bridge';

describe('Dead Grid Economy & Loot Tables', () => {
  it('scales generated world loot according to custom per-biome lootTable multipliers', async () => {
    const richTable = cloneLootTable(DEFAULT_LOOT_TABLE);
    richTable[10] = { food: 2.0, water: 2.0, gear: 3.0, respawn: 1.0 }; // Military Base

    const zeroTable = cloneLootTable(DEFAULT_LOOT_TABLE);
    zeroTable[10] = { food: 0.0, water: 0.0, gear: 0.0, respawn: 0.0 };

    const simRich = await createSim(1337, {
      ...DEFAULT_PARAMS,
      initialHumans: 100,
      initialZombies: 100,
      initialAnimals: 100,
      lootTable: richTable,
    });
    const simZero = await createSim(1337, {
      ...DEFAULT_PARAMS,
      initialHumans: 100,
      initialZombies: 100,
      initialAnimals: 100,
      lootTable: zeroTable,
    });

    let richGear = 0;
    let zeroGear = 0;
    for (let i = 0; i < 512 * 512; i++) {
      if (simRich.tileType[i] === 10) richGear += simRich.lootGear[i];
      if (simZero.tileType[i] === 10) zeroGear += simZero.lootGear[i];
    }
    expect(richGear).toBeGreaterThan(0);
    expect(zeroGear).toBe(0);
  });

  it('paints custom loot areas via brushPaintZone and seeds their loot', async () => {
    const sim = await createSim(4242, {
      ...DEFAULT_PARAMS,
      initialHumans: 100,
      initialZombies: 100,
      initialAnimals: 100,
    });

    let cx = 220;
    let cy = 220;
    for (let y = 120; y < 380; y += 5) {
      const t = sim.inspectTile(220, y).tileType;
      if (t !== 0 && t !== 6) { cx = 220; cy = y; break; }
    }

    sim.brushPaintZone(cx, cy, 6, 10); // Military Base
    expect(sim.inspectTile(cx, cy).tileType).toBe(10);

    let milLoot = 0;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        milLoot += sim.inspectTile(cx + dx, cy + dy).gear;
      }
    }
    expect(milLoot).toBeGreaterThan(0);
  });

  it('computes dynamic society prices, global wealth, and inter-society trade', async () => {
    const sim = await createSim(1337, {
      ...DEFAULT_PARAMS,
      initialHumans: 6000,
      initialZombies: 1000,
      initialAnimals: 1500,
      cooperationBias: 0.85,
      banditry: 0.05,
    });
    sim.step(300);

    const stats = sim.readStats();
    expect(stats.settlements).toBeGreaterThan(0);
    expect(stats.globalWealth).toBeGreaterThan(0);
    expect(stats.avgPriceFood).toBeGreaterThan(0);
    expect(stats.avgPriceWater).toBeGreaterThan(0);
    expect(stats.avgPriceGear).toBeGreaterThan(0);
    expect(stats.avgPriceMats).toBeGreaterThan(0);

    const factions = sim.readFactions();
    expect(factions.length).toBeGreaterThan(0);
    expect(factions[0].wealth).toBeGreaterThan(0);
  });
});
