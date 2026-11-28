import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { ALL_ROUTES, ROUTES } from './routes';
import { SPINE_CUT_SPOTS } from './defs/spineCut';
import { spinePlan } from './spinePlan';

const track = ROUTES['spine-cut'];
const plan = spinePlan();
const edge = track.def.width / 2 + track.def.shoulder + 0.5;

describe('spine cut plan', () => {
  it('uses prefabs that exist', () => {
    for (const p of plan.props) expect(getPrefab(p.id), p.id).toBeTruthy();
  });

  it('has the expected counts', () => {
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(3);
    expect(plan.signs.length).toBeGreaterThanOrEqual(8);
    expect(plan.residents.length).toBe(2);
    expect(plan.residents.some((r) => r.name === 'Plumb Bob')).toBe(true);
    expect(plan.props.filter((p) => p.id === 'keyhole-arch').length).toBe(1);
    expect(plan.solids.length).toBe(2);
    for (const s of plan.signs) expect(s.text.length).toBeGreaterThan(0);
  });

  it('stands the arch at the keyhole, lintel across the road', () => {
    const k = SPINE_CUT_SPOTS.keyhole;
    expect(plan.arch.x).toBe(k.x);
    expect(plan.arch.z).toBe(k.z);
    expect(plan.arch.yaw).toBeCloseTo(k.yaw, 6);
  });

  it('keeps the road clear under the arch (edge + 1 m)', () => {
    const k = SPINE_CUT_SPOTS.keyhole;
    const clear = track.def.width / 2 + 1;
    for (const s of plan.solids) {
      const loc = track.locate(s.x, s.z, 40);
      expect(loc).toBeTruthy();
      expect(Math.abs(loc!.lat) - s.r).toBeGreaterThanOrEqual(clear);
      expect(Math.hypot(s.x - k.x, s.z - k.z)).toBeLessThan(12);
    }
    // No other solid inside the road edge plus 1 m near the keyhole.
    for (const p of plan.props) {
      if (!p.solid || p.id === 'keyhole-arch') continue;
      if (Math.hypot(p.x - k.x, p.z - k.z) > 30) continue;
      const loc = track.locate(p.x, p.z, 40);
      if (loc) expect(Math.abs(loc.lat)).toBeGreaterThan(clear);
    }
  });

  it('keeps props off the road, near it, and away from other routes', () => {
    for (const p of plan.props) {
      if (p.id === 'keyhole-arch') continue;
      const loc = track.locate(p.x, p.z, 80);
      expect(loc, `${p.id} near the road`).toBeTruthy();
      expect(loc!.dist, `${p.id} @ ${p.x.toFixed(0)},${p.z.toFixed(0)}`).toBeGreaterThanOrEqual(edge - 0.01);
      expect(loc!.dist, `${p.id} within 40 m`).toBeLessThanOrEqual(40);
      for (const other of ALL_ROUTES) {
        if (other === track) continue;
        const o = other.locate(p.x, p.z, 6);
        if (o) expect(o.dist, `${p.id} vs ${other.def.id}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('places residents and signs near the road', () => {
    for (const r of plan.residents) expect(track.locate(r.x, r.z, 40), r.id).toBeTruthy();
    for (const s of plan.signs) {
      const loc = track.locate(s.x, s.z, 40);
      expect(loc, s.text).toBeTruthy();
      expect(loc!.dist).toBeGreaterThanOrEqual(edge - 0.01);
    }
  });
});
