// Sim jobs: the on-duty HUD widget (meter, timer, comfort stars, next stop) and the 44 px job-action button
// (also the I key, keys.ts KEYS.jobAction, and the gamepad's right-stick press, defs.ts JOB_PAD_BUTTON).
import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../keys';
import { glyphText } from '../ui/glyphs';
import { currentGlyphSet, onInputSourceChange } from '../ui/inputSource';
import { JOBS, JOB_PAD_BUTTON } from './defs';
import type { JobId } from './types';

export interface JobHudView {
  job: JobId;
  /** "Fare: Bess Rootley (nervous)". */
  title: string;
  /** Up to 3 short lines: "To: Clay-Mart, 340 m", "Parcels: 2 (fragile 100%)". */
  lines: string[];
  /** Meter text, e.g. "🪙 34", or null. */
  meter: string | null;
  /** Seconds left (negative = late), or null for no clock. */
  timer: number | null;
  /** Live comfort as 0..5 stars (fractions allowed), or null. */
  stars: number | null;
  /** Surge tag ("RUSH HOUR"), or null. */
  tag: string | null;
  /** The action button's label ("Drop cargo", "Accept call", "Next fare"), or null to hide it. */
  action: string | null;
}

export interface JobHud {
  /** Every frame while on duty (null hides the widget). Only touches the DOM when the text changes. */
  set(v: JobHudView | null): void;
  /** The action button, I key or pad R3 was pressed (once per press). */
  onAction(cb: () => void): void;
  /** The shift summary card: a title and lines; closes on tap or after 8 s. */
  summary(title: string, lines: string[]): void;
  dispose(): void;
}

const STYLE_ID = 'gta-job-hud-css';
const CSS = `
#gta-job-hud{position:fixed;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);z-index:35;width:max(220px,min(340px,calc(100vw - 200px)));box-sizing:border-box;display:none;flex-direction:column;gap:6px;font-family:system-ui,sans-serif;color:#fff;pointer-events:none;}
body.gta-in-scene #gta-job-hud{display:none!important}
#gta-job-hud .gta-jh-panel{box-sizing:border-box;display:flex;flex-direction:column;gap:3px;padding:8px 10px 8px 12px;background:rgba(20,22,26,.8);border-radius:12px;border-left:4px solid #ffd23f;}
#gta-job-hud .gta-jh-head{display:flex;align-items:center;gap:6px;min-width:0;}
#gta-job-hud .gta-jh-title{flex:1 1 auto;min-width:0;font-weight:700;font-size:14px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-job-hud .gta-jh-tag{flex:0 0 auto;font-size:10px;font-weight:700;padding:2px 6px;border-radius:999px;background:#ff5a5a;color:#fff;letter-spacing:.04em;}
#gta-job-hud .gta-jh-line{font-size:12px;line-height:1.35;color:rgba(255,255,255,.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-job-hud .gta-jh-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px;font-size:12px;}
#gta-job-hud .gta-jh-meter{min-width:0;overflow:hidden;white-space:nowrap;}
#gta-job-hud .gta-jh-timer{font-variant-numeric:tabular-nums;font-weight:700;}
#gta-job-hud .gta-jh-late{color:#ff5a5a;}
#gta-job-hud .gta-jh-stars{color:#ffd23f;letter-spacing:1px;white-space:nowrap;}
#gta-job-hud .gta-jh-action{pointer-events:auto;align-self:center;display:none;align-items:center;justify-content:center;min-width:120px;height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid rgba(255,255,255,.7);background:rgba(20,22,26,.85);color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
#gta-job-hud .gta-jh-action{position:relative}
#gta-job-hud .gta-jh-action[data-glyph]::after{content:attr(data-glyph);position:absolute;left:-6px;top:-6px;min-width:20px;height:20px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:#2a2f36;color:#fff;border:1.5px solid rgba(255,255,255,.85);font:800 11px/17px system-ui,sans-serif;text-align:center;pointer-events:none;}
#gta-job-summary{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:38;width:min(360px,92vw);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:16px;background:#14181c;border:2px solid rgba(255,255,255,.25);border-radius:16px;color:#fff;font-family:system-ui,sans-serif;pointer-events:auto;touch-action:manipulation;cursor:pointer;}
#gta-job-summary .gta-js-title{font-weight:700;font-size:17px;}
#gta-job-summary .gta-js-line{font-size:14px;color:rgba(255,255,255,.85);}
#gta-job-summary .gta-js-ok{align-self:center;min-width:120px;height:44px;box-sizing:border-box;border-radius:22px;border:2px solid rgba(255,255,255,.6);background:#1f252b;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
`;

function injectCss(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.append(s);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}

