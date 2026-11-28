// The Spine Cut's dressing as plain data (E33, issue D3): the Keyhole arch, signs, vignettes and residents, each placed
// from the route's own frame so it follows the line. spine.ts turns it into meshes and colliders; spinePlan.test.ts
// checks it (road clear under the arch, props near the road). No three.js.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import type { Track } from '../raceTrack/trackDef';
import { ROUTES } from './routes';
import { SPINE_CUT_SPOTS, SPINE_PADS } from './defs/spineCut';

/** A collider with no prop of its own: round, centre x, z. */
export interface SpineSolid { x: number; z: number; r: number; h: number }

export interface SpinePlan {
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
  solids: SpineSolid[];
  /** The arch (also in `props`): where it stands and how big. */
  arch: { x: number; z: number; yaw: number; scale: number };
}

/** The arch is scaled up a little so its pillars clear the road edge plus the verge with room to spare. */
export const ARCH_SCALE = 1.1;
const ARCH_PILLAR_X = 7.5;
const ARCH_PILLAR_R = 1.6;
const ARCH_PILLAR_H = 12;

const PAD = Object.fromEntries(SPINE_PADS.map((p) => [p.id, p]));

export function spinePlan(t: Track = ROUTES['spine-cut']): SpinePlan {
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const residents: AmbientGnomeDef[] = [];
  const solids: SpineSolid[] = [];
  const edge = t.def.width / 2 + t.def.shoulder + 0.5; // nothing closer to the centre line than this
  const S = Math.sin, C = Math.cos;
  const back = (yaw: number) => yaw + Math.PI;
  const sOf = (name: string): number => t.locate(SPINE_CUT_SPOTS[name].x, SPINE_CUT_SPOTS[name].z, 60)?.s ?? 0;
  const at = (s: number, lat: number) => t.frame(s, lat);

  const put = (id: string, s: number, lat: number, extra: Partial<PlanProp> = {}, yaw?: number): PlanProp => {
    const p = at(s, lat);
    const prop: PlanProp = { id, x: p.x, z: p.z, yaw: yaw ?? p.yaw, ...extra };
    props.push(prop);
    return prop;
  };
  const putXZ = (id: string, x: number, z: number, yaw: number, extra: Partial<PlanProp> = {}): PlanProp => {
    const prop: PlanProp = { id, x, z, yaw, ...extra };
    props.push(prop);
    return prop;
  };
  /** A plaque stood 0.07 m in front of (x, z), reading toward `yaw`. */
  const plaque = (text: string, x: number, z: number, yaw: number, y: number, w: number, h: number) => {
    signs.push({ kind: 'plaque', text, x: x + S(yaw) * 0.07, z: z + C(yaw) * 0.07, yaw, y, w, h });
  };

  // ---- The Keyhole -----------------------------------------------------------------------------------------------
  const k = SPINE_CUT_SPOTS.keyhole;
  const archYaw = k.yaw; // local x (the lintel) is the road normal when yaw = the road yaw, so it spans the road
  const arch = { x: k.x, z: k.z, yaw: archYaw, scale: ARCH_SCALE };
  props.push({ id: 'keyhole-arch', x: k.x, z: k.z, yaw: archYaw, scale: ARCH_SCALE });
  for (const side of [-1, 1]) {
    const d = side * ARCH_PILLAR_X * ARCH_SCALE;
    solids.push({ x: k.x + d * C(archYaw), z: k.z - d * S(archYaw), r: ARCH_PILLAR_R * ARCH_SCALE, h: ARCH_PILLAR_H });
  }

  // ---- Route signs at both ends ----------------------------------------------------------------------------------
  const sStart = t.startS(), sEnd = t.finishS();
  const routeText = 'THE SPINE CUT\nLow arch? No.\nMind the Keyhole';
  for (const [s, face] of [[sStart + 14, 0], [sEnd - 14, Math.PI]] as const) {
    // Start sign faces drivers coming up the line; the end sign faces drivers coming the other way. Right-hand verge.
    const lat = face === 0 ? -(edge + 2.2) : edge + 2.2;
    const p = at(s, lat);
    const yaw = face === 0 ? back(p.yaw) : p.yaw;
    putXZ('route-name-sign', p.x, p.z, yaw);
    plaque(routeText, p.x, p.z, yaw, 1.7, 2.2, 0.85);
  }

  // ---- Warning signs at the gorge mouths (both ways) -------------------------------------------------------------
  const sIn = sOf('gorgeIn'), sOut = sOf('gorgeOut');
  const warn = (id: string, s: number, forward: boolean, txt?: string) => {
    const lat = forward ? -(edge + 0.6) : edge + 0.6;
    const p = at(s, lat);
    const yaw = forward ? back(p.yaw) : p.yaw;
    putXZ(id, p.x, p.z, yaw);
    if (txt) plaque(txt, p.x, p.z, yaw, 0.78, 0.9, 0.34);
  };
  warn('falling-rocks-sign', sIn - 8, true, 'Rocks have\nright of way.');
  warn('gradient-sign', sIn + 4, false, 'Down. Then\nmore down.');
  warn('gradient-sign', sOut + 8, true, 'Up. You were\nwarned.');
  warn('falling-rocks-sign', sOut - 4, false, 'Rocks: 14\nWarnings: 14');

  // ---- Vignette 1: the rockfall ----------------------------------------------------------------------------------
  const sRock = sOf('rockfall');
  {
    const lat = edge + 0.9;
    put('scree-pile', sRock, lat + 1.2, {}, back(at(sRock, lat).yaw) + 0.3);
    put('garden-rock', sRock + 1.5, edge + 0.2, { scale: 1.5, solid: { r: 0.6, h: 0.7 } });
    put('garden-rock', sRock - 2.5, lat + 0.3, { scale: 0.8 }, 1.1);
    // A reflector post knocked flat, still reflecting.
    put('road-marker-post', sRock + 4, edge + 0.2, { y: 0.14, rot: [Math.PI / 2, 0, 0] }, 0.4);
    const n = put('road-marker-post', sRock - 5, -(edge + 0.4));
    plaque('WAS: 1 post\nNOW: 1 post, lying down', n.x, n.z, back(at(sRock - 5, 0).yaw), 1.3, 1.3, 0.34);
    const c = at(sRock, lat + 1);
    vignettes.push({
      id: 'spine-rockfall', name: 'The Rockfall', x: c.x, z: c.z,
      story: 'A scree pile has slid onto the verge, one rock has made it to the gutter and a marker post lies flat. The sign says the rocks have right of way, and the rocks agree.',
    });
  }

  // ---- Vignette 2: the old blasting hut --------------------------------------------------------------------------
  {
    const lat = -(edge + 5);
    const s0 = sOut + 14;
    const c = at(s0, lat);
    put('hamlet-stone-cairn', s0 - 3, lat - 1, { scale: 2, solid: { r: 0.8, h: 2.8 } });
    put('hamlet-stone-cairn', s0 + 3.5, lat - 0.5, { scale: 1.6, solid: { r: 0.64, h: 2.2 } });
    put('crate', s0, lat - 0.8, { solid: { r: 0.4, h: 0.8 } }, 0.3);
    put('crate', s0 + 0.9, lat - 0.5, { solid: { r: 0.4, h: 0.8 } }, 0.9);
    put('crate', s0 + 0.3, lat - 0.9, { y: 0.8 }, 0.2);
    put('barrel', s0 - 1.4, lat - 1.2, { solid: { r: 0.35, h: 0.8 } });
    const b = put('site-barrier', s0 + 0.2, lat + 2.4, { solid: { w: 2.4, d: 0.4, h: 1 } });
    const fy = back(at(s0, 0).yaw) + 0;
    plaque('DANGER:\nOLD BANGS', b.x, b.z, fy, 0.65, 1.2, 0.5);
    vignettes.push({
      id: 'spine-blasting-hut', name: 'The Old Bangs', x: c.x, z: c.z,
      story: 'Two walls and a crate stack are all that is left of the blasting hut. The barrier says OLD BANGS, which is accurate, and also what the neighbours said at the time.',
    });
  }

  // ---- Vignette 3: Plumb Bob's measuring kit at the pull-in ------------------------------------------------------
  const sv = SPINE_CUT_SPOTS.surveyor;
  {
    const f = { x: S(sv.yaw), z: C(sv.yaw) };
    const r = { x: C(sv.yaw), z: -S(sv.yaw) };
    const o = (fw: number, rt: number) => ({ x: sv.x + f.x * fw + r.x * rt, z: sv.z + f.z * fw + r.z * rt });
    const st = o(2.2, 0.9);
    putXZ('stool', st.x, st.z, sv.yaw + Math.PI);
    putXZ('field-binoculars', st.x, st.z, sv.yaw, { y: 0.55, scale: 3.2, rot: [0.15, 0, 0] });
    const bk = o(-0.4, -1.8);
    putXZ('book-pile', bk.x, bk.z, sv.yaw + 0.5, { scale: 0.9 });
    const ch = o(-1.4, 1.5);
    putXZ('chair', ch.x, ch.z, sv.yaw - 0.4);
    const pg = o(2.2, 2.4);
    putXZ('hamlet-stone-cairn', pg.x, pg.z, 0, { scale: 0.7 });
    // The Keyhole plaque, on a tourist board at the pull-in's far edge, reading toward the road.
    const pad = PAD['keyhole-pullin'];
    const u = 3.4, v = -6.5;
    const bx = pad.x + u * C(pad.yaw) + v * S(pad.yaw), bz = pad.z - u * S(pad.yaw) + v * C(pad.yaw);
    const byaw = pad.yaw - Math.PI / 2;
    putXZ('route-name-sign', bx, bz, byaw);
    plaque('THE KEYHOLE\nleft standing for measuring\nHighways Sub-Committee', bx, bz, byaw, 1.7, 2.2, 0.85);
    vignettes.push({
      id: 'spine-surveyor', name: "Plumb Bob's Measuring Kit", x: sv.x, z: sv.z,
      story: 'A stool holding giant binoculars aimed at the arch, a pile of notebooks every page of which says "nearly" and a chair that has not been sat in since the last reading. The surveyor has not finished.',
    });
    residents.push({
      id: 'spine-plumb-bob', name: 'Plumb Bob', x: sv.x, z: sv.z, yaw: sv.yaw, idle: 'scratch-head',
      look: { hat: 0xe0a020, shirt: 0x4a6b7a, pants: 0x5a4a32, boots: 0x3a2a1a, beard: 0xd8d0c0 },
      bubble: 'Still not sure. It has two sides, and I have only checked one. Ask me on Thursday.',
    });
  }

  // ---- Vignette 4: the lost ear tag, on the moor lay-by ----------------------------------------------------------
  {
    const pad = PAD['moor-layby'];
    const pt = (u: number, v: number) => ({ x: pad.x + u * C(pad.yaw) + v * S(pad.yaw), z: pad.z - u * S(pad.yaw) + v * C(pad.yaw) });
    const post = pt(2.4, 1);
    const pyaw = pad.yaw - Math.PI / 2; // faces the road
    putXZ('road-marker-post', post.x, post.z, pyaw, { solid: { r: 0.2, h: 1.1 } });
    plaque('FOUND: 1 ear tag, no. 41.\nOwner: bleat at Mittenholt.', post.x, post.z, pyaw, 1.45, 1.5, 0.42);
    const sh = pt(3.2, 3.5);
    putXZ('sheep', sh.x, sh.z, pyaw + 0.7, { solid: { r: 0.6, h: 1 } });
    vignettes.push({
      id: 'spine-ear-tag', name: 'Ear Tag No. 41', x: post.x, z: post.z,
      story: 'An ear tag pinned to a post with a polite note. Number 41 stands a few steps off, ear bare, in no hurry to be claimed.',
    });
    const hs = pt(-2.2, -1.5);
    residents.push({
      id: 'spine-shepherd', name: 'Hester Fleece', x: hs.x, z: hs.z, yaw: pyaw + Math.PI, idle: 'lean-back',
      look: { hat: 0x7a3030, shirt: 0x3f5a3a, pants: 0x4a3f2c, boots: 0x2a2018, beard: null, dress: true },
      bubble: 'Eighty-one sheep and eighty-two tags. Do not ask. Sheep 41 is thinking about it.',
    });
  }

  return { props, signs, vignettes, residents, solids, arch };
}
