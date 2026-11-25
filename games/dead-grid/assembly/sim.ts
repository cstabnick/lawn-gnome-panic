// Dead Grid WASM Simulation Kernel (AssemblyScript, --runtime stub -O3)
// 512x512 grid, 128x128 spatial hash, up to 32,768 SoA agents, 16 factions, 64-entry event ring.
// Fixed 64-page (4 MB) linear memory layout so JS TypedArray views never detach.

export const GRID_W: i32 = 512;
export const GRID_H: i32 = 512;
export const GRID_N: i32 = 262144; // 512 * 512
export const HASH_W: i32 = 128;
export const HASH_H: i32 = 128;
export const HASH_N: i32 = 16384; // 128 * 128
export const MAX_AGENTS: i32 = 32768;
export const MAX_FACTIONS: i32 = 16;
export const MAX_EVENTS: i32 = 64;

// ---- Fixed Memory Map (0x000000 .. 0x3C0000 < 4 MB) ----
const CFG_PTR: usize        = 0x008000; // 32 * f32 (128 B)
const STATS_PTR: usize      = 0x008100; // 16 * i32 (64 B)
const EVENTS_PTR: usize     = 0x008200; // 64 * 16 B (1024 B)

const FAC_ACTIVE: usize     = 0x008600; // 16 * u8
const FAC_LEVEL: usize      = 0x008620; // 16 * u8
const FAC_ETHOS: usize      = 0x008640; // 16 * u8
const FAC_X: usize          = 0x008660; // 16 * u16
const FAC_Y: usize          = 0x008680; // 16 * u16
const FAC_POP: usize        = 0x0086A0; // 16 * u16
const FAC_FOOD: usize       = 0x0086C0; // 16 * f32
const FAC_MATS: usize       = 0x008700; // 16 * f32
const FAC_COLOR: usize      = 0x008740; // 16 * u32
const FAC_KILLS: usize      = 0x008780; // 16 * u32
const FAC_FOUNDED: usize    = 0x0087C0; // 16 * u32
const FAC_REL: usize        = 0x008800; // 256 * i8

const TILE_TYPE: usize      = 0x010000; // 262144 * u8 (256 KB)
const LOOT_FOOD: usize      = 0x050000; // 262144 * u8 (256 KB)
const LOOT_GEAR: usize      = 0x090000; // 262144 * u8 (256 KB)
const FACTION_CLAIM: usize  = 0x0D0000; // 262144 * u8 (256 KB)
const SCENT_HEAT: usize     = 0x110000; // 262144 * u8 (256 KB)
const SCENT_SCRATCH: usize  = 0x150000; // 262144 * u8 (256 KB)

const HASH_HEAD: usize      = 0x190000; // 16384 * i32 (64 KB)
const AG_NEXT: usize        = 0x1A0000; // 32768 * i32 (128 KB)

const AG_KIND: usize        = 0x1C0000; // 32768 * u8 (32 KB)
const AG_HP: usize          = 0x1C8000; // 32768 * u8 (32 KB)
const AG_HUNGER: usize      = 0x1D0000; // 32768 * u8 (32 KB)
const AG_GEAR: usize        = 0x1D8000; // 32768 * u8 (32 KB)
const AG_FOOD: usize        = 0x1E0000; // 32768 * u8 (32 KB)
const AG_STATE: usize       = 0x1E8000; // 32768 * u8 (32 KB)
const AG_FACTION: usize     = 0x1F0000; // 32768 * u8 (32 KB)
const AG_TRAIT: usize       = 0x1F8000; // 32768 * u8 (32 KB)
const AG_COOLDOWN: usize    = 0x200000; // 32768 * u8 (32 KB)
const AG_INFECTION: usize   = 0x208000; // 32768 * u8 (32 KB)
const AG_AGE: usize         = 0x210000; // 32768 * u16 (64 KB)
const AG_TARGET_X: usize    = 0x220000; // 32768 * u16 (64 KB)
const AG_TARGET_Y: usize    = 0x230000; // 32768 * u16 (64 KB)
const AG_X: usize           = 0x240000; // 32768 * f32 (128 KB)
const AG_Y: usize           = 0x260000; // 32768 * f32 (128 KB)
const AG_VX: usize          = 0x280000; // 32768 * f32 (128 KB)
const AG_VY: usize          = 0x2A0000; // 32768 * f32 (128 KB)

const FRAME_RGBA: usize     = 0x2C0000; // 262144 * u32 (1024 KB -> 0x3C0000)

// ---- Tile types ----
const TILE_WATER: u8      = 0;
const TILE_BEACH: u8      = 1;
const TILE_GRASS: u8      = 2;
const TILE_FOREST: u8     = 3;
const TILE_HILL: u8       = 4;
const TILE_ROAD: u8       = 5;
const TILE_TOWN: u8       = 6;
const TILE_CITY: u8       = 7;
const TILE_MILITARY: u8   = 8;
const TILE_FARM: u8       = 9;
const TILE_INDUSTRIAL: u8 = 10;
const TILE_WALL: u8       = 11;

// ---- Agent kinds & states ----
const KIND_DEAD: u8     = 0;
const KIND_SURVIVOR: u8 = 1;
const KIND_ZOMBIE: u8   = 2;

const STATE_ROAM: u8    = 0;
const STATE_SCAVENGE: u8 = 1;
const STATE_FLEE: u8    = 2;
const STATE_FIGHT: u8   = 3;
const STATE_RETURN: u8  = 4;
const STATE_GUARD: u8   = 5;
const STATE_RAID: u8    = 6;
const STATE_SHAMBLE: u8 = 7;
const STATE_CHASE: u8   = 8;

// ---- Faction Ethos ----
const ETHOS_COOP: u8    = 0;
const ETHOS_FORT: u8    = 1;
const ETHOS_RAIDER: u8  = 2;

// ---- Config indices ----
const CFG_ZOMBIE_SPEED: i32       = 0;
const CFG_SURVIVOR_SPEED: i32     = 1;
const CFG_INFECTION_CHANCE: i32   = 2;
const CFG_HUNGER_RATE: i32        = 3;
const CFG_LOOT_RESPAWN: i32       = 4;
const CFG_HORDE_HEARING: i32      = 5;
const CFG_SETTLEMENT_GROWTH: i32  = 6;
const CFG_BANDITRY: i32           = 7;
const CFG_ZOMBIE_MIGRATION: i32   = 8;
const CFG_INIT_SURVIVORS: i32     = 9;
const CFG_INIT_ZOMBIES: i32       = 10;
const CFG_CITY_DENSITY: i32       = 11;

// ---- Stats indices ----
const ST_TICK: i32        = 0;
const ST_DAY: i32         = 1;
const ST_SURVIVORS: i32   = 2;
const ST_ZOMBIES: i32     = 3;
const ST_INFECTED: i32    = 4;
const ST_SETTLEMENTS: i32 = 5;
const ST_DEATHS: i32      = 6;
const ST_ZKILLS: i32      = 7;
const ST_TURNED: i32      = 8;
const ST_EVENT_IDX: i32   = 9;
const ST_ACTIVE_AG: i32   = 10;

// ---- Event types ----
const EVT_FOUNDED: i32      = 1;
const EVT_UPGRADED: i32     = 2;
const EVT_FALLEN: i32       = 3;
const EVT_HORDE_BREACH: i32 = 4;
const EVT_RAID: i32         = 5;

// ---- Pointer getters ----
export function getCfgPtr(): usize { return CFG_PTR; }
export function getStatsPtr(): usize { return STATS_PTR; }
export function getEventsPtr(): usize { return EVENTS_PTR; }
export function getTileTypePtr(): usize { return TILE_TYPE; }
export function getLootFoodPtr(): usize { return LOOT_FOOD; }
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
export function getFacMatsPtr(): usize { return FAC_MATS; }
export function getFacColorPtr(): usize { return FAC_COLOR; }
export function getFacKillsPtr(): usize { return FAC_KILLS; }
export function getFacFoundedPtr(): usize { return FAC_FOUNDED; }

