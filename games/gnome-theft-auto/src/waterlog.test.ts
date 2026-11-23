// Waterlogged engines: a ground mower driven through water soaks up; it floods and stalls at 1 and dries out on land.
import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { bedAt, heightAt } from './terrain';
import {
  WATERLOG, clearWaterlog, stepWaterlog, waterlogSpeedMult, waterlogThrottle, type WaterlogEvent,
} from './waterlog';
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

describe('stepWaterlog', () => {
  it('stays dry on land (Turfton)', () => {
    const v = mower(0, 0);
    expect(stepWaterlog(v, 0.1)).toBeNull();
    expect(v.waterlog ?? 0).toBe(0);
  });

  it('soaks in the canal, fires soaked once at sputterAt and flooded once at 1', () => {
    const v = mower(-150, 230, { speed: 0 });
    const events: WaterlogEvent[] = [];
    let soakedAt = -1;
    for (let i = 0; i < 400 && !v.waterlogStalled; i++) {
      const before = v.waterlog ?? 0;
      const ev = stepWaterlog(v, 0.1);
      if (ev) events.push(ev);
      if (ev === 'soaked') soakedAt = before;
      if (ev === null) expect(v.waterlog!).toBeGreaterThanOrEqual(before);
    }
    expect(v.waterlog).toBe(1);
    expect(v.waterlogStalled).toBe(true);
    expect(soakedAt).toBeLessThan(WATERLOG.sputterAt);
    expect(events.filter((e) => e === 'soaked')).toHaveLength(1);
    expect(events.filter((e) => e === 'flooded')).toHaveLength(1);
    expect(events.indexOf('soaked')).toBeLessThan(events.indexOf('flooded'));
    // Further soaking in the canal fires nothing more.
    expect(stepWaterlog(v, 0.1)).toBeNull();
  });

  it('dries a flooded mower on land: restarted below restartAt, then dry at 0', () => {
    const v = mower(0, 0, { y: heightAt(0, 0), waterlog: 1, waterlogStalled: true });
    const events: WaterlogEvent[] = [];
    for (let i = 0; i < 400 && v.waterlog! > 0; i++) {
      const ev = stepWaterlog(v, 0.1);
      if (ev) events.push(ev);
    }
    expect(v.waterlog).toBe(0);
    expect(v.waterlogStalled).toBe(false);
    expect(events.filter((e) => e === 'restarted')).toHaveLength(1);
    expect(events.filter((e) => e === 'dry')).toHaveLength(1);
    expect(events.indexOf('restarted')).toBeLessThan(events.indexOf('dry'));
  });

  it('never changes a boat, a flyer or a sunk mower', () => {
    const boat = mower(-150, 230, { spec: VEHICLES['walnut-dinghy'], y: bedAt(-150, 230) });
    const flyer = mower(-150, 230, { spec: VEHICLES['whirligig'], y: bedAt(-150, 230) });
    const sunk = mower(-150, 230, { sunk: true, y: bedAt(-150, 230) });
    for (const v of [boat, flyer, sunk]) {
      for (let i = 0; i < 50; i++) expect(stepWaterlog(v, 0.1)).toBeNull();
      expect(v.waterlog).toBeUndefined();
      expect(v.waterlogStalled).toBeFalsy();
    }
  });
});

describe('waterlogThrottle', () => {
  it('passes the throttle through when dry', () => {
    expect(waterlogThrottle(mower(0, 0), 0.8, 1.23)).toBe(0.8);
  });

  it('gives the limp share when stalled', () => {
    const v = mower(0, 0, { waterlog: 1, waterlogStalled: true });
    expect(waterlogThrottle(v, 1, 0)).toBeCloseTo(WATERLOG.limp);
    expect(waterlogThrottle(v, -0.5, 3.3)).toBeCloseTo(-0.5 * WATERLOG.limp);
  });

  it('scales a soaked (below sputterAt) engine by (1 - 0.4 wl)', () => {
    const v = mower(0, 0, { waterlog: 0.2 });
    expect(waterlogThrottle(v, 1, 0)).toBeCloseTo(1 - 0.4 * 0.2);
    expect(waterlogThrottle(v, 1, 1.7)).toBeCloseTo(1 - 0.4 * 0.2);
  });

  it('sputters at wl 0.9 for some clock times and not others', () => {
    const v = mower(0, 0, { waterlog: 0.9 });
    const outs = new Set<number>();
    for (let t = 0; t <= 2; t += 0.05) outs.add(waterlogThrottle(v, 1, t) === 0 ? 0 : 1);
    expect(outs).toEqual(new Set([0, 1]));
  });
});

describe('waterlogSpeedMult and clearWaterlog', () => {
  it('is 1 dry and minSpeedMult flooded', () => {
    expect(waterlogSpeedMult(mower(0, 0))).toBe(1);
    expect(waterlogSpeedMult(mower(0, 0, { waterlog: 1 }))).toBeCloseTo(WATERLOG.minSpeedMult);
  });

  it('clearWaterlog dries and restarts the engine', () => {
    const v = mower(0, 0, { waterlog: 1, waterlogStalled: true });
    clearWaterlog(v);
    expect(v.waterlog).toBe(0);
    expect(v.waterlogStalled).toBe(false);
  });
});
