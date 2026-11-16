import { describe, expect, it } from 'vitest';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { EQUIP_SLOTS, type EquipSlot } from './config';
import { createGearRig, syncGear } from './gear';
import { attackKindForWeapon } from './combat';
import { ITEMS } from './content';

function emptyEquipment(): Record<EquipSlot, string | null> {
  const eq = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) eq[slot] = null;
  return eq;
}

describe('gear attachment and usage', () => {
  it('attaches weapon, shield, head, body, legs, hands, feet, and trinket to the gnome model', () => {
    const model = createGnomeModel(GNORMAN_LOOK);
    const rig = createGearRig();

    syncGear(rig, model, {
      head: 'c2-bottlecap-helm',
      body: 'moss-tunic',
      legs: 'c2-bottlecap-greaves',
      hands: 'c3-clog-gloves',
      feet: 'c3-keep-boots',
      weapon: 'rusty-trowel',
      offhand: 'pot-lid',
      trinket: 'c4-riding-snail',
    });

    expect(model.hat?.visible).toBe(false);
    expect(model.arms.right.getObjectByName('gear:weapon')).toBeTruthy();
    expect(model.arms.left.getObjectByName('gear:offhand')).toBeTruthy();
    expect(model.rig.getObjectByName('gear:head')).toBeTruthy();
    expect(model.rig.getObjectByName('gear:body')).toBeTruthy();
    expect(model.rig.getObjectByName('gear:trinket')).toBeTruthy();
    expect(model.legs?.left.getObjectByName('gear:legs-left')).toBeTruthy();
    expect(model.legs?.right.getObjectByName('gear:legs-right')).toBeTruthy();
    expect(model.legs?.left.getObjectByName('gear:feet-left')).toBeTruthy();
    expect(model.legs?.right.getObjectByName('gear:feet-right')).toBeTruthy();
    expect(model.arms.left.getObjectByName('gear:hands-left')).toBeTruthy();
    expect(model.arms.right.getObjectByName('gear:hands-right')).toBeTruthy();

    // Unequipping restores the default hat and removes attached gear.
    syncGear(rig, model, emptyEquipment());
    expect(model.hat?.visible).toBe(true);
    expect(model.arms.right.getObjectByName('gear:weapon')).toBeUndefined();
    expect(model.arms.left.getObjectByName('gear:offhand')).toBeUndefined();
    expect(model.rig.getObjectByName('gear:head')).toBeUndefined();
    expect(model.rig.getObjectByName('gear:body')).toBeUndefined();
  });

  it('chooses the matching attack animation kind for each weapon class', () => {
    expect(attackKindForWeapon(ITEMS['rusty-trowel'] ?? null)).toBe('chop');
    expect(attackKindForWeapon(ITEMS['c2-hand-fork'] ?? null)).toBe('thrust');
    expect(attackKindForWeapon(ITEMS['c2-ash-slingshot'] ?? null)).toBe('ranged');
    expect(attackKindForWeapon(ITEMS['c2-hazel-staff'] ?? null)).toBe('cast');
    expect(attackKindForWeapon(ITEMS['rusty-trowel'] ?? null, true)).toBe('cast');
  });
});
