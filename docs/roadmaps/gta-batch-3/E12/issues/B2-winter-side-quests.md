Epic: E12-B (winter sports, runtime)
Depends on: E12-A (the save and its probes exist)
Agent: general-purpose (Sonnet): quest writing

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
Two side quests from the side-quest schedule are playable and pass the quest sim: **Snowdrop Sled Trials**
(`sq-snowdrop-sled-trials`, giver Gentian Bootlace at the Woolly Sock Lodge) and **Lines on Pail Pond**
(`sq-pail-pond-lines`, giver Thermos Theo at his shanty on Pail Pond). Both use `probe` objectives that read the winter
save, so the bot can do them through the winter save API.

## Background
- Schedule (`docs/design/gnome-theft-auto/side-quest-schedule.md`): both unlock "after #38 m38-pail-pond" and #39, which do
  not exist yet (E20/E21 build the act III story). Until then unlock both after the existing chapter-3 Fells quest
  `ch3-tundra-drift-run` (the player has been north), and write in the `why` that E21 moves them to m38/m39. Update the two
  rows of the schedule table and the "Snowdrop Slope" area-coverage row accordingly (note the temporary unlock).
- Probes (already in `city/probes.ts` SAVED, reading `gta-winter-v1` through `createWinterStore(...).data()`):
  `winter-sled-runs` (Tea-Tray Run finishes), `winter-ski-runs` (Wool Run finishes), `ice-holes` (holes drilled),
  `ice-catches` (fish landed through ice).
- The places (`winter/types.ts`): `LODGE` (-449, -1020), its porch spots x -437; the runs' start lines `WOOL_RUN.start`
  (-350, -1255) and `TEA_TRAY_RUN.start` (-405, -1250); the tow base `TOW.base` (-300, -1028); `SHANTY` (-612, -1040);
  `PAIL_POND` (-640, -1060).
- Gentian (bobble cap, brisk, warm-handed, "unimpressed by anything that falls over twice"); Theo (thermos, always; fishes
  Pail Pond; the bears have been paid in sardines). Lore: rulings R-186..R-188 in `docs/lore/rulings.md` (read them).

