import { describe, expect, it } from 'vitest';
import { getPrefab, type PrefabDef } from '@lawn/prefabs';
import { EQUIP_ANCHORS } from './anatomy';
import { buildGear, gearSlotFor } from './gear';

describe('buildGear', () => {
  const hat = getPrefab('pointy-hat')!;

  it('places gear at the slot anchor', () => {
    const g = buildGear('head', hat);
    expect(g.position.toArray()).toEqual([...EQUIP_ANCHORS.head.at]);
    expect(g.scale.x).toBeCloseTo(1);
  });

  it('applies the prefab wear offset on top of the anchor', () => {
    const tuned: PrefabDef = { ...hat, wear: { at: [0, 0.05, -0.02], scale: 1.2 } };
    const g = buildGear('head', tuned);
    expect(g.position.y).toBeCloseTo(EQUIP_ANCHORS.head.at[1] + 0.05);
    expect(g.position.z).toBeCloseTo(-0.02);
    expect(g.scale.x).toBeCloseTo(1.2);
  });

  it('turns back gear round to face backwards', () => {
    const g = buildGear('back', hat);
    expect(Math.abs(g.rotation.y) + Math.abs(g.rotation.x)).toBeGreaterThan(3);
  });

  it('knows the slot from the uses', () => {
    expect(gearSlotFor(hat)).toBe('head');
  });
});
