// Brassknock Manor's exterior (E16 issue C2): the walled site with its gate, the gravel drive and forecourt, the
// fountain, the house with its terrace (a walkable rooftop), the back path and the formal gardens behind.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { buildPieces, litWindow, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import { MANOR, N } from './types';
import type { Box } from '../types';

const S = MANOR.site;
const GX = MANOR.gate.x;
const GZ = MANOR.gate.z;
const H = MANOR.house;
const BACK_DOOR = { x: GX, z: 41.5 };
const WALL_LEN = 6;
const WALL_H = 2;
const WALL_T = 0.5;
const PIER_X = 4.4;

/** A garden prop of half-width r may stand here: off the 4 m walk, 4 m from the story spots, 2 m from the doors. */
function gardenClear(x: number, z: number, r: number): boolean {
  if (Math.abs(x - GX) < 2 + r) return false;
  for (const s of MANOR.story) if (Math.hypot(x - s.x, z - s.z) < 4 + r) return false;
  for (const s of [MANOR.door, MANOR.gate, BACK_DOOR]) if (Math.hypot(x - s.x, z - s.z) < 2 + r) return false;
  return true;
}

/** An axis-aligned run of garden wall: pieces abut along the run, and the run gets one collider. */
function wallRun(pieces: HomePiece[], boxes: Box[], x0: number, z0: number, x1: number, z1: number): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / WALL_LEN));
  const alongX = z0 === z1;
  const yaw = alongX ? 0 : Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    pieces.push({ prefab: 'manor-wall', x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, yaw, scale: len / n / WALL_LEN, solid: false });
  }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const px = alongX ? 0 : WALL_T / 2, pz = alongX ? WALL_T / 2 : 0;
  boxes.push({
    minX: Math.min(x0, x1) - px, maxX: Math.max(x0, x1) + px,
    minZ: Math.min(z0, z1) - pz, maxZ: Math.max(z0, z1) + pz,
    h: heightAt(mx, mz) + WALL_H,
  });
}

/** A flat painted or gravel patch on the ground, lifted a few centimetres (its own material, its own draw layer). */
function decal(
  scene: THREE.Scene, geo: THREE.BufferGeometry, cx: number, cz: number, color: number, layer: number, lift: number, name: string,
): void {
  const mesh = new THREE.Mesh(geo, flatLayer(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), layer));
  mesh.position.set(cx, heightAt(cx, cz) + lift, cz);
  mesh.receiveShadow = true;
  mesh.name = name;
  scene.add(mesh);
}

/** A rectangle decal from its edges. */
function rectDecal(
  scene: THREE.Scene, minX: number, maxX: number, minZ: number, maxZ: number, color: number, layer: number, lift: number, name: string,
): void {
  const geo = new THREE.PlaneGeometry(maxX - minX, maxZ - minZ).rotateX(-Math.PI / 2);
  decal(scene, geo, (minX + maxX) / 2, (minZ + maxZ) / 2, color, layer, lift, name);
}

