import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { regionAt } from '../levels';
import { waterAt } from '../terrain';
import { rooftopById } from '../interiors/rooftops';
import type { Box } from '../types';
import { pieceBox, roadDist } from './place';
import { HIGH_TARN_SITE, buildHighTarn, highTarnPeople, planHighTarn } from './highTarn';

/** Distance to the footpath up from the road corner to the tarn's east side. */
function nearPath(x: number, z: number): number {
  const pts = [[1060, -1300], [1075, -1430], [1072, -1560]];
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

describe('High Tarn', () => {
  const plan = planHighTarn();

  it('uses only known prefabs and places the bothy and jetty', () => {
    for (const p of plan) expect(getPrefab(p.id), p.id).toBeTruthy();
    expect(plan.some((p) => p.id === 'tarn-bothy')).toBe(true);
    expect(plan.some((p) => p.id === 'tarn-jetty')).toBe(true);
    expect(plan.length).toBeGreaterThan(40);
  });

  it('no solid piece stands in deep water', () => {
    for (const p of plan.filter((q) => q.solid)) {
      const b = pieceBox(p)!;
      const w = waterAt((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2);
      expect(!w || w.depth <= 0.3, p.id).toBe(true);
    }
  });

  it('every piece is within the site grown by 40 m or along the path', () => {
    const S = HIGH_TARN_SITE;
    for (const p of plan) {
      const inSite = p.x > S.minX - 40 && p.x < S.maxX + 40 && p.z > S.minZ - 40 && p.z < S.maxZ + 40;
      expect(inSite || nearPath(p.x, p.z) < 6 || roadDist(p.x, p.z) < 6, `${p.id} ${p.x},${p.z}`).toBe(true);
    }
  });

  it('builds, registers the jetty rooftop and adds colliders', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    buildHighTarn(scene, boxes);
    expect(rooftopById('high-tarn-jetty')).toBeTruthy();
    expect(boxes.length).toBeGreaterThan(2);
    expect(scene.children.length).toBeGreaterThan(1);
  });

  it('the resident lives in north-highlands', () => {
    const people = highTarnPeople();
    expect(people.length).toBe(1);
    expect(people[0].id).toBe('tarn-warden');
    for (const g of people) expect(regionAt(g.x, g.z)).toBe('north-highlands');
  });
});
