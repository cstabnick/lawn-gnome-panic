// The Burrow Door on the surface (E17 issue B7): the grassy mound, the round door, molehills, a post box, signs.
// Static scenery with colliders; the door prompt itself comes from the Loamdeep interior.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../../cull';
import { textPlate } from '../../homes/pieces';
import { heightAt } from '../../terrain';
import type { Box } from '../../types';
import { BURROW_DOOR } from '../config';

const E = Math.PI / 2;
const WOOD = 0x8a6a42;
const PAPER = 0xf2e8c8;
const CLOTH = 0xe8d8b0;
const SINK = 0.3;

/** Builds the Burrow Door inside BURROW_DOOR.site; pushes colliders into `boxes`. Called once by world.ts (via index.ts). */
export function buildBurrowDoor(scene: THREE.Scene, boxes: Box[]): void {
  const group = new THREE.Group();
  group.name = 'burrow-door-signs';
  const statics: { id: string; x: number; y: number; z: number; yaw?: number; scale?: number }[] = [];
  const ground = (x: number, z: number): number => heightAt(x, z);

  const plate = (text: string, x: number, y: number, z: number, yaw: number, w: number, h: number, bg = PAPER): THREE.Mesh => {
    const m = textPlate(text, x, y, z, yaw, { w, h, bg });
    group.add(m);
    return m;
  };
  /** A thin wooden post from the ground up to `top` metres. */
  const post = (x: number, z: number, top: number): void => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, top, 0.1),
      new THREE.MeshLambertMaterial({ color: WOOD }),
    );
    m.position.set(x, ground(x, z) + top / 2, z);
    group.add(m);
  };
  /** A sign on a post, the plate standing 0.08 m in front of it (the way yaw faces: E = east). */
  const sign = (text: string, x: number, z: number, yaw: number, y: number, w: number, h: number, bg = PAPER): THREE.Mesh => {
    post(x, z, y + h / 2);
    return plate(text, x + Math.sin(yaw) * 0.08, ground(x, z) + y, z + Math.cos(yaw) * 0.08, yaw, w, h, bg);
  };
  /** A flat decal on the ground (its own material, a draw layer, lifted clear of the grass). */
  const flatDecal = (geo: THREE.BufferGeometry, color: number, layer: number, x: number, z: number, yaw: number): void => {
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, flatLayer(new THREE.MeshBasicMaterial({ color }), layer));
    m.position.set(x, ground(x, z) + 0.03, z);
    m.rotation.y = yaw;
    group.add(m);
  };
  /** Places a prefab standing on the ground (feet at the ground, sunk by `sink`). Returns it, or undefined if missing. */
  const standing = (id: string, x: number, z: number, yaw: number, sink = 0): THREE.Group | undefined => {
    if (!getPrefab(id)) return undefined;
    const obj = buildPrefab(id, { lights: false });
    obj.rotation.y = yaw;
    obj.position.set(x, ground(x, z) - sink, z);
    scene.add(obj);
    return obj;
  };

  const { mound, door, nubbin, molehills } = BURROW_DOOR;
  const { x: mx, z: mz } = mound;

  // ---- The mound: flat door face on +x (east), sunk a little so it does not float on the slope. ------------------
  standing('burrow-mound', mx, mz, E, SINK);
  // Collider: a 8 x 8 m box round the mound centre. The door spot (x -993.5) stays outside it.
  boxes.push({ minX: mx - 4, maxX: mx + 4, minZ: mz - 4, maxZ: mz + 4, h: ground(mx, mz) + 2.4 });

  // ---- The round door in the flat face, bottom at ground level, no collider. -----------------------------------------
  statics.push({ id: 'burrow-door-round', x: -994.6, y: ground(-994.6, mz), z: mz, yaw: E });

  // ---- Molehills round the mound (no colliders). --------------------------------------------------------------------
  for (const [x, z] of molehills) statics.push({ id: 'mole-hill', x, y: ground(x, z), z });

  // ---- A doormat in front of the door (the rug prefab, scaled to 1.2 x 0.8 m) and its plate. -----------------------
  const matX = -992.9;
  if (getPrefab('rug')) statics.push({ id: 'rug', x: matX, y: ground(matX, mz) + 0.03, z: mz, yaw: E, scale: 0.55 });
  else flatDecal(new THREE.PlaneGeometry(1.2, 0.8), 0x7a4a2a, LAYER.marking, matX, mz, E);
  sign('WIPE YOUR PAWS\n(if it pleases you)', -991.2, 298.6, E, 0.7, 0.8, 0.4);

  // ---- The post box: a mailbox on its own post, with a plate on its front. ---------------------------------------------
  const boxX = -994, boxZ = 296.5;
  const mailbox = standing('mailbox', boxX, boxZ, E);
  if (mailbox) {
    const b = new THREE.Box3().setFromObject(mailbox);
    boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y });
  }
  plate('LOAMDEEP POST\nletters for moles\nno spades', boxX + 0.2, ground(boxX, boxZ) + 0.45, boxZ, E, 0.7, 0.3);

  // ---- The lamp on a short post beside the door. --------------------------------------------------------------------
  const lampX = -993.8, lampZ = 302.2;
  if (getPrefab('mole-lamp-lit')) statics.push({ id: 'mole-lamp-lit', x: lampX, y: ground(lampX, lampZ), z: lampZ, yaw: E });
  post(lampX, lampZ, 1.1);

  // ---- Signs facing east to the road. ------------------------------------------------------------------------------
  sign('THE BURROW DOOR\nLoamdeep, below\nVisitors: knock low', -989.5, 295.5, E, 1.4, 1.3, 0.8);
  // The gnome sign is crooked, with the mole plate tidily right under it.
  const warn = sign('WARNING: MOLES.\nROOT-EATERS.\nKEEP SPADES HANDY.\n(HOA Pest Notice 12)', -987.5, 309, E, 1.5, 1.3, 0.9, 0xfff2a8);
  warn.rotation.z = 0.06;
  plate('We eat grubs.\nThe grubs eat the roots.\nKind regards.', -987.5 + 0.08, ground(-987.5, 309) + 0.8, 309, E, 0.7, 0.36, 0xfffdf5);

  // ---- Vignette 1: a gnome's spade stuck in a molehill, with a polite note tied to the handle. ---------------------
  const spadeX = -1006, spadeZ = 309;
  const spade = standing('ranch-spade', spadeX, spadeZ, 0.4);
  if (spade) {
    spade.rotation.z = 0.2;
    spade.rotation.order = 'YXZ';
  }
  plate('Is this yours?\nWe found it in our ceiling.', spadeX + 0.2, ground(spadeX, spadeZ) + 1.0, spadeZ, E, 0.7, 0.36);

  // ---- Vignette 2: a little picnic for one on a cloth by the mound, facing the sunset. ---------------------------------
  const clothX = -996.5, clothZ = 306.5;
  flatDecal(new THREE.PlaneGeometry(1.4, 1.0), CLOTH, LAYER.marking, clothX, clothZ, -E);
  if (getPrefab('espresso-cup')) statics.push({ id: 'espresso-cup', x: clothX - 0.5, y: ground(clothX, clothZ) + 0.03, z: clothZ - 0.2 });
  if (getPrefab('grub-bread')) statics.push({ id: 'grub-bread', x: clothX - 0.15, y: ground(clothX, clothZ) + 0.03, z: clothZ + 0.2 });
  // A pair of tiny spectacles folded beside it: no prefab yet, so none is placed (see the B7 report).

  scene.add(group);
  const batch = buildStaticCells(statics, { name: 'burrow-door' });
  scene.add(batch);
}
