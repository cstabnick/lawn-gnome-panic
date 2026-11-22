Epic: 3 (Wild World: world expansion and the region map)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Other workers are editing game code at the same time. You only touch `docs/lore/` (files under Change). Do not edit
  any code or `.level.json` file.
- Do not commit, push or open a PR.

## Goal
The lore knows about the grown Gnome Theft Auto map: entries for Loch Moss, Tallgrass Commons, the river that links
them (its source and its stretches), and a ruling on why the old Fence line has only one panel left standing.

## Facts already decided (the game shows these; write lore that fits them)
- Setting: Gnome Theft Auto's `apocrypha` setting (a parody). Ruling R-021 applies: fired clay cracks and is glued
  back, nothing bleeds, and nothing gets wet, soaked or dripping (water is fine; things being wet is not).
- Canon 1 and 3: the world is a garden seen from gnome height; the Tall Ones are never seen, only their huge traces.
  Every stretch of water has a Tall-One reading (never said in game, hinted only) and a gnome reading (what is on screen):
  | Stretch | Tall-One reading (hint only) | Gnome reading |
  |---|---|---|
  | Source | the birdbath overflowing, fed by a hose left dripping up by the house | the Frozen Birdbath Basin's thaw outlet; the Fells gnomes' "Everspring" |
  | Upper river | the garden's runoff swale | a fast rocky stream west through Frostbite Fells into Loch Moss |
  | Loch Moss | the overgrown ornamental pond in the back corner, pond-liner rim, a tipped stone heron | a highland loch in a glen (north-west corner of the map) |
  | Ravine | the pond's overflow trench through the shrubbery bed | Mossy Wood's ravine, running south-east into Turfton's south-west corner |
  | Canal | the concrete storm gutter along the patio | the Southern Drainage Canal (existing entry) |
  | Farm river | the vegetable patch's irrigation channel | Cloverfield's river, south-east to the coast |
  | Puddle Sea | the low corner of the lawn where the runoff pools | the Puddle Sea, claimed by Baroness Brenda's Sovereign Republic of New Puddle |
- Loch Moss: a new region, the north-west corner of the map, reached by a spur road north from the far end of the west
  highway. Empty for now (later: a ferry, a stilt fishing village, a weir, and a giant old turtle most of Turfton thinks
  is made up; do not name or describe the turtle yet beyond a rumour).
- Tallgrass Commons: a new region, the south-west corner, reached by a spur road south from the same junction. A
  parkland of grass that has grown giant (later: bees and hives). Empty for now.
- The map grew outward: the perimeter Fence now stands much further out on every side. On the old west fence line,
  where Knot-Hole Nora's thimble seat and the Fence-Line Overlook statue are, only five panels of the old fence still
  stand, with the glowing knot-hole in the middle one. Through it you now see more of Mossy Wood, not the Neighbour's
  Lawn. Decide why (proposal: when the Tall Ones put up the new, taller Fence further out, the gnomes took the old one
  down board by board for timber, but Nora would not let them touch the knot-hole panel; she insists the Neighbour's
  Lawn is still on the other side if you look properly).

## Read first
- `docs/lore/README.md`: the entry schema (front matter fields, tiers, status) and how to add an entry or a ruling.
- `docs/lore/canon.md`: the house style.
- `docs/lore/entries/apocrypha/southern-drainage-canal.md` and `docs/lore/entries/apocrypha/mossy-wood.md`: tone and
  format of a GTA place entry. Also look at `fence-line-overlook.md`, `knot-hole-nora.md`, `frozen-birdbath-basin.md`
  in the same folder.
- `docs/lore/rulings.md`: the last ruling number (append the next ones; the file is append-only).
- `docs/lore/settings.md`: the Gnome Theft Auto / apocrypha row.

## Change
- First run `npm run lore -- find loch`, `... find tallgrass`, `... find everspring`, `... find "puddle sea"` to be
  sure nothing clashes.
- Add `docs/lore/entries/apocrypha/loch-moss.md`, `tallgrass-commons.md`, `the-everspring.md` (the river as a whole,
  each stretch named; link the existing canal and Basin entries) and `puddle-sea.md`, each `status: draft`, in the
  same schema as the existing GTA entries, short (a summary line plus a few paragraphs). Keep the Tall-One reading as
  hints only, never stated as fact by a gnome.
- Append rulings to `docs/lore/rulings.md` (next numbers): (1) the Old Fence panel (above); (2) the map's two
  readings of water and the rule that the water always runs downhill from the house (north) to the Puddle Sea (south).
- Update the Gnome Theft Auto row in `docs/lore/settings.md` if it lists the regions (add Loch Moss and Tallgrass Commons).
- Add the new entries' cross-links to `southern-drainage-canal.md`, `frozen-birdbath-basin.md` and
  `fence-line-overlook.md` only where those files have a related/links field (one line each, no rewrites).
- Run `npm run lore` (it regenerates `docs/lore/INDEX.md`; do not edit INDEX.md by hand).

## Contract
- Names exactly: "Loch Moss", "Tallgrass Commons", "the Everspring", "the Puddle Sea" (keep "the Southern Drainage
  Canal" and "the Frozen Birdbath Basin" as they are).

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find loch` and `npm run lore -- find tallgrass` each list the new entry.

## Out of scope
- Any code, `.level.json`, radio scripts, quests. Tessie's quest (a later epic), sgnowmes, the Drey Gang, bees.
