// Renders equipped gear onto a GnomeModel using @lawn/prefabs, and exposes attachment helpers for combat effects.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { buildPrefab, getPrefab, type PrefabDef } from '@lawn/prefabs';
import { EQUIP_SLOTS, type EquipSlot, type ItemDef, type Rarity } from './config';
import { ITEMS } from './content';
import { itemPrefab } from './itemArt';

const RARITY_TINT: Partial<Record<Rarity, number>> = {
  sprouted: 0x4ea84e,
  blooming: 0x3a82d6,
  heirloom: 0x9c4dcc,
  kilnfired: 0xe0821d,
};

/** Fallback prefab ids when an item has no direct prefab match. */
function fallbackPrefabId(def: ItemDef): string | null {
  switch (def.slot) {
    case 'weapon':
      if (def.weaponClass === 'staff') return 'hazel-staff';
      if (def.weaponClass === 'wand') return 'clover-wand';
      if (def.weaponClass === 'sling') return 'twig-slingshot';
      if (def.weaponClass === 'blowpipe') return 'blowpipe';
      return def.damageType === 'crush' ? 'old-trowel' : 'iron-sword';
    case 'offhand':
      return def.armorType === 'shield' ? 'round-shield' : 'honeycomb-charm';
    case 'head':
      if (def.armorType === 'plate') return 'bucket-helm';
      if (def.armorType === 'leather') return 'acorn-cap';
      return 'pointy-hat';
    case 'body':
      if (def.armorType === 'plate') return 'keep-cuirass';
      if (def.armorType === 'leather') return 'leather-jerkin';
      return 'cloth-smock';
    case 'legs':
      return 'bark-leggings';
    case 'hands':
      return 'work-gloves';
    case 'feet':
      return 'court-boots';
    default:
      return null;
  }
}

function resolveItemPrefab(def: ItemDef): PrefabDef | undefined {
  const hit = itemPrefab(def);
  if (hit) return hit;
  const fb = fallbackPrefabId(def);
  return fb ? getPrefab(fb) : undefined;
}

function buildGearGroup(def: ItemDef): { group: THREE.Group; prefab?: PrefabDef } {
  const prefab = resolveItemPrefab(def);
  if (prefab) {
    const tint = def.rarity && def.rarity !== 'plain' ? RARITY_TINT[def.rarity] : undefined;
    const group = buildPrefab(prefab, { tint, lights: false });
    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    return { group, prefab };
  }
  // Minimal fallback for trinkets/items without a prefab.
  const group = new THREE.Group();
  const color = (def.rarity && RARITY_TINT[def.rarity]) ?? 0xd4af37;
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.06, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }),
  );
  gem.castShadow = true;
  group.add(gem);
  return { group };
}

/** Splits a mirrored pair prefab (left x > 0.02, right x < -0.02, center otherwise) into three groups. */
function splitMirroredParts(source: THREE.Group): { left: THREE.Group; right: THREE.Group; center: THREE.Group } {
  const left = new THREE.Group();
  const right = new THREE.Group();
  const center = new THREE.Group();
  for (const child of [...source.children]) {
    if (child.position.x > 0.02) left.add(child);
    else if (child.position.x < -0.02) right.add(child);
    else center.add(child);
  }
  return { left, right, center };
}

function attachWeapon(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group, prefab } = buildGearGroup(def);
  const [gx, gy, gz] = prefab?.grip ?? [0, 0.07, 0];
  group.position.set(-gx, -gy, -gz);

  const holder = new THREE.Group();
  holder.name = 'gear:weapon';
  holder.position.set(0, -0.32, 0);
  if (def.weaponClass === 'sling') {
    holder.rotation.x = 0.25;
  } else if (def.weaponClass === 'staff' || def.hands === 2) {
    holder.rotation.x = Math.PI / 2 - 0.65;
  } else if (def.weaponClass === 'blowpipe') {
    holder.rotation.x = Math.PI / 2 - 0.1;
  } else {
    holder.rotation.x = Math.PI / 2 - 0.35;
  }
  holder.add(group);
  model.arms.right.add(holder);
  return [holder];
}

