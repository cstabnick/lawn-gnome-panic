import { describe, expect, it } from 'vitest';
import { heightAt, waterAt } from '../../terrain';
import { distToLine, ribbonRows, type GroundPatch } from '../groundPlan';
import { districtAt, pathPoints } from '../layout';
import { pardonlinPlans } from '../plans';
import { FACE, planThymes, sAtZ, TOWN_Z } from './thymes';

const plan = planThymes();
const kept = pardonlinPlans().flatMap((p) => p.props);
const BOATS = ['pl-houseboat', 'pl-peniche', 'pl-rowboat-sunk', 'walnut-dinghy', 'pl-swan-pedalo'];
const WALLS = ['pl-quay-wall', 'pl-quay-wall-low', 'pl-quay-stairs'];
const th = pathPoints('thymes');
/** Signed distance of a point east (+) or west (-) of the river's centre line (the lines are near-vertical). */
const sideOf = (x: number, z: number): 1 | -1 => {
  let best = Infinity, sign: 1 | -1 = 1;
  for (let i = 1; i < th.length; i++) {
    const [ax, az] = th[i - 1], [bx, bz] = th[i];
    if (z < az || z > bz) continue;
    const cx = ax + ((bx - ax) * (z - az)) / (bz - az);
    if (Math.abs(x - cx) < best) { best = Math.abs(x - cx); sign = x >= cx ? 1 : -1; }
  }
  return sign;
};

