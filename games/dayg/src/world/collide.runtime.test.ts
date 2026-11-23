import { describe, it, expect } from 'vitest';
import { createCollider, type Vec3 } from './collide';
import type { BlockoutMap } from './types';

// A tiny map with no blocks and no pits, inside the Forecourt (x 200..440, z 400..480).
const makeMap = (): BlockoutMap => ({
  bounds: { x0: 0, x1: 560, z0: 0, z1: 520 },
  blocks: [], routes: [], pits: [], spots: [],
  havens: [], water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 330, y: 0, z: 420 },
});

const R = 0.45, H = 1.7, STEP = 0.5;
const out = (): Vec3 => ({ x: 0, y: 0, z: 0 });
const piece = { id: 'piece-1', kind: 'piece' as const, x0: 325, x1: 328.5, z0: 409.8, z1: 410.2, y: 0, h: 3.2 };

describe('runtime blocks', () => {
  it('a runtime block stops movement', () => {
    const c = createCollider(makeMap());
    c.addBlock(piece);
    const o = out();
    const hit = c.move({ x: 326, y: 0, z: 412 }, 0, -4, R, H, STEP, o);
    expect(hit).toBe('piece-1');
    expect(o.z).toBeGreaterThanOrEqual(410.65 - 1e-9);
  });

  it('groundAt sees a runtime block until it is removed', () => {
    const c = createCollider(makeMap());
    expect(c.groundAt(326, 410, 5)).toBe(0);
    c.addBlock(piece);
    expect(c.groundAt(326, 410, 5)).toBe(3.2);
    expect(c.removeBlock('piece-1')).toBe(true);
    expect(c.groundAt(326, 410, 5)).toBe(0);
    expect(c.removeBlock('piece-1')).toBe(false);
  });

  it('faceAhead finds a runtime block face and its routes', () => {
    const c = createCollider(makeMap());
    c.addBlock(piece);
    const hit = c.faceAhead(326, 0, 412, Math.PI, 2, STEP, 2);
    expect(hit?.id).toBe('piece-1');
    expect(hit?.side).toBe('s');
    expect(hit?.routes).toEqual([]);
    c.addRoute({ id: 'r1', block: 'piece-1', side: 's', kind: 'ladder', at: 1.75 });
    expect(c.faceAhead(326, 0, 412, Math.PI, 2, STEP, 2)?.routes.map((r) => r.id)).toEqual(['r1']);
    expect(c.removeRoute('r1')).toBe(true);
    expect(c.faceAhead(326, 0, 412, Math.PI, 2, STEP, 2)?.routes).toEqual([]);
    expect(c.removeRoute('r1')).toBe(false);
  });

  it('addBlock with the same id replaces the rect', () => {
    const c = createCollider(makeMap());
    c.addBlock(piece);
    c.addBlock({ ...piece, x0: 335, x1: 338 });
    expect(c.groundAt(326, 410, 5)).toBe(0);
    expect(c.groundAt(336, 410, 5)).toBe(3.2);
    expect(c.blockById('piece-1')?.x0).toBe(335);
  });
});
