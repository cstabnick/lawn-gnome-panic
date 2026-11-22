# Regions: the Mossgrave gazetteer

Every district, region and zone of the hand-made map. Eras (**Before**, **the Greying**, **Now**) are explained in
[history.md](history.md); "Could become" is where the simulation tends to take a region after the game starts.

## Keys

**Loot tier** (see [loot.md](loot.md)): T0 scraps · T1 common · T2 good · T3 rare · T4 relic.

**Zone traits** (rules the simulator and the game both read from the level data):

| Trait | Effect |
|---|---|
| `OPEN` | sight ×2 for everyone; no prone cover |
| `COVER` | sight ×0.5; prone hides fully |
| `ECHO` | noise ×2 (stone canyons, crypts, drains) |
| `HUSH` | noise ×0.5 (deep moss, meadow) |
| `DARK` | no daylight; light sources show from far away |
| `FLOODS` | under water in spring storms; containers on the floor get wet |
| `WARM` | +warmth; Hatless are drawn to it |
| `MOSSY` | infection risk ×2 from open cracks; the moss spreads from here |
| `NEST` | Hatless gather and stay (a sink in the horde field) |
| `PIT` | Hatless that fall in can't get out; they pile up |
| `CHOKE` | a narrow way through; one group can hold it |
| `HIGH` | mostly above 15 gm; reached only by routes |
| `DEEP` | underground |
| `HAVEN` | a safe-zone site ([havens.md](havens.md)) |
| `GATE` | a trader gate ([economy.md](economy.md#outside-traders)) |
| `TOLL` | whoever holds it can charge passage |
| `SACRED` | NPCs of most factions won't fight here; looting it costs standing |

---

## 1. The Lychgate (south edge, 4 regions)

**Really:** the roofed wooden entrance gate, the gravel forecourt, the noticeboard and the bins. **Layers:** Ground,
Low, High (the lychgate roof). **Music:** wind in the gate timbers.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Gate Roof | the roof ridge, the beam loft, the lantern bracket | `HIGH` `HAVEN` `GATE` | T1 | can't reach | the **Lychgate Waystation**: trader camp and the newcomers' haven |
| Forecourt | gravel apron, the noticeboard, the bench, the bins | `OPEN` `CHOKE` | T1 | stragglers in, drawn by the Waystation's fires | traders, newcomers, beggars, pickpockets |
| Bin Corner | three wheelie bins (towers), a spilled bag | `WARM` `NEST` | T1 food scraps | a standing nest of 20–60 | scavengers at dawn |
| The Verge Path | the strip outside the gate, the kerb | `OPEN` `GATE` | T0 | rare | traders arrive and leave here |

- **Before:** where new gnomes arrived, carried in by Tall Ones and set on a grave. The noticeboard held the Keeping
  Rolls (which gnome kept which grave).
- **The Greying:** abandoned in the first winter; the bins became the first big nest outside the Gnome Garden.
- **Now:** the Waystation on the gate roof, run by whichever faction holds the gate (seed). The player's usual start.
- **Could become:** a fortified trade town (if trade booms); a toll gate held by raiders (the traders stop coming);
  abandoned if a Drift comes through.

## 2. The Old Rows (west centre, 7 regions)

**Really:** the oldest section: leaning sandstone headstones in tight rows, ivy, collapsed graves. **Layers:** Deep
(sunken graves), Ground, Low, High (the tall Victorian stones). The classic DayG walk: stone canyons, sight lines down
a row, nowhere to go but up.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Ivy Rows | rows 1–9, ivy curtains, the ivy ladders | `COVER` `ECHO` | T1 | wander the canyons | lone wolves sleep on the stone tops |
| Leaning Rows | rows 10–22; stones lean against each other into arches | `ECHO` | T1–T2 | herds pass through | packs camp under the arches |
| The Sinks | five collapsed graves (pits 10–20 gm deep) | `PIT` `DEEP` `FLOODS` | T2 at the bottom | piles of trapped Hatless | brave scavengers on ropes |
| Angel Square | four stone angels (30 gm) round a sundial | `HIGH` `SACRED` | T2 | low | a shrine to the old Keeping; preachers |
| The Mason's Corner | a broken stone, a mason's dropped chisel (a 40 gm steel beam), chips | `OPEN` | T2 iron | low | a smithing camp, often contested |
| Child Graves | small stones, toys left by Tall Ones (a ball, a windmill, a teddy) | `SACRED` | T2 toys, Visitation | low | gnomes who won't loot here, and gnomes who will |
| Yew Edge | where the rows meet the Yew Walk | `CHOKE` `TOLL` | T1 | herds cross toward the Walk | toll keepers (raiders or Keepers, by seed) |

- **Before:** the quietest Keeping; old families of gnomes, each keeping one row for generations. Row names were family names.
- **The Greying:** the rows held for a season because Hatless can't climb. Then the ivy grew, the ladders were cut too
  late, and the Leaning Rows fell in one night ("the Long Night of Row 14").
- **Now:** no settlement, many packs. The best place to learn to climb.
- **Could become:** a "bridge town" if a faction strings rope bridges across the stone tops; a dead zone if a herd
  settles in the Sinks and overflows.

## 3. Wreathwood (north-west, 5 regions)

**Really:** where old wreaths and bouquets are thrown by the compost: wire frames, rotting flowers, oasis foam, ribbon.
**Layers:** Ground, Low (wreath frames), High (stacked wreaths, a 30 gm ring "fortress"). Dense, dark, rich, dangerous.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Rings | wreath frames lying in heaps, wire tunnels | `COVER` `HUSH` | T1 fibre, `wreath-wire` | many small groups | foragers |
| Petalfall | fresh-thrown bouquets; Visitation flowers end here | `COVER` | T2 petals (medicine) | medium | the Kiln Sisters' herbalists |
| The Ribbon Halls | hanging ribbons between stalks | `COVER` `HIGH` | T2 cloth | low | ribbon gliders (a pack of thieves who glide in and out) |
| Foam Fields | green florist foam blocks | `HUSH` `FLOODS` | T1 water (squeeze it) | low | a water source when the Tap is held by an enemy |
| The Crown | one huge wreath stood on its edge, 60 gm | `HIGH` `CHOKE` | T2 | can't reach | a band's hideout (the seed's wild card) |

- **Before:** "the Thrown Garden", where gnomes went to pick flowers for graves.
- **The Greying:** quiet at first, as the Hatless prefer warmth; then the compost's herds spread through it.
- **Now:** no one holds it; everyone forages it. The best medicine in the world is here, among the most Hatless.
- **Could become:** a herbalist town in the Crown; or a moss forest (`MOSSY` spreads to all regions) if the Greybearded
  hold it.

## 4. The Compost Heaps (far north-west, 4 regions)

**Really:** grass-clipping heaps, leaf bins, the compost bays. Warm, wet, alive. **Layers:** Ground, Low, High (heap
tops), Deep (worm tunnels).

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Warm Bays | three wooden compost bays (walls 40 gm) | `WARM` `MOSSY` `NEST` | T1 soil, worms | the biggest standing nest in winter | none sane |
| Clipping Hills | fresh grass heaps, slipping slopes | `WARM` `HUSH` | T1 | medium | winter squatters who risk it for the heat |
| Leaf Bins | wire mesh cages of leaves | `COVER` | T1 fuel | low | fuel gatherers |
| Wormways | worm tunnels under the heaps | `DEEP` `DARK` `WARM` | T2 (old gnome caches) | crawlers | the Greybearded's home |

- **Before:** where the dead flowers went and came back as soil. Gnomes called it the Turning.
- **The Greying:** where the moss grew first in strength (one of two seed-weighted outbreak points).
- **Now:** the Greybearded live in the Wormways. Everyone else stays away except in deep frost, when the heat is worth it.
- **Could become:** cleared and farmed (the best soil in Mossgrave) by a strong builder faction; this is one of the
  big long-game goals the simulation can reach.

## 5. The Gnome Garden (south-west, 5 regions)

**Really:** a memorial garden where Tall Ones leave ornaments: gnomes, angels, windchimes, solar lights, and a heap of
broken ones. **Layers:** Ground, Low, High (a stone birdbath). The Potter's Field of gnome legend.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Pile | the heap of broken ornaments (shards, half gnomes) | `MOSSY` `NEST` `PIT` | T3 gnome gear, glaze | the oldest, biggest Hatless; rises at night | none |
| Ornament Lawn | standing ornaments: giant gnome statues (`gnome-statue`), a resin frog, windmills | `OPEN` | T2 | drift in from the Pile | statue-top lookouts |
| Solar Walk | a path of solar garden lights that glow at night | `OPEN` | T2 glass, batteries | drawn to the light at night | night traders, by the light |
| The Birdbath | a stone birdbath, 50 gm, holds water | `HIGH` `HAVEN` | T1 water | can't reach | a small haven (the "Bath House") |
| Windchime Hedge | a hedge hung with windchimes | `ECHO` `COVER` | T2 metal | chimes draw herds when the wind blows | wind is a danger forecast |

- **Before:** the gnomes' own cemetery: where broken gnomes were laid in the Pile with honour.
- **The Greying:** the Pile woke. The first Hatless were the honoured dead (see [history.md](history.md#the-greying)).
- **Now:** the most dreaded place on the map, and the richest in gnome gear.
- **Could become:** cleansed (burn the Pile: a world-scale quest chain that changes the horde field for good), or the
  heart of the Greybearded's faith.

## 6. The Columbarium (north edge, 6 regions)

**Really:** a long brick wall of urn niches, six rows high, with a covered walkway and a garden of remembrance in
front. **Layers:** Ground, Low, High (niche rows 3–6), Sky (the parapet). The vertical city.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Niches (rows 1–2) | open and sealed niches, urns, plaques | `ECHO` | T2 | climb-piles reach row 1 | the poor quarter |
| The Niches (rows 3–6) | a city in niches, rope ladders, pulleys | `HIGH` `HAVEN` | T2–T3 | can't reach | the **Lantern Keepers**' city (seed may differ) |
| The Parapet | the coping stones along the top | `HIGH` `OPEN` | T1 | none | lookouts, the signal lamps |
| The Walkway | the covered colonnade in front | `ECHO` `CHOKE` | T1 | herds pass under | the market under the roof |
| Garden of Remembrance | rose beds, plaques, a fountain | `COVER` | T2 roses (food and medicine) | medium | the city's farms |
| The Rose Gate | the arch into the garden | `CHOKE` `TOLL` | T1 | the outer defence | gate wardens |

- **Before:** the Hall of Ashes: urns were "sleeping Tall Ones" and the niches were left alone out of respect.
- **The Greying:** gnomes fled up into the niches and pulled up the ladders. It held. It has never fallen.
- **Now:** the biggest settlement (80–120 gnomes), the main friendly haven.
- **Could become:** a polity that rules the north half; a tyranny if a strongest-rules leader takes it; a famine
  city if the rose gardens are lost.

## 7. The Bell Chapel (north centre, 5 regions)

**Really:** a stone chapel on a rise, a spire with one bell, a vestry, and catacombs beneath. **Layers:** all five.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Nave | pews (`pew`), the altar (`altar`), fallen hymn books | `ECHO` `SACRED` | T2 | some, inside | the **Kiln Sisters**' infirmary |
| The Vestry | robes, candles, the sexton's cupboard | `DARK` | T3 candles, cloth, a key ring | low | the Sisters' store |
| The Spire | ladders inside the tower, the bell, the louvres | `HIGH` (Sky) `ECHO` | T3 view | none | a lookout; **ringing the bell draws every herd for 2 km** |
| The Catacombs | stone passages, coffin shelves, ossuary niches | `DEEP` `DARK` `ECHO` `FLOODS` | T3–T4 | thousands sleep in the lower levels | smugglers; the Crypt Holders' back door |
| Chapel Rise | the grass slope and gravel round the chapel | `OPEN` | T1 | herds circle the chapel at night | patrols |

- **Before:** the Sexton's house. The Sexton was the gnome who kept the Rolls and lit the lanterns.
- **The Greying:** **the Bell Night**. The Sexton rang the bell to call every gnome to the chapel for shelter. The bell
  brought every herd instead. The chapel was lost with most of the gnomes inside.
- **Now:** retaken by the Kiln Sisters, who heal anyone. The catacombs below are full.
- **Could become:** the Sisters' holy city; or lost again if anyone rings the bell (a player can).

## 8. The Yew Walk and the Tap (centre, 4 regions)

**Really:** the main avenue from the gate to the chapel, lined with clipped yews, and the standpipe tap halfway up.
**Layers:** Ground, High and Sky (inside the yews).

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Lower Walk | gravel avenue, benches, bins | `OPEN` `CHOKE` | T1 | herds use it as a highway | caravans; ambushers in the yews |
| The Yews | inside the clipped yews: branch towns | `HIGH` `COVER` | T2 | can't reach | the **Rusted Spades** (raiders) or a yew-town (seed) |
| The Tap | a standpipe, a puddle, a watering can on a hook | `HAVEN` `TOLL` | T1 water | drawn to the drip | the **Truce of the Tap** market |
| Upper Walk | the avenue up to Chapel Rise | `OPEN` | T1 | dense at night | patrols of the Chapel and the Tap |

- **Before:** the Procession. Gnomes walked it once a year, at the Lantern Night.
- **The Greying:** the Walk was where gnomes fled and where the herds followed: the Long Run.
- **Now:** the main trade road, and the most fought-over line on the map. The Tap is the one neutral water source.
- **Could become:** a fortified road with gatehouses in the yews; a raider fiefdom collecting tolls from everyone.

## 9. The Lawn Section (east centre, 5 regions)

**Really:** the modern part: flat bronze plaques set in mown lawn. No headstones, no cover. **Layers:** Ground, Low
(vases on plaques), Deep (the irrigation pipes).

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| The Plaques | rows of flat plaques with flower vases | `OPEN` | T2 Visitation | herds roam freely in daylight too | nobody stays; crossings are runs |
| The Sprinkler Field | pop-up sprinklers on a timer | `OPEN` `FLOODS` | T1 water | scattered by the spray | a timed dash |
| The Bench Line | memorial benches along a path | `OPEN` | T1 | low | sniper perches |
| The Irrigation | pipes under the lawn, valve boxes | `DEEP` `DARK` `ECHO` | T2 pipes, valves | crawlers | a secret way across |
| Mower Tracks | the stripes where the mower last ran | `OPEN` | T0 | low | the Mowing hits here most often |

- **Before:** "the Bare Lawn", mown so often the gnomes never settled it.
- **The Greying:** the open killing ground where most gnomes who fled east were caught.
- **Now:** a crossing. Being seen here by a herd in daylight is the most common way to die in the east.
- **Could become:** farmland (if cleared and walled: it is flat and sunny), the long game's big prize for builders.

## 10. The Drowned Corner (east, 5 regions)

**Really:** a lily pond with a stone edge, reeds, a little bridge and a storm drain. **Layers:** Deep (under water,
the drain), Ground, Low (lily pads, the bridge), High (the willow).

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Lily Pond | pads (floating platforms), the open water | `OPEN` | T2 fish | Hatless sink and walk the bottom | fishers on pads; raft bands |
| The Reeds | reed beds on the shallows | `COVER` `HUSH` | T1 reeds, `reed-blowpipe` | low | reed-cutters |
| Footbridge | a little wooden bridge | `CHOKE` `TOLL` | T1 | herds cross here | toll keepers |
| The Willow | a weeping willow over the water | `HIGH` `COVER` `HAVEN` | T2 | can't reach | the **Willow Folk**, a fisher settlement |
| The Drain Mouth | the storm drain grate and the culvert | `DEEP` `DARK` `FLOODS` `GATE` | T2 | washed in after rain | **smugglers' gate** to the Verge |

- **Before:** the Mirror, where gnomes went to see themselves and the sky.
- **The Greying:** the drowned walked out of the pond for weeks after.
- **Now:** fishing, rafts (borrowing from Gnaft's craft), and the black-market gate under the grate.
- **Could become:** a fishing town; a flooded no-go zone in a wet year.

## 11. Mausoleum Hill and the New Hill (north-east, 6 regions)

**Really:** the rich families' crypts on a slope, iron doors, stained glass; past them, an unfinished extension with
dug plots and a spoil heap. **Layers:** all five.

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Crypt Row | ten crypts (seed: 3–6 sealed) | `HIGH` `ECHO` | T3–T4 (sealed) | inside broken crypts | the **Crypt Holders** |
| The Great Crypt | a domed mausoleum, 80 gm, stained glass | `HIGH` `DARK` `CHOKE` | T4 | sealed or full (seed) | the Holders' keep |
| Obelisk Garden | three obelisks, 33 gm | `HIGH` `OPEN` | T2 | low | sniper towers |
| The Back Stair | stone steps down into the catacombs | `DEEP` `CHOKE` | T2 | from below | the catacomb link |
| The New Hill | dug plots: open graves 20 gm deep, the spoil heap | `PIT` `OPEN` | T1 | grave-pits full of trapped Hatless | herd-trappers |
| Digger's Rest | a small mini digger (parked, Tall size) | `HIGH` | T3 fuel, metal | low | mechanics, the Shed's rivals |

- **Before:** "the Quiet Houses". Gnomes never went in; the doors were shut.
- **The Greying:** the Holders' founders broke into the first crypt to hide. It worked, and they never came out again.
- **Now:** a closed, rich faction on the richest loot in the world; the Hill is the main source of T4 relics.
- **Could become:** a fortress state; an empty hill full of looted crypts; the New Hill's pits are the best
  Hatless trap on the map, and a faction that learns to steer herds into them changes the world's horde count.

## 12. The Shed and the Mower Yard (south-east, 5 regions)

**Really:** the groundskeeper's brick shed, its tool shelves, the fuel store, and the open bay with the big ride-on
mower. **Layers:** Ground, Low, High (shelves 1–4), Sky (rafters).

| Region | Zones | Traits | Loot | Hatless | NPCs |
|---|---|---|---|---|---|
| Shed Floor | a forest of giant tool handles, sacks, a bag of salt | `DARK` `ECHO` | T2–T3 tools, salt | inside at night | scavenger crews |
| The Shelves | four shelves (15–60 gm): paint tins, seed packets, string | `HIGH` | T3 seeds, string, glue | can't reach | the **Shelf Wrights** (builders) or empty (seed) |
| Fuel Store | cans of Black Dew, a burnt patch | `ECHO` | T3 fuel | low | the fuel cartel; **fire risk** |
| The Mower Yard | the giant mower, the blade deck, oil puddles | `OPEN` | T3 parts | low (it smells of Black Dew) | mower-worshippers (by seed) |
| The Back Gate | the service gate on the east road | `GATE` `CHOKE` | T1 | low | heavy traders' gate |

- **Before:** the Giant's Workshop. Gnomes went in only to borrow string and seeds.
- **The Greying:** the fuel fire: a lamp knocked over in a panic burned the old shed crew. The mark is still there.
- **Now:** the industrial heart: tools, seeds, salt, fuel. Whoever runs the Shelves can build anything.
- **Could become:** a workshop town that supplies every haven; a burnt ruin if the fuel store catches again (fire spreads
  by rule, and the fuel store can be lit deliberately).

---

## Landmarks to see from far away

Each one is placed so a player can navigate without a map: the **Spire** (310 gm, from everywhere), the **Great Crypt**'s
dome, the **Columbarium** wall, the **Crown** wreath, the **Willow**, the **Obelisks**, the **Mower**'s roll bar, and
the **Lychgate** roof. Each has an approach route and a climb route.

## Routes up (the vertical web)

Hand-placed, in the level data as `routes[]`, at least one per high zone:

| Route type | Example | Time | Noise | Can be cut |
|---|---|---|---|---|
| Natural holds | carved letters on a headstone face | 20 s | low | no |
| Ivy | Ivy Rows curtains | 15 s | low | burnt |
| Ladder | the Columbarium's rope ladders | 6 s | low | pulled up |
| Pulley lift | the Columbarium's goods lift | 10 s | medium | cut |
| Rope bridge | between two headstone tops | 8 s | low | cut, then it falls |
| Inside stair | the spire, the shed shelves' string | 30 s | echoing | blocked |
| Glide down | any `HIGH` edge with a `funeral-ribbon` | 5 s | none | one way only |
