# DayG roadmap 10: building interiors you walk into

## 1. Goal

Every place in the Lychgate and the Old Rows that holds loot behind walls becomes a real building: a shell with a door
or a broken-open gap, rooms divided by inner walls with doorways, stairs or climb routes to upper floors and shelves, and
the loot containers placed in those rooms. The player gets in only by walking through the opening: there is no warp, no
loading screen and no "enter" menu, because the collider already covers the interior and nothing swaps scenes. The camera
works indoors: the roof and the floors above the player fade out, the camera stays out of walls and ceilings, and in tight
spots it moves in close behind the gnome's head, with touch look working the same on a phone.

### In scope

- A building data format (`BuildingDef`) and an expander that turns it into ordinary blockout blocks, routes, pits,
  containers, spots and props, following the existing no-shared-face rule.
- A checker: doors are big enough and can be walked through, every container is reachable and every room has a way out,
  no coplanar faces, nothing clashes with the existing blockout, headroom over stairs.
- Five hand-authored buildings: the Potting Shed (Bin Corner), the Bier House (Forecourt), the Rowkeepers' House (Yew
  Edge), the Mausoleum (Yew Edge) and the Angel Vault (Angel Square, sunk 8 gm below ground).
- The footprint test and the interior tracker (inside, storey, the cutaway set, `entered-building` events).
- The camera rule indoors: roof and upper-floor cutaway, a padded pull-in that ignores the cut blocks, a ceiling clamp on
  lower storeys, close-follow in tight spots.
- A building view: the blocks drawn per building, the cut layers fading in 0.25 s.
- Hatless at doors: they route through door and stair waypoints, see only within the same space (or through a doorway),
  and hear noise from inside a building muffled.
- Sim hooks: building containers keep their region's loot budget (no new regions, no new loot), with a conservation test.
- The "Walked In" achievement with a new `crypt-key` prefab reward.
- Mobile: no new UI except a toast; touch look unchanged indoors; phone screenshots inside every building.

### Out of scope

- Doors that open, close, lock, are barricaded or broken down (survival.md). Openings are permanent gaps this round.
- Seeded room templates (loot.md "Procedural interiors"): these layouts are hand-made; the seed still rolls the contents.
- New container types or loot tables (`cupboard`, `coffin-shelf`, `tool-bay` ...): interiors use the existing eight.
- New regions, new districts, the Bell Chapel, the real Shed, the Columbarium: not on the current map.
- Interior lighting and darkness, glass in windows, prefab furniture (shelves and furniture are blockout boxes, like the
  existing bins and beams; prefab dressing is a later pass).
- Online play: DayG is single-player so far (roadmap `dayg.md`); nothing here changes that.
- A party slice: DayG has none, and this roadmap does not add one.

## 2. Shape

| Epic | Name | Done when | Issues |
|---|---|---|---|
| 1 | Building format, rules and the interior camera | `npm test -w games/dayg` (expand, check, spaces, camera tests) and `npm run build -w games/dayg` pass; `npm test -w packages/prefabs` and `-w packages/achievements` pass; the Potting Shed is in the collider and passes `checkBuilding` | 5 |
| 2 | Seeing inside, Hatless at doors, the loot budget | the shed is drawn and its roof fades when you walk in; `npm run zfight` OK inside and outside the shed; Hatless route through doors; the budget test passes; build, test, smoke and `npm run sim -w games/dayg -- --seeds 10 --check` pass | 3 |
| 3 | Four more buildings and the camera pass | all five buildings pass `checkBuilding`; desktop and phone screenshots inside each; `npm run zfight` OK at each; build, test, smoke and the sim check pass | 5 |

### Rounds

| Round | Epic | Issues |
|---|---|---|
| 0 | Step 0, planner-written (section 3) | types, config, events, stubs, the blockout merge, `main.ts` wiring |
| 1 | 1 | 1.1 Expander and the Potting Shed, 1.2 Building checker, 1.3 Spaces and the interior tracker, 1.4 Interior camera rule, 1.5 Walked In achievement |
| 2 | 2 | 2.1 Building view and cutaway, 2.2 Hatless at doors, 2.3 Loot budget test |
| 3 | 3 | 3.1 The Bier House, 3.2 The Rowkeepers' House, 3.3 The Mausoleum, 3.4 The Angel Vault, 3.5 Camera pass in the shed |

### End of each round (planner)

- Round 1: `npm test -w games/dayg`, `npm run build -w games/dayg`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`.
  The shed's `building potting-shed` test now runs the real checker (1.2): fix small problems in `pottingShed.ts`.
- Round 2: add `index: buildingIndex` to the `createHatlessSystem({...})` call in `main.ts` (2.2 makes it an optional dep).
  Then build, test, smoke (`bash tools/smoke.sh "http://localhost:5206/?seed=1" game`), sim check.
- Round 3: build, test, smoke, sim check, `npm run zfight` at each building (URLs below), commit, push, PR against `main`
  on `cstabnick/lawn-gnome-panic` (`gh pr create --repo cstabnick/lawn-gnome-panic`). Demo GIF: record with
  `npm run demo -- <demo.json> --gif`, upload with the media-upload MCP, put the URL in the PR description. Never use
  the `demo-assets` branch.

### Ports (one per issue, never shared)

1.4: 5251. 2.1: 5261, 2.2: 5262. 3.1: 5271, 3.2: 5272, 3.3: 5273, 3.4: 5274, 3.5: 5275. Planner: 5206.
Start with `cd games/dayg && npx vite --port <port> --strictPort` (background) and stop it when done.

### Screenshot command (used by every visual issue)

```sh
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-<issue>-<name>.png" \
  "http://localhost:<port>/?seed=1&touch=1&spawn=<x>,<z>,<y>&yaw=<radians>"
```

Repeat with `--window-size=844,390` (landscape) and `--window-size=1280,720` without `&touch=1` (desktop). Open each PNG
with the Read tool and describe it. `spawn=x,z,y` puts the player on the highest surface at or below y + 0.5 (so `y=0`
is the ground floor, not the roof); `yaw` turns the camera: 0 looks south (+z), 1.571 east, 3.142 north, -1.571 west.

### Interior viewpoints (used for screenshots and zfight)

| Building | Outside the door | Inside | Second room / upper floor |
|---|---|---|---|
| potting-shed | `spawn=443.5,462,0&yaw=1.571` | `spawn=452,468,0&yaw=1.571` | paint corner `spawn=451,477,0&yaw=3.142` |
| bier-house | `spawn=379,463,0&yaw=3.142` | `spawn=379,455,0&yaw=3.142` | loft `spawn=385,430,12&yaw=1.571` |
| rowkeepers-house | `spawn=174.2,97,0&yaw=3.142` | parlour `spawn=174,90,0&yaw=3.142` | upstairs `spawn=181,86,3.6&yaw=-1.571` |
| mausoleum | `spawn=238.5,35,0&yaw=0` | antechamber `spawn=238.5,45,0&yaw=0` | top shelf `spawn=226.6,64,21&yaw=1.571` |
| angel-vault | `spawn=173.5,185,0&yaw=0` | landing `spawn=173.5,191,0&yaw=0` | ossuary `spawn=173.5,207.5,-8&yaw=-1.571` |

### Dependencies that remain

- 1.4 (camera) cannot take an interior screenshot in round 1: the building view lands in round 2. It checks the rule with
  unit tests and an outdoor screenshot; 3.5 takes the interior and phone screenshots and tunes the camera.
- 1.1's per-building test calls `checkBuilding`, which is a stub until 1.2 lands; the planner runs it at the end of round 1.
- The four buildings wait for round 3 because their zfight and interior screenshots need the view (2.1).
- `main.ts` passes the building index to the Hatless only after 2.2 adds the optional dep (planner, end of round 2).

---

## 3. Step 0: foundation (planner-written)

The planner does all of this before round 1, then runs `npx tsc --noEmit -p games/dayg`, `npm test -w games/dayg` and
`npm run build -w games/dayg`. Every stub keeps the final exported signature.

### 3.1 `games/dayg/src/world/buildingTypes.ts` (new, verbatim)

```ts
// Building interiors: what an author writes (BuildingDef) and what it expands into (BuildingParts).
// Units gm (1 three.js unit); x grows east, z grows south. Every rect is axis-aligned. Pure data: no three.js.
import type { ContainerDef, ContainerType, ItemId, Rect, RegionId } from '../sim/types';
import type { BlockDef, ClimbRouteDef, PitDef, PropDef, RouteKind, Side, SpotDef, SpotKind } from './types';

export type BuildingStyle = 'plank' | 'brick' | 'marble' | 'stone' | 'cottage';
export type BuildingRole = 'wall' | 'inner' | 'lintel' | 'floor' | 'roof' | 'stair' | 'shelf' | 'furniture';

/** A gap in a wall. `at` = gm along the wall from its start (shell: the footprint's x0 for n/s walls, z0 for e/w walls;
 *  inner wall: its own x0 or z0) to the gap's near edge. The gap runs from the wall's base + sill up `height` gm. */
export interface OpeningDef { id: string; at: number; width: number; height: number; sill?: number }
/** A gap in the shell. door: true = a way in (sill 0, at least DOOR.minWidth x DOOR.minHeight). */
export interface ShellOpeningDef extends OpeningDef { side: Side; door?: boolean }
/** An inner wall: one box from y to y + h, long along x when (x1 - x0) >= (z1 - z0), else along z. */
export interface WallDef { id: string; x0: number; x1: number; z0: number; z1: number; y: number; h: number; openings: OpeningDef[] }
/** A floor slab whose top is storeys[storey] (storey >= 1). holes: stairwells, cut out of rect. thick default 0.4. */
export interface FloorDef { storey: number; rect: Rect; holes?: Rect[]; thick?: number }
/** A flight of solid steps over rect, rising toward side `up`, from fromY to toY (the top step's top is toY - 0.1). */
export interface StairDef { id: string; rect: Rect; up: Side; fromY: number; toY: number }
/** Furniture and shelves: one solid box each. */
export interface BoxDef { id: string; role: 'shelf' | 'furniture'; x0: number; x1: number; z0: number; z1: number; y: number; h: number }
/** A fixed climb route on one of this building's blocks, by local id (a box id, `${stair.id}-${k}`, `${wall.id}-${i}`). */
export interface RouteSpec { block: string; side: Side; kind: RouteKind; at: number }
export interface BuildingContainerDef { id: string; type: ContainerType; x: number; y: number; z: number; guaranteed?: ItemId[] }
export interface BuildingSpotDef { id: string; kind: SpotKind; x: number; y: number; z: number }

export interface BuildingDef {
  id: string; name: string; region: RegionId; style: BuildingStyle;
  /** true while the layout is not authored yet: expands to nothing and is not checked. */
  draft?: boolean;
  footprint: Rect;                 // outer faces of the shell
  storeys: number[];               // floor tops, ascending; storeys[0] is the ground floor (0, or -sunk)
  sunk?: number;                   // the ground floor is a pit this deep, cut to the interior inset 0.2
  shell: { thick: number; height: number; openings: ShellOpeningDef[] };
  roof: { thick: number; eaves: number; ridge?: number };
  walls: WallDef[]; floors: FloorDef[]; stairs: StairDef[]; boxes: BoxDef[];
  routes: RouteSpec[]; containers: BuildingContainerDef[]; spots: BuildingSpotDef[]; props: PropDef[];
}

export interface DoorInfo {
  id: string; building: string; side: Side;
  x: number; z: number; y: number;          // gap centre on the wall's mid-line; y = the gap's bottom
  width: number; height: number;
  rect: Rect;                               // the gap through the wall (opening width x wall thickness)
  inX: number; inZ: number; outX: number; outZ: number; // DOOR.approach gm inside / outside the wall faces
}
export interface StairInfo { id: string; rect: Rect; fromY: number; toY: number; footX: number; footZ: number; topX: number; topZ: number }

