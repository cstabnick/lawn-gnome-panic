# Regions: what we have, what we keep, what we add, what each looks like

**Status: draft proposal.** The game ships seven courses today (`COURSE_META` in `games/gnomeokemon/src/snap/world.ts`).
This file checks each against the lore, says keep, re-home or rename, proposes new ones, and lists decor, motifs and
secrets for all of them. The game's code has only had small lore fixes (see section 9); renames and new rides are
follow-ups. Origins of the Gnomokemon themselves: [origin.md](origin.md). Their behaviour:
[temperaments.md](temperaments.md).

Every decor item names the lore entry it comes from (`entries/fescue/<id>.md` unless it says otherwise). A **Status**
column says whether it is `in game` (comment in `world.ts`), `rename` (it is built, it just has a better reason now) or
`new` (proposed). Anything in a "Gnomomia plot" shape (quest items, boss reveals, open questions) is left out on
purpose: see origin.md rule 0.1.

## 1. The verdict

| # | Course in the game | Verdict | What it is, in lore | Setting it follows |
|---|---|---|---|---|
| 1 | Fescue Lawn | **Keep** | A compressed tour of Fescue, Mossbottom to the Verge | Fescue |
| 2 | Desert Yard | **Re-home to the Yard** | The Yard's *Dry Yard* (Lawn Gnome Panic's World 2), down the town road from the Lab | the Yard |
| 3 | Drainpipe Deeps | **Keep** | The Gutters wing under Birdbath Keep | Fescue |
| 4 | Cistern Reef | **Keep, re-home as a place** | The Cistern wing: the drowned hall under the Keep. "Reef" is a gnome's grand name for it | Fescue |
| 5 | The Kiln & Shed | **Keep, rename "The Stopping Road"** | The way Gnorwin carried the Stopping Stone, from the Kiln through the Rockery pass to the Verge | Fescue |
| 6 | Starlight Greenhouse | **Keep, re-home to the Lab's back lot** | "The Glasshouse": Gnome Jesus's own greenhouse | Lab (edge of Fescue) |
| 7 | Frosty Birdbath | **Keep, rename "The Rime"** | The Keep's Basin in its one frozen week, Fescue's only named season | Fescue |
| + | *(new)* The Compost Heap | **Adopt** | "Gnomes got this one right": a steaming mound on Thatchford Downs | Fescue |
| + | *(new)* The Hose Run | **Adopt** | The Hose ridden downstream by Tag, Rockery to Thatchford | Fescue |
| + | *(new)* Cloverfield Ranch | **Adopt** | Flat farm country, aphid ranches, Red Ants in empty barns | Fescue |
| + | *(later)* Hedgewood Canopy | **Backlog** | A ride along the top of the hedges past the Paper Spire | Fescue |

**Nothing is cut.** Four names change, one region moves house, and two courses stop pretending to be separate
places. The reasons:

- **Desert Yard moves, not dies.** A desert inside Fescue would have to explain a desert behind the Fence, and the
  Fence's far side is a loose thread ([the-fence](../../lore/entries/fescue/the-fence.md)). But the **Yard already has a
  Dry Yard**: [Lawn Gnome Panic's World 2](../../lore/entries/the-yard/dry-yard.md), with armadillos and lizards. Snap's
  armadillans and sunlizards are those animals. R-020 puts the Lab where Fescue meets the Yard's town, so the Dry Yard
  is a short ride from the Lab's own door. **No Fescue-home species is seen there** (the code now spawns only
  Dry Yard natives). How Tag's walk gets between the town side and the walled garden is never shown (a loose thread).
- **The Reef and the Deeps are two wings of one dungeon.** The [Drainpipe Deeps](../../lore/entries/fescue/drainpipe-deeps.md)
  already has the Gutters (Clogmaw), the Cistern ("a huge drowned hall with pillars and a sunken Pipewright barracks")
  and the Backflow. Snap's Deeps course is the Gutters. Its Reef course is the Cistern. The Great Valve and the forty
  lost Pipewrights' tools are in the third wing, the Backflow, and **Snap never goes there**.
- **Kiln & Shed spans two places far apart** (the Kiln in the Rockery, the Shed on the Verge). The lore has
  Gnorwin carry the [Stopping Stone](../../lore/entries/fescue/stopping-stone.md) from the Kiln out toward the Blade,
  and the world map has a Rockery pass from the Rockery to the Verge. One road, one name: **the Stopping Road**.
