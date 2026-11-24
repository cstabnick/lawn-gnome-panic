// The fringe's ground (docs/roadmaps/gta-parks-and-fringe.md, issue 1M): dirt tracks peeling off the highways, and the
// green creeping in (tree clumps, hedgerows and field fences, long grass and weeds), in each neighbouring region's look.
import { mulberry32 } from '@lawn/level';
import { HIGHWAYS } from '../config';
import { heightAt } from '../terrain';
import { themeAt, themeRegion } from '../regionThemes';
import { prefabBox, prefabHeight, rectAround, type Site } from '../cityScenery/site';
import type { Dress, DressPlan } from '../cityScenery/types';
import { FRINGE, FRINGE_THEMES, bandAt, beltDensity, beltDepth, type Track } from './belt';

type Pt = [number, number];

const TRACK_MAX = 40;
const TRACK_W = 3.5;

/** A point on a highway with its unit direction of travel. */
interface HighwayPoint { x: number; z: number; dx: number; dz: number }

/** Points along every highway, the next one 85 + 40 * rnd metres on from the last. */
function highwayPoints(rnd: () => number): HighwayPoint[] {
  const out: HighwayPoint[] = [];
  for (const h of HIGHWAYS) {
    const pts = h.points;
    if (pts.length < 2) continue;
    const lens: number[] = [];
    let total = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
      lens.push(l);
      total += l;
    }
    let k = 0, acc = 0;
    for (let s = 85 + 40 * rnd(); s < total; s += 85 + 40 * rnd()) {
      while (k < lens.length - 1 && acc + lens[k] < s) { acc += lens[k]; k++; }
      const len = lens[k] || 1;
      const t = Math.min(1, Math.max(0, (s - acc) / len));
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
      out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, dx: (bx - ax) / len, dz: (bz - az) / len });
    }
  }
  return out;
}

/** Rotate the vector (x, z) by `a` radians in the ground plane. */
function rot(x: number, z: number, a: number): Pt {
  return [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
}

/** Dirt tracks (seed 5151): each one a bent line off a highway, kept as far as its 4 m squares fit. */
export function planTracks(site: Site, plan: DressPlan): Track[] {
  const rnd = mulberry32(5151);
  const tracks: Track[] = [];
  for (const p of highwayPoints(rnd)) {
    if (tracks.length >= TRACK_MAX) break;
    const depth = beltDepth(p.x, p.z);
    if (depth < 15 || depth > 170) continue;
    const side = rnd() < 0.5 ? 1 : -1;
    const nx = side * -p.dz, nz = side * p.dx;
    const bend = (rnd() - 0.5) * 0.6;
    const L = 30 + 40 * rnd();
    const ax = p.x + nx * 7, az = p.z + nz * 7;
    const d1 = rot(nx, nz, bend / 2);
    const d2 = rot(nx, nz, bend);
    const bx = ax + d1[0] * (L / 2), bz = az + d1[1] * (L / 2);
    // Arc length s along A -> B -> C.
    const at = (s: number): Pt =>
      s <= L / 2 ? [ax + d1[0] * s, az + d1[1] * s] : [bx + d2[0] * (s - L / 2), bz + d2[1] * (s - L / 2)];

    const samples: number[] = [];
    for (let s = 0; s < L; s += 3) samples.push(s);
    samples.push(L);
    let good = -1;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const [qx, qz] = at(s);
      const sq = rectAround(qx, qz, 2);
      if (!site.free(sq, { roadClear: s < 6 ? 0 : 6, pad: 0.5 }) || !site.patchFree(sq)) break;
      good = i;
    }
    if (good < 0) continue;
    const keepS = samples[good];
    if (keepS < 20) continue;

    const end = at(keepS);
    const pts: Pt[] = [[ax, az]];
    if (keepS > L / 2) pts.push([bx, bz]);
    pts.push(end);

    for (let i = 0; i <= good; i++) {
      const [qx, qz] = at(samples[i]);
      const sq = rectAround(qx, qz, 2);
      site.claim(sq);
      site.claimPatch(sq);
    }

    const region = themeRegion(themeAt(end[0], end[1]));
    plan.patches.push({
      kind: FRINGE_THEMES[region].track, shape: 'ribbon', x: ax, z: az, w: TRACK_W, d: TRACK_W, yaw: 0, points: pts,
    });
    tracks.push({ points: pts, width: TRACK_W, region });
  }
  return tracks;
}