export interface BuildingParts {
  def: BuildingDef;
  blocks: BlockDef[];                       // ids start with `${BUILDING_PREFIX}${def.id}-`
  role: Record<string, BuildingRole>;       // block id -> role
  layer: Record<string, number>;            // block id -> storey index; roof blocks = storeys.length
  routes: ClimbRouteDef[]; pits: PitDef[]; containers: ContainerDef[]; spots: SpotDef[]; props: PropDef[];
  interior: Rect;                           // footprint inset by shell.thick
  roofY: number;                            // bottom of the roof (shell.height - 0.2)
  doors: DoorInfo[]; stairs: StairInfo[];
  cut: string[][];                          // cut[s]: ids hidden while the player is inside on storey s (floors above s, roof)
}
```

### 3.2 `src/config.ts` (append, verbatim)

```ts
/** Building interiors (roadmap 10). */
export const BUILDING_PREFIX = 'bld-';   // every building block id starts with this
export const STAIR_RISE = 0.4;            // max step height (STEP_UP is 0.5)
export const DOOR = { minWidth: 2.4, minHeight: 2.8, approach: 1.5 } as const;
export const INTERIOR = {
  enterInset: 0.3,   // gm inside the interior rect before the player counts as inside
  exitPad: 0.6,      // gm outside the footprint before the player counts as outside again
  fadeSeconds: 0.25, // roof and upper floors fade out / in
  distance: 3.2,     // third-person distance indoors (CAMERA.distance outdoors)
  pitchMin: 0.1, pitchMax: 1.2, pitchEnter: 0.45, pitchEaseSeconds: 0.4,
  solidPad: 0.35,    // the camera keeps this far from every block (camera.near is 0.3)
  ceilPad: 0.3,      // gm below the ceiling of a lower storey
  closeAt: 1.1, closeExitAt: 1.5, closeHold: 0.3, // close-follow when pulled in under 1.1 gm; leave after 0.3 s over 1.5
  muffle: 0.6,       // noise from inside a building reaches other spaces at this share of its radius
  doorSight: 8,      // a Hatless in or at a doorway sees through it this far
} as const;
```

### 3.3 `src/game/bus.ts` (add to `GameEvents`)

```ts
  'entered-building': { building: string; region: RegionId; door: string | null };  // walked in (never on the first frame)
  'left-building': { building: string };
```

### 3.4 `src/game/types.ts`

`CameraRig` gains `close: boolean` (true in first person and in close-follow; `main.ts` hides the player model then):
`export interface CameraRig { yaw: number; pitch: number; view: 'third' | 'first'; close: boolean; update(...same...): void }`.

### 3.5 `src/world/collide.ts`: `solidAt` (verbatim)

Add to the `Collider` interface and the returned object:

```ts
  /** True when (x, y, z) lies within `pad` of a block's box (ids in `skip` ignored), or under the base ground. */
  solidAt(x: number, y: number, z: number, pad: number, skip?: ReadonlySet<string>): boolean;
```
```ts
    solidAt(x, y, z, pad, skip) {
      if (y < baseAt(x, z) - 0.05) return true;
      for (const b of blocksIn(x - pad, z - pad, x + pad, z + pad)) {
        if (skip?.has(b.id)) continue;
        if (x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad && y >= b.y - pad && y <= b.y + b.h + pad) return true;
      }
      return false;
    },
