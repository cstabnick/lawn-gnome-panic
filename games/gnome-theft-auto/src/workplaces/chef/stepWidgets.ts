// E24 chef: the touch mini-steps (chop, stir, pour, heat, flip, plate). DOM + CSS only, pointer events so mouse and
// touch both work. Each widget returns a 0..100 score through result() once finished.
import { play2d } from '../../sound/bus';
import type { CookStep, StepWidget } from './types';

const CSS_ID = 'gta-chef-steps-css';
const CSS = `
.gcs{position:relative;box-sizing:border-box;width:min(360px,92vw);min-width:260px;min-height:240px;padding:10px;
  background:#fff4d6;border:3px solid #c0392b;border-radius:16px;color:#4a2c12;font-family:system-ui,sans-serif;
  display:flex;flex-direction:column;gap:8px;user-select:none;-webkit-user-select:none}
.gcs-label{font-size:18px;font-weight:800;text-align:center;color:#a8281c}
.gcs-area{position:relative;flex:1;min-height:170px;border-radius:12px;background:#f6e2a8;overflow:hidden;
  touch-action:none;cursor:pointer}
.gcs-fb{min-height:22px;text-align:center;font-size:15px;font-weight:700;color:#7a5a12}
.gcs-fb.done{font-size:20px;color:#2e7d32}
.gcs-abs{position:absolute;transform:translate(-50%,-50%);pointer-events:none;line-height:1}
.gcs-board{position:absolute;inset:14% 8%;background:#d9a65e;border:3px solid #a9742f;border-radius:10px}
.gcs-piece{transition:font-size .12s}
.gcs-knife{font-size:44px;opacity:0}
.gcs-knife.go{animation:gcs-knife .22s ease-in}
@keyframes gcs-knife{0%{opacity:1;transform:translate(-50%,-190%) rotate(-30deg)}70%{opacity:1;transform:translate(-50%,-50%) rotate(10deg)}100%{opacity:0;transform:translate(-50%,-50%) rotate(10deg)}}
.gcs-shake{animation:gcs-shake .2s}
@keyframes gcs-shake{0%,100%{translate:0}25%{translate:-5px 2px}75%{translate:5px -2px}}
.gcs-pot{position:absolute;left:50%;top:50%;width:140px;height:140px;margin:-70px 0 0 -70px;border-radius:50%;
  background:radial-gradient(circle,#e9c46a 0 55%,#6b6b6b 56% 100%);border:3px solid #444;pointer-events:none}
.gcs-swirl{position:absolute;left:50%;top:50%;font-size:46px;transform:translate(-50%,-50%);pointer-events:none}
.gcs-bar{position:absolute;left:0;right:0;height:14px;background:#fff;border:2px solid #7a5a12;border-radius:8px;overflow:hidden}
.gcs-bar i{display:block;height:100%;background:#e6a817}
.gcs-band{position:absolute;top:0;bottom:0;background:rgba(76,175,80,.55)}
.gcs-green{background:#7bc67e;position:absolute;top:0;bottom:0}
.gcs-needle{position:absolute;bottom:0;width:6px;height:100%;background:#c0392b;border-radius:3px;margin-left:-3px}
.gcs-ring{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;
  pointer-events:none}
.gcs-pan{position:absolute;left:50%;top:50%;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;
  background:#555;border:5px solid #333;pointer-events:none}
.gcs-plate{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;
  background:#fff;border:4px solid #d8d8d8;pointer-events:none}
.gcs-garnish{position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;border:3px solid #7a5a12;
  background:#fff4d6;font-size:26px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;
  transition:left .25s ease-in,top .25s ease-in,transform .25s}
.gcs-garnish b{position:absolute;right:-6px;top:-8px;font-size:12px;background:#c0392b;color:#fff;border-radius:9px;
  min-width:18px;height:18px;line-height:18px;text-align:center}
.gcs-garnish.bad{background:#f4a29a}
.gcs-garnish.on{transform:scale(.8);pointer-events:none}
`;

