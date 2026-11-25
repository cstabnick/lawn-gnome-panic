// Roadside life along the outer band roads (E31): lay-bys, fingerposts, milestones, bus shelters, wayside shrines,
// a lone phone box, field gates and drystone walls. Planned as pure data (planRoadside), placed in one culled batch.
import * as THREE from 'three';
import { HIGHWAYS } from '../config';
import { reservedRects } from '../sites';
import { heightAt, waterAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import type { Box } from '../types';
import { HAMLETS, HIGH_TARN } from './config';
import { placePieces, roadDist, seeded, type Piece } from './place';

export interface RoadsideText { text: string; x: number; y: number; z: number; yaw: number; w: number; h: number }

const ROADS = [
  'north-band', 'north-band-east', 'west-band-north', 'west-band-south', 'wicket-north-approach', 'vineyard-lane',
  'south-band', 'south-band-east', 'harbour-road', 'unmown-road',
] as const;

/** Where a road's milestones point: the nearest target wins. `per` is metres per joke unit. */
interface Target { name: string; x: number; z: number; per: number; unit: string }
const TARGETS: Record<string, readonly Target[]> = {
  'north-band': [{ name: 'PARDONLIN', x: 20, z: -870, per: 100, unit: 'BAGUETTES' }, { name: 'SNOWCAP RISE', x: 40, z: -1060, per: 200, unit: 'FURLONGS' }],
  'north-band-east': [
    { name: 'MITTENHOLT', x: 550, z: -1375, per: 200, unit: 'FURLONGS' }, { name: 'THE HIGH TARN', x: 1000, z: -1600, per: 150, unit: 'WHISTLES' },
  ],
  'west-band-north': [{ name: 'TRELLISDOWN', x: -950, z: -46, per: 120, unit: 'TROWELS' }, { name: 'THE UNMOWN', x: -950, z: -950, per: 300, unit: 'STROLLS' }],
  'west-band-south': [{ name: 'TRELLISDOWN', x: -950, z: -14, per: 120, unit: 'TROWELS' }, { name: 'DUNELOW', x: -560, z: 965, per: 200, unit: 'FURLONGS' }],
  'wicket-north-approach': [{ name: 'ESPALIER END', x: -1080, z: -420, per: 150, unit: 'WHISTLES' }],
  'vineyard-lane': [{ name: 'THE VINEYARD', x: -1400, z: -30, per: 100, unit: 'GRAPES' }],
  'south-band': [{ name: 'DUNELOW', x: -560, z: 965, per: 200, unit: 'FURLONGS' }, { name: 'SALTBUCKET', x: 0, z: 960, per: 90, unit: 'PAILS' }],
  'south-band-east': [{ name: 'SALTBUCKET', x: 0, z: 960, per: 90, unit: 'PAILS' }, { name: 'THE DUNES', x: 950, z: 960, per: 150, unit: 'WHISTLES' }],
  'harbour-road': [{ name: 'THE HARBOUR', x: -1400, z: 1000, per: 100, unit: 'KNOTS' }],
  'unmown-road': [{ name: 'THE UNMOWN', x: -1400, z: -1020, per: 300, unit: 'STROLLS' }],
};

type Kind = 'laybay' | 'shelter' | 'shrine' | 'phone' | 'gate';
const KINDS: readonly Kind[] = ['laybay', 'shelter', 'shrine', 'phone', 'gate'];
const TIMETABLES = [
  'BUS: Tuesdays\n(some Tuesdays)', 'SNAIL COACH\nNever on time', 'NEXT BUS\nSoonish', 'BUS: When\nthe moon says',
  'TIMETABLE\nSee other timetable',
];

const MAX_STOPS = 60, MAX_PIECES = 400;
const reserved = reservedRects().map((r) => ({ minX: r.minX - 10, maxX: r.maxX + 10, minZ: r.minZ - 10, maxZ: r.maxZ + 10 }));

function allowed(x: number, z: number): boolean {
  for (const p of [...HAMLETS, HIGH_TARN]) if (Math.hypot(x - p.x, z - p.z) < 90) return false;
  for (const r of reserved) if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return false;
  if (waterAt(x, z)) return false;
  return roadDist(x, z) >= 8.5;
}

const rot = (x: number, z: number, yaw: number): [number, number] => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];

