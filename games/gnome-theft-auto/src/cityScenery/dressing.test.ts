// The parks, street scenery and fringe on the real map (docs/roadmaps/gta-parks-and-fringe.md): nothing lands on a road,
// a sidewalk, water, a skyway deck, a parked vehicle or an existing collider; ground patches never overlap (z-fight);
// the budgets hold; the plan is the same on every client.
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { World } from '../types';
import type { CityDressingPlan } from './install';
import type { GroundPatch } from './types';

vi.mock('../audio', () => ({ play: () => undefined }));

interface R { minX: number; maxX: number; minZ: number; maxZ: number }

function patchBounds(p: GroundPatch): R {
  if (p.shape === 'ribbon' && p.points && p.points.length > 0) {
    const xs = p.points.map((q) => q[0]), zs = p.points.map((q) => q[1]);
    return { minX: Math.min(...xs) - p.w / 2, maxX: Math.max(...xs) + p.w / 2, minZ: Math.min(...zs) - p.w / 2, maxZ: Math.max(...zs) + p.w / 2 };
  }
  if (p.shape === 'disc') return { minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.w / 2, maxZ: p.z + p.w / 2 };
  const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw));
  const hw = (p.w * c + p.d * s) / 2, hd = (p.w * s + p.d * c) / 2;
  return { minX: p.x - hw, maxX: p.x + hw, minZ: p.z - hd, maxZ: p.z + hd };
}

const overlapBy = (a: R, b: R, tol: number): boolean =>
  Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > tol && Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > tol;

async function build(): Promise<{ world: World; before: R[]; plan: CityDressingPlan }> {
  const { buildWorld } = await import('../world');
  const { installSkyways } = await import('../highways/install');
  const { planCityDressing } = await import('./install');
  const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  installSkyways(new THREE.Scene(), world);
  const before = world.boxes.map((b) => ({ ...b }));
  return { world, before, plan: planCityDressing(world) };
}

