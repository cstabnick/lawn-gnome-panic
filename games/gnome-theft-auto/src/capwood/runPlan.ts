// The Capwood Run's dressing as plain data (E14, site `rally-route`): props, signs, story vignettes and residents along
// the route, each placed with track.frame(s, lat) so it follows the line. run.ts turns it into meshes and colliders;
// runPlan.test.ts checks it (clear of the road, the grid and other places). No three.js.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import type { Track } from '../raceTrack/trackDef';
import { TRACKS } from '../raceTrack/tracks';

/** A plan prop. `onRoad`: meant to stand on the shoulder or road (gate flags, the start poles, the finish arch). */
export interface RunProp extends PlanProp {
  onRoad?: boolean;
  /** Part of the start paddock (pavilion, paddock bales): allowed near the grid. */
  paddock?: boolean;
}

/** A collider with no prop of its own (the pavilion's table and poles). x, z centre; w x d turned by yaw, or round r. */
export type RunSolid = { x: number; z: number; yaw: number; h: number } & ({ w: number; d: number } | { r: number });

export interface RunPlan {
  props: RunProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
  solids: RunSolid[];
}

const ORANGE = 0xff7a00;
const WHITE = 0xffffff;
const TAU = Math.PI * 2;

/** Where (s, lat) is, as x, z and the travel yaw there. */
function at(t: Track, s: number, lat: number): { x: number; z: number; yaw: number } {
  return t.frame(s, lat);
}

/** Corner s values of the hairpins (peaks of curvature on the banked corners), in order. */
export function hairpinS(t: Track): number[] {
  const sm = t.samples();
  const out: number[] = [];
  for (let i = 1; i < sm.length - 1; i++) {
    const c = Math.abs(sm[i].curv);
    if (c > 0.075 && c >= Math.abs(sm[i - 1].curv) && c >= Math.abs(sm[i + 1].curv) && sm[i].s < 1800) out.push(sm[i].s);
  }
  return out;
}

/** Lateral sign of the outside of the corner at s (+ = left of travel). */
function outside(t: Track, s: number): number {
  return t.sampleAt(s).curv > 0 ? -1 : 1;
}

