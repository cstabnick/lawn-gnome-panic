import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { HAMLETS, HIGH_TARN } from './config';
import { roadDist } from './place';
import { buildRoadside, planRoadside } from './roadside';

describe('roadside', () => {
  const plan = planRoadside();
  it('is deterministic', () => {
    expect(planRoadside()).toEqual(plan);
  });
  it('has at least 25 stops worth of pieces and 10 milestones with text', () => {
    expect(plan.pieces.length).toBeGreaterThanOrEqual(75);
    expect(plan.pieces.length).toBeLessThanOrEqual(400);
    expect(plan.pieces.filter((p) => p.id === 'milestone').length).toBeGreaterThanOrEqual(10);
    expect(plan.texts.filter((t) => /\d/.test(t.text)).length).toBeGreaterThanOrEqual(10);
    expect(plan.pieces.filter((p) => p.id === 'bus-shelter' || p.id === 'hamlet-phone-box' || p.id === 'wayside-shrine').length).toBeGreaterThan(0);
    expect(plan.pieces.filter((p) => p.id === 'trail-fingerpost').length).toBeGreaterThanOrEqual(3);
  });
  it('keeps off the roads, hamlets and the tarn', () => {
    for (const p of plan.pieces) {
      expect(roadDist(p.x, p.z), p.id).toBeGreaterThanOrEqual(8);
      for (const h of [...HAMLETS, HIGH_TARN]) expect(Math.hypot(p.x - h.x, p.z - h.z), p.id).toBeGreaterThanOrEqual(90);
    }
  });
  it('has no tents, shacks or construction', () => {
    for (const p of plan.pieces) expect(p.id).not.toMatch(/tent|shack|construction/);
  });
  it('builds without throwing and pushes colliders', () => {
    const boxes: Box[] = [];
    expect(() => buildRoadside(new THREE.Scene(), boxes)).not.toThrow();
    expect(boxes.length).toBeGreaterThan(10);
  });
});
