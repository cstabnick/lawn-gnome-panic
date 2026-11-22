// Town walks: in every town a walker can get from the centre to every lane, doorway and landmark, except where a
// building, fence, wall or water is meant to be in the way (src/townBlocks.ts says which, and why). A gap found here is
// fixed in the zone's level data, not in the pathfinder.
import { describe, expect, it } from 'vitest';
import { OBJECTS, QUESTS, ZONES } from './content';
import { findPath3 } from './pathfind';
import { state } from './state';
import { heightAt, standY } from './terrain';
import { createTerrain } from './terrainCore';
import { TOWN_BLOCKS, TOWN_ROAD_BLOCKS } from './townBlocks';
import { TOWNS, townWaypoints, type Town, type TownWaypoint } from './towns';
import { loadWorldDeltas } from './worldDeltas';
import { loadWorldPaint } from './worldPaint';

const CELL = 0.5;
const REACH_RADIUS = 1.5;
const MARGIN = 12;
const ROAD_STEP = 2;
const WALK_TARGETS = 6;

// One terrain, every gate open, with the shipped brush edits and paint (no baked grid: always the live answer).
const terrain = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
const deltas = loadWorldDeltas();
if (deltas) terrain.setDeltas(deltas);
const paint = loadWorldPaint();
if (paint) terrain.setPaint(paint);

interface Fill {
  start: { x: number; z: number };
  reachedNear(x: number, z: number): boolean;
}

/** 4-connected flood fill over isBlocked, 0.5 m cells, from the free spot nearest the town centre, inside the town
 * circle plus MARGIN. */
function floodTown(town: Town): Fill {
  const half = town.r + MARGIN;
  const minX = town.x - half;
  const minZ = town.z - half;
  const n = Math.ceil((2 * half) / CELL);
  const st = new Uint8Array(n * n); // 0 untested, 1 visited, 2 blocked or outside
  const queue = new Int32Array(n * n);
  let tail = 0;
  const cx = (i: number) => minX + (i + 0.5) * CELL;
  const cz = (j: number) => minZ + (j + 0.5) * CELL;
  const push = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= n || j >= n) return;
    const k = i * n + j;
    if (st[k] !== 0) return;
    const x = cx(i);
    const z = cz(j);
    if (Math.hypot(x - town.x, z - town.z) > half || terrain.isBlocked(x, z)) {
      st[k] = 2;
      return;
    }
    st[k] = 1;
    queue[tail++] = k;
  };
  const start = terrain.findFreeSpot(town.x, town.z);
  // The free spot is free, but the centre of the 0.5 m cell holding it may not be: seed from the nearest free cell centre.
  const si = Math.floor((start.x - minX) / CELL);
  const sj = Math.floor((start.z - minZ) / CELL);
  let seed: [number, number] | null = null;
  let bestD = Infinity;
  for (let i = si - 2; i <= si + 2; i++) {
    for (let j = sj - 2; j <= sj + 2; j++) {
      const d = Math.hypot(cx(i) - start.x, cz(j) - start.z);
      if (d < bestD && !terrain.isBlocked(cx(i), cz(j))) {
        bestD = d;
        seed = [i, j];
      }
    }
  }
  if (seed) push(seed[0], seed[1]);
  for (let head = 0; head < tail; head++) {
    const k = queue[head];
    const i = (k / n) | 0;
    const j = k - i * n;
    push(i - 1, j);
    push(i + 1, j);
    push(i, j - 1);
    push(i, j + 1);
  }
  const span = Math.ceil((REACH_RADIUS + CELL) / CELL);
  return {
    start,
    reachedNear(x, z) {
      const ci = Math.floor((x - minX) / CELL);
      const cj = Math.floor((z - minZ) / CELL);
      for (let i = ci - span; i <= ci + span; i++) {
        for (let j = cj - span; j <= cj + span; j++) {
          if (i < 0 || j < 0 || i >= n || j >= n || st[i * n + j] !== 1) continue;
          if (Math.hypot(cx(i) - x, cz(j) - z) <= REACH_RADIUS) return true;
        }
      }
      return false;
    },
  };
}

/** Road samples every ROAD_STEP metres along every road segment, kept when inside the town circle. */
function roadSamples(town: Town): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (const s of terrain.roadSegments()) {
    const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
    const steps = Math.max(1, Math.floor(len / ROAD_STEP));
    for (let k = 0; k <= steps; k++) {
      const f = Math.min(1, (k * ROAD_STEP) / Math.max(len, 1e-6));
      const x = s.ax + (s.bx - s.ax) * f;
      const z = s.az + (s.bz - s.az) * f;
      if (Math.hypot(x - town.x, z - town.z) <= town.r) out.push({ x, z });
    }
  }
  return out;
}

