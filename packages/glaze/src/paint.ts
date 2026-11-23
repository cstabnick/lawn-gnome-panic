// Body paint: the finish (gloss, matte, metallic, pearl, candy, chameleon, primer) as a material, painted onto the body's tint meshes.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { FinishId, Loadout } from './types';

/**
 * A material for a finish and colour, cached by (finish, colour, vertexColors) and shared between vehicles (never dispose it).
 * `vertexColors` true for the body's baked tint bucket (its vertex colours are white, so the material colour is the paint), false for a plain tint part.
 */
export function finishMaterial(_finish: FinishId, color: number, vertexColors: boolean): THREE.Material {
  return new THREE.MeshStandardMaterial({ color, vertexColors });
}

/** Give every mesh under `root` with `userData.tint === true` the material for loadout.paint + loadout.finish. Idempotent. */
export function paintBody(_root: THREE.Object3D, _loadout: Loadout): void {
  /* stub */
}
