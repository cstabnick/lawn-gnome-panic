// The Unmown's story vignettes, Oldroot Wood and the Last Dandelion (E31). Props only: the preserve tells its story
// without words. Everything static goes through placePieces (culled batches); only the sign and the mown stripe are
// built by hand (a text plane and a ground strip).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { heightAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import { LAST_DANDELION, STATION, UNMOWN_HIDES, BOARDWALK } from '../living/config';
import { placePieces, roadDist, seeded, type Piece } from '../living/place';

/** The preserve's main loop trail (centre line), also used to keep props and people clear of it. */
const LOOP: readonly (readonly [number, number])[] = [
  [-1560, -1172], [-1600, -1350], [-1500, -1500], [-1300, -1460], [-1150, -1470],
  [-900, -1560], [-750, -1460], [-550, -1440], [-330, -1560], [-300, -1460],
];

function segDist(x: number, z: number, a: readonly [number, number], b: readonly [number, number]): number {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)) : 0;
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

/** Distance from (x, z) to the nearest trail or road centre line. */
function trailDist(x: number, z: number): number {
  let best = roadDist(x, z);
  for (let i = 0; i + 1 < LOOP.length; i++) best = Math.min(best, segDist(x, z, LOOP[i], LOOP[i + 1]));
  return best;
}

/** True when (x, z) is 4 m off the trails and clear of the hides, the boardwalk legs and the station site. */
function clearSpot(x: number, z: number): boolean {
  if (trailDist(x, z) < 4) return false;
  for (const h of UNMOWN_HIDES) if (Math.hypot(x - h.x, z - h.z) < 12) return false;
  for (const [bx, bz] of BOARDWALK) if (Math.hypot(x - bx, z - bz) < 6) return false;
  if (x > STATION.x - STATION.hw - 6 && x < STATION.x + STATION.hw + 6 && z > STATION.z - STATION.hd - 6 && z < STATION.z + STATION.hd + 6) return false;
  return true;
}

const WOOD = { x0: -1780, x1: -1560, z0: -1710, z1: -1410 };
const MEADOW = { x0: -780, x1: -340, z0: -1760, z1: -1520 };
const MARSH = { x0: -1260, x1: -1040, z0: -1705, z1: -1605 };

