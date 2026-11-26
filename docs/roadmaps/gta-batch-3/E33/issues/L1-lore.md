Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` (environment). Other workers edit game code at the same time; you only
touch `docs/lore/`.

## Goal
The Hatbrim, its four routes, the Top Hat café and the two named residents are in the lore, decided by rulings, so the
dressing workers (next wave) and later epics write to one canon.

## Read first
- `docs/lore/README.md` (entry schema, how to add a ruling), `docs/lore/canon.md` (house style, first screen)
- `docs/lore/entries/apocrypha/snowcap-rise.md`, `high-tarn.md`, `capwood-run.md` (examples, and places you link to)
- the end of `docs/lore/rulings.md` (the last ruling is R-222; the format)

## Change
- `docs/lore/rulings.md` — append three rulings (date 2026-11-25, applies to apocrypha, gnome-theft-auto):
  - **R-230** Q: "Where is Snowcap Rise's real high ground, and what is it called?" Ruling: the Hatbrim, a short range on
    the north edge between Mittenholt and the High Tarn. Seen from Mittenholt it looks like a hat left on the fence: Old
    Pate (a bald dome, about 72 m) is the crown's near side, Brim Gap (about 40 m) the dent, and the Bobble (about 105 m)
    the bobble on top: the highest point in the yard, higher than Snowdrop Slope's mountain (about 85 m). Snow lies on it
    above about 32 m all year. Why: E33 needs a range for the mountain routes, and the lore calls the Rise "the high
    country" without a peak.
  - **R-231** Q: "Who made the Hatbrim's routes, and who may use them?" Ruling: the Brim Gap Road (cars, two-way, seven or
    so numbered hairpins) was built by the HOA's Highways Sub-Committee "to plough it", which it has never done; the
    Hatband is an old goat shelf round the Bobble, bikes and buggies only, kept that way by bollards rather than by the
    sign; the Brim Walk is waymarked by cairns and nobody owns it; the Spine Cut was blasted through the Highland Spine
    for the Pinwheel Ridge works, and the Keyhole, a rock arch over the road, was left standing because the surveyor
    "had not finished measuring it". The Summit Register on the Bobble has been kept since before the HOA, and signing
    it is a rite: "you were here, and so was your hat". Why: E33 builds them and the dressing needs one story.
  - **R-232** Q: "Who keeps the Top Hat, and who is the gnome at the Keyhole?" Ruling: **Velma Crown** keeps the Top Hat,
    the café at Brim Gap whose roof is a giant black top hat; she serves Gap Tea and Hairpin Buns and counts every car
    that stops ("Cars today: 3. Buns: 41."). **Plumb Bob** is the surveyor at the Keyhole, who has measured the arch every
    day for years, waiting to be sure, and has never been sure. Why: E33 puts them on screen.
- New entries (tier apocrypha, setting apocrypha, era now, status draft, games [gnome-theft-auto]), each with the usual
  sections ("What gnomes say" with two quotes, "The truth", "In the games" with coordinates as "near (x, z)" and the code
  path `games/gnome-theft-auto/src/mountainRoutes/`, "Loose threads"):
  - `docs/lore/entries/apocrypha/hatbrim.md` (kind place; aliases [the Bobble, Old Pate, Brim Gap]; related
    [snowcap-rise, high-tarn, band-hamlets, brim-gap-road, hatband, brim-walk]); the Bobble near (700, -1700), Old Pate
    near (750, -1500), Brim Gap near (705, -1585).
  - `brim-gap-road.md` (kind place; aliases [the Pass]; related [hatbrim, top-hat-cafe, hoa]): from the north band road
    east of Mittenholt, hairpins to Brim Gap, down past the High Tarn.
  - `hatband.md` (kind place; related [hatbrim, brim-gap-road]): the shelf, the World's Edge lookout over the north fence.
  - `brim-walk.md` (kind place; aliases [Pate's Bothy, the Summit Register]; related [hatbrim, high-tarn, band-hamlets]).
  - `spine-cut.md` (kind place; aliases [the Keyhole]; related [plumb-bob, pinwheel-ridge, capwood]): through the Highland
    Spine near (520, -1170), from the north band road to the east band road.
  - `top-hat-cafe.md` (kind place; aliases [the Top Hat]; related [velma-crown, brim-gap-road, hatbrim]).
  - `velma-crown.md` and `plumb-bob.md` (kind person; related to their place).
  Check every `related` id exists (`npm run lore -- find <word>`) or drop it; `pinwheel-ridge`, `hoa`, `band-hamlets`
  exist today.
- `docs/lore/entries/apocrypha/snowcap-rise.md`: in "In the games", add one sentence that the Hatbrim (R-230) stands on
  the north edge with the Brim Gap Road, the Hatband, the Brim Walk and the Spine Cut (batch 3, E33), and add `hatbrim`
  to `related`.

## Done when
- `npm run lore` passes (it regenerates `docs/lore/INDEX.md`; that change is expected).
- `npm run lore -- find Hatbrim` lists the new entries.

## Out of scope
Everything outside `docs/lore/`.
