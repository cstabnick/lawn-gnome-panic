Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Another worker is redesigning the route lines at the same time:
read everything from the Tracks, never hard-code coordinates.

## Goal
The game notices when the player completes a mountain route end to end (either direction) the right way (driving a
road, riding the Hatband on something small, walking the Brim Walk), says so with a toast and unlocks the route's
achievement. The route ends show on the big map as labelled blips.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/progress.ts` (the stub you fill in), `deps.ts`, `routes.ts`, `types.ts`
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts` — `Track.locate(x, z, reach, hint, window)` -> `{ i, s, lat }`,
  `length()`, `samples()`, `def`
- `games/gnome-theft-auto/src/config.ts` — `VEHICLES[kind]` (`radius`, `flies?`, `boat?`)
- `games/gnome-theft-auto/src/types.ts` — `Blip` (search `export interface Blip`), `VehicleKind`

## Change
- `src/mountainRoutes/progress.ts`:
  - `export const ROUTE_ACHIEVEMENTS: Readonly<Record<RouteId, string>> = { 'brim-gap-road': 'gta-brim-gap-road',
    'spine-cut': 'gta-spine-cut', hatband: 'gta-hatband', 'brim-walk': 'gta-brim-walk' }`.
  - `export function modeOk(kind: RouteKind, vehicle: VehicleKind | null): boolean`: 'road' — a vehicle that is not
    flying (`!VEHICLES[v].flies`) and not a boat (`!VEHICLES[v].boat`); 'track' — the same and `VEHICLES[v].radius <=
    1.2`; 'trail' — on foot (`vehicle === null`).
  - `export class RouteRun` (pure, one per route): `constructor(track: Track)`; `update(dt: number, x: number, z: number,
    ok: boolean): boolean` returns true once when a run completes. Rules: the player is "on" the route when
    `track.locate(x, z, width / 2 + 4)` finds it (pass the last index as `hint`, window 60). A run starts when the
    player is on the route, `ok` is true and within 25 m of either end (s < 25 or s > length - 25); it remembers which
    end. It fails (reset) when the player is off the route for more than 8 s, or `ok` is false for more than 3 s. It
    completes when the player, still in a run, gets within 25 m of the other end, having passed through at least 80 %
    of the route's length in 25 m buckets (count the distinct buckets of s visited). After completing, it resets.
  - `createRouteProgress(scene, world, deps)`: one `RouteRun` per route in `ROUTE_IDS`; `update(dt, px, pz)` feeds each
    with `modeOk(kind, deps.vehicleKind())`; on completion `deps.toast(\`${def.name}: end to end!\`, 4000)` and
    `deps.unlock(ROUTE_ACHIEVEMENTS[id])`. `blips()` returns, for every route, one blip at its first sample and one at
    its last: `{ x, z, color, label }` with `color` '#c9a227' for roads, '#9a7a52' for the track, '#7a5a3a' for the
    trail, and `label` = the route's name with its first letter in upper case (e.g. "The Brim Gap Road"). Build the blip
    list once (lazily on the first call), not every frame.
- New test `src/mountainRoutes/progress.test.ts`: `modeOk` cases (a car on a road ok, a plane not, on foot only for the
  trail, the 'dirt-bike' ok on the track and a 'hoa-van' not); `RouteRun` on `ROUTES['spine-cut']`: feeding the samples
  start to end at 10 m/s with ok=true completes exactly once; end to start completes too; a run that jumps from the
  start straight to the end (skipping the middle) does not complete; a run with ok=false throughout does not.

## Contract
`createRouteProgress(scene, world, deps): Area` (signature unchanged; index.ts calls it). Achievement ids as above (they
are added to the achievements catalog by another worker).

## Done when
- `npx vitest run src/mountainRoutes/progress.test.ts` passes.
- `npx tsc --noEmit -p .` clean in your files.

## Out of scope
Every other file under `src/mountainRoutes/`, `app.ts`, the achievements package.
