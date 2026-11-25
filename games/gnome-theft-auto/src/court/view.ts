// The broadcast camera for a pickup game: side-on from the south, following the ball along the court.
import * as THREE from 'three';
import { heightAt } from '../terrain';
import { COURT, type PickupView } from './types';

export interface CourtView {
  /** Drive the camera while a game is on; false (camera untouched) when v is null. */
  apply(dt: number, v: PickupView | null): boolean;
}

const EASE_IN_S = 0.6;
const FOLLOW_RATE = 4;

export function createCourtView(camera: THREE.PerspectiveCamera): CourtView {
  let followX: number = COURT.x;
  let active = false;
  let blend = 0;
  const from = new THREE.Vector3();
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  const fromLook = new THREE.Vector3();
  const curLook = new THREE.Vector3();

  return {
    apply(dt, v) {
      if (!v) {
        active = false;
        return false;
      }
      const d = Math.max(0, dt);
      const ground = heightAt(COURT.x, COURT.z);
      const portrait = camera.aspect < 1;
      const lim = Math.max(0, COURT.halfX - 3);
      const bx = THREE.MathUtils.clamp(v.ball.x, COURT.x - lim, COURT.x + lim);
      if (!active) {
        followX = bx;
        from.copy(camera.position);
        camera.getWorldDirection(fromLook);
        fromLook.multiplyScalar(10).add(camera.position);
        blend = 0;
        active = true;
      } else {
        followX += (bx - followX) * (1 - Math.exp(-FOLLOW_RATE * d));
      }
      target.set(followX, ground + (portrait ? 10 : 7.5), COURT.z + (portrait ? 18 : 13));
      look.set(followX, 1, COURT.z - 0.5);
      blend = Math.min(1, blend + d / EASE_IN_S);
      const k = blend * blend * (3 - 2 * blend);
      camera.position.lerpVectors(from, target, k);
      curLook.lerpVectors(fromLook, look, k);
      camera.lookAt(curLook);
      return true;
    },
  };
}
