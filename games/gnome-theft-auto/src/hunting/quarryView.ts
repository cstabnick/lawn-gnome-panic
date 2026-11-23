// Tuft hunting: quarry meshes. Builds each animal's prefab on first approach and poses it from the simulation state
// (walk cycle, wary head-up, rolled ball, flying, knocked over, hidden).
import type * as THREE from 'three';
import { critterMesh } from '../critters';
import type { Quarry } from './quarry';
import { HUNT } from './species';

export interface QuarryView {
  /** Every frame after the simulation step. (px, pz) is the player; time is seconds since start. */
  update(list: readonly Quarry[], px: number, pz: number, dt: number, time: number): void;
  /** Take a quarry's mesh out of the scene (when it is removed from the list). */
  remove(q: Quarry): void;
}

interface Pose {
  object: THREE.Group;
  /** The root's scale right after building (buildPrefab may already have scaled it). */
  base: THREE.Vector3;
  body?: THREE.Object3D;
  bodyBaseY: number;
  head?: THREE.Object3D;
  tail?: THREE.Object3D;
  legs: THREE.Object3D[];
  wings: THREE.Object3D[];
  phase: number;
}

export function createQuarryView(scene: THREE.Scene): QuarryView {
  const views = new Map<Quarry, Pose>();

  function build(q: Quarry): Pose {
    const object = critterMesh(q.species.prefab, q.species.scale, q.species.tint);
    object.rotation.order = 'YXZ';
    object.traverse((o) => { o.castShadow = true; });
    scene.add(object);
    const legs: THREE.Object3D[] = [];
    const wings: THREE.Object3D[] = [];
    for (let k = 0; k < 4; k++) { const l = object.getObjectByName(`leg-${k}`); if (l) legs.push(l); }
    for (let k = 0; k < 2; k++) { const w = object.getObjectByName(`wing-${k}`); if (w) wings.push(w); }
    const body = object.getObjectByName('body');
    return {
      object,
      base: object.scale.clone(),
      body: body ?? undefined,
      bodyBaseY: body ? body.position.y : 0,
      head: object.getObjectByName('head') ?? undefined,
      tail: object.getObjectByName('tail') ?? undefined,
      legs,
      wings,
      // Deterministic per quarry, so a herd does not move in lockstep.
      phase: (q.id * 2.399) % (Math.PI * 2),
    };
  }

  return {
    update(list, px, pz, dt, time) {
      // Quarry dropped from the simulation list take their meshes with them.
      const live = new Set<Quarry>(list);
      for (const [q, v] of views) {
        if (!live.has(q)) { scene.remove(v.object); views.delete(q); }
      }

      for (const q of list) {
        const d = Math.hypot(q.x - px, q.z - pz);
        const existing = views.get(q);
        if (d > HUNT.meshRadius || q.mode === 'hidden' || q.mode === 'burrowed') {
          if (existing) existing.object.visible = false;
          continue;
        }
        const p = existing ?? build(q);
        if (!existing) views.set(q, p);

        const o = p.object;
        o.visible = true;
        o.position.set(q.x, q.y + q.tip * q.species.radius * 0.35, q.z);
        o.rotation.set(0, q.yaw, q.tip * Math.PI / 2);
        if (q.mode === 'rolled') {
          o.scale.set(p.base.x * 1.15, p.base.y * 0.6, p.base.z * 1.15);
        } else {
          o.scale.copy(p.base);
        }

        if (d > HUNT.animRadius) continue;

        p.phase += dt * (4 + q.speed * 2.2);
        const moving = Math.min(1, q.speed / Math.max(0.5, q.species.walk));
        const rolled = q.mode === 'rolled';
        const wary = q.mode === 'wary';
        const flying = q.mode === 'flying';
        const swing = rolled || wary ? 0 : Math.sin(p.phase) * 0.55 * moving;

        // Diagonal gait: legs 0 and 3 together, 1 and 2 opposite (two-legged birds: 0 and 1 opposite).
        const twoLegged = p.legs.length === 2;
        p.legs.forEach((l, k) => {
          if (flying) { l.rotation.x = 0.8; return; }
          const sign = twoLegged ? (k === 0 ? 1 : -1) : (k === 0 || k === 3 ? 1 : -1);
          l.rotation.x = sign * swing;
        });

        if (p.tail) p.tail.rotation.y = Math.sin(p.phase * 0.7 + 1) * (0.15 + 0.3 * moving);
        if (p.head) p.head.rotation.x = wary ? -0.35 : 0;

        if (p.body) {
          p.body.position.y = p.bodyBaseY + Math.abs(Math.sin(p.phase)) * 0.04 * moving;
        }

        p.wings.forEach((w, k) => {
          const sign = k === 0 ? 1 : -1;
          if (flying) {
            w.rotation.z = sign * Math.sin(time * 40) * 0.7;
          } else {
            const flap = q.mode === 'flee' ? Math.sin(p.phase * 3) * 0.6 : 0;
            w.rotation.z = sign * flap;
          }
        });
      }
    },

    remove(q) {
      const v = views.get(q);
      if (!v) return;
      scene.remove(v.object);
      views.delete(q);
    },
  };
}
