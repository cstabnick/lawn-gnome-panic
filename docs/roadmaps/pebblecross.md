# Pebblecross: a town of gnomes with schedules and friends

Goal: a single-player life sim in a small town of gnomes, in the spirit of The Sims. The town is a level document
(`@lawn/level`, the same format the level editor edits). Nine residents live their days on a clock: they bake, post,
pot, teach, mend mowers, pull pints and sit on benches. The player walks the town, forages for gifts, talks to residents
and gives them gifts, and befriends them (five levels, from Stranger to Best friend). The lore lives in the Yard setting
(`docs/lore/`).

Working title "Pebblecross", game folder `games/pebblecross`, port 5202.

## Decisions (made by the planner; the reasons are short)

- **Three.js, not Phaser.** The level format is for the 3D games, and the town is a 3D scene like Club Gnome's.
- **Single-player, no `@lawn/mp`.** Befriending is about one player and a town that runs on its own clock. Online play
  would double the size and has no shape yet. The PR says so.
- **No party slice.** A day in town has no 20-60 second, four-at-once verb. Backlog row added in `packages/party/README.md`.
- **Save in localStorage** (`SAVE_KEY`), wrapped in try/catch. It is a per-browser convenience, not a cloud save.
- **Gifts come from foraging**, not a shop. Nothing to balance against money.
- **Player's gnome** from `@lawn/gnome` (`loadMyGnome`, `createGnomeModel`). Residents wear their own `Look`s.
- **Achievements**: five, in `packages/achievements/src/catalog.ts`, with cosmetic rewards.
- **Tap or click to walk and to use things.** Keys E (use), B (bag), F (friends) work too. Touch buttons are 44 px or more.
- **Lore**: a new place entry (`pebblecross`), seven new resident entries, two reused residents (Granny Gnertrude and
  Big Lou) with `pebblecross` added to their `games`, and one ruling on where the town sits.

## Clock and the day

One game day is `DAY_SECONDS` (480 s, so one game hour is 20 s). The clock starts at 07:00 on a Monday (day 0). The total
game time is kept in minutes (`Save.clock`), so `clockLabel(total)` gives "Mon 07:00". `?fast` in the URL runs the clock
at 4x for testing.

## Residents (the roster is fixed here; every issue uses these names and ids)

| id | Name | Role | Home | Favourite gift | Works |
|---|---|---|---|---|---|
| `nettle` | Nettle Dibbleworth | baker, Crumb & Crock | `home-nettle` | crumb | bakery 05-13 weekdays |
| `fernwick` | Fernwick Stoutpot | postman | `home-fernwick` | bottlecap | post-office 08-12, round 12-16 |
| `tansy` | Tansy Clayfoot | gardener, Potting Shed | `home-tansy` | dandelion | potting-shed 09-17 |
| `hollis` | Hollis Mulchman | mower mechanic who is wary of mowers | `home-hollis` | pebble | yard-shed 08-16 |
| `lou` | Big Lou | strongman, Yard Shed (reused: bowling alley) | `home-lou` | acorn | yard-shed 08-16 with Hollis |
| `marjory` | Marjory Pipkin | teacher, the Acorn Club school | `home-marjory` | clover | school 09-15 |
| `clem` | Clem Thatcher | landlord, Lantern Inn | `home-clem` | mushroom | inn 17-24 |
| `doris` | Doris Fennel | retired, bench by the pond | `home-doris` | pebble | green-bench 13-17 |
| `gertrude` | Granny Gnertrude | knits under the oak (reused: bowling alley) | `home-gertrude` | dandelion | oak 09-15 |

Gifts (`GIFTS` in config): acorn, dandelion, pebble, clover, mushroom, bottlecap, crumb.

## Places (the level's `place` and `forage` markers; ids are fixed)

Required `place` markers, one each: `bakery`, `post-office`, `potting-shed`, `yard-shed`, `school`, `inn`, `green`
(the village green, wander centre), `green-bench`, `pond`, `oak`, `home-nettle`, `home-fernwick`, `home-tansy`,
`home-hollis`, `home-lou`, `home-marjory`, `home-clem`, `home-doris`, `home-gertrude`. Plus one `spawn` marker.

`forage` markers (`data.item` = a gift id): `forage-dandelion-1..3`, `forage-clover-1..2`, `forage-acorn-1..2` (under the
oak), `forage-pebble-1..2` (pond edge), `forage-mushroom-1..2` (shade behind the inn), `forage-bottlecap-1..2` (kerb by the
post office), `forage-crumb-1` (bakery back step). 14 in all.

Buildings (`data.buildings`, with labels): Crumb & Crock (bakery), Post Office, Potting Shed, Yard Shed, Acorn Club (school),
Lantern Inn, and nine houses labelled by resident first name ("Nettle's", "Fernwick's", and so on). Fifteen in all.

## Contracts (every module, verbatim)

`src/config.ts` exists (planner-written): clock constants, `GiftId`, `GIFTS`, `ResidentId`, `RESIDENT_IDS`, `PlaceId`,
`ScheduleSlot`, `ResidentLines`, `Resident`, `Save`, friendship constants, `SAVE_KEY`. Do not change it in a worker issue
except where an issue says so.

### `src/nav.ts`

```ts
import type { Pt } from './nav';            // (declared here)
export interface Pt { x: number; z: number }
export interface Box { x: number; z: number; w: number; d: number }   // centre x, z; w along x, d along z; blocks walking
export interface Circle { x: number; z: number; r: number }           // blocks walking
export interface NavWorld { w: number; d: number; boxes: Box[]; circles: Circle[] }   // centred on (0,0)
export interface Nav {
  isFree(x: number, z: number): boolean;                       // true if a gnome of AGENT_RADIUS fits at x,z inside bounds
  nearestFree(x: number, z: number, maxR?: number): Pt | null; // default maxR 3
  findPath(from: Pt, to: Pt): Pt[] | null;   // waypoints after `from`, ending at the goal (snapped to a free cell); [] if already there; null if unreachable
}
export function makeNav(world: NavWorld, agentRadius?: number): Nav;   // agentRadius default AGENT_RADIUS
```

### `src/clock.ts`

```ts
export function gameMinutesPerRealSecond(): number;   // MINUTES_PER_DAY / DAY_SECONDS
export function dayIndex(total: number): number;      // floor(total / MINUTES_PER_DAY)
export function hourOf(total: number): number;        // 0 <= h < 24, fractional
export function dayName(total: number): string;       // one of DAY_NAMES
export function isWeekend(total: number): boolean;    // Sat or Sun
export function clockLabel(total: number): string;    // "Mon 07:00", 24-hour, zero-padded
export function startClock(): number;                 // START_HOUR * 60
```

### `src/schedule.ts`

```ts
export interface Activity { at: PlaceId; doing: string; asleep: boolean }
export function activityAt(r: Resident, total: number): Activity;   // picks weekday or weekend list, finds the slot whose
// [from, to) contains the hour (wraps past midnight when from > to). No slot: at the resident's home, doing "at home".
// asleep is true only when the slot's doing is "asleep".
```

### `src/town.ts`

```ts
import type { LevelDoc } from '@lawn/level';
import type { Stamp } from '@lawn/level';
import type { Box, Circle, NavWorld, Pt } from './nav';
import type { GiftId, PlaceId } from './config';
export interface TownData {
  ground: string;                       // '#rrggbb'
  ponds: Circle[];                      // a pond: drawn as water and blocks walking
  blockers: Box[];                      // extra blocked boxes (walls, the oak trunk)
  buildings: { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: string; roof: string }[];
}
export interface TownBuilding { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: number; roof: number }
export interface TownPlace { id: string; kind: 'place' | 'forage' | 'spawn'; label: string; x: number; z: number; r: number; item?: GiftId }
export interface TownProp { prefab: string; x: number; z: number; rot: number; scale: number; solidR?: number }
export interface Town {
  id: string; name: string; w: number; d: number;
  ground: number;                       // colour as a number
  buildings: TownBuilding[];
  roads: { points: Pt[]; width: number }[];
  ponds: Circle[];
  props: TownProp[];
  stamps: Stamp[];
  spawn: Pt;
  places: Record<string, TownPlace>;    // every `place` marker, keyed by its id (PlaceId)
  forage: TownPlace[];                  // every `forage` marker, in file order
  navWorld: NavWorld;                   // boxes = data.blockers + every building footprint; circles = ponds + props with solidR
  heightAt(x: number, z: number): number; // ground height in metres: the base is 0, then the stamps are applied
}
export const TOWN_DOC: LevelDoc<TownData>;   // the imported src/data/levels/pebblecross.level.json
export function loadTown(doc: LevelDoc<TownData>): Town;
```

### `src/residents.ts`

```ts
import type { Resident, ResidentId } from './config';
export const RESIDENTS: Resident[];                       // the nine, in RESIDENT_IDS order
export const RESIDENT_BY_ID: Record<ResidentId, Resident>;
```

### `src/friendship.ts`

```ts
import type { GiftId, ResidentId, Save } from './config';
export function emptySave(): Save;                               // clock = startClock(), everything empty
export function readSave(storage?: Pick<Storage, 'getItem'>): Save | null;   // default localStorage; null if missing or malformed; never throws
export function writeSave(save: Save, storage?: Pick<Storage, 'setItem'>): boolean;  // never throws; false if it could not write
export function levelOf(points: number): { index: number; name: string };   // index into FRIEND_LEVELS
export function isFriend(save: Save, id: ResidentId): boolean;               // points >= FRIEND_MIN_POINTS
export function friendCount(save: Save): number;
export function canTalk(save: Save, id: ResidentId, day: number): boolean;   // no talk yet on that day
export function talk(save: Save, id: ResidentId, day: number): number;       // mutates; returns points gained (0 if already talked today)
export function bagCount(save: Save, item: GiftId): number;
export function addToBag(save: Save, item: GiftId, n?: number): void;        // n default 1
export function canGive(save: Save, id: ResidentId, item: GiftId, day: number): boolean;  // bag has it and no gift to them today
export function give(save: Save, id: ResidentId, item: GiftId, day: number, favourite: boolean): number;
// mutates: one from the bag, giftedDay, giftsGiven++, points (GIFT_FAVOURITE_POINTS or GIFT_OTHER_POINTS, capped at MAX_POINTS).
// Returns the points gained. Caller checks canGive first.
```

