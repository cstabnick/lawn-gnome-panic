// The building's side of a portal: the host page, opened framed with ?portal=<id>&visit=... . It reports what the
// player gains (ledger entries, sent at once so a closed tab loses nothing), says when it is drawn, and asks the origin
// page to close it when the player walks out.
import { PORTAL_MSG, readVisit, type PortalMsg, type VisitInfo } from './protocol';
import type { LedgerEntry, LedgerKind } from './types';

export interface PortalVisit {
  readonly info: VisitInfo;
  /** True when this page is framed by an origin page (the normal case). */
  readonly framed: boolean;
  /** Records one gain or spend and sends it to the origin page. */
  record(kind: LedgerKind, data: { amount?: number; ref?: string; text?: string }): LedgerEntry;
  /** The interior is drawn: the origin page fades it in. Call once after the first render. */
  ready(): void;
  /** Players inside the building, me included. Sent only when it changes. */
  presence(inside: number): void;
  /** The player walks out: the origin page closes the frame and puts them back. */
  exit(reason?: 'door' | 'back'): void;
}

function session(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

/** Null when this page was not opened through a portal (play as usual). */
export function joinPortalVisit(search: string = location.search): PortalVisit | null {
  const info = readVisit(search);
  if (!info) return null;
  const framed = window.parent !== window;
  const seqKey = `lawn.portal.seq:${info.visit}`;
  let seq = Number(session()?.getItem(seqKey) ?? '0') || 0;
  let lastInside = -1;
  const send = (m: PortalMsg): void => {
    // '*': on dev servers the origin page is another port (origin). The messages carry nothing secret.
    if (framed) window.parent.postMessage(m, '*');
  };
  return {
    info,
    framed,
    record(kind, data) {
      seq++;
      try { session()?.setItem(seqKey, String(seq)); } catch { /* ignore */ }
      const e: LedgerEntry = {
        id: `${info.visit}:${seq}`, visit: info.visit, portal: info.portal, kind, at: Date.now(), store: location.origin,
        ...(data.amount !== undefined ? { amount: Math.round(data.amount) } : {}),
        ...(data.ref !== undefined ? { ref: data.ref } : {}),
        ...(data.text !== undefined ? { text: data.text } : {}),
      };
      send({ t: PORTAL_MSG, kind: 'ledger', visit: info.visit, entries: [e] });
      return e;
    },
    ready() {
      send({ t: PORTAL_MSG, kind: 'ready', visit: info.visit });
    },
    presence(inside) {
      if (inside === lastInside) return;
      lastInside = inside;
      send({ t: PORTAL_MSG, kind: 'presence', visit: info.visit, inside });
    },
    exit(reason = 'door') {
      send({ t: PORTAL_MSG, kind: 'exit', visit: info.visit, reason });
    },
  };
}
