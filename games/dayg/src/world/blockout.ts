// The hand-authored blockout of the Lychgate, the Old Rows and the Tap (issue 1.7).
// Code over clicking: every block, route, spot and container is placed by the small helpers below.
// 3D rule: boxes that touch overlap by >= 0.1 gm and their tops differ by >= 0.1 gm (no shared faces).
// Units: 1 gm = 1 three.js unit; x grows east, z grows south.
import type { ContainerDef, ContainerType, RegionDef, RegionId } from '../sim/types';
import { MAP_OUTLINE, REGIONS, regionAtIn } from '../sim/regions';
import { BUILDING_PARTS } from './buildings/index';
import type {
  BlockDef, BlockKind, BlockoutMap, ClimbRouteDef, HavenDef, PathDef, PitDef, PropDef, RouteKind, Side, SpotDef, SpotKind, WaterDef,
} from './types';

const EPS = 1e-6;

const blocks: BlockDef[] = [];
const routes: ClimbRouteDef[] = [];
const pits: PitDef[] = [];
const spots: SpotDef[] = [];
const water: WaterDef[] = [];
const paths: PathDef[] = [];
const props: PropDef[] = [];
const containers: ContainerDef[] = [];

// ---------- helpers ----------

function block(id: string, kind: BlockKind, x0: number, x1: number, z0: number, z1: number, h: number, y = 0): BlockDef {
  const b: BlockDef = { id, kind, x0, x1, z0, z1, y, h };
  blocks.push(b);
  return b;
}
function top(b: BlockDef): number { return Math.round((b.y + b.h) * 1000) / 1000; }
function route(b: { id: string }, side: Side, kind: RouteKind, at: number): void {
  routes.push({ id: `${b.id}-${side}-${kind}-${at}`, block: b.id, side, kind, at });
}
function spot(id: string, kind: SpotKind, region: RegionId, x: number, y: number, z: number): void {
  spots.push({ id, kind, region, x, y, z });
}
/** A spot on the top of a block, offset from its centre. */
function spotOnTop(id: string, kind: SpotKind, region: RegionId, b: BlockDef, dx = 0, dz = 0): void {
  spot(id, kind, region, (b.x0 + b.x1) / 2 + dx, top(b), (b.z0 + b.z1) / 2 + dz);
}
function container(id: string, type: ContainerType, region: RegionId, x: number, y: number, z: number, guaranteed?: string[]): void {
  containers.push(guaranteed ? { id, type, region, x, y, z, guaranteed } : { id, type, region, x, y, z });
}
function containerOnTop(id: string, type: ContainerType, region: RegionId, b: BlockDef, dx = 0, dz = 0): void {
  container(id, type, region, (b.x0 + b.x1) / 2 + dx, top(b), (b.z0 + b.z1) / 2 + dz);
}
function prop(prefab: string, x: number, y: number, z: number, rotY?: number): void {
  props.push(rotY === undefined ? { prefab, x, y, z } : { prefab, x, y, z, rotY });
}
/** Hatless spots on the ground of one region, numbered. */
function hatless(region: RegionId, pts: [number, number, number][]): void {
  pts.forEach(([x, y, z], i) => spot(`h-${region}-${i + 1}`, 'hatless', region, x, y, z));
}

/**
 * Grave kerbs framing the plot in front (south) of a stone: two side kerbs and a foot kerb.
 * Side kerbs run 0.1 into the stone and stop 0.1 inside the foot kerb; the foot kerb is 0.1 wider on each side
 * and 0.1 taller, so no two faces coincide.
 */
function kerbPlot(stone: BlockDef, length: number, inset: number): void {
  const t = 0.6, h = 1.6;
  const zs = stone.z1 - 0.1, ze = stone.z1 + length;
  const lx0 = stone.x0 + inset, rx1 = stone.x1 - inset;
  block(`${stone.id}-kw`, 'kerb', lx0, lx0 + t, zs, ze - 0.1, h);
  block(`${stone.id}-ke`, 'kerb', rx1 - t, rx1, zs, ze - 0.1, h);
  block(`${stone.id}-kf`, 'kerb', lx0 - 0.1, rx1 + 0.1, ze - t, ze, h + 0.1);
}

