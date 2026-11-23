# DayG roadmap 9: base building

Design: `docs/design/dayg/crafting.md` ("Building pieces"), `items.md` ("Building"), `hatless.md` ("Height", piles),
`havens.md`, `survival.md`. Earlier roadmap: `docs/roadmaps/dayg.md` (phases 1 to 3, the code this builds on).
Game folder: `games/dayg` (three.js), dev port **5206**. Setting: `apocrypha` (Mossgrave).

## 1. Goal

A player can claim a plot of flat ground anywhere outside a haven and build a base on it: plank walls, barricades,
doors, ladders, spike lines, a storage chest, a bed, a workbench and a fire ring, each paid from the pack with the costs
and HP in `crafting.md`. Pieces are real colliders: the Hatless push on them and wear them down (in front of the player
and, through a small sim hook, while the player is away), the player can hit, repair, reinforce or take them down, a
door can be locked with a key and a ladder can be pulled up. The base and the chest's contents are saved per world seed,
and the whole verb set works on a phone.

### In scope

- **Plot**: a 3 x 3 grid of 4 gm tiles (12 x 12 gm), snapped to 2 gm, claimed on flat ground that is not in a haven, a
  pit or two regions at once. One base per player (single-player). Abandon to claim again.
- **Pieces** (slots: 24 tile edges, 9 cells, ladders on either side of a walled edge):

  | Piece | Slot | Cost (tags) | Tools | HP | Notes |
  |---|---|---|---|---|---|
  | Plank wall | edge | PLANK 3, NAIL 6 | HAMMER | 120 | 3.2 gm high: above a 3 gm Hatless pile |
  | Barricade | edge, or over a closed door | PLANK 3, NAIL 6 | HAMMER | 80 | 2.0 gm; reinforce with PLANK 3 to 200 |
  | Door | edge | PLANK 6, HINGE 2 | HAMMER, SAW | 150 | opens (collider block removed); fit a lock (IRON 1, SPRING 1) for a key |
  | Ladder | a side of a wall or door | PLANK 4, BINDING 4 | HAMMER | 40 | a climb route; pull up in 2 s |
  | Spike line | cell | KINDLING 3 | CUT | 60 | strikes and staggers Hatless that walk through |
  | Storage chest | cell | PLANK 4, NAIL 4 | HAMMER | 100 | 30 bulk; contents saved |
  | Bed | cell | MOSS 4, BINDING 2 | none | 30 | sleep until dawn when sealed in and no Hatless near |
  | Workbench | cell | TIMBER 2, NAIL 4 | HAMMER | 100 | saw a timber log into 2 planks (SAW) |
  | Fire ring | cell | STONE 4 | none | 60 | light a fire in it (camp's fire); warmth pulls herds |

- **Building is a verb**: hold a HAMMER item, press BUILD, aim at the grid, pick a piece, a ghost shows where it goes
  (green or red with the reason), PLACE runs a timed job, then the materials are taken and the piece is placed with the
  collider updated at runtime (new `addBlock` / `removeBlock` / `removeRoute` on the collider).
- **Damage**: 1 HP per Hatless per sun-minute of pushing (`crafting.md`), hits from the player's weapon, break at 0 HP,
  repair for a third of the cost. A door that is closed but not locked bursts open under 3 pushers for 5 s.
- **Sim hook**: `WorldState.base` (null in every headless run). While the player is not in the base's region, the
  region's Hatless push it once per sim tick and its fire rings add noise; the game applies the owed damage to the
  pieces. With no base the sim's output is byte-identical, so every existing band and test is unchanged.
- **Save**: `localStorage` per world seed, debounced and on `pagehide`; a page opened without `?seed=` reuses the seed
  of the last saved base.
- **Touch**: BUILD, piece strip, PLACE, REPAIR, TAKE DOWN, EXIT, CLAIM and the chest panel are buttons of 44 px or more,
  laid out for 390x844 and 844x390 with safe-area insets. Desktop keys: B, 1 to 9, F, G, X, Esc.
- **Achievements**: First Wall (`garden-mallet`), Locked In (`hand-saw`), Held the Line (`plank`, new prefab).
- **Prefabs**: new `plank-wall`, `barricade`, `plank-door`, `spike-line` (with damage stages), `plank`, `nails`,
  `iron-hinge`, `fire-ring`; reused `ladder`, `wooden-chest`, `bedroll`, `workbench`, `garden-mallet`, `hand-saw`,
  `iron-bar`, `scrap-gear`, `brass-key`.

### Out of scope

- **Multiplayer ownership** (phase 5, `docs/design/dayg/multiplayer.md`): one comment line in `src/base/model.ts`
  marks where an owner field goes. Nothing else is designed. The PR says the base is single-player.
- NPC settlements building with the same pieces, raiders, NPCs who see you steal, theft rules for chests.
- Stone walls, pits, rope bridges, pulley lifts, garden beds, rain catchers and drying racks as pieces; the rest of the
  crafting tree (anvil, kiln, nails from iron); skills and their failure chances.
- `base` zones in the map data (the map has none; any plot that passes the claim check is allowed). A phase 6 map may add
  them later.
- Economy tuning of how many planks and nails the loot gives (the scorecard does not measure building yet).
- Cloud saves (`@lawn/cloudsave` is phase 5).
- A Gnome Party slice: the `last-ladder` backlog row in `packages/party/README.md` already says "later".
- Changing any issue of `docs/roadmaps/dayg-phases-4-8.md`. This roadmap is the "building" line of phase 7 in
  `process.md`; phases 4 to 8 should reference it instead of planning bases again.

## 2. Shape

| Epic | Name | Done when | Issues |
|---|---|---|---|
| 0 | Foundation (planner-written Step 0) | `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, `npm test -w packages/prefabs` pass; the sim's `--json` output is identical before and after; smoke passes | 0 (planner) |
| 1 | Collider hook, grid, model and save, sim hook, prefabs | build and all tests pass; `npm test -w packages/prefabs` passes; the sim `--json` output is still identical | 6 |
| 2 | Base system, view, build UI, chest UI, achievements | build and tests pass; `?basedemo=1` shows every piece; `?buildui=1` and `?chestui=1` render at 390x844 and 844x390; `npm test -w packages/achievements` passes | 5 |
| 3 | Build controller and piece actions | a full desktop loop works with `?kit=build`: claim, wall a cell, hang a door, fit a lock, sleep sealed in, Hatless push a barricade down, repair; smoke and zfight pass | 2 |
| 4 | Phone pass | the same loop on a 390x844 and 844x390 viewport with touch only; smoke at both sizes | 1 |

### Rounds

A round starts only after the previous round's end-of-round check passes (the planner runs it and fixes `main.ts`).

| Round | Epic | Issues (all parallel within the round) |
|---|---|---|
| 1 | 0 then 1 | Step 0 (planner) first; then 1.1 Collider runtime blocks, 1.2 Plot grid, 1.3 Base model and save, 1.4 Sim base hook, 1.5 Piece prefabs, 1.6 Material prefabs |
| 2 | 2 | 2.1 Base system, 2.2 Base view, 2.3 Build UI, 2.4 Chest UI, 2.5 Achievements |
| 3 | 3 | 3.1 Build controller, 3.2 Piece actions |
| 4 | 4 | 4.1 Phone layout pass |

### Ports (dev servers, one per issue, never shared)

2.2: 5291, 2.3: 5292, 2.4: 5293, 3.1: 5294, 3.2: 5295, 4.1: 5296. Start with
`cd games/dayg && npx vite --port <port> --strictPort` in the background and stop it when done. The planner uses 5206.

### Phone screenshot command (UI issues)

```sh
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-<issue>-portrait.png" "http://localhost:<port>/?seed=1&touch=1&<params>"
```
Repeat with `--window-size=844,390` (landscape), then open the PNGs with the Read tool and look at them.

### Dependencies that remain

- **Inside a round: none.**
- **Across rounds**: 2.1 and 2.2 need 1.1 to 1.6; 3.1 needs 2.1, 2.2 and 2.3; 3.2 needs 2.1, 2.2 and 2.4; 4.1 needs 3.1
  and 3.2 (it screenshots the real build flow).
- **Across roadmaps**: Step 0 edits shared planner-owned files (`src/sim/types.ts`, `src/sim/world.ts`, `src/sim/rng.ts`,
  `src/sim/tuning.json`, `src/sim/loot.ts`, `src/items/defs.ts`, `src/world/types.ts`, `src/game/bus.ts`, `src/main.ts`,
  `packages/prefabs/src/catalog/index.ts`), issue 1.1 edits `src/world/collide.ts` and issue 2.5 edits
  `packages/achievements/src/catalog.ts`. If the phases 4 to 8 roadmap has a round in flight that owns any of these, this
  roadmap waits for that round to end (one sentence: these are the integration points every DayG system shares, and
  stubs cannot split them further). The planner re-reads each file before Step 0 and applies the edits to whatever is
  there.

### Shared-file owners

| File | Owner |
|---|---|
| `games/dayg/src/main.ts` | planner (Step 0 and every end-of-round fix). No worker edits it. |
| `src/base/types.ts`, `src/base/config.ts`, `src/base/demo.ts` | planner (Step 0). Workers read them, never edit them. |
| `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/rng.ts`, `src/sim/tuning.ts`, `src/sim/tuning.json` (`base` section), `src/sim/loot.ts` (item lists only), `src/items/defs.ts`, `src/world/types.ts`, `src/game/bus.ts` | planner (Step 0 edits listed below) |
| `src/world/collide.ts`, `src/world/collide.runtime.test.ts` | 1.1 |
| `src/base/grid.ts`, `src/base/grid.test.ts` | 1.2 |
| `src/base/model.ts`, `src/base/save.ts`, `src/base/model.test.ts` | 1.3 |
| `src/sim/base.ts`, `src/sim/base.test.ts` | 1.4 |
| `packages/prefabs/src/catalog/dayg-base.ts` | 1.5 |
| `packages/prefabs/src/catalog/dayg-base-items.ts` | 1.6 |
| `packages/prefabs/src/catalog/index.ts` | planner (Step 0 registers both new files) |
| `src/base/system.ts`, `src/base/system.test.ts` | 2.1 |
| `src/base/view.ts` | 2.2 |
| `src/base/buildUi.ts` | 2.3, then 4.1 |
| `src/base/chestUi.ts` | 2.4, then 4.1 |
| `src/base/achievements.ts`, `packages/achievements/src/catalog.ts` | 2.5 |
| `src/base/build.ts` | 3.1 |
| `src/base/actions.ts` | 3.2 |

---

## 3. Step 0: foundation (planner-written)

Before anything: `npm run sim -w games/dayg -- --seeds 10 --days 30 --json > "$TEMP/dayg-sim-before.json"`.

### 3.1 `games/dayg/src/base/types.ts` (verbatim)

```ts
// Base building: every shared contract. Plain JSON-safe data. No DOM, no three.js.
import type { ItemStack, RegionId } from '../sim/types';
import type { Tag } from '../items/defs';

export type PieceKind = 'plank-wall' | 'barricade' | 'door' | 'ladder' | 'spike-line' | 'chest' | 'bed' | 'workbench' | 'fire-ring';
export const PIECE_KINDS: readonly PieceKind[] = ['plank-wall', 'barricade', 'door', 'ladder', 'spike-line', 'chest', 'bed', 'workbench', 'fire-ring'];
/** 'edge': a tile edge; 'cell': a tile; 'ladder': one side of an edge that holds a plank wall or a door. */
export type SlotKind = 'edge' | 'cell' | 'ladder';
/** 'x': the edge runs east-west (a line of constant z); 'z': it runs north-south (a line of constant x). */
export type EdgeAxis = 'x' | 'z';
/** -1 = the north side of an 'x' edge or the west side of a 'z' edge; +1 = south / east. */
export type EdgeSide = -1 | 1;
/** Edges `e:x:<i>:<j>` (i = column 0..T-1, j = line 0..T) and `e:z:<i>:<j>` (i = line 0..T, j = row 0..T-1);
 *  cells `c:<i>:<j>` (i = column, j = row, 0..T-1). T = PLOT.tiles. i grows east, j grows south. */
export type SlotKey = string;
export interface Cost { tag: Tag; count: number }
export interface PieceDef {
  kind: PieceKind; name: string; slot: SlotKind; prefab: string;
  cost: readonly Cost[]; tools: readonly Tag[];   // tools: one item with each tag must be in the inventory
  hp: number; seconds: number;                    // seconds: real seconds of building
  height: number;                                 // gm; the collider block's height (0 = no block)
  solid: boolean;                                 // gets a collider block (a door only while closed)
}
/** North-west corner and floor height. The plot is PLOT.tiles x PLOT.tile gm on each side. */
export interface PlotDef { x0: number; z0: number; y: number; region: RegionId }
export interface PieceState {
  id: string;                 // 'piece-<n>'; also the collider block id
  kind: PieceKind;
  slot: SlotKey;              // ladders use the edge key of the wall they lean on
  side: EdgeSide;             // ladders and barricades over a door: the side they are on; 1 for every other piece
  hp: number; maxHp: number;
  open: boolean;              // doors
  hasLock: boolean;           // doors
  locked: boolean;            // doors
  up: boolean;                // ladders: pulled up (no climb route)
  reinforced: boolean;        // barricades
  overDoor: boolean;          // barricades nailed over a closed door on the same edge
  items: ItemStack[];         // chests
}
export interface BaseState { version: 1; seed: number; plot: PlotDef; pieces: PieceState[]; nextId: number }
/** An axis-aligned box, same meaning as BlockDef: x0..x1, z0..z1, from y to y + h. */
export interface Box { x0: number; x1: number; z0: number; z1: number; y: number; h: number }
/** Where a piece's mesh root sits; rotY in radians (three.js rotation.y; 0 = the prefab's front faces +z). */
export interface Placement { x: number; y: number; z: number; rotY: number }
export type ClaimResult = { ok: true; plot: PlotDef } | { ok: false; why: string };
export interface Aim { slot: SlotKey; kind: SlotKind; side: EdgeSide }
export type DamageCause = 'push' | 'hit' | 'away';
```

### 3.2 `games/dayg/src/base/config.ts` (verbatim)

```ts
// Base building numbers (docs/design/dayg/crafting.md "Building pieces"). Game-side constants, like src/config.ts.
import type { ItemStack } from '../sim/types';
import type { ItemId } from '../sim/types';
import type { Tag } from '../items/defs';
import type { Cost, PieceDef, PieceKind } from './types';

export const PLOT = { tiles: 3, tile: 4, snap: 2, thickness: 0.4, inset: 0.25, flatTolerance: 0.3 } as const;
export const PLOT_SIZE = PLOT.tiles * PLOT.tile;      // 12 gm
export const BUILD_REACH = 3;                           // the aim point is this far ahead of the player, gm
export const BUILD_RANGE = 6;                           // build mode works within this margin around the plot, gm
export const BUILD_NOISE = 20;                          // noise radius when a piece goes up, gm
export const PUSH = { radius: 2.4, hpPerHatlessSunMinute: 1, doorBurstPushers: 3, doorBurstSeconds: 5 } as const;
export const SPIKE = { everySec: 1, reach: 2.2, damage: 0.5, wearPerHit: 2 } as const;
export const HIT = { hpPerDamage: 10 } as const;        // a weapon's damage x this = HP off a piece
export const REPAIR = { costShare: 1 / 3, seconds: 10 } as const;
export const DISMANTLE = { refundShare: 0.5, seconds: 8 } as const;
export const REINFORCE = { cost: [{ tag: 'PLANK', count: 3 }] as readonly Cost[], hp: 200, seconds: 30 } as const;
export const LOCK = { cost: [{ tag: 'IRON', count: 1 }, { tag: 'SPRING', count: 1 }] as readonly Cost[], tools: ['HAMMER'] as readonly Tag[], seconds: 30, key: 'brass-key' } as const;
export const LADDER_PULL_SECONDS = 2;
export const SAW_PLANKS = { input: { tag: 'TIMBER', count: 1 } as Cost, tool: 'SAW' as Tag, out: 'plank' as ItemId, outCount: 2, seconds: 30 } as const;
export const FIRE_RING = { burnHours: 2, seconds: 20 } as const;
export const CHEST_BULK = 30;
export const BED = { hatlessRadius: 15, sleepRate: 30, restRate: 10, restSunHours: 1 } as const;
export const SAVE = { prefix: 'dayg.base.v1.', lastSeedKey: 'dayg.base.last', debounceSec: 1 } as const;
export const BASE_DOM = { build: 'dayg-build', chest: 'dayg-chest' } as const;
/** The item a refund or an output of each cost tag becomes. */
export const TAG_ITEM: Partial<Record<Tag, ItemId>> = {
  PLANK: 'plank', NAIL: 'nails', HINGE: 'iron-hinge', BINDING: 'spider-silk', KINDLING: 'twig-bundle',
  MOSS: 'moss-clump', TIMBER: 'timber-log', STONE: 'stone-chunk', IRON: 'iron-bar', SPRING: 'scrap-gear',
};
const p = (kind: PieceKind, name: string, slot: PieceDef['slot'], prefab: string, cost: Cost[], tools: Tag[],
           hp: number, seconds: number, height: number, solid: boolean): PieceDef =>
  ({ kind, name, slot, prefab, cost, tools, hp, seconds, height, solid });
export const PIECES: Readonly<Record<PieceKind, PieceDef>> = {
  'plank-wall': p('plank-wall', 'Plank wall', 'edge', 'plank-wall', [{ tag: 'PLANK', count: 3 }, { tag: 'NAIL', count: 6 }], ['HAMMER'], 120, 45, 3.2, true),
  barricade: p('barricade', 'Barricade', 'edge', 'barricade', [{ tag: 'PLANK', count: 3 }, { tag: 'NAIL', count: 6 }], ['HAMMER'], 80, 45, 2.0, true),
  door: p('door', 'Door', 'edge', 'plank-door', [{ tag: 'PLANK', count: 6 }, { tag: 'HINGE', count: 2 }], ['HAMMER', 'SAW'], 150, 60, 3.2, true),
  ladder: p('ladder', 'Ladder', 'ladder', 'ladder', [{ tag: 'PLANK', count: 4 }, { tag: 'BINDING', count: 4 }], ['HAMMER'], 40, 30, 0, false),
  'spike-line': p('spike-line', 'Spike line', 'cell', 'spike-line', [{ tag: 'KINDLING', count: 3 }], ['CUT'], 60, 25, 0, false),
  chest: p('chest', 'Storage chest', 'cell', 'wooden-chest', [{ tag: 'PLANK', count: 4 }, { tag: 'NAIL', count: 4 }], ['HAMMER'], 100, 40, 0, false),
  bed: p('bed', 'Bed', 'cell', 'bedroll', [{ tag: 'MOSS', count: 4 }, { tag: 'BINDING', count: 2 }], [], 30, 20, 0, false),
  workbench: p('workbench', 'Workbench', 'cell', 'workbench', [{ tag: 'TIMBER', count: 2 }, { tag: 'NAIL', count: 4 }], ['HAMMER'], 100, 40, 0, false),
  'fire-ring': p('fire-ring', 'Fire ring', 'cell', 'fire-ring', [{ tag: 'STONE', count: 4 }], [], 60, 20, 0, false),
};
/** ?kit=build adds this to the start kit (items that do not fit are dropped; that is fine for testing). */
export const BUILD_KIT: readonly ItemStack[] = [
  { def: 'garden-mallet', count: 1, condition: 1 }, { def: 'hand-saw', count: 1, condition: 1 },
  { def: 'plank', count: 12, condition: 1 }, { def: 'nails', count: 24, condition: 1 },
  { def: 'iron-hinge', count: 2, condition: 1 }, { def: 'iron-bar', count: 1, condition: 1 },
  { def: 'scrap-gear', count: 1, condition: 1 }, { def: 'stone-chunk', count: 4, condition: 1 },
  { def: 'moss-clump', count: 4, condition: 1 }, { def: 'spider-silk', count: 6, condition: 1 },
];
```

### 3.3 Edits to shared files

- `src/items/defs.ts`: add to `Tag`: `'PLANK' | 'NAIL' | 'HINGE' | 'HAMMER' | 'SAW' | 'KEY' | 'IRON' | 'SPRING' | 'TIMBER' | 'STONE'`.
  Append `'TIMBER'` to `timber-log`'s tags and `'STONE'` to `stone-chunk`'s. Append to `ITEM_LIST`:
  ```ts
  d('plank', 'Plank', 'materials', ['MATERIAL', 'PLANK'], 0.3, 0.4, 12),
  d('nails', 'Nails', 'materials', ['MATERIAL', 'NAIL'], 0.02, 0.05, 30),
  d('iron-hinge', 'Iron hinge', 'materials', ['MATERIAL', 'HINGE'], 0.2, 0.2, 4),
  d('iron-bar', 'Iron bar', 'materials', ['MATERIAL', 'IRON'], 1.0, 0.5, 4),
  d('scrap-gear', 'Scrap gear', 'materials', ['MATERIAL', 'SPRING'], 0.2, 0.2, 6),
  d('garden-mallet', 'Garden mallet', 'tools', ['HAMMER', 'BLUNT'], 0.9, 1.5, 1, { damage: 1.4, reach: 1.2 }),
  d('hand-saw', 'Hand saw', 'tools', ['SAW', 'CUT'], 0.5, 1, 1, { damage: 0.8, reach: 1.0 }),
  d('brass-key', 'Brass key', 'tools', ['KEY'], 0.05, 0.05, 1),
  ```
- `src/sim/loot.ts` `CONTAINER_TABLES` (item lists only; weights, rolls and resources unchanged, so the rng draws per roll
  are the same): crate tools `+ 'garden-mallet', 'hand-saw'`; crate materials `+ 'plank', 'nails', 'iron-hinge', 'iron-bar', 'scrap-gear'`;
  bin materials `+ 'nails', 'scrap-gear'`; camp-cache tools `+ 'garden-mallet'`; sack materials `+ 'plank'`.
- `src/world/types.ts`: add `'piece'` to `BlockKind`.
- `src/sim/rng.ts`: add `'base'` to `StreamName` and to the end of `STREAM_NAMES` (each stream is seeded from its own name,
  so the others do not change).
- `src/sim/types.ts`:
  ```ts
  /** The player's base as the sim sees it (roadmap 9). */
  export interface SimBase { region: RegionId; x: number; z: number; hp: number; maxHp: number; warmth: number; pending: number; fallenTick: number | null }
  // WorldState: base: SimBase | null;   // null in every headless run
  // Tuning:     base: { pushShare: number; pushCap: number; hpPerPusherMinute: number; noisePerWarmth: number };
  ```
- `src/sim/tuning.json`: `"base": { "pushShare": 0.02, "pushCap": 10, "hpPerPusherMinute": 1, "noisePerWarmth": 2 }`.
- `src/sim/world.ts`: `createWorld` sets `base: null`; `stepWorld` calls `stepBase(w, s.base)` right after `stepHorde`.
  `hashWorld` is unchanged (it does not include `base`).
- `src/game/bus.ts` `GameEvents` (import `PieceKind`, `DamageCause` from `../base/types`):
  ```ts
  'base-claimed': { region: RegionId; x: number; z: number };
  'base-abandoned': { region: RegionId };
  'piece-placed': { id: string; kind: PieceKind };
  'piece-damaged': { id: string; kind: PieceKind; hp: number; maxHp: number; cause: DamageCause };
  'piece-broken': { id: string; kind: PieceKind; cause: DamageCause };
  'piece-repaired': { id: string; kind: PieceKind };
  'base-slept': { hours: number; sealed: boolean; locked: boolean };
  ```
- `packages/prefabs/src/catalog/index.ts`: import and spread `DAYG_BASE` from `./dayg-base` and `DAYG_BASE_ITEMS` from
  `./dayg-base-items`, both created as `export const ... : readonly PrefabDef[] = [];` with a one-line header comment.

### 3.4 Stubs (final signatures, trivial bodies; the owning issue replaces the body)

| File | Exports | Stub body | Owner |
|---|---|---|---|
| `src/sim/base.ts` | `setSimBase(w: WorldState, b: { region: RegionId; x: number; z: number; hp: number; maxHp: number; warmth: number } \| null): void`, `stepBase(w: WorldState, rng: Rng): void`, `takeBaseDamage(w: WorldState): number` | sets `w.base` (pending 0, fallenTick null) or null; no-op; 0 | 1.4 |
| `src/base/grid.ts` | see issue 1.2 Contract | trivial values (null, [], false, zero boxes) | 1.2 |
| `src/base/model.ts` | see issue 1.3 Contract | `createBase` real; others no-op / `null` / `[]` | 1.3 |
| `src/base/save.ts` | `loadBase(seed: number): BaseState \| null`, `saveBase(base: BaseState): void`, `clearBase(seed: number): void`, `lastBaseSeed(): number \| null` | null; no-op; no-op; null | 1.3 |
| `src/base/system.ts` | `BaseDeps`, `BaseSystem`, `createBaseSystem(deps: BaseDeps): BaseSystem` (issue 2.1) | state null, everything a no-op | 2.1 |
| `src/base/view.ts` | `BaseView`, `createBaseView(scene: THREE.Scene): BaseView` (issue 2.2) | no-op | 2.2 |
| `src/base/buildUi.ts` | `BuildUiState`, `BuildUiHandlers`, `BuildUi`, `createBuildUi(ui: HTMLElement, h: BuildUiHandlers): BuildUi` (issue 2.3) | hidden div `#dayg-build` | 2.3 |
| `src/base/chestUi.ts` | `ChestUi`, `createChestUi(ui: HTMLElement, deps: { inv: InventorySystem; capacityBulk: number }): ChestUi` (issue 2.4) | hidden div `#dayg-chest` | 2.4 |
| `src/base/achievements.ts` | `createBaseAchievements(deps: { bus: Bus; ui: HTMLElement }): void` | no-op | 2.5 |
| `src/base/build.ts` | `BuildDeps`, `BuildController`, `createBuildController(deps: BuildDeps): BuildController` (issue 3.1) | creates `createBuildUi(deps.ui, noop handlers)`; with `?buildui=1` or `?buildui=claim` it shows the sample state below; `active()` false | 3.1 |
| `src/base/actions.ts` | `PieceActionDeps`, `PieceActions`, `createPieceActions(deps: PieceActionDeps): PieceActions` (issue 3.2) | no-op, `sleeping()` false | 3.2 |

Sample states the `build.ts` stub shows (issue 3.1 must keep this debug path):
`?buildui=1`: `{ mode: 'build', canBuild: true, claim: null, pieces: <every PIECES entry, affordable for the first four>, selected: 'plank-wall', target: { name: 'Plank wall', hp: 70, maxHp: 120, repair: 'PLANK 1, NAIL 2', canRepair: true, canDismantle: true, action: { label: 'Reinforce', enabled: false } }, status: 'Plank wall: 45 s', baseHp: { hp: 430, maxHp: 600 } }`.
`?buildui=claim`: `{ mode: 'claim', canBuild: true, claim: { ok: false, why: 'The ground is not flat here.' }, pieces: [], selected: null, target: null, status: null, baseHp: null }`.

`src/base/demo.ts` (planner): `export function demoBase(seed: number): BaseState` on the plot `{ x0: 320, z0: 410, y: 0, region: 'forecourt' }`
(open gravel in the Forecourt) with one of each piece: plank walls on `e:x:0:0`, `e:x:1:0`, `e:z:0:0`; a door on
`e:x:2:0` (closed, `hasLock: true`); a barricade on `e:z:3:0` and one over the door (`side: 1`); a ladder on `e:x:0:0`
side -1 and one pulled up on `e:x:1:0` side -1; a damaged wall (`hp: 30`) on `e:z:0:1`; spike line `c:0:2`, chest
`c:1:1`, bed `c:2:1`, workbench `c:0:1`, fire ring `c:1:2`. View it with `?basedemo=1&spawn=326,402`.

### 3.5 `src/main.ts` wiring (planner)

- Seed: when `?seed` is missing, use `lastBaseSeed()` if it is not null, else the random seed as now.
- Kit: `kit=build` adds `BUILD_KIT` (as `kit=climb` adds `CLIMB_KIT`).
- After `createContainerSystem(...)`:
  ```ts
  const base = createBaseSystem({ seed, world, collider, bus, hatless, camp, getPlayer });
  const baseView = createBaseView(scene);
  const demo = params.get('basedemo') === '1';
  baseView.sync(demo ? demoBase(seed) : base.state());
  if (!demo) base.onChange(() => baseView.sync(base.state()));
  const chestUi = createChestUi(ui, { inv, capacityBulk: CHEST_BULK });
  const build = createBuildController({ base, view: baseView, ui, inv, collider, bus, getPlayer, getAim: () => rig.yaw });
  const pieceActions = createPieceActions({ base, view: baseView, interact, inv, bus, clock, camp, hatless, getPlayer, chest: chestUi });
  createBaseAchievements({ bus, ui });
  if (params.get('build') === '1') requestAnimationFrame(() => build.open());
  if (params.get('chestui') === '1') { const demoItems: ItemStack[] = [{ def: 'plank', count: 4, condition: 1 }]; chestUi.open('Storage chest', () => demoItems, () => {}); }
  ```
- Frame: movement is blocked also while `chestUi.isOpen()` or `base.busy() !== null`; `touch.setVisible(!panel.isOpen() && !chestUi.isOpen() && player.alive)`;
  `if (build.active()) inp.attack = false;` attack: `const hits = hatless.strike(...); if (hits === 0) base.strike(player.pos, player.facing, reach, damage);`;
  after `camp.update`: `base.update(dt, hours); build.update(dt); pieceActions.update(dt); baseView.update(dt);`;
  needs `inHaven: player.haven !== null || base.sealedAt(player.pos)`; HUD `busy: use.busy() ?? base.busy()`.
- `window.__dayg` gains `base, build, chestUi`.

### 3.6 Step 0 checks

- `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, `npm test -w packages/prefabs`.
- `npm run sim -w games/dayg -- --seeds 10 --days 30 --json > "$TEMP/dayg-sim-after.json"` and
  `cmp "$TEMP/dayg-sim-before.json" "$TEMP/dayg-sim-after.json"` (must be identical: no base, no change).
- `npm run dev -w games/dayg`, then `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-hud dayg-inv dayg-touch dayg-build dayg-chest`.

---

## 4. Issues

### Round 1, Epic 1: collider hook, grid, model and save, sim hook, prefabs

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.1 Collider runtime blocks)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files of games/dayg and packages/prefabs at the same time. Edit only the files
  under Change. If tsc reports errors in a file you do not own, that is someone else's work in progress: ignore it,
  but your files must have none.
- collide.ts is pure: no DOM, no three.js. Every existing behaviour and the existing test file must keep passing.

## Goal
The collider accepts blocks and loses blocks and routes at runtime, so built pieces (walls, doors, barricades) collide
and ladders can be pulled up.

## Read first
- games/dayg/src/world/collide.ts: the whole file. Blocks live in `blocks` (Map id -> BlockDef) and in `grid`
  (Map cellKey -> BlockDef[], CELL = 16 gm); routes in the `routes` array.
- games/dayg/src/world/types.ts: BlockDef, ClimbRouteDef (BlockKind now includes 'piece').
- games/dayg/src/world/collide.test.ts: how tests build a small map (copy that style; do not edit this file).

## Change
- games/dayg/src/world/collide.ts: add three methods to the `Collider` interface and its implementation:
  - `addBlock(b: BlockDef): void`: if a block with b.id exists, remove it first (as removeBlock); then put b in
    `blocks` and in every grid cell its rect touches (same loops as the constructor). Factor the constructor's insert
    into a helper `indexBlock(b)` and reuse it.
  - `removeBlock(id: string): boolean`: delete from `blocks` and from every grid cell list that holds it (compare by
    the stored object; drop a cell entry whose list becomes empty). false if there was none. Routes on that block stay
    registered (they work again if the block comes back).
  - `removeRoute(id: string): boolean`: remove the route with that id from `routes` (map or placed). false if none.
  Every query (`groundAt`, `move`, `faceAhead`, `edgeAhead`, `blockById`) must see runtime blocks exactly like map blocks.
- games/dayg/src/world/collide.runtime.test.ts (new, vitest): with a tiny BlockoutMap (no blocks, no pits; regions come
  from src/sim/regions.ts, so use points inside the Forecourt, e.g. x 320..340, z 410..430):
  1. `addBlock({ id: 'piece-1', kind: 'piece', x0: 325, x1: 328.5, z0: 409.8, z1: 410.2, y: 0, h: 3.2 })`, then `move`
     from (326, 0, 412) by dz = -4 with radius 0.45, height 1.7, stepUp 0.5 returns 'piece-1' and stops at z >= 410.65.
  2. `groundAt(326, 410, 5)` is 3.2 after addBlock; 0 after `removeBlock('piece-1')`, which returns true (again: false).
  3. `faceAhead` from (326, 0, 412) facing Math.PI (towards -z), reach 2, stepUp 0.5, tolerance 2 hits 'piece-1' side 's';
     after `addRoute({ id: 'r1', block: 'piece-1', side: 's', kind: 'ladder', at: 1.75 })` its `routes` has r1; after
     `removeRoute('r1')` (true) it has none.
  4. addBlock twice with the same id and a different rect: only the second rect blocks.

## Contract
```ts
export interface Collider {
  // ...every existing member unchanged...
  /** Adds a runtime block (indexed like map blocks); a block with the same id is replaced. */
  addBlock(b: BlockDef): void;
  /** Removes a runtime or map block by id; false when there was none. Its routes stay registered. */
  removeBlock(id: string): boolean;
  /** Removes a placed or map route by id; false when there was none. */
  removeRoute(id: string): boolean;
}
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in collide.ts or collide.runtime.test.ts.
- `cd games/dayg && npx vitest run src/world/collide.test.ts src/world/collide.runtime.test.ts` passes.

## Out of scope
Every other file, including collide.test.ts, world/types.ts, blockout.ts and the scene code.
~~~~

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.2 Plot grid)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time. Edit only the files under Change. If tsc reports errors
  in a file you do not own, ignore them; your files must have none. Keep every exported signature exactly as in Contract.
