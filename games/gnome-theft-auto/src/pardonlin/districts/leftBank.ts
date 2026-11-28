// Pardonlin district plan (E30): the Left Bank: Radio Adagio, the Beetle Market, the backyards. Pure data (../plan.ts).
// The arty, poorer, louder west bank. Layout, west to east: the backyards (rect B, far south), rue-ouest, the inner
// blocks (the Beetle Market, pocket gardens), the Boulevard (7 m), the Radio Adagio block and the Thymes walk.
import { euroBuilding } from '../../eurokit/catalog';
import { planStreetRow, type EuroPlacement } from '../../eurokit/street';
import { districtById, footprintsOverlap, frontage, roadClearance, type Footprint, type RowStart } from '../layout';
import type { GroundPatch } from '../groundPlan';
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
  /** Laid ground (FX09): a rectangle of paving. Plain patches never overlap each other; an accent sits on top of one. */
  const pave = (kind: GroundPatch['kind'], x0: number, x1: number, z0: number, z1: number, accent = false): void => {
    plan.ground.push({ kind, accent, rect: { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 } });
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
  // The forecourt is paved from the Boulevard's kerb (its pavement runs out to x -1690.4 here and draws over the patch's
  // west edge) to the hall's apron, and along the whole block from the Pont Neuf's pavement up to Rue E's end.
  // One floor of setts: the forecourt, the yards either side of the hall and behind it (to the lawn at x -1648).
  pave('setts', -1698, -1648, -153, -40);
  // A flagstone carpet from the Boulevard to the steps, and a flagged edge along the block's north end.
  pave('flags', -1690, -1677, -104, -96, true);
  pave('flags', -1690, -1648, -153.6, -152.8, true);
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
    sign('banner', 'RADIO ADAGIO 96.1', fx, fz, -PI / 2, { y: 3.9, w: 4.6, h: 0.95 });
    sign('banner', 'RADIO ADAGIO 96.1', fx, fz + 0.001, -PI / 2, { y: 9.8, w: 8, h: 1.5 });
    sign('plaque', 'ON AIR\n(slowly)', fx, fz - 4.5, -PI / 2, { y: 2.4, w: 1.4, h: 0.6 });
  }
  sign('poster', 'OPERA HALL TONIGHT\nThe Fifth Symphony,\nvery slowly\n(Act 1 of 3. Of 3.)', -1693, -123, -PI / 2);
  sign('poster', 'RADIO ADAGIO 96.1\nNow broadcasting:\nsilence\n(scheduled)', -1693.5, -104, -PI / 2);
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
  // The stage door itself (a real door in the hall's north wall, left of the plaque) and the cellist waiting at it.
  prop('panelled-door', -1672.2, -108.02, { yaw: PI, tint: 0x2c2a38, trim: 0xd9cfae });
  plan.residents.push({
    id: 'pl-lb-stage-cellist', name: 'Basile Cordes', x: -1671.4, z: -111.4, yaw: 0, idle: 'wait-bus',
    look: { hat: 0x2a2a2a, shirt: 0x1f1f26, pants: 0x1f1f26, boots: 0x222222, beard: 0x9a9a9a, skin: 0xe9b98a, glasses: true },
    bubble: 'I am early. The door is late. We have agreed not to discuss who is more on time.',
  });
  // The ticket kiosk and its queue of one (the cellist is first, and last).
  prop('pl-ticket-kiosk', -1683, -131, { yaw: -PI / 2, tint: 0x2e5a45, trim: 0xe8dfc4, solid: { w: 1.5, d: 1.3, h: 2.7 } });
  sign('plaque', 'TICKETS', -1683.57, -131, -PI / 2, { y: 1.95, w: 1.1, h: 0.27 });
  for (const z of [-129.2, -132.8]) {
    for (let k = 0; k < 4; k++) prop('pl-queue-post', -1685.4 - k * 1.5, z, { yaw: PI });
  }
  sign('menu', 'QUEUE HERE.\nThe queue is one cellist.\nPlease wait behind him.', -1692.2, -131, -PI / 2);
  prop('pl-cello', -1685.9, -129.9, { yaw: 1.7 });
  prop('euro-flower-trough', -1682.2, -135.2, { yaw: 0, solid: { w: 1.6, d: 0.5, h: 0.6 }, tint: 0xd6459f });
  sign('poster', 'THE FIFTH\nAct 1 of 3.\nOf 3.\nEntry by queue only', -1684.4, -127.4, -PI / 2);
  sign('poster', 'TONIGHT, SLOWLY\nBeethoven (we think)\nBring a cushion\nand a day', -1684.4, -134.6, -PI / 2);
  plan.vignettes.push({
    id: 'pl-lb-queue-of-one', name: 'The queue of one', x: -1686, z: -131,
    story: 'A ticket kiosk with a barred window has a rope queue for forty gnomes and exactly one cellist in it, who has been first since the matinee. The chalkboard asks anyone new to wait behind him, and nobody has dared pass him to see whether the window is open.',
  });
  plan.residents.push({
    id: 'pl-lb-queue-cellist', name: 'Hector Fermata', x: -1686.4, z: -131, yaw: PI / 2, idle: 'wait-bus',
    look: { hat: 0x6a1b3a, shirt: 0xd8cfb8, pants: 0x222222, beard: 0xbbbbbb, skin: 0xf1c27d },
    bubble: 'I am the queue. Please wait behind me. The window opens when I have finished being first.',
  });
  // The Maestro's scooter, parked in the stage yard (he does not park it. It stops, and he steps off).
  prop('pl-scooter', -1657.6, -115.4, { yaw: -PI / 2 + 0.32, scale: 1.1, tint: 0x7a1f3d, solid: { w: 0.7, d: 1.6, h: 1 } });
  prop('pl-music-stand', -1659.6, -119.8, { yaw: 0.4 });
  prop('pl-espresso-cup', -1659.6, -117.4, { y: 0.02 });
  sign('poster', 'RESERVED FOR\nTHE MAESTRO.\nDo not touch.\nIt is resting.', -1654.4, -113, -PI / 2);
  plan.vignettes.push({
    id: 'pl-lb-maestro-scooter', name: 'The Maestro\'s scooter', x: -1658, z: -116,
    story: 'The Maestro\'s scooter stands in the stage yard with a rolled-up score on its rack and a notice that it is resting. A cold espresso and a music stand wait beside it, in case the scooter wants to conduct.',
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
  // Lay-by opposite the hall (west pavement): flagstones out to the Boulevard's pavement, benches facing the hall, the lost beret, the poet's board.
  pave('flags', -1730, -1706, -128, -72);
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
  pave('flags', -1682, -1648, 30, 64);
  plan.ground.push({ kind: 'setts', accent: true, circle: { x: -1665, z: 47, r: 4.4, r0: 2.4 } });
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

  // ---- The Beetle Market (the square x -1760..-1707, z 119..242, and its north annex z 51..102) -------------------
  // Cobbles under all of it, with a setts spine down each aisle (the main one jogs 2 m east at z 160, a dog-leg).
  pave('cobble', -1760, -1707, 119, 242);
  pave('cobble', -1757, -1708, 51, 102);
  pave('setts', -1735.2, -1730.8, 120.5, 158.6, true);
  pave('setts', -1733.2, -1728.8, 161.4, 207, true);
  pave('setts', -1735.2, -1730.8, 63, 100, true);
  addBuildings(keepClear([{ id: 'euro-market-hall', x: -1733, z: 215, yaw: PI, scale: 1, tint: 0xe6dcb8, trim: 0x9a5a3c }], [], rects));
  {
    const [hx, hz] = local(-1733, 215, PI, 0, 5.05);
    sign('banner', 'THE BEETLE MARKET\nCovered hall (the beetles are inside)', hx, hz, PI, { y: 4.2, w: 7, h: 0.9 });
  }

  let mseed = 20271;
  const rnd = (): number => { mseed = (mseed * 1664525 + 1013904223) >>> 0; return mseed / 4294967296; };
  const STRIPES = [0xc8352f, 0x3466b8, 0xf0c63a, 0x4f9a3c, 0xe58fb0, 0x7d4bb0, 0xe8822e, 0x2fa8a0, 0xa83232, 0x2c4f9a];
  type Trade = 'beetles' | 'cheese' | 'bric' | 'books' | 'records' | 'bread' | 'prints' | 'hats' | 'produce' | 'radio';
  const TRADE_ORDER: readonly Trade[] = ['beetles', 'cheese', 'bric', 'records', 'books', 'produce', 'hats', 'bread', 'prints', 'beetles', 'bric', 'cheese'];
  const TRADE_SIGN: Record<Trade, string> = {
    beetles: 'BEETLES\n(live, mostly)', cheese: 'CHEESE\n(aged by argument)', bric: 'BRIC-A-BRAC\n(the brac is extra)',
    books: 'BOOKS\n(read once, gently)', records: 'RECORDS\n(all the same one)', bread: 'BREAD\n(Tuesday\'s opinion)',
    prints: 'PRINTS\n(of this market)', hats: 'OLD HATS\n(heads extra)', produce: 'PRODUCE\n(it was a marrow)', radio: 'STALL RADIO\n(Adagio. Always.)',
  };
  type Spot = { x: number; z: number; yaw: number; s: number; tint: number; trade: Trade };
  type Look = DistrictPlan['residents'][number]['look'];
  type Idle = DistrictPlan['residents'][number]['idle'];
  const stalls: Spot[] = [];
  const alleys: { x: number; z: number }[] = []; // the side alleys between clusters of stalls
  let tradeIx = 0, tintIx = 0;
  /** One column of stalls down an aisle: clusters of touching stalls (a trade each), a side alley between them. */
  const column = (
    xAt: (z: number) => number, face: 1 | -1, z0: number, z1: number,
    gaps: readonly (readonly [number, number])[], sizes: readonly number[], tradeStart: number,
  ): Spot[] => {
    const out: Spot[] = [];
    tradeIx = tradeStart;
    let z = z0, k = 0, ci = 0, size = sizes[0], trade = TRADE_ORDER[tradeIx++ % TRADE_ORDER.length];
    while (z < z1) {
      const gap = gaps.find(([a, b]) => z > a - 1 && z < b);
      if (gap) { z = gap[1] + 1.4; k = 0; size = sizes[++ci % sizes.length]; trade = TRADE_ORDER[tradeIx++ % TRADE_ORDER.length]; continue; }
      const s = 1.08 + rnd() * 0.14;
      const yaw = (face * PI) / 2 + (rnd() - 0.5) * 0.26;
      const x = xAt(z) + (rnd() - 0.5) * 0.5 + (rnd() < 0.22 ? face * 0.45 : 0);
      tintIx += 1 + Math.floor(rnd() * 3);
      out.push({ x, z, yaw, s, tint: STRIPES[tintIx % STRIPES.length], trade });
      k++;
      z += 1.9 * s + 0.3 + rnd() * 0.25;
      if (k >= size) {
        const alley = 3.0 + rnd() * 1.3;
        alleys.push({ x: xAt(z), z: z - 0.5 + alley / 2 });
        z += alley; k = 0; size = sizes[++ci % sizes.length]; trade = TRADE_ORDER[tradeIx++ % TRADE_ORDER.length];
      }
    }
    stalls.push(...out);
    return out;
  };
  // The main aisle: columns at +-3.2 m from its centre (x -1733, jogging to -1731 south of z 160). The west column leaves
  // a side alley open at z 142..156 (the market's west door), both leave a crossing at z 156..164.
  const westMain = column((z) => (z < 160 ? -1736.3 : -1734.3), 1, 125, 199, [[143, 167]], [3, 3, 2, 3], 0);
  const eastMain = column((z) => (z < 160 ? -1729.7 : -1727.7), -1, 126, 199, [[157, 164]], [2, 3, 2, 3], 1);
  // The annex avenue: columns at +-3.2 m from x -1733, up to the fountain.
  column(() => -1736.3, 1, 68, 99, [], [2, 3], 5);
  column(() => -1729.7, -1, 69, 99, [], [3, 2], 8);

  /** A stall's own frame: world position of a point (gx along the counter, gz from its middle toward the front). */
  const frameOf = (sp: { x: number; z: number; yaw: number; s: number }) => {
    const sin = Math.sin(sp.yaw), cos = Math.cos(sp.yaw);
    const at = (gx: number, gz: number): [number, number] => [sp.x + (gx * cos + gz * sin) * sp.s, sp.z + (-gx * sin + gz * cos) * sp.s];
    const put = (id: string, gx: number, gz: number, o: PropOpts = {}): void => {
      const [wx, wz] = at(gx, gz);
      prop(id, wx, wz, { yaw: sp.yaw, ...o, scale: (o.scale ?? 1) * sp.s, ...(o.y !== undefined ? { y: o.y * sp.s } : {}) });
    };
    return { at, put };
  };
  const TOP = 0.87; // counter top height at stall scale 1
  const dealStall = (sp: Spot, i: number): void => {
    prop('pl-stall-canopy', sp.x, sp.z, { yaw: sp.yaw, scale: sp.s, tint: sp.tint, solid: { w: 1.6 * sp.s, d: 1.3 * sp.s, h: 1.4 } });
    const { at, put } = frameOf(sp);
    const [px, pz] = at(0, 0.64);
    sign('plaque', TRADE_SIGN[sp.trade], px, pz, sp.yaw, { y: 0.5 * sp.s, w: 1.3 * sp.s, h: 0.42 * sp.s });
    const v = i % 3;
    switch (sp.trade) {
      case 'cheese':
        put('pl-cheese-wheel', -0.42, 0.3, { y: TOP, scale: 1.0 + v * 0.1, tint: [0xa8741d, 0x8a5a2b, 0xb98a3a][v] });
        put('pl-cheese-wheel', 0.12, 0.3, { y: TOP, scale: 0.7, tint: 0xd9a066, yaw: sp.yaw + 0.5 });
        put('cheese-wedge', 0.5, 0.4, { y: TOP, yaw: sp.yaw + 0.3 });
        put('cheese-wedge', 0.62, 0.18, { y: TOP, yaw: sp.yaw - 0.8, scale: 0.8 });
        break;
      case 'beetles':
        put('pl-beetle-jar', -0.15, 0.3, { y: TOP, scale: 1.45 });
        put('pl-beetle-jar', 0.5, 0.35, { y: TOP, scale: 0.9, yaw: sp.yaw - 0.35 });
        break;
      case 'bric':
        put('pl-bric-a-brac-pile', 0, 0.3, { y: TOP, scale: 1.35, tint: [0xa65cff, 0xe0245e, 0x2fd07a][v] });
        put('stool', 1.0, 0.95, { yaw: sp.yaw + 0.5 });
        break;
      case 'books':
        put('pl-book-pile', -0.35, 0.3, { y: TOP, scale: 1.6 });
        put('pl-book-pile', 0.4, 0.28, { y: TOP, scale: 1.3, yaw: sp.yaw + PI + 0.4 });
        break;
      case 'records':
        put('pl-record-crate', -0.4, 0.3, { y: TOP, scale: 1.5 });
        put('pl-record-crate', 0.22, 0.3, { y: TOP, scale: 1.5, yaw: sp.yaw + 0.2 });
        put('pl-record-crate', 0.7, 0.9, { scale: 1.5, yaw: sp.yaw - 0.4 });
        break;
      case 'bread':
        put('pl-bread-basket', -0.42, 0.3, { y: TOP, scale: 1.2 });
        put('bread-loaf', 0.1, 0.3, { y: TOP });
        put('pl-baguette', 0.55, 0.36, { y: TOP + 0.02, yaw: sp.yaw + 0.3 });
        put('pl-baguette', 0.6, 0.2, { y: TOP + 0.02, yaw: sp.yaw - 0.15 });
        break;
      case 'prints':
        put('pl-prints-rack', 0, 0.38, { yaw: sp.yaw + 0.04 });
        put('pl-prints-rack', -1.25, 0.9, { yaw: sp.yaw + 0.5, scale: 0.8 });
        break;
      case 'hats':
        put('pl-hat-stand', -0.5, 0.35, { yaw: sp.yaw + 0.3, scale: 0.85 });
        put('pl-hat-stand', 0.5, 0.4, { yaw: sp.yaw - 0.5, scale: 0.85 });
        break;
      case 'produce':
        put('pl-produce-crate', -0.42, 0.3, { y: TOP, scale: 1.0, tint: [0xd93636, 0x8bc34a, 0xff9a3c][v] });
        put('pl-produce-crate', 0.18, 0.3, { y: TOP, scale: 1.0, tint: [0xffe066, 0x5cd67a, 0xd6459f][v] });
        put('pl-marrow', 0.62, 0.35, { y: TOP, yaw: sp.yaw + 0.5 });
        put('pl-produce-crate', 1.05, 0.95, { scale: 1.1, tint: 0xff9a3c, yaw: sp.yaw + 0.3 });
        break;
      case 'radio':
        put('pl-gramophone', 0, 0.3, { y: TOP });
        break;
    }
  };
  // The stall radio keeps its post at the middle of the market: the east stall nearest z 170 (speakers.ts has the sound at -1733, 170).
  const radio = eastMain.reduce((a, b) => (Math.abs(b.z - 170) < Math.abs(a.z - 170) ? b : a));
  radio.trade = 'radio';
  // Hand-picked trades where the camera looks: the first stalls south of Rue F.
  westMain[0].trade = 'beetles'; westMain[1].trade = 'beetles'; westMain[2].trade = 'books';
  eastMain[0].trade = 'cheese'; eastMain[1].trade = 'cheese'; eastMain[2].trade = 'cheese';
  stalls.forEach(dealStall);
  // Bunting across the aisles, hung from the canopy fronts of most pairs of facing stalls.
  let pairNo = 0;
  for (const w of stalls.filter((o) => Math.sin(o.yaw) > 0)) {
    const e = stalls.find((o) => Math.sin(o.yaw) < 0 && Math.abs(o.z - w.z) < 1.1 && o.x - w.x > 4 && o.x - w.x < 9);
    if (!e || pairNo++ % 3 === 2) continue;
    const [ax, az] = frameOf(w).at(0, 0.74);
    const [bx2, bz2] = frameOf(e).at(0, 0.74);
    const span = Math.hypot(bx2 - ax, bz2 - az);
    const sc = span / 2.9;
    const top = (2.12 * (w.s + e.s)) / 2;
    prop('pl-bunting', (ax + bx2) / 2, (az + bz2) / 2, { yaw: Math.atan2(-(bz2 - az), bx2 - ax), scale: sc, y: top - 0.45 * sc, tint: STRIPES[(pairNo * 3) % STRIPES.length] });
  }
  const nth = (trade: Trade, n: number, from: readonly Spot[] = stalls): Spot => from.filter((p) => p.trade === trade)[n] ?? from[0];
  // Chalkboard prices beside the stalls they are about (in the aisle, off the stalls' front corner).
  const board = (sp: Spot, text: string, gx: number): void => {
    const [bx2, bz2] = frameOf(sp).at(gx, 1.5);
    sign('menu', text, bx2, bz2, sp.yaw);
  };
  board(nth('cheese', 4), 'Cheese, aged: 12 acorns\nCheese, ageing: 9\nCheese, young and hopeful: 4', 1.25);
  board(nth('bread', 0), 'BREAD (today\'s opinion)\nRound: strong\nLong: stronger\nSliced: we don\'t talk', 1.25);
  board(nth('produce', 0), 'PRODUCE\nMarrows: large\nMarrows: larger\nMarrows: do not ask', -1.25);
  board(nth('produce', 1), 'PEARS (espaliered):\nlook, do not touch.\n6 acorns to look', 1.25);
  board(nth('beetles', 3), 'FRESH BEETLES\nCaught this week,\nmore or less', -1.25);
  {
    const [rx, rz] = frameOf(radio).at(1.2, 1.5);
    sign('menu', 'STALL RADIO\nPlays only what it was\nplaying yesterday', rx, rz, radio.yaw);
  }
  sign('poster', 'MARKET RULES\n1. Queue to browse.\n2. Queue to buy.\n3. Queue to leave.', -1755.4, 134, PI / 2);

  // Side alleys: a lamp post on every other one, a hand cart or a stack of crates on the rest.
  alleys.forEach((a, i) => {
    if (Math.abs(a.z - 160) < 6 || a.z > 200) return;
    const east = a.x > -1733;
    if (i % 2 === 0) prop('euro-lamp-post', a.x + (east ? -0.4 : 0.4), a.z, { solid: { r: 0.2, h: 4.2 } });
    else if (i % 4 === 1) prop('pl-hand-cart', a.x + (east ? 0.3 : -0.3), a.z, { yaw: (east ? -PI / 2 : PI / 2) + 0.3 * (i % 3 - 1), tint: [0xff9a3c, 0x8bc34a, 0xd93636][i % 3], solid: { w: 1.0, d: 1.5, h: 0.8 } });
    else {
      prop('crate', a.x, a.z, { yaw: i * 0.9, scale: 0.9, solid: { r: 0.45, h: 0.8 } });
      prop('crate', a.x + 0.15, a.z + 0.05, { y: 0.75, yaw: i * 1.7, scale: 0.7 });
    }
  });
  // The tasting of nothing, in the west door's alley: a table, two chairs, a parasol and three empty cups.
  prop('euro-cafe-table', -1744.5, 156, { solid: { r: 0.35, h: 0.77 } });
  prop('euro-cafe-chair', -1745.6, 156.2, { yaw: PI / 2 });
  prop('euro-cafe-chair', -1743.4, 155.8, { yaw: -PI / 2 });
  prop('pl-cafe-parasol', -1744.5, 156, { solid: { r: 0.15, h: 2.4 }, tint: 0xe58fb0 });
  for (const [dx, dz] of [[-0.15, 0.1], [0.12, -0.12], [0.1, 0.18]] as const) prop('pl-espresso-cup', -1744.5 + dx, 156 + dz, { y: 0.77, yaw: dx * 9 });
  sign('menu', 'TASTING OF NOTHING\nFree. Seconds also free.\nThirds: not offered.', -1744.5, 153.4, 0);
  plan.vignettes.push({
    id: 'pl-lb-tasting-of-nothing', name: 'The tasting of nothing', x: -1744.5, z: 156,
    story: 'A table, two chairs and three empty cups stand under a pink parasol, and a chalkboard offers a free tasting of nothing. The taster has been at it all morning and says the nothing is excellent this year.',
  });
  plan.residents.push({
    id: 'pl-lb-taster', name: 'Bertrand Savour', x: -1745.7, z: 154.6, yaw: PI / 2 - 0.4, idle: 'think',
    look: { hat: 0xe8dfc4, shirt: 0x6a1b3a, pants: 0x333333, beard: 0xdddddd, skin: 0xf1c27d, glasses: true },
    bubble: 'Notes of absence, a confident finish. Nothing at all, beautifully. Do try the second nothing.',
  });
  prop('wheelbarrow', -1742, 147.4, { yaw: 0.6 });
  prop('pl-produce-crate', -1741.2, 148.4, { yaw: 0.2, tint: 0xff9a3c, solid: { w: 0.8, d: 0.6, h: 0.5 } });
  // The crossing at z 156..164 (where the aisle jogs): the market's hub. A cart, spilled crates and a bench.
  prop('pl-hand-cart', -1738.6, 160.8, { yaw: 1.2, tint: 0xd93636, solid: { w: 1.0, d: 1.5, h: 0.8 } });
  prop('park-bench', -1726.6, 159, { yaw: PI / 2, solid: { w: 1.8, d: 0.6, h: 0.9 } });
  prop('pl-produce-crate', -1739.4, 163.2, { yaw: 0.4, tint: 0xffe066, solid: { w: 0.8, d: 0.6, h: 0.5 } });
  prop('pl-produce-crate', -1739.0, 163.4, { y: 0.5, yaw: 1.4, tint: 0xd6459f });
  prop('bird-pigeon', -1731.6, 157.6, { yaw: 2.1 });
  prop('bird-pigeon', -1730.7, 158.4, { yaw: 4.1 });
  prop('pl-baguette', -1731.2, 157.2, { y: 0.03, yaw: 0.9 });

  // Back lanes behind the columns: stacked crates, barrels, barrows and a bench or two (never on a stall).
  const camSpots: readonly (readonly [number, number])[] = [[-1733, 124], [-1740, 150], [-1733, 160]];
  const free2 = (x: number, z: number, m: number): boolean =>
    !stalls.some((p) => Math.hypot(p.x - x, p.z - z) < m) && !camSpots.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 2.2);
  for (let z = 126; z <= 200; z += 5.2) {
    for (const bxx of [-1746.5, -1741.8, -1722.6, -1717.5]) {
      const x = bxx + (rnd() - 0.5) * 2;
      const zz = z + (rnd() - 0.5) * 2.4;
      if (!free2(x, zz, 2.6) || roadClearance(x, zz) < 1.2) continue;
      const pick = Math.floor(rnd() * 6);
      if (pick === 0) { prop('crate', x, zz, { yaw: rnd() * 6, scale: 0.9, solid: { r: 0.45, h: 0.8 } }); prop('crate', x + 0.1, zz, { y: 0.75, yaw: rnd() * 6, scale: 0.75 }); }
      else if (pick === 1) prop('barrel', x, zz, { solid: { r: 0.4, h: 0.9 } });
      else if (pick === 2) prop('wheelbarrow', x, zz, { yaw: rnd() * 6 });
      else if (pick === 3) { prop('pl-produce-crate', x, zz, { yaw: rnd() * 6, tint: STRIPES[Math.floor(rnd() * STRIPES.length)], solid: { w: 0.8, d: 0.6, h: 0.5 } }); prop('pl-produce-crate', x + 0.7, zz + 0.3, { yaw: rnd() * 6, tint: 0x8bc34a }); }
      else if (pick === 4) prop('pl-hat-stand', x, zz, { yaw: rnd() * 6, scale: 0.9 });
      else prop('euro-geranium-pot', x, zz, { tint: [0xd93636, 0xd6459f, 0xff9a3c][Math.floor(rnd() * 3)] });
    }
  }
  prop('park-bench', -1752, 186, { yaw: PI, solid: { w: 1.8, d: 0.6, h: 0.9 } });
  prop('euro-plane-tree', -1754, 205, { solid: { r: 0.45, h: 9 } });
  prop('euro-plane-tree', -1712.4, 228, { solid: { r: 0.45, h: 9 } });
  prop('euro-plane-tree', -1754.5, 140, { solid: { r: 0.45, h: 9 } });
  prop('euro-plane-tree', -1752.5, 168, { solid: { r: 0.45, h: 9 } });
  // The hall plaza (z 199..209, between the last stalls and the hall): produce piled loose, a cheese tower.
  for (let i = 0; i < 7; i++) {
    const x = -1752 + i * 4.4 + (i > 3 ? 8 : 0);
    if (Math.abs(x + 1733) < 3) continue;
    prop('pl-produce-crate', x, 203 + (i % 3) * 1.3, { yaw: i * 0.7, tint: [0xff9a3c, 0x8bc34a, 0xd93636][i % 3], solid: { w: 0.8, d: 0.6, h: 0.5 } });
    if (i % 2) prop('pl-produce-crate', x + 0.4, 203.05 + (i % 3) * 1.3, { y: 0.5, yaw: i, tint: 0xffe066 });
  }
  for (let k = 0; k < 4; k++) prop('pl-cheese-wheel', -1729.5 + (k % 2) * 0.5, 204 + (k >> 1) * 0.1, { y: k > 1 ? 0.2 * (k - 1) : 0, scale: 1.2 });
  // The crepe-van parking spot: two bollards and a sign.
  prop('euro-bollard', -1714, 198, { solid: { r: 0.15, h: 1 } });
  prop('euro-bollard', -1714, 203.6, { solid: { r: 0.15, h: 1 } });
  sign('menu', 'CREPE VAN BAY\nVan reserved.\nParking reserved.\nPatience reserved.', -1716.4, 200.8, -PI / 2);

  // ---- Market residents and the haggles --------------------------------------------------------------------------------
  const holder = (id: string, name: string, sp: Spot, look: Look, bubble: string, idle: Idle = 'vendor-call'): void => {
    const [x, z] = frameOf(sp).at(0.15, -0.28);
    plan.residents.push({ id, name, x, z, yaw: sp.yaw, idle, look, bubble });
  };
  const shopper = (id: string, name: string, sp: Spot, gx: number, look: Look, bubble: string, idle: Idle = 'point'): void => {
    const [x, z] = frameOf(sp).at(gx, 1.7);
    plan.residents.push({ id, name, x, z, yaw: sp.yaw + PI + 0.15, idle, look, bubble });
  };
  const beetle = westMain[0];
  holder('pl-lb-beetle-seller', 'Cornelius Carapace', beetle, { hat: 0x2f3a2c, shirt: 0x4f9a3c, pants: 0x444444, beard: 0xbbbbbb, skin: 0xe0ac69, glasses: true },
    'BEETLE, slightly used. Price: negotiable. Beetle: not.');
  shopper('pl-lb-beetle-haggler', 'Madame Rabais', beetle, -0.1, { hat: 0xd6459f, shirt: 0xf3d6cf, pants: 0x4a4f57, beard: null, dress: true, skin: 0xf1c27d, hair: { color: 0x8a5a2b, style: 'pigtails' } },
    'Three acorns. For the beetle AND the jar. I will not say it twice. I have said it nine times.', 'hands-on-hips');
  frameOf(beetle).put('stool', -1.0, 1.1, { yaw: beetle.yaw + 0.6 });
  plan.vignettes.push({
    id: 'pl-lb-beetle-haggle', name: 'The beetle haggle', x: beetle.x, z: beetle.z,
    story: 'A stallholder and a customer have been haggling over one beetle in a jar since the morning. The sign says the price is negotiable and the beetle is not, and the beetle, which has heard it all, has gone to sit at the back.',
  });
  const brac = nth('bric', 1, eastMain);
  holder('pl-lb-clock-seller', 'Odile Tictoc', brac, { hat: 0xa65cff, shirt: 0x6a1b3a, pants: 0x333333, beard: null, dress: true, skin: 0xe9b98a, hair: { color: 0x555555, style: 'pigtails' } },
    'Every clock here is right. They are just right at different times.');
  shopper('pl-lb-clock-shopper', 'Remy Tempus', brac, 0.2, { hat: 0x333333, shirt: 0xd8cfb8, pants: 0x2c3e50, beard: 0xdddddd, skin: 0xf1c27d, glasses: true },
    'It says ten past, but it said ten past an hour ago. Is it stuck or is it patient?', 'think');
  plan.vignettes.push({
    id: 'pl-lb-clock-argument', name: 'The clock argument', x: brac.x, z: brac.z,
    story: 'A bric-a-brac stall sells six carriage clocks that all show different times, and a customer has been standing in front of them for an hour trying to decide which one to believe. The stallholder says that is what makes them antiques.',
  });
  const hatter = nth('hats', 0);
  holder('pl-lb-hat-seller', 'Fedor Brim', hatter, { hat: 0x7a1f3d, shirt: 0x8a5a2b, pants: 0x444444, beard: 0xc8c8c8, skin: 0xe0ac69 },
    'A hat remembers its head. Try it on and see whose it was.');
  plan.vignettes.push({
    id: 'pl-lb-hat-stall', name: 'The old-hats stall', x: hatter.x, z: hatter.z,
    story: 'Two hat stands hold a top hat, a beret, a bowler and a fez, all very slightly too small. The hatter says each one is the right size for the head it left, and that choosing a new head to fit is the buyer\'s job.',
  });
  const recordman = nth('records', 0, eastMain);
  holder('pl-lb-record-seller', 'Gaston Disque', recordman, { hat: 0x1d1d22, shirt: 0x2f64c9, pants: 0x222222, beard: 0x555555, skin: 0xf1c27d, glasses: true },
    'All my records are by the Maestro. All of them are the same record. At different speeds.', 'idle-pompous');
  shopper('pl-lb-print-shopper', 'Colette Cadre', nth('prints', 0), 0.9, { hat: 0x2fa8a0, shirt: 0xf2c230, pants: 0x4a4f57, beard: null, dress: true, skin: 0xe0ac69 },
    'It is a picture of this market, painted before the market was here. I find that very forward-looking.', 'look-around');

  // North annex: a central avenue ending at a fountain.
  prop('euro-fountain', -1733, 58, { solid: { r: 2, h: 1 } });
  prop('bird-pigeon', -1733.6, 56.6, { y: 1.05, yaw: 0.4 });
  sign('plaque', 'FOUNTAIN OF PLENTY\n(of questions)', -1733, 61.1, 0, { y: 0.7, w: 2, h: 0.45 });
  for (const x of [-1737.6, -1728.4]) prop('euro-lamp-post', x, 63, { solid: { r: 0.2, h: 4.2 } });
  sign('poster', 'WHICH IS OLDER?', -1750.4, 103, 0);
  sign('poster', 'MARKET TODAY\nAlso tomorrow.\nAlso yesterday.', -1727.5, 108.6, 0);
  // The cheese standoff: a hand-placed stall at the avenue's south-west corner, facing Rue F.
  {
    const cs = { x: -1747, z: 100, yaw: 0, s: 1.15 };
    prop('pl-stall-canopy', cs.x, cs.z, { yaw: 0, scale: cs.s, tint: 0xf0c63a, solid: { w: 1.6 * cs.s, d: 1.3 * cs.s, h: 1.4 } });
    const { at, put } = frameOf(cs);
    const [px, pz] = at(0, 0.64);
    sign('plaque', TRADE_SIGN.cheese, px, pz, 0, { y: 0.5 * cs.s, w: 1.3 * cs.s, h: 0.42 * cs.s });
    put('pl-cheese-wheel', -0.3, 0.3, { y: TOP, scale: 1.3, tint: 0xf2c230 });
    put('pl-cheese-wheel', 0.35, 0.3, { y: TOP, scale: 1.3, tint: 0xe6c27a });
    prop('stool', -1745.2, 102.4, { yaw: 0.4 });
    prop('pl-cheese-wheel', -1748.9, 103.6, { yaw: 0.2, scale: 0.9 });
  }
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
