// Beach scenes along the strand (FX11, G3#13 / G3#26): small hand-placed stories on the two kilometres of sand east and
// west of the town, the treasure X, and the Saltcut's banks and mouth.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** The gnomes in the beach scenes (life.ts adds them to the coast residents). */
export const BEACH_FOLK: readonly AmbientGnomeDef[] = [];

/** Static scenery for the strand, the chart X and the Saltcut. */
export function buildBeachScenes(_scene: THREE.Scene, _boxes: Box[]): void {
  // FX11 issue: filled by the beach-scenes worker.
}
