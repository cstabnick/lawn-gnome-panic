// Every contract of the DayG simulation. Plain JSON-safe data. No DOM, no three.js, no Math.random, no Date.

export type RegionId =
  | 'gate-roof' | 'forecourt' | 'verge-path' | 'bin-corner'
  | 'ivy-rows' | 'leaning-rows' | 'the-sinks' | 'angel-square' | 'masons-corner' | 'child-graves' | 'yew-edge'
  | 'the-tap'
  | 'lower-walk' | 'the-yews' | 'upper-walk'
  | 'the-pile' | 'ornament-lawn' | 'solar-walk' | 'the-birdbath' | 'windchime-hedge'
  | 'the-rings' | 'petalfall' | 'ribbon-halls' | 'foam-fields' | 'the-crown'
  | 'warm-bays' | 'clipping-hills' | 'leaf-bins' | 'wormways'
  | 'parapet' | 'niches-high' | 'niches-low' | 'walkway' | 'garden-of-remembrance' | 'rose-gate'
  | 'the-spire' | 'the-nave' | 'the-vestry' | 'chapel-rise' | 'the-catacombs'
  | 'obelisk-garden' | 'great-crypt' | 'back-stair' | 'crypt-row' | 'new-hill' | 'diggers-rest'
  | 'the-plaques' | 'sprinkler-field' | 'bench-line' | 'the-irrigation' | 'mower-tracks'
  | 'the-reeds' | 'lily-pond' | 'footbridge' | 'the-willow' | 'drain-mouth'
  | 'shed-floor' | 'the-shelves' | 'fuel-store' | 'mower-yard' | 'back-gate';
export type DistrictId =
  | 'lychgate' | 'old-rows' | 'yew-walk' | 'gnome-garden' | 'wreathwood' | 'compost'
  | 'columbarium' | 'bell-chapel' | 'mausoleum-hill' | 'lawn-section' | 'drowned-corner' | 'shed';
export const DISTRICTS: readonly DistrictId[] = ['lychgate', 'old-rows', 'yew-walk', 'gnome-garden', 'wreathwood', 'compost',
  'columbarium', 'bell-chapel', 'mausoleum-hill', 'lawn-section', 'drowned-corner', 'shed'];
export type HavenId = 'waystation' | 'tap' | 'columbarium' | 'infirmary' | 'willow' | 'bath-house' | 'shelves';
export const HAVENS: readonly HavenId[] = ['waystation', 'tap', 'columbarium', 'infirmary', 'willow', 'bath-house', 'shelves'];
export type Trait =
  | 'OPEN' | 'COVER' | 'ECHO' | 'HUSH' | 'DARK' | 'FLOODS' | 'WARM' | 'MOSSY' | 'NEST' | 'PIT' | 'CHOKE'
  | 'HIGH' | 'DEEP' | 'HAVEN' | 'GATE' | 'TOLL' | 'SACRED';
export type LootTier = 0 | 1 | 2 | 3 | 4;
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
export type WeatherKind = 'clear' | 'overcast' | 'drizzle' | 'rain' | 'fog' | 'frost' | 'storm';
export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'overcast', 'drizzle', 'rain', 'fog', 'frost', 'storm'];
export type Resource = 'food' | 'water' | 'medicine' | 'fuel' | 'tools' | 'materials' | 'valuables';
export const RESOURCES: readonly Resource[] = ['food', 'water', 'medicine', 'fuel', 'tools', 'materials', 'valuables'];
export type DeathCause = 'hatless' | 'gnome' | 'hunger' | 'thirst' | 'cold' | 'moss' | 'fall';
export const DEATH_CAUSES: readonly DeathCause[] = ['hatless', 'gnome', 'hunger', 'thirst', 'cold', 'moss', 'fall'];
export type ItemId = string;
export type NpcId = number;
export type GroupId = number;
export type ContainerType = 'vase' | 'bin' | 'grave-goods' | 'crate' | 'sack' | 'chest' | 'camp-cache' | 'body';
export type NpcAction = 'rest' | 'forage' | 'scavenge' | 'eat' | 'drink' | 'travel' | 'hide' | 'trade' | 'flee';
export type TreatMethod = 'salt-wash' | 'spirit' | 'scrape-seal';

/** gm (gnome metres = three.js units). x grows east, z grows south: north is smaller z. */
export interface Rect { x0: number; x1: number; z0: number; z1: number }

