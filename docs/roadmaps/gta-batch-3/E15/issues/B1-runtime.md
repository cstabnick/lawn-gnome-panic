Epic: E15-B (Hedgeworth Links, runtime)
Depends on: E15-A (round, save, HUD, view, yard, buildings, life, sounds exist)
Agent: general-purpose (Sonnet): the integration of every golf module into one runtime

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/runtime.ts` makes Hedgeworth playable: breaking through the Kicked Board, two golf
carts at the shelter, rustling through giant plants, a full round of golf from any tee (address, aim, clubs, swing,
flight, holing out, next hole, scorecard) with keyboard, gamepad and touch, lost balls and molehills for the side
quests, character intro cards, map blips, achievements and the save.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts` (all), `course.ts` (exports), and the exported signatures of
  `round.ts`, `save.ts`, `hud.ts`, `view.ts`, `yard.ts`, `greens.ts`, `clubhouse.ts`, `life.ts`, `sounds.ts`, `golfApp.ts`.
- `games/gnome-theft-auto/src/golf/runtime.ts`: the current integrator (it already builds the scenery, pushes the
  colliders and registers the app and the interior; keep that and keep `GolfDeps`, `GolfOpts`, `golfApi`, `installGolf`).
- `games/gnome-theft-auto/src/app.ts`: search `golf` (install with `jobDeps`, `camera`, `onFoot`; the prompt/interact
  chain; `golf.addressing()` zeroes the gnome's movement and E; `golf.update(dt, rawInp)`; `golf.applyCamera(dt)` after
  the chase camera; `golf.blips()`; `?golf=N`). You do not need to edit app.ts.
