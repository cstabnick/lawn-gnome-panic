import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { ROUTE_IDS, ROUTES, type RouteId } from './routes';
import { BRIM_WALK_SPOTS } from './defs/brimWalk';
import { BOLLARD_R, GATE_GAP, REGISTER_LINES, hatbrimPlan, registerSpot } from './hatbrimPlan';

const plan = hatbrimPlan();
const OWN: RouteId[] = ['hatband', 'brim-walk'];

/** The own route of a prop (the nearer of the Hatband and the Brim Walk) and the distance to it. */
function ownRoute(x: number, z: number): { id: RouteId; dist: number; lat: number } {
  let best: { id: RouteId; dist: number; lat: number } = { id: 'hatband', dist: Infinity, lat: 0 };
  for (const id of OWN) {
    const l = ROUTES[id].locate(x, z, 60);
    if (l && l.dist < best.dist) best = { id, dist: l.dist, lat: l.lat };
  }
  return best;
}

describe('hatbrim plan', () => {
  it('uses prefabs that exist', () => {
    for (const p of plan.props) expect(getPrefab(p.id), p.id).toBeTruthy();
    for (const id of ['stone-stile', 'summit-register-box', 'route-name-sign', 'scree-pile', 'viewpoint-topograph', 'falling-rocks-sign',
      'tarn-bothy', 'hamlet-stone-cairn', 'euro-bollard', 'bench', 'log-bench', 'goat', 'hunter-tent', 'dirt-mower-bike']) {
      expect(getPrefab(id), id).toBeTruthy();
    }
  });

  it('has the expected counts', () => {
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(3);
    expect(plan.residents.length).toBe(3);
    expect(plan.residents.map((r) => r.idle).sort()).toEqual(['look-around', 'read', 'sit-ground']);
    expect(plan.signs.length).toBeGreaterThanOrEqual(10);
    for (const s of plan.signs) expect(s.text.length).toBeGreaterThan(0);
    expect(plan.props.filter((p) => p.id === 'euro-bollard').length).toBe(8);
    expect(plan.props.filter((p) => p.id === 'tarn-bothy').length).toBe(1);
    expect(plan.props.filter((p) => p.id === 'summit-register-box').length).toBe(1);
    expect(plan.props.filter((p) => p.id === 'stone-stile').length).toBe(1);
    expect(plan.props.filter((p) => p.id === 'hamlet-stone-cairn').length).toBeGreaterThanOrEqual(8);
    expect(REGISTER_LINES.length).toBe(6);
    const texts = plan.signs.map((s) => s.text).join('\n');
    for (const t of ['THE HATBAND', "WORLD'S EDGE", "PATE'S BOTHY", 'THE BOBBLE', '105 m']) expect(texts).toContain(t);
  });

  it('keeps each gate gap at exactly 2.6 m between bollard faces', () => {
    const bollards = plan.props.filter((p) => p.id === 'euro-bollard');
    for (const b of bollards) expect('r' in (b.solid ?? {})).toBe(true);
    // Two gates of four, each a row across the track: sort each by lateral place and measure the gaps.
    const hb = ROUTES.hatband;
    for (const half of [bollards.slice(0, 4), bollards.slice(4)]) {
      const rows = half.map((b) => ({ b, lat: hb.locate(b.x, b.z, 20)!.lat })).sort((a, c) => a.lat - c.lat);
      for (let i = 1; i < rows.length; i++) {
        const gap = Math.hypot(rows[i].b.x - rows[i - 1].b.x, rows[i].b.z - rows[i - 1].b.z) - 2 * BOLLARD_R;
        expect(gap).toBeCloseTo(GATE_GAP, 1);
      }
      expect(rows.some((r) => Math.abs(r.lat) < 0.3)).toBe(true); // a bollard stands on the centre line
    }
  });

  it('keeps props off the road and near their own route, away from the others', () => {
    for (const p of plan.props) {
      const own = ownRoute(p.x, p.z);
      expect(own.dist, `${p.id} within 40 m of its route`).toBeLessThanOrEqual(40);
      const track = ROUTES[own.id];
      const isGate = p.id === 'euro-bollard';
      const isStile = p.id === 'stone-stile';
      if (!isGate && !isStile) {
        expect(own.dist, `${p.id} (${p.x.toFixed(0)}, ${p.z.toFixed(0)}) clear of the road`).toBeGreaterThan(track.def.width / 2 + 0.3);
      }
      // Props stay 6 m off the other routes (the gates, where the Hatband leaves the Brim Gap Road, are the exception).
      if (!isGate && !(p.id === 'route-name-sign' && own.id === 'hatband')) {
        for (const id of ROUTE_IDS) {
          if (id === own.id) continue;
          const l = ROUTES[id].locate(p.x, p.z, 10);
          if (l) expect(l.dist, `${p.id} (${p.x.toFixed(0)}, ${p.z.toFixed(0)}) from ${id}`).toBeGreaterThanOrEqual(6);
        }
      }
    }
  });

  it('puts the register spot within 3 m of the summit', () => {
    const r = registerSpot();
    const s = BRIM_WALK_SPOTS.summit;
    expect(Math.hypot(r.x - s.x, r.z - s.z)).toBeLessThan(3);
    const box = plan.props.find((p) => p.id === 'summit-register-box')!;
    expect(Math.hypot(box.x - s.x, box.z - s.z)).toBeLessThan(6);
  });

  it('gives every resident and vignette a name and a line', () => {
    for (const r of plan.residents) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.bubble.length).toBeGreaterThan(10);
    }
    for (const v of plan.vignettes) expect(v.story.length).toBeGreaterThan(20);
  });
});
