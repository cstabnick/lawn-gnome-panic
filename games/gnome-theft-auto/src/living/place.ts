// E31 living world: small shared helpers for the builders (hamlets, the High Tarn, roadside, the Unmown). Placing
// prefabs on the ground in one culled static batch, their colliders, and keep-clear checks against roads and colliders.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { plantKind } from '../flora/kinds';
import { HIGHWAYS } from '../config';
import { heightAt } from '../terrain';
import type { Box } from '../types';

/** One piece to place. `y` defaults to the ground; `lift` is added on top. `solid` pushes a collider. */
export interface Piece {
  id: string; x: number; z: number; yaw?: number; scale?: number;
  tint?: number; trim?: number; y?: number; lift?: number; solid?: boolean;
}

const sizes = new Map<string, THREE.Box3>();
/** The prefab's own bounding box at scale 1, yaw 0 (cached). Empty box for an unknown id. */
export function prefabBounds(id: string): THREE.Box3 {
  let b = sizes.get(id);
  if (!b) {
    b = getPrefab(id) ? new THREE.Box3().setFromObject(buildPrefab(id, { lights: false })) : new THREE.Box3();
    sizes.set(id, b);
  }
  return b;
}

/** World collider of a piece: its footprint rotated by yaw, scaled, top at y + height. Null for an unknown prefab. */
export function pieceBox(p: Piece): Box | null {
  const lb = prefabBounds(p.id);
  if (lb.isEmpty()) return null;
  const s = p.scale ?? 1, yaw = p.yaw ?? 0, c = Math.cos(yaw), sn = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      // three.js rotation.y: x' = x cos + z sin, z' = -x sin + z cos.
      const x = (x0 * c + z0 * sn) * s, z = (-x0 * sn + z0 * c) * s;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
  }
  const y = groundY(p);
  return { minX: p.x + minX, maxX: p.x + maxX, minZ: p.z + minZ, maxZ: p.z + maxZ, h: y + lb.max.y * s };
}

function groundY(p: Piece): number {
  return (p.y ?? heightAt(p.x, p.z)) + (p.lift ?? 0);
}

/** Distance from (x, z) to the nearest highway centre line (roads, trails, lanes). */
export function roadDist(x: number, z: number): number {
  let best = Infinity;
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) {
      const [ax, az] = h.points[i], [bx, bz] = h.points[i + 1];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
      best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
    }
  }
  return best;
}

/** True when the rectangle `b` grown by `gap` overlaps no box in `boxes`. */
export function clearOfBoxes(b: Box, boxes: readonly Box[], gap = 0.3): boolean {
  for (const o of boxes) {
    if (b.maxX + gap > o.minX && b.minX - gap < o.maxX && b.maxZ + gap > o.minZ && b.minZ - gap < o.maxZ) return false;
  }
  return true;
}

/**
 * Places pieces in one culled static batch named `name`, skipping a solid piece whose collider would overlap a collider
 * already in `boxes` (or one placed earlier in this call). Pushes the colliders of solid pieces. Returns the pieces that
 * were placed. Unknown prefab ids are skipped.
 */
export function placePieces(scene: THREE.Scene, boxes: Box[], pieces: readonly Piece[], name: string): Piece[] {
  const placed: Piece[] = [];
  const batch = [];
  // Solid pieces first, so a loose piece (a flower bed, a mowable plant) never ends up under a collider: the mowing
  // guard (flora/world.test.ts) forbids a box standing on a mowable plant.
  const solidFirst = [...pieces.filter((p) => p.solid), ...pieces.filter((p) => !p.solid)];
  for (const p of solidFirst) {
    if (!getPrefab(p.id)) continue;
    if (p.solid) {
      const b = pieceBox(p);
      if (!b || !clearOfBoxes(b, boxes)) continue;
      boxes.push(b);
    } else if (plantKind(p.id)) {
      const y = groundY(p);
      if (boxes.some((o) => p.x >= o.minX && p.x <= o.maxX && p.z >= o.minZ && p.z <= o.maxZ && o.h < y + 2.5)) continue;
    }
    placed.push(p);
    batch.push({
      id: p.id, x: p.x, y: groundY(p), z: p.z, yaw: p.yaw ?? 0, scale: p.scale ?? 1,
      ...(p.tint !== undefined ? { tint: p.tint } : {}), ...(p.trim !== undefined ? { trim: p.trim } : {}),
    });
  }
  if (batch.length) scene.add(buildStaticCells(batch, { lights: false, name }));
  return placed;
}

/** A small seeded random generator (deterministic layouts). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