export function getAgKindPtr(): usize { return AG_KIND; }
export function getAgHpPtr(): usize { return AG_HP; }
export function getAgHungerPtr(): usize { return AG_HUNGER; }
export function getAgGearPtr(): usize { return AG_GEAR; }
export function getAgFoodPtr(): usize { return AG_FOOD; }
export function getAgStatePtr(): usize { return AG_STATE; }
export function getAgFactionPtr(): usize { return AG_FACTION; }
export function getAgTraitPtr(): usize { return AG_TRAIT; }
export function getAgInfectionPtr(): usize { return AG_INFECTION; }
export function getAgAgePtr(): usize { return AG_AGE; }
export function getAgXPtr(): usize { return AG_X; }
export function getAgYPtr(): usize { return AG_Y; }

// ---- Global PRNG & runtime state ----
let rngState: u32 = 0x12345678;
let worldSeed: u32 = 1337;
let activeLimit: i32 = 0; // high-water mark in agent arrays

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

// ---- Deterministic noise for terrain ----
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

@inline function clampI(v: i32, lo: i32, hi: i32): i32 {
  return v < lo ? lo : (v > hi ? hi : v);
}

@inline function clampF(v: f32, lo: f32, hi: f32): f32 {
  return v < lo ? lo : (v > hi ? hi : v);
}

@inline function tileAt(tx: i32, ty: i32): u8 {
  return load<u8>(TILE_TYPE + <usize>(ty * GRID_W + tx));
}

@inline function setTile(tx: i32, ty: i32, t: u8): void {
  store<u8>(TILE_TYPE + <usize>(ty * GRID_W + tx), t);
}

@inline function isPassable(t: u8): bool {
  return t != TILE_WATER && t != TILE_WALL;
}

// ---- Faction palette (ABGR little-endian for Uint32Array -> ImageData) ----
const FACTION_PALETTE: StaticArray<u32> = [
  0xFFF59B53, // 0: Sky blue (#539bf5)
  0xFF53C2E6, // 1: Amber gold (#e6c253)
  0xFF83D167, // 2: Mint green (#67d183)
  0xFFE582B0, // 3: Lavender (#b082e5)
  0xFF6BA8FF, // 4: Coral orange (#ffa86b)
  0xFFD4CC4D, // 5: Teal (#4dccd4)
  0xFF9C72F2, // 6: Rose (#f2729c)
  0xFF6EE0C9, // 7: Lime (#c9e06e)
  0xFFE6B08E, // 8: Periwinkle (#8eb0e6)
  0xFF7094D9, // 9: Terracotta (#d99470)
  0xFFC4E096, // 10: Seafoam (#96e0c4)
  0xFFD990CC, // 11: Orchid (#cc90d9)
  0xFF78D6E6, // 12: Mustard (#e6d678)
  0xFFA38CE6, // 13: Salmon (#e68ca3)
  0xFF88D4A8, // 14: Sage (#a8d488)
  0xFFF0D4A8, // 15: Ice (#a8d4f0)
];

function stampZone(cx: i32, cy: i32, rx: i32, ry: i32, t: u8, irregular: bool): void {
  const x0 = clampI(cx - rx, 1, GRID_W - 2);
  const x1 = clampI(cx + rx, 1, GRID_W - 2);
  const y0 = clampI(cy - ry, 1, GRID_H - 2);
  const y1 = clampI(cy + ry, 1, GRID_H - 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = y * GRID_W + x;
      if (load<u8>(TILE_TYPE + <usize>idx) == TILE_WATER) continue;
      const dx = <f32>(x - cx) / <f32>Mathf.max(1.0, <f32>rx);
      const dy = <f32>(y - cy) / <f32>Mathf.max(1.0, <f32>ry);
      let d = dx * dx + dy * dy;
      if (irregular) {
        d += (hash2(x, y, worldSeed) - 0.5) * 0.35;
      }
      if (d <= 1.0) {
        store<u8>(TILE_TYPE + <usize>idx, t);
      }
    }
  }
}

function drawRoad(x0: i32, y0: i32, x1: i32, y1: i32): void {
  let cx = x0;
  let cy = y0;
  const steps = <i32>Mathf.max(<f32>abs(x1 - x0), <f32>abs(y1 - y0)) + 1;
  for (let s = 0; s <= steps; s++) {
    const t = <f32>s / <f32>Mathf.max(1.0, <f32>steps);
    const wx = <i32>(<f32>x0 + <f32>(x1 - x0) * t + Mathf.sin(t * 6.283) * 4.0);
    const wy = <i32>(<f32>y0 + <f32>(y1 - y0) * t + Mathf.cos(t * 5.0) * 4.0);
    cx = clampI(wx, 1, GRID_W - 2);
    cy = clampI(wy, 1, GRID_H - 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (abs(dx) + abs(dy) > 1) continue;
        const nx = clampI(cx + dx, 1, GRID_W - 2);
        const ny = clampI(cy + dy, 1, GRID_H - 2);
        const cur = tileAt(nx, ny);
        if (cur != TILE_WATER && cur != TILE_CITY && cur != TILE_MILITARY) {
          setTile(nx, ny, TILE_ROAD);
        }
      }
    }
  }
}

function spawnAgent(
  kind: u8,
  x: f32,
  y: f32,
  hp: u8,
  hunger: u8,
  gear: u8,
  food: u8,
  faction: u8,
  trait: u8,
): i32 {
  let slot = -1;
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) {
      slot = i;
      break;
    }
  }
  if (slot < 0) {
    if (activeLimit >= MAX_AGENTS) return -1;
    slot = activeLimit++;
  }
  const u = <usize>slot;
  store<u8>(AG_KIND + u, kind);
  store<u8>(AG_HP + u, hp);
  store<u8>(AG_HUNGER + u, hunger);
  store<u8>(AG_GEAR + u, gear);
  store<u8>(AG_FOOD + u, food);
  store<u8>(AG_STATE + u, kind == KIND_ZOMBIE ? STATE_SHAMBLE : STATE_ROAM);
  store<u8>(AG_FACTION + u, faction);
  store<u8>(AG_TRAIT + u, trait);
  store<u8>(AG_COOLDOWN + u, <u8>randInt(8));
  store<u8>(AG_INFECTION + u, 0);
  store<u16>(AG_AGE + (u << 1), 0);
  store<u16>(AG_TARGET_X + (u << 1), <u16>clampI(<i32>x, 0, GRID_W - 1));
  store<u16>(AG_TARGET_Y + (u << 1), <u16>clampI(<i32>y, 0, GRID_H - 1));
  store<f32>(AG_X + (u << 2), x);
  store<f32>(AG_Y + (u << 2), y);
  store<f32>(AG_VX + (u << 2), 0.0);
  store<f32>(AG_VY + (u << 2), 0.0);
  return slot;
}

function findSpawnTile(preferKindA: u8, preferKindB: u8): i32 {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = 4 + randInt(GRID_W - 8);
    const y = 4 + randInt(GRID_H - 8);
    const t = tileAt(x, y);
    if (!isPassable(t)) continue;
    if (attempt < 28 && t != preferKindA && t != preferKindB) continue;
    return y * GRID_W + x;
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    const x = 4 + randInt(GRID_W - 8);
    const y = 4 + randInt(GRID_H - 8);
    if (isPassable(tileAt(x, y))) return y * GRID_W + x;
  }
  return (GRID_H >> 1) * GRID_W + (GRID_W >> 1);
}

