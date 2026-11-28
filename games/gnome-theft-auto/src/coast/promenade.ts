// The promenade's south row and dressing (FX11, G3#6 / D14): rides and kiosks facing the stalls across the walkway,
// bunting between the lamps, bins, a deckchair stack, coin-op telescopes facing the sea, and the gnomes out for a stroll.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** The gnomes on the promenade (life.ts adds them to the coast residents). */
export const PROMENADE_FOLK: readonly AmbientGnomeDef[] = [];

/** Dress the boardwalk deck (deck top `deckTop`, absolute y). */
export function buildPromenade(_scene: THREE.Scene, _boxes: Box[], _deckTop: number): void {
  // FX11 issue: filled by the promenade worker.
}
