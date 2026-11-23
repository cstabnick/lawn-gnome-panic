import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { createEconomy } from './economy';
import { GUN_STORE, createGunStore } from './gunStore';
import type { Hud, Player } from './types';

// gunSounds.ts loads audio.ts, which needs a window at import time.
vi.mock('./audio', () => ({ play: () => undefined, getAudioOutput: () => null }));

installFakeDom();

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
}

function makeStore() {
  const hud = { toast() {} } as unknown as Hud;
  return createGunStore({
    scene: new THREE.Scene(),
    ui: {} as HTMLElement,
    hud,
    economy: createEconomy(fakeStorage()),
    play() {},
    currentGun: () => 'pistol',
    heat: () => 0,
    showroom() {},
    onFit() {},
  });
}

/** The counter's serve point in world coordinates, worked out the same way the store turns prefab units. */
function servePoint(): { x: number; z: number } {
  const S = GUN_STORE.scale;
  const c = Math.cos(GUN_STORE.yaw);
  const s = Math.sin(GUN_STORE.yaw);
  const lx = 0;
  const lz = -0.1;
  return {
    x: GUN_STORE.x + S * (lx * c + lz * s),
    z: GUN_STORE.z + S * (-lx * s + lz * c),
  };
}

function gnomeAt(x: number, z: number): Player {
  return { x, z, vehicle: null, airborne: false } as unknown as Player;
}

describe('gunStore', () => {
  it('has four finite storefront boxes, each with positive extent, near the store', () => {
    const { boxes } = makeStore();
    expect(boxes).toHaveLength(4);
    for (const b of boxes) {
      for (const v of [b.minX, b.maxX, b.minZ, b.maxZ, b.h]) expect(Number.isFinite(v)).toBe(true);
      expect(b.minX).toBeLessThan(b.maxX);
      expect(b.minZ).toBeLessThan(b.maxZ);
      expect(Math.abs(b.minX - GUN_STORE.x)).toBeLessThanOrEqual(8);
      expect(Math.abs(b.maxX - GUN_STORE.x)).toBeLessThanOrEqual(8);
      expect(Math.abs(b.minZ - GUN_STORE.z)).toBeLessThanOrEqual(8);
      expect(Math.abs(b.maxZ - GUN_STORE.z)).toBeLessThanOrEqual(8);
    }
  });

  it('has the counter (the last box) lower than the walls', () => {
    const { boxes } = makeStore();
    const counter = boxes[3];
    for (const wall of boxes.slice(0, 3)) expect(counter.h).toBeLessThan(wall.h);
  });

  it('prompts at the counter serve point and not 10 units away', () => {
    const store = makeStore();
    const { x, z } = servePoint();
    expect(store.prompt(gnomeAt(x, z))).toBe('Shop mods at Ammu-Gnation');
    expect(store.prompt(gnomeAt(x + 10, z))).toBeNull();
  });

  it('does not prompt in a vehicle or while airborne', () => {
    const store = makeStore();
    const { x, z } = servePoint();
    expect(store.prompt({ x, z, vehicle: {}, airborne: false } as unknown as Player)).toBeNull();
    expect(store.prompt({ x, z, vehicle: null, airborne: true } as unknown as Player)).toBeNull();
  });

  it('reports the map blip at the store', () => {
    const store = makeStore();
    expect(store.blip).toEqual({ x: GUN_STORE.x, z: GUN_STORE.z, color: '#ff7a1a' });
    expect(store.isOpen()).toBe(false);
  });
});