- **The Greenhouse is not in Fescue's map.** A glasshouse beside the Shed would add a Tall One building to Gnomomia's
  design docs (R-006). On the Lab's back lot it adds nothing to Fescue, and it explains why the grader waits there.
- **Frosty Birdbath is the Keep, in winter.** The Rain school is "water and cold"
  ([sun-rain-bloom](../../lore/entries/fescue/sun-rain-bloom.md)). Fescue gets **one named season, the Rime**: a week
  the Basin freezes. That also covers the dex's "until the Rime ends", where it used to say "spring thaw".

**"World 1 to 7" is the wrong shape.** The numbering suggests a ladder. The real geography is a loop out from the
Lab, and a vertical stack under the Keep. See the map in section 4.

## 2. Home and also-seen-in

Every species has one *home* (its Gnomokedex region) and some appear in other courses. Rule (from
[origin.md](origin.md#home-and-also-seen-in)): a Gnomokemon turns up wherever its **wants** are satisfied; write the
reason down. Species that appear in more than one course today (after the Dry Yard fix):

| Species | Rank | Home | Also seen in | Why (from its "wants") |
|---|---|---|---|---|
| Kilnpup | Starter | The Rockery | Lawn, Stopping Road | warm hearthstones: sun-baked rock, the Warden's coals |
| Unfired | Elite | The Rockery | Lawn, Deeps, Stopping Road | to be finished in the Kiln: it is walking there, slowly |
| Hoseleech | Wild | Thatchford Downs | Lawn, Deeps, Cistern | water pressure: anywhere the pipes leak |
| Dewdrop | Starter | Thatchford Downs | Lawn, Deeps | a clean puddle: the Deeps have plenty |
| Strawight | Wild | Cloverfield | Lawn, Stopping Road | guarding rows until the Straw King returns: it follows the straw bales |
| Grubthorn | Boss | Mossbottom Vale | Lawn, Stopping Road | leading his clan south: caught in flight, wherever and whenever (no date) |
| Minimower | Boss | The Verge | Lawn, Stopping Road | to stand by the Shed door and hum along |
| Glowmoth | Wild | The Kiln & Shed | Glasshouse | a warm lantern: the Glasshouse lamp |

Everything else is single-region. **Gnome Spirit** (home Mossbottom Vale, "keeper of the lawn's balance") appears at
the far end of the Lawn ride. Give it a home sighting in the vale and let the far one be its farewell.

## 3. Shapes

The game's rail is a `CatmullRomCurve3`. **Only the Lawn and the Dry Yard have their own curves**; the other five
reuse the Lawn's (`createCourseCurve` returns `createLawnCurve()` for them), and the difference lies in tunnels and
scenery. The proposal gives each region a different rail *shape* so the rides feel different even before the props
land. Shape words:

| Shape | What it means for the ride |
|---|---|
| **Ribbon** | an S-curve across open ground, sightlines hidden by tunnels (today's Lawn) |
| **Descent** | the rail tilts or spirals downward; each level is an act |
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
                  Glasshouse -+  back lot                     Thatchford Downs
                  (Loop)                                      Compost Heap . Hose Run
                                                                       |
                                              Cloverfield Ranch --- BIRDBATH KEEP --- Hedgewood
                                              (west of the Keep)        |           (north-east, later)
                                                            The Rime       (top: the frozen Basin)
                                                            Gutters        (middle: the Deeps)
                                                            Cistern Reef   (bottom: the drowned hall)
                                                                       |
                                          The Rockery ---- Stopping Road ---- The Verge
                                            (the Kiln)    (Rockery pass)         (the Shed)
```

The Lawn course is a quick tour through the top half of that picture. The new courses unpack its zones one at a
time. The Lab is the only place with a door out to both columns.

## 5. Motifs that run through several rides

Rides feel like one world when the same small things turn up in different places. None of these is a quest or a
reveal; each is something to notice.

1. **The Unfired compass.** Every Unfired, in every ride, faces the Rockery and shuffles that way (its want: to be
   finished in the Kiln). A player who notices can find the Kiln from anywhere. The Lab's map table has one small
   wobbly clay figure doing the same.
2. **The Hose thread.** The Hose appears in the Lawn, the Hose Run, and as a leak in the Gutters: a dripping pipe with
   "THATCHFORD" chalked on it (the leak that makes the Downs soggy).
3. **Sweepers.** One spotless swept strip crosses the Lawn ride with a broom leaning on a mushroom (the old gnome
   who sweeps, [places-and-people](../gnomomia/places-and-people.md)). In the Rime, Snowcaps sweep the Keep's steps. Neither
   is commented on.
4. **Glowmoths go where the light is.** The Warden's coals on the Stopping Road, the Glasshouse lamp, a sunken
   lantern in the Cistern, a firefly cloud at the Lawn's end.
5. **The Basin light shaft.** In the Cistern, a shaft of light falls through the Basin's drain. After the player has
   ridden the Rime, the shaft is dark and there is ice on the ceiling. It links the top of the Keep to its bottom.
6. **Pressed specimens.** Each ride hides one pressed leaf at a set spot (a moss tuft, a clover, Rockery grit, an ice
   sliver). They fill a case in the Archive. A full case changes one Jesus line.

## 6. Region sheets

Each sheet: what it is, mood, shape, Gnomokemon (with their rank), decor, **what to add**, the one sad note (Fescue
rule 9), loose threads, hero shots and a secret.

---

### 1. Fescue Lawn

**What it is:** a tour of Fescue from Mossbottom Vale in the south to the Verge in the north, compressed into one ride.
Setting: Fescue. **Mood:** morning, bright, bees. **Shape:** Ribbon.

**Gnomokemon (home order):** Sproutling, Mossback, Staghorn, Thimblekin (Mossbottom); Dewdrop, Hoseleech, Magpie
Thief (Thatchford); Strawight (Cloverfield); Paperwasp, Hedgewright, Acorndrake (Hedgewood); Kilnpup, Unfired
(Rockery); Bellrat (Keep); Grubthorn, Gnome Spirit (Mossbottom bosses); Minimower (Verge boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Hedge tunnel, hollow-log tunnel | clipped hedge, a fallen log | the Hedgewood's edge; the Beetle Barrows | [hedgewood](../../lore/entries/fescue/hedgewood.md), [mossbottom-vale](../../lore/entries/fescue/mossbottom-vale.md) | in game |
| Pond with ripple ring | a pond | Puddlemere | [puddlemere](../../lore/entries/fescue/puddlemere.md) | in game |
| The Great Green Garden Hose | a garden hose | the Hose | [the-hose](../../lore/entries/fescue/the-hose.md) | in game |
| Sprinkler fountains | sprinkler heads | the Spinning Fountains | [spinning-fountains](../../lore/entries/fescue/spinning-fountains.md) | in game |
| Fallen log, straw bale, Rockery stones | a log, a bale, rock-garden stones | Beetle Barrow; Strawight's row; the Rockery | [the-rockery](../../lore/entries/fescue/the-rockery.md) | in game |
| Shed and Birdbath silhouettes, picket fence | a shed, a birdbath, a fence | the Dark House, the Keep, the Fence | [the-shed](../../lore/entries/fescue/the-shed.md), [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md), [the-fence](../../lore/entries/fescue/the-fence.md) | in game |
| Mushroom houses | toadstools | Mossbottom's houses | mossbottom-vale ("a Tall One knelt to plant the first mushrooms") | new |
| The well | a garden well | Mossbottom's Glaze Shrine | [glaze-shrines](../../lore/entries/fescue/glaze-shrines.md) | new |
| A table laid for forty | a trestle table | the Puddleby's table | thatchford-downs | new |
| Cracked mill wheel with water beetles nesting in it | a water-wheel toy | the old mill wheel | [thatchford-downs](../../lore/entries/fescue/thatchford-downs.md) | new |
| Stepping stones at the ford | pavers | Thatchford ford | [thatchford](../../lore/entries/fescue/thatchford.md) | new |
| A trowel the size of a bridge | a Tall One's trowel | the Trowel | [tall-ones](../../lore/entries/core/tall-ones.md) (traces are huge) | new |
| Scarecrow Rise, Crow's Perch | a scarecrow and a post | Scarecrow Rise | [cloverfield](../../lore/entries/fescue/cloverfield.md) | new |
| Paper Spire | a wasp nest | the Paper Spire | hedgewood (the wasp tower) | new |
| Even-Cut stripes | a mown strip | the Shorn | [the-shorn](../../lore/entries/fescue/the-shorn.md) | new |
| One spotless swept strip | a swept path | the sweeper's path | motif 3 | new |

**Add:** Dewdrops leap into the Spinning Fountains' spray in time with the fountain; the Magpie Thief steals a thrown
Bait apple and drops it in the eaves of the Thatchford stalls.

**Sad note: the molehills.** Down both edges of the course runs a line of fresh molehills heading *south*, thin in
Mossbottom, thick at the Verge. The dog is walking the other way. The mole clans are fleeing the shaking
([mole-clans](../../lore/entries/fescue/mole-clans.md)). Nothing in the course says so.

**Loose threads:** what the table for forty is laid for; the Trowel stays unexplained.
**Hero shots:** Grubthorn mid-flight against the Verge stripes; a Sproutling at Puddlemere with the Keep behind it;
a Paperwasp circling its Spire at the edge of a hedge tunnel.
**Secret:** a Grubthorn and the well in one frame earns one extra Jesus line about the long road south.

---

### 2. Dry Yard

**What it is:** the Yard's Dry Yard (see the [dry-yard entry](../../lore/entries/the-yard/dry-yard.md)), reached by the
town road from the Lab. Setting: **the Yard**, so mowers and engines are allowed (R-002) but none appears.
**Mood:** high noon, heat shimmer. **Shape:** Ribbon through a gap in a ridge.

**Gnomokemon (all Dry Yard natives):** Armadillan, Sunlizard, Cactuskin (Wild); Tumblewight (Elite). **A boss is
missing** (see proposed species).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Red-rock mesas | stacks of terracotta pots | the Mesas | the-yard dry-yard | in game |
| Saguaro and barrel cacti | ornamental cacti in gravel | the Giants of the Dry | dry-yard | in game |
| Oasis puddle | a plant saucer | the Oasis | dry-yard | in game |
| Tumbleweeds | dry brush bundles | wanderers | dry-yard | in game |
| Adobe House at the far end | a stucco house with a porch step | the Quiet House | [tall-ones](../../lore/entries/core/tall-ones.md): a house is a trace | in game |
| Raked gravel in rows | a rake pattern | the Furrows of the Hand | tall-ones | new |
| Wind-chimes | hanging pipe chimes | the Singing Reeds | tall-ones | new |
| The dry rain barrel | a rain barrel | the Empty Barrel | tall-ones | new |
| A half-buried rusted riding mower | an old Yard mower | the Sleeper | [riding-mowers](../../lore/entries/the-yard/riding-mowers.md) | new |
| Big paw prints in the gravel, which Tag sniffs | a big dog's prints | (a Yard dog's) | [biscuit](../../lore/entries/the-yard/biscuit.md) | new |

**Add:** engine noise from over the wall (the Yard's races); a night variant, the Armadillo Moon (Lawn Gnome Panic's
level 2-3).

**Sad note:** two hollows are worn into the porch step, side by side. One is deeper.

**Loose threads:** how long ago the porch step was last sat on. **Hero shots:** an Armadillan unrolling to bait in
the Furrows; a Tumblewight pinned against a saguaro; a Sunlizard on the porch step with the Quiet House dark behind.
**Secret:** the night variant has a Moon Armadillan (proposed boss).

---

### 3. Drainpipe Deeps (the Gutters)

**What it is:** the Gutters wing of the [Drainpipe Deeps](../../lore/entries/fescue/drainpipe-deeps.md): upper pipes,
ankle-deep water, rats and leeches, Clogmaw at the bottom. Setting: Fescue. **Mood:** green-black, dripping, close.
**Shape:** Descent: three levels of pipe, each lower and wetter than the last, so the water visibly rises.

**Gnomokemon:** Hoseleech, Dewdrop, Unfired (seen), Clogmaw (Boss), and **Rustcrab (Wild), who climbs up from the
wing below**. Add gutter rats and pipe leeches (both in the bestiary).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Stone walkway under the rail | a gutter ledge | the Pipewrights' walk | [pipewrights](../../lore/entries/fescue/pipewrights.md) | in game |
| Drainpipe arches | downpipe sections | the Pipe Arches | [drainpipe-deeps](../../lore/entries/fescue/drainpipe-deeps.md) | in game |
| Cyan cistern crystals | algae glow | the Cistern lamps | drainpipe-deeps | in game |
| Dripping droplets | leaking joints | the Weeping | drainpipe-deeps | in game |
| Brass tap fittings with hand-wheels | garden tap fittings | the Valves (small ones) | drainpipe-deeps | rename |
| A dripping pipe chalked "THATCHFORD" | a leaking joint | a Pipewright's mark | [pipewrights](../../lore/entries/fescue/pipewrights.md) | new |
| A Hoseleech clamped on a leak, the drip stops | a leech on a joint | its "sunny bank" | motif 2 | new |

**Add:** Clogmaw fills an arch; a Pester shoves it one pipe-length ("it just wants to move").

**Sad note: the height ladder.** A chalked ladder of marks on one pipe: the apprentice measured themselves against it
every year. The marks go on, and stop. No date, no comment.

**Loose threads:** none given away. **Hero shots:** Clogmaw filling an arch; a Rustcrab claw-up on a ledge; a Dewdrop
in the one dry patch. **Secret:** photograph the Hoseleech on its leak and the drip stops; a Weeping frame earns a
line.

---

### 4. Cistern Reef (the Cistern)

**What it is:** the drowned hall of the Cistern wing: pillars, weed-grown, a sunken barracks. Setting: Fescue (with the
Sea Mower under R-032). **Mood:** blue-green, shafts of light, calm after the Deeps. **Shape:** Basin.

**Gnomokemon:** Kelpsprite, Cisterneel, Barnacle Knight (Wild); Drowned Toad (Elite); Hoseleech (seen); Sea Mower
(Boss). Proposed: **Mother Vesh**, the leech queen (bestiary), as an Elite.

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Sandy basin floor | silt | the Sea Floor | drainpipe-deeps | in game |
| Swaying kelp | water weed | the Kelp | drainpipe-deeps | in game |
| Rising bubbles | air in the pipes | the Breath | drainpipe-deeps | in game |
| Sunken Birdbath ruins | the Keep's footings | the Old Pedestal | [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md) | in game |
| Pipewright barracks bunks | bunk frames | the Barracks | drainpipe-deeps ("a sunken Pipewright barracks") | new |
| A sunken sentry box with a duty roster scratched inside | a tin shelter | the Watch Box | drainpipe-deeps | new |
| A shaft of light through the Basin's drain | the birdbath drain | the Light | motif 5 | new |
| A sunken lantern with Glowmoths | an old lantern | the Lamp | motif 4 | new |

**Sad note: the duty roster.** Inside the Watch Box, scratched in the tin, a roster of shifts. The last name is never
ticked as relieved. The Barnacle Knight stands by it and "guards the sunken Birdbath steps even though the war ended
centuries ago".

**Loose threads:** none given away. **Hero shots:** a Kelpsprite in a sunbeam; a Cisterneel threading the pillars; the
Sea Mower rising in front of the Old Pedestal. **Secret:** frame the light shaft and a Glowmoth together for a line.

---

### 5. The Stopping Road (was Kiln & Shed)

**What it is:** the way Gnorwin carried the Stopping Stone, from the Kiln through the Rockery pass to the Verge (see
[stopping-stone](../../lore/entries/fescue/stopping-stone.md) and the [world map](../gnomomia/world-map.md)), as the ride
sees it today. Setting: Fescue. **Mood:** dusk, hush. **Shape:** Processional. Ends facing the barred Shed door.

**Gnomokemon:** Kilnpup, Unfired, Glowmoth (Wild), Kilnwarden (Boss), plus Strawight, Grubthorn and Minimower.

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Kiln mouth, **cold**; the glow is the Warden sitting in it (its chest coals), plus Glowmoths | a clay oven | the Kiln | [the-kiln](../../lore/entries/fescue/the-kiln.md) | rename (the glow is no longer the Kiln) |
| Waystone obelisks, **seven**, each a rest on the road | stone markers | the Rests | [kiln-born](../../lore/entries/fescue/kiln-born.md) | rename |
| Mower silhouette behind the door | the Mower | Old Rumble | [the-mower](../../lore/entries/fescue/the-mower.md) | in game |
| Scorched, mown earth | the Verge | the Verge | [the-verge](../../lore/entries/fescue/the-verge.md) | in game |
| Barred door with a crack | a shed door, rusting bars | the Shed's door | [the-shed](../../lore/entries/fescue/the-shed.md) | rename |
| Black Dew puddles | petrol, rainbow-skinned | Black Dew | [black-dew](../../lore/entries/fescue/black-dew.md) | new |
| The King's cart on the Shorn, with the grass mown round it | a toy cart | the King's cart | [the-shorn](../../lore/entries/fescue/the-shorn.md) | new |
| Rust-rats under the Shed door | rats | (bestiary: Rust-rat) | the-shed | new |

**Not shown:** the Waking Rope hanging outside (it stays behind the door), and the Kiln lit.

**Sad note: the seven Rests.** Seven stones line the road, one for each Kiln-born. One carries a footprint in clay,
the Clayfoot mark. The other six are scratched all over with names by gnomes of many villages (MOSS among them) until
none is legible. The songs never agree who they were.

**Loose threads:** the Kiln lit itself four nights before Gnomomia begins; Snap does not show that. **Hero shots:** a
Kilnwarden between two Rests; a Glowmoth over a Black Dew puddle; the Shed door with the Minimower in front, tiny
against it. **Secret:** the Kilnwarden kneels if a Kilnpup is in the frame (never the trowel: that is Gnomomia's beat).

---

### 6. Starlight Greenhouse (the Glasshouse)

**What it is:** Gnome Jesus's greenhouse on the back lot of the Fescue Field Lab, a Tall One's glasshouse that came
with the lot. It is the one place nobody has ever cut anything. Setting: the Lab (the edge of Fescue). **Mood:**
midnight, glass, mist, moonlight and cold tea. **Shape:** Loop. Out of the Lab's glass back door, round the benches,
back to the door.

**Gnomokemon:** Mooncap, Starbeetle, Dewghost, Glowmoth (Wild); Clockwork Frog (Elite); Bonsai Titan, Gnome Jesus (Boss).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Midnight flagstones | patio pavers | the Flags | [tall-ones](../../lore/entries/core/tall-ones.md) | in game |
| Glass arches | greenhouse panes | the Tall-eye Walls | [tall-eyes](../../lore/entries/fescue/tall-eyes.md) | in game |
| Glowing spores, bioluminescent ferns | moss and spores | the Lamps of Night | [sun-rain-bloom](../../lore/entries/fescue/sun-rain-bloom.md) (Bloom) | in game |
| Moonlit shrine at the end | a bird-feeder shrine | the Lab's Glaze Shrine | [glaze-shrines](../../lore/entries/fescue/glaze-shrines.md) | in game |
| Porcelain pot under the Bonsai Titan | a bonsai pot | the Pot | tall-ones | in game |
| Potting benches, a cold teapot and cup | benches, tea | Jesus's tea, always cold | R-019/R-020 lines | new |
| The bench drawer where the Eye-Box was found | a drawer | the Drawer | [eye-box](../../lore/entries/fescue/eye-box.md) | new |
| Seed trays, one per region's soil (moss, clover, Rockery grit) | seed trays | the Trays | [mossbottom-vale](../../lore/entries/fescue/mossbottom-vale.md) | new |
| A thumbprint fired into the glaze of the Titan's pot | a thumbprint | a trace | tall-ones | new |
| An **empty picture frame** facing the door | a Tall One's picture frame | **Page Thirty-Six** | origin.md section 3 | new |

**Sad note: Page Thirty-Six.** A Tall One's picture frame, empty, stands on the potting bench facing the door. He never
mentions it. When the player has a good Jesus photo, it goes in the frame. Until then it is blank.

**Loose threads:** how old he is; whether the halo is a Tall-eye. **Hero shots:** a Mooncap in a pane's reflection; the
Clockwork Frog mid-hop, wound; Jesus, framed, facing the lens. **Secret:** frame Jesus with the empty frame behind him:
no line at all.

---

### 7. The Rime (was Frosty Birdbath)

**What it is:** Birdbath Keep in the one week of hard frost: the Basin frozen, the courtyard still, the chimneys
smoking. Setting: Fescue. **Mood:** pale morning, snow squeak, steam. **Shape:** Ring around the Basin, ending back at
the Keep's gate, slightly higher.

**Gnomokemon:** Snowcap, Icicle Imp, Pinego (Wild); Frosthound, Chimney Owl (Elite); Frost King (Boss). The Keep's own
**Bellrat** should turn up here too (the Keep is its home).

| Item | Real thing | Gnome name | Anchor | Status |
|---|---|---|---|---|
| Frozen Birdbath Keep at the end | a frozen birdbath | the Basin | [birdbath-keep](../../lore/entries/fescue/birdbath-keep.md) | in game |
| Snowy hedges | frosted clippings | the Hedges | hedgewood | in game |
| Ice tunnels | icicled downpipes | the Glass Throats | drainpipe-deeps | in game |
| Drifting snowflakes | snow | the Quiet | sun-rain-bloom (Rain = cold) | in game |
| Chimney pots, smoking | terracotta pots | the Keep's chimneys | birdbath-keep | new |
| Royal Robins, puffed in a row | robins | the Royal Robins | [world-map](../gnomomia/world-map.md) | new |
| Snowcaps sweeping the Keep's steps | a gnome-sized broom | the sweepers | motif 3 | new |
| A small snow gnome at the gate | a snowman | the gate snow-gnome | [queen-marigold](../../lore/entries/fescue/queen-marigold.md) | new |
| One lit window | a window | the Queen's window | queen-marigold | new |

**Add:** a Pester knocks snow off a roof onto a Snowcap.

**Sad note: the small snow gnome.** Every morning a small snow gnome stands at the Keep's gate. Nobody admits to
building it. The Queen has not been outside the gate since she was eight. (This reads the same whether the regency
is a lie or the truth, which Fescue keeps open.)

**Loose threads:** who builds the snow gnome. (The Frost King is Basin stones bound by frost: nobody says whose face.)
**Hero shots:** the Frosthound racing the Basin's rim; a Chimney Owl turning its head; the Frost King under the Keep's
one lit window. **Secret:** the snow gnome is gone the morning after a Divine roll. Never explained.

---

## 7. Adopted regions

Each starts from "what did a Tall One stop doing here?".

### The Compost Heap *(adopt)*

**Thatchford Downs, a mini-dungeon** (world-map, lore-rules rule 1). A steaming mound in the rat country. **Shape:**
Spiral up; the best shots look down. **Mood:** warm, wet, the only place that smells *warm*.
- **Gnomokemon (from the bestiary):** Earthworm giant (Docile, "to turn the compost"), Heap rat (Territorial, "the
  Heap is their kingdom"), Grub swarm (Skittish), **Rotgut, Rat of the Heap** (Boss, "his throne of peelings").
- **Decor:** a throne of peelings with a fork stuck upright beside it; a tipped wheelbarrow; eggshell terraces; steam
  vents; the **Neat Chapel's clipped edge running straight into the rot** ([thatchford-downs](../../lore/entries/fescue/thatchford-downs.md)):
  "tend it" against "let it grow" in one frame.
- **Sad note:** in the cold season gnomes quietly leave a bowl of peelings at the base for the Heap's rats, though they
  are at war with them.
- **Secret:** Rotgut and an earthworm in one frame ("The Heap turns").

### The Hose Run *(adopt)*

**The Hose, ridden downstream.** The Hose can be ridden on a leaf-raft from Flintdelve to Thatchford (world-map). Tag
wades it instead. The run **ends above the Mossbottom brook** and never shows the Spigot's handle. **Shape:** Run with
one drop at the Spinning Fountains. **Mood:** bright, loud water, spray on the lens.
- **Gnomokemon:** Water beetle (Territorial, dives), Pond frog (Skittish), Hoseleech (Territorial), Muck sprite (a
  living puddle from the leaking Fountains; Shy, splashes). Proposed: **Hosemouth** (below).
- **Decor:** kinks and leaks making rapids; Flintdelve's lift baskets at the top; the Spinning Fountains firing at
  random; Muck sprites bursting in the spray.
- **Sad note:** above Thatchford the reeds are tied in knots, one for each gnome who went to the Keep for work and
  never wrote (the Quiet Years).

### Cloverfield Ranch *(adopt)*

**The flat country**, west of the Keep. "The only flat land in Fescue" (the Last Mowing). Aphid herds, snail-carts,
half-empty ranches. **Shape:** Long straight; huge sky. **Mood:** afternoon, hum, no cover.
- **Gnomokemon (from the bestiary):** Strawight (home), aphid herds (Docile), Red Ants (Territorial; they moved into
  empty ranches), ladybirds (hunt aphids; bait scatters them, no gore), **Old Gleaner** (proposed boss).
- **Decor:** Scarecrow Rise with the Straw King (never framed face-on; the nearest thing to a Tall One sighting); honeydew churns at
  Honeydew Ranch; snail-cart tracks leading toward the Keep; the Shorn's stripes at the field edge; Crow's Perch.
- **Sad note:** the ranchers' barns are full of Red Ants milking the aphids, as the ranchers did, in the ranchers'
  rooms. Sodbury's school bell rings once per ride.
- **Secret:** Bait fed to Old Gleaner and she lands instead of swooping (the peaceful route).

### Hedgewood Canopy *(later)*

A ledge ride along the top of the hedges: the Paper Spire, Hedgewright stumps, Wildling holy hedges. Later, after
Compost Heap and Hose Run prove the model. **Sad note:** a count of stumps on one side and of un-felled hedges on the
other; it is not a fair count.

## 8. Species: second looks and proposals

### Needs a second look

| Species | Problem | Resolution |
|---|---|---|
| Hedgewright | a gnome guild, not a creature | lineage **Gnome**: a logger in hiding, not a golem |
| Thimblekin | wants "everything you own, preferably shiny", identical to the bestiary's Feral | lineage **Gnome**: a Feral's little shadow in a thimble |
| Sea Mower, Minimower | the Mower is the only engine in Fescue (lore rule 8) | R-032: Mower-kin, Grown creatures with no engine, fuel, Heartspark or blade |
| Clockwork Frog | a wind-up thing | a Tall One's wind-up toy; runs only while wound, so it is no machine that runs by itself |
| Gnome Jesus | a person in the Gnomokedex | keep: it is the point (origin.md section 3) |

### Balance of the 42

By element: Bloom 11, Rain 11, Sun 10, **Clay 6, Iron 4**. By home region: Cloverfield, the Verge and the Keep have
**one** each; the Rockery, Deeps and Kiln & Shed have two. The Rockery and the Dry Yard have **no Iron** species, and
the Dry Yard, Compost Heap and Cloverfield have no boss. Proposed fillers, **not in the dex yet** (numbers #043 to
#048 when added):

| id | Name | Element | Rank | Home | Family | Wants | Temperament | Lineage |
|---|---|---|---|---|---|---|---|---|
| oldgleaner | Old Gleaner | clay | Boss | Cloverfield | Winged | Food: the farms are empty, so there is no spilled grain | Skittish; lands for Bait | Grown |
| shardlouse | Shardlouse | iron | Wild | The Rockery | Shelled | Warmth from the humming iron | Shy (hides when Tag is near) | Grown |
| rustrat | Rust-rat | iron | Wild | The Verge | Metal / Furred | Oil from the Shed | Thief | Grown |
| rotgut | Rotgut, Rat of the Heap | sun | Boss | Compost Heap | Furred | His throne of peelings | Territorial | Grown |
| moonarmadillan | Moon Armadillan | clay | Boss | Dry Yard | Shelled | To roll the whole length of the Dry Yard once, under a full moon | Aloof | Grown |
| hosemouth | Hosemouth | iron | Elite | Hose Run | Metal / Hose | A hand to squeeze it once more, the way it remembers | Territorial (sprays when pestered) | Dropped |

That would take Clay to 8 and Iron to 7, and give the Rockery and Verge a second species each. #036 is not "the
last" page: the dex runs to #042 and, with these, #048.

## 9. Follow-ups for the game

**Done in this PR** (small lore fixes to shipped text): the Dry Yard no longer spawns Fescue species; examine lines
that said "beyond the Fence", "an old Mower", "Heartspark", "coral", "Salt", "January", "spring", "Camp", "Giant Fetch
Dog" and "bonfires" are reworded; Minimower and Sea Mower wants and Kilnwarden's "use" are fixed in `dex.ts` and
`jesus.ts`; the Clockwork Frog's maker line is fixed.

**Still to do** (code changes):

1. Rename `COURSE_META` labels: Dry Yard (the Yard), The Stopping Road, The Glasshouse, The Rime. Drop "World N".
2. Give each course its own rail shape (only Lawn and Desert have one today).
3. Split `LawnSpawn` home and sighting: a `reason` string per extra sighting.
4. Stopping Road: the Kiln mouth cold (glow is the Warden's coals), seven Rests. Glasshouse: the empty frame, #036
   facing the lens (not orbiting). Rime: the gate snow-gnome, Bellrat. Lawn: the south-running molehill trail.
5. New courses in order: Compost Heap, Hose Run, Cloverfield Ranch; then the six proposed species.
6. `models.ts` comments still say "Giant Goofy Fetch Dog from Gnome Company"; the prefab id is `giant-fetch-dog` and
   the prefab `about` says the same. Fine to keep the id; fix the comments so the dog reads as Tag.
7. The Lobby: the dog (x about -4.6) and Jesus (x about 2.9) are not "beside" each other, and the rug is elsewhere in the
   room. Move the props or accept the text as loose.
8. Examine lines that conflict with the temperament table (Tumblewight spins at Pester, Frost King roars, Jesus nods at
   the Flute, Kilnwarden salutes Bait, Sea Mower chomps Bait) are *allowed* by the table: Aloof and Sentinel creatures
   may react in place, they just never come or flee.
