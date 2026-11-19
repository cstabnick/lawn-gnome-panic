// Neck gear must not clip into the gnome's head or face. Run: npm test -w packages/gnome
// If this fails, the message names the item and the feature it hits. Move the gear's parts in its prefab
// (packages/prefabs/src/catalog/), keeping its lowest point at y 0.
import { describe, expect, it } from 'vitest';
import { allPrefabs, type PrefabDef } from '@lawn/prefabs';
import { gearClearance, MIN_GEAR_GAP } from './gear-clearance';

const neckGear = allPrefabs().filter((p) => p.uses.includes('wear-neck'));

describe('neck gear clearance', () => {
  it('finds neck gear to check', () => {
    expect(neckGear.length).toBeGreaterThan(0);
  });

  for (const p of neckGear) {
    it(`${p.id} stays outside the head and face`, () => {
      const { gap, against } = gearClearance(p.id);
      expect(gap, `${p.id} is ${gap.toFixed(3)} from the ${against}`).toBeGreaterThanOrEqual(MIN_GEAR_GAP);
    });
  }

  it('catches a collar that sits at head height (self-test of the checker)', () => {
    // The caddie towel as it was before the fix: a loop at head height, which clips into the face.
    const bad: PrefabDef = {
      id: 'test-head-collar',
      name: 'Head Collar',
      category: 'armor',
      uses: ['wear-neck'],
      tags: [],
      emoji: [],
      about: 'Test fixture.',
      examine: ['Test fixture.'],
      parts: [{ s: 'ring', d: [0.13, 0.028], at: [0, 0.21, -0.04], rot: [90, 0, 0], c: 'white' }],
    };
    expect(gearClearance(bad).gap).toBeLessThan(0);
  });
});