interface RowOpts {
  width: number; depth: number;
  /** Gap between stones along the row, picked by stone index (deterministic). */
  gaps: number[];
  /** Stone heights, picked by (index + row) (deterministic). */
  heights: number[];
  /** Stones overlapping [skipX0, skipX1] are left out (a cross aisle). */
  skipX0?: number; skipX1?: number;
  xEnd: number;
  row: number;
}
/** One east-west row of headstones starting at x0, front faces south. Returns the stones in order. */
function headstoneRow(prefix: string, x0: number, z: number, o: RowOpts): BlockDef[] {
  const out: BlockDef[] = [];
  let x = x0;
  for (let i = 0; x + o.width <= o.xEnd; i++) {
    const skip = o.skipX0 !== undefined && o.skipX1 !== undefined && x < o.skipX1 && x + o.width > o.skipX0;
    if (!skip) {
      const h = o.heights[(i * 3 + o.row * 2) % o.heights.length];
      out.push(block(`${prefix}-r${o.row}-s${i}`, 'headstone', x, x + o.width, z, z + o.depth, h));
    }
    x += o.width + o.gaps[(i + o.row) % o.gaps.length];
  }
  return out;
}
const cx = (b: BlockDef): number => (b.x0 + b.x1) / 2;

// ---------- fixed pieces: the Lychgate ----------

const gatehouseW = block('gatehouse-w', 'gatehouse', 280, 305, 466, 494, 18);
const gatehouseE = block('gatehouse-e', 'gatehouse', 335, 360, 466, 494, 18);
block('gate-roof', 'roof', 304, 336, 465.9, 494.1, 2.15, 16);
routes.push({ id: 'gatehouse-w-n-ladder-12', block: 'gatehouse-w', side: 'n', kind: 'ladder', at: 12 });

const havens: HavenDef[] = [
  { id: 'waystation', name: 'Lychgate Waystation', region: 'gate-roof', rect: { x0: 280, x1: 360, z0: 466, z1: 494 }, minY: 17.5 },
  { id: 'tap', name: 'The Tap', region: 'the-tap', rect: { x0: 360, x1: 400, z0: 20, z1: 60 }, minY: 14.5 },
];
spot('fire-waystation', 'fire', 'gate-roof', 348, 18, 474);
spot('bed-waystation', 'bed', 'gate-roof', 350, 18, 488);
water.push({ id: 'w-rain-waystation', kind: 'rain-catcher', clean: true, x: 286, y: 18, z: 470 });
prop('bedroll', 350, 18, 488);

// Railing between forecourt and verge path (overlaps the gatehouses by 0.5, the west hedge by 0.2).
const railW = block('railing-w', 'wall', 199.8, 280.5, 478, 482, 6);
const railE = block('railing-e', 'wall', 359.5, 440, 478, 482, 6);
// Verge path to bin corner is closed (0.15 taller than railing-e where they overlap; runs 0.2 into the south hedge).
block('railing-bin', 'wall', 438, 442, 480, 520.2, 6.15);

// The Tap platform and standpipe.
const tapPlatform = block('tap-platform', 'plinth', 360, 400, 20, 60, 15);
block('standpipe', 'standpipe', 378, 382, 38, 42, 20, 14.9);
routes.push({ id: 'tap-platform-s-ladder-20', block: 'tap-platform', side: 's', kind: 'ladder', at: 20 });
water.push({ id: 'w-standpipe', kind: 'standpipe', clean: true, x: 380, y: 15, z: 44 });
water.push({ id: 'w-puddle-tap', kind: 'puddle', clean: false, x: 372, y: 0, z: 80 });

