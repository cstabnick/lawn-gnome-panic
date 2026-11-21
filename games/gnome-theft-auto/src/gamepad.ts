// Gamepad (standard layout: Xbox, PlayStation, Switch Pro, Steam Deck, the 2026 Steam Controller via WebHID, most phones' Bluetooth pads) folded into the same
// InputState the keyboard and touch use. Polled once per read(); no events needed except the connect toast.
//
//   On foot / parachute   left stick move, right stick look, A jump, RT or RB fire, X reload, Y enter / steal, LB swap gun
//   Driving               left stick steer, RT gas, LT brake then reverse, A handbrake, RB squirt, Y exit, right stick camera
//   Flying                left stick steer + throttle, RT climb, LT descend, RB fire, Y exit, right stick camera
//   Anywhere              Start opens Options; in it D-pad up / down, A pick, B or Start close
import { firstPad } from '@lawn/gamepad';
import type { CameraMode } from './types';

export interface PadState {
  moveX: number;
  moveY: number;
  lift: number;
  jump: boolean;
  fire: boolean;
  enterExit: boolean;
  switchGun: boolean;
  reload: boolean;
  /** Edge: D-pad right, the radio's dial (driving and flying only). */
  radio: boolean;
  camYaw: number;
  camPitch: number;
  /** True when the pad did anything this frame (a stick, trigger or button), so the game can tell it is the active device. */
  active: boolean;
}

const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, START: 9, UP: 12, DOWN: 13, RIGHT: 15 } as const;
const STICK_DEADZONE = 0.18;
const TRIGGER_DEADZONE = 0.06;
/** Right-stick look speed at full deflection, radians per second. */
const LOOK_YAW = 2.8;
const LOOK_PITCH = 1.8;

const clamp = (v: number, lo = -1, hi = 1): number => Math.max(lo, Math.min(hi, v));

/** Radial deadzone: inside it nothing, outside it re-scaled so the edge of the zone is 0 and full deflection is 1. */
export function stick(x: number, y: number, dead = STICK_DEADZONE): [number, number] {
  const m = Math.hypot(x, y);
  if (m <= dead) return [0, 0];
  const k = Math.min(1, (m - dead) / (1 - dead)) / m;
  return [x * k, y * k];
}

const trigger = (v: number): number => (v <= TRIGGER_DEADZONE ? 0 : clamp((v - TRIGGER_DEADZONE) / (1 - TRIGGER_DEADZONE), 0, 1));

export interface Gamepad3 {
  /** The first connected pad's state for this frame, or null with no pad (or while `blocked`, e.g. a menu has it). */
  read(mode: CameraMode, dt: number, blocked: boolean): PadState | null;
}

export function createGamepad(onConnect?: (id: string) => void): Gamepad3 {
  let prev: boolean[] = [];
  window.addEventListener('gamepadconnected', (e) => onConnect?.((e as GamepadEvent).gamepad.id));

  return {
    read(mode, dt, blocked): PadState | null {
      const p = firstPad();
      if (!p) { prev = []; return null; }
      const down = p.buttons.map((b) => b.pressed || b.value > 0.5);
      const last = prev;
      prev = down;
      const edge = (i: number): boolean => !!down[i] && !last[i];
      const val = (i: number): number => p.buttons[i]?.value ?? 0;
      const startEdge = edge(BTN.START);
      if (blocked) return null;

      const [lx, ly] = stick(p.axes[0] ?? 0, p.axes[1] ?? 0);
      const [rx, ry] = stick(p.axes[2] ?? 0, p.axes[3] ?? 0);
      const rt = trigger(val(BTN.RT));
      const lt = trigger(val(BTN.LT));
      const out: PadState = {
        moveX: lx, moveY: -ly, lift: 0, jump: false, fire: false,
        enterExit: edge(BTN.Y), switchGun: false, reload: edge(BTN.X), radio: false,
        camYaw: -rx * LOOK_YAW * dt, camPitch: ry * LOOK_PITCH * dt, active: false,
      };

      if (mode === 'drive') {
        // Triggers are the pedals; with neither touched, the left stick's up/down still drives (and brakes).
        const pedals = rt - lt;
        out.moveY = Math.abs(pedals) > 0.02 ? pedals : -ly;
        out.lift = down[BTN.A] ? 1 : 0; // handbrake
        out.fire = !!down[BTN.RB];
        out.radio = edge(BTN.RIGHT);
      } else if (mode === 'fly') {
        out.lift = rt - lt;
        out.fire = !!down[BTN.RB];
        out.radio = edge(BTN.RIGHT);
      } else {
        out.jump = edge(BTN.A);
        out.fire = rt > 0.3 || !!down[BTN.RB];
        out.switchGun = edge(BTN.LB);
      }

      if (startEdge) window.dispatchEvent(new Event('gta:options'));
      out.active = out.moveX !== 0 || out.moveY !== 0 || out.lift !== 0 || out.jump || out.fire || out.enterExit || out.reload
        || out.switchGun || out.radio || out.camYaw !== 0 || out.camPitch !== 0 || startEdge;
      return out;
    },
  };
}