export interface RegionDef {
  id: RegionId; name: string; district: DistrictId;
  rect: Rect;                 // footprint; regionAt() takes the FIRST region in REGIONS whose rect holds the point
  floorY: number;             // typical standing height (gate-roof 18, others 0)
  traits: readonly Trait[];
  lootTier: LootTier;
  startHatless: [number, number];  // inclusive range rolled at the start
  startNpcs: [number, number];
  water: 'clean' | 'dirty' | null; // a drinking source in the region
  forage: number;             // forage points (food regrows here)
}
export interface EdgeDef { a: RegionId; b: RegionId; climb: boolean } // climb: crossing needs a route
export interface Neighbour { to: RegionId; cost: number; climb: boolean } // cost: centre distance in gm, x3 if climb
export interface RegionGraph {
  regions: readonly RegionDef[]; edges: readonly EdgeDef[];
  byId: Record<RegionId, RegionDef>; neighbours: Record<RegionId, Neighbour[]>;
}

/** One stack of one item kind. 1 item = 1 unit of its ItemDef.resource for the loot budget. */
export interface ItemStack { def: ItemId; count: number; condition: number; liquid?: { kind: 'clean' | 'dirty'; litres: number } }

export interface ContainerDef {
  id: string; type: ContainerType; region: RegionId; x: number; y: number; z: number;
  guaranteed?: ItemId[];      // placed in it at the start (one item each), counted in the loot budget
}
export interface ContainerState {
  id: string; region: RegionId; type: ContainerType;
  opened: boolean;            // rolled; contents are final from then on
  contents: ItemStack[];      // guaranteed items before opening, everything left after
}

export interface NpcTraits { sociability: number; boldness: number; greed: number; loyalty: number; paranoia: number; industry: number } // 0..1
export interface NpcNeeds { food: number; water: number; warmth: number; calm: number } // 0..100, 100 = fine
export interface Npc {
  id: NpcId; name: string; lookSeed: number;
  region: RegionId; alive: boolean;
  traits: NpcTraits; needs: NpcNeeds;
  carried: Record<Resource, number>;   // units
  acorns: number;
  groupId: GroupId | null;
  plan: { action: NpcAction; target: RegionId | null; since: number };
  infectedAt: number | null;           // tick of moss exposure; null = clean
  zeroFoodTicks: number; zeroWaterTicks: number;
  bornTick: number; diedTick: number | null; cause: DeathCause | null;
}
export interface Group { id: GroupId; name: string; members: NpcId[]; leader: NpcId; region: RegionId; formedTick: number }

export interface Herd { id: number; region: RegionId; size: number; target: RegionId | null; movedTick: number }
export interface HordeState {
  density: Record<RegionId, number>;   // loose Hatless per region (integers)
  herds: Herd[];                       // herd tokens (integers)
  noise: Record<RegionId, number>;     // decays every tick
}

export interface MarketState {
  region: RegionId;
  stock: Record<Resource, number>; acorns: number;
  price: Record<Resource, number>;     // acorns per unit, current
  history: Record<Resource, number[]>; // closing price per world-day
}
export interface WeatherState { kind: WeatherKind; tempC: number; wind: number; windDir: number; since: number }

