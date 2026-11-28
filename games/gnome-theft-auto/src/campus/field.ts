// Rootwell Field, the second runway (E13 issue A16): the painted runway and its numbers, edge lights, apron, taxiway,
// access drive, hangar, tower, windsock, signs and vignettes; the aeronautics students at work; lights that glow at night.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { getPrefab } from '@lawn/prefabs';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import type { JobsDeps } from '../jobs/types';
import { heightAt } from '../terrain';
import { addGroundToGeometry } from '../terrainMesh';
import type { Box } from '../types';
import { ROOTWELL_FIELD, type RootwellPart } from './types';

const F = ROOTWELL_FIELD;
const HALF_PI = Math.PI / 2;
const PLATE_BG = 0xf2e8c8;
const RW = F.runway;
const RW_MIN_Z = RW.z - RW.length / 2;
const RW_MAX_Z = RW.z + RW.length / 2;
const EDGE_LIGHT_STEP = 30;
const GLOW_NAME = 'rootwell-field-glow';
/** The wing on trestles in front of the hangar, and where the two students stand. */
const WING = { x: 1248, z: 664, len: 8 };
const SANDER = { x: 1250.6, z: 663, yaw: -HALF_PI };
const CLIPBOARD = { x: 1248, z: 670.4, yaw: Math.PI };
/** The plane spots game code parks aircraft on (config.ts ROOTWELL_AIRFIELD.planeSpots). */
const SPOT_Z = [570, 592, 614];
const SPOT_X = 1238;
const TAXI_Z = (F.taxiway.minZ + F.taxiway.maxZ) / 2;

/** A flat rectangle in world coordinates, `w` along x and `d` along z, centred at (cx, cz), at height y. */
function flatRect(w: number, d: number, cx: number, cz: number, y: number): THREE.BufferGeometry {
  return new THREE.PlaneGeometry(w, d).rotateX(-HALF_PI).translate(cx, y, cz);
}

/** One merged flat mesh on a draw layer (its own material), draped on the ground. */
function flatMesh(geos: THREE.BufferGeometry[], color: number, layer: number, name: string): THREE.Mesh | null {
  if (!geos.length) return null;
  const merged = mergeGeometries(geos.map((g) => addGroundToGeometry(g.index ? g.toNonIndexed() : g)), false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, flatLayer(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), layer));
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

/** A thin painted strip from (x0, z0) to (x1, z1). */
function strip(x0: number, z0: number, x1: number, z1: number, w: number, y: number): THREE.BufferGeometry {
  const len = Math.hypot(x1 - x0, z1 - z0);
  return new THREE.PlaneGeometry(w, len).rotateX(-HALF_PI).rotateY(Math.atan2(x1 - x0, z1 - z0))
    .translate((x0 + x1) / 2, y, (z0 + z1) / 2);
}

/** Seven-segment digits: a top, b upper right, c lower right, d bottom, e lower left, f upper left, g middle. */
const SEGMENTS: Record<string, string> = { '1': 'bc', '3': 'abcdg', '6': 'acdefg', '8': 'abcdefg' };

/**
 * Big painted digits centred at (cx, cz). dir 1 reads from the south (up is north, right is east), -1 from the north.
 * Each digit is 4 wide and 8 tall, strokes 0.7.
 */
function numberGeos(text: string, cx: number, cz: number, dir: 1 | -1, y: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const dw = 4, dh = 8, t = 0.7, gap = 2;
  const total = text.length * dw + (text.length - 1) * gap;
  [...text].forEach((ch, i) => {
    const u0 = -total / 2 + i * (dw + gap) + dw / 2;
    const put = (u: number, v: number, w: number, d: number): void => {
      out.push(flatRect(w, d, cx + dir * (u0 + u), cz - dir * v, y));
    };
    for (const s of SEGMENTS[ch] ?? '') {
      if (s === 'a') put(0, dh / 2 - t / 2, dw, t);
      else if (s === 'g') put(0, 0, dw, t);
      else if (s === 'd') put(0, -dh / 2 + t / 2, dw, t);
      else if (s === 'b') put(dw / 2 - t / 2, dh / 4, t, dh / 2);
      else if (s === 'c') put(dw / 2 - t / 2, -dh / 4, t, dh / 2);
      else if (s === 'e') put(-dw / 2 + t / 2, -dh / 4, t, dh / 2);
      else if (s === 'f') put(-dw / 2 + t / 2, dh / 4, t, dh / 2);
    }
  });
  return out;
}

