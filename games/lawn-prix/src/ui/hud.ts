// The race HUD: place, lap and time, speed, drift charge, countdown, flash text, and the results panel.
// Plain DOM and inline styles, one container (#lp-hud) under the shared #ui element. The container ignores
// the pointer; only the results panel's buttons take clicks.
import { VEHICLES, type ItemKind, type VehicleId } from '../config';

export interface HudInfo {
  lap: number;        // current lap, 1..laps
  laps: number;
  place: number;      // 0 = 1st
  count: number;      // karts in the race
  time: number;       // race time, s
  speed: number;      // m/s
  charge01: number;   // drift charge 0..1 (1 = boost ready)
  boosting: boolean;
  /** Held item, or null (shown in an item slot; STUB until Epic 2). */
  item: ItemKind | null;
  /** Spinning out right now (a 'SPUN OUT!' wobble; STUB until Epic 2). */
  spinning: boolean;
}

export interface ResultRow {
  place: number;      // 0 = 1st
  name: string;
  vehicle: VehicleId;
  color: number;
  time: number | null; // null = did not finish
  me: boolean;
}

export interface Hud {
  update(info: HudInfo): void;
  /** 3, 2, 1, 'GO', or null to hide. */
  countdown(v: number | 'GO' | null): void;
  /** Big centre text for a moment ('LAP 2', 'FINAL LAP', 'FINISH!'). */
  flash(text: string): void;
  /** Results table with a Race Again button (onAgain fires once) and a Garage button (onGarage). */
  showResults(rows: readonly ResultRow[], onAgain: () => void, onGarage: () => void): void;
  dispose(): void;
}

const GOLD = '#f7d23a';
const SHADOW = '0 2px 0 #1b1b1b,0 0 8px rgba(0,0,0,0.6)';
const SUFFIX = ['th', 'st', 'nd', 'rd'];

const KEYFRAMES = `
@keyframes lp-pop { 0% { transform: scale(0.4); opacity: 0 } 30% { transform: scale(1.15); opacity: 1 } 55%, 100% { transform: scale(1); opacity: 1 } }
@keyframes lp-flash { 0% { transform: scale(0.6); opacity: 0 } 15% { transform: scale(1.1); opacity: 1 } 25% { transform: scale(1); opacity: 1 } 80% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lp-boost { 0%, 100% { background: ${GOLD}; box-shadow: 0 0 6px #ffb300 } 50% { background: #fff3a6; box-shadow: 0 0 18px #ffd84a } }
`;

