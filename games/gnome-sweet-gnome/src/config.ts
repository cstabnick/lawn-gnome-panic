// Shared constants and contracts for Gnome Sweet Gnome. Every module imports from here.
import type { BoosterKind } from './engine/types';

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  house: 'House', // the hub: the gnome house builder + "Play level N"
  level: 'Level', // one match-3 level
} as const;

/** Texture keys generated in BootScene. Sizes in pixels. Board pieces, cells, stones and weeds are 128x128 (Canvas 2D,
 *  shaded 3D); size images with setDisplaySize, never assume a texture size. */
export const TEX = {
  /** 128x128 tile art per kind: `TEX.tile[kind]`. */
  tile: {
    mushroom: 'tile-mushroom', // red toadstool, white dots
    gem: 'tile-gem', // blue faceted gem
    acorn: 'tile-acorn', // brown acorn
    daisy: 'tile-daisy', // yellow sunflower-daisy
    clover: 'tile-clover', // green four-leaf clover
    berry: 'tile-berry', // purple berry cluster
  },
  /** 128x128 soft glowing disc tinted per kind, drawn behind special pieces: `TEX.back[kind]`. */
  back: {
    mushroom: 'back-mushroom',
    gem: 'back-gem',
    acorn: 'back-acorn',
    daisy: 'back-daisy',
    clover: 'back-clover',
    berry: 'back-berry',
  },
  mowerH: 'sp-mowerH', // 128x128 lawnmower seen from the side, facing right (clears a row)
  mowerV: 'sp-mowerV', // 128x128 lawnmower seen from above, facing up (clears a column)
  bomb: 'sp-bomb', // 128x128 seed bomb with a lit fuse
  bee: 'sp-bee', // 128x128 bumblebee
  prism: 'sp-prism', // 128x128 rainbow gem (not tied to a kind)
  gnome: 'piece-gnome', // 128x128 lost gnome head with a red hat (drop item)
  cellLight: 'cell-light', // 128x128 board cell, light grass
  cellDark: 'cell-dark', // 128x128 board cell, dark grass
  weeds1: 'weeds-1', // 128x128 weeds overlay, one layer (drawn under the piece)
  weeds2: 'weeds-2', // 128x128 weeds overlay, two layers (thicker)
  stone1: 'stone-1', // 128x128 garden stone, cracked
  stone2: 'stone-2', // 128x128 garden stone, whole
  mower: 'fx-mower', // 96x64 big lawnmower facing right, drives across a row/column
  spark: 'fx-spark', // 8x8 white soft dot, for particles (tint it)
  confetti: 'fx-confetti', // 10x6 white rectangle, for confetti (tint it)
  star: 'fx-star', // 48x48 yellow 5-point star
  starEmpty: 'fx-star-empty', // 48x48 grey star outline
  leaf: 'fx-leaf', // 10x6 green grass clipping
  coin: 'fx-coin', // 32x32 gold coin
  rays: 'fx-rays', // 256x256 white sunburst rays on transparent, behind win text (tint it)
} as const;

export const COLORS = {
  background: 0x2b1d3a, // deep plum
  backgroundCss: '#2b1d3a',
  text: '#fff8e7',
  textDark: '#3b2412',
  accent: '#ffd23f',
  accentNum: 0xffd23f,
  good: 0x5ee06a,
  bad: 0xff5a5a,
  panel: 0x4a2f63,
  panelEdge: 0xffd23f,
  button: 0xff7a1a,
  buttonEdge: 0xffe3a3,
  /** Particle / glow colour of each tile kind. */
  kind: {
    mushroom: 0xff3b3b,
    gem: 0x3fa9ff,
    acorn: 0xc8792b,
    daisy: 0xffd23f,
    clover: 0x4fd65a,
    berry: 0xb44dff,
  },
} as const;

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Gameplay tuning. Change these to change the feel. */
export const TUNING = {
  rows: 8,
  cols: 8,
  scorePerTile: 10, // x (cascade + 1)
  scoreSpecialMade: 50,
  scoreGnomeSaved: 500,
  scoreRushPerMove: 200, // bonus per move left, on top of what the rush clears
  startCoins: 300,
  coinsPerWin: 20,
  coinsPerStar: 10,
  extraMovesCost: 90, // coins for +5 moves when out of moves
  extraMoves: 5,
  boosterCost: 120, // coins per booster in the pre-level popup
  hintAfterMs: 5000, // idle time before a valid swap wiggles
  swapMs: 140,
  clearMs: 160,
  fallMsPerRow: 55,
} as const;

/** Combo callouts by cascade index (0 = the swap's own match). Shown from cascade 1 on. */
export const COMBO_WORDS = ['', 'Gnice!', 'Gnarly!', 'Gnometastic!', 'GNOMENAL!', 'GNOME-POCALYPSE!'] as const;

export type SfxName =
  | 'swap'
  | 'bad' // invalid swap
  | 'match' // use playMatch(cascade) for rising pitch
  | 'special' // a special piece was created
  | 'mower'
  | 'bomb'
  | 'prism'
  | 'bee'
  | 'stone'
  | 'weeds'
  | 'gnome' // a lost gnome was saved
  | 'win'
  | 'lose'
  | 'star'
  | 'coin'
  | 'build' // house item built
  | 'click';

/** this.scene.start(SCENES.level, data) */
export interface LevelSceneData {
  levelId: number; // 1-based, LEVELS[levelId - 1]
  boosters: BoosterKind[];
}

/** this.scene.start(SCENES.house, data). All optional. */
export interface HouseSceneData {
  /** Set when coming back from a won level: shows "+N stars" fly-in. */
  wonLevel?: number;
  starsEarned?: number;
  coinsEarned?: number;
}
