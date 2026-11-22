import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GRADIENT, outlineMat, toonMat, toonify } from './toon';

describe('toon shading helpers', () => {
  it('uses a crisp 3-band nearest-filtered gradient texture', () => {
    const data = GRADIENT.image.data as Uint8Array;
    expect(GRADIENT.image.width).toBe(3);
    expect(GRADIENT.image.height).toBe(1);
    expect(GRADIENT.minFilter).toBe(THREE.NearestFilter);
    expect(GRADIENT.magFilter).toBe(THREE.NearestFilter);
    expect([data[0], data[4], data[8]]).toEqual([40, 145, 255]);
  });

  it('supports instanced meshes in outlineMat vertex shader', () => {
    const mat = outlineMat(0.05);
    expect(mat.vertexShader).toContain('#ifdef USE_INSTANCING');
    expect(mat.vertexShader).toContain('instanceMatrix');
    expect(mat.side).toBe(THREE.BackSide);
  });

  it('caches toonMat by color and options', () => {
    const a = toonMat(0xff3fa4);
    const b = toonMat(0xff3fa4, { emissive: 0x2de2e6, emissiveIntensity: 0.25 });
    expect(a).not.toBe(b);
    expect(toonMat(0xff3fa4)).toBe(a);
    expect(toonMat(0xff3fa4, { emissive: 0x2de2e6, emissiveIntensity: 0.25 })).toBe(b);
  });

  it('converts MeshStandardMaterial and attaches InstancedMesh outlines sharing instanceMatrix', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff }), 2);
    toonify(inst, 0.05);
    expect(inst.material).toBeInstanceOf(THREE.MeshToonMaterial);
    const outline = inst.children.find((c) => c.name === 'outline');
    expect(outline).toBeInstanceOf(THREE.InstancedMesh);
    expect((outline as THREE.InstancedMesh).instanceMatrix).toBe(inst.instanceMatrix);
  });

  it('leaves MeshBasicMaterial untouched by default, but converts it when includeBasic or emissive is set', () => {
    const geo = new THREE.ConeGeometry(1, 1, 5);
    const untouched = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffe14d }));
    toonify(untouched, 0.05);
    expect(untouched.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(untouched.children).toHaveLength(0);

    const crystal = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }));
    toonify(crystal, 0.06, {
      includeBasic: true,
      color: 0x2de2e6,
      emissive: 0x2de2e6,
      emissiveIntensity: 0.25,
    });
    expect(crystal.material).toBeInstanceOf(THREE.MeshToonMaterial);
    const mat = crystal.material as unknown as THREE.MeshToonMaterial;
    expect(mat.color.getHex()).toBe(0x2de2e6);
    expect(mat.emissive.getHex()).toBe(0x2de2e6);
    expect(mat.emissiveIntensity).toBe(0.25);
    expect(mat.vertexColors).toBe(false);
    expect(crystal.children.some((c) => c.name === 'outline')).toBe(true);
  });
});
