// The Gutter Bowls' life (batch 3 E19): Fennel, Moss and Pebble at their spots, Asphalt the cat visiting Fennel's
// hammock, an NPC skater riding the Long Gutter, four small vignettes, signs and posters with jokes, and the park's
// sounds. Prefabs are looked up by id and skipped while missing (getPrefab). Nothing here is ridable: it builds no
// surfaces (skate/build.ts) and its colliders keep off the trough, the bowl floor and the kicker run-up.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { DEFAULT_LOOK } from '../config';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { playAt } from '../sound/bus';
import { SPORTS_CAST } from '../sports/types';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { getWeather, isWeatherEnabled } from '../weather';
import { parkHeight } from './park';
import { SKATE_ORIGIN, SKATE_PEOPLE, SKATE_SITE } from './types';

/** The park's north edge (the open side), world z. */
const SKATE_SITE_NORTH = SKATE_SITE.minZ;

export interface SkateLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player; playerRiding: the player is on a board in the park (the NPC skater
   *  then keeps to the far end of the Long Gutter). */
  update(dt: number, t: number, px: number, pz: number, playerRiding: boolean): void;
}

const HALF_PI = Math.PI / 2;
const PLATE_BG = 0xf2e8c8;
/** Past this distance from the park nothing animates and the life group is hidden. */
const FAR = 200;
/** The skater's sounds play only this close. */
const SOUND_RANGE = 40;
/** The Long Gutter: centre line v, its coping at |dv| = LIP, the span in u. */
const GUTTER_V = 12;
const GUTTER_U0 = -16;
const GUTTER_U1 = 12;
const LIP = 1.5 + Math.sqrt(2.5 * 2.5 - 0.5 * 0.5);
/** The Gutter Bowl floor (world), where Moss squeegees. */
const BOWL = { x: SKATE_ORIGIN.x - 10, z: SKATE_ORIGIN.z - 8 };

const wx = (u: number): number => SKATE_ORIGIN.x + u;
const wz = (v: number): number => SKATE_ORIGIN.z + v;
const ground = (x: number, z: number): number => heightAt(x, z);
const firstOf = (ids: readonly string[]): string | null => ids.find((id) => getPrefab(id)) ?? null;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

interface PutOpts { yaw?: number; scale?: number; y?: number; pitch?: number; roll?: number }

/** One prefab stood on the ground (first id that exists); null when none does. */
function put(parent: THREE.Object3D, ids: readonly string[], x: number, z: number, o: PutOpts = {}): THREE.Group | null {
  const id = firstOf(ids);
  if (!id) return null;
  const obj = buildPrefab(id, { lights: false });
  obj.rotation.x = o.pitch ?? 0;
  obj.rotation.z = o.roll ?? 0;
  const grp = new THREE.Group();
  grp.add(obj);
  grp.position.set(x, ground(x, z) + (o.y ?? 0), z);
  grp.rotation.y = o.yaw ?? 0;
  grp.scale.setScalar(o.scale ?? 1);
  grp.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
  parent.add(grp);
  return grp;
}

const decalMats = new Map<number, THREE.Material>();
function decalMat(color: number): THREE.Material {
  let m = decalMats.get(color);
  if (!m) {
    m = flatLayer(new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), LAYER.decal);
    decalMats.set(color, m);
  }
  return m;
}

/** A flat rectangle or disc lying on the ground, 0.01 m up. */
function decal(parent: THREE.Object3D, x: number, z: number, w: number, d: number, color: number, yaw = 0, round = false, lift = 0.01): THREE.Group {
  const geo = round ? new THREE.CircleGeometry(w / 2, 14) : new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geo, decalMat(color));
  mesh.rotation.set(-HALF_PI, 0, 0);
  const grp = new THREE.Group();
  grp.add(mesh);
  grp.position.set(x, ground(x, z) + lift, z);
  grp.rotation.y = yaw;
  grp.name = 'skate-decal';
  parent.add(grp);
  return grp;
}

