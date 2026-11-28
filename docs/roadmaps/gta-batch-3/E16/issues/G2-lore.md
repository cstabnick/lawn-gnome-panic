Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): lore writing

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
The lore records the countryside as E16 builds it: five new rulings (R-210..R-214), new entries for the red deer and the
hunters' camps, and the existing entries for the Even-Estates, Levelright, the vineyard, the manor, the croft, Chicory
and Chard brought up to date with where things really are. `npm run lore` passes.

## Read first
- `docs/lore/README.md` (entry format, front matter, how rulings are written) and `docs/lore/canon.md`.
- `docs/lore/rulings.md` (the last rulings, R-199..R-202, for the exact format).
- The entries in `docs/lore/entries/apocrypha/`: `thorne-even-estates.md`, `levelright-construction.md`,
  `chard-levelright.md`, `trellisdown-vineyard.md`, `brassknock-manor.md`, `wisteria-brassknock.md`, `chicory-snips.md`,
  `grape-dew.md`, `windfall-croft.md`, `trellisdown.md`, and for style one creature entry (`npm run lore -- find hedgehog`
  or `find pheasant`) and the hunting lodge (`npm run lore -- find tuft`).
- `games/gnome-theft-auto/src/country/types.ts` and `games/gnome-theft-auto/src/farm/types.ts` (what is built and where).
- `docs/design/gnome-theft-auto/characters.md` rows `chard`, `chicory`, `wisteria`, `bramble`.

## What is built (facts to record; coordinates are world metres, +x east, +z south)
- **Thorne Even-Estates**, three Levelright sites (E16): Plot 1 at (-295, -120) on the west fringe by Mossy Wood (Chard's
  caravan is here; the night-shift side quest starts at its gate), Plot 2 at (195, 325) on the south-east fringe by Route
  South, Plot 3 at (1050, 250) out in Rootwell. Each: pale-blue-and-beige hoardings with the gate facing the nearest road,
  a row of identical empty beige show-homes (three, four at Plot 3), a half-built house of mushroom-stem girders in
  scaffolding, a bucket crane (Levelright's tower crane lifts with a garden bucket) painted "Level Is Kind", a materials
  yard (cement mixer, clay-brick pallets, girder stacks), a site caravan, crews in acorn-cap hard hats walking a loop.
  The old entries say "north-west, south-east and south fringe" and "built by epic E01": correct them.
- **Trellisdown Vineyard** (E16): the hill at (-1140, -170), x -1290..-990, z -280..-60, rows running east-west, a path
  up the middle, the gate on the south edge at (-1140, -61) facing vineyard-lane, Chicory's lodge just inside at
  (-1172, -78), the press-house at (-1105, -95) with the first vine on its west wall, frost-pots among the rows, the
  crooked row at z -205 east of the path. The old entry puts it at (-1150, -120): correct it.
- **Brassknock Manor** (E16): across vineyard-lane, south of the vineyard, x -1210..-1090, z -10..90: the gate on the
  north wall at (-1150, -9), a gravel drive and a fountain, the house (46 x 18 m, centre (-1150, 31)) facing north so its
  raised terrace looks over the vines; seven chimneys; the front door with the great brass knocker (nobody answers it);
  the way in is the back door (south side), into the tasting hall; Footman Pell; a row of shut rooms; the ledger room is
  locked. Gardens behind. The old entry says (-1230, -120): correct it.
- **Windfall Croft** (E16): x 60..140, z 505..565 in Cloverfield, gate on the west side by the south road. The player
  buys it at the For Sale board (or in the Ledger app) for 2,200 Acorns: 300 down and the rest as a loan from the First
  Kiln Bank beside the Kiln-Debt (R-169), 10% on top. Eight beds (radishes, carrots, cabbages, pumpkins), a seed rack, a
  stall by the gate, a run-down farmhouse and barn, an orchard on the south wall whose apples keep rolling over it, and
  an oak spot: an oak planted there takes about forty minutes to grow and then gives a shake of acorns every ten
  minutes. Farmer Bramble knows who holds the deed (side quest `sq-windfall-croft-deed`).
- **Red deer and goats** (E16): herds of red deer (a stag, hinds, a fawn) graze the empty country of Trellisdown, Snowcap
  Rise, Loch Moss, Cloverfield and Rootwell, and bolt from gnomes, mowers and gunshots; hill goats on Snowcap Rise and the
  Fells' north flank. The Trellisdown Red Deer is also a Tuft & Tally quarry (tuft: red-deer winter tuft; keepsake: a
  shed antler tine) west of the vineyard. A knocked-over deer gets up offended and leaves; nothing dies (R-021, R-049).
- **Hunters' camps** (E16): about 26 small camps in the empty country of every outer region: tents, shared camps round a
  fire, shacks, deer stands, duck blinds on loch and coast shores, tuft-drying racks; some with a hunter asleep by the
  fire; each leaves a tin of acorns or a snack for a passer-by, refilled later. They belong to Tuft & Tally licence
  holders (Hazel Mattock's lodge, R-141).

## Change
- `docs/lore/rulings.md`: append R-210 (the Even-Estates sites as built, and that they are built to be seen: identical,
  empty, a house a day), R-211 (the vineyard and the manor as built, the knocker and the back door, Chicory is "he"
  everywhere: the vineyard entry's one "she" is a slip), R-212 (red deer and hill goats: ambient herds and a hunting
  quarry, one animal; nothing dies), R-213 (Windfall Croft: the purchase, the loan beside the Kiln-Debt, the crops, and
  why an oak that drops acorns does not break Turfton's money: acorns from your own tree are honest acorns; the HOA has a
  form for it that nobody has found), R-214 (the hunters' camps: whose, what they leave, the custom of leaving the tin
  for the next walker). Same format as R-199..R-202, date 2026-11-25, Applies to: apocrypha, gnome-theft-auto.
- Update (front matter `sources` + body; keep the house voice, keep their "What gnomes say"):
  `thorne-even-estates.md`, `levelright-construction.md`, `chard-levelright.md`, `trellisdown-vineyard.md`,
  `brassknock-manor.md`, `windfall-croft.md`, `chicory-snips.md` (fix the pronoun if the entry is inconsistent).
- New entries (front matter like the others; `kind` as the README allows for animals, places or groups):
  `docs/lore/entries/apocrypha/red-deer.md` (Turfton's red deer and the hill goats), `hunters-camps.md` (the camps,
  the tin custom, two or three named camps as examples: "Teasel's Tent", "The Thermos Stand", "Damp Socks Camp"),
  `footman-pell.md` (Brassknock Manor's footman: polite, tired, guards the knocker by telling everyone to go round the
  back), and `bucket-crane.md` only if the README's rules want objects as entries (otherwise fold it into
  levelright-construction).
- `docs/lore/settings.md`: if a row lists Trellisdown or Cloverfield places, add the new ones briefly.
- Run `npm run lore` (from the repo root) and fix every error it reports in your files.

## Done when
- `npm run lore` passes.
- `npm run lore -- find deer`, `-- find croft`, `-- find knocker` each find the new text.

## Out of scope
Any code; entries of other epics' places (do not edit them beyond a `related` link if the README wants one).
