import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { buildFittings } from './fittings';
import { defaultLoadout } from './loadout';
import type { Loadout, VehicleMounts } from './types';

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

describe('buildFittings: grilles, bumpers, canopies, mirrors, exhausts and new extras', () => {
  // Only the new slots set; the stock-era ones off so the counts are the new holders alone.
  const base = { ...defaultLoadout(0xd8342c), spoiler: 'none' as const, seat: 'none' as const, ornament: 'none' as const, extras: [] };
  const at = (group: THREE.Group, p: readonly number[]): THREE.Object3D | undefined =>
    group.children.find((c) => c.position.distanceTo(new THREE.Vector3(p[0], p[1], p[2])) < 1e-6);

  it('mount-less vehicle and unknown ids add nothing and never throw', () => {
    const bare: VehicleMounts = { ...mounts, points: {} };
    const full: Loadout = {
      ...base,
      grille: 'picket', bumper: 'chrome', canopy: 'umbrella', mirror: 'wing', exhaust: 'stack',
      extras: ['fairylights', 'toolbox', 'cooler', 'windsock'],
    };
    let f: ReturnType<typeof buildFittings> | undefined;
    expect(() => { f = buildFittings(bare, full); }).not.toThrow();
    expect(f?.group.children.length).toBe(0);
    expect(() => buildFittings(mounts, { ...base, grille: 'nope' as Loadout['grille'], extras: ['windsock'] })).not.toThrow();
  });

  it.skipIf(!getPrefab('glaze-grille-picket'))('grille sits at the front point, lowered and nudged forward', () => {
    const f = buildFittings(mounts, { ...base, grille: 'picket' });
    expect(at(f.group, [0, 0.22, 1.02])).toBeDefined();
  });

  it.skipIf(!getPrefab('glaze-bumper-chrome'))('bumper sits at the front point, lowered', () => {
    const f = buildFittings(mounts, { ...base, bumper: 'chrome' });
    expect(at(f.group, [0, 0.1, 1.02])).toBeDefined();
  });

  it.skipIf(!getPrefab('glaze-canopy-umbrella'))('canopy sits at the top point', () => {
    const f = buildFittings(mounts, { ...base, canopy: 'umbrella' });
    expect(at(f.group, [0, 0.8, 0])).toBeDefined();
  });

  it.skipIf(!getPrefab('glaze-mirror-wing'))('mirror pair: one prefab on each side, the right one mirrored', () => {
    const f = buildFittings(mounts, { ...base, mirror: 'wing' });
    expect(f.group.children.length).toBe(2);
    const mirrored = f.group.children.filter((c) => c.scale.x < 0);
    expect(mirrored.length).toBe(1);
    expect(at(f.group, [0.6, 0.5, 0.3])?.scale.x).toBeGreaterThan(0);
    expect(at(f.group, [-0.6, 0.5, 0.3])?.scale.x).toBeLessThan(0);
  });

  it.skipIf(!getPrefab('glaze-exhaust-stack'))('a single exhaust is pushed to the right; twin stays central', () => {
    const single = buildFittings(mounts, { ...base, exhaust: 'stack' });
    expect(at(single.group, [-0.3, 0.4, -1])).toBeDefined();
    const twin = buildFittings(mounts, { ...base, exhaust: 'twin' });
    expect(at(twin.group, [0, 0.4, -1])).toBeDefined();
  });

  it.skipIf(!getPrefab('glaze-extra-toolbox'))('new extras sit at their points', () => {
    const f = buildFittings(mounts, { ...base, extras: ['fairylights', 'toolbox', 'cooler', 'windsock'] });
    expect(f.group.children.length).toBe(4);
    expect(at(f.group, [0, 0.8, 0])).toBeDefined();
    expect(at(f.group, [-0.28, 0.52, -1.02])).toBeDefined();
    expect(at(f.group, [0.18, 0.52, -0.88])).toBeDefined();
    expect(at(f.group, [-0.42, 0.5, -1])).toBeDefined();
  });

  it('the full new-slot loadout builds without throwing whatever prefabs exist', () => {
    const full: Loadout = {
      ...base, grille: 'picket', bumper: 'chrome', canopy: 'umbrella', mirror: 'wing', exhaust: 'twin',
      extras: ['fairylights', 'toolbox', 'cooler', 'windsock'],
    };
    expect(() => buildFittings(mounts, full)).not.toThrow();
  });
});