// Boundary hedges: one per MAP_OUTLINE segment, 4 thick, outside the outline, extended 4 past each end.
// Neighbouring hedges overlap at the corners, so their heights alternate 30 / 30.15 (tops differ) and the odd ones
// extend 4.1 / 3.9 instead of 4 (no end face flush with a neighbour's outer face).
{
  const n = MAP_OUTLINE.length;
  // The outline runs clockwise on screen (x east, z south): outside is to the left of each segment's direction.
  for (let i = 0; i < n; i++) {
    const [ax, az] = MAP_OUTLINE[i];
    const [bx, bz] = MAP_OUTLINE[(i + 1) % n];
    const h = i % 2 === 0 ? 30 : 30.15;
    const ext = i % 2 === 0 ? 4.1 : 3.9;
    if (az === bz) {
      const xa = Math.min(ax, bx) - ext, xb = Math.max(ax, bx) + ext;
      const outsideNorth = bx > ax; // heading east: outside is north (smaller z)
      block(`hedge-${i}`, 'hedge', xa, xb, outsideNorth ? az - 4 : az, outsideNorth ? az : az + 4, h);
    } else {
      const za = Math.min(az, bz) - ext, zb = Math.max(az, bz) + ext;
      const outsideEast = bz > az; // heading south: outside is east (larger x)
      block(`hedge-${i}`, 'hedge', outsideEast ? ax : ax - 4, outsideEast ? ax + 4 : ax, za, zb, h);
    }
  }
}

// ---------- gate-roof (the Waystation) ----------

spotOnTop('n-gate-roof-1', 'npc', 'gate-roof', gatehouseW, -8, 8);
spotOnTop('n-gate-roof-2', 'npc', 'gate-roof', gatehouseW, 4, -10);
spotOnTop('n-gate-roof-3', 'npc', 'gate-roof', gatehouseE, -5, 10);
spotOnTop('n-gate-roof-4', 'npc', 'gate-roof', gatehouseE, 6, 0);
spotOnTop('board-gate-roof', 'board', 'gate-roof', gatehouseE, -0.5, 8); // the newcomers' board, 3 gm from the bed (350, 488)
container('c-waystation-sack', 'sack', 'gate-roof', 300, 18, 488, ['twig-bundle', 'twig-bundle', 'crab-apple']);
container('c-gate-roof-1', 'chest', 'gate-roof', 342, 18, 470);
prop('candle', 296, 18, 472);
prop('flower-pot', 340, 18, 490);

// ---------- Forecourt: open gravel ----------

hatless('forecourt', [[220, 0, 420], [260, 0, 440], [300, 0, 420], [350, 0, 450], [400, 0, 430], [430, 0, 470]]);
spotOnTop('n-forecourt-1', 'npc', 'forecourt', railW, -30, -1);
spotOnTop('n-forecourt-2', 'npc', 'forecourt', railW, -10, -1);
spotOnTop('n-forecourt-3', 'npc', 'forecourt', railE, 20, -1);
container('c-forecourt-rope', 'crate', 'forecourt', 248, 0, 452, ['rope-coil']);
container('c-forecourt-1', 'crate', 'forecourt', 420, 0, 410);
container('c-forecourt-2', 'chest', 'forecourt', 230, 0, 470);
container('c-forecourt-3', 'crate', 'forecourt', 370, 0, 420);
prop('bench', 240, 0, 430);
prop('bench', 290, 0, 445, Math.PI / 2);
prop('bench', 352, 0, 432, Math.PI / 2);
prop('bench', 405, 0, 455);
prop('signpost', 312, 0, 458);
prop('flower-pot', 214, 0, 410);
prop('flower-pot', 426, 0, 410);

// ---------- The Verge Path ----------

hatless('verge-path', [[210, 0, 500], [250, 0, 510], [290, 0, 505], [350, 0, 512], [390, 0, 500], [430, 0, 510]]);
spotOnTop('n-verge-path-1', 'npc', 'verge-path', railW, -10, 1.5);
spotOnTop('n-verge-path-2', 'npc', 'verge-path', railE, -20, 1.5);
spotOnTop('n-verge-path-3', 'npc', 'verge-path', railE, 20, 1.5);
container('c-verge-path-1', 'sack', 'verge-path', 260, 0, 500);
container('c-verge-path-2', 'crate', 'verge-path', 400, 0, 505);
prop('signpost', 326, 0, 508);
prop('tree-stump', 222, 0, 512);
prop('flowering-bush', 380, 0, 514);

// ---------- Bin Corner: three Tall One wheelie bins ----------

