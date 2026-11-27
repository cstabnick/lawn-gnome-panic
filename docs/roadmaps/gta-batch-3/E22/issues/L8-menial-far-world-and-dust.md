Epic: E22-3 act IV wave B (story rows 68-70 and the lore pass part 2)
Depends on: E22-1 lore part 1 (done)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` and then `_menial-common.md` (same folder) in
full: they are the contract (environment, entry schema, house style, what menial lore means, where it goes, checks, report).**

## Goal
The places of the second expansion and the act IV places feel lived-in: each has its everyday lore (shops and menus, notices, sayings, habits, a little
history) in its lore entry, and the game's own sign and menu strings there agree with it and carry its jokes.

## Your places
- Pardonlin (Café Pardon's menu nobody may order from, the bakery, the Grand Platz queue, Radio Adagio's notices, the Quays), the Wickets and the Thymes
- The Unmown (the Ranger Station's book and rules, the hides' tallies, the Last Dandelion's bench), the High Tarn, the Hatbrim (the Top Hat café: Gap Tea and Hairpin Buns, the summit register on the Bobble)
- The act IV places: the Dust Flats and the overlook safehouse, the Desert Airfield (Wally's caravan, Hangar Two), Fort Sandpit (the Spade Guard's rosters, the lost-property shed), Pebblewick (the square, the bell, the bus, the water tower, the hay barn, the reeve's minutes)

## Files you may change
- `docs/lore/entries/apocrypha/*.md` entries of your places (existing and new). Not rulings.md, settings.md, canon.md.
- `games/gnome-theft-auto/src/pardonlin/ (life.ts, districts/*.data.ts, interiors.ts: sign/menu strings)`
- `games/gnome-theft-auto/src/unmown/ (vignettes.ts, station.ts strings)`
- `games/gnome-theft-auto/src/mountainRoutes/ (life.ts, brimGapPlan.ts strings)`
- `games/gnome-theft-auto/src/living/highTarn.ts, src/outskirts/ (npcData.ts, sights.ts, town.ts strings)`

Other workers write story quests (`src/quests/story/`, `src/cutscene/scenes/story/`) and the other places at the same
time: never touch their files.

## Done when
`npm run lore` prints `Lore OK`; every place in your group has an "## Everyday" section or its own everyday entries; the
game checks in `_menial-common.md` pass for every game file you changed.