function ensureCss(): void {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement('style');
  s.id = CSS_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function mk<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

/** Restart a one-shot CSS animation class. */
function bump(e: HTMLElement, cls: string): void {
  e.classList.remove(cls);
  void e.offsetWidth;
  e.classList.add(cls);
}

function place(e: HTMLElement, xPct: number, yPct: number): void {
  e.style.left = `${xPct}%`;
  e.style.top = `${yPct}%`;
}

/** 100 minus 10 per second over `seconds`, never below 30. */
function timeScore(elapsed: number, seconds: number): number {
  return Math.max(30, 100 - 10 * Math.max(0, elapsed - seconds));
}

function verdict(score: number): string {
  if (score >= 95) return 'Perfect!';
  if (score >= 75) return 'Nice';
  if (score >= 50) return 'Fine';
  return 'Oops';
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

interface Shell {
  el: HTMLElement;
  area: HTMLElement;
  /** Set the feedback line (while playing). */
  say(text: string): void;
  /** Finish with a score (once). */
  finish(score: number, word?: string): void;
  done(): boolean;
  score(): number | null;
  /** Add a window listener, removed by dispose(). */
  onWindow<K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void): void;
  dispose(): void;
}

function makeShell(step: CookStep): Shell {
  ensureCss();
  const el = mk('div', 'gcs');
  const label = mk('div', 'gcs-label', el);
  label.textContent = step.label;
  const area = mk('div', 'gcs-area', el);
  const fb = mk('div', 'gcs-fb', el);
  area.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  let score: number | null = null;
  const offs: (() => void)[] = [];
  return {
    el, area,
    say(text) { if (score === null) fb.textContent = text; },
    finish(s, word) {
      if (score !== null) return;
      score = Math.round(clamp(s, 0, 100));
      fb.textContent = word ?? verdict(score);
      fb.classList.add('done');
    },
    done: () => score !== null,
    score: () => score,
    onWindow(type, fn) {
      window.addEventListener(type, fn as EventListener);
      offs.push(() => window.removeEventListener(type, fn as EventListener));
    },
    dispose() { for (const o of offs) o(); offs.length = 0; },
  };
}

function chopWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const target = Math.max(1, Math.round(step.target));
  mk('div', 'gcs-board', sh.area);
  const pieces: HTMLElement[] = [];
  const rebuild = (taps: number): void => {
    const n = Math.min(8, 1 + taps);
    while (pieces.length < n) pieces.push(mk('div', 'gcs-abs gcs-piece', sh.area));
    const size = Math.round(78 - 48 * (taps / target));
    pieces.forEach((p, i) => {
      p.textContent = step.emoji;
      p.style.fontSize = `${size}px`;
      const k = (i + 0.5) / pieces.length;
      place(p, 14 + 72 * k, 50 + (i % 2 ? 10 : -10));
    });
  };
  const knife = mk('div', 'gcs-abs gcs-knife', sh.area);
  knife.textContent = '🔪';
  let taps = 0;
  let elapsed = 0;
  rebuild(0);
  sh.say(`Tap to chop! 0 / ${target}`);
  sh.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (sh.done()) return;
    taps++;
    play2d('chef-chop');
    place(knife, 20 + Math.random() * 60, 50);
    bump(knife, 'go');
    rebuild(taps);
    bump(sh.area, 'gcs-shake');
    if (taps >= target) sh.finish(timeScore(elapsed, step.seconds));
    else sh.say(`Chop! ${taps} / ${target}`);
  });
  return {
    el: sh.el,
    update(dt) { if (!sh.done()) elapsed += dt; },
    result: sh.score,
    destroy: sh.dispose,
  };
}

function stirWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const target = Math.max(1, step.target);
  mk('div', 'gcs-pot', sh.area);
  const swirl = mk('div', 'gcs-swirl', sh.area);
  swirl.textContent = step.emoji;
  const spoon = mk('div', 'gcs-abs', sh.area);
  spoon.style.fontSize = '40px';
  spoon.textContent = '🥄';
  spoon.style.opacity = '0';
  let swept = 0;
  let lastAngle: number | null = null;
  let nextHalf = 0.5;
  let dragging = false;
  let elapsed = 0;
  const turns = (): number => Math.abs(swept) / (2 * Math.PI);
  const show = (): void => {
    swirl.style.transform = `translate(-50%,-50%) rotate(${swept}rad)`;
    sh.say(`Stir! ${Math.min(target, turns()).toFixed(1)} / ${target} turns`);
  };
  show();
  const angleAt = (e: PointerEvent): number => {
    const r = sh.area.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const moveSpoon = (e: PointerEvent): void => {
    const r = sh.area.getBoundingClientRect();
    spoon.style.opacity = '1';
    spoon.style.left = `${e.clientX - r.left}px`;
    spoon.style.top = `${e.clientY - r.top}px`;
  };
  sh.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (sh.done()) return;
    dragging = true;
    lastAngle = angleAt(e);
    try { sh.area.setPointerCapture(e.pointerId); } catch { /* not capturable: window listeners still end it */ }
    moveSpoon(e);
  });
  sh.area.addEventListener('pointermove', (e) => {
    if (!dragging || sh.done()) return;
    moveSpoon(e);
    const a = angleAt(e);
    if (lastAngle !== null) {
      let d = a - lastAngle;
      if (d > Math.PI) d -= 2 * Math.PI;
      else if (d < -Math.PI) d += 2 * Math.PI;
      swept += d;
    }
    lastAngle = a;
    if (turns() >= nextHalf) { play2d('chef-stir'); nextHalf += 0.5; }
    show();
    if (turns() >= target) sh.finish(timeScore(elapsed, step.seconds));
  });
  const end = (): void => { dragging = false; lastAngle = null; };
  sh.onWindow('pointerup', end);
  sh.onWindow('pointercancel', end);
  return {
    el: sh.el,
    update(dt) { if (!sh.done()) elapsed += dt; },
    result: sh.score,
    destroy: sh.dispose,
  };
}

function pourWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const target = clamp(step.target, 0.1, 0.9);
  const glass = mk('div', 'gcs-abs', sh.area);
  glass.style.fontSize = '60px';
  glass.textContent = '🥛';
  place(glass, 50, 72);
  const jug = mk('div', 'gcs-abs', sh.area);
  jug.style.fontSize = '60px';
  jug.textContent = '🫗';
  place(jug, 50, 26);
  jug.style.transition = 'transform .15s';
  jug.style.transform = 'translate(-50%,-50%) rotate(0deg)';
  const ing = mk('div', 'gcs-abs', sh.area);
  ing.style.fontSize = '30px';
  ing.textContent = step.emoji;
  place(ing, 16, 26);
  const bar = mk('div', 'gcs-bar', sh.area);
  bar.style.bottom = '8px';
  bar.style.left = '10px';
  bar.style.right = '10px';
  const band = mk('div', 'gcs-band', bar);
  band.style.left = `${(target - 0.08) * 100}%`;
  band.style.width = '16%';
  const fillEl = mk('i', '', bar);
  fillEl.style.width = '0%';
  let fill = 0;
  let pouring = false;
  sh.say('Hold to pour, release in the green');
  const render = (): void => { fillEl.style.width = `${Math.min(1, fill) * 100}%`; };
  const stop = (): void => {
    if (!pouring) return;
    pouring = false;
    jug.style.transform = 'translate(-50%,-50%) rotate(0deg)';
    if (sh.done() || fill <= 0.05) { fill = 0; render(); return; }
    const dist = Math.max(0, Math.abs(fill - target) - 0.08);
    sh.finish(100 - 400 * dist);
  };
  sh.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (sh.done()) return;
    pouring = true;
    play2d('chef-pour');
    jug.style.transform = 'translate(-50%,-50%) rotate(-55deg)';
  });
  sh.onWindow('pointerup', stop);
  sh.onWindow('pointercancel', stop);
  return {
    el: sh.el,
    update(dt) {
      if (sh.done() || !pouring) return;
      fill += 0.45 * dt;
      render();
      if (fill > 1) {
        pouring = false;
        jug.style.transform = 'translate(-50%,-50%) rotate(0deg)';
        sh.finish(0, 'SPLOSH! Oops');
      }
    },
    result: sh.score,
    destroy: sh.dispose,
  };
}

function heatWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const target = clamp(step.target, 0, 1);
  const icon = mk('div', 'gcs-abs', sh.area);
  icon.style.fontSize = '64px';
  icon.textContent = step.emoji;
  place(icon, 50, 32);
  const bar = mk('div', 'gcs-bar', sh.area);
  bar.style.height = '34px';
  bar.style.bottom = '22px';
  bar.style.left = '12px';
  bar.style.right = '12px';
  const green = mk('div', 'gcs-green', bar);
  green.style.left = `${(target - 0.1) * 100}%`;
  green.style.width = '20%';
  const needle = mk('div', 'gcs-needle', bar);
  let t = 0;
  let value = 0;
  const setNeedle = (): void => { needle.style.left = `${value * 100}%`; };
  setNeedle();
  sh.say('Tap to stop the needle in the green');
  sh.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (sh.done()) return;
    play2d('chef-sizzle');
    const d = Math.abs(value - target);
    const s = d <= 0.1 ? 100 - 40 * (d / 0.1) : 60 * (1 - (d - 0.1) / 0.2);
    sh.finish(Math.max(0, s));
  });
  return {
    el: sh.el,
    update(dt) {
      if (sh.done()) return;
      t += dt;
      const phase = (t % 1.6) / 1.6;
      value = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      setNeedle();
    },
    result: sh.score,
    destroy: sh.dispose,
  };
}

