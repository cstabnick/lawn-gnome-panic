// Hedgeworth Links (batch 3 E15, docs/roadmaps/gta-batch-3/E15/roadmap.md): the golf course in the neighbour's yard
// west of Tallgrass Commons, entered through the Kicked Board (a loose board in the yard's fence). Real golf through
// the shared @lawn/golf package (Gnome Golf's clubs, swing meter, ball flight, lies, wind and par).
// Pure types, places, tuning and ids only: no three.js, no DOM. World coordinates: +x east, +z south (north is -z),
// metres; yaw 0 faces +z, a facing vector is (sin yaw, cos yaw). Everything lies inside the E01 site `golf-yard`
// (x -1360..-1000, z 410..974, flat ground at about y -2.25); golf/places.test.ts checks it. E32 (batch 3) grew the site
// south over the Bottom Garden (z 829..974), where holes 4 to 8 were finally built (R-226).
import type { ClubId, HoleDef, Lie, ShotResult, SwingState, Wind } from '@lawn/golf';
import type { GnomeLook } from '@lawn/gnome';
import type { InputState, Blip } from '../types';

// ---- Scale: the golf frame ------------------------------------------------------------------------------------------
// @lawn/golf works in yards on its own flat frame. Hedgeworth is played in "gnome yards": one gnome yard is YD metres
// (half a Tall-One yard, R-193), so a driver's 205 yd carry is 102 m and four holes fit in the yard. The golf frame is
// the world frame shifted to GOLF_ORIGIN and divided by YD; the axes point the same way, so a yaw is the same number in
// both. Golf heights are world heights over the yard floor, divided by YD, plus GOLF_LIFT (so the package's sea check,
// which fires below 0, never does: water at Hedgeworth is the ponds' 'water' lie).

/** Metres per gnome yard. */
export const YD = 0.5;
/** World point of golf (0, 0): the E15 site centre (kept when E32 grew the site south, so golf frames do not move). */
export const GOLF_ORIGIN = { x: -1180, z: 620 } as const;
/** Added to every golf-frame height (yards). */
export const GOLF_LIFT = 1;

/** World (x, z) metres -> golf frame (yards). */
export function toGolf(x: number, z: number): { x: number; z: number } {
  return { x: (x - GOLF_ORIGIN.x) / YD, z: (z - GOLF_ORIGIN.z) / YD };
}
/** Golf frame (yards) -> world (x, z) metres. */
export function toWorld(gx: number, gz: number): { x: number; z: number } {
  return { x: GOLF_ORIGIN.x + gx * YD, z: GOLF_ORIGIN.z + gz * YD };
}

// ---- The yard ----------------------------------------------------------------------------------------------------

/** The E01 site `golf-yard` as a rectangle (keep in step with west-estates.level.json). */
export const YARD = { minX: -1360, maxX: -1000, minZ: 410, maxZ: 974 } as const;
/** The Bottom Garden (E32): the strip south of the old south fence where holes 4 to 8 lie. */
export const BOTTOM_GARDEN = { minX: -1360, maxX: -1000, minZ: 829, maxZ: 974 } as const;
/** The old south fence (E15's boundary, kept standing between the course and the Bottom Garden): a board fence along
 *  z = OLD_FENCE.z from the west fence to the east fence, with the Turn Gate (an open garden gate) in it. */
export const OLD_FENCE = { z: 829 } as const;
/** The Turn Gate: the gap in the old fence between hole 3's green / hole 9's tee and the Bottom Garden. Open, walk and
 *  drive through. `half` = half the opening, along x. */
export const TURN_GATE = { x: -1140, z: 829, half: 3 } as const;
/** The potting shed in the Bottom Garden whose flat roof is hole 7's tee (yaw 0: door faces +z, south, away from play).
 *  `roofY` = roof deck height over the ground, metres; a ladder stands against its east wall at `ladder`. */
export const POTTING_SHED = { x: -1178, z: 953, w: 8, d: 6, yaw: 0, roofY: 2.6, ladder: { x: -1173.6, z: 953 } } as const;
/** The neighbour's board fence runs this far inside the site edge, all the way round (x or z of its centre line). */
export const FENCE_INSET = 1;
/** Fence height (a Tall-One garden fence: tall to a gnome), metres. */
export const FENCE_H = 2.6;

