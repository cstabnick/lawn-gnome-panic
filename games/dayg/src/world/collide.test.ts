import { describe, it, expect } from 'vitest';
import { createCollider, type Vec3 } from './collide';
import type { BlockoutMap } from './types';

// A small hand-built map inside Ivy Rows (x 0..160, z 240..400).
const makeMap = (): BlockoutMap => ({
  bounds: { x0: 0, x1: 560, z0: 0, z1: 520 },
  blocks: [
    { id: 'wall', kind: 'wall', x0: 50, x1: 52, z0: 300, z1: 340, y: 0, h: 3 },         // tall wall, faces w at x 50
    { id: 'kerb-low', kind: 'kerb', x0: 70, x1: 72, z0: 300, z1: 310, y: 0, h: 0.4 },
    { id: 'kerb-high', kind: 'kerb', x0: 80, x1: 82, z0: 300, z1: 310, y: 0, h: 1.6 },
    { id: 'roof', kind: 'roof', x0: 100, x1: 120, z0: 300, z1: 320, y: 16, h: 1 },
    { id: 'plinth', kind: 'plinth', x0: 130, x1: 136, z0: 350, z1: 356, y: 0, h: 2 },
  ],
  routes: [
    { id: 'r-wall', block: 'wall', side: 'w', kind: 'ivy', at: 20 },
    { id: 'r-far', block: 'wall', side: 'w', kind: 'ivy', at: 35 },
    { id: 'r-plinth', block: 'plinth', side: 's', kind: 'letters', at: 3 },
  ],
  pits: [{ id: 'pit', rect: { x0: 20, x1: 30, z0: 360, z1: 370 }, depth: 2 }],
  spots: [],
  havens: [{ id: 'waystation', name: 'Test haven', region: 'ivy-rows', rect: { x0: 140, x1: 150, z0: 250, z1: 260 }, minY: 5 }],
  water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 10, y: 0, z: 250 },
});

const R = 0.45, H = 1.7, STEP = 0.5;
const out = (): Vec3 => ({ x: 0, y: 0, z: 0 });

describe('groundAt / baseAt', () => {
  const c = createCollider(makeMap());
  it('is the block top when standing over a block', () => {
    expect(c.groundAt(133, 353, 2)).toBe(2);
    expect(c.groundAt(133, 353, 1.6)).toBe(2);   // within step-up
    expect(c.groundAt(133, 353, 0)).toBe(0);     // too high to step onto from the ground
  });
  it('ignores a roof overhead', () => {
    expect(c.groundAt(110, 310, 0)).toBe(0);
    expect(c.groundAt(110, 310, 17)).toBe(17);
  });
  it('is the pit floor in a pit', () => {
    expect(c.baseAt(25, 365)).toBe(-2);
    expect(c.groundAt(25, 365, -2)).toBe(-2);
    expect(c.baseAt(10, 365)).toBe(0);
  });
});

describe('move', () => {
  const c = createCollider(makeMap());
  it('stops at a wall', () => {
    const o = out();
    const hit = c.move({ x: 45, y: 0, z: 320 }, 10, 0, R, H, STEP, o);
    expect(hit).toBe('wall');
    expect(o.x).toBeLessThanOrEqual(50 - R + 1e-9);
    expect(o.x).toBeGreaterThan(49);
    expect(o.z).toBe(320);
  });
  it('slides along a wall', () => {
    const o = out();
    const hit = c.move({ x: 49.5, y: 0, z: 320 }, 2, 2, R, H, STEP, o);
    expect(hit).toBe('wall');
    expect(o.x).toBeLessThan(50 - R + 1e-9);
    expect(o.z).toBeCloseTo(322, 6);
  });
  it('steps up a 0.4 kerb but not a 1.6 one', () => {
    const o = out();
    expect(c.move({ x: 68, y: 0, z: 305 }, 6, 0, R, H, STEP, o)).toBeNull();
    expect(o.x).toBeCloseTo(74, 6);
    expect(c.move({ x: 78, y: 0, z: 305 }, 6, 0, R, H, STEP, o)).toBe('kerb-high');
    expect(o.x).toBeLessThan(80);
  });
  it('walks under a roof', () => {
    const o = out();
    expect(c.move({ x: 95, y: 0, z: 310 }, 10, 0, R, H, STEP, o)).toBeNull();
    expect(o.x).toBeCloseTo(105, 6);
  });
  it('cannot leave a pit', () => {
    const o = out();
    expect(c.move({ x: 25, y: -2, z: 365 }, 10, 0, R, H, STEP, o)).toBe('pit');
    expect(o.x).toBeLessThan(30);
    expect(c.move({ x: 25, y: -2, z: 365 }, 0, -10, R, H, STEP, o)).toBe('pit');
    expect(o.z).toBeGreaterThan(360);
  });
  it('cannot leave MAP_OUTLINE', () => {
    const o = out();
    expect(c.move({ x: 2, y: 0, z: 300 }, -5, 0, R, H, STEP, o)).toBe('bounds');
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(c.inBounds(-1, 300)).toBe(false);
    expect(c.inBounds(500, 300)).toBe(false);   // the notch east of the tap
    expect(c.inBounds(500, 450)).toBe(true);
  });
});

