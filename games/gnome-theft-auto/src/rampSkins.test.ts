import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { STUNT_RAMPS } from './stunts';
import { buildRampMeshes, rampSkin } from './rampSkins';

const ramp = (id: string) => STUNT_RAMPS.find((r) => r.id === id)!;

function nearCyan(color: THREE.Color): boolean {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const deg = hsl.h * 360;
  return hsl.s > 0.3 && deg >= 180 && deg <= 195;
}

describe('rampSkin', () => {
  it('skins each ramp to its place', () => {
    expect(rampSkin(ramp('park-fountain'))).toBe('park');
    expect(rampSkin(ramp('deans-leap'))).toBe('deans');
    expect(rampSkin(ramp('fort-sandpit'))).toBe('dirt');
    expect(rampSkin(ramp('mossy-log'))).toBe('dirt');
    expect(rampSkin(ramp('clay-mart-dock'))).toBe('dock');
    expect(rampSkin(ramp('frostbite-ridge'))).toBe('snow');
    expect(rampSkin(ramp('canal-leap'))).toBe('city');
  });
});

describe('buildRampMeshes', () => {
  const scene = new THREE.Scene();
  const rings = buildRampMeshes(scene, STUNT_RAMPS);

  it('adds meshes without a glowing cyan body', () => {
    expect(scene.children.length).toBeGreaterThan(0);
    const ringSet = new Set<THREE.Object3D>(rings.values());
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || ringSet.has(o)) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        const s = mat as THREE.MeshStandardMaterial;
        expect(nearCyan(s.color)).toBe(false);
        if (s.emissive) expect(nearCyan(s.emissive) && s.emissive.getHex() !== 0).toBe(false);
      }
    });
  });

  it('returns one hidden ring per ramp', () => {
    expect(rings.size).toBe(13);
    for (const r of STUNT_RAMPS) expect(rings.get(r.id)?.visible).toBe(false);
  });

  it('keeps the draw-call count small', () => {
    // Merged body meshes (not the rings, not the sign and tyre prop groups).
    const ringSet = new Set<THREE.Object3D>(rings.values());
    const bodies = scene.children.filter((o) => (o as THREE.Mesh).isMesh && !ringSet.has(o));
    expect(bodies.length).toBeLessThanOrEqual(14);
  });
});
