// Gnome ragdoll: a small verlet skeleton (pelvis, neck, head, shoulders, hips, hands, feet joined by distance sticks)
// that tumbles under gravity, bounces off the ground and walls, and drives the gnome model's torso and limb pivots.
// No gore: the gnome goes limp, flops about, then gets up. Pure maths plus a pose writer; no scene access.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { pushOutOfBoxes } from './collide';
import { groundAt } from './terrain';
import type { Box } from './types';

export const RAGDOLL = {
  gravity: 22,
  /** Fixed physics step, seconds. */
  step: 1 / 60,
  /** Per-step velocity kept (air drag). */
  drag: 0.992,
  /** Tangential velocity kept per step while a joint touches the ground. */
  groundFriction: 0.82,
  /** Fraction of the normal speed a joint keeps when it bounces. */
  bounce: 0.35,
  /** Constraint relaxation passes per step. */
  iterations: 6,
  /** Joint radius for the ground and walls. */
  radius: 0.07,
  /** Seconds lying nearly still before a gnome counts as settled. */
  restSpeed: 0.35,
} as const;

// Joint indices.
const PELVIS = 0, NECK = 1, HEAD = 2, SHL = 3, SHR = 4, HIPL = 5, HIPR = 6, HANDL = 7, HANDR = 8, FOOTL = 9, FOOTR = 10;
const N = 11;

/** Rest pose in the gnome's local frame (feet at y = 0, facing +z, left is +x): matches packages/gnome model.ts. */
const REST: readonly [number, number, number][] = [
  [0, 0.4, 0], [0, 0.72, 0], [0, 1.05, 0],
  [0.27, 0.62, 0], [-0.27, 0.62, 0], [0.1, 0.3, 0], [-0.1, 0.3, 0],
  [0.27, 0.3, 0], [-0.27, 0.3, 0], [0.1, 0, 0], [-0.1, 0, 0],
];
/** Pelvis height above the feet in the rest pose (the model origin sits this far under the pelvis along the spine). */
const PELVIS_Y = REST[PELVIS][1];

/** Torso joints are held rigid (every pair); limbs are single sticks that swing freely at the shoulder and hip. */
const STICKS: [number, number, number][] = [];
function addStick(a: number, b: number): void {
  const [ax, ay, az] = REST[a];
  const [bx, by, bz] = REST[b];
  STICKS.push([a, b, Math.hypot(ax - bx, ay - by, az - bz)]);
}
const TORSO = [PELVIS, NECK, HEAD, SHL, SHR, HIPL, HIPR];
for (let i = 0; i < TORSO.length; i++) for (let j = i + 1; j < TORSO.length; j++) addStick(TORSO[i], TORSO[j]);
addStick(SHL, HANDL); addStick(SHR, HANDR); addStick(HIPL, FOOTL); addStick(HIPR, FOOTR);
// Floppy limbs may not fold back through the body: keep hands and feet a little away from the spine.
addStick(NECK, HANDL); addStick(NECK, HANDR);

export interface Ragdoll {
  /** Joint positions, x y z per joint. */
  pos: Float32Array;
  prev: Float32Array;
  /** Seconds since the ragdoll started. */
  age: number;
  /** Seconds the body has been (nearly) at rest; reset by every hit. */
  still: number;
  acc: number;
}

/** Start a ragdoll from a standing gnome at (x, y, z) facing `yaw`, moving at (vx, vz) on foot. */
export function createRagdoll(x: number, y: number, z: number, yaw: number, vx: number, vz: number): Ragdoll {
  const pos = new Float32Array(N * 3);
  const prev = new Float32Array(N * 3);
  const s = Math.sin(yaw), c = Math.cos(yaw);
  for (let i = 0; i < N; i++) {
    const [lx, ly, lz] = REST[i];
    // Local +z is the facing direction (sin yaw, cos yaw); local +x is (cos yaw, -sin yaw).
    pos[i * 3] = x + lx * c + lz * s;
    pos[i * 3 + 1] = y + ly;
    pos[i * 3 + 2] = z - lx * s + lz * c;
  }
  prev.set(pos);
  const r: Ragdoll = { pos, prev, age: 0, still: 0, acc: 0 };
  // Carry the running velocity (per physics step).
  impulse(r, vx, 0, vz, 1);
  return r;
}

/**
 * Add velocity (units/s) to every joint, plus `spin` extra on the upper body so the gnome tumbles instead of sliding.
 * The extra goes along the same direction, weighted by joint height.
 */
export function impulse(r: Ragdoll, vx: number, vy: number, vz: number, spin = 0): void {
  const k = RAGDOLL.step;
  for (let i = 0; i < N; i++) {
    const w = 1 + spin * (REST[i][1] - 0.4) * 1.6;
    r.prev[i * 3] -= vx * w * k;
    r.prev[i * 3 + 1] -= vy * w * k;
    r.prev[i * 3 + 2] -= vz * w * k;
  }
  r.still = 0;
}

