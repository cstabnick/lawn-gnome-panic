// Wheels: new tyres and rims in place of a prefab's own, wheel size, and camber.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { TyreId, Loadout, VehicleMounts } from './types';

export interface WheelResult {
  /** Mean extra tyre radius over stock, prefab units (+ for bigger wheels, - for smaller): the body shell is lifted by this much so the bigger tyre does not sink. */
  lift: number;
  /** Wheel pivots found (by index 0..3), after the swap. */
  wheels: (THREE.Object3D | undefined)[];
  /** Objects to spin by update(dt) (the 'spinner' rim's blades), each with its own spin rate rad/s. */
  spinners: { object: THREE.Object3D; rate: number }[];
}

/** Tyre width as a multiple of the wheel's stock width. */
export const TYRE_WIDTH: Record<TyreId, number> = {
  stock: 1, fat: 1.7, slim: 0.55, whitewall: 1, knobbly: 1.3, cart: 0.5, saucer: 1.5,
};

/** Rim diameter as a fraction of the tyre diameter. */
export const RIM_FRACTION = 0.62;

const SPINNER_RATE = 6;

/** What a wheel pivot looked like before any glaze was applied. */
interface WheelStock {
  radius: number;
  width: number;
  y: number;
}

let fallbackTyreGeometry: THREE.CylinderGeometry | undefined;
let fallbackTyreMaterial: THREE.MeshStandardMaterial | undefined;

function fallbackTyre(): THREE.Mesh {
  if (!fallbackTyreGeometry) {
    fallbackTyreGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
    fallbackTyreGeometry.rotateZ(Math.PI / 2);
  }
  if (!fallbackTyreMaterial) fallbackTyreMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const mesh = new THREE.Mesh(fallbackTyreGeometry, fallbackTyreMaterial);
  mesh.castShadow = true;
  return mesh;
}

/** Union of every mesh's bounding box under `obj`, in `obj`'s local space. */
function unionBox(obj: THREE.Object3D, parent: THREE.Matrix4, out: THREE.Box3): void {
  for (const child of obj.children) {
    if (child.userData.glaze) continue;
    child.updateMatrix();
    const m = new THREE.Matrix4().multiplyMatrices(parent, child.matrix);
    const geometry = (child as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (geometry.boundingBox) out.union(geometry.boundingBox.clone().applyMatrix4(m));
    }
    unionBox(child, m, out);
  }
}

function measureStock(group: THREE.Object3D): WheelStock {
  const box = new THREE.Box3().makeEmpty();
  unionBox(group, new THREE.Matrix4(), box);
  const size = box.getSize(new THREE.Vector3());
  return { radius: Math.max(size.y, size.z) / 2, width: size.x, y: group.position.y };
}

/** Put the original children back and remove the glaze holder (the wheel is stock again). */
function restoreStock(group: THREE.Object3D, stock: WheelStock): void {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    if (child.userData.glaze) group.remove(child);
    else child.visible = true;
  }
  group.position.y = stock.y;
}

/** Build the glaze holder: the new tyre and rim, sized to radius R and width Wd. */
function buildHolder(loadout: Loadout, R: number, Wd: number, side: 1 | -1, spinners: WheelResult['spinners']): THREE.Group {
  const holder = new THREE.Group();
  holder.name = 'glaze-wheel';
  holder.userData.glaze = true;

  const tyreHolder = new THREE.Group();
  tyreHolder.scale.set(Wd, 2 * R, 2 * R);
  if (getPrefab(`glaze-tyre-${loadout.tyre}`)) {
    const inner = buildPrefab(`glaze-tyre-${loadout.tyre}`);
    inner.position.set(0, -0.5, 0);
    inner.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    tyreHolder.add(inner);
  } else {
    tyreHolder.add(fallbackTyre());
  }
  holder.add(tyreHolder);

  if (getPrefab(`glaze-rim-${loadout.rim}`)) {
    const rimHolder = new THREE.Group();
    rimHolder.scale.set(Wd * 0.9, 2 * R * RIM_FRACTION, 2 * R * RIM_FRACTION);
    const rim = buildPrefab(`glaze-rim-${loadout.rim}`, { tint: loadout.rimColor });
    rim.position.set(0, -0.5, 0);
    rim.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    rimHolder.add(rim);
    holder.add(rimHolder);
    if (loadout.rim === 'spinner') spinners.push({ object: rimHolder, rate: SPINNER_RATE });
  }

  if (side === -1) holder.rotation.y = Math.PI;
  return holder;
}