const bin1 = block('bin-1', 'bin', 470, 480, 430, 440, 12);
const bin2 = block('bin-2', 'bin', 500, 510, 470, 480, 12);
const bin3 = block('bin-3', 'bin', 530, 540, 420, 430, 12);
block('bin-heap', 'stone', 482, 496, 444, 452, 1.2);
hatless('bin-corner', [[450, 0, 415], [520, 0, 410], [550, 0, 450], [460, 0, 500], [520, 0, 510], [490, 0, 470]]);
spotOnTop('n-bin-corner-1', 'npc', 'bin-corner', bin1);
spotOnTop('n-bin-corner-2', 'npc', 'bin-corner', bin2);
spotOnTop('n-bin-corner-3', 'npc', 'bin-corner', bin3);
container('c-bin-corner-1', 'bin', 'bin-corner', 465, 0, 445);
container('c-bin-corner-2', 'bin', 'bin-corner', 515, 0, 485);
container('c-bin-corner-3', 'bin', 'bin-corner', 548, 0, 415);
prop('wheelbarrow', 530, 0, 470);
prop('garden-rock', 488, 0, 458);

// ---------- Ivy Rows: headstone rows, ivy on about 1 stone in 4 ----------

const ivyStones: BlockDef[] = [];
for (let row = 0; row < 9; row++) {
  const z = 248 + row * 16;
  const stones = headstoneRow('ir', 6, z, {
    width: 6, depth: 1.5, gaps: [9, 10, 9.5, 10, 9], heights: [9, 11, 12.5, 10, 13, 9.5, 11.5, 12, 10.5],
    skipX0: 78, skipX1: 90, xEnd: 155, row,
  });
  stones.forEach((s, i) => {
    if ((i + row) % 3 === 0) kerbPlot(s, 7, 0.3);
    if ((i + row * 2) % 4 === 1) route(s, 's', 'ivy', 3);
  });
  ivyStones.push(...stones);
  paths.push({ id: `p-ivy-aisle-${row}`, kind: 'grass', points: [[2, z + 12], [158, z + 12]], width: 4 });
}
paths.push({ id: 'p-ivy-cross', kind: 'grass', points: [[84, 242], [84, 398]], width: 4 });
ivyStones.forEach((s, i) => {
  if (i % 3 === 0) prop('flower-pot', cx(s) + 1.5, 0, s.z1 + 1);
  if (i % 5 === 1) prop('candle', cx(s) - 1.5, 0, s.z1 + 1);
});
hatless('ivy-rows', [[20, 0, 260], [100, 0, 276], [140, 0, 292], [40, 0, 324], [84, 0, 340], [120, 0, 372]]);
spotOnTop('n-ivy-rows-1', 'npc', 'ivy-rows', ivyStones[3]);
spotOnTop('n-ivy-rows-2', 'npc', 'ivy-rows', ivyStones[30]);
spotOnTop('n-ivy-rows-3', 'npc', 'ivy-rows', ivyStones[62]);
container('c-ivy-rows-1', 'vase', 'ivy-rows', cx(ivyStones[5]), 0, ivyStones[5].z1 + 3);
container('c-ivy-rows-2', 'grave-goods', 'ivy-rows', cx(ivyStones[24]), 0, ivyStones[24].z1 + 3);
container('c-ivy-rows-3', 'vase', 'ivy-rows', cx(ivyStones[47]), 0, ivyStones[47].z1 + 3);
container('c-ivy-rows-4', 'grave-goods', 'ivy-rows', cx(ivyStones[70]), 0, ivyStones[70].z1 + 3);

// ---------- Leaning Rows: tighter, taller, 'letters' on about 1 stone in 6 ----------

