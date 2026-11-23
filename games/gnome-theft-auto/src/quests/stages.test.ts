// Checks every stage spot in stages.ts against the world as the game builds it: inside the map, in the region it says,
// on land (unless a boat scene), not inside a building collider, cameras clear with a view of what they look at, idle
// walks and vehicle paths that do not go through anything, and road-following vehicle paths that stay on the roads.
// Every failure is listed at once, with the position, so a spot can be moved and the test run again:
//   npx vitest run src/quests/stages.test.ts      (from games/gnome-theft-auto)
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { normalizeLoadout } from '@lawn/glaze';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';

installFakeDom();
const { buildWorld } = await import('../world');
const { heightAt, slopeAt, waterAt } = await import('../terrain');
const { bridgeDeckAt } = await import('../water');
const { regionAt, highways, trails, LAYOUT } = await import('../levels');
const { pushOutOfBoxes, insideBox } = await import('../collide');
const { CITY_HALF, ROAD_LINES, ROAD_WIDTH } = await import('../config');
const { GIVERS, QUESTS } = await import('./defs');
const { CAST, STAGES, stageSetBoxes, vehicleMark } = await import('./stages');
type XZ = readonly [number, number];

const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
/** Building colliders plus the stage set dressing's own solid props. */
const BOXES: Box[] = [...world.boxes, ...stageSetBoxes()];
const EDGE = LAYOUT.fenceEdge - 3;
const BOATS = new Set(['walnut-dinghy', 'gravy-boat', 'clog-cruiser', 'watering-can-steamer', 'hoa-patrol-boat', 'tessie']);
const FLYERS = new Set(['plane', 'whirligig']);
const ROADS = [...highways(), ...trails().map((t) => ({ ...t, width: t.width || 6 }))];

const f = (n: number): string => n.toFixed(1);
/** Fail with every problem on its own line (a plain list diff would be cut short). */
function report(problems: readonly string[]): void {
  if (problems.length) throw new Error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  expect(problems).toEqual([]);
}
const inMap = (x: number, z: number): boolean => Math.abs(x) <= EDGE && Math.abs(z) <= EDGE;
/** Water here, and no bridge deck over it. */
const wet = (x: number, z: number): boolean => waterAt(x, z) !== null && bridgeDeckAt(x, z) === null;
const blocked = (x: number, z: number, r: number): boolean => pushOutOfBoxes(x, z, r, BOXES, heightAt(x, z) + 0.05).hit;

function onRoad(x: number, z: number): boolean {
  if (Math.abs(x) <= CITY_HALF + 2 && Math.abs(z) <= CITY_HALF + 2) {
    for (const r of ROAD_LINES) if (Math.abs(x - r) <= ROAD_WIDTH / 2 + 1 || Math.abs(z - r) <= ROAD_WIDTH / 2 + 1) return true;
  }
  for (const h of ROADS) {
    for (let i = 0; i < h.points.length - 1; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const l = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (l || 1)));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) <= h.width / 2 + 1) return true;
    }
  }
  return false;
}

