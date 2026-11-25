// Driving hands for the whole roster: every vehicle kind's driver holds its control (driveGrips.ts DRIVE_CONTROLS) with both hands
// at every steering angle, forwards and in reverse, the grips sit on the drawn control and turn with it the right way, and a kind
// with nothing to hold is a decision recorded in the table's comment, not an accident.
// Run: npx vitest run src/driveGrips.test.ts
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createGnomeModel, DEFAULT_LOOK, toModelLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { ARM_LENGTH } from '@lawn/glaze';
import type { Vehicle, VehicleKind } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
const { createVehicle, seatWorld, setVehicleLook, syncVehicleMesh } = await import('./vehicles');
const { DRIVE_CONTROLS, controlOf } = await import('./driveGrips');
const { gripWorld, handWeight, poseHands, settleHands, MAX_STRETCH, MIN_STRETCH } = await import('./driverHands');
const { VEHICLES } = await import('./config');

/** Kinds whose driver holds nothing, and why (keep in step with the DRIVE_CONTROLS comment). */
const NO_CONTROL: readonly VehicleKind[] = ['walnut-dinghy', 'gravy-boat', 'snail-coach', 'hoa-van', 'taxi', 'tessie', 'tow-tube', 'tow-ski', 'spoke-gondola', 'euro-hatch', 'crepe-van'];
// tow-tube: the rider holds the tube's handles and leans (tubing/); there is no steering control to grip.
const STEERS = [-1, -0.5, 0, 0.5, 1];
/** The hand ball's centre lands within this of the grip (world units; the ball is 0.06 across). */
const HAND_TOL = 0.02;

const KINDS = (Object.keys(VEHICLES) as VehicleKind[]).filter((k) => k !== 'tessie');

/** A seated driver, posed the way player.ts updateRiding does it: seat, sit, ride the chassis (flyers too), hands on. */
function seatDriver(v: Vehicle, model: GnomeModel, state: PlayerState, dt: number): void {
  syncVehicleMesh(v, 0);
  seatWorld(v, state.position, 0);
  state.facing = v.yaw;
  model.update(state, dt);
  model.object.quaternion.copy(v.object.quaternion);
  poseHands(model, v, 0, dt);
}

function setup(kind: VehicleKind): { v: Vehicle; model: GnomeModel; state: PlayerState } {
  const v = createVehicle(new THREE.Scene(), kind, 3, -4, 0.7);
  v.driver = 'player';
  const model = createGnomeModel(toModelLook(DEFAULT_LOOK));
  const state: PlayerState = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: true };
  // Settle the sit pose and the hands (0.5 s).
  for (let i = 0; i < 30; i++) seatDriver(v, model, state, 1 / 60);
  return { v, model, state };
}

const handOf = (model: GnomeModel, side: 'left' | 'right'): THREE.Vector3 => {
  const arm = model.arms[side];
  arm.updateWorldMatrix(true, false);
  return arm.localToWorld(new THREE.Vector3(0, -ARM_LENGTH, 0));
};

describe('DRIVE_CONTROLS', () => {
  it('covers every kind but the ones with a recorded reason', () => {
    const missing = (Object.keys(VEHICLES) as VehicleKind[]).filter((k) => !controlOf(k));
    expect(missing.sort()).toEqual([...NO_CONTROL].sort());
    for (const k of Object.keys(DRIVE_CONTROLS)) expect(k in VEHICLES).toBe(true);
  });
});