/** The Kicked Board: the loose board in the east fence. Broken by a vehicle at BOARD_BREAK_SPEED m/s or a kick (E on
 *  foot). Once broken it stays broken (saved). `half` = half the gap it leaves, along the fence (z). */
export const KICKED_BOARD = { x: -1001, z: 640, half: 2.6, yaw: -Math.PI / 2 } as const;
export const BOARD_BREAK_SPEED = 5;
/** The kick prompt range on foot, metres (either side of the fence). */
export const BOARD_KICK_RANGE = 2.5;

/** The Members' Gate: wrought iron, east fence at the cart-path approach from `west-band-south`. Always locked. */
export const MEMBERS_GATE = { x: -1001, z: 500, half: 3.5, yaw: -Math.PI / 2 } as const;

/** The clubhouse: centre, footprint (w along x, d along z), front door faces south (+z) onto the terrace. */
export const CLUBHOUSE = { x: -1060, z: 446, w: 26, d: 14, yaw: 0, door: { x: -1060, z: 455 }, doorOut: { x: -1060, z: 458 } } as const;
/** Basil's cottage by the first tee (his home, E10 registerHome). Door faces south. */
export const PRO_COTTAGE = { x: -1100, z: 444, w: 10, d: 8, yaw: 0, door: { x: -1100, z: 449 } } as const;
/** Thrift's shed by the "ninth" green (the 4th hole: R-194). Door faces west, toward the green. */
export const SHED = { x: -1048, z: 605, w: 8, d: 6, yaw: -Math.PI / 2, door: { x: -1052, z: 605 } } as const;
/** The cart shelter beside the clubhouse and its two golf carts (vehicle kind 'golf-cart'). */
export const CART_SHELTER = { x: -1028, z: 452, w: 12, d: 8, yaw: 0 } as const;
export const CART_SPOTS: readonly { x: number; z: number; yaw: number }[] = [
  { x: -1032, z: 466, yaw: 0 },
  { x: -1026, z: 466, yaw: 0 },
];
/** The terrace in front of the clubhouse (Peony stands here; tables and parasols). */
export const TERRACE = { minX: -1074, maxX: -1046, minZ: 455, maxZ: 465 } as const;

/** The clubhouse interior (E05 defineInterior id) and its size (metres). */
export const CLUBHOUSE_INTERIOR = 'hedgeworth-clubhouse';
export const CLUBHOUSE_ROOM = { w: 22, d: 14, h: 4.2 } as const;

/** Cart paths: polylines (world metres), 3 m wide, painted gravel; carts and gnomes can use any of the course too. */
export const CART_PATH_W = 3;
export const CART_PATHS: readonly (readonly [number, number][])[] = [
  // From the Members' Gate in along the clubhouse.
  [[-1003, 500], [-1030, 500], [-1030, 470], [-1045, 466]],
  // The loop: first tee, along the north edge to the 2nd tee, down the west side, along the south edge, up to the
  // "ninth" green and the shed, back to the gate path.
  [[-1030, 500], [-1075, 497], [-1180, 497], [-1270, 492], [-1300, 520], [-1345, 600], [-1348, 700], [-1310, 770],
    [-1240, 805], [-1160, 805], [-1110, 790], [-1060, 740], [-1030, 680], [-1025, 600], [-1030, 500]],
  // E32: from the loop through the Turn Gate and along the middle of the Bottom Garden, west to the maze and the Drip.
  [[-1160, 805], [-1140, 822], [-1140, 840], [-1148, 895], [-1280, 898]],
  // E32: the short spur east toward the rhubarb patch (hole 8's green and hole 7's).
  [[-1148, 895], [-1112, 898]],
];

// ---- The holes ---------------------------------------------------------------------------------------------------
// E15 built four holes on a loop, numbered 1, 2, 3 and 9 on the card (R-194: "a nine-hole course" reads better on the
// mortgage papers). E32 built the missing 4 to 8 in the Bottom Garden (R-226), so the card is finally true. The array
// index is stable for saves (index 3 is still The Ninth); play order is HOLE_ORDER (by card number).
// Positions in world metres; `holeYards` (golf/course.ts) converts a hole for @lawn/golf.

export interface Circle { x: number; z: number; r: number }

