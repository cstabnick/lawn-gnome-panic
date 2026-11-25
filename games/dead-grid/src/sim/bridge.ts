import { SIM_WASM_BASE64 } from '../wasm/simBytes';

export const MAX_AGENTS = 262144;
export const MAX_FACTIONS = 32;
export const MAX_REPUBLICS = 8;
export const MAX_EVENTS = 64;

export type GridSize = 512 | 768 | 1024;
export type WaterStyle = 0 | 1 | 2 | 3; // 0=Coastal, 1=River Valleys, 2=Archipelago, 3=Arid Basin
export type OverlayMode = 0 | 1 | 2 | 3 | 4 | 5; // 0=Standard, 1=Territory, 2=Loot, 3=Noise, 4=Topography, 5=Nations
export type BrushTool = 'inspect' | 'zombies' | 'humans' | 'animals' | 'airdrop' | 'clear';

export const WATER_STYLE_NAMES = [
  'Coastal Mainland',
  'River Valleys',
  'Archipelago',
  'Arid Basin',
] as const;

export const TILE_NAMES = [
  'Water',
  'Coast / Beach',
  'Swamp / Marsh',
  'Grassland',
  'Forest',
  'Hill / Ridge',
  'Mountain Peak',
  'Asphalt Road',
  'Town',
  'City',
  'Military Base',
  'Farmland',
  'Industrial',
  'Fortified Wall',
] as const;

export const HUMAN_ARCHETYPES = ['Scavenger', 'Builder', 'Guard', 'Trader', 'Raider', 'Nomad'] as const;
export const ZOMBIE_SUBKINDS = ['Walker', 'Runner', 'Pack Alpha'] as const;
export const ANIMAL_SUBKINDS = ['Deer', 'Wolf', 'Boar'] as const;
export const SOCIAL_TIERS = ['Solo', 'Small Group', 'Society'] as const;

export const AGENT_STATES = [
  'Roaming',
  'Scavenging',
  'Fleeing',
  'Fighting',
  'Returning',
  'Guarding',
  'Raiding',
  'Shambling',
  'Chasing',
  'Grazing',
  'Hunting',
  'Trading',
] as const;

export const ETHOS_NAMES = ['Cooperative', 'Fortress', 'Raider'] as const;
export const TIER_NAMES = ['Ruins', 'Camp', 'Outpost', 'Safe Zone', 'Fortress'] as const;

const SETTLEMENT_PREFIXES = [
  'Elektro', 'Cherno', 'Berezino', 'Stary', 'Novy', 'Zeleno', 'Kamysh', 'Solnich',
  'Gorka', 'Vybor', 'Krasno', 'Severo', 'Pavlovo', 'Myshkino', 'Balota', 'Tisy',
  'Nadezhdino', 'Mogilevka', 'Lopatino', 'Grishino', 'Kabanino', 'Sinistok', 'Vavilovo', 'Pustoshka',
  'Dolores', 'Orlovets', 'Shakhovka', 'Polana', 'Guglovo', 'Staroye', 'Msta', 'Tulga',
];
const SETTLEMENT_SUFFIXES = [
  'Bastion', 'Haven', 'Watch', 'Crossing', 'Depot', 'Refuge', 'Hold', 'Reach',
];

const REPUBLIC_NAMES = [
  'Chernarus Republic',
  'Northern Commonwealth',
  'Green Sea Federation',
  'Coastal Compact',
  'Highland Union',
  'Valley League',
  'Bastion Coalition',
  'Frontier Directorate',
];

export function settlementName(slot: number, seed: number): string {
  const idx = (slot * 7 + (seed % 32)) % SETTLEMENT_PREFIXES.length;
  const sfx = (slot * 3 + ((seed >> 3) % 8)) % SETTLEMENT_SUFFIXES.length;
  return `${SETTLEMENT_PREFIXES[idx]} ${SETTLEMENT_SUFFIXES[sfx]}`;
}

export function republicName(slot: number, seed: number): string {
  return REPUBLIC_NAMES[(slot * 3 + (seed % 8)) % REPUBLIC_NAMES.length];
}

