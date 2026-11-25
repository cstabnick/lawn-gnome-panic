// Trellisdown Vineyard and Brassknock Manor (E16 issue C4): six story vignettes (props that tell a story, no text), joke
// signs, six frost-pots by the vineyard path that smoke on cold nights, Chicory Snips working his loop with his shears,
// the Countess on the terrace, the manor knocker, and the vineyard's sounds.
import * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';
import type { JobsDeps } from '../jobs/types';
import { makeBubbleSprite } from '../ambientGnomes';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { playAt } from '../sound/bus';
import { speakAt } from '../voice/speech';
import { voiceFor } from '../voice/voices';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { E, MANOR, N, VINEYARD, W, type CountryPart } from './types';

const BASE_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x3b6ea5, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};
const CHICORY_LOOK: GnomeLook = { ...BASE_LOOK, hat: 0x4e7a32, shirt: 0x7a5a3a, pants: 0x4a3a2a, beard: 0x8a6a4a };
const COUNTESS_LOOK: GnomeLook = { ...BASE_LOOK, hat: 0x6e1e2a, shirt: 0xe8dcc8, pants: 0x6e1e2a, beard: null, dress: true };
const COUNTESS_LINE = 'Lovely view. One owns it, you know.';
const COUNTESS_NAME = 'Countess Wisteria Brassknock';
const CHICORY_SPEED = 1.2;
const CHICORY_SLEEP_DIST = 250;
const VINEYARD_CENTRE = { x: -1140, z: -170 };
const SMOKE_RANGE = 80;
const PLATE_OFF = 0.3;

/** Frost-pots by the vineyard path, south of the rows (the smoke puffs rise above them on cold nights). */
const FROST_POTS: readonly { x: number; z: number }[] = [
  { x: -1131.5, z: -80 }, { x: -1148.5, z: -80 }, { x: -1131.5, z: -68 },
  { x: -1148.5, z: -68 }, { x: -1131.5, z: -104 }, { x: -1148.5, z: -104 },
];

/** The top of a prefab at its own scale (for things stood on a table, a crate or a barrow). */
function topOf(id: string): number {
  return prefabBox(id).max.y;
}

/** Signs on a post, each with its text plate in front (x, z = the post; yaw = the way the plate faces). */
const SIGNS: readonly { text: string; x: number; z: number; yaw: number }[] = [
  { text: 'THIS ROW IS CROOKED ON PURPOSE', x: -1132.5, z: -205, yaw: W },
  { text: 'PICKERS: ONE GRAPE FOR THE BASKET, NONE FOR THE MOUTH', x: -1121, z: -111, yaw: W },
  { text: 'FROST-POTS LIT BY THE GARDENER ONLY', x: -1158, z: -236, yaw: E },
  { text: 'THE FIRST VINE: DO NOT TOUCH, PRUNE, ADMIRE OR LEAN', x: -1118, z: -101, yaw: E },
  { text: 'PRIVATE GARDEN · BRASSKNOCK CHARTER 1', x: -1160, z: -2, yaw: N },
  { text: 'TASTINGS BY INVITATION', x: -1128, z: 14, yaw: N },
  { text: 'DELIVERIES: ROUND THE BACK. EVERYONE: ROUND THE BACK', x: -1164, z: 14, yaw: N },
  { text: 'PLEASE DO NOT FEED THE TOPIARY', x: -1117.5, z: 62, yaw: E },
  { text: 'HOA PAMPHLETS: TAKE ONE. THE HOA THANKS YOU.', x: -1109, z: 60.5, yaw: W },
];

