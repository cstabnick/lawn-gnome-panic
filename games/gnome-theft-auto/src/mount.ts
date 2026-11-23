// Getting in, out of, and yanking a driver out of a vehicle. The gnome plays a short animated sequence: walk to the
// nearest point round the vehicle, reach, open a door (closed vehicles only), climb over the rim or through the door,
// and settle into the seat. The vehicle takes no orders until the sequence has finished (see app.ts).
//
// Pure timing and geometry, no three.js: the game draws the pose, swings the door, moves the yanked driver, and reacts
// to the events. Vehicle-local space is the vehicle root's (after scaling): +x is its left, +z its nose, the same space
// as VehicleSpec.seat and MountDoor.at.
import { MOUNT, MOUNT_STYLES } from './config';
import { heightAt } from './terrain';
import type { MountDoor, MountStyle, Vehicle } from './types';

export type MountMode = 'enter' | 'exit' | 'yank';
type Phase = 'walk' | 'reach' | 'door' | 'pull' | 'climb' | 'settle';

export interface Vec3 { x: number; y: number; z: number }

/** What the game draws for the gnome this frame (world space). */
export interface MountPose {
  x: number; y: number; z: number;
  yaw: number;
  /** Velocity, for the walk cycle. */
  vx: number; vy: number; vz: number;
  /** 0..1: how far the arms reach out (the rim, a door, a driver to pull). */
  reach: number;
  /** 0..1: lifted and tucked through the rim or a door. */
  climb: number;
  /** In the seat (or still sitting, on the way out). */
  seated: boolean;
  /** Off the ground, mid-climb. */
  airborne: boolean;
}

/** A yanked driver sliding out of the seat (vehicle-local space; roll is about the z axis). */
export interface RiderPose { x: number; y: number; z: number; roll: number }

export interface MountFrame {
  pose: MountPose;
  /** Closed vehicles: the door in use and how far it is open (0 shut .. 1 open). Null for open-top vehicles. */
  door: { pivot: string; open: number } | null;
  /** Yanking: the driver's pose while being pulled out, or null. */
  rider: RiderPose | null;
  /** Set on the frame a phase the game reacts to ends: a driver is out, the gnome is seated, or it has got out. */
  event?: 'pulled' | 'seated' | 'stood';
  done: boolean;
}