export interface SimParams {
  gridSize: GridSize;
  waterStyle: WaterStyle;
  zombieSpeed: number;
  humanSpeed: number;
  animalSpeed: number;
  infectionChance: number;
  hungerRate: number;
  thirstRate: number;
  lootRespawnRate: number;
  hordeHearing: number;
  settlementGrowth: number;
  banditry: number;
  cooperationBias: number;
  zombieMigration: number;
  roadDecayRate: number;
  roadBuildCost: number;
  initialHumans: number;
  initialZombies: number;
  initialAnimals: number;
  cityDensity: number;
}

export const DEFAULT_PARAMS: SimParams = {
  gridSize: 512,
  waterStyle: 0,
  zombieSpeed: 0.42,
  humanSpeed: 0.56,
  animalSpeed: 0.52,
  infectionChance: 0.35,
  hungerRate: 1.0,
  thirstRate: 1.0,
  lootRespawnRate: 1.0,
  hordeHearing: 1.0,
  settlementGrowth: 1.0,
  banditry: 0.22,
  cooperationBias: 0.65,
  zombieMigration: 0.2,
  roadDecayRate: 0.35,
  roadBuildCost: 1.0,
  initialHumans: 3000,
  initialZombies: 14000,
  initialAnimals: 2500,
  cityDensity: 1.0,
};

export interface PresetDef {
  id: string;
  label: string;
  description: string;
  params: SimParams;
}

export const PRESETS: PresetDef[] = [
  {
    id: 'classic',
    label: 'Classic Chernarus',
    description: '512x512 coast, 14k zombies, 3k humans, 2.5k wildlife.',
    params: { ...DEFAULT_PARAMS },
  },
  {
    id: 'rise-of-republics',
    label: 'Rise of Republics',
    description: 'Cooperative 768x768 world where societies federate into Republics and build highway networks.',
    params: {
      ...DEFAULT_PARAMS,
      gridSize: 768,
      waterStyle: 1,
      cooperationBias: 0.85,
      banditry: 0.1,
      settlementGrowth: 1.4,
      roadBuildCost: 0.6,
      initialHumans: 7500,
      initialZombies: 6000,
      initialAnimals: 3000,
    },
  },
  {
    id: 'mega-horde',
    label: 'Mega Horde 100K',
    description: '1024x1024 massive world with 80,000 zombies, 16,000 humans, 6,000 wildlife.',
    params: {
      ...DEFAULT_PARAMS,
      gridSize: 1024,
      initialZombies: 80000,
      initialHumans: 16000,
      initialAnimals: 6000,
      cityDensity: 1.3,
    },
  },
  {
    id: 'fast-infected',
    label: '28 Days Later',
    description: 'Sprinting infected, high bite contagion, high noise attraction.',
    params: {
      ...DEFAULT_PARAMS,
      zombieSpeed: 0.74,
      humanSpeed: 0.62,
      infectionChance: 0.78,
      hordeHearing: 1.8,
      initialZombies: 12000,
      initialHumans: 3500,
    },
  },
  {
    id: 'walking-dead',
    label: 'Slow Walkers',
    description: 'Shuffling hordes, low starvation, strong settlement growth.',
    params: {
      ...DEFAULT_PARAMS,
      zombieSpeed: 0.24,
      humanSpeed: 0.54,
      hungerRate: 0.6,
      thirstRate: 0.6,
      settlementGrowth: 1.5,
      zombieMigration: 0.6,
      initialZombies: 18000,
      initialHumans: 2800,
    },
  },
  {
    id: 'pd-frontier',
    label: "Prisoner's Dilemma",
    description: '768x768 river valleys with high human density and balanced trust/greed.',
    params: {
      ...DEFAULT_PARAMS,
      gridSize: 768,
      waterStyle: 1,
      initialHumans: 9000,
      initialZombies: 8000,
      initialAnimals: 4000,
      cooperationBias: 0.5,
      banditry: 0.35,
    },
  },
  {
    id: 'archipelago',
    label: 'Archipelago Outbreak',
    description: 'Island chains forcing choke-point survival and coastal scavenging.',
    params: {
      ...DEFAULT_PARAMS,
      gridSize: 768,
      waterStyle: 2,
      initialHumans: 4500,
      initialZombies: 15000,
      initialAnimals: 2500,
    },
  },
  {
    id: 'wilderness',
    label: 'Wilderness Rebirth',
    description: 'Abundant wildlife, rare zombies, small pioneer bands.',
    params: {
      ...DEFAULT_PARAMS,
      waterStyle: 1,
      initialHumans: 2500,
      initialZombies: 2000,
      initialAnimals: 8000,
      settlementGrowth: 1.4,
    },
  },
  {
    id: 'raider-wasteland',
    label: 'Raider Wasteland',
    description: 'Arid basin, scarce water & food, high banditry and betrayals.',
    params: {
      ...DEFAULT_PARAMS,
      waterStyle: 3,
      lootRespawnRate: 0.35,
      hungerRate: 1.4,
      thirstRate: 1.6,
      banditry: 0.78,
      cooperationBias: 0.25,
      initialZombies: 8000,
      initialHumans: 4500,
    },
  },
  {
    id: 'blank-sandbox',
    label: 'Blank Sandbox',
    description: 'Minimal starting population—paint your own zombies, humans, and animals.',
    params: {
      ...DEFAULT_PARAMS,
      initialHumans: 200,
      initialZombies: 200,
      initialAnimals: 500,
      zombieMigration: 0.0,
    },
  },
];

