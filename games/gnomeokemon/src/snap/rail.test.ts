import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { railSections, TUBE_Z, FORD_Z } from './rail';

// Same control points as createLawnCurve() in world.ts. Local copy so the test
// does not import world.ts (it pulls in the prefab registry).
function specCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 18),
    new THREE.Vector3(-4.5, 0.3, 11),
    new THREE.Vector3(-1.5, 0.9, 2),
    new THREE.Vector3(5.2, 1.6, -6),
    new THREE.Vector3(2.0, 1.2, -15),
    new THREE.Vector3(-5.2, 1.4, -22),
    new THREE.Vector3(0, 0, -29),
  ]);
}

describe('railSections', () => {
  const curve = specCurve();
  const sections = railSections(curve);

  it('ford range is non-empty and inside (0, 1)', () => {
    const [u0, u1] = sections.ford;
    expect(u1).toBeGreaterThan(u0);
    expect(u0).toBeGreaterThan(0);
    expect(u1).toBeLessThan(1);
  });

  it('tube range is non-empty and after the ford', () => {
    const [u0, u1] = sections.tube;
    expect(u1).toBeGreaterThan(u0);
    expect(u0).toBeGreaterThanOrEqual(sections.ford[1]);
  });

  it('ford and tube samples fall inside their z bands', () => {
    const p = new THREE.Vector3();
    curve.getPointAt(sections.ford[0], p);
    expect(p.z).toBeGreaterThanOrEqual(FORD_Z[0] - 1e-6);
    expect(p.z).toBeLessThanOrEqual(FORD_Z[1] + 1e-6);
    curve.getPointAt(sections.tube[1], p);
    expect(p.z).toBeGreaterThanOrEqual(TUBE_Z[0] - 1e-6);
    expect(p.z).toBeLessThanOrEqual(TUBE_Z[1] + 1e-6);
  });

  it('maximum y over the curve is between 1.5 and 1.7', () => {
    let maxY = -Infinity;
    const p = new THREE.Vector3();
    for (let i = 0; i <= 800; i++) {
      curve.getPointAt(i / 800, p);
      maxY = Math.max(maxY, p.y);
    }
    expect(maxY).toBeGreaterThan(1.5);
    expect(maxY).toBeLessThan(1.7);
  });

  it('y at u=0 is 0', () => {
    const p = new THREE.Vector3();
    curve.getPointAt(0, p);
    expect(p.y).toBeCloseTo(0, 6);
  });
});
