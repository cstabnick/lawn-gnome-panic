// Takes mowable plants out of the static scenery batches while the world is built, as PlantSeeds for flora/runtime.ts.
//
//   beginPlantHarvest();                  // app.ts, right before buildWorld: buildStaticCells now hands plants to us
//   const world = buildWorld(scene, renderer);
//   ...createFlora({ ... })               // drains the harvest (drainHarvest) and draws / mows the plants
//
// buildWorld itself is unchanged (the golden layout test builds it without a harvest and sees every placement in its
// batch); in the game the same placements are drawn by flora instead of the merged cells. Content built later (parks,
// fringe, new settlements) can hand its plants over with addMowablePlants and batch only what it gets back.
import * as THREE from 'three';
import { buildPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { setStaticPlantFilter } from '../cull';
import { FLORA, mowableAt, plantKindIndex } from './kinds';
import type { PlantSeed } from './types';

const boxCache = new Map<string, THREE.Box3>();
function localBox(id: string): THREE.Box3 {
  let b = boxCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    boxCache.set(id, b);
  }
  return b;
}

/** The seed for a placement when it is a mowable plant at a mowable size, else null. Pure (measures the prefab once). */
export function seedOf(p: StaticPrefabPlacement): PlantSeed | null {
  const kind = plantKindIndex(p.id);
  if (kind < 0 || p.rot) return null;
  const s = p.scale ?? 1;
  const lb = localBox(p.id);
  const h = lb.max.y * s;
  if (!mowableAt(p.id, h)) return null;
  const yaw = p.yaw ?? 0;
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      // three.js rotation.y: x' = c*x + s*z, z' = -s*x + c*z.
      const rx = c * x0 * s + sn * z0 * s;
      const rz = -sn * x0 * s + c * z0 * s;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
    }
  }
  const hw = (maxX - minX) / 2, hd = (maxZ - minZ) / 2;
  return {
    kind, p,
    x: p.x, y: p.y ?? 0, z: p.z, yaw, scale: s,
    cx: p.x + (minX + maxX) / 2, cz: p.z + (minZ + maxZ) / 2, hw, hd,
    h, r: FLORA.contactFactor * 2 * Math.max(hw, hd),
  };
}

let open = false;
const seeds: PlantSeed[] = [];
let sink: ((seeds: PlantSeed[]) => void) | null = null;

function take(p: StaticPrefabPlacement): boolean {
  if (!open) return false;
  const s = seedOf(p);
  if (!s) return false;
  seeds.push(s);
  return true;
}

/** Start taking mowable plants out of every buildStaticCells batch (call right before buildWorld). */
export function beginPlantHarvest(): void {
  open = true;
  seeds.length = 0;
  // A new world build: plants handed over from now on wait for the next createFlora, not an old one.
  sink = null;
  setStaticPlantFilter(take);
}

/** Stop taking plants and return every seed taken so far (and any handed over by addMowablePlants before flora existed). */
export function drainHarvest(): PlantSeed[] {
  open = false;
  setStaticPlantFilter(null);
  const out = seeds.slice();
  seeds.length = 0;
  return out;
}

/** flora/runtime.ts: where addMowablePlants sends plants once flora exists (null to stop). */
export function setPlantSink(fn: ((seeds: PlantSeed[]) => void) | null): void {
  sink = fn;
}

/**
 * Hand plants built outside buildWorld to flora: every mowable placement becomes a mowable plant (drawn and mowed by
 * flora; give it no collider), and the rest come back for the caller to batch as usual:
 *   scene.add(buildStaticCells(addMowablePlants(placements), { lights: false, name: 'park-planting' }));
 */
export function addMowablePlants(placements: readonly StaticPrefabPlacement[]): StaticPrefabPlacement[] {
  const rest: StaticPrefabPlacement[] = [];
  const taken: PlantSeed[] = [];
  for (const p of placements) {
    const s = seedOf(p);
    if (s) taken.push(s); else rest.push(p);
  }
  if (taken.length > 0) {
    if (sink) sink(taken); else seeds.push(...taken);
  }
  return rest;
}
