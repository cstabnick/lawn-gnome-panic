# E20 roadmap: story acts I-II (quests 1-35)

Brief: [../E20-story-acts-1-2.md](../E20-story-acts-1-2.md). Source items L04, L45, L58, L83, L84 (rows 1-35), L95, L105,
L106. Outline: `docs/design/gnome-theft-auto/story-outline.md` rows 1-35. Contract for every quest issue:
[issues/_quest-common.md](issues/_quest-common.md).

## Layout (the lead's setup, committed first; E21/E22 copy it)

- `src/quests/story/<NN>-<slug>.ts`: `export const STORY: StoryFile` (`kit.ts`: quests in play order, comms, sim
  plans, new givers). `actI.ts` / `actII.ts` import them; `index.ts` flattens to `STORY_QUESTS`, `STORY_COMMS`,
  `STORY_PLANS`, `STORY_GIVERS`, spread once into `defs.ts` (QUESTS, GIVERS), `comms.ts`, `questSim/plans.ts`.
- `src/cutscene/scenes/story/m<NN>-<slug>.ts`: `export const SCENES`; `actI.ts` / `actII.ts` spread into `scenes/index.ts`.
- `src/quests/stages/story/s<NN>-<slug>.ts`: `STAGES` (new stages) and `USES` (quest ids added to an existing stage's
  `usedBy`); `index.ts` merged into `stages.ts`.
- New objective kinds (two quests or more use each): `passenger` (L58 pick-up/drop-off, `objectivesPassenger.ts`,
  solver `solvers/passenger.ts`) and `inspect` (press/hold an action at points, `objectivesInspect.ts`, solver
  `solvers/inspect.ts`).
- `storyRows.ts` gives the extended parts (`ch1-founders-boot-p1/-p2`, `ch3-salvage-raid-p1/-p2`) their row.
- Only the lead edits aggregators and hot files (defs, comms, unlocks, plans, storyRows, worldChanges/defs, chapter
  prereqs of kept rows).

## Shape

| epic | issues | done when |
|---|---|---|
| E20-1 foundation | E1 passenger kind, E2 inspect kind, C cast presets/intros/voices, P story props, G gear + achievements, L L106 "On the House" | build, tests, prefabs/achievements/gnome tests; sim solves the two kinds |
| E20-2 wave A (acts I-II) | A1 rows 2+5, A2 7+9, A3 10+11, A4 12+13, A5 14+17, A6 row 15 (extended), A7 19+21, A8 22+23 | build, tests, cutscene report, sim per quest |
| E20-3 wave B (act II) | B1 24+25, B2 26+27, B3 28+29, B4 30+31, B5 32+33, B6 34 (+W07), B7 row 35 (extended), K intro cards in kept scenes | as above; then lead integration (prereq chain, unlock and W moves) |

21 issues. Models: Sonnet general-purpose for quest writing and scenes, Opus for the extended rows 15 and 35 and the
passenger engine, Haiku for props and gear. Up to 8 at once. Issue files: [issues/](issues/).

## Lead integration (after each wave)

- Prereq chain of kept rows (outline): `first-contract` after `m02`, `ch1-mowers-keepers` after `first-contract`,
  `ch1-two-coat-tail` after `m05`, `ch1-tax-break-in` after `m07`, `ch2-sprinkler-gauntlet` after `m17`,
  `ch2-vespers-offer` after `m19` (plus its objective 3 text and comms step 2), first-contract briefing line.
- Unlock moves (E18 hand-off table) and world-change `after` moves for built rows; `unlock-moves.md` records them.
- Remove old plan lines superseded by story files; wire `GLAZE_COMMS`.

## Result (all 21 issues done; nothing deferred)

