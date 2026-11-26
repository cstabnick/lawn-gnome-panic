// The Brim Gap Road's dressing as plain data (E33, issue D1): route signs at both ends, a numbered and named sign at every
// hairpin, gradient and falling-rock warnings, the Top Hat café with its terrace and lookout at Brim Gap, lay-bys, small
// stories (vignettes) and residents. Everything is placed from the exported spots, pads and track.frame(s, lat), so it
// follows the line if the geometry is nudged. brimGap.ts turns it into meshes, colliders and sound; brimGapPlan.test.ts
// checks it (clear of the road and the rails, near the road, inside the pad). No three.js.
//
// Frame conventions (track.frame): lat > 0 is the RIGHT of travel (south of an eastbound road), curv > 0 turns right.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import type { Track } from '../raceTrack/trackDef';
import { BRIM_GAP_SPOTS } from './defs/brimGapRoad';
import { ALL_ROUTES, ROUTES } from './routes';

/** A collider with no prop of its own: a box w x d turned by yaw, or a round post of radius r. x, z is the centre. */
export type BrimSolid = { x: number; z: number; h: number; yaw: number } & ({ w: number; d: number } | { r: number });

export interface BrimGapPlan {
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
  solids: BrimSolid[];
  /** The café building (also in `props`). */
  cafe: { x: number; z: number; yaw: number };
  /** The hairpins in driving order: number on the sign (numbered in order of argument, R-231), name, apex s. */
  hairpins: { key: string; number: number; name: string; s: number; outside: 1 | -1; rightTurn: boolean }[];
}

/** Hat-themed names for the hairpins, in driving order, with the number each wears on its sign (the order they were argued over). */
const HAIRPIN_NAMES: readonly { number: number; name: string }[] = [
  { number: 3, name: 'the Crease' },
  { number: 1, name: 'the Cowlick' },
  { number: 5, name: 'the Dent' },
  { number: 4, name: 'the Glare' },
  { number: 2, name: 'the Flip' },
  { number: 7, name: 'the Scrunch' },
  { number: 6, name: 'the Brim Kink' },
];

/** The café's footprint (the prefab is 7 x 5 m, front +z) and its wall thickness. */
const CAFE_W = 7, CAFE_D = 5, WALL = 0.3, DOOR = 1.1, WALL_H = 3;