export interface Ledger {
  npcsStart: number; deaths: Record<DeathCause, number>;
  hatlessStart: number; hatlessRisen: number; hatlessCrumbled: number; hatlessDestroyed: number;
  lootStart: Record<Resource, number>;        // resourceTotals() right after createWorld
  regionLootStart: Record<Resource, number>;  // sum of region stocks right after createWorld
  foraged: Record<Resource, number>;          // inflow
  consumed: Record<Resource, number>;         // outflow (eaten, burnt, used)
  removedByPlayer: Record<Resource, number>;  // outflow (taken into the player's pack)
  acornsStart: number;
  farmed: Record<Resource, number>;           // inflow (crops, snares)
  givenByPlayer: Record<Resource, number>;    // inflow (items a player traded or delivered into the world)
}
export interface ChronicleLine { tick: number; text: string }
export type SimEvent =
  | { kind: 'npc-died'; npc: NpcId; region: RegionId; cause: DeathCause }
  | { kind: 'npc-rose'; npc: NpcId; region: RegionId }
  | { kind: 'npc-infected'; npc: NpcId; region: RegionId }
  | { kind: 'npc-cured'; npc: NpcId; region: RegionId }
  | { kind: 'group-formed'; group: GroupId; region: RegionId; size: number }
  | { kind: 'group-split'; group: GroupId; newGroup: GroupId; region: RegionId }
  | { kind: 'group-dissolved'; group: GroupId; region: RegionId }
  | { kind: 'herd-formed'; herd: number; region: RegionId; size: number }
  | { kind: 'herd-moved'; herd: number; from: RegionId; to: RegionId; size: number }
  | { kind: 'loot-low'; region: RegionId; resource: Resource }
  | { kind: 'price-spike'; resource: Resource; price: number; ratio: number }
  | { kind: 'weather'; weather: WeatherKind }
  | { kind: 'season'; season: Season }
  | { kind: 'faction-formed'; faction: FactionId; region: RegionId }
  | { kind: 'faction-fell'; faction: FactionId; region: RegionId }
  | { kind: 'leader-changed'; faction: FactionId; leader: NpcId }
  | { kind: 'haven-changed'; haven: HavenId; from: FactionId | null; to: FactionId | null }
  | { kind: 'faction-plan'; faction: FactionId; plan: FactionPlan; target: FactionId | null }
  | { kind: 'rank-changed'; player: PlayerKey; faction: FactionId; rank: Rank }
  | { kind: 'player-joined-faction'; player: PlayerKey; faction: FactionId }
  | { kind: 'quest-posted'; quest: QuestId; template: QuestTemplate; region: RegionId }
  | { kind: 'quest-done'; quest: QuestId; player: PlayerKey }
  | { kind: 'quest-failed'; quest: QuestId; player: PlayerKey | null; expired: boolean }
  | { kind: 'rumour'; rumour: number; region: RegionId }
  | { kind: 'piece-broken'; piece: number; region: RegionId }
  | { kind: 'harvest'; bed: number; food: number }
  | { kind: 'mowing-soon'; district: DistrictId }
  | { kind: 'mowing'; district: DistrictId }
  | { kind: 'storylet'; storylet: StoryletId; quest: QuestId | null }
  | { kind: 'bell'; region: RegionId };
export interface DailyRow {
  day: number; alive: number; start: number; hatless: number; hatlessStart: number;
  modes: { alone: number; pack: number; band: number; settlement: number }; // alive NPCs by group size 1, 2-8, 9-25, 26+
  lootLeft: Record<Resource, number>;  // sum of region stocks / ledger.regionLootStart (0..1)
  prices: Record<Resource, number>;
  deaths: Record<DeathCause, number>;  // cumulative
  hordeInSinks: number;                // share of hatlessTotal in NEST or PIT regions (0..1)
  chronicleLines: number;              // cumulative
  // ---- phases 4-8 (filled by recordDaily; optional so older rows stay valid)
  factions?: number; topFactions?: FactionId[]; hhiNorm?: number; topShare?: number; havensUp?: number;
  havenHolders?: Partial<Record<HavenId, FactionId | null>>;
  marketInBand?: boolean; questsOpen?: number; questsDone?: number; templatesOffered?: QuestTemplate[];
  outcomesMeasured?: number; outcomesReached?: number;
  piecesUp?: number; bedsGrowing?: number; farmedFood?: number; mown?: DistrictId | null; stepMs?: number;
}