describe('faceAhead', () => {
  const c = createCollider(makeMap());
  const EAST = Math.PI / 2, NORTH = Math.PI, SOUTH = 0;
  it('finds the right side, topY and the route within tolerance', () => {
    const hit = c.faceAhead(49, 0, 320, EAST, 2, STEP, 1);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe('wall');
    expect(hit!.kind).toBe('block');
    expect(hit!.side).toBe('w');
    expect(hit!.topY).toBe(3);
    expect(hit!.baseY).toBe(0);
    expect(hit!.distance).toBeCloseTo(1, 6);
    expect(hit!.along).toBeCloseTo(20, 6);
    expect(hit!.routes.map((r) => r.id)).toEqual(['r-wall']);
  });
  it('ignores a route outside tolerance', () => {
    const hit = c.faceAhead(49, 0, 330, EAST, 2, STEP, 1);
    expect(hit!.routes).toEqual([]);
  });
  it('finds a south face and ignores low kerbs and out-of-reach faces', () => {
    const s = c.faceAhead(133, 0, 357, NORTH, 2, STEP, 0.5);
    expect(s!.side).toBe('s');
    expect(s!.along).toBeCloseTo(3, 6);
    expect(s!.routes.map((r) => r.id)).toEqual(['r-plinth']);
    expect(c.faceAhead(68, 0, 305, EAST, 3, STEP, 1)).toBeNull();
    expect(c.faceAhead(40, 0, 320, EAST, 2, STEP, 1)).toBeNull();
    expect(c.faceAhead(110, 0, 298, SOUTH, 3, STEP, 1)).toBeNull(); // roof bottom is above y + 1
  });
  it('finds a pit wall from inside a pit', () => {
    const hit = c.faceAhead(25, -2, 365, EAST, 6, STEP, 1);
    expect(hit!.kind).toBe('pit');
    expect(hit!.id).toBe('pit');
    expect(hit!.side).toBe('e');
    expect(hit!.topY).toBe(0);
    expect(hit!.baseY).toBe(-2);
    expect(hit!.along).toBeCloseTo(5, 6);
  });
});

describe('edgeAhead', () => {
  const c = createCollider(makeMap());
  it('returns the side the player faces out over', () => {
    const hit = c.edgeAhead(133, 2, 355.6, 0, 0.6, 0.5); // facing +z, near the s side
    expect(hit!.id).toBe('plinth');
    expect(hit!.side).toBe('s');
    expect(hit!.topY).toBe(2);
    expect(hit!.routes.map((r) => r.id)).toEqual(['r-plinth']);
  });
  it('is null when facing inwards, too far from the edge, or not on top', () => {
    expect(c.edgeAhead(133, 2, 355.6, Math.PI, 0.6, 0.5)).toBeNull();
    expect(c.edgeAhead(133, 2, 353, 0, 0.6, 0.5)).toBeNull();
    expect(c.edgeAhead(133, 0, 355.6, 0, 0.6, 0.5)).toBeNull();
  });
});

describe('havens, regions, routes', () => {
  it('havenAt respects minY', () => {
    const c = createCollider(makeMap());
    expect(c.havenAt(145, 5, 255)).toBe('waystation');
    expect(c.havenAt(145, 4, 255)).toBeNull();
    expect(c.havenAt(155, 5, 255)).toBeNull();
    expect(c.regionAt(100, 300)).toBe('ivy-rows');
  });
  it('addRoute shows up in routesOn and faceAhead', () => {
    const c = createCollider(makeMap());
    expect(c.routesOn('wall', 'w').map((r) => r.id)).toEqual(['r-wall', 'r-far']);
    expect(c.faceAhead(49, 0, 310, Math.PI / 2, 2, STEP, 1)!.routes).toEqual([]);
    c.addRoute({ id: 'placed-ladder', block: 'wall', side: 'w', kind: 'ladder', at: 10.3 });
    expect(c.routesOn('wall', 'w').map((r) => r.id)).toContain('placed-ladder');
    expect(c.faceAhead(49, 0, 310, Math.PI / 2, 2, STEP, 1)!.routes.map((r) => r.id)).toEqual(['placed-ladder']);
    expect(c.blockById('wall')?.h).toBe(3);
  });
});
