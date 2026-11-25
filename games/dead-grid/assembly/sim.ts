// Dead Grid WASM Simulation Kernel (AssemblyScript, --runtime stub -O3)
// Supports dynamic grids (512, 768, 1024), up to 262,144 (256k) agents, 32 societies, 256 roving groups/packs.
// Zero heap allocations: every buffer and scratch array sits at a fixed linear memory address (< 25 MB = 400 pages).

export const MAX_GRID_DIM: i32 = 1024;
export const MAX_GRID_N: i32 = 1048576; // 1024 * 1024
export const MAX_HASH_DIM: i32 = 256;
export const MAX_HASH_N: i32 = 65536;   // 256 * 256
export const MAX_AGENTS: i32 = 262144;  // 256k
export const MAX_FACTIONS: i32 = 32;
export const MAX_GROUPS: i32 = 256;
export const MAX_EVENTS: i32 = 64;

// ---- Fixed Linear Memory Map (0x000000 .. 0x17D0000 < 25 MB) ----
const CFG_PTR: usize        = 0x008000; // 64 * f32 (256 B)
const STATS_PTR: usize      = 0x008100; // 32 * i32 (128 B)
const EVENTS_PTR: usize     = 0x008200; // 64 * 16 B (1024 B)

const FAC_ACTIVE: usize     = 0x008600; // 32 * u8
const FAC_LEVEL: usize      = 0x008620; // 32 * u8
const FAC_ETHOS: usize      = 0x008640; // 32 * u8
const FAC_X: usize          = 0x008660; // 32 * u16 (64 B)
const FAC_Y: usize          = 0x0086A0; // 32 * u16 (64 B)
const FAC_POP: usize        = 0x0086E0; // 32 * u16 (64 B)
const FAC_FOOD: usize       = 0x008720; // 32 * f32 (128 B)
const FAC_WATER: usize      = 0x0087A0; // 32 * f32 (128 B)
const FAC_MATS: usize       = 0x008820; // 32 * f32 (128 B)
const FAC_COLOR: usize      = 0x0088A0; // 32 * u32 (128 B)
const FAC_KILLS: usize      = 0x008920; // 32 * u32 (128 B)
const FAC_FOUNDED: usize    = 0x0089A0; // 32 * u32 (128 B)
const FAC_REL: usize        = 0x008A20; // 1024 * i8 (1024 B -> 0x008E20)

const GRP_ACTIVE: usize     = 0x008E20; // 256 * u8
const GRP_KIND: usize       = 0x008F20; // 256 * u8 (1=human group, 2=zombie pack, 3=wolf pack)
const GRP_X: usize          = 0x009020; // 256 * u16 (512 B)
const GRP_Y: usize          = 0x009220; // 256 * u16 (512 B)
const GRP_POP: usize        = 0x009420; // 256 * u16 (512 B)
const GRP_FOOD: usize       = 0x009620; // 256 * f32 (1024 B)
const GRP_WATER: usize      = 0x009A20; // 256 * f32 (1024 B -> 0x009E20)

const SCR_FAC_COUNTS: usize = 0x009E20; // 32 * i32 (128 B)
const SCR_GRP_COUNTS: usize = 0x009EA0; // 256 * i32 (1024 B)
const SCR_GRP_SX: usize     = 0x00A2A0; // 256 * f32 (1024 B)
const SCR_GRP_SY: usize     = 0x00A6A0; // 256 * f32 (1024 B)
const SCR_HUB_X: usize      = 0x00AAA0; // 96 * i32 (384 B)
const SCR_HUB_Y: usize      = 0x00AC20; // 96 * i32 (384 B -> 0x00ADA0)

const TILE_TYPE: usize      = 0x010000; // 1048576 * u8 (1 MB)
const ELEVATION: usize      = 0x110000; // 1048576 * u8 (1 MB)
const LOOT_FOOD: usize      = 0x210000; // 1048576 * u8 (1 MB)
const LOOT_WATER: usize     = 0x310000; // 1048576 * u8 (1 MB)
const LOOT_GEAR: usize      = 0x410000; // 1048576 * u8 (1 MB)
const FACTION_CLAIM: usize  = 0x510000; // 1048576 * u8 (1 MB)
const SCENT_HEAT: usize     = 0x610000; // 1048576 * u8 (1 MB)
const SCENT_SCRATCH: usize  = 0x710000; // 1048576 * u8 (1 MB)

const HASH_HEAD: usize      = 0x810000; // 65536 * i32 (256 KB)
const AG_NEXT: usize        = 0x850000; // 262144 * i32 (1 MB)

const AG_KIND: usize        = 0x950000; // 262144 * u8 (256 KB)
const AG_SUBKIND: usize     = 0x990000; // 262144 * u8
const AG_HP: usize          = 0x9D0000; // 262144 * u8
const AG_HUNGER: usize      = 0xA10000; // 262144 * u8
const AG_THIRST: usize      = 0xA50000; // 262144 * u8
const AG_ENERGY: usize      = 0xA90000; // 262144 * u8
const AG_INV_FOOD: usize    = 0xAD0000; // 262144 * u8
const AG_INV_WATER: usize   = 0xB10000; // 262144 * u8
const AG_INV_GEAR: usize    = 0xB50000; // 262144 * u8
const AG_INV_MEDS: usize    = 0xB90000; // 262144 * u8
const AG_INV_MATS: usize    = 0xBD0000; // 262144 * u8
const AG_STATE: usize       = 0xC10000; // 262144 * u8
const AG_SOCIAL: usize      = 0xC50000; // 262144 * u8 (0=solo, 1=group/pack, 2=society)
const AG_REP: usize         = 0xC90000; // 262144 * i8
const AG_COOLDOWN: usize    = 0xCD0000; // 262144 * u8
const AG_INFECTION: usize   = 0xD10000; // 262144 * u8
const AG_GROUP: usize       = 0xD50000; // 262144 * u16 (512 KB)
const AG_PERSONALITY: usize = 0xDD0000; // 262144 * u16 (512 KB)
const AG_AGE: usize         = 0xE50000; // 262144 * u16 (512 KB)
const AG_TARGET_X: usize    = 0xED0000; // 262144 * u16 (512 KB)
const AG_TARGET_Y: usize    = 0xF50000; // 262144 * u16 (512 KB)
const AG_X: usize           = 0xFD0000; // 262144 * f32 (1 MB)
const AG_Y: usize           = 0x10D0000; // 262144 * f32 (1 MB)
const AG_VX: usize          = 0x11D0000; // 262144 * f32 (1 MB)
const AG_VY: usize          = 0x12D0000; // 262144 * f32 (1 MB)

const FRAME_RGBA: usize     = 0x13D0000; // 1048576 * u32 (4 MB -> 0x17D0000)

// ---- Tile types ----
const TILE_WATER: u8      = 0;
const TILE_BEACH: u8      = 1;
const TILE_SWAMP: u8      = 2;
const TILE_GRASS: u8      = 3;
const TILE_FOREST: u8     = 4;
const TILE_HILL: u8       = 5;
const TILE_MOUNTAIN: u8   = 6;
const TILE_ROAD: u8       = 7;
const TILE_TOWN: u8       = 8;
const TILE_CITY: u8       = 9;
const TILE_MILITARY: u8   = 10;
const TILE_FARM: u8       = 11;
const TILE_INDUSTRIAL: u8 = 12;
const TILE_WALL: u8       = 13;

// ---- Agent kinds & subkinds ----
const KIND_DEAD: u8     = 0;
const KIND_HUMAN: u8    = 1;
const KIND_ZOMBIE: u8   = 2;
const KIND_ANIMAL: u8   = 3;

// Human archetypes (subkind)
const ARCH_SCAVENGER: u8 = 0;
const ARCH_BUILDER: u8   = 1;
const ARCH_GUARD: u8     = 2;
const ARCH_TRADER: u8    = 3;
const ARCH_RAIDER: u8    = 4;
const ARCH_NOMAD: u8     = 5;

// Zombie subkinds
const ZOM_WALKER: u8 = 0;
const ZOM_RUNNER: u8 = 1;
const ZOM_ALPHA: u8  = 2;

// Animal subkinds
const ANI_DEER: u8 = 0;
const ANI_WOLF: u8 = 1;
const ANI_BOAR: u8 = 2;

// Social tiers
const SOC_SOLO: u8    = 0;
const SOC_GROUP: u8   = 1;
const SOC_SOCIETY: u8 = 2;

// Agent states
const STATE_ROAM: u8     = 0;
const STATE_SCAVENGE: u8 = 1;
const STATE_FLEE: u8     = 2;
const STATE_FIGHT: u8    = 3;
const STATE_RETURN: u8   = 4;
const STATE_GUARD: u8    = 5;
const STATE_RAID: u8     = 6;
const STATE_SHAMBLE: u8  = 7;
const STATE_CHASE: u8    = 8;
const STATE_GRAZE: u8    = 9;
const STATE_HUNT: u8     = 10;
const STATE_TRADE: u8    = 11;

// Faction Ethos
const ETHOS_COOP: u8   = 0;
const ETHOS_FORT: u8   = 1;
const ETHOS_RAIDER: u8 = 2;

// Config indices (f32[64])
const CFG_ZOMBIE_SPEED: i32      = 0;
const CFG_HUMAN_SPEED: i32       = 1;
const CFG_ANIMAL_SPEED: i32      = 2;
const CFG_INFECTION_CHANCE: i32  = 3;
const CFG_HUNGER_RATE: i32       = 4;
const CFG_THIRST_RATE: i32       = 5;
const CFG_LOOT_RESPAWN: i32      = 6;
const CFG_HORDE_HEARING: i32     = 7;
const CFG_SETTLEMENT_GROWTH: i32 = 8;
const CFG_BANDITRY: i32          = 9;
const CFG_COOP_BIAS: i32         = 10;
const CFG_ZOMBIE_MIGRATION: i32  = 11;
const CFG_INIT_HUMANS: i32       = 12;
const CFG_INIT_ZOMBIES: i32      = 13;
const CFG_INIT_ANIMALS: i32      = 14;
const CFG_CITY_DENSITY: i32      = 15;

// Stats indices (i32[32])
const ST_TICK: i32           = 0;
const ST_DAY: i32            = 1;
const ST_HUMANS: i32         = 2;
const ST_ZOMBIES: i32        = 3;
const ST_ANIMALS: i32        = 4;
const ST_INFECTED: i32       = 5;
const ST_SOLO_HUMANS: i32    = 6;
const ST_GROUP_HUMANS: i32   = 7;
const ST_SOC_HUMANS: i32     = 8;
const ST_SETTLEMENTS: i32    = 9;
const ST_ZOMBIE_PACKS: i32   = 10;
const ST_DEATHS: i32         = 11;
const ST_ZKILLS: i32         = 12;
const ST_TURNED: i32         = 13;
const ST_PD_COOPS: i32       = 14;
const ST_PD_DEFECTS: i32     = 15;
const ST_PD_MUTUAL_COOP: i32 = 16;
const ST_PD_BETRAYALS: i32   = 17;
const ST_AVG_FOOD: i32       = 18;
const ST_AVG_WATER: i32      = 19;
const ST_AVG_GEAR: i32       = 20;
const ST_EVENT_IDX: i32      = 21;
const ST_ACTIVE_AG: i32      = 22;
const ST_GRID_W: i32         = 23;
const ST_GRID_H: i32         = 24;

// Event types
const EVT_FOUNDED: i32      = 1;
const EVT_UPGRADED: i32     = 2;
const EVT_FALLEN: i32       = 3;
const EVT_HORDE_BREACH: i32 = 4;
const EVT_RAID: i32         = 5;
const EVT_GROUP_FORMED: i32 = 6;

// ---- Pointer getters ----
export function getCfgPtr(): usize { return CFG_PTR; }
export function getStatsPtr(): usize { return STATS_PTR; }
export function getEventsPtr(): usize { return EVENTS_PTR; }
export function getTileTypePtr(): usize { return TILE_TYPE; }
export function getElevationPtr(): usize { return ELEVATION; }
export function getLootFoodPtr(): usize { return LOOT_FOOD; }
export function getLootWaterPtr(): usize { return LOOT_WATER; }
export function getLootGearPtr(): usize { return LOOT_GEAR; }
export function getFactionClaimPtr(): usize { return FACTION_CLAIM; }
export function getScentHeatPtr(): usize { return SCENT_HEAT; }
export function getFrameRgbaPtr(): usize { return FRAME_RGBA; }

