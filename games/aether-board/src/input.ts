// Keyboard + mouse (pointer lock, the mouse is a springy virtual right stick), gamepad and touch (touch.ts),
// read once per frame.
import type { Input } from './config';
import { createTouch } from './touch';

export type Device = 'kbm' | 'pad' | 'touch';

export interface InputSource {
  /** Sample once per rendered frame. `respawn` is true only on the frame R / pad Y was pressed. */
  read(dt: number): Input;
  /** Pointer lock is active (the mouse drives the trick stick). */
  readonly locked: boolean;
  requestLock(): void;
  /** What the player last used: keyboard+mouse, a gamepad or touch. */
  readonly device: Device;
  /** True once after the player asked to start or resume (a click that took pointer lock, pad A / Start, a tap). */
  consumeStart(): boolean;
  /** fn runs synchronously inside every click, key press and touch end (user gestures: start audio there). */
  onGesture(fn: () => void): void;
  /** True once after the player asked for the trick book (T / Tab, pad View, the touch 📖 button). */
  consumeBook(): boolean;
  /** True once after the player left pointer lock (Esc): pause. Nothing else pauses (a gamepad player may never lock). */
  consumePause(): boolean;
}

const SENS = 1 / 90;          // mouse pixels to stick units
const STICK_SPRING = 9;       // 1/s, how fast the mouse stick returns to centre
const PAD_DEAD = 0.15;        // radial stick deadzone
const PAD_STICK_MIN = 0.2;    // pad stick above this wins over the mouse / arrows

const PREVENT_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

/** Radial deadzone, rescaled so just past the deadzone is near 0; result stays in the unit disc. */
function radial(x: number, y: number): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m <= PAD_DEAD) return { x: 0, y: 0 };
  const k = Math.min(1, (m - PAD_DEAD) / (1 - PAD_DEAD)) / m;
  return { x: x * k, y: y * k };
}

function clampDisc(x: number, y: number): { x: number; y: number } {
  const m = Math.hypot(x, y);
  return m > 1 ? { x: x / m, y: y / m } : { x, y };
}

/** The one with the bigger magnitude; a tie keeps `a`. */
function pick(a: number, b: number): number {
  return Math.abs(b) > Math.abs(a) ? b : a;
}

function firstStandardPad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  for (const g of navigator.getGamepads()) {
    if (g && g.connected && g.mapping === 'standard') return g;
  }
  return null;
}

