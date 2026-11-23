// Headlights: lamp housings (a new look for the nose) and the beams + glow that switch on at dusk.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { Loadout, VehicleMounts } from './types';

export interface LampBuild {
  /** The housings to add under the body shell (null for the 'stock' lamp or when mounts.lamps is null). */
  housings: THREE.Group | null;
  /** Bulbs + beam cones for the two lamps, in beam colour (catalog beamColor(loadout.beam)); the rig puts these in its stable `lights` group. Always built (even for 'stock' lamp, at mounts.lamps) when mounts.lamps exists. */
  beams: THREE.Group | null;
}

/** Build both from loadout.lamp / loadout.beam at mounts.lamps (scaled by mounts.width / 1.2). The old game headlights were two 0.11 bulbs 0.32 apart with a 0.9 x 5.5 cone beam at 0.14 opacity: keep that feel. */
export function buildLamps(_mounts: VehicleMounts, _loadout: Loadout): LampBuild {
  return { housings: null, beams: null };
}
