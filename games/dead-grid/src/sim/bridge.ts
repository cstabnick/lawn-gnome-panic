import { SIM_WASM_BASE64 } from '../wasm/simBytes';

export const GRID_W = 512;
export const GRID_H = 512;
export const GRID_N = GRID_W * GRID_H;
export const MAX_FACTIONS = 16;
export const MAX_EVENTS = 64;

export type OverlayMode = 0 | 1 | 2 | 3; // 0=Standard, 1=Territory, 2=Loot, 3=Scent/Noise
export type BrushTool = 'inspect' | 'zombies' | 'survivors' | 'airdrop' | 'clear';

export const TILE_NAMES = [
  'Water',
  'Coast / Beach',
  'Grassland',
  'Forest',
  'Hill / Ridge',
  'Asphalt Road',
  'Town',
  'City',
  'Military Base',
  'Farmland',
  'Industrial',
  'Fortified Wall',
] as const;

export const SURVIVOR_STATES = [
  'Roaming',
  'Scavenging',
  'Fleeing',
  'Fighting',
  'Returning',
  'Guarding',
  'Raiding',
  'Shambling',
  'Chasing',
] as const;

export const TRAIT_NAMES = ['Scavenger', 'Builder', 'Fighter', 'Opportunist'] as const;
export const ETHOS_NAMES = ['Cooperative', 'Fortress', 'Raider'] as const;
export const TIER_NAMES = ['Ruins', 'Camp', 'Outpost', 'Safe Zone', 'Fortress'] as const;

const SETTLEMENT_PREFIXES = [
  'Elektro', 'Cherno', 'Berezino', 'Stary', 'Novy', 'Zeleno', 'Kamysh', 'Solnich',
  'Gorka', 'Vybor', 'Krasno', 'Severo', 'Pavlovo', 'Myshkino', 'Balota', 'Tisy',
];
const SETTLEMENT_SUFFIXES = [
  'Bastion', 'Haven', 'Watch', 'Crossing', 'Depot', 'Refuge', 'Hold', 'Reach',
];

export function settlementName(slot: number, seed: number): string {
  const idx = (slot * 7 + (seed % 16)) % SETTLEMENT_PREFIXES.length;
  const sfx = (slot * 3 + ((seed >> 3) % 8)) % SETTLEMENT_SUFFIXES.length;
  return `${SETTLEMENT_PREFIXES[idx]} ${SETTLEMENT_SUFFIXES[sfx]}`;
}

export interface SimParams {
  zombieSpeed: number;
  survivorSpeed: number;
  infectionChance: number;
  hungerRate: number;
  lootRespawnRate: number;
  hordeHearing: number;
  settlementGrowth: number;
  banditry: number;
  zombieMigration: number;
  initialSurvivors: number;
  initialZombies: number;
  cityDensity: number;
}

export const DEFAULT_PARAMS: SimParams = {
  zombieSpeed: 0.42,
  survivorSpeed: 0.56,
  infectionChance: 0.35,
  hungerRate: 1.0,
  lootRespawnRate: 1.0,
  hordeHearing: 1.0,
  settlementGrowth: 1.0,
  banditry: 0.22,
  zombieMigration: 0.2,
  initialSurvivors: 2500,
  initialZombies: 12000,
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
    description: '12,000 zombies, 2,500 survivors. Balanced scavenging, settlements, and hordes.',
    params: { ...DEFAULT_PARAMS },
  },
  {
    id: 'fast-infected',
    label: '28 Days Later',
    description: 'Sprinting infected, high bite contagion, high noise attraction.',
    params: {
      ...DEFAULT_PARAMS,
      zombieSpeed: 0.72,
      survivorSpeed: 0.62,
      infectionChance: 0.78,
      hordeHearing: 1.8,
      initialZombies: 10000,
      initialSurvivors: 3000,
    },
  },
  {
    id: 'walking-dead',
    label: 'Slow Walkers',
    description: 'Shuffling hordes, slow starvation, strong settlement growth.',
    params: {
      ...DEFAULT_PARAMS,
      zombieSpeed: 0.24,
      survivorSpeed: 0.54,
      infectionChance: 0.5,
      hungerRate: 0.6,
      settlementGrowth: 1.5,
      zombieMigration: 0.6,
      initialZombies: 15000,
      initialSurvivors: 2200,
    },
  },
  {
    id: 'raider-wasteland',
    label: 'Raider Wasteland',
    description: 'Scarce food, high banditry, frequent faction skirmishes.',
    params: {
      ...DEFAULT_PARAMS,
      lootRespawnRate: 0.35,
      hungerRate: 1.4,
      banditry: 0.75,
      initialZombies: 7000,
      initialSurvivors: 3600,
    },
  },
  {
    id: 'empty-frontier',
    label: 'Empty Frontier',
    description: 'Few zombies and small pioneer bands—great for painting your own experiments.',
    params: {
      ...DEFAULT_PARAMS,
      initialZombies: 1200,
      initialSurvivors: 800,
      zombieMigration: 0.0,
      settlementGrowth: 1.4,
    },
  },
];

