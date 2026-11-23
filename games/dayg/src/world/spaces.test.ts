import { describe, expect, it } from 'vitest';
import type { BuildingDef, BuildingParts, DoorInfo, StairInfo } from './buildingTypes';
import type { BlockDef } from './types';
import { createBuildingIndex } from './spaces';
import { createInteriorTracker } from '../game/interior';
import { createBus, type GameEvents } from '../game/bus';
import { INTERIOR } from '../config';

function def(id: string, footprint: { x0: number; x1: number; z0: number; z1: number }, storeys: number[], region: BuildingDef['region']): BuildingDef {
  return {
    id, name: id, region, style: 'stone', footprint, storeys,
    shell: { thick: 0.5, height: 6, openings: [] },
    roof: { thick: 0.3, eaves: 0.2 },
    walls: [], floors: [], stairs: [], boxes: [], routes: [], containers: [], spots: [], props: [],
  };
}

function door(id: string, building: string, side: 'n' | 's', x: number, z0: number, z1: number, y: number, inZ: number, outZ: number): DoorInfo {
  return {
    id, building, side, x, z: (z0 + z1) / 2, y, width: 2, height: 2.8,
    rect: { x0: x - 1, x1: x + 1, z0, z1 },
    inX: x, inZ, outX: x, outZ, // inside/outside points sit on the door's centre line
  };
}

// Building A: one storey, interior x 0.5..9.5, z 0.5..9.5, door on its n side (z0 = 0).
const roofA: BlockDef = { id: 'bld-a-roof', kind: 'roof', x0: 0, x1: 10, z0: 0, z1: 10, y: 3.8, h: 0.5 };
const A: BuildingParts = {
  def: def('bld-a', { x0: 0, x1: 10, z0: 0, z1: 10 }, [0], 'ivy-rows'),
  blocks: [roofA], role: { 'bld-a-roof': 'roof' }, layer: { 'bld-a-roof': 1 },
  routes: [], pits: [], containers: [], spots: [], props: [],
  interior: { x0: 0.5, x1: 9.5, z0: 0.5, z1: 9.5 },
  roofY: 3.8,
  doors: [door('bld-a-door', 'bld-a', 'n', 5, 0, 0.5, 0, 1.75, -1.25)],
  stairs: [],
  cut: [['bld-a-roof']],
};

// Building B: two storeys (ground, floor top 3.0), a stair at x 22..24, z 2..6 (foot at z 6.5, top at z 1.5),
// doors on its n side (z0 = 0) and s side (z1 = 10).
const stair: StairInfo = { id: 'bld-b-stair', rect: { x0: 22, x1: 24, z0: 2, z1: 6 }, fromY: 0, toY: 3.0, footX: 23, footZ: 6.5, topX: 23, topZ: 1.5 };
const floorBlk: BlockDef = { id: 'bld-b-floor-1', kind: 'stone', x0: 20.5, x1: 29.5, z0: 0.5, z1: 9.5, y: 2.6, h: 0.4 };
const roofBlk: BlockDef = { id: 'bld-b-roof', kind: 'roof', x0: 20, x1: 30, z0: 0, z1: 10, y: 5.8, h: 0.2 };
const B: BuildingParts = {
  def: def('bld-b', { x0: 20, x1: 30, z0: 0, z1: 10 }, [0, 3], 'the-sinks'),
  blocks: [floorBlk, roofBlk], role: { 'bld-b-floor-1': 'floor', 'bld-b-roof': 'roof' },
  layer: { 'bld-b-floor-1': 1, 'bld-b-roof': 2 },
  routes: [], pits: [], containers: [], spots: [], props: [],
  interior: { x0: 20.5, x1: 29.5, z0: 0.5, z1: 9.5 },
  roofY: 5.8,
  doors: [
    door('bld-b-door-n', 'bld-b', 'n', 26, 0, 0.5, 0, 1.75, -1.25),
    door('bld-b-door-s', 'bld-b', 's', 26, 9.5, 10, 0, 8.25, 11.25),
  ],
  stairs: [stair],
  cut: [['bld-b-floor-1', 'bld-b-roof'], ['bld-b-roof']],
};

const index = createBuildingIndex([A, B]);
const v = (x: number, y: number, z: number) => ({ x, y, z });

describe('building index', () => {
  it('insideAt respects the inset (strict) and the NaN y case', () => {
    expect(index.insideAt(5, 0, 0.6)?.def.id).toBe('bld-a');
    expect(index.insideAt(5, 0, 0.6, INTERIOR.enterInset)).toBeNull();
    expect(index.insideAt(5, 0, 1.0, INTERIOR.enterInset)?.def.id).toBe('bld-a');
    expect(index.insideAt(5, Number.NaN, 5)?.def.id).toBe('bld-a');
    expect(index.insideAt(5, 4.0, 5)).toBeNull(); // above the roof
    expect(index.insideAt(5, 0, -3)).toBeNull();
  });

  it('footprintAt grows by pad, inclusive', () => {
    expect(index.footprintAt(-0.4, 0, 5)).toBeNull();
    expect(index.footprintAt(-0.4, 0, 5, 0.5)?.def.id).toBe('bld-a');
    expect(index.footprintAt(-0.5, 0, 5, 0.5)?.def.id).toBe('bld-a');
  });

  it('storeyAt, ceilingAt (null on the top storey) and doorAt', () => {
    expect(index.storeyAt(B, 2.0)).toBe(0);
    expect(index.storeyAt(B, 2.6)).toBe(1);
    expect(index.storeyAt(B, 2.4)).toBe(0);
    expect(index.ceilingAt(B, 0)).toBe(2.6);
    expect(index.ceilingAt(B, 1)).toBeNull();
    expect(index.ceilingAt(A, 0)).toBeNull();
    expect(index.doorAt(5, 0.25)?.id).toBe('bld-a-door');
    expect(index.doorAt(5, -0.4)?.id).toBe('bld-a-door');
    expect(index.doorAt(5, 5)).toBeNull();
    expect(index.doorAt(26, 9.75)?.id).toBe('bld-b-door-s');
  });

  it('spaceOf reports building, storey and doorway', () => {
    expect(index.spaceOf(5, 0, 3)).toEqual({ building: 'bld-a', storey: 0, doorway: null });
    expect(index.spaceOf(5, 0, 0.25)).toEqual({ building: null, storey: 0, doorway: 'bld-a-door' });
    expect(index.spaceOf(-3, 0, -3)).toEqual({ building: null, storey: 0, doorway: null });
  });
});

