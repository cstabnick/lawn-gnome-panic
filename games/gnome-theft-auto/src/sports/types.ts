// Founders' Green sports (batch 3 E19): the save shared by Drainpipe Court (court/) and the Gutter Bowls (skate/).
// Pure types. The store lives in sports/save.ts (localStorage key SPORTS_SAVE_KEY, in GTA_SAVE_KEYS and cloud MERGES).
import type { GnomeLook } from '@lawn/gnome';
import type { LineId } from '../skate/types';

/** The regulars of both places: cutscene CAST keys, voices, looks (court/life.ts, skate/life.ts, court/game.ts). */
export type SportsCastKey = 'cardoon' | 'lintel' | 'pansy' | 'benchley' | 'fennel' | 'moss' | 'pebble';
export interface SportsPerson { key: SportsCastKey; name: string; look: Partial<GnomeLook>; held?: string; hz: number }

export const SPORTS_CAST: Readonly<Record<SportsCastKey, SportsPerson>> = {
  // Drainpipe Court. Swish wears the net the hoop never had.
  cardoon: { key: 'cardoon', name: 'Cardoon "Swish" Trowelly', hz: 118,
    look: { hat: 0xe0702a, shirt: 0x2a2a30, pants: 0x3a3a44, beard: 0x3b2a1e, equipment: { neck: 'swish-net-scarf' } } },
  lintel: { key: 'lintel', name: 'Lintel Crossover', hz: 136,
    look: { hat: 0x6a3fa0, shirt: 0xf2f2f2, pants: 0x6a3fa0, beard: null } },
  pansy: { key: 'pansy', name: 'Pansy Rebound', hz: 150,
    look: { hat: 0x2f8f5a, shirt: 0xf2c230, pants: 0x2f8f5a, beard: null, hair: { color: 0x8a4a2a, style: 'bun' },
      equipment: { head: 'drainpipe-sweatband' } } },
  benchley: { key: 'benchley', name: 'Old Burdock Benchley', hz: 78,
    look: { hat: 0x5a5a5a, shirt: 0x7a5a3a, pants: 0x4a3a2a, beard: 0xf4f4f0, glasses: true } },
  // The Gutter Bowls.
  fennel: { key: 'fennel', name: 'Fennel Gripwax', hz: 124,
    look: { hat: 0x3a7ac0, shirt: 0xc0503a, pants: 0x3a3a3a, beard: 0xb8893a, equipment: { back: 'gutter-deck-sling' } } },
  moss: { key: 'moss', name: 'Moss Squeegee', hz: 96,
    look: { hat: 0x4a7a3a, shirt: 0xf0c020, pants: 0x3a4a5a, beard: 0x9a9a9a } },
  pebble: { key: 'pebble', name: 'Pebble Nollie', hz: 168,
    look: { hat: 0xf07aa0, shirt: 0x50c0c0, pants: 0x4a4a8a, beard: null, freckles: true, equipment: { head: 'gutter-skate-helmet' } } },
};

export const SPORTS_SAVE_KEY = 'gta-sports-v1';

export interface SportsSave {
  v: 1;
  jam: {
    /** Pickup games finished (won or lost; quitting does not count). */
    games: number;
    wins: number;
    /** Threes and dunks the player made in pickup games; makes in shootarounds. */
    threes: number;
    dunks: number;
    shootMakes: number;
    /** Wins against Cardoon and Lintel (opponents 'swish'). */
    swishBeaten: number;
    /** Biggest winning margin. */
    bestMargin: number;
  };
  skate: {
    boardOwned: boolean;
    ollies: number;
    /** Best banked combo score. */
    bestCombo: number;
    fullRails: number;
    /** Best time (s) per line finished; lines never finished are absent. */
    lines: Partial<Record<LineId, number>>;
    /** Lines finished, all attempts counted. */
    linesDone: number;
  };
}

export interface SportsStore {
  data(): SportsSave;
  /** A pickup game ended. */
  recordGame(r: { won: boolean; margin: number; threes: number; dunks: number; swish: boolean }): void;
  recordShootMake(): void;
  setBoardOwned(): void;
  recordOllie(): void;
  /** Returns true when it is a new best. */
  recordCombo(points: number): boolean;
  recordFullRail(): void;
  /** Returns true when it is a new best time for that line. */
  recordLine(id: LineId, time: number): boolean;
}
