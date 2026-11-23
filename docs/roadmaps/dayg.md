# DayG roadmap: sim core, south-west blockout, first playable slice

Design: `docs/design/dayg/` (README, process, evaluation, simulation-lod, survival, items, hatless, world, crafting, loot, havens).
Setting: `apocrypha` (docs/lore/rulings.md R-039). Game folder: `games/dayg` (three.js), dev port **5206**.

## 1. Goal

DayG is a slow, on-foot zombie-gnome survival game in Mossgrave, a Tall One cemetery at gnome height, where a headless
simulation keeps the world going without the player. This round builds the headless sim core on a 12-region stub
(NPC needs and groups, a coarse horde field, a loot budget that never renews, a market, a chronicle, a scorecard over 50
seeds), and one hand-authored blockout of the Lychgate, the Old Rows and the Tap whose regions are the sim's regions. On
top of that it builds a single-player three.js slice: walk, sprint, crouch and climb, carry generic items, keep warm, fed,
watered and calm, survive cracks and the moss, meet Hatless and NPC gnomes that the sim put there, and die with a recap.

### In scope (process.md phases 1, 2-lite and 3)

- **Sim core, headless** (`games/dayg/src/sim/`): named seeded RNG streams, the 12-region stub graph, NPC needs and simple
  groups, a coarse horde field with herds, a non-renewing loot budget plus small foraging, one market with prices, a
  chronicle writer, `npm run sim -w games/dayg` printing a scorecard over 50 seeds, determinism and conservation tests,
  `src/sim/tuning.json` for every knob.
- **Blockout map**: the Lychgate (Gate Roof with the Waystation haven, Forecourt, Verge Path, Bin Corner), the Old Rows
  (Ivy Rows, Leaning Rows, the Sinks, Angel Square, Mason's Corner, Child Graves, Yew Edge) and the Tap (haven), as one
  TypeScript data file with heights, walls, paths, gates and climb routes. The sim's region graph is the map's regions.
- **Playable slice**: DayG movement (walk, jog, sprint, crouch, vault kerbs, climb with a route, a rope or a ladder),
  inventory of generic items by tags and properties, needs (warmth, water, food, calm), cracks and the moss infection
  stage table, Hatless at L0 (gnome models, hat removed, moss materials), loot containers that draw from the sim's
  budget, a campfire, the Waystation rain catcher and the Tap standpipe, the Waystation safe at night, a death recap,
  and a sim feed so the Hatless and NPC gnomes around the player are the sim's.
- **Touch controls and phone layout** (390x844 portrait, 844x390 landscape, safe-area insets, 44 px+ targets).
- **Achievements**: First Night, Up and Away, Scraped Clean, Mossbreaker, with prefab rewards.
- **Player gnome**: `await loadMyGnome()` at the top of `main.ts`, worn through `createGnomeModel`, fallback look.

### Out of scope this round

- Multiplayer (`@lawn/mp`, phase 5). DayG stays single-player; the sim is pure so a host can run it later. The PR says so.
- NPC talk, trust ledger UI, quests, notice boards (phase 4). NPC gnomes are seen, not spoken to.
- The other nine districts and the full 61-region map, `@lawn/level` documents, LOD streaming (phases 2 full and 6).
- Building, farming, the crafting tree, traps, skills, lineage (phase 7). Only the recipes listed in issue 3.3 exist.
- Factions, havens changing hands, caravans, outside traders, L1 simulation, the LOD-equivalence test, golden seeds,
  `sim:report`, `sim:sweep`, the 200-seed sweep (the scorecard runs 50 seeds).
- A Gnome Party slice: the backlog row `last-ladder` in `packages/party/README.md` already says "later".

## 2. Shape

| Epic | Name | Done when | Issues |
|---|---|---|---|
| 0 | Foundation (planner-written, Step 0) | `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm run sim -w games/dayg -- --seeds 2 --days 3` run; the page loads a grey world with no console errors | 0 (planner) |
| 1 | Sim systems, blockout data, collider, prefabs | build passes; `npm test -w games/dayg` and `npm test -w packages/prefabs` pass; `npm run sim -w games/dayg -- --seeds 3 --days 20` prints changing numbers | 9 |
| 2 | Sim tests and scorecard; three.js core | build and tests pass; `npm run sim -w games/dayg -- --seeds 50 --days 60` prints a scorecard; you can walk, climb and look around the blockout as your gnome; smoke passes | 7 |
| 3 | Survival, items, Hatless, loot, feed, camp, tuning | build and tests pass; a full desktop loop (loot, eat, drink, light a fire, get scratched, cure it, sleep at the Waystation) works; Hatless counts match the sim; the scorecard joint score is reported in TUNING_LOG.md | 10 |
| 4 | Phone, achievements, recap, polish | build and all tests pass; smoke at desktop and at 390x844 and 844x390; zfight passes; PLAYTEST.md exists | 6 |

### Rounds

A round starts only after the previous round's end-of-round check passes (the planner runs it).

| Round | Epic | Issues (all parallel within the round) |
|---|---|---|
| 1 | 0 then 1 | Step 0 (planner) first, then 1.1 NPCs, 1.2 Groups, 1.3 Horde field, 1.4 Loot budget, 1.5 Market, 1.6 Weather, chronicle and names, 1.7 Blockout map, 1.8 Collider, 1.9 DayG prefabs |
| 2 | 2 | 2.1 Sim tests, 2.2 Scorecard and CLI, 2.3 World builder, 2.4 Sky and rain, 2.5 Input and camera, 2.6 Player movement and climbing, 2.7 Gnome models and player view |
| 3 | 3 | 3.1 Needs, 3.2 Body and moss, 3.3 Inventory and recipes, 3.4 Inventory panel and item use, 3.5 HUD, 3.6 Hatless at L0, 3.7 Loot containers, 3.8 Sim feed and NPC actors, 3.9 Camp, water and the Waystation, 3.10 Sim tuning pass |
| 4 | 4 | 4.1 Touch controls, 4.2 Phone layout pass, 4.3 Achievements, 4.4 Death recap, 4.5 Gear on the gnome, 4.6 Playtest notes, README and credits |

Foundation is a **planner-written step** (Step 0 below), not a worker issue: it is almost entirely verbatim contracts,
stubs and the main loop, which the planner has already decided.

### Shared-file owners

| File | Owner |
|---|---|
| `games/dayg/src/main.ts` | planner (Step 0, and every end-of-round fix). No worker edits it. |
| `games/dayg/package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `scripts/sim.mjs`, `.gitignore` | planner (Step 0) |
| `games/dayg/src/config.ts`, `src/game/types.ts`, `src/game/bus.ts`, `src/game/interact.ts`, `src/game/clock.ts`, `src/sim/types.ts`, `src/sim/rng.ts`, `src/sim/regions.ts`, `src/sim/world.ts`, `src/sim/tuning.ts`, `src/world/types.ts`, `src/items/defs.ts` | planner (Step 0). Workers read them, never edit them. |
| `games/dayg/src/sim/tuning.json` | planner (Step 0); in round 3 issue 3.10 owns the sim sections (`clock`, `weather`, `npc`, `groups`, `horde`, `loot`, `market`); nobody edits `player`, `infection`, `body` |
| scene registry | none: there are no scenes; `main.ts` constructs every system in a fixed order |
| `packages/prefabs/src/catalog/index.ts` | issue 1.9 |
| `packages/achievements/src/catalog.ts` | issue 4.3 |
| `src/ui/hud.ts`, `src/ui/inventoryPanel.ts` | 3.5 and 3.4 in round 3, then 4.2 in round 4 |
| `src/scene/playerView.ts` | 2.7 in round 2, then 4.5 in round 4 |

### Ports (dev servers, one per issue, never shared)

2.3: 5211, 2.4: 5212, 2.5: 5213, 2.6: 5214, 2.7: 5215. 3.4: 5221, 3.5: 5222, 3.6: 5223, 3.7: 5224, 3.8: 5225, 3.9: 5226.
4.1: 5231, 4.2: 5232, 4.3: 5233, 4.4: 5234, 4.5: 5235. Start with `cd games/dayg && npx vite --port <port> --strictPort`
(in the background), and stop it when done. The planner's own checks use 5206.

### Phone screenshot command (used by UI issues)

```sh
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-<issue>-portrait.png" "http://localhost:<port>/?seed=1&touch=1"
```
Repeat with `--window-size=844,390` for landscape, then open the PNGs with the Read tool and look at them.

### Dependencies that remain

None inside a round. Across rounds: 3.10 (tuning) needs the scorecard from 2.2; 4.2 (phone pass) needs the HUD and panel
from round 3; integration bugs between systems surface only at the end-of-round check, where the planner fixes `main.ts`.

---

## 3. Step 0: foundation (planner-written)

The planner does all of this before launching round 1, then runs the Step 0 checks.

### 3.1 Clean the copy

`games/dayg` is a copy of `games/sample-3d`. Delete `games/dayg/src/**`, `games/dayg/demos/**`, `games/dayg/dist/**`.
Keep `public/favicon.svg` and `thumbnail.jpg`. Add `games/dayg/.gitignore` with `dist/` and `sim-out/`.

- `package.json`: name `dayg`, `"description": "Zombie-gnome survival in the Mossgrave cemetery, on a world that simulates itself."`,
  scripts `dev: vite`, `build: tsc --noEmit && vite build`, `preview: vite preview`, `typecheck: tsc --noEmit`,
  `test: vitest run`, `sim: node scripts/sim.mjs`. Dependencies `@lawn/achievements`, `@lawn/depth`, `@lawn/gnome`,
  `@lawn/prefabs` (all `*`), `three 0.187.0`. devDependencies `@types/three 0.187.0`, `typescript 7.0.2`, `vite 8.3.8`,
  `vitest 5.1.0`. Run `npm install` once from the root so the lockfile updates.
- `tsconfig.json`: add `"resolveJsonModule": true`.
- `vite.config.ts`: port 5206.
- `index.html`: title `DayG`, background `#1d2320`, keep `#game` canvas and `#ui`.
- `scripts/sim.mjs`: bundles `src/sim/cli.ts` with esbuild (`platform: 'node', format: 'esm', bundle: true`) into a temp
  dir (as `games/gnomes-of-gnomomia/scripts/sim-economy.mjs` does), imports it, reads `--profile <path>` JSON if given,
  calls `runCli(argv, { profile })`, prints `stdout`, writes `rows` to `games/dayg/sim-out/rows.jsonl` when non-empty,
  and exits with `exitCode`.
- AGENT_INDEX.md: a `dayg` row in the games table (DayG, three, 5206, no online, no slice, "zombie-gnome survival sim in
  Mossgrave; headless sim `npm run sim -w games/dayg`"). `docs/lore/settings.md`: add `games/dayg` (Mossgrave, the
  Hatless; R-039) to the `apocrypha` games list and the settings table row; `npm run lore` must pass.
- `CREDITS.md`: "All models are `@lawn/prefabs` prefabs, `@lawn/gnome` models or boxes generated in code. No external assets."

### 3.2 `src/sim/types.ts` (verbatim)

```ts
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
```

### 3.3 `src/sim/rng.ts` (verbatim)

```ts
export type StreamName = 'weather' | 'loot' | 'horde' | 'npc' | 'groups' | 'market' | 'chronicle';
export const STREAM_NAMES: readonly StreamName[] = ['weather', 'loot', 'horde', 'npc', 'groups', 'market', 'chronicle'];
export interface Rng {
  next(): number;                                  // [0, 1)
  int(min: number, max: number): number;           // inclusive
  range(min: number, max: number): number;         // [min, max)
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T; // weights <= 0 never picked; falls back to items[0]
  round(x: number): number;                        // stochastic rounding: floor(x) + (next() < frac ? 1 : 0)
  state(): number;
}
export type Streams = Record<StreamName, Rng>;

export function hashString(s: string): number {    // FNV-1a, 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
export function createRng(seed: number): Rng {    // mulberry32
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items, weight) => {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      if (total <= 0) return items[0];
      let r = next() * total;
      for (const it of items) { r -= Math.max(0, weight(it)); if (r < 0) return it; }
      return items[items.length - 1];
    },
    round: (x) => { const f = Math.floor(x); return f + (next() < x - f ? 1 : 0); },
    state: () => a,
  };
  return rng;
}
export function streamSeed(seed: number, name: StreamName): number { return hashString(`${seed}:${name}`); }
export function createStreams(seed: number): Streams {
  const s = {} as Streams;
  for (const n of STREAM_NAMES) s[n] = createRng(streamSeed(seed, n));
  return s;
}
```

### 3.4 `src/sim/tuning.json` (initial knobs, verbatim) and `src/sim/tuning.ts`

`tuning.ts`: `import raw from './tuning.json'; export const TUNING: Tuning = raw as unknown as Tuning;`
`export function withOverrides(base: Tuning, patch: unknown): Tuning` (deep merge of plain objects; arrays replaced).

```json
{
  "clock": { "ticksPerDay": 24, "daysPerSeason": 7, "startSeason": "autumn", "nightStartHour": 22, "nightEndHour": 6 },
  "weather": {
    "stayChance": 0.85,
    "weights": {
      "spring": { "clear": 3, "overcast": 3, "drizzle": 3, "rain": 2, "fog": 2, "frost": 0.5, "storm": 0.5 },
      "summer": { "clear": 6, "overcast": 2, "drizzle": 1, "rain": 1, "fog": 0.5, "frost": 0, "storm": 0.7 },
      "autumn": { "clear": 2, "overcast": 3, "drizzle": 3, "rain": 3, "fog": 3, "frost": 1, "storm": 1 },
      "winter": { "clear": 2, "overcast": 3, "drizzle": 1, "rain": 2, "fog": 2, "frost": 4, "storm": 1 }
    },
    "tempBase": { "spring": 11, "summer": 19, "autumn": 9, "winter": 2 },
    "tempWeather": { "clear": 2, "overcast": 0, "drizzle": -1, "rain": -2, "fog": -1, "frost": -6, "storm": -4 },
    "nightDrop": 5
  },
  "npc": {
    "foodPerDay": 30, "waterPerDay": 45, "warmthPerDayCold": 40, "mealValue": 35, "drinkValue": 50,
    "eatBelow": 60, "drinkBelow": 55, "scavengePerTick": 0.6, "forageTake": 1, "carryMax": 6,
    "hatlessKill": 0.0006, "nightRisk": 1.6,
    "exposure": { "rest": 0.3, "forage": 0.8, "scavenge": 1.0, "eat": 0.3, "drink": 0.6, "travel": 0.9, "hide": 0.1, "trade": 0.2, "flee": 0.7 },
    "riskLimitBase": 0.002, "riskLimitBoldness": 0.01,
    "starveDays": 6, "thirstDays": 3, "coldKill": 0.002, "fallKill": 0.0003, "fightChance": 0.0004,
    "scratchChance": 0.006, "cureChance": 0.8, "travelBias": 0.15,
    "acornsStart": [2, 12], "carriedFoodStart": [0, 3]
  },
  "groups": { "a": 4, "b": 1.5, "c": 2, "d": 2, "safetyS": 1.0, "work": 0.08, "roles": 6, "shareF": 0.05, "sigma": 0.12, "strainK": 0.02, "dunbarBase": 8, "fissionQ": 0.5, "maxSafety": 0.75, "decideEvery": 6 },
  "horde": {
    "flowRate": 0.08, "diffusion": 0.01, "noiseDecay": 0.5, "scentWeight": 0.05, "warmWeight": 1.0, "noiseWeight": 0.2,
    "nestWeight": 1.5, "pitWeight": 2.0, "havenRepel": 2.0,
    "herdThreshold": 60, "herdShare": 0.5, "herdMoveTicks": 6, "herdMin": 20,
    "crumblePerDay": 0.004, "capacityPerKm2": 2500, "overCapacityMul": 3, "pitEscape": 0.02, "threatNorm": 20,
    "riseChance": { "hatless": 0.6, "moss": 1.0, "gnome": 0.05, "hunger": 0.05, "thirst": 0.05, "cold": 0.05, "fall": 0.05 }
  },
  "loot": {
    "perGnome": { "food": 38, "water": 2, "medicine": 3, "fuel": 7, "tools": 2, "materials": 4, "valuables": 0.5 },
    "tierWeight": [0.4, 1, 1.6, 2.4, 3], "nestMul": 1.5, "havenMul": 0.3, "foragePerDay": 2, "forageCapDays": 4
  },
  "market": {
    "region": "the-tap",
    "base": { "food": 3, "water": 1, "medicine": 8, "fuel": 2, "tools": 10, "materials": 1, "valuables": 6 },
    "target": { "food": 40, "water": 20, "medicine": 15, "fuel": 30, "tools": 10, "materials": 30, "valuables": 10 },
    "elasticity": { "food": 1.0, "water": 1.1, "medicine": 1.0, "fuel": 0.8, "tools": 0.6, "materials": 0.6, "valuables": 0.7 },
    "startStock": { "food": 40, "water": 20, "medicine": 15, "fuel": 30, "tools": 10, "materials": 30, "valuables": 5 },
    "acorns": 400, "drift": 0.08, "tax": 0.1, "clampLo": 0.2, "clampHi": 8
  },
  "player": {
    "waterPerHour": 1.4, "foodPerHour": 0.2, "exertionWaterPerHour": 2.0, "exertionFoodPerHour": 0.4,
    "comfortTemp": 12, "warmthPerDegreeHour": 0.6,
    "warmthWeatherPerHour": { "clear": 0, "overcast": 0, "drizzle": -4, "rain": -8, "fog": -2, "frost": -10, "storm": -30 },
    "warmthNightPerHour": -3, "warmthFirePerHour": 40, "warmthHavenPerHour": 4, "warmthHighPerHour": -3,
    "warmthWetPerHour": -4, "warmthRecoverPerHour": 6,
    "calmHatlessPerHour": -20, "calmNightOutsidePerHour": -6, "calmHavenPerHour": 15, "calmFirePerHour": 10, "calmDayPerHour": 3,
    "lowThreshold": 30, "zeroWearPerHour": { "cold": 12, "thirst": 6, "hunger": 3 }, "dirtyWaterCrampChance": 0.25
  },
  "infection": {
    "stage0Hours": 0.5, "stage1Hours": 3, "stage2Hours": 12, "turnHours": 24,
    "exposeOpenCrack": 0.12, "exposeGlazed": 0.03,
    "seasonMul": { "spring": 1.5, "summer": 1.0, "autumn": 1.0, "winter": 0.5 }, "wetMul": 1.25,
    "cure": { "salt-wash": [0.95, 0, 0, 0], "spirit": [0.95, 0, 0, 0], "scrape-seal": [0.95, 0.8, 0, 0] },
    "missingGlazingPenalty": 0.1, "playerGlazing": 0,
    "stageCalmPerHour": [0, -4, -6, -10], "stageWarmthPerHour": [0, 0, -5, -8]
  },
  "body": {
    "partWeights": { "head": 0.1, "chest": 0.2, "armL": 0.175, "armR": 0.175, "legL": 0.175, "legR": 0.175 },
    "crackPerHit": 0.6, "fallChip": 6, "fallCrack": 12, "fallShatter": 25, "fallShatterChance": 0.5,
    "wearToShatter": 100, "glazeLossPerHit": 0.05
  }
}
```

### 3.5 `src/sim/regions.ts` (verbatim data, plus `buildGraph`)

```ts
export const REGIONS: readonly RegionDef[] = [ // order matters: regionAt() takes the first match (gate-roof sits over forecourt and verge-path)
  { id: 'gate-roof', name: 'Gate Roof', district: 'lychgate', rect: { x0: 280, x1: 360, z0: 466, z1: 494 }, floorY: 18, traits: ['HIGH', 'HAVEN', 'GATE'], lootTier: 1, startHatless: [0, 0], startNpcs: [4, 8], water: 'clean', forage: 0 },
  { id: 'forecourt', name: 'Forecourt', district: 'lychgate', rect: { x0: 200, x1: 440, z0: 400, z1: 480 }, floorY: 0, traits: ['OPEN', 'CHOKE'], lootTier: 1, startHatless: [10, 30], startNpcs: [6, 12], water: null, forage: 2 },
  { id: 'verge-path', name: 'The Verge Path', district: 'lychgate', rect: { x0: 200, x1: 440, z0: 480, z1: 520 }, floorY: 0, traits: ['OPEN', 'GATE'], lootTier: 0, startHatless: [0, 6], startNpcs: [2, 6], water: null, forage: 4 },
  { id: 'bin-corner', name: 'Bin Corner', district: 'lychgate', rect: { x0: 440, x1: 560, z0: 400, z1: 520 }, floorY: 0, traits: ['WARM', 'NEST'], lootTier: 1, startHatless: [20, 60], startNpcs: [0, 3], water: null, forage: 3 },
  { id: 'ivy-rows', name: 'Ivy Rows', district: 'old-rows', rect: { x0: 0, x1: 160, z0: 240, z1: 400 }, floorY: 0, traits: ['COVER', 'ECHO'], lootTier: 1, startHatless: [30, 70], startNpcs: [8, 16], water: null, forage: 4 },
  { id: 'leaning-rows', name: 'Leaning Rows', district: 'old-rows', rect: { x0: 160, x1: 320, z0: 240, z1: 400 }, floorY: 0, traits: ['ECHO'], lootTier: 2, startHatless: [40, 90], startNpcs: [8, 16], water: null, forage: 3 },
  { id: 'the-sinks', name: 'The Sinks', district: 'old-rows', rect: { x0: 0, x1: 120, z0: 120, z1: 240 }, floorY: 0, traits: ['PIT', 'DEEP', 'FLOODS'], lootTier: 2, startHatless: [60, 140], startNpcs: [0, 4], water: 'dirty', forage: 2 },
  { id: 'angel-square', name: 'Angel Square', district: 'old-rows', rect: { x0: 120, x1: 240, z0: 120, z1: 240 }, floorY: 0, traits: ['HIGH', 'SACRED'], lootTier: 2, startHatless: [5, 20], startNpcs: [6, 12], water: null, forage: 2 },
  { id: 'masons-corner', name: "The Mason's Corner", district: 'old-rows', rect: { x0: 240, x1: 320, z0: 120, z1: 240 }, floorY: 0, traits: ['OPEN'], lootTier: 2, startHatless: [5, 20], startNpcs: [4, 10], water: null, forage: 1 },
  { id: 'child-graves', name: 'Child Graves', district: 'old-rows', rect: { x0: 0, x1: 160, z0: 0, z1: 120 }, floorY: 0, traits: ['SACRED'], lootTier: 2, startHatless: [5, 20], startNpcs: [4, 10], water: null, forage: 3 },
  { id: 'yew-edge', name: 'Yew Edge', district: 'old-rows', rect: { x0: 160, x1: 320, z0: 0, z1: 120 }, floorY: 0, traits: ['CHOKE', 'TOLL'], lootTier: 1, startHatless: [15, 40], startNpcs: [6, 12], water: null, forage: 4 },
  { id: 'the-tap', name: 'The Tap', district: 'yew-walk', rect: { x0: 320, x1: 440, z0: 0, z1: 400 }, floorY: 0, traits: ['HAVEN', 'TOLL'], lootTier: 1, startHatless: [10, 30], startNpcs: [12, 24], water: 'clean', forage: 2 },
];
export const EDGES: readonly EdgeDef[] = [
  { a: 'gate-roof', b: 'forecourt', climb: true }, { a: 'gate-roof', b: 'verge-path', climb: true },
  { a: 'forecourt', b: 'verge-path', climb: false }, { a: 'forecourt', b: 'bin-corner', climb: false },
  { a: 'forecourt', b: 'leaning-rows', climb: false }, { a: 'forecourt', b: 'the-tap', climb: false },
  { a: 'ivy-rows', b: 'leaning-rows', climb: false }, { a: 'ivy-rows', b: 'the-sinks', climb: false },
  { a: 'ivy-rows', b: 'angel-square', climb: false }, { a: 'leaning-rows', b: 'angel-square', climb: false },
  { a: 'leaning-rows', b: 'masons-corner', climb: false }, { a: 'leaning-rows', b: 'the-tap', climb: false },
  { a: 'the-sinks', b: 'angel-square', climb: false }, { a: 'the-sinks', b: 'child-graves', climb: false },
  { a: 'angel-square', b: 'masons-corner', climb: false }, { a: 'angel-square', b: 'child-graves', climb: false },
  { a: 'angel-square', b: 'yew-edge', climb: false }, { a: 'masons-corner', b: 'yew-edge', climb: false },
  { a: 'masons-corner', b: 'the-tap', climb: false }, { a: 'child-graves', b: 'yew-edge', climb: false },
  { a: 'yew-edge', b: 'the-tap', climb: false },
];
export const MAP_OUTLINE: readonly [number, number][] = [[0, 0], [440, 0], [440, 400], [560, 400], [560, 520], [200, 520], [200, 400], [0, 400]];
export function buildGraph(regions = REGIONS, edges = EDGES): RegionGraph; // byId, neighbours (both directions, cost = centre distance x (climb ? 3 : 1))
export function regionAt(x: number, z: number): RegionId | null;        // first REGIONS rect holding the point (edges inclusive)
export function rectArea(r: Rect): number;
export const HAVEN_REGION: Record<HavenId, RegionId> = { waystation: 'gate-roof', tap: 'the-tap' };
```

### 3.6 `src/sim/world.ts` (planner-written; behaviour)

```ts
export function createWorld(seed: number, tuning: Tuning = TUNING, containers: readonly ContainerDef[] = MAP.containers): { world: WorldState; streams: Streams };
export function stepWorld(w: WorldState, s: Streams): void;
export function runDays(w: WorldState, s: Streams, days: number): void;   // stepWorld days x ticksPerDay times
export function runWorld(seed: number, days: number, tuning?: Tuning): { world: WorldState; rows: DailyRow[] };
export function killNpc(w: WorldState, npc: Npc, cause: DeathCause, rng: Rng): void;
export function npcsIn(w: WorldState, r: RegionId): Npc[];               // alive, in id order
export function promoteRegion(w: WorldState, r: RegionId): number;       // moves density[r] + herds in r into w.promoted; returns the count
export function absorbIntoPromoted(w: WorldState): number;               // new arrivals in the promoted region since last call, moved into w.promoted
export function demoteRegion(w: WorldState, alive: number): void;        // density[promoted] += alive; promoted = { null, 0 }
export function recordHatlessDestroyed(w: WorldState): void;             // promoted.hatless -= 1; ledger.hatlessDestroyed += 1
export function recordPlayerTake(w: WorldState, stack: ItemStack): void; // ledger.removedByPlayer[res] += count
export function hatlessTotal(w: WorldState): number;                     // sum density + sum herds + promoted.hatless
export function resourceTotals(w: WorldState): Record<Resource, number>; // regions + container contents + alive and dead NPC carried + market stock
export function acornTotal(w: WorldState): number;                       // all NPCs (alive or dead) + market
export function hashWorld(w: WorldState): string;                        // FNV-1a over JSON of tick, weather, npcs, groups, horde, loot, containers, market
export function recordDaily(w: WorldState): DailyRow;                    // pushes onto w.daily and returns it
export function endOfDay(w: WorldState): boolean;                        // w.tick % ticksPerDay === ticksPerDay - 1
export function dayOf(tick: number, t: Tuning): number;                  // floor(tick / ticksPerDay) + 1
export function hourOf(tick: number, t: Tuning): number;                 // (tick % ticksPerDay) * 24 / ticksPerDay
export function emptyResources(): Record<Resource, number>;
```

- `createWorld`: graph = `buildGraph()`; streams = `createStreams(seed)`; then in this order `initWeather(w, s.weather)`,
  `seedHorde(w, s.horde)`, `spawnNpcs(w, s.npc)`, `initLoot(w, s.loot, containers)`, `initMarket(w, s.market)`; then the
  ledger: `npcsStart`, `hatlessStart = hatlessTotal`, `lootStart = resourceTotals`, `regionLootStart`, `acornsStart`.
- `stepWorld`: `w.events.length = 0`; `stepWeather(w, s.weather)`; `stepHorde(w, s.horde)`; `stepNpcs(w, s.npc)`;
  `stepGroups(w, s.groups)`; `stepMarket(w, s.market)`; `if (endOfDay(w)) { dailyForage(w, s.loot); recordDaily(w); }`;
  `writeChronicle(w, s.chronicle)`; `w.tick += 1`.
- `killNpc`: alive false, `diedTick`, `cause`, `ledger.deaths[cause] += 1`; carried resources go into
  `w.loot[npc.region]` (a body is looted later; totals unchanged) and `carried` is zeroed; acorns stay on the record;
  removes it from its group (group under 2 members is removed and its last member's `groupId = null`, event
  `group-dissolved`; a dead leader is replaced by `members[0]`); with `rng.chance(min(1, riseChance[cause] x
  (MOSSY ? 1.5 : 1)))` it rises: `w.horde.density[region] += 1`, `ledger.hatlessRisen += 1`, event `npc-rose`. Always
  pushes `npc-died`.
- Stubs that Step 0 writes (each exports its final signature with a trivial body; the owning issue replaces the body):

| File | Exports (final signatures) | Stub body | Owner |
|---|---|---|---|
| `src/sim/npcs.ts` | `spawnNpcs(w: WorldState, rng: Rng): void`, `stepNpcs(w: WorldState, rng: Rng): void` | spawns `startNpcs[0]` per region with default traits and needs 100; step does nothing | 1.1 |
| `src/sim/groups.ts` | `stepGroups(w, rng): void`, `groupSafety(w: WorldState, npc: Npc): number`, `groupOf(w: WorldState, npc: Npc): Group \| null` | no-op, 0, lookup by id | 1.2 |
| `src/sim/horde.ts` | `seedHorde(w, rng): void`, `stepHorde(w, rng): void`, `hatlessInRegion(w, r): number`, `hatlessThreat(w, r): number`, `addNoise(w, r, amount): void` | density = `startHatless[0]`; no-op; density; 0; adds | 1.3 |
| `src/sim/loot.ts` | `initLoot(w, rng, containers: readonly ContainerDef[]): void`, `dailyForage(w, rng): void`, `takeLoot(w, r, res, want, rng): number`, `forage(w, r, want, rng): number`, `rollContainer(w, id, rng): ItemStack[]` | zero stocks, empty containers; 0; [] | 1.4 |
| `src/sim/market.ts` | `initMarket(w, rng): void`, `stepMarket(w, rng): void`, `priceOf(w, res): number`, `marketBuy(w, npc, res, units): number`, `marketSell(w, npc, res, units): number` | base prices; no-op; base; 0; 0 | 1.5 |
| `src/sim/weather.ts` | `initWeather(w, rng): void`, `stepWeather(w, rng): void`, `seasonOf(day: number, t: Tuning): Season`, `isNight(hour: number, t: Tuning): boolean` | clear 10 C; no-op; startSeason; hour >= 22 or < 6 | 1.6 |
| `src/sim/chronicle.ts` | `formatDate(tick: number, t: Tuning): string`, `writeChronicle(w, rng): void` | `Year 1, autumn, day N`; no-op | 1.6 |
| `src/sim/names.ts` | `makeName(rng: Rng): string` | `Gnome <n>` | 1.6 |
| `src/sim/cli.ts` | `runCli(argv: string[], opts: { profile?: unknown }): { exitCode: number; stdout: string; rows: string }` | for each seed prints one line `seed N: day D alive A/S hatless H/HS food left F groups G chronicle C`; `--chronicle` prints seed 1's lines | 2.2 |
| `src/sim/scorecard.ts`, `src/sim/bands.ts` | see issue 2.2 | empty | 2.2 |

### 3.7 `src/world/types.ts` (verbatim) and the `src/world/blockout.ts` stub

```ts
import type { ContainerDef, HavenId, ItemId, Rect, RegionId } from '../sim/types';
export type Side = 'n' | 's' | 'e' | 'w';   // n = face at z0 (faces -z), s = face at z1, w = face at x0, e = face at x1
export type BlockKind = 'headstone' | 'kerb' | 'wall' | 'hedge' | 'gatehouse' | 'roof' | 'bin' | 'angel' | 'plinth' | 'stone' | 'beam' | 'standpipe';
/** An axis-aligned solid box from y to y + h. */
export interface BlockDef { id: string; kind: BlockKind; x0: number; x1: number; z0: number; z1: number; y: number; h: number }
export type RouteKind = 'ladder' | 'rope' | 'ivy' | 'letters';
/** A way up one face of a block (or out of a pit: block = the pit id). `at` = metres along the face from its west (n/s faces) or north (e/w faces) end. */
export interface ClimbRouteDef { id: string; block: string; side: Side; kind: RouteKind; at: number }
export interface PitDef { id: string; rect: Rect; depth: number }        // ground inside the rect is at -depth
export type SpotKind = 'hatless' | 'npc' | 'fire' | 'bed';
export interface SpotDef { id: string; kind: SpotKind; region: RegionId; x: number; y: number; z: number }
export interface HavenDef { id: HavenId; name: string; region: RegionId; rect: Rect; minY: number } // safe while inside rect and y >= minY
export interface WaterDef { id: string; kind: 'standpipe' | 'puddle' | 'rain-catcher'; clean: boolean; x: number; y: number; z: number }
export interface PathDef { id: string; kind: 'gravel' | 'grass'; points: [number, number][]; width: number }
export interface PropDef { prefab: string; x: number; y: number; z: number; rotY?: number; scale?: number } // scale default PREFAB_SCALE (1.7)
export interface BlockoutMap {
  bounds: Rect;
  blocks: BlockDef[]; routes: ClimbRouteDef[]; pits: PitDef[]; spots: SpotDef[];
  havens: HavenDef[]; water: WaterDef[]; paths: PathDef[]; props: PropDef[];
  containers: ContainerDef[];
  playerSpawn: { x: number; y: number; z: number };
}
export type { ItemId };
```

Stub `blockout.ts`: `export const MAP: BlockoutMap` with `bounds {0,560,0,520}`, the gatehouse blocks and the haven
rects from issue 1.7's fixed list, one spawn `{ x: 320, y: 18.15, z: 480 }`, everything else empty. Stub `collide.ts`:
`createCollider(map)` returning `groundAt = () => 0`, `move` that adds the delta, `faceAhead = () => null`,
`regionAt` from regions.ts, `havenAt` by rect, `inBounds = true`, routes stored in an array.

### 3.8 `src/items/defs.ts` (verbatim)

```ts
import type { ItemId, Resource } from '../sim/types';
export type Tag =
  | 'FOOD' | 'DRINK' | 'HOLD_LIQUID' | 'COOK_VESSEL' | 'MEDICINE' | 'SALT' | 'SPIRIT' | 'ADHESIVE' | 'GLAZE'
  | 'FUEL' | 'KINDLING' | 'TINDER' | 'FIRESTARTER' | 'LIGHT' | 'CUT' | 'PRY' | 'DIG' | 'BLUNT' | 'PIERCE'
  | 'ROPE' | 'LADDER' | 'BINDING' | 'CONTAINER' | 'WEAR' | 'VALUABLE' | 'MATERIAL' | 'MOSS';
export type WornSlot = 'head' | 'back' | 'neck' | 'body';
export interface ItemDef {
  id: ItemId; prefab: string; name: string; tags: readonly Tag[]; resource: Resource;
  weight: number; bulk: number; maxCondition: number; stack: number;   // kg, litres, uses, max per stack
  props?: { damage?: number; reach?: number; capacity?: number; liquidCap?: number; food?: number; water?: number;
            warmth?: number; armour?: number; burnHours?: number; light?: number };
  wear?: WornSlot;
}
const d = (id: string, name: string, resource: Resource, tags: Tag[], weight: number, bulk: number, stack: number,
           props: ItemDef['props'] = {}, extra: Partial<ItemDef> = {}): ItemDef =>
  ({ id, prefab: id, name, resource, tags, weight, bulk, stack, maxCondition: 1, props, ...extra });
export const ITEM_LIST: readonly ItemDef[] = [
  d('bread-loaf', 'Bread loaf', 'food', ['FOOD'], 0.3, 1, 4, { food: 20 }),
  d('crab-apple', 'Crab apple', 'food', ['FOOD'], 0.1, 0.3, 8, { food: 8 }),
  d('blackberry', 'Blackberry', 'food', ['FOOD'], 0.05, 0.1, 12, { food: 4 }),
  d('cheese-wedge', 'Cheese wedge', 'food', ['FOOD'], 0.2, 0.5, 4, { food: 15 }),
  d('red-mushroom', 'Red mushroom', 'food', ['FOOD'], 0.1, 0.3, 8, { food: 6 }),
  d('seed-cake', 'Seed cake', 'food', ['FOOD'], 0.2, 0.5, 4, { food: 18 }),
  d('spigot-water', 'Bottle of water', 'water', ['DRINK'], 0.5, 0.5, 4, { water: 30 }),
  d('tin-pail', 'Tin pail', 'tools', ['HOLD_LIQUID', 'COOK_VESSEL'], 0.4, 2, 1, { liquidCap: 2 }),
  d('clay-jar', 'Clay jar', 'tools', ['HOLD_LIQUID'], 0.5, 1, 1, { liquidCap: 1 }),
  d('salt-pinch', 'Pinch of salt', 'medicine', ['MEDICINE', 'SALT'], 0.05, 0.1, 10),
  d('stout-tankard', 'Tankard of stout', 'medicine', ['SPIRIT'], 0.4, 0.5, 2),
  d('slug-slime', 'Slug slime', 'medicine', ['ADHESIVE'], 0.1, 0.2, 6),
  d('glaze-pot', 'Glaze pot', 'medicine', ['GLAZE', 'MEDICINE'], 0.3, 0.4, 2),
  d('twig-bundle', 'Twig bundle', 'fuel', ['FUEL', 'KINDLING', 'TINDER'], 0.3, 1, 6, { burnHours: 1 }),
  d('timber-log', 'Timber log', 'fuel', ['FUEL'], 1.2, 3, 2, { burnHours: 3 }),
  d('candle', 'Candle', 'fuel', ['LIGHT', 'FUEL'], 0.1, 0.2, 6, { light: 6, burnHours: 0.5 }),
  d('flint-striker', 'Flint striker', 'tools', ['FIRESTARTER'], 0.1, 0.1, 1, {}, { maxCondition: 30 }),
  d('torch', 'Torch', 'tools', ['LIGHT', 'FIRESTARTER', 'BLUNT'], 0.4, 1, 1, { damage: 0.6, reach: 1.2, light: 10 }),
  d('old-trowel', 'Old trowel', 'tools', ['DIG', 'PRY', 'BLUNT'], 0.5, 1, 1, { damage: 1, reach: 1.1 }),
  d('thorn-dagger', 'Thorn dagger', 'tools', ['CUT', 'PIERCE'], 0.2, 0.4, 1, { damage: 1.2, reach: 0.9 }),
  d('acorn-club', 'Acorn club', 'tools', ['BLUNT'], 0.8, 1.5, 1, { damage: 1.6, reach: 1.3 }),
  d('hand-fork', 'Hand fork', 'tools', ['PRY', 'PIERCE', 'DIG'], 0.5, 1, 1, { damage: 1.1, reach: 1.2 }),
  d('rope-coil', 'Rope coil', 'tools', ['ROPE', 'BINDING'], 0.8, 2, 1),
  d('ladder', 'Ladder', 'tools', ['LADDER'], 2.5, 6, 1),
  d('spider-silk', 'Spider silk', 'materials', ['BINDING', 'MATERIAL'], 0.05, 0.2, 10),
  d('stone-chunk', 'Stone chunk', 'materials', ['MATERIAL'], 0.6, 0.5, 6),
  d('clay-chunk', 'Clay chunk', 'materials', ['MATERIAL'], 0.5, 0.5, 6),
  d('moss-clump', 'Moss clump', 'materials', ['MATERIAL', 'MOSS'], 0.1, 0.3, 10),
  d('button', 'Button', 'valuables', ['VALUABLE'], 0.02, 0.05, 20),
  d('gold-coins', 'Gold coins', 'valuables', ['VALUABLE'], 0.1, 0.1, 10),
  d('loot-sack', 'Loot sack', 'tools', ['CONTAINER', 'WEAR'], 0.3, 1, 1, { capacity: 12 }, { wear: 'back' }),
  d('wool-scarf', 'Wool scarf', 'materials', ['WEAR'], 0.1, 0.3, 1, { warmth: 10 }, { wear: 'neck' }),
  d('bucket-helm', 'Bucket helm', 'tools', ['WEAR'], 0.4, 1, 1, { armour: 0.3 }, { wear: 'head' }),
];
export const ITEMS: Readonly<Record<ItemId, ItemDef>> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));
export function getItem(id: ItemId): ItemDef { const i = ITEMS[id]; if (!i) throw new Error(`unknown item ${id}`); return i; }
export function hasTag(id: ItemId, tag: Tag): boolean { return getItem(id).tags.includes(tag); }
export function itemsWith(resource: Resource): ItemDef[] { return ITEM_LIST.filter((i) => i.resource === resource); }
```
Every `prefab` is an existing `@lawn/prefabs` id except `flint-striker`, `rope-coil`, `ladder`, `moss-clump` (added by
issue 1.9). Until 1.9 lands, `buildPrefab` of those returns an empty group; nothing breaks.

### 3.9 `src/config.ts` (verbatim)

```ts
import type { ContainerType, ItemStack } from './sim/types';
export const GNOME_HEIGHT = 1.7;   // gm; every gnome model is scaled to this height
export const PREFAB_SCALE = 1.7;   // @lawn/prefabs: 1 unit = one gnome height
export const PLAYER_RADIUS = 0.45;
export const PLAYER_HEIGHT = 1.7;
export const STEP_UP = 0.5;        // walk up onto anything this much higher
export const VAULT_MAX = 1.6;      // grave kerbs: vault with the climb input
export const HATLESS_STEP = 1.6;   // the Hatless get over kerbs and nothing higher
export const LADDER_MAX = 10;
export const ROPE_MAX = 15;
export const MOVE = { walk: 2, jog: 4, sprint: 6, crouchMul: 0.5, accel: 12, gravity: 30, jogAt: 0.6 } as const;
export const CLIMB = { routeSpeed: 1.0, ropeSpeed: 0.8, ladderSpeed: 1.5, staminaPerSec: 6, vaultSeconds: 0.6, reach: 1.0, alongTolerance: 2 } as const;
export const STAMINA = { max: 100, sprintPerSec: 12, regenPerSec: 10, regenDelay: 1, attackCost: 8 } as const;
export const NOISE = { walk: 6, jog: 12, sprint: 25, crouchMul: 0.5, climb: 8, attack: 10, fire: 30, weightMul: 0.5, everySec: 0.25 } as const;
export const FALL = { chip: 6, crack: 12, shatter: 25 } as const;
export const CARRY = { capacityKg: 8, pocketsBulk: 4, overloadWalkOnly: 1.2 } as const;
export const HATLESS = {
  shamble: 1.2, lunge: 4, lungeSeconds: 1.5, lungeRange: 4, grabRange: 1.0, scratchEvery: 1.2,
  sightRange: 25, sightHalfAngle: 0.5, coreHp: 3, giveUpSeconds: 20, pileReach: 3, radius: 0.45,
  maxL0Desktop: 40, maxL0Phone: 24, staggerSeconds: 0.6,
} as const;
export const CAMERA = { distance: 4.2, height: 1.4, pitchMin: -0.35, pitchMax: 1.1, pitchDefault: 0.25, lookSensitivity: 0.0025, keyTurn: 2.2, crouchDrop: 0.5 } as const;
export const SUN = { realSecondsPerSunHour: 300, startHour: 8, nightStart: 22, nightEnd: 6 } as const;
export const FEED = { hysteresisSeconds: 60, npcMaxShown: 8, prerunDays: 2 } as const;
export const FIRE = { warmRadius: 4, noiseEverySec: 3, burnHoursPerFuel: 2, waystationStartHours: 6 } as const;
export const RAIN_CATCHER = { litresPerHour: 0.5, capLitres: 3 } as const;
export const FISTS = { damage: 0.5, reach: 0.8 } as const;
export const START_KIT: readonly ItemStack[] = [
  { def: 'loot-sack', count: 1, condition: 1 }, { def: 'old-trowel', count: 1, condition: 1 },
  { def: 'bread-loaf', count: 1, condition: 1 }, { def: 'spigot-water', count: 1, condition: 1 },
  { def: 'flint-striker', count: 1, condition: 1 }, { def: 'twig-bundle', count: 2, condition: 1 },
];
export const CLIMB_KIT: readonly ItemStack[] = [{ def: 'rope-coil', count: 1, condition: 1 }, { def: 'ladder', count: 1, condition: 1 }];
export const CONTAINER_PREFAB: Record<ContainerType, string> = {
  vase: 'flower-pot', bin: 'compost-bin', 'grave-goods': 'wicker-basket', crate: 'crate', sack: 'sack',
  chest: 'wooden-chest', 'camp-cache': 'loot-sack', body: 'loot-sack',
};
export const CONTAINER_NAME: Record<ContainerType, string> = {
  vase: 'vase', bin: 'bin', 'grave-goods': 'grave goods', crate: 'crate', sack: 'sack', chest: 'chest',
  'camp-cache': 'old camp cache', body: 'remains',
};
export const DOM = { hud: 'dayg-hud', inv: 'dayg-inv', touch: 'dayg-touch', recap: 'dayg-recap' } as const;
export const COLORS = {
  sky: 0x9fb4c0, nightSky: 0x141a26, fog: 0xa9b6b9, ground: 0x5f7d45, gravel: 0x9a9286, stone: 0x8d8a83,
  mossStone: 0x6f7a5e, hedge: 0x2f4a2a, wood: 0x6b4a2e, moss: 0x7d8b6a, mossDark: 0x56614a, pit: 0x3b3326,
} as const;
/** Screen zones every UI module respects (CSS px, inside the safe-area insets). */
export const LAYOUT = {
  topBar: 64,            // HUD needs and clock live in the top 64 px
  buttonsW: 200, buttonsH: 270, // touch buttons: bottom-right block
  stickZone: 0.45,       // left 45% of the width, bottom half: floating stick
  promptBottom: 120,     // context prompt sits 120 px above the bottom, centred
} as const;
```

### 3.10 `src/game/types.ts` (verbatim): every game-side interface

```ts
import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import type { DeathCause, HavenId, ItemId, ItemStack, NpcId, RegionId, Season, TreatMethod, WeatherKind, WeatherState } from '../sim/types';
import type { ClimbRouteDef, SpotDef } from '../world/types';
import type { Tag, WornSlot, ItemDef } from '../items/defs';

