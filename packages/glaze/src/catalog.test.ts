// The catalogue, the id lists and the prefab library must agree. Run: npm test -w packages/glaze
import { getPrefab } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { BEAMS, CATALOG, PAINT_SWATCHES, modsIn } from './catalog';
import { BEAM_IDS, DECAL_IDS, EXTRA_IDS, FINISH_IDS, LAMP_IDS, ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS } from './ids';
import type { SlotId } from './types';

const SHELVES: [SlotId, readonly string[]][] = [
  ['finish', FINISH_IDS], ['decal', DECAL_IDS], ['tyre', TYRE_IDS], ['rim', RIM_IDS], ['steer', STEER_IDS], ['lamp', LAMP_IDS],
  ['beam', BEAM_IDS], ['spoiler', SPOILER_IDS], ['seat', SEAT_IDS], ['ornament', ORNAMENT_IDS], ['extra', EXTRA_IDS],
];

describe('glaze catalogue', () => {
  for (const [slot, ids] of SHELVES) {
    it(`shelf '${slot}' has exactly one product per id, in order`, () => {
      expect(modsIn(slot).map((d) => d.id)).toEqual([...ids]);
    });
  }

  it('every product has a name, a short blurb and a non-negative price', () => {
    for (const d of CATALOG) {
      expect(d.name.length, d.id).toBeGreaterThan(2);
      expect(d.blurb.length, d.id).toBeGreaterThan(8);
      expect(d.blurb.length, d.id).toBeLessThanOrEqual(120);
      expect(d.price, d.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('every product prefab is `glaze-<slot>-<id>` and exists in the prefab library', () => {
    for (const d of CATALOG) {
      if (!d.prefab) continue;
      expect(d.prefab).toBe(`glaze-${d.slot}-${d.id}`);
      expect(getPrefab(d.prefab), `prefab ${d.prefab} is missing`).toBeDefined();
    }
  });

  it('beams carry a colour and swatches are unique', () => {
    for (const b of BEAMS) expect(b.color).toBeGreaterThan(0);
    expect(new Set(PAINT_SWATCHES.map((s) => s.hex)).size).toBe(PAINT_SWATCHES.length);
  });
});
