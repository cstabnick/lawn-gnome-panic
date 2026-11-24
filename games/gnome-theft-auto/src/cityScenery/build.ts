// Builds a DressPlan into the scene (docs/roadmaps/gta-parks-and-fringe.md): static prefab cells per cull class (mowable
// plants handed to flora first), ground patches, marks and cables. Everything static, merged per cell and culled.
import type * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { addMowablePlants } from '../flora/harvest';
import { buildCables, buildMarks, buildPatches } from './decals';
import type { DressClass, DressPlan } from './types';

/** Cell size per class: big, far-seen things in bigger cells (fewer draw calls), small ones in small cells (culled sooner). */
const CELL: Record<DressClass, number> = { tiny: 64, detail: 64, prop: 64, tree: 128, building: 128 };

export function buildDressPlan(scene: THREE.Scene, plan: DressPlan, name: string): void {
  const byClass = new Map<DressClass, StaticPrefabPlacement[]>();
  for (const d of plan.dress) {
    let list = byClass.get(d.cls);
    if (!list) byClass.set(d.cls, (list = []));
    const p: StaticPrefabPlacement = { id: d.id, x: d.x, y: d.y, z: d.z, yaw: d.yaw, scale: d.scale };
    if (d.tint !== undefined) p.tint = d.tint;
    if (d.trim !== undefined) p.trim = d.trim;
    list.push(p);
  }
  for (const [cls, list] of byClass) {
    const rest = addMowablePlants(list);
    if (rest.length > 0) scene.add(buildStaticCells(rest, { lights: false, name: `${name}-${cls}`, cell: CELL[cls], cls }));
  }
  if (plan.patches.length > 0) buildPatches(scene, plan.patches, `${name}-patches`);
  if (plan.marks.length > 0) buildMarks(scene, plan.marks, `${name}-marks`);
  if (plan.cables.length > 0) buildCables(scene, plan.cables, `${name}-cables`);
}
