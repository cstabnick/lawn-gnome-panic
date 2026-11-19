// What the games call: my own gnome (to wear and to send) and other players' gnomes (to build their puppets).
// Games never touch the store, the storage or the look code directly. See README.md for how the service replaces this.
import { accountsEnabled } from '@lawn/platform/session';
import { setMyUserId } from '@lawn/mp/client';
import { ConnectGnomeStore } from './connectStore';
import { createGnomeStore } from './store';
import { decodeLook, encodeLook, isLookCode, snapLook, toModelLook } from './look';
import type { Gnome, GnomeLook, GnomeStore, Look, MyGnome, PlayerRef } from './types';

/** My gnome as loaded by loadMyGnome (null before it ran, or when there is none). */
let mine: MyGnome | null = null;

/** Looks fetched from the platform service by userId (model looks, palette-snapped), and the ids being fetched or answered. */
const fetched = new Map<string, GnomeLook>();
const asked = new Set<string>();
const listeners = new Set<() => void>();

/**
 * Loads my gnome once, at startup, and remembers it for getMyGnome(). Call it with `await` at the top of a game's main.ts.
 * Resolves null (and never rejects) when the player has not saved a look, when storage is unavailable, or when the store
 * takes longer than timeoutMs: the game then keeps its own gnome. A `?gnome=<look code>` in the page URL wins over the store
 * (for dev servers on other origins and for sharing); it is not saved.
 */
export async function loadMyGnome(timeoutMs: number = 1500, store: GnomeStore = createGnomeStore()): Promise<MyGnome | null> {
  let urlLook: Look | null = null;
  if (typeof location !== 'undefined') {
    const value = new URLSearchParams(location.search).get('gnome');
    urlLook = value === null ? null : decodeLook(value);
  }

  let stored: Gnome | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    stored = await Promise.race([
      store.getMe(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    stored = null; // storage failed: the game keeps its own gnome
  } finally {
    // Don't leave a pending timer behind once the store has answered.
    clearTimeout(timer);
  }

  const chosen = urlLook ?? stored?.look ?? null;
  if (!chosen) {
    mine = null;
    return null;
  }
  const userId = stored && /^u_/.test(stored.userId) ? stored.userId : undefined;
  setMyUserId(userId ?? null);
  // Snap first so the code and the model are built from the same colours other players will see.
  const look = snapLook(chosen);
  mine = {
    name: stored ? stored.displayName : 'Gnome',
    look: toModelLook(look),
    code: encodeLook(look),
    ...(userId !== undefined ? { userId } : {}),
  };
  return mine;
}

/** My gnome as loaded by loadMyGnome (null before it ran, or when there is none). Synchronous. */
export function getMyGnome(): MyGnome | null {
  return mine;
}

/**
 * The model look of another player, or null when they have no custom gnome (the game uses its own look for them).
 * Synchronous. The gnome prefetchLooks fetched by userId (gear included) wins; otherwise the player's `character`
 * (a `g1.` look code: colours only, no gear) is decoded.
 */
export function resolveLook(player: PlayerRef): GnomeLook | null {
  // A gnome the service told us about (gear included) wins over the look code, which carries colours only.
  const known = typeof player?.userId === 'string' ? fetched.get(player.userId) : undefined;
  if (known) return known;
  // Checked by type first: a game may send anything in `character`, and this must never throw.
  const code = player?.character;
  if (typeof code !== 'string' || !isLookCode(code)) return null;
  const look = decodeLook(code);
  return look ? toModelLook(look) : null;
}

/**
 * Call when a roster arrives (match, joined) so the gnomes of players with a userId (their gear is not in the look code)
 * are fetched with BatchGetGnomes. Resolves when the fetch is done; resolveLook then returns them, and onLooksChanged
 * listeners fire if anything new arrived. Players without a userId, ids already asked, and a build without accounts
 * are skipped. Never rejects; a failed fetch leaves resolveLook on the look code. `store` is for tests.
 */
export async function prefetchLooks(players: PlayerRef[], store?: GnomeStore): Promise<void> {
  const ids: string[] = [];
  for (const p of players ?? []) {
    const id = p?.userId;
    if (typeof id === 'string' && id.startsWith('u_') && !asked.has(id) && !ids.includes(id)) ids.push(id);
  }
  if (ids.length === 0) return;
  const source = store ?? (accountsEnabled() ? new ConnectGnomeStore() : null);
  if (source === null) return;
  for (const id of ids) asked.add(id);
  let gnomes: Gnome[] = [];
  try {
    gnomes = await source.batchGetGnomes(ids);
  } catch {
    // keep the look codes
  }
  const got = new Set<string>();
  let grew = false;
  for (const g of gnomes) {
    if (!g.look || !ids.includes(g.userId)) continue;
    got.add(g.userId);
    fetched.set(g.userId, toModelLook(snapLook(g.look)));
    grew = true;
  }
  // An id the service did not answer (network, or no such gnome) may be asked again on the next roster.
  for (const id of ids) if (!got.has(id)) asked.delete(id);
  if (grew) for (const cb of [...listeners]) cb();
}

/** Calls cb when prefetchLooks learned a look that resolveLook did not know before. Returns an unsubscribe. */
export function onLooksChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Forgets every fetched look (tests). */
export function clearFetchedLooks(): void {
  fetched.clear();
  asked.clear();
}