export interface SimStats {
  tick: number;
  day: number;
  humans: number;
  zombies: number;
  animals: number;
  infected: number;
  soloHumans: number;
  groupHumans: number;
  societyHumans: number;
  settlements: number;
  zombiePacks: number;
  totalDeaths: number;
  totalZombiesKilled: number;
  totalTurned: number;
  pdCoops: number;
  pdDefects: number;
  pdMutualCoop: number;
  pdBetrayals: number;
  avgFood: number;
  avgWater: number;
  avgGear: number;
  activeAgents: number;
  gridW: number;
  gridH: number;
  republics: number;
  roadTiles: number;
  roadsBuilt: number;
  territoryTiles: number;
}

export interface FactionInfo {
  id: number;
  name: string;
  level: number;
  ethos: number;
  x: number;
  y: number;
  pop: number;
  food: number;
  water: number;
  materials: number;
  colorCss: string;
  colorAbgr: number;
  kills: number;
  foundedTick: number;
  republicId: number; // -1 if independent
}

export interface RepublicInfo {
  id: number;
  name: string;
  capitalId: number;
  members: number;
  pop: number;
  treasury: number;
  colorCss: string;
  foundedTick: number;
}

export interface SimEvent {
  tick: number;
  type: number;
  argA: number;
  argB: number;
  text: string;
}

export interface TileInspection {
  x: number;
  y: number;
  tileType: number;
  tileName: string;
  elevation: number;
  roadCond: number;
  food: number;
  water: number;
  gear: number;
  scent: number;
  claimFactionId: number;
}

export interface AgentInspection {
  index: number;
  kind: 'human' | 'zombie' | 'animal';
  subkindName: string;
  x: number;
  y: number;
  hp: number;
  hunger: number;
  thirst: number;
  food: number;
  water: number;
  gear: number;
  meds: number;
  mats: number;
  stateName: string;
  socialName: string;
  groupId: number;
  rep: number;
  coop: number;
  brave: number;
  greed: number;
  trust: number;
  infection: number;
  age: number;
}

