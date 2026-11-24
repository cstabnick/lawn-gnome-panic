Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve every `probe` objective (the Newcomers' Card tutorials): each probe id is done through its
activity's own API, with a recorded "fidelity" saying how real that was.

## Read first
- `src/city/probes.ts`: how each probe id is read (saves of hunting / birding / fishing / jobs / mowing; live getters
  registered by `registerProbe`; counters bumped by `bumpProbe`; `spend:<reason>` / `earn:<reason>` count successful
  `economy.spend(amount, reason)` / `economy.earn(amount, reason)` calls).
- `src/quests/objectivesCity.ts` `probeRun`: done when the probe rose by `count` (default 1) since the step started, or
  with `absolute` when it reads at least `count`; it polls every 0.5 s.
- `src/quests/newcomerQuests.ts`: every probe objective (ids below) and its `at` spot.
- `src/questSim/harness.ts`: the headless sim registers the live probes and implements `ctx.actions` (`setWheelOpen`,
  `setKitOpen`, `emote(pair)`, `streetEventDone`, `storeInLockup`, `nearBanner`, `joinParty` which throws a 'blocked'
  SimFail headless). `ctx.economy` is the session economy (its spend/earn feed the `spend:`/`earn:` probes).
- Stores (all take a Storage; pass `localStorage` from globalThis):
  `src/fishing/fishSave.ts` `createFishStore` (`buyRod(id, spend)`, `recordCatch(species, size)`, `sellCards()`),
  `src/fishing/species.ts` `FISH_SPECIES`, `src/fishing/tackle.ts` `RODS`;
  `src/hunting/huntSave.ts` `createHuntStore` (`buyLicense(spend)`, `recordComb(species, keepsake, shotDist)`,
  `sellAll()`), `src/hunting/species.ts` `SPECIES`;
  `src/birding/birdSave.ts` `createBirdStore` (`markSeen(id)`, `markHeard(id)`, `markPhoto(id)`; find the species list
  in `src/birding/`);
  `src/jobs/career.ts` (`sharedJobsStore()`, `recordGig(save, job, kind, pay)`, `commit()`; `jobStats()` reads the shared
  store unless a runtime is bound);
  `src/flora/rewards.ts` (`MOW_SAVE_KEY`, `createMowRewards({ increment, earn, toast, storage })` with
  `record(kindId, longGrass, onMower)` and `update(dt)` (writes the save every few seconds) or write the save directly
  through its own parse/serialize helpers);
  `src/outskirts/bus.ts` (the Hopper fare: `economy.spend(HOPPER_FARE, 'Pebblewick Hopper')`),
  `src/craft/craftShop.ts` (the Slipway: `spend(total, "Wingwright's Slipway")`),
  `src/lockup/runtime.ts` (`callDelivery` spends `'Sling-Lift'`).

## Change
- `src/questSim/solvers/probe.ts` (replace the stub; keep `probeSolver: Solver<'probe'>`):
  - `export const PROBE_ACTIONS: Record<string, { fidelity: 'api' | 'action' | 'economy' | 'vehicle'; run(ctx: SimCtx): Promise<void> }>`
    with one entry for EVERY probe id used in `newcomerQuests.ts`:
    `street-event, emote, pair-emote, wheel-open, kit-open, lockup-stored, spend:Sling-Lift, mowed, golf-cart, fish-rod,
    fish-caught, fish-sold, job-gigs, spend:Wingwright's Slipway, banner-near, hunt-licensed, hunt-combed, hunt-sold,
    spend:Pebblewick Hopper, bird-seen, bird-heard, bird-photos, boat, party-on`.
    - 'action': the `ctx.actions` call (wheel/kit: open, step 1 s, close).
    - 'api': the activity store (buy with `(n) => ctx.economy.spend(n, '<the activity's reason>')`; catch one fish of
      the first species, comb one quarry, mark one bird seen/heard/photographed (pick one not yet in the save), record
      one gig (`recordGig(store.get(), 'taxi', 'fare', { base: 10, time: 0, tip: 0, bonus: 0, total: 10, xp: 10, stars: 5 } as PayResult)`
      then `commit()`; check `PayResult` in `src/jobs/types.ts` for the exact fields), mow one plant per call.
    - 'economy': where the real path needs the full game (Sling-Lift, the Slipway, the Hopper), spend the activity's own
      price with the exact reason string through `ctx.economy.spend(price, reason)`; import the price constant from
      the module when it is exported, else use 10.
    - 'vehicle': get into a vehicle of the right kind: `golf-cart` (nearest 'golf-cart' to (185, -185) or
      `ctx.spawnVehicle('golf-cart', ...)`), `boat` (`ctx.spawnVehicle('gravy-boat', ...)` on water near the objective's
      `at` or the Loch Moss shore), `lockup-stored` (spawn a 'ride-on' in the bay at the objective's `at`, enter it, then
      `ctx.actions.storeInLockup()`). Record `ctx.useCheat('unlockAllItems', ...)` when spawning.
    - `party-on`: `ctx.actions.joinParty()` (throws 'blocked' headless; let it through).
  - `probeSolver.solve(obj, ctx, o)`: when `obj.at`, `travelTo` it first. Look up `PROBE_ACTIONS[obj.probe]`; missing ->
    `SimFail('bot', 'probe <id>: no action')`. `ctx.log('probe <id> via <fidelity>')`. Then `runUntil` with a tick
    that runs the action once every 1 s (at most `(obj.count ?? 1) + 3` times; then just wait).
  - `freeAcorns`: record `ctx.useCheat('freeAcorns', 'probe <id>: paid from the sim purse')` for buys.
- `src/questSim/solvers/probe.test.ts` (new): for every probe objective in `NEWCOMER_QUESTS`
  (`src/quests/newcomerQuests.ts`) except `party-on`: `objectiveSession(sim, obj)`, solve with budget 120: done. And
  `party-on` rejects with a `SimFail` of class 'blocked'. One `it` per quest id (use `it.each` or a loop), sessions
  disposed after each.

## Contract
`export const probeSolver: Solver<'probe'>`; `export const PROBE_ACTIONS` as above.

## Done when
- `npx vitest run src/questSim/solvers/probe.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/probe*.ts`.
- Your report lists each probe id with its fidelity.

## Out of scope
Every other file (do not edit `city/probes.ts`, the stores, `harness.ts`).
