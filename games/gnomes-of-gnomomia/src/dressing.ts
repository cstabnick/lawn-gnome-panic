// Dressing: every zone's fixed set pieces, built once for the whole world: houses, shrines, village flowers, lakes,
// the feral camp, barrows and burrow, signposts, walls, decks with their ramps, teleport exit rings and road pass gates.
// Every position is a world position (content.ts moved each zone by its origin). terrain.ts already adds colliders for
// houses, shrines, zone walls, indoor ring walls and deck posts; this file adds the rest (camp, barrows, burrow, signposts).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { TUNING, type Deck, type ZoneDef, type ZoneExit } from './config';
import { ZONES } from './content';
import { checkCondition } from './quests';
import { addCollider, deckLayout, heightAt, passOpen, passes, type Pass } from './terrain';
import { isTeleportExit } from './zones';

const ZONE_LIST: readonly ZoneDef[] = Object.values(ZONES);

interface ExitView { exit: ZoneExit; group: THREE.Group }
interface GateView { pass: Pass; group: THREE.Group }

/** Teleport exit rings and signs, so their visibility can follow each exit's `when`. Rebuilt by buildDressing. */
let exitViews: ExitView[] = [];
/** Pass gates (one per end of each road pass), shown while the pass is closed. Rebuilt by buildDressing. */
let gateViews: GateView[] = [];
/** Outdoor prefabs (such as campfires) placed inside the world group that input.ts should raycast. */
let interactablePrefabs: THREE.Object3D[] = [];

export function getInteractablePrefabs(): readonly THREE.Object3D[] {
  return interactablePrefabs;
}

/** One shared flat-shaded Lambert material per colour. Rebuilt by buildDressing. */
let mats = new Map<number, THREE.MeshLambertMaterial>();

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function lambert(color: number): THREE.MeshLambertMaterial {
  let m = mats.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    mats.set(color, m);
  }
  return m;
}

/** A shadow-casting mesh with a flat-shaded colour, added to parent at (x, y, z). */
function addMesh(geo: THREE.BufferGeometry, color: number, parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, lambert(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** A wall segment from (x1, z1) to (x2, z2): a box only (no colliders; terrain adds those for walls). */
function addWall(x1: number, z1: number, x2: number, z2: number, height: number, color: number, parent: THREE.Object3D): void {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
  const wall = addMesh(new THREE.BoxGeometry(1.5, height, len), color, parent, mx, heightAt(mx, mz) + height / 2, mz);
  wall.rotation.y = Math.atan2(dx, dz);
}

/** A canvas label for an exit sign. */
function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#fff3d0';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64, 480);
  }
  return new THREE.CanvasTexture(canvas);
}

/** A post with a label board, set r + 1.4 m to the side of `parent`'s origin. Used by exits and pass ends. */
function buildSignpost(label: string, r: number, parent: THREE.Object3D): void {
  const sx = r + 1.4;
  addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, parent, sx, 0.9, 0);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: labelTexture(label), side: THREE.DoubleSide }),
  );
  board.position.set(sx, 1.9, 0);
  parent.add(board);
}

