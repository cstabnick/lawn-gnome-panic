// Thorne Even-Estates' story (E16 issue B2): nine small vignettes (three per site), joke signs on the hoardings,
// hard-hat crews walking their loop, Chard Levelright at Plot 1, a night watchman, site sounds, and two things to
// press E on (a show-home door, the plans table at Plot 1). Structure (hoardings, homes, crane, yard, caravan) is
// estates.ts; this file only adds people, props and words. Vignette coordinates are site-local (see estateLocal).
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { JobsDeps } from '../jobs/types';
import type { Box } from '../types';
import { createAmbientGnomes, type AmbientGnomeDef } from '../ambientGnomes';
import { registerCull } from '../cull';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, textPlate, type HomePiece } from '../homes/pieces';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import { EVEN_ESTATES, estateLocal, type CountryPart, type EstateSite } from './types';

const FAR_AWAY = 250;
const SOUND_RANGE = 120;
const CREW_SPEED = 1.2;
const DOOR_RANGE = 2;

const BASE: GnomeLook = {
  hat: 0xd93636, shirt: 0x3b6ea5, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};
const look = (o: Partial<GnomeLook>): GnomeLook => ({ ...BASE, ...o });

/** Sign colours: beige-white text on pale blue. */
const SIGN_BG = 0x9cc3e0;
const SIGN_FG = 0xfaf3e0;

// ---- Vignettes -------------------------------------------------------------------------------------------------------

/** One piece in site-local coordinates (lx, lz); yaw is local (the site's turn is added). */
function at(s: EstateSite, prefab: string, lx: number, lz: number, yaw = 0, o: Partial<HomePiece> = {}): HomePiece {
  const w = estateLocal(s, lx, lz);
  return { prefab, x: w.x, z: w.z, yaw: yaw + s.turn, ...o };
}

type Vignette = (s: EstateSite) => HomePiece[];

/** Plot 1, story 0: the lunch break. Three lunchboxes in a row on a girder, three hats beside them. */
const LUNCH: Vignette = (s) => [
  at(s, 'mushroom-girder-stack', -18, -9, 0, { size: 3 }),
  at(s, 'crate', -19.2, -7, 0, { size: 0.45 }),
  at(s, 'crate', -18, -7, 0, { size: 0.45 }),
  at(s, 'crate', -16.8, -7, 0, { size: 0.45 }),
  at(s, 'acorn-hard-hat', -19.2, -10.6, 0, { size: 0.35 }),
  at(s, 'acorn-hard-hat', -18, -10.6, 0, { size: 0.35 }),
  at(s, 'acorn-hard-hat', -16.8, -10.6, 0, { size: 0.35 }),
];

/** Plot 1, story 1: one dandelion left standing in the levelled yard, a ring of cones, a spirit level nearby. */
const LONE_DANDELION: Vignette = (s) => [
  at(s, 'dandelion-drifter', 0.5, 3.5, 0, { size: 0.5, solid: false }),
  at(s, 'site-cone', 1.5, 3.5, 0, { size: 0.4, y: 0.01 }),
  at(s, 'site-cone', -0.5, 3.5, 0, { size: 0.4, y: 0.01 }),
  at(s, 'site-cone', 0.5, 4.5, 0, { size: 0.4, y: 0.01 }),
  at(s, 'site-cone', 0.5, 2.5, 0, { size: 0.4, y: 0.01 }),
  at(s, 'spirit-level', 2.5, 2.8, 0.3, { size: 0.9, solid: false }),
];

/** Plot 1, story 2: the plans table, its top sheets blowing off toward the hoarding. */
const PLANS_TABLE: Vignette = (s) => [
  at(s, 'site-plans-table', 13, -4),
  at(s, 'pl-newspaper', 15.5, -6.5, 0.6, { size: 0.5, solid: false, y: 0.02 }),
  at(s, 'pl-newspaper', 11.8, -6, -0.3, { size: 0.5, solid: false, y: 0.02 }),
  at(s, 'site-cone', 10.6, -7, 0, { size: 0.5, y: 0.01 }),
  at(s, 'pl-newspaper', 10.9, -6.8, 0.8, { size: 0.5, solid: false, y: 0.02 }),
];

/** Plot 2, story 0: a spirit level balanced on a brick on a pallet, and an empty chair facing it. */
const BALANCED_LEVEL: Vignette = (s) => [
  at(s, 'clay-brick-pallet', -18, -9, 0, { y: 0.01 }),
  at(s, 'brick-stack', -18, -9, 0, { size: 0.7, y: 0.2 }),
  at(s, 'spirit-level', -18, -9, 0, { size: 0.8, y: 0.9 }),
  at(s, 'deck-chair', -18, -11.2, 0),
];

