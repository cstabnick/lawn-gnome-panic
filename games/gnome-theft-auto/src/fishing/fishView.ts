// Fishing view (three.js): the bobber, the line from the rod tip, the ripple ring under the bobber, splashes, and the
// landed fish held up for a moment. One fish shown at most. Everything is built once and hidden until used.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { critterMesh } from '../critters';
import type { FishingState, FishPhase } from './types';

export interface FishView {
  /**
   * While fishing (show true): place the bobber and line from the rod tip (tipX, tipY, tipZ) to the bobber, ripple when
   * floating. show false hides all of it (and does nothing else).
   */
  update(s: FishingState, tipX: number, tipY: number, tipZ: number, show: boolean, time: number, dt: number): void;
  /** Show the landed fish (prefab, 1 unit long nose +z) at (x, y, z) facing yaw, `length` units long; null hides it. */
  showCatch(prefab: string | null, x: number, y: number, z: number, yaw: number, length: number): void;
  /** A splash ring at (x, y, z); big for a landed fish let go. */
  splash(x: number, y: number, z: number, big: boolean): void;
  dispose(): void;
}

const LINE_POINTS = 12;
const CATCH_CACHE = 6;
const SPLASH_POOL = 4;
const RIPPLE_PERIOD = 1.2;
const SPLASH_SECONDS = 0.6;
const SPLASH_BIG_SECONDS = 0.9;

interface Splash {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  dur: number;
  big: boolean;
  live: boolean;
}

function isLinePhase(p: FishPhase): boolean {
  return p === 'flight' || p === 'wait' || p === 'bite' || p === 'reel' || p === 'landed';
}

function isFloating(p: FishPhase): boolean {
  return p === 'wait' || p === 'bite' || p === 'reel';
}

