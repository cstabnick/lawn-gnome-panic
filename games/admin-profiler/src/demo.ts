// ?demo: made-up hitch data, so the viewer can be designed, demoed and checked without a server or sign-in.
// Deterministic (seeded), shaped like the real thing: a handful of games, sessions on mixed devices, frame hitches
// with system spans, long tasks, zone changes and the odd music-build mark.
import type { DataSource, ViewBucket, ViewHitch, ViewSeries, ViewSession, ViewSystem } from './data';

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GameShape {
  game: string;
  systems: [name: string, baseMs: number][];
  zones: string[];
  /** The system that spikes, and how hard. */
  spiky: [name: string, spikeMs: number][];
}

const GAMES: GameShape[] = [
  {
    game: 'gnomes-of-gnomomia',
    systems: [['updatePlayer', 0.6], ['updateCompanions', 1.2], ['updateEntities', 2.5], ['updateCombat', 0.8], ['updateInput', 0.2], ['updateZones', 0.5], ['updateAbilities', 0.3], ['updateMower', 0.4], ['updateQuests', 0.2], ['updateMmo', 0.6], ['updateWorld', 3], ['updateCamera', 0.3], ['updateHud', 1.1], ['updateMinimap', 0.9], ['render', 7]],
    zones: ['mossbottom', 'fescue-flats', 'thornwood', 'the-yard'],
    spiky: [['updateWorld', 420], ['updateCompanions', 1600], ['render', 260], ['saveGame', 140]],
  },
  {
    game: 'gnome-set-radio',
    systems: [['input', 0.3], ['skate', 1.4], ['tricks', 0.6], ['graffiti', 1.2], ['helpers', 0.9], ['music', 0.8], ['camera', 0.4], ['fx', 1.6], ['render', 8]],
    zones: ['area-1', 'area-2', 'area-3', 'area-4'],
    spiky: [['graffiti', 190], ['fx', 120], ['render', 340]],
  },
  {
    game: 'gnome-golf',
    systems: [['input', 0.2], ['physics', 2.2], ['water', 0.9], ['camera', 0.3], ['render', 5]],
    zones: ['hole-1', 'hole-4', 'hole-9'],
    spiky: [['physics', 150], ['render', 110]],
  },
];

const DEVICES = [
  { gpu: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 (0x00002786) Direct3D11 vs_5_0 ps_5_0, D3D11)', touch: false, cores: 16, memGb: 8, ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', width: 1920, height: 1080, slow: 1 },
  { gpu: 'ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)', touch: false, cores: 4, memGb: 8, ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', width: 1360, height: 760, slow: 2.4 },
  { gpu: 'Apple GPU', touch: true, cores: 6, memGb: 0, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1', width: 390, height: 840, slow: 1.8 },
  { gpu: 'Adreno (TM) 740', touch: true, cores: 8, memGb: 8, ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', width: 410, height: 900, slow: 1.6 },
  { gpu: 'Mali-G57', touch: true, cores: 8, memGb: 4, ua: 'Mozilla/5.0 (Linux; Android 13; SM-A346B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', width: 390, height: 860, slow: 3.2 },
];

interface DemoSession {
  session: ViewSession;
  hitches: ViewHitch[];
}

function makeHitch(r: () => number, g: GameShape, slow: number, at: number, wall: number, zone: string): ViewHitch {
  const roll = r();
  if (roll < 0.14) return { kind: 'longtask', at, ms: Math.round(80 + r() * 300 * slow), wall, ctx: { zone }, spans: [] };
  if (roll < 0.18) return { kind: 'mark', at, ms: Math.round(90 + r() * 160), wall, ctx: { zone }, spans: [{ name: `music build ${zone}`, start: 0, ms: Math.round(90 + r() * 160) }] };
  const [spikeName, spikeMs] = g.spiky[Math.floor(r() ** 1.6 * g.spiky.length)];
  const spike = spikeMs * (0.25 + r() * 0.9) * (spikeName === 'render' ? slow : 1);
  const spans = [];
  let t = 0.2 + r() * 0.5;
  const list = g.systems.some(([n]) => n === spikeName) ? g.systems : [...g.systems.slice(0, -1), [spikeName, 0] as [string, number], g.systems[g.systems.length - 1]];
  for (const [name, base] of list) {
    let d = base * slow * (0.6 + r() * 0.9);
    if (name === spikeName) d += spike;
    else if (r() < 0.08) d += 4 + r() * 18 * slow;
    d = Math.round(d * 10) / 10;
    spans.push({ name, start: Math.round(t * 10) / 10, ms: d });
    t += d + r() * 0.15;
  }
  return { kind: 'frame', at, ms: Math.round(t), wall, ctx: { zone }, spans };
}

function makeSessions(now: number): DemoSession[] {
  const r = rng(197);
  const out: DemoSession[] = [];
  for (let i = 0; i < 90; i++) {
    const g = GAMES[i % 7 < 4 ? 0 : i % 7 < 6 ? 1 : 2];
    const dev = DEVICES[Math.floor(r() * DEVICES.length)];
    // Most sessions recent (a playtest day), a long tail over the month.
    const startedAt = now - (r() < 0.55 ? r() * 24 : r() ** 1.5 * 30 * 24) * 3600e3 - 50 * 60e3;
    const lengthMs = (3 + r() * 40) * 60e3;
    const hitches: ViewHitch[] = [];
    let at = 2000 + r() * 4000;
    let zone = g.zones[0];
    // A load-time burst, then hitches every so often, more on slow devices, clustered after zone changes.
    while (at < lengthMs && hitches.length < 160) {
      if (r() < 0.06) zone = g.zones[Math.floor(r() * g.zones.length)];
      hitches.push(makeHitch(r, g, dev.slow, Math.round(at), Math.round(startedAt + at), zone));
      at += (r() < 0.3 ? 200 + r() * 2000 : 8000 + r() * 60000) / dev.slow;
    }
    const worst = Math.max(...hitches.map((h) => h.ms));
    const session: ViewSession = {
      id: `demo-${(i + 1).toString().padStart(3, '0')}-${Math.floor(r() * 1e8).toString(36)}`,
      game: g.game,
      build: ['a1f3c9e', 'e6e3209', 'f73b1f1'][Math.floor(r() * 3)],
      ...dev,
      startedAt,
      lastSeen: startedAt + (hitches[hitches.length - 1]?.at ?? 0),
      hitches: hitches.length,
      worstMs: worst,
      totalMs: hitches.reduce((a, h) => a + h.ms, 0),
      thresholdMs: 80,
    };
    out.push({ session, hitches });
  }
  return out;
}

function systemsOf(h: ViewHitch): Record<string, number> {
  if (h.spans.length === 0) return { '(untimed)': h.ms };
  const out: Record<string, number> = {};
  for (const s of h.spans) out[s.name] = (out[s.name] ?? 0) + s.ms;
  return out;
}

const pct = (sorted: number[], p: number): number => (sorted.length ? sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1))] : 0);
const NICE = [60e3, 300e3, 900e3, 1800e3, 3600e3, 3 * 3600e3, 6 * 3600e3, 12 * 3600e3, 24 * 3600e3];

