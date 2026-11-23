// Snapshots of the sim for hand-off and room saves (roadmap 8.9). Step 0 stub: chunk is real; everything else throws until roadmap 7.6 / 8.5.
import type { ActionEnvelope, Tuning, WorldState } from '../sim/types';
import type { Streams } from '../sim/rng';
import type { Snapshot } from './protocol';

export function tuningHash(t: Tuning): string { throw new Error('stub'); }
export function makeSnapshot(w: WorldState, s: Streams, log: readonly ActionEnvelope[]): Snapshot { throw new Error('stub'); }
export function restoreSnapshot(snap: Snapshot, tuning?: Tuning): { world: WorldState; streams: Streams } { throw new Error('stub'); }
export async function packSnapshot(snap: Snapshot): Promise<Uint8Array> { throw new Error('stub'); }
export async function unpackSnapshot(bytes: Uint8Array): Promise<Snapshot> { throw new Error('stub'); }
export function toBase64(b: Uint8Array): string { throw new Error('stub'); }
export function fromBase64(s: string): Uint8Array { throw new Error('stub'); }
export function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}
export function replay(w: WorldState, s: Streams, log: readonly ActionEnvelope[], toTick: number): void { throw new Error('stub'); }
