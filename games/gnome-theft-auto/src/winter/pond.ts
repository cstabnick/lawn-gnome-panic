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

  // ---- The sunk pail's rim: a bright zinc band with vertical ribs and a rolled lip, three crossings ----
  const SEG = 56;
  const R = C.r + 0.6;
  const RIM_H = 1.2; // above the snow outside
  const WALL_T = 0.4;
  const chord = 2 * R * Math.sin(Math.PI / SEG);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd2dade, roughness: 0.4, metalness: 0.2, emissive: 0x8d989e });
  const ribMat = new THREE.MeshStandardMaterial({ color: 0xeef3f5, roughness: 0.45, metalness: 0.2, emissive: 0xb4bec4 });
  const lipGeo = new THREE.CylinderGeometry(0.17, 0.17, chord + 0.12, 8);
  lipGeo.rotateZ(HALF_PI);
  const ribGeo = new THREE.BoxGeometry(0.14, 1, 0.12);
  const capGeo = new THREE.SphereGeometry(0.19, 8, 6);
  /** Crossings (degrees round the pond, +z = 90): south to the band road, Theo's, east to the lodge. */
  const CROSS_DEG = [90, 36, -6];
  const CROSS_HALF = 3.3;
  const angDiff = (a: number, b: number): number => {
    let d = (a - b) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return Math.abs(d);
  };
  const isGap = (i: number): boolean => {
    const deg = (((((i % SEG) + SEG) % SEG) + 0.5) / SEG) * 360;
    return CROSS_DEG.some((c) => angDiff(deg, c) < CROSS_HALF);
  };
  const rim = new THREE.Group();
  rim.name = 'pail-rim';
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI * 2, a1 = ((i + 1) / SEG) * Math.PI * 2;
    if (isGap(i)) {
      // roll the rim ends where it opens for a crossing
      for (const [n, ae] of [[i - 1, a0], [i + 1, a1]] as const) {
        if (isGap(n)) continue;
        const x = C.x + Math.cos(ae) * R, z = C.z + Math.sin(ae) * R;
        const cap = new THREE.Mesh(capGeo, rimMat);
        cap.position.set(x, g(x, z) + RIM_H, z);
        rim.add(cap);
      }
      continue;
    }
    const a = (a0 + a1) / 2;
    const ap = R * Math.cos(Math.PI / SEG);
    const x = C.x + Math.cos(a) * ap, z = C.z + Math.sin(a) * ap;
    // follow the ground: the wall runs from below its lowest end up to RIM_H above its highest
    const gs = [g(x, z), g(C.x + Math.cos(a0) * (R + 0.2), C.z + Math.sin(a0) * (R + 0.2)),
      g(C.x + Math.cos(a1) * (R + 0.2), C.z + Math.sin(a1) * (R + 0.2))];
    const lo = Math.min(...gs) - 0.4, hi = Math.max(...gs) + RIM_H;
    const seg = new THREE.Group();
    seg.position.set(x, 0, z);
    seg.rotation.y = -a - HALF_PI; // local +z points at the pond centre
    const wall = new THREE.Mesh(new THREE.BoxGeometry(chord + 0.04, hi - lo, WALL_T), rimMat);
    wall.position.y = (lo + hi) / 2;
    wall.receiveShadow = true;
    seg.add(wall);
    const lip = new THREE.Mesh(lipGeo, rimMat);
    lip.position.set(0, hi, 0);
    seg.add(lip);
    for (let k = 0; k < 3; k++) { // a rib about every 2 m
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.scale.y = hi - lo - 0.1;
      rib.position.set((k - 1) * (chord / 3), (lo + hi) / 2 - 0.05, -(WALL_T / 2 + 0.05));
      seg.add(rib);
    }
    rim.add(seg);
  }
  life.add(rim);

  // ---- The pail's handle: a big wire arc standing over the far (north) rim, clear of it from the road ----
  {
    const [hx, hz] = onCircle(-90, C.r + 0.4);
    pieces.push({ prefab: 'pail-handle', x: hx, z: hz, yaw: toCentre(hx, hz), size: 26, y: RIM_H - 0.3, solid: false });
  }

  // ---- Shanties: Theo's red one on the ice, a blue one with its door ajar, a dark green one ----
  const SH = 2.6;
  const theoYaw = SHANTY.yaw ?? -HALF_PI;
  pieces.push({ prefab: 'ice-shanty', x: SHANTY.x, z: SHANTY.z, yaw: theoYaw, size: SH, solid: false });
  // a little village: the blue and green shanties stand round Theo's stool, 14-18 m from his door
  const blue = { x: -602, z: -1030 }, green = { x: -624, z: -1054 };
  const campX = SHANTY.x + Math.sin(theoYaw) * 3, campZ = SHANTY.z + Math.cos(theoYaw) * 3;
  const blueYaw = Math.atan2(campX - blue.x, campZ - blue.z), greenYaw = Math.atan2(campX - green.x, campZ - green.z);
  /** Every flat decal centre already laid on the ice (holes, paws): boot prints keep off them. */
  const decals: Array<[number, number, number]> = [];
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
  decals.push([stoolX + hdx, stoolZ + hdz, 1.1]);
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
  signAt(-594, -1044, toCentre(-594, -1044), 'HOA NOTICE\nICE HOLES MUST BE ROUND.\nSQUARE HOLES WILL BE FINED.');
  signAt(-648, -1090, toCentre(-648, -1090), 'DO NOT FEED THE BEARS\n(THEY HAVE SARDINES)');

  // ---- Vignette 1: four stools round an old hole, a tin in the middle, one stool tipped over in a hurry ----
  {
    const vx = -600, vz = -1075;
    life.add(holeDecal(vx, vz, 0.55));
    decals.push([vx, vz, 2.4]);
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
    decals.push([x, z, 1.5]);
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
    const [sx, sz] = onCircle(165, 58); // the bear came across the ice from the west shore
    const dirX = door.x - sx, dirZ = door.z - sz, len = Math.hypot(dirX, dirZ);
    const nx = -dirZ / len, nz = dirX / len; // sideways
    const yawAlong = Math.atan2(dirX, dirZ);
    for (let i = 0; i < 5; i++) {
      const t = i / 4, side = (i % 2 ? 1 : -1) * 0.25;
      life.add(pawPrint(sx + dirX * t + nx * side, sz + dirZ * t + nz * side, -yawAlong, pawMat, pawGeo));
      decals.push([sx + dirX * t + nx * side, sz + dirZ * t + nz * side, 0.5]);
    }
    for (let i = 0; i < 4; i++) { // the way back: a wider, hurried stride, an arm's length to one side
      const t = 0.9 - i * 0.3, side = 1.1 + (i % 2 ? 0.25 : -0.25);
      life.add(pawPrint(sx + dirX * t + nx * side, sz + dirZ * t + nz * side, -yawAlong + Math.PI, pawMat, pawGeo));
      decals.push([sx + dirX * t + nx * side, sz + dirZ * t + nz * side, 0.5]);
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

  // ---- The village: a sled path of boot prints from the south crossing past all three doors, flags, two jiggers ----
  {
    const door = (s: { x: number; z: number }, yaw: number, d: number): [number, number] => {
      const [dx, dz] = fx(yaw, d);
      return [s.x + dx, s.z + dz];
    };
    const gD = door(green, greenYaw, front + 1.6), bD = door(blue, blueYaw, front + 1.6);
    const tD: [number, number] = [SHANTY.x + fx(theoYaw, front + 1.6)[0], SHANTY.z - 2.3];
    const [cx0, cz0] = onCircle(90, C.r - 1);
    const route: Array<[number, number]> = [[cx0, cz0], [-638, -1030], gD, [campX - 2.5, campZ + 2.4], tD, [-607, -1034], bD];
    const bootGeo = new THREE.CircleGeometry(0.12, 8);
    bootGeo.scale(1, 1.7, 1);
    const bootMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0x8aa0b0 }), LAYER.marking);
    let step = 0;
    for (let i = 0; i + 1 < route.length; i++) {
      const [ax, az] = route[i]!, [bx, bz] = route[i + 1]!;
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      const ux = dx / len, uz = dz / len, yaw = Math.atan2(ux, uz);
      for (let d = 0; d < len; d += 0.85, step++) {
        const side = (step % 2 ? 1 : -1) * 0.2;
        const px = ax + ux * d - uz * side, pz = az + uz * d + ux * side;
        if (decals.some(([qx, qz, qr]) => Math.hypot(px - qx, pz - qz) < qr)) continue;
        if (Math.hypot(px - SHANTY.x, pz - SHANTY.z) < 1.8 || Math.hypot(px - blue.x, pz - blue.z) < 1.8 || Math.hypot(px - green.x, pz - green.z) < 1.8) continue;
        life.add(pawPrint(px, pz, -yaw, bootMat, bootGeo));
      }
    }

    // marker flags, orange, round the village
    for (const [fxp, fzp] of [[-633, -1031], [-607, -1022], [-633, -1062], [-598, -1058]] as const) {
      const f = loose('slalom-flag', fxp, g(fxp, fzp), fzp, (fxp * 7) % 3, 2.4, 0xff7a1a);
      if (f) life.add(f);
    }

    // two gnomes jigging on stools: one in front of the blue shanty over its own hole, one at the stool vignette
    const jigger = (look: { hat: number; shirt: number }, x: number, z: number, yaw: number): void => {
      const gn = makeGnome(life, {
        hat: look.hat, shirt: look.shirt, pants: 0x3b3a4a, skin: 0xe0ac69, boots: 0x222222,
        beard: 0xd8d8d8, hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
      });
      const y = g(x, z) + 0.25;
      gn.object.position.set(x, y, z);
      gn.object.rotation.y = yaw;
      gn.update(gnomeState(x, y, z, yaw, 0, true), 0);
      const rodP = loose('fishing-rod', x + Math.sin(yaw) * 0.35, y + 0.55, z + Math.cos(yaw) * 0.35, yaw, 1.6);
      if (rodP) { rodP.rotation.order = 'YXZ'; rodP.rotation.x = 0.9; life.add(rodP); }
    };
    {
      const [sx, sz] = door(blue, blueYaw, front + 2.6);
      pieces.push({ prefab: has('camp-stool') ? 'camp-stool' : 'stool', x: sx, z: sz, yaw: blueYaw, size: 0.5, solid: false });
      const [hx2, hz2] = fx(blueYaw, 0.95);
      life.add(holeDecal(sx + hx2, sz + hz2));
      jigger({ hat: 0x2e6b8f, shirt: 0xd9a441 }, sx, sz, blueYaw);
    }
    {
      const vx = -600, vz = -1075, a = 0.4;
      const sx = vx + Math.cos(a) * 1.7, sz = vz + Math.sin(a) * 1.7;
      jigger({ hat: 0xc0392b, shirt: 0x2e5e4e }, sx, sz, Math.atan2(vx - sx, vz - sz));
    }
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
