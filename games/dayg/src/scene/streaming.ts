// Chunked streaming of the map (roadmap 8.11). Step 0: chunk keys and chunk indexes are real; the plan and buckets are empty.
import { STREAMING } from '../config';
import type { BlockDef, BlockoutMap } from '../world/types';

export function chunkKey(cx: number, cz: number): string { return `${cx},${cz}`; }
export function chunkOf(x: number, z: number): { cx: number; cz: number } {
  return { cx: Math.floor(x / STREAMING.chunk), cz: Math.floor(z / STREAMING.chunk) };
}
export function plan(focus: { x: number; z: number }, loaded: ReadonlySet<string>, radius: number): { load: string[]; unload: string[] } {
  return { load: [], unload: [] };
}
export function bucket(map: BlockoutMap): Map<string, { blocks: number[]; props: number[]; containers: number[]; paths: number[] }> {
  return new Map();
}
export function isLandmark(b: BlockDef): boolean { return false; }