function inBox(r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

/** Builds the preserve vignettes, Oldroot Wood dressing and the Last Dandelion. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownVignettes(scene: THREE.Scene, boxes: Box[]): void {
  const rnd = seeded(31005);
  const story: Piece[] = [];
  const add = (p: Piece) => { if (clearSpot(p.x, p.z)) story.push(p); };

  // The Last Dandelion, with one log bench five metres away facing it (south of it, looking north).
  const D = LAST_DANDELION;
  story.push({ id: 'last-dandelion', x: D.x, z: D.z, scale: 1.2 });
  story.push({ id: 'log-bench', x: D.x, z: D.z + 5, yaw: Math.PI });

  // 1. The HOA survey that never came back (Long Meadow): tripod and tape swallowed by grass, a hat on top, a clipboard.
  const sx = -700, sz = -1640;
  add({ id: 'camera-tripod', x: sx, z: sz, yaw: 0.4 });
  add({ id: 'site-hazard-tape', x: sx + 1.6, z: sz + 0.8, yaw: 1.1, scale: 0.6 });
  add({ id: 'hoa-traffic-hat', x: sx - 0.9, z: sz - 0.6, yaw: 2, scale: 0.7, lift: 0.9 });
  add({ id: 'time-card-clip', x: sx + 0.8, z: sz - 1.2, yaw: 0.7, scale: 1.4, lift: 0.02 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    add({ id: i % 2 ? 'giant-grass-blade' : 'ornamental-grass', x: sx + Math.cos(a) * 1.4, z: sz + Math.sin(a) * 1.4, yaw: rnd() * 6, scale: 1.6 });
  }

  // 2. The mower that tried: rust ride-on, a one-metre stripe behind it, tall grass in front.
  const mx = -600, mz = -1590;
  add({ id: 'ride-on-mower', x: mx, z: mz, yaw: Math.PI, tint: 0x8a4b2a });
  for (let i = 0; i < 7; i++) {
    add({ id: i % 2 ? 'giant-grass-blade' : 'ornamental-grass', x: mx - 2.5 + i * 0.5, z: mz - 2.6 - rnd() * 1.5, yaw: rnd() * 6, scale: 2.2 });
  }
  // The stripe runs south (behind a mower that faces north, yaw PI) for 14 m, one metre wide.
  if (clearSpot(mx, mz + 8)) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 14),
      flatLayer(new THREE.MeshLambertMaterial({ color: 0x9fc95a }), LAYER.marking),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(mx, heightAt(mx, mz + 8) + 0.03, mz + 8);
    strip.name = 'mown-stripe';
    scene.add(strip);
  }

  // 3. The picnic the ants won, at the meadow's edge near the trail: blanket, tipped basket, crumbs into the grass.
  const px = -470, pz = -1500;
  add({ id: 'rug', x: px, z: pz, yaw: 0.3, scale: 0.9, lift: 0.03 });
  add({ id: 'wicker-basket', x: px + 0.4, z: pz - 0.2, yaw: 1.9, lift: 0.05 });
  for (let i = 0; i < 6; i++) add({ id: 'bait-acorn-crumb', x: px - 1.4 - i * 0.7, z: pz - 1 - i * 0.55 - rnd() * 0.2, yaw: rnd() * 6, scale: 0.5 });
  for (let i = 0; i < 4; i++) add({ id: 'ornamental-grass', x: px - 5 - i * 0.5, z: pz - 4.4 - i * 0.4, yaw: rnd() * 6, scale: 1.8 });

  // 4. The birdwatchers' argument at the marsh's north shore: two chairs back to back, two flasks, binoculars between.
  const bx = -1180, bz = -1590;
  add({ id: 'deck-chair', x: bx - 1.5, z: bz, yaw: Math.PI / 2 });
  add({ id: 'deck-chair', x: bx + 1.5, z: bz, yaw: -Math.PI / 2 });
  add({ id: 'honeydew-flask', x: bx - 2.3, z: bz + 0.6, scale: 0.8 });
  add({ id: 'honeydew-flask', x: bx + 2.3, z: bz - 0.6, scale: 0.8 });
  add({ id: 'field-binoculars', x: bx, z: bz + 0.1, yaw: 0.8, lift: 0.04 });

  // 5. The ranger's lost hat: on a bramble at the wood's edge, a ladder underneath, a "Back in 5 min" stake.
  const hx = -1650, hz = -1420;
  add({ id: 'flowering-bush', x: hx, z: hz, scale: 1.1 });
  add({ id: 'ranger-campaign-hat', x: hx, z: hz, scale: 0.9, lift: 1.1, yaw: 0.5 });
  add({ id: 'ladder', x: hx + 1.2, z: hz + 1.4, yaw: 1.2, lift: 0.04 });
  add({ id: 'street-bollard', x: hx - 1.6, z: hz + 1.2, scale: 0.4 });
  if (clearSpot(hx - 1.6, hz + 1.2)) {
    scene.add(textPlate('Back in\n5 min', hx - 1.6, heightAt(hx - 1.6, hz + 1.2) + 0.55, hz + 1.2 + 0.1, 0, { w: 0.6, h: 0.3, bg: 0xf2e6c0, fg: 0x3a2a10 }));
  }

  // 6. The fairy ring: ten toadstools in Oldroot Wood around a tiny gnome-size chair.
  const fx = -1690, fz = -1560;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    add({ id: i % 3 === 0 ? 'capwood-toadstool-squat' : 'red-mushroom', x: fx + Math.cos(a) * 3, z: fz + Math.sin(a) * 3, yaw: rnd() * 6, scale: 0.7 });
  }
  add({ id: 'chair', x: fx, z: fz, yaw: 0.5, scale: 0.35 });

  placePieces(scene, boxes, story, 'unmown-vignettes');

  // Oldroot Wood: big old trees (small trunk colliders), logs, moss, ferns.
  const trunks: [number, number][] = [];
  const wood: Piece[] = [];
  const treeIds = ['giant-oak', 'island-oak', 'broadleaf-tree'];
  for (let tries = 0; tries < 400 && trunks.length < 34; tries++) {
    const x = WOOD.x0 + rnd() * (WOOD.x1 - WOOD.x0), z = WOOD.z0 + rnd() * (WOOD.z1 - WOOD.z0);
    if (!clearSpot(x, z) || trunks.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 7)) continue;
    if (Math.hypot(x - fx, z - fz) < 6 || Math.hypot(x - hx, z - hz) < 5) continue;
    trunks.push([x, z]);
    wood.push({ id: treeIds[trunks.length % treeIds.length], x, z, yaw: rnd() * 6.28, scale: 1.3 + rnd() * 0.5 });
    boxes.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6, h: heightAt(x, z) + 4 });
  }
  for (let i = 0; i < 40; i++) {
    const x = WOOD.x0 + rnd() * (WOOD.x1 - WOOD.x0), z = WOOD.z0 + rnd() * (WOOD.z1 - WOOD.z0);
    if (!clearSpot(x, z) || trunks.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 2.5)) continue;
    if (Math.hypot(x - fx, z - fz) < 5 || Math.hypot(x - hx, z - hz) < 4) continue;
    const k = i % 4;
    wood.push({ id: k === 0 ? 'fallen-log' : k === 1 ? 'moss-clump' : 'fern-clump', x, z, yaw: rnd() * 6.28, scale: k === 0 ? 1.2 + rnd() * 0.5 : 1 + rnd() * 0.6 });
  }
  placePieces(scene, boxes, wood, 'oldroot-wood');

  // Long Meadow: wildflowers and tall grass, nothing solid.
  const meadow: Piece[] = [];
  for (let i = 0; i < 90; i++) {
    const x = MEADOW.x0 + rnd() * (MEADOW.x1 - MEADOW.x0), z = MEADOW.z0 + rnd() * (MEADOW.z1 - MEADOW.z0);
    if (!clearSpot(x, z) || inBox(MARSH, x, z)) continue;
    const k = i % 3;
    meadow.push({ id: k === 0 ? 'wildflower-patch' : k === 1 ? 'grass-tuft' : 'giant-grass-blade', x, z, yaw: rnd() * 6.28, scale: 0.9 + rnd() * 0.9 });
  }
  placePieces(scene, boxes, meadow, 'long-meadow');
}

/** A spot `off` m from the loop trail at fraction `t` of segment `seg`, on `side` of it, facing the trail. */
function besideTrail(seg: number, t: number, side: 1 | -1, off = 4.5): { x: number; z: number; yaw: number } {
  const [ax, az] = LOOP[seg], [bx, bz] = LOOP[seg + 1];
  const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
  const nx = (-dz / l) * side, nz = (dx / l) * side;
  return { x: ax + dx * t + nx * off, z: az + dz * t + nz * off, yaw: Math.atan2(-nx, -nz) };
}

/** The people of the Unmown: the rangers and the visitors (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function unmownPeople(): AmbientGnomeDef[] {
  const door = STATION.door;
  const pip = besideTrail(5, 0.5, 1); // marsh north-shore side of the trail
  const inspector = besideTrail(7, 0.5, -1, 5);
  const birder = besideTrail(6, 0.3, 1, 5);
  const child = { x: LAST_DANDELION.x - 3, z: LAST_DANDELION.z + 3, yaw: Math.atan2(3, -3) + Math.PI };
  return [
    {
      id: 'unmown-burdock', name: 'Head Ranger Burdock Haybright', x: door.x + 4, z: door.z + 5, yaw: Math.PI,
      look: { hat: 0x6b7a2e, shirt: 0xc2b280, pants: 0x4a4a3a, skin: 0xe8b894, beard: 0xf2f2f0 },
      idle: 'read',
      bubble: 'Twelve species before lunch. Thirteen if you count the HOA inspector hiding in the reeds.',
    },
    {
      id: 'unmown-pip', name: 'Junior Ranger Pip Tussock', ...pip,
      look: { hat: 0x6b7a2e, shirt: 0xc2b280, pants: 0x4a4a3a, skin: 0xf0c8a0, beard: null },
      idle: 'look-around',
      bubble: 'Four thousand and six reeds. Four thousand and seven. Please stop walking past, you keep moving them.',
    },
    {
      id: 'unmown-inspector', name: 'Mr. Pettigrew, off duty', ...inspector,
      look: { hat: 0x2c3e50, shirt: 0xe8e8e8, pants: 0x303030, skin: 0xe8b894, beard: 0x555555, glasses: true },
      idle: 'cross-arms',
      bubble: 'I am not measuring anything. This is a personal ruler.',
    },
    {
      id: 'unmown-birder', name: 'Marigold the birder', ...birder,
      look: { hat: 0x8a5a2b, shirt: 0x4f7a4a, pants: 0x5a4632, skin: 0xd9a37a, beard: null, glasses: true },
      idle: 'think',
      bubble: "Shh. That is either a rare warbler or somebody's kettle. Either way, I am thrilled.",
    },
    {
      id: 'unmown-sketcher', name: 'Little Fennel', ...child,
      look: { hat: 0xe0a030, shirt: 0xb04a6a, pants: 0x3b6ea5, skin: 0xf0c8a0, beard: null },
      idle: 'sit-ground',
      bubble: 'I have drawn it eleven times. It looks different every time. Grandpa says that is how you know it is real.',
    },
  ];
}