export function generateWorld(seed: u32): void {
  worldSeed = seed == 0 ? 1 : seed;
  rngState = worldSeed * 1664525 + 1013904223;
  if (rngState == 0) rngState = 0x9E3779B9;

  // Clear stats, events, factions, agents, claims, scent
  memory.fill(STATS_PTR, 0, 64);
  memory.fill(EVENTS_PTR, 0, MAX_EVENTS * 16);
  memory.fill(FAC_ACTIVE, 0, 0x0300);
  memory.fill(FACTION_CLAIM, 0, GRID_N);
  memory.fill(SCENT_HEAT, 0, GRID_N);
  memory.fill(SCENT_SCRATCH, 0, GRID_N);
  memory.fill(AG_KIND, 0, MAX_AGENTS);
  activeLimit = 0;

  // 1. Base Chernarus-inspired heightfield + coast + river
  const riverShift = (randF() - 0.5) * 60.0;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const idx = y * GRID_W + x;
      const nx = <f32>x / 110.0;
      const ny = <f32>y / 110.0;
      const elev = fbm(nx, ny, worldSeed);
      const moisture = fbm(nx * 1.4 + 17.3, ny * 1.4 + 9.1, worldSeed + 777);

      // South and East ocean coastline
      const southDist = <f32>(GRID_H - 1 - y);
      const eastDist = <f32>(GRID_W - 1 - x);
      const coastWave = Mathf.sin(<f32>x * 0.028) * 10.0 + (elev - 0.5) * 28.0;
      const coastDist = Mathf.min(southDist, eastDist) + coastWave;

      let tile: u8 = TILE_GRASS;
      if (coastDist < 18.0) {
        tile = TILE_WATER;
      } else if (coastDist < 24.0) {
        tile = TILE_BEACH;
      } else if (elev > 0.67) {
        tile = TILE_HILL;
      } else if (moisture > 0.55 || (elev > 0.55 && moisture > 0.48)) {
        tile = TILE_FOREST;
      }
      store<u8>(TILE_TYPE + <usize>idx, tile);
    }
  }

  // Winding inland river
  let rx: f32 = 30.0 + randF() * 120.0;
  for (let y = 0; y < GRID_H - 16; y++) {
    rx += Mathf.sin(<f32>y * 0.035 + riverShift) * 1.3 + (fbm(<f32>y * 0.02, 3.1, worldSeed + 55) - 0.5) * 1.8;
    const cx = clampI(<i32>rx, 10, GRID_W - 20);
    for (let dx = -2; dx <= 2; dx++) {
      setTile(cx + dx, y, TILE_WATER);
    }
    if (tileAt(cx - 3, y) == TILE_GRASS) setTile(cx - 3, y, TILE_BEACH);
    if (tileAt(cx + 3, y) == TILE_GRASS) setTile(cx + 3, y, TILE_BEACH);
  }

  // 2. Cities, towns, military bases, industrial & farms
  const density = clampF(cfg(CFG_CITY_DENSITY), 0.3, 2.0);
  const numCities = clampI(<i32>(6.0 * density), 3, 12);
  const numTowns = clampI(<i32>(14.0 * density), 6, 26);
  const numMil = clampI(<i32>(5.0 * density), 2, 10);

  const hubX = new StaticArray<i32>(48);
  const hubY = new StaticArray<i32>(48);
  let hubCount = 0;

  for (let i = 0; i < numCities; i++) {
    const pos = findSpawnTile(TILE_GRASS, TILE_BEACH);
    const cx = pos % GRID_W;
    const cy = pos / GRID_W;
    const rad = 11 + randInt(7);
    stampZone(cx, cy, rad, rad - 2 + randInt(4), TILE_CITY, false);
    stampZone(cx + rad - 2, cy + 3, 6, 5, TILE_INDUSTRIAL, false);
    if (hubCount < 48) { hubX[hubCount] = cx; hubY[hubCount] = cy; hubCount++; }
  }

  for (let i = 0; i < numTowns; i++) {
    const pos = findSpawnTile(TILE_GRASS, TILE_FOREST);
    const cx = pos % GRID_W;
    const cy = pos / GRID_W;
    stampZone(cx, cy, 6 + randInt(4), 5 + randInt(4), TILE_TOWN, false);
    stampZone(cx + 7, cy - 4, 5, 4, TILE_FARM, false);
    if (hubCount < 48) { hubX[hubCount] = cx; hubY[hubCount] = cy; hubCount++; }
  }

  for (let i = 0; i < numMil; i++) {
    // Prefer northern/western interior
    const cx = 36 + randInt(GRID_W - 140);
    const cy = 30 + randInt(GRID_H - 140);
    if (tileAt(cx, cy) != TILE_WATER) {
      stampZone(cx, cy, 8 + randInt(3), 7 + randInt(3), TILE_MILITARY, false);
      if (hubCount < 48) { hubX[hubCount] = cx; hubY[hubCount] = cy; hubCount++; }
    }
  }

  // 3. Connect nearby hubs with roads
  for (let i = 0; i < hubCount; i++) {
    let bestA = -1;
    let bestDistA = 999999;
    let bestB = -1;
    let bestDistB = 999999;
    for (let j = 0; j < hubCount; j++) {
      if (i == j) continue;
      const dx = hubX[j] - hubX[i];
      const dy = hubY[j] - hubY[i];
      const d = dx * dx + dy * dy;
      if (d < bestDistA) {
        bestDistB = bestDistA; bestB = bestA;
        bestDistA = d; bestA = j;
      } else if (d < bestDistB) {
        bestDistB = d; bestB = j;
      }
    }
    if (bestA >= 0) drawRoad(hubX[i], hubY[i], hubX[bestA], hubY[bestA]);
    if (bestB >= 0 && randInt(2) == 0) drawRoad(hubX[i], hubY[i], hubX[bestB], hubY[bestB]);
  }

  // 4. Seed initial loot per biome
  for (let i = 0; i < GRID_N; i++) {
    const t = load<u8>(TILE_TYPE + <usize>i);
    let f: u8 = 0;
    let g: u8 = 0;
    const r = randU32() & 255;
    if (t == TILE_CITY) {
      if (r < 90) f = <u8>(15 + (r & 31));
      if (r < 65) g = <u8>(12 + (r & 31));
    } else if (t == TILE_TOWN) {
      if (r < 85) f = <u8>(18 + (r & 31));
      if (r < 45) g = <u8>(8 + (r & 15));
    } else if (t == TILE_FARM) {
      if (r < 120) f = <u8>(28 + (r & 31));
    } else if (t == TILE_MILITARY) {
      if (r < 40) f = <u8>(15 + (r & 15));
      if (r < 140) g = <u8>(45 + (r & 63));
    } else if (t == TILE_INDUSTRIAL) {
      if (r < 95) g = <u8>(22 + (r & 31));
    } else if (t == TILE_FOREST && r < 14) {
      f = 8;
    }
    store<u8>(LOOT_FOOD + <usize>i, f);
    store<u8>(LOOT_GEAR + <usize>i, g);
  }

  // 5. Spawn initial zombies & survivors
  const initZ = clampI(<i32>cfg(CFG_INIT_ZOMBIES), 0, 26000);
  const initS = clampI(<i32>cfg(CFG_INIT_SURVIVORS), 0, 12000);

  for (let i = 0; i < initZ; i++) {
    const pos = i % 5 == 0
      ? findSpawnTile(TILE_GRASS, TILE_ROAD)
      : findSpawnTile(TILE_CITY, TILE_TOWN);
    const zx = <f32>(pos % GRID_W) + randF();
    const zy = <f32>(pos / GRID_W) + randF();
    spawnAgent(KIND_ZOMBIE, zx, zy, <u8>(70 + randInt(40)), 0, 0, 0, 255, <u8>randInt(4));
  }

  for (let i = 0; i < initS; i++) {
    const pos = i % 3 == 0
      ? findSpawnTile(TILE_BEACH, TILE_ROAD)
      : findSpawnTile(TILE_GRASS, TILE_TOWN);
    const sx = <f32>(pos % GRID_W) + randF();
    const sy = <f32>(pos / GRID_W) + randF();
    spawnAgent(
      KIND_SURVIVOR,
      sx,
      sy,
      100,
      <u8>(75 + randInt(25)),
      <u8>(6 + randInt(16)),
      <u8>(2 + randInt(4)),
      255,
      <u8>randInt(4), // 0=scavenger, 1=builder, 2=fighter, 3=opportunist
    );
  }

  recountAgents();
}

