// Body paint: cached finish materials, and paintBody on a real vehicle prefab. Run: npx vitest run packages/glaze/src/paint.test.ts
import { buildPrefab } from '@lawn/prefabs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FINISH_IDS } from './ids';
import { finishMaterial, paintBody } from './paint';
import type { FinishId, Loadout } from './types';

const PAINT = 0x2f64c9;

function loadout(finish: FinishId, paint = PAINT): Loadout {
  return {
    paint, finish, decal: 'none', decalColor: 0, decalNumber: 0, tyre: 'stock', rim: 'stock', rimColor: 0, wheelSize: 1,
    camberFront: 0, camberRear: 0, rideHeight: 0, steer: 'stock', lamp: 'stock', beam: 'warm', spoiler: 'none', seat: 'none',
    ornament: 'none', extras: [], underglow: null,
  };
}

describe('finishMaterial', () => {
  it('returns the same object for the same key', () => {
    expect(finishMaterial('gloss', PAINT, false)).toBe(finishMaterial('gloss', PAINT, false));
  });

  it('returns a different object for a different finish, colour or vertexColors flag', () => {
    const base = finishMaterial('gloss', PAINT, false);
    expect(finishMaterial('matte', PAINT, false)).not.toBe(base);
    expect(finishMaterial('gloss', 0xd8342c, false)).not.toBe(base);
    expect(finishMaterial('gloss', PAINT, true)).not.toBe(base);
  });

  for (const finish of FINISH_IDS) {
    it(`'${finish}' is a material with metalness <= 0.4`, () => {
      const mat = finishMaterial(finish, PAINT, false);
      expect(mat.isMaterial).toBe(true);
      expect((mat as THREE.MeshStandardMaterial).metalness).toBeLessThanOrEqual(0.4);
    });
  }

  for (const finish of ['gloss', 'matte', 'metallic', 'pearl', 'chameleon'] as const) {
    it(`'${finish}' is painted the paint colour`, () => {
      const mat = finishMaterial(finish, PAINT, false) as THREE.MeshStandardMaterial;
      expect(mat.color.getHex()).toBe(PAINT);
    });
  }

  it('candy and primer are tinted, not the raw paint', () => {
    for (const finish of ['candy', 'primer'] as const) {
      const mat = finishMaterial(finish, PAINT, false) as THREE.MeshStandardMaterial;
      expect(mat.color.getHex()).not.toBe(PAINT);
      expect(mat.isMaterial).toBe(true);
    }
  });

  it('chameleon has an onBeforeCompile hook and a cache key', () => {
    const mat = finishMaterial('chameleon', PAINT, false);
    expect(typeof mat.onBeforeCompile).toBe('function');
    expect(typeof mat.customProgramCacheKey).toBe('function');
    expect(mat.customProgramCacheKey()).toBe('glaze-chameleon');
  });
});

describe('paintBody', () => {
  it('paints every tint mesh of a vehicle with the finish, idempotently, and leaves other meshes alone', () => {
    const root = buildPrefab('ride-on-mower', { tint: 0xffffff, separateTint: true });
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
    const plain = root.children[root.children.length - 1] as THREE.Mesh;
    const plainMaterial = plain.material;

    const tints: THREE.Mesh[] = [];
    root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.tint === true) tints.push(o);
    });
    expect(tints.length).toBeGreaterThan(0);
    const flags = tints.map((m) => (m.material as THREE.Material).vertexColors === true);

    const l = { ...loadout('metallic') };
    paintBody(root, l);
    tints.forEach((mesh, i) => {
      expect(mesh.material).toBe(finishMaterial('metallic', PAINT, flags[i]));
    });

    const after = tints.map((m) => m.material);
    paintBody(root, l);
    tints.forEach((mesh, i) => expect(mesh.material).toBe(after[i]));

    expect(plain.material).toBe(plainMaterial);
  });
});
