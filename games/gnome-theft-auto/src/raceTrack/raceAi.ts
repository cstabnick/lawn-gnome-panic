// Rival drivers for the Speedway races: arcade vehicles (stepVehicle) that follow the centre line at their own pace,
// line and nerve. The exported signatures are the contract.
import type * as THREE from 'three';
import { angleDiff } from '../collide';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import type { RaceRival } from '../quests/types';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { Vehicle, VehicleKind, World } from '../types';
import { createVehicle, removeVehicle, repairVehicle, syncVehicleMesh } from '../vehicles';
import { stepNpcCar } from '../npcChassis';
import { SPEEDWAY } from './track';
import { isStreetTrack } from './tracks';
import type { Track } from './trackDef';

export interface Rival {
  def: RaceRival;
  /** The track it races on (the Speedway unless spawnRival was given another). */
  track: Track;
  v: Vehicle;
  /** Index of the nearest centre-line sample last frame (locate() hint). */
  hint: number;
  /** Race distance: metres driven since the start line (closed: along the laps; open: from startS(); negative while behind the line). */
  dist: number;
  /** Seconds since the start when it finished, or null. */
  finishedAt: number | null;
}

/** Context for one frame of a rival's driving. */
export interface RivalCtx {
  /** True during the countdown: hold still on the grid. */
  hold: boolean;
  /** The player's race distance (for the rubber band). */
  playerDist: number;
  /** Seconds since the start. */
  time: number;
  /** Vehicles to steer round and brake for (the game's `vehicles`); left out: no avoidance. */
  others?: readonly Vehicle[];
}

/** Private per-rival driving state (kept outside the Rival so its shape stays the contract). */
interface DriverState {
  rng: () => number;
  look: GnomeLook;
  /** Seconds this rival has been driving. */
  t: number;
  weaveAmp: number;
  weavePeriod: number;
  weavePhase: number;
  /** Centre-line distance of the last frame (wrapped), for the race-distance update. */
  lastS: number;
  /** Lap index of the last frame (floor(dist / L)), to roll a mistake once per lap. */
  lap: number;
  /** Centre-line distance where a mistake is planned this lap, or null. */
  mistakeS: number | null;
  /** Seconds left of a mistake (runs fast into a corner). */
  mistakeT: number;
  /** Stuck detection: where the car was when it last moved on, and when. */
  anchorX: number;
  anchorZ: number;
  anchorT: number;
  /** Avoidance: side of the line (+1 / -1) chosen, until when (st.t), and the smoothed lateral shift in metres. */
  avoidSide: number;
  avoidUntil: number;
  avoidLat: number;
  /** Seconds the speed has stayed under 1.5 m/s (street stuck detection). */
  slowT: number;
  /** Smoothed lateral aim (line + weave, or the avoidance side). */
  curLat?: number;
}

const states = new WeakMap<Rival, DriverState>();

/** A small seeded generator (mulberry32) so a rival's weave and mistakes repeat per seed. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return h >>> 0;
}

function stateOf(r: Rival): DriverState {
  let st = states.get(r);
  if (!st) {
    const rng = seeded(hashName(r.def.name));
    st = {
      rng,
      look: { ...randomTownLook(), ...r.def.look },
      t: 0,
      weaveAmp: 0.8 + r.def.aggression * 1.2,
      weavePeriod: 7 + rng() * 4,
      weavePhase: rng() * Math.PI * 2,
      lastS: 0,
      lap: 0,
      mistakeS: null,
      mistakeT: 0,
      anchorX: r.v.x,
      anchorZ: r.v.z,
      anchorT: 0,
      avoidSide: 0,
      avoidUntil: 0,
      avoidLat: 0,
      slowT: 0,
      curLat: undefined,
    };
    states.set(r, st);
  }
  return st;
}

/** The centre-line distance a race distance `dist` stands for (closed: wrapped round the lap; open: clamped). */
function distToS(track: Track, dist: number): number {
  if (track.closed) {
    const L = track.length();
    return ((dist % L) + L) % L;
  }
  return track.wrapS(dist + track.startS());
}

