// /admin/profiler/: the hitch profiler viewer. Sign-in required (any signed-in account for now; the server's
// ProfileService.viewer is where a role check goes once there is one). ?demo shows made-up data without sign-in.
//
// Layout, top to bottom: toolbar · summary numbers · time series · sessions + worst systems · session timeline ·
// frame breakdown + hitch list. State (game, range, session, hitch) lives in the URL hash so a view can be linked.
import { accountsEnabled, Code, completeSignIn, ConnectError, getAccessToken, signIn, signOut } from '@lawn/platform';
import { colorFor, fmtClock, fmtMs } from './canvas';
import { browserLabel, deviceLabel, liveSource } from './data';
import type { DataSource, ViewHitch, ViewSeries, ViewSession } from './data';
import { demoSource } from './demo';
import { createFrameView } from './frame';
import { createSeriesChart } from './series';
import { createTimeline, dominant } from './timeline';

type Attrs = { cls?: string; text?: string; attrs?: Record<string, string>; on?: Record<string, (e: Event) => void> };
function h<K extends keyof HTMLElementTagNameMap>(tag: K, o: Attrs = {}, ...kids: (Node | string | null)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (o.cls) el.className = o.cls;
  if (o.text !== undefined) el.textContent = o.text;
  for (const [k, v] of Object.entries(o.attrs ?? {})) el.setAttribute(k, v);
  for (const [k, fn] of Object.entries(o.on ?? {})) el.addEventListener(k, fn);
  for (const k of kids) if (k !== null) el.append(k);
  return el;
}

const root = document.getElementById('app') as HTMLElement;
const RANGES: [label: string, ms: number][] = [['1h', 3600e3], ['6h', 6 * 3600e3], ['24h', 24 * 3600e3], ['7d', 7 * 24 * 3600e3], ['30d', 30 * 24 * 3600e3]];

// ---------------------------------------------------------------- sign-in gate

function gate(message: string, withButton: boolean): void {
  root.replaceChildren(
    h('div', { cls: 'gate' },
      h('div', { cls: 'gate-card' },
        h('div', { cls: 'brand' }, h('span', { cls: 'logo' }), 'HITCH PROFILER'),
        h('p', { text: message }),
        withButton
          ? h('button', { cls: 'btn primary', text: 'Sign in', on: { click: (e) => { (e.target as HTMLButtonElement).disabled = true; void signIn(); } } })
          : null,
        h('p', { cls: 'dim' }, 'Or look around with ', h('a', { text: 'made-up demo data', attrs: { href: '?demo' } }), '.'),
      ),
    ),
  );
}

async function boot(): Promise<void> {
  if (new URLSearchParams(location.search).has('demo')) {
    start(demoSource(), 'demo data');
    return;
  }
  if (!accountsEnabled()) {
    gate('This build has no platform service configured (VITE_PLATFORM_URL), so there are no hitch reports to show.', false);
    return;
  }
  const returned = await completeSignIn();
  const token = await getAccessToken();
  if (!token) {
    gate(returned ? "Sign-in didn't finish. Try again." : 'Sign in to view hitch reports.', true);
    return;
  }
  start(liveSource(), 'signed in');
}

// ---------------------------------------------------------------- state

interface State {
  game: string;
  range: number;
  /** Zoomed window from the series brush, else null (the range up to now). */
  window: [number, number] | null;
  session: string;
  hitch: number;
}

function readHash(): State {
  const p = new URLSearchParams(location.hash.slice(1));
  const range = RANGES.find(([l]) => l === p.get('range'))?.[1] ?? 24 * 3600e3;
  const w = p.get('window')?.split('-').map(Number);
  return {
    game: p.get('game') ?? '',
    range,
    window: w && w.length === 2 && w.every(Number.isFinite) ? [w[0], w[1]] : null,
    session: p.get('session') ?? '',
    hitch: Number(p.get('hitch') ?? -1),
  };
}

function writeHash(s: State): void {
  const p = new URLSearchParams();
  if (s.game) p.set('game', s.game);
  p.set('range', RANGES.find(([, ms]) => ms === s.range)?.[0] ?? '24h');
  if (s.window) p.set('window', `${Math.round(s.window[0])}-${Math.round(s.window[1])}`);
  if (s.session) p.set('session', s.session);
  if (s.session && s.hitch >= 0) p.set('hitch', String(s.hitch));
  history.replaceState(history.state, '', `${location.pathname}${location.search}#${p}`);
}

// ---------------------------------------------------------------- tables

interface Col<T> {
  label: string;
  cell: (r: T) => string | Node;
  sort?: (r: T) => number | string;
  cls?: string;
}

