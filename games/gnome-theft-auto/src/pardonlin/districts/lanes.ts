// Lanes through Pardonlin's blocks (FX09, D9 item 2): crooked walk-only `trail/pl-*` footpaths (in
// data/levels/pardonlin.level.json) built up on both sides, with courtyards and passages. Runs after every district's
// rows are placed, so lane-side buildings pack round what is already there. Pure data.
//
// Every lane is a 3.5 m cobbled ribbon (groundPlan.ts lays it). Here each one gets:
//   - houses along both sides, fronts 0-1 m off the cobbles (planStreetRow through keepClear, so nothing overlaps a road,
//     a path, a vignette spot or anything already standing);
//   - a courtyard (a widened bend with a tree, bench, washing line, bikes or a bistro set), left free of houses;
//   - lamps, a few flower pots, and on some lanes a street sign or a short stepped section.
// What stood in a lane's way (filler props, a stray sign or resident) is moved out of it.
import { EURO_ROOF_TINTS, EURO_WALL_TINTS, euroBuilding } from '../../eurokit/catalog';
import { PARTY_GAP, type EuroPlacement } from '../../eurokit/street';
import { cornersOf, districtAt, districtById, footprintProblem, pathPoints, type DistrictId, type Footprint } from '../layout';
import { buildingFootprint, keepClear, propFootprint, type DistrictPlan, type PlanProp, type PlanSign } from '../plan';

type Pt = readonly [number, number];
type Solid = PlanProp['solid'];

const TREE: Solid = { r: 0.45, h: 9 };
const BUTT: Solid = { r: 0.4, h: 1 };
const BENCH: Solid = { w: 1.6, d: 0.6, h: 0.9 };

/** Houses that stand close to a lane: small fronts (apron <= 0.6 m) so they can sit 0-1 m off the cobbles. */
const HOUSES = ['euro-townhouse-tall', 'euro-townhouse-mansard', 'euro-half-timbered'] as const;
const HOUSES_B = ['euro-townhouse-mansard', 'euro-half-timbered', 'euro-townhouse-tall', 'euro-townhouse-mansard'] as const;

/** Half the cobbled ribbon (groundPlan lays width + 0.5). */
const COBBLE = 2.0;

type Courtyard = 'tree' | 'wash' | 'bikes' | 'bistro' | 'well';

interface LaneSpec {
  /** Path id in pardonlin.level.json. */
  id: string;
  seed: number;
  /** Courtyards: metres along the lane, which side the planting is on (+1 left of travel, -1 right), what is in it. */
  yards: readonly { s: number; side: 1 | -1; kind: Courtyard; r?: number }[];
  /** Hand-placed shop fronts (laid first): metres along the lane, side, building id. */
  shops?: readonly { s: number; side: 1 | -1; id: string }[];
  /** The street sign at the lane's mouth, if any: [s, side, text]. */
  sign?: readonly [number, 1 | -1, string];
  /** Stepped section: metres along the lane where the ground falls (porch steps with a railing either side). */
  steps?: number;
  /** Lamp posts: metres along the lane. */
  lamps?: readonly number[];
}

const LANES: readonly LaneSpec[] = [
  // ---- Old Town ----
  {
    id: 'trail/pl-pas-perdus', seed: 11,
    yards: [{ s: 38, side: -1, kind: 'tree', r: 12 }, { s: 92, side: -1, kind: 'wash', r: 9 }],
    sign: [2, -1, 'Ruelle des Pas Perdus\nThe steps are found. The way is not.'],
  },
  {
    id: 'trail/pl-fonds-de-cour', seed: 23,
    yards: [{ s: 30, side: -1, kind: 'bikes', r: 11 }, { s: 70, side: -1, kind: 'bistro', r: 9 }],
    shops: [{ s: 52, side: -1, id: 'euro-shopfront-antiques' }],
  },
  {
    id: 'trail/pl-bouchons', seed: 31,
    yards: [{ s: 30, side: 1, kind: 'tree', r: 10 }],
    sign: [2, 1, 'Ruelle des Bouchons\nNo traffic. Still a jam.'],
  },
  // ---- Left Bank ----
  {
    id: 'trail/pl-violons', seed: 41,
    yards: [{ s: 24, side: -1, kind: 'bistro', r: 10 }],
    sign: [2, -1, 'Passage des Violons\nThrough traffic is encouraged. Through.'],
  },
  {
    id: 'trail/pl-scarabees', seed: 53,
    yards: [{ s: 26, side: 1, kind: 'wash', r: 10 }],
  },
  {
    id: 'trail/pl-brouillons', seed: 61,
    yards: [{ s: 20, side: -1, kind: 'well' }],
  },
  // ---- Teacup Row and the Quays ----
  {
    id: 'trail/pl-tasse', seed: 71,
    yards: [{ s: 30, side: -1, kind: 'bistro', r: 9 }, { s: 62, side: 1, kind: 'tree', r: 9 }],
    sign: [2, -1, 'Ruelle de la Tasse\nSaucer not provided.'],
    steps: 92,
  },
  {
    id: 'trail/pl-chat-qui-passe', seed: 83,
    yards: [{ s: 28, side: 1, kind: 'wash', r: 10 }],
    sign: [2, 1, 'Passage du Chat Qui Passe\nThe cat has right of way.'],
  },
];

