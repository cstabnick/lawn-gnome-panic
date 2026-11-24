// The player's own gnome: on foot (camera-relative walk, jump, box collision, aiming) and riding a vehicle.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { CHUTE, PLAYER, WATER } from './config';
import { angleDiff, clampToWorld, groundHeight, pushOutOfBoxes } from './collide';
import { aboveGround, groundAt, heightAt, waterAt } from './terrain';
import { swimState } from './swim';
import { AIM } from './gunMods';
import { exitPoint, seatWorld } from './vehicles';
import { clearHands, poseHands, releaseHands, settleHands } from './driverHands';
import { createRagdoll, impulse, poseRagdoll, ragdollCentre, resetPose, stepRagdoll, type Ragdoll } from './ragdoll';
import type { MountPose } from './mount';
import { isClosed } from './seats';
import { createRideAnimator } from './anim/rideAuto';
import { seaRoughness } from './waves';
import type { InputState, Player, Vehicle, World } from './types';

/** Yaw easing rates, radians per second. */
const AIM_TURN_RATE = 20;
const WALK_TURN_RATE = 12;
const MOVE_EPS = 0.01;
const AXIS_Z = new THREE.Vector3(0, 0, 1);
/** A walk downhill drops the feet by up to this much per frame without going airborne (a box edge or cliff is more). */
const STEP_DOWN = 0.6;

/** Called once, the first frame the parachute starts to open (main plays a sound). */
let chuteHook: (() => void) | undefined;
export function setChuteHook(fn: () => void): void {
  chuteHook = fn;
}

