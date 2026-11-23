// One pooled InstancedMesh for every sky-writing smoke puff and crop-spray puff. Per-puff state lives in preallocated
// typed arrays; emit overwrites the oldest puff when the pool is full. No allocations per frame.
import * as THREE from 'three';

export interface PuffPool {
  readonly object: THREE.InstancedMesh;
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number, color: number): void;
  update(dt: number): void;
  clear(): void;
  dispose(): void;
}

const DRAG = 0.6;
const GROW_END = 0.2;
const SHRINK_START = 0.7;
const START_SCALE = 0.4;

export function createPuffs(scene: THREE.Scene, capacity = 192): PuffPool {
  const object = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
    capacity,
  );
  object.frustumCulled = false;
  object.castShadow = false;
  object.count = 0;
  scene.add(object);

  const x = new Float32Array(capacity);
  const y = new Float32Array(capacity);
  const z = new Float32Array(capacity);
  const vx = new Float32Array(capacity);
  const vy = new Float32Array(capacity);
  const vz = new Float32Array(capacity);
  const age = new Float32Array(capacity);
  const life = new Float32Array(capacity);
  const size = new Float32Array(capacity);
  // Dead slots are only rewritten to zero scale once; this flags the ones whose matrix still shows a live puff.
  const dirty = new Uint8Array(capacity);
  let head = 0;

  const colour = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const zero = new THREE.Vector3();

  function emit(px: number, py: number, pz: number, pvx: number, pvy: number, pvz: number, s: number, l: number, color: number): void {
    const i = head;
    head = (head + 1) % capacity;
    x[i] = px; y[i] = py; z[i] = pz;
    vx[i] = pvx; vy[i] = pvy; vz[i] = pvz;
    age[i] = 0; life[i] = l > 0 ? l : 0.001; size[i] = s;
    colour.setHex(color);
    object.setColorAt(i, colour);
    if (object.instanceColor) object.instanceColor.needsUpdate = true;
  }

  function update(dt: number): void {
    if (dt <= 0) return;
    const drag = Math.max(0, 1 - DRAG * dt);
    let live = 0;
    for (let i = 0; i < capacity; i++) {
      if (age[i] < life[i]) {
        live++;
        age[i] += dt;
        x[i] += vx[i] * dt; y[i] += vy[i] * dt; z[i] += vz[i] * dt;
        vx[i] *= drag; vy[i] *= drag; vz[i] *= drag;
      }
    }
    if (live === 0) {
      object.count = 0;
      return;
    }
    object.count = capacity;
    for (let i = 0; i < capacity; i++) {
      if (age[i] < life[i]) {
        const f = age[i] / life[i];
        let k: number;
        if (f < GROW_END) k = START_SCALE + (1 - START_SCALE) * (f / GROW_END);
        else if (f < SHRINK_START) k = 1;
        else k = Math.max(0, 1 - (f - SHRINK_START) / (1 - SHRINK_START));
        const s = size[i] * k;
        position.set(x[i], y[i], z[i]);
        scale.set(s, s, s);
        matrix.compose(position, quat, scale);
        object.setMatrixAt(i, matrix);
        dirty[i] = 1;
      } else if (dirty[i]) {
        position.set(0, 0, 0);
        scale.copy(zero);
        matrix.compose(position, quat, scale);
        object.setMatrixAt(i, matrix);
        dirty[i] = 0;
      }
    }
    object.instanceMatrix.needsUpdate = true;
  }

  function clear(): void {
    for (let i = 0; i < capacity; i++) {
      age[i] = 0;
      life[i] = 0;
    }
    object.count = 0;
  }

  function dispose(): void {
    scene.remove(object);
    object.geometry.dispose();
    (object.material as THREE.Material).dispose();
  }

  return { object, emit, update, clear, dispose };
}
