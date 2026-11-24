Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment and style.)

## Goal
The same bot plays quests in the live game in a browser: `?debug&questsim=<id>` runs that quest on screen with the bot
visibly driving and a HUD line showing what it is solving, and `window.__questSim` lets tools/quest-sim.mjs and the
Save Trainer run quests and read results.

## Read first
- `src/questSim/browser.ts`: the stub with the exact API (`QuestSimApi`, `mountQuestSim(ctx: TrainerCtx)`). Keep it.
- `src/questSim/types.ts` (`SimCtx`, `RunSession`, `SessionHost`, `SessionRecord`, `Cheats`, `ALL_CHEATS`,
  `CHEAT_IDS`, `QuestResult`), `src/questSim/runner.ts` (`runQuest(host, id, { cheats, variant, onStatus })`;
  `host.reopen` may be null), `src/questSim/harness.ts` (the headless SimCtx: copy its `shoot`, `bail`, `enter`,
  `exit`, `teleport`, `spawnVehicle`, squad tracking and economy recording, adapted to the live objects),
  `src/questSim/plans.ts` (`QUEST_PLANS`), `src/questSim/input.ts` (`setQuestSimInput`: the frame's input override,
  already wired into app.ts).
- `src/trainer/types.ts` (`TrainerCtx`: ui, scene, camera, world, player, vehicles, hud, economy, watch, quests, npcs,
  cutscene, emote, ...). app.ts calls `mountQuestSim(trainerCtx)` when the URL has `questsim`.
- `src/player.ts` `updateFoot`: walking goes along camYaw: forward `(sin φ, cos φ)`, right `(-cos φ, sin φ)`.
- `src/quests/quests.ts` `SAVE_KEY` ('gta-quests-v1'); `src/introTour.ts` (`'gta-intro-seen-v1'`: set it to skip the
  first-run tour; check what value it expects).

## Change
- `src/questSim/browser.ts` (fill in; keep every exported name and type):
  - A browser `RunSession` over the live game: `layer: 'browser'`; `world, player, vehicles, npcs, watch, quests,
    economy` from ctx; `squad` tracked by wrapping `ctx.watch.spawnSquad` / `despawnSquad` once at mount (like
    harness.ts); `record` filled by wrapping (once, at mount) `ctx.hud.toast`, `ctx.hud.banner`, `ctx.economy.earn`,
    `ctx.watch.addHeat`, and `ctx.cutscene.play` (record `req.script.id` / 'dialogue:...' / 'contract'); errors from
    `window` 'error' / 'unhandledrejection' while a run is going.
    - `now()`: seconds since the session opened (`performance.now()`). `step(dt = 1/30)`: await animation frames
      until at least `dt` seconds of real time passed (at least one frame); while `ctx.cutscene.active` and
      `cheats.skipCutscenes`, call `ctx.cutscene.skip()`; with `cheats.godMode` set `player.health = 1`; with
      `cheats.noHeat || cheats.noWanted` call `watch.clear()`; when `stop()` was called, throw
      `new SimFail('bot', 'stopped')`.
    - `drive(c)`: `setQuestSimInput(c ? { moveX: c.steer, moveY: c.throttle, lift: c.lift } : null)`.
    - `walk(w)`: camera yaw `φ = atan2(dir.x, dir.z)` from `ctx.camera.getWorldDirection(new THREE.Vector3())`; desired
      `θ = w.camYaw`; `setQuestSimInput({ moveX: Math.sin(φ - θ) * k, moveY: Math.cos(θ - φ) * k })` with k = 1 (moveX
      sign: check it against updateFoot's right vector and fix if reversed); null -> `setQuestSimInput(null)`.
    - `teleport`, `enter`, `exit`, `bail`, `shoot`, `spawnVehicle` (`createVehicle(ctx.scene, kind, x, z, yaw)` from
      '../vehicles' + `ctx.vehicles.push`), as in harness.ts. When teleporting a vehicle that has `v.sim`, set
      `v.sim = undefined` first (the sim-drive chassis would put it back).
    - `actions`: `emote(pair)`: `ctx.emote.play('wave')` (pair: find a social row id in `src/anim/` or log that pair
      emotes need a partner and use 'wave'); `setWheelOpen` / `setKitOpen`: dispatch the key events the game listens to
      (see `src/keys.ts` KEYS for the wheel and the kit; keydown on `window`, then keyup); `streetEventDone`,
      `storeInLockup`, `nearBanner`, `joinParty`: throw `new SimFail('blocked', '<what>: not scriptable in the browser layer yet')`.
  - `SessionHost` for the browser: `reopen: null`. `open(saves, cheats)`: if this page load was prepared for this run
    (see the pending flow below), resolve the session at once. Otherwise write the saves to
    `localStorage[SAVE_KEY]`, set the intro-seen key, store `{ questId, variant, cheats }` in
    `sessionStorage['gta-questsim-pending']`, `location.reload()`, and return a promise that never resolves.
  - `mountQuestSim(ctx)`: idempotent; installs the wrappers, a HUD line (a fixed `div` appended to `ctx.ui`: top
    centre, under the safe-area inset, pill, `pointer-events: none`, 13 px, shows `🤖 <status line>` while running,
    hidden otherwise), and `window.__questSim`:
    - `list()`: `Object.keys(QUEST_PLANS)`.
    - `run(id, { variant, cheats })`: `runQuest(host, id, { cheats: { ...ALL_CHEATS, ...cheats }, variant, onStatus })`;
      the result is appended to `sessionStorage['gta-questsim-results']` (JSON array) and resolves.
    - `status()`, `stop()`, `results()`, `queue(runs, cheats)` (queue kept in `sessionStorage['gta-questsim-queue']`;
      on mount, if a queue is waiting and nothing is pending, run its next entry).
    - On mount: if `sessionStorage['gta-questsim-pending']` exists, remove it and run it after 1.5 s. Else if the URL
      has `questsim=<id>` (non-empty) and `questsimRun=<token>` not yet in `sessionStorage['gta-questsim-tokens']`,
      remember the token and `run(id, { variant: questsimVariant, cheats: parse(questsimCheats) })` where
      `questsimCheats` is 'all' (default) | 'none' | a comma list of cheat ids to turn on.
- `src/questSim/browser.test.ts` (new, headless, small): the pure helpers you export for the above (the cheats parser
  `parseCheats(text): Cheats` and the walk mapping `walkInput(camYaw, cameraYaw): { moveX: number; moveY: number }`)
  give the right values: 'none' -> NO_CHEATS, 'all' -> ALL_CHEATS, 'godMode,noHeat' -> only those; walking along the
  camera gives moveY 1, moveX 0; walking at 90° to its right gives moveX 1.

## Contract
`QuestSimApi` and `mountQuestSim` as in the stub; `export function parseCheats(text: string | null): Cheats`;
`export function walkInput(camYaw: number, cameraYaw: number): { moveX: number; moveY: number }`. URL parameters:
`questsim`, `questsimVariant`, `questsimCheats`, `questsimRun`. Storage keys as named above.

## Done when
- `npx vitest run src/questSim/browser.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/browser*.ts`.
- Do not start a dev server; the planner checks it in a browser after the epic.

## Out of scope
Every other file (app.ts already mounts it; input.ts is done; the trainer tab is another issue).