### `src/dialogue.ts`

```ts
import type { Resident } from './config';
export function talkLine(r: Resident, total: number, points: number, pick: number): string;
// time of day picks the list (morning 05-11, day 11-17, evening 17-22, night otherwise); if points >= FRIEND_MIN_POINTS and
// pick % 3 === 0 the `close` list is used. Index = pick mod list length (non-negative).
export function giftLine(r: Resident, favourite: boolean, pick: number): string;
```

### `src/world.ts`

```ts
import type * as THREE from 'three';
import type { Town } from './town';
export interface WorldView {
  pickables: THREE.Object3D[];          // place and forage meshes; userData.placeId (string) on each; forage also userData.forage = true
  update(dt: number): void;             // gentle bob for forage patches, pond shimmer
  dispose(): void;
}
export function buildWorld(scene: THREE.Scene, town: Town): WorldView;
```

### `src/actors.ts`

```ts
import type * as THREE from 'three';
import type { Look } from '@lawn/gnome';
import type { PlaceId, Resident } from './config';
import type { Nav, Pt } from './nav';
import type { Town } from './town';
export class Walker {
  constructor(object: THREE.Object3D, town: Town, start: Pt, speed: number);
  readonly object: THREE.Object3D;
  get pos(): Pt;
  get moving(): boolean;
  setPath(points: Pt[]): void;          // replaces the path
  stop(): void;
  update(dt: number): void;             // walks; sets object.position (y from town.heightAt) and turns to the heading
}
export interface ResidentActor { resident: Resident; walker: Walker; place: PlaceId | null; doing: string; asleep: boolean }
export function createResidentActor(scene: THREE.Scene, town: Town, resident: Resident, total: number): ResidentActor;
// builds the gnome from resident.look (createGnomeModel), adds it to the scene at its home or current place.
export function updateResidentActors(actors: ResidentActor[], town: Town, nav: Nav, total: number, random: () => number): void;
// per actor: activityAt; hides the gnome while asleep; when the place changes, picks a free point within the place's r
// (random) and walks there with nav.findPath; never blocks the frame if a path is null (stays put and tries again later).
export function createPlayerWalker(scene: THREE.Scene, town: Town, look: Look | null): Walker;   // at town.spawn; look null = the game's own gnome
```

### `src/camera.ts`

```ts
import type * as THREE from 'three';
export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  follow(x: number, z: number, dt: number): void;   // eases the look-at point to x, z
  resize(width: number, height: number): void;
  zoom(delta: number): void;                        // clamped
}
export function createCameraRig(town: { w: number; d: number }): CameraRig;
```

### `src/input.ts`

```ts
import type * as THREE from 'three';
import type { CameraRig } from './camera';
export type TapHit =
  | { kind: 'ground'; x: number; z: number }
  | { kind: 'resident'; id: string }        // userData.residentId
  | { kind: 'place'; id: string }           // userData.placeId, a place (not forage)
  | { kind: 'forage'; id: string };         // userData.placeId, a forage patch
export interface Input {
  onTap(cb: (hit: TapHit) => void): void;
  onKey(cb: (key: 'use' | 'bag' | 'friends' | 'escape') => void): void;
  setPickables(objects: THREE.Object3D[]): void;   // residents, places and forage, re-read each tap
  dispose(): void;
}
export function createInput(canvas: HTMLCanvasElement, rig: CameraRig, ground: THREE.Object3D): Input;
// pointer tap (pointerup without a drag, within 10 px) raycasts pickables, then the ground. Pinch and wheel zoom.
// Keys: E (use), B (bag), F (friends), Escape. WASD pans nothing; the player is only moved by taps.
```

### `src/hud.ts`

```ts
export interface HudActions {
  onUse(): void;          // the big action button (talk / give / forage) for the thing in range
  onBag(): void;
  onFriends(): void;
}
export interface Hud {
  setClock(label: string, hour: number): void;   // top bar: "Mon 07:00", and a sun/moon hint from the hour
  setPlace(text: string): void;                  // "At the Crumb & Crock"
  setUse(label: string | null, enabled: boolean): void;  // the action button; null hides it
  toast(text: string): void;                     // a short line that fades (achievement-style)
  dialog(speaker: string, text: string, onClose?: () => void): void;   // a speech box at the bottom, tap to close
  closeDialog(): void;
  isDialogOpen(): boolean;
}
export function createHud(ui: HTMLElement, actions: HudActions): Hud;
```

### `src/panels.ts`

```ts
import type { GiftId, Resident, ResidentId, Save } from './config';
export interface FriendRow { resident: Resident; points: number; level: string; where: string; }  // where = "At the Crumb & Crock until 13:00"
export interface Panels {
  openFriends(rows: FriendRow[], onPick: (id: ResidentId) => void): void;
  openBag(save: Save, onPick?: (item: GiftId) => void): void;       // with onPick, the list is a gift picker
  openResident(r: Resident, row: FriendRow, actions: { talk: () => void; give: () => void; canGive: boolean; canTalk: boolean }): void;
  close(): void;
  isOpen(): boolean;
}
export function createPanels(ui: HTMLElement): Panels;
```

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation | `npm run build -w games/pebblecross` passes with stubs; every module exists with its contract | F1 |
| 2. Modules (all parallel) | each file's own test passes; `npx tsc --noEmit -p games/pebblecross` clean at the end | A1 A2 B1 B2 C D E F G H I J K |
| 3. Wiring and tests (parallel) | `npm test -w games/pebblecross` and the build pass; the level editor adapter test passes | L1 L2 L3 L4 |
| 4. Checks and PR (planner) | build, tests, lore, smoke at 1280x800 and 390x844, demo recorded, PR opened | none |

## Issues

