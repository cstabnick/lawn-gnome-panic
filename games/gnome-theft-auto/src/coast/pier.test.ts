// Long Spoon Pier (FX11 A13): a silver spoon, not a plank walkway. Builds without a DOM.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Box } from '../types';
import { COAST } from './config';
import { MATS } from './deckKit';
import { buildPier } from './pier';

describe('Long Spoon Pier', () => {
  const scene = new THREE.Scene();
  const boxes: Box[] = [];
  buildPier(scene, boxes, -2.6);
  const mats = new Set<THREE.Material>();
  scene.traverse((o) => { if (o instanceof THREE.Mesh) mats.add(o.material as THREE.Material); });

  it('has a silver handle and no handle planks', () => {
    expect(mats.has(MATS.spoonSilver)).toBe(true);
    expect(mats.has(MATS.pierWoodZ)).toBe(false);
    expect(mats.has(MATS.pierWood)).toBe(true);
  });

  it('lights its underside and Marram window', () => {
    expect(mats.has(MATS.pierUnder)).toBe(true);
    expect(mats.has(MATS.pierSkirt)).toBe(true);
    expect(scene.getObjectByName('marram-window')).toBeDefined();
  });

  it('keeps the handle strip free of colliders other than rails and the end', () => {
    const P = COAST.pier;
    for (const b of boxes) {
      if (b.minZ > P.handle.minZ + 0.1 && b.maxZ < P.bowl.minZ) {
        // a rail line: thin in x or z
        expect(Math.min(b.maxX - b.minX, b.maxZ - b.minZ)).toBeLessThan(1);
      }
    }
  });
});