/** Plot 2, story 1: a wheelbarrow over, bricks spilled, and a stack rebuilt perfectly beside it. */
const SORRY_BRICKS: Vignette = (s) => [
  at(s, 'wheelbarrow', -0.5, 3.5, 0.5),
  at(s, 'brick-stack', 1.5, 3, 0, { size: 0.35 }),
  at(s, 'brick-stack', 1.2, 4.2, 0, { size: 0.35 }),
  at(s, 'brick-stack', -1.6, 4.6, 0, { size: 0.9 }),
];

/** Plot 2, story 2: a porch step with a doormat, a milk bottle and a paper, for a house nobody lives in. */
const DOORSTEP: Vignette = (s) => [
  at(s, 'porch-steps', 13, -4),
  at(s, 'rolled-doormat-pack', 13, -4.2, 0, { y: 0.02 }),
  at(s, 'message-bottle', 14.2, -5, 0, { size: 0.3, solid: false }),
  at(s, 'pl-newspaper', 12.2, -5.2, 0.5, { size: 0.4, solid: false, y: 0.02 }),
];

/** Plot 3, story 0: a crane bucket full of wildflowers, set down (somebody's lunch-hour planting). */
const BUCKET_FLOWERS: Vignette = (s) => [
  at(s, 'bucket-crane', -23, -9, 0, { size: 1.5, solid: false }),
  at(s, 'wildflower-patch', -23, -9, 0, { size: 1.2, y: 0.5, solid: false }),
];

/** Plot 3, story 1: a tea urn on a trestle, nine identical mugs in a grid. */
const TEA_URN: Vignette = (s) => {
  const out: HomePiece[] = [
    at(s, 'workbench', 1.5, 3.5, 0, { size: 1.4 }),
    at(s, 'urn', 1.5, 3.5, 0, { size: 0.6, y: 0.8 }),
  ];
  for (const dx of [-0.35, 0, 0.35]) {
    for (const dz of [-0.35, 0, 0.35]) out.push(at(s, 'cocoa-mug', 1.5 + dx, 3.5 + dz, 0, { size: 0.12, y: 0.8, solid: false }));
  }
  return out;
};

/** Plot 3, story 2: a half-buried garden gnome dug up from the old lawn, turned to face the hoarding. */
const DUG_UP_GNOME: Vignette = (s) => [
  at(s, 'gnome-statue', 16.5, -4, Math.PI / 2, { size: 1.0 }),
  at(s, 'dandelion-fluff', 16, -5.5, 0, { size: 0.5, solid: false }),
];

/** Three per site, in story-spot order. Sites are the EVEN_ESTATES order (Plot 1, 2, 3). */
const VIGNETTES: readonly (readonly Vignette[])[] = [
  [LUNCH, LONE_DANDELION, PLANS_TABLE],
  [BALANCED_LEVEL, SORRY_BRICKS, DOORSTEP],
  [BUCKET_FLOWERS, TEA_URN, DUG_UP_GNOME],
];

// ---- Signs -----------------------------------------------------------------------------------------------------------

/** Joke signs per site, mounted on the hoarding's outer face ('+x' at lx = p... see signSpot). */
const SIGNS: readonly { side: '+x' | '-z' | '+z'; p: number; text: string; w: number; h: number }[][] = [
  [
    { side: '+x', p: 8, text: 'LEVEL IS KIND', w: 2.2, h: 0.7 },
    { side: '+x', p: -8, text: 'HARD HATS MUST BE\nACORN CAPS', w: 2.4, h: 1.0 },
    { side: '-z', p: -8, text: 'NO WILDFLOWERS\nBEYOND THIS POINT', w: 2.4, h: 1.0 },
    { side: '-z', p: 8, text: 'THIS SITE HAS GONE\n0 DAYS WITHOUT A\nCROOKED LINE', w: 2.4, h: 1.4 },
  ],
  [
    { side: '+x', p: 8, text: 'SHOW-HOME OPEN\n(BY APPOINTMENT, NEVER)', w: 2.4, h: 1.0 },
    { side: '-z', p: -6, text: 'LEVELRIGHT CONSTRUCTION:\nWE BUILD WHAT THE PLANS SAY', w: 2.8, h: 1.0 },
    { side: '+z', p: -6, text: 'PLOTS FROM 1 TO 1', w: 2.2, h: 0.7 },
    { side: '+z', p: 8, text: 'MIND THE HOUSES', w: 2.2, h: 0.7 },
  ],
  [
    { side: '+x', p: -8, text: 'THORNE EVEN-ESTATES:\nA HOME WHERE NOTHING IS\nOUT OF PLACE, INCLUDING YOU', w: 3.0, h: 1.4 },
    { side: '+x', p: 8, text: 'ALL HOMES IDENTICAL.\nALL HOMES VACANT.', w: 2.6, h: 1.0 },
    { side: '-z', p: 6, text: 'NO WHISTLING ON SITE\n(LEVEL)', w: 2.4, h: 1.0 },
    { side: '+z', p: 6, text: 'PLEASE DO NOT MOVE\nTHE HOUSES', w: 2.4, h: 1.0 },
  ],
];

