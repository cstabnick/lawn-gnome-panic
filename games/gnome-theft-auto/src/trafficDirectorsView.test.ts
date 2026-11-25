// The traffic-director wardens (E28): one group per director at its junction, far wardens hidden, near wardens turn to
// the road they hold, and dispose removes them from the scene.
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { DIRECTORS, directorFacing } from './trafficDirectors';

vi.mock('./terrain', () => ({ heightAt: () => 0 }));

const { createDirectorViews } = await import('./trafficDirectorsView');

/** The gnome object of a warden group: the only child of its lifted group (the podium is the first child). */
const gnomeOf = (g: THREE.Object3D): THREE.Object3D => g.children[g.children.length - 1].children[0];

const wardens = (scene: THREE.Scene): THREE.Object3D[] => scene.children.filter((c) => c.name.startsWith('director:'));

const wrapDiff = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

describe('createDirectorViews', () => {
  it('adds one group per director at its junction', () => {
    const scene = new THREE.Scene();
    const views = createDirectorViews(scene);
    expect(wardens(scene)).toHaveLength(DIRECTORS.length);
    for (const d of DIRECTORS) {
      const g = scene.getObjectByName(`director:${d.id}`);
      expect(g, d.id).toBeDefined();
      expect(g!.position.x).toBeCloseTo(d.x, 6);
      expect(g!.position.z).toBeCloseTo(d.z, 6);
    }
    views.dispose();
  });

  it('hides wardens far from the player and shows the near ones', () => {
    const scene = new THREE.Scene();
    const views = createDirectorViews(scene);
    views.update(0.016, 1000, 1e6, 1e6);
    for (const g of wardens(scene)) expect(g.visible).toBe(false);

    const d = DIRECTORS[0];
    views.update(0.016, 1000, d.x, d.z);
    expect(scene.getObjectByName(`director:${d.id}`)!.visible).toBe(true);
    views.dispose();
  });

  it('turns the gnome toward directorFacing within a few frames', () => {
    const scene = new THREE.Scene();
    const views = createDirectorViews(scene);
    const d = DIRECTORS[0];
    const t = 1000;
    for (let i = 0; i < 10; i++) views.update(0.1, t, d.x, d.z);
    const g = scene.getObjectByName(`director:${d.id}`)!;
    expect(wrapDiff(gnomeOf(g).rotation.y, directorFacing(d, t))).toBeLessThan(0.05);
    views.dispose();
  });

  it('dispose removes every warden from the scene', () => {
    const scene = new THREE.Scene();
    const views = createDirectorViews(scene);
    views.dispose();
    expect(wardens(scene)).toHaveLength(0);
  });
});