export interface HedgeworthHole {
  /** 0..8, the save's index (stable: 0..3 are E15's holes 1, 2, 3, 9; 4..8 are holes 4..8). */
  index: number;
  /** The number painted on the tee sign and the card. */
  number: number;
  name: string;
  par: number;
  tee: { x: number; z: number };
  /** Fairway centreline: tee, any dogleg corners, green centre. */
  path: readonly { x: number; z: number }[];
  /** Full fairway width and where it starts (metres from the tee). */
  fairwayWidth: number;
  fairwayStart: number;
  /** Green centre and radius; tilt as rise in metres per metre along x and z (putts break). */
  green: { x: number; z: number; r: number; slopeX: number; slopeZ: number };
  pin: { x: number; z: number };
  bunkers: readonly Circle[];
  ponds: readonly Circle[];
  /** An elevated tee (hole 7, the potting-shed roof): the tee box stands this many metres over the ground. */
  teeY?: number;
}

export const HOLES: readonly HedgeworthHole[] = [
  {
    index: 0, number: 1, name: 'The Mortgage', par: 4,
    tee: { x: -1080, z: 482 },
    path: [{ x: -1080, z: 482 }, { x: -1180, z: 478 }, { x: -1250, z: 472 }],
    fairwayWidth: 26, fairwayStart: 30,
    green: { x: -1250, z: 472, r: 11, slopeX: -0.008, slopeZ: 0.004 },
    pin: { x: -1253, z: 470 },
    bunkers: [{ x: -1232, z: 487, r: 5 }, { x: -1180, z: 463, r: 6 }],
    ponds: [],
  },
  {
    index: 1, number: 2, name: "Vesper's Patience", par: 3,
    tee: { x: -1285, z: 503 },
    path: [{ x: -1285, z: 503 }, { x: -1295, z: 585 }],
    fairwayWidth: 22, fairwayStart: 25,
    green: { x: -1295, z: 585, r: 10, slopeX: 0.006, slopeZ: 0.009 },
    pin: { x: -1297, z: 588 },
    bunkers: [{ x: -1282, z: 597, r: 4 }, { x: -1309, z: 577, r: 4 }],
    ponds: [],
  },
  {
    index: 2, number: 3, name: 'The Long Week', par: 5,
    tee: { x: -1320, z: 622 },
    path: [{ x: -1320, z: 622 }, { x: -1315, z: 720 }, { x: -1240, z: 780 }, { x: -1170, z: 785 }],
    fairwayWidth: 26, fairwayStart: 30,
    green: { x: -1170, z: 785, r: 11, slopeX: 0.01, slopeZ: -0.006 },
    pin: { x: -1167, z: 783 },
    bunkers: [{ x: -1186, z: 797, r: 4.5 }, { x: -1295, z: 690, r: 5 }],
    ponds: [{ x: -1250, z: 735, r: 14 }],
  },
  {
    index: 3, number: 9, name: 'The Ninth', par: 4,
    tee: { x: -1140, z: 760 },
    path: [{ x: -1140, z: 760 }, { x: -1100, z: 700 }, { x: -1065, z: 640 }],
    fairwayWidth: 24, fairwayStart: 25,
    green: { x: -1065, z: 640, r: 12, slopeX: 0.007, slopeZ: 0.007 },
    pin: { x: -1062, z: 642 },
    bunkers: [{ x: -1083, z: 653, r: 5 }],
    ponds: [],
  },
  // ---- E32: the Bottom Garden (holes 4 to 8, built at last) -------------------------------------------------------------
  {
    // Through the Turn Gate, west along the Bottom Garden's north side to a brand-new green with its opening ribbon.
    index: 4, number: 4, name: "Peony's Promise", par: 4,
    tee: { x: -1150, z: 850 },
    path: [{ x: -1150, z: 850 }, { x: -1225, z: 847 }, { x: -1272, z: 862 }],
    fairwayWidth: 24, fairwayStart: 25,
    green: { x: -1272, z: 862, r: 10, slopeX: 0.006, slopeZ: -0.008 },
    pin: { x: -1275, z: 864 },
    bunkers: [{ x: -1258, z: 875, r: 4.5 }, { x: -1215, z: 838, r: 4.5 }],
    ponds: [],
  },
  {
    // The Tall One's hedge maze: an S through two hedge walls (MAZE_HEDGES) the ball cannot pass, or a wedge over them.
    index: 5, number: 5, name: 'The Maze', par: 4,
    tee: { x: -1318, z: 845 },
    path: [{ x: -1318, z: 845 }, { x: -1345, z: 880 }, { x: -1300, z: 902 }, { x: -1322, z: 950 }],
    fairwayWidth: 14, fairwayStart: 15,
    green: { x: -1322, z: 950, r: 9, slopeX: -0.006, slopeZ: 0.006 },
    pin: { x: -1324, z: 952 },
    bunkers: [{ x: -1338, z: 958, r: 3.5 }],
    ponds: [],
  },
  {
    // A water carry over the Drip (Hosepipe Pond's overflow) and the giant birdbath standing in it.
    index: 6, number: 6, name: 'The Drip', par: 3,
    tee: { x: -1282, z: 932 },
    path: [{ x: -1282, z: 932 }, { x: -1212, z: 936 }],
    fairwayWidth: 18, fairwayStart: 25,
    green: { x: -1212, z: 936, r: 10, slopeX: 0.008, slopeZ: 0.004 },
    pin: { x: -1210, z: 934 },
    bunkers: [{ x: -1199, z: 948, r: 4 }],
    ponds: [{ x: -1248, z: 934, r: 14 }],
  },
  {
    // Teed off the potting shed's flat roof (POTTING_SHED), downhill east over the cabbages.
    index: 7, number: 7, name: 'The Potting Shed', par: 3,
    tee: { x: -1178, z: 953 },
    teeY: POTTING_SHED.roofY,
    path: [{ x: -1178, z: 953 }, { x: -1092, z: 938 }],
    fairwayWidth: 18, fairwayStart: 20,
    green: { x: -1092, z: 938, r: 10, slopeX: -0.006, slopeZ: -0.008 },
    pin: { x: -1095, z: 940 },
    bunkers: [{ x: -1104, z: 925, r: 4 }, { x: -1078, z: 950, r: 3.5 }],
    ponds: [],
  },
  {
    // North up the east side, then a dogleg left over (or round) the rhubarb patch to a small green ringed by giants.
    index: 8, number: 8, name: 'The Rhubarb Patch', par: 4,
    tee: { x: -1030, z: 960 },
    path: [{ x: -1030, z: 960 }, { x: -1026, z: 886 }, { x: -1108, z: 860 }],
    fairwayWidth: 22, fairwayStart: 25,
    green: { x: -1108, z: 860, r: 9, slopeX: 0.007, slopeZ: 0.006 },
    pin: { x: -1110, z: 857 },
    bunkers: [{ x: -1092, z: 848, r: 3.5 }, { x: -1013, z: 880, r: 4 }],
    ponds: [],
  },
];

