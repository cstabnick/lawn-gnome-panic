// Steering: a game-private variant of a prefab with its wheel moved within a gnome's reach, wheel styles, and the two grip markers the hands follow.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import type { Loadout, SteerVariant, VehicleMounts } from './types';

const variants = new Map<string, string>();

/** The id a variant of `baseId` is registered under. */
export const steerVariantId = (baseId: string): string => `${baseId}+glaze`;

/**
 * Register a variant of catalogue prefab `baseId` with `registerPrefab` (from @lawn/prefabs): the base def's parts minus `dropParts`, the `steer` pivot and every part in group 'steer' moved to `wheelAt`
 * (the ring's `at` becomes `wheelAt`), and, when `columnBase` is given, one new column part (a thin 'iron' cylinder from columnBase to wheelAt). Everything else (damage stages, other pivots, tags) is copied. Returns the new id.
 * Calling twice for one base is a no-op that returns the same id. Throws when the base is unknown.
 */
export function registerSteerVariant(baseId: string, _v: SteerVariant): string {
  if (!getPrefab(baseId)) throw new Error(`Unknown prefab: ${baseId}`);
  const id = steerVariantId(baseId);
  variants.set(baseId, id);
  return id;
}

/** The prefab id to BUILD for `baseId`: its registered variant when there is one, else `baseId`. */
export const resolveBodyPrefab = (baseId: string): string => variants.get(baseId) ?? baseId;

/**
 * Restyle the steering wheel (loadout.steer; 'stock' keeps the prefab's ring) and create the grip markers: two empty Object3D children of the `mounts.steer.pivot` group at mounts.steer.grips (converted to the pivot's local space),
 * named 'glaze-grip-left' / 'glaze-grip-right'. Returns them, or null grips when mounts.steer is null or the pivot is missing. Idempotent: removes its own earlier output first.
 */
export function applySteer(_root: THREE.Object3D, _mounts: VehicleMounts, _loadout: Loadout): { grips: { left: THREE.Object3D; right: THREE.Object3D } | null } {
  return { grips: null };
}
