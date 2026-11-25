// The Rutbottom Dirt Bowl's dressing as plain data (E14): hay-bale and tyre barriers along both sides of the lap, the
// starter's tower, the grandstands, the pits, signs, story vignettes and the residents. rutbottom/index.ts turns it into
// meshes, colliders, sign text and gnomes; plan.test.ts checks it. No three.js here, only the track's own maths.
// World metres, x east, z south. On this track lat > 0 is the OUTSIDE of its corners (south on the start straight, east at
// the Berm, west on the pit straight); lat < 0 is the infield.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import { inSite } from '../sites';
import { TRACKS } from '../raceTrack/tracks';
import { BOWL_GATE, CLARY_SPOT, GRANDSTAND, PIT_GAP, PITS, STARTER_TOWER, TEASEL_SPOT } from './spots';

const T = TRACKS.rutbottom;
const D = T.def;
const OFF = D.barrierOffset;
const LENGTH = T.length();

/** Hay bales are scaled up from the prefab's gnome size (0.6 x 0.4 x 0.4 m) to a bale a Knobbly can lean on. */
export const BALE_SCALE = 2.5;
/** Distance between barrier pieces along a side (m). */
const BALE_GAP = 2.5;
const STACK_SCALE = 1.4;
const STACK_GAP = 3;
/** Tyre stacks stand outside the bales, on the outside of every corner banked at least this much. */
const STACK_LAT = OFF + 1.7;
const STACK_BANK = 2.5;

/** A solid thing with no mesh of its own (a prefab's body, a grandstand's block): an axis-aligned box, h metres tall. */
export interface PlanCollider { x: number; z: number; hw: number; hd: number; h: number }

/** A grandstand: the prefab id, where it stands, and its yaw and scale (the crowd stands on its decks). */
export interface PlanStand { id: string; x: number; z: number; yaw: number; scale: number }

export interface BowlPlan {
  /** Hay bales and tyre stacks along the lap (trackside: they may stand at the barrier line). */
  barriers: PlanProp[];
  /** Everything else, kept clear of the track surface. */
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
  colliders: PlanCollider[];
  stands: PlanStand[];
  /** The dirt lane from the gate to the pit gap, as points (x, z), 6 m wide. */
  lane: [number, number][];
}

/** A point `lat` metres off the centre line at lap distance s, and the yaw (+z of a prefab) that faces the track. */
function trackside(s: number, lat: number): { x: number; z: number; yaw: number } {
  const f = T.frame(s, lat);
  const p = T.sampleAt(s);
  const side = Math.sign(lat) || 1;
  return { x: f.x, z: f.z, yaw: Math.atan2(-side * p.nx, -side * p.nz) };
}

/** True when lap distance s is inside the pit gap. */
const inPitGap = (s: number, pad = 0): boolean => s >= PIT_GAP.from - pad && s <= PIT_GAP.to + pad;

