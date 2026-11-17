// DOM HUD: title / pause card with controls, JSR-style trick text, combo, score, speed, flow meter, stick display.
import { PALETTE, type ComboView, type Player } from './config';
import type { Device } from './input';

export type GameState = 'title' | 'playing' | 'paused';

export interface HudFrame {
  p: Player;
  combo: ComboView;
  state: GameState;
  device: Device;
  /** The trick stick now, and its recent path (Recognizer.trail()). */
  stick: { x: number; y: number };
  trail: { x: number; y: number }[];
  trainMode?: boolean;
}

export interface Hud {
  update(f: HudFrame): void;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const C = {
  ink: hex(PALETTE.ink), pink: hex(PALETTE.pink), cyan: hex(PALETTE.cyan), lime: hex(PALETTE.lime),
  purple: hex(PALETTE.purple), yellow: hex(PALETTE.yellow), red: '#ff2d4b',
};

const KBM_LINES = [
  'A / D carve · spin in the air',
  'W push · front flip in the air',
  'S brake · back flip in the air',
  'Mouse = trick stick: pull back, flick forward → Ollie',
  'flick ↖ Kickflip · ↗ Heelflip · ← / → Shove-its',
  'swing through ← or → on the way up → Varials / 360 Flip',
  'In the air: flick for flip tricks',
  'Space hold + release → Ollie',
  'LMB / RMB (or Q / E) grabs · hold on the ground: manuals (balance with W / S)',
  'Shift boost (burns flow)',
  'R back to the island',
  'Arrow keys = trick stick too',
  'T or Tab: the trick book (every trick and how to do it)',
];
const TOUCH_LINES = [
  'Left thumb: joystick (anywhere on the left): carve · push · brake',
  'In the air the left stick spins (←/→) and flips (↑/↓)',
  'Right thumb: swipe tricks, like the mouse: swipe ↓ then ↑ → Ollie',
  '↓ then ↖ Kickflip · ↓ then ↗ Heelflip · ↓ then ← / → Shove-its',
  'Tap the right side: Ollie · press, hold still, let go: big Ollie',
  'Swipe in the air for flip tricks · GRAB buttons (hold) · BOOST',
  '↺ back to the island · 📖 the trick book · turn your phone sideways',
];

const PAD_LINES = [
  'Left stick carve / spin / flip',
  'Right stick tricks (Skate style)',
  'A ollie',
  'LT / RT grabs · hold on the ground: manuals (balance with the left stick)',
  'RB boost',
  'B brake',
  'Y reset',
  'View / Back: the trick book',
];

function buildCss(): string {
  return `
#ab-hud{position:fixed;inset:0;pointer-events:none;overflow:hidden;font-family:"Arial Black",Impact,system-ui,sans-serif;color:#fff}
#ab-hud *{box-sizing:border-box}
#ab-hud .hide{display:none!important}
#ab-hud .gr{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-10deg);display:inline-block;line-height:1;white-space:nowrap}
#ab-hud .ab-card{position:fixed;inset:0 0 120px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:72px 16px 16px;text-align:center;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;background:radial-gradient(ellipse at 50% 45%,rgba(23,7,46,.6),rgba(23,7,46,.2) 70%,transparent)}
#ab-hud .ab-card.show{opacity:1;visibility:visible}
#ab-hud .ab-logo{font-size:clamp(40px,8.5vw,108px);background:linear-gradient(90deg,${C.cyan},${C.pink} 45%,${C.yellow});-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(3px 3px 0 ${C.ink}) drop-shadow(6px 6px 0 ${C.pink})}
#ab-hud .ab-sub{font-family:system-ui,sans-serif;font-weight:700;font-size:clamp(14px,2vw,20px);color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-cheat{position:fixed;top:14px;left:50%;transform:translateX(-50%) skewX(-10deg);z-index:6;font-size:clamp(14px,2vw,20px);color:${C.ink};background:linear-gradient(90deg,${C.cyan},${C.yellow});padding:5px 14px;border:2px solid ${C.ink};box-shadow:4px 4px 0 ${C.pink}}
#ab-hud .ab-prompt{font-size:clamp(22px,3.4vw,38px);color:${C.yellow};text-shadow:3px 3px 0 ${C.ink};animation:ab-pulse 1.2s ease-in-out infinite}
#ab-hud .ab-cols{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;max-width:960px;width:100%}
#ab-hud .ab-col{flex:1 1 300px;max-width:440px;background:rgba(23,7,46,.75);border:3px solid ${C.purple};padding:12px 16px;opacity:.55;transition:opacity .2s,border-color .2s;text-align:left}
#ab-hud .ab-col.on{opacity:1;border-color:${C.pink}}
#ab-hud .ab-colh{margin:0 0 6px;font-size:clamp(15px,2vw,20px);color:${C.cyan};text-transform:uppercase}
#ab-hud .ab-col ul{margin:0;padding:0;list-style:none;font:600 clamp(12px,1.4vw,15px)/1.45 system-ui,sans-serif}
#ab-hud .ab-col li{margin:0 0 3px}
@media (max-height:500px){#ab-hud .ab-logo{font-size:38px!important}#ab-hud .ab-sub{display:none}#ab-hud .ab-col ul{font-size:12px;line-height:1.3}#ab-hud .ab-card{gap:6px!important;padding-top:8px!important;bottom:60px!important}}
#ab-hud .ab-combo{position:fixed;left:50%;top:30%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
#ab-hud .ab-lines{display:flex;flex-direction:column;align-items:center;gap:2px}
#ab-hud .ab-line{color:#fff;text-shadow:2px 2px 0 ${C.ink},4px 4px 0 ${C.purple}}
#ab-hud .ab-line.r0{font-size:34px;color:${C.yellow}}
#ab-hud .ab-line.r1{font-size:26px;opacity:.85}
#ab-hud .ab-line.r2{font-size:20px;opacity:.65}
#ab-hud .ab-line.r3{font-size:16px;opacity:.45}
#ab-hud .ab-pts{font-size:clamp(34px,5vw,58px);text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink}}
#ab-hud .ab-link{width:200px;height:6px;background:rgba(23,7,46,.6);border:2px solid ${C.ink};transform:skewX(-10deg);overflow:hidden}
#ab-hud .ab-linkfill{height:100%;width:0;background:linear-gradient(90deg,${C.cyan},${C.pink})}
#ab-hud .ab-grind{font-size:18px;color:${C.lime};background:${C.ink};padding:3px 8px}
#ab-hud .ab-man{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px}
#ab-hud .ab-man-l{font-size:20px;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink},4px 4px 0 ${C.pink}}
#ab-hud .ab-man-bar{position:relative;width:240px;height:14px;background:linear-gradient(90deg,#ff2d4b,#ffe14d 30%,#7cffc4 45%,#7cffc4 55%,#ffe14d 70%,#ff2d4b);border:3px solid ${C.ink};transform:skewX(-12deg)}
#ab-hud .ab-man-dot{position:absolute;top:-6px;width:8px;height:20px;margin-left:-4px;background:#fff;border:2px solid ${C.ink}}
#ab-hud .ab-slamwrap{position:absolute;left:0;right:0;top:12%;text-align:center}
#ab-hud .ab-slam{font-size:clamp(44px,8vw,96px);color:#fff;text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink};animation:ab-slam 1.15s linear forwards}
#ab-hud .ab-bank{position:absolute;left:0;right:0;top:52%;transform:translateY(-50%);text-align:center}
#ab-hud .ab-bankwrap{display:flex;flex-direction:column;align-items:center;gap:6px;animation:ab-fade 1.6s linear forwards}
#ab-hud .ab-big{font-size:clamp(56px,11vw,130px);text-shadow:4px 4px 0 ${C.ink},8px 8px 0 ${C.pink}}
#ab-hud .ab-landed{color:${C.yellow};animation:ab-pop .45s ease-out both}
#ab-hud .ab-bailed{color:${C.red};animation:ab-shake .5s linear both}
#ab-hud .ab-bsub{font-size:clamp(16px,2.4vw,26px);color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-score{position:fixed;left:16px;top:16px}
#ab-hud .ab-score-n{font-size:clamp(28px,4vw,44px);text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink}}
#ab-hud .ab-best{margin-top:6px;font-size:clamp(14px,2vw,20px);color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-meter{height:14px;background:rgba(23,7,46,.6);border:2px solid ${C.ink};transform:skewX(-10deg);overflow:hidden}
#ab-hud .ab-meter>div{height:100%;width:0}
#ab-hud .ab-speed{position:fixed;right:16px;bottom:16px;width:min(220px,50vw);text-align:right}
#ab-hud .ab-kmh{font-size:clamp(40px,6vw,66px);text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink}}
#ab-hud .ab-kmhunit{font-size:16px;color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-speedfill{background:linear-gradient(90deg,${C.cyan},${C.lime})}
#ab-hud .ab-flow{position:fixed;left:16px;bottom:16px;width:min(240px,50vw)}
#ab-hud .ab-flowlabel{font-size:18px;color:${C.lime};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-flowfill{background:linear-gradient(90deg,${C.cyan},${C.pink} 55%,${C.yellow})}
#ab-hud .ab-flow.boost .ab-meter{animation:ab-glow .5s ease-in-out infinite alternate}
#ab-hud .ab-hint{margin-top:8px;font-size:15px;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
#ab-hud .ab-stick{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:84px;height:84px;border-radius:50%;background:rgba(23,7,46,.35);border:2px solid rgba(255,255,255,.5)}
#ab-hud .ab-stick svg{width:100%;height:100%;display:block;overflow:visible}
@keyframes ab-pulse{0%,100%{opacity:1;transform:skewX(-10deg) scale(1)}50%{opacity:.4;transform:skewX(-10deg) scale(1.05)}}
@keyframes ab-slam{0%{opacity:0;transform:skewX(-10deg) rotate(var(--tilt)) scale(1.6)}10.4%{opacity:1;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}62.6%{opacity:1;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}100%{opacity:0;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}}
@keyframes ab-fade{0%,78%{opacity:1}100%{opacity:0}}
@keyframes ab-pop{0%{opacity:0;transform:skewX(-10deg) scale(.4)}60%{opacity:1;transform:skewX(-10deg) scale(1.15)}100%{opacity:1;transform:skewX(-10deg) scale(1)}}
@keyframes ab-shake{0%{transform:skewX(-10deg) translateX(0)}15%{transform:skewX(-10deg) translateX(-12px)}30%{transform:skewX(-10deg) translateX(12px)}45%{transform:skewX(-10deg) translateX(-8px)}60%{transform:skewX(-10deg) translateX(8px)}75%{transform:skewX(-10deg) translateX(-4px)}100%{transform:skewX(-10deg) translateX(0)}}
@keyframes ab-glow{from{box-shadow:0 0 6px ${C.cyan}}to{box-shadow:0 0 22px ${C.pink}}}
`;
}

function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string, parent?: Element): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  parent?.appendChild(e);
  return e;
}

