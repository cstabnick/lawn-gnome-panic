import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, toModelLook } from '@lawn/gnome';
import { createGnomeModel } from './gnome';

/** The gnome with a customizer head item equipped, as a player's saved gnome looks. */
function equippedGnome() {
  return createGnomeModel(toModelLook({ ...DEFAULT_LOOK, equipment: { head: 'pointy-hat', hand: 'caddie-bag' } }));
}

function prefabNodes(root: THREE.Object3D, id: string): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.userData.prefab === id) out.push(o);
  });
  return out;
}

describe('bowling gnome', () => {
  it('hides the customizer gear while bowling', () => {
    const model = equippedGnome();
    const gear = [...prefabNodes(model.rig, 'pointy-hat'), ...prefabNodes(model.rig, 'caddie-bag')];
    expect(gear.length).toBeGreaterThan(0);
    for (const node of gear) expect(node.visible).toBe(false);
  });

  it('puts one bowling shoe on each foot, and hides the boot under it', () => {
    const model = equippedGnome();
    expect(model.legs).toBeDefined();
    for (const leg of [model.legs!.left, model.legs!.right]) {
      const shoes = leg.children.filter((c) => c.userData.prefab === 'bowling-shoes');
      expect(shoes).toHaveLength(1);
      const boots = leg.children.filter((c) => c instanceof THREE.Mesh && c.position.y < -0.2);
      expect(boots.length).toBeGreaterThan(0);
      for (const boot of boots) expect(boot.visible).toBe(false);
    }
  });

  it('gives a shoe to a gnome with no gear too', () => {
    const model = createGnomeModel(toModelLook(DEFAULT_LOOK));
    expect(prefabNodes(model.object, 'bowling-shoes')).toHaveLength(2);
  });
});