## Read first
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestDef`, the `probe` and `visit` objective shapes, `GiverDef`.
- `games/gnome-theft-auto/src/quests/homeQuests.ts`: a short recent quest file (dialogue cutscene, visits, outro).
- `games/gnome-theft-auto/src/quests/newcomerQuests.ts` (skim 1 quest): `probe` objectives with `at` and `hint`.
- `games/gnome-theft-auto/src/quests/defs.ts`: `GIVERS` (a giver uses `...placed('<id>')`, which reads a `giver/<id>`
  marker from the level documents) and the `QUESTS` list.
- `games/gnome-theft-auto/src/quests/unlocks.ts`: `SIDE_UNLOCKS`.
- `games/gnome-theft-auto/src/questSim/solvers/probe.ts`: `PROBE_ACTIONS` (one entry per probe id, with a fidelity);
  `games/gnome-theft-auto/src/questSim/plans.ts` (per-quest expectations).
- `games/gnome-theft-auto/src/data/levels/north-highlands.level.json`: the `markers` list (region-local coordinates:
  the document origin is (0, -1150), so world (x, z) is local (x, z + 1150)); a `giver` marker looks like
  `{ "id": "giver/cloverfield-barn", "kind": "giver", "x": -25, "z": -70, "data": { "exit": { "dx": 5, "dz": -5, "yaw": 0 } } }`.

## Change
- `src/data/levels/north-highlands.level.json`: two giver markers: `giver/gentian` at world (-430, -1007) (beside
  Gentian's ski class, which `winter/hill.ts` stands 8 m east of the lodge door and about 18 m south of it; it must stay
  more than 2.4 m from `SKI_RACK`, `COCOA_HATCH`, `SLED_STACK`) with exit dx 3, dz 0, yaw π/2; `giver/theo-pond` at world (-608, -1044) with exit dx 2, dz 2, yaw 0.
  Keep the file's JSON formatting (2-space, as written by `JSON.stringify(doc, null, 2)` plus a newline). Run
  `npx vitest run src/levels.test.ts src/sites.test.ts` after.
- `src/quests/defs.ts`: `GIVERS` entries `gentian` ("The Woolly Sock Lodge", label "Talk to Gentian Bootlace", room
  'street', letter '!') and `theo-pond` ("Pail Pond", label "Talk to Thermos Theo", room 'street', letter '!'); add
  `...WINTER_QUESTS` to `QUESTS` (import from `./winterQuests`).
- New `src/quests/winterQuests.ts` exporting `WINTER_QUESTS: readonly QuestDef[]`:
  - `sq-snowdrop-sled-trials` "Snowdrop Sled Trials", giver `gentian`, rewardAcorns 300, `hoa: 'off'` if that field is
    usual for calm quests (check types). Short dialogue cutscene (room 'street', 4-6 lines: Gentian sizes the player up;
    a tea tray is not a toy, it is a tray; she wants to see one run on the tray and one on skis before she lends the
    good skis). Objectives: (1) `probe` `winter-sled-runs` count 1, text "Sled the Tea-Tray Run, start line to finish"
    (`at` the Tea-Tray Run start, hint 'The Tea-Tray Run (rent a tray at the lodge, ride the Bootlace Tow up)');
    (2) `probe` `winter-ski-runs` count 1, "Ski the Wool Run through the gates" (`at` the Wool Run start); (3) `visit`
    back to Gentian at the porch (radius 4) with a `toastOnEnter` line from her. Outro dialogue (2-3 lines; a dry
    compliment that is not quite one). `doneText` one line pointing at the Snowdrop app for best times.
  - `sq-pail-pond-lines` "Lines on Pail Pond", giver `theo-pond`, rewardAcorns 250. Dialogue: Theo, thermos, the bears
    (who "have been paid in sardines"), how to drill. Objectives: (1) `probe` `ice-holes` count 1 "Drill a hole in the ice
    on Pail Pond" (`at` a point on the ice 15 m from the shanty, hint 'Stand on the ice, press E to drill'); (2) `probe`
    `ice-catches` count 2 "Land two fish through the ice (Theo lends a rod)" (`at` the same point); (3) `visit` the
    shanty (radius 4) to show Theo the cards. Outro: Theo is unimpressed and pleased at once.
  Write in the house voice: short, plain, dry; no hurt animals (fish are carded and slipped back; bears never speak).
- `src/quests/unlocks.ts`: two `SIDE_UNLOCKS` rows after the Pebblewick rows: both `after: 'ch3-tundra-drift-run'`, with
  the `why` noting the giver and the E21 re-time.
- `src/questSim/solvers/probe.ts`: `PROBE_ACTIONS` entries for the four probe ids with fidelity 'api', each calling the
  winter save the way the game does (`createWinterStore(store()).recordRun('tea-tray-run', 30, true)`,
  `recordRun('wool-run', 30, true)`, `recordHole()`, `recordIceCatch()` twice is the objective's count, the action does
  one step: check how the other 'api' actions handle counts and copy that).
- `src/questSim/plans.ts`: both quests `{ suite: 'side', expect: 'pass' }` like the others.
- `docs/design/gnome-theft-auto/side-quest-schedule.md`: the two rows and the area-coverage note, as above. Do not touch
  `sq-capwood-cap-count` (Capwood is another epic's place).

## Contract
Quest ids exactly `sq-snowdrop-sled-trials` and `sq-pail-pond-lines`; giver ids `gentian` and `theo-pond`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/levels.test.ts src/sites.test.ts src/questSim/solvers/probe.sim.test.ts` passes.
- `npm run quest-sim -w games/gnome-theft-auto -- --quest sq-snowdrop-sled-trials` and `-- --quest sq-pail-pond-lines`
  pass (check `package.json` / `questSim/cli` for the exact flag; if the CLI has no single-quest flag, run
  `npx vitest run src/questSim/side.sim.test.ts` and check both ids pass in its output).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
`winter/*`, `app.ts`, `city/probes.ts`, other quests.
