import { describe, expect, it } from 'vitest';
import { createSim, DEFAULT_PARAMS, MAX_AGENTS, type SimParams } from './bridge';
import {
  deleteScenario,
  exportScenarioJson,
  importScenarioJson,
  loadSavedScenarios,
  saveScenario,
  type ScenarioStorage,
} from './scenarios';

describe('Dead Grid 256K WASM simulation', () => {
  it('generates deterministic 512x512 worlds across all 4 water styles with topography', async () => {
    for (const waterStyle of [0, 1, 2, 3] as const) {
      const p: SimParams = { ...DEFAULT_PARAMS, waterStyle, initialHumans: 200, initialZombies: 200, initialAnimals: 200 };
      const simA = await createSim(4242, p);
      const simB = await createSim(4242, p);

      expect(simA.tileType[12345]).toBe(simB.tileType[12345]);
      expect(simA.elevation[12345]).toBe(simB.elevation[12345]);

      const seen = new Set<number>();
      for (let i = 0; i < 512 * 512; i++) seen.add(simA.tileType[i]);
      expect(seen.has(0)).toBe(true); // Water present
      expect(seen.size).toBeGreaterThanOrEqual(7);
    }
  });

  it('prevents scanline / memory corruption over 1,500 ticks with deaths & societies', async () => {
    const sim = await createSim(1337, {
      ...DEFAULT_PARAMS,
      initialHumans: 3000,
      initialZombies: 6000,
      initialAnimals: 1500,
    });

    const initialWaterCount = (() => {
      let c = 0;
      for (let i = 0; i < 512 * 512; i++) if (sim.tileType[i] === 0) c++;
      return c;
    })();

    sim.step(1500);
    const stats = sim.readStats();
    expect(stats.tick).toBe(1500);
    expect(stats.totalDeaths + stats.totalZombiesKilled).toBeGreaterThan(50);

    // Water tiles must never be overwritten by heap/scanline corruption
    let afterWaterCount = 0;
    for (let i = 0; i < 512 * 512; i++) {
      if (sim.tileType[i] === 0) afterWaterCount++;
      expect(sim.tileType[i]).toBeLessThanOrEqual(13);
    }
    expect(afterWaterCount).toBe(initialWaterCount);

    for (let i = 0; i < stats.activeAgents; i++) {
      if (sim.agKind[i] === 0) continue;
      expect(Number.isFinite(sim.agX[i])).toBe(true);
      expect(Number.isFinite(sim.agY[i])).toBe(true);
      expect(sim.agX[i]).toBeGreaterThanOrEqual(0);
      expect(sim.agX[i]).toBeLessThan(512);
      expect(sim.agY[i]).toBeGreaterThanOrEqual(0);
      expect(sim.agY[i]).toBeLessThan(512);
    }
  });

  it('supports 1024x1024 grids and 55,000+ agents within 256k capacity', async () => {
    expect(MAX_AGENTS).toBe(262144);
    const sim = await createSim(9001, {
      ...DEFAULT_PARAMS,
      gridSize: 1024,
      initialZombies: 40000,
      initialHumans: 10000,
      initialAnimals: 5000,
    });

    const stats0 = sim.readStats();
    expect(stats0.gridW).toBe(1024);
    expect(stats0.gridH).toBe(1024);
    expect(stats0.zombies + stats0.humans + stats0.animals).toBe(55000);

    const t0 = performance.now();
    sim.step(20);
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(3000);
    expect(sim.readStats().tick).toBe(20);
  });

  it("simulates multi-species, social tiers, Prisoner's Dilemma, and brushes", async () => {
    const sim = await createSim(777, {
      ...DEFAULT_PARAMS,
      initialHumans: 5000,
      initialZombies: 1000,
      initialAnimals: 1500,
      cooperationBias: 0.6,
    });
    sim.step(200);

    const stats = sim.readStats();
    expect(stats.animals).toBeGreaterThan(0);
    expect(stats.settlements).toBeGreaterThan(0);
    expect(stats.pdCoops + stats.pdDefects).toBeGreaterThan(0);

    const beforeZ = stats.zombies;
    sim.brushSpawnZombies(200, 200, 10, 150);
    expect(sim.readStats().zombies).toBeGreaterThan(beforeZ);

    const beforeH = sim.readStats().humans;
    sim.brushSpawnHumans(220, 220, 8, 40);
    expect(sim.readStats().humans).toBeGreaterThan(beforeH);

    const beforeA = sim.readStats().animals;
    sim.brushSpawnAnimals(240, 240, 8, 30);
    expect(sim.readStats().animals).toBeGreaterThan(beforeA);

    // Find a passable tile for airdrop
    let ax = 220;
    let ay = 220;
    for (let y = 150; y < 350; y += 5) {
      const t = sim.inspectTile(220, y).tileType;
      if (t !== 0 && t !== 6 && t !== 13) { ax = 220; ay = y; break; }
    }
    sim.brushAirdrop(ax, ay, 5);
    const tile = sim.inspectTile(ax, ay);
    expect(tile.food + tile.water + tile.gear).toBeGreaterThan(0);

    for (const overlay of [0, 1, 2, 3, 4, 5] as const) {
      sim.renderFrame(overlay, overlay === 0);
      expect(sim.frameRgba[0]).not.toBe(0);
    }
  });

  it('decays unmaintained roads, expands territory, and federates societies into Republics', async () => {
    const decaySim = await createSim(555, {
      ...DEFAULT_PARAMS,
      initialHumans: 100,
      initialZombies: 100,
      initialAnimals: 100,
      roadDecayRate: 2.0,
    });
    const initialRoads = decaySim.readStats().roadTiles;
    decaySim.step(400);
    expect(decaySim.readStats().roadTiles).toBeLessThan(initialRoads);

    const repSim = await createSim(1337, {
      ...DEFAULT_PARAMS,
      initialHumans: 6500,
      initialZombies: 1200,
      initialAnimals: 1500,
      cooperationBias: 0.9,
      banditry: 0.05,
      settlementGrowth: 1.6,
      roadBuildCost: 0.4,
      roadDecayRate: 0.1,
    });
    repSim.step(500);
    const stats = repSim.readStats();
    expect(stats.territoryTiles).toBeGreaterThan(500);
    expect(stats.republics).toBeGreaterThan(0);
    expect(repSim.readRepublics().length).toBeGreaterThan(0);

    repSim.renderFrame(5, true);
    expect(repSim.frameRgba[0]).not.toBe(0);
  });

  it('saves, exports, imports, and deletes custom scenarios', () => {
    const map = new Map<string, string>();
    const fakeStorage: ScenarioStorage = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => { map.set(k, v); },
    };

    const custom: SimParams = { ...DEFAULT_PARAMS, gridSize: 768, waterStyle: 2, initialZombies: 25000 };
    const saved = saveScenario('Island Swarm', 999, custom, fakeStorage);
    expect(saved.length).toBe(1);
    expect(loadSavedScenarios(fakeStorage)[0].name).toBe('Island Swarm');

    const json = exportScenarioJson('Island Swarm', 999, custom);
    const imported = importScenarioJson(json);
    expect(imported.name).toBe('Island Swarm');
    expect(imported.seed).toBe(999);
    expect(imported.params.gridSize).toBe(768);
    expect(imported.params.waterStyle).toBe(2);

    const afterDel = deleteScenario(saved[0].id, fakeStorage);
    expect(afterDel.length).toBe(0);
  });
});
