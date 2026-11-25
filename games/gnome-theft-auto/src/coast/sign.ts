// Painted signs for the coast (E11): a wooden board with text on a canvas texture, front facing +z before `yaw`.
// Used by the boardwalk, the Spokewheel, the Bathtub Queen and the coast life modules. The board is a box (so it never
// lies in another surface's plane); the text is a plane 1 cm proud of its front face on the decal layer.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';

export interface CoastSignOpts {
  /** Board width and height, metres (default 3 x 1). */
  w?: number;
  h?: number;
  /** Board colour, text colour (defaults: sun-bleached white board, dark blue paint). */
  bg?: number;
  fg?: number;
  /** Post height under the board, metres (0 = no post, e.g. a sign fixed to a stall). Default 0. */
  post?: number;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const boardMats = new Map<number, THREE.MeshStandardMaterial>();
const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });

/** A text texture (null without a DOM, e.g. in tests). Lines split on '\n'; the font shrinks to fit. */
function textTexture(text: string, w: number, h: number, bg: number, fg: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const cw = 512;
  const ch = Math.max(1, Math.round((cw * h) / w));
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = hex(bg);
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = hex(fg);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  let size = Math.floor((ch * 0.78) / lines.length);
  while (size > 8) {
    ctx.font = `bold ${size}px sans-serif`;
    if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= cw * 0.9) break;
    size -= 2;
  }
  ctx.font = `bold ${Math.max(8, size)}px sans-serif`;
  const lineH = Math.max(8, size) * 1.15;
  const y0 = ch / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cw / 2, y0 + i * lineH));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/**
 * A sign group: origin on the ground (or the mounting point when post is 0) under the board's centre, text on the +z
 * face. Place it with `group.position.set(x, groundY, z)` and `group.rotation.y = yaw`, then add it to the scene.
 */
export function coastSign(text: string, opts: CoastSignOpts = {}): THREE.Group {
  const w = opts.w ?? 3, h = opts.h ?? 1;
  const bg = opts.bg ?? 0xf2ead8, fg = opts.fg ?? 0x1f3a5f;
  const post = opts.post ?? 0;
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
  const map = textTexture(text, w, h, bg, fg);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    flatLayer(map ? new THREE.MeshBasicMaterial({ map }) : new THREE.MeshBasicMaterial({ color: bg }), LAYER.decal),
  );
  face.position.set(0, post + h / 2, 0.05);
  g.add(face);
  return g;
}
