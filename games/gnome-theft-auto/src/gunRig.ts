// The held gun with its Ammu-Gnation mods bolted on: a small "loadout on a prefab" helper, like @lawn/glaze's attachLoadout
// for vehicles. Each mod is its own @lawn/prefabs part placed at one of the gun's mount points; the finish re-glazes the
// gun's own parts.
import * as THREE from 'three';
import { buildHeld, buildPrefab, getPrefab } from '@lawn/prefabs';
import { GUNS } from './config';
import { getMod, normalizeGunLoadout, type FinishDef, type GunLoadout } from './gunMods';
import type { GunKind } from './types';

/** Each aligned side sinks this far into the gun, so no faces sit exactly on the gun's faces. */
const EMBED = 0.004;
const DEG = Math.PI / 180;

type Axis = 'x' | 'y' | 'z';
type Align = Partial<Record<Axis, 'min' | 'max'>>;
/** `rot` turns the bolted-on part (DEGREES, x then y then z) before it is placed. */
interface Mount { at: [number, number, number]; align: Align; hides?: string[]; rot?: [number, number, number] }
type MountSlot = 'muzzle' | 'barrel' | 'optic' | 'under' | 'mag' | 'stock' | 'charm';

/**
 * Mounts in prefab coordinates of each gun. The gun frame: +y is the muzzle (forward), -z is the gun's top, +z is its
 * underside (grip and magazine hang there), -y is the back (the stock).
 */
const MOUNTS: Partial<Record<GunKind, Partial<Record<MountSlot, Mount>>>> = {
  pistol: {
    muzzle: { at: [0, 0.26, -0.045], align: { y: 'min' } }, barrel: { at: [0, 0.26, -0.045], align: { y: 'min' } },
    optic: { at: [0, 0.1, -0.07], align: { z: 'max' } },
    under: { at: [0, 0.16, -0.01], align: { z: 'min' } },
    mag: { at: [0, 0.04, 0.11], align: { z: 'min' }, rot: [-90, 0, 0] },
    stock: { at: [0, 0, -0.04], align: { y: 'max' }, rot: [-90, 0, 0] },
    charm: { at: [0.0225, 0.04, 0.08], align: { x: 'min' } },
  },
  smg: {
    muzzle: { at: [0, 0.47, -0.05], align: { y: 'min' } }, barrel: { at: [0, 0.47, -0.05], align: { y: 'min' } },
    optic: { at: [0, 0.21, -0.085], align: { z: 'max' } },
    under: { at: [0, 0.37, -0.037], align: { z: 'min' } },
    mag: { at: [0, 0.25, -0.005], align: { z: 'min' }, rot: [-90, 0, 0], hides: ['mag'] },
    stock: { at: [0, 0.11, -0.045], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] },
    charm: { at: [0.0225, 0.16, 0.08], align: { x: 'min' } },
  },
  shotgun: {
    muzzle: { at: [0, 0.83, -0.06], align: { y: 'min' } }, barrel: { at: [0, 0.83, -0.06], align: { y: 'min' } },
    optic: { at: [0, 0.24, -0.09], align: { z: 'max' } },
    under: { at: [0, 0.6, -0.009], align: { z: 'min' } },
    mag: { at: [0, 0.27, 0.0], align: { z: 'min' }, rot: [-90, 0, 0] },
    stock: { at: [0, 0.17, -0.04], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] },
    charm: { at: [0.0225, 0.2, 0.08], align: { x: 'min' } },
  },
  rifle: {
    muzzle: { at: [0, 0.93, -0.055], align: { y: 'min' } }, barrel: { at: [0, 0.93, -0.055], align: { y: 'min' } },
    optic: { at: [0, 0.25, -0.1], align: { z: 'max' }, hides: ['scope', 'scope-lens', 'scope-base'] },
    under: { at: [0, 0.45, -0.015], align: { z: 'min' } },
    mag: { at: [0, 0.29, 0.0], align: { z: 'min' }, rot: [-90, 0, 0], hides: ['mag'] },
    stock: { at: [0, 0.17, -0.04], align: { y: 'max' }, rot: [-90, 0, 0], hides: ['stock'] },
    charm: { at: [0.0225, 0.21, 0.08], align: { x: 'min' } },
  },
};

/** Placement order: the barrel first, because it moves the muzzle point. */
const PLACE_ORDER: MountSlot[] = ['barrel', 'muzzle', 'optic', 'under', 'mag', 'stock', 'charm'];
const AXES: readonly Axis[] = ['x', 'y', 'z'];

/** The mount for a slot: the table entry, or one worked out from the gun's own bounding box `bb`. */
function mountFor(gun: GunKind, slot: MountSlot, bb: THREE.Box3): Mount {
  const table = MOUNTS[gun]?.[slot];
  if (table) return table;
  const h = bb.max.y - bb.min.y;
  const cx = (bb.min.x + bb.max.x) / 2;
  const cz = (bb.min.z + bb.max.z) / 2;
  switch (slot) {
    case 'muzzle':
    case 'barrel':
      return { at: [cx, bb.max.y, cz], align: { y: 'min' } };
    case 'optic':
      return { at: [cx, bb.min.y + 0.55 * h, bb.min.z], align: { z: 'max' } };
    case 'charm':
      return { at: [bb.max.x, bb.min.y + 0.25 * h, cz], align: { x: 'min' } };
    default:
      return { at: [cx, bb.min.y + 0.4 * h, bb.max.z], align: { z: 'min' } };
  }
}

/**
 * Move `part` (built at the origin) so its aligned sides sit at the mount point. Returns its box in the same frame
 * after the move.
 */
