// The shared input pad (keyboard, mouse, touch → PadState).
import type { PadState } from './types';

export interface Pad {
  read(): PadState;
  dispose(): void;
}

const KEY_X: Record<string, number> = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
const KEY_Y: Record<string, number> = { KeyW: 1, ArrowUp: 1, KeyS: -1, ArrowDown: -1 };
const KEY_A = new Set(['Space', 'Enter', 'NumpadEnter']);
/** Drag distance in CSS px that maps to a full stick deflection. */
const DRAG_PX = 60;

function clamp1(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function inTextField(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}

export function createPad(canvas: HTMLCanvasElement): Pad {
  const held = new Set<string>();
  let ptr: { x: number; y: number; down: boolean } | null = null;
  let down = false;
  let downX = 0;
  let downY = 0;
  let dragX = 0;
  let dragY = 0;
  let prevA = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (inTextField(e.target)) return;
    if (!(e.code in KEY_X) && !(e.code in KEY_Y) && !KEY_A.has(e.code)) return;
    held.add(e.code);
    e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    held.delete(e.code);
  };
  const onBlur = () => {
    held.clear();
  };

  const updatePointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const w = r.width || 1;
    const h = r.height || 1;
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    ptr = { x: (cx / w) * 2 - 1, y: -(cy / h) * 2 + 1, down };
    if (down) {
      dragX = (e.clientX - downX) / DRAG_PX;
      dragY = -(e.clientY - downY) / DRAG_PX;
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    down = true;
    downX = e.clientX;
    downY = e.clientY;
    dragX = 0;
    dragY = 0;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Some synthetic events have no capturable pointer; the drag still works.
    }
    updatePointer(e);
  };
  const onPointerMove = (e: PointerEvent) => updatePointer(e);
  const onPointerUp = (e: PointerEvent) => {
    down = false;
    dragX = 0;
    dragY = 0;
    updatePointer(e);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  return {
    read(): PadState {
      let kx = 0;
      let ky = 0;
      let anyDirKey = false;
      let aKey = false;
      for (const code of held) {
        if (code in KEY_X) {
          kx += KEY_X[code];
          anyDirKey = true;
        }
        if (code in KEY_Y) {
          ky += KEY_Y[code];
          anyDirKey = true;
        }
        if (KEY_A.has(code)) aKey = true;
      }
      let x = clamp1(kx);
      let y = clamp1(ky);
      if (!anyDirKey && down) {
        x = clamp1(dragX);
        y = clamp1(dragY);
      }
      const a = aKey || down;
      const aPressed = a && !prevA;
      prevA = a;
      return { x, y, a, aPressed, pointer: ptr ? { ...ptr } : null };
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      held.clear();
    },
  };
}
