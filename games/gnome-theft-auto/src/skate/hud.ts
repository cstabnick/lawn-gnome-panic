// The skateboard HUD (E19 the Gutter Bowls): the running combo, the big landed / bailed word, the line and info strips, and
// the touch buttons OLLIE, FLIP and GRAB. Also the input reader that turns the game's input and those buttons into one
// frame of skateboard control (SkateInput). DOM only, no game logic: the runtime calls setCombo / setLine / setInfo.
import type { ComboView } from '@lawn/trickboard';
import type { InputState } from '../types';
import type { SkateInput } from './types';

/** Touch buttons for the board. The pressed flags are edges: touch() clears them. */
export interface SkateTouch { olliePressed: boolean; flipPressed: boolean; grabHeld: boolean }

export interface SkateHud {
  show(on: boolean): void;
  /** now = board clock, for fading `last` after ~1.5 s. */
  setCombo(v: ComboView, now: number): void;
  /** e.g. 'First Push  gate 2/3  12.4 s'; null hides. */
  setLine(text: string | null): void;
  /** e.g. '18 km/h  best combo 2,450'. */
  setInfo(text: string): void;
  /** The touch buttons' state; the pressed flags are cleared by the read. */
  touch(): SkateTouch;
  dispose(): void;
}

const FONT = 'font-family:system-ui,sans-serif;';
const SHADOW = 'text-shadow:0 1px 2px #000;';
const PANEL = 'background:rgba(10,30,20,0.72);color:#f3e9d2;' + SHADOW + 'border-radius:10px;';
const ABS = 'position:absolute;';
const BTN = 'pointer-events:auto;touch-action:none;box-sizing:border-box;min-width:44px;min-height:44px;padding:0 10px;'
  + 'border-radius:50%;border:2px solid rgba(255,255,255,0.7);background:rgba(10,30,20,0.6);color:#fff;' + SHADOW
  + 'font:700 14px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;';

/** The combo's link bar is full at this many seconds left (ComboView.linkLeft). */
const LINK_FULL_S = 1.4;
/** The big landed / bailed word: fully shown for BANK_HOLD_S seconds, then fades over BANK_FADE_S. */
const BANK_HOLD_S = 1.1;
const BANK_FADE_S = 0.4;
/** Trick names kept in the combo panel. */
const LINES_SHOWN = 4;

function div(css: string, text = ''): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = css;
  d.textContent = text;
  return d;
}

/** Keeps a touch on a HUD control from reaching the game's own pointer handlers. */
function swallow(e: Event): void {
  e.preventDefault?.();
  e.stopPropagation?.();
}

