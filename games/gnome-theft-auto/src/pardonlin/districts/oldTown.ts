// Pardonlin district plan (E30): the Old Town: the Bean Tower, the Grand Platz, the Rue Haute. Pure data (../plan).
//
// Fixed points other code leans on (do not move): the Grand Platz queue (posts at x -1486.8, z -232..-196, poster at
// (-1486,-194)), Odile's portrait spot (Odile (-1540,-262), easel (-1540,-263.2), sitter (-1540,-270)), the bandstand
// at (-1500,-235) (Radio Adagio's gramophone is on its floor), the Bean Tower at (-1520,-366).
import { getPrefab } from '@lawn/prefabs';
import { euroBuilding } from '../../eurokit/catalog';
import { planStreetRow, type EuroPlacement } from '../../eurokit/street';
import type { AmbientGnomeDef } from '../../ambientGnomes';
import { districtById, footprintProblem, footprintsOverlap, frontage, pathPoints, roadClearance, type Footprint } from '../layout';
import { emptyPlan, keepClear, local, type DistrictPlan, type PlanProp, type PlanSign } from '../plan';

const PI = Math.PI;
const TILE = 3;            // the paving grid (m): a tile prefab at scale 1.5 is 2.94 m
const TILE_TOP = 0;        // FX09: the paving is a ground decal now, so nothing is lifted onto tiles

/** A post's yaw so that its rope (local +x) runs along (dx, dz). */
const yawToward = (dx: number, dz: number): number => Math.atan2(-dz, dx);

interface RowSpec {
  path: string; side: 'left' | 'right'; off: number; seed: number;
  mix?: readonly string[]; corner?: boolean; gap?: number; from?: number; to?: number;
}

/** Shopfronts and bistros: the Rue Haute. */
const HIGH_MIX = [
  'euro-shopfront-cheese', 'euro-bakery', 'euro-bistro', 'euro-shopfront-chemist', 'euro-shopfront-antiques',
  'euro-townhouse-tall', 'euro-townhouse-mansard', 'euro-half-timbered', 'euro-bistro', 'euro-bakery',
];
/** Side streets: houses and flats. */
const SIDE_MIX = [
  'euro-townhouse-mansard', 'euro-townhouse-tall', 'euro-half-timbered', 'euro-apartment-block', 'euro-townhouse-mansard',
  'euro-townhouse-tall', 'euro-shopfront-antiques', 'euro-bakery',
];
const BACK_MIX = ['euro-apartment-block', 'euro-townhouse-mansard', 'euro-townhouse-tall', 'euro-half-timbered', 'euro-apartment-block'];

const ROWS: RowSpec[] = [
  // The Rue Haute, east then west side.
  { path: 'pl-rue-haute', side: 'left', off: 8, seed: 11, mix: HIGH_MIX, gap: 4 },
  { path: 'pl-rue-haute', side: 'right', off: 8.3, seed: 12, mix: HIGH_MIX, gap: 4 },
  // North of the Bean Tower: rue-nord both sides.
  { path: 'pl-rue-nord', side: 'right', off: 8, seed: 21, mix: SIDE_MIX, gap: 3 },
  { path: 'pl-rue-nord', side: 'left', off: 8, seed: 22, mix: SIDE_MIX, gap: 3 },
  // Rue-a: the tower block's south front, the Platz's north front.
  { path: 'pl-rue-a', side: 'left', off: 8, seed: 31, mix: SIDE_MIX, gap: 3 },
  { path: 'pl-rue-a', side: 'right', off: 8, seed: 32, mix: HIGH_MIX, gap: 3, corner: true },
  // Rue-b: the Platz's south front, and the ordinary block's north front.
  { path: 'pl-rue-b', side: 'left', off: 8, seed: 41, mix: HIGH_MIX, gap: 3, corner: true },
  { path: 'pl-rue-b', side: 'right', off: 8, seed: 42, mix: SIDE_MIX, gap: 3 },
  // The quay road's east side.
  { path: 'pl-quai-nord', side: 'right', off: 8, seed: 51, mix: SIDE_MIX, gap: 4 },
  // The avenue's two sides.
  { path: 'pl-avenue-ne', side: 'left', off: 8, seed: 61, mix: SIDE_MIX, gap: 3 },
  { path: 'pl-avenue-ne', side: 'right', off: 8, seed: 62, mix: SIDE_MIX, gap: 3 },
  // The road to the North Wicket.
  { path: 'pl-north-gate', side: 'right', off: 8, seed: 71, mix: SIDE_MIX, gap: 3 },
];

/** Shop names over doors, by building id (rotated). */
const SHOP_NAMES: Record<string, string[]> = {
  'euro-shopfront-cheese': [
    'CHEESE. ONLY CHEESE.\nDO NOT ASK FOR BUTTER.', 'THE ONE CHEESE SHOP\n(the other is a rumour)', 'CHEESE (aged)\n(the shop also aged)',
  ],
  'euro-bakery': ['BREAD. OPINIONS ON BREAD.\nNo refunds on opinions.', 'BAKERY. Today: bread.\nTomorrow: also bread.', 'LOAVES, LONG AND LONGER'],
  'euro-bistro': ['BISTRO. Lunch begins at ten.\nResumes at five.', 'BISTRO. Soup of the day:\nyesterday.', 'BISTRO. Reserved table:\nnot yours.'],
  'euro-shopfront-chemist': ['CHEMIST. Cures: most things.\nCauses: queues.', 'CHEMIST. Forms in triplicate.\nPills in singles.'],
  'euro-shopfront-antiques': ['ANTIQUES (and antiques of antiques)', 'ANTIQUES. Everything is exactly\nas old as it says. Usually.', 'ANTIQUES. Do not sit on the chair.\nIt is older than you.'],
  'euro-corner-cafe': ['CAFE DU COIN\n(the corner has moved)', 'CAFE. Coffee: small, smaller,\na rumour.'],
};

