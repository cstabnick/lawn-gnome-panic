// Building blocks for the home builders (E10): stand @lawn/prefabs pieces on the ground with colliders, door plates
// with text, and windows that light up at night. Builders (homes/build*.ts, homes/saucerCourt.ts) list HomePiece rows
// and call buildPieces; nothing here knows about any one home.
import * as THREE from 'three';
import { buildPrefab, getPrefab, type StaticPrefabPlacement, type Swatch } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { heightAt } from '../terrain';
import type { Box } from '../types';

/** One prefab stood in the world. */
export interface HomePiece {
  prefab: string;
  x: number;
  z: number;
  /** Radians, 0 faces +z. */
  yaw: number;
  /** Uniform scale (default 1), or `size`: scale so the longest side is this many metres. */
  scale?: number;
  size?: number;
  /** Add a box collider from its bounds (default true for anything taller than 0.5 m). */
  solid?: boolean;
  /** Lift above the ground (a parcel on a step), metres. */
  y?: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
}

const measured = new Map<string, THREE.Box3>();

/** Local bounds of a prefab (lights off), measured once per id. */
export function prefabBox(id: string): THREE.Box3 {
  let b = measured.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    measured.set(id, b);
  }
  return b;
}

function scaleOf(p: HomePiece): number {
  if (p.scale !== undefined) return p.scale;
  if (p.size === undefined) return 1;
  const b = prefabBox(p.prefab);
  const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  return longest > 0 ? p.size / longest : 1;
}

export interface PiecePlan {
  placements: StaticPrefabPlacement[];
  boxes: Box[];
  /** Prefab ids not in the catalogue (the piece is skipped). */
  missing: string[];
}

