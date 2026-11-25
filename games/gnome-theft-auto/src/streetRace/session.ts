// E26 race modes: pickup races at the meets (rivals + a wager), solo time trials (best time + ghost) and online races
// (other players via RaceNet), all run on the quest race runner (quests/objectivesRace.ts raceRun with RaceRunOpts).
import { raceRun, type RaceEvent, type RaceRunOpts, type RaceTick } from '../quests/objectivesRace';
import type { QuestDeps, Run } from '../quests/types';
import { isStreetTrack, trackById } from '../raceTrack/tracks';
import type { Blip, Vehicle } from '../types';
import { createGhostRecorder, loadGhost, saveGhost } from './ghost';
import { createGhostView, type GhostView } from './ghostView';
import type { RacingStore } from './save';
import type { RaceModeStart, RaceNet, RaceResult, RaceSession } from './types';

export interface RaceSessionDeps {
  /** What a quest race gets (scene, world, hud, player, vehicles, watch, traffic, economy, atmosphere...). */
  quest: QuestDeps;
  /** Put the player in the driver's seat of v at once (app.ts, no walk-up). */
  seat(v: Vehicle): void;
  store: RacingStore;
  /** True while a quest step runs that owns the player (a quest race, a chase...): modes refuse to start then. */
  questBusy(): boolean;
  /** The online race link, or null offline. */
  net(): RaceNet | null;
  /** Add to a counting achievement. */
  increment(id: string, by?: number): void;
}

/** Acorns paid back for a pickup stake: twice the wager on a win, nothing otherwise. */
export function pickupPayout(wager: number, place: number): number {
  return place === 1 ? 2 * wager : 0;
}

function fmtTime(t: number): string {
  const s = (t % 60).toFixed(1).padStart(4, '0');
  return `${Math.floor(t / 60)}:${s}`;
}

/** "1. Name 1:02.3, Other DNF": finished racers by time first, the rest after. */
export function standingsText(rows: { name: string; time: number | null }[]): string {
  const done = rows.filter((r) => r.time !== null).sort((a, b) => (a.time as number) - (b.time as number));
  const rest = rows.filter((r) => r.time === null);
  return [
    ...done.map((r, i) => `${i + 1}. ${r.name} ${fmtTime(r.time as number)}`),
    ...rest.map((r) => `${r.name} DNF`),
  ].join(', ');
}

const WRAP_MAX = 45;