function barrierProps(): PlanProp[] {
  const out: PlanProp[] = [];
  const cell = 4;
  const grid = new Map<string, [number, number][]>();
  const free = (x: number, z: number, d: number): boolean => {
    const ci = Math.floor(x / cell), cj = Math.floor(z / cell);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      for (const [px, pz] of grid.get(`${i},${j}`) ?? []) if (Math.hypot(px - x, pz - z) < d) return false;
    }
    return true;
  };
  const claim = (x: number, z: number): void => {
    const key = `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
    grid.set(key, [...(grid.get(key) ?? []), [x, z]]);
  };
  // Another part of the lap's road (a barrier line that crosses a neighbouring straight) gets no barrier.
  const onOtherRoad = (x: number, z: number): boolean => {
    const l = T.locate(x, z, 14);
    return !!l && l.dist < D.width / 2 + D.shoulder + 0.5;
  };
  const row = (lat: number, gap: boolean): void => {
    let lx = NaN, lz = NaN;
    for (let s = 0; s < LENGTH; s += 0.5) {
      if (gap && inPitGap(s)) { lx = NaN; continue; }
      const f = T.frame(s, lat);
      if (!inSite('dirt-track', f.x, f.z, -1.5)) continue;
      if (Number.isFinite(lx) && Math.hypot(f.x - lx, f.z - lz) < BALE_GAP) continue;
      if (!free(f.x, f.z, BALE_GAP * 0.8) || onOtherRoad(f.x, f.z)) continue;
      lx = f.x; lz = f.z;
      claim(f.x, f.z);
      out.push({
        id: 'hay-bale', x: f.x, z: f.z, yaw: T.sampleAt(s).yaw - Math.PI / 2, scale: BALE_SCALE,
        solid: { r: 0.8, h: 1 },
      });
    }
  };
  row(OFF, true);
  row(-OFF, false);
  // Tyre stacks outside the bales on the outside of each banked corner, red and white like a kerb.
  let lx = NaN, lz = NaN;
  for (let s = 0; s < LENGTH; s += 0.5) {
    if (T.sampleAt(s).bank < STACK_BANK || inPitGap(s, 8)) { lx = NaN; continue; }
    const f = T.frame(s, STACK_LAT);
    if (!inSite('dirt-track', f.x, f.z, -2.5)) continue;
    if (Number.isFinite(lx) && Math.hypot(f.x - lx, f.z - lz) < STACK_GAP) continue;
    if (!free(f.x, f.z, STACK_GAP * 0.7) || onOtherRoad(f.x, f.z)) continue;
    lx = f.x; lz = f.z;
    claim(f.x, f.z);
    out.push({
      id: 'speedway-tyre-stack', x: f.x, z: f.z, yaw: 0, scale: STACK_SCALE,
      tint: Math.floor(s / 9) % 2 === 0 ? 0xd8342c : 0xf4f4f4,
      solid: { r: 0.8, h: 1.2 },
    });
  }
  return out;
}

const SPONSOR = [0xffd21f, 0xff7a00, 0x2f6b2a, 0xd8342c, 0x2f7fd1];

export function buildBowlPlan(): BowlPlan {
  const barriers = barrierProps();
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const colliders: PlanCollider[] = [];
  const stands: PlanStand[] = [];

  // A sponsor board (speedway-banner prefab, 6 x 2 m at scale 1) with its text plate on the face (+z) of the board.
  let brand = 0;
  const board = (text: string, x: number, z: number, yaw: number, scale: number, tint = SPONSOR[brand++ % SPONSOR.length]): void => {
    props.push({ id: 'speedway-banner', x, z, yaw, scale, tint, trim: 0x1d1d1d });
    // The trim stands 0.22 m proud of the centre: the plate hangs just beyond it.
    const d = 0.22 * scale;
    signs.push({
      kind: 'banner', text, x: x + Math.sin(yaw) * d, z: z + Math.cos(yaw) * d, yaw,
      y: 1.6 * scale, w: 5.6 * scale, h: 1.6 * scale,
    });
  };
  /** A small chalkboard (the kit's menu sign) on the ground. */
  const chalk = (text: string, x: number, z: number, yaw: number): void => {
    signs.push({ kind: 'menu', text, x, z, yaw });
  };

  // ---- The starter's tower and Clary's trestle ----------------------------------------------------------------------
  props.push({ id: 'rutbottom-starter-tower', x: STARTER_TOWER.x, z: STARTER_TOWER.z, yaw: STARTER_TOWER.yaw });
  // Four legs and braces: one block (the ladder at the back, on the south side, stays outside it).
  colliders.push({ x: STARTER_TOWER.x, z: STARTER_TOWER.z, hw: 1.35, hd: 1.35, h: 6.1 });
  props.push({ id: 'table', x: 1109.5, z: -523.5, yaw: 0, scale: 1.6, solid: { w: 1.9, d: 1.1, h: 0.95 } });
  props.push({ id: 'honeydew-flask', x: 1109.9, z: -523.5, yaw: 0.6, scale: 1.5, y: 0.97 });
  props.push({ id: 'crate', x: 1112.6, z: -522.6, yaw: 0.3, scale: 1.4, solid: { w: 0.85, d: 0.85, h: 0.85 } });
  chalk('3', 1108.5, -525.4, Math.PI);
  chalk('2', 1109.7, -525.6, Math.PI);
  chalk('GO ON THEN', 1110.9, -525.4, Math.PI);
  vignettes.push({
    id: 'trestle', name: "Clary's trestle", x: 1110, z: -524,
    story: 'Clary counts the start down off hand-lettered cards (3, 2, GO ON THEN) stood up on the trestle, with a flask of tea she has not let go cold in eleven years, because she never leaves the table.',
  });

  // ---- The grandstands (Sneaker Stands, facing the track on the south strip) ----------------------------------------------
  const standScale = 0.65;
  // The stand's front (local z 11) sits on the strip's north edge; its body runs south to the strip's far edge.
  const standZ = GRANDSTAND.minZ + 11 * standScale - 0.1;
  for (const x of [1195, 1235]) stands.push({ id: 'speedway-sneaker-stand', x, z: standZ, yaw: Math.PI, scale: standScale });
  // The mud-pie stall between the stands.
  props.push({ id: 'table', x: 1215, z: -527, yaw: Math.PI, scale: 1.8, solid: { w: 2.2, d: 1.3, h: 1.1 } });
  props.push({ id: 'crate', x: 1217.5, z: -525.5, yaw: 0.4, scale: 1.5, solid: { w: 0.9, d: 0.9, h: 0.9 } });
  props.push({ id: 'barrel', x: 1212.5, z: -525.2, yaw: 0, scale: 1.6, solid: { r: 0.5, h: 1.3 } });
  // Umbrellas left standing against the front of the stands.
  for (const [x, z, r] of [[1190, -531.6, 1.1], [1193.4, -531.7, -0.9], [1233, -531.6, 1.0], [1237, -531.8, -1.2]] as const) {
    props.push({ id: 'umbrella-hat', x, z, yaw: 0, rot: [0, 0.4, r], scale: 2, y: 0.35 });
  }
  vignettes.push({
    id: 'umbrellas', name: 'Umbrellas on the rail', x: 1213, z: -531.7,
    story: 'Four muddy umbrellas stand against the grandstands, left by spectators who came to stay dry, were told by Dolly the ticket included mud, and gave up before the first heat.',
  });

  // ---- The Berm ------------------------------------------------------------------------------------------------------------
  const berm = T.locate(1378, -598);
  const bs = berm ? berm.s : 276;
  {
    const bk = trackside(bs - 6, 7.8);
    props.push({ id: 'dirt-mower-bike', x: bk.x, z: bk.z, yaw: 0, rot: [1.05, 0, 0.18], scale: 1.6, y: 0.2, tint: 0x3f8f3a });
    const tl = trackside(bs - 2, 7.6);
    chalk('THE BERM REMEMBERS\nIIII IIII II', tl.x, tl.z, tl.yaw);
    vignettes.push({
      id: 'berm', name: 'Nose-first in the Berm', x: bk.x, z: bk.z,
      story: 'A Knobbly sits nose-first in the Berm where it met the bank, a chalk tally of everyone the Berm has remembered propped beside it, and the tally is still short.',
    });
    const b = trackside(bs + 9, OFF + 4.8);
    board('THE BERM\nREMEMBERS', b.x, b.z, b.yaw, 0.7, 0xd8342c);
  }

  // ---- Signs along the lap ----------------------------------------------------------------------------------------------------
  // Whoops: a board before each rough section, on the outside.
  for (const s of [40, 568, 1022]) {
    const w = trackside(s, OFF + 2.6);
    board('WHOOPS\n(not an apology)', w.x, w.z, w.yaw, 0.55, 0xffd21f);
  }
  // Facing the grandstands from the infield: the ticket and the sponsors.
  for (const [s, text, tint] of [
    [50, 'Spectators WILL get muddy.\nThat is the ticket.', 0xffd21f],
    [82, 'RAZOR-BACK\nMud not included.', 0xff7a00],
    [114, 'DANDELION FIZZ\nRefreshing. Mostly.', 0x2f7fd1],
  ] as const) {
    const b = trackside(s, -(OFF + 2.6));
    board(text, b.x, b.z, b.yaw, 0.6, tint);
  }

  // ---- The gate and the pits ----------------------------------------------------------------------------------------------------
  board('RUTBOTTOM DIRT BOWL\nest. the year it rained', 1009, -670, -Math.PI / 2, 0.6, 0x2f6b2a);
  signs.push({ kind: 'poster', text: 'Saturday: Heats.\nSunday: hosing down.', x: 1010, z: -661, yaw: -Math.PI / 2 });
  chalk('Pits: Knobblies only.\nMowers by apology.', 1010, -643, -Math.PI / 2);

  // The lane: gate to pit gap, a draped dirt ribbon (no collider).
  const gapMid = T.frame((PIT_GAP.from + PIT_GAP.to) / 2, OFF);
  const lane: [number, number][] = [];
  {
    const via: [number, number][] = [[BOWL_GATE.x, BOWL_GATE.z], [1016, -652], [1034, -642], [1042, -626], [gapMid.x, gapMid.z]];
    for (let i = 0; i + 1 < via.length; i++) {
      const [ax, az] = via[i], [bx, bz] = via[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2));
      for (let k = 0; k < n; k++) lane.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    lane.push(via[via.length - 1]);
  }

  // The garage and the bench on the north side of the lane.
  props.push({ id: 'speedway-pit-garage', x: 1012, z: -694, yaw: Math.PI / 2, scale: 0.75, tint: 0xff7a00 });
  colliders.push({ x: 1010.9, z: -694, hw: 1.2, hd: 2.3, h: 3.2 });
  props.push({ id: 'workbench', x: 1021, z: -684, yaw: Math.PI, scale: 1.6, solid: { w: 2.9, d: 1.3, h: 1.4 } });
  props.push({ id: 'dirt-mower-bike', x: 1023, z: -697, yaw: 2.4, scale: 1.6, tint: 0xff7a00 });
  props.push({ id: 'tyre-pile', x: 1008, z: -680, yaw: 0.3, scale: 1.2, solid: { r: 0.95, h: 1.2 } });
  props.push({ id: 'tyre-pile', x: 1008.5, z: -677, yaw: 0.9, scale: 1.2, y: 1.15 });
  // The bike wash: a bucket, and the boots.
  props.push({ id: 'glaze-stage-bucket', x: 1031, z: -688, yaw: 0, scale: 1.8, solid: { r: 0.8, h: 1.2 } });
  props.push({ id: 'barrel', x: 1034, z: -686, yaw: 0, scale: 1.6, solid: { r: 0.5, h: 1.3 } });
  const muddy = [[1026, -692, 0.2], [1027.2, -691.6, 0.9], [1028.3, -692.3, 2.4], [1029.2, -691.7, -0.5]] as const;
  for (const [x, z, y] of muddy) props.push({ id: 'court-boots', x, z, yaw: y, scale: 2, tint: 0x5b4228, rot: [0, y, 0] });
  props.push({ id: 'court-boots', x: 1032.2, z: -692.2, yaw: 0, scale: 2, tint: 0xf4f4f4 });
  chalk('Clean boots. Not ours.\nExplain yourself.', 1030, -694.5, Math.PI);
  vignettes.push({
    id: 'boots', name: 'Boots at the bike wash', x: 1029, z: -692,
    story: 'Four pairs of mud-caked boots stand outside the bike wash, and one pair so clean that the note beside it asks the owner to explain themselves.',
  });

  // The south side: spare tyres, Teasel's bike, his practice cones.
  props.push({ id: 'tyre-pile', x: 1008, z: -619, yaw: 0.2, scale: 1.2, solid: { r: 0.95, h: 1.2 } });
  props.push({ id: 'tyre-pile', x: 1010.5, z: -616, yaw: 1.2, scale: 1.2, solid: { r: 0.95, h: 1.2 } });
  props.push({ id: 'tyre-pile', x: 1009, z: -613, yaw: 0.6, scale: 1.2, solid: { r: 0.95, h: 1.2 } });
  props.push({ id: 'dirt-mower-bike', x: TEASEL_SPOT.x + 4.5, z: TEASEL_SPOT.z + 3, yaw: -1.2, scale: 1.6 });
  const cones = [[1015, -596], [1017.5, -596.8], [1020, -597.4], [1022.6, -598], [1025.2, -598.5], [1027.8, -599.2]] as const;
  cones.forEach(([x, z], i) => props.push({ id: 'site-cone', x, z, yaw: 0, scale: 1.6, rot: [0, 0.3 * i, Math.PI / 2], y: 0.5 }));
  props.push({ id: 'hay-bale', x: 1031, z: -600, yaw: 0.3, scale: BALE_SCALE, solid: { r: 0.8, h: 1 } });
  props.push({ id: 'site-cone', x: 1031, z: -600, yaw: 0, scale: 1.6, y: 1 });
  vignettes.push({
    id: 'cones', name: "Teasel's practice cones", x: 1021, z: -597.5,
    story: "Six of Two-Ton Teasel's practice cones lie knocked over in a line, and a seventh stands calmly on top of a hay bale, where he claims it has always been.",
  });

  // ---- Residents ---------------------------------------------------------------------------------------------------------------
  const residents: AmbientGnomeDef[] = [
    {
      id: 'rutbottom-clary', name: 'Clary Mudguard', x: CLARY_SPOT.x, z: CLARY_SPOT.z, yaw: Math.PI, idle: 'cross-arms',
      look: {
        hat: 0x232323, shirt: 0x8b7d62, pants: 0x6e6048, skin: 0xf1c27d, boots: 0x4a3a28, beard: null,
        hair: { color: 0xd2b48c, style: 'pigtails' }, freckles: true,
      },
      bubble: 'Three. Two. Go on, then.',
    },
    {
      id: 'rutbottom-mechanic', name: 'Gasket Pell', x: 1020, z: -692, yaw: 0.9, idle: 'saw',
      look: { hat: 0x1d1d1d, shirt: 0x2f2f33, pants: 0x3a3a3a, beard: 0x7a7a7a, glasses: true },
      bubble: 'It is not leaking. It is sweating. Knobblies sweat.',
    },
    {
      // Two-Ton Teasel waits by his bike in the pits (the Rutbottom Heats giver stands here: TEASEL_SPOT).
      id: 'rutbottom-teasel', name: 'Two-Ton Teasel', x: 1024, z: -630, yaw: Math.PI / 2, idle: 'cross-arms',
      look: { hat: 0xff6a00, shirt: 0x3a3a3a, beard: 0x2a2a2a },
      bubble: 'Clary has never let me win a start. Today she has no say.',
    },
    {
      id: 'rutbottom-pies', name: 'Dolly Dollop', x: 1214, z: -524.4, yaw: Math.PI, idle: 'idle-jaunty',
      look: { hat: 0xf4a6c0, shirt: 0xf4f4f8, pants: 0x6b4a2e, beard: null, freckles: true },
      bubble: 'Mud pies! Warm, brown and exactly what you think!',
    },
    {
      id: 'rutbottom-spectator', name: 'Wet Wilf', x: 1207.5, z: -528.5, yaw: Math.PI, idle: 'look-around',
      look: { hat: 0xd8d8a0, shirt: 0x6b6b4a, pants: 0x3b2d1d, beard: 0x8a6a48 },
      bubble: 'I have been here since the rain. I am told that was the first lap.',
    },
  ];

  void PITS;
  return { barriers, props, signs, vignettes, residents, colliders, stands, lane };
}