/** A glowing ring on the ground at a teleport exit, with a signpost beside it. */
function buildTeleportExit(exit: ZoneExit, parent: THREE.Object3D): void {
  if (exit.door) {
    buildDoormat(exit, parent);
    return;
  }
  const group = new THREE.Group();
  group.position.set(exit.x, heightAt(exit.x, exit.z), exit.z);
  parent.add(group);
  const ringMat = new THREE.MeshLambertMaterial({ color: 0x7ff7ff, emissive: 0x2ac8ff, emissiveIntensity: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(exit.r * 0.75, exit.r, 32).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.12;
  group.add(ring);
  buildSignpost(exit.label, exit.r, group);
  exitViews.push({ exit, group });
}

/** A house door's exit (either side): a doormat on the ground, no ring or sign. */
function buildDoormat(exit: ZoneExit, parent: THREE.Object3D): void {
  const group = new THREE.Group();
  group.position.set(exit.x, heightAt(exit.x, exit.z), exit.z);
  parent.add(group);
  const mat = addMesh(new THREE.BoxGeometry(1.3, 0.06, 0.9), 0x8a3c20, group, 0, 0.04, 0);
  mat.castShadow = false;
  addMesh(new THREE.BoxGeometry(1.0, 0.07, 0.6), 0xb5562f, group, 0, 0.05, 0).castShadow = false;
  exitViews.push({ exit, group });
}

/** One house, with a door on the side that faces its yaw. No collider: terrain adds it. */
function buildHouse(h: ZoneDef['houses'][number], parent: THREE.Object3D): void {
  const r = h.r;
  const g = new THREE.Group();
  g.position.set(h.x, heightAt(h.x, h.z), h.z);
  parent.add(g);
  let windowed = true;
  switch (h.style) {
    case 'mushroom': {
      addMesh(new THREE.CylinderGeometry(r * 0.7, r * 0.85, 3, 10), 0xf2e6c8, g, 0, 1.5, 0);
      const cap = addMesh(new THREE.SphereGeometry(r * 1.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8352e, g, 0, 2.8, 0);
      cap.scale.y = 0.8;
      // Eight white spots on the cap.
      const R = r * 1.35 * 1.02;
      const th = 0.7;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        addMesh(new THREE.SphereGeometry(0.25, 6, 4), 0xffffff, g, R * Math.sin(th) * Math.cos(a), 2.8 + 0.8 * R * Math.cos(th), R * Math.sin(th) * Math.sin(a));
      }
      break;
    }
    case 'thatch':
      addMesh(new THREE.CylinderGeometry(r * 0.85, r * 0.95, 2.6, 10), 0xd9b56a, g, 0, 1.3, 0);
      addMesh(new THREE.ConeGeometry(r * 1.15, 2.4, 10), 0xb8862e, g, 0, 3.8, 0);
      break;
    case 'stone':
      addMesh(new THREE.CylinderGeometry(r * 0.9, r * 0.95, 2.8, 8), 0x9a9a92, g, 0, 1.4, 0);
      addMesh(new THREE.ConeGeometry(r * 1.1, 1.4, 8), 0x6e6e68, g, 0, 3.5, 0);
      break;
    case 'log': {
      addMesh(new THREE.BoxGeometry(r * 1.6, 2.4, r * 1.6), 0x8b5a2b, g, 0, 1.2, 0);
      const roof = addMesh(new THREE.ConeGeometry(r * 1.2, 1.6, 4), 0x5a3a1e, g, 0, 3.2, 0);
      roof.rotation.y = Math.PI / 4;
      break;
    }
    case 'tent':
      addMesh(new THREE.ConeGeometry(r * 1.2, 3.2, 6), 0xc8b07a, g, 0, 1.6, 0);
      windowed = false;
      break;
    case 'pot':
      addMesh(new THREE.CylinderGeometry(r * 0.55, r * 0.8, 2.4, 12), 0xb5562f, g, 0, 1.2, 0);
      addMesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.35, 12), 0xc96a3c, g, 0, 2.5, 0);
      windowed = false;
      break;
  }
  // Door faces the house's yaw.
  const door = addMesh(new THREE.BoxGeometry(1, 1.6, 0.2), 0x5a3a1e, g, Math.sin(h.yaw) * r * 0.86, 0.8, Math.cos(h.yaw) * r * 0.86);
  door.rotation.y = h.yaw;
  if (windowed) {
    const wy = h.yaw + Math.PI / 2;
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0xfff2a8 }));
    win.position.set(Math.sin(wy) * r * 0.86, 2.0, Math.cos(wy) * r * 0.86);
    win.rotation.y = wy;
    g.add(win);
  }
}

/** The shrine: a well for mossbottom, otherwise a small stone shrine. No collider: terrain adds it. */
function buildShrine(zone: ZoneDef, parent: THREE.Object3D): void {
  const s = zone.shrine;
  const wg = new THREE.Group();
  wg.position.set(s.x, heightAt(s.x, s.z), s.z);
  parent.add(wg);
  if (zone.id === 'mossbottom') {
    addMesh(new THREE.CylinderGeometry(1.2, 1.3, 0.9, 12, 1, true), 0x8d8d8d, wg, 0, 0.45, 0);
    addMesh(new THREE.CircleGeometry(1.1, 12).rotateX(-Math.PI / 2), 0x1d3a52, wg, 0, 0.5, 0);
    addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, -1.1, 0.9, 0);
    addMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15), 0x8b6a3e, wg, 1.1, 0.9, 0);
    addMesh(new THREE.ConeGeometry(1.5, 0.9, 4), 0x8b4a2b, wg, 0, 2.25, 0);
  } else {
    addMesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), 0x8f8f88, wg, 0, 0.25, 0);
    addMesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), 0x9c9c94, wg, 0, 1.3, 0);
    addMesh(new THREE.BoxGeometry(1.6, 0.35, 1.6), 0x7a7a72, wg, 0, 2.27, 0);
    addMesh(new THREE.SphereGeometry(0.25, 8, 6), 0x9fe6ff, wg, 0, 2.7, 0);
  }
}

