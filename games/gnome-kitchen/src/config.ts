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

export const COLORS = {
  bg: '#f6efe0',
  ink: '#3b2a1a',
  muted: '#6b5843',
  green: '#5ca844',
  greenLight: '#7cc44f',
  off: '#cfc5b0',
  offInk: '#7a6a55',
  gold: '#f1c40f',
  batter: '#f3e3b5',
  honey: '#f1a81e',
} as const;
