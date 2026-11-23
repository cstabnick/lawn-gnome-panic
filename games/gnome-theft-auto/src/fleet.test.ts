import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { MOWER_TINTS, VEHICLES } from './config';
import type { ParkedSpot, Vehicle } from './types';
import { FLEET, applyVariant, fleetEntry, planParked, spawnFleet } from './fleet';

vi.mock('./audio', () => ({ play: () => undefined }));

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function spot(kind: ParkedSpot['kind'], x = 0, z = 0): ParkedSpot {
  return { x, z, yaw: 0, kind };
}

describe('FLEET table', () => {
  it('has unique kebab-case ids, known kinds and ordered pitch ranges', () => {
    const ids = FLEET.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of FLEET) {
      expect(e.id).toMatch(KEBAB);
      expect(e.kind in VEHICLES).toBe(true);
      expect(e.pitch[0]).toBeLessThanOrEqual(e.pitch[1]);
    }
    expect(fleetEntry('golf-cart')?.kind).toBe('golf-cart');
  });
});

describe('planParked', () => {
  const spots: ParkedSpot[] = [
    spot('ride-on', 50, 0),
    spot('push-bike', 5, 5),
    spot('zero-turn', 0, 0),
    spot('walnut-dinghy', 1, 1),
    spot('ride-on', -20, 3),
  ];

  it('keeps order and length', () => {
    const plans = planParked(spots, { x: 0, z: 0 }, () => 0.5);
    expect(plans.length).toBe(spots.length);
    plans.forEach((p, i) => expect(p.spot).toBe(spots[i]));
  });

  it('with rng = 0 every spot is stock except the guaranteed golf cart', () => {
    const plans = planParked(spots, { x: 0, z: 0 }, () => 0);
    const variants = plans.filter((p) => p.entry !== null);
    expect(variants.length).toBe(1);
    expect(variants[0].entry?.id).toBe('golf-cart');
  });

  it('gives the golf cart to the ride-on / push-bike spot nearest `near`, in its own paint', () => {
    const plans = planParked(spots, { x: 4, z: 4 }, () => 0);
    const golf = plans.find((p) => p.entry?.id === 'golf-cart');
    expect(golf?.spot).toBe(spots[1]);
    expect(fleetEntry('golf-cart')?.tints).toContain(golf!.tint);
  });

  it('with rng = 0.999 a zero-turn spot gets a zero-turn variant', () => {
    const plans = planParked([spot('zero-turn')], { x: 0, z: 0 }, () => 0.999);
    expect(plans[0].entry?.kind).toBe('zero-turn');
  });

  it('boat-kind spots are always stock', () => {
    const plans = planParked([spot('walnut-dinghy'), spot('walnut-dinghy')], { x: 0, z: 0 }, () => 0.999);
    for (const p of plans) {
      expect(p.entry).toBeNull();
      expect(MOWER_TINTS).toContain(p.tint);
    }
  });
});

describe('applyVariant', () => {
  it('changes the vehicle but not the shared VEHICLES spec', () => {
    const beforeName = VEHICLES['ride-on'].name;
    const beforeMax = VEHICLES['ride-on'].maxSpeed;
    const v = { spec: VEHICLES['ride-on'] } as unknown as Vehicle;
    const e = fleetEntry('ride-on-grumbler')!;
    applyVariant(v, e, () => 0.5);
    expect(VEHICLES['ride-on'].name).toBe(beforeName);
    expect(VEHICLES['ride-on'].maxSpeed).toBe(beforeMax);
    expect(v.spec.name).toBe(e.name);
    expect(v.spec.maxSpeed).toBeCloseTo(beforeMax * 0.95);
    expect(v.variant).toBe(e.id);
    expect(v.enginePitch).toBeGreaterThanOrEqual(e.pitch[0]);
    expect(v.enginePitch).toBeLessThanOrEqual(e.pitch[1]);
  });
});

describe('spawnFleet', () => {
  it('spawns a golf cart variant, a stock ride-on, or nothing', () => {
    const scene = new THREE.Scene();
    const golf = spawnFleet(scene, 'golf-cart', 0, 0, 0, () => 0.5);
    expect(golf?.spec.kind).toBe('golf-cart');
    expect(golf?.spec.name).toBe('Putting-Green Cart');

    const ride = spawnFleet(scene, 'ride-on', 0, 0, 0, () => 0.5);
    expect(ride?.spec.kind).toBe('ride-on');
    expect(ride?.variant).toBeUndefined();
    expect(ride?.spec.name).toBe(VEHICLES['ride-on'].name);

    expect(spawnFleet(scene, 'nope', 0, 0, 0)).toBeNull();
  });
});
