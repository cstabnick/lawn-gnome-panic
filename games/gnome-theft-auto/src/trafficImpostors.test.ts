import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { IMPOSTOR_CAPACITY, createTrafficImpostors, type ImpostorPose } from './trafficImpostors';
import type { VehicleKind } from './types';

const pose = (kind: VehicleKind, x: number, z: number, yaw = 0): ImpostorPose => ({ kind, tint: 0xff0000, x, y: 0, z, yaw });

/** The InstancedMeshes in a set, by name. */
function meshesNamed(object: THREE.Group, name: string): THREE.InstancedMesh[] {
  const out: THREE.InstancedMesh[] = [];
  object.traverse((o) => {
    if (o instanceof THREE.InstancedMesh && o.name === name) out.push(o);
  });
  return out;
}

describe('trafficImpostors', () => {
  it('draws each kind in one or two calls with the right instance count and position', () => {
    const scene = new THREE.Scene();
    const imp = createTrafficImpostors(scene);
    imp.update([pose('ride-on', 10, 20), pose('ride-on', 11, 20), pose('ride-on', 12, 21), pose('combine', 0, 0), pose('combine', 5, 5)]);
    expect(imp.drawCalls()).toBeGreaterThanOrEqual(2);
    expect(imp.drawCalls()).toBeLessThanOrEqual(4);
    const rideOn = meshesNamed(imp.object, 'impostor:ride-on');
    expect(rideOn.length).toBeGreaterThan(0);
    for (const mesh of rideOn) expect(mesh.count).toBe(3);
    const m = new THREE.Matrix4();
    rideOn[0].getMatrixAt(0, m);
    const p = new THREE.Vector3().setFromMatrixPosition(m);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(20);
    imp.dispose();
  });

  it('hides every impostor when given no poses', () => {
    const imp = createTrafficImpostors(new THREE.Scene());
    imp.update([pose('ride-on', 1, 1), pose('combine', 2, 2)]);
    expect(imp.drawCalls()).toBeGreaterThan(0);
    imp.update([]);
    expect(imp.drawCalls()).toBe(0);
    imp.dispose();
  });

  it('builds every kind, including one whose prefab may be missing', () => {
    const kinds: VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine', 'lowrider', 'snail-coach', 'mulch-spreader', 'hoa-van', 'pot-rod'];
    const imp = createTrafficImpostors(new THREE.Scene());
    expect(() => imp.update(kinds.map((k) => pose(k, 0, 0)))).not.toThrow();
    expect(meshesNamed(imp.object, 'impostor:pot-rod').length).toBeGreaterThan(0);
    imp.dispose();
  });

  it('caps one kind at IMPOSTOR_CAPACITY instances', () => {
    const imp = createTrafficImpostors(new THREE.Scene());
    const poses = Array.from({ length: 70 }, (_, i) => pose('ride-on', i, 0));
    expect(() => imp.update(poses)).not.toThrow();
    for (const mesh of meshesNamed(imp.object, 'impostor:ride-on')) expect(mesh.count).toBe(IMPOSTOR_CAPACITY);
    imp.dispose();
  });

  it('removes its group from the scene on dispose', () => {
    const scene = new THREE.Scene();
    const imp = createTrafficImpostors(scene);
    expect(scene.children).toContain(imp.object);
    imp.dispose();
    expect(scene.children).not.toContain(imp.object);
  });
});