export interface Vec3 { x: number; y: number; z: number }
export type Stance = 'stand' | 'crouch';
export type ClimbVia = 'route' | 'rope' | 'ladder';

export interface InputState {
  moveX: number; moveZ: number;   // -1..1; moveX +1 = right, moveZ +1 = forward
  lookX: number; lookY: number;   // radians this frame; lookX > 0 turns right, lookY > 0 looks down
  sprint: boolean;                // held
  crouch: boolean;                // edge: toggle stance
  action: boolean;                // edge: context action
  attack: boolean;                // edge: swing the held item
  climb: boolean;                 // edge: vault / climb / climb down
  inventory: boolean;             // edge: open or close the pack
  view: boolean;                  // edge: third / first person
}
export interface TouchSource { root: HTMLElement; read(): Partial<InputState>; setVisible(on: boolean): void; setClimbHint(on: boolean): void; active(): boolean }
export interface Input { read(dt: number): InputState; setPointerLockAllowed(allowed: boolean): void }
export interface CameraRig { yaw: number; pitch: number; view: 'third' | 'first'; update(target: THREE.Vector3, input: InputState, dt: number, crouched: boolean): void }

export interface Clock {
  sunHours: number; hourOfDay: number; day: number; night: boolean; light: number; season: Season; rate: number;
  update(dt: number): number;     // returns sun-hours advanced this frame
  setRate(rate: number): void;    // 1 = normal; sleeping uses more
}

export interface PlayerState {
  pos: THREE.Vector3; vel: THREE.Vector3; facing: number;  // facing: yaw, model faces +z at 0; forward = (sin f, 0, cos f)
  grounded: boolean; stance: Stance; sprinting: boolean;
  stamina: number;                                         // 0..100
  climbing: { topY: number; speed: number; via: ClimbVia; startY: number; down: boolean } | null;
  vaulting: number;                                        // seconds left in a vault
  fallFromY: number | null;
  speed: number;                                           // horizontal gm/s this frame
  noise: number;                                           // radius of the last step noise, gm
  region: RegionId | null; haven: HavenId | null;
  alive: boolean;
}
export interface MoveMods { speedMul: number; staminaRegenMul: number; canSprint: boolean; carryRatio: number; hasRope: boolean; hasLadder: boolean }
export interface ClimbHint { kind: 'vault' | 'route' | 'rope' | 'ladder' | 'too-high' | 'down'; height: number }
export interface PlayerController { update(p: PlayerState, input: InputState, yaw: number, dt: number, mods: MoveMods): void; climbHint(p: PlayerState, mods: MoveMods): ClimbHint | null }
export interface PlayerViewOpts { held: ItemId | null; back: ItemId | null; head: ItemId | null; hatSlips: boolean; dead: boolean }
export interface PlayerView { model: GnomeModel; update(p: PlayerState, dt: number, opts: PlayerViewOpts): void }
export interface WorldView { root: THREE.Group; containerObjects: Map<string, THREE.Object3D>; addRoute(route: ClimbRouteDef, fromY: number, topY: number): void; setContainerOpened(id: string): void }
export interface Sky { update(clock: Clock, weather: WeatherState, focus: THREE.Vector3, dt: number): void }

export interface Needs { warmth: number; water: number; food: number; calm: number }   // 0..100, 100 = fine
export interface NeedDamage { cause: 'cold' | 'thirst' | 'hunger'; perHour: number }
export interface NeedsEnv {
  night: boolean; weather: WeatherKind; tempC: number; nearFire: boolean; inHaven: boolean;
  hatlessNear: number; exertion: number; wet: number; altitude: number; infectionStage: InfectionStage | null;
}
export interface NeedsEffects { speedMul: number; staminaRegenMul: number; aimShake: number; damage: NeedDamage[] }
export interface NeedsSystem { state: Needs; update(sunHours: number, env: NeedsEnv): void; effects(): NeedsEffects; eat(def: ItemDef): void; drink(litres: number, clean: boolean): void }

export type BodyPart = 'head' | 'chest' | 'armL' | 'armR' | 'legL' | 'legR';
export const BODY_PARTS: readonly BodyPart[] = ['head', 'chest', 'armL', 'armR', 'legL', 'legR'];
export type CrackLevel = 0 | 1 | 2 | 3;      // none, chip, crack, deep crack
export type InfectionStage = 0 | 1 | 2 | 3;  // exposed, rooting, spreading, taking
export interface Infection { part: BodyPart; hours: number; stage: InfectionStage }
export interface BodyState { cracks: Record<BodyPart, CrackLevel>; glaze: number; wear: number; infection: Infection | null; shattered: boolean; cause: DeathCause | null }
export interface BodyEffects { limp: number; aimShake: number; hatSlips: boolean }
export interface BodySystem { state: BodyState; update(sunHours: number, env: { damage: NeedDamage[]; season: Season; wet: number }): void; effects(): BodyEffects; treat(method: TreatMethod): boolean; mend(): boolean }