const FILL_TIME = 1.2;
const PERFECT_WINDOW = 0.35;
const MISS_AFTER = FILL_TIME + 1;

function flipWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const flips = Math.max(1, Math.round(step.target));
  const ring = mk('div', 'gcs-ring', sh.area);
  mk('div', 'gcs-pan', sh.area);
  const item = mk('div', 'gcs-abs', sh.area);
  item.style.fontSize = '54px';
  item.textContent = step.emoji;
  item.style.transition = 'transform .25s, filter .25s';
  place(item, 50, 50);
  const scores: number[] = [];
  let t = 0;
  let hop = 0;
  const setRing = (): void => {
    const f = Math.min(1, t / FILL_TIME);
    const col = t >= FILL_TIME && t <= FILL_TIME + PERFECT_WINDOW ? '#43a047' : '#e6a817';
    ring.style.background = `conic-gradient(${col} ${f * 360}deg, rgba(0,0,0,.12) 0)`;
    ring.style.webkitMask = ring.style.mask = 'radial-gradient(circle, transparent 60%, #000 62%)';
  };
  const progress = (): void => sh.say(`Flip when the ring is full! ${scores.length} / ${flips}`);
  const next = (score: number, burnt: boolean): void => {
    scores.push(score);
    item.style.filter = burnt ? 'brightness(.35)' : '';
    hop = 0.3;
    item.style.transform = 'translate(-50%,-50%) translateY(-34px) rotate(360deg)';
    t = 0;
    if (scores.length >= flips) {
      sh.finish(scores.reduce((a, b) => a + b, 0) / scores.length);
    } else progress();
  };
  setRing();
  progress();
  sh.area.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (sh.done()) return;
    play2d('chef-sizzle');
    if (t < FILL_TIME) next(55, false);
    else if (t <= FILL_TIME + PERFECT_WINDOW) next(100, false);
    else next(55, true);
  });
  return {
    el: sh.el,
    update(dt) {
      if (hop > 0) {
        hop -= dt;
        if (hop <= 0) item.style.transform = 'translate(-50%,-50%)';
      }
      if (sh.done()) return;
      t += dt;
      if (t > MISS_AFTER) next(20, true);
      setRing();
    },
    result: sh.score,
    destroy: sh.dispose,
  };
}

const GARNISH = ['🌿', '🍅', '🧀', '🫘', '🌰'];

function plateWidget(step: CookStep): StepWidget {
  const sh = makeShell(step);
  const n = Math.max(1, Math.round(step.target));
  mk('div', 'gcs-plate', sh.area);
  let nextIdx = 0;
  let wrong = 0;
  let elapsed = 0;
  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < n; i++) {
    const b = mk('button', 'gcs-garnish', sh.area);
    b.type = 'button';
    b.textContent = i === 0 ? step.emoji : GARNISH[i % GARNISH.length];
    const num = mk('b', '', b);
    num.textContent = String(i + 1);
    // Scatter around the plate, away from its centre.
    const a = (i / n) * Math.PI * 2 + 0.5;
    place(b, 50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a));
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (sh.done() || b.classList.contains('on')) return;
      if (i === nextIdx) {
        b.classList.add('on');
        place(b, 50 + (Math.random() - 0.5) * 8, 50 + (Math.random() - 0.5) * 8);
        nextIdx++;
        if (nextIdx >= n) sh.finish(Math.max(20, 100 - 15 * wrong - 5 * Math.max(0, elapsed - step.seconds)));
        else sh.say(`Next: ${nextIdx + 1} / ${n}`);
      } else {
        wrong++;
        b.classList.add('bad');
        bump(b, 'gcs-shake');
        sh.say(`Wrong one! Tap ${nextIdx + 1} next`);
        b.addEventListener('animationend', () => b.classList.remove('bad'), { once: true });
      }
    });
    buttons.push(b);
  }
  sh.say(`Plate them in order: 1 to ${n}`);
  return {
    el: sh.el,
    update(dt) { if (!sh.done()) elapsed += dt; },
    result: sh.score,
    destroy: sh.dispose,
  };
}

/** A playable widget for one step. */
export function makeStepWidget(step: CookStep): StepWidget {
  switch (step.kind) {
    case 'chop': return chopWidget(step);
    case 'stir': return stirWidget(step);
    case 'pour': return pourWidget(step);
    case 'heat': return heatWidget(step);
    case 'flip': return flipWidget(step);
    case 'plate': return plateWidget(step);
  }
}