/** Play order: hole indices by card number (1, 2, 3, 4..8, then The Ninth, index 3). */
export const HOLE_ORDER: readonly number[] = [...HOLES].sort((a, b) => a.number - b.number).map((h) => h.index);
/** The hole index with this card number (1..9), or -1. */
export function holeIndexOfNumber(n: number): number {
  return HOLES.findIndex((h) => h.number === n);
}
/** The hole index played after `index` in a round, or -1 after the last (The Ninth). */
export function nextHoleIndex(index: number): number {
  const at = HOLE_ORDER.indexOf(index);
  return at >= 0 && at < HOLE_ORDER.length - 1 ? HOLE_ORDER[at + 1] : -1;
}

export const COURSE_PAR = HOLES.reduce((s, h) => s + h.par, 0);
/** Tee box half size (square), metres (= the package's TEE_HALF 5 yd). */
export const TEE_HALF_M = 2.5;

/** The water hazard's name (all the ponds), for banners: "A pond mower got it!" (Gnome Golf's sea mower, R-195). */
export const POND_NAME = 'Hosepipe Pond';

// ---- The course ground (what golf/greens.ts draws and golf/course.ts plays) -------------------------------------------

/** How far a green rises above the flat yard, metres: a 0.08 m lift plus its tilt inside r, fading to 0 by r + 3. */
export function greenRise(x: number, z: number): number {
  for (const h of HOLES) {
    const g = h.green;
    const d = Math.hypot(x - g.x, z - g.z);
    if (d >= g.r + 3) continue;
    const plane = Math.max(0.02, 0.08 + g.slopeX * (x - g.x) + g.slopeZ * (z - g.z));
    return d <= g.r ? plane : plane * (1 - (d - g.r) / 3);
  }
  return 0;
}

