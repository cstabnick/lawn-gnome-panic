// E33: guard rails along the mountain roads where the ground falls away or a hairpin turns. railRuns() is the pure
// plan (which stretches get a rail); buildGuardRails puts the prefab sections and their colliders in the world, plus the
// white reflector posts along the roads and the red-and-white poles along the Hatband.
import type * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { heightAt } from '../terrain';
import type { Track } from '../raceTrack/trackDef';
import type { Box } from '../types';
import { ALL_PADS, padDistance } from './pads';
import { ALL_ROUTES, ROUTES, routesOfKind, type RouteId } from './routes';

/** One continuous rail: along route `route` from s0 to s1 (s0 < s1), on side `side` (+1 = left of travel, -1 = right). */
export interface RailRun { route: RouteId; side: 1 | -1; s0: number; s1: number }

const SIDES: readonly (1 | -1)[] = [1, -1];
const SECTION = 4;

function nearPad(x: number, z: number, d: number): boolean {
  for (const p of ALL_PADS) if (padDistance(p, x, z) < d) return true;
  return false;
}

function nearOtherRoute(self: Track, x: number, z: number, d: number): boolean {
  for (const t of ALL_ROUTES) {
    if (t === self) continue;
    const b = t.bounds();
    if (x < b.minX - d || x > b.maxX + d || z < b.minZ - d || z > b.maxZ + d) continue;
    if (t.locate(x, z, d)) return true;
  }
  return false;
}

function blockedAt(track: Track, side: 1 | -1, s: number): boolean {
  const r = track.frame(s, side * (track.def.width / 2 + 0.9));
  return nearPad(r.x, r.z, 3) || nearOtherRoute(track, r.x, r.z, 6);
}

let cache: RailRun[] | null = null;

/** Every guard-rail run on every 'road' route. Pure. */
export function railRuns(): RailRun[] {
  if (cache) return cache;
  heightAt(0, 0);
  const out: RailRun[] = [];
  for (const id of routesOfKind('road')) {
    const track = ROUTES[id];
    const w = track.def.width;
    const samples = track.samples();
    const len = track.length();
    for (const side of SIDES) {
      const marked: boolean[] = samples.map((sm) => {
        const far = track.frame(sm.s, side * (w / 2 + 6));
        const drop = track.roadTopAt(sm, side * w / 2) - heightAt(far.x, far.z) >= 1.5;
        const bend = Math.abs(sm.curv) >= 0.04 && side === (sm.curv > 0 ? -1 : 1);
        if (!drop && !bend) return false;
        if (sm.s < 12 || sm.s > len - 12) return false;
        return !blockedAt(track, side, sm.s);
      });
      const stretches: [number, number][] = [];
      let i = 0;
      while (i < samples.length) {
        if (!marked[i]) { i++; continue; }
        let j = i;
        while (j + 1 < samples.length && marked[j + 1]) j++;
        stretches.push([samples[i].s, samples[j].s]);
        i = j + 1;
      }
      // join stretches under 6 m apart, unless a pad or another route sits in the gap
      const joined: [number, number][] = [];
      for (const st of stretches) {
        const last = joined[joined.length - 1];
        if (last && st[0] - last[1] < 6 && bridgeClear(track, side, last[1], st[0])) last[1] = st[1];
        else joined.push([st[0], st[1]]);
      }
      for (const [s0, s1] of joined) if (s1 - s0 >= 8) out.push({ route: id, side, s0, s1 });
    }
  }
  cache = out;
  return out;
}

function bridgeClear(track: Track, side: 1 | -1, a: number, b: number): boolean {
  for (let s = a; s <= b; s += 1) if (blockedAt(track, side, s)) return false;
  return true;
}

function sectionCount(r: RailRun): number { return Math.max(1, Math.floor((r.s1 - r.s0) / SECTION)); }