export interface Tuning {
  clock: { ticksPerDay: number; daysPerSeason: number; startSeason: Season; nightStartHour: number; nightEndHour: number };
  weather: { stayChance: number; weights: Record<Season, Record<WeatherKind, number>>; tempBase: Record<Season, number>; tempWeather: Record<WeatherKind, number>; nightDrop: number };
  npc: {
    foodPerDay: number; waterPerDay: number; warmthPerDayCold: number; mealValue: number; drinkValue: number;
    eatBelow: number; drinkBelow: number; scavengePerTick: number; forageTake: number; carryMax: number;
    hatlessKill: number; nightRisk: number; exposure: Record<NpcAction, number>;
    riskLimitBase: number; riskLimitBoldness: number;
    starveDays: number; thirstDays: number; coldKill: number; fallKill: number; fightChance: number;
    scratchChance: number; cureChance: number; travelBias: number;
    acornsStart: [number, number]; carriedFoodStart: [number, number];
  };
  groups: { a: number; b: number; c: number; d: number; safetyS: number; work: number; roles: number; shareF: number; sigma: number; strainK: number; dunbarBase: number; fissionQ: number; maxSafety: number; decideEvery: number };
  horde: {
    flowRate: number; diffusion: number; noiseDecay: number; scentWeight: number; warmWeight: number; noiseWeight: number;
    nestWeight: number; pitWeight: number; havenRepel: number;
    herdThreshold: number; herdShare: number; herdMoveTicks: number; herdMin: number;
    crumblePerDay: number; capacityPerKm2: number; overCapacityMul: number; pitEscape: number; threatNorm: number;
    riseChance: Record<DeathCause, number>;
  };
  loot: { perGnome: Record<Resource, number>; tierWeight: [number, number, number, number, number]; nestMul: number; havenMul: number; foragePerDay: number; forageCapDays: number };
  market: { region: RegionId; base: Record<Resource, number>; target: Record<Resource, number>; elasticity: Record<Resource, number>; startStock: Record<Resource, number>; acorns: number; drift: number; tax: number; clampLo: number; clampHi: number };
  player: {
    waterPerHour: number; foodPerHour: number; exertionWaterPerHour: number; exertionFoodPerHour: number;
    comfortTemp: number; warmthPerDegreeHour: number; warmthWeatherPerHour: Record<WeatherKind, number>;
    warmthNightPerHour: number; warmthFirePerHour: number; warmthHavenPerHour: number; warmthHighPerHour: number;
    warmthWetPerHour: number; warmthRecoverPerHour: number;
    calmHatlessPerHour: number; calmNightOutsidePerHour: number; calmHavenPerHour: number; calmFirePerHour: number; calmDayPerHour: number;
    lowThreshold: number; zeroWearPerHour: { cold: number; thirst: number; hunger: number }; dirtyWaterCrampChance: number;
  };
  infection: {
    stage0Hours: number; stage1Hours: number; stage2Hours: number; turnHours: number;
    exposeOpenCrack: number; exposeGlazed: number; seasonMul: Record<Season, number>; wetMul: number;
    cure: Record<TreatMethod, [number, number, number, number]>; // success chance by stage 0..3
    missingGlazingPenalty: number; playerGlazing: number;
    stageCalmPerHour: [number, number, number, number]; stageWarmthPerHour: [number, number, number, number];
  };
  base: { pushShare: number; pushCap: number; hpPerPusherMinute: number; noisePerWarmth: number };
  body: {
    partWeights: Record<'head' | 'chest' | 'armL' | 'armR' | 'legL' | 'legR', number>;
    crackPerHit: number; fallChip: number; fallCrack: number; fallShatter: number; fallShatterChance: number;
    wearToShatter: number; glazeLossPerHit: number;
  };
  social: { memoryCap: number; forgetPerDay: number; rumourChance: number; rumourDiscount: number; rumourMaxDays: number;
            rumoursMax: number; deed: Record<Deed, number>; groupShare: number; standingLeaderPull: number };
  factions: { formAt: number; membersExp: number; upkeepK: number; upkeepExp: number; havenHoldDays: number; planEvery: number;
              planTemp: number; raidTake: number; raidLoss: number; collapseMorale: number; moraleDrift: number; patrolReach: number;
              founders: [number, number]; storeShare: number; rankTrust: Record<Rank, number>; rankDone: Record<Rank, number> };
  quests: { maxOpen: number; perBoard: number; checkEvery: number; rewardShare: number; minReward: number; supplyBelow: number;
            clearDensity: number; clearCount: [number, number]; bountyGrudge: number; driftSize: number; envoyTrust: number;
            reachDays: number; marketBand: [number, number]; expireDays: Record<QuestTemplate, number> };
  bots: { sessionHours: number; nearHops: number; riskLimit: number; hatlessPerHour: number };
  build: { hp: Record<PieceKind, number>; pushPerHatless: number; spikeKillsPerDay: number; snareFoodPerDay: number; wallsWeight: number };
  farm: { crops: Record<CropId, { days: number; yield: number; seasons: Season[]; repeatDays: number }>; waterPerDay: number;
          unwateredMul: number; weedsDays: number; weedsMul: number; trampleK: number };
  mowing: { everyDays: [number, number]; coverDays: number; herdScatter: number; spillShare: number; warnDays: number };
  storylets: { checkEvery: number };
  bell: { noise: number; hops: number };
  seasonal: Partial<Record<Season, unknown>>;
}

/** The player's base as the sim sees it (roadmap 9). */
export interface SimBase { region: RegionId; x: number; z: number; hp: number; maxHp: number; warmth: number; pending: number; fallenTick: number | null }

