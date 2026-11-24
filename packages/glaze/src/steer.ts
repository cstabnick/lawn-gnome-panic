// Steering: a game-private variant of a prefab with its wheel moved within a gnome's reach, wheel styles, and the two grip markers the hands follow.
import * as THREE from 'three';
import { buildPrefab, getPrefab, pivotAt, pivotParent, registerPrefab } from '@lawn/prefabs';
import type { Part, PivotDef, PrefabDef, Vec3 } from '@lawn/prefabs';
import type { Loadout, SteerId, SteerVariant, VehicleMounts } from './types';

const variants = new Map<string, string>();

/** Grip radius per wheel style, in prefab units for a 1.2-wide vehicle. 'stock' uses the prefab's own grips. */
const STEER_STYLES: Record<SteerId, { gripRadius: number }> = {
  stock: { gripRadius: 0 },
  racing: { gripRadius: 0.17 },
  banjo: { gripRadius: 0.2 },
  donut: { gripRadius: 0.19 },
  daisy: { gripRadius: 0.2 },
  pretzel: { gripRadius: 0.2 },
  ship: { gripRadius: 0.2 },
  heart: { gripRadius: 0.19 },
  square: { gripRadius: 0.18 },
  sprocket: { gripRadius: 0.2 },
};

/** The id a variant of `baseId` is registered under. */
export const steerVariantId = (baseId: string): string => `${baseId}+glaze`;

/**
 * Register a variant of catalogue prefab `baseId` with `registerPrefab` (from @lawn/prefabs): the base def's parts minus `dropParts`, the `steer` pivot and every part in group 'steer' moved to `wheelAt`
 * (the ring's `at` becomes `wheelAt`), and, when `columnBase` is given, one new column part (a thin 'iron' cylinder from columnBase to wheelAt). Everything else (damage stages, other pivots, tags) is copied. Returns the new id.
 * Calling twice for one base is a no-op that returns the same id. Throws when the base is unknown.
 */
export function registerSteerVariant(baseId: string, v: SteerVariant): string {
  const known = variants.get(baseId);
  if (known) return known;
  const base = getPrefab(baseId);
  if (!base) throw new Error(`Unknown prefab: ${baseId}`);
  const id = steerVariantId(baseId);
  const pivotName = v.pivot ?? 'steer';
  const oldDef = base.pivots?.[pivotName];
  const old = oldDef ? pivotAt(oldDef) : undefined;
  const delta: Vec3 = old
    ? [v.wheelAt[0] - old[0], v.wheelAt[1] - old[1], v.wheelAt[2] - old[2]]
    : [v.wheelAt[0], v.wheelAt[1], v.wheelAt[2]];
  const drop = new Set(v.dropParts);
  // Plain parts that become (or move with) the control: by (wheelAt - from) when the base has no such pivot, else with the pivot.
  const joins = new Set(v.groupParts ?? []);
  const moves = new Set(v.moveParts ?? []);
  const from = v.from ?? v.wheelAt;
  const shift: Vec3 = old ? delta : [v.wheelAt[0] - from[0], v.wheelAt[1] - from[1], v.wheelAt[2] - from[2]];
  const moved = (p: Part, d: Vec3): Part => {
    const [x, y, z] = p.at ?? [0, 0, 0];
    return { ...p, at: [x + d[0], y + d[1], z + d[2]] };
  };
  const parts: Part[] = [];
  base.parts.forEach((p, i) => {
    if (drop.has(i)) return;
    if (joins.has(i)) parts.push({ ...moved(p, shift), group: pivotName });
    else if (moves.has(i)) parts.push(moved(p, shift));
    else if (p.group === pivotName) parts.push(moved(p, delta));
    else parts.push(p);
  });
  for (const p of v.addParts ?? []) parts.push({ ...p, group: pivotName });
  if (v.columnBase) {
    const [bx, by, bz] = v.columnBase;
    const [tx, ty, tz] = v.wheelAt;
    const [dx, dy, dz] = [tx - bx, ty - by, tz - bz];
    const len = Math.hypot(dx, dy, dz);
    const rx = Math.atan2(dz, dy) * (180 / Math.PI);
    const rz = -Math.atan2(dx, Math.hypot(dy, dz)) * (180 / Math.PI);
    parts.push({
      s: 'cyl',
      d: [0.02, 0.02, len],
      at: [(bx + tx) / 2, (by + ty) / 2, (bz + tz) / 2],
      rot: [rx, 0, rz],
      c: 'iron',
      seg: 6,
    });
  }
  // The moved pivot keeps its parent (if it was nested); `at` stays absolute.
  const parent = oldDef ? pivotParent(oldDef) : undefined;
  const movedPivot: PivotDef = parent === undefined ? v.wheelAt : { at: v.wheelAt, parent };
  const def: PrefabDef = {
    ...base,
    id,
    pivots: { ...base.pivots, [pivotName]: movedPivot },
    parts,
  };
  registerPrefab(def);
  variants.set(baseId, id);
  return id;
}

