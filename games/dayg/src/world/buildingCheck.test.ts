import { describe, it, expect } from 'vitest';
import { checkBuilding } from './buildingCheck';
import type { BuildingDef, BuildingParts } from './buildingTypes';
import type { BlockDef } from './types';
import type { ContainerDef } from '../sim/types';

// A 10 x 10 one-room hut inside Ivy Rows (x 0..160, z 300 is inside z 240..400). Walls are 0.5 thick, 3 high,
// with a door gap on the north (z 300) face centred on x 65. Roof sits inside the outer faces so no faces are flush.
const hut = (gap = 2.6): BuildingParts => {
  const h = 3;
  const gx0 = 65 - gap / 2, gx1 = 65 + gap / 2;
  const blocks: BlockDef[] = [
    { id: 'hut-w', kind: 'wall', x0: 60, x1: 60.5, z0: 300, z1: 310, y: 0, h },
    { id: 'hut-e', kind: 'wall', x0: 69.5, x1: 70, z0: 300, z1: 310, y: 0, h },
    { id: 'hut-s', kind: 'wall', x0: 60.5, x1: 69.5, z0: 309.5, z1: 310, y: 0, h },
    { id: 'hut-nl', kind: 'wall', x0: 60.5, x1: gx0, z0: 300, z1: 300.5, y: 0, h },
    { id: 'hut-nr', kind: 'wall', x0: gx1, x1: 69.5, z0: 300, z1: 300.5, y: 0, h },
    { id: 'hut-lintel', kind: 'wall', x0: gx0, x1: gx1, z0: 300, z1: 300.5, y: 2.8, h: 0.2 },
    { id: 'hut-roof', kind: 'roof', x0: 60.2, x1: 69.8, z0: 300.2, z1: 309.8, y: h, h: 0.5 },
  ];
  const role: Record<string, BuildingParts['role'][string]> = {};
  for (const b of blocks) role[b.id] = b.id === 'hut-roof' ? 'roof' : 'wall';
  const containers: ContainerDef[] = [{ id: 'hut-crate', type: 'crate', region: 'ivy-rows', x: 65, y: 0, z: 305 }];
  const def: BuildingDef = {
    id: 'test-hut', name: 'Test hut', region: 'ivy-rows', style: 'plank',
    footprint: { x0: 60, x1: 70, z0: 300, z1: 310 }, storeys: [0],
    shell: { thick: 0.5, height: 3.5, openings: [{ id: 'door-n', side: 'n', at: gx0 - 60, width: gap, height: 2.8, door: true }] },
    roof: { thick: 0.5, eaves: 0.2 },
    walls: [], floors: [], stairs: [], boxes: [],
    routes: [], containers: [], spots: [], props: [],
  };
  return {
    def, blocks, role, layer: {}, routes: [], pits: [], containers, spots: [], props: [],
    interior: { x0: 60.5, x1: 69.5, z0: 300.5, z1: 309.5 }, roofY: 3.3,
    doors: [{
      id: 'door-n', building: 'test-hut', side: 'n', x: 65, z: 300.25, y: 0, width: gap, height: 2.8,
      rect: { x0: gx0, x1: gx1, z0: 300, z1: 300.5 }, inX: 65, inZ: 301.5, outX: 65, outZ: 298.5,
    }],
    stairs: [], cut: [[]],
  };
};

describe('checkBuilding', () => {
  it('passes a one-room hut with a 2.6 door, a roof and a container on the floor', () => {
    expect(checkBuilding(hut(), [])).toEqual([]);
  });

  it('passes a draft building without checking it', () => {
    const p = hut(1.5);
    p.def = { ...p.def, draft: true };
    expect(checkBuilding(p, [])).toEqual([]);
  });

  it('reports a 1.5 wide door as a door problem', () => {
    const problems = checkBuilding(hut(1.5), []);
    expect(problems.some((s) => s.includes("'door'"))).toBe(true);
    expect(problems.every((s) => s.startsWith('test-hut: '))).toBe(true);
  });

  it('reports a container in a sealed box as unreachable', () => {
    const p = hut();
    const seal = (id: string, x0: number, x1: number, z0: number, z1: number): BlockDef =>
      ({ id, kind: 'wall', x0, x1, z0, z1, y: 0, h: 3 });
    const walls = [
      seal('seal-w', 63, 63.5, 303, 307), seal('seal-e', 66.5, 67, 303, 307),
      seal('seal-n', 63.5, 66.5, 303, 303.5), seal('seal-s', 63.5, 66.5, 306.5, 307),
    ];
    for (const w of walls) { p.blocks.push(w); p.role[w.id] = 'wall'; }
    expect(checkBuilding(p, []).some((s) => s.includes("'unreachable'"))).toBe(true);
  });

  it('reports two overlapping boxes with the same top as coplanar', () => {
    const p = hut();
    const a: BlockDef = { id: 'crate-a', kind: 'bin', x0: 61, x1: 63, z0: 305, z1: 307, y: 0, h: 1 };
    const b: BlockDef = { id: 'crate-b', kind: 'bin', x0: 62, x1: 64, z0: 305, z1: 307, y: 0.5, h: 0.5 };
    p.blocks.push(a, b);
    p.role['crate-a'] = 'furniture';
    p.role['crate-b'] = 'furniture';
    const problems = checkBuilding(p, []);
    expect(problems.some((s) => s.includes("'coplanar'") && s.includes('crate-a') && s.includes('crate-b'))).toBe(true);
  });

  it('reports a footprint across two regions as region', () => {
    const p = hut();
    p.def = { ...p.def, footprint: { x0: 150, x1: 170, z0: 300, z1: 310 } };
    expect(checkBuilding(p, []).some((s) => s.includes("'region'"))).toBe(true);
  });

  it('reports an other block inside the footprint as clash', () => {
    const stray: BlockDef = { id: 'stray-stone', kind: 'stone', x0: 66, x1: 67, z0: 305, z1: 306, y: 0, h: 1 };
    expect(checkBuilding(hut(), [stray]).some((s) => s.includes("'clash'"))).toBe(true);
  });
});
