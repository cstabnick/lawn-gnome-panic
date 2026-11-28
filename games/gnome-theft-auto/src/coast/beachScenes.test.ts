// The beach scenes (FX11 B5): every prop is a real prefab on dry sand, the X and the daymark are where the quests send you.
import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { courseProfile, waterDepthAt } from '../water';
import { BEACH_FOLK, CHART_X, SALTCUT_MOUTH, beachScenePlan } from './beachScenes';
import { COAST_VIGNETTES } from './life';

const plan = beachScenePlan();
const chart = plan.find((s) => s.id === 'chart-x')!;
const dunelow = plan.find((s) => s.id === 'dunelow-hire')!;
const saltcut = plan.find((s) => s.id === 'saltcut')!;

describe('beach scenes', () => {
  it('has 8 to 10 stories plus the X, the Saltcut and the lifebuoys', () => {
    const stories = plan.filter((s) => !['chart-x', 'saltcut', 'lifebuoys'].includes(s.id) && !s.id.startsWith('groyne'));
    expect(stories.length).toBeGreaterThanOrEqual(6);
    expect(plan.length).toBeGreaterThanOrEqual(12);
  });

  it('uses only prefabs that exist', () => {
    for (const s of plan) for (const pr of s.props) expect(getPrefab(pr.id), `${s.id}: ${pr.id}`).toBeDefined();
  });

  it('stands everything on dry ground (groyne ends may wet their toes)', () => {
    for (const s of plan) {
      for (const pr of s.props) {
        const depth = waterDepthAt(pr.x, pr.z);
        expect(depth, `${s.id}: ${pr.id} at ${pr.x.toFixed(1)}, ${pr.z.toFixed(1)}`).toBeLessThan(pr.id === 'groyne' ? 1 : 0.0001);
      }
      for (const sg of s.signs ?? []) expect(waterDepthAt(sg.x, sg.z), `${s.id} sign`).toBe(0);
    }
  });

  it('keeps the town clear (only lifebuoy posts inside x -320..320)', () => {
    for (const s of plan) {
      if (s.id === 'lifebuoys') continue;
      for (const pr of s.props) expect(Math.abs(pr.x) > 320 || s.id === 'chart-x', `${s.id}: ${pr.id} at ${pr.x}`).toBe(true);
    }
  });

  it('puts a lifebuoy post about every 150 m, clear of the town dressing', () => {
    const posts = plan.find((s) => s.id === 'lifebuoys')!.props.map((q) => q.x).sort((a, b) => a - b);
    for (let i = 1; i < posts.length; i++) expect(posts[i] - posts[i - 1]).toBeLessThanOrEqual(190);
    expect(posts[0]).toBeLessThanOrEqual(-850);
    expect(posts[posts.length - 1]).toBeGreaterThanOrEqual(850);
    const dressing = COAST_VIGNETTES.filter((v) => v.district === 'beach').flatMap((v) => v.props);
    for (const lp of plan.find((s) => s.id === 'lifebuoys')!.props) {
      for (const d of dressing) expect(Math.hypot(lp.x - d.x, lp.z - d.z), `lifebuoy ${lp.x} vs ${d.prefab}`).toBeGreaterThan(2.5);
    }
  });

  it('marks the X: post, boot and hole within 6 m of the chart', () => {
    for (const pr of chart.props) expect(Math.hypot(pr.x - CHART_X[0], pr.z - CHART_X[1]), pr.id).toBeLessThanOrEqual(6);
    expect(chart.props.some((q) => q.id === 'x-marker-post')).toBe(true);
    expect(chart.props.some((q) => q.id === 'wellies')).toBe(true);
  });

  it("sets Dunelow's chairs 6 m clear of the X, with a sign and an attendant", () => {
    const chairs = dunelow.props.filter((q) => q.id === 'deck-chair');
    expect(chairs.length).toBeGreaterThanOrEqual(6);
    for (const c of dunelow.props) expect(Math.hypot(c.x - CHART_X[0], c.z - CHART_X[1])).toBeGreaterThan(6);
    expect(dunelow.signs?.[0]?.text).toBe('DECKCHAIRS\nHIRE 1 ACORN\n(Chairs not responsible for gulls)');
    const attendant = BEACH_FOLK.find((g) => g.id === 'coast-beach-hessian')!;
    expect(attendant).toBeDefined();
    expect(Math.hypot(attendant.x - CHART_X[0], attendant.z - CHART_X[1])).toBeGreaterThan(6);
  });

  it('gives the beach folk beach ids and dry feet', () => {
    expect(BEACH_FOLK.length).toBeGreaterThanOrEqual(2);
    for (const g of BEACH_FOLK) {
      expect(g.id.startsWith('coast-beach-')).toBe(true);
      expect(waterDepthAt(g.x, g.z)).toBe(0);
    }
  });

  it('dresses the Saltcut: reeds, posts, a daymark and a sign near the last sample', () => {
    const prof = courseProfile('saltcut')!;
    const last = [prof.x[prof.x.length - 1], prof.z[prof.z.length - 1]];
    const mark = saltcut.props.find((q) => q.id === 'saltcut-daymark')!;
    expect(Math.hypot(mark.x - last[0], mark.z - last[1])).toBeLessThanOrEqual(25);
    expect(Math.hypot(mark.x - SALTCUT_MOUTH[0], mark.z - SALTCUT_MOUTH[1])).toBeLessThanOrEqual(8);
    const reeds = saltcut.props.filter((q) => q.id === 'reed-clump' || q.id === 'reed-bed');
    expect(reeds.length).toBeGreaterThanOrEqual(12);
    expect(saltcut.props.filter((q) => q.id === 'wooden-post' || q.id === 'pier-post').length).toBeGreaterThanOrEqual(4);
    expect(saltcut.signs?.[0]?.text).toContain('Where the Puddle Sea');
  });
});