export interface WorldState {
  seed: number;
  tick: number;                              // sim ticks since the start; tick 0 = day 1, 00:00
  tuning: Tuning;
  graph: RegionGraph;
  weather: WeatherState;
  npcs: Npc[];                               // alive and dead, index = id
  groups: Group[];
  horde: HordeState;
  loot: Record<RegionId, Record<Resource, number>>;            // unrolled stock per region
  regionLootStart: Record<RegionId, Record<Resource, number>>; // per region, right after createWorld
  forage: Record<RegionId, number>;          // food that can be foraged now (not counted in resourceTotals)
  containers: Record<string, ContainerState>;
  market: MarketState;
  chronicle: ChronicleLine[];
  events: SimEvent[];                        // this tick's events; cleared at the start of stepWorld
  ledger: Ledger;
  promoted: { region: RegionId | null; hatless: number }; // Hatless held at L0 by the game
  daily: DailyRow[];
  nextId: { group: number; herd: number; faction: number; quest: number; rumour: number; piece: number };
  flags: Record<string, boolean>;            // one-shot markers for chronicle/systems, e.g. 'loot-low:ivy-rows:food'
  base: SimBase | null;                      // null in every headless run
  // ---- phases 4-8 (roadmap 4.2)
  map: MapKind;
  tuningBase: Tuning;                        // tuning before the season patch (withSeason); excluded from hash and snapshot
  memory: NpcMemory[];                       // index = NpcId
  rumours: Rumour[];
  factions: Faction[];                       // alive and dead, index = id
  groupFaction: Record<string, FactionId>;   // String(GroupId) -> faction
  players: Record<PlayerKey, PlayerRecord>;
  quests: Quest[];                           // index = id
  boards: NoticeBoard[];
  outcomes: QuestOutcome[];
  bubbles: Bubble[];
  pieces: Piece[];                           // index = id; a removed or broken piece keeps hp 0
  beds: Bed[];
  mowing: MowingState;
  storylets: StoryletState[];
  lanterns: Record<string, boolean>;         // grave lantern spot id -> lit
  lootRespawn?: boolean;                     // toggleable loot respawn (default false)
  lootRespawnDays?: number;                  // days between replenishments (default 3)
  worldMeta?: { title: string; owner: string; lootRespawn: boolean };
  bellTick: number | null;                   // last time the chapel bell rang
  lastSeason: Season;                        // for the season patch
}
// ---------------------------------------------------------------- phases 4-8 (docs/roadmaps/dayg-phases-4-8.md)
export type MapKind = 'slice' | 'full';
export type MapStage = 'south-west' | 'north' | 'east';
export const DISTRICT_STAGE: Record<DistrictId, MapStage> = {
  lychgate: 'south-west', 'old-rows': 'south-west', 'yew-walk': 'south-west', 'gnome-garden': 'south-west',
  wreathwood: 'south-west', compost: 'south-west', columbarium: 'north', 'bell-chapel': 'north',
  'mausoleum-hill': 'east', 'lawn-section': 'east', 'drowned-corner': 'east', shed: 'east',
};

/** 'local' offline; online 'u:<platform userId>' when signed in, else 'g:<mp player id>'; bots 'bot:<n>'. */
export type PlayerKey = string;
/** 'n:<NpcId>' an NPC, 'p:<PlayerKey>' a player, 'g:<GroupId>' a group, 'f:<FactionId>' a faction. */
export type SubjectKey = string;
export type FactionId = number;
export type QuestId = number;
export type BoardId = string;                 // 'board:<RegionId>'

// ---- trust ledger and rumours (society.md "Memory and trust")
export type Grudge = 'theft' | 'betrayal' | 'abandoned' | 'attacked' | 'robbed' | 'lied';
export type Deed = 'helped' | 'shared-food' | 'kept-watch' | 'stole' | 'betrayed' | 'killed-gnome' | 'robbed'
  | 'threatened' | 'warned' | 'quest-done' | 'quest-failed' | 'rang-bell';
export const DEEDS: readonly Deed[] = ['helped', 'shared-food', 'kept-watch', 'stole', 'betrayed', 'killed-gnome', 'robbed',
  'threatened', 'warned', 'quest-done', 'quest-failed', 'rang-bell'];
/** trust -1..1; debt in acorns (+ = the subject owes this NPC); seen = tick of the last change; heard = only by rumour. */
export interface TrustEntry { s: SubjectKey; trust: number; debt: number; grudge: Grudge | null; seen: number; heard: boolean }
export interface NpcMemory { entries: TrustEntry[] } // at most tuning.social.memoryCap; the weakest |trust| is forgotten first
export type RumourFact =
  | { kind: 'deed'; who: SubjectKey; deed: Deed }
  | { kind: 'herd'; size: number }
  | { kind: 'price'; resource: Resource; price: number };
