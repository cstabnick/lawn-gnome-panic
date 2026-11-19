// The world's surface paint, loaded once from JSON. A missing or bad file must never stop the game from starting,
// so every failure here falls back to "no paint" rather than throwing.
import { PaintGrid, type PaintFile } from '@lawn/level';
import file from './data/levels/world.paint.json';

/** Builds the paint grid from a parsed file, or null when the file holds no chunks. Logs and returns null on a bad chunk. */
export function paintFromFile(file: PaintFile): PaintGrid | null {
  if (Object.keys(file.chunks).length === 0) return null;
  try {
    return PaintGrid.fromJSON(file);
  } catch (err) {
    console.error('worldPaint: could not read world.paint.json, ignoring surface paint', err);
    return null;
  }
}

/** The world's surface paint (src/data/levels/world.paint.json), or null when the file paints nothing. Must not throw. */
export function loadWorldPaint(): PaintGrid | null {
  return paintFromFile(file as PaintFile);
}
