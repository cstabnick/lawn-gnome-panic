// The fringe's rough lots (docs/roadmaps/gta-parks-and-fringe.md, issue 1O): workshops, lock-ups, yards, caravans,
// half-built houses, farm outbuildings, the junkyard, the Rusty Tine, billboards, and power poles along the highways out
// of town. Lots are seeded (7373) and planned in a fixed order, so every client gets the same fringe. Poles are fully
// determined by the highways (no random draws), so they need no seed.
import { mulberry32 } from '@lawn/level';
import type { Swatch } from '@lawn/prefabs';
import { CITY_HALF, HIGHWAYS } from '../config';
import { heightAt } from '../terrain';
import { REGION_THEMES, themeAt, themeRegion, themeSize } from '../regionThemes';
import { footprintRect, growRect, prefabBox, prefabHeight, rectAround, type PlaceOpts, type Rect, type Site } from '../cityScenery/site';
import type { DressPlan, MarkTile, PatchKind } from '../cityScenery/types';
import { bandAt, beltDepth, beltDensity, FRINGE, FRINGE_THEMES, type Track } from './belt';

type Rnd = () => number;

/** Highways that carry billboards (at belt depth 40 and 120) and power poles (every 32 m). */
const BILLBOARD_ROADS = ['east', 'west', 'north', 'south'];
const POLE_ROADS = ['east', 'west', 'north', 'south', 'ring-ne', 'ring-nw', 'ring-sw', 'ring-se'];
/** The Boneyard sites, tried in order (the first that fits is used). */
const BONEYARDS: [number, number][] = [[240, 160], [250, 175], [-245, 140], [230, -150]];
/** The Rusty Tine sites, tried in order: x, z, yaw (the front faces +x or -x). */
const RUSTY_TINE: [number, number, number][] = [
  [-26, -252, Math.PI / 2], [-26, -264, Math.PI / 2], [-26, -240, Math.PI / 2], [-30, -276, Math.PI / 2], [26, -252, -Math.PI / 2],
];
const WALL_TILES: MarkTile[] = ['tag-a', 'tag-b', 'tag-c', 'tag-d', 'poster-a', 'poster-b', 'poster-c'];
/** Lot-to-lot spacing and the belt's depth limits (the Site knows them; these are the same numbers as belt.ts). */
const DEPTH_MIN = FRINGE.inner - CITY_HALF;
const DEPTH_MAX = FRINGE.outer - CITY_HALF;
const GRID_HALF = 400;

const pick = <T>(list: readonly T[], u: number): T => list[Math.min(list.length - 1, Math.floor(u * list.length))];

/** One point on a polyline, with its unit direction of travel. */
interface Sample { x: number; z: number; dx: number; dz: number }

/** Points every `step` metres of arc length along a polyline (from its start), with the direction of travel there. */
function alongLine(points: readonly (readonly [number, number])[], step: number): Sample[] {
  const segs: { ax: number; az: number; bx: number; bz: number; len: number; start: number }[] = [];
  let total = 0;
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k], [bx, bz] = points[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 1e-9) continue;
    segs.push({ ax, az, bx, bz, len, start: total });
    total += len;
  }
  const out: Sample[] = [];
  if (segs.length === 0) return out;
  for (let s = 0; s <= total + 1e-9; s += step) {
    let seg = segs[segs.length - 1];
    for (const g of segs) if (s <= g.start + g.len) { seg = g; break; }
    const t = Math.min(1, Math.max(0, (s - seg.start) / seg.len));
    out.push({
      x: seg.ax + (seg.bx - seg.ax) * t,
      z: seg.az + (seg.bz - seg.az) * t,
      dx: (seg.bx - seg.ax) / seg.len,
      dz: (seg.bz - seg.az) / seg.len,
    });
  }
  return out;
}

function highway(id: string): readonly (readonly [number, number])[] | null {
  const h = HIGHWAYS.find((x) => x.id === id);
  return h ? h.points : null;
}

/** Adds a flat rectangular ground patch (already claimed by the caller). */
function addRectPatch(plan: DressPlan, kind: PatchKind, r: Rect): void {
  plan.patches.push({
    kind, shape: 'rect',
    x: (r.minX + r.maxX) / 2, z: (r.minZ + r.maxZ) / 2,
    w: r.maxX - r.minX, d: r.maxZ - r.minZ, yaw: 0,
  });
}