export function createFishView(scene: THREE.Scene): FishView {
  // Bobber: a prefab, hidden until used.
  const bobber = critterMesh('fish-bobber', 1);
  bobber.visible = false;
  scene.add(bobber);

  // Line: one polyline of LINE_POINTS points, rewritten while shown.
  const linePos = new Float32Array(LINE_POINTS * 3);
  const lineAttr = new THREE.BufferAttribute(linePos, 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', lineAttr);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf2f2e8, transparent: true, opacity: 0.8 });
  const line = new THREE.Line(lineGeo, lineMat);
  line.frustumCulled = false;
  line.visible = false;
  scene.add(line);

  // Ring geometry shared by the ripple and the splash pool.
  const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24);
  ringGeo.rotateX(-Math.PI / 2);

  // Ripple under the bobber.
  const rippleMat = flatLayer(
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }),
    LAYER.decal,
  );
  const ripple = new THREE.Mesh(ringGeo, rippleMat);
  ripple.visible = false;
  scene.add(ripple);

  // Splash pool: each ring has its own material on the same layer.
  const splashes: Splash[] = [];
  for (let i = 0; i < SPLASH_POOL; i++) {
    const mat = flatLayer(
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }),
      LAYER.decal,
    );
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    splashes.push({ mesh, mat, age: 0, dur: SPLASH_SECONDS, big: false, live: false });
  }
  let anyLive = false;

  // The landed fish: built per prefab, cached (at most CATCH_CACHE), one shown at a time.
  const catchCache = new Map<string, THREE.Group>();
  let current: THREE.Group | null = null;

  let shownLast = false;

  function advanceSplashes(dt: number): void {
    let any = false;
    for (const sp of splashes) {
      if (!sp.live) continue;
      sp.age += dt;
      if (sp.age >= sp.dur) {
        sp.live = false;
        sp.mesh.visible = false;
        continue;
      }
      any = true;
      const k = sp.age / sp.dur;
      const maxScale = sp.big ? 3 : 2;
      sp.mesh.scale.setScalar(1 + (maxScale - 1) * k);
      sp.mat.opacity = 0.6 * (1 - k);
    }
    anyLive = any;
  }

  function hideFishing(): void {
    bobber.visible = false;
    line.visible = false;
    ripple.visible = false;
    if (current) current.visible = false;
  }

  return {
    update(s, tipX, tipY, tipZ, show, time, dt) {
      if (!show) {
        if (shownLast) hideFishing();
        shownLast = false;
      } else {
        shownLast = true;
        const ph = s.phase;

        // Bobber (dip and bite pull it under; wait bobs it a little).
        const bite = ph === 'bite';
        const by = s.bobY - 0.06 * s.dip - (bite ? 0.08 : 0) + (ph === 'wait' ? 0.02 * Math.sin(time * 3) : 0);
        const bz = s.bobZ + s.wobble;
        const bobVisible = ph !== 'idle' && ph !== 'charge';
        bobber.visible = bobVisible;
        // The fish-bobber prefab rests its base at y = 0 with its waterline 0.06 up: sink it so the seam floats on the water.
        if (bobVisible) bobber.position.set(s.bobX, by - 0.06, bz);

        // Line from the rod tip to the bobber, sagging when slack.
        const lineOn = isLinePhase(ph);
        line.visible = lineOn;
        if (lineOn) {
          const sag = ph === 'flight' || ph === 'landed' ? 0.1 : 0.6 * (1 - s.tension);
          for (let i = 0; i < LINE_POINTS; i++) {
            const k = i / (LINE_POINTS - 1);
            linePos[i * 3] = tipX + (s.bobX - tipX) * k;
            linePos[i * 3 + 1] = tipY + (by - tipY) * k - sag * 4 * k * (1 - k);
            linePos[i * 3 + 2] = tipZ + (bz - tipZ) * k;
          }
          lineAttr.needsUpdate = true;
        }

        // Ripple: loops outward while the float is still; bigger on a bite or a nibble dip.
        const floating = isFloating(ph);
        ripple.visible = floating;
        if (floating) {
          const k = (time % RIPPLE_PERIOD) / RIPPLE_PERIOD;
          const boost = bite || s.dip > 0.2 ? 1.5 : 1;
          ripple.position.set(s.bobX, s.surface + 0.01, s.bobZ);
          ripple.scale.setScalar((1 + 1.2 * k) * boost);
          rippleMat.opacity = 0.6 * (1 - k);
        }

        // Landed fish: a gentle sway.
        if (current) {
          current.visible = true;
          current.rotation.z = 0.15 * Math.sin(time * 6);
        }
      }

      if (anyLive) advanceSplashes(dt);
    },

    showCatch(prefab, x, y, z, yaw, length) {
      if (current) current.visible = false;
      current = null;
      if (prefab === null) return;

      let g = catchCache.get(prefab);
      if (!g) {
        g = critterMesh(prefab, 1);
        g.visible = false;
        scene.add(g);
        catchCache.set(prefab, g);
        if (catchCache.size > CATCH_CACHE) {
          const oldest = catchCache.keys().next();
          if (!oldest.done) {
            const old = catchCache.get(oldest.value);
            if (old) scene.remove(old);
            catchCache.delete(oldest.value);
          }
        }
      }
      current = g;
      g.visible = true;
      g.position.set(x, y, z);
      g.rotation.set(0, yaw, 0);
      g.scale.setScalar(length);
    },

    splash(x, y, z, big) {
      // Take an idle ring, else the oldest one.
      let pick = splashes[0];
      for (const sp of splashes) {
        if (!sp.live) {
          pick = sp;
          break;
        }
        if (sp.age > pick.age) pick = sp;
      }
      pick.age = 0;
      pick.big = big;
      pick.dur = big ? SPLASH_BIG_SECONDS : SPLASH_SECONDS;
      pick.live = true;
      pick.mesh.position.set(x, y + 0.01, z);
      pick.mesh.scale.setScalar(1);
      pick.mesh.visible = true;
      anyLive = true;
    },

    dispose() {
      scene.remove(bobber);
      scene.remove(line);
      scene.remove(ripple);
      for (const sp of splashes) {
        scene.remove(sp.mesh);
        sp.mat.dispose();
      }
      for (const g of catchCache.values()) scene.remove(g);
      catchCache.clear();
      current = null;
      lineGeo.dispose();
      lineMat.dispose();
      ringGeo.dispose();
      rippleMat.dispose();
    },
  };
}