function rebuildSpatialHash(): void {
  memory.fill(HASH_HEAD, 0xFF, HASH_N * 4); // -1
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) == KIND_DEAD) continue;
    const x = clampI(<i32>load<f32>(AG_X + (<usize>i << 2)), 0, GRID_W - 1);
    const y = clampI(<i32>load<f32>(AG_Y + (<usize>i << 2)), 0, GRID_H - 1);
    const b = (y >> 2) * HASH_W + (x >> 2);
    const headPtr = HASH_HEAD + (<usize>b << 2);
    store<i32>(AG_NEXT + (<usize>i << 2), load<i32>(headPtr));
    store<i32>(headPtr, i);
  }
}

function updateScentAndLoot(tick: i32): void {
  // Fast scent decay & 4-neighbor diffusion every 2 ticks
  if ((tick & 1) == 0) {
    for (let y = 1; y < GRID_H - 1; y++) {
      const row = y * GRID_W;
      for (let x = 1; x < GRID_W - 1; x++) {
        const idx = row + x;
        const c = <i32>load<u8>(SCENT_HEAT + <usize>idx);
        const n = <i32>load<u8>(SCENT_HEAT + <usize>(idx - GRID_W));
        const s = <i32>load<u8>(SCENT_HEAT + <usize>(idx + GRID_W));
        const w = <i32>load<u8>(SCENT_HEAT + <usize>(idx - 1));
        const e = <i32>load<u8>(SCENT_HEAT + <usize>(idx + 1));
        const mixed = ((c * 4 + n + s + w + e) >> 3) - 2;
        store<u8>(SCENT_SCRATCH + <usize>idx, <u8>(mixed > 0 ? mixed : 0));
      }
    }
    memory.copy(SCENT_HEAT, SCENT_SCRATCH, GRID_N);
  }

  // Periodic loot respawn across a strided slice of the map
  const respawnRate = cfg(CFG_LOOT_RESPAWN);
  if (respawnRate > 0.01) {
    const stride = 64;
    const phase = tick & 63;
    const prob = <i32>(respawnRate * 32.0);
    for (let i = phase; i < GRID_N; i += stride) {
      if ((<i32>(randU32() & 255)) >= prob) continue;
      const t = load<u8>(TILE_TYPE + <usize>i);
      if (t == TILE_FARM) {
        const cur = load<u8>(LOOT_FOOD + <usize>i);
        if (cur < 45) store<u8>(LOOT_FOOD + <usize>i, cur + 8);
      } else if (t == TILE_TOWN || t == TILE_CITY) {
        const curF = load<u8>(LOOT_FOOD + <usize>i);
        if (curF < 30) store<u8>(LOOT_FOOD + <usize>i, curF + 6);
        const curG = load<u8>(LOOT_GEAR + <usize>i);
        if (curG < 24) store<u8>(LOOT_GEAR + <usize>i, curG + 4);
      } else if (t == TILE_MILITARY || t == TILE_INDUSTRIAL) {
        const curG = load<u8>(LOOT_GEAR + <usize>i);
        if (curG < 70) store<u8>(LOOT_GEAR + <usize>i, curG + 10);
      }
    }
  }
}

@inline function addScent(tx: i32, ty: i32, amount: i32): void {
  const ptr = SCENT_HEAT + <usize>(ty * GRID_W + tx);
  const cur = <i32>load<u8>(ptr) + amount;
  store<u8>(ptr, <u8>(cur > 255 ? 255 : cur));
}

function claimTerritory(facId: u8, cx: i32, cy: i32, radius: i32, buildWalls: bool): void {
  const x0 = clampI(cx - radius, 1, GRID_W - 2);
  const x1 = clampI(cx + radius, 1, GRID_W - 2);
  const y0 = clampI(cy - radius, 1, GRID_H - 2);
  const y1 = clampI(cy + radius, 1, GRID_H - 2);
  const r2 = radius * radius;
  const wallInner = (radius - 1) * (radius - 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const idx = y * GRID_W + x;
      const t = load<u8>(TILE_TYPE + <usize>idx);
      if (t == TILE_WATER) continue;
      store<u8>(FACTION_CLAIM + <usize>idx, facId + 1);
      if (buildWalls && d2 >= wallInner && t != TILE_ROAD && t != TILE_WALL) {
        // Leave 4 cardinal gates so survivors can enter/exit freely
        if (abs(dx) > 1 && abs(dy) > 1) {
          store<u8>(TILE_TYPE + <usize>idx, TILE_WALL);
        }
      }
    }
  }
}

function tryFoundSettlement(leaderIdx: i32, x: i32, y: i32): void {
  // Check minimum distance to any active settlement
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) == 0) continue;
    const fx = <i32>load<u16>(FAC_X + (<usize>f << 1));
    const fy = <i32>load<u16>(FAC_Y + (<usize>f << 1));
    const dx = fx - x;
    const dy = fy - y;
    if (dx * dx + dy * dy < 32 * 32) return;
  }

  // Find free faction slot
  let slot = -1;
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) == 0) {
      slot = f;
      break;
    }
  }
  if (slot < 0) return;

  // Count nearby lone survivors to form initial group
  const bx = x >> 2;
  const by = y >> 2;
  let allies = 0;
  for (let dy = -2; dy <= 2; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= HASH_H) continue;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= HASH_W) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * HASH_W + nx) << 2));
      while (cur >= 0) {
        if (load<u8>(AG_KIND + <usize>cur) == KIND_SURVIVOR && load<u8>(AG_FACTION + <usize>cur) == 255) {
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
  store<f32>(FAC_FOOD + (u << 2), 25.0);
  store<f32>(FAC_MATS + (u << 2), 10.0);
  store<u32>(FAC_COLOR + (u << 2), unchecked(FACTION_PALETTE[slot]));
  store<u32>(FAC_KILLS + (u << 2), 0);
  store<u32>(FAC_FOUNDED + (u << 2), <u32>stat(ST_TICK));

  // Initialize relations
  for (let o = 0; o < MAX_FACTIONS; o++) {
    let rel: i8 = 0;
    if (ethos == ETHOS_RAIDER || load<u8>(FAC_ETHOS + <usize>o) == ETHOS_RAIDER) rel = -60;
    else rel = 25;
    store<i8>(FAC_REL + <usize>(slot * MAX_FACTIONS + o), rel);
    store<i8>(FAC_REL + <usize>(o * MAX_FACTIONS + slot), rel);
  }

  // Recruit nearby lone survivors
  for (let dy = -2; dy <= 2; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= HASH_H) continue;
    for (let dx = -2; dx <= 2; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= HASH_W) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * HASH_W + nx) << 2));
      while (cur >= 0) {
        if (load<u8>(AG_KIND + <usize>cur) == KIND_SURVIVOR && load<u8>(AG_FACTION + <usize>cur) == 255) {
          store<u8>(AG_FACTION + <usize>cur, <u8>slot);
          store<u8>(AG_STATE + <usize>cur, STATE_GUARD);
        }
        cur = load<i32>(AG_NEXT + (<usize>cur << 2));
      }
    }
  }
  store<u8>(AG_FACTION + <usize>leaderIdx, <u8>slot);
  claimTerritory(<u8>slot, x, y, 7, false);
  pushEvent(EVT_FOUNDED, slot, (x << 10) | y);
}

