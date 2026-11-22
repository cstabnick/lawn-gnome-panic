# History: before, during, now, after

The history up to the start of play is **hand-written and the same in every world**. It is told through things you
find (notes, the Rolls, graffiti, ruined camps), never through cutscenes. What happens after the start is written by
the simulation, and the game keeps a **chronicle** of it.

## Eras

| Era | When | One line |
|---|---|---|
| **The Long Quiet** | before living memory to Year 0 | gnomes keep the graves of the Tall Ones and nobody fights |
| **The Greying** | Year 0, autumn to spring | the moss comes, the Pile wakes, the Bell Night |
| **The Scatter** | Year 0 spring to Year 1 | every gnome for themselves; the Shed fire; the first factions |
| **The Holding** | Year 1 to Year 3 | the havens, the Truce of the Tap, the traders come back |
| **Now** | Year 3, the first day of spring | where the game starts |
| **After** | from the start on | written by the simulation, kept in the chronicle |

## The Long Quiet

- Gnomes come to Mossgrave on Tall One graves, set down as ornaments. They wake when the Tall One leaves, and nobody
  knows why (a loose thread). Each new gnome is given a grave to **Keep**: clear the moss, straighten the flowers,
  keep the candle lit.
- **The Sexton** keeps the **Keeping Rolls** (a `ledger`), lives in the chapel and lights the lanterns on Lantern
  Night. There has always been one Sexton; the title passes to an apprentice.
- **The Kindness** (what is now called Visitation): fresh flowers and candles that appear on graves overnight. Gnomes
  take it as the Tall Ones' thanks for the Keeping. Taking from a Kindness was the one crime.
- **The Pile**: broken gnomes (cracked past glue) are laid to rest in the Gnome Garden with their hats on, as their
  final grave.
- The Verge traders already came through the Lychgate every season, with salt and seed, for glazed work and flowers.
- *Found as:* the Keeping Rolls (pieces scattered in the Vestry, the Lychgate noticeboard, the Columbarium), grave
  plaques gnomes carved, Lantern Night songs NPCs still hum.

## The Greying

- **The wet autumn.** A long rain. The moss on the Pile grows thick. A Keeper of the Pile writes that "the moss is in
  their cracks and they are warm to the touch" (a `soggy-letter` found in the Gnome Garden).
- **The Pile wakes.** On the first frostless night of winter, the honoured dead stand up without their hats. The hats
  stay on the Pile; the field of little hats is still there.
- **The spread.** A Hatless scratch puts moss into a crack. Keepers try to nurse the scratched; the nursed turn. The
  first rule anyone makes is about the bitten.
- **The Bell Night.** Sexton Briar Gravelpot rings the chapel bell to call every gnome to shelter. Every herd for two
  kilometres comes too. The chapel fills; few walk out. The Rolls are lost in the vestry. (This is why ringing the bell
  is the most dangerous thing a player can do, and why NPCs fear it.)
- **The Long Run** up the Yew Walk, the **Long Night of Row 14** in the Old Rows, and the drowned of the Mirror.
- *Found as:* ruined barricades, notes, scratched tallies, the Bell Night survivors' songs, the Pile's field of hats.

## The Scatter

- No Sexton, no Rolls. Gnomes go up: onto headstones, into niches, into crypts.
- **The Columbarium holds** because the ladders came up in time. It is the start of the Lantern Keepers (founder seeded:
  usually Yarrow Gravelpot, the dead Sexton's apprentice).
- **The Crypt Holders** break into the first crypt on the Hill and seal themselves in.
- **The Shed fire**: the old shed crew's lamp falls into the Black Dew. The burnt patch is still on the floor.
- **The first raiders** on the Yew Walk: gnomes who found it easier to take than to find.
- **The Greybearded**: a group cast out for being scratched, who did not turn. They went to live in the Wormways.
- *Found as:* camps abandoned in a hurry, half-built bridges, caches whose owners never came back (rich loot).

## The Holding

- **The Kiln Sisters** retake the chapel with fire and patience and open an infirmary for anyone.
- **The Truce of the Tap**: after a summer of fighting over the standpipe, the factions agree that nobody fights at the
  Tap. It's the first haven anyone shares.
- **The Lychgate Waystation** opens on the gate roof. The Verge traders come back.
- The Willow Folk settle the Drowned Corner; the Shelf Wrights climb the Shed shelves.
- *Found as:* treaty boards at the Tap, trader marks on the Lychgate beams, wanted posters from two years ago.

## Now (the start)

The seed decides who is alive and strong at the start, inside the history above. Every world starts in Year 3 spring
with:

- 1,000–1,400 living gnomes (seeded), of which ~40% in havens, ~35% in packs, ~25% alone.
- 3–6 factions picked from the founders list ([society.md](society.md#named-founders-seed-starting-points)), with their seeded strength.
- The Hatless at 4,000–9,000, most in the Pile, the Catacombs, the Compost and the New Hill pits.
- Untouched loot at 55–70% of the authored budget (the rest was taken during the Scatter).
- At least two havens up (the Tap and one more): checked at world creation.

## After: the chronicle

The simulation writes events to a **chronicle**, one line each, in the house style: plain, dry, past tense.

```
Year 3, spring, day 4. The Rusted Spades took the Footbridge and set a toll of two acorns.
Year 3, spring, day 9. A herd of about 600 left the Compost and walked south.
Year 3, summer, day 2. Thistle Stonewort of the Crypt Holders was shattered in the Great Crypt. Her nephew Sorrel holds it now.
Year 3, summer, day 5. A gnome called Mossbelly rang the chapel bell. The Kiln Sisters lost eleven.
```

- In the game: NPCs talk about recent lines ("you heard about the Footbridge?"), notice boards show the local ones, and a
  history book in each haven keeps that haven's chronicle (the player can read it).
- In evaluation: the chronicle is the raw data for the "story" metrics ([evaluation.md](evaluation.md#story)), and a human
  reads a sample of chronicles every tuning round.
- **Eras after the start** are named by the chronicle when a big change happens: "the Spade Summer" (raiders hold 3+
  regions), "the Second Greying" (Hatless count doubles), "the Lantern Peace" (one polity rules 40%+ of the havens),
  "the Hungry Winter" (population drops 25% in a season). Each named era is a world-state pattern the evaluation counts.