- grid.ts is pure: no DOM, no three.js, no Math.random. Coordinates are gm; x grows east, z grows south; facing f means
  forward = (Math.sin(f), Math.cos(f)).

## Goal
All base geometry as pure functions: where a plot can be claimed, how slots are named, which slot the player aims at,
each piece's collider box, mesh placement and ladder route, and which cells are sealed in.

## Read first
- games/dayg/src/base/types.ts: PlotDef, PieceState, BaseState, SlotKey (key formats), Aim, Box, Placement, ClaimResult.
- games/dayg/src/base/config.ts: PLOT { tiles 3, tile 4, snap 2, thickness 0.4, inset 0.25, flatTolerance 0.3 },
  PLOT_SIZE 12, BUILD_REACH 3, PIECES (slot, height, solid per kind).
- games/dayg/src/world/collide.ts: the Collider interface only (groundAt, baseAt, move, regionAt, havenAt, inBounds).
- games/dayg/src/sim/regions.ts: REGIONS (RegionDef.traits; 'HAVEN').

## Change
- games/dayg/src/base/grid.ts: replace the stub bodies (signatures in Contract). T = PLOT.tiles, S = PLOT.tile.
  - `snapPlot(x, z)`: x0 = PLOT.snap * Math.round((x - PLOT_SIZE / 2) / PLOT.snap), same for z0.
  - `claimCheck(collider, x, y, z)`: {x0, z0} = snapPlot(x, z); region = collider.regionAt(x0 + 6, z0 + 6), null ->
    'Off the map.' For the 16 grid points (x0 + a*S, z0 + b*S), a, b in 0..3, in this order of checks:
    !inBounds -> 'Off the map.'; regionAt !== region -> 'This spot straddles two places.'; baseAt !== 0 ->
    'You cannot build in a pit.'; havenAt(px, y, pz) !== null -> 'Too close to a haven.';
    Math.abs(groundAt(px, pz, y + 0.1) - y) > PLOT.flatTolerance -> 'The ground is not flat here.'
    Then the region's RegionDef traits include 'HAVEN' -> 'Too close to a haven.'
    Then for px = x0 + 0.5, x0 + 1.5 ... x0 + 11.5 and the same pz (144 probes):
    `collider.move({ x: px, y, z: pz }, 0, 0, 0.3, 1.7, 0.5, out) !== null` -> 'Something is in the way.'
    Else `{ ok: true, plot: { x0, z0, y, region } }`.
  - `plotContains(plot, x, z, margin = 0)`: x0 - margin <= x <= x0 + 12 + margin, same for z.
  - `plotCenter(plot)`: { x: x0 + 6, z: z0 + 6 }.
  - `edgeKey(axis, i, j)` -> `e:${axis}:${i}:${j}`; `cellKey(i, j)` -> `c:${i}:${j}`; `parseSlot(key)` -> the parts or null
    for anything malformed or out of range ('x' edges: i 0..T-1, j 0..T; 'z' edges: i 0..T, j 0..T-1; cells 0..T-1).
  - `allEdges()`: 'x' edges (j outer 0..T, i inner 0..T-1), then 'z' edges (i outer 0..T, j inner 0..T-1): 24 keys.
    `allCells()`: j outer, i inner: 9 keys. `isPerimeter(key)`: 'x' edge with j 0 or T, 'z' edge with i 0 or T.
  - `edgeCenter(plot, key)`: 'x': (x0 + (i + 0.5)*S, z0 + j*S); 'z': (x0 + i*S, z0 + (j + 0.5)*S).
    `cellCenter(plot, key)`: (x0 + (i + 0.5)*S, z0 + (j + 0.5)*S). Both return { x, z }.
  - `aimAt(plot, x, z, facing, kind)`: aim point a = (x + sin f * BUILD_REACH, z + cos f * BUILD_REACH); null when
    !plotContains(plot, ax, az, 0.5). 'cell': i = clamp(floor((ax - x0)/S), 0, T-1), j likewise -> { slot: cellKey,
    kind: 'cell', side: 1 }. 'edge' and 'ladder': nearest 'x' edge (j = clamp(round((az - z0)/S), 0, T), i = clamp(floor(
    (ax - x0)/S), 0, T-1), distance |az - (z0 + j*S)|) and nearest 'z' edge (i = clamp(round((ax - x0)/S), 0, T),
    j = clamp(floor((az - z0)/S), 0, T-1), distance |ax - (x0 + i*S)|); take the smaller (tie: 'x'); null when that
    distance > 1.5. side = the side of that line the PLAYER (x, z) is on: 'x' edge: z < line ? -1 : 1; 'z': x < line ? -1 : 1.
    Returns { slot, kind (the kind asked for), side }.
  - `pieceBox(plot, piece)`: null unless PIECES[kind].solid, and null for an open door. Edge pieces: along the edge from
    (line start + PLOT.inset) to (line end - PLOT.inset); across [line - t/2, line + t/2] with t = PLOT.thickness;
    y = plot.y; h = PIECES[kind].height. A barricade with overDoor: across centre c = line + side * (t/2 + 0.15),
    across [c - 0.1, c + 0.1] (it sits in front of the door, never sharing a face with it).
  - `piecePlacement(plot, piece)`: edge pieces: the box centre in x and z (use the overDoor centre for such barricades;
    a door's placement is its closed box centre even when open), y = plot.y, rotY = axis 'x' ? 0 : -Math.PI/2.
    Ladders: centred along the edge, 0.6 gm out from the wall face on piece.side: 'x' edge z = line + side*(t/2 + 0.6),
    rotY = side === -1 ? 0 : Math.PI; 'z' edge x = line + side*(t/2 + 0.6), rotY = side === -1 ? Math.PI/2 : -Math.PI/2
    (the prefab front, +z, faces the wall). Cells: the cell centre, rotY 0.
  - `doorHinge(plot, piece)`: the door box's west end ('x' edge: { x: box.x0, z: line }) or north end ('z' edge:
    { x: line, z: box.z0 }).
  - `ladderRoute(piece, wall)`: { id: `${piece.id}-route`, block: wall.id, side, kind: 'ladder', at: (S - 2*PLOT.inset)/2 }
    with side: wall on an 'x' edge: piece.side -1 -> 'n', 1 -> 's'; on a 'z' edge: -1 -> 'w', 1 -> 'e'.
  - `sealedCells(base)`: boolean[] indexed j*T + i. An edge is closed when it holds a plank-wall, a barricade (overDoor
    or not) or a door with open false. Flood fill from outside: a cell is reachable when one of its perimeter edges is
    open, or it shares an open edge with a reachable cell. sealed = not reachable.
  - `sealedAt(base, x, z)`: the cell under (x, z) when plotContains(plot, x, z), else false.
  - `boxHitsCircle(box, x, z, r)`: distance from (x, z) to the nearest point of the box's xz rect < r.
