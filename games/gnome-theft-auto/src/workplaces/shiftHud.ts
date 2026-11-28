// E25: the driving-shift HUD shared by the bin round and the fire brigade: a top panel (icon, title, up to 3 lines, a
// meter bar) and one 44 px action button (also the I key, keys.ts KEYS.jobAction, and the pad's right-stick press).
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md. Modelled on jobs/hud.ts; its own ids (gta-shift-hud, gta-sh-*).
import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../keys';
import { glyphText } from '../ui/glyphs';
import { currentGlyphSet, onInputSourceChange } from '../ui/inputSource';
import { JOB_PAD_BUTTON } from '../jobs/defs';
import { quietRegionBanner, registerActivityPanel, setActivityOn } from '../activityMode';

export interface ShiftHudView {
  icon: string;
  /** "Bin round: 4 of 9 bins", "Shed fire: Juniper Vance's terrace". */
  title: string;
  /** Up to 3 short lines ("Next bin: 120 m", "Tank 64%"). */
  lines: string[];
  /** Meter caption ("Tank", "Load") and fill 0..1, or null for no meter. */
  meter: { label: string; frac: number } | null;
  /** The action button's label ("Lift bin", "Man the hose", "Tip the load"), or null to hide it. */
  action: string | null;
  /** Accent colour (the panel's left border), e.g. WORK_JOBS.garbage.color. */
  color: string;
  /** R1 FX03: a spoken line shown inside the panel (the caller's line for the first seconds of a call), or null/absent. */
  note?: string | null;
}

export interface ShiftHud {
  /** Every frame while the shift runs (null hides the widget). Only touches the DOM when something changed. */
  set(v: ShiftHudView | null): void;
  /** The action button, I key or pad R3 was pressed (once per press, only while the button shows). Returns an unsubscribe. */
  onAction(cb: () => void): () => void;
  dispose(): void;
}

