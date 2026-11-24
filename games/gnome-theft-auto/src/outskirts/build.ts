// Pebblewick's static buildings, street furniture, plots and fences (TOWN_PIECES and FENCE_RUNS in town.ts), built once
// as culled static cells, with their colliders.
import * as THREE from 'three';
import { buildPrefab, getPrefab, type StaticPrefabPlacement, type Swatch } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { FENCE_RUNS, TOWN_PIECES } from './town';

export interface TownBuild {
  /** Colliders of the solid pieces and fences (`h` = absolute top height). The facade pushes them into world.boxes. */
  readonly boxes: readonly Box[];
}

export interface TownPlan {
  placements: StaticPrefabPlacement[];
  landmarks: StaticPrefabPlacement[];
  boxes: Box[];
  /** boxIds[i] is the TownPiece id (or `fence:<run id>`) that boxes[i] belongs to. */
  boxIds: string[];
  /** Prefab ids that are not in the catalogue (the piece is skipped). */
  missing: string[];
}

const FENCE_GAP = 1.5;
const FENCE_SCALE_FILL = 0.98;
const FENCE_SIDE = 0.15;
const GROUND_LIFT = 0.05;

const measured = new Map<string, THREE.Box3>();

/** Local bounding box of a prefab (lights off), measured once per id. */
function localBox(id: string): THREE.Box3 {
  let b = measured.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    measured.set(id, b);
  }
  return b;
}

function scaleOf(piece: { scale?: number; size?: number; prefab: string }): number {
  if (piece.scale !== undefined) return piece.scale;
  const lb = localBox(piece.prefab);
  const longest = Math.max(lb.max.x - lb.min.x, lb.max.y - lb.min.y, lb.max.z - lb.min.z);
  return (piece.size ?? longest) / longest;
}

export function planTown(): TownPlan {
  const placements: StaticPrefabPlacement[] = [];
  const landmarks: StaticPrefabPlacement[] = [];
  const boxes: Box[] = [];
  const boxIds: string[] = [];
  const missing = new Set<string>();

  const known = (id: string): boolean => {
    if (getPrefab(id)) return true;
    missing.add(id);
    return false;
  };

  for (const piece of TOWN_PIECES) {
    if (!known(piece.prefab)) continue;
    const lb = localBox(piece.prefab);
    const scale = scaleOf(piece);
    const c = Math.cos(piece.yaw);
    const s = Math.sin(piece.yaw);

    // World AABB of the rotated footprint.
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const corners: [number, number][] = [];
    for (const lx of [lb.min.x, lb.max.x]) {
      for (const lz of [lb.min.z, lb.max.z]) {
        const x = lx * scale, z = lz * scale;
        corners.push([piece.x + x * c + z * s, piece.z - x * s + z * c]);
      }
    }
    for (const [x, z] of corners) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }

    const sink = piece.sink ?? 0;
    let y: number;
    if (piece.solid) {
      const samples = [...corners, [piece.x, piece.z] as [number, number]].map(([x, z]) => heightAt(x, z));
      y = Math.min(...samples) - GROUND_LIFT - sink;
    } else {
      y = heightAt(piece.x, piece.z) - sink;
    }

    const placement: StaticPrefabPlacement = { id: piece.prefab, x: piece.x, y, z: piece.z, yaw: piece.yaw, scale };
    if (piece.tint !== undefined) placement.tint = piece.tint as Swatch | number;
    if (piece.trim !== undefined) placement.trim = piece.trim as Swatch | number;
    (piece.landmark ? landmarks : placements).push(placement);

    if (piece.solid) {
      boxes.push({ minX, maxX, minZ, maxZ, h: y + lb.max.y * scale });
      boxIds.push(piece.id);
    }
  }

  for (const run of FENCE_RUNS) {
    if (!known(run.prefab)) continue;
    const lb = localBox(run.prefab);
    const scale = scaleOf({ prefab: run.prefab, size: run.step * FENCE_SCALE_FILL });
    const size = run.step * FENCE_SCALE_FILL;
    const [fx, fz] = run.from;
    const [tx, tz] = run.to;
    const L = Math.hypot(tx - fx, tz - fz);
    const dx = (tx - fx) / L;
    const dz = (tz - fz) / L;
    const yaw = Math.atan2(dx, dz) - Math.PI / 2;
    const h = lb.max.y * scale;
    for (let st = run.step / 2; st <= L - run.step / 2 + 1e-6; st += run.step) {
      if (run.gaps?.some((g) => Math.abs(st - g) < FENCE_GAP)) continue;
      const cx = fx + dx * st;
      const cz = fz + dz * st;
      const ax = cx - dx * size / 2, az = cz - dz * size / 2;
      const bx = cx + dx * size / 2, bz = cz + dz * size / 2;
      const y = Math.min(heightAt(ax, az), heightAt(bx, bz)) - GROUND_LIFT;
      placements.push({ id: run.prefab, x: cx, y, z: cz, yaw, scale });
      const sx = -dz * FENCE_SIDE, sz = dx * FENCE_SIDE;
      const xs = [ax + sx, ax - sx, bx + sx, bx - sx];
      const zs = [az + sz, az - sz, bz + sz, bz - sz];
      boxes.push({ minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs), h: y + h });
      boxIds.push(`fence:${run.id}`);
    }
  }

  return { placements, landmarks, boxes, boxIds, missing: [...missing] };
}

export function buildTown(scene: THREE.Scene): TownBuild {
  const plan = planTown();
  if (plan.missing.length) console.warn(`Pebblewick: missing prefabs: ${plan.missing.join(', ')}`);
  if (plan.placements.length) {
    scene.add(buildStaticCells(plan.placements, { lights: false, name: 'pebblewick', cls: 'building' }));
  }
  if (plan.landmarks.length) {
    scene.add(buildStaticCells(plan.landmarks, { lights: false, name: 'pebblewick-landmarks', cls: 'landmark' }));
  }
  return { boxes: plan.boxes };
}
