// Quiet HUD: need bars, stamina, a clay-body figure, clock and place, context prompt, toasts, busy bar.
import { DOM, LAYOUT, STAMINA } from '../config';
import type { BodyPart, BodyState, CrackLevel, Hud, HudState } from '../game/types';
import { HAVEN_NAME } from '../sim/regions';
const CLAY = '#b9825a';
const CLAY_BROKEN = '#6b4530';
const GREY = '#a7aeae';
const AMBER = '#e0a030';
const RED = '#d64a3a';
const BAR_OK = '#cfd8c4';
const TOAST_MAX = 3;

interface Geo { x: number; y: number; w: number; h: number; rx: number }
const GEO: Record<BodyPart, Geo> = {
  head: { x: 13, y: 0, w: 14, h: 14, rx: 6 },
  chest: { x: 11, y: 15, w: 18, h: 16, rx: 3 },
  armL: { x: 3, y: 15, w: 6, h: 16, rx: 3 },
  armR: { x: 31, y: 15, w: 6, h: 16, rx: 3 },
  legL: { x: 11, y: 33, w: 8, h: 22, rx: 3 },
  legR: { x: 21, y: 33, w: 8, h: 22, rx: 3 },
};
const PARTS = Object.keys(GEO) as BodyPart[];
const NEEDS = [
  { key: 'warmth', label: 'Warm' }, { key: 'water', label: 'Water' }, { key: 'food', label: 'Food' }, { key: 'calm', label: 'Calm' },
] as const;

function crackPath(p: BodyPart, level: CrackLevel): string {
  const { x, y, w, h } = GEO[p];
  if (level === 1) return `M${x + w * 0.3} ${y + 1}L${x + w * 0.45} ${y + h * 0.5}L${x + w * 0.35} ${y + h - 1}`;
  if (level === 2) {
    return `M${x + w * 0.3} ${y + 1}L${x + w * 0.45} ${y + h * 0.5}L${x + w * 0.35} ${y + h - 1}` +
      `M${x + w * 0.8} ${y + 1}L${x + w * 0.6} ${y + h * 0.6}`;
  }
  if (level === 3) {
    return `M${x + w * 0.2} ${y}L${x + w * 0.5} ${y + h * 0.35}L${x + w * 0.3} ${y + h * 0.6}L${x + w * 0.75} ${y + h}`;
  }
  return '';
}

function veinPath(p: BodyPart): string {
  const { x, y, w, h } = GEO[p];
  return `M${x + w * 0.5} ${y + h * 0.1}L${x + w * 0.5} ${y + h * 0.9}` +
    `M${x + w * 0.5} ${y + h * 0.4}L${x + w * 0.15} ${y + h * 0.7}` +
    `M${x + w * 0.5} ${y + h * 0.6}L${x + w * 0.85} ${y + h * 0.2}`;
}

function buildFigure(): { svg: SVGSVGElement; parts: Record<BodyPart, SVGRectElement>; cracks: Record<BodyPart, SVGPathElement>;
  greys: Record<BodyPart, SVGRectElement>; veins: SVGPathElement } {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 56');
  svg.setAttribute('width', '40');
  svg.setAttribute('height', '56');
  svg.style.cssText = 'display:block;flex:none;overflow:visible';
  const parts = {} as Record<BodyPart, SVGRectElement>;
  const cracks = {} as Record<BodyPart, SVGPathElement>;
  const greys = {} as Record<BodyPart, SVGRectElement>;
  for (const p of PARTS) {
    const g = GEO[p];
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', String(g.x)); rect.setAttribute('y', String(g.y));
    rect.setAttribute('width', String(g.w)); rect.setAttribute('height', String(g.h));
    rect.setAttribute('rx', String(g.rx));
    rect.setAttribute('fill', CLAY);
    svg.appendChild(rect);
    parts[p] = rect;
    const crack = document.createElementNS(NS, 'path');
    crack.setAttribute('fill', 'none');
    crack.setAttribute('stroke-linecap', 'round');
    svg.appendChild(crack);
    cracks[p] = crack;
    const grey = document.createElementNS(NS, 'rect');
    grey.setAttribute('x', String(g.x)); grey.setAttribute('y', String(g.y));
    grey.setAttribute('width', String(g.w)); grey.setAttribute('height', String(g.h));
    grey.setAttribute('rx', String(g.rx));
    grey.setAttribute('fill', GREY);
    grey.setAttribute('opacity', '0');
    grey.setAttribute('pointer-events', 'none');
    svg.appendChild(grey);
    greys[p] = grey;
  }
  const veins = document.createElementNS(NS, 'path');
  veins.setAttribute('fill', 'none');
  veins.setAttribute('stroke', '#4b5252');
  veins.setAttribute('stroke-width', '0.8');
  veins.setAttribute('stroke-linecap', 'round');
  svg.appendChild(veins);
  return { svg, parts, cracks, greys, veins };
}