/** A point clear of the hoarding panel (0.08 thick, feet behind), and the way the sign faces (out of the site). p is the position along the face. */
function signSpot(s: EstateSite, side: '+x' | '-z' | '+z', p: number): { x: number; z: number; yaw: number } {
  const H = s.half - 1 + 0.12;
  const [lx, lz, yaw] = side === '+x' ? [H, p, Math.PI / 2] : side === '-z' ? [p, -H, Math.PI] : [p, H, 0];
  const w = estateLocal(s, lx, lz);
  return { x: w.x, z: w.z, yaw: yaw + s.turn };
}

// ---- Fixed points ----------------------------------------------------------------------------------------------------

/** The plans table at Plot 1 (vignette 3): the spot E reads it at. */
function plansSpot(): { x: number; z: number } {
  return estateLocal(EVEN_ESTATES[0], 13, -4);
}

/** Show-home doors: the front of each home (it faces into the site); E stands 0.8 m in front of the door. */
function doorSpots(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (const s of EVEN_ESTATES) {
    for (const h of s.homes) {
      const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
      out.push({ x: h.x + fx * 4.3, z: h.z + fz * 4.3 });
    }
  }
  return out;
}

const DOORS = doorSpots();
const PLANS = plansSpot();

// ---- Static scenery --------------------------------------------------------------------------------------------------

/** Static vignettes and signs at each site's story spots. */
export function buildEstatesStory(scene: THREE.Scene, boxes: Box[]): void {
  EVEN_ESTATES.forEach((s, i) => {
    const pieces: HomePiece[] = [];
    for (const v of VIGNETTES[i]) pieces.push(...v(s));
    boxes.push(...buildPieces(scene, pieces, `estates-story-${s.id}`));
    for (const sign of SIGNS[i]) {
      const p = signSpot(s, sign.side, sign.p);
      const mesh = textPlate(sign.text, p.x, heightAt(p.x, p.z) + 1.6, p.z, p.yaw, { w: sign.w, h: sign.h, bg: SIGN_BG, fg: SIGN_FG });
      scene.add(mesh);
    }
  });
}

// ---- Living parts ----------------------------------------------------------------------------------------------------

interface Crew {
  model: GnomeModel;
  site: EstateSite;
  pts: readonly { x: number; z: number }[];
  i: number;
  x: number;
  z: number;
  yaw: number;
  wait: number;
}

/** Walk the loop, pausing 3-5 s at each point. Asleep (hidden, not stepped) while the player is far away. */
function stepCrew(c: Crew, dt: number, awake: boolean): void {
  c.model.object.visible = awake;
  if (!awake) return;
  let moving = false;
  if (c.wait > 0) {
    c.wait -= dt;
  } else {
    const t = c.pts[(c.i + 1) % c.pts.length];
    const dx = t.x - c.x, dz = t.z - c.z;
    const d = Math.hypot(dx, dz);
    const step = CREW_SPEED * dt;
    if (d <= step) {
      c.x = t.x; c.z = t.z;
      c.i = (c.i + 1) % c.pts.length;
      c.wait = 3 + Math.random() * 2;
    } else {
      c.x += (dx / d) * step; c.z += (dz / d) * step;
      c.yaw = Math.atan2(dx, dz);
      moving = true;
    }
  }
  c.model.update(gnomeState(c.x, heightAt(c.x, c.z), c.z, c.yaw, moving ? CREW_SPEED : 0), dt);
}

