import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import { createCourtRender } from './render';
import { createCourtView } from './view';
import { COURT, type PickupView } from './types';

const look = { hat: 0xff0000, shirt: 0x00ff00, pants: 0x0000ff, beard: null } as GnomeLook;

function fakeView(controlled: 0 | 1 = 0): PickupView {
  const names = ['You', 'Pansy Rebound', 'Cardoon "Swish" Trowelly', 'Lintel Crossover'];
  return {
    gnomes: names.map((name, i) => ({
      x: COURT.x + i - 1.5, y: 0, z: COURT.z + i * 0.5, yaw: 0, speed: 0, hasBall: i === 0, air: i === 3,
      slot: i as 0 | 1 | 2 | 3, name,
    })),
    ball: { x: COURT.x + 2, y: 1.2, z: COURT.z + 1 },
    score: [0, 0], target: 11, t: 0, phase: 'live', charge: 0, turbo: 100, controlled,
  };
}

const at = (root: THREE.Object3D, x: number, z: number) =>
  root.children.filter((c) => c.visible && Math.abs(c.position.x - x) < 1e-6 && Math.abs(c.position.z - z) < 1e-6);

describe('court render', () => {
  it('draws four gnomes and the ball, and hides them for null', () => {
    const scene = new THREE.Scene();
    const r = createCourtRender(scene, look);
    const v = fakeView();
    r.game(v, 0.016);
    const root = scene.getObjectByName('court-render')!;
    for (const g of v.gnomes) expect(at(root, g.x, g.z).length).toBeGreaterThan(0);
    const ball = root.children.filter((c) => c.visible && Math.abs(c.position.y - 1.2) < 1e-6 && Math.abs(c.position.x - v.ball.x) < 1e-6);
    expect(ball.length).toBe(1);
    r.game(null, 0.016);
    expect(root.children.filter((c) => c.visible).length).toBe(0);
    r.dispose();
  });

  it('puts the ring under the controlled gnome', () => {
    const scene = new THREE.Scene();
    const r = createCourtRender(scene, look);
    const ring = (): THREE.Object3D => scene.getObjectByName('court-ring')!;
    r.game(fakeView(0), 0.016);
    expect(ring().visible).toBe(true);
    expect(ring().position.x).toBeCloseTo(COURT.x - 1.5, 5);
    r.game(fakeView(1), 0.016);
    expect(ring().position.x).toBeCloseTo(COURT.x - 0.5, 5);
    r.dispose();
  });

  it('shows the shootaround ball and hides it', () => {
    const scene = new THREE.Scene();
    const r = createCourtRender(scene, look);
    r.ball({ x: COURT.x, y: 1, z: COURT.z }, 0.016);
    const root = scene.getObjectByName('court-render')!;
    expect(root.children.filter((c) => c.visible).length).toBe(2); // ball + shadow
    r.ball(null, 0.016);
    expect(root.children.filter((c) => c.visible).length).toBe(0);
    r.dispose();
  });
});

describe('court view', () => {
  it('sits south of the court while a game is on', () => {
    const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 1000);
    const view = createCourtView(camera);
    expect(view.apply(1, fakeView())).toBe(true);
    for (let i = 0; i < 60; i++) view.apply(0.05, fakeView());
    expect(camera.position.z).toBeGreaterThan(COURT.z);
    expect(camera.position.z).toBeCloseTo(COURT.z + 13, 3);
    expect(view.apply(0.016, null)).toBe(false);
  });

  it('pulls back on portrait screens', () => {
    const camera = new THREE.PerspectiveCamera(60, 0.5, 0.1, 1000);
    const view = createCourtView(camera);
    for (let i = 0; i < 60; i++) view.apply(0.05, fakeView());
    expect(camera.position.z).toBeCloseTo(COURT.z + 18, 3);
  });
});
