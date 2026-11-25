import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { rooftopById, rooftopSurfaceBelow } from '../interiors/rooftops';
import { buildReedmere, distToBoardwalk, planReeds } from './marsh';

describe('Reedmere', () => {
  it('builds without throwing and registers the walkable decks', () => {
    const boxes: Box[] = [];
    expect(() => buildReedmere(new THREE.Scene(), boxes)).not.toThrow();
    expect(() => buildReedmere(new THREE.Scene(), [])).not.toThrow();
    const ids = ['reedmere-walk-1', 'reedmere-walk-2', 'reedmere-walk-3', 'reedmere-platform'];
    const roofs = ids.map((id) => rooftopById(id));
    for (const r of roofs) expect(r).toBeDefined();
    const y = roofs[0]!.y;
    for (const r of roofs.slice(0, 3)) expect(r!.y).toBe(y);
    expect(roofs[3]!.y).toBe(y);
    expect(rooftopSurfaceBelow(-1100, -1600, 50)).toBe(y);
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('keeps reeds off the boardwalk', () => {
    const reeds = planReeds();
    expect(reeds.length).toBeGreaterThanOrEqual(120);
    expect(reeds.length).toBeLessThanOrEqual(200);
    for (const r of reeds) expect(distToBoardwalk(r.x, r.z)).toBeGreaterThanOrEqual(3);
    expect(planReeds()).toEqual(reeds);
  });
});
