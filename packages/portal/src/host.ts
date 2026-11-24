// The origin side of a portal (the game the player walks in from): pushes a frame, opens the building's host page in a
// full-screen frame over the game (the game stays loaded underneath: no reload, the player's gnome and state kept),
// collects the ledger while the player is inside, and on the way out pops the frame and settles the ledger once.
import { addEntries, ledgerKey, parseBook, serializeBook, settle, summarize, type LedgerAdapter, type LedgerBook } from './ledger';
import { hostUrl, parsePortalMsg, visitQuery } from './protocol';
import { getPortal } from './registry';
import { PortalStack, newVisitId, stackKey } from './stack';
import type { LedgerEntry, PortalFrame, ReturnPose } from './types';

export interface PortalHostOptions {
  /** My workspace folder name ('gnome-theft-auto'). */
  game: string;
  /** The shared #ui element: the portal appends its own layer, never restyles #ui. */
  ui: HTMLElement;
  /** How this game applies what the player gained inside (see LedgerAdapter). */
  apply: LedgerAdapter;
  /** The back button's text: "Back to Turfton". */
  returnLabel: string;
  /** Called once the player is back (after the frame is popped and the ledger settled): put them at frame.ret. */
  onExit?(frame: PortalFrame, settled: LedgerEntry[], summary: string[]): void;
  /** Called when the interior is shown (after the fade in). */
  onShown?(frame: PortalFrame): void;
  /** Achievement id -> title, for the summary lines. */
  title?(achievementId: string): string;
  /** Depth of this page itself (0 top level; a host page that opens another portal passes its own visit depth + 1). */
  depth?: number;
}

export interface PortalHostRuntime {
  /** True from enter() until the player is back. The game freezes its world while it is true. */
  readonly active: boolean;
  readonly current: PortalFrame | null;
  /** Walks in: pushes the frame and opens the interior. Null when already inside or the portal is unknown. */
  enter(portalId: string, ret: ReturnPose, who?: { room?: string | null; name?: string | null; look?: string | null }): PortalFrame | null;
  /** Walks out (the back button calls this too). */
  exit(): void;
  /**
   * At boot: a frame left on the stack (the tab reloaded or crashed inside) is popped, and every pending ledger entry
   * is settled. Returns that frame (put the player at frame.ret: back at the door) or null.
   */
  resume(): { frame: PortalFrame | null; settled: LedgerEntry[]; summary: string[] };
  /** Last player count the building reported (under 60 s old), or null. */
  insideCount(portalId: string): number | null;
}

