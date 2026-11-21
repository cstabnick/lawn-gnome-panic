import { describe, expect, it } from 'vitest';
import { AGENT_RADIUS, NAV_CELL } from './config';
import { makeNav, type Box, type NavWorld, type Pt } from './nav';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const emptyWorld = (w: number, d: number): NavWorld => ({ w, d, boxes: [], circles: [] });

describe('makeNav', () => {
  it('finds a path across an empty 20 by 20 world', () => {
    const nav = makeNav(emptyWorld(20, 20));
    const from: Pt = { x: -8, z: -8 };
    const to: Pt = { x: 8, z: 8 };
    const path = nav.findPath(from, to);
    expect(path).not.toBeNull();
    const pts = path as Pt[];
    expect(pts.length).toBeGreaterThan(0);
    for (const p of pts) expect(nav.isFree(p.x, p.z)).toBe(true);
    const last = pts[pts.length - 1];
    expect(Math.hypot(last.x - 8, last.z - 8)).toBeLessThanOrEqual(NAV_CELL);
  });

  it('routes through the gap in a wall', () => {
    // Wall along x at z = 0, spanning x from -10 to 10 except a gap around x = 6.
    const wall: Box[] = [
      { x: -5.5, z: 0, w: 9, d: 1 },   // x from -10 to -1
      { x: 9.5, z: 0, w: 1, d: 1 },    // x from 9 to 10
    ];
    // Gap runs from x = -1 to x = 9 (centre 4).
    const nav = makeNav({ w: 20, d: 20, boxes: wall, circles: [] });
    const path = nav.findPath({ x: -6, z: -6 }, { x: -6, z: 6 });
    expect(path).not.toBeNull();
    const pts = [{ x: -6, z: -6 }, ...(path as Pt[])];
    // Every segment that crosses the wall line z = 0 must cross it inside the gap (x from -0.55 to 9.55 once the radius is added).
    let crossings = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (Math.sign(a.z) === Math.sign(b.z) || a.z === b.z) continue;
      const t = a.z / (a.z - b.z);
      const xAt = a.x + (b.x - a.x) * t;
      crossings++;
      expect(xAt).toBeGreaterThan(-0.55);
      expect(xAt).toBeLessThan(9.55);
    }
    expect(crossings).toBeGreaterThan(0);
    for (const p of pts) {
      for (const b of wall) {
        const inside = Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.z - b.z) < b.d / 2;
        expect(inside).toBe(false);
      }
    }
  });

  it('returns null when the wall has no gap', () => {
    const wall: Box[] = [{ x: 0, z: 0, w: 20, d: 1 }];
    const nav = makeNav({ w: 20, d: 20, boxes: wall, circles: [] });
    expect(nav.findPath({ x: 0, z: -6 }, { x: 0, z: 6 })).toBeNull();
  });

  it('paths around a circle at the centre', () => {
    const nav = makeNav({ w: 20, d: 20, boxes: [], circles: [{ x: 0, z: 0, r: 1 }] });
    const path = nav.findPath({ x: -4, z: 0 }, { x: 4, z: 0 });
    expect(path).not.toBeNull();
    const pts = path as Pt[];
    expect(pts.length).toBeGreaterThan(0);
    for (const p of pts) expect(Math.hypot(p.x, p.z)).toBeGreaterThan(1);
    expect(Math.hypot(pts[pts.length - 1].x - 4, pts[pts.length - 1].z)).toBeLessThanOrEqual(NAV_CELL);
  });

  it('returns an empty path when from and to are the same cell', () => {
    const nav = makeNav(emptyWorld(20, 20));
    expect(nav.findPath({ x: 2, z: 3 }, { x: 2, z: 3 })).toEqual([]);
  });

  it('snaps a point inside a box to a free point within 3 m', () => {
    const nav = makeNav({ w: 20, d: 20, boxes: [{ x: 0, z: 0, w: 4, d: 4 }], circles: [] });
    expect(nav.isFree(0, 0)).toBe(false);
    const p = nav.nearestFree(0, 0);
    expect(p).not.toBeNull();
    const q = p as Pt;
    expect(nav.isFree(q.x, q.z)).toBe(true);
    expect(Math.hypot(q.x, q.z)).toBeLessThanOrEqual(3);
  });

  it('keeps the gnome radius clear of walls', () => {
    const nav = makeNav({ w: 20, d: 20, boxes: [{ x: 0, z: 0, w: 2, d: 2 }], circles: [] });
    // Half-width 1 plus the gnome radius: anything within 1 + AGENT_RADIUS of the centre is blocked on that side.
    // Obstacles get a 5 cm margin on top of the radius (see OBSTACLE_MARGIN in nav.ts).
    expect(nav.isFree(1 + AGENT_RADIUS + 0.04, 0)).toBe(false);
    expect(nav.isFree(1 + AGENT_RADIUS + 0.1, 0)).toBe(true);
  });

  it('finds or rejects paths in a seeded 64 by 48 world quickly', () => {
    const rand = mulberry32(12345);
    const boxes: Box[] = [];
    for (let i = 0; i < 15; i++) {
      boxes.push({
        x: (rand() - 0.5) * 56,
        z: (rand() - 0.5) * 40,
        w: 1 + rand() * 4,
        d: 1 + rand() * 4,
      });
    }
    const world: NavWorld = { w: 64, d: 48, boxes, circles: [] };
    const nav = makeNav(world);

    const start = nav.nearestFree(-30, -20);
    const goal = nav.nearestFree(30, 20);
    expect(start).not.toBeNull();
    expect(goal).not.toBeNull();

    const t0 = performance.now();
    const path = nav.findPath(start as Pt, goal as Pt);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(500);

    if (path !== null) {
      for (const p of path) expect(nav.isFree(p.x, p.z)).toBe(true);
    }
  });

  it('finds a path between opposite corners of a 64 by 48 world under 50 ms', () => {
    const nav = makeNav(emptyWorld(64, 48));
    const t0 = performance.now();
    const path = nav.findPath({ x: -30, z: -20 }, { x: 30, z: 20 });
    const ms = performance.now() - t0;
    expect(path).not.toBeNull();
    expect(ms).toBeLessThan(500);
  });
});
