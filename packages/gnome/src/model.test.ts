import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGnomeModel } from './model';
import { GNORMAN_LOOK, type GnomeLook } from './types';

function isVisible(o: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = o;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

function findPrefabNodes(root: THREE.Object3D): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.userData?.prefab) out.push(o);
  });
  return out;
}

describe('createGnomeModel equipment overrides', () => {
  const equippedLook: GnomeLook = {
    ...GNORMAN_LOOK,
    equipment: {
      head: 'golf-visor',
      back: 'leaf-cloak',
      neck: 'ace-medallion',
      hand: 'golden-putter',
    },
  };

  it('hides cone hat when custom headgear is equipped, and shows customizer gear by default', () => {
    const model = createGnomeModel(equippedLook);
    expect(model.hat?.visible).toBe(false);
    const prefabs = findPrefabNodes(model.object);
    expect(prefabs.length).toBe(4);
    expect(prefabs.every((p) => p.visible)).toBe(true);
  });

  it('supports overrideEquipment option at creation time', () => {
    const model = createGnomeModel(equippedLook, { overrideEquipment: ['head', 'hand'] });
    // Overridden head restores the default cone hat (until the game hides it with its own helmet).
    expect(model.hat?.visible).toBe(true);
    const rigPrefabs = findPrefabNodes(model.rig);
    const handPrefabs = findPrefabNodes(model.arms.right);
    const byId = new Map(
      [...rigPrefabs, ...handPrefabs].map((p) => [p.userData.prefab as string, isVisible(p)]),
    );
    expect(byId.get('golf-visor')).toBe(false);
    expect(byId.get('golden-putter')).toBe(false);
    expect(byId.get('leaf-cloak')).toBe(true);
    expect(byId.get('ace-medallion')).toBe(true);
  });

  it('toggles overrides dynamically via setEquipmentOverride and setEquipmentOverrides', () => {
    const model = createGnomeModel(equippedLook);
    model.setEquipmentOverride?.('hand', true);
    expect(isVisible(findPrefabNodes(model.arms.right)[0]!)).toBe(false);
    expect(model.hat?.visible).toBe(false);

    model.setEquipmentOverrides?.({ head: true, back: true });
    expect(model.hat?.visible).toBe(true);
    const rigVis = new Map(findPrefabNodes(model.rig).map((p) => [p.userData.prefab as string, p.visible]));
    expect(rigVis.get('golf-visor')).toBe(false);
    expect(rigVis.get('leaf-cloak')).toBe(false);
    expect(rigVis.get('ace-medallion')).toBe(true);

    // Restoring head override hides the cone hat again and shows the custom headgear.
    model.setEquipmentOverride?.('head', false);
    expect(model.hat?.visible).toBe(false);
    expect(findPrefabNodes(model.rig).find((p) => p.userData.prefab === 'golf-visor')?.visible).toBe(true);
  });

  it('merges rigid gnome sub-assemblies into minimal draw calls while keeping animated pivots', () => {
    const countMeshes = (root: THREE.Object3D): number => {
      let n = 0;
      root.traverse((o) => { if (o instanceof THREE.Mesh) n++; });
      return n;
    };

    // Standard gnome: 2 legs + 2 arms + 1 body + 1 hat = 6 meshes total.
    const basic = createGnomeModel(GNORMAN_LOOK);
    expect(countMeshes(basic.object)).toBe(6);

    // Full-featured gnome (pigtails, freckles, glasses, dress): 6 + 2 pigtails + 1 lens mesh = 9 meshes.
    const decked = createGnomeModel({
      ...GNORMAN_LOOK,
      hair: { style: 'pigtails', color: 0xc07030 },
      freckles: true,
      glasses: true,
      dress: true,
    });
    expect(countMeshes(decked.object)).toBe(9);
  });
});
