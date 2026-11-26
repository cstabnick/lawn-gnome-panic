// E33: the drawn route surfaces: a mesh per route, the lines on the roads, flat on the draw layers, and draped on the ground.
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

vi.mock('../audio', () => ({ play: () => undefined }));
installFakeDom();
const { buildRouteSurfaces } = await import('./surface');
const { ROUTE_IDS } = await import('./routes');
const { heightAt } = await import('../terrain');

function build(): THREE.Scene {
  const scene = new THREE.Scene();
  buildRouteSurfaces(scene);
  return scene;
}

function meshNamed(scene: THREE.Scene, name: string): THREE.Mesh | undefined {
  return scene.getObjectByName(name) as THREE.Mesh | undefined;
}

describe('mountain route surfaces', () => {
  it('draws a road, track or path mesh for every route id', () => {
    const scene = build();
    for (const id of ROUTE_IDS) {
      const road = meshNamed(scene, `e33-${id}-road`) ?? meshNamed(scene, `e33-${id}-path`);
      expect(road, `surface for ${id}`).toBeDefined();
    }
  });

  it('paints the lines on both roads', () => {
    const scene = build();
    expect(meshNamed(scene, 'e33-brim-gap-road-lines')).toBeDefined();
    expect(meshNamed(scene, 'e33-spine-cut-lines')).toBeDefined();
  });

  it('puts every surface on a draw layer (polygon offset)', () => {
    const scene = build();
    const meshes: THREE.Mesh[] = [];
    scene.traverse((o) => { if (o instanceof THREE.Mesh && o.name.startsWith('e33-')) meshes.push(o); });
    expect(meshes.length).toBeGreaterThan(0);
    for (const m of meshes) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mt of mats) expect((mt as THREE.Material & { polygonOffset: boolean }).polygonOffset, m.name).toBe(true);
    }
  });

  it('drapes the road meshes on the ground (0 to 0.3 m above it)', () => {
    const scene = build();
    const roads: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && /^e33-.*-(road|path|lines|verge)$/.test(o.name)) roads.push(o);
    });
    expect(roads.length).toBeGreaterThan(0);
    for (const m of roads) {
      const pos = m.geometry.getAttribute('position');
      const step = Math.max(1, Math.floor(pos.count / 200));
      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const above = y - heightAt(x, z);
        expect(above, `${m.name} vertex ${i}`).toBeGreaterThanOrEqual(0);
        expect(above, `${m.name} vertex ${i}`).toBeLessThanOrEqual(0.3);
      }
    }
  });
});
