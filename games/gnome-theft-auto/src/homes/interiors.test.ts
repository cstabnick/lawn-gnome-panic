// The two walkable homes (E10): registered, and each builds with enough dressing and one resident.
import { describe, expect, it } from 'vitest';
import './interiors';
import { interiorById } from '../interiors/registry';
import { createKit } from '../interiors/kit';

describe('home interiors', () => {
  for (const id of ['townhouse-404', 'diggs-bungalow']) {
    it(`${id} is registered and builds with a resident`, () => {
      const placed = interiorById(id);
      expect(placed).toBeDefined();
      const { kit, build } = createKit(placed!);
      placed!.def.build(kit);
      expect(build.boxes.length).toBeGreaterThanOrEqual(12);
      expect(build.npcs).toHaveLength(1);
      expect(build.exitDoor).not.toBeNull();
      expect(placed!.def.locked).toBeUndefined();
    });
  }
});