export function createRaceSession(deps: RaceSessionDeps): RaceSession {
  let current: RaceModeStart | null = null;
  let run: Run | null = null;
  let ghostView: GhostView | null = null;
  let last: RaceResult | null = null;
  let resolved = false;
  let staked = 0;
  let lightsOut = false;
  // Online wrap-up after my own finish.
  let wrapT = -1;
  let wrapTime = 0;
  let wrapNet: RaceNet | null = null;
  let myDist = 0;

  const toast = (t: string): void => deps.quest.hud.toast(t, 3500);

  function endRun(): void {
    try { run?.cleanup(); } catch { /* ignore */ }
    run = null;
    ghostView?.dispose();
    ghostView = null;
    deps.quest.watch?.setCap?.(null);
    current = null;
    wrapT = -1;
    wrapNet = null;
  }

  function wrapRows(net: RaceNet): { name: string; time: number | null; over: boolean }[] {
    const me = net.mine()?.members.find((m) => m.id === net.myId());
    const rows = [{ name: me?.name ?? 'You', time: wrapTime as number | null, over: true }];
    for (const r of net.racers()) rows.push({ name: r.name, time: r.finishedAt, over: r.finishedAt !== null || r.dnf });
    return rows;
  }

  function finishWrap(): void {
    const net = wrapNet;
    if (net) {
      toast(standingsText(wrapRows(net)));
      net.leave();
    }
    endRun();
  }

  function start(s: RaceModeStart): string | null {
    if (current) return 'A race is already on.';
    if (deps.questBusy()) return 'Finish what you are doing first.';
    const q = deps.quest;
    if (q.cutscene.active) return 'Not now.';
    if (!q.player || !q.vehicles || q.player.health <= 0) return 'You are in no state to race.';
    const wager = s.kind === 'pickup' ? s.wager ?? 0 : 0;
    const net = s.kind === 'online' ? deps.net() : null;
    if (s.kind === 'pickup') {
      if (!s.rivals || s.rivals.length === 0) return 'Nobody here to race.';
      if (wager > 0 && (!q.economy || q.economy.state().acorns < wager)) return 'You cannot cover that wager.';
    }
    if (s.kind === 'online') {
      if (!net || !net.online()) return 'You need to be online to race others.';
      if (!net.mine()) return 'Join or host a lobby first.';
    }

    const trackId = s.trackId;
    const track = trackById(trackId);
    const kind = s.kind;
    const wasUntimed = deps.store.data().best[trackId] === undefined;
    const rec = kind === 'trial' ? createGhostRecorder() : null;
    const stored = kind === 'trial' ? loadGhost(trackId) : null;
    const ghost = stored && stored.vehicle === s.vehicle ? stored : null;

    if (wager > 0) {
      if (!q.economy?.spend(wager, 'Street race stake')) return 'You cannot cover that wager.';
      staked = wager;
    } else staked = 0;
    lightsOut = false;
    resolved = false;
    last = null;

    const obj = {
      kind: 'race' as const,
      text: kind === 'trial' ? `Time trial: ${track.name}` : track.name,
      raceId: 'mode-' + kind,
      trackId,
      vehicle: s.vehicle,
      laps: s.laps,
      rivals: [...(s.rivals ?? [])],
      mustPlace: 1,
      hint: track.name,
    };

    const onEvent = (e: RaceEvent): void => {
      if (e.type === 'go') {
        lightsOut = true;
        return;
      }
      if (resolved) return;
      if (e.type === 'abandon') {
        resolved = true;
        last = { kind, trackId, time: null, place: 0, of: obj.rivals.length + 1, best: false, won: 0 };
        if (net) net.progress({ dist: myDist, finishedAt: null, dnf: true });
        return;
      }
      if (e.type !== 'finish') return;
      resolved = true;
      const { best } = deps.store.recordFinish(trackId, e.t);
      let won = 0;
      if (kind === 'pickup') {
        won = pickupPayout(wager, e.place);
        if (won > 0) {
          q.economy?.earn(won, 'Street race winnings');
          deps.store.notePickupWin(wager);
          if (wager > 0) deps.increment('gta-street-wager', wager);
        }
      } else if (kind === 'trial') {
        if (best && rec) saveGhost(rec.finish(trackId, s.vehicle, e.t));
        if (isStreetTrack(trackId) && wasUntimed) deps.increment('gta-time-trial', 1);
      } else if (net) {
        net.progress({ dist: myDist, finishedAt: e.t, dnf: false });
        if (e.place === 1 && (net.mine()?.members.length ?? 1) > 1) {
          deps.store.noteOnlineWin();
          q.unlock('gta-online-race');
        }
        wrapT = 0;
        wrapTime = e.t;
        wrapNet = net;
      }
      last = { kind, trackId, time: e.t, place: e.place, of: e.of, best, won };
    };

    const opts: RaceRunOpts = {
      seat: deps.seat,
      anyPlace: true,
      noPodium: true,
      endOnAbandon: true,
      onEvent,
      onTick: (t: RaceTick) => {
        myDist = t.dist;
        if (rec && t.phase === 'racing') rec.sample(t.t, t.x, t.y, t.z, t.yaw);
        ghostView?.update(t.phase === 'racing' ? t.t : 0);
        if (net && !resolved && t.phase === 'racing') net.progress({ dist: t.dist, finishedAt: null, dnf: false });
      },
    };
    if (net) {
      const lobby = net.mine();
      opts.slot = Math.max(0, lobby?.members.findIndex((m) => m.id === net.myId()) ?? 0);
      opts.canStart = () => net.started();
      opts.others = () => net.racers().map((r) => ({ id: String(r.id), name: r.name, dist: r.dist, finishedAt: r.finishedAt }));
    }

    current = s;
    q.watch?.setCap?.(kind === 'pickup' ? 1 : 0);
    try {
      run = raceRun(obj, q, () => undefined, toast, opts);
    } catch (err) {
      if (staked > 0) q.economy?.earn(staked, 'Street race stake refunded');
      staked = 0;
      endRun();
      return String(err instanceof Error ? err.message : err);
    }
    if (ghost) ghostView = createGhostView(q.scene, ghost);
    return null;
  }

  function update(dt: number): void {
    if (!run || !current) return;
    if (wrapT >= 0) {
      wrapT += dt;
      const net = wrapNet;
      if (!net || wrapRows(net).every((r) => r.over) || wrapT >= WRAP_MAX) finishWrap();
      return;
    }
    const p = deps.quest.player;
    if (p) run.update(dt, p.x, p.z);
    if (!run.done() || wrapT >= 0) return;
    if (!resolved) {
      last = { kind: current.kind, trackId: current.trackId, time: null, place: 0, of: 0, best: false, won: 0 };
      if (current.kind === 'online') deps.net()?.leave();
    }
    endRun();
  }

  function stop(why?: string): void {
    if (!current) return;
    const s = current;
    if (s.kind === 'online') {
      const net = wrapNet ?? deps.net();
      if (net && wrapT < 0 && !resolved) net.progress({ dist: myDist, finishedAt: null, dnf: true });
      net?.leave();
    }
    if (s.kind === 'pickup' && staked > 0 && !lightsOut) deps.quest.economy?.earn(staked, 'Street race stake refunded');
    if (why) toast(why);
    endRun();
  }

  return {
    active: () => current,
    start,
    stop,
    update,
    blips: (): Blip[] => (run ? run.blips() : []),
    lastResult: () => last,
  };
}