/** Vignette props, each within 4 m of its story spot. */
function vignettes(): HomePiece[] {
  const tableTop = topOf('side-table');
  return [
    // Vineyard 1 (-1128, -118): a pruning ladder, a basket half full of grapes, a bottle and a thimble glass.
    { prefab: 'ladder', x: -1130.5, z: -120.5, yaw: 0.6 },
    { prefab: 'wicker-basket', x: -1126, z: -116, yaw: 0.2 },
    { prefab: 'grape-dew-bottle', x: -1125.5, z: -119.5, yaw: 0 },
    { prefab: 'espresso-cup', x: -1124.2, z: -119, yaw: 0 },
    // Vineyard 2 (-1152, -240): a frost-pot relit in its fire ring, the gardener's watch post (crate, clock, stool).
    { prefab: 'fire-ring', x: -1154.6, z: -242.4, yaw: 0 },
    { prefab: 'frost-pot', x: -1153.6, z: -241.6, yaw: 0.5 },
    { prefab: 'crate', x: -1150.5, z: -243.5, yaw: 0.3 },
    { prefab: 'wall-clock', x: -1150.5, z: -243.5, yaw: 0, y: topOf('crate') },
    { prefab: 'camp-stool', x: -1155.5, z: -238.5, yaw: 1.2 },
    // Vineyard 3 (-1190, -96) by the lodge: a black tanker drum and three empty frost-pot fuel cans.
    { prefab: 'gta-dew-barrel', x: -1191, z: -97.5, yaw: 0 },
    { prefab: 'fuel-can', x: -1188.5, z: -93, yaw: 0 },
    { prefab: 'fuel-can', x: -1188.5, z: -94.5, yaw: 0 },
    { prefab: 'fuel-can', x: -1188.5, z: -96, yaw: 0 },
    // Manor 1 (-1185, 62): a croquet game abandoned mid-play, one mallet thrown down.
    { prefab: 'tennis-ball', x: -1183.5, z: 60.5, yaw: 0 },
    { prefab: 'tennis-ball', x: -1186.5, z: 63.5, yaw: 0 },
    { prefab: 'tin-ring', x: -1182, z: 61, yaw: 0 },
    { prefab: 'tin-ring', x: -1188, z: 59.5, yaw: 0 },
    { prefab: 'garden-mallet', x: -1184, z: 64.5, yaw: 1.1 },
    // Manor 2 (-1150, 70): a garden tea laid for two; the second chair was never pulled out.
    { prefab: 'side-table', x: -1150, z: 70, yaw: 0 },
    { prefab: 'chair', x: -1152.6, z: 70.2, yaw: E },
    { prefab: 'chair', x: -1147.4, z: 69.8, yaw: W },
    { prefab: 'espresso-cup', x: -1150.4, z: 69.6, yaw: 0, y: tableTop },
    { prefab: 'espresso-cup', x: -1149.6, z: 70.4, yaw: 0, y: tableTop },
    // Manor 3 (-1112, 58): a barrow of pulled-up wildflowers beside a perfectly clipped topiary.
    { prefab: 'wheelbarrow', x: -1110, z: 56.5, yaw: 0.4 },
    { prefab: 'wildflower-patch', x: -1109.5, z: 56.3, yaw: 0, y: topOf('wheelbarrow') - 0.1 },
    { prefab: 'euro-topiary-spiral', x: -1114.5, z: 60.5, yaw: 0 },
  ];
}

/** A soft round puff for the frost-pot smoke (null without a document: tests). */
function puffTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

/** Vignettes, frost-pots, signs and their posts (one static batch); returns their colliders (push them into world.boxes). */
export function buildTrellisStory(scene: THREE.Scene, boxes: Box[]): void {
  const pots: HomePiece[] = FROST_POTS.map((p) => ({ prefab: 'frost-pot', x: p.x, z: p.z, yaw: 0, solid: false }));
  const posts: HomePiece[] = SIGNS.map((s) => ({ prefab: 'signpost', x: s.x, z: s.z, yaw: s.yaw }));
  boxes.push(...buildPieces(scene, [...vignettes(), ...pots, ...posts], 'trellis-story'));
  for (const s of SIGNS) {
    const plate = textPlate(
      s.text,
      s.x + Math.sin(s.yaw) * PLATE_OFF,
      heightAt(s.x, s.z) + 1.35,
      s.z + Math.cos(s.yaw) * PLATE_OFF,
      s.yaw,
      { w: 1.2, h: 0.38 },
    );
    scene.add(plate);
  }
}