export function getFacActivePtr(): usize { return FAC_ACTIVE; }
export function getFacLevelPtr(): usize { return FAC_LEVEL; }
export function getFacEthosPtr(): usize { return FAC_ETHOS; }
export function getFacXPtr(): usize { return FAC_X; }
export function getFacYPtr(): usize { return FAC_Y; }
export function getFacPopPtr(): usize { return FAC_POP; }
export function getFacFoodPtr(): usize { return FAC_FOOD; }
export function getFacWaterPtr(): usize { return FAC_WATER; }
export function getFacMatsPtr(): usize { return FAC_MATS; }
export function getFacColorPtr(): usize { return FAC_COLOR; }
export function getFacKillsPtr(): usize { return FAC_KILLS; }
export function getFacFoundedPtr(): usize { return FAC_FOUNDED; }

export function getAgKindPtr(): usize { return AG_KIND; }
export function getAgSubkindPtr(): usize { return AG_SUBKIND; }
export function getAgHpPtr(): usize { return AG_HP; }
export function getAgHungerPtr(): usize { return AG_HUNGER; }
export function getAgThirstPtr(): usize { return AG_THIRST; }
export function getAgEnergyPtr(): usize { return AG_ENERGY; }
export function getAgInvFoodPtr(): usize { return AG_INV_FOOD; }
export function getAgInvWaterPtr(): usize { return AG_INV_WATER; }
export function getAgInvGearPtr(): usize { return AG_INV_GEAR; }
const AG_INV_MEDS_EXP: usize = AG_INV_MEDS;
export function getAgInvMedsPtr(): usize { return AG_INV_MEDS_EXP; }
export function getAgInvMatsPtr(): usize { return AG_INV_MATS; }
export function getAgStatePtr(): usize { return AG_STATE; }
export function getAgSocialPtr(): usize { return AG_SOCIAL; }
export function getAgGroupPtr(): usize { return AG_GROUP; }
export function getAgPersonalityPtr(): usize { return AG_PERSONALITY; }
export function getAgRepPtr(): usize { return AG_REP; }
export function getAgInfectionPtr(): usize { return AG_INFECTION; }
export function getAgAgePtr(): usize { return AG_AGE; }
export function getAgXPtr(): usize { return AG_X; }
export function getAgYPtr(): usize { return AG_Y; }

// ---- Global runtime state ----
let gridW: i32 = 512;
let gridH: i32 = 512;
let gridN: i32 = 262144;
let hashW: i32 = 128;
let hashH: i32 = 128;
let hashN: i32 = 16384;

let rngState: u32 = 0x12345678;
let worldSeed: u32 = 1337;
let activeLimit: i32 = 0;
let freeCursor: i32 = 0;

@inline function randU32(): u32 {
  let x = rngState;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  rngState = x;
  return x;
}

@inline function randF(): f32 {
  return <f32>(randU32() & 0x00FFFFFF) / 16777216.0;
}

@inline function randInt(n: i32): i32 {
  if (n <= 1) return 0;
  return <i32>(randU32() % <u32>n);
}

@inline function cfg(idx: i32): f32 {
  return load<f32>(CFG_PTR + (<usize>idx << 2));
}

@inline function stat(idx: i32): i32 {
  return load<i32>(STATS_PTR + (<usize>idx << 2));
}

@inline function setStat(idx: i32, val: i32): void {
  store<i32>(STATS_PTR + (<usize>idx << 2), val);
}

@inline function addStat(idx: i32, delta: i32): void {
  const ptr = STATS_PTR + (<usize>idx << 2);
  store<i32>(ptr, load<i32>(ptr) + delta);
}

function pushEvent(type: i32, argA: i32, argB: i32): void {
  const idx = stat(ST_EVENT_IDX);
  const slot = idx & (MAX_EVENTS - 1);
  const base = EVENTS_PTR + (<usize>slot << 4);
  store<i32>(base, stat(ST_TICK));
  store<i32>(base + 4, type);
  store<i32>(base + 8, argA);
  store<i32>(base + 12, argB);
  setStat(ST_EVENT_IDX, idx + 1);
}

@inline function clampI(v: i32, lo: i32, hi: i32): i32 {
  return v < lo ? lo : (v > hi ? hi : v);
}

@inline function clampF(v: f32, lo: f32, hi: f32): f32 {
  return v < lo ? lo : (v > hi ? hi : v);
}

@inline function tileAt(tx: i32, ty: i32): u8 {
  return load<u8>(TILE_TYPE + <usize>(ty * gridW + tx));
}

@inline function setTile(tx: i32, ty: i32, t: u8): void {
  store<u8>(TILE_TYPE + <usize>(ty * gridW + tx), t);
}

@inline function elevAt(tx: i32, ty: i32): i32 {
  return <i32>load<u8>(ELEVATION + <usize>(ty * gridW + tx));
}

@inline function isPassable(t: u8): bool {
  return t != TILE_WATER && t != TILE_WALL && t != TILE_MOUNTAIN;
}

function factionPalette(slot: i32): u32 {
  switch (slot & 15) {
    case 0:  return 0xFFF59B53;
    case 1:  return 0xFF53C2E6;
    case 2:  return 0xFF83D167;
    case 3:  return 0xFFE582B0;
    case 4:  return 0xFF6BA8FF;
    case 5:  return 0xFFD4CC4D;
    case 6:  return 0xFF9C72F2;
    case 7:  return 0xFF6EE0C9;
    case 8:  return 0xFFE6B08E;
    case 9:  return 0xFF7094D9;
    case 10: return 0xFFC4E096;
    case 11: return 0xFFD990CC;
    case 12: return 0xFF78D6E6;
    case 13: return 0xFFA38CE6;
    case 14: return 0xFF88D4A8;
    default: return 0xFFF0D4A8;
  }
}

// ---- Noise & Topography ----
@inline function hash2(ix: i32, iy: i32, seed: u32): f32 {
  let h: u32 = (<u32>ix * 374761393) + (<u32>iy * 668265263) + seed * 1442695041;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return <f32>(h & 0xFFFF) / 65535.0;
}

function valueNoise(x: f32, y: f32, seed: u32): f32 {
  const ix = <i32>Mathf.floor(x);
  const iy = <i32>Mathf.floor(y);
  const fx = x - <f32>ix;
  const fy = y - <f32>iy;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return (a * (1.0 - ux) + b * ux) * (1.0 - uy) + (c * (1.0 - ux) + d * ux) * uy;
}

function fbm(x: f32, y: f32, seed: u32): f32 {
  let sum: f32 = 0.0;
  let amp: f32 = 0.5;
  let freq: f32 = 1.0;
  for (let i = 0; i < 4; i++) {
    sum += valueNoise(x * freq, y * freq, seed + <u32>(i * 97)) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

function ridged(x: f32, y: f32, seed: u32): f32 {
  let sum: f32 = 0.0;
  let amp: f32 = 0.55;
  let freq: f32 = 1.0;
  for (let i = 0; i < 3; i++) {
    const n = valueNoise(x * freq, y * freq, seed + <u32>(i * 131));
    const r: f32 = 1.0 - Mathf.abs(n * 2.0 - 1.0);
    sum += r * r * amp;
    freq *= 2.1;
    amp *= 0.5;
  }
  return sum;
}

function stampZone(cx: i32, cy: i32, rx: i32, ry: i32, t: u8): void {
  const x0 = clampI(cx - rx, 1, gridW - 2);
  const x1 = clampI(cx + rx, 1, gridW - 2);
  const y0 = clampI(cy - ry, 1, gridH - 2);
  const y1 = clampI(cy + ry, 1, gridH - 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = y * gridW + x;
      const cur = load<u8>(TILE_TYPE + <usize>idx);
      if (cur == TILE_WATER || cur == TILE_MOUNTAIN) continue;
      const dx = <f32>(x - cx) / <f32>Mathf.max(1.0, <f32>rx);
      const dy = <f32>(y - cy) / <f32>Mathf.max(1.0, <f32>ry);
      if (dx * dx + dy * dy <= 1.0) {
        store<u8>(TILE_TYPE + <usize>idx, t);
      }
    }
  }
}

function drawRoad(x0: i32, y0: i32, x1: i32, y1: i32): void {
  const steps = <i32>Mathf.max(<f32>abs(x1 - x0), <f32>abs(y1 - y0)) + 1;
  for (let s = 0; s <= steps; s++) {
    const t = <f32>s / <f32>Mathf.max(1.0, <f32>steps);
    const wx = <i32>(<f32>x0 + <f32>(x1 - x0) * t + Mathf.sin(t * 6.283) * 4.0);
    const wy = <i32>(<f32>y0 + <f32>(y1 - y0) * t + Mathf.cos(t * 5.0) * 4.0);
    const cx = clampI(wx, 1, gridW - 2);
    const cy = clampI(wy, 1, gridH - 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (abs(dx) + abs(dy) > 1) continue;
        const nx = clampI(cx + dx, 1, gridW - 2);
        const ny = clampI(cy + dy, 1, gridH - 2);
        const cur = tileAt(nx, ny);
        if (cur != TILE_WATER && cur != TILE_CITY && cur != TILE_MILITARY && cur != TILE_MOUNTAIN) {
          setTile(nx, ny, TILE_ROAD);
        }
      }
    }
  }
}

function carveRiver(startX: i32, startY: i32, width: i32): void {
  let rx: f32 = <f32>startX;
  let ry: f32 = <f32>startY;
  for (let step = 0; step < gridH + 120; step++) {
    const cx = clampI(<i32>rx, 2, gridW - 3);
    const cy = clampI(<i32>ry, 2, gridH - 3);
    for (let dy = -width; dy <= width; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        if (dx * dx + dy * dy > width * width) continue;
        const nx = clampI(cx + dx, 1, gridW - 2);
        const ny = clampI(cy + dy, 1, gridH - 2);
        setTile(nx, ny, TILE_WATER);
      }
    }
    // Flow downhill toward lowest neighbor or southward
    let bestDx: f32 = (randF() - 0.5) * 0.8;
    let bestDy: f32 = 0.85;
    let lowest = elevAt(cx, cy);
    for (let ndy = -1; ndy <= 2; ndy++) {
      for (let ndx = -2; ndx <= 2; ndx++) {
        const nx = clampI(cx + ndx, 1, gridW - 2);
        const ny = clampI(cy + ndy, 1, gridH - 2);
        const e = elevAt(nx, ny);
        if (e < lowest) {
          lowest = e;
          bestDx = <f32>ndx * 0.45;
          bestDy = <f32>ndy * 0.45 + 0.35;
        }
      }
    }
    rx += bestDx;
    ry += bestDy;
    if (ry >= <f32>(gridH - 3)) break;
  }
}

@inline function packPersonality(coop: i32, brave: i32, greed: i32, trust: i32): u16 {
  return <u16>((coop & 15) | ((brave & 15) << 4) | ((greed & 15) << 8) | ((trust & 15) << 12));
}

