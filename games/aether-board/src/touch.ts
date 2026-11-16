// Touch controls for phones and tablets. Hidden until the first touch.
// - Left thumb (left 45 % of the screen): a floating joystick where you put your thumb. Carve / push / brake on the
//   ground, spin / flip in the air (the same as A/D and W/S).
// - Right thumb (the rest): the trick pad, the same springy stick as the mouse. Swipe down then up = ollie, down then
//   up-left = kickflip, up-right = heelflip, sideways = shove-its, and so on; swipes in the air = flip tricks.
//   A tap pops a small ollie; press, hold still and let go for a big one.
// - Buttons above the right thumb: BOOST and two GRABs (hold), and a small reset (↺) at the top.
import { PALETTE } from './config';

export interface TouchState {
  steer: number;
  lean: number;
  stick: { x: number; y: number };
  jump: boolean;
  grab: 0 | 1 | 2;
  boost: boolean;
  respawn: boolean;
}

export interface TouchControls {
  /** A touch has been seen (show the controls, treat this as a touch device). */
  readonly active: boolean;
  /** performance.now() of the last touch event (to ignore the mouse events browsers synthesize from touches). */
  readonly lastTouchAt: number;
  read(dt: number): TouchState;
  /** True once after the 📖 button was tapped. */
  consumeBook(): boolean;
  /** Called synchronously inside every touchend (a user gesture: audio may start there, iOS needs that). */
  onGesture(fn: () => void): void;
}

const JOY_R = 62;          // px: joystick throw
const JOY_DEAD = 0.12;
const PAD_R = 70;          // px: trick-pad swipe for a full stick
const PAD_SPRING = 18;     // 1/s: the trick stick returns to centre after you lift
const TAP_MOVE = 14;       // px
const HOLD_S = 0.18;       // held still longer than this: charging a big ollie until you lift
const JUMP_PULSE_S = 0.1;

const CSS = `
#ab-touch{position:fixed;inset:0;pointer-events:none;z-index:3;display:none;-webkit-user-select:none;user-select:none}
#ab-touch.on{display:block}
body:not([data-state="playing"]) #ab-touch .btn,body:not([data-state="playing"]) #ab-touch .hint{display:none}
#ab-touch .zone{position:absolute;top:64px;bottom:0;pointer-events:auto;touch-action:none}
#ab-touch .zl{left:0;width:45%}
#ab-touch .zr{right:0;width:55%}
#ab-touch .ring{position:absolute;width:${JOY_R * 2}px;height:${JOY_R * 2}px;margin:-${JOY_R}px 0 0 -${JOY_R}px;border-radius:50%;
  border:3px solid rgba(255,255,255,.55);background:rgba(23,7,46,.18);display:none;pointer-events:none}
#ab-touch .knob{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
  background:rgba(45,226,230,.75);border:3px solid #17072e;display:none;pointer-events:none}
#ab-touch .swipe{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
  background:rgba(255,63,164,.7);border:3px solid #17072e;display:none;pointer-events:none}
#ab-touch .hint{position:absolute;bottom:calc(64px + env(safe-area-inset-bottom));font:900 italic 13px "Arial Black",Impact,system-ui,sans-serif;color:rgba(255,255,255,.7);
  text-shadow:2px 2px 0 #17072e;pointer-events:none;transform:skewX(-10deg);animation:abHintOut .8s 8s forwards}
@keyframes abHintOut{to{opacity:0}}
#ab-touch .hl{left:18px}
#ab-touch .hr{right:18px;text-align:right}
#ab-touch .btn{position:absolute;pointer-events:auto;touch-action:none;border-radius:50%;border:3px solid #17072e;
  display:flex;align-items:center;justify-content:center;font:900 italic 13px "Arial Black",Impact,system-ui,sans-serif;
  color:#17072e;box-shadow:3px 3px 0 #17072e;opacity:.85}
#ab-touch .btn.down{transform:translate(2px,2px);box-shadow:1px 1px 0 #17072e;opacity:1}
#ab-touch .boost{width:78px;height:78px;right:calc(18px + env(safe-area-inset-right));bottom:calc(150px + env(safe-area-inset-bottom));background:${css(PALETTE.pink)}}
#ab-touch .g1{width:58px;height:58px;right:calc(108px + env(safe-area-inset-right));bottom:calc(170px + env(safe-area-inset-bottom));background:${css(PALETTE.yellow)}}
#ab-touch .g2{width:58px;height:58px;right:calc(54px + env(safe-area-inset-right));bottom:calc(240px + env(safe-area-inset-bottom));background:${css(PALETTE.lime)}}
#ab-touch .book{width:44px;height:44px;right:calc(64px + env(safe-area-inset-right));top:calc(58px + env(safe-area-inset-top));background:#fff;font-size:20px;font-style:normal}
body:not([data-state="title"]) #ab-touch .book{display:flex!important}
#ab-touch .reset{width:44px;height:44px;right:calc(12px + env(safe-area-inset-right));top:calc(58px + env(safe-area-inset-top));background:${css(PALETTE.lilac)};font-size:20px}
@media (max-height:420px){
  #ab-touch .boost{bottom:calc(96px + env(safe-area-inset-bottom))}
  #ab-touch .g1{bottom:calc(110px + env(safe-area-inset-bottom))}
  #ab-touch .g2{bottom:calc(170px + env(safe-area-inset-bottom))}
}
`;

