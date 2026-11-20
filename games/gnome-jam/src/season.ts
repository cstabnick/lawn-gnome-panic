import { PRO_TEAMS } from './teams';
import type {
  Difficulty,
  PlayoffBracket,
  PlayoffMatch,
  ScheduledGame,
  SeasonState,
  TeamStanding,
} from './types';

const SEASON_KEY = 'gnome-jam.season.v1';

/**
 * Generates a single round-robin schedule for an even number of teams using the circle method.
 * For 8 teams: 7 rounds, 4 games per round, every team plays every other team exactly once.
 */
export function generateRoundRobinSchedule(teamIds: readonly string[]): ScheduledGame[] {
  const n = teamIds.length;
  if (n < 2 || n % 2 !== 0) {
    throw new Error(`Expected an even number of teams >= 2, got ${n}`);
  }
  const ring = [...teamIds];
  const fixed = ring[0];
  const rotating = ring.slice(1);
  const games: ScheduledGame[] = [];

  for (let round = 0; round < n - 1; round++) {
    const order = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const a = order[i];
      const b = order[n - 1 - i];
      const flip = (round + i) % 2 === 1;
      games.push({
        id: `reg-r${round}-g${i}`,
        round,
        homeTeamId: flip ? b : a,
        awayTeamId: flip ? a : b,
        played: false,
      });
    }
    // Rotate clockwise
    const last = rotating.pop()!;
    rotating.unshift(last);
  }
  return games;
}