function spawnAgent(
  kind: u8,
  subkind: u8,
  x: f32,
  y: f32,
  hp: u8,
  hunger: u8,
  thirst: u8,
  food: u8,
  water: u8,
  gear: u8,
  meds: u8,
  mats: u8,
  social: u8,
  group: u16,
  personality: u16,
): i32 {
  let slot = -1;
  // Fast cursor scan for dead slots
  for (let probe = 0; probe < 128 && freeCursor < activeLimit; probe++) {
    if (load<u8>(AG_KIND + <usize>freeCursor) == KIND_DEAD) {
      slot = freeCursor;
      freeCursor++;
      break;
    }
    freeCursor++;
  }
  if (slot < 0) {
    if (activeLimit < MAX_AGENTS) {
      slot = activeLimit++;
    } else {
      // Full scan fallback
      for (let i = 0; i < MAX_AGENTS; i++) {
        if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) {
          slot = i;
          break;
        }
      }
    }
  }
  if (slot < 0) return -1;

  const u = <usize>slot;
  store<u8>(AG_KIND + u, kind);
  store<u8>(AG_SUBKIND + u, subkind);
  store<u8>(AG_HP + u, hp);
  store<u8>(AG_HUNGER + u, hunger);
  store<u8>(AG_THIRST + u, thirst);
  store<u8>(AG_ENERGY + u, 100);
  store<u8>(AG_INV_FOOD + u, food);
  store<u8>(AG_INV_WATER + u, water);
  store<u8>(AG_INV_GEAR + u, gear);
  store<u8>(AG_INV_MEDS + u, meds);
  store<u8>(AG_INV_MATS + u, mats);
  store<u8>(AG_STATE + u, kind == KIND_ZOMBIE ? STATE_SHAMBLE : (kind == KIND_ANIMAL ? STATE_GRAZE : STATE_ROAM));
  store<u8>(AG_SOCIAL + u, social);
  store<i8>(AG_REP + u, 0);
  store<u8>(AG_COOLDOWN + u, <u8>randInt(8));
  store<u8>(AG_INFECTION + u, 0);
  store<u16>(AG_GROUP + (u << 1), group);
  store<u16>(AG_PERSONALITY + (u << 1), personality);
  store<u16>(AG_AGE + (u << 1), 0);
  store<u16>(AG_TARGET_X + (u << 1), <u16>clampI(<i32>x, 0, gridW - 1));
  store<u16>(AG_TARGET_Y + (u << 1), <u16>clampI(<i32>y, 0, gridH - 1));
  store<f32>(AG_X + (u << 2), x);
  store<f32>(AG_Y + (u << 2), y);
  store<f32>(AG_VX + (u << 2), 0.0);
  store<f32>(AG_VY + (u << 2), 0.0);
  return slot;
}

function findSpawnTile(preferA: u8, preferB: u8): i32 {
  for (let attempt = 0; attempt < 36; attempt++) {
    const x = 4 + randInt(gridW - 8);
    const y = 4 + randInt(gridH - 8);
    const t = tileAt(x, y);
    if (!isPassable(t)) continue;
    if (attempt < 24 && t != preferA && t != preferB) continue;
    return y * gridW + x;
  }
  for (let attempt = 0; attempt < 64; attempt++) {
    const x = 4 + randInt(gridW - 8);
    const y = 4 + randInt(gridH - 8);
    if (isPassable(tileAt(x, y))) return y * gridW + x;
  }
  return (gridH >> 1) * gridW + (gridW >> 1);
}

export function generateWorld(seed: u32, size: i32, waterStyle: i32): void {
  const dim = size >= 1024 ? 1024 : (size >= 768 ? 768 : 512);
  gridW = dim;
  gridH = dim;
  gridN = dim * dim;
  hashW = dim >> 2;
  hashH = dim >> 2;
  hashN = hashW * hashH;

  worldSeed = seed == 0 ? 1 : seed;
  rngState = worldSeed * 1664525 + 1013904223;
  if (rngState == 0) rngState = 0x9E3779B9;

  // Clear state tables
  memory.fill(STATS_PTR, 0, 128);
  memory.fill(EVENTS_PTR, 0, MAX_EVENTS * 16);
  memory.fill(FAC_ACTIVE, 0, 0x0820);
  memory.fill(GRP_ACTIVE, 0, 0x1000);
  memory.fill(FACTION_CLAIM, 0, <usize>gridN);
  memory.fill(SCENT_HEAT, 0, <usize>gridN);
  memory.fill(SCENT_SCRATCH, 0, <usize>gridN);
  memory.fill(AG_KIND, 0, MAX_AGENTS);
  activeLimit = 0;
  freeCursor = 0;

  setStat(ST_GRID_W, gridW);
  setStat(ST_GRID_H, gridH);

  // 1. Topography + Water Style generation
  const scale = <f32>dim / 4.5;
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const idx = y * gridW + x;
      const nx = <f32>x / scale;
      const ny = <f32>y / scale;
      let elev = fbm(nx, ny, worldSeed) * 0.65 + ridged(nx * 0.85, ny * 0.85, worldSeed + 313) * 0.35;
      const moisture = fbm(nx * 1.4 + 17.3, ny * 1.4 + 9.1, worldSeed + 777);

      let waterLevel: f32 = 0.30;
      if (waterStyle == 0) {
        // Coastal Mainland (Chernarus style south/east sea)
        const southDist = <f32>(gridH - 1 - y);
        const eastDist = <f32>(gridW - 1 - x);
        const coastDist = Mathf.min(southDist, eastDist) + (elev - 0.5) * 42.0;
        if (coastDist < 22.0) elev *= 0.25;
        waterLevel = 0.27;
      } else if (waterStyle == 1) {
        // River Valleys (inland basins + lakes)
        waterLevel = 0.34;
      } else if (waterStyle == 2) {
        // Archipelago (high water level, island chains)
        waterLevel = 0.48;
      } else {
        // Arid Basin (low water, rare oasis lakes)
        waterLevel = 0.20;
      }

      const elevByte = <u8>clampI(<i32>(elev * 255.0), 0, 255);
      store<u8>(ELEVATION + <usize>idx, elevByte);

      let tile: u8 = TILE_GRASS;
      if (elev < waterLevel) {
        tile = TILE_WATER;
      } else if (elev < waterLevel + 0.035) {
        tile = TILE_BEACH;
      } else if (elev < waterLevel + 0.085 && moisture > 0.58) {
        tile = TILE_SWAMP;
      } else if (elev > 0.79) {
        tile = TILE_MOUNTAIN;
      } else if (elev > 0.65) {
        tile = TILE_HILL;
      } else if (moisture > 0.54 || (elev > 0.52 && moisture > 0.46)) {
        tile = TILE_FOREST;
      }
      store<u8>(TILE_TYPE + <usize>idx, tile);
    }
  }

  // Carve rivers based on waterStyle
  const numRivers = waterStyle == 1 ? 3 : (waterStyle == 0 ? 2 : (waterStyle == 3 ? 1 : 0));
  for (let r = 0; r < numRivers; r++) {
    const sx = 24 + randInt(gridW - 48);
    carveRiver(sx, 2, 1 + (dim >= 768 ? 1 : 0));
  }

  // 2. Cities, towns, military bases, industrial & farms
  const density = clampF(cfg(CFG_CITY_DENSITY), 0.3, 2.0) * (<f32>dim / 512.0);
  const numCities = clampI(<i32>(6.0 * density), 3, 18);
  const numTowns = clampI(<i32>(14.0 * density), 6, 40);
  const numMil = clampI(<i32>(5.0 * density), 2, 16);

  let hubCount = 0;
  for (let i = 0; i < numCities; i++) {
    const pos = findSpawnTile(TILE_GRASS, TILE_BEACH);
    const cx = pos % gridW;
    const cy = pos / gridW;
    const rad = 11 + randInt(8);
    stampZone(cx, cy, rad, rad - 2 + randInt(4), TILE_CITY);
    stampZone(cx + rad - 2, cy + 3, 6, 5, TILE_INDUSTRIAL);
    if (hubCount < 96) {
      store<i32>(SCR_HUB_X + (<usize>hubCount << 2), cx);
      store<i32>(SCR_HUB_Y + (<usize>hubCount << 2), cy);
      hubCount++;
    }
  }

  for (let i = 0; i < numTowns; i++) {
    const pos = findSpawnTile(TILE_GRASS, TILE_FOREST);
    const cx = pos % gridW;
    const cy = pos / gridW;
    stampZone(cx, cy, 6 + randInt(4), 5 + randInt(4), TILE_TOWN);
    stampZone(cx + 7, cy - 4, 5, 4, TILE_FARM);
    if (hubCount < 96) {
      store<i32>(SCR_HUB_X + (<usize>hubCount << 2), cx);
      store<i32>(SCR_HUB_Y + (<usize>hubCount << 2), cy);
      hubCount++;
    }
  }

  for (let i = 0; i < numMil; i++) {
    const pos = findSpawnTile(TILE_HILL, TILE_FOREST);
    const cx = pos % gridW;
    const cy = pos / gridW;
    stampZone(cx, cy, 8 + randInt(3), 7 + randInt(3), TILE_MILITARY);
    if (hubCount < 96) {
      store<i32>(SCR_HUB_X + (<usize>hubCount << 2), cx);
      store<i32>(SCR_HUB_Y + (<usize>hubCount << 2), cy);
      hubCount++;
    }
  }

  // 3. Connect hubs with roads
  for (let i = 0; i < hubCount; i++) {
    const hx = load<i32>(SCR_HUB_X + (<usize>i << 2));
    const hy = load<i32>(SCR_HUB_Y + (<usize>i << 2));
    let bestA = -1;
    let bestDistA = 99999999;
    let bestB = -1;
    let bestDistB = 99999999;
    for (let j = 0; j < hubCount; j++) {
      if (i == j) continue;
      const dx = load<i32>(SCR_HUB_X + (<usize>j << 2)) - hx;
      const dy = load<i32>(SCR_HUB_Y + (<usize>j << 2)) - hy;
      const d = dx * dx + dy * dy;
      if (d < bestDistA) {
        bestDistB = bestDistA; bestB = bestA;
        bestDistA = d; bestA = j;
      } else if (d < bestDistB) {
        bestDistB = d; bestB = j;
      }
    }
    if (bestA >= 0) {
      drawRoad(hx, hy, load<i32>(SCR_HUB_X + (<usize>bestA << 2)), load<i32>(SCR_HUB_Y + (<usize>bestA << 2)));
    }
    if (bestB >= 0 && randInt(2) == 0) {
      drawRoad(hx, hy, load<i32>(SCR_HUB_X + (<usize>bestB << 2)), load<i32>(SCR_HUB_Y + (<usize>bestB << 2)));
    }
  }

  // 4. Seed initial Food, Water, and Gear loot
  for (let i = 0; i < gridN; i++) {
    const t = load<u8>(TILE_TYPE + <usize>i);
    let f: u8 = 0;
    let w: u8 = 0;
    let g: u8 = 0;
    const r = randU32() & 255;
    if (t == TILE_CITY) {
      if (r < 95) f = <u8>(18 + (r & 31));
      if (r < 80) w = <u8>(16 + (r & 31));
      if (r < 70) g = <u8>(14 + (r & 31));
    } else if (t == TILE_TOWN) {
      if (r < 90) f = <u8>(20 + (r & 31));
      if (r < 85) w = <u8>(18 + (r & 31));
      if (r < 48) g = <u8>(10 + (r & 15));
    } else if (t == TILE_FARM) {
      if (r < 140) f = <u8>(32 + (r & 31));
      if (r < 60) w = <u8>(15 + (r & 15));
    } else if (t == TILE_MILITARY) {
      if (r < 45) f = <u8>(15 + (r & 15));
      if (r < 150) g = <u8>(45 + (r & 63));
    } else if (t == TILE_INDUSTRIAL) {
      if (r < 100) g = <u8>(24 + (r & 31));
    } else if (t == TILE_BEACH || t == TILE_SWAMP) {
      if (r < 110) w = <u8>(25 + (r & 31));
      if (r < 25) f = 10;
    } else if (t == TILE_FOREST && r < 24) {
      f = 12;
    }
    store<u8>(LOOT_FOOD + <usize>i, f);
    store<u8>(LOOT_WATER + <usize>i, w);
    store<u8>(LOOT_GEAR + <usize>i, g);
  }

  // 5. Spawn Zombies (with packs), Humans (with personalities & archetypes), and Wild Animals
  const initZ = clampI(<i32>cfg(CFG_INIT_ZOMBIES), 0, 220000);
  const initH = clampI(<i32>cfg(CFG_INIT_HUMANS), 0, 120000);
  const initA = clampI(<i32>cfg(CFG_INIT_ANIMALS), 0, 60000);

  const coopBias = cfg(CFG_COOP_BIAS);
  const banditProb = cfg(CFG_BANDITRY);

  for (let i = 0; i < initZ; i++) {
    const pos = i % 5 == 0
      ? findSpawnTile(TILE_GRASS, TILE_ROAD)
      : findSpawnTile(TILE_CITY, TILE_TOWN);
    const zx = <f32>(pos % gridW) + randF();
    const zy = <f32>(pos / gridW) + randF();
    const sub: u8 = i % 15 == 0 ? ZOM_ALPHA : (i % 4 == 0 ? ZOM_RUNNER : ZOM_WALKER);
    spawnAgent(KIND_ZOMBIE, sub, zx, zy, <u8>(75 + randInt(40)), 60, 60, 0, 0, 0, 0, 0, SOC_SOLO, 0xFFFF, 0);
  }

  for (let i = 0; i < initH; i++) {
    const pos = i % 3 == 0
      ? findSpawnTile(TILE_BEACH, TILE_ROAD)
      : findSpawnTile(TILE_GRASS, TILE_TOWN);
    const hx = <f32>(pos % gridW) + randF();
    const hy = <f32>(pos / gridW) + randF();
    const isRaider = randF() < banditProb;
    const arch: u8 = isRaider ? ARCH_RAIDER : <u8>randInt(6);
    const coop = clampI(<i32>((randF() * 0.7 + coopBias * 0.45) * 15.0) - (isRaider ? 5 : 0), 0, 15);
    const brave = randInt(16);
    const greed = isRaider ? 10 + randInt(6) : randInt(13);
    const trust = clampI(<i32>((randF() * 0.7 + coopBias * 0.35) * 15.0), 0, 15);
    spawnAgent(
      KIND_HUMAN,
      arch,
      hx,
      hy,
      100,
      <u8>(78 + randInt(22)),
      <u8>(78 + randInt(22)),
      <u8>(2 + randInt(4)),
      <u8>(2 + randInt(4)),
      <u8>(8 + randInt(18)),
      <u8>randInt(2),
      <u8>randInt(3),
      SOC_SOLO,
      0xFFFF,
      packPersonality(coop, brave, greed, trust),
    );
  }

  for (let i = 0; i < initA; i++) {
    const pos = findSpawnTile(TILE_FOREST, TILE_GRASS);
    const ax = <f32>(pos % gridW) + randF();
    const ay = <f32>(pos / gridW) + randF();
    const sub: u8 = i % 5 == 0 ? ANI_WOLF : (i % 3 == 0 ? ANI_BOAR : ANI_DEER);
    spawnAgent(
      KIND_ANIMAL,
      sub,
      ax,
      ay,
      <u8>(sub == ANI_BOAR ? 70 : 50),
      <u8>(75 + randInt(25)),
      <u8>(75 + randInt(25)),
      0, 0, 0, 0, 0,
      SOC_SOLO,
      0xFFFF,
      0,
    );
  }

  recountAll();
}

