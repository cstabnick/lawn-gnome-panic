// The catalogue, the id lists and the prefab library must agree. Run: npm test -w packages/glaze
import { getPrefab } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { BEAMS, CATALOG, PAINT_SWATCHES, modsIn } from './catalog';
import {
  BEAM_IDS, BUMPER_IDS, CANOPY_IDS, DECAL_IDS, EXHAUST_IDS, EXTRA_IDS, FINISH_IDS, GRILLE_IDS, HORN_IDS, LAMP_IDS, MIRROR_IDS,
  ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS,
} from './ids';
import type { SlotId } from './types';

// Node's global, typed here so the test does not need @types/node.
declare const process: { env: Record<string, string | undefined> };

const SHELVES: [SlotId, readonly string[]][] = [
  ['finish', FINISH_IDS], ['decal', DECAL_IDS], ['tyre', TYRE_IDS], ['rim', RIM_IDS], ['steer', STEER_IDS], ['lamp', LAMP_IDS],
  ['beam', BEAM_IDS], ['spoiler', SPOILER_IDS], ['seat', SEAT_IDS], ['ornament', ORNAMENT_IDS], ['extra', EXTRA_IDS],
  ['grille', GRILLE_IDS], ['bumper', BUMPER_IDS], ['canopy', CANOPY_IDS], ['mirror', MIRROR_IDS], ['exhaust', EXHAUST_IDS],
  ['horn', HORN_IDS],
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

  it('every product has a unique id on its shelf', () => {
    for (const [slot] of SHELVES) {
      const ids = modsIn(slot).map((d) => d.id);
      expect(new Set(ids).size, slot).toBe(ids.length);
    }
  });

  // The prefab parts are built by other workers in packages/prefabs, so this check fails until they all land.
  // Set GLAZE_ALLOW_MISSING_PREFABS=1 to skip it while they are in progress; the planner runs it without the variable at the end.
  it.skipIf(Boolean(process.env.GLAZE_ALLOW_MISSING_PREFABS))('every product prefab is `glaze-<slot>-<id>` and exists in the prefab library', () => {
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
