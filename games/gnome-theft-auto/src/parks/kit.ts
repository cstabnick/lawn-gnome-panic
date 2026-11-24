// Park layout helpers (docs/roadmaps/gta-parks-and-fringe.md). A park layout is written in block-local metres: u along
// +x and v along +z from the block centre, both in [-21, 21] (the block is 42 x 42 inside its roads and sidewalks).
// Every helper places through the Site (site.ts), so a piece that would land on a collider, a stage spot, a ramp run or
// another piece is skipped, never forced.
import { mulberry32 } from '@lawn/level';
import { heightAt } from '../terrain';
import type { GnomeLook } from '@lawn/gnome';
import type { AnimId } from '../anim/types';
import type { Site, Rect } from '../cityScenery/site';
import { footprintRect, prefabHeight } from '../cityScenery/site';
import type { DressClass, DressPlan, PatchKind } from '../cityScenery/types';
import type { ParkDef } from './blocks';

/** Half size of a park block's usable square (block edge = road centre line + 9). */
export const BLOCK_HALF = 21;
/** Perimeter pieces sit on this line (|u| or |v|), 1.5 m inside the block edge. */
export const PERIMETER = 19.5;

export interface ParkCtx {
  site: Site;
  plan: DressPlan;
  park: ParkDef;
  /** Seeded from the park id: the same park always gets the same layout. */
  rnd: () => number;
  /** World point of block-local (u, v). */
  at(u: number, v: number): { x: number; z: number };
}

