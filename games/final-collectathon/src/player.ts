// The player gnome: walk mode, locked mode, fly mode, scripted moveTo, animation.
// The model is always the player's own gnome (@lawn/gnome), never a separate mesh.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK } from '@lawn/gnome';
import { TUNING } from './config';
import { createWalker, stepWalker } from './walk';
import type { Floor, InputState, Player } from './types';

/** Arm pivot rotation.x that points an arm straight up over the head (the arm hangs along -y; negative x swings it forward and up). */
const FLY_ARM_X = -2.8;
const FLY_OFFSET_MAX = 3;
const FLY_OFFSET_SPEED = 4;
const FLY_OFFSET_DECAY = 1;

interface ScriptedMove {
  sx: number; sy: number; sz: number;
  tx: number; ty: number; tz: number;
  dur: number;
  t: number;
  resolve: () => void;
}

const smoothstep = (k: number): number => k * k * (3 - 2 * k);

export function createPlayer(scene: THREE.Scene): Player {
  const model = createGnomeModel(getMyGnome()?.look ?? GNORMAN_LOOK);
  model.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  scene.add(model.object);
  const walker = createWalker(0, 0, 0, 0);
  const pos = new THREE.Vector3();
  const vel = new THREE.Vector3();
  let move: ScriptedMove | null = null;
  /** Fly mode: sideways offset the stick adds to a scripted move. */
  let offX = 0;

  const finishMove = (): void => {
    if (!move) return;
    const m = move;
    move = null;
    m.resolve();
  };

  const stepMove = (dt: number, input: InputState): void => {
    const m = move!;
    const px = walker.x, py = walker.y, pz = walker.z;
    m.t = Math.min(m.dur, m.t + dt);
    const k = smoothstep(m.dur > 0 ? m.t / m.dur : 1);
    if (p.mode === 'fly') {
      if (Math.abs(input.moveX) > 0.05) offX += input.moveX * FLY_OFFSET_SPEED * dt;
      else offX -= Math.sign(offX) * Math.min(Math.abs(offX), FLY_OFFSET_DECAY * dt);
      offX = Math.max(-FLY_OFFSET_MAX, Math.min(FLY_OFFSET_MAX, offX));
    } else {
      offX = 0;
    }
    walker.x = m.sx + (m.tx - m.sx) * k + offX;
    walker.y = m.sy + (m.ty - m.sy) * k;
    walker.z = m.sz + (m.tz - m.sz) * k;
    if (dt > 0) { walker.vx = (walker.x - px) / dt; walker.vy = (walker.y - py) / dt; walker.vz = (walker.z - pz) / dt; }
    const hx = m.tx - m.sx, hz = m.tz - m.sz;
    if (Math.hypot(hx, hz) > 1e-3) walker.facing = Math.atan2(hx, hz);
    if (m.t >= m.dur) {
      walker.vx = 0; walker.vy = 0; walker.vz = 0;
      if (p.mode === 'fly') walker.grounded = false;
      finishMove();
    }
  };

  const p: Player = {
    model, walker, pos, mode: 'walk',
    update(dt: number, input: InputState, floor: Floor) {
      if (move) {
        stepMove(dt, input);
      } else if (p.mode === 'walk') {
        stepWalker(walker, input.moveX, input.moveZ, input.jumpPressed, floor.colliders, floor.groundAt(walker.x, walker.z), dt);
      } else if (p.mode === 'locked') {
        stepWalker(walker, 0, 0, false, floor.colliders, floor.groundAt(walker.x, walker.z), dt);
      } else {
        // Fly: no gravity, no colliders.
        walker.vx = input.moveX * TUNING.flySpeed;
        walker.vz = input.moveZ * TUNING.flySpeed;
        walker.vy = (input.jump ? 1 : 0) * TUNING.flySpeed;
        walker.x += walker.vx * dt;
        walker.y += walker.vy * dt;
        walker.z += walker.vz * dt;
        walker.grounded = false;
        if (Math.hypot(input.moveX, input.moveZ) > 0.1) walker.facing = Math.atan2(input.moveX, input.moveZ);
      }

      pos.set(walker.x, walker.y, walker.z);
      vel.set(walker.vx, walker.vy, walker.vz);
      const flying = p.mode === 'fly';
      model.update({
        position: pos, velocity: vel, facing: walker.facing,
        grounded: flying ? false : walker.grounded, jumpsUsed: walker.jumpsUsed,
      }, dt);
      if (flying) {
        model.arms.left.rotation.x = FLY_ARM_X;
        model.arms.right.rotation.x = FLY_ARM_X;
      }
    },
    teleport(x, y, z, facing) {
      finishMove();
      offX = 0;
      walker.x = x; walker.y = y; walker.z = z; walker.facing = facing;
      walker.vx = 0; walker.vy = 0; walker.vz = 0;
      walker.grounded = true;
      walker.jumpsUsed = 0;
      pos.set(x, y, z);
      model.object.position.copy(pos);
      model.object.rotation.y = facing;
    },
    moveTo(x, y, z, seconds) {
      finishMove();
      if (seconds <= 0) {
        const keepMode = p.mode;
        p.teleport(x, y, z, walker.facing);
        if (keepMode === 'fly') walker.grounded = false;
        return Promise.resolve();
      }
      offX = 0;
      return new Promise<void>((resolve) => {
        move = { sx: walker.x, sy: walker.y, sz: walker.z, tx: x, ty: y, tz: z, dur: seconds, t: 0, resolve };
      });
    },
    lookAt(x, z) {
      walker.facing = Math.atan2(x - walker.x, z - walker.z);
    },
  };
  return p;
}