/** Village flowers round a zone's shrine (40 per outdoor zone). No colliders. */
function buildFlowers(zone: ZoneDef, rng: () => number, parent: THREE.Object3D): void {
  const shrine = zone.shrine;
  const flowerGeo = new THREE.SphereGeometry(0.15, 6, 4);
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
  const flowerColours = [0xff6fa8, 0xffe14f, 0xb36bff, 0xffffff];
  let flowers = 0;
  for (let tries = 0; flowers < 40 && tries < 2000; tries++) {
    const a = rng() * Math.PI * 2;
    const d = 20 * Math.sqrt(rng());
    const x = shrine.x + Math.cos(a) * d;
    const z = shrine.z + Math.sin(a) * d;
    if (zone.houses.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 0.8)) continue;
    if (Math.hypot(x - shrine.x, z - shrine.z) < 1.2 + 0.8) continue;
    const y = heightAt(x, z);
    addMesh(stemGeo, 0x3f8f3a, parent, x, y + 0.25, z);
    addMesh(flowerGeo, flowerColours[Math.floor(rng() * flowerColours.length)], parent, x, y + 0.55, z);
    flowers++;
  }
}

/** Three tents round a campfire. Colliders for the tents and the fire. */
function buildCamp(camp: ZoneDef['regions'][number], parent: THREE.Object3D): void {
  const campY = heightAt(camp.x, camp.z);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + 0.5;
    const tx = camp.x + 8 * Math.cos(a);
    const tz = camp.z + 8 * Math.sin(a);
    addMesh(new THREE.ConeGeometry(2.2, 3, 6), k % 2 ? 0x6a5a40 : 0x7d6a4f, parent, tx, heightAt(tx, tz) + 1.5, tz);
    addCollider(tx, tz, 2);
  }
  const campfire = buildPrefab('campfire', { scale: 2.5 });
  campfire.position.set(camp.x, campY, camp.z);
  parent.add(campfire);
  interactablePrefabs.push(campfire);
  addCollider(camp.x, camp.z, 1);
}

/** Beetle Barrows: standing stones in a ring, and two grassy mounds. */
function buildBarrows(barrows: ZoneDef['regions'][number], rng: () => number, parent: THREE.Object3D): void {
  const stoneGeo = new THREE.BoxGeometry(1.2, 3.5, 0.8);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const sx = barrows.x + 13 * Math.cos(a);
    const sz = barrows.z + 13 * Math.sin(a);
    const stone = addMesh(stoneGeo, 0x7f7f78, parent, sx, heightAt(sx, sz) + 1.75, sz);
    stone.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.1);
    addCollider(sx, sz, 0.9);
  }
  for (const a of [0, Math.PI]) {
    const mx = barrows.x + 6 * Math.cos(a);
    const mz = barrows.z + 6 * Math.sin(a);
    const mound = addMesh(new THREE.SphereGeometry(4, 10, 6), 0x6f8a55, parent, mx, heightAt(mx, mz), mz);
    mound.scale.y = 0.35;
    addCollider(mx, mz, 3.2);
  }
}

/** Grubthorn's Burrow: dirt heaps round a black pit. */
function buildBurrow(burrow: ZoneDef['regions'][number], parent: THREE.Object3D): void {
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const hx = burrow.x + 10 * Math.cos(a);
    const hz = burrow.z + 10 * Math.sin(a);
    addMesh(new THREE.ConeGeometry(2.2, 2, 7), 0x6b5038, parent, hx, heightAt(hx, hz) + 1, hz);
    addCollider(hx, hz, 1.8);
  }
  addMesh(new THREE.CircleGeometry(2.2, 16).rotateX(-Math.PI / 2), 0x1a120c, parent, burrow.x, heightAt(burrow.x, burrow.z) + 0.05, burrow.z);
}

/** A signpost halfway from the shrine to each region that is off the shrine. */
function buildRegionSigns(zone: ZoneDef, parent: THREE.Object3D): void {
  const shrine = zone.shrine;
  for (const r of zone.regions) {
    if (Math.hypot(r.x - shrine.x, r.z - shrine.z) <= 1) continue;
    const mx = (shrine.x + r.x) / 2;
    const mz = (shrine.z + r.z) / 2;
    const my = heightAt(mx, mz);
    addMesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), 0x8b6a3e, parent, mx, my + 0.8, mz);
    const board = addMesh(new THREE.BoxGeometry(1.2, 0.35, 0.08), 0x8b6a3e, parent, mx, my + 1.4, mz);
    board.rotation.y = Math.atan2(r.x - shrine.x, r.z - shrine.z);
    addCollider(mx, mz, 0.3);
  }
}

