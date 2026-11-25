// Winter sports (E12): Pail Pond's scenery: ice shanties, Thermos Theo's camp, stools round old holes, the pail's
// handle sticking out of the ice, signs, vignettes and Theo himself.
// Pail Pond is a Tall-One pail sunk to its rim and frozen over: a low galvanized rim rings the ice.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { ICE, PAIL_POND, SHANTY } from './types';

export interface PailPondScenery {
  boxes: Box[];
  /** Every frame: Theo jigs his line, steam off the thermos. t = seconds since start. */
  update(dt: number, t: number, px: number, pz: number): void;
}

const HALF_PI = Math.PI / 2;
const C = PAIL_POND;
const ACTIVE_R = 250;
/** Collider half-width of a shanty (a little under its hull so the door front stays clear). */
const SHANTY_HALF = 1.1;

const has = (id: string): boolean => !!getPrefab(id);
const g = (x: number, z: number): number => heightAt(x, z);
/** Yaw that faces the pond centre from (x, z). */
const toCentre = (x: number, z: number): number => Math.atan2(C.x - x, C.z - z);
const onCircle = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [C.x + Math.cos(a) * r, C.z + Math.sin(a) * r];
};

/** How far a prefab's front (+z) reaches from its origin at a given size (default 1.3 if the prefab is missing). */
function frontOf(id: string, size: number): number {
  if (!has(id)) return size / 2;
  const b = prefabBox(id);
  const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  return longest > 0 ? b.max.z * (size / longest) : size / 2;
}

/** A prefab placed loose (so it can be tilted or animated). Null when the catalogue lacks it. */
function loose(id: string, x: number, y: number, z: number, yaw: number, size: number, tint?: number): THREE.Group | null {
  if (!has(id)) return null;
  const o = buildPrefab(id, { lights: false, ...(tint !== undefined ? { tint } : {}) });
  const b = new THREE.Box3().setFromObject(o);
  const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  if (longest > 0) o.scale.setScalar(size / longest);
  o.position.set(x, y, z);
  o.rotation.y = yaw;
  return o;
}

/** A flat dark disc on the ice: an old hole. */
function holeDecal(x: number, z: number, r: number = ICE.holeR): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 18),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0x14202a }), LAYER.marking),
  );
  m.rotation.x = -HALF_PI;
  m.position.set(x, g(x, z) + 0.02, z);
  m.name = 'pond-hole';
  return m;
}

/** A flat paper or board lying on the ice, text readable from above with its top toward yaw. */
function flatBoard(text: string, x: number, z: number, yaw: number, w: number, h: number, bg: number): THREE.Mesh {
  const m = textPlate(text, x, g(x, z) + 0.03, z, 0, { w, h, bg });
  m.rotation.order = 'YXZ';
  m.rotation.set(-HALF_PI, yaw, 0);
  return m;
}

function pawPrint(x: number, z: number, yaw: number, mat: THREE.Material, geo: THREE.BufferGeometry): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -HALF_PI;
  m.rotation.z = yaw;
  m.position.set(x, g(x, z) + 0.02, z);
  m.name = 'pond-paw';
  return m;
}

