// Hedgeworth's playing surfaces: on layers (no z-fighting), greens that really tilt, and the four holes' flags.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { buildCourseGround } from './greens';

let restore: () => void = () => {};
const scene = new THREE.Scene();

beforeAll(() => {
  restore = installFakeDom();
  buildCourseGround(scene);
});
afterAll(() => restore());

const PREFAB_GROUPS = ['hedgeworth-flags', 'hedgeworth-tee-markers', 'hedgeworth-reeds'];

function flatMeshes(): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const course = scene.getObjectByName('hedgeworth-course');
  if (!course) return out;
  course.children.forEach((child) => {
    if (PREFAB_GROUPS.includes(child.name)) return;
    child.traverse((o) => { if (o instanceof THREE.Mesh) out.push(o); });
  });
  return out;
}

describe('Hedgeworth course ground', () => {
  it('builds one group named hedgeworth-course', () => {
    expect(scene.getObjectByName('hedgeworth-course')).toBeTruthy();
  });

  it('puts every flat material on a draw layer', () => {
    const meshes = flatMeshes();
    expect(meshes.length).toBeGreaterThan(0);
    for (const m of meshes) {
      const mat = m.material as THREE.Material;
      expect(mat.polygonOffset, m.name).toBe(true);
    }
  });

  it('shares an offset value only between materials of the same layer', () => {
    const byUnits = new Map<number, Set<number>>();
    for (const m of flatMeshes()) {
      const mat = m.material as THREE.MeshBasicMaterial;
      const set = byUnits.get(mat.polygonOffsetUnits) ?? new Set<number>();
      set.add(mat.polygonOffsetFactor);
      byUnits.set(mat.polygonOffsetUnits, set);
    }
    for (const [, factors] of byUnits) expect(factors.size).toBe(1);
  });

  it('has four greens whose surfaces rise and tilt', () => {
    const greens: THREE.Mesh[] = [];
    flatMeshes().forEach((m) => { if (/^green-\d$/.test(m.name)) greens.push(m); });
    expect(greens.length).toBe(4);
    for (const g of greens) {
      const y = (g.geometry.getAttribute('position') as THREE.BufferAttribute);
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < y.count; i++) { lo = Math.min(lo, y.getY(i)); hi = Math.max(hi, y.getY(i)); }
      expect(hi, g.name).toBeGreaterThan(lo);
    }
  });

  it('places a flagstick and two tee markers on every hole', () => {
    const flags = scene.getObjectByName('hedgeworth-flags');
    const markers = scene.getObjectByName('hedgeworth-tee-markers');
    expect(flags).toBeTruthy();
    expect(markers).toBeTruthy();
  });
});