/** Stops propagation only. */
function stop(e: Event): void {
  e.stopPropagation?.();
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function pct(v: number): string {
  return `${(Math.min(1, Math.max(0, v)) * 100).toFixed(1)}%`;
}

export function createSkateHud(ui: HTMLElement): SkateHud {
  const touchState: SkateTouch = { olliePressed: false, flipPressed: false, grabHeld: false };

  const box = div('position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:40;display:none;' + FONT);
  box.id = 'skate-hud';
  box.addEventListener('pointerdown', stop);
  box.addEventListener('mousedown', stop);
  box.addEventListener('touchstart', stop);

  // Info and line strips, top-left under the game's top HUD.
  // Top centre, under the game's toast line (the game's stats panel owns the top-left corner).
  const info = div(ABS + 'left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 76px);'
    + 'padding:4px 10px;font-size:13px;white-space:nowrap;pointer-events:none;display:none;' + PANEL);
  const line = div(ABS + 'left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 108px);'
    + 'padding:4px 10px;font-size:13px;white-space:nowrap;pointer-events:none;display:none;' + PANEL);

  // Combo panel, lower middle: trick names, points x multiplier, the link bar.
  const combo = div(ABS + 'left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 200px);'
    + 'width:min(92vw,420px);box-sizing:border-box;text-align:center;pointer-events:none;display:none;color:#fff8d6;'
    + SHADOW + FONT);
  const comboLines = div('font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
  const comboPts = div('font:800 34px/1.1 system-ui,sans-serif;text-shadow:0 2px 0 #000,0 4px 8px rgba(0,0,0,0.5);');
  const linkBar = div('margin:6px auto 0;width:200px;max-width:70vw;height:6px;border-radius:3px;overflow:hidden;'
    + 'background:rgba(10,30,20,0.6);display:none;');
  const linkFill = div('height:100%;width:0;background:linear-gradient(90deg,#7fd3ff,#ff8ad6);');
  linkBar.appendChild(linkFill);
  combo.appendChild(comboLines);
  combo.appendChild(comboPts);
  combo.appendChild(linkBar);

  // The big word: LANDED <points> in green, BAILED in red, fading.
  const bank = div(ABS + 'left:0;right:0;top:40%;text-align:center;pointer-events:none;opacity:0;'
    + 'font:900 44px/1.1 system-ui,sans-serif;text-shadow:0 2px 0 #000,0 4px 8px rgba(0,0,0,0.5);');

  // Touch buttons, right side above the game's own driving buttons.
  const pad = div(ABS + 'right:calc(env(safe-area-inset-right) + 12px);bottom:calc(env(safe-area-inset-bottom) + 170px);'
    + 'display:flex;flex-direction:column;align-items:flex-end;gap:6px;pointer-events:none;' + FONT);
  const hint = div('max-width:min(86vw,340px);font-size:11px;line-height:1.3;text-align:right;color:#f3e9d2;' + SHADOW,
    'Ollie: Space - Flip: F/click + direction - Grab: right click + direction - Off: E');
  const row = div('display:flex;align-items:flex-end;gap:8px;');
  const button = (label: string, aria: string, css: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.style.cssText = BTN + css;
    b.textContent = label;
    b.setAttribute?.('aria-label', aria);
    return b;
  };
  const flipBtn = button('FLIP', 'Flip', 'width:56px;height:56px;');
  const grabBtn = button('GRAB', 'Grab (hold)', 'width:56px;height:56px;');
  const ollieBtn = button('OLLIE', 'Ollie', 'width:72px;height:72px;font-size:15px;'
    + 'background:radial-gradient(circle at 35% 30%, #ffe27a, #e0a526);color:#2a1c00;');
  row.appendChild(flipBtn);
  row.appendChild(grabBtn);
  row.appendChild(ollieBtn);
  pad.appendChild(hint);
  pad.appendChild(row);

  ollieBtn.addEventListener('pointerdown', (e) => { swallow(e); touchState.olliePressed = true; });
  flipBtn.addEventListener('pointerdown', (e) => { swallow(e); touchState.flipPressed = true; });
  grabBtn.addEventListener('pointerdown', (e) => { swallow(e); touchState.grabHeld = true; });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    grabBtn.addEventListener(type, (e) => { swallow(e); touchState.grabHeld = false; });
  }

  box.appendChild(info);
  box.appendChild(line);
  box.appendChild(combo);
  box.appendChild(bank);
  box.appendChild(pad);
  ui.appendChild(box);

  let shownLast: ComboView['last'] = null;

  return {
    show(on: boolean): void {
      box.style.display = on ? 'block' : 'none';
    },

    setCombo(v: ComboView, now: number): void {
      const shown = v.lines.slice(-LINES_SHOWN);
      combo.style.display = v.lines.length > 0 ? 'block' : 'none';
      comboLines.textContent = shown.join(' + ');
      comboPts.textContent = `${fmt(v.points)} x ${v.mult}`;
      linkBar.style.display = v.linkLeft > 0 ? 'block' : 'none';
      linkFill.style.width = pct(v.linkLeft / LINK_FULL_S);

      if (v.last !== shownLast) {
        shownLast = v.last;
        if (v.last) {
          const landed = v.last.kind === 'landed';
          bank.textContent = landed ? `LANDED ${fmt(v.last.points)}` : 'BAILED';
          bank.style.color = landed ? '#7dff9a' : '#ff5a5a';
        }
      }
      if (!v.last) {
        bank.style.opacity = '0';
        return;
      }
      const age = now - v.last.t;
      if (age < 0 || age >= BANK_HOLD_S + BANK_FADE_S) {
        bank.style.opacity = '0';
      } else if (age < BANK_HOLD_S) {
        bank.style.opacity = '1';
      } else {
        bank.style.opacity = String(Math.max(0, 1 - (age - BANK_HOLD_S) / BANK_FADE_S));
      }
    },

    setLine(text: string | null): void {
      line.textContent = text ?? '';
      line.style.display = text ? 'block' : 'none';
    },

    setInfo(text: string): void {
      info.textContent = text;
      info.style.display = text ? 'block' : 'none';
    },

    touch(): SkateTouch {
      const out: SkateTouch = { ...touchState };
      touchState.olliePressed = false;
      touchState.flipPressed = false;
      return out;
    },

    dispose(): void {
      box.remove?.();
    },
  };
}

/** Stateful: keeps last frame's fire to make `flip` an edge. */
export function createSkateInputReader(): {
  read(inp: InputState, raw: InputState, touch: SkateTouch): SkateInput;
} {
  let lastFire = false;
  return {
    read(inp: InputState, raw: InputState, touch: SkateTouch): SkateInput {
      const fire = !!raw.fire;
      const flip = (fire && !lastFire) || touch.flipPressed;
      lastFire = fire;

      // While a trick button is held, the stick picks the trick and the board is not pushed or braked.
      const trick = fire || !!raw.aim || touch.grabHeld;
      let stick = { x: 0, y: 0 };
      let push = 0;
      let brake = 0;
      if (trick) {
        const mag = Math.hypot(inp.moveX, inp.moveY);
        const k = mag > 1 ? 1 / mag : 1;
        stick = { x: inp.moveX * k, y: inp.moveY * k };
      } else {
        push = Math.max(0, inp.moveY);
        brake = Math.max(0, -inp.moveY);
      }

      return {
        steer: inp.moveX,
        push,
        brake,
        ollie: !!inp.jump || touch.olliePressed,
        flip,
        grab: !!raw.aim || touch.grabHeld,
        stick,
      };
    },
  };
}
