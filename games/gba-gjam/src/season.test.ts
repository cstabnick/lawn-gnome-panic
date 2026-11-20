import { describe, expect, it } from 'vitest';
import { PRO_TEAMS } from './teams';
import {
  createSeason,
  createTop6Bracket,
  generateRoundRobinSchedule,
  getNextPlayoffMatch,
  getNextRegularGame,
  recordPlayoffResult,
  recordRegularGameResult,
  simReadyCpuPlayoffMatches,
  sortedStandings,
} from './season';

function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe('GBA Season & Top-6 Knockout Tournament', () => {
  it('generates a valid 7-round round-robin schedule for all 8 pro teams', () => {
    const ids = PRO_TEAMS.map((t) => t.id);
    expect(ids).toHaveLength(8);
    const schedule = generateRoundRobinSchedule(ids);
    expect(schedule).toHaveLength(28); // 8*7/2

    const pairs = new Set<string>();
    for (let r = 0; r < 7; r++) {
      const roundGames = schedule.filter((g) => g.round === r);
      expect(roundGames).toHaveLength(4);
      const seenInRound = new Set<string>();
      for (const g of roundGames) {
        expect(g.homeTeamId).not.toBe(g.awayTeamId);
        seenInRound.add(g.homeTeamId);
        seenInRound.add(g.awayTeamId);
        const key = [g.homeTeamId, g.awayTeamId].sort().join(':');
        pairs.add(key);
      }
      expect(seenInRound.size).toBe(8);
    }
    expect(pairs.size).toBe(28);
  });

  it('gives Top 2 seeds a first-round bye into Semifinals and seeds #3-#6 in Round 1', () => {
    const season = createSeason(PRO_TEAMS[0].id, false, [0, 1], 'pro');
    const rng = seededRng(7);

    // Play all 7 rounds so player wins every game (guaranteed #1 seed!)
    for (let r = 0; r < 7; r++) {
      const next = getNextRegularGame(season);
      expect(next).not.toBeNull();
      const homeWins = next!.homeTeamId === season.playerTeamId;
      recordRegularGameResult(season, next!.id, homeWins ? 50 : 20, homeWins ? 20 : 50, rng);
    }

    expect(season.phase).toBe('playoffs');
    expect(season.bracket).not.toBeNull();
    const b = season.bracket!;
    const ranked = sortedStandings(season.standings);

    // #1 seed is our undefeated player team
    expect(ranked[0].teamId).toBe(season.playerTeamId);
    expect(b.seeds[0]).toBe(ranked[0].teamId);
    expect(b.seeds[1]).toBe(ranked[1].teamId);

    // Round 1: #4 vs #5 and #3 vs #6
    expect(b.qf1.homeTeamId).toBe(b.seeds[3]);
    expect(b.qf1.awayTeamId).toBe(b.seeds[4]);
    expect(b.qf2.homeTeamId).toBe(b.seeds[2]);
    expect(b.qf2.awayTeamId).toBe(b.seeds[5]);

    // Round 2: #1 and #2 already placed with BYEs!
    expect(b.sf1.homeTeamId).toBe(b.seeds[0]);
    expect(b.sf1.awayTeamId).toBeNull();
    expect(b.sf2.homeTeamId).toBe(b.seeds[1]);
    expect(b.sf2.awayTeamId).toBeNull();

    // Auto-simming Round 1 CPU games unlocks player's Semifinal (#1 vs Winner of #4/#5)
    simReadyCpuPlayoffMatches(season, rng);
    expect(b.qf1.played).toBe(true);
    expect(b.qf2.played).toBe(true);
    expect(b.sf1.awayTeamId).toBe(b.qf1.winnerTeamId);
    expect(b.sf2.awayTeamId).toBe(b.qf2.winnerTeamId);

    // Next match for player is SF1!
    const nextPlayoff = getNextPlayoffMatch(season);
    expect(nextPlayoff?.id).toBe('sf1');
    recordPlayoffResult(season, 'sf1', 44, 30);
    simReadyCpuPlayoffMatches(season, rng);

    // Finals should now be ready with player in home slot
    const finals = getNextPlayoffMatch(season);
    expect(finals?.id).toBe('finals');
    expect(finals?.homeTeamId).toBe(season.playerTeamId);
    recordPlayoffResult(season, 'finals', 48, 42);

    expect(season.phase).toBe('complete');
    expect(season.bracket?.championTeamId).toBe(season.playerTeamId);
  });

  it('throws if fewer than 6 teams are provided to Top-6 bracket', () => {
    const standings = {
      a: { teamId: 'a', wins: 1, losses: 0, pointsFor: 10, pointsAgainst: 5 },
    };
    expect(() => createTop6Bracket(standings)).toThrow();
  });
});
