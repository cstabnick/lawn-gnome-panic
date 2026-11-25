Epic: E07 step 1 · Issue 04 remember where the player stood (L70)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, rules).

## Goal
Closing the tab and coming back puts the gnome where it last stood (on foot), including back inside the room it was
in, instead of at the start spawn. A saved spot that is now underwater, off the map or otherwise bad falls back to the
spawn. The key `gta-position-v1` is already in `GTA_SAVE_KEYS` and the cloud merge (newer side wins): do not edit
`saveIO.ts` or `cloudSave.ts`.

## Read first
- `games/gnome-theft-auto/src/app.ts`: line ~290 `player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw);
  chase.yaw = world.spawn.yaw;` (start spawn); line ~934 `const interiors = createInteriors({...})`; lines ~2390-2500
  the `startParams` block (`?mount`, `?at=x,z,yaw` at ~2485 which calls `player.respawn(...)`, `?interior=<id>` at
  ~2492 which calls `interiors.enter(id)` after `setTimeout(..., 800)`). The player object has `x, y, z, yaw, vehicle`
  (`vehicle` is null on foot; a vehicle has `x, z, yaw` too).
- `games/gnome-theft-auto/src/interiors/runtime.ts` (`currentInterior(): string | null`, `enterInterior(id): boolean`)
  and `src/interiors/registry.ts` (`interiorById(id)` -> `PlacedInterior` with `def.door.{x,z}`, and the off-map pocket
  coordinates: interiors live at x >= `INTERIOR_MIN_X` (`src/interiors/space.ts`, `isInteriorPoint(x)`)).
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)` and `waterAt(x, z)` (returns a hit or null).
- `games/gnome-theft-auto/src/config.ts`: `WORLD_HALF` (the world is now 1800 half-size).

## Change
- New `games/gnome-theft-auto/src/positionSave.ts` (pure where possible, storage passed in for tests):
  ```ts
  export const POSITION_KEY = 'gta-position-v1';
  export interface SavedPosition { v: 1; x: number; z: number; yaw: number; interior?: string; t: number }
  export function encodePosition(p: Omit<SavedPosition, 'v' | 't'>, now?: number): string;
  export function decodePosition(raw: string | null): SavedPosition | null;   // null on bad JSON / non-finite numbers
  /** Where to start: the saved spot if it is fine, else null (the caller uses world.spawn). */
  export function validatePosition(p: SavedPosition | null, w: {
    half: number; isWater(x: number, z: number): boolean; interiorExists(id: string): boolean;
  }): SavedPosition | null;
  export function readPosition(storage?: Pick<Storage, 'getItem'>): SavedPosition | null;
  export function writePosition(p: Omit<SavedPosition, 'v' | 't'>, storage?: Pick<Storage, 'setItem'>): void;
  ```
  Rules for `validatePosition`: |x|, |z| within `half - 5`; not water (`isWater`); an `interior` id must still exist
  (if not, drop the interior and keep x/z only when they are on the map). x/z saved are always outdoor coordinates:
  when inside an interior, save the interior's door (`def.door.x/z`) plus `interior: id`.
  Wrap storage in try/catch. `writePosition` also calls `notifySaveChanged()` from `./saveHook` so the cloud save sees
  it (check that export exists; it does: `export function notifySaveChanged(): void`).
- New `games/gnome-theft-auto/src/positionSave.test.ts`: encode/decode round trip, bad JSON, non-finite values,
  out-of-bounds, water, missing interior (drops interior, keeps an on-map door spot), good interior kept.
- `games/gnome-theft-auto/src/app.ts` (small, additive):
  1. Restore, placed just before the `?at=` block (~2485) so dev params still win: skip entirely when the URL has any
     of `mount`, `mountat`, `at`, `interior`, `gunshop`, `cutscene`, `briefing`, `herd`, `pileup`, `mountdemo`, a room or
     party join parameter (grep `online/` for how a room code arrives, e.g. `?room=` / `#party`), or when
     `localStorage 'gta-intro-seen-v1'` is not `'1'` (first start: the intro tour runs at the spawn). Otherwise
     `const saved = validatePosition(readPosition(), { half: WORLD_HALF, isWater: (x, z) => !!waterAt(x, z), interiorExists: (id) => !!interiorById(id) })`;
     if set: `player.respawn(saved.x, saved.z, saved.yaw); chase.yaw = saved.yaw;` and if `saved.interior`,
     `setTimeout(() => interiors.enter(saved.interior!), 800)` (same pattern as `?interior=`).
  2. Saving: every 5 s (a `setInterval`), and on `pagehide` and on `visibilitychange` to hidden, write the current spot
     when the game is in a normal state: not in a cutscene (`cutscene.active`), not during the intro tour
     (`introTour.active`), player alive (the death timer `deathT <= 0`; grep its name). Spot: in a vehicle -> the
     vehicle's x/z/yaw (the gnome starts on foot beside where it parked); inside an interior (`currentInterior()` from
     `./interiors/runtime` or the `interiors` object, read what it offers) -> the door of that interior plus
     `interior: id`; otherwise `player.x/z/yaw`. Skip the write when nothing moved more than 1 m since the last write.
  Do not restore into a vehicle; do not touch the online spawn code.

## Contract
`gta-position-v1` = `{ v: 1, x, z, yaw, interior?, t }` (JSON). `readPosition`, `writePosition`, `validatePosition`.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .` and `npx vitest run src/positionSave.test.ts src/saveIO.test.ts`
  pass.
- `git diff --stat src/app.ts` is a small additive change (about 30-50 lines), no whole-file rewrite.

## Out of scope
`src/saveIO.ts`, `src/cloudSave.ts`, `src/online/*`, `src/interiors/*`, `src/gnomlet/*`, every other file.