interface SimWasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  getCfgPtr(): number;
  getStatsPtr(): number;
  getEventsPtr(): number;
  getTileTypePtr(): number;
  getElevationPtr(): number;
  getLootFoodPtr(): number;
  getLootWaterPtr(): number;
  getLootGearPtr(): number;
  getFactionClaimPtr(): number;
  getScentHeatPtr(): number;
  getFrameRgbaPtr(): number;
  getRoadCondPtr(): number;

  getRepActivePtr(): number;
  getRepCapitalPtr(): number;
  getRepMembersPtr(): number;
  getRepColorPtr(): number;
  getRepPopPtr(): number;
  getRepTreasuryPtr(): number;
  getRepFoundedPtr(): number;
  getFacRepublicPtr(): number;

  getFacActivePtr(): number;
  getFacLevelPtr(): number;
  getFacEthosPtr(): number;
  getFacXPtr(): number;
  getFacYPtr(): number;
  getFacPopPtr(): number;
  getFacFoodPtr(): number;
  getFacWaterPtr(): number;
  getFacMatsPtr(): number;
  getFacColorPtr(): number;
  getFacKillsPtr(): number;
  getFacFoundedPtr(): number;

  getAgKindPtr(): number;
  getAgSubkindPtr(): number;
  getAgHpPtr(): number;
  getAgHungerPtr(): number;
  getAgThirstPtr(): number;
  getAgInvFoodPtr(): number;
  getAgInvWaterPtr(): number;
  getAgInvGearPtr(): number;
  getAgInvMedsPtr(): number;
  getAgInvMatsPtr(): number;
  getAgStatePtr(): number;
  getAgSocialPtr(): number;
  getAgGroupPtr(): number;
  getAgPersonalityPtr(): number;
  getAgRepPtr(): number;
  getAgInfectionPtr(): number;
  getAgAgePtr(): number;
  getAgXPtr(): number;
  getAgYPtr(): number;

  generateWorld(seed: number, size: number, waterStyle: number): void;
  stepTicks(count: number): void;
  renderFrame(overlayMode: number, drawAgents: number): void;
  brushSpawnZombies(cx: number, cy: number, radius: number, count: number): void;
  brushSpawnHumans(cx: number, cy: number, radius: number, count: number): void;
  brushSpawnAnimals(cx: number, cy: number, radius: number, count: number): void;
  brushAirdrop(cx: number, cy: number, radius: number): void;
  brushClear(cx: number, cy: number, radius: number): void;
  findNearestAgent(wx: number, wy: number, maxDist: number): number;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function abgrToCss(abgr: number): string {
  const r = abgr & 0xff;
  const g = (abgr >> 8) & 0xff;
  const b = (abgr >> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

export class DeadGridSim {
  private readonly ex: SimWasmExports;
  private readonly cfgView: Float32Array;
  private readonly statsView: Int32Array;
  private readonly eventsView: Int32Array;

  readonly tileType: Uint8Array;
  readonly elevation: Uint8Array;
  readonly lootFood: Uint8Array;
  readonly lootWater: Uint8Array;
  readonly lootGear: Uint8Array;
  readonly factionClaim: Uint8Array;
  readonly scentHeat: Uint8Array;
  readonly roadCond: Uint8Array;
  private readonly frameRgbaFull: Uint8ClampedArray;

  private readonly repActive: Uint8Array;
  private readonly repCapital: Uint8Array;
  private readonly repMembers: Uint8Array;
  private readonly repColor: Uint32Array;
  private readonly repPop: Uint32Array;
  private readonly repTreasury: Float32Array;
  private readonly repFounded: Uint32Array;
  private readonly facRepublic: Uint8Array;

  private readonly facActive: Uint8Array;
  private readonly facLevel: Uint8Array;
  private readonly facEthos: Uint8Array;
  private readonly facX: Uint16Array;
  private readonly facY: Uint16Array;
  private readonly facPop: Uint16Array;
  private readonly facFood: Float32Array;
  private readonly facWater: Float32Array;
  private readonly facMats: Float32Array;
  private readonly facColor: Uint32Array;
  private readonly facKills: Uint32Array;
  private readonly facFounded: Uint32Array;

  readonly agKind: Uint8Array;
  readonly agSubkind: Uint8Array;
  readonly agHp: Uint8Array;
  readonly agHunger: Uint8Array;
  readonly agThirst: Uint8Array;
  readonly agInvFood: Uint8Array;
  readonly agInvWater: Uint8Array;
  readonly agInvGear: Uint8Array;
  readonly agInvMeds: Uint8Array;
  readonly agInvMats: Uint8Array;
  readonly agState: Uint8Array;
  readonly agSocial: Uint8Array;
  readonly agGroup: Uint16Array;
  readonly agPersonality: Uint16Array;
  readonly agRep: Int8Array;
  readonly agInfection: Uint8Array;
  readonly agAge: Uint16Array;
  readonly agX: Float32Array;
  readonly agY: Float32Array;

  seed = 1337;
  gridW = 512;
  gridH = 512;
  private lastEventRead = 0;

  constructor(instance: WebAssembly.Instance) {
    const ex = instance.exports as SimWasmExports;
    this.ex = ex;
    const buf = ex.memory.buffer;

    this.cfgView = new Float32Array(buf, ex.getCfgPtr(), 64);
    this.statsView = new Int32Array(buf, ex.getStatsPtr(), 32);
    this.eventsView = new Int32Array(buf, ex.getEventsPtr(), MAX_EVENTS * 4);

    const maxGridN = 1024 * 1024;
    this.tileType = new Uint8Array(buf, ex.getTileTypePtr(), maxGridN);
    this.elevation = new Uint8Array(buf, ex.getElevationPtr(), maxGridN);
    this.lootFood = new Uint8Array(buf, ex.getLootFoodPtr(), maxGridN);
    this.lootWater = new Uint8Array(buf, ex.getLootWaterPtr(), maxGridN);
    this.lootGear = new Uint8Array(buf, ex.getLootGearPtr(), maxGridN);
    this.factionClaim = new Uint8Array(buf, ex.getFactionClaimPtr(), maxGridN);
    this.scentHeat = new Uint8Array(buf, ex.getScentHeatPtr(), maxGridN);
    this.roadCond = new Uint8Array(buf, ex.getRoadCondPtr(), maxGridN);
    this.frameRgbaFull = new Uint8ClampedArray(buf, ex.getFrameRgbaPtr(), maxGridN * 4);

    this.repActive = new Uint8Array(buf, ex.getRepActivePtr(), MAX_REPUBLICS);
    this.repCapital = new Uint8Array(buf, ex.getRepCapitalPtr(), MAX_REPUBLICS);
    this.repMembers = new Uint8Array(buf, ex.getRepMembersPtr(), MAX_REPUBLICS);
    this.repColor = new Uint32Array(buf, ex.getRepColorPtr(), MAX_REPUBLICS);
    this.repPop = new Uint32Array(buf, ex.getRepPopPtr(), MAX_REPUBLICS);
    this.repTreasury = new Float32Array(buf, ex.getRepTreasuryPtr(), MAX_REPUBLICS);
    this.repFounded = new Uint32Array(buf, ex.getRepFoundedPtr(), MAX_REPUBLICS);
    this.facRepublic = new Uint8Array(buf, ex.getFacRepublicPtr(), MAX_FACTIONS);

    this.facActive = new Uint8Array(buf, ex.getFacActivePtr(), MAX_FACTIONS);
    this.facLevel = new Uint8Array(buf, ex.getFacLevelPtr(), MAX_FACTIONS);
    this.facEthos = new Uint8Array(buf, ex.getFacEthosPtr(), MAX_FACTIONS);
    this.facX = new Uint16Array(buf, ex.getFacXPtr(), MAX_FACTIONS);
    this.facY = new Uint16Array(buf, ex.getFacYPtr(), MAX_FACTIONS);
    this.facPop = new Uint16Array(buf, ex.getFacPopPtr(), MAX_FACTIONS);
    this.facFood = new Float32Array(buf, ex.getFacFoodPtr(), MAX_FACTIONS);
    this.facWater = new Float32Array(buf, ex.getFacWaterPtr(), MAX_FACTIONS);
    this.facMats = new Float32Array(buf, ex.getFacMatsPtr(), MAX_FACTIONS);
    this.facColor = new Uint32Array(buf, ex.getFacColorPtr(), MAX_FACTIONS);
    this.facKills = new Uint32Array(buf, ex.getFacKillsPtr(), MAX_FACTIONS);
    this.facFounded = new Uint32Array(buf, ex.getFacFoundedPtr(), MAX_FACTIONS);

    this.agKind = new Uint8Array(buf, ex.getAgKindPtr(), MAX_AGENTS);
    this.agSubkind = new Uint8Array(buf, ex.getAgSubkindPtr(), MAX_AGENTS);
    this.agHp = new Uint8Array(buf, ex.getAgHpPtr(), MAX_AGENTS);
    this.agHunger = new Uint8Array(buf, ex.getAgHungerPtr(), MAX_AGENTS);
    this.agThirst = new Uint8Array(buf, ex.getAgThirstPtr(), MAX_AGENTS);
    this.agInvFood = new Uint8Array(buf, ex.getAgInvFoodPtr(), MAX_AGENTS);
    this.agInvWater = new Uint8Array(buf, ex.getAgInvWaterPtr(), MAX_AGENTS);
    this.agInvGear = new Uint8Array(buf, ex.getAgInvGearPtr(), MAX_AGENTS);
    this.agInvMeds = new Uint8Array(buf, ex.getAgInvMedsPtr(), MAX_AGENTS);
    this.agInvMats = new Uint8Array(buf, ex.getAgInvMatsPtr(), MAX_AGENTS);
    this.agState = new Uint8Array(buf, ex.getAgStatePtr(), MAX_AGENTS);
    this.agSocial = new Uint8Array(buf, ex.getAgSocialPtr(), MAX_AGENTS);
    this.agGroup = new Uint16Array(buf, ex.getAgGroupPtr(), MAX_AGENTS);
    this.agPersonality = new Uint16Array(buf, ex.getAgPersonalityPtr(), MAX_AGENTS);
    this.agRep = new Int8Array(buf, ex.getAgRepPtr(), MAX_AGENTS);
    this.agInfection = new Uint8Array(buf, ex.getAgInfectionPtr(), MAX_AGENTS);
    this.agAge = new Uint16Array(buf, ex.getAgAgePtr(), MAX_AGENTS);
    this.agX = new Float32Array(buf, ex.getAgXPtr(), MAX_AGENTS);
    this.agY = new Float32Array(buf, ex.getAgYPtr(), MAX_AGENTS);
  }

  get frameRgba(): Uint8ClampedArray {
    return this.frameRgbaFull.subarray(0, this.gridW * this.gridH * 4);
  }

  applyParams(p: SimParams): void {
    this.cfgView[0] = p.zombieSpeed;
    this.cfgView[1] = p.humanSpeed;
    this.cfgView[2] = p.animalSpeed;
    this.cfgView[3] = p.infectionChance;
    this.cfgView[4] = p.hungerRate;
    this.cfgView[5] = p.thirstRate;
    this.cfgView[6] = p.lootRespawnRate;
    this.cfgView[7] = p.hordeHearing;
    this.cfgView[8] = p.settlementGrowth;
    this.cfgView[9] = p.banditry;
    this.cfgView[10] = p.cooperationBias;
    this.cfgView[11] = p.zombieMigration;
    this.cfgView[12] = p.initialHumans;
    this.cfgView[13] = p.initialZombies;
    this.cfgView[14] = p.initialAnimals;
    this.cfgView[15] = p.cityDensity;
    this.cfgView[16] = p.roadDecayRate;
    this.cfgView[17] = p.roadBuildCost;
  }

  reset(seed: number, params: SimParams): void {
    this.seed = seed >>> 0 || 1;
    this.gridW = params.gridSize;
    this.gridH = params.gridSize;
    this.lastEventRead = 0;
    this.applyParams(params);
    this.ex.generateWorld(this.seed, params.gridSize, params.waterStyle);
  }

  step(ticks: number): void {
    if (ticks > 0) this.ex.stepTicks(ticks);
  }

  renderFrame(overlay: OverlayMode, drawAgents: boolean): void {
    this.ex.renderFrame(overlay, drawAgents ? 1 : 0);
  }

  brushSpawnZombies(cx: number, cy: number, radius = 12, count = 200): void {
    this.ex.brushSpawnZombies(cx | 0, cy | 0, radius | 0, count | 0);
  }

  brushSpawnHumans(cx: number, cy: number, radius = 10, count = 45): void {
    this.ex.brushSpawnHumans(cx | 0, cy | 0, radius | 0, count | 0);
  }

  brushSpawnAnimals(cx: number, cy: number, radius = 12, count = 40): void {
    this.ex.brushSpawnAnimals(cx | 0, cy | 0, radius | 0, count | 0);
  }

  brushAirdrop(cx: number, cy: number, radius = 8): void {
    this.ex.brushAirdrop(cx | 0, cy | 0, radius | 0);
  }

  brushClear(cx: number, cy: number, radius = 14): void {
    this.ex.brushClear(cx | 0, cy | 0, radius | 0);
  }

  findNearestAgent(wx: number, wy: number, maxDist = 6): number {
    return this.ex.findNearestAgent(wx, wy, maxDist);
  }

  readStats(): SimStats {
    const s = this.statsView;
    return {
      tick: s[0],
      day: s[1],
      humans: s[2],
      zombies: s[3],
      animals: s[4],
      infected: s[5],
      soloHumans: s[6],
      groupHumans: s[7],
      societyHumans: s[8],
      settlements: s[9],
      zombiePacks: s[10],
      totalDeaths: s[11],
      totalZombiesKilled: s[12],
      totalTurned: s[13],
      pdCoops: s[14],
      pdDefects: s[15],
      pdMutualCoop: s[16],
      pdBetrayals: s[17],
      avgFood: s[18] / 10,
      avgWater: s[19] / 10,
      avgGear: s[20],
      activeAgents: s[22],
      gridW: s[23] || this.gridW,
      gridH: s[24] || this.gridH,
      republics: s[25],
      roadTiles: s[26],
      roadsBuilt: s[27],
      territoryTiles: s[28],
    };
  }

  readFactions(): FactionInfo[] {
    const out: FactionInfo[] = [];
    for (let f = 0; f < MAX_FACTIONS; f++) {
      if (this.facActive[f] === 0) continue;
      const rep = this.facRepublic[f];
      out.push({
        id: f,
        name: settlementName(f, this.seed),
        level: this.facLevel[f],
        ethos: this.facEthos[f],
        x: this.facX[f],
        y: this.facY[f],
        pop: this.facPop[f],
        food: Math.round(this.facFood[f]),
        water: Math.round(this.facWater[f]),
        materials: Math.round(this.facMats[f]),
        colorCss: abgrToCss(this.facColor[f]),
        colorAbgr: this.facColor[f],
        kills: this.facKills[f],
        foundedTick: this.facFounded[f],
        republicId: rep < MAX_REPUBLICS ? rep : -1,
      });
    }
    return out;
  }

  readRepublics(): RepublicInfo[] {
    const out: RepublicInfo[] = [];
    for (let r = 0; r < MAX_REPUBLICS; r++) {
      if (this.repActive[r] === 0) continue;
      out.push({
        id: r,
        name: republicName(r, this.seed),
        capitalId: this.repCapital[r],
        members: this.repMembers[r],
        pop: this.repPop[r],
        treasury: Math.round(this.repTreasury[r]),
        colorCss: abgrToCss(this.repColor[r]),
        foundedTick: this.repFounded[r],
      });
    }
    return out;
  }

  drainEvents(): SimEvent[] {
    const writeIdx = this.statsView[21];
    const start = Math.max(this.lastEventRead, writeIdx - MAX_EVENTS);
    const out: SimEvent[] = [];
    for (let i = start; i < writeIdx; i++) {
      const slot = i & (MAX_EVENTS - 1);
      const base = slot * 4;
      const tick = this.eventsView[base];
      const type = this.eventsView[base + 1];
      const argA = this.eventsView[base + 2];
      const argB = this.eventsView[base + 3];
      const name = settlementName(argA, this.seed);
      let text = '';
      if (type === 1) text = `Day ${Math.floor(tick / 200)}: ${name} society founded`;
      else if (type === 2) text = `Day ${Math.floor(tick / 200)}: ${name} upgraded to ${TIER_NAMES[argB] ?? 'Outpost'}`;
      else if (type === 3) text = `Day ${Math.floor(tick / 200)}: ${name} fell`;
      else if (type === 4) text = `Day ${Math.floor(tick / 200)}: Horde breached ${name}'s wall`;
      else if (type === 5) text = `Day ${Math.floor(tick / 200)}: ${name} launched a raid`;
      else if (type === 6) text = `Day ${Math.floor(tick / 200)}: Survivors banded into Group #${argA}`;
      else if (type === 7) text = `Day ${Math.floor(tick / 200)}: ${name} began highway to ${settlementName(argB, this.seed)}`;
      else if (type === 8) text = `Day ${Math.floor(tick / 200)}: ${republicName(argA, this.seed)} founded!`;
      else if (type === 9) text = `Day ${Math.floor(tick / 200)}: ${settlementName(argB, this.seed)} joined ${republicName(argA, this.seed)}`;
      if (text) out.push({ tick, type, argA, argB, text });
    }
    this.lastEventRead = writeIdx;
    return out;
  }

  inspectTile(x: number, y: number): TileInspection {
    const tx = Math.max(0, Math.min(this.gridW - 1, Math.floor(x)));
    const ty = Math.max(0, Math.min(this.gridH - 1, Math.floor(y)));
    const idx = ty * this.gridW + tx;
    const t = this.tileType[idx];
    const claim = this.factionClaim[idx];
    return {
      x: tx,
      y: ty,
      tileType: t,
      tileName: TILE_NAMES[t] ?? 'Unknown',
      elevation: this.elevation[idx],
      roadCond: this.roadCond[idx],
      food: this.lootFood[idx],
      water: this.lootWater[idx],
      gear: this.lootGear[idx],
      scent: this.scentHeat[idx],
      claimFactionId: claim > 0 ? claim - 1 : -1,
    };
  }

  inspectAgent(idx: number): AgentInspection | null {
    if (idx < 0 || idx >= MAX_AGENTS) return null;
    const k = this.agKind[idx];
    if (k === 0) return null;
    const sub = this.agSubkind[idx];
    const kind = k === 1 ? 'human' : k === 2 ? 'zombie' : 'animal';
    const subkindName =
      k === 1
        ? (HUMAN_ARCHETYPES[sub] ?? 'Survivor')
        : k === 2
          ? (ZOMBIE_SUBKINDS[sub] ?? 'Walker')
          : (ANIMAL_SUBKINDS[sub] ?? 'Deer');
    const p = this.agPersonality[idx];
    const soc = this.agSocial[idx];
    return {
      index: idx,
      kind,
      subkindName,
      x: this.agX[idx],
      y: this.agY[idx],
      hp: this.agHp[idx],
      hunger: this.agHunger[idx],
      thirst: this.agThirst[idx],
      food: this.agInvFood[idx],
      water: this.agInvWater[idx],
      gear: this.agInvGear[idx],
      meds: this.agInvMeds[idx],
      mats: this.agInvMats[idx],
      stateName: AGENT_STATES[this.agState[idx]] ?? 'Idle',
      socialName: SOCIAL_TIERS[soc] ?? 'Solo',
      groupId: this.agGroup[idx],
      rep: this.agRep[idx],
      coop: p & 15,
      brave: (p >> 4) & 15,
      greed: (p >> 8) & 15,
      trust: (p >> 12) & 15,
      infection: this.agInfection[idx],
      age: this.agAge[idx],
    };
  }
}

export async function createSim(seed = 1337, params: SimParams = DEFAULT_PARAMS): Promise<DeadGridSim> {
  const bytes = decodeBase64(SIM_WASM_BASE64);
  const { instance } = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer, {
    env: {
      abort() {
        throw new Error('WASM abort');
      },
    },
  });
  const sim = new DeadGridSim(instance);
  sim.reset(seed, params);
  return sim;
}