```

### 3.6 Stubs (final signatures, trivial bodies)

- `src/world/buildingExpand.ts`: `export function expandBuilding(def: BuildingDef): BuildingParts` returning empty
  arrays, `role: {}`, `layer: {}`, `interior` = footprint inset by `shell.thick`, `roofY: shell.height - 0.2`,
  `cut: def.storeys.map(() => [])`.
- `src/world/buildingCheck.ts`: `export function checkBuilding(parts: BuildingParts, others: readonly BlockDef[]): string[]` returning `[]`.
- `src/world/spaces.ts`: the `Space` and `BuildingIndex` interfaces from issue 1.3's Contract, and
  `createBuildingIndex(parts)` returning nulls (`spaceOf` returns `{ building: null, storey: 0, doorway: null }`,
  `nextWaypoint` null, `storeyAt` 0, `byId` a real find).
- `src/game/interior.ts`: `InteriorState`, `InteriorTracker` from issue 1.3's Contract; `createInteriorTracker` returns
  `{ state: { building: null, storey: 0, skip: new Set(), ceilY: null, door: null }, update() {} }`.
- `src/scene/buildingsView.ts`: `export interface BuildingsView { root: THREE.Group; update(state: InteriorState, dt: number): void }`
  and `buildBuildings(scene, parts)` adding an empty group.
- `src/game/camera.ts`: add `close: false` to the rig and an ignored third parameter `interior?: { state: InteriorState }`.
- `src/world/buildings/` (data, one file per building): `pottingShed.ts` (`POTTING_SHED`), `bierHouse.ts` (`BIER_HOUSE`),
  `rowkeepersHouse.ts` (`ROWKEEPERS_HOUSE`), `mausoleum.ts` (`MAUSOLEUM`), `angelVault.ts` (`ANGEL_VAULT`). Each is a
  `draft: true` def with its final id, name, region, style, footprint, storeys, shell, roof, `sunk`, and empty arrays:

| Const | id | name | region | style | footprint | storeys | sunk | shell (thick, height) | roof (thick, eaves, ridge) |
|---|---|---|---|---|---|---|---|---|---|
| POTTING_SHED | potting-shed | The Potting Shed | bin-corner | plank | 446-474 x, 452-484 z | [0] | | 0.6, 24 | 0.8, 0.6, 1.5 |
| BIER_HOUSE | bier-house | The Bier House | forecourt | brick | 364-394, 424-460 | [0, 12] | | 1, 26 | 1, 0.8, 2 |
| ROWKEEPERS_HOUSE | rowkeepers-house | The Rowkeepers' House | yew-edge | cottage | 170-186, 80-94 | [0, 3.6] | | 0.5, 7.6 | 0.5, 0.5, 1.2 |
| MAUSOLEUM | mausoleum | The Mausoleum | yew-edge | marble | 224-254, 38-74 | [0] | | 1.5, 44 | 2, 1, 4 |
| ANGEL_VAULT | angel-vault | The Angel Vault | angel-square | stone | 160-188, 188-212 | [-8] | 8 | 1, 14 | 1, 0.5, 2 |

  These footprints were checked against the current blockout (no block, pit, container, spot, prop, path or water within
  3 gm, and each lies inside one region).
- `src/world/buildings/index.ts`:
  ```ts
  import type { BuildingDef, BuildingParts } from '../buildingTypes';
  import { expandBuilding } from '../buildingExpand';
  import { POTTING_SHED } from './pottingShed';
  import { BIER_HOUSE } from './bierHouse';
  import { ROWKEEPERS_HOUSE } from './rowkeepersHouse';
  import { MAUSOLEUM } from './mausoleum';
  import { ANGEL_VAULT } from './angelVault';
  export const BUILDINGS: readonly BuildingDef[] = [POTTING_SHED, BIER_HOUSE, ROWKEEPERS_HOUSE, MAUSOLEUM, ANGEL_VAULT];
  export const BUILDING_PARTS: readonly BuildingParts[] = BUILDINGS.map(expandBuilding);
  ```

### 3.7 `src/world/blockout.ts`: merge the buildings (verbatim, just before `export const MAP`)

```ts
// ---------- buildings (roadmap 10): their blocks, routes, pits, containers, spots and props ----------
for (const p of BUILDING_PARTS) {
  blocks.push(...p.blocks); routes.push(...p.routes); pits.push(...p.pits);
  containers.push(...p.containers); spots.push(...p.spots); props.push(...p.props);
}
```
with `import { BUILDING_PARTS } from './buildings/index';`. Re-read `blockout.ts` first: other roadmaps edit it.

### 3.8 `src/main.ts`

- Imports: `BUILDING_PARTS`, `createBuildingIndex`, `createInteriorTracker`, `buildBuildings`.
- After `buildWorld`: `const buildingIndex = createBuildingIndex(BUILDING_PARTS); const buildingsView = buildBuildings(scene, BUILDING_PARTS); const interior = createInteriorTracker({ index: buildingIndex, bus });`
- `createCameraRig(camera, collider, interior)`; then `?yaw=<radians>` sets `rig.yaw` when finite.
- `?spawn=x,z` keeps today's behaviour; `?spawn=x,z,y` uses `collider.groundAt(x, z, y)`.
- Frame: `interior.update(player.pos, dt)` right after `controller.update`; `buildingsView.update(interior.state, dt)` right
  after `rig.update`; `playerView.model.object.visible = !rig.close` right after `playerView.update`.
- `bus.on('entered-building', ...)`: the first time per building, `hud.toast(buildingIndex.byId(e.building)?.def.name ?? e.building)`.
- `window.__dayg` gains `interior` and `buildingIndex`.

### 3.9 Docs (lore record)

`npm run lore -- find` has no entries for Mossgrave buildings (DayG lore lives in `docs/design/dayg/`). Record the five
names as zones: in `docs/design/dayg/regions.md`, add the Potting Shed to Bin Corner's zones, the Bier House to the
Forecourt's, the Rowkeepers' House and the Mausoleum to Yew Edge's, the Angel Vault to Angel Square's. In
`docs/design/dayg/loot.md` "Procedural interiors", add: "Until the seeded room templates exist, interiors are hand-made
layouts (roadmap 10); the seed still rolls every container."

---

## 4. Issues

### Round 1, Epic 1: building format, rules and the interior camera

~~~~text
Epic: 1 Building format, rules and the interior camera (issue 1.1 Expander and the Potting Shed)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time (the building checker in
  src/world/buildingCheck.ts, src/world/spaces.ts, src/game/camera.ts, achievements). Edit only the files under Change.
- 3D rule (docs/rendering.md): boxes that touch must not share a face. Two boxes whose faces lie in the same plane with
  the same facing and overlap by any area flicker; overlap boxes by 0.05-0.1 instead, and keep tops 0.1 apart.

## Goal
`expandBuilding(def)` turns a BuildingDef into blockout blocks, routes, pits, containers, spots, props, doors, stairs
and cutaway lists, and the Potting Shed exists as real data that the collider walks.

## Read first
- games/dayg/src/world/buildingTypes.ts: every type you produce (BuildingDef, BuildingParts, DoorInfo, StairInfo).
- games/dayg/src/world/types.ts: BlockDef, ClimbRouteDef, PitDef, SpotDef, Side (n = face at z0, s = z1, w = x0, e = x1).
- games/dayg/src/config.ts: BUILDING_PREFIX ('bld-'), STAIR_RISE (0.4), DOOR (approach 1.5).
- games/dayg/src/world/buildingExpand.ts (the stub you replace) and src/world/buildings/pottingShed.ts (the draft you fill).
- games/dayg/src/world/blockout.ts lines 1-60: the helper style and the no-shared-face comment.

## Change
- games/dayg/src/world/buildingExpand.ts: implement expandBuilding.
- games/dayg/src/world/buildings/pottingShed.ts: replace the draft with the data under Contract (remove `draft`).
- games/dayg/src/world/buildingExpand.test.ts (new): the tests under Done when.

## Contract
export function expandBuilding(def: BuildingDef): BuildingParts;   // drafts: empty parts, as the stub does
Let p = `${BUILDING_PREFIX}${def.id}-`, f = def.footprint, t = def.shell.thick, H = def.shell.height.
Every block: kind 'roof' for roof and ridge, else 'wall'. role[id] and layer[id] set for every block.
layer of a non-floor, non-roof block = highest i with storeys[i] <= block.y + 0.5 (0 if none).
1. Shell (base y = 0 always, even when sunk). n and s are "through" walls 0.1 longer each end and 0.1 taller:
   n: x [f.x0-0.1, f.x1+0.1], z [f.z0, f.z0+t], h H+0.1      s: x same, z [f.z1-t, f.z1], h H+0.1
   w: x [f.x0, f.x0+t], z [f.z0+t-0.1, f.z1-t+0.1], h H       e: x [f.x1-t, f.x1], z same, h H
   Openings of side S: gap along the wall's long axis from (f.x0 or f.z0) + at to + at + width, from y = sill (default 0)
   to sill + height. Split the wall into pieces around the gaps (skip pieces shorter than 0.05): ids `${p}wall-${S}-${i}`,
   role 'wall'. Above a gap whose top < wall top - 0.05: a lintel `${p}wall-${S}-l-${opening.id}`, role 'lintel', along
   [gap0-0.1, gap1+0.1], across the wall inset 0.1 on both faces (thickness t-0.2), y = gap top, top = wall top + 0.1.
   Below a gap with sill > 0.05: a sill block `${p}wall-${S}-s-${opening.id}`, role 'lintel', along [gap0-0.1, gap1+0.1],
   inset 0.1, y = 0, h = sill.
2. Inner walls: the same splitting with base y = wall.y, top = wall.y + wall.h, `at` from the wall's own x0 (long along x
   when x1-x0 >= z1-z0) or z0; ids `${p}${wall.id}-${i}`, `${p}${wall.id}-l-${o.id}`, `${p}${wall.id}-s-${o.id}`;
   pieces role 'inner', lintels/sills role 'lintel'.
3. Floors: slab top = storeys[floor.storey], thick = floor.thick ?? 0.4, y = top - thick. Cut floor.rect around its holes
   (clip holes to rect): sorted unique xs = rect.x0, rect.x1 and every hole x0/x1 inside; zs likewise; keep each cell
   whose centre is in no hole; merge neighbouring kept cells in the same z band along x. Ids `${p}floor${storey}-${k}`,
   role 'floor', layer = floor.storey.
4. Stairs: rise = toY - 0.1 - fromY; n = ceil(rise / STAIR_RISE); step k (k = 0 lowest) is a box from y = fromY with
   h = rise * (k+1) / n, one n-th of the rect's length along the climb axis, starting at the low end ('n' rises toward
   z0, so step 0 is at the z1 end; 's' toward z1; 'w' toward x0; 'e' toward x1). Ids `${p}${stair.id}-${k}`, role 'stair'.
   StairInfo: rect, fromY, toY; top point = 1.0 gm beyond the high end's centre, foot point = 1.0 beyond the low end's centre.
5. Boxes: one block each, id `${p}${box.id}`, role = box.role.
6. Roof: `${p}roof` x [f.x0-eaves, f.x1+eaves], z [f.z0-eaves, f.z1+eaves], y = H - 0.2, h = roof.thick, role 'roof',
   layer storeys.length. If roof.ridge: `${p}ridge` spans the footprint's full long side (no eaves) and the middle 40% of
   its short side, y = roof top - 0.1, h = ridge, role 'roof', layer storeys.length. roofY = H - 0.2.
7. sunk: pits = [{ id: `${p}pit`, rect: interior inset 0.2, depth: sunk }] (storeys[0] is -sunk).
8. Routes: spec i -> { id: `r-${def.id}-${i}`, block: `${p}${spec.block}`, side, kind, at }.
   Containers -> { ...c, id: `c-${def.id}-${c.id}`, region: def.region }. Spots -> id `h-${def.id}-${id}` (hatless),
   `n-${def.id}-${id}` (npc), else `${kind}-${def.id}-${id}`; region def.region. Props copied.
9. Doors (shell openings with door: true): DoorInfo { id: opening.id, building: def.id, side, width, height, y: sill ?? 0,
   x/z = gap centre on the wall mid-line, rect = gap x wall thickness, in = DOOR.approach inside the inner face,
   out = DOOR.approach outside the outer face }. E.g. side 'w': z = f.z0 + at + width/2, x = f.x0 + t/2,
   inX = f.x0 + t + 1.5, outX = f.x0 - 1.5.
10. interior = footprint inset by t. cut[s] (s = 0..storeys.length-1) = ids with role 'floor' or 'roof' and layer > s.

Potting Shed data (src/world/buildings/pottingShed.ts), verbatim:
export const POTTING_SHED: BuildingDef = {
  id: 'potting-shed', name: 'The Potting Shed', region: 'bin-corner', style: 'plank',
  footprint: { x0: 446, x1: 474, z0: 452, z1: 484 }, storeys: [0],
  shell: { thick: 0.6, height: 24, openings: [
    { id: 'door', side: 'w', at: 8.5, width: 3, height: 20, door: true },          // the door hangs open a hand's width
    { id: 'window-e', side: 'e', at: 12, width: 6, height: 5, sill: 13 },
  ] },
  roof: { thick: 0.8, eaves: 0.6, ridge: 1.5 },
  walls: [{ id: 'trays', x0: 446.5, x1: 458, z0: 474, z1: 475, y: 0, h: 3, openings: [{ id: 'gap', at: 7, width: 2.5, height: 3 }] }],
  floors: [], stairs: [],
  boxes: [
    { id: 'shelf-low', role: 'shelf', x0: 466, x1: 473.5, z0: 456, z1: 480, y: 0, h: 5.5 },
    { id: 'shelf-high', role: 'shelf', x0: 469.5, x1: 473.6, z0: 458, z1: 478, y: 5.5, h: 5.5 },
    { id: 'bench', role: 'furniture', x0: 452, x1: 464, z0: 452.5, z1: 456, y: 0, h: 9 },
    { id: 'sacks', role: 'furniture', x0: 446.5, x1: 452, z0: 479, z1: 483.45, y: 0, h: 1.2 },
    { id: 'paint-tins', role: 'furniture', x0: 455, x1: 457.5, z0: 480.5, z1: 483.45, y: 0, h: 2.5 },
  ],
  routes: [
    { block: 'shelf-low', side: 'w', kind: 'rope', at: 12 },
    { block: 'shelf-high', side: 'w', kind: 'rope', at: 4 },
    { block: 'bench', side: 's', kind: 'ladder', at: 6 },
  ],
  containers: [
    { id: 'crate-1', type: 'crate', x: 461, y: 0, z: 470 },
    { id: 'sacks', type: 'sack', x: 449, y: 1.2, z: 481.5 },
    { id: 'bench-chest', type: 'chest', x: 455, y: 9, z: 454.2 },
    { id: 'high-shelf', type: 'camp-cache', x: 471.5, y: 11, z: 470 },
    { id: 'paint-crate', type: 'crate', x: 450, y: 0, z: 476.8 },
  ],
  spots: [{ id: '1', kind: 'npc', x: 471.5, y: 11, z: 475 }, { id: '1', kind: 'hatless', x: 462, y: 0, z: 478 }],
  props: [{ prefab: 'flower-pot', x: 461, y: 9, z: 454 }, { prefab: 'candle', x: 449, y: 1.2, z: 480 }, { prefab: 'garden-rock', x: 468, y: 0, z: 482 }],
};

## Done when
- `cd games/dayg && npx vitest run src/world/buildingExpand.test.ts` passes, with tests that, on POTTING_SHED:
  every block id starts with 'bld-potting-shed-' and has h > 0; the west wall has 2 pieces and one lintel
  (bld-potting-shed-wall-w-l-door, y 20); the east wall has a sill (y 0, h 13) and a lintel; there is one door with
  in point (448.1, 462) and out point (444.5, 462); cut[0] contains bld-potting-shed-roof and bld-potting-shed-ridge;
  routes have ids r-potting-shed-0..2 and block ids that exist; containers have ids c-potting-shed-* and region
  'bin-corner'; and on a small two-storey fixture def written in the test: the floor slab is split around a stair hole
  (no slab block overlaps the hole), the stair has ceil((toY-0.1-fromY)/0.4) steps whose last top is toY - 0.1, and
  cut[1] holds only the roof blocks. Plus one test per building:
  `for (const def of BUILDINGS) it.skipIf(def.draft === true)(\`building ${def.id}\`, () => expect(checkBuilding(expandBuilding(def), MAP.blocks.filter((b) => !b.id.startsWith(BUILDING_PREFIX)))).toEqual([]))`
  (import BUILDINGS from './buildings/index', checkBuilding from './buildingCheck', MAP from './blockout').
- `npx tsc --noEmit -p games/dayg` shows no errors in your files.
- `cd games/dayg && npx vitest run src/sim/sim.test.ts` still passes (checkMap sees the shed's blocks and containers).

## Out of scope
src/world/buildingTypes.ts, src/config.ts, src/world/blockout.ts, src/world/buildings/index.ts (planner);
src/world/buildingCheck.ts (issue 1.2); the other building data files; src/world/collide.ts.
~~~~

~~~~text
Epic: 1 Building format, rules and the interior camera (issue 1.2 Building checker)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time; expandBuilding (src/world/buildingExpand.ts)
  is still a stub while you work, so your tests build BuildingParts fixtures by hand. Edit only the files under Change.
- Pure module: no three.js, no DOM.

## Goal
`checkBuilding(parts, others)` lists every problem that would make a building unplayable: no way in, a door you can't
walk through, a container you can't reach or can't leave from, flickering faces, clashes with the map, no headroom.

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingParts, DoorInfo, StairInfo, BuildingDef.
- games/dayg/src/world/collide.ts: createCollider(map), groundAt, move (returns the id it hit or null), baseAt.
- games/dayg/src/config.ts: PLAYER_RADIUS 0.45, PLAYER_HEIGHT 1.7, STEP_UP 0.5, VAULT_MAX 1.6, DOOR.
- games/dayg/src/sim/regions.ts: REGIONS (rects), regionAt(x, z).
- games/dayg/src/world/collide.test.ts: how a tiny BlockoutMap is built for a collider (stay inside a region rect, e.g.
  Ivy Rows x 0..160, z 240..400, or the collider's bounds test blocks you).

## Change
- games/dayg/src/world/buildingCheck.ts: implement checkBuilding.
- games/dayg/src/world/buildingCheck.test.ts (new).

## Contract
export function checkBuilding(parts: BuildingParts, others: readonly BlockDef[]): string[];  // [] = fine
Drafts (parts.def.draft) return []. Every problem string starts with `${def.id}: ` and contains the keyword in quotes:
1. 'region': footprint not inside REGIONS' rect for def.region; a container or spot whose regionAt != def.region.
2. 'door': no door; a door narrower than DOOR.minWidth or lower than DOOR.minHeight, or with sill != 0.
   'opening': a shell opening with at < thick + 0.5 or at + width > (side length) - thick - 0.5; two openings on one side overlapping.
3. 'storey': storeys not ascending by >= 3.2; storeys[0] != (sunk ? -sunk : 0); shell.height < last storey + 3.
4. 'floats' / 'inside block': a container or spot not standing on the base ground (the pit floor -depth inside a pit of
   parts.pits, else 0) or on the top of a parts block containing (x, z); or strictly inside a parts block's height.
5. 'coplanar': draw each box with its bottom 0.05 lower (y - 0.05). For every pair among parts.blocks plus the others
   whose xz overlaps the footprint grown by 1, and each of the 6 face planes (x0 facing -x, x1 +x, z0 -z, z1 +z, bottom
   -y, top +y): same plane (|d| < 0.005), same facing, and the two face rectangles overlap with area > 1e-4 -> problem
   naming both ids. 'ground': a parts block whose top is within 0.02 of y 0 and overlaps ground outside parts.pits.
6. 'clash': an `others` block whose xz rect overlaps the footprint grown by 1.
7. 'walk-in': build a collider on { bounds: footprint grown by 4, blocks: [...parts.blocks, ...nearby others],
   routes: parts.routes, pits: parts.pits, spots: [], havens: [], water: [], paths: [], props: [], containers: [],
   playerSpawn: { x: door.outX, y: 0, z: door.outZ } }. For each door start at (outX, groundAt(outX, outZ, door.y), outZ)
   and walk to (inX, inZ) in 0.25 gm sub-steps: move(pos, dx, dz, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out); any
   non-null hit is a problem; after each step pos = out, pos.y = groundAt(pos.x, pos.z, pos.y).
8. 'headroom': a stair step (role 'stair') whose xz rect shrunk by 0.15 overlaps a non-stair parts block with
   b.y < stepTop + PLAYER_HEIGHT + 0.1 and b.y + b.h > stepTop.
9. 'route': a parts route whose block is not in parts.blocks, or whose at is off that face.
10. 'unreachable' / 'no way out': flood fill on a 0.5 gm grid over the footprint grown by 3, same collider as 7.
    Node = (ix, iz, y). Start: the node nearest each door's out point, y = groundAt there. Neighbour (4 directions):
    y' = groundAt(x', z', y + VAULT_MAX - STEP_UP) (so a step up to 1.6 is a vault); accept when
    move({ x: x', y: y', z: z' }, 0, 0, PLAYER_RADIUS, PLAYER_HEIGHT, STEP_UP, out) === null. Route links, both ways:
    face point F at `at` on the route's face, outward normal N; base = F + 0.7 N at groundAt(base, block.y + 0.4);
    top = F - 0.7 N at block.y + block.h (snap each to the nearest node that fits; try the 8 around it if not). Cap at
    200000 nodes. A container is reached when a visited node has xz distance <= 1.5 and |dy| < 2.4 (the interact
    reach). For each reached container, a second fill from its nearby nodes must reach a node within 1.0 of a door's
    out point, else 'no way out'.

## Done when
- `cd games/dayg && npx vitest run src/world/buildingCheck.test.ts` passes, with hand-built fixtures inside Ivy Rows:
  a 10 x 10 one-room building with walls in pieces around a 2.6 x 3 door gap, a roof block above and one container on
  the floor returns []; the same with the door gap 1.5 wide returns a 'door' and a 'walk-in' problem; a container
  placed inside a sealed box returns 'unreachable'; two boxes with the same top height that overlap return 'coplanar';
  a footprint across two regions returns 'region'; an `others` block inside the footprint returns 'clash'.
- `npx tsc --noEmit -p games/dayg` shows no errors in your files.

## Out of scope
src/world/buildingExpand.ts and its test (issue 1.1), src/world/collide.ts (read only), src/world/buildingTypes.ts, src/config.ts.
~~~~

~~~~text
Epic: 1 Building format, rules and the interior camera (issue 1.3 Spaces and the interior tracker)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. expandBuilding is still a stub, so your
  tests build BuildingParts fixtures by hand. Keep the stub's exported signatures exactly (main.ts and the camera use them).
- Pure modules: no three.js, no DOM.

## Goal
The footprint test (who is inside which building, on which storey), door and stair waypoints for walkers, and the
interior tracker that tells the camera and the view what to cut away and emits 'entered-building'.

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingParts (interior, roofY, doors, stairs, cut, layer, role, def.storeys).
- games/dayg/src/world/spaces.ts and src/game/interior.ts: the stubs you replace (same exports).
- games/dayg/src/config.ts: INTERIOR (enterInset 0.3, exitPad 0.6), DOOR.
- games/dayg/src/game/bus.ts: 'entered-building' { building, region, door } and 'left-building' { building }.

## Change
- games/dayg/src/world/spaces.ts: implement createBuildingIndex.
- games/dayg/src/game/interior.ts: implement createInteriorTracker.
- games/dayg/src/world/spaces.test.ts (new): tests for both.

## Contract
// spaces.ts
import type { Vec3 } from './collide';
export interface Space { building: string | null; storey: number; doorway: string | null }
export interface BuildingIndex {
  readonly parts: readonly BuildingParts[];
  byId(id: string): BuildingParts | undefined;
  insideAt(x: number, y: number, z: number, inset?: number): BuildingParts | null;  // interior rect shrunk by inset (strict)
  footprintAt(x: number, y: number, z: number, pad?: number): BuildingParts | null; // footprint grown by pad (inclusive)
  storeyAt(b: BuildingParts, y: number): number;        // highest i with storeys[i] <= y + 0.5, else 0
  ceilingAt(b: BuildingParts, storey: number): number | null; // lowest y of the floor blocks of storey + 1; null on the top storey
  doorAt(x: number, z: number): DoorInfo | null;        // inside a door's rect grown by 0.5 across the wall
  spaceOf(x: number, y: number, z: number): Space;      // building = insideAt(x,y,z)?.def.id ?? null; doorway = doorAt id
  nextWaypoint(from: Vec3, to: Vec3): { x: number; z: number } | null;
}
export function createBuildingIndex(parts: readonly BuildingParts[]): BuildingIndex;
- y test for insideAt / footprintAt: storeys[0] - 1 <= y < roofY; when y is not finite (NaN), skip the y test.
- nextWaypoint (A = from's space, B = to's space):
  1. from in a doorway d: return d's in point if B.building === d.building, else its out point.
  2. A.building === B.building: if a building and B.storey != A.storey: the stair of that building that joins those
     storeys (storeyAt(fromY) and storeyAt(toY)); going up: return its top point when from is inside its rect or within
     1.0 of its foot, else its foot; going down: the reverse. No such stair, or same storey: null.
  3. from inside building X (not B's): first, if A.storey > storeyAt(X, door.y), go down by the stair rule; else the
     door of X minimising dist(from, in) + dist(out, to): its in point if from is more than 1.0 from it, else its out point.
  4. from outside, B inside Y: the door of Y minimising dist(from, out) + dist(in, to): its out point if from is more
     than 1.0 from it, else its in point. No doors: null.
// interior.ts
export interface InteriorState { building: string | null; storey: number; skip: ReadonlySet<string>; ceilY: number | null; door: string | null }
export interface InteriorTracker { readonly state: InteriorState; update(pos: Vec3, dt: number): void }
export function createInteriorTracker(deps: { index: BuildingIndex; bus: Bus }): InteriorTracker;
- Enter: index.insideAt(pos.x, pos.y, pos.z, INTERIOR.enterInset) = b while state.building != b.def.id -> building =
  b.def.id; door = the door of b nearest pos; emit 'entered-building' { building, region: b.def.region, door }.
  The very first update that finds the player inside takes the state silently (no event).
- Exit: state.building set and index.footprintAt(pos.x, pos.y, pos.z, INTERIOR.exitPad) is not that building ->
  emit 'left-building' { building }, building = null. (Standing in the doorway changes nothing: hysteresis.)
- While inside: storey = storeyAt(b, pos.y); skip = new Set(b.cut[storey]) (rebuilt only when building or storey
  changes); ceilY = ceilingAt(b, storey). Outside: storey 0, skip = one shared empty Set, ceilY null.
- The state object is mutated in place (the camera keeps a reference).

## Done when
- `cd games/dayg && npx vitest run src/world/spaces.test.ts` passes, with a fixture of two buildings (one storey with
  one door on its n side; two storeys with a stair and two doors) covering: insideAt with inset, the NaN y case,
  storeyAt, ceilingAt (null on the top storey), doorAt; nextWaypoint outside->inside (out point, then in point once
  within 1.0), inside->outside, doorway->far side, same room -> null, ground floor -> upper floor via foot then top;
  the tracker: a walk from outside through the doorway to inside emits 'entered-building' once with the door id, the
  doorway alone emits nothing, going upstairs changes skip and ceilY, walking out past exitPad emits 'left-building',
  and a tracker whose first update is inside emits nothing.
- `npx tsc --noEmit -p games/dayg` shows no errors in your files.

## Out of scope
src/world/buildingExpand.ts, src/world/buildingCheck.ts, src/game/camera.ts, src/main.ts, src/game/bus.ts (read only).
~~~~

~~~~text
Epic: 1 Building format, rules and the interior camera (issue 1.4 Interior camera rule)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time; the interior tracker
  (src/game/interior.ts) is a stub that always reports "outside" while you work. Edit only the files under Change.
- Your dev server port is 5251: `cd games/dayg && npx vite --port 5251 --strictPort` (background; stop it at the end).
- Mobile by default: touch look goes through the same input.lookX / lookY, so the rig must not care whether input
  came from a mouse or a finger. No new UI.

## Goal
The camera works inside buildings: it ignores the cut-away roof and upper floors, keeps clear of walls and ceilings
with a padded pull-in, stays under the ceiling of a lower storey, and switches to a close-follow view behind the
gnome's head when it is squeezed under 1.1 gm.

## Read first
- games/dayg/src/game/camera.ts: the current rig (pull-in along a ray at RAY_STEP 0.25, instant pull-in, smoothed
  ease-out, first-person toggle with FP_PITCH 1.3).
- games/dayg/src/world/collide.ts: solidAt(x, y, z, pad, skip) and groundAt.
- games/dayg/src/game/interior.ts: InteriorState { building, storey, skip, ceilY, door }.
- games/dayg/src/config.ts: CAMERA and INTERIOR.
- games/dayg/src/world/collide.test.ts: how to build a tiny BlockoutMap for createCollider (inside Ivy Rows).

## Change
- games/dayg/src/game/camera.ts: the rule below.
- games/dayg/src/game/camera.test.ts (new).

## Contract
export interface PoseIn { target: { x: number; y: number; z: number }; yaw: number; pitch: number; crouched: boolean;
  maxDist: number; skip: ReadonlySet<string>; ceilY: number | null }
export interface PoseOut { x: number; y: number; z: number; dist: number; lx: number; ly: number; lz: number }
export function thirdPersonPose(collider: Collider, p: PoseIn): PoseOut;
export function createCameraRig(camera: THREE.PerspectiveCamera, collider: Collider, interior?: { state: InteriorState }): CameraRig;
thirdPersonPose:
- look point L = (target.x, target.y + CAMERA.height - (crouched ? CAMERA.crouchDrop : 0), target.z);
  dir = (-sin yaw cos pitch, sin pitch, -cos yaw cos pitch).
- dist = maxDist; for t = 0.25; t <= maxDist + 1e-6; t += 0.25: if collider.solidAt(L + dir t, INTERIOR.solidPad, skip)
  { dist = max(0, t - 0.25); break }.
- if ceilY !== null and dir.y > 0: dist = min(dist, max(0, (ceilY - INTERIOR.ceilPad - L.y) / dir.y)).
- pos = L + dir dist; pos.y = max(pos.y, collider.groundAt(pos.x, pos.z, pos.y) + 0.3). Return pos, dist and L.
Rig (inside = interior?.state.building != null):
- first person: as today; rig.close = true.
- third person: pitch clamped to [INTERIOR.pitchMin, INTERIOR.pitchMax] inside, [CAMERA.pitchMin, CAMERA.pitchMax]
  outside. On the frame inside turns true: pitchTarget = max(pitch, INTERIOR.pitchEnter); each frame while set:
  pitch += (pitchTarget - pitch) * (1 - exp(-3 dt / INTERIOR.pitchEaseSeconds)); clear it when |diff| < 0.01 or
  input.lookY != 0 (the player wins).
- pose = thirdPersonPose(collider, { ..., maxDist: inside ? INTERIOR.distance : CAMERA.distance,
  skip: interior?.state.skip ?? empty set, ceilY: inside ? interior.state.ceilY : null }).
- close-follow: when not close and pose.dist < INTERIOR.closeAt -> close = true. When close: if pose.dist >=
  INTERIOR.closeExitAt add dt to a hold timer, else reset it; at >= INTERIOR.closeHold -> close = false and snap.
  While close: camera at (target.x - 0.2 sin yaw, target.y + (crouched ? 1.0 : 1.5), target.z - 0.2 cos yaw), looking
  along (sin yaw cos g, -sin g, cos yaw cos g) with g = clamp(pitch - CAMERA.pitchDefault, -1.3, 1.3).
- Otherwise the existing smoothing: snap, or instant pull-in when the pose is nearer than the camera, else lerp with
  1 - exp(-12 dt); camera.lookAt(L).

## Done when
- `cd games/dayg && npx vitest run src/game/camera.test.ts` passes, on a tiny map with a 10 x 10 room (walls h 4,
  ids 'bld-t-wall-*', a roof 'bld-t-roof' at y 3.8 h 0.5) inside Ivy Rows and a headstone outside:
  open ground gives dist = CAMERA.distance; inside the room with skip = { 'bld-t-roof' } and pitch 0.45 gives
  dist > 1 and a pose where solidAt(pose, 0, skip) is false; the same without skip is pulled in under the roof;
  ceilY 3.0 keeps pose.y <= 2.7; a target 0.6 gm in front of the headstone with the camera ray into it gives
  dist < INTERIOR.closeAt, and a rig (new THREE.PerspectiveCamera()) updated once there has close === true, then
  after 0.5 s of updates on open ground has close === false.
- `npx tsc --noEmit -p games/dayg` shows no errors in your files.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5251/?seed=1" game` prints SMOKE OK, and screenshots
  of `?seed=1` at 1280x720 and `?seed=1&touch=1` at 390x844 (command in the roadmap, or Edge headless with
  --window-size and --virtual-time-budget=9000) show the camera low behind the gnome as before; read and describe them.
  (The interior screenshot is issue 3.5's: buildings are not drawn yet.)

## Out of scope
src/world/collide.ts (planner added solidAt; read only), src/game/interior.ts (issue 1.3), src/main.ts, src/game/input.ts, src/ui/touch.ts.
~~~~

~~~~text
Epic: 1 Building format, rules and the interior camera (issue 1.5 Walked In achievement)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not
  run `npm install`, `git commit` or `git stash`.
- Four other workers are editing other files of games/dayg at the same time. Edit only the files under Change.
- Prefab rule: a new reward item is a PrefabDef in packages/prefabs/src/catalog/ and `npm test -w packages/prefabs`
  must pass. Every achievement reward uses a prefab no other achievement uses (brass-key and iron-key are taken).

## Goal
The first time the player walks through a building door, DayG unlocks "Walked In", which gives a Crypt Key to hold.

## Read first
- packages/achievements/README.md: the reward rules.
- packages/achievements/src/catalog.ts around 'dayg-mossbreaker': where DayG's entries are.
- packages/prefabs/src/catalog/dayg.ts: 'grave-lantern' as the format (about, examine lines, grip, parts, colours 'iron', 'iron-dark').
- packages/prefabs/src/catalog/trinkets.ts: 'brass-key' (a key prefab to model on).
- games/dayg/src/game/achievements.ts: createDaygAchievements and its unlock helper.

## Change
- packages/prefabs/src/catalog/dayg.ts: add the 'crypt-key' PrefabDef below.
- packages/achievements/src/catalog.ts: add 'dayg-walked-in' after 'dayg-mossbreaker'.
- games/dayg/src/game/achievements.ts: `bus.on('entered-building', () => unlock('dayg-walked-in'));`

## Contract
{
  id: 'crypt-key', name: 'Crypt Key', category: 'key', uses: ['unlock', 'hold'],
  tags: ['key', 'iron', 'crypt', 'door', 'black'], emoji: ['🗝'],
  grip: [0, 0.05, 0],
  about: 'A long black iron door key with a round bow and a heavy two-step bit, about 0.32 tall. No tint.',
  examine: [
    'A long black key, cut for a door no gnome could ever push.',
    'Old saying: a shut door in the Old Rows is a question. Most gnomes leave it unanswered.',
    'The bit has two steps worn bright. Somebody turned it many times before the Greying.',
    'Held by the bow it makes a fair club, if a short one.',
    'A small hat is scratched into the bow, careful and neat, like the ones on the lanterns in the rows.',
  ],
  parts: [
    { s: 'ring', d: [0.05, 0.012], at: [0, 0.05, 0], c: 'iron-dark' },
    { s: 'cyl', d: [0.012, 0.012, 0.22], at: [0, 0.2, 0], c: 'iron-dark', seg: 6 },
    { s: 'box', d: [0.05, 0.03, 0.01], at: [0.028, 0.29, 0], c: 'iron-dark' },
    { s: 'box', d: [0.035, 0.02, 0.01], at: [0.02, 0.255, 0], c: 'iron-dark' },
  ],
},
{
  id: 'dayg-walked-in', game: 'dayg', gameTitle: 'DayG',
  title: 'Walked In', description: 'Walk through a door into a building.',
  reward: { slot: 'hand', prefabId: 'crypt-key', label: 'Crypt Key' },
},
If the prefab test rejects a field (for example a shared emoji), fix the def the way the test message says and report it.

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `npx tsc --noEmit -p games/dayg` shows no errors in achievements.ts.

## Out of scope
Every other games/dayg file; other prefab catalog files; packages/prefabs/src/catalog/index.ts.
~~~~

### Round 2, Epic 2: seeing inside, Hatless at doors, the loot budget

~~~~text
Epic: 2 Seeing inside, Hatless at doors, the loot budget (issue 2.1 Building view and cutaway)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Two other workers are editing src/scene/hatless.ts and src/sim/buildings.sim.test.ts at the same time. Edit only the files under Change.
- Your dev server port is 5261: `cd games/dayg && npx vite --port 5261 --strictPort` (background; stop it at the end).
- 3D rules (docs/rendering.md): anything flat on the ground takes a draw layer (`flatLayer(material, LAYER.area)` from
  '@lawn/depth'); boxes that touch must not share a face; run `npm run zfight -- <url>` after adding scenery.
- Phones: keep draw calls low (one InstancedMesh per material, not one mesh per block).

## Goal
Buildings are drawn as their own groups, and when the player walks in, the roof and the floors above them fade out in
0.25 s and come back when they walk out.

## Read first
- games/dayg/src/scene/worldBuilder.ts: buildBlocks (InstancedMesh per kind, SINK 0.05 below every block, BoxGeometry(1,1,1)).
- games/dayg/src/world/buildingTypes.ts: BuildingParts (blocks, role, layer, interior, def.style, def.storeys, def.sunk).
- games/dayg/src/game/interior.ts: InteriorState { building, storey, ... }.
- games/dayg/src/scene/buildingsView.ts: the stub you replace (same exports).
- games/dayg/src/config.ts: INTERIOR.fadeSeconds, BUILDING_PREFIX.

## Change
- games/dayg/src/scene/buildingsView.ts: implement buildBuildings.
- games/dayg/src/scene/worldBuilder.ts: one change only: `buildBlocks(map.blocks.filter((b) => !b.id.startsWith(BUILDING_PREFIX)))`.

## Contract
export interface BuildingsView { root: THREE.Group; update(state: InteriorState, dt: number): void }
export function buildBuildings(scene: THREE.Scene, parts: readonly BuildingParts[]): BuildingsView;
- root 'buildings' added to scene; one Group `building-<id>` per non-draft building.
- Per building, InstancedMeshes (MeshLambertMaterial, castShadow and receiveShadow true), boxes drawn like
  worldBuilder (height h + 0.05, bottom at y - 0.05):
  'shell' = roles wall, inner, lintel (style shell colour); 'fittings' = stair, shelf, furniture (fit colour);
  one 'layer-<L>' mesh per cut layer L (floor blocks: L = their layer, fit colour; roof and ridge: L = storeys.length,
  roof colour), each with its OWN material.
  STYLE colours { shell, roof, fit }: plank 0x7a5a3a / 0x4e3b2a / 0x9a7b55; brick 0x8a4b3a / 0x4a4a4a / 0x6b4a2e;
  marble 0xd8d6d0 / 0x9c9a94 / 0xbdbab2; stone 0x8d8a83 / 0x5d5a55 / 0x77746d; cottage 0xc9b48a / 0x7a4a2a / 0x6b4a2e.
- Ground-floor floor (buildings without sunk): one quad over parts.interior at y 0, fit colour darkened x 0.7,
  `flatLayer(material, LAYER.area)`, receiveShadow.
- update(state, dt): for each layer mesh, target = (state.building === id && L > state.storey) ? 0 : 1; opacity moves
  toward target by dt / INTERIOR.fadeSeconds. While opacity < 1: material.transparent = true, depthWrite = false;
  at 1: transparent false, depthWrite true; at 0: mesh.visible = false (visible again as soon as it fades in). Set
  material.needsUpdate when transparent changes.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in your files.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5261/?seed=1" game` prints SMOKE OK.
- Screenshots (command in the roadmap) at 1280x720 and 390x844 (`&touch=1`) of the Potting Shed:
  outside `spawn=443.5,462,0&yaw=1.571` (the shed with its roof and the open door gap), inside `spawn=452,468,0&yaw=1.571`
  (roof gone, shelves and the bench visible), paint corner `spawn=451,477,0&yaw=3.142`. Read and describe each.
- `npm run zfight -- "http://localhost:5261/?seed=1&spawn=452,468,0&yaw=1.571"` and the same with
  `spawn=443.5,462,0&yaw=1.571` print ZFIGHT OK (fix your meshes, or report pairs that come from block data).
- In your report: draw calls added for the shed (count meshes under 'buildings').

## Out of scope
src/world/* (data and rules), src/game/camera.ts, src/game/interior.ts, src/main.ts, src/scene/hatless.ts.
~~~~

~~~~text
Epic: 2 Seeing inside, Hatless at doors, the loot budget (issue 2.2 Hatless at doors)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Two other workers are editing src/scene/buildingsView.ts, src/scene/worldBuilder.ts and src/sim/buildings.sim.test.ts
  at the same time. Edit only the file under Change. main.ts passes the new dep after this round (planner).
- Your dev server port is 5262: `cd games/dayg && npx vite --port 5262 --strictPort` (background; stop it at the end).
- Hatless rules that stay: they get over 1.6 gm and nothing higher (HATLESS_STEP), cannot climb routes, fall off
  edges. Stairs are steps of 0.4 gm, so Hatless DO climb stairs; shelves and lofts reached by ladders or ropes stay safe.

## Goal
Hatless find their way in and out of buildings through the doors and up stairs, cannot see through walls, and hear
noise from inside a building muffled.

## Read first
- games/dayg/src/scene/hatless.ts: HatlessDeps, the 'noise' handler, walk(h, tx, tz, speed, dt), the sight test, hunting and drawn modes.
- games/dayg/src/world/spaces.ts: BuildingIndex (spaceOf, insideAt with NaN y, nextWaypoint).
- games/dayg/src/config.ts: INTERIOR.muffle (0.6), INTERIOR.doorSight (8).

## Change
- games/dayg/src/scene/hatless.ts only.

## Contract
- HatlessDeps gains an optional `index?: BuildingIndex` (import type from '../world/spaces'). Without it, behaviour is unchanged.
- Waypoints: walk gains an optional target height `ty = NaN`; before steering, `const wp = deps.index?.nextWaypoint(h.pos, { x: tx, y: ty, z: tz })`;
  when wp is not null, steer to (wp.x, wp.z) instead. Hunting passes the player's y; drawn-to-noise passes NaN.
- Sight: a Hatless sees the player only when, in addition to today's cone and range, sameSpace holds:
  a = index.spaceOf(hatless), b = index.spaceOf(player); a.building === b.building, or (a.doorway || b.doorway) and the
  distance <= INTERIOR.doorSight.
- Hearing: for each Hatless, if index.insideAt(e.x, NaN, e.z)?.def.id differs from index.insideAt(h.x, h.y, h.z)?.def.id,
  use e.radius * INTERIOR.muffle.
- A door is a choke: do not add any special case; the collider and separation make them queue.

## Done when
- `npx tsc --noEmit -p games/dayg` shows no errors in hatless.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5262/?seed=1&hatless=10" game` prints SMOKE OK.
- To test with the index before main.ts passes it, temporarily add `index: buildingIndex` to the createHatlessSystem
  call in YOUR local main.ts copy, take the screenshot, then revert main.ts (git diff games/dayg/src/main.ts must be empty
  at the end). Screenshot `?seed=1&hatless=10&spawn=452,468,0&yaw=-1.571` at 1280x720 (inside the shed looking at the
  door): describe where the Hatless are. Report what you saw.

## Out of scope
src/main.ts (planner), src/world/spaces.ts (read only), src/scene/npcActors.ts, src/game/simFeed.ts.
~~~~

~~~~text
Epic: 2 Seeing inside, Hatless at doors, the loot budget (issue 2.3 Loot budget test)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (TypeScript strict, vitest). Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Two other workers are editing other games/dayg files at the same time. Edit only the file under Change.
- Rule: buildings add no regions and no loot. Their containers draw from their region's existing budget.

## Goal
A test proves that building containers are part of the sim's loot budget: they exist in the world, sit in their
building's region, and rolling them takes exactly what they hold out of that region's stock.

## Read first
- games/dayg/src/sim/loot.ts: initLoot (region stock by tier and area, guaranteed items), rollContainer.
- games/dayg/src/sim/world.ts: createWorld(seed) (uses MAP.containers).
- games/dayg/src/world/buildings/index.ts: BUILDING_PARTS.
- games/dayg/src/sim/regions.ts: REGIONS, regionAt.
- games/dayg/src/sim/sim.test.ts: test style.

## Change
- games/dayg/src/sim/buildings.sim.test.ts (new).

## Contract
Tests:
- REGIONS.length is still 12.
- For every non-draft building: its footprint lies inside REGIONS' rect for def.region; every parts container is in
  MAP.containers with region === def.region === regionAt(x, z); every parts spot is in MAP.spots.
- For seeds 1, 2, 3: createWorld(seed); every building container id is in world.containers and not opened. For each
  building region: before = sum over RESOURCES of world.loot[region]; roll every MAP container of that region with
  rollContainer(world, id, streams.loot); rolled = sum over them of (items in contents after) - (guaranteed items);
  after = sum of world.loot[region]; expect before - after === rolled, every world.loot[region][res] >= 0, every
  rolled container opened.

## Done when
- `cd games/dayg && npx vitest run src/sim/buildings.sim.test.ts` passes.
- `npm run sim -w games/dayg -- --seeds 10 --check` prints `check: PASS` (if it already failed before this change,
  say so with the failing lines; do not change tuning).
- In your report: containers per building region and the region's start stock.

## Out of scope
src/sim/loot.ts, src/sim/world.ts, src/sim/tuning.json, src/sim/sim.test.ts, every src/world file.
~~~~

### Round 3, Epic 3: four more buildings and the camera pass

The four building issues share one recipe; each pastes it in full.

~~~~text
Epic: 3 Four more buildings and the camera pass (issue 3.1 The Bier House)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are writing the other building files and tuning src/game/camera.ts at the same time. Edit only
  the file under Change. Run only YOUR building's test (`-t "building bier-house"`): the others may be mid-edit.
- Your dev server port is 5271: `cd games/dayg && npx vite --port 5271 --strictPort` (background; stop it at the end).
- How a building works: expandBuilding (src/world/buildingExpand.ts) turns your def into blocks. The shell's four
  walls, the corner overlaps, door lintels and window sills are made for you. Inner walls, floors, stairs and boxes
  are what you write. `at` for a shell opening counts from the footprint's x0 (n/s sides) or z0 (e/w sides); for an
  inner wall from its own x0 or z0. Block ids are 'bld-<building>-<local id>'; routes name the local id.
- 3D rule: two boxes whose faces are in the same plane, facing the same way, and overlap flicker. checkBuilding
  reports them as 'coplanar'; fix by moving one face 0.05-0.1 (into a wall where it is hidden).
- No warp: the player must walk in through the door gap; checkBuilding's 'walk-in' and 'unreachable' prove it.

## Goal
The Bier House on the Forecourt is a real walk-in building: a brick house where the parish kept its bier, with the
door leaf open, the bier on the floor, a tool room behind a partition and a loft reached by a ladder (Hatless-safe).

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingDef and the parts it holds.
- games/dayg/src/world/buildings/pottingShed.ts: a finished building to copy the shape of.
- games/dayg/src/world/buildings/bierHouse.ts: your draft (keep id, name, region, footprint, shell thick/height, roof).
- games/dayg/src/world/buildingCheck.ts: the problem keywords.

## Change
- games/dayg/src/world/buildings/bierHouse.ts: the def below, without `draft`.

## Contract
export const BIER_HOUSE: BuildingDef = {
  id: 'bier-house', name: 'The Bier House', region: 'forecourt', style: 'brick',
  footprint: { x0: 364, x1: 394, z0: 424, z1: 460 }, storeys: [0, 12],
  shell: { thick: 1, height: 26, openings: [
    { id: 'door', side: 's', at: 13, width: 4, height: 16, door: true },     // one leaf of the double door stands open
    { id: 'window-e', side: 'e', at: 10, width: 4, height: 6, sill: 6 },
    { id: 'window-n', side: 'n', at: 12, width: 6, height: 5, sill: 15 },   // looks out from the loft
  ] },
  roof: { thick: 1, eaves: 0.8, ridge: 2 },
  walls: [{ id: 'tool-wall', x0: 384, x1: 385, z0: 448, z1: 459.1, y: 0, h: 10, openings: [{ id: 'gap', at: 3, width: 2.6, height: 4 }] }],
  floors: [{ storey: 1, rect: { x0: 364.9, x1: 393.1, z0: 424.95, z1: 436 }, thick: 0.6 }],   // the loft, north third
  stairs: [],
  boxes: [
    { id: 'bier', role: 'furniture', x0: 370, x1: 383, z0: 440, z1: 449, y: 0, h: 8 },
    { id: 'cupboards', role: 'furniture', x0: 364.9, x1: 369, z0: 446, z1: 458, y: 0, h: 14 },
    { id: 'loft-post', role: 'furniture', x0: 377, x1: 381, z0: 435.6, z1: 437, y: 0, h: 12.1 },
  ],
  routes: [
    { block: 'loft-post', side: 's', kind: 'ladder', at: 2 },
    { block: 'bier', side: 's', kind: 'ladder', at: 6.5 },
    { block: 'cupboards', side: 'e', kind: 'rope', at: 6 },
  ],
  containers: [
    { id: 'bier-box', type: 'chest', x: 376.5, y: 8, z: 444.5 },
    { id: 'cupboard-top', type: 'crate', x: 367, y: 14, z: 452 },
    { id: 'tool-1', type: 'crate', x: 389, y: 0, z: 456 },
    { id: 'tool-2', type: 'sack', x: 389, y: 0, z: 450.5 },
    { id: 'loft-chest', type: 'chest', x: 390, y: 12, z: 428 },
    { id: 'loft-cache', type: 'camp-cache', x: 368, y: 12, z: 429 },
  ],
  spots: [{ id: '1', kind: 'npc', x: 380, y: 12, z: 429 }, { id: '1', kind: 'hatless', x: 372, y: 0, z: 455 }],
  props: [{ prefab: 'candle', x: 383, y: 12, z: 427 }, { prefab: 'bedroll', x: 372, y: 12, z: 432 }],
};
Keep the id, region and footprint. You may nudge any other number by up to 0.5 gm to fix a checkBuilding problem;
list every change in your report.

## Done when
- `cd games/dayg && npx vitest run src/world/buildingExpand.test.ts -t "building bier-house"` passes (checkBuilding returns []).
- `npx tsc --noEmit -p games/dayg` shows no errors in your file.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5271/?seed=1" game` prints SMOKE OK.
- Screenshots (command below) at 390x844 and 844x390 with `&touch=1`, and 1280x720 without: outside
  `spawn=379,463,0&yaw=3.142`, inside `spawn=379,455,0&yaw=3.142`, loft `spawn=385,430,12&yaw=1.571`. Inside, the roof
  and the loft floor are faded out; in the loft, only the roof. Read and describe each; the touch buttons still show.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-31-inside.png" "http://localhost:5271/?seed=1&touch=1&spawn=379,455,0&yaw=3.142"
- `npm run zfight -- "http://localhost:5271/?seed=1&spawn=379,455,0&yaw=3.142"` and with `spawn=379,463,0&yaw=3.142` print ZFIGHT OK.

## Out of scope
Every other file: the other buildings, buildingExpand.ts, buildingCheck.ts, buildingsView.ts, camera.ts, main.ts, blockout.ts.
~~~~

~~~~text
Epic: 3 Four more buildings and the camera pass (issue 3.2 The Rowkeepers' House)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are writing the other building files and tuning src/game/camera.ts at the same time. Edit only
  the file under Change. Run only YOUR building's test (`-t "building rowkeepers-house"`): the others may be mid-edit.
- Your dev server port is 5272: `cd games/dayg && npx vite --port 5272 --strictPort` (background; stop it at the end).
- How a building works: expandBuilding (src/world/buildingExpand.ts) turns your def into blocks. The shell's four
  walls, the corner overlaps, door lintels and window sills are made for you. Inner walls, floors, stairs and boxes
  are what you write. `at` for a shell opening counts from the footprint's x0 (n/s sides) or z0 (e/w sides); for an
  inner wall from its own x0 or z0. Block ids are 'bld-<building>-<local id>'; routes name the local id. A floor's
  holes are cut out of the slab for the stairwell. Stairs are solid steps of at most 0.4 gm; the top step is 0.1 under
  the floor it reaches.
- 3D rule: two boxes whose faces are in the same plane, facing the same way, and overlap flicker. checkBuilding
  reports them as 'coplanar'; fix by moving one face 0.05-0.1 (into a wall where it is hidden).
- No warp: the player must walk in through a door gap; checkBuilding's 'walk-in' and 'unreachable' prove it.
- This is the tight-room building (rooms 4.5-7 gm wide at gnome scale): it is the camera's hardest test.

## Goal
The Rowkeepers' House in Yew Edge is a gnome-built two-storey cottage (the Old Rows families kept their rows from
here): front and back doors, parlour, pantry and kitchen downstairs, a stair up to a bedroom and a loft store. Hatless
can follow up the stairs.

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingDef, FloorDef (holes), StairDef (up side, fromY, toY).
- games/dayg/src/world/buildings/pottingShed.ts: a finished building to copy the shape of.
- games/dayg/src/world/buildings/rowkeepersHouse.ts: your draft (keep id, name, region, footprint, shell, roof).
- games/dayg/src/world/buildingCheck.ts: the problem keywords.

## Change
- games/dayg/src/world/buildings/rowkeepersHouse.ts: the def below, without `draft`.

## Contract
export const ROWKEEPERS_HOUSE: BuildingDef = {
  id: 'rowkeepers-house', name: "The Rowkeepers' House", region: 'yew-edge', style: 'cottage',
  footprint: { x0: 170, x1: 186, z0: 80, z1: 94 }, storeys: [0, 3.6],
  shell: { thick: 0.5, height: 7.6, openings: [
    { id: 'front', side: 's', at: 3, width: 2.4, height: 2.8, door: true },
    { id: 'back', side: 'n', at: 12, width: 2.4, height: 2.8, door: true },
    { id: 'w-west', side: 'w', at: 4, width: 2, height: 1.4, sill: 1.2 },
    { id: 'w-east-up', side: 'e', at: 4, width: 2, height: 1.2, sill: 4.8 },
    { id: 'w-south-up', side: 's', at: 9, width: 2, height: 1.2, sill: 4.8 },
  ] },
  roof: { thick: 0.5, eaves: 0.5, ridge: 1.2 },
  walls: [
    { id: 'mid', x0: 178, x1: 178.4, z0: 80.4, z1: 93.6, y: 0, h: 3.3, openings: [{ id: 'kitchen', at: 7, width: 2.2, height: 2.6 }] },
    { id: 'pantry', x0: 170.4, x1: 178.1, z0: 86, z1: 86.4, y: 0, h: 3.25, openings: [{ id: 'pantry', at: 4, width: 2.2, height: 2.6 }] },
    { id: 'up-mid', x0: 178, x1: 178.4, z0: 80.4, z1: 93.6, y: 3.6, h: 3.9, openings: [{ id: 'door', at: 3, width: 2.2, height: 2.6 }] },
  ],
  floors: [{ storey: 1, rect: { x0: 170.45, x1: 185.55, z0: 80.45, z1: 93.55 }, holes: [{ x0: 183, x1: 185.6, z0: 84, z1: 92 }], thick: 0.4 }],
  stairs: [{ id: 'stair', rect: { x0: 183, x1: 185.6, z0: 84, z1: 92 }, up: 'n', fromY: 0, toY: 3.6 }],
  boxes: [
    { id: 'table', role: 'furniture', x0: 179.5, x1: 181.5, z0: 90.5, z1: 92.5, y: 0, h: 1.2 },
    { id: 'settle', role: 'furniture', x0: 170.4, x1: 172, z0: 88.5, z1: 92, y: 0, h: 1.0 },
    { id: 'pantry-shelf', role: 'shelf', x0: 171, x1: 177, z0: 80.4, z1: 81.5, y: 0, h: 1.4 },
    { id: 'bed', role: 'furniture', x0: 179, x1: 181.5, z0: 90.5, z1: 93.55, y: 3.6, h: 0.8 },
  ],
  routes: [],
  containers: [
    { id: 'pantry-sack', type: 'sack', x: 172.5, y: 0, z: 83 },
    { id: 'pantry-shelf', type: 'crate', x: 176, y: 1.4, z: 81 },
    { id: 'parlour-chest', type: 'chest', x: 171.2, y: 1.0, z: 90 },
    { id: 'kitchen-crate', type: 'crate', x: 180.5, y: 0, z: 82 },
    { id: 'bed-chest', type: 'chest', x: 180.25, y: 3.6, z: 89.5 },
    { id: 'loft-cache', type: 'camp-cache', x: 172.5, y: 3.6, z: 90 },
  ],
  spots: [
    { id: '1', kind: 'npc', x: 181, y: 3.6, z: 86 }, { id: '2', kind: 'npc', x: 174, y: 3.6, z: 84 },
    { id: '1', kind: 'hatless', x: 174, y: 0, z: 83.5 },
  ],
  props: [{ prefab: 'candle', x: 180.5, y: 1.2, z: 91.5 }, { prefab: 'flower-pot', x: 176, y: 3.6, z: 92.5 }],
};
Keep the id, region and footprint. You may nudge any other number by up to 0.5 gm to fix a checkBuilding problem;
list every change in your report.

## Done when
- `cd games/dayg && npx vitest run src/world/buildingExpand.test.ts -t "building rowkeepers-house"` passes.
- `npx tsc --noEmit -p games/dayg` shows no errors in your file.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5272/?seed=1" game` prints SMOKE OK.
- Screenshots (command below) at 390x844 and 844x390 with `&touch=1`, and 1280x720 without: outside
  `spawn=174.2,97,0&yaw=3.142`, parlour `spawn=174,90,0&yaw=3.142`, kitchen `spawn=180.5,86,0&yaw=0`, upstairs
  `spawn=181,86,3.6&yaw=-1.571`. Downstairs the roof and the upper floor are faded; upstairs only the roof. Say for each
  whether the camera is in close-follow (no gnome model visible) or third person, and whether any wall hides the view.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-32-parlour.png" "http://localhost:5272/?seed=1&touch=1&spawn=174,90,0&yaw=3.142"
- `npm run zfight -- "http://localhost:5272/?seed=1&spawn=174,90,0&yaw=3.142"` and with `spawn=174.2,97,0&yaw=3.142` print ZFIGHT OK.

## Out of scope
Every other file: the other buildings, buildingExpand.ts, buildingCheck.ts, buildingsView.ts, camera.ts, main.ts, blockout.ts.
~~~~

~~~~text
Epic: 3 Four more buildings and the camera pass (issue 3.3 The Mausoleum)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are writing the other building files and tuning src/game/camera.ts at the same time. Edit only
  the file under Change. Run only YOUR building's test (`-t "building mausoleum"`): the others may be mid-edit.
- Your dev server port is 5273: `cd games/dayg && npx vite --port 5273 --strictPort` (background; stop it at the end).
- How a building works: expandBuilding (src/world/buildingExpand.ts) turns your def into blocks. The shell's four
  walls, the corner overlaps, door lintels and window sills are made for you. Inner walls, floors, stairs and boxes
  are what you write. `at` for a shell opening counts from the footprint's x0 (n/s sides) or z0 (e/w sides); for an
  inner wall from its own x0 or z0. Block ids are 'bld-<building>-<local id>'; routes name the local id.
  'letters' routes are carved letters: the player climbs them, the Hatless cannot.
- 3D rule: two boxes whose faces are in the same plane, facing the same way, and overlap flicker. checkBuilding
  reports them as 'coplanar'; fix by moving one face 0.05-0.1 (into a wall where it is hidden).
- No warp: the player must squeeze in through the broken panel; checkBuilding's 'walk-in' and 'unreachable' prove it.

## Goal
The Mausoleum in Yew Edge is a Tall family crypt (44 gm high) whose iron door is shut; gnomes get in through a broken
lower panel into an antechamber, then through an arch in a marble screen to the coffin hall, where three tiers of
coffin shelves climb each side wall by carved letters, and a side altar holds grave goods.

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingDef.
- games/dayg/src/world/buildings/pottingShed.ts: a finished building to copy the shape of.
- games/dayg/src/world/buildings/mausoleum.ts: your draft (keep id, name, region, footprint, shell, roof).
- games/dayg/src/world/buildingCheck.ts: the problem keywords.

## Change
- games/dayg/src/world/buildings/mausoleum.ts: the def below, without `draft`.

## Contract
export const MAUSOLEUM: BuildingDef = {
  id: 'mausoleum', name: 'The Mausoleum', region: 'yew-edge', style: 'marble',
  footprint: { x0: 224, x1: 254, z0: 38, z1: 74 }, storeys: [0],
  shell: { thick: 1.5, height: 44, openings: [{ id: 'panel', side: 'n', at: 13, width: 3, height: 3.2, door: true }] },
  roof: { thick: 2, eaves: 1, ridge: 4 },
  walls: [{ id: 'screen', x0: 225.4, x1: 252.6, z0: 50, z1: 51, y: 0, h: 12, openings: [{ id: 'arch', at: 12, width: 3.5, height: 12 }] }],
  floors: [], stairs: [],
  boxes: [
    { id: 'w1', role: 'shelf', x0: 225.4, x1: 231, z0: 53, z1: 71, y: 0, h: 7 },
    { id: 'w2', role: 'shelf', x0: 225.3, x1: 229.5, z0: 54, z1: 70, y: 7, h: 7 },
    { id: 'w3', role: 'shelf', x0: 225.2, x1: 228, z0: 55, z1: 69, y: 14, h: 7 },
    { id: 'e1', role: 'shelf', x0: 247, x1: 252.6, z0: 53, z1: 71, y: 0, h: 7 },
    { id: 'e2', role: 'shelf', x0: 248.5, x1: 252.7, z0: 54, z1: 70, y: 7, h: 7 },
    { id: 'e3', role: 'shelf', x0: 250, x1: 252.8, z0: 55, z1: 69, y: 14, h: 7 },
    { id: 'altar', role: 'furniture', x0: 234, x1: 244, z0: 68, z1: 72.6, y: 0, h: 6 },
    { id: 'rubble-1', role: 'furniture', x0: 246, x1: 252.6, z0: 39.45, z1: 45, y: 0, h: 2.2 },
    { id: 'rubble-2', role: 'furniture', x0: 248, x1: 252.6, z0: 45, z1: 48, y: 0, h: 1.2 },
  ],
  routes: [
    { block: 'w1', side: 'e', kind: 'letters', at: 9 }, { block: 'w2', side: 'e', kind: 'letters', at: 8 },
    { block: 'w3', side: 'e', kind: 'letters', at: 7 }, { block: 'e1', side: 'w', kind: 'letters', at: 9 },
    { block: 'e2', side: 'w', kind: 'letters', at: 8 }, { block: 'e3', side: 'w', kind: 'letters', at: 7 },
    { block: 'altar', side: 'n', kind: 'letters', at: 5 },
  ],
  containers: [
    { id: 'ante-vase', type: 'vase', x: 230, y: 0, z: 44 },
    { id: 'shelf-remains', type: 'body', x: 230.25, y: 7, z: 66 },
    { id: 'top-chest', type: 'chest', x: 226.6, y: 21, z: 62 },
    { id: 'east-goods', type: 'grave-goods', x: 249.25, y: 14, z: 62 },
    { id: 'east-cache', type: 'camp-cache', x: 251.4, y: 21, z: 58 },
    { id: 'altar-goods', type: 'grave-goods', x: 239, y: 6, z: 70 },
  ],
  spots: [
    { id: '1', kind: 'hatless', x: 239, y: 0, z: 60 }, { id: '2', kind: 'hatless', x: 233, y: 0, z: 62 },
    { id: '1', kind: 'npc', x: 226.6, y: 21, z: 66 },
  ],
  props: [{ prefab: 'candle', x: 236, y: 6, z: 70 }, { prefab: 'flower-pot', x: 241, y: 6, z: 70 }],
};
Keep the id, region and footprint. You may nudge any other number by up to 0.5 gm to fix a checkBuilding problem;
list every change in your report.

## Done when
- `cd games/dayg && npx vitest run src/world/buildingExpand.test.ts -t "building mausoleum"` passes.
- `npx tsc --noEmit -p games/dayg` shows no errors in your file.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5273/?seed=1" game` prints SMOKE OK.
- Screenshots (command below) at 390x844 and 844x390 with `&touch=1`, and 1280x720 without: outside
  `spawn=238.5,35,0&yaw=0` (the small gap at the foot of the big wall), antechamber `spawn=238.5,45,0&yaw=0`, top shelf
  `spawn=226.6,64,21&yaw=1.571`. Read and describe each; say whether the camera is in close-follow on the top shelf.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-33-ante.png" "http://localhost:5273/?seed=1&touch=1&spawn=238.5,45,0&yaw=0"
- `npm run zfight -- "http://localhost:5273/?seed=1&spawn=238.5,45,0&yaw=0"` and with `spawn=238.5,35,0&yaw=0` print ZFIGHT OK.

## Out of scope
Every other file: the other buildings, buildingExpand.ts, buildingCheck.ts, buildingsView.ts, camera.ts, main.ts, blockout.ts.
~~~~

~~~~text
Epic: 3 Four more buildings and the camera pass (issue 3.4 The Angel Vault)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are writing the other building files and tuning src/game/camera.ts at the same time. Edit only
  the file under Change. Run only YOUR building's test (`-t "building angel-vault"`): the others may be mid-edit.
- Your dev server port is 5274: `cd games/dayg && npx vite --port 5274 --strictPort` (background; stop it at the end).
- How a building works: expandBuilding (src/world/buildingExpand.ts) turns your def into blocks. The shell's four
  walls (standing on the ground at y 0), the corner overlaps and the door lintel are made for you. `sunk: 8` cuts a
  pit 8 gm deep over the interior inset 0.2, so the vault floor is at y -8 (storeys[0]). Inner walls, stairs and boxes
  are what you write. `at` for a shell opening counts from the footprint's x0 (n/s sides) or z0 (e/w sides); for an
  inner wall from its own x0. Block ids are 'bld-<building>-<local id>'; routes name the local id.
- 3D rule: two boxes whose faces are in the same plane, facing the same way, and overlap flicker. checkBuilding
  reports them as 'coplanar'; fix by moving one face 0.05-0.1. Nothing may have its top at exactly y 0 (the ground):
  the landing's top is -0.1 for that reason.
- No warp: the player walks in at ground level onto a landing and down a long stair; checkBuilding's 'walk-in' and
  'unreachable' prove it. Hatless that walk off the landing fall into the vault: that is intended.

## Goal
The Angel Vault under Angel Square is a sunken crypt: a low stone vault-house with a door at ground level, a railed
landing, a stair 8 gm down to a vault hall with a coffin stack and an altar, and an ossuary behind two arches. A
Hatless lair (SACRED: looting it costs standing).

## Read first
- games/dayg/src/world/buildingTypes.ts: BuildingDef (sunk, StairDef).
- games/dayg/src/world/buildings/pottingShed.ts: a finished building to copy the shape of.
- games/dayg/src/world/buildings/angelVault.ts: your draft (keep id, name, region, footprint, sunk, shell, roof).
- games/dayg/src/world/buildingCheck.ts: the problem keywords.

## Change
- games/dayg/src/world/buildings/angelVault.ts: the def below, without `draft`.

## Contract
export const ANGEL_VAULT: BuildingDef = {
  id: 'angel-vault', name: 'The Angel Vault', region: 'angel-square', style: 'stone',
  footprint: { x0: 160, x1: 188, z0: 188, z1: 212 }, storeys: [-8], sunk: 8,
  shell: { thick: 1, height: 14, openings: [{ id: 'door', side: 'n', at: 12, width: 3, height: 6, door: true }] },
  roof: { thick: 1, eaves: 0.5, ridge: 2 },
  walls: [{ id: 'ossuary-wall', x0: 161.1, x1: 186.9, z0: 204, z1: 205, y: -8, h: 10, openings: [
    { id: 'w-arch', at: 6, width: 3, height: 4 }, { id: 'e-arch', at: 18, width: 3, height: 4 },
  ] }],
  floors: [],
  stairs: [{ id: 'stair', rect: { x0: 170.5, x1: 176.5, z0: 193, z1: 203 }, up: 'n', fromY: -8, toY: -0.1 }],
  boxes: [
    { id: 'landing', role: 'furniture', x0: 170.5, x1: 176.5, z0: 189.1, z1: 193, y: -8, h: 7.9 },
    { id: 'rail-w', role: 'furniture', x0: 170.6, x1: 171, z0: 189.2, z1: 192.9, y: -0.1, h: 1.2 },
    { id: 'rail-e', role: 'furniture', x0: 176, x1: 176.4, z0: 189.2, z1: 192.9, y: -0.1, h: 1.2 },
    { id: 'c1', role: 'shelf', x0: 161.1, x1: 166, z0: 191, z1: 202, y: -8, h: 5 },
    { id: 'c2', role: 'shelf', x0: 161.15, x1: 164, z0: 192, z1: 201, y: -3, h: 5 },
    { id: 'altar', role: 'furniture', x0: 180, x1: 186, z0: 192, z1: 198, y: -8, h: 1.4 },
    { id: 'niche-w', role: 'shelf', x0: 163, x1: 168, z0: 208, z1: 210.9, y: -8, h: 1.4 },
    { id: 'niche-e', role: 'shelf', x0: 178, x1: 183, z0: 208, z1: 210.9, y: -8, h: 1.4 },
  ],
  routes: [{ block: 'c1', side: 'e', kind: 'letters', at: 5 }, { block: 'c2', side: 'e', kind: 'letters', at: 4 }],
  containers: [
    { id: 'altar-chest', type: 'chest', x: 183, y: -6.6, z: 195 },
    { id: 'shelf-remains', type: 'body', x: 165, y: -3, z: 196.5 },
    { id: 'upper-goods', type: 'grave-goods', x: 162.6, y: 2, z: 196.5 },
    { id: 'niche-vase-w', type: 'vase', x: 165.5, y: -6.6, z: 209.5 },
    { id: 'niche-vase-e', type: 'vase', x: 180.5, y: -6.6, z: 209.5 },
    { id: 'ossuary-cache', type: 'camp-cache', x: 173.5, y: -8, z: 207.5 },
  ],
  spots: [
    { id: '1', kind: 'hatless', x: 182, y: -8, z: 201 }, { id: '2', kind: 'hatless', x: 166, y: -8, z: 206.5 },
    { id: '3', kind: 'hatless', x: 184, y: -8, z: 207 },
  ],
  props: [{ prefab: 'candle', x: 181, y: -6.6, z: 193 }, { prefab: 'garden-rock', x: 185, y: -8, z: 202 }],
};
Keep the id, region, footprint and sunk. You may nudge any other number by up to 0.5 gm to fix a checkBuilding
problem; list every change in your report.

## Done when
- `cd games/dayg && npx vitest run src/world/buildingExpand.test.ts -t "building angel-vault"` passes.
- `npx tsc --noEmit -p games/dayg` shows no errors in your file.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5274/?seed=1" game` prints SMOKE OK.
- Screenshots (command below) at 390x844 and 844x390 with `&touch=1`, and 1280x720 without: outside
  `spawn=173.5,185,0&yaw=0`, landing `spawn=173.5,191,0&yaw=0` (looking down the stair into the vault), ossuary
  `spawn=173.5,207.5,-8&yaw=-1.571`. Read and describe each; say whether the camera is in close-follow in the ossuary.
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-34-landing.png" "http://localhost:5274/?seed=1&touch=1&spawn=173.5,191,0&yaw=0"
- `npm run zfight -- "http://localhost:5274/?seed=1&spawn=173.5,191,0&yaw=0"` and with `spawn=173.5,185,0&yaw=0` print ZFIGHT OK.

## Out of scope
Every other file: the other buildings, buildingExpand.ts, buildingCheck.ts, buildingsView.ts, camera.ts, main.ts, blockout.ts.
~~~~

~~~~text
Epic: 3 Four more buildings and the camera pass (issue 3.5 Camera pass in the shed)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado (a git worktree). Run every command from there.
  The game is games/dayg (three.js 0.187, Vite, TypeScript strict, vitest). Git Bash: if `node` is not found,
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install`, `git commit` or `git stash`.
- Four other workers are writing the other four building files at the same time; use the Potting Shed (finished) only.
  Edit only the files under Change.
- Your dev server port is 5275: `cd games/dayg && npx vite --port 5275 --strictPort` (background; stop it at the end).
- Mobile by default: every check at a phone size too, touch controls on (`&touch=1`), no hover-only UI.
- The rule is already implemented (thirdPersonPose, close-follow, ceiling clamp, pitch ease on entry); this issue looks
  at it in the real game and fixes what is wrong. The constants live in src/config.ts INTERIOR, which you may not edit:
  if a number is wrong, override it with a local constant in camera.ts and put the value you want in your report.

## Goal
The interior camera is checked and fixed in the real game: readable inside the shed, never through a wall or the
roof, close-follow in the paint corner, smooth when walking in and out through the door, and touch look unchanged.

## Read first
- games/dayg/src/game/camera.ts and src/game/camera.test.ts: the rule and its tests.
- games/dayg/src/game/interior.ts: what the rig reads (building, storey, skip, ceilY).
- games/dayg/src/config.ts: CAMERA, INTERIOR.
- games/dayg/src/world/buildings/pottingShed.ts: the shed's rooms (door on the west wall z 460.5-463.5, the paint
  corner behind the 'trays' partition at z 474-475, shelves on the east wall).
- games/dayg/src/ui/touch.ts: how touch look feeds input.lookX / lookY (read only).

## Change
- games/dayg/src/game/camera.ts: fixes found below.
- games/dayg/src/game/camera.test.ts: a regression test for each fix.

## Contract
Keep the exports: thirdPersonPose(collider, PoseIn): PoseOut; createCameraRig(camera, collider, interior?): CameraRig
with `close`. Outdoors the camera must behave as before roadmap 10 (distance 4.2, pitch range [-0.35, 1.1]).

## Done when
- `cd games/dayg && npx vitest run src/game/camera.test.ts` passes.
- `npx tsc --noEmit -p games/dayg` shows no errors in camera.ts.
- With your dev server up: `bash tools/smoke.sh "http://localhost:5275/?seed=1" game` prints SMOKE OK.
- Screenshots at 390x844 and 844x390 with `&touch=1`, and 1280x720 without, of: outside the door
  `spawn=443.5,462,0&yaw=1.571`; just inside `spawn=448.5,462,0&yaw=1.571`; mid-room `spawn=452,468,0&yaw=1.571`;
  the paint corner `spawn=451,477,0&yaw=3.142` (close-follow: no gnome model, view from the head); on the high shelf
  `spawn=471.5,470,11&yaw=-1.571`. For each say: is the roof drawn or cut away, does any wall or roof block the view,
  is the camera inside geometry, is it in close-follow. Example:
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=9000 --screenshot="$TEMP/dayg-r10-35-corner.png" "http://localhost:5275/?seed=1&touch=1&spawn=451,477,0&yaw=3.142"
- Walk-in check: with `?seed=1&spawn=440,462,0&yaw=1.571`, run in the browser console (or a headless script that
  sets window.__dayg.player.pos.x step by step from 440 to 452 at z 462 over 2 s) and confirm
  window.__dayg.interior.state.building turns 'potting-shed' once and back to null on the way out; report it.
- In your report: the INTERIOR values you would change, with why.

## Out of scope
src/config.ts and src/main.ts (planner), src/game/interior.ts, src/game/input.ts, src/ui/touch.ts, every building file.
~~~~

---

## 5. File owners

| File | Owner |
|---|---|
| `games/dayg/src/world/buildingTypes.ts` (new) | Step 0 (planner); read-only for workers |
| `games/dayg/src/config.ts`, `src/game/types.ts`, `src/game/bus.ts`, `src/main.ts` | planner (Step 0 and end-of-round fixes) |
| `games/dayg/src/world/collide.ts` (`solidAt`) | planner (Step 0); read-only for workers |
| `games/dayg/src/world/blockout.ts` (the merge loop only) | planner (Step 0). Other roadmaps own the rest of the file |
| `games/dayg/src/world/buildings/index.ts` (new) | planner (Step 0) |
| `games/dayg/src/world/buildingExpand.ts`, `src/world/buildingExpand.test.ts` (new) | 1.1 |
| `games/dayg/src/world/buildings/pottingShed.ts` (new) | 1.1 |
| `games/dayg/src/world/buildingCheck.ts`, `src/world/buildingCheck.test.ts` (new) | 1.2 |
| `games/dayg/src/world/spaces.ts`, `src/world/spaces.test.ts`, `src/game/interior.ts` (new) | 1.3 |
| `games/dayg/src/game/camera.ts` | Step 0 stub edit, then 1.4 (round 1), then 3.5 (round 3) |
| `games/dayg/src/game/camera.test.ts` (new) | 1.4, then 3.5 |
| `games/dayg/src/game/achievements.ts` | 1.5 |
| `packages/achievements/src/catalog.ts`, `packages/prefabs/src/catalog/dayg.ts` | 1.5 |
| `games/dayg/src/scene/buildingsView.ts` (new) | 2.1 |
| `games/dayg/src/scene/worldBuilder.ts` (the one filter line) | 2.1 |
| `games/dayg/src/scene/hatless.ts` | 2.2 |
| `games/dayg/src/sim/buildings.sim.test.ts` (new) | 2.3 |
| `games/dayg/src/world/buildings/bierHouse.ts` (new) | 3.1 |
| `games/dayg/src/world/buildings/rowkeepersHouse.ts` (new) | 3.2 |
| `games/dayg/src/world/buildings/mausoleum.ts` (new) | 3.3 |
| `games/dayg/src/world/buildings/angelVault.ts` (new) | 3.4 |
| `docs/design/dayg/regions.md`, `docs/design/dayg/loot.md` (one line each) | planner (Step 0) |

Collision check: every file above has one owner per round. Round 1 changes 11 files across 5 issues with no overlap;
round 2 changes 4 files across 3 issues; round 3 changes 6 files across 5 issues. Every round's `tsc --noEmit` sees stub
signatures that the owners keep. Ports are unique per issue (section 2).

## 6. PR notes (for the planner)

- What changed: five walk-in buildings, the building format, expander and checker, the interior tracker, the interior
  camera, the building view with cutaway, Hatless at doors, the budget test, the Walked In achievement.
- Mobile: yes (touch look unchanged, phone screenshots inside every building). Online: no, DayG is single-player so far.
- Player gnome: unchanged (`@lawn/gnome`); close-follow hides the model only while the camera is at the head.
- Prefabs: the new reward is the `crypt-key` prefab. Walls, shelves and furniture are blockout boxes, like the existing
  bins and beams: this is a greybox pass, and prefab furniture comes later.
- Not tested: real phones; touch drag in a headless browser (touch look shares the mouse code path).
