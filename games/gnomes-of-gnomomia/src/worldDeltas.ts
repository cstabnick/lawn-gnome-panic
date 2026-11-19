// The world's brush edits, loaded once from JSON. A missing or bad file must never stop the game from starting,
// so every failure here falls back to "no edits" rather than throwing.
import { DeltaGrid, type DeltaFile } from '@lawn/level';
import file from './data/levels/world.deltas.json';

/** Builds the edit grid from a parsed file, or null when the file holds no chunks. Logs and returns null on a bad chunk. */
export function deltasFromFile(file: DeltaFile): DeltaGrid | null {
  if (Object.keys(file.chunks).length === 0) return null;
  try {
    return DeltaGrid.fromJSON(file);
  } catch (err) {
    console.error('worldDeltas: could not read world.deltas.json, ignoring brush edits', err);
    return null;
  }
}

/** The world's brush edits (src/data/levels/world.deltas.json), or null when the file holds none. Must not throw. */
export function loadWorldDeltas(): DeltaGrid | null {
  return deltasFromFile(file as DeltaFile);
}
