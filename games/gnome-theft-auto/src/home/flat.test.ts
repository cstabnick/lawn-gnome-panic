// The flat built headless (E10): every placed piece has a 3D object, the beds have a Sleep spot, the Decorate spot exists,
// and the door sits on the Saucer Court stairwell.
import { describe, expect, it } from 'vitest';
import '../interiors/showcase/flat3b';
import { createKit } from '../interiors/kit';
import { interiorById } from '../interiors/registry';
import { FLAT_3B_INTERIOR } from '../interiors/showcase/flat3b';
import { SAUCER_COURT } from '../homes/types';
import { loadLayout, pieceObject, resetLayoutCache } from './layout';

describe('Flat 3B built from the home layout', () => {
  it('builds every placed piece, a Sleep spot, the Decorate spot and the stairwell door', () => {
    resetLayoutCache();
    const layout = loadLayout();
    const placed = interiorById(FLAT_3B_INTERIOR);
    expect(placed).toBeDefined();
    const def = placed!.def;

    const { kit, build } = createKit(placed!);
    def.build(kit);

    for (const it of layout.items) {
      expect(pieceObject(it.uid)).toBeDefined();
    }
    expect(build.spots.some((s) => s.id.startsWith('sleep-'))).toBe(true);
    expect(build.spots.some((s) => s.id === 'decorate')).toBe(true);
    expect(def.door).toEqual(SAUCER_COURT.stairDoor);
  });
});
