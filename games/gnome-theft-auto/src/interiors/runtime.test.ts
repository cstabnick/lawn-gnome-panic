import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { defineInterior, resetInteriorsForTest } from './registry';
import { createInteriors } from './runtime';

describe('interior runtime', () => {
  beforeEach(() => {
    resetInteriorsForTest();
    defineInterior({
      id: 't', name: 'Test', door: { x: 10, z: 10, yaw: 0 }, exit: { x: 10, z: 12, yaw: 1 },
      size: { w: 10, d: 10, h: 3 }, theme: 'shop',
      build(kit) { kit.room(); kit.door(4.8, 0, -Math.PI / 2); },
    });
  });
  const make = (heat = 0) => {
    const player = { vehicle: null, x: 0, y: 0, z: 0, health: 1 };
    const toast = vi.fn();
    const world = { boxes: [] as unknown[] };
    const it = createInteriors({
      scene: new THREE.Scene(), ui: {} as never, world: world as never, player: player as never,
      hud: { toast } as never,
      teleport: (x, z) => { player.x = x; player.z = z; },
      heat: () => heat, night: () => 0, play: () => {}, unlock: () => {},
    });
    return { it, player, toast, world };
  };
  it('enters, leaves, and keeps boxes', () => {
    const { it, player, world } = make();
    expect(it.enter('t')).toBe(true);
    it.update(0.016);
    expect(it.current()).toBe('t');
    expect(player.x).toBeGreaterThanOrEqual(5000);
    expect(world.boxes.length).toBe(4);
    it.leave();
    it.update(0.016);
    expect(it.current()).toBeNull();
    expect(player.x).toBe(10);
    expect(player.z).toBe(12);
    expect(it.enter('t')).toBe(true);
    it.update(0.016);
    expect(world.boxes.length).toBe(4);
  });
  it('refuses entry under heat', () => {
    const { it, toast } = make(1);
    expect(it.enter('t')).toBe(false);
    expect(toast).toHaveBeenCalled();
  });
});
