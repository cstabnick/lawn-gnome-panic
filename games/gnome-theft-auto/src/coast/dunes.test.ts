// The dunes and the giant bucket (FX11 B1). Builds without a DOM.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Box } from '../types';
import { COAST } from './config';
import { buildDunes, fenceSpots, marramSpots } from './dunes';

const B = COAST.boardwalk.rect;
const onPath = (x: number, z: number): boolean => Math.abs(x) < COAST.dunes.gapHalf && z > 1050 && z < 1102;
const onDeck = (x: number, z: number): boolean => x > B.minX && x < B.maxX && z > B.minZ && z < B.maxZ;
const onWheel = (x: number, z: number): boolean => x > -300 && x < -220 && z > 1060 && z < 1140;

describe('dunes and the bucket', () => {
  const scene = new THREE.Scene();
  const boxes: Box[] = [];
  buildDunes(scene, boxes);

  it('builds scenery and colliders', () => {
    expect(scene.children.length).toBeGreaterThan(5);
    expect(boxes.length).toBeGreaterThan(2);
  });

  it('leaves the spur path and the boardwalk entrance free of colliders', () => {
    for (const b of boxes) {
      const hitsPath = b.maxX > -5 && b.minX < 5 && b.maxZ > 1000 && b.minZ < 1102;
      expect(hitsPath).toBe(false);
      expect(b.maxX > -1 && b.minX < 1 && b.maxZ > 1099 && b.minZ < 1101).toBe(false);
    }
  });

  it('plants 250-500 marram tufts clear of the path, deck and wheel', () => {
    const spots = marramSpots();
    expect(spots.length).toBeGreaterThanOrEqual(250);
    expect(spots.length).toBeLessThanOrEqual(500);
    for (const m of spots) {
      expect(onPath(m.x, m.z)).toBe(false);
      expect(onDeck(m.x, m.z)).toBe(false);
      expect(onWheel(m.x, m.z)).toBe(false);
    }
  });

  it('puts fence runs clear of the path, deck and wheel', () => {
    const spots = fenceSpots();
    expect(spots.length).toBeGreaterThan(30);
    for (const f of spots) {
      for (const dx of [-2, 0, 2]) {
        expect(onPath(f.x + dx, f.z)).toBe(false);
        expect(onDeck(f.x + dx, f.z)).toBe(false);
        expect(onWheel(f.x + dx, f.z)).toBe(false);
      }
    }
  });

  it('is deterministic', () => {
    expect(marramSpots()).toEqual(marramSpots());
  });
});