// ---- Small helpers -------------------------------------------------------------------------------------------------
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(list: readonly T[], rnd: () => number): T => list[Math.floor(rnd() * list.length)];
function shuffled<T>(list: readonly T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// ---- Geometry helpers ----------------------------------------------------------------------------------------------
interface Frame { x: number; z: number; tx: number; tz: number }

function lengths(pts: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return out;
}

function frameAt(pts: readonly Pt[], cum: readonly number[], s: number): Frame {
  const t = Math.max(0, Math.min(cum[cum.length - 1], s));
  let i = 1;
  while (i < pts.length - 1 && cum[i] < t) i++;
  const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
  const len = cum[i] - cum[i - 1] || 1;
  const k = (t - cum[i - 1]) / len;
  return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, tx: (bx - ax) / len, tz: (bz - az) / len };
}

/** World position `lat` m to the left of the lane at metre `s` (left = the side the normal (tz, -tx) points to). */
function offsetPoint(f: Frame, along: number, lat: number): [number, number] {
  return [f.x + f.tx * along + f.tz * lat, f.z + f.tz * along - f.tx * lat];
}

function distToPolyline(x: number, z: number, pts: readonly Pt[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(x - ax - dx * k, z - az - dz * k));
  }
  return best;
}

function pointInFootprint(f: Footprint, x: number, z: number, m: number): boolean {
  const dx = x - f.x, dz = z - f.z;
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  return Math.abs(dx * c - dz * s) <= f.w / 2 + m && Math.abs(dx * s + dz * c) <= f.d / 2 + m;
}

// ---- The pass --------------------------------------------------------------------------------------------------------
/** The houses each lane got, by path id (for lanes.test.ts and the report). */
export const laneHouses = new Map<string, EuroPlacement[]>();

