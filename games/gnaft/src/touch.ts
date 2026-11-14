// On-screen touch controls for phones and tablets (see docs/roadmaps/gnaft/epic5-03-touch.md).
// Only talks to the game through ctx.input.virtual and reads ctx.state.
import { KEYS } from './config';
import type { Ctx, GameState, System } from './config';

// Local tuning (other systems' numbers live in config.ts, which this file must not edit).
const JOY = { radius: 60, base: 120, knob: 56, dead: 0.35, rim: 0.9, top: 80, width: 0.45 };
const LOOK = { gain: 1.6, dragPx: 10 };
const PINCH = 3;

const CSS = `
#rg-touch{position:absolute;inset:0;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}
#rg-touch .rg-zone{position:absolute;pointer-events:auto;touch-action:none;}
#rg-touch .rg-look{left:0;top:0;right:0;bottom:0;z-index:0;}
#rg-touch .rg-joy{left:0;top:${JOY.top}px;width:${JOY.width * 100}%;bottom:0;z-index:1;}
#rg-touch .rg-base,#rg-touch .rg-knob{position:absolute;border-radius:50%;pointer-events:none;display:none;box-sizing:border-box;}
#rg-touch .rg-base{width:${JOY.base}px;height:${JOY.base}px;margin:${-JOY.base / 2}px 0 0 ${-JOY.base / 2}px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.45);}
#rg-touch .rg-knob{width:${JOY.knob}px;height:${JOY.knob}px;margin:${-JOY.knob / 2}px 0 0 ${-JOY.knob / 2}px;background:rgba(255,255,255,.45);border:2px solid rgba(255,255,255,.8);}
#rg-touch .rg-bar{position:absolute;z-index:2;right:calc(env(safe-area-inset-right,0px) + 12px);bottom:calc(env(safe-area-inset-bottom,0px) + 12px);display:flex;flex-direction:row-reverse;flex-wrap:wrap;align-items:flex-end;justify-content:flex-start;gap:10px;max-width:62%;pointer-events:none;}
#rg-touch .rg-top{position:absolute;z-index:2;right:calc(env(safe-area-inset-right,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 12px);pointer-events:none;}
#rg-touch .rg-btn{width:64px;height:64px;box-sizing:border-box;border-radius:50%;border:2px solid #fff;background:rgba(20,20,20,.45);color:#fff;font:600 12px/1.1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:0;margin:0;cursor:pointer;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
#rg-touch .rg-btn.rg-big{width:84px;height:84px;font-size:14px;}
#rg-touch .rg-btn.rg-on{background:rgba(255,255,255,.35);color:#111;}
`;

interface Spec {
  text: string;
  /** Keyboard code sent with keyDown/keyUp. */
  code?: string;
  /** Mouse button sent with buttonDown/buttonUp (used when code is not set). */
  mouse?: number;
  big?: boolean;
  /** Top-right corner instead of the bottom bar. */
  top?: boolean;
  show: (s: GameState) => boolean;
  label?: (s: GameState) => string;
}

interface Btn {
  spec: Spec;
  el: HTMLButtonElement;
  /** Pointer id holding this button, or null. */
  active: number | null;
}

interface Look {
  sx: number; sy: number; // where the finger went down
  cx: number; cy: number; // current position
  lx: number; ly: number; // position the last look movement was applied at
  drag: boolean;          // moved far enough to count as a drag (not a tap)
}

const play = (s: GameState): boolean => s.mode === 'play';
const build = (s: GameState): boolean => s.mode === 'build';
const telescope = (s: GameState): boolean => s.mode === 'telescope';
const craft = (s: GameState): boolean => s.mode === 'craft';

