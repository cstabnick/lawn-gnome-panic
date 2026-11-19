// The paint tool: lay a surface (dirt, sand, mud, stone, moss) on the ground with the mouse, or erase it. Painted ground is
// coloured in the game and keeps flora off it. One undo step per stroke; live preview while you drag.
import * as THREE from 'three';
import { PaintPatchBuilder } from '@lawn/level';
import { PAINT_SURFACES } from '@gnomomia/config';
import type { EditorContext, GroundHit, Tool } from '../context';
import { paintDab } from './paintMath';
import { dabPositions } from './strokeMath';

const ERASE = 0;
let ctx: EditorContext;
let surface = PAINT_SURFACES[0].id;
let radius = 4;
let panelEl: HTMLElement;
let ring: THREE.LineLoop | null = null;
let stroke: { builder: PaintPatchBuilder; last: { x: number; z: number }; carry: number; id: number } | null = null;

const colourOf = (id: number): number => (id === ERASE ? 0xffffff : (PAINT_SURFACES.find((s) => s.id === id)?.color ?? 0xffffff));

function ringGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) pts.push(new THREE.Vector3(Math.cos((i / 48) * Math.PI * 2) * radius, 0, Math.sin((i / 48) * Math.PI * 2) * radius));
  return new THREE.BufferGeometry().setFromPoints(pts);
}

function refreshRing(): void {
  if (!ring) return;
  ring.geometry.dispose();
  ring.geometry = ringGeometry();
  (ring.material as THREE.LineBasicMaterial).color.setHex(colourOf(surface));
}

function refreshPanel(): void {
  for (const b of panelEl.querySelectorAll<HTMLButtonElement>('button[data-surface]')) b.classList.toggle('on', Number(b.dataset.surface) === surface);
  const out = panelEl.querySelector('[data-k="radius-out"]');
  if (out) out.textContent = `${radius} m`;
}

function dab(x: number, z: number): void {
  if (!stroke) return;
  stroke.builder.add(paintDab(ctx.paint, x, z, radius, stroke.id));
  ctx.touch({ minX: x - radius - 2, maxX: x + radius + 2, minZ: z - radius - 2, maxZ: z + radius + 2 });
}

function onDown(ev: PointerEvent): void {
  if (ev.button !== 0) return;
  const hit = ctx.viewport.pick(ev);
  if (!hit) return;
  ctx.viewport.dom.setPointerCapture(ev.pointerId);
  // Shift erases whatever surface is selected.
  stroke = { builder: new PaintPatchBuilder(), last: { x: hit.x, z: hit.z }, carry: 0, id: ev.shiftKey ? ERASE : surface };
  dab(hit.x, hit.z);
}

function moveRing(hit: GroundHit | null): void {
  if (!ring) return;
  ring.visible = hit !== null;
  if (hit) ring.position.set(hit.x, hit.y + 0.35, hit.z);
}

function onMove(ev: PointerEvent): void {
  const hit = ctx.viewport.pick(ev);
  moveRing(hit);
  if (!stroke || !hit) return;
  const r = dabPositions(stroke.last, hit, Math.max(0.5, radius * 0.3), stroke.carry);
  stroke.last = { x: hit.x, z: hit.z };
  stroke.carry = r.carry;
  for (const p of r.points) dab(p.x, p.z);
}

function endStroke(): void {
  if (!stroke) return;
  const s = stroke;
  stroke = null;
  const patch = s.builder.build();
  const rect = s.builder.bounds();
  ctx.status(`Painted ${patch.ix.length} cells`);
  if (patch.ix.length > 0 && rect) ctx.commitPaint(s.id === ERASE ? 'Erase paint' : 'Paint ground', patch, rect, true);
}

function onKey(ev: KeyboardEvent): void {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) return;
  if (ev.key === '[') radius = Math.max(1, radius - 1);
  else if (ev.key === ']') radius = Math.min(30, radius + 1);
  else return;
  const slider = panelEl.querySelector<HTMLInputElement>('input[data-k="radius"]');
  if (slider) slider.value = String(radius);
  refreshRing();
  refreshPanel();
}

export const paintTool: Tool = {
  id: 'paint',
  label: 'Paint',
  mount(editor: EditorContext, panel: HTMLElement): void {
    ctx = editor;
    panelEl = panel;
    panel.innerHTML = `
      <h3>Ground</h3>
      <div class="le-modes"></div>
      <label>Radius <input type="range" min="1" max="30" step="1" data-k="radius"> <span data-k="radius-out"></span></label>
      <p class="le-hint">Left-drag paints. Shift-drag erases. [ and ] change the radius. Painted ground is coloured in the game and keeps trees and rocks off it.</p>`;
    const modes = panel.querySelector('.le-modes')!;
    for (const s of PAINT_SURFACES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.surface = String(s.id);
      b.textContent = s.name;
      b.style.borderLeft = `10px solid #${s.color.toString(16).padStart(6, '0')}`;
      b.addEventListener('click', () => { surface = s.id; refreshRing(); refreshPanel(); });
      modes.append(b);
    }
    const eraser = document.createElement('button');
    eraser.type = 'button';
    eraser.dataset.surface = String(ERASE);
    eraser.textContent = 'Erase';
    eraser.addEventListener('click', () => { surface = ERASE; refreshRing(); refreshPanel(); });
    modes.append(eraser);
    const slider = panel.querySelector<HTMLInputElement>('input[data-k="radius"]')!;
    slider.value = String(radius);
    slider.addEventListener('input', () => { radius = Number(slider.value); refreshRing(); refreshPanel(); });
    refreshPanel();
  },
  activate(): void {
    ring = new THREE.LineLoop(ringGeometry(), new THREE.LineBasicMaterial({ color: colourOf(surface), depthTest: false }));
    ring.renderOrder = 11;
    ring.visible = false;
    ctx.viewport.overlay.add(ring);
    ctx.viewport.dom.addEventListener('pointerdown', onDown);
    ctx.viewport.dom.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endStroke);
    window.addEventListener('pointercancel', endStroke);
    window.addEventListener('keydown', onKey);
  },
  deactivate(): void {
    endStroke();
    ctx.viewport.dom.removeEventListener('pointerdown', onDown);
    ctx.viewport.dom.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endStroke);
    window.removeEventListener('pointercancel', endStroke);
    window.removeEventListener('keydown', onKey);
    if (ring) {
      ctx.viewport.overlay.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      ring = null;
    }
  },
};
