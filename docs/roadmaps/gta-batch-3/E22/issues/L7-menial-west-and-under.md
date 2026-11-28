Epic: E22-3 act IV wave B (story rows 68-70 and the lore pass part 2)
Depends on: E22-1 lore part 1 (done)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` and then `_menial-common.md` (same folder) in
full: they are the contract (environment, entry schema, house style, what menial lore means, where it goes, checks, report).**

## Goal
The places of the west edges and the societies feel lived-in: each has its everyday lore (shops and menus, notices, sayings, habits, a little
history) in its lore entry, and the game's own sign and menu strings there agree with it and carry its jokes.

## Your places
- Hedgeworth Links (the clubhouse bar menu, the members' notices, the Kicked Board, Thrift's shed)
- The countryside: Trellisdown Vineyard (the tasting menu), Brassknock Manor, Windfall Croft, Espalier End, the hunters' camps
- The societies: the Underspan (Hogweed's workshop price list, the Roost), Wader's Rest (the Flock's tent, the sermon rota), Loamdeep (the six halls, the mole jobs' board, Subsoil Radio, the Under-Chorus)

## Files you may change
- `docs/lore/entries/apocrypha/*.md` entries of your places (existing and new). Not rulings.md, settings.md, canon.md.
- `games/gnome-theft-auto/src/golf/ (life.ts, clubhouse.ts sign/menu strings)`
- `games/gnome-theft-auto/src/country/ (trellisLife.ts, estatesLife.ts, sign strings)`
- `games/gnome-theft-auto/src/farm/ (sign strings)`
- `games/gnome-theft-auto/src/societies/ (sign/notice strings)`
- `games/gnome-theft-auto/src/living/hamletEspalier.ts (sign strings)`

Other workers write story quests (`src/quests/story/`, `src/cutscene/scenes/story/`) and the other places at the same
time: never touch their files.

## Done when
`npm run lore` prints `Lore OK`; every place in your group has an "## Everyday" section or its own everyday entries; the
game checks in `_menial-common.md` pass for every game file you changed.