function rebuildSpatialHash(): void {
  memory.fill(HASH_HEAD, 0xFF, <usize>(hashN << 2));
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) continue;
    const x = clampI(<i32>load<f32>(AG_X + (<usize>i << 2)), 0, gridW - 1);
    const y = clampI(<i32>load<f32>(AG_Y + (<usize>i << 2)), 0, gridH - 1);
    const b = (y >> 2) * hashW + (x >> 2);
    const headPtr = HASH_HEAD + (<usize>b << 2);
    store<i32>(AG_NEXT + (<usize>i << 2), load<i32>(headPtr));
    store<i32>(headPtr, i);
  }
}

@inline function addScent(tx: i32, ty: i32, amount: i32): void {
  const ptr = SCENT_HEAT + <usize>(ty * gridW + tx);
  const cur = <i32>load<u8>(ptr) + amount;
  store<u8>(ptr, <u8>(cur > 255 ? 255 : cur));
}

function updateScentAndLoot(tick: i32): void {
  if ((tick & 3) == 0) {
    for (let y = 1; y < gridH - 1; y++) {
      const row = y * gridW;
      for (let x = 1; x < gridW - 1; x++) {
        const idx = row + x;
        const c = <i32>load<u8>(SCENT_HEAT + <usize>idx);
        const n = <i32>load<u8>(SCENT_HEAT + <usize>(idx - gridW));
        const s = <i32>load<u8>(SCENT_HEAT + <usize>(idx + gridW));
        const w = <i32>load<u8>(SCENT_HEAT + <usize>(idx - 1));
        const e = <i32>load<u8>(SCENT_HEAT + <usize>(idx + 1));
        const mixed = ((c * 4 + n + s + w + e) >> 3) - 2;
        store<u8>(SCENT_SCRATCH + <usize>idx, <u8>(mixed > 0 ? mixed : 0));
      }
    }
    memory.copy(SCENT_HEAT, SCENT_SCRATCH, <usize>gridN);
  }

  const respawnRate = cfg(CFG_LOOT_RESPAWN);
  if (respawnRate > 0.01) {
    const stride = 128;
    const phase = tick & 127;
    const prob = <i32>(respawnRate * 40.0);
    for (let i = phase; i < gridN; i += stride) {
      if (<i32>(randU32() & 255) >= prob) continue;
      const t = load<u8>(TILE_TYPE + <usize>i);
      if (t == TILE_FARM) {
        const curF = load<u8>(LOOT_FOOD + <usize>i);
        if (curF < 55) store<u8>(LOOT_FOOD + <usize>i, curF + 10);
      } else if (t == TILE_TOWN || t == TILE_CITY) {
        const curF = load<u8>(LOOT_FOOD + <usize>i);
        if (curF < 36) store<u8>(LOOT_FOOD + <usize>i, curF + 6);
        const curW = load<u8>(LOOT_WATER + <usize>i);
        if (curW < 36) store<u8>(LOOT_WATER + <usize>i, curW + 6);
        const curG = load<u8>(LOOT_GEAR + <usize>i);
        if (curG < 28) store<u8>(LOOT_GEAR + <usize>i, curG + 4);
      } else if (t == TILE_MILITARY || t == TILE_INDUSTRIAL) {
        const curG = load<u8>(LOOT_GEAR + <usize>i);
        if (curG < 80) store<u8>(LOOT_GEAR + <usize>i, curG + 12);
      } else if (t == TILE_BEACH || t == TILE_SWAMP) {
        const curW = load<u8>(LOOT_WATER + <usize>i);
        if (curW < 45) store<u8>(LOOT_WATER + <usize>i, curW + 8);
      }
    }
  }
}

function claimTerritory(facId: i32, cx: i32, cy: i32, radius: i32, buildWalls: bool): void {
  const x0 = clampI(cx - radius, 1, gridW - 2);
  const x1 = clampI(cx + radius, 1, gridW - 2);
  const y0 = clampI(cy - radius, 1, gridH - 2);
  const y1 = clampI(cy + radius, 1, gridH - 2);
  const r2 = radius * radius;
  const wallInner = (radius - 1) * (radius - 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const idx = y * gridW + x;
      const t = load<u8>(TILE_TYPE + <usize>idx);
      if (t == TILE_WATER || t == TILE_MOUNTAIN) continue;
      store<u8>(FACTION_CLAIM + <usize>idx, <u8>(facId + 1));
      if (buildWalls && d2 >= wallInner && t != TILE_ROAD && t != TILE_WALL) {
        if (abs(dx) > 1 && abs(dy) > 1) {
          store<u8>(TILE_TYPE + <usize>idx, TILE_WALL);
        }
      }
    }
  }
}

function findFreeGroupSlot(kind: u8, x: i32, y: i32): i32 {
  for (let g = 0; g < MAX_GROUPS; g++) {
    if (load<u8>(GRP_ACTIVE + <usize>g) == 0) {
      store<u8>(GRP_ACTIVE + <usize>g, 1);
      store<u8>(GRP_KIND + <usize>g, kind);
      store<u16>(GRP_X + (<usize>g << 1), <u16>x);
      store<u16>(GRP_Y + (<usize>g << 1), <u16>y);
      store<u16>(GRP_POP + (<usize>g << 1), 1);
      store<f32>(GRP_FOOD + (<usize>g << 2), 4.0);
      store<f32>(GRP_WATER + (<usize>g << 2), 4.0);
      return g;
    }
  }
  return -1;
}

function tryFoundSociety(leaderIdx: i32, x: i32, y: i32): void {
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) == 0) continue;
    const fx = <i32>load<u16>(FAC_X + (<usize>f << 1));
    const fy = <i32>load<u16>(FAC_Y + (<usize>f << 1));
    const dx = fx - x;
    const dy = fy - y;
    if (dx * dx + dy * dy < 36 * 36) return;
  }

  let slot = -1;
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) == 0) { slot = f; break; }
  }
  if (slot < 0) return;

  const bx = x >> 2;
  const by = y >> 2;
  let allies = 0;
  for (let dy = -2; dy <= 2; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= hashH) continue;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= hashW) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * hashW + nx) << 2));
      let guard = 0;
      while (cur >= 0 && guard < 16) {
        guard++;
        if (load<u8>(AG_KIND + <usize>cur) == KIND_HUMAN && load<u8>(AG_SOCIAL + <usize>cur) != SOC_SOCIETY) {
          allies++;
        }
        cur = load<i32>(AG_NEXT + (<usize>cur << 2));
      }
    }
  }
  if (allies < 3) return;

  const u = <usize>slot;
  const banditProb = cfg(CFG_BANDITRY);
  const ethos: u8 = randF() < banditProb ? ETHOS_RAIDER : (randInt(2) == 0 ? ETHOS_COOP : ETHOS_FORT);
  store<u8>(FAC_ACTIVE + u, 1);
  store<u8>(FAC_LEVEL + u, 1);
  store<u8>(FAC_ETHOS + u, ethos);
  store<u16>(FAC_X + (u << 1), <u16>x);
  store<u16>(FAC_Y + (u << 1), <u16>y);
  store<u16>(FAC_POP + (u << 1), <u16>allies);
  store<f32>(FAC_FOOD + (u << 2), 28.0);
  store<f32>(FAC_WATER + (u << 2), 28.0);
  store<f32>(FAC_MATS + (u << 2), 12.0);
  store<u32>(FAC_COLOR + (u << 2), factionPalette(slot));
  store<u32>(FAC_KILLS + (u << 2), 0);
  store<u32>(FAC_FOUNDED + (u << 2), <u32>stat(ST_TICK));

  for (let o = 0; o < MAX_FACTIONS; o++) {
    const oEthos = load<u8>(FAC_ETHOS + <usize>o);
    const rel: i8 = (ethos == ETHOS_RAIDER || oEthos == ETHOS_RAIDER) ? -60 : 25;
    store<i8>(FAC_REL + <usize>(slot * MAX_FACTIONS + o), rel);
    store<i8>(FAC_REL + <usize>(o * MAX_FACTIONS + slot), rel);
  }

  for (let dy = -2; dy <= 2; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= hashH) continue;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= hashW) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * hashW + nx) << 2));
      let guard = 0;
      while (cur >= 0 && guard < 16) {
        guard++;
        if (load<u8>(AG_KIND + <usize>cur) == KIND_HUMAN && load<u8>(AG_SOCIAL + <usize>cur) != SOC_SOCIETY) {
          store<u8>(AG_SOCIAL + <usize>cur, SOC_SOCIETY);
          store<u16>(AG_GROUP + (<usize>cur << 1), <u16>slot);
        }
        cur = load<i32>(AG_NEXT + (<usize>cur << 2));
      }
    }
  }
  store<u8>(AG_SOCIAL + <usize>leaderIdx, SOC_SOCIETY);
  store<u16>(AG_GROUP + (<usize>leaderIdx << 1), <u16>slot);
  claimTerritory(slot, x, y, 7, false);
  pushEvent(EVT_FOUNDED, slot, (x << 10) | y);
}

