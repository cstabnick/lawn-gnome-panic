// Snapshots of the sim for hand-off and room saves (roadmap 8.9). Pure except for the browser codecs (CompressionStream, btoa).
import type { ActionEnvelope, Tuning, WorldState } from '../sim/types';
import { createRng, hashString, STREAM_NAMES, type Streams, type StreamName } from '../sim/rng';
import { TUNING } from '../sim/tuning';
import { withSeason } from '../sim/seasonal';
import { graphFor } from '../sim/regionsFull';
import { applyAction, tickWorld } from '../sim/actions';
import { hashWorld } from '../sim/world';
import type { Snapshot } from './protocol';

export function tuningHash(t: Tuning): string {
  return hashString(JSON.stringify(t)).toString(16).padStart(8, '0');
}

export function makeSnapshot(w: WorldState, s: Streams, log: readonly ActionEnvelope[]): Snapshot {
  const { graph: _graph, tuning: _tuning, tuningBase: _base, ...rest } = w;
  const streams = {} as Record<StreamName, number>;
  for (const n of STREAM_NAMES) streams[n] = s[n].state();
  return {
    v: 1, seed: w.seed, map: w.map, tuningHash: tuningHash(w.tuningBase), tick: w.tick, hash: hashWorld(w),
    world: JSON.stringify(rest), streams, log: log.slice(),
  };
}

export function restoreSnapshot(snap: Snapshot, tuning: Tuning = TUNING): { world: WorldState; streams: Streams } {
  if (tuningHash(tuning) !== snap.tuningHash) throw new Error('tuning mismatch');
  const world = JSON.parse(snap.world) as WorldState;
  world.graph = graphFor(snap.map);
  world.tuningBase = tuning;
  world.tuning = withSeason(tuning, world.lastSeason);
  const streams = {} as Streams;
  for (const n of STREAM_NAMES) streams[n] = createRng(snap.streams[n]);
  if (hashWorld(world) !== snap.hash) throw new Error('snapshot hash mismatch');
  return { world, streams };
}

async function through(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as TransformStream<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function packSnapshot(snap: Snapshot): Promise<Uint8Array> {
  const json = new TextEncoder().encode(JSON.stringify(snap));
  return through(json, new CompressionStream('gzip') as unknown as GenericTransformStream);
}

export async function unpackSnapshot(bytes: Uint8Array): Promise<Snapshot> {
  const json = await through(bytes, new DecompressionStream('gzip') as unknown as GenericTransformStream);
  return JSON.parse(new TextDecoder().decode(json)) as Snapshot;
}

export function toBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

export function replay(w: WorldState, s: Streams, log: readonly ActionEnvelope[], toTick: number): void {
  const todo = log.filter((e) => e.tick >= w.tick);
  for (;;) {
    for (const e of todo) if (e.tick === w.tick) applyAction(w, s, e);
    if (w.tick >= toTick) break;
    tickWorld(w, s);
  }
}