/** A road pass's closed gate at one end: two posts, two bars across the road, and a 'Closed' board. */
function buildGate(end: ZoneExit, p: Pass, parent: THREE.Object3D): THREE.Group {
  const group = new THREE.Group();
  group.position.set(end.x, heightAt(end.x, end.z), end.z);
  // Local z runs along the road (from pass end a to end b), local x across it.
  group.rotation.y = Math.atan2(p.b.x - p.a.x, p.b.z - p.a.z);
  parent.add(group);
  for (const px of [-3.2, 3.2]) addMesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), 0x5a3a1e, group, px, 1.1, 0);
  addMesh(new THREE.BoxGeometry(6.8, 0.3, 0.3), 0x8b6a3e, group, 0, 1.6, 0);
  addMesh(new THREE.BoxGeometry(6.8, 0.3, 0.3), 0x8b6a3e, group, 0, 0.8, 0);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.6),
    new THREE.MeshBasicMaterial({ map: labelTexture('Closed'), side: THREE.DoubleSide }),
  );
  board.position.set(0, 2.6, 0);
  group.add(board);
  return group;
}

/** Shrine-to-deck decks: a floor on posts, railings round it (a gap on the stair side), and a ramp down to the ground.
 * Pushes the floor and ramp meshes into `clickable`: they are what a click lands on. */
