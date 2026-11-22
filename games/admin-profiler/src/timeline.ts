// The session timeline (a track view, like a trace viewer's): every hitch of one page load on its own clock.
//   FRAME TIME   one spike per hitch, height = duration (with the threshold line)
//   ZONE         the game's context over time (zone / level), as coloured segments
//   FRAMES · LONG TASKS · GAPS · MARKS   one lane per kind, bar width = duration
// Wheel / pinch zoom, drag pan, W/S/A/D, F or double-click to fit; click a hitch to open it in the frame view.
import { colorFor, fitText, fmtClock, fmtMs, KIND_COLOR, niceStep, surface, THEME, zoneColor } from './canvas';
import type { ViewHitch } from './data';
import { attachAxis } from './interact';

const LABEL = 92;
const RULER = 22;
const SPIKE_H = 64;
const LANE_H = 22;
const KIND_LANES: [kind: string, label: string][] = [['frame', 'FRAMES'], ['longtask', 'LONG TASKS'], ['gap', 'GAPS'], ['mark', 'MARKS']];

/** The system that took the most time in a hitch (its colour), or the hitch kind. */
export function dominant(h: ViewHitch): string {
  let best = '';
  let bestMs = -1;
  const sums: Record<string, number> = {};
  for (const s of h.spans) sums[s.name] = (sums[s.name] ?? 0) + s.ms;
  for (const [n, ms] of Object.entries(sums)) if (ms > bestMs) [best, bestMs] = [n, ms];
  return best;
}

export interface Timeline {
  set(hitches: ViewHitch[], thresholdMs: number, lengthMs: number): void;
  select(i: number): void;
}

