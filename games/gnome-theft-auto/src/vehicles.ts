// Mower models and driving / flying physics for Gnome Theft Auto.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
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
  /** Main rotor spin, rad/s; eases to 0 after the pilot leaves and the flyer lands. */
  rotorSpin: number;
}

const pivotsById = new Map<number, Pivots>();

const ROTOR_SPIN = 30;
/** Rotor slows from ROTOR_SPIN to 0 over 2 s. */
const ROTOR_SPIN_DOWN = ROTOR_SPIN / 2;
const WHEEL_RADIUS = 0.3;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
  pivotsById.set(id, {
    wheels: ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3'].map((n) => body.getObjectByName(n)),
    blade: body.getObjectByName('blade'),
    handle: body.getObjectByName('handle'),
    steer: body.getObjectByName('steer'),
    reel: body.getObjectByName('reel'),
    rotor: body.getObjectByName('rotor'),
    tailRotor: body.getObjectByName('tail-rotor'),
    rotorSpin: 0,
  });

  const v: Vehicle = {
    id, kind, spec, x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'none', tint: colour, object,
    rider: null, riderLook: null, wheelSpin: 0, steerVis: 0,
  };
  syncVehicleMesh(v, 0);
  return v;
}

export function stepVehicle(v: Vehicle, c: DriveControls, dt: number, world: World): void {
  const spec = v.spec;
  const flying = spec.flies;

  // Vertical (flyers only).
  if (flying) {
    if (v.driver === 'player') v.vy += (c.lift * FLY.climb - v.vy) * Math.min(1, 3 * dt);
    else v.vy -= FLY.gravity * dt;
    v.y += v.vy * dt;
    if (v.y <= 0) { v.y = 0; v.vy = 0; }
    else if (v.y >= FLY.ceiling) { v.y = FLY.ceiling; v.vy = 0; }
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

  // Steering: the yaw rate needs grip from rolling speed, except the zero-turn and flyers, which always have it.
  const grip = spec.kind === 'zero-turn' || flying ? 1 : Math.min(1, Math.abs(v.speed) / 4);
  v.yaw -= c.steer * spec.turnRate * dt * grip * Math.sign(v.speed || 1);

  // Move along forward. y stays where the vertical step left it.
  v.x += Math.sin(v.yaw) * v.speed * dt;
  v.z += Math.cos(v.yaw) * v.speed * dt;

  // Collide with boxes (flyers above a box pass over it), then keep inside the world.
  const impact = Math.abs(v.speed);
  const pushed = pushOutOfBoxes(v.x, v.z, spec.radius, world.boxes, v.y);
  v.x = pushed.x;
  v.z = pushed.z;
  if (pushed.hit) {
    v.speed *= 0.35;
    if (v.driver === 'player' && impact > 6) play('bump');
  }
  const kept = clampToWorld(v.x, v.z, world.half, spec.radius);
  v.x = kept.x;
  v.z = kept.z;
  if (kept.hit) v.speed *= 0.5;

  v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt);
}

export function syncVehicleMesh(v: Vehicle, dt: number): void {
  const spec = v.spec;
  let pitch = 0;
  let roll = 0;
  if (spec.flies) {
    roll = v.steerVis * 0.35;
    pitch = clamp(v.speed / spec.maxSpeed, -1, 1) * 0.15;
  }
  v.object.position.set(v.x, v.y, v.z);
  v.object.rotation.set(pitch, v.yaw, roll, 'YXZ');

  v.wheelSpin += (v.speed * dt) / WHEEL_RADIUS;
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
}

/** Push overlapping vehicles apart (heavier moves less) and slow both. Ground distance and height both matter. */
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

      a.speed *= 0.7;
      b.speed *= 0.7;
    }
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
