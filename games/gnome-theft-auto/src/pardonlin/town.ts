// Pardonlin, built (E30): every district plan (plans.ts) turned into merged prefab cells, colliders and sign text, and
// the European traffic zone switched on over the town. world.ts calls buildPardonlinTown once, after the Wickets.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import { flatLayer } from '@lawn/depth';
import { buildStaticCells, registerCull, STATIC_CELL } from '../cull';
import { setEuroZone } from '../euroRides';
import { euroBuilding } from '../eurokit/catalog';
import { SIGN_FACE } from '../eurokit/signs';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { boundsOf, cornersOf, insideEuroYard } from './layout';
import { buildingFootprint, propFootprint, type PlanSign } from './plan';
import { pardonlinPlans } from './plans';
import { buildPardonlinGround } from './ground';
import { plateCanvasWidth } from '../homes/pieces';

const SIGN_PREFAB = { menu: 'euro-chalkboard-sign', poster: 'euro-poster-board', street: 'euro-street-sign' } as const;

/** Lowest ground under a footprint's corners (so nothing floats on the swell). */
function groundUnder(corners: [number, number][]): number {
  let y = Infinity;
  for (const [x, z] of corners) y = Math.min(y, heightAt(x, z));
  return y;
}

/** Build the whole town into the scene and push its colliders. */
export function buildPardonlinTown(scene: THREE.Scene, boxes: Box[]): void {
  setEuroZone(insideEuroYard);
  const out: StaticPrefabPlacement[] = [];
  const signs: PlanSign[] = [];
  for (const plan of pardonlinPlans()) {
    for (const b of plan.buildings) {
      const f = buildingFootprint(b);
      if (!f) continue;
      out.push({ id: b.id, x: b.x, y: groundUnder(cornersOf(f)), z: b.z, yaw: b.yaw, scale: b.scale, tint: b.tint, trim: b.trim });
      // The collider is the body only (the apron is walkable: awnings, steps, tables are props on the pavement).
      const body = bodyBox(b.x, b.z, b.yaw, b.id, b.scale ?? 1);
      if (body) boxes.push(body);
    }
    for (const p of plan.props) {
      const y = heightAt(p.x, p.z) + (p.y ?? 0);
      out.push({ id: p.id, x: p.x, y, z: p.z, yaw: p.yaw ?? 0, rot: p.rot, scale: p.scale, tint: p.tint, trim: p.trim });
      const f = propFootprint(p);
      if (f && p.solid) {
        const r = boundsOf(f);
        boxes.push('r' in p.solid
          ? { ...r, h: heightAt(p.x, p.z) + p.solid.h, shape: 'round' }
          : { ...r, h: heightAt(p.x, p.z) + p.solid.h });
      }
    }
    for (const s of plan.signs) {
      if (s.kind === 'menu' || s.kind === 'poster' || s.kind === 'street') {
        out.push({ id: SIGN_PREFAB[s.kind], x: s.x, y: heightAt(s.x, s.z), z: s.z, yaw: s.yaw });
      }
      signs.push(s);
    }
  }
  scene.add(buildStaticCells(out, { lights: false, name: 'pardonlin-town' }));
  scene.add(buildPardonlinGround(pardonlinPlans().flatMap((p) => p.ground)));
  if (signs.length) scene.add(buildSignText(signs));
}

/** A building's body collider (footprint without the apron), height from the catalog. */
function bodyBox(x: number, z: number, yaw: number, id: string, scale: number): Box | null {
  const b = euroBuilding(id);
  if (!b) return null;
  const f = { x, z, w: b.width * scale, d: b.depth * scale, yaw };
  const r = boundsOf(f);
  // Box.h is a top height in world y (the ground under the building plus its height).
  return { ...r, h: groundUnder(cornersOf(f)) + b.height * scale };
}

// ---- Sign text --------------------------------------------------------------------------------------------------
const ATLAS = 2048;
const GUTTER = 2;

const STYLE: Record<PlanSign['kind'], { bg: string; ink: string; font: string; border?: string }> = {
  menu: { bg: '#262b27', ink: '#f2f0e6', font: 'italic 600 {px}px "Segoe Print", "Comic Sans MS", cursive' },
  poster: { bg: '#f3ead2', ink: '#2a2420', font: '700 {px}px Georgia, "Times New Roman", serif', border: '#b3322c' },
  street: { bg: '#1f4f8f', ink: '#ffffff', font: '700 {px}px "Trebuchet MS", Arial, sans-serif', border: '#e9eef5' },
  plaque: { bg: '#cbb489', ink: '#3a2c18', font: '700 {px}px Georgia, "Times New Roman", serif', border: '#6e5532' },
  banner: { bg: '#7a1f2b', ink: '#f6e7b0', font: '700 {px}px Georgia, "Times New Roman", serif', border: '#f6e7b0' },
};

/** Size (w, h) of a sign's text plate and its centre in the sign's local frame. */
function plate(s: PlanSign): { w: number; h: number; cx: number; cy: number; cz: number } {
  if (s.kind === 'menu' || s.kind === 'poster' || s.kind === 'street') {
    const f = SIGN_FACE[SIGN_PREFAB[s.kind]];
    return { w: f.width, h: f.height, cx: f.centre[0], cy: f.centre[1], cz: f.centre[2] + 0.07 };
  }
  // Plates hang a little proud of the point the plan gives (plans put it 0.05 off the wall), clear of mouldings.
  return { w: s.w ?? 1.6, h: s.h ?? 0.5, cx: 0, cy: s.y ?? 2.6, cz: 0.06 };
}