Each issue lists the files it owns. No issue edits a file another issue owns.

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
Working directory: the repo root (cormorant). Node: if `node` is not found in Git Bash, `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers are writing other files under games/pebblecross at the same time. Touch only the files named below.

## Goal
A buildable game folder: package.json, tsconfig, vite config, index.html and a stub for every module in the contract, so
every later worker owns one file.

## Read first
- games/club-gnome/package.json, tsconfig.json, vite.config.ts: copy the shape.
- games/pebblecross/src/config.ts: already written, do not change it.
- The contracts in docs/roadmaps/pebblecross.md, section "Contracts". Copy each signature into its stub.

## Change
- games/pebblecross/package.json: name "pebblecross", private, type module. scripts: dev "vite", build "tsc --noEmit && vite build",
  preview "vite preview", typecheck "tsc --noEmit", test "vitest run". dependencies: "@lawn/achievements": "*", "@lawn/gnome": "*",
  "@lawn/level": "*", "@lawn/prefabs": "*", "three": "0.187.0". devDependencies: "@types/three": "0.187.0", "typescript": "7.0.2",
  "vite": "8.3.8", "vitest": "5.1.0". Add `"lawn": { }` only if the package.json of other games has it (club-gnome does not).
- games/pebblecross/tsconfig.json: copy games/club-gnome/tsconfig.json exactly.
- games/pebblecross/vite.config.ts: `import { defineConfig } from 'vite'; export default defineConfig({ base: './', server: { port: 5202, host: true } });`
- games/pebblecross/index.html: a phone-friendly page. <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">,
  title "Pebblecross", a full-screen <canvas id="scene">, a <div id="ui"> over it, and <script type="module" src="/src/main.ts">.
  Body background #1d2b1a, no scrolling, `position: fixed; inset: 0` for both canvas and #ui, `touch-action: none` on the canvas.
- games/pebblecross/src/data/levels/pebblecross.level.json: a valid placeholder LevelDoc: {"format":"lawn-level","version":1,
  "game":"pebblecross","id":"pebblecross","name":"Pebblecross","bounds":{"w":64,"d":48},"stamps":[],"paths":[],"props":[],
  "markers":[{"id":"spawn","kind":"spawn","x":0,"z":0}],"data":{"ground":"#7fae5a","ponds":[],"blockers":[],"buildings":[]}}.
  The level-data worker (B1) replaces it.
- Stubs. Each file exports the contract's names with the contract's types. Bodies: `throw new Error('not implemented')` for
  functions that return a value, empty for void. Constants and types exact. Files:
  src/nav.ts (types Pt, Box, Circle, NavWorld, Nav; makeNav), src/clock.ts, src/schedule.ts, src/town.ts (TownData,
  TownBuilding, TownPlace, TownProp, Town, TOWN_DOC, loadTown; TOWN_DOC imports the JSON with
  `import doc from './data/levels/pebblecross.level.json';` and casts it `as unknown as LevelDoc<TownData>`),
  src/residents.ts (RESIDENTS as `[]` typed Resident[], RESIDENT_BY_ID as `{} as Record<ResidentId, Resident>`),
  src/friendship.ts, src/dialogue.ts, src/world.ts, src/actors.ts (Walker class with its methods stubbed, the rest as functions),
  src/camera.ts, src/input.ts, src/hud.ts, src/panels.ts.
  src/main.ts: `console.log('pebblecross stub');` only.
- Root: run `npm install` once from the repo root so the new workspace links (node_modules is shared).

## Contract
Everything in the roadmap section "Contracts". Names and signatures must match exactly; that is what later workers rely on.

## Done when
- `npm install` at the repo root finishes.
- `npm run build -w games/pebblecross` passes (tsc and vite build).
- `grep -l "not implemented" games/pebblecross/src/*.ts | wc -l` prints a number and no file is missing: `ls games/pebblecross/src`
  shows nav.ts clock.ts schedule.ts town.ts residents.ts friendship.ts dialogue.ts world.ts actors.ts camera.ts input.ts hud.ts panels.ts main.ts config.ts.

## Out of scope
Anything under docs/, packages/, tools/, and the full JSON map (another worker writes it). Do not implement any function.
~~~~

~~~~text
Epic: 2 Modules / A1 Lore
Depends on: F1 (only the folder exists; no code is needed)

## Environment
Working directory: repo root. Other workers are writing code in games/pebblecross at the same time; you write docs only.
Lore rules: read docs/lore/canon.md (house style and names), docs/lore/settings.md, docs/lore/rulings.md, and docs/lore/README.md
(the entry schema). Run `npm run lore -- find <word>` before you write a name.

## Goal
The lore for Pebblecross: a place entry, seven new resident entries, updates for two reused residents, one ruling, and the
settings row. Every entry is in the Yard setting, tier game, games [pebblecross] (except the reused ones).

## Read first
- docs/lore/entries/the-yard/club-gnome.md, garden-gate.md, gnome-alley.md, big-lou.md, granny-gnertrude.md: the Yard's tone and format.
- docs/lore/rulings.md: the last ruling number (you will add the next).
- docs/lore/settings.md: the-yard games list and the table at the top.

## Change
- docs/lore/entries/the-yard/pebblecross.md: kind place, tier game, setting the-yard, status canon, games [pebblecross],
  aliases [Pebble Cross, the Cross], related [the-yard, garden-gate, club-gnome, nettle-dibbleworth, fernwick-stoutpot, ...].
  One paragraph: a terrace town of nine homes round a village green with a pond, a bakery, a post office, a potting shed,
  the Yard Shed, the Acorn Club school, the Lantern Inn and an oak. It sits on the far side of the Garden Gate from the Panic Yard.
  Sections: What gnomes say (3 short lines), In the games (the layout, the forage, the schedules), Loose threads (who built the
  oak, why the pond is never dry).
- New person entries (kind person, tier game, setting the-yard, status canon, games [pebblecross]), one file each under
  docs/lore/entries/the-yard/:
  - nettle-dibbleworth.md: Nettle Dibbleworth, baker of the Crumb & Crock. Up at five. Loves bread crumbs. Favourite gift: crumb.
  - fernwick-stoutpot.md: Fernwick Stoutpot, postman. Walks the round. Collects bottle caps from the kerb. Favourite gift: bottlecap.
  - tansy-clayfoot.md: Tansy Clayfoot, gardener at the Potting Shed. Favourite gift: dandelion.
  - hollis-mulchman.md: Hollis Mulchman, mower mechanic at the Yard Shed. Wary of mowers, with good reason (the notice board says so). Favourite gift: pebble.
  - marjory-pipkin.md: Marjory Pipkin, teacher at the Acorn Club school. Favourite gift: clover.
  - clem-thatcher.md: Clem Thatcher, landlord of the Lantern Inn. Opens at five, closes at one. Favourite gift: mushroom.
  - doris-fennel.md: Doris Fennel, retired, sits on the bench by the pond every afternoon. Favourite gift: pebble.
- Reused person entries: update granny-gnertrude.md and big-lou.md: add `pebblecross` to `games:` and one line under "In the games"
  saying where they live in Pebblecross (Gnertrude knits under the oak; Lou works the Yard Shed with Hollis). Do not change their
  bowling lore.
- docs/lore/rulings.md: append one ruling (next R-number): Pebblecross sits in the Yard, beyond the Garden Gate. Its residents
  are not in the Gnome Alley or the Gnomecino; Gertrude and Lou are the two who also appear in the bowling alley.
- docs/lore/settings.md: add `pebblecross` to the-yard's game list.
- Each person's entry names the resident's favourite gift and their working hours in one line, matching the roster below.
  Schedules: Nettle 05-13, Fernwick 08-16 with a walk round at noon, Tansy 09-17, Hollis and Lou 08-16 at the Yard Shed,
  Marjory 09-15 at school, Clem 17-01 at the inn, Doris afternoons on the bench, Gertrude mornings and afternoons under the oak.

## Contract
Entry ids are the file names above. Names: exactly as in the roster. House style: names are plants, soil, tools and
household things; no pop culture; no gore.

## Done when
- `npm run lore` passes (it checks every entry's folder, setting and links; it regenerates docs/lore/INDEX.md).
- `npm run lore -- find pebblecross` finds the place entry.

## Out of scope
Any file under games/. Do not edit other setting folders.
~~~~

~~~~text
Epic: 2 Modules / A2 Residents data
Depends on: F1

## Environment
Working directory: repo root. Other workers write other files in games/pebblecross now. You own src/residents.ts only.
Lore for names and lines lives in docs/lore/entries/the-yard/ (written by another worker right now; read them if they exist,
otherwise use the roster below exactly).

## Goal
The nine residents as data: look, schedules, favourite gift and lines.

## Read first
- games/pebblecross/src/config.ts: the Resident, ScheduleSlot, ResidentLines, PlaceId, GiftId types. Do not change it.
- packages/gnome/src/types.ts: the `Look` type (hat, coat, skin, beard and the rest). Build each look from the palette in
  packages/gnome/src/look.ts (PALETTE). Copy the field names exactly; leave out fields you do not need only if `Look` allows it
  (check whether the fields are optional).
- docs/roadmaps/pebblecross.md, "Residents" table and the Places list: every PlaceId you use must be one of them.

## Change
- games/pebblecross/src/residents.ts: export `RESIDENTS: Resident[]` (in RESIDENT_IDS order) and
  `RESIDENT_BY_ID: Record<ResidentId, Resident>` built from it.
  Fill each Resident with: id, name, role, blurb (one line for the friends list), home, favourite, look (a complete Look with
  distinct hat and coat colours per resident, so they are easy to tell apart), weekday and weekend schedules, lines.
  Use these schedules (hours; from > to wraps past midnight; every resident sleeps at home from 22 or 20 until morning):
  - nettle: weekday 5-13 bakery "baking and selling bread"; 13-19 green-bench "resting with a cup of tea"; 19-22 home-nettle "at home"; 22-5 home-nettle "asleep".
    weekend 7-12 bakery; 12-17 green "sitting out"; 17-22 home-nettle; 22-7 home-nettle asleep.
  - fernwick: weekday 8-12 post-office "sorting the post"; 12-16 green "walking the round"; 16-19 inn "a quiet half"; 19-8 home-fernwick "asleep" (use from 19 to 8).
    weekend 10-14 green "walking the round"; rest home (14-24 home "at home", 0-10 home asleep).
  - tansy: weekday 9-17 potting-shed "potting seedlings"; 17-19 oak "watering the oak"; 19-22 home-tansy "at home"; 22-8 home-tansy asleep.
    weekend 10-16 potting-shed; 16-18 pond "watching the newts"; rest home (18-22 "at home", 22-10 asleep).
  - hollis: weekday 8-16 yard-shed "fixing a mower, from a safe distance"; 16-18 green-bench "not looking at the mowers"; 18-21 home-hollis "at home"; 21-7 home-hollis asleep.
    weekend 9-13 yard-shed; 13-17 green "tidying the green"; rest home (17-23 at home, 23-9 asleep).
  - lou: weekday 8-16 yard-shed "lifting sacks with Hollis"; 16-19 inn "a pint and a dart"; 19-22 home-lou "at home"; 22-8 home-lou asleep.
    weekend 9-13 yard-shed; 13-16 green "carrying the bench"; rest home (16-22 at home, 22-9 asleep).
  - marjory: weekday 9-15 school "teaching the Acorn Club"; 15-18 green "ball games on the green"; 18-21 home-marjory "at home"; 21-8 home-marjory asleep.
    weekend 10-12 green "ball games on the green"; rest home (12-22 at home, 22-9 asleep).
  - clem: weekday 10-17 home-clem "doing the accounts"; 17-24 inn "pulling pints"; 1-10 home-clem asleep; 0-1 inn "closing up" (order the list so the 0-1 slot comes before the 1-10 slot; the 0-1 slot is in the same list).
    weekend 11-15 home-clem "having a lie-in"; 15-24 inn "pulling pints"; 1-11 home-clem asleep; 0-1 inn "closing up".
  - doris: weekday 10-13 green "pottering about the green"; 13-17 green-bench "on the bench by the pond"; 17-22 home-doris "at home with the wireless"; 22-8 home-doris asleep.
    weekend same as weekday.
  - gertrude: weekday 9-12 oak "knitting under the oak"; 12-15 green-bench "knitting in the sun"; 15-20 oak "knitting"; 20-9 home-gertrude asleep.
    weekend 10-15 oak; 15-20 green-bench; 20-10 home-gertrude asleep.
  Every list must cover the whole day: check it in a test (see Done when). The slot "at home" (not asleep) fills any gap.
  Lines (every list at least 2 lines, short, dry, no pop culture, no gore):
  - Write lines for morning, day, evening, night, close (friends), favourite (given their favourite gift), gift (any other gift).
  - Use the lore entries' voice where they exist; a resident's line should sound like their blurb.
  Favourites: nettle crumb, fernwick bottlecap, tansy dandelion, hollis pebble, lou acorn, marjory clover, clem mushroom,
  doris pebble, gertrude dandelion.
  Homes: nettle home-nettle, fernwick home-fernwick, tansy home-tansy, hollis home-hollis, lou home-lou, marjory home-marjory,
  clem home-clem, doris home-doris, gertrude home-gertrude.
- games/pebblecross/src/residents.test.ts (vitest): (1) RESIDENTS has nine entries with the ids in RESIDENT_IDS order, unique names;
  (2) every schedule slot's `at` is a PlaceId string from the list in config (use an array of the PlaceId values in the test);
  (3) every hour of 0-24 is covered by a slot in both weekday and weekend lists (for each hour h in 0..23 with 0.5 steps, some slot
  matches: from <= h < to, or wrapping); (4) every lines list has at least 2 lines; (5) favourite is one of GIFT_IDS.

## Contract
RESIDENTS and RESIDENT_BY_ID exactly as in the roadmap. Names and roles exactly as the roster.

## Done when
- `npx vitest run src/residents.test.ts` (run inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/residents.ts.

## Out of scope
Any file except src/residents.ts and src/residents.test.ts. Do not edit config.ts; if a type is missing, say so in your report.
~~~~

~~~~text
Epic: 2 Modules / B1 Town data
Depends on: F1

## Environment
Working directory: repo root. Other workers are writing other files in games/pebblecross now. You own the JSON and one test file.
Level format rules: packages/level/README.md (the LevelDoc layers, units, axes: +x east, +z south, metres) and
packages/level/src/types.ts and validate.ts (the validator). Read them before writing the file.

## Goal
The town as a level document: the map of Pebblecross, every place, forage patch, building, prop, road and pond.

## Read first
- packages/level/src/types.ts: LevelDoc, PathDef, PropDef, MarkerDef, Stamp (gauss and flatten shapes).
- packages/level/src/validate.ts: the function that validates a level document (name it in your test).
- games/club-gnome/src/data/levels/town.level.json: a real example of props and the look of a level file.
- packages/prefabs/src/catalog/ and `npm run dev -w games/prefab-gallery` are the prefab ids: pick props from ids that exist
  (search the catalog files for `id:` lines with grep: e.g. grep -rh "id: '" packages/prefabs/src/catalog/ | head).
  Use ids for: bench, lamp, tree or oak, flower bed, fence, hedge, sign, barrel, wheelbarrow, bush, rock, pond stone, mushroom,
  mailbox, mower (a parked mower), flower pot. Use only ids that exist; `npm test -w packages/prefabs` must still pass.
- docs/roadmaps/pebblecross.md, "Places" and "Buildings" sections (fixed ids and labels).

## Change
- games/pebblecross/src/data/levels/pebblecross.level.json (replace the placeholder): a LevelDoc with
  format "lawn-level", version 1, game "pebblecross", id "pebblecross", name "Pebblecross", bounds {w: 64, d: 48}.
  - stamps: one `gauss` stamp with a gentle rise (amount 0.25, sigma 6) on the green, so the ground has a slight hill.
  - paths: two `road` paths (width 2.4): a loop road round the green, and a lane from the Yard Shed to the north gate.
    Roads are drawn only; they are walkable.
  - props: 20 to 40 prefab placements from the ids you verified (trees along the boundary, a bench at the green-bench, lamps, flower beds,
    bins, a mower parked by the Yard Shed). Give each a `solidR` if it is a blocking object (benches, trees, bins); leave it off for flat
    decoration. No prop may sit on a road centre line or inside a building footprint.
  - markers: exactly one `spawn` at the green's edge; one `place` per PlaceId (19 ids, listed in the roadmap) with
    `data: { label }` (the label is a short human name: "Crumb & Crock", "Post Office", "Potting Shed", "Yard Shed", "Acorn Club",
    "Lantern Inn", "the green", "the bench by the pond", "the pond", "under the oak", and for each house "Nettle's house"
    and so on); `r` is the wander radius (5 for green, 1.5 for green-bench, 1.2 for pond and oak, 2 for shops, 1.2 for houses);
    `forage` markers for the 14 patch ids in the roadmap, each `data: { item: <gift id> }`, `r: 0.6`.
  - data: { ground: "#7fae5a", ponds: [{x, z, r}] (one pond, r 2.2, near the pond place), blockers: [boxes for the walls and
    the oak's trunk, as {x, z, w, d}], buildings: [15 entries: {id, label, x, z, w, d, h, color, roof}] with colours as "#rrggbb"
    strings }. Building ids: bakery, post-office, potting-shed, yard-shed, school, inn, and home-nettle, home-fernwick,
    home-tansy, home-hollis, home-lou, home-marjory, home-clem, home-doris, home-gertrude (labels as above).
  Layout rules (check by eye and by the test):
  - Every place and forage marker is outside every building footprint and every pond; every place is at least 1.5 m from every
    building edge except its own building's door side (the place for a house is on its door side, outside the footprint).
  - The village green is in the middle; the shops and houses are around it in two rows; spawn is on the green.
  - No two buildings overlap; buildings are 3 to 6 m wide and 2 to 3 m high (h). Walkways between buildings are at least 2.5 m wide.
  - Every forage patch is reachable on foot: it is not inside a building, and there is a 1 m clear space around it.
- games/pebblecross/src/data/levels/townData.test.ts (vitest): (1) the JSON validates with the validator from @lawn/level (no errors);
  (2) every PlaceId in config's list has exactly one `place` marker with that id, and there are no other `place` markers; (3) there are 14
  forage markers with the item ids from the roadmap; (4) there are 15 buildings; (5) the spawn marker is the only `spawn`; (6) no
  place or forage marker lies inside a building footprint (use the footprint with a 0.3 m margin).
  Import the JSON with `import doc from './pebblecross.level.json';` (resolveJsonModule is on).

## Contract
The file format of packages/level. The ids and labels are in the roadmap; nothing else is a contract.

## Done when
- `npx vitest run src/data/levels/townData.test.ts` (run inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in the JSON or the test.

## Out of scope
Any file except the JSON and townData.test.ts. Do not add code to src/town.ts (another worker owns it). Do not edit packages/prefabs.
~~~~

~~~~text
Epic: 2 Modules / B2 Town loader
Depends on: F1

## Environment
Working directory: repo root. Other workers write other games/pebblecross files now. You own src/town.ts and src/town.test.ts.

## Goal
`loadTown(doc)` turns a level document into the Town the scene and the walkers use: buildings, roads, ponds, props, places, forage,
and the nav world (blocked boxes and circles), plus heightAt from the stamps.

## Read first
- games/pebblecross/src/town.ts (the stub: the types and signatures are the contract; keep them).
- packages/level/src/types.ts, stamps.ts (applyStamps, stampBounds), math.ts: check the exact export names and the shape of
  `Stamp`, `PathDef`, `PropDef`, `MarkerDef`, and `Rect` before using them.
- games/pebblecross/src/nav.ts: the Box and Circle types (the stub is fine; import types only).
- games/club-gnome/src/levelDocs.ts: how a level doc is read and turned into a game's map: the same job, a different game.

## Change
- games/pebblecross/src/town.ts: implement `loadTown(doc)` and `TOWN_DOC` (keep the import of the JSON; the JSON is written by another
  worker. TOWN_DOC is `doc as unknown as LevelDoc<TownData>` on the default import).
  - colours: '#rrggbb' to a number with parseInt(s.slice(1), 16); ground, building color and roof.
  - buildings: from data.buildings, with colours converted.
  - roads: from doc.paths where kind === 'road': points (each [x, z] pair to {x, z}) and width (default 2.4 when absent).
  - ponds: data.ponds as Circle[].
  - props: from doc.props, every field with defaults rot 0, scale 1 (solidR only when present).
  - places: every marker of kind 'place' into `places[id]` as {id, kind: 'place', label: data.label, x, z, r: m.r ?? 1.5};
    the spawn marker: spawn = {x, z}; forage markers: each into forage[] as {id, kind: 'forage', label: data.label ?? 'Forage', x, z, r, item: data.item}.
  - navWorld: boxes = data.blockers plus, for each building, a box of w by d at x, z; circles = ponds plus every prop with solidR (x, z, r = solidR).
    w and d come from doc.bounds.
  - stamps: doc.stamps.
  - heightAt(x, z): applyStamps on a base of 0 at (x, z) (check how applyStamps is called in packages/level/src/stamps.ts and use that
    signature). Return the height in metres.
  - Do not mutate the document: structuredClone it first.
- games/pebblecross/src/town.test.ts (vitest): build a tiny inline LevelDoc (one road, one pond, two buildings, one prop with solidR,
  one place, one forage, one spawn, one gauss stamp) and check: buildings and colours converted; navWorld boxes and circles
  contain the right items; places and forage are keyed as above; heightAt is greater than 0 at the centre of the gauss stamp and near 0
  far away; loadTown does not change its input (deep equal before and after). Also: the test uses the TOWN_DOC import too and checks
  loadTown(TOWN_DOC) does not throw (TOWN_DOC may be the placeholder: that is fine).

## Contract
Names and types exactly as in the roadmap's `src/town.ts` section.

## Done when
- `npx vitest run src/town.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/town.ts.

## Out of scope
src/data/** (another worker), any other module. Do not edit @lawn/level.
~~~~

~~~~text
Epic: 2 Modules / C Nav
Depends on: F1

## Environment
Working directory: repo root. You own src/nav.ts and src/nav.test.ts.

## Goal
Pure walking-path planner: a grid over the town, grown by the gnome's radius, with A* and snapping.

## Read first
- games/pebblecross/src/nav.ts (the stub; the exported types and function signatures are the contract).
- games/pebblecross/src/config.ts: AGENT_RADIUS, NAV_CELL.
- packages/level/src/walkgrid.ts for the idea of a baked grid (you do not reuse it; the town is small enough to test at run time).

## Change
- games/pebblecross/src/nav.ts: implement `makeNav(world, agentRadius = AGENT_RADIUS)` returning the Nav.
  - Grid: cells of NAV_CELL metres, covering [-w/2, w/2] by [-d/2, d/2]. A cell is blocked when its centre is within agentRadius
    of any box (the box grown by agentRadius, test with the centre) or within agentRadius + r of any circle centre, or outside bounds
    shrunk by agentRadius. Precompute a Uint8Array of blocked flags once in makeNav.
  - isFree(x, z): the cell at x, z is inside the grid and not blocked (x, z are world metres).
  - nearestFree(x, z, maxR = 3): the nearest free cell centre (ring search by Chebyshev rings out to maxR), returned as Pt, or null.
  - findPath(from, to): snap `to` with nearestFree (null means no path: return null). Snap `from` too; if the start cell is blocked
    (e.g. a gnome standing at a wall edge) use nearestFree on it. If both snap to the same cell, return [] (no move needed).
    Otherwise run A* over 8-neighbour moves (diagonal cost sqrt(2)), forbidding diagonal moves that cut a blocked corner,
    Euclidean heuristic, with a binary heap. Limit expansions to the grid size. Return the cell centres as Pt, after the start,
    ending at the snapped goal. Then string-pull: drop any intermediate point that a straight line can see (every sampled point
    on the segment, every half cell, is free). Keep the path free of the start point.
  - No allocation in isFree; findPath may allocate.
- games/pebblecross/src/nav.test.ts (vitest): (1) an empty 20 by 20 world: path from (-8,-8) to (8,8) exists, every point is
  free, the last point is (8,8) within NAV_CELL; (2) a wall box across the middle with a gap: the path goes through the gap
  (check a point near the gap centre is on the path and no point is inside the box); (3) no gap: findPath returns null;
  (4) a circle of radius 1 at the centre: start and goal on opposite sides path around it (no point within 1 m of the centre);
  (5) from equal to a free point returns []; (6) nearestFree of a point inside a box returns a free point within 3 m;
  (7) a path between two points in a 64 by 48 world with 15 boxes (random but seeded, mulberry32 from packages/level is fine to
  import or write your own tiny LCG) still finds a path between free points or returns null, and every returned point is free.
  Performance: a 64 by 48 world with findPath between opposite corners takes under 50 ms (assert under 500 ms to avoid flakiness).

## Contract
Types and function signatures exactly as in the roadmap's `src/nav.ts` section.

## Done when
- `npx vitest run src/nav.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/nav.ts.

## Out of scope
Every other module. Do not touch @lawn/level.
~~~~

~~~~text
Epic: 2 Modules / D Clock and schedule
Depends on: F1

## Environment
Working directory: repo root. You own src/clock.ts, src/schedule.ts and their tests.

## Goal
The game clock and what a resident is doing at any time, as pure functions.

## Read first
- games/pebblecross/src/config.ts: DAY_SECONDS, MINUTES_PER_DAY, START_HOUR, DAY_NAMES, ScheduleSlot, Resident, PlaceId.
- games/pebblecross/src/clock.ts and schedule.ts (the stubs: keep the exported names and signatures).

## Change
- src/clock.ts: implement every function listed in the roadmap's clock section. Day 0 is Monday. dayIndex and dayName use
  floor(total / MINUTES_PER_DAY). hourOf: ((total % 1440) + 1440) % 1440 / 60. clockLabel: "Mon 07:00" (zero-pad the hour and minute).
  isWeekend: dayName is Sat or Sun. startClock: START_HOUR * 60.
- src/schedule.ts: implement activityAt(r, total). Pick the weekday list (Mon to Fri) or the weekend list (Sat, Sun). The hour h is
  hourOf(total). A slot matches when from <= h < to, or when from > to (it wraps) and (h >= from or h < to). Return the first match in
  list order. No match: { at: r.home, doing: 'at home', asleep: false }. asleep is true only when the matched slot's doing === 'asleep'.
  An "asleep" slot counts as a match; the hidden state is decided by the caller.
- src/clock.test.ts: clockLabel(startClock()) === 'Mon 07:00'; dayName(MINUTES_PER_DAY * 5) === 'Sat' and isWeekend true; hourOf of
  a total with 90 minutes past midnight of day 1 is 1.5; clockLabel of total = 1440 + 25 * 60 is 'Tue 01:00'; gameMinutesPerRealSecond * DAY_SECONDS === MINUTES_PER_DAY.
- src/schedule.test.ts: a small Resident built in the test (use a literal, not residents.ts) with a weekday slot 9-17 at 'potting-shed',
  a wrapping slot 22-8 asleep at 'home-tansy', and a weekend slot 10-16. Check: 10:00 Monday is potting-shed; 12:00 Saturday is the
  weekend slot; 23:30 on a Wednesday is asleep; 02:00 on a Thursday is asleep at home-tansy; 08:30 on a Monday is no slot: 'at home'
  not asleep; 17:00 exactly on a Monday is not in 9-17 (to is exclusive) and gives the home fallback.

## Contract
Names and signatures exactly as in the roadmap's clock and schedule sections.

## Done when
- `npx vitest run src/clock.test.ts src/schedule.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in these files.

## Out of scope
Any other file. residents.ts is written by another worker; the tests here use their own literal resident.
~~~~

~~~~text
Epic: 2 Modules / E Friendship and dialogue
Depends on: F1

## Environment
Working directory: repo root. You own src/friendship.ts, src/dialogue.ts and their tests. No DOM, no three.js.

## Goal
The save model and the rules of befriending, plus the line picker. Pure logic, tested without a browser.

## Read first
- games/pebblecross/src/config.ts: Save, GiftId, ResidentId, GIFTS, FRIEND_LEVELS, FRIEND_MIN_POINTS, TALK_POINTS,
  GIFT_FAVOURITE_POINTS, GIFT_OTHER_POINTS, MAX_POINTS, SAVE_KEY, Resident, ResidentLines.
- games/pebblecross/src/friendship.ts and dialogue.ts (the stubs: keep the names and signatures).
- games/pebblecross/src/clock.ts is being written by another worker: do not import it. Use `hourOf` only if it exists; to be safe,
  dialogue.ts computes the hour itself as ((total % 1440) + 1440) % 1440 / 60 and does not import clock.ts.

## Change
- src/friendship.ts:
  - emptySave(): { v: 1, clock: START_HOUR * 60, bag: {}, points: {}, talkedDay: {}, giftedDay: {}, giftsGiven: 0 }. Use START_HOUR from config.
  - readSave(storage = localStorage): try/catch around everything. Read SAVE_KEY; JSON.parse; check v === 1 and every field's type
    (clock a finite number; bag, points, talkedDay, giftedDay objects; giftsGiven a number); on any problem return null. Storage may be
    missing (e.g. no window): return null then. Never throws.
  - writeSave(save, storage = localStorage): try/catch; setItem(SAVE_KEY, JSON.stringify(save)); return true; on error false. Never throws.
  - levelOf(points): the index of the last FRIEND_LEVELS entry whose min <= points (points clamped to 0..MAX_POINTS); return {index, name}.
  - isFriend, friendCount: points >= FRIEND_MIN_POINTS (friendCount counts residents: the points map values, for the ids present; the caller
    also passes RESIDENT_IDS when needed, so count only the ids of save.points with a value >= FRIEND_MIN_POINTS).
  - canTalk(save, id, day): (save.talkedDay[id] ?? -1) !== day.
  - talk(save, id, day): if !canTalk return 0; set talkedDay[id] = day; points[id] = min(MAX_POINTS, (points[id] ?? 0) + TALK_POINTS); return TALK_POINTS
    (or the real gain when capped: return the difference actually added).
  - bagCount(save, item): bag[item] ?? 0. addToBag(save, item, n = 1): bag[item] = bagCount + n.
  - canGive(save, id, item, day): bagCount(save, item) > 0 and (giftedDay[id] ?? -1) !== day.
  - give(save, id, item, day, favourite): if !canGive, return 0 (no change). Else bag[item] -= 1 (delete the key when it reaches 0), giftedDay[id] = day,
    giftsGiven += 1, points[id] = min(MAX_POINTS, (points[id] ?? 0) + (favourite ? GIFT_FAVOURITE_POINTS : GIFT_OTHER_POINTS)); return the points actually added.
- src/dialogue.ts:
  - talkLine(r, total, points, pick): hour = ((total % 1440) + 1440) % 1440 / 60. Bucket: 5 <= h < 11 morning, 11 <= h < 17 day,
    17 <= h < 22 evening, else night. If points >= FRIEND_MIN_POINTS and mod3(pick) === 0 use r.lines.close. Choose list[mod(pick, list.length)]
    with a non-negative mod. Return the string.
  - giftLine(r, favourite, pick): favourite ? r.lines.favourite : r.lines.gift, same non-negative index.
- Tests:
  - src/friendship.test.ts: a fake storage object ({getItem, setItem} over a Map) and a throwing storage. readSave of nothing is null;
    write then read round-trips; malformed JSON gives null; a throwing storage gives null and writeSave false; talk gives TALK_POINTS once per day and
    0 the second time, and allows talking again the next day; give: favourite gives GIFT_FAVOURITE_POINTS, other gives GIFT_OTHER_POINTS, one gift
    per resident per day (second give is 0 and does not use the bag); points cap at MAX_POINTS; levelOf(0) is Stranger, levelOf(20) Acquaintance,
    levelOf(100) Best friend, levelOf(999) Best friend; isFriend at FRIEND_MIN_POINTS true, one below false; bag empties and the key is removed.
  - src/dialogue.test.ts: a literal Resident with distinct lists: talkLine in the morning/day/evening/night buckets returns from the right list
    (use hours via total = day*1440 + hour*60); close list used when friend and pick % 3 === 0; negative pick does not throw and returns an entry of the list;
    giftLine returns from favourite or gift lists.

## Contract
Names and signatures exactly as in the roadmap's friendship and dialogue sections.

## Done when
- `npx vitest run src/friendship.test.ts src/dialogue.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in these files.

## Out of scope
Any other file. Do not write localStorage keys other than SAVE_KEY.
~~~~

~~~~text
Epic: 2 Modules / F World scene
Depends on: F1

## Environment
Working directory: repo root. You own src/world.ts and src/world.test.ts (the test may be skipped if three needs a WebGL context: make
the test check only pure helpers, and say so). Other workers write other files now.

## Goal
Build the town's 3D scene from a Town: ground, roads, pond, buildings, props, place and forage markers.

## Read first
- games/pebblecross/src/world.ts (stub), town.ts (Town type; the contract), config.ts.
- packages/prefabs/README.md: `buildPrefab`, `buildStaticPrefabs`, `prewarmPrefabs`, and what `buildStaticPrefabs` takes. Use it for props.
- games/club-gnome/src/world.ts: the way that game builds its ground and buildings with three (materials, shadows, fog). Copy the pattern,
  not the code.

## Change
- src/world.ts: `buildWorld(scene, town)`:
  - Ground: a PlaneGeometry of town.w by town.d with segments every 1 m, vertices raised with town.heightAt(x, z) and a
    MeshLambertMaterial in town.ground colour (flatShading false). Receive shadows.
  - Roads: for each road, a flat ribbon of the road's width along each segment (a plane strip, slightly above the ground at y + 0.02), colour
    #c9b89a. Use heightAt at each point.
  - Ponds: a cylinder (or a flat circle) of radius r at heightAt(x,z) + 0.03 in blue #3f7fbf, plus a ring of six small pebble props or
    a rim cylinder in #9a9a8a (optional).
  - Buildings: a BoxGeometry of w by h by d, colour from `color`, with a pitched roof made by a ConeGeometry or a triangular prism in
    `roof` colour (a 4-sided ConeGeometry is fine). Centre at (x, heightAt + h/2, z). Set castShadow. Put `userData.buildingId = id` on the group.
  - Props: for each town.props entry call buildPrefab(prefab, { scale }) (check the signature in packages/prefabs/src/index.ts),
    rotate by rot about Y, place at (x, heightAt, z). If buildPrefab throws for an unknown id, skip that prop and console.warn once.
  - Places and forage: an invisible (or small, flat) marker per place, with userData.placeId = place.id. For forage, a small
    sphere or the matching emoji-free prefab-less mesh (a small green-brown sphere, radius 0.25) at (x, heightAt + 0.3, z),
    userData.placeId = id and userData.forage = true. The pickables list holds every place and forage object. Use a transparent
    circle ring for places so the player sees where things are (optional).
  - Lights: do not add lights here (the game's main owns them). Do not clear the scene.
  - update(dt): bob every forage object up and down a little (sin of time) and keep time internally.
  - dispose(): remove everything this function added from the scene, and dispose its own geometries and materials.
- src/world.test.ts (vitest): test a pure helper you export from world.ts, `roofHeight(h: number): number` (roof height = h * 0.45, and a
  test that it is positive for positive h). Also export `forageBobOffset(time: number, phase: number): number` = Math.sin(time * 2 + phase) * 0.06, and test it
  stays within ±0.06. Add these two helpers to the stub file as exports. Do not render in the test.

## Contract
`buildWorld(scene, town)` and `WorldView` exactly as in the roadmap's world section, plus the two exported helpers above.

## Done when
- `npx vitest run src/world.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/world.ts.

## Out of scope
Lights, the camera, the player and residents (other files), prefab definitions (packages/prefabs).
~~~~

~~~~text
Epic: 2 Modules / G Actors (walkers and residents)
Depends on: F1

## Environment
Working directory: repo root. You own src/actors.ts and src/actors.test.ts.

## Goal
Walkers that follow a path, residents who walk to their schedule, and the player's gnome.

## Read first
- games/pebblecross/src/actors.ts (stub), config.ts (RESIDENT_SPEED, PLAYER_SPEED), schedule.ts and clock.ts (being written by
  another worker: import `activityAt` from './schedule' and `hourOf` from './clock' only, and keep to their signatures in the roadmap).
- packages/gnome/README.md and packages/gnome/src/model.ts: `createGnomeModel(look, opts?)` and the object it returns (what to add
  to the scene and how to move it: check whether it is a THREE.Group, or has a `.group` or `.root` property).
- packages/gnome/src/resolve.ts: `getMyGnome()` returns the player's gnome or null. The player's look is `getMyGnome()?.look`.
- games/club-gnome/src/avatars.ts: how a game places and turns a gnome model. Copy the approach.

## Change
- src/actors.ts:
  - class Walker: holds the object, the town (for heightAt), a path (Pt[]), the speed. update(dt): moves toward path[0] at speed * dt,
    pops points when within 0.05 m, sets object.position.x, z and y = town.heightAt(x, z), and turns the object to face the heading
    (rotation.y = atan2(dx, dz)) while moving. When the path is empty, moving is false. stop() clears the path. pos returns {x, z}.
  - createResidentActor(scene, town, resident, total): model = createGnomeModel(resident.look) (its root object added to the scene);
    place = activityAt(...).at; start at town.places[place] (or home) with a random-free offset: just the place centre. Returns the actor.
  - updateResidentActors(actors, town, nav, total, random): for each actor: act = activityAt(actor.resident, total); set actor.doing,
    actor.asleep. If asleep: hide the object (visible = false), stop walking, keep position (inside the home). If not asleep: visible = true.
    If act.at !== actor.place (or the actor just woke): actor.place = act.at; target = a random free point within place.r of the place centre
    (try up to 12 random points with nav.isFree; fall back to the centre; then nav.findPath(walker.pos, target)); if path is null, stop()
    and keep actor.place unchanged so it retries next call. Set actor.walker.setPath(path).
    Walk the walker in update() only; updateResidentActors does not move them.
  - createPlayerWalker(scene, town, look): model = createGnomeModel(look ?? <the game's own look: a default Look from residents or a
    simple one>): if look is null, use the same default look as the player's fallback described in packages/gnome/README.md
    (the game's own look); keep the fallback minimal: export `DEFAULT_PLAYER_LOOK` from actors.ts, built from the first
    RESIDENT's look is not allowed (residents.ts is written by another worker), so build a plain Look literal with the required
    fields (copy the shape from packages/gnome/src/look.ts DEFAULT or a sample). Returns Walker at town.spawn with speed PLAYER_SPEED.
  - Walker speed for residents: RESIDENT_SPEED.
- src/actors.test.ts (vitest): test Walker with a plain object (`{ position: {x:0,y:0,z:0}, rotation: {x:0,y:0,z:0} }` cast as THREE.Object3D)
  and a fake town with heightAt() => 0: after setPath([{x: 3, z: 0}]) and update(1) at speed 1 the pos is at x 1; after enough time
  it reaches the point and moving is false; stop() clears; updateResidentActors with a fake nav (isFree true, findPath returns [{x:1,z:0}])
  sets the walker's path when the place changes and does nothing when it has not changed. Avoid importing three at runtime
  in tests if possible (type import only); createGnomeModel is not called in the tests (the functions that build models are not tested).

## Contract
Names and signatures exactly as in the roadmap's actors section.

## Done when
- `npx vitest run src/actors.test.ts` (inside games/pebblecross) passes.
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/actors.ts.

## Out of scope
The camera, the input, the HUD, the main loop. Do not change @lawn/gnome.
~~~~

~~~~text
Epic: 2 Modules / H HUD and dialog
Depends on: F1

## Environment
Working directory: repo root. You own src/hud.ts. There is no test file; check it with tsc and by reading. The page is phone first:
portrait 390x844 and landscape 844x390, with safe-area insets.

## Goal
The DOM interface over the 3D town: the clock, the place name, one big action button, the speech box, and toasts.

## Read first
- games/pebblecross/src/hud.ts (stub: keep the names and signatures in the roadmap's hud section).
- games/club-gnome/src/hud.ts: a DOM HUD in the same engine family. Copy the pattern for creating elements under `ui`, not the look.
- AGENTS.md "Mobile by default" rule: touch targets at least 44 px, no hover-only UI, safe-area insets.
- AGENTS.md "UI modules get the shared #ui element as a parent: append your own container to it, never restyle or hide #ui itself."

## Change
- src/hud.ts: `createHud(ui, actions)`:
  - Create one container div (class "pc-hud") appended to ui, position fixed, with a stylesheet injected once (a <style> element with
    id "pc-hud-style", appended to document.head, not duplicated). Colours: parchment (#f4ecd8) panels, dark green text (#1f3a1a), accent #7a4f2a.
  - Top bar (top-left, respecting env(safe-area-inset-top)): the clock label "Mon 07:00" and a sun or moon emoji from the hour
    (🌙 before 6 or from 20, 🌅 6-8, ☀️ otherwise), and the place line under it. Font size at least 14 px.
  - Bottom action area: one large button (min-height 48px, min-width 120px) for the use action, shown only when setUse gets a label
    (its text is the label, e.g. "Talk to Nettle"); when enabled is false it is greyed. Tapping it calls actions.onUse.
  - Two round buttons bottom-right, 52 px each: 🎒 (bag) and 📒 (friends) calling onBag and onFriends. Keys are handled in input.ts, not here.
  - Speech box (dialog): a panel at the bottom above the buttons, max width 560px, showing the speaker name in bold and the text; tap
    anywhere on it to close (calls onClose then hides). While open, the action button is hidden.
  - toast(text): a pill at the top centre that fades out after 2.5 s. Several toasts queue visually (just stack them, newest on top).
  - Layout must fit 390x844 and 844x390. Nothing is fixed to the centre of the screen that could cover the town's centre: the
    dialog is at the bottom only and at most 40% of the height.
  - No element is hover-only. All buttons have aria-label.
- Nothing is imported from three.js. Nothing reads localStorage.

## Contract
`createHud(ui, actions)` and `Hud` exactly as in the roadmap's hud section.

## Done when
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/hud.ts.
- The file has no reference to document.body other than appending the style once.

## Out of scope
The friends list, the bag and the resident card (panels.ts). The main loop.
~~~~

~~~~text
Epic: 2 Modules / I Panels
Depends on: F1

## Environment
Working directory: repo root. You own src/panels.ts. No test file; check with tsc and by reading. Phone first (390x844 and 844x390).

## Goal
The full-width panels over the town: the friends list, the bag (and the gift picker), and a resident's card.

## Read first
- games/pebblecross/src/panels.ts (stub: keep the names and signatures in the roadmap's panels section).
- config.ts: Resident, Save, GIFTS, FRIEND_LEVELS. friendship.ts exports bagCount (being written by another worker): import
  bagCount from './friendship' and use it only if it is in the file, otherwise read save.bag directly.
- The hud.ts file (another worker in the same epic): do not import it; panels are their own DOM.
- AGENTS.md mobile rules as in the HUD issue.

## Change
- src/panels.ts: `createPanels(ui)`. One container (class "pc-panel") appended to ui, hidden until opened, with a close button (44px, ✕,
  aria-label "Close") and Escape closing it (the input module calls close(); do not bind keys here).
  - Styling: a full-height sheet on phones (max-height 80vh, scrollable inside), a centred card on wide screens (max width 480px).
    Injected style once (id "pc-panel-style"). Colours: as the HUD (parchment #f4ecd8, text #1f3a1a, accent #7a4f2a).
  - openFriends(rows, onPick): a title "Friends", then one row per resident: emoji-free initial avatar (a circle with the first letter),
    name, role, the level name and a bar (points / 100), and `where` as a second line. Row is a button of at least 44px, tap calls onPick(id).
    Sort: friends (points >= 50) first, then by points, then name.
  - openBag(save, onPick?): a title "Bag"; one row per gift in GIFT_IDS that the save has (bagCount > 0): icon, label, count. With onPick,
    the rows are buttons calling onPick(item) and the title is "Give a gift". With no onPick, rows are plain. An empty bag says "Nothing in
    the bag yet. Forage the green for gifts." in an empty state.
  - openResident(r, row, actions): a title with the name, the role, the blurb, the level name and the bar; buttons: "Talk" (calls actions.talk, disabled when
    !actions.canTalk), "Give a gift" (calls actions.give, disabled when !actions.canGive). Both at least 44px tall. Show `row.where` in a line.
  - close(): hides and empties the container. isOpen(): true while a panel is shown.
  - Opening a new panel replaces the one shown. The container is only ever a child of ui; ui is not restyled.

## Contract
`createPanels(ui)` and `Panels`, `FriendRow` exactly as in the roadmap's panels section.

## Done when
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/panels.ts.
- The file creates nothing outside ui and the one injected style element.

## Out of scope
The HUD (hud.ts), the friendship logic (friendship.ts), the main loop.
~~~~

~~~~text
Epic: 2 Modules / J Camera and input
Depends on: F1

## Environment
Working directory: repo root. You own src/camera.ts and src/input.ts. A test is optional: a pure helper test is welcome.

## Goal
A follow camera for the town, and tap, click and key input that picks what the player touched.

## Read first
- games/pebblecross/src/camera.ts and input.ts (stubs: keep the names and signatures from the roadmap's camera and input sections).
- games/club-gnome/src/world.ts or main.ts: how that game raycasts the ground and the buildings. Copy the approach.
- AGENTS.md: touch-first game. Tap and click are one thing; no keys-only action.

## Change
- src/camera.ts: `createCameraRig(town)`: a PerspectiveCamera (fov 45, near 0.5, far 400), placed on a fixed angle behind the look-at point:
  offset (0, 22, 16) at zoom 1; zoom(delta) changes the distance between 0.6 and 1.8 (clamped). follow(x, z, dt) eases the look-at point toward
  (x, 0, z) with exponential smoothing (rate 6 per second). The look-at point starts at the town centre. resize(w, h) sets aspect and
  projectionMatrix. Put the camera at the look-at point plus the offset each call of follow.
- src/input.ts: `createInput(canvas, rig, ground)`:
  - Pointer: track pointerdown position; on pointerup if moved less than 10 px and the pointer was not part of a pinch, raycast from the rig's camera
    through the pointer position: first the pickables (set via setPickables), then the ground mesh. Build the TapHit:
    an object with userData.residentId -> {kind:'resident', id}; userData.placeId with userData.forage -> {kind:'forage', id};
    userData.placeId otherwise -> {kind:'place', id}; ground hit -> {kind:'ground', x, z} from the hit point. Call every onTap callback.
  - Pinch: two pointers, the distance change calls rig.zoom. Wheel: rig.zoom(deltaY * 0.001).
  - Keys on window: 'e' or ' ' (space) -> 'use'; 'b' -> 'bag'; 'f' -> 'friends'; 'Escape' -> 'escape'. Ignore keys when an input element has focus.
  - Use the canvas for pointer events; the canvas has touch-action none (set in index.html).
  - dispose() removes all listeners.
- Tests (optional): a helper `pinchZoomDelta(prevDist: number, nextDist: number): number` exported from input.ts, returns (prevDist - nextDist) * 0.01,
  tested in input.test.ts. If you add it, add it to the stub's exports.

## Contract
`createCameraRig`, `CameraRig`, `createInput`, `Input`, `TapHit` exactly as in the roadmap.

## Done when
- `npx tsc --noEmit -p games/pebblecross` shows no errors in src/camera.ts and src/input.ts.
- If a test was added, `npx vitest run src/input.test.ts` passes.

## Out of scope
The game loop, the HUD, the panels.
~~~~

~~~~text
Epic: 2 Modules / K Achievements
Depends on: F1

## Environment
Working directory: repo root. You own packages/achievements/src/catalog.ts (add entries) and the achievements package tests if they
need a new check. Read packages/achievements/README.md first ("Adding achievements for a new game").

## Goal
Five achievements for Pebblecross, each with a cosmetic reward from @lawn/prefabs.

## Read first
- packages/achievements/README.md (the steps and the rules).
- packages/achievements/src/catalog.ts (the format: id, game, gameTitle, title, description, reward or emote, target).
- packages/achievements/src/types.ts: AchievementDef, EquipSlot.
- packages/achievements tests (ls packages/achievements/src): what they check (reward prefabs exist and fit their slot).
- packages/prefabs/src/catalog/*.ts: find hats and wearable prefabs with `wear-head`, `wear-back`, `wear-neck`, or `wear-hand` uses
  (grep for them). Reuse existing ones; add none unless no existing prefab fits a slot.

## Change
- packages/achievements/src/catalog.ts: append five entries with game 'pebblecross' and gameTitle 'Pebblecross':
  - id 'pc-first-hello', title 'First Hello', description 'Say hello to anyone in Pebblecross.', reward slot 'head' (a hat prefab that exists), label.
  - id 'pc-early-bird', title 'Early Bird', description 'Talk to someone before 08:00.', reward slot 'back' (existing prefab), label.
  - id 'pc-gift-giver', title 'Gift Giver', description 'Give ten gifts.', target 10, reward slot 'neck' (existing prefab), label.
  - id 'pc-pal', title 'Gnome Pal', description 'Make a friend: reach Friend level with someone.', reward slot 'hand' (existing prefab), label.
  - id 'pc-everybody', title "Everybody's Friend", description 'Reach Friend level with all nine residents.', target 9, reward slot 'head'
    (a different existing prefab from the first one), label.
- If the package has a test that lists the games or counts achievements, update it to match. Keep existing entries untouched.

## Contract
The five ids above exactly. The game calls unlock/increment on them; main.ts uses these ids.

## Done when
- `npm test -w packages/achievements` passes.
- Each reward prefab id exists in packages/prefabs (the package test checks this).

## Out of scope
games/pebblecross (any file), packages/prefabs (no new prefabs in this issue; if none fits a slot, say so in your report).
~~~~

~~~~text
Epic: 3 Wiring / L1 Main loop
Depends on: all of Epic 2 (read every module's file before writing main.ts)

## Environment
Working directory: repo root. You own games/pebblecross/src/main.ts and games/pebblecross/index.html (finish it). Read every module
under games/pebblecross/src/ before writing main.ts: use their real exports (names may have grown; use what they export).

## Goal
A playable town: the whole game wired together in main.ts.

## Read first
- games/club-gnome/src/main.ts: the three.js renderer, light, loop and resize pattern. Copy the shape, not the code.
- games/pebblecross/src/*.ts: every module, their exports (the contract is in docs/roadmaps/pebblecross.md).
- packages/gnome/README.md: `await loadMyGnome()` once at the top of main.ts.
- packages/achievements/README.md: `createAchievementTracker({ game, ui })` and `unlock` / `increment`. The game key is 'pebblecross'.

## Change
- src/main.ts:
  - Top: `await loadMyGnome()`. Read `?fast` (clock at 4x: gameMinutes per second multiplied by 4) and `?reset` (clears SAVE_KEY on load). Read
    the save with readSave(); if null use emptySave(). Create the town: loadTown(TOWN_DOC). Build the renderer (WebGLRenderer, antialias, pixelRatio
    min(devicePixelRatio, 2)), a scene with a sky colour (#bfe3ff) and fog, a hemisphere and a directional light with shadows.
  - buildWorld(scene, town); the nav = makeNav(town.navWorld); residents: RESIDENTS.map(createResidentActor). The player: createPlayerWalker(scene, town, getMyGnome()?.look ?? null).
  - The camera rig, the input (createInput(canvas, rig, ground: the ground mesh; expose it from world.ts by walking the scene for
    userData.ground, or add the ground to the scene's userData in buildWorld; read world.ts to see what is exposed; if it is not exposed, find the
    ground mesh by name 'pc-ground' that world.ts gives it, and add that name in world.ts if missing: a one-line change).
  - The clock: total = save.clock. Each frame total += dt * gameMinutesPerRealSecond() * speed. Write the save every 5 real seconds and on
    every change (writeSave). Save.clock = total.
  - Each frame: updateResidentActors(actors, town, nav, total, Math.random); walker.update(dt) for the player and each resident actor's walker;
    world.update(dt); rig.follow(player.pos); renderer.render.
  - Interaction (the one use action): the nearest thing in INTERACT_RANGE in this order: resident (talk), forage (take), place (no action, just
    setPlace). The HUD's use button shows the label: "Talk to <first name>", "Give a gift", "Pick <item>" (forage), or hidden.
  - Tap handling (input.onTap): ground -> player.setPath(nav.findPath(player.pos, hit)); resident -> walk next to them (find a free point
    within TALK_INTERACT_RANGE/2 of them), then open the resident card (openResident) with FriendRow built from the save; place or forage -> walk
    to it; when the player arrives within INTERACT_RANGE, the use button appears (it is the same button). Keep a "pending" target that
    the frame loop checks, so arriving near it shows the action.
  - Talk: talk(save, id, day) where day = dayIndex(total). If it returns > 0: show the line from talkLine(r, total, points, pick) in the dialog,
    and if the level changed to Friend: unlock 'pc-pal'; if the number of friends reached 9: increment 'pc-everybody' (use friendCount);
    if total hour < 8: unlock 'pc-early-bird'; unlock 'pc-first-hello' on any talk. If it returns 0 (already talked): still show a line (no points).
  - Forage: a forage patch gives its item (addToBag) after FORAGE_SECONDS of standing still (a simple timer; a toast "+1 Acorn"). After the pick the
    patch is gone for FORAGE_RESPAWN_MINUTES game minutes (store respawn times in a Map inside main, not in the save).
  - Give: when the resident card's "Give a gift" is tapped: openBag(save, onPick) with onPick(item) -> canGive ? give(...) : toast; the
    points gained toast "+15 friendship with Nettle"; giftLine dialog; if giftsGiven reaches 10: increment 'pc-gift-giver' (or call increment once per gift).
    Level up to Friend: 'pc-pal' and friendCount to 9 -> 'pc-everybody'.
  - Bag button -> openBag(save). Friends button -> openFriends(rows, pick -> the resident card). Rows: { resident, points, level: levelOf(points).name, where:
    `${activity.doing} at ${placeLabel}` from activityAt(resident, total) and town.places[activity.at].label, plus "until HH:00" from the slot if easy }.
  - HUD: setClock(clockLabel(total), hourOf(total)) each frame (or each 0.5 s), setPlace(the label of the place the player stands nearest to, within 3 m).
  - Escape/close: panels.close(); if the dialog is open close it.
  - Keys (input.onKey): 'use' -> the same as tapping the use button; 'bag' -> bag; 'friends' -> friends; 'escape' -> close.
  - Save: after every change, writeSave(save). Clock is stored as save.clock.
  - Achievements: const achievements = createAchievementTracker({ game: 'pebblecross', ui }) created once.
- index.html: finish: it already has the canvas and the ui div; add a <noscript> line. Do not add any other UI.
- Read the mobile rules in AGENTS.md: touch works on every action, no hover-only UI.

## Contract
Exactly the module contracts in docs/roadmaps/pebblecross.md. Do not change a module's exports; if one is missing a name the main
needs, add it to that module and say so in your report (keep it minimal).

## Done when
- `npm run build -w games/pebblecross` passes (tsc and vite build).
- `npm test -w games/pebblecross` passes.
- `npm run dev -w games/pebblecross` starts on port 5202, and `curl -s http://localhost:5202/` returns the page (start it in the background,
  check, then stop it).

## Out of scope
Module internals (other issues own them). Do not edit packages except the achievements catalog (done by another worker) and do not edit club-gnome.
~~~~

~~~~text
Epic: 3 Wiring / L2 Level editor adapter
Depends on: B1 (the JSON exists), Epic 2

## Environment
Working directory: repo root. The level editor is a tool (tools/level-editor). You own a new adapter file and its registration.

## Goal
Pebblecross's town opens in the existing level editor, so it can be edited in 3D like Gnomomia's, and saved to the same JSON.

## Read first
- tools/level-editor/README.md: the GameAdapter idea, how a game is registered, and how saves happen.
- tools/level-editor/src/adapters/club.ts and its index.ts: the closest adapter (a town with buildings, props and markers). Copy its
  structure exactly.
- tools/level-editor/src/adapters/*Level.test.ts: the adapter tests pattern.
- games/pebblecross/src/data/levels/pebblecross.level.json: the document.

## Change
- tools/level-editor/src/adapters/pebblecross.ts: a GameAdapter for 'pebblecross' that loads and saves
  games/pebblecross/src/data/levels/pebblecross.level.json. Its `data` block is the town's TownData shape (ground, ponds, blockers, buildings).
  Markers of kind 'place' and 'forage' and 'spawn' are shown; the editor must allow them to be moved. Props use the prefab ids already in the file.
- tools/level-editor/src/adapters/index.ts: register the adapter the same way the others are.
- tools/level-editor/src/adapters/pebblecrossLevel.test.ts: loads the JSON through the adapter and checks it round-trips unchanged (same keys
  order, same values), like the other adapter tests.
- tools/level-editor/README.md: one row for Pebblecross in the list of games (keep the existing format).

## Contract
The adapter interface the editor already has. The file format is games/pebblecross/src/data/levels/pebblecross.level.json.

## Done when
- `npm test -w tools/level-editor` passes (or the adapter test is the only new test and it passes: run `npx vitest run src/adapters/pebblecrossLevel.test.ts` inside tools/level-editor).
- `npx tsc --noEmit -p tools/level-editor` passes.

## Out of scope
Any game file. Do not change the editor's core (only the adapter, its registration and the README row). If the editor needs a change in core
to show a marker kind, say so in your report and do not make it.
~~~~

~~~~text
Epic: 3 Wiring / L3 Integration tests
Depends on: Epic 2

## Environment
Working directory: repo root. You own games/pebblecross/src/town.integration.test.ts only.

## Goal
Tests that check the whole town works together: every resident can walk to every place they go to, every place is reachable, every
forage patch is reachable.

## Read first
- games/pebblecross/src/town.ts (loadTown, TOWN_DOC), nav.ts (makeNav), residents.ts (RESIDENTS), schedule.ts (activityAt), config.ts.

## Change
- town.integration.test.ts (vitest):
  1. const town = loadTown(TOWN_DOC); const nav = makeNav(town.navWorld).
  2. Every place in town.places is reachable from town.spawn: nav.findPath(town.spawn, place) is not null (for every place).
  3. Every forage patch is reachable from town.spawn.
  4. For each resident, for every schedule slot (weekday and weekend), the slot's `at` place is in town.places, and the resident's home is in
     town.places and reachable from every other place they visit (check path from home to each slot place, not null).
  5. For each resident and each hour 0 to 24 by 0.5 steps, activityAt returns a place that exists in town.places (a total
     of 2 weeks' sample: day 0 to 13, hours on the half hour).
  6. Every resident's home is reachable from the spawn.
  7. Every place is reachable from the spawn with a path that stays inside the town (every point of the path has nav.isFree).
  Keep the test under 20 s (cache paths per pair if needed).

## Contract
The town's data and modules as they are. This test does not change them.

## Done when
- `npx vitest run src/town.integration.test.ts` (inside games/pebblecross) passes. If it fails, report exactly which place or resident
  fails and why (a map or schedule fix is the data worker's job; do not edit the data or the schedules: report).

## Out of scope
All other files.
~~~~

~~~~text
Epic: 3 Wiring / L4 Docs and demo
Depends on: Epic 2 (you need the names of the modules; wait for nothing else)

## Environment
Working directory: repo root. You own games/pebblecross/README.md, games/pebblecross/CREDITS.md, games/pebblecross/demos/town.json,
the AGENT_INDEX.md row, and the row in packages/party/README.md (backlog). Nothing else.

## Goal
The docs and the demo script for Pebblecross.

## Read first
- games/club-gnome/README.md (the shape of a game README), docs/demos.md (demo JSON format), games/sample-3d/demos/*.json (an example).
- AGENT_INDEX.md: the table of games and its row format (follow the nearest row for a three game).
- packages/party/README.md: the backlog table.

## Change
- games/pebblecross/README.md: what it is (one paragraph), run (`npm run dev -w games/pebblecross`, port 5202, `?fast`, `?reset`), how
  to play (tap to walk and to use things; E, B, F keys; touch buttons), the clock (480 s per game day, starts Mon 07:00), residents
  (one line each, with home and favourite gift), foraging, gifts, befriending (five levels, how points are earned), the save (localStorage
  key, `?reset`), code (the modules, one line each), editing the town (the level editor, `npm run level-editor` then pick Pebblecross;
  the file path), tests, mobile and online (mobile: yes, touch controls; online: no, single-player, why: a town on its own clock), not done yet
  (no shop, no houses inside, no weather, no seasons).
- games/pebblecross/CREDITS.md: "No external files. Every model is built from @lawn/prefabs and three.js primitives; the emoji in the bag
  are the Unicode characters (system fonts)." Plus the lore sources (docs/lore/entries/the-yard/pebblecross.md) as a note.
- games/pebblecross/demos/town.json: a demo script in the format of docs/demos.md for the town at 390x844 (a phone): a short walk to Nettle
  (tap the ground near the bakery, wait), show the place line, end. Duration 4-6 s. Use `"setup"` keys that a Three game uses (copy a
  three game's demo setup keys that you verified in games/*/demos). If unsure, copy the closest three game's setup and say so in your report.
- AGENT_INDEX.md: one row in the games table for `pebblecross` (folder, engine three, port 5202, notes: one paragraph, how the town works,
  the modules, the level file). Keep the table format exactly.
- packages/party/README.md backlog: one row `| — | pebblecross | later: a day in town has no 20-60 s, four-at-once verb yet (a "most gifts in 40 s" round could be one later) | later |`.

## Done when
- `npm run lore` is not affected (you change no lore files).
- `grep -n "pebblecross" AGENT_INDEX.md packages/party/README.md` finds the rows.
- The JSON in demos/town.json parses: `node -e "JSON.parse(require('fs').readFileSync('games/pebblecross/demos/town.json','utf8'))"`.

## Out of scope
Code, lore, and the editor.
~~~~
