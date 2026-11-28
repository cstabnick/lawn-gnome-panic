// Capwood's plan (E14): every placement, sign, vignette and resident of the toadstool forest as plain, seeded data.
// forest.ts turns it into meshes and colliders; forest.test.ts checks it (inside the site, clear of the Capwood Run,
// the hut, the Great Ring and the six cap-count spots, no two stems overlapping). No three.js here.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import { nearTrack } from '../raceTrack/tracks';
import { CAP_COUNT_SPOTS, GREAT_RING, WARDEN_HUT } from './spots';

/** The `toadstool-forest` site rectangle (x 100..400, z -1280..-1080). */
export const FOREST_RECT = { minX: 100, maxX: 400, minZ: -1280, maxZ: -1080 } as const;
/** The middle of the forest, where the toadstools stand thickest. */
export const FOREST_CENTRE = { x: 250, z: -1180 } as const;

/** Where the Warden stands to be talked to (the spot outside her door; nothing solid within 3 m of it). */
export const WARDEN_DOOR = { x: 360, z: -1249, yaw: Math.PI } as const;
/**
 * The hut's collider: a round box a little behind the cottage's middle, so the door-step stays 3 m clear of every
 * collider. (The cottage itself is r 3.)
 */
export const HUT_COLLIDER = { x: 360, z: -1243.5, r: 2.4, h: 5 } as const;

/** Keep-out radii used by the generator and checked by the test (metres). */
export const KEEP = { hut: 12, ringExtra: 4, spot: 6, track: 4, edge: 6 } as const;

/** Footprint radius each stem kind needs from its neighbours (cap overhang included for the tall ones). */
export const SPACING_R: Readonly<Record<string, number>> = {
  'capwood-toadstool-tall': 2.2,
  'capwood-toadstool-squat': 2.0,
  'capwood-toadstool-cluster': 1.7,
  'capwood-puffball': 1.1,
};

const CAP_TINTS = [0xc8382e, 0xd9622b, 0xb5652a, 0xa8442a, 0xe0842f, 0x8a4b2a, 0xcf4a2c];

export interface CapwoodPlan {
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
}

/** Props that were placed by hand (the keep-outs do not apply to them). */
export const HAND_PLACED = new Set<PlanProp>();

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Collider a stem gets (walk and drive under the caps: the box tops out below the cap). */
function stemSolid(id: string, s: number): PlanProp['solid'] {
  if (id === 'capwood-toadstool-tall') return { r: 0.8 * s, h: 5 * s };
  if (id === 'capwood-toadstool-squat') return { r: 1.0 * s, h: 2.2 * s };
  if (id === 'capwood-puffball') return { r: 1.0 * s, h: 2 * s };
  return undefined;
}

