// Tubing visuals: the tow ropes, NPC riders on their tubes (the driver's own and mirrored ones), the buoy-run buoys and
// the next-gate marker. Pooled and capped; runtime.ts says what to draw each frame.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { GnomeModel } from '@lawn/gnome';
import { createAnimator, type Animator } from '../anim/animator';
import { gnomeState, makeGnome } from '../gnomes';
import { registerCull } from '../cull';
import { waterAt } from '../terrain';
import { lookFromSeed } from '../jobs/visuals';
import { BUOY_GATES, buoysOf } from './course';

/** One rope: from the boat's hook (a) to the tube (b); `rope` = its length (slack sags). */
export interface RopeSeg {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  rope: number;
}

/** An NPC rider's tube. riderUp false = the rider fell off (empty tube). */
export interface TubeView {
  x: number; y: number; z: number;
  yaw: number;
  /** -1..1, shown as a roll. */
  lean: number;
  riderUp: boolean;
  /** Look seed for the NPC gnome. */
  seed: number;
}

export const MAX_ROPES = 9;
export const MAX_NPC_TUBES = 6;

export interface TubingView {
  /** Draw these ropes (up to MAX_ROPES); hide the rest. */
  ropes(list: readonly RopeSeg[]): void;
  /** Show, move or (null) remove the NPC tube under `key` (e.g. 'me:0', '12:2'). */
  npcTube(key: string, v: TubeView | null): void;
  /** Place the buoy-run buoys (course.ts BUOY_GATES) once. */
  buildBuoys(): void;
  /** A marker on gate i (null hides it). */
  highlightGate(i: number | null): void;
  /** Animate NPC riders; hide things farther than 300 m from the camera. */
  update(dt: number, camX: number, camZ: number): void;
}

/** Rope points per rope. */
const ROPE_POINTS = 10;
/** The seated gnome's height in its tube group (the tube's seat). */
const SEAT_Y = 0.32;
/** Things farther than this from the camera are hidden or skipped (m). */
const FAR_M = 300;
/** Seconds a cheer lasts, and the gap between cheers (s, from the key's seed). */
const CHEER_S = 1.2;
const CHEER_GAP_MIN = 7;
const CHEER_GAP_SPAN = 4;

/** FNV-1a hash of a string, for deterministic per-key timing. */
function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface NpcEntry {
  /** The key this entry is showing, or null when free. */
  key: string | null;
  group: THREE.Group;
  tube: THREE.Object3D;
  gnome: GnomeModel | null;
  seed: number;
  animator: Animator;
  riderUp: boolean;
  /** Deterministic RNG state for the cheer timing. */
  rng: number;
  /** Seconds until the next cheer starts. */
  cheerIn: number;
  /** Seconds left in the current cheer (0 = not cheering). */
  cheerLeft: number;
}

interface BuoyView {
  obj: THREE.Object3D;
  x: number;
  z: number;
}

function nextRand(e: NpcEntry): number {
  e.rng = (Math.imul(e.rng, 1664525) + 1013904223) >>> 0;
  return e.rng / 4294967296;
}

