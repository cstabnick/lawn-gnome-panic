Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): quest writing

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Two side quests from the side-quest schedule are playable and pass the quest sim: **The Lost Essay**
(`sq-rootwell-lost-essay`, giver Dean Lovage Inkwell at his lodge on the quad) and **Rent for the Landlords**
(`sq-anthill-rent`, giver Professor Betony Sextant on the Anthill's summit). Both use `visit` objectives (some inside
interiors), so the bot can do them.

## Background (confirmed)
- Schedule (`docs/design/gnome-theft-auto/side-quest-schedule.md`): `sq-rootwell-lost-essay` unlocks after #47
  `m47-hedgeworth-links` and `sq-anthill-rent` after #48 `m48-the-groundskeepers-secret`; those story quests do not exist
  yet (E20-E22 build acts II-IV). Until then both unlock after the existing chapter-4 quest `ch4-spade-truce` ("the spade
  truce has opened the eastern sand"; Rootwell is past the Dust Flats), with a `why` noting that E21 moves them to
  m47/m48. Update their two rows and the "Rootwell and the Anthill (E13)" area-coverage row of the schedule (note the
  temporary unlock). Respect the open-offer caps: check `src/quests/unlocks.test.ts` still passes (it may count offered
  quests per unlock point); if two at once breaks a cap there, unlock the essay after `ch4-spade-truce` and the rent
  quest after `ch5-even-cut` instead, and say so.
- Givers: the lead has already put `giver` markers in `src/data/levels/east-campus.level.json`: `giver/lovage` at world
  (1068, -250) (beside the Dean's lodge door) and `giver/betony` at world (1246, 167) (on the summit beside the
  observatory door). `src/quests/defs.ts` `GIVERS` entries use `...placed('<id>')` (reads the marker), e.g. `gentian`.
- Places (`src/campus/types.ts`): `ROOTWELL_ROOMS['uni-library']` local spots `librarian` [0, -4] and `essayDesk` [7, 3]
  (interior id `uni-library`, door at the Long Shelf (1110, -277.5)); the Cloche's door (1274.5, -215); the Clod's pitch
  `CAMPUS.pitch` (1040, -95); `CAMPUS.sugarStore` (1265, -224); the ants' north door `OBSERVATORY.antDoors[0]` (1172, 82)
  (stand 3 m out from it along its yaw -2.36, i.e. about (1170, 80) - check: out = (sin yaw, cos yaw) * 3); the summit
  (1240, 150), the observatory door (1247.5, 158). The mound has a dirt road up (`trail/anthill-road`, another worker).
  The E05 quest gate: a `visit` objective with `interior: 'uni-library'` uses local coordinates for `at`
  (`docs/roadmaps/gta-batch-3/E05/contracts.md` "Quest gate").
- People (`docs/lore/entries/apocrypha/lovage-inkwell.md`, `betony-sextant.md`; `docs/design/gnome-theft-auto/characters.md`
  rows `lovage`, `betony`): the Dean is smooth, well-meaning, in a gown, keeps a ledger of late rent to the ants, signed
  the survey over to the HOA for a grant, and is sure the player is a student; Sextant is quiet, very exact, a coat with too
  many pockets, an astronomer whose level-line survey was taken for the HOA, and she knows the ants. The ants are
  landlords paid in sugar, close their doors when the rent is late, never speak, are never termites. House voice: short,
  plain, dry; nothing hurt. Before writing names or lines, `npm run lore -- find inkwell` / `-- find sextant`.

## Read first
- `games/gnome-theft-auto/src/quests/types.ts` (`QuestDef`, `visit` objective incl. `interior`, `GiverDef`).
- `games/gnome-theft-auto/src/quests/winterQuests.ts` (two finished side quests: dialogue cutscene, objectives, outro).
- `games/gnome-theft-auto/src/quests/defs.ts` (`GIVERS`, `QUESTS`), `src/quests/unlocks.ts` (`SIDE_UNLOCKS`, `SIDE_COLORS`).
- `games/gnome-theft-auto/src/questSim/plans.ts` (per-quest expectations).

## Change
- New `src/quests/rootwellQuests.ts` exporting `ROOTWELL_QUESTS_DEFS: readonly QuestDef[]`:
  - `sq-rootwell-lost-essay` "The Lost Essay", giver `lovage`, rewardAcorns 300. Opening dialogue (4-6 lines): the Dean
    greets the player as one of his students, late with an essay on level lines ("the HOA's favourite subject"); its
    pages blew off his desk. Objectives: (1) `visit` the Long Shelf's librarian (interior 'uni-library', `at` the
    `librarian` spot, radius 2, hint 'The Long Shelf (library)', a `toastOnEnter` line: the first page was handed in as a
    bookmark); (2) `visit` the Cloche's door (radius 4, toast: page two was holding up a tomato); (3) `visit` the Clod's
    pitch (radius 6, toast: page three was the halfway line); (4) `visit` back to the Dean at his lodge (radius 4).
    Outro (2-3 lines): he reads it, gives it a C-minus ("level, but not level enough"), and pays; a hint of guilt about the
    survey. `doneText` one dry line.
  - `sq-anthill-rent` "Rent for the Landlords", giver `betony`, rewardAcorns 350. Dialogue (4-6 lines): Sextant, exact and
    quiet: the university is late with the sugar again, the ants have shut the doors, she cannot do her work with the
    lights off below. Objectives: (1) `visit` the sugar store behind the Trencher (radius 3, toast: you take the sack the
    Dean has labelled 'GRANT'); (2) `visit` the ants' north door (radius 3, toast: you leave the sugar; after a moment
    the door opens a crack and a single ant takes one cube in); (3) `visit` the observatory door (radius 4). Outro: the
    door is open, the lights below are on, she gives a precise thank-you ("Three hundred and fifty acorns. I counted.").
  - Use the same fields as the winter quests (room 'street' dialogues, `hoa` policy if the winter quests set one, etc.).
