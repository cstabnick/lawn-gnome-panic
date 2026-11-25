// Pardonlin district plan (E30): the Left Bank: Radio Adagio, the Beetle Market, the backyards. Pure data (../plan.ts).
// The arty, poorer, louder west bank. Layout, west to east: the backyards (rect B, far south), rue-ouest, the inner
// blocks (the Beetle Market, pocket gardens), the Boulevard (7 m), the Radio Adagio block and the Thymes walk.
import { euroBuilding } from '../../eurokit/catalog';
import { planStreetRow, type EuroPlacement } from '../../eurokit/street';
import { districtById, footprintsOverlap, frontage, roadClearance, type Footprint, type RowStart } from '../layout';
import { buildingFootprint, emptyPlan, keepClear, local, type DistrictPlan, type PlanProp, type PlanSign } from '../plan';

const PI = Math.PI;

/** The Boulevard's centre line x at a given z (for pavements and lamp posts). */
const BOULEVARD: readonly (readonly [number, number])[] = [
  [-1690, -420], [-1700, -300], [-1695, -170], [-1705, -30], [-1700, 110], [-1695, 250], [-1705, 380],
];
function bx(z: number): number {
  for (let i = 1; i < BOULEVARD.length; i++) {
    const [x0, z0] = BOULEVARD[i - 1], [x1, z1] = BOULEVARD[i];
    if (z <= z1 || i === BOULEVARD.length - 1) return x0 + ((x1 - x0) * (z - z0)) / (z1 - z0);
  }
  return -1700;
}

type PropOpts = Partial<Omit<PlanProp, 'id' | 'x' | 'z'>>;

// Shopfront signs by building id, cycled in order of appearance.
const PLAQUES: Record<string, readonly string[]> = {
  'euro-shopfront-antiques': ['GALLERY\nToday\'s show: a chair', 'ANTIQUES\n(some of it is new)', 'OLD THINGS\nAsk before you sit', 'GALLERY No. 2\nToday\'s show: the other chair'],
  'euro-shopfront-chemist': ['CHEMIST\nCures for lunch', 'APOTHECARY\nSecond opinions free', 'CHEMIST\nNow with fewer cures'],
  'euro-shopfront-cheese': ['CHEESE\nSince before the cheese', 'CHEESE AGAIN\n(we were closed)', 'CHEESE & SON\n(the son is aged 9)'],
  'euro-bakery': ['BAKERY\nOpinions on bread inside', 'BAKERY\nThe long one is back'],
  'euro-bistro': ['BISTRO\nLunch (3 hours)', 'BISTRO\nLunch (until Thursday)'],
  'euro-corner-cafe': ['CAFE\nQuiet please. We are brooding.'],
  'euro-half-timbered': ['ATELIER No. 4\n(No. 3 is next door)', 'ATELIER\nBeing a genius. Back at 3', 'STUDIO\nPlease knock. Then queue'],
  'euro-townhouse-tall': ['STUDIO\nNoisy genius, 3rd floor'],
};