export function createHud(ui: HTMLElement): Hud {
  const root = document.createElement('div');
  root.id = DOM.hud;
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;' +
    'font:12px/1.25 system-ui,sans-serif;color:#f4f7f2;text-shadow:0 1px 2px #000';
  const style = document.createElement('style');
  // Portrait: prompt and busy bar float above the touch block (its top edge is 264 px + safe-area inset). Landscape: centred in the middle third.
  style.textContent = '@keyframes dayg-hud-pulse{0%,100%{opacity:1}50%{opacity:.35}}' +
    '.dayg-hud-pulse{animation:dayg-hud-pulse 1s ease-in-out infinite}' +
    '@keyframes dayg-toast-out{to{opacity:0}}' +
    '.dayg-hud-line{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:fit-content;max-width:100%;' +
    'margin-left:auto;padding:0 5px;border-radius:4px;background:rgba(0,0,0,.32)}' +
    '.dayg-hud-prompt{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(276px + env(safe-area-inset-bottom));' +
    'max-width:60vw;padding:7px 14px;border-radius:999px;background:rgba(20,26,20,.78);text-align:center;white-space:normal;' +
    'font-size:13px;display:none}' +
    '.dayg-hud-busy{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(340px + env(safe-area-inset-bottom));' +
    'width:40vw;max-width:260px;display:none;text-align:center;background:rgba(20,26,20,.6);border-radius:8px;padding:5px 8px 6px}' +
    '@media (orientation: landscape){' +
    '.dayg-hud-prompt,.dayg-hud-busy{left:33.3333%;right:33.3333%;width:auto;max-width:none;transform:none}' +
    '.dayg-hud-prompt{bottom:calc(120px + env(safe-area-inset-bottom))}' +
    '.dayg-hud-busy{bottom:calc(170px + env(safe-area-inset-bottom))}}';
  root.appendChild(style);

  // Top-left: need bars + figure. Everything stays inside the top 64 px.
  const left = document.createElement('div');
  left.style.cssText = 'position:absolute;left:calc(8px + env(safe-area-inset-left));' +
    `top:calc(4px + env(safe-area-inset-top));display:flex;gap:6px;align-items:flex-start;max-height:${LAYOUT.topBar - 8}px`;
  const bars = document.createElement('div');
  bars.style.cssText = 'display:flex;flex-direction:column;gap:1px;width:130px;padding:2px 5px;box-sizing:border-box;' +
    'border-radius:6px;background:rgba(0,0,0,.32)';
  const barEls: Record<string, { fill: HTMLDivElement; row: HTMLDivElement }> = {};
  for (const n of [...NEEDS, { key: 'stamina', label: 'Stamina' }]) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;height:12px';
    const label = document.createElement('div');
    label.textContent = n.label;
    label.style.cssText = 'width:50px;font-size:12px;line-height:12px;opacity:.95';
    const track = document.createElement('div');
    track.style.cssText = 'flex:1;height:6px;background:rgba(0,0,0,.45);border-radius:3px;overflow:hidden';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:100%;background:${BAR_OK};border-radius:2px`;
    track.appendChild(fill);
    row.append(label, track);
    bars.appendChild(row);
    barEls[n.key] = { fill, row };
  }
  const fig = buildFigure();
  fig.svg.style.marginTop = '0';
  left.append(bars, fig.svg);

  // Top-right: clock, place, stance, carry.
  // Top-right: four lines at most (clock, place, safe, stance + carry) so the stack ends inside the 64 px bar.
  const right = document.createElement('div');
  // Sized to its content, capped so it never reaches under the left column (the bars end near 184 px).
  right.style.cssText = 'position:absolute;right:calc(8px + env(safe-area-inset-right));' +
    `top:calc(4px + env(safe-area-inset-top));max-width:calc(100% - 200px - env(safe-area-inset-left));text-align:right;font-size:12px;line-height:15px;` +
    'display:flex;flex-direction:column;align-items:flex-end;gap:0';
  const line = (): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'dayg-hud-line';
    d.style.cssText = 'line-height:15px';
    return d;
  };
  const clockEl = line();
  const placeEl = line();
  const safeEl = line();
  const statusRow = document.createElement('div');
  statusRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;max-width:100%';
  const stanceEl = line();
  const carryEl = line();
  statusRow.append(stanceEl, carryEl);
  right.append(clockEl, placeEl, safeEl, statusRow);

  // Centre: busy bar above the prompt, prompt, toasts (toasts keep clear of the VIEW button on the right).
  const busy = document.createElement('div');
  busy.className = 'dayg-hud-busy';
  const busyLabel = document.createElement('div');
  busyLabel.style.cssText = 'font-size:12px;line-height:14px;margin-bottom:3px';
  const busyTrack = document.createElement('div');
  busyTrack.style.cssText = 'height:6px;background:rgba(0,0,0,.45);border-radius:3px;overflow:hidden';
  const busyFill = document.createElement('div');
  busyFill.style.cssText = `height:100%;width:0;background:${BAR_OK}`;
  busyTrack.appendChild(busyFill);
  busy.append(busyLabel, busyTrack);

  const prompt = document.createElement('div');
  prompt.className = 'dayg-hud-prompt';

  const toasts = document.createElement('div');
  toasts.style.cssText = 'position:absolute;left:0;right:64px;text-align:center;' +
    `top:calc(${LAYOUT.topBar + 8}px + env(safe-area-inset-top));display:flex;flex-direction:column;align-items:center;gap:4px`;

  root.append(left, right, busy, prompt, toasts);
  ui.appendChild(root);

  // Change cache: the DOM is only touched when a value changes.
  const last = new Map<string, string>();
  const put = (key: string, value: string, apply: (v: string) => void): void => {
    if (last.get(key) === value) return;
    last.set(key, value);
    apply(value);
  };

  const applyFigure = (body: BodyState): void => {
    const inf = body.infection;
    for (const p of PARTS) {
      const level = body.cracks[p];
      const broken = level === 3;
      put(`fig.${p}.fill`, broken ? CLAY_BROKEN : CLAY, (v) => fig.parts[p].setAttribute('fill', v));
      put(`fig.${p}.crack`, String(level), () => {
        const c = fig.cracks[p];
        c.setAttribute('d', crackPath(p, level));
        c.setAttribute('stroke', level === 1 ? '#f4e8d8' : '#2a1a10');
        c.setAttribute('stroke-width', level === 3 ? '2' : '1.2');
      });
      const stage = inf && inf.part === p ? inf.stage : -1;
      const opacity = stage < 0 ? 0 : [0.3, 0.55, 0.8, 0.9][stage];
      put(`fig.${p}.grey`, String(opacity), (v) => fig.greys[p].setAttribute('opacity', v));
    }
    const veinOn = inf && inf.stage >= 2 ? inf.part : null;
    put('fig.veins', veinOn ?? '', (v) => fig.veins.setAttribute('d', v ? veinPath(v as BodyPart) : ''));
    const greyscale = inf && inf.stage >= 3 ? 'grayscale(0.85)' : 'none';
    put('fig.filter', greyscale, (v) => { fig.svg.style.filter = v === 'none' ? '' : v; });
  };

  return {
    root,
    update(s: HudState) {
      const h = Math.floor(s.hourOfDay), m = Math.floor((s.hourOfDay - h) * 60);
      const hh = String(h).padStart(2, '0'), mm = String(m).padStart(2, '0');
      for (const n of [...NEEDS, { key: 'stamina', label: '' }] as const) {
        const value = n.key === 'stamina' ? (s.stamina / STAMINA.max) * 100 : s.needs[n.key];
        const el = barEls[n.key];
        const shown = Math.max(0, Math.min(100, value));
        const colour = value < 10 ? RED : value < 30 ? AMBER : BAR_OK;
        const pulse = value <= 0;
        put(`bar.${n.key}.w`, `${shown}`, (v) => { el.fill.style.width = `${v}%`; });
        put(`bar.${n.key}.c`, colour, (v) => { el.fill.style.background = v; });
        put(`bar.${n.key}.p`, pulse ? '1' : '0', (v) => { el.row.classList.toggle('dayg-hud-pulse', v === '1'); });
      }
      put('clock', `${s.night ? '☾ ' : ''}${hh}:${mm} · Day ${s.day} · ${s.season} · ${s.weather}`,
        (v) => { clockEl.textContent = v; });
      put('place', s.regionName ?? '', (v) => { placeEl.textContent = v; placeEl.style.display = v ? '' : 'none'; });
      const safe = s.haven ? `Safe: ${HAVEN_NAME[s.haven]}` : '';
      put('safe', safe, (v) => { safeEl.textContent = v; safeEl.style.display = v ? '' : 'none'; });
      put('stance', s.stance === 'crouch' ? 'crouched' : '', (v) => { stanceEl.textContent = v; stanceEl.style.display = v ? '' : 'none'; });
      const over = s.carry.weight > s.carry.capacity;
      put('carry', `${s.carry.weight.toFixed(1)} / ${s.carry.capacity} kg|${over}`, (v) => {
        carryEl.textContent = v.split('|')[0];
        carryEl.style.color = v.endsWith('true') ? AMBER : '';
      });
      applyFigure(s.body);
      put('busy', s.busy ? `${s.busy.label}|${s.busy.progress.toFixed(2)}` : '', (v) => {
        if (!s.busy) { busy.style.display = 'none'; return; }
        busy.style.display = 'block';
        busyLabel.textContent = s.busy.label;
        busyFill.style.width = `${Math.max(0, Math.min(1, s.busy.progress)) * 100}%`;
      });
    },
    prompt(text: string | null) {
      put('prompt', text ?? '', (v) => {
        prompt.textContent = v;
        prompt.style.display = v ? 'block' : 'none';
      });
    },
    toast(text: string, seconds = 3) {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.cssText = 'padding:4px 10px;border-radius:6px;background:rgba(20,26,20,.6);transition:opacity .4s';
      toasts.appendChild(el);
      while (toasts.children.length > TOAST_MAX) toasts.firstElementChild?.remove();
      setTimeout(() => {
        el.style.animation = 'dayg-toast-out .4s forwards';
        setTimeout(() => el.remove(), 450);
      }, Math.max(0, seconds) * 1000);
    },
  };
}