// ---- Prisoner's Dilemma Encounter between two humans ----
function resolvePrisonersDilemma(a: i32, b: i32): void {
  const ua = <usize>a;
  const ub = <usize>b;
  const pa = <i32>load<u16>(AG_PERSONALITY + (ua << 1));
  const pb = <i32>load<u16>(AG_PERSONALITY + (ub << 1));

  const coopA = pa & 15;
  const greedA = (pa >> 8) & 15;
  const trustA = (pa >> 12) & 15;
  const repB = <i32>load<i8>(AG_REP + ub);

  const coopB = pb & 15;
  const greedB = (pb >> 8) & 15;
  const trustB = (pb >> 12) & 15;
  const repA = <i32>load<i8>(AG_REP + ua);

  const despA = (<i32>load<u8>(AG_HUNGER + ua) < 25 || <i32>load<u8>(AG_THIRST + ua) < 25) ? -4 : 0;
  const despB = (<i32>load<u8>(AG_HUNGER + ub) < 25 || <i32>load<u8>(AG_THIRST + ub) < 25) ? -4 : 0;

  const scoreA = coopA * 2 + trustA + (repB >> 4) + despA - greedA + randInt(7) - 3;
  const scoreB = coopB * 2 + trustB + (repA >> 4) + despB - greedB + randInt(7) - 3;

  const aCoop = scoreA >= 8;
  const bCoop = scoreB >= 8;

  if (aCoop) addStat(ST_PD_COOPS, 1); else addStat(ST_PD_DEFECTS, 1);
  if (bCoop) addStat(ST_PD_COOPS, 1); else addStat(ST_PD_DEFECTS, 1);

  if (aCoop && bCoop) {
    // Mutual Cooperation: share resources, boost reputation, optionally band into a small group!
    addStat(ST_PD_MUTUAL_COOP, 1);
    const rA = clampI(repA + 6, -120, 120);
    const rB = clampI(repB + 6, -120, 120);
    store<i8>(AG_REP + ua, <i8>rA);
    store<i8>(AG_REP + ub, <i8>rB);

    // Balance food & water
    const totF = <i32>load<u8>(AG_INV_FOOD + ua) + <i32>load<u8>(AG_INV_FOOD + ub);
    const totW = <i32>load<u8>(AG_INV_WATER + ua) + <i32>load<u8>(AG_INV_WATER + ub);
    store<u8>(AG_INV_FOOD + ua, <u8>(totF >> 1));
    store<u8>(AG_INV_FOOD + ub, <u8>(totF - (totF >> 1)));
    store<u8>(AG_INV_WATER + ua, <u8>(totW >> 1));
    store<u8>(AG_INV_WATER + ub, <u8>(totW - (totW >> 1)));

    // Form small roving group if both solo
    if (load<u8>(AG_SOCIAL + ua) == SOC_SOLO && load<u8>(AG_SOCIAL + ub) == SOC_SOLO) {
      const gx = <i32>load<f32>(AG_X + (ua << 2));
      const gy = <i32>load<f32>(AG_Y + (ua << 2));
      const g = findFreeGroupSlot(1, gx, gy);
      if (g >= 0) {
        store<u8>(AG_SOCIAL + ua, SOC_GROUP);
        store<u8>(AG_SOCIAL + ub, SOC_GROUP);
        store<u16>(AG_GROUP + (ua << 1), <u16>g);
        store<u16>(AG_GROUP + (ub << 1), <u16>g);
        pushEvent(EVT_GROUP_FORMED, g, (gx << 10) | gy);
      }
    }
    store<u8>(AG_STATE + ua, STATE_TRADE);
    store<u8>(AG_STATE + ub, STATE_TRADE);
  } else if (!aCoop && bCoop) {
    // A betrays B
    addStat(ST_PD_BETRAYALS, 1);
    store<i8>(AG_REP + ua, <i8>clampI(repA - 18, -120, 120));
    const stealF = load<u8>(AG_INV_FOOD + ub) > 0 ? 1 : 0;
    if (stealF > 0) {
      store<u8>(AG_INV_FOOD + ub, load<u8>(AG_INV_FOOD + ub) - 1);
      store<u8>(AG_INV_FOOD + ua, <u8>clampI(<i32>load<u8>(AG_INV_FOOD + ua) + 1, 0, 25));
    }
  } else if (aCoop && !bCoop) {
    // B betrays A
    addStat(ST_PD_BETRAYALS, 1);
    store<i8>(AG_REP + ub, <i8>clampI(repB - 18, -120, 120));
    const stealF = load<u8>(AG_INV_FOOD + ua) > 0 ? 1 : 0;
    if (stealF > 0) {
      store<u8>(AG_INV_FOOD + ua, load<u8>(AG_INV_FOOD + ua) - 1);
      store<u8>(AG_INV_FOOD + ub, <u8>clampI(<i32>load<u8>(AG_INV_FOOD + ub) + 1, 0, 25));
    }
  } else {
    // Mutual Defection: minor skirmish
    const hpA = clampI(<i32>load<u8>(AG_HP + ua) - 8, 0, 100);
    const hpB = clampI(<i32>load<u8>(AG_HP + ub) - 8, 0, 100);
    store<u8>(AG_HP + ua, <u8>hpA);
    store<u8>(AG_HP + ub, <u8>hpB);
    store<i8>(AG_REP + ua, <i8>clampI(repA - 8, -120, 120));
    store<i8>(AG_REP + ub, <i8>clampI(repB - 8, -120, 120));
  }
}

