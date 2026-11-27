# E22 roadmap: story act IV (quests 54-70) and the final lore pass

Brief: [../E22-story-act-4-lore-and-finish.md](../E22-story-act-4-lore-and-finish.md). Source items L84 (rows 54-70 with
the extended pivotal quests #64 and #70), L86 (final lore pass), L45, L83, L95, L105, L117 (polish). **Scope change:**
the batch finish (demos, PR description, full-batch checks) is not E22's: the editorial review phase R1 follows.
Outline: `docs/design/gnome-theft-auto/story-outline.md` "## Act 4". Contracts for the issues:
[issues/_quest-common.md](issues/_quest-common.md) (quests), [issues/_lore-common.md](issues/_lore-common.md) and
[issues/_menial-common.md](issues/_menial-common.md) (lore). Build protocol and layout: E20's and E21's.

## Layout (the lead's setup, committed first)

- `src/quests/story/<NN>-<slug>.ts` rows 54-70 in `actIV.ts` (spread into `story/index.ts`); the extended rows are
  split over two files each so two writers work at once: `64a-all-hats.ts` (p1, p2) + `64-all-hats.ts` (p3, final),
  `70a-even-cut.ts` (p1, p2) + `70-even-cut.ts` (p3, final). Scenes `cutscene/scenes/story/m<file>.ts` + `actIV.ts`;
  stages `quests/stages/story/s<file>.ts`.
- Kept rows 55/57/59 (`ch4-*`) and 70 (`ch5-even-cut`) moved out of `chapter4.ts` / `chapter5.ts` (now empty) into
  their story files with their comms and plans; their scenes stay in `ch4*.ts` / `ch5.ts`.
- **The finale in parts, save-compatible.** The old five objectives keep their order across the parts: p1 the Vanguard
  (crack), p2 the deck drop (air-drop), p3 the deck fight (`boss-combine` `phase: 'guards'`), final the jam
  (`boss-combine` `phase: 'jam'`), crack Vesper, the choice. `quests/questSave.ts` `migrateFinaleSave` rewrites a
  pre-E22 save on load: a finished finale stays finished and its parts are marked done; an active one resumes in the
  part that holds its step (`quests/finaleSave.test.ts`). Merges keep the recorded ending now.
- **Story grants** (closes E20/E21's "reduced to dialogue" vehicle gap): `storyMarks.ts` rows can carry `grants`
  (a garage deed, a vehicle by kind and name); `app.ts` applies them once their quest is done, also for old saves:
  Hangar Two and "The Crew's Crop Duster" after #55, the "Impound Knobbly" after #42.
- Unlock moves: `race-snail-endurance` -> m54, `sq-hum-at-three` -> m60, `sq-porcelain-support` -> m66; W15 `after`
  -> m60; W16 builder `worldChanges/rows/coalitionCamp.ts`; W19 (new) "Cam's broom" after the finale and m62, built in
  `rows/epilogue.ts` from row 62's choice (`ctx.choiceOf`).
- "The Whole Story" (`gta-the-whole-story`): `app.ts` unlocks it once every `STORY_ROWS` id is done.
- Props `packages/prefabs/src/catalog/gta-story-act4.ts`, gear `gta-story-gear4.ts`.
- Lore R-234: the second expansion in act IV (the Mayor at Café Pardon in #63, the vine to the Unmown in #65, the
  coalition's beacon on the Bobble in #64 p2), Hangar Two signed over (#55), the Knobbly (#42).

## Shape

| epic | issues | done when |
|---|---|---|
| E22-1 foundation | C cast (yarrow, 'burdock haybright', hector, velma), P 16 story props, G 8 achievements + gear, W W16 coalition camp; lore part 1: L1 existing cast, L2 new people, L3 edge places, L4 societies + far world + act IV places | build, tests, prefabs/achievements/gnome tests, lore OK |
| E22-2 wave A | A1 rows 54+56, A2 kept 55+57+59, A3 58+60, A4 61+62, A5 63+65, A6 row 64 p1+p2 (Opus), A7 row 64 p3+final (Opus), A8 66+67 | build, tests, cutscene report, sim + fuzz per quest |
| E22-3 wave B | B1 68+69, B2 row 70 p1+p2 (Opus), B3 row 70 p3+final (Opus); lore part 2 (menial lore): L5 Turfton + coast, L6 north + east, L7 west + societies, L8 far world + act IV places | as above; lore OK; then lead integration |

23 issues. Models: Sonnet general-purpose for quest writing, scenes, cast, the camp and lore; Opus for the extended rows
64 and 70; Haiku for props and gear. At most 8 at once (the waves overlap as slots free). No dependency inside an epic.

## Quest-to-area table (act IV)

| row | id | area (region) |
|---|---|---|
| 54 | m54-the-heist-board | Dust Flats overlook, Desert Airfield |
| 55 | ch4-runway-flares | Desert Airfield, Dust Flats |
| 56 | m56-mortar-for-a-mower | the Ring Road, the Skyway, the Underspan |
| 57 | ch4-sandpit-drop | Fort Sandpit |
| 58 | m58-the-reeves-barn | Pebblewick, Hangar Two |
| 59 | ch4-spade-truce | Fort Sandpit gate |
| 60 | m60-the-moles-dig | the dunes south of Fort Sandpit, the armory |
| 61 | m61-diggs-medal | Pebblewick (Diggs's bungalow), the fort gate |
| 62 | m62-cams-cell | downtown (the Double Pot lockup) |
| 63 | m63-four-taps | the Mulch Club, Pardonlin (Café Pardon) |
| 64 | m64-all-hats (+p1-p3) | the canal and New Puddle, the airfield and the Hatbrim (the Bobble, Brim Gap), Rutbottom road, the overlook camp |
| 65 | m65-the-countess-relents | Trellisdown (Brassknock Manor), the Unmown (Ranger Station) |
| 66 | m66-porcelain-hearts | Mossy Wood (the porch) |
| 67 | m67-emergency-assessment | downtown (City Hall, Founders' Green) |
| 68 | m68-lights-out | Saucer Court, Kerb Row, Cloverfield, Bodega's, Side-Valve |
| 69 | m69-the-combine-wakes | Turfton fringe (Even-Estates, the Compost Heap), the meridian |
| 70 | ch5-even-cut (+p1-p3) | the meridian, the Grand Combine |

## Result (all 23 issues done, plus a story.md sync; nothing deferred from the outline's rows)

| row | id(s) | intro cards | W-ids | sim |
|---|---|---|---|---|
| 54 | m54-the-heist-board (chapter 4 title; photograph three sides, Wally's caravan, passenger Wally) | - | - | pass |
| 55 | ch4-runway-flares (kept; Wally's briefing, Hangar Two + Crop Duster granted) | - | - | pass |
| 56 | m56-mortar-for-a-mower (night flight to the Underspan, the "almost certainly" rig) | - | - | pass |
| 57 | ch4-sandpit-drop (kept; "the almost-certainly one") | Diggs | - | pass |
| 58 | m58-the-reeves-barn (impeller, Whirligig to the water tower, the hay barn) | Yarrow | - | pass |
| 59 | ch4-spade-truce (kept; the bible fix: Diggs's line, the armory sealed) | - | - | pass |
| 60 | m60-the-moles-dig (follow Nubbin, dig, hold the mouth, the salute) | - | W15 | pass |
| 61 | m61-diggs-medal (the bungalow interior, the lost-property shed) | - | - | pass |
| 62 | m62-cams-cell (the Double Pot lockup, choice A/B) | - | W19 (with 70) | pass x2 |
| 63 | m63-four-taps (the Mayor fetched from Café Pardon, Pardonlin) | Hector | - | pass |
| 64 | m64-all-hats-p1 By Water, -p2 By Air (the Bobble beacon), -p3 By Road, m64 By Root | Velma | W16 (built) | pass x4 |
| 65 | m65-the-countess-relents (the vine to the Unmown) | Burdock Haybright | - | pass |
| 66 | m66-porcelain-hearts (the photograph) | Clara | - | pass |
| 67 | m67-emergency-assessment (City Hall side door, Juniper out) | - | - | pass |
| 68 | m68-lights-out (four friends home, the roof) | - | - | pass |
| 69 | m69-the-combine-wakes (evacuation, Hyssop's crossing) | - | - | pass |
| 70 | ch5-even-cut-p1 Air Support, -p2 Deck Drop, -p3 The Gilded Lawn-Throne, ch5-even-cut (jam, the hat, A/B) | - | W17, W19 | pass x5 |

Engine (lead): boss-combine `phase`; finale old-save migration (+ merges keep the ending); story grants; W19 Cam's
broom; "The Whole Story" achievement; the quest-sim inspect solver leaves its vehicle first; a passenger walks back to
the pickup when the ride is wrecked or driven off mid-boarding; row 60's dune stage moved 10 m (it shifted the outer
settlements' plan); the golden layout regenerated for the new givers and stage sets; hold rotations for six new props.

Lore (L86): 4 + 4 workers. Parts 1 and 2: about 110 entries added (people of the new cast and the area epics, Dr Clod Furrow,
the Flock's members, the five mole families and their halls, Pardonlin's districts, the Unmown's places, the hamlets,
the Hatbrim, the act IV places, a few shops), about 90 corrected against the bible and the code; Vesper's pronouns settled (he).
Part 2: an `## Everyday` section (shops and menus, notices, sayings, habits, small history) for every batch-3 place.
Rulings R-234 (act IV world use), R-235 (contradictions settled), R-236 (everyday lore); `settings.md` updated.

Checks: build, game tests (520 files), cutscene report 0 faults in Story A/B and Side A/B, quest-sim suites green,
quest-sim 25/25 runs on every E22 id (both endings, both Cam choices), quest-fuzz 50 runs 0 content/bot failures,
lore OK, prefabs/achievements/gnome tests green.

Known gaps: quest-fuzz still finds a rare passenger pickup stall after the player's ride is destroyed or sunk mid-pickup
(m68 Granny, 1 of 24 runs after the fix); scenes cannot stand actors on the moving Combine (the deck is shown from the
player's eyes), nor inside interiors; Vesper has no bare-headed model (his cone hat is drawn porcelain white); the
convoy in row 64 p3 is Lulu alone in play (the cars are in the scenes); the Bathtub Queen's scale differs between Long
Spoon Pier and New Puddle; suggested new signs from the menial-lore pass (Rutbottom pits, the lodge porch, Ragwort's
hut, the clubhouse bar, the lost-property shed, ...) are listed in the lore entries but not built; the batch finish
(demos, PR text) is R1's.
