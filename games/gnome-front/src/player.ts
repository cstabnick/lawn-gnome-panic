// src/player.ts: the local player's first-person controls, vehicle driving, aim down sights and the camera. Filled in by epic 2 (issues 2.2).
import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import { TUNING, weaponOf, type Game, type InputState, type WeaponDef, type WeaponId } from './config';
import { tryFire, startReload, throwGrenade } from './combat';
import { heightAt } from './terrain';
import { driveVehicle, enterVehicle, exitVehicle, nearestEnterable } from './vehicles';
import { moveSoldier } from './soldiers';

export interface PlayerController {
  update(input: InputState, dt: number): void;
}

const RIFLE_BASE = new THREE.Vector3(0.14, -0.13, -0.32); // hip position of the gun
const GUN_SCALE = 0.4;
const ADS_Z = -0.3;                                           // gun depth when fully aimed
/**
 * Height of each gun's sight line in model units (top of the front post, centre of the scope).
 * When aimed, the gun is placed so this line lies exactly on the camera axis: the front post's tip
 * is the screen centre, which is where shots go.
 */
const SIGHT_Y: Record<WeaponId, number> = { acornRifle: 0.1, seedSprayer: 0.11, peaShooter: 0.11, blunderbuss: 0.14 };
const RECOIL_KICK = 0.06;   // model kick for an acorn rifle shot; scaled by the weapon's recoil
const RECOIL_REF = 0.004;   // the acorn rifle's recoilPitch, the reference for the kick scale
const SCOPE_HIDE_T = 0.85;  // scope weapons hide their model above this adsT
const GUN_IDS: readonly WeaponId[] = ['acornRifle', 'seedSprayer', 'peaShooter', 'blunderbuss'];

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
  group.scale.setScalar(GUN_SCALE);
  group.visible = false;
  return group;
}

/**
 * A first-person gun: the prefab (packages/prefabs catalog, front-weapons.ts) held with buildHeld. The held
 * model's muzzle points up (+y), so it is turned to point down -z, the gun's own axis. Each mesh gets its own
 * material so it draws over the world.
 */
function buildGun(prefabId: string): THREE.Group {
  const g = newGunGroup();
  const held = buildHeld(prefabId);
  held.rotation.x = -Math.PI / 2;
  held.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = (mesh.material as THREE.Material).clone();
    mat.depthTest = false;
    mesh.material = mat;
    mesh.renderOrder = 10;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });
  g.add(held);
  return g;
}

export function createPlayerController(game: Game): PlayerController {
  const guns: Record<WeaponId, THREE.Group> = {
    acornRifle: buildGun('acorn-rifle'),
    seedSprayer: buildGun('seed-sprayer'),
    peaShooter: buildGun('pea-shooter'),
    blunderbuss: buildGun('pinecone-blunderbuss'),
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
      lerp(RIFLE_BASE.x, 0, a),
      lerp(RIFLE_BASE.y, -SIGHT_Y[w.id] * GUN_SCALE, a) + bob,
      lerp(RIFLE_BASE.z, ADS_Z, a) + recoil,
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