// ---------------------------------------------------------------------------------------------------------------------
export function planOldTown(): DistrictPlan {
  const plan = emptyPlan('old-town');
  const rects = districtById('old-town').rects;
  const taken: Footprint[] = [];
  const props: PlanProp[] = plan.props;
  const signs: PlanSign[] = plan.signs;
  const tiles: { x: number; z: number }[] = [];

  // ---- Helpers ------------------------------------------------------------------------------------------------------
  const tileAt = (x: number, z: number): boolean => tiles.some((t) => Math.abs(t.x - x) < TILE / 2 - 0.03 && Math.abs(t.z - z) < TILE / 2 - 0.03);
  const NOLIFT = new Set([
    'euro-paving-tile', 'euro-cobble-tile', 'bandstand', 'euro-fountain', 'pl-pigeon-statue', 'euro-plane-tree', 'pl-bean-tower',
    'pl-queue-post', 'euro-boules-court', 'euro-lamp-post', 'euro-bollard', 'euro-box-hedge',
  ]);
  /** Place a prop. y is metres above the local ground (the paving, when it stands on tiles). */
  const put = (id: string, x: number, z: number, o: Partial<PlanProp> & { lift?: boolean } = {}): void => {
    const { lift, ...rest } = o;
    const onTile = lift !== false && !NOLIFT.has(id) && tileAt(x, z);
    const p: PlanProp = { id, x: +x.toFixed(2), z: +z.toFixed(2), ...rest };
    if (onTile) p.y = (rest.y ?? 0) + TILE_TOP;
    props.push(p);
  };
  const free = (x: number, z: number, m = 0.6): boolean => {
    const f: Footprint = { x, z, w: m * 2, d: m * 2, yaw: 0 };
    return !footprintProblem(f, 0.3) && !taken.some((o) => footprintsOverlap(f, o));
  };
  const putFree = (id: string, x: number, z: number, o: Partial<PlanProp> & { lift?: boolean } = {}, m = 0.6): void => {
    if (free(x, z, m)) put(id, x, z, o);
  };
  const sign = (kind: PlanSign['kind'], text: string, x: number, z: number, yaw: number, extra: Partial<PlanSign> = {}, exact = false): void => {
    let sx = x, sz = z;
    if (!exact && (kind === 'street' || kind === 'poster' || kind === 'menu') && !free(x, z, 0.5)) {
      // Nudge a free-standing sign off a wall or a road: the nearest clear spot on a 0.5 m search.
      let best: [number, number] | null = null;
      let bd = Infinity;
      for (let dx = -8; dx <= 8; dx += 0.5) {
        for (let dz = -8; dz <= 8; dz += 0.5) {
          const d = Math.hypot(dx, dz);
          if (d < bd && free(x + dx, z + dz, 0.5) && roadClearance(x + dx, z + dz) > 0.9) { bd = d; best = [x + dx, z + dz]; }
        }
      }
      if (best) [sx, sz] = best;
    }
    signs.push({ kind, text, x: +sx.toFixed(2), z: +sz.toFixed(2), yaw, ...extra });
  };

  /** A line of queue posts along a polyline: 1.5 m apart, each pointing its rope at the next post. */
  const queue = (pts: readonly (readonly [number, number])[], lastYaw?: number): void => {
    let yaw = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.round(len / 1.5));
      const dx = (bx - ax) / len, dz = (bz - az) / len;
      yaw = yawToward(dx, dz);
      for (let k = 0; k < n; k++) put('pl-queue-post', ax + dx * k * 1.5, az + dz * k * 1.5, { yaw });
    }
    const [lx, lz] = pts[pts.length - 1];
    put('pl-queue-post', lx, lz, { yaw: lastYaw ?? yaw });
  };

  /** A cafe table with two chairs, an optional parasol, newspaper and cups. (yaw: which way the table's "out" faces.) */
  const cafeSet = (x: number, z: number, yaw: number, o: { parasol?: boolean; paper?: boolean; cup?: boolean; knocked?: boolean } = {}): void => {
    put('euro-cafe-table', x, z, { yaw });
    const [ax, az] = local(x, z, yaw, 0, 0.72);
    const [bx, bz] = local(x, z, yaw, 0, -0.72);
    put('euro-cafe-chair', ax, az, { yaw: yaw + PI });
    if (o.knocked) put('euro-cafe-chair', bx, bz, { rot: [0, yaw + 0.5, PI / 2], y: 0.22 });
    else put('euro-cafe-chair', bx, bz, { yaw });
    if (o.parasol) put('pl-cafe-parasol', x, z, { yaw });
    if (o.paper) put('pl-newspaper', x + 0.12, z - 0.1, { yaw: yaw + 0.4, y: 0.78 });
    if (o.cup) put('pl-espresso-cup', x - 0.15, z + 0.1, { y: 0.78 });
  };

  /**
   * Lay a rectangle of setts on the 3 m grid from (x0, z0), with a ring of cobbles round each of `cobbleAround` (FX09: one
   * draped ground patch instead of tile props, so no seams, no slab edges). `skip` is kept for the callers' plans.
   */
  const ringsLaid = new Set<string>();
  const pave = (
    x0: number, z0: number, nx: number, nz: number,
    o: { cobbleAround?: readonly [number, number, number][]; skip?: readonly (readonly [number, number, number, number])[] } = {},
  ): number => {
    const w = nx * TILE, d = nz * TILE;
    plan.ground.push({ kind: 'setts', rect: { x: x0 + w / 2, z: z0 + d / 2, w, d } });
    for (const [ax, az, r] of o.cobbleAround ?? []) {
      const k = `${ax},${az}`;
      if (ringsLaid.has(k)) continue;
      ringsLaid.add(k);
      plan.ground.push({ kind: 'cobble', accent: true, circle: { x: ax, z: az, r } });
    }
    return nx * nz;
  };

  // ---- 1. Buildings -------------------------------------------------------------------------------------------------
  // Hand-placed first, so the rows pack around them.
  const hand: EuroPlacement[] = [
    // Platz cafes: the south-west corner (front onto the square, side onto the quay) and the north edge.
    { id: 'euro-corner-cafe', x: -1558.5, z: -183.6, yaw: PI, scale: 1, tint: 0xf3d6cf, trim: 0x9a5a3c },
    { id: 'euro-corner-cafe', x: -1485, z: -288, yaw: 0, scale: 1, tint: 0xe6dcb8, trim: 0x4a4f57 },
    // The Bean Tower's ticket kiosk, facing west onto the start of the queue.
    { id: 'euro-tabac-kiosk', x: -1493, z: -336, yaw: -PI / 2, scale: 1, tint: 0x2f5a3a, trim: 0xb08d3a },
    // A news kiosk by the Platz, and a post booth at the Rue Haute corner.
    { id: 'euro-tabac-kiosk', x: -1479.5, z: -273, yaw: -PI / 2, scale: 1, tint: 0x7a2f3a, trim: 0xc9a96a },
  ];
  plan.buildings.push(...keepClear(hand, taken, rects));
  for (const r of ROWS) {
    for (const s of frontage(r.path, r.side, r.off, r.gap ?? 4, r.from ?? 0, r.to ?? Infinity)) {
      plan.buildings.push(...keepClear(planStreetRow({ ...s, seed: r.seed, mix: r.mix, corner: r.corner, setback: 0.6 }), taken, rects));
    }
  }
  // The back row of the east strip: tall houses facing the Rue Haute's backs across the courtyards.
  plan.buildings.push(...keepClear(planStreetRow({ x: -1417.5, z: -452, yaw: -PI / 2, length: 396, seed: 81, mix: BACK_MIX, setback: 0.6 }), taken, rects));

  // Shop names over doors, and cafe names.
  const rot: Record<string, number> = {};
  for (const b of plan.buildings) {
    const names = SHOP_NAMES[b.id];
    const info = euroBuilding(b.id);
    if (!names || !info) continue;
    rot[b.id] = (rot[b.id] ?? 0) + 1;
    if (b.id !== 'euro-corner-cafe' && rot[b.id] % 3 === 0) continue;
    if (signs.filter((s) => s.kind === 'banner').length >= 46) break;
    const text = names[(rot[b.id] - 1) % names.length];
    const [px, pz] = local(b.x, b.z, b.yaw, 0, info.depth / 2 + 0.05);
    sign('banner', text, px, pz, b.yaw, { y: 3.7, w: Math.min(3, info.width - 0.5), h: 0.6 });
  }

  // ---- 2. The Bean Tower and its garden -----------------------------------------------------------------------------
  const TX = -1520, TZ = -366;
  put('pl-bean-tower', TX, TZ, { yaw: 0, solid: { r: 7, h: 30 } });
  // Its runner beans are separate prefabs (40 parts each) at the same origin.
  for (let i = 1; getPrefab(`pl-bean-vines-${i}`); i++) props.push({ id: `pl-bean-vines-${i}`, x: TX, z: TZ, yaw: 0 });
  // Front garden (south): paved, with the queue snaking over it.
  pave(-1562, -355, 28, 9, { cobbleAround: [[TX, TZ, 10.5]] });
  // Back terrace (north): the quiet side, with benches turned to the tower.
  pave(-1546, -406, 17, 7, { cobbleAround: [[TX, TZ, 10.5]] });

  // The queue: kiosk, then three switchbacks, to Fifi at the foot of the tower.
  queue([[-1497, -336], [-1539, -336], [-1539, -342], [-1497, -342], [-1497, -348], [-1521, -348], [-1521, -351]]);
  put('pl-tour-flag', -1519.6, -353.4, { yaw: 0.2 });
  // Tourists' kit along the queue.
  const bags: [number, number, number][] = [
    [-1500, -338.2, 0.4], [-1511, -339.8, -0.3], [-1524, -338.4, 1.2], [-1532, -339.8, 0.1], [-1537, -344.2, 2.6],
    [-1529, -344.2, 0.9], [-1516, -343.8, -1.1], [-1505, -344.5, 0.6], [-1500, -350, 1.9], [-1511, -349.8, -0.4],
  ];
  for (const [x, z, y] of bags) put('lost-suitcase', x, z, { yaw: y, scale: 0.8 });
  put('stool', -1508, -339.3, { trim: 0x8a5a2b });           // a folding stool: someone has been here since breakfast
  put('pl-newspaper', -1508.3, -338.2, { yaw: 0.5, y: 0.02 });
  put('pl-croissant', -1522.8, -349.6, { yaw: 1.1 });         // dropped
  put('pl-croissant', -1523.3, -349.2, { yaw: 2.4 });         // its friend
  put('box-camera', -1514.5, -346.6, { yaw: PI, y: 0.0 });
  put('camera-tripod', -1531, -346, { yaw: 0 });
  put('pl-baguette', -1503, -345.2, { yaw: 0.8, y: 0.02 });
  put('litter-bin', -1495.5, -343, { solid: { r: 0.3, h: 1 } });
  // Hedges and topiary framing the garden, a lamp post at each corner.
  for (let k = 0; k < 7; k++) put('euro-box-hedge', -1560.5 + k * 2.06, -355.4, { yaw: 0 });
  for (let k = 0; k < 7; k++) put('euro-box-hedge', -1479.5 - k * 2.06, -355.4, { yaw: 0 });
  put('euro-topiary-spiral', -1546, -356.2, { solid: { r: 0.4, h: 2.4 } });
  put('euro-topiary-spiral', -1494, -356.2, { solid: { r: 0.4, h: 2.4 } });
  put('euro-lamp-post', -1560, -330, {}); put('euro-lamp-post', -1480, -330, {});
  put('euro-lamp-post', -1537, -354.6, {}); put('euro-lamp-post', -1503, -354.6, {});
  for (const x of [-1556, -1544, -1496, -1484]) put('euro-flower-trough', x, -331, { yaw: 0 });
  put('euro-plane-tree', -1556, -345, { solid: { r: 0.45, h: 9 } });
  put('euro-plane-tree', -1484, -345, { solid: { r: 0.45, h: 9 } });
  // Poster boards by the queue: the ticket board, facts, the lunch notice.
  sign('poster', 'Bean Tower - Admission: one acorn.\nExit: two acorns.', -1495.2, -331.5, 0);
  sign('poster', 'TOWER FACTS: 28.7 m tall.\nBeans: many. Views: yes.\nStairs: a ladder.', -1544.5, -331.5, 0.15);
  sign('poster', 'CLOSED FOR LUNCH. Open after lunch.\nLunch ends when the tower says.', -1528.5, -352.8, 0);
  sign('menu', 'GUIDED TOURS\nNext tour: in a minute.\nLast tour: also in a minute.', -1514.2, -352.6, 0.2);
  sign('banner', 'BEAN TOWER TICKETS\nAdmission: one acorn.\nExit: two acorns.', -1494.1, -336, -PI / 2, { y: 2.4, w: 2.0, h: 0.8 });
  // The back terrace.
  for (const [x, z] of [[-1540, -392], [-1500, -392], [-1530, -382], [-1510, -382]] as const) {
    put('park-bench', x, z, { yaw: 0, solid: { w: 1.6, d: 0.6, h: 0.9 } });
  }
  for (const x of [-1544, -1496]) put('euro-lamp-post', x, -398, {});
  put('euro-rose-arch', -1520, -409.5, { yaw: 0 });
  for (const x of [-1542, -1534, -1506, -1498]) put('euro-geranium-bed', x, -403.5, { yaw: 0 });
  for (const x of [-1536, -1504]) put('euro-topiary-lollipop', x, -396, { solid: { r: 0.4, h: 2.4 } });
  for (const x of [-1550, -1490]) put('euro-plane-tree', x, -389, { solid: { r: 0.45, h: 9 } });
  for (let k = 0; k < 4; k++) put('euro-box-hedge', -1548 + k * 2.06, -381, { yaw: 0 });
  for (let k = 0; k < 4; k++) put('euro-box-hedge', -1492 - k * 2.06, -381, { yaw: 0 });
  sign('poster', 'THE OTHER SIDE of the Bean Tower.\nIt is exactly the same. Please do not check.', -1527.4, -398.5, PI);

  // ---- 3. The Grand Platz ----------------------------------------------------------------------------------------------
  const FX = -1528, FZ = -236;             // fountain
  const BX = -1500, BZ = -235;             // bandstand (fixed)
  const SX = -1515, SZ = -207;             // the Unknown Pigeon
  const CX = -1553, CZ = -222;             // the boules court
  // The carousel and its cobbled ring: the paved core is dense; round it runs a gravel quincunx (FX09, D9 item 3).
  const CAX = -1512, CAZ = -224;
  const CORE = { x0: -1546, x1: -1496, z0: -266, z1: -203 };         // setts, 50 x 63 m
  const PLATZ = { x0: -1562, x1: -1478, z0: -283, z1: -187 };        // the whole square
  const box = (x0: number, x1: number, z0: number, z1: number) => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 });
  plan.ground.push(
    { kind: 'setts', rect: box(CORE.x0, CORE.x1, CORE.z0, CORE.z1) },
    // Four gravel rectangles round the core, edge to edge and never overlapping.
    { kind: 'gravel', rect: box(PLATZ.x0, PLATZ.x1, PLATZ.z0, CORE.z0) },
    { kind: 'gravel', rect: box(PLATZ.x0, PLATZ.x1, CORE.z1, PLATZ.z1) },
    { kind: 'gravel', rect: box(PLATZ.x0, CORE.x0, CORE.z0, CORE.z1) },
    { kind: 'gravel', rect: box(CORE.x1, PLATZ.x1, CORE.z0, CORE.z1) },
    // Cobble rings: the fountain, the bandstand, the Unknown Pigeon, the carousel.
    { kind: 'cobble', accent: true, circle: { x: FX, z: FZ, r: 6.6 } },
    { kind: 'cobble', accent: true, circle: { x: BX, z: BZ, r: 7.2 } },
    { kind: 'cobble', accent: true, circle: { x: SX, z: SZ, r: 4.4 } },
    { kind: 'cobble', accent: true, circle: { x: CAX, z: CAZ, r: 4.4 } },
    // The cellar door's doorstep, in the corner by the south-west cafe (Le Petit Groan, workplaces/comedy/club.ts).
    { kind: 'cobble', rect: box(-1555.5, -1548.5, PLATZ.z1, -180.4) },
  );
  put('euro-fountain', FX, FZ, { solid: { r: 2, h: 1.1 } });
  put('bandstand', BX, BZ, { yaw: 0, solid: { r: 3.7, h: 1.0 } });
  put('pl-gramophone', BX + 0.5, BZ - 0.9, { yaw: 0.4, y: 0.8, lift: false });
  put('pl-music-stand', BX - 1.6, BZ - 0.4, { yaw: 0.3, y: 0.8, lift: false });
  put('pl-music-stand', BX + 1.8, BZ - 0.2, { yaw: -0.2, y: 0.8, lift: false });
  put('pl-cello', BX - 2.1, BZ + 0.9, { yaw: 0.2, y: 0.8, lift: false });
  put('chair', BX - 1.2, BZ + 0.4, { yaw: PI + 0.3, y: 0.8, lift: false });
  // The Unknown Pigeon, in its ring of bollards and the committee on its plinth.
  put('pl-pigeon-statue', SX, SZ, { yaw: 0, solid: { w: 1.7, d: 1.7, h: 2.6 } });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * PI * 2;
    if (k === 2 || k === 3) continue;  // a gap for the plaque
    put('euro-bollard', SX + Math.cos(a) * 3, SZ + Math.sin(a) * 3, { solid: { r: 0.18, h: 1 } });
  }
  sign('plaque', 'DO NOT FEED THE STATUE\n(It has eaten.)', SX, SZ + 0.83, 0, { y: 0.8, w: 1.3, h: 0.45 });
  // Pigeons: six at committee on the plinth (top at 1.4 m), one on the breadcrumb box, a few on the cobbles.
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * PI * 2 + 0.3;
    put('bird-pigeon', SX + Math.cos(a) * 0.58, SZ + Math.sin(a) * 0.58, { yaw: -a - PI / 2, y: 1.4, scale: 0.85, lift: false });
  }
  put('crate', SX + 0.62, SZ + 0.62, { scale: 0.34, y: 1.4, trim: 0xa07a4a, lift: false });
  put('bird-pigeon', SX + 0.62, SZ + 0.62, { yaw: 0.8, y: 1.55, scale: 0.8, lift: false });
  for (const [dx, dz, yw] of [[2.2, 1.8, 0.4], [-2.6, 1.2, 2.2], [1.1, -2.9, 4], [-1.4, 3.3, 5.1]] as const) {
    put('bird-pigeon', SX + dx, SZ + dz, { yaw: yw, scale: 0.9 });
  }
  put('pl-bread-basket', SX + 3.8, SZ + 1.6, { yaw: 0.6 });
  // Lamp posts and bollards round the square (the plane trees are the quincunx below).
  for (const [x, z] of [[-1558, -279], [-1520, -279], [-1561, -250], [-1561, -204], [-1480, -250], [-1480, -208], [-1520, -191]] as const) {
    put('euro-lamp-post', x, z, {});
  }
  for (const x of [-1556, -1548, -1540, -1532, -1524, -1516]) put('euro-bollard', x, -281.6, { solid: { r: 0.18, h: 1 } });
  put('euro-bike-rack', -1500, -279, { yaw: 0 }); put('euro-bike-rack', -1503.5, -279, { yaw: 0 });
  put('euro-bike-rack', -1479.6, -193, { yaw: PI / 2 });
  // Cafe terraces spilling 10 m and more out of the two corner cafes: rows of table, chairs and parasol.
  // The south-west cafe's front is at z -186.6 (it faces north); the north cafe's at z -285 (it faces south).
  [-191.8, -195.6, -199.4].forEach((z, i) => [-1559.8, -1555.8, -1551.8, -1547.8].forEach((x, j) => {
    cafeSet(x, z, PI, { parasol: (i + j) % 3 !== 2, paper: (i * 5 + j * 3) % 4 === 0, cup: (i + j) % 5 !== 3 });
    if ((i + j) % 2 === 0) put('pl-croissant', x + 0.18, z + 0.12, { y: 0.79, yaw: i + j });
  }));
  [-281.5, -277.5, -273.5].forEach((z, i) => [-1492.5, -1488.5, -1484.5, -1480.5].forEach((x, j) => {
    if (j === 3 && i === 2) return;   // the tabac kiosk
    cafeSet(x, z, 0, { parasol: (i + j) % 3 !== 1, paper: (i * 3 + j) % 4 === 1, cup: true });
    if ((i + j) % 2 === 1) put('pl-croissant', x + 0.18, z + 0.12, { y: 0.79, yaw: i * 2 + j });
  }));
  // Menu boards at the terrace ends, a planter at each corner of the south-west terrace.
  put('sandwich-board', -1562.4, -190.6, { yaw: PI / 2 + 0.15 });
  put('sandwich-board', -1545.6, -197.4, { yaw: -PI / 2 + 0.2 });
  put('sandwich-board', -1478.4, -279.8, { yaw: -PI / 2 + 0.25 });
  for (const [x, z] of [[-1562, -202], [-1545.8, -202.4], [-1494.2, -271.4]] as const) put('euro-flower-trough', x, z, { yaw: PI / 2 });
  // The Tuesday crossword quarrel: a knocked chair, two papers, two cups, a table turned away.
  cafeSet(-1546, -283.3, 0, { knocked: true, paper: true, cup: true });
  put('pl-newspaper', -1546.9, -281.5, { yaw: 2, y: 0.02 });
  put('pl-espresso-cup', -1545.3, -282.0, { y: 0.02 });
  // Corner-cafe chalkboards.
  sign('menu', 'Coffee: small / smaller / a rumour.\nAll one acorn.', -1554.6, -188.2, PI);
  sign('menu', 'TODAY: soup.\nTOMORROW: yesterday\'s soup.', -1492.2, -283.2, 0);
  sign('menu', 'THE CROSSWORD IS NOT\nDONE UNTIL IT IS DONE.', -1550, -285.2, 0.1);

  // The queue for nothing (FIXED: x -1486.8, z -232..-196, one every 1.5 m, yaw PI / 2) and its poster.
  for (let k = 0; k < 25; k++) put('pl-queue-post', -1486.8, -232 + k * 1.5, { yaw: PI / 2 });
  sign('poster', 'QUEUE HERE. For what: see the front of the queue.', -1486, -194, 0, {}, true);
  // Vignette: the queue for the queue (joins the back of the first one).
  queue([[-1502.5, -189.2], [-1489, -189.2]], 0);
  sign('poster', 'QUEUE FOR THE QUEUE.\nJoin here to join the other queue.', -1503.6, -192.5, 0.1);
  put('stool', -1498.5, -191.7, { trim: 0x6a4a2a });
  put('lost-suitcase', -1495.2, -191.5, { yaw: 2.2, scale: 0.8 });
  put('lost-suitcase', -1500.3, -190.6, { yaw: -0.6, scale: 0.8 });
  put('pl-newspaper', -1497.2, -192, { yaw: 0.3, y: 0.02 });
  put('pl-croissant', -1493, -190.8, { yaw: 1.7 });

  // Odile's portrait spot (FIXED): her easel; her rejected canvases lean against a crate and a stool nearby.
  put('pl-easel', -1540, -263.2, { yaw: PI });
  put('stool', -1537.6, -262.2, { trim: 0x7a5a3a });
  put('pl-croissant', -1537.6, -262.2, { y: 0.45, yaw: 0.9 });
  for (let k = 0; k < 5; k++) {
    put('painting', -1547.8 + k * 0.5, -262.6 - (k % 2) * 0.25, { rot: [-0.32, 0.12 * (k - 2), 0], y: 0.48, tint: [0xe8c9a8, 0xf1e3c6, 0xd9e2d3, 0xf3d6cf, 0xcfd8e3][k] });
  }
  put('crate', -1548.6, -260.6, { scale: 0.7 });
  put('pl-croissant', -1548.6, -260.6, { y: 0.55, yaw: 2.4, scale: 1.4 });
  put('pl-baguette', -1544.4, -259.6, { yaw: 0.2, y: 0.02 });
  put('pl-produce-crate', -1543, -258.6, { yaw: 0.5 });
  sign('poster', 'PORTRAITS WHILE YOU WAIT.\nLikeness: not guaranteed.\nCroissant: guaranteed.', -1545, -255.6, PI * 0.9);

  // The boules court: Gaston and the other Gaston, a measurement dispute.
  put('euro-boules-court', CX, CZ, { yaw: 0 });
  for (let k = 0; k < 7; k++) {
    put('euro-box-hedge', CX - 3.1, CZ - 6 + k * 2.06 + 0.3, { yaw: PI / 2 });
    put('euro-box-hedge', CX + 3.1, CZ - 6 + k * 2.06 + 0.3, { yaw: PI / 2 });
  }
  put('pl-boule', CX + 0.25, CZ + 0.3, { y: 0.08 });          // touching the jack (the jack is at +0.5, +0.2)
  put('pl-boule', CX - 0.6, CZ - 2.6, { y: 0.08 });
  put('pl-boule', CX + 1.7, CZ + 3.1, { y: 0.08 });           // far off, by the south board: Gaston's
  put('pl-boule', CX - 2.6, CZ + 4.8, { y: 0.0 });            // out of the court altogether
  put('ruler-stick', CX + 0.6, CZ + 1.7, { yaw: 1.2, y: 0.12 });
  put('pardonlin-beret', CX - 1.1, CZ - 1.4, { yaw: 0.6, y: 0.1 });
  put('pardonlin-beret', CX + 1.2, CZ + 2.0, { yaw: 2.9, y: 0.1 });
  put('folded-map', CX - 1.8, CZ + 0.4, { yaw: 0.4, y: 0.02 });
  put('bench', CX + 5.2, CZ + 0.5, { yaw: -PI / 2, solid: { w: 0.7, d: 1.8, h: 0.9 } });
  sign('poster', 'BOULES. Every measurement is\nsettled by committee. The committee\nnever meets.', CX + 4.2, CZ + 7.4, PI * 0.5);

  // The mime's pitch: an upturned beret with one acorn, a chair nobody may sit in, a sign.
  const MX = -1522.5, MZ = -229;
  put('pardonlin-beret', MX + 1.1, MZ + 0.8, { rot: [PI, 0.3, 0], y: 0.22 });
  put('acorn', MX + 1.1, MZ + 0.8, { y: 0.05, scale: 0.7 });
  put('chair', MX - 1.6, MZ + 1.6, { yaw: 0.4 });
  for (const [dx, dz] of [[-2.2, 1.0], [-1.0, 1.0], [-2.2, 2.2], [-1.0, 2.2]] as const) put('pl-queue-post', MX + dx, MZ + dz, { yaw: 0 });
  sign('poster', 'THE INVISIBLE BOX.\nPlease do not lean on it.\nChair reserved: invisible friend.', MX + 0.4, MZ + 3.2, 0.2);
  put('pl-newspaper', MX + 2.4, MZ + 0.2, { yaw: 1, y: 0.02 });

  // The strike about the strike: placards, two chairs, a thermos, the lunch notice.
  const KX = -1481.6, KZ = -262;
  for (let k = 0; k < 4; k++) put('sandwich-board', KX + (k % 2) * 0.55, KZ - 0.5 + k * 0.6, { yaw: -PI / 2 + 0.25 * (k - 1.5) });
  put('chair', KX - 0.9, KZ + 3.2, { yaw: -PI / 2 + 0.2 });
  put('chair', KX - 0.9, KZ + 4.4, { yaw: -PI / 2 - 0.15 });
  put('side-table', KX - 0.9, KZ + 3.8, { yaw: 0 });
  put('honeydew-flask', KX - 0.9, KZ + 3.8, { y: 0.55, scale: 0.8 });
  put('pl-espresso-cup', KX - 1.0, KZ + 3.9, { y: 0.56, lift: true });
  put('pl-newspaper', KX - 0.5, KZ + 2.4, { yaw: 0.6, y: 0.02 });
  sign('poster', 'ON STRIKE until lunch.\nLunch is also on strike.', KX - 1.6, KZ - 1.4, PI / 2 + 0.1);

  // The painter's neighbour and the book stall at the north-west of the square.
  put('pl-book-stall', -1555, -266, { yaw: PI / 2 });
  put('pl-book-stall', -1555, -258, { yaw: PI / 2 });
  sign('menu', 'BOOKS: read, half-read, and\nread to someone else.', -1553.6, -262, PI / 2);

  // ---- The Platz, dense core and gravel quincunx ------------------------------------------------------------------------
  // FX09 (D9 item 3): the paved core (setts, x -1546..-1496, z -266..-203) holds a carousel, a flower market, kiosks,
  // the fountain's regatta, the crowd round the mime and the bandstand's audience; the gravel ring round it is a
  // plane-tree quincunx with benches. The terraces spill out of the two corner cafes (above).
  {
    const noGo = (x: number, z: number): boolean =>
      (x > -1491 && x < -1485 && z > -236 && z < -192) ||               // the queue and its clear strip
      Math.hypot(x - -1500, z - -200) < 5 ||                            // the screenshot spot
      Math.hypot(x - -1540, z - -266) < 5.5 ||                          // Odile, easel and sitter
      Math.hypot(x - BX, z - BZ) < 5.4 ||                               // the bandstand
      (x > -1563 && x < -1544 && z > -228.5 && z < -215.5);             // the boules court
    const inCore = (x: number, z: number, m = 0): boolean => x > CORE.x0 - m && x < CORE.x1 + m && z > CORE.z0 - m && z < CORE.z1 + m;
    const open = (x: number, z: number, r = 1): boolean =>
      !noGo(x, z) && x > -1564 && x < -1477 && z > -283 && z < -187 && roadClearance(x, z) > 0.9 &&
      !props.some((p) => !p.id.includes('tile') && Math.hypot(p.x - x, p.z - z) < r + (p.solid ? ('r' in p.solid ? p.solid.r : Math.max(p.solid.w, p.solid.d) / 2) : 0.25));
    const faceTo = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

    // The outer ring: a quincunx of plane trees on the gravel (staggered rows ~6.8 m apart), benches between them.
    const trees: [number, number][] = [];
    for (let i = 0; i < 18; i++) {
      const z = -280.6 + i * 5.9;
      for (let j = 0; j < 13; j++) {
        const x = -1559.2 + j * 6.8 + (i % 2 ? 3.4 : 0);
        if (x > -1479.5 || inCore(x, z, 1.7) || !open(x, z, 2.5)) continue;
        if (Math.hypot(x - -1500, z - -200) < 9 || Math.hypot(x - -1510, z - -196) < 4.5) continue;   // keep the view from the south steps open
        put('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } });
        trees.push([x, z]);
      }
    }
    // Benches in the row gaps, turned toward the core (park-bench seats face local +z).
    for (let i = 0; i < 18; i += 2) {
      const z = -280.6 + i * 5.9;
      for (let j = 0; j < 13; j++) {
        const x = -1559.2 + j * 6.8 + (i % 2 ? 3.4 : 0) + 3.4;
        if (inCore(x, z, 1.2) || !open(x, z, 1.5)) continue;
        const north = z < CORE.z0, south = z > CORE.z1, west = x < CORE.x0;
        const yaw = north ? 0 : south ? PI : west ? PI / 2 : -PI / 2;
        const side = north || south;
        put('park-bench', x, z, { yaw, solid: { w: side ? 1.8 : 0.7, d: side ? 0.7 : 1.8, h: 0.9 } });
      }
    }
    // Lamp posts along the core's edge, in the gaps.
    for (const [x, z] of [[-1537, -268.4], [-1511, -268.4], [-1547.8, -246], [-1547.8, -214], [-1494.2, -258], [-1494.2, -216], [-1520, -204.2], [-1534, -204.2]] as const) {
      if (open(x, z, 1)) put('euro-lamp-post', x, z, {});
    }

    // ---- The fountain: a ring of troughs, a wider ring of bollards, a regatta, a child with a stick ----
    for (let k = 0; k < 4; k++) {
      const a = PI / 4 + k * PI / 2;
      put('euro-flower-trough', FX + Math.cos(a) * 3.1, FZ + Math.sin(a) * 3.1, { yaw: a + PI / 2, solid: { w: 1.5, d: 0.5, h: 0.6 } });
      put('euro-geranium-pot', FX + Math.cos(a) * 3.1, FZ + Math.sin(a) * 3.1, { y: 0.55 });
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * PI * 2 + 0.2;
      const bx = FX + Math.cos(a) * 4.4, bz = FZ + Math.sin(a) * 4.4;
      if (open(bx, bz, 0.3)) put('euro-bollard', bx, bz, { solid: { r: 0.18, h: 1 } });
    }
    // Toy boats on the water (the basin's water top is 0.56 m above the ground; the central column is at the centre).
    for (const [dx, dz, yw, sail] of [[1.25, -0.5, 0.7, 0xc8352f], [-0.85, 1.3, 2.4, 0x3466b8], [0.35, -1.45, -0.9, 0xf0c63a], [-1.35, -0.6, 3.9, 0x4f9a3c]] as const) {
      put('pl-toy-sailboat', FX + dx, FZ + dz, { yaw: yw, y: 0.545, tint: sail, lift: false });
    }
    sign('menu', 'REGATTA TODAY.\nBoats: four. Winners: one,\nsmall, wet, undecided.', FX + 1.9, FZ + 5.6, 0.1);

    // ---- The carousel and its queue ----
    put('pl-carousel', CAX, CAZ, { yaw: 0.3, solid: { r: 2.8, h: 4.3 } });
    queue([[-1507.6, -216.4], [-1507.6, -220.9]], PI / 2);
    sign('poster', 'ONE RIDE: one acorn.\nTWO RIDES: you will be dizzy.', -1505.6, -218.9, -PI / 2 + 0.12);
    put('stool', -1506.4, -224.6, { trim: 0x7a5a3a });
    put('lost-suitcase', -1507.2, -222.8, { yaw: 0.9, scale: 0.8 });
    put('candyfloss-cart', -1517.2, -218.6, { yaw: PI * 0.6, solid: { r: 1.0, h: 2.2 } });
    sign('menu', 'CANDYFLOSS.\nFlavour: pink.\nAlso: pink.', -1519.8, -217.0, PI * 0.6);
    put('litter-bin', -1509.2, -229.6, { solid: { r: 0.3, h: 1 } });
    put('euro-bike-rack', -1516.8, -223.4, { yaw: PI / 2 }); put('euro-bike-rack', -1516.8, -226.4, { yaw: PI / 2 });

    // ---- Newspaper kiosks and boxes ----
    put('news-kiosk', -1533.4, -262.2, { yaw: 0, solid: { w: 2.6, d: 2.0, h: 2.8 } });
    put('newspaper-box', -1536.3, -260.9, { yaw: 0.2, solid: { w: 0.5, d: 0.5, h: 1 } });
    put('newspaper-box', -1530.6, -260.8, { yaw: -0.2, solid: { w: 0.5, d: 0.5, h: 1 } });
    put('litter-bin', -1529.2, -260.6, { solid: { r: 0.3, h: 1 } });
    put('pl-newspaper', -1534.4, -259.2, { yaw: 1, y: 0.02 });
    put('news-kiosk', -1497.6, -249.4, { yaw: -PI / 2, solid: { w: 2.6, d: 2.0, h: 2.8 } });
    put('newspaper-box', -1499.6, -246.6, { yaw: PI * 0.9, solid: { w: 0.5, d: 0.5, h: 1 } });
    put('newspaper-box', -1499.6, -252.4, { yaw: PI * 1.05, solid: { w: 0.5, d: 0.5, h: 1 } });
    put('sandwich-board', -1500.4, -244.4, { yaw: -PI / 2 + 0.3 });
    sign('menu', 'NEWS: yesterday\'s.\nOLD NEWS: also yesterday\'s.', -1500.4, -249.6, -PI / 2 - 0.1);

    // ---- A busker's corner on the gravel, left of the view from the south steps ----
    put('stool', -1511, -197, { trim: 0x7a5a3a });
    put('pl-accordion', -1511, -197, { y: 0.55, yaw: 0.5, scale: 1.2 });
    put('pardonlin-beret', -1509.4, -196, { rot: [PI, 0.4, 0], y: 0.22 });
    put('acorn', -1509.4, -196, { y: 0.05, scale: 0.7 });
    sign('poster', 'BUSKING: one tune per acorn.\nRequests: noted, then ignored.', -1513.4, -194.8, 0.35);
    put('bird-pigeon', -1508.2, -195, { yaw: 2, scale: 0.9 }); put('bird-pigeon', -1507.6, -196.2, { yaw: 4, scale: 0.9 });

    // ---- The flower market: four stalls in a row, loose buckets, pots, troughs, a sign ----
    [[-1517.5, 0x4f9a3c], [-1512, 0xd9544e], [-1506.5, 0x3466b8], [-1501, 0xe8822e]].forEach(([x, tint], i) => {
      put('pl-flower-stall', x, -259.4, { yaw: [0.04, -0.03, 0.05, 0][i], tint, trim: 0xf4f4f0, solid: { w: 3.0, d: 2.4, h: 2.4 } });
      put('pl-flower-bucket', x + 1.55, -256.1, { yaw: i, tint: [0xf2a3c4, 0xf0c63a, 0xe0245e, 0xa65cff][i], trim: 0xffffff });
      put('pl-flower-bucket', x - 1.6, -256.3, { yaw: i + 2, tint: [0xe8822e, 0xf4f4f0, 0xf2a3c4, 0xf0c63a][i], trim: 0xe0245e });
      put('euro-geranium-pot', x + 0.6, -255.9, {});
    });
    put('euro-flower-trough', -1509, -254.4, { yaw: 0 }); put('euro-flower-trough', -1504, -254.4, { yaw: 0 });
    put('pl-produce-crate', -1521.4, -258.2, { yaw: 0.3 });
    sign('poster', 'FLOWER MARKET.\nEvery bunch is the last bunch.\nSee also: tomorrow.', -1514.6, -254.2, 0.12, {}, true);
    sign('menu', 'TULIPS: yes.\nTULIPS, AGAIN: also yes.', -1498.2, -255, -0.2, {}, true);

    // ---- The bandstand's audience: two rows of folding chairs turned to the band ----
    [-226.9, -225.1].forEach((z, r) => [-1505.2, -1503.4, -1501.6, -1499.8, -1498].forEach((x, k) => {
      if (r === 1 && k === 3) return;
      put('chair', x, z, { yaw: PI + (k - 2) * 0.04 });
    }));
    put('pl-newspaper', -1500.8, -224.2, { yaw: 2.2, y: 0.02 });
    put('pl-espresso-cup', -1498.6, -224.0, { y: 0.02 });

    // ---- Terrace-style clusters in the core, near the fountain, and more lamps ----
    const cluster = (x: number, z: number, yaw: number, extra: boolean): void => {
      if (!open(x, z, 1.9)) return;
      cafeSet(x, z, yaw, { parasol: true, paper: extra, cup: true });
      put('pl-croissant', x + 0.18, z + 0.12, { y: 0.79, yaw: yaw + 1 });
      if (extra) put('pl-espresso-cup', x - 0.25, z - 0.12, { y: 0.79 });
    };
    cluster(-1541, -250, 0.3, true); cluster(-1537, -246, 2.6, false); cluster(-1541, -241, 3.6, true);
    cluster(-1541, -208.5, PI, true); cluster(-1530, -213.5, PI, false);

    // ---- Pigeons, in small groups of opinion ----
    for (const [gx, gz] of [[-1534, -252], [-1522, -214], [-1546.5, -232], [-1510, -246], [-1524.6, -240.4], [-1503.5, -218.6], [-1531, -222], [-1538, -258], [-1496.4, -224], [-1523.6, -209.2]] as const) {
      for (let k = 0; k < 4; k++) {
        const px = gx + Math.cos(k * 1.9 + gx) * 0.5 * (k + 1) * 0.55, pz = gz + Math.sin(k * 2.3 + gz) * 0.5 * (k + 1) * 0.5;
        if (open(px, pz, 0.2)) put('bird-pigeon', px, pz, { yaw: k * 2.1 + gx, scale: 0.9 });
      }
    }
    sign('poster', 'PIGEONS HAVE STANDING.\nPlease stand elsewhere.', -1534, -249.4, 0.2);
    sign('menu', 'TERRACE: seat yourself.\nThe seat has views on that.', -1544.4, -246.8, 0.4);
    sign('poster', 'BENCH WARMED BY A COMMITTEE.\nPlease ask it to move.', -1483.6, -258.5, -PI / 2);
    sign('poster', 'GRAVEL: keep off the gravel.\nIt is the only quiet thing here.', -1560.6, -262, PI / 2 + 0.1);

    // ---- Le Petit Groan's cellar door (workplaces/comedy/club.ts: CLUB_DOOR): its name and tonight's bill ----
    const DOOR_X = -1555.52, DOOR_Z = -183.9;
    sign('banner', 'LE PETIT GROAN\nLaughter by appointment.', DOOR_X + 0.02, DOOR_Z, PI / 2, { y: 3.55, w: 2.9, h: 0.8 });
    sign('menu', 'TONIGHT: a gnome. Then another gnome.\nLaughter by appointment.', DOOR_X + 2.0, DOOR_Z - 1.5, PI / 2 - 0.12, {}, true);

    // ---- Residents: the crowd round Marcel (loose ring, 2.6-4 m out on the audience's side, all facing him), the child at the regatta ----
    const fan = (id: string, name: string, dx: number, dz: number, idle: AmbientGnomeDef['idle'], bubble: string, look: AmbientGnomeDef['look']): void => {
      const x = MX + dx, z = MZ + dz;
      plan.residents.push({ id, name, x: +x.toFixed(2), z: +z.toFixed(2), yaw: +faceTo(x, z, MX, MZ).toFixed(2), look, bubble, idle });
    };
    fan('pl-mime-fan-1', 'Mime Fan (Front Row)', 3.2, -1.5, 'idle-pompous', 'Is it a wall? It is a wall. Remarkable.',
      { hat: 0x2b2f6b, shirt: 0xe9e1cf, pants: 0x4b4b52, skin: 0xe2b27e, boots: 0x2a2a2a, beard: 0x4a3a2a });
    fan('pl-mime-fan-2', 'Mime Fan (Whisperer)', 3.4, 0.7, 'gossip', '[whispering] He has not moved in an hour. Brava.',
      { hat: 0x6b2323, shirt: 0xd8b36a, pants: 0x3a3a44, skin: 0xf1c27d, boots: 0x3a2a1a, beard: null, dress: true });
    fan('pl-mime-fan-3', 'Mime Fan (Sceptic)', 3.0, 2.4, 'cross-arms', 'I paid nothing and it is still too much.',
      { hat: 0x1a1a1a, shirt: 0xb5483a, pants: 0x2f2f3a, skin: 0xe8b98a, boots: 0x111111, beard: 0xbdbdbd, glasses: true });
    fan('pl-mime-fan-4', 'Mime Fan (Admirer)', 1.9, 3.7, 'lean-back', 'Bravo. Do not clap. He will hear it.',
      { hat: 0x3a5a3a, shirt: 0xcbd6e4, pants: 0x4b3a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0x7a5a3a });
    fan('pl-mime-fan-5', 'Mime Fan (Pigeon Person)', -1.4, -3.1, 'feed-birds', 'I came for the pigeons. I stayed for the box.',
      { hat: 0x7a4a2e, shirt: 0xf3d6cf, pants: 0x3a3a44, skin: 0xe2b27e, boots: 0x3a2a1a, beard: null, dress: true, glasses: true });
    plan.residents.push({
      id: 'pl-boat-child', name: 'Regatta Child', x: +(FX + 0.5).toFixed(2), z: +(FZ + 2.65).toFixed(2), yaw: +faceTo(FX + 0.5, FZ + 2.65, FX, FZ).toFixed(2),
      look: { hat: 0xf0c63a, shirt: 0x3466b8, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0xc8352f, beard: null, freckles: true },
      bubble: 'My boat is winning. The other boat is also mine. I am losing to myself, slowly.', idle: 'point',
    });
  }

  // Street signs at the corners, in their own voice.
  sign('street', 'Rue Haute (High Street) (Main Street)\n(Please Choose One)', -1469.5, -312, PI);
  sign('street', 'Rue A\nIt was first. It has never forgiven the others.', -1566.5, -308, 0.15);
  sign('street', 'Rue Nord (North, mostly)\n(ask a bird)', -1469.5, -431, 0.2);
  sign('street', 'Rue B\nSecond, on paper only', -1469, -176, PI);
  sign('street', 'Quai Nord\nRiver on the left. Also on\nthe right, after lunch.', -1572, -428, -PI / 2);
  sign('street', 'Avenue du Nord-Est\n(the roundabout is that way,\npolitely)', -1529.5, -90, -PI / 2);
  sign('street', 'Grand Platz\nGrand in name. Platz in the\nsense of "a place".', -1478.8, -283.5, PI);
  sign('street', 'Thymes Walk\nKeep left. The river keeps right.', -1591, -296, PI / 2);

  // ---- 4. The rest of the town: lamps, benches, bikes, courtyards --------------------------------------------------
  const lampAlong = (path: string, side: 'left' | 'right', off: number, every: number, treeEvery = 0): void => {
    const pts = pathPoints(path);
    let nth = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / len, dz = (bz - az) / len;
      const sg = side === 'left' ? 1 : -1;
      const nx = dz * sg, nz = -dx * sg;
      for (let t = every * 0.6; t < len - 3; t += every) {
        const x = ax + dx * t + nx * off, z = az + dz * t + nz * off;
        if (x < -1596 || x > -1400 || z < -459 || z > -53) continue;
        nth++;
        if (treeEvery && nth % treeEvery === 0) putFree('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } }, 0.7);
        else putFree('euro-lamp-post', x, z, {}, 0.5);
        const [bx2, bz2] = [x + dx * every * 0.5, z + dz * every * 0.5];
        if (nth % 2 === 0) putFree('euro-bike-rack', bx2, bz2, { yaw: Math.atan2(nx, nz) + PI });
        else putFree('euro-flower-trough', bx2, bz2, { yaw: Math.atan2(nx, nz) + PI });
      }
    }
  };
  lampAlong('pl-rue-haute', 'left', 5.3, 26, 3);
  lampAlong('pl-rue-haute', 'right', 5.4, 26, 3);
  lampAlong('pl-rue-nord', 'right', 5.3, 24);
  lampAlong('pl-rue-a', 'left', 5.3, 24);
  lampAlong('pl-rue-b', 'right', 5.3, 24);
  lampAlong('pl-quai-nord', 'right', 5.3, 28);
  lampAlong('pl-avenue-ne', 'left', 5.3, 26);

  // Rue Haute pavement life: sandwich boards, a newspaper box, baguettes.
  for (let z = -430; z < -60; z += 31) {
    putFree('sandwich-board', -1452 - ((z * 7) % 3) * 0.3, z + 6, { yaw: -PI / 2 + 0.2 }, 0.5);
    putFree('newspaper-box', -1470, z + 14, { yaw: PI / 2, solid: { w: 0.5, d: 0.5, h: 1 } }, 0.5);
    putFree('pl-baguette', -1453.5, z + 11, { yaw: 0.7, y: 0.02 }, 0.4);
  }
  sign('menu', 'BREAD: yes.\nOPINIONS ON BREAD: also yes.\nAcorn each.', -1451.5, -388, -PI / 2 + 0.15);
  sign('menu', 'CHEESE. ONLY CHEESE.\nDO NOT ASK FOR BUTTER.', -1470.8, -250, PI / 2 - 0.1);
  sign('poster', 'BIKES ONLY from here.\nWalking is tolerated near bikes.', -1470.5, -120, PI / 2);
  sign('poster', 'STRIKE NOTICE: the strike about the\nstrike is postponed due to a strike.', -1451, -215, -PI / 2);
  sign('poster', 'FORMS IN TRIPLICATE.\nTriplicate forms in triplicate.\nWindow 3 (closed).', -1470.6, -330, PI / 2);

  // The east courtyards: washing lines, trees, benches, between the Rue Haute backs and the back row.
  const courtyardX = [-1441, -1433, -1425];
  let ci = 0;
  for (let z = -444; z < -64; z += 17) {
    ci++;
    const x = courtyardX[ci % 3];
    switch (ci % 6) {
      case 0: putFree('euro-washing-line', x, z, { yaw: PI / 2 }, 1.8); break;
      case 1: putFree('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } }, 0.8); break;
      case 2: putFree('euro-geranium-bed', x, z, { yaw: 0 }, 1.1); putFree('euro-water-butt', x + 2, z + 1, { solid: { r: 0.4, h: 1 } }, 0.5); break;
      case 3: putFree('euro-bistro-set', x, z, { yaw: 0.4 }, 1); break;
      case 4: putFree('allotment-bed', x, z, { yaw: PI / 2 }, 1.6); break;
      default: putFree('euro-bike-rack', x, z, { yaw: PI / 2 }, 0.8); putFree('wheelbarrow', x + 2, z + 1, { yaw: 1 }, 0.6); break;
    }
  }
  sign('poster', 'COURTYARD CHOIR rehearses Tuesdays.\nTuesdays are cancelled.', -1428, -300, PI / 2);
  sign('poster', 'LOST: one sock. Reward: its other sock.', -1428, -180, PI / 2);

  // The ordinary block (between rue-b, the avenue and the Rue Haute): a shared garden with a laundry vignette.
  for (const [x, z] of [[-1500, -140], [-1490, -128], [-1500, -112], [-1490, -100], [-1500, -88], [-1490, -76]] as const) {
    putFree('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } }, 0.8);
  }
  putFree('park-bench', -1495, -134, { yaw: PI / 2, solid: { w: 0.6, d: 1.6, h: 0.9 } });
  putFree('park-bench', -1495, -106, { yaw: PI / 2, solid: { w: 0.6, d: 1.6, h: 0.9 } });
  putFree('euro-washing-line', -1484, -118, { yaw: PI / 2 }, 1.8);
  putFree('euro-washing-line', -1484, -112, { yaw: PI / 2 }, 1.8);
  putFree('wicker-basket', -1482.4, -115, { yaw: 0.3 }, 0.4);
  putFree('chair', -1480.5, -114.4, { yaw: -1.2 }, 0.4);
  putFree('euro-bike-rack', -1478, -126, { yaw: PI / 2 }, 0.8);
  putFree('allotment-bed', -1486, -94, { yaw: 0 }, 1.6);
  putFree('allotment-bed', -1486, -90, { yaw: 0 }, 1.6);
  putFree('pl-marrow', -1485, -92.4, { yaw: 0.4, y: 0.2 }, 0.3);
  sign('poster', 'RESIDENTS: the marrow is not for sale.\nThe marrow is not for discussion.', -1489.4, -97, PI / 2);

  // ---- 5. Vignettes -------------------------------------------------------------------------------------------------
  plan.vignettes.push(
    { id: 'ot-queue-for-queue', name: 'The queue for the queue', x: -1496, z: -191,
      story: 'A short row of rope posts leads to the back of the Grand Platz queue, with its own poster, a stool, a croissant and two suitcases of someone who has been here since breakfast.' },
    { id: 'ot-rejected-croissants', name: 'Odile\'s rejected croissants', x: -1544, z: -261,
      story: 'Odile paints the Bean Tower as a croissant every single time. Five rejected canvases lean against a crate, a stool holds the sitter\'s croissant, and the baguette is for emotional support.' },
    { id: 'ot-boules-dispute', name: 'The boules measurement dispute', x: CX, z: CZ,
      story: 'One boule touches the jack, one sits far off, a third left the court, two berets lie thrown on the gravel and a ruler lies across the dispute. Nobody has gone home.' },
    { id: 'ot-mime-pitch', name: 'Marcel\'s invisible box', x: MX, z: MZ + 1,
      story: 'An upturned beret holds one acorn. A chair is roped off with four queue posts: it is reserved for Marcel\'s invisible friend, who is sitting there now.' },
    { id: 'ot-strike-about-strike', name: 'The strike about the strike', x: KX, z: KZ + 2,
      story: 'A stack of placards, two chairs, a jar of something warm and a notice: ON STRIKE until lunch. Lunch is also on strike, so everyone is waiting for lunch to finish striking.' },
    { id: 'ot-pigeon-committee', name: 'The pigeons\' committee', x: SX, z: SZ,
      story: 'Six pigeons sit in a ring on the plinth of the Unknown Pigeon, one on the breadcrumb box, facing inward. The minutes are not taken. The motion is bread.' },
    { id: 'ot-tower-queue', name: 'The head of the Bean Tower queue', x: -1514, z: -345,
      story: 'Switchbacks of rope posts, a dozen suitcases, a folding stool someone has sat on since breakfast, a dropped croissant and Fifi Haricot\'s flag at the very front. Nobody has gone up yet.' },
    { id: 'ot-crossword-quarrel', name: 'The Tuesday crossword quarrel', x: -1546, z: -282,
      story: 'A knocked-over chair, two newspapers folded to the same page, two cups and a table left by two gnomes who still disagree on seven across.' },
    { id: 'ot-carousel', name: 'The carousel and its queue', x: CAX, z: CAZ,
      story: 'Six painted horses go round under a striped roof. Four rope posts, a stool and a suitcase make the queue, and the sign says: ONE RIDE one acorn, TWO RIDES you will be dizzy.' },
    { id: 'ot-regatta', name: 'The fountain regatta', x: FX, z: FZ,
      story: 'Four toy sailboats on the basin, one small child with a stick, and a notice that the winner is undecided. The child owns all four boats and is losing to himself.' },
    { id: 'ot-mime-audience', name: 'Marcel\'s audience', x: MX + 2.5, z: MZ + 1,
      story: 'Five gnomes stand round Marcel in a loose ring and admire a wall that is not there. One of them has come for the pigeons and stayed for the box.' },
    { id: 'ot-flower-market', name: 'The flower market', x: -1509, z: -257,
      story: 'Four stalls under four awnings, buckets of blooms on every counter and every shelf, and a poster promising that every bunch is the last bunch.' },
    { id: 'ot-washing-day', name: 'The shared washing line', x: -1484, z: -115,
      story: 'Two washing lines in an ordinary block, a basket, a chair and a marrow guarded in a row of allotment beds: a whole afternoon of someone else\'s business.' },
  );

  // ---- 6. Residents -------------------------------------------------------------------------------------------------
  const res: AmbientGnomeDef[] = [
    { id: 'pl-mime', name: 'Marcel Muet', x: MX, z: MZ, yaw: 0.4,
      look: { hat: 0x1a1a1a, shirt: 0xf2f2f2, pants: 0x1a1a1a, skin: 0xf6d9b0, boots: 0x111111, beard: null, glasses: false },
      bubble: '[Marcel presses both palms on a wall that is not there. It is a very good wall.]', idle: 'lean-back' },
    { id: 'pl-painter', name: 'Odile Easelby', x: -1540, z: -262, yaw: PI,
      look: { hat: 0x2b2f6b, shirt: 0xd8b36a, pants: 0x6b4a2e, skin: 0xe8b98a, boots: 0x3a2a1a, beard: null, glasses: true, dress: true },
      bubble: 'Stand still. I paint the tower as a croissant. Yes, again. No, nobody has complained to my face.', idle: 'paint-wall' },
    { id: 'pl-boules-a', name: 'Gaston Plonque', x: CX, z: CZ - 5.4, yaw: 0,
      look: { hat: 0x23406b, shirt: 0xe9e1cf, pants: 0x4b4b52, skin: 0xe2b27e, boots: 0x3a2a1a, beard: 0x3a2a1a },
      bubble: 'It is closer. I have eyes. I have also a ruler, and the ruler agrees with me.', idle: 'argue' },
    { id: 'pl-boules-b', name: 'The Other Gaston', x: CX, z: CZ + 5.4, yaw: PI,
      look: { hat: 0x6b2323, shirt: 0xcbd6e4, pants: 0x4b4b52, skin: 0xf1c27d, boots: 0x3a2a1a, beard: 0xbdbdbd },
      bubble: 'I am also Gaston. I am also right. The ruler is his, so the ruler is a liar.', idle: 'measure' },
    { id: 'pl-tower-guide', name: 'Fifi Haricot', x: -1521, z: -353.6, yaw: 0,
      look: { hat: 0x2e7d4f, shirt: 0xe8c64a, pants: 0x2f2f3a, skin: 0xe6b88a, boots: 0x222222, beard: null, glasses: true, dress: true },
      bubble: 'Welcome to the Bean Tower! It is tall. This concludes the tour. Admission: one acorn.', idle: 'idle-pompous' },
  ];
  plan.residents.push(...res);

  return plan;
}