function stepHuman(i: i32, tick: i32): void {
  const u = <usize>i;
  let ax = load<f32>(AG_X + (u << 2));
  let ay = load<f32>(AG_Y + (u << 2));
  let hp = <i32>load<u8>(AG_HP + u);
  let hunger = <i32>load<u8>(AG_HUNGER + u);
  let thirst = <i32>load<u8>(AG_THIRST + u);
  let food = <i32>load<u8>(AG_INV_FOOD + u);
  let water = <i32>load<u8>(AG_INV_WATER + u);
  let gear = <i32>load<u8>(AG_INV_GEAR + u);
  let meds = <i32>load<u8>(AG_INV_MEDS + u);
  let mats = <i32>load<u8>(AG_INV_MATS + u);
  let soc = load<u8>(AG_SOCIAL + u);
  let grp = load<u16>(AG_GROUP + (u << 1));
  const sub = load<u8>(AG_SUBKIND + u);
  let cd = <i32>load<u8>(AG_COOLDOWN + u);
  if (cd > 0) cd--;

  if ((tick & 3) == 0) {
    const agePtr = AG_AGE + (u << 1);
    const age = load<u16>(agePtr);
    if (age < 65530) store<u16>(agePtr, age + 1);
  }

  // Hunger & Thirst demands
  if ((tick & 7) == (i & 7)) {
    hunger -= <i32>Mathf.max(1.0, cfg(CFG_HUNGER_RATE) * 1.8);
    thirst -= <i32>Mathf.max(1.0, cfg(CFG_THIRST_RATE) * 2.2);
    if (hunger < 38 && food > 0) {
      food--;
      hunger = clampI(hunger + 46, 0, 100);
      hp = clampI(hp + 6, 0, 100);
    }
    if (thirst < 38 && water > 0) {
      water--;
      thirst = clampI(thirst + 48, 0, 100);
    }
    if (hunger <= 0) { hunger = 0; hp -= 3; }
    if (thirst <= 0) { thirst = 0; hp -= 4; }
  }

  // Infection & Meds
  let inf = <i32>load<u8>(AG_INFECTION + u);
  if (inf > 0) {
    if (meds > 0 && inf < 180) {
      meds--;
      inf = 0;
    } else {
      inf += 2;
      if (inf >= 250) {
        store<u8>(AG_KIND + u, KIND_ZOMBIE);
        store<u8>(AG_SUBKIND + u, ZOM_RUNNER);
        store<u8>(AG_HP + u, 95);
        store<u8>(AG_INFECTION + u, 0);
        store<u8>(AG_SOCIAL + u, SOC_SOLO);
        store<u16>(AG_GROUP + (u << 1), 0xFFFF);
        store<u8>(AG_STATE + u, STATE_SHAMBLE);
        addStat(ST_TURNED, 1);
        return;
      }
    }
    store<u8>(AG_INFECTION + u, <u8>inf);
  }

  if (hp < 45 && meds > 0) {
    meds--;
    hp = clampI(hp + 35, 0, 100);
  }

  if (hp <= 0) {
    store<u8>(AG_KIND + u, KIND_DEAD);
    addStat(ST_DEATHS, 1);
    return;
  }

  const tx = clampI(<i32>ax, 0, gridW - 1);
  const ty = clampI(<i32>ay, 0, gridH - 1);
  const curTile = tileAt(tx, ty);
  const tileIdx = <usize>(ty * gridW + tx);

  // Scavenge tile resources
  const fLoot = <i32>load<u8>(LOOT_FOOD + tileIdx);
  if (fLoot > 0 && food < 12) {
    const take = fLoot > 3 ? 3 : fLoot;
    store<u8>(LOOT_FOOD + tileIdx, <u8>(fLoot - take));
    food += take;
  }
  const wLoot = <i32>load<u8>(LOOT_WATER + tileIdx);
  if (wLoot > 0 && water < 12) {
    const takeW = wLoot > 3 ? 3 : wLoot;
    store<u8>(LOOT_WATER + tileIdx, <u8>(wLoot - takeW));
    water += takeW;
  }
  const gLoot = <i32>load<u8>(LOOT_GEAR + tileIdx);
  if (gLoot > 0 && gear < 95) {
    const takeG = gLoot > 8 ? 8 : gLoot;
    store<u8>(LOOT_GEAR + tileIdx, <u8>(gLoot - takeG));
    gear = clampI(gear + takeG, 0, 100);
    if (mats < 12 && (randU32() & 3) == 0) mats++;
  }

  // Validate society / group membership
  if (soc == SOC_SOCIETY && (<i32>grp >= MAX_FACTIONS || load<u8>(FAC_ACTIVE + <usize>grp) == 0)) {
    soc = SOC_SOLO; grp = 0xFFFF;
    store<u8>(AG_SOCIAL + u, SOC_SOLO);
    store<u16>(AG_GROUP + (u << 1), 0xFFFF);
  } else if (soc == SOC_GROUP && (<i32>grp >= MAX_GROUPS || load<u8>(GRP_ACTIVE + <usize>grp) == 0)) {
    soc = SOC_SOLO; grp = 0xFFFF;
    store<u8>(AG_SOCIAL + u, SOC_SOLO);
    store<u16>(AG_GROUP + (u << 1), 0xFFFF);
  }

  // Neighbor scan (staggered every 2 ticks for high agent counts)
  let nearZ = -1;
  let nearZD2: f32 = 144.0;
  let zCount = 0;
  let nearPrey = -1;
  let nearPreyD2: f32 = 81.0;

  if (((tick + i) & 1) == 0) {
    const bx = tx >> 2;
    const by = ty >> 2;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = by + dy;
      if (ny < 0 || ny >= hashH) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = bx + dx;
        if (nx < 0 || nx >= hashW) continue;
        let cur = load<i32>(HASH_HEAD + (<usize>(ny * hashW + nx) << 2));
        let guard = 0;
        while (cur >= 0 && guard < 18) {
          guard++;
          if (cur != i) {
            const k = load<u8>(AG_KIND + <usize>cur);
            if (k == KIND_ZOMBIE) {
              const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
              const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
              const d2 = ox * ox + oy * oy;
              if (d2 < 64.0) zCount++;
              if (d2 < nearZD2) { nearZD2 = d2; nearZ = cur; }
            } else if (k == KIND_ANIMAL && food < 5) {
              const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
              const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
              const d2 = ox * ox + oy * oy;
              if (d2 < nearPreyD2) { nearPreyD2 = d2; nearPrey = cur; }
            } else if (k == KIND_HUMAN && cd == 0 && ((tick + i) & 15) == 0) {
              const oSoc = load<u8>(AG_SOCIAL + <usize>cur);
              const oGrp = load<u16>(AG_GROUP + (<usize>cur << 1));
              if (soc != oSoc || grp != oGrp || soc == SOC_SOLO) {
                const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
                const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
                if (ox * ox + oy * oy < 16.0) {
                  resolvePrisonersDilemma(i, cur);
                  cd = 16;
                }
              }
            }
          }
          cur = load<i32>(AG_NEXT + (<usize>cur << 2));
        }
      }
    }
  }

  let vx: f32 = load<f32>(AG_VX + (u << 2));
  let vy: f32 = load<f32>(AG_VY + (u << 2));
  let state: u8 = STATE_ROAM;
  const spd = cfg(CFG_HUMAN_SPEED) * (curTile == TILE_ROAD ? 1.3 : (curTile == TILE_FOREST || curTile == TILE_SWAMP ? 0.8 : 1.0));

  if (nearZ >= 0) {
    const zx = load<f32>(AG_X + (<usize>nearZ << 2));
    const zy = load<f32>(AG_Y + (<usize>nearZ << 2));
    const dx = zx - ax;
    const dy = zy - ay;
    const dist = Mathf.sqrt(nearZD2) + 0.001;
    const brave = (<i32>load<u16>(AG_PERSONALITY + (u << 1)) >> 4) & 15;
    const overwhelmed = (zCount >= 3 + (brave >> 2) && gear < 40) || hp < 28;
    if (overwhelmed) {
      state = STATE_FLEE;
      vx = -(dx / dist) * spd * 1.15;
      vy = -(dy / dist) * spd * 1.15;
    } else {
      state = STATE_FIGHT;
      const range: f32 = 2.0 + <f32>gear * 0.06;
      if (dist <= range) {
        if (cd == 0) {
          const dmg = 20 + (gear >> 1);
          const zHp = <i32>load<u8>(AG_HP + <usize>nearZ) - dmg;
          if (zHp <= 0) {
            store<u8>(AG_KIND + <usize>nearZ, KIND_DEAD);
            addStat(ST_ZKILLS, 1);
            if (soc == SOC_SOCIETY) {
              const fkPtr = FAC_KILLS + (<usize>grp << 2);
              store<u32>(fkPtr, load<u32>(fkPtr) + 1);
            }
          } else {
            store<u8>(AG_HP + <usize>nearZ, <u8>zHp);
          }
          cd = 6;
          addScent(tx, ty, <i32>((gear > 30 ? 46.0 : 18.0) * cfg(CFG_HORDE_HEARING)));
        }
        vx = 0.0; vy = 0.0;
      } else {
        vx = (dx / dist) * spd * 0.85;
        vy = (dy / dist) * spd * 0.85;
      }
    }
  } else if (nearPrey >= 0) {
    state = STATE_HUNT;
    const px = load<f32>(AG_X + (<usize>nearPrey << 2));
    const py = load<f32>(AG_Y + (<usize>nearPrey << 2));
    const dx = px - ax;
    const dy = py - ay;
    const dist = Mathf.sqrt(nearPreyD2) + 0.001;
    if (dist <= 2.2) {
      if (cd == 0) {
        const aHp = <i32>load<u8>(AG_HP + <usize>nearPrey) - (18 + (gear >> 2));
        if (aHp <= 0) {
          store<u8>(AG_KIND + <usize>nearPrey, KIND_DEAD);
          food = clampI(food + 5, 0, 25);
        } else {
          store<u8>(AG_HP + <usize>nearPrey, <u8>aHp);
        }
        cd = 8;
      }
    } else {
      vx = (dx / dist) * spd;
      vy = (dy / dist) * spd;
    }
  } else if (soc == SOC_SOCIETY) {
    const fx = <f32>load<u16>(FAC_X + (<usize>grp << 1));
    const fy = <f32>load<u16>(FAC_Y + (<usize>grp << 1));
    const dxH = fx - ax;
    const dyH = fy - ay;
    const dH2 = dxH * dxH + dyH * dyH;
    if ((food >= 4 || water >= 4) && dH2 > 25.0) {
      state = STATE_RETURN;
      const d = Mathf.sqrt(dH2) + 0.001;
      vx = (dxH / d) * spd;
      vy = (dyH / d) * spd;
    } else if (dH2 <= 25.0 && (food > 1 || water > 1)) {
      if (food > 1) {
        const dep = food - 1; food = 1;
        const p = FAC_FOOD + (<usize>grp << 2);
        store<f32>(p, load<f32>(p) + <f32>(dep * 3));
      }
      if (water > 1) {
        const depW = water - 1; water = 1;
        const pW = FAC_WATER + (<usize>grp << 2);
        store<f32>(pW, load<f32>(pW) + <f32>(depW * 3));
      }
      const pM = FAC_MATS + (<usize>grp << 2);
      store<f32>(pM, load<f32>(pM) + 1.0 + <f32>mats);
      mats = 0;
      state = STATE_GUARD;
    } else if (sub == ARCH_SCAVENGER || hunger < 65 || thirst < 65) {
      state = STATE_SCAVENGE;
    } else {
      state = STATE_GUARD;
    }
  } else {
    state = STATE_SCAVENGE;
    if ((tick + i) % 100 == 0 && zCount == 0 && curTile != TILE_CITY) {
      tryFoundSociety(i, tx, ty);
    }
  }

  // Roam / Scavenge steering
  if ((vx == 0.0 && vy == 0.0) || (tick + i) % 75 == 0) {
    const tgtX = <f32>load<u16>(AG_TARGET_X + (u << 1));
    const tgtY = <f32>load<u16>(AG_TARGET_Y + (u << 1));
    const dtx = tgtX - ax;
    const dty = tgtY - ay;
    if (dtx * dtx + dty * dty < 9.0 || (tick + i) % 75 == 0) {
      const nx = clampI(tx + randInt(57) - 28, 2, gridW - 3);
      const ny = clampI(ty + randInt(57) - 28, 2, gridH - 3);
      store<u16>(AG_TARGET_X + (u << 1), <u16>nx);
      store<u16>(AG_TARGET_Y + (u << 1), <u16>ny);
      const d = Mathf.sqrt(<f32>((nx - tx) * (nx - tx) + (ny - ty) * (ny - ty))) + 0.001;
      vx = (<f32>(nx - tx) / d) * spd * 0.85;
      vy = (<f32>(ny - ty) / d) * spd * 0.85;
    } else {
      const d = Mathf.sqrt(dtx * dtx + dty * dty) + 0.001;
      vx = (dtx / d) * spd * 0.85;
      vy = (dty / d) * spd * 0.85;
    }
  }

  if (vx != 0.0 || vy != 0.0) {
    const nx = clampF(ax + vx, 1.0, <f32>(gridW - 2));
    const ny = clampF(ay + vy, 1.0, <f32>(gridH - 2));
    const ntx = <i32>nx;
    const nty = <i32>ny;
    if (isPassable(tileAt(ntx, nty))) {
      ax = nx; ay = ny;
    } else if (isPassable(tileAt(ntx, ty))) {
      ax = nx;
    } else if (isPassable(tileAt(tx, nty))) {
      ay = ny;
    } else {
      vx = -vx; vy = -vy;
    }
  }

  store<f32>(AG_X + (u << 2), ax);
  store<f32>(AG_Y + (u << 2), ay);
  store<f32>(AG_VX + (u << 2), vx);
  store<f32>(AG_VY + (u << 2), vy);
  store<u8>(AG_HP + u, <u8>hp);
  store<u8>(AG_HUNGER + u, <u8>hunger);
  store<u8>(AG_THIRST + u, <u8>thirst);
  store<u8>(AG_INV_FOOD + u, <u8>food);
  store<u8>(AG_INV_WATER + u, <u8>water);
  store<u8>(AG_INV_GEAR + u, <u8>gear);
  store<u8>(AG_INV_MEDS + u, <u8>meds);
  store<u8>(AG_INV_MATS + u, <u8>mats);
  store<u8>(AG_STATE + u, state);
  store<u8>(AG_COOLDOWN + u, <u8>cd);
}

function stepZombie(i: i32, tick: i32): void {
  const u = <usize>i;
  let ax = load<f32>(AG_X + (u << 2));
  let ay = load<f32>(AG_Y + (u << 2));
  const sub = load<u8>(AG_SUBKIND + u);
  let cd = <i32>load<u8>(AG_COOLDOWN + u);
  if (cd > 0) cd--;

  const tx = clampI(<i32>ax, 0, gridW - 1);
  const ty = clampI(<i32>ay, 0, gridH - 1);

  let nearPrey = -1;
  let nearD2: f32 = 169.0;
  let packLeader = -1;

  if (((tick + i) & 1) == 0) {
    const bx = tx >> 2;
    const by = ty >> 2;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = by + dy;
      if (ny < 0 || ny >= hashH) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = bx + dx;
        if (nx < 0 || nx >= hashW) continue;
        let cur = load<i32>(HASH_HEAD + (<usize>(ny * hashW + nx) << 2));
        let guard = 0;
        while (cur >= 0 && guard < 16) {
          guard++;
          const k = load<u8>(AG_KIND + <usize>cur);
          if (k == KIND_HUMAN || k == KIND_ANIMAL) {
            const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
            const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
            const d2 = ox * ox + oy * oy;
            if (d2 < nearD2) { nearD2 = d2; nearPrey = cur; }
          } else if (k == KIND_ZOMBIE && cur != i && load<u8>(AG_SUBKIND + <usize>cur) == ZOM_ALPHA) {
            packLeader = cur;
          }
          cur = load<i32>(AG_NEXT + (<usize>cur << 2));
        }
      }
    }
  }

  const spd = cfg(CFG_ZOMBIE_SPEED) * (sub == ZOM_RUNNER ? 1.35 : (sub == ZOM_ALPHA ? 1.15 : 0.9));
  let vx: f32 = load<f32>(AG_VX + (u << 2));
  let vy: f32 = load<f32>(AG_VY + (u << 2));
  let state: u8 = STATE_SHAMBLE;

  if (nearPrey >= 0) {
    state = STATE_CHASE;
    const px = load<f32>(AG_X + (<usize>nearPrey << 2));
    const py = load<f32>(AG_Y + (<usize>nearPrey << 2));
    const dx = px - ax;
    const dy = py - ay;
    const dist = Mathf.sqrt(nearD2) + 0.001;
    if (dist <= 1.65) {
      if (cd == 0) {
        const pKind = load<u8>(AG_KIND + <usize>nearPrey);
        const pGear = pKind == KIND_HUMAN ? <i32>load<u8>(AG_INV_GEAR + <usize>nearPrey) : 0;
        const dmg = clampI(16 - (pGear >> 3), 5, 18);
        const pHp = <i32>load<u8>(AG_HP + <usize>nearPrey) - dmg;
        if (pHp <= 0) {
          if (pKind == KIND_HUMAN && randF() < cfg(CFG_INFECTION_CHANCE)) {
            store<u8>(AG_KIND + <usize>nearPrey, KIND_ZOMBIE);
            store<u8>(AG_SUBKIND + <usize>nearPrey, ZOM_RUNNER);
            store<u8>(AG_HP + <usize>nearPrey, 90);
            store<u8>(AG_SOCIAL + <usize>nearPrey, SOC_SOLO);
            store<u16>(AG_GROUP + (<usize>nearPrey << 1), 0xFFFF);
            addStat(ST_TURNED, 1);
          } else {
            store<u8>(AG_KIND + <usize>nearPrey, KIND_DEAD);
            addStat(ST_DEATHS, 1);
          }
        } else {
          store<u8>(AG_HP + <usize>nearPrey, <u8>pHp);
          if (pKind == KIND_HUMAN && load<u8>(AG_INFECTION + <usize>nearPrey) == 0 && randF() < cfg(CFG_INFECTION_CHANCE) * 0.65) {
            store<u8>(AG_INFECTION + <usize>nearPrey, 1);
          }
        }
        cd = 10;
      }
      vx = 0.0; vy = 0.0;
    } else {
      vx = (dx / dist) * spd;
      vy = (dy / dist) * spd;
    }
  } else if (packLeader >= 0 && sub != ZOM_ALPHA) {
    // Pack cohesion: follow nearby Pack Alpha
    state = STATE_CHASE;
    const lx = load<f32>(AG_X + (<usize>packLeader << 2));
    const ly = load<f32>(AG_Y + (<usize>packLeader << 2));
    const dx = lx - ax;
    const dy = ly - ay;
    const d = Mathf.sqrt(dx * dx + dy * dy) + 0.001;
    if (d > 2.5) {
      vx = (dx / d) * spd * 0.8;
      vy = (dy / d) * spd * 0.8;
    }
    if (load<u8>(AG_SOCIAL + u) == SOC_SOLO) {
      store<u8>(AG_SOCIAL + u, SOC_GROUP);
      store<u16>(AG_GROUP + (u << 1), <u16>(packLeader & 127));
    }
  } else {
    // Follow scent/noise gradient or shamble
    let bestScent = <i32>load<u8>(SCENT_HEAT + <usize>(ty * gridW + tx));
    let sdx = 0;
    let sdy = 0;
    if (tx > 2 && ty > 2 && tx < gridW - 3 && ty < gridH - 3) {
      const sN = <i32>load<u8>(SCENT_HEAT + <usize>((ty - 2) * gridW + tx));
      const sS = <i32>load<u8>(SCENT_HEAT + <usize>((ty + 2) * gridW + tx));
      const sW = <i32>load<u8>(SCENT_HEAT + <usize>(ty * gridW + (tx - 2)));
      const sE = <i32>load<u8>(SCENT_HEAT + <usize>(ty * gridW + (tx + 2)));
      if (sN > bestScent) { bestScent = sN; sdx = 0; sdy = -1; }
      if (sS > bestScent) { bestScent = sS; sdx = 0; sdy = 1; }
      if (sW > bestScent) { bestScent = sW; sdx = -1; sdy = 0; }
      if (sE > bestScent) { bestScent = sE; sdx = 1; sdy = 0; }
    }
    if (sdx != 0 || sdy != 0) {
      state = STATE_CHASE;
      vx = <f32>sdx * spd * 0.85;
      vy = <f32>sdy * spd * 0.85;
    } else if ((vx == 0.0 && vy == 0.0) || (tick + i) % 50 == 0) {
      const ang = randF() * 6.283;
      vx = Mathf.cos(ang) * spd * 0.45;
      vy = Mathf.sin(ang) * spd * 0.45;
    }
  }

  if (vx != 0.0 || vy != 0.0) {
    const nx = clampF(ax + vx, 1.0, <f32>(gridW - 2));
    const ny = clampF(ay + vy, 1.0, <f32>(gridH - 2));
    const ntx = <i32>nx;
    const nty = <i32>ny;
    const nt = tileAt(ntx, nty);
    if (isPassable(nt)) {
      ax = nx; ay = ny;
    } else if (nt == TILE_WALL) {
      if ((randU32() & 31) == 0) {
        setTile(ntx, nty, TILE_GRASS);
        const claim = <i32>load<u8>(FACTION_CLAIM + <usize>(nty * gridW + ntx));
        if (claim > 0) pushEvent(EVT_HORDE_BREACH, claim - 1, (ntx << 10) | nty);
      }
    } else {
      vx = -vx; vy = -vy;
    }
  }

  store<f32>(AG_X + (u << 2), ax);
  store<f32>(AG_Y + (u << 2), ay);
  store<f32>(AG_VX + (u << 2), vx);
  store<f32>(AG_VY + (u << 2), vy);
  store<u8>(AG_STATE + u, state);
  store<u8>(AG_COOLDOWN + u, <u8>cd);
}