export interface SimStats {
  tick: number;
  day: number;
  survivors: number;
  zombies: number;
  infected: number;
  settlements: number;
  totalDeaths: number;
  totalZombiesKilled: number;
  totalTurned: number;
  activeAgents: number;
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
  materials: number;
  colorCss: string;
  colorAbgr: number;
  kills: number;
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
  food: number;
  gear: number;
  scent: number;
  claimFactionId: number; // -1 if unclaimed
}

export interface AgentInspection {
  index: number;
  kind: 'survivor' | 'zombie';
  x: number;
  y: number;
  hp: number;
  hunger: number;
  gear: number;
  food: number;
  stateName: string;
  factionId: number; // -1 if none
  traitName: string;
  infection: number;
  age: number;
}

interface SimWasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  getCfgPtr(): number;
  getStatsPtr(): number;
  getEventsPtr(): number;
  getTileTypePtr(): number;
  getLootFoodPtr(): number;
  getLootGearPtr(): number;
  getFactionClaimPtr(): number;
  getScentHeatPtr(): number;
  getFrameRgbaPtr(): number;

  getFacActivePtr(): number;
  getFacLevelPtr(): number;
  getFacEthosPtr(): number;
  getFacXPtr(): number;
  getFacYPtr(): number;
  getFacPopPtr(): number;
  getFacFoodPtr(): number;
  getFacMatsPtr(): number;
  getFacColorPtr(): number;
  getFacKillsPtr(): number;
  getFacFoundedPtr(): number;

  getAgKindPtr(): number;
  getAgHpPtr(): number;
  getAgHungerPtr(): number;
  getAgGearPtr(): number;
  getAgFoodPtr(): number;
  getAgStatePtr(): number;
  getAgFactionPtr(): number;
  getAgTraitPtr(): number;
  getAgInfectionPtr(): number;
  getAgAgePtr(): number;
  getAgXPtr(): number;
  getAgYPtr(): number;

  generateWorld(seed: number): void;
  stepTicks(count: number): void;
  renderFrame(overlayMode: number, drawAgents: number): void;
  brushSpawnZombies(cx: number, cy: number, radius: number, count: number): void;
  brushSpawnSurvivors(cx: number, cy: number, radius: number, count: number): void;
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
  readonly lootFood: Uint8Array;
  readonly lootGear: Uint8Array;
  readonly factionClaim: Uint8Array;
  readonly scentHeat: Uint8Array;
  readonly frameRgba: Uint8ClampedArray;

  private readonly facActive: Uint8Array;
  private readonly facLevel: Uint8Array;
  private readonly facEthos: Uint8Array;
  private readonly facX: Uint16Array;
  private readonly facY: Uint16Array;
  private readonly facPop: Uint16Array;
  private readonly facFood: Float32Array;
  private readonly facMats: Float32Array;
  private readonly facColor: Uint32Array;
  private readonly facKills: Uint32Array;
  private readonly facFounded: Uint32Array;

  readonly agKind: Uint8Array;
  readonly agHp: Uint8Array;
  readonly agHunger: Uint8Array;
  readonly agGear: Uint8Array;
  readonly agFood: Uint8Array;
  readonly agState: Uint8Array;
  readonly agFaction: Uint8Array;
  readonly agTrait: Uint8Array;
  readonly agInfection: Uint8Array;
  readonly agAge: Uint16Array;
  readonly agX: Float32Array;
  readonly agY: Float32Array;

  seed = 1337;
  private lastEventRead = 0;

  constructor(instance: WebAssembly.Instance) {
    const ex = instance.exports as SimWasmExports;
    this.ex = ex;
    const buf = ex.memory.buffer;

    this.cfgView = new Float32Array(buf, ex.getCfgPtr(), 32);
    this.statsView = new Int32Array(buf, ex.getStatsPtr(), 16);
    this.eventsView = new Int32Array(buf, ex.getEventsPtr(), MAX_EVENTS * 4);

    this.tileType = new Uint8Array(buf, ex.getTileTypePtr(), GRID_N);
    this.lootFood = new Uint8Array(buf, ex.getLootFoodPtr(), GRID_N);
    this.lootGear = new Uint8Array(buf, ex.getLootGearPtr(), GRID_N);
    this.factionClaim = new Uint8Array(buf, ex.getFactionClaimPtr(), GRID_N);
    this.scentHeat = new Uint8Array(buf, ex.getScentHeatPtr(), GRID_N);
    this.frameRgba = new Uint8ClampedArray(buf, ex.getFrameRgbaPtr(), GRID_N * 4);

    this.facActive = new Uint8Array(buf, ex.getFacActivePtr(), MAX_FACTIONS);
    this.facLevel = new Uint8Array(buf, ex.getFacLevelPtr(), MAX_FACTIONS);
    this.facEthos = new Uint8Array(buf, ex.getFacEthosPtr(), MAX_FACTIONS);
    this.facX = new Uint16Array(buf, ex.getFacXPtr(), MAX_FACTIONS);
    this.facY = new Uint16Array(buf, ex.getFacYPtr(), MAX_FACTIONS);
    this.facPop = new Uint16Array(buf, ex.getFacPopPtr(), MAX_FACTIONS);
    this.facFood = new Float32Array(buf, ex.getFacFoodPtr(), MAX_FACTIONS);
    this.facMats = new Float32Array(buf, ex.getFacMatsPtr(), MAX_FACTIONS);
    this.facColor = new Uint32Array(buf, ex.getFacColorPtr(), MAX_FACTIONS);
    this.facKills = new Uint32Array(buf, ex.getFacKillsPtr(), MAX_FACTIONS);
    this.facFounded = new Uint32Array(buf, ex.getFacFoundedPtr(), MAX_FACTIONS);

    const maxAg = 32768;
    this.agKind = new Uint8Array(buf, ex.getAgKindPtr(), maxAg);
    this.agHp = new Uint8Array(buf, ex.getAgHpPtr(), maxAg);
    this.agHunger = new Uint8Array(buf, ex.getAgHungerPtr(), maxAg);
    this.agGear = new Uint8Array(buf, ex.getAgGearPtr(), maxAg);
    this.agFood = new Uint8Array(buf, ex.getAgFoodPtr(), maxAg);
    this.agState = new Uint8Array(buf, ex.getAgStatePtr(), maxAg);
    this.agFaction = new Uint8Array(buf, ex.getAgFactionPtr(), maxAg);
    this.agTrait = new Uint8Array(buf, ex.getAgTraitPtr(), maxAg);
    this.agInfection = new Uint8Array(buf, ex.getAgInfectionPtr(), maxAg);
    this.agAge = new Uint16Array(buf, ex.getAgAgePtr(), maxAg);
    this.agX = new Float32Array(buf, ex.getAgXPtr(), maxAg);
    this.agY = new Float32Array(buf, ex.getAgYPtr(), maxAg);
  }

  applyParams(p: SimParams): void {
    this.cfgView[0] = p.zombieSpeed;
    this.cfgView[1] = p.survivorSpeed;
    this.cfgView[2] = p.infectionChance;
    this.cfgView[3] = p.hungerRate;
    this.cfgView[4] = p.lootRespawnRate;
    this.cfgView[5] = p.hordeHearing;
    this.cfgView[6] = p.settlementGrowth;
    this.cfgView[7] = p.banditry;
    this.cfgView[8] = p.zombieMigration;
    this.cfgView[9] = p.initialSurvivors;
    this.cfgView[10] = p.initialZombies;
    this.cfgView[11] = p.cityDensity;
  }

  reset(seed: number, params: SimParams): void {
    this.seed = seed >>> 0 || 1;
    this.lastEventRead = 0;
    this.applyParams(params);
    this.ex.generateWorld(this.seed);
  }

  step(ticks: number): void {
    if (ticks > 0) this.ex.stepTicks(ticks);
  }

  renderFrame(overlay: OverlayMode, drawAgents: boolean): void {
    this.ex.renderFrame(overlay, drawAgents ? 1 : 0);
  }

  brushSpawnZombies(cx: number, cy: number, radius = 10, count = 150): void {
    this.ex.brushSpawnZombies(cx | 0, cy | 0, radius | 0, count | 0);
  }

  brushSpawnSurvivors(cx: number, cy: number, radius = 8, count = 40): void {
    this.ex.brushSpawnSurvivors(cx | 0, cy | 0, radius | 0, count | 0);
  }

  brushAirdrop(cx: number, cy: number, radius = 8): void {
    this.ex.brushAirdrop(cx | 0, cy | 0, radius | 0);
  }

  brushClear(cx: number, cy: number, radius = 12): void {
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
      survivors: s[2],
      zombies: s[3],
      infected: s[4],
      settlements: s[5],
      totalDeaths: s[6],
      totalZombiesKilled: s[7],
      totalTurned: s[8],
      activeAgents: s[10],
    };
  }

  readFactions(): FactionInfo[] {
    const out: FactionInfo[] = [];
    for (let f = 0; f < MAX_FACTIONS; f++) {
      if (this.facActive[f] === 0) continue;
      out.push({
        id: f,
        name: settlementName(f, this.seed),
        level: this.facLevel[f],
        ethos: this.facEthos[f],
        x: this.facX[f],
        y: this.facY[f],
        pop: this.facPop[f],
        food: Math.round(this.facFood[f]),
        materials: Math.round(this.facMats[f]),
        colorCss: abgrToCss(this.facColor[f]),
        colorAbgr: this.facColor[f],
        kills: this.facKills[f],
        foundedTick: this.facFounded[f],
      });
    }
    return out;
  }

  drainEvents(): SimEvent[] {
    const writeIdx = this.statsView[9];
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
      if (type === 1) text = `Day ${Math.floor(tick / 200)}: ${name} founded`;
      else if (type === 2) text = `Day ${Math.floor(tick / 200)}: ${name} upgraded to ${TIER_NAMES[argB] ?? 'Outpost'}`;
      else if (type === 3) text = `Day ${Math.floor(tick / 200)}: ${name} fell`;
      else if (type === 4) text = `Day ${Math.floor(tick / 200)}: Horde breached ${name}'s wall`;
      else if (type === 5) text = `Day ${Math.floor(tick / 200)}: ${name} launched a raid`;
      if (text) out.push({ tick, type, argA, argB, text });
    }
    this.lastEventRead = writeIdx;
    return out;
  }

  inspectTile(x: number, y: number): TileInspection {
    const tx = Math.max(0, Math.min(GRID_W - 1, Math.floor(x)));
    const ty = Math.max(0, Math.min(GRID_H - 1, Math.floor(y)));
    const idx = ty * GRID_W + tx;
    const t = this.tileType[idx];
    const claim = this.factionClaim[idx];
    return {
      x: tx,
      y: ty,
      tileType: t,
      tileName: TILE_NAMES[t] ?? 'Unknown',
      food: this.lootFood[idx],
      gear: this.lootGear[idx],
      scent: this.scentHeat[idx],
      claimFactionId: claim > 0 ? claim - 1 : -1,
    };
  }

  inspectAgent(idx: number): AgentInspection | null {
    if (idx < 0 || idx >= 32768) return null;
    const k = this.agKind[idx];
    if (k === 0) return null;
    const fac = this.agFaction[idx];
    return {
      index: idx,
      kind: k === 1 ? 'survivor' : 'zombie',
      x: this.agX[idx],
      y: this.agY[idx],
      hp: this.agHp[idx],
      hunger: this.agHunger[idx],
      gear: this.agGear[idx],
      food: this.agFood[idx],
      stateName: SURVIVOR_STATES[this.agState[idx]] ?? 'Idle',
      factionId: fac < MAX_FACTIONS ? fac : -1,
      traitName: TRAIT_NAMES[this.agTrait[idx]] ?? 'Survivor',
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
