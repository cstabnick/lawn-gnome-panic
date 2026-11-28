// Saltbucket Boardwalk and Long Spoon Pier (E11): builds without a DOM, pushes colliders, and the pier is a walkable
// deck above the ground and the sea all the way out.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { rooftopById, rooftopSurfaceBelow } from '../interiors/rooftops';
import { groundAt, heightAt } from '../terrain';
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

describe('the boardwalk deck is walkable', () => {
  const R = COAST.boardwalk.rect;
  const deckTop = heightAt(0, 1115) + COAST.boardwalk.deckLift;

  it('registers the promenade as a rooftop at the deck top', () => {
    expect(rooftopById('saltbucket-boardwalk')?.y).toBeCloseTo(deckTop, 5);
  });

  it('stands bodies on the planks, from the ground and from just above', () => {
    for (const [x, z] of [[0, 1115], [-152, 1112], [R.minX + 20, R.minZ + 1], [R.maxX - 1, R.maxZ - 1]] as const) {
      expect(groundAt(x, z, heightAt(x, z)), x + ',' + z + ' from the ground').toBeCloseTo(deckTop, 5);
      expect(groundAt(x, z, deckTop + 0.1), x + ',' + z + ' from above').toBeCloseTo(deckTop, 5);
    }
  });

  it('the ground stays below the deck top along every edge', () => {
    const pts: [number, number][] = [];
    for (let x = R.minX; x <= R.maxX; x += 2) pts.push([x, R.minZ], [x, R.maxZ], [x, (R.minZ + R.maxZ) / 2]);
    for (let z = R.minZ; z <= R.maxZ; z += 2) pts.push([R.minX, z], [R.maxX, z]);
    for (const [x, z] of pts) expect(heightAt(x, z), `ground at ${x},${z}`).toBeLessThan(deckTop - 0.05);
  });

  it('leaves the ground outside the rectangle alone', () => {
    expect(groundAt(0, R.maxZ + 3, heightAt(0, R.maxZ + 3))).toBeCloseTo(heightAt(0, R.maxZ + 3), 5);
  });
});