/** Walks a findPath3 path with the game's own standY (as pathfind.test.ts does). */
function simulateWalk(from: { x: number; z: number }, to: { x: number; z: number }) {
  const fy = heightAt(from.x, from.z);
  const ty = heightAt(to.x, to.z);
  const path = findPath3({ x: from.x, y: fy, z: from.z }, { x: to.x, y: ty, z: to.z }, standY);
  let x = from.x;
  let y = fy;
  let z = from.z;
  const remaining = [...path];
  let steps = 0;
  let stuck = false;
  while (remaining.length > 0 && steps < 8000) {
    steps++;
    const wp = remaining[0];
    const dx = wp.x - x;
    const dz = wp.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.1) {
      remaining.shift();
      continue;
    }
    const stepLen = Math.min(dist, 0.25);
    let nx = x + (dx / dist) * stepLen;
    let nz = z + (dz / dist) * stepLen;
    let ny = standY(nx, nz, y);
    if (ny === null) {
      const sx = Math.abs(dx) > 1e-4 ? standY(nx, z, y) : null;
      const sz = Math.abs(dz) > 1e-4 ? standY(x, nz, y) : null;
      if (sx !== null && (sz === null || Math.abs(dx) >= Math.abs(dz))) {
        nz = z;
        ny = sx;
      } else if (sz !== null) {
        nx = x;
        ny = sz;
      } else {
        stuck = true;
        break;
      }
    }
    x = nx;
    y = ny;
    z = nz;
    if (Math.hypot(wp.x - x, wp.z - z) <= 0.1) remaining.shift();
  }
  return { stuck, endDist: Math.hypot(x - to.x, z - to.z), at: { x, z } };
}

/** Up to WALK_TARGETS reached waypoints spread round the town: the farthest one in each angular sector, then the
 * farthest of the rest if some sectors are empty. */
function spreadTargets(town: Town, list: TownWaypoint[]): TownWaypoint[] {
  const far = (w: TownWaypoint) => Math.hypot(w.x - town.x, w.z - town.z);
  const sectors: TownWaypoint[][] = Array.from({ length: WALK_TARGETS }, () => []);
  for (const w of list) {
    const a = (Math.atan2(w.z - town.z, w.x - town.x) + Math.PI * 2) % (Math.PI * 2);
    sectors[Math.min(WALK_TARGETS - 1, Math.floor((a / (Math.PI * 2)) * WALK_TARGETS))].push(w);
  }
  const picked: TownWaypoint[] = [];
  for (const s of sectors) if (s.length) picked.push(s.sort((a, b) => far(b) - far(a))[0]);
  const rest = list.filter((w) => !picked.includes(w)).sort((a, b) => far(b) - far(a));
  while (picked.length < WALK_TARGETS && rest.length) picked.push(rest.shift()!);
  return picked;
}

const fills = new Map<string, Fill>();
const fillFor = (town: Town): Fill => {
  let f = fills.get(town.id);
  if (!f) fills.set(town.id, (f = floodTown(town)));
  return f;
};

describe('town walks', () => {
  it('every TOWN_BLOCKS and TOWN_ROAD_BLOCKS entry names a real town and has a reason', () => {
    const ids = new Set(TOWNS.map((t) => t.id));
    for (const b of [...TOWN_BLOCKS, ...TOWN_ROAD_BLOCKS]) {
      expect(ids.has(b.town), b.town).toBe(true);
      expect(b.reason.trim().length, `${b.town} reason`).toBeGreaterThan(0);
    }
  });

  for (const town of TOWNS) {
    describe(town.id, () => {
      it('every waypoint is reached unless TOWN_BLOCKS says it is blocked on purpose', { timeout: 120000 }, () => {
        const fill = fillFor(town);
        const wps = townWaypoints(town);
        expect(wps.length).toBeGreaterThan(0);
        const unreached = wps.filter((w) => !fill.reachedNear(w.x, w.z));
        const detail = unreached.map((w) => `${w.id} (${w.x.toFixed(1)}, ${w.z.toFixed(1)})`).join(', ');
        expect(unreached.map((w) => w.id).sort(), `unreached: ${detail}`).toEqual(
          TOWN_BLOCKS.filter((b) => b.town === town.id).map((b) => b.waypoint).sort(),
        );
      });

      it('every road sample in town is reached unless inside a TOWN_ROAD_BLOCKS circle', { timeout: 120000 }, () => {
        const fill = fillFor(town);
        const blocks = TOWN_ROAD_BLOCKS.filter((b) => b.town === town.id);
        const bad = roadSamples(town).filter(
          (p) => !fill.reachedNear(p.x, p.z) && !blocks.some((b) => Math.hypot(p.x - b.x, p.z - b.z) <= b.r),
        );
        expect(bad.length, `unreached road samples: ${bad.map((p) => `(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`).join(' ')}`).toBe(0);
        // A road block that covers no unreached sample is stale.
        const samples = roadSamples(town).filter((p) => !fill.reachedNear(p.x, p.z));
        for (const b of blocks) {
          expect(samples.some((p) => Math.hypot(p.x - b.x, p.z - b.z) <= b.r), `stale road block ${b.reason}`).toBe(true);
        }
      });

      it('click-to-move from the centre walks to waypoints all round town', { timeout: 120000 }, () => {
        for (const id of Object.keys(QUESTS)) state.quests[id] = { stage: 99, count: 0, done: true };
        const fill = fillFor(town);
        const reached = townWaypoints(town).filter((w) => fill.reachedNear(w.x, w.z));
        const targets = spreadTargets(town, reached);
        expect(targets.length).toBe(WALK_TARGETS);
        for (const w of targets) {
          const res = simulateWalk(fill.start, w);
          const where = `${town.id} -> ${w.id} ended at (${res.at.x.toFixed(1)}, ${res.at.z.toFixed(1)})`;
          expect(res.stuck, where).toBe(false);
          expect(res.endDist, where).toBeLessThan(REACH_RADIUS);
        }
      });
    });
  }
});