function buildDeck(deck: Deck, top: number, parent: THREE.Object3D, clickable: THREE.Object3D[]): void {
  const colour = deck.style === 'stone' ? 0x9a9a92 : 0x8b6a3e;
  const minX = deck.x - deck.w / 2, maxX = deck.x + deck.w / 2;
  const minZ = deck.z - deck.d / 2, maxZ = deck.z + deck.d / 2;

  // Floor: its top surface is at `top`.
  clickable.push(addMesh(new THREE.BoxGeometry(deck.w, 0.3, deck.d), colour, parent, deck.x, top - 0.15, deck.z));

  // Posts at the four corners, from the ground up to the floor.
  for (const px of [minX + 0.3, maxX - 0.3]) {
    for (const pz of [minZ + 0.3, maxZ - 0.3]) {
      const ground = heightAt(px, pz);
      const h = Math.max(0.05, top - ground);
      addMesh(new THREE.CylinderGeometry(0.2, 0.2, h), colour, parent, px, ground + h / 2, pz);
    }
  }

  // Railings along all four edges, with a 2.4 m gap centred on the stair side.
  const railY = top + 0.45;
  const rail = (x1: number, z1: number, x2: number, z2: number) => {
    if (z1 === z2) {
      const len = Math.abs(x2 - x1);
      if (len > 0.01) addMesh(new THREE.BoxGeometry(len, 0.9, 0.1), colour, parent, (x1 + x2) / 2, railY, z1);
    } else {
      const len = Math.abs(z2 - z1);
      if (len > 0.01) addMesh(new THREE.BoxGeometry(0.1, 0.9, len), colour, parent, x1, railY, (z1 + z2) / 2);
    }
  };
  const edge = (lo: number, hi: number, mid: number, gapped: boolean): [number, number][] =>
    gapped ? [[lo, mid - 1.2], [mid + 1.2, hi]] : [[lo, hi]];
  for (const [a, b] of edge(minX, maxX, deck.x, deck.stair === 'n')) rail(a, minZ, b, minZ);
  for (const [a, b] of edge(minX, maxX, deck.x, deck.stair === 's')) rail(a, maxZ, b, maxZ);
  for (const [a, b] of edge(minZ, maxZ, deck.z, deck.stair === 'w')) rail(minX, a, minX, b);
  for (const [a, b] of edge(minZ, maxZ, deck.z, deck.stair === 'e')) rail(maxX, a, maxX, b);

  // Ramp: from the deck's edge on the stair side, `run` metres out to the ground.
  const run = 2 * deck.y;
  const away: Record<Deck['stair'], [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const [ux, uz] = away[deck.stair];
  const edgeX = deck.stair === 'e' ? maxX : deck.stair === 'w' ? minX : deck.x;
  const edgeZ = deck.stair === 's' ? maxZ : deck.stair === 'n' ? minZ : deck.z;
  const footX = edgeX + ux * run, footZ = edgeZ + uz * run;
  const footY = heightAt(footX, footZ);
  const rise = top - footY;
  const length = Math.hypot(run, rise);
  const tilt = Math.atan2(rise, run);
  const midX = edgeX + (ux * run) / 2, midZ = edgeZ + (uz * run) / 2, midY = (top + footY) / 2;
  let ramp: THREE.Mesh;
  if (deck.stair === 'n' || deck.stair === 's') {
    ramp = addMesh(new THREE.BoxGeometry(2.4, 0.2, length), colour, parent, midX, midY, midZ);
    // Local +z is the away direction for 's' and the reverse for 'n'. Rotation.x = +t lowers local +z, so:
    // 's': rotation.x = +tilt puts the far end (local +z, the foot) lower; 'n': rotation.x = -tilt puts local -z (the foot) lower.
    ramp.rotation.x = deck.stair === 's' ? tilt : -tilt;
  } else {
    ramp = addMesh(new THREE.BoxGeometry(length, 0.2, 2.4), colour, parent, midX, midY, midZ);
    // Rotation.z = +t lifts local +x. 'e': rotation.z = -tilt puts local +x (the foot) lower; 'w': +tilt puts local -x lower.
    ramp.rotation.z = deck.stair === 'e' ? -tilt : tilt;
  }
  clickable.push(ramp);
}

/** Builds every zone's set pieces into `root` (one group per zone, plus one for the road passes) and returns the
 * meshes a click may land on to walk there (deck floors and ramps). Called once by world.ts. */
export function buildDressing(root: THREE.Group): THREE.Object3D[] {
  mats = new Map();
  exitViews = [];
  gateViews = [];
  interactablePrefabs = [];
  const clickable: THREE.Object3D[] = [];
  const layouts = deckLayout();

  ZONE_LIST.forEach((zone, index) => {
    const group = new THREE.Group();
    root.add(group);

    for (const h of zone.houses) buildHouse(h, group);
    if (!zone.interior) buildShrine(zone, group);   // an interior's shrine is just its respawn spot

    // Lakes: water only.
    for (const lake of zone.lakes) {
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(lake.r * 1.4, 40).rotateX(-Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.8 }),
      );
      water.position.set(lake.x, TUNING.waterLevel, lake.z);
      group.add(water);
    }

    // Walls, and the ring round an indoor zone.
    const wallColour = zone.indoor ? 0x8b4a3a : 0x8a8a84;
    for (const w of zone.walls ?? []) addWall(w.x1, w.z1, w.x2, w.z2, 4, wallColour, group);
    if (zone.indoor && !zone.interior) {
      const o = zone.origin!;
      const h = zone.half - 0.75;
      addWall(o.x - h, o.z - h, o.x + h, o.z - h, 8, 0x8b4a3a, group);
      addWall(o.x + h, o.z - h, o.x + h, o.z + h, 8, 0x8b4a3a, group);
      addWall(o.x + h, o.z + h, o.x - h, o.z + h, 8, 0x8b4a3a, group);
      addWall(o.x - h, o.z + h, o.x - h, o.z - h, 8, 0x8b4a3a, group);
    }

    if (!zone.indoor) buildFlowers(zone, mulberry32(7 + index), group);

    const camp = zone.regions.find((r) => r.id === 'camp');
    if (camp) buildCamp(camp, group);
    const barrows = zone.regions.find((r) => r.id === 'barrows');
    if (barrows) buildBarrows(barrows, mulberry32(31 + index), group);
    const burrow = zone.regions.find((r) => r.id === 'burrow');
    if (burrow) buildBurrow(burrow, group);
    buildRegionSigns(zone, group);

    // Teleport exits (not the road exits between outdoor zones).
    for (const exit of zone.exits) {
      if (isTeleportExit(zone.id, exit.to)) buildTeleportExit(exit, group);
    }

    // Decks of this zone, matched to their layout entry for the floor height.
    for (const deck of zone.decks ?? []) {
      const layout = layouts.find((l) => l.deck === deck);
      const top = layout ? layout.top : heightAt(deck.x, deck.z) + deck.y;
      buildDeck(deck, top, group, clickable);
    }
  });

  // Road passes: a signpost at each end, and a gate at each end shown while the pass is closed.
  const roadGroup = new THREE.Group();
  root.add(roadGroup);
  for (const p of passes()) {
    for (const end of [p.a, p.b]) {
      const sign = new THREE.Group();
      sign.position.set(end.x, heightAt(end.x, end.z), end.z);
      roadGroup.add(sign);
      buildSignpost(end.label, end.r, sign);
      const gate = buildGate(end, p, roadGroup);
      gateViews.push({ pass: p, group: gate });
    }
  }

  return clickable;
}

/** Per frame: shows teleport exit rings whose `when` holds, and a gate on each pass that is closed. */
export function updateDressing(): void {
  for (const v of exitViews) v.group.visible = checkCondition(v.exit.when);
  for (const g of gateViews) g.group.visible = !passOpen(g.pass);
}