/** The same aggregation the server does (internal/service/profile.go buildSeries). */
export function aggregate(rows: { session: string; h: ViewHitch }[], since: number, until: number): ViewSeries {
  const bucketMs = NICE.find((b) => (until - since) / b <= 60) ?? NICE[NICE.length - 1];
  const totals = new Map<string, ViewSystem>();
  for (const { h } of rows) {
    for (const [name, v] of Object.entries(systemsOf(h))) {
      const t = totals.get(name) ?? { name, totalMs: 0, worstMs: 0, hitches: 0 };
      t.totalMs += v;
      t.worstMs = Math.max(t.worstMs, v);
      t.hitches++;
      totals.set(name, t);
    }
  }
  const systems = [...totals.values()].sort((a, b) => b.totalMs - a.totalMs || a.name.localeCompare(b.name)).slice(0, 10);
  const top = new Set(systems.map((s) => s.name));
  const start = Math.floor(since / bucketMs) * bucketMs;
  const n = Math.ceil((until - start) / bucketMs);
  const buckets: ViewBucket[] = Array.from({ length: n }, (_, i) => ({ start: start + i * bucketMs, hitches: 0, sessions: 0, p50: 0, p95: 0, max: 0, system: {} }));
  const durs: number[][] = buckets.map(() => []);
  const sess: Set<string>[] = buckets.map(() => new Set());
  for (const { session, h } of rows) {
    const i = Math.floor((h.wall - start) / bucketMs);
    if (i < 0 || i >= n) continue;
    buckets[i].hitches++;
    durs[i].push(h.ms);
    sess[i].add(session);
    for (const [name, v] of Object.entries(systemsOf(h))) {
      const k = top.has(name) ? name : '(other)';
      buckets[i].system[k] = (buckets[i].system[k] ?? 0) + v;
    }
  }
  buckets.forEach((b, i) => {
    const d = durs[i].sort((x, y) => x - y);
    b.sessions = sess[i].size;
    b.p50 = pct(d, 0.5);
    b.p95 = pct(d, 0.95);
    b.max = d[d.length - 1] ?? 0;
  });
  return { bucketMs, buckets, systems };
}

export function demoSource(): DataSource {
  const now = Date.now();
  const all = makeSessions(now);
  const delay = <T>(v: T): Promise<T> => new Promise((res) => setTimeout(() => res(v), 120));
  return {
    demo: true,
    listSessions(game, sinceMs) {
      const seen = all.filter((s) => s.session.lastSeen >= sinceMs);
      const games = [...new Set(seen.map((s) => s.session.game))].sort();
      const sessions = seen.filter((s) => !game || s.session.game === game).map((s) => s.session).sort((a, b) => b.worstMs - a.worstMs);
      return delay({ sessions, games });
    },
    getSession(id) {
      const s = all.find((x) => x.session.id === id);
      return s ? delay({ session: s.session, hitches: s.hitches }) : Promise.reject(new Error('no session'));
    },
    series(game, sinceMs, untilMs) {
      const rows = all
        .filter((s) => !game || s.session.game === game)
        .flatMap((s) => s.hitches.filter((h) => h.wall >= sinceMs && h.wall < untilMs).map((h) => ({ session: s.session.id, h })));
      return delay(aggregate(rows, sinceMs, untilMs));
    },
  };
}