/** The race distance of a car at centre-line distance `s` on the grid (closed: a lap behind the line; open: from the line). */
function gridDist(track: Track, s: number): number {
  return track.closed ? s - track.length() : s - track.startS();
}

/** Fit (or refit) a rider gnome on the seat, as chaseFollowRun does for its leader. */
function seatRider(v: Vehicle, look: GnomeLook): void {
  if (v.rider) return;
  const rider: GnomeModel = makeGnome(v.object, look);
  rider.object.position.set(...v.spec.seat);
  rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
  v.rider = rider;
  v.riderLook = look;
}

/** Set a rival's bookkeeping from where it stands on the lap at race distance `dist`. */
function anchorAt(r: Rival, st: DriverState): void {
  const spot = r.track.locate(r.v.x, r.v.z, 60, r.hint);
  r.hint = spot?.i ?? -1;
  st.lastS = spot?.s ?? distToS(r.track, r.dist);
  st.anchorX = r.v.x;
  st.anchorZ = r.v.z;
  st.anchorT = st.t;
}

/** Put the rival back on the centre line at its race distance, facing along the track, at a crawl. */
function backOnLine(r: Rival, st: DriverState, others?: readonly Vehicle[], skip = 0): void {
  if (skip > 0 && isStreetTrack(r.track.id)) r.dist += skip;
  let along = distToS(r.track, r.dist);
  let p = r.track.frame(along, 0);
  if (others && isStreetTrack(r.track.id)) {
    for (let k = 0; k < 3; k++) {
      if (!others.some((o) => o !== r.v && !o.exploded && Math.hypot(o.x - p.x, o.z - p.z) < 4)) break;
      along += 12;
      r.dist += 12;
      p = r.track.frame(r.track.closed ? distToS(r.track, along) : along, 0);
    }
  }
  r.v.x = p.x;
  r.v.z = p.z;
  r.v.yaw = p.yaw;
  r.v.speed = 5;
  st.avoidLat = 0;
  st.slowT = 0;
  syncVehicleMesh(r.v, 0);
  anchorAt(r, st);
}

/** Create a rival's vehicle (with its driver gnome) on grid `slot` and add it to `vehicles`. */
export function spawnRival(scene: THREE.Scene, vehicles: Vehicle[], def: RaceRival, kind: VehicleKind, slot: number, track: Track = SPEEDWAY): Rival {
  const g = track.gridSlot(slot);
  const v = createVehicle(scene, def.kind ?? kind, g.x, g.z, g.yaw, def.tint);
  const r: Rival = { def, track, v, hint: -1, dist: 0, finishedAt: null };
  const st = stateOf(r);
  seatRider(v, st.look);
  v.driver = 'npc';
  v.questOwned = true;
  vehicles.push(v);
  const spot = track.locate(g.x, g.z)!;
  r.hint = spot.i;
  r.dist = gridDist(track, spot.s);
  st.lap = Math.floor(r.dist / track.length());
  st.lastS = spot.s;
  st.anchorX = v.x;
  st.anchorZ = v.z;
  return r;
}

/** Put a rival back on grid `slot`, stopped and repaired (a restart). */
export function resetRival(r: Rival, slot: number): void {
  const v = r.v;
  const st = stateOf(r);
  repairVehicle(v);
  v.exploded = false;
  const g = r.track.gridSlot(slot);
  v.x = g.x;
  v.z = g.z;
  v.yaw = g.yaw;
  v.speed = 0;
  v.vy = 0;
  seatRider(v, st.look);
  const spot = r.track.locate(g.x, g.z)!;
  r.hint = spot.i;
  r.dist = gridDist(r.track, spot.s);
  r.finishedAt = null;
  st.lap = Math.floor(r.dist / r.track.length());
  st.lastS = spot.s;
  st.mistakeS = null;
  st.mistakeT = 0;
  st.anchorX = v.x;
  st.anchorZ = v.z;
  st.anchorT = st.t;
  syncVehicleMesh(v, 0);
}

