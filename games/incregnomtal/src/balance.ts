// Every tunable constant, table, problem row, and skill tree node for Incregnomtal.
// Pure data — no Phaser, no DOM.

export type GrassId =
  | 'bare'
  | 'crabgrass'
  | 'ryegrass'
  | 'fescue'
  | 'bluegrass'
  | 'clover'
  | 'zoysia'
  | 'moss'
  | 'golden';

export type JobId = 'trim' | 'water' | 'weed' | 'compost' | 'dog' | 'bees';

export type CritterId = 'robin' | 'worms' | 'squirrels' | 'biscuit' | 'bees' | 'frog' | 'crows';

export type BiscuitTrickId = 'fetch' | 'stayOff' | 'digHere' | 'fetchPaper' | 'chase' | 'roller';

export type DecorId =
  | 'stepping-stones'
  | 'birdbath'
  | 'compost-bin'
  | 'sprinkler'
  | 'bird-feeder'
  | 'scarecrow'
  | 'flamingo'
  | 'gazing-ball'
  | 'rain-barrel'
  | 'flower-bed'
  | 'sundial'
  | 'gnome-statue';

export type TreeNodeId =
  | 'root'
  // Green Thumb (grass)
  | 'deep-roots'
  | 'seed-sense'
  | 'overseeding'
  | 'golden-blades'
  | 'lawn-stripes'
  // Crew (automation)
  | 'spare-hat'
  | 'whistle'
  | 'foreman'
  | 'tea-break'
  | 'union-cap'
  // Critters
  | 'birdseed'
  | 'worm-whisperer'
  | 'good-boy'
  | 'squirrel-treaty'
  | 'bee-line'
  // Weather Lore
  | 'big-thimble'
  | 'rain-dance'
  | 'barrel-keeper'
  | 'compost-alchemy'
  | 'dry-summer-prep'
  // Play style (Elbow Grease / Long Nap)
  | 'firm-grip'
  | 'combo-keeper'
  | 'long-nap'
  | 'golden-eye'
  | 'late-riser'
  // Capstone
  | 'tame-mower';

export type ProblemId =
  | 'bare-dirt'
  | 'thirst'
  | 'overgrowth'
  | 'dandelions'
  | 'tap-cap'
  | 'crabgrass-stall'
  | 'tired-soil'
  | 'grubs'
  | 'seed-thieves'
  | 'squirrels'
  | 'moles'
  | 'dog-spots'
  | 'dry-summer'
  | 'heat-shade'
  | 'crows'
  | 'old-saturday';

export interface GrassDef {
  id: GrassId;
  name: string;
  growth: number;     // base height %/s multiplier (base rate = 12%/s at 1.0)
  value: number;      // base clippings at 100% trim
  water: number;      // water units/s per tile at 1.0 growth
  loam: number;       // loam units/s per tile (negative = produces loam)
  charmPerTile: number;
  shadeTolerant: boolean;
  heatProof: boolean;
  needsTrim: boolean;
  color: number;
  accentColor: number;
  unlockHint: string;
  tooltip: string;
}

export const GRASS_BASE_GROWTH_PER_SEC = 14; // % height per second at growth=1.0

