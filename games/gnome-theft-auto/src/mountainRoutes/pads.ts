// E33 pads: level rectangles beside the mountain routes (lay-bys, the café terrace, lookouts, the summit platform).
// terrain.ts calls applyPadRelief after every track and route has shaped the grid; surfaces read padSurfaceAt.
// Pure: no three.js, no DOM.
import type { SurfaceKind } from '../surfaces';
import type { Track } from '../raceTrack/trackDef';
import { HATBRIM_PADS } from './defs/hatbrimPads';
import { SPINE_PADS } from './defs/spineCut';
import { ALL_ROUTES, ROUTES } from './routes';
import type { PadDef } from './types';

/** Every pad, in the order they are levelled. */
export const ALL_PADS: readonly PadDef[] = [...HATBRIM_PADS, ...SPINE_PADS];

const smooth = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** (x, z) in the pad's own frame: u across (local x), v along (local z = the yaw direction (sin yaw, cos yaw)). */
export function padLocal(p: PadDef, x: number, z: number): { u: number; v: number } {
  const dx = x - p.x, dz = z - p.z;
  const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  return { u: dx * c - dz * s, v: dx * s + dz * c };
}

/** Distance from (x, z) to the pad's rectangle (0 inside). */
export function padDistance(p: PadDef, x: number, z: number): number {
  const { u, v } = padLocal(p, x, z);
  return Math.hypot(Math.max(Math.abs(u) - p.hw, 0), Math.max(Math.abs(v) - p.hd, 0));
}

/** The pad at (x, z) (inside its rectangle), or null. */
export function padAt(x: number, z: number): PadDef | null {
  for (const p of ALL_PADS) {
    const r = p.hw + p.hd;
    if (Math.abs(x - p.x) > r || Math.abs(z - p.z) > r) continue;
    if (padDistance(p, x, z) <= 0) return p;
  }
  return null;
}

/** The driving surface of the pad at (x, z), or null off every pad. */
export function padSurfaceAt(x: number, z: number): SurfaceKind | null {
  const p = padAt(x, z);
  return p ? (p.surface ?? 'gravel') : null;
}

const heights = new Map<string, number>();

/** The level a pad was flattened to (absolute y) once the terrain is built; NaN before. */
export function padHeight(id: string): number {
  return heights.get(id) ?? NaN;
}

/** True when (x, z) is on any route's road (within half its width plus its shoulder). */
function onAnyRoad(x: number, z: number, routes: readonly Track[]): boolean {
  for (const t of routes) {
    const b = t.bounds();
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
    const reach = t.def.width / 2 + t.def.shoulder;
    const spot = t.locate(x, z, reach);
    if (spot && Math.abs(spot.lat) <= reach) return true;
  }
  return false;
}

/** Level every pad into the height grid (terrain.ts calls it after the routes' applyRelief). */
export function applyPadRelief(g: Float32Array, N: number, H: number, S: number): void {
  heights.clear();
  for (const p of ALL_PADS) {
    const route = (ROUTES as Record<string, Track>)[p.route];
    if (!route) throw new Error(`pad '${p.id}': unknown route '${p.route}'`);
    const spot = route.locate(p.x, p.z, 250);
    const target = (spot ? route.roadTopAt(route.samples()[spot.i], 0) : 0) + (p.lift ?? 0);
    heights.set(p.id, target);
    const fade = p.fade ?? 6;
    const reach = Math.hypot(p.hw, p.hd) + fade;
    const i0 = Math.max(0, Math.floor((p.x - reach + H) / S)), i1 = Math.min(N - 1, Math.ceil((p.x + reach + H) / S));
    const j0 = Math.max(0, Math.floor((p.z - reach + H) / S)), j1 = Math.min(N - 1, Math.ceil((p.z + reach + H) / S));
    for (let j = j0; j <= j1; j++) {
      const z = -H + j * S;
      for (let i = i0; i <= i1; i++) {
        const x = -H + i * S;
        const d = padDistance(p, x, z);
        if (d >= fade) continue;
        if (onAnyRoad(x, z, ALL_ROUTES)) continue;
        const w = 1 - smooth(d / fade);
        const gi = j * N + i;
        g[gi] = g[gi] + (target - g[gi]) * w;
      }
    }
  }
}