export function brimGapPlan(t: Track = ROUTES['brim-gap-road']): BrimGapPlan {
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const residents: AmbientGnomeDef[] = [];
  const solids: BrimSolid[] = [];
  const S = Math.sin, C = Math.cos;
  const hw = t.def.width / 2;
  const edge = hw + t.def.shoulder + 0.5; // nothing closer to the centre line than this
  const back = (yaw: number) => yaw + Math.PI;
  const at = (s: number, lat: number) => t.frame(s, lat);
  const sOf = (name: string): number => t.locate(BRIM_GAP_SPOTS[name].x, BRIM_GAP_SPOTS[name].z, 80)?.s ?? 0;
  /** Which side (+1 right, -1 left of travel) a spot stands on. */
  const sideOf = (name: string): 1 | -1 => ((t.locate(BRIM_GAP_SPOTS[name].x, BRIM_GAP_SPOTS[name].z, 80)?.lat ?? 1) >= 0 ? 1 : -1);
  /** True when (x, z) is at least 6 m from every other mountain route (the Brim Walk, the Hatband, the Spine Cut). */
  const clearOfOthers = (p: { x: number; z: number }): boolean => ALL_ROUTES.every((o) => o === t || !o.locate(p.x, p.z, 6.5));
  const yawTo =(x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

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
  /** A point (lx, lz) in the frame of a thing at (ox, oz) turned by yaw (local +z = its front). */
  const loc = (ox: number, oz: number, yaw: number, lx: number, lz: number) => ({ x: ox + lx * C(yaw) + lz * S(yaw), z: oz - lx * S(yaw) + lz * C(yaw) });

  // ---- Route signs at both ends ----------------------------------------------------------------------------------
  const sStart = t.startS(), sEnd = t.finishS();
  for (const [s, forward, text] of [
    [sStart + 14, true, 'BRIM GAP ROAD\nTop Hat café · High Tarn\nSnow chains advised. Two hats essential.'],
    [sEnd - 14, false, 'BRIM GAP ROAD\nTop Hat café · Mittenholt\nPloughed: never. Hats: two.'],
  ] as const) {
    // A board for each direction of travel, on that direction's right-hand verge, facing the oncoming drivers.
    const lat = (forward ? 1 : -1) * (edge + 2.4);
    const p = at(s, lat);
    const yaw = forward ? back(p.yaw) : p.yaw;
    putXZ('route-name-sign', p.x, p.z, yaw);
    plaque(text, p.x, p.z, yaw, 1.7, 2.2, 0.85);
    for (const d of [-0.9, 0.9]) solids.push({ x: p.x + d * C(yaw), z: p.z - d * S(yaw), r: 0.14, h: 2.2, yaw: 0 });
  }
  {
    const p = at(sStart + 30, -(edge + 3));
    signs.push({ kind: 'poster', text: 'NOTICE. Hairpins are numbered in the order they were argued over, not the order they are driven. Highways Sub-Committee.', x: p.x, z: p.z, yaw: back(p.yaw) });
    solids.push({ x: p.x, z: p.z, r: 0.2, h: 2, yaw: 0 });
  }

  // ---- Warnings: a gradient board at the foot of each climb, falling rocks in the steep stretches ---------------------
  const warn = (id: string, s: number, forward: boolean, txt: string) => {
    const lat = (forward ? 1 : -1) * (edge + 1.2);
    const p = at(s, lat);
    const yaw = forward ? back(p.yaw) : p.yaw;
    putXZ(id, p.x, p.z, yaw, { solid: { r: 0.12, h: 1.6 } });
    plaque(txt, p.x, p.z, yaw, 1.0, 0.9, 0.34);
  };
  warn('gradient-sign', sStart + 70, true, 'UP 9%.\nIt means it.');
  warn('falling-rocks-sign', 150, true, 'Falling rocks.\nPolitely.');
  warn('gradient-sign', sOf('cafe') + 60, true, 'DOWN 9%.\nBrakes are\nnot a hat.');
  warn('falling-rocks-sign', 800, true, 'Rocks: 14.\nWarnings: 14.');
  warn('falling-rocks-sign', 1000, false, 'Rocks fall.\nSigns do not.');
  warn('gradient-sign', sOf('tarnLayby') + 60, false, 'UP 9%.\nYou chose this.');

  // ---- The hairpins: number, name and chevrons ---------------------------------------------------------------------
  const keys = Object.keys(BRIM_GAP_SPOTS).filter((k) => /^hairpin\d+$/.test(k)).sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  const hairpins: BrimGapPlan['hairpins'] = [];
  keys.forEach((key, i) => {
    const sh = sOf(key);
    const a = t.sampleAt(Math.max(0, sh - 14)), b = t.sampleAt(Math.min(t.length(), sh + 14));
    const inw = { x: b.tx - a.tx, z: b.tz - a.tz };
    const c = at(sh, 0);
    const score = (k: number) => { const q = at(sh, k * 6); return (q.x - c.x) * inw.x + (q.z - c.z) * inw.z; };
    const outside: 1 | -1 = score(1) < score(-1) ? 1 : -1;
    const rightTurn = a.tx * b.tz - a.tz * b.tx > 0;
    const nm = HAIRPIN_NAMES[i] ?? { number: i + 1, name: `the Bend ${i + 1}` };
    hairpins.push({ key, number: nm.number, name: nm.name, s: sh, outside, rightTurn });

    // The chevron board: the arrows point to the viewer's right, so it faces the drivers for whom this bend is a right turn.
    const dir = rightTurn ? -1 : 1;
    const tgt = at(sh + dir * 18, 0);
    const cands: [number, number][] = [[6, 8.5], [10, 8.5], [3, 9], [14, 8.5], [6, 12], [-6, 8.5], [8, -7], [12, -7]];
    const [cs, cl] = cands.find(([ds, l]) => clearOfOthers(at(sh + dir * ds, outside * l))) ?? cands[0];
    const cp = at(sh + dir * cs, outside * cl);
    putXZ('hairpin-chevron-sign', cp.x, cp.z, yawTo(cp.x, cp.z, tgt.x, tgt.z), { solid: { r: 0.12, h: 1.5 } });

    // The number plate, on the apex, facing the road.
    const npc: [number, number][] = [[0, 11], [-4, 11], [4, 11], [-8, 11], [8, 11], [0, -8]];
    const [ns, nl] = npc.find(([ds, l]) => clearOfOthers(at(sh + ds, outside * l))) ?? npc[0];
    const np = at(sh + ns, outside * nl);
    signs.push({ kind: 'street', text: `HAIRPIN ${nm.number}\n${nm.name}`, x: np.x, z: np.z, yaw: yawTo(np.x, np.z, c.x, c.z) });
    solids.push({ x: np.x, z: np.z, r: 0.15, h: 2, yaw: 0 });
  });

  // ---- Brim Gap: the Top Hat café ---------------------------------------------------------------------------------
  const cs = BRIM_GAP_SPOTS.cafe;
  const cafe = { x: cs.x, z: cs.z, yaw: cs.yaw };
  putXZ('top-hat-cafe', cafe.x, cafe.z, cafe.yaw);
  const cl = (lx: number, lz: number) => loc(cafe.x, cafe.z, cafe.yaw, lx, lz);
  // Walls: back, two sides and a front with the door left open (one box per wall face).
  const wall = (lx: number, lz: number, w: number, d: number) => solids.push({ ...cl(lx, lz), w, d, yaw: cafe.yaw, h: WALL_H });
  wall(0, -CAFE_D / 2 + WALL / 2, CAFE_W, WALL);
  wall(-CAFE_W / 2 + WALL / 2, 0, WALL, CAFE_D);
  wall(CAFE_W / 2 - WALL / 2, 0, WALL, CAFE_D);
  const seg = (CAFE_W - DOOR) / 2;
  wall(-(DOOR / 2 + seg / 2), CAFE_D / 2 - WALL / 2, seg, WALL);
  wall(DOOR / 2 + seg / 2, CAFE_D / 2 - WALL / 2, seg, WALL);
  // Velma's tally, by the till (R-232), on the wall beside the door; the menu board on the terrace.
  {
    const w = cl(CAFE_W / 2 + 0.03, 0.2);
    plaque('CARS TODAY: 3\nBUNS: 41\n(Both honest.)', w.x, w.z, cafe.yaw + Math.PI / 2, 1.5, 1.1, 0.7);
    const m = cl(-1.9, 3.7);
    signs.push({ kind: 'menu', text: "TODAY\nGap Tea\nHairpin Buns\nToday's view: the Bobble (it was there yesterday)", x: m.x, z: m.z, yaw: cafe.yaw + 0.25 });
    solids.push({ ...m, r: 0.3, h: 1, yaw: 0 });
  }
  // The terrace: four tables with chairs and parasols, in front of the door.
  const tables: [number, number][] = [[-3.0, 5.6], [-0.4, 6.4], [2.0, 5.4], [-1.8, 9.0]];
  tables.forEach(([lx, lz], k) => {
    const tp = cl(lx, lz);
    putXZ('euro-cafe-table', tp.x, tp.z, cafe.yaw + k, { scale: 1.4 });
    solids.push({ ...tp, w: 1, d: 1, yaw: 0, h: 1.05 });
    for (const side of [-1, 1]) {
      const cp = cl(lx + side * 0.95, lz + (k % 2 ? 0.15 : -0.1));
      putXZ('euro-cafe-chair', cp.x, cp.z, yawTo(cp.x, cp.z, tp.x, tp.z), { scale: 1.4 });
    }
    const pp = cl(lx, lz + 1.1);
    putXZ('pl-cafe-parasol', pp.x, pp.z, cafe.yaw, { tint: k % 2 ? 0x7a3b2e : 0x1f1f24 });
  });
  // A cup on one table and a bun on another would be nice; the table prefab carries its own cup.
  // The lookout: topograph, coin telescope and a bench facing out over Mittenholt and the plain.
  const lo = BRIM_GAP_SPOTS.lookout;
  const lo0 = { x: lo.x, z: lo.z };
  const lp = (lx: number, lz: number) => loc(lo0.x, lo0.z, lo.yaw, lx, lz);
  {
    const topo = lp(-1.6, 0);
    putXZ('viewpoint-topograph', topo.x, topo.z, lo.yaw, { solid: { r: 0.5, h: 1.15 } });
    const tel = lp(1.4, 0.2);
    putXZ('gsr-telescope-stand', tel.x, tel.z, lo.yaw, { scale: 1.25, solid: { r: 0.35, h: 1.5 } });
    const bn = lp(-0.1, -2.4);
    putXZ('bench', bn.x, bn.z, lo.yaw + Math.PI, {});
    solids.push({ ...bn, w: 1.6, d: 0.55, yaw: lo.yaw, h: 0.5 });
    for (const [dx, dz, sc] of [[-3.1, -1.4, 0.9], [3.2, -2, 1.15]] as const) {
      const cp = lp(dx, dz);
      putXZ('hamlet-stone-cairn', cp.x, cp.z, lo.yaw + dx, { scale: sc, solid: { r: 0.35 * sc, h: 1.3 * sc } });
    }
    const note = lp(-1.6, 0.8);
    plaque('YOU ARE HERE.\n(No: I am.)', note.x, note.z, lo.yaw, 0.55, 0.9, 0.3);
    vignettes.push({
      id: 'brim-lookout', name: 'The Argued Topograph', x: topo.x, z: topo.z,
      story: 'A brass topograph points at every hill on Snowcap Rise except the one it stands on, and someone has scratched "you are here" beside a second, rival "no, I am". The telescope costs one acorn and shows Mittenholt, small and busy.',
    });
  }
  // Goats on the bank behind the café: the Top Hat has a roof and a view, and so do they.
  for (const [lx, lz, a] of [[-3.5, -4.6, 0.6], [-0.4, -6.0, 2.4]] as const) {
    const g = cl(lx, lz);
    putXZ('goat', g.x, g.z, cafe.yaw + a);
  }
  // The car park, east of the café, is left empty for the traffic.

  // ---- Vignette 1: the abandoned picnic at the picnic hairpin ------------------------------------------------------
  {
    const sp = BRIM_GAP_SPOTS.picnicHairpin;
    putXZ('picnic-blanket-spread', sp.x, sp.z, sp.yaw + 0.5);
    const rock = loc(sp.x, sp.z, sp.yaw + 0.5, 0.45, 0.35);
    putXZ('garden-rock', rock.x, rock.z, 0.4, { scale: 0.5 });
    for (const [lx, lz, a] of [[-1.3, 0.6, 0.4], [1.5, -0.4, 2.1], [0.2, 1.4, 4.0]] as const) {
      const f = loc(sp.x, sp.z, sp.yaw + 0.5, lx, lz);
      putXZ('feather', f.x, f.z, a, { y: 0.03, rot: [Math.PI / 2 - 0.05, a, 0] });
    }
    const gp = loc(sp.x, sp.z, sp.yaw + 0.5, 2.6, 1.0);
    putXZ('goat', gp.x, gp.z, yawTo(gp.x, gp.z, sp.x, sp.z), {});
    vignettes.push({
      id: 'brim-picnic', name: 'The Abandoned Picnic', x: sp.x, z: sp.z,
      story: 'A blanket, a tipped thermos, two cups, half a sandwich, one boot and a map pinned down by a stone, gull feathers scattered about it. Whoever it was left in a hurry when the weather turned, and a goat has noticed the sandwich.',
    });
  }

  // ---- Vignette 2: the stuck camper at the camper hairpin ----------------------------------------------------------
  {
    const cp = BRIM_GAP_SPOTS.camperHairpin;
    const sc = sOf('camperHairpin');
    const lat = sideOf('camperHairpin') * (Math.max(Math.abs(t.locate(cp.x, cp.z, 40)?.lat ?? 0), edge) + 4.5);
    const cam = at(sc, lat);
    const yaw = cp.yaw;
    putXZ('gta-shell-camper', cam.x, cam.z, yaw, { scale: 1.8, rot: [0, yaw, 0.11], solid: { w: 1.6, d: 3, h: 1.6 } });
    const ch = loc(cam.x, cam.z, yaw, 1.7, -0.6);
    putXZ('stuck-camper-chocks', ch.x, ch.z, yaw + 0.4, { scale: 1.3 });
    const chair = loc(cam.x, cam.z, yaw, -2.0, 0.7);
    putXZ('deck-chair', chair.x, chair.z, yaw + 0.5, { solid: { w: 0.7, d: 0.8, h: 0.8 } });
    const flask = loc(cam.x, cam.z, yaw, -2.0, 1.4);
    putXZ('honeydew-flask', flask.x, flask.z, 0.3);
    const board = loc(cam.x, cam.z, yaw, 0.2, 3.4);
    signs.push({ kind: 'poster', text: 'BACK IN 5 MINS (WENT FOR HELP) (TUESDAY)', x: board.x, z: board.z, yaw: yawTo(board.x, board.z, at(sc, 0).x, at(sc, 0).z) });
    solids.push({ ...board, r: 0.3, h: 2, yaw: 0 });
    vignettes.push({
      id: 'brim-camper', name: 'Back In 5 Mins', x: cam.x, z: cam.z,
      story: 'A snail-shell camper leans off the verge with its wheels chocked and a tow rope coiled beside it, a deck chair set out for the wait. The board says BACK IN 5 MINS (WENT FOR HELP) (TUESDAY). It is not Tuesday.',
    });
  }

  // ---- Vignette 3: the snow-plough poles (stacked, unused, labelled) ----------------------------------------------
  {
    const sPlough = sOf('cafe') + 92;
    const lat = -(edge + 3.2);
    const base = at(sPlough, lat);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 0.9 - 0.45;
      const q = at(sPlough + (i - 2.5) * 0.35, lat - (i % 2) * 0.5);
      props.push({ id: 'road-marker-post', x: q.x, z: q.z, yaw: base.yaw + a, y: 0.2 + (i % 3) * 0.2, rot: [Math.PI / 2 - 0.1, base.yaw + a, 0] });
    }
    const cone = at(sPlough + 3.4, lat);
    putXZ('glaze-traffic-cone-pink', cone.x, cone.z, 0.4, { solid: { r: 0.25, h: 0.6 } });
    const pl = at(sPlough - 3.2, lat - 0.6);
    signs.push({ kind: 'poster', text: 'SNOW-PLOUGH MARKERS. For use when it snows. (Not yet used. Not yet snowed.) Highways Sub-Committee.', x: pl.x, z: pl.z, yaw: back(pl.yaw) });
    solids.push({ x: pl.x, z: pl.z, r: 0.3, h: 2, yaw: 0 });
    vignettes.push({
      id: 'brim-plough-poles', name: 'The Ready Poles', x: base.x, z: base.z,
      story: 'A neat stack of snow-plough marker poles, a pink cone and a notice saying they are for when it snows. They have been ready since the road was built. The snow has not yet been informed.',
    });
  }

  // ---- Vignette 4: the hat at the tarn lay-by ----------------------------------------------------------------------
  {
    const sl = sOf('tarnLayby');
    const side = sideOf('tarnLayby');
    const lay = (ds: number, off: number) => at(sl + ds, side * off);
    const post = lay(-6, 6.8);
    putXZ('road-marker-post', post.x, post.z, back(at(sl, 0).yaw), { solid: { r: 0.15, h: 1.1 } });
    putXZ('bobble-beanie', post.x, post.z, 1.0, { y: 1.02, scale: 1.1 });
    const bn = lay(3, 8.8);
    const away = yawTo(at(sl + 3, 0).x, at(sl + 3, 0).z, bn.x, bn.z);
    putXZ('bench', bn.x, bn.z, away + Math.PI);
    solids.push({ x: bn.x, z: bn.z, w: 1.6, d: 0.55, yaw: away, h: 0.5 });
    const tri = lay(7.5, 8.2);
    putXZ('camera-tripod', tri.x, tri.z, away, { scale: 1.1 });
    vignettes.push({
      id: 'brim-tarn-hat', name: 'The Hat Caught on the Post', x: post.x, z: post.z,
      story: 'A bobble hat is wedged on a roadside post at the High Tarn lay-by, where the wind took it off someone and the post caught it. It has been there long enough that people photograph it instead.',
    });
    const ph = lay(1, 7.4);
    residents.push({
      id: 'brim-photographer', name: 'Snapper Lensley', x: ph.x, z: ph.z, yaw: away, idle: 'look-around',
      look: { hat: 0x3b6e5a, shirt: 0xd9c27a, pants: 0x4a4036, boots: 0x2c2218, beard: 0xb8b0a0 },
      bubble: 'Forty photos of the tarn. Same tarn. Different clouds.',
    });
  }

  // ---- Residents: Velma Crown and the cyclist ------------------------------------------------------------------------
  {
    const vp = cl(0.9, 3.7);
    residents.push({
      id: 'brim-velma', name: 'Velma Crown', x: vp.x, z: vp.z, yaw: cafe.yaw + 0.4, idle: 'sweep',
      look: { hat: 0x1b1b22, shirt: 0xb02a2a, pants: 0x4a3a2c, boots: 0x2a2018, beard: null, dress: true },
      bubble: 'Gap Tea, love? Cars today: 3. Buns: 41. Both figures honest.',
    });
    const sc = sOf('picnicHairpin') + 24;
    const cy = at(sc, edge + 2.2);
    const bike = at(sc + 1.4, edge + 3.4);
    putXZ('dirt-mower-bike', bike.x, bike.z, cy.yaw + 0.8, { y: 0.9, rot: [0, cy.yaw + 0.8, Math.PI] });
    residents.push({
      id: 'brim-cyclist', name: 'Chain Wrenfield', x: cy.x, z: cy.z, yaw: yawTo(cy.x, cy.z, bike.x, bike.z), idle: 'scratch-head',
      look: { hat: 0xf2d233, shirt: 0x2f6fb5, pants: 0x1c1c24, boots: 0x15151a, beard: 0x7a4a2a },
      bubble: 'It is not the hill. It is the chain. It is also the hill.',
    });
    vignettes.push({
      id: 'brim-cyclist', name: 'The Upside-Down Bike', x: bike.x, z: bike.z,
      story: 'A bike upside down on its saddle in the lay-by, its owner scratching his head over the chain and not at all looking at the hairpin he has yet to climb.',
    });
  }

  return { props, signs, vignettes, residents, solids, cafe, hairpins };
}
