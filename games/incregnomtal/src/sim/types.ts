import type {
  BiscuitTrickId,
  CritterId,
  DecorId,
  GrassId,
  JobId,
  ProblemId,
  TreeNodeId,
} from '../balance.ts';

export interface TileState {
  index: number;
  col: number;
  row: number;
  unlocked: boolean;
  grass: GrassId;
  height: number; // 0..100
  overgrownSec: number;
  weed: boolean; // dandelion
  puddle: boolean;
  grub: boolean;
  mole: boolean;
  dogSpot: boolean;
  shaded: boolean;
  scorched: boolean;
  golden: boolean;
  trench: boolean;
  decor: DecorId | null;
  oakSapling: boolean;
  bootPrint: boolean;
}

export interface WishBuff {
  kind: 'growth' | 'tap' | 'water' | 'biscuit' | 'golden';
  label: string;
  remainingSec: number;
}

export interface GoldenAcornDrop {
  id: number;
  col: number;
  row: number;
  remainingSec: number;
}

export interface LawnEasterEgg {
  kind: 'stray-acorn' | 'golf-ball' | 'bottle' | 'hatless-gnome';
  col: number;
  row: number;
  remainingSec: number;
}

export interface MowerRideState {
  active: boolean;
  remainingSec: number;
  durationSec: number;
  x: number; // 0..cols
  y: number; // 0..rows
  angle: number;
  mowedTiles: number[]; // tile indices mowed during ride
  hatPatternScore: number;
  finished: boolean;
}

export interface GameState {
  version: number;
  week: number;
  weekElapsedSec: number;
  totalElapsedSec: number;
  ended: boolean;
  sandboxMode: boolean;
  secretHatEnding: boolean;

  // Currencies
  clippings: number;
  clippingsThisWeek: number;
  lifetimeClippings: number;
  water: number;
  waterCap: number;
  loam: number;
  loamCap: number;
  acorns: number;
  wishes: number;
  mulch: number;
  lifetimeMulch: number;

  // Lawn
  plotLevel: number;
  selectedGrass: GrassId;
  placingDecor: DecorId | null;
  tiles: TileState[];

  // Crew & tools
  gnomes: number;
  jobs: Record<JobId, number>;
  trimTool: number;
  waterTool: number;
  weedTool: number;
  compostShare: number; // 0..0.5 of clippings/s fed to compost bin

  // Permanent discoveries
  unlockedGrasses: GrassId[];
  befriendedCritters: CritterId[];
  biscuitFetches: number;
  biscuitTricks: BiscuitTrickId[];
  biscuitPets: number;
  chippedGnomes: number;

  // Skill tree
  treeNodes: TreeNodeId[];
  canRespec: boolean;

  // Active state & timers
  trimsThisWeek: number;
  totalTrims: number;
  dandelionsPulled: number;
  squirrelTrades: number;
  mowingDays: number;
  tapCombo: number;
  tapComboDecaySec: number;
  tapsThisSecond: number;
  tapWindowSec: number;
  rainSec: number;
  rainCooldownSec: number;
  drySummerActive: boolean;
  combineBannerSec: number;
  gnomedayActive: boolean;
  sundialTaps: number;
  dayIndex: number;

  // Problems
  seenProblems: ProblemId[];
  activeProblems: ProblemId[];
  problemGraceSec: Partial<Record<ProblemId, number>>;

  // Interactive lawn spawns
  buffs: WishBuff[];
  goldenAcorn: GoldenAcornDrop | null;
  easterEgg: LawnEasterEgg | null;
  acornDripSec: number;
  goldenSpawnSec: number;
  easterSpawnSec: number;
  nextSpawnId: number;

  // Ticker / log
  teacupLine: string;
  recentLines: string[];

  // Ending ride
  mowerRide: MowerRideState;

  // Save metadata
  lastSavedAt: number;
}

export interface ComputedStats {
  charm: number;
  charmMult: number;
  waterSupply: number;
  waterDemand: number;
  waterFactor: number;
  loamSupply: number;
  loamDemand: number;
  loamFactor: number;
  problemPenalty: number; // 0..0.4
  autoIncomePerSec: number;
  tapValue: number;
  signTitle: string;
  mulchPreview: number;
  lifetimeMulchMult: number;
  isNight: boolean;
  bellReady: boolean;
}

export type GameAction =
  | { type: 'tap-tile'; index: number }
  | { type: 'tap-thimble' }
  | { type: 'hire-gnome' }
  | { type: 'assign-job'; job: JobId; delta: 1 | -1 }
  | { type: 'upgrade-tool'; tool: 'trimTool' | 'waterTool' | 'weedTool' }
  | { type: 'select-grass'; grass: GrassId }
  | { type: 'sow-all'; grass: GrassId }
  | { type: 'expand-plot' }
  | { type: 'set-compost-share'; share: number }
  | { type: 'start-place-decor'; decor: DecorId | null }
  | { type: 'place-decor'; decor: DecorId; index: number }
  | { type: 'blow-wish' }
  | { type: 'rain-dance' }
  | { type: 'tap-golden-acorn' }
  | { type: 'tap-easter-egg' }
  | { type: 'trade-squirrels' }
  | { type: 'play-fetch' }
  | { type: 'pet-biscuit' }
  | { type: 'befriend-frog' }
  | { type: 'befriend-crows' }
  | { type: 'buy-tree-node'; id: TreeNodeId }
  | { type: 'respec-tree' }
  | { type: 'ring-bell' }
  | { type: 'enter-sandbox' };

export interface SimEvent {
  kind:
    | 'trim'
    | 'water'
    | 'weed'
    | 'golden'
    | 'wish'
    | 'problem'
    | 'mowing-day'
    | 'biscuit'
    | 'easter'
    | 'achievement'
    | 'ending';
  tileIndex?: number;
  value?: number;
  text?: string;
  id?: string;
}
