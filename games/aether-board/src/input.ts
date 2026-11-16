// Keyboard + mouse (pointer lock, the mouse is a springy virtual right stick) and gamepad, read once per frame.
import type { Input } from './config';

export interface InputSource {
  /** Sample once per rendered frame. `respawn` is true only on the frame R / pad Y was pressed. */
  read(dt: number): Input;
  /** Pointer lock is active (the mouse drives the trick stick). */
  readonly locked: boolean;
  requestLock(): void;
  /** What the player last used: keyboard+mouse or a gamepad. */
  readonly device: 'kbm' | 'pad';
  /** True once after the player asked to start or resume (a click that took pointer lock, or pad A / Start). */
  consumeStart(): boolean;
}

const SENS = 1 / 90;          // mouse pixels to stick units
const STICK_SPRING = 14;      // 1/s, how fast the mouse stick returns to centre
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
  let device: 'kbm' | 'pad' = 'kbm';
  const mouse = { x: 0, y: 0 };
  let prevBtn: boolean[] = [];

  const setKbm = (): void => { device = 'kbm'; };

  window.addEventListener('keydown', (e) => {
    if (PREVENT_KEYS.has(e.code)) e.preventDefault();
    setKbm();
    if (e.repeat) return;
    held.add(e.code);
    if (e.code === 'KeyR') respawnKey = true;
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
    setKbm();
    if (e.button === 0) lmb = true;
    if (e.button === 2) rmb = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) lmb = false;
    if (e.button === 2) rmb = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) startFlag = true;
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
      const edge = (i: number): boolean => cur[i] && !prevBtn[i];
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
      const padRespawn = edge(3);

      // combine
      const steer = pick(keySteer, padSteer);
      const lean = pick(keyLean, padLean);
      let stick: { x: number; y: number };
      if (padStickMag > PAD_STICK_MIN) {
        stick = padStick;
      } else {
        stick = clampDisc(mouse.x + arrow.x, mouse.y + arrow.y);
      }
      const g1 = kG1 || btn(6) || val(6) > 0.5;
      const g2 = kG2 || btn(7) || val(7) > 0.5;

      return {
        steer,
        lean,
        stick: { x: stick.x, y: stick.y },
        jump: kJump || btn(0),
        grab: g1 ? 1 : g2 ? 2 : 0,
        boost: kBoost || btn(5),
        respawn: kRespawn || padRespawn,
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
    get device(): 'kbm' | 'pad' {
      return device;
    },
    consumeStart(): boolean {
      const s = startFlag;
      startFlag = false;
      return s;
    },
  };
}
