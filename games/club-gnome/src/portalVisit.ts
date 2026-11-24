// Club Gnome as a crossover visitor: while a player is in The Gnomecino through a portal from another game, this
// reports their gains (chips, acorns, Oakcount items, achievements) to the page that opened it (see @lawn/portal).
import { getOakcount, onOakcountChange } from '@lawn/oakcount';
import { createAchievementStore } from '@lawn/achievements';
import { checkName } from '@lawn/mp/textFilter';
import type { PortalVisit } from '@lawn/portal';

const ACHIEVEMENT_POLL_MS = 2000;

/**
 * Reports every change to the Oakcount and every newly unlocked achievement to the origin page. Returns a stop
 * function. Gains already present when this is called (the welcome and daily gifts) are not reported.
 */
export function watchVisitLedger(visit: PortalVisit): () => void {
  const start = getOakcount();
  let acorns = start.acorns;
  let chips = start.chips;
  let owned = new Set(start.owned);

  const off = onOakcountChange((s) => {
    const dAcorns = s.acorns - acorns;
    const dChips = s.chips - chips;
    if (dAcorns !== 0) visit.record('acorns', { amount: dAcorns });
    if (dChips !== 0) visit.record('chips', { amount: dChips });
    for (const id of s.owned) {
      if (!owned.has(id)) visit.record('item', { ref: id });
    }
    acorns = s.acorns;
    chips = s.chips;
    owned = new Set(s.owned);
  });

  const store = createAchievementStore();
  let known: Set<string> | null = null;
  const poll = (): void => {
    void store.getState().then((state) => {
      const unlocked = Object.entries(state.records)
        .filter(([, r]) => r.unlockedAt !== undefined)
        .map(([id]) => id);
      if (known === null) {
        known = new Set(unlocked);
        return;
      }
      for (const id of unlocked) {
        if (!known.has(id)) {
          known.add(id);
          visit.record('achievement', { ref: id });
        }
      }
    }).catch(() => {});
  };
  poll();
  const timer = setInterval(poll, ACHIEVEMENT_POLL_MS);

  return () => {
    off();
    clearInterval(timer);
  };
}

/** The visitor's name from the origin page, or null when it is missing or not allowed. */
export function visitorName(visit: PortalVisit): string | null {
  const c = checkName(visit.info.name);
  return c.ok ? c.name : null;
}
