// Roundabout islands (E28): the planted, kerbed island in the middle of every ring in ROUNDABOUTS. Each island is a
// grass disk (flat layer), a light kerb ring at its edge, a planter in the middle and one round collider. The Hatwheel
// also gets the "lost tourist" vignette. Filled by issue 2E.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from './types';
import { placeRoundBox } from './collide';
import { ROUNDABOUTS, islandRadius, type Roundabout } from './roundabouts';
import { heightAt } from './terrain';
import { addGroundToGeometry, placeOnGround } from './terrainMesh';

const GRASS = 0x4f8a3a;
const KERB = 0xc9c6bd;
/** Top of the island (ground + this), metres. */
const ISLAND_H = 0.35;
/** Kerb tube radius: the kerb stands about 0.24 m above the grass. */
const KERB_R = 0.12;

function shadowed(g: THREE.Object3D): THREE.Object3D {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

/** A prefab on the ground at (x, z), turned to yaw; null when the id is not in the catalog yet. */
function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number): void {
  if (!getPrefab(id)) return;
  const obj = buildPrefab(id, { lights: false });
  obj.rotation.y = yaw;
  placeOnGround(obj, x, z);
  scene.add(shadowed(obj));
}

/** The planter in the middle of the island, scaled so its footprint radius is a third of the island radius. */
function planter(scene: THREE.Scene, rb: Roundabout, R: number): void {
  if (!getPrefab('roundabout-planter')) return;
  const obj = buildPrefab('roundabout-planter', { lights: false });
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z) / 2;
  if (footprint > 0) obj.scale.setScalar(R / 3 / footprint);
  placeOnGround(obj, rb.x, rb.z);
  scene.add(shadowed(obj));
}

/** The Hatwheel's lost-tourist vignette: props inside the island at fractions of its radius and angles in degrees. */
function hatwheelVignette(scene: THREE.Scene, rb: Roundabout, R: number): void {
  const at = (frac: number, deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [rb.x + Math.cos(a) * R * frac, rb.z + Math.sin(a) * R * frac];
  };
  let [x, z] = at(0.6, 200);
  place(scene, 'lost-suitcase', x, z, 0.6);
  [x, z] = at(0.6, 20);
  place(scene, 'signpost', x, z, 0);
  [x, z] = at(0.72, 60);
  place(scene, 'boxwood-ball', x, z, 0);
  [x, z] = at(0.75, 100);
  place(scene, 'boxwood-ball', x, z, 0);
  [x, z] = at(0.5, 300);
  place(scene, 'boxwood-ball', x, z, 0);
}

/** Build every roundabout's island (and the Hatwheel's vignette); push a round collider per island into boxes. */
export function buildRoundaboutIslands(scene: THREE.Scene, boxes: Box[]): void {
  for (const rb of ROUNDABOUTS) {
    const R = islandRadius(rb);

    // The grass disk, laid flat on the ground in its own draw layer.
    const disk = new THREE.Mesh(
      addGroundToGeometry(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2).translate(rb.x, 0.03, rb.z)),
      flatLayer(new THREE.MeshLambertMaterial({ color: GRASS }), LAYER.area),
    );
    disk.receiveShadow = true;
    scene.add(disk);

    // The kerb: a thin ring at the island edge, standing on the ground.
    const kerb = new THREE.Mesh(
      addGroundToGeometry(new THREE.TorusGeometry(R, KERB_R, 6, 48).rotateX(Math.PI / 2).translate(rb.x, KERB_R, rb.z)),
      new THREE.MeshLambertMaterial({ color: KERB }),
    );
    kerb.castShadow = true;
    kerb.receiveShadow = true;
    scene.add(kerb);

    planter(scene, rb, R);
    if (rb.id === 'roundabout/hatwheel') hatwheelVignette(scene, rb, R);

    placeRoundBox(boxes, rb.x, rb.z, R, heightAt(rb.x, rb.z) + ISLAND_H);
  }
}