export interface MountSeq {
  readonly mode: MountMode;
  readonly vehicle: Vehicle;
  /** Closed vehicles: index into spec.doors of the door in use. Null for open-top vehicles. */
  readonly door: number | null;
  readonly phases: readonly Phase[];
  index: number;
  /** Seconds into the current phase. */
  t: number;
  /** The gnome's own position (world space). */
  pos: Vec3;
  /** Where the current climb starts (world space). */
  from: Vec3;
  /** Where a yanked driver is pulled to, in vehicle-local space (the gnome's own side). */
  pullTo: { x: number; z: number };
  doorOpen: number;
  done: boolean;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const smooth = (p: number): number => p * p * (3 - 2 * p);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Closed vehicles have doors; a spec with openTop false and no doors is treated as open-top. */
export function doorsOf(v: Vehicle): readonly MountDoor[] {
  return v.spec.openTop === false ? (v.spec.doors ?? []) : [];
}

/** The climb style: a spec's own, else 'door' for closed vehicles and 'vault' for open-top ones. */
export function mountStyleOf(v: Vehicle): MountStyle {
  return v.spec.mountStyle ?? (doorsOf(v).length > 0 ? 'door' : 'vault');
}

/** Vehicle-local (x = left, y = up, z = nose) to world. */
export function toWorld(v: Vehicle, lx: number, ly: number, lz: number): Vec3 {
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
  return { x: v.x + lx * c + lz * s, y: v.y + ly, z: v.z - lx * s + lz * c };
}

/** World ground position to vehicle-local x and z (the inverse of toWorld on the ground). */
export function toLocal(v: Vehicle, x: number, z: number): { x: number; z: number } {
  const dx = x - v.x, dz = z - v.z;
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

/** Where a gnome's feet go in the seat. A Pay 'n' Glaze ride height (and the body's spring heave) moves the seat with the body, as vehicles.ts seatWorld does once seated. */
export function seatWorld(v: Vehicle): Vec3 {
  const s = v.spec.seat;
  return toWorld(v, s[0], s[1] + (v.rig?.seatLift ?? 0), s[2]);
}

/** A ground point (x, z) with its y on the terrain. */
function onGround(x: number, z: number): Vec3 {
  return { x, y: heightAt(x, z), z };
}

/** The ground spot outside a door, a stride from its opening. */
function doorGround(v: Vehicle, d: MountDoor): Vec3 {
  const side = d.side === 'left' ? 1 : -1;
  const p = toWorld(v, side * (Math.abs(d.at[0]) + MOUNT.standOff), 0, d.at[2]);
  return onGround(p.x, p.z);
}

/** The door nearest a ground point. */
function nearestDoor(v: Vehicle, doors: readonly MountDoor[], from: Vec3): number {
  let best = 0;
  let bestD = Infinity;
  doors.forEach((d, i) => {
    const g = doorGround(v, d);
    const dist = Math.hypot(g.x - from.x, g.z - from.z);
    if (dist < bestD) { bestD = dist; best = i; }
  });
  return best;
}

/** Where the gnome stands to get in (or out): the door's ground spot, else the rim point nearest `from`, or the exit side on the way out. */
function standing(seq: MountSeq, from: Vec3): Vec3 {
  const v = seq.vehicle;
  const doors = doorsOf(v);
  if (seq.door !== null) return doorGround(v, doors[seq.door]);
  if (seq.mode === 'exit') { const p = toWorld(v, v.spec.radius + 0.8, 0, 0); return onGround(p.x, p.z); }
  const d = toLocal(v, from.x, from.z);
  const len = Math.hypot(d.x, d.z);
  const ux = len > 0.01 ? d.x / len : 1;
  const uz = len > 0.01 ? d.z / len : 0;
  const r = v.spec.radius + MOUNT.standOff;
  const p = toWorld(v, ux * r, 0, uz * r);
  return onGround(p.x, p.z);
}

function phasesFor(mode: MountMode, closed: boolean): Phase[] {
  if (mode === 'exit') return closed ? ['door', 'climb', 'settle'] : ['climb', 'settle'];
  const phases: Phase[] = ['walk', 'reach'];
  if (closed) phases.push('door');
  if (mode === 'yank') phases.push('pull');
  phases.push('climb', 'settle');
  return phases;
}

/**
 * Starts a sequence from the gnome's position `from` (for 'exit' it starts from the seat and `from` is ignored).
 * Enter and yank walk to whichever side or door is nearest; exit leaves through the first door, or the left side.
 */
export function beginMount(mode: MountMode, v: Vehicle, from: Vec3): MountSeq {
  const doors = doorsOf(v);
  const door = doors.length === 0 ? null : mode === 'exit' ? 0 : nearestDoor(v, doors, from);
  const pos = mode === 'exit' ? seatWorld(v) : { ...from };
  return {
    mode, vehicle: v, door,
    phases: phasesFor(mode, door !== null),
    index: 0, t: 0,
    pos, from: { ...pos }, pullTo: { x: 0, z: 0 },
    doorOpen: 0, done: false,
  };
}

/** How long the climb takes: the style's time, plus a little for every unit of seat height. */
export function climbSeconds(v: Vehicle): number {
  return MOUNT_STYLES[mountStyleOf(v)].seconds + Math.max(0, v.spec.seat[1]) * MOUNT.climbPerHeight;
}

function enterPhase(seq: MountSeq): void {
  seq.index++;
  seq.t = 0;
  if (seq.index >= seq.phases.length) { seq.done = true; return; }
  const next = seq.phases[seq.index];
  if (next === 'climb') seq.from = { ...seq.pos };
  if (next === 'pull') {
    const l = toLocal(seq.vehicle, seq.pos.x, seq.pos.z);
    seq.pullTo = { x: l.x, z: l.z };
  }
}

/** The driver's pose while it is pulled out of the seat: it slides from the seat to the ground on the gnome's side and topples over. */
function riderAt(v: Vehicle, pull: number, to: { x: number; z: number }): RiderPose {
  const s = v.spec.seat;
  const e = smooth(pull);
  return {
    x: lerp(s[0], to.x, e),
    y: lerp(s[1], 0.15, e) + 0.5 * Math.sin(Math.PI * e),
    z: lerp(s[2], to.z, e),
    roll: (to.x >= 0 ? -1 : 1) * e * (Math.PI / 2),
  };
}

/** Advances the sequence by dt seconds and returns what to draw this frame. Call once per frame until `done`. */
export function stepMount(seq: MountSeq, dt: number): MountFrame {
  const v = seq.vehicle;
  const doorsList = doorsOf(v);
  const prev = { x: seq.pos.x, z: seq.pos.z };
  const phase = seq.phases[seq.index];
  let event: MountFrame['event'];
  let rider: RiderPose | null = null;
  let reach = 0;
  let climb = 0;
  let seated = false;
  let airborne = false;
  seq.t += dt;

  switch (phase) {
    case 'walk': {
      const goal = standing(seq, seq.pos);
      const speed = Math.max(MOUNT.walkSpeed, Math.abs(v.speed) + MOUNT.catchUp);
      const dx = goal.x - seq.pos.x, dz = goal.z - seq.pos.z;
      const d = Math.hypot(dx, dz);
      const step = speed * dt;
      if (d <= step) {
        seq.pos.x = goal.x;
        seq.pos.z = goal.z;
        enterPhase(seq);
      } else {
        seq.pos.x += (dx / d) * step;
        seq.pos.z += (dz / d) * step;
      }
      // The gnome walks on the ground under its own feet (the vehicle may be on a different slope or airborne).
      seq.pos.y = heightAt(seq.pos.x, seq.pos.z);
      break;
    }
    case 'reach': {
      Object.assign(seq.pos, standing(seq, seq.pos));
      reach = smooth(clamp01(seq.t / MOUNT.reachSeconds));
      if (seq.t >= MOUNT.reachSeconds) enterPhase(seq);
      break;
    }
    case 'door': {
      // Exit: the gnome is still in the seat while the door swings open.
      Object.assign(seq.pos, seq.mode === 'exit' ? seatWorld(v) : standing(seq, seq.pos));
      seated = seq.mode === 'exit';
      seq.doorOpen = clamp01(seq.t / MOUNT.doorSeconds);
      if (seq.t >= MOUNT.doorSeconds) enterPhase(seq);
      break;
    }
    case 'pull': {
      Object.assign(seq.pos, standing(seq, seq.pos));
      reach = 1;
      const pull = smooth(clamp01(seq.t / MOUNT.pullSeconds));
      rider = riderAt(v, pull, seq.pullTo);
      if (seq.t >= MOUNT.pullSeconds) {
        event = 'pulled';
        enterPhase(seq);
      }
      break;
    }
    case 'climb': {
      const dur = climbSeconds(v);
      const p = clamp01(seq.t / dur);
      const e = smooth(p);
      const to = seq.mode === 'exit' ? standing(seq, seq.pos) : seatWorld(v);
      const style = MOUNT_STYLES[mountStyleOf(v)];
      seq.pos.x = lerp(seq.from.x, to.x, e);
      seq.pos.z = lerp(seq.from.z, to.z, e);
      seq.pos.y = lerp(seq.from.y, to.y, e) + style.arc * Math.sin(Math.PI * p);
      climb = Math.sin(Math.PI * p);
      airborne = true;
      if (seq.t >= dur) enterPhase(seq);
      break;
    }
    case 'settle': {
      const closed = seq.door !== null;
      const dur = closed ? MOUNT.doorSeconds : MOUNT.settleSeconds;
      if (seq.mode === 'exit') {
        Object.assign(seq.pos, standing(seq, seq.pos));
      } else {
        Object.assign(seq.pos, seatWorld(v));
        seated = true;
      }
      if (closed) seq.doorOpen = 1 - clamp01(seq.t / dur);
      if (seq.t >= dur) {
        event = seq.mode === 'exit' ? 'stood' : 'seated';
        seq.done = true;
      }
      break;
    }
  }

  const dtSafe = dt > 0 ? dt : 1;
  const yaw = seq.mode === 'exit' ? v.yaw : Math.atan2(v.x - seq.pos.x, v.z - seq.pos.z);
  const pose: MountPose = {
    x: seq.pos.x, y: seq.pos.y, z: seq.pos.z, yaw,
    vx: (seq.pos.x - prev.x) / dtSafe, vy: 0, vz: (seq.pos.z - prev.z) / dtSafe,
    reach, climb, seated, airborne,
  };
  const door = seq.door === null ? null : { pivot: doorsList[seq.door].pivot, open: seq.doorOpen };
  return { pose, door, rider, event, done: seq.done };
}