describe('nextWaypoint', () => {
  it('outside -> inside: out point, then in point once within 1.0', () => {
    expect(index.nextWaypoint(v(5, 0, -3), v(5, 0, 3))).toEqual({ x: 5, z: -1.25 });
    expect(index.nextWaypoint(v(5, 0, -0.9), v(5, 0, 3))).toEqual({ x: 5, z: 1.75 });
  });

  it('inside -> outside: in point while far, out point once within 1.0', () => {
    expect(index.nextWaypoint(v(5, 0, 3), v(5, 0, -3))).toEqual({ x: 5, z: 1.75 });
    expect(index.nextWaypoint(v(5, 0, 1), v(5, 0, -3))).toEqual({ x: 5, z: -1.25 });
  });

  it('standing in the doorway: the far side', () => {
    expect(index.nextWaypoint(v(5, 0, 0.25), v(5, 0, 3))).toEqual({ x: 5, z: 1.75 });
    expect(index.nextWaypoint(v(5, 0, 0.25), v(5, 0, -3))).toEqual({ x: 5, z: -1.25 });
  });

  it('same room -> null, and outside to outside -> null', () => {
    expect(index.nextWaypoint(v(5, 0, 3), v(7, 0, 6))).toBeNull();
    expect(index.nextWaypoint(v(-3, 0, -3), v(-6, 0, -6))).toBeNull();
  });

  it('ground floor -> upper floor: foot, then top once on the foot or in the stair', () => {
    expect(index.nextWaypoint(v(21, 0, 8), v(23, 3.0, 2.5))).toEqual({ x: 23, z: 6.5 });
    expect(index.nextWaypoint(v(23, 0, 6.0), v(23, 3.0, 2.5))).toEqual({ x: 23, z: 1.5 });
  });

  it('upper floor -> ground floor goes down the stair', () => {
    expect(index.nextWaypoint(v(23, 3.0, 2.5), v(21, 0, 8))).toEqual({ x: 23, z: 6.5 });
  });
});

function track() {
  const bus = createBus();
  const events: Array<{ k: keyof GameEvents; e: unknown }> = [];
  for (const k of ['entered-building', 'left-building'] as const) bus.on(k, (e) => events.push({ k, e }));
  const tracker = createInteriorTracker({ index, bus });
  return { tracker, events };
}

describe('interior tracker', () => {
  it('a walk from outside through the doorway emits entered-building once, with the door', () => {
    const { tracker, events } = track();
    for (const z of [-3, -1.25, 0.25, 1.0, 2.0]) tracker.update(v(5, 0, z), 0.1);
    const entered = events.filter((x) => x.k === 'entered-building');
    expect(entered).toEqual([{ k: 'entered-building', e: { building: 'bld-a', region: 'ivy-rows', door: 'bld-a-door' } }]);
    expect(tracker.state.building).toBe('bld-a');
  });

  it('the doorway alone emits nothing', () => {
    const { tracker, events } = track();
    tracker.update(v(5, 0, -3), 0.1);
    tracker.update(v(5, 0, 0.25), 0.1);
    expect(events).toHaveLength(0);
    expect(tracker.state.building).toBeNull();
  });

  it('going upstairs changes skip and ceilY', () => {
    const { tracker } = track();
    tracker.update(v(21, 0, 8), 0.1);
    expect(tracker.state.building).toBe('bld-b');
    expect(tracker.state.storey).toBe(0);
    expect(tracker.state.ceilY).toBe(2.6);
    expect([...tracker.state.skip].sort()).toEqual(['bld-b-floor-1', 'bld-b-roof']);
    tracker.update(v(23, 3.0, 2.5), 0.1);
    expect(tracker.state.storey).toBe(1);
    expect(tracker.state.ceilY).toBeNull();
    expect([...tracker.state.skip]).toEqual(['bld-b-roof']);
  });

  it('walking out past exitPad emits left-building; within the pad it does not', () => {
    const { tracker, events } = track();
    tracker.update(v(5, 0, 1), 0.1);
    tracker.update(v(5, 0, -0.5), 0.1);
    expect(events.filter((x) => x.k === 'left-building')).toHaveLength(0);
    tracker.update(v(5, 0, -2), 0.1);
    expect(events.filter((x) => x.k === 'left-building')).toEqual([{ k: 'left-building', e: { building: 'bld-a' } }]);
    expect(tracker.state.building).toBeNull();
    expect(tracker.state.ceilY).toBeNull();
    expect(tracker.state.skip.size).toBe(0);
  });

  it('a tracker whose first update is inside emits nothing', () => {
    const { tracker, events } = track();
    tracker.update(v(5, 0, 1), 0.1);
    expect(events).toHaveLength(0);
    expect(tracker.state.building).toBe('bld-a');
  });
});
