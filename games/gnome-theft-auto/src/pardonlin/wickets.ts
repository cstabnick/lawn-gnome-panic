// The Wickets (E28): the old perimeter fence left standing between Trellisdown and Pardonlin (x = -1397), with a gated
// 14 m gap where each road passes (z -500, z -30, z 1000). Each gap: a wicket-gate on the north side, a customs-hut on
// the south side (Trellisdown side), a wicket-sign facing east toward arriving traffic. The Grand Wicket (z -30) has
// the luggage vignette. Filled by issue 2E.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { addGroundToGeometry, placeOnGround } from '../terrainMesh';

/** The fence line (x), the run's z extent, and the road gaps (z of each road centre line). */
const FENCE_X = -1397;
const FENCE_Z0 = -900;
const FENCE_Z1 = 1100;
const GAPS = [-500, -30, 1000] as const;
/** Half the gap width: the fence stops this far either side of a road centre line. */
const GAP_HALF = 7;

/** Same look as the perimeter fence (biomes.ts): post and rail colours, plank bay, heights. */
const FENCE_H = 9.5;
const POST_H = FENCE_H + 1.2;
const PLANK_STEP = 15;
const POST_COLOR = 0x735236;
const RAIL_COLOR = 0x523924;

/** Hut and sign offsets from their gap's road centre line (all beyond the 7 m clear distance). */
const GATE_DZ = -GAP_HALF;
const HUT_X = -1385;
const HUT_DZ = 10;
const SIGN_X = -1372;
const SIGN_DZ = -9;

function boxGeo(w: number, h: number, d: number, x: number, y: number, z: number): THREE.BufferGeometry {
  return addGroundToGeometry(new THREE.BoxGeometry(w, h, d).translate(x, y, z));
}

function shadowed(g: THREE.Object3D): THREE.Object3D {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

/** A prefab placed on the ground at (x, z) and turned to yaw; null when the id is not in the catalog yet. */
function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number): THREE.Group | null {
  if (!getPrefab(id)) return null;
  const obj = buildPrefab(id, { lights: false });
  obj.rotation.y = yaw;
  placeOnGround(obj, x, z);
  scene.add(shadowed(obj));
  return obj;
}

/** A solid collider for a placed object: its world footprint and its top. */
function solid(boxes: Box[], obj: THREE.Object3D): void {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y });
}

/** The fence runs left between the gaps: [from, to] in z. */
function fenceRuns(): [number, number][] {
  const runs: [number, number][] = [];
  let from = FENCE_Z0;
  for (const g of GAPS) {
    runs.push([from, g - GAP_HALF]);
    from = g + GAP_HALF;
  }
  runs.push([from, FENCE_Z1]);
  return runs;
}

/** Posts and planks for one run: one bay per PLANK_STEP, a post at each bay start and at the run's end. */
function fenceGeometry(a: number, b: number, posts: THREE.BufferGeometry[], rails: THREE.BufferGeometry[], planks: THREE.BufferGeometry[]): void {
  for (let t = a; t < b - 1e-6; t += PLANK_STEP) {
    const L = Math.min(PLANK_STEP, b - t);
    const mid = t + L / 2;
    posts.push(boxGeo(1.3, POST_H, 1.3, FENCE_X, POST_H / 2, t));
    planks.push(boxGeo(0.45, FENCE_H, L - 1.3, FENCE_X, FENCE_H / 2, mid));
    rails.push(boxGeo(0.85, 0.55, L, FENCE_X, 2.6, mid), boxGeo(0.85, 0.55, L, FENCE_X, 7.6, mid));
  }
  posts.push(boxGeo(1.3, POST_H, 1.3, FENCE_X, POST_H / 2, b));
}

/** Build the Pardonlin boundary fence, its three Wicket gates and customs huts; push their colliders into boxes. */
export function buildWickets(scene: THREE.Scene, boxes: Box[]): void {
  // ---- The fence: merged geometry, one mesh per material; one collider per run ---------------------------------------
  const posts: THREE.BufferGeometry[] = [];
  const planks: THREE.BufferGeometry[] = [];
  const rails: THREE.BufferGeometry[] = [];
  for (const [a, b] of fenceRuns()) {
    fenceGeometry(a, b, posts, rails, planks);
    let top = -Infinity;
    for (let z = a; z <= b; z += 5) top = Math.max(top, heightAt(FENCE_X, z));
    top = Math.max(top, heightAt(FENCE_X, b));
    boxes.push({ minX: FENCE_X - 0.8, maxX: FENCE_X + 0.8, minZ: a, maxZ: b, h: top + POST_H });
  }
  const postMat = new THREE.MeshStandardMaterial({ color: POST_COLOR, roughness: 0.92 });
  const railMat = new THREE.MeshStandardMaterial({ color: RAIL_COLOR, roughness: 0.92 });
  const layers: [THREE.BufferGeometry[], THREE.Material][] = [[[...posts, ...planks], postMat], [rails, railMat]];
  for (const [geos, mat] of layers) {
    const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  for (const rz of GAPS) {
    // The gate: open, on the north side of the gap, its colliders are the two gate posts at the fence ends.
    const gz = rz + GATE_DZ;
    const gate = place(scene, 'wicket-gate', FENCE_X, gz, 0);
    if (gate) {
      solid(boxes, gate);
    } else {
      boxes.push({ minX: FENCE_X - 0.8, maxX: FENCE_X + 0.8, minZ: gz - 0.8, maxZ: gz + 0.8, h: heightAt(FENCE_X, gz) + 2 });
    }

    // The customs hut: south of the gap, on the Trellisdown side, its door facing the road (north).
    const hut = place(scene, 'customs-hut', HUT_X, rz + HUT_DZ, Math.PI);
    if (hut) solid(boxes, hut);

    // The sign: east of the fence, facing east toward arriving traffic (local +z turned to +x).
    place(scene, 'wicket-sign', SIGN_X, rz + SIGN_DZ, Math.PI / 2);
  }

  // ---- The Grand Wicket vignette (z -30): the queue of luggage at the south side of the gap, the cone at the line -----
  const gz = GAPS[1] + HUT_DZ;
  place(scene, 'lost-suitcase', -1368, gz + 0.5, 0.4);
  place(scene, 'lost-suitcase', -1364, gz - 0.3, -0.2);
  place(scene, 'crate', -1358, gz + 0.2, 0.1);
  place(scene, 'traffic-cone', -1376, gz - 1.5, 0);
  // The gnome's hat and the stamp on the counter: no prefab yet for a hat on a counter; left for a later pass.
}
