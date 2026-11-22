import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import {
  ACORN_SPILL_TARGET,
  ACORN_SPILL_TOTAL,
  createWorldEvents,
  DRIFT_GATES,
  EVENT_INTERVAL,
  EVENT_REWARDS,
  EVENT_ROTATION,
  nextEventKind,
} from './worldEvents';
import type { Player, World } from './types';

function makeHarness() {
  const earned: number[] = [];
  const we = createWorldEvents({
    scene: new THREE.Scene(),
    world: { half: 600, boxes: [] } as unknown as World,
    hud: {
      setWorld: vi.fn(),
      set: vi.fn(),
      toast: vi.fn(),
      banner: vi.fn(),
      setObjective: vi.fn(),
      setVisible: vi.fn(),
    },
    vehicles: [],
    economy: {
      state: () => ({ acorns: 50, debtRemaining: 5000, debtPaidOff: false }),
      earn: (amt) => earned.push(amt),
      spend: () => true,
      payDebt: () => 0,
      chargeHospital: () => ({ fee: 0, receipt: '' }),
      inFraudZone: () => false,
      onPlayerRagdollImpact: () => 0,
    },
  });
  return { we, earned };
}

describe('worldEvents rotation & rewards', () => {
  it('rotates through all six public events cleanly', () => {
    expect(EVENT_INTERVAL).toBe(110);
    expect(EVENT_ROTATION).toEqual([
      'dew-convoy',
      'drift-trial',
      'hoa-raid',
      'acorn-spill',
      'street-drag',
      'runaway-combine',
    ]);
    expect(nextEventKind(0)).toEqual({ kind: 'dew-convoy', nextIndex: 1 });
    expect(nextEventKind(1)).toEqual({ kind: 'drift-trial', nextIndex: 2 });
    expect(nextEventKind(2)).toEqual({ kind: 'hoa-raid', nextIndex: 3 });
    expect(nextEventKind(3)).toEqual({ kind: 'acorn-spill', nextIndex: 4 });
    expect(nextEventKind(4)).toEqual({ kind: 'street-drag', nextIndex: 5 });
    expect(nextEventKind(5)).toEqual({ kind: 'runaway-combine', nextIndex: 0 });
    expect(EVENT_REWARDS).toEqual({
      'dew-convoy': 300,
      'drift-trial': 250,
      'hoa-raid': 250,
      'acorn-spill': 275,
      'street-drag': 350,
      'runaway-combine': 325,
    });
  });

  it('completes drift-trial when driving a zero-turn through all 6 gates', () => {
    const { we, earned } = makeHarness();

    we.trigger('drift-trial');
    expect(we.activeEvent()?.kind).toBe('drift-trial');

    const player = {
      x: 0,
      z: 0,
      vehicle: { kind: 'zero-turn' },
    } as unknown as Player;

    for (const [gx, gz] of DRIFT_GATES) {
      player.x = gx;
      player.z = gz;
      we.update(0.1, player, false);
    }

    expect(earned).toEqual([250]);
    expect(we.activeEvent()).toBeNull();
  });

  it('completes acorn-spill after collecting 8 of 12 crates within 60s', () => {
    const { we, earned } = makeHarness();

    we.trigger('acorn-spill');
    expect(we.activeEvent()?.kind).toBe('acorn-spill');
    const crateBlips = we.blips();
    expect(crateBlips).toHaveLength(ACORN_SPILL_TOTAL);

    const player = {
      x: 0,
      z: 0,
      vehicle: null,
    } as unknown as Player;

    for (let i = 0; i < ACORN_SPILL_TARGET; i++) {
      player.x = crateBlips[i].x;
      player.z = crateBlips[i].z;
      we.update(0.1, player, false);
    }

    expect(earned).toEqual([275]);
    expect(we.activeEvent()).toBeNull();
  });
});
