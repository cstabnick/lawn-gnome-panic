// Rogue sprinklers: the head is a lawn-sprinkler prefab, the spray is a low fan of droplets (never a tall cone), and a
// vehicle in the spray is launched gently.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createEncounters, SPRAY_DROPLETS, SPRAY_PEAK } from './encounters';
import type { Player, Vehicle } from './types';

// Sprinkler spots, copied from SPRINKLER_SPOTS: the first one in Turfton Park has phaseOffset 1.5 (active at t = 0).
const SPOT = { x: -25, z: 25 };

function setup() {
  const scene = new THREE.Scene();
  const noop = () => {};
  const encounters = createEncounters(
    scene,
    {} as never,
    { toast: noop } as never,
    { earn: noop } as never,
    { addHeat: noop } as never,
    { flash: noop, fire: noop } as never,
    noop,
  );
  return { scene, encounters };
}

function sprays(scene: THREE.Scene): THREE.InstancedMesh[] {
  return scene.children.filter((c): c is THREE.InstancedMesh => (c as THREE.InstancedMesh).isInstancedMesh);
}

describe('rogue sprinklers', () => {
  it('has no 4.4 m water cone left in the scene', () => {
    const { scene } = setup();
    const tall: number[] = [];
    scene.traverse((o) => {
      const g = (o as THREE.Mesh).geometry as THREE.CylinderGeometry | undefined;
      if (g?.parameters && 'height' in g.parameters && g.parameters.height >= 4) tall.push(g.parameters.height);
    });
    expect(tall).toEqual([]);
  });

  it('builds the head from the lawn-sprinkler prefab and a 24-droplet spray', () => {
    const { scene } = setup();
    expect(SPRAY_DROPLETS).toBe(24);
    const heads = scene.children.filter((c) => c.type === 'Group' && c.children.some((k) => k.name === 'lawn-sprinkler'));
    expect(heads.length).toBeGreaterThanOrEqual(4);
    expect(sprays(scene).every((s) => s.count === SPRAY_DROPLETS)).toBe(true);
  });

  it('keeps every droplet at or below the spray peak, and the spray hidden between sprays', () => {
    const { scene, encounters } = setup();
    const player = { x: 0, z: 0, vehicle: null } as unknown as Player;
    const dt = 1 / 60;
    let maxY = -Infinity;
    let sawVisible = false;
    let sawHidden = false;
    // Two full cycles, starting from the first spray of the first sprinkler.
    for (let i = 0; i < 2 * 9 * 60; i++) {
      encounters.update(dt, player, []);
      for (const s of sprays(scene)) {
        if (!s.visible) {
          sawHidden = true;
          continue;
        }
        sawVisible = true;
        const e = s.instanceMatrix.array;
        // Instance matrices are local to the mesh; column-major translation y sits at index 13.
        for (let k = 0; k < s.count; k++) maxY = Math.max(maxY, e[k * 16 + 13]);
      }
    }
    expect(sawVisible).toBe(true);
    expect(sawHidden).toBe(true);
    // Nozzle height plus the peak rise: about 1.5 m total, never the old 4.4 m cone.
    expect(maxY).toBeLessThanOrEqual(0.1 + SPRAY_PEAK + 1e-3);
    expect(maxY).toBeLessThan(1.6);
  });

  it('launches a vehicle in the spray gently (vy 4.5, not 6.5)', () => {
    const { encounters } = setup();
    const v = {
      x: SPOT.x,
      z: SPOT.z,
      vy: 0,
      exploded: false,
      spec: { flies: false, radius: 1 },
    } as unknown as Vehicle;
    const player = { x: 500, z: 500, vehicle: null } as unknown as Player;
    encounters.update(1 / 60, player, [v]);
    expect(v.vy).toBeGreaterThan(0);
    expect(v.vy).toBeLessThanOrEqual(4.5 + 1e-9);
  });
});