function vignette(life: THREE.Group, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  life.add(g);
  return g;
}

/** A plate in front of a standing piece (its yaw looks the way the plate does), `y` above the ground. */
function plateAt(parent: THREE.Object3D, text: string, x: number, z: number, yaw: number, y: number, w: number, h: number,
  d = 0.12, colors: { bg?: number; fg?: number } = {}): void {
  const px = x + Math.sin(yaw) * d, pz = z + Math.cos(yaw) * d;
  parent.add(textPlate(text, px, ground(px, pz) + y, pz, yaw, { w, h, bg: PLATE_BG, ...colors }));
}

/** A round collider (people and thin posts). */
function roundBox(x: number, z: number, r: number, h: number): Box {
  return { minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, h: ground(x, z) + h, shape: 'round' };
}

export function buildSkateLife(scene: THREE.Scene): SkateLife {
  const life = new THREE.Group();
  life.name = 'skate-life';
  const pieces: HomePiece[] = [];
  const plates = new THREE.Group();
  plates.name = 'skate-signs';
  life.add(plates);

  const postId = firstOf(['signpost']);
  const postTop = postId ? prefabBox(postId).max.y : 1.6;
  const postFront = postId ? Math.max(0.1, prefabBox(postId).max.z) + 0.05 : 0.12;

  // ---- Signs and posters ------------------------------------------------------------------------------------------
  // Over the north entrance, on two posts either side of the way in.
  const gateX = wx(0), gateZ = SKATE_SITE_NORTH + 0.6;
  if (postId) {
    pieces.push({ prefab: postId, x: gateX - 2.2, z: gateZ, yaw: 0, scale: 1.5 });
    pieces.push({ prefab: postId, x: gateX + 2.2, z: gateZ, yaw: 0, scale: 1.5 });
  }
  plateAt(plates, 'THE GUTTER BOWLS\nest. the day it rained', gateX, gateZ, 0, postTop * 1.5 * 0.92, 3.6, 0.7, 0.1);
  // Fennel's list, a chalk board by the Board Library (facing north-south, read from the entrance side).
  const chalkX = wx(-3), chalkZ = SKATE_SITE_NORTH + 2.3;
  if (postId) pieces.push({ prefab: postId, x: chalkX, z: chalkZ, yaw: 0, solid: false });
  plateAt(plates, 'LINES NOBODY HAS SKATED:\nFirst Push. Round the Kidney.\nThe Long Gutter.\nAsphalt\'s Way Down.', chalkX, chalkZ, 0,
    postTop * 0.8, 1.7, 0.95, postFront, { bg: 0x2e3a33, fg: 0xf0efe4 });
  // Moss's notice, west of the bowl.
  const mossSignX = wx(-17.5), mossSignZ = wz(-11);
  if (postId) pieces.push({ prefab: postId, x: mossSignX, z: mossSignZ, yaw: HALF_PI });
  plateAt(plates, 'If it rains the bowls fill.\nFennel skates the water.\nDo not be Fennel. - Moss', mossSignX, mossSignZ, HALF_PI,
    postTop * 0.75, 1.5, 0.8, postFront);

  // ---- Vignette 1: the leaf pile and the lost hubcap, past the Long Gutter's east end ---------------------------------
  const leaves = vignette(life, 'vignette-skate-leaves');
  put(leaves, ['gutter-leaf-pile'], wx(GUTTER_U1 + 1.8), wz(GUTTER_V), { yaw: 0.6 });
  plateAt(leaves, 'THE BEST GUTTER IN THE YARD\n(needs clearing)', wx(GUTTER_U1 + 1.8), wz(GUTTER_V + 1.6), 0, 0.5, 1.3, 0.5, 0.1);

  // ---- Vignette 2: the HOA sign, a leaning board and a hat on the post --------------------------------------------------
  const hoa = vignette(life, 'vignette-skate-hoa');
  const hx = wx(7), hz = SKATE_SITE_NORTH + 0.9;
  if (postId) pieces.push({ prefab: postId, x: hx, z: hz, yaw: 0 });
  plateAt(hoa, 'NO SKATING\nBy order of the Hat Watch', hx, hz, 0, postTop * 0.75, 1.3, 0.7, postFront);
  put(hoa, ['gta-skateboard'], hx + 0.5, hz + 0.1, { yaw: 0.2, pitch: -1.15 });
  put(hoa, ['hoa-traffic-hat'], hx, hz, { y: postTop - 0.02, scale: 0.9 });

  // ---- Vignette 3: a board snapped in two at the foot of the stairs, a sticking plaster across the break -----------------
  const broken = vignette(life, 'vignette-skate-snapped');
  const bx = wx(10), bz = wz(-13.2);
  const half1 = put(broken, ['gta-skateboard'], bx, bz - 0.2, { yaw: 0.15, roll: 0.05 });
  const half2 = put(broken, ['gta-skateboard'], bx + 0.1, bz + 0.38, { yaw: -0.5, pitch: 0.1 });
  if (half1) half1.scale.set(1, 1, 0.5);
  if (half2) half2.scale.set(1, 1, 0.5);
  decal(broken, bx + 0.02, bz + 0.1, 0.22, 0.08, 0xe8c9a0, 0.4, false, 0.13);
  decal(broken, bx + 0.02, bz + 0.1, 0.06, 0.08, 0xf7e7cf, 0.4, false, 0.131);

  // ---- Vignette 4: Fennel's hammock, the cat bowl and the biscuits (the hammock prefab carries bowl and bag) -------------
  const deck = vignette(life, 'vignette-skate-hammock');
  const hamX = wx(-17.75), hamZ = wz(GUTTER_V);
  put(deck, ['fennel-hammock'], hamX, hamZ, {});
  decal(deck, hamX + 1.2, hamZ + 0.55, 0.3, 0.3, 0xe8e4d8, 0, true);

  // ---- Colliders (people and posts; never on a ridable line) ----------------------------------------------------------
  const boxes = buildPieces(scene, pieces, 'skate-life');

  // ---- People -------------------------------------------------------------------------------------------------------------
  const person = (key: 'fennel' | 'moss' | 'pebble') => {
    const s = SKATE_PEOPLE[key].spot;
    const model = makeGnome(life, { ...DEFAULT_LOOK, ...SPORTS_CAST[key].look });
    model.object.name = `skate-${key}`;
    model.object.position.set(s.x, ground(s.x, s.z) + parkHeight(s.x, s.z), s.z);
    model.object.rotation.y = s.yaw;
    return { model, spot: s, yaw: s.yaw, y: ground(s.x, s.z) + parkHeight(s.x, s.z) };
  };
  const fennel = person('fennel');
  const moss = person('moss');
  const pebble = person('pebble');
  boxes.push(roundBox(fennel.spot.x, fennel.spot.z, 0.35, 1.0));
  boxes.push(roundBox(pebble.spot.x, pebble.spot.z, 0.35, 1.0));
  // Fennel's board, leaning on his hip. Moss's bucket and squeegee beside his boots.
  put(life, ['gta-skateboard'], fennel.spot.x + 0.45, fennel.spot.z - 0.3, { yaw: 0.4, pitch: -1.2 });
  put(life, ['squeegee-bucket'], moss.spot.x + 0.7, moss.spot.z - 0.4, { yaw: -0.5, y: parkHeight(moss.spot.x + 0.7, moss.spot.z - 0.4) });

  // Rain puddles on the bowl floor that Moss chases out.
  const puddles: { g: THREE.Group; base: number }[] = [];
  [[-1.2, 0.6, 0.8], [0.3, 1.6, 0.6], [1.5, -0.4, 0.9], [-0.4, -1.5, 0.5]].forEach(([dx, dz, w]) => {
    const g = decal(life, BOWL.x + dx, BOWL.z + dz, w, w * 0.8, 0x5d7f99, dx, true);
    puddles.push({ g, base: w });
  });

  // ---- Asphalt the cat -----------------------------------------------------------------------------------------------------
  const cat = put(life, ['asphalt-cat'], hamX, hamZ, { scale: 0.45, y: 0.62 });
  const catSleep = { x: hamX + 0.1, y: ground(hamX, hamZ) + 0.62, z: hamZ };
  const catBowl = { x: hamX + 1.05, y: ground(hamX, hamZ), z: hamZ + 0.6 };

  // ---- The NPC skater ----------------------------------------------------------------------------------------------------------
  const skaterRig = new THREE.Group();
  skaterRig.name = 'skate-npc';
  life.add(skaterRig);
  const board = firstOf(['gta-skateboard']) ? buildPrefab('gta-skateboard', { lights: false }) : null;
  const boardPivot = new THREE.Group();
  if (board) boardPivot.add(board);
  skaterRig.add(boardPivot);
  const skater = makeGnome(life, { ...DEFAULT_LOOK, hat: 0x8a6a3a, shirt: 0x6a8a5a, pants: 0x4a4a52, beard: 0x7a5a3a });
  skater.object.name = 'skate-npc-gnome';
  let skU = (GUTTER_U0 + GUTTER_U1) / 2;
  let wallPhase = 0;
  let lastWall = 0;
  let rollT = 0;

  scene.add(life);

  let rainSeen = -1e9;
  let birdT = 6 + Math.random() * 10;
  const wallsOf = (s: number): number => Math.round(s / Math.PI);

  return {
    boxes,
    update(dt, t, px, pz, playerRiding) {
      const dPark = Math.hypot(px - SKATE_ORIGIN.x, pz - SKATE_ORIGIN.z);
      life.visible = dPark <= FAR;
      if (dPark > FAR) return;

      // Fennel: leans on his board, and now and then crouches to look after the cat's bowl (south, by the hammock).
      {
        const ph = t % 24;
        const crouch = ph > 17 && ph < 21;
        const face = crouch ? 0 : fennel.spot.yaw;
        fennel.yaw += wrap(face - fennel.yaw) * Math.min(1, dt * 2);
        fennel.model.update(gnomeState(fennel.spot.x, fennel.y, fennel.spot.z, fennel.yaw, 0, crouch), dt);
        if (!crouch) fennel.model.arms.right.rotation.x = -0.5 + Math.sin(t * 0.7) * 0.05;
      }
      // Moss pushes the squeegee back and forth and turns his head to the puddles.
      {
        moss.model.update(gnomeState(moss.spot.x, moss.y, moss.spot.z, moss.spot.yaw + Math.sin(t * 0.3) * 0.4, 0, false), dt);
        const push = Math.sin(t * 2.2);
        moss.model.arms.right.rotation.x = -0.9 + push * 0.6;
        moss.model.arms.left.rotation.x = -0.9 + push * 0.6;
      }
      // The puddles shrink as Moss gets at them, then fill again.
      const w = getWeather();
      if (w.kind === 'rain') rainSeen = t;
      const wet = !isWeatherEnabled() || t - rainSeen < 240;
      puddles.forEach((p, i) => {
        p.g.visible = wet;
        if (wet) p.g.scale.setScalar(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.25 + i * 1.7)));
      });
      // Pebble films whoever rides by: turns to face them with both arms up.
      {
        const dx = px - pebble.spot.x, dz = pz - pebble.spot.z;
        const near = playerRiding && Math.hypot(dx, dz) < 14;
        const face = near ? Math.atan2(dx, dz) : pebble.spot.yaw;
        pebble.yaw += wrap(face - pebble.yaw) * Math.min(1, dt * 4);
        pebble.model.update(gnomeState(pebble.spot.x, pebble.y, pebble.spot.z, pebble.yaw, 0), dt);
        if (near) {
          pebble.model.arms.right.rotation.x = -1.7;
          pebble.model.arms.left.rotation.x = -1.4;
        }
      }
      // Asphalt: asleep in the hammock for 40 s, then down to the bowl, a nibble, and back (a 70 s loop).
      if (cat) {
        const ph = t % 70;
        let f = 0; // 0 = hammock, 1 = bowl
        if (ph >= 40 && ph < 46) f = (ph - 40) / 6;
        else if (ph >= 46 && ph < 58) f = 1;
        else if (ph >= 58 && ph < 64) f = 1 - (ph - 58) / 6;
        const sleeping = f === 0;
        cat.position.set(
          catSleep.x + (catBowl.x - catSleep.x) * f,
          catSleep.y + (catBowl.y - catSleep.y) * f + (f > 0 && f < 1 ? Math.abs(Math.sin(t * 6)) * 0.03 : 0),
          catSleep.z + (catBowl.z - catSleep.z) * f);
        const toBowl = Math.atan2(catBowl.x - catSleep.x, catBowl.z - catSleep.z);
        cat.rotation.y = f === 0 ? HALF_PI : ph < 52 ? toBowl : ph < 58 ? toBowl - HALF_PI : toBowl + Math.PI;
        cat.scale.set(0.45, sleeping ? 0.3 + Math.sin(t * 1.2) * 0.012 : 0.45, 0.45);
      }

      // The skater: sweeps wall to wall on the transitions, a little air above each coping, drifting slowly along u.
      {
        const target = playerRiding
          ? (px < wx((GUTTER_U0 + GUTTER_U1) / 2) ? GUTTER_U1 - 3 : GUTTER_U0 + 3)
          : (GUTTER_U0 + GUTTER_U1) / 2 + Math.sin(t * 0.07) * 9;
        skU += (target - skU) * Math.min(1, dt * 0.4);
        wallPhase += dt * 0.95;
        const s = Math.sin(wallPhase);
        const dv = LIP * 0.97 * s;
        const x = wx(skU), z = wz(GUTTER_V + dv);
        const slope = (parkHeight(x, z + 0.15) - parkHeight(x, z - 0.15)) / 0.3;
        const peak = Math.max(0, (Math.abs(s) - 0.93) / 0.07);
        const y = ground(x, z) + parkHeight(x, z) + Math.sin(peak * Math.PI * 0.5) * 0.45;
        const moving = Math.cos(wallPhase) >= 0 ? 1 : -1;
        const heading = moving > 0 ? 0 : Math.PI;
        boardPivot.position.set(x, y, z);
        boardPivot.rotation.set(0, heading, 0);
        board?.rotation.set(Math.atan(slope) * -moving, 0, 0);
        skater.update(gnomeState(x, y + 0.11, z, heading + HALF_PI, 0), dt);

        if (dPark <= SOUND_RANGE + 20 && Math.hypot(px - x, pz - z) <= SOUND_RANGE) {
          rollT -= dt;
          if (rollT <= 0) {
            rollT = 1.4;
            playAt('skate-roll', { x, z }, { bus: 'ambience', param: 0.5, maxDist: SOUND_RANGE });
          }
          const wall = wallsOf(wallPhase - HALF_PI);
          if (wall !== lastWall) {
            lastWall = wall;
            if (wall % 3 === 0) playAt('skate-grind', { x, z }, { bus: 'ambience', param: 0.5, maxDist: SOUND_RANGE });
          }
        }
      }

      // Ambient: birds over the park now and then.
      if (dPark <= 80) {
        birdT -= dt;
        if (birdT <= 0) {
          birdT = 18 + Math.random() * 25;
          playAt('bird-song', { x: px + (Math.random() - 0.5) * 50, z: pz + (Math.random() - 0.5) * 50 }, { bus: 'ambience' });
        }
      }
    },
  };
}
