// Screen layout for a Phaser.Scale.RESIZE game: portrait and landscape phones and desktops, with safe-area insets.
// Scenes call these in create() and again from this.scale.on('resize', ...).

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let probe: HTMLDivElement | null = null;

/** The device's safe-area insets in CSS px (notches, home bar). 0 on desktops. */
export function safeInsets(): Insets {
  try {
    if (!probe) {
      probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
      document.body.appendChild(probe);
    }
    const cs = getComputedStyle(probe);
    return {
      top: parseFloat(cs.paddingTop) || 0,
      right: parseFloat(cs.paddingRight) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0,
    };
  } catch {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

/** The screen minus safe-area insets and an 8 px margin. */
export function safeRect(w: number, h: number): Rect {
  const i = safeInsets();
  const m = 8;
  return { x: i.left + m, y: i.top + m, w: Math.max(1, w - i.left - i.right - 2 * m), h: Math.max(1, h - i.top - i.bottom - 2 * m) };
}

export interface LevelLayout {
  portrait: boolean;
  /** HUD area: moves, goals, score bar, back button. Above the board in portrait, left of it in landscape. */
  hud: Rect;
  /** The board's pixel rect; exactly cols*cell by rows*cell. */
  board: Rect;
  /** Cell size in px (square). */
  cell: number;
}

/** Where the HUD and the board go for a screen of w x h CSS px. */
export function levelLayout(w: number, h: number, rows: number, cols: number): LevelLayout {
  const s = safeRect(w, h);
  const portrait = s.h >= s.w * 1.1;
  let hud: Rect;
  let area: Rect;
  if (portrait) {
    const hudH = Math.min(Math.max(150, s.h * 0.24), 240);
    hud = { x: s.x, y: s.y, w: s.w, h: hudH };
    area = { x: s.x, y: s.y + hudH, w: s.w, h: s.h - hudH };
  } else {
    const hudW = Math.min(Math.max(190, s.w * 0.3), 340);
    hud = { x: s.x, y: s.y, w: hudW, h: s.h };
    area = { x: s.x + hudW, y: s.y, w: s.w - hudW, h: s.h };
  }
  const cell = Math.max(16, Math.floor(Math.min(area.w / cols, area.h / rows)));
  const bw = cell * cols;
  const bh = cell * rows;
  const board = { x: Math.round(area.x + (area.w - bw) / 2), y: Math.round(area.y + (area.h - bh) / 2), w: bw, h: bh };
  return { portrait, hud, board, cell };
}

/** Fit a design-size box (dw x dh) inside r, centred. Returns the scale and the top-left. */
export function fitBox(r: Rect, dw: number, dh: number): { scale: number; x: number; y: number } {
  const scale = Math.min(r.w / dw, r.h / dh);
  return { scale, x: r.x + (r.w - dw * scale) / 2, y: r.y + (r.h - dh * scale) / 2 };
}
