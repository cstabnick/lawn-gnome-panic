// Mower models and driving / flying physics for Gnome Theft Auto.
import * as THREE from 'three';
import { buildPrefab, getPrefab, prefabDamageLevels, setPrefabDamage } from '@lawn/prefabs';
import { FLY, GROUND_DRAG, MOWER_TINTS, VEHICLES } from './config';
import { play } from './audio';
import { clampToWorld, pushOutOfBoxes } from './collide';
import type { DriveControls, Vehicle, VehicleKind, World } from './types';

let nextId = 1;

/** Named pivots of one vehicle's body (any may be missing for a given prefab). */
interface Pivots {
  /** wheel-0 .. wheel-3 (index 2 and 3 are the front wheels). */
  wheels: (THREE.Object3D | undefined)[];
  blade?: THREE.Object3D;
  handle?: THREE.Object3D;
  steer?: THREE.Object3D;
  reel?: THREE.Object3D;
  rotor?: THREE.Object3D;
  tailRotor?: THREE.Object3D;
  /** A fixed-wing plane's propeller (spins about its local z axis). */
  prop?: THREE.Object3D;
  /** Main rotor spin, rad/s; eases to 0 after the pilot leaves and the flyer lands. */
  rotorSpin: number;
  /** Propeller spin, rad/s. */
  propSpin: number;
}

const pivotsById = new Map<number, Pivots>();

const ROTOR_SPIN = 30;
/** Rotor slows from ROTOR_SPIN to 0 over 2 s. */
const ROTOR_SPIN_DOWN = ROTOR_SPIN / 2;
/** Propeller spins up to PROP_SPIN and winds down to 0 over 2 s. */
const PROP_SPIN = 40;
const PROP_SPIN_DOWN = PROP_SPIN / 2;
const WHEEL_RADIUS = 0.3;
/** A wall hit below this speed (units/s) does no damage; above it, each unit of speed over costs 1/CRASH_SCALE of the hit points. */
export const CRASH_MIN = 5;
export const CRASH_SCALE = 45;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function capturePivots(body: THREE.Object3D, rotorSpin: number, propSpin: number): Pivots {
  return {
    wheels: ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3'].map((n) => body.getObjectByName(n)),
    blade: body.getObjectByName('blade'),
    handle: body.getObjectByName('handle'),
    steer: body.getObjectByName('steer'),
    reel: body.getObjectByName('reel'),
    rotor: body.getObjectByName('rotor'),
    tailRotor: body.getObjectByName('tail-rotor'),
    prop: body.getObjectByName('prop'),
    rotorSpin,
    propSpin,
  };
}

// ---- Damage: hit points drive the prefab's damage level (see PrefabDef.damage in @lawn/prefabs). ---------------------
type DamageHook = (v: Vehicle, level: number, stageName: string) => void;
let damageHook: DamageHook | null = null;
/** Called when a vehicle reaches a new damage level (the game toasts it for the player's own mower). */
export function setDamageHook(h: DamageHook | null): void { damageHook = h; }

/** Damage level for a hit-point fraction: with n stages, hp 1 is level 0 and the levels split the rest evenly (0 hp = wrecked). */
export function damageLevelFor(hp: number, stages: number): number {
  if (hp <= 0) return stages;
  return Math.min(stages, Math.floor((1 - hp) * (stages + 1)));
}

function applyDamageLevel(v: Vehicle, level: number): void {
  const body = v.object.children[0] as THREE.Group | undefined;
  if (!body || body.userData.damage === undefined) return;
  const old = pivotsById.get(v.id);
  setPrefabDamage(body, level);
  v.damage = level;
  // The rebuilt model has new pivot objects: pick them up again (keeping the rotor and propeller spin).
  pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0));
  body.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  const name = getPrefab(v.spec.prefab)?.damage?.[level - 1]?.name;
  if (level > 0 && name) damageHook?.(v, level, name);
}

/** Take hit points off (0..1 scale: 1 = a whole new mower). Swaps the model when a damage level is crossed. */
export function damageVehicle(v: Vehicle, amount: number): void {
  if (amount <= 0) return;
  const stages = prefabDamageLevels(getPrefab(v.spec.prefab)!);
  if (stages === 0) return;
  v.hp = Math.max(0, v.hp - amount);
  const level = damageLevelFor(v.hp, stages);
  if (level !== v.damage) applyDamageLevel(v, level);
}

