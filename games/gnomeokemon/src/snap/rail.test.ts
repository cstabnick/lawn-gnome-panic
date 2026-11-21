import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { railSections, TUBE_Z, FORD_Z } from './rail';
import { buildRailCurve, groundHeight, railPoints } from './levels';

// The lawn rail, from its level document (levels.ts does not import the prefab registry).
function specCurve(): THREE.CatmullRomCurve3 {
  return buildRailCurve('lawn');
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

  it('y at u=0 is the ground at the gate plus the rail lift there', () => {
    const p = new THREE.Vector3();
    curve.getPointAt(0, p);
    expect(p.y).toBeCloseTo(groundHeight('lawn', 0, 18) + railPoints('lawn')[0][2], 6);
  });
});
