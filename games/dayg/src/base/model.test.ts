// Base model and save: placement rules, damage cascade, repair and refund costs, door and ladder rules, JSON, localStorage.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clearBase, lastBaseSeed, loadBase, saveBase } from './save';
import {
  barrierOn, baseHp, canPlace, createBase, damagePiece, dismantlePiece, findPiece, parseBase, piecesOn, placePiece,
  reinforcePiece, repairCost, repairPiece, serializeBase, setDoorState, setLadderUp,
} from './model';
import type { Aim, BaseState, PlotDef } from './types';

const PLOT: PlotDef = { x0: 0, z0: 0, y: 0, region: 'leaning-rows' };
const edge = (slot: string, side: -1 | 1 = 1): Aim => ({ slot, kind: 'edge', side });
const ladderAim = (slot: string, side: -1 | 1): Aim => ({ slot, kind: 'ladder', side });
const cell = (slot: string): Aim => ({ slot, kind: 'cell', side: 1 });

function fresh(): BaseState {
  return createBase(7, PLOT);
}

describe('placement', () => {
  it('places a wall on an edge and refuses a second barrier there', () => {
    const b = fresh();
    expect(canPlace(b, 'plank-wall', edge('e:x:0:0'))).toBeNull();
    const wall = placePiece(b, 'plank-wall', edge('e:x:0:0'));
    expect(wall.hp).toBe(120);
    expect(wall.maxHp).toBe(120);
    expect(wall.side).toBe(1);
    expect(canPlace(b, 'plank-wall', edge('e:x:0:0'))).toBe('Something is already built here.');
    expect(canPlace(b, 'door', edge('e:x:0:0'))).toBe('Something is already built here.');
  });

  it('refuses a kind placed on the wrong aim kind', () => {
    expect(canPlace(fresh(), 'plank-wall', cell('c:0:0'))).toBe('That does not go there.');
  });

  it('allows a barricade over a closed door and refuses it over an open one', () => {
    const b = fresh();
    placePiece(b, 'door', edge('e:z:1:0'));
    const door = barrierOn(b, 'e:z:1:0')!;
    expect(canPlace(b, 'barricade', edge('e:z:1:0', -1))).toBeNull();
    const bar = placePiece(b, 'barricade', edge('e:z:1:0', -1));
    expect(bar.overDoor).toBe(true);
    expect(bar.side).toBe(-1);
    expect(canPlace(b, 'barricade', edge('e:z:1:0', -1))).toBe('Something is already built here.');
    expect(setDoorState(b, door.id, { open: false })).toBe(true);

    const b2 = fresh();
    placePiece(b2, 'door', edge('e:z:1:0'));
    setDoorState(b2, barrierOn(b2, 'e:z:1:0')!.id, { open: true });
    expect(canPlace(b2, 'barricade', edge('e:z:1:0'))).toBe('Something is already built here.');
  });

  it('a ladder needs a wall to lean on, and one per side', () => {
    const b = fresh();
    expect(canPlace(b, 'ladder', ladderAim('e:x:0:0', 1))).toBe('A ladder needs a wall to lean on.');
    placePiece(b, 'plank-wall', edge('e:x:0:0'));
    expect(canPlace(b, 'ladder', ladderAim('e:x:0:0', 1))).toBeNull();
    placePiece(b, 'ladder', ladderAim('e:x:0:0', 1));
    expect(canPlace(b, 'ladder', ladderAim('e:x:0:0', 1))).toBe('There is a ladder here already.');
    expect(canPlace(b, 'ladder', ladderAim('e:x:0:0', -1))).toBeNull();
  });

  it('a cell piece refuses any piece already on the cell', () => {
    const b = fresh();
    expect(canPlace(b, 'chest', cell('c:1:1'))).toBeNull();
    placePiece(b, 'chest', cell('c:1:1'));
    expect(canPlace(b, 'bed', cell('c:1:1'))).toBe('Something is already built here.');
  });
});

describe('damage, repair and reinforce', () => {
  it('damage to 0 removes the wall and its ladder', () => {
    const b = fresh();
    const wall = placePiece(b, 'plank-wall', edge('e:x:0:0'));
    placePiece(b, 'ladder', ladderAim('e:x:0:0', 1));
    expect(damagePiece(b, wall.id, 10)).toEqual([]);
    expect(findPiece(b, wall.id)?.hp).toBe(110);
    const gone = damagePiece(b, wall.id, 110);
    expect(gone.length).toBe(2);
    expect(b.pieces.length).toBe(0);
  });

  it('repairCost of a plank wall is PLANK 1 + NAIL 2', () => {
    const b = fresh();
    const wall = placePiece(b, 'plank-wall', edge('e:x:0:0'));
    expect(repairCost(wall)).toEqual([{ tag: 'PLANK', count: 1 }, { tag: 'NAIL', count: 2 }]);
  });

  it('repairPiece restores hp to maxHp', () => {
    const b = fresh();
    const wall = placePiece(b, 'plank-wall', edge('e:x:0:0'));
    damagePiece(b, wall.id, 50);
    repairPiece(b, wall.id);
    expect(findPiece(b, wall.id)?.hp).toBe(120);
  });

  it('reinforce a barricade to 200 hp and add the reinforce cost to repair and refund', () => {
    const b = fresh();
    const bar = placePiece(b, 'barricade', edge('e:x:0:0'));
    reinforcePiece(b, bar.id);
    expect(findPiece(b, bar.id)).toMatchObject({ hp: 200, maxHp: 200, reinforced: true });
    expect(repairCost(bar)).toEqual([{ tag: 'PLANK', count: 2 }, { tag: 'NAIL', count: 2 }]);
    const plankWall = placePiece(b, 'plank-wall', edge('e:z:0:0'));
    reinforcePiece(b, plankWall.id);
    expect(findPiece(b, plankWall.id)?.maxHp).toBe(120);
  });

  it('baseHp sums edge pieces only', () => {
    const b = fresh();
    placePiece(b, 'plank-wall', edge('e:x:0:0'));
    placePiece(b, 'chest', cell('c:0:0'));
    expect(baseHp(b)).toEqual({ hp: 120, maxHp: 120 });
  });
});