/** Shot to pieces: every material goes charcoal black, the driver is gone and the wreck stays put (the game adds the fire). */
export function explodeVehicle(v: Vehicle): void {
  if (v.exploded) return;
  v.exploded = true;
  v.hp = 0;
  v.speed = 0;
  v.driver = 'none';
  if (v.rider) {
    v.object.remove(v.rider.object);
    v.rider = null;
    v.riderLook = null;
  }
  v.object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const charred = mats.map((mat) => {
      const c = mat.clone() as THREE.MeshStandardMaterial;
      if (c.color) c.color.setHex(0x151515);
      if (c.emissive) c.emissive.setHex(0x000000);
      if ('map' in c) c.map = null;
      c.transparent = false;
      c.opacity = 1;
      return c;
    });
    m.material = Array.isArray(m.material) ? charred : charred[0];
  });
}

/** Back to new: full hit points and the undamaged model. */
export function repairVehicle(v: Vehicle): void {
  v.hp = 1;
  if (v.damage !== 0) applyDamageLevel(v, 0);
}

/** Repaint a vehicle: rebuilds the prefab body with the new tint, preserving damage stage and pivots. */
export function repaintVehicle(v: Vehicle, tint: number): void {
  if (v.exploded) return;
  v.tint = tint;
  const oldBody = v.object.children[0] as THREE.Group | undefined;
  const old = pivotsById.get(v.id);
  if (oldBody) v.object.remove(oldBody);
  const body = buildPrefab(v.spec.prefab, { scale: v.spec.scale, tint });
  if (v.damage > 0 && body.userData.damage !== undefined) {
    setPrefabDamage(body, v.damage);
  }
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  v.object.add(body);
  pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0));
}

export function createVehicle(scene: THREE.Scene, kind: VehicleKind, x: number, z: number, yaw: number, tint?: number): Vehicle {
  const spec = VEHICLES[kind];
  const object = new THREE.Group();
  const colour = tint ?? MOWER_TINTS[0];
  const body = spec.kind === 'push-bike' || spec.kind === 'ride-on' || spec.kind === 'zero-turn'
    ? buildPrefab(spec.prefab, { scale: spec.scale, tint: colour })
    : buildPrefab(spec.prefab, { scale: spec.scale });
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  object.add(body);
  scene.add(object);

  const id = nextId++;
  pivotsById.set(id, capturePivots(body, 0, 0));

  const v: Vehicle = {
    id, kind, spec, x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'none', tint: colour, object,
    rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
  };
  syncVehicleMesh(v, 0);
  return v;
}

export function stepVehicle(v: Vehicle, c: DriveControls, dt: number, world: World): void {
  if (v.exploded) {
    // A wreck sits where it blew up (a flyer drops to the ground).
    v.speed = 0;
    v.vy = 0;
    if (v.y > 0) v.y = Math.max(0, v.y - 18 * dt);
    return;
  }
  if (v.spec.fixedWing && v.driver === 'player') stepPilotedPlane(v, c, dt);
  else stepOther(v, c, dt);
  moveVehicle(v, dt, world);
  v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt);
}

/** A piloted Crop Duster: it needs airspeed to lift off and to stay up, and stalls and sinks when too slow. */
function stepPilotedPlane(v: Vehicle, c: DriveControls, dt: number): void {
  const spec = v.spec;
  // VEHICLES.plane.stallSpeed; a fixed-wing spec always sets it.
  const stall = spec.stallSpeed ?? 22;
  const ceiling = spec.ceiling ?? FLY.ceiling;
  const air = v.y > 0.05;

  // Throttle. Planes never reverse: brakes stop them at zero.
  if (c.throttle > 0) v.speed = Math.min(spec.maxSpeed, v.speed + spec.accel * c.throttle * dt);
  else if (c.throttle < 0) v.speed = Math.max(0, v.speed - 1.5 * spec.accel * dt);
  else v.speed *= Math.pow(air ? 0.93 : 0.5, dt);

  // Vertical. Lift authority grows from 0 at 0.7 stall to full at stall.
  const auth = clamp((v.speed - 0.7 * stall) / (0.3 * stall), 0, 1);
  let target = 0;
  if (c.lift > 0) target = c.lift * FLY.planeClimb * auth;
  else if (c.lift < 0 && air) target = c.lift * FLY.planeClimb;
  // On the ground a plane only lifts off once it is at stall speed.
  if (!air && v.speed < stall) target = 0;
  // Below stall in the air the nose drops and the plane sinks.
  if (air && v.speed < stall) target = Math.min(target, -FLY.stallSink * (1 - v.speed / stall));
  v.vy += (target - v.vy) * Math.min(1, 2.5 * dt);

  v.y += v.vy * dt;
  if (v.y <= 0) {
    // Hard landing: lose most of the speed and bump.
    if (air && Math.abs(v.vy) > 9) {
      v.speed *= 0.4;
      play('bump');
    }
    v.y = 0;
    v.vy = 0;
  } else if (v.y >= ceiling) {
    v.y = ceiling;
    v.vy = 0;
  }

  // Steering: no turning while nearly stopped, and none on the ground below speed 3.
  const gate = !air && v.speed < 3 ? 0 : clamp(v.speed / stall, 0, 1);
  v.yaw -= c.steer * spec.turnRate * dt * gate;
}

