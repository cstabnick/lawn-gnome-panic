Epic: E15-B (Hedgeworth Links, quests)
Depends on: E15-A (the save and its probes exist)
Agent: general-purpose (Sonnet): quest writing in the house voice

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
Four Hedgeworth side quests from the side-quest schedule are playable and pass the quest sim, each built on the
regulars' own stories: **Lost Balls** (Thrift), **A Lesson from the Pro** (Basil), **The Ninth Green** (Thrift), and
**Members' Cup** (Peony, ending inside the clubhouse). They use `probe` objectives that read the golf save
(`gta-golf-v1`), so the bot can do them through the save API.

## Background
- Schedule (`docs/design/gnome-theft-auto/side-quest-schedule.md`): `sq-hedgeworth-lost-balls` after #29
  `m29-the-kicked-board`; `sq-hedgeworth-pro-lesson` after #49; `sq-hedgeworth-ninth-green` after #50;
  `sq-hedgeworth-members-cup` after #52; `sq-hedgeworth-reseed` after #56 (needs the W14 mown scar: NOT built here,
  leave its row and mark it deferred to E21). None of those main quests exist yet (E20/E21 build the story). Until then
  unlock them after existing story quests: lost-balls after `ch2-unmowed-tablet`; pro-lesson after `ch3-kiln-resin-ice`
  (prereq lost-balls); ninth-green after `ch3-tundra-drift-run` (prereq lost-balls); members-cup after
  `ch4-runway-flares` (prereq pro-lesson). Write in each `why` that E20/E21 move them to the schedule's rows. Update the
  four rows of the schedule table and the Hedgeworth area-coverage row (note the temporary unlocks).
- Probes (in `city/probes.ts` SAVED, from `golf/types.ts GOLF_PROBES`): `golf-board-broken` (0/1), `golf-holes-played`,
  `golf-par-holes`, `golf-rounds`, `golf-balls-found`, `golf-molehills`.
- Givers stand at `PEOPLE_SPOTS` (golf/types.ts): Thrift (-1057, 611) by his shed, Basil (-1090, 475) by the first
  tee, Peony (-1060, 462) on the terrace. The clubhouse interior id is `CLUBHOUSE_INTERIOR` ('hedgeworth-clubhouse',
  22 x 14 m; local (0, 0) is the room centre on the floor, its door on the south wall: a local point like [4, -4] is
  inside, near the honours board on the north side). Lost balls (`LOST_BALLS`, 8) lie in the rough; molehills
  (`MOLEHILLS`, 4) round the ninth green; the Kicked Board (-1001, 640) is the way in (`api.breakBoard()` from
  `golfApi()` in `golf/runtime.ts`).
- The people and their secrets: `_env.md`. The house voice: short, plain, dry; nobody is hurt; moles are friends in
  hiding (Thrift hides them; Basil blames them for everything). Lore: `docs/lore/rulings.md` R-193..R-195 if present,
  and the Hedgeworth entries (`npm run lore -- find hedgeworth`).