/** Pieces of one stop, in a frame: `o` origin, `t` unit tangent, `n` unit normal away from the road. */
function stopPieces(kind: Kind, o: [number, number], t: [number, number], n: [number, number], rand: () => number, texts: RoadsideText[]): Piece[] {
  const at = (u: number, v: number): [number, number] => [o[0] + t[0] * u + n[0] * v, o[1] + t[1] * u + n[1] * v];
  const toRoad = Math.atan2(-n[0], -n[1]);
  const wallYaw = Math.atan2(-n[1], n[0]); // local +x (the wall's length) runs away from the road
  const out: Piece[] = [];
  const add = (id: string, u: number, v: number, yaw: number, solid = false, scale?: number): [number, number] => {
    const [x, z] = at(u, v);
    out.push({ id, x, z, yaw, solid, ...(scale !== undefined ? { scale } : {}) });
    return [x, z];
  };
  if (kind === 'laybay') {
    add('hamlet-picnic-table', -3, 10, toRoad + (rand() < 0.5 ? 0 : Math.PI / 2), true);
    add('hamlet-picnic-table', 3, 11, toRoad, true);
    add('litter-bin', 6, 10, toRoad, true);
    add('bench', 0, 14, toRoad, true);
  } else if (kind === 'shelter') {
    const [x, z] = add('bus-shelter', 0, 11.5, toRoad, true);
    const [dx, dz] = rot(0, -0.7, toRoad);
    texts.push({ text: TIMETABLES[Math.floor(rand() * TIMETABLES.length)], x: x + dx, y: heightAt(x, z) + 1.5, z: z + dz, yaw: toRoad, w: 1.3, h: 0.55 });
    add('litter-bin', 3.5, 10, toRoad, true);
  } else if (kind === 'shrine') {
    add('wayside-shrine', 0, 10, toRoad, true);
    add('wildflower-patch', -1.2, 9.5, rand() * 6);
    add('wildflower-patch', 1.2, 9.8, rand() * 6);
    add('flower-pot', 0.5, 9.4, 0);
  } else if (kind === 'phone') {
    add('hamlet-phone-box', 0, 15, toRoad, true);
    add('wildflower-patch', 1.5, 14, rand() * 6);
  } else {
    // A field gate (two posts of wall, a gap) with walls running away from the road on one or both sides.
    const len = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < len; i++) {
      add('drystone-wall', -3.5, 9.5 + 3.06 * (i + 0.5), wallYaw, true);
      add('drystone-wall', 3.5, 9.5 + 3.06 * (i + 0.5), wallYaw, true);
    }
  }
  return out;
}

interface Plan { pieces: Piece[]; texts: RoadsideText[] }
let cached: Plan | null = null;

/** The whole roadside layout as data (deterministic, no three.js scene). */
export function planRoadside(): { pieces: Piece[]; texts: RoadsideText[] } {
  if (!cached) cached = computePlan();
  return { pieces: cached.pieces.map((p) => ({ ...p })), texts: cached.texts.map((t) => ({ ...t })) };
}

