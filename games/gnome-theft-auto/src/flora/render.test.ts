import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { seedOf } from './harvest';
import { buildPlantRender } from './render';
import type { PlantSeed, PlantStore } from './types';

function storeOf(seeds: PlantSeed[]): PlantStore {
  const n = seeds.length;
  return {
    count: n, seeds,
    cx: Float32Array.from(seeds.map((s) => s.cx)), cz: Float32Array.from(seeds.map((s) => s.cz)),
    r: Float32Array.from(seeds.map((s) => s.r)), kind: Uint8Array.from(seeds.map((s) => s.kind)),
    state: new Uint8Array(n), t: new Float32Array(n), wait: new Float32Array(n),
    active: new Int32Array(n), activeAt: new Int32Array(n).fill(-1), activeCount: 0,
    cell: 4, ox: 0, oz: 0, nx: 1, nz: 1, maxR: 0, cellStart: new Int32Array(2), cellItems: new Int32Array(0),
  };
}

const seeds = [
  seedOf({ id: 'flower-bed', x: 10, y: 0, z: 10, yaw: 0.5, scale: 1 })!,
  seedOf({ id: 'flower-bed', x: 20, y: 0, z: 12, yaw: 0, scale: 1 })!,
  seedOf({ id: 'boxwood-ball', x: 300, y: 0, z: 300, yaw: 0, scale: 1 })!,
];

/** The instanced mesh and slot of a plant: the mesh whose instance at `slot` sits at the plant. */
function findInstance(root: THREE.Group, x: number, z: number): { mesh: THREE.InstancedMesh; slot: number } {
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (const g of root.children) {
    for (const c of g.children) {
      const mesh = c as THREE.InstancedMesh;
      for (let s = 0; s < mesh.count; s++) {
        mesh.getMatrixAt(s, m);
        p.setFromMatrixPosition(m);
        if (Math.abs(p.x - x) < 0.5 && Math.abs(p.z - z) < 0.5) return { mesh, slot: s };
      }
    }
  }
  throw new Error('instance not found');
}

describe('flora render', () => {
  it('builds one cell group per variant and cell, owned by the culler', () => {
    expect(seeds.every(Boolean)).toBe(true);
    const r = buildPlantRender(storeOf(seeds));
    expect(r.root.userData.cullCells).toBe(true);
    expect(r.root.children.length).toBe(2);
    expect(r.meshCount()).toBeGreaterThanOrEqual(2);
    const counts = r.root.children.map((g) => (g.children[0] as THREE.InstancedMesh).count).sort();
    expect(counts).toEqual([1, 2]);
  });

  it('pose rewrites one instance and flags only its range', () => {
    const r = buildPlantRender(storeOf(seeds));
    const { mesh, slot } = findInstance(r.root, 10, 10);
    const m = new THREE.Matrix4();
    r.pose(0, 1);
    mesh.getMatrixAt(slot, m);
    const full = m.elements[5];
    mesh.instanceMatrix.clearUpdateRanges();
    r.pose(0, 0.5);
    mesh.getMatrixAt(slot, m);
    expect(m.elements[5]).toBeCloseTo(full * 0.5, 5);
    expect(mesh.instanceMatrix.updateRanges[0]).toEqual({ start: slot * 16, count: 16 });
    r.pose(0, 1, 0.3, 0);
    const leaned = new THREE.Matrix4();
    mesh.getMatrixAt(slot, leaned);
    r.pose(0, 1);
    mesh.getMatrixAt(slot, m);
    expect(leaned.equals(m)).toBe(false);
  });
});