- games/dayg/src/base/grid.test.ts (new, vitest): snapPlot(326, 416) -> { x0: 320, z0: 410 }; key round trips and
  rejects ('e:x:3:0', 'c:3:0', 'q'); allEdges has 24 unique keys, 12 perimeter; on plot { x0: 320, z0: 410 }, aimAt
  from (326, 407.5) facing 0 (south, aim point (326, 410.5)) with kind 'edge' gives { slot: 'e:x:1:0', side: -1 }, from
  (326, 405) facing 0 gives null (aim point outside the plot), and from (326, 416) facing 0 with kind 'cell' gives
  'c:1:2'; pieceBox of a plank wall on 'e:x:0:0' of plot
  {320, 410} is { x0: 320.25, x1: 323.75, z0: 409.8, z1: 410.2, y: 0, h: 3.2 }; no two boxes of walls on all 24 edges
  overlap or touch (every pair is apart by > 0.01 in x or z); an open door -> null; sealedCells: empty base all false,
  12 perimeter walls all true, one perimeter door open all false, walls round cell c:0:0 only -> index 0 true, rest
  false; ladderRoute side mapping for all four cases. For claimCheck, use a fake Collider object (every method a
  small lambda) for: ok on flat open ground, 'The ground is not flat here.' when groundAt returns 1 at one point,
  'Something is in the way.' when move returns 'x' at one probe.