function buildPlan(): CapwoodPlan {
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const rng = mulberry32(0xcab400d);
  const stems: { x: number; z: number; r: number }[] = [];

  const hand = (p: PlanProp): PlanProp => { props.push(p); HAND_PLACED.add(p); return p; };
  const stem = (id: string, x: number, z: number, scale: number, tint?: number, yaw = 0): PlanProp => {
    const p = hand({ id, x, z, yaw, scale, tint, solid: stemSolid(id, scale) });
    stems.push({ x, z, r: SPACING_R[id] * (id === 'capwood-toadstool-tall' ? 1 : scale) });
    return p;
  };
  const faceYaw = (fx: number, fz: number, tx: number, tz: number): number => Math.atan2(tx - fx, tz - fz);
  /** A plaque on a wooden post (the post stands just behind it). */
  const sign = (text: string, x: number, z: number, yaw: number, opts: { y?: number; w?: number; h?: number } = {}): void => {
    signs.push({ kind: 'plaque', text, x, z, yaw, y: opts.y ?? 1.25, w: opts.w ?? 1.5, h: opts.h ?? 0.6 });
    hand({ id: 'wooden-post', x: x - Math.sin(yaw) * 0.12, z: z - Math.cos(yaw) * 0.12, yaw, scale: 0.9 });
  };

  // ---- The six cap-count spots: a cap each, a white ticket-flag stuck beside it ----
  CAP_COUNT_SPOTS.forEach((sp, i) => {
    const id = i % 2 === 0 ? 'capwood-toadstool-tall' : 'capwood-toadstool-squat';
    stem(id, sp.x, sp.z, id === 'capwood-toadstool-tall' ? 1.1 : 1.3, CAP_TINTS[i % CAP_TINTS.length], i * 1.3);
    hand({ id: 'capwood-stage-flag', x: sp.x + 1.7, z: sp.z + 0.9, scale: 0.5, tint: 0xffffff, yaw: i * 0.9 });
  });

  // ---- The Great Ring: sixteen glowing toadstools round the clearing ----
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    hand({ id: 'mushroom-lamp', x: GREAT_RING.x + Math.cos(a) * 12, z: GREAT_RING.z + Math.sin(a) * 12, scale: 1.8, yaw: a });
  }

  // ---- Story vignettes ----
  // 1. The bruised cap: a mower nose-first in a bruised cap, a ticket under its wiper, a dropped pen.
  stem('capwood-toadstool-tall', 300, -1129, 1.1, 0x7a3a4a);
  const mowerYaw = faceYaw(302.3, -1127.4, 300, -1129);
  hand({ id: 'zero-turn-mower', x: 302.3, z: -1127.4, yaw: mowerYaw, solid: { r: 1.0, h: 1.1 } });
  hand({ id: 'ticket-stub', x: 302.3, z: -1127.4, y: 0.95, yaw: mowerYaw });
  hand({ id: 'dibber', x: 303.6, z: -1126.2, y: 0.06, rot: [Math.PI / 2, 0.8, 0], scale: 0.6 });
  vignettes.push({
    id: 'bruised-cap', name: 'The Bruised Cap', x: 301, z: -1128,
    story: 'A mower is nose-first in the stem of a cap gone purple. A ticket is stuck under its wiper and a pen lies in the moss: the Warden has been, and the driver has gone to find somewhere to be sorry.',
  });
  // 2. The picnic nobody finished, under a cap, with an umbrella open beneath it.
  stem('capwood-toadstool-tall', 231, -1103, 1.2, 0xd9622b);
  hand({ id: 'dayg-story-picnic', x: 231, z: -1099.6 });
  hand({ id: 'glaze-canopy-umbrella', x: 232.4, z: -1099, scale: 0.9 });
  hand({ id: 'wicker-basket', x: 229.5, z: -1098.6, y: 0.25, rot: [0, 0.5, Math.PI / 2] });
  vignettes.push({
    id: 'picnic', name: 'The Abandoned Picnic', x: 231, z: -1099.6,
    story: 'A picnic is laid out under a giant cap, the basket on its side and an umbrella open over the cloth. It was not raining. Something dripped from the cap, and nobody stayed to find out what.',
  });
  // 3. The half-dug hole by a stump: spade standing, spoil heaped, the "do not dig" sign knocked flat.
  hand({ id: 'tree-stump', x: 165, z: -1235, scale: 1.3, solid: { r: 0.6, h: 0.6 } });
  hand({ id: 'dibber', x: 166.6, z: -1234.2, scale: 2.6 });
  hand({ id: 'compost-heap', x: 167.6, z: -1236.8 });
  hand({ id: 'wooden-post', x: 163.2, z: -1233.4, y: 0.12, rot: [0, 0.6, Math.PI / 2], scale: 0.9 });
  signs.push({ kind: 'plaque', text: 'TALL-ONE WOOD\nDO NOT DIG', x: 163.2, z: -1233.4, yaw: 0.4, y: 0.32, w: 1.2, h: 0.5 });
  vignettes.push({
    id: 'half-dug-hole', name: 'The Half-Dug Hole', x: 165.5, z: -1235,
    story: 'Someone started a hole by a stump and left the spade standing in it. The Tall-One wood sign is flat on the moss, and the heap of spoil is a little too tidy to be the whole story.',
  });
  // 4. The photographer's spot: tripod and folding stool aimed at the Great Ring.
  const ringYaw = faceYaw(172, -1106, GREAT_RING.x, GREAT_RING.z);
  hand({ id: 'camera-tripod', x: 172, z: -1106, yaw: ringYaw, scale: 1.1 });
  hand({ id: 'stool', x: 170.3, z: -1104.4, yaw: ringYaw, scale: 0.9 });
  vignettes.push({
    id: 'ring-watcher', name: "The Photographer's Spot", x: 171.2, z: -1105.2,
    story: 'A tripod and a folding stool are aimed at the Great Ring. The stool is worn smooth: its owner has sat here a great many nights, and has not yet got the photograph.',
  });
  // 5. The Warden's fine board and the acorn sacks beside it.
  hand({ id: 'notice-board', x: 368, z: -1252, yaw: Math.PI, scale: 1.1 });
  signs.push({
    kind: 'plaque', text: 'FINES\nBruised cap: 11 acorns\nLicked cap: 4 acorns\nLoud spores: a warning',
    x: 368, z: -1252.15, yaw: Math.PI, y: 1.35, w: 1.2, h: 0.8,
  });
  hand({ id: 'sack', x: 366.4, z: -1254, scale: 0.9, yaw: 0.4 });
  hand({ id: 'sack', x: 369.8, z: -1254.3, scale: 0.9, yaw: -0.3 });
  vignettes.push({
    id: 'fine-board', name: "The Warden's Fine Board", x: 368, z: -1253,
    story: 'A notice board by the Warden\'s door lists the fines in the Warden\'s own hand, and two sacks of acorns beside it are the proof that people pay. The board has been corrected twice. Both times upward.',
  });

  // ---- Signs ----
  sign('CAPWOOD.\nSection Nine applies.', 305, -1090, Math.PI / 2);
  sign('DO NOT LICK THE CAPS.\n(Section Four)', 255, -1098, Math.PI / 3);
  sign('FINES PAYABLE IN ACORNS\nOR A SINCERE APOLOGY', 352, -1252, Math.PI);
  sign('BRUISE-FREE ZONE', 240, -1218, 0, { w: 1.6, h: 0.45 });
  sign('MIND THE ROOTS.\nThey were here first.', 140, -1210, Math.PI / 4);
  sign('THE GREAT RING\nLooking is allowed (Section Eleven)', 150, -1103, 0, { w: 1.7, h: 0.7 });

  // ---- Fixed keep-out stems: the hut and the ring join the spacing list ----
  stems.push({ x: WARDEN_HUT.x, z: WARDEN_HUT.z, r: 3.5 });
  stems.push({ x: GREAT_RING.x, z: GREAT_RING.z, r: GREAT_RING.r + KEEP.ringExtra });

  // ---- The forest itself: density highest round the centre, thinning at the edges ----
  const w = (FOREST_RECT.maxX - FOREST_RECT.minX) / 2;
  const d = (FOREST_RECT.maxZ - FOREST_RECT.minZ) / 2;
  const density = (x: number, z: number): number => {
    const u = (x - FOREST_CENTRE.x) / w, v = (z - FOREST_CENTRE.z) / d;
    return Math.max(0.1, 1 - (u * u + v * v) * 0.9);
  };
  const free = (x: number, z: number, r: number): boolean => {
    if (x < FOREST_RECT.minX + KEEP.edge || x > FOREST_RECT.maxX - KEEP.edge) return false;
    if (z < FOREST_RECT.minZ + KEEP.edge || z > FOREST_RECT.maxZ - KEEP.edge) return false;
    if (nearTrack(x, z, KEEP.track)) return false;
    if (Math.hypot(x - WARDEN_HUT.x, z - WARDEN_HUT.z) < KEEP.hut) return false;
    if (Math.hypot(x - GREAT_RING.x, z - GREAT_RING.z) < GREAT_RING.r + KEEP.ringExtra + r) return false;
    if (Math.hypot(x - WARDEN_DOOR.x, z - WARDEN_DOOR.z) < 6) return false;
    for (const s of CAP_COUNT_SPOTS) if (Math.hypot(x - s.x, z - s.z) < KEEP.spot + r) return false;
    for (const o of stems) if (Math.hypot(x - o.x, z - o.z) < o.r + r + 1) return false;
    return true;
  };
  const scatter = (id: string, count: number, scaleOf: (u: number) => number, tinted: boolean): void => {
    let placed = 0;
    for (let tries = 0; tries < 4000 && placed < count; tries++) {
      const x = FOREST_RECT.minX + rng() * (FOREST_RECT.maxX - FOREST_RECT.minX);
      const z = FOREST_RECT.minZ + rng() * (FOREST_RECT.maxZ - FOREST_RECT.minZ);
      if (rng() > density(x, z)) continue;
      const s = scaleOf(rng());
      const r = SPACING_R[id] * (id === 'capwood-toadstool-tall' ? 1 : s);
      if (!free(x, z, r)) continue;
      stems.push({ x, z, r });
      props.push({
        id, x, z, yaw: rng() * Math.PI * 2, scale: s,
        tint: tinted ? CAP_TINTS[Math.floor(rng() * CAP_TINTS.length)] : undefined,
        solid: stemSolid(id, s),
      });
      placed++;
    }
  };
  scatter('capwood-toadstool-tall', 20, (u) => 0.7 + u * 0.6, true);
  scatter('capwood-toadstool-squat', 35, (u) => 0.8 + u * 0.5, true);
  scatter('capwood-toadstool-cluster', 45, (u) => 0.8 + u * 0.5, true);
  scatter('capwood-puffball', 15, (u) => 0.8 + u * 0.6, false);
  // Small filler: red mushrooms and the odd mushroom lamp, no colliders.
  const filler = (id: string, count: number, lo: number, hi: number): void => {
    let placed = 0;
    for (let tries = 0; tries < 3000 && placed < count; tries++) {
      const x = FOREST_RECT.minX + rng() * (FOREST_RECT.maxX - FOREST_RECT.minX);
      const z = FOREST_RECT.minZ + rng() * (FOREST_RECT.maxZ - FOREST_RECT.minZ);
      if (rng() > density(x, z) || !free(x, z, 0.4)) continue;
      props.push({ id, x, z, yaw: rng() * Math.PI * 2, scale: lo + rng() * (hi - lo) });
      placed++;
    }
  };
  filler('red-mushroom', 40, 2, 3.2);
  filler('mushroom-lamp', 10, 1, 1.5);

  // ---- Residents ----
  const residents: AmbientGnomeDef[] = [
    {
      id: 'capwood-chanterelle', name: 'Warden Chanterelle Stook', x: 357.4, z: -1250.6, yaw: 0, idle: 'take-notes',
      look: { hat: 0x7a4a2b, shirt: 0x4f7a3a, pants: 0x3a5a2c, skin: 0xf1c27d, boots: 0x2a2018, beard: 0x9a9a9a, hair: null },
      bubble: 'That is a bruised cap. Section nine. Eleven acorns.',
    },
    {
      id: 'capwood-sweeper', name: 'Bracken Pell', x: 322, z: -1224, yaw: 2.2, idle: 'sweep',
      look: { hat: 0xb5652a, shirt: 0x8a8f4a, pants: 0x4a3a2a, skin: 0xe0b484, beard: 0xc9b99a },
      bubble: 'Sweeping spores. They come back. Section Twelve says that is not my fault.',
    },
    {
      id: 'capwood-forager', name: 'Fennel Ostler', x: 212, z: -1160, yaw: -0.8, idle: 'look-around',
      look: { hat: 0x6b8f3a, shirt: 0xd8c9a0, pants: 0x5a4a32, skin: 0xf1c27d, beard: null },
      bubble: 'Shh. Not that one, it is bruised. This one has not noticed me yet.',
    },
    {
      id: 'capwood-watcher', name: 'Orris Lens', x: 173.6, z: -1104, yaw: ringYaw, idle: 'point',
      look: { hat: 0x2e3a52, shirt: 0x5a5a66, pants: 0x2c2c34, skin: 0xd9a574, beard: 0x555555, glasses: true },
      bubble: 'It glows at night. I am told it glows tonight. I have been told that for six years.',
    },
  ];

  return { props, signs, vignettes, residents };
}

export const CAPWOOD_PLAN: CapwoodPlan = buildPlan();