/** Points every `step` m along a polyline (the corners included). */
function samples(points: readonly XZ[], step: number, loop = false): XZ[] {
  const pts = loop && points.length > 2 ? [...points, points[0]] : points;
  const out: XZ[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  if (pts.length) out.push(pts[pts.length - 1]);
  return out;
}

/** The first point where the segment from a to b (absolute heights) passes through a collider, or null. */
function sightBlocked(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 | null {
  const n = Math.ceil(a.distanceTo(b) / 0.5);
  const p = new THREE.Vector3();
  // Skip the last metre: the target itself may stand right against a wall.
  for (let k = 1; k < n - 2; k++) {
    p.lerpVectors(a, b, k / n);
    if (insideBox(p.x, p.y, p.z, BOXES) || p.y < heightAt(p.x, p.z) - 0.2) return p.clone();
  }
  return null;
}

describe('stage data', () => {
  it('ids are unique and every reference resolves', () => {
    const bad: string[] = [];
    const ids = new Set<string>();
    for (const s of STAGES) {
      if (ids.has(s.id)) bad.push(`duplicate stage id ${s.id}`);
      ids.add(s.id);
      for (const g of s.givers ?? []) if (!GIVERS[g]) bad.push(`${s.id}: unknown giver ${g}`);
      for (const v of s.vehicles) if (vehicleMark(v.id)?.mark !== v) bad.push(`${s.id}: vehicle mark id ${v.id} is used twice`);
      for (const p of s.set) if (!getPrefab(p.prefab)) bad.push(`${s.id}: set prefab ${p.prefab} does not exist`);
    }
    for (const c of CAST) {
      if (!ids.has(c.home)) bad.push(`cast ${c.id}: home ${c.home} is not a stage`);
      for (const h of c.haunts) if (!ids.has(h)) bad.push(`cast ${c.id}: haunt ${h} is not a stage`);
      if (c.vehicle) {
        const vm = vehicleMark(c.vehicle.parkedAt);
        if (!vm) bad.push(`cast ${c.id}: parkedAt ${c.vehicle.parkedAt} is not a vehicle mark`);
        else if (vm.mark.kind !== c.vehicle.kind) bad.push(`cast ${c.id}: parkedAt ${c.vehicle.parkedAt} is a ${vm.mark.kind}, not a ${c.vehicle.kind}`);
        if (c.vehicle.glaze) {
          const n = normalizeLoadout(c.vehicle.glaze) as unknown as Record<string, unknown>;
          for (const [k, v] of Object.entries(c.vehicle.glaze)) {
            if (JSON.stringify(n[k]) !== JSON.stringify(v)) bad.push(`cast ${c.id}: glaze.${k} ${JSON.stringify(v)} is not a valid value`);
          }
        }
      }
    }
    report(bad);
  });

  it('every giver and every quest has a stage', () => {
    const givers = new Set(STAGES.flatMap((s) => s.givers ?? []));
    const used = new Set(STAGES.flatMap((s) => s.usedBy));
    const missing = [
      ...Object.keys(GIVERS).filter((g) => !givers.has(g)).map((g) => `giver ${g}`),
      ...QUESTS.filter((q) => !used.has(q.id)).map((q) => `quest ${q.id}`),
    ];
    report(missing);
  });

  it('every off-map cutscene room has an in-world stage', () => {
    const rooms = new Set(STAGES.map((s) => s.room).filter(Boolean));
    const missing = ['mulch-club', 'side-valve', 'cloverfield-barn', 'unmowed-hollow', 'fells-shrine', 'dust-overlook'].filter((r) => !rooms.has(r as never));
    report(missing);
  });
});

describe('stage spots on the map', () => {
  for (const s of STAGES) {
    it(s.id, () => {
      const bad: string[] = [];
      const spot = (label: string, [x, z]: XZ, r: number, opts: { water?: boolean; slope?: number } = {}): void => {
        if (!inMap(x, z)) { bad.push(`${label} [${f(x)}, ${f(z)}] is off the map`); return; }
        const isWet = wet(x, z);
        if (isWet && !opts.water) bad.push(`${label} [${f(x)}, ${f(z)}] is in water`);
        if (!isWet && blocked(x, z, r)) {
          const p = pushOutOfBoxes(x, z, r, BOXES, heightAt(x, z) + 0.05);
          bad.push(`${label} [${f(x)}, ${f(z)}] is inside a collider (nearest clear spot ~[${f(p.x)}, ${f(p.z)}])`);
        }
        if (!isWet && opts.slope !== undefined && slopeAt(x, z) > opts.slope) bad.push(`${label} [${f(x)}, ${f(z)}] is on a slope of ${slopeAt(x, z).toFixed(2)}`);
      };

      if (regionAt(s.center[0], s.center[1]) !== s.region) bad.push(`center is in ${regionAt(s.center[0], s.center[1])}, not ${s.region}`);
      spot('center', s.center, 0.5, { water: s.water });
      for (const m of s.marks) {
        if (m.lift) { if (!inMap(m.at[0], m.at[1])) bad.push(`mark ${m.who} is off the map`); }
        else spot(`mark ${m.who}`, m.at, 0.45, { water: s.water, slope: 0.45 });
      }
      for (const v of s.vehicles) {
        const boat = BOATS.has(v.kind);
        if (boat && !wet(v.at[0], v.at[1])) bad.push(`vehicle ${v.id} (${v.kind}) [${f(v.at[0])}, ${f(v.at[1])}] is a boat on dry land`);
        spot(`vehicle ${v.id}`, v.at, FLYERS.has(v.kind) || v.kind === 'combine' ? 2.2 : 1.3, { water: boat, slope: 0.4 });
      }
      for (const w of s.walks) {
        if (w.points.length < 2) bad.push(`walk ${w.who} needs two points`);
        const before = bad.length;
        for (const p of samples(w.points, 0.5, w.loop)) spot(`walk ${w.who}`, p, 0.35, { water: s.water, slope: 0.6 });
        if (bad.length - before > 3) bad.splice(before + 3, bad.length - before - 3, `walk ${w.who}: ... more points fail along this walk`);
      }
      for (const p of s.paths) {
        const boat = BOATS.has(p.kind);
        const fly = FLYERS.has(p.kind);
        if (p.points.length < 2) bad.push(`path ${p.id} needs two points`);
        const pts = samples(p.points, 1);
        let roadHits = 0;
        const fails = new Set<string>();
        for (const q of pts) {
          if (!inMap(q[0], q[1])) { fails.add(`off the map at [${f(q[0])}, ${f(q[1])}]`); continue; }
          if (fly) continue;
          const w = wet(q[0], q[1]);
          if (boat && !w) fails.add(`boat on land at [${f(q[0])}, ${f(q[1])}]`);
          if (!boat && w) fails.add(`in water at [${f(q[0])}, ${f(q[1])}]`);
          if (!w && blocked(q[0], q[1], p.kind === 'combine' ? 1.8 : 1.0)) fails.add(`through a collider at [${f(q[0])}, ${f(q[1])}]`);
          if (onRoad(q[0], q[1])) roadHits++;
        }
        if (!boat && !fly && !p.offRoad && roadHits < pts.length * 0.75) fails.add(`only ${Math.round((100 * roadHits) / pts.length)}% on roads (needs 75%, or offRoad: true)`);
        for (const msg of [...fails].slice(0, 4)) bad.push(`path ${p.id}: ${msg}`);
      }
      for (const p of s.set) {
        if (!inMap(p.at[0], p.at[1])) bad.push(`set ${p.prefab} [${f(p.at[0])}, ${f(p.at[1])}] is off the map`);
        else if (wet(p.at[0], p.at[1]) && !s.water) bad.push(`set ${p.prefab} [${f(p.at[0])}, ${f(p.at[1])}] is in water`);
        else if (pushOutOfBoxes(p.at[0], p.at[1], 0.3, world.boxes, heightAt(p.at[0], p.at[1]) + 0.05).hit) bad.push(`set ${p.prefab} [${f(p.at[0])}, ${f(p.at[1])}] is inside a building collider`);
      }
      for (const c of s.cameras) {
        const [x, h, z] = c.from;
        if (!inMap(x, z)) { bad.push(`camera ${c.id} is off the map`); continue; }
        const from = new THREE.Vector3(x, heightAt(x, z) + h, z);
        const look = new THREE.Vector3(c.look[0], heightAt(c.look[0], c.look[2]) + c.look[1], c.look[2]);
        if (h < 0.3) bad.push(`camera ${c.id} is less than 0.3 m above the ground`);
        if (insideBox(from.x, from.y, from.z, BOXES)) bad.push(`camera ${c.id} [${f(x)}, ${f(h)}, ${f(z)}] is inside a collider`);
        const hit = sightBlocked(from, look);
        if (hit) bad.push(`camera ${c.id}: the view to [${c.look.join(', ')}] is blocked at [${f(hit.x)}, ${f(hit.y)}, ${f(hit.z)}]`);
      }
      report(bad);
    });
  }
});