/** Distance from (x, z) to a polyline and how far along it the closest point is (metres). */
export function distToLine(path: readonly { x: number; z: number }[], x: number, z: number): { dist: number; along: number } {
  let best = Infinity;
  let bestAlong = 0;
  let walked = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len = Math.hypot(abx, abz);
    const t = len > 0 ? Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (len * len))) : 0;
    const d = Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t));
    if (d < best) { best = d; bestAlong = walked + t * len; }
    walked += len;
  }
  return { dist: best, along: bestAlong };
}

/**
 * True when (x, z) is in play or within `margin` metres of it: a tee box, a fairway (full length from the tee), a
 * green, a bunker or a pond, or a cart path. Scenery (hedges, giant plants, buildings, vignettes) keeps out of it.
 */
export function inPlay(x: number, z: number, margin = 0): boolean {
  for (const h of HOLES) {
    if (Math.max(Math.abs(x - h.tee.x), Math.abs(z - h.tee.z)) < TEE_HALF_M + 2 + margin) return true;
    if (distToLine(h.path, x, z).dist < h.fairwayWidth / 2 + margin) return true;
    if (Math.hypot(x - h.green.x, z - h.green.z) < h.green.r + 3 + margin) return true;
    for (const c of [...h.bunkers, ...h.ponds]) if (Math.hypot(x - c.x, z - c.z) < c.r + margin) return true;
  }
  for (const p of CART_PATHS) {
    if (distToLine(p.map(([px, pz]) => ({ x: px, z: pz })), x, z).dist < CART_PATH_W / 2 + margin) return true;
  }
  return false;
}

/** Inside the fence (the playable yard). */
export function inYard(x: number, z: number, margin = 0): boolean {
  return x > YARD.minX + FENCE_INSET + margin && x < YARD.maxX - FENCE_INSET - margin
    && z > YARD.minZ + FENCE_INSET + margin && z < YARD.maxZ - FENCE_INSET - margin;
}

// ---- Rough, hedges and giant plants (golf/yard.ts builds them; the runtime rustles through the soft ones) -----------

/** Giant plants (no collider: you drive through them) slow a vehicle inside their radius by this factor per second. */
export const SOFT_SLOW_PER_S = 0.55;
/** Hedge walls: height and thickness, metres (solid colliders; hedgerow prefab scaled up). */
export const HEDGE_H = 3.2;
export const HEDGE_T = 1.6;
/** Hedge walls inside the yard (world metres, centre lines), with gaps where a hedge arch stands (HEDGE_ARCHES). */
export const HEDGES: readonly { a: [number, number]; b: [number, number] }[] = [
  // Between hole 1 and the middle of the course.
  { a: [-1110, 515], b: [-1240, 515] },
  // Between hole 2 and the middle.
  { a: [-1262, 530], b: [-1262, 640] },
  // Between hole 3's dogleg and the middle.
  { a: [-1290, 660], b: [-1255, 705] },
  // Between hole 9 and the middle.
  { a: [-1110, 600], b: [-1150, 690] },
];
/** The maze on hole 5 (E32): hedge walls MAZE_H tall that DO cross hole 5's fairway on purpose (the ways through
 *  alternate sides), plus two dead-end stubs. Solid to gnomes and carts, and to the ball (golf/course.ts collide). They
 *  keep off every other hole. */
export const MAZE_H = 2.6;
export const MAZE_HEDGES: readonly { a: [number, number]; b: [number, number] }[] = [
  // First wall: blocks the straight line from the tee; the way through is at the west end.
  { a: [-1328, 866], b: [-1294, 866] },
  // Second wall: blocks the straight line again; the way through is at the east end.
  { a: [-1356, 898], b: [-1314, 898] },
  // The maze's east side, between it and hole 4's green / hole 6's tee.
  { a: [-1294, 862], b: [-1294, 942] },
  // Dead ends.
  { a: [-1356, 932], b: [-1340, 932] },
  { a: [-1306, 849], b: [-1306, 858] },
];
/** Hedge arches (prefab `hedge-arch`, scaled): drive a golf cart through one for "Through the Hedge". yaw = the way through. */
export const HEDGE_ARCHES: readonly { x: number; z: number; yaw: number }[] = [
  { x: -1175, z: 515, yaw: 0 },
  { x: -1262, z: 585, yaw: Math.PI / 2 },
  { x: -1130, z: 645, yaw: Math.PI / 2 - 0.42 },
];
export const ARCH_GAP = 5;

