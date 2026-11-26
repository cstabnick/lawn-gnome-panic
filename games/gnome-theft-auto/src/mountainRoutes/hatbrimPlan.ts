// The high Hatbrim's dressing as plain data (E33, issue D2): the Hatband's bollard gates, passing place, scree and World's
// Edge lookout, and the Brim Walk's stile, waymark cairns, Old Pate's cairn, Pate's Bothy, ridge bench and the summit with
// the Summit Register. Everything is placed from the routes' own frames and the exported spots, so it follows the lines
// if they are nudged. hatbrim.ts turns it into meshes, colliders and sound; hatbrimPlan.test.ts checks it. No three.js.
import type { AmbientGnomeDef } from '../ambientGnomes';
import type { PlanProp, PlanSign, Vignette } from '../pardonlin/plan';
import type { Track } from '../raceTrack/trackDef';
import { HATBAND_SPOTS } from './defs/hatband';
import { BRIM_WALK_SPOTS } from './defs/brimWalk';
import { ROUTE_IDS, ROUTES, type RouteId } from './routes';

/** A collider with no prop of its own: round, centre x, z. */
export interface HatbrimSolid { x: number; z: number; r: number; h: number }

export interface HatbrimPlan {
  props: PlanProp[];
  signs: PlanSign[];
  vignettes: Vignette[];
  residents: AmbientGnomeDef[];
  solids: HatbrimSolid[];
}

/** Centre-to-centre spacing of the gate's bollards: 2.6 m between the 0.2 m colliders' faces (bikes and buggies fit). */
export const GATE_PITCH = 3.0;
export const GATE_GAP = 2.6;
export const BOLLARD_R = 0.2;
/** Lateral places of the bollards across the Hatband: three on the shelf and one on the drop side. Negative = hill side. */
export const GATE_LATS = [-6, -3, 0, 3] as const;

/** The six earlier entries the Summit Register can read back. */
export const REGISTER_LINES: readonly string[] = [
  'Reached the top. Hat blew off. Worth it. - B.',
  'Came for the view. Got the wind. Fair trade. - P.T.',
  'Wore two hats. Needed three. - M.',
  'You can see the Fence from here. Wish I could not. - anon',
  'Restacked a cairn on the way up. Do not tell the others. - ?',
  'Page one says "we were here, and so were our hats". Page two says the same, only wetter. - K.',
];

/** The summit's height on its plaque (the Bobble's top is about 104 m at the summit spot). */
export const SUMMIT_HEIGHT_TEXT = '105 m';

const S = Math.sin, C = Math.cos;

