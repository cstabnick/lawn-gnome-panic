// E33 drive-along check (tests only): one vehicle on the CASUAL sim chassis (npcChassis.ts, the same physics as the
// player's car in the default handling mode) follows a route's centre line (or a lane beside it) from one end to the
// other, slowing for bends, and reports whether it got there and how it went: how far it strayed, how long it stalled,
// whether it sank into the ground or tipped over. No colliders (world.boxes is empty): it checks the road's shape.
//
// Tests that import this must mock the audio first and give node a location, before importing it:
//   vi.mock('../audio', () => ({ play: () => undefined }));
//   (globalThis as { location?: { search: string } }).location ??= { search: '' };
//   const { driveAlong } = await import('./driveAlong');
import * as THREE from 'three';
import { qRotate, v3 } from '@lawn/vehicle';
import { AIRFIELD, WORLD_HALF } from '../config';
import { angleDiff } from '../collide';
import { createNpcChassis, npcChassisOf, stepNpcCar } from '../npcChassis';
import type { Track } from '../raceTrack/trackDef';
import { groundAt } from '../terrain';
import type { VehicleKind, World } from '../types';
import { createVehicle } from '../vehicles';

export interface DriveOptions {
  /** Cruising speed on straights, m/s (default 12). */
  speed?: number;
  /** Drive from the far end back to the start (default false). */
  reverse?: boolean;
  /** Give up after this many seconds (default 600). */
  maxSeconds?: number;
  /** Aim this far ahead along the line, m (default 9). */
  lookahead?: number;
  /** Drive this far right of the centre line, m (a two-way road's lane: width / 4). Default 0. */
  lane?: number;
  /** Lateral grip used to pick the speed for a bend, m/s^2 (default 3.5). */
  grip?: number;
}

export interface DriveResult {
  /** True when the vehicle got within 4 m (along the line) of the far end. */
  reached: boolean;
  /** Seconds driven. */
  seconds: number;
  /** Farthest the vehicle got from the centre line, m (Infinity when it lost the route altogether). */
  maxLat: number;
  /** Longest time without moving 1 m further along the route, s (a wedge shows up here). */
  maxStall: number;
  /** Deepest the body origin went below the ground under it, m (0 = never below). */
  maxSink: number;
  /** True when the chassis ever tipped past 60 degrees. */
  flipped: boolean;
  /** Distance along the route reached. */
  endS: number;
}

const DT = 1 / 60;

/** Drive `kind` along `track` from end to end on the casual chassis. Deterministic. */
export function driveAlong(track: Track, kind: VehicleKind, opts: DriveOptions = {}): DriveResult {
  const speed = opts.speed ?? 12;
  const reverse = opts.reverse ?? false;
  const maxSeconds = opts.maxSeconds ?? 600;
  const look = opts.lookahead ?? 9;
  const lane = opts.lane ?? 0;
  const grip = opts.grip ?? 3.5;
  const dir = reverse ? -1 : 1;
  const L = track.length();
  const sStart = reverse ? L - 3 : 3;
  const sEnd = reverse ? 3 : L - 3;
  // A lane right of travel: + lat is left of the track's own direction, so the right lane is -lane forwards, +lane back.
  const latFor = (): number => -dir * lane;
  const world = { boxes: [], half: WORLD_HALF, biomeAt: () => 'grass', airfield: AIRFIELD } as unknown as World;

  const p0 = track.frame(sStart, latFor());
  const yaw0 = reverse ? p0.yaw + Math.PI : p0.yaw;
  const v = createVehicle(new THREE.Scene(), kind, p0.x, p0.z, yaw0);
  v.driver = 'npc';
  createNpcChassis(v);

  let hint: number | undefined;
  let best = sStart;
  let stall = 0;
  const res: DriveResult = { reached: false, seconds: 0, maxLat: 0, maxStall: 0, maxSink: 0, flipped: false, endS: sStart };
  const steps = Math.round(maxSeconds / DT);
  for (let i = 0; i < steps; i++) {
    const spot = track.locate(v.x, v.z, 40, hint, 80);
    if (!spot) { res.maxLat = Infinity; break; }
    hint = spot.i;
    res.maxLat = Math.max(res.maxLat, Math.abs(spot.lat));
    const s = spot.s;
    if (dir * (s - best) > 1) { best = s; stall = 0; } else stall += DT;
    res.maxStall = Math.max(res.maxStall, stall);
    res.endS = best;
    if (dir * (s - sEnd) >= -4) { res.reached = true; break; }
    if (stall > 20) break;

    // Aim ahead on the line; slow for the sharpest bend in the next 25 m.
    const aimS = Math.max(0, Math.min(L, s + dir * look));
    const aim = track.frame(aimS, latFor());
    const want = Math.atan2(aim.x - v.x, aim.z - v.z);
    const steer = Math.max(-1, Math.min(1, -angleDiff(want, v.yaw) * 2));
    let curv = 0;
    for (let d = 0; d <= 25; d += 2.5) curv = Math.max(curv, Math.abs(track.sampleAt(s + dir * d).curv));
    const target = Math.min(speed, Math.sqrt(grip / Math.max(curv, 1e-4)));
    const throttle = Math.max(-1, Math.min(1, (target - v.speed) * 0.8));
    stepNpcCar(v, { throttle, steer, lift: 0 }, DT, world);
    res.seconds += DT;

    const sink = groundAt(v.x, v.z, v.y + 1) - v.y;
    if (sink > res.maxSink) res.maxSink = sink;
    const sd = npcChassisOf(v);
    if (sd) {
      const up = qRotate(sd.ctrl.body.quat as never, v3(0, 1, 0)).y;
      if (up < 0.5) res.flipped = true;
    }
  }
  return res;
}
