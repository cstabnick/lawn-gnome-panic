// The neighbour's yard round Hedgeworth Links (E15 A6): the Tall-One board fence with the Kicked Board and the Members'
// Gate, hedge walls and arches, tall grass (mowable: flora draws it, no collider) and giant plants (soft: no collider,
// the runtime slows and rustles inside them). planYard is pure (placements, colliders, soft spots); buildYard draws it.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { mulberry32 } from '@lawn/level';
import { buildPrefab, getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { addMowablePlants } from '../flora/harvest';
import { prefabBox, textPlate } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import {
  ARCH_GAP, CART_SHELTER, CLUBHOUSE, FENCE_H, FENCE_INSET, HEDGES, HEDGE_ARCHES, HEDGE_H, HEDGE_T, HOLES, KICKED_BOARD,
  LOST_BALLS, MEMBERS_GATE, MOLEHILLS, PRO_COTTAGE, SHED, TERRACE, YARD, distToLine, inPlay, inYard,
} from './types';

export interface YardScenery {
  /** Every collider except the Kicked Board's (fence, gate, hedges). */
  boxes: Box[];
  /** The Kicked Board's collider while it stands; the runtime splices it out of world.boxes when it breaks. */
  boardBox: Box;
  /** Show the board broken (planks on the ground, the gap). Idempotent. */
  breakBoard(): void;
  /** Giant plants you can drive through (no collider): the runtime slows and rustles inside them. */
  soft: readonly { x: number; z: number; r: number }[];
  update(dt: number, t: number): void;
}

type Place = StaticPrefabPlacement;
type Has = (id: string) => boolean;

/** What the yard is made of, before anything is drawn. */
export interface YardPlan {
  fence: Place[];
  kickedPanels: Place[];
  planks: Place[];
  hedges: Place[];
  arches: Place[];
  grass: Place[];
  giants: Place[];
  sprinklers: Place[];
  boxes: Box[];
  boardBox: Box;
  soft: { x: number; z: number; r: number }[];
}

const HALF_PI = Math.PI / 2;
const FENCE_T = 0.4;
const SINK = 0.02;
const g = (x: number, z: number): number => heightAt(x, z);

/** Local bounds of a prefab, or a stand-in when it is not in the catalogue yet. */
function dims(id: string, has: Has, fb: { w: number; h: number; d: number }): { w: number; h: number; d: number; front: number } {
  if (!has(id) || !getPrefab(id)) return { ...fb, front: fb.d / 2 };
  const b = prefabBox(id);
  return { w: b.max.x - b.min.x, h: b.max.y, d: b.max.z - b.min.z, front: b.max.z };
}

function yawAlong(dx: number, dz: number): number {
  return Math.atan2(-dz, dx);
}

/** Colliders along a straight run: one AABB when it is axis-aligned, else a chain of small squares. */
function runBoxes(ax: number, az: number, bx: number, bz: number, thick: number, top: number): Box[] {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return [];
  const half = thick / 2;
  if (Math.abs(dz) < 0.01 || Math.abs(dx) < 0.01) {
    return [{ minX: Math.min(ax, bx) - (Math.abs(dz) < 0.01 ? 0 : half), maxX: Math.max(ax, bx) + (Math.abs(dz) < 0.01 ? 0 : half),
      minZ: Math.min(az, bz) - (Math.abs(dx) < 0.01 ? 0 : half), maxZ: Math.max(az, bz) + (Math.abs(dx) < 0.01 ? 0 : half), h: top }];
  }
  const out: Box[] = [];
  const sq = Math.min(half, 0.95);
  const n = Math.max(1, Math.ceil(len / 1.5));
  for (let i = 0; i <= n; i++) {
    const x = ax + (dx * i) / n, z = az + (dz * i) / n;
    out.push({ minX: x - sq, maxX: x + sq, minZ: z - sq, maxZ: z + sq, h: top });
  }
  return out;
}

export function planYard(has: Has): YardPlan {
  const plan: YardPlan = {
    fence: [], kickedPanels: [], planks: [], hedges: [], arches: [], grass: [], giants: [], sprinklers: [],
    boxes: [], boardBox: { minX: 0, maxX: 0, minZ: 0, maxZ: 0, h: 0 }, soft: [],
  };
  const rnd = mulberry32(0x6e4ed6);
  const top = (x: number, z: number, h: number): number => g(x, z) + h;

  // ---- Fence: panels end to end, faces out, colliders one per straight run -------------------------------------------
  const fx0 = YARD.minX + FENCE_INSET, fx1 = YARD.maxX - FENCE_INSET;
  const fz0 = YARD.minZ + FENCE_INSET, fz1 = YARD.maxZ - FENCE_INSET;
  const panel = dims('board-fence-panel', has, { w: 2, h: FENCE_H, d: 0.2 });
  const fenceRun = (ax: number, az: number, bx: number, bz: number, yaw: number): void => {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.5) return;
    const n = Math.max(1, Math.round(len / panel.w));
    const s = len / n / panel.w;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const x = ax + (bx - ax) * f, z = az + (bz - az) * f;
      if (has('board-fence-panel')) plan.fence.push({ id: 'board-fence-panel', x, y: g(x, z) - SINK, z, yaw, scale: s });
    }
    plan.boxes.push(...runBoxes(ax, az, bx, bz, FENCE_T, top((ax + bx) / 2, (az + bz) / 2, FENCE_H)));
  };
  fenceRun(fx0, fz0, fx1, fz0, Math.PI);          // north: faces -z
  fenceRun(fx0, fz1, fx1, fz1, 0);                // south: faces +z
  fenceRun(fx0, fz0 + 1, fx0, fz1 - 1, -HALF_PI); // west: faces -x
  const kb = { lo: KICKED_BOARD.z - KICKED_BOARD.half, hi: KICKED_BOARD.z + KICKED_BOARD.half };
  const mg = { lo: MEMBERS_GATE.z - MEMBERS_GATE.half, hi: MEMBERS_GATE.z + MEMBERS_GATE.half };
  fenceRun(fx1, fz0 + 1, fx1, mg.lo, HALF_PI);    // east: faces +x, three runs round the two gaps
  fenceRun(fx1, mg.hi, fx1, kb.lo, HALF_PI);
  fenceRun(fx1, kb.hi, fx1, fz1 - 1, HALF_PI);

  // The Kicked Board: two panels and the one collider across its gap.
  const kw = KICKED_BOARD.half;
  for (const dz of [-kw / 2, kw / 2]) {
    const z = KICKED_BOARD.z + dz;
    if (has('kicked-board-panel')) plan.kickedPanels.push({ id: 'kicked-board-panel', x: fx1, y: g(fx1, z) - SINK, z, yaw: HALF_PI });
  }
  plan.boardBox = { minX: fx1 - FENCE_T / 2, maxX: fx1 + FENCE_T / 2, minZ: kb.lo, maxZ: kb.hi, h: top(fx1, KICKED_BOARD.z, FENCE_H) };
  // Plank piles, just inside and just outside the gap.
  for (const [dx, dz, yaw] of [[-2.2, 0.4, 0.3], [2.2, -0.5, -0.4]] as const) {
    const x = fx1 + dx, z = KICKED_BOARD.z + dz;
    if (has('fence-plank-pile')) plan.planks.push({ id: 'fence-plank-pile', x, y: g(x, z), z, yaw });
  }

  // The Members' Gate: in its gap, solid.
  if (has('members-gate')) plan.fence.push({ id: 'members-gate', x: fx1, y: g(fx1, MEMBERS_GATE.z) - SINK, z: MEMBERS_GATE.z, yaw: HALF_PI });
  plan.boxes.push({ minX: fx1 - 0.3, maxX: fx1 + 0.3, minZ: mg.lo, maxZ: mg.hi, h: top(fx1, MEMBERS_GATE.z, FENCE_H) });

  // ---- Hedge walls and arches ---------------------------------------------------------------------------------------
  const hedge = dims('hedgerow', has, { w: 4, h: 1.15, d: 1 });
  /** Hedge pieces along a line, gaps (distance along, half width) left open, pieces skipped where `keep` is false. */
  const hedgeLine = (a: readonly [number, number], b: readonly [number, number], gaps: { t: number; half: number }[],
    height: number, keep: (x: number, z: number) => boolean): number => {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    const yaw = yawAlong(ux, uz);
    const s0 = height / hedge.h;
    const edges: [number, number][] = [];
    let at = 0;
    for (const gp of [...gaps].sort((p, q) => p.t - q.t)) {
      if (gp.t - gp.half > at) edges.push([at, gp.t - gp.half]);
      at = gp.t + gp.half;
    }
    if (at < L) edges.push([at, L]);
    let count = 0;
    for (const [s, e] of edges) {
      const len = e - s;
      if (len < 1.5) continue;
      const n = Math.max(1, Math.round(len / (hedge.w * s0)));
      const sc = len / n / hedge.w;
      let runStart = -1;
      let runEnd = -1;
      const flush = (): void => {
        if (runStart < 0) return;
        const ax = a[0] + ux * runStart, az = a[1] + uz * runStart, bx = a[0] + ux * runEnd, bz = a[1] + uz * runEnd;
        plan.boxes.push(...runBoxes(ax, az, bx, bz, Math.min(hedge.d * sc * 0.85, HEDGE_T + 0.6), top(ax, az, height)));
        runStart = -1;
      };
      for (let i = 0; i < n; i++) {
        const t0 = s + (len * i) / n, t1 = s + (len * (i + 1)) / n, tc = (t0 + t1) / 2;
        const x = a[0] + ux * tc, z = a[1] + uz * tc;
        const ok = keep(x, z) && keep(a[0] + ux * t0, a[1] + uz * t0) && keep(a[0] + ux * t1, a[1] + uz * t1);
        if (!ok) { flush(); continue; }
        if (has('hedgerow')) plan.hedges.push({ id: 'hedgerow', x, y: g(x, z) - SINK, z, yaw, scale: sc });
        count++;
        if (runStart < 0) runStart = t0;
        runEnd = t1;
      }
      flush();
    }
    return count;
  };

  const sA = ARCH_GAP / 4;
  for (const h of HEDGES) {
    const dx = h.b[0] - h.a[0], dz = h.b[1] - h.a[1];
    const L = Math.hypot(dx, dz);
    const gaps: { t: number; half: number }[] = [];
    for (const ar of HEDGE_ARCHES) {
      const t = ((ar.x - h.a[0]) * dx + (ar.z - h.a[1]) * dz) / L;
      const perp = Math.abs(((ar.x - h.a[0]) * dz - (ar.z - h.a[1]) * dx) / L);
      if (perp > 1 || t < 0 || t > L) continue;
      gaps.push({ t, half: ARCH_GAP / 2 });
      if (has('hedge-arch')) plan.arches.push({ id: 'hedge-arch', x: ar.x, y: g(ar.x, ar.z) - SINK, z: ar.z, yaw: ar.yaw, scale: sA });
      // The arch's two legs are solid; the opening between them stays clear.
      for (const sgn of [-1, 1]) {
        const lx = ar.x + Math.cos(ar.yaw) * 1.45 * sA * sgn, lz = ar.z - Math.sin(ar.yaw) * 1.45 * sA * sgn;
        plan.boxes.push({ minX: lx - 0.65, maxX: lx + 0.65, minZ: lz - 0.65, maxZ: lz + 0.65, h: top(lx, lz, HEDGE_H) });
      }
    }
    hedgeLine(h.a, h.b, gaps, HEDGE_H, () => true);
  }
  // A lower hedge band 2 m inside the fence on the north, west and south sides, broken where a cart path comes close.
  const bx0 = fx0 + 2, bx1 = fx1 - 2, bz0 = fz0 + 2, bz1 = fz1 - 2;
  const offPlay = (x: number, z: number): boolean => !inPlay(x, z, 2) && !nearBuilding(x, z, 3);
  hedgeLine([bx0, bz0], [bx1, bz0], [], 2.4, offPlay);
  hedgeLine([bx0, bz1], [bx1, bz1], [], 2.4, offPlay);
  hedgeLine([bx0, bz0 + 4], [bx0, bz1 - 4], [], 2.4, offPlay);

  // ---- Tall grass (mowable: handed to flora, no collider) -------------------------------------------------------------
  const clear = (x: number, z: number, m: number): boolean => {
    if (nearBuilding(x, z, m + 3) || nearTerrace(x, z, m + 3)) return false;
    for (const l of [...LOST_BALLS, ...MOLEHILLS]) if (Math.hypot(x - l.x, z - l.z) < m + 3) return false;
    for (const h of HOLES) if (Math.max(Math.abs(x - h.tee.x), Math.abs(z - h.tee.z)) < 2.5 + m + 3) return false;
    return true;
  };
  const nearHedge = (x: number, z: number, m: number): boolean => {
    for (const h of HEDGES) if (distToLine([{ x: h.a[0], z: h.a[1] }, { x: h.b[0], z: h.b[1] }], x, z).dist < m) return true;
    return false;
  };
  const bandOk = (x: number, z: number): boolean => {
    if (!inYard(x, z, 5) || inPlay(x, z, 1) || !clear(x, z, 0) || nearHedge(x, z, 3.5)) return false;
    for (const h of HOLES) {
      const d = distToLine(h.path, x, z).dist - h.fairwayWidth / 2;
      if (d >= 4 && d <= 10) return true;
    }
    return false;
  };
  const grassKinds: [string, number, number][] = [['ornamental-grass', 0.9, 1.5], ['reed-bed', 0.8, 1.2]];
  const addGrass = (x: number, z: number): void => {
    const [id, lo, hi] = grassKinds[rnd() < 0.62 ? 0 : 1];
    if (!has(id)) return;
    plan.grass.push({ id, x, y: g(x, z), z, yaw: rnd() * Math.PI * 2, scale: lo + rnd() * (hi - lo) });
  };
  for (let x = YARD.minX + 6; x < YARD.maxX - 6; x += 2.5) {
    for (let z = YARD.minZ + 6; z < YARD.maxZ - 6; z += 2.5) {
      const jx = x + (rnd() - 0.5) * 1.8, jz = z + (rnd() - 0.5) * 1.8;
      if (rnd() < 0.72 && bandOk(jx, jz)) addGrass(jx, jz);
    }
  }
  for (const h of HOLES) {
    const gr = h.green;
    const n = Math.round((Math.PI * 2 * (gr.r + 8)) / 2.5);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rnd() * 0.1, rr = gr.r + 6 + rnd() * 4;
      const x = gr.x + Math.cos(ang) * rr, z = gr.z + Math.sin(ang) * rr;
      if (inYard(x, z, 5) && !inPlay(x, z, 1) && clear(x, z, 0) && !nearHedge(x, z, 3.5) && rnd() < 0.8) addGrass(x, z);
    }
  }

  // ---- Giant plants (soft) -------------------------------------------------------------------------------------------
  const kinds = [
    { id: 'giant-hosta', fb: { w: 3.2, h: 2.4, d: 3.2 } }, { id: 'giant-fern', fb: { w: 3, h: 2.8, d: 3 } },
    { id: 'giant-foxglove', fb: { w: 1.2, h: 4, d: 1.2 } }, { id: 'giant-grass-blade', fb: { w: 1.2, h: 2, d: 1.2 } },
    { id: 'giant-flower', fb: { w: 1.2, h: 2.5, d: 1.2 } },
  ].filter((k) => has(k.id));
  const giantOk = (x: number, z: number): boolean => inYard(x, z, 5) && !inPlay(x, z, 3) && !nearHedge(x, z, 4) && !nearBuilding(x, z, 4)
    && !nearTerrace(x, z, 4) && !(x > YARD.maxX - 14 && Math.abs(z - MEMBERS_GATE.z) < 8);
  const roughOk = (x: number, z: number): boolean => HOLES.every((h) => distToLine(h.path, x, z).dist - h.fairwayWidth / 2 > 10);
  const wanted = 110;
  let tries = 0;
  const giantsAt: { x: number; z: number }[] = [];
  while (kinds.length && giantsAt.length < wanted && tries++ < 4000) {
    const middle = rnd() < 0.5;
    const cx = middle ? -1240 + rnd() * 130 : YARD.minX + 6 + rnd() * (YARD.maxX - YARD.minX - 12);
    const cz = middle ? 520 + rnd() * 220 : YARD.minZ + 6 + rnd() * (YARD.maxZ - YARD.minZ - 12);
    if (!middle && !roughOk(cx, cz)) continue;
    if (!giantOk(cx, cz)) continue;
    const members = 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < members && giantsAt.length < wanted; i++) {
      const ang = rnd() * Math.PI * 2, rr = 1 + rnd() * 3.5;
      const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr;
      if (!giantOk(x, z) || giantsAt.some((o) => Math.hypot(o.x - x, o.z - z) < 1.8)) continue;
      const k = kinds[Math.floor(rnd() * kinds.length)];
      const d = dims(k.id, has, k.fb);
      const sc = 1.2 + rnd() * 1.0;
      plan.giants.push({ id: k.id, x, y: g(x, z), z, yaw: rnd() * Math.PI * 2, scale: sc });
      plan.soft.push({ x, z, r: 0.4 * Math.max(d.w, d.d) * sc });
      giantsAt.push({ x, z });
    }
  }

  // ---- Sprinkler heads: green edges and fairway sides --------------------------------------------------------------
  if (has('sprinkler-head')) {
    const put = (x: number, z: number): void => { plan.sprinklers.push({ id: 'sprinkler-head', x, y: g(x, z), z, yaw: rnd() * Math.PI * 2 }); };
    HOLES.forEach((h, i) => {
      const a0 = i * 0.9;
      for (const da of [0, Math.PI]) put(h.green.x + Math.cos(a0 + da) * (h.green.r + 3.6), h.green.z + Math.sin(a0 + da) * (h.green.r + 3.6));
    });
    for (const [i, side] of [[0, 1], [2, -1]] as const) {
      const h = HOLES[i];
      const p = h.path;
      const mid = { x: (p[0].x + p[1].x) / 2, z: (p[0].z + p[1].z) / 2 };
      put(mid.x, mid.z + side * (h.fairwayWidth / 2 + 1.5));
    }
  }

  return plan;
}