export function buildPailPond(scene: THREE.Scene): PailPondScenery {
  const pieces: HomePiece[] = [];
  const life = new THREE.Group();
  life.name = 'pail-pond-life';
  const extraBoxes: Box[] = [];

  // ---- The sunk pail's rim: low galvanized segments on the circle, stepped over, with 2 cm gaps ----
  const SEG = 28;
  const R = C.r + 0.6;
  const chord = 2 * R * Math.sin(Math.PI / SEG);
  const rimGeo = new THREE.BoxGeometry(chord - 0.02, 0.35, 0.25);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa3a8, roughness: 0.5, metalness: 0.5 });
  const rim = new THREE.Group();
  rim.name = 'pail-rim';
  for (let i = 0; i < SEG; i++) {
    const a = ((i + 0.5) / SEG) * Math.PI * 2;
    const ap = R * Math.cos(Math.PI / SEG);
    const x = C.x + Math.cos(a) * ap, z = C.z + Math.sin(a) * ap;
    const seg = new THREE.Mesh(rimGeo, rimMat);
    seg.position.set(x, g(x, z) + 0.15, z);
    seg.rotation.y = -a - HALF_PI;
    seg.receiveShadow = true;
    rim.add(seg);
  }
  life.add(rim);

  // ---- The pail's handle arcs out of the ice at the north-east edge ----
  {
    const [hx, hz] = onCircle(-40, C.r + 1);
    pieces.push({ prefab: 'pail-handle', x: hx, z: hz, yaw: toCentre(hx, hz), size: 9, solid: false });
  }

  // ---- Shanties: Theo's red one on the ice, a blue one with its door ajar, a dark green one ----
  const SH = 2.6;
  const theoYaw = SHANTY.yaw ?? -HALF_PI;
  pieces.push({ prefab: 'ice-shanty', x: SHANTY.x, z: SHANTY.z, yaw: theoYaw, size: SH, solid: false });
  const blue = { x: -668, z: -1030 }, green = { x: -676, z: -1100 };
  const blueYaw = toCentre(blue.x, blue.z), greenYaw = toCentre(green.x, green.z);
  pieces.push({ prefab: 'ice-shanty', x: blue.x, z: blue.z, yaw: blueYaw, size: SH, solid: false, tint: 0x2e6b8f });
  pieces.push({ prefab: 'ice-shanty', x: green.x, z: green.z, yaw: greenYaw, size: SH, solid: false, tint: 0x6a8f2e });
  for (const s of [SHANTY, blue, green]) {
    extraBoxes.push({ minX: s.x - SHANTY_HALF, maxX: s.x + SHANTY_HALF, minZ: s.z - SHANTY_HALF, maxZ: s.z + SHANTY_HALF, h: g(s.x, s.z) + 2.2 });
  }
  const front = frontOf('ice-shanty', SH);
  const fx = (yaw: number, d: number): [number, number] => [Math.sin(yaw) * d, Math.cos(yaw) * d];

  // Theo's door plate, and the camp beside the shanty
  {
    const [dx, dz] = fx(theoYaw, front + 0.05);
    life.add(textPlate("THEO'S\nBACK IN FIVE\n(SINCE TUESDAY)", SHANTY.x + dx, g(SHANTY.x, SHANTY.z) + 1.5, SHANTY.z + dz, theoYaw,
      { w: 1.0, h: 0.5, bg: 0xe8e0c8 }));
    // beside = along the wall (perpendicular to the facing)
    const [sx, sz] = fx(theoYaw + HALF_PI, 1.9);
    const [ax, az] = fx(theoYaw - HALF_PI, 1.5);
    pieces.push({ prefab: 'stool', x: SHANTY.x + dx + sx * 0.6 + dx * 0.4, z: SHANTY.z + dz + sz * 0.6 + dz * 0.4, yaw: 0.5, size: 0.5, solid: false });
    pieces.push({ prefab: 'barrel', x: SHANTY.x + dx + sx, z: SHANTY.z + dz + sz, yaw: 0, size: 0.5, solid: false });
    pieces.push({ prefab: 'ice-auger', x: SHANTY.x + dx * 0.9 + ax, z: SHANTY.z + dz * 0.9 + az, yaw: theoYaw, size: 1.3, solid: false });
    pieces.push({ prefab: 'sardine-tin', x: SHANTY.x + dx * 1.6 + ax * 0.5, z: SHANTY.z + dz * 1.6 + az * 0.5, yaw: 0.8, size: 0.2, solid: false });
  }
  // blue shanty: GONE FISHING, the door ajar (the plate swings open on its edge)
  {
    const [dx, dz] = fx(blueYaw, front + 0.05);
    const p = textPlate('GONE FISHING\nBACK NEVER', blue.x + dx + Math.cos(blueYaw) * 0.45, g(blue.x, blue.z) + 1.4, blue.z + dz - Math.sin(blueYaw) * 0.45,
      blueYaw + 0.9, { w: 0.9, h: 0.5, bg: 0xf2e8c8 });
    life.add(p);
  }
  // green shanty: dark, no plate (a bear has been in)

  // ---- Theo himself: on his stool 3 m in front of the shanty, over an old hole ----
  const [tdx, tdz] = fx(theoYaw, 3);
  const stoolX = SHANTY.x + tdx, stoolZ = SHANTY.z + tdz;
  const [hdx, hdz] = fx(theoYaw, 0.95);
  pieces.push({ prefab: 'stool', x: stoolX, z: stoolZ, yaw: 0, size: 0.5, solid: false });
  life.add(holeDecal(stoolX + hdx, stoolZ + hdz));
  const stoolTop = 0.45; // a 0.5 m stool: seat about 0.4 m up
  const theo = makeGnome(life, {
    hat: 0x8a5a2b, shirt: 0x7a3b2e, pants: 0x3b3a4a, skin: 0xe0ac69, boots: 0x222222,
    beard: 0xbababa, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
    ...(has('ear-flap-hat') ? { equipment: { head: 'ear-flap-hat' } } : {}),
  });
  const theoY = g(stoolX, stoolZ) + Math.max(0.2, stoolTop - 0.2);
  theo.object.position.set(stoolX, theoY, stoolZ);
  theo.object.rotation.y = theoYaw;
  theo.object.name = 'pond-theo';
  const theoState = gnomeState(stoolX, theoY, stoolZ, theoYaw, 0, true);
  theo.update(theoState, 0);
  // his rod (a pivot at the hand so the tip can bob) and the thermos at his side
  const rodPivot = new THREE.Group();
  rodPivot.position.set(stoolX + fx(theoYaw, 0.35)[0], theoY + 0.55, stoolZ + fx(theoYaw, 0.35)[1]);
  rodPivot.rotation.order = 'YXZ';
  rodPivot.rotation.y = theoYaw;
  const rod = loose('fishing-rod', 0, 0, 0, 0, 1.6);
  if (rod) rodPivot.add(rod);
  life.add(rodPivot);
  const [thx, thz] = fx(theoYaw - HALF_PI, 0.5);
  const thermos = loose(has('thermos') ? 'thermos' : 'barrel', stoolX + thx, g(stoolX, stoolZ), stoolZ + thz, 0, 0.3, 0xb8302a);
  if (thermos) life.add(thermos);
  const thermosBase = thermos ? thermos.position.y : 0;

  // ---- Signs ----
  const signAt = (x: number, z: number, yaw: number, text: string): void => {
    pieces.push({ prefab: 'signpost', x, z, yaw, size: 1.8 });
    const [dx, dz] = fx(yaw, 0.25);
    life.add(textPlate(text, x + dx, g(x, z) + 1.35, z + dz, yaw, { w: 1.7, h: 0.75, bg: 0xe8e0c8 }));
  };
  signAt(C.x, C.z + C.r - 4, 0, 'PAIL POND\nTHIN ICE: NONE\nTHICK ICE: ALL OF IT');
  signAt(-604, -1026, toCentre(-604, -1026), 'HOA NOTICE\nICE HOLES MUST BE ROUND.\nSQUARE HOLES WILL BE FINED.');
  signAt(-648, -1090, toCentre(-648, -1090), 'DO NOT FEED THE BEARS\n(THEY HAVE SARDINES)');

  // ---- Vignette 1: four stools round an old hole, a tin in the middle, one stool tipped over in a hurry ----
  {
    const vx = -600, vz = -1075;
    life.add(holeDecal(vx, vz, 0.55));
    pieces.push({ prefab: 'sardine-tin', x: vx + 0.2, z: vz - 0.1, yaw: 0.4, size: 0.2, solid: false });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const sx = vx + Math.cos(a) * 1.7, sz = vz + Math.sin(a) * 1.7;
      if (i === 3) {
        const s = loose('stool', sx, g(sx, sz) + 0.15, sz, 0, 0.5);
        if (s) { s.rotation.order = 'YXZ'; s.rotation.set(1.4, a, 0); life.add(s); }
      } else {
        pieces.push({ prefab: 'stool', x: sx, z: sz, yaw: -a - HALF_PI, size: 0.5, solid: false });
      }
    }
  }

  // ---- Vignette 2: an abandoned hole with a rod frozen upright in it, a frosted thermos beside it ----
  {
    const x = -640, z = -1020; // open ice between the blue shanty and Theo's
    life.add(holeDecal(x, z));
    const r = loose('fishing-rod', x, g(x, z) - 0.2, z, 0.7, 1.6);
    if (r) { r.rotation.z = 0.12; life.add(r); }
    const t = loose(has('thermos') ? 'thermos' : 'barrel', x + 0.9, g(x, z), z + 0.3, 0.3, 0.3, 0xbfd8e6);
    if (t) life.add(t);
  }

  // ---- Vignette 3: bear paw prints from the shore to the dark shanty's door, and back out ----
  {
    const pawGeo = new THREE.CircleGeometry(0.16, 10);
    pawGeo.scale(1, 1.5, 1);
    const pawMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0x30424e }), LAYER.marking);
    const [ddx, ddz] = fx(greenYaw, front + 1.0);
    const door = { x: green.x + ddx, z: green.z + ddz };
    const [sx, sz] = onCircle((Math.atan2(green.z - C.z, green.x - C.x) * 180) / Math.PI + 22, 58);
    const dirX = door.x - sx, dirZ = door.z - sz, len = Math.hypot(dirX, dirZ);
    const nx = -dirZ / len, nz = dirX / len; // sideways
    const yawAlong = Math.atan2(dirX, dirZ);
    for (let i = 0; i < 5; i++) {
      const t = i / 4, side = (i % 2 ? 1 : -1) * 0.25;
      life.add(pawPrint(sx + dirX * t + nx * side, sz + dirZ * t + nz * side, -yawAlong, pawMat, pawGeo));
    }
    for (let i = 0; i < 4; i++) { // the way back: a wider, hurried stride, an arm's length to one side
      const t = 0.9 - i * 0.3, side = 1.1 + (i % 2 ? 0.25 : -0.25);
      life.add(pawPrint(sx + dirX * t + nx * side, sz + dirZ * t + nz * side, -yawAlong + Math.PI, pawMat, pawGeo));
    }
  }

  // ---- Vignette 4: a measuring board with a chalked fish ----
  life.add(flatBoard('<- THIS BIG ->', -620, -1012, 0.3, 1.5, 0.5, 0xd8d0b8));
  {
    const fish = flatBoard('><(((o>', -620.1, -1012.1, 0.3, 0.8, 0.22, 0xd8d0b8);
    fish.position.y += 0.012;
    fish.material = flatLayer(Array.isArray(fish.material) ? fish.material[0] : fish.material, LAYER.marking + 1);
    life.add(fish);
  }

  const boxes = [...buildPieces(scene, pieces, 'pail-pond'), ...extraBoxes];
  scene.add(life);

  return {
    boxes,
    update(_dt, t, px, pz) {
      if (Math.hypot(px - C.x, pz - C.z) > ACTIVE_R) return;
      // jig: the rod tip bobs at 1.5 Hz
      rodPivot.rotation.x = 0.9 + Math.sin(t * Math.PI * 2 * 1.5) * 0.05;
      theo.update(theoState, 0);
      theo.arms.right.rotation.x = -1.1 + Math.sin(t * Math.PI * 2 * 1.5) * 0.08;
      // every 10 s he lifts the thermos for a second
      if (thermos) {
        const k = t % 10;
        const up = k < 1.2 ? Math.sin((k / 1.2) * Math.PI) : 0;
        thermos.position.y = thermosBase + up * 0.45;
        thermos.rotation.x = up * 0.5;
      }
    },
  };
}