/** Every vehicle that is not a piloted plane: ground vehicles, the Whirligig, and unpiloted flyers. */
function stepOther(v: Vehicle, c: DriveControls, dt: number): void {
  const spec = v.spec;
  const flying = spec.flies;

  // Vertical (flyers only).
  if (flying) {
    if (v.driver === 'player') v.vy += (c.lift * FLY.climb - v.vy) * Math.min(1, 3 * dt);
    else v.vy -= FLY.gravity * dt;
    v.y += v.vy * dt;
    const ceiling = spec.ceiling ?? FLY.ceiling;
    if (v.y <= 0) { v.y = 0; v.vy = 0; }
    else if (v.y >= ceiling) { v.y = ceiling; v.vy = 0; }
  } else {
    v.y = 0;
    v.vy = 0;
  }

  // Forward / reverse / coasting. A flyer only gets its throttle above the pad (it can lift off from the pad, nothing more).
  const drag = flying ? FLY.drag : GROUND_DRAG;
  const canDrive = !flying || v.y > 0.3;
  if (c.throttle > 0) {
    if (canDrive) v.speed = Math.min(spec.maxSpeed, v.speed + spec.accel * c.throttle * dt);
  } else if (c.throttle < 0) {
    if (v.speed > 0.5) v.speed = Math.max(0, v.speed - 2 * spec.accel * dt);
    else if (canDrive) v.speed = Math.max(-0.4 * spec.maxSpeed, v.speed - spec.accel * -c.throttle * dt);
  } else {
    v.speed *= Math.pow(drag, dt);
  }
  // An unpiloted plane falls and bleeds its speed.
  if (spec.fixedWing) v.speed *= Math.pow(0.5, dt);

  // Steering: the yaw rate needs grip from rolling speed, except the zero-turn and flyers, which always have it.
  const grip = spec.kind === 'zero-turn' || flying ? 1 : Math.min(1, Math.abs(v.speed) / 4);
  v.yaw -= c.steer * spec.turnRate * dt * grip * Math.sign(v.speed || 1);
}

/** Move along forward, collide with boxes (flyers above a box pass over it), then keep inside the world. */
function moveVehicle(v: Vehicle, dt: number, world: World): void {
  // Move along forward. y stays where the vertical step left it.
  v.x += Math.sin(v.yaw) * v.speed * dt;
  v.z += Math.cos(v.yaw) * v.speed * dt;

  // Collide with boxes (flyers above a box pass over it), then keep inside the world.
  const impact = Math.abs(v.speed);
  const pushed = pushOutOfBoxes(v.x, v.z, v.spec.radius, world.boxes, v.y);
  v.x = pushed.x;
  v.z = pushed.z;
  if (pushed.hit) {
    v.speed *= 0.35;
    if (v.driver === 'player' && impact > 6) play('bump');
    if (impact > CRASH_MIN) damageVehicle(v, (impact - CRASH_MIN) / CRASH_SCALE);
  }
  const kept = clampToWorld(v.x, v.z, world.half, v.spec.radius);
  v.x = kept.x;
  v.z = kept.z;
  if (kept.hit) v.speed *= 0.5;
}

