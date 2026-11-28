// Painted signs for the coast (E11, D58): a wooden board with a text plate seated 1 cm proud of its front face, built
// with the shared plate painter (`textPlate`, homes/pieces.ts). A free-standing sign (on a post) prints both faces, so
// no board shows a blank grey back to the beach. Used by the boardwalk, the Spokewheel, the Bathtub Queen and the coast
// life modules. The board is a box (so it never lies in another surface's plane).
import * as THREE from 'three';
import { textPlate } from '../homes/pieces';

export interface CoastSignOpts {
  /** Board width and height, metres (default 3 x 1). */
  w?: number;
  h?: number;
  /** Board colour, text colour (defaults: sun-bleached white board, dark blue paint). */
  bg?: number;
  fg?: number;
  /** Post height under the board, metres (0 = no post, e.g. a sign fixed to a stall). Default 0. */
  post?: number;
  /**
   * Print the back face too: true repeats the front, a string is a second joke, false leaves the plain board.
   * Default: true when the sign stands on a post (post > 0), false for a sign fixed to something (post 0).
   */
  back?: string | boolean;
}

const boardMats = new Map<number, THREE.MeshStandardMaterial>();
const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });

/**
 * A sign group: origin on the ground (or the mounting point when post is 0) under the board's centre, text on the +z
 * face (and on the -z face when `back` asks for it). Place it with `group.position.set(x, groundY, z)` and
 * `group.rotation.y = yaw`, then add it to the scene.
 */
export function coastSign(text: string, opts: CoastSignOpts = {}): THREE.Group {
  const w = opts.w ?? 3, h = opts.h ?? 1;
  const bg = opts.bg ?? 0xf2ead8, fg = opts.fg ?? 0x1f3a5f;
  const post = opts.post ?? 0;
  const backText = opts.back ?? post > 0;
  const g = new THREE.Group();
  g.name = 'coast-sign';
  let bm = boardMats.get(bg);
  if (!bm) { bm = new THREE.MeshStandardMaterial({ color: bg, roughness: 0.85 }); boardMats.set(bg, bm); }
  const board = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.08), bm);
  board.position.set(0, post + h / 2, 0);
  board.castShadow = true;
  g.add(board);
  if (post > 0) {
    for (const sx of [-w / 2 + 0.15, w / 2 - 0.15]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, post + h * 0.6, 0.12), postMat);
      p.position.set(sx, (post + h * 0.6) / 2, -0.11);
      p.castShadow = true;
      g.add(p);
    }
  }
  // The board box is 0.08 deep, centred on z 0: its faces are at z +-0.04, so each plate stands 0.01 clear of its face.
  const front = textPlate(text, 0, post + h / 2, 0.04 + 0.01, 0, { w, h, bg, fg });
  g.add(front);
  if (backText !== false) {
    const second = backText === true ? text : backText;
    const back = textPlate(second, 0, post + h / 2, -(0.04 + 0.01), Math.PI, { w, h, bg, fg });
    g.add(back);
  }
  return g;
}
