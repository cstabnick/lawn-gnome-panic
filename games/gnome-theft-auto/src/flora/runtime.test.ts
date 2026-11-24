// createFlora: vehicles mow plants instead of being stopped by them, slow only on big shrubs, count only the player's
// mows, and cut plants regrow once the player is away.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { Box, Player, Vehicle, World } from '../types';

installFakeDom();
type Mods = {
  harvest: typeof import('./harvest');
  runtime: typeof import('./runtime');
  terrain: typeof import('../terrain');
};
let m: Mods;
beforeAll(async () => {
  m = { harvest: await import('./harvest'), runtime: await import('./runtime'), terrain: await import('../terrain') };
}, 60000);
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage?.clear(); });

function make() {
  const h = m.terrain.heightAt;
  const bed = { id: 'flower-bed', x: 0, y: h(0, 10), z: 10, yaw: 0, scale: 1 };
  const bush = { id: 'boxwood-ball', x: 0, y: h(0, 30), z: 30, yaw: 0, scale: 1 };
  const s = m.harvest.seedOf(bed)!;
  const own: Box = { minX: s.cx - s.hw, maxX: s.cx + s.hw, minZ: s.cz - s.hd, maxZ: s.cz + s.hd, h: s.y + s.h };
  const wall: Box = { minX: 99, maxX: 101, minZ: 0, maxZ: 10, h: 5 };
  m.harvest.beginPlantHarvest();
  m.harvest.addMowablePlants([bed, bush]);
  const world = { boxes: [own, wall] } as unknown as World;
  const deps = { shake: vi.fn(), increment: vi.fn(), earn: vi.fn(), toast: vi.fn() };
  const flora = m.runtime.createFlora({ scene: new THREE.Scene(), world, ui: document.createElement('div'), ...deps });
  return { flora, world, own, wall, deps };
}

function vehicle(driver: string, z = 0): Vehicle {
  return { x: 0, y: m.terrain.heightAt(0, z), z, yaw: 0, speed: 20, driver, kind: 'ride-on', exploded: false, spec: { radius: 1 } } as unknown as Vehicle;
}

function drive(f: ReturnType<typeof make>['flora'], v: Vehicle, player: Player, remote = false): void {
  for (let z = v.z; z <= 40; z += 0.4) {
    v.z = z;
    v.y = m.terrain.heightAt(0, z);
    f.update(1 / 60, remote ? [] : [v], player, remote ? [v] : undefined);
  }
}

const playerAt = (x: number, z: number, vehicle: Vehicle | null = null): Player =>
  ({ x, z, y: 0, vehicle, ragdolling: false }) as unknown as Player;

describe('flora runtime', () => {
  it('takes the plant colliders out and mows instead of blocking', () => {
    const { flora, world, own, wall, deps } = make();
    expect(world.boxes).not.toContain(own);
    expect(world.boxes).toContain(wall);
    const v = vehicle('player');
    drive(flora, v, playerAt(0, -100, v));
    expect(flora.nearest(0, 10, 3)!.state).toBe(1);
    expect(flora.nearest(0, 30, 3)!.state).toBe(1);
    expect(v.speed).toBeLessThan(20);
    expect(v.speed).toBeGreaterThan(10);
    expect(deps.shake).toHaveBeenCalled();
    expect(flora.stats().mowed).toBe(2);
    for (let k = 0; k < 130; k++) flora.update(1 / 60, [], playerAt(0, -100));
    expect(deps.increment).toHaveBeenCalledWith('gta-short-back-and-sides', 2);
  });

  it('regrows away from the player, not next to them', () => {
    const { flora } = make();
    const v = vehicle('player');
    drive(flora, v, playerAt(0, -100, v));
    const near = playerAt(0, 5);
    for (let k = 0; k < 300; k++) flora.update(1, [], near);
    expect(flora.nearest(0, 10, 3)!.state).toBe(1);
    const far = playerAt(0, -200);
    for (let k = 0; k < 136; k++) flora.update(1, [], far);
    expect(flora.nearest(0, 10, 3)!.state).toBe(0);
    expect(flora.nearest(0, 30, 3)!.state).toBe(0);
  });

  it('traffic mows without counting; remote vehicles mow without being slowed', () => {
    const a = make();
    drive(a.flora, vehicle('npc'), playerAt(0, -100));
    expect(a.flora.nearest(0, 10, 3)!.state).toBe(1);
    expect(a.flora.stats().mowed).toBe(0);
    const b = make();
    const r = vehicle('remote');
    drive(b.flora, r, playerAt(0, -100), true);
    expect(b.flora.nearest(0, 30, 3)!.state).toBe(1);
    expect(r.speed).toBe(20);
  });

  it('a parked vehicle mows nothing; trainer helpers return counts', () => {
    const { flora } = make();
    const v = vehicle('player', 10);
    for (let k = 0; k < 60; k++) flora.update(1 / 60, [v], playerAt(0, -100, v));
    expect(flora.nearest(0, 10, 3)!.state).toBe(0);
    expect(flora.mowAllNear(0, 20, 30)).toBe(2);
    expect(flora.regrowAll()).toBe(2);
    expect(flora.stats().standing).toBe(2);
  });
});