const leanStones: BlockDef[] = [];
for (let row = 0; row < 11; row++) {
  const z = 246 + row * 13;
  const stones = headstoneRow('lr', 164, z, {
    width: 6, depth: 1.5, gaps: [7], heights: [11, 12.5, 11.5, 13, 12],
    skipX0: 239, skipX1: 251, xEnd: 316, row,
  });
  stones.forEach((s, i) => {
    if ((i + row) % 4 === 0) kerbPlot(s, 5.5, 0.3);
    if ((i + row * 5) % 6 === 2) route(s, 's', 'letters', 3);
  });
  leanStones.push(...stones);
  paths.push({ id: `p-lean-aisle-${row}`, kind: 'grass', points: [[162, z + 10], [318, z + 10]], width: 3 });
}
paths.push({ id: 'p-lean-cross', kind: 'grass', points: [[245, 242], [245, 398]], width: 4 });
leanStones.forEach((s, i) => { if (i % 7 === 3) prop('candle', cx(s), 0, s.z1 + 1); });
hatless('leaning-rows', [[170, 0, 256], [210, 0, 282], [260, 0, 308], [300, 0, 334], [190, 0, 360], [280, 0, 373], [245, 0, 320]]);
spotOnTop('n-leaning-rows-1', 'npc', 'leaning-rows', leanStones[8]);
spotOnTop('n-leaning-rows-2', 'npc', 'leaning-rows', leanStones[55]);
spotOnTop('n-leaning-rows-3', 'npc', 'leaning-rows', leanStones[100]);
containerOnTop('c-leaning-rows-1', 'camp-cache', 'leaning-rows', leanStones[20]);
containerOnTop('c-leaning-rows-2', 'camp-cache', 'leaning-rows', leanStones[77]);
container('c-leaning-rows-3', 'vase', 'leaning-rows', cx(leanStones[40]), 0, leanStones[40].z1 + 3);
container('c-leaning-rows-4', 'grave-goods', 'leaning-rows', cx(leanStones[90]), 0, leanStones[90].z1 + 3);

// ---------- The Sinks: five open graves ----------

function pit(id: string, x0: number, x1: number, z0: number, z1: number, depth: number): PitDef {
  const p: PitDef = { id, rect: { x0, x1, z0, z1 }, depth };
  pits.push(p);
  return p;
}
const pit1 = pit('pit-1', 8, 30, 130, 150, 14);
pit('pit-2', 40, 56, 128, 146, 10);
const pit3 = pit('pit-3', 66, 90, 136, 156, 20);
const pit4 = pit('pit-4', 14, 34, 168, 190, 16);
pit('pit-5', 50, 72, 178, 196, 12);
routes.push({ id: 'pit-3-n-rope-12', block: 'pit-3', side: 'n', kind: 'rope', at: 12 });
const slab1 = block('sinks-slab-1', 'stone', 96, 104, 160, 166, 3);
const slab2 = block('sinks-slab-2', 'stone', 30, 38, 205, 210, 2.5);
const slab3 = block('sinks-slab-3', 'stone', 80, 86, 215, 221, 4);
hatless('the-sinks', [
  [19, -pit1.depth, 140], [74, -pit3.depth, 142], [24, -pit4.depth, 176],
  [100, 0, 130], [60, 0, 222], [110, 0, 200], [10, 0, 228],
]);
spotOnTop('n-the-sinks-1', 'npc', 'the-sinks', slab1);
spotOnTop('n-the-sinks-2', 'npc', 'the-sinks', slab2);
spotOnTop('n-the-sinks-3', 'npc', 'the-sinks', slab3);
container('c-the-sinks-1', 'body', 'the-sinks', 84, -pit3.depth, 150);
container('c-the-sinks-2', 'grave-goods', 'the-sinks', 60, 0, 160);
container('c-the-sinks-3', 'vase', 'the-sinks', 108, 0, 226);
water.push({ id: 'w-puddle-sinks', kind: 'puddle', clean: false, x: 20, y: -pit4.depth, z: 184 });
prop('garden-rock', 36, 0, 126);
prop('garden-rock', 62, 0, 132);
prop('garden-rock', 94, 0, 146);
prop('garden-rock', 42, 0, 186);
prop('garden-rock', 78, 0, 202);
prop('garden-rock', 6, 0, 200);
prop('gravestone', 36, 0, 160, 0.3);
prop('gravestone', 96, 0, 186, -0.4);
prop('gravestone', 46, 0, 230, 0.6);
prop('gravestone', 112, 0, 140, -0.2);

// ---------- Angel Square: four angels around a sundial ----------