export function addLanes(plans: DistrictPlan[]): void {
  laneHouses.clear();
  const planOf = (x: number, z: number): DistrictPlan | undefined => {
    const id = districtAt(x, z);
    return id ? plans.find((p) => p.id === id) : undefined;
  };
  const taken = new Map<DistrictId, Footprint[]>();
  for (const p of plans) {
    const list: Footprint[] = [];
    for (const b of p.buildings) { const f = buildingFootprint(b); if (f) list.push(f); }
    for (const q of p.props) { const f = propFootprint(q); if (f) list.push(f); }
    taken.set(p.id, list);
  }
  const vignettes = plans.flatMap((p) => p.vignettes);
  const nearVignette = (f: Footprint): boolean => vignettes.some((v) => Math.hypot(v.x - f.x, v.z - f.z) < 6 + Math.hypot(f.w, f.d) / 2);

  for (const lane of LANES) {
    const pts = pathPoints(lane.id);
    laneHouses.set(lane.id, []);
    const cum = lengths(pts);
    const total = cum[cum.length - 1];
    // A courtyard keeps houses off both sides of a stretch of lane: wide on the planted side, a gate-gap on the other.
    const yardDiscs = lane.yards.map((y) => {
      const f = frameAt(pts, cum, y.s);
      return { x: f.x, z: f.z, r: y.r ?? 8, side: y.side };
    });
    const inYard = (b: EuroPlacement, side: 1 | -1): boolean =>
      yardDiscs.some((d) => Math.hypot(b.x - d.x, b.z - d.z) < (side === d.side ? d.r : d.r * 0.55));
    const added: { plan: DistrictPlan; b: EuroPlacement; f: Footprint }[] = [];

    const accept = (b: EuroPlacement, side: 1 | -1): boolean => {
      if (inYard(b, side)) return false;
      const plan = planOf(b.x, b.z);
      if (!plan) return false;
      const f = buildingFootprint(b);
      if (!f || nearVignette(f)) return false;
      if (!keepClear([b], taken.get(plan.id)!, districtById(plan.id).rects).length) return false;
      plan.buildings.push(b);
      added.push({ plan, b, f });
      laneHouses.get(lane.id)!.push(b);
      return true;
    };

    // Hand-placed shop fronts first, so the rows pack round them.
    for (const sh of lane.shops ?? []) {
      const eb = euroBuilding(sh.id);
      if (!eb) continue;
      const f = frameAt(pts, cum, sh.s);
      const front = COBBLE + 0.3 + eb.apron;
      const [x, z] = offsetPoint(f, 0, sh.side * (front + eb.depth / 2));
      const yaw = Math.atan2(-sh.side * f.tz, sh.side * f.tx);
      accept({ id: sh.id, x, z, yaw, scale: 1, tint: 0xe8d2a8, trim: 0x7a4b3a }, sh.side);
    }

    // Both sides of the lane: houses one after another along it, each turned to the lane where it stands.
    const rnd = rng(lane.seed);
    for (const side of [1, -1] as const) {
      let s = side > 0 ? 0 : 2.5;
      let prev = '';
      while (s < total - 2) {
        const order = shuffled(side > 0 ? HOUSES : HOUSES_B, rnd).sort((p, q) => (p === prev ? 1 : 0) - (q === prev ? 1 : 0));
        let placed: EuroPlacement | null = null;
        for (const id of order) {
          const eb = euroBuilding(id)!;
          const f = frameAt(pts, cum, s + eb.width / 2);
          // Outward = the side the house stands on; facing = back toward the lane.
          const ox = side * f.tz, oz = -side * f.tx;
          const front = COBBLE + 0.3 + eb.apron + rnd() * 0.3;
          const b: EuroPlacement = {
            id, x: f.x + ox * (front + eb.depth / 2), z: f.z + oz * (front + eb.depth / 2),
            yaw: Math.atan2(-ox, -oz), scale: 1,
            tint: pick(EURO_WALL_TINTS, rnd), trim: pick(EURO_ROOF_TINTS, rnd),
          };
          if (accept(b, side)) { placed = b; s += eb.width + PARTY_GAP; prev = id; break; }
        }
        if (!placed) s += 0.7;
      }
    }

    // Everything that was standing in the lane (or now inside a house) moves out.
    const inHouse = (x: number, z: number, m: number): boolean => added.some((a) => pointInFootprint(a.f, x, z, m));
    for (const plan of plans) {
      plan.props = plan.props.filter((q) => {
        if (distToPolyline(q.x, q.z, pts) < COBBLE + (q.solid ? 0.6 : 0.2)) return false;
        return !inHouse(q.x, q.z, 0.2);
      });
      plan.signs = plan.signs.filter((s) => distToPolyline(s.x, s.z, pts) > COBBLE + 0.3 && !inHouse(s.x, s.z, 0.3));
      plan.residents = plan.residents.filter((r) => distToPolyline(r.x, r.z, pts) > COBBLE + 1.6 && !inHouse(r.x, r.z, 0.5));
    }

    // Props: only where they are clear of houses, the lane and what already stands.
    const put = (id: string, along: number, s: number, lat: number, o: { yaw?: number; y?: number; solid?: Solid; scale?: number } = {}): void => {
      const f = frameAt(pts, cum, s);
      const [x, z] = offsetPoint(f, along, lat);
      const plan = planOf(x, z);
      if (!plan) return;
      const need = o.solid ? COBBLE + 0.7 : COBBLE + 0.15;
      if (distToPolyline(x, z, pts) < need) return;
      if (added.some((a) => pointInFootprint(a.f, x, z, 0.35))) return;
      if (taken.get(plan.id)!.some((t) => pointInFootprint(t, x, z, 0.25))) return;
      const prop: PlanProp = { id, x, z, ...o };
      const fp = propFootprint(prop);
      if (fp) {
        if (footprintProblem(fp, 0.3)) return;
        if (!cornersOf(fp).every(([cx, cz]) => districtById(plan.id).rects.some((r) => cx >= r.minX && cx <= r.maxX && cz >= r.minZ && cz <= r.maxZ))) return;
        taken.get(plan.id)!.push(fp);
      } else if (!districtById(plan.id).rects.some((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ)) return;
      plan.props.push(prop);
    };
    /** yaw that makes a prop's local +z face the lane from the `side` it stands on. */
    const faceLane = (f: Frame, side: 1 | -1): number => Math.atan2(-side * f.tz, side * f.tx);
    /** yaw that runs a prop's local x along the lane. */
    const alongLane = (f: Frame): number => Math.atan2(-f.tz, f.tx);

    for (const y of lane.yards) {
      const f = frameAt(pts, cum, y.s);
      const sd = y.side;
      const face = faceLane(f, sd), faceOpp = faceLane(f, (-sd) as 1 | -1), al = alongLane(f);
      switch (y.kind) {
        case 'tree':
          put('euro-plane-tree', 0, y.s, sd * 4.6, { solid: TREE });
          put('park-bench', -1.8, y.s, sd * 2.9, { yaw: faceOpp, solid: BENCH });
          put('euro-geranium-pot', 2.4, y.s, sd * 2.7, {});
          put('euro-geranium-pot', -3.4, y.s, sd * 2.7, {});
          put('euro-lamp-post', 2.8, y.s, -sd * 2.6, {});
          break;
        case 'wash':
          put('euro-washing-line', 0, y.s, sd * 4.4, { yaw: al });
          put('euro-water-butt', 2.2, y.s, sd * 3.0, { solid: BUTT });
          put('euro-flower-trough', -2.4, y.s, -sd * 3.0, { yaw: faceOpp });
          put('euro-geranium-pot', -2.4, y.s, sd * 2.8, {});
          break;
        case 'bikes':
          put('euro-bike-rack', -0.8, y.s, sd * 2.9, { yaw: al });
          put('euro-bike-rack', 1.6, y.s, sd * 2.9, { yaw: al });
          put('euro-flower-trough', 3.4, y.s, sd * 3.0, { yaw: face });
          put('euro-lamp-post', -3.2, y.s, -sd * 2.6, {});
          put('euro-plane-tree', 1, y.s, -sd * 5, { solid: TREE });
          break;
        case 'bistro':
          put('euro-bistro-set', 0, y.s, sd * 3.7, { yaw: face });
          put('euro-geranium-pot', 2.2, y.s, sd * 2.7, {});
          put('euro-geranium-pot', -2.2, y.s, sd * 2.7, {});
          put('euro-topiary-lollipop', 3.4, y.s, -sd * 2.8, {});
          put('euro-lamp-post', -2.8, y.s, -sd * 2.6, {});
          break;
        case 'well':
          put('euro-water-butt', 0, y.s, sd * 3.2, { solid: BUTT });
          put('euro-water-butt', 0.9, y.s, sd * 3.5, { solid: BUTT });
          put('euro-plane-tree', 2.4, y.s, sd * 5.2, { solid: TREE });
          put('park-bench', -2.4, y.s, -sd * 3.0, { yaw: face, solid: BENCH });
          break;
      }
    }

    // Lamps: every ~20 m, alternate sides.
    const lamps = lane.lamps ?? [4, 24, 44, 64, 84, 104].filter((v) => v < total - 3);
    lamps.forEach((s, i) => put('euro-lamp-post', 0, s, (i % 2 ? -1 : 1) * 2.45, {}));

    // A pot at the foot of some doors.
    added.forEach((a, i) => {
      if (i % 3 !== 0) return;
      const c = Math.cos(a.b.yaw), sn = Math.sin(a.b.yaw);
      const eb = euroBuilding(a.b.id)!;
      const lx = eb.width / 2 - 0.45, lz = eb.depth / 2 + 0.35;
      const x = a.b.x + lx * c + lz * sn, z = a.b.z - lx * sn + lz * c;
      a.plan.props.push({ id: 'euro-geranium-pot', x, z });
    });

    // The street sign at the lane's mouth, and the stepped section.
    if (lane.sign) {
      const [s, sd, text] = lane.sign;
      const f = frameAt(pts, cum, s);
      const [x, z] = offsetPoint(f, 0, sd * 2.7);
      const plan = planOf(x, z);
      if (plan) {
        const sign: PlanSign = { kind: 'street', text, x, z, yaw: Math.atan2(-f.tx, -f.tz) };
        plan.signs.push(sign);
      }
    }
    if (lane.steps !== undefined) {
      const f = frameAt(pts, cum, lane.steps);
      const yaw = Math.atan2(f.tx, f.tz);
      for (const sd of [1, -1] as const) {
        const [x, z] = offsetPoint(f, 0, sd * 2.35);
        const plan = planOf(x, z);
        if (plan) plan.props.push({ id: 'euro-iron-railing', x, z, yaw: alongLane(f) });
        for (const a of [-1, 1]) {
          const [x2, z2] = offsetPoint(f, a * 1.9, sd * 2.35);
          const p2 = planOf(x2, z2);
          if (p2) p2.props.push({ id: 'euro-iron-railing', x: x2, z: z2, yaw: alongLane(f) });
        }
      }
      for (const a of [-1.2, 0, 1.2]) {
        const [x, z] = offsetPoint(f, a, 0);
        const plan = planOf(x, z);
        if (plan) plan.props.push({ id: 'stepping-stone', x, z, yaw });
      }
    }
  }
}
