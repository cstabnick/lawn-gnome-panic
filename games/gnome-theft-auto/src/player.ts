// The player's own gnome: on foot (camera-relative walk, jump, box collision, aiming) and riding a vehicle.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { PLAYER } from './config';
import { angleDiff, clampToWorld, pushOutOfBoxes } from './collide';
import { exitPoint, seatWorld } from './vehicles';
import type { InputState, Player, Vehicle, World } from './types';

/** Yaw easing rates, radians per second. */
const AIM_TURN_RATE = 20;
const WALK_TURN_RATE = 12;
const MOVE_EPS = 0.01;

export function createPlayer(scene: THREE.Scene, look: GnomeLook): Player {
  // The water gun replaces the customizer's hand item, so the hand slot is overridden.
  const model: GnomeModel = createGnomeModel(look, { overrideEquipment: ['hand'] });
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  scene.add(model.object);

  // Reused every frame: no per-frame allocation.
  const pos = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const state: PlayerState = {
    position: pos, velocity: vel, facing: 0, grounded: true, jumpsUsed: 0, sitting: false,
  };

  const p: Player = {
    x: 0, y: 0, z: 0, yaw: 0, vy: 0, grounded: true, dryness: 1, vehicle: null, model,

    updateFoot(input: InputState, camYaw: number, dt: number, world: World) {
      // Camera-relative move direction: forward f and right r on the ground plane.
      const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      const rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
      let mx = fx * input.moveY + rx * input.moveX;
      let mz = fz * input.moveY + rz * input.moveX;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
      const moving = Math.hypot(mx, mz) > MOVE_EPS;

      vel.set(mx * PLAYER.walkSpeed, 0, mz * PLAYER.walkSpeed);

      // Facing: aim with the camera while firing, otherwise turn toward the walk direction.
      if (input.fire) {
        p.yaw += angleDiff(camYaw, p.yaw) * Math.min(1, AIM_TURN_RATE * dt);
      } else if (moving) {
        const target = Math.atan2(mx, mz);
        p.yaw += angleDiff(target, p.yaw) * Math.min(1, WALK_TURN_RATE * dt);
      }

      // Horizontal move.
      p.x += vel.x * dt;
      p.z += vel.z * dt;

      // Jump and gravity; the ground is y = 0.
      if (input.jump && p.grounded) {
        p.vy = PLAYER.jumpSpeed;
        p.grounded = false;
      }
      if (!p.grounded) {
        p.vy -= PLAYER.gravity * dt;
        p.y += p.vy * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.grounded = true;
        }
      }
      vel.y = p.vy;

      // Collide with buildings (boxes taller than the feet) and the playable area.
      const pushed = pushOutOfBoxes(p.x, p.z, PLAYER.radius, world.boxes, p.y);
      const bounded = clampToWorld(pushed.x, pushed.z, world.half, PLAYER.radius);
      p.x = bounded.x;
      p.z = bounded.z;

      // Animate.
      pos.set(p.x, p.y, p.z);
      state.facing = p.yaw;
      state.grounded = p.grounded;
      state.jumpsUsed = p.grounded ? 0 : 1;
      state.sitting = false;
      model.update(state, dt);

      // Raise the right arm to aim the water gun (after update, which animates the arms).
      if (input.fire) model.arms.right.rotation.x = -Math.PI / 2;
    },

    updateRiding(dt: number) {
      const v = p.vehicle;
      if (!v) return;
      p.x = v.x;
      p.y = v.y;
      p.z = v.z;
      p.yaw = v.yaw;
      p.vy = 0;
      p.grounded = true;
      seatWorld(v, pos);
      vel.set(0, 0, 0);
      state.facing = v.yaw;
      state.grounded = true;
      state.jumpsUsed = 0;
      state.sitting = true;
      model.update(state, dt);
    },

    enter(v: Vehicle) {
      p.vehicle = v;
    },

    exit() {
      const v = p.vehicle;
      if (!v) return;
      const at = exitPoint(v);
      p.x = at.x;
      p.z = at.z;
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
      p.yaw = v.yaw;
      p.vehicle = null;
    },

    soak(amount: number) {
      p.dryness = Math.max(0, p.dryness - amount);
    },

    respawn(x: number, z: number, yaw: number) {
      p.x = x;
      p.y = 0;
      p.z = z;
      p.yaw = yaw;
      p.vy = 0;
      p.grounded = true;
      p.dryness = 1;
      p.vehicle = null;
    },

    hand() {
      return model.arms.right;
    },

    muzzle(out: THREE.Vector3) {
      if (p.vehicle) {
        seatWorld(p.vehicle, out);
        out.y += 0.8;
        return out;
      }
      model.object.updateMatrixWorld(true);
      return model.arms.right.localToWorld(out.set(0, -0.72, 0.02));
    },
  };

  return p;
}