export function createTubingView(scene: THREE.Scene): TubingView {
  // Ropes: one line per slot, geometry updated in place.
  const ropeMat = new THREE.LineBasicMaterial({ color: 0xf2e2b0 });
  const ropes: { line: THREE.Line; pos: Float32Array }[] = [];
  for (let i = 0; i < MAX_ROPES; i++) {
    const pos = new Float32Array(ROPE_POINTS * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(geo, ropeMat);
    line.frustumCulled = false;
    line.visible = false;
    scene.add(line);
    ropes.push({ line, pos });
  }

  // NPC tubes: a lazily filled pool, at most MAX_NPC_TUBES.
  const npcPool: NpcEntry[] = [];
  const npcByKey = new Map<string, NpcEntry>();

  // Buoys and the gate marker: shared geometry and materials.
  const buoys: BuoyView[] = [];
  let buoysBuilt = false;
  let frame = 0;
  // Unit-radius ring, scaled per gate to gate.width / 2 in highlightGate.
  const markerGeo = new THREE.TorusGeometry(1, 0.15, 8, 32);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xffd400, emissive: 0xffd400, emissiveIntensity: 0.8 });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.castShadow = false;
  marker.visible = false;
  scene.add(marker);

  function newEntry(): NpcEntry {
    const group = new THREE.Group();
    group.name = 'npc-tube';
    group.visible = false;
    const tube = buildPrefab('tow-tube');
    group.add(tube);
    scene.add(group);
    return {
      key: null, group, tube, gnome: null, seed: -1, animator: createAnimator(), riderUp: true,
      rng: 1, cheerIn: CHEER_GAP_MIN, cheerLeft: 0,
    };
  }

  function setGnome(e: NpcEntry, seed: number): void {
    if (e.gnome && e.seed === seed) return;
    if (e.gnome) {
      e.animator.cancel(e.gnome);
      e.gnome.object.removeFromParent();
    }
    e.gnome = makeGnome(e.group, lookFromSeed(seed));
    e.seed = seed;
    e.animator.play('tube-ride', { loop: true });
  }

  function release(e: NpcEntry): void {
    if (e.key !== null) npcByKey.delete(e.key);
    e.key = null;
    e.group.visible = false;
  }

  function ropesFill(seg: RopeSeg, pos: Float32Array): void {
    const dx = seg.bx - seg.ax, dy = seg.by - seg.ay, dz = seg.bz - seg.az;
    const dist = Math.hypot(dx, dy, dz);
    const sag = Math.max(0, seg.rope - dist) * 0.45 + 0.05;
    for (let k = 0; k < ROPE_POINTS; k++) {
      const t = k / (ROPE_POINTS - 1);
      pos[k * 3] = seg.ax + dx * t;
      pos[k * 3 + 1] = seg.ay + dy * t - sag * 4 * t * (1 - t);
      pos[k * 3 + 2] = seg.az + dz * t;
    }
  }

  return {
    ropes(list) {
      const n = Math.min(list.length, MAX_ROPES);
      for (let i = 0; i < MAX_ROPES; i++) {
        const r = ropes[i];
        if (i >= n) {
          r.line.visible = false;
          continue;
        }
        ropesFill(list[i], r.pos);
        (r.line.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        r.line.visible = true;
      }
    },

    npcTube(key, v) {
      if (!v) {
        const e = npcByKey.get(key);
        if (e) release(e);
        return;
      }
      let e = npcByKey.get(key);
      if (!e) {
        e = npcPool.find((p) => p.key === null);
        if (!e && npcPool.length < MAX_NPC_TUBES) {
          e = newEntry();
          npcPool.push(e);
        }
        if (!e) return; // pool full: ignore the extra
        e.key = key;
        npcByKey.set(key, e);
        const h = hashKey(key);
        e.rng = h || 1;
        e.cheerIn = CHEER_GAP_MIN + nextRand(e) * CHEER_GAP_SPAN;
        e.cheerLeft = 0;
      }
      setGnome(e, v.seed);
      e.group.position.set(v.x, v.y, v.z);
      e.group.rotation.set(0, v.yaw, -v.lean * 0.35);
      e.riderUp = v.riderUp;
      if (e.gnome) e.gnome.object.visible = v.riderUp;
      e.group.visible = true;
    },

    buildBuoys() {
      if (buoysBuilt) return;
      buoysBuilt = true;
      for (const g of BUOY_GATES) {
        for (const p of buoysOf(g)) {
          const obj = buildPrefab('tow-buoy');
          obj.position.set(p.x, waterAt(p.x, p.z)?.surface ?? 0, p.z);
          scene.add(obj);
          registerCull(obj, 'prop', { moves: true });
          buoys.push({ obj, x: p.x, z: p.z });
        }
      }
    },

    highlightGate(i) {
      const g = i === null ? undefined : BUOY_GATES[i];
      if (!g) {
        marker.visible = false;
        return;
      }
      marker.position.set(g.x, (waterAt(g.x, g.z)?.surface ?? 0) + 1.5, g.z);      // The ring lies in its local xy plane; turning it by yaw about y puts its width across the gate.
      marker.rotation.set(0, g.yaw, 0);
      marker.scale.setScalar(g.width / 2);
      marker.visible = true;
    },

    update(dt, camX, camZ) {
      frame++;
      // Buoys bob with the waves (near ones only; every other frame is fine).
      if (frame % 2 === 0) {
        for (const b of buoys) {
          if (Math.hypot(b.x - camX, b.z - camZ) > FAR_M) continue;
          b.obj.position.y = waterAt(b.x, b.z)?.surface ?? 0;
        }
      }
      // NPC riders: animate the near ones, hide the far ones.
      for (const e of npcPool) {
        if (e.key === null) continue;
        const near = Math.hypot(e.group.position.x - camX, e.group.position.z - camZ) <= FAR_M;
        e.group.visible = near;
        if (!near || !e.riderUp || !e.gnome) continue;
        e.cheerIn -= dt;
        if (e.cheerLeft > 0) {
          e.cheerLeft -= dt;
          if (e.cheerLeft <= 0) {
            e.cheerLeft = 0;
            e.animator.play('tube-ride', { loop: true });
          }
        } else if (e.cheerIn <= 0) {
          e.cheerLeft = CHEER_S;
          e.cheerIn = CHEER_GAP_MIN + nextRand(e) * CHEER_GAP_SPAN;
          e.animator.play('tube-cheer', { loop: true });
        }
        // model.update() copies the state's position onto the gnome, so the seat height goes in here.
        e.gnome.update(gnomeState(0, SEAT_Y, 0, 0, 0, true), dt);
        e.animator.apply(e.gnome, dt);
      }
    },
  };
}