## Contract
```ts
import type { Collider } from '../world/collide';
import type { ClimbRouteDef } from '../world/types';
import type { Aim, BaseState, Box, ClaimResult, EdgeAxis, PieceState, Placement, PlotDef, SlotKey, SlotKind } from './types';
export type ParsedSlot = { kind: 'edge'; axis: EdgeAxis; i: number; j: number } | { kind: 'cell'; i: number; j: number };
export function snapPlot(x: number, z: number): { x0: number; z0: number };
export function claimCheck(collider: Collider, x: number, y: number, z: number): ClaimResult;
export function plotContains(plot: PlotDef, x: number, z: number, margin?: number): boolean;
export function plotCenter(plot: PlotDef): { x: number; z: number };
export function edgeKey(axis: EdgeAxis, i: number, j: number): SlotKey;
export function cellKey(i: number, j: number): SlotKey;
export function parseSlot(key: SlotKey): ParsedSlot | null;
export function allEdges(): SlotKey[];
export function allCells(): SlotKey[];
export function isPerimeter(key: SlotKey): boolean;
export function edgeCenter(plot: PlotDef, key: SlotKey): { x: number; z: number };
export function cellCenter(plot: PlotDef, key: SlotKey): { x: number; z: number };
export function aimAt(plot: PlotDef, x: number, z: number, facing: number, kind: SlotKind): Aim | null;
export function pieceBox(plot: PlotDef, piece: Pick<PieceState, 'kind' | 'slot' | 'side' | 'overDoor' | 'open'>): Box | null;
export function piecePlacement(plot: PlotDef, piece: Pick<PieceState, 'kind' | 'slot' | 'side' | 'overDoor'>): Placement;
export function doorHinge(plot: PlotDef, piece: Pick<PieceState, 'slot'>): { x: number; z: number };
export function ladderRoute(piece: Pick<PieceState, 'id' | 'side'>, wall: Pick<PieceState, 'id' | 'slot'>): ClimbRouteDef;
export function sealedCells(base: BaseState): boolean[];
export function sealedAt(base: BaseState, x: number, z: number): boolean;
export function boxHitsCircle(box: Box, x: number, z: number, r: number): boolean;
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in grid.ts or grid.test.ts.
- `cd games/dayg && npx vitest run src/base/grid.test.ts` passes.

## Out of scope
Every other file. Do not edit types.ts or config.ts (if a number there looks wrong, say so in your report).
~~~~

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.3 Base model and save)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time (grid.ts among them: do NOT import from it). Edit only
  the files under Change. If tsc reports errors in a file you do not own, ignore them; yours must have none. Keep every
  exported signature exactly as in Contract.
- model.ts is pure: no DOM, no three.js, no Math.random. save.ts is the only file that touches localStorage, always
  inside try/catch (it may be missing or throw, e.g. in tests and private windows).

## Goal
The base's state changes as pure functions (place, damage, repair, reinforce, take down, doors, ladders), with
validation and JSON (de)serialisation, plus a localStorage save keyed by the world seed.

## Read first
- games/dayg/src/base/types.ts: BaseState, PieceState (every field), Aim, Cost, PieceKind, PIECE_KINDS, SlotKey formats.
- games/dayg/src/base/config.ts: PIECES, REPAIR { costShare 1/3 }, DISMANTLE { refundShare 0.5 }, REINFORCE { cost, hp 200 },
  SAVE { prefix 'dayg.base.v1.', lastSeedKey 'dayg.base.last' }.
- games/dayg/src/base/model.ts and save.ts: the stubs you replace.

## Change
- games/dayg/src/base/model.ts (signatures in Contract). "Barrier" = a plank-wall, a door, or a barricade with
  overDoor false. Functions mutate `base` in place.
  - `createBase(seed, plot)`: { version: 1, seed, plot, pieces: [], nextId: 1 }.
  - `findPiece`, `piecesOn(base, slot)` (array order), `barrierOn(base, slot)`.
  - `canPlace(base, kind, aim)`: null when allowed, else the reason:
    PIECES[kind].slot !== aim.kind -> 'That does not go there.';
    'edge': kind 'barricade' is allowed over a door when barrierOn is a door with open false and no barricade with
    overDoor is on that slot yet; otherwise any barrier on the slot -> 'Something is already built here.';
    'ladder': barrierOn must be a plank-wall or a door, else 'A ladder needs a wall to lean on.'; a ladder on the same
    slot with the same side -> 'There is a ladder here already.';
    'cell': any piece on the slot -> 'Something is already built here.'
  - `placePiece(base, kind, aim)`: (call only after canPlace returned null) id `piece-${base.nextId++}`, hp = maxHp =
    PIECES[kind].hp, overDoor = kind === 'barricade' && barrierOn(...)?.kind === 'door', side = (ladder or overDoor) ?
    aim.side : 1, every boolean false, items []. Pushes and returns it.
  - `damagePiece(base, id, amount)`: hp -= amount; when hp <= 0 the piece is removed and so are, if it was a plank-wall
    or a door, the ladders on its slot. Returns the removed pieces (empty when it still stands). A barricade over a
    broken door stays.
  - `repairCost(piece)`: for each line of PIECES[kind].cost (plus REINFORCE.cost when reinforced), count =
    Math.ceil(line.count * REPAIR.costShare); lines with the same tag merged. `repairPiece`: hp = maxHp.
  - `reinforcePiece(base, id)`: barricades only: reinforced = true, maxHp = hp = REINFORCE.hp.
  - `dismantlePiece(base, id)`: removes it (and ladders on it, as damagePiece); refund = Math.floor(count *
    DISMANTLE.refundShare) per cost line (plus REINFORCE.cost when reinforced), zero lines dropped, same tags merged.
  - `setDoorState(base, id, patch)`: doors only. Refuses (returns false, changes nothing) to open a locked door or a door
    with a barricade over it, or to lock a door without hasLock or while open. Closing an open door keeps locked false.
  - `setLadderUp(base, id, up)`; `baseHp(base)`: sums hp and maxHp over pieces whose PIECES[kind].slot is 'edge'.
  - `serializeBase(base)`: JSON.stringify. `parseBase(text)`: JSON.parse in try/catch; null unless version === 1, seed,
    plot.x0/z0/y finite numbers, plot.region a string, nextId a positive integer, and every piece has a string id, a
    kind in PIECE_KINDS, a slot matching /^(e:[xz]:\d+:\d+|c:\d+:\d+)$/, side -1 or 1, finite hp and maxHp > 0, the
    seven booleans, and items an array of { def: string, count: number, condition: number }.
  - Put this comment above createBase, exactly: `// Phase 5 (online): pieces get an owner (the builder's gnome code) here; see docs/design/dayg/multiplayer.md. Not designed yet.`
- games/dayg/src/base/save.ts: `loadBase(seed)` reads localStorage[SAVE.prefix + seed] through parseBase (null on
  anything wrong, and null when the parsed seed differs); `saveBase(base)` writes it and sets SAVE.lastSeedKey to the
  seed; `clearBase(seed)` removes the key (and lastSeedKey when it names this seed); `lastBaseSeed()` -> the number or
  null. Every access inside try/catch; `typeof localStorage === 'undefined'` -> do nothing / null.
- games/dayg/src/base/model.test.ts (new, vitest): place a wall on 'e:x:0:0', refuse a second barrier there, allow a
  barricade over a closed door and refuse it over an open one, a ladder needs a wall, damage to 0 removes the wall and
  its ladder, repairCost of a plank wall is PLANK 1 + NAIL 2, dismantle refund PLANK 1 + NAIL 3, reinforce to 200,
  door lock rules, serialize/parse round trip, parseBase(garbage) null; save.ts with a fake
  `globalThis.localStorage` (a Map-backed object with getItem/setItem/removeItem) round trips and lastBaseSeed works,
  and with no localStorage loadBase returns null without throwing.

