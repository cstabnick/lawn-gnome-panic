// Bolt-ons: spoiler, seat cover, hood ornament, extras and underglow, each placed at a mount point.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { Loadout, VehicleMounts } from './types';

export interface FittingsBuild {
  /** Everything that rides on the body shell (spoiler, seat cover, ornament, extras). */
  group: THREE.Group;
  /** Things that stay down at road level whatever the ride height (the underglow). Added to the body root, not the shell. */
  ground: THREE.Group;
  /** Per-frame animation: underglow pulse. */
  update(dt: number): void;
}

/**
 * Build the spoiler (point 'rear'), seat cover ('seat'), ornament ('hood'), every extra (each extra's point: dice 'dash', flag 'rear', pipes 'side',
 * mudflaps at the rear wheels, bunting 'top', plate 'rear', roobar 'front', bell 'dash') and the underglow (a flat additive glow quad under the body) from the loadout.
 * Prefab ids are `glaze-<slot>-<id>`, built with buildPrefab and scaled by mounts.width / 1.2. A fitting whose mount point is missing is skipped. Nothing in the group is tinted by the body paint.
 */
export function buildFittings(_mounts: VehicleMounts, _loadout: Loadout): FittingsBuild {
  return { group: new THREE.Group(), ground: new THREE.Group(), update() { /* stub */ } };
}