const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag: string, attrs: Record<string, string>, parent?: Element): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement;
  for (const k in attrs) e.setAttribute(k, attrs[k] ?? '');
  parent?.appendChild(e);
  return e;
}

// Writes only when the value differs from the last one written (this runs every frame).
const memo = new WeakMap<Element, Map<string, string>>();
function put(e: Element, prop: string, v: string, apply: () => void): void {
  let m = memo.get(e);
  if (!m) { m = new Map(); memo.set(e, m); }
  if (m.get(prop) === v) return;
  m.set(prop, v);
  apply();
}
const text = (e: HTMLElement, s: string): void => put(e, 'text', s, () => { e.textContent = s; });
const css = (e: HTMLElement, prop: string, v: string): void => put(e, 'css:' + prop, v, () => e.style.setProperty(prop, v));
const attr = (e: Element, name: string, v: string): void => put(e, 'attr:' + name, v, () => e.setAttribute(name, v));
function setClass(e: Element, c: string, on: boolean): void {
  if (e.classList.contains(c) !== on) e.classList.toggle(c, on);
}
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const pct = (v: number): string => `${(clamp01(v) * 100).toFixed(1)}%`;

// Stick space (unit disc, y up) to the 84 px SVG.
const sx = (v: number): string => (42 + v * 38).toFixed(1);
const sy = (v: number): string => (42 - v * 38).toFixed(1);

