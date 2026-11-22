// The player on foot stands on heightAt, not on y = 0: a walk over the test hill (Dust Flats, east highway).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { groundHeight } from './collide';
import { heightAt, resetTerrainOptions, setTerrainOptions } from './terrain';
import type { Box, InputState, Player, World } from './types';

// Browser-only audio (it touches `window` on load); the walk does not play sound.
vi.mock('./audio', () => ({ play: () => undefined }));

let restoreDom: (() => void) | undefined;
let createPlayer: typeof import('./player').createPlayer;
let DEFAULT_LOOK: typeof import('./config').DEFAULT_LOOK;

beforeAll(async () => {
  restoreDom = installFakeDom();
  ({ createPlayer } = await import('./player'));
  ({ DEFAULT_LOOK } = await import('./config'));
});

afterEach(() => {
  resetTerrainOptions();
});

afterAll(() => {
  if (typeof restoreDom === 'function') restoreDom();
});

const hill = () => setTerrainOptions({ amplitude: 1, testHill: true });

describe('groundHeight over the terrain', () => {
  it('returns the terrain height when no box is under the circle', () => {
    hill();
    const h = heightAt(545, 30);
    expect(h).toBeGreaterThan(5);
    expect(groundHeight(545, 30, 0.3, [], 100)).toBe(h);
  });

  it('returns the box top when a box is higher than the terrain', () => {
    hill();
    const h = heightAt(545, 30);
    const box: Box = { minX: 544, maxX: 546, minZ: 29, maxZ: 31, h: h + 1 };
    expect(groundHeight(545, 30, 0.3, [box], h + 5)).toBe(h + 1);
  });
});

describe('walking over the test hill', () => {
  it('reaches the far side with the feet on the ground the whole way', async () => {
    hill();
    const scene = new THREE.Scene();
    const p: Player = createPlayer(scene, DEFAULT_LOOK);
    const world = { boxes: [], half: 900 } as unknown as World;

    p.x = 470;
    p.z = 50;
    p.y = heightAt(470, 50);
    p.grounded = true;
    p.vehicle = null;

    const input = {
      moveX: 0, moveY: 1, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false,
      reload: false, radio: false, camYaw: 0, camPitch: 0,
    } as InputState;

    const waypoints = [{ x: 520, z: 30 }, { x: 620, z: 30 }];
    let wp = 0;
    let maxH = 0;
    let worst = 0;
    const frames = 60 * 60;
    for (let f = 0; f < frames && p.x <= 610; f++) {
      const t = waypoints[Math.min(wp, waypoints.length - 1)];
      if (wp < waypoints.length && Math.hypot(t.x - p.x, t.z - p.z) < 2) wp++;
      const goal = waypoints[Math.min(wp, waypoints.length - 1)];
      const camYaw = Math.atan2(goal.x - p.x, goal.z - p.z);
      p.updateFoot({ ...input, camYaw }, camYaw, 1 / 60, world);

      const h = heightAt(p.x, p.z);
      maxH = Math.max(maxH, h);
      worst = Math.max(worst, Math.abs(p.y - h));
      expect(Math.abs(p.y - h), `frame ${f} at x=${p.x.toFixed(2)}`).toBeLessThan(0.05);
    }

    expect(p.x).toBeGreaterThan(610);
    expect(maxH).toBeGreaterThan(5);
    expect(worst).toBeLessThan(0.05);
  });
});
