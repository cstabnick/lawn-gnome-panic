// E26: the street routes follow real roads. Every 4th centre-line sample is within width / 2 + 1.5 m of a road-graph link
// (or the Skyway deck / a ramp-foot connector), the four grid slots are on a road too, and the lengths are what the
// route design promised.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { nearestRoad, roadSegments, type RoadSeg } from '../testing/roadSegments';
import { STREET_TRACK_IDS, trackById } from './tracks';

const RANGE: Record<(typeof STREET_TRACK_IDS)[number], [number, number]> = {
  'kerb-row-circuit': [1000, 1600],
  'skyway-sprint': [800, 1100],
  'ring-road-run': [1800, 2600],
  'pardonlin-boucle': [1200, 1800],
  'saltbucket-dash': [1500, 2200],
};

let segs: RoadSeg[] = [];

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  segs = roadSegments(buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer));
}, 120000);

describe('street routes follow the roads', () => {
  for (const id of STREET_TRACK_IDS) {
    it(`${id} stays on the road`, () => {
      const t = trackById(id);
      const tol = t.def.width / 2 + 1.5;
      let worst = { s: 0, d: 0 };
      t.samples().forEach((p, i) => {
        if (i % 4) return;
        const d = nearestRoad(segs, p.x, p.z).dist;
        if (d > worst.d) worst = { s: p.s, d };
      });
      expect(worst.d, `${id}: worst sample at s=${worst.s.toFixed(0)} is ${worst.d.toFixed(1)} m off the road (max ${tol})`).toBeLessThanOrEqual(tol);
    });

    it(`${id} has its grid on the road and its length in range`, () => {
      const t = trackById(id);
      for (let slot = 0; slot < 4; slot++) {
        const g = t.gridSlot(slot);
        const d = nearestRoad(segs, g.x, g.z).dist;
        expect(d, `${id}: grid slot ${slot} is ${d.toFixed(1)} m off the road`).toBeLessThanOrEqual(t.def.width / 2 + 1.5);
      }
      const [lo, hi] = RANGE[id];
      expect(t.length()).toBeGreaterThanOrEqual(lo);
      expect(t.length()).toBeLessThanOrEqual(hi);
      expect(t.def.gates).toBeGreaterThanOrEqual(8);
      expect(t.def.gates).toBeLessThanOrEqual(12);
    });
  }
});