/** A random point inside a rectangle, `inset` metres in from its edges. */
function insidePoint(rnd: Rnd, r: Rect, inset: number): [number, number] {
  const u = rnd(), v = rnd();
  return [r.minX + inset + u * (r.maxX - r.minX - 2 * inset), r.minZ + inset + v * (r.maxZ - r.minZ - 2 * inset)];
}

/** A painted sign on a wall: its centre on the front face of a prefab (front = local +z after yaw), standing at 1.6 m. */
function frontMark(plan: DressPlan, x: number, z: number, yaw: number, id: string, scale: number, tile: MarkTile): void {
  const box = prefabBox(id);
  const d = ((box.max.z - box.min.z) * scale) / 2 + 0.04;
  const mx = x + Math.sin(yaw) * d, mz = z + Math.cos(yaw) * d;
  const poster = tile.startsWith('poster');
  plan.marks.push({
    tile, x: mx, y: heightAt(mx, mz) + 1.6, z: mz, yaw,
    w: poster ? 1.0 : 2.2, h: poster ? 1.4 : 1.3, upright: true,
  });
}

/**
 * A fence run along one side: pieces end to end on the line `fixed` (x = fixed for axis 'z', z = fixed for axis 'x')
 * from a to b, centred in the span. `gap` > 0 leaves a gate in the middle of the run.
 */
function fenceRun(
  site: Site, plan: DressPlan, id: string, axis: 'x' | 'z', fixed: number, a: number, b: number,
  opts: { gap?: number; solid: number; roadClear: number },
): void {
  const box = prefabBox(id);
  const L = box.max.x - box.min.x;
  if (L <= 0) return;
  const n = Math.floor((b - a) / L);
  if (n <= 0) return;
  const start = a + ((b - a) - n * L) / 2;
  const mid = (a + b) / 2;
  const gap = opts.gap ?? 0;
  for (let k = 0; k < n; k++) {
    const c = start + (k + 0.5) * L;
    if (gap > 0 && Math.abs(c - mid) < (gap + L) / 2) continue;
    const along = axis === 'x';
    site.place(plan, {
      id, x: along ? c : fixed, z: along ? fixed : c, yaw: along ? 0 : Math.PI / 2,
      cls: 'prop', solid: opts.solid, roadClear: opts.roadClear, pad: -0.05,
    });
  }
}

/** Tries a few random spots in a yard for one prefab. */
function yardPlace(
  site: Site, plan: DressPlan, rnd: Rnd, r: Rect, inset: number, o: Omit<PlaceOpts, 'x' | 'z' | 'yaw'>, tries = 4,
): boolean {
  for (let i = 0; i < tries; i++) {
    const [x, z] = insidePoint(rnd, r, inset);
    const yaw = rnd() * Math.PI * 2;
    if (site.place(plan, { ...o, x, z, yaw })) return true;
  }
  return false;
}

/** The Rusty Tine: the pub, its gravel yard, picnic tables and barrels, a billboard, and a poster on its front wall. */
function placeRustyTine(site: Site, plan: DressPlan, rnd: Rnd): boolean {
  let hit: [number, number, number] | null = null;
  for (const [x, z, yaw] of RUSTY_TINE) {
    if (site.place(plan, { id: 'rough-pub', x, z, yaw, solid: true, cls: 'building', roadClear: 9, maxDrop: 1.2 })) {
      hit = [x, z, yaw];
      break;
    }
  }
  if (!hit) return false;
  const [x, z, yaw] = hit;
  const yard = growRect(footprintRect('rough-pub', x, z, yaw, 1), 4);
  if (site.patchFree(yard)) {
    site.claimPatch(yard);
    addRectPatch(plan, 'gravel', yard);
  }
  for (let i = 0; i < 2; i++) yardPlace(site, plan, rnd, yard, 1, { id: 'picnic-table', scale: 1.6, solid: true, cls: 'detail', roadClear: 7 });
  for (let i = 0; i < 3; i++) yardPlace(site, plan, rnd, yard, 1, { id: 'barrel', scale: 1.4, solid: true, cls: 'detail', roadClear: 7 });
  // The billboard: 14 m from the pub, on the side farthest from the road, facing back at it.
  const dirs: [number, number][] = [[14, 0], [-14, 0], [0, 14], [0, -14]];
  let bx = x, bz = z, best = -1;
  for (const [dx, dz] of dirs) {
    const d = site.roadDist(x + dx, z + dz);
    if (d > best) { best = d; bx = x + dx; bz = z + dz; }
  }
  site.place(plan, { id: 'gta-billboard', x: bx, z: bz, yaw: Math.atan2(x - bx, z - bz), scale: 1.6, solid: true, cls: 'building', roadClear: 7.55 });
  frontMark(plan, x, z, yaw, 'rough-pub', 1, 'poster-a');
  return true;
}

