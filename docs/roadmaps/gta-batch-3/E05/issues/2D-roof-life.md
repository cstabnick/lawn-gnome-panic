Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto`. Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
Keep LF line endings. Do not commit. Other workers are editing other files at the same time; only change the files
listed under Change and keep the exported signatures.

## Goal
`src/interiors/roofLife.ts` notices when the player lands an aircraft on a rooftop and when they stand on a roof, and
drives the two rooftop achievements.

## Read first
- `games/gnome-theft-auto/src/interiors/roofLife.ts`: the stub (keep `RoofLifeDeps`, `RoofLife`, `createRoofLife`).
- `games/gnome-theft-auto/src/interiors/rooftops.ts`: `rooftopAt(x, z, y, tol)` returns the `Rooftop` (`id`, `name?`, `y`) a body stands on.
- `games/gnome-theft-auto/src/types.ts`: `Player` (`x, y, z, vehicle, airborne`) and `Vehicle` (`x, y, z, speed, driver, spec.air, air`).
- `games/gnome-theft-auto/src/craft/model.ts`: the air state type on `vehicle.air` (find its `airborne` flag: true while flying, false when on a floor).

## Change
- `games/gnome-theft-auto/src/interiors/roofLife.ts`, `update(dt)`:
  - Landing: when `player.vehicle` has `spec.air`, `driver === 'player'`, `vehicle.air` exists and is not airborne,
    `Math.abs(vehicle.speed) < 3`, and `rooftopAt(v.x, v.z, v.y, 0.8)` is a roof with `y > 3`: once per roof id per
    session (a `Set`), `deps.unlock('gta-roof-rat')` and `deps.hud.toast(`Touched down on ${roof.name ?? 'a rooftop'}.`)`.
  - On foot: when `!player.vehicle && !player.airborne` and `rooftopAt(player.x, player.z, player.y, 0.6)` is a roof with
    `y > 3` whose id is not yet in the visited set: add it, save the set to `localStorage['gta-roofs-visited-v1']` as a
    JSON array (wrap every localStorage read and write in try/catch; tests have none), `deps.increment('gta-rooftop-run', 1)`,
    and toast `Rooftop: ${roof.name}` when the roof has a name. Load the saved set in `createRoofLife`.
  - Check at most 4 times a second (accumulate dt) to keep it cheap.
- `games/gnome-theft-auto/src/interiors/roofLife.test.ts` (new, vitest): `clearRooftops()`, `addRooftop` one roof
  `{ id: 'r1', name: 'Test Roof', minX: 0, maxX: 10, minZ: 0, maxZ: 10, y: 20, solid: true, parapet: true }`, a fake
  player object on foot at (5, 20, 5): after `update(0.3)` increment was called once with 'gta-rooftop-run'; again: not
  twice. A fake landed aircraft (`vehicle: { spec: { air: {} }, driver: 'player', air: { airborne: false }, speed: 0, x: 5, y: 20, z: 5 }`, cast `as never`) unlocks 'gta-roof-rat' once.

## Contract
Achievement ids (catalog added by another worker): `gta-roof-rat` (unlock), `gta-rooftop-run` (increment, target 5).
Save key: `gta-roofs-visited-v1` (localStorage, per device).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/interiors/roofLife.test.ts` passes.

## Out of scope
rooftops.ts, rooftopsBuild.ts, runtime.ts, kit.ts, app.ts, packages/*.
