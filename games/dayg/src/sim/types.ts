// Every contract of the DayG simulation. Plain JSON-safe data. No DOM, no three.js, no Math.random, no Date.

export type RegionId =
  | 'gate-roof' | 'forecourt' | 'verge-path' | 'bin-corner'
  | 'ivy-rows' | 'leaning-rows' | 'the-sinks' | 'angel-square' | 'masons-corner' | 'child-graves' | 'yew-edge'
  | 'the-tap';
export type DistrictId = 'lychgate' | 'old-rows' | 'yew-walk';
export type HavenId = 'waystation' | 'tap';
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
  | { kind: 'season'; season: Season };
export interface DailyRow {
  day: number; alive: number; start: number; hatless: number; hatlessStart: number;
  modes: { alone: number; pack: number; band: number; settlement: number }; // alive NPCs by group size 1, 2-8, 9-25, 26+
  lootLeft: Record<Resource, number>;  // sum of region stocks / ledger.regionLootStart (0..1)
  prices: Record<Resource, number>;
  deaths: Record<DeathCause, number>;  // cumulative
  hordeInSinks: number;                // share of hatlessTotal in NEST or PIT regions (0..1)
  chronicleLines: number;              // cumulative
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
  body: {
    partWeights: Record<'head' | 'chest' | 'armL' | 'armR' | 'legL' | 'legR', number>;
    crackPerHit: number; fallChip: number; fallCrack: number; fallShatter: number; fallShatterChance: number;
    wearToShatter: number; glazeLossPerHit: number;
  };
}

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
  nextId: { group: number; herd: number };
  flags: Record<string, boolean>;            // one-shot markers for chronicle/systems, e.g. 'loot-low:ivy-rows:food'
}
