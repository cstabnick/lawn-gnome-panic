import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { traceSightlines, visibleFraction } from './sightlines';

function straightCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 40)]);
}

function box(name: string, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), new THREE.MeshBasicMaterial());
  mesh.position.set(x, y, z);
  mesh.name = name;
  mesh.updateMatrixWorld(true);
  return mesh;
}

describe('traceSightlines', () => {
  it('reports samples blocked by a wall in front of the rail', () => {
    const curve = straightCurve();
    const wall = box('test-wall', 0, 1.5, 10);
    const report = traceSightlines(curve, [wall], { cameraHeight: 0, cameraBack: 0 });
    expect(report.blockedBy['test-wall']).toBeGreaterThan(0);
    expect(report.visible).toBeLessThan(report.samples);
  });

  it('ignores occluders that are off the sight line', () => {
    const curve = straightCurve();
    const far = box('far', 8, 1.5, 10);
    const report = traceSightlines(curve, [far], { cameraHeight: 0, cameraBack: 0 });
    expect(report.blockedBy['far']).toBeUndefined();
    expect(visibleFraction(report)).toBe(1);
  });

  it('is fully visible with no occluders', () => {
    const report = traceSightlines(straightCurve(), []);
    expect(visibleFraction(report)).toBe(1);
    expect(report.blockedBy).toEqual({});
  });
});