function hexCss(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st ... */
function ordinal(n: number): string {
  const v = n % 100;
  const s = v >= 11 && v <= 13 ? 'th' : (n % 10 < 4 ? SUFFIX[n % 10] : 'th');
  return `${n}${s}`;
}

/** m:ss.t */
function fmtTime(t: number): string {
  const tenths = Math.max(0, Math.round(t * 10));
  const m = Math.floor(tenths / 600);
  const rem = tenths % 600;
  return `${m}:${String(Math.floor(rem / 10)).padStart(2, '0')}.${rem % 10}`;
}

/** Remembers the last value written per node and property, so per-frame updates touch the DOM only on change. */
const seen = new WeakMap<HTMLElement, Record<string, string>>();
function changed(node: HTMLElement, key: string, value: string): boolean {
  let rec = seen.get(node);
  if (!rec) {
    rec = {};
    seen.set(node, rec);
  }
  if (rec[key] === value) return false;
  rec[key] = value;
  return true;
}

/** Restarts a CSS animation on a node (so a repeated pop or flash plays again). */
function restart(node: HTMLElement, animation: string): void {
  node.style.animation = 'none';
  void node.offsetWidth;
  node.style.animation = animation;
}

export function createHud(ui: HTMLElement): Hud {
  const box = el('div',
    'position:absolute;inset:0;overflow:hidden;pointer-events:none;color:#fff;'
    + 'font-family:system-ui,sans-serif;text-shadow:' + SHADOW);
  box.id = 'lp-hud';
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  box.appendChild(style);

  const widgets = el('div', 'position:absolute;inset:0;pointer-events:none;display:none'); // shown by the first update()

  // Top-left: place.
  const place = el('div',
    'position:absolute;left:16px;top:12px;font-size:clamp(28px,6vw,52px);font-weight:900;line-height:1;'
    + 'font-variant-numeric:tabular-nums');
  place.id = 'lp-place';

  // Top-right: lap and time.
  const lapBox = el('div',
    'position:absolute;right:16px;top:12px;text-align:right;line-height:1.2;font-variant-numeric:tabular-nums');
  const lapText = el('div', 'font-size:clamp(16px,3.5vw,24px);font-weight:800');
  lapText.id = 'lp-lap';
  const timeText = el('div', 'font-size:clamp(14px,3vw,20px);font-weight:700');
  timeText.id = 'lp-time';
  lapBox.append(lapText, timeText);

  // Bottom-right: speed badge.
  const speedBadge = el('div',
    'position:absolute;right:16px;bottom:16px;width:84px;height:84px;box-sizing:border-box;border-radius:50%;'
    + 'border:4px solid #fff;background:rgba(10,30,15,0.7);display:flex;flex-direction:column;'
    + 'align-items:center;justify-content:center;line-height:1');
  speedBadge.id = 'lp-speed';
  const speedNum = el('div', 'font-size:30px;font-weight:900;font-variant-numeric:tabular-nums');
  const speedUnit = el('div', 'font-size:12px;font-weight:700;margin-top:2px', 'km/h');
  speedBadge.append(speedNum, speedUnit);

  // Bottom-centre: drift charge bar.
  const charge = el('div',
    'position:absolute;left:50%;bottom:24px;transform:translateX(-50%);width:min(240px,50vw);height:16px;'
    + 'box-sizing:border-box;border-radius:8px;border:2px solid #fff;background:rgba(0,0,0,0.45);overflow:hidden;display:none');
  charge.id = 'lp-charge';
  const chargeFill = el('div', 'height:100%;width:0%;background:#3a8de0;border-radius:6px');
  charge.appendChild(chargeFill);

  // Centre: countdown and flash text.
  const countdownWrap = el('div',
    'position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:none');
  const countdownEl = el('div',
    'font-size:clamp(90px,22vw,200px);font-weight:900;line-height:1;-webkit-text-stroke:3px #1b1b1b;'
    + 'paint-order:stroke fill;font-variant-numeric:tabular-nums');
  countdownEl.id = 'lp-countdown';
  countdownWrap.appendChild(countdownEl);

  const flashWrap = el('div',
    'position:absolute;inset:0;display:none;align-items:flex-start;justify-content:center;padding-top:28%;pointer-events:none');
  const flashEl = el('div',
    'font-size:clamp(28px,7vw,64px);font-weight:900;color:' + GOLD + ';text-align:center;line-height:1.1;'
    + '-webkit-text-stroke:2px #3a2400;paint-order:stroke fill');
  flashEl.id = 'lp-flash';
  flashWrap.appendChild(flashEl);

  widgets.append(place, lapBox, speedBadge, charge, countdownWrap, flashWrap);
  box.appendChild(widgets);

  let flashTimer: number | undefined;
  let hiddenForResults = true; // widgets stay hidden (behind the menu) until the countdown or first update
  let panel: HTMLElement | null = null;
  let resultKey: ((e: KeyboardEvent) => void) | null = null;

  function closeResults(): void {
    if (panel) panel.remove();
    panel = null;
    if (resultKey) window.removeEventListener('keydown', resultKey);
    resultKey = null;
  }

  function buildPanel(rows: readonly ResultRow[], onAgain: () => void, onGarage: () => void): HTMLElement {
    const p = el('div',
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,520px);max-height:90%;'
      + 'overflow-y:auto;box-sizing:border-box;padding:18px;border-radius:16px;background:rgba(8,36,18,0.95);'
      + 'border:3px solid ' + GOLD + ';box-shadow:0 10px 40px rgba(0,0,0,0.5);pointer-events:auto;text-shadow:none');
    p.id = 'lp-results';

    p.appendChild(el('h2',
      'margin:0 0 12px;text-align:center;font-size:28px;font-weight:900;letter-spacing:2px;color:' + GOLD,
      'RESULTS'));

    const sorted = [...rows].sort((a, b) => a.place - b.place);
    for (const row of sorted) {
      const line = el('div',
        'display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:6px;border-radius:10px;'
        + `background:${row.me ? 'rgba(247,210,58,0.28)' : 'rgba(255,255,255,0.06)'};`
        + `font-weight:${row.me ? 800 : 600}`);
      const placeCell = el('span', 'width:44px;flex:none;text-align:left', ordinal(row.place + 1));
      const dot = el('span',
        `width:14px;height:14px;flex:none;border-radius:50%;border:2px solid #fff;background:${hexCss(row.color)}`);
      const name = el('span', 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left', row.name);
      const vehicle = el('span', 'flex:none;font-size:13px;opacity:0.8', VEHICLES[row.vehicle].name);
      const time = el('span', 'flex:none;width:70px;text-align:right;font-variant-numeric:tabular-nums',
        row.time === null ? 'DNF' : fmtTime(row.time));
      line.append(placeCell, dot, name, vehicle, time);
      p.appendChild(line);
    }

    const buttons = el('div', 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:14px');
    const again = el('button',
      'padding:12px 22px;border:none;border-radius:12px;background:' + GOLD + ';color:#1b1b1b;'
      + 'font:900 16px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 0 #8a6a00', 'Race again');
    again.id = 'lp-again';
    again.type = 'button';
    const garage = el('button',
      'padding:12px 22px;border-radius:12px;background:rgba(255,255,255,0.14);color:#fff;'
      + 'border:2px solid rgba(255,255,255,0.5);font:800 16px system-ui,sans-serif;cursor:pointer', 'Garage');
    garage.id = 'lp-garage';
    garage.type = 'button';
    buttons.append(again, garage);
    p.appendChild(buttons);
    p.appendChild(el('div', 'margin-top:8px;text-align:center;font-size:12px;opacity:0.7', 'Enter = race again'));

    let done = false;
    const finish = (cb: () => void): void => {
      if (done) return;
      done = true;
      closeResults();
      cb();
    };
    again.onclick = () => finish(onAgain);
    garage.onclick = () => finish(onGarage);
    resultKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      finish(onAgain);
    };
    window.addEventListener('keydown', resultKey);
    return p;
  }

  const hud: Hud = {
    update(i: HudInfo): void {
      if (hiddenForResults) {
        widgets.style.display = '';
        hiddenForResults = false;
      }
      const placeText = `${ordinal(i.place + 1)} / ${i.count}`;
      if (changed(place, 't', placeText)) place.textContent = placeText;

      const lapStr = `LAP ${i.lap}/${i.laps}`;
      if (changed(lapText, 't', lapStr)) lapText.textContent = lapStr;
      const timeStr = fmtTime(i.time);
      if (changed(timeText, 't', timeStr)) timeText.textContent = timeStr;

      const kmh = String(Math.round(Math.abs(i.speed) * 3.6));
      if (changed(speedNum, 't', kmh)) speedNum.textContent = kmh;

      const c = clamp01(i.charge01);
      const showCharge = i.boosting || c > 0;
      if (changed(charge, 'd', showCharge ? '' : 'none')) charge.style.display = showCharge ? '' : 'none';
      const width = i.boosting ? '100%' : `${(c * 100).toFixed(1)}%`;
      if (changed(chargeFill, 'w', width)) chargeFill.style.width = width;
      if (i.boosting) {
        if (changed(chargeFill, 'a', 'boost')) chargeFill.style.animation = 'lp-boost 0.5s ease-in-out infinite';
      } else {
        const colour = c >= 1 ? '#f07a1e' : '#3a8de0';
        if (changed(chargeFill, 'a', 'none')) chargeFill.style.animation = 'none';
        if (changed(chargeFill, 'bg', colour)) chargeFill.style.background = colour;
      }
    },

    countdown(v: number | 'GO' | null): void {
      if (v === null) {
        countdownWrap.style.display = 'none';
        return;
      }
      if (hiddenForResults) {
        widgets.style.display = '';
        hiddenForResults = false;
      }
      countdownWrap.style.display = 'flex';
      const text = v === 'GO' ? 'GO!' : String(v);
      if (changed(countdownEl, 't', text)) countdownEl.textContent = text;
      if (changed(countdownEl, 'c', v === 'GO' ? '#7be36b' : '#fff')) {
        countdownEl.style.color = v === 'GO' ? '#7be36b' : '#fff';
      }
      restart(countdownEl, 'lp-pop 0.9s ease-out both');
    },

    flash(text: string): void {
      flashEl.textContent = text;
      flashWrap.style.display = 'flex';
      restart(flashEl, 'lp-flash 1.2s ease-out both');
      if (flashTimer !== undefined) clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => {
        flashWrap.style.display = 'none';
        flashTimer = undefined;
      }, 1200);
    },

    showResults(rows: readonly ResultRow[], onAgain: () => void, onGarage: () => void): void {
      closeResults();
      widgets.style.display = 'none';
      hiddenForResults = true;
      countdownWrap.style.display = 'none';
      panel = buildPanel(rows, onAgain, onGarage);
      box.appendChild(panel);
    },

    dispose(): void {
      closeResults();
      if (flashTimer !== undefined) clearTimeout(flashTimer);
      flashTimer = undefined;
      box.remove();
    },
  };
  ui.appendChild(box);
  return hud;
}
