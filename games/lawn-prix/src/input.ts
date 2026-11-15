// Keyboard and touch controls of the full game, as a KartInput.
import type { KartInput } from './config';

export interface Controls {
  read(): KartInput;
  dispose(): void;
}

const USED_KEYS = new Set([
  'KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight',
  'Space', 'ShiftLeft', 'ShiftRight',
]);

/** Pixels of left-half drag for a full steer. */
const DRAG_FULL_STEER = 60;

interface TouchPoint {
  x0: number;
  x: number;
  left: boolean;
}

/** Listens on window (keys) and on the canvas (touch). */
export function createControls(canvas: HTMLCanvasElement, ui: HTMLElement): Controls {
  void ui; // STUB: Epic 2 adds an on-screen item button here
  const keys = new Set<string>();
  const touches = new Map<number, TouchPoint>();
  let touchSeen = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (USED_KEYS.has(e.code)) e.preventDefault();
    keys.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (USED_KEYS.has(e.code)) e.preventDefault();
    keys.delete(e.code);
  };
  const onBlur = () => keys.clear();

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touchSeen = true;
    const rect = canvas.getBoundingClientRect();
    const left = e.clientX < rect.left + rect.width / 2;
    touches.set(e.pointerId, { x0: e.clientX, x: e.clientX, left });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported: moves outside still reach window */ }
  };
  const onPointerMove = (e: PointerEvent) => {
    const p = touches.get(e.pointerId);
    if (p) p.x = e.clientX;
  };
  const onPointerEnd = (e: PointerEvent) => {
    touches.delete(e.pointerId);
  };

  try { canvas.style.touchAction = 'none'; } catch { /* ignore */ }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerEnd);
  window.addEventListener('pointercancel', onPointerEnd);

  const has = (...codes: string[]) => codes.some((c) => keys.has(c));

  return {
    read(): KartInput {
      const keyThrottle = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
      const keySteer = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
      const keyDrift = has('Space', 'ShiftLeft', 'ShiftRight');

      let touchSteer = 0;
      let touchThrottle = 0;
      let leftDown = false;
      let rightDown = false;
      for (const p of touches.values()) {
        if (p.left) {
          if (!leftDown) touchSteer = Math.max(-1, Math.min(1, (p.x - p.x0) / DRAG_FULL_STEER));
          leftDown = true;
        } else {
          rightDown = true;
        }
      }
      if (rightDown || (touchSeen && leftDown)) touchThrottle = 1;

      const steer = keySteer !== 0 ? keySteer : touchSteer;
      const throttle = keyThrottle !== 0 ? keyThrottle : touchThrottle;
      const drift = keyDrift || (touches.size >= 2 && steer !== 0);
      return { steer, throttle, drift, item: false };
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      keys.clear();
      touches.clear();
    },
  };
}