export function hatbrimPlan(): HatbrimPlan {
  const hb = ROUTES.hatband;
  const bw = ROUTES['brim-walk'];
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const residents: AmbientGnomeDef[] = [];
  const solids: HatbrimSolid[] = [];

  const sOf = (t: Track, spot: { x: number; z: number }): number => t.locate(spot.x, spot.z, 80)?.s ?? 0;
  const clampS = (t: Track, s: number) => Math.min(t.length(), Math.max(0, s));
  /** Point beside the route: `lat` > 0 is left of travel. */
  const at = (t: Track, s: number, lat: number) => t.frame(clampS(t, s), lat);
  /** Yaw that makes a thing at (x, z) face the route's centre line at s. */
  const toward = (t: Track, s: number, x: number, z: number): number => {
    const c = t.frame(clampS(t, s), 0);
    return Math.atan2(c.x - x, c.z - z);
  };
  /** Clear distance from the centre line for a thing of radius r: road half width, shoulder, and a margin. */
  const clear = (t: Track, r = 0) => t.def.width / 2 + t.def.shoulder + 0.5 + r;

  const putXZ = (id: string, x: number, z: number, yaw: number, extra: Partial<PlanProp> = {}): PlanProp => {
    const p: PlanProp = { id, x, z, yaw, ...extra };
    props.push(p);
    return p;
  };
  /** A prop beside the route, facing it (`face`: 'route') or turned along it (`face`: 'along') or by a given yaw. */
  const put = (t: Track, id: string, s: number, lat: number, face: 'route' | 'along' | number, extra: Partial<PlanProp> = {}): PlanProp => {
    const p = at(t, s, lat);
    const yaw = face === 'route' ? toward(t, s, p.x, p.z) : face === 'along' ? p.yaw : face;
    return putXZ(id, p.x, p.z, yaw, extra);
  };
  /** A plaque stood 0.07 m in front of a board at (x, z), reading toward `yaw`. */
  const plaque = (text: string, x: number, z: number, yaw: number, y: number, w: number, h: number) => {
    signs.push({ kind: 'plaque', text, x: x + S(yaw) * 0.07, z: z + C(yaw) * 0.07, yaw, y, w, h });
  };
  /** A route sign board (the prefab) with its text. */
  const board = (t: Track, s: number, lat: number, face: 'route' | number, text: string, w = 2.2, h = 0.85) => {
    const p = put(t, 'route-name-sign', s, lat, face);
    plaque(text, p.x, p.z, p.yaw ?? 0, 1.7, w, h);
    return p;
  };
  /** A street sign (the prefab draws the post; the text goes on its blank face). */
  const street = (t: Track, s: number, lat: number, face: 'route' | number, text: string) => {
    const p = put(t, 'euro-street-sign', s, lat, face);
    signs.push({ kind: 'street', text, x: p.x, z: p.z, yaw: p.yaw ?? 0 });
    return p;
  };

  // ======================================================= THE HATBAND =============================================
  const hbEdge = clear(hb);
  const sGateW = sOf(hb, HATBAND_SPOTS.gateWest);
  const sGateE = sOf(hb, HATBAND_SPOTS.gateEast);

  // ---- The two bollard gates ----------------------------------------------------------------------------------------
  const gateText = 'THE HATBAND\nBikes and buggies only\nNo cars, no caravans, no excuses';
  for (const [s, roadSide] of [[sGateW, -1], [sGateE, 1]] as const) {
    for (const lat of GATE_LATS) {
      const p = at(hb, s, lat);
      putXZ('euro-bollard', p.x, p.z, p.yaw, { solid: { r: BOLLARD_R, h: 1 } });
    }
    // The sign stands on the road side of the gate, on the hill side of the shelf, facing the riders who come up to it.
    const ss = s + roadSide * 3.6;
    const p = at(hb, ss, -(hbEdge + 1.4));
    const yaw = at(hb, ss, 0).yaw + (roadSide < 0 ? Math.PI : 0);
    putXZ('route-name-sign', p.x, p.z, yaw);
    plaque(gateText, p.x, p.z, yaw, 1.7, 2.2, 0.85);
  }

  // ---- Passing place --------------------------------------------------------------------------------------------------
  const sPass = sOf(hb, HATBAND_SPOTS.passingPlace);
  street(hb, sPass - 2.5, -(hbEdge + 0.9), at(hb, sPass, 0).yaw + Math.PI, 'PASSING PLACE\nBikes: wave.\nBuggies: wave back.');

  // ---- Scree and the falling-rocks sign; the goat is the rockfall -----------------------------------------------------
  const sScree = sOf(hb, HATBAND_SPOTS.scree);
  const screeLat = -(hbEdge + 1.7);
  const scree = put(hb, 'scree-pile', sScree, screeLat, 'route');
  put(hb, 'goat', sScree, screeLat, toward(hb, sScree, scree.x, scree.z) + 0.5, { y: 0.9, scale: 0.9 });
  put(hb, 'falling-rocks-sign', sScree - 6, -(hbEdge + 0.8), at(hb, sScree - 6, 0).yaw + Math.PI);
  street(hb, sScree + 5, -(hbEdge + 0.9), at(hb, sScree + 5, 0).yaw, 'FALLING ROCKS\n(it is the goat)');
  vignettes.push({
    id: 'hatbrim-goat-rockfall', name: 'The rockfall is the goat', x: scree.x, z: scree.z,
    story: 'A fan of scree, a falling-rocks sign, and one hill goat standing on top of it looking innocent. Every rock on the shelf is a goat-sized rock.',
  });

  // ---- World's Edge --------------------------------------------------------------------------------------------------
  const we = HATBAND_SPOTS.worldsEdge;
  const sWe = sOf(hb, we);
  const outward = we.yaw; // the lookout faces north over the fence
  const weLat = -(hbEdge + 0.9);
  const topo = put(hb, 'viewpoint-topograph', sWe, weLat - 0.4, outward);
  const bench = put(hb, 'bench', sWe + 3.4, weLat, outward);
  put(hb, 'field-binoculars', sWe - 2.2, weLat, outward, { y: 0.5, scale: 1.2 });
  board(hb, sWe - 5.5, -(hbEdge + 1.6), at(hb, sWe - 5.5, 0).yaw + Math.PI,
    "WORLD'S EDGE\nBeyond: the Fence.\nBeyond the Fence: we don't talk about it.", 2.4, 0.95);
  // The bike propped against the rail of nothing, with a picnic on its saddle.
  const bike = put(hb, 'dirt-mower-bike', sWe + 0.9, weLat - 1.9, outward + 1.2);
  const flask = put(hb, 'honeydew-flask', sWe + 0.9, weLat - 1.9, 0, { y: 0.55, scale: 0.8 });
  flask.x = bike.x; flask.z = bike.z;
  vignettes.push({
    id: 'hatbrim-worlds-edge-picnic', name: 'The picnic at the edge of the world', x: bike.x, z: bike.z,
    story: 'A bike propped at the lookout with a jar of honey balanced on the saddle, and a cyclist who has been looking at the fence for so long the honey has gone warm.',
  });
  {
    const rp = at(hb, sWe - 0.9, weLat - 0.6);
    residents.push({
      id: 'hatbrim-cyclist', name: 'Cass Pedal', x: rp.x, z: rp.z, yaw: outward, idle: 'look-around',
      look: { hat: 0xd8402a, shirt: 0xe8c43a, pants: 0x2b2f4a, boots: 0x2a2018, beard: 0xa05a2a },
      bubble: 'Rode all the way up for this. It is a fence. A good fence, mind.',
    });
  }
  void topo; void bench;

  // ======================================================= THE BRIM WALK ===========================================
  const bwEdge = clear(bw);
  const sStile = sOf(bw, BRIM_WALK_SPOTS.stile);
  const sPate = sOf(bw, BRIM_WALK_SPOTS.pateCairn);
  const sBothy = sOf(bw, BRIM_WALK_SPOTS.bothy);
  const sSummit = sOf(bw, BRIM_WALK_SPOTS.summit);
  const sBench = sOf(bw, BRIM_WALK_SPOTS.ridgeBench);
  const sGap = sOf(bw, BRIM_WALK_SPOTS.gapCrossing);

  // ---- The stile at Mittenholt (stands across the path: no collider, walkers climb it) ----------------------------------
  put(bw, 'stone-stile', sStile + 2, 0, 'along');
  street(bw, sStile + 0.5, -(bwEdge + 1.2), 'route',
    'BRIM WALK\nOld Pate  1.1 km\nThe Bobble  2.4 km\nHigh Tarn  3.8 km\nWear two hats.');

  // ---- Old Pate's cairn, with a hat on a stick (a bet) ------------------------------------------------------------------
  {
    const lat = -(bwEdge + 0.9);
    const cairn = put(bw, 'hamlet-stone-cairn', sPate, lat, 'route', { scale: 1.2 });
    solids.push({ x: cairn.x, z: cairn.z, r: 0.5, h: 1.4 });
    const stick = putXZ('stick', cairn.x + 0.15, cairn.z, 0, { rot: [0, 0, Math.PI / 2], y: 0.9, scale: 3 });
    putXZ('mountain-bobble-beanie', stick.x, stick.z, 0.6, { y: 1.8, scale: 1.1 });
    street(bw, sPate + 3, lat - 0.2, 'route', "NED'S HAT\nDo not touch.\nBet still on.");
    vignettes.push({
      id: 'hatbrim-pate-bet', name: "Ned's bet", x: cairn.x, z: cairn.z,
      story: "A woollen hat on a stick stuck in Old Pate's cairn, and a sign telling you to leave it alone. Someone bet it would stay up till Thursday. The wind has not been told.",
    });
  }

  // ---- Waymark cairns, every 120 m beside the path ---------------------------------------------------------------------
  const nearOther = (x: number, z: number, own: RouteId, r: number): boolean =>
    ROUTE_IDS.some((id) => id !== own && (ROUTES[id].locate(x, z, r + 4)?.dist ?? Infinity) < r);
  const keepOut = [sStile, sPate, sBothy, sSummit, sBench, sGap];
  let flip = 1;
  for (let s = 100; s < bw.length() - 60; s += 120) {
    if (keepOut.some((k) => Math.abs(k - s) < 16)) { flip = -flip; continue; }
    const p = at(bw, s, flip * (bwEdge + 0.5));
    flip = -flip;
    if (nearOther(p.x, p.z, 'brim-walk', 9)) continue;
    putXZ('hamlet-stone-cairn', p.x, p.z, p.yaw, { scale: 0.5 });
  }

  // ---- Pate's Bothy ---------------------------------------------------------------------------------------------------
  const BOTHY_HALF_DEPTH = 2;
  {
    const lat = -(bwEdge + BOTHY_HALF_DEPTH + 0.3);
    const p = at(bw, sBothy, lat);
    const yaw = toward(bw, sBothy, p.x, p.z); // the door faces the path
    putXZ('tarn-bothy', p.x, p.z, yaw, { solid: { w: 6, d: 4, h: 3.6 } });
    const sg = at(bw, sBothy + 5.2, -(bwEdge + 0.9));
    putXZ('route-name-sign', sg.x, sg.z, toward(bw, sBothy + 5.2, sg.x, sg.z));
    plaque("PATE'S BOTHY\nShut the door.\nThe weather lets itself in.", sg.x, sg.z, toward(bw, sBothy + 5.2, sg.x, sg.z), 1.7, 2.2, 0.85);

    // The half-pitched tent beside it, poles in the wrong order.
    const tp = at(bw, sBothy - 6.2, -(bwEdge + 1.9));
    const tyaw = toward(bw, sBothy - 6.2, tp.x, tp.z) + 0.5;
    putXZ('hunter-tent', tp.x, tp.z, tyaw, { rot: [0, 0, 0.18], scale: 0.9 });
    for (const [i, ang] of [0.3, 1.1, 2.3].entries()) {
      putXZ('stick', tp.x + 1.9 * C(ang + 2) + i * 0.2, tp.z + 1.9 * S(ang + 2), ang, { y: 0.05, scale: 2.4 });
    }
    street(bw, sBothy - 3.4, -(bwEdge + 0.9), 'route', 'CAMPERS\nPitch here.\n(Not like that.)');
    vignettes.push({
      id: 'hatbrim-bothy-tent', name: 'The tent that tried', x: tp.x, z: tp.z,
      story: 'A tent half up beside a perfectly good bothy, its poles laid out in the wrong order and one still in the wrong hole. The owner is inside the bothy, being kind to himself.',
    });
  }

  // ---- A bench on the ridge, and the walker resting on it -------------------------------------------------------------
  {
    const bsp = BRIM_WALK_SPOTS.ridgeBench;
    const sideSign = (bw.locate(bsp.x, bsp.z, 80)?.lat ?? 1) >= 0 ? 1 : -1;
    const lat = sideSign * (bwEdge + 1.2);
    const bp = at(bw, sBench, lat);
    putXZ('log-bench', bp.x, bp.z, bsp.yaw, { solid: { w: 1.8, d: 0.5, h: 0.45 } });
    putXZ('folded-map', bp.x - S(bsp.yaw) * 0.0, bp.z, bsp.yaw + Math.PI, { y: 0.5, scale: 1.2 });
    residents.push({
      id: 'hatbrim-walker', name: 'Moss Gaiter', x: bp.x + S(bsp.yaw) * 1.4, z: bp.z + C(bsp.yaw) * 1.4, yaw: bsp.yaw, idle: 'sit-ground',
      look: { hat: 0x4f7a3a, shirt: 0xb85a2a, pants: 0x6a5a3a, boots: 0x3a2a1a, beard: 0xe8e0d0 },
      bubble: 'The map says we are at the bottom. Either the map is upside down or the mountain is.',
    });
    vignettes.push({
      id: 'hatbrim-upside-down-map', name: 'The upside-down map', x: bp.x, z: bp.z,
      story: 'A walker on the ridge bench with a map held the wrong way up, absolutely certain the mountain has been moved.',
    });
  }

  // ---- The summit -------------------------------------------------------------------------------------------------------
  {
    const cairnLat = -(bwEdge + 1.1);
    const cairn = put(bw, 'hamlet-stone-cairn', sSummit, cairnLat, 'route', { scale: 1.6 });
    const reg = put(bw, 'summit-register-box', sSummit - 1.3, bwEdge + 0.6, 'route');
    board(bw, sSummit + 4.5, -(bwEdge + 1.9), 'route', `THE BOBBLE · ${SUMMIT_HEIGHT_TEXT}\nthe top of the yard\nMind the hat.`, 2.2, 0.9);
    const rp = at(bw, sSummit + 1.6, bwEdge + 0.9);
    residents.push({
      id: 'hatbrim-summit-reader', name: 'Dunstan Cairn', x: rp.x, z: rp.z, yaw: toward(bw, sSummit + 1.6, rp.x, rp.z) + 1.9, idle: 'read',
      look: { hat: 0x3a6ea8, shirt: 0xd8d0b8, pants: 0x4a4a3a, boots: 0x3a2a1a, beard: 0xcfcfc8, glasses: true },
      bubble: 'Third line down: "Hat blew off." Fourth: "Hat blew off." Fifth is just a hat. Pressed. Between the pages.',
    });
    vignettes.push({
      id: 'hatbrim-summit-register', name: 'The Summit Register', x: reg.x, z: reg.z,
      story: 'A tin box with a book in it, kept since before the HOA, beside a cairn taller than the gnome signing it. Most of the entries are about hats.',
    });
    solids.push({ x: cairn.x, z: cairn.z, r: 0.65, h: 1.6 }, { x: reg.x, z: reg.z, r: 0.35, h: 1.5 });
  }

  // Props that carry a `solid` get their collider from the builder; `solids` holds the cairns and the register box.
  return { props, signs, vignettes, residents, solids };
}

/** Where the Summit Register is signed (on the path at the summit spot). */
export function registerSpot(): { x: number; z: number } {
  return { x: BRIM_WALK_SPOTS.summit.x, z: BRIM_WALK_SPOTS.summit.z };
}
