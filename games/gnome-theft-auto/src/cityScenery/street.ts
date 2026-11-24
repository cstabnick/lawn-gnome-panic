// Street scenery for the Turfton grid (docs/roadmaps/gta-parks-and-fringe.md, issue 1J): furniture, street trees,
// banners and bunting, kiosks and carts, alley clutter, per district. Deterministic: one seeded stream, fixed loop order.
import { mulberry32 } from '@lawn/level';
import { CITY_HALF, ROAD_LINES } from '../config';
import { districtAt } from '../districts';
import { PARKS } from '../parks/blocks';
import { heightAt } from '../terrain';
import { footprintRect, prefabBox, prefabHeight, rectAround, type Site } from './site';
import { emptyPlan, type Dress, type DressPlan } from './types';

type Axis = 'x' | 'z';

/** Stop adding once the plan holds this many dressings (the budget). */
const CAP = 1800;
/** Street lamps stand every 25 m from -212.5 on both sides; nothing sits within 1.6 m (along the street) of one. */
const LAMP_T0 = -212.5;
const LAMP_SPACING = 25;
const LAMP_CLEAR = 1.6;
/** Furniture strip: its near edge is 7.7 m from the road centre line (the sidewalk ends at 7.5). */
const STRIP = 7.7;
const ROAD_CLEAR = 7.6;
const TREE_OFFSET = 8.8;
/** Bunting poles stand 7.45 m either side of the centre line. */
const POLE = 7.45;
const KIOSK_REACH = 18;
const BLOCK_RADIUS = 130;

