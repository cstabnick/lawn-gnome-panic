Epic: E22-3 act IV wave B (story rows 68-70 and the lore pass part 2)
Depends on: E22-1 lore part 1 (done)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` and then `_menial-common.md` (same folder) in
full: they are the contract (environment, entry schema, house style, what menial lore means, where it goes, checks, report).**

## Goal
The places of Turfton (batch 3) and the coast feel lived-in: each has its everyday lore (shops and menus, notices, sayings, habits, a little
history) in its lore entry, and the game's own sign and menu strings there agree with it and carry its jokes.

## Your places
- Turfton's batch-3 places: Saucer Court (flats, stairwell, Hyssop's notes), the Double Pot and its sales floor, Founders' Green, Thorne Even-Estates (hoardings, show-homes), Drainpipe Court and the Gutter Bowls, the Kerbside Exchange, the Gnomecino, Bodega & Sons, the dealerships, Pay 'n' Glaze, the Lock-Up and Hangar Two
- The coast: Saltbucket Shore, the Boardwalk stalls, the Spokewheel, Long Spoon Pier, the Last Tube (Driftwood's tube hut), the Bathtub Queen's tours, Dunelow

## Files you may change
- `docs/lore/entries/apocrypha/*.md` entries of your places (existing and new). Not rulings.md, settings.md, canon.md.
- `games/gnome-theft-auto/src/coast/ (sign texts: life.ts, the users of sign.ts, config.ts strings)`
- `games/gnome-theft-auto/src/homes/data.ts (only name/plate strings)`
- `games/gnome-theft-auto/src/court/, src/skate/ (sign and notice strings only)`
- `games/gnome-theft-auto/src/city/, src/fringe/ (sign and notice strings only)`
- `games/gnome-theft-auto/src/living/hamletDunelow.ts (sign strings)`

Other workers write story quests (`src/quests/story/`, `src/cutscene/scenes/story/`) and the other places at the same
time: never touch their files.

## Done when
`npm run lore` prints `Lore OK`; every place in your group has an "## Everyday" section or its own everyday entries; the
game checks in `_menial-common.md` pass for every game file you changed.
