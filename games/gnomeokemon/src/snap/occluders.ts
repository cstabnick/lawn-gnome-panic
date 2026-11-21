// Sight-line blockers: hedges along the lawn rail and cross-walls ahead of it, with a gap on the rail so the path stays open.

import * as THREE from 'three';
import { railSections } from './rail';

const SAMPLE_COUNT = 60;
const U_MIN = 0.05;
const U_MAX = 0.95;
/** Side hedges sit this far off the rail. */
const OFFSET = 3.6;
const HEDGE_HEIGHT = 1.6;
const HEDGE_LENGTH = 12;
const WALL_HEIGHT = 3.2;
const BLOCK_DEPTH = 0.9;
/** Cross-walls go on every Nth sample, this far ahead of it along the tangent. */
const WALL_EVERY = 5;
const WALL_AHEAD = 4.5;
/** Cross-walls reach this far to each side of the rail. */
const WALL_HALF_SPAN = 8.0;
/** Half of the gap left open in the middle of each cross-wall (2.6 wide in total). */
const WALL_GAP_HALF = 1.3;
const MIN_RAIL_DISTANCE = 2.2;
const DISTANCE_SAMPLES = 400;

const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2f6b2a, flatShading: true });

/** Smallest distance from a point to any sampled point on the curve. */
function distanceToRail(point: THREE.Vector3, curve: THREE.CatmullRomCurve3): number {
  let best = Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i <= DISTANCE_SAMPLES; i++) {
    curve.getPointAt(i / DISTANCE_SAMPLES, p);
    best = Math.min(best, p.distanceTo(point));
  }
  return best;
}

/** Adds one box to the scene, long along `along` (horizontal), standing on the ground. */
function addBlock(
  scene: THREE.Scene,
  blocks: THREE.Object3D[],
  name: string,
  height: number,
  length: number,
  centre: THREE.Vector3,
  along: THREE.Vector3,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_DEPTH, height, length), hedgeMat);
  mesh.name = name;
  mesh.position.set(centre.x, height / 2, centre.z);
  // The box's long axis is z; turn it to run along `along`.
  mesh.rotation.y = Math.atan2(along.x, along.z);
  // The sight tracer raycasts against matrixWorld, which is not set until a render: set it now.
  mesh.updateMatrixWorld(true);
  scene.add(mesh);
  blocks.push(mesh);
}

/** Places side hedges on every sample, and a cross-wall with a centre gap every few samples. Skips water sections. */
export function buildSightBlockers(scene: THREE.Scene, curve: THREE.CatmullRomCurve3): THREE.Object3D[] {
  const sections = railSections(curve);
  const inRange = (u: number, r: readonly [number, number]) => u >= r[0] && u <= r[1];
  const blocks: THREE.Object3D[] = [];
  const tangent = new THREE.Vector3();
  const point = new THREE.Vector3();

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const u = U_MIN + ((U_MAX - U_MIN) * i) / (SAMPLE_COUNT - 1);
    if (inRange(u, sections.tube) || inRange(u, sections.ford)) continue;

    curve.getPointAt(u, point);
    curve.getTangentAt(u, tangent);
    tangent.y = 0;
    if (tangent.lengthSq() === 0) continue;
    tangent.normalize();
    // Perpendicular in xz: rotate the tangent by 90 degrees.
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);

    for (const side of [1, -1]) {
      const centre = new THREE.Vector3(
        point.x + perp.x * OFFSET * side,
        HEDGE_HEIGHT / 2,
        point.z + perp.z * OFFSET * side,
      );
      if (distanceToRail(centre, curve) < MIN_RAIL_DISTANCE) continue;
      addBlock(scene, blocks, 'hedge', HEDGE_HEIGHT, HEDGE_LENGTH, centre, tangent);
    }

    if (i % WALL_EVERY !== 0) continue;
    // Cross-wall: two segments, one each side of the rail, leaving a gap centred on it.
    const ahead = new THREE.Vector3(
      point.x + tangent.x * WALL_AHEAD,
      0,
      point.z + tangent.z * WALL_AHEAD,
    );
    const segLength = WALL_HALF_SPAN - WALL_GAP_HALF;
    for (const side of [1, -1]) {
      const lateral = side * (WALL_GAP_HALF + segLength / 2);
      const centre = new THREE.Vector3(
        ahead.x + perp.x * lateral,
        WALL_HEIGHT / 2,
        ahead.z + perp.z * lateral,
      );
      if (distanceToRail(centre, curve) < MIN_RAIL_DISTANCE) continue;
      // The segment is wide across the lawn: its long axis is perpendicular to the tangent.
      addBlock(scene, blocks, 'wall', WALL_HEIGHT, segLength, centre, perp);
    }
  }
  return blocks;
}