## Contract
```ts
import type { Aim, BaseState, Cost, PieceKind, PieceState, PlotDef, SlotKey } from './types';
export function createBase(seed: number, plot: PlotDef): BaseState;
export function findPiece(base: BaseState, id: string): PieceState | undefined;
export function piecesOn(base: BaseState, slot: SlotKey): PieceState[];
export function barrierOn(base: BaseState, slot: SlotKey): PieceState | undefined;
export function canPlace(base: BaseState, kind: PieceKind, aim: Aim): string | null;
export function placePiece(base: BaseState, kind: PieceKind, aim: Aim): PieceState;
export function damagePiece(base: BaseState, id: string, amount: number): PieceState[];
export function repairCost(piece: PieceState): Cost[];
export function repairPiece(base: BaseState, id: string): void;
export function reinforcePiece(base: BaseState, id: string): void;
export function dismantlePiece(base: BaseState, id: string): { removed: PieceState[]; refund: Cost[] };
export function setDoorState(base: BaseState, id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean;
export function setLadderUp(base: BaseState, id: string, up: boolean): void;
export function baseHp(base: BaseState): { hp: number; maxHp: number };
export function serializeBase(base: BaseState): string;
export function parseBase(text: string): BaseState | null;
// save.ts
export function loadBase(seed: number): BaseState | null;
export function saveBase(base: BaseState): void;
export function clearBase(seed: number): void;
export function lastBaseSeed(): number | null;
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in model.ts, save.ts or model.test.ts.
- `cd games/dayg && npx vitest run src/base/model.test.ts` passes.

## Out of scope
Every other file, grid.ts included (another worker owns it; do not import it).
~~~~

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.4 Sim base hook)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Five other workers are editing other files at the same time. Edit only the files under Change. If tsc reports errors
  in a file you do not own, ignore them; yours must have none. Keep every exported signature exactly as in Contract.
- games/dayg/src/sim/ is pure TypeScript: no DOM, no three.js, no Math.random, no Date. Every random number comes from
  the `rng` passed in (rng.round(x) = stochastic rounding). The sim must stay deterministic.

## Goal
The sim treats the player's base as a region-level object: while the player is elsewhere, the region's Hatless push on
it every tick (HP the game later takes off the pieces) and its fires pull herds with noise. With no base nothing changes.

## Read first
- games/dayg/src/sim/types.ts: SimBase, WorldState.base, Tuning.base { pushShare, pushCap, hpPerPusherMinute,
  noisePerWarmth }, WorldState.promoted { region, hatless }, chronicle (ChronicleLine { tick, text }), flags.
- games/dayg/src/sim/world.ts: createWorld (base: null), stepWorld (calls stepBase(w, s.base) after stepHorde), runWorld,
  hashWorld.
- games/dayg/src/sim/horde.ts: `hatlessInRegion(w, r): number` and `addNoise(w, r, amount): void` (use them; do not edit).
- games/dayg/src/sim/base.ts: the stub you replace.
- games/dayg/src/sim/sim.test.ts: how the sim tests build worlds (copy that style).

## Change
- games/dayg/src/sim/base.ts:
  - `setSimBase(w, b)`: null -> w.base = null. Else w.base = { ...b, pending, fallenTick } keeping pending and fallenTick
    from the old w.base when its region is the same, else pending 0 and fallenTick null.
  - `stepBase(w, rng)`: return at once when w.base is null or w.base.hp <= 0 (no rng draws then).
    t = w.tuning. If base.warmth > 0: addNoise(w, base.region, base.warmth * t.base.noisePerWarmth).
    If w.promoted.region === base.region, return (the game is simulating that region's Hatless itself).
    pushers = rng.round(Math.min(t.base.pushCap, hatlessInRegion(w, base.region) * t.base.pushShare));
    dmg = pushers * t.base.hpPerPusherMinute * (24 * 60 / t.clock.ticksPerDay); base.hp = Math.max(0, base.hp - dmg);
    base.pending += dmg. When hp reaches 0 this tick: base.fallenTick = w.tick, w.flags['base-fell'] = true, and push
    `{ tick: w.tick, text: \`The Hatless broke into a lone gnome's camp in ${w.graph.byId[base.region].name}.\` }` onto
    w.chronicle.
  - `takeBaseDamage(w)`: returns w.base?.pending ?? 0 and sets pending to 0.
- games/dayg/src/sim/base.test.ts (new, vitest):
  1. No base, no change: runWorld(7, 20) twice gives the same hashWorld and the same daily rows; a world from
     createWorld(7) with setSimBase(w, null) called before stepping 20 days gives the same hash as runWorld(7, 20).
  2. A base in 'leaning-rows' (it starts with Hatless) with hp 1000, maxHp 1000, warmth 0: after 48 stepWorld calls
     hp < 1000, takeBaseDamage returns > 0 and then 0.
  3. Same, but w.promoted.region = 'leaning-rows' for the whole run (set it before each step): hp stays 1000.
  4. warmth 2 with the base region's noise read before and after one stepBase call: noise went up.
  5. hp 1 with a large pushShare (override via withOverrides(TUNING, { base: { pushShare: 1 } }) passed to createWorld):
     after stepping, w.flags['base-fell'] is true, fallenTick set, exactly one chronicle line mentions "lone gnome".
  6. Determinism with a base: two worlds from the same seed and the same setSimBase give the same hp after 48 steps.

## Contract
```ts
import type { Rng } from './rng';
import type { RegionId, WorldState } from './types';
export function setSimBase(w: WorldState, b: { region: RegionId; x: number; z: number; hp: number; maxHp: number; warmth: number } | null): void;
export function stepBase(w: WorldState, rng: Rng): void;
export function takeBaseDamage(w: WorldState): number;
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in sim/base.ts or sim/base.test.ts.
- `cd games/dayg && npx vitest run src/sim` passes (your test and every existing sim test).
- `npm run sim -w games/dayg -- --seeds 10 --days 30 --json > "$TEMP/dayg-sim-14.json"` and
  `cmp "$TEMP/dayg-sim-before.json" "$TEMP/dayg-sim-14.json"` reports no difference (the planner made the "before" file;
  if it is missing, say so and skip this check).

## Out of scope
Every other file, especially world.ts, types.ts, horde.ts, tuning.json and the band and scorecard code.
~~~~

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.5 Piece prefabs)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Another worker is writing packages/prefabs/src/catalog/dayg-base-items.ts at the same time. Edit only your file.

## Goal
Four building-piece prefabs for DayG, each sized so that at the game's scale (x 1.7) it fills its slot exactly, three
of them with two damage stages.

## Read first
- docs/roadmaps/prefab-library/_common.md: the modelling rules, the data rules, the examine voice and the checks. Follow
  them, with this change to the voice: the setting is Mossgrave, a cemetery at gnome height (place names you may use:
  Mossgrave, the Old Rows, the Lychgate, the Tap, the Leaning Rows). Gnomes built these from scavenged wood; the Hatless
  (shambling hatless gnomes) push on them. Before writing, run `npm run lore -- find Mossgrave` and skim the hits.
- packages/prefabs/src/types.ts: PrefabDef, Part, DamageStage.
- packages/prefabs/src/catalog/dayg.ts: the DayG style and examine voice (the ladder is a good model).
- packages/prefabs/src/catalog/damage-stages.ts: how damage stages are written.
- packages/prefabs/src/catalog/dayg-base.ts: the empty `DAYG_BASE` array you fill (already registered in index.ts).

## Change
- packages/prefabs/src/catalog/dayg-base.ts: `export const DAYG_BASE: readonly PrefabDef[]` with, in this order:
  1. `plank-wall` "Plank Wall", category 'prop', uses ['place'], tags plank, wall, wood, boards, barrier, fence.
     Bounding size 2.06 wide (x) x 1.88 tall x at most 0.235 deep (z), centred, on the ground, front +z. Five horizontal
     boards (boxes 2.06 x 0.34 x 0.12, centre z 0, y from 0.17 up in steps of 0.375; name them board-0..board-4), two
     upright battens per face at x = -0.7 and 0.7 (boxes 0.12 x 1.84 x 0.06; front ones at z 0.07, back ones at z -0.07
     so they sink 0.02 into the boards: parts that meet must overlap, never touch face to face), a few nail heads
     (small 'iron' balls on the front battens). Damage stages: 1 'split' (darken 0.25, board-3 morph rot z 8 degrees),
     2 'wrecked' (darken 0.55, hide board-4, add one splinter box leaning at the top).
  2. `barricade` "Barricade", 'prop', uses ['place'], tags barricade, plank, boards, barrier, wood, nails. Size 2.06 x
     1.18 x at most 0.235, centred, on the ground. Two posts (0.12 x 1.18 x 0.12) at x = -0.9 and 0.9, three boards
     (2.06 x 0.26 x 0.1, y 0.25, 0.6, 0.95, z 0.04 so they sink into the posts), one diagonal brace board on the front
     (rot z about 25 degrees, every point above y = 0). Name the boards plank-0..plank-2. Damage stages like plank-wall.
  3. `plank-door` "Plank Door", 'prop', uses ['place', 'open'], tags door, plank, wood, hinge, gate. Size 2.06 x 1.88 x
     at most 0.2, centred, on the ground. Six upright planks (0.34 x 1.88 x 0.1), a Z brace on the front (two ledges and
     a diagonal, sinking 0.02 into the planks), two 'iron-dark' hinge straps at the -x end (the hinge side: the game
     swings the door around its -x end), a ring handle near the +x end. Name the planks slat-0..slat-5. Damage stages
     like plank-wall (hide slat-5 at level 2).
  4. `spike-line` "Spike Line", 'prop', uses ['place'], tags spike, stake, stick, trap, line, sharp. Size about 2.2 wide x
     0.35 tall x 1.0 deep, on the ground. Two low rails (boxes 2.2 x 0.06 x 0.06 at z -0.35 and 0.35, y 0.03), seven to
     nine sharpened sticks (thin 'bark' cylinders with 'wood-light' cone tips) leaning alternately toward +z and -z
     (rot x about +-30 degrees), every point at or above y = 0. No damage stages.

## Contract
- Export name `DAYG_BASE`, ids exactly `plank-wall`, `barricade`, `plank-door`, `spike-line`.
- The game builds them with `buildPrefab(id, { scale: 1.7 })`, so 2.06 wide = 3.5 gm, 1.88 tall = 3.2 gm, 1.18 = 2.0 gm.
  Keep those three sizes within +-0.03.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in dayg-base.ts.
- `npm test -w packages/prefabs` passes every test that names your ids (catalog and damage tests).

## Out of scope
Every other file in packages/prefabs (index.ts is already done) and everything under games/.
~~~~

~~~~text
Epic: 1 Collider hook, grid, model and save, sim hook, prefabs (issue 1.6 Material prefabs)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Another worker is writing packages/prefabs/src/catalog/dayg-base.ts at the same time. Edit only your file.

## Goal
Four small DayG prefabs: the plank, nails and iron hinge items the player carries and builds with, and the fire ring
placed in a base.

## Read first
- docs/roadmaps/prefab-library/_common.md: the modelling rules, data rules, examine voice and checks. Follow them, with
  this change to the voice: the setting is Mossgrave, a cemetery at gnome height (place names you may use: Mossgrave,
  the Old Rows, the Lychgate, the Tap, the Leaning Rows). Before writing, run `npm run lore -- find Mossgrave`.
- packages/prefabs/src/types.ts: PrefabDef, Part.
- packages/prefabs/src/catalog/dayg.ts: the DayG style and voice.
- packages/prefabs/src/catalog/dayg-base-items.ts: the empty `DAYG_BASE_ITEMS` array you fill.

## Change
- packages/prefabs/src/catalog/dayg-base-items.ts: `export const DAYG_BASE_ITEMS: readonly PrefabDef[]` with:
  1. `plank` "Plank", category 'material', uses ['hold', 'collect', 'craft'], tags plank, board, wood, timber. An
     upright plank 0.6 tall, 0.12 wide, 0.04 thick, with a darker knot and a sawn end; grip [0, 0.12, 0]. It is also a
     cosmetic hand item (an achievement reward), so it must look right held.
  2. `nails` "Nails", 'material', uses ['collect', 'craft'], tags nails, nail, iron, pins. Five to seven thin 'iron'
     cylinders with flat heads in a small loose pile about 0.12 across, every point at or above y = 0.
  3. `iron-hinge` "Iron Hinge", 'material', uses ['collect', 'craft'], tags hinge, iron, strap, pin. Two 'iron-dark'
     leaves standing upright, joined by a round pin, about 0.15 tall and 0.12 wide, with three tiny screw heads each.
  4. `fire-ring` "Fire Ring", 'prop', uses ['place', 'light'], tags fire, ring, stones, hearth, pit. Eight squashed grey
     balls ('stone' and 'stone-dark' alternating) in a circle of radius 0.3 (outer diameter about 0.75), resting on the
     ground, with an empty middle and a few charcoal lumps (small dark balls) inside. No flat discs or boxes lying on the
     ground (they flicker against the ground plane).

## Contract
Export name `DAYG_BASE_ITEMS`, ids exactly `plank`, `nails`, `iron-hinge`, `fire-ring`. The game builds them with
`buildPrefab(id, { scale: 1.7 })` and uses `prefabIconElement(id, fallback, 32)` for UI icons.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no errors in dayg-base-items.ts.
- `npm test -w packages/prefabs` passes every test that names your ids.

## Out of scope
Every other file in packages/prefabs and everything under games/.
~~~~

### Round 2, Epic 2: base system, view, build UI, chest UI, achievements

~~~~text
Epic: 2 Base system, view, build UI, chest UI, achievements (issue 2.1 Base system)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict, three.js). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the files under Change. If tsc
  reports errors in a file you do not own, ignore them; yours must have none. Keep every exported signature exactly
  as in Contract (main.ts and two later issues call it).
- system.ts must not touch the DOM at import time and must run under vitest in node: guard every `window` /
  `addEventListener` use with `typeof window !== 'undefined'`; use no timers (count time in update()).

## Goal
One system owns the player's base at runtime: claim and abandon, placing and removing pieces with their collider blocks
and ladder routes, damage from Hatless pushing (in front of the player and owed by the sim), hits, doors bursting,
spike lines, a timed work job, the sim sync and the save.

## Read first
- games/dayg/src/base/types.ts and games/dayg/src/base/config.ts (PIECES, PUSH, SPIKE, HIT, SAVE).
- games/dayg/src/base/grid.ts: pieceBox, piecePlacement, ladderRoute, plotCenter, sealedAt, edgeCenter, cellCenter,
  parseSlot, isPerimeter, boxHitsCircle.
- games/dayg/src/base/model.ts: every exported function (they mutate BaseState in place).
- games/dayg/src/game/types.ts: HatlessSystem (nearCount(pos, radius), strike(origin, facing, reach, damage) -> hits),
  CampSystem (nearFire(pos)), PlayerState (pos is a THREE.Vector3 with x, y, z), Vec3.

Signatures you also use (no need to open these files):
- save.ts: `loadBase(seed: number): BaseState | null`, `saveBase(base: BaseState): void`, `clearBase(seed: number): void`.
- collide.ts Collider: `addBlock(b: BlockDef): void` (BlockDef = { id, kind: 'piece', x0, x1, z0, z1, y, h }),
  `removeBlock(id): boolean`, `addRoute(route: ClimbRouteDef): void`, `removeRoute(id): boolean`, `blockById(id)`.
- sim/base.ts: `setSimBase(w, { region, x, z, hp, maxHp, warmth } | null): void`, `takeBaseDamage(w): number`.
- bus.ts: `bus.emit(name, payload)`, `bus.on(name, fn)`; events 'base-claimed' { region, x, z }, 'base-abandoned'
  { region }, 'piece-placed' { id, kind }, 'piece-damaged' { id, kind, hp, maxHp, cause }, 'piece-broken' { id, kind,
  cause }, 'piece-repaired' { id, kind }, 'hint' { text }, 'player-hit' { strength, from }.

## Change
- games/dayg/src/base/system.ts (replace the stub):
  - On create: `state = loadBase(seed)`; if loaded, apply every piece to the collider (below) and call sync.
  - apply(piece): box = pieceBox(plot, piece) -> `collider.addBlock({ id: piece.id, kind: 'piece', ...box })`, or
    `collider.removeBlock(piece.id)` when null. Ladders: wall = the barrier on its slot; `collider.removeRoute(route.id)`,
    then `collider.addRoute(ladderRoute(piece, wall))` unless piece.up. unapply(piece): removeBlock and removeRoute.
  - changed(): marks dirty (save after SAVE.debounceSec of update time), resyncs the sim, calls onChange listeners.
  - `claim(plot)`: false when a base exists; createBase(seed, plot), save now, emit 'base-claimed' { region, x, z (centre) }.
  - `abandon()`: unapply every piece, clearBase(seed), setSimBase(world, null), state = null, emit 'base-abandoned'.
  - `place(kind, aim)`: canPlace -> null when refused (emit 'hint' with the reason); placePiece, apply, emit
    'piece-placed', changed(). It does not take materials (the build controller pays).
  - `damage(id, amount, cause)`: damagePiece; emit 'piece-damaged' { id, kind, hp, maxHp, cause } while it stands;
    for each removed piece unapply it and emit 'piece-broken'; a broken chest loses its items (emit 'hint' "The chest
    splits and its things scatter."); changed().
  - `repair`, `reinforce` (emit 'piece-repaired'), `dismantle` (unapply removed pieces, return the refund),
    `setDoor(id, patch)`: closing is refused (false, hint "Step out of the doorway.") when the closed box overlaps the
    player (boxHitsCircle(box, p.x, p.z, 0.45)); otherwise setDoorState, apply, changed(). `setLadderUp`, `touch()`.
  - `strike(origin, facing, reach, damage)`: the nearest piece whose placement centre is within reach + 0.5 in xz and
    within 60 degrees of the facing (forward = (sin f, cos f)); damage(id, damage * HIT.hpPerDamage, 'hit'); true when
    one was hit.
  - `sealedAt(pos)`: grid sealedAt on the state (false without a base).
  - Work job: `startWork(label, seconds, done)` (false when one runs), `busy()` { label, progress 0..1 }, `cancelWork()`;
    update advances it and calls done once at the end; a 'player-hit' event cancels it with hint "You are interrupted."
  - `update(dt, sunHours)`:
    1. work job.
    2. Pushing: for each piece with a box (pieceBox not null), skipping a door that has a barricade over it:
       n = hatless.nearCount({ x: box centre x, y: plot.y, z: box centre z }, PUSH.radius); if n > 0,
       damage(id, n * sunHours * 60 * PUSH.hpPerHatlessSunMinute, 'push').
    3. Door burst: a closed, unlocked door with no barricade over it and nearCount >= PUSH.doorBurstPushers for
       PUSH.doorBurstSeconds of real time in a row opens (setDoorState open true, apply, hint "The door bursts open.").
    4. Spikes: every SPIKE.everySec per spike line: for f of [0, 2.094, 4.189] call hatless.strike({ x, y: plot.y, z:
       cell centre }, f, SPIKE.reach, SPIKE.damage); each hit costs the spike SPIKE.wearPerHit HP (cause 'push').
    5. Away damage: owed = takeBaseDamage(world); if owed > 0, split it equally over the pieces with a box on perimeter
       edges (all boxed pieces when none are on the perimeter) as cause 'away'; if the player is within 30 gm of the
       plot centre, hint once "Your walls took a beating while you were away."
    6. Sim sync (on changed() and once a second): setSimBase(world, { region, x, z (centre), ...baseHp(state), warmth:
       the number of fire-ring pieces whose cell centre camp.nearFire() }) ; setSimBase(world, null) without a base.
    7. Save when dirty and the debounce passed. On `pagehide` (window), save at once.
- games/dayg/src/base/system.test.ts (new, vitest, node): real createCollider with a map literal { bounds, blocks: [],
  routes: [], pits: [], spots: [], havens: [], water: [], paths: [], props: [], containers: [], playerSpawn }, real
  createWorld(1).world, real createBus(), and fake hatless / camp objects (nearCount returns a variable you set). Test:
  claim at { x0: 320, z0: 410, y: 0, region: 'forecourt' }; place a plank wall on 'e:x:0:0' and see collider.blockById
  ('piece-1'); 5 pushers for 1 sun-hour in 1 s steps break it (120 HP < 300) and the block is gone and 'piece-broken'
  fired; a door opened has no block, closed has one; a ladder on a wall adds a route and up removes it; world.base hp
  follows; abandon clears world.base.

## Contract
```ts
import type { Collider } from '../world/collide';
import type { WorldState } from '../sim/types';
import type { Bus } from '../game/bus';
import type { CampSystem, HatlessSystem, PlayerState, Vec3 } from '../game/types';
import type { Aim, BaseState, Cost, DamageCause, PieceKind, PieceState, PlotDef } from './types';
export interface BaseDeps { seed: number; world: WorldState; collider: Collider; bus: Bus; hatless: HatlessSystem; camp: CampSystem; getPlayer: () => PlayerState }
export interface BaseSystem {
  state(): BaseState | null;
  claim(plot: PlotDef): boolean;
  abandon(): void;
  place(kind: PieceKind, aim: Aim): PieceState | null;
  damage(id: string, amount: number, cause: DamageCause): void;
  repair(id: string): void;
  reinforce(id: string): void;
  dismantle(id: string): Cost[];
  setDoor(id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean;
  setLadderUp(id: string, up: boolean): void;
  touch(): void;                                   // contents changed (chest): save and notify
  strike(origin: Vec3, facing: number, reach: number, damage: number): boolean;
  sealedAt(pos: Vec3): boolean;
  startWork(label: string, seconds: number, done: () => void): boolean;
  busy(): { label: string; progress: number } | null;
  cancelWork(): void;
  update(dt: number, sunHours: number): void;
  onChange(fn: () => void): () => void;
}
export function createBaseSystem(deps: BaseDeps): BaseSystem;
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in system.ts or system.test.ts.
- `cd games/dayg && npx vitest run src/base` passes.

## Out of scope
Every other file: main.ts (the planner wires it), grid.ts, model.ts, save.ts, view.ts, the UI files, hatless.ts, camp.ts.
~~~~

~~~~text
Epic: 2 Base system, view, build UI, chest UI, achievements (issue 2.2 Base view)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict, three.js 0.187). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the file under Change. If tsc
  reports errors in a file you do not own, ignore them; yours must have none. Keep the exported signatures exactly.
- Dev server for your checks: `cd games/dayg && npx vite --port 5291 --strictPort` in the background; stop it when done.
- Repo rule (z-fighting): nothing may lie flat on another surface in the same plane. Keep every mesh you add apart from
  the ground and from other meshes, or overlapping them, never touching face to face.

## Goal
The base is visible: every piece is drawn from its prefab at the right place, with wear shown by damage stages, doors
swinging, ladders leaning or pulled up, fire rings hidden while a fire burns in them, plus a ghost preview and plot
corner posts for building.

## Read first
- games/dayg/src/base/types.ts (BaseState, PieceState, Aim, PlotDef) and games/dayg/src/base/config.ts (PIECES: prefab
  per kind; PLOT; PLOT_SIZE).
- games/dayg/src/base/grid.ts: piecePlacement(plot, piece) -> { x, y, z, rotY }, doorHinge(plot, piece), edgeCenter,
  cellCenter, allEdges, allCells.
- games/dayg/src/game/camp.ts: how a prefab is built and added (`buildPrefab('campfire', { scale: PREFAB_SCALE, lights: false })`).
- packages/prefabs/README.md: "Damage stages" (`setPrefabDamage(root, level)`, levels clamp; never dispose meshes from
  buildPrefab directly).

## Change
- games/dayg/src/base/view.ts (replace the stub):
  - One THREE.Group root added to the scene. Per piece id a record { piece group, built kind, damage level }.
  - `sync(base)`: remove records whose ids are gone (scene.remove, no dispose of prefab meshes); add new ones:
    `buildPrefab(PIECES[kind].prefab, { scale: PREFAB_SCALE })` (import PREFAB_SCALE from '../config'); ladders use
    scale 2.0 (the ladder prefab is 1.6 tall; 3.2 gm). Position and rotation from piecePlacement. A barricade with
    overDoor gets scale.z * 0.5 (it is 0.2 gm thick). Damage level: hp/maxHp > 0.66 -> 0, > 0.33 -> 1, else 2, applied
    with setPrefabDamage only when it changed.
    Doors: wrap the prefab in a pivot Group at doorHinge(); the prefab is offset so its -x end sits on the pivot; open
    -> target pivot rotation 90 degrees (rotate away from side -1, i.e. +Math.PI/2 for 'x' edges), closed -> 0.
    Ladders: down -> leaning: rotation.x = -0.19 about its base (top against the wall face); up -> lying along the wall
    top: positioned at the edge centre, y = plot.y + 3.2 + 0.05, rotated to lie flat along the edge's axis (rungs up).
    Shadows: castShadow on meshes like the rest of the scene.
  - `setLit(id, lit)`: fire-ring group visible = !lit (camp draws its own campfire there).
  - `showGhost(kind, plot, aim, ok)`: one ghost group (rebuilt only when the kind changes): the prefab with every mesh's
    material replaced by a shared MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false, color: ok ?
    0x7ddc6f : 0xdc6f6f }) (dispose only these materials). Placed like a real piece of that kind on aim.slot / aim.side
    (build a fake PieceState for piecePlacement). Hidden when any argument is null.
  - `showPlot(plot)`: 16 thin posts (BoxGeometry 0.08 x 0.6 x 0.08, light colour, y = plot.y + 0.3) at the grid corners;
    hidden when null. No flat quads.
  - `update(dt)`: eases door pivots and ladder poses toward their targets (about 0.25 s).