/** The Boneyard: a sand or dirt yard with a chain-link fence (gate on the side nearest a road), scrap, tyres and a portacabin. */
function placeBoneyard(site: Site, plan: DressPlan, rnd: Rnd): boolean {
  for (const [x, z] of BONEYARDS) {
    const rect = rectAround(x, z, 15, 12);
    if (!site.free(rect, { pad: 1, roadClear: 9 }) || !site.patchFree(rect)) continue;
    const region = themeRegion(themeAt(x, z, rnd()));
    const th = FRINGE_THEMES[region];
    site.claimPatch(rect);
    addRectPatch(plan, th.ground, rect);

    const cx = (rect.minX + rect.maxX) / 2, cz = (rect.minZ + rect.maxZ) / 2;
    const sides = [
      { axis: 'z' as const, fixed: rect.maxX, a: rect.minZ, b: rect.maxZ, mx: rect.maxX, mz: cz },
      { axis: 'z' as const, fixed: rect.minX, a: rect.minZ, b: rect.maxZ, mx: rect.minX, mz: cz },
      { axis: 'x' as const, fixed: rect.maxZ, a: rect.minX, b: rect.maxX, mx: cx, mz: rect.maxZ },
      { axis: 'x' as const, fixed: rect.minZ, a: rect.minX, b: rect.maxX, mx: cx, mz: rect.minZ },
    ];
    let gate = 0, gateD = Infinity;
    sides.forEach((s, i) => {
      const d = site.roadDist(s.mx, s.mz);
      if (d < gateD) { gateD = d; gate = i; }
    });
    sides.forEach((s, i) => {
      fenceRun(site, plan, 'chain-link-fence', s.axis, s.fixed, s.a, s.b, {
        gap: i === gate ? 6 : 0, solid: 2, roadClear: 9,
      });
    });

    for (let i = 0; i < 8; i++) yardPlace(site, plan, rnd, rect, 3, { id: 'scrap-car', solid: true, cls: 'prop', roadClear: 7.55 });
    for (let i = 0; i < 5; i++) yardPlace(site, plan, rnd, rect, 3, { id: 'tyre-pile', solid: true, cls: 'prop', roadClear: 7.55 });
    for (let i = 0; i < 3; i++) yardPlace(site, plan, rnd, rect, 4, { id: 'scrap-heap', scale: 3, solid: true, cls: 'prop', roadClear: 7.55 });
    for (let i = 0; i < 2; i++) {
      yardPlace(site, plan, rnd, rect, 3, { id: 'shipping-container', solid: true, cls: 'prop', roadClear: 7.55, tint: i === 0 ? 0x3c6e8f : 0xb5342b });
    }
    site.place(plan, { id: 'portacabin', x: rect.maxX - 5, z: rect.minZ + 4, yaw: 0, solid: true, cls: 'building', roadClear: 7 });
    return true;
  }
  return false;
}

/**
 * One lot centred at (x, z): a building of its region's look facing the nearest road, with a yard (gravel-ish patch),
 * a fence on the sides away from the road, clutter, weeds and sometimes a painted sign on its front wall.
 * `u` is the caller's uniform draw for the region blend (themeAt). Returns false when the building does not fit.
 */
