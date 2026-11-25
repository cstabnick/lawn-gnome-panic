Epic: E19-B (courts and skate park: runtimes and quests)
Depends on: E19-A (every skate/ module, sports/save.ts, sports/sounds.ts)
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own
`games/gnome-theft-auto/src/skate/runtime.ts` (a stub: keep its exports and signatures) and the new
`skate/runtime.test.ts`. Others write `court/runtime.ts` and the quests at the same time. app.ts already installs it
(`installSkate`), steps a player-ridden board in the vehicle slot with `skate.stepRider(v, inp, dt, rawInp)` when
`drives(v)`, holds back fire/aim/reload/gun switching while `riding()`, calls `update(dt, rawInp)`,
`prompt`/`interact`, `blips`, and has `?skate=board|<line id>` dev params: do not edit app.ts (report a needed change).
The vehicle kind 'skateboard' exists (config.ts: prefab 'gta-skateboard', mountStyle 'hop', stand: true).

## Goal
The Gutter Bowls work and the skateboard rides anywhere sensible: the park and its life are built; at the Board
Library the player gets a board of their own (kept in the bag; "Use" drops it and rides) or borrows one; riding uses
the board controller with tricks and combos scored like Aether Board; Fennel's lines run by themselves when you ride
through their first chalk mark; bests, ollies and full rails are saved; achievements unlock; story quests get the
`SkateApi`. Getting off stows your own board.

## Read first
- `games/gnome-theft-auto/src/skate/types.ts` (all) and `skate/runtime.ts` (the stub, `SkateDeps`).
- The modules you wire: `skate/park.ts` (`skateGround`, `parkBoxes`, `parkHeight`), `skate/board.ts` (`newBoard`,
  `stepBoard`, `boardSpeed`), `skate/score.ts` (`createSkateScore`), `skate/lines.ts` (`newLineRun`, `stepLineRun`,
  `abortLineRun`, `lineById`), `skate/hud.ts` (`createSkateHud`, `createSkateInputReader`), `skate/build.ts`
  (`buildGutterBowls`), `skate/life.ts` (`buildSkateLife`), `sports/save.ts` (`sportsStore`: use this shared store),
  `sports/sounds.ts` (`registerSportsSounds`).
- `games/gnome-theft-auto/src/winter/runtime.ts` (all) and `winter/runtime.test.ts`: the model for a ridden vehicle
  kind stepped by its own physics (spawning, `seatPlayer`, `stepRider` with `v.sim = undefined`, `writeBack` with
  `syncVehicleMesh` and `tiltOf`, cleaning up loose rides, the fake deps in the test).
- `games/gnome-theft-auto/src/inventory.ts` (`registerItem`, `itemDef`, `addItem`, `count`, `onItemUse`) and
  `winter/winterApp.ts` `registerWinterItems`; `src/collide.ts` (`sweepCircleBoxes`, `wallBounce`, `clampToWorld`);
  `src/sound/bus.ts` `playAt`; `JobsDeps` in `src/jobs/types.ts` (`seatPlayer`, `throwPlayer`, `unlock`, `hud.toast`).

## Change
`src/skate/runtime.ts` `installSkate(deps, opts)`:
- At install: `store = sportsStore(opts?.storage)`, `registerSportsSounds()`, build and life into the scene, push
  `parkBoxes()`, the build's and the life's boxes into `deps.world.boxes`; HUD in `deps.ui`; `ground =
  skateGround()`; register the inventory item `SKATEBOARD_ITEM` (name 'Skateboard', prefab 'gta-skateboard', kind
  'tool', blurb "A wooden board on four wheels. Grass stops it. The Hat Watch pretends it is not there.") and
  `onItemUse` -> `dropBoard()` (toast the reason when it refuses).
- Boards are vehicles of kind 'skateboard' (`createVehicle`, pushed into `deps.vehicles`). At most 4 loose ones;
  unridden boards farther than 300 m from the player are removed. Per ridden board keep a `BoardState`
  (`newBoard(v.x, v.z, v.yaw, ground)` on first step).
