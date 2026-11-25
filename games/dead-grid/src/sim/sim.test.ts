import { describe, expect, it } from 'vitest';
import { createSim, DEFAULT_PARAMS, GRID_N, GRID_W } from './bridge';

describe('Dead Grid WASM simulation', () => {
  it('generates a deterministic 512x512 world with diverse DayZ biomes', async () => {
    const simA = await createSim(4242, DEFAULT_PARAMS);
    const simB = await createSim(4242, DEFAULT_PARAMS);

    expect(simA.tileType.length).toBe(GRID_N);
    expect(simA.tileType[0]).toBe(simB.tileType[0]);
    expect(simA.tileType[12345]).toBe(simB.tileType[12345]);

    const seen = new Set<number>();
    for (let i = 0; i < GRID_N; i++) seen.add(simA.tileType[i]);
    // Water, beach, grass, forest, road, town, city, military, farm, industrial
    expect(seen.size).toBeGreaterThanOrEqual(8);

    const stats = simA.readStats();
    expect(stats.zombies).toBe(DEFAULT_PARAMS.initialZombies);
    expect(stats.survivors).toBe(DEFAULT_PARAMS.initialSurvivors);
  });

  it('steps 14,500 agents cleanly with zero NaNs or out-of-bounds positions', async () => {
    const sim = await createSim(1337, DEFAULT_PARAMS);
    const t0 = performance.now();
    sim.step(120);
    const elapsedMs = performance.now() - t0;

    const stats = sim.readStats();
    expect(stats.tick).toBe(120);
    expect(stats.survivors + stats.zombies).toBeGreaterThan(1000);
    expect(elapsedMs).toBeLessThan(3000);

    for (let i = 0; i < stats.activeAgents; i++) {
      if (sim.agKind[i] === 0) continue;
      const x = sim.agX[i];
      const y = sim.agY[i];
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(GRID_W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(GRID_W);
    }
  });

  it('forms settlements and responds to intervention brushes', async () => {
    const sim = await createSim(777, { ...DEFAULT_PARAMS, initialZombies: 500, initialSurvivors: 4000 });
    sim.step(180);

    const stats = sim.readStats();
    expect(stats.settlements).toBeGreaterThan(0);

    const beforeZ = stats.zombies;
    sim.brushSpawnZombies(200, 200, 8, 120);
    expect(sim.readStats().zombies).toBeGreaterThan(beforeZ);

    const beforeS = sim.readStats().survivors;
    sim.brushSpawnSurvivors(220, 220, 6, 35);
    expect(sim.readStats().survivors).toBeGreaterThan(beforeS);

    sim.brushAirdrop(220, 220, 4);
    const tile = sim.inspectTile(220, 220);
    expect(tile.food + tile.gear).toBeGreaterThan(0);

    sim.brushClear(200, 200, 15);
    expect(sim.readStats().zombies).toBeLessThan(beforeZ + 120);
  });

  it('renders RGBA frames for all 4 overlay modes', async () => {
    const sim = await createSim(99, DEFAULT_PARAMS);
    for (const overlay of [0, 1, 2, 3] as const) {
      sim.renderFrame(overlay, overlay === 0);
      let nonZero = 0;
      for (let i = 0; i < sim.frameRgba.length; i += 257) {
        if (sim.frameRgba[i] !== 0) nonZero++;
      }
      expect(nonZero).toBeGreaterThan(100);
    }
  });
});