## Read first
- `games/gnome-theft-auto/src/quests/winterQuests.ts`: the model (two side quests with `probe` objectives, dialogue
  cutscenes, a `visit` back to the giver, outros).
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestDef`, the `probe` and `visit` objective shapes (`interior` on a
  visit), `GiverDef`.
- `games/gnome-theft-auto/src/quests/defs.ts`: `GIVERS` (the `gentian` entry uses `...placed('gentian')`, reading a
  `giver/<id>` marker from the level documents) and the `QUESTS` list (`...WINTER_QUESTS`).
- `games/gnome-theft-auto/src/quests/unlocks.ts`: `SIDE_UNLOCKS` (the winter rows) and `SIDE_COLORS`.
- `games/gnome-theft-auto/src/quests/stages/winter.ts` and `quests/stages.ts` (the stage list): a giver's stage spot.
- `games/gnome-theft-auto/src/questSim/solvers/probe.ts` (`PROBE_ACTIONS`, the winter entries with fidelity 'api')
  and `questSim/plans.ts`.
- `games/gnome-theft-auto/src/data/levels/west-estates.level.json` `markers` (region-local: the document origin is
  (-1150, 0), so world (x, z) is local (x + 1150, z)); a giver marker looks like
  `{ "id": "giver/gentian", "kind": "giver", "x": -430, "z": 143, "data": { "exit": { "dx": 3, "dz": 0, "yaw": 1.5707963267948966 } } }`.

## Change
- `src/data/levels/west-estates.level.json`: three giver markers `giver/thrift`, `giver/basil`, `giver/peony` at the
  `PEOPLE_SPOTS` (local coordinates), exits 2 m in front of each (toward where the player comes from). Keep the file's
  JSON formatting (2-space, `JSON.stringify(doc, null, 2)` style, its existing line endings). Run
  `npx vitest run src/levels.test.ts src/sites.test.ts` after.
- `src/quests/defs.ts`: `GIVERS` entries `thrift` ("Thrift's shed", label "Talk to Thrift Hosepipe"), `basil` ("The
  first tee", "Talk to Basil Divot"), `peony` ("The clubhouse terrace", "Talk to Dame Peony"), room 'street', letter '!';
  `...GOLF_QUESTS` into `QUESTS` (import from `./golfQuests`).
- New `src/quests/golfQuests.ts` exporting `GOLF_QUESTS: readonly QuestDef[]` (ids from `GOLF_QUESTS` in golf/types.ts):
  - `sq-hedgeworth-lost-balls` "Lost Balls", giver `thrift`, rewardAcorns 250. Dialogue (4-6 lines): Thrift is not
    pleased anyone came through the board; the balls that fly over the fence and the ones that never come back; the grass
    has been "carrying them about". Objectives: (1) `probe` `golf-board-broken` `absolute` count 1 "Get into Hedgeworth:
    the loose board in the east fence" (`at` the Kicked Board; hint 'The Kicked Board, by the road (drive through or kick it)');
    (2) `probe` `golf-balls-found` count 5 "Find 5 lost balls in the rough" (`at` the course centre); (3) `visit`
    Thrift (radius 4). Outro (2-3 lines): Thrift counts them twice; "Don't tell the pro where you found the third."
  - `sq-hedgeworth-pro-lesson` "A Lesson from the Pro", giver `basil`, rewardAcorns 300, prereq lost-balls. Dialogue:
    Basil heard a stranger has been through the board and wants to "see the swing, champ"; superstitions under his
    breath. Objectives: (1) `probe` `golf-par-holes` count 1 "Make par or better on any Hedgeworth hole" (`at` the
    first tee, hint 'Tee off at any hole (E at a tee)'); (2) `visit` Basil (radius 4). Outro: he pats his sock; "Lucky.
    Very lucky. As they say."
  - `sq-hedgeworth-ninth-green` "The Ninth Green", giver `thrift`, rewardAcorns 300, prereq lost-balls. Dialogue:
    Thrift whispers: something is breathing under the ninth green and Basil must not see the molehills. Objectives:
    (1) `visit` the ninth green (`HOLES[3].green`, radius 10) with a `toastOnEnter` "Thrift (whispering): 'Gently.
    They are asleep.'"; (2) `probe` `golf-molehills` `absolute` count 4 "Pat all four molehills flat before Basil does his
    rounds"; (3) `visit` the shed door (radius 4). Outro: Thrift shows the tunnel mouth by the shed; a mole's teacup;
    "They are no trouble, the little ones. Not like you."
  - `sq-hedgeworth-members-cup` "Members' Cup", giver `peony`, rewardAcorns 450, prereq pro-lesson. Dialogue: Peony
    runs her cup on the first of the month; "One does not concede a hole, my dear"; a hint of the mortgage. Objectives:
    (1) `probe` `golf-rounds` count 1 "Play a full round: holes 1, 2, 3 and 9"; (2) `visit` inside the clubhouse
    (`interior: CLUBHOUSE_INTERIOR`, a local point by the honours board, radius 2.5) "Sign the card at the honours
    board". Outro: she writes the score on the board herself, under "A MOLE (DISPUTED)".
  `hoa: 'off'` (or whatever field calm quests use: check types) on all four. `doneText` one line each.
- `src/quests/unlocks.ts`: the four `SIDE_UNLOCKS` rows (after the winter rows) with prereqs where the type supports
  them (else express the prereq the way other chained side quests do), and `SIDE_COLORS` for `thrift`, `basil`, `peony`.
- `src/quests/stages/golf.ts` (new, `GOLF_STAGES`, three stage spots like winter's: center at the spot, region
  'west-estates', a camera, marks for the giver and the player, look and sounds lines) and add it to `quests/stages.ts`
  `STAGES`. Run `npx vitest run src/quests/stages.test.ts` (it checks spots against the built world: keep cameras off
  colliders; if a check fails because golf scenery is not in the test world yet, report it).
- `src/questSim/solvers/probe.ts` `PROBE_ACTIONS`: entries for the six golf probes with fidelity 'api', doing one step
  each the way the winter entries do: `golf-board-broken` -> `golfApi()?.breakBoard()` and also
  `createGolfStore(store()).breakBoard()`; `golf-balls-found` -> `findBall` on the next unfound `LOST_BALLS` id;
  `golf-molehills` -> `flattenMolehill` on the next; `golf-par-holes` -> `recordHole(0, 3, 4)`; `golf-holes-played` ->
  `recordHole(1, 3, 3)`; `golf-rounds` -> `recordRound(16)`.
- `src/questSim/plans.ts`: the four quests `{ suite: 'side', expect: 'pass' }`.
- `docs/design/gnome-theft-auto/side-quest-schedule.md`: the rows as above.

## Contract
Quest ids exactly the `GOLF_QUESTS` values; giver ids `thrift`, `basil`, `peony`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/levels.test.ts src/sites.test.ts src/questSim/solvers` passes.
- The side suite sim passes for the four quests: `npm run quest-sim -w games/gnome-theft-auto -- --quest <id>` if the
  CLI has a single-quest flag (check `tools/quest-sim.mjs`), else `npx vitest run --config vitest.sim.config.ts` and
  check the four ids pass in its output.
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
`golf/*` (read only), `app.ts`, `city/probes.ts`, other quests.
