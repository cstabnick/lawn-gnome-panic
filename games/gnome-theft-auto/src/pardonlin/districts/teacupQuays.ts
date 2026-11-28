// Pardonlin district plan (E30): Teacup Row, the east quays and Place du Pot. Pure data (../plan.ts).
// The café quarter: a pedestrian lane of terraces (Teacup Row, x about -1523), the Quay along the Thymes Walk and Place du
// Pot at the south end. Coordinates are world metres (+x east, +z south). See teacupQuays.data.ts for the words.
import { euroBuilding } from '../../eurokit/catalog';
import { planStreetRow, type EuroPlacement } from '../../eurokit/street';
import { districtById, footprintProblem, frontage, inRect, pathPoints, roadClearance, type Footprint } from '../layout';
import { buildingFootprint, emptyPlan, keepClear, local, propFootprint, type DistrictPlan, type PlanProp, type PlanSign } from '../plan';
import { BUILDING_BANNERS, MENUS, POSTERS, RESIDENTS, STREET_SIGNS, VIGNETTES } from './teacupQuays.data';

const PI = Math.PI;
const PLACE = { x: -1500, z: 450 };

/** Yaw (three.js rotation.y) of a prefab standing at (x, z) whose front faces (tx, tz). */
const face = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

/** Piecewise-linear x of a north-south path at z (the path's points run with growing z). */
function xAtZ(pts: readonly (readonly [number, number])[], z: number): number {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    if (z >= az && z <= bz) return ax + ((bx - ax) * (z - az)) / (bz - az);
  }
  return pts[pts.length - 1][0];
}