- No test file (three.js scene code); the browser checks below are the test.

## Contract
```ts
import type * as THREE from 'three';
import type { Aim, BaseState, PieceKind, PlotDef } from './types';
export interface BaseView {
  sync(base: BaseState | null): void;
  setLit(pieceId: string, lit: boolean): void;
  showGhost(kind: PieceKind | null, plot: PlotDef | null, aim: Aim | null, ok: boolean): void;
  showPlot(plot: PlotDef | null): void;
  update(dt: number): void;
}
export function createBaseView(scene: THREE.Scene): BaseView;
```
main.ts (planner) already calls `baseView.sync(demoBase(seed))` for `?basedemo=1` and `baseView.update(dt)` every frame.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in view.ts.
- With the dev server on 5291: screenshot `http://localhost:5291/?seed=1&basedemo=1&spawn=326,402` at 1280x720 and at
  390x844 (Edge headless command below), open both PNGs with Read: walls, door, two barricades, two ladders (one leaning,
  one on top of its wall), a darker damaged wall, chest, bed, workbench, spike line and fire ring are visible on the
  plot in the Forecourt, nothing floats or sinks.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-22.png" "<url>"
- `npm run zfight -- "http://localhost:5291/?seed=1&basedemo=1&spawn=326,402"` reports nothing new near x 320..332,
  z 410..422.
- `bash tools/smoke.sh "http://localhost:5291/?seed=1&basedemo=1" dayg-hud` passes.

## Out of scope
Every other file. Do not edit main.ts, demo.ts, grid.ts or camp.ts.
~~~~

~~~~text
Epic: 2 Base system, view, build UI, chest UI, achievements (issue 2.3 Build UI)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the file under Change. If tsc
  reports errors in a file you do not own, ignore them; yours must have none. Keep the exported signatures exactly.
- Dev server: `cd games/dayg && npx vite --port 5292 --strictPort` in the background; stop it when done.
- Repo rules: UI modules append their own container to the shared `#ui` element and never restyle or hide `#ui`.
  Every control works by touch: buttons of 44 px or more, no hover-only UI, safe-area insets respected.

## Goal
The build mode's on-screen controls: a BUILD toggle, a strip of piece cards with icons and costs, PLACE / REPAIR /
TAKE DOWN / action / EXIT buttons, a status line, base HP, and a claim card. DOM only: it shows a state and calls handlers.

## Read first
- games/dayg/src/base/buildUi.ts: the stub (types in Contract).
- games/dayg/src/ui/touch.ts: the existing touch buttons (style, `pointerdown` with preventDefault + stopPropagation,
  the bottom-right block 212 x 252 px at 12 px from the safe-area corner, VIEW 48 px at top-right under the 64 px top bar).
- games/dayg/src/config.ts: LAYOUT { topBar: 64, stickZone: 0.45, promptBottom: 120 }.
- games/dayg/src/base/config.ts: BASE_DOM.build = 'dayg-build'.

## Change
- games/dayg/src/base/buildUi.ts:
  - Root div id BASE_DOM.build, `position:absolute; inset:0; pointer-events:none; z-index:21`, appended to `ui`; its
    controls have pointer-events auto. Inject one <style id="dayg-build-style">.
  - BUILD button (64 px round, label "BUILD", aria-label "Build"): shown when `canBuild` and mode 'off'. Position:
    right `calc(env(safe-area-inset-right,0px) + 12px)`, bottom `calc(env(safe-area-inset-bottom,0px) + 276px)` (above
    the touch block); in `@media (max-height: 500px)` (landscape phones) right `calc(env(safe-area-inset-right,0px) + 236px)`,
    bottom `calc(env(safe-area-inset-bottom,0px) + 12px)`. Calls `h.toggle()`.
  - Build mode ('build'):
    - Piece strip: top `calc(env(safe-area-inset-top,0px) + 72px)`, left 12 px + inset, right 72 px + inset; one row,
      horizontal scroll (touch-action: pan-x), cards 64 x 72 px: `prefabIconElement(prefab, '▦', 32)` from
      '@lawn/prefabs', name (11 px), cost (10 px). Not affordable -> opacity 0.5 (still selectable). Selected -> bright
      border. Tap -> `h.select(kind)`. Desktop hint: the card's index 1..9 in a corner.
    - Action row in the BUILD button's place (same anchors, row grows to the left): EXIT, TAKE DOWN, REPAIR, action
      (only when `target.action` is set; label from it), PLACE (64 px, highlighted). Others 56 px. Disabled states:
      REPAIR unless target.canRepair, TAKE DOWN unless target.canDismantle, action unless action.enabled. Calls
      h.exit / h.dismantle / h.repair / h.targetAction / h.place. Keyboard hints in small text: F place, G repair,
      X take down, Esc exit.
    - Status panel under the strip (top 152 px + inset, left 12 px + inset, max-width 60%): `status`, the target line
      ("Plank wall 70/120, repair: PLANK 1, NAIL 2") and a thin base HP bar from `baseHp`.
  - Claim mode ('claim'): a centred card (max-width 320 px, top 152 px + inset): "Claim this plot?", the `claim.why`
    text when not ok, CLAIM (56 px; disabled unless claim.ok) -> h.claim(), EXIT -> h.exit(). The piece strip and
    action row are hidden.
  - `update(s)`: re-render only what changed (compare a JSON key of the state); never rebuild on every frame.
  - `setVisible(on)`: hides everything (the dead player, an open pack).
  - An "ABANDON" text button at the end of the strip -> h.abandon().

