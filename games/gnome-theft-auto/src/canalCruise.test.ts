// The Clog Cruiser (radius 2.4) drives the whole Cloverfield canal, past both lock gates and under every arch bridge,
// against the real waterworks colliders (wharves, docks) and the real water.
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { VEHICLES, WORLD_HALF } from './config';
import { stepBoat, BOAT_HIT_RADIUS_FRAC } from './boats';
import { pushOutOfBoxes } from './collide';
import { bridges, canalLocks, courseProfile } from './water';
import { waterAt } from './terrain';
import { steerToward } from './boatTraffic';
import { installFakeDom } from './testing/fakeDom';
import type { Box, Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

// Steer like a player: aim at the canal ahead, shifted sideways to the first offset whose line to it is clear.
function pickAim(v: Vehicle, a: { x: number; z: number }, b: { x: number; z: number }, boxes: Box[]): { x: number; z: number } {
  const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const nx = -(b.z - a.z) / l, nz = (b.x - a.x) / l;
  const r = BOAT_HIT_RADIUS_FRAC * v.spec.radius + 0.2;
  for (const off of [0, 2, -2, 3, -3]) {
    const tx = a.x + nx * off, tz = a.z + nz * off;
    let clear = true;
    for (let f = 0.2; f <= 1 && clear; f += 0.2) {
      clear = !pushOutOfBoxes(v.x + (tx - v.x) * f, v.z + (tz - v.z) * f, r, boxes, v.y).hit;
    }
    if (clear) return { x: tx, z: tz };
  }
  return a;
}

function cruise(boxes: Box[]) {
  const p = courseProfile('canal')!;
  const pts: { x: number; z: number }[] = [];
  for (let k = 0; k < p.s.length; k++) pts.push({ x: p.x[k], z: p.z[k] });
  const v = { x: pts[1].x, z: pts[1].z, y: waterAt(pts[1].x, pts[1].z)!.surface - 0.1,
    yaw: Math.atan2(pts[2].x - pts[1].x, pts[2].z - pts[1].z), speed: 0, spec: VEHICLES['clog-cruiser'], kind: 'clog-cruiser', driver: 'player' } as unknown as Vehicle;
  const world = { boxes, half: WORLD_HALF } as unknown as World;
  const dt = 1 / 60;
  let idx = 2, slow = 0, worstSlow = 0, t = 0;
  const stops: string[] = [];
  for (; t < 120 && idx < pts.length - 1; t += dt) {
    // aim a few points ahead of the nearest one
    while (idx < pts.length - 1 && Math.hypot(pts[idx].x - v.x, pts[idx].z - v.z) < 12) idx++;
    const a = pts[Math.min(pts.length - 1, idx + 2)], b = pts[Math.min(pts.length - 1, idx + 3)];
    const aim = pickAim(v, a, b, boxes);
    stepBoat(v, { throttle: 0.6, steer: steerToward(v, aim.x, aim.z), lift: 0 }, dt, world);
    if (Math.abs(v.speed) < 0.5 && t > 3) {
      slow += dt;
      if (slow > worstSlow) worstSlow = slow;
      if (slow > 3) { stops.push(`stuck at (${v.x.toFixed(1)}, ${v.z.toFixed(1)}) idx ${idx}/${pts.length} t ${t.toFixed(1)}`); break; }
    } else slow = 0;
  }
  return { v, idx, n: pts.length, t, worstSlow, stops };
}

// Two props stand in the canal channel and block a 2.4 m hull (reported, owned outside this issue's files):
//  - the south-buck-iron billboard (brands.ts BILLBOARD_SPOTS): moved from z 235 to 240 by E02, clear of the water now.
//  - Driftwood's turf-raft (biomes.ts 'driftwood-raft', (55, 230)): a 5.6 x 3.6 collider mid-channel leaves 3.2 m each side.
const blocker = (b: Box): boolean => b.minZ > 228 && b.maxZ < 239 && ((b.minX > 10 && b.maxX < 22) || (b.minX > 50 && b.maxX < 60));

async function world(): Promise<World> {
  const { buildWorld } = await import('./world');
  return buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
}

function expectSails(r: ReturnType<typeof cruise>): void {
  expect(r.stops, r.stops.join()).toEqual([]);
  expect(r.idx).toBeGreaterThanOrEqual(r.n - 1);
  expect(r.worstSlow).toBeLessThan(3);
  expect(canalLocks().length).toBe(2);
  expect(bridges().length).toBeGreaterThan(0);
}

describe('the Clog Cruiser on the canal', () => {
  it('sails from the loch end to the far end, through both locks and under every arch (without the two blocking props)', async () => {
    const restore = installFakeDom();
    try {
      const w = await world();
      expectSails(cruise(w.boxes.filter((b) => !blocker(b))));
    } finally {
      restore();
    }
  });

  // Expected to fail until E03 (L24) narrows or moves the raft collider: then remove .fails.
  it.fails('sails the real world with every collider', async () => {
    const restore = installFakeDom();
    try {
      const w = await world();
      expectSails(cruise(w.boxes));
    } finally {
      restore();
    }
  });
});
