// DayG achievements: four gear rewards, unlocked from the game's own events (see packages/achievements/README.md).
import { createAchievementTracker } from '@lawn/achievements';
import type { Bus } from './bus';
import type { Clock, PlayerState } from './types';

export function createDaygAchievements(deps: { bus: Bus; ui: HTMLElement; getPlayer: () => PlayerState; clock: Clock }): void {
  const { bus, ui, getPlayer } = deps;
  const tracker = createAchievementTracker({ ui });
  const safe = (p: Promise<unknown>): void => { p.catch(() => {}); };
  const unlock = (id: string): void => safe(tracker.unlock(id));
  const increment = (id: string): void => safe(tracker.increment(id));

  // First Night: real seconds spent at night, and how many of them outside a haven.
  let nightRaf = 0;
  let night = 0;
  let outside = 0;
  let last = 0;
  const stopNight = (): void => {
    if (nightRaf) cancelAnimationFrame(nightRaf);
    nightRaf = 0;
  };
  const nightTick = (now: number): void => {
    const dt = last ? Math.max(0, (now - last) / 1000) : 0;
    last = now;
    night += dt;
    const p = getPlayer();
    if (p.alive && p.haven === null) outside += dt;
    nightRaf = requestAnimationFrame(nightTick);
  };

  bus.on('dusk', () => {
    stopNight();
    night = 0;
    outside = 0;
    last = 0;
    nightRaf = requestAnimationFrame(nightTick);
  });
  bus.on('dawn', () => {
    stopNight();
    if (getPlayer().alive && night > 0 && outside >= 0.5 * night) unlock('dayg-first-night');
    night = 0;
    outside = 0;
    last = 0;
  });

  // Up and Away: a rope or ladder climb of 9 gm or more.
  bus.on('climbed', (e) => {
    if ((e.via === 'rope' || e.via === 'ladder') && e.height >= 9) unlock('dayg-up-and-away');
  });

  // Scraped Clean: the moss came out of a crack in time.
  bus.on('infection-cured', () => unlock('dayg-scraped-clean'));

  // Mossbreaker: 10 Hatless cores cracked.
  bus.on('hatless-destroyed', () => increment('dayg-mossbreaker'));

  // Walked In: the first time the player goes through a building door.
  bus.on('entered-building', () => unlock('dayg-walked-in'));
}
