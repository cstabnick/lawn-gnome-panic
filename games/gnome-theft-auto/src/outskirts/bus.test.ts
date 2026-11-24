// The Pebblewick Hopper's pure rules and ride flow. Run from games/gnome-theft-auto: npx vitest run src/outskirts/bus.test.ts
import type * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { ROAD_LINES, ROAD_WIDTH } from '../config';
import type { Economy } from '../economy';
import type { Box, Hud, World } from '../types';
import { TOWN } from './town';

installFakeDom();
const { createTownBus, turftonPostSpot } = await import('./bus');

const ROAD_CLEAR = ROAD_WIDTH / 2 + 0.75;

// A spawn in the middle of a city block, away from every road line.
const spawn = { x: (ROAD_LINES[0] + ROAD_LINES[1]) / 2, z: (ROAD_LINES[0] + ROAD_LINES[1]) / 2, yaw: 0.7 };

const offRoads = (x: number, z: number): boolean =>
  ROAD_LINES.every((l) => Math.abs(x - l) > ROAD_CLEAR && Math.abs(z - l) > ROAD_CLEAR);

function fakeBus(spendOk: boolean) {
  const world = { spawn, boxes: [] } as unknown as World;
  const spend = vi.fn(() => spendOk);
  const economy = { state: () => ({ acorns: 100 }), spend } as unknown as Economy;
  const toast = vi.fn();
  const hud = { toast } as unknown as Hud;
  const ui = { appendChild: vi.fn(), removeChild: vi.fn() } as unknown as HTMLElement;
  const scene = { add: vi.fn() } as unknown as THREE.Scene;
  const teleport = vi.fn();
  const bus = createTownBus({ scene, ui, world, hud, economy, play: () => {}, teleport });
  return { bus, spend, toast, teleport };
}

describe('turftonPostSpot', () => {
  it('starts at spawn + [3, -4] when nothing is in the way', () => {
    expect(turftonPostSpot(spawn, [])).toEqual({ x: spawn.x + 3, z: spawn.z - 4 });
  });

  it('avoids a box on the first candidate and takes the next clear offset', () => {
    const first = turftonPostSpot(spawn, []);
    const box: Box = { minX: first.x - 1, maxX: first.x + 1, minZ: first.z - 1, maxZ: first.z + 1, h: 3 };
    const next = turftonPostSpot(spawn, [box]);
    expect(next).not.toEqual(first);
    expect(next).toEqual({ x: spawn.x - 3, z: spawn.z - 4 });
  });

  it('keeps clear of every road line', () => {
    const nearRoad = { x: ROAD_LINES[0] + 2, z: spawn.z, yaw: 0 };
    const p = turftonPostSpot(nearRoad, []);
    expect(offRoads(p.x, p.z)).toBe(true);
  });
});

describe('createTownBus', () => {
  it('prompts at the Pebblewick stop and at the Turfton post, and nowhere else', () => {
    const { bus } = fakeBus(true);
    const post = turftonPostSpot(spawn, []);
    expect(bus.prompt(TOWN.busStop.x, TOWN.busStop.z)).toBe('Ride the Pebblewick Hopper to Turfton (8 Acorns)');
    expect(bus.prompt(post.x, post.z)).toBe('Ride the Pebblewick Hopper to Pebblewick (8 Acorns)');
    expect(bus.prompt(TOWN.busStop.x + 50, TOWN.busStop.z)).toBeNull();
  });

  it('refuses the ride when the fare is not paid', () => {
    const { bus, spend, toast, teleport } = fakeBus(false);
    expect(bus.interact(TOWN.busStop.x, TOWN.busStop.z)).toBe(true);
    expect(spend).toHaveBeenCalledWith(8, 'Pebblewick Hopper');
    expect(toast).toHaveBeenCalledWith('The Hopper driver wants 8 Acorns.');
    expect(bus.busy()).toBe(false);
    for (let i = 0; i < 4; i++) bus.update(0.5);
    expect(teleport).not.toHaveBeenCalled();
  });

  it('rides to Turfton: busy during the fade, one teleport to the post side, then free', () => {
    const { bus, teleport } = fakeBus(true);
    const post = turftonPostSpot(spawn, []);
    expect(bus.interact(TOWN.busStop.x, TOWN.busStop.z)).toBe(true);
    expect(bus.busy()).toBe(true);
    for (let i = 0; i < 4; i++) bus.update(0.5);
    expect(teleport).toHaveBeenCalledTimes(1);
    const [x, z, yaw] = teleport.mock.calls[0] as number[];
    const d = Math.hypot(spawn.x - post.x, spawn.z - post.z);
    expect(x).toBeCloseTo(post.x + ((spawn.x - post.x) / d) * 1.5, 6);
    expect(z).toBeCloseTo(post.z + ((spawn.z - post.z) / d) * 1.5, 6);
    expect(yaw).toBe(spawn.yaw);
    expect(bus.busy()).toBe(false);
  });

  it('exposes the Turfton post as a blip and as its collider', () => {
    const { bus } = fakeBus(true);
    const post = turftonPostSpot(spawn, []);
    expect(bus.blips()).toEqual([{ x: post.x, z: post.z, color: '#d9a441', label: 'Pebblewick Hopper' }]);
    expect(bus.boxes).toHaveLength(1);
    expect(bus.boxes[0].minX).toBeLessThan(post.x);
    expect(bus.boxes[0].maxX).toBeGreaterThan(post.x);
  });
});
