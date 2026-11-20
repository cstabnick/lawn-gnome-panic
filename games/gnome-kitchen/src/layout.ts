// One layout for portrait and landscape phones: a top bar, the kitchen board in the middle, a bottom bar of buttons.
// The board takes whatever room is left, and every object is placed by a fraction of it, so it fits any shape.

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Board {
  x: number;
  y: number;
  w: number;
  h: number;
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
  board: Board;
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
  const top = Math.round(clamp(H * 0.15, 60, 110));
  const bottom = Math.round(clamp(H * 0.15, 60, 110));
  const w = Math.max(120, W - ins.left - ins.right - 24);
  const h = Math.max(120, H - ins.top - ins.bottom - top - bottom);
  return {
    W,
    H,
    ins,
    top,
    bottom,
    fs,
    board: { x: ins.left + 12, y: ins.top + top, w, h, u: Math.min(w, h) },
  };
}