export function createHud(ui: HTMLElement): Hud {
  if (!document.getElementById('ab-hud-style')) {
    const style = document.createElement('style');
    style.id = 'ab-hud-style';
    style.textContent = buildCss();
    document.head.appendChild(style);
  }
  const root = make('div', '', undefined, ui);
  root.id = 'ab-hud';

  // Title / pause card.
  const card = make('div', 'ab-card', undefined, root);
  const logo = make('div', 'gr ab-logo', 'AETHER BOARD', card);
  make('div', 'ab-sub', 'a gnome. a board. the ethereal plane.', card);
  const cheatBadge = make('div', 'gr ab-cheat hide', 'CHEAT: METRO TRAIN CAR', card);
  const prompt = make('div', 'gr ab-prompt', 'CLICK TO RIDE', card);
  const cols = make('div', 'ab-cols', undefined, card);
  const kbCol = make('div', 'ab-col', undefined, cols);
  make('h3', 'ab-colh', 'Keyboard + mouse', kbCol);
  const kbList = make('ul', '', undefined, kbCol);
  for (const s of KBM_LINES) make('li', '', s, kbList);
  const padCol = make('div', 'ab-col', undefined, cols);
  make('h3', 'ab-colh', 'Gamepad', padCol);
  const padList = make('ul', '', undefined, padCol);
  for (const s of PAD_LINES) make('li', '', s, padList);
  const touchCol = make('div', 'ab-col hide', undefined, cols);
  make('h3', 'ab-colh', 'Touch', touchCol);
  const touchList = make('ul', '', undefined, touchCol);
  for (const s of TOUCH_LINES) make('li', '', s, touchList);

  // Combo: lines, points x mult, link bar, grind tag.
  const combo = make('div', 'ab-combo hide', undefined, root);
  const lineBox = make('div', 'ab-lines', undefined, combo);
  const pts = make('div', 'gr ab-pts', undefined, combo);
  const link = make('div', 'ab-link hide', undefined, combo);
  const linkFill = make('div', 'ab-linkfill', undefined, link);
  const grind = make('div', 'gr ab-grind hide', 'GRIND', combo);
  // Manual balance meter: keep the marker in the green.
  const man = make('div', 'ab-man hide', undefined, root);
  const manLabel = make('div', 'gr ab-man-l', 'MANUAL', man);
  const manBar = make('div', 'ab-man-bar', undefined, man);
  const manDot = make('div', 'ab-man-dot', undefined, manBar);

  // Banked / bailed text.
  const bank = make('div', 'ab-bank', undefined, root);

  // Score.
  const score = make('div', 'ab-score', undefined, root);
  const scoreTxt = make('div', 'gr ab-score-n', 'SCORE 0', score);
  const bestTxt = make('div', 'gr ab-best', 'BEST 0', score);

  // Speed.
  const speed = make('div', 'ab-speed', undefined, root);
  const kmh = make('div', 'gr ab-kmh', '0', speed);
  make('div', 'gr ab-kmhunit', 'KM/H', speed);
  const speedMeter = make('div', 'ab-meter', undefined, speed);
  const speedFill = make('div', 'ab-speedfill', undefined, speedMeter);

  // Flow.
  const flow = make('div', 'ab-flow', undefined, root);
  make('div', 'gr ab-flowlabel', 'FLOW', flow);
  const flowMeter = make('div', 'ab-meter', undefined, flow);
  const flowFill = make('div', 'ab-flowfill', undefined, flowMeter);
  const hint = make('div', 'gr ab-hint hide', 'SHIFT / RB to boost', flow);

  // Stick display.
  const stickBox = make('div', 'ab-stick', undefined, root);
  const S = svgEl('svg', { viewBox: '0 0 84 84' }, stickBox);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    svgEl('line', {
      x1: (42 + Math.cos(a) * 33).toFixed(1), y1: (42 - Math.sin(a) * 33).toFixed(1),
      x2: (42 + Math.cos(a) * 40).toFixed(1), y2: (42 - Math.sin(a) * 40).toFixed(1),
      stroke: '#fff', 'stroke-opacity': '0.6', 'stroke-width': '2',
    }, S);
  }
  const trailG = svgEl('g', {}, S);
  const segs: SVGElement[] = [];
  const dot = svgEl('circle', { r: '5', fill: hex(PALETTE.yellow), stroke: C.ink, 'stroke-width': '2' }, S);

  function drawTrail(trail: { x: number; y: number }[]): void {
    const need = Math.max(0, trail.length - 1);
    while (segs.length < need) {
      segs.push(svgEl('polyline', {
        fill: 'none', 'stroke-linecap': 'round', 'stroke-width': '3', stroke: C.cyan, 'stroke-opacity': '0',
      }, trailG));
    }
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]!;
      if (i < need) {
        const a = trail[i]!;
        const b = trail[i + 1]!;
        attr(seg, 'points', `${sx(a.x)},${sy(a.y)} ${sx(b.x)},${sy(b.y)}`);
        attr(seg, 'stroke-opacity', ((i + 1) / need).toFixed(2));
      } else {
        attr(seg, 'stroke-opacity', '0');
      }
    }
  }

  function slam(name: string): void {
    const wrap = make('div', 'ab-slamwrap', undefined, root);
    const s = make('div', 'gr ab-slam', name, wrap);
    s.style.setProperty('--tilt', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
    setTimeout(() => wrap.remove(), 1300);
  }

  function showBank(last: NonNullable<ComboView['last']>): void {
    const landed = last.kind === 'landed';
    const wrap = make('div', 'ab-bankwrap');
    make('div', `gr ab-big ${landed ? 'ab-landed' : 'ab-bailed'}`, landed ? `+${last.points}` : 'BAILED', wrap);
    make('div', 'gr ab-bsub', last.text, wrap);
    bank.replaceChildren(wrap);
  }

  let prevLines = 0;
  let lastBankT: number | null = null;
  let hintDone = false;
  let hintUntil = 0;

  return {
    update(f: HudFrame): void {
      const { p, combo: c, state } = f;
      const playing = state === 'playing';
      const paused = state === 'paused';
      const pad = f.device === 'pad';
      const touch = f.device === 'touch';

      // Title / pause card.
      setClass(card, 'show', !playing);
      setClass(cheatBadge, 'hide', !f.trainMode);
      text(logo, paused ? 'PAUSED' : 'AETHER BOARD');
      text(prompt, touch
        ? (paused ? 'TAP TO RIDE ON' : 'TAP TO RIDE')
        : pad
        ? (paused ? 'PRESS A TO RIDE ON' : 'PRESS A')
        : (paused ? 'CLICK TO RIDE ON' : 'CLICK TO RIDE'));
      setClass(kbCol, 'on', !pad && !touch);
      setClass(padCol, 'on', pad);
      // On a phone only the touch controls are shown (the card has to fit a short landscape screen).
      setClass(kbCol, 'hide', touch);
      setClass(padCol, 'hide', touch);
      setClass(touchCol, 'hide', !touch);
      setClass(touchCol, 'on', touch);

      // Trick slam: a new name each time the combo grows.
      const lines = c.lines;
      if (lines.length < prevLines) prevLines = lines.length;
      if (lines.length > prevLines) slam(lines[lines.length - 1] ?? '');
      prevLines = lines.length;

      // Combo.
      setClass(combo, 'hide', !(playing && lines.length > 0));
      const recent = lines.slice(-4);
      put(lineBox, 'lines', recent.join('\n'), () => {
        lineBox.replaceChildren(...recent.map((s, i) => make('div', `gr ab-line r${recent.length - 1 - i}`, s)));
      });
      text(pts, `${c.points} × ${c.mult}`);
      setClass(link, 'hide', !(c.linkLeft > 0));
      css(linkFill, 'width', pct(c.linkLeft / 1.4));
      setClass(grind, 'hide', p.mode !== 'grind');
      setClass(man, 'hide', !(playing && p.manual));
      if (p.manual) {
        text(manLabel, p.manual.kind === 'nose' ? 'NOSE MANUAL' : 'MANUAL');
        css(manDot, 'left', pct(0.5 + 0.5 * Math.max(-1, Math.min(1, p.manual.balance))));
      }

      // Banked / bailed.
      if (c.last && c.last.t !== lastBankT) {
        lastBankT = c.last.t;
        showBank(c.last);
      }

      // Score (hidden behind the title / pause card).
      setClass(score, 'hide', !playing);
      text(scoreTxt, `SCORE ${c.total}`);
      text(bestTxt, `BEST ${c.best}`);

      // Speed.
      const spd = p.vel.length();
      text(kmh, String(Math.round(spd * 3.6)));
      css(speedFill, 'width', pct(spd / 70));

      // Flow and the first-time boost hint.
      css(flowFill, 'width', pct(p.flow));
      setClass(flow, 'boost', p.boosting);
      const now = performance.now();
      if (!hintDone && p.flow > 0.5) {
        hintDone = true;
        hintUntil = now + 4000;
      }
      setClass(hint, 'hide', now >= hintUntil);

      // Stick display.
      attr(dot, 'cx', sx(f.stick.x));
      attr(dot, 'cy', sy(f.stick.y));
      drawTrail(f.trail);
    },
  };
}
