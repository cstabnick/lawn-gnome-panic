import { describe, expect, it, vi } from 'vitest';
import { GNOMA_TRUCK } from './config';
import { chaosBonusForStreak, computeSmashLaunch } from './destructibles';
import { createEconomy } from './economy';
import { createInteractables } from './interactables';
import type { Fx, Hud, Player, Sfx } from './types';

function makeMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    vy: 0,
    grounded: true,
    health: 0.5,
    vehicle: null,
    seat: 0,
    airborne: false,
    chute: 0,
    model: {} as Player['model'],
    updateFoot: vi.fn(),
    updateRiding: vi.fn(),
    drawMount: vi.fn(),
    enter: vi.fn(),
    exit: vi.fn(),
    hurt: vi.fn(),
    respawn: vi.fn(),
    bail: vi.fn(),
    ragdolling: false,
    throwFrom: vi.fn(),
    ragdoll: vi.fn(),
    updateRagdoll: vi.fn(),
    updateAir: vi.fn(),
    hand: vi.fn(),
    muzzle: vi.fn(),
    ...overrides,
  };
}

function makeMockHud(): Hud {
  return {
    setWorld: vi.fn(),
    set: vi.fn(),
    toast: vi.fn(),
    banner: vi.fn(),
    setObjective: vi.fn(),
    setVisible: vi.fn(),
  };
}

function makeMemoryEconomy(acorns: number) {
  let stored = JSON.stringify({ acorns, debtRemaining: 500, debtPaidOff: false });
  return createEconomy({
    getItem: () => stored,
    setItem: (_k: string, v: string) => {
      stored = v;
    },
  });
}

function makeMockFx(): Fx {
  return {
    crack: vi.fn(),
    fire: vi.fn(),
    explode: vi.fn(),
    tracer: vi.fn(),
    flash: vi.fn(),
    spark: vi.fn(),
    airBlast: vi.fn(),
    dandelionCloud: vi.fn(),
    confetti: vi.fn(),
    update: vi.fn(),
  };
}

describe('computeSmashLaunch', () => {
  it('launches props away from the impact point with upward arc and spin', () => {
    const launch = computeSmashLaunch(10, 0, 5, 0, 20);
    expect(launch.vx).toBeGreaterThan(0);
    expect(launch.vy).toBeGreaterThan(4);
    expect(Math.hypot(launch.spinX, launch.spinY, launch.spinZ)).toBeGreaterThan(0);
  });

  it('handles zero-distance impacts without NaN', () => {
    const launch = computeSmashLaunch(4, 7, 4, 7, 10);
    expect(Number.isFinite(launch.vx)).toBe(true);
    expect(Number.isFinite(launch.vy)).toBe(true);
    expect(Number.isFinite(launch.vz)).toBe(true);
    expect(launch.vx).toBeGreaterThan(0);
  });
});

describe('chaosBonusForStreak', () => {
  it('returns 0 below streak 3 and scales from +10 to +25 for 3+', () => {
    expect(chaosBonusForStreak(0)).toBe(0);
    expect(chaosBonusForStreak(1)).toBe(0);
    expect(chaosBonusForStreak(2)).toBe(0);
    expect(chaosBonusForStreak(3)).toBe(10);
    expect(chaosBonusForStreak(4)).toBe(15);
    expect(chaosBonusForStreak(5)).toBe(20);
    expect(chaosBonusForStreak(6)).toBe(25);
    expect(chaosBonusForStreak(10)).toBe(25);
  });
});

describe('interactables', () => {
  it('heals on Acorn-Cola purchase and rejects when out of Acorns', () => {
    const hud = makeMockHud();
    const economy = makeMemoryEconomy(20);
    const fx = makeMockFx();
    const play = vi.fn<(sfx: Sfx) => void>();
    const interactables = createInteractables(hud, economy, fx, play);

    // Near Acorn-Cola at (-7, -22)
    const player = makeMockPlayer({ x: -7, z: -20.5, health: 0.4 });
    expect(interactables.prompt(player)).toBe('Buy Acorn-Cola (15 Acorns — Heal)');
    expect(interactables.interact(player)).toBe(true);
    expect(player.health).toBeCloseTo(0.75, 5);
    expect(economy.state().acorns).toBe(5);
    expect(play).toHaveBeenCalledWith('door');
    expect(fx.spark).toHaveBeenCalled();

    // Only 5 Acorns left — cannot buy another Acorn-Cola
    expect(interactables.interact(player)).toBe(false);
    expect(player.health).toBeCloseTo(0.75, 5);
  });

  it('grants 15s Pollen Rush buff from Dandelion Fizz and expires cleanly', () => {
    const hud = makeMockHud();
    const economy = makeMemoryEconomy(40);
    const fx = makeMockFx();
    const play = vi.fn<(sfx: Sfx) => void>();
    const interactables = createInteractables(hud, economy, fx, play);

    // Near Dandelion Fizz at (7, -20)
    const player = makeMockPlayer({ x: 7, z: -18 });
    expect(interactables.prompt(player)).toBe('Buy Dandelion Fizz (25 Acorns — Pollen Rush)');
    expect(interactables.interact(player)).toBe(true);
    expect(economy.state().acorns).toBe(15);

    const active = interactables.update(1.0, player);
    expect(active).toEqual({
      speedMult: 1.35,
      jumpMult: 1.28,
      buffLabel: 'Pollen Rush',
    });

    const expired = interactables.update(14.5, player);
    expect(expired).toEqual({
      speedMult: 1,
      jumpMult: 1,
      buffLabel: null,
    });
  });

  it('restores full health at Gnoma Food Truck and hides prompt while driving or airborne', () => {
    const hud = makeMockHud();
    const economy = makeMemoryEconomy(65);
    const fx = makeMockFx();
    const play = vi.fn<(sfx: Sfx) => void>();
    const interactables = createInteractables(hud, economy, fx, play);

    const player = makeMockPlayer({ x: GNOMA_TRUCK.x + 1.5, z: GNOMA_TRUCK.z, health: 0.2 });
    expect(interactables.prompt(player)).toBe('Buy Acorn-Flour Cake (40 Acorns — Full Glaze)');
    expect(interactables.interact(player)).toBe(true);
    expect(player.health).toBe(1.0);
    expect(economy.state().acorns).toBe(25);
    expect(hud.toast).toHaveBeenCalled();

    const drivingPlayer = makeMockPlayer({
      x: GNOMA_TRUCK.x,
      z: GNOMA_TRUCK.z,
      vehicle: {} as Player['vehicle'],
    });
    expect(interactables.prompt(drivingPlayer)).toBeNull();
    expect(interactables.interact(drivingPlayer)).toBe(false);
  });
});
