# E21 roadmap: story act III (quests 36-53)

Brief: [../E21-story-act-3.md](../E21-story-act-3.md). Source items L45, L83, L84 (rows 36-53), L95, L105, L117 (polish).
Outline: `docs/design/gnome-theft-auto/story-outline.md` "## Act 3" (rows 36-53, extended #46 and #52). Contract for
every quest issue: [issues/_quest-common.md](issues/_quest-common.md). Build protocol and layout: E20's
([../E20/roadmap.md](../E20/roadmap.md)).

## Adjusted to the merged state

Every content epic is merged (E11-E17, E19, E26, E28-E32), so every far edge act III visits exists. The outline's
"needs new kind" objectives (ski-run, tow-ski, ride-passenger, golf-hole, dig, interior-visit) map onto the areas' own
quest probes (`WINTER_PROBES`, `COAST_PROBES`, `GOLF_PROBES`, `SOCIETY_PROBES`) and the visit `interior:` gate, which the
quest sim already solves: no new objective kind. E20's open item "no API to unlock map markers / journal items" is
solved here (issue M, `src/quests/storyMarks.ts`).

## Layout (the lead's setup, committed with the epic)

- `src/quests/story/<NN>-<slug>.ts` rows 36-53, `actIII.ts` (spread into `story/index.ts`); scenes
  `src/cutscene/scenes/story/m<NN>-<slug>.ts` + `actIII.ts` (spread into `scenes/index.ts`); stages
  `src/quests/stages/story/s<NN>-<slug>.ts` (in `stages/story/index.ts`).
- Kept rows #36 `ch3-kiln-resin-ice` and #53 `ch3-tundra-drift-run` moved out of `chapter3.ts` (now empty) into their
  story files, comms with them; their scenes stay in `ch3b.ts` / `ch3c.ts`. #53's prereq is `m52-the-test-cut`.
- Setup stubs for every act III quest id (the whole prereq chain exists before any worker starts), so workers replace a
  stub and never wait on another row. `storyRows.ts` gives the extended parts their row.
- The 19 E18 `planned` unlocks for rows 37-52 and the world changes W09-W14 moved onto their rows in the setup; W14's
  builder `worldChanges/rows/mownScar.ts` (stub, filled by A8).
- Props `packages/prefabs/src/catalog/gta-story-act3.ts`, gear `gta-story-gear3.ts`.

## Shape

| epic | issues | done when |
|---|---|---|
| E21-1 foundation | C cast presets/intros/voices (11 keys), P story props (13), G gear + 6 achievements, M story marks (map markers + journal Items tab) | build, tests, prefabs/achievements/gnome tests |
| E21-2 wave A | A1 rows 36+53 (rewrites), A2 37+38, A3 39+40, A4 41+42, A5 43+44, A6 45+51, A7 row 46 (extended), A8 row 52 (extended, W14) | build, tests, cutscene report, sim + fuzz per quest |
| E21-3 wave B | B1 47+48, B2 49+50 | as above; then lead integration |

14 issues. Models: Sonnet general-purpose for quest writing, scenes and direction and the marks engine; Opus for the
extended rows 46 and 52; Haiku for props and gear. At most 8 at once. No dependency inside an epic; wave B is a second
epic only for the 8-worker cap.

## Quest-to-area table (contract for E22: every new area has a main quest)

| row | id | area (region) |
|---|---|---|
| 36 | ch3-kiln-resin-ice | Frostbite Fells |
| 37 | m37-snowdrop-slope | Snowcap Rise (Snowdrop Slope, Woolly Sock Lodge) |
| 38 | m38-pail-pond | Snowcap Rise (Pail Pond) |
| 39 | m39-couch-surfing | downtown (Saucer Court, the Under-Deck culvert) |
| 40 | m40-the-capwood-run | Capwood (the Capwood Run, toadstools) |
| 41 | m41-pinwheel-ridge | Pinwheel Ridge (wind farm) |
| 42 | m42-rutbottom-impound | Rutbottom (Dirt Bowl) |
| 43 | m43-saltbucket-boardwalk | Saltbucket Shore (boardwalk, Spokewheel, tow-ski) |
| 44 | m44-the-bathtub-queen | Saltbucket Shore (Long Spoon Pier, the Bathtub Queen) |
| 45 | m45-rootwell-admissions | Rootwell (campus, library) |
| 46 | m46-starfall-at-the-anthill (+p1-p3) | Rootwell (the Anthill Observatory, Dean's Leap, Rootwell Field) |
| 47 | m47-hedgeworth-links | Hedgeworth Links |
| 48 | m48-the-groundskeepers-secret | Hedgeworth Links (the ninth, Thrift's shed) |
| 49 | m49-loamdeep | Loamdeep |
| 50 | m50-trellisdown-tasting | Trellisdown (vineyard, Brassknock Manor) |
| 51 | m51-the-flock-stands | Wader's Rest -> Hedgeworth |
| 52 | m52-the-test-cut (+p1-p3) | Hedgeworth Links (the test line), the Burrow Door |
| 53 | ch3-tundra-drift-run | Frostbite Fells -> Dust Flats Overlook |

Areas with no act III main quest: the Unmown preserve and Pardonlin (E28/E30/E31: the outline gives them to act IV or
side quests), the Underspan and Mossy Wood (acts I-II).

## Result (all 14 issues done; nothing deferred)

| row | id(s) | intro cards (first appearance) | W-ids | sim |
|---|---|---|---|---|
| 36 | ch3-kiln-resin-ice (rewrite: Tansy's scroll, Theo points north) | Loam, Thermos Theo | - | pass |
| 37 | m37-snowdrop-slope (ski run via `winter-ski-runs`) | Gentian | - | pass |
| 38 | m38-pail-pond (inspect three ice holes, the sock map) | - | - | pass |
| 39 | m39-couch-surfing (passenger Pip, Hyssop's stairwell, the culvert reunion) | Silt-Diver Sal | W09 | pass |
| 40 | m40-the-capwood-run (race `capwood-run`, Chanterelle's fine, the charter torn) | Chanterelle | - | pass |
| 41 | m41-pinwheel-ridge (cut, crack, crack, spin) | Ragwort | W10 | pass |
| 42 | m42-rutbottom-impound (3-lap dirt race, impounded ride out) | Clary | - | pass |
| 43 | m43-saltbucket-boardwalk (Spokewheel + tow-ski probes, sincere outro) | Marram | - | pass |
| 44 | m44-the-bathtub-queen (boat out, boarding, the blades home) | Samphire | W11 | pass |
| 45 | m45-rootwell-admissions (registrar, the Dean's lecture, `uni-library`) | Lovage, Betony | - | pass |
| 46 | m46-...-p1 Night Class, -p2 The Sugar Toll, -p3 The Lens, m46 Dean's Leap | Wally | W12 | pass x4 |
| 47 | m47-hedgeworth-links (one hole vs Basil: `golf-par-holes`) | Peony, Basil | - | pass |
| 48 | m48-the-groundskeepers-secret (passenger the moles, trap-line, the ball) | - | - | pass |
| 49 | m49-loamdeep (roots, lamps, post: the mole-job probes; Moleman's decks) | DJ Moleman | W13 | pass |
| 50 | m50-trellisdown-tasting (manor interior, photograph the ledger; Vesper sees you) | Countess Wisteria | - | pass |
| 51 | m51-the-flock-stands (the Standing Lady on a roller, the gala date) | - | - | pass |
| 52 | m52-...-p1 Tee Time, -p2 Mow Line, -p3 Against the Deck, m52 Through the Hedge | - | W14 (built: `worldChanges/rows/mownScar.ts`) | pass x4 |
| 53 | ch3-tundra-drift-run (rewrite: Bracken lends the Stone; Tansy's ridge call; prereq m52) | - | - | pass |

Unlock moves (setup): all 19 E18 `planned` unlocks for rows 38-52 moved onto their rows (`sq-snowdrop-sled-trials` m38,
`sq-pail-pond-lines` m39, `race-capwood-open` + Tessie m40, `sq-capwood-cap-count` m41, `race-rutbottom-knobbly` m42,
`race-lowrider-derby` m43, `sq-rutbottom-heats` m44, `coast-spokewheel-gondola` + `coast-boardwalk-tubing` m45,
`coast-bathtub-tours` + `coast-queens-treasure` m46, `sq-rootwell-lost-essay` m47, `sq-anthill-rent` m48,
`sq-hedgeworth-pro-lesson` m49, `sq-hedgeworth-ninth-green` + `sq-loamdeep-lamps` + `sq-loamdeep-under-chorus` m50,
`sq-hedgeworth-members-cup` m52); W09-W14 `after` moved onto m39/m41/m44/m46/m49/m52. Not built (no quest yet):
`sq-pinwheel-linemen` (#42), `sq-trellisdown-pickers` (#51).

Engine: `storyMarks.ts` (map markers + journal Items tab; E20's rows 17/26/29/32 filled too); crack targets snap to a
walk point only within 30 m (the far edges have none nearby). Lore: R-233 (the test is on the gala night, the Even Cut
on the longest day; the outline row 51 is corrected).

Checks: build, game tests, cutscene report 0 faults in Story A/B, quest-sim suites green, quest-sim 24/24 E21 ids, quest-fuzz
48 runs 0 bugs, lore OK, prefabs/achievements/gnome tests green.

Known gaps and reductions: the Woolly Sock Lodge as a save point/wardrobe, Ragwort's spare-parts shop, the student badge,
keeping the dirt bike (no grant API) and the waiter outfit are said in scenes and doneText only; homes do not change with
the story (Pip's couch, Driftwood's tube hut stay notes in `homes/data.ts`); interior beats (Moleman's burrow, the manor
hall, the library window) are staged as world sets beside the interiors; W14 builds the Hedgeworth side only (not the
Flock at Wader's Rest); no scene was watched in a real browser beyond the smokes.
