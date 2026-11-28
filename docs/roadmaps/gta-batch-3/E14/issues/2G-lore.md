Epic: E14-2 (content on the track registry)
Depends on: none
Worker: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, rules). You only touch files under `docs/`.

## Goal
The lore for what E14 builds: four rulings, one new entry, and the existing Capwood / Rutbottom entries updated from
"Planned" to what is built, so every name the game uses is on record.

## Read first
- `docs/lore/canon.md` (rules of the gnome world), `docs/lore/rulings.md` (format: see the last entries R-182..R-184 at
  the end of the file), `docs/lore/README.md` if present (entry front-matter format)
- `docs/lore/entries/apocrypha/capwood.md`, `capwood-run.md`, `rutbottom-dirt-bowl.md`, `clary-mudguard.md`,
  `chanterelle-stook.md`, `the-carburettors.md` (the existing entries)
- `docs/design/gnome-theft-auto/side-quest-schedule.md` lines ~75-130 (the area-coverage table)

## Change
- `docs/lore/rulings.md`: append four rulings in the existing format:
  - **R-189 Cap-water fords never flood an engine.** Cap-water, the thick slow water that seeps out of Capwood's buried
    Tall-One woodpile, soaks a mower's engine only a little: enough to slow it, never enough to sputter or stall. Ordinary
    water elsewhere still floods (the "waterlogged mowers" ruling stands). In game: `WATERLOG.fordCap`.
  - **R-190 Two-Ton Teasel is Teasel Mudguard.** The Fizz Cup racer Two-Ton Teasel's family name is Mudguard; he is
    Marshal Clary Mudguard's older brother, and he wants a rematch on the dirt (side quest Rutbottom Heats). She has
    never let him win a start.
  - **R-191 The Knobbly.** The Knobbly Dirt-Mower is a push-mower bike rebuilt for dirt by Rutbottom's mechanics: knobbly
    tyres, long forks, a number plate. Sold at the dealer, and parked at the Dirt Bowl gate for anyone who signs Clary's
    clipboard (nobody checks the clipboard).
  - **R-192 Capwood glows at night.** Capwood's caps glow faintly after dark (spores, not magic: gnomes argue about
    this); the brightest glow is the Great Ring, a fairy ring of toadstools round a clearing. Bruising a cap is a fine
    under Section Nine of the Warden's rules.
- `docs/lore/entries/apocrypha/the-knobbly.md` (new): an entry for the dirt bike, front-matter like the other entries
  (id `the-knobbly`, name "The Knobbly Dirt-Mower", related `rutbottom-dirt-bowl`, `clary-mudguard`), 1-2 paragraphs.
- Update the "Planned (batch 3)" lines in `capwood.md`, `capwood-run.md`, `rutbottom-dirt-bowl.md`, `clary-mudguard.md`,
  `chanterelle-stook.md` to "Built (E14):" facts: Capwood at x 100..400, z -1280..-1080 with the Warden's stalk hut at
  (360, -1245), the Great Ring at (150, -1125), glowing caps (R-192); the Capwood Run from the Frostbite Fells paddock
  (90, -760) over the Fells summit to the finish near (150, -1300) with two Cap-water fords (R-189); the Dirt Bowl at
  (1200, -650), a banked dirt circuit with whoops and jumps, Clary's starter's tower by the start; side quests
  "Rutbottom: Knobbly Heat" (`race-rutbottom-knobbly`), "Rutbottom Heats" (`sq-rutbottom-heats`), "The Capwood Run:
  Open Stage" (`race-capwood-open`), "The Cap Count" (`sq-capwood-cap-count`). Keep the story-quest notes (rows 40, 42)
  as they are. Add the new rulings' ids to the entries' related rulings if the format has such a field.
- `docs/design/gnome-theft-auto/side-quest-schedule.md`: in the area-coverage table, `Capwood (E12)` becomes
  `Capwood (E14)` and `Pinwheel Ridge (E14)` becomes `Pinwheel Ridge (E13)` (Pinwheel Ridge is E13's wind-farm site);
  in the main table change the epic column of `sq-capwood-cap-count` to `E14` and of `sq-pinwheel-linemen` to `E13`.
  Add two rows after `sq-rutbottom-heats` in the same format: `race-rutbottom-knobbly` "Rutbottom: Knobbly Heat", giver
  Marshal Clary Mudguard (clary), unlocks after #42 `m42-rutbottom-impound` ("Clary let the player race the impound;
  now the Bowl is open to anyone on a Knobbly."), area `rutbottom`, cap 6, `E14`; and `race-capwood-open` "The Capwood
  Run: Open Stage", giver Lugnut Lulu (lulu) at the rally paddock, unlocks after #40 `m40-the-capwood-run` ("Lulu keeps
  the route open for anyone who wants to beat her time."), area `capwood`, cap 6, `E14`.

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find Knobbly` and `npm run lore -- find Cap-water` find your text.

## Out of scope
Every file outside `docs/lore/` and `docs/design/gnome-theft-auto/side-quest-schedule.md`.
