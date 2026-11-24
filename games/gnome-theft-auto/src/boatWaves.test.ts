import { beforeEach, describe, expect, it } from 'vitest';
import { settleOnWaves } from './boatWaves';
import { resetWaves, setSeaState, tickWaveClock } from './waves';
import type { Vehicle } from './types';

/** Only the fields settleOnWaves reads. */
function fakeBoat(x: number, z: number): Vehicle {
  return {
    x, z, y: 0, yaw: 0.4, spec: { radius: 3, boat: true }, boat: { pitch: 0, roll: 0, vy: 0, slip: 0, beached: false },
  } as unknown as Vehicle;
}

describe('settleOnWaves (remote boats)', () => {
  beforeEach(() => resetWaves());

  it('moves pitch and roll away from 0 in a blustery sea, and stays finite', () => {
    tickWaveClock(1.8e12);
    setSeaState('blustery', -1e6);
    const v = fakeBoat(-650, -650);
    let moved = false;
    for (let i = 0; i < 240; i++) {
      settleOnWaves(v, 1 / 60);
      expect(Number.isFinite(v.boat!.pitch)).toBe(true);
      expect(Number.isFinite(v.boat!.roll)).toBe(true);
      if (Math.abs(v.boat!.pitch) > 1e-4 || Math.abs(v.boat!.roll) > 1e-4) moved = true;
    }
    expect(moved).toBe(true);
  });

  it('does nothing for a vehicle without boat state', () => {
    const v = fakeBoat(-650, -650);
    v.boat = undefined;
    expect(() => settleOnWaves(v, 1 / 60)).not.toThrow();
    expect(v.boat).toBeUndefined();
  });
});
