// Saltbucket Boardwalk and Long Spoon Pier (E11): builds without a DOM, pushes colliders, and the pier is a walkable
// deck above the ground and the sea all the way out.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { rooftopById, rooftopSurfaceBelow } from '../interiors/rooftops';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildBoardwalk } from './boardwalk';
import { COAST } from './config';

describe('Saltbucket Boardwalk and Long Spoon Pier', () => {
  const boxes: Box[] = [];
  buildBoardwalk(new THREE.Scene(), boxes);

  it('pushes colliders (stalls, rails)', () => {
    expect(boxes.length).toBeGreaterThan(20);
  });

  it('has the three pier rooftops at the pier deck height', () => {
    for (const id of ['long-spoon-spur', 'long-spoon-handle', 'long-spoon-bowl']) {
      const r = rooftopById(id);
      expect(r, id).toBeDefined();
      expect(r!.y).toBe(COAST.pier.deckY);
      expect(r!.solid).toBe(false);
    }
    expect(rooftopSurfaceBelow(300, 1200, COAST.pier.deckY + 1)).toBe(COAST.pier.deckY);
  });

  it('keeps every deck above the ground under it', () => {
    for (const id of ['long-spoon-spur', 'long-spoon-handle', 'long-spoon-bowl']) {
      const r = rooftopById(id)!;
      const pts: [number, number][] = [
        [r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ], [(r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2],
      ];
      for (const [x, z] of pts) expect(heightAt(x, z), `${id} at ${x},${z}`).toBeLessThan(r.y - 0.05);
    }
  });
});