/** Speed the rival may hold here: the tightest corner in range, reached by braking at 9 m/s^2 from where it is. */
function cornerSpeed(track: Track, s: number, speed: number, grip: number): number {
  const ahead = 20 + Math.abs(speed) * 1.2;
  let allowed = Infinity;
  for (let d = 0; d <= ahead; d += 2) {
    const curv = track.sampleAt(s + d).curv;
    const R = 1 / Math.max(Math.abs(curv), 1e-4);
    const vCorner2 = grip * 9.81 * R;
    const vAllowed = Math.sqrt(vCorner2 + 2 * 9 * d);
    if (vAllowed < allowed) allowed = vAllowed;
  }
  return allowed;
}

/** One frame of driving: steer along the lap, keep its speed for the corners ahead, update `dist` and `hint`. */
export function driveRival(r: Rival, dt: number, world: World, ctx: RivalCtx): void {
  const v = r.v;
  const def = r.def;
  const st = stateOf(r);
  const track = r.track;
  const L = track.length();

  // A finisher on a point-to-point track brakes to a stop and stays put.
  if (r.finishedAt !== null && !track.closed) {
    if (v.exploded || v.driver !== 'npc') return;
    stepNpcCar(v, { throttle: v.speed > 0.5 ? -0.8 : 0, steer: 0, lift: 0 }, dt, world);
    if (Math.abs(v.speed) < 0.5) v.speed = 0;
    syncVehicleMesh(v, dt);
    return;
  }

  if (ctx.hold) {
    v.speed = 0;
    syncVehicleMesh(v, dt);
    anchorAt(r, st);
    return;
  }

  // A wreck, or a car stolen from the rival's seat: put the driver back and the car back on the line.
  if (v.exploded || v.driver !== 'npc') {
    repairVehicle(v);
    v.exploded = false;
    v.driver = 'npc';
    seatRider(v, st.look);
    backOnLine(r, st, ctx.others);
    return;
  }

  st.t += dt;
  st.mistakeT = Math.max(0, st.mistakeT - dt);

  // Where am I.
  const spot = track.locate(v.x, v.z, 60, r.hint);
  if (!spot || Math.abs(spot.lat) > track.def.barrierOffset + 3) {
    backOnLine(r, st, ctx.others);
    return;
  }
  r.hint = spot.i;
  let ds = spot.s - st.lastS;
  if (track.closed) {
    if (ds > L / 2) ds -= L;
    if (ds < -L / 2) ds += L;
  }
  r.dist += Math.max(-40, Math.min(40, ds));
  st.lastS = spot.s;

  // A new lap: roll whether this lap has a mistake, and where (a corner ahead).
  const lap = Math.floor(r.dist / L);
  if (lap !== st.lap) {
    st.lap = lap;
    st.mistakeS = null;
    if (st.rng() < def.aggression) {
      let s0 = st.rng() * L;
      for (let k = 0; k < 200; k++) {
        if (Math.abs(track.sampleAt(s0).curv) > 0.025) break;
        s0 += 2;
      }
      st.mistakeS = s0;
    }
  }
  if (st.mistakeS !== null) {
    const toGo = (((spot.s - st.mistakeS) % L) + L) % L;
    if (toGo < 10) {
      st.mistakeT = 2;
      st.mistakeS = null;
    }
  }

  // Aim: a point ahead on the line, with a slow weave so the pack spreads out.
  const weave = st.weaveAmp * Math.sin((2 * Math.PI * st.t) / st.weavePeriod + st.weavePhase);
  const ahead = 6 + Math.abs(v.speed) * 0.55;

  // Traffic: the nearest vehicle in a corridor ahead; swing to the other side of it and match its speed when close.
  let blockSpeed = Infinity;
  if (ctx.others) {
    const fx = Math.sin(v.yaw);
    const fz = Math.cos(v.yaw);
    const reach = 8 + Math.abs(v.speed) * 1.2;
    const half = st.avoidSide !== 0 && st.t < st.avoidUntil ? 3.6 : 2.2;
    let best: Vehicle | null = null;
    let bestF = Infinity;
    for (const o of ctx.others) {
      if (o === v || o.exploded) continue;
      const dx = o.x - v.x;
      const dz = o.z - v.z;
      const f = dx * fx + dz * fz;
      if (f < 0 || f > reach || f >= bestF) continue;
      if (Math.abs(dx * fz - dz * fx) > half) continue;
      best = o;
      bestF = f;
    }
    if (best) {
      if (st.t >= st.avoidUntil || st.avoidSide === 0) {
        const bl = track.locate(best.x, best.z, 60)?.lat ?? 0;
        const own = def.line + weave;
        st.avoidSide = bl > own ? -1 : bl < own ? 1 : weave >= 0 ? 1 : -1;
        const lim = track.def.barrierOffset - 1.5;
        if (Math.abs(Math.max(-lim, Math.min(lim, bl + st.avoidSide * 3.2)) - bl) < 2.4) st.avoidSide = -st.avoidSide;
      }
      st.avoidUntil = st.t + 1;
      if (bestF < 10) blockSpeed = best.speed * Math.cos(best.yaw - v.yaw) + 2;
      {
        const bl = track.locate(best.x, best.z, 60)?.lat ?? 0;
        const lim = track.def.barrierOffset - 1.5;
        st.avoidLat = Math.max(-lim, Math.min(lim, bl + st.avoidSide * 3.2));
      }
    }
  }
  const baseLat = def.line + weave;
  const active = st.avoidSide !== 0 && st.t < st.avoidUntil;
  const wantLat = active ? st.avoidLat : baseLat;
  st.curLat = (st.curLat ?? baseLat) + (wantLat - (st.curLat ?? baseLat)) * Math.min(1, dt / 0.5 * 2);
  if (!active) st.avoidSide = 0;
  const aim = track.frame(spot.s + ahead, st.curLat);
  const steer = Math.max(-1, Math.min(1, -angleDiff(Math.atan2(aim.x - v.x, aim.z - v.z), v.yaw) * 2.4));

  // Speed: the pace on the straights, cut for the corners ahead, then the rubber band and any mistake.
  let target = Math.min(v.spec.maxSpeed * def.pace, cornerSpeed(track, spot.s, v.speed, def.grip));
  const gap = r.dist - ctx.playerDist;
  if (gap > 60) target *= 0.9;
  else if (gap < -60) target *= 1.06;
  target = Math.min(target, v.spec.maxSpeed * 1.06);
  if (st.mistakeT > 0) target *= 1.1;
  target = Math.min(target, Math.max(0, blockSpeed));

  let throttle = 0.3;
  if (v.speed < target - 0.5) throttle = 1;
  else if (v.speed > target + 1) throttle = -0.6;

  stepNpcCar(v, { throttle, steer, lift: 0 }, dt, world);
  syncVehicleMesh(v, dt);

  // Stuck: moved less than 0.5 m in 2.5 s (street routes: also under 1.5 m/s for 4 s).
  st.slowT = Math.abs(v.speed) < 1.5 ? st.slowT + dt : 0;
  if (isStreetTrack(track.id) && st.slowT > 4) {
    backOnLine(r, st, ctx.others, 8);
  } else if (Math.hypot(v.x - st.anchorX, v.z - st.anchorZ) >= 0.5) {
    st.anchorX = v.x;
    st.anchorZ = v.z;
    st.anchorT = st.t;
  } else if (st.t - st.anchorT > 2.5) {
    backOnLine(r, st, ctx.others, 8);
  }
}

/** Take the rival's vehicle out of the scene and out of `vehicles`. */
export function removeRival(scene: THREE.Scene, vehicles: Vehicle[], r: Rival): void {
  const i = vehicles.indexOf(r.v);
  if (i >= 0) vehicles.splice(i, 1);
  removeVehicle(scene, r.v);
}
