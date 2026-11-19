// Bowling's gnome model: the shared @lawn/gnome model, with two alley rules applied to every gnome in the game.
//  - Cosmetic gear is taken off while bowling (the customizer's head, back, neck and hand items are hidden).
//  - Everyone wears bowling shoes (the red and blue rental pair from @lawn/prefabs) over their boots.
import * as THREE from 'three';
import { createGnomeModel as createSharedGnomeModel, type EquipSlot, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { buildPrefab, getPrefab, type Part } from '@lawn/prefabs';

export { createGnome } from '@lawn/gnome';
export type { GnomeModel } from '@lawn/gnome';

const SHOE_ID = 'bowling-shoes';
const ALL_GEAR_SLOTS: readonly EquipSlot[] = ['head', 'back', 'neck', 'hand'];
/** Foot position inside a leg pivot (model.ts makeLeg): the boot's bottom sits at y -0.32, the boot box is centred at z 0.03. */
const SHOE_AT = new THREE.Vector3(0, -0.32, 0.03);
/** The gnome's boot box is the child of each leg pivot below the knee (model.ts makeLeg); the shoe replaces it. */
const BOOT_BELOW_Y = -0.2;

const centredPart = (p: Part): Part => ({ ...p, mirror: false, at: p.at ? [0, p.at[1], p.at[2]] : undefined });

/**
 * One shoe of the pair. The prefab's parts are mirrored to make a pair, so the parts are unmirrored and centred on x = 0
 * here: each leg gets its own shoe and the shoes swing with the legs.
 */
function buildOneShoe(): THREE.Group {
  const def = getPrefab(SHOE_ID);
  if (!def) throw new Error(`Unknown prefab: ${SHOE_ID}`);
  return buildPrefab({
    ...def,
    parts: def.parts.map(centredPart),
  });
}

/** Puts a bowling shoe on each foot and hides the boot box under it. */
function wearBowlingShoes(model: GnomeModel): void {
  const legs = model.legs;
  if (!legs) return;
  for (const leg of [legs.left, legs.right]) {
    for (const child of leg.children) {
      if (child instanceof THREE.Mesh && child.position.y < BOOT_BELOW_Y) child.visible = false;
    }
    const shoe = buildOneShoe();
    shoe.position.copy(SHOE_AT);
    leg.add(shoe);
  }
}

/** A gnome for the bowling alley: no cosmetic gear while bowling, and bowling shoes on both feet. */
export function createGnomeModel(look: GnomeLook): GnomeModel {
  const model = createSharedGnomeModel(look, { overrideEquipment: ALL_GEAR_SLOTS });
  wearBowlingShoes(model);
  return model;
}
