// Dig a Nook (E17 issue J3): a full-screen hold-and-release game. Hold DIG (or Space) and let go while the soil
// meter sits in the green band for a tidy nook. Too early is shallow; holding to the top is a soft, funny collapse.
// DOM only, appended to `ui`. Nothing touches `document` at import time.

export interface DigResult { good: boolean; quit: boolean }
export interface DigOpts {
  /** Which nook (0..2), for the title. */
  nook: number;
  /** 0..1 random source. */
  rand: () => number;
  onDone(r: DigResult): void;
}

export type DigVerdict = 'good' | 'shallow' | 'collapse';
export interface DigBand { lo: number; hi: number }

const BAND_WIDTH = 0.18;
const VERDICT_MS = 1000;
const TICK_MS = 16;

const TEXT: Record<DigVerdict, string> = {
  good: 'A lovely nook. Most tidy.',
  shallow: 'A bit shallow. It will do for a teaspoon.',
  collapse: 'Oh dear. The ceiling has joined us. We shall tidy it.',
};

/** The green band on the meter: 0.18 wide, its bottom edge somewhere in 0.50..0.72. */
export function digBand(rand: () => number): DigBand {
  const r = Math.min(0.999999, Math.max(0, rand()));
  const lo = 0.5 + r * 0.22;
  return { lo, hi: lo + BAND_WIDTH };
}

/** The fill 0..1 after holding `heldSeconds`: starts slow, speeds up a little; 1 at about 2.0 s. */
export function digFill(heldSeconds: number): number {
  const t = Math.max(0, heldSeconds);
  return Math.min(1, 0.32 * t + 0.09 * t * t);
}

/** A full meter is a collapse; inside the band (edges inclusive) is good; anything else is shallow. */
export function judgeDig(fill: number, band: DigBand): DigVerdict {
  if (fill >= 1) return 'collapse';
  if (fill >= band.lo && fill <= band.hi) return 'good';
  return 'shallow';
}

let active: HTMLElement | null = null;

