// Rival drivers for the Speedway races: arcade vehicles (stepVehicle) that follow the centre line at their own pace,
// line and nerve. The exported signatures are the contract.
import type * as THREE from 'three';
import { angleDiff } from '../collide';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import type { RaceRival } from '../quests/types';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { Vehicle, VehicleKind, World } from '../types';
import { createVehicle, removeVehicle, repairVehicle, stepVehicle, syncVehicleMesh } from '../vehicles';
import { TRACK, gridSlot, locate, sampleAt, trackFrame, trackLength } from './track';

export interface Rival {
  def: RaceRival;
  v: Vehicle;
  /** Index of the nearest centre-line sample last frame (locate() hint). */
  hint: number;
  /** Race distance: metres driven along the lap since the start (negative while still behind the line). */
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
    };
    states.set(r, st);
  }
  return st;
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
  const L = trackLength();
  const spot = locate(r.v.x, r.v.z, 60, r.hint);
  r.hint = spot?.i ?? -1;
  st.lastS = spot?.s ?? ((r.dist % L) + L) % L;
  st.anchorX = r.v.x;
  st.anchorZ = r.v.z;
  st.anchorT = st.t;
}

/** Put the rival back on the centre line at its race distance, facing along the track, at a crawl. */
function backOnLine(r: Rival, st: DriverState): void {
  const L = trackLength();
  const s = ((r.dist % L) + L) % L;
  const p = trackFrame(s, 0);
  r.v.x = p.x;
  r.v.z = p.z;
  r.v.yaw = p.yaw;
  r.v.speed = 5;
  syncVehicleMesh(r.v, 0);
  anchorAt(r, st);
}

/** Create a rival's vehicle (with its driver gnome) on grid `slot` and add it to `vehicles`. */
export function spawnRival(scene: THREE.Scene, vehicles: Vehicle[], def: RaceRival, kind: VehicleKind, slot: number): Rival {
  const g = gridSlot(slot);
  const v = createVehicle(scene, def.kind ?? kind, g.x, g.z, g.yaw, def.tint);
  const r: Rival = { def, v, hint: -1, dist: 0, finishedAt: null };
  const st = stateOf(r);
  seatRider(v, st.look);
  v.driver = 'npc';
  v.questOwned = true;
  vehicles.push(v);
  const spot = locate(g.x, g.z)!;
  r.hint = spot.i;
  r.dist = spot.s - trackLength();
  st.lap = Math.floor(r.dist / trackLength());
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
  const g = gridSlot(slot);
  v.x = g.x;
  v.z = g.z;
  v.yaw = g.yaw;
  v.speed = 0;
  v.vy = 0;
  seatRider(v, st.look);
  const spot = locate(g.x, g.z)!;
  r.hint = spot.i;
  r.dist = spot.s - trackLength();
  r.finishedAt = null;
  st.lap = Math.floor(r.dist / trackLength());
  st.lastS = spot.s;
  st.mistakeS = null;
  st.mistakeT = 0;
  st.anchorX = v.x;
  st.anchorZ = v.z;
  st.anchorT = st.t;
  syncVehicleMesh(v, 0);
}

/** Speed the rival may hold here: the tightest corner in range, reached by braking at 9 m/s^2 from where it is. */
function cornerSpeed(s: number, speed: number, grip: number): number {
  const ahead = 20 + Math.abs(speed) * 1.2;
  let allowed = Infinity;
  for (let d = 0; d <= ahead; d += 2) {
    const curv = sampleAt(s + d).curv;
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
  const L = trackLength();

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
    backOnLine(r, st);
    return;
  }

  st.t += dt;
  st.mistakeT = Math.max(0, st.mistakeT - dt);

  // Where am I.
  const spot = locate(v.x, v.z, 60, r.hint);
  if (!spot || Math.abs(spot.lat) > TRACK.barrierOffset + 3) {
    backOnLine(r, st);
    return;
  }
  r.hint = spot.i;
  let ds = spot.s - st.lastS;
  if (ds > L / 2) ds -= L;
  if (ds < -L / 2) ds += L;
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
        if (Math.abs(sampleAt(s0).curv) > 0.025) break;
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
  const aim = trackFrame(spot.s + ahead, def.line + weave);
  const steer = Math.max(-1, Math.min(1, -angleDiff(Math.atan2(aim.x - v.x, aim.z - v.z), v.yaw) * 2.4));

  // Speed: the pace on the straights, cut for the corners ahead, then the rubber band and any mistake.
  let target = Math.min(v.spec.maxSpeed * def.pace, cornerSpeed(spot.s, v.speed, def.grip));
  const gap = r.dist - ctx.playerDist;
  if (gap > 60) target *= 0.9;
  else if (gap < -60) target *= 1.06;
  target = Math.min(target, v.spec.maxSpeed * 1.06);
  if (st.mistakeT > 0) target *= 1.1;

  let throttle = 0.3;
  if (v.speed < target - 0.5) throttle = 1;
  else if (v.speed > target + 1) throttle = -0.6;

  stepVehicle(v, { throttle, steer, lift: 0 }, dt, world);
  syncVehicleMesh(v, dt);

  // Stuck: moved less than 0.5 m in 2.5 s.
  if (Math.hypot(v.x - st.anchorX, v.z - st.anchorZ) >= 0.5) {
    st.anchorX = v.x;
    st.anchorZ = v.z;
    st.anchorT = st.t;
  } else if (st.t - st.anchorT > 2.5) {
    backOnLine(r, st);
  }
}

/** Take the rival's vehicle out of the scene and out of `vehicles`. */
export function removeRival(scene: THREE.Scene, vehicles: Vehicle[], r: Rival): void {
  const i = vehicles.indexOf(r.v);
  if (i >= 0) vehicles.splice(i, 1);
  removeVehicle(scene, r.v);
}
