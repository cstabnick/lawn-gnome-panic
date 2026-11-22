import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { CITY_HALF } from './config';
import { DISTRICT_NAMES, districtAt } from './districts';
import {
  STUNT_RAMPS,
  STUNTS_STORAGE_KEY,
  createStunts,
  evaluateStuntJump,
  rampElevationAt,
  type StuntRamp,
} from './stunts';
import type { Economy } from './economy';
import type { Fx, Hud, Player, Vehicle } from './types';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe('districtAt', () => {
  it('maps all 6 Turfton districts and returns null outside Turfton', () => {
    expect(districtAt(0, 0)).toBe('downtown');
    expect(districtAt(80, 0)).toBe('greenhouse');
    expect(districtAt(160, -160)).toBe('patio-heights');
    expect(districtAt(-160, 160)).toBe('industrial');
    expect(districtAt(-110, 90)).toBe('old-brick');
    expect(districtAt(-90, -90)).toBe('park-arts');

    expect(districtAt(CITY_HALF + 1, 0)).toBeNull();
    expect(districtAt(0, -CITY_HALF - 5)).toBeNull();
  });

  it('has display names for every district', () => {
    expect(Object.keys(DISTRICT_NAMES).sort()).toEqual([
      'downtown',
      'greenhouse',
      'industrial',
      'old-brick',
      'park-arts',
      'patio-heights',
    ]);
  });
});

describe('rampElevationAt', () => {
  const ramp: StuntRamp = {
    id: 'test-ramp',
    name: 'Test Ramp',
    x: 100,
    z: 50,
    yaw: 0, // launches toward +z
    width: 6,
    length: 10,
    height: 4,
    biome: 'city',
  };

  it('returns null outside the ramp footprint', () => {
    expect(rampElevationAt(ramp, 100, 44.5)).toBeNull();
    expect(rampElevationAt(ramp, 100, 55.5)).toBeNull();
    expect(rampElevationAt(ramp, 103.5, 50)).toBeNull();
  });

  it('interpolates elevation from 0 at entry to height at lip', () => {
    expect(rampElevationAt(ramp, 100, 45)).toBeCloseTo(0);
    expect(rampElevationAt(ramp, 100, 50)).toBeCloseTo(2);
    expect(rampElevationAt(ramp, 100, 55)).toBeCloseTo(4);
  });
});

describe('evaluateStuntJump', () => {
  it('requires >= 0.65s air time and >= 12m distance', () => {
    expect(evaluateStuntJump(0.5, 20, 0, true).qualifies).toBe(false);
    expect(evaluateStuntJump(1.0, 10, 0, true).qualifies).toBe(false);

    const first = evaluateStuntJump(1.1, 18, 0, true);
    expect(first.qualifies).toBe(true);
    expect(first.bonus).toBe(150);

    const repeat = evaluateStuntJump(1.1, 18, Math.PI * 2, false);
    expect(repeat.qualifies).toBe(true);
    expect(repeat.bonus).toBe(40);
    expect(repeat.label).toContain('360°');
  });
});

describe('stunts persistence & lifecycle', () => {
  it('persists completed jump IDs in localStorage-compatible storage and awards Acorns', () => {
    const storage = createMemoryStorage();
    const earned: number[] = [];
    const scene = new THREE.Scene();
    const hud = {
      setWorld: vi.fn(),
      set: vi.fn(),
      toast: vi.fn(),
      banner: vi.fn(),
      setObjective: vi.fn(),
      setVisible: vi.fn(),
      callout: vi.fn(),
    } as unknown as Hud;
    const economy = {
      earn: (amt: number) => earned.push(amt),
    } as unknown as Economy;
    const fx = { confetti: vi.fn() } as unknown as Fx;
    const play = vi.fn();

    const stunts = createStunts(scene, hud, economy, fx, play, storage);
    expect(stunts.totalCount()).toBe(STUNT_RAMPS.length);
    expect(stunts.completedCount()).toBe(0);
    expect(stunts.blips().length).toBe(STUNT_RAMPS.length);

    const ramp = STUNT_RAMPS[0];
    const fxDir = Math.sin(ramp.yaw);
    const fzDir = Math.cos(ramp.yaw);
    const v = {
      x: ramp.x + fxDir * (ramp.length * 0.45),
      y: 0,
      z: ramp.z + fzDir * (ramp.length * 0.45),
      yaw: ramp.yaw,
      speed: 22,
      vy: 0,
      spec: { flies: false },
    } as unknown as Vehicle;
    const player = { vehicle: v } as unknown as Player;

    // Frame 1: hit lip and launch
    const launchStep = stunts.update(0.05, player, [v]);
    expect(launchStep.airborne).toBe(true);
    expect(v.vy).toBeGreaterThan(10);

    // Simulate horizontal flight until landing
    let landed = false;
    for (let i = 0; i < 60; i++) {
      v.x += fxDir * v.speed * 0.05;
      v.z += fzDir * v.speed * 0.05;
      const res = stunts.update(0.05, player, [v]);
      if (res.jumpJustLanded) {
        landed = true;
        break;
      }
    }
    expect(landed).toBe(true);
    expect(earned).toEqual([150]);
    expect(stunts.completedCount()).toBe(1);
    expect(play).toHaveBeenCalledWith('steal');
    expect(fx.confetti).toHaveBeenCalled();

    // Reloading from the same storage restores completedCount()
    const reloaded = createStunts(new THREE.Scene(), hud, economy, fx, play, storage);
    expect(reloaded.completedCount()).toBe(1);
    expect(JSON.parse(storage.getItem(STUNTS_STORAGE_KEY) ?? '[]')).toEqual([ramp.id]);
  });
});