- `src/quests/defs.ts`: `GIVERS` entries `lovage` (name "The Dean's lodge", label 'Talk to Dean Inkwell', `...placed('lovage')`,
  room 'street', letter '!') and `betony` (name 'The Anthill Observatory', label 'Talk to Professor Sextant',
  `...placed('betony')`, room 'street', letter '!'); add `...ROOTWELL_QUESTS_DEFS` to `QUESTS` after `...WINTER_QUESTS`.
- `src/quests/unlocks.ts`: two `SIDE_UNLOCKS` rows after the winter rows (as above), and `SIDE_COLORS` for `lovage`
  ('#c9a227') and `betony` ('#8fa8ff').
- `src/questSim/plans.ts`: both `{ suite: 'side', expect: 'pass' }`.
- `docs/design/gnome-theft-auto/side-quest-schedule.md`: the two rows and the area-coverage note.

## Contract
Quest ids exactly `sq-rootwell-lost-essay` and `sq-anthill-rent` (`ROOTWELL_QUESTS` in `src/campus/types.ts`); giver ids
`lovage` and `betony`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/levels.test.ts src/sites.test.ts` passes.
- `npm run quest-sim -w games/gnome-theft-auto -- --quest sq-rootwell-lost-essay,sq-anthill-rent` passes (it builds the
  game in a headless browser and may take a few minutes; if the tool cannot run in your environment, run
  `npx vitest run --config vitest.sim.config.ts src/questSim/side.sim.test.ts` and check both ids pass in its output;
  the Rootwell scenery is being built by other workers at the same time, so if a visit fails because a new collider
  sits on a target, report the spot to the lead rather than moving the target into a wall).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes for your files.

## Out of scope
`src/campus/*`, `app.ts`, level documents (the giver markers are already placed), other quests.
