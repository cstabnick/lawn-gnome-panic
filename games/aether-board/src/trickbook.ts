// The trick book: every trick and how to do it, on an overlay. Built once; set() only shows it and picks the device wording.
import {
  AIR_GESTURES, BOARD_TRICKS, GRABS, GRINDS, GROUND_GESTURES, PALETTE, grabFor, grindFor,
  type GrabKind, type GrindKind, type Zone,
} from './config';
import type { Device } from './input';

export interface TrickBook {
  /** Show or hide the book; device picks which controls the gesture hints describe. */
  set(open: boolean, device: Device): void;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const C = {
  ink: hex(PALETTE.ink), pink: hex(PALETTE.pink), cyan: hex(PALETTE.cyan), lime: hex(PALETTE.lime),
  purple: hex(PALETTE.purple), yellow: hex(PALETTE.yellow),
};

type Dir = Exclude<Zone, 'C'>;
const ZONES: Zone[] = ['C', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
/** Clockwise from up. */
const DEG: Record<Dir, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const ARROW: Record<Dir, string> = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' };
const H = Math.SQRT1_2;
/** A stick position for each zone (y up = forward), to ask grabFor / grindFor. */
const STICK: Record<Zone, { x: number; y: number }> = {
  C: { x: 0, y: 0 }, N: { x: 0, y: 1 }, NE: { x: H, y: H }, E: { x: 1, y: 0 }, SE: { x: H, y: -H },
  S: { x: 0, y: -1 }, SW: { x: -H, y: -H }, W: { x: -1, y: 0 }, NW: { x: -H, y: H },
};
const WORDS = {
  ts: { kbm: 'mouse', pad: 'right stick', touch: 'swipe on the right' },
  close: { kbm: 'T / Tab to close', pad: 'View to close', touch: 'tap ✕' },
} as const;

// ---------------------------------------------------------------- stick diagrams (56 px)
const CX = 28;
const CY = 28;
type Pt = [number, number];
const rim = (z: Dir, r: number): Pt => {
  const a = (DEG[z] * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};
const f = (p: Pt): string => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/** The stick disc: a dot at `from`, then a curve through each point of `via`, arrowhead on the last. No `via`: a centre dot. */
function stickSvg(from: Pt, via: Pt[]): string {
  const rimC = `<circle cx="${CX}" cy="${CY}" r="26" fill="${C.ink}" fill-opacity=".55" stroke="${C.purple}" stroke-width="2"/>`;
  const dot = `<circle cx="${from[0].toFixed(1)}" cy="${from[1].toFixed(1)}" r="3.4" fill="${C.cyan}"/>`;
  if (via.length === 0) return `<svg viewBox="0 0 56 56" aria-hidden="true">${rimC}${dot}</svg>`;
  const all: Pt[] = [from, ...via];
  let d = `M${f(from)}`;
  let ctrl: Pt = from;
  for (let i = 1; i < all.length; i++) {
    const [ax, ay] = all[i - 1];
    const [bx, by] = all[i];
    // pull each control point toward the centre, so the route bows in like a stick flick
    ctrl = [CX + ((ax + bx) / 2 - CX) * 0.5, CY + ((ay + by) / 2 - CY) * 0.5];
    d += ` Q${f(ctrl)} ${f(all[i])}`;
  }
  const end = all[all.length - 1];
  let ux = end[0] - ctrl[0];
  let uy = end[1] - ctrl[1];
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const bx = end[0] - ux * 6;
  const by = end[1] - uy * 6;
  const head = [
    `${end[0].toFixed(1)},${end[1].toFixed(1)}`,
    `${(bx - uy * 3.4).toFixed(1)},${(by + ux * 3.4).toFixed(1)}`,
    `${(bx + uy * 3.4).toFixed(1)},${(by - ux * 3.4).toFixed(1)}`,
  ].join(' ');
  return `<svg viewBox="0 0 56 56" aria-hidden="true">${rimC}`
    + `<path d="${d}" fill="none" stroke="${C.pink}" stroke-width="3.5" stroke-linecap="round"/>`
    + `<polygon points="${head}" fill="${C.pink}"/>${dot}</svg>`;
}

/** Ground pop: the pull-back dot at the bottom, then the flick route. */
const groundSvg = (path: Dir[]): string => stickSvg(rim('S', 14), path.map((z) => rim(z, 20)));
/** A single flick (or a stick zone) from the centre. */
const zoneSvg = (z: Dir): string => stickSvg([CX, CY], [rim(z, 20)]);
const centreSvg = (): string => stickSvg([CX, CY], []);

// ---------------------------------------------------------------- derived grab and grind zones
/** The zone that picks each grab (grab 1 at centre: Indy, grab 2 at centre: Melon). */
function grabPick(kind: GrabKind): { zone: Dir | null; btn: 1 | 2 } {
  for (const z of ZONES) {
    if (z !== 'C' && grabFor(1, STICK[z]) === kind) return { zone: z, btn: 1 };
  }
  return { zone: null, btn: grabFor(1, STICK.C) === kind ? 1 : 2 };
}

/** The zone that picks each grind (centre: 50-50). */
function grindPick(kind: GrindKind): Dir | null {
  for (const z of ZONES) {
    if (z !== 'C' && grindFor(STICK[z]) === kind) return z;
  }
  return null;
}

// ---------------------------------------------------------------- markup
const card = (name: string, points: string, svg: string, hint: string): string =>
  `<div class="ab-bk-card"><div class="ab-bk-name gr">${name}</div>`
  + `<div class="ab-bk-pts">${points}</div>${svg}<div class="ab-bk-hint">${hint}</div></div>`;

function groundCards(mod: boolean): string {
  return GROUND_GESTURES.filter((g) => g.mod === mod).map((g) => {
    const t = BOARD_TRICKS[g.trick];
    const flick = g.path.map((z) => ARROW[z]).join(' ');
    return card(t.name, `${t.points} pts`, groundSvg(g.path), `pull back, then flick ${flick}`);
  }).join('');
}

function airCards(): string {
  return AIR_GESTURES.map((g) => {
    const t = BOARD_TRICKS[g.trick];
    return card(t.name, `${t.points} pts`, zoneSvg(g.zone), `in the air: flick ${ARROW[g.zone]}`);
  }).join('');
}

function grabCards(): string {
  return (Object.keys(GRABS) as GrabKind[]).map((k) => {
    const g = GRABS[k];
    const pick = grabPick(k);
    const svg = pick.zone ? zoneSvg(pick.zone) : centreSvg();
    const hint = pick.zone
      ? `stick ${ARROW[pick.zone]}, hold GRAB`
      : `centre, hold GRAB ${pick.btn}`;
    return card(g.name, `${g.points} pts`, svg, hint);
  }).join('');
}

function grindCards(): string {
  return (Object.keys(GRINDS) as GrindKind[]).map((k) => {
    const g = GRINDS[k];
    const z = grindPick(k);
    const svg = z ? zoneSvg(z) : centreSvg();
    const hint = z ? `stick ${ARROW[z]} as you land` : 'centre as you land';
    return card(g.name, `${g.base} pts`, svg, hint);
  }).join('');
}

const section = (title: string, sub: string, body: string): string =>
  `<section class="ab-bk-sec"><h2 class="ab-bk-h gr">${title}</h2><p class="ab-bk-sub">${sub}</p>${body}</section>`;

const grid = (inner: string): string => `<div class="ab-bk-grid">${inner}</div>`;

const MANUALS = [
  '<b>Nose Manual</b>: hold GRAB 1 (LMB, Q, LT, the yellow GRAB) while rolling: the board tips onto its nose.',
  '<b>Manual</b>: hold GRAB 2 (RMB, E, RT, the green GRAB): the board tips onto its tail.',
  'Balance with <b>W / S</b> (the left stick, the joystick): push the marker back toward the middle. It tips further the further it is off.',
  'Lose it and you just drop off it: no bail. Let go of GRAB to end it.',
  'A manual keeps your combo alive while you hold it: land into one (keep GRAB held as you land), then pop a trick out of it.',
];

const BASICS = [
  '<b>Spins:</b> A / D (or the left stick) turn you in the air. Land the spin to bank it.',
  '<b>Flips:</b> W / S (or the left stick up / down) front and back flip in the air. Press them after you leave the ground.',
  '<b>Boost:</b> Shift / RB / BOOST rockets you forward. It burns flow; land clean to earn flow back.',
  '<b>Perfect landings:</b> land along the slope of the island, not across it. A smooth landing gives you a speed boost.',
  '<b>Halfpipes:</b> carve up the walls and you come back in, ready for the next trick.',
  '<b>Falling:</b> you drop out of the sky onto the next island. Your combo is lost.',
];

function bookMarkup(): string {
  const ground = `<h3 class="ab-bk-sub2 gr">Plain</h3>${grid(groundCards(false))}`
    + `<h3 class="ab-bk-sub2 gr">Hold GRAB while you pop:</h3>${grid(groundCards(true))}`;
  return `<div class="ab-bk-scroll" data-scroll><div class="ab-bk-wrap">`
    + `<header class="ab-bk-head"><div>`
    + `<div class="ab-bk-title gr">TRICK BOOK</div>`
    + `<div class="ab-bk-close" data-close>${WORDS.close.kbm}</div>`
    + `</div><button class="ab-bk-x" type="button" aria-label="Close the trick book">✕</button></header>`
    + section('POP TRICKS (on the ground)',
      `Pull the trick stick (<b data-ts>${WORDS.ts.kbm}</b>) back, then flick it along the arrows.`, ground)
    + section('AIR TRICKS (flick in the air)',
      'Flick the trick stick from the middle while you are in the air.', grid(airCards()))
    + section('GRABS (hold GRAB in the air, point the stick)',
      'Hold GRAB 1 (LMB / Q / LT) or GRAB 2 (RMB / E / RT) and point the stick. Centre: Indy or Melon.',
      grid(grabCards()))
    + section('GRINDS (point the stick as you land on a rail; hold a new direction to switch)',
      'Land on a rail and point the stick. Hold a new direction to switch grinds.', grid(grindCards()))
    + section('MANUALS (balance on one end)', 'On the ground, hold GRAB and keep the marker in the green.',
      `<ul class="ab-bk-basics">${MANUALS.map((b) => `<li>${b}</li>`).join('')}</ul>`)
    + section('THE BASICS', 'Your trick stick is the <b data-ts>mouse</b>.',
      `<ul class="ab-bk-basics">${BASICS.map((b) => `<li>${b}</li>`).join('')}</ul>`)
    + `</div></div>`;
}

const CSS = `
#ab-book{position:fixed;inset:0;z-index:10;display:none;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(ellipse at 50% 0%,rgba(139,92,255,.38),transparent 60%),rgba(23,7,46,.9)}
#ab-book.open{display:block;pointer-events:auto}
#ab-book .ab-bk-scroll{position:absolute;inset:0;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain}
#ab-book .ab-bk-wrap{max-width:1100px;margin:0 auto;padding:0 calc(14px + env(safe-area-inset-right)) calc(28px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left))}
#ab-book .gr{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-10deg);display:inline-block;line-height:1;white-space:nowrap}
#ab-book .ab-bk-head{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;
padding:calc(12px + env(safe-area-inset-top)) 0 12px;background:rgba(23,7,46,.94);border-bottom:3px solid ${C.purple}}
#ab-book .ab-bk-title{font-size:clamp(30px,5vw,56px);background:linear-gradient(90deg,${C.cyan},${C.pink} 50%,${C.yellow});-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(3px 3px 0 ${C.ink})}
#ab-book .ab-bk-close{margin-top:6px;font-size:clamp(13px,1.8vw,16px);font-weight:700;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
#ab-book .ab-bk-x{pointer-events:auto;flex:0 0 auto;width:48px;height:48px;border:3px solid ${C.ink};border-radius:0;background:${C.pink};color:#fff;font:900 22px/1 system-ui,sans-serif;box-shadow:3px 3px 0 ${C.ink};cursor:pointer}
#ab-book .ab-bk-x:active{transform:translate(2px,2px);box-shadow:1px 1px 0 ${C.ink}}
#ab-book .ab-bk-sec{margin-top:10px}
#ab-book .ab-bk-h{margin:18px 0 4px;font-size:clamp(18px,2.4vw,26px);color:${C.cyan};text-shadow:2px 2px 0 ${C.ink};white-space:normal;max-width:100%}
#ab-book .ab-bk-sub{margin:0 0 10px;font-size:clamp(13px,1.6vw,15px);color:#e9e2ff}
#ab-book .ab-bk-sub b{color:${C.lime}}
#ab-book .ab-bk-sub2{margin:14px 0 8px;font-size:clamp(14px,1.8vw,18px);color:${C.lime};text-shadow:2px 2px 0 ${C.ink};white-space:normal;max-width:100%}
#ab-book .ab-bk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
#ab-book .ab-bk-card{background:rgba(23,7,46,.75);border:3px solid ${C.purple};padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
#ab-book .ab-bk-name{font-size:clamp(14px,1.7vw,18px);color:#fff;text-shadow:2px 2px 0 ${C.ink},3px 3px 0 ${C.pink}}
#ab-book .ab-bk-pts{font-size:13px;color:${C.yellow};text-shadow:1px 1px 0 ${C.ink}}
#ab-book .ab-bk-card svg{width:56px;height:56px;display:block}
#ab-book .ab-bk-hint{font:600 12px/1.3 system-ui,sans-serif;color:${C.cyan}}
#ab-book .ab-bk-basics{margin:0;padding:0 0 0 18px;font:600 clamp(13px,1.5vw,15px)/1.5 system-ui,sans-serif}
#ab-book .ab-bk-basics li{margin:0 0 6px}
#ab-book .ab-bk-basics b{color:${C.lime}}
@media (max-height:500px){#ab-book .ab-bk-card svg{width:44px;height:44px}#ab-book .ab-bk-card{padding:6px}}
`;

export function createTrickBook(ui: HTMLElement): TrickBook {
  if (!document.getElementById('ab-book-style')) {
    const style = document.createElement('style');
    style.id = 'ab-book-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const root = document.createElement('div');
  root.id = 'ab-book';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = bookMarkup();
  ui.appendChild(root);

  const scroll = root.querySelector<HTMLElement>('[data-scroll]');
  const closeBtn = root.querySelector<HTMLButtonElement>('.ab-bk-x');
  // The ✕ asks the input layer for the same toggle as T / Tab; the app then calls set(false).
  closeBtn?.addEventListener('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT' }));
  });

  return {
    set(open: boolean, device: Device): void {
      root.classList.toggle('open', open);
      root.setAttribute('aria-hidden', String(!open));
      if (open && scroll) scroll.scrollTop = 0;
      for (const el of root.querySelectorAll<HTMLElement>('[data-ts]')) el.textContent = WORDS.ts[device];
      for (const el of root.querySelectorAll<HTMLElement>('[data-close]')) el.textContent = WORDS.close[device];
    },
  };
}
