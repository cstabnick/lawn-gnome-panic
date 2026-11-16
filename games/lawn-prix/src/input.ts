// Keyboard, gamepad and touch controls of the full game, as a KartInput.
import type { KartInput } from './config';

export interface Controls {
  read(): KartInput;
  dispose(): void;
}

const USED_KEYS = new Set([
  'KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight',
  'Space', 'ShiftLeft', 'ShiftRight', 'KeyE',
]);

/** Pixels of left-half drag for a full steer. */
const DRAG_FULL_STEER = 60;
/** Stick deadzone (standard mapping, axis 0). */
const PAD_DEADZONE = 0.15;

interface TouchPoint {
  x0: number;
  x: number;
  left: boolean;
}

interface PadRead {
  steer: number;
  throttle: number;
  drift: boolean;
  item: boolean;
}

/** First connected gamepad with the standard mapping, read now. null when there is none. */
function readPad(): PadRead | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  let pad: Gamepad | null = null;
  for (const p of navigator.getGamepads()) {
    if (p && p.mapping === 'standard') {
      pad = p;
      break;
    }
  }
  if (!pad) return null;
  const b = pad.buttons;
  const pressed = (i: number): boolean => b[i]?.pressed ?? false;
  const value = (i: number): number => b[i]?.value ?? 0;

  const raw = pad.axes[0] ?? 0;
  const mag = Math.abs(raw);
  const axisSteer = mag > PAD_DEADZONE ? Math.sign(raw) * (mag - PAD_DEADZONE) / (1 - PAD_DEADZONE) : 0;
  const dpadSteer = (pressed(15) ? 1 : 0) - (pressed(14) ? 1 : 0);
  const steer = axisSteer !== 0 ? axisSteer : dpadSteer;

  // RT (7) / A (0) accelerate, LT (6) / B (1) brake or reverse.
  const throttle = Math.max(value(7), pressed(0) ? 1 : 0) - Math.max(value(6), pressed(1) ? 1 : 0);
  return {
    steer,
    throttle,
    drift: pressed(5), // R1 / RB
    item: pressed(4) || pressed(2), // L1 / LB or X
  };
}

/** Listens on window (keys, touch) and on the canvas (touch steer and throttle). */
export function createControls(canvas: HTMLCanvasElement, ui: HTMLElement): Controls {
  const keys = new Set<string>();
  const touches = new Map<number, TouchPoint>();
  let touchSeen = false;
  const itemPointers = new Set<number>();

  // On-screen item button, under the shared #ui. The layer ignores the pointer; only the button takes it.
  const itemLayer = document.createElement('div');
  itemLayer.id = 'lp-item-layer';
  itemLayer.style.cssText =
    'position:absolute;right:16px;top:50%;transform:translateY(-50%);pointer-events:none;display:none;';
  const itemBtn = document.createElement('button');
  itemBtn.id = 'lp-item-btn';
  itemBtn.type = 'button';
  itemBtn.textContent = 'ITEM';
  itemBtn.style.cssText = [
    'width:72px', 'height:72px', 'border-radius:50%', 'border:2px solid #fff',
    'background:rgba(20,30,20,0.55)', 'color:#fff', 'font:700 14px system-ui,sans-serif',
    'letter-spacing:1px', 'touch-action:none', 'pointer-events:auto', 'user-select:none',
    '-webkit-user-select:none', 'padding:0',
  ].join(';');
  itemLayer.appendChild(itemBtn);
  ui.appendChild(itemLayer);

  const showItemButton = () => {
    if (touchSeen) return;
    touchSeen = true;
    itemLayer.style.display = 'block';
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (USED_KEYS.has(e.code)) e.preventDefault();
    keys.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (USED_KEYS.has(e.code)) e.preventDefault();
    keys.delete(e.code);
  };
  const onBlur = () => keys.clear();

  const onAnyTouchDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') showItemButton();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    showItemButton();
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

  const onItemDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    itemPointers.add(e.pointerId);
    try { itemBtn.setPointerCapture(e.pointerId); } catch { /* not supported: pointerup may be lost */ }
  };
  const onItemUp = (e: PointerEvent) => {
    itemPointers.delete(e.pointerId);
  };

  try { canvas.style.touchAction = 'none'; } catch { /* ignore */ }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('pointerdown', onAnyTouchDown);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerEnd);
  window.addEventListener('pointercancel', onPointerEnd);
  itemBtn.addEventListener('pointerdown', onItemDown);
  itemBtn.addEventListener('pointerup', onItemUp);
  itemBtn.addEventListener('pointercancel', onItemUp);
  itemBtn.addEventListener('lostpointercapture', onItemUp);

  const has = (...codes: string[]) => codes.some((c) => keys.has(c));

  return {
    read(): KartInput {
      const keyThrottle = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
      const keySteer = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
      const keyDrift = has('Space', 'ShiftLeft', 'ShiftRight');
      const keyItem = has('KeyE');

      const pad = readPad();

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

      // Keyboard wins, then gamepad, then touch: the first source that is non-zero / true is used.
      const padSteer = pad?.steer ?? 0;
      const padThrottle = pad?.throttle ?? 0;
      const steer = keySteer !== 0 ? keySteer : padSteer !== 0 ? padSteer : touchSteer;
      const throttle = keyThrottle !== 0 ? keyThrottle : padThrottle !== 0 ? padThrottle : touchThrottle;
      const drift = keyDrift || (pad?.drift ?? false) || (touches.size >= 2 && steer !== 0);
      const item = keyItem || (pad?.item ?? false) || itemPointers.size > 0;
      return { steer, throttle, drift, item };
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerdown', onAnyTouchDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      itemBtn.removeEventListener('pointerdown', onItemDown);
      itemBtn.removeEventListener('pointerup', onItemUp);
      itemBtn.removeEventListener('pointercancel', onItemUp);
      itemBtn.removeEventListener('lostpointercapture', onItemUp);
      itemLayer.remove();
      keys.clear();
      touches.clear();
      itemPointers.clear();
    },
  };
}
