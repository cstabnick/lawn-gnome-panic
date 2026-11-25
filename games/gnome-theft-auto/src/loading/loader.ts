// The loading screen (L87). index.html draws the loader before any script; main.ts reports stages with
// loadingProgress; app.ts calls hideLoading once the first frame is drawn. Imports nothing heavy.
import { LOADING_FACTS } from './facts';
import { LOADING_PAGES } from './pages';

const FACT_MS = 4000;
const FADE_MS = 300;

let stepCount = 1;
let factTimer: ReturnType<typeof setInterval> | undefined;
let cleanups: Array<() => void> = [];
let hidden = false;

function el(id: string): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

function teardown(): void {
  if (factTimer !== undefined) clearInterval(factTimer);
  factTimer = undefined;
  for (const c of cleanups) c();
  cleanups = [];
}

function listen<K extends keyof WindowEventMap>(target: Window | HTMLElement, type: K | string, fn: (e: any) => void): void {
  target.addEventListener(type, fn);
  cleanups.push(() => target.removeEventListener(type, fn));
}

function startFacts(): void {
  const box = el('gta-loader-fact');
  if (!box || LOADING_FACTS.length === 0) return;
  let i = Math.floor(Math.random() * LOADING_FACTS.length);
  box.textContent = LOADING_FACTS[i];
  factTimer = setInterval(() => {
    i = (i + 1) % LOADING_FACTS.length;
    box.textContent = LOADING_FACTS[i];
  }, FACT_MS);
}

function startPages(): void {
  const art = el('gta-loader-art');
  const caption = el('gta-loader-caption');
  const dots = el('gta-loader-dots');
  const prev = el('gta-loader-prev');
  const next = el('gta-loader-next');
  const root = el('gta-loader');
  if (!art || !root || LOADING_PAGES.length === 0) return;
  let page = 0;
  const n = LOADING_PAGES.length;
  if (dots) {
    dots.textContent = '';
    for (let k = 0; k < n; k++) dots.appendChild(document.createElement('i'));
  }
  const render = () => {
    const p = LOADING_PAGES[page];
    art.innerHTML = p.svg;
    art.title = p.title;
    if (caption) caption.textContent = `${p.title}. ${p.caption}`;
    if (dots) Array.from(dots.children).forEach((d, k) => d.classList.toggle('on', k === page));
  };
  const go = (d: number) => { page = (page + n + d) % n; render(); };
  render();
  // Buttons use pointerup: the page's double-tap guard can swallow the click of a quick second tap.
  for (const [b, d] of [[prev, -1], [next, 1]] as const) {
    if (!b) continue;
    listen(b, 'pointerup', (e: PointerEvent) => { e.stopPropagation(); go(d); });
    listen(b, 'click', (e: MouseEvent) => { if (e.detail === 0) go(d); }); // keyboard activation
  }
  listen(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });
  // Swipe on the art.
  let sx = 0;
  let down = false;
  listen(art, 'pointerdown', (e: PointerEvent) => { sx = e.clientX; down = true; });
  listen(art, 'pointerup', (e: PointerEvent) => {
    if (!down) return;
    down = false;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
    else go(1); // a plain tap flips forward
  });
}

/** Shows the named stages (no-op if the loader is not in the page). */
export function showLoading(steps: readonly string[]): void {
  stepCount = Math.max(1, steps.length);
  hidden = false;
  if (!el('gta-loader')) return;
  teardown();
  const stage = el('gta-loader-stage');
  if (stage && steps.length) stage.textContent = `${steps[0]}...`;
  const bar = el('gta-loader-bar');
  if (bar) bar.style.width = `${Math.round(100 / (stepCount + 1))}%`;
  startFacts();
  startPages();
}

/** Marks stage `n` (0-based) as started, with its label. */
export function loadingProgress(n: number, label: string): void {
  const stage = el('gta-loader-stage');
  if (stage) stage.textContent = `${label}...`;
  const bar = el('gta-loader-bar');
  if (bar) bar.style.width = `${Math.min(100, Math.round(((n + 1) / stepCount) * 100))}%`;
}

/** Removes the loader from the page (fades it out). Safe to call more than once. */
export function hideLoading(): void {
  const root = el('gta-loader');
  teardown();
  if (!root || hidden) return;
  hidden = true;
  root.style.pointerEvents = 'none';
  root.style.opacity = '0';
  setTimeout(() => root.remove(), FADE_MS);
}