function stepSurvivor(i: i32, tick: i32): void {
  const u = <usize>i;
  let ax = load<f32>(AG_X + (u << 2));
  let ay = load<f32>(AG_Y + (u << 2));
  let hp = <i32>load<u8>(AG_HP + u);
  let hunger = <i32>load<u8>(AG_HUNGER + u);
  let gear = <i32>load<u8>(AG_GEAR + u);
  let food = <i32>load<u8>(AG_FOOD + u);
  let fac = load<u8>(AG_FACTION + u);
  const trait = load<u8>(AG_TRAIT + u);
  let cd = <i32>load<u8>(AG_COOLDOWN + u);
  if (cd > 0) cd--;

  // Age
  const agePtr = AG_AGE + (u << 1);
  const age = load<u16>(agePtr);
  if (age < 65530 && (tick & 3) == 0) store<u16>(agePtr, age + 1);

  // Hunger & eating
  if ((tick & 7) == (i & 7)) {
    const drain = <i32>Mathf.max(1.0, cfg(CFG_HUNGER_RATE) * 2.0);
    hunger -= drain;
    if (hunger < 35 && food > 0) {
      food--;
      hunger = clampI(hunger + 45, 0, 100);
      hp = clampI(hp + 8, 0, 100);
    }
    if (hunger <= 0) {
      hunger = 0;
      hp -= 4;
    }
  }

  // Infection progression
  let inf = <i32>load<u8>(AG_INFECTION + u);
  if (inf > 0) {
    inf += 2;
    if (inf >= 250) {
      // Turn into zombie!
      store<u8>(AG_KIND + u, KIND_ZOMBIE);
      store<u8>(AG_HP + u, 90);
      store<u8>(AG_INFECTION + u, 0);
      store<u8>(AG_FACTION + u, 255);
      store<u8>(AG_STATE + u, STATE_SHAMBLE);
      addStat(ST_TURNED, 1);
      return;
    }
    store<u8>(AG_INFECTION + u, <u8>inf);
  }

  if (hp <= 0) {
    store<u8>(AG_KIND + u, KIND_DEAD);
    addStat(ST_DEATHS, 1);
    return;
  }

  const tx = clampI(<i32>ax, 0, GRID_W - 1);
  const ty = clampI(<i32>ay, 0, GRID_H - 1);
  const curTile = tileAt(tx, ty);

  // Scavenge current tile
  const tileIdx = <usize>(ty * GRID_W + tx);
  const fLoot = <i32>load<u8>(LOOT_FOOD + tileIdx);
  if (fLoot > 0 && food < 8) {
    const take = fLoot > 3 ? 3 : fLoot;
    store<u8>(LOOT_FOOD + tileIdx, <u8>(fLoot - take));
    food += take;
  }
  const gLoot = <i32>load<u8>(LOOT_GEAR + tileIdx);
  if (gLoot > 0 && gear < 90) {
    const takeG = gLoot > 8 ? 8 : gLoot;
    store<u8>(LOOT_GEAR + tileIdx, <u8>(gLoot - takeG));
    gear = clampI(gear + takeG, 0, 100);
  }

  // Scan 3x3 spatial hash for nearest zombie, enemy raider, and nearby zombies count
  const bx = tx >> 2;
  const by = ty >> 2;
  let nearZ = -1;
  let nearZD2: f32 = 144.0; // 12 tiles
  let zCount = 0;
  let nearEnemy = -1;
  let nearED2: f32 = 100.0;

  for (let dy = -1; dy <= 1; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= HASH_H) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= HASH_W) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * HASH_W + nx) << 2));
      let guard = 0;
      while (cur >= 0 && guard < 24) {
        guard++;
        if (cur != i) {
          const k = load<u8>(AG_KIND + <usize>cur);
          if (k == KIND_ZOMBIE) {
            const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
            const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
            const d2 = ox * ox + oy * oy;
            if (d2 < 64.0) zCount++;
            if (d2 < nearZD2) {
              nearZD2 = d2;
              nearZ = cur;
            }
          } else if (k == KIND_SURVIVOR && fac != 255) {
            const oFac = load<u8>(AG_FACTION + <usize>cur);
            if (oFac != 255 && oFac != fac) {
              const rel = load<i8>(FAC_REL + <usize>(<i32>fac * MAX_FACTIONS + <i32>oFac));
              if (rel < -20) {
                const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
                const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
                const d2 = ox * ox + oy * oy;
                if (d2 < nearED2) {
                  nearED2 = d2;
                  nearEnemy = cur;
                }
              }
            }
          }
        }
        cur = load<i32>(AG_NEXT + (<usize>cur << 2));
      }
    }
  }

  // Check if faction is still active
  if (fac != 255 && load<u8>(FAC_ACTIVE + <usize>fac) == 0) {
    fac = 255;
    store<u8>(AG_FACTION + u, 255);
  }

  let vx: f32 = 0.0;
  let vy: f32 = 0.0;
  let state: u8 = STATE_ROAM;
  const spd = cfg(CFG_SURVIVOR_SPEED) * (curTile == TILE_ROAD ? 1.35 : (curTile == TILE_FOREST ? 0.85 : 1.0));

  // Combat / flee decision
  if (nearEnemy >= 0 && nearZ < 0) {
    const ex = load<f32>(AG_X + (<usize>nearEnemy << 2));
    const ey = load<f32>(AG_Y + (<usize>nearEnemy << 2));
    const dx = ex - ax;
    const dy = ey - ay;
    const dist = Mathf.sqrt(nearED2) + 0.001;
    state = STATE_RAID;
    if (dist <= 3.5 + <f32>gear * 0.05) {
      if (cd == 0) {
        const dmg = 14 + (gear >> 2);
        const eHp = <i32>load<u8>(AG_HP + <usize>nearEnemy) - dmg;
        store<u8>(AG_HP + <usize>nearEnemy, <u8>(eHp > 0 ? eHp : 0));
        cd = 8;
        addScent(tx, ty, <i32>(35.0 * cfg(CFG_HORDE_HEARING)));
      }
    } else {
      vx = (dx / dist) * spd;
      vy = (dy / dist) * spd;
    }
  } else if (nearZ >= 0) {
    const zx = load<f32>(AG_X + (<usize>nearZ << 2));
    const zy = load<f32>(AG_Y + (<usize>nearZ << 2));
    const dx = zx - ax;
    const dy = zy - ay;
    const dist = Mathf.sqrt(nearZD2) + 0.001;
    const overwhelmed = (zCount >= 4 && gear < 45) || hp < 28;
    if (overwhelmed) {
      state = STATE_FLEE;
      vx = -(dx / dist) * spd * 1.15;
      vy = -(dy / dist) * spd * 1.15;
    } else {
      state = STATE_FIGHT;
      const range: f32 = 2.0 + <f32>gear * 0.06;
      if (dist <= range) {
        if (cd == 0) {
          const dmg = 22 + (gear >> 1);
          const zHp = <i32>load<u8>(AG_HP + <usize>nearZ) - dmg;
          if (zHp <= 0) {
            store<u8>(AG_KIND + <usize>nearZ, KIND_DEAD);
            addStat(ST_ZKILLS, 1);
            if (fac != 255) {
              const fkPtr = FAC_KILLS + (<usize>fac << 2);
              store<u32>(fkPtr, load<u32>(fkPtr) + 1);
            }
          } else {
            store<u8>(AG_HP + <usize>nearZ, <u8>zHp);
          }
          cd = 6;
          // Gunfire/combat emits noise scent that attracts nearby zombies!
          addScent(tx, ty, <i32>((gear > 30 ? 48.0 : 18.0) * cfg(CFG_HORDE_HEARING)));
        }
      } else {
        vx = (dx / dist) * spd * 0.85;
        vy = (dy / dist) * spd * 0.85;
      }
    }
  } else if (fac != 255) {
    // Belongs to a settlement
    const fx = <f32>load<u16>(FAC_X + (<usize>fac << 1));
    const fy = <f32>load<u16>(FAC_Y + (<usize>fac << 1));
    const dxHome = fx - ax;
    const dyHome = fy - ay;
    const dHome2 = dxHome * dxHome + dyHome * dyHome;

    if (food >= 4 && dHome2 > 25.0) {
      // Return food to settlement
      state = STATE_RETURN;
      const d = Mathf.sqrt(dHome2) + 0.001;
      vx = (dxHome / d) * spd;
      vy = (dyHome / d) * spd;
    } else if (dHome2 <= 25.0 && food > 1) {
      // Deposit surplus food
      const dep = food - 1;
      food = 1;
      const ffPtr = FAC_FOOD + (<usize>fac << 2);
      store<f32>(ffPtr, load<f32>(ffPtr) + <f32>(dep * 3));
      const fmPtr = FAC_MATS + (<usize>fac << 2);
      store<f32>(fmPtr, load<f32>(fmPtr) + 1.0);
      state = STATE_GUARD;
    } else if (trait == 0 || hunger < 65 || food == 0) {
      // Scavenge outward
      state = STATE_SCAVENGE;
    } else {
      // Patrol around settlement
      state = STATE_GUARD;
      const tgtX = <f32>load<u16>(AG_TARGET_X + (u << 1));
      const tgtY = <f32>load<u16>(AG_TARGET_Y + (u << 1));
      const dtx = tgtX - ax;
      const dty = tgtY - ay;
      if (dtx * dtx + dty * dty < 9.0 || (tick + i) % 90 == 0) {
        const ang = randF() * 6.283;
        const rad = 4.0 + randF() * 14.0;
        store<u16>(AG_TARGET_X + (u << 1), <u16>clampI(<i32>(fx + Mathf.cos(ang) * rad), 2, GRID_W - 3));
        store<u16>(AG_TARGET_Y + (u << 1), <u16>clampI(<i32>(fy + Mathf.sin(ang) * rad), 2, GRID_H - 3));
      } else {
        const d = Mathf.sqrt(dtx * dtx + dty * dty) + 0.001;
        vx = (dtx / d) * spd * 0.7;
        vy = (dty / d) * spd * 0.7;
      }
    }
  } else {
    // Lone survivor: scavenge or occasionally try to found a settlement
    state = STATE_SCAVENGE;
    if ((tick + i) % 120 == 0 && zCount == 0 && curTile != TILE_CITY && curTile != TILE_WATER) {
      tryFoundSettlement(i, tx, ty);
    }
  }

  // Generic scavenge / roam steering when no velocity set yet
  if (vx == 0.0 && vy == 0.0 && (state == STATE_SCAVENGE || state == STATE_ROAM)) {
    const tgtX = <f32>load<u16>(AG_TARGET_X + (u << 1));
    const tgtY = <f32>load<u16>(AG_TARGET_Y + (u << 1));
    const dtx = tgtX - ax;
    const dty = tgtY - ay;
    if (dtx * dtx + dty * dty < 9.0 || (tick + i) % 85 == 0) {
      // Pick a new nearby target biased toward towns/farms/roads
      const nx = clampI(tx + randInt(49) - 24, 2, GRID_W - 3);
      const ny = clampI(ty + randInt(49) - 24, 2, GRID_H - 3);
      store<u16>(AG_TARGET_X + (u << 1), <u16>nx);
      store<u16>(AG_TARGET_Y + (u << 1), <u16>ny);
    } else {
      const d = Mathf.sqrt(dtx * dtx + dty * dty) + 0.001;
      vx = (dtx / d) * spd * 0.85;
      vy = (dty / d) * spd * 0.85;
    }
  }

  // Apply movement with water/wall collision check
  if (vx != 0.0 || vy != 0.0) {
    const nx = clampF(ax + vx, 1.0, <f32>(GRID_W - 2));
    const ny = clampF(ay + vy, 1.0, <f32>(GRID_H - 2));
    const ntx = <i32>nx;
    const nty = <i32>ny;
    if (isPassable(tileAt(ntx, nty))) {
      ax = nx;
      ay = ny;
    } else if (isPassable(tileAt(ntx, ty))) {
      ax = nx;
    } else if (isPassable(tileAt(tx, nty))) {
      ay = ny;
    } else {
      // Bounce off obstacle
      store<u16>(AG_TARGET_X + (u << 1), <u16>clampI(tx + randInt(33) - 16, 2, GRID_W - 3));
      store<u16>(AG_TARGET_Y + (u << 1), <u16>clampI(ty + randInt(33) - 16, 2, GRID_H - 3));
    }
  }

  store<f32>(AG_X + (u << 2), ax);
  store<f32>(AG_Y + (u << 2), ay);
  store<f32>(AG_VX + (u << 2), vx);
  store<f32>(AG_VY + (u << 2), vy);
  store<u8>(AG_HP + u, <u8>hp);
  store<u8>(AG_HUNGER + u, <u8>hunger);
  store<u8>(AG_GEAR + u, <u8>gear);
  store<u8>(AG_FOOD + u, <u8>food);
  store<u8>(AG_STATE + u, state);
  store<u8>(AG_COOLDOWN + u, <u8>cd);
}