/** The prefab id to BUILD for `baseId`: its registered variant when there is one, else `baseId`. */
export const resolveBodyPrefab = (baseId: string): string => variants.get(baseId) ?? baseId;

/**
 * Restyle the steering wheel (loadout.steer; 'stock' keeps the prefab's ring) and create the grip markers: two empty Object3D children of the `mounts.steer.pivot` group at mounts.steer.grips (converted to the pivot's local space),
 * named 'glaze-grip-left' / 'glaze-grip-right'. Returns them, or null grips when mounts.steer is null or the pivot is missing. Idempotent: removes its own earlier output first.
 */
export function applySteer(root: THREE.Object3D, mounts: VehicleMounts, loadout: Loadout): { grips: { left: THREE.Object3D; right: THREE.Object3D } | null } {
  const steer = mounts.steer;
  if (!steer) return { grips: null };
  const pivot = root.getObjectByName(steer.pivot);
  if (!pivot) return { grips: null };

  // Undo an earlier call: drop our own output and re-show what it hid.
  for (const child of [...pivot.children]) {
    if (child.userData.glaze) pivot.remove(child);
    else if (child.userData.glazeHidden) {
      child.visible = true;
      delete child.userData.glazeHidden;
    }
  }

  const styleId = loadout.steer;
  const styled = styleId !== 'stock' && !!getPrefab('glaze-steer-' + styleId);
  const scale = mounts.width / 1.2;

  if (!styled) {
    const p = pivot.position;
    const [l, r] = steer.grips;
    const left = new THREE.Object3D();
    const right = new THREE.Object3D();
    left.name = 'glaze-grip-left';
    right.name = 'glaze-grip-right';
    left.userData.glaze = true;
    right.userData.glaze = true;
    left.position.set(l[0] - p.x, l[1] - p.y, l[2] - p.z);
    right.position.set(r[0] - p.x, r[1] - p.y, r[2] - p.z);
    pivot.add(left, right);
    return { grips: { left, right } };
  }

  for (const child of pivot.children) {
    child.visible = false;
    child.userData.glazeHidden = true;
  }
  const holder = buildPrefab('glaze-steer-' + styleId, { tint: 0x3a2a20 });
  holder.name = 'glaze-steer';
  holder.userData.glaze = true;
  holder.position.set(0, -0.02, 0);
  holder.scale.setScalar(scale);
  pivot.add(holder);

  const gripR = STEER_STYLES[styleId].gripRadius * scale;
  const left = new THREE.Object3D();
  const right = new THREE.Object3D();
  left.name = 'glaze-grip-left';
  right.name = 'glaze-grip-right';
  left.userData.glaze = true;
  right.userData.glaze = true;
  left.position.set(gripR, 0, 0);
  right.position.set(-gripR, 0, 0);
  pivot.add(left, right);
  return { grips: { left, right } };
}