export interface Inventory { hands: [ItemStack | null, ItemStack | null]; worn: Partial<Record<WornSlot, ItemStack>>; pack: ItemStack[] }
export type StackRef = { where: 'hand'; index: 0 | 1 } | { where: 'worn'; slot: WornSlot } | { where: 'pack'; index: number };
export interface InventorySystem {
  state: Inventory;
  add(stack: ItemStack): ItemStack | null;          // merges, then pack, then free hands; returns what did not fit, or null
  get(ref: StackRef): ItemStack | null;
  take(ref: StackRef, count: number): ItemStack | null;
  move(from: StackRef, to: StackRef): boolean;      // hold, wear, put away (swaps when the target is full)
  findTag(tag: Tag): StackRef | null;               // hands, then pack, then worn
  countTag(tag: Tag): number;
  consumeTag(tag: Tag, count: number): boolean;     // all or nothing
  held(): ItemStack | null;                         // hands[0]
  weight(): number; carryCapacity(): number; bulkUsed(): number; bulkCapacity(): number;
  cleanWater(): number;                             // litres: clean liquid in HOLD_LIQUID stacks + 0.5 per DRINK item
  useWater(litres: number): number;                 // removes clean water (liquid first, then whole DRINK items), returns litres removed
  fillLiquid(kind: 'clean' | 'dirty', litres: number): number; // into empty or same-kind HOLD_LIQUID stacks; returns litres stored
  onChange(fn: () => void): () => void;
}

export type RecipeId = 'campfire' | 'salt-wash' | 'spirit-wash' | 'scrape-seal' | 'boil-water' | 'mend-glaze';
export interface RecipeDef { id: RecipeId; name: string; inputs: { tag: Tag; count: number }[]; water: number; tool: Tag | null; seconds: number; needsFire: boolean }
export interface UseAction { id: string; label: string; seconds: number; kind: 'eat' | 'drink' | 'wear' | 'unwear' | 'hold' | 'stow' | 'drop' | 'recipe'; ref?: StackRef; recipe?: RecipeId }
export interface UseApi {
  actionsFor(ref: StackRef): UseAction[];
  recipes(): { def: RecipeDef; ok: boolean; why: string | null }[];
  start(action: UseAction): boolean;
  update(dt: number): void;
  busy(): { label: string; progress: number } | null;
  cancel(): void;
}
export interface InventoryPanel { root: HTMLElement; toggle(): void; open(): void; close(): void; isOpen(): boolean; showLoot(title: string, items: ItemStack[], onTake: (index: number) => void): void }
export interface HudState {
  needs: Needs; stamina: number; body: BodyState; hourOfDay: number; day: number; night: boolean; season: Season;
  weather: WeatherKind; regionName: string | null; haven: HavenId | null; stance: Stance;
  busy: { label: string; progress: number } | null; carry: { weight: number; capacity: number };
}
export interface Hud { root: HTMLElement; update(s: HudState): void; prompt(text: string | null): void; toast(text: string, seconds?: number): void }

export interface HatlessSystem {
  spawn(region: RegionId, count: number, spots: readonly SpotDef[], from?: { x: number; z: number }): void;
  despawnAll(): number;                             // removes every L0 Hatless, returns how many were alive
  update(dt: number, ctx: { night: boolean; fog: boolean }): void;
  strike(origin: Vec3, facing: number, reach: number, damage: number): number; // hits landed
  aliveCount(): number;
  nearCount(pos: Vec3, radius: number): number;
}
export interface NpcActors { show(npcs: readonly { id: NpcId; name: string; lookSeed: number }[], spots: readonly SpotDef[]): void; remove(id: NpcId): void; clear(): void; update(dt: number): void; ids(): NpcId[] }
export interface SimFeed { update(dt: number, sunHoursAdvanced: number): void; promoted(): RegionId | null }
export interface CampSystem { update(dt: number, sunHours: number, weather: WeatherState): void; placeFire(x: number, y: number, z: number, burnHours: number): boolean; nearFire(pos: Vec3): boolean; firesLit(): number; sleeping(): boolean }
export interface ContainerSystem { update(dt: number): void }
export interface EventLog { lines(seconds: number): string[]; stats(): { hatlessDestroyed: number; containersSearched: number; climbs: number } }
export interface Recap { show(cause: DeathCause, where: string | null, day: number, hourOfDay: number): void }
```

### 3.11 `src/game/bus.ts`, `src/game/interact.ts`, `src/game/clock.ts` (planner-written)

```ts
// bus.ts
export interface GameEvents {
  'noise': { x: number; z: number; radius: number; source: 'step' | 'attack' | 'fire' | 'climb' | 'other' };
  'player-hit': { strength: number; from: { x: number; z: number } };  // a Hatless scratch; strength 0..1
  'fell': { height: number };                                          // landed after falling more than 2 gm
  'climbed': { height: number; via: ClimbVia };                        // reached a top more than 1.6 gm above the start
  'route-placed': { route: ClimbRouteDef; fromY: number; topY: number };
  'hint': { text: string };
  'container-opened': { containerId: string; region: RegionId | null; items: ItemStack[] };
  'item-taken': { stack: ItemStack };
  'ate': { def: ItemId }; 'drank': { clean: boolean; litres: number };
  'recipe-done': { recipe: RecipeId; ok: boolean };
  'campfire-lit': { x: number; z: number };
  'infection': { stage: InfectionStage | 'turned'; part: BodyPart };
  'infection-cured': { stage: InfectionStage };
  'cracked': { part: BodyPart; level: CrackLevel; cause: 'hit' | 'fall' | 'cold' | 'scrape' };
  'hatless-destroyed': { region: RegionId | null };
  'dusk': { day: number }; 'dawn': { day: number };
  'entered-region': { region: RegionId };
  'haven': { inside: boolean; haven: HavenId };
  'slept': { hours: number };
  'player-shattered': { cause: DeathCause };
  'sim-tick': { tick: number };
}
export interface Bus { on<K extends keyof GameEvents>(k: K, fn: (e: GameEvents[K]) => void): () => void; emit<K extends keyof GameEvents>(k: K, e: GameEvents[K]): void }
export function createBus(): Bus;

// interact.ts
export interface Interactable { id: string; x: number; y: number; z: number; radius: number; label(): string | null; act(): void }
export interface Interact { add(i: Interactable): () => void; update(pos: Vec3): Interactable | null; current(): Interactable | null; trigger(): boolean }
export function createInteract(): Interact; // nearest with label() !== null, within radius in xz and |dy| < 2.5

// clock.ts
export function createClock(bus: Bus, opts: { startSunHours: number; timeScale: number; tuning: Tuning }): Clock;
// advance = dt * timeScale * rate / SUN.realSecondsPerSunHour; hourOfDay = sunHours % 24; day = floor(sunHours / 24) + 1;
// night via isNight(); light 0 at night, ramps 0..1 over 2 h after nightEnd and before nightStart; season via seasonOf(day);
// emits 'dusk' / 'dawn' when night flips.
```

### 3.12 Stubs for every game system (final signatures, trivial bodies)

| File | Export | Stub body | Owner |
|---|---|---|---|
| `src/world/collide.ts` | `createCollider(map: BlockoutMap): Collider` (interface in issue 1.8, written verbatim into the stub) | see 3.7 | 1.8 |
| `src/scene/worldBuilder.ts` | `buildWorld(scene: THREE.Scene, map: BlockoutMap): WorldView` | a 560x520 green plane | 2.3 |
| `src/scene/sky.ts` | `createSky(scene: THREE.Scene): Sky` | hemisphere + directional light, no-op update | 2.4 |
| `src/game/input.ts` | `createInput(canvas: HTMLCanvasElement, touch: TouchSource): Input` | WASD only | 2.5 |
| `src/game/camera.ts` | `createCameraRig(camera: THREE.PerspectiveCamera, collider: Collider): CameraRig` | fixed offset behind | 2.5 |
| `src/game/player.ts` | `createPlayerState(spawn: Vec3): PlayerState`, `createPlayerController(deps: { bus: Bus; collider: Collider }): PlayerController` | state; moves by input at walk speed | 2.6 |
| `src/scene/gnomes.ts` | `FALLBACK_LOOK`, `playerLook()`, `npcLook(seed)`, `hatlessLook(seed)`, `makeGnome(look, opts?)` (issue 2.7) | `createGnomeModel(look)` | 2.7 |
| `src/scene/playerView.ts` | `createPlayerView(scene: THREE.Scene): PlayerView` | gnome at the player position | 2.7 / 4.5 |
| `src/game/needs.ts` | `createNeedsSystem(bus: Bus, t: Tuning): NeedsSystem` | all 100, no effects | 3.1 |
| `src/game/body.ts` | `createBodySystem(bus: Bus, rng: () => number, t: Tuning): BodySystem` | no cracks | 3.2 |
| `src/game/inventory.ts` | `createInventory(start: readonly ItemStack[]): InventorySystem` | everything into pack | 3.3 |
| `src/items/recipes.ts` | `RECIPES: readonly RecipeDef[]`, `getRecipe(id: RecipeId): RecipeDef` | empty | 3.3 |
| `src/game/useItem.ts` | `createUseApi(deps: UseDeps): UseApi` (UseDeps in issue 3.4) | no actions | 3.4 |
| `src/ui/inventoryPanel.ts` | `createInventoryPanel(ui: HTMLElement, deps: { inv: InventorySystem; use: UseApi }): InventoryPanel` | hidden div `#dayg-inv` | 3.4 / 4.2 |
| `src/ui/hud.ts` | `createHud(ui: HTMLElement): Hud` | div `#dayg-hud` with text | 3.5 / 4.2 |
| `src/scene/hatless.ts` | `createHatlessSystem(deps: HatlessDeps): HatlessSystem` (HatlessDeps in issue 3.6) | counts only | 3.6 |
| `src/scene/containers.ts` | `createContainerSystem(deps: ContainerDeps): ContainerSystem` (issue 3.7) | no-op | 3.7 |
| `src/game/simFeed.ts` | `createSimFeed(deps: FeedDeps): SimFeed` (issue 3.8) | steps the sim when `clock.sunHours` passes `world.tick` | 3.8 |
| `src/scene/npcActors.ts` | `createNpcActors(deps: { scene: THREE.Scene; collider: Collider; getPlayer: () => PlayerState }): NpcActors` | no-op | 3.8 |
| `src/game/camp.ts` | `createCampSystem(deps: CampDeps): CampSystem` (issue 3.9) | no fires | 3.9 |
| `src/ui/touch.ts` | `createTouchControls(ui: HTMLElement): TouchSource` | empty div `#dayg-touch`, read = {} | 4.1 |
| `src/game/achievements.ts` | `createDaygAchievements(deps: { bus: Bus; ui: HTMLElement; getPlayer: () => PlayerState; clock: Clock }): void` | no-op | 4.3 |
| `src/game/eventLog.ts` | `createEventLog(bus: Bus, clock: Clock, getPlayer: () => PlayerState): EventLog` | empty | 4.4 |
| `src/ui/recap.ts` | `createRecap(ui: HTMLElement, log: EventLog): Recap` | `alert`-free div `#dayg-recap` with the cause | 4.4 |

The issue-specific deps types (`UseDeps`, `HatlessDeps`, `ContainerDeps`, `FeedDeps`, `CampDeps`) are exported from the
stub files with exactly the fields given in those issues.

### 3.13 `src/main.ts` (planner-written; the only integration point)

```
await loadMyGnome();                                      // first line after imports
params: seed (default 1 + Math.floor(Math.random() * 1e6) once, shown in the URL), timescale (1), simdays (FEED.prerunDays),
        night=1 (start at 21:30), kit=climb (adds CLIMB_KIT), touch=1 (force touch controls), spawn=x,z
renderer (antialias, pixelRatio min(dpr, coarse ? 1.5 : 2), shadows), scene, camera (60, near 0.3, far 900), resize
bus; { world, streams } = createWorld(seed); runDays(world, streams, simdays); step to hour SUN.startHour (or 21.5)
clock = createClock(bus, { startSunHours: world.tick, timeScale, tuning: TUNING })
collider = createCollider(MAP); worldView = buildWorld(scene, MAP); sky = createSky(scene)
touch = createTouchControls(ui); input = createInput(canvas, touch); rig = createCameraRig(camera, collider)
player = createPlayerState(spawn); controller = createPlayerController({ bus, collider }); playerView = createPlayerView(scene)
interact = createInteract(); inv = createInventory(kit); needs = createNeedsSystem(bus, TUNING); body = createBodySystem(bus, rng, TUNING)
camp = createCampSystem(...); use = createUseApi(...); panel = createInventoryPanel(ui, { inv, use }); hud = createHud(ui)
hatless = createHatlessSystem(...); npcs = createNpcActors(...); feed = createSimFeed(...); containers = createContainerSystem(...)
createDaygAchievements({ bus, ui, getPlayer, clock }); log = createEventLog(bus, clock, getPlayer); recap = createRecap(ui, log)
bus.on('route-placed', e => worldView.addRoute(e.route, e.fromY, e.topY)); bus.on('hint', e => hud.toast(e.text))
bus.on('player-shattered', e => { player.alive = false; recap.show(e.cause, regionName, clock.day, clock.hourOfDay) })
window.__dayg = { player, needs, body, inv, sim: { world, streams }, clock, bus, hatless, feed, camp, use, panel }

frame(dt = min(0.05, real dt)):
  hours = clock.update(dt); inp = input.read(dt)
  if inp.inventory: panel.toggle();  touch.setVisible(!panel.isOpen() && player.alive)
  if panel open, use.busy() or dead: zero moveX/moveZ, clear sprint/climb/attack/action
  mods = { speedMul: needs.effects().speedMul * (1 - 0.5 * body.effects().limp), staminaRegenMul: needs.effects().staminaRegenMul,
           canSprint: inv.weight() <= inv.carryCapacity(), carryRatio: inv.weight() / inv.carryCapacity(),
           hasRope: inv.countTag('ROPE') > 0, hasLadder: inv.countTag('LADDER') > 0 }
  controller.update(player, inp, rig.yaw, dt, mods); touch.setClimbHint(controller.climbHint(player, mods) !== null)
  if inp.attack and player.stamina >= STAMINA.attackCost: held = inv.held(); hatless.strike(player.pos, player.facing,
     (held props reach ?? FISTS.reach) + 0.6, held props damage ?? FISTS.damage); player.stamina -= cost; emit noise 'attack'
  if inp.action: interact.trigger()
  rig.update(player.pos, inp, dt, player.stance === 'crouch')
  feed.update(dt, hours); hatless.update(dt, { night: clock.night, fog: world.weather.kind === 'fog' }); npcs.update(dt)
  camp.update(dt, hours, world.weather); use.update(dt)
  wet = rain kinds (drizzle, rain, storm) ? (player.haven ? 0.5 : 1) : 0
  needs.update(hours, { night, weather, tempC, nearFire: camp.nearFire(player.pos), inHaven: player.haven !== null,
     hatlessNear: hatless.nearCount(player.pos, 15), exertion: sprinting ? 1 : speed > MOVE.walk + 0.5 ? 0.5 : 0, wet,
     altitude: player.pos.y, infectionStage: body.state.infection?.stage ?? null })
  body.update(hours, { damage: needs.effects().damage, season: clock.season, wet })
  playerView.update(player, dt, { held, back, head, hatSlips: body.effects().hatSlips, dead: !player.alive })
  sky.update(clock, world.weather, player.pos, dt)
  cur = interact.update(player.pos); hud.prompt(cur?.label() ?? climbHintText ?? null)
  hud.update({...}); renderer.render(scene, camera)
```

### 3.14 Step 0 checks

- `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg` (no tests yet: vitest
  `passWithNoTests` in `vite.config.ts` `test` block), `npm run sim -w games/dayg -- --seeds 2 --days 3`, `npm run lore`.
- `npm run dev -w games/dayg`, then `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-hud dayg-inv dayg-touch`.
- Commit nothing yet; round 1 starts.

---

## 4. Issues

### Round 1, Epic 1: sim systems, blockout data, collider, prefabs

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.1 NPCs)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files of games/dayg and packages/prefabs at the same time. Edit only the file
  under Change. If tsc reports errors in a file you do not own, that is someone else's work in progress: ignore it, but
  your file must have none.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. Every random number comes from
  the `rng: Rng` passed in (createRng in src/sim/rng.ts: next(), int(min,max) inclusive, range, chance(p), pick,
  weighted(items, weightFn), round(x) stochastic rounding). Iterate arrays in index order so the sim is deterministic.

## Goal
NPC gnomes in the headless sim live as organisms: they get hungry, thirsty and cold, eat, drink, forage, scavenge, travel
between regions, hide, trade, and die of Hatless, hunger, thirst, cold, falls, other gnomes and the moss.

## Read first
- games/dayg/src/sim/types.ts: Npc, NpcTraits, NpcNeeds, NpcAction, WorldState, Tuning (the `npc` and `infection` sections), SimEvent, Resource, RESOURCES, DeathCause.
- games/dayg/src/sim/world.ts: killNpc(w, npc, cause, rng) (handles group removal, body loot, rising, ledger, events: always use it to kill), npcsIn(w, r), dayOf, hourOf, emptyResources.
- games/dayg/src/sim/regions.ts: REGIONS (traits, water, forage, startNpcs), graph neighbours (w.graph.neighbours[r]: { to, cost, climb }[]).
- games/dayg/src/sim/tuning.json: the `npc` and `infection` numbers.
- docs/design/dayg/society.md, sections "The NPC" and "Deciding: utility with self-preservation on top" (read only those).

## Change
- games/dayg/src/sim/npcs.ts: replace the stub bodies of `spawnNpcs` and `stepNpcs`. Keep the exported signatures.

## Contract
Exports (unchanged signatures):
  export function spawnNpcs(w: WorldState, rng: Rng): void;
  export function stepNpcs(w: WorldState, rng: Rng): void;

You may import and call these (other workers are filling them in; their signatures are final):
  import { groupOf, groupSafety } from './groups';            // groupOf(w, npc): Group | null; groupSafety(w, npc): number 0..0.75
  import { hatlessThreat, addNoise } from './horde';          // hatlessThreat(w, r): number (about 1 = normal danger); addNoise(w, r, amount)
  import { takeLoot, forage } from './loot';                  // takeLoot(w, r, res, want, rng): number units taken (moves region stock; you add them to npc.carried); forage(w, r, want, rng): number food units (ledger.foraged is updated by forage)
  import { marketBuy, marketSell, priceOf } from './market';  // marketBuy(w, npc, res, units): number bought (moves acorns and stock); marketSell likewise; priceOf(w, res)
  import { isNight } from './weather';                        // isNight(hourOfDay, tuning)
  import { makeName } from './names';                         // makeName(rng): string
  import { killNpc, npcsIn, hourOf, emptyResources } from './world';

spawnNpcs: for each region in w.graph.regions (array order), n = rng.int(startNpcs[0], startNpcs[1]); push Npc with
  id = w.npcs.length, name = makeName(rng), lookSeed = rng.int(0, 2 ** 31 - 1), traits each rng.next(), needs all
  rng.int(70, 100), carried = emptyResources() with food = rng.int(...t.npc.carriedFoodStart), acorns = rng.int(...t.npc.acornsStart),
  groupId null, plan { action: 'rest', target: null, since: w.tick }, infectedAt null, zero counters, bornTick w.tick,
  diedTick null, cause null.

stepNpcs, per alive NPC in id order (one tick = 24 / t.clock.ticksPerDay sun-hours; per-day rates are divided by ticksPerDay):
1. Needs: food -= foodPerDay/tpd; water -= waterPerDay/tpd; warmth falls by warmthPerDayCold/tpd when w.weather.tempC < 5
   or the weather is 'storm' or 'frost' and the region is not HAVEN, otherwise warmth rises by the same rate; calm falls
   when hatlessThreat > 1.5, rises otherwise. Clamp 0..100. Track zeroFoodTicks / zeroWaterTicks (reset when > 0).
2. Eat if food < eatBelow and carried.food >= 1: carried.food -= 1, w.ledger.consumed.food += 1, food += mealValue.
   Drink if water < drinkBelow and the region has `water` (clean or dirty) or carried.water >= 1 (then consume 1 water
   unit into ledger.consumed.water): water += drinkValue.
3. Decide (if not in a group, or if this NPC is its group's leader): score these actions and pick the best that passes
   the self-preservation filter. risk(action, region) = t.npc.hatlessKill x hatlessThreat(w, region) x exposure[action]
   x (night && region not HIGH/HAVEN ? nightRisk : 1) x (1 - groupSafety(w, npc)). Drop actions with
   risk > riskLimitBase + riskLimitBoldness x boldness. Score = need relief x urgency + trait bonus - risk x 1000 x (1 - boldness):
   - 'drink' / travel toward the nearest region with water when water < 40 (urgency (100 - water)/100).
   - 'forage': food relief; forage(w, region, t.npc.forageTake, rng) adds to carried.food (industry bonus).
   - 'scavenge': takeLoot for food (if carried.food < 3) or another resource the NPC lacks; amount t.npc.scavengePerTick
     rounded with rng.round; respects carryMax total carried units (greed bonus).
   - 'travel': move to the neighbour (w.graph.neighbours) with the best expected loot share
     (sum of w.loot[to] / max(1, sum of w.regionLootStart[to])) minus its threat, plus t.npc.travelBias x boldness; climb
     edges only if boldness > 0.5. A move costs nothing else; set plan.target.
   - 'hide': only in HIGH or HAVEN regions or next to one (travel there), when threat > 1.
   - 'trade': only in w.market.region: buy food when carried.food == 0 and acorns >= priceOf(food); sell carried tools,
     materials or valuables above 2 units each.
   - 'rest': default, at night.
   Set npc.plan = { action, target, since: w.tick when the action changed }.
4. Group members (groupOf(w, npc) and not the leader) do not decide: they copy the leader's region at the end of the
   tick and do 'forage' or 'scavenge' in it.
5. Dangers, each a roll per tick (cause in brackets), using killNpc(w, npc, cause, rng):
   [hatless] rng.chance(risk of the chosen action); [hunger] zeroFoodTicks > starveDays x tpd; [thirst] zeroWaterTicks >
   thirstDays x tpd; [cold] warmth == 0 and rng.chance(coldKill); [fall] region HIGH and rng.chance(fallKill);
   [gnome] food < 20 and greed > 0.7 and another alive NPC in the region and rng.chance(fightChance): the victim (a random
   other NPC in the region) dies with cause 'gnome' and the attacker takes half its carried food first.
   [moss] if not killed by Hatless this tick: rng.chance(scratchChance x hatlessThreat) sets infectedAt = w.tick (event
   'npc-infected'); an infected NPC whose sun-hours since infectedAt (ticks x 24 / tpd) >= t.infection.turnHours dies
   with cause 'moss'. An infected NPC in a HAVEN region with carried.medicine >= 1 before t.infection.stage1Hours
   consumes 1 medicine (ledger.consumed) and is cured with rng.chance(t.npc.cureChance) (event 'npc-cured', infectedAt = null).
6. Noise: addNoise(w, region, 1) for an NPC that scavenged or fought this tick.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in games/dayg/src/sim/npcs.ts.
- `npm run sim -w games/dayg -- --seeds 3 --days 20` runs without throwing and shows `alive` below the start for at
  least one seed (other systems may still be stubs; with stubs Hatless deaths may be rare: that is fine).
- No `Math.random` or `Date` in npcs.ts (`grep -n "Math.random\|Date" games/dayg/src/sim/npcs.ts` prints nothing).

## Out of scope
Every other file under games/dayg/src/sim (groups.ts, horde.ts, loot.ts, market.ts, weather.ts, chronicle.ts, names.ts,
world.ts, types.ts, tuning.json are owned by other workers or the planner). Do not change tuning.json; if a number seems
wrong, say so in your report.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.2 Groups)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files of games/dayg and packages/prefabs at the same time. Edit only the file
  under Change. Errors from tsc in files you do not own are other workers' work in progress: ignore them.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. All randomness from the `rng: Rng`
  passed in (next, int, range, chance, pick, weighted, round). Iterate in index order.

## Goal
NPCs in the same region form packs and bands when being together pays, leave when it stops paying, and big groups split
(fission), following the aggregate rules of the design.

## Read first
- games/dayg/src/sim/types.ts: Group, Npc, WorldState, Tuning['groups'], SimEvent ('group-formed', 'group-split', 'group-dissolved').
- games/dayg/src/sim/world.ts: npcsIn(w, r), endOfDay(w), killNpc (already removes dead members from groups; you never need to).
- docs/design/dayg/society.md, sections "Why gnomes group up" and "At L2: the aggregate rules" (the V(n) formula, joining, leaving, fission, packs below three).
- games/dayg/src/sim/tuning.json: the `groups` section.

## Change
- games/dayg/src/sim/groups.ts: replace the stub bodies of stepGroups, groupSafety, groupOf. Keep the signatures.

## Contract
  export function stepGroups(w: WorldState, rng: Rng): void;
  export function groupSafety(w: WorldState, npc: Npc): number;   // 0 when alone; else t.maxSafety x (1 - e^(-n/4)), halved for n == 2
  export function groupOf(w: WorldState, npc: Npc): Group | null; // w.groups entry whose id === npc.groupId, or null

Implementation rules (t = w.tuning.groups):
- Group value for an NPC i in a group of size n in region z:
  V_i(n) = safetyS x S_z x (1 - e^(-n/4)) [x 0.5 if n == 2] + work x min(n, roles) + belonging
           - shareF x n x (0.5 + greed) - sigma x n^0.7 x (1 + (z traits include OPEN ? 0.5 : 0))
           - strainK x max(0, n - D)^2 x (0.5 + paranoia),
  with S_z = 1 + (z has COVER or HIGH ? 0.5 : 0), belonging = 0.1 x sociability x min(n, 8), D = dunbarBase.
  V_alone = V_i(1) with the safety term 0.
- Every t.decideEvery ticks (w.tick % decideEvery === 0), in id order:
  - an alone NPC joins the group in its region with the best V_i(n+1) with probability
    sigmoid(a x (V_i(n+1) - V_alone) + b x sociability - c x paranoia) - 0.5 (clamped at 0); if there is no group but
    another alone NPC in the region, the two may form a new group the same way (n = 2). New group: id = w.nextId.group++,
    name = `the ${surname} pack` where surname is the last word of the founder's name, leader = the member with the
    highest boldness, region = the region, formedTick = w.tick; push event 'group-formed' (size).
  - a member leaves with probability sigmoid(a x (V_alone - V_i(n)) - d x 0.5) - 0.5 (clamped at 0).
  - members whose region differs from the leader's (should not happen) are moved to the leader's region.