const sundial = block('sundial', 'plinth', 177, 183, 177, 183, 3);
const angelPlinths: BlockDef[] = [];
const angels: BlockDef[] = [];
([[150, 150], [210, 150], [150, 210], [210, 210]] as const).forEach(([ax, az], i) => {
  angelPlinths.push(block(`plinth-angel-${i + 1}`, 'plinth', ax - 6, ax + 6, az - 6, az + 6, 4));
  angels.push(block(`angel-${i + 1}`, 'angel', ax - 4, ax + 4, az - 4, az + 4, 30, 3.9));
});
route(angelPlinths[0], 's', 'letters', 6);
route(angelPlinths[3], 'n', 'letters', 6);
hatless('angel-square', [[130, 0, 130], [230, 0, 130], [130, 0, 230], [230, 0, 230], [180, 0, 140], [180, 0, 222]]);
spotOnTop('n-angel-square-1', 'npc', 'angel-square', angels[0]);
spotOnTop('n-angel-square-2', 'npc', 'angel-square', angelPlinths[2], 5, 5);
spotOnTop('n-angel-square-3', 'npc', 'angel-square', angelPlinths[1], -5, 5);
spotOnTop('n-angel-square-4', 'npc', 'angel-square', sundial, 2, 2);
containerOnTop('c-angel-square-1', 'camp-cache', 'angel-square', angelPlinths[0], -5, -5);
containerOnTop('c-angel-square-2', 'camp-cache', 'angel-square', angelPlinths[1], 5, -5);
container('c-angel-square-3', 'vase', 'angel-square', 200, 0, 180);
container('c-angel-square-4', 'grave-goods', 'angel-square', 160, 0, 180);
prop('gnome-statue', 180, 3, 180);
prop('giant-flower', 136, 0, 180);
prop('giant-flower', 224, 0, 180);
prop('giant-flower', 180, 0, 132);
prop('giant-flower', 180, 0, 228);
prop('candle', 150, 4, 157);
prop('candle', 210, 4, 157);

// ---------- The Mason's Corner ----------

const brokenStone = block('mason-broken', 'stone', 258, 278, 150, 156, 8);
const chisel = block('mason-chisel', 'beam', 252, 292, 200, 203, 3);
block('mason-chip-1', 'stone', 290, 292, 140, 142, 2);
const chip2 = block('mason-chip-2', 'stone', 300, 303, 170, 173, 3);
block('mason-chip-3', 'stone', 250, 254, 180, 182, 2.5);
block('mason-chip-4', 'stone', 305, 307, 215, 218, 2);
block('mason-chip-5', 'stone', 280, 283, 165, 167, 3.5);
hatless('masons-corner', [[245, 0, 130], [310, 0, 130], [250, 0, 230], [310, 0, 235], [290, 0, 185], [265, 0, 172]]);
spotOnTop('n-masons-corner-1', 'npc', 'masons-corner', brokenStone, -2);
spotOnTop('n-masons-corner-2', 'npc', 'masons-corner', chisel, 2);
spotOnTop('n-masons-corner-3', 'npc', 'masons-corner', chip2);
container('c-masons-corner-1', 'crate', 'masons-corner', 248, 0, 160);
container('c-masons-corner-2', 'chest', 'masons-corner', 300, 0, 200);
container('c-masons-corner-3', 'crate', 'masons-corner', 270, 0, 225);
prop('wheelbarrow', 285, 0, 215, 0.5);
prop('garden-rock', 296, 0, 152);
prop('garden-rock', 262, 0, 192);

// ---------- Child Graves: small stones in rows with kerbs ----------

const childStones: BlockDef[] = [];
for (let row = 0; row < 6; row++) {
  const z = 12 + row * 16;
  const stones = headstoneRow('cg', 6, z, {
    width: 3, depth: 1, gaps: [9], heights: [3, 4, 3.5, 5, 4.5], xEnd: 154, row,
  });
  stones.forEach((s, i) => { if ((i + row) % 2 === 1) kerbPlot(s, 4.5, 0.1); });
  childStones.push(...stones);
  paths.push({ id: `p-child-aisle-${row}`, kind: 'grass', points: [[2, z + 10], [158, z + 10]], width: 3 });
}
childStones.forEach((s, i) => { if (i % 6 === 2) prop('flower-pot', cx(s), 0, s.z1 + 2); });
hatless('child-graves', [[20, 0, 22], [80, 0, 38], [140, 0, 54], [40, 0, 70], [100, 0, 86], [60, 0, 112]]);
spotOnTop('n-child-graves-1', 'npc', 'child-graves', childStones[4]);
spotOnTop('n-child-graves-2', 'npc', 'child-graves', childStones[33]);
spotOnTop('n-child-graves-3', 'npc', 'child-graves', childStones[66]);
container('c-child-graves-1', 'vase', 'child-graves', cx(childStones[7]), 0, childStones[7].z1 + 2);
container('c-child-graves-2', 'grave-goods', 'child-graves', cx(childStones[28]), 0, childStones[28].z1 + 2);
container('c-child-graves-3', 'vase', 'child-graves', cx(childStones[51]), 0, childStones[51].z1 + 2);
prop('picket-fence', 30, 0, 4);
prop('picket-fence', 70, 0, 4);
prop('picket-fence', 110, 0, 4);
prop('picket-fence', 150, 0, 4);

