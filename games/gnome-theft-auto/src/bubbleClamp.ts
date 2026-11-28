// Pure screen-space rules for speech bubbles (no three.js, no DOM): cap the on-screen size, keep the bubble inside the
// view and clear of the HUD corners, and show at most the nearest few. Used by makeBubbleSprite in ambientGnomes.ts.

export interface ScreenRect { x: number; y: number; w: number; h: number } // CSS px, origin top-left
export interface BubbleView { w: number; h: number; insets?: { top: number; right: number; bottom: number; left: number } }

export const BUBBLE = {
  /** Widest a bubble may be on screen, px (desktop) and as a fraction of the view width on a phone. */
  maxW: 340, maxWPhoneFrac: 0.6,
  /** Narrower views than this are phones. */
  phoneBelow: 600,
  /** Keep this far inside the view (plus safe-area insets), px. */
  margin: 10,
  /** Hide a bubble when the camera is within this many metres (horizontal) of it. */
  hideNear: 3,
  /** At most this many bubbles on screen at once (the nearest to the camera). */
  maxShown: 2,
} as const;

/** The HUD corners a bubble must keep clear of (top-left stats panel, top-right minimap + buttons), for a view. */
export function hudCorners(view: BubbleView): ScreenRect[] {
  const ins = view.insets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const phone = view.w < BUBBLE.phoneBelow;
  // Top-left: the stats panel (max-width 190 px, about 150-190 px tall). Top-right: the minimap and the icon/gun column.
  const lw = Math.min(210, view.w * (phone ? 0.5 : 0.25)) + ins.left;
  const lh = Math.min(190, view.h * (phone ? 0.24 : 0.34)) + ins.top;
  const rw = Math.min(170, view.w * (phone ? 0.42 : 0.18)) + ins.right;
  const rh = Math.min(300, view.h * (phone ? 0.3 : 0.5)) + ins.top;
  return [
    { x: 0, y: 0, w: lw, h: lh },
    { x: view.w - rw, y: 0, w: rw, h: rh },
  ];
}

function overlaps(a: ScreenRect, b: ScreenRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Fit a bubble whose centre projects to (cx, cy) with an unclamped on-screen size w x h px: returns the new centre
 *  and a scale factor k <= 1 for the size (k = 0 means hide). */
export function clampBubble(cx: number, cy: number, w: number, h: number, view: BubbleView): { cx: number; cy: number; k: number } {
  if (!(w > 0) || !(h > 0)) return { cx, cy, k: 0 };
  const ins = view.insets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const cap = view.w < BUBBLE.phoneBelow ? BUBBLE.maxWPhoneFrac * view.w : BUBBLE.maxW;
  const k = Math.min(1, cap / w);
  const bw = w * k, bh = h * k;
  const minX = BUBBLE.margin + ins.left, maxX = view.w - BUBBLE.margin - ins.right;
  const minY = BUBBLE.margin + ins.top, maxY = view.h - BUBBLE.margin - ins.bottom;
  if (maxX - minX < bw || maxY - minY < bh) return { cx, cy, k: 0 };
  const place = (x: number, y: number) => ({
    x: Math.min(Math.max(x, minX + bw / 2), maxX - bw / 2),
    y: Math.min(Math.max(y, minY + bh / 2), maxY - bh / 2),
  });
  let p = place(cx, cy);
  const rect = (q: { x: number; y: number }): ScreenRect => ({ x: q.x - bw / 2, y: q.y - bh / 2, w: bw, h: bh });
  for (const hud of hudCorners(view)) {
    if (!overlaps(rect(p), hud)) continue;
    const below = place(p.x, hud.y + hud.h + BUBBLE.margin + bh / 2);
    if (!overlaps(rect(below), hud)) {
      p = below;
    } else {
      // No room below: slide toward the horizontal centre until clear of this corner.
      const left = hud.x < view.w / 2;
      const x = left ? hud.x + hud.w + BUBBLE.margin + bw / 2 : hud.x - BUBBLE.margin - bw / 2;
      const moved = place(x, p.y);
      p = overlaps(rect(moved), hud) ? place(view.w / 2, p.y) : moved;
    }
  }
  return { cx: p.x, cy: p.y, k };
}

/** Of the candidates (id, distance to camera), the ids allowed to show: the maxShown nearest. */
export function pickShown<T>(cands: readonly { id: T; dist: number }[], max: number = BUBBLE.maxShown): Set<T> {
  return new Set([...cands].sort((a, b) => a.dist - b.dist).slice(0, max).map((c) => c.id));
}
