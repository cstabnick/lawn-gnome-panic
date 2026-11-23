// The frame-health chart: frame p50 and p95 (ms, left axis) and draw calls (own right-hand axis) per bucket, from the
// frame-health samples. Buckets with no samples are gaps. Hover shows the bucket's numbers.
import { fmtMs, fmtTime, niceStep, surface, THEME } from './canvas';
import { fmtTris } from './data';
import type { ViewBucket } from './data';

const LEFT = 56;
const RIGHT = 56;
const TOP = 8;
const AXIS = 20;

const C_P50 = '#5ccf84';
const C_P95 = THEME.accent;
const C_DRAWS = '#4e9bff';

export interface HealthChart {
  set(buckets: ViewBucket[], bucketMs: number): void;
}

export function createHealthChart(host: HTMLElement, tip: HTMLElement): HealthChart {
  let data: ViewBucket[] = [];
  let bucketMs = 60e3;
  let hover = -1;

  const { s, redraw } = surface(host, ({ ctx, w, h }) => {
    ctx.font = THEME.mono;
    if (!data.some((b) => b.samples > 0)) {
      ctx.fillStyle = THEME.dim;
      ctx.fillText('No frame samples in this range', LEFT, TOP + 20);
      return;
    }
    const plotH = h - TOP - AXIS;
    const plotW = w - LEFT - RIGHT;
    const n = data.length;
    const colW = plotW / n;
    const xOf = (i: number): number => LEFT + (i + 0.5) * colW;
    const msMax = Math.max(40, ...data.map((b) => b.frameP95));
    const dcMax = Math.max(1, ...data.map((b) => b.drawCalls));
    const yMs = (v: number): number => TOP + plotH - (v / msMax) * plotH;
    const yDc = (v: number): number => TOP + plotH - (v / dcMax) * plotH;

    // Grid and left labels (ms); the right labels are the same gridlines in draw calls.
    const step = niceStep(msMax, Math.max(2, Math.floor(plotH / 28)));
    for (let v = 0; v <= msMax + 1e-9; v += step) {
      const y = Math.round(yMs(v)) + 0.5;
      ctx.strokeStyle = v === 0 ? THEME.gridStrong : THEME.grid;
      ctx.beginPath();
      ctx.moveTo(LEFT, y);
      ctx.lineTo(w - RIGHT, y);
      ctx.stroke();
      ctx.fillStyle = THEME.dim;
      ctx.textAlign = 'right';
      ctx.fillText(fmtMs(v), LEFT - 6, y + 4);
      ctx.textAlign = 'left';
      ctx.fillText(String(Math.round((v / msMax) * dcMax)), w - RIGHT + 6, y + 4);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = THEME.dim;
    ctx.fillText('FRAME MS (p50 · p95)', LEFT + 4, TOP + 11);
    ctx.fillText('DRAW CALLS', w - RIGHT - 80, TOP + 11);

    // Lines; a bucket without samples lifts the pen.
    const line = (y: (v: number) => number, pick: (b: ViewBucket) => number, color: string, width: number, dash: number[]): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      let pen = false;
      data.forEach((b, i) => {
        if (b.samples === 0) {
          pen = false;
          return;
        }
        const x = xOf(i);
        const py = y(pick(b));
        if (pen) ctx.lineTo(x, py);
        else ctx.moveTo(x, py);
        pen = true;
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      if (colW > 6) {
        ctx.fillStyle = color;
        data.forEach((b, i) => {
          if (b.samples === 0) return;
          ctx.fillRect(xOf(i) - 1.5, y(pick(b)) - 1.5, 3, 3);
        });
      }
    };
    line(yDc, (b) => b.drawCalls, C_DRAWS, 1.5, [4, 3]);
    line(yMs, (b) => b.frameP95, C_P95, 2, []);
    line(yMs, (b) => b.frameP50, C_P50, 1.5, []);

    // Time axis.
    const span = n * bucketMs;
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 90))));
    ctx.fillStyle = THEME.dim;
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i += every) ctx.fillText(fmtTime(data[i].start, span), xOf(i), h - 6);
    ctx.textAlign = 'left';

    if (hover >= 0) {
      const x = Math.round(xOf(hover)) + 0.5;
      ctx.strokeStyle = '#ffffff55';
      ctx.beginPath();
      ctx.moveTo(x, TOP);
      ctx.lineTo(x, h - AXIS);
      ctx.stroke();
    }
  });

  const bucketAt = (x: number): number => {
    if (data.length === 0 || x < LEFT || x > s.w - RIGHT) return -1;
    return Math.min(data.length - 1, Math.max(0, Math.floor(((x - LEFT) / (s.w - LEFT - RIGHT)) * data.length)));
  };

  const showTip = (i: number, x: number, y: number): void => {
    if (i < 0) {
      tip.hidden = true;
      return;
    }
    const b = data[i];
    const lines = [
      new Date(b.start).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ` · ${Math.round(bucketMs / 60000)} min`,
      b.samples ? `${b.samples} samples` : 'no samples',
    ];
    if (b.samples) {
      lines.push(`frame p50 ${fmtMs(b.frameP50)} · p95 ${fmtMs(b.frameP95)}`);
      lines.push(`${Math.round(b.drawCalls).toLocaleString()} draw calls · ${fmtTris(b.triangles)} triangles`);
    }
    tip.textContent = lines.join('\n');
    tip.hidden = false;
    const hostR = host.getBoundingClientRect();
    tip.style.left = `${Math.min(hostR.width - tip.offsetWidth - 4, Math.max(4, x + 14))}px`;
    tip.style.top = `${Math.max(4, Math.min(y, hostR.height - tip.offsetHeight - 4))}px`;
  };

  const c = s.canvas;
  c.style.touchAction = 'pan-y';
  const pointer = (e: PointerEvent): void => {
    hover = bucketAt(e.offsetX);
    showTip(hover, e.offsetX, e.offsetY);
    redraw();
  };
  c.addEventListener('pointermove', pointer);
  c.addEventListener('pointerdown', pointer);
  c.addEventListener('pointerleave', () => {
    hover = -1;
    tip.hidden = true;
    redraw();
  });

  return {
    set(buckets, ms) {
      data = buckets;
      bucketMs = ms || bucketMs;
      hover = -1;
      tip.hidden = true;
      redraw();
    },
  };
}
