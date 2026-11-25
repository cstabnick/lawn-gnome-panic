import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../../testing/fakeDom';
import { rooftopById } from '../../interiors';
import type { Box } from '../../types';
import { UNDERSPAN } from '../config';
import { buildUnderspan } from './build';

installFakeDom();

const TOL = 0.05;
const site = UNDERSPAN.site;

function build(): { scene: THREE.Scene; boxes: Box[] } {
  const scene = new THREE.Scene();
  const boxes: Box[] = [];
  buildUnderspan(scene, boxes);
  return { scene, boxes };
}

/** Distance from a point to an axis-aligned rectangle (0 when inside). */
function distToRect(px: number, pz: number, b: Box): number {
  const dx = Math.max(b.minX - px, 0, px - b.maxX);
  const dz = Math.max(b.minZ - pz, 0, pz - b.maxZ);
  return Math.hypot(dx, dz);
}

describe('the Underspan build', () => {
  it('keeps every collider and every scenery mesh inside the site', () => {
    const { scene, boxes } = build();
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(site.minX - TOL);
      expect(b.maxX).toBeLessThanOrEqual(site.maxX + TOL);
      expect(b.minZ).toBeGreaterThanOrEqual(site.minZ - TOL);
      expect(b.maxZ).toBeLessThanOrEqual(site.maxZ + TOL);
    }
    expect(scene.children.length).toBeGreaterThan(0);
    for (const child of scene.children) {
      const box = new THREE.Box3().setFromObject(child);
      if (box.isEmpty()) continue;
      expect(box.min.x, child.name).toBeGreaterThanOrEqual(site.minX - TOL);
      expect(box.max.x, child.name).toBeLessThanOrEqual(site.maxX + TOL);
      expect(box.min.z, child.name).toBeGreaterThanOrEqual(site.minZ - TOL);
      expect(box.max.z, child.name).toBeLessThanOrEqual(site.maxZ + TOL);
    }
  });

  it('leaves the walkable spots clear of colliders', () => {
    const { boxes } = build();
    const spots = [UNDERSPAN.workshopDoor, UNDERSPAN.hogweed, UNDERSPAN.chuteBottom];
    for (const s of spots) {
      for (const b of boxes) {
        expect(distToRect(s.x, s.z, b), `collider near (${s.x}, ${s.z})`).toBeGreaterThanOrEqual(0.6);
      }
    }
  });

  it('registers the Roost as a non-solid rooftop at roostY', () => {
    build();
    const roof = rooftopById(UNDERSPAN.roost.id);
    expect(roof).toBeDefined();
    expect(roof!.y).toBe(UNDERSPAN.roostY);
    expect(roof!.solid).toBe(false);
  });

  it('can be built twice without throwing', () => {
    build();
    expect(() => build()).not.toThrow();
  });
});