function substep(r: Ragdoll, boxes: readonly Box[]): void {
  const { pos, prev } = r;
  const dt = RAGDOLL.step;
  const g = RAGDOLL.gravity * dt * dt;
  let speed2 = 0;
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    const vx = (pos[o] - prev[o]) * RAGDOLL.drag;
    const vy = (pos[o + 1] - prev[o + 1]) * RAGDOLL.drag;
    const vz = (pos[o + 2] - prev[o + 2]) * RAGDOLL.drag;
    speed2 += vx * vx + vy * vy + vz * vz;
    prev[o] = pos[o]; prev[o + 1] = pos[o + 1]; prev[o + 2] = pos[o + 2];
    pos[o] += vx; pos[o + 1] += vy - g; pos[o + 2] += vz;
  }
  r.still = Math.sqrt(speed2 / N) / dt < RAGDOLL.restSpeed ? r.still + dt : 0;

  for (let it = 0; it < RAGDOLL.iterations; it++) {
    for (const [a, b, len] of STICKS) {
      const ao = a * 3, bo = b * 3;
      const dx = pos[bo] - pos[ao], dy = pos[bo + 1] - pos[ao + 1], dz = pos[bo + 2] - pos[ao + 2];
      const d = Math.hypot(dx, dy, dz) || 1e-6;
      const k = (d - len) / d * 0.5;
      pos[ao] += dx * k; pos[ao + 1] += dy * k; pos[ao + 2] += dz * k;
      pos[bo] -= dx * k; pos[bo + 1] -= dy * k; pos[bo + 2] -= dz * k;
    }
    collide(r, boxes);
  }
}

function collide(r: Ragdoll, boxes: readonly Box[]): void {
  const { pos, prev } = r;
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    // Walls and boxes (a box lower than the joint is ignored, so a gnome can be flung over a fence).
    const p = pushOutOfBoxes(pos[o], pos[o + 2], RAGDOLL.radius, boxes, pos[o + 1] - RAGDOLL.radius);
    if (p.hit) {
      // Stop the horizontal motion against the wall (the body then slides down it).
      pos[o] = p.x; pos[o + 2] = p.z;
      prev[o] = p.x; prev[o + 2] = p.z;
    }
    // Ground.
    const floor = groundAt(pos[o], pos[o + 2], pos[o + 1]) + RAGDOLL.radius;
    if (pos[o + 1] < floor) {
      const vy = pos[o + 1] - prev[o + 1];
      pos[o + 1] = floor;
      prev[o + 1] = pos[o + 1] + vy * RAGDOLL.bounce;
      prev[o] = pos[o] - (pos[o] - prev[o]) * RAGDOLL.groundFriction;
      prev[o + 2] = pos[o + 2] - (pos[o + 2] - prev[o + 2]) * RAGDOLL.groundFriction;
    }
  }
}

/** Advance the ragdoll by dt in fixed physics steps. */
export function stepRagdoll(r: Ragdoll, dt: number, boxes: readonly Box[]): void {
  r.age += dt;
  r.acc = Math.min(r.acc + dt, RAGDOLL.step * 4);
  while (r.acc >= RAGDOLL.step) {
    substep(r, boxes);
    r.acc -= RAGDOLL.step;
  }
}

/** Where the body is (pelvis), for the NPC's x / z. */
export function ragdollCentre(r: Ragdoll, out: { x: number; y: number; z: number }): void {
  out.x = r.pos[PELVIS * 3]; out.y = r.pos[PELVIS * 3 + 1]; out.z = r.pos[PELVIS * 3 + 2];
}

const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _inv = new THREE.Quaternion();
const _d = new THREE.Vector3();
const _from = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);

function jv(r: Ragdoll, i: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(r.pos[i * 3], r.pos[i * 3 + 1], r.pos[i * 3 + 2]);
}

/** Pose the model's root to the torso and swing each arm / leg pivot toward its hand / foot. */
export function poseRagdoll(model: GnomeModel, r: Ragdoll): void {
  const root = model.object;
  model.rig.rotation.set(0, 0, 0);
  model.rig.scale.set(1, 1, 1);
  model.rig.position.y = 0;

  const pelvis = jv(r, PELVIS, new THREE.Vector3());
  jv(r, NECK, _up).sub(pelvis).normalize();
  jv(r, SHL, _right).sub(jv(r, SHR, _d)).normalize();
  _right.addScaledVector(_up, -_right.dot(_up)).normalize();
  _fwd.crossVectors(_right, _up);
  _m.makeBasis(_right, _up, _fwd);
  root.quaternion.setFromRotationMatrix(_m);
  // The model origin is at the feet; the pelvis sits PELVIS_Y up the spine.
  root.position.copy(pelvis).addScaledVector(_up, -PELVIS_Y);
  root.updateMatrixWorld(true);

  _inv.copy(root.quaternion).invert();
  const limb = (pivot: THREE.Object3D, from: number, to: number): void => {
    jv(r, to, _d).sub(jv(r, from, _from));
    _d.normalize().applyQuaternion(_inv);
    pivot.quaternion.copy(_q.setFromUnitVectors(_down, _d));
  };
  limb(model.arms.left, SHL, HANDL);
  limb(model.arms.right, SHR, HANDR);
  if (model.legs) {
    limb(model.legs.left, HIPL, FOOTL);
    limb(model.legs.right, HIPR, FOOTR);
  }
}

/** Put the model back upright at (x, z): the next model.update() takes over. */
export function resetPose(model: GnomeModel): void {
  model.object.quaternion.identity();
  model.object.position.y = 0;
  model.arms.left.quaternion.identity();
  model.arms.right.quaternion.identity();
  model.legs?.left.quaternion.identity();
  model.legs?.right.quaternion.identity();
}
