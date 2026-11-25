import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Vehicle } from './types';
import { HEADLIGHT_DUSK, headlightThreshold, setVehicleHeadlights } from './vehicles';

function fakeVehicle(id: number, exploded = false): Vehicle {
  return { id, headlights: new THREE.Group(), exploded } as unknown as Vehicle;
}

describe('headlightThreshold', () => {
  it('stays inside HEADLIGHT_DUSK', () => {
    for (let id = 1; id <= 500; id++) {
      const t = headlightThreshold(id);
      expect(t).toBeGreaterThanOrEqual(HEADLIGHT_DUSK[0]);
      expect(t).toBeLessThanOrEqual(HEADLIGHT_DUSK[1]);
    }
  });

  it('spreads across the range', () => {
    const bins = new Set<number>();
    let min = Infinity;
    let max = -Infinity;
    for (let id = 1; id <= 500; id++) {
      const t = headlightThreshold(id);
      bins.add(Math.min(5, Math.floor((t - HEADLIGHT_DUSK[0]) / 0.05)));
      min = Math.min(min, t);
      max = Math.max(max, t);
    }
    expect(bins.size).toBeGreaterThanOrEqual(4);
    expect(max - min).toBeGreaterThan(0.2);
  });

  it('is stable for the same id', () => {
    for (const id of [1, 17, 240, 500]) {
      expect(headlightThreshold(id)).toBe(headlightThreshold(id));
    }
  });
});

describe('setVehicleHeadlights', () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);

  it('at night 0.45 some lamps are lit and some are not', () => {
    const vs = ids.map((id) => fakeVehicle(id));
    setVehicleHeadlights(vs, 0.45);
    const lit = vs.filter((v) => v.headlights!.visible).length;
    expect(lit).toBeGreaterThan(0);
    expect(lit).toBeLessThan(vs.length);
  });

  it('at night 1 every lamp is lit, at 0 none are', () => {
    const vs = ids.map((id) => fakeVehicle(id));
    setVehicleHeadlights(vs, 1);
    expect(vs.every((v) => v.headlights!.visible)).toBe(true);
    setVehicleHeadlights(vs, 0);
    expect(vs.every((v) => !v.headlights!.visible)).toBe(true);
  });

  it('an exploded vehicle never shows its lamps', () => {
    const v = fakeVehicle(3);
    (v as unknown as { exploded: boolean }).exploded = true;
    setVehicleHeadlights([v], 1);
    expect(v.headlights!.visible).toBe(false);
  });

  it('forceOn lights one vehicle at night 0', () => {
    const vs = ids.map((id) => fakeVehicle(id));
    setVehicleHeadlights(vs, 0, vs[5]);
    expect(vs[5].headlights!.visible).toBe(true);
    expect(vs.filter((v) => v.headlights!.visible)).toHaveLength(1);
  });
});