const SPECS: Spec[] = [
  { text: 'Fish', mouse: 0, big: true, show: (s) => play(s) && !s.player.swimming },
  { text: 'Jump', code: KEYS.jump, show: (s) => play(s) || build(s) },
  { text: 'Cut', code: KEYS.interact, show: play, label: (s) => (s.canGrab ? 'Grab' : 'Cut') },
  { text: 'Build', code: KEYS.build, show: play },
  { text: 'Tool', code: KEYS.tool, show: (s) => play(s) && Object.values(s.tools).filter(Boolean).length > 1 },
  { text: 'Craft', code: KEYS.craft, show: play },
  { text: 'Bonk', code: KEYS.bonk, show: play },
  { text: 'Scope', code: KEYS.telescope, show: (s) => play(s) && s.hasTelescope },
  { text: 'Cast off', code: KEYS.chart, show: (s) => play(s) && s.sea.docked !== null },
  { text: 'Place', mouse: 0, big: true, show: build },
  { text: 'Remove', mouse: 2, show: build },
  { text: 'Next', code: KEYS.buildKind, show: build },
  { text: 'Done', code: KEYS.build, show: build },
  { text: 'Chart', code: KEYS.chart, show: telescope },
  { text: 'Close', code: KEYS.telescope, show: telescope },
  { text: 'Close', code: KEYS.craft, top: true, show: craft },
];