describe.each(KINDS.filter((k) => !NO_CONTROL.includes(k)))('%s driver', (kind) => {
  it('keeps both hands on the grips at every steering angle, forwards and reversing', () => {
    const { v, model, state } = setup(kind);
    const g = new THREE.Vector3();
    for (const speed of [4, -3]) {
      v.speed = speed;
      for (const steer of STEERS) {
        v.steerVis = steer;
        seatDriver(v, model, state, 1 / 60);
        for (const side of ['left', 'right'] as const) {
          expect(gripWorld(v, side, g)).not.toBeNull();
          const d = handOf(model, side).distanceTo(g);
          expect(d, `${kind} ${side} hand at steer ${steer}, speed ${speed}: ${d.toFixed(3)} off the grip`).toBeLessThan(HAND_TOL);
          expect(handWeight(model, side)).toBe(1);
          const s = model.arms[side].scale.y;
          expect(s).toBeGreaterThanOrEqual(MIN_STRETCH);
          expect(s).toBeLessThanOrEqual(MAX_STRETCH);
        }
      }
    }
  });

  it('the grips sit on the drawn control and turn with it (a right turn lifts or pushes the left hand away)', () => {
    const { v } = setup(kind);
    const ctl = controlOf(kind)!;
    const body = v.object.children[0];
    const pivot = ctl.pivot === null ? body : (body.userData.controlPivot as THREE.Object3D);
    expect(pivot, 'control pivot').toBeTruthy();
    const local = (side: 'left' | 'right') => v.object.worldToLocal(gripWorld(v, side, new THREE.Vector3())!);

    for (const steer of STEERS) {
      v.steerVis = steer;
      syncVehicleMesh(v, 0);
      v.object.updateMatrixWorld(true);
      // Each grip is on a mesh of the control: inside the box of the pivot's own meshes (or the body's, for a rim), padded by the hand ball.
      const box = new THREE.Box3().setFromObject(pivot, true).expandByScalar(0.06);
      for (const side of ['left', 'right'] as const) {
        expect(box.containsPoint(gripWorld(v, side, new THREE.Vector3())!), `${kind} ${side} grip on the control at steer ${steer}`).toBe(true);
      }
    }
    if (ctl.pivot === null) return;
    v.steerVis = 0;
    syncVehicleMesh(v, 0);
    const l0 = local('left');
    v.steerVis = 1;
    syncVehicleMesh(v, 0);
    const moved = local('left').sub(l0);
    expect(moved.length(), `${kind}: the left grip moves when the control turns`).toBeGreaterThan(0.02);
    expect(moved.y + moved.z, `${kind}: a right turn takes the left hand up or forward`).toBeGreaterThan(0);
  });

  it('a styled or re-dressed vehicle keeps the hands on (Pay n Glaze look change, damage rebuild)', () => {
    const { v, model, state } = setup(kind);
    if (v.look) setVehicleLook(v, { ...v.look, steer: 'racing' });
    v.steerVis = 0.8;
    for (let i = 0; i < 3; i++) seatDriver(v, model, state, 1 / 60);
    const g = new THREE.Vector3();
    for (const side of ['left', 'right'] as const) {
      expect(handOf(model, side).distanceTo(gripWorld(v, side, g)!)).toBeLessThan(HAND_TOL);
    }
  });
});

describe('a driving personality on top (anim/rideAuto.ts: left arm and body)', () => {
  it('settleHands keeps the right hand on the wheel under a body lean and leaves the overlay-posed left arm alone', () => {
    const { v, model, state } = setup('golf-cart');
    v.steerVis = 0.6;
    seatDriver(v, model, state, 1 / 60);
    // What drive-white-knuckle / drive-casual do after poseHands: lean the body, wave the left arm.
    model.rig.rotation.set(0.3, 0, 0.05);
    model.arms.left.rotation.set(0.1, 0, 0.15);
    const leftQ = model.arms.left.quaternion.clone();
    settleHands(model, v, 0);
    const g = new THREE.Vector3();
    expect(handOf(model, 'right').distanceTo(gripWorld(v, 'right', g)!)).toBeLessThan(HAND_TOL);
    expect(model.arms.left.quaternion.angleTo(leftQ)).toBeLessThan(1e-9);
  });
});

describe('grip reach (pure maths on the table)', () => {
  // Shoulder of a gnome seated at spec.seat facing +z: (+-0.27, 0.62, 0) from its feet, model units = world units.
  it.each(KINDS.filter((k) => !NO_CONTROL.includes(k)))('%s: every grip is 0.6..1.6 arm lengths from its shoulder at rest', (kind) => {
    const spec = VEHICLES[kind];
    const ctl = controlOf(kind)!;
    const s = spec.scale;
    ctl.grips.forEach((g, i) => {
      const sx = spec.seat[0] + (i === 0 ? 0.27 : -0.27);
      const d = Math.hypot(g[0] * s - sx, g[1] * s - (spec.seat[1] + 0.62), g[2] * s - spec.seat[2]);
      expect(d / ARM_LENGTH).toBeGreaterThan(0.6);
      expect(d / ARM_LENGTH).toBeLessThan(1.6);
    });
  });
});
