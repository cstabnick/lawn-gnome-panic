import { describe, it, expect } from 'vitest';
import type { Collider, Vec3 } from '../world/collide';
import type { BaseState, PieceState, PlotDef } from './types';
import {
  aimAt, allCells, allEdges, cellKey, claimCheck, edgeKey, isPerimeter, ladderRoute, parseSlot, pieceBox, sealedAt, sealedCells, snapPlot,
} from './grid';

const plot: PlotDef = { x0: 320, z0: 410, y: 0, region: 'forecourt' };

function piece(over: Partial<PieceState> & Pick<PieceState, 'kind' | 'slot'>): PieceState {
  return {
    id: 'piece-1', side: 1, hp: 10, maxHp: 10, open: false, hasLock: false, locked: false,
    up: false, reinforced: false, overDoor: false, items: [], ...over,
  };
}

function base(pieces: PieceState[]): BaseState {
  return { version: 1, seed: 1, plot, pieces, nextId: pieces.length + 1 };
}

function fakeCollider(over: Partial<Collider> = {}): Collider {
  const c: Collider = {
    groundAt: () => 0,
    baseAt: () => 0,
    move: () => null,
    faceAhead: () => null,
    edgeAhead: () => null,
    regionAt: () => 'forecourt',
    havenAt: () => null,
    inBounds: () => true,
    addRoute: () => {},
    routesOn: () => [],
    blockById: () => undefined,
    addBlock: () => {},
    removeBlock: () => false,
    removeRoute: () => false,
    ...over,
  };
  return c;
}

describe('snapPlot', () => {
  it('snaps to the 2 gm grid, offset by half the plot', () => {
    expect(snapPlot(326, 416)).toEqual({ x0: 320, z0: 410 });
  });
});

describe('slot keys', () => {
  it('round-trips and rejects malformed or out-of-range keys', () => {
    expect(parseSlot(edgeKey('x', 1, 2))).toEqual({ kind: 'edge', axis: 'x', i: 1, j: 2 });
    expect(parseSlot(edgeKey('z', 3, 0))).toEqual({ kind: 'edge', axis: 'z', i: 3, j: 0 });
    expect(parseSlot(cellKey(2, 2))).toEqual({ kind: 'cell', i: 2, j: 2 });
    expect(parseSlot('e:x:3:0')).toBeNull();
    expect(parseSlot('c:3:0')).toBeNull();
    expect(parseSlot('q')).toBeNull();
  });

  it('lists 24 unique edges, 12 of them on the perimeter, and 9 cells', () => {
    const edges = allEdges();
    expect(edges).toHaveLength(24);
    expect(new Set(edges).size).toBe(24);
    expect(edges.filter(isPerimeter)).toHaveLength(12);
    expect(allCells()).toHaveLength(9);
  });
});

describe('aimAt', () => {
  it('aims at the south edge from inside the plot', () => {
    expect(aimAt(plot, 326, 407.5, 0, 'edge')).toEqual({ slot: 'e:x:1:0', kind: 'edge', side: -1 });
  });

  it('returns null when the aim point is outside the plot', () => {
    expect(aimAt(plot, 326, 405, 0, 'edge')).toBeNull();
  });

  it('aims at a cell', () => {
    expect(aimAt(plot, 326, 416, 0, 'cell')).toEqual({ slot: 'c:1:2', kind: 'cell', side: 1 });
  });
});

describe('pieceBox', () => {
  it('gives a plank wall its inset box', () => {
    const box = pieceBox(plot, piece({ kind: 'plank-wall', slot: 'e:x:0:0' }));
    expect(box).toEqual({ x0: 320.25, x1: 323.75, z0: 409.8, z1: 410.2, y: 0, h: 3.2 });
  });

  it('gives an open door no box', () => {
    expect(pieceBox(plot, piece({ kind: 'door', slot: 'e:x:0:0', open: true }))).toBeNull();
  });

  it('keeps walls on all 24 edges apart from each other', () => {
    const boxes = allEdges().map((slot) => pieceBox(plot, piece({ kind: 'plank-wall', slot })));
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const p = boxes[a]!, q = boxes[b]!;
        const apartX = p.x1 < q.x0 - 0.01 || q.x1 < p.x0 - 0.01;
        const apartZ = p.z1 < q.z0 - 0.01 || q.z1 < p.z0 - 0.01;
        expect(apartX || apartZ).toBe(true);
      }
    }
  });
});

describe('sealedCells', () => {
  it('an empty base is all open', () => {
    expect(sealedCells(base([]))).toEqual(new Array(9).fill(false));
  });

  it('twelve perimeter walls seal every cell', () => {
    const walls = allEdges().filter(isPerimeter).map((slot) => piece({ kind: 'plank-wall', slot }));
    expect(sealedCells(base(walls))).toEqual(new Array(9).fill(true));
  });

  it('one open perimeter door leaves the base open', () => {
    const walls = allEdges().filter(isPerimeter).map((slot) =>
      slot === 'e:x:0:0' ? piece({ kind: 'door', slot, open: true }) : piece({ kind: 'plank-wall', slot }));
    expect(sealedCells(base(walls))).toEqual(new Array(9).fill(false));
  });

  it('walls round one cell seal only that cell', () => {
    const walls = ['e:x:0:0', 'e:x:0:1', 'e:z:0:0', 'e:z:1:0'].map((slot) => piece({ kind: 'plank-wall', slot }));
    const sealed = sealedCells(base(walls));
    expect(sealed[0]).toBe(true);
    expect(sealed.slice(1)).toEqual(new Array(8).fill(false));
    expect(sealedAt(base(walls), 322, 412)).toBe(true);
  });
});

describe('ladderRoute', () => {
  it.each([
    ['x', -1, 'n'],
    ['x', 1, 's'],
    ['z', -1, 'w'],
    ['z', 1, 'e'],
  ] as const)('maps wall axis %s side %i to %s', (axis, side, expected) => {
    const route = ladderRoute({ id: 'piece-5', side }, { id: 'piece-2', slot: edgeKey(axis, 0, 0) });
    expect(route).toEqual({ id: 'piece-5-route', block: 'piece-2', side: expected, kind: 'ladder', at: 1.75 });
  });
});

describe('claimCheck', () => {
  it('accepts flat open ground', () => {
    const r = claimCheck(fakeCollider(), 326, 0, 416);
    expect(r).toEqual({ ok: true, plot: { x0: 320, z0: 410, y: 0, region: 'forecourt' } });
  });

  it('refuses ground that is not flat', () => {
    let calls = 0;
    const collider = fakeCollider({ groundAt: () => (++calls === 3 ? 1 : 0) });
    expect(claimCheck(collider, 326, 0, 416)).toEqual({ ok: false, why: 'The ground is not flat here.' });
  });

  it('refuses when something is in the way', () => {
    let calls = 0;
    const collider = fakeCollider({
      move: (_pos: Vec3) => (++calls === 7 ? 'x' : null),
    });
    expect(claimCheck(collider, 326, 0, 416)).toEqual({ ok: false, why: 'Something is in the way.' });
  });
});