function nearBuilding(x: number, z: number, m: number): boolean {
  for (const b of [CLUBHOUSE, PRO_COTTAGE, SHED, CART_SHELTER]) {
    const r = Math.max(b.w, b.d) / 2 + m;
    if (Math.abs(x - b.x) < r && Math.abs(z - b.z) < r) return true;
  }
  return false;
}

function nearTerrace(x: number, z: number, m: number): boolean {
  return x > TERRACE.minX - m && x < TERRACE.maxX + m && z > TERRACE.minZ - m && z < TERRACE.maxZ + m;
}

/** A flat ribbon lying on the ground along a polyline, on a draw layer. */
function ribbon(pts: [number, number][], width: number, color: number, layer: number, lift: number, name: string): THREE.Mesh {
  const pos: number[] = [];
  const idx: number[] = [];
  pts.forEach(([x, z], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    for (const sgn of [-1, 1]) {
      const px = x + (-dz / l) * (width / 2) * sgn, pz = z + (dx / l) * (width / 2) * sgn;
      pos.push(px, heightAt(px, pz) + lift, pz);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  flatLayer(mat, layer);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  return mesh;
}

function straight(ax: number, az: number, bx: number, bz: number, step = 2): [number, number][] {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
  return Array.from({ length: n + 1 }, (_, i) => [ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n] as [number, number]);
}

let warned = false;
const BUILT = (id: string): boolean => !!getPrefab(id);

export function buildYard(scene: THREE.Scene, opts: { boardBroken: boolean }): YardScenery {
  const plan = planYard(BUILT);
  const missing = ['board-fence-panel', 'kicked-board-panel', 'fence-plank-pile', 'members-gate', 'giant-hosta', 'giant-fern',
    'giant-foxglove', 'sprinkler-head', 'giant-grass-blade', 'giant-flower', 'hedgerow', 'hedge-arch'].filter((id) => !getPrefab(id));
  if (missing.length && !warned) { warned = true; console.warn(`hedgeworth yard: missing prefabs: ${missing.join(', ')}`); }

  const root = new THREE.Group();
  root.name = 'hedgeworth-yard';
  scene.add(root);
  const batch = (places: Place[], name: string, cls: 'prop' | 'tree' | 'detail'): void => {
    if (places.length) root.add(buildStaticCells(places, { lights: false, name, cls }));
  };
  batch(plan.fence, 'hedgeworth-fence', 'prop');
  batch([...plan.hedges, ...plan.arches], 'hedgeworth-hedges', 'tree');
  batch(addMowablePlants(plan.grass), 'hedgeworth-grass', 'detail');
  batch(plan.giants, 'hedgeworth-giants', 'tree');
  batch(plan.sprinklers, 'hedgeworth-sprinklers', 'detail');

  // The Kicked Board's panels and plank piles live in their own group so they can be hidden and shown.
  const standing = new THREE.Group();
  standing.name = 'kicked-board';
  for (const p of plan.kickedPanels) {
    const o = buildPrefab(p.id, { lights: false });
    o.position.set(p.x, p.y ?? 0, p.z);
    o.rotation.y = p.yaw ?? 0;
    standing.add(o);
  }
  const planks = new THREE.Group();
  planks.name = 'kicked-board-planks';
  for (const p of plan.planks) {
    const o = buildPrefab(p.id, { lights: false });
    o.position.set(p.x, p.y ?? 0, p.z);
    o.rotation.y = p.yaw ?? 0;
    planks.add(o);
  }
  root.add(standing, planks);
  let broken = false;
  const breakBoard = (): void => {
    if (broken) return;
    broken = true;
    standing.visible = false;
    planks.visible = true;
  };
  standing.visible = true;
  planks.visible = false;
  if (opts.boardBroken) breakBoard();

  // The gate's plates, and the two ways in: the members' gravel and everybody's trampled track.
  const fx = YARD.maxX - FENCE_INSET;
  const gateFront = getPrefab('members-gate') ? prefabBox('members-gate').max.z : 0.2;
  const px = fx + gateFront + 0.03;
  root.add(textPlate('MEMBERS ONLY', px, 2.1, MEMBERS_GATE.z, HALF_PI, { w: 1.6, h: 0.45, bg: 0x1f3d2a, fg: 0xe8d28a }));
  root.add(textPlate('NON-MEMBERS: PLEASE USE THE OTHER SIDE OF THE FENCE', px, 1.2, MEMBERS_GATE.z + 3.2, HALF_PI,
    { w: 0.7, h: 0.5, bg: 0xf2e8c8 }));
  const edge = px + 0.1;
  root.add(ribbon(straight(-950, MEMBERS_GATE.z, edge, MEMBERS_GATE.z), 3, 0xb4ab98, LAYER.road, 0.04, 'members-approach'));
  root.add(ribbon(straight(-950, KICKED_BOARD.z, edge, KICKED_BOARD.z), 2.5, 0x4f6f2c, LAYER.tint, 0.03, 'trampled-track'));

  return { boxes: plan.boxes, boardBox: plan.boardBox, breakBoard, soft: plan.soft, update() {} };
}