function stepAnimal(i: i32, tick: i32): void {
  const u = <usize>i;
  let ax = load<f32>(AG_X + (u << 2));
  let ay = load<f32>(AG_Y + (u << 2));
  const sub = load<u8>(AG_SUBKIND + u);
  let hp = <i32>load<u8>(AG_HP + u);
  if (hp <= 0) {
    store<u8>(AG_KIND + u, KIND_DEAD);
    return;
  }

  const tx = clampI(<i32>ax, 0, gridW - 1);
  const ty = clampI(<i32>ay, 0, gridH - 1);
  const spd = cfg(CFG_ANIMAL_SPEED) * (sub == ANI_WOLF ? 1.2 : (sub == ANI_DEER ? 1.15 : 0.9));

  let vx: f32 = load<f32>(AG_VX + (u << 2));
  let vy: f32 = load<f32>(AG_VY + (u << 2));
  let state: u8 = STATE_GRAZE;

  if (sub == ANI_WOLF && ((tick + i) & 3) == 0) {
    // Wolves hunt nearby deer or lone humans
    const bx = tx >> 2;
    const by = ty >> 2;
    let cur = load<i32>(HASH_HEAD + (<usize>(by * hashW + bx) << 2));
    let guard = 0;
    while (cur >= 0 && guard < 10) {
      guard++;
      const k = load<u8>(AG_KIND + <usize>cur);
      if ((k == KIND_ANIMAL && load<u8>(AG_SUBKIND + <usize>cur) == ANI_DEER) || k == KIND_HUMAN) {
        const px = load<f32>(AG_X + (<usize>cur << 2));
        const py = load<f32>(AG_Y + (<usize>cur << 2));
        const dx = px - ax;
        const dy = py - ay;
        const d2 = dx * dx + dy * dy;
        if (d2 < 64.0) {
          state = STATE_HUNT;
          const d = Mathf.sqrt(d2) + 0.001;
          if (d <= 1.6) {
            const tHp = <i32>load<u8>(AG_HP + <usize>cur) - 10;
            store<u8>(AG_HP + <usize>cur, <u8>(tHp > 0 ? tHp : 0));
          } else {
            vx = (dx / d) * spd;
            vy = (dy / d) * spd;
          }
          break;
        }
      }
      cur = load<i32>(AG_NEXT + (<usize>cur << 2));
    }
  }

  if ((vx == 0.0 && vy == 0.0) || (tick + i) % 60 == 0) {
    const ang = randF() * 6.283;
    vx = Mathf.cos(ang) * spd * 0.55;
    vy = Mathf.sin(ang) * spd * 0.55;
  }

  const nx = clampF(ax + vx, 1.0, <f32>(gridW - 2));
  const ny = clampF(ay + vy, 1.0, <f32>(gridH - 2));
  if (isPassable(tileAt(<i32>nx, <i32>ny))) {
    ax = nx; ay = ny;
  } else {
    vx = -vx; vy = -vy;
  }

  store<f32>(AG_X + (u << 2), ax);
  store<f32>(AG_Y + (u << 2), ay);
  store<f32>(AG_VX + (u << 2), vx);
  store<f32>(AG_VY + (u << 2), vy);
  store<u8>(AG_STATE + u, state);
}

function stepSocieties(tick: i32): void {
  memory.fill(SCR_FAC_COUNTS, 0, MAX_FACTIONS * 4);
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) != KIND_HUMAN) continue;
    if (load<u8>(AG_SOCIAL + <usize>i) != SOC_SOCIETY) continue;
    const f = <i32>load<u16>(AG_GROUP + (<usize>i << 1));
    if (f >= 0 && f < MAX_FACTIONS) {
      const p = SCR_FAC_COUNTS + (<usize>f << 2);
      store<i32>(p, load<i32>(p) + 1);
    }
  }

  const growthMult = cfg(CFG_SETTLEMENT_GROWTH);
  for (let f = 0; f < MAX_FACTIONS; f++) {
    const u = <usize>f;
    if (load<u8>(FAC_ACTIVE + u) == 0) continue;
    const pop = load<i32>(SCR_FAC_COUNTS + (u << 2));
    store<u16>(FAC_POP + (u << 1), <u16>pop);
    if (pop <= 0) {
      store<u8>(FAC_ACTIVE + u, 0);
      const fx = <i32>load<u16>(FAC_X + (u << 1));
      const fy = <i32>load<u16>(FAC_Y + (u << 1));
      pushEvent(EVT_FALLEN, f, (fx << 10) | fy);
      continue;
    }

    const foodPtr = FAC_FOOD + (u << 2);
    const waterPtr = FAC_WATER + (u << 2);
    const matsPtr = FAC_MATS + (u << 2);
    let food = Mathf.max(0.0, load<f32>(foodPtr) - <f32>pop * 0.035);
    let water = Mathf.max(0.0, load<f32>(waterPtr) - <f32>pop * 0.035);

    const thresh: f32 = 28.0 / Mathf.max(0.2, growthMult);
    if (food > thresh && water > thresh && pop < 220 && (tick + f * 7) % 32 == 0) {
      food -= 10.0;
      water -= 10.0;
      const fx = <f32>load<u16>(FAC_X + (u << 1));
      const fy = <f32>load<u16>(FAC_Y + (u << 1));
      const sx = clampF(fx + (randF() - 0.5) * 6.0, 2.0, <f32>(gridW - 3));
      const sy = clampF(fy + (randF() - 0.5) * 6.0, 2.0, <f32>(gridH - 3));
      if (isPassable(tileAt(<i32>sx, <i32>sy))) {
        spawnAgent(
          KIND_HUMAN,
          <u8>randInt(4),
          sx, sy, 100, 90, 90, 3, 3, <u8>(15 + randInt(25)), 1, 1,
          SOC_SOCIETY,
          <u16>f,
          packPersonality(8 + randInt(8), randInt(16), randInt(10), 8 + randInt(8)),
        );
      }
    }
    store<f32>(foodPtr, food);
    store<f32>(waterPtr, water);

    const lvl = load<u8>(FAC_LEVEL + u);
    const mats = load<f32>(matsPtr);
    let nextLvl = lvl;
    if (lvl == 1 && pop >= 8 && mats >= 12.0) nextLvl = 2;
    else if (lvl == 2 && pop >= 16 && mats >= 28.0) nextLvl = 3;
    else if (lvl == 3 && pop >= 28 && mats >= 55.0) nextLvl = 4;

    if (nextLvl > lvl) {
      store<u8>(FAC_LEVEL + u, nextLvl);
      const fx = <i32>load<u16>(FAC_X + (u << 1));
      const fy = <i32>load<u16>(FAC_Y + (u << 1));
      claimTerritory(f, fx, fy, 6 + <i32>nextLvl * 3, nextLvl >= 2);
      pushEvent(EVT_UPGRADED, f, <i32>nextLvl);
    }
  }
}

function recountAll(): void {
  let hum = 0;
  let zom = 0;
  let ani = 0;
  let inf = 0;
  let soloH = 0;
  let grpH = 0;
  let socH = 0;
  let sumF = 0;
  let sumW = 0;
  let sumG = 0;
  let zPacks = 0;
  let lastAlive = 0;

  for (let i = 0; i < activeLimit; i++) {
    const k = load<u8>(AG_KIND + <usize>i);
    if (k == KIND_DEAD) continue;
    lastAlive = i + 1;
    if (k == KIND_HUMAN) {
      hum++;
      if (load<u8>(AG_INFECTION + <usize>i) > 0) inf++;
      const s = load<u8>(AG_SOCIAL + <usize>i);
      if (s == SOC_SOLO) soloH++;
      else if (s == SOC_GROUP) grpH++;
      else socH++;
      sumF += <i32>load<u8>(AG_INV_FOOD + <usize>i);
      sumW += <i32>load<u8>(AG_INV_WATER + <usize>i);
      sumG += <i32>load<u8>(AG_INV_GEAR + <usize>i);
    } else if (k == KIND_ZOMBIE) {
      zom++;
      if (load<u8>(AG_SUBKIND + <usize>i) == ZOM_ALPHA) zPacks++;
    } else if (k == KIND_ANIMAL) {
      ani++;
    }
  }
  activeLimit = lastAlive;
  freeCursor = 0;

  let facCount = 0;
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) != 0) facCount++;
  }

  setStat(ST_HUMANS, hum);
  setStat(ST_ZOMBIES, zom);
  setStat(ST_ANIMALS, ani);
  setStat(ST_INFECTED, inf);
  setStat(ST_SOLO_HUMANS, soloH);
  setStat(ST_GROUP_HUMANS, grpH);
  setStat(ST_SOC_HUMANS, socH);
  setStat(ST_SETTLEMENTS, facCount);
  setStat(ST_ZOMBIE_PACKS, zPacks);
  setStat(ST_AVG_FOOD, hum > 0 ? (sumF * 10) / hum : 0);
  setStat(ST_AVG_WATER, hum > 0 ? (sumW * 10) / hum : 0);
  setStat(ST_AVG_GEAR, hum > 0 ? sumG / hum : 0);
  setStat(ST_ACTIVE_AG, activeLimit);
}

