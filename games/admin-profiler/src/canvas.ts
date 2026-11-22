// Shared drawing bits: the system colour table, a HiDPI canvas that redraws on resize, and number formats.

// A profiler palette (saturated mid-tones that read on the dark background, like a trace viewer's).
const PALETTE = ['#4e9bff', '#f2a93b', '#5ccf84', '#e8615a', '#b07cf0', '#41c7c7', '#e879b9', '#c9d24a', '#ff8f5a', '#7f8cff', '#8bd05f', '#d9a066'];
const FIXED: Record<string, string> = { '(other)': '#5d6573', '(untimed)': '#8a6f9e', render: '#4e9bff' };
const assigned = new Map<string, string>();

/** A stable colour per system name for this page (first come, first served from the palette). */
export function colorFor(name: string): string {
  if (FIXED[name]) return FIXED[name];
  if (name.startsWith('music')) return '#d9a066';
  let c = assigned.get(name);
  if (!c) {
    const used = new Set(assigned.values());
    c = PALETTE.find((p) => !used.has(p) && p !== FIXED.render);
    if (!c) {
      let h = 0;
      for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      c = `hsl(${h % 360} 62% 60%)`;
    }
    assigned.set(name, c);
  }
  return c;
}

/** A translucent band colour for a context value (zone, level), without using up the system palette. */
export function zoneColor(name: string): string {
  let h = 7;
  for (const ch of name) h = (h * 131 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 45% 50% / 0.28)`;
}

/** Kind colours for hitches without spans. */
export const KIND_COLOR: Record<string, string> = { frame: '#4e9bff', longtask: '#e8615a', gap: '#b07cf0', mark: '#d9a066' };

export const THEME = {
  bg: '#16181c',
  panel: '#1d2025',
  grid: '#2a2e35',
  gridStrong: '#3a3f48',
  text: '#d7dbe2',
  dim: '#8a929e',
  accent: '#f2a93b',
  budget60: '#5ccf84',
  budget30: '#f2a93b',
  threshold: '#e8615a',
  select: '#ffffff',
  mono: '11px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace',
  monoBold: 'bold 11px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace',
};

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** CSS pixels. */
  w: number;
  h: number;
}

/** A canvas filling `host`, sized for the device pixel ratio, that calls draw() on resize. */
export function surface(host: HTMLElement, draw: (s: Surface) => void): { s: Surface; redraw: () => void } {
  const canvas = document.createElement('canvas');
  host.append(canvas);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const s: Surface = { canvas, ctx, w: 0, h: 0 };
  let queued = false;
  const redraw = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const r = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = Math.max(1, Math.floor(r.width));
      s.h = Math.max(1, Math.floor(r.height));
      if (canvas.width !== s.w * dpr || canvas.height !== s.h * dpr) {
        canvas.width = s.w * dpr;
        canvas.height = s.h * dpr;
        canvas.style.width = `${s.w}px`;
        canvas.style.height = `${s.h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, s.w, s.h);
      draw(s);
    });
  };
  new ResizeObserver(redraw).observe(host);
  return { s, redraw };
}

export function fmtMs(v: number): string {
  if (v >= 10000) return `${(v / 1000).toFixed(1)} s`;
  if (v >= 100) return `${Math.round(v)} ms`;
  if (v >= 10) return `${v.toFixed(1)} ms`;
  return `${v.toFixed(2)} ms`;
}

/** A clock time for an axis: "14:05", or "Nov 21" when the span is days. */
export function fmtTime(t: number, spanMs: number): string {
  const d = new Date(t);
  if (spanMs > 2 * 24 * 3600e3) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (spanMs < 8 * 24 * 3600e3 ? ` ${d.getHours().toString().padStart(2, '0')}h` : '');
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** A session clock (ms since page load): "1:23.4" or "12.3 s". */
export function fmtClock(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`;
  const m = Math.floor(ms / 60000);
  return `${m}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;
}

/** A "nice" step for an axis covering `range` with about `ticks` ticks. */
export function niceStep(range: number, ticks: number): number {
  const raw = range / Math.max(1, ticks);
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
}

/** Text clipped to `maxW` px with an ellipsis ('' when not even one character fits). */
export function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? text.slice(0, lo) + '…' : '';
}