/** A fact spreading along the region graph from `origin`; `at` = regions it has reached, in the order reached. */
export interface Rumour { id: number; fact: RumourFact; origin: RegionId; at: RegionId[]; tick: number; strength: number }

// ---- factions (society.md "Factions and power", havens.md)
export type Rank = 'stray' | 'hand' | 'sworn' | 'warden' | 'voice';
export const RANKS: readonly Rank[] = ['stray', 'hand', 'sworn', 'warden', 'voice'];
export interface Norms {
  sharing: 'all' | 'tithe' | 'own';
  strangers: 'welcome' | 'question' | 'turn-away' | 'rob';
  bitten: 'nurse' | 'cast-out' | 'shatter';
  leadership: 'strongest' | 'council' | 'founder-line';
  violence: 'never-first' | 'raiders-only' | 'outsiders';
}
export type FactionPlan = 'hold' | 'expand' | 'trade' | 'ally' | 'tribute' | 'raid' | 'schism' | 'collapse';
export const FACTION_PLANS: readonly FactionPlan[] = ['hold', 'expand', 'trade', 'ally', 'tribute', 'raid', 'schism', 'collapse'];
export type FounderId = 'yarrow-gravelpot' | 'nettle-rustspade' | 'comfrey-kilnworth' | 'thistle-stonewort' | 'lichen-ashbucket';
export interface Faction {
  id: FactionId; name: string; founder: FounderId | null; hat: number;   // hat colour 0xRRGGBB
  home: RegionId; leader: NpcId; groups: GroupId[]; norms: Norms;
  power: number; morale: number;                    // morale 0..1
  stock: Record<Resource, number>; acorns: number;   // the store; counted by resourceTotals / acornTotal
  havens: HavenId[]; territory: RegionId[];
  allies: FactionId[]; enemies: FactionId[];
  plan: FactionPlan; planTarget: FactionId | null; planSince: number;
  formedTick: number; diedTick: number | null;
  ranks: Record<PlayerKey, Rank>;                    // players who joined
  done: Record<PlayerKey, number>;                   // quests each player finished for this faction
  leaders: { npc: NpcId; from: number }[];           // leader history, oldest first
}

// ---- players as sim entities (society.md "Where the player fits")
export type SkillId = 'foraging' | 'carpentry' | 'masonry' | 'glazing' | 'cooking' | 'trapping' | 'fishing' | 'gardening'
  | 'tracking' | 'stealth' | 'melee' | 'ranged' | 'climbing' | 'bartering' | 'leadership';
export const SKILLS: readonly SkillId[] = ['foraging', 'carpentry', 'masonry', 'glazing', 'cooking', 'trapping', 'fishing',
  'gardening', 'tracking', 'stealth', 'melee', 'ranged', 'climbing', 'bartering', 'leadership'];
export interface PlayerRecord {
  key: PlayerKey; name: string; look: string; userId: string | null;   // look = @lawn/gnome look code ('' = default)
  region: RegionId | null; online: boolean; joinedTick: number; lastTick: number;
  acorns: number;                                   // counted by acornTotal
  faction: FactionId | null; notoriety: number;     // 0..1: share of alive NPCs with an entry for this player
  quests: QuestId[];                                // taken and not finished
  done: number; failed: number; deaths: number;
  skills: Partial<Record<SkillId, number>>;         // XP per skill (the game's SkillSystem writes it with 'set-skills')
  bed: HavenId | null;
}

// ---- quests and notice boards (quests.md)
export type QuestTemplate = 'supply-run' | 'escort' | 'clear-ground' | 'missing-gnome' | 'open-crypt' | 'bounty'
  | 'sabotage' | 'steer-drift' | 'envoy' | 'teach' | 'the-bitten' | 'storylet';
export const QUEST_TEMPLATES: readonly QuestTemplate[] = ['supply-run', 'escort', 'clear-ground', 'missing-gnome', 'open-crypt',
  'bounty', 'sabotage', 'steer-drift', 'envoy', 'teach', 'the-bitten', 'storylet'];
