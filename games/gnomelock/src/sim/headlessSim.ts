// Pure headless 2v2 match runner for balance & pacing telemetry.
import { computeBotInput } from './bot';
import { MATCH_CONFIG, type HeroId, type Team } from './config';
import { createMatchState, type SlotSetup, stepWorld } from './world';

export interface SimMatchSummary {
  seed: number;
  durationS: number;
  winner: Team | null;
  leaderAt5Min: Team | null;
  leadPctAt5Min: number;
  relicClaimedBy: Team | null;
  lastHitOrbShare: number; // fraction of total team income from last-hits + orbs
  heroes: { heroId: HeroId; team: Team; kills: number; deaths: number; lastHits: number; orbsConfirmed: number; orbsDenied: number }[];
}

export function runHeadlessMatch(
  slots: SlotSetup[],
  skills: readonly [number, number, number, number],
  seed: number,
  dt = 1 / 15, // 15 Hz sim step for fast headless runs
): SimMatchSummary {
  const state = createMatchState(slots, seed);
  const maxSteps = Math.ceil(MATCH_CONFIG.hardCapS / dt);
  for (let i = 0; i < maxSteps && state.winner === null; i++) {
    const inputs = state.heroes.map((_, idx) =>
      computeBotInput(state, idx, { skill: skills[idx] }),
    );
    stepWorld(state, inputs, dt);
  }

  let totalIncome = 0;
  let lastHitOrbIncome = 0;
  for (const h of state.heroes) {
    totalIncome += h.totalAcorns;
    lastHitOrbIncome += h.incomeLastHit + h.incomeOrb;
  }

  return {
    seed,
    durationS: state.timeS,
    winner: state.winner,
    leaderAt5Min: state.leaderAt5Min,
    leadPctAt5Min: state.leadPctAt5Min,
    relicClaimedBy: state.relic.claimedByTeam,
    lastHitOrbShare: totalIncome > 0 ? lastHitOrbIncome / totalIncome : 0,
    heroes: state.heroes.map((h) => ({
      heroId: h.heroId,
      team: h.team,
      kills: h.kills,
      deaths: h.deaths,
      lastHits: h.lastHits,
      orbsConfirmed: h.orbsConfirmed,
      orbsDenied: h.orbsDenied,
    })),
  };
}
