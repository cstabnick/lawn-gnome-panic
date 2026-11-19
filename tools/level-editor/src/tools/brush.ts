// The Brush tool: paints the terrain's delta raster with dabs under the pointer. A stroke is one undo step.
import * as THREE from 'three';
import { applyBrush, PatchBuilder, type BrushMode, type BrushOp } from '@lawn/level';
import type { EditorContext, GroundHit, Tool } from '../context';
import { dabPositions, type Pt } from './strokeMath';

const MODE_LABEL: Record<BrushMode, string> = { raise: 'Raise', lower: 'Lower', smooth: 'Smooth', flatten: 'Flatten', noise: 'Noise' };
const MODE_COLOUR: Record<BrushMode, number> = { raise: 0x4ade80, lower: 0xf87171, smooth: 0x60a5fa, flatten: 0xfbbf24, noise: 0xc084fc };
const DEFAULT_STRENGTH: Record<BrushMode, number> = { raise: 0.25, lower: 0.25, smooth: 0.4, flatten: 0.4, noise: 0.3 };
const DEFAULT_RADIUS = 8;
const RADIUS_MIN = 1;
const RADIUS_MAX = 40;
const RING_SEGMENTS = 48;
// Keeps the cursor ring just above the surface so the ground does not hide it.
const RING_LIFT = 0.3;