function stepZombie(i: i32, tick: i32): void {
  const u = <usize>i;
  let ax = load<f32>(AG_X + (u << 2));
  let ay = load<f32>(AG_Y + (u << 2));
  let cd = <i32>load<u8>(AG_COOLDOWN + u);
  if (cd > 0) cd--;

  const tx = clampI(<i32>ax, 0, GRID_W - 1);
  const ty = clampI(<i32>ay, 0, GRID_H - 1);
  const bx = tx >> 2;
  const by = ty >> 2;

  // Scan 3x3 hash for nearest survivor
  let nearS = -1;
  let nearD2: f32 = 169.0; // 13 tiles
  for (let dy = -1; dy <= 1; dy++) {
    const ny = by + dy;
    if (ny < 0 || ny >= HASH_H) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const nx = bx + dx;
      if (nx < 0 || nx >= HASH_W) continue;
      let cur = load<i32>(HASH_HEAD + (<usize>(ny * HASH_W + nx) << 2));
      let guard = 0;
      while (cur >= 0 && guard < 20) {
        guard++;
        if (load<u8>(AG_KIND + <usize>cur) == KIND_SURVIVOR) {
          const ox = load<f32>(AG_X + (<usize>cur << 2)) - ax;
          const oy = load<f32>(AG_Y + (<usize>cur << 2)) - ay;
          const d2 = ox * ox + oy * oy;
          if (d2 < nearD2) {
            nearD2 = d2;
            nearS = cur;
          }
        }
        cur = load<i32>(AG_NEXT + (<usize>cur << 2));
      }
    }
  }

  const spd = cfg(CFG_ZOMBIE_SPEED);
  let vx: f32 = 0.0;
  let vy: f32 = 0.0;
  let state: u8 = STATE_SHAMBLE;

  if (nearS >= 0) {
    state = STATE_CHASE;
    const sx = load<f32>(AG_X + (<usize>nearS << 2));
    const sy = load<f32>(AG_Y + (<usize>nearS << 2));
    const dx = sx - ax;
    const dy = sy - ay;
    const dist = Mathf.sqrt(nearD2) + 0.001;
    if (dist <= 1.6) {
      if (cd == 0) {
        const sGear = <i32>load<u8>(AG_GEAR + <usize>nearS);
        const dmg = clampI(16 - (sGear >> 3), 5, 18);
        const sHp = <i32>load<u8>(AG_HP + <usize>nearS) - dmg;
        if (sHp <= 0) {
          // Survivor killed or turned immediately on lethal bite
          if (randF() < cfg(CFG_INFECTION_CHANCE)) {
            store<u8>(AG_KIND + <usize>nearS, KIND_ZOMBIE);
            store<u8>(AG_HP + <usize>nearS, 90);
            store<u8>(AG_FACTION + <usize>nearS, 255);
            store<u8>(AG_INFECTION + <usize>nearS, 0);
            addStat(ST_TURNED, 1);
          } else {
            store<u8>(AG_KIND + <usize>nearS, KIND_DEAD);
            addStat(ST_DEATHS, 1);
          }
        } else {
          store<u8>(AG_HP + <usize>nearS, <u8>sHp);
          if (load<u8>(AG_INFECTION + <usize>nearS) == 0 && randF() < cfg(CFG_INFECTION_CHANCE) * 0.65) {
            store<u8>(AG_INFECTION + <usize>nearS, 1);
          }
        }
        cd = 10;
      }
    } else {
      vx = (dx / dist) * spd;
      vy = (dy / dist) * spd;
    }
  } else {
    // Follow scent/noise gradient if present, else shamble
    let bestScent = <i32>load<u8>(SCENT_HEAT + <usize>(ty * GRID_W + tx));
    let sdx = 0;
    let sdy = 0;
    if (tx > 2 && ty > 2 && tx < GRID_W - 3 && ty < GRID_H - 3) {
      const sN = <i32>load<u8>(SCENT_HEAT + <usize>((ty - 2) * GRID_W + tx));
      const sS = <i32>load<u8>(SCENT_HEAT + <usize>((ty + 2) * GRID_W + tx));
      const sW = <i32>load<u8>(SCENT_HEAT + <usize>(ty * GRID_W + (tx - 2)));
      const sE = <i32>load<u8>(SCENT_HEAT + <usize>(ty * GRID_W + (tx + 2)));
      if (sN > bestScent) { bestScent = sN; sdx = 0; sdy = -1; }
      if (sS > bestScent) { bestScent = sS; sdx = 0; sdy = 1; }
      if (sW > bestScent) { bestScent = sW; sdx = -1; sdy = 0; }
      if (sE > bestScent) { bestScent = sE; sdx = 1; sdy = 0; }
    }
    if (sdx != 0 || sdy != 0) {
      state = STATE_CHASE;
      vx = <f32>sdx * spd * 0.85;
      vy = <f32>sdy * spd * 0.85;
    } else {
      // Shamble with occasional direction change
      vx = load<f32>(AG_VX + (u << 2));
      vy = load<f32>(AG_VY + (u << 2));
      if ((vx == 0.0 && vy == 0.0) || (tick + i) % 45 == 0) {
        const ang = randF() * 6.283;
        vx = Mathf.cos(ang) * spd * 0.45;
        vy = Mathf.sin(ang) * spd * 0.45;
      }
    }
  }

  if (vx != 0.0 || vy != 0.0) {
    const nx = clampF(ax + vx, 1.0, <f32>(GRID_W - 2));
    const ny = clampF(ay + vy, 1.0, <f32>(GRID_H - 2));
    const ntx = <i32>nx;
    const nty = <i32>ny;
    const nt = tileAt(ntx, nty);
    if (isPassable(nt)) {
      ax = nx;
      ay = ny;
    } else if (nt == TILE_WALL) {
      // Zombies bash settlement walls
      if ((randU32() & 31) == 0) {
        setTile(ntx, nty, TILE_GRASS);
        const claim = load<u8>(FACTION_CLAIM + <usize>(nty * GRID_W + ntx));
        if (claim > 0) {
          pushEvent(EVT_HORDE_BREACH, <i32>(claim - 1), (ntx << 10) | nty);
        }
      }
    } else {
      vx = -vx;
      vy = -vy;
    }
  }

  store<f32>(AG_X + (u << 2), ax);
  store<f32>(AG_Y + (u << 2), ay);
  store<f32>(AG_VX + (u << 2), vx);
  store<f32>(AG_VY + (u << 2), vy);
  store<u8>(AG_STATE + u, state);
  store<u8>(AG_COOLDOWN + u, <u8>cd);
}