/** Words wrapped into lines no wider than `max` px. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const t = line ? `${line} ${word}` : word;
      if (ctx.measureText(t).width > max && line) { lines.push(line); line = word; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

/** Paint one sign into its cell: the plate fills a (pw x ph) px rectangle at the cell's top-left. */
function paint(ctx: CanvasRenderingContext2D, s: PlanSign, ox: number, oy: number, pw: number, ph: number): void {
  const st = STYLE[s.kind];
  ctx.fillStyle = st.bg;
  ctx.fillRect(ox, oy, pw, ph);
  if (st.border) {
    ctx.strokeStyle = st.border;
    ctx.lineWidth = Math.max(3, Math.min(pw, ph) * 0.04);
    ctx.strokeRect(ox + ctx.lineWidth, oy + ctx.lineWidth, pw - ctx.lineWidth * 2, ph - ctx.lineWidth * 2);
  }
  const pad = Math.min(pw, ph) * 0.1;
  let px = Math.floor(ph * 0.42);
  let lines: string[] = [];
  const minPx = Math.max(8, Math.round((18 * pw) / 512));
  for (; px >= minPx; px -= 2) {
    ctx.font = st.font.replace('{px}', String(px));
    lines = wrap(ctx, s.text, pw - pad * 2);
    const wide = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * px * 1.15 <= ph - pad * 2 && wide <= pw - pad * 2) break;
  }
  ctx.fillStyle = st.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const total = lines.length * px * 1.15;
  lines.forEach((l, i) => ctx.fillText(l, ox + pw / 2, oy + ph / 2 - total / 2 + px * 1.15 * (i + 0.5)));
}

/**
 * Every sign's text on canvas atlases (64 plates each), as planes just in front of the sign faces, merged per atlas and
 * per culling cell, drawn on the decal layer and culled as details.
 */
export function buildSignText(signs: readonly PlanSign[]): THREE.Group {
  const root = new THREE.Group();
  root.name = 'pardonlin-sign-text';
  root.userData.cullCells = true;
  // Cell width from the plate's width and text, height from its aspect (capped at 1024 px), shelf-packed per atlas.
  interface Item { s: PlanSign; p: ReturnType<typeof plate>; pw: number; ph: number; ox: number; oy: number }
  const atlases: Item[][] = [];
  let cur: Item[] = [];
  let sx = 0, sy = 0, shelf = 0;
  for (const s of signs) {
    const p = plate(s);
    let pw = plateCanvasWidth(p.w, s.text);
    let ph = Math.round((pw * p.h) / p.w);
    if (ph > 1024) { pw = Math.round((pw * 1024) / ph); ph = 1024; }
    if (sx > 0 && sx + pw > ATLAS) { sy += shelf + GUTTER; sx = 0; shelf = 0; }
    if (sy + ph > ATLAS) { atlases.push(cur); cur = []; sx = 0; sy = 0; shelf = 0; }
    cur.push({ s, p, pw, ph, ox: sx, oy: sy });
    sx += pw + GUTTER;
    shelf = Math.max(shelf, ph);
  }
  if (cur.length) atlases.push(cur);
  for (let a = 0; a < atlases.length; a++) {
    const batch = atlases[a];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ATLAS;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    const cells = new Map<string, THREE.BufferGeometry[]>();
    for (const { s, p, pw, ph, ox, oy } of batch) {
      paint(ctx, s, ox, oy, pw, ph);
      const u0 = ox / ATLAS, u1 = (ox + pw) / ATLAS;
      const v1 = 1 - oy / ATLAS, v0 = 1 - (oy + ph) / ATLAS;
      const base = new THREE.Matrix4()
        .makeTranslation(s.x, heightAt(s.x, s.z), s.z)
        .multiply(new THREE.Matrix4().makeRotationY(s.yaw));
      // Each face is a plane on the same atlas cell; `local` places it in the sign's frame.
      const face = (local: THREE.Matrix4): void => {
        const g = new THREE.PlaneGeometry(p.w, p.h);
        const uv = g.getAttribute('uv') as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) ? u1 : u0, uv.getY(k) ? v1 : v0);
        g.applyMatrix4(base.clone().multiply(local));
        const key = `${Math.floor(s.x / STATIC_CELL)},${Math.floor(s.z / STATIC_CELL)}`;
        let list = cells.get(key);
        if (!list) cells.set(key, (list = []));
        list.push(g);
      };
      face(new THREE.Matrix4().makeTranslation(p.cx, p.cy, p.cz));
      const flip = new THREE.Matrix4().makeRotationY(Math.PI);
      if (s.kind === 'poster') {
        // Behind the frame's back (z 0.01), so it never shares a plane with it.
        face(new THREE.Matrix4().makeTranslation(p.cx, p.cy, 0).multiply(flip));
      } else if (s.kind === 'menu') {
        // On the A-frame's back board (tilted +12 deg about x, outer face 0.02 m off), reading from behind.
        face(
          new THREE.Matrix4()
            .makeTranslation(0, 0.62, -0.04 - 0.015 - 0.02)
            .multiply(new THREE.Matrix4().makeRotationX((12 * Math.PI) / 180))
            .multiply(flip),
        );
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = flatLayer(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), 'decal');
    for (const [key, list] of cells) {
      const merged = mergeGeometries(list);
      for (const g of list) g.dispose();
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = `pardonlin-signs:${a}:${key}`;
      mesh.receiveShadow = true;
      root.add(mesh);
      registerCull(mesh, 'detail', { owned: true });
    }
  }
  return root;
}
