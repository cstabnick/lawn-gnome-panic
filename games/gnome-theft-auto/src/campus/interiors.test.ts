import { beforeEach, describe, expect, it } from 'vitest';
import { clearRooftops, landingPads, rooftopById } from '../interiors/rooftops';
import { interiorById } from '../interiors/registry';
import { createKit } from '../interiors/kit';
import { addCampusRooftops } from './interiors';
import { ROOTWELL_ROOMS } from './types';

describe('campus interiors', () => {
  for (const id of ['uni-library', 'uni-lab', 'uni-lecture'] as const) {
    it(`${id} is defined and builds`, () => {
      const placed = interiorById(id);
      expect(placed).toBeDefined();
      const { kit, build } = createKit(placed!);
      expect(() => placed!.def.build(kit)).not.toThrow();
      expect(build.exitDoor).not.toBeNull();
    });
  }

  it('keeps the quest spots clear', () => {
    const near = (id: 'uni-library', p: readonly [number, number]) => {
      const placed = interiorById(id)!;
      const { kit, build } = createKit(placed);
      placed.def.build(kit);
      return build.boxes.filter((b) => p[0] > b.minX - 1.2 && p[0] < b.maxX + 1.2 && p[1] > b.minZ - 1.2 && p[1] < b.maxZ + 1.2
        && b.maxX - b.minX < 20 && b.maxZ - b.minZ < 15);
    };
    expect(near('uni-library', ROOTWELL_ROOMS['uni-library'].essayDesk)).toHaveLength(0);
  });
});

describe('campus rooftops', () => {
  beforeEach(() => clearRooftops());

  it('registers both roofs and the helipad', () => {
    addCampusRooftops();
    expect(rooftopById('plumbob-roof')?.pad).toBeDefined();
    expect(rooftopById('tilth-roof')).toBeDefined();
    expect(landingPads().some((p) => p.id === 'plumbob-roof')).toBe(true);
  });
});
