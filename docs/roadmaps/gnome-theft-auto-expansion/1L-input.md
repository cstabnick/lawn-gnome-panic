Epic: 1 (Modules), issue 1L: reload and parachute controls (input.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Reload works on keyboard (R) and touch (a Reload button); the touch Fire button is labelled Fire; the new 'chute' mode shows the on-foot buttons without Jump.

## Read first
- games/gnome-theft-auto/src/input.ts: the whole file (keyboard handlers, `s` state and its edge flags, touch buttons and `setMode`, `read`).
- games/gnome-theft-auto/src/types.ts: `InputState` (now has `reload: boolean`, an edge flag), `CameraMode` (now includes 'chute'), `Input`.

## Change
- games/gnome-theft-auto/src/input.ts:
  - `s.reload` is set on `KeyR` keydown (edge, ignoring key repeat like the other edge keys) and by a touch Reload button; `read()` returns `reload: s.reload` and clears it after the read (as `jump` and `enterExit` are).
  - Touch: add a Reload button next to Swap, at least 44 x 44 px, shown in modes 'foot' and 'drive'. The button that fires is labelled "Fire" (was "Squirt"). `setMode('chute')`: show the same buttons as 'foot' but hide Jump. `setMode('fly')` keeps Up, Down, Fire, Exit (planes use Up/Down as pull-up and push-down, and the on-screen stick for throttle and steering). Exit's label stays controlled by `setEnterLabel`.
  - Keep all existing mouse, keyboard and touch behaviour.
  - Fire stays on left mouse and F; tap the Fire button on touch.

## Contract
`createInput(canvas, ui): Input` with `read()`, `setMode(mode: CameraMode)`, `setEnterLabel(label: string | null)`. `InputState` as in types.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in input.ts.

## Out of scope
types.ts, config.ts, main.ts, hud.ts, every other file.