/** How far a prefab reaches along its own front (+z) at scale s; 1 m while it is not in the catalogue yet. */
function front(id: string, s = 1): number {
  return getPrefab(id) ? prefabBox(id).max.z * s : 1;
}

/** A plate on a piece's front face (the way its yaw looks), `lateral` metres to its right. */
function plateOn(p: HomePiece, text: string, y: number, w: number, h: number, lateral = 0): THREE.Mesh {
  const d = front(p.prefab, p.scale ?? 1) + 0.06;
  const sn = Math.sin(p.yaw), cs = Math.cos(p.yaw);
  return textPlate(text, p.x + sn * d + cs * lateral, y, p.z + cs * d - sn * lateral, p.yaw, { w, h, bg: PLATE_BG });
}

export function buildRootwellField(scene: THREE.Scene, boxes: Box[]): void {
  const root = new THREE.Group();
  root.name = 'rootwell-field';
  const g = (x: number, z: number): number => heightAt(x, z);
  const add = (m: THREE.Object3D | null): void => { if (m) root.add(m); };

  // ---- Ground: runway, apron, taxiway, access drive --------------------------------------------------------------
  add(flatMesh([flatRect(RW.width, RW.length, RW.x, RW.z, 0.03)], 0x3b3d40, LAYER.road, 'rootwell-runway'));
  const ap = F.apron, tw = F.taxiway, ac = F.access;
  add(flatMesh([
    flatRect(ap.maxX - ap.minX, ap.maxZ - ap.minZ, (ap.minX + ap.maxX) / 2, (ap.minZ + ap.maxZ) / 2, 0.03),
    flatRect(tw.maxX - tw.minX, tw.maxZ - tw.minZ, (tw.minX + tw.maxX) / 2, (tw.minZ + tw.maxZ) / 2, 0.03),
    strip(ac.from.x, ac.from.z, ac.to.x, ac.to.z, ac.width, 0.03),
  ], 0x9a9ea3, LAYER.area, 'rootwell-apron'));

  // ---- Paint: white (edges, centre dashes, bars, numbers, the H), yellow (taxi lines, the pad ring) ----------------
  const white: THREE.BufferGeometry[] = [];
  const yellow: THREE.BufferGeometry[] = [];
  const y1 = 0.05;
  for (const sx of [-1, 1]) white.push(flatRect(0.3, RW.length - 4, RW.x + sx * (RW.width / 2 - 0.7), RW.z, y1));
  for (let z = RW_MIN_Z + 40; z <= RW_MAX_Z - 40; z += 18) white.push(flatRect(0.5, 9, RW.x, z, y1));
  for (const end of [RW_MIN_Z, RW_MAX_Z]) {
    const s = end === RW_MIN_Z ? 1 : -1;
    // Threshold piano keys, and touchdown-zone bars 60 m in.
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      white.push(flatRect(1.2, 10, RW.x + k * 2.4, end + s * 8.5, y1));
    }
    for (const sx of [-1, 1]) {
      white.push(flatRect(1.4, 4.5, RW.x + sx * 5.5, end + s * 60, y1));
      white.push(flatRect(1.4, 4.5, RW.x + sx * 8, end + s * 72, y1));
    }
  }
  white.push(...numberGeos('36', RW.x, RW_MIN_Z + 27, -1, y1));
  white.push(...numberGeos('18', RW.x, RW_MAX_Z - 27, 1, y1));
  const pad = F.pad;
  white.push(flatRect(0.5, 4.4, pad.x - 1.1, pad.z, y1), flatRect(0.5, 4.4, pad.x + 1.1, pad.z, y1), flatRect(2.7, 0.5, pad.x, pad.z, y1));
  yellow.push(new THREE.RingGeometry(pad.r - 0.9, pad.r - 0.5, 40).rotateX(-HALF_PI).translate(pad.x, y1, pad.z));
  // Taxi lines: each spot east to a lane at x 1252, along it, then east to the runway edge on the taxiway.
  const lane = 1252;
  for (const z of SPOT_Z) yellow.push(strip(SPOT_X + 7.5, z, lane, z, 0.25, y1));
  yellow.push(strip(lane, SPOT_Z[0], lane, SPOT_Z[2], 0.25, y1));
  yellow.push(strip(lane, TAXI_Z, tw.maxX, TAXI_Z, 0.25, y1));
  add(flatMesh(white, 0xf2f2f2, LAYER.marking, 'rootwell-paint'));
  add(flatMesh(yellow, 0xf2c230, LAYER.decal, 'rootwell-paint-yellow'));

  // The overrun: two scorched skids off the north end into the grass.
  add(flatMesh([
    strip(RW.x - 3.4, RW_MIN_Z + 1, RW.x - 5.2, RW_MIN_Z - 14, 0.35, 0.04),
    strip(RW.x - 1.6, RW_MIN_Z + 1, RW.x - 3.4, RW_MIN_Z - 14, 0.35, 0.04),
  ], 0x1c1a18, LAYER.decal, 'rootwell-skid'));

  // ---- Edge lights (prefab) and the glowing heads (merged, brightened at night) -----------------------------------
  const pieces: HomePiece[] = [];
  const put = (p: HomePiece): HomePiece => { pieces.push(p); return p; };
  const heads: THREE.BufferGeometry[] = [];
  const headY = getPrefab('runway-edge-light') ? prefabBox('runway-edge-light').max.y : 0.5;
  for (let z = RW_MIN_Z; z <= RW_MAX_Z + 0.1; z += EDGE_LIGHT_STEP) {
    for (const sx of [-1, 1]) {
      const x = RW.x + sx * (RW.width / 2 + 1.5);
      put({ prefab: 'runway-edge-light', x, z, yaw: 0, solid: false });
      heads.push(addGroundToGeometry(new THREE.SphereGeometry(0.13, 6, 4).translate(x, headY + 0.02, z)));
    }
  }
  const glow = new THREE.Mesh(
    mergeGeometries(heads, false) ?? new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x6b5a1e }),
  );
  glow.name = GLOW_NAME;
  root.add(glow);

  // ---- Buildings -------------------------------------------------------------------------------------------------
  put({ prefab: 'hangar', x: F.hangar.x, z: F.hangar.z, yaw: F.hangar.yaw });
  put({ prefab: 'rootwell-control-tower', x: F.tower.x, z: F.tower.z, yaw: F.tower.yaw });
  put({ prefab: 'windsock-mast', x: F.windsock.x, z: F.windsock.z, yaw: 0 });
  const cabin = put({ prefab: 'portacabin', x: 1218, z: 606, yaw: HALF_PI });
  add(plateOn(cabin, 'AERONAUTICS DEPT.\nOFFICE HOURS: WHEN AIRBORNE', 2.1, 2.4, 0.7));
  put({ prefab: 'fuel-cart', x: 1251, z: 679, yaw: HALF_PI });
  put({ prefab: 'glaze-extra-toolbox', x: 1244, z: 676, yaw: 0.4, solid: false });

  // ---- Signs -----------------------------------------------------------------------------------------------------
  const sign = (x: number, z: number, yaw: number, text: string, w: number, h: number): void => {
    const post = put({ prefab: 'signpost', x, z, yaw, solid: false });
    add(plateOn(post, text, 1.9, w, h));
  };
  sign(1196, 575.5, -HALF_PI, 'ROOTWELL FIELD\nFLATTER THAN THE FLATS', 2.4, 0.9);
  sign(1240, 517, HALF_PI, 'TOWER\nIF NOBODY ANSWERS,\nYOU ARE CLEARED', 2.4, 1.1);
  sign(1222, 556, HALF_PI, 'STUDENTS: ONE PLANE.\nFOUR OF YOU.\nTAKE TURNS.', 2.4, 1.1);
  const north = put({ prefab: 'signpost', x: 1322, z: RW_MIN_Z + 4, yaw: Math.PI, solid: false });
  add(plateOn(north, 'MIND THE ANTHILL', 1.9, 2.2, 0.6));
  add(plateOn(north, '↖', 1.2, 0.6, 0.6, -0.7));

  // ---- Vignette 1: a wing on trestles in front of the hangar, half-painted ---------------------------------------
  const trestleH = getPrefab('crate') ? prefabBox('crate').max.y : 0.8;
  for (const dz of [-2.4, 2.4]) put({ prefab: 'crate', x: WING.x, z: WING.z + dz, yaw: 0, solid: false });
  const wingY = g(WING.x, WING.z) + trestleH + 0.12;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, WING.len), new THREE.MeshLambertMaterial({ color: 0xe8e2c8 }));
  wing.position.set(WING.x, wingY, WING.z);
  wing.rotation.z = 0.04;
  wing.castShadow = true;
  wing.name = 'rootwell-spare-wing';
  root.add(wing);
  boxes.push({ minX: WING.x - 0.9, maxX: WING.x + 0.9, minZ: WING.z - WING.len / 2, maxZ: WING.z + WING.len / 2, h: wingY + 0.2 });
  // The roundel: a blue disc, half of it painted over with red, on the wing's top face.
  const disc = (r: number, color: number, arc: number, layer: number): THREE.Mesh => {
    const geo = new THREE.CircleGeometry(r, 24, 0, arc).rotateX(-HALF_PI);
    const m = new THREE.Mesh(geo, flatLayer(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), layer));
    m.position.set(WING.x, wingY + 0.1, WING.z - 1.2);
    return m;
  };
  root.add(disc(0.55, 0x2a6fdb, Math.PI * 2, LAYER.marking));
  root.add(disc(0.3, 0xc0392b, Math.PI, LAYER.decal));
  put({ prefab: 'glaze-extra-toolbox', x: WING.x - 1.6, z: WING.z + 1.2, yaw: 0.3, solid: false });
  put({ prefab: 'glaze-extra-toolbox', x: WING.x - 1.9, z: WING.z - 0.2, yaw: -0.5, solid: false, tint: 0xc0392b });
  put({ prefab: 'site-cone', x: WING.x + 1.8, z: WING.z - 3.2, yaw: 0, solid: false });
  put({ prefab: 'ladder', x: WING.x + 1.4, z: WING.z + 3.6, yaw: HALF_PI, solid: false });

  // ---- Vignette 2: the very small tower: a deck chair, a picnic set and the FLIGHT RECORDS board ----------------
  put({ prefab: 'deck-chair', x: F.tower.x + 3, z: F.tower.z + 2.5, yaw: HALF_PI, solid: false });
  put({ prefab: 'picnic-table', x: F.tower.x + 5.5, z: F.tower.z - 3, yaw: 0, solid: false });
  const records = put({ prefab: 'signpost', x: 1224, z: 526, yaw: 0, solid: false });
  add(plateOn(records, 'FLIGHT RECORDS', 2.1, 1.8, 0.6));
  [-0.7, 0, 0.7].forEach((l, i) => {
    put({ prefab: 'paper-plane', x: 1224 + l, z: 526.3, yaw: 0.3 * (i - 1), solid: false, y: 2.5 + (i % 2) * 0.25 });
  });
  put({ prefab: 'essay-page', x: 1226.2, z: 527.2, yaw: 0.6, solid: false });

  // ---- Vignette 3: the overrun, ending in a hay pile -------------------------------------------------------------
  const oz = RW_MIN_Z - 16;
  put({ prefab: 'hay-bale', x: RW.x - 6, z: oz, yaw: 0.2 });
  put({ prefab: 'hay-bale', x: RW.x - 7.8, z: oz - 0.4, yaw: -0.3 });
  put({ prefab: 'crate', x: RW.x - 6.6, z: oz - 1.8, yaw: 0.5 });
  const overrun = put({ prefab: 'signpost', x: RW.x - 2, z: oz + 1, yaw: Math.PI, solid: false });
  add(plateOn(overrun, "OVERRUN\n(PROFESSOR'S PARKING)", 1.9, 2.2, 0.8));

  // ---- Vignette 4: a queue of four benches, waiting for a turn ---------------------------------------------------
  for (let i = 0; i < 4; i++) put({ prefab: 'bench', x: 1222, z: 624 + i * 2.4, yaw: HALF_PI });
  const queue = put({ prefab: 'signpost', x: 1222.6, z: 621, yaw: HALF_PI, solid: false });
  add(plateOn(queue, 'WAITING FOR A TURN', 1.9, 2, 0.6));

  boxes.push(...buildPieces(scene, pieces, 'rootwell-field-scenery'));
  scene.add(root);
}

