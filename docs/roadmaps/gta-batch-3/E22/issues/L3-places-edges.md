Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` in full: it is the contract (environment, files you
may touch, entry rules, checks, report).**

## Goal
Every named place, building, shop, track and vehicle model that batch 3 built at the first set of new edges, and in new
downtown Turfton, has one lore entry that agrees with the game.

## Your group (you own these entries; nobody else edits them in this epic)
Places and things (not people) of:
- Turfton (batch 3): Saucer Court, the Double Pot, Founders' Green, Thorne Even-Estates, Drainpipe Court and the Gutter
  Bowls, the Kerbside Exchange, homes (`src/homes/`), dealerships and the Lock-Up / Hangar Two / Mossbank Boathouse
  (`src/dealers/`, `src/lockup/`), the jobs' workplaces (`src/jobs/`, `src/workplaces/`).
- The coast: Saltbucket Shore, the Boardwalk, the Spokewheel, Long Spoon Pier, the Bathtub Queen, the Last Tube
  (`src/coast/`).
- Snowcap Rise and the Fells: Snowdrop Slope, the Woolly Sock Lodge, the Wool Run, Pail Pond (`src/winter/`).
- Rootwell (University, the library, the Anthill, the Observatory, Dean's Leap, Rootwell Field) and Pinwheel Ridge
  (`src/campus/`).
- Rutbottom (the Dirt Bowl) and Capwood (the Capwood Run, the Great Ring) (`src/rutbottom/`, `src/capwood/`,
  `src/raceTrack/`, `src/dirtCountry/`), the street-race routes (`src/streetRace/`).
- Hedgeworth Links (the holes, the clubhouse, the Kicked Board, the Members' Gate, Thrift's shed) (`src/golf/`).
- The countryside: Trellisdown Vineyard, Brassknock Manor, Windfall Croft, the hunters' camps (`src/country/`, `src/farm/`).
Not yours: the Underspan, Wader's Rest, Loamdeep, Pardonlin, the Unmown, the hamlets, the Hatbrim, Pebblewick, the
Dust Flats and Fort Sandpit (the societies-and-second-expansion worker owns them); people (two other workers).

## Do
1. For each area: list the named places and things in its code (grep `name: '`, `label:`, sign texts, interior
   names, track names) and in its epic's roadmap (`docs/roadmaps/gta-batch-3/E<nn>/roadmap.md`, "Result" and
   "deferred" notes). `npm run lore -- find` each; missing ones get an entry (`kind: place` or `object`); entries that
   disagree with the code (coordinates, names, what is there) get fixed.
2. Check each area's settings line in `docs/lore/settings.md` names its places; propose additions in your report.

## Files you may change
`docs/lore/entries/apocrypha/*.md` entries of your group (existing and new). No game files.

## Done when
`npm run lore` prints `Lore OK`; every named place in your group resolves with `npm run lore -- find`.

## Out of scope
People, the societies, the second expansion, act IV places, rulings.md, settings.md.