export function createJobHud(ui: HTMLElement): JobHud {
  injectCss();

  const root = el('div', 'gta-jh-root');
  root.id = 'gta-job-hud';
  const panel = el('div', 'gta-jh-panel');
  const head = el('div', 'gta-jh-head');
  const title = el('div', 'gta-jh-title');
  const tag = el('div', 'gta-jh-tag');
  head.append(title, tag);
  const lineEls = [el('div', 'gta-jh-line'), el('div', 'gta-jh-line'), el('div', 'gta-jh-line')];
  const foot = el('div', 'gta-jh-foot');
  const meter = el('div', 'gta-jh-meter');
  const timer = el('div', 'gta-jh-timer');
  const stars = el('div', 'gta-jh-stars');
  foot.append(meter, timer, stars);
  panel.append(head, ...lineEls, foot);
  const action = el('button', 'gta-jh-action');
  action.type = 'button';
  root.append(panel, action);
  root.style.display = 'none';
  ui.append(root);

  // The action button shows the key (or pad) that presses it; touch shows none.
  function paintGlyph(): void {
    if (currentGlyphSet() === 'touch') {
      if (action.hasAttribute('data-glyph')) action.removeAttribute('data-glyph');
    } else {
      const g = glyphText('jobAction');
      if (action.getAttribute('data-glyph') !== g) action.setAttribute('data-glyph', g);
    }
  }
  paintGlyph();
  onInputSourceChange(() => paintGlyph());

  // Last written strings and flags, so set() touches the DOM only on a change.
  const last: Record<string, string> = {};
  let shown = false;
  let curJob: JobId | null = null;
  let tagOn = false;
  let actionShown = false;
  let lateOn = false;
  const lineOn: boolean[] = [false, false, false];

  function text(key: string, node: HTMLElement, s: string): void {
    if (last[key] === s) return;
    last[key] = s;
    node.textContent = s;
  }

  const callbacks: (() => void)[] = [];
  function fire(): void {
    for (const cb of callbacks.slice()) cb();
  }

  // Pad button edge detection runs every set() call, so a press is counted once.
  let prevPad = false;

  action.addEventListener('pointerdown', (e) => e.stopPropagation());
  action.addEventListener('click', () => fire());

  function onKey(e: KeyboardEvent): void {
    if (e.code !== KEYS.jobAction || e.repeat || isTyping(e) || !actionShown) return;
    e.preventDefault();
    fire();
  }
  window.addEventListener('keydown', onKey);

  // The shift summary card.
  let sumEl: HTMLElement | null = null;
  let sumTimer = 0;

  function closeSummary(): void {
    if (sumTimer) window.clearTimeout(sumTimer);
    sumTimer = 0;
    sumEl?.remove();
    sumEl = null;
  }

  function onEsc(e: KeyboardEvent): void {
    if (e.code === KEYS.close && sumEl) closeSummary();
  }
  window.addEventListener('keydown', onEsc);

  function set(v: JobHudView | null): void {
    const p = firstPad();
    const down = !!p?.buttons[JOB_PAD_BUTTON]?.pressed;
    const padPressed = down && !prevPad;
    prevPad = down;

    if (!v) {
      if (shown) {
        root.style.display = 'none';
        shown = false;
      }
      actionShown = false;
      return;
    }
    if (!shown) {
      root.style.display = 'flex';
      shown = true;
    }

    if (curJob !== v.job) {
      curJob = v.job;
      panel.style.borderLeftColor = JOBS[v.job].color;
    }
    text('title', title, v.title);

    const tagNow = v.tag !== null;
    if (tagNow !== tagOn) {
      tagOn = tagNow;
      tag.style.display = tagNow ? '' : 'none';
    }
    text('tag', tag, v.tag ?? '');

    for (let i = 0; i < lineEls.length; i++) {
      const s = v.lines[i] ?? '';
      const on = i < v.lines.length && i < 3;
      if (on !== lineOn[i]) {
        lineOn[i] = on;
        lineEls[i].style.display = on ? '' : 'none';
      }
      text(`line${i}`, lineEls[i], on ? s : '');
    }

    text('meter', meter, v.meter ?? '');

    let ts = '';
    let late = false;
    if (v.timer !== null) {
      const total = Math.round(Math.abs(v.timer));
      late = v.timer < 0;
      ts = `${late ? '+' : ''}${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    }
    if (late !== lateOn) {
      lateOn = late;
      timer.classList.toggle('gta-jh-late', late);
    }
    text('timer', timer, ts);

    let ss = '';
    if (v.stars !== null) {
      const n = Math.max(0, Math.min(5, Math.round(v.stars)));
      ss = '★'.repeat(n) + '☆'.repeat(5 - n);
    }
    text('stars', stars, ss);

    if (v.action !== null) {
      text('action', action, v.action);
      if (!actionShown) {
        action.style.display = 'flex';
        actionShown = true;
      }
    } else if (actionShown) {
      action.style.display = 'none';
      actionShown = false;
    }

    if (padPressed && actionShown) fire();
  }

  function summary(t: string, lines: string[]): void {
    closeSummary();
    const card = el('div', 'gta-job-summary-card');
    card.id = 'gta-job-summary';
    const h = el('div', 'gta-js-title');
    h.textContent = t;
    card.append(h);
    for (const line of lines) {
      const d = el('div', 'gta-js-line');
      d.textContent = line;
      card.append(d);
    }
    const ok = el('button', 'gta-js-ok');
    ok.type = 'button';
    ok.textContent = 'OK';
    card.append(ok);
    card.addEventListener('click', closeSummary);
    ui.append(card);
    sumEl = card;
    sumTimer = window.setTimeout(closeSummary, 8000);
  }

  function onAction(cb: () => void): void {
    callbacks.push(cb);
  }

  function dispose(): void {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keydown', onEsc);
    closeSummary();
    root.remove();
    callbacks.length = 0;
  }

  return { set, onAction, summary, dispose };
}