export const GRASSES: Record<GrassId, GrassDef> = {
  bare: {
    id: 'bare',
    name: 'Bare Dirt',
    growth: 0,
    value: 0,
    water: 0,
    loam: 0,
    charmPerTile: 0,
    shadeTolerant: true,
    heatProof: true,
    needsTrim: false,
    color: 0x6b4e31,
    accentColor: 0x573e25,
    unlockHint: 'Start',
    tooltip: 'Hard-packed Yard dirt. Tap to sow Crabgrass.',
  },
  crabgrass: {
    id: 'crabgrass',
    name: 'Crabgrass',
    growth: 1.0,
    value: 1,
    water: 0.5,
    loam: 0,
    charmPerTile: 0,
    shadeTolerant: false,
    heatProof: false,
    needsTrim: true,
    color: 0x7a9a3b,
    accentColor: 0x62802d,
    unlockHint: 'Start',
    tooltip: 'Seeds weeds itself. Almost worthless, but it is green.',
  },
  ryegrass: {
    id: 'ryegrass',
    name: 'Ryegrass',
    growth: 1.2,
    value: 3,
    water: 1.5,
    loam: 0.5,
    charmPerTile: 0.1,
    shadeTolerant: false,
    heatProof: false,
    needsTrim: true,
    color: 0x4ca64c,
    accentColor: 0x3b8c3b,
    unlockHint: 'Fill the starting lawn in Week 1',
    tooltip: 'Fast and bright, but thirsty and eats a little Loam.',
  },
  fescue: {
    id: 'fescue',
    name: 'Fescue',
    growth: 0.9,
    value: 7,
    water: 1.0,
    loam: 0.5,
    charmPerTile: 0.25,
    shadeTolerant: true,
    heatProof: false,
    needsTrim: true,
    color: 0x368c4d,
    accentColor: 0x29723d,
    unlockHint: '25 trims in a single week',
    tooltip: 'Tolerates shade. "Some gnomes say a whole kingdom lives in a patch of this."',
  },
  bluegrass: {
    id: 'bluegrass',
    name: 'Bluegrass',
    growth: 1.0,
    value: 18,
    water: 2.0,
    loam: 2.0,
    charmPerTile: 0.4,
    shadeTolerant: false,
    heatProof: false,
    needsTrim: true,
    color: 0x2d8a7b,
    accentColor: 0x226e62,
    unlockHint: 'First squirrel trade (Week 2-3)',
    tooltip: 'Rich and prized. Grubs love it almost as much as the Tall Ones do.',
  },
  clover: {
    id: 'clover',
    name: 'Clover',
    growth: 0.95,
    value: 10,
    water: 0.5,
    loam: -1.0,
    charmPerTile: 0.6,
    shadeTolerant: true,
    heatProof: true,
    needsTrim: true,
    color: 0x52b765,
    accentColor: 0xeaf5d0,
    unlockHint: 'Survive your first dog spot (Week 3-4)',
    tooltip: 'Makes Loam instead of eating it. Dog spots do not harm it. Flowers feed bees.',
  },
  zoysia: {
    id: 'zoysia',
    name: 'Zoysia',
    growth: 0.75,
    value: 48,
    water: 0.3,
    loam: 1.0,
    charmPerTile: 0.8,
    shadeTolerant: false,
    heatProof: true,
    needsTrim: true,
    color: 0x62b838,
    accentColor: 0x4c9928,
    unlockHint: 'Reach the Dry Summer (Week 4)',
    tooltip: 'Drinks almost nothing and laughs at midday heat. Hates deep shade.',
  },
  moss: {
    id: 'moss',
    name: 'Moss',
    growth: 0.4,
    value: 30,
    water: 0.8,
    loam: 0,
    charmPerTile: 1.8,
    shadeTolerant: true,
    heatProof: false,
    needsTrim: false,
    color: 0x2f6b47,
    accentColor: 0x468a5e,
    unlockHint: 'Have a shaded tile under an oak (Week 4-5)',
    tooltip: 'Shade only. Pays in Charm and never needs trimming.',
  },
  golden: {
    id: 'golden',
    name: 'Golden Grass',
    growth: 1.1,
    value: 200,
    water: 0.5,
    loam: 0.5,
    charmPerTile: 3.0,
    shadeTolerant: true,
    heatProof: true,
    needsTrim: true,
    color: 0xe6be3c,
    accentColor: 0xfff08a,
    unlockHint: 'Tame Old Saturday',
    tooltip: 'Yard of the Year blend. Shimmers in any weather.',
  },
};

export const GRASS_ORDER: GrassId[] = [
  'crabgrass',
  'ryegrass',
  'fescue',
  'bluegrass',
  'clover',
  'zoysia',
  'moss',
  'golden',
];

export interface PlotTier {
  level: number;
  cols: number;
  rows: number;
  acornCost: number;
  label: string;
}

export const PLOT_TIERS: PlotTier[] = [
  { level: 0, cols: 4, rows: 4, acornCost: 0, label: '4×4 Patch (16 tiles)' },
  { level: 1, cols: 6, rows: 6, acornCost: 8, label: '6×6 Yard (36 tiles)' },
  { level: 2, cols: 6, rows: 9, acornCost: 30, label: '6×9 Lawn (54 tiles)' },
  { level: 3, cols: 8, rows: 10, acornCost: 110, label: '8×10 Estate (80 tiles)' },
];

export const MAX_GRID_COLS = 8;
export const MAX_GRID_ROWS = 10;

export interface ToolDef {
  id: 'trimTool' | 'waterTool' | 'weedTool';
  name: string;
  tiers: { name: string; cost: number; mult: number; flowCap?: number }[];
}

