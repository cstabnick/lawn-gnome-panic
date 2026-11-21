// Types for Gnomecino Pull-Tabs: themed 3-tab instant tickets.

export type PullTabThemeId = 'trollin-gnomes' | 'goblinomicon' | 'gnome-theft-auto';

export interface PullTabSymbol {
  id: string;
  label: string;
  glyph: string;
  color: string;
  weight: number;
}

export interface PullTabPayout {
  id: string;
  label: string;
  symbolId: string;
  payout: number;
  jackpot?: boolean;
}

export interface PullTabSpec {
  id: PullTabThemeId;
  name: string;
  subtitle: string;
  cost: number;
  accent: string;
  cardBg: string;
  border: string;
  tabBg: string;
  symbols: readonly PullTabSymbol[];
  payouts: readonly PullTabPayout[];
}

export interface PullTabRow {
  symbols: [string, string, string];
  pulled: boolean;
  win: number;
  winLabel: string;
  jackpot: boolean;
}

export interface PullTabState {
  themeId: PullTabThemeId;
  seed: number;
  ticketId: number;
  rows: [PullTabRow, PullTabRow, PullTabRow] | null;
  totalWin: number;
  ticketsBought: number;
  totalWon: number;
}