const STYLE_ID = 'gta-shift-hud-css';
const CSS = `
#gta-shift-hud{box-sizing:border-box;display:none;flex-direction:column;gap:6px;font-family:system-ui,sans-serif;color:#fff;pointer-events:none;}
body.gta-in-scene #gta-shift-hud{display:none!important}
#gta-shift-hud .gta-sh-panel{box-sizing:border-box;display:flex;flex-direction:column;gap:4px;padding:8px 10px 8px 12px;background:rgba(20,22,26,.8);border-radius:12px;border-left:4px solid #ffd23f;}
#gta-shift-hud .gta-sh-head{display:flex;align-items:center;gap:6px;min-width:0;}
#gta-shift-hud .gta-sh-icon{flex:0 0 auto;font-size:16px;line-height:1;}
#gta-shift-hud .gta-sh-title{flex:1 1 auto;min-width:0;font-weight:700;font-size:14px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-shift-hud .gta-sh-line{font-size:12px;line-height:1.35;color:rgba(255,255,255,.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-shift-hud .gta-sh-note{font-size:12px;line-height:1.35;font-style:italic;color:rgba(255,255,255,.92);white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
@media (max-width:600px) and (min-height:501px){
#gta-shift-hud .gta-sh-panel{padding:5px 8px 5px 10px;gap:2px;}
#gta-shift-hud .gta-sh-l3{display:none!important;}
#gta-shift-hud .gta-sh-meter{margin-top:0;}
}
#gta-shift-hud .gta-sh-meter{display:flex;flex-direction:column;gap:2px;margin-top:2px;}
#gta-shift-hud .gta-sh-caption{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.85);font-variant-numeric:tabular-nums;}
#gta-shift-hud .gta-sh-track{height:6px;border-radius:3px;background:rgba(255,255,255,.2);overflow:hidden;}
#gta-shift-hud .gta-sh-fill{height:100%;width:0;border-radius:3px;background:#5bd66b;transition:width .2s linear;}
#gta-shift-hud .gta-sh-fill.gta-sh-amber{background:#ffb13b;}
#gta-shift-hud .gta-sh-fill.gta-sh-red{background:#ff5a5a;}
#gta-shift-hud .gta-sh-action{pointer-events:auto;align-self:center;display:none;align-items:center;justify-content:center;min-width:120px;height:44px;box-sizing:border-box;padding:0 16px;border-radius:22px;border:2px solid rgba(255,255,255,.7);background:rgba(20,22,26,.85);color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;position:relative;}
#gta-shift-hud .gta-sh-action[data-glyph]::after{content:attr(data-glyph);position:absolute;left:-6px;top:-6px;min-width:20px;height:20px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:#2a2f36;color:#fff;border:1.5px solid rgba(255,255,255,.85);font:800 11px/17px system-ui,sans-serif;text-align:center;pointer-events:none;}
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

/** Every shift HUD instance (the bin round and the fire brigade each have one) that is showing: the shift holsters while any is. */
const showing = new Set<object>();

export function createShiftHud(ui: HTMLElement): ShiftHud {
  const me = {};
  injectCss();

  const root = el('div', 'gta-sh-root');
  root.id = 'gta-shift-hud';
  const panel = el('div', 'gta-sh-panel');
  const head = el('div', 'gta-sh-head');
  const icon = el('div', 'gta-sh-icon');
  const title = el('div', 'gta-sh-title');
  head.append(icon, title);
  const lineEls = [el('div', 'gta-sh-line'), el('div', 'gta-sh-line'), el('div', 'gta-sh-line gta-sh-l3')];
  for (const l of lineEls) l.style.display = 'none';
  const meterWrap = el('div', 'gta-sh-meter');
  const caption = el('div', 'gta-sh-caption');
  const track = el('div', 'gta-sh-track');
  const fill = el('div', 'gta-sh-fill');
  track.append(fill);
  meterWrap.append(caption, track);
  const noteEl = el('div', 'gta-sh-note');
  noteEl.style.display = 'none';
  panel.append(head, noteEl, ...lineEls, meterWrap);
  const action = el('button', 'gta-sh-action');
  action.type = 'button';
  root.append(panel, action);
  meterWrap.style.display = 'none';
  root.style.display = 'none';
  ui.append(root);
  const unregisterPanel = registerActivityPanel(root);

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
  const unsubSource = onInputSourceChange(() => paintGlyph());

  // Last written strings and flags, so set() touches the DOM only on a change.
  const last: Record<string, string> = {};
  let shown = false;
  let colorNow = '';
  let meterOn = false;
  let fillClass = '';
  let actionShown = false;
  let noteOn = false;
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

  const onPointerDown = (e: Event): void => e.stopPropagation();
  const onClick = (): void => fire();
  action.addEventListener('pointerdown', onPointerDown);
  action.addEventListener('click', onClick);

  function onKey(e: KeyboardEvent): void {
    if (e.code !== KEYS.jobAction || e.repeat || isTyping(e) || !actionShown) return;
    e.preventDefault();
    fire();
  }
  window.addEventListener('keydown', onKey);

  function set(v: ShiftHudView | null): void {
    const p = firstPad();
    const down = !!p?.buttons[JOB_PAD_BUTTON]?.pressed;
    const padPressed = down && !prevPad;
    prevPad = down;

    if (!v) {
      if (shown) {
        root.style.display = 'none';
        shown = false;
      }
      showing.delete(me);
      setActivityOn('shift', showing.size > 0);
      actionShown = false;
      return;
    }
    if (!shown) {
      root.style.display = 'flex';
      shown = true;
      quietRegionBanner(8000);
    }
    showing.add(me);
    setActivityOn('shift', true);

    const note = v.note ? v.note.trim() : '';
    if (note) {
      text('note', noteEl, note);
      if (!noteOn) {
        noteOn = true;
        noteEl.style.display = '';
      }
    } else if (noteOn) {
      noteOn = false;
      noteEl.style.display = 'none';
      last.note = '';
    }

    if (colorNow !== v.color) {
      colorNow = v.color;
      panel.style.borderLeftColor = v.color;
    }
    text('icon', icon, v.icon);
    text('title', title, v.title);

    for (let i = 0; i < lineEls.length; i++) {
      const on = i < v.lines.length && i < 3;
      if (on !== lineOn[i]) {
        lineOn[i] = on;
        lineEls[i].style.display = on ? '' : 'none';
      }
      text(`line${i}`, lineEls[i], on ? v.lines[i] : '');
    }

    if (v.meter !== null) {
      if (!meterOn) {
        meterOn = true;
        meterWrap.style.display = '';
      }
      const frac = Math.max(0, Math.min(1, v.meter.frac));
      const pct = Math.round(frac * 100);
      text('caption', caption, `${v.meter.label} ${pct}%`);
      const cls = frac > 0.4 ? '' : frac > 0.15 ? 'gta-sh-amber' : 'gta-sh-red';
      if (cls !== fillClass) {
        fillClass = cls;
        fill.className = cls ? `gta-sh-fill ${cls}` : 'gta-sh-fill';
      }
      const w = `${pct}%`;
      if (last.fill !== w) {
        last.fill = w;
        fill.style.width = w;
      }
    } else if (meterOn) {
      meterOn = false;
      meterWrap.style.display = 'none';
    }

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

  function onAction(cb: () => void): () => void {
    callbacks.push(cb);
    return () => {
      const i = callbacks.indexOf(cb);
      if (i >= 0) callbacks.splice(i, 1);
    };
  }

  function dispose(): void {
    window.removeEventListener('keydown', onKey);
    action.removeEventListener('pointerdown', onPointerDown);
    action.removeEventListener('click', onClick);
    unsubSource();
    showing.delete(me);
    setActivityOn('shift', showing.size > 0);
    unregisterPanel();
    root.remove();
    callbacks.length = 0;
    actionShown = false;
  }

  return { set, onAction, dispose };
}