/** Rail length per road and run count. Pure. */
export function railStats(): { route: string; metres: number; runs: number }[] {
  const runs = railRuns();
  return routesOfKind('road').map((id) => {
    const mine = runs.filter((r) => r.route === id);
    return { route: id, metres: mine.reduce((a, r) => a + sectionCount(r) * SECTION, 0), runs: mine.length };
  });
}

function railNear(runs: RailRun[], route: RouteId, side: number, s: number, d: number): boolean {
  return runs.some((r) => r.route === route && r.side === side && s >= r.s0 - d && s <= r.s1 + d);
}

export interface RoadsideCounts { sections: number; posts: number; poles: number }

/** Place the rails, reflector posts and Hatband poles; returns what it placed. */
export function buildGuardRails(scene: THREE.Scene, boxes: Box[]): void {
  placeRoadside(scene, boxes);
}

export function placeRoadside(scene: THREE.Scene, boxes: Box[]): RoadsideCounts {
  heightAt(0, 0);
  const runs = railRuns();
  const placements: { id: string; x: number; y: number; z: number; yaw: number }[] = [];
  const counts: RoadsideCounts = { sections: 0, posts: 0, poles: 0 };

  for (const run of runs) {
    const track = ROUTES[run.route];
    const w = track.def.width;
    const n = sectionCount(run);
    for (let k = 0; k < n; k++) {
      const s = run.s0 + k * SECTION;
      const lat = run.side * (w / 2 + 0.9 + (k === 0 || k === n - 1 ? 0.4 : 0));
      const c = track.frame(s + 2, lat);
      const nrm = track.sampleAt(s + 2);
      placements.push({ id: 'mountain-guard-rail', x: c.x, y: heightAt(c.x, c.z), z: c.z, yaw: Math.atan2(-run.side * nrm.nx, -run.side * nrm.nz) });
      counts.sections++;
      for (const off of [0.67, 2, 3.33]) {
        const p = track.frame(s + off, lat);
        boxes.push({ minX: p.x - 0.45, maxX: p.x + 0.45, minZ: p.z - 0.45, maxZ: p.z + 0.45, h: heightAt(p.x, p.z) + 0.85 });
      }
    }
  }

  for (const id of routesOfKind('road')) {
    const track = ROUTES[id];
    const w = track.def.width;
    const len = track.length();
    for (const side of SIDES) {
      for (let s = 20; s <= len - 20; s += 25) {
        if (railNear(runs, id, side, s, 4)) continue;
        const p = track.frame(s, side * (w / 2 + 0.7));
        if (nearPad(p.x, p.z, 3) || nearOtherRoute(track, p.x, p.z, 6)) continue;
        const nrm = track.sampleAt(s);
        placements.push({ id: 'road-marker-post', x: p.x, y: heightAt(p.x, p.z), z: p.z, yaw: Math.atan2(-side * nrm.nx, -side * nrm.nz) });
        counts.posts++;
      }
    }
  }

  for (const id of routesOfKind('track')) {
    const track = ROUTES[id];
    const w = track.def.width;
    const len = track.length();
    for (let s = 10; s <= len - 10; s += 12) {
      const l = track.frame(s, w / 2 + 4), r = track.frame(s, -(w / 2 + 4));
      const side = heightAt(l.x, l.z) < heightAt(r.x, r.z) ? 1 : -1;
      const p = track.frame(s, side * (w / 2 + 0.5));
      if (nearPad(p.x, p.z, 10) || nearOtherRoute(track, p.x, p.z, 6)) continue;
      const y = heightAt(p.x, p.z);
      placements.push({ id: 'hatband-pole', x: p.x, y, z: p.z, yaw: 0 });
      boxes.push({ minX: p.x - 0.15, maxX: p.x + 0.15, minZ: p.z - 0.15, maxZ: p.z + 0.15, h: y + 1.6 });
      counts.poles++;
    }
  }

  scene.add(buildStaticCells(placements.filter((p) => getPrefab(p.id)), { name: 'e33-roadside' }));
  return counts;
}