export function buildManor(scene: THREE.Scene, boxes: Box[]): void {
  const pieces: HomePiece[] = [];
  const ext = { minX: S.minX + 1, maxX: S.maxX - 1, minZ: S.minZ + 1, maxZ: S.maxZ - 1 };

  // Walls: the north wall with the 8 m gate gap, the south wall with a 3 m garden gap, east and west whole.
  wallRun(pieces, boxes, ext.minX, ext.minZ, GX - 4, ext.minZ);
  wallRun(pieces, boxes, GX + 4, ext.minZ, ext.maxX, ext.minZ);
  wallRun(pieces, boxes, ext.minX, ext.maxZ, GX - 1.5, ext.maxZ);
  wallRun(pieces, boxes, GX + 1.5, ext.maxZ, ext.maxX, ext.maxZ);
  wallRun(pieces, boxes, ext.minX, ext.minZ, ext.minX, ext.maxZ);
  wallRun(pieces, boxes, ext.maxX, ext.minZ, ext.maxX, ext.maxZ);

  // Gate: the piers are colliders, the gap stays open. A signpost stands just inside with the visitors' notice.
  pieces.push({ prefab: 'manor-gate', x: GX, z: GZ, yaw: MANOR.gate.yaw, solid: false });
  for (const side of [-1, 1]) {
    boxes.push({
      minX: GX + side * PIER_X - 0.4, maxX: GX + side * PIER_X + 0.4,
      minZ: GZ - 0.4, maxZ: GZ + 0.4, h: heightAt(GX, GZ) + 3,
    });
  }
  pieces.push({ prefab: 'signpost', x: GX + 6, z: GZ + 2, yaw: 0, solid: false });

  // Fountain in the forecourt, with a round basin collider.
  const F = MANOR.fountain;
  pieces.push({ prefab: 'stone-fountain', x: F.x, z: F.z, yaw: 0, solid: false });
  boxes.push({ minX: F.x - 1.25, maxX: F.x + 1.25, minZ: F.z - 1.25, maxZ: F.z + 1.25, h: heightAt(F.x, F.z) + 1.2 });

  // House: the half-size prefab at scale 2, front to the north. One collider for the body; the terrace stays open.
  pieces.push({ prefab: 'brassknock-manor', x: H.x, z: H.z, yaw: H.yaw, scale: 2, solid: false });
  boxes.push({
    minX: H.x - 23, maxX: H.x + 23, minZ: H.z - 9, maxZ: H.z + 9, h: heightAt(H.x, H.z) + 10,
  });

  // Formal gardens behind the house: two parterres either side of the 4 m walk, each with hedge rows framing beds.
  const gardenWest = -1176, gardenEast = -1124;
  for (const cx of [gardenWest, gardenEast]) {
    for (const z of [58, 74]) {
      for (let x = cx - 16; x <= cx + 14; x += 1.96) {
        if (gardenClear(x, z, 0.98)) pieces.push({ prefab: 'euro-box-hedge', x, z, yaw: 0 });
      }
    }
    for (const [dx, z] of [[-10, 54], [10, 54], [-10, 78], [10, 78]] as const) {
      // Flowers are mowable: no colliders.
      if (gardenClear(cx + dx, z, 1.5)) pieces.push({ prefab: 'euro-geranium-bed', x: cx + dx, z, yaw: 0, solid: false });
    }
    if (gardenClear(cx, 52, 0.4)) pieces.push({ prefab: 'manor-urn', x: cx, z: 52, yaw: 0 });
    for (const [dx, id] of [[-18, 'euro-topiary-spiral'], [18, 'euro-topiary-lollipop']] as const) {
      if (gardenClear(cx + dx, 66, 0.4)) pieces.push({ prefab: id, x: cx + dx, z: 66, yaw: 0 });
    }
  }
  if (gardenClear(gardenWest, 66, 0.4)) pieces.push({ prefab: 'manor-sundial', x: gardenWest, z: 66, yaw: 0 });
  for (const [x, z] of [[gardenWest - 22, 52], [gardenWest - 22, 80], [gardenEast + 22, 52], [gardenEast + 22, 80]] as const) {
    if (gardenClear(x, z, 0.45)) pieces.push({ prefab: 'euro-plane-tree', x, z, yaw: 0 });
  }

  boxes.push(...buildPieces(scene, pieces, 'brassknock-manor-grounds'));

  // Drive from the gate to the fountain ring, forecourt, path down the west side of the house, and the path to the
  // back door. The forecourt is under the drive (+0.03 and +0.05), and each lies in its own draw layer.
  const F_MINX = -1174, F_MAXX = -1126;
  rectDecal(scene, F_MINX, F_MAXX, -3, 17, 0xb3a88f, LAYER.area, 0.03, 'manor-forecourt');
  rectDecal(scene, GX - 2, GX + 2, GZ, 3.8, 0xcbc2a8, LAYER.road, 0.05, 'manor-drive');
  rectDecal(scene, -1178, -1174, 4, 44, 0xcbc2a8, LAYER.road, 0.05, 'manor-path-west');
  rectDecal(scene, -1174, GX + 2, 40.2, 44, 0xcbc2a8, LAYER.road, 0.05, 'manor-path-back');
  decal(scene, new THREE.RingGeometry(2.2, 3.0, 32).rotateX(-Math.PI / 2), F.x, F.z, 0xcbc2a8, LAYER.road, 0.07, 'manor-fountain-ring');

  // One lit window on the front either side of the door, facing north, just in front of the wall.
  scene.add(litWindow(-1134, heightAt(-1134, 21.96) + 2.0, 21.96, N, 0.9, 1.4));
  scene.add(litWindow(-1166, heightAt(-1166, 21.96) + 2.0, 21.96, N, 0.9, 1.4));

  // Terrace: a walkable rooftop surface at its height (1.2 m above the ground), with no collider.
  if (!rooftopById('brassknock-terrace')) {
    const T = MANOR.terrace;
    addRooftop({
      id: 'brassknock-terrace', name: 'Brassknock terrace',
      minX: T.minX, maxX: T.maxX, minZ: T.minZ, maxZ: T.maxZ,
      y: heightAt(GX, T.maxZ) + 1.2, solid: false, parapet: false,
    });
  }

  // Signs: the brass name plate on the left (west) pier, and the visitors' notice on its stand inside the gate.
  scene.add(textPlate('BRASSKNOCK', GX - PIER_X, heightAt(GX, GZ) + 2.5, GZ - 0.43, N, { w: 1.2, h: 0.35 }));
  scene.add(textPlate(
    'VISITORS:\nROUND THE BACK.\nTHE KNOCKER IS FOR THE CHARTER.',
    GX + 6, heightAt(GX, GZ) + 1.8, GZ + 1.85, N, { w: 1.6, h: 0.8 },
  ));
}
