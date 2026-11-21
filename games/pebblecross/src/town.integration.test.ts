import { describe, expect, it } from 'vitest';
import { MINUTES_PER_DAY } from './config';
import type { Pt } from './nav';
import { makeNav } from './nav';
import { activityAt } from './schedule';
import { RESIDENTS } from './residents';
import { loadTown, TOWN_DOC } from './town';

// Whole-town checks: every place, forage patch and home is reachable, and every schedule points at a real place.
// Path results are cached per pair so the suite stays well under 20 s.

const town = loadTown(TOWN_DOC);
const nav = makeNav(town.navWorld);
const SAMPLE_STEP = 0.25;

const pathCache = new Map<string, Pt[] | null>();
function pathBetween(from: Pt, to: Pt): Pt[] | null {
  const key = `${from.x},${from.z}->${to.x},${to.z}`;
  if (!pathCache.has(key)) pathCache.set(key, nav.findPath(from, to));
  return pathCache.get(key) ?? null;
}

const spawn: Pt = town.spawn;
const placeList = Object.values(town.places);
const placeIds = new Set(Object.keys(town.places));

/** Every point along a path, including the start, sampled along each straight segment. */
function sampledPoints(from: Pt, path: Pt[]): Pt[] {
  const out: Pt[] = [from];
  let prev = from;
  for (const p of path) {
    const len = Math.hypot(p.x - prev.x, p.z - prev.z);
    const steps = Math.max(1, Math.ceil(len / SAMPLE_STEP));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      out.push({ x: prev.x + (p.x - prev.x) * t, z: prev.z + (p.z - prev.z) * t });
    }
    prev = p;
  }
  return out;
}

describe('Pebblecross town (whole-town integration)', () => {
  it('has a free spawn point', () => {
    expect(nav.isFree(spawn.x, spawn.z), `spawn at (${spawn.x}, ${spawn.z}) is blocked`).toBe(true);
  });

  it('every place is reachable from the spawn', () => {
    const unreachable = placeList
      .filter((p) => pathBetween(spawn, p) === null)
      .map((p) => `${p.id} at (${p.x}, ${p.z})`);
    expect(unreachable, `unreachable places: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('every forage patch is reachable from the spawn', () => {
    const unreachable = town.forage
      .filter((f) => pathBetween(spawn, f) === null)
      .map((f) => `${f.id} at (${f.x}, ${f.z})`);
    expect(unreachable, `unreachable forage: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('every place is reachable from the spawn on a path that stays inside the town', () => {
    const bad: string[] = [];
    for (const p of placeList) {
      const path = pathBetween(spawn, p);
      if (!path) continue; // reported by the reachability test above
      const blocked = sampledPoints(spawn, path).find((pt) => !nav.isFree(pt.x, pt.z));
      if (blocked) bad.push(`${p.id}: path crosses blocked point (${blocked.x.toFixed(2)}, ${blocked.z.toFixed(2)})`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every resident home is a place and is reachable from the spawn', () => {
    const bad: string[] = [];
    for (const r of RESIDENTS) {
      const home = town.places[r.home];
      if (!home) {
        bad.push(`${r.id}: home ${r.home} is not a place in the level`);
        continue;
      }
      if (pathBetween(spawn, home) === null) bad.push(`${r.id}: home ${r.home} unreachable from spawn`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every schedule slot names a place in the level and is reachable from the resident home', () => {
    const bad: string[] = [];
    for (const r of RESIDENTS) {
      const home = town.places[r.home];
      for (const [label, list] of [['weekday', r.weekday], ['weekend', r.weekend]] as const) {
        for (const s of list) {
          if (!placeIds.has(s.at)) {
            bad.push(`${r.id} ${label} "${s.doing}": place ${s.at} is not in the level`);
            continue;
          }
          const target = town.places[s.at];
          if (!home || pathBetween(home, target) === null) {
            bad.push(`${r.id} ${label} "${s.doing}": ${s.at} unreachable from home ${r.home}`);
          }
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('activityAt returns a place that exists in the level for every half hour of two weeks', () => {
    const bad: string[] = [];
    for (const r of RESIDENTS) {
      for (let day = 0; day < 14; day++) {
        for (let half = 0; half < 48; half++) {
          const total = day * MINUTES_PER_DAY + half * 30;
          const { at } = activityAt(r, total);
          if (!placeIds.has(at)) {
            bad.push(`${r.id} day ${day} hour ${half / 2}: ${at} is not a place`);
            break;
          }
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