function placeAt(part: THREE.Object3D, mount: Mount): THREE.Box3 {
  const pb = new THREE.Box3().setFromObject(part);
  const shift = new THREE.Vector3();
  AXES.forEach((axis, i) => {
    const side = mount.align[axis];
    const at = mount.at[i];
    if (side === 'min') shift[axis] = at - EMBED - pb.min[axis];
    else if (side === 'max') shift[axis] = at + EMBED - pb.max[axis];
    else shift[axis] = at - (pb.min[axis] + pb.max[axis]) / 2;
  });
  part.position.add(shift);
  return pb.translate(shift);
}

/** A part of the gun itself (not a bolted-on mod), found by name. */
function findOwn(root: THREE.Object3D, name: string): THREE.Object3D | null {
  for (const c of root.children) {
    if (c.name.startsWith('mod-')) continue;
    if (c.name === name) return c;
    const found = findOwn(c, name);
    if (found) return found;
  }
  return null;
}

/**
 * Re-glaze the gun's own meshes. Every material and any vertex colours are cloned first, so the shared cached
 * geometry and material are never touched.
 */
function applyFinish(root: THREE.Object3D, fin: FinishDef): void {
  const target = new THREE.Color(fin.color);
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const isArray = Array.isArray(o.material);
    const mats = (isArray ? (o.material as THREE.Material[]) : [o.material as THREE.Material]).map((m) => m.clone());
    const vertexTinted = mats.some((m) => m.vertexColors) && !!o.geometry.getAttribute('color');
    if (vertexTinted) {
      o.geometry = o.geometry.clone();
      const attr = o.geometry.getAttribute('color') as THREE.BufferAttribute;
      const c = new THREE.Color();
      for (let i = 0; i < attr.count; i++) {
        c.setRGB(attr.getX(i), attr.getY(i), attr.getZ(i));
        c.lerp(target, fin.mix);
        attr.setXYZ(i, c.r, c.g, c.b);
      }
      attr.needsUpdate = true;
    }
    for (const m of mats) {
      const cm = m as THREE.MeshStandardMaterial;
      if (!vertexTinted && cm.color) cm.color.lerp(target, fin.mix);
      if (m instanceof THREE.MeshStandardMaterial) {
        m.metalness = fin.metalness;
        m.roughness = fin.roughness;
        if (fin.glow) {
          m.emissive.setHex(fin.color);
          m.emissiveIntensity = 0.55;
        }
      }
    }
    o.material = isArray ? mats : mats[0];
  });
}

/**
 * Build `gun` as buildHeld does (a holder group, grip at the origin, muzzle toward +y) with every mod of `loadout` bolted on
 * and its finish applied. Mods whose prefab is missing, or that do not fit the gun, are skipped; it never throws for a mod.
 * `opts.scale` scales the whole holder (the shop's display gun is drawn big).
 */
export function buildModdedGun(gun: GunKind, loadout: GunLoadout, opts: { scale?: number } = {}): THREE.Group {
  const holder = buildHeld(GUNS[gun].prefab);
  // buildHeld puts the prefab group first; everything below is added to it, in prefab coordinates.
  const inner = holder.children[0] as THREE.Group;
  const l = normalizeGunLoadout(gun, loadout);

  // Finish first, so it only touches the gun's own parts.
  const fin = getMod(l.finish)?.finish;
  if (fin) applyFinish(inner, fin);

  // The gun's own box in prefab coordinates (inner is only translated by the grip), measured before any mod is added.
  const bb = new THREE.Box3().setFromObject(inner).translate(inner.position.clone().negate());

  let barrelMuzzle: Mount | null = null;
  let placedMuzzle: [number, number, number] | null = null;
  for (const slot of PLACE_ORDER) {
    const mod = getMod(l[slot]);
    if (!mod?.prefab || !getPrefab(mod.prefab)) continue;
    const mount: Mount = slot === 'muzzle' && barrelMuzzle ? barrelMuzzle : mountFor(gun, slot, bb);

    const part = buildPrefab(mod.prefab);
    if (mount.rot) part.rotation.set(mount.rot[0] * DEG, mount.rot[1] * DEG, mount.rot[2] * DEG);
    const h = new THREE.Group();
    h.name = 'mod-' + slot;
    h.add(part);
    const placed = placeAt(part, mount);
    inner.add(h);

    // A fitted barrel moves the muzzle point to the top of the placed barrel.
    if (slot === 'barrel') {
      const muzzle = mountFor(gun, 'muzzle', bb);
      barrelMuzzle = { ...muzzle, at: [mount.at[0], placed.max.y, mount.at[2]] };
    }
    // A fitted muzzle part is the new front of the gun.
    if (slot === 'muzzle') placedMuzzle = [mount.at[0], placed.max.y, mount.at[2]];

    // Hide the gun's own parts this mod replaces.
    for (const name of mount.hides ?? []) {
      const own = findOwn(inner, name);
      if (own) own.visible = false;
    }
  }

  // The muzzle point, in holder-local coordinates (inner is translated by -grip, so add its position back in).
  const muzzleP = placedMuzzle ?? barrelMuzzle?.at ?? mountFor(gun, 'muzzle', bb).at;
  holder.userData.muzzle = [
    muzzleP[0] + inner.position.x,
    muzzleP[1] + inner.position.y,
    muzzleP[2] + inner.position.z,
  ];
  holder.userData.gunLoadout = l;
  if (opts.scale && opts.scale !== 1) holder.scale.setScalar(opts.scale);
  return holder;
}
