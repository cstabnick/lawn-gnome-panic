// src/player.ts: the local player's first-person controls, vehicle driving, aim down sights and the camera. Filled in by epic 2 (issues 2.2).
import * as THREE from 'three';
import { TUNING, weaponOf, type Game, type InputState, type WeaponDef, type WeaponId } from './config';
import { tryFire, startReload, throwGrenade } from './combat';
import { heightAt } from './terrain';
import { driveVehicle, enterVehicle, exitVehicle, nearestEnterable } from './vehicles';
import { moveSoldier } from './soldiers';

export interface PlayerController {
  update(input: InputState, dt: number): void;
}

const RIFLE_BASE = new THREE.Vector3(0.14, -0.13, -0.32); // hip position of the gun
const ADS_POS = new THREE.Vector3(0, -0.075, -0.28);      // position when fully aimed
const RECOIL_KICK = 0.06;   // model kick for an acorn rifle shot; scaled by the weapon's recoil
const RECOIL_REF = 0.004;   // the acorn rifle's recoilPitch, the reference for the kick scale
const SCOPE_HIDE_T = 0.85;  // scope weapons hide their model above this adsT
const GUN_IDS: readonly WeaponId[] = ['acornRifle', 'seedSprayer', 'peaShooter', 'blunderbuss'];
const AXIS_Z = Math.PI / 2; // rotation that lays a cylinder along the z axis

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Look direction for a yaw and pitch (pitch + is up). */
function lookDir(yaw: number, pitch: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
}

/** Auto weapons fire while the button is held; semi-auto weapons fire once per click. */
function triggerHeld(w: WeaponDef, input: InputState): boolean {
  return w.auto ? input.fire : input.firePressed;
}

function newGunGroup(): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(RIFLE_BASE);
  group.scale.setScalar(0.4);
  group.visible = false;
  return group;
}

function addPart(group: THREE.Group, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rx = 0): void {
  const mat = new THREE.MeshStandardMaterial({ color, depthTest: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rx;
  mesh.renderOrder = 10;
  group.add(mesh);
}

/** Acorn Rifle: wooden stock, black barrel, acorn sight. */
function buildAcornRifle(): THREE.Group {
  const g = newGunGroup();
  addPart(g, new THREE.BoxGeometry(0.08, 0.1, 0.5), 0x8b5a2b, 0, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), 0x2b2b2b, 0, 0.02, -0.5, AXIS_Z);
  addPart(g, new THREE.SphereGeometry(0.05, 10, 8), 0xd4a017, 0, 0.1, -0.1);
  addPart(g, new THREE.CylinderGeometry(0.055, 0.055, 0.03, 10), 0x6b4a2e, 0, 0.14, -0.1);
  return g;
}

/** Seed Sprayer: chunky green body, long barrel, round seed drum underneath. */
function buildSeedSprayer(): THREE.Group {
  const g = newGunGroup();
  addPart(g, new THREE.BoxGeometry(0.12, 0.12, 0.45), 0x3f7d3a, 0, 0, -0.05);
  addPart(g, new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), 0x2b2b2b, 0, 0.02, -0.6, AXIS_Z);
  addPart(g, new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12), 0xd9c24a, 0, -0.12, -0.1, AXIS_Z);
  addPart(g, new THREE.BoxGeometry(0.05, 0.1, 0.06), 0x2b2b2b, 0, -0.09, 0.12);
  return g;
}

/** Pea Shooter: long thin barrel, scope tube with a light-blue lens at the back, green pea at the muzzle. */
function buildPeaShooter(): THREE.Group {
  const g = newGunGroup();
  addPart(g, new THREE.BoxGeometry(0.08, 0.1, 0.5), 0x8b5a2b, 0, 0, 0);
  addPart(g, new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), 0x2b2b2b, 0, 0.02, -0.75, AXIS_Z);
  addPart(g, new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), 0x1a1a1a, 0, 0.11, -0.1, AXIS_Z);
  addPart(g, new THREE.CylinderGeometry(0.028, 0.028, 0.01, 12), 0x9fd8ff, 0, 0.11, 0.06, AXIS_Z);
  addPart(g, new THREE.SphereGeometry(0.03, 10, 8), 0x7fc23a, 0, 0.02, -1.27);
  return g;
}

