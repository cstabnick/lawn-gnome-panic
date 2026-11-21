import type { JamSimulation } from '../src/sim';
import { simulateMatch, type MatchOptions, type MatchTelemetry } from '../src/ai/eval';

/** One scoring play, read from the box-score delta on the tick the points landed. */
export interface ScoreEvent {
  tick: number; // sim tick at score
  elapsedSec: number; // live seconds since tipoff (sim clock)
  team: 0 | 1;
  kind: 'dunk' | 'three' | 'two';
  onFire: boolean; // scorer was on fire going into the play
  homeScore: number; // after the score
  awayScore: number;
}

/** One possession: from the tick a team gains the ball until the other team gets it or it scores. */
export interface PossessionEvent {
  team: 0 | 1; // team that had the ball
  startTick: number;
  endTick: number;
  passes: number;
  outcome: 'dunk' | 'three' | 'two' | 'miss' | 'turnover' | 'shotClock';
  teamOnFire: boolean; // someone on the team was on fire at possession start
}

export interface MatchEvents {
  seed: number;
  totalSec: number; // total live match seconds
  scores: ScoreEvent[];
  possessions: PossessionEvent[];
  /** index 0 = not on fire, 1 = on fire; POOLED counts, never per-match ratios. */
  shotsOnFire: { att: number; made: number }[];
}

interface OpenPossession {
  team: 0 | 1;
  startTick: number;
  passes: number;
  shotTaken: boolean;
  shotClockViolation: boolean;
  teamOnFire: boolean;
}

interface PrevPlayer {
  pts: number;
  dunks: number;
  tpm: number;
  onFire: boolean;
}

interface LastShot {
  shooter: number;
  onFire: boolean;
}

/** Live seconds elapsed on the sim clock. OT quarters are 30 s (see JamSimulation.clockSec). */
function elapsedLiveSec(sim: JamSimulation): number {
  const qs = sim.config.quarterSeconds;
  let prior = 0;
  for (let q = 1; q < sim.quarter; q++) prior += q <= 4 ? qs : 30;
  const len = sim.quarter <= 4 ? qs : 30;
  return prior + Math.max(0, len - sim.clockSec);
}

/**
 * Runs one headless match exactly as `simulateMatch` does (same seed, same RNG use)
 * and also returns per-match event logs. Events are derived from the sim's public
 * state each tick, so they cannot change the outcome of the match.
 *
 * Approximations (not observable from public sim state):
 * - "onFire" for a score is the scorer's fire state on the tick before the score.
 * - A possession that changes hands with a shot in flight is labelled 'miss';
 *   a shot-clock violation is detected from the announcer event text.
 */
