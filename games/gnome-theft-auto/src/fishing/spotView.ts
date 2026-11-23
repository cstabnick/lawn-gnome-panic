// Fishing hot spots, marked subtly: a few rising bubbles and a faint ring on the water at each FISH_SPOTS spot near the
// player. Cheap: one InstancedMesh, throttled. STUB: issue 1H fills it; keep every exported signature.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { FISH } from './types';
import { FISH_SPOTS } from './species';
import { waterSurface } from './waterKind';

export interface SpotView {
  /** Every frame; does real work only near a spot and at most ~10 times a second. */
  update(px: number, pz: number, time: number): void;
  dispose(): void;
}

const BUBBLES_PER_SPOT = 6;
const WORK_EVERY = 0.1;
const PICK_EVERY = 0.5;
const LOOP = 1.6;
const RISE = 0.35;
const BUBBLE_R = 0.06;
const SCATTER = 1.5;

export function createSpotView(scene: THREE.Scene): SpotView {
  const spots = FISH_SPOTS;
  const surfaces: number[] = spots.map((s) => waterSurface(s.x, s.z) ?? 0);
  const cap = FISH.maxSpotsShown;
  const range2 = FISH.spotShowRange * FISH.spotShowRange;

  const bubbleGeo = new THREE.SphereGeometry(BUBBLE_R, 6, 4);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.7 });
  const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, cap * BUBBLES_PER_SPOT);
  bubbles.frustumCulled = false;
  bubbles.visible = false;
  bubbles.count = 0;

  const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = flatLayer(
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }),
    LAYER.decal,
  );
  const rings = new THREE.InstancedMesh(ringGeo, ringMat, cap);
  rings.frustumCulled = false;
  rings.visible = false;
  rings.count = 0;

  scene.add(bubbles);
  scene.add(rings);

  // Scratch objects, reused every frame.
  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const quat = new THREE.Quaternion();

  // The spots currently shown, nearest first.
  const shownIdx = new Int32Array(cap);
  const shownD2 = new Float64Array(cap);
  let shownCount = 0;

  let lastWork = -1e9;
  let lastPick = -1e9;

  function pick(px: number, pz: number): void {
    shownCount = 0;
    for (let i = 0; i < spots.length; i++) {
      const dx = spots[i].x - px;
      const dz = spots[i].z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 > range2) continue;
      if (shownCount === cap && d2 >= shownD2[cap - 1]) continue;
      // Insertion into the sorted list, dropping the farthest when full.
      let j = shownCount < cap ? shownCount++ : cap - 1;
      while (j > 0 && shownD2[j - 1] > d2) {
        shownD2[j] = shownD2[j - 1];
        shownIdx[j] = shownIdx[j - 1];
        j--;
      }
      shownD2[j] = d2;
      shownIdx[j] = i;
    }
  }

  return {
    update(px: number, pz: number, time: number): void {
      if (time - lastWork < WORK_EVERY) return;
      lastWork = time;

      if (time - lastPick >= PICK_EVERY) {
        lastPick = time;
        pick(px, pz);
      }

      if (shownCount === 0) {
        bubbles.visible = false;
        rings.visible = false;
        bubbles.count = 0;
        rings.count = 0;
        return;
      }

      const ringScale = 0.8 + 0.4 * ((time * 0.5) % 1);
      scl.set(ringScale, 1, ringScale);
      for (let k = 0; k < shownCount; k++) {
        const idx = shownIdx[k];
        const spot = spots[idx];
        const sy = surfaces[idx];

        for (let b = 0; b < BUBBLES_PER_SPOT; b++) {
          // Stable scatter per (spot, bubble) inside SCATTER units of the spot.
          const ang = b * 1.047 + idx * 0.9;
          const rad = (0.35 + 0.65 * ((b * 0.37 + idx * 0.23) % 1)) * SCATTER;
          const ph = ((time + b * 0.27 + idx * 0.4) / LOOP) % 1;
          pos.set(spot.x + Math.cos(ang) * rad, sy + ph * RISE, spot.z + Math.sin(ang) * rad);
          const s = 1 - ph * 0.6;
          scl.set(s, s, s);
          m.compose(pos, quat, scl);
          bubbles.setMatrixAt(k * BUBBLES_PER_SPOT + b, m);
        }

        pos.set(spot.x, sy + 0.02, spot.z);
        scl.set(ringScale, 1, ringScale);
        m.compose(pos, quat, scl);
        rings.setMatrixAt(k, m);
      }

      bubbles.count = shownCount * BUBBLES_PER_SPOT;
      rings.count = shownCount;
      bubbles.instanceMatrix.needsUpdate = true;
      rings.instanceMatrix.needsUpdate = true;
      bubbles.visible = true;
      rings.visible = true;
    },

    dispose(): void {
      scene.remove(bubbles);
      scene.remove(rings);
      bubbleGeo.dispose();
      bubbleMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      bubbles.dispose();
      rings.dispose();
    },
  };
}