export const TOOLS: Record<'trimTool' | 'waterTool' | 'weedTool', ToolDef> = {
  trimTool: {
    id: 'trimTool',
    name: 'Trimming Gear',
    tiers: [
      { name: 'Rusty Snips', cost: 0, mult: 1 },
      { name: 'Hedge Shears', cost: 75, mult: 1.8 },
      { name: 'Brass Clippers', cost: 1100, mult: 3.4 },
      { name: 'Rotary Edger', cost: 15000, mult: 6.5 },
      { name: 'Reel Scythe', cost: 200000, mult: 13.0 },
      { name: 'Turbo Trimmer', cost: 3000000, mult: 26.0 },
      { name: 'Golden Blades Kit', cost: 48000000, mult: 52.0 },
    ],
  },
  waterTool: {
    id: 'waterTool',
    name: 'Watering Gear',
    tiers: [
      { name: 'Tin Thimble', cost: 0, mult: 1, flowCap: 16 },
      { name: 'Pail & Bucket', cost: 80, mult: 2.2, flowCap: 32 },
      { name: 'Garden Hose', cost: 900, mult: 5.0, flowCap: 55 },
      { name: 'Brass Sprinkler', cost: 11000, mult: 11.0, flowCap: 90 },
      { name: 'Copper Drip Line', cost: 150000, mult: 24.0, flowCap: 140 },
      { name: 'Dew Condenser', cost: 2200000, mult: 55.0, flowCap: 220 },
    ],
  },
  weedTool: {
    id: 'weedTool',
    name: 'Soil & Weed Gear',
    tiers: [
      { name: 'Bare Fingers', cost: 0, mult: 1 },
      { name: 'Old Trowel', cost: 150, mult: 2.2 },
      { name: 'Hand Rake', cost: 2000, mult: 5.0 },
      { name: 'Root Fork', cost: 26000, mult: 12.0 },
      { name: 'Loam Aerator', cost: 360000, mult: 28.0 },
      { name: 'Master Dibber', cost: 5500000, mult: 68.0 },
    ],
  },
};

export interface DecorDef {
  id: DecorId;
  name: string;
  currency: 'clippings' | 'acorns' | 'loam';
  baseCost: number;
  charm: number;
  icon: string;
  color: number;
  desc: string;
  minWeek: number;
}

export const DECORS: Record<DecorId, DecorDef> = {
  'stepping-stones': {
    id: 'stepping-stones',
    name: 'Stepping Stones',
    currency: 'clippings',
    baseCost: 220,
    charm: 2,
    icon: '🪨',
    color: 0x9aa0a6,
    desc: 'Gnomes move 12% faster across the lawn.',
    minWeek: 1,
  },
  'compost-bin': {
    id: 'compost-bin',
    name: 'Compost Bin',
    currency: 'clippings',
    baseCost: 450,
    charm: 0,
    icon: '🪵',
    color: 0x6e4a2b,
    desc: 'Converts Clippings into Loam. Draws helpful earthworms.',
    minWeek: 1,
  },
  sprinkler: {
    id: 'sprinkler',
    name: 'Sprinkler',
    currency: 'clippings',
    baseCost: 750,
    charm: 1,
    icon: '💦',
    color: 0x4ba3d9,
    desc: '+22 Water flow cap and waters nearby tiles.',
    minWeek: 1,
  },
  birdbath: {
    id: 'birdbath',
    name: 'Birdbath',
    currency: 'acorns',
    baseCost: 4,
    charm: 4,
    icon: '🛁',
    color: 0xcbd3d9,
    desc: 'Invites the Robin, who eats grubs.',
    minWeek: 2,
  },
  'bird-feeder': {
    id: 'bird-feeder',
    name: 'Bird Feeder',
    currency: 'acorns',
    baseCost: 5,
    charm: 3,
    icon: '🏠',
    color: 0xc98842,
    desc: 'Keeps the Robin off your fresh seed. Attracts Squirrels.',
    minWeek: 2,
  },
  scarecrow: {
    id: 'scarecrow',
    name: 'Scarecrow',
    currency: 'clippings',
    baseCost: 1600,
    charm: -1,
    icon: '🌾',
    color: 0xb8964e,
    desc: 'Stops seed thieves & crows, but scares the Robin too (-1 Charm).',
    minWeek: 2,
  },
  'rain-barrel': {
    id: 'rain-barrel',
    name: 'Rain Barrel',
    currency: 'clippings',
    baseCost: 12000,
    charm: 2,
    icon: '🛢️',
    color: 0x4f7894,
    desc: 'Stores +120 Water from rain events for Dry Summer.',
    minWeek: 3,
  },
  flamingo: {
    id: 'flamingo',
    name: 'Pink Flamingo',
    currency: 'acorns',
    baseCost: 7,
    charm: 7,
    icon: '🦩',
    color: 0xff6fa8,
    desc: '+7 Charm. Crows admire it a little too much.',
    minWeek: 3,
  },
  'flower-bed': {
    id: 'flower-bed',
    name: 'Flower Bed',
    currency: 'loam',
    baseCost: 45,
    charm: 6,
    icon: '🌷',
    color: 0xe66a9e,
    desc: 'Turns surplus Loam into +6 Charm.',
    minWeek: 3,
  },
  sundial: {
    id: 'sundial',
    name: 'Sundial',
    currency: 'acorns',
    baseCost: 8,
    charm: 5,
    icon: '🕰️',
    color: 0xd9c27e,
    desc: 'Shows exact Yard time. Tap it 7 times for a secret.',
    minWeek: 3,
  },
  'gazing-ball': {
    id: 'gazing-ball',
    name: 'Gazing Ball',
    currency: 'acorns',
    baseCost: 14,
    charm: 12,
    icon: '🔮',
    color: 0x6ec9f5,
    desc: '+12 Charm. Crows really want this one.',
    minWeek: 4,
  },
  'gnome-statue': {
    id: 'gnome-statue',
    name: 'Statue of a Gnome',
    currency: 'acorns',
    baseCost: 40,
    charm: 25,
    icon: '🗿',
    color: 0xd4d0c5,
    desc: 'It has no hat. The crew will not discuss it.',
    minWeek: 5,
  },
};