export function planTeacupQuays(): DistrictPlan {
  const plan = emptyPlan('teacup-quays');
  const rects = districtById('teacup-quays').rects;
  const inside = (x: number, z: number): boolean => rects.some((r) => inRect(r, x, z));
  const taken: Footprint[] = [];
  const add = (bs: EuroPlacement[], keep?: (b: EuroPlacement) => boolean): void => {
    plan.buildings.push(...keepClear(keep ? bs.filter(keep) : bs, taken, rects));
  };
  const rect = (x0: number, x1: number, z0: number, z1: number): Footprint => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, yaw: 0 });

  const WALK = pathPoints('trail/thymes-walk');
  const QUAY = pathPoints('pl-quai-sud');
  const walkX = (z: number): number => xAtZ(WALK, z);
  const quayX = (z: number): number => xAtZ(QUAY, z);

  // ---- Buildings -------------------------------------------------------------------------------------------------
  // Fixed landmarks first: Café Pardon and the bakery (their interiors and activities are placed by other code).
  add([{ id: 'euro-corner-cafe', x: -1532, z: 140, yaw: PI / 2, scale: 1, tint: 0xf3d6cf, trim: 0x5a6470 }]);
  add([{ id: 'euro-bakery', x: -1515.2, z: 130, yaw: -PI / 2, scale: 1, tint: 0xe8c9a8, trim: 0x9a5a3c }]);
  // The lane and its two mouths stay open.
  taken.push(rect(-1526, -1521, 121, 244), rect(-1529, -1518.8, 100, 121), rect(-1529, -1518.8, 244, 262));

  const TALL = ['euro-townhouse-tall', 'euro-townhouse-mansard', 'euro-half-timbered'];
  const SHOPS = ['euro-shopfront-cheese', 'euro-shopfront-chemist', 'euro-shopfront-antiques', 'euro-bakery', 'euro-bistro', 'euro-townhouse-mansard'];
  const CAFES = ['euro-bistro', 'euro-bistro', 'euro-shopfront-cheese', 'euro-townhouse-mansard', 'euro-shopfront-antiques', 'euro-bakery'];
  const LANE_MIX = ['euro-bistro', 'euro-bistro', 'euro-shopfront-cheese', 'euro-townhouse-mansard', 'euro-shopfront-antiques', 'euro-half-timbered', 'euro-shopfront-chemist'];
  let seed = 100;
  const rows = (path: string, side: 'left' | 'right', offset: number, gap: number, mix: readonly string[] | undefined, corner: boolean, keep?: (b: EuroPlacement) => boolean): void => {
    for (const s of frontage(path, side, offset, gap)) add(planStreetRow({ ...s, seed: seed++, mix, corner }), keep);
  };
  // The lane's two walls: the west one faces east (yaw PI/2, runs north), the east one faces west (yaw -PI/2, runs south).
  const wall = (x: number, yaw: number, z0: number, len: number, corner: boolean): void => {
    add(planStreetRow({ x, z: z0, yaw, length: len, seed: seed++, mix: LANE_MIX, corner }));
  };
  wall(-1529, PI / 2, 136.8, 15.3, true);
  wall(-1529, PI / 2, 181.5, 38.3, false);
  wall(-1529, PI / 2, 243.5, 55.5, false);
  wall(-1518.2, -PI / 2, 121.5, 6.1, false);
  wall(-1518.2, -PI / 2, 132.4, 61.6, false);
  wall(-1518.2, -PI / 2, 200, 43.5, false);
  // The streets round it: shopfronts on the Rue Haute, tall townhouses on the quay road, a corner café at each corner.
  rows('pl-rue-c', 'right', 7.8, 2, CAFES, true);
  rows('pl-rue-d', 'left', 7.8, 2, CAFES, true);
  rows('pl-quai-sud', 'left', 7.8, 5, TALL, true);
  rows('pl-rue-haute', 'right', 7.8, 5, SHOPS, true, (b) => b.z < 300);
  rows('pl-rue-haute', 'left', 7.8, 5, SHOPS, true);
  rows('pl-avenue-se', 'left', 7.8, 3, SHOPS, false);
  rows('pl-avenue-se', 'right', 7.8, 3, TALL, false);
  rows('pl-rue-c', 'left', 7.8, 2, SHOPS, false);
  rows('pl-rue-d', 'right', 7.8, 2, SHOPS, true);
  // Place du Pot: a ring of cafés and townhouses facing the roundabout (keepClear drops what the roads forbid).
  const RING = ['euro-bistro', 'euro-townhouse-mansard', 'euro-shopfront-cheese', 'euro-half-timbered', 'euro-bakery', 'euro-townhouse-tall', 'euro-bistro', 'euro-shopfront-antiques'];
  for (let i = 0, a = 0.1; a < 2 * PI - 0.1; a += 0.235, i++) {
    const ux = Math.cos(a), uz = Math.sin(a);
    const id = RING[i % RING.length];
    const d = euroBuilding(id)!.depth;
    const r = 25 + d / 2;
    add([{ id, x: PLACE.x + ux * r, z: PLACE.z + uz * r, yaw: face(PLACE.x + ux * r, PLACE.z + uz * r, PLACE.x, PLACE.z), scale: 1, tint: [0xf1e3c6, 0xe8c9a8, 0xd9e2d3, 0xf3d6cf, 0xcfd8e3][i % 5], trim: [0x5a6470, 0x9a5a3c, 0x7b8691][i % 3] }]);
  }
  // Landmarks and kiosks: the church of the second helping, the covered market, a kiosk, a post booth, a tabac.
  add([{ id: 'euro-steeple-church', x: -1537, z: 335, yaw: PI / 2, scale: 1, tint: 0xe6dcb8, trim: 0x4a4f57 }]);
  add([{ id: 'euro-market-hall', x: -1500, z: 340, yaw: 0, scale: 1, tint: 0xd9e2d3, trim: 0x7b8691 }]);
  add([{ id: 'euro-post-booth', x: -1521, z: 400.5, yaw: face(-1521, 400.5, -1500, 410), scale: 1, tint: 0xd93636 }]);
  add([{ id: 'euro-tabac-kiosk', x: -1511.5, z: 414, yaw: face(-1511.5, 414, -1500, 414), scale: 1 }]);
  add([{ id: 'euro-tabac-kiosk', x: -1503.5, z: 67, yaw: face(-1503.5, 67, -1492, 67), scale: 1 }]);

  // ---- Props -----------------------------------------------------------------------------------------------------
  const bodies: Footprint[] = [];
  for (const b of plan.buildings) {
    const e = euroBuilding(b.id);
    if (e) bodies.push({ x: b.x, z: b.z, w: e.width * b.scale, d: e.depth * b.scale, yaw: b.yaw });
  }
  const inBox = (f: Footprint, x: number, z: number, m: number): boolean => {
    const dx = x - f.x, dz = z - f.z, c = Math.cos(f.yaw), s = Math.sin(f.yaw);
    return Math.abs(dx * c - dz * s) <= f.w / 2 + m && Math.abs(dx * s + dz * c) <= f.d / 2 + m;
  };
  const inBody = (x: number, z: number, m = 0.1): boolean => bodies.some((f) => Math.abs(f.x - x) < 12 && inBox(f, x, z, m));
  const inApron = (x: number, z: number, m = 0): boolean => taken.some((f) => inBox(f, x, z, m));
  const props: PlanProp[] = plan.props;
  /** Place a prop unless it would stand in a wall, on a road or outside the district. A solid that may not stand loses its collider. */
  const put = (id: string, x: number, z: number, o: Partial<PlanProp> = {}): boolean => {
    if (!inside(x, z) || inBody(x, z) || roadClearance(x, z) < 0.15) return false;
    const p: PlanProp = { id, x, z, ...o };
    if (p.solid) {
      const f = propFootprint(p);
      if (!f || footprintProblem(f, 0.3)) delete p.solid;
    }
    props.push(p);
    return true;
  };
  const signs: PlanSign[] = plan.signs;
  const sign = (s: PlanSign): void => { if (inside(s.x, s.z) && (s.kind === 'plaque' || s.kind === 'banner' || !inBody(s.x, s.z, 0.2))) signs.push(s); };

  // Tiles: 2 m grid slabs, never on a road, never under a wall, never stacked.
  const tiles: [number, number][] = [];
  let tileCount = 0;
  const tile = (id: string, x: number, z: number, keepApron = false): void => {
    if (!inside(x - 0.98, z - 0.98) || !inside(x + 0.98, z + 0.98)) return;
    for (const [dx, dz] of [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      if (roadClearance(x + dx * 0.98, z + dz * 0.98) < 1.6) return;
      if (inBody(x + dx * 0.98, z + dz * 0.98, 0.05)) return;
    }
    if (keepApron && inApron(x, z, 0.4)) return;
    if (tiles.some(([tx, tz]) => Math.abs(tx - x) < 1.9 && Math.abs(tz - z) < 1.9)) return;
    tiles.push([x, z]);
    tileCount++;
    props.push({ id, x, z });
  };

  // Teacup Row: a paved lane of setts (the terraces stand on it). FX09: laid ground, not tile props.
  plan.ground.push({ kind: 'setts', rect: { x: -1523.9, z: 184, w: 10, d: 146 } });
  // Place du Pot: the ring's own pavement goes all round it; the market square before the hall and the north square.
  plan.ground.push({ kind: 'setts', rect: { x: -1500, z: 369, w: 30, d: 32 } });
  plan.ground.push({ kind: 'flags', rect: { x: -1509, z: 416.5, w: 24, d: 19 } });
  void tile;

  // ---- Table sets, dressing ---------------------------------------------------------------------------------------
  let n = 0; // a running count that varies the dressing without random numbers
  const ON_TABLE = ['pl-espresso-cup', 'pl-croissant', 'pl-newspaper', 'pl-espresso-cup', 'pl-croissant'];
  const TABLE_TOP = 0.77;
  /** A café table at (x, z) with chairs at the given world angles (a = direction from the table to the chair, 0 = +z). */
  const tableSet = (x: number, z: number, angles: readonly number[], opts: { item?: boolean; parasol?: boolean } = {}): void => {
    if (!put('euro-cafe-table', x, z, { yaw: 0.4 * n, solid: { r: 0.4, h: TABLE_TOP } })) return;
    for (const a of angles) put('euro-cafe-chair', x + Math.sin(a) * 0.62, z + Math.cos(a) * 0.62, { yaw: a + PI + (n % 3 === 0 ? 0.25 : 0), tint: [0xc23b3b, 0x2f6b8f, 0x3b7a4a][n % 3] });
    if (opts.item !== false) {
      const id = ON_TABLE[n % ON_TABLE.length];
      put(id, x + 0.14, z - 0.06, { y: TABLE_TOP + 0.02, yaw: n });
    }
    if (opts.parasol) put('pl-cafe-parasol', x + Math.sin(angles[0] + PI / 2) * 0.7, z + Math.cos(angles[0] + PI / 2) * 0.7, { yaw: n });
    n++;
  };
  /** World point on a building's front: lx along the front (local +x), lz out from the body centre (front wall at depth / 2). */
  const front = (b: EuroPlacement, lx: number, lz: number): [number, number] => local(b.x, b.z, b.yaw, lx, lz);
  const nameIx: Record<string, number> = {};
  let bi = 0;
  const isLane = (b: EuroPlacement): boolean => Math.abs(b.x + 1523.5) < 12 && b.z > 110 && b.z < 250 && Math.abs(Math.sin(b.yaw)) > 0.9;

  for (const b of plan.buildings) {
    const e = euroBuilding(b.id);
    if (!e) continue;
    const D = e.depth, W = e.width;
    const lane = isLane(b);
    const isCafe = b.id === 'euro-bistro' || b.id === 'euro-corner-cafe';
    if (b.id === 'euro-post-booth' || b.id === 'euro-tabac-kiosk' || b.id === 'euro-steeple-church' || b.id === 'euro-market-hall') continue;
    const fixed = (b.x === -1532 && b.z === 140) || (b.x === -1515.2 && b.z === 130);
    bi++;
    // Terrace tables: the lane gets the full treatment, the rest of the town a table and a trough per café.
    if (isCafe) {
      const sets = b.id === 'euro-corner-cafe' ? (lane ? [-1.8, 0, 1.8] : [-1.2, 1.2]) : lane ? [-1.2, 1.2] : [bi % 2 ? -1.2 : 1.2];
      for (const lx of sets) {
        const [tx, tz] = front(b, lx, D / 2 + (b.id === 'euro-corner-cafe' ? 1.5 : 1.3));
        if (fixed) continue; // Café Pardon's terrace is dressed by hand below
        tableSet(tx, tz, [b.yaw, b.yaw + (lx < 0 ? PI / 2 : -PI / 2)], { parasol: n % 3 === 0 });
      }
      for (const lx of lane ? [-(W / 2 - 0.9), W / 2 - 0.9] : [W / 2 - 0.9]) {
        const [px, pz] = front(b, lx, D / 2 + 0.35);
        if (!fixed) put('euro-flower-trough', px, pz, { yaw: b.yaw });
      }
    } else if (lane || bi % 4 === 0) {
      // Shopfronts and townhouses: a pair of geranium pots at the door.
      for (const lx of [-(W / 2 - 0.5), W / 2 - 0.5]) {
        const [px, pz] = front(b, lx, D / 2 + 0.3);
        put('euro-geranium-pot', px, pz, { scale: 0.9 });
      }
    }
    // A name over the door (every lane building, one in four elsewhere).
    if (!fixed && (lane || (bi % 4 === 1 && b.id !== 'euro-townhouse-tall'))) {
      const [sx, sz] = front(b, 0, D / 2 + 0.05);
      const names = BUILDING_BANNERS[b.id] ?? BUILDING_BANNERS['euro-townhouse-mansard'];
      const name = names[(nameIx[b.id] = (nameIx[b.id] ?? -1) + 1) % names.length];
      sign({ kind: 'banner', text: name, x: sx, z: sz, yaw: b.yaw, y: b.id === 'euro-townhouse-tall' ? 3.2 : 3.6, w: Math.min(W - 0.4, 2.8), h: 0.5 });
    }
  }

  // Café Pardon (hand-built terrace): gramophone on a table, banner over the door, chairs beside it.
  sign({ kind: 'plaque', text: 'CAFÉ PARDON', x: -1528.95, z: 140, yaw: PI / 2, y: 4, w: 3, h: 0.6 });
  put('euro-cafe-table', -1525.5, 143.5, { solid: { r: 0.4, h: TABLE_TOP } });
  put('pl-gramophone', -1525.5, 143.5, { y: TABLE_TOP, yaw: -PI / 2 });
  put('euro-cafe-chair', -1524.85, 143.5, { yaw: -PI / 2, tint: 0x3b7a4a });
  put('euro-cafe-chair', -1525.5, 144.15, { yaw: PI, tint: 0x3b7a4a });
  put('euro-cafe-chair', -1526.05, 142.85, { yaw: 0.8, tint: 0x3b7a4a });
  put('pl-espresso-cup', -1525.35, 143.65, { y: TABLE_TOP + 0.02 });
  put('euro-flower-trough', -1528.55, 136.3, { yaw: PI / 2 });
  put('euro-flower-trough', -1528.55, 143.9, { yaw: PI / 2 });
  put('euro-topiary-spiral', -1527.3, 135.6, { scale: 0.75 });
  put('euro-topiary-spiral', -1527.3, 144.9, { scale: 0.75 });
  put('euro-cafe-table', -1526.4, 148.6, { solid: { r: 0.4, h: TABLE_TOP } });
  put('euro-cafe-chair', -1527.0, 148.6, { yaw: PI / 2 });
  put('pl-croissant', -1526.5, 148.55, { y: TABLE_TOP + 0.02 });
  sign({ kind: 'menu', text: 'Café Pardon: you may admire the menu. You may not order from it.', x: -1527.2, z: 134.2, yaw: PI / 2 + 0.2 });

  // The bakery: Brigitte's queue, bread basket and a bread stall of its own.
  sign({ kind: 'plaque', text: 'THE BAKERY\nQUEUE FORMS HERE', x: -1518.25, z: 130, yaw: -PI / 2, y: 4, w: 3, h: 0.6 });
  for (let k = 0; k < 5; k++) put('pl-queue-post', -1520.5, 133 + k * 1.5, { yaw: -PI / 2 });
  put('pl-bread-basket', -1519.1, 126.6);
  put('pl-baguette', -1519.0, 126.0, { yaw: 1.2, y: 0.3 });
  put('pl-baguette', -1519.0, 125.6, { yaw: 1.5, y: 0.3 });
  put('euro-geranium-pot', -1518.9, 133.2, { scale: 0.9 });
  put('euro-flower-trough', -1519.0, 128.7, { yaw: -PI / 2 });

  // ---- Teacup Row: furniture of the lane itself -----------------------------------------------------------------
  // Lamp posts alternate sides every 16 m, bollards at the mouths, flower troughs and topiary in pairs.
  for (let z = 126, k = 0; z < 244; z += 16, k++) put('euro-lamp-post', k % 2 ? -1520.7 : -1526.3, z, { solid: { r: 0.2, h: 4.2 } });
  for (const z of [121.8, 243.2]) for (const x of [-1527.4, -1519.6]) put('euro-bollard', x, z, { solid: { r: 0.15, h: 1 } });
  for (let z = 160; z < 240; z += 22) {
    put('euro-topiary-spiral', -1521.1, z, { scale: 0.8, solid: { r: 0.3, h: 1.8 } });
    put('euro-topiary-spiral', -1525.9, z + 11, { scale: 0.8, solid: { r: 0.3, h: 1.8 } });
  }
  // Mouths: a rose arch at each end, pots, a street name.
  put('euro-rose-arch', -1523.5, 116.2, { yaw: 0 });
  put('euro-rose-arch', -1523.5, 247.5, { yaw: 0 });
  for (const [x, z] of [[-1527.7, 118], [-1519.3, 118], [-1527.7, 246], [-1519.3, 246]]) put('euro-geranium-pot', x, z);
  for (const [x, z] of [[-1527.2, 114.5], [-1519.8, 114.5]]) put('euro-flower-trough', x, z, { yaw: PI / 2 });

  // Mid-lane café tables, dealt out by hand along the lane (west side faces the east wall, east side the west wall).
  const spill: [number, number, number, boolean][] = [
    [-1525.2, 126, PI / 2, false], [-1525.6, 160, PI / 2, true], [-1525.4, 176, PI / 2, false], [-1525.5, 198, PI / 2, true],
    [-1525.6, 214, PI / 2, false], [-1525.4, 232, PI / 2, true], [-1521.6, 166, -PI / 2, false], [-1521.5, 186, -PI / 2, true],
    [-1521.6, 222, -PI / 2, false], [-1521.5, 238, -PI / 2, true], [-1521.7, 148, -PI / 2, true], [-1521.6, 203, -PI / 2, false],
  ];
  for (const [x, z, a, par] of spill) tableSet(x, z, [a, a + (n % 2 ? PI / 2 : -PI / 2)], { parasol: par });
  // Window boxes along the walls: troughs and pots set against the lane wall fronts.
  for (let z = 150; z < 240; z += 9) {
    put('euro-geranium-pot', -1528.6, z + 3, { scale: 0.9 });
    put('euro-geranium-pot', -1518.7, z + 6.5, { scale: 0.9 });
  }
  // The lane's bike racks: full of nothing.
  put('bike-rack', -1519.4, 188, { yaw: -PI / 2 });
  put('bike-rack', -1519.4, 197, { yaw: -PI / 2 });
  put('bike-rack', -1528.3, 119.5, { yaw: PI / 2 });

  // ---- Vignettes ------------------------------------------------------------------------------------------------
  // 1. The espresso since Tuesday (the Sips' table), x -1523.5, z 152.
  tableSet(-1524.4, 152.4, [PI / 2, -PI / 2], { item: false });
  put('pl-newspaper', -1524.55, 152.3, { y: TABLE_TOP + 0.02, yaw: 0.3 });
  put('pl-espresso-cup', -1524.4, 152.4, { y: TABLE_TOP + 0.06 });
  put('euro-cafe-table', -1522.6, 154.4, { solid: { r: 0.4, h: TABLE_TOP } });
  put('pl-newspaper', -1522.6, 154.4, { y: TABLE_TOP + 0.02, yaw: 0, scale: 1.1 });
  for (const [dx, dz] of [[-0.18, -0.12], [0.1, -0.2], [0.2, 0.1], [-0.05, 0.15], [-0.25, 0.1], [0.02, 0.0]]) put('pl-boule', -1522.6 + dx, 154.4 + dz, { y: TABLE_TOP + 0.07 });
  put('euro-cafe-chair', -1522.6, 155.0, { yaw: PI });
  put('euro-cafe-chair', -1522.6, 153.8, { yaw: 0 });
  put('crate', -1523.5, 150.6, { scale: 0.55, solid: { r: 0.3, h: 0.45 } });
  for (let k = 0; k < 12; k++) put('pl-espresso-cup', -1523.5, 150.6, { y: 0.45 + k * 0.045, yaw: k * 0.5 });

  // 2. The bakery queue at dawn, x -1520.5, z 136: posts above, plus a bench and a bedroll, a thermos, a ticket board.
  put('bench', -1522.9, 141.6, { yaw: -PI / 2, solid: { w: 0.5, d: 1.7, h: 0.5 } });
  put('rug', -1522.9, 141.6, { y: 0.53, yaw: 0, scale: 0.6 });
  put('pot', -1521.9, 143.0, { scale: 0.35 });
  put('pl-baguette', -1522.4, 142.8, { y: 0.02, yaw: 0.9, rot: [0, 0.9, PI / 2] });
  put('pl-bread-basket', -1519.2, 139.9);
  put('pl-baguette', -1519.2, 140.1, { y: 0.5, yaw: 0.2 });
  put('pl-queue-post', -1520.5, 140.5, { yaw: -PI / 2 });
  sign({ kind: 'plaque', text: 'NOW SERVING NO. 4\nTICKETS ISSUED: 4,311', x: -1519.55, z: 137.4, yaw: -PI / 2, y: 1.45, w: 1.2, h: 0.7 });
  put('wooden-post', -1519.4, 137.4, { scale: 0.7 });

  // 3. The waiter's revenge, x -1525.3, z 170: a table set for one, the bill on it, a chair turned to the wall.
  put('euro-cafe-table', -1525.3, 168.6, { solid: { r: 0.4, h: TABLE_TOP } });
  put('euro-cafe-chair', -1525.3, 169.25, { yaw: PI });
  put('pl-newspaper', -1525.2, 168.5, { y: TABLE_TOP + 0.02, yaw: 0.9, scale: 0.7 });
  put('pl-croissant', -1525.4, 168.7, { y: TABLE_TOP + 0.05 });
  put('euro-cafe-chair', -1527.7, 170.8, { yaw: -PI / 2 });
  put('euro-cafe-chair', -1527.0, 168.0, { rot: [0, 2.2, PI / 2], y: 0.25 });

  // 4. The bicycle that is a planter: the lane's south mouth.
  put('bike-rack', -1526.6, 250.5, { yaw: -PI / 2, solid: { w: 0.5, d: 1.8, h: 1 } });
  for (const dz of [-0.55, 0, 0.55]) put('euro-geranium-pot', -1526.2, 250.5 + dz, { scale: 0.8 });
  put('euro-geranium-bed', -1524.2, 250.5, { yaw: PI / 2 });
  put('euro-bollard', -1527.9, 248.7, { solid: { r: 0.15, h: 1 } });
  put('euro-bollard', -1527.9, 252.3, { solid: { r: 0.15, h: 1 } });
  sign({ kind: 'poster', text: 'BICYCLES ONLY\n(this one is a planter)', x: -1525.1, z: 253.6, yaw: PI });

  // ---- Street furniture around -----------------------------------------------------------------------------------
  // The quay road's east pavement: terraces on the road side, lamps, trees.
  for (let z = 20; z < 440; z += 34) {
    const x = quayX(z) + 5.6;
    put('euro-lamp-post', x, z, { solid: { r: 0.2, h: 4.2 } });
  }
  for (let z = 30; z < 430; z += 13) {
    const x = quayX(z) + 4.7;
    if (!inApron(x, z, 0.6)) put('euro-flower-trough', x, z + 3, { yaw: PI / 2 });
  }
  // Rue Haute: plane trees and lamps both sides, benches under the trees.
  const haute = pathPoints('pl-rue-haute');
  for (let z = 10; z < 420; z += 22) {
    const x = xAtZ(haute, z);
    for (const s of [-1, 1]) {
      const px = x + s * 4.9, pz = z + (s > 0 ? 0 : 11);
      if (!inApron(px, pz, 0.8)) put('euro-plane-tree', px, pz, { scale: 0.85, solid: { r: 0.45, h: 8 } });
    }
  }
  for (let z = 4; z < 430; z += 20) {
    const x = xAtZ(haute, z);
    put('euro-lamp-post', x - 5.3, z + 5, { solid: { r: 0.2, h: 4.2 } });
    put('euro-lamp-post', x + 5.3, z + 15, { solid: { r: 0.2, h: 4.2 } });
  }
  // The avenue from the Hatwheel: bollards and lamps on both sides, a plane tree at each end.
  const avenue = pathPoints('pl-avenue-se');
  for (let t = 0.08; t < 0.95; t += 0.14) {
    const x = avenue[0][0] + (avenue[1][0] - avenue[0][0]) * t, z = avenue[0][1] + (avenue[1][1] - avenue[0][1]) * t;
    put('euro-lamp-post', x - 5.6, z, { solid: { r: 0.2, h: 4.2 } });
    put('euro-bollard', x + 5.2, z, { solid: { r: 0.15, h: 1 } });
  }

  // The Quay: iron railing on the river side of the Thymes Walk, a gap every few sections for the steps.
  let rail = 0;
  for (let z = 30; z < 218; z += 2.07) {
    const wx = walkX(z), wx2 = walkX(z + 1);
    const tx = wx2 - wx, tz = 1, len = Math.hypot(tx, tz);
    const x = wx - 2.45 - 0.0, yaw = Math.atan2(-tz / len, tx / len);
    rail++;
    if (rail % 7 === 0 || x < -1594.7) continue;
    put('euro-iron-railing', x, z, { yaw, solid: { w: 2, d: 0.2, h: 1.1 } });
  }
  // Further south the walk drifts out of the district: bollards along its road side instead, benches facing the river.
  for (let z = 222; z < 495; z += 10) {
    const x = walkX(z) + 3.7;
    if (inside(x, z)) put('euro-bollard', x, z, { solid: { r: 0.15, h: 1 } });
  }
  for (let z = 236; z < 480; z += 41) put('park-bench', walkX(z) + 4.6, z, { yaw: -PI / 2, solid: { w: 0.7, d: 1.8, h: 0.9 } });
  for (let z = 244; z < 480; z += 41) put('euro-lamp-post', walkX(z) + 4.0, z, { solid: { r: 0.2, h: 4.2 } });
  for (let z = 270; z < 480; z += 41) put('euro-plane-tree', walkX(z) + 6.2, z + 6, { scale: 0.8, solid: { r: 0.45, h: 8 } });
  // Benches on the narrow stretch face the river from the road side of the walk where the quay road leaves room.
  for (const z of [38, 205]) put('park-bench', walkX(z) + 3.1, z, { yaw: -PI / 2 });

  // ---- Quay vignettes -------------------------------------------------------------------------------------------
  // 5. The book that fell in: Prudence's green boxes on the quay, a gap in the books, a rod hooked on the railing.
  const sx = (z: number): number => walkX(z) + 3.5;
  put('pl-book-stall', sx(70), 70, { yaw: -PI / 2, solid: { w: 1, d: 2, h: 1.4 } });
  put('pl-book-stall', sx(82), 83, { yaw: -PI / 2, solid: { w: 1, d: 2, h: 1.4 } });
  put('red-book', sx(70) + 0.9, 73.3, { y: 0.02, yaw: 0.7 });
  put('red-book', sx(70) + 1.2, 73.6, { y: 0.02, yaw: 2.1 });
  // the fallen book's trail: books spilled from the second stall toward the railing, then a gap, then the water
  for (const [dx, z, yw] of [[0.9, 85.6, 0.4], [0.2, 87.4, 1.9], [-0.5, 89.2, 0.9], [-1.1, 91.0, 2.6]]) put('red-book', sx(z) + dx - 0.6, z, { y: 0.02, yaw: yw });
  put('book-pedestal', sx(82) + 1.5, 80.2, { scale: 0.7 });
  put('euro-cafe-chair', sx(80) + 1.6, 77.4, { yaw: -PI / 2 });
  const rz = 93;
  const rx = walkX(rz) - 2.45;
  put('fishing-rod', rx - 0.15, rz, { y: 1.1, rot: [0, 0.2, 0.9] });
  put('stool', rx - 0.55, rz + 0.8, { scale: 0.9 });
  put('litter-bin', rx - 0.35, rz - 1.5, { scale: 0.6 });
  put('message-bottle', rx - 0.3, rz + 2.4, { y: 0.02 });
  put('euro-cafe-chair', rx + 0.7, rz - 0.8, { yaw: -PI / 2 });
  // 6. The accordionist's empty pitch: crate with the accordion, a hat with three acorns, a sandwich.
  const pz = 332;
  put('crate', walkX(pz) + 5.0, pz, { scale: 0.7, solid: { r: 0.3, h: 0.55 } });
  put('pl-accordion', walkX(pz) + 5.0, pz, { y: 0.56, yaw: -PI / 2 });
  put('wicker-basket', walkX(pz) + 4.4, pz + 1.1, { scale: 0.8 });
  for (const [dx, dz] of [[-0.1, -0.05], [0.08, 0.06], [0.0, 0.14]]) put('acorn', walkX(pz) + 4.4 + dx, pz + 1.1 + dz, { y: 0.1, scale: 0.7 });
  put('bread-loaf', walkX(pz) + 5.3, pz + 1.5, { y: 0.02, scale: 0.5 });
  put('cheese-wedge', walkX(pz) + 5.6, pz + 1.4, { y: 0.02, scale: 0.5 });
  put('euro-cafe-chair', walkX(pz) + 6.2, pz - 0.5, { yaw: -PI / 2 });
  // Anatole's real pitch (near the camera spot) for the resident.
  put('crate', -1586.2, 200.0, { scale: 0.6, solid: { r: 0.3, h: 0.5 } });
  put('wicker-basket', -1586.4, 197.1, { scale: 0.7 });
  // Notice on the quay.
  sign({ kind: 'poster', text: 'NOTICE\nThe river is decorative.\nPlease do not use it as a river.', x: walkX(160) - 1.4, z: 160, yaw: -PI / 2 });

  // ---- Place du Pot ---------------------------------------------------------------------------------------------
  // The belt round the ring (r 20..22.5): plane trees, benches, lamps, bins. Nothing within 20 m of the island's centre.
  for (let a = 0.25, k = 0; a < 2 * PI; a += 0.31, k++) {
    const r = 21.2;
    const x = PLACE.x + Math.cos(a) * r, z = PLACE.z + Math.sin(a) * r;
    if (inApron(x, z, 0.3)) continue;
    if (k % 3 === 0) put('euro-plane-tree', x, z, { scale: 0.9, solid: { r: 0.45, h: 8 } });
    else if (k % 3 === 1) put('park-bench', x, z, { yaw: face(x, z, PLACE.x, PLACE.z), solid: { w: 1.8, d: 0.7, h: 0.9 } });
    else put('euro-lamp-post', x, z, { solid: { r: 0.2, h: 4.2 } });
  }
  // The north square: a fountain at its heart, hedges, benches facing it, a kiosk and a bin.
  put('euro-fountain', -1500, 392, { solid: { r: 1.9, h: 3 } });
  for (const [x, z, y] of [[-1507, 392, -PI / 2], [-1493, 392, PI / 2], [-1500, 399.5, PI]]) put('park-bench', x, z, { yaw: y, solid: { w: 1.8, d: 0.7, h: 0.9 } });
  for (let x = -1511; x <= -1489; x += 2.06) { if (Math.abs(x + 1500) > 5) put('euro-box-hedge', x, 411.5, { yaw: 0 }); }
  put('litter-bin', -1495, 399, { solid: { r: 0.3, h: 1 } });
  // 7. The post booth queue that is waiting for lunch to end: posts, parcels, a deck chair, a suitcase.
  const bx = -1521, bz = 400.5;
  for (let k = 0; k < 4; k++) put('pl-queue-post', bx + 1.2 + k * 1.5, bz + 3.4, { yaw: 0 });
  put('cargo-crate', bx - 1.2, bz - 0.2, { scale: 0.6 });
  put('cargo-crate', bx - 1.3, bz + 1.0, { scale: 0.5, yaw: 0.4 });
  put('lost-suitcase', bx - 0.2, bz + 2.0, { yaw: 0.9 });
  put('deck-chair', bx + 2.4, bz + 1.0, { yaw: face(bx + 2.4, bz + 1, bx, bz) });
  put('mailbox', bx + 1.6, bz - 0.6, { solid: { r: 0.3, h: 1.1 } });
  sign({ kind: 'plaque', text: 'POST BOOTH\nCLOSED FOR LUNCH\nBACK AFTER LUNCH', x: bx, z: bz + 0.7, yaw: face(bx, bz, -1500, 410), y: 1.5, w: 0.9, h: 0.6 });

  // ---- The market: square before the hall, stalls, produce, a choir of pigeons ----------------------------------
  for (const [x, z] of [[-1512, 359], [-1488, 359], [-1512, 379], [-1488, 379]]) put('euro-plane-tree', x, z, { scale: 0.9, solid: { r: 0.45, h: 8 } });
  put('euro-fountain', -1500, 369, { solid: { r: 1.9, h: 3 } });
  for (let k = 0; k < 5; k++) {
    const x = -1514 + k * 6.3;
    if (k === 2) continue;
    put('market-stall', x, 351.7, { yaw: 0 });
  }
  for (const [x, z] of [[-1496, 351.8], [-1504, 352.4]]) { put('pl-produce-crate', x, z); put('pl-marrow', x, z, { y: 0.35, yaw: 0.7 }); }
  put('pl-cheese-wheel', -1491, 352.2, { yaw: 0.3 });
  for (let k = 0; k < 6; k++) put('bird-pigeon', -1500 + Math.cos(k * 1.1) * 3.2, 369 + Math.sin(k * 1.1) * 3.2, { yaw: k * 0.9, scale: 0.7 });

  // ---- Courts and gardens behind the rows -----------------------------------------------------------------------
  // West court behind Teacup Row: the Cour of Broken Teacups: boules, vines, washing, a pear against the wall.
  put('euro-boules-court', -1550, 168, { yaw: 0 });
  put('euro-boules-court', -1550, 186, { yaw: 0 });
  put('euro-vine-pergola', -1543, 160, { yaw: 0 });
  put('euro-washing-line', -1556, 205, { yaw: PI / 2 });
  put('euro-washing-line', -1546, 215, { yaw: PI / 2 });
  put('euro-espalier-pear', -1534.2, 205, { yaw: PI / 2 });
  put('euro-water-butt', -1536.2, 224, {});
  for (let z = 150; z < 232; z += 6) put('euro-geranium-pot', -1560, z);
  put('bench', -1544, 195, { yaw: PI / 2, solid: { w: 0.5, d: 1.7, h: 0.5 } });
  put('bench', -1544, 178, { yaw: PI / 2 });
  put('euro-topiary-spiral', -1555, 160, { scale: 0.9 });
  put('euro-topiary-spiral', -1539, 238, { scale: 0.9 });
  put('wheelbarrow', -1558, 228, { yaw: 0.8 });
  // East court behind the east wall: the Jardin of Mended Cups (a parterre) with a fountain.
  put('euro-fountain', -1492, 190, { solid: { r: 1.9, h: 3 } });
  for (let a = 0; a < 8; a++) put('euro-box-hedge', -1492 + Math.cos(a * PI / 4) * 6.5, 190 + Math.sin(a * PI / 4) * 6.5, { yaw: a * PI / 4 + PI / 2 });
  for (const [x, z] of [[-1500, 170], [-1484, 170], [-1500, 210], [-1484, 210]]) put('euro-topiary-lollipop', x, z, { scale: 0.9 });
  for (const [x, z] of [[-1500, 190], [-1484, 190]]) put('park-bench', x, z, { yaw: face(x, z, -1492, 190), solid: { w: 1.8, d: 0.7, h: 0.9 } });
  put('euro-plane-tree', -1506, 160, { solid: { r: 0.45, h: 8 } });
  put('euro-plane-tree', -1482, 224, { solid: { r: 0.45, h: 8 } });
  put('euro-geranium-bed', -1498, 232, {});
  put('euro-geranium-bed', -1486, 232, {});
  put('euro-boules-court', -1498, 148, { yaw: PI / 2 });
  // The Potager east of the Rue Haute: allotments and a bean for scale.
  for (let z = 20; z < 240; z += 20) {
    put('allotment-bed', -1428, z, { yaw: PI / 2 });
    put('lavender-row', -1420, z + 6, { yaw: PI / 2 });
    put('euro-espalier-pear', -1410.5, z + 12, { yaw: -PI / 2 });
  }
  put('wheelbarrow', -1436, 72, { yaw: 0.4 });
  put('euro-water-butt', -1414, 128, {});
  // The Square of Perpetual Argument (between the avenue and the Rue Haute): benches facing each other, boules.
  put('euro-boules-court', -1492, 60, { yaw: 0 });
  put('euro-boules-court', -1492, 74, { yaw: 0 });
  for (const [x, z, y] of [[-1486, 60, -PI / 2], [-1498, 74, PI / 2]]) put('park-bench', x, z, { yaw: y, solid: { w: 0.7, d: 1.8, h: 0.9 } });
  put('euro-plane-tree', -1503, 40, { solid: { r: 0.45, h: 8 } });
  put('euro-plane-tree', -1481, 90, { solid: { r: 0.45, h: 8 } });
  // The Allotment of Lost Teaspoons (between the quay and the avenue).
  for (let z = 20; z < 100; z += 14) { put('euro-geranium-bed', -1550, z, { yaw: PI / 2 }); put('euro-box-hedge', -1557, z, { yaw: PI / 2 }); }
  put('euro-vine-pergola', -1540, 55, { yaw: PI / 2 });
  put('euro-topiary-spiral', -1546, 30, { scale: 0.9 });
  // The block between the market and the quay: boules, a church garden, the Church of the Second Helping.
  put('euro-boules-court', -1555, 300, { yaw: 0 });
  put('euro-boules-court', -1555, 312, { yaw: 0 });
  put('euro-boules-court', -1550, 360, { yaw: PI / 2 });
  put('bench', -1554, 322, { yaw: PI / 2, solid: { w: 0.5, d: 1.7, h: 0.5 } });
  for (let z = 276; z < 300; z += 6) put('lavender-row', -1536, z, { yaw: PI / 2 });
  put('euro-rose-arch', -1522, 330, { yaw: PI / 2 });
  put('euro-topiary-spiral', -1525, 318, { scale: 0.9 });
  put('euro-topiary-spiral', -1525, 346, { scale: 0.9 });
  put('gnome-statue', -1528, 365, { yaw: PI / 2 });
  // 8. The audience of chairs: a bandstand, three rows of café chairs all facing it, nobody sitting, and the programme.
  put('bandstand', -1525, 284, { yaw: 0, solid: { r: 2.4, h: 3 } });
  for (let row = 0; row < 3; row++) {
    for (let k = -3; k <= 3; k++) put('euro-cafe-chair', -1525 + k * 0.85, 291 + row * 1.1, { yaw: PI, tint: [0xc23b3b, 0x2f6b8f, 0x3b7a4a][(k + row + 6) % 3] });
  }
  put('pl-music-stand', -1526.2, 282.4, { yaw: 0 });
  put('pl-cello', -1523.4, 283.3, { yaw: 0.4, rot: [0.3, 0.4, 0.1] });
  put('euro-bollard', -1530.5, 292, { solid: { r: 0.15, h: 1 } });
  put('euro-bollard', -1519.5, 292, { solid: { r: 0.15, h: 1 } });
  sign({ kind: 'poster', text: 'CONCERT TONIGHT\nthe same one as last night, a little slower', x: -1530.4, z: 295.5, yaw: PI / 2 });

  // ---- Signs ------------------------------------------------------------------------------------------------------
  // Street signs and posters, menus: positions are decided in teacupQuays.data.ts (text) and here (where).
  for (const s of STREET_SIGNS) sign({ kind: 'street', text: s.text, x: s.x, z: s.z, yaw: s.yaw });
  for (const s of MENUS) sign({ kind: 'menu', text: s.text, x: s.x, z: s.z, yaw: s.yaw });
  for (const s of POSTERS) sign({ kind: 'poster', text: s.text, x: s.x, z: s.z, yaw: s.yaw });

  plan.vignettes.push(...VIGNETTES);
  plan.residents.push(...RESIDENTS);
  void tileCount; void buildingFootprint;
  return plan;
}
