// The time series: two stacked panes sharing a time axis.
//   top:    hitch time per bucket, stacked by system (where the time went)
//   bottom: hitch duration per bucket, p50 / p95 / max lines over hitch-count columns, with the threshold
// Hover shows a crosshair and the bucket's breakdown; drag across it to zoom to that range; double-click resets.
import { colorFor, fitText, fmtMs, fmtTime, niceStep, surface, THEME } from './canvas';
import type { ViewSeries } from './data';

const LEFT = 56;
const RIGHT = 12;
const TOP = 8;
const AXIS = 20;
const GAP = 14;

export interface SeriesChart {
  set(series: ViewSeries | null, since: number, until: number, thresholdMs: number): void;
  /** Systems hidden from the stack (legend toggles). */
  hidden: Set<string>;
  redraw(): void;
}

export function createSeriesChart(host: HTMLElement, tip: HTMLElement, onRange: (since: number, until: number) => void, onReset: () => void): SeriesChart {
  let data: ViewSeries | null = null;
  let since = 0;
  let until = 1;
  let threshold = 80;
  let hover = -1;
  let brush: [number, number] | null = null;
  const hidden = new Set<string>();

  const xOf = (t: number, w: number): number => LEFT + ((t - since) / (until - since)) * (w - LEFT - RIGHT);
  const tOf = (x: number, w: number): number => since + ((x - LEFT) / (w - LEFT - RIGHT)) * (until - since);

  const { s, redraw } = surface(host, ({ ctx, w, h }) => {
    ctx.font = THEME.mono;
    const plotH = h - TOP - AXIS - GAP;
    const aH = Math.round(plotH * 0.6);
    const bTop = TOP + aH + GAP;
    const bH = plotH - aH;
    if (!data || data.buckets.length === 0) {
      ctx.fillStyle = THEME.dim;
      ctx.fillText(data ? 'No hitches in this range.' : 'Loading…', LEFT, TOP + 20);
      return;
    }
    const buckets = data.buckets;
    const names = [...data.systems.map((x) => x.name), '(other)', '(untimed)'].filter((n, i, a) => a.indexOf(n) === i);
    const order = names.filter((n) => !hidden.has(n));
    const stackMax = Math.max(1, ...buckets.map((b) => order.reduce((a, n) => a + (b.system[n] ?? 0), 0)));
    const durMax = Math.max(threshold * 1.5, ...buckets.map((b) => b.max));
    const countMax = Math.max(1, ...buckets.map((b) => b.hitches));
    const colW = Math.max(1, (w - LEFT - RIGHT) / buckets.length);

    // Grids and y labels.
    const yGrid = (top: number, height: number, max: number, fmt: (v: number) => string, label: string): ((v: number) => number) => {
      const y = (v: number): number => top + height - (v / max) * height;
      const step = niceStep(max, Math.max(2, Math.floor(height / 28)));
      ctx.textAlign = 'right';
      for (let v = 0; v <= max + 1e-9; v += step) {
        const yy = Math.round(y(v)) + 0.5;
        ctx.strokeStyle = v === 0 ? THEME.gridStrong : THEME.grid;
        ctx.beginPath();
        ctx.moveTo(LEFT, yy);
        ctx.lineTo(w - RIGHT, yy);
        ctx.stroke();
        ctx.fillStyle = THEME.dim;
        ctx.fillText(fmt(v), LEFT - 6, yy + 4);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = THEME.dim;
      ctx.fillText(label, LEFT + 4, top + 11);
      return y;
    };

    const yA = yGrid(TOP, aH, stackMax, (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}s` : `${Math.round(v)}`), 'HITCH TIME BY SYSTEM (ms)');
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const x = LEFT + i * colW;
      let acc = 0;
      for (const n of order) {
        const v = b.system[n] ?? 0;
        if (v <= 0) continue;
        const y0 = yA(acc);
        const y1 = yA(acc + v);
        ctx.fillStyle = colorFor(n);
        ctx.globalAlpha = hover === i || hover < 0 ? 0.95 : 0.6;
        ctx.fillRect(x + (colW > 4 ? 1 : 0), y1, Math.max(1, colW - (colW > 4 ? 2 : 0)), Math.max(0.5, y0 - y1));
        acc += v;
      }
    }
    ctx.globalAlpha = 1;

    const yB = yGrid(bTop, bH, durMax, (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}`), 'HITCH DURATION (ms)  p50 · p95 · max');
    // Hitch count as faint columns behind the lines (own scale, no axis: the tooltip has the number).
    ctx.fillStyle = '#2b3442';
    for (let i = 0; i < buckets.length; i++) {
      const ch = (buckets[i].hitches / countMax) * bH * 0.9;
      ctx.fillRect(LEFT + i * colW + (colW > 4 ? 1 : 0), bTop + bH - ch, Math.max(1, colW - (colW > 4 ? 2 : 0)), ch);
    }
    // Threshold line.
    const ty = Math.round(yB(threshold)) + 0.5;
    ctx.strokeStyle = THEME.threshold;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(LEFT, ty);
    ctx.lineTo(w - RIGHT, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = THEME.threshold;
    ctx.textAlign = 'right';
    ctx.fillText(`threshold ${threshold} ms`, w - RIGHT - 4, ty - 4);
    ctx.textAlign = 'left';
    const line = (pick: (i: number) => number, color: string, width: number): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < buckets.length; i++) {
        if (buckets[i].hitches === 0) {
          pen = false;
          continue;
        }
        const x = LEFT + (i + 0.5) * colW;
        const y = yB(pick(i));
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
        if (colW > 6) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    ctx.fillStyle = '#e8615a';
    line((i) => buckets[i].max, '#e8615a88', 1);
    ctx.fillStyle = THEME.accent;
    line((i) => buckets[i].p95, THEME.accent, 2);
    ctx.fillStyle = '#5ccf84';
    line((i) => buckets[i].p50, '#5ccf84', 1.5);

    // Time axis.
    const span = until - since;
    const step = niceTimeStep(span, Math.max(2, Math.floor((w - LEFT) / 90)));
    ctx.fillStyle = THEME.dim;
    ctx.textAlign = 'center';
    for (let t = Math.ceil(since / step) * step; t < until; t += step) {
      const x = Math.round(xOf(t, w)) + 0.5;
      ctx.strokeStyle = THEME.grid;
      ctx.beginPath();
      ctx.moveTo(x, h - AXIS);
      ctx.lineTo(x, h - AXIS + 4);
      ctx.stroke();
      ctx.fillText(fitText(ctx, fmtTime(t, span), 86), x, h - 6);
    }
    ctx.textAlign = 'left';

    // Crosshair and brush.
    if (hover >= 0 && !brush) {
      const x = LEFT + (hover + 0.5) * colW;
      ctx.strokeStyle = '#ffffff55';
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, TOP);
      ctx.lineTo(Math.round(x) + 0.5, h - AXIS);
      ctx.stroke();
    }
    if (brush) {
      const [a, b] = brush[0] < brush[1] ? brush : [brush[1], brush[0]];
      ctx.fillStyle = '#4e9bff22';
      ctx.fillRect(a, TOP, b - a, h - AXIS - TOP);
      ctx.strokeStyle = '#4e9bffaa';
      ctx.strokeRect(a + 0.5, TOP + 0.5, b - a, h - AXIS - TOP);
    }
  });

  const bucketAt = (x: number): number => {
    if (!data || data.buckets.length === 0 || x < LEFT || x > s.w - RIGHT) return -1;
    return Math.min(data.buckets.length - 1, Math.max(0, Math.floor(((x - LEFT) / (s.w - LEFT - RIGHT)) * data.buckets.length)));
  };

  const showTip = (i: number, x: number, y: number): void => {
    if (!data || i < 0) {
      tip.hidden = true;
      return;
    }
    const b = data.buckets[i];
    const rows = Object.entries(b.system).sort((p, q) => q[1] - p[1]).slice(0, 8);
    tip.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'tip-head';
    head.textContent = `${new Date(b.start).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${Math.round(data.bucketMs / 60000)} min`;
    tip.append(head);
    const stat = document.createElement('div');
    stat.className = 'tip-stats';
    stat.textContent = `${b.hitches} hitches · ${b.sessions} sessions\np50 ${fmtMs(b.p50)} · p95 ${fmtMs(b.p95)} · max ${fmtMs(b.max)}`;
    tip.append(stat);
    for (const [n, v] of rows) {
      const r = document.createElement('div');
      r.className = 'tip-row';
      const sw = document.createElement('i');
      sw.style.background = colorFor(n);
      const name = document.createElement('span');
      name.textContent = n;
      const val = document.createElement('b');
      val.textContent = fmtMs(v);
      r.append(sw, name, val);
      tip.append(r);
    }
    tip.hidden = false;
    const hostR = host.getBoundingClientRect();
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.min(hostR.width - tw - 4, Math.max(4, x + 14))}px`;
    tip.style.top = `${Math.max(4, Math.min(y, hostR.height - tip.offsetHeight - 4))}px`;
  };

  const c = s.canvas;
  c.style.touchAction = 'pan-y';
  let down: { x: number; id: number } | null = null;
  c.addEventListener('pointerdown', (e) => {
    const x = e.offsetX;
    if (x < LEFT) return;
    down = { x, id: e.pointerId };
    c.setPointerCapture(e.pointerId);
  });
  c.addEventListener('pointermove', (e) => {
    const x = e.offsetX;
    if (down && Math.abs(x - down.x) > 6) {
      brush = [down.x, Math.max(LEFT, Math.min(s.w - RIGHT, x))];
      tip.hidden = true;
    } else if (!down || e.pointerType === 'mouse') {
      hover = bucketAt(x);
      showTip(hover, x, e.offsetY);
    }
    redraw();
  });
  c.addEventListener('pointerup', (e) => {
    if (brush) {
      const a = tOf(Math.min(...brush), s.w);
      const b = tOf(Math.max(...brush), s.w);
      brush = null;
      if (data && b - a > 60e3) onRange(a, b);
    } else if (e.pointerType !== 'mouse') {
      hover = bucketAt(e.offsetX);
      showTip(hover, e.offsetX, e.offsetY);
    }
    down = null;
    redraw();
  });
  c.addEventListener('pointerleave', () => {
    if (down) return;
    hover = -1;
    tip.hidden = true;
    redraw();
  });
  c.addEventListener('dblclick', () => onReset());

  return {
    hidden,
    redraw,
    set(series, a, b, t) {
      data = series;
      since = a;
      until = b;
      threshold = t;
      hover = -1;
      redraw();
    },
  };
}

const MIN = 60e3;
const HOUR = 60 * MIN;
const STEPS = [5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, HOUR, 2 * HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, 24 * HOUR, 2 * 24 * HOUR, 7 * 24 * HOUR];

function niceTimeStep(span: number, ticks: number): number {
  return STEPS.find((st) => span / st <= ticks) ?? STEPS[STEPS.length - 1];
}
