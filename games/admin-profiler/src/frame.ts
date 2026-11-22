// The frame view: one hitch's systems on the frame's own clock (a flame-style Gantt).
// Nested timed() calls stack below their parent. Gaps between systems are untimed work (browser, GC, untimed code).
// Guides: 16.7 ms (60 fps), 33.3 ms (30 fps) and the profiler's threshold. Same zoom / pan keys as the timeline.
import { colorFor, fitText, fmtMs, KIND_COLOR, niceStep, surface, THEME } from './canvas';
import type { ViewHitch, ViewSpan } from './data';
import { attachAxis } from './interact';

const LABEL = 8;
const RULER = 22;
const ROW = 22;

/** Depth per span: a span that starts inside another (and fits in it) goes one row below it. */
export function layoutSpans(spans: ViewSpan[]): { span: ViewSpan; depth: number }[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.ms - a.ms);
  const stack: ViewSpan[] = [];
  return sorted.map((span) => {
    while (stack.length && stack[stack.length - 1].start + stack[stack.length - 1].ms <= span.start + 1e-6) stack.pop();
    const depth = stack.length;
    stack.push(span);
    return { span, depth };
  });
}

export interface FrameView {
  set(h: ViewHitch | null, thresholdMs: number): void;
}

export function createFrameView(host: HTMLElement, tip: HTMLElement): FrameView {
  let hitch: ViewHitch | null = null;
  let threshold = 80;
  let rows: { span: ViewSpan; depth: number }[] = [];
  let hover = -1;

  const { s, redraw } = surface(host, ({ ctx, w, h }) => {
    ctx.font = THEME.mono;
    const v = axis.view;
    const plotW = w - LABEL;
    const x = (t: number): number => LABEL + ((t - v.start) / (v.end - v.start)) * plotW;
    if (!hitch) {
      ctx.fillStyle = THEME.dim;
      ctx.fillText('Click a hitch in the timeline (or a row in the list) to break it down.', LABEL + 6, RULER + 24);
      return;
    }
    // Ruler.
    const step = niceStep(v.end - v.start, Math.max(2, Math.floor(plotW / 80)));
    for (let t = Math.ceil(v.start / step) * step; t <= v.end; t += step) {
      const xx = Math.round(x(t)) + 0.5;
      ctx.strokeStyle = THEME.grid;
      ctx.beginPath();
      ctx.moveTo(xx, RULER - 6);
      ctx.lineTo(xx, h);
      ctx.stroke();
      ctx.fillStyle = THEME.dim;
      ctx.fillText(fmtMs(t), xx + 3, 13);
    }
    ctx.strokeStyle = THEME.gridStrong;
    ctx.beginPath();
    ctx.moveTo(0, RULER + 0.5);
    ctx.lineTo(w, RULER + 0.5);
    ctx.stroke();

    // The frame itself (the whole hitch) as the top bar; untimed time shows through as its hatching.
    const top = RULER + 4;
    const fx0 = x(0);
    const fx1 = x(hitch.ms);
    ctx.fillStyle = '#262a31';
    ctx.fillRect(fx0, top, fx1 - fx0, ROW - 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx0, top, fx1 - fx0, ROW - 3);
    ctx.clip();
    ctx.strokeStyle = '#ffffff10';
    for (let hx = fx0 - ROW; hx < fx1; hx += 6) {
      ctx.beginPath();
      ctx.moveTo(hx, top + ROW);
      ctx.lineTo(hx + ROW, top);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = hitch.spans.length ? THEME.text : KIND_COLOR[hitch.kind] ?? THEME.text;
    const label = hitch.spans.length
      ? `${hitch.kind}  ${fmtMs(hitch.ms)}`
      : `${hitch.kind}  ${fmtMs(hitch.ms)}  ·  no breakdown: ${hitch.kind === 'longtask' ? 'a long task outside the timed frame (timers, network, promise callbacks)' : hitch.kind === 'gap' ? 'a gap between animation frames (the game does not time its frames)' : 'not timed'}`;
    ctx.fillText(fitText(ctx, label, Math.max(0, Math.min(w, fx1) - Math.max(LABEL, fx0) - 8)), Math.max(LABEL, fx0) + 4, top + 14);

    // Spans.
    rows.forEach(({ span, depth }, i) => {
      const x0 = x(span.start);
      const x1 = x(span.start + span.ms);
      if (x1 < 0 || x0 > w) return;
      const y = top + ROW * (depth + 1);
      const bw = Math.max(1, x1 - x0 - 1);
      ctx.fillStyle = colorFor(span.name);
      ctx.globalAlpha = hover >= 0 && hover !== i ? 0.7 : 1;
      ctx.fillRect(x0, y, bw, ROW - 3);
      ctx.globalAlpha = 1;
      if (hover === i) {
        ctx.strokeStyle = THEME.select;
        ctx.strokeRect(x0 + 0.5, y + 0.5, bw - 1, ROW - 4);
      }
      if (bw > 24) {
        ctx.fillStyle = '#0b0d10';
        ctx.font = THEME.monoBold;
        const t = fitText(ctx, `${span.name} ${fmtMs(span.ms)}`, bw - 6);
        ctx.fillText(t, Math.max(x0, LABEL) + 3, y + 13);
        ctx.font = THEME.mono;
      }
    });

    // Budget guides.
    const guide = (ms: number, color: string, text: string, row: number): void => {
      const gx = Math.round(x(ms)) + 0.5;
      if (gx < LABEL || gx > w) return;
      ctx.strokeStyle = color;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(gx, RULER);
      ctx.lineTo(gx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      // Stagger the labels so close guides (16.7 / 33.3 / 80 ms on a long frame) stay readable.
      const tw = ctx.measureText(text).width + 6;
      ctx.fillStyle = THEME.bg + 'dd';
      ctx.fillRect(gx + 1, h - 18 - row * 14, tw, 13);
      ctx.fillStyle = color;
      ctx.fillText(text, gx + 3, h - 8 - row * 14);
    };
    guide(1000 / 60, THEME.budget60, '60 fps', 2);
    guide(1000 / 30, THEME.budget30, '30 fps', 1);
    guide(threshold, THEME.threshold, `threshold ${threshold} ms`, 0);
  });

  const spanAt = (px: number, py: number): number => {
    if (!hitch) return -1;
    const v = axis.view;
    const t = v.start + ((px - LABEL) / (s.w - LABEL)) * (v.end - v.start);
    const depth = Math.floor((py - RULER - 4) / ROW) - 1;
    return rows.findIndex((r) => r.depth === depth && t >= r.span.start && t <= r.span.start + r.span.ms);
  };

  const axis = attachAxis({
    el: host,
    inset: () => LABEL,
    width: () => s.w,
    full: () => ({ start: 0, end: Math.max(hitch ? hitch.ms : 100, threshold) * 1.04 }),
    minSpan: 0.2,
    onChange: () => redraw(),
    onHover: (px, py) => {
      hover = spanAt(px, py);
      if (hover >= 0 && hitch) {
        const sp = rows[hover].span;
        tip.textContent = `${sp.name}\n${fmtMs(sp.ms)} (${((sp.ms / hitch.ms) * 100).toFixed(1)}% of frame)\nstarts at ${fmtMs(sp.start)}`;
        tip.hidden = false;
        const r = host.getBoundingClientRect();
        tip.style.left = `${Math.min(r.width - tip.offsetWidth - 4, px + 14)}px`;
        tip.style.top = `${Math.max(4, Math.min(py, r.height - tip.offsetHeight - 4))}px`;
      } else tip.hidden = true;
      redraw();
    },
    onLeave: () => {
      hover = -1;
      tip.hidden = true;
      redraw();
    },
  });

  return {
    set(h, t) {
      hitch = h;
      threshold = t;
      rows = h ? layoutSpans(h.spans) : [];
      const depth = rows.reduce((m, r) => Math.max(m, r.depth + 1), 0);
      host.style.height = `${RULER + 4 + ROW * (depth + 1) + 50}px`;
      hover = -1;
      axis.fit();
    },
  };
}
