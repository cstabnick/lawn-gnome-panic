// Pardonlin district plan (E30): the Jardin, the Little Gardens and Basin Quay. Pure data (../plan.ts).
// Fewer buildings, more gardening as a competitive sport. Coordinates are world metres (+x east, +z south).
import type { AmbientGnomeDef } from '../../ambientGnomes';
import type { EuroPlacement } from '../../eurokit/street';
import { districtById, footprintProblem, inRect, pathPoints, roadClearance, type Footprint } from '../layout';
import { emptyPlan, keepClear, propFootprint, type DistrictPlan, type PlanProp, type PlanSign } from '../plan';

const PI = Math.PI;

/** Seeded, deterministic scatter (no Math.random). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n: number): number => ((Math.imul(n + 1, 2654435761) >>> 0) % 100000) / 100000;

/** The yaw that turns a prefab's front (+z) from (x, z) toward (tx, tz). */
const yawTo = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

export function planGardens(): DistrictPlan {
  const plan = emptyPlan('gardens');
  const rects = districtById('gardens').rects;
  const { props, signs, vignettes, residents } = plan;
  const tileKeys = new Set<string>();

  // ---- helpers ----------------------------------------------------------------------------------------------------
  /** Put a prop; a solid one that would stand on a road, path or the river, or outside the district, is dropped. */
  const put = (p: PlanProp): boolean => {
    if (!rects.some((r) => inRect(r, p.x, p.z))) return false;
    if (p.solid) {
      const f = propFootprint(p) as Footprint;
      if (footprintProblem(f, 0.3)) return false;
    }
    props.push(p);
    return true;
  };
  const sign = (s: PlanSign): void => { signs.push(s); };
  const tile = (x: number, z: number): void => {
    if (!rects.some((r) => inRect(r, x, z)) || roadClearance(x, z) < 2.2) return;
    const k = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (tileKeys.has(k)) return;
    tileKeys.add(k);
    props.push({ id: 'euro-paving-tile', x, z });
  };
  /** Points along a polyline every `step` m, each with the unit tangent. */
  const along = (pts: readonly (readonly [number, number])[], step: number, start = 0): { x: number; z: number; tx: number; tz: number }[] => {
    const out: { x: number; z: number; tx: number; tz: number }[] = [];
    let walked = 0, next = start;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      const len = Math.hypot(bx - ax, bz - az);
      const tx = (bx - ax) / len, tz = (bz - az) / len;
      for (; next < walked + len; next += step) out.push({ x: ax + tx * (next - walked), z: az + tz * (next - walked), tx, tz });
      walked += len;
    }
    return out;
  };

  // ======================================================================================================================
  // THE JARDIN
  // ======================================================================================================================
  const CX = -1510, CZ = -720;                       // the parterre's centre (the fountain)
  const par = (u: number, v: number): [number, number] => [CX + u, CZ + v];
  const GATE: [number, number] = [-1415, -520];

  // -- Parterre ring hedges: two squares, each with a 4 m gap on each axis; hedges 1.96 m long laid on a 2.0 m pitch.
  const ring = (h: number): void => {
    for (let t = -h + 1; t <= h - 1; t += 2) {
      if (Math.abs(t) <= 1) continue;
      for (const [u, v, yaw] of [[t, -h, 0], [t, h, 0], [-h, t, PI / 2], [h, t, PI / 2]] as const) {
        const [x, z] = par(u, v);
        put({ id: 'euro-box-hedge', x, z, yaw });
      }
    }
  };
  ring(26);
  ring(14);
  // Diagonals from the inner ring's corners out to the outer ring's: yaw PI/4 runs NE-SW, -PI/4 runs NW-SE.
  for (const [su, sv] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
    const yaw = su * sv > 0 ? -PI / 4 : PI / 4;
    for (let k = 0; k < 6; k++) {
      const c = 17.5 + 1.414 * k;
      const [x, z] = par(su * c, sv * c);
      put({ id: 'euro-box-hedge', x, z, yaw });
    }
    // Topiary: spirals at the outer corners, lollipops at the inner ones, cones either side of the four outer gaps.
    const [ox, oz] = par(su * 26.9, sv * 26.9);
    put({ id: 'euro-topiary-spiral', x: ox, z: oz, solid: { r: 0.4, h: 2.2 } });
    const [ix, iz] = par(su * 15.4, sv * 15.4);
    put({ id: 'euro-topiary-lollipop', x: ix, z: iz, solid: { r: 0.3, h: 1.6 } });
  }
  for (const [u, v] of [[-3, -26], [3, -26], [-3, 26], [3, 26], [-26, -3], [-26, 3], [26, -3], [26, 3]] as const) {
    const [x, z] = par(u, v);
    put({ id: 'topiary-cone', x, z, solid: { r: 0.5, h: 2.2 } });
  }

  // -- Between the rings: four trapezoids planted in rows (lavender / geraniums / lavender), per side of the axes.
  const GERANIUM = [0xd8342c, 0xe8708a, 0xf2f0e6, 0xd8342c];
  for (const side of [0, 1, 2, 3]) {
    // (u, v) of a trapezoid-local point: d = distance out from the centre along the side's axis, w = along the side.
    const map = (d: number, w: number): [number, number] =>
      side === 0 ? par(w, -d) : side === 1 ? par(d, w) : side === 2 ? par(w, d) : par(-d, w);
    const yaw = side % 2 === 0 ? 0 : PI / 2;
    [[16.2, 'l'], [19.5, 'g'], [22.8, 'l']].forEach(([d, kind], row) => {
      const dd = d as number;
      const lim = dd - 1.8;                          // the diagonals are x = d; keep clear of them
      for (let w = 6; w + 1.3 <= lim; w += kind === 'l' ? 3.0 : 2.3) {
        for (const sgn of [-1, 1]) {
          const [x, z] = map(dd, sgn * w);
          if (kind === 'l') put({ id: 'lavender-row', x, z, yaw });
          else put({ id: 'euro-geranium-bed', x, z, yaw, tint: GERANIUM[(side + row + (sgn > 0 ? 1 : 0)) % 4] });
        }
      }
    });
    // Benches flank each gap, looking at the walk.
    for (const sgn of [-1, 1]) {
      const [x, z] = map(20.5, sgn * 3.6);
      const [ax, az] = map(20.5, 0);
      put({ id: 'park-bench', x, z, yaw: yawTo(x, z, ax, az), solid: { w: 1.8, d: 0.7, h: 0.9 } });
    }
  }

  // -- Inside the inner ring: four pinwheel beds around a spiral, one in each quadrant; the fountain in the middle.
  for (const [su, sv] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
    const [qx, qz] = par(su * 8, sv * 8);
    put({ id: 'euro-topiary-spiral', x: qx, z: qz, solid: { r: 0.4, h: 2.2 } });
    put({ id: 'euro-geranium-bed', x: qx, z: qz - 3.8 * sv, yaw: 0, tint: 0xd8342c });
    put({ id: 'euro-geranium-bed', x: qx, z: qz + 3.8 * sv, yaw: 0, tint: 0xf2f0e6 });
    put({ id: 'euro-geranium-bed', x: qx - 3.8 * su, z: qz, yaw: PI / 2, tint: 0xe8708a });
    put({ id: 'euro-geranium-bed', x: qx + 3.8 * su, z: qz, yaw: PI / 2, tint: 0xd8342c });
  }
  put({ id: 'stone-fountain', x: CX, z: CZ, scale: 1.3, solid: { r: 1.6, h: 1.2 } });

  // -- Gravel walks: 2 m-wide paving on the two main axes (2 tiles wide, filling the hedge gaps) and a plaza round the fountain.
  for (let v = -27; v <= 27; v += 2) {
    for (const u of [-1, 1]) {
      const [x, z] = par(u, v); tile(x, z);
      const [x2, z2] = par(v, u); tile(x2, z2);
    }
  }
  for (let u = -5; u <= 5; u += 2) for (let v = -5; v <= 5; v += 2) { const [x, z] = par(u, v); tile(x, z); }

  // -- The river avenue: planes, lavender and benches along the Thymes' east bank, which is the view from the first shot.
  // trail/thymes-walk runs along the bank from (-1592, -700) to (-1607, -520): keep off it.
  const walkX = (z: number): number => (z > -700 ? -1592 - (15 * (z + 700)) / 180 : -1592);
  for (let z = -850; z <= -575; z += 11) {
    put({ id: 'euro-plane-tree', x: walkX(z) + 6, z, solid: { r: 0.45, h: 9 } });
    put({ id: 'lavender-row', x: walkX(z) + 9.5, z: z + 5.5, yaw: PI / 2 });
  }
  for (const z of [-790, -735, -680, -625]) {
    put({ id: 'park-bench', x: walkX(z) + 3.6, z, yaw: -PI / 2, solid: { w: 1.8, d: 0.7, h: 0.9 } });
  }

  // -- Plane avenues, lamps and benches along the two loop paths.
  const loopEast = pathPoints('trail/jardin-est');
  const loopWest = pathPoints('trail/jardin-ouest');
  for (const [pts, seed] of [[loopEast, 3], [loopWest, 9]] as const) {
    const r = rng(seed);
    along(pts, 13).forEach((p, i) => {
      for (const side of [-1, 1]) {
        const nx = -p.tz * side, nz = p.tx * side;
        const off = 4.2 + r() * 0.8;
        put({ id: 'euro-plane-tree', x: p.x + nx * off, z: p.z + nz * off, solid: { r: 0.45, h: 9 } });
      }
      if (i % 2 === 1) {
        const side = i % 4 === 1 ? 1 : -1;
        const x = p.x - p.tz * side * 3.2, z = p.z + p.tx * side * 3.2;
        put({ id: 'euro-lamp-post', x, z, solid: { r: 0.2, h: 4.2 } });
      }
      if (i % 4 === 2) {
        const side = i % 8 === 2 ? 1 : -1;
        const x = p.x - p.tz * side * 3.1, z = p.z + p.tx * side * 3.1;
        put({ id: 'park-bench', x, z, yaw: yawTo(x, z, p.x, p.z), solid: { w: 1.8, d: 0.7, h: 0.9 } });
      }
    });
  }

  // -- The gate end: a rose arch, flanking lamps, a short run of paving, the rules.
  put({ id: 'euro-rose-arch', x: -1427, z: -548, yaw: yawTo(-1427, -548, GATE[0], GATE[1]) });
  for (const [x, z] of [[-1431.5, -550.5], [-1422.5, -545.5]] as const) put({ id: 'euro-lamp-post', x, z, solid: { r: 0.2, h: 4.2 } });
  for (const [x, z] of [[-1433, -546], [-1431, -546], [-1424, -551], [-1422, -551]] as const) put({ id: 'euro-geranium-pot', x, z });
  sign({ kind: 'street', text: 'JARDIN\nGates close at dusk', x: -1420, z: -544, yaw: yawTo(-1420, -544, GATE[0], GATE[1]) });
  sign({ kind: 'poster', text: 'JARDIN RULES\nKeep off the grass.\nKeep off the gravel.\nKeep calm.', x: -1435, z: -552, yaw: yawTo(-1435, -552, GATE[0], GATE[1]) });

  // -- Signs in the parterre and along the walks.
  sign({ kind: 'poster', text: 'The hedge is not a shortcut. The hedge is a decision.', x: -1535, z: -716, yaw: -PI / 2 });
  sign({ kind: 'poster', text: 'Please do not feed the topiary. It has opinions.', x: -1485, z: -724, yaw: PI / 2 });
  sign({ kind: 'poster', text: 'Boules: not in the box hedge. Not even a little.', x: -1494.5, z: -708.5, yaw: PI / 2 });
  sign({ kind: 'poster', text: 'No ball games.\nNo ball.\nNo games.', x: -1510, z: -748.5, yaw: 0 });
  sign({ kind: 'poster', text: 'Gates close at dusk.\nDusk is announced by the gardener.', x: -1507, z: -690.5, yaw: PI });
  sign({ kind: 'poster', text: 'SOURCE OF THE THYMES\nPlease do not ask which drop.', x: -1598, z: -872, yaw: yawTo(-1598, -872, -1620, -880) });
  sign({ kind: 'street', text: 'Allée des Plane Trees\nOne way (for the river)', x: -1598, z: -840, yaw: PI / 2 });

  // -- The vignette: the topiary that went wrong. A swan, clipped by committee, west of the parterre.
  {
    const bx = -1566, bz = -688;
    put({ id: 'topiary-cone', x: bx, z: bz, rot: [0, 0.5, PI / 2], y: 0.5, scale: 1.1 });
    [[-2.6, 1.9], [-3.9, 3.0], [-5.4, 3.5], [-6.9, 3.0], [-8.0, 1.9]].forEach(([dx, dz], i) => {
      put({ id: 'boxwood-ball', x: bx + dx, z: bz + dz, scale: 1.1 + (i % 2) * 0.35, y: i === 2 ? 0.15 : 0 });
    });
    put({ id: 'topiary-cone', x: bx - 1.8, z: bz - 2.4, solid: { r: 0.5, h: 2.2 } });   // the cone that was meant to be the swan's neck
    put({ id: 'hedge-shears', x: bx + 1.2, z: bz + 1.4, y: 0.03, rot: [PI / 2, 0.6, 0] });
    put({ id: 'crate', x: bx + 2.5, z: bz - 0.6, yaw: 0.3, solid: { r: 0.4, h: 0.8 } });
    put({ id: 'crate', x: bx + 2.6, z: bz - 0.5, y: 0.8, yaw: 0.9 });
    [[0.6, -1.6], [-0.9, -0.3], [1.9, 1.8], [-3.4, -1.4], [-1.2, 2.5]].forEach(([dx, dz], i) => {
      put({ id: 'boxwood-ball', x: bx + dx, z: bz + dz, scale: 0.18 + 0.03 * i, y: 0.02 });   // clippings
    });
    put({ id: 'tin-pail', x: bx + 0.2, z: bz + 3.3 });
    put({ id: 'stool', x: bx - 4.2, z: bz - 3.8, rot: [0, 0, PI / 2], y: 0.25 });          // the stool the judge fell off
    sign({ kind: 'poster', text: '"SWAN", 3rd prize.\nJudges asked: is it a croissant?', x: bx - 5.5, z: bz + 1.5, yaw: PI / 2 });
    sign({ kind: 'poster', text: 'Nail scissors in the crate. Return them. We know who.', x: bx + 2.5, z: bz + 1.8, yaw: 0.2 });
    vignettes.push({
      id: 'gd-wonky-swan', name: 'The topiary that went wrong', x: bx, z: bz,
      story: 'A hedge clipped as a swan came out a lopsided croissant: the neck lies on its side, clippings everywhere, the shears on the grass, a crate of nail scissors under a "return them" sign.',
    });
  }

  // -- The vignette: the escaped boule. It left the game, entered the box hedge and stayed.
  {
    const [hx, hz] = par(14, 3);
    put({ id: 'pl-boule', x: hx, z: hz, y: 0.84 });                     // on top of the hedge
    put({ id: 'pl-boule', x: CX + 9.5, z: CZ + 0.6, y: 0.04 });          // the trail across the paving
    put({ id: 'pl-boule', x: CX + 11.2, z: CZ - 0.5, y: 0.04 });
    put({ id: 'hand-rake', x: CX + 12.9, z: CZ + 3.5, y: 0.5, rot: [0.5, 0.4, 0.2] });
    put({ id: 'euro-geranium-pot', x: CX + 12.9, z: CZ + 5.4 });
    put({ id: 'tin-pail', x: CX + 11.6, z: CZ + 4.6 });
    put({ id: 'euro-cafe-chair', x: CX + 12.4, z: CZ - 3.8, yaw: -PI / 2 + 0.4 });
    vignettes.push({
      id: 'gd-escaped-boule', name: 'The escaped boule', x: CX + 11, z: CZ + 2,
      story: 'A boule rolled across the paving, crossed the gap, hopped the box hedge and came to rest on top of it. A rake and a cafe chair are conducting the search; the gardener is calmly furious.',
    });
  }

  // -- The vignette: the reserved bench, bollarded, on the river avenue (the shot looks straight at it).
  {
    const bz = -644, bx = walkX(bz) + 4.4;
    put({ id: 'park-bench', x: bx, z: bz, yaw: -PI / 2, solid: { w: 1.8, d: 0.7, h: 0.9 } });
    for (const [dx, dz] of [[1.4, -1.5], [1.4, 1.5], [-1.0, -1.5], [-1.0, 1.5]] as const) put({ id: 'euro-bollard', x: bx + dx, z: bz + dz, solid: { r: 0.15, h: 1 } });
    put({ id: 'euro-geranium-pot', x: bx + 1.4, z: bz - 0.8 });
    put({ id: 'euro-geranium-pot', x: bx + 1.4, z: bz + 0.8 });
    put({ id: 'round-rug', x: bx + 3.4, z: bz, y: 0.02, scale: 0.7 });
    put({ id: 'wicker-basket', x: bx + 3.5, z: bz + 0.6, y: 0.03 });
    put({ id: 'bird-pigeon', x: bx - 1.6, z: bz - 1.8, yaw: yawTo(bx - 1.6, bz - 1.8, bx, bz) });
    put({ id: 'bird-pigeon', x: bx - 2.3, z: bz + 2.0, yaw: yawTo(bx - 2.3, bz + 2.0, bx, bz) });
    sign({ kind: 'poster', text: 'Reserved for Madame Persil.\nAlso Thursdays. Also always.', x: bx + 2.1, z: bz - 2.4, yaw: PI / 2 });
    vignettes.push({
      id: 'gd-reserved-bench', name: 'The reserved bench', x: bx, z: bz,
      story: 'A park bench ringed with bollards and geranium pots, a rug and a basket set for a picnic nobody has been allowed to start, two pigeons waiting for the real owner like everyone else.',
    });
  }

  // -- The English corner (west bank, inside the jardin-ouest loop): wilder by order of the committee.
  {
    const r = rng(41);
    for (let i = 0; i < 46; i++) {
      const x = -1738 + r() * 94, z = -800 + r() * 235;
      if (Math.hypot(x + 1700, z + 690) > 56) continue;
      put({ id: i % 5 === 0 ? 'boxwood-ball' : 'plant', x, z, scale: 0.6 + r() * 0.7, yaw: r() * 6.28, tint: 0x6b9a46 + Math.floor(r() * 3) * 0x080800 });
    }
    // A wandering hedgerow, so you cannot see the whole corner at once.
    [[-1745, -760, 0.4], [-1730, -770, 0.1], [-1713, -772, -0.15], [-1696, -768, -0.4], [-1680, -740, 1.2], [-1678, -720, 1.5], [-1690, -625, 0.3], [-1706, -622, 0.1], [-1722, -628, -0.3]]
      .forEach(([x, z, yaw]) => put({ id: 'hedgerow', x, z, yaw, solid: { w: 4, d: 1.2, h: 1.3 } }));
    // The folly: a post-booth, two stretches of ivy wall, a statue with no head.
    put({ id: 'euro-post-booth', x: -1722, z: -700, yaw: 0.4, solid: { r: 0.7, h: 2.8 } });
    put({ id: 'euro-ivy-wall', x: -1724.5, z: -697.5, yaw: PI / 2 + 0.4, solid: { w: 3, d: 0.5, h: 1.6 } });
    put({ id: 'euro-ivy-wall', x: -1719, z: -702.5, yaw: 0.4 + 0.9, solid: { w: 3, d: 0.5, h: 1.6 } });
    put({ id: 'gnome-statue', x: -1713.5, z: -692, yaw: yawTo(-1713.5, -692, -1722, -700), solid: { r: 0.5, h: 1.8 } });
    sign({ kind: 'poster', text: 'FOLLY (Romantic Ruin).\nBuilt last Tuesday. Ruined Wednesday.', x: -1715, z: -705.5, yaw: -0.8 });
    // The duck house on the bank, the bench that looks at it.
    put({ id: 'duck-house', x: -1628, z: -748, yaw: PI / 2 });
    put({ id: 'bench', x: -1648, z: -742, yaw: PI / 2, solid: { w: 1.6, d: 0.6, h: 0.9 } });
    sign({ kind: 'poster', text: 'Ducks are on strike.\nThe house is open.', x: -1640, z: -750, yaw: PI / 2 });
    sign({ kind: 'poster', text: 'English corner: wild by order of the committee. Do not tidy.', x: -1650, z: -783, yaw: PI / 2 });
    // Abandoned picnic, with standing: three pigeons have the bread.
    const px = -1676, pz = -668;
    put({ id: 'round-rug', x: px, z: pz, y: 0.02, scale: 1 });
    put({ id: 'wicker-basket', x: px - 0.5, z: pz - 0.4, y: 0.03 });
    put({ id: 'euro-cafe-chair', x: px + 1.9, z: pz + 0.3, rot: [0, 0.8, PI / 2], y: 0.25 });
    put({ id: 'euro-cafe-chair', x: px - 2.1, z: pz - 0.2, yaw: 0.3 });
    put({ id: 'bread-loaf', x: px + 0.5, z: pz + 0.4, y: 0.05 });
    put({ id: 'cheese-wedge', x: px + 0.2, z: pz - 0.7, y: 0.05 });
    put({ id: 'bird-pigeon', x: px + 1.0, z: pz + 0.9, yaw: 3 });
    put({ id: 'bird-pigeon', x: px + 1.3, z: pz - 0.3, yaw: 2.2 });
    put({ id: 'bird-pigeon', x: px - 0.2, z: pz + 1.6, yaw: 4 });
    sign({ kind: 'poster', text: 'Picnic abandoned mid-argument.\nThe pigeons have standing.', x: px - 4, z: pz + 3, yaw: 0.4 });
    vignettes.push({
      id: 'gd-picnic-standing', name: 'The picnic with standing', x: px, z: pz,
      story: 'A rug, a basket, a chair knocked flat and one still politely upright: the picnic ended mid-argument and three pigeons have taken over the bread, with every right.',
    });
    vignettes.push({
      id: 'gd-english-folly', name: 'The folly', x: -1718, z: -698,
      story: 'A romantic ruin made of one post-booth, two stretches of ivy wall and a headless statue, built on Tuesday and ruined on Wednesday by a very thorough committee.',
    });
  }

  // ---- Jardin residents ---------------------------------------------------------------------------------------------
  const gdResidents: AmbientGnomeDef[] = [
    {
      id: 'pl-gardener', name: 'Aurèle Clippe', x: CX + 12.2, z: CZ + 5.8, yaw: -PI / 2, idle: 'rake',
      look: { hat: 0x2f6b3a, shirt: 0x8a9a5b, pants: 0x4a3b2a, beard: 0xb0a090, glasses: true },
      bubble: 'One leaf. One. Out of line. I shall not speak of it again until noon.',
    },
    {
      id: 'pl-gd-poet', name: 'Sylvain Rimeless', x: -1586.4, z: -735, yaw: -PI / 2, idle: 'read',
      look: { hat: 0x5a2d6e, shirt: 0xd8c9a0, pants: 0x3a3a50, beard: null },
      bubble: 'I am composing an ode to a bench. So far it rhymes with nothing. Perfect.',
    },
  ];
  residents.push(...gdResidents);

  // ======================================================================================================================
  // THE LITTLE GARDENS (allotments)
  // ======================================================================================================================
  const PX = -1451;                                 // the central path
  const Z_TOP = 526, ROW = 24, ROWS = 14;
  for (let z = 524; z <= 878; z += 2) tile(PX, z);
  // Entrance arch, lamps down the path, the committee's noticeboards (facing south so the shot reads them).
  put({ id: 'euro-rose-arch', x: PX, z: 523, yaw: 0 });
  for (let k = 0; k <= ROWS; k++) {
    put({ id: 'euro-lamp-post', x: PX + (k % 2 ? 2.0 : -2.0), z: Z_TOP + k * ROW - 0.5, solid: { r: 0.2, h: 4.2 } });
  }
  sign({ kind: 'street', text: 'LITTLE GARDENS\nMind the marrows', x: PX - 3.4, z: 530, yaw: 0 });
  sign({ kind: 'poster', text: 'ALLOTMENT RULES\n1. Water is for plants.\n2. Opinions are for after.\n3. See 1.', x: PX + 4.2, z: 530.5, yaw: 0 });
  sign({ kind: 'poster', text: 'No scarecrows. They look back.', x: PX - 6.6, z: 531, yaw: 0 });

  const plotSigns = [
    'Whoever is measuring my marrow at night: I know. -- W. Marrow',
    'Marrow left on the Plot 12 gate again. I do not want it. Take it back.',
    'COMPOST: it is not yours. It is the committee\'s. The committee is me.',
    'Hosepipe ban continues. The hosepipe has been told.',
    'Wanted: one wheelbarrow, previously ours, last seen heading downhill.',
    'Plot 31\'s tomatoes are, strictly, a cabbage. Committee ruling.',
    'Meeting Thursday. Agenda: the previous meeting.',
    'Slugs: please queue. One at a time. Single file. Not that file.',
    'Rule 9: gossip over the fence, not through it.',
    'Bean poles are not for leaning on, however sad you are.',
    'The shed is not a second home. It is, however, a first one.',
    'STRIKE NOTICE: the strike has been postponed by a second strike.',
  ];
  let signI = 0;
  const wheel = ['wheelbarrow', 'watering-can', 'tin-pail', 'soil-sack'];
  for (let side = -1; side <= 1; side += 2) {
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < ROWS; row++) {
        const z0 = Z_TOP + row * ROW;
        const xin = PX + side * (2.5 + col * 16.5);
        const wx = (a: number): number => xin + side * a;
        const n = row * 7 + col * 3 + (side + 1) * 5 + 1;
        const h = hash(n);
        const war = side === -1 && row === 6;           // the marrow war's two plots
        // Beds: two columns, three or four rows; a fallow bed now and then.
        const bedRows = h > 0.5 ? 4 : 3;
        for (let c = 0; c < 2; c++) for (let i = 0; i < bedRows; i++) {
          if (!war && hash(n * 11 + c * 5 + i) < 0.12) continue;
          const bx = wx(2.4 + c * 4.1), bz = z0 + 2 + 3.4 * i;
          put({ id: 'allotment-bed', x: bx, z: bz, yaw: 0 });
          if (!war && hash(n * 17 + c * 3 + i) < 0.18) put({ id: 'pl-marrow', x: bx + (hash(n + i) - 0.5), z: bz, y: 0.42, yaw: hash(n + c) * 3, scale: 1 + hash(n * 3 + i) * 0.5 });
        }
        // The shed strip on the outer side: a shed (or crates), a water butt, a barrow, a bean frame.
        const kind = Math.floor(hash(n * 5) * 3);
        if (kind === 0) put({ id: 'garden-shed', x: wx(12.8), z: z0 + 3, yaw: side > 0 ? -PI / 2 : PI / 2, solid: { w: 2.2, d: 2.2, h: 2 } });
        else if (kind === 1) put({ id: 'euro-post-booth', x: wx(12.8), z: z0 + 3, yaw: side > 0 ? -PI / 2 : PI / 2, solid: { w: 1.4, d: 1.4, h: 2.8 } });
        else {
          put({ id: 'crate', x: wx(12.4), z: z0 + 3, yaw: hash(n) * 3, solid: { r: 0.4, h: 0.8 } });
          put({ id: 'crate', x: wx(13.5), z: z0 + 3.4, yaw: hash(n + 1) * 3, solid: { r: 0.4, h: 0.8 } });
          put({ id: 'crate', x: wx(12.9), z: z0 + 3.1, y: 0.8, yaw: hash(n + 2) * 3 });
        }
        put({ id: 'euro-water-butt', x: wx(14.8), z: z0 + 5.2, solid: { r: 0.35, h: 1.1 } });
        put({ id: wheel[Math.floor(hash(n * 7) * wheel.length)], x: wx(11.6), z: z0 + 8.6, yaw: hash(n * 2) * 6.28 });
        if (hash(n * 13) < 0.7) put({ id: 'euro-vine-pergola', x: wx(13), z: z0 + 13.5, yaw: PI / 2 });
        if (hash(n * 19) < 0.5) put({ id: 'flower-pot', x: wx(10.4), z: z0 + 15.5 });
        if (hash(n * 23) < 0.35) put({ id: 'stool', x: wx(8.5), z: z0 + 16.5, yaw: hash(n) * 6 });
        // A plot sign facing the path on the inner fence, now and then.
        if (!war && hash(n * 29) < 0.2 && col === 0) {
          sign({ kind: 'poster', text: plotSigns[signI++ % plotSigns.length], x: xin - side * 0.3, z: z0 + 19.5, yaw: side > 0 ? -PI / 2 : PI / 2 });
        }
      }
    }
  }
  // Remaining notices on the cross lanes, so every sign gets read.
  while (signI < plotSigns.length) {
    const k = signI++;
    sign({ kind: 'poster', text: plotSigns[k], x: PX + (k % 2 ? 3.2 : -3.2), z: Z_TOP + 24 * (k + 1) + 20, yaw: k % 2 ? PI / 2 : -PI / 2 });
  }

  // -- The vignette: the marrow war (W plots, row 6, col 0 and col 1).
  {
    const z0 = Z_TOP + 6 * ROW;                     // 670
    const aX = PX - 2.5 - 8.0, bX = PX - 19 - 8.0;   // plot centres: Wilhelmina's (col 0) and the rival's (col 1)
    put({ id: 'pl-marrow', x: aX - 1, z: z0 + 9.5, scale: 3, yaw: 0.4, y: 0.4 });
    put({ id: 'pl-marrow', x: bX + 1, z: z0 + 9.5, scale: 3.1, yaw: -0.3, y: 0.4 });
    put({ id: 'signpost', x: PX - 18.9, z: z0 + 9.5, solid: { r: 0.15, h: 2 } });          // the measuring post, exactly on the line
    put({ id: 'rope-coil', x: PX - 18.1, z: z0 + 10.6, yaw: 0.8 });
    put({ id: 'rope-coil', x: PX - 19.6, z: z0 + 8.6, yaw: 2.1 });
    put({ id: 'stool', x: bX + 2.4, z: z0 + 15, rot: [0, 0, PI / 2], y: 0.25 });
    put({ id: 'night-shift-lantern', x: bX + 1.8, z: z0 + 14, y: 0 });
    put({ id: 'wicker-basket', x: aX + 2.2, z: z0 + 15.2 });
    put({ id: 'wheelbarrow', x: aX + 1.5, z: z0 + 17.6, yaw: 0.6 });
    put({ id: 'tin-pail', x: bX - 1.4, z: z0 + 17.2 });
    sign({ kind: 'poster', text: 'To whoever measures my marrow at night: I know.\n-- W. Marrow', x: PX - 3.4, z: z0 + 13.5, yaw: -PI / 2 });
    sign({ kind: 'poster', text: 'Mine is longer. (Anonymous. It was Plot 14.)', x: PX - 19.3, z: z0 + 12.5, yaw: PI / 2 });
    sign({ kind: 'poster', text: 'MEASURING POST. Tape holders must be neutral. Nobody is.', x: PX - 18.7, z: z0 + 7.2, yaw: 0 });
    vignettes.push({
      id: 'gd-marrow-war', name: 'The marrow war', x: PX - 19, z: z0 + 10,
      story: 'Two plots side by side, a monstrous marrow in each, a measuring post on the boundary and rope tapes strewn about, a night lantern at the rival\'s end and an anonymous note at the other.',
    });
    residents.push({
      id: 'pl-marrow', name: 'Wilhelmina Marrow', x: aX + 1.5, z: z0 + 12.2, yaw: yawTo(aX + 1.5, z0 + 12.2, PX - 19, z0 + 9.5), idle: 'measure',
      look: { hat: 0x7a3b8e, shirt: 0xa8c070, pants: 0x4a4a3a, dress: true, glasses: true, beard: null },
      bubble: 'Forty-one centimetres to the post. Forty-one. Someone has been at it with a ruler. I always know.',
    });
  }

  // -- The vignette: the compost summit, at the foot of the garden (z ~ 868).
  {
    const bx = PX + 9, bz = 868;
    put({ id: 'compost-bin', x: bx, z: bz, solid: { w: 1.4, d: 1.4, h: 1.2 } });
    put({ id: 'compost-heap', x: bx + 2.8, z: bz + 0.4, yaw: 0.6 });
    put({ id: 'wheelbarrow', x: bx - 2.2, z: bz + 1.8, yaw: -0.9 });
    put({ id: 'soil-sack', x: bx + 0.8, z: bz + 2.6, yaw: 0.2 });
    put({ id: 'park-bench', x: bx - 3.6, z: bz - 1.2, yaw: PI / 2, solid: { w: 1.8, d: 0.7, h: 0.9 } });
    put({ id: 'euro-cafe-chair', x: bx + 4.4, z: bz - 1.4, rot: [0, 0.3, PI / 2], y: 0.25 });
    sign({ kind: 'poster', text: 'COMPOST SUMMIT, 3 pm.\nBring your own opinions.', x: bx - 3.4, z: bz - 3.4, yaw: 0 });
    vignettes.push({
      id: 'gd-compost-summit', name: 'The compost summit', x: bx, z: bz,
      story: 'The committee met at the compost heap to settle whose compost it is. A bench, a knocked-over chair, one wheelbarrow of evidence and a sack of soil nobody will admit to owning.',
    });
  }
  put({ id: 'village-well', x: PX - 9, z: 872, solid: { r: 1, h: 2 } });
  sign({ kind: 'poster', text: 'The well is for water. Not for wishes. Wishes go in the compost.', x: PX - 9, z: 868.2, yaw: PI });
  residents.push({
    id: 'pl-gd-waterer', name: 'Gaspard Rosette', x: PX + 6.2, z: 760, yaw: -PI / 2, idle: 'water',
    look: { hat: 0xe0c050, shirt: 0xb86a3a, pants: 0x3a4a5a, beard: 0xd0b090 },
    bubble: 'I water at noon, as the rules say. The rules do not say how much. I interpret.',
  });

  // ======================================================================================================================
  // BASIN QUAY
  // ======================================================================================================================
  const taken: Footprint[] = [];
  const buildings: EuroPlacement[] = [
    { id: 'euro-canal-boathouse', x: -1540.5, z: 1040, yaw: -PI / 2, scale: 1 },
    { id: 'euro-tabac-kiosk', x: -1472, z: 1021, yaw: 0, scale: 1 },
  ];
  plan.buildings.push(...keepClear(buildings, taken, rects));

  // Promenade (a single column of paving), lamps and benches facing the water, railings on the water's edge.
  for (let z = 1008; z <= 1094; z += 2) tile(-1531, z);
  for (let z = 1012; z <= 1092; z += 20) put({ id: 'euro-lamp-post', x: -1528.8, z, solid: { r: 0.2, h: 4.2 } });
  for (const z of [1022, 1058, 1086]) put({ id: 'park-bench', x: -1527, z, yaw: -PI / 2, solid: { w: 1.8, d: 0.7, h: 0.9 } });
  for (let z = 1009; z <= 1093; z += 2.06) {
    if (Math.abs(z - 1040) < 6.5 || Math.abs(z - 1076) < 5) continue;
    put({ id: 'euro-iron-railing', x: -1547.5, z, yaw: PI / 2, solid: { w: 2, d: 0.15, h: 1 } });
  }
  for (const z of [1033.5, 1046.5, 1070.5, 1081.5]) put({ id: 'euro-bollard', x: -1546.6, z, solid: { r: 0.15, h: 1 } });
  for (let x = -1545; x <= -1410; x += 3.2) put({ id: 'euro-flower-trough', x, z: 1007.5, yaw: 0 });
  for (let x = -1520; x <= -1410; x += 36) put({ id: 'euro-lamp-post', x, z: 1009.6, solid: { r: 0.2, h: 4.2 } });
  for (const x of [-1510, -1440]) put({ id: 'park-bench', x, z: 1011.5, yaw: PI, solid: { w: 1.8, d: 0.7, h: 0.9 } });

  // The harbourmaster's kiosk (tabac-kiosk): benches and bollards for the queue.
  put({ id: 'pl-queue-post', x: -1474, z: 1027, yaw: 0 });
  put({ id: 'pl-queue-post', x: -1472.5, z: 1027, yaw: 0 });
  put({ id: 'pl-queue-post', x: -1471, z: 1027, yaw: 0 });
  put({ id: 'euro-bollard', x: -1468, z: 1027.5, solid: { r: 0.15, h: 1 } });
  sign({ kind: 'poster', text: 'MOORINGS: by appointment.\nAPPOINTMENTS: by mooring.', x: -1477.5, z: 1026.4, yaw: 0 });
  sign({ kind: 'poster', text: 'Harbour closed for lunch.\nLunch closed for harbour.', x: -1466.4, z: 1026.4, yaw: 0 });
  sign({ kind: 'poster', text: 'BASIN QUAY\nNo wake. No wave. No opinions.', x: -1490, z: 1009.5, yaw: 0 });
  sign({ kind: 'street', text: 'BASIN QUAY\nAll boats please be present', x: -1411, z: 1008, yaw: -PI / 2 });
  sign({ kind: 'poster', text: 'Boat inspection: Tuesdays. Boats: please be present.', x: -1425, z: 1015, yaw: 0 });
  sign({ kind: 'poster', text: 'Lost: one oar. Found: the other oar. Reward: the first oar.', x: -1460, z: 1010, yaw: 0 });

  // -- The vignette: the swan pedalo's retirement.
  {
    const px = -1511, pz = 1054;
    put({ id: 'pl-swan-pedalo', x: px, z: pz, yaw: -0.5, solid: { r: 1.5, h: 1.5 } });
    put({ id: 'crate', x: px + 2.9, z: pz + 0.4, rot: [PI, 0.4, 0], y: 0.8 });          // the upside-down crate it is propped on
    put({ id: 'glaze-extra-toolbox', x: px - 2.5, z: pz + 1.2, yaw: 0.7 });
    put({ id: 'tin-pail', x: px - 1.9, z: pz - 2.2 });
    put({ id: 'rope-coil', x: px + 1.4, z: pz + 2.6, yaw: 1.2 });
    put({ id: 'euro-cafe-chair', x: px - 4.1, z: pz - 0.6, yaw: 1.2 });
    put({ id: 'bird-swan', x: px - 7.4, z: pz - 1.6, yaw: yawTo(px - 7.4, pz - 1.6, px, pz) });  // a real swan comes to look, and judge
    sign({ kind: 'poster', text: 'FOR SALE: one swan, slightly used. Does not honk.', x: px - 3.2, z: pz + 3.8, yaw: 0.3 });
    vignettes.push({
      id: 'gd-pedalo-retired', name: "The swan pedalo's retirement", x: px, z: pz,
      story: 'The pedalo has been hauled onto the quay for repairs and is for sale: toolbox, rope, a chair for the supervising gnome, and a real swan watching from the edge with the air of a competitor.',
    });
  }

  // -- The vignette: the angler who never catches.
  {
    const ax = -1545.2, az = 1076;
    put({ id: 'stool', x: ax, z: az, yaw: -PI / 2, solid: { r: 0.3, h: 0.5 } });
    put({ id: 'fishing-rod', x: ax - 0.9, z: az + 0.5, y: 0.5, rot: [0, 0, PI / 2 - 0.5], scale: 1 });
    put({ id: 'tin-pail', x: ax + 0.4, z: az + 1.1 });
    put({ id: 'wicker-basket', x: ax + 0.5, z: az - 1.3 });
    put({ id: 'bread-loaf', x: ax + 0.7, z: az - 1.2, y: 0.4 });
    put({ id: 'bird-pigeon', x: ax + 1.8, z: az - 0.6, yaw: yawTo(ax + 1.8, az - 0.6, ax, az) });
    sign({ kind: 'poster', text: 'Fish: 0. Patience: 12.', x: ax + 2.2, z: az + 2.2, yaw: -0.6 });
    vignettes.push({
      id: 'gd-angler', name: 'The angler who never catches', x: ax, z: az,
      story: 'A stool at the one gap in the railings, a rod out over the basin, an empty pail, a sandwich with only a pigeon interested. The sign keeps the score.',
    });
    residents.push({
      id: 'pl-gd-angler', name: 'Fulbert Nibble', x: ax + 0.1, z: az - 0.4, yaw: -PI / 2, idle: 'fish',
      look: { hat: 0xd0c070, shirt: 0x4a6a7a, pants: 0x5a4a3a, beard: 0xc8c8c0, glasses: true },
      bubble: 'Nothing today. Nothing yesterday. The nothing is getting bigger. I admire its commitment.',
    });
  }

  // -- Crates, a stall and the east end of the quay.
  const crates: [number, number][] = [[-1426, 1036], [-1422, 1040], [-1430, 1044]];
  for (const [x, z] of crates) {
    put({ id: 'cargo-crate', x, z, yaw: x * 0.1, solid: { w: 1.4, d: 1.4, h: 1.4 } });
    put({ id: 'cargo-crate', x: x + 0.1, z: z - 0.1, y: 1.4, yaw: x * 0.3 });
  }
  put({ id: 'crate', x: -1424, z: 1048, yaw: 0.3, solid: { r: 0.4, h: 0.8 } });
  put({ id: 'market-stall', x: -1448, z: 1068, yaw: -PI / 2, solid: { w: 1.6, d: 2.6, h: 1.8 } });
  put({ id: 'bread-loaf', x: -1448.3, z: 1067.4, y: 0.95 });
  sign({ kind: 'poster', text: 'FRESH TIDE TABLES\n(a little late)', x: -1445.8, z: 1071.2, yaw: -PI / 2 });
  sign({ kind: 'poster', text: 'STRIKE: the tide, on a go-slow. Back at half past whenever.', x: -1428, z: 1054.5, yaw: PI });
  sign({ kind: 'poster', text: 'Queue here for the ferry. There is no ferry. The queue is the ferry.', x: -1436, z: 1086, yaw: PI });
  for (const [x, z] of [[-1420, 1080], [-1415, 1082], [-1425, 1084]] as const) put({ id: 'bird-pigeon', x, z, yaw: 2 + x * 0.2 });

  residents.push({
    id: 'pl-harbourmaster', name: 'Captain Anchois', x: -1463, z: 1027.5, yaw: PI, idle: 'check-watch',
    look: { hat: 0x1f2f4f, shirt: 0xe8e8f0, pants: 0x1f2f4f, beard: 0xffffff, boots: 0x222222 },
    bubble: 'Your mooring is in order. The order has been postponed. Please take a number, then take another.',
  });

  vignettes.sort((a, b) => a.id.localeCompare(b.id));
  return plan;
}
