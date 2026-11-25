// Post Sorting (E17 issue J2): a full-screen tap game. Letters arrive one at a time, each addressed to a resident of
// one of Loamdeep's six halls; the player taps the matching pigeonhole before the clock runs out. Touch, mouse and keys
// 1-6 all work; Escape or "Stop" quits. DOM only, built when opened: never touches `document` at import time.
import { HALL_IDS, HALL_NAMES, SOCIETY_CAST, type HallId } from '../../societies/config';

export interface SortingResult { sorted: number; misses: number; seconds: number; quit: boolean }
export interface SortingOpts {
  /** Letters to sort. */
  letters: number;
  /** Seconds allowed. */
  seconds: number;
  /** 0..1 random source. */
  rand: () => number;
  onDone(r: SortingResult): void;
}

export const HALL_SYMBOL: Readonly<Record<HallId, string>> = {
  mothers: '👑',
  rootway: '🌱',
  lamplight: '🏮',
  postern: '✉️',
  hearth: '🍞',
  underChorus: '🎵',
};

export const HALL_RESIDENT: Readonly<Record<HallId, string>> = {
  mothers: SOCIETY_CAST.tumblesoil,
  rootway: SOCIETY_CAST.tamp,
  lamplight: SOCIETY_CAST.delve,
  postern: SOCIETY_CAST.sift,
  hearth: SOCIETY_CAST.crumb,
  underChorus: 'DJ Moleman (c/o Under-Chorus, in case he visits)',
};

/** Random halls for `n` letters, never three of the same hall in a row. */
export function makeLetters(n: number, rand: () => number): HallId[] {
  const out: HallId[] = [];
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  for (let i = 0; i < count; i++) {
    const banned = i >= 2 && out[i - 1] === out[i - 2] ? out[i - 1] : null;
    const pool = HALL_IDS.filter((h) => h !== banned);
    const r = Math.min(0.999999, Math.max(0, rand()));
    out.push(pool[Math.floor(r * pool.length)]);
  }
  return out;
}

export function checkSort(letter: HallId, hole: HallId): boolean {
  return letter === hole;
}

const STYLE_ID = 'gta-sorting-css';
const CSS = `
#gta-sorting{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px) calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);background:rgba(20,14,8,.6);font-family:system-ui,sans-serif;color:#3b2a1a;touch-action:manipulation;}
#gta-sorting .sg-panel{width:min(520px,100%);max-height:100%;overflow:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:14px;background:#f4ead2;border:2px solid #8a6a3c;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.45);}
#gta-sorting .sg-title{font-weight:800;font-size:18px;}
#gta-sorting .sg-meta{display:flex;justify-content:space-between;font-size:14px;font-weight:700;}
#gta-sorting .sg-bar{height:10px;border-radius:5px;background:rgba(59,42,26,.18);overflow:hidden;}
#gta-sorting .sg-barf{height:100%;width:100%;background:#4f8a3c;}
#gta-sorting .sg-body{display:flex;flex-direction:column;gap:10px;}
#gta-sorting .sg-card{position:relative;box-sizing:border-box;min-height:64px;padding:14px 46px 14px 14px;background:#fffaf0;border:2px solid #b58b4c;border-radius:10px;}
#gta-sorting .sg-to{font-size:15px;font-weight:700;overflow-wrap:anywhere;}
#gta-sorting .sg-sym{position:absolute;right:10px;top:8px;font-size:22px;}
#gta-sorting .sg-card.sg-shake{animation:gta-sg-shake .35s;}
@keyframes gta-sg-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
#gta-sorting .sg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
#gta-sorting .sg-grid button{min-width:64px;min-height:64px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;border-radius:10px;border:2px solid #8a6a3c;background:#e6d3a8;color:#3b2a1a;font:inherit;cursor:pointer;touch-action:manipulation;}
#gta-sorting .sg-grid button.sg-ok{background:#8fd17a;}
#gta-sorting .sg-grid button.sg-bad{background:#e8a08a;}
#gta-sorting .sg-hs{font-size:26px;line-height:1;}
#gta-sorting .sg-hn{font-size:11px;font-weight:700;line-height:1.1;text-align:center;overflow-wrap:anywhere;}
#gta-sorting .sg-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;}
#gta-sorting .sg-hint{font-size:12px;opacity:.7;}
#gta-sorting .sg-stop{min-width:44px;min-height:44px;padding:0 16px;box-sizing:border-box;border-radius:12px;border:2px solid #8a6a3c;background:#fffaf0;color:#3b2a1a;font:700 15px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
@media (orientation: landscape) and (max-height: 500px){
  #gta-sorting .sg-panel{width:min(760px,100%);gap:6px;padding:10px;}
  #gta-sorting .sg-body{flex-direction:row;align-items:stretch;}
  #gta-sorting .sg-body > .sg-card{flex:1 1 40%;}
  #gta-sorting .sg-body > .sg-grid{flex:1 1 60%;}
}
`;

const TICK_MS = 100;
const FLASH_MS = 180;

let openRef: { close(quit: boolean): void } | null = null;

