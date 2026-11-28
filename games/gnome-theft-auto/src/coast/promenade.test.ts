// The promenade's south row and folk (FX11 B3): nothing blocks a stair gap or the walkway, and every gnome stands on the
// deck clear of the colliders.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { COAST } from './config';
import { PROMENADE_FOLK, STAIRS, WALKWAY, buildPromenade } from './promenade';

describe('the promenade', () => {
  const R = COAST.boardwalk.rect;
  const deckTop = heightAt(0, 1115) + COAST.boardwalk.deckLift;
  const boxes: Box[] = [];
  const scene = new THREE.Scene();
  buildPromenade(scene, boxes, deckTop);

  it('builds its south row and bunting', () => {
    expect(boxes.length).toBeGreaterThanOrEqual(10);
    expect(scene.children.length).toBeGreaterThan(10);
  });

  it('keeps the walkway open and every stair gap clear', () => {
    for (const b of boxes) {
      expect(b.minZ, 'walkway').toBeGreaterThanOrEqual(WALKWAY.maxZ);
      for (const sx of STAIRS) {
        const overlapsX = b.maxX > sx - 2.5 && b.minX < sx + 2.5;
        expect(overlapsX, `stair ${sx} blocked by ${b.minX}..${b.maxX}`).toBe(false);
      }
    }
  });

  it('puts every gnome on the deck, outside the colliders, with unique coast-prom ids', () => {
    expect(PROMENADE_FOLK.length).toBeGreaterThanOrEqual(5);
    const ids = PROMENADE_FOLK.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of PROMENADE_FOLK) {
      expect(f.id.startsWith('coast-prom-')).toBe(true);
      expect(f.surface).toBe('rooftop');
      expect(f.x).toBeGreaterThan(R.minX + 1);
      expect(f.x).toBeLessThan(R.maxX - 1);
      expect(f.z).toBeGreaterThan(R.minZ + 1);
      expect(f.z).toBeLessThan(R.maxZ - 1);
      for (const b of boxes) {
        const inside = f.x > b.minX - 0.4 && f.x < b.maxX + 0.4 && f.z > b.minZ - 0.4 && f.z < b.maxZ + 0.4;
        expect(inside, `${f.id} inside a collider`).toBe(false);
      }
    }
  });
});