// ---- Lost balls and molehills (side quests) -------------------------------------------------------------------------

/** Balls lost in the rough (Thrift's 'Lost Balls'): pick one up with E within PICK_RANGE. */
export const LOST_BALLS: readonly { id: string; x: number; z: number }[] = [
  { id: 'lb-1', x: -1120, z: 455 }, { id: 'lb-2', x: -1215, z: 500 }, { id: 'lb-3', x: -1325, z: 560 },
  { id: 'lb-4', x: -1340, z: 660 }, { id: 'lb-5', x: -1215, z: 815 }, { id: 'lb-6', x: -1155, z: 735 },
  { id: 'lb-7', x: -1045, z: 700 }, { id: 'lb-8', x: -1015, z: 560 },
];
export const PICK_RANGE = 2.2;
/** Molehills by the ninth green (Thrift's 'The Ninth Green'): pat one flat with E within PICK_RANGE. */
export const MOLEHILLS: readonly { id: string; x: number; z: number }[] = [
  { id: 'mh-1', x: -1050, z: 628 }, { id: 'mh-2', x: -1078, z: 628 }, { id: 'mh-3', x: -1052, z: 652 },
  { id: 'mh-4', x: -1074, z: 656 },
];

// ---- The people (characters.md: Dame Peony Gravelrake, Basil Divot, Thrift Hosepipe) ---------------------------------
// One look per person, shared by the residents (golf/life.ts), the cutscene cast (cutscene/cast.ts CAST) and quests.
// Head gear are @lawn/prefabs ids made by this epic (catalog/gta-golf-gear.ts).

export interface HedgeworthPerson { key: 'peony' | 'basil' | 'thrift'; name: string; look: Partial<GnomeLook>; held?: string; hz: number }

export const HEDGEWORTH_CAST: Readonly<Record<'peony' | 'basil' | 'thrift', HedgeworthPerson>> = {
  peony: {
    key: 'peony', name: 'Dame Peony Gravelrake', hz: 104, held: 'driver-cane',
    look: { hat: 0x3f6b3a, shirt: 0x7a6a48, pants: 0x4a4436, beard: 0xf4f4f0, glasses: false, equipment: { head: 'tweed-flat-cap' } },
  },
  basil: {
    key: 'basil', name: 'Basil Divot', hz: 128, held: 'golf-club',
    look: { hat: 0xc0282d, shirt: 0xf2c230, pants: 0x2e3a5a, beard: null, equipment: { head: 'argyle-tam' } },
  },
  thrift: {
    key: 'thrift', name: 'Thrift Hosepipe', hz: 74, held: 'watering-can',
    look: { hat: 0x6b4a2e, shirt: 0x5b6b3a, pants: 0x4a5a2e, beard: 0x6b4a2a, equipment: { head: 'hosepipe-cap' } },
  },
};

/** Where each of them stands (life.ts puts them there; their quest giver markers are here too). yaw = facing. */
export const PEOPLE_SPOTS: Readonly<Record<'peony' | 'basil' | 'thrift', { x: number; z: number; yaw: number }>> = {
  // On the terrace, looking over the first tee.
  peony: { x: -1060, z: 462, yaw: 0 },
  // Beside the first tee, practising his swing toward the fairway (west).
  basil: { x: -1090, z: 475, yaw: -Math.PI / 2 },
  // Between his shed door and the ninth green, watering can in hand.
  thrift: { x: -1057, z: 611, yaw: -Math.PI / 2 },
};

// ---- Ids ---------------------------------------------------------------------------------------------------------

export const GOLF_SAVE_KEY = 'gta-golf-v1';

