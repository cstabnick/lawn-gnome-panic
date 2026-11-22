// The viewer's data: plain view types, and two sources that fill them (the platform's ProfileService, or the
// made-up demo in demo.ts). The views only ever see these types.
import { timestampDate, timestampFromMs } from '@bufbuild/protobuf/wkt';
import { profileClient } from '@lawn/platform';
import type { Hitch, SessionSummary } from '@lawn/platform';

export interface ViewSpan {
  name: string;
  /** ms from the frame start. */
  start: number;
  ms: number;
}

export interface ViewHitch {
  kind: string;
  /** ms since the page loaded. */
  at: number;
  ms: number;
  /** Wall clock (epoch ms). */
  wall: number;
  ctx: Record<string, string>;
  spans: ViewSpan[];
}

export interface ViewSession {
  id: string;
  game: string;
  build: string;
  gpu: string;
  touch: boolean;
  cores: number;
  memGb: number;
  ua: string;
  width: number;
  height: number;
  startedAt: number;
  lastSeen: number;
  hitches: number;
  worstMs: number;
  totalMs: number;
  thresholdMs: number;
}

export interface ViewBucket {
  start: number;
  hitches: number;
  sessions: number;
  p50: number;
  p95: number;
  max: number;
  /** ms per system (top systems, "(other)", "(untimed)"). */
  system: Record<string, number>;
}

export interface ViewSystem {
  name: string;
  totalMs: number;
  worstMs: number;
  hitches: number;
}

export interface ViewSeries {
  bucketMs: number;
  buckets: ViewBucket[];
  systems: ViewSystem[];
}

export interface DataSource {
  readonly demo: boolean;
  listSessions(game: string, sinceMs: number): Promise<{ sessions: ViewSession[]; games: string[] }>;
  getSession(id: string): Promise<{ session: ViewSession; hitches: ViewHitch[] }>;
  series(game: string, sinceMs: number, untilMs: number): Promise<ViewSeries>;
}

const ms = (t: Parameters<typeof timestampDate>[0] | undefined): number => (t ? timestampDate(t).getTime() : 0);

export function fromSession(s: SessionSummary): ViewSession {
  const d = s.device;
  return {
    id: s.sessionId,
    game: s.game,
    build: s.build,
    gpu: d?.gpu ?? '',
    touch: d?.touch ?? false,
    cores: d?.cores ?? 0,
    memGb: d?.memoryGb ?? 0,
    ua: d?.userAgent ?? '',
    width: d?.width ?? 0,
    height: d?.height ?? 0,
    startedAt: ms(s.startedAt),
    lastSeen: ms(s.lastSeen),
    hitches: s.hitchCount,
    worstMs: s.worstMs,
    totalMs: s.totalMs,
    thresholdMs: s.thresholdMs,
  };
}

export function fromHitch(h: Hitch): ViewHitch {
  return {
    kind: h.kind,
    at: h.atMs,
    ms: h.durationMs,
    wall: ms(h.occurredAt),
    ctx: { ...h.context },
    spans: h.spans.map((s) => ({ name: s.name, start: s.startMs, ms: s.durationMs })),
  };
}

/** The platform's ProfileService (needs a signed-in token; the client adds it). */
export function liveSource(): DataSource {
  const client = profileClient();
  return {
    demo: false,
    async listSessions(game, sinceMs) {
      const r = await client.listSessions({ game, since: timestampFromMs(sinceMs), limit: 300 });
      return { sessions: r.sessions.map(fromSession), games: r.games };
    },
    async getSession(id) {
      const r = await client.getSession({ sessionId: id });
      if (!r.session) throw new Error('no session');
      return { session: fromSession(r.session), hitches: r.hitches.map(fromHitch) };
    },
    async series(game, sinceMs, untilMs) {
      const r = await client.hitchSeries({ game, since: timestampFromMs(sinceMs), until: timestampFromMs(untilMs) });
      return {
        bucketMs: r.bucketSeconds * 1000,
        buckets: r.buckets.map((b) => ({ start: ms(b.start), hitches: b.hitches, sessions: b.sessions, p50: b.p50Ms, p95: b.p95Ms, max: b.maxMs, system: { ...b.systemMs } })),
        systems: r.systems.map((s) => ({ name: s.name, totalMs: s.totalMs, worstMs: s.worstMs, hitches: s.hitches })),
      };
    },
  };
}

/** A short device label: "Mobile · Adreno 740 · 8c 8G" (the GPU string trimmed of ANGLE wrapping). */
export function deviceLabel(s: ViewSession): string {
  const gpu = s.gpu
    .replace(/^ANGLE \(([^,]+),\s*/, '')
    .replace(/\s*\(0x[0-9A-Fa-f]+\).*$/, '')
    .replace(/ Direct3D.*$| OpenGL.*$| Vulkan.*$/, '')
    .replace(/\)$/, '')
    .trim();
  const parts = [s.touch ? 'Mobile' : 'Desktop'];
  if (gpu) parts.push(gpu);
  const hw = [s.cores ? `${s.cores}c` : '', s.memGb ? `${s.memGb}G` : ''].filter(Boolean).join(' ');
  if (hw) parts.push(hw);
  return parts.join(' · ');
}

/** "Chrome 142", "Safari 18", ... from a user agent. */
export function browserLabel(ua: string): string {
  // Most specific first: Edge and Chrome on iOS also say Chrome / Safari.
  for (const [token, name] of [['Edg', 'Edge'], ['CriOS', 'Chrome iOS'], ['Firefox', 'Firefox'], ['Chrome', 'Chrome'], ['Version', 'Safari']]) {
    const m = new RegExp(`${token}/(\\d+)`).exec(ua);
    if (m) return `${name} ${m[1]}`;
  }
  return '';
}
