import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { BRIM_GAP_SPOTS } from './defs/brimGapRoad';
import { HATBRIM_PADS } from './defs/hatbrimPads';
import { brimGapPlan } from './brimGapPlan';
import { padDistance } from './pads';
import { railRuns } from './rails';
import { ALL_ROUTES, ROUTES } from './routes';

const track = ROUTES['brim-gap-road'];
const plan = brimGapPlan();
const hw = track.def.width / 2;
const edge = hw + track.def.shoulder + 0.5;
const cafePad = HATBRIM_PADS.find((p) => p.id === 'cafe-terrace')!;

/** Everything that stands in the world as a point: props, text signs with a body, residents, solids. */
const points = [
  ...plan.props.map((p) => ({ what: p.id, x: p.x, z: p.z })),
  ...plan.signs.filter((s) => s.kind !== 'banner').map((s) => ({ what: `sign "${s.text.slice(0, 20)}"`, x: s.x, z: s.z })),
  ...plan.residents.map((r) => ({ what: r.id, x: r.x, z: r.z })),
  ...plan.solids.map((s) => ({ what: 'solid', x: s.x, z: s.z })),
];

/** The rails' line: every metre of every run on the Brim Gap Road. */
function railPoints(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (const r of railRuns().filter((q) => q.route === 'brim-gap-road')) {
    for (let s = r.s0; s <= r.s1; s += 1) out.push(track.frame(s, r.side * (hw + 0.9)));
  }
  return out;
}