function attachOffhand(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group, prefab } = buildGearGroup(def);
  const isShield = def.armorType === 'shield' || prefab?.category === 'shield';
  const [gx, gy, gz] = prefab?.grip ?? (isShield ? [0, 0.22, -0.03] : [0, 0.05, 0]);
  group.position.set(-gx, -gy, -gz);

  const holder = new THREE.Group();
  holder.name = 'gear:offhand';
  if (isShield) {
    holder.position.set(0.08, -0.24, 0.06);
    holder.rotation.y = Math.PI * 0.35;
  } else {
    holder.position.set(0, -0.32, 0.03);
    holder.rotation.x = Math.PI / 2 - 0.3;
    holder.scale.setScalar(0.85);
  }
  holder.add(group);
  model.arms.left.add(holder);
  return [holder];
}

function attachHead(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const width = Math.max(size.x, size.z);
  const scale = width > 0 && width < 0.28 ? 1.24 : 1.15;

  const holder = new THREE.Group();
  holder.name = 'gear:head';
  holder.position.set(0, 0.87, 0);
  holder.scale.setScalar(scale);
  holder.add(group);
  model.rig.add(holder);
  if (model.hat) model.hat.visible = false;
  return [holder];
}

function attachBody(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());

  const holder = new THREE.Group();
  holder.name = 'gear:body';
  if (size.z > 0 && size.z < 0.12) {
    // Flat front breastplate (e.g. bottlecap-cuirass): mount on the front of the chest.
    holder.position.set(0, 0.29, 0.2);
    holder.scale.set(1.05, 0.98, 1.05);
  } else {
    const sx = size.x > 0 ? Math.max(1.12, 0.48 / size.x) : 1.15;
    const sz = size.z > 0 ? Math.max(1.12, 0.46 / size.z) : 1.15;
    holder.position.set(0, 0.29, 0);
    holder.scale.set(sx, 0.98, sz);
  }
  holder.add(group);
  model.rig.add(holder);
  return [holder];
}

function attachLegs(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  if (!model.legs) {
    group.name = 'gear:legs';
    model.rig.add(group);
    return [group];
  }
  const { left, right, center } = splitMirroredParts(group);
  const attached: THREE.Object3D[] = [];

  if (left.children.length > 0) {
    left.name = 'gear:legs-left';
    left.position.set(-0.1, -0.32, 0);
    left.scale.set(1.08, 1, 1.08);
    model.legs.left.add(left);
    attached.push(left);
  }
  if (right.children.length > 0) {
    right.name = 'gear:legs-right';
    right.position.set(0.1, -0.32, 0);
    right.scale.set(1.08, 1, 1.08);
    model.legs.right.add(right);
    attached.push(right);
  }
  if (center.children.length > 0) {
    center.name = 'gear:legs-belt';
    center.scale.set(1.3, 1, 2.3);
    model.rig.add(center);
    attached.push(center);
  }
  return attached;
}

function attachFeet(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  if (!model.legs) {
    group.name = 'gear:feet';
    model.rig.add(group);
    return [group];
  }
  const { left, right } = splitMirroredParts(group);
  const attached: THREE.Object3D[] = [];

  if (left.children.length > 0) {
    left.name = 'gear:feet-left';
    left.position.set(-0.1, -0.32, 0);
    left.scale.set(1.12, 1.02, 1.12);
    model.legs.left.add(left);
    attached.push(left);
  }
  if (right.children.length > 0) {
    right.name = 'gear:feet-right';
    right.position.set(0.1, -0.32, 0);
    right.scale.set(1.12, 1.02, 1.12);
    model.legs.right.add(right);
    attached.push(right);
  }
  return attached;
}

