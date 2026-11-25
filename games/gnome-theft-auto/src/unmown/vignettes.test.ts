import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { regionAt } from '../levels';
import { roadDist } from '../living/place';
import { buildUnmownVignettes, unmownPeople } from './vignettes';

describe('unmown vignettes', () => {
  it('builds without throwing and adds scenery', () => {
    const scene = new THREE.Scene();
    const boxes: Box[] = [];
    expect(() => buildUnmownVignettes(scene, boxes)).not.toThrow();
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it('has five people with unique ids, inside the preserve, clear of the trails', () => {
    const people = unmownPeople();
    expect(people).toHaveLength(5);
    expect(new Set(people.map((p) => p.id)).size).toBe(5);
    for (const p of people) {
      expect(p.id.startsWith('unmown-')).toBe(true);
      expect(regionAt(p.x, p.z), p.id).toBe('the-unmown');
      expect(roadDist(p.x, p.z), p.id).toBeGreaterThanOrEqual(3);
    }
  });
});