export type QuestState = 'offered' | 'taken' | 'done' | 'failed' | 'expired';
export type QuestGoal =
  | { kind: 'deliver'; resource: Resource; count: number; to: RegionId }   // supply-run; the-bitten (medicine)
  | { kind: 'clear'; region: RegionId; count: number }                     // clear-ground, open-crypt: destroy N Hatless there
  | { kind: 'find'; npc: NpcId; region: RegionId }                         // missing-gnome: talk to the NPC (or reach its remains)
  | { kind: 'escort'; npc: NpcId; from: RegionId; to: RegionId }           // be in `to`; the NPC is moved there with you
  | { kind: 'visit'; region: RegionId; item: ItemId | null }               // sabotage, envoy (carry the item there)
  | { kind: 'target'; npc: NpcId }                                         // bounty: threaten or rob the target (warning it completes the rival quest)
  | { kind: 'steer'; herd: number; away: RegionId }                        // steer-drift: make noise near the herd; herd not in `away` at the deadline
  | { kind: 'teach'; group: GroupId; skill: SkillId; level: number; hours: number }
  | { kind: 'storylet'; storylet: StoryletId; step: number; region: RegionId };
/** Paid from the poster's store at completion; trust is added to every member of the poster's faction for the taker. */
export interface QuestReward { acorns: number; items: ItemStack[]; trust: number }
export interface Quest {
  id: QuestId; template: QuestTemplate; title: string;
  poster: SubjectKey;               // 'f:<id>' or 'n:<id>'
  board: BoardId | null;            // null = offered only in talk ('ask-help')
  region: RegionId;                 // where the need is (used for "quests near")
  goal: QuestGoal; reward: QuestReward;
  postedTick: number; deadline: number;
  state: QuestState; takenBy: PlayerKey | null; takenTick: number | null; doneTick: number | null;
  rival: QuestId | null;            // the quest another side posted about the same event
  progress: number;                 // goal counter: Hatless destroyed, units delivered, noise made, hours taught
}
export interface NoticeBoard { id: BoardId; region: RegionId; haven: HavenId | null; name: string; newcomer: boolean }
/** reach stays null until tuning.quests.reachDays have passed since doneTick. */
export interface QuestOutcome {
  quest: QuestId; template: QuestTemplate; doneTick: number; by: PlayerKey;
  reach: { rankChange: boolean; havenChange: boolean; marketOutOfBand: boolean } | null;
}

// ---- talk (quests.md "Talking to NPCs")
export type TalkVerb = 'greet' | 'ask' | 'trade' | 'offer-help' | 'ask-help' | 'recruit' | 'join' | 'threaten' | 'rob'
  | 'share-food' | 'warn';
export const TALK_VERBS: readonly TalkVerb[] = ['greet', 'ask', 'trade', 'offer-help', 'ask-help', 'recruit', 'join',
  'threaten', 'rob', 'share-food', 'warn'];
export type AskTopic =
  | { about: 'place'; region: RegionId } | { about: 'gnome'; npc: NpcId }
  | { about: 'price'; resource: Resource } | { about: 'herd' };
export interface ResourceCount { resource: Resource; count: number }
export interface TalkInput {
  npc: NpcId; player: PlayerKey; verb: TalkVerb;
  topic?: AskTopic;                 // ask
  offer?: ResourceCount;            // trade (what the player gives), share-food (food), offer-help
  want?: ResourceCount;             // trade (what the player wants)
  acorns?: number;                  // trade: acorns the player adds (+) or asks for (-)
  carried?: Partial<Record<Resource, number>>; // what the player has, as the game counts it (rob, threaten, trade checks)
  warnOf?: NpcId;                   // warn: the bounty target being warned (the NPC talked to is the target)
}
export interface PhraseLine { key: string; vars: Record<string, string | number> }
export interface TalkResult {
  ok: boolean; lines: PhraseLine[]; trustDelta: number;
  give: ItemStack[];                // the NPC hands these to the player (taken out of the NPC's carried stock)
  take: ResourceCount[];            // the game removes these from the player's inventory
  acorns: number;                   // + = the player receives
  quest: QuestId | null;            // offer-help: the quest this NPC offers you (posted if needed); else null
  joined: FactionId | null;         // join or recruit succeeded
  hostile: boolean;                 // the NPC fled or turned on the player (the game reacts)
}

