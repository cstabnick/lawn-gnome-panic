import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { heightAt } from '../terrain';
import { buildGutterBowls } from './build';
import { parkHeight } from './park';
import { SKATE_ORIGIN, SKATE_PIECES, SKATE_SITE } from './types';

describe('buildGutterBowls', () => {
  const scene = new THREE.Scene();
  const built = buildGutterBowls(scene);

  it('adds its group to the scene', () => {
    expect(scene.children).toContain(built.group);
  });

  it('surface vertices sit on the height function the board rides', () => {
    const pts: Array<[number, number, number]> = [];
    built.group.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || !o.name.startsWith('skate-surface-')) return;
      const a = o.geometry.getAttribute('position');
      for (let i = 0; i < a.count; i++) pts.push([a.getX(i), a.getY(i), a.getZ(i)]);
    });
    expect(pts.length).toBeGreaterThan(200);
    let checked = 0;
    for (let k = 0; k < 200; k++) {
      const [x, y, z] = pts[Math.floor((k * pts.length) / 200)];
      if (x < SKATE_SITE.minX || x > SKATE_SITE.maxX || z < SKATE_SITE.minZ || z > SKATE_SITE.maxZ) continue;
      // On a piece edge the height jumps: accept the height of any point a hair away.
      let best = Infinity;
      for (const [dx, dz] of [[0, 0], [0.01, 0], [-0.01, 0], [0, 0.01], [0, -0.01]]) {
        best = Math.min(best, Math.abs(y - (heightAt(x + dx, z + dz) + parkHeight(x + dx, z + dz))));
      }
      expect(best).toBeLessThan(0.04); // surfaces are drawn SURF_LIFT (0.03) proud of the ridden height
      checked++;
    }
    expect(checked).toBeGreaterThan(150);
  });

  it('places the prefab ledge and deck at their pieces', () => {
    for (const id of ['ledge', 'fennel-deck']) {
      const p = SKATE_PIECES.find((q) => q.id === id)!;
      if (p.kind !== 'box') throw new Error('box expected');
      const o = built.group.getObjectByName(`skate-piece-${id}`)!;
      expect(o).toBeTruthy();
      expect(o.position.x).toBeCloseTo(SKATE_ORIGIN.x + p.u, 5);
      expect(o.position.z).toBeCloseTo(SKATE_ORIGIN.z + p.v, 5);
    }
  });

  it('keeps its boxes inside the site', () => {
    expect(built.boxes.length).toBeGreaterThan(0);
    for (const b of built.boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(SKATE_SITE.minX);
      expect(b.maxX).toBeLessThanOrEqual(SKATE_SITE.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(SKATE_SITE.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(SKATE_SITE.maxZ);
    }
  });
});