export const DECOR_ORDER: DecorId[] = [
  'stepping-stones',
  'compost-bin',
  'sprinkler',
  'birdbath',
  'bird-feeder',
  'scarecrow',
  'rain-barrel',
  'flamingo',
  'flower-bed',
  'sundial',
  'gazing-ball',
  'gnome-statue',
];

export interface CritterDef {
  id: CritterId;
  name: string;
  wants: string;
  helps: string;
  sideEffect: string;
  icon: string;
  color: number;
  minWeek: number;
}

export const CRITTERS: Record<CritterId, CritterDef> = {
  robin: {
    id: 'robin',
    name: 'The Robin',
    wants: 'A Birdbath on the lawn',
    helps: 'Eats grubs before they brown the roots',
    sideEffect: 'Pecks freshly sown seed unless distracted by a Feeder',
    icon: '🐦',
    color: 0xd94b34,
    minWeek: 2,
  },
  worms: {
    id: 'worms',
    name: 'Earthworms',
    wants: 'A Compost Bin & damp soil',
    helps: '+Loam generation and +15% grass growth',
    sideEffect: 'Draw moles in Week 3',
    icon: '🪱',
    color: 0xc97b73,
    minWeek: 2,
  },
  squirrels: {
    id: 'squirrels',
    name: 'Squirrels',
    wants: 'Trade 3 Acorns (with a Bird Feeder)',
    helps: 'Plant oak saplings and return Acorns at ×1.5 profit',
    sideEffect: 'Oak saplings grow and cast shade',
    icon: '🐿️',
    color: 0xa66332,
    minWeek: 2,
  },
  biscuit: {
    id: 'biscuit',
    name: 'Biscuit (the Great Dog)',
    wants: 'Play Fetch 5 times (or assign a Dog-handler)',
    helps: 'Digs out moles; learns 6 tricks including the Lawn Roller',
    sideEffect: 'Leaves dog spots until taught "Stay off"',
    icon: '🐕',
    color: 0xd9a15b,
    minWeek: 3,
  },
  bees: {
    id: 'bees',
    name: 'Garden Bees',
    wants: 'Clover growing on the lawn',
    helps: 'Pollinate for +Charm and double golden tile chance',
    sideEffect: 'None. Bees are just good.',
    icon: '🐝',
    color: 0xf2c830,
    minWeek: 3,
  },
  frog: {
    id: 'frog',
    name: 'Puddle Frog',
    wants: 'Leave a puddle on the lawn & tap to befriend',
    helps: 'Eats night gnats for +12% growth',
    sideEffect: 'Keeps his favorite puddle tile wet',
    icon: '🐸',
    color: 0x4ca65a,
    minWeek: 4,
  },
  crows: {
    id: 'crows',
    name: 'The Crows',
    wants: '10 Bottle Caps (or 6 Acorns) to befriend',
    helps: 'Stop stealing decor and bring shiny trinkets (+Acorns, +Charm)',
    sideEffect: 'Steal shiny decor until befriended or chased',
    icon: '🐦‍⬛',
    color: 0x2b2e38,
    minWeek: 5,
  },
};

export const CRITTER_ORDER: CritterId[] = [
  'robin',
  'worms',
  'squirrels',
  'biscuit',
  'bees',
  'frog',
  'crows',
];

export interface BiscuitTrickDef {
  id: BiscuitTrickId;
  name: string;
  fetchNeeded: number;
  desc: string;
}

