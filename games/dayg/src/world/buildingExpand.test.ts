import { describe, it, expect } from 'vitest';
import { BUILDING_PREFIX, STAIR_RISE } from '../config';
import { expandBuilding } from './buildingExpand';
import { POTTING_SHED } from './buildings/pottingShed';
import { BUILDINGS } from './buildings/index';
import { checkBuilding } from './buildingCheck';
import { MAP } from './blockout';
import type { BuildingDef } from './buildingTypes';

const P = `${BUILDING_PREFIX}potting-shed-`;

describe('expandBuilding: Potting Shed', () => {
  const parts = expandBuilding(POTTING_SHED);
  const byId = (id: string) => parts.blocks.find((b) => b.id === id);

  it('every block has the building prefix and a positive height', () => {
    expect(parts.blocks.length).toBeGreaterThan(0);
    for (const b of parts.blocks) {
      expect(b.id.startsWith(P)).toBe(true);
      expect(b.h).toBeGreaterThan(0);
    }
  });

  it('west wall: two pieces and a lintel over the door', () => {
    const pieces = parts.blocks.filter((b) => /^bld-potting-shed-wall-w-\d+$/.test(b.id));
    expect(pieces).toHaveLength(2);
    expect(parts.role[`${P}wall-w-0`]).toBe('wall');
    const lintel = byId(`${P}wall-w-l-door`);
    expect(lintel?.y).toBe(20);
    expect(parts.role[`${P}wall-w-l-door`]).toBe('lintel');
  });

  it('east wall: window sill and lintel', () => {
    const sill = byId(`${P}wall-e-s-window-e`);
    expect(sill?.y).toBe(0);
    expect(sill?.h).toBeCloseTo(13);
    expect(byId(`${P}wall-e-l-window-e`)).toBeDefined();
  });

  it('one door with its in and out points', () => {
    expect(parts.doors).toHaveLength(1);
    const d = parts.doors[0];
    expect(d.inX).toBeCloseTo(448.1);
    expect(d.inZ).toBeCloseTo(462);
    expect(d.outX).toBeCloseTo(444.5);
    expect(d.outZ).toBeCloseTo(462);
  });

  it('the roof and ridge are hidden on storey 0', () => {
    expect(parts.cut[0]).toContain(`${P}roof`);
    expect(parts.cut[0]).toContain(`${P}ridge`);
  });

  it('routes are numbered and point at real blocks', () => {
    expect(parts.routes.map((r) => r.id)).toEqual(['r-potting-shed-0', 'r-potting-shed-1', 'r-potting-shed-2']);
    for (const r of parts.routes) expect(byId(r.block)).toBeDefined();
  });

  it('containers are prefixed and in the bin corner', () => {
    expect(parts.containers).toHaveLength(5);
    for (const c of parts.containers) {
      expect(c.id.startsWith('c-potting-shed-')).toBe(true);
      expect(c.region).toBe('bin-corner');
    }
  });
});

const TWO: BuildingDef = {
  id: 'fixture', name: 'Fixture', region: 'bin-corner', style: 'plank',
  footprint: { x0: 0, x1: 10, z0: 0, z1: 10 }, storeys: [0, 3.6],
  shell: { thick: 0.6, height: 8, openings: [] },
  roof: { thick: 0.5, eaves: 0.3 },
  walls: [], boxes: [], routes: [], containers: [], spots: [], props: [],
  floors: [{ storey: 1, rect: { x0: 0.6, x1: 9.4, z0: 0.6, z1: 9.4 }, holes: [{ x0: 6, x1: 8, z0: 1, z1: 4 }] }],
  stairs: [{ id: 'st', rect: { x0: 6, x1: 8, z0: 1, z1: 4 }, up: 'n', fromY: 0, toY: 3.6 }],
};

describe('expandBuilding: two-storey fixture', () => {
  const parts = expandBuilding(TWO);
  const hole = TWO.floors[0].holes![0];

  it('the floor slab is split around the stair hole', () => {
    const slabs = parts.blocks.filter((b) => parts.role[b.id] === 'floor');
    expect(slabs.length).toBeGreaterThan(0);
    for (const b of slabs) {
      const overlaps = b.x0 < hole.x1 && b.x1 > hole.x0 && b.z0 < hole.z1 && b.z1 > hole.z0;
      expect(overlaps).toBe(false);
    }
  });

  it('the stair has ceil(rise / STAIR_RISE) steps and the last top is toY - 0.1', () => {
    const steps = parts.blocks.filter((b) => parts.role[b.id] === 'stair');
    expect(steps).toHaveLength(Math.ceil((3.6 - 0.1 - 0) / STAIR_RISE));
    const topMax = Math.max(...steps.map((b) => b.y + b.h));
    expect(topMax).toBeCloseTo(3.6 - 0.1);
  });

  it('cut[1] holds only roof blocks', () => {
    expect(parts.cut[1].length).toBeGreaterThan(0);
    for (const id of parts.cut[1]) expect(parts.role[id]).toBe('roof');
  });
});

describe('building checks', () => {
  for (const def of BUILDINGS) {
    it.skipIf(def.draft === true)(`building ${def.id}`, () => {
      expect(checkBuilding(expandBuilding(def), MAP.blocks.filter((b) => !b.id.startsWith(BUILDING_PREFIX)))).toEqual([]);
    });
  }
});