export function syncVehicleMesh(v: Vehicle, dt: number): void {
  const spec = v.spec;
  let pitch = 0;
  let roll = 0;
  if (spec.fixedWing) {
    roll = v.steerVis * 0.5;
    pitch = -clamp(v.vy / FLY.planeClimb, -1, 1) * 0.3;
  } else if (spec.flies) {
    roll = v.steerVis * 0.35;
    pitch = clamp(v.speed / spec.maxSpeed, -1, 1) * 0.15;
  }
  if (v.sim) {
    const s = v.sim;
    v.object.position.set(s.px, s.py, s.pz);
    v.object.quaternion.set(s.qx, s.qy, s.qz, s.qw);
  } else {
    v.object.position.set(v.x, v.y, v.z);
    v.object.rotation.set(pitch, v.yaw, roll, 'YXZ');
  }

  // A plane's wheels only turn on the ground.
  if (!spec.fixedWing || v.y < 0.05) v.wheelSpin += (v.speed * dt) / WHEEL_RADIUS;
  const p = pivotsById.get(v.id);
  if (!p) return;

  const steer = -v.steerVis * 0.45;
  p.wheels.forEach((w, i) => {
    if (!w) return;
    if (i >= 2) w.rotation.set(v.wheelSpin, steer, 0, 'YXZ');
    else w.rotation.x = v.wheelSpin;
  });
  if (p.handle) p.handle.rotation.y = steer;
  if (p.steer) p.steer.rotation.y = steer;
  if (p.blade) p.blade.rotation.y = v.wheelSpin;
  if (p.reel) p.reel.rotation.x = v.wheelSpin;

  const active = v.driver !== 'none' || v.y > 0.05;
  if (active) p.rotorSpin = ROTOR_SPIN;
  else p.rotorSpin = Math.max(0, p.rotorSpin - ROTOR_SPIN_DOWN * dt);
  if (p.rotor) p.rotor.rotation.y += dt * p.rotorSpin;
  if (p.tailRotor) p.tailRotor.rotation.x += dt * p.rotorSpin * 1.5;

  if (active) p.propSpin += (PROP_SPIN - p.propSpin) * Math.min(1, 3 * dt);
  else p.propSpin = Math.max(0, p.propSpin - PROP_SPIN_DOWN * dt);
  if (p.prop) p.prop.rotation.z += dt * p.propSpin;
}

// ---- Vehicle-vehicle collisions: weight decides who gets thrown ---------------------------------------------------------
/** How bouncy a bump is (0 = stick, 1 = perfect bounce). */
const BUMP_RESTITUTION = 0.4;
/** Sideways slide from a bump dies off at this rate per second (tyres grip). */
const KNOCK_GRIP = 4.5;
const SPIN_GRIP = 3;
const SPIN_MAX = 4;
/** A bump never throws a vehicle backwards faster than this. */
const REBOUND_MAX = 10;

/** A vehicle's ground velocity: the sim chassis's own, or heading * speed plus any bump slide (a parked one only slides). */
function groundVel(v: Vehicle): { x: number; z: number } {
  if (v.sim) return { x: v.sim.ctrl.body.vel.x, z: v.sim.ctrl.body.vel.z };
  const k = v.knock;
  // Nobody is driving it, so it only moves when something shoves it.
  if (v.driver === 'none') return { x: k ? k.x : 0, z: k ? k.z : 0 };
  return { x: Math.sin(v.yaw) * v.speed + (k ? k.x : 0), z: Math.cos(v.yaw) * v.speed + (k ? k.z : 0) };
}

/** Change a vehicle's velocity by (dx, dz) and kick its spin: the part along its heading changes its speed, the rest slides it. */
function kick(v: Vehicle, dx: number, dz: number, spinKick: number): void {
  if (v.driver === 'remote') return;
  if (v.sim) {
    const b = v.sim.ctrl.body;
    b.vel.x += dx;
    b.vel.z += dz;
    b.angVel.y = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, b.angVel.y + spinKick));
    return;
  }
  const fx = Math.sin(v.yaw);
  const fz = Math.cos(v.yaw);
  const k = v.knock ?? (v.knock = { x: 0, z: 0, spin: 0 });
  if (v.driver === 'none') {
    // A parked vehicle has no engine to change its speed: the whole shove is a slide that the tyres soon stop.
    k.x += dx;
    k.z += dz;
    k.spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, k.spin + spinKick));
    return;
  }
  const along = dx * fx + dz * fz;
  v.speed = Math.max(-REBOUND_MAX, Math.min(v.spec.maxSpeed, v.speed + along));
  k.x += dx - along * fx;
  k.z += dz - along * fz;
  k.spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, k.spin + spinKick));
}

/**
 * Push overlapping vehicles apart (heavier moves less), then trade momentum along the contact normal: a combine barely
 * notices a push-bike, which gets thrown back, slid sideways and spun; two equals bounce off each other. A hit off-centre
 * (the contact is nearer a vehicle's front than its middle) also turns it. Ground distance and height both matter.
 */