export function createSeason(
  playerTeamId: string,
  useCustomGnome: boolean,
  playerDuoIndices: [number, number],
  difficulty: Difficulty,
  quarterSeconds = 60,
): SeasonState {
  const teamIds = PRO_TEAMS.map((t) => t.id);
  const standings: Record<string, TeamStanding> = {};
  for (const id of teamIds) {
    standings[id] = { teamId: id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  }
  return {
    playerTeamId,
    useCustomGnome,
    playerDuoIndices,
    difficulty,
    quarterSeconds,
    phase: 'regular',
    currentRound: 0,
    schedule: generateRoundRobinSchedule(teamIds),
    standings,
    bracket: null,
  };
}

/** Sort standings by Wins desc, Point Diff desc, Points For desc, Team ID asc. */
export function sortedStandings(standings: Record<string, TeamStanding>): TeamStanding[] {
  return Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

/** Deterministic-friendly AI match simulator for CPU vs CPU games. */
export function simulateCpuGame(
  homeTeamId: string,
  awayTeamId: string,
  rng: () => number = Math.random,
): { homeScore: number; awayScore: number } {
  const base = 24;
  let homeScore = base + Math.floor(rng() * 20);
  let awayScore = base + Math.floor(rng() * 20);
  if (homeScore === awayScore) {
    if (rng() < 0.5) homeScore += 2;
    else awayScore += 2;
  }
  // Slight home-court nudge
  if (homeTeamId === awayTeamId) homeScore += 2;
  return { homeScore, awayScore };
}

/**
 * Builds the Top-6 Knockout Tournament bracket from the final regular-season standings.
 * Seeds #1 and #2 earn a first-round bye straight into Round 2 (Semifinals):
 *  - Round 1 (Wildcard / Quarterfinals): QF1 = #4 vs #5, QF2 = #3 vs #6
 *  - Round 2 (Semifinals): SF1 = #1 vs Winner(QF1), SF2 = #2 vs Winner(QF2)
 *  - Round 3 (GBA Finals): Winner(SF1) vs Winner(SF2)
 */
export function createTop6Bracket(standings: Record<string, TeamStanding>): PlayoffBracket {
  const ranked = sortedStandings(standings);
  if (ranked.length < 6) {
    throw new Error('Need at least 6 teams for the Top-6 knockout tournament');
  }
  const seeds: [string, string, string, string, string, string] = [
    ranked[0].teamId,
    ranked[1].teamId,
    ranked[2].teamId,
    ranked[3].teamId,
    ranked[4].teamId,
    ranked[5].teamId,
  ];
  return {
    seeds,
    qf1: {
      id: 'qf1',
      round: 1,
      label: 'Round 1 — #4 vs #5',
      homeTeamId: seeds[3],
      awayTeamId: seeds[4],
      homeSeed: 4,
      awaySeed: 5,
      played: false,
      winnerTeamId: null,
    },
    qf2: {
      id: 'qf2',
      round: 1,
      label: 'Round 1 — #3 vs #6',
      homeTeamId: seeds[2],
      awayTeamId: seeds[5],
      homeSeed: 3,
      awaySeed: 6,
      played: false,
      winnerTeamId: null,
    },
    sf1: {
      id: 'sf1',
      round: 2,
      label: 'Semifinal 1 — #1 (BYE) vs #4/#5',
      homeTeamId: seeds[0],
      awayTeamId: null,
      homeSeed: 1,
      played: false,
      winnerTeamId: null,
    },
    sf2: {
      id: 'sf2',
      round: 2,
      label: 'Semifinal 2 — #2 (BYE) vs #3/#6',
      homeTeamId: seeds[1],
      awayTeamId: null,
      homeSeed: 2,
      played: false,
      winnerTeamId: null,
    },
    finals: {
      id: 'finals',
      round: 3,
      label: 'GBA Finals',
      homeTeamId: null,
      awayTeamId: null,
      played: false,
      winnerTeamId: null,
    },
    championTeamId: null,
  };
}

/** Find the player's next unplayed regular-season game in the current round. */
export function getNextRegularGame(season: SeasonState): ScheduledGame | null {
  if (season.phase !== 'regular') return null;
  return (
    season.schedule.find(
      (g) =>
        g.round === season.currentRound &&
        !g.played &&
        (g.homeTeamId === season.playerTeamId || g.awayTeamId === season.playerTeamId),
    ) ?? null
  );
}

/** Record the result of a regular-season game and auto-sim the other games in that round. */
export function recordRegularGameResult(
  season: SeasonState,
  gameId: string,
  homeScore: number,
  awayScore: number,
  rng: () => number = Math.random,
): SeasonState {
  const game = season.schedule.find((g) => g.id === gameId);
  if (!game || game.played) return season;

  applyRegularResult(season, game, homeScore, awayScore);

  // Sim all other games in the same round
  for (const other of season.schedule) {
    if (other.round === game.round && !other.played) {
      const sim = simulateCpuGame(other.homeTeamId, other.awayTeamId, rng);
      applyRegularResult(season, other, sim.homeScore, sim.awayScore);
    }
  }

  // Advance round or move to Top-6 Playoffs
  const nextRound = game.round + 1;
  const maxRound = Math.max(...season.schedule.map((g) => g.round));
  if (nextRound > maxRound) {
    season.currentRound = nextRound;
    season.phase = 'playoffs';
    season.bracket = createTop6Bracket(season.standings);
  } else {
    season.currentRound = nextRound;
  }

  return season;
}

function applyRegularResult(
  season: SeasonState,
  game: ScheduledGame,
  homeScore: number,
  awayScore: number,
): void {
  game.played = true;
  game.homeScore = homeScore;
  game.awayScore = awayScore;

  const home = season.standings[game.homeTeamId];
  const away = season.standings[game.awayTeamId];
  if (!home || !away) return;

  home.pointsFor += homeScore;
  home.pointsAgainst += awayScore;
  away.pointsFor += awayScore;
  away.pointsAgainst += homeScore;

  if (homeScore >= awayScore) {
    home.wins += 1;
    away.losses += 1;
  } else {
    away.wins += 1;
    home.losses += 1;
  }
}

export function getAllBracketMatches(b: PlayoffBracket): PlayoffMatch[] {
  return [b.qf1, b.qf2, b.sf1, b.sf2, b.finals];
}

/** Returns the next playable match in the Top-6 bracket (prioritizing the player's match if ready). */
export function getNextPlayoffMatch(season: SeasonState): PlayoffMatch | null {
  if (season.phase !== 'playoffs' || !season.bracket) return null;
  const ready = getAllBracketMatches(season.bracket).filter(
    (m) => !m.played && m.homeTeamId !== null && m.awayTeamId !== null,
  );
  if (ready.length === 0) return null;
  const mine = ready.find(
    (m) => m.homeTeamId === season.playerTeamId || m.awayTeamId === season.playerTeamId,
  );
  return mine ?? ready[0];
}

/** Record a playoff match result, advance the winner to the next round, and complete if Finals. */
export function recordPlayoffResult(
  season: SeasonState,
  matchId: string,
  homeScore: number,
  awayScore: number,
): SeasonState {
  const b = season.bracket;
  if (!b) return season;
  const match = getAllBracketMatches(b).find((m) => m.id === matchId);
  if (!match || match.played || !match.homeTeamId || !match.awayTeamId) return season;

  match.played = true;
  match.homeScore = homeScore;
  match.awayScore = awayScore;
  const winner = homeScore >= awayScore ? match.homeTeamId : match.awayTeamId;
  const winnerSeed = homeScore >= awayScore ? match.homeSeed : match.awaySeed;
  match.winnerTeamId = winner;

  if (match.id === 'qf1') {
    b.sf1.awayTeamId = winner;
    b.sf1.awaySeed = winnerSeed;
  } else if (match.id === 'qf2') {
    b.sf2.awayTeamId = winner;
    b.sf2.awaySeed = winnerSeed;
  } else if (match.id === 'sf1') {
    b.finals.homeTeamId = winner;
    b.finals.homeSeed = winnerSeed;
  } else if (match.id === 'sf2') {
    b.finals.awayTeamId = winner;
    b.finals.awaySeed = winnerSeed;
  } else if (match.id === 'finals') {
    b.championTeamId = winner;
    season.phase = 'complete';
  }

  return season;
}

/** Auto-simulate any ready CPU-only playoff matches (e.g. while #1/#2 sit on their bye!). */
export function simReadyCpuPlayoffMatches(
  season: SeasonState,
  rng: () => number = Math.random,
): SeasonState {
  if (season.phase !== 'playoffs' || !season.bracket) return season;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const m of getAllBracketMatches(season.bracket)) {
      if (
        !m.played &&
        m.homeTeamId &&
        m.awayTeamId &&
        m.homeTeamId !== season.playerTeamId &&
        m.awayTeamId !== season.playerTeamId
      ) {
        const sim = simulateCpuGame(m.homeTeamId, m.awayTeamId, rng);
        recordPlayoffResult(season, m.id, sim.homeScore, sim.awayScore);
        progressed = true;
      }
    }
  }
  return season;
}

export function isPlayerInPlayoffs(season: SeasonState): boolean {
  if (!season.bracket) return false;
  return season.bracket.seeds.includes(season.playerTeamId);
}

export function getPlayerSeed(season: SeasonState): number | null {
  if (!season.bracket) return null;
  const idx = season.bracket.seeds.indexOf(season.playerTeamId);
  return idx >= 0 ? idx + 1 : null;
}

export function saveSeason(season: SeasonState | null): void {
  try {
    if (!season) localStorage.removeItem(SEASON_KEY);
    else localStorage.setItem(SEASON_KEY, JSON.stringify(season));
  } catch {
    // ignore storage errors
  }
}

export function loadSeason(): SeasonState | null {
  try {
    const raw = localStorage.getItem(SEASON_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SeasonState;
  } catch {
    return null;
  }
}