export function digOpen(): boolean {
  return active !== null;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: Partial<CSSStyleDeclaration>,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Opens the dig game for one nook in a container appended to `ui` (never restyle `ui`). */
export function openDigGame(ui: HTMLElement, opts: DigOpts): void {
  if (typeof document === 'undefined') {
    opts.onDone({ good: false, quit: true });
    return;
  }
  // One dig at a time: a second open is refused as a quit rather than stacking overlays.
  if (active) {
    opts.onDone({ good: false, quit: true });
    return;
  }

  const band = digBand(opts.rand);
  let holding = false;
  let finished = false;
  let holdStart = 0;
  let tick: ReturnType<typeof setInterval> | null = null;
  let verdictTimer: ReturnType<typeof setTimeout> | null = null;
  let fill = 0;

  const root = el('div', {
    position: 'fixed',
    inset: '0',
    zIndex: '60',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    boxSizing: 'border-box',
    padding: 'calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 12px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 12px)',
  });
  root.id = 'gta-dig-game';

  const panel = el('div', {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '14px',
    background: '#1b1f24',
    border: '2px solid rgba(255,255,255,0.28)',
    borderRadius: '18px',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
  });
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Dig a Nook');

  const title = el('div', { fontWeight: '800', fontSize: '17px' }, `Dig a Nook (${opts.nook + 1} of 3)`);

  const row = el('div', {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '18px',
  });

  const meter = el('div', {
    position: 'relative',
    width: '48px',
    height: 'clamp(150px, 40vh, 320px)',
    boxSizing: 'border-box',
    background: '#3a2a1c',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '12px',
    overflow: 'hidden',
    flex: '0 0 auto',
  });
  const bandEl = el('div', {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: `${(band.lo * 100).toFixed(2)}%`,
    height: `${(BAND_WIDTH * 100).toFixed(2)}%`,
    background: 'rgba(90,220,120,0.55)',
    borderTop: '2px solid rgba(160,255,180,0.9)',
    boxSizing: 'border-box',
  });
  const fillEl = el('div', {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: '0',
    height: '0%',
    background: '#8b5a2b',
  });
  meter.append(bandEl, fillEl);

  const dig = el('button', {
    width: '104px',
    height: '104px',
    minWidth: '88px',
    minHeight: '88px',
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.5)',
    background: '#a8632c',
    color: '#fff',
    font: '800 22px system-ui, sans-serif',
    touchAction: 'none',
    userSelect: 'none',
    webkitUserSelect: 'none',
    cursor: 'pointer',
    flex: '0 0 auto',
  }, 'DIG');
  dig.type = 'button';
  dig.setAttribute('aria-label', 'Dig: hold, then let go');

  row.append(meter, dig);

  const hint = el('div', { fontSize: '13px', color: 'rgba(255,255,255,0.8)' },
    'Hold DIG. Let go while the soil is in the green.');
  const verdictEl = el('div', {
    minHeight: '2.6em',
    fontSize: '15px',
    fontWeight: '700',
    lineHeight: '1.3',
  });

  const stop = el('button', {
    minWidth: '44px',
    minHeight: '44px',
    padding: '0 18px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: '#2a323a',
    color: '#fff',
    font: '700 15px system-ui, sans-serif',
    cursor: 'pointer',
    touchAction: 'manipulation',
  }, 'Stop');
  stop.type = 'button';

  panel.append(title, row, hint, verdictEl, stop);
  root.appendChild(panel);

  const render = (): void => {
    fillEl.style.height = `${(fill * 100).toFixed(2)}%`;
  };

  const stopTick = (): void => {
    if (tick !== null) clearInterval(tick);
    tick = null;
  };

  const teardown = (): void => {
    stopTick();
    if (verdictTimer !== null) clearTimeout(verdictTimer);
    verdictTimer = null;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    root.remove();
    if (active === root) active = null;
  };

  const finish = (verdict: DigVerdict): void => {
    if (finished) return;
    finished = true;
    holding = false;
    stopTick();
    fill = verdict === 'collapse' ? 1 : digFill((Date.now() - holdStart) / 1000);
    render();
    dig.disabled = true;
    verdictEl.textContent = TEXT[verdict];
    verdictTimer = setTimeout(() => {
      verdictTimer = null;
      teardown();
      opts.onDone({ good: verdict === 'good', quit: false });
    }, VERDICT_MS);
  };

  const quit = (): void => {
    if (finished) return;
    finished = true;
    holding = false;
    teardown();
    opts.onDone({ good: false, quit: true });
  };

  const startHold = (): void => {
    if (finished || holding) return;
    holding = true;
    holdStart = Date.now();
    fill = 0;
    render();
    stopTick();
    tick = setInterval(() => {
      const held = (Date.now() - holdStart) / 1000;
      fill = digFill(held);
      render();
      if (fill >= 1) finish('collapse');
    }, TICK_MS);
  };

  const endHold = (): void => {
    if (finished || !holding) return;
    holding = false;
    stopTick();
    const held = (Date.now() - holdStart) / 1000;
    fill = digFill(held);
    render();
    finish(judgeDig(fill, band));
  };

  function onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Escape') {
      e.preventDefault();
      quit();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) startHold();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      endHold();
    }
  }

  dig.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startHold();
  });
  dig.addEventListener('pointerup', (e) => { e.preventDefault(); endHold(); });
  dig.addEventListener('pointercancel', () => endHold());
  dig.addEventListener('pointerleave', () => endHold());
  dig.addEventListener('contextmenu', (e) => e.preventDefault());
  stop.addEventListener('click', (e) => {
    e.stopPropagation();
    quit();
  });
  // Keep the overlay from passing taps through to the game underneath.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  active = root;
  ui.appendChild(root);
}
