import { describe, expect, it } from 'vitest';
import { QUESTS, ZONES } from './content';
import { findPath, findPath3 } from './pathfind';
import { state } from './state';
import { addCollider, heightAt, standY } from './terrain';

function simulateWalk(from: { x: number; z: number; y?: number }, to: { x: number; z: number; y?: number }) {
  const fy = from.y ?? heightAt(from.x, from.z);
  const ty = to.y ?? heightAt(to.x, to.z);
  const path = findPath3({ x: from.x, y: fy, z: from.z }, { x: to.x, y: ty, z: to.z }, standY);
  let x = from.x;
  let y = fy;
  let z = from.z;
  const remaining = [...path];
  let steps = 0;
  let stuck = false;
  while (remaining.length > 0 && steps < 5000) {
    steps++;
    const wp = remaining[0];
    const dx = wp.x - x;
    const dz = wp.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.1) {
      remaining.shift();
      continue;
    }
    const stepLen = Math.min(dist, 0.25);
    let nx = x + (dx / dist) * stepLen;
    let nz = z + (dz / dist) * stepLen;
    let ny = standY(nx, nz, y);
    if (ny === null) {
      const sx = Math.abs(dx) > 1e-4 ? standY(nx, z, y) : null;
      const sz = Math.abs(dz) > 1e-4 ? standY(x, nz, y) : null;
      if (sx !== null && (sz === null || Math.abs(dx) >= Math.abs(dz))) {
        nz = z;
        ny = sx;
      } else if (sz !== null) {
        nx = x;
        ny = sz;
      } else {
        stuck = true;
        break;
      }
    }
    x = nx;
    y = ny;
    z = nz;
    if (Math.hypot(wp.x - x, wp.z - z) <= 0.1) remaining.shift();
  }
  return {
    path,
    stuck,
    endDist: Math.hypot(x - to.x, z - to.z),
    endY: y,
  };
}

describe('pathfinding', () => {
  it('avoids thin obstacles between integer grid cells in findPath and findPath3', () => {
    const blocked = (x: number, z: number) => Math.hypot(x - 2.5, z) < 0.35;
    const path2 = findPath({ x: 0, z: 0 }, { x: 5, z: 0 }, blocked);
    expect(path2.length).toBeGreaterThan(0);
    // Verify every 0.2m sample along the returned 2D path is unblocked.
    let cur = { x: 0, z: 0 };
    for (const wp of path2) {
      const len = Math.hypot(wp.x - cur.x, wp.z - cur.z);
      const steps = Math.max(1, Math.ceil(len / 0.2));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        expect(blocked(cur.x + (wp.x - cur.x) * t, cur.z + (wp.z - cur.z) * t)).toBe(false);
      }
      cur = wp;
    }

    const step3 = (x: number, z: number, fromY: number) => (blocked(x, z) || Math.abs(fromY) > 1 ? null : 0);
    const path3 = findPath3({ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, step3);
    expect(path3.length).toBeGreaterThan(0);
    let cur3 = { x: 0, z: 0 };
    for (const wp of path3) {
      const len = Math.hypot(wp.x - cur3.x, wp.z - cur3.z);
      const steps = Math.max(1, Math.ceil(len / 0.2));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        expect(blocked(cur3.x + (wp.x - cur3.x) * t, cur3.z + (wp.z - cur3.z) * t)).toBe(false);
      }
      cur3 = wp;
    }
  });

  it('does not snap the final waypoint into a blocked spot when rounded cell is free', () => {
    const blocked = (x: number, z: number) => x > 4.25;
    const path2 = findPath({ x: 0, z: 0 }, { x: 4.4, z: 0 }, blocked);
    expect(path2.length).toBeGreaterThan(0);
    const last2 = path2[path2.length - 1];
    expect(blocked(last2.x, last2.z)).toBe(false);

    const step3 = (x: number, z: number, fromY: number) => (blocked(x, z) || Math.abs(fromY) > 1 ? null : 0);
    const path3 = findPath3({ x: 0, y: 0, z: 0 }, { x: 4.4, y: 0, z: 0 }, step3);
    expect(path3.length).toBeGreaterThan(0);
    const last3 = path3[path3.length - 1];
    expect(blocked(last3.x, last3.z)).toBe(false);
  });

  it('walks cleanly around Mole King burrow, through the pass, and around Thatchford', { timeout: 30000 }, () => {
    for (const id of Object.keys(QUESTS)) {
      state.quests[id] = { stage: 99, count: 0, done: true };
    }
    const burrow = ZONES.mossbottom.regions.find((r) => r.id === 'burrow')!;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      addCollider(burrow.x + 10 * Math.cos(a), burrow.z + 10 * Math.sin(a), 1.8);
    }

    const routes: Array<[{ x: number; z: number }, { x: number; z: number }]> = [
      // Mossbottom -> Mole King burrow & south of burrow (previously hit MAX_EXPAND=6000)
      [{ x: 3, z: 3 }, { x: 10, z: -88 }],
      [{ x: 3, z: 0 }, { x: 10, z: -70 }],
      // Burrow -> Thatchford across the pass
      [{ x: 10, z: -88 }, { x: 0, z: -240 }],
      // Thatchford town -> Compost Heap, river crossings, and north exit
      [{ x: 3, z: -240 }, { x: 65, z: -195 }],
      [{ x: 0, z: -242 }, { x: -10, z: -280 }],
      [{ x: 0, z: -242 }, { x: -10, z: -220 }],
      [{ x: 0, z: -242 }, { x: 0, z: -352 }],
      [{ x: 3, z: -240 }, { x: -10, z: -150 }],
    ];

    for (const [from, to] of routes) {
      const res = simulateWalk(from, to);
      expect(res.stuck).toBe(false);
      expect(res.endDist).toBeLessThan(1.5);
    }
  });
});
