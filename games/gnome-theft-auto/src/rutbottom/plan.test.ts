// The Rutbottom Dirt Bowl's plan: everything inside the site, clear of the road, the pit gap kept, the stories told, and
// createRutbottom builds into a scene with colliders.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { siteRect } from '../sites';
import { TRACKS } from '../raceTrack/tracks';
import { CLARY_SPOT, PIT_GAP, TEASEL_SPOT } from './spots';

installFakeDom();
const { buildBowlPlan } = await import('./plan');
const { createRutbottom } = await import('./index');

const T = TRACKS.rutbottom;
const R = siteRect('dirt-track');
const plan = buildBowlPlan();
const inside = (x: number, z: number): boolean => x >= R.minX && x <= R.maxX && z >= R.minZ && z <= R.maxZ;

describe('rutbottom plan', () => {
  it('keeps every prop, barrier, sign and resident inside the site', () => {
    for (const p of [...plan.barriers, ...plan.props, ...plan.signs, ...plan.residents, ...plan.stands]) {
      expect(inside(p.x, p.z), `${'id' in p ? p.id : 'sign'} at ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`).toBe(true);
    }
  });

  it('keeps props (not barriers or signs) off the road', () => {
    for (const p of plan.props) {
      const l = T.locate(p.x, p.z, 60);
      if (l) expect(l.dist, `${p.id} at ${p.x}, ${p.z}`).toBeGreaterThan(T.def.width / 2 + 1);
    }
  });

  it('lines both sides with hay bales and leaves the pit gap open', () => {
    const bales = plan.barriers.filter((b) => b.id === 'hay-bale');
    expect(bales.length).toBeGreaterThan(300);
    expect(plan.barriers.filter((b) => b.id === 'speedway-tyre-stack').length).toBeGreaterThan(10);
    let outside = 0, inGap = 0;
    for (const b of bales) {
      const l = T.locate(b.x, b.z, 30);
      if (!l) continue;
      if (l.lat > 0) outside++;
      if (l.lat > 0 && l.s >= PIT_GAP.from + 2 && l.s <= PIT_GAP.to - 2) inGap++;
    }
    expect(outside).toBeGreaterThan(100);
    expect(inGap).toBe(0);
    // ... while the infield side is unbroken there.
    expect(bales.some((b) => { const l = T.locate(b.x, b.z, 30); return !!l && l.lat < 0 && l.s >= PIT_GAP.from && l.s <= PIT_GAP.to; })).toBe(true);
  });

  it('tells its stories: vignettes, signs, residents', () => {
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(4);
    for (const v of plan.vignettes) expect(v.story.length, v.id).toBeGreaterThan(30);
    expect(plan.signs.length).toBeGreaterThanOrEqual(6);
    expect(plan.residents.length).toBeGreaterThanOrEqual(3);
    const text = plan.signs.map((s) => s.text).join('\n');
    for (const t of ['WHOOPS', 'THE BERM', 'Spectators WILL get muddy', 'Knobblies only', 'hosing down', 'est. the year it rained']) {
      expect(text).toContain(t);
    }
  });

  it('keeps colliders and residents clear of the quest givers', () => {
    for (const [x, z] of [[CLARY_SPOT.x, CLARY_SPOT.z], [TEASEL_SPOT.x, TEASEL_SPOT.z]] as const) {
      for (const p of plan.props) {
        if (!p.solid) continue;
        expect(Math.hypot(p.x - x, p.z - z), `${p.id} by (${x}, ${z})`).toBeGreaterThan(2);
      }
      for (const c of plan.colliders) expect(Math.hypot(c.x - x, c.z - z)).toBeGreaterThan(c.hw + 1.5);
    }
  });
});

describe('createRutbottom', () => {
  it('builds the bowl into a scene and adds colliders', () => {
    const scene = new THREE.Scene();
    const world = { boxes: [] } as unknown as Parameters<typeof createRutbottom>[1];
    const toasts: string[] = [];
    const area = createRutbottom(scene, world, { toast: (t) => toasts.push(t), unlock: () => undefined, increment: () => undefined });
    expect(world.boxes.length).toBeGreaterThan(300);
    const names = scene.children.map((c) => c.name);
    for (const n of ['rutbottom-road', 'rutbottom-runoff', 'rutbottom-line', 'rutbottom-grid', 'rutbottom-pit-lane']) expect(names).toContain(n);
    expect(area.blips()[0]).toMatchObject({ x: 1200, z: -650, label: 'Rutbottom Dirt Bowl' });
    area.update(0.016, 1200, -650, 0);
  });
});
