Epic: E19-B (courts and skate park: runtimes and quests)
Depends on: E19-A (every court/ module, sports/save.ts, sports/sounds.ts, sports/app.ts)
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own
`games/gnome-theft-auto/src/court/runtime.ts` (a stub: keep its exports and signatures) and the new
`court/runtime.test.ts`. Others write `skate/runtime.ts` and the quests at the same time. app.ts already installs the
court (`installCourt`), freezes the gnome's controls while `inputMode()` is 'game', holds back fire/aim/jump/gun
switching in 'shootaround', calls `update(dt, rawInp)`, `applyCamera(dt)`, `prompt`/`interact`, `blips`, and has
`?court=game|swish|shoot` dev params: do not edit app.ts (if it truly needs a change, say so in your report).

## Goal
Drainpipe Court works in the game: the court and its life are built; at the chalk scoreboard the player starts a
2v2 pickup game with Pansy against two regulars (to 11); once they have won one, Swish takes a challenge (to 7);
at the ball cage they take a ball for a shootaround; games and makes are saved, achievements unlock, wins pay Acorns,
and story quests get the `CourtApi`.

## Read first
- `games/gnome-theft-auto/src/court/types.ts` (all) and `court/runtime.ts` (the stub, `CourtDeps`).
- The modules you wire (read their exports and doc comments): `court/game.ts` (`newPickup`, `stepPickup`,
  `pickupView`, `pickupResult`, `disposePickup`), `court/shootaround.ts` (`newShoot`, `stepShoot`, `ballAt`),
  `court/hud.ts` (`createCourtHud`, `courtControl`), `court/render.ts` (`createCourtRender`), `court/view.ts`
  (`createCourtView`), `court/build.ts` (`buildDrainpipeCourt`), `court/life.ts` (`buildCourtLife`),
  `sports/save.ts` (`sportsStore` — use this shared store, not `createSportsStore` directly), `sports/sounds.ts`
  (`registerSportsSounds`), `sports/app.ts` (`registerFoundersApp`), `skate/runtime.ts` (`skateApi`).
- `games/gnome-theft-auto/src/golf/runtime.ts` (all) and `golf/runtime.test.ts`: the model (install, prompts, a mode
  that holds the gnome, `putPlayer`, the HUD, the camera, blips, the API with listeners, the fake deps in the test).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps` (`economy.earn(n, reason)`, `unlock`, `hud.toast`, `player`
  with `model.object`, `blocked()`), `src/sound/bus.ts` `playAt(id, { x, z }, opts)`, `@lawn/gnome` `getMyGnome()`.

## Change
`src/court/runtime.ts` `installCourt(deps, opts)`:
- At install: `store = sportsStore(opts?.storage)`, `registerSportsSounds()`, build and life into `deps.scene`, push
  their boxes into `deps.world.boxes`, create the HUD (in `deps.ui`), the render (player look: `getMyGnome()?.look`
  merged over the game's default look) and the view (`deps.camera`), `registerFoundersApp({ store: () => store,
  court: () => api, skate: () => skateApi(), toast })`.
- Prompts (on foot via `deps.onFoot()`, within `COURT_RANGE`): SCOREBOARD -> 'Pickup game with Pansy (to 11)';
  Cardoon's spot (when no game is on and `store.data().jam.wins >= 1`) -> 'Challenge Swish and Lintel (to 7)';
  BALL_CAGE -> 'Take a ball (shootaround)' or, during one, 'Put the ball back'.
- `startGame(opts)`: refuse with `deps.blocked()`'s reason, 'Get out first.' in a vehicle, or 'Drainpipe Court is in
  Founders' Green, Downtown Turfton.' when farther than 60 m from COURT; target default `PICKUP.target`, but
  opponents 'swish' default `PICKUP.questTarget`. Hide the player's model (`deps.player.model.object.visible = false`,
  every frame while playing), HUD 'game', life gameOn. Each frame: `courtControl(inp, hud.touch(), prevShoot)` ->
  `stepPickup`; keep the player's position on their gnome (slot 0) like golf's `putPlayer`; `render.game(view)`;
  `hud.setGame(view, names)` ('You & Pansy' / 'Swish & Lintel' or the regulars' names).
  Events: 'sound' -> `playAt`; 'score' byPlayer -> `life.cheer()`, a three -> `deps.unlock(COURT_ACH.three)` and
  count it, a dunk -> `deps.unlock(COURT_ACH.dunk)` and count it; 'end' -> `store.recordGame({ won, margin,
  threes, dunks, swish })`, won -> `unlock(COURT_ACH.win)` and `economy.earn(PICKUP.winAcorns or swishAcorns,
  'Drainpipe Court')`; a result card (won vs regulars: "You and Pansy win 11-7. Old Burdock chalks it up."; won vs
  Swish: "You beat Swish 7-5. He gives the stake back. He asked properly."; lost: "Swish keeps the court. Bring a
  spare."); tell `onGame` listeners; after the card is closed or 5 s, end the game (show the player's model at their
  gnome's spot, HUD none, `render.game(null)`, life gameOn false). Quit (HUD QUIT, or `inp.enterExit`): end with no
  record.
- `startShootaround()`: same refusals (60 m); HUD 'shootaround'; each frame `stepShoot(s, dt, inp.fire ||
  touch.shootHeld, px, pz, groundY, Math.random())`, `render.ball(ballAt(...))`; 'release' -> 'jam-bounce';
  'make' -> `store.recordShootMake()`, sound 'jam-swish' then 'jam-drainpipe' (the ball goes down the drainpipe), a
  three -> `unlock(COURT_ACH.three)`; 'miss' -> 'jam-clang'. Ends when the player walks farther than `SHOOT.leaveRange`
  from BALL_CAGE, gets in a vehicle, or presses QUIT / 'Put the ball back'.
- `inputMode()`, `applyCamera(dt)` (`view.apply(dt, game ? view : null)`), `blips()` (one 'court' place blip at COURT,
  label 'Drainpipe Court', colour `PLACE_STYLE.court.color` from `../mapIcons`), `update` also runs
  `life.update(dt, t, px, pz, !!game)`, `debug()` ({ mode, score, target, save }).
- The CourtApi per the types; `courtApi()` returns it.

`src/court/runtime.test.ts` (fake deps like golf/runtime.test.ts): install pushes colliders; `startGame` refuses far
away and starts at the court (inputMode 'game'); 600 update frames with idle input do not throw; `quitGame` returns to
'none' and the player model is visible again; a forced end (step until the game ends, or a short target like
`{ target: 2 }` with a scripted shooting input) records a game in the store; a shootaround release counts a shot.

## Contract
The stub's exports and signatures, unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- With a dev server on port 5322 (`cd games/gnome-theft-auto && npx vite --port 5322`, background; stop it after):
  `node tools/gta-shots.mjs "http://localhost:5322/?offline&no-intro" <scratch dir> court:-90,46,3.14 hoop:-76,30,-1.57`
  and `"http://localhost:5322/?offline&no-intro&court=game"` once more after 6 s; look at the PNGs (the court, the
  hoops on the rims, a game in progress with the broadcast camera). Report what you saw.

## Out of scope
Every other file (report needed changes instead).
