// The ?perf overlay: frame rate, CPU and GPU time, render counts, the slowest systems. Mounted by perf.ts into the
// shared #ui element as its own #gta-perf container. Tap it to fold it down to the first line.
import type { LiveStats } from '@lawn/profiler';

export interface PerfOverlay {
  destroy(): void;
}

const SYSTEM_ROWS = 6;
const REFRESH_MS = 500;

function fmtTris(t: number): string {
  return t < 1e6 ? `${Math.round(t / 1000)} k` : `${(t / 1e6).toFixed(2)} M`;
}

function fpsColour(fps: number): string {
  if (fps >= 50) return '#7CFC7C';
  if (fps >= 30) return '#FFE066';
  return '#FF7A7A';
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration>): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  return node;
}

/** Mounts the ?perf overlay in `ui`. `read` gives the live stats (null until the first second); `extra` adds lines
 *  such as the quality tier or region (label -> value). Refreshes twice a second, not every frame. */
export function mountPerfOverlay(
  ui: HTMLElement,
  read: () => LiveStats | null,
  extra?: () => Record<string, string | number>,
  statusLine?: () => string | null,
): PerfOverlay {
  const box = el('div', {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
    left: 'calc(env(safe-area-inset-left, 0px) + 8px)',
    zIndex: '50',
    fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
    fontSize: '11px',
    lineHeight: '1.4',
    color: '#F2F2F2',
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '6px',
    padding: '6px 8px',
    maxWidth: 'min(260px, 70vw)',
    boxSizing: 'border-box',
    minHeight: '44px',
    pointerEvents: 'auto',
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
  });
  box.id = 'gta-perf';
  box.textContent = 'perf: measuring...';

  const head = el('div', { fontWeight: '700' });
  const body = el('div', {});
  const cpuLine = el('div', {});
  const drawLine = el('div', {});
  const geoLine = el('div', {});
  const profLine = el('div', { color: '#7FD3FF', display: 'none' });
  const extraBox = el('div', {});
  const systemBox = el('div', { marginTop: '4px' });
  body.append(cpuLine, drawLine, geoLine, profLine, extraBox, systemBox);

  // Extra rows are created on demand and reused after that.
  const extraRows: HTMLDivElement[] = [];

  // Fixed pool of system rows: name, ms, and a bar whose width is the share of the slowest of the six.
  const rows = Array.from({ length: SYSTEM_ROWS }, () => {
    const row = el('div', { display: 'none', marginTop: '2px' });
    const top = el('div', { display: 'flex', justifyContent: 'space-between', gap: '8px' });
    const name = el('span', { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
    const ms = el('span', {});
    top.append(name, ms);
    const track = el('div', {
      height: '3px',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '2px',
      overflow: 'hidden',
    });
    const fill = el('div', { height: '100%', width: '0%', background: '#7FD3FF' });
    track.append(fill);
    row.append(top, track);
    systemBox.append(row);
    return { row, name, ms, fill };
  });

  box.append(head, body);
  ui.append(box);

  let compact = false;
  let stopped = false;

  const onTap = (): void => {
    compact = !compact;
    body.style.display = compact ? 'none' : 'block';
    refresh();
  };
  box.addEventListener('click', onTap);

  function refresh(): void {
    if (stopped) return;
    const s = read();
    if (!s) {
      head.textContent = 'perf: measuring...';
      head.style.color = '#F2F2F2';
      return;
    }

    head.textContent = `FPS ${Math.round(s.fps)} · ${s.frameMs.toFixed(1)} ms (p95 ${s.p95Ms.toFixed(1)})`;
    head.style.color = fpsColour(s.fps);
    if (compact) return;

    const r = s.render;
    cpuLine.textContent =
      `CPU ${s.cpuMs.toFixed(1)} ms` + (r && r.gpuMs > 0 ? ` · GPU ${r.gpuMs.toFixed(1)} ms` : '');

    drawLine.style.display = r ? 'block' : 'none';
    geoLine.style.display = r ? 'block' : 'none';
    if (r) {
      drawLine.textContent = `Draws ${Math.round(r.drawCalls)} · Tris ${fmtTris(r.triangles)}`;
      const dpr = Math.round(r.pixelRatio * 100) / 100;
      geoLine.textContent = `Geo ${r.geometries} · Tex ${r.textures} · Prog ${r.programs} · DPR ${dpr}`;
    }

    const pText = statusLine?.() ?? null;
    profLine.style.display = pText ? 'block' : 'none';
    if (pText) profLine.textContent = pText;

    const extras = extra ? Object.entries(extra()) : [];
    for (let i = 0; i < extras.length; i++) {
      let node = extraRows[i];
      if (!node) {
        node = el('div', {});
        extraRows.push(node);
        extraBox.append(node);
      }
      node.style.display = 'block';
      node.textContent = `${extras[i][0]} ${extras[i][1]}`;
    }
    for (let i = extras.length; i < extraRows.length; i++) extraRows[i].style.display = 'none';

    const top = s.systems.slice(0, SYSTEM_ROWS);
    const max = top.reduce((m, [, ms]) => Math.max(m, ms), 0);
    rows.forEach((row, i) => {
      const entry = top[i];
      if (!entry) {
        row.row.style.display = 'none';
        return;
      }
      const [name, ms] = entry;
      row.row.style.display = 'block';
      row.name.textContent = name;
      row.ms.textContent = ms.toFixed(1);
      row.fill.style.width = max > 0 ? `${Math.min(100, (ms / max) * 100)}%` : '0%';
    });
  }

  refresh();
  const timer = setInterval(refresh, REFRESH_MS);

  return {
    destroy(): void {
      stopped = true;
      clearInterval(timer);
      box.removeEventListener('click', onTap);
      box.remove();
    },
  };
}