export function createPlayer(scene: THREE.Scene, look: GnomeLook): Player {
  // The water gun replaces the customizer's hand item, so the hand slot is overridden.
  const model: GnomeModel = createGnomeModel(look, { overrideEquipment: ['hand'] });
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  scene.add(model.object);

  // The parachute canopy: built once, hidden until the chute opens.
  const canopy = buildPrefab('parachute-canopy');
  canopy.visible = false;
  model.object.add(canopy);

  // Reused every frame: no per-frame allocation.
  const leanQ = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const state: PlayerState = {
    position: pos, velocity: vel, facing: 0, grounded: true, jumpsUsed: 0, sitting: false,
  };

  // Free-fall state (private): horizontal velocity, time since the bail, and whether the canopy has started to open.
  let vx = 0, vz = 0, fallTime = 0, canopyOpening = false;
  /** Time accumulator for the bobbing float (swim.ts 'bob'). */
  let swimT = 0;
  /** The tumbling body while ragdolling (null when standing), and a reused centre point for it. */
  let rag: Ragdoll | null = null;
  const ragCentre = { x: 0, y: 0, z: 0 };

  /** Undo any riding tilt: the model stands straight again (its yaw is set every frame by model.update). */
  /** Seated poses by vehicle and seat, and the driver's personality (anim/rideAuto.ts); reset whenever the gnome gets off. */
  const rideAnim = createRideAnimator();
  const rideInfo = { kind: '', flies: false, fixedWing: false, boat: false, closed: false, seat: 0, speedFrac: 0, seed: 0, sea: 0 };
  const upright = (): void => { model.object.quaternion.identity(); rideAnim.cancel(model); };

  /** Drop any tumble in progress (the gnome is standing again, or has been moved by something else). */
  const clearRag = (): void => {
    if (!rag) return;
    rag = null;
    p.ragdolling = false;
    resetPose(model);
  };

  /** Start a tumble from where the gnome stands, with world velocity (vx, vy, vz) m/s. */
  const startRag = (vx: number, vy: number, vz: number): void => {
    rag = createRagdoll(p.x, p.y, p.z, p.yaw, 0, 0);
    impulse(rag, vx, vy, vz, 1.2 + Math.min(1.5, Math.hypot(vx, vz) * 0.05));
    p.ragdolling = true;
    p.grounded = false;
    p.vy = 0;
  };

  const p: Player = {
    x: 0, y: 0, z: 0, yaw: 0, vy: 0, grounded: true, health: 1, vehicle: null, seat: 0, model,
    airborne: false, chute: 0, swimming: false, ragdolling: false,

    throwFrom(v: Vehicle, vx: number, vy: number, vz: number) {
      upright();
      clearHands(model);
      seatWorld(v, pos, p.seat);
      p.x = pos.x;
      p.y = pos.y;
      p.z = pos.z;
      p.yaw = v.yaw;
      p.vehicle = null;
      p.seat = 0;
      p.airborne = false;
      p.chute = 0;
      canopyOpening = false;
      canopy.visible = false;
      p.hurt(Math.min(0.2, Math.hypot(vx, vz) * 0.006));
      startRag(vx, vy, vz);
    },

    ragdoll(vx: number, vy: number, vz: number) {
      if (p.ragdolling && rag) {
        impulse(rag, vx, vy, vz, 1.2);
        return;
      }
      upright();
      clearHands(model);
      startRag(vx, vy, vz);
    },

    updateRagdoll(dt: number, world: World) {
      if (!rag) {
        p.ragdolling = false;
        return;
      }
      stepRagdoll(rag, dt, world.boxes);
      ragdollCentre(rag, ragCentre);
      const bounded = clampToWorld(ragCentre.x, ragCentre.z, world.half, PLAYER.radius);
      p.x = bounded.x;
      p.z = bounded.z;
      p.y = groundAt(p.x, p.z, ragCentre.y);
      poseRagdoll(model, rag);
      canopy.visible = false;

      // Get up once the body has come to rest (or after a long tumble).
      if ((rag.still > 1.0 && rag.age > 0.8) || rag.age > 6) {
        rag = null;
        resetPose(model);
        upright();
        p.ragdolling = false;
        p.vy = 0;
        p.grounded = true;
        p.y = groundHeight(p.x, p.z, PLAYER.radius * 0.75, world.boxes, p.y + 0.5);
        model.object.position.set(p.x, p.y, p.z);
        model.arms.left.rotation.set(0, 0, 0);
        model.arms.right.rotation.set(0, 0, 0);
      }
    },

    bail(v: Vehicle) {
      clearRag();
      upright();
      clearHands(model);
      seatWorld(v, pos);
      p.x = pos.x;
      p.y = pos.y;
      p.z = pos.z;
      p.yaw = v.yaw;
      p.vehicle = null;
      p.seat = 0;
      p.airborne = true;
      p.chute = 0;
      p.grounded = false;
      p.vy = -2;
      // Keep some of the flyer's forward speed.
      const carry = v.speed * 0.5;
      vx = Math.sin(v.yaw) * carry;
      vz = Math.cos(v.yaw) * carry;
      fallTime = 0;
      canopyOpening = false;
    },

    updateAir(input: InputState, camYaw: number, dt: number, world: World) {
      fallTime += dt;

      // The chute opens by itself, once, after the free-fall delay and above the deploy altitude. It never closes in the air.
      if (!canopyOpening && p.chute === 0 && fallTime >= CHUTE.deployDelay && aboveGround(p.x, p.y, p.z) > CHUTE.minDeployAltitude) {
        canopyOpening = true;
        chuteHook?.();
      }
      if (canopyOpening) p.chute = Math.min(1, p.chute + CHUTE.openRate * dt);
      const under = p.chute >= 0.5;

      // Vertical: free fall to terminal speed, or the steady canopy descent blended by how open the canopy is.
      if (!under) {
        p.vy = Math.max(-CHUTE.terminalFall, p.vy - CHUTE.fallGravity * dt);
      } else {
        p.vy += (-CHUTE.descend - p.vy) * Math.min(1, 4 * dt) * p.chute;
      }

      // Horizontal: camera-relative move direction, as updateFoot computes it.
      const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      const rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
      let mx = fx * input.moveY + rx * input.moveX;
      let mz = fz * input.moveY + rz * input.moveX;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
      const glide = CHUTE.glideSpeed * (under ? 1 : 0.4);
      const ease = 1 - Math.exp(-2 * dt);
      vx += (mx * glide - vx) * ease;
      vz += (mz * glide - vz) * ease;

      // Integrate position.
      const prevY = p.y;
      p.x += vx * dt;
      p.z += vz * dt;
      p.y += p.vy * dt;

      // Collide with buildings taller than our feet and the playable area.
      const pushed = pushOutOfBoxes(p.x, p.z, PLAYER.radius, world.boxes, p.y + 0.35);
      const bounded = clampToWorld(pushed.x, pushed.z, world.half, PLAYER.radius);
      p.x = bounded.x;
      p.z = bounded.z;

      // Landing (on ground or on top of a building): a hard landing without a canopy hurts.
      const floorY = groundHeight(p.x, p.z, PLAYER.radius * 0.75, world.boxes, Math.max(prevY, p.y));
      if (p.y <= floorY) {
        const impact = -p.vy;
        p.y = floorY;
        p.vy = 0;
        p.grounded = true;
        p.airborne = false;
        if (p.chute < 0.5 && impact > CHUTE.hardLandingSpeed) p.hurt(CHUTE.hardLandingDamage);
        p.chute = 0;
        canopyOpening = false;
        vx = 0;
        vz = 0;
      }

      // Animate. Only hold free-fall/chute arm poses while still airborne; reset on landing to prevent T-pose.
      pos.set(p.x, p.y, p.z);
      vel.set(vx, p.vy, vz);
      state.facing = p.yaw;
      state.grounded = !p.airborne;
      state.jumpsUsed = p.airborne ? 1 : 0;
      state.sitting = false;
      model.update(state, dt);

      if (p.airborne) {
        if (p.chute >= 0.5) {
          model.arms.left.rotation.x = -2.9;
          model.arms.left.rotation.z = 0;
          model.arms.right.rotation.x = -2.9;
          model.arms.right.rotation.z = 0;
        } else {
          model.arms.left.rotation.x = 0;
          model.arms.left.rotation.z = 1.3;
          model.arms.right.rotation.x = 0;
          model.arms.right.rotation.z = -1.3;
        }
      } else {
        model.arms.left.rotation.set(0, 0, 0);
        model.arms.right.rotation.set(0, 0, 0);
      }

      canopy.visible = p.airborne && p.chute > 0.02;
      canopy.scale.setScalar(Math.max(0.01, p.chute));
    },

    updateFoot(input: InputState, camYaw: number, dt: number, world: World) {
      // Camera-relative move direction: forward f and right r on the ground plane.
      const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      const rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
      let mx = fx * input.moveY + rx * input.moveX;
      let mz = fz * input.moveY + rz * input.moveX;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
      const moving = Math.hypot(mx, mz) > MOVE_EPS;

      // The speed comes from where the gnome stands before this move: paddling in deep water, wading slowly, else walking.
      const prevSw = swimState(p.x, p.y, p.z);
      // Aiming down sights (not while swimming) walks slower, faces the camera and raises the gun.
      const aiming = !!input.aim && !p.swimming;
      const baseSpeed = prevSw === 'bob' ? WATER.paddleSpeed : prevSw === 'wade' ? 0.6 * PLAYER.walkSpeed : PLAYER.walkSpeed;
      const speed = aiming ? baseSpeed * AIM.moveMul : baseSpeed;
      vel.set(mx * speed, 0, mz * speed);

      // Facing: aim with the camera while firing or aiming, otherwise turn toward the walk direction.
      if (input.fire || aiming) {
        p.yaw += angleDiff(camYaw, p.yaw) * Math.min(1, AIM_TURN_RATE * dt);
      } else if (moving) {
        const target = Math.atan2(mx, mz);
        p.yaw += angleDiff(target, p.yaw) * Math.min(1, WALK_TURN_RATE * dt);
      }

      // Horizontal move, then collide with walls taller than our feet.
      p.x += vel.x * dt;
      p.z += vel.z * dt;
      const pushed = pushOutOfBoxes(p.x, p.z, PLAYER.radius, world.boxes, p.y + 0.35);
      const bounded = clampToWorld(pushed.x, pushed.z, world.half, PLAYER.radius);
      p.x = bounded.x;
      p.z = bounded.z;

      // Deep water (swim.ts 'bob'): the hollow gnome falls in until its feet reach the float height, then bobs there.
      // No bed under it, no jump. Elsewhere: jump, gravity, and standing on top of buildings/props (the bed in wading water).
      const sw = swimState(p.x, p.y, p.z);
      const w = sw === 'bob' ? waterAt(p.x, p.z) : null;
      if (w) {
        const rest = w.surface - WATER.floatDepth;
        if (!p.swimming) {
          p.vy -= PLAYER.gravity * dt;
          p.y += p.vy * dt;
        }
        if (p.swimming || p.y <= rest) {
          swimT += dt;
          p.swimming = true;
          p.grounded = true;
          p.vy = 0;
          p.y = rest + WATER.bobAmp * Math.sin(swimT * 2 * Math.PI * WATER.bobHz);
        }
      } else {
        p.swimming = false;
        const floorY = groundHeight(p.x, p.z, PLAYER.radius * 0.75, world.boxes, p.y);
        if (p.grounded && p.y > floorY + 0.05) {
          if (p.y - floorY <= STEP_DOWN) p.y = floorY; // walking downhill: stay on the slope
          else p.grounded = false;
        } else if (p.grounded && floorY > p.y) {
          p.y = floorY;
        }
        if (input.jump && p.grounded) {
          p.vy = PLAYER.jumpSpeed;
          p.grounded = false;
        }
        if (!p.grounded) {
          p.vy -= PLAYER.gravity * dt;
          p.y += p.vy * dt;
          if (p.vy <= 0 && p.y <= floorY) {
            p.y = floorY;
            p.vy = 0;
            p.grounded = true;
          }
        }
      }
      vel.y = p.vy;

      // Animate.
      pos.set(p.x, p.y, p.z);
      state.facing = p.yaw;
      state.grounded = p.grounded;
      state.jumpsUsed = p.grounded ? 0 : 1;
      state.sitting = false;
      model.update(state, dt);
      model.arms.left.rotation.z = 0;
      model.arms.right.rotation.z = 0;
      if (p.swimming) {
        // Floating: both arms hang down, the water gun is not raised.
        model.arms.left.rotation.set(0, 0, 0);
        model.arms.right.rotation.set(0, 0, 0);
      }

      // Raise the right arm to aim the water gun (after update, which animates the arms).
      if ((input.fire || aiming) && !p.swimming) model.arms.right.rotation.x = -Math.PI / 2;
    },

    updateRiding(dt: number, lean = 0, horn = false) {
      const v = p.vehicle;
      if (!v) return;
      p.x = v.x;
      p.y = v.y;
      p.z = v.z;
      p.yaw = v.yaw;
      p.vy = 0;
      p.grounded = true;
      seatWorld(v, pos, p.seat);
      vel.set(0, 0, 0);
      state.facing = v.yaw;
      state.grounded = true;
      state.jumpsUsed = 0;
      state.sitting = true;
      model.update(state, dt);
      // Ground vehicles: the rider rides the chassis (its roll and pitch over bumps and in corners) and leans on top of it, about the seat.
      // Aircraft too: a pilot sitting upright in a banked plane poked out of the cockpit and could not reach the yoke (driverHands.ts).
      model.object.quaternion.copy(v.object.quaternion);
      if (!v.spec.flies) model.object.quaternion.multiply(leanQ.setFromAxisAngle(AXIS_Z, lean));
      // Hands on the steering grips (after the model's own arm update and the chassis tilt).
      poseHands(model, v, p.seat, dt);
      // The seat's pose (passengers) or the driver's personality, on top of the hands.
      rideInfo.kind = v.kind;
      rideInfo.flies = v.spec.flies;
      rideInfo.fixedWing = !!v.spec.fixedWing;
      rideInfo.boat = !!v.spec.boat;
      rideInfo.closed = isClosed(v.spec);
      rideInfo.seat = p.seat;
      rideInfo.speedFrac = Math.min(1, Math.abs(v.speed) / Math.max(1, v.spec.maxSpeed));
      rideInfo.seed = v.id;
      rideInfo.sea = v.spec.boat ? seaRoughness(v.x, v.z) : 0;
      rideAnim.update(model, rideInfo, dt, horn);
      // A personality leans or sways the body under the hands: keep the steering hand(s) on the wheel.
      settleHands(model, v, p.seat);
    },

    enter(v: Vehicle, seat = 0) {
      clearRag();
      p.vehicle = v;
      p.seat = seat;
      p.swimming = false;
    },

    /** Draws the gnome during a mount sequence (mount.ts): on foot beside the vehicle, climbing, or still seated. */
    drawMount(pose: MountPose, dt: number, v?: Vehicle, seat = 0) {
      upright();
      p.x = pose.x;
      p.y = pose.y;
      p.z = pose.z;
      p.yaw = pose.yaw;
      p.vy = pose.vy;
      p.grounded = !pose.airborne;
      pos.set(pose.x, pose.y, pose.z);
      vel.set(pose.vx, 0, pose.vz);
      state.facing = pose.yaw;
      state.grounded = !pose.airborne;
      state.jumpsUsed = pose.airborne ? 1 : 0;
      state.sitting = pose.seated;
      model.update(state, dt);
      canopy.visible = false;
      // Arms reach for the rim, a door or a driver, and stretch up over the top of a climb. Set after update, which animates them.
      if (pose.reach > 0 || pose.climb > 0) {
        const arm = -(1.5 * pose.reach + 1.6 * pose.climb);
        model.arms.left.rotation.set(arm, 0, 0);
        model.arms.right.rotation.set(arm, 0, 0);
      }
      // Seated (settling in, or waiting for the door on the way out): ride the chassis and hold the wheel, so the sequence hands
      // over to updateRiding with the hands already on it. Otherwise let go of it smoothly (getting out).
      if (v && pose.seated) {
        model.object.quaternion.copy(v.object.quaternion);
        poseHands(model, v, seat, dt);
      } else releaseHands(model, dt);
    },

    exit() {
      const v = p.vehicle;
      if (!v) return;
      clearRag();
      upright();
      clearHands(model);
      const at = exitPoint(v);
      p.x = at.x;
      p.z = at.z;
      p.y = Math.max(heightAt(at.x, at.z), v.y);
      p.vy = 0;
      p.grounded = aboveGround(at.x, p.y, at.z) <= 0.1;
      p.yaw = v.yaw;
      p.vehicle = null;
      p.seat = 0;
      p.airborne = false;
      p.chute = 0;
      canopyOpening = false;
      canopy.visible = false;
      model.arms.left.rotation.set(0, 0, 0);
      model.arms.right.rotation.set(0, 0, 0);
    },

    hurt(amount: number) {
      p.health = Math.max(0, p.health - amount);
    },

    respawn(x: number, z: number, yaw: number) {
      clearRag();
      upright();
      clearHands(model);
      p.x = x;
      p.y = heightAt(x, z);
      p.z = z;
      p.yaw = yaw;
      p.vy = 0;
      p.grounded = true;
      p.swimming = false;
      p.health = 1;
      p.vehicle = null;
      p.seat = 0;
      p.airborne = false;
      p.chute = 0;
      canopyOpening = false;
      canopy.visible = false;
      model.arms.left.rotation.set(0, 0, 0);
      model.arms.right.rotation.set(0, 0, 0);
    },

    hand() {
      return model.arms.right;
    },

    muzzle(out: THREE.Vector3) {
      if (p.vehicle) {
        seatWorld(p.vehicle, out, p.seat);
        out.y += 0.8;
        return out;
      }
      model.object.updateMatrixWorld(true);
      return model.arms.right.localToWorld(out.set(0, -0.72, 0.02));
    },
  };

  return p;
}
