// Park layouts B (docs/roadmaps/gta-parks-and-fringe.md, issue 1I): the layouts run on the real world through a Site.
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { World } from '../types';
import type { Site } from '../cityScenery/site';
import type { DressPlan, GroundPatch } from '../cityScenery/types';
import { PARKS, type ParkDef } from './blocks';
import { parkCtx, type ParkCtx } from './kit';
import { layoutClayfootRose, layoutMallardMere, layoutPureLoam } from './layoutB';

vi.mock('../audio', () => ({ play: () => undefined }));

let createSite: typeof import('../cityScenery/site').createSite;
let emptyPlan: typeof import('../cityScenery/types').emptyPlan;
let world: World;

const park = (id: string): ParkDef => PARKS.find((p) => p.id === id)!;

/** Runs the three layouts B on one site; each park gets its own plan (the parks are disjoint). */
function runB(site: Site): Record<string, DressPlan> {
  const plans: Record<string, DressPlan> = {};
  const run = (id: string, layout: (c: ParkCtx) => void): void => {
    const plan = emptyPlan();
    plans[id] = plan;
    layout(parkCtx(site, plan, park(id)));
  };
  run('mallard-mere', layoutMallardMere);
  run('clayfoot-rose', layoutClayfootRose);
  run('pure-loam', layoutPureLoam);
  return plans;
}

/** Distance from a point to a rectangle (0 inside). Patches here are never turned, so no rotation is needed. */
function distToRect(x: number, z: number, p: GroundPatch): number {
  const dx = Math.max(p.x - p.w / 2 - x, 0, x - (p.x + p.w / 2));
  const dz = Math.max(p.z - p.d / 2 - z, 0, z - (p.z + p.d / 2));
  return Math.hypot(dx, dz);
}

/** Distance from a point to a disc (0 inside). */
function distToDisc(x: number, z: number, p: GroundPatch): number {
  return Math.max(0, Math.hypot(x - p.x, z - p.z) - p.w / 2);
}

/** Distance from a point to the nearest point of a patch's footprint (ribbons: any segment of the centreline). */
function distTo(x: number, z: number, p: GroundPatch): number {
  if (p.shape === 'rect') return distToRect(x, z, p);
  if (p.shape === 'disc') return distToDisc(x, z, p);
  let best = Infinity;
  const pts = p.points ?? [];
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    const vx = bx - ax, vz = bz - az;
    const l2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
    best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
  }
  return best;
}

/** Overlap test for two patches. Rect and disc pairs compare their bounds; a ribbon is tested by its centreline
 *  (sampled), so a ring round a pond does not count as overlapping the pond's bounding square. */
function overlaps(a: GroundPatch, b: GroundPatch): boolean {
  if (a.shape === 'ribbon' || b.shape === 'ribbon') {
    const [rib, other] = a.shape === 'ribbon' ? [a, b] : [b, a];
    const pts = rib.points ?? [];
    for (let k = 0; k + 1 < pts.length; k++) {
      for (let s = 0; s <= 8; s++) {
        const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * (s / 8);
        const z = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * (s / 8);
        if (distTo(x, z, other) < rib.w / 2 - 1e-6) return true;
      }
    }
    return false;
  }
  const halfW = (p: GroundPatch): number => p.w / 2;
  const halfD = (p: GroundPatch): number => (p.shape === 'disc' ? p.w / 2 : p.d / 2);
  return Math.abs(a.x - b.x) < halfW(a) + halfW(b) && Math.abs(a.z - b.z) < halfD(a) + halfD(b);
}

describe('park layouts B', () => {
  beforeAll(async () => {
    installFakeDom();
    ({ createSite } = await import('../cityScenery/site'));
    ({ emptyPlan } = await import('../cityScenery/types'));
    const { buildWorld } = await import('../world');
    const { installSkyways } = await import('../highways/install');
    world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    installSkyways(new THREE.Scene(), world);
  }, 180_000);

  it('Mallard Mere: one pond disc, one dog-walk ribbon and one duck entry', () => {
    const p = runB(createSite(world))['mallard-mere'];
    expect(p.patches.filter((g) => g.shape === 'disc' && g.kind === 'pond')).toHaveLength(1);
    expect(p.patches.filter((g) => g.shape === 'ribbon')).toHaveLength(1);
    expect(p.ducks).toHaveLength(1);
  }, 180_000);

  it('Clayfoot Rose Garden: a hedge maze, one wish spot and rose beds', () => {
    const p = runB(createSite(world))['clayfoot-rose'];
    expect(p.dress.filter((d) => d.id === 'hedgerow').length).toBeGreaterThanOrEqual(18);
    expect(p.uses.filter((u) => u.kind === 'wish' && u.park === 'clayfoot-rose')).toHaveLength(1);
    expect(p.dress.filter((d) => d.id === 'rose-bush').length).toBeGreaterThanOrEqual(20);
  }, 180_000);

  it('Pure-Loam Allotments: at least 30 allotment beds', () => {
    const p = runB(createSite(world))['pure-loam'];
    expect(p.dress.filter((d) => d.id === 'allotment-bed').length).toBeGreaterThanOrEqual(30);
  }, 180_000);

  it('each park has at most 4 gnomes, with unique ids', () => {
    const plans = runB(createSite(world));
    for (const [id, p] of Object.entries(plans)) {
      expect(p.gnomes.length, id).toBeLessThanOrEqual(4);
      const ids = p.gnomes.map((g) => g.id);
      expect(new Set(ids).size, id).toBe(ids.length);
    }
  }, 180_000);

  it('no two patches in a plan overlap', () => {
    const plans = runB(createSite(world));
    for (const [id, p] of Object.entries(plans)) {
      for (let i = 0; i < p.patches.length; i++) {
        for (let j = i + 1; j < p.patches.length; j++) {
          expect(overlaps(p.patches[i], p.patches[j]), `${id}: patches ${i} and ${j}`).toBe(false);
        }
      }
    }
  }, 180_000);

  it('the same layouts on a second fresh site give the same output', () => {
    const a = runB(createSite(world));
    const b = runB(createSite(world));
    const out = (plans: Record<string, DressPlan>): string => JSON.stringify(Object.values(plans));
    expect(out(b)).toBe(out(a));
  }, 180_000);
});