## Contract
```ts
import type { PieceKind } from './types';
export interface BuildUiState {
  mode: 'off' | 'claim' | 'build';
  canBuild: boolean;
  claim: { ok: boolean; why: string | null } | null;
  pieces: { kind: PieceKind; name: string; prefab: string; cost: string; affordable: boolean }[];
  selected: PieceKind | null;
  target: { name: string; hp: number; maxHp: number; repair: string | null; canRepair: boolean; canDismantle: boolean; action: { label: string; enabled: boolean } | null } | null;
  status: string | null;
  baseHp: { hp: number; maxHp: number } | null;
}
export interface BuildUiHandlers { toggle(): void; select(kind: PieceKind): void; place(): void; repair(): void; dismantle(): void; targetAction(): void; claim(): void; abandon(): void; exit(): void }
export interface BuildUi { root: HTMLElement; update(s: BuildUiState): void; setVisible(on: boolean): void }
export function createBuildUi(ui: HTMLElement, h: BuildUiHandlers): BuildUi;
```
The build.ts stub (planner) already shows sample states for `?buildui=1` (build mode) and `?buildui=claim`.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in buildUi.ts.
- With the dev server on 5292, screenshots of `http://localhost:5292/?seed=1&touch=1&buildui=1` and
  `...&buildui=claim` at 390x844 and 844x390:
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-23-portrait.png" "<url>"
  Open each PNG with Read: no control overlaps the HUD top bar, the touch buttons (ACT, PACK, CROUCH, UP, HIT, VIEW)
  or another control; every button is at least 44 px; text is readable.
- `bash tools/smoke.sh "http://localhost:5292/?seed=1&buildui=1" dayg-build` passes.

## Out of scope
Every other file, including touch.ts, hud.ts and build.ts.
~~~~

~~~~text
Epic: 2 Base system, view, build UI, chest UI, achievements (issue 2.4 Chest UI)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the file under Change. If tsc
  reports errors in a file you do not own, ignore them; yours must have none. Keep the exported signatures exactly.
- Dev server: `cd games/dayg && npx vite --port 5293 --strictPort` in the background; stop it when done.
- Repo rules: append your own container to `#ui`, never restyle `#ui`. Touch first: rows and buttons 44 px or more.

## Goal
A storage chest panel: the pack on one side, the chest on the other, tap a stack to move it across, with the chest's
bulk limit shown.

## Read first
- games/dayg/src/ui/inventoryPanel.ts: the pack panel's look (colours, fonts, `prefabIconElement(def.prefab, FALLBACK_ICON, 40)`),
  to match it.
- games/dayg/src/game/types.ts: InventorySystem (state.pack, take({ where: 'pack', index }, count), add(stack) -> leftover
  or null, onChange) and ItemStack.
- games/dayg/src/items/defs.ts: getItem(id) -> { name, bulk, stack, prefab }.
- games/dayg/src/base/config.ts: BASE_DOM.chest = 'dayg-chest', CHEST_BULK = 30.