export const BISCUIT_TRICKS: BiscuitTrickDef[] = [
  { id: 'fetch', name: 'Fetch', fetchNeeded: 5, desc: 'Befriends Biscuit. He digs out moles on his own.' },
  { id: 'stayOff', name: 'Stay Off', fetchNeeded: 10, desc: 'Stops Biscuit from leaving dog spots.' },
  { id: 'digHere', name: 'Dig Here', fetchNeeded: 16, desc: 'Digs irrigation trenches (+30% water efficiency).' },
  { id: 'fetchPaper', name: 'Fetch the Paper', fetchNeeded: 22, desc: 'Brings the Yard newspaper & +1 Acorn each morning.' },
  { id: 'chase', name: 'Chase', fetchNeeded: 28, desc: 'Chases crows away from shiny decor.' },
  { id: 'roller', name: 'Pull the Roller', fetchNeeded: 36, desc: 'Rolls the lawn flat (+45% growth & +10 Charm).' },
];

export interface TreeNodeDef {
  id: TreeNodeId;
  name: string;
  branch: 'root' | 'grass' | 'crew' | 'critters' | 'weather' | 'style' | 'capstone';
  tier: number;
  cost: number;
  requires: TreeNodeId[];
  exclusiveWith?: TreeNodeId;
  desc: string;
}