/** Pinecone Blunderbuss: short wooden stock, wide flared barrel (front twice the back), pinecone at the muzzle. */
function buildBlunderbuss(): THREE.Group {
  const g = newGunGroup();
  addPart(g, new THREE.BoxGeometry(0.1, 0.12, 0.32), 0x6b4a2e, 0, -0.01, 0.02);
  // Rotated to lie along z: +y (the top, radiusTop) points to +z (the back), -y (radiusBottom) to the muzzle.
  addPart(g, new THREE.CylinderGeometry(0.035, 0.07, 0.5, 12), 0x2b2b2b, 0, 0.02, -0.4, AXIS_Z);
  addPart(g, new THREE.SphereGeometry(0.07, 10, 8), 0x7a4e24, 0, 0.02, -0.68);
  return g;
}

export function createPlayerController(game: Game): PlayerController {
  const guns: Record<WeaponId, THREE.Group> = {
    acornRifle: buildAcornRifle(),
    seedSprayer: buildSeedSprayer(),
    peaShooter: buildPeaShooter(),
    blunderbuss: buildBlunderbuss(),
  };
  for (const id of GUN_IDS) game.camera.add(guns[id]);

  const dir = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const gunTarget = new THREE.Vector3();
  let recoil = 0;      // gun kick along z, decays to 0
  let walked = 0;      // distance walked on foot, drives the bob
  let reloadTilt = 0;  // current x rotation of the gun (reload dip)
  let prevX = NaN;

  function fireFrom(p: Game['player'], w: WeaponDef, origin: THREE.Vector3): void {
    lookDir(p.yaw, p.pitch, dir);
    if (!tryFire(game, p, origin, dir)) return;
    recoil = RECOIL_KICK * clamp(w.recoilPitch / RECOIL_REF, 0.5, 2);
    p.pitch = clamp(p.pitch + w.recoilPitch * (1 - 0.5 * p.adsT), -TUNING.maxPitch, TUNING.maxPitch);
    p.yaw += (Math.random() * 2 - 1) * w.recoilPitch * 0.3;
  }

  /** Shows only the current weapon's model (none when `visible` is false) and moves it for the aim and bob. */
  function animateGun(w: WeaponDef, p: Game['player'], dt: number, visible: boolean, reloading: boolean, bobDist: number): void {
    recoil *= Math.exp(-dt * 12);
    for (const id of GUN_IDS) guns[id].visible = false;
    const gun = guns[w.id];
    gun.visible = visible && !(w.scope && p.adsT > SCOPE_HIDE_T);

    const a = p.adsT;
    const bob = Math.sin(bobDist * 1.8) * 0.015 * (1 - a);
    gunTarget.set(
      lerp(RIFLE_BASE.x, ADS_POS.x, a),
      lerp(RIFLE_BASE.y, ADS_POS.y, a) + bob,
      lerp(RIFLE_BASE.z, ADS_POS.z, a) + recoil,
    );
    gun.position.lerp(gunTarget, 1 - Math.exp(-dt * 20));
    const tilt = reloading ? -0.6 : 0;
    reloadTilt += (tilt - reloadTilt) * (1 - Math.exp(-dt * 10));
    gun.rotation.x = reloadTilt;
  }

  return {
    update(input, dt) {
      const p = game.player;
      const camera = game.camera;
      const w = weaponOf(p);
      const onFoot = p.alive && !p.vehicle;

      p.ads = input.aim && p.alive && !p.vehicle && !(input.sprint && input.forward);

      // Zoom towards the weapon's ADS FOV on foot; hip FOV in a vehicle or dead.
      const fov = onFoot ? lerp(TUNING.hipFov, w.adsFov, p.adsT) : TUNING.hipFov;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      // Look, alive or not. Sensitivity drops with the zoom.
      const sens = TUNING.mouseSens * (camera.fov / TUNING.hipFov);
      p.yaw -= input.mouseDx * sens;
      p.pitch = clamp(p.pitch - input.mouseDy * sens, -TUNING.maxPitch, TUNING.maxPitch);

      // Dead: a camera above and behind the body.
      if (!p.alive) {
        const fx = Math.sin(p.yaw);
        const fz = Math.cos(p.yaw);
        camera.position.set(p.pos.x - fx * 6, p.pos.y + 7, p.pos.z - fz * 6);
        camera.lookAt(p.pos.x, p.pos.y + 1, p.pos.z);
        animateGun(w, p, dt, false, false, walked);
        prevX = NaN;
        return;
      }

      const wFwd = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
      const wSide = (input.right ? 1 : 0) - (input.left ? 1 : 0);

      if (p.vehicle) {
        // Driving: the mower or combine takes the controls; the chase camera follows it.
        const v = p.vehicle;
        driveVehicle(v, { throttle: wFwd, steer: wSide });
        prevX = NaN;

        lookDir(p.yaw, p.pitch, dir);
        const dist = TUNING.chaseCamDistance * (v.def.kind === 'combine' ? 1.8 : 1);
        const tx = v.pos.x;
        const ty = v.pos.y + v.def.seatY + 1.2;
        const tz = v.pos.z;
        camPos.set(
          tx - dir.x * dist,
          ty - dir.y * dist + TUNING.chaseCamHeight * 0.5,
          tz - dir.z * dist,
        );
        camPos.y = Math.max(camPos.y, heightAt(camPos.x, camPos.z) + 0.6);
        camera.position.copy(camPos);
        camera.rotation.set(p.pitch, p.yaw + Math.PI, 0);

        if (triggerHeld(w, input)) fireFrom(p, w, camera.position.clone());
        if (input.usePressed) exitVehicle(game, p);
        animateGun(w, p, dt, false, false, walked);
        return;
      }

      // On foot.
      if (input.usePressed) {
        const v = nearestEnterable(game, p);
        if (v) {
          enterVehicle(game, p, v);
          // Start the chase camera behind the vehicle.
          const driven = game.player.vehicle;
          if (driven) p.yaw = driven.yaw;
          prevX = NaN;
          animateGun(w, p, dt, false, false, walked);
          return;
        }
      }

      const fx = Math.sin(p.yaw);
      const fz = Math.cos(p.yaw);
      const rx = -Math.cos(p.yaw);
      const rz = Math.sin(p.yaw);
      let wx = fx * wFwd + rx * wSide;
      let wz = fz * wFwd + rz * wSide;
      const len = Math.hypot(wx, wz);
      if (len > 1) {
        wx /= len;
        wz /= len;
      }

      const beforeX = p.pos.x;
      const beforeZ = p.pos.z;
      moveSoldier(game, p, wx, wz, input.sprint && input.forward, input.jumpPressed, dt);
      if (Number.isFinite(prevX)) {
        const moved = Math.hypot(p.pos.x - beforeX, p.pos.z - beforeZ);
        if (moved < 2) walked += moved; // ignore respawn or teleport jumps
      }
      prevX = p.pos.x;

      camera.position.set(p.pos.x, p.pos.y + TUNING.eyeHeight, p.pos.z);
      camera.rotation.set(p.pitch, p.yaw + Math.PI, 0);

      lookDir(p.yaw, p.pitch, dir);
      if (triggerHeld(w, input)) fireFrom(p, w, camera.position.clone());
      if (input.reloadPressed) startReload(game, p);
      if (input.grenadePressed) throwGrenade(game, p, camera.position.clone(), dir.clone());

      animateGun(w, p, dt, true, p.reloadT > 0, walked);
    },
  };
}