describe('dismantle', () => {
  it('refund of a plank wall is PLANK 1 + NAIL 3', () => {
    const b = fresh();
    const wall = placePiece(b, 'plank-wall', edge('e:x:0:0'));
    const r = dismantlePiece(b, wall.id);
    expect(r.refund).toEqual([{ tag: 'PLANK', count: 1 }, { tag: 'NAIL', count: 3 }]);
    expect(r.removed.map((p) => p.id)).toEqual([wall.id]);
    expect(b.pieces.length).toBe(0);
  });

  it('dismantling a door takes its ladders with it', () => {
    const b = fresh();
    const door = placePiece(b, 'door', edge('e:x:0:0'));
    placePiece(b, 'ladder', ladderAim('e:x:0:0', 1));
    expect(dismantlePiece(b, door.id).removed.length).toBe(2);
  });
});

describe('doors and ladders', () => {
  it('door lock rules', () => {
    const b = fresh();
    const door = placePiece(b, 'door', edge('e:x:0:0'));
    expect(setDoorState(b, door.id, { locked: true })).toBe(false);
    expect(setDoorState(b, door.id, { hasLock: true })).toBe(true);
    expect(setDoorState(b, door.id, { open: true })).toBe(true);
    expect(setDoorState(b, door.id, { locked: true })).toBe(false);
    expect(setDoorState(b, door.id, { open: false })).toBe(true);
    expect(setDoorState(b, door.id, { locked: true })).toBe(true);
    expect(setDoorState(b, door.id, { open: true })).toBe(false);
    expect(findPiece(b, door.id)).toMatchObject({ open: false, locked: true, hasLock: true });
    expect(setDoorState(b, door.id, { locked: false })).toBe(true);
    expect(setDoorState(b, door.id, { open: true })).toBe(true);
  });

  it('a barricade over a door keeps the door shut', () => {
    const b = fresh();
    const door = placePiece(b, 'door', edge('e:x:0:0'));
    placePiece(b, 'barricade', edge('e:x:0:0', 1));
    expect(setDoorState(b, door.id, { open: true })).toBe(false);
  });

  it('ladder pull up', () => {
    const b = fresh();
    placePiece(b, 'plank-wall', edge('e:x:0:0'));
    const ladder = placePiece(b, 'ladder', ladderAim('e:x:0:0', 1));
    setLadderUp(b, ladder.id, true);
    expect(findPiece(b, ladder.id)?.up).toBe(true);
    expect(piecesOn(b, 'e:x:0:0').length).toBe(2);
  });
});

describe('serialisation', () => {
  it('round trips', () => {
    const b = fresh();
    placePiece(b, 'plank-wall', edge('e:x:0:0'));
    placePiece(b, 'chest', cell('c:0:0'));
    const back = parseBase(serializeBase(b));
    expect(back).toEqual(b);
  });

  it('parseBase(garbage) is null', () => {
    expect(parseBase('not json')).toBeNull();
    expect(parseBase('{"version":2}')).toBeNull();
    expect(parseBase(JSON.stringify({ ...fresh(), pieces: [{ id: 'x', kind: 'nope' }] }))).toBeNull();
  });
});

describe('save', () => {
  const store = new Map<string, string>();
  const g = globalThis as { localStorage?: unknown };
  beforeEach(() => {
    store.clear();
    g.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    };
  });
  afterEach(() => { delete g.localStorage; });

  it('round trips and lastBaseSeed works', () => {
    const b = fresh();
    placePiece(b, 'plank-wall', edge('e:x:0:0'));
    saveBase(b);
    expect(lastBaseSeed()).toBe(7);
    expect(loadBase(7)).toEqual(b);
    expect(loadBase(8)).toBeNull();
    clearBase(7);
    expect(loadBase(7)).toBeNull();
    expect(lastBaseSeed()).toBeNull();
  });

  it('with no localStorage, loadBase returns null without throwing', () => {
    delete g.localStorage;
    expect(loadBase(7)).toBeNull();
    expect(lastBaseSeed()).toBeNull();
    expect(() => saveBase(fresh())).not.toThrow();
  });
});
