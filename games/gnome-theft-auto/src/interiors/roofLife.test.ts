import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addRooftop, clearRooftops } from './rooftops';
import { createRoofLife } from './roofLife';

function makeDeps(player: Record<string, unknown>) {
  const hud = { toast: vi.fn(), banner: vi.fn() };
  const unlock = vi.fn();
  const increment = vi.fn();
  return { deps: { player, hud, unlock, increment } as never, hud, unlock, increment };
}

describe('roofLife', () => {
  beforeEach(() => {
    clearRooftops();
    addRooftop({ id: 'r1', name: 'Test Roof', minX: 0, maxX: 10, minZ: 0, maxZ: 10, y: 20, solid: true, parapet: true });
  });

  it('counts a rooftop run once per roof when walking on foot', () => {
    const player = { x: 5, y: 20, z: 5, vehicle: null, airborne: false };
    const { deps, increment } = makeDeps(player);
    const life = createRoofLife(deps);
    life.update(0.3);
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenCalledWith('gta-rooftop-run', 1);
    life.update(0.3);
    expect(increment).toHaveBeenCalledTimes(1);
  });

  it('unlocks roof rat when a landed aircraft touches down on a roof', () => {
    const vehicle = {
      spec: { air: {} },
      driver: 'player',
      air: { airborne: false },
      speed: 0,
      x: 5,
      y: 20,
      z: 5,
    };
    const player = { x: 0, y: 0, z: 0, vehicle, airborne: false };
    const { deps, unlock, hud } = makeDeps(player);
    const life = createRoofLife(deps);
    life.update(0.3);
    life.update(0.3);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith('gta-roof-rat');
    expect(hud.toast).toHaveBeenCalledWith('Touched down on Test Roof.');
  });
});