function stepSettlements(tick: i32): void {
  // Recount living population per faction
  const counts = new StaticArray<i32>(MAX_FACTIONS);
  for (let i = 0; i < activeLimit; i++) {
    if (load<u8>(AG_KIND + <usize>i) != KIND_SURVIVOR) continue;
    const f = <i32>load<u8>(AG_FACTION + <usize>i);
    if (f < MAX_FACTIONS) counts[f]++;
  }

  const growthMult = cfg(CFG_SETTLEMENT_GROWTH);
  for (let f = 0; f < MAX_FACTIONS; f++) {
    const u = <usize>f;
    if (load<u8>(FAC_ACTIVE + u) == 0) continue;
    const pop = counts[f];
    store<u16>(FAC_POP + (u << 1), <u16>pop);
    if (pop <= 0) {
      // Settlement fell
      store<u8>(FAC_ACTIVE + u, 0);
      const fx = <i32>load<u16>(FAC_X + (u << 1));
      const fy = <i32>load<u16>(FAC_Y + (u << 1));
      pushEvent(EVT_FALLEN, f, (fx << 10) | fy);
      continue;
    }

    const foodPtr = FAC_FOOD + (u << 2);
    const matsPtr = FAC_MATS + (u << 2);
    let food = load<f32>(foodPtr) - <f32>pop * 0.04;
    if (food < 0.0) food = 0.0;

    // Recruit / grow when food & growth multiplier allow
    const recruitThresh: f32 = 30.0 / Mathf.max(0.2, growthMult);
    if (food > recruitThresh && pop < 140 && (tick + f * 7) % 35 == 0) {
      food -= 12.0;
      const fx = <f32>load<u16>(FAC_X + (u << 1));
      const fy = <f32>load<u16>(FAC_Y + (u << 1));
      const sx = clampF(fx + (randF() - 0.5) * 6.0, 2.0, <f32>(GRID_W - 3));
      const sy = clampF(fy + (randF() - 0.5) * 6.0, 2.0, <f32>(GRID_H - 3));
      if (isPassable(tileAt(<i32>sx, <i32>sy))) {
        spawnAgent(KIND_SURVIVOR, sx, sy, 100, 90, <u8>(15 + randInt(25)), 3, <u8>f, <u8>randInt(4));
      }
    }
    store<f32>(foodPtr, food);

    // Tier upgrade check
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
      const rad = 6 + <i32>nextLvl * 3;
      claimTerritory(<u8>f, fx, fy, rad, nextLvl >= 2);
      pushEvent(EVT_UPGRADED, f, <i32>nextLvl);
    }
  }
}

