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

/**
 * A text plate (a name plate, a street sign, a poster) standing vertically, centred at (x, y, z), facing yaw.
 * Drawn on a canvas; in tests (no document) it is a plain coloured plane. Mount it at least 0.03 m in front of any
 * wall it hangs on (no z-fighting: docs/rendering.md); the material also uses a polygon offset.
 */
export function textPlate(
  text: string, x: number, y: number, z: number, yaw: number,
  opts: { w?: number; h?: number; bg?: number; fg?: number } = {},
): THREE.Mesh {
  const w = opts.w ?? 0.6, h = opts.h ?? 0.2;
  const bg = opts.bg ?? 0xd4af37, fg = opts.fg ?? 0x2b2116;
  let map: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const cw = 256, ch = Math.max(16, Math.round((cw * h) / w));
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = hex(bg);
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = hex(fg);
      ctx.lineWidth = Math.max(2, ch * 0.05);
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, cw - ctx.lineWidth * 2, ch - ctx.lineWidth * 2);
      ctx.fillStyle = hex(fg);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = text.split('\n');
      let size = Math.floor((ch * 0.7) / lines.length);
      ctx.font = `bold ${size}px system-ui, sans-serif`;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest > cw * 0.9) {
        size = Math.floor(size * ((cw * 0.9) / widest));
        ctx.font = `bold ${size}px system-ui, sans-serif`;
      }
      lines.forEach((l, i) => ctx.fillText(l, cw / 2, (ch * (i + 0.5)) / lines.length));
      map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
    }
  }
  const mat = new THREE.MeshBasicMaterial({ color: map ? 0xffffff : bg, map, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  mesh.name = 'home-plate';
  return mesh;
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