export function createTimeline(host: HTMLElement, tip: HTMLElement, onSelect: (i: number) => void): Timeline {
  let hs: ViewHitch[] = [];
  let threshold = 80;
  let length = 1;
  let selected = -1;
  let hover = -1;
  let lanes: string[] = [];

  const heightNeeded = (): number => RULER + SPIKE_H + 8 + LANE_H * (1 + lanes.length) + 6;

  const { s, redraw } = surface(host, ({ ctx, w, h }) => {
    ctx.font = THEME.mono;
    const v = axis.view;
    const plotW = w - LABEL;
    const x = (t: number): number => LABEL + ((t - v.start) / (v.end - v.start)) * plotW;
    // Label column.
    ctx.fillStyle = THEME.panel;
    ctx.fillRect(0, 0, LABEL, h);
    // Ruler.
    const step = niceStep(v.end - v.start, Math.max(2, Math.floor(plotW / 90)));
    ctx.fillStyle = THEME.dim;
    for (let t = Math.ceil(v.start / step) * step; t <= v.end; t += step) {
      const xx = Math.round(x(t)) + 0.5;
      ctx.strokeStyle = THEME.grid;
      ctx.beginPath();
      ctx.moveTo(xx, RULER - 6);
      ctx.lineTo(xx, h);
      ctx.stroke();
      ctx.fillText(fmtClock(t), xx + 3, 13);
    }
    ctx.strokeStyle = THEME.gridStrong;
    ctx.beginPath();
    ctx.moveTo(LABEL, RULER + 0.5);
    ctx.lineTo(w, RULER + 0.5);
    ctx.stroke();
    if (hs.length === 0) {
      ctx.fillStyle = THEME.dim;
      ctx.fillText('Pick a session to see its hitches on a timeline.', LABEL + 10, RULER + 30);
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(LABEL, 0, plotW, h);
    ctx.clip();

    // Frame-time spikes (sqrt scale so a 2 s freeze does not flatten 100 ms ones).
    const spikeTop = RULER + 6;
    const maxMs = Math.max(threshold * 2, ...hs.map((q) => q.ms));
    const sy = (ms: number): number => spikeTop + SPIKE_H - Math.sqrt(ms / maxMs) * SPIKE_H;
    const ty = Math.round(sy(threshold)) + 0.5;
    ctx.strokeStyle = THEME.threshold + '99';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(LABEL, ty);
    ctx.lineTo(w, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    hs.forEach((q, i) => {
      const xx = x(q.at);
      if (xx < LABEL - 4 || xx > w + 4) return;
      const c = q.spans.length ? colorFor(dominant(q)) : KIND_COLOR[q.kind] ?? THEME.dim;
      const bw = Math.max(2, x(q.at + q.ms) - xx);
      ctx.fillStyle = i === selected ? THEME.select : c;
      ctx.globalAlpha = hover >= 0 && hover !== i && i !== selected ? 0.55 : 1;
      ctx.fillRect(xx, sy(q.ms), bw, spikeTop + SPIKE_H - sy(q.ms));
    });
    ctx.globalAlpha = 1;

    // Zone lane: segments between context changes.
    let y = spikeTop + SPIKE_H + 8;
    const zoneKey = hs.some((q) => q.ctx.zone) ? 'zone' : Object.keys(hs[0].ctx)[0];
    if (zoneKey) {
      let segStart = 0;
      let cur = hs[0].ctx[zoneKey] ?? '';
      const segs: [number, number, string][] = [];
      for (const q of hs) {
        const z = q.ctx[zoneKey] ?? cur;
        if (z !== cur) {
          segs.push([segStart, q.at, cur]);
          segStart = q.at;
          cur = z;
        }
      }
      segs.push([segStart, length, cur]);
      for (const [a, b, z] of segs) {
        const x0 = Math.max(LABEL, x(a));
        const x1 = Math.min(w, x(b));
        if (x1 <= x0) continue;
        ctx.fillStyle = zoneColor(z);
        ctx.fillRect(x0, y + 2, x1 - x0 - 1, LANE_H - 4);
        ctx.fillStyle = THEME.text;
        ctx.fillText(fitText(ctx, z, x1 - x0 - 8), x0 + 4, y + 15);
      }
    }
    y += LANE_H;

    // One lane per kind.
    for (const kind of lanes) {
      ctx.fillStyle = '#ffffff06';
      ctx.fillRect(LABEL, y + 1, plotW, LANE_H - 2);
      hs.forEach((q, i) => {
        if (q.kind !== kind) return;
        const x0 = x(q.at);
        const x1 = x(q.at + q.ms);
        if (x1 < LABEL || x0 > w) return;
        const bw = Math.max(3, x1 - x0);
        ctx.fillStyle = i === selected ? THEME.select : q.spans.length && kind === 'frame' ? colorFor(dominant(q)) : KIND_COLOR[kind];
        ctx.fillRect(x0, y + 3, bw, LANE_H - 6);
        if (i === selected) {
          ctx.strokeStyle = THEME.accent;
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 - 1, y + 2, bw + 2, LANE_H - 4);
          ctx.lineWidth = 1;
        }
        if (bw > 40) {
          ctx.fillStyle = '#0b0d10';
          ctx.fillText(fitText(ctx, fmtMs(q.ms), bw - 6), x0 + 3, y + 15);
        }
      });
      y += LANE_H;
    }
    ctx.restore();

    // Lane labels.
    ctx.fillStyle = THEME.dim;
    ctx.fillText('FRAME TIME', 8, spikeTop + 12);
    ctx.fillText(`${fmtMs(maxMs)}`, 8, spikeTop + 26);
    let ly = spikeTop + SPIKE_H + 8;
    ctx.fillText((zoneKey ?? 'CONTEXT').toUpperCase(), 8, ly + 15);
    ly += LANE_H;
    for (const kind of lanes) {
      ctx.fillStyle = KIND_COLOR[kind];
      ctx.fillRect(8, ly + 7, 6, 8);
      ctx.fillStyle = THEME.dim;
      ctx.fillText(KIND_LANES.find(([k]) => k === kind)?.[1] ?? kind, 18, ly + 15);
      ly += LANE_H;
    }
  });

  const hitAt = (px: number, py: number): number => {
    if (px < LABEL || hs.length === 0) return -1;
    const v = axis.view;
    const t = v.start + ((px - LABEL) / (s.w - LABEL)) * (v.end - v.start);
    const slop = ((v.end - v.start) / (s.w - LABEL)) * 6;
    let best = -1;
    let bestD = Infinity;
    const laneTop = RULER + 6 + SPIKE_H + 8 + LANE_H;
    const lane = py >= laneTop ? lanes[Math.floor((py - laneTop) / LANE_H)] : undefined;
    hs.forEach((q, i) => {
      if (lane && q.kind !== lane) return;
      const d = t < q.at ? q.at - t : t > q.at + q.ms ? t - q.at - q.ms : 0;
      if (d <= slop && (d < bestD || (d === bestD && q.ms > hs[best].ms))) {
        best = i;
        bestD = d;
      }
    });
    return best;
  };

  const showTip = (i: number, px: number, py: number): void => {
    if (i < 0) {
      tip.hidden = true;
      return;
    }
    const q = hs[i];
    const top = Object.entries(q.spans.reduce<Record<string, number>>((a, sp) => ((a[sp.name] = (a[sp.name] ?? 0) + sp.ms), a), {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([n, ms]) => `${n} ${fmtMs(ms)}`)
      .join('\n');
    tip.textContent = `${q.kind} ${fmtMs(q.ms)} at ${fmtClock(q.at)}\n${Object.entries(q.ctx).map(([k, val]) => `${k}=${val}`).join(' ')}${top ? `\n${top}` : ''}`;
    tip.hidden = false;
    const r = host.getBoundingClientRect();
    tip.style.left = `${Math.min(r.width - tip.offsetWidth - 4, px + 14)}px`;
    tip.style.top = `${Math.max(4, Math.min(py, r.height - tip.offsetHeight - 4))}px`;
  };

  const axis = attachAxis({
    el: host,
    inset: () => LABEL,
    width: () => s.w,
    full: () => ({ start: 0, end: Math.max(1000, length) }),
    minSpan: 50,
    onChange: () => redraw(),
    onClick: (px, py) => {
      const i = hitAt(px, py);
      if (i >= 0) onSelect(i);
    },
    onHover: (px, py) => {
      hover = hitAt(px, py);
      showTip(hover, px, py);
      redraw();
    },
    onLeave: () => {
      hover = -1;
      tip.hidden = true;
      redraw();
    },
  });

  return {
    set(next, t, len) {
      hs = next;
      threshold = t;
      length = Math.max(len, ...next.map((q) => q.at + q.ms)) * 1.02;
      selected = -1;
      lanes = KIND_LANES.map(([k]) => k).filter((k) => next.some((q) => q.kind === k));
      host.style.height = `${heightNeeded()}px`;
      axis.fit();
    },
    select(i) {
      selected = i;
      const q = hs[i];
      // Keep the selection on screen.
      if (q && (q.at < axis.view.start || q.at > axis.view.end)) {
        const span = axis.view.end - axis.view.start;
        axis.set({ start: q.at - span / 2, end: q.at + span / 2 });
      }
      redraw();
    },
  };
}