export function planLeftBank(): DistrictPlan {
  const plan = emptyPlan('left-bank');
  const rects = districtById('left-bank').rects;
  const taken: Footprint[] = [];
  const bfps: Footprint[] = [];

  const prop = (id: string, x: number, z: number, o: PropOpts = {}): void => { plan.props.push({ id, x, z, ...o }); };
  const sign = (kind: PlanSign['kind'], text: string, x: number, z: number, yaw: number, o: Partial<PlanSign> = {}): void => {
    plan.signs.push({ kind, text, x, z, yaw, ...o });
  };
  const reserve = (x0: number, x1: number, z0: number, z1: number): void => {
    taken.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, yaw: 0 });
  };
  const free = (x: number, z: number, m = 0.5): boolean =>
    !taken.some((o) => footprintsOverlap({ x, z, w: m * 2, d: m * 2, yaw: 0 }, o));
  const addBuildings = (list: EuroPlacement[]): EuroPlacement[] => {
    for (const b of list) { plan.buildings.push(b); bfps.push(buildingFootprint(b)!); }
    return list;
  };
  const rows = (starts: RowStart[], seed: number, mix?: readonly string[], corner = false): void => {
    starts.forEach((s, i) => { addBuildings(keepClear(planStreetRow({ ...s, seed: seed + i * 7, mix, corner }), taken, rects)); });
  };
  /** Paving tiles on a 2 m grid inside a rectangle (centres at x0 + 1, x0 + 3 ...). Never on roads or under buildings. */
  const pave = (x0: number, x1: number, z0: number, z1: number, id = 'euro-paving-tile'): void => {
    for (let x = x0 + 1; x < x1; x += 2) {
      for (let z = z0 + 1; z < z1; z += 2) {
        if (roadClearance(x, z) <= 2.2) continue;
        const f: Footprint = { x, z, w: 2, d: 2, yaw: 0 };
        if (bfps.some((o) => footprintsOverlap(f, o))) continue;
        prop(id, x, z);
      }
    }
  };

  // ---- Reserved ground (kept free of terraces) -------------------------------------------------------------------
  // Radio Adagio: the opera hall first (a landmark), then its whole block.
  addBuildings(keepClear([{ id: 'euro-opera-hall', x: -1668, z: -100, yaw: -PI / 2, scale: 1, tint: 0xe8d8b8, trim: 0x4a4f57 }], taken, rects));
  reserve(-1698, -1636, -152, -48);
  // The lay-by on the Boulevard's west pavement opposite the hall (the shot spot stands in it).
  reserve(-1730, -1698, -128, -72);
  // The composer's lot (a house that has not been written yet).
  reserve(-1716, -1703, -256, -243);
  // The Beetle Market and its north annex.
  reserve(-1762, -1700, 117, 248);
  reserve(-1760, -1703, 46, 107);
  // The queue for nothing (a post booth and its line) in the first inner block.
  reserve(-1750, -1722, -232, -214);
  // The riverside artists' terrace and the easel by the river.
  reserve(-1690, -1640, 24, 70);

  // ---- Terraces ---------------------------------------------------------------------------------------------------
  const mixStreet = ['euro-townhouse-mansard', 'euro-townhouse-tall', 'euro-half-timbered', 'euro-shopfront-antiques', 'euro-shopfront-chemist', 'euro-bakery', 'euro-townhouse-tall', 'euro-shopfront-cheese'];
  const mixArt = ['euro-half-timbered', 'euro-townhouse-tall', 'euro-townhouse-mansard', 'euro-shopfront-antiques', 'euro-bistro', 'euro-half-timbered'];
  // The Boulevard: both sides (right = west, left = east, since it runs south).
  rows(frontage('pl-boulevard', 'right', 8), 11, mixStreet, true);
  rows(frontage('pl-boulevard', 'left', 8), 29, mixArt, true);
  // Rue-ouest: inner (left, east) and outer (right, west) side.
  rows(frontage('pl-rue-ouest', 'left', 8), 41, mixStreet);
  rows(frontage('pl-rue-ouest', 'right', 8), 53, mixArt);
  // Cross streets and bridgeheads, both sides.
  for (const [id, seed] of [['pl-rue-e', 61], ['pl-rue-f', 71], ['pl-pont-nord', 83], ['pl-pont-neuf', 97], ['pl-pont-sud', 109]] as const) {
    rows(frontage(id, 'left', 8, 8), seed, mixArt);
    if (id !== "pl-rue-e" && id !== "pl-rue-f") rows(frontage(id, "right", 8, 8), seed + 13, mixStreet);
  }
  // The riverside atelier row, fronts toward the Thymes walk (right = west of the path).
  rows(frontage('trail/rive-gauche', 'right', 5.5, 8), 127, mixArt);

  // ---- The backyards (rect B) -------------------------------------------------------------------------------------
  const yardMix = ['euro-townhouse-mansard', 'euro-townhouse-tall', 'euro-half-timbered', 'euro-bakery', 'euro-townhouse-tall'];
  const terraces: { south: number; houses: EuroPlacement[] }[] = [];
  const TERRACE_SOUTH = [880, 818, 756, 694, 632, 570];
  TERRACE_SOUTH.forEach((south, t) => {
    const houses = addBuildings(keepClear(
      planStreetRow({ x: -1703, z: south, yaw: PI / 2, length: 52, seed: 200 + t * 13, mix: yardMix }), taken, rects));
    houses.sort((a, b) => b.z - a.z);
    terraces.push({ south, houses });
  });

  const wallProp = (x: number, z: number, yaw: number): void => {
    prop('euro-ivy-wall', x, z, { yaw, solid: { w: 3, d: 0.4, h: 1.6 }, tint: 0x9a5a3c });
  };
  const NOTICES = [
    'Garden closed\nfor reflection.', 'Garden open.\nPlease sit.\nDo not look at the pear.', 'Beware of the boules.\nThe boules are fine.\nBeware of the owner.',
    'Garden closed for lunch\n(since March).', 'Tomatoes: private.\nTomatoes\' opinions: public.', 'Strictly no gnomes.\nExcept ours.',
  ];
  let noticeIdx = 0;
  let laundryDispute: { x: number; z: number } | null = null;
  terraces.forEach((t, ti) => {
    if (t.houses.length === 0) return;
    // Group houses into plots of 12 m or more.
    const plots: { zS: number; zN: number }[] = [];
    let zS = t.houses[0].z + (euroBuilding(t.houses[0].id)!.width / 2) + 0.06;
    let acc = 0;
    t.houses.forEach((h, i) => {
      const w = euroBuilding(h.id)!.width;
      acc += w + 0.12;
      if (acc >= 12.5 || i === t.houses.length - 1) {
        const zN = h.z - w / 2 - 0.06;
        plots.push({ zS, zN });
        zS = zN;
        acc = 0;
      }
    });
    // Dividers (one per boundary) running west from the houses' backs, plus an end wall per plot.
    const dividerAt = (z: number): void => { for (let k = 0; k < 8; k++) wallProp(-1712 - 3.06 * k, z, 0); };
    dividerAt(plots[0].zS);
    plots.forEach((p, pi) => {
      dividerAt(p.zN);
      const span = p.zS - p.zN - 0.3;
      const n = Math.floor(span / 3.06);
      const mid = (p.zS + p.zN) / 2;
      for (let k = 0; k < n; k++) {
        if (n >= 3 && k === Math.floor(n / 2)) continue; // a gate gap in the middle of the end wall
        wallProp(-1736.4, mid + (k - (n - 1) / 2) * 3.06, PI / 2);
      }
      const zc = (p.zS + p.zN) / 2;
      const style = (ti * 3 + pi) % 6;
      const north = p.zN + 0.5, south = p.zS - 0.5;
      switch (style) {
        case 0: // laundry
          prop('euro-washing-line', -1723, zc, { yaw: 0 });
          prop('euro-washing-line', -1728, zc - 2.4, { yaw: 0 });
          prop('euro-water-butt', -1713.5, north + 0.4, { solid: { r: 0.35, h: 1.1 }, tint: 0x4f7a5a });
          prop('euro-geranium-bed', -1717, south - 0.6, { yaw: 0 });
          prop('euro-geranium-bed', -1731, south - 0.6, { yaw: 0, tint: 0xd93636 });
          break;
        case 1: // pergola lunch
          prop('euro-vine-pergola', -1725, zc, { yaw: PI / 2 });
          prop('euro-bistro-set', -1725, zc, { yaw: 0.4, tint: 0x2f64c9 });
          prop('euro-geranium-pot', -1714, zc - 3, { tint: 0xd6459f });
          prop('euro-geranium-pot', -1714, zc + 3, { tint: 0xd93636 });
          prop('euro-box-hedge', -1731, south - 0.4, { yaw: 0 });
          prop('euro-box-hedge', -1731, north + 0.4, { yaw: 0 });
          break;
        case 2: // boules
          prop('euro-boules-court', -1725, zc, { yaw: 0 });
          prop('pl-boule', -1717, zc + 1, { y: 0.02 });
          prop('euro-cafe-chair', -1713.5, zc - 1.8, { yaw: PI / 2 });
          prop('euro-cafe-chair', -1713.5, zc + 1.8, { yaw: PI / 2 });
          prop('euro-topiary-lollipop', -1733, north + 0.6, { solid: { r: 0.3, h: 1.6 } });
          break;
        case 3: // allotment
          for (const [ax, az] of [[-1717, zc - 3.2], [-1717, zc + 3.2], [-1724, zc - 3.2], [-1724, zc + 3.2]] as const) {
            prop('allotment-bed', ax, az); // mowable (E27): no collider
          }
          prop('wheelbarrow', -1730, zc - 1, { yaw: 1.2 });
          prop('pl-marrow', -1730.8, zc + 1.4, { y: 0.02, yaw: 0.6 });
          prop('pl-marrow', -1731.6, zc + 1.8, { y: 0.02, yaw: 2.2 });
          break;
        case 4: // roses and pears
          prop('euro-rose-arch', -1722, zc, { yaw: PI / 2 });
          prop('euro-espalier-pear', -1719, p.zN + 0.5, { yaw: 0 });
          prop('euro-espalier-pear', -1729, p.zS - 0.5, { yaw: PI });
          prop('euro-topiary-spiral', -1714, zc, { solid: { r: 0.4, h: 2.2 } });
          break;
        default: // the quiet one
          prop('euro-bistro-set', -1718, zc + 2, { yaw: 2.2, tint: 0xd9a066 });
          prop('euro-water-butt', -1731, zc - 2.5, { solid: { r: 0.35, h: 1.1 } });
          prop('euro-geranium-bed', -1726, north + 0.7, { yaw: 0, tint: 0xff9a3c });
          prop('euro-topiary-lollipop', -1713.5, south - 0.6, { solid: { r: 0.3, h: 1.6 } });
          break;
      }
      // A notice on the lane side of the end wall (facing west), one per plot.
      sign('menu', NOTICES[noticeIdx++ % NOTICES.length], -1738.2, zc, -PI / 2);
    });
    // The laundry dispute: the north-end divider of the fourth terrace's first plot (the lane side faces north).
    if (ti === 3) {
      const z = plots[0].zN;
      laundryDispute = { x: -1722, z };
    }
  });

  const dispute = laundryDispute as { x: number; z: number } | null;
  if (dispute) {
    const { x, z } = dispute;
    prop('euro-washing-line', x, z - 1.1, { yaw: 0 });
    prop('euro-washing-line', x + 1.2, z + 1.1, { yaw: 0 });
    prop('euro-washing-line', x + 0.5, z, { rot: [0, 0.9, 0], y: 1.0 });
    prop('ladder', x - 2.5, z - 0.7, { rot: [0.3, 0, 0] });
    prop('pl-bread-basket', x - 0.5, z - 1.9, { yaw: 0.5 });
    prop('euro-cafe-chair', x + 3.4, z - 1.4, { yaw: PI });
    plan.vignettes.push({
      id: 'pl-lb-laundry-dispute', name: 'The laundry dispute', x, z,
      story: 'Two washing lines, one per side, have been strung across the same ivy wall and crossed over at the middle. A ladder and a basket of pegs show both neighbours tried to fix it, and neither will go first.',
    });
    plan.residents.push({
      id: 'pl-laundry', name: 'Greta Clothespeg', x: x + 1.6, z: z - 2.4, yaw: 0, idle: 'hands-on-hips',
      look: { hat: 0xd6459f, shirt: 0xf3d6cf, pants: 0x4a4f57, beard: null, dress: true, hair: { color: 0x8a5a2b, style: 'pigtails' } },
      bubble: 'That is MY sock on THEIR line. I have measured. Twice.',
    });
  }

  // The back lane, between the end walls and the orchard: lamps and a lane sign, camera spot (-1740, 600) kept clear.
  for (let z = 430; z <= 890; z += 28) {
    if (Math.hypot(z - 600, 0) < 6) continue;
    prop('euro-lamp-post', -1744.5, z, { solid: { r: 0.2, h: 4.2 } });
  }
  sign('street', 'Back Lane\n(not the front one)', -1740, 560, 0);
  sign('street', 'Orchard Way\n(one tree, so far)', -1752, 840, 0);
  // The orchard strip down to the world fence (x -1795): plane trees and communal beds, leaving the lane open.
  for (let z = 440; z <= 890; z += 13) {
    const j = (Math.sin(z * 12.9898) * 43758.5453) % 1;
    const x = -1756 - Math.abs(j) * 20;
    if (!free(x, z, 1)) continue;
    prop('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } });
    if (z % 26 === 0) prop('allotment-bed', -1770.5, z + 4); // mowable (E27): no collider
  }
  for (let z = 460; z <= 880; z += 52) {
    prop('euro-bistro-set', -1750, z + 6, { yaw: 1.3 });
    prop('pl-newspaper', -1748.6, z + 5.4, { y: 0.03, yaw: 0.7 });
  }

  // ---- Radio Adagio (block x -1686..-1638, z -150..-50) -----------------------------------------------------------
  pave(-1696, -1678, -118, -82); // forecourt (x -1696 .. -1678; the apron starts at -1678)
  pave(-1696, -1678, -82, -52);
  // The door spot (-1680, -100) stays clear: no props within x -1684..-1676, z -104..-96.
  prop('pl-horn-speaker', -1684, -106, { solid: { r: 0.3, h: 4 } });
  prop('pl-cello', -1690.5, -113, { yaw: 1.1 });
  prop('pl-cello', -1689.2, -110.6, { yaw: 1.4 });
  prop('pl-music-stand', -1691.5, -108.5, { yaw: -PI / 2 });
  prop('pl-music-stand', -1689.5, -115.5, { yaw: -PI / 2 + 0.3 });
  prop('euro-cafe-chair', -1688, -90, { yaw: PI / 2 });
  prop('euro-cafe-chair', -1688, -88, { yaw: PI / 2 });
  prop('pl-cello', -1686.5, -89, { yaw: PI / 2 + 0.2 });
  prop('euro-flower-trough', -1682, -112, { yaw: 0, solid: { w: 1.6, d: 0.5, h: 0.6 } });
  prop('euro-flower-trough', -1682, -88, { yaw: PI, solid: { w: 1.6, d: 0.5, h: 0.6 } });
  prop('euro-lamp-post', -1692.5, -118, { solid: { r: 0.2, h: 4.2 } });
  prop('euro-lamp-post', -1692.5, -82, { solid: { r: 0.2, h: 4.2 } });
  for (const z of [-60, -66, -72]) prop('euro-bike-rack', -1692, z, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 1 } });
  // The hall: front wall centre and the signs on it.
  {
    const [fx, fz] = local(-1668, -100, -PI / 2, 0, 7.05);
    sign('banner', 'RADIO ADAGIO 96.1', fx, fz, -PI / 2, { y: 3.9, w: 3, h: 0.6 });
    sign('banner', 'RADIO ADAGIO 96.1 — Now broadcasting: silence (scheduled)', fx, fz + 0.001, -PI / 2, { y: 10.6, w: 9, h: 0.9 });
    sign('plaque', 'ON AIR\n(slowly)', fx, fz - 4.5, -PI / 2, { y: 2.4, w: 1.4, h: 0.6 });
  }
  sign('poster', 'OPERA HALL TONIGHT\nThe Fifth Symphony,\nvery slowly\n(Act 1 of 3. Of 3.)', -1693, -123, -PI / 2);
  sign('poster', 'CONCERT SUNDAY\nThe Overture to an Overture\nBring a cushion\nand a day', -1693, -77, -PI / 2);
  sign('menu', 'FOYER BAR\nInterval snacks:\ncrackers (loud)\ncrackers (quiet)', -1691, -96, -PI / 2);
  // Stage door (hall's north wall at z -108).
  prop('pl-cello', -1667.4, -109.5, { rot: [0.25, 0, 0], y: 0 });
  prop('pl-music-stand', -1664.5, -110.5, { yaw: PI });
  prop('pl-music-stand', -1662.2, -111.4, { rot: [0, 0.8, PI / 2], y: 0.18 });
  prop('pl-queue-post', -1669, -114, { yaw: -PI / 2 });
  prop('pl-queue-post', -1669, -115.5, { yaw: -PI / 2 });
  prop('pl-queue-post', -1669, -117, { yaw: -PI / 2 });
  prop('pl-queue-post', -1669, -118.5, { yaw: -PI / 2 });
  sign('plaque', 'Stage door.\nPlease queue in the other direction.', -1668, -108.05, PI, { y: 2.3, w: 2.8, h: 0.8 });
  plan.vignettes.push({
    id: 'pl-lb-stage-door', name: 'The Opera stage door', x: -1667, z: -112,
    story: 'A cello case leans on the stage door, a music stand stands guard and a second one has fallen over, and the queue posts line up pointing away from the door: the orchestra is queueing the polite way round.',
  });
  // Easel by the river (the artist left for lunch some days ago).
  prop('pl-easel', -1640.5, -92, { yaw: PI / 2 });
  prop('euro-cafe-chair', -1641.8, -89.2, { rot: [0, 0.7, PI / 2], y: 0.25 });
  prop('pl-croissant', -1639.2, -94.4, { y: 0.03, yaw: 0.8 });
  prop('bird-pigeon', -1638.2, -94.9, { yaw: 3.4 });
  prop('pl-espresso-cup', -1642.6, -92.6, { y: 0.02 });
  prop('red-book', -1642.6, -95, { y: 0.02, yaw: 0.4 });
  sign('poster', 'ARTIST AT LUNCH\n(back some time\nbefore the light changes)', -1639, -88, PI / 2);
  plan.vignettes.push({
    id: 'pl-lb-abandoned-easel', name: 'The abandoned easel', x: -1640.5, z: -92,
    story: 'An easel faces the river with the painting turned away. The artist\'s chair is knocked over, the espresso is cold and a pigeon has taken the croissant and is judging the brushwork.',
  });
  plan.residents.push({
    id: 'pl-poet', name: 'Sartorius Gloom', x: -1642.5, z: -99, yaw: PI / 2, idle: 'think',
    look: { hat: 0x222222, shirt: 0x222222, pants: 0x222222, boots: 0x222222, beard: 0x444444, skin: 0xf8dcc8, glasses: true },
    bubble: 'I wrote a poem about the river. It is very long. The river has not read it either.',
  });
  plan.residents.push({
    id: 'pl-maestro', name: 'Maestro Ottavio Lento', x: -1681.5, z: -91.5, yaw: -PI / 2, idle: 'idle-pompous',
    look: { hat: 0x2a1a3a, shirt: 0x6a1b3a, pants: 0x222222, beard: 0xdddddd, skin: 0xf1c27d, glasses: true },
    bubble: 'You may approach. Slowly. Adagio.',
  });
  // Lay-by opposite the hall (west pavement): benches facing the hall, the lost beret, the poet's board.
  prop('park-bench', -1713, -112, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 0.9 } });
  prop('park-bench', -1713, -88, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 0.9 } });
  prop('euro-plane-tree', -1721, -118, { solid: { r: 0.45, h: 9 } });
  prop('euro-plane-tree', -1721, -82, { solid: { r: 0.45, h: 9 } });
  prop('pl-newspaper', -1711.2, -113.2, { y: 0.4, rot: [-PI / 2, 0, 0.2] });
  sign('poster', 'LOST: one beret.\nIf found, do not return.\nIt was dreadful.', -1706.5, -121, PI / 2);
  sign('poster', 'DO NOT FEED\nTHE POET.\nHe is on a diet\nof irony.', -1706.5, -79, PI / 2);

  // ---- The Boulevard: lamps, plane trees, benches ---------------------------------------------------------------
  for (let z = -410, k = 0; z <= 370; z += 17, k++) {
    for (const side of [-1, 1]) {
      const x = bx(z) + side * 4.5 + (side < 0 ? -0.2 : 0.2);
      if (!free(x, z, 0.5) || roadClearance(x, z) < 1.2) continue;
      if (k % 2 === 0) prop('euro-lamp-post', x, z, { solid: { r: 0.2, h: 4.2 } });
      else if (k % 3 === 1) prop('euro-plane-tree', x, z, { solid: { r: 0.45, h: 9 } });
      else if (side > 0) prop('euro-bike-rack', x + 0.6, z, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 1 } });
      else prop('euro-flower-trough', x, z, { yaw: PI / 2, solid: { w: 1.6, d: 0.6, h: 0.9 } });
    }
  }
  sign('street', 'Boulevard of Forms\n(Triplicate)', bx(-285) - 5, -285, PI / 2);
  sign('street', 'Boulevard of Forms\n(Triplicate, again)', bx(300) + 5, 300, -PI / 2);
  sign('street', 'Rue Ouest\n(the other west)', -1763, -240, -PI / 2);
  sign('street', 'Pont Neuf\n(newer than Pont Nord. Probably)', -1685, -36, 0);
  sign('street', 'Pont Nord\n(still being finished)', -1685, -304.5, 0);
  sign('street', 'Pont Sud\n(north of the other one)', -1685, 244.5, 0);
  sign('street', 'Rue E\n(it has a name. It is shy)', -1733, -175.6, PI);
  sign('street', 'Rue F\n(Rue E\'s cousin)', -1733, 107.5, 0);
  sign('poster', 'STRIKE TODAY\nAgainst the strike\nscheduled for yesterday', bx(-330) + 5.4, -330, -PI / 2);
  sign('poster', 'POETRY SLAM\nBring your own silence', bx(40) - 5.4, 40, PI / 2);
  sign('menu', 'GALLERY WALK\nStop 1: a chair\nStop 2: the other chair\nStop 3: lunch', bx(-195) + 5.2, -195, -PI / 2);

  // ---- The composer's crisis (a pavement lot on the Boulevard's west side) ---------------------------------------
  prop('gsr-upright-piano', -1709, -249, { yaw: PI / 2, solid: { w: 1.7, d: 0.8, h: 1.3 } });
  prop('stool', -1706.6, -249.4, { rot: [0, 0.3, PI / 2], y: 0.2 });
  prop('pl-music-stand', -1711, -246.6, { rot: [0, 0.7, PI / 2], y: 0.2 });
  for (const [dx, dz, r] of [[-3.2, 0.5, 0.4], [-4.4, -1.4, 1.6], [-2.2, 2.8, 2.5], [-5.6, 0.9, 0.9], [-3.7, -3.1, 2.1], [-1.6, -2.3, 0.2]] as const) {
    prop('pl-newspaper', -1709 + dx + 1.5, -249 + dz, { y: 0.03, yaw: r });
  }
  prop('pl-espresso-cup', -1707.4, -251.3, { y: 0.02 });
  sign('poster', 'COMPOSITION\nIN PROGRESS.\nDo not resolve.', -1713, -243.5, 0);
  plan.vignettes.push({
    id: 'pl-lb-composers-crisis', name: 'The composer\'s crisis', x: -1709, z: -249,
    story: 'An upright piano has been carried out onto the pavement, the stool is on its side, the music stand has been kicked over and the sheet music is crumpled all over the lot. A cold espresso says the finale was nearly finished.',
  });

  // ---- The queue for nothing (first inner block) -------------------------------------------------------------------
  addBuildings(keepClear([{ id: 'euro-post-booth', x: -1722.8, z: -222, yaw: -PI / 2, scale: 1, tint: 0xcfd8e3 }], [], rects));
  for (let i = 0; i < 6; i++) prop('pl-queue-post', -1747 + i * 1.5, -222, { yaw: 0, solid: { r: 0.12, h: 1.1 } });
  sign('plaque', 'WINDOW 1\nQueue for Window 2', -1722.1, -222, -PI / 2, { y: 2.3, w: 1.8, h: 0.5 });
  sign('poster', 'WINDOW 2 IS HERE.\nQueue at Window 1.', -1741.5, -219.5, PI);
  prop('euro-bollard', -1721.4, -224, { solid: { r: 0.15, h: 1 } });
  prop('pl-newspaper', -1727.4, -222, { y: 0.03, yaw: 0.3 });
  plan.vignettes.push({
    id: 'pl-lb-queue-for-nothing', name: 'The queue for nothing', x: -1735, z: -222,
    story: 'Six queue posts lead to a post booth whose own sign sends everybody on to Window 2, which is signposted back to Window 1. The queue has not moved, and the newspaper at the head of it is from last season.',
  });
  plan.residents.push({
    id: 'pl-lb-queuer', name: 'Pascal Waite', x: -1736.4, z: -222.9, yaw: -PI / 2, idle: 'wait-bus',
    look: { hat: 0x6e6e6e, shirt: 0x8a5a2b, pants: 0x444444, beard: 0xc8c8c8, skin: 0xe0ac69 },
    bubble: 'I have been first in the queue since the last strike. Whether it moves is not my department.',
  });

  // The existential picnic (second inner block): two chairs facing a blank (ivy) wall.
  for (const x of [-1737.8, -1734.7, -1731.6]) prop('euro-ivy-wall', x, -122, { yaw: 0, solid: { w: 3, d: 0.4, h: 1.6 }, tint: 0xcfb59a });
  prop('euro-cafe-chair', -1735.4, -119.4, { yaw: PI });
  prop('euro-cafe-chair', -1733.4, -119.4, { yaw: PI });
  prop('bread-loaf', -1734.4, -119.0, { y: 0.02, yaw: 0.4 });
  prop('cheese-wedge', -1734.0, -118.2, { y: 0.02, yaw: 2.4 });
  prop('red-book', -1735.7, -117.6, { y: 0.02, yaw: 0.9 });
  prop('pl-baguette', -1733.1, -117.6, { y: 0.03, yaw: 1.1 });
  sign('menu', 'PICNIC FOR TWO\n(facing the void)\nPlease do not ask them\nhow it is going', -1738.6, -118, PI / 2);
  plan.vignettes.push({
    id: 'pl-lb-existential-picnic', name: 'The existential picnic', x: -1734.5, z: -119,
    story: 'Two chairs sit side by side facing a blank wall, with a loaf, a single cheese, a baguette and a book laid out on the ground between them. Nobody is there, and everything is very calm.',
  });

  // ---- The artists' terrace by the river (a paved square with cafe tables and easels) -----------------------------
  pave(-1682, -1648, 30, 64);
  prop('euro-fountain', -1665, 47, { solid: { r: 2, h: 1 } });
  for (const [x, z, y] of [[-1676, 36, 0.5], [-1654, 58, 3.5], [-1676, 58, 2], [-1654, 36, 1.4]] as const) {
    prop('euro-cafe-table', x, z, { solid: { r: 0.35, h: 0.77 } });
    prop('euro-cafe-chair', x - 0.9, z, { yaw: PI / 2 });
    prop('euro-cafe-chair', x + 0.9, z + 0.2, { yaw: -PI / 2 + y * 0.05 });
    prop('pl-cafe-parasol', x, z, { solid: { r: 0.15, h: 2.4 } });
  }
  prop('pl-easel', -1682, 46, { yaw: PI / 4 });
  prop('pl-easel', -1648, 46, { yaw: -PI / 4 });
  prop('pl-easel', -1665, 63.5, { yaw: PI });
  prop('pl-accordion', -1666.5, 40.5, { y: 0.02, yaw: 0.6 });
  sign('plaque', 'FOUNTAIN OF INDECISION\n(on, off, on, off)', -1665, 44.7, PI, { y: 1.1, w: 2.2, h: 0.5 });
  sign('poster', 'TERRACE OF DOUBT\nOpen all day.\nClosed, on reflection.', -1688.5, 32, PI / 2);

  // ---- The Beetle Market (block x -1755..-1711, z 125..235) and its north annex (z 52..104) ---------------------------
  addBuildings(keepClear([{ id: 'euro-market-hall', x: -1733, z: 215, yaw: PI, scale: 1, tint: 0xe6dcb8, trim: 0x9a5a3c }], [], rects));
  {
    const [hx, hz] = local(-1733, 215, PI, 0, 5.05);
    sign('banner', 'THE BEETLE MARKET\nCovered hall (the beetles are inside)', hx, hz, PI, { y: 4.2, w: 7, h: 0.9 });
  }
  const stall = (x: number, z: number, yaw: number, i: number): void => {
    prop('market-stall', x, z, { yaw, scale: 1.7, solid: { w: 1.6, d: 0.8, h: 1 } });
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    // Goods sit along the stall: lay them out in the stall's own frame (x along the counter, front +z).
    const wrap = (gx: number, gz: number, id: string, o: PropOpts = {}): void => {
      prop(id, x + gx * cos + gz * sin, z - gx * sin + gz * cos, { yaw, ...o });
    };
    const g = i % 5;
    if (g === 0) { wrap(-0.45, 0.05, 'pl-produce-crate', { y: 0.9, scale: 0.7, tint: [0xd93636, 0x8bc34a, 0xff9a3c, 0xa84a00][i % 4] }); wrap(0.45, 0.05, 'pl-produce-crate', { y: 0.9, scale: 0.7, tint: [0xffe066, 0x5cd67a, 0xd6459f, 0xff6b6b][(i + 1) % 4] }); }
    else if (g === 1) { for (let k = 0; k < 3; k++) wrap(-0.4, 0.05, 'pl-cheese-wheel', { y: 0.9 + k * 0.17, scale: 0.8 - k * 0.1 }); wrap(0.5, 0.05, 'cheese-wedge', { y: 0.9 }); }
    else if (g === 2) { wrap(-0.4, 0.05, 'pl-bread-basket', { y: 0.9 }); wrap(0.2, 0.05, 'bread-loaf', { y: 0.9 }); wrap(0.55, 0.1, 'pl-baguette', { y: 0.92 }); }
    else if (g === 3) { wrap(-0.4, 0.05, 'pl-marrow', { y: 0.9 }); wrap(0.1, 0.05, 'pl-marrow', { y: 0.9, yaw: yaw + 1 }); wrap(0.55, 0.05, 'pl-produce-crate', { y: 0.9, scale: 0.6, tint: 0x5cd67a }); }
    else { wrap(0, 0.05, 'red-book', { y: 0.9 }); wrap(0.5, 0.9, 'crate', { scale: 0.6 }); }
  };
  const MARKET_X = [-1751, -1747, -1743, -1739, -1735, -1731, -1727, -1723, -1719, -1715];
  // Main market: two pairs of back-to-back stall rows around two tiled aisles (hall at z 215).
  pave(-1756, -1710, 138, 146);
  pave(-1756, -1710, 162, 170);
  let si = 0;
  for (const [z, yaw] of [[136, 0], [148, PI], [160, 0], [172, PI]] as const) {
    for (const x of MARKET_X) {
      if ((z === 172 || z === 160) && Math.abs(x + 1733) < 3.5) continue;
      stall(x, z, yaw, si++);
    }
  }
  // The gramophone stall: the market's crackling stall radio, in the middle of the back row.
  prop('market-stall', -1733, 170, { yaw: PI, scale: 1.7, solid: { w: 1.6, d: 0.8, h: 1 } });
  prop('pl-gramophone', -1733, 170, { y: 0.9 });
  sign('menu', 'STALL RADIO\nPlays only what it was\nplaying yesterday', -1733, 167.4, 0);
  // Produce piled loose in the open ground between the rows and the hall.
  for (let i = 0; i < 9; i++) {
    const x = -1752 + i * 4.6;
    if (Math.abs(x + 1733) < 6) continue;
    prop('pl-produce-crate', x, 192 + (i % 3) * 1.3, { yaw: i * 0.7, tint: [0xff9a3c, 0x8bc34a, 0xd93636][i % 3], solid: { w: 0.8, d: 0.6, h: 0.5 } });
    if (i % 2) prop('pl-produce-crate', x + 0.4, 192.05 + (i % 3) * 1.3, { y: 0.5, yaw: i, tint: 0xffe066 });
  }
  for (let k = 0; k < 4; k++) prop('pl-cheese-wheel', -1729 + (k % 2) * 0.5, 197 + (k >> 1) * 0.1 + (k > 1 ? 0 : 0), { y: k > 1 ? 0.2 * (k - 1) : 0, scale: 1.2 });
  // The crepe-van parking spot: two bollards and a sign.
  prop('euro-bollard', -1714, 198, { solid: { r: 0.15, h: 1 } });
  prop('euro-bollard', -1714, 203.6, { solid: { r: 0.15, h: 1 } });
  sign('menu', 'CREPE VAN BAY\nVan reserved.\nParking reserved.\nPatience reserved.', -1716.4, 200.8, -PI / 2);
  // Market menus and prices, in the aisles.
  sign('menu', 'Cheese, aged: 12 acorns\nCheese, ageing: 9\nCheese, young and hopeful: 4', -1745, 141, 0);
  sign('menu', 'BREAD (today\'s opinion)\nRound: strong\nLong: stronger\nSliced: we don\'t talk', -1739, 143.5, 0);
  sign('menu', 'PRODUCE\nMarrows: large\nMarrows: larger\nMarrows: do not ask', -1725, 141, 0);
  sign('menu', 'PEARS (espaliered):\nlook, do not touch.\n6 acorns to look', -1722, 165, 0);
  sign('menu', 'FRESH EGGS\nLaid this week,\nmore or less', -1749, 165, 0);
  sign('poster', 'MARKET RULES\n1. Queue to browse.\n2. Queue to buy.\n3. Queue to leave.', -1755.4, 155, PI / 2);
  // Tables for the tasting of nothing, and a bench to wait in.
  prop('park-bench', -1752, 186, { yaw: PI, solid: { w: 1.8, d: 0.6, h: 0.9 } });
  prop('wheelbarrow', -1747, 188, { yaw: 0.9 });
  prop('euro-plane-tree', -1754, 205, { solid: { r: 0.45, h: 9 } });
  prop('euro-plane-tree', -1712.4, 228, { solid: { r: 0.45, h: 9 } });

  // North annex: stalls facing south toward the camera spot (-1733, 120), a central avenue ending at a fountain.
  pave(-1738, -1728, 56, 104, 'euro-cobble-tile');
  let sj = 100;
  for (const z of [100, 84, 68]) {
    for (const x of [-1751, -1747, -1743, -1739, -1727, -1723, -1719, -1715]) {
      if (z === 100 && x === -1747) continue; // the cheese standoff stall is hand-placed below
      stall(x, z, 0, sj++);
    }
  }
  prop('euro-fountain', -1733, 58, { solid: { r: 2, h: 1 } });
  prop('bird-pigeon', -1733.6, 56.6, { y: 1.05, yaw: 0.4 });
  sign('plaque', 'FOUNTAIN OF PLENTY\n(of questions)', -1733, 61.1, 0, { y: 0.7, w: 2, h: 0.45 });
  for (const z of [64, 80, 96]) {
    prop('euro-lamp-post', -1736.6, z, { solid: { r: 0.2, h: 4.2 } });
    prop('euro-lamp-post', -1729.4, z, { solid: { r: 0.2, h: 4.2 } });
  }
  sign('poster', 'WHICH IS OLDER?', -1750.4, 103, 0);
  sign('poster', 'MARKET TODAY\nAlso tomorrow.\nAlso yesterday.', -1727.5, 108.6, 0);
  // The cheese standoff.
  prop('market-stall', -1747, 100, { yaw: 0, scale: 1.7, solid: { w: 1.6, d: 0.8, h: 1 } });
  prop('pl-cheese-wheel', -1747.55, 100.05, { y: 0.9, scale: 1.3, tint: 0xf2c230 });
  prop('pl-cheese-wheel', -1746.45, 100.05, { y: 0.9, scale: 1.3, tint: 0xe6c27a });
  prop('stool', -1745.2, 102.4, { yaw: 0.4 });
  prop('pl-cheese-wheel', -1748.2, 104.2, { yaw: 0.2, scale: 0.9 });
  sign('menu', 'This one: 40 years.\nThat one: 41 years.\nThe matter is closed.\n(It is not closed.)', -1744.2, 104.4, 0);
  plan.vignettes.push({
    id: 'pl-lb-cheese-standoff', name: 'The cheese standoff', x: -1747, z: 101,
    story: 'Two cheese wheels sit on one stall, each looking older than the other. A poster asks which is older and a stool stands in front of them for judging, with no magnifying glass in sight.',
  });
  plan.residents.push({
    id: 'pl-cheesemonger', name: 'Roquette Fromage', x: -1745.2, z: 99.1, yaw: 0, idle: 'vendor-call',
    look: { hat: 0xf4f4f4, shirt: 0xf2c230, pants: 0x444444, beard: null, skin: 0xe0ac69, dress: true, hair: { color: 0x5d4037, style: 'pigtails' } },
    bubble: 'Both are very old. Both are my favourite. Do not ask which. Buy both.',
  });

  // ---- The riverside walk and Thymes side: benches, strays and the poet's rail -------------------------------------
  for (let z = -380; z <= 340; z += 38) {
    const x = -1640.6;
    if (!free(x, z, 0.8) || roadClearance(x, z) < 2) continue;
    prop('park-bench', x, z, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 0.9 } });
    if (z % 76 === 0) prop('bird-pigeon', x + 0.3, z + 1.2, { yaw: PI / 2 });
  }

  // ---- Shopfront plaques over doors (every kit building with an apron-bearing front) -------------------------------
  const seen = new Map<string, number>();
  for (const b of plan.buildings) {
    const texts = PLAQUES[b.id];
    if (!texts) continue;
    const bd = euroBuilding(b.id)!;
    const n = seen.get(b.id) ?? 0;
    seen.set(b.id, n + 1);
    if (n % 16 !== 4) continue; // one in sixteen, so the street is not all lettering
    const [x, z] = local(b.x, b.z, b.yaw, 0, bd.depth / 2 + 0.05);
    sign('plaque', texts[Math.floor(n / 16) % texts.length], x, z, b.yaw, { y: 3.8, w: 2.6, h: 0.7 });
  }

  return plan;
}