export function stepTicks(count: i32): void {
  for (let s = 0; s < count; s++) {
    const tick = stat(ST_TICK) + 1;
    setStat(ST_TICK, tick);
    setStat(ST_DAY, tick / 200);

    rebuildSpatialHash();
    updateScentAndLoot(tick);

    const migRate = cfg(CFG_ZOMBIE_MIGRATION);
    if (migRate > 0.01 && (tick & 15) == 0) {
      const migCount = <i32>(migRate * 6.0);
      for (let m = 0; m < migCount; m++) {
        const edge = randInt(4);
        let mx = 4; let my = 4;
        if (edge == 0) { mx = 4 + randInt(gridW - 8); my = 4; }
        else if (edge == 1) { mx = 4 + randInt(gridW - 8); my = gridH - 5; }
        else if (edge == 2) { mx = 4; my = 4 + randInt(gridH - 8); }
        else { mx = gridW - 5; my = 4 + randInt(gridH - 8); }
        if (isPassable(tileAt(mx, my))) {
          spawnAgent(KIND_ZOMBIE, <u8>(m == 0 ? ZOM_ALPHA : ZOM_WALKER), <f32>mx, <f32>my, 85, 60, 60, 0, 0, 0, 0, 0, SOC_SOLO, 0xFFFF, 0);
        }
      }
    }

    for (let i = 0; i < activeLimit; i++) {
      const k = load<u8>(AG_KIND + <usize>i);
      if (k == KIND_HUMAN) stepHuman(i, tick);
      else if (k == KIND_ZOMBIE) stepZombie(i, tick);
      else if (k == KIND_ANIMAL) stepAnimal(i, tick);
    }

    if ((tick & 7) == 0) stepSocieties(tick);
  }
  recountAll();
}

// ---- Rendering ----
@inline function biomeColor(t: u8): u32 {
  switch (t) {
    case TILE_WATER:      return 0xFF5C351E;
    case TILE_BEACH:      return 0xFF7CA8B8;
    case TILE_SWAMP:      return 0xFF344835;
    case TILE_GRASS:      return 0xFF334C2F;
    case TILE_FOREST:     return 0xFF23381E;
    case TILE_HILL:       return 0xFF4F5456;
    case TILE_MOUNTAIN:   return 0xFF707478;
    case TILE_ROAD:       return 0xFF42454A;
    case TILE_TOWN:       return 0xFF565E68;
    case TILE_CITY:       return 0xFF646C76;
    case TILE_MILITARY:   return 0xFF354A46;
    case TILE_FARM:       return 0xFF39594A;
    case TILE_INDUSTRIAL: return 0xFF4B4957;
    case TILE_WALL:       return 0xFF9AA3AD;
    default:              return 0xFF334C2F;
  }
}

@inline function blendABGR(base: u32, over: u32, alpha: u32): u32 {
  const inv = 255 - alpha;
  const r = (((base & 0xFF) * inv + (over & 0xFF) * alpha) >> 8) & 0xFF;
  const g = ((((base >> 8) & 0xFF) * inv + ((over >> 8) & 0xFF) * alpha) >> 8) & 0xFF;
  const b = ((((base >> 16) & 0xFF) * inv + ((over >> 16) & 0xFF) * alpha) >> 8) & 0xFF;
  return 0xFF000000 | (b << 16) | (g << 8) | r;
}

export function renderFrame(overlayMode: i32, drawAgents: i32): void {
  for (let i = 0; i < gridN; i++) {
    const t = load<u8>(TILE_TYPE + <usize>i);
    let col = biomeColor(t);

    if (overlayMode == 4) {
      // Topography hypsometric + contour lines
      const el = <i32>load<u8>(ELEVATION + <usize>i);
      if (t == TILE_WATER) {
        col = 0xFF62371D;
      } else {
        const contour = (el & 15) < 2;
        const r = clampI(el - 20, 20, 230);
        const g = clampI(190 - abs(el - 115), 35, 210);
        const b = clampI(80 + (el >> 2), 40, 160);
        col = contour ? 0xFF20252A : (0xFF000000 | (<u32>b << 16) | (<u32>g << 8) | <u32>r);
      }
    } else if (overlayMode == 1) {
      const claim = <i32>load<u8>(FACTION_CLAIM + <usize>i);
      if (claim > 0 && claim <= MAX_FACTIONS) {
        col = blendABGR(col, load<u32>(FAC_COLOR + (<usize>(claim - 1) << 2)), 135);
      }
    } else if (overlayMode == 2) {
      const f = <u32>load<u8>(LOOT_FOOD + <usize>i);
      const w = <u32>load<u8>(LOOT_WATER + <usize>i);
      const g = <u32>load<u8>(LOOT_GEAR + <usize>i);
      if (f > 0 || w > 0 || g > 0) {
        const rC = clampI(<i32>(g * 3), 0, 255);
        const gC = clampI(<i32>(f * 4 + g * 2), 0, 255);
        const bC = clampI(<i32>(w * 5 + g * 2), 0, 255);
        col = blendABGR(col, 0xFF000000 | (<u32>bC << 16) | (<u32>gC << 8) | <u32>rC, 195);
      }
    } else if (overlayMode == 3) {
      const sc = <u32>load<u8>(SCENT_HEAT + <usize>i);
      if (sc > 4) {
        col = blendABGR(col, 0xFF000000 | (sc << 8) | 0xFF, sc > 220 ? 220 : sc);
      }
    } else {
      // Standard: subtle hillshade + territory tint
      const el = <i32>load<u8>(ELEVATION + <usize>i);
      if (el > 140) col = blendABGR(col, 0xFFFFFFFF, <u32>((el - 140) >> 2));
      const claim = <i32>load<u8>(FACTION_CLAIM + <usize>i);
      if (claim > 0 && claim <= MAX_FACTIONS) {
        col = blendABGR(col, load<u32>(FAC_COLOR + (<usize>(claim - 1) << 2)), 42);
      }
    }

    store<u32>(FRAME_RGBA + (<usize>i << 2), col);
  }

  if (drawAgents != 0) {
    for (let i = 0; i < activeLimit; i++) {
      const k = load<u8>(AG_KIND + <usize>i);
      if (k == KIND_DEAD) continue;
      const ax = clampI(<i32>load<f32>(AG_X + (<usize>i << 2)), 0, gridW - 1);
      const ay = clampI(<i32>load<f32>(AG_Y + (<usize>i << 2)), 0, gridH - 1);
      const idx = ay * gridW + ax;
      let col: u32 = 0xFF4B53E5; // zombie crimson
      if (k == KIND_HUMAN) {
        if (load<u8>(AG_INFECTION + <usize>i) > 0) {
          col = 0xFF3FD6D6;
        } else if (load<u8>(AG_SOCIAL + <usize>i) == SOC_SOCIETY) {
          const f = <i32>load<u16>(AG_GROUP + (<usize>i << 1));
          col = (f >= 0 && f < MAX_FACTIONS) ? load<u32>(FAC_COLOR + (<usize>f << 2)) : 0xFFF5F5F5;
        } else if (load<u8>(AG_SOCIAL + <usize>i) == SOC_GROUP) {
          col = 0xFFFFD8A8; // warm sky for small groups
        } else {
          col = 0xFFF5F5F5;
        }
      } else if (k == KIND_ANIMAL) {
        col = load<u8>(AG_SUBKIND + <usize>i) == ANI_WOLF ? 0xFF90A8D8 : 0xFF52B8E0;
      } else if (load<u8>(AG_SUBKIND + <usize>i) == ZOM_ALPHA) {
        col = 0xFF9038E8; // alpha purple-red
      }
      store<u32>(FRAME_RGBA + (<usize>idx << 2), col);
    }
  }
}

// ---- Brushes ----
export function brushSpawnZombies(cx: i32, cy: i32, radius: i32, count: i32): void {
  const r = clampI(radius, 1, 60);
  for (let n = 0; n < count; n++) {
    const ang = randF() * 6.283;
    const dist = Mathf.sqrt(randF()) * <f32>r;
    const x = clampI(<i32>(<f32>cx + Mathf.cos(ang) * dist), 1, gridW - 2);
    const y = clampI(<i32>(<f32>cy + Mathf.sin(ang) * dist), 1, gridH - 2);
    if (isPassable(tileAt(x, y))) {
      spawnAgent(KIND_ZOMBIE, <u8>(n % 12 == 0 ? ZOM_ALPHA : (n % 4 == 0 ? ZOM_RUNNER : ZOM_WALKER)), <f32>x + randF(), <f32>y + randF(), 85, 60, 60, 0, 0, 0, 0, 0, SOC_SOLO, 0xFFFF, 0);
    }
  }
  recountAll();
}

export function brushSpawnHumans(cx: i32, cy: i32, radius: i32, count: i32): void {
  const r = clampI(radius, 1, 60);
  for (let n = 0; n < count; n++) {
    const ang = randF() * 6.283;
    const dist = Mathf.sqrt(randF()) * <f32>r;
    const x = clampI(<i32>(<f32>cx + Mathf.cos(ang) * dist), 1, gridW - 2);
    const y = clampI(<i32>(<f32>cy + Mathf.sin(ang) * dist), 1, gridH - 2);
    if (isPassable(tileAt(x, y))) {
      spawnAgent(KIND_HUMAN, <u8>randInt(6), <f32>x + randF(), <f32>y + randF(), 100, 90, 90, 3, 3, <u8>(15 + randInt(25)), 1, 1, SOC_SOLO, 0xFFFF, packPersonality(randInt(16), randInt(16), randInt(16), randInt(16)));
    }
  }
  recountAll();
}

export function brushSpawnAnimals(cx: i32, cy: i32, radius: i32, count: i32): void {
  const r = clampI(radius, 1, 60);
  for (let n = 0; n < count; n++) {
    const ang = randF() * 6.283;
    const dist = Mathf.sqrt(randF()) * <f32>r;
    const x = clampI(<i32>(<f32>cx + Mathf.cos(ang) * dist), 1, gridW - 2);
    const y = clampI(<i32>(<f32>cy + Mathf.sin(ang) * dist), 1, gridH - 2);
    if (isPassable(tileAt(x, y))) {
      spawnAgent(KIND_ANIMAL, <u8>(n % 5 == 0 ? ANI_WOLF : (n % 3 == 0 ? ANI_BOAR : ANI_DEER)), <f32>x + randF(), <f32>y + randF(), 55, 85, 85, 0, 0, 0, 0, 0, SOC_SOLO, 0xFFFF, 0);
    }
  }
  recountAll();
}

export function brushAirdrop(cx: i32, cy: i32, radius: i32): void {
  const r = clampI(radius, 1, 40);
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    const y = clampI(cy + dy, 1, gridH - 2);
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = clampI(cx + dx, 1, gridW - 2);
      const idx = <usize>(y * gridW + x);
      if (!isPassable(load<u8>(TILE_TYPE + idx))) continue;
      store<u8>(LOOT_FOOD + idx, <u8>clampI(<i32>load<u8>(LOOT_FOOD + idx) + 35, 0, 255));
      store<u8>(LOOT_WATER + idx, <u8>clampI(<i32>load<u8>(LOOT_WATER + idx) + 35, 0, 255));
      store<u8>(LOOT_GEAR + idx, <u8>clampI(<i32>load<u8>(LOOT_GEAR + idx) + 45, 0, 255));
    }
  }
  addScent(clampI(cx, 0, gridW - 1), clampI(cy, 0, gridH - 1), 220);
}

export function brushClear(cx: i32, cy: i32, radius: i32): void {
  const r2 = <f32>(radius * radius);
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) continue;
    const dx = load<f32>(AG_X + (<usize>i << 2)) - <f32>cx;
    const dy = load<f32>(AG_Y + (<usize>i << 2)) - <f32>cy;
    if (dx * dx + dy * dy <= r2) {
      store<u8>(AG_KIND + <usize>i, KIND_DEAD);
    }
  }
  recountAll();
}

export function findNearestAgent(wx: f32, wy: f32, maxDist: f32): i32 {
  let best = -1;
  let bestD2 = maxDist * maxDist;
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) continue;
    const dx = load<f32>(AG_X + (<usize>i << 2)) - wx;
    const dy = load<f32>(AG_Y + (<usize>i << 2)) - wy;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = i;
    }
  }
  return best;
}
