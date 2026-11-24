import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createChaseCamera } from './camera';
import type { CameraMode, InputState, World } from './types';

const ZERO_INPUT: InputState = {
  moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false, radio: false, camYaw: 0, camPitch: 0,
};

// One 4x4 box (h 6) centred on the origin: corner at (2, 2).
const BOX = { minX: -2, maxX: 2, minZ: -2, maxZ: 2, h: 6 };
const makeWorld = (): World => ({ boxes: [BOX], half: 900 } as unknown as World);

function sweep(mode: CameraMode, offset: number): void {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const chase = createChaseCamera(camera);
  const world = makeWorld();
  const target = { x: 2 + offset, y: 0, z: 2 + offset };
  const step = (input: InputState): void => chase.update(1 / 60, target, 0, mode, input, world);
  for (let i = 0; i < 120; i++) step({ ...ZERO_INPUT });

  const fwd = new THREE.Vector3();
  const prevPos = camera.position.clone();
  const prevDir = camera.getWorldDirection(fwd).clone();
  const turn = (2 * Math.PI) / 180;
  for (let i = 0; i < 180; i++) {
    step({ ...ZERO_INPUT, camYaw: turn });
    const p = camera.position;
    expect(p.distanceTo(prevPos), `${mode} move at frame ${i}`).toBeLessThan(0.6);
    const dir = camera.getWorldDirection(fwd).clone();
    const deg = (Math.acos(clampDot(dir.dot(prevDir))) * 180) / Math.PI;
    expect(deg, `${mode} turn at frame ${i}`).toBeLessThan(12);
    const inside = p.x > BOX.minX && p.x < BOX.maxX && p.z > BOX.minZ && p.z < BOX.maxZ && p.y < BOX.h;
    expect(inside, `${mode} inside box at frame ${i}`).toBe(false);
    prevPos.copy(p);
    prevDir.copy(dir);
  }
}

function clampDot(d: number): number {
  return Math.max(-1, Math.min(1, d));
}

describe('chase camera next to a corner', () => {
  it('on foot: no jumps or swings while the yaw sweeps 360 degrees', () => sweep('foot', 0.6));
  it('driving: no jumps or swings while the yaw sweeps 360 degrees', () => sweep('drive', 0.8));
});

describe('first person', () => {
  it('sits at the eye, follows yaw and pitch, and the chase distance returns when it goes off', () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const chase = createChaseCamera(camera);
    const world = { boxes: [], half: 900 } as unknown as World;
    const target = { x: 10, y: 0, z: 10 };
    const eye = { x: 10, y: 1.6, z: 10 };
    for (let i = 0; i < 60; i++) chase.update(1 / 60, target, 0, 'foot', { ...ZERO_INPUT }, world, { eye });
    const chaseDist = camera.position.distanceTo(new THREE.Vector3(target.x, target.y + 1.5, target.z));
    expect(chaseDist).toBeGreaterThan(3);

    chase.setFirstPerson(true);
    expect(chase.firstPerson).toBe(true);
    chase.update(1 / 60, target, 0, 'foot', { ...ZERO_INPUT, camYaw: 0.5, camPitch: 0.3 }, world, { eye });
    expect(camera.position.distanceTo(new THREE.Vector3(eye.x, eye.y, eye.z))).toBeLessThan(1e-6);
    expect(camera.near).toBeCloseTo(0.05);
    const dir = camera.getWorldDirection(new THREE.Vector3());
    const yaw = chase.yaw;
    const p = chase.pitch;
    expect(dir.x).toBeCloseTo(Math.sin(yaw) * Math.cos(p), 3);
    expect(dir.y).toBeCloseTo(-Math.sin(p), 3);
    expect(dir.z).toBeCloseTo(Math.cos(yaw) * Math.cos(p), 3);

    chase.setFirstPerson(false);
    chase.update(1 / 60, target, 0, 'foot', { ...ZERO_INPUT }, world, { eye });
    expect(camera.near).toBeCloseTo(0.1);
    const back = camera.position.distanceTo(new THREE.Vector3(target.x, target.y + 1.5, target.z));
    expect(back).toBeGreaterThan(3);
  });
});
