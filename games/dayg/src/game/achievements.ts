// DayG achievements: four gear rewards, unlocked from the game's own events (see packages/achievements/README.md).
import { createAchievementTracker } from '@lawn/achievements';
import type { Bus } from './bus';
import type { Clock, NetSession, PlayerState, SimHost } from './types';
import { powerOf } from '../sim/factions';
import type { FactionId, Faction, Rank, RegionId } from '../sim/types';

const RANK_SWORN_UP: readonly Rank[] = ['sworn', 'warden', 'voice'];

export function createDaygAchievements(deps: { bus: Bus; ui: HTMLElement; getPlayer: () => PlayerState; clock: Clock; host?: SimHost; session?: NetSession }): void {
  const { bus, ui, getPlayer, host, session } = deps;
  const tracker = createAchievementTracker({ ui });
  const safe = (p: Promise<unknown>): void => { p.catch(() => {}); };
  const unlock = (id: string): void => { safe(tracker.unlock(id)); deps.bus.emit('achievement', { id }); };
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

  // ---- talk, quests, factions, online. Host- and session-based rules stay inert when the deps are not passed.
  const world = () => host?.world;
  const claimed = new Set<string>();
  const once = (id: string): void => { if (!claimed.has(id)) { claimed.add(id); unlock(id); } };
  const myFaction = (): FactionId | null => {
    const w = world();
    return w ? w.players[host!.me]?.faction ?? null : null;
  };

  // Word Gets Around: five quests finished.
  // Kingmaker, Herd Herder: read the quest and the world at quest-done.
  // Herd sizes are tracked per tick, so a herd that scattered before the quest ended still counts.
  const herdMax = new Map<number, number>();
  bus.on('sim-tick', () => {
    const w = world();
    if (w) {
      for (const h of w.horde.herds) herdMax.set(h.id, Math.max(herdMax.get(h.id) ?? 0, h.size));
      const me = w.players[host!.me];
      if (me && me.notoriety >= 0.5) once('dayg-wanted');
    }
    if (session && session.players().length >= 4) once('dayg-four-at-the-gate');
  });

  // Dawn-time daily rows are read once per dawn (sim writes them at day end).
  const lastDailyTop = (): FactionId | null => {
    const rows = world()?.daily ?? [];
    return rows.length ? rows[rows.length - 1].topFactions?.[0] ?? null : null;
  };

  bus.on('quest-done', (e) => {
    increment('dayg-word-gets-around');
    const w = world();
    if (!w) return;
    const q = w.quests[e.quest];
    if (!q) return;
    // Kingmaker: the poster's faction is now the strongest alive faction, and was not at the previous daily row.
    if (q.poster.startsWith('f:')) {
      const posterId = Number(q.poster.slice(2));
      const alive = w.factions.filter((f: Faction) => f.diedTick === null);
      let top: Faction | null = null;
      for (const f of alive) if (!top || powerOf(w, f) > powerOf(w, top)) top = f;
      if (top && top.id === posterId && lastDailyTop() !== posterId) unlock('dayg-kingmaker');
    }
    // Herd Herder: a steer-drift on a herd of 200+ that now sits in a PIT region.
    const goal = q.goal;
    if (goal.kind === 'steer' && q.template === 'steer-drift') {
      const herd = w.horde.herds.find((h) => h.id === goal.herd);
      const size = Math.max(herdMax.get(goal.herd) ?? 0, herd?.size ?? 0);
      const at = herd ? (w.graph.byId[herd.region as RegionId]?.traits ?? []) : [];
      if (size >= 200 && at.includes('PIT')) unlock('dayg-herd-herder');
    }
  });

  // Sworn: rank in a faction reached sworn or above.
  bus.on('rank-changed', (e) => {
    if (RANK_SWORN_UP.includes(e.rank)) unlock('dayg-sworn');
  });

  // Handed Over: the room's host changed while I am in a session.
  bus.on('host-changed', () => {
    if (session && session.status !== 'offline') unlock('dayg-handed-over');
  });

  // Gatekeeper: my faction held the Waystation in each of the last 7 daily rows.
  bus.on('dawn', () => {
    const w = world();
    const mine = myFaction();
    if (!w || mine === null) return;
    const rows = w.daily.slice(-7);
    if (rows.length === 7 && rows.every((r) => r.havenHolders?.waystation === mine)) unlock('dayg-gatekeeper');
  });
}
