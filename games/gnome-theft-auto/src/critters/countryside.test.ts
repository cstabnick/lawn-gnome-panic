import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps, roadDistance } from '../critters';
import { waterAt } from '../terrain';
import type { Fx, World } from '../types';
import { countrysideLife, deerWithin, HERDS } from './countryside';

const world = { boxes: [], parked: [], half: 900 } as unknown as World;
const fx = { smash() {}, spark() {} } as unknown as Fx;
const deps: CritterDeps = {
  fx, play() {}, toast() {}, callout() {}, earn() {}, steal: () => 0, hurtPlayer() {}, event() {},
};
const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 400, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world, night: 0, ...over,
});
const DEER_KINDS = ['deer', 'stag', 'fawn'];

describe('countryside herds', () => {
  it('spawns six deer herds of five and two goat flocks', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, [countrysideLife]);
    const deer = rt.list.filter((c) => DEER_KINDS.includes(c.kind));
    expect(deer.length).toBeGreaterThanOrEqual(24);
    expect(deer.length).toBeLessThanOrEqual(30);
    const goats = rt.list.filter((c) => c.kind === 'goat');
    expect(goats.length).toBeGreaterThanOrEqual(8);
    expect(HERDS.filter((h) => h.kind === 'deer')).toHaveLength(6);
  });

  it('each deer herd has exactly one stag', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, [countrysideLife]);
    for (const h of HERDS.filter((d) => d.kind === 'deer')) {
      const members = rt.inGroup(h.id);
      expect(members.filter((c) => c.kind === 'stag')).toHaveLength(1);
    }
  });

  it('no critter stands in water or next to a highway', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, [countrysideLife]);
    for (const c of rt.list) {
      if (c.kind !== 'goat' && !DEER_KINDS.includes(c.kind)) continue;
      expect(waterAt(c.x, c.z)).toBeFalsy();
      expect(roadDistance(c.x, c.z)).toBeGreaterThanOrEqual(8);
    }
  });

  it('deerWithin finds calm deer near a herd centre', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, [countrysideLife]);
    expect(rt).toBeTruthy();
    const h = HERDS.find((d) => d.id === 'herd-cloverfield')!;
    const ids = deerWithin(h.x, h.z, 60);
    expect(ids.length).toBeGreaterThan(0);
    const members = rt.inGroup(h.id);
    for (const id of ids) expect(members.some((c) => c.id === id)).toBe(true);
  });

  it('a fleeing hind makes its herd-mates flee within one update', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, [countrysideLife]);
    const h = HERDS.find((d) => d.id === 'herd-cloverfield')!;
    const members = rt.inGroup(h.id);
    const hind = members.find((c) => c.kind === 'deer')!;
    rt.scare(hind, hind.x + 5, hind.z);
    rt.update(ctx({ playerX: 0, playerZ: 400 }));
    for (const c of members) expect(c.mode).toBe('flee');
  });
});
