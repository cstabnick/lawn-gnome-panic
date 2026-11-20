// Tuning and colours for Gnome Kitchen. Change these numbers to change how the cake feels.

export const TUNING = {
  /** Flour scoops for the bowl. Three is perfect, four is a bit much, five is a dusting. */
  scoops: 3,
  /** Full turns of the spoon round the bowl. */
  stirTurns: 2,
  /** Stirring in this many seconds (or less) earns 3 stars; up to stirOkSeconds earns 2. */
  stirFastSeconds: 12,
  stirOkSeconds: 20,
  /** The oven takes the tin out by itself at this many seconds. */
  bakeFullSeconds: 10,
  /** Bake bar: before rawBefore is raw, goldenFrom to goldenTo is golden, after burntAfter is burnt. */
  rawBefore: 6.5,
  goldenFrom: 7,
  goldenTo: 8.5,
  burntAfter: 9.5,
  /** Share of the cake top covered with frosting to enable Next, and the line for 2 stars. */
  frostNeeded: 0.9,
  frostGood: 0.95,
  /** The frosting grid over the cake top. */
  frostCols: 8,
  frostRows: 6,
} as const;

export const TOTAL_STARS = 15;

/** Hex strings, for CSS and text. Use N() for Phaser Graphics colours. */
export const COLORS = {
  bg: '#fff1d6',
  dot: '#ffd6a0',
  ink: '#3b2a1a',
  muted: '#6b5843',
  yellow: '#ffd166',
  pink: '#ff6b9a',
  red: '#ff6b6b',
  mint: '#06d6a0',
  mintSoft: '#e4faf2',
  sky: '#4cc9f0',
  grape: '#9b5de5',
  green: '#06b58a',
  off: '#d8cbb0',
  offInk: '#8a7a63',
  wood: '#d9a066',
  plate: '#fffdf6',
  batter: '#f3e3b5',
  honey: '#f1a81e',
  gold: '#f1c40f',
  white: '#ffffff',
} as const;

/** Party colours for bursts and confetti. */
export const CONFETTI = [COLORS.red, COLORS.yellow, COLORS.mint, COLORS.sky, COLORS.grape, COLORS.pink] as const;

/** '#rrggbb' to 0xrrggbb, for Phaser Graphics. */
export function N(hex: string): number {
  return parseInt(hex.slice(1), 16);
}