- `games/gnome-theft-auto/src/winter/runtime.ts` lines 190-330 and 530-673: the model (spawning ride vehicles with
  `createVehicle`, `deps.vehicles`, prompts/interact, a HUD with buttons, toasts, `deps.unlock` / `deps.increment`,
  blips, an api object, `debug()`).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps` (scene, ui, world, hud, player, vehicles, play, unlock,
  increment, blocked, seatPlayer...).
- `games/gnome-theft-auto/src/types.ts`: `InputState` (moveX, moveY, jump, fire, ...), `Blip`, `Vehicle` (`kind`,
  `speed`, `driver`), `Player` (x, z, y, yaw, vehicle).
- `games/gnome-theft-auto/src/mapIcons.ts`: `PoiKind`, `PLACE_STYLE` and the glyph switch (E12 added `ski`).
- `games/gnome-theft-auto/src/cutscene/introCard.ts` `showCharacterIntro` and `cutscene/castIntros.ts` `CAST_INTROS`
  (`peony`, `basil`, `thrift`).
- `games/gnome-theft-auto/src/sound/bus.ts` `playAt(id, pos)`.

## Change
`src/golf/runtime.ts` (and `src/mapIcons.ts` for one new place kind, plus `src/types.ts` only if `Blip.kind` must list it):
- **State**: the store, scenery (as now), `hud = createGolfHud(deps.ui)`, `view = createGolfView(deps.scene, deps.camera)`,
  `round: RoundState | null`, a seed counter (`Date.now() & 0xffff` at install, +1 per round).
- **The Kicked Board** (while `!store.data().boardBroken`): the player's own driven vehicle whose centre comes within
  its radius + 0.8 m of `boardBox` at `|speed| >= BOARD_BREAK_SPEED` breaks it; on foot within `BOARD_KICK_RANGE` of
  `KICKED_BOARD` (either side) the prompt is "Kick the loose board" and E breaks it. Breaking: splice `yard.boardBox`
  out of `deps.world.boxes` (splice only: the box grid rebuilds when the count changes), `yard.breakBoard()`,
  `store.breakBoard()`, `playAt('board-crack', KICKED_BOARD)`, `deps.unlock(GOLF_ACH.kickedBoard)`, toast "The Kicked
  Board gives. Welcome to Hedgeworth." `api.breakBoard()` does the same (no toast needed). Also check each frame whether
  `createGolfStore` data read fresh says broken (the quest sim may break it through the save): cheap check once per second.
- **Carts**: at install, a `golf-cart` vehicle at each `CART_SPOTS` (`createVehicle(deps.scene, 'golf-cart', x, z, yaw)`,
  `v.y = heightAt(x, z)`, push into `deps.vehicles`); every 20 s, if one of ours is gone from `deps.vehicles` or is more
  than 400 m from the yard with nobody in it, and the player is more than 80 m from its spot, put a fresh one back.
- **Soft plants**: while the player drives through a `yard.soft` circle, `v.speed *= Math.exp(-SOFT_SLOW_PER_S * dt)`
  and `playAt('hedge-rustle', ...)` at most once per 0.8 s.
- **Through the Hedge**: the player driving a `golf-cart` who passes within 2 m of a `HEDGE_ARCHES` point and crosses the
  hedge line there (sign of the side changes between frames) unlocks `GOLF_ACH.arch`.
- **Intro cards**: the first time per session the player on foot comes within 8 m of a regular's `PEOPLE_SPOTS`, show
  `showCharacterIntro(CAST_INTROS[key])` (skip when a round is in 'aim'/'swing'/'flight').
- **Lost balls and molehills**: a `golf-ball` prefab (scaled ~0.18 m) at every `LOST_BALLS` spot not yet in
  `store.data().ballsFound`, and a `mole-hill` prefab at every `MOLEHILLS` spot not in `molehills` (guard with
  `getPrefab`). On foot within `PICK_RANGE`: prompt "Pick up the lost ball" / "Pat the molehill flat"; E: `findBall(id)`
  -> hide it, toast `Lost ball (${n}/${LOST_BALLS.length})`; `flattenMolehill(id)` -> hide it,
  `deps.increment(GOLF_ACH.secret)`, toast a Thrift line ("Thrift (whispering): 'Gently. They're asleep.'").
- **A round**:
  - `api.startRound(hole = 0)`: refuse with a reason when `deps.blocked()` says so, when the player is in a vehicle
    ("Get out of the cart first."), more than 300 m from `GOLF_ORIGIN` ("Too far from Hedgeworth."), or outside the
    fence while the Kicked Board still stands ("The fence is in the way. Find the loose board."). Else
    `round = newRound(seed, hole)`, put the player 1.5 m behind the tee (opposite the aim) facing the aim, `hud.show(true)`.
  - On foot without a round, within 4 m of a hole's tee: prompt `Tee off: hole ${number} (par ${par})`; E starts a round
    there. In 'walk' within 2.5 m of the ball: prompt "Address the ball"; E -> `addressBall`, then place the player 0.6 m
    to the left of the ball (left of the aim) facing the aim (`deps.player.x/z/yaw`; keep it there every frame while
    addressing, y from `heightAt`).
  - Input each frame while addressing ('aim'): `turnAim(round, -inp.moveX, dt)` (stick/keys right turns right) plus the
    HUD's held aim buttons; club: an edge of `inp.moveY` past 0.6 -> `cycleClub(-1)` (up = longer club), past -0.6 ->
    `cycleClub(+1)`; swing: a rising edge of `inp.jump` or `inp.fire` -> `tapSwing`. In 'swing' the same edges tap.
    HUD actions: swing, aim-left/right/stop, club-prev/next, card (toggle the card), card-close, next-hole
    (`nextHole`), to-ball (put the player 1.5 m behind the ball facing the pin; if the player is driving, move the
    vehicle there instead), quit (`api.quitRound()`).
  - `tickRound(round, dt)` every frame; handle every `RoundEvent`: shot -> `playAt(club === 'PT' ? 'golf-putt' : 'golf-tock', ball)`;
    water -> 'golf-splash-reed'; holed -> 'golf-cup', `store.recordHole(hole, strokes, par)`, `deps.unlock(GOLF_ACH.ace)`
    when strokes 1, `deps.unlock(GOLF_ACH.birdies)` when `round.birdieRun >= 2`, notify `onHole` listeners, show the card;
    picked-up -> card; round-done -> `store.recordRound(total)`, `deps.unlock(GOLF_ACH.card)`, the final card.
  - `hud.set(hudView(round, atBall))` every frame, `view.update(dt, round)` (and `view.update(dt, null)` without a
    round). `addressing()` is true in 'aim', 'swing', 'flight'. `applyCamera(dt)` = `view.applyCamera(round, dt)`.
  - Auto quit (toast "Round abandoned.") when the player is more than 60 m outside the yard, dies, or gets in a vehicle
    other than a golf cart. `quitRound()` hides the HUD and the view, round = null.
- **Blips**: always a place blip for the course at the clubhouse (`kind: 'golf'`, label 'Hedgeworth Links'): add `golf`
  to mapIcons.ts `PoiKind`, `PLACE_STYLE` (`{ name: 'Hedgeworth Links (golf)', color: '#4caf50' }`) and a flag glyph in
  its draw switch like `ski`, and to `Blip.kind` in types.ts if the union needs it. In a round: an objective-style blip
  on the ball while 'walk' and on the pin of the current hole.
- `api.onHole(cb)` returns an unsubscribe; `api.inRound()`; `api.store()`. `golfApi()` returns the api.
- `debug()`: `{ round, store: store.data(), boardBroken, carts: n }`.
- New `src/golf/runtime.test.ts` (fake DOM, like `winter/runtime.test.ts`: build the deps from the minimal fakes it uses,
  with `storage` from a Map): install; driving a fake player vehicle at 8 m/s into the board breaks it (boardBox gone
  from world.boxes, store says broken); `api.startRound(0)` with the player on foot at the first tee starts a round;
  `addressing()` after address; a full shot via `inp.jump` edges and ticks ends in 'walk' with strokes 1; `quitRound`.

## Contract
`installGolf(deps, opts): Golf` and `golfApi()` exactly; the `Golf` interface in types.ts. No new network messages:
rounds are single-player and local (others online see the golfer standing and the carts as ordinary vehicles).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf src/mapIcons.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
app.ts (already wired), the other golf modules (call them; if one is wrong, work round it and say so), quests.
