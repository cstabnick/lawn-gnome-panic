// The Capwood Run's dressing plan: props clear of the road, the grid and other places, enough flags, vignettes, signs
// and residents; and createCapwoodRunDressing builds (fake DOM) with a pool mesh per ford.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();

const { runPlan } = await import('./runPlan');
const { TRACKS, ALL_TRACKS } = await import('../raceTrack/tracks');
const { SITES, inSite } = await import('../sites');
const { setTerrainOptions, resetTerrainOptions, heightAt } = await import('../terrain');

const T = TRACKS['capwood-run'];
const ALLOWED_SITES = ['rally-route', 'toadstool-forest'];

beforeAll(() => {
  setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
  heightAt(0, 0);
});
afterAll(() => resetTerrainOptions());

describe('runPlan', () => {
  const plan = runPlan(T);

  it('keeps props off the road except flags, start poles and the arch', () => {
    for (const p of plan.props) {
      if (p.onRoad) continue;
      const loc = T.locate(p.x, p.z, 60);
      if (loc) expect(loc.dist, `${p.id} at ${p.x.toFixed(0)},${p.z.toFixed(0)}`).toBeGreaterThanOrEqual(T.def.barrierOffset + 0.5);
    }
    for (const s of plan.signs) {
      if (s.kind === 'banner' || s.kind === 'plaque') continue;
      const loc = T.locate(s.x, s.z, 60);
      if (loc) expect(loc.dist, s.text).toBeGreaterThanOrEqual(T.def.barrierOffset + 0.5);
    }
  });

  it('puts nothing on another track or inside another site', () => {
    const others = ALL_TRACKS.filter((t) => t.id !== T.id);
    const pts = [...plan.props, ...plan.signs, ...plan.residents];
    for (const p of pts) {
      for (const t of others) expect(t.onRoad(p.x, p.z), `${'id' in p ? p.id : 'sign'} on ${t.id}`).toBe(false);
      for (const s of SITES) {
        if (ALLOWED_SITES.includes(s.id)) continue;
        expect(inSite(s.id, p.x, p.z), `${'id' in p ? p.id : 'sign'} in ${s.id}`).toBe(false);
      }
    }
  });

  it('keeps 12 m round the grid except the pavilion and paddock bales', () => {
    const slots = [0, 1, 2, 3].map((i) => T.gridSlot(i));
    for (const p of plan.props) {
      if (p.paddock) continue;
      for (const g of slots) expect(Math.hypot(p.x - g.x, p.z - g.z), p.id).toBeGreaterThanOrEqual(12);
    }
    for (const r of plan.residents) for (const g of slots) expect(Math.hypot(r.x - g.x, r.z - g.z), r.id).toBeGreaterThanOrEqual(5);
  });

  it('has the required counts', () => {
    expect(plan.props.filter((p) => p.id === 'capwood-stage-flag').length).toBeGreaterThanOrEqual(24);
    expect(plan.props.some((p) => p.id === 'olympic-finish-arch')).toBe(true);
    expect(plan.props.some((p) => p.id === 'capwood-start-pavilion')).toBe(true);
    expect(plan.props.filter((p) => p.id === 'capwood-ford-sign').length).toBe(4);
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(4);
    for (const v of plan.vignettes) expect(v.story.length).toBeGreaterThan(20);
    expect(plan.signs.length).toBeGreaterThanOrEqual(6);
    expect(plan.residents.length).toBeGreaterThanOrEqual(3);
    expect(new Set(plan.residents.map((r) => r.id)).size).toBe(plan.residents.length);
  });
});

describe('createCapwoodRunDressing', () => {
  it('builds the surface, the plan and one pool per ford', async () => {
    const { createCapwoodRunDressing } = await import('./run');
    const scene = new THREE.Scene();
    const world = { boxes: [] } as never;
    const area = createCapwoodRunDressing(scene, world, { toast: () => undefined, unlock: () => undefined, increment: () => undefined });
    for (const f of T.def.fords ?? []) {
      const pool = scene.getObjectByName(`capwood-run-ford-${f.id}`) as THREE.Mesh | undefined;
      expect(pool, f.id).toBeDefined();
      const mat = pool!.material as THREE.Material;
      expect(mat.polygonOffset).toBe(true);
      expect((pool!.geometry.getAttribute('position') as THREE.BufferAttribute).count).toBeGreaterThan(100);
    }
    expect(scene.getObjectByName('capwood-run-road')).toBeDefined();
    expect(area.blips()[0].label).toBe('the Capwood Run');
    area.update(0.1, 90, -760, 0);
  });
});
