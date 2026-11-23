// A live Vehicle to a saved snapshot and back.
import type * as THREE from 'three';
import { decodeLoadout, encodeLoadout } from '@lawn/glaze';
import type { Vehicle } from '../types';
import { isCraftKind } from '../glazeStore';
import { applyVariant, fleetEntry } from '../fleet';
import { createVehicle, damageVehicle, setVehicleLook } from '../vehicles';
import type { StorageKind, StoredVehicle, VehicleSnapshot } from './types';

/** Which garage kind a vehicle belongs in: flyers 'air', boats 'water', everything else 'ground'. */
export function storageKindOf(v: Vehicle): StorageKind {
  return v.spec.flies ? 'air' : v.spec.boat ? 'water' : 'ground';
}

/** Why v cannot go into a `kind` garage (a short sentence for a toast), or null when it can. */
export function cannotStore(v: Vehicle, kind: StorageKind, owned: boolean): string | null {
  if (v.exploded) return 'That is a wreck. Tansy does not store wrecks.';
  if (v.sunk) return 'Get it out of the water first.';
  if (v.kind === 'tessie') return 'Tessie belongs to the loch, not to a boathouse.';
  if (v.kind === 'hoa-patrol-boat') return 'The HOA would notice their patrol boat missing.';
  if (storageKindOf(v) !== kind) {
    if (kind === 'ground') return 'The Lock-Up only takes ground vehicles.';
    if (kind === 'air') return 'The hangar only takes aircraft.';
    return 'The boathouse only takes boats.';
  }
  if (v.driver === 'remote') return 'That one belongs to another player.';
  if (v.questOwned && !owned) return 'That one is spoken for (a job or a boat on its mooring).';
  return null;
}

export function snapshotVehicle(v: Vehicle): VehicleSnapshot {
  return {
    kind: v.kind,
    variant: v.variant ?? null,
    name: v.spec.name,
    tint: v.tint,
    look: v.look ? encodeLoadout(v.look) : null,
    hp: Math.max(0.05, Math.min(1, v.hp)),
    enginePitch: v.enginePitch ?? null,
  };
}

/** Build the stored vehicle in the scene at (x, z, yaw): variant, name, paint, Glaze look, damage. Not pushed to any list. */
export function restoreVehicle(scene: THREE.Scene, rec: StoredVehicle, x: number, z: number, yaw: number): Vehicle {
  const v = createVehicle(scene, rec.kind, x, z, yaw, rec.tint);
  if (rec.variant) {
    const e = fleetEntry(rec.variant);
    if (e) applyVariant(v, e);
  }
  v.spec = { ...v.spec, name: rec.name };
  if (rec.enginePitch !== null) v.enginePitch = rec.enginePitch;
  if (rec.look && (v.rig || isCraftKind(rec.kind))) {
    const l = decodeLoadout(rec.look);
    if (l) setVehicleLook(v, l);
  }
  if (rec.hp < 1) damageVehicle(v, 1 - rec.hp);
  v.questOwned = true;
  v.waterlog = 0;
  v.waterlogStalled = false;
  return v;
}
