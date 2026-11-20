// Pure game rules: plain JSON in, plain JSON out. No DOM, no network, no clock (callers pass `now`).
import { MAX_ANSWER_LEN, MIN_PLAYERS_TO_SCORE, ROUNDS_PER_GAME } from './config';

export interface Player { pid: string; name: string }
export type TierId = 'plankton' | 'krill' | 'shrimp' | 'squid' | 'whale' | 'krillion';
export interface Tier { id: TierId; label: string; points: number }
export const TIERS: Record<TierId, Tier> = {
  plankton: { id: 'plankton', label: 'Plankton', points: 10 },
  krill: { id: 'krill', label: 'Krill', points: 25 },
  shrimp: { id: 'shrimp', label: 'Shrimp', points: 40 },
  squid: { id: 'squid', label: 'Squid', points: 60 },
  whale: { id: 'whale', label: 'Whale', points: 80 },
  krillion: { id: 'krillion', label: 'One in a Gnomillion', points: 100 },
};

export interface OpenRound { n: number; prompt: string; openedAt: number; closesAt: number; answers: Record<string, string> }
export interface Bucket { key: string; display: string; pids: string[]; tier: TierId; points: number }
export interface ClosedRound { n: number; prompt: string; buckets: Bucket[]; unanswered: string[] }
export interface Room {
  code: string; hostPid: string; players: Player[];
  windowMs: number; totalRounds: number;
  current: OpenRound | null; history: ClosedRound[];
  /** Index into the prompt bank for the next round (host shuffles once, stores the order). */
  promptOrder: number[];
}

export function newRoom(code: string, host: Player, windowMs: number, promptOrder: number[]): Room {
  return { code, hostPid: host.pid, players: [host], windowMs, totalRounds: ROUNDS_PER_GAME, current: null, history: [], promptOrder };
}

/** Lowercase, strip accents and punctuation, collapse spaces, drop a leading a/an/the, crude singular. Same key = same answer. */
export function normalizeAnswer(raw: string): string {
  let s = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(a|an|the) /, '');
  return s.split(' ').map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)).join(' ');
}

export function addPlayer(room: Room, p: Player): boolean {
  if (room.players.some((x) => x.pid === p.pid)) return true;
  room.players.push(p);
  return true;
}

export function openRound(room: Room, prompt: string, now: number): boolean {
  if (room.current || room.history.length >= room.totalRounds) return false;
  room.current = { n: room.history.length + 1, prompt, openedAt: now, closesAt: now + room.windowMs, answers: {} };
  return true;
}

export type SubmitResult = 'ok' | 'no-round' | 'closed' | 'empty' | 'unknown-player';
/** One answer per player per round; resubmitting replaces it until the round closes. */
export function submitAnswer(room: Room, pid: string, text: string, now: number): SubmitResult {
  const r = room.current;
  if (!r) return 'no-round';
  if (now >= r.closesAt) return 'closed';
  if (!room.players.some((p) => p.pid === pid)) return 'unknown-player';
  const clean = text.trim().slice(0, MAX_ANSWER_LEN);
  if (normalizeAnswer(clean) === '') return 'empty';
  r.answers[pid] = clean;
  return 'ok';
}

/** The round is ready to reveal: everyone answered, or the window ran out. */
export function shouldClose(room: Room, now: number): boolean {
  const r = room.current;
  if (!r) return false;
  return room.players.every((p) => r.answers[p.pid] !== undefined) || now >= r.closesAt;
}

/** Points by share of answers. A one-of-a-kind answer is at least Squid; the top tier needs 4+ answers. */
export function tierFor(count: number, answered: number): TierId {
  if (answered < MIN_PLAYERS_TO_SCORE) return 'plankton';
  const f = count / answered;
  if (count === 1) return answered >= 4 ? 'krillion' : 'squid';
  if (f <= 0.15) return 'whale';
  if (f <= 0.25) return 'squid';
  if (f <= 0.4) return 'shrimp';
  if (f <= 0.6) return 'krill';
  return 'plankton';
}

export function closeRound(room: Room): ClosedRound | null {
  const r = room.current;
  if (!r) return null;
  const groups = new Map<string, { display: Map<string, number>; pids: string[] }>();
  for (const [pid, text] of Object.entries(r.answers)) {
    const key = normalizeAnswer(text);
    const g = groups.get(key) ?? { display: new Map<string, number>(), pids: [] as string[] };
    g.display.set(text.trim(), (g.display.get(text.trim()) ?? 0) + 1);
    g.pids.push(pid);
    groups.set(key, g);
  }
  const answered = Object.keys(r.answers).length;
  const buckets: Bucket[] = [...groups.entries()].map(([key, g]) => {
    const tier = tierFor(g.pids.length, answered);
    const display = [...g.display.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return { key, display, pids: g.pids, tier, points: TIERS[tier].points };
  }).sort((a, b) => b.points - a.points || b.pids.length - a.pids.length);
  const closed: ClosedRound = { n: r.n, prompt: r.prompt, buckets, unanswered: room.players.filter((p) => r.answers[p.pid] === undefined).map((p) => p.pid) };
  room.history.push(closed);
  room.current = null;
  return closed;
}

export interface Standing { pid: string; name: string; total: number; best: TierId | null }
/** Leaderboard over all closed rounds, best first. */
export function standings(room: Room): Standing[] {
  const order: TierId[] = ['plankton', 'krill', 'shrimp', 'squid', 'whale', 'krillion'];
  return room.players.map((p) => {
    let total = 0; let best: TierId | null = null;
    for (const h of room.history) for (const b of h.buckets) if (b.pids.includes(p.pid)) {
      total += b.points;
      if (best === null || order.indexOf(b.tier) > order.indexOf(best)) best = b.tier;
    }
    return { pid: p.pid, name: p.name, total, best };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function isGameOver(room: Room): boolean { return room.current === null && room.history.length >= room.totalRounds; }