| row | id(s) | intro cards (first appearance) | W-ids | sim |
|---|---|---|---|---|
| 1 | prologue-fresh-kiln (kept) | Pip, John Bodega, Tansy, Turncoat Cam | - | pass |
| 2 | m02-roof-on-credit (moved from homeQuests, now scripted) | Mabel, Parsley, Hyssop | W01 | pass |
| 3 | first-contract (prereq m02, briefing names the flat) | Don Compost | - | pass |
| 4 | ch1-mowers-keepers (prereq first-contract) | - | - | pass |
| 5 | m05-sweepers-wages | Lugnut Lulu | - | pass |
| 6 | ch1-two-coat-tail (prereq m05) | Juniper, Mayor Mulch, Vesper, Reginald | - | pass |
| 7 | m07-even-estates (passenger Juniper) | Chard | W02, W18 | pass |
| 8 | ch1-tax-break-in (prereq m07) | - | - | pass |
| 9 | m09-where-asphalt-sleeps | Fennel | - | pass |
| 10 | m10-under-the-span | Hogweed, Grout | - | pass |
| 11 | m11-the-dons-cigars | Big Lou, Brenda | - | pass |
| 12 | m12-quarter-inch-at-home (townhouse 404 interior) | Gary | - | pass |
| 13 | m13-diner-on-route-south | Sage, Frank | - | pass |
| 14 | m14-drainpipe-court | Cardoon | - | pass |
| 15 | ch1-founders-boot-p1, -p2, ch1-founders-boot | Hedda | W03 | pass |
| 16 | ch2-dew-run (outro: Kiln-Debt clear, flat loan not) | Granny, Bramble | - | pass |
| 17 | m17-the-dew-buyer | Chicory | - | pass |
| 18 | ch2-sprinkler-gauntlet (prereq m17) | Driftwood | - | pass |
| 19 | m19-squall-box-forecast | Rooster | - | pass |
| 20 | ch2-vespers-offer (prereq m19, gate text, Granny's call) | - | W04 | pass |
| 21 | m21-penthouse-viewing (choice A/B) | - | W05 | pass x2 |
| 22 | m22-off-air (passenger Pip) | Sorrel | - | pass |
| 23 | ch2-unmowed-tablet (rewrite: ends on the tablet) | Bracken | - | pass |
| 24 | m24-the-burrow-door | Nubbin, Tumblesoil | W06 | pass |
| 25 | m25-one-leg-to-stand-on | Saxifrage | - | pass |
| 26 | m26-the-knot-hole (passenger Pip) | - | - | pass |
| 27 | m27-heap-of-trouble | Ernie | - | pass |
| 28 | m28-sibling-rivalry (passenger Reginald) | - | - | pass |
| 29 | m29-the-kicked-board | Thrift | - | pass |
| 30 | m30-cams-big-night (passenger Cam, race) | - | - | pass |
| 31 | m31-granny-cracks (passenger Granny) | Midge | - | pass |
| 32 | m32-driftwoods-chart | - | - | pass |
| 33 | m33-the-bench-lock (passenger Cam) | - | - | pass |
| 34 | m34-forty-seven-wrenches (3 passengers; Cam's call) | - | W07 (built) | pass |
| 35 | ch3-salvage-raid-p1, -p2, ch3-salvage-raid | - | W08 | pass |
| L106 | sq-on-the-house (side; perk "Cass's Tab": free repairs) | Cass | - | pass |

Checks: build, 501 test files green, cutscene report 0 faults in Story A/B, quest-sim story suite 47/47, quest-fuzz
on all 32 E20 ids 0 bugs, lore OK (R-229), prefabs/achievements/gnome tests green, smoke + `?cutscene=` smokes OK.
Known gaps: map markers promised by rows 17/24/25/26/29/32 and the Speedway entry, clinic quick-heal and chart journal
item are not wired (no marker-unlock API yet); `framed-photograph` is not hung in the townhouse interior; the Tattler
works from a street desk (R-229); `?cutscenecheck` in the browser runs past the smoke tool's 8 s budget (the same
check runs in `scenes.test.ts`); no real device or browser play-through.
