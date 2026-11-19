import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildPrefab, prewarmPrefabs } from './build';
import { buildStaticPrefabs, disposeStaticBatch } from './batch';
import { createDrop } from './drop';
import { getPrefab } from './registry';

function countMeshes(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => { if (o instanceof THREE.Mesh) n++; });
  return n;
}

describe('prefab rendering pipeline', () => {
  it('bakes static parts into minimal render buckets per prefab', () => {
    const chestDef = getPrefab('wooden-chest')!;
    expect(chestDef.parts.length).toBeGreaterThan(4);

    const chest = buildPrefab(chestDef);
    expect(countMeshes(chest)).toBeLessThanOrEqual(2);

    // Every baked mesh uses vertex colours so one shared material serves the whole library.
    chest.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        expect(o.geometry.getAttribute('color')).toBeDefined();
        expect(o.geometry.getAttribute('uv')).toBeUndefined();
        expect((o.material as THREE.MeshLambertMaterial).vertexColors).toBe(true);
      }
    });
  });

  it('shares baked geometry across instances and ignores unused tint/trim', () => {
    const a = buildPrefab('stool');
    const b = buildPrefab('stool', { tint: 'red' }); // stool has no 'tint' parts, only 'trim'
    const meshA = a.children[0] as THREE.Mesh;
    const meshB = b.children[0] as THREE.Mesh;
    expect(meshA.geometry).toBe(meshB.geometry);
    expect(meshA.material).toBe(meshB.material);

    // Changing a used colour ('trim' on stool) creates a separate cached variant.
    const c = buildPrefab('stool', { trim: 'wood-light' });
    const meshC = c.children[0] as THREE.Mesh;
    expect(meshC.geometry).not.toBe(meshA.geometry);
    expect(meshC.material).toBe(meshA.material);
  });

  it('batches dozens of static prefabs into at most a few merged meshes with matrixAutoUpdate=false', () => {
    const placements = Array.from({ length: 40 }, (_, i) => ({
      id: i % 2 === 0 ? 'bar-stool' : 'cocktail-table',
      x: (i % 10) * 1.5,
      z: Math.floor(i / 10) * 1.5,
      yaw: i * 0.4,
      tint: i % 3 === 0 ? 'red' as const : 'blue' as const,
    }));

    const batch = buildStaticPrefabs(placements, { name: 'test-batch' });
    expect(batch.userData.prefabBatch).toBe(true);
    expect(batch.userData.prefabCount).toBe(40);
    expect(countMeshes(batch)).toBeLessThanOrEqual(3);

    batch.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        expect(o.matrixAutoUpdate).toBe(false);
        expect(o.geometry.boundingBox).not.toBeNull();
        expect(o.geometry.boundingSphere).not.toBeNull();
      }
    });

    // Disposing the batch should dispose its merged geometry cleanly without throwing.
    disposeStaticBatch(batch);
  });

  it('preserves point lights and world transforms in static batches', () => {
    const batch = buildStaticPrefabs([
      { id: 'campfire', x: 10, y: 0, z: -5, scale: 2 },
    ]);
    const lights: THREE.PointLight[] = [];
    batch.traverse((o) => { if (o instanceof THREE.PointLight) lights.push(o); });
    expect(lights.length).toBeGreaterThan(0);
    expect(lights[0].position.x).toBeCloseTo(10, 3);
    expect(lights[0].position.z).toBeCloseTo(-5, 3);
    disposeStaticBatch(batch);
  });

  it('prewarms prefab templates up front', () => {
    prewarmPrefabs(['iron-sword', 'wooden-chest', 'bowling-pin']);
    const a = buildPrefab('bowling-pin');
    const b = buildPrefab('bowling-pin');
    expect((a.children[0] as THREE.Mesh).geometry).toBe((b.children[0] as THREE.Mesh).geometry);
  });

  it('caches glow disc materials across drops of the same rarity colour', () => {
    const d1 = createDrop('iron-sword', { glow: 'gold' });
    const d2 = createDrop('wooden-chest', { glow: 'gold' });
    const disc1 = d1.object.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh;
    const disc2 = d2.object.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh;
    expect(disc1).toBeDefined();
    expect(disc1.material).toBe(disc2.material);
  });
});