describe('brim gap plan', () => {
  it('uses prefabs that exist', () => {
    for (const p of plan.props) expect(getPrefab(p.id), p.id).toBeTruthy();
    for (const id of ['euro-chalkboard-sign', 'euro-poster-board', 'euro-street-sign']) expect(getPrefab(id), id).toBeTruthy();
  });

  it('has the expected counts', () => {
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(3);
    for (const v of plan.vignettes) expect(v.story.length).toBeGreaterThan(40);
    expect(new Set(plan.vignettes.map((v) => v.id)).size).toBe(plan.vignettes.length);
    expect(plan.props.filter((p) => p.id === 'route-name-sign').length).toBe(2);
    expect(plan.residents.length).toBeGreaterThanOrEqual(3);
    expect(new Set(plan.residents.map((r) => r.id)).size).toBe(plan.residents.length);
    expect(plan.residents.some((r) => r.name === 'Velma Crown')).toBe(true);
    expect(plan.props.filter((p) => p.id === 'euro-cafe-table').length).toBeGreaterThanOrEqual(3);
    expect(plan.props.some((p) => p.id === 'viewpoint-topograph')).toBe(true);
    expect(plan.props.some((p) => p.id === 'gsr-telescope-stand')).toBe(true);
    expect(plan.props.some((p) => p.id === 'gta-shell-camper')).toBe(true);
    expect(plan.props.some((p) => p.id === 'picnic-blanket-spread')).toBe(true);
    expect(plan.props.filter((p) => p.id === 'gradient-sign').length).toBeGreaterThanOrEqual(2);
    expect(plan.props.filter((p) => p.id === 'falling-rocks-sign').length).toBeGreaterThanOrEqual(2);
    expect(plan.signs.some((s) => /BACK IN 5 MINS/.test(s.text))).toBe(true);
    expect(plan.signs.some((s) => /CARS TODAY/.test(s.text))).toBe(true);
    for (const s of plan.signs) expect(s.text.length).toBeGreaterThan(0);
  });

  it('gives every hairpin a chevron, a number and a hat name', () => {
    const named = Object.keys(BRIM_GAP_SPOTS).filter((k) => /^hairpin\d+$/.test(k));
    expect(plan.hairpins.length).toBe(named.length);
    expect(plan.props.filter((p) => p.id === 'hairpin-chevron-sign').length).toBe(named.length);
    expect(new Set(plan.hairpins.map((h) => h.number)).size).toBe(named.length);
    expect(new Set(plan.hairpins.map((h) => h.name)).size).toBe(named.length);
    for (const h of plan.hairpins) {
      expect(plan.signs.some((s) => s.kind === 'street' && s.text.includes(`HAIRPIN ${h.number}`) && s.text.includes(h.name)), h.name).toBe(true);
    }
  });

  it('turns each chevron so its arrows point into the bend', () => {
    const chev = plan.props.filter((p) => p.id === 'hairpin-chevron-sign');
    plan.hairpins.forEach((h, i) => {
      const a = track.sampleAt(h.s - 14), b = track.sampleAt(h.s + 14);
      const inw = { x: b.tx - a.tx, z: b.tz - a.tz };
      const yaw = chev[i].yaw ?? 0;
      const arrow = { x: Math.cos(yaw), z: -Math.sin(yaw) }; // local +x, where the chevrons point
      expect(arrow.x * inw.x + arrow.z * inw.z, h.name).toBeGreaterThan(0);
      // and it faces the road, not away from it
      const loc = track.locate(chev[i].x, chev[i].z, 40)!;
      const toRoad = { x: track.frame(loc.s, 0).x - chev[i].x, z: track.frame(loc.s, 0).z - chev[i].z };
      expect(Math.sin(yaw) * toRoad.x + Math.cos(yaw) * toRoad.z, h.name).toBeGreaterThan(0);
    });
  });

  it('keeps everything off the road (sign posts at least half a road plus 1 m out)', () => {
    for (const p of points) {
      const l = track.locate(p.x, p.z, 80);
      if (l) expect(l.dist, `${p.what} @ ${p.x.toFixed(0)},${p.z.toFixed(0)}`).toBeGreaterThanOrEqual(edge - 0.01);
    }
    for (const p of plan.props) {
      if (!/sign/.test(p.id)) continue;
      const l = track.locate(p.x, p.z, 80);
      if (l) expect(l.dist, p.id).toBeGreaterThanOrEqual(hw + 1);
    }
  });

  it('keeps clear of the guard rails and of the other routes', () => {
    const rails = railPoints();
    for (const p of points) {
      for (const r of rails) {
        if (Math.abs(r.x - p.x) > 1.5 || Math.abs(r.z - p.z) > 1.5) continue;
        expect(Math.hypot(r.x - p.x, r.z - p.z), `${p.what} vs a rail`).toBeGreaterThanOrEqual(1.5);
      }
      for (const other of ALL_ROUTES) {
        if (other === track) continue;
        const o = other.locate(p.x, p.z, 6);
        if (o) expect(o.dist, `${p.what} @ ${p.x.toFixed(0)},${p.z.toFixed(0)} vs ${other.def.id}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('stands everything within 40 m of the road', () => {
    for (const p of points) {
      const l = track.locate(p.x, p.z, 40);
      expect(l, `${p.what} @ ${p.x.toFixed(0)},${p.z.toFixed(0)}`).toBeTruthy();
    }
  });

  it('puts the route boards on the right-hand verge of their direction of travel, facing the oncoming drivers', () => {
    const boards = plan.props.filter((p) => p.id === 'route-name-sign');
    const [first, last] = [boards[0], boards[1]];
    for (const [b, forward] of [[first, true], [last, false]] as const) {
      const l = track.locate(b.x, b.z, 40)!;
      expect(forward ? l.lat > 0 : l.lat < 0, 'right verge').toBe(true);
      const sm = track.sampleAt(l.s);
      const facing = Math.sin(b.yaw ?? 0) * sm.tx + Math.cos(b.yaw ?? 0) * sm.tz;
      expect(forward ? facing < -0.8 : facing > 0.8).toBe(true);
    }
  });

  it('stands the café on its pad, tables and lookout with it', () => {
    expect(padDistance(cafePad, plan.cafe.x, plan.cafe.z)).toBe(0);
    const cafe = plan.props.find((p) => p.id === 'top-hat-cafe')!;
    expect(cafe.x).toBe(BRIM_GAP_SPOTS.cafe.x);
    expect(cafe.z).toBe(BRIM_GAP_SPOTS.cafe.z);
    for (const p of plan.props.filter((q) => /euro-cafe|pl-cafe|viewpoint|gsr-telescope|^bench$/.test(q.id) && Math.hypot(q.x - cafe.x, q.z - cafe.z) < 30)) {
      expect(padDistance(cafePad, p.x, p.z), `${p.id} on the terrace`).toBe(0);
    }
    // leaves the car park (east half of the pad, away from the lookout) empty
    const far = HATBRIM_PADS.find((p) => p.id === 'cafe-terrace')!;
    const lo = BRIM_GAP_SPOTS.lookout;
    for (const p of plan.props) {
      if (padDistance(far, p.x, p.z) > 0 || p.id === 'top-hat-cafe') continue;
      const east = (p.x - cafe.x) * Math.sin(far.yaw) + (p.z - cafe.z) * Math.cos(far.yaw);
      const towardLookout = (lo.x - cafe.x) * Math.sin(far.yaw) + (lo.z - cafe.z) * Math.cos(far.yaw);
      if (towardLookout < 0) expect(east, `${p.id} in the car park`).toBeLessThan(5);
    }
  });
});
