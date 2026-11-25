// L16: "i cannot jump over the wall into the sandpit. there is invisible wall above the ramp".
// Root cause: the sim chassis swept its circle against the buildings with `groundAt(...)` (the terrain height under the car)
// as the car's altitude, so a car flying over the sandbag wall (top = terrain + 3 m) was still blocked by it. The sweep now
// gets the chassis's real height. This test launches a car off the Fort Sandpit Wall Vault into the fort's west wall.
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { VEHICLES, BASE } from './config';
import { STUNT_RAMPS } from './stunts';
import { attachRampGround } from './ramps';
import { installFakeDom } from './testing/fakeDom';
import type { Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { createSimDrive, stepChassis } = await import('./simdrive');

const DT = 1 / 60;
const ramp = STUNT_RAMPS.find((r) => r.id === 'fort-sandpit')!;

describe('Fort Sandpit Wall Vault', () => {
  it('launches the ramp facing the fort wall, and the wall box is not taller than the visible wall', async () => {
    const restore = installFakeDom();
    try {
      const { buildWorld } = await import('./world');
      const w = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
      // The ramp launches along +x (yaw PI/2) at the west wall.
      expect(Math.sin(ramp.yaw)).toBeCloseTo(1, 6);
      const wall = w.boxes.filter((b) => b.minX < BASE.minX + 1 && b.maxX > BASE.minX - 1 && b.minZ <= ramp.z && b.maxZ >= ramp.z);
      expect(wall.length).toBe(1);
      // Wall top = terrain under it + BASE.wallHeight (+ a small slack for the terrain's slope along the wall).
      expect(wall[0].h).toBeLessThan(BASE.wallHeight + 2);

      const v = { spec: VEHICLES['zero-turn'], x: ramp.x - 40, y: 0, z: ramp.z, yaw: ramp.yaw, speed: 30, vy: 0, driver: 'player', steerVis: 0, object: new THREE.Group(), id: 1, health: 100, maxHealth: 100 } as unknown as Vehicle;
      const sd = createSimDrive(v);
      attachRampGround(sd.ctrl);
      v.sim = sd;
      const world = { boxes: w.boxes, half: 2000 } as unknown as World;
      const input = { steer: 0, throttle: 1, brake: 0, handbrake: 0, source: 'keyboard' as const };
      let maxX = -Infinity;
      let top = -Infinity;
      for (let i = 0; i < 6 * 60; i++) {
        stepChassis(v, sd, input, DT, world);
        maxX = Math.max(maxX, v.x);
        top = Math.max(top, sd.ctrl.body.pos.y);
      }
      // It flew over the wall (x 340) and carried on into the fort.
      expect(top).toBeGreaterThan(wall[0].h);
      expect(maxX).toBeGreaterThan(BASE.minX + 3);
    } finally {
      restore();
    }
  });
});
