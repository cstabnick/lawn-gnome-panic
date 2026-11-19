import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { generateWorld } from '../world';
import { createFlood } from './sim';
import { generateObstacles } from './obstacles';
import { createFloodView } from './view';
import { FLOOD, FLOOD_HILL, FLOOD_SEED, type Obstacles } from './types';

function setup(obstacles?: Obstacles) {
  const world = generateWorld(FLOOD_SEED, FLOOD_HILL);
  const flood = createFlood(world, FLOOD_SEED);
  flood.focus(0);
  for (let i = 0; i < 4; i++) flood.step(10);
  const obs = obstacles ?? generateObstacles(world, FLOOD_SEED);
  const scene = new THREE.Scene();
  const view = createFloodView(scene, world, flood, obs);
  const isl = world.islands[0];
  const cam = new THREE.Vector3(isl.cx, 20, isl.cz);
  return { world, flood, scene, view, cam, obs };
}

function waterMeshes(scene: THREE.Scene): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry.getAttribute('aInfo')) out.push(m);
  });
  return out;
}

describe('flood view', () => {
  it('builds water and object meshes without throwing, and disposes cleanly', () => {
    const { scene, view, cam, flood } = setup();
    for (let i = 0; i < 5; i++) view.update(1 / 30, flood.time, cam);
    expect(scene.children.length).toBeGreaterThan(0);

    const water = waterMeshes(scene).filter((m) => m.visible);
    expect(water.length).toBeGreaterThan(0);
    for (const m of water) {
      const arr = m.geometry.getAttribute('position').array as Float32Array;
      for (let i = 0; i < arr.length; i++) expect(Number.isFinite(arr[i])).toBe(true);
    }

    view.dispose();
    expect(scene.children.length).toBe(0);
  });

  it('draws a firing cannon jet and a geyser column with hand-made obstacles', () => {
    const world = generateWorld(FLOOD_SEED, FLOOD_HILL);
    const isl = world.islands[0];
    const obs: Obstacles = {
      cannons: [{ id: 0, island: 0, x: isl.cx, y: 10, z: isl.cz, yaw: 0, period: 6, phase: 0 }],
      geysers: [{ id: 0, island: 0, x: isl.cx + 4, y: 0, z: isl.cz, period: 8, phase: 0 }],
    };
    const { scene, view, cam } = setup(obs);
    const visibleNamed = (name: string): number => {
      let n = 0;
      scene.traverse((o) => {
        if (o.name === name && o.visible) n++;
      });
      return n;
    };
    // Cannon: start = 6 - 1.1 - 0.9 = 4, fire from 5.1 to 6. Geyser: start = 8 - 1 - 0.7 = 6.3, fire from 7.3 to 8.
    // At t = 5.5 the cannon fires and the geyser is idle: the jet shows, the column does not.
    view.update(1 / 30, 5.5, cam);
    expect(visibleNamed('flood-jet')).toBe(1);
    expect(visibleNamed('flood-column')).toBe(0);
    // At t = 7.6 the geyser fires and the cannon is idle: only the column shows.
    view.update(1 / 30, 7.6, cam);
    expect(visibleNamed('flood-jet')).toBe(0);
    expect(visibleNamed('flood-column')).toBe(1);
    // At t = 0.5 everything is idle.
    view.update(1 / 30, 0.5, cam);
    expect(visibleNamed('flood-jet')).toBe(0);
    expect(visibleNamed('flood-column')).toBe(0);
    view.dispose();
    expect(scene.children.length).toBe(0);
    expect(FLOOD.cannonRange).toBeGreaterThan(0);
  });
});
