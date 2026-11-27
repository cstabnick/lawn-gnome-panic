Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` in full: it is the contract (environment, files you
may touch, entry rules, checks, report).**

## Goal
The underground societies, the second expansion and the places of the story's last act have complete, consistent lore:
every faction, clan, member, place and object they name has an entry that agrees with the game and with the act IV story.

## Your group (you own these entries; nobody else edits them in this epic)
- The societies (E17, `src/societies/`, `docs/roadmaps/gta-batch-3/E17/contracts.md`): the Underspan and the
  Underspanners (the workshop, the Updraft, the Roost); Wader's Rest and **the Flock of the One Leg, including every
  named member** (the E17 flock code and lore name more members than have entries: find them, e.g. grep `name: '` in
  `src/societies/` and the Flock entries); Loamdeep and **the mole clans** (the six halls, the four mole jobs, the
  Under-Chorus, DJ Moleman, Old Mother Tumblesoil's Burrowfolk: name and describe each clan the code or lore mentions,
  and decide what is missing, e.g. which clan digs, which keeps the lamps, which carries the post).
- The second expansion: Pardonlin's districts and places (`src/pardonlin/`), the Wickets, the Thymes, the Unmown (the
  Long Meadow, Reedmere, Oldroot Wood, the hides, the Last Dandelion, the Ranger Station) (`src/unmown/`), the hamlets
  Espalier End, Mittenholt, Dunelow and the High Tarn (`src/living/`), the Hatbrim and its routes (`src/mountainRoutes/`).
- Act IV places and things: the Dust Flats, the overlook safehouse, the Desert Airfield, Fort Sandpit and the Spade
  Guard, Pebblewick (its square, water tower, hay barn, the reeve's house, Diggs's tin bungalow), the HOA lockup in the
  Double Pot, the Grand Combine and its four parts (deck, guidance/the Even Line, power, money), the Gilded
  Lawn-Throne, the coalition (its name if any, its flag, the overlook camp of W16), and the three act IV world-use
  decisions of ruling **R-234** (the Mayor at Café Pardon, the vine in the Unmown, the beacon on the Bobble): write
  the entries those need (e.g. `hatbrim-beacon`, the coalition) and add an "In the games" line to the existing
  entries they touch (Café Pardon, the Unmown Ranger Station, the Bobble/Hatbrim).
Not yours: people outside the Flock and the moles (two other workers); the first edges and Turfton (another worker).

## Do
For each: find the entry; missing: write it; present: check it against the code and fix what disagrees. Settle
contradictions (code is what players see; propose a ruling line for each). Read the act IV outline
(`docs/design/gnome-theft-auto/story-outline.md` "## Act 4") so the entries say what the story will do there without
spoiling more than a "The truth" section may.

## Files you may change
`docs/lore/entries/apocrypha/*.md` entries of your group (existing and new). No game files.

## Done when
`npm run lore` prints `Lore OK`; every named thing in your group resolves with `npm run lore -- find`.

## Out of scope
Other people, the first edges and Turfton, rulings.md, settings.md.
