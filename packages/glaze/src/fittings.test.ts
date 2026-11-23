import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { buildFittings } from './fittings';
import { defaultLoadout } from './loadout';
import type { VehicleMounts } from './types';

const mounts: VehicleMounts = {
  width: 1.2,
  length: 2,
  height: 0.8,
  points: {
    hood: [0, 0.6, 0.8],
    front: [0, 0.3, 1],
    rear: [0, 0.5, -1],
    seat: [0, 0.4, -0.2],
    top: [0, 0.8, 0],
    side: [0.6, 0.4, 0],
    dash: [0, 0.5, 0.3],
  },
  lamps: null,
  steer: null,
  panels: [],
  wheels: [
    { index: 0, pivot: 'wheel-0', front: false, side: 1, at: [0.55, 0.3, -0.5] },
    { index: 1, pivot: 'wheel-1', front: false, side: -1, at: [-0.55, 0.3, -0.5] },
  ],
};

describe('buildFittings', () => {
  it('default loadout gives empty group and ground', () => {
    const f = buildFittings(mounts, defaultLoadout(0xd8342c));
    expect(f.group.name).toBe('glaze-fittings');
    expect(f.group.children.length).toBe(0);
    expect(f.ground.children.length).toBe(0);
  });

  it('underglow adds one additive mesh to ground and nothing to group', () => {
    const f = buildFittings(mounts, { ...defaultLoadout(0xd8342c), underglow: 0x44ff88 });
    expect(f.group.children.length).toBe(0);
    expect(f.ground.children.length).toBe(1);
    const mesh = f.ground.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    expect(mat.blending).toBe(THREE.AdditiveBlending);
    expect(mat.depthWrite).toBe(false);
  });

  it.skipIf(!getPrefab('glaze-extra-pipes'))('pipes and mudflaps place mirrored holders', () => {
    const f = buildFittings(mounts, { ...defaultLoadout(0xd8342c), extras: ['pipes', 'mudflaps'] });
    expect(f.group.children.length).toBe(4);
    const mirrored = f.group.children.filter((c) => c.scale.x < 0);
    expect(mirrored.length).toBe(2);
  });

  it.skipIf(!getPrefab('glaze-extra-pipes'))('a missing mount point skips quietly', () => {
    const bare: VehicleMounts = { ...mounts, points: {} };
    let f: ReturnType<typeof buildFittings> | undefined;
    expect(() => {
      f = buildFittings(bare, { ...defaultLoadout(0xd8342c), extras: ['pipes', 'mudflaps', 'dice'], spoiler: 'none' });
    }).not.toThrow();
    // Pipes and dice need points and are skipped; mudflaps need only the wheels.
    expect(f?.group.children.length).toBe(2);
  });

  it('update runs with and without underglow', () => {
    const plain = buildFittings(mounts, defaultLoadout(0xd8342c));
    expect(() => plain.update(1)).not.toThrow();
    const glow = buildFittings(mounts, { ...defaultLoadout(0xd8342c), underglow: 0x44ff88 });
    expect(() => glow.update(1)).not.toThrow();
    const mat = (glow.ground.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    expect(mat.opacity).toBeGreaterThanOrEqual(0.28);
    expect(mat.opacity).toBeLessThanOrEqual(0.52);
  });
});
