import { describe, expect, it } from 'vitest';
import {
  PART_CATALOG,
  createDefaultVehicleStore,
  evaluateVehicle,
  refuelVehicle,
  repairVehicle,
  type VehicleInstance,
} from './model';

describe('modular vehicle & Franken-Build modding', () => {
  it('marks vehicles missing parts as non-runnable', () => {
    const v: VehicleInstance = {
      id: 'v1', kind: 'mower-kart', x: 0, y: 0, z: 0, yaw: 0,
      parts: { engine: 'eng-mower-2t', wheels: 'whl-mower' },
    };
    const st = evaluateVehicle(v);
    expect(st.runnable).toBe(false);
    expect(st.missing).toEqual(['belt', 'oil']);
  });

  it('applies underpowered penalty when small engine is put in a large tractor', () => {
    const v: VehicleInstance = {
      id: 'v2', kind: 'utility-tractor', x: 0, y: 0, z: 0, yaw: 0,
      parts: { engine: 'eng-pedal-crank', belt: 'belt-rubber', oil: 'oil-clean', wheels: 'whl-barrow' },
    };
    const st = evaluateVehicle(v);
    expect(st.runnable).toBe(true);
    expect(st.penalties.some((p) => p.includes('Underpowered'))).toBe(true);
  });

  it('triggers Rocket Bike and Lawn Monster Franken-Build synergy boosts', () => {
    const baseBike: VehicleInstance = {
      id: 'b0', kind: 'scrap-bike', x: 0, y: 0, z: 0, yaw: 0,
      parts: { engine: 'eng-pedal-crank', belt: 'belt-hemp', oil: 'oil-clover', wheels: 'whl-bike' },
    };
    const rocketBike: VehicleInstance = {
      id: 'b1', kind: 'scrap-bike', x: 0, y: 0, z: 0, yaw: 0,
      parts: { engine: 'eng-v8-tractor', belt: 'belt-turbo', oil: 'oil-nitro', wheels: 'whl-monster' },
    };
    const baseStats = evaluateVehicle(baseBike);
    const rocketStats = evaluateVehicle(rocketBike);
    expect(rocketStats.synergies.some((s) => s.includes('Rocket Bike'))).toBe(true);
    expect(rocketStats.synergies.some((s) => s.includes('Lawn Monster'))).toBe(true);
    expect(rocketStats.topSpeed).toBeGreaterThan(baseStats.topSpeed * 2);
  });

  it('includes 5 vehicles, 24 parts, 6-slot Zombie Harvester & Dragster Hearse synergies, and repair/refuel', () => {
    const store = createDefaultVehicleStore();
    expect(store.vehicles).toHaveLength(5);
    expect(PART_CATALOG).toHaveLength(24);

    const hearse: VehicleInstance = {
      id: 'h1', kind: 'hearse-buggy', x: 0, y: 0, z: 0, yaw: 0, hp: 40, maxHp: 130, fuel: 20,
      parts: {
        engine: 'eng-v8-tractor', belt: 'belt-turbo', oil: 'oil-nitro',
        wheels: 'whl-monster', exhaust: 'exh-flamethrower', bumper: 'bmp-spiked-plow',
      },
    };
    const st = evaluateVehicle(hearse);
    expect(st.runnable).toBe(true);
    expect(st.synergies.some((s) => s.includes('Dragster Hearse'))).toBe(true);
    expect(st.synergies.some((s) => s.includes('Zombie Harvester'))).toBe(true);

    repairVehicle(hearse);
    refuelVehicle(hearse);
    expect(hearse.hp).toBe(130);
    expect(hearse.fuel).toBe(100);
  });
});