export const TREE_NODES: TreeNodeDef[] = [
  {
    id: 'root',
    name: 'Rake & Trowel',
    branch: 'root',
    tier: 0,
    cost: 1,
    requires: [],
    desc: 'Opens the Mulch skill tree. +15% all Clippings.',
  },
  // Tier 1 (cost 2-3)
  {
    id: 'deep-roots',
    name: 'Deep Roots',
    branch: 'grass',
    tier: 1,
    cost: 2,
    requires: ['root'],
    desc: 'Grass grows +30% faster.',
  },
  {
    id: 'spare-hat',
    name: 'Spare Hat',
    branch: 'crew',
    tier: 1,
    cost: 2,
    requires: ['root'],
    desc: 'Start every week with 2 gnomes already hired.',
  },
  {
    id: 'birdseed',
    name: 'Birdseed in Pocket',
    branch: 'critters',
    tier: 1,
    cost: 2,
    requires: ['root'],
    desc: 'Befriended Robin arrives on Day 1 without rebuilding the birdbath.',
  },
  {
    id: 'big-thimble',
    name: 'Big Thimble',
    branch: 'weather',
    tier: 1,
    cost: 2,
    requires: ['root'],
    desc: 'Water tap and Waterer output ×3.',
  },
  {
    id: 'firm-grip',
    name: 'Firm Grip',
    branch: 'style',
    tier: 1,
    cost: 3,
    requires: ['root'],
    desc: 'Manual taps pay ×2 Clippings.',
  },
  // Tier 2 (cost 5-10)
  {
    id: 'seed-sense',
    name: 'Seed Sense',
    branch: 'grass',
    tier: 2,
    cost: 6,
    requires: ['deep-roots'],
    desc: 'Resowing grass tiles is free and +20% grass value.',
  },
  {
    id: 'whistle',
    name: 'Foreman Whistle',
    branch: 'crew',
    tier: 2,
    cost: 6,
    requires: ['spare-hat'],
    desc: 'All gnome jobs work +35% faster.',
  },
  {
    id: 'worm-whisperer',
    name: 'Worm Whisperer',
    branch: 'critters',
    tier: 2,
    cost: 7,
    requires: ['birdseed'],
    desc: 'Earthworms give ×2 Loam and +15% growth.',
  },
  {
    id: 'rain-dance',
    name: 'Rain Dance',
    branch: 'weather',
    tier: 2,
    cost: 7,
    requires: ['big-thimble'],
    desc: 'Active ability: call a 20 s rain shower (+full water & +30% growth).',
  },
  {
    id: 'combo-keeper',
    name: 'Combo Keeper',
    branch: 'style',
    tier: 2,
    cost: 8,
    requires: ['firm-grip'],
    exclusiveWith: 'long-nap',
    desc: 'Tap combo lasts 3 s and caps at +150%.',
  },
  {
    id: 'long-nap',
    name: 'Long Nap',
    branch: 'style',
    tier: 2,
    cost: 8,
    requires: ['firm-grip'],
    exclusiveWith: 'combo-keeper',
    desc: 'Offline catch-up 50% → 100%, and +25% idle gnome output.',
  },
  // Tier 3 (cost 15-35)
  {
    id: 'overseeding',
    name: 'Overseeding',
    branch: 'grass',
    tier: 3,
    cost: 18,
    requires: ['seed-sense'],
    desc: 'Tiles start each week at 50% height with your best grass.',
  },
  {
    id: 'foreman',
    name: 'Auto-Foreman',
    branch: 'crew',
    tier: 3,
    cost: 18,
    requires: ['whistle'],
    desc: 'Auto-hires gnomes and balances jobs to match bottlenecks.',
  },
  {
    id: 'good-boy',
    name: 'Good Boy',
    branch: 'critters',
    tier: 3,
    cost: 22,
    requires: ['worm-whisperer'],
    desc: 'Biscuit keeps all learned tricks across Mowing Days.',
  },
  {
    id: 'barrel-keeper',
    name: 'Barrel Keeper',
    branch: 'weather',
    tier: 3,
    cost: 20,
    requires: ['rain-dance'],
    desc: 'Rain barrels keep half their water across Mowing Days, +25% water cap.',
  },
  {
    id: 'golden-eye',
    name: 'Golden Eye',
    branch: 'style',
    tier: 3,
    cost: 24,
    requires: ['combo-keeper'],
    exclusiveWith: 'late-riser',
    desc: 'Golden acorns appear ×2 as often and pay ×2.',
  },
  {
    id: 'late-riser',
    name: 'Late Riser',
    branch: 'style',
    tier: 3,
    cost: 24,
    requires: ['long-nap'],
    exclusiveWith: 'golden-eye',
    desc: 'Each week is 1 day longer (+15% time to earn Mulch).',
  },
  // Tier 4 (cost 60-90)
  {
    id: 'golden-blades',
    name: 'Golden Blades',
    branch: 'grass',
    tier: 4,
    cost: 65,
    requires: ['overseeding'],
    desc: '5% of trims are Golden (×10 Clippings).',
  },
  {
    id: 'tea-break',
    name: 'Night Shift Tea',
    branch: 'crew',
    tier: 4,
    cost: 65,
    requires: ['foreman'],
    desc: 'Gnomes work at full speed day & night (+60% crew output).',
  },
  {
    id: 'squirrel-treaty',
    name: 'Squirrel Treaty',
    branch: 'critters',
    tier: 4,
    cost: 75,
    requires: ['good-boy'],
    desc: 'Squirrel trades pay ×2 acorns and +35% all Clippings.',
  },
  {
    id: 'compost-alchemy',
    name: 'Compost Alchemy',
    branch: 'weather',
    tier: 4,
    cost: 70,
    requires: ['barrel-keeper'],
    desc: 'Compost bin converts at 2:1 instead of 10:1, +40% growth.',
  },
  // Tier 5 (cost 200-300)
  {
    id: 'lawn-stripes',
    name: 'Lawn Stripes',
    branch: 'grass',
    tier: 5,
    cost: 210,
    requires: ['golden-blades'],
    desc: 'Charm multiplier ×2 and striped lawn sheen.',
  },
  {
    id: 'union-cap',
    name: 'Union of the Cap',
    branch: 'crew',
    tier: 5,
    cost: 220,
    requires: ['tea-break'],
    desc: '+4% all Clippings per hired gnome.',
  },
  {
    id: 'bee-line',
    name: 'Bee Line',
    branch: 'critters',
    tier: 5,
    cost: 240,
    requires: ['squirrel-treaty'],
    desc: 'Bees double Charm bonus and golden tiles appear ×3 as often.',
  },
  {
    id: 'dry-summer-prep',
    name: 'Dry Summer Prep',
    branch: 'weather',
    tier: 5,
    cost: 230,
    requires: ['compost-alchemy'],
    desc: 'Dry Summer flow 25% → 70% and +50% all Clippings.',
  },
  // Capstone (cost 500, requires any two tier-4 nodes)
  {
    id: 'tame-mower',
    name: 'Tame the Mower',
    branch: 'capstone',
    tier: 6,
    cost: 500,
    requires: [], // checked specially: any 2 tier-4 nodes
    desc: 'Requires any two Tier-4 nodes. Ride Old Saturday on the next Mowing Day to win Yard of the Year!',
  },
];

export const TREE_BY_ID: Record<TreeNodeId, TreeNodeDef> = Object.fromEntries(
  TREE_NODES.map((n) => [n.id, n]),
) as Record<TreeNodeId, TreeNodeDef>;

export const TIER_4_NODES: TreeNodeId[] = [
  'golden-blades',
  'tea-break',
  'squirrel-treaty',
  'compost-alchemy',
];

export interface ProblemRow {
  id: ProblemId;
  week: number;
  name: string;
  tell: string;
  fixHint: string;
  maxPenalty: number; // never > 0.40
}

