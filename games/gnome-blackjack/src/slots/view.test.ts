import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CLASSIC_3BAR } from './catalog';
import { buildReelDrumGeometry, reelSymbolAngle } from './view';

describe('slot reel drum geometry & symbol alignment', () => {
  it('aligns cylinder along X and puts each symbol upright at +z when rotated around X', () => {
    const r = 0.065;
    const w = 0.1;
    const n = CLASSIC_3BAR.symbols.length;
    const geo = buildReelDrumGeometry(r, w, 56);
    geo.computeBoundingBox();
    const size = geo.boundingBox!.getSize(new THREE.Vector3());
    // Width is along X, diameter is along Y and Z
    expect(size.x).toBeCloseTo(w, 3);
    expect(size.y).toBeCloseTo(r * 2, 3);
    expect(size.z).toBeCloseTo(r * 2, 3);

    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const norm = geo.attributes.normal;

    for (let symIdx = 0; symIdx < n; symIdx++) {
      const alpha = reelSymbolAngle(symIdx, n);
      const rot = new THREE.Matrix4().makeRotationX(alpha);
      const expectedV = 1 - (symIdx + 0.5) / n;

      // Find the lateral vertex closest to (+w/2, 0, +r) after rotating by alpha
      let bestDist = Infinity;
      let bestU = -1;
      let bestV = -1;
      const vPos = new THREE.Vector3();
      const vNorm = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        vNorm.fromBufferAttribute(norm, i);
        if (Math.abs(vNorm.x) > 0.5) continue; // skip end caps
        vPos.fromBufferAttribute(pos, i).applyMatrix4(rot);
        if (vPos.x < 0) continue; // check right edge (+w/2 -> u should be 1)
        const d = vPos.distanceTo(new THREE.Vector3(w / 2, 0, r));
        if (d < bestDist) {
          bestDist = d;
          bestU = uv.getX(i);
          bestV = uv.getY(i);
        }
      }

      expect(bestDist).toBeLessThan(0.01);
      expect(bestU).toBeCloseTo(1, 2);
      expect(bestV).toBeCloseTo(expectedV, 1);
    }
  });
});