- Once per world-day (endOfDay(w)): a group with n > D splits with probability fissionQ x (n - D) / n: the most
  ambitious-looking member (highest boldness among non-leaders) leads a new group that takes half the members
  (alternate in id order); event 'group-split'. Groups under 2 members are removed (event 'group-dissolved'), their
  last member's groupId = null. Group names past 8 members say `band`, past 25 `settlement`.
- Keep npc.groupId and group.members consistent at all times.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in groups.ts.
- `npm run sim -w games/dayg -- --seeds 3 --days 20` runs; its `groups` column is above 0 for every seed.
- No Math.random or Date in groups.ts.

## Out of scope
npcs.ts, horde.ts, loot.ts, market.ts, weather.ts, chronicle.ts, names.ts, world.ts, types.ts, tuning.json and every file
outside games/dayg/src/sim/groups.ts.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.3 Horde field)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time. Edit only the file under Change; ignore tsc errors in
  files you do not own.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. All randomness from `rng`.
  Hatless counts are INTEGERS: use rng.round(x) for every fractional flow so totals stay exact.

## Goal
The Hatless exist in the sim as a density field over the 12 regions plus herd tokens: they flow toward warmth, noise and
gnome scent, spread by diffusion, gather in NEST regions, fall into and stay in PIT regions, form and merge herds, and
slowly crumble.

## Read first
- games/dayg/src/sim/types.ts: HordeState, Herd, WorldState (promoted, ledger, nextId.herd), Tuning['horde'], SimEvent ('herd-formed', 'herd-moved').
- games/dayg/src/sim/world.ts: npcsIn, endOfDay, hatlessTotal (sum density + herds + promoted.hatless).
- games/dayg/src/sim/regions.ts: REGIONS (traits, rect, startHatless), rectArea(rect), w.graph.neighbours.
- docs/design/dayg/hatless.md, section "The horde as a field (L1 and L2)" only.
- games/dayg/src/sim/tuning.json: the `horde` section.

## Change
- games/dayg/src/sim/horde.ts: replace the stub bodies. Keep the signatures.

## Contract
  export function seedHorde(w: WorldState, rng: Rng): void;   // density[r] = rng.int(startHatless...) for every region; herds []; noise 0
  export function stepHorde(w: WorldState, rng: Rng): void;
  export function hatlessInRegion(w: WorldState, r: RegionId): number;  // density[r] + sizes of herds in r (+ w.promoted.hatless if r is promoted)
  export function hatlessThreat(w: WorldState, r: RegionId): number;    // hatlessInRegion / (rectArea / 10000) / t.threatNorm; HAVEN regions x 0.1; HIGH x 0.3
  export function addNoise(w: WorldState, r: RegionId, amount: number): void; // w.horde.noise[r] += amount

stepHorde, every tick (t = w.tuning.horde):
1. Skip the promoted region entirely (w.promoted.region): nothing flows out of it; arrivals into it are added to
   density[promoted] as usual (the game picks them up).
2. Potential P[r] = warmWeight x (WARM ? 1 : 0) + scentWeight x npcsIn(w, r).length + noiseWeight x noise[r]
   + (NEST ? nestWeight : 0) + (PIT ? pitWeight : 0) - (HAVEN ? havenRepel : 0) - (HIGH ? havenRepel : 0).
3. Flow, computed from a snapshot of density (so order does not matter) and applied after: for each region r and
   neighbour s (w.graph.neighbours[r], skip climb edges: Hatless cannot climb), out = density[r] x (flowRate x max(0,
   P[s] - P[r]) / (1 + |P[s] - P[r]|) + diffusion / degree(r)); from PIT regions multiply by pitEscape; amount =
   rng.round(out), never more than what is left in r. Iterate regions and neighbours in array order.
4. noise[r] *= (1 - noiseDecay).
5. Herds: when density[r] > herdThreshold (not promoted, not PIT), split a herd of size rng.round(density[r] x herdShare)
   (at least herdMin) with target = the neighbour (no climb edge) with the highest P; id = w.nextId.herd++; event
   'herd-formed'. Every herdMoveTicks ticks since movedTick a herd moves one edge to its target (event 'herd-moved'),
   then picks a new target the same way; a herd that enters a PIT or NEST region, or whose size < herdMin, dissolves into
   density. Two herds in the same region merge (the older id stays).
6. Once per world-day (endOfDay(w)), crumbling: per region capacity = capacityPerKm2 x rectArea / 1e6; crumble =
   rng.round(density[r] x crumblePerDay x (density[r] > capacity ? overCapacityMul : 1)); density[r] -= crumble;
   w.ledger.hatlessCrumbled += crumble. Herds crumble the same way on their size.
7. hatlessTotal(w) must change only by what you add to ledger.hatlessCrumbled (and what killNpc adds via hatlessRisen):
   never create or lose Hatless anywhere else.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in horde.ts.
- `npm run sim -w games/dayg -- --seeds 3 --days 20` runs; `hatless` is close to the start (within about 30%).
- Write a throwaway check in your scratch dir or as a temporary vitest file and delete it afterwards: after
  createWorld(1) and 240 stepWorld ticks (import from games/dayg/src/sim/world.ts and rng.ts), hatlessTotal(w) ===
  ledger.hatlessStart + ledger.hatlessRisen - ledger.hatlessCrumbled - ledger.hatlessDestroyed. Leave no test file behind.
- No Math.random or Date in horde.ts.

## Out of scope
npcs.ts, groups.ts, loot.ts, market.ts, weather.ts, chronicle.ts, names.ts, world.ts, types.ts, tuning.json.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.4 Loot budget and containers)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time (one is writing games/dayg/src/world/blockout.ts, the
  map whose `containers` you receive). Edit only the file under Change; ignore tsc errors in files you do not own.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. All randomness from `rng`.
  Resource amounts are integer units: 1 item = 1 unit of its ItemDef.resource.

## Goal
The world holds a fixed, non-renewing budget of food, water, medicine, fuel, tools, materials and valuables, spread over
the regions by loot tier; NPC scavenging and the player's containers both draw from it; only foraging adds food back.

## Read first
- games/dayg/src/sim/types.ts: WorldState (loot, regionLootStart, forage, containers, ledger), ContainerDef,
  ContainerState, ContainerType, ItemStack, Resource, RESOURCES, Tuning['loot'].
- games/dayg/src/items/defs.ts: ITEM_LIST, ITEMS, getItem, itemsWith(resource) (every item has a resource).
- games/dayg/src/sim/world.ts: emptyResources, endOfDay, resourceTotals (what conservation counts).
- docs/design/dayg/loot.md, sections "Containers", "Tables" and "The loot budget".
- games/dayg/src/sim/regions.ts: REGIONS (lootTier, traits, forage, rect), rectArea.

## Change
- games/dayg/src/sim/loot.ts: replace the stub bodies. Keep the signatures. Put the container tables in this file.

## Contract
  export function initLoot(w: WorldState, rng: Rng, containers: readonly ContainerDef[]): void;
  export function dailyForage(w: WorldState, rng: Rng): void;
  export function takeLoot(w: WorldState, r: RegionId, res: Resource, want: number, rng: Rng): number;
  export function forage(w: WorldState, r: RegionId, want: number, rng: Rng): number;
  export function rollContainer(w: WorldState, id: string, rng: Rng): ItemStack[];
  export const CONTAINER_TABLES: Record<ContainerType, { rolls: [number, number]; empty: number; entries: { res: Resource; weight: number; items: string[] }[] }>;

initLoot (called after spawnNpcs, so w.npcs is filled): budget[res] = round(t.loot.perGnome[res] x number of NPCs).
  Share it over regions by weight = tierWeight[lootTier] x rectArea / 10000 x (NEST ? nestMul : 1) x (HAVEN ? havenMul : 1);
  use whole units (largest-remainder rounding, deterministic). w.loot[r][res] = share; w.forage[r] = region.forage x
  t.loot.foragePerDay. Containers: w.containers[id] = { id, region, type, opened: false, contents: one stack per
  guaranteed item (condition 1) }; each guaranteed item's unit is subtracted from w.loot[region][its resource] (not below
  0). Then w.regionLootStart = a deep copy of w.loot. (createWorld computes ledger.lootStart afterwards.)
dailyForage: w.forage[r] = min(region.forage x foragePerDay x forageCapDays, w.forage[r] + region.forage x foragePerDay).
takeLoot (NPC scavenging): stock = w.loot[r][res]; share = stock / max(1, w.regionLootStart[r][res]);
  got = min(stock, rng.round(want x min(1, 0.25 + share))); w.loot[r][res] -= got; return got. (The caller adds it to
  npc.carried, so totals are unchanged.)
forage: got = min(floor(w.forage[r]), rng.round(want)); w.forage[r] -= got; w.ledger.foraged.food += got; return got.
rollContainer (the game calls this when the player opens a container): if already opened return its contents (the same
  array object). Else: table = CONTAINER_TABLES[type]; regionShare = sum over res of w.loot[region][res] / max(1, sum of
  regionLootStart[region]); empty chance = 1 - (1 - table.empty) x min(1, regionShare + 0.2); if not empty, rolls =
  rng.int(...table.rolls); each roll picks an entry by weight among entries whose res has w.loot[region][res] >= 1, then
  an item id from entry.items (rng.pick), moves 1 unit (w.loot[region][res] -= 1) and adds 1 to a stack of that id
  (merge stacks, condition rng.range(0.4, 1)). opened = true; return contents.
CONTAINER_TABLES (weights are first drafts):
  vase: rolls [0,2], empty 0.3: medicine 20 [salt-pinch], water 20 [spigot-water], fuel 25 [candle], valuables 5 [button].
  bin: rolls [1,4], empty 0.15: food 50 [crab-apple, bread-loaf, cheese-wedge, blackberry], materials 20 [spider-silk, stone-chunk], tools 10 [tin-pail, clay-jar].
  grave-goods: rolls [0,3], empty 0.4: fuel 25 [candle], food 15 [blackberry, crab-apple], valuables 10 [button, gold-coins], medicine 5 [salt-pinch].
  crate: rolls [1,3], empty 0.35: tools 30 [old-trowel, hand-fork, rope-coil, tin-pail], materials 30 [stone-chunk, clay-chunk, spider-silk], fuel 20 [twig-bundle, timber-log].
  sack: rolls [1,3], empty 0.3: food 40 [bread-loaf, seed-cake, red-mushroom], materials 20 [spider-silk, clay-chunk], fuel 15 [twig-bundle].
  chest: rolls [1,4], empty 0.25: tools 25 [thorn-dagger, acorn-club, flint-striker, torch], medicine 20 [glaze-pot, slug-slime, stout-tankard, salt-pinch], valuables 15 [gold-coins, button], food 20 [cheese-wedge, seed-cake].
  camp-cache: rolls [2,5], empty 0.2: food 30 [seed-cake, bread-loaf], medicine 15 [salt-pinch, slug-slime, stout-tankard], tools 25 [rope-coil, ladder, thorn-dagger, flint-striker], fuel 10 [twig-bundle, candle], materials 5 [wool-scarf].
  body: rolls [0,2], empty 0.5: food 30 [bread-loaf], tools 20 [old-trowel], medicine 10 [salt-pinch].
  (wool-scarf's resource is 'materials'; every id above exists in ITEMS: check each with getItem.)

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in loot.ts.
- `npm run sim -w games/dayg -- --seeds 3 --days 20` runs and `food left` is below 1.00 by day 20.
- A throwaway check (delete it afterwards): createWorld(3); for every container id call rollContainer twice: the second
  call returns the same contents; resourceTotals(w) is unchanged by rolling.
- No Math.random or Date in loot.ts.

## Out of scope
npcs.ts, groups.ts, horde.ts, market.ts, weather.ts, chronicle.ts, names.ts, world.ts, types.ts, tuning.json,
games/dayg/src/items/defs.ts and games/dayg/src/world/*.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.5 Market)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time. Edit only the file under Change; ignore tsc errors in
  files you do not own.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. All randomness from `rng`.

## Goal
The Truce of the Tap runs one local market in the sim: prices per resource follow stock against a target, drift back
over about a day, and NPCs can buy and sell there with acorns; goods and acorns are conserved.

## Read first
- games/dayg/src/sim/types.ts: MarketState, Npc (carried, acorns), Resource, RESOURCES, Tuning['market'], SimEvent 'price-spike'.
- games/dayg/src/sim/world.ts: endOfDay(w), emptyResources().
- docs/design/dayg/economy.md, section "Markets" only.
- games/dayg/src/sim/tuning.json: the `market` section.

## Change
- games/dayg/src/sim/market.ts: replace the stub bodies. Keep the signatures.

## Contract
  export function initMarket(w: WorldState, rng: Rng): void;    // w.market = { region: t.region, stock: copy of startStock, acorns: t.acorns, price: base copy, history: [] per resource }
  export function stepMarket(w: WorldState, rng: Rng): void;
  export function priceOf(w: WorldState, res: Resource): number;  // current buy price (includes tax): price x (1 + tax)
  export function marketBuy(w: WorldState, npc: Npc, res: Resource, units: number): number;
  export function marketSell(w: WorldState, npc: Npc, res: Resource, units: number): number;

- Formula price: f = base x (target / (stock + 1))^elasticity, clamped to [clampLo x base, clampHi x base].
- stepMarket each tick: price += (f - price) x drift (memory: a crash recovers over about a day). At endOfDay push the
  price onto history[res]; if price > 2 x base and the flag `price-spike:<res>:<season-index>` is not set in w.flags,
  set it and push event { kind: 'price-spike', resource, price, ratio: price / base }.
- marketBuy: only if npc.region === w.market.region; n = min(units, stock, floor(npc.acorns / priceOf)); moves n units
  from market.stock to npc.carried and n x priceOf acorns from the NPC to market.acorns (round acorns down to whole
  acorns per unit: cost per unit = ceil(priceOf)). Returns n.
- marketSell: only in the market region; n = min(units, npc.carried[res]); pays floor(price x (1 - tax)) acorns per unit
  from market.acorns (stop when market.acorns runs out); moves the units into market.stock. Returns n.
- Acorns and units are only moved, never created: acornTotal(w) and resourceTotals(w) (in world.ts) stay constant
  through any number of trades.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in market.ts.
- `npm run sim -w games/dayg -- --seeds 3 --days 20` runs.
- A throwaway check (delete it afterwards): createWorld(5); take one NPC, set its region to 'the-tap' and acorns 50;
  marketBuy food 3 then marketSell food 2: acornTotal(w) and resourceTotals(w).food are unchanged.
- No Math.random or Date in market.ts.

## Out of scope
npcs.ts (it calls your functions), groups.ts, horde.ts, loot.ts, weather.ts, chronicle.ts, names.ts, world.ts, types.ts, tuning.json.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.6 Weather, chronicle and names)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time. Edit only the files under Change; ignore tsc errors in
  files you do not own.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. All randomness from `rng`.
- Lore rule (AGENTS.md): before writing names, search the lore: `npm run lore -- find <word>` (try `Potsworth`, `Mossgrave`,
  `Hatless`). DayG is set in `apocrypha` (docs/lore/rulings.md R-039): Mossgrave is a Tall One cemetery at gnome height;
  the Hatless are cracked gnomes a grey moss walks around; no gore (gnomes chip, crack, shatter; never bleed); the Tall
  Ones are never seen.

## Goal
The sim has seeded weather and seasons, NPCs get house-style names, and the sim writes a chronicle: one plain, dry,
past-tense line per notable event, dated "Year 1, autumn, day 4."

## Read first
- games/dayg/src/sim/types.ts: WeatherState, WeatherKind, WEATHER_KINDS, Season, SEASONS, SimEvent (all kinds), ChronicleLine, WorldState (events, chronicle, flags, npcs, groups), Tuning['clock'] and ['weather'].
- games/dayg/src/sim/world.ts: dayOf(tick, t), hourOf(tick, t).
- docs/design/dayg/history.md, section "After: the chronicle" (the example lines set the voice).
- docs/design/dayg/world.md, section "Weather, seasons".

## Change
- games/dayg/src/sim/weather.ts: initWeather, stepWeather, seasonOf, isNight.
- games/dayg/src/sim/chronicle.ts: formatDate, writeChronicle.
- games/dayg/src/sim/names.ts: makeName.

## Contract
  // weather.ts
  export function initWeather(w: WorldState, rng: Rng): void;   // kind picked by the start season's weights; tempC from tempFor()
  export function stepWeather(w: WorldState, rng: Rng): void;   // every tick
  export function seasonOf(day: number, t: Tuning): Season;     // SEASONS[(SEASONS.indexOf(startSeason) + floor((day - 1) / daysPerSeason)) % 4]
  export function isNight(hourOfDay: number, t: Tuning): boolean; // hour >= nightStartHour || hour < nightEndHour
  // chronicle.ts
  export function formatDate(tick: number, t: Tuning): string;  // `Year ${y}, ${season}, day ${dayInSeason}` with 4 seasons a year, year 1 first
  export function writeChronicle(w: WorldState, rng: Rng): void;
  // names.ts
  export function makeName(rng: Rng): string;                   // "Bramble Potsworth"

Weather (t = w.tuning.weather): each tick, with rng.chance(stayChance) keep the kind, else pick a kind by
  weights[season] (rng.weighted over WEATHER_KINDS). tempC = tempBase[season] + tempWeather[kind] - (isNight ? nightDrop : 0)
  + rng.range(-1, 1). wind 0..1 (storm 0.8-1, else 0-0.5), windDir 0..2pi drifting slowly. since = tick of the last
  change. Push event { kind: 'weather', weather } when it changes to 'storm' or 'frost'. On the first tick of a new
  season push { kind: 'season', season }.
Chronicle: writeChronicle reads w.events (this tick's) and appends { tick: w.tick, text } lines to w.chronicle. Text is
  `${formatDate(tick)}. ${sentence}` in the voice of the design ("Year 3, spring, day 9. A herd of about 600 left the
  Compost and walked south."). Region names come from w.graph.byId[r].name, NPC names from w.npcs[id].name, group names
  from w.groups. Write a line for: a group leader's death ("Thistle Stonewort of the Stonewort pack was shattered in the
  Leaning Rows."), the first death of each cause per region and season, an NPC rising as a Hatless only if it led a group,
  'group-formed' with size >= 5, 'group-split', 'herd-formed' with size >= 40 ("A herd of about 60 gathered at Bin Corner."
  sizes rounded to the nearest 10), 'herd-moved' into a region next to a HAVEN region, 'loot-low', 'price-spike', storms
  and frosts, seasons. Vary the verbs with rng.pick from 2-4 phrasings per event kind. Aim for about 1 to 3 lines per world-day.
  Also: once per region and resource, when w.loot[r].food < 5% of w.regionLootStart[r].food, push a 'loot-low' event
  yourself (guard with w.flags[`loot-low:${r}:food`]) and write "The Ivy Rows were picked clean of food."
Names: first names from plants and garden things (Bramble, Thistle, Sorrel, Nettle, Yarrow, Tansy, Burdock, Clover, Fennel,
  Sedge, Teasel, Vetch, Hazel, Rowan, Furze, Dock, Mallow, Campion, Cress, Wort; at least 30), surnames as clay and
  garden compounds (Potsworth, Stonewort, Kilnby, Glazebrook, Clayfoot, Mossbank, Shardwell, Rowkeeper, Lichendale,
  Pebblewick; at least 30). Check a few with `npm run lore -- find <name>` and avoid any name that already belongs to a
  named character in docs/lore/entries. makeName = `${rng.pick(FIRST)} ${rng.pick(LAST)}`.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in weather.ts, chronicle.ts, names.ts.
- `npm run sim -w games/dayg -- --seeds 1 --days 30 --chronicle` prints dated chronicle lines in the house style
  (other systems may still be stubs, so few events may exist: weather and season lines must appear).
- No Math.random or Date in the three files.

## Out of scope
npcs.ts, groups.ts, horde.ts, loot.ts, market.ts, world.ts, types.ts, tuning.json, cli.ts. Do not edit docs/lore.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.7 Blockout map)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time. Edit only the file under Change; ignore tsc errors in
  files you do not own.
- Rules: code over clicking (the map is data written in code); 3D rule from AGENTS.md and docs/rendering.md: boxes that
  touch must not share a face (overlap them by at least 0.1 gm and make tops differ by at least 0.1 gm).
- Units: 1 gm (gnome metre) = 1 three.js unit; a gnome is 1.7 gm tall. x grows east, z grows south (north = smaller z).

## Goal
One hand-authored blockout of the Lychgate, the Old Rows and the Tap exists as data: blocks with heights (headstone
rows, kerbs, the lychgate gatehouse, bins, angels, hedges, the Tap platform), pits, climb routes, paths, havens, water
sources, spots for Hatless and NPCs, prop dressing from @lawn/prefabs, and loot containers, all inside the sim's 12
region rectangles.

## Read first
- games/dayg/src/world/types.ts: BlockoutMap and every type in it (BlockDef, ClimbRouteDef, PitDef, SpotDef, HavenDef, WaterDef, PathDef, PropDef, Side).
- games/dayg/src/sim/regions.ts: REGIONS (rects, traits), MAP_OUTLINE.
- games/dayg/src/sim/types.ts: ContainerDef, ContainerType.
- docs/design/dayg/regions.md, sections "1. The Lychgate", "2. The Old Rows" and "8. The Yew Walk and the Tap" (the Tap row only).
- docs/design/dayg/world.md, section "Scale" (sizes: kerb 1.6, upright headstone 9-13, obelisk 33, open grave 20 deep).

## Change
- games/dayg/src/world/blockout.ts: export `const MAP: BlockoutMap` built by small layout helpers in the same file
  (for example `headstoneRow(prefix, x0, z, count, spacing, opts)`, `kerbPlot(...)`). Replace the stub content but keep
  its fixed pieces listed below exactly.

## Contract
export const MAP: BlockoutMap;   // bounds { x0: 0, x1: 560, z0: 0, z1: 520 }

Fixed pieces (exact, other workers rely on them):
- Gatehouse (the lychgate, Waystation haven on its top):
  { id: 'gatehouse-w', kind: 'gatehouse', x0: 280, x1: 305, z0: 466, z1: 494, y: 0, h: 18 },
  { id: 'gatehouse-e', kind: 'gatehouse', x0: 335, x1: 360, z0: 466, z1: 494, y: 0, h: 18 },
  { id: 'gate-roof',  kind: 'roof',      x0: 304, x1: 336, z0: 465.9, z1: 494.1, y: 16, h: 2.15 }  // overlaps the gatehouses, top 18.15
  The passage under the roof (x 305-335) is open at ground level: the only way between forecourt and verge path.
  Route { id: 'r-waystation-ladder', block: 'gatehouse-w', side: 'n', kind: 'ladder', at: 12 } (a fixed ladder from the forecourt).
  Haven { id: 'waystation', name: 'Lychgate Waystation', region: 'gate-roof', rect: { x0: 280, x1: 360, z0: 466, z1: 494 }, minY: 17.5 }.
  playerSpawn { x: 292, y: 18, z: 482 } (on gatehouse-w). Spots: { id: 'fire-waystation', kind: 'fire', region: 'gate-roof', x: 348, y: 18, z: 474 },
  { id: 'bed-waystation', kind: 'bed', region: 'gate-roof', x: 350, y: 18, z: 488 }.
  Water { id: 'w-rain-waystation', kind: 'rain-catcher', clean: true, x: 286, y: 18, z: 470 }.
- Railing between forecourt and verge path: wall blocks along z 478-482, h 6, x 200-280 and x 360-440 (they overlap the
  gatehouses by 0.5), plus a railing along x 438-442, z 480-520, h 6 (verge path to bin corner is closed).
- Tap platform (the Tap haven): { id: 'tap-platform', kind: 'plinth', x0: 360, x1: 400, z0: 20, z1: 60, y: 0, h: 15 },
  standpipe { id: 'standpipe', kind: 'standpipe', x0: 378, x1: 382, z0: 38, z1: 42, y: 14.9, h: 20 }.
  Route { id: 'r-tap-ladder', block: 'tap-platform', side: 's', kind: 'ladder', at: 20 }.
  Haven { id: 'tap', name: 'The Tap', region: 'the-tap', rect: { x0: 360, x1: 400, z0: 20, z1: 60 }, minY: 14.5 }.
  Water { id: 'w-standpipe', kind: 'standpipe', clean: true, x: 380, y: 15, z: 44 } and a dirty puddle
  { id: 'w-puddle-tap', kind: 'puddle', clean: false, x: 372, y: 0, z: 80 }.
- Boundary hedges outside MAP_OUTLINE (0,0)-(440,0)-(440,400)-(560,400)-(560,520)-(200,520)-(200,400)-(0,400): one
  'hedge' block per outline segment, 4 thick, outside the outline, h 30, each extended 4 past its ends so corners overlap.
- Guaranteed containers: { id: 'c-forecourt-rope', type: 'crate', region: 'forecourt', x: 248, y: 0, z: 452, guaranteed: ['rope-coil'] },
  { id: 'c-waystation-sack', type: 'sack', region: 'gate-roof', x: 300, y: 18, z: 488, guaranteed: ['twig-bundle', 'twig-bundle', 'crab-apple'] },
  { id: 'c-yew-cache', type: 'camp-cache', region: 'yew-edge', x: 300, y: 0, z: 30, guaranteed: ['ladder'] }.

Free design inside these rules (follow regions.md for character):
- Ivy Rows (x 0-160, z 240-400) and Leaning Rows (x 160-320, z 240-400): headstone rows running east-west, rows about 16
  gm apart, stones 6 wide (x), 1.5 deep (z), 9-13 tall, 9-10 gm apart along the row (vary with a deterministic
  pattern, no random), with 1.6-tall grave kerbs (kind 'kerb', 0.6 thick) framing some plots in front of the stones.
  Leaning Rows tighter (rows 13 apart, stones 7 gm apart) and taller (11-13). Fixed climb routes: an 'ivy' route on the
  south face of about 1 stone in 4 in the Ivy Rows, a 'letters' route on about 1 stone in 6 in the Leaning Rows; every
  other headstone needs a rope (up to 15 gm) or a ladder (up to 10 gm).
- The Sinks (x 0-120, z 120-240): five pits (PitDef), 14-24 gm across, depth 10-20, separated by ground at least 6 gm wide.
  Put one 'rope' route on a pit wall (block = the pit id, side = the wall) so a careful player can get out of one pit.
- Angel Square (x 120-240, z 120-240): four 'angel' blocks 8x8x30 around a sundial 'plinth' 6x6x3 at the centre, each
  angel on a 'plinth' 12x12x4 (angel overlaps it by 0.1 in y); 'letters' routes on two plinths.
- Mason's Corner (x 240-320, z 120-240): a broken 'stone' 20x6x8, a chisel 'beam' 40x3x3 lying east-west, scattered
  'stone' chips 2-4 gm.
- Child Graves (x 0-160, z 0-120): small headstones 3 wide, 1 deep, 3-5 tall in rows with kerbs.
- Yew Edge (x 160-320, z 0-120): two 'hedge' masses (the yews) 40-60 gm wide, h 40, leaving a 20 gm gap (CHOKE) on the
  gravel path between the Old Rows and the Tap.
- Forecourt (x 200-440, z 400-480): open gravel, a few benches as props; Bin Corner (x 440-560, z 400-520): three
  'bin' blocks 10x10x12 (Tall One wheelie bins: towers) and a low spilled 'stone' heap.
- The Tap region (x 320-440, z 0-400): a gravel avenue (PathDef 'gravel', width 10) from (380, 400) north to (380, 62).
- Paths: gravel from (320, 520) through the gate (320, 470) to (320, 400); grass aisles between headstone rows.
- Spots per region: at least 6 'hatless' spots on the ground (y = 0, or y = -depth inside pits for the Sinks), spread
  out, never inside a block; at least 3 'npc' spots on block tops (y = the block's top) or in the havens; gate-roof
  gets 4 npc spots on the gatehouse tops and none for Hatless.
- Containers: 3-5 per region (2 for gate-roof and verge-path), ids `c-<region>-<n>`, types by region: bins in Bin Corner,
  vases and grave-goods in the rows and Child Graves, crates and chests in Mason's Corner and the Forecourt, a body at
  the bottom of one Sink pit (y = -depth), camp-caches on block tops in the Leaning Rows and Angel Square. Containers sit
  on the ground or on a block top, never inside a block.
- Props (PropDef, prefab ids that exist in @lawn/prefabs): 'gravestone', 'flower-pot', 'candle', 'bench', 'signpost',
  'garden-rock', 'tree-stump', 'flowering-bush', 'giant-flower', 'picket-fence', 'wheelbarrow', 'gnome-statue',
  'bedroll' (on the Waystation at the bed spot), 'campfire' (NOT here: the camp system builds fires). 60-150 props in total.
- Every block, container, spot and water source lies inside MAP_OUTLINE, and every container/spot lies inside the rect
  of the region it names (use the REGIONS rects; gate-roof's rect wins where it overlaps forecourt and verge-path).
- Export a self-check `export function checkMap(map: BlockoutMap): string[]` returning a list of problems (empty =
  fine): duplicate ids, containers or spots outside their region rect, routes naming a missing block or pit, spots inside
  a block footprint below its top.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in blockout.ts.
- A throwaway script prints `checkMap(MAP)` as an empty list and the counts of blocks, routes, pits, spots, containers,
  props (for example `npx vitest run` on a temporary test file you delete afterwards, or esbuild + node). Leave no extra file behind.

## Out of scope
games/dayg/src/world/types.ts and collide.ts, everything under games/dayg/src/sim, games/dayg/src/scene. Do not add region
ids or change REGIONS.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.8 Collider)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest 5 for tests). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Eight other workers are editing other files at the same time (one is writing games/dayg/src/world/blockout.ts). Edit
  only the files under Change; ignore tsc errors in files you do not own. Your test must build its own small map and
  must not import blockout.ts.
- collide.ts is pure: no DOM, no three.js import (take plain { x, y, z } objects; THREE.Vector3 satisfies that).

## Goal
A fast collision and height query over the blockout: ground height under a point (block tops and pits), sliding movement
of an upright cylinder against blocks with step-up, the block face in front of a gnome (for vaulting and climbing, with
its routes), the region and haven at a point, and routes placed at runtime.

## Read first
- games/dayg/src/world/types.ts: BlockoutMap, BlockDef, PitDef, ClimbRouteDef, HavenDef, Side (n = face at z0, s = z1, w = x0, e = x1).
- games/dayg/src/world/collide.ts: the stub (keep its exported names and the Collider interface).
- games/dayg/src/sim/regions.ts: regionAt(x, z) (use it for regionAt), MAP_OUTLINE.
- games/dayg/src/config.ts: STEP_UP 0.5, PLAYER_RADIUS, PLAYER_HEIGHT.

## Change
- games/dayg/src/world/collide.ts: implement createCollider.
- games/dayg/src/world/collide.test.ts (new): vitest tests on a hand-built map.

## Contract
export interface Vec3 { x: number; y: number; z: number }
export interface FaceHit { id: string; kind: 'block' | 'pit'; side: Side; topY: number; baseY: number; distance: number; along: number; routes: ClimbRouteDef[] }
export interface Collider {
  /** Highest walkable surface under (x, z) that is at or below fromY + STEP_UP: block tops, else the base ground (pit floor -depth or 0). */
  groundAt(x: number, z: number, fromY: number): number;
  /** Base ground with no blocks: -depth inside a pit, else 0. */
  baseAt(x: number, z: number): number;
  /** Moves an upright cylinder at pos by (dx, dz) with sliding (try full move, then x only, then z only), in sub-steps of at most 0.25 gm.
      A position is blocked when it overlaps (circle vs rectangle in xz) a block whose top > pos.y + stepUp and whose bottom < pos.y + height,
      or when baseAt there > pos.y + stepUp (a pit wall seen from inside), or when it is outside MAP_OUTLINE.
      Writes the result into out (x, z only; y unchanged) and returns the id of the first thing it pushed against, or null. */
  move(pos: Vec3, dx: number, dz: number, radius: number, height: number, stepUp: number, out: Vec3): string | null;
  /** The nearest block face (or pit wall, when standing in a pit) crossed by a ray from (x, z) along facing (sin f, cos f) within reach,
      whose top is above y + stepUp and whose bottom is at or below y + 1. along = metres along the face (from its west end for n/s faces,
      north end for e/w faces) where the ray hits; routes = the fixed and placed routes on that face with |route.at - along| <= tolerance. */
  faceAhead(x: number, y: number, z: number, facing: number, reach: number, stepUp: number, tolerance: number): FaceHit | null;
  /** The face behind the edge the player stands at: when the player is on a block top within `reach` of one of its sides, facing outwards
      (within 60 degrees), returns that side of the block with routes (used to climb down). Null otherwise. */
  edgeAhead(x: number, y: number, z: number, facing: number, reach: number, tolerance: number): FaceHit | null;
  regionAt(x: number, z: number): RegionId | null;
  havenAt(x: number, y: number, z: number): HavenId | null;   // inside a haven rect with y >= minY
  inBounds(x: number, z: number): boolean;                    // inside MAP_OUTLINE
  addRoute(route: ClimbRouteDef): void;
  routesOn(id: string, side: Side): ClimbRouteDef[];
  blockById(id: string): BlockDef | undefined;
}
export function createCollider(map: BlockoutMap): Collider;

