// Stage set dressing: the prefab props each story/side-quest stage lists in `set` (src/quests/stages.ts), built once at
// game start as one static batch, with their solid colliders added to the world's boxes. Kept out of buildWorld so the
// golden layout test stays pinned. `?stagesets=0` leaves it out; `?stagemarks` adds buildStageMarks' debug shapes.
import * as THREE from 'three';
import { buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { STAGES, stageSetBoxes } from './quests/stages';
import { heightAt } from './terrain';
import type { Box } from './types';

/** Builds every stage's `set` props (one static batch) and pushes their solid colliders into `boxes`. */
export function buildStageSets(scene: THREE.Scene, boxes: Box[]): { group: THREE.Group; count: number } {
  const placements: StaticPrefabPlacement[] = [];
  for (const s of STAGES) {
    for (const p of s.set) {
      placements.push({ id: p.prefab, x: p.at[0], y: heightAt(p.at[0], p.at[1]) + (p.lift ?? 0), z: p.at[1], yaw: p.yaw, scale: p.scale ?? 1 });
    }
  }
  if (placements.length === 0) return { group: new THREE.Group(), count: 0 };
  const group = buildStaticPrefabs(placements, { lights: false, name: 'stage-sets' });
  scene.add(group);
  boxes.push(...stageSetBoxes());
  return { group, count: placements.length };
}

const LIFT = 0.15;

/** Debug overlay for ?stagemarks: marks, cameras, vehicle marks, walks and paths of every stage. */
export function buildStageMarks(scene: THREE.Scene): THREE.Group {
  void scene;
  const group = new THREE.Group();
  group.name = 'stage-marks';
  const mat = (c: number): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color: c });
  const line = (c: number): THREE.LineBasicMaterial => new THREE.LineBasicMaterial({ color: c });
  const M = { mark: mat(0xffd23f), cam: mat(0x4aa3ff), parked: mat(0xd8342c), 'pull-up': mat(0xf08a24), exit: mat(0xffffff) };
  const L = { cam: line(0x4aa3ff), walk: line(0x3fa34d), path: line(0xff3fb0) };
  const cone = new THREE.ConeGeometry(0.25, 1.6, 8).translate(0, 0.8, 0);
  const arrow = new THREE.BoxGeometry(0.08, 0.08, 0.6).translate(0, 1.2, 0.3);
  const camBox = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const carBox = new THREE.BoxGeometry(1.2, 0.5, 2.2).translate(0, 0.25, 0);
  const ground = (x: number, z: number, up = LIFT): THREE.Vector3 => new THREE.Vector3(x, heightAt(x, z) + up, z);
  /** A polyline following the ground, long segments sampled every 4 m. */
  const trace = (pts: readonly (readonly [number, number])[], loop: boolean, m: THREE.LineBasicMaterial): void => {
    const all = loop && pts.length > 2 ? [...pts, pts[0]] : [...pts];
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < all.length - 1; i++) {
      const [ax, az] = all[i];
      const [bx, bz] = all[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
      for (let k = 0; k < n; k++) out.push(ground(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n));
    }
    if (all.length) out.push(ground(all[all.length - 1][0], all[all.length - 1][1]));
    if (out.length > 1) group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(out), m));
  };
  for (const s of STAGES) {
    for (const m of s.marks) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(cone, M.mark), new THREE.Mesh(arrow, M.mark));
      g.position.copy(ground(m.at[0], m.at[1], m.lift ?? 0));
      g.rotation.y = m.yaw;
      group.add(g);
    }
    for (const c of s.cameras) {
      const from = ground(c.from[0], c.from[2], c.from[1]);
      const box = new THREE.Mesh(camBox, M.cam);
      box.position.copy(from);
      group.add(box);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, ground(c.look[0], c.look[2], c.look[1])]), L.cam));
    }
    for (const v of s.vehicles) {
      const b = new THREE.Mesh(carBox, M[v.role]);
      b.position.copy(ground(v.at[0], v.at[1], 0));
      b.rotation.y = v.yaw;
      group.add(b);
    }
    for (const w of s.walks) trace(w.points, w.loop, L.walk);
    for (const p of s.paths) trace(p.points, false, L.path);
  }
  return group;
}
