// Hedgeworth's yard: the Kicked Board's gap, colliders off the course and the approaches, soft plants in the yard.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildYard, planYard } from './yard';
import { FENCE_INSET, KICKED_BOARD, MAZE_HEDGES, HOLES, MEMBERS_GATE, OLD_FENCE, TURN_GATE, YARD, distToLine, inPlay, inYard } from './types';

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
    const deliberate = planYard(() => true).deliberate;
    const fenceX = YARD.maxX - FENCE_INSET;
    for (const b of boxes) {
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      const onFence = b.minX < YARD.minX + 3 || b.maxX > YARD.maxX - 3 || b.minZ < YARD.minZ + 3 || b.maxZ > YARD.maxZ - 3;
      if (!onFence && !deliberate.some((d) => d.minX === b.minX && d.minZ === b.minZ)) expect(inPlay(cx, cz), `box at ${cx},${cz}`).toBe(false);
      for (const z of [MEMBERS_GATE.z, KICKED_BOARD.z]) {
        if (b.maxX > fenceX + 0.5) expect(hits(b, fenceX + 0.5, -950, z - 1.2, z + 1.2), `box on the approach at z ${z}`).toBe(false);
      }
    }
  });

  it('plans fence, hedges, grass, giants and sprinklers with every prefab present', () => {
    const p = planYard(() => true);
    expect(p.fence.length).toBeGreaterThan(500);
    expect(p.hedges.length).toBeGreaterThan(20);
    expect(p.arches.length).toBe(4);   // three on the hedges, one at the maze
    expect(p.grass.length).toBeGreaterThan(200);
    expect(p.giants.length).toBeGreaterThanOrEqual(40);
    expect(p.giants.length).toBeLessThanOrEqual(120);
    expect(p.sprinklers.length).toBe(20);   // two per green, nine greens, plus two on the fairways
    expect(p.soft.length).toBe(p.giants.length);
    console.log(`yard counts: fence ${p.fence.length} hedges ${p.hedges.length} grass ${p.grass.length} giants ${p.giants.length} boxes ${p.boxes.length}`);
  });

  it('maze hedges have colliders that cross the hole 5 fairway line', () => {
    const p = planYard(() => true);
    const hole = HOLES[5];
    // The centre line slips round each wall's open end; the fairway's width does not.
    const crossing = (b: Box): boolean => {
      for (let i = 0; i <= 8; i++) {
        const x = b.minX + ((b.maxX - b.minX) * i) / 8, z = b.minZ + ((b.maxZ - b.minZ) * i) / 8;
        if (distToLine(hole.path, x, z).dist < hole.fairwayWidth / 2) return true;
      }
      return false;
    };
    expect(p.deliberate.filter(crossing).length).toBeGreaterThanOrEqual(1);
    for (const m of MAZE_HEDGES) {
      const mx = (m.a[0] + m.b[0]) / 2, mz = (m.a[1] + m.b[1]) / 2;
      expect(p.boxes.some((b) => mx > b.minX && mx < b.maxX && mz > b.minZ && mz < b.maxZ), `collider on maze wall ${mx},${mz}`).toBe(true);
    }
  });

  it('no collider spans the Turn Gate opening, hedge colliders are thin', () => {
    const p = planYard(() => true);
    for (const b of p.boxes) {
      expect(b.minX < TURN_GATE.x && b.maxX > TURN_GATE.x && b.minZ < OLD_FENCE.z && b.maxZ > OLD_FENCE.z, 'box across the gate').toBe(false);
    }
    expect(p.gates.length).toBe(1);
    for (const m of MAZE_HEDGES) {
      const cx = (m.a[0] + m.b[0]) / 2, cz = (m.a[1] + m.b[1]) / 2;
      const b = p.boxes.find((o) => cx > o.minX && cx < o.maxX && cz > o.minZ && cz < o.maxZ)!;
      expect(Math.min(b.maxX - b.minX, b.maxZ - b.minZ)).toBeLessThanOrEqual(1.4);
    }
    for (const h of p.hedges) expect(h.scale ?? 1).toBeLessThan(3.5);
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