/** Placements and colliders for a list of pieces (pure apart from reading terrain heights). */
export function planPieces(pieces: readonly HomePiece[]): PiecePlan {
  const placements: StaticPrefabPlacement[] = [];
  const boxes: Box[] = [];
  const missing = new Set<string>();
  for (const p of pieces) {
    if (!getPrefab(p.prefab)) { missing.add(p.prefab); continue; }
    const lb = prefabBox(p.prefab);
    const s = scaleOf(p);
    const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const corners: [number, number][] = [];
    for (const lx of [lb.min.x, lb.max.x]) {
      for (const lz of [lb.min.z, lb.max.z]) {
        const x = p.x + (lx * c + lz * sn) * s;
        const z = p.z + (-lx * sn + lz * c) * s;
        corners.push([x, z]);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }
    const ground = Math.min(...[...corners, [p.x, p.z] as [number, number]].map(([x, z]) => heightAt(x, z)));
    const y = ground + (p.y ?? 0) - (p.y === undefined ? 0.03 : 0);
    const pl: StaticPrefabPlacement = { id: p.prefab, x: p.x, y, z: p.z, yaw: p.yaw, scale: s };
    if (p.tint !== undefined) pl.tint = p.tint;
    if (p.trim !== undefined) pl.trim = p.trim;
    placements.push(pl);
    const h = (lb.max.y - Math.min(0, lb.min.y)) * s;
    if (p.solid ?? h > 0.5) boxes.push({ minX, maxX, minZ, maxZ, h: y + lb.max.y * s });
  }
  return { placements, boxes, missing: [...missing] };
}

/** Build the pieces as one culled static batch under `name`; returns their colliders (push them into world.boxes). */
export function buildPieces(scene: THREE.Scene, pieces: readonly HomePiece[], name: string): Box[] {
  const plan = planPieces(pieces);
  if (plan.missing.length) console.warn(`${name}: missing prefabs: ${plan.missing.join(', ')}`);
  if (plan.placements.length) scene.add(buildStaticCells(plan.placements, { lights: false, name, cls: 'building' }));
  return plan.boxes;
}

// ---- Door plates (canvas text on a small plane) ----------------------------------------------------------------------

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

/** Smallest glyph (canvas px at a 512 px wide cell; scaled for other widths): legible at 6 m on a 390 px phone (D58). */
export const PLATE_MIN_PX = 18;
const PLATE_FONT = 'system-ui, sans-serif';
/** Line height as a multiple of the font size. */
const LINE_H = 1.15;

/** Canvas width for a plate `w` metres wide holding `text` (D58: 512 over 1.5 m, 1024 over 3 m; long text never 256). */
export function plateCanvasWidth(w: number, text: string): number {
  if (w > 3) return 1024;
  if (w > 1.5) return 512;
  return text.replace(/\n/g, ' ').length > 18 || w > 0.8 ? 512 : 256;
}

export interface PlateLayout {
  /** Canvas size, px. */
  cw: number;
  ch: number;
  /** Font size, px. */
  px: number;
  /** The rows drawn, top to bottom (words wrapped to the plate's aspect; each `\n` starts a new row). */
  lines: string[];
  /** false when even the minimum size does not fit (the text is drawn at the minimum and may be clipped). */
  fits: boolean;
}

/** Words of `text` wrapped into rows no wider than `max` px (`measure(s)` is the width of s at the current font). */
export function wrapWords(text: string, max: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${word}` : word;
      if (line && measure(t) > max) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/**
 * Pure plate layout: the biggest font that fits the words, wrapped to the plate's aspect, inside a w x h metre plate.
 * `measure(s, px)` is the width of s in canvas px at font size px (a canvas in the game, a fixed char width in tests).
 */
export function layoutPlate(text: string, w: number, h: number, measure: (s: string, px: number) => number): PlateLayout {
  const cw = plateCanvasWidth(w, text);
  const ch = Math.max(16, Math.round((cw * h) / w));
  const minPx = Math.max(8, Math.round((PLATE_MIN_PX * cw) / 512));
  const border = Math.max(2, ch * 0.05);
  const innerW = cw - border * 4, innerH = ch - border * 3;
  for (let px = Math.max(minPx, Math.floor(innerH * 0.8)); px >= minPx; px--) {
    const lines = wrapWords(text, innerW, (s) => measure(s, px));
    const wide = Math.max(...lines.map((l) => measure(l, px)));
    if (lines.length * px * LINE_H <= innerH && wide <= innerW) return { cw, ch, px, lines, fits: true };
  }
  return { cw, ch, px: minPx, lines: wrapWords(text, innerW, (s) => measure(s, minPx)), fits: false };
}

const plateTextures = new Map<string, THREE.CanvasTexture>();

/** The plate's canvas texture, cached by text, size and colours (null without a document: tests). */
function plateTexture(text: string, w: number, h: number, bg: number, fg: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `${text}|${w.toFixed(3)}|${h.toFixed(3)}|${bg}|${fg}`;
  const hit = plateTextures.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = (px: number): string => `bold ${px}px ${PLATE_FONT}`;
  const lay = layoutPlate(text, w, h, (s, px) => { ctx.font = font(px); return ctx.measureText(s).width; });
  if (!lay.fits) console.warn(`textPlate: "${text.slice(0, 40)}" does not fit a ${w} x ${h} m plate at the minimum size`);
  const { cw, ch, px, lines } = lay;
  canvas.width = cw; canvas.height = ch;
  ctx.fillStyle = hex(bg);
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = hex(fg);
  ctx.lineWidth = Math.max(2, ch * 0.05);
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, cw - ctx.lineWidth * 2, ch - ctx.lineWidth * 2);
  ctx.fillStyle = hex(fg);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(px);
  const total = lines.length * px * LINE_H;
  lines.forEach((l, i) => ctx.fillText(l, cw / 2, ch / 2 - total / 2 + px * LINE_H * (i + 0.5)));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  plateTextures.set(key, map);
  return map;
}

export interface TextPlateOpts {
  w?: number;
  h?: number;
  bg?: number;
  fg?: number;
  /** Print the reverse face too (a free-standing plate, D58): true repeats the front text, a string is a second joke. */
  back?: string | boolean;
  /** A wooden backing box behind the plate (a plate on a post, not on a board): its colour, or true for wood. */
  backing?: number | boolean;
}

const BACKING_DEPTH = 0.04;

function plateFace(text: string, w: number, h: number, bg: number, fg: number): THREE.Mesh {
  const map = plateTexture(text, w, h, bg, fg);
  const mat = new THREE.MeshBasicMaterial({ color: map ? 0xffffff : bg, map, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/**
 * A text plate (a name plate, a street sign, a poster) standing vertically, centred at (x, y, z), facing yaw.
 * Drawn on a canvas; in tests (no document) it is a plain coloured plane. Mount it at least 0.03 m in front of any
 * wall it hangs on (no z-fighting: docs/rendering.md); the material also uses a polygon offset. Words wrap to the
 * plate's aspect and the canvas grows with the plate (layoutPlate), so long jokes stay legible. `back` prints the
 * reverse face too; `backing` puts a wooden box between the faces.
 */
export function textPlate(text: string, x: number, y: number, z: number, yaw: number, opts: TextPlateOpts = {}): THREE.Mesh {
  const w = opts.w ?? 0.6, h = opts.h ?? 0.2;
  const bg = opts.bg ?? 0xd4af37, fg = opts.fg ?? 0x2b2116;
  const mesh = plateFace(text, w, h, bg, fg);
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  mesh.name = 'home-plate';
  const backed = opts.backing !== undefined && opts.backing !== false;
  if (backed) {
    const colour = typeof opts.backing === 'number' ? opts.backing : 0x6b4f32;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.06, h + 0.06, BACKING_DEPTH),
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.9 }),
    );
    // The box's faces stand 0.02 m clear of both plates (no shared plane).
    box.position.z = -0.02 - BACKING_DEPTH / 2;
    box.name = 'home-plate-backing';
    mesh.add(box);
  }
  if (opts.back !== undefined && opts.back !== false) {
    const rev = plateFace(typeof opts.back === 'string' ? opts.back : text, w, h, bg, fg);
    rev.rotation.y = Math.PI;
    rev.position.z = backed ? -(0.04 + BACKING_DEPTH) : -0.02;
    rev.name = 'home-plate-back';
    mesh.add(rev);
  }
  return mesh;
}

// ---- Sign boards (D58: plates seated on their board, both faces printed) ---------------------------------------------

/** The blank face of a board prefab, prefab-local metres at scale 1: size, centre height, front and back face depth. */
export interface BoardFace { w: number; h: number; y: number; front: number; back: number }

/** Board prefabs a sign can be printed on, measured from their parts (packages/prefabs/src/catalog). */
export const BOARD_FACES: Readonly<Record<string, BoardFace>> = {
  // gta-golf-nine-props.ts: board 1.9 x 1.0 x 0.06 at y 1.4.
  'garden-sign': { w: 1.9, h: 1.0, y: 1.4, front: 0.03, back: -0.03 },
  // dayg.ts: board 1.4 x 1.0 x 0.05 at y 1.5, z 0.06; the pinned sheets stand 0.105 out, so the plate goes over them.
  'notice-board': { w: 1.4, h: 1.0, y: 1.5, front: 0.11, back: 0.035 },
  // gta-underspan.ts: hoarding 6 x 1.9 x 0.2 at y 1.45.
  'manifesto-board': { w: 6, h: 1.9, y: 1.45, front: 0.1, back: -0.1 },
  // gta-euro-street-b.ts: paper face 1.2 x 1.6 x 0.02 at y 1.4, z 0.06; the frame's back is at z 0.01.
  'euro-poster-board': { w: 1.2, h: 1.6, y: 1.4, front: 0.07, back: 0.01 },
};

/** Gap between a board face and the plate printed on it, metres (plus the plate's polygon offset). */
const BOARD_GAP = 0.02;

export interface SignBoardOpts {
  /** Front text (+z of the board, facing the approach). */
  front: string;
  /** Back text, a second joke; omitted repeats the front (every free-standing board prints both faces). */
  back?: string;
  /** false for a board against a wall: only the front is printed. Default true. */
  twoSided?: boolean;
  x: number;
  z: number;
  yaw: number;
  /** Board prefab id, a key of BOARD_FACES. Default 'garden-sign'. */
  board?: string;
  /** Plate size, metres. Default: the board face less a margin. A plate larger than the face scales the board up. */
  w?: number;
  h?: number;
  /** Uniform board scale (default 1, or what w/h need). */
  scale?: number;
  bg?: number;
  fg?: number;
  /** Board tint (prefabs with a tint slot, e.g. garden-sign). */
  tint?: number;
}

export interface SignBoard {
  /** The board, for the caller's buildPieces list (one static batch with its neighbours, plus its collider). */
  piece: HomePiece;
  /** The printed plates (front, and back unless twoSided is false), positioned in world space: add to the scene. */
  plates: THREE.Group;
}

/**
 * A free-standing sign (D58): a board prefab with its text printed flush on the face (BOARD_FACES), on both faces.
 * The board comes back as a HomePiece so the caller batches it with its neighbours; the plates are a group.
 */
export function signBoard(o: SignBoardOpts): SignBoard {
  const id = o.board ?? 'garden-sign';
  const face = BOARD_FACES[id];
  if (!face) throw new Error(`signBoard: no BOARD_FACES entry for ${id}`);
  let s = o.scale ?? 1;
  if (o.scale === undefined && (o.w !== undefined || o.h !== undefined)) {
    s = Math.max(1, (o.w ?? 0) / (face.w * 0.94), (o.h ?? 0) / (face.h * 0.9));
  }
  const w = o.w ?? face.w * 0.94 * s, h = o.h ?? face.h * 0.9 * s;
  const piece: HomePiece = { prefab: id, x: o.x, z: o.z, yaw: o.yaw, scale: s };
  if (o.tint !== undefined) piece.tint = o.tint;
  // planPieces stands the board 0.03 m into the lowest ground under it; the plates follow the same base.
  const base = planPieces([piece]).placements[0]?.y ?? heightAt(o.x, o.z);
  const plates = new THREE.Group();
  plates.name = `sign-board:${id}`;
  plates.position.set(o.x, base + face.y * s, o.z);
  plates.rotation.y = o.yaw;
  const opts: TextPlateOpts = { w, h, bg: o.bg, fg: o.fg };
  plates.add(textPlate(o.front, 0, 0, face.front * s + BOARD_GAP, 0, opts));
  if (o.twoSided ?? true) plates.add(textPlate(o.back ?? o.front, 0, 0, face.back * s - BOARD_GAP, Math.PI, opts));
  return { piece, plates };
}

// ---- Windows lit at night --------------------------------------------------------------------------------------------

const windowMats: THREE.MeshBasicMaterial[] = [];
const DAY = new THREE.Color(0x3b4a5a);
const NIGHT = new THREE.Color(0xffc46b);

/**
 * A window pane (w x h, centre at x, y, z, facing yaw) that is dark glass by day and warm yellow at night
 * (updateHomeWindows). `alwaysDark` panes stay dark (an empty flat). Mount 0.03 m in front of the wall.
 */
export function litWindow(x: number, y: number, z: number, yaw: number, w = 1.2, h = 1.0): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color: DAY.clone(), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  windowMats.push(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  mesh.name = 'home-window';
  return mesh;
}

/** Every frame (app.ts): tint every lit window by the night factor (0 day .. 1 night). */
export function updateHomeWindows(night: number): void {
  const t = Math.min(1, Math.max(0, (night - 0.35) / 0.4));
  for (const m of windowMats) m.color.copy(DAY).lerp(NIGHT, t);
}