/**
 * For each `mounts.wheels` entry whose pivot group exists under `root` and still has its original tyre parts (a wheel a damage stage removed stays removed): measure its radius (half the bounding-box height) and width (bounding-box x size),
 * and, unless tyre, rim and wheelSize are all stock, replace its children with the new tyre (prefab `glaze-tyre-<id>`, falls back to the original for 'stock') and rim (`glaze-rim-<id>`, tinted rimColor), sized to radius * wheelSize.
 * Raise each wheel pivot's y by its own radius change so the tyre bottom stays on the ground. Idempotent: calling twice gives the same result (it must recognise its own earlier output).
 * With everything stock it changes nothing and returns lift 0.
 */
export function applyWheels(root: THREE.Object3D, mounts: VehicleMounts, loadout: Loadout): WheelResult {
  const result: WheelResult = { lift: 0, wheels: [], spinners: [] };
  const custom = loadout.tyre !== 'stock' || loadout.rim !== 'stock' || loadout.wheelSize !== 1;
  let liftSum = 0;
  let liftCount = 0;

  for (const w of mounts.wheels) {
    const group = root.getObjectByName(w.pivot);
    if (!group) continue;
    result.wheels[w.index] = group;

    if (!group.userData.glazeStock) {
      if (group.children.length === 0) continue; // a removed wheel stays removed
      group.userData.glazeStock = measureStock(group);
    }
    const stock = group.userData.glazeStock as WheelStock;
    if (group.children.length === 0) continue;

    if (!custom) {
      restoreStock(group, stock);
      continue;
    }

    // Custom: hide the original parts, drop any earlier holder, add the new tyre and rim.
    for (const child of group.children) if (!child.userData.glaze) child.visible = false;
    for (let i = group.children.length - 1; i >= 0; i--) {
      if (group.children[i].userData.glaze) group.remove(group.children[i]);
    }
    const R = stock.radius * loadout.wheelSize;
    const Wd = stock.width * TYRE_WIDTH[loadout.tyre];
    group.add(buildHolder(loadout, R, Wd, w.side === -1 ? -1 : 1, result.spinners));
    group.position.y = stock.y + (R - stock.radius);
    liftSum += R - stock.radius;
    liftCount++;
  }

  result.lift = liftCount > 0 ? liftSum / liftCount : 0;
  return result;
}

/**
 * Set a wheel's rotation: `spin` about its axle (x), `steer` yaw about the vertical (front wheels; pass 0 for rear), then `camber` about the forward axis (z), in RADIANS.
 * Sets rotation.order to 'ZYX' and flips the camber's sign for a wheel on the right (-x) side so a NEGATIVE camber always leans the tops of both wheels IN. Replaces the game's `wheel.rotation.set(spin, steer, 0, 'YXZ')`.
 */
export function setWheelPose(wheel: THREE.Object3D, spin: number, steer: number, camber: number): void {
  // Rz(a) moves the top (0,1,0) to (-sin a, cos a, 0). A left wheel (+x) must move its top toward x = 0 (a > 0 for a negative camber),
  // a right wheel (-x) must move it toward 0 as well (a < 0). So the z angle is -side * camber.
  const side = wheel.position.x < 0 ? -1 : 1;
  wheel.rotation.order = 'ZYX';
  wheel.rotation.set(spin, steer, -side * camber);
}