/** Achievement ids (packages/achievements catalog). */
export const GOLF_ACH = {
  kickedBoard: 'gta-kicked-board',
  card: 'gta-hedgeworth-card',
  ace: 'gta-hedgeworth-ace',
  birdies: 'gta-birdie-birdie',
  arch: 'gta-through-the-hedge',
  secret: 'gta-groundskeepers-secret',
  // E32
  /** Finish all nine holes in one round. */
  fullNine: 'gta-hedgeworth-full-nine',
  /** Finish a full nine under par (COURSE_PAR 34). */
  underPar: 'gta-nine-under-par',
  /** Par or better on hole 5, The Maze. */
  maze: 'gta-out-of-the-maze',
} as const;

/** Quest probe ids (city/probes.ts reads them from the save). */
export const GOLF_PROBES = {
  boardBroken: 'golf-board-broken',
  holes: 'golf-holes-played',
  parHoles: 'golf-par-holes',
  rounds: 'golf-rounds',
  balls: 'golf-balls-found',
  molehills: 'golf-molehills',
  /** E32: how many of holes 4..8 (indices 4..8) have a best score (finished at least once). */
  bottomHoles: 'golf-bottom-holes',
} as const;

/** Side quest ids (quests/golfQuests.ts). */
export const GOLF_QUESTS = {
  lostBalls: 'sq-hedgeworth-lost-balls',
  lesson: 'sq-hedgeworth-pro-lesson',
  ninthGreen: 'sq-hedgeworth-ninth-green',
  membersCup: 'sq-hedgeworth-members-cup',
  /** E32: Peony opens holes 4 to 8 at last. */
  promise: 'sq-hedgeworth-peonys-promise',
} as const;

/** World sound ids this epic registers (sound/recipes, registerSound in golf/sounds.ts). */
export const GOLF_SOUNDS = ['golf-tock', 'golf-putt', 'golf-cup', 'golf-splash-reed', 'board-crack', 'hedge-rustle', 'sprinkler-hiss'] as const;
export type GolfSoundId = (typeof GOLF_SOUNDS)[number];

/** Max wind on a hole, mph (Gnome Golf ROUND.maxWind is 12; the yard is sheltered by its hedges). */
export const MAX_WIND = 8;
/** Strokes on a hole before the ball is picked up. */
export const MAX_STROKES = 10;

// ---- The save (golf/save.ts) ---------------------------------------------------------------------------------------

export interface GolfSave {
  v: 1;
  boardBroken: boolean;
  holesPlayed: number;
  /** Holes finished at par or better. */
  parHoles: number;
  /** Full rounds finished (E15's four-hole rounds and E32's nine-hole rounds alike). */
  rounds: number;
  /** Best strokes per hole index, HOLES.length long (null = never finished). An E15 save's four entries stay at 0..3. */
  best: (number | null)[];
  /** Best four-hole round from before the nine (E15 saves). Kept and merged, never written any more. */
  bestRound: number | null;
  /** Best full nine-hole total, or null (E32). */
  bestNine: number | null;
  aces: number;
  /** LOST_BALLS ids picked up. */
  ballsFound: string[];
  /** MOLEHILLS ids patted flat. */
  molehills: string[];
}

export interface GolfStore {
  data(): GolfSave;
  breakBoard(): void;
  /** A hole finished (not picked up): updates holesPlayed, parHoles, best, aces. */
  recordHole(index: number, strokes: number, par: number): void;
  /** A full nine-hole round finished with this total: rounds + 1, bestNine. */
  recordRound(total: number): void;
  /** True when it was new. */
  findBall(id: string): boolean;
  flattenMolehill(id: string): boolean;
}

// ---- The round (golf/round.ts, pure) ---------------------------------------------------------------------------------

export type RoundPhase = 'walk' | 'aim' | 'swing' | 'flight' | 'holed' | 'done';

