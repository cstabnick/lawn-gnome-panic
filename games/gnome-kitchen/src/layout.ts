// One layout for portrait and landscape phones. Top bar, bottom counter, and the board between them. The board holds
// Gnoma (her panel: a column on the left in landscape, a strip on top in portrait) and the play plate where the
// cooking happens. Steps place things by fractions of the play plate, so any shape works.

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Board extends Rect {
  /** The shorter side: the unit that object sizes are fractions of. */
  u: number;
}

export interface Layout {
  W: number;
  H: number;
  ins: Insets;
  /** Height of the top and bottom bars, in px. */
  top: number;
  bottom: number;
  /** Font size for the main text, in px. */
  fs: number;
  /** True in landscape: Gnoma sits in a column on the left. */
  wide: boolean;
  /** Gnoma's panel. */
  gnoma: Rect;
  /** Where the cooking happens. */
  play: Board;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The device's safe-area insets (notches, home bars), read from CSS env() through a hidden probe. */
export function readInsets(): Insets {
  const zero: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  try {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;left:0;top:0;visibility:hidden;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
    document.body.appendChild(probe);
    const s = getComputedStyle(probe);
    const n = (v: string): number => parseFloat(v) || 0;
    const out = { top: n(s.paddingTop), right: n(s.paddingRight), bottom: n(s.paddingBottom), left: n(s.paddingLeft) };
    probe.remove();
    return out;
  } catch {
    return zero;
  }
}

export function computeLayout(W: number, H: number, ins: Insets): Layout {
  const fs = Math.round(clamp(Math.min(W, H) * 0.045, 14, 22));
  const top = Math.round(clamp(H * 0.18, 66, 120));
  const bottom = Math.round(clamp(H * 0.15, 60, 110));
  const x = ins.left + 12;
  const y = ins.top + top;
  const w = Math.max(160, W - ins.left - ins.right - 24);
  const h = Math.max(160, H - ins.top - ins.bottom - top - bottom);
  const wide = W >= H;
  let gnoma: Rect;
  let play: Rect;
  if (wide) {
    const colW = Math.round(clamp(w * 0.26, 130, 200));
    gnoma = { x, y, w: colW, h };
    play = { x: x + colW + 14, y, w: w - colW - 14, h };
  } else {
    const headH = Math.round(clamp(h * 0.24, 100, 170));
    gnoma = { x, y, w, h: headH };
    play = { x, y: y + headH + 10, w, h: h - headH - 10 };
  }
  return {
    W,
    H,
    ins,
    top,
    bottom,
    fs,
    wide,
    gnoma,
    play: { ...play, u: Math.min(play.w, play.h) },
  };
}
