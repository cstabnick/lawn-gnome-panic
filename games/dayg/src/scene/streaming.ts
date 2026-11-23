// Chunked streaming of the map (roadmap 8.11): chunk keys and indexes, the load/unload plan around the player, and the
// bucketing of blockout items into chunks by their centre (paths go to every chunk they pass through).
import { STREAMING } from '../config';
import type { BlockDef, BlockoutMap } from '../world/types';

/** Maps whose longer side is at most this many metres are built whole at start (the slice). */
export const STREAM_ABOVE = 1000;
/** A block whose top is at or above this height is a landmark: built once and always visible. */
export const LANDMARK_TOP = 60;

export interface ChunkBucket { blocks: number[]; props: number[]; containers: number[]; paths: number[] }

export function chunkKey(cx: number, cz: number): string { return `${cx},${cz}`; }
export function chunkOf(x: number, z: number): { cx: number; cz: number } {
  return { cx: Math.floor(x / STREAMING.chunk), cz: Math.floor(z / STREAMING.chunk) };
}
export function parseChunkKey(key: string): { cx: number; cz: number } {
  const [cx, cz] = key.split(',').map(Number);
  return { cx, cz };
}

/** Chunks to load (within `radius` chunks of the focus, nearest first) and loaded chunks to unload (beyond radius + 1). */
export function plan(focus: { x: number; z: number }, loaded: ReadonlySet<string>, radius: number): { load: string[]; unload: string[] } {
  const f = chunkOf(focus.x, focus.z);
  const load: { key: string; d: number }[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const key = chunkKey(f.cx + dx, f.cz + dz);
      if (!loaded.has(key)) load.push({ key, d: dx * dx + dz * dz });
    }
  }
  load.sort((a, b) => a.d - b.d);
  const unload: string[] = [];
  for (const key of loaded) {
    const { cx, cz } = parseChunkKey(key);
    if (Math.max(Math.abs(cx - f.cx), Math.abs(cz - f.cz)) > radius + 1) unload.push(key);
  }
  return { load: load.map((l) => l.key), unload };
}

/** Indexes of every blockout item by chunk. Blocks, props and containers go by centre; a path goes to every chunk it passes. */
export function bucket(map: BlockoutMap): Map<string, ChunkBucket> {
  const out = new Map<string, ChunkBucket>();
  const at = (cx: number, cz: number): ChunkBucket => {
    const k = chunkKey(cx, cz);
    let b = out.get(k);
    if (!b) { b = { blocks: [], props: [], containers: [], paths: [] }; out.set(k, b); }
    return b;
  };
  map.blocks.forEach((b, i) => {
    const c = chunkOf((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
    at(c.cx, c.cz).blocks.push(i);
  });
  map.props.forEach((p, i) => {
    const c = chunkOf(p.x, p.z);
    at(c.cx, c.cz).props.push(i);
  });
  map.containers.forEach((k, i) => {
    const c = chunkOf(k.x, k.z);
    at(c.cx, c.cz).containers.push(i);
  });
  const step = STREAMING.chunk / 8;
  map.paths.forEach((path, i) => {
    const seen = new Set<string>();
    const touch = (x: number, z: number): void => {
      const c = chunkOf(x, z);
      const k = chunkKey(c.cx, c.cz);
      if (seen.has(k)) return;
      seen.add(k);
      at(c.cx, c.cz).paths.push(i);
    };
    for (let p = 0; p < path.points.length; p++) {
      const [x, z] = path.points[p];
      touch(x, z);
      if (p === path.points.length - 1) break;
      const [x2, z2] = path.points[p + 1];
      const len = Math.hypot(x2 - x, z2 - z);
      const n = Math.max(1, Math.ceil(len / step));
      for (let s = 1; s < n; s++) touch(x + ((x2 - x) * s) / n, z + ((z2 - z) * s) / n);
      touch(x2, z2);
    }
  });
  return out;
}

export function isLandmark(b: BlockDef): boolean { return b.y + b.h >= LANDMARK_TOP; }
