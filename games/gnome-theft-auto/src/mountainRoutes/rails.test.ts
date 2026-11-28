import { describe, expect, it, vi, beforeAll } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

vi.mock('../audio', () => ({ play: () => undefined }));

import { heightAt } from '../terrain';
import type { Box } from '../types';
import { ALL_PADS, padDistance } from './pads';
import { ALL_ROUTES, ROUTES, routesOfKind } from './routes';
import { buildGuardRails, placeRoadside, railRuns, railStats } from './rails';

beforeAll(() => { installFakeDom(); heightAt(0, 0); });

describe('guard rails', () => {
  it('exist on both roads', () => {
    const stats = railStats();
    console.log('railStats', JSON.stringify(stats));
    expect(stats.length).toBe(routesOfKind('road').length);
    for (const s of stats) expect(s.metres).toBeGreaterThan(0);
  });

  it('every run is justified, clear of junctions, pads and the road', () => {
    for (const run of railRuns()) {
      const track = ROUTES[run.route];
      const w = track.def.width;
      const ss = track.samples().filter((sm) => sm.s >= run.s0 && sm.s <= run.s1);
      let justified = 0;
      for (const sm of ss) {
        const far = track.frame(sm.s, run.side * (w / 2 + 6));
        const drop = track.roadTopAt(sm, run.side * w / 2) - heightAt(far.x, far.z) >= 1.5;
        const bend = Math.abs(sm.curv) >= 0.04 && run.side === (sm.curv > 0 ? -1 : 1);
        if (drop || bend) justified++;
        const r = track.frame(sm.s, run.side * (w / 2 + 0.9));
        expect(track.onRoad(r.x, r.z)).toBe(false);
        for (const p of ALL_PADS) expect(padDistance(p, r.x, r.z)).toBeGreaterThanOrEqual(2);
        for (const o of ALL_ROUTES) if (o !== track) expect(o.locate(r.x, r.z, 5)).toBeNull();
      }
      expect(justified).toBeGreaterThanOrEqual(ss.length / 2);
    }
  });

  it('colliders never overlap the road', () => {
    const boxes: Box[] = [];
    const scene = new THREE.Scene();
    buildGuardRails(scene, boxes);
    expect(boxes.length).toBeGreaterThan(0);
    for (const id of routesOfKind('road')) {
      const track = ROUTES[id];
      const w = track.def.width;
      for (let i = 0; i < 300; i++) {
        const s = Math.random() * track.length();
        const lat = (Math.random() * 2 - 1) * (w / 2 - 0.2);
        const p = track.frame(s, lat);
        expect(boxes.some((b) => p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ)).toBe(false);
      }
    }
  });

  it('places posts and poles', () => {
    const c = placeRoadside(new THREE.Scene(), []);
    console.log('roadside', JSON.stringify(c));
    expect(c.sections).toBeGreaterThan(0);
  });
});