Implementation notes: index blocks in a uniform grid of 16 gm cells (a block goes in every cell its footprint touches);
queries look only at the cells they touch. Pits: inside a pit rect baseAt = -depth. MAP_OUTLINE inside test: point in
polygon (even-odd) or the union of REGIONS rects (same area). faceAhead for a pit wall: when baseAt(x, z) < 0 and the
ray leaves the pit rect within reach, return kind 'pit', id = pit id, topY 0, baseY -depth.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in collide.ts and collide.test.ts.
- `npm test -w games/dayg -- src/world/collide.test.ts` passes, with tests for: groundAt on a block top, under a roof
  (a block from y 16: groundAt at fromY 0 is 0), in a pit; move stops at a wall, slides along it, steps up a 0.4 gm
  kerb but not a 1.6 gm one, cannot leave a pit, cannot leave MAP_OUTLINE; faceAhead finds the right side, topY and a
  route within tolerance and ignores one outside it; edgeAhead on a block top; havenAt respects minY; addRoute shows up
  in routesOn and faceAhead.

## Out of scope
games/dayg/src/world/types.ts, blockout.ts, everything under games/dayg/src/sim, src/scene, src/game.
~~~~

~~~~text
Epic: 1 Sim systems, blockout data, collider, prefabs (issue 1.9 DayG prefabs)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run
  `npm install`, `git commit` or `git stash`.
- Other workers are editing games/dayg at the same time. You edit only the two prefab files under Change.
- Prefab rules: docs/roadmaps/prefab-library/_common.md (ignore its "Environment" section: the working directory is the
  repo above). Read it fully; it is the contract for modelling, data and examine text. Ignore its "Out of scope" ban on
  catalog/index.ts: this issue must register the new file there.

## Goal
Eight prefabs DayG needs exist in @lawn/prefabs: a ladder, a rope coil, a rain catcher, a flint striker, a moss clump,
a grave lantern, a funeral ribbon and a standpipe.

## Read first
- docs/roadmaps/prefab-library/_common.md: modelling rules, data rules, examine voice, checks.
- packages/prefabs/src/types.ts: PrefabDef, Part, shapes, Category, Use, `wear` and `grip`.
- packages/prefabs/src/palette.ts: colour names.
- packages/prefabs/src/catalog/armor.ts: `leaf-cloak` (a wear-back example with a `wear` offset) and one held item with `grip`.
- packages/prefabs/src/catalog/index.ts: how catalog files are registered.

## Change
- packages/prefabs/src/catalog/dayg.ts (new): `export const DAYG: readonly PrefabDef[] = [...]` with the 8 prefabs below.
- packages/prefabs/src/catalog/index.ts: `import { DAYG } from './dayg';` and append `...DAYG` at the END of CATALOG.

## Contract
Ids, categories and uses (exact):
- 'ladder': category 'tool', uses ['hold', 'place', 'craft']; a wooden ladder 1.6 tall, 0.45 wide, 6 rungs; grip on the
  lowest rung's centre. tags: ladder, wood, rungs, climb. emoji ['🪜'].
- 'rope-coil': category 'tool', uses ['hold', 'place', 'craft']; a coil of tan rope about 0.3 across (stacked rings,
  `ring` shape laid flat) with a loose end; grip on the coil. tags: rope, coil, cord, line, climb. emoji ['🪢'].
- 'rain-catcher': category 'prop', uses ['place', 'drink']; three sticks holding a sagging cloth (tint 'tint', a soft
  cloth colour) that drains into a clay jar below; about 0.8 tall. tags: rain, catcher, water, cloth, jar. emoji [].
- 'flint-striker': category 'tool', uses ['hold', 'light']; a grey flint chip and a small iron striker bar, about 0.15
  long; grip on the striker. tags: flint, striker, steel, spark, fire. emoji [].
- 'moss-clump': category 'material', uses ['hold', 'collect', 'craft']; three or four squashed grey-green balls, about
  0.2 across; grip in the middle. tags: moss, clump, grey, green, lichen. emoji [].
- 'grave-lantern': category 'tool', uses ['hold', 'light']; a small iron lantern (box frame, glass panes as a low-alpha
  or pale box, a glowing candle flame with glow: true, a bail handle on top), about 0.35 tall; grip on the handle.
  tags: lantern, grave, iron, candle, light. emoji ['🏮'].
- 'funeral-ribbon': category 'armor', uses ['wear-back']; a black ribbon tied in a big bow with two long trailing tails
  (tint part for the ribbon, default a deep purple-black), worn on the back like leaf-cloak; give it a `wear` offset
  modelled on leaf-cloak's so it sits on the gnome's back. tags: ribbon, funeral, bow, black, sash. emoji ['🎀'].
- 'standpipe': category 'prop', uses ['place', 'drink']; a grey iron pipe rising from a small square stone base, a
  cross-handle tap and a down-turned spout, about 1.0 tall. tags: standpipe, tap, pipe, spout, water, iron. emoji [].
Examine lines: 5 or 6 each in the voice of _common.md. You may lean on the cemetery a little ("the old rows", "the
stones", "the moss"), but never name or explain the Tall Ones, and no blood or gore.

## Done when
- `npx tsc --noEmit -p packages/prefabs` has no errors in dayg.ts or index.ts.
- `npm test -w packages/prefabs` passes (every test naming your ids, and the whole suite).
- `npm test -w packages/gnome` still passes (gear clearance).

## Out of scope
Every other file in packages/prefabs (types.ts, palette.ts, build.ts, registry.ts, other catalog files), anything under games/.
~~~~

### Round 2, Epic 2: sim tests and scorecard; three.js core

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.1 Sim correctness tests)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest 5). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time (none of them touches src/sim except
  cli.ts, scorecard.ts and bands.ts). Edit only the file under Change.
- You write tests only. If a test fails because of a real bug in a sim file, do not fix the sim file: mark that test
  with `it.fails(...)` plus a comment naming the file and the bug, and list it in your report.

## Goal
The headless sim has correctness tests that must always pass: determinism, conservation (gnomes, Hatless, resources,
acorns), stream isolation, the map matches the region graph, and no NPC stuck on one plan.

## Read first
- games/dayg/src/sim/world.ts: createWorld, stepWorld, runDays, hashWorld, hatlessTotal, resourceTotals, acornTotal, promoteRegion, absorbIntoPromoted, demoteRegion, recordHatlessDestroyed, recordPlayerTake.
- games/dayg/src/sim/types.ts: WorldState, Ledger, Tuning.
- games/dayg/src/sim/tuning.ts: TUNING, withOverrides(base, patch).
- games/dayg/src/sim/regions.ts: REGIONS, EDGES, MAP_OUTLINE, regionAt.
- games/dayg/src/world/blockout.ts: MAP, checkMap(map).

## Change
- games/dayg/src/sim/sim.test.ts (new).

## Contract
Tests (vitest, `import { describe, it, expect } from 'vitest'`), keep the whole file under 20 s:
1. Determinism: for seeds 1, 2, 3: two createWorld(seed) runs of 30 days (runDays) give equal hashWorld; seed 1 and
   seed 2 give different hashes.
2. Conservation, checked after every tick for 10 days and at day 30 (seeds 4 and 5):
   - alive NPCs === ledger.npcsStart - sum(ledger.deaths);
   - hatlessTotal === hatlessStart + hatlessRisen - hatlessCrumbled - hatlessDestroyed;
   - for every resource: resourceTotals === lootStart + foraged - consumed - removedByPlayer (exact integers);
   - acornTotal === ledger.acornsStart;
   - no negative density, herd size, stock, market stock or carried amount.
3. Promotion round trip: promoteRegion(w, 'ivy-rows') then 48 stepWorld ticks calling absorbIntoPromoted each tick,
   recordHatlessDestroyed 3 times, then demoteRegion(w, w.promoted.hatless): the Hatless equation of test 2 still holds
   and w.promoted.region is null.
4. Player take: rollContainer on 5 containers (import from loot.ts), recordPlayerTake for each stack, remove the stacks
   from the container contents: the resource equation still holds.
5. Stream isolation: createWorld(7) with TUNING and with withOverrides(TUNING, { market: { elasticity: { food: 0.5 } } }):
   after 30 days the sequence of weather kinds recorded every tick is identical, and the day-0 w.loot and
   w.horde.density are identical.
6. Map bake: checkMap(MAP) is empty; every EDGES pair has rects that touch or overlap; every region has >= 4 'hatless'
   spots (except gate-roof: 0) and >= 2 'npc' spots; every MAP.containers entry's (x, z) has regionAt === its region;
   both havens lie inside a region with the HAVEN trait; playerSpawn is inside the waystation haven rect.
7. No stuck NPCs: over 30 days of seed 8, no alive NPC keeps the same plan.action with plan.since older than 3 world-days
   unless the action is 'rest' or 'hide'.
8. Speed: a 60-day world (runWorld(9, 60)) finishes in under 3 s (skip with `it.skip` and a comment if the machine is slow, but report the time).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in sim.test.ts.
- `npm test -w games/dayg -- src/sim/sim.test.ts` passes (tests marked it.fails count as reported bugs).

