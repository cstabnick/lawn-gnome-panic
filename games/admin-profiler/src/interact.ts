// Zoom and pan for a horizontal time axis, the way trace viewers do it: wheel zooms around the cursor, drag pans,
// two fingers pinch, W/S zoom and A/D pan while the view has focus, double-click (or the F key) fits everything.
// A click or tap that did not move reports its x.

export interface View {
  /** Visible range, in the axis's own units. */
  start: number;
  end: number;
}

export interface AxisOptions {
  el: HTMLElement;
  /** Left inset of the plot (labels column), CSS px. */
  inset: () => number;
  width: () => number;
  /** The full range (what "fit" shows). */
  full: () => View;
  /** Narrowest visible range. */
  minSpan: number;
  onChange: (v: View) => void;
  onClick?: (x: number, y: number) => void;
  onHover?: (x: number, y: number) => void;
  onLeave?: () => void;
}

export function attachAxis(o: AxisOptions): { view: View; fit: () => void; set: (v: View) => void } {
  const view: View = { ...o.full() };
  const clamp = (): void => {
    const f = o.full();
    const fullSpan = f.end - f.start;
    let span = Math.max(o.minSpan, Math.min(view.end - view.start, fullSpan * 1.02));
    if (!Number.isFinite(span) || span <= 0) span = o.minSpan;
    let start = view.start;
    const pad = fullSpan * 0.01;
    start = Math.max(f.start - pad, Math.min(start, f.end + pad - span));
    view.start = start;
    view.end = start + span;
    o.onChange(view);
  };
  const plotW = (): number => Math.max(1, o.width() - o.inset());
  const toValue = (x: number): number => view.start + ((x - o.inset()) / plotW()) * (view.end - view.start);
  const zoomAt = (x: number, factor: number): void => {
    const at = toValue(x);
    view.start = at - (at - view.start) * factor;
    view.end = at + (view.end - at) * factor;
    clamp();
  };
  const pan = (dx: number): void => {
    const d = (dx / plotW()) * (view.end - view.start);
    view.start -= d;
    view.end -= d;
    clamp();
  };
  const fit = (): void => {
    Object.assign(view, o.full());
    clamp();
  };

  const el = o.el;
  el.tabIndex = 0;
  el.style.touchAction = 'none';
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pan(-e.deltaX);
      else zoomAt(e.clientX - r.left, Math.exp(e.deltaY * 0.0015));
    },
    { passive: false },
  );

  const pointers = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinch = 0;
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.abs(a.x - b.x);
    }
  });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const p = pointers.get(e.pointerId);
    if (!p) {
      o.onHover?.(e.clientX - r.left, e.clientY - r.top);
      return;
    }
    if (pointers.size === 2) {
      p.x = e.clientX;
      p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const d = Math.abs(a.x - b.x);
      if (pinch > 0 && d > 0) zoomAt((a.x + b.x) / 2 - r.left, pinch / d);
      pinch = d;
      moved += 10;
      return;
    }
    const dx = e.clientX - p.x;
    moved += Math.abs(dx) + Math.abs(e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;
    if (moved > 4) pan(dx);
    o.onHover?.(e.clientX - r.left, e.clientY - r.top);
  });
  const up = (e: PointerEvent): void => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const r = el.getBoundingClientRect();
    if (pointers.size === 0 && moved <= 4) o.onClick?.(e.clientX - r.left, e.clientY - r.top);
    if (pointers.size < 2) pinch = 0;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', () => {
    if (pointers.size === 0) o.onLeave?.();
  });
  el.addEventListener('dblclick', fit);
  el.addEventListener('keydown', (e) => {
    const mid = o.inset() + plotW() / 2;
    const k = e.key.toLowerCase();
    if (k === 'w') zoomAt(mid, 0.8);
    else if (k === 's') zoomAt(mid, 1.25);
    else if (k === 'a' || e.key === 'ArrowLeft') pan(plotW() * 0.15);
    else if (k === 'd' || e.key === 'ArrowRight') pan(-plotW() * 0.15);
    else if (k === 'f' || e.key === 'Home') fit();
    else return;
    e.preventDefault();
  });

  return {
    view,
    fit,
    set: (v) => {
      view.start = v.start;
      view.end = v.end;
      clamp();
    },
  };
}
