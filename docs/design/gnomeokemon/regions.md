# Regions: what we have, what we keep, what we add, what each looks like

**Status: draft proposal.** The game ships seven courses today (`COURSE_META` in `games/gnomeokemon/src/snap/world.ts`).
This file checks each against the lore, says keep, re-home or rename, proposes new ones, and lists decor for all of
them. Nothing here changes the game; the code follow-ups are at the bottom. Origins of the Gnomokemon themselves:
[origin.md](origin.md). Their behaviour: [temperaments.md](temperaments.md).

Anchors: every decor item names the lore entry it comes from (`entries/fescue/<id>.md` unless it says otherwise). A
**Status** column says whether it is `in game` (comment in `world.ts`), `rename` (it is built, it just has a better
reason now) or `new` (proposed).

## 1. The verdict

| # | Course in the game | Verdict | What it is, in lore | Setting it follows |
|---|---|---|---|---|
| 1 | Fescue Lawn | **Keep** | A compressed tour of Fescue, Mossbottom to the Verge | Fescue |
| 2 | Desert Yard | **Re-home to the Yard** | The Yard's *Dry Yard* (Lawn Gnome Panic's World 2), down the town road from the Lab | the Yard |
| 3 | Drainpipe Deeps | **Keep** | The Gutters wing under Birdbath Keep | Fescue |
| 4 | Cistern Reef | **Keep, re-home as a place** | The Cistern wing: the drowned hall under the Keep. "Reef" is a gnome's grand name for it | Fescue |
| 5 | The Kiln & Shed | **Keep, rename "The Stopping Road"** | The road the Kiln-born rolled the Mower along, Kiln to Shed | Fescue |
| 6 | Starlight Greenhouse | **Keep, re-home to the Lab's back lot** | "The Glasshouse": Gnome Jesus's own greenhouse, at the back of his lot | Lab (edge of Fescue) |
| 7 | Frosty Birdbath | **Keep, rename "The Rime"** | The Keep's Basin in its one week of hard frost | Fescue |
| + | *(new)* The Compost Heap | **Adopt** | "Gnomes got this one right": a steaming mound on Thatchford Downs | Fescue |
| + | *(new)* The Hose Run | **Adopt** | The Hose ridden downstream by Tag, Rockery to Thatchford | Fescue |
| + | *(new)* Cloverfield Ranch | **Adopt** | Flat farm country, aphid ranches, Red Ants in empty barns | Fescue |
| + | *(later)* Hedgewood Canopy | **Backlog** | A ride along the top of the hedges past the Paper Spire | Fescue |

**Nothing is cut.** Three names change, one region moves house, and two courses stop pretending to be separate
places. The reasons:

- **Desert Yard moves, not dies.** A desert inside Fescue would have to explain a desert behind the Fence, and the
  Fence's far side is a loose thread ([the-fence](../../lore/entries/fescue/the-fence.md)). But the **Yard already has a
  Dry Yard**: [Lawn Gnome Panic's World 2](../../lore/entries/the-yard/dry-yard.md), with armadillos and lizards. Snap's
  armadillans and sunlizards are those animals. R-020 puts the Lab where Fescue meets the Yard's town, so the Dry Yard
  is a short ride from the Lab's own door and adds nothing R-020 had not already accepted. How Tag's walk gets between
  the Lab and the walled garden is never shown (a loose thread, below).
- **The Reef and the Deeps are two wings of one dungeon.** The [Drainpipe Deeps](../../lore/entries/fescue/drainpipe-deeps.md)
  already has the Gutters (Clogmaw), the Cistern ("a huge drowned hall with pillars and a sunken Pipewright barracks")
  and the Backflow. Snap's Deeps course is the Gutters. Its Reef course is the Cistern.
- **Kiln & Shed spans two places far apart** (the Kiln in the Rockery, the Shed on the Verge). Together they are
  exactly the route the [Kiln-born](../../lore/entries/fescue/kiln-born.md) took rolling the Mower back to the Shed
  (the [Stopping Stone](../../lore/entries/fescue/stopping-stone.md) entry). That is one road, and it deserves one name.
- **The Greenhouse is not in Fescue's map.** A glasshouse beside the Shed would add a Tall One building to Gnomomia's
  design docs (R-006). On the Lab's back lot it adds nothing to Fescue, and it explains why the grader is the
  last creature.
- **Frosty Birdbath is the Keep, in winter.** Fescue has no stated seasons, and the Rain school is "water and cold"
  ([sun-rain-bloom](../../lore/entries/fescue/sun-rain-bloom.md)). One hard-frost week a year costs nothing.

**"World 1 to 7" is the wrong shape.** The numbering suggests a ladder. The real geography is a loop out from the
Lab, and a vertical stack under the Keep. See the map in section 4.

## 2. Home and also-seen-in

Every species has one *home* (its Gnomokedex region) and some appear in other courses. Rule (from
[origin.md](origin.md#home-and-also-seen-in)): a Gnomokemon turns up wherever its **wants** are satisfied; write the
reason down. Species that appear in more than one course today:

| Species | Home | Also seen in | Why (from its "wants") |
|---|---|---|---|
| Kilnpup | The Rockery | Lawn, Dry Yard, Stopping Road | warm hearthstones: sun-baked rock, Kiln heat |
| Unfired | The Rockery | Lawn, Dry Yard, Deeps, Stopping Road | to be finished in the Kiln: it is walking there, slowly |
| Staghorn | Mossbottom Vale | Lawn, Dry Yard | its grubs' log mounds; fence-post stumps count |
| Paperwasp | Hedgewood | Lawn, Dry Yard | a Paper Spire: clay pot stacks are near enough |
| Hoseleech | Thatchford Downs | Lawn, Deeps, Cistern | water pressure: anywhere the pipes leak |
| Dewdrop | Thatchford Downs | Lawn, Deeps | a clean puddle: the Deeps have plenty |
| Strawight | Cloverfield | Lawn, Stopping Road | guarding rows until the Straw King returns: it follows the straw bales |
| Grubthorn | Mossbottom Vale | Lawn (far north), Stopping Road | leading his clan **south**; he is met mid-flight, going the other way |
| Minimower | The Verge | Lawn, Stopping Road | nothing anyone can name; it is simply near the Shed |
| Glowmoth | The Kiln & Shed | Stopping Road, Glasshouse | warm lanterns and Heartspark glow: the Kiln, the Glasshouse lamp |

Everything else is single-region. Two are worth fixing in the next code pass: **Grubthorn and Gnome Spirit** are
Mossbottom species who spawn at the far end of the Lawn ride. Grubthorn is covered above. The Gnome Spirit
("keeper of the lawn's balance", Mossbottom Vale) should stay Mossbottom's: give it a home sighting in the vale and
let the far-north one be its farewell.

## 3. Shapes

The game's rail is a `CatmullRomCurve3`. **Only the Lawn and the Dry Yard have their own curves**; the other five
reuse the Lawn's (`createCourseCurve` returns `createLawnCurve()` for them), and the difference lies in tunnels and
scenery. The proposal gives each region a different rail *shape* so the rides feel different even before the props
land. Shape words:

| Shape | What it means for the ride |
|---|---|
| **Ribbon** | an S-curve across open ground, sightlines hidden by tunnels (today's Lawn) |
| **Descent** | the rail tilts or spirals downward; each wing is an act |
| **Processional** | near-straight, with props lined up either side, ending on a vista |
| **Basin** | a slow oval around a central object; one side of the ride is always the far shore |
| **Loop** | starts and ends at the same door |
| **Ring** | a circuit round a landmark, finishing back where it began, slightly higher |
| **Spiral up** | the rail climbs around a mound; the best shots look *down* |
| **Run** | a line along a river, with one drop |
| **Long straight** | flat and open; huge sky; far-off subjects, all about zoom |

| Region | Shape | Today's rail |
|---|---|---|
| Fescue Lawn | Ribbon, south to north, ~47 units, swing about 5 either side | its own curve (`createLawnCurve`) |
| Dry Yard | Ribbon through a gap in a ridge | its own curve (swing about 4.5) |
| Drainpipe Deeps (Gutters) | Descent, three tight levels | reuses the Lawn curve |
| Cistern Reef | Basin: circles a sunken Pedestal | reuses the Lawn curve |
| Stopping Road | Processional, ends facing the Shed door | reuses the Lawn curve |
| Glasshouse | Loop: out of the Lab's glass door and back to it, ending on Gnome Jesus | reuses the Lawn curve |
| The Rime | Ring round the frozen Basin | reuses the Lawn curve |
| Compost Heap *(new)* | Spiral up | new |
| Hose Run *(new)* | Run, one drop at the Spinning Fountains | new |
| Cloverfield Ranch *(new)* | Long straight | new |
| Hedgewood Canopy *(later)* | Ribbon along a ledge, at height | new |

## 4. How the regions sit

```
        THE YARD (town side)                       FESCUE (inside the Fence)

   Dry Yard <--- town road ---[ THE FIELD LAB ]--- Tag's Walk ---> Mossbottom Vale
                              |  (R-019, R-020)                        |
                  Glasshouse -+  back lot               Thatchford Downs
                  (Loop)                              Compost Heap . Hose Run
                                                            |
                                                     Cloverfield Ranch   Hedgewood
                                                            |             (later)
                                                     BIRDBATH KEEP  <-- one column, three rides
                                                        The Rime       (top: the frozen Basin)
                                                        Gutters        (middle: the Deeps)
                                                        Cistern Reef   (bottom: the drowned hall)
                                                            |
                                          The Rockery ---- Stopping Road ---- The Verge
                                            (the Kiln)                          (the Shed)
```

The Lawn course is a quick tour through the top half of that picture. The new courses unpack its zones one at a
time. The Lab is the only place with a door out to both columns.

## 5. Region sheets

Each sheet: what it is, mood, shape, Gnomokemon (with their rank), decor, the one sad note (Fescue rule 9), loose
threads, and the three **hero shots** a player should be able to get.

---

### 1. Fescue Lawn

**What it is:** a tour of Fescue from Mossbottom Vale in the south to the Verge in the north, compressed into one ride.
Setting: Fescue. **Mood:** morning, bright, bees. **Shape:** Ribbon.

**Gnomokemon (home order):** Sproutling, Mossback, Staghorn, Thimblekin (Mossbottom); Dewdrop, Hoseleech, Magpie
Thief (Thatchford); Strawight (Cloverfield); Paperwasp, Hedgewright, Acorndrake (Hedgewood); Kilnpup, Unfired (Rockery);
Bellrat (Keep); Grubthorn, Gnome Spirit (Mossbottom bosses, met in the north); Minimower (Verge boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Hedge tunnel, hollow-log tunnel | clipped hedge, a fallen log | the Hedgewood's edge; the Beetle Barrows | [hedgewood](../../lore/entries/fescue/hedgewood.md), [mossbottom-vale](../../lore/entries/fescue/mossbottom-vale.md) | in game |
| Pond with ripple ring | a pond | Puddlemere | [puddlemere](../../lore/entries/fescue/puddlemere.md) | in game |
| The Great Green Garden Hose | a garden hose | the Hose | [the-hose](../../lore/entries/fescue/the-hose.md) | in game |
| Sprinkler fountains | sprinkler heads | the Spinning Fountains | [spinning-fountains](../../lore/entries/fescue/spinning-fountains.md) | in game |
| Fallen log, straw bale, Rockery stones | a log, a bale, rock-garden stones | Beetle Barrow; Strawight's row; the Rockery | [the-rockery](../../lore/entries/fescue/the-rockery.md) | in game |
| Shed and Birdbath silhouettes, picket fence | a shed, a birdbath, a fence | the Dark House, the Keep, the Fence | [the-shed](../../lore/entries/fescue/the-shed.md), [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md), [the-fence](../../lore/entries/fescue/the-fence.md) | in game |
| Mushroom houses | toadstools | Mossbottom's houses | mossbottom-vale ("a Tall One knelt to plant the first mushrooms") | new |
| The Glaze Shrine well | a garden well | Mossbottom's Glaze Shrine | [glaze-shrines](../../lore/entries/fescue/glaze-shrines.md) | new |
| A table laid for forty | a trestle table | the Puddleby's table | [thatchford-downs](../../lore/entries/fescue/thatchford-downs.md) | new |
| Cracked mill wheel | a water wheel toy | the old mill wheel | thatchford-downs (cracked by the First Rumble) | new |
| Stepping stones at the ford | pavers | Thatchford ford | [thatchford](../../lore/entries/fescue/thatchford.md) | new |
| The Trowel bridge | a trowel stuck in the dirt | Gnorwin's Trowel | [clayfoot-trowel](../../lore/entries/fescue/clayfoot-trowel.md) | new |
| Scarecrow Rise, Crow's Perch | a scarecrow and a post | Scarecrow Rise | [cloverfield](../../lore/entries/fescue/cloverfield.md) | new |
| Paper Spire | a wasp nest | the Paper Spire | hedgewood (the wasp tower) | new |
| Even-Cut stripes | a mown strip | the Shorn | [the-shorn](../../lore/entries/fescue/the-shorn.md) | new |

**Sad note: the molehills.** Down both edges of the course runs a line of fresh molehills heading *south*, thin in
Mossbottom, thick at the Verge. The dog is walking the wrong way. The mole clans are fleeing the shaking
([mole-clans](../../lore/entries/fescue/mole-clans.md)). Nothing in the course says so.

**Loose threads:** what the table for forty is laid for is in the Puddleby's entry; the Trowel stays unexplained.
**Hero shots:** Grubthorn mid-flight against the Verge stripes; a Sproutling at Puddlemere with the Keep behind it;
a Paperwasp circling its Spire at the edge of a hedge tunnel.

---

### 2. Dry Yard

**What it is:** the Yard's Dry Yard (see the [dry-yard entry](../../lore/entries/the-yard/dry-yard.md)), reached by the
town road from the Lab. Setting: **the Yard**, so mowers and engines are allowed (R-002) but none appear.
**Mood:** high noon, heat shimmer. **Shape:** Ribbon through a gap in a ridge.

**Gnomokemon:** Armadillan, Sunlizard, Cactuskin (Wild); Tumblewight (Elite).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Red-rock mesas | stacks of terracotta pots | the Mesas | the-yard dry-yard | in game |
| Saguaro and barrel cacti | ornamental cacti in gravel | the Giants of the Dry | dry-yard | in game |
| Oasis puddle | a plant saucer | the Oasis | dry-yard | in game |
| Tumbleweeds | dry brush bundles | wanderers | the-yard entries | in game |
| Adobe House at the far end | a stucco house, porch step worn smooth | the Quiet House | [tall-ones](../../lore/entries/core/tall-ones.md): a house is a trace | in game |
| Raked gravel in rows | a rake pattern | the Furrows of the Hand | tall-ones | new |
| Wind-chimes | hanging pipe chimes | the Singing Reeds | tall-ones | new |
| The dry rain barrel | a rain barrel | the Empty Barrel | tall-ones | new |
| A porch light that never comes on | an exterior light | the Hanging Lantern | tall-ones | new |

**Sad note: the rake lines.** The raked pattern in the gravel is the only perfectly straight thing for a mile, and
the wind is rubbing it out. Each ride the lines are a little softer. (This only works if the course remembers.)

**Loose threads:** how long ago the porch step was last sat on. **Hero shots:** an Armadillan unrolling to bait in
the Furrows; a Tumblewight pinned against a saguaro; a Sunlizard on the porch step with the Quiet House dark behind.

---

### 3. Drainpipe Deeps (the Gutters)

**What it is:** the Gutters wing of the [Drainpipe Deeps](../../lore/entries/fescue/drainpipe-deeps.md): upper pipes,
ankle-deep water, rats and leeches, Clogmaw at the bottom. Setting: Fescue. **Mood:** green-black, dripping, close.
**Shape:** Descent: three levels of pipe, each lower and wetter than the last.

**Gnomokemon:** Rustcrab (Wild), Hoseleech, Dewdrop, Unfired (seen), Clogmaw (Boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Stone walkway under the rail | a gutter ledge | the Pipewrights' walk | [pipewrights](../../lore/entries/fescue/pipewrights.md) | in game |
| Drainpipe arches | downpipe sections | the Pipe Arches | [drainpipe-deeps](../../lore/entries/fescue/drainpipe-deeps.md) | in game |
| Cyan cistern crystals | algae glow | the Cistern lamps | drainpipe-deeps | in game |
| Dripping droplets | leaking joints | the Weeping | drainpipe-deeps | in game |
| Brass valves with hand-wheels | garden tap fittings | the Valves | [great-valve](../../lore/entries/fescue/great-valve.md) | in game (title) |
| Pipewright chalk marks | chalk on pipe | Gromwell's tallies | [master-gromwell](../../lore/entries/fescue/master-gromwell.md) | new |
| Gnorwin's Ledger, on a ledge | a notebook | the Ledger | [gnorwins-ledger](../../lore/entries/fescue/gnorwins-ledger.md) | new |
| Clay valve seals, cracked | rubber washers (gnomes made them in clay) | the seals | [the-backflow](../../lore/entries/fescue/the-backflow.md) | new |

**Sad note: the clay seals.** The seals are cracked, and the iron ones would have held. Forty Pipewrights were lost
in the Backflow ([the-backflow](../../lore/entries/fescue/the-backflow.md)). The course points at the seals, once, and
says nothing about why they failed.

**Loose threads:** why the seals failed (the Backflow's hidden truth, which Snap never reveals). **Hero shots:** Clogmaw filling an arch; a Rustcrab claw-up on a ledge; a Dewdrop in the one dry patch.

---

### 4. Cistern Reef (the Cistern)

**What it is:** the drowned hall of the Cistern wing: pillars, kelp-grown, a sunken barracks. Setting: Fescue
(with the Sea Mower under R-032). **Mood:** blue-green, shafts of light, calm after the Deeps. **Shape:** Basin.

**Gnomokemon:** Kelpsprite, Cisterneel, Barnacle Knight (Wild); Drowned Toad (Elite); Sea Mower (Boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Sandy basin floor | silt | the Sea Floor | drainpipe-deeps | in game |
| Swaying kelp | water weed | the Kelp | drainpipe-deeps | in game |
| Rising bubbles | air in the pipes | the Breath | drainpipe-deeps | in game |
| Sunken Birdbath ruins | the Keep's footings | the Old Pedestal | [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md) | in game |
| Rows of tin-can helms | cans left by Pipewrights | the Forty Helms | [the-backflow](../../lore/entries/fescue/the-backflow.md) | new |
| Pipewright barracks bunks | bunk frames | the Barracks | drainpipe-deeps | new |
| A hand-wheel the size of a cart wheel | the Great Valve's wheel | the Wheel | great-valve | new |

**Sad note: the Forty Helms.** Barnacle Knights wear a tin-can helm "and a quiet corner of the reef" is all they want.
On the reef floor a row of empty tin-can helms stands in rows, set down by someone neat. There are forty. Nobody
photographs them on purpose.

**Loose threads:** what became of Gromwell, who stayed at the Valve. **Hero shots:** a Kelpsprite in a sunbeam;
a Cisterneel threading the Pillars; the Sea Mower rising in front of the Old Pedestal.

---

### 5. The Stopping Road (was Kiln & Shed)

**What it is:** the road the [Kiln-born](../../lore/entries/fescue/kiln-born.md) rolled the Mower along, from the Kiln to
the Shed ([stopping-stone](../../lore/entries/fescue/stopping-stone.md)), as the ride sees it today. Setting: Fescue.
**Mood:** dusk, ember-orange, hush. **Shape:** Processional. Ends facing the barred Shed door.

**Gnomokemon:** Kilnpup, Unfired, Glowmoth (Wild), Kilnwarden (Boss), plus Strawight, Grubthorn and Minimower.

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Glowing furnace arch | a clay oven, a kiln | the Kiln | [the-kiln](../../lore/entries/fescue/the-kiln.md) | in game |
| Waystone obelisks | stone markers | Stopping Stones | [stopping-stone](../../lore/entries/fescue/stopping-stone.md) | in game |
| Mower silhouette behind the door | the Mower | Old Rumble | [the-mower](../../lore/entries/fescue/the-mower.md) | in game |
| Scorched, mown earth | the Verge | the Verge | [the-verge](../../lore/entries/fescue/the-verge.md) | in game |
| Barred door with a crack | a shed door, rusting bars | the Shed's door | [the-shed](../../lore/entries/fescue/the-shed.md) | rename |
| Seven waystones, **two named** | seven markers | the Kiln-born's rests | [kiln-born](../../lore/entries/fescue/kiln-born.md) | new |
| Black Dew puddles | petrol, rainbow-skinned | Black Dew | [black-dew](../../lore/entries/fescue/black-dew.md) | new |
| The Waking Rope, hanging | a pull cord | the Waking Rope | [waking-rope](../../lore/entries/fescue/waking-rope.md) | new |

**Sad note: the seven waystones.** Seven markers line the road, one for each Kiln-born. Two are carved with names
(Gnorwin Clayfoot and Moss). The other five are worn blank. The songs never agree who they were.

**Loose threads:** the Kiln lit itself four nights before Gnomomia begins; Snap does not show the lighting.
**Hero shots:** a Kilnwarden between two waystones; a Glowmoth over a Black Dew puddle; the Shed door with the
Minimower in front, tiny against it.

---

### 6. Starlight Greenhouse (the Glasshouse)

**What it is:** Gnome Jesus's own greenhouse, on the back of the Lab's lot. A Tall One's glasshouse that came with the
lot, never mown because glass kept the Mower out. Setting: the Lab (the edge of Fescue). **Mood:** midnight, glass,
mist, moonlight and cold tea. **Shape:** Loop. Out of the Lab's glass back door, round the benches, back to the door.

**Gnomokemon:** Mooncap, Starbeetle, Dewghost (Wild); Clockwork Frog (Elite); Bonsai Titan, Gnome Jesus (Boss/Mythic).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Midnight flagstones | patio pavers | the Flags | tall-ones (traces) | in game |
| Glass arches | greenhouse panes | the Tall-eye Walls | [tall-eyes](../../lore/entries/fescue/tall-eyes.md) | in game |
| Glowing spores, bioluminescent ferns | moss and spores | the Lamps of Night | none needed | in game |
| Moonlit shrine at the end | a bird-feeder shrine | the Lab's Glaze Shrine | [glaze-shrines](../../lore/entries/fescue/glaze-shrines.md) | in game |
| Porcelain pot under the Bonsai Titan | a bonsai pot | the Pot | tall-ones | in game |
| Potting benches, a cold teapot and cup | benches, tea | Jesus's tea, always cold | [R-019/R-020 lines](../../lore/rulings.md) | new |
| An **empty picture frame** facing the door | a Tall One's picture frame | the Last Page | origin.md section 3 | new |
| The Dressing Room's mirror panes | a glass pane that reflects | the Long Glass | R-019 | new |

**Sad note: the Last Page.** A Tall One's picture frame, empty, stands on the potting bench facing the door. He never
mentions it. When the player has a good Jesus photo, it goes in the frame. Until then it is blank.

**Loose threads:** how old he is; whether the halo is a Tall-eye. **Hero shots:** a Mooncap in a pane's reflection;
the Clockwork Frog mid-hop, wound; Jesus, framed, facing the lens.

---

### 7. The Rime (was Frosty Birdbath)

**What it is:** Birdbath Keep in the one week of hard frost: the Basin frozen, the courtyard still, the chimneys
smoking. Setting: Fescue. **Mood:** pale morning, snow squeak, steam. **Shape:** Ring around the Basin, ending back at
the Keep's gate, slightly higher.

**Gnomokemon:** Snowcap, Icicle Imp, Pinego (Wild); Frosthound, Chimney Owl (Elite); Frost King (Boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Frozen Birdbath Keep at the end | a frozen birdbath | the Basin | [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md) | in game |
| Snowy hedges | frosted clippings | the Hedges | hedgewood | in game |
| Ice tunnels | icicled downpipes | the Glass Throats | drainpipe-deeps | in game |
| Drifting snowflakes | snow | the Quiet | sun-rain-bloom (Rain = cold) | in game |
| Chimney pots, smoking | terracotta pots | the Keep's chimneys | birdbath-keep | new |
| Royal Robins, puffed in a row | robins | the Royal Robins | [world-map](../gnomomia/world-map.md) | new |
| A small snow gnome at the gate | a snowman | the gate snow-gnome | [queen-marigold](../../lore/entries/fescue/queen-marigold.md) | new |

**Sad note: the small snow gnome.** Every morning a small snow gnome stands at the Keep's gate. Nobody admits to
building it. The Keep has had a child-queen for thirty years.

**Loose threads:** whose face the Frost King wears. **Hero shots:** the Frosthound racing the Basin's rim; a
Chimney Owl turning its head; the Frost King under the Keep's one lit window.

---

## 6. Adopted regions

Each starts from "what did a Tall One stop doing here?".

### The Compost Heap *(adopt)*

**Thatchford Downs, a mini-dungeon.** "The Compost Heap (gnomes got this one right)": the one place gnomes name an
object correctly. A steaming mound in the rat country. **Shape:** Spiral up; the best shots look down. **Mood:**
warm, wet, the only place that smells of anything.
- **Gnomokemon (from the bestiary):** Earthworm giant (Docile, "to turn the compost"), Heap rat (Territorial, "the
  Heap is their kingdom"), Grub swarm (Skittish), **Rotgut, Rat of the Heap** (Boss, "his throne of peelings").
- **Decor:** a throne of peelings; a wheelbarrow tipped on its side; bone-white eggshell terraces; steam vents; a
  fork stuck upright (Rotgut's Fork's namesake, [bestiary](../gnomomia/bestiary.md)).
- **Sad note:** in the cold season gnomes quietly leave a bowl of peelings at the base for the Heap's rats, though
  they are at war with them.

### The Hose Run *(adopt)*

**The Hose, ridden downstream.** World-map says the Hose "can be ridden downstream on a leaf-raft from Flintdelve to
Thatchford". Tag wades it instead, with the camera on his back. **Shape:** Run with one drop at the Spinning Fountains.
**Mood:** bright, loud water, spray on the lens.
- **Gnomokemon:** Water beetle (Territorial, dives), Pond frog (Skittish), Hoseleech (Territorial), Muck sprite (a
  living puddle from the leaking Fountains; Shy, splashes).
- **Decor:** the Spigot at the top ([the-spigot](../../lore/entries/fescue/the-spigot.md)); kinks and leaks making
  rapids; the old leaf-raft moored, empty; the Spinning Fountains firing at random.
- **Sad note:** the raft is moored where the Pipewrights ran it, and nobody has taken it down since the Backflow.

### Cloverfield Ranch *(adopt)*

**The flat country.** "The only flat land in Fescue" (the Last Mowing). Aphid herds, snail-carts, half-empty ranches.
**Shape:** Long straight; huge sky. **Mood:** afternoon, hum, no cover.
- **Gnomokemon (from the bestiary):** Strawight (home), aphid herds (Docile), Red Ants (Territorial; they moved into
  empty ranches), crows (Skittish, from Crow's Perch).
- **Decor:** Scarecrow Rise; honeydew churns at Honeydew Ranch; snail-cart tracks; a cart abandoned mid-haul.
- **Sad note:** the ranchers' barns are full of Red Ants milking the aphids, as the ranchers did, in the ranchers'
  rooms.

### Hedgewood Canopy *(later)*

A ledge ride along the top of the hedges: the Paper Spire, Hedgewright stumps, Wildling holy hedges. Later, after
Compost Heap and Hose Run prove the model. **Sad note:** a count of stumps on one side and of un-felled hedges on the
other; it is not a fair count.

## 7. Species that need a second look

Not cuts, but the lore has a question to answer first.

| Species | Problem | Suggestion |
|---|---|---|
| Hedgewright | the Hedgewrights are a gnome guild, not a creature | recast as a Hedgewright's wood-golem, or rename "Sawdust Sentry" |
| Thimblekin | wants "everything you own, preferably shiny", identical to the bestiary's Feral | keep, but say it is a Feral's little shadow in a thimble |
| Sea Mower, Minimower | the Mower is the only engine in Fescue (lore rule 8) | R-032: Mower-kin, creatures that look the part and run on nothing |
| Clockwork Frog | a wind-up thing, but needs winding | keep: it runs only while wound, so it is not a machine that runs by itself |
| Frost King | what is his face | keep it unanswered |
| Gnome Jesus (#036) | a person in the Gnomokedex | keep: it is the point (origin.md section 3) |

## 8. Follow-ups for the game (not in this PR)

1. Rename `COURSE_META` labels: Dry Yard (the Yard), The Stopping Road, The Glasshouse, The Rime. Drop "World N".
2. Give each course its own rail shape (only Lawn and Desert have one today).
3. Split `LawnSpawn` home and sighting: a `reason` string per extra sighting.
4. Stopping Road: seven waystones, two named. Glasshouse: the empty frame. Rime: the gate snow-gnome. Lawn: the
   south-running molehill trail.
5. New courses in order: Compost Heap, Hose Run, Cloverfield Ranch.
6. `dex.ts`: the Sea Mower's "wants" line mentions a propeller; reword it to match R-032 (Mower-kin have no engine).
7. `models.ts` comments still say "Giant Goofy Fetch Dog from Gnome Company" and the prefab id is `giant-fetch-dog`:
   fine to keep the id, fix the comment so the dog reads as Tag.
