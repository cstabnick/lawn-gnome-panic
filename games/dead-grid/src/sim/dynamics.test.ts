import { describe, expect, it } from 'vitest';
import { createSim, DEFAULT_PARAMS } from './bridge';

describe('Dynamic PD Genetics & Wildfire Containment', () => {
  it('contains wildfires across multiple seeds without runaway map burn', async () => {
    for (const seed of [1337, 4242, 9001]) {
      const sim = await createSim(seed, {
        ...DEFAULT_PARAMS,
        gridSize: 512,
        disasterRate: 0,
        fireSpreadRate: 0.45,
      });

      // Ignite wildfire near center
      sim.disasterWildfire(256, 256, 14);
      const initialFire = sim.readStats().activeFires;

      sim.step(700);
      const after = sim.readStats();

      // Count charred or burned tiles
      let burnedTiles = 0;
      for (let i = 0; i < sim.burnCooldown.length && i < 512 * 512; i++) {
        if (sim.burnCooldown[i] > 0) burnedTiles++;
      }
      const burnPct = (burnedTiles / (512 * 512)) * 100;

      console.log(
        `[Fire Balance seed=${seed}] initFire=${initialFire} after300t activeFires=${after.activeFires} burnedTiles=${burnedTiles} (${burnPct.toFixed(2)}%)`,
      );

      expect(after.activeFires).toBeLessThanOrEqual(8);
      expect(burnPct).toBeLessThan(15);
    }
  });

  it('extinguishes active fires immediately with brushExtinguish', async () => {
    const sim = await createSim(1337, {
      ...DEFAULT_PARAMS,
      gridSize: 512,
      disasterRate: 0,
    });
    sim.disasterWildfire(256, 256, 14);
    sim.step(4);
    expect(sim.readStats().activeFires).toBeGreaterThan(0);

    sim.brushExtinguish(256, 256, 24);
    sim.step(1);
    expect(sim.readStats().activeFires).toBe(0);
  });

  it('produces dynamic genetic Prisoner Dilemma outcomes and adaptive trust shifts', async () => {
    for (const seed of [1337, 7777, 2026]) {
      const sim = await createSim(seed, {
        ...DEFAULT_PARAMS,
        gridSize: 512,
        initialHumans: 4500,
        initialZombies: 6000,
        disasterRate: 0,
      });

      const s0 = sim.readStats();
      const coopRates: number[] = [];
      const trustCurve: number[] = [];

      for (let step = 0; step < 6; step++) {
        const prevC = sim.readStats().pdCoops;
        const prevD = sim.readStats().pdDefects;
        sim.step(100);
        const st = sim.readStats();
        const dC = st.pdCoops - prevC;
        const dD = st.pdDefects - prevD;
        const rate = dC + dD > 0 ? dC / (dC + dD) : 0;
        coopRates.push(Math.round(rate * 1000) / 10);
        trustCurve.push(st.avgAdaptTrust);
      }

      const end = sim.readStats();
      console.log(
        `[PD Balance seed=${seed}] coops=${end.pdCoops} defects=${end.pdDefects} mutual=${end.pdMutualCoop} betrayals=${end.pdBetrayals} | rates%=${coopRates.join(',')} | trust=${trustCurve.join(',')} | strats(C/R/D)=${s0.stratCoop}/${s0.stratRecip}/${s0.stratDefect} -> ${end.stratCoop}/${end.stratRecip}/${end.stratDefect}`,
      );

      expect(end.pdCoops).toBeGreaterThan(100);
      expect(end.pdDefects).toBeGreaterThan(50);
      const totalRate = end.pdCoops / (end.pdCoops + end.pdDefects);
      expect(totalRate).toBeGreaterThan(0.10);
      expect(totalRate).toBeLessThan(0.95);
      expect(end.stratCoop).toBeGreaterThan(0);
      expect(end.stratRecip).toBeGreaterThan(0);
      expect(end.stratDefect).toBeGreaterThan(0);
      expect(trustCurve.some((v) => v !== 0)).toBe(true);
    }
  });
});
