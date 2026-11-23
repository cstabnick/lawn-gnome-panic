import type { EdgeDef, HavenId, Neighbour, Rect, RegionDef, RegionGraph, RegionId } from './types';

export const REGIONS: readonly RegionDef[] = [ // order matters: regionAt() takes the first match (gate-roof sits over forecourt and verge-path)
  { id: 'gate-roof', name: 'Gate Roof', district: 'lychgate', rect: { x0: 280, x1: 360, z0: 466, z1: 494 }, floorY: 18, traits: ['HIGH', 'HAVEN', 'GATE'], lootTier: 1, startHatless: [0, 0], startNpcs: [4, 8], water: 'clean', forage: 0 },
  { id: 'forecourt', name: 'Forecourt', district: 'lychgate', rect: { x0: 200, x1: 440, z0: 400, z1: 480 }, floorY: 0, traits: ['OPEN', 'CHOKE'], lootTier: 1, startHatless: [10, 30], startNpcs: [6, 12], water: null, forage: 2 },
  { id: 'verge-path', name: 'The Verge Path', district: 'lychgate', rect: { x0: 200, x1: 440, z0: 480, z1: 520 }, floorY: 0, traits: ['OPEN', 'GATE'], lootTier: 0, startHatless: [0, 6], startNpcs: [2, 6], water: null, forage: 4 },
  { id: 'bin-corner', name: 'Bin Corner', district: 'lychgate', rect: { x0: 440, x1: 560, z0: 400, z1: 520 }, floorY: 0, traits: ['WARM', 'NEST'], lootTier: 1, startHatless: [20, 60], startNpcs: [0, 3], water: null, forage: 3 },
  { id: 'ivy-rows', name: 'Ivy Rows', district: 'old-rows', rect: { x0: 0, x1: 160, z0: 240, z1: 400 }, floorY: 0, traits: ['COVER', 'ECHO'], lootTier: 1, startHatless: [30, 70], startNpcs: [8, 16], water: null, forage: 4 },
  { id: 'leaning-rows', name: 'Leaning Rows', district: 'old-rows', rect: { x0: 160, x1: 320, z0: 240, z1: 400 }, floorY: 0, traits: ['ECHO'], lootTier: 2, startHatless: [40, 90], startNpcs: [8, 16], water: null, forage: 3 },
  { id: 'the-sinks', name: 'The Sinks', district: 'old-rows', rect: { x0: 0, x1: 120, z0: 120, z1: 240 }, floorY: 0, traits: ['PIT', 'DEEP', 'FLOODS'], lootTier: 2, startHatless: [60, 140], startNpcs: [0, 4], water: 'dirty', forage: 2 },
  { id: 'angel-square', name: 'Angel Square', district: 'old-rows', rect: { x0: 120, x1: 240, z0: 120, z1: 240 }, floorY: 0, traits: ['HIGH', 'SACRED'], lootTier: 2, startHatless: [5, 20], startNpcs: [6, 12], water: null, forage: 2 },
  { id: 'masons-corner', name: "The Mason's Corner", district: 'old-rows', rect: { x0: 240, x1: 320, z0: 120, z1: 240 }, floorY: 0, traits: ['OPEN'], lootTier: 2, startHatless: [5, 20], startNpcs: [4, 10], water: null, forage: 1 },
  { id: 'child-graves', name: 'Child Graves', district: 'old-rows', rect: { x0: 0, x1: 160, z0: 0, z1: 120 }, floorY: 0, traits: ['SACRED'], lootTier: 2, startHatless: [5, 20], startNpcs: [4, 10], water: null, forage: 3 },
  { id: 'yew-edge', name: 'Yew Edge', district: 'old-rows', rect: { x0: 160, x1: 320, z0: 0, z1: 120 }, floorY: 0, traits: ['CHOKE', 'TOLL'], lootTier: 1, startHatless: [15, 40], startNpcs: [6, 12], water: null, forage: 4 },
  { id: 'the-tap', name: 'The Tap', district: 'yew-walk', rect: { x0: 320, x1: 440, z0: 0, z1: 400 }, floorY: 0, traits: ['HAVEN', 'TOLL'], lootTier: 1, startHatless: [10, 30], startNpcs: [12, 24], water: 'clean', forage: 2 },
];
export const EDGES: readonly EdgeDef[] = [
  { a: 'gate-roof', b: 'forecourt', climb: true }, { a: 'gate-roof', b: 'verge-path', climb: true },
  { a: 'forecourt', b: 'verge-path', climb: false }, { a: 'forecourt', b: 'bin-corner', climb: false },
  { a: 'forecourt', b: 'leaning-rows', climb: false }, { a: 'forecourt', b: 'the-tap', climb: false },
  { a: 'ivy-rows', b: 'leaning-rows', climb: false }, { a: 'ivy-rows', b: 'the-sinks', climb: false },
  { a: 'ivy-rows', b: 'angel-square', climb: false }, { a: 'leaning-rows', b: 'angel-square', climb: false },
  { a: 'leaning-rows', b: 'masons-corner', climb: false }, { a: 'leaning-rows', b: 'the-tap', climb: false },
  { a: 'the-sinks', b: 'angel-square', climb: false }, { a: 'the-sinks', b: 'child-graves', climb: false },
  { a: 'angel-square', b: 'masons-corner', climb: false }, { a: 'angel-square', b: 'child-graves', climb: false },
  { a: 'angel-square', b: 'yew-edge', climb: false }, { a: 'masons-corner', b: 'yew-edge', climb: false },
  { a: 'masons-corner', b: 'the-tap', climb: false }, { a: 'child-graves', b: 'yew-edge', climb: false },
  { a: 'yew-edge', b: 'the-tap', climb: false },
];
export const MAP_OUTLINE: readonly [number, number][] = [[0, 0], [440, 0], [440, 400], [560, 400], [560, 520], [200, 520], [200, 400], [0, 400]];
/** byId, neighbours (both directions, cost = centre distance x (climb ? 3 : 1)). */
export function buildGraph(regions: readonly RegionDef[] = REGIONS, edges: readonly EdgeDef[] = EDGES): RegionGraph {
  const byId = {} as Record<RegionId, RegionDef>;
  const neighbours = {} as Record<RegionId, Neighbour[]>;
  for (const r of regions) { byId[r.id] = r; neighbours[r.id] = []; }
  const centre = (r: RegionDef): [number, number] => [(r.rect.x0 + r.rect.x1) / 2, (r.rect.z0 + r.rect.z1) / 2];
  for (const e of edges) {
    const a = byId[e.a], b = byId[e.b];
    if (!a || !b) throw new Error(`edge ${e.a}-${e.b} names a missing region`);
    const [ax, az] = centre(a), [bx, bz] = centre(b);
    const cost = Math.hypot(ax - bx, az - bz) * (e.climb ? 3 : 1);
    neighbours[e.a].push({ to: e.b, cost, climb: e.climb });
    neighbours[e.b].push({ to: e.a, cost, climb: e.climb });
  }
  return { regions, edges, byId, neighbours };
}
/** First rect in `regions` holding the point (edges inclusive). */
export function regionAtIn(regions: readonly RegionDef[], x: number, z: number): RegionId | null {
  for (const r of regions) {
    const q = r.rect;
    if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return r.id;
  }
  return null;
}
/** First REGIONS rect holding the point (edges inclusive). */
export function regionAt(x: number, z: number): RegionId | null {
  return regionAtIn(REGIONS, x, z);
}
export function rectArea(r: Rect): number { return (r.x1 - r.x0) * (r.z1 - r.z0); }
export const HAVEN_REGION: Record<HavenId, RegionId> = { waystation: 'gate-roof', tap: 'the-tap', columbarium: 'niches-high', infirmary: 'the-nave', willow: 'the-willow', 'bath-house': 'the-birdbath', shelves: 'the-shelves' };
export const HAVEN_NAME: Record<HavenId, string> = { waystation: 'Lychgate Waystation', tap: 'The Tap', columbarium: 'The Columbarium', infirmary: 'The Chapel Infirmary', willow: 'The Willow', 'bath-house': 'The Bath House', shelves: 'The Shelves' };