/** The crews at work, Chard Levelright, the night watch, site sounds, the door and the plans. */
export function installEstatesLife(deps: JobsDeps): CountryPart {
  const scene = deps.scene;
  const crews: Crew[] = [];
  const chardDefs: AmbientGnomeDef[] = [];
  const watchDefs: AmbientGnomeDef[] = [];
  const holders: THREE.Group[] = [];
  const soundT: number[] = EVEN_ESTATES.map(() => 6 + Math.random() * 6);

  EVEN_ESTATES.forEach((s, n) => {
    // Two hard-hat crew gnomes per site, starting at points 0 and 2 of the loop.
    for (const start of [0, 2]) {
      const p = s.crewLoop[start];
      const model = makeGnome(scene, look({ hat: 0x8a5a2b, shirt: 0xe8731c, pants: 0xd9c8a5, beard: null }));
      registerCull(model.object, 'gnome');
      crews.push({ model, site: s, pts: s.crewLoop, i: start, x: p.x, z: p.z, yaw: 0, wait: 0 });
    }

    const H = s.half;
    const toCentre = (x: number, z: number): number => Math.atan2(s.x - x, s.z - z);

    if (s.hq) {
      // Chard stands 2.5 m from his caravan, on the gate side.
      const c = estateLocal(s, -H + 8 - 2.5, H - 7);
      chardDefs.push({
        id: 'estates-chard-levelright', name: 'Chard Levelright', x: c.x, z: c.z, yaw: toCentre(c.x, c.z), idle: 'think',
        look: { hat: 0xd9c8a5, shirt: 0xe8731c, pants: 0x5a3e2b, beard: 0xb8b8b8 },
        bubble: 'That wall is out of square. Everything else is fine.',
      });
    }

    // The night watchman stands just inside the gate. His holder group (a real group, so it can hide him) shows only at night.
    const w = estateLocal(s, -H + 4, 6);
    const holder = new THREE.Group();
    holder.visible = false;
    scene.add(holder);
    holders.push(holder);
    watchDefs.push({
      id: `estates-watch-${n}`, name: 'Night Watch', x: w.x, z: w.z, yaw: toCentre(w.x, w.z), idle: 'lean-back',
      look: { hat: 0x2b2b2b, shirt: 0x1e242b, pants: 0x1e242b, beard: 0x888888 },
      bubble: "Site's closed. The houses are closed too. They're always closed.",
    });
    if (getPrefab('night-shift-lantern')) {
      const lantern = buildPrefab('night-shift-lantern', { lights: false });
      lantern.position.set(w.x + 0.4, heightAt(w.x, w.z) + 0.9, w.z + 0.2);
      holder.add(lantern);
    }
  });

  const chard = createAmbientGnomes(scene, chardDefs);
  // createAmbientGnomes only adds to the scene it is given; the holder group stands in for it (THREE.Group is a Scene's add/remove subset).
  const watch = holders.map((holder, n) => createAmbientGnomes(holder as unknown as THREE.Scene, [watchDefs[n]]));

  return {
    update(dt: number): void {
      const p = deps.player;
      const night = deps.timeLabel() === 'Neon Night';
      EVEN_ESTATES.forEach((s, n) => {
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        holders[n].visible = night;
        watch[n].update(dt, p.x, p.z);
        // Site sounds: daytime only, within earshot of the site.
        if (!night && d <= SOUND_RANGE) {
          soundT[n] -= dt;
          if (soundT[n] <= 0) {
            soundT[n] = 6 + Math.random() * 6;
            const pick = Math.floor(Math.random() * 3);
            if (pick === 0) playAt('country-site-hammer', s.yard);
            else if (pick === 1) playAt('country-site-mixer', s.yard);
            else playAt('country-crane-whir', s.crane);
          }
        }
      });
      for (const c of crews) stepCrew(c, dt, Math.hypot(p.x - c.site.x, p.z - c.site.z) <= FAR_AWAY);
      chard.update(dt, p.x, p.z);
    },
    prompt(x: number, z: number): string | null {
      if (DOORS.some((d) => Math.hypot(x - d.x, z - d.z) <= DOOR_RANGE)) return 'Knock on the door';
      if (Math.hypot(x - PLANS.x, z - PLANS.z) <= DOOR_RANGE) return 'Read the plans';
      return null;
    },
    interact(x: number, z: number): boolean {
      if (DOORS.some((d) => Math.hypot(x - d.x, z - d.z) <= DOOR_RANGE)) {
        deps.hud.toast('Nobody answers. Nobody has ever answered.', 3000);
        return true;
      }
      if (Math.hypot(x - PLANS.x, z - PLANS.z) <= DOOR_RANGE) {
        deps.hud.toast('The plans show the same house forty times, and a note: DO NOT ASK WHO FOR.', 3600);
        return true;
      }
      return false;
    },
  };
}
