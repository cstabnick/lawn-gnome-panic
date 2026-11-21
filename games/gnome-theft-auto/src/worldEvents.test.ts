import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import {
  createWorldEvents,
  DRIFT_GATES,
  EVENT_REWARDS,
  EVENT_ROTATION,
  nextEventKind,
} from './worldEvents';
import type { Player, World } from './types';

describe('worldEvents rotation & rewards', () => {
  it('rotates through all three public events cleanly', () => {
    expect(EVENT_ROTATION).toEqual(['dew-convoy', 'drift-trial', 'hoa-raid']);
    expect(nextEventKind(0)).toEqual({ kind: 'dew-convoy', nextIndex: 1 });
    expect(nextEventKind(1)).toEqual({ kind: 'drift-trial', nextIndex: 2 });
    expect(nextEventKind(2)).toEqual({ kind: 'hoa-raid', nextIndex: 0 });
    expect(EVENT_REWARDS['dew-convoy']).toBe(300);
    expect(EVENT_REWARDS['drift-trial']).toBe(250);
    expect(EVENT_REWARDS['hoa-raid']).toBe(250);
  });

  it('completes drift-trial when driving a zero-turn through all 6 gates', () => {
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
});