export function createInput(canvas: HTMLCanvasElement): InputSource {
  const held = new Set<string>();
  let lmb = false;
  let rmb = false;
  let respawnKey = false;   // R pressed since the last read
  let startFlag = false;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let device: Device = coarse ? 'touch' : 'kbm';
  const touch = createTouch(document.getElementById('ui') ?? document.body);
  const gestures: (() => void)[] = [];
  const fireGesture = (): void => {
    for (const fn of gestures) fn();
  };
  touch.onGesture(() => {
    device = 'touch';
    startFlag = true;
    fireGesture();
  });
  /** Browsers fire fake mouse events after a touch: ignore them for a moment. */
  const fromTouch = (): boolean => performance.now() - touch.lastTouchAt < 1200;
  const mouse = { x: 0, y: 0 };
  let prevBtn: boolean[] = [];

  const setKbm = (): void => {
    if (!fromTouch()) device = 'kbm';
  };

  window.addEventListener('keydown', (e) => {
    if (PREVENT_KEYS.has(e.code)) e.preventDefault();
    setKbm();
    if (e.repeat) return;
    held.add(e.code);
    if (e.code === 'KeyR') respawnKey = true;
    if (e.code === 'KeyT' || e.code === 'Tab') bookFlag = true;
    if (e.code === 'Enter') startFlag = true;
    fireGesture();
  });
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
  });
  window.addEventListener('mousemove', (e) => {
    setKbm();
    if (document.pointerLockElement !== canvas) return;
    const c = clampDisc(mouse.x + e.movementX * SENS, mouse.y - e.movementY * SENS);
    mouse.x = c.x;
    mouse.y = c.y;
  });
  window.addEventListener('mousedown', (e) => {
    if (fromTouch()) return;
    setKbm();
    fireGesture();
    if (e.button === 0) lmb = true;
    if (e.button === 2) rmb = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) lmb = false;
    if (e.button === 2) rmb = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  let pauseFlag = false;
  let bookFlag = false;
  let hadLock = false;
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      startFlag = true;
      hadLock = true;
    } else if (hadLock) {
      hadLock = false;
      pauseFlag = true;
    }
  });
  window.addEventListener('blur', () => {
    held.clear();
    lmb = false;
    rmb = false;
    mouse.x = 0;
    mouse.y = 0;
  });

  return {
    read(dt: number): Input {
      // mouse stick springs back to centre
      const k = Math.exp(-STICK_SPRING * dt);
      mouse.x *= k;
      mouse.y *= k;

      // keyboard
      const key = (code: string): boolean => held.has(code);
      const keySteer = (key('KeyD') || key('ArrowRight') ? 1 : 0) - (key('KeyA') || key('ArrowLeft') ? 1 : 0);
      const keyLean = (key('KeyW') ? 1 : 0) - (key('KeyS') ? 1 : 0);
      const arrowX = (key('ArrowRight') ? 1 : 0) - (key('ArrowLeft') ? 1 : 0);
      const arrowY = (key('ArrowUp') ? 1 : 0) - (key('ArrowDown') ? 1 : 0);
      const arrow = clampDisc(arrowX, arrowY);
      const kJump = key('Space');
      const kBoost = key('ShiftLeft') || key('ShiftRight');
      const kG1 = key('KeyQ') || lmb;
      const kG2 = key('KeyE') || rmb;
      const kRespawn = respawnKey;
      respawnKey = false;

      // gamepad
      const pad = firstStandardPad();
      const btn = (i: number): boolean => pad?.buttons[i]?.pressed ?? false;
      const val = (i: number): number => pad?.buttons[i]?.value ?? 0;
      const cur: boolean[] = [];
      for (let i = 0; i < 17; i++) cur[i] = btn(i);
      const prev = prevBtn; // capture before replacing it: an edge is pressed now and not on the last read
      const edge = (i: number): boolean => cur[i] && !prev[i];
      prevBtn = cur;

      const ls = radial(pad?.axes[0] ?? 0, pad?.axes[1] ?? 0);
      const rs = radial(pad?.axes[2] ?? 0, pad?.axes[3] ?? 0);
      const dpadX = (btn(15) ? 1 : 0) - (btn(14) ? 1 : 0);
      const dpadY = (btn(12) ? 1 : 0) - (btn(13) ? 1 : 0);
      const padSteer = pick(ls.x, dpadX);
      const padLean = btn(1) ? -1 : pick(-ls.y, dpadY);
      const padStick = { x: rs.x, y: -rs.y };
      const padStickMag = Math.hypot(padStick.x, padStick.y);

      // device: whichever input was used last
      const padActive = ls.x !== 0 || ls.y !== 0 || rs.x !== 0 || rs.y !== 0 || cur.some((b) => b);
      if (padActive) device = 'pad';

      // start and respawn edges from the pad
      if (edge(0) || edge(9)) startFlag = true;
      if (edge(8)) bookFlag = true;
      const padRespawn = edge(3);

      // touch
      const t = touch.read(dt);
      const touchStickMag = Math.hypot(t.stick.x, t.stick.y);

      // combine
      const steer = pick(pick(keySteer, padSteer), t.steer);
      const lean = pick(pick(keyLean, padLean), t.lean);
      let stick: { x: number; y: number };
      if (padStickMag > PAD_STICK_MIN) {
        stick = padStick;
      } else if (touchStickMag > 0.02) {
        stick = t.stick;
      } else {
        stick = clampDisc(mouse.x + arrow.x, mouse.y + arrow.y);
      }
      const g1 = kG1 || btn(6) || val(6) > 0.5 || t.grab === 1;
      const g2 = kG2 || btn(7) || val(7) > 0.5 || t.grab === 2;

      return {
        steer,
        lean,
        stick: { x: stick.x, y: stick.y },
        jump: kJump || btn(0) || t.jump,
        grab: g1 ? 1 : g2 ? 2 : 0,
        boost: kBoost || btn(5) || t.boost,
        respawn: kRespawn || padRespawn || t.respawn,
      };
    },
    get locked(): boolean {
      return document.pointerLockElement === canvas;
    },
    requestLock(): void {
      try {
        void Promise.resolve(canvas.requestPointerLock() as unknown).catch(() => {});
      } catch {
        // some browsers refuse without a user gesture
      }
    },
    get device(): Device {
      return device;
    },
    onGesture(fn: () => void): void {
      gestures.push(fn);
    },
    consumeBook(): boolean {
      const s = bookFlag || touch.consumeBook();
      bookFlag = false;
      return s;
    },
    consumePause(): boolean {
      const s = pauseFlag;
      pauseFlag = false;
      return s;
    },
    consumeStart(): boolean {
      const s = startFlag;
      startFlag = false;
      return s;
    },
  };
}