function tryLot(site: Site, plan: DressPlan, rnd: Rnd, x: number, z: number, u: number): boolean {
  const region = themeRegion(themeAt(x, z, u));
  const th = FRINGE_THEMES[region];
  const band = bandAt(x, z);
  let id: string;
  if (band === 'scrub' && rnd() < 1 / 12) {
    id = 'water-tower';
  } else {
    const list = band === 'works' ? th.works : band === 'scrub' ? th.scrub : th.field;
    id = pick(list, rnd());
  }

  // Front faces the nearest road: the one of the four sides with the smallest road distance.
  const D = 12;
  const cands: [number, number, number][] = [
    [x + D, z, Math.PI / 2], [x - D, z, -Math.PI / 2], [x, z + D, 0], [x, z - D, Math.PI],
  ];
  let yaw = cands[0][2], bestRoad = Infinity;
  for (const [cx, cz, cy] of cands) {
    const d = site.roadDist(cx, cz);
    if (d < bestRoad) { bestRoad = d; yaw = cy; }
  }

  const box = prefabBox(id);
  const themeLen = themeSize(id);
  const longest = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
  const scale = themeLen !== null && longest > 0 ? themeLen / longest : 1;

  const walls = REGION_THEMES[region].palette.walls;
  const wallPick = walls.length ? walls[Math.min(walls.length - 1, Math.floor(rnd() * walls.length))] : undefined;
  const tint = wallPick === undefined ? undefined : (wallPick as Swatch | number);

  const placed = site.place(plan, {
    id, x, z, yaw, scale, cls: 'building', solid: true, roadClear: 9, maxDrop: 1.0, pad: 1, tint,
  });
  if (!placed) return false;

  const r = footprintRect(id, x, z, yaw, scale);
  const yard = growRect(r, 3.5);
  if (site.patchFree(yard)) {
    site.claimPatch(yard);
    addRectPatch(plan, th.ground, yard);
  }

  // Fence on two or three of the sides that do not face the road.
  const fx = Math.round(Math.sin(yaw)), fz = Math.round(Math.cos(yaw));
  const sides = [
    { nx: 1, nz: 0, axis: 'z' as const, fixed: yard.maxX, a: yard.minZ, b: yard.maxZ },
    { nx: -1, nz: 0, axis: 'z' as const, fixed: yard.minX, a: yard.minZ, b: yard.maxZ },
    { nx: 0, nz: 1, axis: 'x' as const, fixed: yard.maxZ, a: yard.minX, b: yard.maxX },
    { nx: 0, nz: -1, axis: 'x' as const, fixed: yard.minZ, a: yard.minX, b: yard.maxX },
  ].filter((s) => !(s.nx === fx && s.nz === fz));
  const fenceCount = rnd() < 0.5 ? 2 : 3;
  const fence = pick(th.fences, rnd());
  for (const s of sides.slice(0, fenceCount)) {
    fenceRun(site, plan, fence, s.axis, s.fixed, s.a, s.b, { solid: 1.2, roadClear: 7 });
  }

  // Clutter in the yard, between the building and the fence.
  const clutter = 2 + Math.floor(rnd() * 4);
  for (let i = 0; i < clutter; i++) {
    const cid = pick(th.clutter, rnd());
    yardPlace(site, plan, rnd, yard, 1.5, {
      id: cid, cls: 'detail', solid: prefabHeight(cid) >= 0.8 ? true : undefined, roadClear: 7,
    }, 2);
  }
  // Weeds in the yard corners.
  const weeds = 3 + Math.floor(rnd() * 4);
  for (let i = 0; i < weeds; i++) {
    const wid = pick(th.weeds, rnd());
    const k = Math.floor(rnd() * 4);
    const wx = k & 1 ? yard.maxX - 1 - rnd() * 2.5 : yard.minX + 1 + rnd() * 2.5;
    const wz = k & 2 ? yard.maxZ - 1 - rnd() * 2.5 : yard.minZ + 1 + rnd() * 2.5;
    site.place(plan, { id: wid, x: wx, z: wz, yaw: rnd() * Math.PI * 2, cls: 'detail', roadClear: 7, pad: 0.1 });
  }

  // Painted sign on the front wall, sometimes.
  if (rnd() < 0.35) {
    frontMark(plan, x, z, yaw, id, scale, pick(WALL_TILES, rnd()));
  }
  return true;
}

/** Billboards on the four highways where they reach belt depth 40 and 120, 14 m to one side, facing the road. */
function placeBillboards(site: Site, plan: DressPlan, rnd: Rnd): void {
  for (const id of BILLBOARD_ROADS) {
    const pts = highway(id);
    if (!pts) continue;
    const samples = alongLine(pts, 1);
    for (const depth of [40, 120]) {
      const hit = samples.find((s) => beltDepth(s.x, s.z) >= depth);
      if (!hit) continue;
      const side = rnd() < 0.5 ? 1 : -1;
      const nx = side * -hit.dz, nz = side * hit.dx;
      site.place(plan, {
        id: 'gta-billboard', x: hit.x + nx * 14, z: hit.z + nz * 14,
        yaw: Math.atan2(-nx, -nz), scale: 2, solid: true, cls: 'building',
      });
    }
  }
}