## Out of scope
Every non-test file. Do not change tuning.json or any sim system to make a test pass.
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.2 Scorecard and CLI)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the files under Change.
- cli.ts runs in Node through games/dayg/scripts/sim.mjs (esbuild bundle) but must not import node modules: it returns
  strings; the script prints and writes them. Pure TypeScript: no DOM, no Math.random, no Date (timing is the script's job).

## Goal
`npm run sim -w games/dayg -- --seeds 50 --days 60` runs 50 worlds and prints a scorecard: every target band, the
share of seeds inside it, pass or fail, and a joint score; `--check` exits 1 on a failed band; `--chronicle` prints one
world's chronicle; rows go to sim-out/rows.jsonl.

## Read first
- games/dayg/scripts/sim.mjs: how runCli(argv, { profile }) is called and what it does with { exitCode, stdout, rows }.
- games/dayg/src/sim/cli.ts: the stub (keep runCli's signature).
- games/dayg/src/sim/world.ts: runWorld(seed, days, tuning) -> { world, rows: DailyRow[] }.
- games/dayg/src/sim/types.ts: DailyRow, Tuning. games/dayg/src/sim/tuning.ts: TUNING, withOverrides.
- docs/design/dayg/evaluation.md, sections "Metrics and target bands" (Survival, Society, Hatless, Economy) and "One joint score".

## Change
- games/dayg/src/sim/bands.ts: the band definitions.
- games/dayg/src/sim/scorecard.ts: scoring and formatting.
- games/dayg/src/sim/cli.ts: argument parsing and output.

## Contract
// bands.ts
export interface Band { id: string; label: string; lo: number; hi: number; share: number; weight: number; day: number;
                        metric: (rows: readonly DailyRow[]) => number | null } // null = not measurable (too few days)
export const BANDS: readonly Band[];
Bands (day = the last day the metric needs; skip as "n/a" when --days is smaller):
  pop-d60 'Population day 60 / start' [0.35, 0.80] share 0.90 weight 2: alive/start at day 60
  extinction 'Alive above 5% at day 60' [0.05, 1] share 0.99 weight 2
  cause-max 'No death cause above 45%' [0, 0.45] share 0.90 weight 2: max cause / total deaths at day 60 (null if no deaths)
  alone-d60 'Alone at day 60' [0.10, 0.35] share 0.85 weight 2: modes.alone / alive
  pack-d60 'Packs (2-8) at day 60' [0.25, 0.60] share 0.85 weight 2
  band-d60 'Bands and settlements (9+) at day 60' [0.05, 0.45] share 0.85 weight 2: (band + settlement) / alive
  hatless-d60 'Hatless day 60 / start' [0.5, 2.0] share 0.85 weight 1
  sinks 'Horde share in NEST/PIT, days 20-60' [0.30, 0.60] share 0.80 weight 1: mean hordeInSinks over days 20..60
  food-d20 'Food loot left day 20' [0.55, 0.75] share 0.85 weight 1: lootLeft.food at day 20
  food-d50 'Food loot left day 50' [0.15, 0.35] share 0.85 weight 1
  price-vol 'Food price volatility' [0.02, 0.10] share 0.85 weight 1: sd of ln(p[d] / p[d-1]) over days 2..60 of prices.food
  story 'Chronicle lines per day' [0.5, 4] share 0.80 weight 1: chronicleLines at the last day / days
// scorecard.ts
export interface BandResult { band: Band; values: number[]; inBand: number; measured: number; passShare: number; pass: boolean | null }
export interface Scorecard { seeds: number; days: number; results: BandResult[]; joint: number } // joint = sum(weight x pass) / sum(weight) over measured bands
export function score(runs: readonly (readonly DailyRow[])[], days: number): Scorecard;
export function formatScorecard(card: Scorecard): string; // aligned plain-text table: band, target, pass share, needed share, PASS/FAIL/n/a, median value; then "joint score 0.78"
// cli.ts
export function runCli(argv: string[], opts: { profile?: unknown }): { exitCode: number; stdout: string; rows: string };
Flags: --seeds N (default 50; seeds 1..N), --days D (default 60), --profile (opts.profile merged with withOverrides),
  --check (exitCode 1 if any measured band fails), --chronicle [seed] (print that world's chronicle lines and a one-line
  summary, no scorecard), --seed S (run only seed S and print its daily rows as a table), --json (stdout = JSON scorecard).
rows: one JSON line per world per day: {"seed":1,...DailyRow}. Header line of stdout: `DayG sim: N seeds x D days`.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in the three files.
- `npm run sim -w games/dayg -- --seeds 50 --days 60` prints the full scorecard and a joint score (bands may fail: that
  is tuning, done later). It writes games/dayg/sim-out/rows.jsonl.
- `npm run sim -w games/dayg -- --seeds 5 --days 60 --check` exits 1 when a band fails and 0 when all pass (try it with a
  profile that makes one band impossible, e.g. a temp JSON with {"npc":{"hatlessKill":0.5}}; delete the temp file).
- `npm run sim -w games/dayg -- --chronicle 3 --days 30` prints dated lines.

## Out of scope
world.ts, types.ts, tuning.json, scripts/sim.mjs and every sim system file (npcs, groups, horde, loot, market, weather, chronicle, names).
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.3 World builder)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the file under Change. Your dev
  server port is 5211: `cd games/dayg && npx vite --port 5211 --strictPort` (run in the background, stop it at the end).
- Rules (AGENTS.md, docs/rendering.md): anything flat on the ground takes a draw layer (`flatLayer(material, LAYER.x)`
  from '@lawn/depth'), boxes that touch must not share a face, CC0 or generated only, every visible prop comes from
  @lawn/prefabs (the blockout boxes, hedges, pit walls and ground are terrain built in code: allowed).
- Units: 1 gm = 1 unit; a gnome is 1.7 tall; prefabs are 1 unit = one gnome, so place them with scale 1.7 (PREFAB_SCALE).

## Goal
The blockout map is drawn: ground with holes for the pits, pit walls and floors, every block as a shaded box by kind,
paths, climb routes (ivy, carved letters, fixed ladders and ropes), prop dressing and container prefabs, cheap enough
for a phone.

## Read first
- games/dayg/src/world/types.ts and games/dayg/src/world/blockout.ts (MAP): what to draw.
- games/dayg/src/game/types.ts: the WorldView interface (root, containerObjects, addRoute(route, fromY, topY), setContainerOpened(id)).
- games/dayg/src/config.ts: COLORS, PREFAB_SCALE, CONTAINER_PREFAB.
- docs/rendering.md: the z-fighting rules and `npm run zfight`.
- packages/prefabs/README.md, section "Use it": buildPrefab(id, { scale }), buildStaticPrefabs(placements: { id, x, y, z, yaw, scale }[]) merges static props into 1-3 draw calls.

## Change
- games/dayg/src/scene/worldBuilder.ts: implement `buildWorld(scene: THREE.Scene, map: BlockoutMap): WorldView`.

## Contract
export function buildWorld(scene: THREE.Scene, map: BlockoutMap): WorldView;   // adds root to scene and returns it
- Ground: one merged geometry of 10 gm cells over MAP.bounds, skipping cells fully inside a pit and splitting the cells
  a pit edge crosses so the hole matches the pit rect exactly; material MeshLambertMaterial(COLORS.ground) with
  flatLayer(..., LAYER.ground); receives shadows. Pits: four inner wall planes and a floor at -depth (COLORS.pit).
- Blocks: group by kind; draw each kind as ONE InstancedMesh of a unit BoxGeometry (scale = size, position = centre),
  colours: headstone/kerb/angel/plinth/stone COLORS.stone (vary per instance with instanceColor between stone and
  mossStone), hedge COLORS.hedge, gatehouse/roof COLORS.wood, bin 0x3d4a3b, beam 0x9aa0a6, wall 0x2b2b2b, standpipe 0x6d7378.
  Lower every block's bottom by 0.05 below its y so no bottom face is coplanar with the ground or a block under it. Cast and receive shadows.
- Paths: flat ribbons (one quad strip per segment, width from PathDef) at y 0.02, gravel COLORS.gravel on LAYER.road,
  grass aisles a slightly lighter green on LAYER.tint. Skip path parts over pits.
- Routes in map.routes: 'ivy' = a green vertical panel 1.4 wide over the face height, 0.08 off the face, material on
  LAYER.decal; 'letters' = three dark carved rectangles stacked up the face, same offset; 'ladder' and 'rope' = like addRoute.
- addRoute(route, fromY, topY): 'ladder' = a vertical stack of buildPrefab('ladder', { scale: PREFAB_SCALE }) copies
  (each about 2.7 gm tall) from fromY to topY against the face at `at`; 'rope' = a thin brown cylinder from fromY to
  topY plus buildPrefab('rope-coil') on the top edge. Compute the face position from the block (or the pit rect for a
  pit id) and the side: n face z = z0, s face z = z1, w face x = x0, e face x = x1; `at` is measured from the face's west
  (n/s) or north (e/w) end; place the route 0.15 gm out from the face.
- Props: buildStaticPrefabs(map.props mapped to { id: prefab, x, y, z, yaw: rotY ?? 0, scale: scale ?? PREFAB_SCALE }).
- Containers: buildPrefab(CONTAINER_PREFAB[type], { scale: PREFAB_SCALE }) at each container's x, y, z, stored in
  containerObjects by id. setContainerOpened(id) tilts it 15 degrees and darkens it (clone its materials once; never
  dispose prefab meshes).
- Water: 'rain-catcher' -> buildPrefab('rain-catcher', { scale: PREFAB_SCALE }); 'standpipe' -> buildPrefab('standpipe',
  { scale: 3 }) at the standpipe water point (next to the standpipe block); 'puddle' -> a flat dark-blue disc on LAYER.area.
- Keep draw calls low: target under 80 meshes under root for the whole map (count them with root.traverse and log the
  count once with console.info).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in worldBuilder.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5211/?seed=1" game` prints SMOKE OK (no console errors).
- `npm run zfight -- "http://localhost:5211/?seed=1"` prints ZFIGHT OK (fix what it reports in your file; if a pair is
  caused by blockout data, e.g. two blocks sharing a face, list it in your report with both ids).
- A desktop screenshot (Edge headless, `--window-size=1280,720 --screenshot=...`) shows the rows, the gatehouse and the
  forecourt; read it with the Read tool and describe it in your report.

## Out of scope
games/dayg/src/main.ts (planner), src/world/blockout.ts and types.ts, src/scene/sky.ts, gnomes.ts, playerView.ts,
src/game/*, packages/*.
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.4 Sky, light and rain)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the file under Change. Your dev
  server port is 5212: `cd games/dayg && npx vite --port 5212 --strictPort` (background; stop it at the end).
- Phones: keep it cheap (one directional light with a shadow camera that follows the player, no post-processing).

## Goal
Mossgrave has a sky that follows the sun clock and the sim's weather: day and night light and fog, a moon-cold night,
fog banks, rain and storm particles around the player, and lightning flashes in storms.

## Read first
- games/dayg/src/game/types.ts: Sky { update(clock, weather, focus, dt) }, Clock (hourOfDay, night, light 0..1, season).
- games/dayg/src/sim/types.ts: WeatherState { kind, tempC, wind, windDir }.
- games/dayg/src/config.ts: COLORS (sky, nightSky, fog), SUN.
- games/dayg/src/scene/sky.ts: the stub (keep createSky's signature).

## Change
- games/dayg/src/scene/sky.ts: implement createSky.

## Contract
export function createSky(scene: THREE.Scene): Sky;
- Lights: HemisphereLight (sky/ground) and one DirectionalLight with castShadow (shadow map 1024, orthographic shadow
  camera 60x60 gm centred on `focus`, target moved with it). The sun's direction follows hourOfDay (rises east at
  nightEnd, sets west at nightStart); at night the directional light becomes a dim blue moon (intensity about 0.15).
- scene.background and scene.fog (THREE.Fog) colours blend from COLORS.sky (day) to COLORS.nightSky (night) by clock.light;
  fog far: clear 420, overcast 320, drizzle/rain 220, storm 150, fog 60; fog near = far x 0.2. Blend changes over about
  3 s so weather changes are smooth.
- Rain for drizzle, rain and storm: a THREE.Points (or LineSegments) field of about 1500 drops (600 on drizzle) in a
  60x30x60 box around focus, falling 25 gm/s, slanted by wind and windDir, recycled when below focus.y - 5; hidden
  otherwise. Frost: a slight blue tint on the hemisphere ground colour.
- Storm: random lightning flashes (a 0.1 s burst of the hemisphere intensity) about every 8-20 s. This is visuals
  only, so Math.random is fine here (it must never be used in src/sim).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in sky.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5212/?seed=1" game` prints SMOKE OK.
- Screenshots (Edge headless, 1280x720) of `?seed=1` (day) and `?seed=1&night=1` (night) look clearly different; read
  them with the Read tool and say so in your report. To see rain, set the weather in the console:
  `__dayg.sim.world.weather.kind = 'storm'` (describe what you saw).

## Out of scope
games/dayg/src/main.ts (planner), src/scene/worldBuilder.ts, gnomes.ts, playerView.ts, src/game/*, src/sim/*.
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.5 Input and camera)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the files under Change. Your dev
  server port is 5213: `cd games/dayg && npx vite --port 5213 --strictPort` (background; stop it at the end).
- Mobile rule: every action has a touch equivalent; touch controls themselves are built later in src/ui/touch.ts, which
  implements the TouchSource interface you merge in. Do not build touch UI here.

## Goal
Desktop keyboard and mouse input in the DayG control map, merged with a touch source, and a low third-person camera
(gnome height, so headstones loom) with a first-person toggle that never sinks into blocks.

## Read first
- games/dayg/src/game/types.ts: InputState, TouchSource, Input, CameraRig.
- games/sample-3d/src/input.ts: a working pointer-lock keyboard/mouse input to adapt (ignore its gamepad and TUNING imports).
- games/sample-3d/src/camera.ts: a working third/first-person rig to adapt.
- games/dayg/src/world/collide.ts: Collider.groundAt(x, z, fromY) and faceAhead (for keeping the camera out of blocks).
- games/dayg/src/config.ts: CAMERA.

## Change
- games/dayg/src/game/input.ts: implement createInput.
- games/dayg/src/game/camera.ts: implement createCameraRig.

## Contract
export function createInput(canvas: HTMLCanvasElement, touch: TouchSource): Input;
- Keys: W/S/Up/Down moveZ, A/D/Left/Right moveX (D = +1 right), Shift sprint (held), C crouch (edge), E action (edge),
  left mouse attack (edge; only while pointer-locked, the first click just locks), Space climb (edge), Tab and I
  inventory (edge; preventDefault on Tab), V view (edge), Q/E-free mouse look via pointer lock (lookX = movementX x
  CAMERA.lookSensitivity, lookY = movementY x sensitivity). Clear edges after each read. Normalise diagonal movement.
- Merge touch.read(): moveX/moveZ take the touch value when its length is larger; lookX/lookY add; booleans OR.
- setPointerLockAllowed(false) exits pointer lock (the inventory panel needs the mouse); clicking the canvas while
  allowed requests it again. Pointer lock is never requested when touch.active() is true.
export function createCameraRig(camera: THREE.PerspectiveCamera, collider: Collider): CameraRig;
- yaw: lookX turns right as yaw decreases or increases consistently with: forward = (sin yaw, 0, cos yaw), the camera
  sits behind the target at target - forward x distance; pitch clamped [CAMERA.pitchMin, CAMERA.pitchMax].
- Third person: distance CAMERA.distance, look-at point target.y + CAMERA.height (minus CAMERA.crouchDrop when crouched).
  Pull the camera in along the ray from the look-at point when a block is in the way: step along the ray in 0.25 gm
  steps and stop at the first point where collider.groundAt(x, z, y + 200) > y + 0.1 (a block top is above that point,
  so it is inside or under a block; being pulled in under the lychgate roof is acceptable). Keep the camera at least
  0.3 above collider.groundAt(x, z, y) at its x, z. Smooth with lerp factor 1 - exp(-12 dt), snap on the first frame.
- First person: eye at target.y + 1.5 (1.0 crouched), pitch [-1.3, 1.3]. inp.view toggles the view.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in input.ts and camera.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5213/?seed=1" game` prints SMOKE OK.
- In a headless screenshot of `?seed=1` the camera sits behind and slightly above the player on the gatehouse; describe it.

## Out of scope
games/dayg/src/main.ts (planner), src/ui/touch.ts (built later), src/game/player.ts, src/scene/*, src/world/*.
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.6 Player movement and climbing)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest 5). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the files under Change. Your dev
  server port is 5214: `cd games/dayg && npx vite --port 5214 --strictPort` (background; stop it at the end).
- Feel (docs/design/dayg/survival.md "Moving and exploring"): slow and weighty. Walk 2 gm/s, jog 4, sprint 6 (stamina,
  noise), crouch half speed and half noise, kerbs vaulted, headstones need a route, a rope or a ladder; the Hatless
  cannot climb, so up is the way out.

## Goal
The player gnome moves like DayG: walk, jog, sprint with stamina, crouch, gravity and falls with fall heights reported,
vault kerbs, climb up and down blocks by fixed routes or by placing a carried rope or ladder, step noise, and region and
haven tracking with events.

## Read first
- games/dayg/src/game/types.ts: PlayerState, MoveMods, ClimbHint, PlayerController, InputState, ClimbVia.
- games/dayg/src/game/bus.ts: GameEvents ('noise', 'fell', 'climbed', 'route-placed', 'hint', 'entered-region', 'haven') and Bus.emit.
- games/dayg/src/world/collide.ts: Collider (groundAt, move, faceAhead, edgeAhead, regionAt, havenAt, addRoute) and FaceHit.
- games/dayg/src/config.ts: MOVE, CLIMB, STAMINA, NOISE, VAULT_MAX, STEP_UP, LADDER_MAX, ROPE_MAX, PLAYER_RADIUS, PLAYER_HEIGHT.
- games/dayg/src/world/types.ts: ClimbRouteDef.

## Change
- games/dayg/src/game/player.ts: implement createPlayerState and createPlayerController.
- games/dayg/src/game/player.test.ts (new): vitest tests with a hand-built BlockoutMap and createCollider.

## Contract
export function createPlayerState(spawn: Vec3): PlayerState;  // stance 'stand', stamina 100, alive true, everything else at rest
export function createPlayerController(deps: { bus: Bus; collider: Collider }): PlayerController;
update(p, input, yaw, dt, mods):
- Not alive: only gravity. Directions from the camera yaw: forward = (sin yaw, 0, cos yaw), right = (-cos yaw, 0, sin yaw);
  wish = right x moveX + forward x moveZ. Speed: |move| < MOVE.jogAt -> walk, else jog; sprint when input.sprint,
  mods.canSprint, stamina > 0 and not crouched -> MOVE.sprint (stamina -= STAMINA.sprintPerSec x dt). Crouch toggles on
  input.crouch (x MOVE.crouchMul). Multiply by mods.speedMul and by (1 - 0.4 x max(0, mods.carryRatio - 1)); over
  CARRY overload (carryRatio > 1.2) only walk. Accelerate toward the target with MOVE.accel. Stamina regenerates
  STAMINA.regenPerSec x mods.staminaRegenMul after STAMINA.regenDelay s without spending. p.facing turns toward the
  movement direction (smoothly); p.speed = horizontal speed.
- Collision: collider.move(p.pos, vx dt, vz dt, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out). Ground: g =
  collider.groundAt(x, z, p.pos.y); on ground snap to g (step up/down smoothly within STEP_UP); else fall with
  MOVE.gravity. Track fallFromY; on landing after a fall > 2 emit 'fell' { height }.
- Climb input (input.climb), checked in this order:
  1. edgeAhead (standing on a block top at its edge, facing out) with a route, or with mods.hasRope / hasLadder and
     height (top - ground below) within ROPE_MAX / LADDER_MAX: climb DOWN (p.climbing.down = true); placing a rope or
     ladder to go down emits 'route-placed' and collider.addRoute like below.
  2. faceAhead(p.pos, facing, CLIMB.reach, STEP_UP, CLIMB.alongTolerance): height = topY - p.pos.y. height <= VAULT_MAX
     -> vault: p.vaulting = CLIMB.vaultSeconds, then end on top of it (0.6 gm past the face). Else if hit.routes has one
     -> climb via 'route' at CLIMB.routeSpeed. Else if mods.hasLadder and height <= LADDER_MAX -> place a ladder: route
     { id: `placed-${n}`, block: hit.id, side: hit.side, kind: 'ladder', at: hit.along }; collider.addRoute(route);
     bus.emit('route-placed', { route, fromY: p.pos.y, topY: hit.topY }); climb via 'ladder' at CLIMB.ladderSpeed.
     Else if mods.hasRope and height <= ROPE_MAX -> the same with kind 'rope', via 'rope', CLIMB.ropeSpeed. Else emit
     'hint' { text: 'Too high to climb. A rope reaches 15 gm, a ladder 10.' } (at most once every 3 s).
  While climbing: no other movement, y moves at the speed, stamina -= CLIMB.staminaPerSec x dt (at 0 the gnome slips:
  stops climbing and falls), noise 'climb'. At the top step 0.6 gm past the face onto it and emit 'climbed'
  { height: topY - startY, via } when the height > VAULT_MAX. Moving backwards (moveZ < -0.5) while climbing up lets go
  (falls).
- climbHint(p, mods): what pressing climb would do now (the same checks, no side effects), or null.
- Noise: every NOISE.everySec while moving on the ground emit 'noise' { x, z, radius, source: 'step' } with radius
  walk/jog/sprint x (crouched ? NOISE.crouchMul : 1) x (1 + NOISE.weightMul x min(1, carryRatio)); p.noise = radius.
- Region and haven: after moving, p.region = collider.regionAt; on change emit 'entered-region'. p.haven = collider.havenAt;
  on change emit 'haven' { inside, haven }.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in player.ts and player.test.ts.
- `npm test -w games/dayg -- src/game/player.test.ts` passes, with tests for: walking speed about 2 gm/s, sprint drains
  stamina, crouch halves speed, a fall of 8 gm emits 'fell' ~8, a 1.2 gm kerb is vaulted, a 10 gm block with no route
  and no items emits 'hint', the same block with mods.hasRope is climbed and emits 'route-placed' and 'climbed' via
  'rope', a fixed 'ivy' route is climbed without items, climbing down a route from the top.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5214/?seed=1" game` prints SMOKE OK.

## Out of scope
games/dayg/src/main.ts (planner), src/game/input.ts, camera.ts, src/world/collide.ts (read it, never edit it; report
bugs you find in it), src/scene/*.
~~~~

~~~~text
Epic: 2 Sim tests and scorecard; three.js core (issue 2.7 Gnome models and player view)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Six other workers are editing other files of games/dayg at the same time. Edit only the files under Change. Your dev
  server port is 5215: `cd games/dayg && npx vite --port 5215 --strictPort` (background; stop it at the end).
- Player gnome rule (AGENTS.md): main.ts already calls `await loadMyGnome()` first. Wear `getMyGnome()?.look` through
  `createGnomeModel`, fall back to the game's own look when the player has no custom gnome, never hand-build a gnome.
  A Hatless is a gnome model with the hat removed and moss materials on top (no separate zombie model). No gore.

## Goal
One module makes every gnome DayG shows (the player, NPC gnomes from the sim's look seeds, the Hatless) from @lawn/gnome,
scaled to 1.7 gm; and the player view shows the player's own gnome walking, crouching and climbing.

## Read first
- packages/gnome/README.md: loadMyGnome, getMyGnome, createGnomeModel(look, { overrideEquipment }), GnomeModel (object, arms, legs, hat, update(pose, dt), setDead).
- packages/gnome/src/types.ts: GnomeLook (hat, shirt, pants, skin, boots, beard, hair, ...), GNORMAN_LOOK.
- games/dayg/src/game/types.ts: PlayerState, PlayerView, PlayerViewOpts.
- games/dayg/src/config.ts: GNOME_HEIGHT, COLORS (moss, mossDark).

## Change
- games/dayg/src/scene/gnomes.ts: looks and the model factory.
- games/dayg/src/scene/playerView.ts: createPlayerView.

## Contract
// gnomes.ts
export const FALLBACK_LOOK: GnomeLook;              // DayG's own default: a dusty brown coat, grey-green hat, white beard
export function playerLook(): GnomeLook;            // getMyGnome()?.look ?? FALLBACK_LOOK
export function npcLook(seed: number): GnomeLook;   // deterministic from seed: earthy hats, coats and trousers from a fixed palette list of at least 8 each
export function hatlessLook(seed: number): GnomeLook; // npcLook(seed) with colours lerped 50% toward grey-green
export function makeGnome(look: GnomeLook, opts?: { hatless?: boolean; overrideEquipment?: EquipSlot[] }): GnomeModel;
  // createGnomeModel(look, { overrideEquipment }); scale model.object uniformly so its bounding box height is GNOME_HEIGHT
  // (measure once with THREE.Box3 on the first model and cache the factor). hatless: model.hat.visible = false, hide any
  // 'head' equipment, and give every mesh a cloned material whose colour is lerped toward COLORS.moss by 0.35 plus a few
  // small grey-green squashed spheres ("moss clumps") on the shoulders and head; arms hang slightly forward.
  // The pose for model.update is `{ position, velocity, facing, grounded, jumpsUsed: 0 }` (the type is
  // Parameters<GnomeModel['update']>[0]).
// playerView.ts
export function createPlayerView(scene: THREE.Scene): PlayerView;
  // model = makeGnome(playerLook()); added to scene. update(p, dt, opts): position = p.pos, facing = p.facing, pass
  // velocity and grounded to model.update; crouched: lower the rig by 0.35 and lean forward 0.3 rad; climbing: face the
  // wall (facing unchanged), arms raised and alternating; opts.hatSlips: tilt model.hat 0.5 rad; opts.dead: model.setDead(true).
  // opts.held / back / head are handled in a later issue: accept them and ignore them now.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in gnomes.ts and playerView.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5215/?seed=1" game` prints SMOKE OK.
- A headless screenshot shows the gnome on the gatehouse at the right scale (1.7 gm: a little taller than a 1.6 gm
  kerb). The headless browser has no saved gnome, so this checks FALLBACK_LOOK; say so in your report. Also render one
  hatless model for a check (temporarily in your own file behind `?hatlesstest=1`, removed before you finish) and describe it.

## Out of scope
games/dayg/src/main.ts (planner), src/scene/worldBuilder.ts, sky.ts, src/game/*, packages/gnome (never fork the model).
~~~~

### Round 3, Epic 3: survival, items, Hatless, loot, feed, camp, tuning

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.1 Needs)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest 5). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time (one edits src/sim/tuning.json sim
  sections; you only READ its `player` section). Edit only the files under Change.
- Time unit: sun-hours (1 sun-hour = 5 real minutes; the main loop passes the sun-hours advanced each frame).

## Goal
The player has four needs (warmth, water, food, calm) that move with weather, night, fire, havens, effort, height, wetness,
nearby Hatless and the moss; low needs slow you and shake your aim; empty needs wear the body down.

## Read first
- games/dayg/src/game/types.ts: Needs, NeedsEnv, NeedsEffects, NeedDamage, NeedsSystem, InfectionStage.
- games/dayg/src/sim/types.ts: Tuning['player'] and Tuning['infection'] (stageCalmPerHour, stageWarmthPerHour).
- games/dayg/src/sim/tuning.json: the `player` and `infection` numbers.
- games/dayg/src/items/defs.ts: ItemDef.props.food / water.
- docs/design/dayg/survival.md, sections "Needs" and "Survivalist systems" (Rule of Threes).

## Change
- games/dayg/src/game/needs.ts: implement createNeedsSystem (pure helpers exported for tests).
- games/dayg/src/game/needs.test.ts (new).

## Contract
export function createNeedsSystem(bus: Bus, t: Tuning): NeedsSystem;
export function stepNeeds(n: Needs, env: NeedsEnv, hours: number, t: Tuning): void;   // pure; used by update()
export function needsEffects(n: Needs, t: Tuning): NeedsEffects;                      // pure
Rates per sun-hour (p = t.player):
- water -= (waterPerHour + exertion x exertionWaterPerHour) x hours; food -= (foodPerHour + exertion x exertionFoodPerHour) x hours.
- warmth: if tempC >= comfortTemp and wet == 0 and not night: += warmthRecoverPerHour; else += (min(0, tempC - comfortTemp)
  x warmthPerDegreeHour + warmthWeatherPerHour[weather] + (night ? warmthNightPerHour : 0) + wet x warmthWetPerHour
  + (altitude > 15 ? warmthHighPerHour : 0)); plus nearFire ? warmthFirePerHour, inHaven ? warmthHavenPerHour;
  plus infection.stageWarmthPerHour[stage] when infected. Everything x hours.
- calm: += hatlessNear > 0 ? calmHatlessPerHour x min(3, hatlessNear) / 3 : 0; night && !inHaven ? calmNightOutsidePerHour;
  inHaven ? calmHavenPerHour; nearFire ? calmFirePerHour; !night && hatlessNear == 0 ? calmDayPerHour;
  + infection.stageCalmPerHour[stage]; all x hours.
- Clamp each to 0..100.
- needsEffects: speedMul 1, minus 0.15 if any need < lowThreshold, minus another 0.15 if food and water both are;
  staminaRegenMul 0.5 when warmth < lowThreshold else 1; aimShake = calm < lowThreshold ? (lowThreshold - calm) / lowThreshold : 0;
  damage = [{ cause: 'cold', perHour: zeroWearPerHour.cold }] when warmth == 0, likewise 'thirst' (water 0) and 'hunger' (food 0).
- eat(def): food += def.props.food ?? 0 (cap 100); bus.emit('ate', { def: def.id }).
- drink(litres, clean): water += litres x 60 (0.5 L = +30); dirty water gives half and, with chance
  dirtyWaterCrampChance (use a small local seeded generator, not the sim's streams), food -= 10; bus.emit('drank', { clean, litres }).
- State starts at { warmth: 80, water: 85, food: 75, calm: 70 }.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in needs.ts and needs.test.ts.
- `npm test -w games/dayg -- src/game/needs.test.ts` passes, with tests: water runs out in about 60-72 sun-hours at rest;
  a storm with no fire takes warmth from 100 to 0 in about 3-4 sun-hours; a fire stops that; calm falls with 3 Hatless
  near and rises in a haven; damage lists 'thirst' at water 0; eat and drink raise the needs.

## Out of scope
games/dayg/src/main.ts (planner), src/sim/tuning.json (read only), src/game/body.ts, src/ui/hud.ts, every other file.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.2 Body, cracks and the moss)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest 5). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time. Edit only the files under Change. You only
  READ src/sim/tuning.json (`infection`, `body`).
- House style: gnomes are fired clay. They chip, crack and shatter; they never bleed.

## Goal
The player's clay body takes chips and cracks from Hatless scratches, falls and cold; a scratch on an open crack may let
the grey moss in, which grows through four stages on the sun clock and turns the gnome at 24 sun-hours unless it is
washed out or scraped and sealed in time; enough damage shatters the gnome.

## Read first
- games/dayg/src/game/types.ts: BodyPart, BODY_PARTS, CrackLevel, InfectionStage, Infection, BodyState, BodyEffects, BodySystem, NeedDamage.
- games/dayg/src/game/bus.ts: events 'player-hit', 'fell' (you listen), 'cracked', 'infection', 'infection-cured', 'player-shattered' (you emit).
- games/dayg/src/sim/types.ts: Tuning['infection'], Tuning['body'], TreatMethod, Season, DeathCause.
- docs/design/dayg/crafting.md, section "Infection: the moss, with numbers" (the stage table).
- docs/design/dayg/survival.md, section "The gnome body".

## Change
- games/dayg/src/game/body.ts: implement createBodySystem (pure helpers exported).
- games/dayg/src/game/body.test.ts (new).

## Contract
export function createBodySystem(bus: Bus, rng: () => number, t: Tuning): BodySystem;
export function createBody(): BodyState;  // no cracks, glaze 1, wear 0, no infection
export function hitBody(b: BodyState, strength: number, rng: () => number, t: Tuning): { part: BodyPart; raised: boolean; exposed: boolean; shattered: boolean };
export function fallBody(b: BodyState, height: number, rng: () => number, t: Tuning): { part: BodyPart | null; shattered: boolean };
export function stepInfection(b: BodyState, hours: number, season: Season, wet: number, t: Tuning): InfectionStage | 'turned' | null; // returns a new stage when it changed
export function treatChance(b: BodyState, method: TreatMethod, t: Tuning): number;
Rules (i = t.infection, k = t.body):
- hitBody: part picked by k.partWeights; with chance strength x k.crackPerHit the part's level rises by 1 (raised);
  glaze -= k.glazeLossPerHit. Exposure if no infection yet: chance = (level >= 2 before the hit ? i.exposeOpenCrack :
  i.exposeGlazed) x (glaze < 0.5 ? 2 : 1); exposed -> infection { part, hours: 0, stage: 0 }. A head or chest already at
  level 3 that is raised again shatters (cause 'hatless').
- fallBody: height >= fallChip: a leg +1; >= fallCrack: that leg to at least 2; >= fallShatter: shatter with chance
  k.fallShatterChance + (height - fallShatter) / 20 (cause 'fall'), else a deep crack (3) on a leg and the chest +1.
- stepInfection: hours += hours x i.seasonMul[season] x (wet > 0 ? i.wetMul : 1); stage 0 until stage0Hours, 1 until
  stage1Hours, 2 until stage2Hours, 3 until turnHours, then 'turned' (shatter, cause 'moss').
- treatChance(method): i.cure[method][stage]; for 'scrape-seal' at stage 1 subtract i.missingGlazingPenalty x
  max(0, 2 - i.playerGlazing). No infection -> 0.
- System: subscribes to 'player-hit' (hitBody with e.strength) and 'fell' (fallBody); emits 'cracked' { part, level,
  cause } on every raise, 'infection' { stage: 0, part } when exposed and on every stage change ({ stage: 'turned' } at
  the end), 'player-shattered' { cause } exactly once. update(hours, env): stepInfection; wear += sum of env.damage
  perHour x hours; each 25 wear also raises a random part (cause 'cold' when the damage is cold); wear >= k.wearToShatter
  shatters with the cause of the largest damage entry. treat(method): roll rng() < treatChance; success clears the
  infection, emits 'infection-cured' { stage }, and for 'scrape-seal' sets that part to level 3 (emits 'cracked' cause
  'scrape'); returns success. mend(): lowers the worst part by 1 and sets glaze to 1; false if nothing to mend.
- effects(): limp = max(legL, legR) / 3; aimShake = max(armL, armR) / 3 + (stage 3 ? 0.4 : 0); hatSlips = stage 3.
- After shattering, update/hit/fall do nothing.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in body.ts and body.test.ts.
- `npm test -w games/dayg -- src/game/body.test.ts` passes, with tests: stage boundaries at 0.5 / 3 / 12 / 24 sun-hours
  (and faster in spring, slower in winter); salt-wash works only at stage 0; scrape-seal at stage 1 has chance 0.6 with
  glazing 0 and leaves a deep crack; a 30 gm fall can shatter; wear 100 shatters with the right cause; 'player-shattered'
  fires once.

## Out of scope
games/dayg/src/main.ts (planner), src/sim/*, src/game/needs.ts, src/game/useItem.ts, src/ui/*.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.3 Inventory and recipes)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest 5). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time. Edit only the files under Change.
- Design rule (docs/design/dayg/items.md): rules never name a specific item; they ask for tags and properties. Any item
  with the tag works.

## Goal
A Zomboid-style inventory of generic items: two hands, worn slots, a pack limited by bulk, carry weight, liquids in
containers, tag queries; and the slice's recipes as data.

## Read first
- games/dayg/src/game/types.ts: Inventory, StackRef, InventorySystem, RecipeId, RecipeDef.
- games/dayg/src/items/defs.ts: ItemDef (tags, weight, bulk, stack, props.capacity, props.liquidCap, wear), ITEMS, getItem, hasTag, Tag, WornSlot.
- games/dayg/src/sim/types.ts: ItemStack.
- games/dayg/src/config.ts: CARRY (capacityKg 8, pocketsBulk 4), START_KIT.
- docs/design/dayg/items.md, sections "The item model" and "Containers and inventory".

## Change
- games/dayg/src/game/inventory.ts: implement createInventory.
- games/dayg/src/items/recipes.ts: RECIPES and getRecipe.
- games/dayg/src/game/inventory.test.ts (new).

## Contract
export function createInventory(start: readonly ItemStack[]): InventorySystem;
- start: an item with `wear` goes to its empty worn slot; the first item with BLUNT, CUT or PIERCE goes to hands[0];
  everything else to the pack (copy the stacks; never keep the caller's objects).
- bulkCapacity = CARRY.pocketsBulk + sum of worn CONTAINER items' props.capacity; bulkUsed = sum over pack stacks of
  def.bulk x count (+ liquid litres); carryCapacity = CARRY.capacityKg; weight = everything carried (hands, worn, pack)
  of def.weight x count + liquid litres x 1 kg.
- add: merge into same-def stacks with room (stack limit, same liquid state), then new pack stacks while bulk allows,
  then empty hands; returns the leftover stack or null. Never splits a stack's condition: merging averages condition.
- move(from, to): to a hand or worn slot (worn only if def.wear matches the slot); a full target swaps; to the pack only
  if bulk allows. take(ref, count) removes and returns. findTag / countTag look at hands, then pack, then worn.
  consumeTag(tag, count) removes count items with the tag, all or nothing.
- Liquids: HOLD_LIQUID stacks carry liquid { kind, litres } up to props.liquidCap (count must be 1). cleanWater() =
  clean litres in liquids + 0.5 x number of DRINK items; useWater(litres) takes clean liquid first, then whole DRINK
  items (each counts 0.5 L); fillLiquid(kind, litres) fills empty or same-kind containers.
- onChange(fn) fires after every mutation.
// recipes.ts
export const RECIPES: readonly RecipeDef[] = [
  { id: 'campfire', name: 'Lay and light a fire', inputs: [{ tag: 'TINDER', count: 1 }, { tag: 'FUEL', count: 1 }], water: 0, tool: 'FIRESTARTER', seconds: 20, needsFire: false },
  { id: 'salt-wash', name: 'Salt wash a crack', inputs: [{ tag: 'SALT', count: 1 }], water: 0.2, tool: null, seconds: 10, needsFire: false },
  { id: 'spirit-wash', name: 'Wash a crack with spirit', inputs: [{ tag: 'SPIRIT', count: 1 }], water: 0, tool: null, seconds: 10, needsFire: false },
  { id: 'scrape-seal', name: 'Scrape out the moss and seal it', inputs: [{ tag: 'SPIRIT', count: 1 }, { tag: 'ADHESIVE', count: 1 }], water: 0, tool: 'CUT', seconds: 30, needsFire: false },
  { id: 'boil-water', name: 'Boil dirty water', inputs: [], water: 0, tool: 'COOK_VESSEL', seconds: 35, needsFire: true },
  { id: 'mend-glaze', name: 'Glaze a crack', inputs: [{ tag: 'GLAZE', count: 1 }], water: 0, tool: null, seconds: 25, needsFire: false },
];
export function getRecipe(id: RecipeId): RecipeDef;
(Inputs are consumed from DIFFERENT items where possible: a campfire takes two twig bundles, one as tinder, one as fuel.
The recipe's effects are applied elsewhere; this file is data only.)

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in the three files.
- `npm test -w games/dayg -- src/game/inventory.test.ts` passes, with tests: START_KIT puts the loot-sack on the back,
  the trowel in hand; bulk limits the pack (pockets 4 L, +12 with the sack); add merges stacks; consumeTag is all or
  nothing; a tin-pail filled with 2 L clean water gives cleanWater 2.5 with one bottle; useWater removes liquid first;
  weight includes liquid.

## Out of scope
games/dayg/src/main.ts (planner), src/items/defs.ts (planner-owned; report missing tags instead of editing it),
src/game/useItem.ts and src/ui/inventoryPanel.ts (another worker), src/sim/*.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.4 Inventory panel and item use)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time: inventory.ts, recipes.ts, needs.ts,
  body.ts and camp.ts are being filled in now behind their final interfaces. Edit only the files under Change. Your dev
  server port is 5221: `cd games/dayg && npx vite --port 5221 --strictPort` (background; stop it at the end).
- UI rules (AGENTS.md): append your own container to the shared `#ui` element (passed in as `ui`), never restyle or hide
  `#ui`; `#ui` has pointer-events: none, so set pointer-events: auto on your panel. Mobile by default: every target
  >= 44 px, no hover-only UI, fits 390x844 portrait and 844x390 landscape inside env(safe-area-inset-*).
- Item icons come from @lawn/prefabs: `prefabIconElement(def.prefab, '', 40)` (an <img>, or the emoji fallback).

## Goal
A pack screen where the player sees hands, worn slots, pack contents with weight and bulk, uses items (eat, drink, hold,
wear, stow, drop), starts the slice's recipes with a progress bar, and takes items out of a searched container; plus the
item-use logic that applies each action's effect.

## Read first
- games/dayg/src/game/types.ts: InventoryPanel, UseApi, UseAction, InventorySystem, StackRef, NeedsSystem, BodySystem,
  CampSystem, RecipeDef, PlayerState.
- games/dayg/src/items/recipes.ts and games/dayg/src/items/defs.ts: RECIPES, getRecipe, ITEMS, hasTag.
- games/dayg/src/game/bus.ts: 'recipe-done', 'campfire-lit', 'hint'.
- games/dayg/src/config.ts: DOM.inv ('dayg-inv'), LAYOUT, FIRE.
- packages/prefabs/README.md, section "Use it" (prefabIconElement).

## Change
- games/dayg/src/game/useItem.ts: export `UseDeps` and implement createUseApi.
- games/dayg/src/ui/inventoryPanel.ts: implement createInventoryPanel.

## Contract
export interface UseDeps { inv: InventorySystem; needs: NeedsSystem; body: BodySystem; camp: CampSystem; bus: Bus;
  rng: () => number; getPlayer: () => PlayerState; getWeather: () => WeatherState }
export function createUseApi(deps: UseDeps): UseApi;
- actionsFor(ref): FOOD -> 'Eat' (2 s, needs.eat(def), takes 1); DRINK -> 'Drink' (2 s, needs.drink(0.5, true), takes 1);
  HOLD_LIQUID with liquid -> 'Drink' (0.25 L, clean or dirty); def.wear -> 'Wear' / 'Take off'; in the pack -> 'Hold'
  (to hands[0]); in a hand -> 'Put away'; always 'Drop' (removes it; dropped items are gone in this slice: say so in the label 'Drop (lost)').
- recipes(): every RECIPE with ok and why ('Needs SALT', 'Needs clean water 0.2 L', 'Needs a fire', 'Too wet to light
  a fire here', 'No moss to treat', 'Nothing to mend'). Checks: inputs by countTag, the tool by findTag, water by
  inv.cleanWater(), needsFire by camp.nearFire(player.pos), campfire fails in drizzle/rain/storm unless player.haven,
  treatments need body.state.infection, mend-glaze needs a cracked part.
- start(action) begins a timed action (seconds); update(dt) advances it; on completion apply: recipe inputs consumed
  (consumeTag; water by inv.useWater), then effect: 'campfire' -> camp.placeFire(player x, y, z + 1 in front of the
  player along its facing, FIRE.burnHoursPerFuel x fuel burnHours) and wear the FIRESTARTER item's condition by
  1/maxCondition; 'salt-wash' -> body.treat('salt-wash'); 'spirit-wash' -> body.treat('spirit'); 'scrape-seal' ->
  body.treat('scrape-seal'); 'boil-water' -> turn dirty liquid in the COOK_VESSEL clean; 'mend-glaze' -> body.mend();
  emit 'recipe-done' { recipe, ok } and a 'hint' with the result ("The salt stings. The grey is gone." / "The moss is
  still in there."). Moving (the main loop zeroes movement while busy) is not your concern; cancel() stops it.
- busy(): { label, progress 0..1 } or null.
export function createInventoryPanel(ui: HTMLElement, deps: { inv: InventorySystem; use: UseApi }): InventoryPanel;
- Root element id 'dayg-inv' (DOM.inv), hidden by default, appended to ui; pointer-events auto when open.
- Layout: portrait (height > width): a bottom sheet 72% of the height; landscape: a right-hand panel 62% of the width,
  full height; both inside safe-area insets, close button 48x48 at the top right.
- Sections: Hands (2 slots) and Worn (head, back, neck, body), Pack (grid of 56x56 slots with icon, count badge,
  condition bar), weight `3.2 / 8 kg` and bulk `6 / 16 L` bars, Recipes (buttons disabled with the reason as text when
  not ok), and a progress bar while use.busy(). Tapping a slot shows its actions as a row of buttons (>= 44 px).
- showLoot(title, items, onTake): opens the panel with an extra "Searching: <title>" column listing items with a
  'Take' button each and a 'Take all' button; onTake(index) is called; re-render on inv.onChange and after each take.
  Close it with the close button or by calling toggle/close. Re-render on every open.
- Keyboard: none needed (Tab/I toggling is handled by the main loop through toggle()).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in useItem.ts and inventoryPanel.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5221/?seed=1" dayg-inv` prints SMOKE OK.
- Open the panel in a headless screenshot: add `?inv=1` handling inside YOUR panel file only (open on creation when the
  URL has inv=1). Take the phone screenshots at 390x844 and 844x390 (command below) and a desktop one; read them; every
  button is at least 44 px and nothing is cut off. Phone screenshot:
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-34-portrait.png" "http://localhost:5221/?seed=1&inv=1"

## Out of scope
games/dayg/src/main.ts (planner), src/game/inventory.ts, src/items/*, src/game/needs.ts, body.ts, camp.ts, src/ui/hud.ts.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.5 HUD)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time. Edit only the file under Change. Your dev
  server port is 5222: `cd games/dayg && npx vite --port 5222 --strictPort` (background; stop it at the end).
- UI rules (AGENTS.md): append your own container to `#ui` (passed in as `ui`), never restyle or hide `#ui`. Mobile by
  default: fits 390x844 and 844x390 inside env(safe-area-inset-*), no hover-only UI. DayG has no mini-map and no quest
  markers: the HUD stays small and quiet.

## Goal
A quiet HUD: four need bars, stamina, a small clay-body figure showing cracks and a faint grey where the moss is, the time
of day, day, season and weather, where you are, a context prompt and short toasts.

## Read first
- games/dayg/src/game/types.ts: Hud, HudState, Needs, BodyState, BodyPart, Stance.
- games/dayg/src/config.ts: DOM.hud ('dayg-hud'), LAYOUT (topBar 64, buttonsW/H, promptBottom 120), COLORS.
- games/dayg/src/ui/hud.ts: the stub (keep createHud's signature).
- docs/design/dayg/crafting.md, the infection table (stage 0 shows only a faint grey on the crack; stage 1 a grey crack;
  stage 2 grey veins; stage 3 the hat slips).

## Change
- games/dayg/src/ui/hud.ts: implement createHud.

## Contract
export function createHud(ui: HTMLElement): Hud;   // root id 'dayg-hud', pointer-events none
- Top-left inside the safe area, within LAYOUT.topBar: four thin bars with small labels (Warm, Water, Food, Calm) and a
  stamina bar; bars turn amber under 30 and red under 10 and pulse at 0.
- Next to them, a 40x56 SVG clay-gnome figure with six parts (head, chest, arms, legs): colour by crack level (0 clay,
  1 light lines, 2 dark lines, 3 broken); the infected part gets a faint grey tint at stage 0, grey at 1, grey with veins
  at 2, the whole figure greying at 3.
- Top-right: `08:40 · Day 2 · autumn · drizzle` (hourOfDay as hh:mm), a moon glyph at night; below it the region name
  and 'Safe: Lychgate Waystation' when haven is set; the stance when crouched; carry `3.2 / 8 kg` turning amber over 100%.
- prompt(text): a pill centred horizontally, LAYOUT.promptBottom px above the bottom safe area, max-width 60vw; null hides it.
- toast(text, seconds = 3): a line under the top bar, fading; at most 3 stacked.
- busy (from HudState): a thin progress bar with the label above the prompt position.
- update() is called every frame: only touch the DOM when a value changed (cache last values).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in hud.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5222/?seed=1" dayg-hud` prints SMOKE OK.
- Screenshots at 1280x720, 390x844 and 844x390 (Edge headless, e.g. --window-size=390,844 --virtual-time-budget=9000
  --screenshot="$TEMP/dayg-35-portrait.png" "http://localhost:5222/?seed=1"): read them; the bars, figure and clock fit
  inside the top 64 px, nothing overlaps the bottom-right 200x270 px touch-button block or the left-bottom stick zone,
  and the text is readable. To see a crack and infection, set them in the console (`__dayg.body.state.cracks.armL = 2`,
  `__dayg.body.state.infection = { part: 'armL', hours: 4, stage: 2 }`) before a desktop screenshot if you can drive the
  console; otherwise test with a temporary `?hudtest=1` branch in YOUR file only and remove it before finishing.

## Out of scope
games/dayg/src/main.ts (planner), src/ui/inventoryPanel.ts, src/ui/touch.ts, src/game/*, src/scene/*.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.6 Hatless at L0)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time (the sim feed in src/game/simFeed.ts calls
  your spawn/despawnAll). Edit only the file under Change. Your dev server port is 5223:
  `cd games/dayg && npx vite --port 5223 --strictPort` (background; stop it at the end).
- Hatless are gnome models from src/scene/gnomes.ts (`makeGnome(hatlessLook(seed), { hatless: true })`): never build
  a separate zombie model. No gore: hits chip and crack, a destroyed Hatless crumbles into grey dust and clay shards.
- Phone budget: at most HATLESS.maxL0Phone (24) on a coarse pointer, HATLESS.maxL0Desktop (40) otherwise; spawn
  requests over the budget keep the extra count as "held back" (they still count in aliveCount and come out of
  despawnAll) and appear as soon as a slot frees.

## Goal
Individual Hatless near the player: they sway, hear noise, see in a narrow cone, shamble and lunge, grab and scratch,
cannot climb above a kerb, gather under a gnome who climbed out of reach and lose interest, avoid havens, and can be
knocked down by cracking their core.

## Read first
- games/dayg/src/game/types.ts: HatlessSystem, PlayerState, Vec3.
- games/dayg/src/scene/gnomes.ts: makeGnome, hatlessLook, and how to animate a GnomeModel (model.update(pose, dt)).
- games/dayg/src/world/collide.ts: Collider.move (use stepUp = HATLESS_STEP), groundAt, havenAt.
- games/dayg/src/config.ts: HATLESS (speeds, ranges, coreHp, giveUpSeconds, pileReach), HATLESS_STEP.
- docs/design/dayg/hatless.md, sections "One Hatless, up close (L0)" and "Height".

## Change
- games/dayg/src/scene/hatless.ts: export `HatlessDeps` and implement createHatlessSystem.

## Contract
export interface HatlessDeps { scene: THREE.Scene; collider: Collider; bus: Bus; getPlayer: () => PlayerState; coarse: boolean }
export function createHatlessSystem(deps: HatlessDeps): HatlessSystem;
- spawn(region, count, spots, from?): place each at a random spot of that region (spots are SpotDef with kind
  'hatless'; jitter 2 gm, ground via collider.groundAt); if `from` is given (arrivals from a neighbouring region), place
  them at the region-rect edge point nearest `from` instead and set them 'drawn' toward the region centre.
- States: idle (sway), drawn (walk to the last heard noise), hunting (has the player), stagger (after a hit).
  Hearing: subscribe to bus 'noise'; a Hatless within e.radius of the noise becomes drawn to it. Sight: player within
  HATLESS.sightRange (x 0.5 at night or in fog) and inside the cone (sightHalfAngle around its facing), and not in a
  haven -> hunting. Crouched players are seen at 0.6 x range.
- Movement: shamble HATLESS.shamble; lunge HATLESS.lunge for lungeSeconds when the player is within lungeRange; turn
  toward the target; collider.move with HATLESS.radius, height 1.7, stepUp HATLESS_STEP; separation between Hatless.
- Height: when the player stands more than HATLESS.pileReach above a hunting Hatless's ground, it stops under the player
  and reaches up (arms raised); after giveUpSeconds it goes idle. A Hatless never targets a player inside a haven.
- Attack: within grabRange and the player's feet less than 1.2 above its own: every scratchEvery seconds
  bus.emit('player-hit', { strength: 0.5 + 0.1 x (others within 2 gm), from: { x, z } }).
- strike(origin, facing, reach, damage): the Hatless nearest along facing within reach and 60 degrees: hp -= damage,
  knock back 1 gm, stagger HATLESS.staggerSeconds; at hp <= 0 it crumbles (sink and fade over 1 s, a puff of grey
  particles) and bus.emit('hatless-destroyed', { region: collider.regionAt(x, z) }). Returns hits (0 or 1).
- despawnAll(): removes all (dispose cloned materials, not shared geometry) and returns alive + held-back count.
- nearCount(pos, radius), aliveCount() (alive + held back).
- Debug: `?hatless=N` spawns N in the player's region on the first update (handle it in YOUR file) for testing.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in hatless.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5223/?seed=1&hatless=12" game` prints SMOKE OK.
- A headless screenshot of `?seed=1&hatless=12&spawn=250,440` shows Hatless (hatless gnome models) near the player; read it and describe it.
- In your report, list how you checked that a Hatless cannot step onto a 2 gm block (e.g. a temporary vitest file you
  delete, using createCollider on a tiny map).

## Out of scope
games/dayg/src/main.ts (planner), src/scene/gnomes.ts (read only), src/game/simFeed.ts, src/scene/npcActors.ts, src/game/body.ts.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.7 Loot containers in the world)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time (the inventory panel's showLoot and the
  inventory's add are being filled in behind their final interfaces). Edit only the file under Change. Your dev server
  port is 5224: `cd games/dayg && npx vite --port 5224 --strictPort` (background; stop it at the end).

## Goal
Every container on the map can be searched with the context action: its contents come from the sim's loot budget (the
same stock NPCs scavenge), the player takes what fits, and the sim counts what left the world.

## Read first
- games/dayg/src/sim/loot.ts: rollContainer(w, id, rng) (rolls once, returns the same contents array afterwards).
- games/dayg/src/sim/world.ts: recordPlayerTake(w, stack) (call it for every stack the player takes).
- games/dayg/src/game/interact.ts: Interactable { id, x, y, z, radius, label(), act() } and Interact.add.
- games/dayg/src/game/types.ts: ContainerSystem, InventoryPanel.showLoot(title, items, onTake), InventorySystem.add, WorldView.setContainerOpened.
- games/dayg/src/config.ts: CONTAINER_NAME.

## Change
- games/dayg/src/scene/containers.ts: export `ContainerDeps` and implement createContainerSystem.

## Contract
export interface ContainerDeps { map: BlockoutMap; worldView: WorldView; interact: Interact; sim: { world: WorldState; streams: Streams };
  bus: Bus; panel: InventoryPanel; inv: InventorySystem; getPlayer: () => PlayerState }
export function createContainerSystem(deps: ContainerDeps): ContainerSystem;
- For every map.containers entry add an Interactable at its position, radius 1.6: label 'Search the <CONTAINER_NAME>'
  (unopened), 'Look in the <name> (n items)' (opened with items), null when opened and empty.
- act(): items = rollContainer(sim.world, id, sim.streams.loot); first time: bus.emit('container-opened', { containerId,
  region, items: copies }), worldView.setContainerOpened(id); then panel.showLoot(title, items, onTake).
- onTake(index): leftover = inv.add(items[index]); taken count = original count - (leftover?.count ?? 0); when > 0:
  recordPlayerTake(sim.world, { ...stack, count: taken }), bus.emit('item-taken', ...); if leftover, items[index] =
  leftover, emit 'hint' { text: 'No room in your pack.' }; else remove items[index].
- Containers in a SACRED region add ' (the Keeping frowns on this)' to the label (flavour only; no penalty this round).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in containers.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5224/?seed=1" game` prints SMOKE OK.
- Report how you checked that taking an item lowers `__dayg.sim.world` resource totals by exactly its count (for
  example a temporary vitest test of your onTake logic with a fake panel and the real createInventory, deleted afterwards).

## Out of scope
games/dayg/src/main.ts (planner), src/sim/* (read only), src/ui/inventoryPanel.ts, src/game/inventory.ts, src/scene/worldBuilder.ts.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.8 Sim feed and NPC actors)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time (src/scene/hatless.ts implements the
  HatlessSystem you call). Edit only the files under Change. Your dev server port is 5225:
  `cd games/dayg && npx vite --port 5225 --strictPort` (background; stop it at the end).
- The world is one simulation: the Hatless and NPC gnomes the player sees must be the sim's, counts conserved
  (docs/design/dayg/simulation-lod.md). NPCs are seen, not talked to, this round.

## Goal
The running game advances the headless sim on the sun clock and promotes the player's region: the sim's Hatless there
become L0 Hatless (and arrivals walk in from the neighbouring region), the sim's NPC gnomes there stand on stones and in
havens, everything is summed back when the player leaves (after 60 s), and destroyed Hatless are booked.

## Read first
- games/dayg/src/sim/world.ts: stepWorld, promoteRegion, absorbIntoPromoted, demoteRegion, recordHatlessDestroyed, npcsIn, hatlessTotal.
- games/dayg/src/sim/types.ts: WorldState (promoted, events, npcs), SimEvent 'herd-moved'.
- games/dayg/src/game/types.ts: SimFeed, HatlessSystem (spawn, despawnAll), NpcActors, Clock, PlayerState.
- games/dayg/src/scene/gnomes.ts: makeGnome, npcLook(seed).
- docs/design/dayg/simulation-lod.md (short: promotion, demotion, hysteresis).

## Change
- games/dayg/src/game/simFeed.ts: export `FeedDeps` and implement createSimFeed.
- games/dayg/src/scene/npcActors.ts: implement createNpcActors.

## Contract
export interface FeedDeps { sim: { world: WorldState; streams: Streams }; map: BlockoutMap; bus: Bus; clock: Clock;
  hatless: HatlessSystem; npcs: NpcActors; getPlayer: () => PlayerState }
export function createSimFeed(deps: FeedDeps): SimFeed;
- update(dt, hours): while Math.floor(clock.sunHours) > world.tick: stepWorld(world, streams) and bus.emit('sim-tick',
  { tick }); after each step: n = absorbIntoPromoted(world); if n > 0 spawn n Hatless in the promoted region, `from` =
  the centre of the region named by the tick's 'herd-moved' event into it if any (else from the nearest neighbour
  centre); remove NPC actors whose NPC died or left the region and show newly arrived ones.
- Promotion: when player.region changes to a region r (not null) and r is not promoted: if another region is promoted,
  start its 60 s hysteresis timer (FEED.hysteresisSeconds) instead of demoting at once; when it runs out, or when a new
  promotion is needed, demote first: demoteRegion(world, hatless.despawnAll()), npcs.clear(). Then n = promoteRegion(world,
  r); hatless.spawn(r, n, spots of kind 'hatless' in r); npcs.show(first FEED.npcMaxShown alive NPCs in r, spots of kind
  'npc' in r). Walking back into the promoted region cancels its timer. gate-roof is a region too (no Hatless spots: 0
  Hatless there by design).
- Subscribe to 'hatless-destroyed': recordHatlessDestroyed(world) (only while a region is promoted; the event's region
  is where it fell, which may differ by a step: book it anyway).
- promoted(): world.promoted.region.
- Debug: expose nothing global (main.ts already exposes __dayg.feed).
export function createNpcActors(deps: { scene: THREE.Scene; collider: Collider; getPlayer: () => PlayerState }): NpcActors;
- show(npcs, spots): one gnome per NPC (makeGnome(npcLook(lookSeed))), each on its own spot (wrap around if fewer spots),
  idle: breathing sway, turn to face the player when within 10 gm, a small name label (a CSS2D-free approach: a sprite
  with canvas text, visible within 8 gm). remove(id), clear(), update(dt), ids().

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in simFeed.ts and npcActors.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5225/?seed=1&timescale=60" game` prints SMOKE OK.
- Report a conservation check: in a temporary vitest file (deleted afterwards) with a fake HatlessSystem (counts only)
  and fake NpcActors, drive createSimFeed with a fake clock and a fake player walking forecourt -> leaning-rows ->
  forecourt over 3 sun-days: hatlessTotal(world) always equals start + risen - crumbled - destroyed.
- A headless screenshot at `?seed=1&spawn=250,440` shows NPC gnomes or Hatless if the sim has any in the forecourt; describe it.

## Out of scope
games/dayg/src/main.ts (planner), src/sim/* (read only; report sim bugs), src/scene/hatless.ts, src/scene/gnomes.ts.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.9 Camp, water and the Waystation)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing other files of games/dayg at the same time (the item-use logic calls your placeFire
  and nearFire). Edit only the file under Change. Your dev server port is 5226:
  `cd games/dayg && npx vite --port 5226 --strictPort` (background; stop it at the end).
- Every visible object comes from @lawn/prefabs: the fire is buildPrefab('campfire', { scale: 1.7 }); flames and smoke
  particles are effects (allowed in code).
- Signature matters (docs/design/dayg/survival.md "Signature"): a fire warms you and its light and noise pull Hatless.

## Goal
Fires that burn fuel, warm and calm the gnome next to them and draw Hatless at night; drinking at the Tap and from
puddles; the Waystation rain catcher filling in the rain; and the Waystation bedroll where you can sleep through the
night in safety.

## Read first
- games/dayg/src/game/types.ts: CampSystem, Clock (setRate), InventorySystem (fillLiquid, cleanWater), NeedsSystem.drink, PlayerState (haven).
- games/dayg/src/game/interact.ts: Interactable and Interact.add.
- games/dayg/src/world/types.ts: WaterDef, SpotDef ('fire', 'bed'), HavenDef.
- games/dayg/src/config.ts: FIRE, RAIN_CATCHER, PREFAB_SCALE.
- docs/design/dayg/crafting.md, section "Fire, water and wind".

## Change
- games/dayg/src/game/camp.ts: export `CampDeps` and implement createCampSystem.

## Contract
export interface CampDeps { scene: THREE.Scene; map: BlockoutMap; interact: Interact; bus: Bus; inv: InventorySystem;
  needs: NeedsSystem; clock: Clock; getPlayer: () => PlayerState; collider: Collider }
export function createCampSystem(deps: CampDeps): CampSystem;
- Fires: placeFire(x, y, z, burnHours): a campfire prefab at the ground there (collider.groundAt), a flickering
  PointLight (orange, range 14, intensity scaled by remaining hours), a few rising flame/smoke sprites; burns in sun-hours
  (update's `sunHours`); rain (drizzle/rain/storm) outside a haven burns it 3x faster; returns false if another fire is
  within 3 gm. emit 'campfire-lit' { x, z }. The Waystation fire spot ('fire-waystation') starts lit with
  FIRE.waystationStartHours. nearFire(pos): within FIRE.warmRadius of a lit fire. firesLit(): count.
- Interactables on a lit fire (radius 2.5): 'Add fuel' when the player carries FUEL (consumeTag FUEL 1, adds
  FIRE.burnHoursPerFuel x that item's burnHours, at least 1).
- Noise: every FIRE.noiseEverySec real seconds per lit fire, at night only, bus.emit('noise', { x, z, radius: NOISE.fire,
  source: 'fire' }) (this is what pulls Hatless to a careless camp).
- Water (map.water): standpipe -> 'Drink from the Tap' (needs.drink(0.5, true)) and 'Fill your containers' (inv.fillLiquid
  ('clean', 10)); puddle -> 'Drink from the puddle (dirty)' (needs.drink(0.5, false)) and 'Fill with dirty water';
  rain-catcher -> holds litres (start 1), += RAIN_CATCHER.litresPerHour per sun-hour in drizzle/rain/storm up to capLitres;
  'Drink from the rain catcher (1.2 L)' takes 0.5; 'Fill your containers' moves what fits. Labels show the litres;
  null when empty. Interactable radius 2.
- Sleep: the 'bed' spot -> 'Sleep until dawn' only at night and only when player.haven is set; sleeping sets
  clock.setRate(30) until the clock is no longer night, then setRate(1) and bus.emit('slept', { hours }); any
  'player-hit' event wakes you (setRate(1), hint 'You wake to scratching.'). 'Rest a while' by day: setRate(10) for 1
  sun-hour. sleeping() reports it.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in camp.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5226/?seed=1" game` prints SMOKE OK.
- A headless screenshot at `?seed=1&night=1` shows the lit Waystation fire with its light on the gatehouse roof; read it and describe it.

## Out of scope
games/dayg/src/main.ts (planner), src/game/useItem.ts (calls you), src/game/needs.ts, inventory.ts, src/game/clock.ts, src/scene/*.
~~~~

~~~~text
Epic: 3 Survival, items, Hatless, loot, feed, camp, tuning (issue 3.10 Sim tuning pass)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg. Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Nine other workers are editing game files at the same time; two of them READ the `player`, `infection` and `body`
  sections of tuning.json: never change those three sections or any key names (the Tuning type must still match).
- You change numbers only. No code changes. If a band cannot be reached by knobs, say which code rule blocks it.

## Goal
The sim's knobs are tuned so that as many scorecard bands as possible pass on 50 seeds over 60 days, and every round of
tuning is logged in TUNING_LOG.md with what moved.

## Read first
- games/dayg/src/sim/tuning.json: the knobs (sections clock, weather, npc, groups, horde, loot, market are yours).
- games/dayg/src/sim/bands.ts: the bands and their targets.
- docs/design/dayg/process.md, section "The tuning loop".
- docs/design/dayg/evaluation.md, section "Metrics and target bands" (what each band means).

## Change
- games/dayg/src/sim/tuning.json: numbers in the sections clock (ticksPerDay must stay 24), weather, npc, groups, horde, loot, market.
- games/dayg/sim/TUNING_LOG.md (new): one line per tuning round.

## Contract
- The loop, at most 12 rounds: run `npm run sim -w games/dayg -- --seeds 50 --days 60`; pick the worst failing band;
  change one or two knobs that drive it (e.g. population: npc.hatlessKill, npc.foodPerDay, loot.perGnome.food; groups:
  groups.a/b/c, groups.sigma, groups.strainK; hordeInSinks: horde.nestWeight/pitWeight/pitEscape; food left:
  loot.perGnome.food, loot.foragePerDay; volatility: market.drift, market.elasticity); rerun; keep or revert.
- Read 3 chronicles of the final tuning (`npm run sim -w games/dayg -- --chronicle 1`, 2, 3) and note in the log whether
  they read like a story (dull, chaotic, or good).
- TUNING_LOG.md line format: `R<n> | <knob old -> new> | <why> | joint <before> -> <after> | moved: <band ids>`. End with
  the final scorecard pasted in a code block.
- Do not change tests, bands, code or the player/infection/body sections.

## Done when
- `npm run sim -w games/dayg -- --seeds 50 --days 60` runs and its joint score is not lower than at the start
  (state both in the log).
- `npm test -w games/dayg -- src/sim/sim.test.ts` still passes.
- games/dayg/sim/TUNING_LOG.md lists every round.

## Out of scope
Every .ts file, bands.ts, the `player`, `infection` and `body` sections of tuning.json, and every file outside the two above.
~~~~

### Round 4, Epic 4: phone, achievements, recap, polish

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.1 Touch controls)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time (one adjusts hud.ts and inventoryPanel.ts for phones).
  Edit only the file under Change. Your dev server port is 5231: `cd games/dayg && npx vite --port 5231 --strictPort`.
- Mobile rule (AGENTS.md): every action has a touch control; targets at least 44 px (use 56-64 px); fits 390x844 portrait
  and 844x390 landscape inside env(safe-area-inset-*); no hover-only UI. Append your root to `#ui`, never restyle `#ui`.

## Goal
DayG plays on a phone: a floating move stick on the left (pushed to the edge = sprint), look by dragging on the right,
and big buttons for act, hit, climb, crouch, pack and view, matching the desktop control map.

## Read first
- games/dayg/src/game/types.ts: TouchSource { root, read(): Partial<InputState>, setVisible, setClimbHint, active }, InputState.
- games/sample-3d/src/ui/touch.ts: a working floating stick, look drag and buttons to adapt (multi-touch by pointerId).
- games/dayg/src/config.ts: DOM.touch ('dayg-touch'), LAYOUT (buttonsW 200, buttonsH 270, stickZone 0.45), CAMERA.lookSensitivity.
- docs/design/dayg/survival.md, section "Controls" (the touch column).

## Change
- games/dayg/src/ui/touch.ts: implement createTouchControls.

## Contract
export function createTouchControls(ui: HTMLElement): TouchSource;   // root id 'dayg-touch'
- Shown when (pointer: coarse) matches, or the URL has touch=1, or after the first touchstart; active() reports that.
- Stick: a touch starting in the left LAYOUT.stickZone of the width (bottom 60% of the height) places a 120 px base
  there; knob travel 60 px; moveX/moveZ from the knob (up = +moveZ); sprint = true while the knob is past 90% of travel.
- Look: a touch starting elsewhere (not on a button) drags the view: lookX/lookY = delta px x CAMERA.lookSensitivity x 1.6.
- Buttons in the bottom-right block (LAYOUT.buttonsW x LAYOUT.buttonsH, inside safe areas), round, 60 px (HIT 72 px):
  ACT (action), HIT (attack), UP (climb; glows when setClimbHint(true)), CROUCH (crouch toggle), PACK (inventory) in the
  block, and VIEW (view) as a 48 px button at the top-right under the HUD clock row (top: 72 px + safe area). Each
  button produces one edge per press (cleared after read()).
- setVisible(false) hides everything (the inventory is open, or the gnome is dead) and resets the stick.
- Landscape: the block stays bottom-right and the stick zone keeps the left 45%; portrait the same; never overlap the
  top 64 px HUD bar.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in touch.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5231/?seed=1&touch=1" dayg-touch` prints SMOKE OK.
- Phone screenshots at 390x844 and 844x390:
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-41-portrait.png" "http://localhost:5231/?seed=1&touch=1"
  (and 844,390). Read both: buttons are large, inside the screen, not over the HUD, labels readable.

## Out of scope
games/dayg/src/main.ts (planner), src/game/input.ts (already merges your read()), src/ui/hud.ts, src/ui/inventoryPanel.ts.
~~~~

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.2 Phone layout pass)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time (one is building the touch controls in src/ui/touch.ts:
  a bottom-right 200x270 px button block, a left-bottom stick zone, and a 48 px VIEW button at the top-right, 72 px down).
  Edit only the files under Change. Your dev server port is 5232: `cd games/dayg && npx vite --port 5232 --strictPort`.
- Mobile rule (AGENTS.md): 44 px+ targets, safe-area insets, portrait 390x844 and landscape 844x390, no hover-only UI.

## Goal
The HUD and the pack screen read well and never collide with the touch controls on a phone in either orientation, and
still look right on desktop.

## Read first
- games/dayg/src/ui/hud.ts and games/dayg/src/ui/inventoryPanel.ts: the current UI (you own both now).
- games/dayg/src/config.ts: LAYOUT (topBar 64, buttonsW 200, buttonsH 270, stickZone 0.45, promptBottom 120).
- games/dayg/src/game/types.ts: Hud, InventoryPanel (do not change these interfaces).

## Change
- games/dayg/src/ui/hud.ts: layout fixes only (keep the Hud contract).
- games/dayg/src/ui/inventoryPanel.ts: layout fixes only (keep the InventoryPanel contract).

## Contract
- Take screenshots first, fix, then take them again. Checks at 390x844, 844x390 and 1280x720 with `?seed=1&touch=1`,
  `?seed=1&touch=1&inv=1` and `?seed=1&touch=1&night=1`:
  - the HUD fits inside the top 64 px plus the safe-area top; the clock row leaves room for the VIEW button below it;
  - the prompt and the busy bar sit above the button block and clear of the stick zone (portrait: centred above 290 px
    from the bottom; landscape: centred in the middle third);
  - the pack screen: every button and slot >= 44 px, nothing cut off, scrolls inside itself (not the page) when long,
    the close button reachable with a thumb; in landscape it uses the right 62% and leaves the left free;
  - text at least 12 px, contrast readable over a bright sky and at night (add a soft dark backing to text if needed).
- Use CSS media queries on orientation and `max(env(safe-area-inset-*), 8px)` paddings.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in hud.ts and inventoryPanel.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5232/?seed=1&touch=1" dayg-hud dayg-inv` prints SMOKE OK.
- The before and after screenshots (Edge headless, e.g.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-42-a.png" "http://localhost:5232/?seed=1&touch=1&inv=1")
  for all three sizes are read and the report lists what changed.

## Out of scope
games/dayg/src/main.ts (planner), src/ui/touch.ts, src/ui/recap.ts, src/game/*, src/scene/*.
~~~~

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.3 Achievements)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not
  run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files of games/dayg at the same time. Edit only the files under Change. Your dev
  server port is 5233: `cd games/dayg && npx vite --port 5233 --strictPort` (background; stop it at the end).
- Achievement rule (AGENTS.md, packages/achievements/README.md): each reward is a @lawn/prefabs gear item no other
  achievement uses, with the use tag matching its slot (hand = 'hold', back = 'wear-back'). The reward prefabs
  'grave-lantern', 'funeral-ribbon' and 'moss-clump' already exist in packages/prefabs/src/catalog/dayg.ts; 'glaze-pot'
  is an existing hold item.

## Goal
DayG has four achievements with gear rewards that unlock from the game's own events: First Night, Up and Away, Scraped
Clean and Mossbreaker.

## Read first
- packages/achievements/README.md: the checklist.
- packages/achievements/src/types.ts: AchievementDef, AchievementReward (slot, prefabId, label, exclusive?).
- packages/achievements/src/catalog.ts: the ACHIEVEMENTS array (append yours at the end) and an existing game's entries for the format.
- packages/achievements/src/tracker.ts: createAchievementTracker({ ui }) -> { unlock(id), increment(id, by?) } (it takes no `game` option).
- games/dayg/src/game/bus.ts: events 'dusk', 'dawn', 'haven', 'climbed', 'infection-cured', 'hatless-destroyed'.

## Change
- packages/achievements/src/catalog.ts: append four AchievementDefs.
- games/dayg/src/game/achievements.ts: implement createDaygAchievements.

## Contract
Defs (game 'dayg', gameTitle 'DayG'):
  { id: 'dayg-first-night', title: 'First Night', description: 'Live through a night outside a haven.', reward: { slot: 'back', prefabId: 'funeral-ribbon', label: 'Funeral Ribbon' } }
  { id: 'dayg-up-and-away', title: 'Up and Away', description: 'Climb a headstone with a rope or a ladder.', reward: { slot: 'hand', prefabId: 'grave-lantern', label: 'Grave Lantern' } }
  { id: 'dayg-scraped-clean', title: 'Scraped Clean', description: 'Get the moss out of a crack before it takes you.', reward: { slot: 'hand', prefabId: 'glaze-pot', label: 'Glaze Pot' } }
  { id: 'dayg-mossbreaker', title: 'Mossbreaker', description: 'Crack the core of 10 Hatless.', target: 10, reward: { slot: 'hand', prefabId: 'moss-clump', label: 'Moss Clump', exclusive: true } }
export function createDaygAchievements(deps: { bus: Bus; ui: HTMLElement; getPlayer: () => PlayerState; clock: Clock }): void;
- tracker = createAchievementTracker({ ui: deps.ui }).
- First Night: on 'dusk' start a requestAnimationFrame loop that adds the frame's real seconds to `night` and, while
  the player is alive and player.haven === null, to `outside`; on 'dawn' stop it and, if alive and outside >= 0.5 x
  night, unlock 'dayg-first-night'.
- Up and Away: on 'climbed' with via 'rope' or 'ladder' and height >= 9, unlock.
- Scraped Clean: on 'infection-cured', unlock.
- Mossbreaker: on 'hatless-destroyed', increment.
- Never throw if the tracker's storage fails (wrap calls in try/catch; they return promises: add .catch).

## Done when
- `npm test -w packages/achievements` passes (reward prefabs exist, fit their slots, are unique).
- `npx tsc --noEmit -p games/dayg` shows no errors in achievements.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5233/?seed=1" game` prints SMOKE OK.
- In your report, describe a check that 'climbed' with via 'rope' and height 10 shows the toast (for example
  `__dayg.bus.emit('climbed', { height: 10, via: 'rope' })` in a browser console, or a temporary `?achtest=1` branch in
  YOUR file that you remove before finishing, plus a screenshot).

## Out of scope
games/dayg/src/main.ts (planner, already calls createDaygAchievements), every other packages/achievements file,
packages/prefabs (rewards already exist), other games' entries in catalog.ts.
~~~~

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.4 Death recap)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time. Edit only the files under Change. Your dev server port
  is 5234: `cd games/dayg && npx vite --port 5234 --strictPort` (background; stop it at the end).
- House style (docs/design/dayg/crafting.md "Death recap"): plain, short, second person, past tense; gnomes crack and
  shatter, never bleed. Mobile: the card fits 390x844 and 844x390, buttons >= 44 px. Append to `#ui`, never restyle it.

## Goal
When the gnome shatters, a card in the house style tells the last minute from the gnome's own event log ("You were
crouched on a headstone in the Leaning Rows. ... You fell 14 gm and cracked a leg."), how it ended, a few numbers, and
lets the player walk again.

## Read first
- games/dayg/src/game/types.ts: EventLog { lines(seconds), stats() }, Recap { show(cause, where, day, hourOfDay) }, PlayerState, Clock.
- games/dayg/src/game/bus.ts: every GameEvents entry (you turn them into sentences).
- games/dayg/src/sim/types.ts: DeathCause.
- games/dayg/src/config.ts: DOM.recap ('dayg-recap').
- docs/design/dayg/crafting.md, section "Death recap".

## Change
- games/dayg/src/game/eventLog.ts: implement createEventLog.
- games/dayg/src/ui/recap.ts: implement createRecap.

## Contract
export function createEventLog(bus: Bus, clock: Clock, getPlayer: () => PlayerState): EventLog;
- Keep entries { t: performance.now() / 1000, text } for: 'entered-region' ("You came into the Ivy Rows."; region names
  from REGIONS in src/sim/regions.ts), 'haven' ("You reached the Lychgate Waystation." / "You left ..."), 'climbed'
  ("You climbed 12 gm by rope."), 'fell' ("You fell 14 gm."), 'player-hit' (merge bursts: "A Hatless scratched you." /
  "Three Hatless had hold of you."), 'cracked' ("Your left leg cracked." with level words chip / crack / deep crack),
  'infection' ("Moss got into the crack on your right arm." / "The grey spread." / "Your hat slipped."), 'infection-cured',
  'campfire-lit', 'ate', 'drank', 'container-opened' ("You searched a crate."), 'hatless-destroyed' ("You cracked a
  Hatless's core."), 'dusk' / 'dawn' ("Night fell."). Add the stance at the moment of a hit ("You were crouched on a
  headstone" when player.pos.y > 2 and crouched). Cap 200 entries.
- lines(seconds): the texts of the last `seconds` real seconds, merged so the same sentence does not repeat back to back.
- stats(): counts of Hatless destroyed, containers searched, climbs.
export function createRecap(ui: HTMLElement, log: EventLog): Recap;
- show(cause, where, day, hourOfDay): a centred card (id 'dayg-recap', pointer-events auto, max-width 92vw, scrolls
  inside if long): a title by cause ("Shattered by the Hatless", "The moss took you", "Shattered in a fall", "The cold
  cracked you through", "Dried out", "Starved"), the last 60 s of log.lines(60) as a short paragraph (at most 8
  sentences), a line "Day 2, 23:10, in the Leaning Rows.", the stats, a note "You will rise as a Hatless in your gear."
  for causes 'hatless' and 'moss', and a 'Walk again' button (>= 48 px) that reloads the page with a new seed
  (location.search seed replaced by a new number). Show it once.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in eventLog.ts and recap.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5234/?seed=1" game` prints SMOKE OK.
- A forced death screenshot: add a temporary `?dietest=1` branch in YOUR recap.ts that calls show('hatless', ...) after
  2 s, take phone (390x844, 844x390) and desktop screenshots, read them, then remove the branch before finishing.

## Out of scope
games/dayg/src/main.ts (planner: it calls recap.show on 'player-shattered'), src/ui/hud.ts, src/game/body.ts.
~~~~

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.5 Gear on the gnome)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time. Edit only the file under Change. Your dev server port is
  5235: `cd games/dayg && npx vite --port 5235 --strictPort` (background; stop it at the end).
- Player gnome rule (AGENTS.md, packages/gnome/README.md): if the game gives the gnome its own gear, override that slot
  (setEquipmentOverride(slot, true)) instead of stacking it on the customizer's gear, and never rebuild a separate
  gnome model. Held items use buildHeld(prefabId) from @lawn/prefabs (origin at the grip).

## Goal
What the gnome carries shows on it: the held item in its right hand, the pack on its back, a helm on its head, each
overriding the player's cosmetic gear in that slot only while worn; crouch, climb, hat-slip and death poses stay right.

## Read first
- games/dayg/src/scene/playerView.ts: the current view (you own it now; keep createPlayerView's signature and PlayerView).
- games/dayg/src/game/types.ts: PlayerView, PlayerViewOpts { held, back, head, hatSlips, dead }.
- packages/gnome/README.md: "Games with their own gear" (setEquipmentOverride, overrideEquipment), GnomeModel.arms.
- packages/prefabs/README.md, section "Use it" (buildHeld, buildPrefab).
- games/dayg/src/items/defs.ts: ITEMS (prefab ids), wear slots.

## Change
- games/dayg/src/scene/playerView.ts.

## Contract
- held: when opts.held changes, remove the old held object and add buildHeld(ITEMS[held].prefab) to
  model.arms.right at the hand end (try y = -0.55 x arm length in the arm's local space; adjust by eye) scaled so it
  reads at gnome size (prefab units are gnome heights: the model's scale already applies); call
  model.setEquipmentOverride?.('hand', held !== null).
- back: a worn 'back' item (the loot-sack) -> buildPrefab(prefab) on the back (attach to model.rig, behind the chest),
  setEquipmentOverride('back', true); none -> remove and restore.
- head: a worn 'head' item -> buildPrefab on the head, hide model.hat, setEquipmentOverride('head', true); none ->
  restore the hat (unless hatSlips).
- hatSlips: tilt model.hat 0.5 rad sideways (and the head item, if any).
- Swing: when the held item changes it does not swing; add a short arm swing (0.25 s) the frame after a strike: detect it
  as p.stamina dropping by >= 8 in one frame while grounded (the main loop takes the stamina for a strike).
- dead: model.setDead(true) once.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in playerView.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5235/?seed=1" game` prints SMOKE OK.
- A headless screenshot (1280x720, `?seed=1`) shows the trowel in the gnome's hand and the sack on its back; read it,
  describe it, and adjust offsets until it looks right.

## Out of scope
games/dayg/src/main.ts (planner), src/scene/gnomes.ts, src/game/*, packages/gnome, packages/prefabs.
~~~~

~~~~text
Epic: 4 Phone, achievements, recap, polish (issue 4.6 Playtest notes, README and credits)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
- Do not run `npm install`, `git commit` or `git stash`. Five other workers are editing code at the same time; you
  write docs only.
- Voice (SOUL.md): plain, short and concrete. Say what was built, how to run it and what is not done yet.

## Goal
A human can pick up DayG and playtest it: a README with how to run and play it (desktop and touch), a playtest checklist
with the questions from the design's playtest form, and complete credits.

## Read first
- docs/design/dayg/evaluation.md, section "Playtests" (the form questions).
- games/dayg/src/config.ts: controls-related constants (MOVE, CLIMB), DOM ids.
- games/dayg/src/game/input.ts and games/dayg/src/ui/touch.ts: the actual key and button bindings (copy them exactly).
- games/dayg/src/main.ts: the URL parameters (seed, timescale, simdays, night, kit, touch, spawn) and the debug hook `__dayg`.
- games/dayg/sim/TUNING_LOG.md: the latest scorecard.

## Change
- games/dayg/README.md: replace the sample's text.
- games/dayg/PLAYTEST.md (new).
- games/dayg/CREDITS.md: confirm "no external assets"; list the @lawn/prefabs ids DayG uses and that the Hatless and
  NPCs are @lawn/gnome models.

## Contract
README.md sections: what DayG is (2-3 sentences: Mossgrave, the Hatless, a world that simulates itself); run it
(`npm run dev -w games/dayg`, http://localhost:5206), the sim (`npm run sim -w games/dayg -- --seeds 50 --days 60`,
`--chronicle 3`, `--check`), tests (`npm test -w games/dayg`); controls table (desktop | touch) for move, look, sprint,
crouch, act, attack, climb, pack, view; what is in the slice (regions, needs, moss stages, recipes, havens); URL
parameters; what is NOT done yet (multiplayer, talk and quests, the other districts, building and farming, factions and
traders); online: single-player only and why (the sim is pure so a host can run it in phase 5).
PLAYTEST.md: a checklist for one session (about 30-45 minutes) on desktop and one on a phone: start at the Waystation;
climb down the ladder; search the forecourt crate (a rope); climb a headstone with the rope; find water at the Tap;
light a fire at dusk; get scratched and treat it (salt wash or scrape and seal); sleep at the Waystation; die once and
read the recap. Then the form: did you die fairly (1-5 and why), did you change something in the world, did you want to
come back, how long did you spend walking vs doing, what confused you, phone: could you reach every button. Plus a
"what to watch" list for the observer (time to first Hatless, how often players look at needs, whether they climb).

## Done when
- The three files exist and every command and key in them matches the code (check input.ts, touch.ts and main.ts).
- `npm run lore` is not needed (no lore files changed).

## Out of scope
Every code file, docs/design, docs/roadmaps, AGENT_INDEX.md (the planner updates it).
~~~~

---

## 5. End-of-round checks (planner)

- Round 1: `npm run build -w games/dayg`, `npm test -w games/dayg`, `npm test -w packages/prefabs`, `npm test -w packages/gnome`,
  `npm run sim -w games/dayg -- --seeds 3 --days 20`; fix stub/contract drift in `main.ts` or `world.ts`.
- Round 2: the above plus `npm run sim -w games/dayg -- --seeds 50 --days 60`; dev server on 5206;
  `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-hud dayg-inv dayg-touch`; `npm run zfight -- "http://localhost:5206/?seed=1"`;
  walk, climb, look around by hand in a browser.
- Round 3: the above plus a full desktop loop (loot, eat, drink, fire, scratch, cure, sleep) with `?timescale=30`;
  Hatless counts in the forecourt match `__dayg.sim.world.promoted.hatless`; the joint score is in TUNING_LOG.md.
- Round 4: the above plus smoke and screenshots at 390x844 and 844x390 with `touch=1`; `npm test -w packages/achievements`;
  record a demo (`npm run demo -- <demo.json> --gif`, upload through the media-upload MCP, put the URL in the PR);
  commit, push, open the PR (`--repo cstabnick/lawn-gnome-panic`) stating: single-player (why), mobile supported,
  what was and was not tested (no real phone).
