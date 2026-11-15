// One racer on screen = a mower with the gnome riding it, placed from a KartState.
// The view only: nothing here feeds back into the simulation.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { DRIFT, type KartState, type VehicleId } from '../config';
import { createMower, type MowerModel } from './mower';

export interface Racer {
  object: THREE.Group;
  /** Place and animate from the kart (position, heading, lean on k.st, drift sparks, boost flame, grass spray). */
  update(k: Readonly<KartState>, dt: number): void;
  /** Remove from the scene and dispose its geometries and materials. */
  dispose(): void;
}

const SPRAY_COUNT = 30;
const SPRAY_LIFE = 0.5;
const SPRAY_RATE = 40; // particles per second while spraying
const GRAVITY = 9.8;
const DEAD_Y = -1000;

export function createRacer(scene: THREE.Scene, look: GnomeLook, vehicle: VehicleId, color: number): Racer {
  const object = new THREE.Group();
  scene.add(object);

  // Lean, bounce and drift yaw all live on tilt, so the mower and its effects move together.
  const tilt = new THREE.Group();
  object.add(tilt);

  const mower: MowerModel = createMower(vehicle, color);
  tilt.add(mower.object);

  // The gnome rides at the seat. Its model is animated from a fixed seated pose (see update()).
  const gnome: GnomeModel = createGnomeModel(look);
  const holder = new THREE.Group();
  holder.position.copy(mower.seat);
  holder.add(gnome.object);
  mower.object.add(holder);
  const pose: PlayerState = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
  };

  // Drift sparks at the rear wheels: two points, colour switches when the boost is charged.
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0.06, -0.6, 0.5, 0.06, -0.6]), 3));
  const sparkMat = new THREE.PointsMaterial({ color: 0x6cc8ff, size: 0.14, transparent: true, opacity: 0.9 });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.visible = false;
  tilt.add(sparks);

  // Boost flame: a cone at the back, apex pointing backwards.
  const flameGeo = new THREE.ConeGeometry(0.16, 0.6, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.8 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.45, -1.0);
  flame.visible = false;
  tilt.add(flame);

  // Grass spray: a fixed pool of particles in WORLD space (so they trail behind the kart), reused every frame.
  const sprayPos = new Float32Array(SPRAY_COUNT * 3).fill(DEAD_Y);
  const sprayVel = new Float32Array(SPRAY_COUNT * 3);
  const sprayLife = new Float32Array(SPRAY_COUNT);
  const sprayAttr = new THREE.BufferAttribute(sprayPos, 3);
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', sprayAttr);
  const sprayMat = new THREE.PointsMaterial({ color: 0x3f9a3a, size: 0.12, transparent: true, opacity: 0.9 });
  const spray = new THREE.Points(sprayGeo, sprayMat);
  spray.frustumCulled = false;
  scene.add(spray);
  let sprayNext = 0;
  let sprayAcc = 0;

  let time = 0;
  let lean = 0;
  let yawOff = 0;

  function spawnSpray(k: Readonly<KartState>, speed: number): void {
    // Emit from the right side (object -x) and throw the grass outward and up.
    const h = k.h;
    const cos = Math.cos(h);
    const sin = Math.sin(h);
    const lx = -0.6;
    const lz = -0.2;
    const wx = k.x + lx * cos + lz * sin;
    const wz = k.z - lx * sin + lz * cos;
    // Right of heading h is (-cos h, 0, sin h).
    const rightX = -cos;
    const rightZ = sin;
    const i = sprayNext * 3;
    sprayPos[i] = wx;
    sprayPos[i + 1] = 0.15;
    sprayPos[i + 2] = wz;
    sprayVel[i] = k.vx * 0.15 + rightX * 3 + (Math.random() - 0.5);
    sprayVel[i + 1] = 2 + Math.random() * 1.5;
    sprayVel[i + 2] = k.vz * 0.15 + rightZ * 3 + (Math.random() - 0.5);
    sprayLife[sprayNext] = SPRAY_LIFE * (0.7 + 0.3 * Math.min(1, speed / 15));
    sprayNext = (sprayNext + 1) % SPRAY_COUNT;
  }

  function updateSpray(k: Readonly<KartState>, speed: number, dt: number): void {
    const spraying = !k.off && speed > 3;
    if (spraying) {
      sprayAcc += dt * SPRAY_RATE;
      while (sprayAcc >= 1) {
        sprayAcc -= 1;
        spawnSpray(k, speed);
      }
    } else {
      sprayAcc = 0;
    }
    for (let p = 0; p < SPRAY_COUNT; p++) {
      if (sprayLife[p] <= 0) continue;
      sprayLife[p] -= dt;
      const i = p * 3;
      if (sprayLife[p] <= 0) {
        sprayPos[i + 1] = DEAD_Y;
        continue;
      }
      sprayPos[i] += sprayVel[i] * dt;
      sprayPos[i + 1] += sprayVel[i + 1] * dt;
      sprayPos[i + 2] += sprayVel[i + 2] * dt;
      sprayVel[i + 1] -= GRAVITY * dt;
    }
    sprayAttr.needsUpdate = true;
  }

  return {
    object,
    update(k, dt) {
      time += dt;
      object.position.set(k.x, 0, k.z);
      object.rotation.y = k.h;

      // Forward speed along the heading.
      const speed = k.vx * Math.sin(k.h) + k.vz * Math.cos(k.h);
      mower.update(speed, k.st, dt);

      // Lean into the steer, more at speed; the bike leans harder.
      const ease = 1 - Math.exp(-dt * 10);
      const leanScale = vehicle === 'bike' ? 2.5 : 1;
      const targetLean = k.st * 0.12 * Math.min(1, Math.abs(speed) / 10) * leanScale;
      lean += (targetLean - lean) * ease;
      tilt.rotation.z = lean;

      // While drifting the back swings out: a yaw offset of the mower body.
      const targetYaw = k.drift !== 0 ? -k.drift * 0.35 : 0;
      yawOff += (targetYaw - yawOff) * ease;
      tilt.rotation.y = yawOff;

      // Off the mown track the mower judders in the long grass.
      tilt.position.y = k.off && Math.abs(speed) > 2 ? 0.04 * Math.abs(Math.sin(time * 25)) : 0;

      // Drift sparks: blue while charging, orange once a boost is ready.
      sparks.visible = k.drift !== 0;
      if (sparks.visible) {
        sparkMat.color.setHex(k.charge < DRIFT.chargeForBoost ? 0x6cc8ff : 0xffa030);
      }

      // Boost flame flickers while the boost lasts.
      flame.visible = k.boost > 0;
      if (flame.visible) flame.scale.setScalar(0.8 + 0.3 * Math.abs(Math.sin(time * 40)));

      updateSpray(k, speed, dt);

      // The gnome: pose it seated, then set the arms (update() would overwrite them).
      gnome.update(pose, dt);
      gnome.arms.left.rotation.x = mower.armReach;
      gnome.arms.right.rotation.x = mower.armReach;
    },
    dispose() {
      scene.remove(object);
      scene.remove(spray);
      object.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      sprayGeo.dispose();
      sprayMat.dispose();
    },
  };
}