function css(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

export function createTouch(parent: HTMLElement): TouchControls {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'ab-touch';
  parent.appendChild(root);
  const el = (cls: string, text = ''): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    root.appendChild(d);
    return d;
  };
  const zl = el('zone zl');
  const zr = el('zone zr');
  const ring = el('ring');
  const knob = el('knob');
  const swipe = el('swipe');
  el('hint hl', 'STEER');
  el('hint hr', 'SWIPE TRICKS · TAP OLLIE');
  const bBoost = el('btn boost', 'BOOST');
  const bG1 = el('btn g1', 'GRAB');
  const bG2 = el('btn g2', 'GRAB');
  const bReset = el('btn reset', '↺');
  const bBook = el('btn book', '📖');
  let book = false;
  bBook.addEventListener('touchstart', (e) => {
    e.preventDefault();
    seen();
    book = true;
  }, { passive: false });

  // Phones and tablets show the controls from the start (the title card teaches them).
  let active = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (active) root.classList.add('on');
  let lastTouchAt = 0;
  const gesture: (() => void)[] = [];

  // Joystick (one touch).
  let joyId: number | null = null;
  let joyX = 0;
  let joyY = 0;
  const joy = { x: 0, y: 0 };
  // Trick pad (one touch).
  let padId: number | null = null;
  let padX = 0;
  let padY = 0;
  let padT0 = 0;
  let padMoved = 0;
  const stick = { x: 0, y: 0 };
  let padHeld = false; // finger down on the pad
  let charging = false; // held still: jump held until lift
  let jumpPulse = 0;    // seconds left of a tap's jump press
  // Buttons.
  const held = new Map<number, 'boost' | 'g1' | 'g2'>();
  let respawn = false;

  const now = (): number => performance.now();
  const seen = (): void => {
    lastTouchAt = now();
    if (!active) {
      active = true;
      root.classList.add('on');
    }
  };

  const place = (d: HTMLElement, x: number, y: number): void => {
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
  };

  zl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    seen();
    const t = e.changedTouches[0];
    if (joyId !== null || !t) return;
    joyId = t.identifier;
    joyX = t.clientX;
    joyY = t.clientY;
    joy.x = 0;
    joy.y = 0;
    place(ring, joyX, joyY);
    place(knob, joyX, joyY);
    ring.style.display = knob.style.display = 'block';
  }, { passive: false });

  zr.addEventListener('touchstart', (e) => {
    e.preventDefault();
    seen();
    const t = e.changedTouches[0];
    if (padId !== null || !t) return;
    padId = t.identifier;
    padX = t.clientX;
    padY = t.clientY;
    padT0 = now();
    padMoved = 0;
    padHeld = true;
    charging = false;
    place(swipe, padX, padY);
    swipe.style.display = 'block';
  }, { passive: false });

  const buttons: [HTMLElement, 'boost' | 'g1' | 'g2' | 'reset'][] = [[bBoost, 'boost'], [bG1, 'g1'], [bG2, 'g2'], [bReset, 'reset']];
  for (const [b, kind] of buttons) {
    b.addEventListener('touchstart', (e) => {
      e.preventDefault();
      seen();
      b.classList.add('down');
      for (const t of Array.from(e.changedTouches)) {
        if (kind === 'reset') respawn = true;
        else held.set(t.identifier, kind);
      }
    }, { passive: false });
  }

  window.addEventListener('touchmove', (e) => {
    seen();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === joyId) {
        let dx = (t.clientX - joyX) / JOY_R;
        let dy = (t.clientY - joyY) / JOY_R;
        const m = Math.hypot(dx, dy);
        if (m > 1) {
          // Drag the base along so the stick never feels stuck at the rim.
          joyX += (dx / m) * (m - 1) * JOY_R;
          joyY += (dy / m) * (m - 1) * JOY_R;
          dx /= m;
          dy /= m;
          place(ring, joyX, joyY);
        }
        const k = m < JOY_DEAD ? 0 : 1;
        joy.x = dx * k;
        joy.y = -dy * k;
        place(knob, joyX + dx * JOY_R, joyY + dy * JOY_R);
      } else if (t.identifier === padId) {
        const dx = (t.clientX - padX) / PAD_R;
        const dy = (t.clientY - padY) / PAD_R;
        padMoved = Math.max(padMoved, Math.hypot(t.clientX - padX, t.clientY - padY));
        const m = Math.hypot(dx, dy);
        stick.x = m > 1 ? dx / m : dx;
        stick.y = -(m > 1 ? dy / m : dy);
        place(swipe, padX + stick.x * PAD_R, padY - stick.y * PAD_R);
      }
    }
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  const end = (e: TouchEvent): void => {
    seen();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === joyId) {
        joyId = null;
        joy.x = joy.y = 0;
        ring.style.display = knob.style.display = 'none';
      } else if (t.identifier === padId) {
        padId = null;
        padHeld = false;
        swipe.style.display = 'none';
        // A still touch always pops: if it was charging, lifting releases the charge (a big ollie); otherwise a tap
        // pulse (a small one), however long it lasted.
        if (padMoved < TAP_MOVE && !charging) jumpPulse = JUMP_PULSE_S;
        charging = false;
      }
      held.delete(t.identifier);
    }
    for (const [b, kind] of buttons) {
      if (kind === 'reset' || ![...held.values()].includes(kind)) b.classList.remove('down');
    }
    for (const fn of gesture) fn();
  };
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', end);
  // No pinch zoom, double-tap zoom or page bounce while playing.
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

  return {
    get active() {
      return active;
    },
    get lastTouchAt() {
      return lastTouchAt;
    },
    consumeBook() {
      const b = book;
      book = false;
      return b;
    },
    onGesture(fn) {
      gesture.push(fn);
    },
    read(dt) {
      // A still press on the pad becomes a held jump (charge) until lift.
      // Once charging, stay charged until the finger lifts: a thumb that rests and then swipes must not release the
      // charge (that would pop a plain ollie before the swipe becomes a trick).
      if (padHeld && !charging && padMoved < TAP_MOVE && (now() - padT0) / 1000 > HOLD_S) charging = true;
      if (!padHeld) {
        const k = Math.exp(-PAD_SPRING * dt);
        stick.x *= k;
        stick.y *= k;
      }
      const jump = charging || jumpPulse > 0;
      jumpPulse = Math.max(0, jumpPulse - dt);
      const kinds = [...held.values()];
      const r = respawn;
      respawn = false;
      return {
        steer: joy.x,
        lean: joy.y,
        stick: { x: stick.x, y: stick.y },
        jump,
        grab: kinds.includes('g1') ? 1 : kinds.includes('g2') ? 2 : 0,
        boost: kinds.includes('boost'),
        respawn: r,
      };
    },
  };
}
