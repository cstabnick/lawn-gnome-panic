// Rail sections: where the lawn ride crosses water and goes under it.

import * as THREE from 'three';

/** Ride parameter range [u0, u1] (the getPointAt parameter, 0 to 1) for each water section. */
export interface RailSections {
  /** Shallow ford: the rail runs just above a water sheet at WATER_Y. */
  ford: readonly [number, number];
  /** Glass tube under a water volume: the camera drops inside and the fog turns blue. */
  tube: readonly [number, number];
}

/** Ford band in world z. Points with z in [min, max] are in the ford. */
export const FORD_Z: readonly [number, number] = [2, 11];
/** Tube band in world z. Points with z in [min, max] are in the tube. */
export const TUBE_Z: readonly [number, number] = [-24, -13];
/** Height of the ford's water sheet. */
export const WATER_Y = 0.12;
/** Radius of the glass tube around the rail. */
export const TUBE_RADIUS = 1.1;

const SAMPLES = 800;

/** Samples the curve and returns the u ranges whose z falls in FORD_Z and TUBE_Z. A band never hit returns [0, 0]. */
export function railSections(curve: THREE.CatmullRomCurve3): RailSections {
  const ford = { min: Infinity, max: -Infinity };
  const tube = { min: Infinity, max: -Infinity };
  const p = new THREE.Vector3();
  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1);
    curve.getPointAt(u, p);
    if (p.z >= FORD_Z[0] && p.z <= FORD_Z[1]) {
      ford.min = Math.min(ford.min, u);
      ford.max = Math.max(ford.max, u);
    }
    if (p.z >= TUBE_Z[0] && p.z <= TUBE_Z[1]) {
      tube.min = Math.min(tube.min, u);
      tube.max = Math.max(tube.max, u);
    }
  }
  const range = (r: { min: number; max: number }): [number, number] =>
    r.min === Infinity ? [0, 0] : [r.min, r.max];
  return { ford: range(ford), tube: range(tube) };
}
