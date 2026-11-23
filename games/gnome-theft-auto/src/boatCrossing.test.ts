// A boat drives the whole water chain (Loch Moss, the ravine river, the canal, the farm river, the Puddle Sea) both ways
// with no dry bar: the water network is one navigable route (Wild World Epic 4, issue 1A).
import { describe, expect, it } from 'vitest';
import { VEHICLES, WORLD_HALF } from './config';
import { stepBoat } from './boats';
import { courseProfile } from './water';
import { waterAt } from './terrain';
import { steerToward } from './boatTraffic';
import type { Vehicle, World, VehicleKind } from './types';

function route(): { x: number; z: number }[] {
  const pts = [{ x: -700, z: -680 }];                       // Loch Moss centre
  for (const id of ['river-ravine', 'canal', 'river-farm']) {
    const p = courseProfile(id)!;
    for (let k = 0; k < p.s.length; k += 4) pts.push({ x: p.x[k], z: p.z[k] });
  }
  pts.push({ x: 690, z: 830 });                             // Puddle Sea centre
  return pts;
}
function drive(kind: VehicleKind, pts: { x: number; z: number }[]): { reached: number; t: number } {
  const v = { x: pts[0].x, z: pts[0].z, y: waterAt(pts[0].x, pts[0].z)!.surface - 0.1,
    yaw: Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z), speed: 0, spec: VEHICLES[kind], kind } as unknown as Vehicle;
  const world = { boxes: [], half: WORLD_HALF } as unknown as World;
  let wp = 1, t = 0;
  for (; t < 1200 && wp < pts.length; t += 1 / 30) {
    if (Math.hypot(pts[wp].x - v.x, pts[wp].z - v.z) < 10) { wp++; if (wp >= pts.length) break; }
    stepBoat(v, { throttle: 1, steer: steerToward(v, pts[wp].x, pts[wp].z), lift: 0 }, 1 / 30, world);
  }
  return { reached: wp, t };
}

describe('a boat drives the whole water chain', () => {
  const forward = route();
  const backward = [...forward].reverse();
  for (const kind of ['gravy-boat', 'watering-can-steamer'] as const) {
    it(`${kind} sails from Loch Moss to the Puddle Sea and back`, () => {
      expect(drive(kind, forward).reached).toBe(forward.length);
      expect(drive(kind, backward).reached).toBe(backward.length);
    });
  }
});