export function collideVehicles(list: Vehicle[]): void {
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const rr = a.spec.radius + b.spec.radius;
      if (d >= rr || Math.abs(a.y - b.y) >= 1.5) continue;

      const overlap = rr - d;
      let nx = 1;
      let nz = 0;
      if (d > 1e-6) { nx = dx / d; nz = dz / d; }

      const ma = a.spec.mass;
      const mb = b.spec.mass;
      const total = ma + mb;
      // Each vehicle moves by its share m_other / (ma + mb) of the overlap, directly away from the other.
      const sa = (overlap * mb) / total;
      const sb = (overlap * ma) / total;
      a.x -= nx * sa;
      a.z -= nz * sa;
      b.x += nx * sb;
      b.z += nz * sb;

      // Closing speed along the contact normal, before the bump.
      const va = groundVel(a);
      const vb = groundVel(b);
      const closingN = (va.x - vb.x) * nx + (va.z - vb.z) * nz;
      if (closingN > 0) {
        // Impulse magnitude for an inelastic-ish bump between two masses; each takes its share of the velocity change.
        const jImp = ((1 + BUMP_RESTITUTION) * closingN) / (1 / ma + 1 / mb);
        // Torque from the contact sitting toward each vehicle's front: lever arm r = 0.6 r_a along its heading (towards the hit) + 0.4 r_a along the normal.
        const spinOf = (v: Vehicle, sx: number, sz: number, jx: number, jz: number): number => {
          const fx = Math.sin(v.yaw);
          const fz = Math.cos(v.yaw);
          const front = fx * sx + fz * sz >= 0 ? 1 : -1;
          const r = v.spec.radius;
          const rx = fx * r * 0.6 * front + sx * r * 0.4;
          const rz = fz * r * 0.6 * front + sz * r * 0.4;
          // y component of r x J (positive = yaw increases), over the moment of inertia m r^2 / 2.
          return (0.25 * (rz * jx - rx * jz)) / (0.5 * v.spec.mass * r * r);
        };
        // a is hit from the b side (+n) and pushed along -n; b the other way.
        kick(a, (-jImp * nx) / ma, (-jImp * nz) / ma, spinOf(a, nx, nz, -jImp * nx, -jImp * nz));
        kick(b, (jImp * nx) / mb, (jImp * nz) / mb, spinOf(b, -nx, -nz, jImp * nx, jImp * nz));
      }

      // Damage by closing speed; the heavier vehicle hurts the lighter one more.
      const closing = Math.max(Math.abs(a.speed), Math.abs(b.speed), Math.max(0, closingN));
      const now = performance.now();
      if (closing > CRASH_MIN && now - Math.max(a.lastHit, b.lastHit) > 400) {
        const dmg = (closing - CRASH_MIN) / (CRASH_SCALE * 1.4);
        damageVehicle(a, dmg * (2 * mb) / total);
        damageVehicle(b, dmg * (2 * ma) / total);
        a.lastHit = now;
        b.lastHit = now;
        if (a.driver === 'player' || b.driver === 'player') play('bump');
      }
    }
  }
}

/** Let bumped vehicles slide and spin for a moment (sideways motion and a turn the tyres soon kill), stopped by buildings. */
export function stepKnock(list: Vehicle[], dt: number, world: World): void {
  for (const v of list) {
    const k = v.knock;
    if (!k) continue;
    if (v.driver === 'remote' || v.exploded) { v.knock = undefined; continue; }
    if (Math.abs(k.x) + Math.abs(k.z) + Math.abs(k.spin) < 0.05) { v.knock = undefined; continue; }
    v.x += k.x * dt;
    v.z += k.z * dt;
    v.yaw += k.spin * dt;
    const pushed = pushOutOfBoxes(v.x, v.z, v.spec.radius, world.boxes, v.y);
    v.x = pushed.x;
    v.z = pushed.z;
    if (pushed.hit) { k.x = 0; k.z = 0; }
    const kept = clampToWorld(v.x, v.z, world.half, v.spec.radius);
    v.x = kept.x;
    v.z = kept.z;
    const fk = Math.exp(-KNOCK_GRIP * dt);
    const fs = Math.exp(-SPIN_GRIP * dt);
    k.x *= fk;
    k.z *= fk;
    k.spin *= fs;
  }
}

export function removeVehicle(scene: THREE.Scene, v: Vehicle): void {
  scene.remove(v.object);
  pivotsById.delete(v.id);
}

/** World position of the seat (rider feet). */
export function seatWorld(v: Vehicle, out: THREE.Vector3): THREE.Vector3 {
  v.object.updateMatrixWorld();
  return v.object.localToWorld(out.set(v.spec.seat[0], v.spec.seat[1], v.spec.seat[2]));
}

/** Where a gnome stands after getting off: beside the driver's left side, on the ground. */
export function exitPoint(v: Vehicle): { x: number; z: number } {
  const d = v.spec.radius + 0.8;
  return { x: v.x + Math.cos(v.yaw) * d, z: v.z - Math.sin(v.yaw) * d };
}
