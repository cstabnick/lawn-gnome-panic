// Puts a @lawn/prefabs item into one of the gnome's equipment slots. The model (model.ts), the clearance check
// (gear-clearance.ts) and the prefab editor (tools/prefab-editor) all place gear through here, so what the editor
// shows is what every game shows.
//
// Transform order: slot anchor (EQUIP_ANCHORS) > the prefab's `wear` offset > (hand only) the grip > the parts.
import * as THREE from 'three';
import { buildHeld, buildPrefab, getPrefab, type BuildOptions, type PrefabDef, type PrefabWear } from '@lawn/prefabs';
import { EQUIP_ANCHORS } from './anatomy';
import type { EquipSlot } from './types';

const DEG = Math.PI / 180;
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _m = new THREE.Matrix4();

/** The prefab use that makes an item fit a slot. */
export const SLOT_USE: Readonly<Record<EquipSlot, string>> = {
  head: 'wear-head',
  back: 'wear-back',
  neck: 'wear-neck',
  hand: 'hold',
};

/** The first slot this prefab fits (by its uses), or null. */
export function gearSlotFor(def: PrefabDef): EquipSlot | null {
  for (const slot of ['head', 'back', 'neck', 'hand'] as const) {
    if (def.uses.includes(SLOT_USE[slot] as never)) return slot;
  }
  return null;
}

/** The slot anchor as a matrix, in its parent's space (the rig, or the right arm pivot for 'hand'). */
export function anchorMatrix(slot: EquipSlot, out = new THREE.Matrix4()): THREE.Matrix4 {
  const a = EQUIP_ANCHORS[slot];
  _euler.set(a.rot[0] * DEG, a.rot[1] * DEG, a.rot[2] * DEG, 'XYZ');
  return out.compose(_pos.set(a.at[0], a.at[1], a.at[2]), _quat.setFromEuler(_euler), _scale.set(1, 1, 1));
}

/** A prefab's `wear` offset as a matrix in the anchor's space (identity when it has none). */
export function wearMatrix(wear: PrefabWear | undefined, out = new THREE.Matrix4()): THREE.Matrix4 {
  const at = wear?.at ?? [0, 0, 0];
  const rot = wear?.rot ?? [0, 0, 0];
  const s = wear?.scale ?? 1;
  _euler.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ');
  return out.compose(_pos.set(at[0], at[1], at[2]), _quat.setFromEuler(_euler), _scale.set(s, s, s));
}

/**
 * Builds the gear for a slot, already placed: add it to `model.rig` (head, back, neck) or `model.arms.right` (hand).
 * Held items ('hold' in uses) are built around their grip. The returned root is the node to show or hide.
 */
export function buildGear(slot: EquipSlot, idOrDef: string | PrefabDef, opts: BuildOptions = {}): THREE.Object3D {
  const def = typeof idOrDef === 'string' ? getPrefab(idOrDef) : idOrDef;
  if (!def) throw new Error(`Unknown prefab: ${String(idOrDef)}`);
  const root = slot === 'hand' && def.uses.includes('hold') ? buildHeld(def, opts) : buildPrefab(def, opts);
  // Keep any build scale (opts.scale) by folding it into the wear scale.
  const buildScale = root.scale.x;
  anchorMatrix(slot, _m).multiply(wearMatrix(def.wear));
  _m.decompose(root.position, root.quaternion, root.scale);
  root.scale.multiplyScalar(buildScale);
  root.userData.gearSlot = slot;
  return root;
}