export function createTouch(ctx: Ctx): System {
  if (!document.getElementById('rg-touch-style')) {
    const style = document.createElement('style');
    style.id = 'rg-touch-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'rg-touch';

  // Look zone: the whole screen underneath everything else.
  const lookZone = document.createElement('div');
  lookZone.className = 'rg-zone rg-look';

  // Joystick zone: left side, below the top 80 px.
  const joyZone = document.createElement('div');
  joyZone.className = 'rg-zone rg-joy';
  const base = document.createElement('div');
  base.className = 'rg-base';
  const knob = document.createElement('div');
  knob.className = 'rg-knob';
  joyZone.append(base, knob);

  const bar = document.createElement('div');
  bar.className = 'rg-bar';
  const topWrap = document.createElement('div');
  topWrap.className = 'rg-top';

  root.append(lookZone, joyZone, bar, topWrap);
  ctx.ui.appendChild(root);

  // Keys this file currently holds down (so keyDown/keyUp only fire on changes).
  const held = new Set<string>();
  const setKey = (code: string, on: boolean): void => {
    if (on && !held.has(code)) {
      held.add(code);
      ctx.input.virtual.keyDown(code);
    } else if (!on && held.has(code)) {
      held.delete(code);
      ctx.input.virtual.keyUp(code);
    }
  };

  // ---- Move joystick ----
  let joy: { id: number; bx: number; by: number } | null = null;
  const applyStick = (nx: number, ny: number): void => {
    setKey(KEYS.right, nx > JOY.dead);
    setKey(KEYS.left, nx < -JOY.dead);
    setKey(KEYS.forward, ny < -JOY.dead);
    setKey(KEYS.back, ny > JOY.dead);
    setKey(KEYS.sprint, Math.hypot(nx, ny) > JOY.rim);
  };
  const releaseMove = (): void => {
    joy = null;
    base.style.display = 'none';
    knob.style.display = 'none';
    applyStick(0, 0);
  };

  joyZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (joy) return;
    const r = joyZone.getBoundingClientRect();
    const bx = e.clientX - r.left;
    const by = e.clientY - r.top;
    joy = { id: e.pointerId, bx, by };
    joyZone.setPointerCapture(e.pointerId);
    for (const el of [base, knob]) {
      el.style.left = `${bx}px`;
      el.style.top = `${by}px`;
      el.style.display = 'block';
    }
    applyStick(0, 0);
  });
  joyZone.addEventListener('pointermove', (e) => {
    if (!joy || e.pointerId !== joy.id) return;
    e.preventDefault();
    const r = joyZone.getBoundingClientRect();
    let dx = e.clientX - r.left - joy.bx;
    let dy = e.clientY - r.top - joy.by;
    const len = Math.hypot(dx, dy);
    if (len > JOY.radius) {
      dx *= JOY.radius / len;
      dy *= JOY.radius / len;
    }
    knob.style.left = `${joy.bx + dx}px`;
    knob.style.top = `${joy.by + dy}px`;
    applyStick(dx / JOY.radius, dy / JOY.radius);
  });
  const joyEnd = (e: PointerEvent): void => {
    if (!joy || e.pointerId !== joy.id) return;
    e.preventDefault();
    releaseMove();
  };
  joyZone.addEventListener('pointerup', joyEnd);
  joyZone.addEventListener('pointercancel', joyEnd);

  // ---- Look and pinch zoom ----
  const looks = new Map<number, Look>();
  let pinchD = 0;
  const twoDist = (): number => {
    const [a, b] = [...looks.values()];
    return Math.hypot(a.cx - b.cx, a.cy - b.cy);
  };

  lookZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lookZone.setPointerCapture(e.pointerId);
    looks.set(e.pointerId, {
      sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY,
      lx: e.clientX, ly: e.clientY, drag: false,
    });
    if (looks.size === 2) pinchD = twoDist();
  });
  lookZone.addEventListener('pointermove', (e) => {
    const p = looks.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    p.cx = e.clientX;
    p.cy = e.clientY;
    if (looks.size >= 2) {
      // Two fingers: pinch zoom only.
      const d = twoDist();
      ctx.input.virtual.wheel(-(d - pinchD) * PINCH);
      pinchD = d;
      for (const q of looks.values()) {
        q.lx = q.cx;
        q.ly = q.cy;
        q.drag = true;
      }
      return;
    }
    // One finger: a tap (under 10 px of movement) does nothing; a drag turns the camera.
    if (!p.drag) {
      if (Math.hypot(p.cx - p.sx, p.cy - p.sy) < LOOK.dragPx) return;
      p.drag = true;
    }
    ctx.input.virtual.look((p.cx - p.lx) * LOOK.gain, (p.cy - p.ly) * LOOK.gain);
    p.lx = p.cx;
    p.ly = p.cy;
  });
  const lookEnd = (e: PointerEvent): void => {
    e.preventDefault();
    looks.delete(e.pointerId);
  };
  lookZone.addEventListener('pointerup', lookEnd);
  lookZone.addEventListener('pointercancel', lookEnd);

  // ---- Buttons ----
  const press = (b: Btn, id: number): void => {
    if (b.active !== null) return;
    b.active = id;
    b.el.classList.add('rg-on');
    if (b.spec.code) setKey(b.spec.code, true);
    else if (b.spec.mouse !== undefined) ctx.input.virtual.buttonDown(b.spec.mouse);
  };
  const release = (b: Btn): void => {
    if (b.active === null) return;
    b.active = null;
    b.el.classList.remove('rg-on');
    if (b.spec.code) setKey(b.spec.code, false);
    else if (b.spec.mouse !== undefined) ctx.input.virtual.buttonUp(b.spec.mouse);
  };

  const buttons: Btn[] = SPECS.map((spec) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = spec.big ? 'rg-btn rg-big' : 'rg-btn';
    el.textContent = spec.text;
    el.style.display = 'none';
    const b: Btn = { spec, el, active: null };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (b.active !== null) return;
      el.setPointerCapture(e.pointerId);
      press(b, e.pointerId);
    });
    const up = (e: PointerEvent): void => {
      if (b.active !== e.pointerId) return;
      e.preventDefault();
      release(b);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    (spec.top ? topWrap : bar).appendChild(el);
    return b;
  });

  // Releases everything this file is holding and clears finger state.
  const releaseAll = (): void => {
    releaseMove();
    looks.clear();
    for (const b of buttons) release(b);
  };

  return {
    update() {
      const s = ctx.state;
      const visible = ctx.input.touch() && s.mode !== 'title';
      if (!visible) {
        root.style.display = 'none';
        releaseAll();
        return;
      }
      root.style.display = '';

      // Craft menu: only the Close button, so the menu stays tappable.
      const inCraft = craft(s);
      const zoneDisplay = inCraft ? 'none' : '';
      lookZone.style.display = zoneDisplay;
      joyZone.style.display = zoneDisplay;
      if (inCraft) releaseAll();

      for (const b of buttons) {
        const on = b.spec.show(s);
        b.el.style.display = on ? '' : 'none';
        if (!on) release(b);
        const text = b.spec.label ? b.spec.label(s) : b.spec.text;
        if (b.el.textContent !== text) b.el.textContent = text;
      }
    },
  };
}