export const PROBLEMS: ProblemRow[] = [
  {
    id: 'bare-dirt',
    week: 1,
    name: 'Bare Dirt',
    tell: 'Foreman Teacup: "Nothing grows on wishful thinking. Tap a dirt tile to sow Crabgrass."',
    fixHint: 'Tap bare tiles to sow Crabgrass.',
    maxPenalty: 0,
  },
  {
    id: 'thirst',
    week: 1,
    name: 'Thirst',
    tell: 'Foreman Teacup: "Tiles are yellowing already. Tap the Thimble, or put a gnome on Water."',
    fixHint: 'Tap Water Thimble or assign a Waterer gnome.',
    maxPenalty: 0.35,
  },
  {
    id: 'overgrowth',
    week: 1,
    name: 'Overgrowth',
    tell: 'Foreman Teacup: "Grass hit 100% and went to seed. Trim it before it starts weeds."',
    fixHint: 'Tap tall tiles or assign a Trimmer gnome.',
    maxPenalty: 0.25,
  },
  {
    id: 'dandelions',
    week: 1,
    name: 'Dandelions',
    tell: 'Foreman Teacup: "Dandelions in the corners. Pull them — least the puffs make Wishes."',
    fixHint: 'Tap dandelion tiles or assign a Weeder gnome.',
    maxPenalty: 0.3,
  },
  {
    id: 'tap-cap',
    week: 1,
    name: 'Tap Flow Cap',
    tell: 'Foreman Teacup: "The Tall Ones\' tap only turns so far. Buy the Hose — watch for puddles."',
    fixHint: 'Upgrade Watering Gear or place a Sprinkler; tap puddles to drain.',
    maxPenalty: 0.3,
  },
  {
    id: 'crabgrass-stall',
    week: 1,
    name: 'Worthless Crabgrass',
    tell: 'Foreman Teacup: "Crabgrass pays in lint. Sow Ryegrass or Fescue if you want real Clippings."',
    fixHint: 'Select Ryegrass or Fescue in the Lawn tab and resow.',
    maxPenalty: 0,
  },
  {
    id: 'tired-soil',
    week: 2,
    name: 'Tired Soil',
    tell: 'Foreman Teacup: "Good grass eats Loam. Build a Compost Bin and put a gnome on Compost."',
    fixHint: 'Place a Compost Bin and assign a Composter gnome.',
    maxPenalty: 0.35,
  },
  {
    id: 'grubs',
    week: 2,
    name: 'Grubs',
    tell: 'Foreman Teacup: "Grubs in the roots. Lovely. Put out a Birdbath — a Robin will sort them."',
    fixHint: 'Tap grub rings or place a Birdbath to invite the Robin.',
    maxPenalty: 0.35,
  },
  {
    id: 'seed-thieves',
    week: 2,
    name: 'Seed Thieves',
    tell: 'Foreman Teacup: "The Robin ate half our fresh seed. Build a Bird Feeder — or a Scarecrow."',
    fixHint: 'Place a Bird Feeder (keeps Robin busy) or Scarecrow.',
    maxPenalty: 0.25,
  },
  {
    id: 'squirrels',
    week: 3,
    name: 'Squirrel Raid',
    tell: 'Foreman Teacup: "Squirrels found the feeder. Trade them Acorns in Critters; they plant oaks."',
    fixHint: 'Trade Acorns with Squirrels in the Critters tab.',
    maxPenalty: 0.2,
  },
  {
    id: 'moles',
    week: 3,
    name: 'Mole Hills',
    tell: 'Foreman Teacup: "Worms brought moles. Toss the ball for Biscuit — he loves digging them out."',
    fixHint: 'Tap mole hills or befriend Biscuit (Play Fetch).',
    maxPenalty: 0.35,
  },
  {
    id: 'dog-spots',
    week: 3,
    name: 'Dog Spots',
    tell: 'Foreman Teacup: "Biscuit is a good boy. He is not careful. Teach him Stay Off, or plant Clover."',
    fixHint: 'Teach Biscuit "Stay Off" or sow Clover.',
    maxPenalty: 0.3,
  },
  {
    id: 'dry-summer',
    week: 4,
    name: 'Dry Summer',
    tell: 'Foreman Teacup: "Dry Summer hit. The tap is a trickle. Switch to Zoysia, Clover, and Rain Barrels."',
    fixHint: 'Sow Zoysia & Clover, place Rain Barrels, or use Rain Dance.',
    maxPenalty: 0.38,
  },
  {
    id: 'heat-shade',
    week: 5,
    name: 'Heat & Shade',
    tell: 'Foreman Teacup: "Midday sun scorches open tiles; oaks shade the rest. Plant Moss in the shade."',
    fixHint: 'Plant Moss in shaded tiles and Zoysia/Clover in sun.',
    maxPenalty: 0.32,
  },
  {
    id: 'crows',
    week: 5,
    name: 'Shiny-Hungry Crows',
    tell: 'Foreman Teacup: "Crows are eyeing the flamingo. Befriend them with acorns, or teach Biscuit Chase."',
    fixHint: 'Tap crows, befriend them in Critters, or teach Biscuit Chase.',
    maxPenalty: 0.28,
  },
  {
    id: 'old-saturday',
    week: 6,
    name: 'Old Saturday',
    tell: 'Foreman Teacup: "One problem left: Old Saturday. Buy Tame the Mower in the Tree and ring the bell."',
    fixHint: 'Unlock Tame the Mower (500 Mulch + two Tier-4 nodes) and start Mowing Day!',
    maxPenalty: 0,
  },
];

