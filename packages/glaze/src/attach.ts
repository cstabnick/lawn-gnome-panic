// attachLoadout: dress a built prefab vehicle in a Loadout and keep it dressed. The one entry point a game needs.
// STUB (see the issue that owns this file). The final version calls paintBody, applyWheels, applySteer, buildLamps, buildFittings and buildDecals.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { normalizeLoadout } from './loadout';
import { resolveBodyPrefab } from './steer';
import type { GlazeBodyOptions, GlazeRig, Loadout } from './types';

/** Largest body-shell travel for rideHeight -1 / +1, prefab units. */
export const RIDE_TRAVEL = { down: 0.14, up: 0.2 } as const;

/**
 * Build a prefab ready for a rig: the registered steer variant of `prefabId` when there is one, built at tint 0xffffff with `separateTint: true`
 * (so the rig can paint it any colour and finish without rebuilding), at `opts.scale` and `opts.damage`.
 */
export function buildGlazeBody(prefabId: string, opts: GlazeBodyOptions = {}): THREE.Group {
  return buildPrefab(resolveBodyPrefab(prefabId), { scale: opts.scale, tint: 0xffffff, separateTint: true, damage: opts.damage });
}

/**
 * Dress `root` (from buildGlazeBody) in `loadout` and return the rig. `prefabId` is the BASE prefab id (mounts are looked up by it).
 * The rig re-applies everything in `apply()`; call it after setPrefabDamage(root, level) because that rebuilds the root's children.
 */
export function attachLoadout(root: THREE.Group, prefabId: string, loadout: Loadout): GlazeRig {
  let current = normalizeLoadout(loadout);
  const lights = new THREE.Group();
  lights.visible = false;
  const rig: GlazeRig = {
    prefabId,
    get loadout() { return current; },
    set(next) { current = normalizeLoadout(next); rig.apply(); },
    apply() { /* stub */ },
    camberOf() { return 0; },
    seatLift: 0,
    lights,
    setLightsOn(on) { lights.visible = on; },
    grips: null,
    update() { /* stub */ },
    dispose() { /* stub */ },
  };
  return rig;
}