function attachHands(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  const { left, right } = splitMirroredParts(group);
  const attached: THREE.Object3D[] = [];

  if (left.children.length > 0) {
    left.name = 'gear:hands-left';
    left.position.set(-0.11, -0.36, 0);
    left.scale.setScalar(0.95);
    model.arms.left.add(left);
    attached.push(left);
  }
  if (right.children.length > 0) {
    right.name = 'gear:hands-right';
    right.position.set(0.11, -0.36, 0);
    right.scale.setScalar(0.95);
    model.arms.right.add(right);
    attached.push(right);
  }
  return attached;
}

function attachTrinket(model: GnomeModel, def: ItemDef): THREE.Object3D[] {
  const { group } = buildGearGroup(def);
  const box = new THREE.Box3().setFromObject(group);
  const maxDim = Math.max(box.getSize(new THREE.Vector3()).length(), 0.1);
  const holder = new THREE.Group();
  holder.name = 'gear:trinket';
  holder.position.set(0.24, 0.35, 0.06);
  holder.scale.setScalar(Math.min(0.65, 0.18 / maxDim));
  holder.add(group);
  model.rig.add(holder);
  return [holder];
}

function attachSlot(model: GnomeModel, slot: EquipSlot, def: ItemDef): THREE.Object3D[] {
  switch (slot) {
    case 'weapon': return attachWeapon(model, def);
    case 'offhand': return attachOffhand(model, def);
    case 'head': return attachHead(model, def);
    case 'body': return attachBody(model, def);
    case 'legs': return attachLegs(model, def);
    case 'hands': return attachHands(model, def);
    case 'feet': return attachFeet(model, def);
    case 'trinket': return attachTrinket(model, def);
  }
}

export interface GearRig {
  equipped: Record<EquipSlot, string | null>;
  nodes: Map<EquipSlot, THREE.Object3D[]>;
}

export function createGearRig(): GearRig {
  const equipped = {} as Record<EquipSlot, string | null>;
  for (const slot of EQUIP_SLOTS) equipped[slot] = null;
  return { equipped, nodes: new Map() };
}

/** Updates the 3D gear attached to `model` so it matches `equipment`. Only rebuilds slots that changed. */
export function syncGear(rig: GearRig, model: GnomeModel, equipment: Record<EquipSlot, string | null>): void {
  for (const slot of EQUIP_SLOTS) {
    const nextId = equipment[slot] ?? null;
    if (rig.equipped[slot] === nextId) continue;

    const old = rig.nodes.get(slot);
    if (old) {
      for (const obj of old) obj.removeFromParent();
      rig.nodes.delete(slot);
    }
    rig.equipped[slot] = nextId;

    if (slot === 'head') {
      model.setEquipmentOverride?.('head', nextId !== null);
      if (model.hat && nextId !== null) model.hat.visible = false;
    } else if (slot === 'weapon') {
      model.setEquipmentOverride?.('hand', nextId !== null);
    } else if (slot === 'body') {
      model.setEquipmentOverrides?.({ back: nextId !== null, neck: nextId !== null });
    }

    if (nextId) {
      const def = ITEMS[nextId];
      if (def) rig.nodes.set(slot, attachSlot(model, slot, def));
    }
  }
}

/** World position of the right hand / weapon tip for spawning projectiles and spell bolts. */
export function weaponTipWorldPos(model: GnomeModel | null, fallback: THREE.Vector3): THREE.Vector3 {
  if (!model) return new THREE.Vector3(fallback.x, fallback.y + 0.7, fallback.z);
  model.object.updateMatrixWorld(true);
  const weapon = model.arms.right.getObjectByName('gear:weapon');
  if (weapon) {
    const box = new THREE.Box3().setFromObject(weapon);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      center.y = Math.max(center.y, box.max.y - 0.05);
      return center;
    }
  }
  return model.arms.right.localToWorld(new THREE.Vector3(0, -0.32, 0.1));
}
