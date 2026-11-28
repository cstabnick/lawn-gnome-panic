import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { regionAt } from '../levels';
import type { Box } from '../types';
import { HAMLETS } from './config';
import { roadDist } from './place';
import { buildMittenholt, mittenholtPeople, planMittenholt } from './hamletMittenholt';

const C = HAMLETS.find((h) => h.id === 'mittenholt')!;
const isHouse = (id: string) => id === 'snow-cottage' || id === 'log-cabin';

describe('Mittenholt', () => {
  it('plans 8-12 houses, clear of roads and inside the hamlet', () => {
    const houses = planMittenholt().filter((p) => isHouse(p.id));
    expect(houses.length).toBeGreaterThanOrEqual(8);
    expect(houses.length).toBeLessThanOrEqual(12);
    for (const h of houses) {
      expect(roadDist(h.x, h.z)).toBeGreaterThanOrEqual(16);
      expect(Math.hypot(h.x - C.x, h.z - C.z)).toBeLessThanOrEqual(75);
    }
  });
  it('keeps every piece in the north highlands', () => {
    for (const p of planMittenholt()) expect(regionAt(p.x, p.z), p.id).toBe('north-highlands');
  });
  it('builds without throwing and pushes colliders', () => {
    const boxes: Box[] = [];
    expect(() => buildMittenholt(new THREE.Scene(), boxes)).not.toThrow();
    expect(boxes.length).toBeGreaterThanOrEqual(10);
  });
  it('has two residents in the region with unique ids', () => {
    const people = mittenholtPeople();
    expect(people).toHaveLength(2);
    expect(new Set(people.map((p) => p.id)).size).toBe(2);
    for (const p of people) {
      expect(p.id.startsWith('mittenholt-')).toBe(true);
      expect(regionAt(p.x, p.z)).toBe('north-highlands');
    }
  });
});