/** The aeronautics students, runway lights at night. */
export function installFieldLife(deps: JobsDeps): RootwellPart {
  const life = new THREE.Group();
  life.name = 'rootwell-field-life';
  deps.scene.add(life);
  const look = (hat: number, suit: number) => ({
    hat, shirt: suit, pants: suit, skin: 0xe0ac69, boots: 0x3a2a1a, beard: null, hair: null,
    freckles: true, dress: false, glasses: false, bowlCut: null,
  });
  const sander = makeGnome(life, look(0x6b4a2b, 0xf08a1c));
  const clip = makeGnome(life, look(0x6b4a2b, 0x2ec4b6));
  sander.object.name = 'rootwell-sander';
  clip.object.name = 'rootwell-clipboard';
  const sy = heightAt(SANDER.x, SANDER.z), cy = heightAt(CLIPBOARD.x, CLIPBOARD.z);
  sander.object.position.set(SANDER.x, sy, SANDER.z);
  sander.object.rotation.y = SANDER.yaw;
  clip.object.position.set(CLIPBOARD.x, cy, CLIPBOARD.z);
  clip.object.rotation.y = CLIPBOARD.yaw;

  let glow: THREE.Mesh | null = null;
  let lightClock = 1;
  const dim = new THREE.Color(0x6b5a1e), bright = new THREE.Color(0xffe066);
  const darkLabels = new Set(['Dusk', 'Neon Night', 'Dawn']);

  return {
    update(dt, t) {
      lightClock += dt;
      if (lightClock >= 1) {
        lightClock = 0;
        glow ??= (deps.scene.getObjectByName(GLOW_NAME) as THREE.Mesh | undefined) ?? null;
        if (glow) {
          const night = darkLabels.has(deps.timeLabel() ?? '');
          (glow.material as THREE.MeshBasicMaterial).color.copy(night ? bright : dim);
        }
      }
      if (Math.hypot(deps.player.x - SANDER.x, deps.player.z - SANDER.z) > 250) return;
      // The sander rubs the wing's edge; the clipboard holder turns to the wing and away every few seconds.
      sander.update(gnomeState(SANDER.x, sy, SANDER.z, SANDER.yaw, 0), dt);
      sander.arms.right.rotation.x = -1.1 + Math.sin(t * 7) * 0.35;
      const turn = Math.floor(t / 4) % 2 === 0 ? CLIPBOARD.yaw : CLIPBOARD.yaw - 1.2;
      clip.object.rotation.y += (turn - clip.object.rotation.y) * Math.min(1, dt * 3);
      clip.update(gnomeState(CLIPBOARD.x, cy, CLIPBOARD.z, clip.object.rotation.y, 0), dt);
      clip.arms.left.rotation.x = -1.2;
    },
  };
}
