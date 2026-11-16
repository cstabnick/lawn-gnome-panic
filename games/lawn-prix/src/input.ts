// Keyboard, gamepad and touch controls of the full game, as a KartInput.
// Touch: a steering stick on the left half (drag anywhere there), GAS / BRAKE / DRIFT / ITEM buttons on the right.
import type { KartInput } from './config';

export interface Controls {
  read(): KartInput;
  /** Show the on-screen touch controls (only once a touch device is seen). The game turns them on while racing. */
  setVisible(visible: boolean): void;
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

const STICK_BASE_PX = 132;
const STICK_KNOB_PX = 60;

const CSS = `
#lp-touch { position: absolute; inset: 0; pointer-events: none; display: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
#lp-touch.lp-on { display: block; }
.lp-stick { position: absolute; left: calc(24px + env(safe-area-inset-left, 0px)); bottom: 24px; width: ${STICK_BASE_PX}px; height: ${STICK_BASE_PX}px; box-sizing: border-box; border-radius: 50%; border: 2px solid rgba(255,255,255,.7); background: rgba(20,30,20,.3); opacity: .6; transition: opacity .1s; }
.lp-stick.lp-active { opacity: 1; transform: translate(-50%, 50%); }
.lp-stick::before, .lp-stick::after { position: absolute; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,.8); font: 900 18px system-ui, sans-serif; }
.lp-stick::before { content: '\\25C0'; left: 10px; }
.lp-stick::after { content: '\\25B6'; right: 10px; }
.lp-knob { position: absolute; left: 50%; top: 50%; width: ${STICK_KNOB_PX}px; height: ${STICK_KNOB_PX}px; margin: -${STICK_KNOB_PX / 2}px 0 0 -${STICK_KNOB_PX / 2}px; border-radius: 50%; background: rgba(255,255,255,.75); box-shadow: 0 2px 6px rgba(0,0,0,.35); }
.lp-stick-label { position: absolute; left: 0; right: 0; bottom: -18px; text-align: center; font: 800 11px system-ui, sans-serif; letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
.lp-stick.lp-active .lp-stick-label { display: none; }
.lp-btn { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 64px; height: 64px; padding: 0; border-radius: 50%; border: 2px solid #fff; color: #fff; font: 800 12px system-ui, sans-serif; letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,.6); touch-action: none; pointer-events: auto; user-select: none; -webkit-user-select: none; transition: transform .05s, filter .05s; }
.lp-btn.lp-pressed { transform: scale(.9); filter: brightness(1.4); }
.lp-gas { width: 88px; height: 88px; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: 116px; background: rgba(40,160,60,.7); font-size: 14px; }
.lp-brake { right: calc(116px + env(safe-area-inset-right, 0px)); bottom: 20px; background: rgba(200,50,40,.65); }
.lp-drift { right: calc(120px + env(safe-area-inset-right, 0px)); bottom: 108px; background: rgba(230,180,30,.75); color: #222; text-shadow: none; }
.lp-item { right: calc(28px + env(safe-area-inset-right, 0px)); bottom: 212px; background: rgba(20,30,20,.55); }
`;

function injectStyle(): void {
  if (document.getElementById('lp-touch-style')) return;
  const style = document.createElement('style');
  style.id = 'lp-touch-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

interface TouchPoint {
  x0: number;
  y0: number;
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

/** A held on-screen button: pressed while any pointer is down on it. */
interface HoldButton {
  el: HTMLButtonElement;
  readonly down: boolean;
  dispose(): void;
}

function holdButton(parent: HTMLElement, id: string, cls: string, label: string): HoldButton {
  const el = document.createElement('button');
  el.id = id;
  el.type = 'button';
  el.className = `lp-btn ${cls}`;
  el.textContent = label;
  parent.appendChild(el);
  const pointers = new Set<number>();
  const sync = () => el.classList.toggle('lp-pressed', pointers.size > 0);
  const onDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pointers.add(e.pointerId);
    try { el.setPointerCapture(e.pointerId); } catch { /* not supported: pointerup may be lost */ }
    sync();
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    sync();
  };
  const noMenu = (e: Event) => e.preventDefault();
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('lostpointercapture', onUp);
  el.addEventListener('contextmenu', noMenu);
  return {
    el,
    get down() { return pointers.size > 0; },
    dispose() {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('lostpointercapture', onUp);
      el.removeEventListener('contextmenu', noMenu);
      pointers.clear();
      el.remove();
    },
  };
}

/** Listens on window (keys, touch) and on the canvas (touch steer and throttle). */
export function createControls(canvas: HTMLCanvasElement, ui: HTMLElement): Controls {
  const keys = new Set<string>();
  const touches = new Map<number, TouchPoint>();
  let touchSeen = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let visible = false;

  // On-screen controls, under the shared #ui. The layer ignores the pointer; only the buttons take it,
  // so the left half still reaches the canvas for steering.
  injectStyle();
  const layer = document.createElement('div');
  layer.id = 'lp-touch';
  const stick = document.createElement('div');
  stick.className = 'lp-stick';
  const knob = document.createElement('div');
  knob.className = 'lp-knob';
  const stickLabel = document.createElement('div');
  stickLabel.className = 'lp-stick-label';
  stickLabel.textContent = 'STEER';
  stick.append(knob, stickLabel);
  layer.appendChild(stick);
  const gasBtn = holdButton(layer, 'lp-gas-btn', 'lp-gas', 'GAS');
  const brakeBtn = holdButton(layer, 'lp-brake-btn', 'lp-brake', 'BRAKE');
  const driftBtn = holdButton(layer, 'lp-drift-btn', 'lp-drift', 'DRIFT');
  const itemBtn = holdButton(layer, 'lp-item-btn', 'lp-item', 'ITEM');
  ui.appendChild(layer);

  const syncLayer = () => layer.classList.toggle('lp-on', touchSeen && visible);
  syncLayer();

  /** The steering touch (first left-half one), or null. */
  const steerTouch = (): TouchPoint | null => {
    for (const p of touches.values()) if (p.left) return p;
    return null;
  };
  const steerOf = (p: TouchPoint) => Math.max(-1, Math.min(1, (p.x - p.x0) / DRAG_FULL_STEER));

  /** Moves the stick to the steering touch and the knob to its steer; back to rest when there is none. */
  const syncStick = () => {
    const p = steerTouch();
    if (!p) {
      stick.classList.remove('lp-active');
      stick.style.left = '';
      stick.style.bottom = '';
      knob.style.transform = '';
      return;
    }
    const rect = ui.getBoundingClientRect();
    stick.classList.add('lp-active');
    stick.style.left = `${p.x0 - rect.left}px`;
    stick.style.bottom = `${rect.bottom - p.y0}px`;
    knob.style.transform = `translateX(${steerOf(p) * (STICK_BASE_PX - STICK_KNOB_PX) / 2}px)`;
  };

  const noteTouch = () => {
    if (touchSeen) return;
    touchSeen = true;
    syncLayer();
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
    if (e.pointerType === 'touch') noteTouch();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    noteTouch();
    const rect = canvas.getBoundingClientRect();
    const left = e.clientX < rect.left + rect.width / 2;
    touches.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, left });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not supported: moves outside still reach window */ }
    syncStick();
  };
  const onPointerMove = (e: PointerEvent) => {
    const p = touches.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    if (p.left) syncStick();
  };
  const onPointerEnd = (e: PointerEvent) => {
    if (touches.delete(e.pointerId)) syncStick();
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

  const has = (...codes: string[]) => codes.some((c) => keys.has(c));

  return {
    read(): KartInput {
      const keyThrottle = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
      const keySteer = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
      const keyDrift = has('Space', 'ShiftLeft', 'ShiftRight');
      const keyItem = has('KeyE');

      const pad = readPad();

      // Touch: steering (or a right-half tap, or GAS) drives forward; BRAKE wins over all of them.
      const st = steerTouch();
      const touchSteer = st ? steerOf(st) : 0;
      let rightDown = false;
      for (const p of touches.values()) if (!p.left) rightDown = true;
      const touchThrottle = brakeBtn.down ? -1 : gasBtn.down || rightDown || st ? 1 : 0;

      // Keyboard wins, then gamepad, then touch: the first source that is non-zero / true is used.
      const padSteer = pad?.steer ?? 0;
      const padThrottle = pad?.throttle ?? 0;
      const steer = keySteer !== 0 ? keySteer : padSteer !== 0 ? padSteer : touchSteer;
      const throttle = keyThrottle !== 0 ? keyThrottle : padThrottle !== 0 ? padThrottle : touchThrottle;
      const drift = keyDrift || (pad?.drift ?? false) || driftBtn.down;
      const item = keyItem || (pad?.item ?? false) || itemBtn.down;
      return { steer, throttle, drift, item };
    },
    setVisible(v: boolean) {
      if (v === visible) return;
      visible = v;
      syncLayer();
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
      for (const b of [gasBtn, brakeBtn, driftBtn, itemBtn]) b.dispose();
      layer.remove();
      keys.clear();
      touches.clear();
    },
  };
}