function table<T>(cols: Col<T>[], rows: T[], o: { selected?: (r: T) => boolean; onPick?: (r: T, i: number) => void; empty: string; sortBy?: number }): HTMLElement {
  let sortCol = o.sortBy ?? -1;
  let desc = true;
  const wrap = h('div', { cls: 'table-wrap' });
  const render = (): void => {
    const data = [...rows];
    const sc = cols[sortCol];
    if (sc?.sort) {
      const f = sc.sort;
      data.sort((a, b) => {
        const x = f(a);
        const y = f(b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return desc ? -c : c;
      });
    }
    const head = h('tr', {}, ...cols.map((c, i) =>
      h('th', {
        cls: `${c.cls ?? ''} ${c.sort ? 'sortable' : ''} ${i === sortCol ? (desc ? 'desc' : 'asc') : ''}`,
        text: c.label,
        on: c.sort ? { click: () => { desc = sortCol === i ? !desc : true; sortCol = i; render(); } } : {},
      })));
    const body = h('tbody');
    data.forEach((r) => {
      const tr = h('tr', { cls: o.selected?.(r) ? 'sel' : '' }, ...cols.map((c) => h('td', { cls: c.cls ?? '' }, c.cell(r))));
      if (o.onPick) {
        tr.tabIndex = 0;
        tr.addEventListener('click', () => o.onPick?.(r, rows.indexOf(r)));
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') o.onPick?.(r, rows.indexOf(r)); });
      }
      body.append(tr);
    });
    wrap.replaceChildren(rows.length ? h('table', {}, h('thead', {}, head), body) : h('div', { cls: 'empty', text: o.empty }));
  };
  render();
  return wrap;
}

function bar(value: number, max: number, color: string): HTMLElement {
  const el = h('span', { cls: 'bar' });
  const fill = h('i');
  fill.style.width = `${Math.max(1, (value / Math.max(1e-9, max)) * 100)}%`;
  fill.style.background = color;
  el.append(fill);
  return el;
}

function swatch(name: string): HTMLElement {
  const el = h('i', { cls: 'swatch' });
  el.style.background = colorFor(name);
  return el;
}

const ago = (t: number): string => {
  const s = (Date.now() - t) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

// ---------------------------------------------------------------- the page

function panel(title: string, extra: Node | null, ...body: Node[]): HTMLElement {
  return h('section', { cls: 'panel' }, h('header', {}, h('h2', { text: title }), extra), ...body);
}

function start(src: DataSource, who: string): void {
  const st = readHash();

  const gameSel = h('select', { attrs: { 'aria-label': 'Game' } });
  const rangeSeg = h('div', { cls: 'seg', attrs: { role: 'group', 'aria-label': 'Time range' } });
  const zoomChip = h('button', { cls: 'chip', text: 'zoomed · reset', attrs: { hidden: '' } });
  const refreshBtn = h('button', { cls: 'btn', text: '⟳ Refresh', attrs: { title: 'Reload (R)' } });
  const whoEl = h('div', { cls: 'who' }, src.demo ? h('span', { cls: 'badge demo', text: 'DEMO DATA' }) : h('span', { cls: 'badge', text: who }));
  if (!src.demo) whoEl.append(h('button', { cls: 'btn ghost', text: 'Sign out', on: { click: () => void signOut() } }));

  const kpis = h('div', { cls: 'kpis' });
  const seriesHost = h('div', { cls: 'chart' });
  const seriesTip = h('div', { cls: 'tip', attrs: { hidden: '' } });
  seriesHost.append(seriesTip);
  const legend = h('div', { cls: 'legend' });
  const sessionsBox = h('div');
  const systemsBox = h('div');
  const sessionHead = h('div', { cls: 'session-head' });
  const timelineHost = h('div', { cls: 'track' });
  const timelineTip = h('div', { cls: 'tip', attrs: { hidden: '' } });
  timelineHost.append(timelineTip);
  const frameHost = h('div', { cls: 'track' });
  const frameTip = h('div', { cls: 'tip', attrs: { hidden: '' } });
  frameHost.append(frameTip);
  const frameHead = h('div', { cls: 'frame-head' });
  const hitchesBox = h('div');
  const spansBox = h('div');
  const status = h('div', { cls: 'status', attrs: { role: 'status' } });

  root.replaceChildren(
    h('header', { cls: 'toolbar' },
      h('div', { cls: 'brand' }, h('span', { cls: 'logo' }), 'HITCH PROFILER'),
      h('label', { cls: 'field' }, h('span', { text: 'Game' }), gameSel),
      rangeSeg,
      zoomChip,
      refreshBtn,
      h('div', { cls: 'spacer' }),
      whoEl,
    ),
    status,
    kpis,
    panel('Hitches over time', legend, seriesHost, h('p', { cls: 'hint', text: 'Drag across the chart to zoom into a time window · double-click to reset' })),
    h('div', { cls: 'split' },
      panel('Sessions', h('span', { cls: 'dim', text: 'worst first · click to open' }), sessionsBox),
      panel('Worst systems', h('span', { cls: 'dim', text: 'time spent inside hitches' }), systemsBox),
    ),
    panel('Session timeline', sessionHead, timelineHost, h('p', { cls: 'hint', text: 'Wheel / pinch to zoom · drag to pan · W S A D · F or double-click to fit · J / K step through hitches' })),
    panel('Frame breakdown', frameHead, frameHost),
    h('div', { cls: 'split' },
      panel('Hitches in session', null, hitchesBox),
      panel('Systems in this hitch', null, spansBox),
    ),
  );

  let threshold = 80;
  let session: ViewSession | null = null;
  let hitches: ViewHitch[] = [];
  let series: ViewSeries | null = null;
  let lastSessions: ViewSession[] = [];

  const chart = createSeriesChart(
    seriesHost,
    seriesTip,
    (a, b) => {
      st.window = [a, b];
      writeHash(st);
      void loadOverview();
    },
    () => {
      if (!st.window) return;
      st.window = null;
      writeHash(st);
      void loadOverview();
    },
  );
  const timeline = createTimeline(timelineHost, timelineTip, (i) => pickHitch(i));
  const frame = createFrameView(frameHost, frameTip);

  const span = (): [number, number] => st.window ?? [Date.now() - st.range, Date.now()];

  const fail = (e: unknown): void => {
    if (e instanceof ConnectError && e.code === Code.Unauthenticated) {
      gate('Your sign-in expired. Sign in again to keep viewing.', true);
      return;
    }
    status.textContent = `Couldn't load: ${e instanceof Error ? e.message : String(e)}`;
    status.className = 'status error';
  };

  for (const [label, ms] of RANGES) {
    const b = h('button', { text: label, attrs: { 'aria-pressed': String(ms === st.range) } });
    b.addEventListener('click', () => {
      st.range = ms;
      st.window = null;
      for (const x of rangeSeg.children) x.setAttribute('aria-pressed', String(x === b));
      writeHash(st);
      void loadOverview();
    });
    rangeSeg.append(b);
  }
  gameSel.addEventListener('change', () => {
    st.game = gameSel.value;
    writeHash(st);
    void loadOverview();
  });
  zoomChip.addEventListener('click', () => {
    st.window = null;
    writeHash(st);
    void loadOverview();
  });
  refreshBtn.addEventListener('click', () => void loadOverview());

  function renderKpis(sessions: ViewSession[]): void {
    const total = series?.buckets.reduce((a, b) => a + b.hitches, 0) ?? 0;
    const time = series?.systems.reduce((a, s) => a + s.totalMs, 0) ?? 0;
    const worst = Math.max(0, ...(series?.buckets.map((b) => b.max) ?? []));
    const p95s = (series?.buckets ?? []).filter((b) => b.hitches > 0).map((b) => b.p95).sort((a, b) => a - b);
    const p95 = p95s.length ? p95s[Math.floor(p95s.length / 2)] : 0;
    const top = series?.systems.find((s) => !s.name.startsWith('('));
    const kpi = (label: string, value: string, sub = '', tone = ''): HTMLElement =>
      h('div', { cls: `kpi ${tone}` }, h('span', { cls: 'k', text: label }), h('b', { text: value }), h('small', { text: sub }));
    kpis.replaceChildren(
      kpi('Hitches', total.toLocaleString(), `${sessions.length} sessions`),
      kpi('Hitch time', fmtMs(time), 'frozen in total'),
      kpi('Typical p95', fmtMs(p95), 'median of bucket p95s', p95 > 250 ? 'bad' : p95 > 120 ? 'warn' : 'ok'),
      kpi('Worst', fmtMs(worst), 'single hitch', worst > 1000 ? 'bad' : worst > 300 ? 'warn' : 'ok'),
      kpi('Top system', top?.name ?? '—', top ? `${fmtMs(top.totalMs)} over ${top.hitches} hitches` : ''),
    );
  }

  function renderLegend(): void {
    const names = [...(series?.systems.map((s) => s.name) ?? []), '(other)'];
    legend.replaceChildren(...names.map((n) => {
      const b = h('button', { cls: `lg ${chart.hidden.has(n) ? 'off' : ''}`, attrs: { title: 'Show / hide' } }, swatch(n), n);
      b.addEventListener('click', () => {
        if (chart.hidden.has(n)) chart.hidden.delete(n);
        else chart.hidden.add(n);
        b.classList.toggle('off');
        chart.redraw();
      });
      return b;
    }));
  }

  function renderSystems(): void {
    const sys = series?.systems ?? [];
    const max = Math.max(1, ...sys.map((s) => s.totalMs));
    systemsBox.replaceChildren(
      table<(typeof sys)[number]>(
        [
          { label: 'System', cell: (s) => h('span', { cls: 'name' }, swatch(s.name), s.name), sort: (s) => s.name },
          { label: 'Total', cell: (s) => h('span', { cls: 'num-bar' }, bar(s.totalMs, max, colorFor(s.name)), fmtMs(s.totalMs)), sort: (s) => s.totalMs, cls: 'num' },
          { label: 'Worst', cell: (s) => fmtMs(s.worstMs), sort: (s) => s.worstMs, cls: 'num' },
          { label: 'Hitches', cell: (s) => String(s.hitches), sort: (s) => s.hitches, cls: 'num' },
        ],
        sys,
        { empty: 'No hitches in this range.', sortBy: 1 },
      ),
    );
  }

  function renderSessions(list: ViewSession[]): void {
    lastSessions = list;
    const max = Math.max(1, ...list.map((s) => s.worstMs));
    sessionsBox.replaceChildren(
      table<ViewSession>(
        [
          { label: 'Last seen', cell: (s) => ago(s.lastSeen), sort: (s) => s.lastSeen },
          { label: 'Game', cell: (s) => s.game, sort: (s) => s.game },
          { label: 'Device', cell: (s) => h('span', { cls: 'device', attrs: { title: `${s.gpu}\n${s.ua}` } }, deviceLabel(s)), sort: (s) => deviceLabel(s) },
          { label: 'Hitches', cell: (s) => String(s.hitches), sort: (s) => s.hitches, cls: 'num' },
          { label: 'Worst', cell: (s) => h('span', { cls: 'num-bar' }, bar(s.worstMs, max, s.worstMs > 1000 ? '#e8615a' : s.worstMs > 300 ? '#f2a93b' : '#5ccf84'), fmtMs(s.worstMs)), sort: (s) => s.worstMs, cls: 'num' },
          { label: 'Build', cell: (s) => h('code', { text: s.build || '—' }), sort: (s) => s.build },
        ],
        list,
        { empty: 'No sessions reported hitches in this range. Open a game with ?profile=upload to send some.', selected: (s) => s.id === st.session, onPick: (s) => void openSession(s.id), sortBy: 4 },
      ),
    );
  }

  async function loadOverview(): Promise<void> {
    const [a, b] = span();
    zoomChip.hidden = !st.window;
    status.textContent = 'Loading…';
    status.className = 'status';
    chart.set(null, a, b, threshold);
    try {
      const [{ sessions, games }, s] = await Promise.all([src.listSessions(st.game, a), src.series(st.game, a, b)]);
      series = s;
      gameSel.replaceChildren(h('option', { text: 'All games', attrs: { value: '' } }), ...games.map((g) => h('option', { text: g, attrs: { value: g } })));
      gameSel.value = st.game;
      const shown = st.window ? sessions.filter((x) => x.startedAt <= b) : sessions;
      threshold = shown[0]?.thresholdMs || 80;
      chart.set(series, a, b, threshold);
      renderLegend();
      renderKpis(shown);
      renderSystems();
      renderSessions(shown);
      status.textContent = '';
      if (st.session && !session) await openSession(st.session, st.hitch);
      else if (!st.session && shown[0]) await openSession(shown[0].id);
    } catch (e) {
      fail(e);
    }
  }

  function renderHitchList(): void {
    const max = Math.max(1, ...hitches.map((q) => q.ms));
    hitchesBox.replaceChildren(
      table<ViewHitch>(
        [
          { label: 'At', cell: (q) => fmtClock(q.at), sort: (q) => q.at, cls: 'num' },
          { label: 'Kind', cell: (q) => h('span', { cls: `kind k-${q.kind}`, text: q.kind }), sort: (q) => q.kind },
          { label: 'Duration', cell: (q) => h('span', { cls: 'num-bar' }, bar(q.ms, max, q.spans.length ? colorFor(dominant(q)) : '#e8615a'), fmtMs(q.ms)), sort: (q) => q.ms, cls: 'num' },
          { label: 'Mostly', cell: (q) => (q.spans.length ? h('span', { cls: 'name' }, swatch(dominant(q)), dominant(q)) : '—'), sort: (q) => dominant(q) },
          { label: 'Context', cell: (q) => Object.values(q.ctx).join(' · '), sort: (q) => Object.values(q.ctx).join() },
        ],
        hitches,
        { empty: 'No hitches.', selected: (q) => hitches.indexOf(q) === st.hitch, onPick: (_q, i) => pickHitch(i), sortBy: 2 },
      ),
    );
  }

  async function openSession(id: string, hitch = -1): Promise<void> {
    try {
      const r = await src.getSession(id);
      session = r.session;
      hitches = r.hitches;
      st.session = id;
      threshold = session.thresholdMs || 80;
      const lengthMs = Math.max(...hitches.map((q) => q.at + q.ms), session.lastSeen - session.startedAt);
      sessionHead.replaceChildren(
        h('span', { cls: 'pill', text: session.game }),
        h('span', { text: deviceLabel(session) }),
        h('span', { cls: 'dim', text: [browserLabel(session.ua), session.width ? `${session.width}×${session.height}` : '', `build ${session.build || '—'}`, `${session.hitches} hitches`, `≥ ${session.thresholdMs} ms`].filter(Boolean).join(' · ') }),
        h('code', { cls: 'dim', text: session.id }),
      );
      timeline.set(hitches, threshold, lengthMs);
      renderSessions(lastSessions); // moves the selection highlight
      const worst = hitches.reduce((bi, q, i) => (q.ms > (hitches[bi]?.ms ?? -1) ? i : bi), -1);
      pickHitch(hitch >= 0 && hitch < hitches.length ? hitch : worst);
    } catch (e) {
      fail(e);
    }
  }

  function pickHitch(i: number): void {
    st.hitch = i;
    writeHash(st);
    const q = hitches[i] ?? null;
    timeline.select(i);
    frame.set(q, threshold);
    frameHead.replaceChildren(
      ...(q
        ? [
            h('span', { cls: `kind k-${q.kind}`, text: q.kind }),
            h('b', { text: fmtMs(q.ms) }),
            h('span', { cls: 'dim', text: `at ${fmtClock(q.at)} · ${new Date(q.wall).toLocaleString()} · ${Object.entries(q.ctx).map(([k, v]) => `${k}=${v}`).join(' ')}` }),
            h('span', { cls: 'dim', text: `${i + 1} / ${hitches.length}` }),
          ]
        : []),
    );
    renderHitchList();
    const sums = new Map<string, { ms: number; calls: number }>();
    for (const sp of q?.spans ?? []) {
      const x = sums.get(sp.name) ?? { ms: 0, calls: 0 };
      x.ms += sp.ms;
      x.calls++;
      sums.set(sp.name, x);
    }
    const timed = [...sums.values()].reduce((a, x) => a + x.ms, 0);
    const rows = [...sums].map(([name, x]) => ({ name, ...x }));
    if (q && q.spans.length) rows.push({ name: '(untimed)', ms: Math.max(0, q.ms - timed), calls: 0 });
    spansBox.replaceChildren(
      table<(typeof rows)[number]>(
        [
          { label: 'System', cell: (r) => h('span', { cls: 'name' }, swatch(r.name), r.name), sort: (r) => r.name },
          { label: 'Time', cell: (r) => h('span', { cls: 'num-bar' }, bar(r.ms, q?.ms ?? 1, colorFor(r.name)), fmtMs(r.ms)), sort: (r) => r.ms, cls: 'num' },
          { label: '% frame', cell: (r) => `${(((r.ms / (q?.ms || 1)) * 100)).toFixed(1)}%`, sort: (r) => r.ms, cls: 'num' },
          { label: 'Calls', cell: (r) => (r.calls ? String(r.calls) : '—'), sort: (r) => r.calls, cls: 'num' },
        ],
        rows,
        { empty: q ? 'No breakdown for this kind of hitch.' : 'Pick a hitch.', sortBy: 1 },
      ),
    );
  }

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if ((k === 'j' || k === 'k') && hitches.length) {
      // Step through hitches in time order.
      const order = hitches.map((_, i) => i).sort((a, b) => hitches[a].at - hitches[b].at);
      const pos = Math.max(0, order.indexOf(st.hitch));
      pickHitch(order[Math.max(0, Math.min(order.length - 1, pos + (k === 'j' ? 1 : -1)))]);
    } else if (k === 'r' && !e.ctrlKey && !e.metaKey) void loadOverview();
  });

  void loadOverview();
}

void boot();
