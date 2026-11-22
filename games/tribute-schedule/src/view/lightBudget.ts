import * as THREE from 'three';

// How many apartment point lights may be on in one frame. The count is constant, so three.js never recompiles
// shaders for a new light count.
export const POINT_LIGHT_BUDGET = 3;
// A light that is on gets this much of a head start (lower score wins), so it does not flicker as the camera moves.
export const LIGHT_HYSTERESIS = 1.0;

const OFF_FRUSTUM_SCORE = 1e6;

// Sort key table for pickInto, shared so the comparator is created once and not per frame.
let sortKeys: number[] = [];
function byKey(a: number, b: number): number {
  return sortKeys[a] - sortKeys[b] || a - b;
}

// Allocation-free core: writes into `out` (length n), using `adjusted` and `order` as scratch (length n).
function pickInto(
  scores: readonly number[],
  prevOn: readonly boolean[],
  budget: number,
  hysteresis: number,
  out: boolean[],
  adjusted: number[],
  order: number[],
): void {
  const n = scores.length;
  for (let i = 0; i < n; i++) {
    adjusted[i] = prevOn[i] ? scores[i] - hysteresis : scores[i];
    order[i] = i;
    out[i] = false;
  }
  sortKeys = adjusted;
  order.sort(byKey);
  const k = Math.min(budget, n);
  for (let j = 0; j < k; j++) out[order[j]] = true;
}

// Returns exactly min(budget, n) trues: the lights with the lowest scores. A light that is currently on has
// `hysteresis` taken off its score. Ties go to the lower index.
export function pickLights(
  scores: readonly number[],
  prevOn: readonly boolean[],
  budget: number,
  hysteresis: number,
): boolean[] {
  const n = scores.length;
  const out = new Array<boolean>(n).fill(false);
  pickInto(scores, prevOn, budget, hysteresis, out, new Array<number>(n).fill(0), new Array<number>(n).fill(0));
  return out;
}

export function createLightBudget(
  lights: readonly THREE.PointLight[],
  budget: number,
): { update(camera: THREE.Camera): void } {
  const n = lights.length;
  const scores = new Array<number>(n).fill(0);
  const prevOn = new Array<boolean>(n).fill(false);
  const nextOn = new Array<boolean>(n).fill(false);
  const adjusted = new Array<number>(n).fill(0);
  const order = new Array<number>(n).fill(0);
  const worldPos = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const projView = new THREE.Matrix4();
  const frustum = new THREE.Frustum();
  const sphere = new THREE.Sphere();

  return {
    update(camera: THREE.Camera): void {
      camera.updateMatrixWorld();
      projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projView);
      camPos.setFromMatrixPosition(camera.matrixWorld);

      for (let i = 0; i < n; i++) {
        const light = lights[i];
        light.getWorldPosition(worldPos);
        sphere.center.copy(worldPos);
        sphere.radius = light.distance;
        scores[i] = frustum.intersectsSphere(sphere)
          ? camPos.distanceTo(worldPos) - light.distance
          : OFF_FRUSTUM_SCORE;
      }

      pickInto(scores, prevOn, budget, LIGHT_HYSTERESIS, nextOn, adjusted, order);
      for (let i = 0; i < n; i++) {
        lights[i].visible = nextOn[i];
        prevOn[i] = nextOn[i];
      }
    },
  };
}
