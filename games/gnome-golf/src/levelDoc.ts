// The island and its nine holes as a level document (data/levels/island.level.json). config.ts reads its ISLAND and
// HOLES from here, so the course is data and the game code never sees the JSON shape.
import type { LevelDoc } from '@lawn/level';
import type { HoleDef } from './config';
import island from './data/levels/island.level.json';

/** The island document. `data.holes` is the course itself; the markers index the same tee, pin and green points. */
export const COURSE_DOC = island as unknown as LevelDoc<{ holes: HoleDef[] }>;

function param(doc: LevelDoc<unknown>, key: string): number {
  const v = doc.base?.params[key];
  if (typeof v !== 'number') throw new Error(`island.level.json: base.params.${key} must be a number`);
  return v;
}

/** The island's ground numbers (yards), from the document's base generator params. */
export function loadIsland(doc: LevelDoc<unknown>): {
  readonly rx: number; readonly rz: number; readonly beach: number; readonly inland: number; readonly roll: number; readonly seaFloor: number;
} {
  return {
    rx: param(doc, 'rx'),
    rz: param(doc, 'rz'),
    beach: param(doc, 'beach'),
    inland: param(doc, 'inland'),
    roll: param(doc, 'roll'),
    seaFloor: param(doc, 'seaFloor'),
  };
}

/** The nine holes. A copy, so nothing the game does to the course can change the imported document. */
export function loadHoles(doc: LevelDoc<{ holes: HoleDef[] }>): readonly HoleDef[] {
  return structuredClone(doc.data.holes);
}