// ---------- Yew Edge: two yews with a 20 gm choke on the path to the Tap ----------

const yewN = block('yew-n', 'hedge', 262, 318, 0.2, 20, 40);
const yewS = block('yew-s', 'hedge', 262, 318, 40, 119.8, 40);
paths.push({ id: 'p-yew-path', kind: 'gravel', points: [[170, 30], [330, 30], [350, 64], [378, 64]], width: 6 });
hatless('yew-edge', [[180, 0, 20], [220, 0, 60], [200, 0, 100], [240, 0, 30], [285, 0, 34], [250, 0, 110]]);
spotOnTop('n-yew-edge-1', 'npc', 'yew-edge', yewN, 0, 0);
spotOnTop('n-yew-edge-2', 'npc', 'yew-edge', yewS, 0, -20);
spotOnTop('n-yew-edge-3', 'npc', 'yew-edge', yewS, -15, 20);
container('c-yew-cache', 'camp-cache', 'yew-edge', 300, 0, 30, ['ladder']);
container('c-yew-edge-1', 'sack', 'yew-edge', 200, 0, 40);
container('c-yew-edge-2', 'crate', 'yew-edge', 230, 0, 90);
prop('signpost', 256, 0, 26);
prop('tree-stump', 190, 0, 70);
prop('tree-stump', 230, 0, 12);
prop('tree-stump', 210, 0, 112);

// ---------- The Tap: the gravel avenue up to the standpipe ----------

paths.push({ id: 'p-tap-avenue', kind: 'gravel', points: [[380, 400], [380, 62]], width: 10 });
paths.push({ id: 'p-gate-path', kind: 'gravel', points: [[320, 520], [320, 470], [320, 400]], width: 6 });
const clippedYews: BlockDef[] = [];
[120, 200, 280, 340].forEach((z, i) => {
  clippedYews.push(block(`clipped-yew-w${i + 1}`, 'hedge', 360, 368, z, z + 8, 14));
  clippedYews.push(block(`clipped-yew-e${i + 1}`, 'hedge', 392, 400, z, z + 8, 14));
});
hatless('the-tap', [[340, 0, 100], [420, 0, 150], [350, 0, 220], [410, 0, 300], [340, 0, 360], [425, 0, 40]]);
spotOnTop('n-the-tap-1', 'npc', 'the-tap', tapPlatform, -14, -14);
spotOnTop('n-the-tap-2', 'npc', 'the-tap', tapPlatform, 14, 14);
spotOnTop('n-the-tap-3', 'npc', 'the-tap', tapPlatform, -14, 14);
spotOnTop('n-the-tap-4', 'npc', 'the-tap', clippedYews[3]);
spotOnTop('board-the-tap', 'board', 'the-tap', tapPlatform, -14, 0); // west of the standpipe, between the NPC spots
container('c-the-tap-1', 'sack', 'the-tap', 366, 15, 30);
container('c-the-tap-2', 'crate', 'the-tap', 420, 0, 200);
container('c-the-tap-3', 'vase', 'the-tap', 345, 0, 300);
prop('signpost', 372, 0, 66);
[100, 180, 260, 320].forEach((z, i) => prop('bench', i % 2 === 0 ? 368 : 392, 0, z, Math.PI / 2));
[110, 150, 190, 230, 270, 310, 350, 390].forEach((z, i) => prop('flowering-bush', i % 2 === 0 ? 356 : 404, 0, z));
prop('flower-pot', 394, 15, 24);