export function recordMatch(opts: MatchOptions): { telemetry: MatchTelemetry; events: MatchEvents } {
  const scores: ScoreEvent[] = [];
  const possessions: PossessionEvent[] = [];
  const shotsOnFire: { att: number; made: number }[] = [
    { att: 0, made: 0 },
    { att: 0, made: 0 },
  ];

  let prevMode: string = 'loose';
  let prevPlayers: PrevPlayer[] = [0, 1, 2, 3].map(() => ({ pts: 0, dunks: 0, tpm: 0, onFire: false }));
  let open: OpenPossession | null = null;
  let lastShot: LastShot | null = null;
  let lastTick = 0;
  let lastElapsed = 0;

  const teamOnFireNow = (sim: JamSimulation, team: 0 | 1): boolean =>
    sim.players.some((p) => p.team === team && p.onFire);

  const closePossession = (endTick: number, outcome: PossessionEvent['outcome']) => {
    if (!open) return;
    possessions.push({
      team: open.team,
      startTick: open.startTick,
      endTick,
      passes: open.passes,
      outcome,
      teamOnFire: open.teamOnFire,
    });
    open = null;
  };

  /** Outcome for a possession that ends because the other team got the ball. */
  const handOffOutcome = (): PossessionEvent['outcome'] => {
    if (!open) return 'turnover';
    if (open.shotClockViolation) return 'shotClock';
    return open.shotTaken ? 'miss' : 'turnover';
  };

  const onTick = (sim: JamSimulation, lastEvent: string | null) => {
    const tick = sim.tick;
    const elapsedSec = elapsedLiveSec(sim);
    lastTick = tick;
    lastElapsed = elapsedSec;

    // 1. Scores: find the scorer from the points delta on each player's box score.
    for (let i = 0; i < sim.players.length; i++) {
      const p = sim.players[i];
      const prev = prevPlayers[i];
      if (p.box.pts <= prev.pts) continue;
      const kind: ScoreEvent['kind'] =
        p.box.dunks > prev.dunks ? 'dunk' : p.box.tpm > prev.tpm ? 'three' : 'two';
      const team = p.team;
      scores.push({
        tick,
        elapsedSec,
        team,
        kind,
        onFire: prev.onFire,
        homeScore: sim.score[0],
        awayScore: sim.score[1],
      });

      if (open && open.team !== team) {
        closePossession(tick, handOffOutcome());
      }
      if (!open) {
        open = {
          team,
          startTick: tick,
          passes: 0,
          shotTaken: true,
          shotClockViolation: false,
          teamOnFire: teamOnFireNow(sim, team),
        };
      }
      closePossession(tick, kind);

      if (kind !== 'dunk' && lastShot && lastShot.shooter === i) {
        shotsOnFire[lastShot.onFire ? 1 : 0].made++;
      }
      lastShot = null;
    }

    // 2. Possession bookkeeping while the ball is live.
    if (sim.phase === 'live') {
      if (open && lastEvent === 'SHOT CLOCK VIOLATION!') open.shotClockViolation = true;

      const cur: 0 | 1 | null =
        sim.ball.carrier !== null
          ? sim.players[sim.ball.carrier].team
          : sim.ball.mode === 'pass'
            ? sim.ball.lastTouchTeam
            : null;
      if (cur !== null && (!open || open.team !== cur)) {
        if (open) closePossession(tick, handOffOutcome());
        open = {
          team: cur,
          startTick: tick,
          passes: 0,
          shotTaken: false,
          shotClockViolation: false,
          teamOnFire: teamOnFireNow(sim, cur),
        };
      }

      if (open) {
        if (sim.ball.mode === 'pass' && prevMode !== 'pass' && sim.ball.lastTouchTeam === open.team) {
          open.passes++;
        }
        const shooter = sim.ball.shooter;
        if (sim.ball.mode === 'shot' && shooter !== null && sim.players[shooter].team === open.team) {
          open.shotTaken = true;
        }
        // A dunk attempt in the air (scored or rejected) also counts as a shot for 'miss' labelling.
        if (sim.players.some((p) => p.team === open.team && p.dunk !== null)) {
          open.shotTaken = true;
        }
      }
    } else if (open) {
      closePossession(tick, handOffOutcome());
    }

    // 3. Shot attempts (pooled by shooter fire state at release).
    if (sim.ball.mode === 'shot' && prevMode !== 'shot' && sim.ball.shooter !== null) {
      const shooter = sim.ball.shooter;
      const onFire = sim.players[shooter].onFire;
      shotsOnFire[onFire ? 1 : 0].att++;
      lastShot = { shooter, onFire };
    } else if (prevMode === 'shot' && sim.ball.mode !== 'shot') {
      lastShot = null;
    }

    prevMode = sim.ball.mode;
    prevPlayers = sim.players.map((p) => ({
      pts: p.box.pts,
      dunks: p.box.dunks,
      tpm: p.box.tpm,
      onFire: p.onFire,
    }));
  };

  const telemetry = simulateMatch({
    ...opts,
    onTick: (sim, lastEvent) => {
      onTick(sim, lastEvent);
      opts.onTick?.(sim, lastEvent);
    },
  });

  if (open) closePossession(lastTick, handOffOutcome());

  return {
    telemetry,
    events: {
      seed: telemetry.seed,
      totalSec: lastElapsed,
      scores,
      possessions,
      shotsOnFire,
    },
  };
}
