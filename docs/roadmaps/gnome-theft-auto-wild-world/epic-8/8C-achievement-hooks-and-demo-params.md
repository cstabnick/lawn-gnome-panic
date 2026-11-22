Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files
of `games/gnome-theft-auto` at the same time (`src/radio/*`, `src/npcs.ts`, `src/errands.ts`, `src/config.ts`) and
`packages/achievements/src/catalog.ts` (which will gain the achievement ids below): do not touch those files. Your dev
server, if you run one, uses port **5476** only.

## Goal
The game unlocks the new wild-world and boat achievements, and has two demo switches: start at the wheel of any
vehicle at any spot (for a boat on the river), and make Tessie surface on demand.

## Read first
- `games/gnome-theft-auto/src/app.ts`:
  - lines ~119-160: `tracker` (`createAchievementTracker`), `reportNews`, the `achievements` wrapper, and
    `createCritters(scene, world, { ..., event: (id) => { if (id in EVENT_BULLETINS) reportNews(id); } }, REGION_LIFE)`.
  - `function takeWheel(v: Vehicle)` (~line 388): runs once the player is seated in any vehicle (boats included;
    `v.spec.boat` is true for boats); it already does `gta-collector` with `stats.driven`.
  - lines ~1192-1256: `startParams`, the `?mount` block (`vehicles.find(...)`, `m.x = 0; m.z = ...; m.yaw = 0;
    player.respawn(m.x + 2, m.z, 0); m.driver = 'player'; takeWheel(m); chase.yaw = 0;`), and `?at=`.
- `games/gnome-theft-auto/src/tessie.ts`: `TessieWorld` interface (~line 29), `surfaceNow()` (~line 252),
  `surfaceAt(spot)`, `pickSurfaceSpot(loch, rand, depthAt, near?)`, `lochBody()`, `defaultDepth`.
- `games/gnome-theft-auto/src/critters.ts`: `export type CritterEvent` (the nine ids).

## Change
- New `games/gnome-theft-auto/src/wildAchievements.ts` (pure, no three.js, no DOM at import time):
  ```ts
  import type { CritterEvent } from './critters';
  import type { VehicleKind } from './types';
  /** Wildlife events that unlock an achievement (packages/achievements catalog.ts). */
  export const CRITTER_ACHIEVEMENTS: Readonly<Partial<Record<CritterEvent, string>>> = {
    'herd-herded': 'gta-herd-grapevine',
    'cow-tipped': 'gta-tipping-point',
    'drey-scattered': 'gta-drey-day',
    'snowman-smashed': 'gta-snow-joke',
    'bear-shrug': 'gta-unbearably-chill',
    'swarm-escaped': 'gta-bee-line',
  };
  /** The boats "Captain Clay" counts (Tessie is not one of them). */
  export const HELM_BOATS: readonly VehicleKind[] = ['walnut-dinghy', 'gravy-boat', 'clog-cruiser', 'watering-can-steamer', 'hoa-patrol-boat'];
  export const HELMED_KEY = 'gta-boats-helmed-v1';
  export const CAPTAIN_CLAY = 'gta-captain-clay';
  export interface HelmStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }
  /** Remember that the player took the helm of `kind`. True only the first time ever for a HELM_BOATS kind
   *  (the set is a JSON array of kinds under HELMED_KEY; garbage counts as empty; a throwing or null storage
   *  keeps a per-module in-memory set instead). */
  export function recordHelm(kind: VehicleKind, storage: HelmStorage | null): boolean;
  ```
- New `games/gnome-theft-auto/src/wildAchievements.test.ts` (vitest): every value of `CRITTER_ACHIEVEMENTS` is a
  `getAchievement(id)` from `@lawn/achievements` (skip with `it.skipIf` is NOT allowed: if the other worker's catalog
  entries are not there yet when you run it, report it); `recordHelm` is true once per boat kind, false for a repeat,
  false for `'ride-on'` and `'tessie'`, survives a new call with the same storage, and treats garbage JSON as empty.
- `games/gnome-theft-auto/src/app.ts`:
  - import `{ CAPTAIN_CLAY, CRITTER_ACHIEVEMENTS, recordHelm }` from `./wildAchievements`.
  - critters `event` dep becomes:
    `event: (id) => { if (id in EVENT_BULLETINS) reportNews(id); const a = CRITTER_ACHIEVEMENTS[id]; if (a) void tracker.unlock(a); },`
  - in `takeWheel`, after the `gta-collector` block:
    `if (v.spec.boat && recordHelm(v.kind, helmStorage())) void achievements.increment(CAPTAIN_CLAY);` with a small
    local `helmStorage()` that returns `localStorage` inside try/catch (null when it throws or is undefined).
  - `?mountat=x,z[,yaw]` (with `?mount=<kind>`): inside the existing `?mount` block, parse
    `startParams.get('mountat')?.split(',').map(Number)`; when it has 2+ finite numbers, use `kind = startParams.get('mount') || 'ride-on'`,
    take `vehicles.find((x) => x.kind === kind && x.driver === 'none')`, or if there is none create one:
    `const nv = createVehicle(scene, kind as VehicleKind, x, z, yaw); vehicles.push(nv);` then set `m.x = x; m.z = z;
    m.yaw = yaw;` (instead of 0 / -115 / 0), `player.respawn(m.x + 2, m.z, m.yaw)`, seat as now, and `chase.yaw = m.yaw`.
    Without `mountat` the block behaves exactly as before. If the vehicle mesh does not move, call
    `syncVehicleMesh(m, 0)` (used the same way in the `?pileup` block). Update the comment above the block.
  - `?tessie=surface`: after the `?at=` block,
    `if (startParams.get(TESSIE.devParam) === 'surface') setTimeout(() => tessieWorld.demoSurface(player.x, player.z), 2500);`
    and add one comment line. (`?tessie=now` stays as it is; the quest only reacts to `'now'`.)
- `games/gnome-theft-auto/src/tessie.ts`: add to `TessieWorld`
  `/** Demos: surface Tessie in the loch near (x, z) now, quest or not (?tessie=surface). No-op if one is up. */ demoSurface(x: number, z: number): void;`
  implemented as: return if any vehicle is a `'tessie'`; `const body = lochBody(); const spot = body ? pickSurfaceSpot(body, Math.random, defaultDepth, { x, z }) : null; if (spot) surfaceAt(spot);`.
  Do not change `surfaceNow` or anything else.

## Contract
Achievement ids (defined by another worker in `packages/achievements/src/catalog.ts`): `gta-herd-grapevine`,
`gta-tipping-point`, `gta-drey-day`, `gta-snow-joke`, `gta-unbearably-chill`, `gta-bee-line`, `gta-captain-clay`
(target 5). URL params `mountat` and `tessie=surface` exactly as above (demo files depend on them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (errors only in files other workers own: report them, not yours).
- `cd games/gnome-theft-auto && npx vitest run src/wildAchievements.test.ts src/critters.test.ts` passes (if
  `getAchievement` misses the new ids because the catalog worker has not landed, say so).
- With `npx vite games/gnome-theft-auto --port 5476 --strictPort` running, `bash tools/smoke.sh
  "http://localhost:5476/?offline&no-intro&mount=walnut-dinghy&mountat=-690,-640,3.14" canvas` and
  `bash tools/smoke.sh "http://localhost:5476/?offline&no-intro&tessie=surface&at=-715,-560,3.14" canvas` report no
  console errors. Stop the server afterwards.

## Out of scope
`src/radio/*`, `src/npcs.ts`, `src/errands.ts`, `src/config.ts`, every package. No new on-screen buttons.
