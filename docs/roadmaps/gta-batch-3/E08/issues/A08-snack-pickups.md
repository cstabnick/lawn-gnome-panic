# E08 issue A08-snack-pickups

Epic: E08-A (economy foundation, all issues parallel)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ae1f1ea613541daa4` (a git worktree: stay
  inside it, use absolute paths). The game is `games/gnome-theft-auto` (Vite + TypeScript + three.js); below, `src/`
  means `games/gnome-theft-auto/src/`. Git Bash: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: do not run `npm install`.
- About 15 other workers edit OTHER files of this game at the same time. Change only the files under "Change".
  Do not run `npm run build` (vite writes `dist/`); type-check with
  `npx tsc --noEmit -p games/gnome-theft-auto` from the repo root. Errors in files you do not own may show up
  mid-epic: ignore them, but your files must have none. Run only the test files named in "Done when"
  (`npx vitest run <file>` from `games/gnome-theft-auto`). Do not commit. Do not start a dev server.
- Repo rules that apply: mobile by default (every button at least 44 px, no hover-only UI, fits a 390x844 portrait
  phone, `env(safe-area-inset-*)` padding); a UI module appends its own container to the shared `#ui` element it is
  given and never restyles or hides `#ui`; item and vehicle icons come from `@lawn/prefabs`
  (`prefabIconElement(id, emojiFallback, px)` returns an element); plain, short English in UI text; no emoji
  variation selectors needed.

## Goal
Snack pickups lie in every park: an item's prefab bobbing and turning above the grass; walking through one puts it in
the bag; it comes back a while later as a new random item. (`src/app.ts` already calls `createPickups` and `update`.)

## Read first
- `src/bag/pickups.ts`: the stub (`PICKUP`, `PickupsDeps`, `Pickups`, `pickupSpots`, `createPickups`; keep them).
- `src/parks/blocks.ts`: `PARKS` (`{ id, name, x, z }`).
- `src/inventory.ts`: `itemDef(id)` (its `prefab` is the model).

## Change
- `src/bag/pickups.ts`:
  - `pickupSpots()`: one `{ x: p.x + 3, z: p.z }` per entry of `PARKS`.
  - `createPickups(deps)`: `rng = deps.rng ?? Math.random`. Weighted pick from `PICKUP.table` (skip ids whose
    `itemDef(id)` is missing or whose `getPrefab(def.prefab)` from `@lawn/prefabs` is undefined). One pickup per spot:
    a `THREE.Group` holding `buildPrefab(def.prefab)` scaled by `PICKUP.scale`, added to `deps.scene`, at
    `y = deps.groundAt(x, z) + PICKUP.lift` (cache the ground height). `update(dt, px, pz, onFoot)`: advance time;
    each visible pickup bobs `PICKUP.bob * Math.sin(t * 2π * PICKUP.bobHz + phase)` (phase from its index) and spins
    `PICKUP.spin` rad/s; if `onFoot` and the x/z distance to (px, pz) < `PICKUP.radius` and `deps.onPick(id)` is true:
    hide it (`visible = false`) and start a `PICKUP.respawnS` timer. When a timer runs out: remove the old model, pick
    a new item, build it, show it. If `onPick` returns false leave it.
  - Use `import * as THREE from 'three'` (value import) now that the module builds meshes.
- `src/bag/pickups.test.ts` (new, vitest): `pickupSpots()` has `PARKS.length` entries offset 3 m on x; with a fake
  scene (`new THREE.Scene()`), `groundAt: () => 0`, a fixed rng and an `onPick` that records ids: update with the player
  at a spot picks exactly one item and calls onPick once; a second update there does nothing; after
  `PICKUP.respawnS + 1` seconds of updates far away the pickup is visible again; `onFoot = false` never picks.
  (If `buildPrefab` needs WebGL in tests, it does not: other tests build prefabs in node.)

## Contract
`pickupSpots(): { x: number; z: number }[]`, `createPickups(deps: PickupsDeps): Pickups` as in the stub.

## Done when
- `npx vitest run src/bag/pickups.test.ts` passes (from `games/gnome-theft-auto`).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
Every other file.