// ---- actions: every change a player makes to the sim (hand-off replays them)
export type CropId = 'clover' | 'toadstool' | 'grain' | 'berries' | 'roses' | 'acorn-tree';
export const CROPS: readonly CropId[] = ['clover', 'toadstool', 'grain', 'berries', 'roses', 'acorn-tree'];
export type PieceKind = 'plank-wall' | 'barricade' | 'reinforced-barricade' | 'stone-wall' | 'door' | 'pull-ladder'
  | 'spike-line' | 'dug-pit' | 'garden-bed' | 'rain-catcher' | 'drying-rack' | 'workbench' | 'hearth' | 'kiln' | 'anvil'
  | 'bed' | 'storage' | 'snare' | 'noise-line' | 'rope-bridge';
export const PIECE_KINDS: readonly PieceKind[] = ['plank-wall', 'barricade', 'reinforced-barricade', 'stone-wall', 'door',
  'pull-ladder', 'spike-line', 'dug-pit', 'garden-bed', 'rain-catcher', 'drying-rack', 'workbench', 'hearth', 'kiln', 'anvil',
  'bed', 'storage', 'snare', 'noise-line', 'rope-bridge'];
export interface PieceDef { kind: PieceKind; region: RegionId; x: number; y: number; z: number; rotY: number }
export interface Piece extends PieceDef { id: number; hp: number; maxHp: number; owner: SubjectKey; placedTick: number }
export interface Bed { piece: number; crop: CropId | null; plantedTick: number; water: number; tendedTick: number; ready: boolean; picks: number }
export type SimAction =
  | { kind: 'player-join'; name: string; look: string; userId: string | null; region: RegionId | null }
  | { kind: 'player-leave' }
  | { kind: 'enter-region'; region: RegionId | null; alive: number }  // alive = L0 Hatless still standing in the bubble I leave (owner)
  | { kind: 'open-container'; id: string }
  | { kind: 'player-take'; stack: ItemStack }                          // recordPlayerTake booking
  | { kind: 'hatless-destroyed'; region: RegionId }
  | { kind: 'noise'; region: RegionId; amount: number }
  | { kind: 'talk'; input: TalkInput }
  | { kind: 'take-quest'; quest: QuestId }
  | { kind: 'quest-progress'; quest: QuestId; amount: number }
  | { kind: 'deliver'; quest: QuestId; resource: Resource; count: number }
  | { kind: 'complete-quest'; quest: QuestId }
  | { kind: 'abandon-quest'; quest: QuestId }
  | { kind: 'join-faction'; faction: FactionId }
  | { kind: 'leave-faction' }
  | { kind: 'player-died'; cause: DeathCause; region: RegionId | null; carried: ItemStack[] }
  | { kind: 'respawn'; at: HavenId; teacher: NpcId | null }
  | { kind: 'set-skills'; skills: Partial<Record<SkillId, number>> }
  | { kind: 'build'; piece: PieceDef }
  | { kind: 'damage-piece'; id: number; amount: number }
  | { kind: 'remove-piece'; id: number }
  | { kind: 'plant'; bed: number; crop: CropId }
  | { kind: 'water-bed'; bed: number; litres: number }
  | { kind: 'tend-bed'; bed: number }
  | { kind: 'harvest'; bed: number }
  | { kind: 'check-snare'; piece: number }
  | { kind: 'ring-bell'; region: RegionId }
  | { kind: 'light-lantern'; id: string };
export interface ActionEnvelope { tick: number; seq: number; player: PlayerKey; action: SimAction }
export interface ActionResult { ok: boolean; error?: string; items?: ItemStack[]; talk?: TalkResult; quest?: QuestId; piece?: number }
export interface Arrival { player: PlayerKey; region: RegionId; count: number; from: RegionId | null }
export interface TickResult { tick: number; arrivals: Arrival[]; hash: string }
/** One L0 bubble per region with a player in it. Its owner's browser runs the L0 Hatless (held here as `hatless`). */
export interface Bubble { owner: PlayerKey; region: RegionId; hatless: number; viewers: PlayerKey[] }

// ---- depth (crafting.md, world.md, quests.md storylets)
export interface MowingState { next: number; district: DistrictId | null; lastTick: number | null; mownUntil: Partial<Record<DistrictId, number>>; warned: boolean }
export type StoryletId = 'last-sexton' | 'seeds-for-spring' | 'greybearded-walk' | 'who-rang-the-horn' | 'mower-rumbles' | 'gate-book';
export const STORYLET_IDS: readonly StoryletId[] = ['last-sexton', 'seeds-for-spring', 'greybearded-walk', 'who-rang-the-horn', 'mower-rumbles', 'gate-book'];
export interface StoryletState { id: StoryletId; firedTick: number; quest: QuestId | null; done: boolean }