describe('the Thymes plan', () => {
  it('every piece of it is kept by a district', () => {
    const dropped = plan.props.filter((p) => !districtAt(p.x, p.z));
    expect(dropped.map((p) => `${p.id} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`)).toEqual([]);
    expect(kept.filter((p) => WALLS.includes(p.id)).length).toBeGreaterThan(300);
  });

  it('sits the water 1.5 to 2.2 m under the coping, off the bridges (the wall dips under each deck)', () => {
    for (const p of kept.filter((q) => q.id === 'pl-quay-wall' && ![-300, -30, 250].some((bz) => Math.abs(q.z - bz) < 8))) {
      const top = p.y! + heightAt(p.x, p.z) + 3.2;
      // The wall stands at the water's edge: sample the water a metre out from its face (local +z).
      const out = waterAt(p.x + Math.sin(p.yaw!) * 1.5, p.z + Math.cos(p.yaw!) * 1.5);
      if (!out) continue;
      expect(top - out.surface, `wall at (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`).toBeGreaterThan(1.5);
      expect(top - out.surface).toBeLessThan(2.2);
    }
  });

  it('moors at least six boats, each over water and within 4 m of a quay wall', () => {
    const boats = kept.filter((p) => BOATS.includes(p.id) && distToLine(p.x, p.z, th) < 12);
    expect(boats.length).toBeGreaterThanOrEqual(6);
    expect(boats.length).toBeLessThanOrEqual(12);
    const walls = kept.filter((p) => WALLS.includes(p.id));
    for (const b of boats) {
      expect(waterAt(b.x, b.z), `${b.id} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`).not.toBeNull();
      const near = Math.min(...walls.map((w) => Math.hypot(w.x - b.x, w.z - b.z)));
      expect(near, `${b.id} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`).toBeLessThan(4);
    }
  });

  it('cuts at least four stairs, on both banks', () => {
    const stairs = kept.filter((p) => p.id === 'pl-quay-stairs');
    expect(stairs.length).toBeGreaterThanOrEqual(4);
    expect(new Set(stairs.map((s) => sideOf(s.x, s.z))).size).toBe(2);
  });

  it('walls both banks through the town with no gap over 1 m', () => {
    const walls = kept.filter((p) => WALLS.includes(p.id));
    // West bank from z -460 and east bank to z 640: see the first test for why.
    for (const [side, from, to] of [[1, TOWN_Z.from, 640], [-1, -460, TOWN_Z.to]] as const) {
      const zs = walls.filter((w) => sideOf(w.x, w.z) === side && w.z >= from - 5 && w.z <= to + 5).map((w) => w.z).sort((a, b) => a - b);
      expect(zs.length).toBeGreaterThan(100);
      expect(zs[0], `side ${side} starts`).toBeLessThan(from + 4);
      expect(zs[zs.length - 1], `side ${side} ends`).toBeGreaterThan(to - 4);
      for (let i = 1; i < zs.length; i++) expect(zs[i] - zs[i - 1] - 4.2 * 0.995, `side ${side} gap at z ${zs[i].toFixed(1)}`).toBeLessThanOrEqual(1);
    }
  });

  it('stands the walls on the water\'s edge', () => {
    // The face is 7.7 m from the centre line; the water edge is 8 (WATER.courses.thymes: width 16).
    expect(FACE).toBeGreaterThan(7.4);
    expect(FACE).toBeLessThan(8);
    expect(sAtZ(-300)).toBeGreaterThan(sAtZ(-400));
  });

  it('lays quay bands that stay 10 m off every bridge road', () => {
    const roads = ['pl-pont-nord', 'pl-pont-neuf', 'pl-pont-sud'].map((id) => pathPoints(id));
    const bands = plan.ground.filter((g): g is Extract<GroundPatch, { band: unknown }> => 'band' in g);
    expect(bands.length).toBeGreaterThanOrEqual(8);
    for (const g of bands) {
      expect(g.kind).toBe('quay');
      expect(g.accent).toBeFalsy();
      for (const r of ribbonRows(g.band, 1.5)) {
        for (const off of [0, g.from, g.to]) {
          const x = r.x + r.nx * off, z = r.z + r.nz * off;
          for (const road of roads) expect(distToLine(x, z, road), `band row (${x.toFixed(1)}, ${z.toFixed(1)})`).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  it('keeps its quay bands off every other plain patch on the patch layer', () => {
    const mine = plan.ground.filter((g): g is Extract<GroundPatch, { band: unknown }> => 'band' in g);
    const others = pardonlinPlans().flatMap((p) => p.ground).filter((g) => g.kind !== 'quay' && !g.accent);
    const inside = (g: GroundPatch, x: number, z: number): boolean => {
      if ('rect' in g) {
        const r = g.rect, yaw = r.yaw ?? 0, dx = x - r.x, dz = z - r.z;
        const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw), lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
        return Math.abs(lx) <= r.w / 2 && Math.abs(lz) <= r.d / 2;
      }
      if ('circle' in g) return Math.hypot(x - g.circle.x, z - g.circle.z) <= g.circle.r && Math.hypot(x - g.circle.x, z - g.circle.z) >= (g.circle.r0 ?? 0);
      if ('line' in g) return distToLine(x, z, g.line) <= g.width / 2;
      const rows = ribbonRows(g.band, 1.5);
      return rows.some((r) => {
        const along = (x - r.x) * -r.nz + (z - r.z) * r.nx;
        const off = (x - r.x) * r.nx + (z - r.z) * r.nz;
        return Math.abs(along) < 1 && off >= g.from && off <= g.to;
      });
    };
    for (const g of mine) {
      for (const r of ribbonRows(g.band, 3)) {
        for (const off of [g.from + 0.2, (g.from + g.to) / 2, g.to - 0.2]) {
          const x = r.x + r.nx * off, z = r.z + r.nz * off;
          for (const o of others) expect(inside(o, x, z), `${o.kind} patch over the quay at (${x.toFixed(1)}, ${z.toFixed(1)})`).toBe(false);
        }
      }
    }
  });

  it('puts parapets and lamps on every bridge and love locks on the Pont Neuf', () => {
    const parapets = plan.props.filter((p) => p.id === 'pl-bridge-parapet' || p.id === 'pl-padlock-railing');
    expect(parapets.length).toBeGreaterThanOrEqual(3 * 12);
    expect(plan.props.filter((p) => p.id === 'pl-padlock-railing').length).toBeGreaterThanOrEqual(2);
    expect(plan.props.filter((p) => p.id === 'euro-lamp-post').length).toBeGreaterThanOrEqual(16);
    for (const z of [-300, -30, 250]) {
      const n = parapets.filter((p) => Math.abs(p.z - z) < 7).length;
      expect(n, `parapets at the bridge at z ${z}`).toBeGreaterThanOrEqual(12);
    }
    expect(plan.vignettes.some((v) => /padlock/i.test(v.name))).toBe(true);
  });

  it('shows swans, bouquinistes and their sellers', () => {
    expect(plan.props.filter((p) => p.id === 'bird-swan').length).toBeGreaterThanOrEqual(10);
    expect(plan.props.filter((p) => p.id === 'pl-bouquiniste').length).toBeGreaterThanOrEqual(6);
    expect(plan.props.filter((p) => p.id === 'pl-bouquiniste-shut').length).toBeGreaterThanOrEqual(3);
    expect(plan.residents.length).toBeGreaterThanOrEqual(2);
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(4);
    for (const r of plan.residents) expect(r.id.startsWith('pl-')).toBe(true);
    for (const s of plan.signs) expect(s.text.length).toBeLessThanOrEqual(90);
  });
});