## Change
- games/dayg/src/base/chestUi.ts:
  - Root div id BASE_DOM.chest appended to `ui`, hidden by default (display none), z-index 30, a centred panel
    (max-width 560 px; max-height calc(100% - safe insets - 32px); its own scroll), backdrop dim.
  - `open(title, getChest, onChange)`: shows `title`, two lists: "Your pack" (inv.state.pack) and "Chest" (getChest()),
    each row 52 px: 32 px icon, name, count. Chest header shows "used / capacityBulk bulk" (sum of getItem(def).bulk *
    count). Tap a pack row -> if it fits by bulk, `inv.take({ where: 'pack', index }, count)` and merge into the chest
    array (same def and condition merge up to getItem(def).stack, else push), else a short "The chest is full." line.
    Tap a chest row -> `inv.add(stack)`; the leftover (if any) stays in the chest at that index; remove the row when
    nothing is left. After each move call onChange() and re-render. Re-render also on inv.onChange while open.
  - Portrait (max-width 599 px): lists stacked; wider: side by side (CSS grid, two columns).
  - A CLOSE button 48 px top-right of the panel; Escape closes; `close()`, `isOpen()`.
  - Mutate the array getChest() returns (it is the piece's own items array).

## Contract
```ts
import type { InventorySystem } from '../game/types';
import type { ItemStack } from '../sim/types';
export interface ChestUi { root: HTMLElement; open(title: string, getChest: () => ItemStack[], onChange: () => void): void; close(): void; isOpen(): boolean }
export function createChestUi(ui: HTMLElement, deps: { inv: InventorySystem; capacityBulk: number }): ChestUi;
```
main.ts (planner) opens it for `?chestui=1` with a demo chest of 4 planks, and blocks movement while it is open.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in chestUi.ts.
- Screenshots of `http://localhost:5293/?seed=1&touch=1&chestui=1&kit=build` at 390x844 and 844x390 (Edge headless,
  `--window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-24-portrait.png"`), opened with Read: both
  lists visible, rows at least 44 px, nothing cut off, the close button reachable.
- `bash tools/smoke.sh "http://localhost:5293/?seed=1&chestui=1" dayg-chest` passes.

## Out of scope
Every other file, including inventoryPanel.ts and inventory.ts.
~~~~

~~~~text
Epic: 2 Base system, view, build UI, chest UI, achievements (issue 2.5 Achievements)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the files under Change.

## Goal
Three base-building achievements with gear rewards, unlocked from the game's own events.

## Read first
- packages/achievements/README.md: AchievementDef, rewards (every reward prefab used by one achievement only; hand
  slot needs a prefab with the 'hold' use).
- packages/achievements/src/catalog.ts: the four `dayg-*` entries (copy their shape, add yours right after them).
- games/dayg/src/game/achievements.ts: the existing DayG tracker (`createAchievementTracker({ ui })`, the `safe()` wrapper).
- games/dayg/src/game/bus.ts: 'piece-placed' { id, kind }, 'piece-damaged' { id, kind, hp, maxHp, cause },
  'piece-broken', 'base-slept' { hours, sealed, locked }.

## Change
- packages/achievements/src/catalog.ts, after `dayg-mossbreaker`:
  - `dayg-first-wall`, title 'First Wall', description 'Raise a plank wall on your own plot.', reward
    `{ slot: 'hand', prefabId: 'garden-mallet', label: 'Garden Mallet' }`.
  - `dayg-locked-in`, title 'Locked In', description 'Sleep through a night sealed in your base with every door locked.',
    reward `{ slot: 'hand', prefabId: 'hand-saw', label: 'Hand Saw' }`.
  - `dayg-held-the-line`, title 'Held the Line', description 'Keep a barricade standing through 80 HP of Hatless pushing.',
    reward `{ slot: 'hand', prefabId: 'plank', label: 'Plank', exclusive: true }`.
  All with `game: 'dayg', gameTitle: 'DayG'`. If the test says one of these prefabs is already a reward elsewhere, pick
  another existing hold-able tool prefab that no achievement uses and say which in your report.
- games/dayg/src/base/achievements.ts (replace the stub): one tracker; 'piece-placed' with kind 'plank-wall' -> unlock
  'dayg-first-wall'; 'base-slept' with sealed && locked && hours >= 4 -> unlock 'dayg-locked-in'; 'piece-damaged' with
  kind 'barricade' and cause 'push': add (previous hp for that id, or maxHp) - hp to a per-id total; when the total
  reaches 80 while hp > 0 -> unlock 'dayg-held-the-line'; 'piece-broken' clears that id's total.

## Contract
```ts
import type { Bus } from '../game/bus';
export function createBaseAchievements(deps: { bus: Bus; ui: HTMLElement }): void;
```

## Done when
- `npm test -w packages/achievements` passes.
- `npx tsc --noEmit -p games/dayg` shows no errors in base/achievements.ts.

## Out of scope
games/dayg/src/game/achievements.ts and every other file.
~~~~

### Round 3, Epic 3: build controller and piece actions

~~~~text
Epic: 3 Build controller and piece actions (issue 3.1 Build controller)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- One other worker is editing src/base/actions.ts at the same time. Edit only the file under Change. Keep the exported
  signatures exactly (main.ts calls them).
- Dev server: `cd games/dayg && npx vite --port 5294 --strictPort` in the background; stop it when done.
- Repo rule: every action has a touch control (the build UI already provides the buttons).

## Goal
Building as a verb: with a hammer held, BUILD (or B) enters claim or build mode, the player aims at the grid, picks a
piece, sees a ghost and why it can or cannot go there, and PLACE runs a timed job that takes the materials and places
the piece; repair, take down, fit a lock and reinforce work on the piece under the aim.

## Read first
- games/dayg/src/base/build.ts: the stub, including the `?buildui=1` / `?buildui=claim` sample path you must keep.
- games/dayg/src/base/buildUi.ts: BuildUiState, BuildUiHandlers, createBuildUi.

BaseSystem methods you use (src/base/system.ts; no need to open it): `state(): BaseState | null`,
`claim(plot): boolean`, `abandon()`, `place(kind, aim): PieceState | null` (does not take materials),
`repair(id)`, `reinforce(id)`, `dismantle(id): Cost[]` (the refund), `setDoor(id, { hasLock?, open?, locked? }): boolean`,
`startWork(label, seconds, done): boolean` (one timed job; the player cannot move meanwhile), `busy()`.
InventorySystem (src/game/types.ts): `held()`, `findTag(tag)`, `move(from, to)`, `countTag(tag)`,
`consumeTag(tag, count): boolean`, `add(stack): ItemStack | null` (leftover).
- games/dayg/src/base/grid.ts (claimCheck, aimAt, pieceBox, boxHitsCircle, plotContains, plotCenter) and
  games/dayg/src/base/model.ts (canPlace, piecesOn, barrierOn, repairCost, findPiece).
- games/dayg/src/base/config.ts: PIECES, PIECE_KINDS order (from types.ts), BUILD_RANGE, BUILD_NOISE, REPAIR,
  DISMANTLE, REINFORCE, LOCK, TAG_ITEM.

## Change
- games/dayg/src/base/build.ts:
  - `createBuildController(deps)` creates the UI with `createBuildUi(deps.ui, handlers)`. Mode 'off' | 'claim' | 'build'.
  - Hammer: `canBuild = inv.countTag('HAMMER') > 0`. toggle/open(): if no HAMMER anywhere -> hint "Hold a hammer to
    build."; if the held item (inv.held()) lacks HAMMER, move the first HAMMER into the main hand
    (`inv.move(inv.findTag('HAMMER')!, { where: 'hand', index: 0 })`); then mode = base.state() ? 'build' : 'claim'.
    Leave build mode when the hammer leaves the hand or the player dies.
  - Keys (window keydown, ignore repeats and events whose target is an input): B toggle, Digit1..Digit9 select
    PIECE_KINDS[n-1], F place, G repair, X take down, T the target action, Escape exit.
  - Aim each frame: p = getPlayer(), yaw = getAim() (forward = (sin yaw, cos yaw)).
    Claim mode: r = claimCheck(collider, p.pos.x, p.pos.y, p.pos.z); view.showPlot(r.ok ? r.plot : <snapped plot at
    p.pos.y for the outline>); claim() -> base.claim(r.plot) then mode 'build'.
    Build mode: plot = base.state().plot; outside plotContains(plot, x, z, BUILD_RANGE) -> status "Too far from your
    base.", ghost hidden. Else aim = aimAt(plot, x, z, yaw, PIECES[selected].slot); why = canPlace(...) ??
    missing materials ("Needs 2 more PLANK") ?? missing tools ("Needs a SAW") ?? (the piece box overlaps the player:
    boxHitsCircle(box, x, z, 0.5) -> "Step out of the way."). view.showGhost(selected, plot, aim, why === null);
    view.showPlot(plot). Status: why, or `${name}: ${seconds} s`.
    Target: for the edge or cell under an aim of kind 'edge' (or 'cell'), the first own piece there: name, hp, maxHp,
    repair cost text, canRepair (hp < maxHp and affordable), canDismantle true, action: door without a lock ->
    { label: 'Fit lock', enabled: has IRON 1, SPRING 1 and a HAMMER }; barricade not reinforced -> { label: 'Reinforce',
    enabled: PLANK 3 }; else null.
  - place(): when why is null: base.startWork(`Building: ${name}`, seconds, done). done re-checks canPlace and the
    materials, consumes each cost with inv.consumeTag(tag, count), base.place(kind, aim), and emits
    bus 'noise' { x, z, radius: BUILD_NOISE, source: 'other' }. A failed re-check -> hint with the reason.
  - repair(): repairCost affordable -> startWork('Repairing', REPAIR.seconds, consume + base.repair(id)).
  - dismantle(): startWork('Taking it down', DISMANTLE.seconds, () => { refund = base.dismantle(id); for each line
    inv.add({ def: TAG_ITEM[tag], count, condition: 1 }); a chest's items go back through inv.add too; any leftover ->
    hint "Some of it does not fit in your pack." }).
  - targetAction(): Fit lock -> startWork('Fitting a lock', LOCK.seconds, consume LOCK.cost, base.setDoor(id,
    { hasLock: true }), inv.add({ def: LOCK.key, count: 1, condition: 1 }), hint "You fit the lock and keep the key.");
    Reinforce -> startWork('Reinforcing', REINFORCE.seconds, consume, base.reinforce(id)).
  - abandon(): a second press within 3 s confirms (first: status "Press ABANDON again to give up this base."); then
    base.abandon(), mode 'claim'.
  - exit(): mode 'off', view.showGhost(null, ...), view.showPlot(null).
  - Each frame `ui.update(state)` and `ui.setVisible(p.alive)`; pieces list from PIECE_KINDS with cost text like
    "PLANK 3, NAIL 6" and affordable = every cost line covered by inv.countTag.
  - Keep the `?buildui=` sample path working: when that param is set, show the sample state and ignore the game.

## Contract
```ts
import type { Bus } from '../game/bus';
import type { InventorySystem, PlayerState } from '../game/types';
import type { Collider } from '../world/collide';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
export interface BuildDeps { base: BaseSystem; view: BaseView; ui: HTMLElement; inv: InventorySystem; collider: Collider; bus: Bus; getPlayer: () => PlayerState; getAim: () => number }
export interface BuildController { active(): boolean; open(): void; update(dt: number): void }
export function createBuildController(deps: BuildDeps): BuildController;
```
main.ts (planner): `build.update(dt)` every frame; attack is suppressed while `build.active()`; movement is blocked while
`base.busy()` is not null; `?build=1` calls `build.open()` on the first frame; `?kit=build` gives a mallet, a saw,
12 planks, 24 nails, 2 hinges, an iron bar, a scrap gear, 4 stones, 4 moss and 6 silk.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in build.ts.
- `cd games/dayg && npx vitest run src/base` still passes.
- With the dev server on 5294, a 390x844 screenshot of `http://localhost:5294/?seed=1&touch=1&kit=build&build=1&spawn=326,416`
  (Edge headless command as in the other UI issues) shows claim mode with the plot posts and a working claim card, and
  `...&buildui=1` still shows the sample. Then, by hand in a desktop browser if you have one (say if you do not): B,
  claim, 1, F builds a wall after 45 s that blocks walking; G repairs a hit wall; X gives planks back.
- `bash tools/smoke.sh "http://localhost:5294/?seed=1&kit=build&build=1" dayg-build` passes.

## Out of scope
Every other file: actions.ts, buildUi.ts (if a control is missing, say so), system.ts, main.ts.
~~~~

~~~~text
Epic: 3 Build controller and piece actions (issue 3.2 Piece actions)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- One other worker is editing src/base/build.ts at the same time. Edit only the file under Change. Keep the exported
  signatures exactly.
- Dev server: `cd games/dayg && npx vite --port 5295 --strictPort` in the background; stop it when done.
- Every action here goes through the context action (E on desktop, ACT on touch), which already exists.

## Goal
Built pieces do things: doors open, close, lock and unlock with a key, ladders are pulled up and let down, the chest
opens its panel, the bed sleeps you to dawn when you are sealed in and safe, the workbench saws timber into planks and
the fire ring takes a fire.

## Read first
- games/dayg/src/base/actions.ts: the stub (types in Contract).
- games/dayg/src/game/interact.ts: Interactable { id, x, y, z, radius, label(): string | null, act() }, add() returns
  a remover; the nearest one with a label within radius (xz) and |dy| < 2.5 wins.
- games/dayg/src/game/camp.ts: how the Waystation bed sleeps (clock.setRate(30) until !clock.night, rest by day at rate
  10 for 1 sun-hour, wake on 'player-hit'), and `placeFire(x, y, z, burnHours)`, `nearFire(pos)`, `sleeping()`.
- games/dayg/src/base/grid.ts (edgeCenter, cellCenter, plotCenter) and games/dayg/src/base/config.ts (PIECES, BED,
  SAW_PLANKS, FIRE_RING, LADDER_PULL_SECONDS).

BaseSystem methods you use (src/base/system.ts; no need to open it): `state(): BaseState | null` (pieces: PieceState
with id, kind, slot, side, open, hasLock, locked, up, overDoor, items), `setDoor(id, { open?, locked?, hasLock? }): boolean`
(false when refused: opening a locked or barricaded door, closing on the player), `setLadderUp(id, up)`, `touch()`
(chest contents changed), `sealedAt(pos): boolean`, `startWork(label, seconds, done): boolean`,
`onChange(fn): () => void`. InventorySystem: `countTag(tag)`, `consumeTag(tag, count): boolean`, `add(stack)` (leftover
or null). BaseView: `setLit(pieceId, lit)`. ChestUi: `open(title, getChest, onChange)`.

## Change
- games/dayg/src/base/actions.ts:
  - On base.onChange and at start: remove every interactable you added, then add one per piece (below). y is plot.y
    unless said otherwise.
  - Door (at edgeCenter, y plot.y + 1, radius 2.4): barricade over it -> 'Barricaded' (act: hint "Take the barricade
    down first."); open -> 'Close the door' (act: base.setDoor(id, { open: false }); then if hasLock and the player has
    a KEY: setDoor(id, { locked: true }) and hint "You lock it behind you."); closed and locked -> has KEY ?
    'Unlock and open' (setDoor locked false then open true) : 'Locked' (hint "You need the key."); closed and unlocked
    -> 'Open the door'.
  - Ladder (at the top of its wall: edgeCenter, y plot.y + 3.2, radius 2): up ? 'Let the ladder down' : 'Pull up the
    ladder'; act: base.startWork('Moving the ladder', LADDER_PULL_SECONDS, () => base.setLadderUp(id, !up)).
  - Chest (cellCenter, radius 2): 'Open the chest' -> chest.open('Storage chest', () => piece.items (look the piece up
    again by id each time), () => base.touch()).
  - Bed (cellCenter, radius 2): night: if base.sealedAt(player.pos) and hatless.nearCount(player.pos, BED.hatlessRadius)
    === 0 -> 'Sleep until dawn', else 'Not safe to sleep here' (act: hint "Wall yourself in first, and make sure nothing
    is close."); day -> 'Rest a while'. Null while sleeping, resting or camp.sleeping(). Sleep: clock.setRate(BED.sleepRate)
    until !clock.night, then rate 1 and emit 'base-slept' { hours: slept sun-hours, sealed: base.sealedAt(player.pos),
    locked: at least one door and every door closed and locked }. Rest: BED.restRate for BED.restSunHours. 'player-hit'
    wakes you (rate 1, hint "You wake to scratching.", no 'base-slept').
  - Workbench (cellCenter, radius 2): has TIMBER and a SAW -> 'Saw a log into planks' (startWork('Sawing planks',
    SAW_PLANKS.seconds, consumeTag('TIMBER', 1) then inv.add({ def: 'plank', count: 2, condition: 1 }); leftover ->
    hint "No room for the planks.")); else 'Workbench (needs a timber log and a saw)' with a hint on act.
  - Fire ring (cellCenter, radius 2.2): label null while camp.nearFire(centre); with TINDER, FUEL and a FIRESTARTER ->
    'Light a fire in the ring' (startWork('Lighting a fire', FIRE_RING.seconds, consumeTag('TINDER', 1),
    consumeTag('FUEL', 1), camp.placeFire(x, plot.y, z, FIRE_RING.burnHours))); else null.
  - `update(dt)`: for each fire ring, view.setLit(id, camp.nearFire(centre)); finish sleep and rest as above.
  - `sleeping()`: true while the bed sleep runs.

## Contract
```ts
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { CampSystem, Clock, HatlessSystem, InventorySystem, PlayerState } from '../game/types';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
import type { ChestUi } from './chestUi';
export interface PieceActionDeps { base: BaseSystem; view: BaseView; interact: Interact; inv: InventorySystem; bus: Bus; clock: Clock; camp: CampSystem; hatless: HatlessSystem; getPlayer: () => PlayerState; chest: ChestUi }
export interface PieceActions { update(dt: number): void; sleeping(): boolean }
export function createPieceActions(deps: PieceActionDeps): PieceActions;
```

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in actions.ts.
- `cd games/dayg && npx vitest run src/base` still passes.
- With the dev server on 5295 and `?seed=1&kit=build&night=1`: in a desktop browser if you have one (say if you do
  not), claim a plot, wall a cell with a door, fit a lock (build mode), close the door with the key, sleep in the bed
  to dawn. Without a browser, at least load `http://localhost:5295/?seed=1&basedemo=1&spawn=326,402` and run
  `bash tools/smoke.sh "<that url>" dayg-hud dayg-chest`.

## Out of scope
Every other file: build.ts, system.ts, camp.ts, interact.ts, main.ts.
~~~~

### Round 4, Epic 4: phone pass

~~~~text
Epic: 4 Phone pass (issue 4.1 Phone layout pass)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Game: games/dayg (TypeScript strict). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`, `git commit` or `git stash`.
- You are the only worker. Edit only the files under Change.
- Dev server: `cd games/dayg && npx vite --port 5296 --strictPort` in the background; stop it when done.
- Repo rules: every game plays on a phone: 44 px+ touch targets, no hover-only UI, portrait and landscape phone layouts
  with safe-area insets, no desktop-only keys without a touch equivalent.

## Goal
Base building fits and works on a phone in portrait and landscape: no overlaps with the HUD, the touch block, the move
stick zone or the context prompt, readable text, and every build verb reachable by touch.

## Read first
- games/dayg/src/base/buildUi.ts and games/dayg/src/base/chestUi.ts: the two files you may change.
- games/dayg/src/ui/touch.ts: the touch block (212 x 252 px bottom-right, 12 px from the safe-area corner), the stick
  zone (left 45% of the width, bottom 60%), VIEW (48 px top-right under the 64 px top bar).
- games/dayg/src/config.ts: LAYOUT (topBar 64, promptBottom 120: the context prompt sits 120 px above the bottom, centred).
- games/dayg/src/ui/hud.ts: what the top bar shows (read only).

## Change
- games/dayg/src/base/buildUi.ts and games/dayg/src/base/chestUi.ts: fix whatever the screenshots below show: overlaps,
  controls under 44 px, text under 11 px, a strip that does not scroll, controls under a notch (safe-area insets), the
  landscape action row covering the stick zone (move it, or shrink it to icons with aria-labels). Keep every exported
  signature and every handler call unchanged.

## Contract
The BuildUi and ChestUi interfaces stay exactly as they are (createBuildUi(ui, h), createChestUi(ui, deps)).

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in either file.
- Screenshots at 390x844 and 844x390, each opened with Read, of:
  `http://localhost:5296/?seed=1&touch=1&kit=build&build=1&spawn=326,416` (claim mode),
  `...&buildui=1` (build mode sample), `...&buildui=claim`, `...&chestui=1`.
  Edge: "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-41-<name>.png" "<url>"
  In every one: nothing overlaps the HUD top bar, ACT / PACK / CROUCH / UP / HIT / VIEW, the context prompt line or
  another control; every control is at least 44 px; nothing is cut off.
- `bash tools/smoke.sh "http://localhost:5296/?seed=1&kit=build&build=1" dayg-build dayg-chest` passes.
- Your report lists each fix and attaches the screenshot paths.

## Out of scope
Every other file: touch.ts, hud.ts, build.ts, actions.ts, main.ts.
~~~~

---

## 5. End-of-round checks (planner)

- Every round: `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`; the sim
  `--json` output compared with the Step 0 "before" file (`cmp`); fix `main.ts` wiring.
- Round 1 also: `npm test -w packages/prefabs`. Round 2 also: `npm test -w packages/achievements`.
- Round 3: with `npm run dev -w games/dayg`, the desktop loop on `?seed=1&kit=build&night=1`: claim a Forecourt plot,
  wall a cell, hang a door, fit a lock, sleep sealed in (Locked In), barricade a gap, pull Hatless with noise and watch
  the barricade wear down and break, repair a wall, reload the page and find the base and the chest contents again.
  `bash tools/smoke.sh "http://localhost:5206/?seed=1&kit=build&build=1" dayg-hud dayg-inv dayg-touch dayg-build dayg-chest`;
  `npm run zfight -- "http://localhost:5206/?seed=1&basedemo=1&spawn=326,402"`.
- Round 4: the same loop with touch only at 390x844 and 844x390 (`?touch=1`), smoke at both sizes; then commit, push
  and open the PR against the default branch (`--repo cstabnick/lawn-gnome-panic`), with a demo GIF recorded by
  `npm run demo -- <demo.json> --gif` and uploaded through the media-upload MCP. The PR says: single-player (multiplayer
  ownership waits for phase 5), mobile supported, what was and was not tried on a real phone.
