// Pickup view: one hovering, turning prefab drop per live item, plus a small spark burst on pickup.
// Drops come from @lawn/prefabs (shared geometry/material caches): they are removed from the scene, never disposed.
import * as THREE from 'three';
import { createDrop, type Drop } from '@lawn/prefabs';
import { ITEM_KINDS } from './config';
import type { CollectState, Item, ItemView, Pickup } from './types';

/** createDrop calls per sync, so a big rain spreads its model builds over several frames. */
const MAX_CREATES_PER_SYNC = 40;
const MAX_SPARKS = 120;
const SPARKS_PER_BURST = 6;
const SPARK_LIFE = 0.4;
const SPARK_DEFAULT_COLOR = 0xfff2a0;
/** Opacity levels per colour: sparks fade by swapping between cached materials, so nothing is allocated per spark. */
const FADE_STEPS = 8;

const sparkGeo = new THREE.OctahedronGeometry(0.05);
const sparkMats = new Map<number, THREE.MeshBasicMaterial[]>();

function sparkMaterial(color: number, life01: number): THREE.MeshBasicMaterial {
  let steps = sparkMats.get(color);
  if (!steps) {
    steps = [];
    for (let i = 0; i < FADE_STEPS; i++) {
      const m = new THREE.MeshBasicMaterial({ color, depthWrite: false });
      m.transparent = true;
      m.opacity = (i + 1) / FADE_STEPS;
      steps.push(m);
    }
    sparkMats.set(color, steps);
  }
  const i = Math.max(0, Math.min(FADE_STEPS - 1, Math.ceil(life01 * FADE_STEPS) - 1));
  return steps[i];
}

interface Spark { mesh: THREE.Mesh; color: number; vx: number; vy: number; vz: number; age: number }

function dropOpts(item: Item) {
  const def = ITEM_KINDS[item.kind];
  return { glow: def.glow ?? undefined, fit: item.kind === 'anything' ? 0.6 : 0.4 };
}

function makeDrop(item: Item): Drop {
  const opts = dropOpts(item);
  try {
    return createDrop(item.prefab ?? ITEM_KINDS[item.kind].prefab, opts);
  } catch {
    return createDrop('acorn', opts);
  }
}

export function createItemView(scene: THREE.Scene): ItemView {
  const views = new Map<number, { drop: Drop; item: Item }>();
  const sparks: Spark[] = [];
  const live = new Set<number>();

  function removeSpark(i: number): void {
    scene.remove(sparks[i].mesh);
    sparks.splice(i, 1);
  }

  function updateSparks(dt: number): void {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= SPARK_LIFE) { removeSpark(i); continue; }
      s.vy -= 6 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.rotation.y += 8 * dt;
      s.mesh.material = sparkMaterial(s.color, 1 - s.age / SPARK_LIFE);
    }
  }

  return {
    sync(s: CollectState, dt: number) {
      live.clear();
      let created = 0;
      for (const item of s.items) {
        live.add(item.id);
        let v = views.get(item.id);
        if (!v) {
          if (created >= MAX_CREATES_PER_SYNC) continue;
          created++;
          const drop = makeDrop(item);
          if (item.kind === 'golden-acorn') drop.object.scale.setScalar(1.3);
          scene.add(drop.object);
          v = { drop, item };
          views.set(item.id, v);
        }
        v.item = item;
        v.drop.object.position.set(item.x, item.y - 0.35, item.z);
        v.drop.update(dt);
      }
      for (const [id, v] of views) {
        if (!live.has(id)) {
          scene.remove(v.drop.object);
          views.delete(id);
        }
      }
      updateSparks(dt);
    },

    burst(p: Pickup) {
      const color = ITEM_KINDS[p.kind]?.glow ?? SPARK_DEFAULT_COLOR;
      for (let i = 0; i < SPARKS_PER_BURST; i++) {
        if (sparks.length >= MAX_SPARKS) removeSpark(0);
        const a = (i / SPARKS_PER_BURST) * Math.PI * 2 + Math.random() * 0.6;
        const out = 1.2 + Math.random() * 0.8;
        const mesh = new THREE.Mesh(sparkGeo, sparkMaterial(color, 1));
        mesh.position.set(p.x, p.y, p.z);
        scene.add(mesh);
        sparks.push({ mesh, color, vx: Math.cos(a) * out, vy: 2.2 + Math.random() * 1.2, vz: Math.sin(a) * out, age: 0 });
      }
    },

    clear() {
      for (const v of views.values()) scene.remove(v.drop.object);
      views.clear();
      for (const s of sparks) scene.remove(s.mesh);
      sparks.length = 0;
    },
  };
}
