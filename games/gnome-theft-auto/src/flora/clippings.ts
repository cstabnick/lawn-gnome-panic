// Pooled leaf-clipping particles: one InstancedMesh. burst() throws clippings up from a mowed plant; update(dt)
// flies them, lets them land and fade out. Unused or dead slots carry a zero-scale matrix (hidden). No allocation
// in burst() or update(): typed arrays and module-level scratch objects only.
import * as THREE from 'three';

export interface Clippings {
  object: THREE.InstancedMesh;
  /** Throw `count` clippings of `color` from (x, y, z), spread over `spread` m. Reuses the oldest when the pool is full. */
  burst(x: number, y: number, z: number, color: number, count: number, spread: number): void;
  update(dt: number): void;
}

const GRAVITY = 9.8;
const DRAG = 1.5;
const LIE_EPS = 0.01;

// Module-level scratch (never reallocated per frame).
const sPos = new THREE.Vector3();
const sQuat = new THREE.Quaternion();
const sEuler = new THREE.Euler();
const sMat = new THREE.Matrix4();
const sZero = new THREE.Matrix4().makeScale(0, 0, 0);
const sColor = new THREE.Color();
const sUnit = new THREE.Vector3(1, 1, 1);

export function createClippings(scene: THREE.Scene, max = 120): Clippings {
  const object = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.09, 0.015, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    max,
  );
  object.count = max;
  object.frustumCulled = false;
  object.castShadow = false;
  object.receiveShadow = false;
  object.name = 'flora-clippings';

  for (let i = 0; i < max; i++) object.setMatrixAt(i, sZero);
  // Create instanceColor up front so setColorAt() later only writes.
  sColor.set(0xffffff);
  object.setColorAt(0, sColor);
  scene.add(object);

  const px = new Float32Array(max);
  const py = new Float32Array(max);
  const pz = new Float32Array(max);
  const vx = new Float32Array(max);
  const vy = new Float32Array(max);
  const vz = new Float32Array(max);
  const floorY = new Float32Array(max);
  const life = new Float32Array(max);
  const spin = new Float32Array(max);
  const angle = new Float32Array(max);
  let next = 0;
  let live = 0;

  function hide(i: number): void {
    object.setMatrixAt(i, sZero);
  }

  function burst(x: number, y: number, z: number, color: number, count: number, spread: number): void {
    const n = Math.min(count, max);
    sColor.set(color);
    for (let k = 0; k < n; k++) {
      const i = next;
      next = (next + 1) % max;
      if (life[i] <= 0) live++;

      const jx = (Math.random() * 2 - 1) * spread;
      const jz = (Math.random() * 2 - 1) * spread;
      px[i] = x + jx;
      py[i] = y + 0.15 + Math.random() * 0.35;
      pz[i] = z + jz;

      // Radial outward from the plant; a random heading if the jitter landed on the centre.
      const heading = Math.hypot(jx, jz) > 1e-4 ? Math.atan2(jz, jx) : Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      vx[i] = Math.cos(heading) * speed;
      vz[i] = Math.sin(heading) * speed;
      vy[i] = 2 + Math.random() * 2;

      floorY[i] = y;
      life[i] = 0.9 + Math.random() * 0.5;
      spin[i] = Math.random() * 8;
      angle[i] = Math.random() * Math.PI * 2;

      sColor.offsetHSL(0, 0, (Math.random() * 2 - 1) * 0.06);
      object.setColorAt(i, sColor);
      sColor.set(color);
    }
    if (n > 0 && object.instanceColor) object.instanceColor.needsUpdate = true;
  }

  function update(dt: number): void {
    if (live === 0) return;
    let changed = false;
    for (let i = 0; i < max; i++) {
      if (life[i] <= 0) continue;
      changed = true;

      if (py[i] > floorY[i] + LIE_EPS || vy[i] !== 0) {
        vy[i] -= GRAVITY * dt;
        const drag = Math.max(0, 1 - DRAG * dt);
        vx[i] *= drag;
        vz[i] *= drag;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
        pz[i] += vz[i] * dt;
        if (py[i] <= floorY[i] + LIE_EPS) {
          py[i] = floorY[i] + LIE_EPS;
          vx[i] = 0;
          vy[i] = 0;
          vz[i] = 0;
        } else {
          angle[i] += spin[i] * dt;
        }
      }

      life[i] -= dt;
      if (life[i] <= 0) {
        life[i] = 0;
        live--;
        hide(i);
        continue;
      }

      sPos.set(px[i], py[i], pz[i]);
      sEuler.set(angle[i], angle[i] * 0.7, 0);
      sQuat.setFromEuler(sEuler);
      sMat.compose(sPos, sQuat, sUnit);
      object.setMatrixAt(i, sMat);
    }
    if (changed) object.instanceMatrix.needsUpdate = true;
  }

  return { object, burst, update };
}
