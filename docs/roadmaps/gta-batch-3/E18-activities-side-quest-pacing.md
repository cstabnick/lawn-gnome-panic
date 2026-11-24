# E18 Activities and side-quest pacing
Wave: 7 · Depends on: E04 (side-quest schedule, world-changes table, bubble-mobile design), E05 (kitchen interior), E08 (inventory, shops) · Kind: Content
Source items:
- L30 add a chef job, so that players can cook and make some dishes. should be fun.
- L54 add a bubble-boy style vehicle quest where the player unlocks the bubble-mobiel or ability to unlock one. should just allow them to roll around hamster style
- L66 add quests to introduce player to birding, hunting, fihsing
- L67 rework the side quests available to player so that they aren't overwhelemd. unlock some as game progresses and other characters make sense to appear
- L68 when completing a series of quests, make some change in the world so the player can feel the world devloping
  (E04 writes the design for L67 and L68 and the bubble-mobile quest; E18 implements.)

## Goal
Add the chef job and the bubble-mobile, make sure a newcomer is walked into birding, hunting and fishing, and rebuild how
side quests unlock so the journal never overwhelms, with visible world changes at the end of quest series.

## Scope
In:
- **Chef job** (L30): a fifth sim job. Player works a kitchen (a diner or Gnoma's food truck, per E04/E05), takes orders,
  cooks dishes in short tap/drag mini-steps, serves, gets a rating, pay, tips and XP and career levels like the other jobs;
  dishes are added to the inventory as snacks (E08). Cooking mechanics shared with `games/cooking-gnoma` through a new package.
- **Bubble-mobile** (L54): a new ground vehicle, a transparent hamster ball the gnome rolls inside (slow-turn, bouncy,
  roll physics feel), unlocked by a short quest series (design from E04); parkable, storable, buyable only through that quest.
- **Intro quests** (L66): the three hobbies already have Newcomers-Card quests (`nc-sky-spotting`, `nc-reedwatch` birding, `nc-tuft-and-tally` hunting, `nc-bent-pin` fishing). Work: re-time and reword them as friendly in-world introductions with guided first steps (what to buy, where, how), make sure the story actually sends the player to each (via E04 schedule), and check them for completability in the quest simulator.
- **Side-quest pacing** (L67): rework `SIDE_UNLOCKS` to the E04 schedule (offer a few at a time; later ones appear as their giver appears), a journal that shows only unlocked or hinted quests, a cap on simultaneous open offers, and a "new quest" notification.
- **World changes** (L68): a data-driven `worldChanges.ts` (`id`, `after` quest ids, what appears) applied from quest save state, with a handful of visible changes per E04 (a repaired sign, a new stall, a crowd, a lit window).
Out: the E04 writing itself; new areas; the property/inventory API (E08); the farm (E16); golf, basketball and skate activities (E15, E19).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`.
- Jobs framework: `jobs/defs.ts` (`JOBS: Record<JobId, JobDef>`: `title`, `employer`, `giver`, `depot {x,z,name,prefab}`, `licence`, `vehicle: 'ground-seats'|'ground'|'air'|'boat'`, `uniform`), `jobs/types.ts` (`JobId = 'taxi' | 'courier' | 'pilot' | 'boat'`, `JOB_IDS`, `GigKind`, `Stop`, `StopAction`), `jobs/runtime.ts` (`installJobs`, `vehicleOk`, `kindsFor`, duty/licence checks ~l.151, phone app ~l.610), `jobs/career.ts` (`JOBS_SAVE_KEY 'gta-jobs-v1'`, `levelOf`, `recordGig`, `createJobsStore`), `jobs/gig.ts`, `jobs/rating.ts`, `jobs/gen.ts`, `jobs/board.ts`, `jobs/hud.ts`, `jobs/visuals.ts` (depot kiosk), `jobs/places.ts`, `jobs/protocol.ts` (online sync systems `SYS.cab/pax/tow`). The chef job is not a vehicle gig: decision below.
- Cooking source game: `games/cooking-gnoma/` (Phaser): `src/steps.ts` (`Step`, `StepAction`, `StepCtx`, `makeSteps()`, five cake steps), `src/config.ts` (`TUNING`, `TOTAL_STARS`, `COLORS`), `src/dialogue.ts`, `src/scenes/KitchenScene.ts`, `src/gnoma.ts`. Phaser-bound: `games/gnome-theft-auto/package.json` has no `phaser` dependency, so only the **pure** parts (step definitions, tuning numbers, star scoring, recipe data) can move to a package. Packages today: `packages/{achievements,cloudsave,depth,emotes,gamepad,glaze,gnome,gnome-editor,level,mp,mp-server,music,mutter,oakcount,party,platform,platform-server,portal,prefabs,profiler,sync,vehicle,volume}`; new `packages/cooking` follows `packages/party` conventions.
- New vehicle plumbing (follow `barrow-buggy` as the template): `types.ts` `VehicleKind` (~l.12), `config.ts` `VEHICLES` (~l.374, `VehicleSpec { kind, mountStyle, name, prefab, scale, maxSpeed, accel, turnRate, radius, seat, mass, passengerSeats }`), `handling.ts` `PROFILES` (~l.138), `driveGrips.ts` (~l.156), `net.ts` (~l.23 vehicle kinds synced), `anim/rideAuto.ts` (~l.46 drive anim per kind), `errands.ts` (~l.130 kinds list), `oddRides.ts` (`ODD_RIDES`, `recordOddRide`), `fleet.ts` (`FLEET`), `vehicles.ts` (`createVehicle`, `stepVehicle`), `packages/vehicle` (`VehicleController`, `CASUAL`, `SIMCADE`; rolling-ball dynamics may need a custom layer), prefabs `packages/prefabs/src/catalog/gta-odd-rides.ts` and `gta-fleet.ts`. E02 is reworking vehicle feel (gravity, landing, collision): rebase on its result and use its public handling API only.
- Hobby systems: `birding/` (`birding.ts`, `birdSave.ts` key `gta-birding-v1`, `journalUi.ts`, `species.ts`), `hunting/` (`hunting.ts`, `lodge.ts`, `huntSave.ts` key `gta-hunting-v1`, `species.ts` `LODGE`), `fishing/` (`fishing.ts`, `shop.ts`, `fishSave.ts` key `gta-fishing-v1`, `tackle.ts` `RODS`, `BAITS`). Quest probes for these live in `city/probes.ts` (`fish-rod`, `fish-caught`, `fish-sold`, `hunt-licensed`, `hunt-combed`, `hunt-sold`, `bird-seen`, `bird-heard`, `bird-photos`, `banner-near`).
- Existing intro quests: `quests/newcomerQuests.ts` `NEWCOMER_QUESTS` (`nc-bent-pin`, `nc-tuft-and-tally`, `nc-reedwatch`, `nc-sky-spotting`, `nc-take-off`, `nc-odd-jobs`, ...; giver `newcomers-club`, `NEWCOMER_CARD_IDS`, `NEWCOMER_CARD_ACHIEVEMENT`).
- Pacing: `quests/unlocks.ts` (`SIDE_UNLOCKS: SideUnlock { questId, after, why }[]` ~40 rows, `unlockRule`, `unlockMet`, `unlockedSideIds`, `SIDE_COLORS`), `quests/sideQuests.ts` (`SIDE_QUESTS`, 11 Strangers & Freaks), `quests/cityQuests.ts`, `quests/newcomerQuests.ts`, `quests/outskirtsQuests.ts`, `quests/races.ts`, `quests/journal.ts` (renders Active/Open/Locked tabs from `unlockMet`), `quests/defs.ts` (`GIVERS`, `QUESTS`, `questById`), `quests/quests.ts` (state machine; `isQuestAvailable`), `quests/questSave.ts`, `quests/tessieQuest.ts` (special unlock key). Story order list is in the header comment of `unlocks.ts`; E20/E21/E22 renumber main quests, so `after` ids must come from E04's schedule table.
- World-change hooks: no generic mechanism exists today (the closest are `worldEvents.ts` for random events, `stageSetBoxes()` / `Stage.set` in `quests/stages/` for quest-time props, and `scenery.ts` / `settlements.ts` for static dressing). Add a small registry; static prefab batches are baked once (`cull.ts` `buildStaticCells`), so changes must be separate toggled groups, not edits of the baked batch.
- Quest verification: `questSim/` (`checks.ts`, `solvers/probe.ts`) and `quests/quests.test.ts`; every new quest needs a solver entry for any new probe.
- Saves: `saveIO.ts` `GTA_SAVE_KEYS`, `cloudSave.ts` `MERGES`, `saveIO.test.ts` (new key `gta-worldchanges-v1` if state is not derivable from quest saves; prefer derive-from-quest-state and add no key).

## Contracts this epic provides
- `packages/cooking`: pure recipes/steps/scoring (`Recipe`, `CookStep`, `scoreStars`) used by cooking-gnoma and the GTA chef job; cooking-gnoma build and tests still pass.
- `JobId` gains `'chef'`; `JobDef.vehicle` gains `'none'`; career/XP/rating reused.
- `worldChanges.ts`: `registerWorldChange({ id, after: string[], apply(ctx) })`, `isChanged(id)`; other epics (E20-E22) add rows instead of building ad-hoc props.
- `VehicleKind 'bubble-mobile'` and a quest-unlock flag `bubbleUnlocked()`.
- New `SIDE_UNLOCKS` shape stays `{ questId, after, why }` (plus optional `giverAppears`); `unlockMet` signature unchanged so E20 to E22 tests keep working.

## Contracts this epic consumes
- E04: `side-quest-schedule.md`, `world-changes.md`, bubble-mobile quest design, chef and kitchen/diner location and character (docs under `docs/design/gnome-theft-auto/`).
- E05: kitchen interior (enter/leave, a counter and stove slot); if absent the chef job runs at a food-truck window outdoors (Gnoma's food truck: lore `docs/lore/entries/apocrypha/gnomas-food-truck.md`).
- E08: `inventory.addItem`/`ITEMS` for dishes, `Economy.earn`.
- E02: handling API for the rolling ball.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): chef is a solo job (no new net system). Bubble-mobile is a normal synced vehicle: add it to `net.ts` kinds. World changes derive from each player's own quest saves; they are visual only and local.
- Mobile: cooking steps are tap/drag, 44 px targets, portrait and landscape; bubble-mobile steers with the existing touch driving controls; journal pacing UI has no hover-only elements.
- Achievements: `gta-job-chef` (uniform reward hat, per `jobs/defs.ts` `uniform` pattern), "Five Stars", "Roll With It" (bubble-mobile), plus intro-series completions; `npm test -w packages/achievements`.
- Prefabs: kitchen props, dish props, chef hat/apron, bubble-mobile, kiosk; `packages/prefabs/src/catalog/gta-jobs.ts` / `gta-jobs-gear.ts` / `gta-odd-rides.ts`; `npm test -w packages/prefabs`.
- Lore: `npm run lore -- find chef|kitchen|bubble|hamster`; employer and dish names need entries; follow canon.

## Risks and open questions (decisions taken)
- Phaser vs three.js: GTA cannot import Phaser. Decision: extract only the pure logic to `packages/cooking`; GTA draws its own DOM overlay for steps; cooking-gnoma imports the package without behaviour change. If the extraction would change cooking-gnoma behaviour, do not copy: write GTA steps against the package API and note it (standing decision).
- Chef is not a vehicle gig: decision, a `kind: 'station'` job with its own small runtime (`jobs/chef.ts`) that still writes `career.ts` stats and pays through `Economy`, so levels, rating UI and licence UX are shared.
- Hobby intros already exist: decision, rework rather than add new quests, to avoid duplicates; add at most one new guiding quest per hobby if E04's schedule needs it.
- Re-timing unlocks changes quest availability for existing saves: `unlockMet` already treats started or finished quests as unlocked; keep that rule so old saves lose nothing.
- Rolling-ball physics may not fit `@lawn/vehicle`: decision, implement as a `PROFILES` entry plus a custom `stepVehicle` branch (pitch visual only on the ball mesh, gnome stays upright inside); no package change.
- If decompose exceeds about 30 issues, defer world-change variety and extra recipes.

## Done when
- `npm run build -w games/gnome-theft-auto` and `npm run build -w games/cooking-gnoma`
- `npm test -w games/gnome-theft-auto` (quests, `questSim`, unlock table test: every `after` id exists, no cycle, at most N open at once per chapter; chef rating test), `npm test -w packages/cooking`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`
- `npm run lore`
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...` clean; phone 390x844: work a chef shift, drive the bubble-mobile, finish each hobby intro, see a world change appear after a quest series.
