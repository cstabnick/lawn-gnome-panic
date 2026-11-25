import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { regionAt } from '../levels';
import { roadDist } from './place';
import { HAMLETS } from './config';
import { buildEspalierEnd, espalierPeople, planEspalierEnd } from './hamletEspalier';

const c = HAMLETS.find((h) => h.id === 'espalier-end')!;
const houses = () => planEspalierEnd().filter((p) => p.id === 'gnome-cottage' || p.id === 'thatched-cottage');

describe('Espalier End', () => {
  it('has 8-12 houses, off the roads and inside the radius', () => {
    const hs = houses();
    expect(hs.length).toBeGreaterThanOrEqual(8);
    expect(hs.length).toBeLessThanOrEqual(12);
    for (const h of hs) {
      expect(roadDist(h.x, h.z)).toBeGreaterThanOrEqual(16);
      expect(Math.hypot(h.x - c.x, h.z - c.z)).toBeLessThanOrEqual(75);
    }
  });
  it('keeps every piece in west-estates', () => {
    for (const p of planEspalierEnd()) expect(regionAt(p.x, p.z)).toBe('west-estates');
  });
  it('builds into a scene with colliders', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    expect(() => buildEspalierEnd(scene, boxes)).not.toThrow();
    expect(boxes.length).toBeGreaterThanOrEqual(10);
    expect(scene.children.length).toBeGreaterThan(0);
  });
  it('has two residents in the region with unique ids', () => {
    const ps = espalierPeople();
    expect(ps.length).toBe(2);
    expect(new Set(ps.map((p) => p.id)).size).toBe(2);
    for (const p of ps) {
      expect(p.id.startsWith('espalier-')).toBe(true);
      expect(regionAt(p.x, p.z)).toBe('west-estates');
    }
  });
});