export function runPlan(t: Track = TRACKS['capwood-run']): RunPlan {
  const props: RunProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const residents: AmbientGnomeDef[] = [];
  const solids: RunSolid[] = [];
  const hw = t.def.width / 2;
  const S0 = t.startS();
  const back = (yaw: number) => yaw + Math.PI; // faces the oncoming traffic

  const put = (id: string, s: number, lat: number, extra: Partial<RunProp> = {}, yawAdd = 0): RunProp => {
    const p = at(t, s, lat);
    const prop: RunProp = { id, x: p.x, z: p.z, yaw: p.yaw + yawAdd, ...extra };
    props.push(prop);
    return prop;
  };
  const sign = (kind: PlanSign['kind'], text: string, s: number, lat: number, extra: Partial<PlanSign> = {}): PlanSign => {
    const p = at(t, s, lat);
    const sg: PlanSign = { kind, text, x: p.x, z: p.z, yaw: back(p.yaw), ...extra };
    signs.push(sg);
    return sg;
  };

  // ---- Start paddock -----------------------------------------------------------------------------------------------
  const pav = put('capwood-start-pavilion', 4, 13, { paddock: true });
  const pc = Math.cos(pav.yaw ?? 0), ps = Math.sin(pav.yaw ?? 0);
  const local = (lx: number, lz: number) => ({ x: pav.x + lx * pc + lz * ps, z: pav.z - lx * ps + lz * pc });
  solids.push({ ...local(0, -0.8), yaw: pav.yaw ?? 0, w: 1.4, d: 0.7, h: 0.95 });
  for (const [lx, lz] of [[-2.9, -1.9], [2.9, -1.9], [-2.9, 1.9], [2.9, 1.9]]) solids.push({ ...local(lx, lz), yaw: 0, r: 0.1, h: 2.8 });
  // Hay bales along the paddock's back edge (the grid's tail), leaving the road end open.
  for (let i = 0; i < 9; i++) {
    const lat = -19 + i * 3.6;
    if (Math.abs(lat) < 11) continue; // the road enters here
    put('hay-bale', -8, lat, { paddock: true, solid: { w: 1.4, d: 1, h: 0.8 } }, Math.PI / 2);
  }
  for (const lat of [-17, 17]) for (const s of [-2, 6, 14, 22]) {
    put('hay-bale', s, lat + (lat < 0 ? -1 : 1), { paddock: true, solid: { w: 1.4, d: 1, h: 0.8 } });
  }
  // The start line: two poles and a banner over the road.
  put('capwood-stage-flag', S0, -hw - 1.5, { onRoad: true, paddock: true, tint: ORANGE });
  put('capwood-stage-flag', S0, hw + 1.5, { onRoad: true, paddock: true, tint: WHITE });
  const bp = at(t, S0, 0);
  signs.push({ kind: 'banner', text: 'THE CAPWOOD RUN  -  START', x: bp.x, z: bp.z, yaw: back(bp.yaw), y: 2.55, w: 10.5, h: 0.7 });
  sign('poster', 'THE CAPWOOD RUN. Stage start. Carburettors only. (Everyone is a Carburettor today.)', S0 - 8, -11);
  vignettes.push({
    id: 'run-start-clock', name: 'The Fast Clock', x: pav.x, z: pav.z,
    story: 'The pavilion clock has been five minutes fast since the first race. The marshal says that is how the race starts early.',
  });
  {
    const m = at(t, S0 - 4, 7.5);
    residents.push({
      id: 'run-marshal', name: 'Marshal Sprocket', x: m.x, z: m.z, yaw: back(m.yaw) + 0.6, idle: 'cross-arms',
      look: { hat: ORANGE, shirt: 0x15151a, pants: 0x15151a, boots: 0x15151a, beard: null },
      bubble: 'Carburettors only. Everyone is a Carburettor today. Clipboard says so.',
    });
    // Lugnut Lulu, captain of the Carburettors, at her giver spot in the paddock (giver/capwood-lulu).
    residents.push({
      id: 'run-lulu', name: 'Lugnut Lulu', x: 80, z: -758, yaw: Math.PI / 2, idle: 'cross-arms',
      look: { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null, dress: true },
      bubble: 'Route is open. Beat my time and the Carburettors buy the fizz. Low and loud!',
    });
  }

  // ---- Stage flags and the finish --------------------------------------------------------------------------------
  const gates = t.gates();
  for (const g of gates) {
    if (g.index < 1 || g.index >= gates.length - 1) continue;
    const tint = g.index % 2 === 1 ? ORANGE : WHITE;
    const other = g.index % 2 === 1 ? WHITE : ORANGE;
    put('capwood-stage-flag', g.s, -hw - 1.5, { onRoad: true, tint });
    put('capwood-stage-flag', g.s, hw + 1.5, { onRoad: true, tint: other });
  }
  const fin = t.finishS();
  put('olympic-finish-arch', fin, 0, { onRoad: true, scale: 4 });
  sign('poster', 'FINES. Bruised cap: 11 acorns. Idling in the fairy ring: 4 acorns. Being early: 1 acorn. Being late: see Section Nine.', fin + 6, 10.5);
  put('capwood-stage-flag', fin - 3, -hw - 1.5, { onRoad: true, tint: ORANGE });
  put('capwood-stage-flag', fin - 3, hw + 1.5, { onRoad: true, tint: WHITE });

  // ---- Hairpins: bales on the outside ------------------------------------------------------------------------------
  const pins = hairpinS(t);
  pins.forEach((hs, k) => {
    const o = outside(t, hs);
    for (let d = -24; d <= 24; d += 6) put('hay-bale', hs + d, o * 10.5, { solid: { w: 1.4, d: 1, h: 0.8 } }, Math.PI / 2);
    if (k === 4) sign('street', 'Hairpin. No. Tighter.', hs - 30, o * 10);
  });

  // ---- Vignette: spectators at a hairpin --------------------------------------------------------------------------
  {
    const hs = pins[2] ?? 955;
    const o = outside(t, hs);
    const lat = o * 15;
    const c = at(t, hs, lat);
    put('deck-chair', hs - 1, lat, { solid: { w: 0.7, d: 0.8, h: 0.8 } }, Math.PI * 0.9);
    put('deck-chair', hs + 2, lat + o * 0.5, { solid: { w: 0.7, d: 0.8, h: 0.8 } }, Math.PI * 0.8);
    put('glaze-extra-cooler', hs + 0.5, lat + o * 2.2, { solid: { w: 0.7, d: 0.5, h: 0.5 } }, 0.3);
    sign('poster', 'SEND IT', hs + 3.5, lat - o * 1.8, { yaw: back(c.yaw) + o * 0.4 });
    vignettes.push({
      id: 'run-hairpin-camp', name: 'The Hairpin Camp', x: c.x, z: c.z,
      story: 'Two camp chairs, a cooler and a cardboard sign reading SEND IT: the spectators arrived at dawn and have opinions about the line.',
    });
    const sp = at(t, hs + 6, lat + o * 3);
    residents.push({
      id: 'run-spectator', name: 'Dorrit Verge', x: sp.x, z: sp.z, yaw: back(sp.yaw), idle: 'cross-arms',
      look: { hat: 0x2d7a3c, shirt: 0xe9d9a0, pants: 0x5a4a32, beard: 0xcccccc },
      bubble: 'Wait for the hairpin. Everyone brakes too early. It is the best bit.',
    });
  }

  // ---- Summit ------------------------------------------------------------------------------------------------------
  const SUMMIT = 1788;
  sign('street', 'SUMMIT. Admire the view later.', SUMMIT - 18, 10);
  {
    const lat = 15;
    const c = at(t, SUMMIT + 6, lat);
    const car = put('gta-euro-hatch', SUMMIT + 6, lat, { scale: 1.3, solid: { w: 2.8, d: 4.8, h: 1.8 } }, 0.5);
    props.push({ id: 'honeydew-flask', x: c.x, z: c.z, y: 1.85, yaw: 0.4, scale: 1.4 });
    props.push({ id: 'folded-map', x: c.x + 0.4, z: c.z + 0.3, y: 1.9, yaw: 1.2, scale: 1.6 });
    void car;
    const n = at(t, SUMMIT + 6, lat - 3.6);
    signs.push({ kind: 'plaque', text: 'LOST?', x: n.x, z: n.z, yaw: back(c.yaw), y: 1.1, w: 0.9, h: 0.45 });
    vignettes.push({
      id: 'run-summit-hatch', name: 'Lost at the Summit', x: c.x, z: c.z,
      story: 'A hatchback with its bonnet up, a flask and an unfolded map on its roof and a note that says LOST? The driver is up here somewhere, looking at the view.',
    });
  }

  // ---- The Puffball Pop: tyre stacks -------------------------------------------------------------------------------
  const jump = t.def.jumps[0];
  if (jump) {
    for (const d of [-6, 0, 6]) for (const side of [-1, 1]) {
      put('tyre-pile', jump.s + d, side * 11, { solid: { r: 0.8, h: 1 } });
    }
    const jc = at(t, jump.s, 11);
    vignettes.push({
      id: 'run-pop-tyres', name: 'The Pop Tyre Wall', x: jc.x, z: jc.z,
      story: 'Six tyre stacks guard the Puffball Pop. Nobody remembers who stacked them, and nobody has been brave enough to unstack them.',
    });
  }

  // ---- Descent: the hubcap stump ----------------------------------------------------------------------------------
  {
    const s = 2040;
    const lat = -13;
    const c = at(t, s, lat);
    put('tree-stump', s, lat, { scale: 2.4, solid: { r: 0.8, h: 0.8 } });
    const rims = ['glaze-rim-stock', 'glaze-rim-fivespoke', 'glaze-rim-mesh', 'glaze-rim-deepdish', 'glaze-rim-stock', 'glaze-rim-fivespoke'];
    rims.forEach((id, i) => {
      const a = (i / rims.length) * TAU;
      props.push({ id, x: c.x + Math.sin(a) * 0.82, z: c.z + Math.cos(a) * 0.82, y: 0.35 + (i % 2) * 0.3, rot: [Math.PI / 2, a, 0], scale: 0.6 });
    });
    vignettes.push({
      id: 'run-hubcap-stump', name: 'The Hubcap Stump', x: c.x, z: c.z,
      story: 'A stump with every hubcap the Run has ever lost nailed round it, in order of embarrassment. Nobody has come back for them.',
    });
    sign('street', 'Section Nine applies beyond this point', 2090, -10);
  }

  // ---- Fords ---------------------------------------------------------------------------------------------------------
  const fords = t.def.fords ?? [];
  fords.forEach((f, k) => {
    const before = f.s - f.len / 2 - 8;
    for (const side of [-1, 1]) {
      put('capwood-ford-sign', before, side * 10, { solid: { r: 0.15, h: 1.8 } }, Math.PI);
    }
    sign('street', 'FORD AHEAD. Cap-water. Your engine will be fine. Your socks will not.', before - 10, k === 0 ? 11 : -11);
    for (let i = 0; i < 4; i++) put('stepping-stone', f.s - 6 + i * 4, 9.4 + (i % 2) * 1.2, {}, i);
    for (const d of [-f.len / 2 - 3, 0, f.len / 2 + 3]) {
      put('reed-bed', f.s + d, -12.5);
      put('reed-bed', f.s + d * 0.8, 13.5);
    }
    put('capwood-toadstool-squat', f.s + f.len / 2 + 14, k === 0 ? 17 : -17, { scale: 0.6 });
  });
  const gill = fords[0];
  if (gill) {
    const lat = 10.8;
    const c = at(t, gill.s, lat);
    put('ride-on-mower', gill.s, lat, { solid: { w: 1.2, d: 2.2, h: 1.2 } }, Math.PI / 2);
    props.push({ id: 'court-boots', x: c.x, z: c.z, y: 1.0, yaw: 0.3, scale: 0.9 });
    sign('poster', "Cap-water: it's FINE", gill.s - 5, lat + 3.2);
    vignettes.push({
      id: 'run-gill-mower', name: 'The Parked Mower', x: c.x, z: c.z,
      story: "A ride-on mower parked in the shallows of the Gill Ford, its driver's boots drying on the seat, under a sign that insists the water is fine.",
    });
    const w = at(t, gill.s + 8, 10.8);
    residents.push({
      id: 'run-ford-marshal', name: 'Wader Pilch', x: w.x, z: w.z, yaw: back(w.yaw) + 0.5, idle: 'cross-arms',
      look: { hat: 0xffd23a, shirt: 0x6b7b34, pants: 0x4a5a2a, boots: 0x2f3a1c, beard: 0x9a8a6a },
      bubble: 'Waders on. Cap-water is thick, slow and always fine. I am not.',
    });
  }
  return { props, signs, vignettes, residents, solids };
}

