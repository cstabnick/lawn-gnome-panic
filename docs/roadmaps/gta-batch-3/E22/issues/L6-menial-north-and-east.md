Epic: E22-3 act IV wave B (story rows 68-70 and the lore pass part 2)
Depends on: E22-1 lore part 1 (done)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` and then `_menial-common.md` (same folder) in
full: they are the contract (environment, entry schema, house style, what menial lore means, where it goes, checks, report).**

## Goal
The places of the north and east edges feel lived-in: each has its everyday lore (shops and menus, notices, sayings, habits, a little
history) in its lore entry, and the game's own sign and menu strings there agree with it and carry its jokes.

## Your places
- Snowcap Rise and the Fells: Snowdrop Slope, the Woolly Sock Lodge (its menu: Hot Cocoa), Pail Pond, Thermos Theo's bend, Mittenholt
- Rootwell (the University, the library, the Anthill, the Observatory, the ants' rent), Pinwheel Ridge (Ragwort's hut)
- Rutbottom (the Dirt Bowl, the impound, the starter's tower) and Capwood (the Warden's fines, the Great Ring)

## Files you may change
- `docs/lore/entries/apocrypha/*.md` entries of your places (existing and new). Not rulings.md, settings.md, canon.md.
- `games/gnome-theft-auto/src/winter/ (sign/menu strings)`
- `games/gnome-theft-auto/src/campus/ (life.ts and sign strings)`
- `games/gnome-theft-auto/src/rutbottom/, src/capwood/, src/dirtCountry/ (sign strings)`
- `games/gnome-theft-auto/src/living/hamletMittenholt.ts (sign strings)`

Other workers write story quests (`src/quests/story/`, `src/cutscene/scenes/story/`) and the other places at the same
time: never touch their files.

## Done when
`npm run lore` prints `Lore OK`; every place in your group has an "## Everyday" section or its own everyday entries; the
game checks in `_menial-common.md` pass for every game file you changed.