describe('city dressing on the real map', () => {
  let world: World;
  let before: R[];
  let plan: CityDressingPlan;
  beforeAll(async () => {
    installFakeDom();
    ({ world, before, plan } = await build());
  }, 240_000);

  it('new colliders keep off existing ones', () => {
    const grid = new Map<string, R[]>();
    for (const b of before) {
      for (let cx = Math.floor(b.minX / 32); cx <= Math.floor(b.maxX / 32); cx++) {
        for (let cz = Math.floor(b.minZ / 32); cz <= Math.floor(b.maxZ / 32); cz++) {
          const k = `${cx},${cz}`;
          (grid.get(k) ?? grid.set(k, []).get(k)!).push(b);
        }
      }
    }
    const bad: string[] = [];
    for (const c of plan.site.colliders) {
      const seen = new Set<R>();
      for (let cx = Math.floor(c.minX / 32); cx <= Math.floor(c.maxX / 32); cx++) {
        for (let cz = Math.floor(c.minZ / 32); cz <= Math.floor(c.maxZ / 32); cz++) {
          for (const b of grid.get(`${cx},${cz}`) ?? []) {
            if (seen.has(b)) continue;
            seen.add(b);
            if (overlapBy(c, b, 0.05)) bad.push(`${c.minX.toFixed(1)},${c.minZ.toFixed(1)}`);
          }
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('new colliders keep off lanes, sidewalks, water and decks', async () => {
    const { roadDistance } = await import('./site');
    const { onSidewalk } = await import('../parking');
    const { waterLevelAt } = await import('../water');
    const { deckContactsAt } = await import('../highways/deck');
    const bad: string[] = [];
    for (const c of plan.site.colliders) {
      const pts: [number, number][] = [[c.minX, c.minZ], [c.maxX, c.minZ], [c.minX, c.maxZ], [c.maxX, c.maxZ], [(c.minX + c.maxX) / 2, (c.minZ + c.maxZ) / 2]];
      // The sidewalk stays walkable: no collider centre on it, except posts on its outer edge (like the street lamps).
      const [mx, mz] = pts[4];
      if (onSidewalk(mx, mz) && roadDistance(mx, mz) < 7.4) { bad.push(`sidewalk ${mx.toFixed(1)},${mz.toFixed(1)}`); continue; }
      for (const [x, z] of pts) {
        if (roadDistance(x, z) < 5.6 || waterLevelAt(x, z) !== null || deckContactsAt(x, z).length > 0) {
          bad.push(`${x.toFixed(1)},${z.toFixed(1)}`);
          break;
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('parked vehicles keep their spots', () => {
    const bad = plan.site.colliders.filter((c) => world.parked.some((p) =>
      p.x > c.minX - 2.5 && p.x < c.maxX + 2.5 && p.z > c.minZ - 2.5 && p.z < c.maxZ + 2.5));
    expect(bad.length).toBe(0);
  });

  it('ground patches never overlap', () => {
    // A ribbon (a loop round a pond, a track) is checked as small squares along its centre line, not by its bounds.
    const all: { owner: number; r: R }[] = [];
    [...plan.parks.patches, ...plan.street.patches, ...plan.fringe.patches].forEach((p, i) => {
      if (p.shape !== 'ribbon' || !p.points) { all.push({ owner: i, r: patchBounds(p) }); return; }
      for (let k = 0; k + 1 < p.points.length; k++) {
        const [ax, az] = p.points[k], [bx, bz] = p.points[k + 1];
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1));
        for (let s = 0; s <= n; s++) {
          const x = ax + ((bx - ax) * s) / n, z = az + ((bz - az) * s) / n, h = p.w / 2 * 0.7;
          all.push({ owner: i, r: { minX: x - h, maxX: x + h, minZ: z - h, maxZ: z + h } });
        }
      }
    });
    const bad: string[] = [];
    for (let i = 0; i < all.length && bad.length < 5; i++) {
      for (let j = i + 1; j < all.length; j++) {
        if (all[i].owner !== all[j].owner && overlapBy(all[i].r, all[j].r, 0.05)) { bad.push(`${all[i].owner}/${all[j].owner}`); break; }
      }
    }
    expect(bad).toEqual([]);
  });

  it('stays within its budgets', () => {
    expect(plan.parks.dress.length).toBeLessThanOrEqual(1200);
    expect(plan.street.dress.length).toBeLessThanOrEqual(1800);
    expect(plan.fringe.dress.length).toBeLessThanOrEqual(2600);
    expect(plan.parks.gnomes.length + plan.street.gnomes.length + plan.fringe.gnomes.length).toBeLessThanOrEqual(20);
    const ducks = [plan.parks, plan.street, plan.fringe].flatMap((p) => p.ducks).reduce((n, d) => n + d.n, 0);
    expect(ducks).toBeLessThanOrEqual(8);
    expect(plan.parks.marks.length + plan.street.marks.length + plan.fringe.marks.length).toBeLessThanOrEqual(4000);
    expect(plan.parks.cables.length + plan.street.cables.length + plan.fringe.cables.length).toBeLessThanOrEqual(800);
  });

  it('stands on the ground', async () => {
    const { heightAt } = await import('../terrain');
    // Never floating; wide pieces may sit sunk to their lowest corner on a slope.
    const bad = [plan.parks, plan.street, plan.fringe].flatMap((p) => p.dress).filter((d) => {
      const dy = d.y - heightAt(d.x, d.z);
      return dy > 0.2 || dy < (d.cls === 'detail' || d.cls === 'tiny' ? -0.2 : -1.3);
    });
    expect(bad.slice(0, 5).map((d) => `${d.id}@${d.x.toFixed(1)},${d.z.toFixed(1)}`)).toEqual([]);
  });

  it('is the same on every client', async () => {
    const again = (await build()).plan;
    const key = (p: CityDressingPlan): string => JSON.stringify([p.parks, p.street, p.fringe].map((q) => [q.dress, q.patches, q.marks]));
    expect(key(again)).toBe(key(plan));
  }, 240_000);
});