// ---------- the map ----------

// ---------- buildings (roadmap 10): their blocks, routes, pits, containers, spots and props ----------
for (const p of BUILDING_PARTS) {
  blocks.push(...p.blocks); routes.push(...p.routes); pits.push(...p.pits);
  containers.push(...p.containers); spots.push(...p.spots); props.push(...p.props);
}

export const MAP: BlockoutMap = {
  bounds: { x0: 0, x1: 560, z0: 0, z1: 520 },
  blocks, routes, pits, spots, havens, water, paths, props, containers,
  playerSpawn: { x: 320, y: 0, z: 450 },
};

// ---------- self-check ----------

function inRect(r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number): boolean {
  return x > r.x0 + EPS && x < r.x1 - EPS && z > r.z0 + EPS && z < r.z1 - EPS;
}
function faceLength(r: { x0: number; x1: number; z0: number; z1: number }, side: Side): number {
  return side === 'n' || side === 's' ? r.x1 - r.x0 : r.z1 - r.z0;
}

/** Problems with a blockout (empty = fine). */
export function checkMap(map: BlockoutMap, regions: readonly RegionDef[] = REGIONS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const ids: [string, string][] = [
    ...map.blocks.map((b): [string, string] => ['block', b.id]),
    ...map.pits.map((p): [string, string] => ['pit', p.id]),
    ...map.routes.map((r): [string, string] => ['route', r.id]),
    ...map.spots.map((s): [string, string] => ['spot', s.id]),
    ...map.containers.map((c): [string, string] => ['container', c.id]),
    ...map.water.map((w): [string, string] => ['water', w.id]),
    ...map.havens.map((h): [string, string] => ['haven', h.id]),
    ...map.paths.map((p): [string, string] => ['path', p.id]),
  ];
  for (const [what, id] of ids) {
    if (seen.has(id)) problems.push(`duplicate id ${id} (${what})`);
    seen.add(id);
  }

  const blockById = new Map(map.blocks.map((b) => [b.id, b]));
  const pitById = new Map(map.pits.map((p) => [p.id, p]));
  for (const r of map.routes) {
    const b = blockById.get(r.block);
    const p = pitById.get(r.block);
    if (!b && !p) { problems.push(`route ${r.id} names missing block or pit ${r.block}`); continue; }
    const len = faceLength(b ?? p!.rect, r.side);
    if (r.at < 0 || r.at > len) problems.push(`route ${r.id} at ${r.at} is off its ${len} gm face`);
  }

  const baseAt = (x: number, z: number): number => {
    for (const p of map.pits) if (inRect(p.rect, x, z)) return -p.depth;
    return 0;
  };
  const checkPoint = (what: string, id: string, x: number, y: number, z: number, region: RegionId | null): void => {
    if (region !== null) {
      const at = regionAtIn(regions, x, z);
      if (at !== region) problems.push(`${what} ${id} names region ${region} but stands in ${at ?? 'no region'}`);
    } else if (regionAtIn(regions, x, z) === null) {
      problems.push(`${what} ${id} lies outside MAP_OUTLINE`);
    }
    let supported = Math.abs(y - baseAt(x, z)) < 1e-3;
    for (const b of map.blocks) {
      if (!inRect(b, x, z)) continue;
      const t = b.y + b.h;
      if (y > b.y - 1e-3 && y < t - 1e-3) problems.push(`${what} ${id} is inside block ${b.id} (y ${y}, top ${t})`);
      if (Math.abs(y - t) < 1e-3) supported = true;
    }
    if (y < baseAt(x, z) - 1e-3) problems.push(`${what} ${id} is below the ground`);
    if (!supported) problems.push(`${what} ${id} floats (y ${y}: no ground or block top there)`);
  };
  for (const s of map.spots) checkPoint('spot', s.id, s.x, s.y, s.z, s.region);
  for (const c of map.containers) checkPoint('container', c.id, c.x, c.y, c.z, c.region);
  for (const w of map.water) checkPoint('water', w.id, w.x, w.y, w.z, null);
  checkPoint('playerSpawn', 'player', map.playerSpawn.x, map.playerSpawn.y, map.playerSpawn.z, null);
  return problems;
}
