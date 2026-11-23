// L0 bubbles: one per region with a player in it. Each bubble holds the Hatless promoted out of the horde while a
// player is there (`hatless`); its owner's browser runs them. Hatless counts are conserved across every move here.
import type { Arrival, Bubble, PlayerKey, RegionId, WorldState } from './types';

export function bubbleOf(w: WorldState, player: PlayerKey): Bubble | null {
  for (const b of w.bubbles) if (b.owner === player || b.viewers.includes(player)) return b;
  return null;
}
export function bubbleIn(w: WorldState, r: RegionId): Bubble | null {
  for (const b of w.bubbles) if (b.region === r) return b;
  return null;
}
function herdsIn(w: WorldState, r: RegionId): number {
  let n = 0;
  for (const h of w.horde.herds) if (h.region === r) n += h.size;
  return n;
}
function removeHerdsIn(w: WorldState, r: RegionId): void {
  w.horde.herds = w.horde.herds.filter((h) => h.region !== r);
}

/** Leaves the player's current bubble (if any), then joins region r (or nowhere when r is null). */
export function enterRegion(w: WorldState, player: PlayerKey, r: RegionId | null, alive: number): { promoted: number; owner: PlayerKey | null } {
  const old = bubbleOf(w, player);
  if (old) {
    if (old.owner === player) {
      if (old.viewers.length > 0) {
        // Ownership passes to the first viewer; the Hatless stay in the bubble.
        old.owner = old.viewers[0];
        old.viewers = old.viewers.slice(1);
      } else {
        w.horde.density[old.region] += old.hatless;
        w.bubbles = w.bubbles.filter((b) => b !== old);
      }
    } else {
      old.viewers = old.viewers.filter((v) => v !== player);
    }
  }
  if (r === null) return { promoted: 0, owner: null };
  const there = bubbleIn(w, r);
  if (there) {
    there.viewers.push(player);
    return { promoted: 0, owner: there.owner };
  }
  const n = w.horde.density[r] + herdsIn(w, r);
  w.horde.density[r] = 0;
  removeHerdsIn(w, r);
  w.bubbles.push({ owner: player, region: r, hatless: n, viewers: [] });
  return { promoted: n, owner: player };
}

/** Moves loose Hatless and herds now in each bubble's region into that bubble; one Arrival per bubble that gained some. */
export function absorbBubbles(w: WorldState): Arrival[] {
  const out: Arrival[] = [];
  for (const b of w.bubbles) {
    const r = b.region;
    const n = w.horde.density[r] + herdsIn(w, r);
    w.horde.density[r] = 0;
    removeHerdsIn(w, r);
    b.hatless += n;
    if (n > 0) {
      const move = w.events.find((e) => e.kind === 'herd-moved' && e.to === r);
      const from = move && move.kind === 'herd-moved' ? move.from : null;
      out.push({ player: b.owner, region: r, count: n, from });
    }
  }
  return out;
}

/** One Hatless in r's bubble is destroyed. False when there is no bubble there or nothing left in it. */
export function destroyInBubble(w: WorldState, r: RegionId): boolean {
  const b = bubbleIn(w, r);
  if (!b || b.hatless <= 0) return false;
  b.hatless -= 1;
  w.ledger.hatlessDestroyed += 1;
  return true;
}
export function bubbleHatless(w: WorldState): number {
  let n = 0;
  for (const b of w.bubbles) n += b.hatless;
  return n;
}
