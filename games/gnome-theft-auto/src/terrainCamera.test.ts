import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createChaseCamera } from './camera';
import { heightAt, resetTerrainOptions, setTerrainOptions } from './terrain';
import type { InputState, World } from './types';

afterEach(() => resetTerrainOptions());

const ZERO_INPUT: InputState = {
  moveX: 0,
  moveY: 0,
  lift: 0,
  jump: false,
  fire: false,
  enterExit: false,
  switchGun: false,
  reload: false,
  radio: false,
  camYaw: 0,
  camPitch: 0,
};

describe('chase camera over the terrain', () => {
  it('stays at least 0.3 above the ground while following a target on the far slope of the test hill', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const chase = createChaseCamera(camera);
    const world = { boxes: [], half: 900 } as unknown as World;
    const targetYaw = Math.PI / 2;
    const target = { x: 575, y: heightAt(575, 30), z: 30 };

    for (let frame = 0; frame < 120; frame++) {
      chase.update(1 / 60, target, targetYaw, 'foot', { ...ZERO_INPUT }, world);
      const p = camera.position;
      expect(p.y - heightAt(p.x, p.z)).toBeGreaterThanOrEqual(0.3);
    }
  });
});