function store(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

const FADE_MS = 220;
/** Show the interior even if it never says 'ready' (a slow phone, an old host page). */
const READY_TIMEOUT_MS = 12_000;

export function createPortalHost(opts: PortalHostOptions): PortalHostRuntime {
  const sKey = stackKey(opts.game);
  const lKey = ledgerKey(opts.game);
  const myStore = location.origin;
  const loadStack = (): PortalStack => PortalStack.parse(store('session')?.getItem(sKey) ?? null);
  const saveStack = (s: PortalStack): void => {
    try { store('session')?.setItem(sKey, s.toJSON()); } catch { /* full or blocked: the visit still works */ }
  };
  const loadBook = (): LedgerBook => parseBook(store('local')?.getItem(lKey) ?? null);
  const saveBook = (b: LedgerBook): void => {
    try { store('local')?.setItem(lKey, serializeBook(b)); } catch { /* ignore */ }
  };
  const presence = new Map<string, { n: number; at: number }>();

  // ---- the layer: a bar with the back button, the framed host page, and a "walking in" card over it.
  const root = document.createElement('div');
  root.dataset.portal = 'layer';
  root.style.cssText = 'position:fixed; inset:0; z-index:60; display:none; flex-direction:column; background:#000; '
    + `opacity:0; transition:opacity ${FADE_MS}ms ease; pointer-events:auto;`;
  const bar = document.createElement('div');
  bar.style.cssText = 'box-sizing:content-box; height:48px; flex:0 0 auto; display:flex; align-items:center; gap:8px; '
    + 'padding:0 8px; padding-top:env(safe-area-inset-top); padding-left:max(8px, env(safe-area-inset-left)); '
    + 'background:#1d1a16; color:#fff; font-family:system-ui, sans-serif;';
  const back = document.createElement('button');
  back.type = 'button';
  back.dataset.portal = 'back';
  back.textContent = `← ${opts.returnLabel}`;
  back.style.cssText = 'min-width:44px; min-height:44px; padding:0 12px; border:0; border-radius:8px; background:#3a342c; '
    + 'color:#fff; font-size:15px; cursor:pointer; white-space:nowrap;';
  const title = document.createElement('div');
  title.style.cssText = 'flex:1; min-width:0; text-align:center; font-size:16px; font-weight:600; overflow:hidden; '
    + 'text-overflow:ellipsis; white-space:nowrap; padding-right:44px;';
  bar.append(back, title);
  const stage = document.createElement('div');
  stage.style.cssText = 'position:relative; flex:1; min-height:0;';
  const frame = document.createElement('iframe');
  frame.dataset.portal = 'frame';
  frame.setAttribute('allow', 'autoplay; fullscreen; gamepad');
  frame.style.cssText = 'border:0; width:100%; height:100%; display:block; background:#000;';
  const card = document.createElement('div');
  card.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; '
    + 'background:#000; color:#f3e9d2; font:600 18px system-ui, sans-serif; transition:opacity 300ms ease;';
  stage.append(frame, card);
  root.append(bar, stage);
  opts.ui.appendChild(root);

  let cur: PortalFrame | null = null;
  let readyTimer = 0;

  const reveal = (): void => {
    if (!cur) return;
    window.clearTimeout(readyTimer);
    card.style.opacity = '0';
    card.style.pointerEvents = 'none';
    opts.onShown?.(cur);
  };

  const finish = (f: PortalFrame): { settled: LedgerEntry[]; summary: string[] } => {
    const s = loadStack();
    // Pop down to (and including) this visit: the stack top is always the open visit.
    while (s.depth > 0 && s.pop()?.visit !== f.visit) { /* drop anything stale above it */ }
    saveStack(s);
    const r = settle(loadBook(), opts.apply, myStore);
    saveBook(r.book);
    return { settled: r.settled, summary: summarize(r.settled, opts.title) };
  };

  const close = (): void => {
    const f = cur;
    if (!f) return;
    cur = null;
    window.clearTimeout(readyTimer);
    root.style.opacity = '0';
    const out = finish(f);
    window.setTimeout(() => {
      if (cur) return; // walked straight back in
      frame.src = 'about:blank';
      root.style.display = 'none';
    }, FADE_MS);
    opts.onExit?.(f, out.settled, out.summary);
  };

  back.addEventListener('click', close);

  window.addEventListener('message', (e) => {
    if (!cur || e.source !== frame.contentWindow) return;
    const m = parsePortalMsg(e.data);
    if (!m || m.visit !== cur.visit) return;
    if (m.kind === 'ready') reveal();
    else if (m.kind === 'ledger') saveBook(addEntries(loadBook(), m.entries));
    else if (m.kind === 'presence') presence.set(cur.portal, { n: m.inside, at: Date.now() });
    else if (m.kind === 'exit') close();
  });

  return {
    get active() {
      return cur !== null;
    },
    get current() {
      return cur;
    },
    enter(portalId, ret, who = {}) {
      const def = getPortal(portalId);
      if (cur || !def) return null;
      const f: PortalFrame = {
        visit: newVisitId(def.id), portal: def.id, from: opts.game, to: def.host.game, depth: opts.depth ?? 0,
        enteredAt: Date.now(), ret, room: who.room ?? null,
      };
      const s = loadStack();
      try {
        s.push(f);
      } catch {
        return null;
      }
      saveStack(s);
      cur = f;
      const own = new URLSearchParams(location.search);
      const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
      const url = hostUrl(def, visitQuery(def, f, { name: who.name, look: who.look }, location.search), {
        dev: !!env?.DEV, protocol: location.protocol, hostname: location.hostname, base: own.get('portalBase'),
      });
      title.textContent = def.host.title;
      frame.title = def.host.title;
      card.textContent = `Walking into ${def.building}…`;
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
      root.style.display = 'flex';
      // Next frame so the opacity transition runs.
      requestAnimationFrame(() => { root.style.opacity = '1'; });
      frame.src = url;
      frame.focus();
      readyTimer = window.setTimeout(reveal, READY_TIMEOUT_MS);
      return f;
    },
    exit: close,
    resume() {
      const s = loadStack();
      const f = s.pop();
      // Anything deeper is stale too: a reload drops every open visit of this page.
      saveStack(new PortalStack());
      const r = settle(loadBook(), opts.apply, myStore);
      saveBook(r.book);
      return { frame: f, settled: r.settled, summary: summarize(r.settled, opts.title) };
    },
    insideCount(portalId) {
      const p = presence.get(portalId);
      return p && Date.now() - p.at < 60_000 ? p.n : null;
    },
  };
}