// Week durations in seconds (in-game week = 7 days, or 8 with Late Riser)
export const WEEK_LENGTHS_SEC = [
  720, // Week 1 (12 min)
  600, // Week 2 (10 min)
  540, // Week 3 (9 min)
  540, // Week 4 (9 min)
  480, // Week 5 (8 min)
  480, // Week 6 (8 min)
];

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Gnomeday'];

export const SIGN_TITLES: { minCharm: number; title: string }[] = [
  { minCharm: 0, title: 'The Bare Patch' },
  { minCharm: 6, title: 'The Patch' },
  { minCharm: 18, title: 'The Lawn' },
  { minCharm: 45, title: 'The Good Lawn' },
  { minCharm: 95, title: 'Pride of the Fence' },
];

export const NEWSPAPER_HEADLINES = [
  'The Yard Post: "Grand Zero-Turn still unbeaten at Lawn Prix."',
  'The Yard Post: "Combine sighted near the Front. Red Caps deny involvement."',
  'The Yard Post: "Local gnome wins Gnomylpics Mower Toss by four blades."',
  'The Yard Post: "Castaway seen waving from a lawn at sea off Island Links."',
  'The Yard Post: "Bowling alley reports record 7-10 splits; house ball blamed."',
  'The Yard Post: "Tall Ones leave pet-door unlocked again; Biscuit declines comment."',
];

export const MAX_TAPS_PER_SEC = 8;
export const MAX_PROBLEM_PENALTY = 0.4; // hard cap: never take more than 40% of income
export const MULCH_DIVISOR = 1000;
export const LIFETIME_MULCH_BONUS_PER_POINT = 0.02; // +2% per lifetime Mulch

export function weekLengthSec(week: number, hasLateRiser: boolean): number {
  const idx = Math.min(Math.max(week - 1, 0), WEEK_LENGTHS_SEC.length - 1);
  const base = WEEK_LENGTHS_SEC[idx];
  return hasLateRiser ? Math.round(base * (8 / 7)) : base;
}

export function gnomeHireCost(currentGnomes: number): { clippings: number; acorns: number } {
  const clippings = Math.round(10 * Math.pow(1.18, currentGnomes));
  return { clippings, acorns: 1 };
}

export function decorCost(id: DecorId, ownedCount: number): number {
  const d = DECORS[id];
  return Math.round(d.baseCost * Math.pow(1.5, ownedCount));
}

export function resowCost(grass: GrassId, free: boolean): number {
  if (free || grass === 'crabgrass' || grass === 'bare') return 0;
  return Math.round(5 * GRASSES[grass].value);
}

export function jobMilestoneMult(count: number): number {
  let m = 1;
  if (count >= 5) m *= 2;
  if (count >= 10) m *= 2;
  if (count >= 20) m *= 2;
  return m;
}

export function mulchForWeek(clippingsThisWeek: number): number {
  if (clippingsThisWeek < MULCH_DIVISOR) return 0;
  return Math.floor(Math.sqrt(clippingsThisWeek / MULCH_DIVISOR));
}

export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 1000) return sign + (abs < 10 && abs !== Math.floor(abs) ? abs.toFixed(1) : Math.floor(abs).toString());
  if (abs < 1e6) return sign + (abs / 1e3).toFixed(abs < 1e4 ? 2 : 1) + 'K';
  if (abs < 1e9) return sign + (abs / 1e6).toFixed(abs < 1e7 ? 2 : 1) + 'M';
  if (abs < 1e12) return sign + (abs / 1e9).toFixed(abs < 1e10 ? 2 : 1) + 'B';
  return sign + (abs / 1e12).toFixed(2) + 'T';
}
