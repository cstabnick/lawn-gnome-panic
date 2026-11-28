import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGolfView } from './view';
import { ballWorld, newRound } from './round';

function setup() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  return { scene, camera, view: createGolfView(scene, camera) };
}

describe('golf view', () => {
  it('puts the ball on the tee and hides it for a null round', () => {
    const { scene, view } = setup();
    const s = newRound(1, 0);
    view.update(0.016, s);
    const ball = scene.getObjectByName('golf-view')!.children[0];
    const b = ballWorld(s);
    expect(ball.visible).toBe(true);
    expect(ball.position.x).toBeCloseTo(b.x, 3);
    expect(ball.position.z).toBeCloseTo(b.z, 3);
    view.update(0.016, null);
    expect(ball.visible).toBe(false);
    view.dispose();
  });

  it('drives the camera only while aiming or in flight, behind the ball', () => {
    const { camera, view } = setup();
    const s = newRound(1, 0);
    s.phase = 'walk';
    expect(view.applyCamera(s, 1)).toBe(false);
    s.phase = 'aim';
    s.aimYaw = 0.7;
    view.update(0.016, s);
    expect(view.applyCamera(s, 10)).toBe(true);
    for (let i = 0; i < 40; i++) view.applyCamera(s, 10); // the 30 m step clamp needs a few frames from the origin
    const b = ballWorld(s);
    const along = (b.x - camera.position.x) * Math.sin(0.7) + (b.z - camera.position.z) * Math.cos(0.7);
    expect(along).toBeGreaterThan(3);
    expect(view.applyCamera(null, 1)).toBe(false);
    view.dispose();
  });
});