export interface RoundState {
  /** Round seed (wind). */
  seed: number;
  /** Current hole index 0..8 (HOLES index; play order is HOLE_ORDER). */
  hole: number;
  /** Strokes on this hole (penalties included). */
  strokes: number;
  /** Per hole index: strokes when finished, null otherwise. A picked-up hole scores MAX_STROKES. */
  scores: (number | null)[];
  /** The ball at rest, world metres (ground). */
  ball: { x: number; z: number };
  lie: Lie;
  club: ClubId;
  /** Aim, world yaw. */
  aimYaw: number;
  /** This hole's wind (golf frame = world yaw). */
  wind: Wind;
  phase: RoundPhase;
  swing: SwingState;
  /** The shot in the air: the package result in the golf frame, and seconds since impact. */
  flight: { result: ShotResult; t: number; from: { x: number; z: number } } | null;
  /** Last banner ('Birdie!', 'Bunker · 64 yd', 'A pond mower got it! +1'), and the seconds it has left. */
  banner: string;
  bannerT: number;
  /** Consecutive holes at birdie or better (for Birdie, Birdie). */
  birdieRun: number;
}

/** What round.ts reports to the runtime (sounds, achievements, save, HUD). */
export type RoundEvent =
  | { kind: 'swing-start' }
  | { kind: 'shot'; club: ClubId; power: number; accuracy: number }
  | { kind: 'bounce'; lie: Lie; speed: number }
  | { kind: 'rest'; lie: Lie; yards: number }
  | { kind: 'water'; mower: boolean }
  | { kind: 'holed'; hole: number; strokes: number; par: number; name: string }
  | { kind: 'picked-up'; hole: number }
  | { kind: 'round-done'; total: number; toPar: number };

// ---- The HUD (golf/hud.ts, DOM only) -------------------------------------------------------------------------------

export type HudAction =
  | 'swing' | 'aim-left' | 'aim-right' | 'aim-stop' | 'club-prev' | 'club-next'
  | 'card' | 'card-close' | 'next-hole' | 'to-ball' | 'quit';

export interface HudView {
  holeNumber: number;
  holeName: string;
  par: number;
  strokes: number;
  /** Round total to par so far (finished holes), e.g. -1, 0, +3. */
  toPar: number;
  clubName: string;
  /** Full-power carry of the club from this lie, gnome yards. */
  clubYards: number;
  lieName: string;
  /** Ball to pin, gnome yards. */
  pinYards: number;
  /** Wind relative to the aim: 0 = straight behind (helping), PI = in the face. */
  windRel: number;
  windMph: number;
  phase: RoundPhase;
  /** The meter while swinging (marker 0 = accuracy line, 1 = full, up to SWING.maxPower), else null. */
  meter: SwingState | null;
  banner: string | null;
  /** The player is at the ball and may address it / swing. */
  atBall: boolean;
}

export interface CardView {
  holes: readonly { number: number; name: string; par: number; strokes: number | null; best: number | null }[];
  total: number;
  toPar: number;
  /** True after the last hole: the card shows "Round complete". */
  final: boolean;
}

export interface GolfHud {
  show(on: boolean): void;
  set(view: HudView): void;
  /** Show the scorecard (null hides it). */
  card(view: CardView | null): void;
  onAction(cb: (a: HudAction) => void): void;
  destroy(): void;
}

// ---- The runtime (golf/runtime.ts) ---------------------------------------------------------------------------------

/** For quests, the Gnomlet app and debug. */
export interface GolfApi {
  /** Start a round at hole index `hole` (0..8; a HOLES index, not the card number): the ball goes on that tee and the player is put beside it. Null when it
   *  started, else why not (in a vehicle, a cutscene...). */
  startRound(hole?: number): string | null;
  quitRound(): void;
  inRound(): boolean;
  boardBroken(): boolean;
  /** Break the Kicked Board now (quests, the quest sim). */
  breakBoard(): void;
  onHole(cb: (e: { hole: number; strokes: number; par: number }) => void): () => void;
  store(): GolfStore;
}

export interface Golf {
  /** Every frame after the player and vehicles moved. `inp` is the frame's raw input (aim, club, swing keys). */
  update(dt: number, inp: InputState): void;
  /** On foot: the E prompt (address the ball, start a round, kick the board, pick up a ball, pat a molehill), or null. */
  prompt(x: number, z: number): string | null;
  interact(x: number, z: number): boolean;
  blips(): Blip[];
  /** True while the gnome stands over the ball (aim/swing/flight): app.ts holds the gnome still. */
  addressing(): boolean;
  /** After the chase camera: golf may drive the camera (address view, ball flight). True when it did. */
  applyCamera(dt: number): boolean;
  api: GolfApi;
  debug(): unknown;
}
