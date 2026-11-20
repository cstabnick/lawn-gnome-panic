import type { GnomeLook } from '@lawn/gnome';

export interface PlayerStats {
  /** Movement & sprint speed (3-9). */
  speed: number;
  /** 3-point & midrange shooting accuracy (3-9). */
  threePt: number;
  /** Dunk range, leap height & hangtime (3-9). */
  dunk: number;
  /** Steal, shove & block ability (3-9). */
  defense: number;
}

export interface GnomePlayerProfile {
  id: string;
  name: string;
  nickname: string;
  number: number;
  look: GnomeLook;
  stats: PlayerStats;
  isCustom?: boolean;
}

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

export interface CustomGnomeData {
  name: string;
  nickname: string;
  number: number;
  look: GnomeLook;
  stats: PlayerStats;
}

export type Difficulty = 'rookie' | 'pro' | 'allstar';
export type OpponentMode = 'ai' | 'local2p';

export interface MatchConfig {
  homeTeamId: string;
  awayTeamId: string;
  homeRoster: [GnomePlayerProfile, GnomePlayerProfile];
  awayRoster: [GnomePlayerProfile, GnomePlayerProfile];
  opponentMode: OpponentMode;
  difficulty: Difficulty;
  quarterSeconds: number;
  seasonContext?: {
    phase: 'regular' | 'playoffs';
    roundIndex: number;
    matchId: string;
    label: string;
  };
}

export interface PlayerBoxScore {
  name: string;
  team: 0 | 1;
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

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winner: 0 | 1;
  overtime: boolean;
  boxScore: PlayerBoxScore[];
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

export type DunkStyle = 'tomahawk' | 'helicopter360' | 'frontflip' | 'windmill' | 'meteor';

export interface AnnouncerEvent {
  text: string;
  subtext?: string;
  color: string;
  big?: boolean;
}