export function parkCtx(site: Site, plan: DressPlan, park: ParkDef): ParkCtx {
  let seed = 17;
  for (const ch of park.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return { site, plan, park, rnd: mulberry32(seed), at: (u, v) => ({ x: park.x + u, z: park.z + v }) };
}

/** World rectangle of block-local corners (any order). */
export function localRect(c: ParkCtx, u0: number, v0: number, u1: number, v1: number): Rect {
  return { minX: c.park.x + Math.min(u0, u1), maxX: c.park.x + Math.max(u0, u1), minZ: c.park.z + Math.min(v0, v1), maxZ: c.park.z + Math.max(v0, v1) };
}

/**
 * One prefab at block-local (u, v). `solid`: true for a collider of its footprint and height (mowable plants never get
 * one). `height`: scale it to this height (m) instead of `scale`. False when it did not fit.
 */
export function put(
  c: ParkCtx, id: string, u: number, v: number,
  o: { yaw?: number; scale?: number; height?: number; solid?: boolean | number; cls?: DressClass; tint?: number | string; trim?: number | string; pad?: number } = {},
): boolean {
  const p = c.at(u, v);
  const scale = o.height !== undefined ? o.height / prefabHeight(id) : (o.scale ?? 1);
  return c.site.place(c.plan, {
    id, x: p.x, z: p.z, yaw: o.yaw ?? 0, scale, cls: o.cls ?? 'prop', solid: o.solid ?? false,
    tint: o.tint as never, trim: o.trim as never, pad: o.pad ?? 0.2,
  });
}

/**
 * The park's fence: pieces end to end along all four sides on the PERIMETER line, with an entrance gap of `gap` metres in
 * the middle of each side (and any extra gaps given as [side, centre along the side]). Sides: 'n' (v = -19.5), 's'
 * (v = +19.5), 'w' (u = -19.5), 'e' (u = +19.5). Pieces are solid, 1.1 m tall colliders.
 */
export function perimeter(c: ParkCtx, id: 'hedgerow' | 'civic-railing' | 'wattle-fence' | 'picket-fence', gap = 6, skipSides: readonly ('n' | 's' | 'w' | 'e')[] = []): void {
  const b = footprintRect(id, 0, 0, 0, 1);
  const len = b.maxX - b.minX;
  for (const side of ['n', 's', 'w', 'e'] as const) {
    if (skipSides.includes(side)) continue;
    const along = side === 'n' || side === 's';
    const fixed = side === 'n' || side === 'w' ? -PERIMETER : PERIMETER;
    for (const [a0, a1] of [[-PERIMETER, -gap / 2], [gap / 2, PERIMETER]] as const) {
      const n = Math.floor((a1 - a0) / len);
      const start = a0 + ((a1 - a0) - n * len) / 2 + len / 2;
      for (let k = 0; k < n; k++) {
        const t = start + k * len;
        const [u, v] = along ? [t, fixed] : [fixed, t];
        put(c, id, u, v, { yaw: along ? 0 : Math.PI / 2, solid: 1.1, pad: -0.05 });
      }
    }
  }
}

/**
 * A ground patch from block-local (u0, v0) to (u1, v1) (axis-aligned), claimed (no collider) so nothing stands on it,
 * with walk points every 6 m along its longer axis when `walk`. False (nothing added) when the rectangle is not free.
 */
export function patch(c: ParkCtx, u0: number, v0: number, u1: number, v1: number, kind: PatchKind = 'gravel', walk = true): boolean {
  const r = localRect(c, u0, v0, u1, v1);
  if (!c.site.free(r, { pad: 0.05 }) || !c.site.patchFree(r)) return false;
  c.site.claim(r);
  c.site.claimPatch(r);
  const x = (r.minX + r.maxX) / 2, z = (r.minZ + r.maxZ) / 2;
  c.plan.patches.push({ kind, shape: 'rect', x, z, w: r.maxX - r.minX, d: r.maxZ - r.minZ, yaw: 0 });
  if (walk) {
    const alongX = r.maxX - r.minX >= r.maxZ - r.minZ;
    const L = alongX ? r.maxX - r.minX : r.maxZ - r.minZ;
    for (let t = 3; t < L; t += 6) c.plan.walk.push(alongX ? { x: r.minX + t, z } : { x, z: r.minZ + t });
  }
  return true;
}

/** A round pond (disc patch) of radius r at block-local (u, v), claimed; ducks paddle on it when `ducks` > 0. */
export function pond(c: ParkCtx, u: number, v: number, r: number, ducks = 0): boolean {
  const p = c.at(u, v);
  const rect = { minX: p.x - r, maxX: p.x + r, minZ: p.z - r, maxZ: p.z + r };
  if (!c.site.free(rect, { pad: 0.05 }) || !c.site.patchFree(rect)) return false;
  c.site.claim(rect);
  c.site.claimPatch(rect);
  c.plan.patches.push({ kind: 'pond', shape: 'disc', x: p.x, z: p.z, w: r * 2, d: r * 2, yaw: 0 });
  if (ducks > 0) c.plan.ducks.push({ x: p.x, z: p.z, r: r * 0.6, n: ducks });
  return true;
}

/** A park bench facing `yaw` (0 faces +v), a sit spot on it, and a litter bin 1.4 m to its right when `bin`. */
export function bench(c: ParkCtx, u: number, v: number, yaw: number, bin = true): boolean {
  if (!put(c, 'park-bench', u, v, { yaw, cls: 'detail' })) return false;
  const p = c.at(u, v);
  c.plan.uses.push({ kind: 'bench', x: p.x, z: p.z, yaw, park: c.park.id });
  if (bin) {
    // The bench's right (its local -x when facing +z after yaw).
    const rx = -Math.cos(yaw), rz = Math.sin(yaw);
    put(c, 'litter-bin', u + rx * 1.4, v + rz * 1.4, { cls: 'detail' });
  }
  return true;
}

/** A park lamp (the city's mushroom lamp at scale 1.4), a small solid post. */
export function lamp(c: ParkCtx, u: number, v: number): boolean {
  return put(c, 'mushroom-lamp', u, v, { scale: 1.4, solid: 1.5, cls: 'detail' });
}

/** A tree `height` metres tall (default 6) with a 1 m trunk collider. Ids: broadleaf-tree, city-round-tree, cone-pine, layered-pine-tree. */
export function tree(c: ParkCtx, u: number, v: number, id = 'broadleaf-tree', height = 6): boolean {
  const p = c.at(u, v);
  const trunk = { minX: p.x - 0.5, maxX: p.x + 0.5, minZ: p.z - 0.5, maxZ: p.z + 0.5 };
  if (!c.site.free(trunk, { pad: 0.6 })) return false;
  c.site.claim(trunk, 3);
  const scale = height / prefabHeight(id);
  c.plan.dress.push({ id, x: p.x, y: heightAt(p.x, p.z), z: p.z, yaw: c.rnd() * Math.PI * 2, scale, cls: 'tree' });
  return true;
}

/** The park's noticeboard at an entrance (its name is the park's; the board faces `yaw`). */
export function noticeboard(c: ParkCtx, u: number, v: number, yaw: number): boolean {
  return put(c, 'park-noticeboard', u, v, { yaw, solid: true, cls: 'detail' });
}

/** A wishing fountain: the prefab is placed by the caller; this adds the wish spot `front` metres along +v of (u, v). */
export function wishSpot(c: ParkCtx, u: number, v: number, front: number): void {
  const p = c.at(u, v + front);
  c.plan.uses.push({ kind: 'wish', x: p.x, z: p.z, yaw: Math.PI, park: c.park.id });
}

/**
 * A park townsgnome (ambientGnomes.ts AmbientGnomeDef): stands at (u, v) facing `yaw`, plays `idle`, says `bubble` when
 * the player comes close. Claims a 1.2 m square so nothing is placed on it. Skipped when the spot is not free.
 */
export function gnome(c: ParkCtx, n: number, u: number, v: number, yaw: number, name: string, idle: AnimId, bubble: string, look: Partial<GnomeLook> = {}): boolean {
  const p = c.at(u, v);
  const r = { minX: p.x - 0.6, maxX: p.x + 0.6, minZ: p.z - 0.6, maxZ: p.z + 0.6 };
  if (!c.site.free(r, { pad: 0.1 })) return false;
  c.site.claim(r);
  c.plan.gnomes.push({ id: `park-${c.park.id}-${n}`, name, x: p.x, z: p.z, yaw, look, bubble, idle });
  return true;
}

/**
 * A ground patch that props may still stand on (a playground's rubber, a skate corner's concrete, the allotments' dirt):
 * checked against other patches only, not claimed for props. False when it would overlap another patch.
 */
export function floorPatch(c: ParkCtx, u0: number, v0: number, u1: number, v1: number, kind: PatchKind): boolean {
  const r = localRect(c, u0, v0, u1, v1);
  if (!c.site.patchFree(r)) return false;
  c.site.claimPatch(r);
  c.plan.patches.push({ kind, shape: 'rect', x: (r.minX + r.maxX) / 2, z: (r.minZ + r.maxZ) / 2, w: r.maxX - r.minX, d: r.maxZ - r.minZ, yaw: 0 });
  return true;
}

/**
 * A prefab added with no checks and no claim (reeds round a pond, arches over a path, a duck house on the water). Use only
 * inside your own claimed area. Mowable plants among them are still handed to flora by the builder.
 */
export function dressAt(c: ParkCtx, id: string, u: number, v: number, o: { yaw?: number; scale?: number; height?: number; cls?: DressClass; tint?: number } = {}): void {
  const p = c.at(u, v);
  const scale = o.height !== undefined ? o.height / prefabHeight(id) : (o.scale ?? 1);
  const d: DressPlan['dress'][number] = { id, x: p.x, y: heightAt(p.x, p.z), z: p.z, yaw: o.yaw ?? 0, scale, cls: o.cls ?? 'prop' };
  if (o.tint !== undefined) d.tint = o.tint;
  c.plan.dress.push(d);
}
