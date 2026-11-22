// Gnomes bob in deep water and wade in shallow; ground mowers conk out in deep water, sink, and come back home later.
import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { bedAt, heightAt, waterAt } from './terrain';
import { checkSink, stepSunk, swimState } from './swim';
import type { Vehicle } from './types';

// Browser-only audio is not needed here; keep the module graph quiet.
vi.mock('./audio', () => ({ play: () => undefined }));

function mower(x: number, z: number, extra: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 1, kind: 'ride-on', spec: VEHICLES['ride-on'], x, y: bedAt(x, z), z, yaw: 0, speed: 5, vy: 0,
    driver: 'none', tint: 0, object: {} as never, rider: null, riderLook: null, wheelSpin: 0, steerVis: 0,
    hp: 1, damage: 0, lastHit: 0, ...extra,
  } as Vehicle;
}

describe('swimState', () => {
  it('is dry on land (Turfton)', () => {
    expect(swimState(0, 0, 0)).toBe('dry');
  });

  it('bobs at the loch centre', () => {
    const w = waterAt(-700, -680);
    expect(w).not.toBeNull();
    expect(swimState(-700, w!.surface - 0.5, -680)).toBe('bob');
  });

  it('wades in the middle of the canal', () => {
    const w = waterAt(-150, 230);
    expect(w).not.toBeNull();
    expect(w!.depth).toBeLessThan(0.7);
    expect(swimState(-150, w!.surface - 0.4, 230)).toBe('wade');
  });

  it('is dry on the canal bridge deck', () => {
    expect(swimState(0, heightAt(0, 230), 230)).toBe('dry');
  });
});

describe('checkSink', () => {
  it('sinks a ground mower in the loch and stops it', () => {
    const v = mower(-700, -680, { y: bedAt(-700, -680), speed: 5 });
    expect(checkSink(v)).toBe(true);
    expect(v.sunk).toBe(true);
    expect(v.sunkT).toBe(0);
    expect(v.speed).toBe(0);
  });

  it('does not sink a mower in the shallow canal', () => {
    const w = waterAt(-150, 230);
    const v = mower(-150, 230, { y: w!.surface - 0.3 });
    expect(checkSink(v)).toBe(false);
    expect(v.sunk).toBeFalsy();
  });

  it('never sinks a boat', () => {
    const v = mower(-700, -680, { spec: VEHICLES['walnut-dinghy'], y: bedAt(-700, -680) });
    expect(checkSink(v)).toBe(false);
    expect(v.sunk).toBeFalsy();
  });
});

describe('stepSunk', () => {
  it('brings a sunk mower back to home after the wait, once the player is clear', () => {
    const home = { x: -500, z: -680, yaw: 0.5 };
    const repair = vi.fn();
    const v = mower(-700, -680, { home, sunk: true, sunkT: 0, speed: 0 });
    const px = 0, pz = 0;

    stepSunk([v], 1, px, pz, repair);
    for (let t = 1; t < 44; t++) stepSunk([v], 1, px, pz, repair);
    expect(v.sunk).toBe(true);
    expect(repair).not.toHaveBeenCalled();

    stepSunk([v], 2, px, pz, repair);
    expect(v.sunk).toBe(false);
    expect(v.x).toBe(home.x);
    expect(v.z).toBe(home.z);
    expect(v.yaw).toBe(home.yaw);
    expect(v.y).toBe(heightAt(home.x, home.z));
    expect(repair).toHaveBeenCalledTimes(1);
  });
});
