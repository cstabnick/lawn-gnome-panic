// The handoff between the origin page (which opens the building) and the host page (which runs the interior, framed
// over the origin): a query string in, window.postMessage out. Pure: no DOM here.
import { MAX_ENTRIES, isEntry } from './ledger';
import type { LedgerEntry, PortalDef, PortalFrame } from './types';

export const PORTAL_MSG = 'lawn-portal';

/** Host page -> origin page. */
export type PortalMsg =
  /** The interior is drawn: fade it in. */
  | { t: typeof PORTAL_MSG; kind: 'ready'; visit: string }
  /** Things the player gained, as they happen. */
  | { t: typeof PORTAL_MSG; kind: 'ledger'; visit: string; entries: LedgerEntry[] }
  /** How many players are inside the building (the player included), for the door label. */
  | { t: typeof PORTAL_MSG; kind: 'presence'; visit: string; inside: number }
  /** The player walked out (the exit door, or a back button inside). */
  | { t: typeof PORTAL_MSG; kind: 'exit'; visit: string; reason: 'door' | 'back' };

export function parsePortalMsg(d: unknown): PortalMsg | null {
  if (typeof d !== 'object' || d === null) return null;
  const m = d as Record<string, unknown>;
  if (m.t !== PORTAL_MSG || typeof m.visit !== 'string' || m.visit.length === 0 || m.visit.length > 120) return null;
  const visit = m.visit;
  switch (m.kind) {
    case 'ready':
      return { t: PORTAL_MSG, kind: 'ready', visit };
    case 'ledger':
      if (!Array.isArray(m.entries) || m.entries.length > MAX_ENTRIES) return null;
      return { t: PORTAL_MSG, kind: 'ledger', visit, entries: m.entries.filter(isEntry).filter((e) => e.visit === visit) };
    case 'presence':
      if (typeof m.inside !== 'number' || !Number.isInteger(m.inside) || m.inside < 0 || m.inside > 1000) return null;
      return { t: PORTAL_MSG, kind: 'presence', visit, inside: m.inside };
    case 'exit':
      return { t: PORTAL_MSG, kind: 'exit', visit, reason: m.reason === 'back' ? 'back' : 'door' };
  }
  return null;
}

/** What the host page reads from its URL. */
export interface VisitInfo {
  portal: string;
  visit: string;
  /** The origin game. */
  from: string;
  depth: number;
  /** The player's name and @lawn/gnome look code from the origin page (a dev server on another port has no shared storage). */
  name: string | null;
  look: string | null;
  /** Room code to join (null: the public room). */
  room: string | null;
}

/** Query parameters an origin page passes on to the host page unchanged (the relay server, the platform, debug hooks). */
export const PASS_THROUGH = ['mp', 'platform', 'debug'] as const;

/**
 * The host page's query string (no '?'): portal, visit, from, depth, shell=0, name, look, room, then def.host.query,
 * then the pass-through parameters taken from `ownSearch` (the origin page's location.search).
 */
export function visitQuery(def: PortalDef, frame: PortalFrame, who: { name?: string | null; look?: string | null }, ownSearch = ''): string {
  const q = new URLSearchParams();
  q.set('portal', def.id);
  q.set('visit', frame.visit);
  q.set('from', frame.from);
  q.set('depth', String(frame.depth));
  q.set('shell', '0');
  if (who.name) q.set('name', who.name);
  if (who.look) q.set('look', who.look);
  if (frame.room) q.set('room', frame.room);
  if (def.host.query) for (const [k, v] of new URLSearchParams(def.host.query)) q.set(k, v);
  const own = new URLSearchParams(ownSearch);
  for (const k of PASS_THROUGH) {
    const v = own.get(k);
    if (v !== null) q.set(k, v);
  }
  return q.toString();
}

/** Reads a visit from a host page's location.search; null when the page was not opened through a portal. */
export function readVisit(search: string): VisitInfo | null {
  const q = new URLSearchParams(search);
  const portal = q.get('portal');
  const visit = q.get('visit');
  const from = q.get('from');
  if (!portal || !visit || !from || !/^[a-z0-9-]{1,40}$/.test(portal) || visit.length > 120) return null;
  const depth = Number(q.get('depth') ?? '0');
  const room = q.get('room');
  return {
    portal, visit, from,
    depth: Number.isInteger(depth) && depth >= 0 ? depth : 0,
    name: q.get('name'),
    look: q.get('look'),
    room: room && /^[A-Za-z0-9]{4,8}$/.test(room) ? room.toUpperCase() : null,
  };
}

/**
 * The host page's URL. `base` (an origin page's ?portalBase=, for tests) wins; on a dev server it is
 * <protocol>//<hostname>:<devPort>/; on the built site ../<game>/ (sibling folders, same origin).
 */
export function hostUrl(def: PortalDef, query: string, env: { dev: boolean; protocol: string; hostname: string; base?: string | null }): string {
  const root = env.base
    ? (env.base.endsWith('/') ? env.base : `${env.base}/`)
    : env.dev
      ? `${env.protocol}//${env.hostname}:${def.host.devPort}/`
      : `../${def.host.game}/`;
  return `${root}?${query}`;
}