function computePlan(): Plan {
  const pieces: Piece[] = [];
  const texts: RoadsideText[] = [];
  let stops = 0;
  let prev: Kind | null = null;
  let seed = 31;
  for (const id of ROADS) {
    const road = HIGHWAYS.find((h) => h.id === id);
    if (!road) continue;
    const rand = seeded((seed += 977));
    // Sample the polyline at a distance `s`: point and unit tangent.
    const segs: { a: [number, number]; d: [number, number]; len: number; start: number }[] = [];
    let total = 0;
    for (let i = 0; i + 1 < road.points.length; i++) {
      const [ax, az] = road.points[i], [bx, bz] = road.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len > 0) segs.push({ a: [ax, az], d: [(bx - ax) / len, (bz - az) / len], len, start: total });
      total += len;
    }
    const sample = (s: number): { p: [number, number]; t: [number, number] } | null => {
      for (const g of segs) if (s >= g.start && s <= g.start + g.len) {
        const k = s - g.start;
        return { p: [g.a[0] + g.d[0] * k, g.a[1] + g.d[1] * k], t: g.d };
      }
      return null;
    };
    let side = rand() < 0.5 ? 1 : -1;
    // Stops.
    for (let s = 60 + rand() * 120; s < total - 40; s += 220 + rand() * 80) {
      if (stops >= MAX_STOPS) break;
      const sm = sample(s);
      if (!sm) continue;
      const kinds = KINDS.filter((k) => k !== prev);
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const n: [number, number] = [-sm.t[1] * side, sm.t[0] * side];
      side = -side;
      const o: [number, number] = [sm.p[0], sm.p[1]];
      const local: RoadsideText[] = [];
      const ps = stopPieces(kind, o, sm.t, n, rand, local);
      if (!ps.every((p) => allowed(p.x, p.z)) || pieces.length + ps.length > MAX_PIECES) continue;
      pieces.push(...ps); texts.push(...local);
      stops++; prev = kind;
    }
    // Milestones every ~400 m, on the opposite side to the stops' rhythm, 9.5 m off the centre line.
    const targets = TARGETS[id] ?? [];
    let ms = 0;
    for (let s = 150 + rand() * 100; s < total - 30; s += 380 + rand() * 40) {
      const sm = sample(s);
      if (!sm || targets.length === 0) continue;
      const n: [number, number] = [-sm.t[1] * (ms % 2 ? 1 : -1), sm.t[0] * (ms % 2 ? 1 : -1)];
      ms++;
      const x = sm.p[0] + n[0] * 9.5, z = sm.p[1] + n[1] * 9.5;
      if (!allowed(x, z) || pieces.length >= MAX_PIECES) continue;
      const tg = targets.reduce((b, c) => (Math.hypot(c.x - x, c.z - z) < Math.hypot(b.x - x, b.z - z) ? c : b));
      const n2 = Math.max(1, Math.round(Math.hypot(tg.x - x, tg.z - z) / tg.per));
      const yaw = Math.atan2(-n[0], -n[1]);
      pieces.push({ id: 'milestone', x, z, yaw, solid: true });
      const [dx, dz] = rot(0, 0.16, yaw);
      texts.push({ text: `${tg.name}\n${n2} ${tg.unit}`, x: x + dx, y: heightAt(x, z) + 0.55, z: z + dz, yaw, w: 0.36, h: 0.3 });
    }
  }
  // Fingerposts, 8 m off each band-road junction.
  const junctions: [number, number][] = [[-950, -500], [-950, -30], [-950, -950], [-950, 990], [0, 960]];
  const offs: [number, number][] = [[8, 8], [-8, 8], [8, -8], [-8, -8], [10, 0], [-10, 0], [0, 10], [0, -10]];
  for (const [jx, jz] of junctions) {
    for (const [ox, oz] of offs) {
      const x = jx + ox, z = jz + oz;
      if (!allowed(x, z)) continue;
      pieces.push({ id: 'trail-fingerpost', x, z, yaw: Math.atan2(-ox, -oz) });
      break;
    }
  }
  return { pieces, texts };
}

/** Builds the roadside pieces along the band roads. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildRoadside(scene: THREE.Scene, boxes: Box[]): void {
  const plan = planRoadside();
  placePieces(scene, boxes, plan.pieces, 'roadside');
  for (const t of plan.texts) {
    scene.add(textPlate(t.text, t.x, t.y, t.z, t.yaw, { w: t.w, h: t.h, bg: 0xe8e0c8, fg: 0x2b2116 }));
  }
}