/** The plan is full: the fringe stops adding dress (FRINGE.maxDress). */
const full = (plan: DressPlan): boolean => plan.dress.length >= FRINGE.maxDress;

/** Tree clumps, hedgerows and field fences, long grass and weeds (seed 6262), in that order. */
export function planEdgeGreen(site: Site, plan: DressPlan): void {
  const rnd = mulberry32(6262);

  // Tree clumps: a jittered 18 m grid across the belt.
  for (let gx = -400; gx <= 400 && !full(plan); gx += 18) {
    for (let gz = -400; gz <= 400 && !full(plan); gz += 18) {
      const x = gx + (rnd() * 2 - 1) * 6;
      const z = gz + (rnd() * 2 - 1) * 6;
      const depth = beltDepth(x, z);
      if (depth < 9 || depth > 185) continue;
      if (rnd() >= 0.12 + 0.5 * (1 - beltDensity(x, z))) continue;
      const theme = FRINGE_THEMES[themeRegion(themeAt(x, z, rnd()))];
      const count = 1 + Math.floor(rnd() * 4);
      for (let i = 0; i < count && !full(plan); i++) {
        const tx = x + (rnd() * 2 - 1) * 5;
        const tz = z + (rnd() * 2 - 1) * 5;
        const id = theme.trees[Math.floor(rnd() * theme.trees.length)];
        const height = id === 'palm-tree' ? 6 + 2 * rnd() : 5 + 4 * rnd();
        const yaw = rnd() * Math.PI * 2;
        const trunk = rectAround(tx, tz, 0.5);
        if (!site.free(trunk, { pad: 0.6, roadClear: 8 })) continue;
        site.claim(trunk, 3);
        const d: Dress = {
          id, x: tx, y: heightAt(tx, tz), z: tz, yaw, scale: height / prefabHeight(id), cls: 'tree',
        };
        plan.dress.push(d);
      }
    }
  }

  // Hedgerows and field fences: runs of 3-6 pieces on a 40 m grid in the field band.
  for (let gx = -400; gx <= 400 && !full(plan); gx += 40) {
    for (let gz = -400; gz <= 400 && !full(plan); gz += 40) {
      if (bandAt(gx, gz) !== 'field' || beltDepth(gx, gz) > 185) continue;
      if (rnd() >= 0.35) continue;
      const theme = FRINGE_THEMES[themeRegion(themeAt(gx, gz, rnd()))];
      const id = theme.hedge ?? theme.fences[0];
      const box = prefabBox(id);
      const len = box.max.x - box.min.x;
      const alongX = rnd() < 0.5;
      const count = 3 + Math.floor(rnd() * 4);
      const yaw = alongX ? 0 : Math.PI / 2;
      for (let k = 0; k < count && !full(plan); k++) {
        const off = (k + 0.5) * len;
        site.place(plan, {
          id, x: alongX ? gx + off : gx, z: alongX ? gz : gz + off, yaw,
          cls: 'prop', solid: 1.1, pad: -0.05, roadClear: 8,
        });
      }
    }
  }

  // Long grass and weeds: a jittered 7 m grid, thicker near the city.
  let plants = 0;
  outer: for (let gx = -400; gx <= 400; gx += 7) {
    for (let gz = -400; gz <= 400; gz += 7) {
      if (full(plan)) break outer;
      const x = gx + (rnd() * 2 - 1) * 2.5;
      const z = gz + (rnd() * 2 - 1) * 2.5;
      const depth = beltDepth(x, z);
      if (depth < 9 || depth > 185) continue;
      if (rnd() >= 0.18 + 0.4 * beltDensity(x, z)) continue;
      const weeds = FRINGE_THEMES[themeRegion(themeAt(x, z, rnd()))].weeds;
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        if (plants >= FRINGE.maxPlants || full(plan)) break outer;
        const px = x + (rnd() * 2 - 1) * 1.5;
        const pz = z + (rnd() * 2 - 1) * 1.5;
        const id = weeds[Math.floor(rnd() * weeds.length)];
        if (site.place(plan, { id, x: px, z: pz, yaw: rnd() * Math.PI * 2, cls: 'detail', roadClear: 6.5, pad: 0.1 })) {
          plants++;
        }
      }
    }
  }
}