const ROADS: readonly number[] = [...ROAD_LINES].sort((a, b) => a - b);
/** Street crossings along a road, with the two city edges at the ends. */
const CROSSINGS: readonly number[] = [-CITY_HALF, ...ROADS, CITY_HALF];
/** Block centres: midpoints of consecutive road lines. */
const BLOCK_C: readonly number[] = ROADS.slice(1).map((v, i) => (v + ROADS[i]) / 2);
/** Corners of a block, as signs of (x, z) from the centre. */
const CORNERS: readonly [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

interface Seg { k: number; a: number; b: number }
const SEGS: readonly Seg[] = CROSSINGS.slice(0, -1).map((c, k) => ({
  k,
  a: c === -CITY_HALF ? c + 2 : c + 11,
  b: CROSSINGS[k + 1] === CITY_HALF ? CROSSINGS[k + 1] - 2 : CROSSINGS[k + 1] - 11,
}));

/** Kits per district (null = the ring blocks outside the named districts). */
const KITS: Record<string, string[]> = {
  downtown: ['litter-bin', 'newspaper-box', 'parking-meter', 'bike-rack', 'parking-meter', 'phone-box', 'poster-pillar', 'street-banner-pole'],
  greenhouse: ['food-cart', 'sandwich-board', 'stone-planter', 'litter-bin', 'street-banner-pole'],
  'patio-heights': ['street-bollard', 'stone-planter', 'park-bench', 'street-bollard', 'topiary-cone', 'litter-bin'],
  'old-brick': ['sandwich-board', 'bike-rack', 'litter-bin', 'phone-box', 'newspaper-box', 'poster-pillar'],
  'park-arts': ['park-bench', 'litter-bin', 'street-banner-pole', 'sandwich-board', 'poster-pillar'],
  industrial: ['oil-drum', 'pallet-stack', 'dumpster', 'street-bollard', 'tyre-pile', 'litter-bin'],
  ring: ['park-bench', 'litter-bin', 'mailbox', 'kerb-hydrant'],
};
const KIT_SCALE: Record<string, number> = { 'stone-planter': 0.6, 'topiary-cone': 0.8, mailbox: 1.3 };

const BANNER_TINT: Record<string, number> = {
  downtown: 0xd93636,
  greenhouse: 0xff4fa3,
  'patio-heights': 0xd4a843,
  'old-brick': 0x7a3b2a,
  'park-arts': 0x3a7ab8,
};
const BANNER_DEFAULT = 0x2f6e5a;

/** Street trees: [ids, gap in metres]; an empty list plants none. */
const TREES: Record<string, { ids: string[]; gap: number }> = {
  downtown: { ids: ['city-round-tree'], gap: 16 },
  'patio-heights': { ids: ['city-round-tree'], gap: 14 },
  'old-brick': { ids: ['broadleaf-tree'], gap: 18 },
  'park-arts': { ids: ['broadleaf-tree'], gap: 12 },
  ring: { ids: ['broadleaf-tree', 'city-round-tree'], gap: 12 },
};

const BUNTING_TINTS = [0xd93636, 0x3a7ab8] as const;
const BUNTING_TRIM = 0xf2c94c;

/** Every district string the planner keys on: the named ones, or 'ring' for null. */
function kitKey(district: string | null): string {
  return district ?? 'ring';
}

/** Strip position for an item at distance `off` from the road, t along it. */
function stripPoint(axis: Axis, w: number, s: number, t: number, off: number): [number, number] {
  return axis === 'z' ? [w + s * off, t] : [t, w + s * off];
}

/** Yaw that turns a strip item's front (+z) to the road on side s. */
function faceRoad(axis: Axis, s: number): number {
  if (axis === 'z') return s > 0 ? -Math.PI / 2 : Math.PI / 2;
  return s > 0 ? Math.PI : 0;
}

/** Half of the item's footprint measured along the street. */
function halfAlong(axis: Axis, id: string, yaw: number, scale: number): number {
  const r = footprintRect(id, 0, 0, yaw, scale);
  return axis === 'z' ? (r.maxZ - r.minZ) / 2 : (r.maxX - r.minX) / 2;
}

/** True when an item centred at street position t (half-length hl) would sit on a street lamp. */
function nearLamp(t: number, hl: number): boolean {
  const k = Math.round((t - LAMP_T0) / LAMP_SPACING);
  const lamp = LAMP_T0 + k * LAMP_SPACING;
  return Math.abs(t - lamp) < LAMP_CLEAR + hl;
}

/** Depth of a prefab (its local z size) at a scale: how far the item reaches towards the road. */
function depthOf(id: string, scale: number): number {
  const b = prefabBox(id);
  return (b.max.z - b.min.z) * scale;
}

function full(plan: DressPlan): boolean {
  return plan.dress.length >= CAP;
}

/** Place one item on the furniture strip of a road side. */
function stripItem(
  site: Site,
  plan: DressPlan,
  axis: Axis,
  w: number,
  s: number,
  t: number,
  id: string,
  o: { scale?: number; cls?: 'detail' | 'prop'; tint?: number; solid?: boolean } = {},
): boolean {
  const scale = o.scale ?? 1;
  const off = STRIP + depthOf(id, scale) / 2;
  const [x, z] = stripPoint(axis, w, s, t, off);
  const yaw = faceRoad(axis, s);
  if (nearLamp(t, halfAlong(axis, id, yaw, scale))) return false;
  return site.place(plan, {
    id,
    x,
    z,
    yaw,
    scale,
    cls: o.cls ?? 'detail',
    solid: o.solid ?? prefabHeight(id, scale) >= 0.8,
    roadClear: ROAD_CLEAR,
    pad: 0.3,
    tint: o.tint,
  });
}

/** One district-kit pass along a segment on one side: items every 5 m, a 2 m gap after every third. */
function kitWalk(site: Site, plan: DressPlan, axis: Axis, w: number, s: number, seg: Seg, district: string | null): void {
  const kit = KITS[kitKey(district)];
  let t = seg.a;
  let n = 0;
  let idx = 0;
  while (t <= seg.b) {
    if (full(plan)) return;
    const id = kit[idx % kit.length];
    idx++;
    const tint = id === 'street-banner-pole' ? (BANNER_TINT[kitKey(district)] ?? BANNER_DEFAULT) : undefined;
    stripItem(site, plan, axis, w, s, t, id, { scale: KIT_SCALE[id], tint });
    n++;
    t += 5;
    if (n % 3 === 0) t += 2;
  }
}

/** Street trees every `gap` m at the kerb line; the trunk is claimed, the crown is not a collider. */
function treeWalk(site: Site, plan: DressPlan, rnd: () => number, axis: Axis, w: number, s: number, seg: Seg, district: string | null): void {
  const spec = TREES[kitKey(district)];
  if (!spec || spec.ids.length === 0) return;
  let alt = 0;
  for (let t = seg.a + spec.gap / 2; t <= seg.b; t += spec.gap) {
    if (full(plan)) return;
    const id = spec.ids[alt % spec.ids.length];
    alt++;
    const height = 5 + 2 * rnd();
    const yaw = rnd() * Math.PI * 2;
    const [x, z] = stripPoint(axis, w, s, t, TREE_OFFSET);
    const r = rectAround(x, z, 0.5);
    if (!site.free(r, { pad: 0.5, roadClear: ROAD_CLEAR })) continue;
    site.claim(r, 3);
    const d: Dress = { id, x, y: heightAt(x, z), z, yaw, scale: height / prefabHeight(id), cls: 'prop' };
    plan.dress.push(d);
  }
}

/** Steps 1-4: per road, side and segment: a bus shelter, the district kit, then trees. */
function planStreets(site: Site, plan: DressPlan, rnd: () => number): void {
  for (const axis of ['x', 'z'] as Axis[]) {
    for (const w of ROADS) {
      for (const s of [-1, 1]) {
        for (const seg of SEGS) {
          if (full(plan)) return;
          const mid = (seg.a + seg.b) / 2;
          const [px, pz] = stripPoint(axis, w, s, mid, STRIP + 0.5);
          const district = districtAt(px, pz);
          if ((seg.k + (s > 0 ? 1 : 0) + ROADS.indexOf(w)) % 3 === 0) {
            stripItem(site, plan, axis, w, s, mid, 'bus-shelter', { cls: 'prop', solid: true });
          }
          kitWalk(site, plan, axis, w, s, seg, district);
          treeWalk(site, plan, rnd, axis, w, s, seg, district);
        }
      }
    }
  }
}

/** Step 5: bunting across downtown streets, one per segment, on two poles claimed as colliders. */
function planBunting(site: Site, plan: DressPlan): void {
  let alt = 0;
  for (const axis of ['z', 'x'] as Axis[]) {
    for (const w of ROADS) {
      if (Math.abs(w) > 60) continue;
      for (const seg of SEGS) {
        if (full(plan)) return;
        const mid = (seg.a + seg.b) / 2;
        if (Math.abs(mid) > 95) continue;
        const cx = axis === 'z' ? w : mid;
        const cz = axis === 'z' ? mid : w;
        if (districtAt(cx, cz) !== 'downtown') continue;
        const [ax, az] = axis === 'z' ? [w - POLE, mid] : [mid, w - POLE];
        const [bx, bz] = axis === 'z' ? [w + POLE, mid] : [mid, w + POLE];
        const ra = rectAround(ax, az, 0.15);
        const rb = rectAround(bx, bz, 0.15);
        const opts = { roadClear: 7.2, pad: 0.2 };
        if (!site.free(ra, opts) || !site.free(rb, opts)) continue;
        site.claim(ra, 5.8);
        site.claim(rb, 5.8);
        plan.dress.push({
          id: 'bunting-span',
          x: cx,
          y: 0,
          z: cz,
          yaw: axis === 'z' ? 0 : Math.PI / 2,
          scale: 1,
          cls: 'prop',
          tint: BUNTING_TINTS[alt % BUNTING_TINTS.length],
          trim: BUNTING_TRIM,
        });
        alt++;
      }
    }
  }
}

/** Blocks that get corner kiosks and alleys: inside radius 130 and not a park. */
function downtownBlocks(): [number, number][] {
  const out: [number, number][] = [];
  for (const cx of BLOCK_C) {
    for (const cz of BLOCK_C) {
      if (Math.hypot(cx, cz) > BLOCK_RADIUS) continue;
      if (PARKS.some((p) => p.x === cx && p.z === cz)) continue;
      out.push([cx, cz]);
    }
  }
  return out;
}

/** Step 6: one news kiosk or food cart on a block corner, trying the other corners if it does not fit. */
function planKiosks(site: Site, plan: DressPlan, rnd: () => number): void {
  for (const [cx, cz] of downtownBlocks()) {
    if (full(plan)) return;
    const pick = Math.floor(rnd() * CORNERS.length);
    const id = rnd() < 0.5 ? 'news-kiosk' : 'food-cart';
    for (let j = 0; j < CORNERS.length; j++) {
      const [sx, sz] = CORNERS[(pick + j) % CORNERS.length];
      const x = cx + sx * KIOSK_REACH;
      const z = cz + sz * KIOSK_REACH;
      // The kiosk turns to the crossing at (cx + 30 sx, cz + 30 sz), which is 12 m further out along each axis.
      const yaw = Math.atan2(sx * 12, sz * 12);
      if (site.place(plan, { id, x, z, yaw, cls: 'prop', solid: true, roadClear: ROAD_CLEAR })) break;
    }
  }
}

/** Step 7: a 3 m alley through each downtown block centre, along z and along x, with four pieces of clutter. */
function planAlleys(site: Site, plan: DressPlan): void {
  const clutter = ['dumpster', 'litter-bin', 'pallet-stack', 'oil-drum'];
  const vs = [-12, -5, 3, 10];
  for (const [cx, cz] of downtownBlocks()) {
    if (full(plan)) return;
    const zr = { minX: cx - 1.5, maxX: cx + 1.5, minZ: cz - 19, maxZ: cz + 19 };
    if (site.free(zr, { pad: 0 })) {
      for (let i = 0; i < vs.length; i++) {
        if (full(plan)) return;
        const u = i % 2 === 0 ? -0.8 : 0.8;
        const id = clutter[i];
        site.place(plan, {
          id,
          x: cx + u,
          z: cz + vs[i],
          yaw: id === 'dumpster' ? Math.PI / 2 : 0,
          cls: 'detail',
          solid: prefabHeight(id) >= 0.8,
          roadClear: ROAD_CLEAR,
        });
      }
    }
    const xr = { minX: cx - 19, maxX: cx + 19, minZ: cz - 1.5, maxZ: cz + 1.5 };
    if (site.free(xr, { pad: 0 })) {
      for (let i = 0; i < vs.length; i++) {
        if (full(plan)) return;
        const u = i % 2 === 0 ? -0.8 : 0.8;
        const id = clutter[i];
        site.place(plan, {
          id,
          x: cx + vs[i],
          z: cz + u,
          yaw: 0,
          cls: 'detail',
          solid: prefabHeight(id) >= 0.8,
          roadClear: ROAD_CLEAR,
        });
      }
    }
  }
}

export function planStreet(site: Site): DressPlan {
  const plan = emptyPlan();
  const rnd = mulberry32(4711);
  planStreets(site, plan, rnd);
  planBunting(site, plan);
  planKiosks(site, plan, rnd);
  planAlleys(site, plan);
  return plan;
}
