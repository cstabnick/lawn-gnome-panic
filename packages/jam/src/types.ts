import type { GnomeLook } from '@lawn/gnome';
import type { BotSlotAssignment } from './ai/types';
import type { SimBalanceConfig } from './balance';

export interface PlayerStats {
  /** Movement & sprint speed (0-100). */
  speed: number;
  /** 3-point & midrange shooting accuracy (0-100). */
  threePt: number;
  /** Dunk range, leap height & hangtime (0-100). */
  dunk: number;
  /** Steal, shove & block ability (0-100). */
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
  /** Platform account id (from @lawn/mp PlayerInfo.userId) for remote gear sync. */
  userId?: string;
}

export type Difficulty = 'rookie' | 'pro' | 'allstar';
export type OpponentMode = 'ai' | 'local2p' | 'online' | 'botvsbot';

export interface MatchConfig {
  homeTeamId: string;
  awayTeamId: string;
  homeRoster: [GnomePlayerProfile, GnomePlayerProfile];
  awayRoster: [GnomePlayerProfile, GnomePlayerProfile];
  opponentMode: OpponentMode;
  difficulty: Difficulty;
  quarterSeconds: number;
  /** Optional per-slot (0..3) bot AI assignments; omitted slots use the Classic Jam AI. */
  botSlots?: Partial<Record<0 | 1 | 2 | 3, BotSlotAssignment>>;
  /** Optional simulation balance overrides (used by eval:balance sweeps). */
  balance?: Partial<SimBalanceConfig>;
  seasonContext?: {
    phase: 'regular' | 'playoffs';
    roundIndex: number;
    matchId: string;
    label: string;
  };
  onlineContext?: {
    myTeam: 0 | 1;
    isHost: boolean;
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

export type DunkStyle =
  | 'tomahawk'
  | 'helicopter360'
  | 'frontflip'
  | 'windmill'
  | 'meteor'
  | 'spin720'
  | 'alleyOop'
  | 'backboard'
  | 'partnerLaunch';

export interface AnnouncerEvent {
  text: string;
  subtext?: string;
  color: string;
  big?: boolean;
}