- `stepRider(v, inp, dt, raw)`: `v.sim = undefined`; `si = reader.read(inp, raw, hud.touch())`; `events =
  stepBoard(b, si, ground, dt)`; collide with `deps.world.boxes` at the board's height (`sweepCircleBoxes(prevX, prevZ,
  b.x, b.z, 0.3, boxes, b.y + 0.05)`: the park's own boxes never reach above its surface, so only real walls stop the
  board; on a push-out kill the velocity into the wall with `wallBounce`), `clampToWorld`; write back to the vehicle
  (x, y, z, yaw, speed, `syncVehicleMesh`, tilt to the ground normal plus `lean`). Feed every event to the score
  (`score.event`) and tick it; events: `pop` ollie -> `store.recordOllie()` and `deps.unlock(SKATE_ACH.firstOllie)`;
  `fullRail` -> `store.recordFullRail()`, `unlock(SKATE_ACH.fullRail)`, toast 'End to end.'; `bail` ->
  `deps.throwPlayer(v, b.vx, 2.5, b.vz)` (the board stays where it is, empty), sound 'skate-bail'. Sounds with
  `playAt`: 'skate-pop' on pops, 'skate-land' on lands (param = impact / 6 clamped), 'skate-grind' while grinding
  (every 0.45 s), 'skate-push' on push, 'skate-roll' every 0.4 s while rolling faster than 1 m/s on the ground (param =
  speed / 12). `score.takeBanked()`: tricks >= 5 -> `unlock(SKATE_ACH.fiveCombo)`; `store.recordCombo(points)` true ->
  toast `New best combo: ${points}`.
- Lines: while riding inside `SKATE_SITE` keep one `LineRun` per line; `stepLineRun` each frame; a run that has
  started shows on the HUD (`setLine`: name, gate n/m (1-based), time); 'done' -> `store.recordLine(id, time)`, toast
  `${name}: ${time.toFixed(1)} s` (+ ' - best!' when new), listeners; 'fail' -> HUD line clears after 2 s; finished or
  failed runs restart fresh. Leaving the board aborts running runs.
- Owned board: `giveBoard()` sets `store.setBoardOwned()` and `addItem(SKATEBOARD_ITEM)` when the bag has none;
  `dropBoard()` refuses with `deps.blocked()`, 'Get off first.' in another vehicle, 'You have no board yet. The Board
  Library at the Gutter Bowls has one.' when not owned, 'Too steep or wet here.' in water; else spawns the board at the
  player's feet facing their yaw and `deps.seatPlayer(v)`. When the player leaves their own board (`deps.player.vehicle`
  no longer it), remove it (it goes back in the bag) with a quiet toast once: 'Board under your arm.'
- Prompts (on foot, within `SKATE_RANGE` of `BOARD_LIBRARY`): not owned -> 'Take a board (the Board Library)'; owned
  -> 'Borrow a board'. Interact: not owned -> `giveBoard()`, Fennel's toast "Fennel: 'Take one, leave one. You can
  leave one later.'", then `dropBoard()`; owned -> spawn a library board (not stowed on leaving) and seat the player.
- `startLine(id)`: refuse when blocked or farther than 300 m from the park ('The Gutter Bowls are in Founders' Green,
  Downtown Turfton.'); else put the player on a board 4 m before the line's first gate, facing it (in a board they own
  or a library one), arm that line's run.
- `riding()`: the player drives a 'skateboard'. `update(dt, raw)`: life (`playerRiding` = riding inside the site),
  HUD shown while riding (`setCombo(score.view(), b.t)`, `setInfo` with km/h and the best combo), cleanup.
  `blips()`: one 'skate' place blip ('The Gutter Bowls', `PLACE_STYLE.skate.color` from `../mapIcons`) and the Board
  Library is the same place. `debug()`: { riding, mode, speed, combo, line, save }.

`src/skate/runtime.test.ts` (fake deps like winter/runtime.test.ts): install pushes colliders; interact at the Board
Library with no board gives the item and seats the player on a 'skateboard'; 120 `stepRider` frames with push forward
move the board north-to-south along the park's open ground and `riding()` is true; an ollie input produces a saved
ollie; `startLine('first-push')` puts the player on a board near the first gate; leaving the owned board removes it.

## Contract
The stub's exports and signatures, unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- With a dev server on port 5323 (`cd games/gnome-theft-auto && npx vite --port 5323`, background; stop it after):
  `node tools/gta-shots.mjs "http://localhost:5323/?offline&no-intro" <scratch dir> bowls:-30,66,0 gutter:-48,102,1.57`
  and `"http://localhost:5323/?offline&no-intro&skate=board"` after 6 s; look at the PNGs (the park surfaces match the
  rails and props, a gnome standing on a board). Report what you saw.

## Out of scope
Every other file (report needed changes instead).