function recountAgents(): void {
  let surv = 0;
  let zomb = 0;
  let inf = 0;
  let lastAlive = 0;
  for (let i = 0; i < activeLimit; i++) {
    const k = load<u8>(AG_KIND + <usize>i);
    if (k == KIND_SURVIVOR) {
      surv++;
      if (load<u8>(AG_INFECTION + <usize>i) > 0) inf++;
      lastAlive = i + 1;
    } else if (k == KIND_ZOMBIE) {
      zomb++;
      lastAlive = i + 1;
    }
  }
  activeLimit = lastAlive;

  let facCount = 0;
  for (let f = 0; f < MAX_FACTIONS; f++) {
    if (load<u8>(FAC_ACTIVE + <usize>f) != 0) facCount++;
  }

  setStat(ST_SURVIVORS, surv);
  setStat(ST_ZOMBIES, zomb);
  setStat(ST_INFECTED, inf);
  setStat(ST_SETTLEMENTS, facCount);
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
      const migCount = <i32>(migRate * 4.0);
      for (let m = 0; m < migCount; m++) {
        const edge = randInt(4);
        let mx = 4;
        let my = 4;
        if (edge == 0) { mx = 4 + randInt(GRID_W - 8); my = 4; }
        else if (edge == 1) { mx = 4 + randInt(GRID_W - 8); my = GRID_H - 5; }
        else if (edge == 2) { mx = 4; my = 4 + randInt(GRID_H - 8); }
        else { mx = GRID_W - 5; my = 4 + randInt(GRID_H - 8); }
        if (isPassable(tileAt(mx, my))) {
          spawnAgent(KIND_ZOMBIE, <f32>mx, <f32>my, 85, 0, 0, 0, 255, 0);
        }
      }
    }

    for (let i = 0; i < activeLimit; i++) {
      const k = load<u8>(AG_KIND + <usize>i);
      if (k == KIND_SURVIVOR) stepSurvivor(i, tick);
      else if (k == KIND_ZOMBIE) stepZombie(i, tick);
    }

    if ((tick & 7) == 0) {
      stepSettlements(tick);
    }
  }
  recountAgents();
}

// ---- Biome colors in ABGR (0xAABBGGRR) ----
@inline function biomeColor(t: u8): u32 {
  switch (t) {
    case TILE_WATER:      return 0xFF5C351E; // deep coastal blue
    case TILE_BEACH:      return 0xFF7CA8B8; // sandy shore
    case TILE_GRASS:      return 0xFF334C2F; // muted post-apoc grass
    case TILE_FOREST:     return 0xFF23381E; // dark pine forest
    case TILE_HILL:       return 0xFF4F5456; // rocky ridge
    case TILE_ROAD:       return 0xFF42454A; // asphalt road
    case TILE_TOWN:       return 0xFF565E68; // town concrete
    case TILE_CITY:       return 0xFF646C76; // dense urban
    case TILE_MILITARY:   return 0xFF354A46; // olive drab base
    case TILE_FARM:       return 0xFF39594A; // cultivated fields
    case TILE_INDUSTRIAL: return 0xFF4B4957; // rust industrial
    case TILE_WALL:       return 0xFF9AA3AD; // fortified wall
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
  for (let i = 0; i < GRID_N; i++) {
    const t = load<u8>(TILE_TYPE + <usize>i);
    let col = biomeColor(t);

    if (overlayMode == 1) {
      // Territory overlay
      const claim = <i32>load<u8>(FACTION_CLAIM + <usize>i);
      if (claim > 0 && claim <= MAX_FACTIONS) {
        const fCol = load<u32>(FAC_COLOR + (<usize>(claim - 1) << 2));
        col = blendABGR(col, fCol, 130);
      }
    } else if (overlayMode == 2) {
      // Loot overlay (Food = green, Gear = cyan/gold)
      const f = <u32>load<u8>(LOOT_FOOD + <usize>i);
      const g = <u32>load<u8>(LOOT_GEAR + <usize>i);
      if (f > 0 || g > 0) {
        const rC = clampI(<i32>(g * 3), 0, 255);
        const gC = clampI(<i32>(f * 4 + g * 2), 0, 255);
        const bC = clampI(<i32>(g * 4), 0, 255);
        const lootCol = 0xFF000000 | (<u32>bC << 16) | (<u32>gC << 8) | <u32>rC;
        col = blendABGR(col, lootCol, 190);
      }
    } else if (overlayMode == 3) {
      // Scent / Noise heat overlay
      const sc = <u32>load<u8>(SCENT_HEAT + <usize>i);
      if (sc > 4) {
        const heatCol = 0xFF000000 | (sc << 8) | 0xFF;
        col = blendABGR(col, heatCol, sc > 220 ? 220 : sc);
      }
    } else {
      // Standard mode: subtle territory tint
      const claim = <i32>load<u8>(FACTION_CLAIM + <usize>i);
      if (claim > 0 && claim <= MAX_FACTIONS) {
        const fCol = load<u32>(FAC_COLOR + (<usize>(claim - 1) << 2));
        col = blendABGR(col, fCol, 42);
      }
    }

    store<u32>(FRAME_RGBA + (<usize>i << 2), col);
  }

  if (drawAgents != 0) {
    for (let i = 0; i < activeLimit; i++) {
      const k = load<u8>(AG_KIND + <usize>i);
      if (k == KIND_DEAD) continue;
      const ax = clampI(<i32>load<f32>(AG_X + (<usize>i << 2)), 0, GRID_W - 1);
      const ay = clampI(<i32>load<f32>(AG_Y + (<usize>i << 2)), 0, GRID_H - 1);
      const idx = ay * GRID_W + ax;
      let col: u32 = 0xFF4B53E5; // zombie red (#e5534b)
      if (k == KIND_SURVIVOR) {
        if (load<u8>(AG_INFECTION + <usize>i) > 0) {
          col = 0xFF3FD6D6; // infected yellow
        } else {
          const f = <i32>load<u8>(AG_FACTION + <usize>i);
          col = f < MAX_FACTIONS ? load<u32>(FAC_COLOR + (<usize>f << 2)) : 0xFFF5F5F5;
        }
      }
      store<u32>(FRAME_RGBA + (<usize>idx << 2), col);
    }
  }
}

// ---- Intervention Brushes ----
export function brushSpawnZombies(cx: i32, cy: i32, radius: i32, count: i32): void {
  const r = clampI(radius, 1, 40);
  for (let n = 0; n < count; n++) {
    const ang = randF() * 6.283;
    const dist = Mathf.sqrt(randF()) * <f32>r;
    const x = clampI(<i32>(<f32>cx + Mathf.cos(ang) * dist), 1, GRID_W - 2);
    const y = clampI(<i32>(<f32>cy + Mathf.sin(ang) * dist), 1, GRID_H - 2);
    if (isPassable(tileAt(x, y))) {
      spawnAgent(KIND_ZOMBIE, <f32>x + randF(), <f32>y + randF(), 85, 0, 0, 0, 255, 0);
    }
  }
  recountAgents();
}

export function brushSpawnSurvivors(cx: i32, cy: i32, radius: i32, count: i32): void {
  const r = clampI(radius, 1, 40);
  for (let n = 0; n < count; n++) {
    const ang = randF() * 6.283;
    const dist = Mathf.sqrt(randF()) * <f32>r;
    const x = clampI(<i32>(<f32>cx + Mathf.cos(ang) * dist), 1, GRID_W - 2);
    const y = clampI(<i32>(<f32>cy + Mathf.sin(ang) * dist), 1, GRID_H - 2);
    if (isPassable(tileAt(x, y))) {
      spawnAgent(KIND_SURVIVOR, <f32>x + randF(), <f32>y + randF(), 100, 90, <u8>(15 + randInt(25)), 3, 255, <u8>randInt(4));
    }
  }
  recountAgents();
}

export function brushAirdrop(cx: i32, cy: i32, radius: i32): void {
  const r = clampI(radius, 1, 30);
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    const y = clampI(cy + dy, 1, GRID_H - 2);
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = clampI(cx + dx, 1, GRID_W - 2);
      const idx = <usize>(y * GRID_W + x);
      if (!isPassable(load<u8>(TILE_TYPE + idx))) continue;
      const nf = <i32>load<u8>(LOOT_FOOD + idx) + 35;
      const ng = <i32>load<u8>(LOOT_GEAR + idx) + 45;
      store<u8>(LOOT_FOOD + idx, <u8>(nf > 255 ? 255 : nf));
      store<u8>(LOOT_GEAR + idx, <u8>(ng > 255 ? 255 : ng));
    }
  }
  addScent(clampI(cx, 0, GRID_W - 1), clampI(cy, 0, GRID_H - 1), 220);
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
  recountAgents();
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
