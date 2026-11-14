// src/player.ts: the local player's first-person controls, vehicle driving and camera. Filled in by epic 2 (issue 2.2).
import * as THREE from 'three';
import { TUNING, type Game, type InputState } from './config';
import { tryFire, startReload, throwGrenade } from './combat';
import { heightAt } from './terrain';
import { driveVehicle, enterVehicle, exitVehicle, nearestEnterable } from './vehicles';
import { moveSoldier } from './soldiers';

export interface PlayerController {
  update(input: InputState, dt: number): void;
}

const RIFLE_BASE = new THREE.Vector3(0.22, -0.2, -0.45);
const RECOIL_KICK = 0.06;
const RECOIL_PITCH = 0.004;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Look direction for a yaw and pitch (pitch + is up). */
function lookDir(yaw: number, pitch: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
}

/** First-person rifle: a group parented to the camera, with a stock, barrel and acorn sight. */
function buildRifle(): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(RIFLE_BASE);
  const add = (geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rx = 0): void => {
    const mat = new THREE.MeshStandardMaterial({ color, depthTest: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    mesh.renderOrder = 10;
    group.add(mesh);
  };
  add(new THREE.BoxGeometry(0.08, 0.1, 0.5), 0x8b5a2b, 0, 0, 0);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), 0x2b2b2b, 0, 0.02, -0.5, Math.PI / 2);
  add(new THREE.SphereGeometry(0.05, 10, 8), 0xd4a017, 0, 0.1, -0.1);
  add(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 10), 0x6b4a2e, 0, 0.14, -0.1);
  return group;
}

export function createPlayerController(game: Game): PlayerController {
  const rifle = buildRifle();
  game.camera.add(rifle);

  const dir = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const rifleTarget = new THREE.Vector3();
  let recoil = 0;      // rifle kick along z, decays to 0
  let walked = 0;      // distance walked on foot, drives the bob
  let reloadTilt = 0;  // current x rotation of the rifle (reload dip)
  let prevX = NaN;

  function fireFrom(p: Game['player'], origin: THREE.Vector3): void {
    lookDir(p.yaw, p.pitch, dir);
    if (tryFire(game, p, origin, dir)) {
      recoil = RECOIL_KICK;
      p.pitch = clamp(p.pitch + RECOIL_PITCH, -TUNING.maxPitch, TUNING.maxPitch);
    }
  }

  function animateRifle(dt: number, visible: boolean, reloading: boolean, bobDist: number): void {
    rifle.visible = visible;
    if (!visible) return;
    recoil *= Math.exp(-dt * 12);
    const bob = Math.sin(bobDist * 1.8) * 0.015;
    rifleTarget.set(RIFLE_BASE.x, RIFLE_BASE.y + bob, RIFLE_BASE.z + recoil);
    rifle.position.lerp(rifleTarget, 1 - Math.exp(-dt * 20));
    const tilt = reloading ? -0.6 : 0;
    reloadTilt += (tilt - reloadTilt) * (1 - Math.exp(-dt * 10));
    rifle.rotation.x = reloadTilt;
  }

  return {
    update(input, dt) {
      const p = game.player;
      const camera = game.camera;

      // Look, alive or not.
      p.yaw -= input.mouseDx * TUNING.mouseSens;
      p.pitch = clamp(p.pitch - input.mouseDy * TUNING.mouseSens, -TUNING.maxPitch, TUNING.maxPitch);

      // Dead: a camera above and behind the body.
      if (!p.alive) {
        const fx = Math.sin(p.yaw);
        const fz = Math.cos(p.yaw);
        camera.position.set(p.pos.x - fx * 6, p.pos.y + 7, p.pos.z - fz * 6);
        camera.lookAt(p.pos.x, p.pos.y + 1, p.pos.z);
        rifle.visible = false;
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

        if (input.fire) fireFrom(p, camera.position.clone());
        if (input.usePressed) exitVehicle(game, p);
        animateRifle(dt, false, false, walked);
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
          animateRifle(dt, false, false, walked);
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
      if (input.fire) fireFrom(p, camera.position.clone());
      if (input.reloadPressed) startReload(game, p);
      if (input.grenadePressed) throwGrenade(game, p, camera.position.clone(), dir.clone());

      animateRifle(dt, true, p.reloadT > 0, walked);
    },
  };
}
