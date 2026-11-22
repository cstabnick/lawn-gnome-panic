import * as THREE from 'three';

/** Most PointLights that may be visible at once. */
export const POINT_LIGHT_BUDGET = 4;
/** Metres a lit light is favoured by, so lights don't swap back and forth at the edge of the budget. */
export const LIGHT_HYSTERESIS = 1.0;
/** Metres added to a light outside the player's room and its neighbours. */
export const OFF_ROOM_PENALTY = 8;

const OUT_OF_VIEW = 1e6;

/**
 * Indexes to light: the `budget` lowest scores. A currently-on light gets `hysteresis` off its score.
 * Ties go to the lower index. Returns exactly min(budget, scores.length) trues.
 */
export function pickLights(
  scores: readonly number[],
  prevOn: readonly boolean[],
  budget: number,
  hysteresis: number,
): boolean[] {
  const n = scores.length;
  const adjusted = scores.map((s, i) => (prevOn[i] ? s - hysteresis : s));
  const order = scores.map((_, i) => i).sort((a, b) => adjusted[a] - adjusted[b] || a - b);
  const on = new Array<boolean>(n).fill(false);
  const k = Math.max(0, Math.min(budget, n));
  for (let j = 0; j < k; j++) on[order[j]] = true;
  return on;
}

/** True when the light and every ancestor are visible-flagged, ignoring the light's own flag. */
export function shownParents(light: THREE.Object3D): boolean {
  for (let p = light.parent; p; p = p.parent) {
    if (!p.visible) return false;
  }
  return true;
}

/**
 * Scores and toggles the candidate lights (those whose parents are shown). Sets `visible` on every candidate;
 * non-candidates are left alone. The number of visible lights stays constant, because three.js recompiles
 * its shaders whenever the visible light count changes.
 */
export function createLightBudget(
  lights: readonly THREE.PointLight[],
  budget: number,
): {
  update(camera: THREE.Camera, penalty?: (l: THREE.PointLight, worldPos: THREE.Vector3) => number): void;
} {
  const prevOn: boolean[] = lights.map(() => false);
  const frustum = new THREE.Frustum();
  const projScreen = new THREE.Matrix4();
  const worldPos = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  const candIdx: number[] = [];
  const scores: number[] = [];
  const prevC: boolean[] = [];

  return {
    update(camera, penalty) {
      camera.updateMatrixWorld();
      projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreen);
      camera.getWorldPosition(camPos);

      candIdx.length = 0;
      scores.length = 0;
      prevC.length = 0;
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        if (!shownParents(l)) {
          prevOn[i] = false;
          continue;
        }
        l.getWorldPosition(worldPos);
        let score: number;
        if (l.distance === 0) {
          score = -OUT_OF_VIEW; // infinite range: always on
        } else {
          sphere.set(worldPos, l.distance);
          score = frustum.intersectsSphere(sphere)
            ? camPos.distanceTo(worldPos) - l.distance + (penalty ? penalty(l, worldPos) : 0)
            : OUT_OF_VIEW;
        }
        candIdx.push(i);
        scores.push(score);
        prevC.push(prevOn[i]);
      }

      const on = pickLights(scores, prevC, budget, LIGHT_HYSTERESIS);
      for (let j = 0; j < candIdx.length; j++) {
        const i = candIdx[j];
        lights[i].visible = on[j];
        prevOn[i] = on[j];
      }
    },
  };
}
