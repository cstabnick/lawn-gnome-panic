// Base achievements (roadmap 9 issue 2.5): three gear rewards, unlocked from the base's own events.
import { createAchievementTracker } from '@lawn/achievements';
import type { Bus } from '../game/bus';

// Hatless pushing a barricade this much in total (across its life) earns Held the Line.
const HELD_THE_LINE_HP = 80;

export function createBaseAchievements(deps: { bus: Bus; ui: HTMLElement }): void {
  const { bus, ui } = deps;
  const tracker = createAchievementTracker({ ui });
  const safe = (p: Promise<unknown>): void => { p.catch(() => {}); };
  const unlock = (id: string): void => safe(tracker.unlock(id));

  // First Wall: a plank wall raised on the player's own plot.
  bus.on('piece-placed', (e) => {
    if (e.kind === 'plank-wall') unlock('dayg-first-wall');
  });

  // Locked In: slept at least 4 hours sealed in, with every door locked.
  bus.on('base-slept', (e) => {
    if (e.sealed && e.locked && e.hours >= 4) unlock('dayg-locked-in');
  });

  // Held the Line: per-barricade total of HP lost to pushing; cleared when the piece breaks.
  const lastHp = new Map<string, number>();
  const pushed = new Map<string, number>();
  bus.on('piece-damaged', (e) => {
    const before = lastHp.get(e.id) ?? e.maxHp;
    lastHp.set(e.id, e.hp);
    if (e.kind !== 'barricade' || e.cause !== 'push') return;
    const total = (pushed.get(e.id) ?? 0) + Math.max(0, before - e.hp);
    pushed.set(e.id, total);
    if (total >= HELD_THE_LINE_HP && e.hp > 0) unlock('dayg-held-the-line');
  });
  bus.on('piece-broken', (e) => {
    lastHp.delete(e.id);
    pushed.delete(e.id);
  });
}
