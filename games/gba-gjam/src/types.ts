import type { GnomeLook } from '@lawn/gnome';
import type { Difficulty, GnomePlayerProfile, PlayerStats } from '@lawn/jam';

export type {
  AnnouncerEvent,
  Difficulty,
  DunkStyle,
  GnomePlayerProfile,
  MatchConfig,
  MatchResult,
  OpponentMode,
  PlayerBoxScore,
  PlayerStats,
} from '@lawn/jam';

export interface ProTeam {
  id: string;
  city: string;
  name: string;
  abbr: string;
  primary: number;
  secondary: number;
  primaryHex: string;
  secondaryHex: string;
  emblem: string;
  motto: string;
  roster: [GnomePlayerProfile, GnomePlayerProfile, GnomePlayerProfile];
}

export interface CareerStats {
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  dunks: number;
  steals: number;
  blocks: number;
  rebounds: number;
}

export interface ProgressionData {
  gamesPlayed: number;
  wins: number;
  tournamentWins: number;
  /** Total bonus stat points earned from games played (+3), wins (+2), and tournament wins (+20). */
  bonusPoints: number;
  career: CareerStats;
}

export interface CustomGnomeData {
  name: string;
  nickname: string;
  number: number;
  look: GnomeLook;
  stats: PlayerStats;
  progression: ProgressionData;
}

export interface TeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface ScheduledGame {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface PlayoffMatch {
  id: string;
  round: 1 | 2 | 3; // 1 = Quarterfinals (3v6, 4v5), 2 = Semifinals (1 vs W45, 2 vs W36), 3 = GBA Finals
  label: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSeed?: number;
  awaySeed?: number;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  winnerTeamId: string | null;
}

export interface PlayoffBracket {
  /** Top 6 team IDs in seed order [seed1, seed2, seed3, seed4, seed5, seed6]. */
  seeds: [string, string, string, string, string, string];
  /** Round 1: qf1 (4 vs 5), qf2 (3 vs 6). Seeds 1 & 2 get first-round byes! */
  qf1: PlayoffMatch;
  qf2: PlayoffMatch;
  /** Round 2: sf1 (1 vs Winner qf1), sf2 (2 vs Winner qf2). */
  sf1: PlayoffMatch;
  sf2: PlayoffMatch;
  /** Round 3: finals (Winner sf1 vs Winner sf2). */
  finals: PlayoffMatch;
  championTeamId: string | null;
}

export interface SeasonState {
  playerTeamId: string;
  useCustomGnome: boolean;
  playerDuoIndices: [number, number];
  difficulty: Difficulty;
  quarterSeconds: number;
  phase: 'regular' | 'playoffs' | 'complete';
  currentRound: number; // 0..6 for regular season
  schedule: ScheduledGame[];
  standings: Record<string, TeamStanding>;
  bracket: PlayoffBracket | null;
}
