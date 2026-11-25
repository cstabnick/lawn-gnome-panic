import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HAMLETS } from './config';
import { regionAt } from '../levels';
import { roadDist } from './place';
import type { Box } from '../types';
import { DUNELOW_HOUSES, buildDunelow, dunelowPeople, planDunelow } from './hamletDunelow';

const centre = HAMLETS.find((h) => h.id === 'dunelow')!;

describe('Dunelow', () => {
  const plan = planDunelow();
  const houses = plan.filter((p) => DUNELOW_HOUSES.includes(p.id));

  it('has 8-12 houses, far from roads and inside the hamlet radius', () => {
    expect(houses.length).toBeGreaterThanOrEqual(8);
    expect(houses.length).toBeLessThanOrEqual(12);
    for (const h of houses) {
      expect(roadDist(h.x, h.z)).toBeGreaterThanOrEqual(16);
      expect(Math.hypot(h.x - centre.x, h.z - centre.z)).toBeLessThanOrEqual(centre.r);
    }
  });

  it('keeps every piece in the south shore', () => {
    for (const p of plan) expect(regionAt(p.x, p.z), `${p.id} at ${p.x},${p.z}`).toBe('south-shore');
  });

  it('builds into a scene and pushes colliders', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    expect(() => buildDunelow(scene, boxes)).not.toThrow();
    expect(boxes.length).toBeGreaterThanOrEqual(10);
    expect(scene.children.length).toBeGreaterThan(3);
  });

  it('has two residents in the region with unique ids', () => {
    const people = dunelowPeople();
    expect(people).toHaveLength(2);
    expect(new Set(people.map((p) => p.id)).size).toBe(2);
    for (const p of people) {
      expect(p.id.startsWith('dunelow-')).toBe(true);
      expect(regionAt(p.x, p.z)).toBe('south-shore');
    }
  });
});
