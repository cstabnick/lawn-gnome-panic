Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing game code
and other docs at the same time; you own `docs/lore/` only. Lore rules: setting `apocrypha` for Gnome Theft Auto;
R-021 (fired clay cracks and is glued back; nothing bleeds; nothing gets wet, soaked or dripping); R-049 (animals sized
for gnomes, never die, every creature wants something); R-051 (Tessie). Plain, short, concrete sentences.

## Goal
The lore knowledge base covers the whole wild world as it now plays: two new entries (the bridges, New Puddle Marina)
and an accurate "In the games" section on each wild-world entry. `npm run lore` passes.

## Read first
- `docs/lore/README.md`: entry front matter (id, name, kind, tier, setting, era, status, games, aliases, sources,
  related) and sections ("What gnomes say", "The truth" for writers only, "In the games", "Loose threads").
- `docs/lore/entries/apocrypha/tessie.md`: a complete recent entry to copy the shape of.
- `docs/lore/entries/apocrypha/turfton-waterworks.md` and `the-everspring.md`: the river and its works.
- `games/gnome-theft-auto/src/waterworks.ts` (comments only: what is built where: bridges, docks, the marina, moored
  boats).

## Change
- New `docs/lore/entries/apocrypha/everspring-bridges.md` (id `everspring-bridges`, name "The Everspring Bridges",
  kind `place`, games `[gnome-theft-auto]`, related `[the-everspring, turfton-waterworks, southern-drainage-canal,
  turfton-ring-road, turfton-fm]`): the five road bridges, sized for a mower, a step above the road. Names, verbatim:
  - Fellsmelt Bridge (-64, -395): the upper river under Ring Road North-West, below the Frostbite Fells.
  - Ravine Bridge (-482, -30): the Mossy Wood ravine under Highway West.
  - Bracken Bridge (-243, 230): the ravine river under Ring Road South-West.
  - Culvert Bridge (0, 230): the Southern Drainage Canal under Highway South.
  - Clover Bridge (258, 327): the farm river under Ring Road South-East.
  Turfton FM reads traffic reports for each of them.
- New `docs/lore/entries/apocrypha/new-puddle-marina.md` (id `new-puddle-marina`, kind `place`, related
  `[the-puddle-sea, clog-cruiser, walnut-dinghy, gravy-boat, baroness-brenda]`): two docks reaching south into the
  Puddle Sea on Cloverfield's coast, three moored boats; Walnut Dinghy rentals are advertised on Turfton FM.
- Update the "In the games" section (add one if missing; keep everything else) of:
  - `tallgrass-commons.md`: grass taller than a gnome; on foot inside it the Hat Watch cannot see you; a mower mows a
    path through it that grows back; four straw hives in flower rings; knock one over and a swarm chases you until you
    lose it; the flat-topped Hive Hill at (-750, 720) with a trail up.
  - `drey-gang.md`: three dens in Cloverfield Farms (two hedgerows at (-260, 520) and (260, 640), an old silo at
    (420, 820)); on foot near a den they raid (pickers pinch Acorns, throwers pelt acorns from cover); now and then two
    squirrels drive off with a parked mower to another den; shoot one and the den scatters, then regroups.
  - `sgnowmes.md`: their village in the Fells' far north; they wander it and put their hands up when threatened.
  - `fells-polar-bears.md`: deck chairs on the sunny slope, sunglasses; shoot or ram one and it only shrugs (Turfton FM
    reads it as a weather report).
  - `loch-moss.md`: rock glen walls on the north and west, moor above, gravel shore, Tessie's island at (-760, -720),
    the dock at (-715, -564) with the Watering-Can Steamer, the weir at the ravine outlet that keeps boats in the loch.
  - Each boat entry (`walnut-dinghy.md`, `gravy-boat.md`, `clog-cruiser.md`, `watering-can-steamer.md`,
    `hoa-patrol-boat.md`): one sentence on where it is found (from `waterworks.ts` comments) and that all five count
    toward the "Captain Clay" achievement (take the helm of every boat; reward a Captain's Cap).
  - `turfton-fm.md`: one sentence: the stations also read wildlife bulletins (cow tipping, the Drey Gang, smashed
    snowmen, the polar bear "weather report", hives and swarms), boat adverts and bridge traffic reports.
- `docs/lore/settings.md`: add nothing unless `npm run lore` asks for it.

## Contract
Bridge names and positions exactly as above (the radio and the README use the same names).

## Done when
- `npm run lore` prints "Lore OK" (it also rewrites `docs/lore/INDEX.md`; that is expected).
- `npm run lore -- find bridge` lists `everspring-bridges`.

## Out of scope
Everything outside `docs/lore/`. No new rulings unless a fact here contradicts an existing one (then add one to
`docs/lore/rulings.md` after R-051 and say why in your report).