/** Opens the sorting game in a container appended to `ui` (never restyle `ui`). */
export function openSortingGame(ui: HTMLElement, opts: SortingOpts): void {
  if (typeof document === 'undefined') {
    opts.onDone({ sorted: 0, misses: 0, seconds: 0, quit: true });
    return;
  }
  openRef?.close(true);

  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const letters = makeLetters(opts.letters, opts.rand);
  const total = letters.length;
  const seconds = Math.max(0, opts.seconds);
  const start = Date.now();
  let sorted = 0;
  let misses = 0;
  let index = 0;
  let finished = false;
  let tick: ReturnType<typeof setInterval> | null = null;
  const flashes: ReturnType<typeof setTimeout>[] = [];

  const root = document.createElement('div');
  root.id = 'gta-sorting';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  const panel = document.createElement('div');
  panel.className = 'sg-panel';
  root.appendChild(panel);

  const el = (tag: string, cls: string, text?: string): HTMLElement => {
    const d = document.createElement(tag);
    d.className = cls;
    if (text !== undefined) d.textContent = text;
    return d;
  };

  panel.appendChild(el('div', 'sg-title', 'Post Sorting, Postern Hall'));
  const meta = el('div', 'sg-meta');
  const timeLeft = el('span', '', '');
  const counter = el('span', '', '');
  meta.append(timeLeft, counter);
  panel.appendChild(meta);
  const bar = el('div', 'sg-bar');
  const barFill = el('div', 'sg-barf');
  bar.appendChild(barFill);
  panel.appendChild(bar);

  const body = el('div', 'sg-body');
  const card = el('div', 'sg-card');
  const cardTo = el('div', 'sg-to');
  const cardSym = el('div', 'sg-sym');
  card.append(cardTo, cardSym);
  const grid = el('div', 'sg-grid');
  body.append(card, grid);
  panel.appendChild(body);

  const holeButtons = new Map<HallId, HTMLButtonElement>();
  for (const hall of HALL_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', HALL_NAMES[hall]);
    b.append(el('span', 'sg-hs', HALL_SYMBOL[hall]), el('span', 'sg-hn', HALL_NAMES[hall]));
    b.addEventListener('click', () => press(hall));
    holeButtons.set(hall, b);
    grid.appendChild(b);
  }

  const foot = el('div', 'sg-foot');
  foot.appendChild(el('span', 'sg-hint', 'Keys 1-6, Esc to quit'));
  const stop = document.createElement('button');
  stop.type = 'button';
  stop.className = 'sg-stop';
  stop.textContent = 'Stop';
  stop.addEventListener('click', () => finish(true));
  foot.appendChild(stop);
  panel.appendChild(foot);

  const elapsedSec = (): number => Math.min(seconds, (Date.now() - start) / 1000);

  const renderCard = (): void => {
    if (index < total) {
      const hall = letters[index];
      cardTo.textContent = `To: ${HALL_RESIDENT[hall]}, ${HALL_NAMES[hall]}`;
      cardSym.textContent = HALL_SYMBOL[hall];
    } else {
      cardTo.textContent = 'All letters sorted.';
      cardSym.textContent = '';
    }
    counter.textContent = `${sorted} / ${total}`;
  };

  const renderTime = (): void => {
    const left = Math.max(0, seconds - elapsedSec());
    timeLeft.textContent = `${Math.ceil(left)}s`;
    barFill.style.width = `${seconds > 0 ? Math.max(0, Math.min(1, left / seconds)) * 100 : 0}%`;
  };

  const flash = (btn: HTMLButtonElement, cls: string): void => {
    btn.classList.add(cls);
    flashes.push(setTimeout(() => btn.classList.remove(cls), FLASH_MS));
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      finish(true);
      return;
    }
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= HALL_IDS.length) {
      e.stopPropagation();
      press(HALL_IDS[n - 1]);
    }
  };

  function press(hall: HallId): void {
    if (finished || index >= total) return;
    const btn = holeButtons.get(hall);
    if (checkSort(letters[index], hall)) {
      sorted++;
      index++;
      if (btn) flash(btn, 'sg-ok');
      renderCard();
      if (sorted >= total) finish(false);
    } else {
      misses++;
      if (btn) flash(btn, 'sg-bad');
      card.classList.remove('sg-shake');
      void card.offsetWidth;
      card.classList.add('sg-shake');
    }
  }

  function finish(quit: boolean): void {
    if (finished) return;
    finished = true;
    if (tick !== null) clearInterval(tick);
    for (const f of flashes) clearTimeout(f);
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    if (openRef === handle) openRef = null;
    opts.onDone({ sorted, misses, seconds: Math.round(elapsedSec() * 100) / 100, quit });
  }

  const handle = { close: (quit: boolean): void => finish(quit) };

  for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown'] as const) {
    root.addEventListener(ev, (e) => e.stopPropagation());
  }

  renderCard();
  renderTime();
  ui.appendChild(root);
  openRef = handle;
  window.addEventListener('keydown', onKey, true);

  if (total === 0 || seconds === 0) {
    finish(false);
    return;
  }
  tick = setInterval(() => {
    renderTime();
    if (elapsedSec() >= seconds) finish(false);
  }, TICK_MS);
}

export function sortingOpen(): boolean {
  return openRef !== null;
}
