import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { GUN_ORDER } from './config';
import { GUN_MODS, type GunLoadout } from './gunMods';
import { buildModdedGun } from './gunRig';

function firstMesh(root: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | undefined;
  root.traverse((o) => {
    if (!found && o instanceof THREE.Mesh) found = o;
  });
  if (!found) throw new Error('no mesh in holder');
  return found;
}

/** The first mesh's colour, and its first vertex colour when the geometry has one. */
function colourOf(root: THREE.Object3D): { color: number; vertex: number[] | null } {
  const m = firstMesh(root);
  const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
  const attr = m.geometry.getAttribute('color');
  return {
    color: mat.color.getHex(),
    vertex: attr ? [attr.getX(0), attr.getY(0), attr.getZ(0)] : null,
  };
}

describe('buildModdedGun', () => {
  it('builds every gun with every mod that fits it, one at a time', () => {
    for (const gun of GUN_ORDER) {
      for (const mod of GUN_MODS.filter((m) => m.guns.includes(gun))) {
        const l: GunLoadout = {};
        l[mod.slot] = mod.id;
        const holder = buildModdedGun(gun, l);
        if (mod.prefab && getPrefab(mod.prefab)) {
          expect(holder.getObjectByName('mod-' + mod.slot), `${gun} + ${mod.id}`).toBeDefined();
        }
      }
    }
  });

  it('hides the SMG magazine only when the extended mag prefab exists', () => {
    const holder = buildModdedGun('smg', { mag: 'extended-mag' });
    const mag = holder.getObjectByName('mag');
    expect(mag).toBeDefined();
    if (getPrefab('gunmod-extended-mag')) expect(mag?.visible).toBe(false);
    else expect(mag?.visible).toBe(true);
  });

  it('does not leak a finish into later stock builds', () => {
    const before = colourOf(buildModdedGun('pistol', {}));
    const gilded = colourOf(buildModdedGun('pistol', { finish: 'gilded' }));
    const after = colourOf(buildModdedGun('pistol', {}));
    expect(gilded).not.toEqual(before);
    expect(after).toEqual(before);
  });

  it('applies opts.scale to the holder', () => {
    expect(buildModdedGun('pistol', {}, { scale: 6 }).scale.x).toBe(6);
  });
});
