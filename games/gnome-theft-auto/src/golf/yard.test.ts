// Hedgeworth's yard: the Kicked Board's gap, colliders off the course and the approaches, soft plants in the yard.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildYard, planYard } from './yard';
import { FENCE_INSET, KICKED_BOARD, MEMBERS_GATE, YARD, inPlay, inYard } from './types';

const hits = (b: Box, x0: number, x1: number, z0: number, z1: number): boolean =>
  b.minX < x1 && b.maxX > x0 && b.minZ < z1 && b.maxZ > z0;

describe('Hedgeworth yard', () => {
  beforeAll(() => { installFakeDom(); });

  it('the Kicked Board has its own collider across the gap, apart from boxes', () => {
    const y = buildYard(new THREE.Scene(), { boardBroken: false });
    const b = y.boardBox;
    expect(b.minZ).toBeCloseTo(KICKED_BOARD.z - KICKED_BOARD.half);
    expect(b.maxZ).toBeCloseTo(KICKED_BOARD.z + KICKED_BOARD.half);
    expect(y.boxes).not.toContain(b);
    for (const o of y.boxes) expect(hits(o, b.minX, b.maxX, KICKED_BOARD.z - 2.5, KICKED_BOARD.z + 2.5), 'box across the gap').toBe(false);
    y.breakBoard();
    y.breakBoard();
  });

  it('building broken still returns the boardBox', () => {
    const y = buildYard(new THREE.Scene(), { boardBroken: true });
    expect(y.boardBox.maxZ).toBeGreaterThan(y.boardBox.minZ);
    expect(() => y.update(0.1, 1)).not.toThrow();
  });

  it('colliders keep off the course and the approaches (fence and gate boxes aside)', () => {
    const { boxes } = buildYard(new THREE.Scene(), { boardBroken: false });
    const fenceX = YARD.maxX - FENCE_INSET;
    for (const b of boxes) {
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      const onFence = b.minX < YARD.minX + 3 || b.maxX > YARD.maxX - 3 || b.minZ < YARD.minZ + 3 || b.maxZ > YARD.maxZ - 3;
      if (!onFence) expect(inPlay(cx, cz), `box at ${cx},${cz}`).toBe(false);
      for (const z of [MEMBERS_GATE.z, KICKED_BOARD.z]) {
        if (b.maxX > fenceX + 0.5) expect(hits(b, fenceX + 0.5, -950, z - 1.2, z + 1.2), `box on the approach at z ${z}`).toBe(false);
      }
    }
  });

  it('plans fence, hedges, grass, giants and sprinklers with every prefab present', () => {
    const p = planYard(() => true);
    expect(p.fence.length).toBeGreaterThan(500);
    expect(p.hedges.length).toBeGreaterThan(20);
    expect(p.arches.length).toBe(3);
    expect(p.grass.length).toBeGreaterThan(200);
    expect(p.giants.length).toBeGreaterThanOrEqual(40);
    expect(p.giants.length).toBeLessThanOrEqual(120);
    expect(p.sprinklers.length).toBe(10);
    expect(p.soft.length).toBe(p.giants.length);
    console.log(`yard counts: fence ${p.fence.length} hedges ${p.hedges.length} grass ${p.grass.length} giants ${p.giants.length} boxes ${p.boxes.length}`);
  });

  it('every soft plant is inside the yard and out of play', () => {
    const { soft } = buildYard(new THREE.Scene(), { boardBroken: false });
    for (const s of planYard(() => true).soft.concat(soft)) {
      expect(inYard(s.x, s.z), `${s.x},${s.z} in yard`).toBe(true);
      expect(inPlay(s.x, s.z), `${s.x},${s.z} in play`).toBe(false);
      expect(s.r).toBeGreaterThan(0);
    }
  });
});