/** Chicory's loop, the Countess, the cold-night smoke and the knocker. */
export function installTrellisLife(deps: JobsDeps): CountryPart {
  const { scene, hud, player } = deps;
  const { rows, path, rowStep, chicoryLoop: loop } = VINEYARD;

  // Chicory Snips: walks the loop, rests at each spot (4-8 s, the shears play), asleep while the player is far away.
  const chicory = makeGnome(scene, CHICORY_LOOK);
  let cx = loop[0].x, cz = loop[0].z, cyaw = loop[0].yaw;
  let at = 0, next = 1;
  let rest = 4 + Math.random() * 4;
  let lastToast = -Infinity;

  // The Countess on the terrace, daytime only.
  const countess = makeGnome(scene, COUNTESS_LOOK);
  const cs = MANOR.countess;
  // She stands on the raised terrace (the brassknock-terrace rooftop, 1.2 m above the forecourt: manor.ts).
  const countessY = heightAt(cs.x, cs.z) + 1.2;
  countess.update(gnomeState(cs.x, countessY, cs.z, cs.yaw, 0), 1);
  const countessBubble = makeBubbleSprite(COUNTESS_NAME, COUNTESS_LINE);
  countessBubble.position.set(cs.x, countessY + 2.25, cs.z);
  countessBubble.scale.set(3.4, 1.18, 1);
  countessBubble.visible = false;
  scene.add(countessBubble);
  const countessVoice = voiceFor(COUNTESS_NAME);
  let countessSaid = false;
  let countessLast = -Infinity;

  // Cold nights: one smoke puff sprite above each frost-pot.
  const tex = puffTexture();
  const puffs = FROST_POTS.map((p, i) => {
    const mat = new THREE.SpriteMaterial({ map: tex, color: 0xb8b8b8, transparent: true, opacity: 0, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    return { p, sprite, mat, base: heightAt(p.x, p.z) + 1.2, phase: i / FROST_POTS.length };
  });
  let campT = 10 + Math.random() * 5;
  let ambT = 8 + Math.random() * 7;

  const onRow = (x: number, z: number): boolean => {
    if (x < rows.minX || x > rows.maxX || z < rows.minZ || z > rows.maxZ) return false;
    if (x >= path.minX && x <= path.maxX) return false;
    const k = Math.round((z - rows.minZ) / rowStep);
    return Math.abs(z - (rows.minZ + k * rowStep)) <= 1;
  };
  const dist = (ax: number, az: number, bx: number, bz: number): number => Math.hypot(ax - bx, az - bz);
  const inVineyard = (x: number, z: number): boolean => {
    const s = VINEYARD.site;
    return x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ;
  };
  const door = MANOR.door;
  const atDoor = (x: number, z: number): boolean => dist(x, z, door.x, door.z) <= 1.5;

  return {
    update(dt, t) {
      const px = player.x, pz = player.z;
      const night = deps.timeLabel() === 'Neon Night';
      const day = !night;

      // Chicory: asleep (frozen, hidden) while the player is far from the vineyard.
      const awake = dist(px, pz, VINEYARD_CENTRE.x, VINEYARD_CENTRE.z) <= CHICORY_SLEEP_DIST;
      chicory.object.visible = awake;
      if (awake) {
        let walking = 0;
        if (rest > 0) {
          rest -= dt;
          cx = loop[at].x; cz = loop[at].z; cyaw = loop[at].yaw;
          if (rest <= 0) next = (at + 1) % loop.length;
        } else {
          const g = loop[next];
          const gx = g.x - cx, gz = g.z - cz;
          const d = Math.hypot(gx, gz);
          const step = CHICORY_SPEED * dt;
          if (d <= step) {
            cx = g.x; cz = g.z; at = next;
            rest = 4 + Math.random() * 4;
            playAt('country-vine-snip', { x: cx, z: cz });
          } else {
            cx += (gx / d) * step; cz += (gz / d) * step;
            cyaw = Math.atan2(gx, gz);
            walking = CHICORY_SPEED;
          }
        }
        chicory.update(gnomeState(cx, heightAt(cx, cz), cz, cyaw, walking), dt);
        if (onRow(px, pz) && dist(px, pz, cx, cz) <= 25 && t - lastToast >= 20) {
          hud.toast('Chicory: Off the row. OFF the row.');
          lastToast = t;
        }
      }

      // The Countess: daytime only, her line when the player comes near.
      countess.object.visible = day;
      const near = day && dist(px, pz, cs.x, cs.z) <= 10.5;
      countessBubble.visible = near;
      if (near && !countessSaid && t - countessLast >= 20) {
        speakAt(COUNTESS_LINE, countessVoice, cs.x, cs.z, 16);
        countessLast = t;
      }
      countessSaid = near;

      // Cold nights: the smoke rises above the frost-pots; a campfire crackles at the nearest one.
      let nearest = Infinity;
      let nearestPot = FROST_POTS[0];
      for (const p of FROST_POTS) {
        const d = dist(px, pz, p.x, p.z);
        if (d < nearest) { nearest = d; nearestPot = p; }
      }
      for (const pf of puffs) {
        pf.sprite.visible = night;
        if (!night) continue;
        const ph = ((t / 6) + pf.phase) % 1;
        const s = 0.6 + ph * 1.4;
        pf.sprite.position.set(pf.p.x, pf.base + ph * 1.8, pf.p.z);
        pf.sprite.scale.set(s, s, 1);
        pf.mat.opacity = 0.5 * (1 - ph) * Math.min(1, ph / 0.15);
      }
      if (night && nearest <= SMOKE_RANGE) {
        campT -= dt;
        if (campT <= 0) {
          playAt('country-campfire', { x: nearestPot.x, z: nearestPot.z }, { gain: 0.4 });
          campT = 10 + Math.random() * 5;
        }
      }

      // Somebody pruning out of sight, in the vineyard, daytime only.
      if (day && inVineyard(px, pz)) {
        ambT -= dt;
        if (ambT <= 0) {
          const rowCount = Math.floor((rows.maxZ - rows.minZ) / rowStep) + 1;
          const z = rows.minZ + Math.floor(Math.random() * rowCount) * rowStep;
          const x = rows.minX + Math.random() * (rows.maxX - rows.minX);
          playAt('country-vine-snip', { x, z });
          ambT = 8 + Math.random() * 7;
        }
      }
    },
    prompt(x, z) {
      return atDoor(x, z) ? 'Use the knocker' : null;
    },
    interact(x, z) {
      if (!atDoor(x, z)) return false;
      playAt('country-manor-knocker', { x: door.x, z: door.z });
      hud.toast('Nobody comes. A voice from somewhere says: round the back.');
      return true;
    },
  };
}