/**
 * Rough lots round the city: the Rusty Tine and the Boneyard first, then one lot at the end of each dirt track, a jittered
 * grid of lots over the belt (density falls with distance), and the highway billboards. `tracks` from planTracks.
 */
export function planLots(site: Site, plan: DressPlan, tracks: readonly Track[]): void {
  const rnd = mulberry32(7373);
  let lots = 0;
  if (placeRustyTine(site, plan, rnd)) lots++;
  if (placeBoneyard(site, plan, rnd)) lots++;

  for (const t of tracks) {
    if (lots >= FRINGE.maxLots) break;
    const n = t.points.length;
    if (n < 2) continue;
    const [px, pz] = t.points[n - 1], [qx, qz] = t.points[n - 2];
    const len = Math.hypot(px - qx, pz - qz) || 1;
    const x = px + ((px - qx) / len) * 12, z = pz + ((pz - qz) / len) * 12;
    if (tryLot(site, plan, rnd, x, z, rnd())) lots++;
  }

  const pitch = FRINGE.lotPitch, jitter = FRINGE.lotJitter;
  for (let gx = -GRID_HALF; gx <= GRID_HALF && lots < FRINGE.maxLots; gx += pitch) {
    for (let gz = -GRID_HALF; gz <= GRID_HALF && lots < FRINGE.maxLots; gz += pitch) {
      // Six draws per cell, always (the stream stays the same length whatever the cell holds).
      const a = rnd(), b = rnd(), roll = rnd(), u = rnd();
      rnd(); rnd();
      const x = gx + (a * 2 - 1) * jitter, z = gz + (b * 2 - 1) * jitter;
      if (Math.abs(x) > GRID_HALF || Math.abs(z) > GRID_HALF) continue;
      const d = beltDepth(x, z);
      if (d < DEPTH_MIN || d > DEPTH_MAX) continue;
      if (roll >= 0.75 * beltDensity(x, z)) continue;
      if (tryLot(site, plan, rnd, x, z, u)) lots++;
    }
  }

  placeBillboards(site, plan, rnd);
}

/**
 * Power poles along the highways out of town (every 32 m, 9.5 m to the right of travel, cross-arm across the road),
 * with two wires between each pair of poles placed one after the other on the same highway.
 */
export function planPoles(site: Site, plan: DressPlan): void {
  for (const id of POLE_ROADS) {
    const pts = highway(id);
    if (!pts) continue;
    const samples = alongLine(pts, 32);
    let prev: { k: number; plus: [number, number, number]; minus: [number, number, number] } | null = null;
    for (let k = 0; k < samples.length; k++) {
      const s = samples[k];
      const d = beltDepth(s.x, s.z);
      if (d < DEPTH_MIN || d > DEPTH_MAX) { prev = null; continue; }
      const qx = s.x - s.dz * 9.5, qz = s.z + s.dx * 9.5;
      const yaw = Math.atan2(s.dx, s.dz);
      if (!site.place(plan, { id: 'power-pole', x: qx, z: qz, yaw, solid: 8, cls: 'prop', roadClear: 7.5, pad: 0.3 })) {
        prev = null;
        continue;
      }
      // Cross-arm ends: local x = +-0.7 turned by yaw, i.e. +-0.7 * (dz, -dx).
      const ex = 0.7 * s.dz, ez = -0.7 * s.dx;
      const plus: [number, number, number] = [qx + ex, heightAt(qx + ex, qz + ez) + 7.6, qz + ez];
      const minus: [number, number, number] = [qx - ex, heightAt(qx - ex, qz - ez) + 7.6, qz - ez];
      if (prev && prev.k === k - 1) {
        plan.cables.push({ ax: prev.plus[0], ay: prev.plus[1], az: prev.plus[2], bx: plus[0], by: plus[1], bz: plus[2], sag: 0.6 });
        plan.cables.push({ ax: prev.minus[0], ay: prev.minus[1], az: prev.minus[2], bx: minus[0], by: minus[1], bz: minus[2], sag: 0.6 });
      }
      prev = { k, plus, minus };
    }
  }
}
