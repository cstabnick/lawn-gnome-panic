// What the games call: my own gnome (to wear and to send) and other players' gnomes (to build their puppets).
// Games never touch the store, the storage or the look code directly. See README.md for how the service replaces this.
import { createGnomeStore } from './store';
import { decodeLook, encodeLook, isLookCode, snapLook, toModelLook } from './look';
import type { Gnome, GnomeLook, GnomeStore, Look, MyGnome, PlayerRef } from './types';

/** My gnome as loaded by loadMyGnome (null before it ran, or when there is none). */
let mine: MyGnome | null = null;

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
  // Snap first so the code and the model are built from the same colours other players will see.
  const look = snapLook(chosen);
  mine = {
    name: stored ? stored.displayName : 'Gnome',
    look: toModelLook(look),
    code: encodeLook(look),
  };
  return mine;
}

/** My gnome as loaded by loadMyGnome (null before it ran, or when there is none). Synchronous. */
export function getMyGnome(): MyGnome | null {
  return mine;
}

/**
 * The model look of another player, or null when they have no custom gnome (the game uses its own look for them).
 * Synchronous. Today the look travels in the player's `character` (a `g1.` look code) and this just decodes it.
 * Later it will read what prefetchLooks learned from the service by userId.
 */
export function resolveLook(player: PlayerRef): GnomeLook | null {
  // userId is ignored for now: the service will use it to look the gnome up.
  // Checked by type first: a game may send anything in `character`, and this must never throw.
  const code = player?.character;
  if (typeof code !== 'string' || !isLookCode(code)) return null;
  const look = decodeLook(code);
  return look ? toModelLook(look) : null;
}

/**
 * Call when a roster arrives (match, joined) so looks the service has to fetch are ready by the time models are built.
 * Today there is nothing to fetch: it resolves at once. Never rejects.
 */
export async function prefetchLooks(_players: PlayerRef[]): Promise<void> {
  // stub
}

/** Calls cb when prefetchLooks learned a look that resolveLook did not know before. Today it never fires. Returns an unsubscribe. */
export function onLooksChanged(_cb: () => void): () => void {
  return () => {};
}