const PANEL_HTML = `
  <div class="le-modes">
    <button type="button" data-mode="raise">Raise</button>
    <button type="button" data-mode="lower">Lower</button>
    <button type="button" data-mode="smooth">Smooth</button>
    <button type="button" data-mode="flatten">Flatten</button>
    <button type="button" data-mode="noise">Noise</button>
  </div>
  <label>Radius <input type="range" min="1" max="40" step="1" data-k="radius"> <span data-k="radius-out"></span></label>
  <label>Strength <input type="range" min="0.05" max="1" step="0.05" data-k="strength"> <span data-k="strength-out"></span></label>
  <label>Flatten height (m) <input type="number" step="0.1" data-k="height"></label>
  <button type="button" data-k="pick">Pick</button>
  <p class="le-hint">Left-drag paints (Noise roughens). Shift inverts raise/lower. [ and ] change the radius. Alt-click sets the flatten height.</p>
`;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function ringGeometry(radius: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < RING_SEGMENTS; i++) {
    const a = (i / RING_SEGMENTS) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

interface Stroke {
  /** The mode the stroke began in, for the undo label. */
  startMode: BrushMode;
  seed: number;
  builder: PatchBuilder;
  last: Pt;
  /** Metres walked since the last dab. */
  carry: number;
}

export const brushTool: Tool = makeBrushTool();

function makeBrushTool(): Tool {
  let ctx: EditorContext;
  let mode: BrushMode = 'raise';
  let radius = DEFAULT_RADIUS;
  // One stored strength per mode, so each mode keeps its own slider position.
  const strength: Record<BrushMode, number> = { ...DEFAULT_STRENGTH };
  let flattenHeight = 0;
  let picking = false;
  let stroke: Stroke | null = null;
  let ring: THREE.LineLoop | null = null;

  // Panel controls, looked up once in mount().
  let modeButtons: HTMLButtonElement[] = [];
  let radiusInput: HTMLInputElement;
  let radiusOut: HTMLElement;
  let strengthInput: HTMLInputElement;
  let strengthOut: HTMLElement;
  let heightInput: HTMLInputElement;
  let pickButton: HTMLButtonElement;

  // Shift swaps raise and lower only; smooth and flatten have no opposite.
  const effectiveMode = (shift: boolean): BrushMode => {
    if (!shift) return mode;
    if (mode === 'raise') return 'lower';
    if (mode === 'lower') return 'raise';
    return mode;
  };

  // Dab spacing scales with the radius, with a floor so tiny brushes do not place a dab every pixel.
  const spacing = (): number => Math.max(0.5, radius * 0.25);

  const ringColour = (m: BrushMode): void => {
    if (ring) (ring.material as THREE.LineBasicMaterial).color.setHex(MODE_COLOUR[m]);
  };

  const rebuildRing = (): void => {
    if (!ring) return;
    ring.geometry.dispose();
    ring.geometry = ringGeometry(radius);
  };

  const announceMode = (): void => ctx.status(`${MODE_LABEL[mode]} brush, radius ${radius} m`);

  function setRadius(r: number, announce = true): void {
    const v = clamp(Math.round(r), RADIUS_MIN, RADIUS_MAX);
    if (v === radius && announce) return;
    radius = v;
    radiusInput.value = String(v);
    radiusOut.textContent = `${v} m`;
    rebuildRing();
    if (announce) announceMode();
  }

  function setMode(m: BrushMode, announce = true): void {
    mode = m;
    for (const b of modeButtons) b.classList.toggle('on', b.dataset.mode === m);
    strengthInput.value = String(strength[m]);
    strengthOut.textContent = strength[m].toFixed(2);
    ringColour(m);
    if (announce) announceMode();
  }

  function setFlatten(h: number): void {
    flattenHeight = Math.round(h * 100) / 100;
    heightInput.value = String(flattenHeight);
  }

  function setPicking(on: boolean): void {
    picking = on;
    pickButton.classList.toggle('on', on);
  }

  // One dab: applies it to the raster now (so the next dab's heightAt sees it) and records it in the stroke.
  function dab(p: Pt, m: BrushMode): void {
    if (!stroke) return;
    const op: BrushOp = { mode: m, x: p.x, z: p.z, radius, strength: strength[mode], target: flattenHeight, seed: stroke.seed };
    stroke.builder.add(applyBrush(ctx.deltas, op, ctx.terrain.heightAt));
    ctx.touch({ minX: p.x - radius - 2, maxX: p.x + radius + 2, minZ: p.z - radius - 2, maxZ: p.z + radius + 2 });
  }

  function endStroke(): void {
    if (!stroke) return;
    const s = stroke;
    stroke = null;
    const patch = s.builder.build();
    const rect = s.builder.bounds();
    ctx.status(`Painted ${patch.ix.length} vertices`);
    if (patch.ix.length > 0 && rect) ctx.commitDeltas(`Brush ${s.startMode}`, patch, rect, true);
  }

  function moveRing(hit: GroundHit | null, shift: boolean): void {
    if (!ring) return;
    if (!hit) {
      ring.visible = false;
      return;
    }
    ring.visible = true;
    ring.position.set(hit.x, hit.y + RING_LIFT, hit.z);
    ringColour(effectiveMode(shift));
  }

  const onDown = (ev: PointerEvent): void => {
    if (ev.button !== 0) return;
    const hit = ctx.viewport.pick(ev);
    if (!hit) return;
    // Alt-click and the Pick button read a height and paint nothing.
    if (picking || ev.altKey) {
      setFlatten(hit.y);
      setPicking(false);
      ctx.status(`Flatten height ${flattenHeight.toFixed(2)} m`);
      return;
    }
    ctx.viewport.dom.setPointerCapture(ev.pointerId);
    const m = effectiveMode(ev.shiftKey);
    const first = dabPositions(null, hit, spacing(), 0);
    stroke = { startMode: m, seed: Math.floor(Math.random() * 1e9), builder: new PatchBuilder(), last: { x: hit.x, z: hit.z }, carry: first.carry };
    for (const p of first.points) dab(p, m);
  };

  const onMove = (ev: PointerEvent): void => {
    const hit = ctx.viewport.pick(ev);
    moveRing(hit, ev.shiftKey);
    if (!stroke || !hit) return;
    const r = dabPositions(stroke.last, hit, spacing(), stroke.carry);
    stroke.carry = r.carry;
    stroke.last = { x: hit.x, z: hit.z };
    const m = effectiveMode(ev.shiftKey);
    for (const p of r.points) dab(p, m);
  };

  const onLeave = (): void => {
    if (ring) ring.visible = false;
  };

  const onUp = (): void => endStroke();

  const onKey = (ev: KeyboardEvent): void => {
    const t = ev.target;
    // Typing in a panel field must not change the radius.
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return;
    if (ev.key !== '[' && ev.key !== ']') return;
    ev.preventDefault();
    setRadius(radius + (ev.key === ']' ? 1 : -1));
  };

  return {
    id: 'brush',
    label: 'Brush',
    mount(c, panel) {
      ctx = c;
      panel.innerHTML = PANEL_HTML;
      const q = <T extends Element>(sel: string): T => {
        const el = panel.querySelector<T>(sel);
        if (!el) throw new Error(`brush panel: missing ${sel}`);
        return el;
      };
      modeButtons = [...panel.querySelectorAll<HTMLButtonElement>('button[data-mode]')];
      radiusInput = q<HTMLInputElement>('input[data-k="radius"]');
      radiusOut = q<HTMLElement>('[data-k="radius-out"]');
      strengthInput = q<HTMLInputElement>('input[data-k="strength"]');
      strengthOut = q<HTMLElement>('[data-k="strength-out"]');
      heightInput = q<HTMLInputElement>('input[data-k="height"]');
      pickButton = q<HTMLButtonElement>('button[data-k="pick"]');

      for (const b of modeButtons) b.addEventListener('click', () => setMode(b.dataset.mode as BrushMode));
      radiusInput.addEventListener('input', () => setRadius(Number(radiusInput.value)));
      strengthInput.addEventListener('input', () => {
        strength[mode] = Number(strengthInput.value);
        strengthOut.textContent = strength[mode].toFixed(2);
      });
      heightInput.addEventListener('input', () => {
        const v = Number(heightInput.value);
        if (Number.isFinite(v)) flattenHeight = v;
      });
      pickButton.addEventListener('click', () => {
        setPicking(!picking);
        if (picking) ctx.status('Click the terrain to take its height.');
      });

      setRadius(radius, false);
      setMode(mode, false);
      setFlatten(flattenHeight);
    },
    activate() {
      const dom = ctx.viewport.dom;
      ring = new THREE.LineLoop(
        ringGeometry(radius),
        new THREE.LineBasicMaterial({ color: MODE_COLOUR[mode], depthTest: false }),
      );
      ring.renderOrder = 11;
      ring.visible = false;
      ctx.viewport.overlay.add(ring);
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('keydown', onKey);
    },
    deactivate() {
      endStroke();
      const dom = ctx.viewport.dom;
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      if (ring) {
        ctx.viewport.overlay.remove(ring);
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
        ring = null;
      }
    },
  };
}
