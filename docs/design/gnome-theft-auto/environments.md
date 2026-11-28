# Gnome Theft Auto: Environments & Stage Spots

Every place the story and the side quests happen, on the real map, for staging cutscenes in the world: where each
character lives, works and hangs out, what the place looks and sounds like, what the people there are doing, which
vehicle they drive and where it is parked, and how vehicles drive in and out.

**The data is the source of truth.** Every place below is a `Stage` in
[`games/gnome-theft-auto/src/quests/stages.ts`](../../../games/gnome-theft-auto/src/quests/stages.ts) (region files in
`src/quests/stages/*.ts`, types and helpers in `src/quests/stages/kit.ts`). This document describes them; the
coordinates, facings, camera spots, actor marks, idle walks, vehicle marks and drive paths are in the data, and
`src/quests/stages.test.ts` proves each one against the built world (inside the map, on land unless it is a boat scene,
out of building colliders, cameras with a clear line of sight, drive paths that follow the roads and hit nothing).

## How to use this in a cutscene

```ts
import { stageById, castById, vehicleMark, stagesFor, stageForRoom } from './quests/stages';

const st = stageById('side-valve-bay')!;
const tansy = st.marks.find((m) => m.who === 'tansy')!;          // { at: [x, z], yaw, pose, note }
const wide = st.cameras.find((c) => c.id === 'wide')!;             // from/look are [x, heightAboveGround, z]
const ride = castById('tansy')!.vehicle!;                          // { kind: 'zero-turn', glaze, parkedAt, note }
const parked = vehicleMark(ride.parkedAt)!.mark;                   // where her Zero-Turn stands
const getaway = st.paths.find((p) => p.role === 'getaway')!;       // drivable points out to a main road
const idle = st.walks.filter((w) => w.who === 'tansy');            // what she does while nothing is happening
```

- `stagesFor(questId)` lists every stage a quest uses; `stageForRoom(room)` maps an off-map cutscene room
  (`mulch-club`, `side-valve`, `cloverfield-barn`, `unmowed-hollow`, `fells-shrine`, `dust-overlook`) to the in-world
  place it is the inside of, so a scene can cut from the room to the street outside.
- Glaze looks are `Partial<Loadout>` (`@lawn/glaze`): `normalizeLoadout(cast.vehicle.glaze)` gives a full loadout to
  dress the vehicle with.
- Conventions: world x/z in metres; yaw 0 faces +z (south), PI/2 faces +x (east), PI faces -z (north); vehicles drive
  on the right (heading north on a road along x = R, drive at x = R + 2.5).
- In game, `?stagemarks` draws every stage's marks (yellow cones), cameras (blue boxes with a sight line), vehicle marks
  (red parked, orange pull-up, white exit), idle walks (green) and drive paths (magenta). `?stagesets=0` hides the set
  dressing.
- Placing a new spot: `PROBE="x,z" PROBE_R=30 npx vitest run src/quests/stages.probe.test.ts` (from
  `games/gnome-theft-auto`) prints an ASCII map of colliders, roads and water around a point; then add the stage and run
  `npx vitest run src/quests/stages.test.ts -t <stage-id>`.

## Staging notes for writers

- **Every scene can now happen outside.** The six off-map rooms stay for interiors, but each has a street-side stage
  (`stageForRoom`): open on the room, cut to the stage for the walk out, the vehicle and the drive away.
- **People are doing something.** Each resident has at least one idle walk with an activity (Tansy between bench and
  mower, Granny between oven and porch, Big Lou pacing the rope). Start a scene with the cast on their walks, then send
  them to their marks; end it by sending them back.
- **Vehicles arrive and leave.** Every stage has a `pull-up` and an `exit` vehicle mark plus `approach` and `getaway`
  paths of 60 m or more on the roads, so a character can drive in, park, talk and drive off, and the player can be shown
  where to go next. Each character's own vehicle is parked at their home stage (`CAST[].vehicle.parkedAt`) in their
  glaze look.
- **Time of day** is a default (`stage.time`): Don Compost and Big Lou are night people, Vesper inspects at dawn, the
  Overlook is golden hour. Chapter 3's raid is at night in the rain (see the radio lines).
- **Boat scenes:** `canal-raft`, `tessie-nest` and `loch-open-water` are `water: true`; their boat marks and paths are
  on water (checked).
- Character ids in marks that are not in `CAST` are roles (`player`, `hoa-bailiff`, `porcelain-guard`, `press`,
  `spade-guard`, ...): spawn a generic gnome in the right look (`HOA_LOOK`, `PORCELAIN_LOOK`, `DIGGS_LOOK` in the chapter
  files).

## Not built yet (proposed, with prefab-first parts lists)

These places come up in the story or the lore but have no stage yet, because they need more than set dressing on the
open map. Build them from `@lawn/prefabs` first; anything a prefab cannot express goes in the game with a reason.

| Place | Story use | Why not yet | Parts (prefab-first) |
|---|---|---|---|
| The Under-Deck (storm drains under Turfton) | Ch 3: Tansy slips into the drain; Silt-Diver Sal | Needs an interior below the grid; today the `culvert-under-deck` stage is only the grate | an off-map room or a sunken section: `gsr-subsoil-cable-reel`, `barrel`, `torch`, `tin-pail`, `fishing-rod`, `crate`, `clay-jar`; pipes as `cyl` parts in a new `gta-culvert-pipe` prefab |
| City Hall as the upside-down planter | Ch 1 Juniper, finale ending A | The block today is a generic tower; the lore says an upside-down ceramic planter | a new `gta-city-hall-planter` prefab (an inverted terracotta pot, astroturf steps) replacing the block building in `world.ts` (golden-test change, agreed first) |
| The Grand Combine deck | Ch 5 boss fight | The boss runs on the moving combine; a static stage cannot hold it | `grand-combine-boss` prefab exists; marks would be relative to the vehicle, not the map |
| Fescue through the knot-hole | Lore: Pip and Tansy smuggled relics through the fence | Beyond the map fence | an off-map room: `standing-stone`, `stopping-stone`, `village-well`, `glaze-shrine` |
| Inside The Gnomecino | Big Lou's embargo, nightlife | Only the velvet rope is staged | an off-map room: `counter`, `gsr-cafe-table`, `chair`, `gsr-jazz-lamp`, `gsr-dj-booth`, `slot-machine-classic` |
| Thorne Tower penthouse | Vesper's office above the Glaze & Tax counter | 86 m up, no interior | an off-map room: `armchair`, `bookshelf`, `painting`, `lobby-pedestal`, `porcelain-cat`, `grandfather-clock` |
| The South Highway diner interior | Ch 2 "Order Over Chaos" | The diner is a small prefab at scale 5, no interior | an off-map room: `counter`, `stool`, `gsr-cafe-table`, `acorn-cake`, `gsr-roadside-diner-sign` |

<!-- GENERATED -->

<!-- Everything below is generated from src/quests/stages.ts by src/quests/stages.doc.test.ts. Do not edit by hand. -->

## Story and side-quest beats: where each one happens

| Quest | Chapter | Stages |
|---|---|---|
| Fresh Out the Kiln `prologue-fresh-kiln` | 1 | `bus-stop`, `side-valve-bay`, `bodega-front`, `clay-mart-lot` |
| A Roof on Credit `m02-roof-on-credit` | 1 | `side-valve-bay`, `bodega-front` |
| First Contract `first-contract` | 1 | `mulch-club-door`, `unmowed-hollow`, `birdbath-basin` |
| Mower's Keepers `ch1-mowers-keepers` | 1 | `side-valve-bay`, `picnic-median` |
| Two-Coat Tail `ch1-two-coat-tail` | 1 | `city-hall-steps`, `bodega-front`, `patio-gate`, `patio-gallery` |
| The Glaze & Tax Break-In `ch1-tax-break-in` | 1 | `side-valve-bay`, `glaze-tax-office` |
| Founder's Boot & The Kangaroo Court `ch1-founders-boot` | 1 | `side-valve-bay`, `amphitheater` |
| Dew Run on Route South `ch2-dew-run` | 2 | `granny-barn`, `south-highway-diner` |
| The Cloverfield Sprinkler Gauntlet `ch2-sprinkler-gauntlet` | 2 | `granny-barn`, `rooster-windmill`, `south-barn` |
| Order Over Chaos `ch2-vespers-offer` | 2 | `granny-barn`, `south-highway-diner` |
| The Cracked Tablet `ch2-unmowed-tablet` | 2 | `unmowed-hollow`, `sorrel-radio-booth`, `compost-heap` |
| The Salvage Raid `ch3-salvage-raid` | 3 | `side-valve-bay`, `bodega-front`, `culvert-under-deck`, `birdbath-basin`, `ring-road-hideout` |
| Kiln-Resin & Black Ice `ch3-kiln-resin-ice` | 3 | `birdbath-basin`, `theo-camp`, `kiln-shrine`, `salt-plow-blockade` |
| Volatile on Ice `ch3-tundra-drift-run` | 3 | `birdbath-basin`, `dust-safehouse` |
| Runway Flares `ch4-runway-flares` | 4 | `dust-safehouse`, `airfield-apron` |
| The Sandpit Drop `ch4-sandpit-drop` | 4 | `dust-safehouse`, `fort-sandpit-gate`, `fort-sandpit-pad` |
| Nobody Fires the Guard `ch4-spade-truce` | 4 | `dust-safehouse`, `fort-sandpit-gate`, `fort-sandpit-pad` |
| The Even Cut `ch5-even-cut` | 5 | `city-hall-steps`, `bodega-front`, `meridian-finale`, `brenda-throne`, `dust-safehouse` |
| The Grid Truthers `sq-grid-truthers` | side | `bodega-front`, `culvert-under-deck` |
| Porcelain Blues `sq-porcelain-blues` | side | `tall-house-porch` |
| The Fescue Fugitive `sq-fescue-fugitive` | side | `patio-gate`, `patio-gallery`, `granny-barn`, `unmowed-hollow` |
| The HOA Audit `sq-hoa-audit` | side | `city-hall-steps`, `bodega-front`, `clay-mart-lot`, `granny-barn`, `chapel-van`, `birdbath-basin`, `dust-safehouse` |
| Castaway's Dry-Dock `sq-castaway-drydock` | side | `granny-barn`, `canal-raft`, `driftwood-trailer` |
| The Mulch Pyramid Scheme `sq-mulch-pyramid` | side | `side-valve-bay`, `bodega-front`, `patio-gate`, `patio-gallery`, `compost-heap` |
| Biscuit's Lost Squeaky Toy `sq-biscuit-hotdog` | side | `granny-barn`, `biscuits-nap` |
| Snail-Racing Rigging `sq-snail-rigging` | side | `bodega-front`, `shelldon-alley`, `snail-paddock` |
| The Porcelain Support Group `sq-porcelain-support` | side | `unmowed-hollow`, `tall-house-porch` |
| The Great Hose-Pipe Tax Revolt `sq-hose-revolt` | side | `patio-gate`, `putting-green`, `greenhouse-strip`, `brenda-throne` |
| Big Lou's Dry-Hat Embargo `sq-big-lou-embargo` | side | `side-valve-bay`, `gnomecino-door` |
| The Weeping Line `sq-weeping-line` | side | `pebblewick-plots` |
| The Hum at Three `sq-hum-at-three` | side | `pebblewick-tower` |
| The Wobbly Gondola `coast-spokewheel-gondola` | side | `coast-spokewheel` |
| Tubing the Long Spoon `coast-boardwalk-tubing` | side | `coast-last-tube` |
| Pirate Tours, Mostly `coast-bathtub-tours` | side | `coast-pier` |
| The Queen's Treasure `coast-queens-treasure` | side | `coast-pier` |
| Kerbside Rounds `city-kerbside-rounds` | side | `city-hall-steps`, `bodega-front`, `greenhouse-strip`, `kerb-exchange` |
| Impound Run `city-impound-run` | side | `clay-mart-lot`, `pay-n-glaze`, `kerb-exchange` |
| Glow-Band Express `city-glow-band-express` | side | `amphitheater`, `greenhouse-strip`, `kerb-exchange` |
| Penthouse Exclusive `city-penthouse-exclusive` | side | `kerb-exchange` |
| The Skyway Job `city-skyway-robbery` | side | `clay-mart-lot`, `kerb-exchange` |
| Good Neighbour `nc-good-neighbour` | side | `bus-stop` |
| Strike a Pose `nc-strike-a-pose` | side | `bus-stop` |
| The Wheel and the Kit `nc-wheel-and-kit` | side | `bus-stop` |
| Store It, Call It `nc-lockup` | side | `bus-stop` |
| Mind the Verges `nc-mind-the-verges` | side | `bus-stop` |
| The Bent Pin `nc-bent-pin` | side | `bus-stop` |
| Up on the Skyway `nc-skyway` | side | `bus-stop` |
| Odd Jobs `nc-odd-jobs` | side | `bus-stop` |
| Wings Over the Flats `nc-take-off` | side | `bus-stop` |
| Sky Spotting `nc-sky-spotting` | side | `bus-stop` |
| Tuft & Tally `nc-tuft-and-tally` | side | `bus-stop` |
| Last Stop, Pebblewick `nc-last-stop-pebblewick` | side | `bus-stop` |
| Reedwatch `nc-reedwatch` | side | `bus-stop` |
| Hangar and Boathouse `nc-hangar-and-boathouse` | side | `bus-stop` |
| Throw a Party (online) `nc-party` | side | `bus-stop` |
| The Loch Moss Monster `sq-tessie` | side | `loch-dock`, `tessie-nest`, `loch-open-water` |
| Fizz Cup: Rookie Mow-Down `race-rookie-mowdown` | side | `speedway-pits` |
| Fizz Cup: Low & Loud Derby `race-lowrider-derby` | side | `speedway-pits` |
| Fizz Cup: Snail-Coach Endurance `race-snail-endurance` | side | `speedway-pits` |
| Fizz Cup: The Final `race-fizz-cup-final` | side | `speedway-pits` |
| Snowdrop Sled Trials `sq-snowdrop-sled-trials` | side | `gentian` |
| Lines on Pail Pond `sq-pail-pond-lines` | side | `theo-pond` |
| Rutbottom: Knobbly Heat `race-rutbottom-knobbly` | side | `rutbottom-tower` |
| Rutbottom Heats `sq-rutbottom-heats` | side | `rutbottom-pits` |
| The Capwood Run: Open Stage `race-capwood-open` | side | `capwood-paddock` |
| The Cap Count `sq-capwood-cap-count` | side | `capwood-warden` |
| Kerb Row Warm-Up `sr-kerb-row` | side | `street-skyway-foot` |
| Skyway Midnight `sr-skyway-midnight` | side | `street-skyway-foot` |
| La Boucle de Pardonlin `sr-boucle` | side | `street-pardonlin` |
| The Saltbucket Dash `sr-saltbucket-dash` | side | `street-saltbucket` |
| The Ring Road Run `sr-ring-road` | side | `street-skyway-foot` |
| Lost Balls `sq-hedgeworth-lost-balls` | side | `thrift` |
| A Lesson from the Pro `sq-hedgeworth-pro-lesson` | side | `basil` |
| The Ninth Green `sq-hedgeworth-ninth-green` | side | `thrift` |
| Members' Cup `sq-hedgeworth-members-cup` | side | `peony` |
| The Lost Essay `sq-rootwell-lost-essay` | side | `lovage` |
| Rent for the Landlords `sq-anthill-rent` | side | `betony` |
| Night Shift at Levelright `sq-levelright-night-shift` | side | `chard` |
| The Croft by the Silo `sq-windfall-croft-deed` | side | `bramble` |

## The cast: where they live, what they drive

| Character | Home | Also found at | Vehicle (parked at) | Daily routine |
|---|---|---|---|---|
| **Pip "Two-Stroke" Potsworth** `pip` | `side-valve-bay` | `bus-stop`, `bodega-front`, `birdbath-basin`, `dust-safehouse`, `meridian-finale` | zero-turn: His own red Zero-Turn, primer patches and a toolbox strapped on; the push-bike in the prologue is borrowed. (`pip-zero-turn` at (-134, 70)) | Sleeps on a cot behind the Side-Valve parts shelves, meets every snail-coach at the bus stop looking for marks, buys Acorn-Cola at Bodega & Sons, tinkers with his Zero-Turn until it backfires. |
| **Tansy "Side-Valve" Clayfoot** `tansy` | `side-valve-bay` | `dust-safehouse`, `culvert-under-deck`, `meridian-finale` | zero-turn: The smoking orange Zero-Turn always on the bay apron, never quite fixed. (`tansy-zero-turn` at (-141, 70)) | Opens the bay at dawn with chicory coffee, works under a smoking Zero-Turn all day, counts the forty-seven wrenches before locking up; from chapter 4 runs the crew out of the Dust Flats safehouse. |
| **Vesper "The Glazier" Thorne** `vesper` | `glaze-tax-office` | `patio-gallery`, `patio-gate`, `south-highway-diner`, `meridian-finale` | lowrider: A pearl-white Lowrider, gold rims, never a speck of mud; the HOA vans and the Grand Combine do his dirty driving. (`vesper-lowrider` at (44, -50)) | Inspects the Patio Heights astroturf at 06:00 with calipers, holds office hours at the Glaze & Tax counter under Thorne Tower, dines alone at the South Highway diner when he wants a meeting to look casual. |
| **Don Compost** `don-compost` | `mulch-club-door` | - | lowrider: Gloss black Lowrider, whitewalls, chrome bumper, a bodyguard always leaning on it. (`don-lowrider` at (-9, -38)) | Never seen outside before dark. Arrives at the Mulch Club side door at dusk in his black Lowrider, two bodyguards first, then him; leaves at dawn. |
| **Granny Gnertrude** `granny` | `granny-barn` | `meridian-finale` | ride-on: A lilac Ride-On with a hay seat, a cowcatcher and a cooler of pies. (`granny-ride-on` at (-60, 340)) | Bakes at dawn, weighs fenced Fescue relics on the kitchen scale all morning, sits on the porch with the double-barrel over her pumpkins in the afternoon. |
| **Councilwoman Juniper "The Trowel" Vance** `juniper` | `city-hall-steps` | `meridian-finale` | ride-on: Navy pearl Ride-On with a flag on the back, kept spotless to annoy her brother. (`juniper-ride-on` at (24, -68)) | Gives a press statement on the City Hall steps every noon, paces between the flagpoles reading petitions, drives home past Bodega & Sons at dusk. |
| **Mayor Barnaby "Two-Coat" Mulch** `mayor-mulch` | `city-hall-steps` | `patio-gallery` | ride-on: Candy-red Ride-On on its second coat (a third after the finale), bunting, a bell. (`mayor-ride-on` at (40, -68)) | Cuts ribbons in the morning, naps in his office after lunch, slips out to Patio Heights after dark. |
| **Reginald "Quarter-Inch" Vance** `reginald` | `amphitheater` | `granny-barn`, `city-hall-steps` | hoa-van: An HOA Code-Enforcement Van with his calipers on the dashboard. (`reginald-van` at (-112, -90)) | Measures grass with a laser level at 3:00, writes citations until noon, chairs HOA tribunals at the Amphitheater; whistles up a Code-Enforcement Van when anyone argues. |
| **Commander Diggs** `diggs` | `fort-sandpit-gate` | `dust-safehouse`, `meridian-finale` | zero-turn: Olive matte Zero-Turn with a roo-bar; he tears out of the gate on it in chapter 4. (`diggs-zero-turn` at (364, 60)) | Inspects the sandbag line at dawn, drills the Spade Guard on the parade square at noon, sits on the gatehouse step polishing his trowels at dusk. |
| **Elder Bracken** `bracken` | `unmowed-hollow` | `meridian-finale` | walks | Walks the standing-stone ring at dawn, sits in judgement by the fire, refuses to touch anything with an engine. Rides nothing. |
| **Sorrel Tillbrook** `sorrel` | `sorrel-radio-booth` | `unmowed-hollow` | walks | Broadcasts 88.7 Fescue Public Radio from a booth of crates in the hollow: tapes rain at dawn, reads the news at noon, plays forty-five minutes of rain on terracotta at night. |
| **Father Loam** `loam` | `birdbath-basin` | `kiln-shrine`, `chapel-van` | ride-on: His "snowmobile": a Ride-On on spiked tyres with candle lamps and a bell. His old Chapel of Mulch van rots in Mossy Wood. (`loam-snowmobile` at (-4, -352)) | Preaches from his "snowmobile" on the frozen birdbath at dawn, mixes Kiln-Resin by the stove all day, walks up to the northern shrine to bless the resin at dusk. |
| **Wind-Sock Wally** `wally` | `airfield-apron` | - | plane: The Crop Duster on the apron is his; he lends it to anybody who can say the stall speed. (`wally-crop-duster` at (440, -92)) | Sits in a lawn chair at the end of the runway with binoculars, reads the windsock out loud, refuels Crop Dusters, stirs a chili pot nobody may fly over. |
| **Driftwood** `driftwood` | `loch-dock` | `driftwood-trailer`, `canal-raft` | walnut-dinghy: A walnut-shell dinghy tied up at the Loch Moss dock; his turf-raft lives on the canal. (`driftwood-dinghy` at (-726, -574)) | Six months lashed to a lawn-boat trailer in Cloverfield, then the canal, then the Loch Moss dock, always watching the water for Tessie and for the high-tide bell. |
| **John Bodega** `bodega` | `bodega-front` | - | push-bike: A delivery Push-Mower Bike with a crate on the back, chained to the drainpipe. (`bodega-bike` at (-80, 83)) | Behind the counter of Bodega & Sons from dawn to late shift, sweeps clay dust off the step at dusk; Asphalt the cat sits on the crate by the neon window. |
| **Big Lou** `big-lou` | `gnomecino-door` | - | lowrider: Matte black Lowrider with a microfibre-towel seat, parked by the rope. (`lou-lowrider` at (70, -22)) | Works the velvet rope of The Gnomecino from dusk to dawn, towels every hat that comes in, naps in the back booth at noon. |
| **Baroness Brenda** `brenda` | `brenda-throne` | - | push-bike: Glitter-gold Push-Mower Bike with a flamingo ornament; her gang rides the same in pink. (`brenda-bike` at (-56, 202)) | Holds court on her zip-tied lounger throne by the canal all day, reviews her Push-Mower Bike gang at noon, proclaims new laws at dusk. |
| **Clara** `clara` | `tall-house-porch` | - | lowrider: The shock-absorbed Lowrider she lends for refugee runs: pearl white, cosy seat, slammed soft. (`clara-lowrider` at (-550, 36)) | Lights the porcelain lanterns on the Tall House Porch at dusk, counts escaped porcelain gnomes at the porch step, never leaves the porch boards. |
| **Mossley "Plumb-Line" Inkcap** `mossley` | `bodega-front` | `culvert-under-deck` | push-bike: Push-Mower Bike with a windsock and a survey flag. (`mossley-bike` at (-69, 92)) | Sits at a folding table outside Bodega & Sons with survey maps, walks the grid with a plumb-line at noon, stares into the culvert at night. |
| **Burt** `burt` | `clay-mart-lot` | `bodega-front` | hoa-van: A decommissioned HOA van in primer, the badge scraped off. (`burt-van` at (-131, 158)) | Ex-HOA citation writer. Lives in his decommissioned van behind Clay-Mart, drinks coffee outside Bodega & Sons, rereads old citations. |
| **Cedric "Double-Bag" Peat** `cedric` | `bodega-front` | `compost-heap` | mulch-spreader: A glitter-purple Mulch-Spreader leaking craft glitter. (`cedric-spreader` at (-67, 93)) | Pitches "Artisanal Miracle Mulch" outside Bodega & Sons, refills it with dyed sawdust at the Compost Heap after dark. |
| **Farmer Bramble** `bramble` | `granny-barn` | `biscuits-nap`, `south-barn` | combine: A Buck-Iron Combine, green and gold, the one everybody borrows. (`bramble-combine` at (-52, 345)) | Ploughs the Cloverfield rows at dawn, checks the rim of Biscuit's Nap for paw tracks at noon, drinks with Granny on the porch at dusk. |
| **Shelldon "No-Trail" Mucilage** `shelldon` | `shelldon-alley` | `snail-paddock`, `birdbath-basin` | snail-coach: A retired snail-coach he lives in; it never leaves the alley. (`shelldon-coach` at (-100, 72)) | Never steps on a paved road. Feeds his courier snails in the dumpster alley at dawn, sends scrolls all day, scouts the downtown slug paddock at night. |
| **Squeaky-Clean Midge** `midge` | `glaze-clinic` | - | walks | Paces outside the Glaze Clinic doors between patients at 140 BPM, re-glazes anyone the ambulance brings in. |
| **Gate-Guard Gary** `gary` | `patio-gate` | - | walks | Reads a 900-page HOA binder in the sentry box all day, waves luxury Zero-Turns through, sighs at push-bikes. |
| **Rooster "Squall-Box" Weatherby** `rooster` | `rooster-windmill` | - | walks | Roosts on the windmill platform shouting barometric prophecies through a tin funnel; climbs down only for seed. |
| **Fence-Post Frank** `frank` | `south-highway-diner` | - | walks | Leans on his hand-painted sign by the South Highway all day, waving at convoys, eats every meal at the diner counter. |
| **Ash-Shovel Ernie** `ernie` | `compost-heap` | - | walks | Stokes the mulch furnace and roasts chestnuts on a trowel, humming Fescue work-songs. |
| **Thermos Theo** `theo` | `theo-camp` | `birdbath-basin` | walks | Keeps the pine-cone barrel burning, pours tea for anyone who reaches the basin, holds Shelldon's scrolls for collection. |
| **Knot-Hole Nora** `nora` | `knot-hole` | - | walks | Sits on an overturned thimble and watches the neighbour's yard through the knot-hole with a brass spyglass. |
| **Silt-Diver Sal** `sal` | `culvert-under-deck` | - | walks | Fishes acorns and magazines out of the storm grates with a magnet on a string; knows every pipe of the Under-Deck. |
| **Neon-Moth Nina** `nina` | `greenhouse-strip` | `gnomecino-door` | push-bike: Push-Mower Bike strung with fairy lights, glow tyres and violet underglow. (`nina-bike` at (53, -40)) | Sells glow-stick hat-bands from a flowerpot stoop under the grow-lamps all night, shoos the giant moth off the Gnomecino sign. |
| **Turncoat Cam** `turncoat-cam` | `side-valve-bay` | `patio-gate` | zero-turn: Chameleon-finish Zero-Turn with a fin spoiler, bought with the reward money. (`cam-zero-turn` at (161, -127)) | Used to sweep the Side-Valve bay; after chapter 3 races for a Patio Heights charter and parks at the gate. |
| **Dorrit "Dot" Pennywort** `dot` | `kerb-exchange` | `bus-stop` | walks | Opens the Exchange with the first snail-coach, punches a ticket for every job, eats lunch on the bus-stop bench, closes when the board is empty, which it never is. |
| **Hedda Galley** `hedda` | `kerb-exchange` | `city-hall-steps` | walks | Reads every job slip on the Exchange board before the first coffee, then walks the Hall steps with a pencil behind one ear. |
| **Union Boss "Big Wrench" Grout** `grout` | `clay-mart-lot` | - | walks | Holds the morning shift meeting in the Clay-Mart returns yard, then sits on the loading dock with a thermos until the van is loaded. |
| **Mabel Kerbstone** `mabel` | `bus-stop` | - | walks | Drives the one Turfton Taxi; every fare ends at the Central Bus Stop. |

Glaze looks (Pay 'n' Glaze loadouts, `Partial<Loadout>`) are in `CAST[].vehicle.glaze`.

## The landscape and the region looks (terrain pass)

The world is no longer a flat board. `src/landforms/macro.ts` adds big shapes from `src/data/landscape.json` on top
of the region landforms: a mountain at the north edge of the Fells (`mountain/fells`, about 75 m), ridges along the
region seams, rolling hills between the ring roads and the edge, and a rim of high ground round the world. All of it is
cut away to level ground on the highways (roads pass through cuttings), trails, water, flat sites, calm spots and
Turfton, so the stage spots and roads are where they were. A region can no longer be seen from the next one across
the seam. `MAPDUMP=out.png npx vitest run src/terrainMap.probe.test.ts` draws the whole map.

The water is one navigable chain: Loch Moss, the ravine river, the canal, the farm river and the Puddle Sea (and the
upper river from the Birdbath down into the loch). Road bridges are stone arches on earth ramps, 3.4 m above the rivers
and 2.2 m above the canal, so boats pass under; the loch weir has a boat pass in the middle. NPC boats run the whole
chain (`src/boatTraffic.ts`).

Each region has a theme in `src/data/regionThemes.json` (read by `src/regionThemes.ts`; motifs also in each region's
lore entry under "Look and motifs"). Themes mingle over about 45 m at each border, and every region shares the same
light and base materials.

| Region | Roadside | Yards and planting | Signature | Houses |
|---|---|---|---|---|
| Turfton | none (civic gardens in the blocks) | clipped hedges, topiary, flower beds, iron railings on kerbs | stone planters | none |
| Dust Flats | adobe walls | rock gardens, cacti, palms | tall cacti, boulders | adobe houses and huts |
| Mossy Wood | split-rail fences | ferns, mossy log borders | fallen logs | log cabins, cottages |
| Frostbite Fells | snow-capped stone walls | snow pines | cairns | stone snow cottages |
| Cloverfield Farms | hedgerows | drystone walls, hay bales, flower beds | hay bales, scarecrows | thatched cottages |
| Loch Moss | mossy stone walls | reed beds, wattle fences | reeds, cairns | stilt cottages |
| Tallgrass Commons | wattle hurdles | wildflower patches, grasses | bee skeps | toadstool cottages |

Who builds what: `src/landscaping.ts` (Turfton garden blocks), `src/scenery.ts` (tree belts on the hills, roadside
pieces and signature props by theme), `src/settlements.ts` (house clusters with drives, fences and yards along the
outer roads). All three keep clear of every stage spot (`src/stageClear.ts`), so a new piece never lands on a mark.


## Stages by region

## Turfton

### Snail-Coach Stop, Downtown `bus-stop`

**Where:** Turfton, centre (-9, 17), radius 12 m, facing E. **Default time:** day. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `pip-spawn`, `newcomers-club`. **Used by:** `prologue-fresh-kiln`, `intro-tour`, `nc-good-neighbour`, `nc-strike-a-pose`, `nc-wheel-and-kit`, `nc-lockup`, `nc-mind-the-verges`, `nc-bent-pin`, `nc-skyway`, `nc-odd-jobs`, `nc-take-off`, `nc-sky-spotting`, `nc-tuft-and-tally`, `nc-last-stop-pebblewick`, `nc-reedwatch`, `nc-hangar-and-boathouse`, `nc-party`.

**Looks:** A kerbside snail-coach stop on the west pavement of the x = 0 road: a bench, a timetable signpost, a flowerpot and a Clay-Mart billboard over the shelter, the Gnoma truck down the road.

**Sounds:** Snail-coach air brakes, Ride-Ons idling at the lights, a pigeon, Pip talking too fast.

**Who is there (marks):**
- `pip` at (-10, 18) facing NE, stand: bounces on his heels, keys of a borrowed Ride-On spinning on a finger
- `player` at (-7, 15) facing SW, stand: steps off the snail-coach with a Kiln-Debt receipt
- `commuter` at (-12, 13) facing E, sit: on the bench, reading the Turfton Tattler

**What they do while idle (walks):**
- `commuter` (back and forth, 2 points, 1.1 m/s, 3 s stops): walks the pavement to the stop and back, checking the timetable

**Vehicles:**
- `snail-coach-stop`: pull-up snail-coach at (3, 20) facing N: the coach stops northbound, door to the kerb
- `pip-borrowed-bike`: parked push-bike at (-8, 24) facing N, Pip "Two-Stroke" Potsworth's: the borrowed Push-Mower Bike, key in the ignition

**Drive paths:**
- `coach-arrival`: arrival, snail-coach, (3, 120) to (3, 20) (3 points): up the x = 0 road from the south
- `coach-departure`: getaway, snail-coach, (3, 20) to (3, -170) (3 points)
- `pip-to-side-valve`: chase, push-bike, (0, 18) to (-150, 66) (9 points): the prologue route past The Gnomecino (chapter1 waypoints)

**Cameras:** `wide` (establishing: the stop, the road and the coach pulling away); `two-shot` (over the player's shoulder onto Pip).

**Set dressing (prefabs):** `bench`, `signpost`, `flower-pot`.

### The Mulch Club, Side Door `mulch-club-door`

**Where:** Turfton, centre (-14, -30), radius 12 m, facing E. **Default time:** dusk. **Built:** in the world, plus stage set dressing. **Inside:** the off-map cutscene room `mulch-club`. **Quest giver marker:** `mulch-club`. **Used by:** `first-contract`.

**Looks:** The east wall of the Mulch Club in black brick, a lit side door with mushroom lamps either side, a cane-tapping don on the step, a gloss-black Lowrider with whitewalls parked on the pavement strip under a dusk sky.

**Sounds:** A cane tapping three times on a metal armrest, a bodyguard shifting his weight, the Gnomecino-style neon hum from the x = 0 road.

**Who is there (marks):**
- `don-compost` at (-17, -30) facing E, stand: in the doorway, taps three times on his armrest cane; never speaks
- `bodyguard` at (-17, -33) facing E, stand: flanks the door, arms folded, eyes on the road
- `bodyguard` at (-17, -27) facing E, stand: flanks the door, one hand inside his coat
- `player` at (-9, -30) facing W, stand: waits on the pavement outside the Mulch Club side door

**What they do while idle (walks):**
- `bodyguard` (back and forth, 2 points, 1 m/s, 4 s stops): paces the pavement, hand inside his coat, checking the alley
- `don-compost` (back and forth, 2 points, 0.8 m/s, 6 s stops): steps out to the kerb and back, tapping his cane

**Vehicles:**
- `don-lowrider`: parked lowrider at (-9, -38) facing N, Don Compost's: gloss black, whitewalls, chrome bumper, parked on the pavement strip
- `mulch-club-door-pull-up`: pull-up lowrider at (-2, -30) facing S: pulls up on the x = 0 road, southbound lane
- `mulch-club-door-exit`: exit lowrider at (3, -30) facing N: leaves northbound on the x = 0 road

**Drive paths:**
- `mulch-club-approach`: approach, lowrider, (-2, -120) to (-2, -30) (3 points): south down the x = 0 road
- `mulch-club-getaway`: getaway, lowrider, (3, -30) to (3, -180) (3 points): north up the x = 0 road

**Cameras:** `wide` (establishing: the side door, the lamps and the Lowrider on the strip); `two-shot` (over the player's shoulder onto the don at the door); `arrival` (arrival: watches the pull-up mark on the southbound lane).

**Set dressing (prefabs):** 2 x `mushroom-lamp`, `bench`, `barrel`, 2 x `crate`.

### Side-Valve Salvage Bay `side-valve-bay`

**Where:** Turfton, centre (-150, 72), radius 15 m, facing N. **Default time:** day. **Built:** in the world, plus stage set dressing. **Inside:** the off-map cutscene room `side-valve`. **Quest giver marker:** `side-valve`. **Used by:** `prologue-fresh-kiln`, `m02-roof-on-credit`, `ch1-mowers-keepers`, `ch1-tax-break-in`, `ch1-founders-boot`, `ch3-salvage-raid`, `sq-mulch-pyramid`, `sq-big-lou-embargo`.

**Looks:** An open-fronted repair bay in a grey concrete block at the back of the apron, a workbench under a tarp, a smoking orange Zero-Turn parked nose to the bay, a cracked yard of mown stripes and a rolled hose reel.

**Sounds:** A zero-turn idling and coughing, a radio on the bench, a wind-up mower being tested, pigeons on the gutter.

**Who is there (marks):**
- `tansy` at (-143, 73) facing NE, work: working under her Zero-Turn, spanner in one hand
- `pip` at (-135, 74) facing W, sit (0.4 m up): sitting on a crate, flicking a spark plug
- `turncoat-cam` at (-156, 68) facing SE, stand: sweeps the apron with a push-broom, eyes on the bay
- `hoa-process-server` at (-142, 66) facing SW, work: taping an eviction notice to the bay door
- `vesper` at (-154, 68) facing SE, stand: waves a lien from the pull-up, quietly smug
- `player` at (-156, 70) facing SE, stand: stands on the apron with a clipboard

**What they do while idle (walks):**
- `tansy` (back and forth, 2 points, 1 m/s, 4 s stops): walks between the workbench and her mower with a spanner
- `pip` (loop, 3 points, 1 m/s, 3 s stops): circles his mower, checking the blades
- `turncoat-cam` (loop, 3 points, 1 m/s, 2 s stops): sweeps the apron, glancing at the bay

**Vehicles:**
- `tansy-zero-turn`: parked zero-turn at (-141, 70) facing N, Tansy "Side-Valve" Clayfoot's: the smoking orange Zero-Turn, always on the apron, never quite fixed
- `pip-zero-turn`: parked zero-turn at (-134, 70) facing N, Pip "Two-Stroke" Potsworth's: his red Zero-Turn, primer patches and a toolbox strapped on
- `side-valve-bay-pull-up`: pull-up zero-turn at (-150, 72) facing S: the bay pull-up: deliveries drop here
- `side-valve-bay-exit`: exit zero-turn at (-146, 68) facing N: the exit to the z = 60 road

**Drive paths:**
- `side-valve-approach`: approach, zero-turn, (-60, 58) to (-150, 72) (5 points): west along the z = 60 road, then into the bay
- `side-valve-getaway`: getaway, zero-turn, (-146, 68) to (-177, -120) (4 points): out to the z = 60 road, west, then north up the x = -180 road
- `hoa-raid`: chase, hoa-van, (-60, 58) to (-150, 72) (5 points): the HOA raid drives in along the z = 60 road to the apron

**Cameras:** `wide` (establishing: the bay, the apron and the smoking Zero-Turn); `two-shot` (over the player's shoulder onto Vesper at the pull-up); `arrival` (arrival: watches the pull-up mark on the bay apron).

**Set dressing (prefabs):** `workbench`, `tin-pail`, `hose-reel`, 2 x `crate`, 2 x `gta-dew-barrel`, `wheelbarrow`.

### Turfton City Hall Steps `city-hall-steps`

**Where:** Turfton, centre (14, -69), radius 12 m, facing S. **Default time:** day. **Built:** new: exists through its stage set dressing. **Quest giver marker:** `city-hall`. **Used by:** `ch1-two-coat-tail`, `ch5-even-cut`, `sq-hoa-audit`, `city-kerbside-rounds`.

**Looks:** A new stone City Hall built on the north-east block, a stone plaque over the steps, two capture flagpoles, flowerpots and a lectern on a forecourt of fresh paving; ribbon bunting along the front.

**Sounds:** A press scrum murmuring, a ribbon-scissor snip, flags flapping, a Ride-On bell.

**Who is there (marks):**
- `juniper` at (14, -71) facing S, stand: at the podium giving a statement, reading from a card
- `mayor-mulch` at (18, -71) facing W, stand: beside her with giant ribbon scissors, grinning
- `press` at (11, -65) facing NE, stand: facing her with a notepad
- `press` at (17, -65) facing NW, stand: facing her with a camera
- `hoa-inspector-ledger` at (-3, -63) facing SE, work: writing a ticket on a clipboard
- `player` at (6, -68) facing E, stand: stands at the edge of the press scrum

**What they do while idle (walks):**
- `juniper` (back and forth, 2 points, 1 m/s, 4 s stops): paces between the flagpoles reading petitions
- `mayor-mulch` (back and forth, 2 points, 1 m/s, 3 s stops): ambles to his Ride-On and back, waving at the press

**Vehicles:**
- `juniper-ride-on`: parked ride-on at (24, -68) facing S, Councilwoman Juniper "The Trowel" Vance's: navy pearl Ride-On with a flag on the back, spotless
- `mayor-ride-on`: parked ride-on at (40, -68) facing S, Mayor Barnaby "Two-Coat" Mulch's: candy-red Ride-On on its second coat, bunting and a bell
- `city-hall-steps-pull-up`: pull-up ride-on at (14, -62) facing W: pulls up on the z = -60 road, westbound lane
- `city-hall-steps-exit`: exit ride-on at (16, -57) facing E: leaves eastbound on the z = -60 road

**Drive paths:**
- `city-hall-approach`: approach, ride-on, (120, -62) to (14, -62) (3 points): west along the z = -60 road
- `city-hall-getaway`: getaway, ride-on, (16, -57) to (180, -57) (3 points): east along the z = -60 road
- `mayor-to-patio`: chase, ride-on, (0, -60) to (150, -122) (11 points): the chapter 1 tail: Mayor Mulch to the patio

**Cameras:** `wide` (establishing: the new City Hall, the flags and the press); `two-shot` (over the player's shoulder onto Juniper at the podium); `arrival` (arrival: watches the westbound pull-up on the z = -60 road).

**Set dressing (prefabs):** `stone-plaque`, `lectern`, 2 x `capture-flagpole`, 2 x `flower-pot`, `bench`.

### Bodega & Sons, Old Brick Quarter `bodega-front`

**Where:** Turfton, centre (-76, 90), radius 12 m, facing E. **Default time:** night. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `strangers`. **Used by:** `sq-grid-truthers`, `sq-hoa-audit`, `sq-mulch-pyramid`, `sq-snail-rigging`, `prologue-fresh-kiln`, `m02-roof-on-credit`, `ch1-two-coat-tail`, `ch3-salvage-raid`, `ch5-even-cut`, `city-kerbside-rounds`.

**Looks:** A corner grocer in old brick with a neon window of Bodega & Sons on the east face, a folding survey table on the pavement, a crate with a sleeping cat, push-bikes chained by the wall and a mulch-spreader at the kerb.

**Sounds:** The neon buzz of the window sign, a broom on the step, a cat purring, a sales pitch for Miracle Mulch.

**Who is there (marks):**
- `bodega` at (-80, 88) facing SE, work: in the doorway, sweeping the step
- `asphalt` at (-80, 94) facing NE, sit (0.4 m up): the cat, on a crate by the window, eyes half shut
- `mossley` at (-71, 84) facing W, stand: at his folding survey table, sighting along a plumb-line
- `burt` at (-77, 95) facing NW, stand: holding a coffee, leaning on the wall
- `cedric` at (-69, 86) facing E, stand: holding a sample sack of "Miracle Mulch", pitching to passers-by
- `player` at (-70, 90) facing W, stand: stands on the pavement with the bodega in view

**What they do while idle (walks):**
- `bodega` (back and forth, 2 points, 0.8 m/s, 3 s stops): sweeps the step, back and forth along the front
- `mossley` (back and forth, 2 points, 1 m/s, 4 s stops): paces with a plumb-line, sighting the kerb
- `cedric` (loop, 2 points, 1 m/s, 4 s stops): pitches Miracle Mulch to passers-by along the pavement

**Vehicles:**
- `bodega-bike`: parked push-bike at (-80, 83) facing E, John Bodega's: a delivery Push-Mower Bike with a crate on the back, chained to the drainpipe
- `mossley-bike`: parked push-bike at (-69, 92) facing E, Mossley "Plumb-Line" Inkcap's: a Push-Mower Bike with a windsock and a survey flag
- `cedric-spreader`: parked mulch-spreader at (-67, 93) facing S, Cedric "Double-Bag" Peat's: a glitter-purple Mulch-Spreader leaking craft glitter, parked at the kerb
- `bodega-front-pull-up`: pull-up lowrider at (-57, 90) facing N: pulls up on the x = -60 road, northbound lane
- `bodega-front-exit`: exit lowrider at (-62, 90) facing S: leaves southbound on the x = -60 road

**Drive paths:**
- `bodega-approach`: approach, lowrider, (-57, 200) to (-57, 90) (3 points): north up the x = -60 road
- `bodega-getaway`: getaway, lowrider, (-62, 90) to (-62, 200) (3 points): south down the x = -60 road

**Cameras:** `wide` (establishing: the neon window and the bodega front from the x = -60 road); `two-shot` (over the player's shoulder onto Cedric and the survey table); `arrival` (arrival: watches the northbound pull-up on the x = -60 road).

**Set dressing (prefabs):** `table`, 2 x `chair`, `crate`, `gta-vending-cola`, `bench`.

### Shelldon's Dumpster Alley `shelldon-alley`

**Where:** Turfton, centre (-80, 72), radius 12 m, facing N. **Default time:** dawn. **Built:** new: exists through its stage set dressing. **Quest giver marker:** `strangers-shelldon`. **Used by:** `sq-snail-rigging`.

**Looks:** A grass strip behind the z = 60 road, with two green dumpsters, a lettuce bed, a wicker basket, a stack of crates and a retired snail-coach he lives in, the Bodega block to the south.

**Sounds:** Snails sliding over lettuce, a dumpster lid knocking, the drip of a hose, traffic on the road.

**Who is there (marks):**
- `shelldon` at (-88, 72) facing E, kneel: kneeling at the lettuce bed, feeding lettuce to courier snails
- `player` at (-76, 70) facing W, stand: stands at the edge of the grass, the snail-coach behind Shelldon

**What they do while idle (walks):**
- `shelldon` (loop, 2 points, 0.8 m/s, 5 s stops): walks between his snail-coach and the lettuce bed, counting snails

**Vehicles:**
- `shelldon-coach`: parked snail-coach at (-100, 72) facing E, Shelldon "No-Trail" Mucilage's: a retired snail-coach he lives in; it never leaves the alley
- `shelldon-alley-pull-up`: pull-up snail-coach at (-84, 68) facing N: pulls up on the grass strip just off the z = 60 road
- `shelldon-alley-exit`: exit snail-coach at (-88, 68) facing N: leaves from the grass strip

**Drive paths:**
- `shelldon-approach`: approach, snail-coach, (-150, 63) to (-84, 68) (4 points): east along the z = 60 road, into the strip
- `shelldon-getaway`: getaway, snail-coach, (-88, 68) to (-180, 58) (4 points): out to the z = 60 road, west

**Cameras:** `wide` (establishing: the grass strip and the snail-coach from the z = 60 road); `two-shot` (over the player's shoulder onto Shelldon in the lettuce); `overhead` (overhead: the lettuce bed, the snails and the bins).

**Set dressing (prefabs):** 2 x `compost-bin`, `veggie-bed`, `wicker-basket`, 2 x `crate`.

### The Downtown Slug Paddock `snail-paddock`

**Where:** Turfton, centre (26, -12), radius 14 m, facing N. **Default time:** night. **Built:** new: exists through its stage set dressing. **Used by:** `sq-snail-rigging`.

**Looks:** A picket-fenced slug pen on bare ground between the tower and the z = 0 road, a market-stall with a chalk odds board, one crate and a veggie bed of romaine inside the pen, all lit by a single sodium lamp.

**Sounds:** Slugs squelching, a chalk board being rattled, a wrangler whistling, the drone of traffic on the z = 0 road.

**Who is there (marks):**
- `slug-bookie` at (38, -12) facing W, stand: at the betting stall, taking slips for the next race
- `slug-wrangler` at (26, -12) facing NW, stand: loops the pen with a stick and a bucket of lettuce
- `player` at (24, -16) facing S, stand: sneaks in through the gap in the pen fence

**What they do while idle (walks):**
- `slug-wrangler` (loop, 4 points, 0.9 m/s, 4 s stops): loops the pen, prodding slugs with a stick
- `slug-bookie` (back and forth, 2 points, 0.8 m/s, 4 s stops): counts a wad of race tokens behind the stall

**Vehicles:**
- `snail-paddock-pull-up`: pull-up lowrider at (22, 3) facing E: pulls up on the z = 0 road, eastbound lane
- `snail-paddock-exit`: exit lowrider at (30, -2) facing W: leaves westbound on the z = 0 road

**Drive paths:**
- `snail-paddock-approach`: approach, lowrider, (-60, 3) to (22, 3) (3 points): east along the z = 0 road
- `snail-paddock-getaway`: getaway, lowrider, (30, -2) to (-120, -2) (3 points): west along the z = 0 road

**Cameras:** `wide` (establishing: the pen, the stall and the tower behind); `two-shot` (over the player's shoulder onto the wrangler at the pen); `overhead` (overhead: the pen layout and the gap in the fence).

**Set dressing (prefabs):** 10 x `picket-fence`, `veggie-bed`, `market-stall`, `crate`.

### The Gnomecino Velvet Rope `gnomecino-door`

**Where:** Turfton, centre (72, -30), radius 12 m, facing W. **Default time:** night. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `strangers-gnomecino`. **Used by:** `sq-big-lou-embargo`.

**Looks:** The Gnomecino front on its west face: a velvet rope between two wooden posts, a neon alley sign and jazz lamps, two café tables with chairs on the pavement, a black Lowrider parked by the rope.

**Sounds:** Jazz from inside, a bouncer humming, a queue shuffling, glow-stick clicks.

**Who is there (marks):**
- `big-lou` at (70, -30) facing E, stand: at the rope, arms folded, checking the guest list
- `patron` at (66, -35) facing E, stand: queueing with a glow-stick, dressed for the night
- `patron` at (66, -38) facing E, stand: queueing, stamping his feet against the cold
- `nina` at (72, -22) facing N, stand: passing with glow-sticks, looking back at the rope
- `player` at (66, -29) facing E, stand: stands at the rope with a guest-list request

**What they do while idle (walks):**
- `big-lou` (loop, 2 points, 0.9 m/s, 4 s stops): paces the rope, checking the queue
- `patron` (loop, 2 points, 0.8 m/s, 3 s stops): shuffles along the queue

**Vehicles:**
- `lou-lowrider`: parked lowrider at (70, -22) facing S, Big Lou's: matte black Lowrider with a microfibre-towel seat, parked by the rope
- `gnomecino-door-pull-up`: pull-up lowrider at (63, -30) facing N: the VIP drop on the x = 60 road, northbound lane
- `gnomecino-door-exit`: exit lowrider at (58, -30) facing S: leaves southbound on the x = 60 road

**Drive paths:**
- `gnomecino-approach`: approach, lowrider, (63, 60) to (63, -30) (3 points): north up the x = 60 road
- `gnomecino-getaway`: getaway, lowrider, (58, -30) to (58, 90) (3 points): south down the x = 60 road

**Cameras:** `wide` (establishing: the Gnomecino front and its neon sign); `two-shot` (over the player's shoulder onto Big Lou at the rope); `overhead` (overhead: the rope, the queue and the Lowrider).

**Set dressing (prefabs):** 2 x `wooden-post`, 2 x `gsr-cafe-table`, 2 x `chair`, 2 x `gsr-jazz-lamp`, `gsr-neon-alley-sign`.

### Glaze & Tax Office, Foot of Thorne Tower `glaze-tax-office`

**Where:** Turfton, centre (28, -48), radius 14 m, facing N. **Default time:** day. **Built:** in the world, plus stage set dressing. **Used by:** `ch1-tax-break-in`.

**Looks:** A glossy glaze-and-tax office on the north face of Thorne Tower: a long counter with brass fittings, a stone plaque reading THORNE LAWN & ORDER, a row of clipped topiary hedges and flowerpots on the open strip before the z = -60 road.

**Sounds:** Calipers clicking, ledgers thumping on the counter, a clerk humming, traffic on the z = -60 road.

**Who is there (marks):**
- `vesper` at (25, -46) facing S, stand: at the counter door, inspecting the topiary line with calipers
- `hoa-auditor` at (20, -45) facing E, stand: taking notes on a clipboard
- `hoa-auditor` at (40, -45) facing W, stand: counting the hedges one by one
- `clerk` at (28, -43) facing N, work: behind the counter, stacking ledgers
- `player` at (16, -50) facing SE, stand: stands on the strip with a vault request

**What they do while idle (walks):**
- `vesper` (loop, 2 points, 0.8 m/s, 5 s stops): inspects the topiary line with calipers
- `clerk` (back and forth, 2 points, 1 m/s, 3 s stops): carries ledgers to and fro along the counter

**Vehicles:**
- `vesper-lowrider`: parked lowrider at (44, -50) facing E, Vesper "The Glazier" Thorne's: pearl-white Lowrider, gold rims, never a speck of mud, parked on the strip
- `heist-combine`: parked combine at (3, -48) facing S: the Buck-Iron Combine the crew steals, parked on the x = 0 road
- `glaze-tax-office-pull-up`: pull-up lowrider at (12, -57) facing E: pulls up on the z = -60 road, eastbound lane
- `glaze-tax-office-exit`: exit lowrider at (16, -62) facing W: leaves westbound on the z = -60 road

**Drive paths:**
- `glaze-tax-approach`: approach, lowrider, (-60, -57) to (12, -57) (3 points): east along the z = -60 road
- `glaze-tax-getaway`: getaway, lowrider, (16, -62) to (-120, -62) (3 points): west along the z = -60 road
- `combine-to-side-valve`: chase, combine, (3, -48) to (-150, 72) (7 points): the heist route: north, west along z = -60, south down x = -120, west to the bay

**Cameras:** `wide` (establishing: the tower, the counter and the topiary line); `two-shot` (over the player's shoulder onto Vesper at the counter door); `overhead` (overhead: the counter, the hedges and the parked vehicles).

**Set dressing (prefabs):** `counter`, `stone-plaque`, 4 x `gsr-topiary-hedge`, 2 x `flower-pot`.

### Patio Heights gate `patio-gate`

**Where:** Turfton, centre (150, -127), radius 22 m, facing S. **Default time:** dawn. **Built:** in the world, plus stage set dressing. **Used by:** `ch1-two-coat-tail`, `sq-mulch-pyramid`, `sq-hose-revolt`, `sq-fescue-fugitive`.

**Looks:** A walled compound gate in the south wall of Patio Heights: a gap between two stone pillars, a sentry box with a striped roof, a HOA CENTRAL sign and two flowerpots, pale dawn light on the flagstones.

**Sounds:** A sprinkler ticking inside the walls, a binder page turning, a Zero-Turn idling, the first traffic on the z = -120 road.

**Who is there (marks):**
- `gary` at (145, -134) facing SE, stand: just inside the gate beside his sentry box, reading a 900-page HOA binder
- `turncoat-cam` at (161, -126) facing W, lean: leans on his Zero-Turn outside the gate, arms folded
- `player` at (151, -126) facing N, stand: waits outside the gate in the dawn

**What they do while idle (walks):**
- `gary` (back and forth, 2 points, 1 m/s, 4 s stops): steps out to the gate gap, checks the Zero-Turn plate against the binder, steps back into his box

**Vehicles:**
- `cam-zero-turn`: parked zero-turn at (161, -127) facing E, Turncoat Cam's: chameleon Zero-Turn parked on the pavement outside the gate
- `patio-gate-pull-up`: pull-up zero-turn at (150, -122) facing N: pulls up on the road and turns north for the gate gap
- `patio-gate-exit`: exit zero-turn at (150, -126) facing S: the getaway leaves from the gate gap

**Drive paths:**
- `patio-gate-approach`: approach, zero-turn, (60, -117) to (150, -122) (3 points): east along the z = -120 road, then north to the gate
- `patio-gate-getaway`: getaway, zero-turn, (150, -126) to (60, -122) (3 points): out of the gate, then west along the z = -120 road

**Cameras:** `wide` (establishing: the gate in the wall, the road and the Zero-Turn parked beside it); `two-shot` (over the road onto the player at the gate); `arrival` (arrival: watching the pull-up mark on the road).

**Set dressing (prefabs):** `signpost`, 2 x `flower-pot`.

### Vesper's Patio Heights gallery `patio-gallery`

**Where:** Turfton, centre (150, -152), radius 22 m, facing S. **Default time:** dawn. **Built:** new: exists through its stage set dressing. **Used by:** `ch1-two-coat-tail`, `sq-fescue-fugitive`, `sq-mulch-pyramid`.

**Looks:** An open astroturf green inside the walled compound, ringed by flagstones, with gallery plinths and a painting along the north wall, low topiary hedges on the corners and a gazebo urn by the wall.

**Sounds:** A sprinkler on the green, calipers clicking, the crunch of a bodyguard on flagstones, a distant Zero-Turn.

**Who is there (marks):**
- `vesper` at (137, -152) facing E, work: inspects the turf with calipers at 06:00
- `mayor-mulch` at (160, -162) facing SW, stand: at the kickback handover, a folded envelope in his hand
- `hoa-bodyguard` at (157, -158) facing SW, stand: watches the handover with his hands behind his back
- `hoa-bodyguard` at (166, -158) facing N, stand: scans the north wall
- `player` at (146, -146) facing NE, stand: at the edge of the green, looking at the gallery

**What they do while idle (walks):**
- `vesper` (loop, 4 points, 0.9 m/s, 3 s stops): kneels at each corner of the green and checks the nap with calipers
- `hoa-bodyguard` (back and forth, 2 points, 1.1 m/s, 5 s stops): patrols inside the north wall, stopping to scan the sky
- `mayor-mulch` (back and forth, 2 points, 0.8 m/s, 6 s stops): shifts from foot to foot beside the plinths, checking his watch

**Vehicles:**
- `patio-gallery-pull-up`: pull-up zero-turn at (150, -136) facing N: pulls up just inside the gate, facing north
- `patio-gallery-exit`: exit zero-turn at (150, -134) facing S: leaves from just inside the gate

**Drive paths:**
- `patio-gallery-approach`: approach, zero-turn, (60, -117) to (150, -136) (4 points): along the z = -120 road, through the gate gap
- `patio-gallery-getaway`: getaway, zero-turn, (150, -134) to (60, -122) (3 points): the same way out

**Cameras:** `wide` (establishing: the compound walls, the green and the gallery plinths); `two-shot` (over the player's shoulder onto Vesper at the turf); `close` (close-up on the kickback handover by the north plinths).

**Set dressing (prefabs):** 3 x `lobby-pedestal`, `porcelain-cat`, `golden-remote`, `stopping-stone`, `painting`, `gsr-gazebo-urn`, 4 x `gsr-topiary-hedge`.

### Vesper's Putting-Green Country Club `putting-green`

**Where:** Turfton, centre (198, -198), radius 16 m, facing N. **Default time:** day. **Built:** new: exists through its stage set dressing. **Used by:** `sq-hose-revolt`.

**Looks:** A walled-off block of close-cut putting green with flagpole pins, a clubhouse terrace of a cafe table and two chairs, topiary hedges and two lawn sprinklers under a bright sky.

**Sounds:** A ball clinking into a cup, a sprinkler ticking, a caddie humming, the pop of an ice-tea can.

**Who is there (marks):**
- `club-member` at (189, -200) facing E, stand: lines up a putt with a tartan-headed putter
- `club-member` at (199, -210) facing E, stand: taps in a putt, muttering about the slope
- `caddie` at (196, -202) facing NE, stand: carries the bag and watches the pins
- `player` at (198, -190) facing N, stand: steps onto the green from the road

**What they do while idle (walks):**
- `caddie` (loop, 2 points, 1 m/s, 4 s stops): loops between the pins, raking the sand and holding the flag

**Vehicles:**
- `putting-green-pull-up`: pull-up lowrider at (200, -177) facing E: pulls up on the z = -180 road eastbound lane, by the club
- `putting-green-exit`: exit lowrider at (206, -182) facing W: leaves from the westbound lane by the club

**Drive paths:**
- `putting-green-approach`: approach, lowrider, (120, -177) to (200, -177) (2 points): east along the z = -180 road from the x = 120 crossing
- `putting-green-getaway`: getaway, lowrider, (206, -182) to (60, -182) (2 points): westbound along the z = -180 road

**Cameras:** `wide` (establishing: the green, the pins and the clubhouse terrace from the road); `two-shot` (over the player's shoulder onto the putting club); `close` (close-up on the caddie and the pins).

**Set dressing (prefabs):** 2 x `capture-flagpole`, `gsr-cafe-table`, 2 x `chair`, `bench`, 2 x `lawn-sprinkler`, 2 x `gsr-topiary-hedge`.

### Turfton Amphitheater `amphitheater`

**Where:** Turfton, centre (-90, -88), radius 26 m, facing S. **Default time:** day. **Built:** in the world, plus stage set dressing. **Used by:** `ch1-founders-boot`, `city-glow-band-express`.

**Looks:** A sunken grass amphitheater with a raised dais and a back wall at the north end, curved stone seat tiers rising to the south, two HOA TRIBUNAL banners, a judge's lectern and a megaphone statue.

**Sounds:** A megaphone squealing, a laser level whining, citations being torn, a crowd of jurors shuffling on the stone tiers.

**Who is there (marks):**
- `reginald` at (-90, -98) facing S, stand (1.2 m up): on the dais, citing Municipal Code §404-B with calipers
- `toadstool` at (-93, -98) facing S, stand (1.2 m up): on the dais beside Reginald, holding a flat HOA clipboard
- `toadstool` at (-87, -98) facing S, stand (1.2 m up): on the dais beside Reginald, arms folded
- `nina` at (-85, -81) facing W, stand: on the arena floor, glow-stick in hand, sizing up the player
- `hoa-bailiff` at (-82, -84) facing NW, stand: holds the door to the arena and checks the crowd
- `hoa-bailiff` at (-98, -84) facing NE, stand: stands guard by the west tiers
- `hoa-bailiff` at (-90, -70) facing N, stand: watches the road beyond the jury box
- `juror` at (-86, -80) facing N, sit: on the stone tier, facing the dais, sweating
- `juror` at (-94, -80) facing N, sit: on the stone tier, facing the dais, reading the charge
- `player` at (-90, -82) facing N, stand: stands in the middle of the arena, facing the dais

**What they do while idle (walks):**
- `reginald` (loop, 2 points, 0.9 m/s, 3 s stops): paces the dais front, measuring the grass with a laser level
- `hoa-bailiff` (loop, 4 points, 1.1 m/s, 4 s stops): loops the arena, checking each juror's seat

**Vehicles:**
- `reginald-van`: parked hoa-van at (-112, -90) facing S, Reginald "Quarter-Inch" Vance's: Code-Enforcement Van with his calipers on the dashboard
- `boot-float-start`: parked boot-float at (3, -120) facing W: the parade float, parked on the z = -120 road, crew hijacking it
- `amphitheater-pull-up`: pull-up boot-float at (-90, -72) facing N: crashes north into the jury box
- `amphitheater-exit`: exit combine at (-106, -80) facing S: the getaway Combine starts beside the west tiers

**Drive paths:**
- `parade-route`: chase, boot-float, (3, -122) to (-90, -72) (5 points): the float west along z = -120, south down x = -60, west along z = -60, north into the jury box
- `amphitheater-approach`: approach, boot-float, (3, -122) to (-90, -72) (5 points): same route as the parade, ending at the pull-up
- `amphitheater-getaway`: getaway, combine, (-106, -80) to (-122, 60) (4 points): out to the z = -60 road, west to x = -120, then south toward Side-Valve

**Cameras:** `wide` (establishing: the amphitheater, the dais and the tiers curving round); `two-shot` (over the jury benches onto the player and Reginald on the dais); `arrival` (arrival: watching the float pull up into the jury box).

**Set dressing (prefabs):** 2 x `team-banner`, `lectern`, `gsr-megaphone-statue`.

### Glaze Clinic Hospital doors `glaze-clinic`

**Where:** Turfton, centre (10, 30), radius 16 m, facing W. **Default time:** any. **Built:** in the world, plus stage set dressing. **Used by:** `respawn`.

**Looks:** The west face of the Glaze Clinic hospital, glass doors with a red cross, a gurney on the pavement, two flowerpots and a bench in the open forecourt beside the x = 0 road.

**Sounds:** A heat gun whining, the hum of the clinic doors, a metronome-like tap of Midge's heels, the traffic on the x = 0 road.

**Who is there (marks):**
- `midge` at (14, 22) facing S, stand: paces outside the doors at 140 BPM
- `nurse` at (12, 34) facing NW, work: waves a heat gun over the player's dented shell
- `player` at (7, 30) facing W, lie: wakes on the pavement after being cracked

**What they do while idle (walks):**
- `midge` (back and forth, 2 points, 1.1 m/s, 4 s stops): paces up and down the doors, counting the beats

**Vehicles:**
- `glaze-clinic-pull-up`: pull-up snail-coach at (-2, 30) facing S: pulls up on the x = 0 road, southbound lane
- `glaze-clinic-exit`: exit snail-coach at (3, 24) facing N: leaves northbound from beside the clinic

**Drive paths:**
- `glaze-clinic-approach`: approach, snail-coach, (-2, -60) to (-2, 30) (3 points): south down the x = 0 road
- `glaze-clinic-getaway`: getaway, snail-coach, (3, 24) to (3, -60) (2 points): north up the x = 0 road

**Cameras:** `wide` (establishing: the clinic doors and the road in front); `two-shot` (over the road onto the player waking on the pavement); `close` (overhead close-up on the gurney and the player).

**Set dressing (prefabs):** `bed`, `bench`, 2 x `flower-pot`.

### Greenhouse Strip after dark `greenhouse-strip`

**Where:** Turfton, centre (50, -40), radius 16 m, facing E. **Default time:** night. **Built:** in the world, plus stage set dressing. **Used by:** `nightlife`, `sq-hose-revolt`, `city-kerbside-rounds`, `city-glow-band-express`.

**Looks:** A strip of glasshouses under grow-lamps, with glass arches over the x = 60 road, a flowerpot stoop selling glow-sticks, neon signs and mushroom lamps in violet and green.

**Sounds:** Pulsing dance music from the Gnomecino, a moth buzzing a neon sign, the hiss of grow-lamps, a bike bell.

**Who is there (marks):**
- `nina` at (51, -41) facing W, sit: sits on her stoop, selling glow-stick hat-bands from a tray
- `raver` at (56, -36) facing NW, stand: bobs to the music with a glow-stick in each hand
- `raver` at (46, -48) facing SE, stand: waits in line for a glow-stick
- `player` at (56, -44) facing SW, stand: steps out of the rain under the arches

**What they do while idle (walks):**
- `raver` (loop, 2 points, 1.2 m/s, 3 s stops): wanders between the stoop and the Gnomecino, swaying
- `nina` (back and forth, 2 points, 0.9 m/s, 6 s stops): gets up off the stoop to shoo the moth off the sign, then sits back down

**Vehicles:**
- `nina-bike`: parked push-bike at (53, -40) facing W, Neon-Moth Nina's: Push-Mower Bike strung with fairy lights, parked by the stoop
- `greenhouse-strip-pull-up`: pull-up push-bike at (58, -40) facing S: pulls up on the x = 60 road, southbound lane
- `greenhouse-strip-exit`: exit push-bike at (63, -40) facing N: leaves northbound on the x = 60 road

**Drive paths:**
- `greenhouse-strip-approach`: approach, push-bike, (58, -120) to (58, -40) (2 points): south along the x = 60 road from the z = -120 road
- `greenhouse-strip-getaway`: getaway, push-bike, (63, -40) to (63, 120) (3 points): north-south along the x = 60 road

**Cameras:** `wide` (establishing: the glasshouse strip under the arches, neon lit); `two-shot` (over the player's shoulder onto Nina on her stoop); `close` (close-up on the glow-stick tray and the mushroom lamps).

**Set dressing (prefabs):** `crate`, 2 x `mushroom-lamp`, `gsr-neon-alley-sign`.

### The Neutral Picnic Median (60, -60) `picnic-median`

**Where:** Turfton, centre (70, -68), radius 16 m, facing SW. **Default time:** day. **Built:** already in the world. **Used by:** `ch1-mowers-keepers`.

**Looks:** The x = 60 and z = -60 crossing with the Red Cap and Blue Cap picnic tables south-east of it, kerbs painted in two colours, a clamped push-bike at each side of the crossing and HOA enforcers on the pavement.

**Sounds:** Two gangs of Push-Mower Bike bells, a clamp ratchet, a picnic cooler lid, the buzz of the crossing light.

**Who is there (marks):**
- `hoa-enforcer` at (53, -56) facing E, stand: guards the first clamped bike with a clipboard
- `hoa-enforcer` at (67, -64) facing W, stand: guards the second clamped bike, arms folded
- `red-cap` at (67, -67) facing SW, stand: glares across the crossing from the Red Cap kerb
- `blue-cap` at (82, -66) facing W, stand: glares across the crossing from the Blue Cap kerb
- `player` at (56, -52) facing NE, stand: stands on the kerb with the crossing ahead

**What they do while idle (walks):**
- `red-cap` (loop, 2 points, 1 m/s, 3 s stops): paces the Red Cap kerb, glaring at the other side
- `blue-cap` (loop, 2 points, 1 m/s, 3 s stops): paces the Blue Cap kerb, glaring back

**Vehicles:**
- `clamped-bike-1`: parked push-bike at (60, -56) facing E: clamped to the crossing light, wheel locked
- `clamped-bike-2`: parked push-bike at (64, -64) facing W: clamped to the kerb post on the far side
- `picnic-median-pull-up`: pull-up push-bike at (50, -57) facing E: pulls up on the z = -60 road eastbound lane
- `picnic-median-exit`: exit push-bike at (70, -57) facing E: leaves east on the z = -60 road

**Drive paths:**
- `picnic-median-approach`: approach, push-bike, (-60, -57) to (50, -57) (2 points): east along the z = -60 road
- `picnic-median-getaway`: getaway, push-bike, (70, -57) to (150, -57) (2 points): east along the z = -60 road

**Cameras:** `wide` (establishing: the crossing, the picnic tables and the clamped bikes); `two-shot` (over the kerb onto the player and the first enforcer); `close` (close-up on the two caps glaring across the crossing).

### Under-Deck storm drain `culvert-under-deck`

**Where:** Turfton, centre (-9, -13), radius 12 m, facing SE. **Default time:** night. **Built:** in the world, plus stage set dressing. **Used by:** `ch3-salvage-raid`, `sq-grid-truthers`.

**Looks:** A concrete storm-drain portal under the kerb, its grate lifted, a pile of acorns and magazines, a torch on each side of the drain and a cable reel of buried Vesper cables by the x = 0 road.

**Sounds:** Dripping water in the drain, the scrape of a magnet on the grate, a torch hissing, a far-off Zero-Turn backfiring.

**Who is there (marks):**
- `sal` at (-12, -8) facing NE, kneel: fishes the grate with a magnet on a string
- `tansy` at (-7, -12) facing SW, kneel: climbs into the drain with a wrench in her teeth
- `mossley` at (-4, -4) facing SE, stand: stares at the datum at the crossing, plumb-line in hand
- `player` at (-7, -7) facing NW, stand: crouches by the portal, torch in hand

**What they do while idle (walks):**
- `sal` (back and forth, 2 points, 0.9 m/s, 5 s stops): moves to the next grate and fishes it with the magnet

**Vehicles:**
- `culvert-pull-up`: pull-up push-bike at (-2, -14) facing S: pulls up on the x = 0 road, southbound lane
- `culvert-exit`: exit push-bike at (3, -20) facing N: leaves north on the x = 0 road

**Drive paths:**
- `culvert-approach`: approach, push-bike, (-2, -120) to (-2, -14) (2 points): south down the x = 0 road
- `culvert-getaway`: getaway, push-bike, (3, -20) to (3, -120) (2 points): north up the x = 0 road

**Cameras:** `wide` (establishing: the portal under the kerb and the crossing beyond); `two-shot` (over the crossing onto the player and Sal at the portal); `close` (close-up on the grate and the magnet).

**Set dressing (prefabs):** `tin-pail`, `fishing-rod`, 2 x `torch`, `gsr-subsoil-cable-reel`.

### Clay-Mart returns yard, Industrial `clay-mart-lot`

**Where:** Turfton, centre (-130, 150), radius 18 m, facing E. **Default time:** day. **Built:** in the world, plus stage set dressing. **Used by:** `sq-hoa-audit`, `prologue-fresh-kiln`, `city-impound-run`, `city-skyway-robbery`.

**Looks:** The narrow returns yard on the east side of the Clay-Mart building: stacked bricks and crates, a wheelbarrow, a cola vending machine by the returns window, Burt's decommissioned van parked in primer.

**Sounds:** A vending machine clunking, a radio on the van dash, pallets scraping, the whine of a delivery truck on the x = -120 road.

**Who is there (marks):**
- `burt` at (-128, 152) facing E, sit: on his van step with a coffee, rereading an old citation
- `grout` at (-124, 146) facing W, stand: arms folded in the yard, eyeing the player
- `clay-mart-clerk` at (-135, 144) facing E, stand: leans on the returns window with a clipboard
- `player` at (-130, 146) facing NW, stand: stands in the yard holding a Kiln-Debt receipt

**What they do while idle (walks):**
- `burt` (back and forth, 2 points, 1 m/s, 4 s stops): walks to the vending machine and back, buys a cola

**Vehicles:**
- `burt-van`: parked hoa-van at (-131, 158) facing S, Burt's: a decommissioned HOA van in primer, the badge scraped off
- `clay-mart-lot-pull-up`: pull-up hoa-van at (-122, 150) facing S: pulls up on the x = -120 road, southbound lane
- `clay-mart-lot-exit`: exit hoa-van at (-117, 160) facing N: leaves north on the x = -120 road

**Drive paths:**
- `clay-mart-lot-approach`: approach, hoa-van, (-122, 60) to (-122, 150) (2 points): south along the x = -120 road
- `clay-mart-lot-getaway`: getaway, hoa-van, (-117, 160) to (-117, 60) (2 points): north along the x = -120 road

**Cameras:** `wide` (establishing: the Clay-Mart building and its returns yard); `two-shot` (from the road onto the player and Burt on his van step); `arrival` (arrival: watching the pull-up mark on the road).

**Set dressing (prefabs):** 3 x `brick-stack`, 2 x `crate`, `wheelbarrow`, `gta-vending-cola`.

### Pay 'n' Glaze bay `pay-n-glaze`

**Where:** Turfton, centre (90, 136), radius 12 m, facing S. **Default time:** day. **Built:** already in the world. **Used by:** `pay-n-glaze-shop`, `city-impound-run`.

**Looks:** A ring of spray-bay walls at the Pay 'n' Glaze shop, open to the z = 120 road, with paint splashes on the concrete and a shop front glowing behind.

**Sounds:** A spray gun hissing, a radio playing jingles, the buzz of the shop sign, a car rolling into the bay.

**Who is there (marks):**
- `glaze-tech` at (94, 150) facing NW, work: sprays a coat of primer on the bay floor with a spray gun
- `pip` at (84, 141) facing NE, lean: leans on the bay wall, keys spinning on one finger
- `player` at (88, 138) facing S, stand: waits at the bay entrance with the keys

**What they do while idle (walks):**
- `glaze-tech` (loop, 2 points, 0.9 m/s, 4 s stops): walks the bay floor with the spray gun, checking each stripe

**Vehicles:**
- `pay-n-glaze-pull-up`: pull-up lowrider at (90, 146) facing S: drives into the bay, facing south
- `pay-n-glaze-exit`: exit lowrider at (90, 134) facing N: leaves north out of the bay

**Drive paths:**
- `pay-n-glaze-approach`: approach, lowrider, (0, 123) to (90, 146) (3 points): east along the z = 120 road, then south into the bay
- `pay-n-glaze-getaway`: getaway, lowrider, (90, 134) to (0, 118) (3 points): out north to the z = 120 road, then west

**Cameras:** `wide` (establishing: the shop front and the bay from the road); `two-shot` (over the bay onto the player and the glaze tech); `arrival` (arrival: watching the car drive into the bay).

### The Even Cut: downtown meridian `meridian-finale`

**Where:** Turfton, centre (0, -6), radius 22 m, facing N. **Default time:** night. **Built:** in the world, plus stage set dressing. **Used by:** `ch5-even-cut`.

**Looks:** The downtown x = 0 / z = 0 crossing jammed with a Grand Combine, a landed whirligig on the east side, team banners on poles, two ring-shaped choice markers on the road and crates piled as barricades.

**Sounds:** A combine engine idling and grinding, the whirligig rotors slowing, a crowd murmuring, a church bell far off.

**Who is there (marks):**
- `vesper` at (3, -22) facing NW, kneel: kneels, cracked, by the jammed intake
- `tansy` at (-16, -3) facing SE, stand: watches the choice rings with a wrench in her hand
- `pip` at (-8, 6) facing NW, stand: paces by the combine, checking his Zero-Turn keys
- `granny` at (-18, 4) facing NE, stand: keeps watch with the double-barrel over her shoulder
- `diggs` at (16, -4) facing SW, stand: stands at attention beside the east ring
- `bracken` at (18, 4) facing NW, stand: sits in judgement by the east ring
- `juniper` at (8, 6) facing NE, stand: reads a petition from the flagpoles
- `player` at (0, 2) facing N, stand: stands between the two choice rings

**What they do while idle (walks):**
- `pip` (loop, 2 points, 1.2 m/s, 3 s stops): paces by the combine, rattling his keys
- `granny` (back and forth, 2 points, 0.8 m/s, 6 s stops): keeps watch by the west ring, shotgun on her shoulder

**Vehicles:**
- `grand-combine`: parked combine at (0, -26) facing N: jammed on the x = 0 road, facing south
- `finale-whirligig`: parked whirligig at (18, -14) facing S: landed on the crossing's east side
- `meridian-finale-pull-up`: pull-up whirligig at (3, -14) facing N: lands on the crossing, northbound lane
- `meridian-finale-exit`: exit whirligig at (3, 10) facing N: takes off from the south side of the crossing

**Drive paths:**
- `grand-combine-advance`: chase, combine, (40, -330) to (0, -26) (4 points): the combine rolls down the north highway and the x = 0 road to the jam
- `meridian-finale-approach`: approach, whirligig, (3, -120) to (3, -14) (2 points): down the x = 0 road to the pull-up
- `meridian-finale-getaway`: getaway, whirligig, (3, 10) to (3, 120) (2 points): south down the x = 0 road

**Cameras:** `wide` (establishing: the jammed combine, the rings and the whirligig on the crossing); `two-shot` (over the player's shoulder onto Vesper kneeling by the intake); `arrival` (arrival: watching the whirligig come down on its pull-up mark).

**Set dressing (prefabs):** 4 x `team-banner`, `stopping-stone`, 3 x `crate`.

### The Kerbside Exchange, Central Bus Stop `kerb-exchange`

**Where:** Turfton, centre (-14, 45), radius 12 m, facing W. **Default time:** day. **Built:** new: exists through its stage set dressing. **Quest giver marker:** `kerb-exchange`. **Used by:** `city-kerbside-rounds`, `city-impound-run`, `city-glow-band-express`, `city-penthouse-exclusive`, `city-skyway-robbery`.

**Looks:** A cork notice-board covered in job slips, a folding office desk with a ticket punch and a stool, a flower-pot, a bench on the pavement, and the snail-coach bus stop up the road.

**Sounds:** A ticket punch clacking, pinned paper flapping on the board, snail-coach air brakes up the road.

**Who is there (marks):**
- `dot` at (-12, 45) facing E, sit: behind the desk, punching a ticket for every job on the board
- `player` at (-8, 45) facing W, stand: stands at the desk with a Kiln-Debt receipt
- `client` at (-12, 49) facing NE, stand: holds a crumpled job slip and waits for the punch
- `hedda` at (-15, 42) facing S, stand: reads the job slips on the board with a pencil

**What they do while idle (walks):**
- `dot` (back and forth, 2 points, 0.9 m/s, 4 s stops): walks from the desk to the board to pin a slip, and back

**Cameras:** `wide` (establishing: the board, the desk and the bus stop up the road); `two-shot` (over the player's shoulder onto Dot and the client); `board` (close on the notice-board and its job slips).

**Set dressing (prefabs):** `notice-board`, `office-desk`, `chair`, `flower-pot`, `bench`.

## Cloverfield Farms

### Granny Gnertrude's barn and bake shop `granny-barn`

**Where:** Cloverfield Farms, centre (-45, 335), radius 35 m, facing E. **Default time:** golden. **Built:** in the world, plus stage set dressing. **Inside:** the off-map cutscene room `cloverfield-barn`. **Quest giver marker:** `cloverfield-barn`. **Used by:** `ch2-dew-run`, `ch2-sprinkler-gauntlet`, `ch2-vespers-offer`, `sq-castaway-drydock`, `sq-biscuit-hotdog`, `sq-fescue-fugitive`, `sq-hoa-audit`.

**Looks:** A gravel yard between the farm buildings and the south highway: a barn and log cabin behind a pumpkin patch, a haystack, a scarecrow, a clay oven and a porch with a rocking chair, all in low gold evening light.

**Sounds:** Granny rocking on the porch, the oven ticking as it cools, a combine idling, crows and a radio playing bluegrass from the cabin.

**Who is there (marks):**
- `granny` at (-64, 334) facing E, sit: rocks on her porch chair, double-barrel across her knees over the pumpkin patch
- `bramble` at (-48, 352) facing NW, lean: leans on his combine, chewing a stalk of wheat
- `driftwood` at (-40, 344) facing SW, stand: begs Bramble for a tow, cap in both hands
- `hoa-inspector-stubble` at (-8, 350) facing W, work: writes a ticket about the scarecrow, clipboard on his knee
- `player` at (-20, 338) facing W, stand: steps out of the dew-hauler at the edge of the yard

**What they do while idle (walks):**
- `granny` (back and forth, 2 points, 1 m/s, 4 s stops): stokes the clay oven, then rocks back to the porch chair
- `bramble` (loop, 4 points, 1.2 m/s, 3 s stops): walks round his combine, checking the header
- `hoa-inspector-stubble` (loop, 3 points, 1 m/s, 3 s stops): paces the verge, peering at the scarecrow

**Vehicles:**
- `granny-ride-on`: parked ride-on at (-60, 340) facing E, Granny Gnertrude's: a lilac Ride-On with a hay seat and a cooler of pies
- `bramble-combine`: parked combine at (-52, 345) facing E, Farmer Bramble's: a Buck-Iron Combine, green and gold, parked in the yard
- `granny-barn-pull-up`: pull-up hoa-van at (-25, 330) facing W: the dew-hauler drop, nose to the yard
- `granny-barn-exit`: exit hoa-van at (-34, 340) facing N: the getaway start, down the lane to the highway

**Drive paths:**
- `dew-approach`: approach, hoa-van, (0, 180) to (-25, 330) (4 points): down the south highway from the north
- `dew-getaway`: getaway, hoa-van, (-34, 340) to (60, 450) (5 points): south along the highway
- `dew-convoy`: chase, hoa-van, (0, 260) to (10, 390) (3 points): the HOA convoy chase down the highway

**Cameras:** `wide` (establishing: the farm, the road and the yard); `two-shot` (over the bake-shop table onto Granny and the porch); `arrival` (watching the dew-hauler pull up at the gate).

**Set dressing (prefabs):** `rocking-chair`, 2 x `veggie-bed`, `clay-oven`, `table`, `acorn-cake`, `barrel`, 2 x `hay-bale`, `mailbox`.

### The Route South Acorn Diner `south-highway-diner`

**Where:** Cloverfield Farms, centre (16, 264), radius 25 m, facing W. **Default time:** dusk. **Built:** new: exists through its stage set dressing. **Used by:** `ch2-vespers-offer`, `ch2-dew-run`.

**Looks:** A small acorn-shell diner on open ground east of the south highway, a hand-painted sign on the verge, a striped awning over an outdoor booth and a blockade combine stopped across the road in the dusk.

**Sounds:** A cold-drink cooler humming, cicadas, a radio in the diner, the canal lapping just north of the road.

**Who is there (marks):**
- `vesper` at (20, 262) facing E, sit: sits at the outdoor booth, sunglasses on, a cold cola sweating in front of her
- `player` at (25, 265) facing NW, stand: stands at the edge of the booth with the dew-hauler keys
- `frank` at (-7, 259) facing E, lean: leans on his hand-painted sign, waving the blockade through
- `waitress` at (11, 264) facing E, stand: holds a tray of acorn cocoa, eyeing the blockade
- `porcelain-guard` at (-6, 240) facing SE, stand: ambush: porcelain fists up, waiting for the cue
- `porcelain-guard` at (6, 240) facing SW, stand: ambush: porcelain fists up, waiting for the cue
- `porcelain-guard` at (0, 252) facing N, stand: ambush: blocks the middle of the road

**What they do while idle (walks):**
- `waitress` (back and forth, 2 points, 1 m/s, 4 s stops): carries a tray from the diner door to the booth and back
- `frank` (back and forth, 2 points, 1.1 m/s, 5 s stops): walks to the diner for a cold cola, then back to his sign

**Vehicles:**
- `vesper-diner-lowrider`: parked lowrider at (26, 248) facing W, Vesper "The Glazier" Thorne's: a pearl-white Lowrider, gold rims, parked nose to the diner
- `blockade-combine`: parked combine at (0, 260) facing E: a Buck-Iron Combine stopped across the highway as the blockade
- `south-highway-diner-pull-up`: pull-up lowrider at (7, 240) facing S: the diner pull-up, kerb side
- `south-highway-diner-exit`: exit lowrider at (8, 270) facing S: the getaway start, out to the highway

**Drive paths:**
- `diner-approach`: approach, lowrider, (-2, 180) to (7, 240) (3 points): south over the canal bridge
- `diner-getaway`: getaway, lowrider, (8, 270) to (10, 390) (4 points): down the highway, away from the blockade

**Cameras:** `wide` (establishing: the diner, the road and the blockade); `two-shot` (over the lowrider onto Vesper and the player at the booth); `arrival` (watching the diner pull-up from the road).

**Set dressing (prefabs):** `gsr-bldg-acorn-diner`, `gsr-roadside-diner-sign`, `gsr-cafe-table`, 2 x `chair`, `gta-vending-cola`, `signpost`.

### Rooster Weatherby's windmill `rooster-windmill`

**Where:** Cloverfield Farms, centre (9, 402), radius 22 m, facing E. **Default time:** day. **Built:** new: exists through its stage set dressing. **Used by:** `ch2-sprinkler-gauntlet`.

**Looks:** A tall tin windmill in an open field beside the silo haul road, a water trough, stacked hay bales and two lawn sprinklers ticking over the stubble, under a hard blue noon sky.

**Sounds:** Windmill blades creaking round, the sprinklers chattering, Rooster shrieking prophecy through a tin funnel, a laser level beeping.

**Who is there (marks):**
- `rooster` at (4, 405) facing E, stand (10 m up): screams prophecies through a tin funnel from the lookout platform
- `hoa-surveyor` at (-1, 398) facing SE, work: sights along a laser level aimed at the windmill
- `hoa-surveyor` at (-4, 410) facing NE, work: sets a laser level on a tripod in the stubble
- `hoa-surveyor` at (0, 414) facing NE, work: hammers a survey stake into the field
- `player` at (-8, 404) facing E, stand: squints up at the lookout platform

**What they do while idle (walks):**
- `hoa-surveyor` (loop, 4 points, 1 m/s, 4 s stops): sweeps the laser level across the field

**Vehicles:**
- `rooster-windmill-pull-up`: pull-up hoa-van at (12, 404) facing N: the field edge by the road, facing the windmill
- `rooster-windmill-exit`: exit hoa-van at (18, 410) facing S: the getaway start, out to the highway

**Drive paths:**
- `windmill-approach`: approach, hoa-van, (40, 570) to (12, 404) (5 points): up the south highway from the south
- `windmill-getaway`: getaway, hoa-van, (18, 410) to (40, 570) (5 points): south down the highway

**Cameras:** `wide` (establishing: the windmill, the field and the road); `two-shot` (over the survey stakes onto the player and the surveyors); `arrival` (watching the pull-up on the field edge).

**Set dressing (prefabs):** `gta-windmill`, `water-trough`, 3 x `hay-bale`, 2 x `lawn-sprinkler`.

### Cloverfield South Barn `south-barn`

**Where:** Cloverfield Farms, centre (30, 446), radius 28 m, facing E. **Default time:** day. **Built:** new: exists through its stage set dressing. **Used by:** `ch2-sprinkler-gauntlet`.

**Looks:** A red barn and a tall silo in the stubble just off the south highway, a foreclosure notice pinned to the door, hay bales and a split-rail fence, with the silo-rig drop marked out in the dirt.

**Sounds:** Wind through the barn boards, a truck horn on the highway, the bailiffs murmuring, the silo-rig engine idling.

**Who is there (marks):**
- `hoa-bailiff` at (36, 444) facing NE, stand: holds a foreclosure notice, one hand on the silo-rig ladder
- `hoa-bailiff` at (44, 444) facing NW, stand: taps a clipboard against his palm
- `bramble` at (30, 456) facing NE, stand: stands by the barn door, scratching his head
- `player` at (40, 452) facing N, stand: stands at the drop with the silo-rig keys

**What they do while idle (walks):**
- `hoa-bailiff` (loop, 4 points, 1 m/s, 4 s stops): paces the drop, the notice tucked under one arm

**Vehicles:**
- `south-barn-pull-up`: pull-up combine at (40, 440) facing W: the silo-rig drop, facing the barn
- `south-barn-exit`: exit combine at (46, 446) facing S: the getaway start, out to the highway

**Drive paths:**
- `barn-approach`: approach, combine, (40, 570) to (40, 440) (4 points): north up the south highway, then across to the drop
- `barn-getaway`: getaway, combine, (46, 446) to (40, 570) (4 points): south down the highway

**Cameras:** `wide` (establishing: the barn, the silo and the drop); `two-shot` (over the drop onto the player and Bramble); `arrival` (watching the silo-rig pull up at the drop).

**Set dressing (prefabs):** `barn`, `silo`, 2 x `hay-bale`, `wooden-fence`.

### Biscuit's Nap (the pawprint crater) `biscuits-nap`

**Where:** Cloverfield Farms, centre (72, 372), radius 22 m, facing W. **Default time:** day. **Built:** already in the world. **Used by:** `sq-biscuit-hotdog`.

**Looks:** A torn-up pawprint crater in the field with a giant squeaky hotdog lying in its middle, a giant tennis ball in the distance and a winch combine parked on the rim.

**Sounds:** The hotdog squeaking every time the wind moves it, Bramble muttering on the rim, the combine ticking as it cools.

**Who is there (marks):**
- `bramble` at (70, 366) facing SE, stand: stands on the rim saying "don't look up"
- `player` at (68, 374) facing N, stand: stands at the crater rim with the winch cable

**What they do while idle (walks):**
- `bramble` (loop, 4 points, 0.9 m/s, 4 s stops): paces the rim, one hand over his eyes

**Vehicles:**
- `hotdog-combine`: parked combine at (74, 380) facing W: the winch combine, facing west across the crater
- `biscuits-nap-pull-up`: pull-up combine at (64, 376) facing E: the rim pull-up, facing the crater
- `biscuits-nap-exit`: exit combine at (62, 364) facing W: the getaway start on the rim

**Drive paths:**
- `nap-approach`: approach, combine, (-6, 404) to (64, 376) (4 points, off-road): across the field from the south highway
- `nap-getaway`: getaway, combine, (62, 364) to (-25, 340) (4 points, off-road): across the field back to the barn

**Cameras:** `wide` (establishing: the crater, the hotdog and the combine); `two-shot` (over the winch onto the player and Bramble); `overhead` (overhead: the pawprint crater and the hotdog).

### The Sovereign Republic of New Puddle `brenda-throne`

**Where:** Cloverfield Farms, centre (-40, 216), radius 22 m, facing S. **Default time:** day. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `strangers-canal`. **Used by:** `sq-hose-revolt`, `ch5-even-cut`.

**Looks:** A zip-tied lounger throne on the canal's north bank, flanked by pink lawn flamingos, a boombox and a crate, with a gang of pink push-bikes parked along the bank.

**Sounds:** Canal water lapping at the bank, the boombox thudding bass, the bikers laughing, a flamingo squawking at a passing gnome.

**Who is there (marks):**
- `brenda` at (-47, 221) facing NE, sit (0.6 m up): reclines on her zip-tied lounger throne, a flamingo at her feet
- `biker` at (-36, 212) facing SW, stand: leans on a push-bike, eyeing the bridge
- `biker` at (-52, 210) facing SE, stand: sprays pink paint on a sign for the republic
- `biker` at (-60, 214) facing SE, stand: checks the chain on a gang bike
- `player` at (-40, 214) facing SW, stand: stands on the bank, hands in the air

**What they do while idle (walks):**
- `brenda` (back and forth, 2 points, 0.9 m/s, 6 s stops): strolls the bank, waving at her gang
- `biker` (loop, 2 points, 1.2 m/s, 3 s stops): patrols the bank, eyeing the bridge
- `biker` (loop, 2 points, 1.2 m/s, 3 s stops): patrols the bank, talking into a radio

**Vehicles:**
- `brenda-bike`: parked push-bike at (-56, 202) facing E, Baroness Brenda's: a glitter-gold Push-Mower Bike with a flamingo ornament
- `gang-bike-1`: parked push-bike at (-44, 204) facing E: a pink gang bike, bell taped on
- `gang-bike-2`: parked push-bike at (-30, 206) facing W: a pink gang bike, saddlebags full
- `brenda-throne-pull-up`: pull-up push-bike at (-8, 216) facing W: the road pull-up by the bank, facing west
- `brenda-throne-exit`: exit push-bike at (-12, 212) facing E: the getaway start on the bank

**Drive paths:**
- `throne-approach`: approach, push-bike, (-10, 150) to (-8, 216) (4 points, off-road): south down the highway, north of the bridge
- `throne-getaway`: getaway, push-bike, (-12, 212) to (-10, 150) (4 points, off-road): north up the highway
- `gang-run`: patrol, push-bike, (-80, 216) to (-80, 216) (3 points, off-road): the gang loop along the north bank

**Cameras:** `wide` (establishing: the throne, the bank and the canal); `two-shot` (over the bike rack onto Brenda and the player); `arrival` (watching the push-bike pull up on the road).

**Set dressing (prefabs):** 2 x `lawn-flamingo`, `gsr-boombox`, `crate`.

### Driftwood's turf-raft on the canal `canal-raft`

**Where:** Cloverfield Farms, centre (55, 223), radius 20 m, facing S, boat scene. **Default time:** golden. **Built:** already in the world. **Used by:** `sq-castaway-drydock`.

**Looks:** Driftwood's turf-raft floating on the canal off the north bank, a walnut-shell dinghy tied up beside it and a combine on the bank for the trailer drop, the water gold under the evening sun.

**Sounds:** Canal water slapping the raft, a fishing reel clicking, a gull, the combine idling on the bank.

**Who is there (marks):**
- `driftwood` at (55, 227) facing NW, sit (0.4 m up): sits on the turf-raft, a fishing line over the canal
- `player` at (52, 220) facing SE, stand: stands on the bank, rope in hand

**Vehicles:**
- `raft-dinghy`: parked walnut-dinghy at (47, 231) facing E, Driftwood's: a walnut-shell dinghy tied up by the raft
- `canal-raft-pull-up`: pull-up combine at (55, 221) facing S: the trailer-drop pull-up on the bank
- `canal-raft-exit`: exit combine at (60, 217) facing W: the getaway start on the bank

**Drive paths:**
- `raft-approach`: approach, combine, (-2, 200) to (55, 221) (4 points, off-road): east along the north bank from the highway
- `raft-getaway`: getaway, combine, (60, 217) to (-2, 180) (5 points, off-road): back west along the bank to the highway
- `canal-paddle`: patrol, walnut-dinghy, (30, 232) to (150, 232) (2 points): a dinghy along the canal water

**Cameras:** `wide` (establishing: the raft, the canal and the north bank); `two-shot` (over the rope onto the player and Driftwood on the raft); `arrival` (watching the combine pull up on the bank).

### Driftwood's lawn-boat trailer `driftwood-trailer`

**Where:** Cloverfield Farms, centre (26, 458), radius 20 m, facing E. **Default time:** golden. **Built:** new: exists through its stage set dressing. **Used by:** `sq-castaway-drydock`.

**Looks:** A rusted wooden trailer in the stubble with a walnut-shell dinghy strapped on top, a deck chair, a fishing rod leaning on a pail and a combine waiting at the field edge in the golden light.

**Sounds:** Wind through the stubble, a bucket clanking, Driftwood muttering to himself, the combine ticking as it idles.

**Who is there (marks):**
- `driftwood` at (22, 458) facing SE, sit (1 m up): sits in the dinghy on the trailer, waiting for a tow
- `player` at (24, 466) facing N, stand: stands by the trailer hitch

**What they do while idle (walks):**
- `driftwood` (loop, 4 points, 1 m/s, 3 s stops): paces round the trailer, muttering about the canal

**Vehicles:**
- `castaway-combine`: parked combine at (30, 460) facing N: the castaway combine, facing north
- `driftwood-trailer-pull-up`: pull-up combine at (30, 452) facing W: the trailer pull-up, facing the trailer
- `driftwood-trailer-exit`: exit combine at (46, 462) facing E: the getaway start out to the highway

**Drive paths:**
- `trailer-approach`: approach, combine, (40, 570) to (30, 452) (4 points): north up the south highway, then across the stubble
- `trailer-getaway`: getaway, combine, (46, 462) to (0, 260) (6 points): north along the highway, the haul to the canal

**Cameras:** `wide` (establishing: the trailer, the dinghy and the field); `two-shot` (over the hitch onto the player and Driftwood); `arrival` (watching the combine pull up at the trailer).

**Set dressing (prefabs):** `wooden-cart`, `walnut-dinghy`, `deck-chair`, `fishing-rod`, `tin-pail`.

### Windfall Croft, outside the west gate `bramble`

**Where:** Cloverfield Farms, centre (57, 545), radius 10 m, facing E. **Default time:** day. **Built:** already in the world. **Quest giver marker:** `bramble`. **Used by:** `sq-windfall-croft-deed`.

**Looks:** A leaning farm fence, a For Sale board, apples rolling over the wall, the oak beyond the barn.

**Sounds:** Wind in the apple trees, a distant cow, nothing else.

**Who is there (marks):**
- `bramble` at (57, 545) facing E, stand: in a patched hat, looking at the ground
- `player` at (59, 545) facing W, stand: walks up the road

**Cameras:** `fence` (from inside the fence onto Bramble and the road).

## Mossy Wood

### Unmowed Hollow (the standing-stone ring) `unmowed-hollow`

**Where:** Mossy Wood, centre (-352, 36), radius 22 m, facing E. **Default time:** dusk. **Built:** in the world, plus stage set dressing. **Inside:** the off-map cutscene room `unmowed-hollow`. **Quest giver marker:** `unmowed-hollow`. **Used by:** `ch2-unmowed-tablet`, `sq-fescue-fugitive`, `sq-porcelain-support`, `first-contract`.

**Looks:** A ring of standing stones in an unmowed clearing, a campfire in the middle, toadstool seats round it, a loom and clay jars by a lean-to, bedrolls under the birches.

**Sounds:** Crackling fire, the drip of the forest, a distant bell on a goat, Elder Bracken humming.

**Who is there (marks):**
- `bracken` at (-364, 40) facing E, sit: sits by the fire passing judgement on a visitor's lawn
- `sorrel` at (-346, 44) facing NW, sit: winds a tape reel on her knee, looking up at the visitor
- `unmowed` at (-348, 26) facing S, stand: stands at the ring with a clay jar of water
- `unmowed` at (-372, 32) facing SE, stand: watches the fire with folded arms
- `player` at (-344, 38) facing W, stand: steps into the ring with a lawn-clipping receipt

**What they do while idle (walks):**
- `bracken` (loop, 3 points, 0.9 m/s, 4 s stops): walks the stone ring at dawn, touching each stone
- `unmowed` (loop, 3 points, 1.1 m/s, 3 s stops): carries water from the spring and fetches clay jars

**Vehicles:**
- `unmowed-hollow-pull-up`: pull-up lowrider at (-325, 22) facing W: a visitor stops on the west highway edge
- `unmowed-hollow-exit`: exit lowrider at (-322, 17) facing E: the getaway starts back out to the highway

**Drive paths:**
- `hollow-approach`: approach, lowrider, (-180, 0) to (-325, 22) (4 points): west highway from the east
- `hollow-getaway`: getaway, lowrider, (-322, 17) to (-180, 0) (3 points): east the same way

**Cameras:** `wide` (establishing: the ring of stones and the fire against the birches); `two-shot` (over the player's shoulder onto Bracken and the fire); `arrival` (watching the pull-up mark on the highway edge).

**Set dressing (prefabs):** 2 x `bedroll`, `loom`, 3 x `clay-jar`, `stone-plaque`.

### 88.7 Fescue Public Radio booth `sorrel-radio-booth`

**Where:** Mossy Wood, centre (-380, 58), radius 12 m, facing S. **Default time:** night. **Built:** new: exists through its stage set dressing. **Used by:** `radio-88-7`, `ch2-unmowed-tablet`.

**Looks:** A booth of crates walled round a desk under a tarp, a cassette deck and a boombox on the table, a tape bank and a radio dish on a pole, rain on the canvas.

**Sounds:** Rain on terracotta, tape hiss, the radio dish ticking in the wind, Sorrel murmuring the news.

**Who is there (marks):**
- `sorrel` at (-375, 47) facing S, sit: at the desk, headphones on, cueing the next tape
- `player` at (-375, 58) facing N, stand: stands at the booth door, dripping

**What they do while idle (walks):**
- `sorrel` (back and forth, 3 points, 1 m/s, 5 s stops): walks out to the tape microphone in the rain, checks it, walks back

**Vehicles:**
- `sorrel-radio-booth-pull-up`: pull-up lowrider at (-348, 10) facing W: a van stops on the highway and the visitor walks in through the mud
- `sorrel-radio-booth-exit`: exit lowrider at (-352, 12) facing E: the getaway leaves from the highway edge

**Drive paths:**
- `booth-approach`: approach, lowrider, (-250, -20) to (-348, 10) (3 points): west highway to the lay-by
- `booth-getaway`: getaway, lowrider, (-352, 12) to (-250, -20) (3 points)

**Cameras:** `wide` (establishing: the booth, the dish and the rain); `two-shot` (over the player's shoulder onto Sorrel at the desk); `close` (close on the cassette deck and Sorrel's hands).

**Set dressing (prefabs):** `table`, `gsr-cassette-deck`, `gsr-boombox`, `chair`, `gsr-radio-dish`, `gsr-tape-bank`, 3 x `crate`.

### The Compost Heap armor forge `compost-heap`

**Where:** Mossy Wood, centre (-250, -50), radius 20 m, facing N. **Default time:** night. **Built:** in the world, plus stage set dressing. **Used by:** `ch2-unmowed-tablet`, `sq-mulch-pyramid`.

**Looks:** Steaming compost heaps around a forge of scrap, an anvil and a workbench, barrels of Black Dew, an armor-plate ride-on parked in the glow.

**Sounds:** Hammer on anvil, hiss of steam off the heaps, a welder's torch, Ernie humming over the furnace.

**Who is there (marks):**
- `ernie` at (-244, -54) facing W, work: roasting chestnuts on a trowel over the furnace
- `hoa-welder` at (-252, -57) facing N, work: welds plate to the armor rig at the anvil
- `hoa-welder` at (-260, -66) facing SE, work: grinds a seam on the second plate
- `cedric` at (-238, -48) facing NW, work: refills sacks with dyed sawdust
- `player` at (-248, -42) facing N, stand: stands at the edge of the heap

**What they do while idle (walks):**
- `ernie` (loop, 3 points, 1 m/s, 4 s stops): walks between the furnace and the heap with a bucket
- `hoa-welder` (loop, 3 points, 0.9 m/s, 3 s stops): walks between the anvil and the rig with a plate
- `cedric` (loop, 3 points, 1.1 m/s, 3 s stops): carries a sack of dyed sawdust from the heap to the bins

**Vehicles:**
- `armor-rig`: parked ride-on at (-255, -52) facing N: the armor-plate Ride-On, plates half on
- `compost-heap-pull-up`: pull-up lowrider at (-250, -22) facing E: stops on the west highway by the forge track
- `compost-heap-exit`: exit lowrider at (-246, -16) facing W: the getaway starts back to the highway

**Drive paths:**
- `forge-approach`: approach, lowrider, (-180, 0) to (-250, -22) (3 points): from the west highway
- `forge-getaway`: getaway, lowrider, (-246, -16) to (-180, 0) (3 points): to the highway

**Cameras:** `wide` (establishing: the forge, the heaps and the glow of the anvil); `two-shot` (over the player's shoulder onto Ernie at the furnace); `arrival` (watching the armor rig and the pull-up).

**Set dressing (prefabs):** `anvil`, `workbench`, 3 x `gta-dew-barrel`, `cauldron`.

### Father Loam's old Chapel of Mulch van `chapel-van`

**Where:** Mossy Wood, centre (-283, -18), radius 15 m, facing E. **Default time:** golden. **Built:** in the world, plus stage set dressing. **Used by:** `lore-father-loam`, `sq-hoa-audit`.

**Looks:** A broken-axle van with its back doors open in a clearing of ferns, a pew dragged out onto the moss, candles in jam jars, a letter pinned under a stone.

**Sounds:** Wind through the ferns, a bell tinkling on the van, a bark of ticketing, Merle humming a hymn.

**Who is there (marks):**
- `merle` at (-262, -12) facing NW, sit: sits on a tree root, sorting moss into a basket
- `hoa-inspector-lichen` at (-320, -20) facing E, stand: tickets the bark of a tree with a clipboard
- `player` at (-278, -20) facing NW, stand: walks up to the broken van

**What they do while idle (walks):**
- `merle` (back and forth, 3 points, 0.9 m/s, 4 s stops): walks to the van with moss, then back to the root
- `hoa-inspector-lichen` (loop, 3 points, 1.1 m/s, 3 s stops): walks round the trees pinning tickets to bark

**Vehicles:**
- `chapel-van-pull-up`: pull-up lowrider at (-300, 7) facing NE: stops on the west highway by the clearing track
- `chapel-van-exit`: exit lowrider at (-296, 6) facing W: the getaway leaves from the highway

**Drive paths:**
- `van-approach`: approach, lowrider, (-180, 0) to (-300, 7) (3 points): west highway from the east
- `van-getaway`: getaway, lowrider, (-296, 6) to (-180, 0) (3 points)

**Cameras:** `wide` (establishing: the van in the ferns, the sun going down); `two-shot` (over the player's shoulder onto Merle); `close` (close on the pew and the candles).

**Set dressing (prefabs):** `pew`, 3 x `candle`, `sealed-letter`.

### The Tall House Porch `tall-house-porch`

**Where:** Mossy Wood, centre (-542, 40), radius 14 m, facing E. **Default time:** dusk. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `strangers-porch`. **Used by:** `sq-porcelain-blues`, `sq-porcelain-support`.

**Looks:** A tall house porch of grey boards with paper lanterns on hooks, a toaster altar on a side table, a rocking chair, Clara's pearl-white Lowrider parked at the foot of the steps.

**Sounds:** Lantern chains creaking, porcelain refugees arguing in low voices, a toaster ticking as it cools.

**Who is there (marks):**
- `clara` at (-544, 38) facing W, work: lights the lanterns one by one with a long taper
- `porcelain-refugee` at (-540, 49) facing NW, stand: argues with a neighbour over the toaster altar
- `porcelain-refugee` at (-546, 52) facing N, stand: holds out a cracked cup to the altar
- `porcelain-refugee` at (-538, 44) facing W, stand: bows to the toaster
- `porcelain-refugee` at (-541, 40) facing SW, stand: leans on the porch rail, watching the road
- `player` at (-534, 44) facing W, stand: climbs the steps with a crate of refugee ration tins

**What they do while idle (walks):**
- `clara` (loop, 3 points, 1 m/s, 4 s stops): lights each lantern in turn, then straightens the rocking chair
- `porcelain-refugee` (loop, 4 points, 0.9 m/s, 3 s stops): circles the altar, muttering a prayer to the toaster

**Vehicles:**
- `clara-lowrider`: parked lowrider at (-550, 36) facing E, Clara's: pearl-white Lowrider, shock-absorbed, facing east
- `tall-house-porch-pull-up`: pull-up lowrider at (-548, -27) facing E: stops on the west highway, a path runs up to the porch
- `tall-house-porch-exit`: exit lowrider at (-552, -27) facing W: the getaway leaves from the highway edge

**Drive paths:**
- `porch-approach`: approach, lowrider, (-400, 0) to (-548, -27) (3 points): west highway along z = -30
- `porch-getaway`: getaway, lowrider, (-552, -27) to (-400, 0) (3 points): east to the highway

**Cameras:** `wide` (establishing: the porch, the lanterns and the parked Lowrider); `two-shot` (over the player's shoulder onto Clara and the altar); `close` (close on the cursed toaster and the refugees round it).

**Set dressing (prefabs):** `side-table`, `cursed-toaster`, 3 x `porcelain-lantern`, `rocking-chair`.

### Knot-Hole Nora's fence post `knot-hole`

**Where:** Mossy Wood, centre (-582, -120), radius 12 m, facing E. **Default time:** night. **Built:** in the world, plus stage set dressing. **Used by:** `lore-fence-line`.

**Looks:** A fence post of split cedar in the perimeter fence, a thimble turned over as a stool, a brass telescope on a stand, rain running down the wire.

**Sounds:** Wire fence humming in the wind, the creak of a telescope stand, Nora breathing through a flask.

**Who is there (marks):**
- `nora` at (-588, -120) facing E, sit: sits on the overturned thimble with a spyglass to her eye
- `player` at (-576, -120) facing W, stand: walks up to the fence post

**What they do while idle (walks):**
- `nora` (back and forth, 3 points, 1 m/s, 5 s stops): walks along the fence checking the knots, then walks back

**Vehicles:**
- `knot-hole-pull-up`: pull-up lowrider at (-570, -112) facing E: a field pull-up beside the fence
- `knot-hole-exit`: exit lowrider at (-566, -116) facing W: the getaway leaves over the grass

**Drive paths:**
- `knot-approach`: approach, lowrider, (-520, -80) to (-570, -112) (3 points, off-road): forest track along the fence
- `knot-getaway`: getaway, lowrider, (-566, -116) to (-520, -80) (3 points, off-road)

**Cameras:** `wide` (establishing: the fence line and the knot-hole post in the dark); `two-shot` (over the player's shoulder onto Nora and the post); `close` (close on the spyglass and the knot-hole).

**Set dressing (prefabs):** `stool`, `gsr-telescope-stand`.

### The Skyway Foot, the organiser's pitch `street-skyway-foot`

**Where:** Mossy Wood, centre (-293, -64), radius 10 m, facing SE. **Default time:** night. **Built:** new: exists through its stage set dressing. **Quest giver marker:** `street-skyway-foot`. **Used by:** `sr-kerb-row`, `sr-skyway-midnight`, `sr-ring-road`.

**Looks:** Open ground under the west foot of the Skyway, a clipboard on a folding table, a hand-lettered start board and a chalk grid on the tarmac.

**Sounds:** Engines idling under the ramp, a radio playing the wrong station, Ratchet tapping a pen on the table.

**Who is there (marks):**
- `ratchet` at (-293, -64) facing S, stand: behind the clipboard table, arms folded
- `player` at (-291, -61) facing NW, stand: walks up from the grid side

**Cameras:** `foot` (from the grid onto Ratchet at the table).

### Even-Estates Plot 1, outside the west gate `chard`

**Where:** Mossy Wood, centre (-323, -117), radius 10 m, facing W. **Default time:** dusk. **Built:** already in the world. **Quest giver marker:** `chard`. **Used by:** `sq-levelright-night-shift`.

**Looks:** Beige-and-pale-blue hoardings with a gap for the gate, a crane painted "Level Is Kind", a caravan with one lit window.

**Sounds:** A far hammer, a mixer turning over, a spirit level tapped on a post.

**Who is there (marks):**
- `chard` at (-323, -117) facing E, stand: with a spirit level under one arm, checking something by eye
- `player` at (-321, -117) facing W, stand: walks up from the road

**Cameras:** `gate` (from the road onto Chard and the gate behind him).

## Frostbite Fells

### The Frozen Birdbath Basin `birdbath-basin`

**Where:** Frostbite Fells, centre (4, -332), radius 22 m, facing E. **Default time:** dawn. **Built:** in the world, plus stage set dressing. **Inside:** the off-map cutscene room `fells-shrine`. **Quest giver marker:** `fells-basin`. **Used by:** `ch3-kiln-resin-ice`, `ch3-tundra-drift-run`, `ch3-salvage-raid`, `first-contract`, `sq-hoa-audit`.

**Looks:** A frozen birdbath basin of blue ice in a snow field, a stove with a cauldron of Kiln-Resin, torches on posts, a bench, a snowmobile with candle lamps parked on the rim.

**Sounds:** Ice creaking underfoot, the stove roaring, Father Loam preaching over a snow wind, a bell on the snowmobile.

**Who is there (marks):**
- `loam` at (-4, -342) facing SE, stand: preaches from his snowmobile to the basin, arms wide
- `pip` at (14, -348) facing SW, sit: sits on the bench with his arm in a sling
- `shelldon` at (6, -328) facing N, stand: a courier snail delivers Tansy's scroll to the rim
- `player` at (4, -332) facing N, stand: walks up to the rim of the basin

**What they do while idle (walks):**
- `loam` (loop, 3 points, 0.9 m/s, 5 s stops): walks between the stove and the basin rim, blessing the ice
- `pip` (back and forth, 2 points, 0.8 m/s, 6 s stops): nurses his arm in the sling, then sits back on the bench

**Vehicles:**
- `loam-snowmobile`: parked ride-on at (-4, -352) facing E, Father Loam's: the spiked-tyre snowmobile with candle lamps, parked by the rim
- `ice-zero-turn`: parked zero-turn at (10, -335) facing E: the chapter 3 drift-run mower, facing east
- `birdbath-basin-pull-up`: pull-up lowrider at (38, -326) facing NE: stops on the north highway by the basin
- `birdbath-basin-exit`: exit zero-turn at (44, -332) facing W: the drift run leaves from the north highway

**Drive paths:**
- `basin-approach`: approach, lowrider, (0, -260) to (38, -326) (3 points): north highway up to the basin
- `basin-drift-run`: getaway, zero-turn, (10, -335) to (300, 40) (5 points): chapter 3 drift run east along ring-ne

**Cameras:** `wide` (establishing: the frozen basin, the stove and the rising dawn); `two-shot` (over the player's shoulder onto Loam at the rim); `arrival` (watching the zero-turn and the pull-up on the north highway).

**Set dressing (prefabs):** `cauldron`, `bench`, 2 x `torch`, 2 x `clay-jar`.

### Thermos Theo's barrel `theo-camp`

**Where:** Frostbite Fells, centre (48, -346), radius 10 m, facing N. **Default time:** dawn. **Built:** in the world, plus stage set dressing. **Used by:** `ch3-kiln-resin-ice`.

**Looks:** A pine-cone barrel on the snow beside the north highway, a three-legged stool, a woodpile under a tarp, a thermos steaming on the barrel lid.

**Sounds:** Tea being poured from a thermos, wind over the snow, the cracking of logs.

**Who is there (marks):**
- `theo` at (44, -344) facing N, sit: pours tea from a thermos into a tin mug
- `player` at (44, -350) facing SW, stand: steps off the snow towards the barrel

**What they do while idle (walks):**
- `theo` (back and forth, 3 points, 1 m/s, 4 s stops): walks to the woodpile with an armful of kindling, then back to the barrel

**Vehicles:**
- `theo-camp-pull-up`: pull-up lowrider at (60, -320) facing E: a visitor stops on the ring-ne road by the camp
- `theo-camp-exit`: exit lowrider at (70, -316) facing W: the getaway leaves back to the north highway

**Drive paths:**
- `camp-approach`: approach, lowrider, (335, -90) to (60, -320) (3 points): ring-ne road from the east
- `camp-getaway`: getaway, lowrider, (70, -316) to (0, -400) (3 points): to the north highway

**Cameras:** `wide` (establishing: the pine-cone barrel and the woodpile); `two-shot` (over the player's shoulder onto Theo pouring tea); `close` (close on the scroll and the thermos on the barrel).

**Set dressing (prefabs):** `stool`, `rolled-scroll`, `barrel`.

### The northern Kiln-Resin shrine `kiln-shrine`

**Where:** Frostbite Fells, centre (-40, -515), radius 12 m, facing E. **Default time:** dusk. **Built:** in the world, plus stage set dressing. **Used by:** `ch3-kiln-resin-ice`.

**Looks:** A shrine of black stone on a snowy rise, two candles in the drift, a clay jar of resin, a lectern of carved ice, the north highway running past.

**Sounds:** Candle flames hissing in the wind, a prayer chanted low, snow falling off the pines.

**Who is there (marks):**
- `loam` at (-46, -512) facing NE, work: blesses the resin with a sprig of pine
- `player` at (-34, -520) facing SW, stand: takes the resin pick-up from the shrine

**What they do while idle (walks):**
- `loam` (loop, 4 points, 0.9 m/s, 4 s stops): walks round the shrine, touching each candle

**Vehicles:**
- `kiln-shrine-pull-up`: pull-up lowrider at (-39, -468) facing N: stops on the north highway below the shrine
- `kiln-shrine-exit`: exit lowrider at (-42, -478) facing N: the getaway starts north along the highway

**Drive paths:**
- `shrine-approach`: approach, lowrider, (0, -400) to (-39, -468) (3 points): north highway from the basin
- `shrine-getaway`: getaway, lowrider, (-42, -478) to (-20, -570) (2 points): north on the highway

**Cameras:** `wide` (establishing: the shrine on the rise against the dusk); `two-shot` (over the player's shoulder onto Loam blessing the resin); `close` (close on the candles and the resin jar).

**Set dressing (prefabs):** 2 x `candle`, `clay-jar`, `lectern`.

### HOA salt-plow blockade, north basin approach `salt-plow-blockade`

**Where:** Frostbite Fells, centre (0, -392), radius 16 m, facing E. **Default time:** dawn. **Built:** already in the world. **Used by:** `ch3-kiln-resin-ice`.

**Looks:** Two HOA salt-plow vans slewed across the north highway, orange cones, salt piled on the verge, the snow turned to brown slush under the lamps.

**Sounds:** Engines idling, a plow driver shouting over the radio, salt crunching under boots.

**Who is there (marks):**
- `salt-plow-driver` at (-12, -390) facing E, stand: waves the visitor down with a clipboard
- `salt-plow-driver` at (12, -390) facing W, stand: leans on the plow, arms folded
- `player` at (0, -380) facing N, stand: stops in front of the plows

**What they do while idle (walks):**
- `salt-plow-driver` (loop, 3 points, 1 m/s, 4 s stops): paces the verge with a clipboard

**Vehicles:**
- `salt-plow-1`: parked hoa-van at (2, -386) facing E: an HOA salt plow slewed across the road
- `salt-plow-2`: parked hoa-van at (6, -398) facing E: the second plow across the road
- `salt-plow-blockade-pull-up`: pull-up lowrider at (26, -355) facing NE: a visitor stops before the blockade
- `salt-plow-blockade-exit`: exit lowrider at (-7, -412) facing SW: the getaway starts past the plows

**Drive paths:**
- `blockade-approach`: approach, lowrider, (250, -230) to (26, -355) (3 points): from the basin on the north highway
- `blockade-getaway`: getaway, lowrider, (-7, -412) to (-20, -570) (3 points): north to the shrine road

**Cameras:** `wide` (establishing: the plows slewed across the highway); `two-shot` (over the player's shoulder onto the driver); `arrival` (watching the approach from the basin).

### North-west ring road hideout `ring-road-hideout`

**Where:** Frostbite Fells, centre (-258, -300), radius 20 m, facing SE. **Default time:** night. **Built:** already in the world. **Used by:** `ch3-salvage-raid`.

**Looks:** A pull-off on the north-west ring road in the spruce, a waiting Zero-Turn with its lamps off, a tarp and a fuel can in the ditch.

**Sounds:** Wind in the spruce, a fuel can rattling in the ditch, the engine ticking as it cools.

**Who is there (marks):**
- `player` at (-262, -310) facing S, stand: waits at the pull-off with a torch

**Vehicles:**
- `escape-zero-turn`: parked zero-turn at (-255, -265) facing SE: the Zero-Turn waiting for the chapter 3 escape, lamps off
- `ring-road-hideout-pull-up`: pull-up lowrider at (-262, -318) facing E: a visitor pulls off the ring road into the spruce
- `ring-road-hideout-exit`: exit lowrider at (-264, -322) facing W: the getaway starts back along the ring road

**Drive paths:**
- `hideout-approach`: approach, lowrider, (-340, -190) to (-262, -318) (4 points): ring-nw from the west
- `hideout-getaway`: getaway, lowrider, (-264, -322) to (0, -400) (4 points): ring-nw east to the north highway

**Cameras:** `wide` (establishing: the pull-off on the ring road at night); `two-shot` (over the player's shoulder onto the waiting Zero-Turn); `arrival` (watching the pull-up mark on the ring road).

### The Capwood Run, start paddock `capwood-paddock`

**Where:** Frostbite Fells, centre (80, -758), radius 14 m, facing E. **Default time:** day. **Built:** already in the world. **Quest giver marker:** `capwood-lulu`. **Used by:** `race-capwood-open`.

**Looks:** A flat paddock of churned snow and mud, a hand-painted START board and a row of hatchbacks with their numbers taped on.

**Sounds:** Idling engines, a boom box, Lulu revving to be heard.

**Who is there (marks):**
- `lulu` at (80, -758) facing E, stand: leaning on a lowrider bonnet
- `player` at (86, -758) facing W, stand: walks over from the grid

**Cameras:** `paddock` (from the grid onto Lulu in the paddock).

## The Dust Flats

### The Overlook safehouse, Dust Flats `dust-safehouse`

**Where:** The Dust Flats, centre (276, 44), radius 18 m, facing E. **Default time:** golden. **Built:** new: exists through its stage set dressing. **Inside:** the off-map cutscene room `dust-overlook`. **Quest giver marker:** `dust-overlook`. **Used by:** `ch3-tundra-drift-run`, `ch4-runway-flares`, `ch4-sandpit-drop`, `ch4-spade-truce`, `ch5-even-cut`, `sq-hoa-audit`.

**Looks:** A dusty rise above the highway bend: an adobe hut, an HQ tent, a map table with the Stopping Stone, crates and dew barrels round a campfire, a team banner on a pole, and the walls of Fort Sandpit glinting to the east under a low gold sun.

**Sounds:** Wind over the dust, a tin banner snapping, the campfire crackling, Pip humming over the whirligig rotor, HOA spotters whistling from the ridge.

**Who is there (marks):**
- `tansy` at (268, 43) facing NE, lean: leans on the map table over the Stopping Stone, tracing the highway with a finger
- `diggs` at (264, 44) facing E, stand: arms folded, watching the ridge through binoculars
- `granny` at (262, 42) facing E, sit: on a crate with a thermos, waiting for the finale briefing
- `hoa-spotter` at (275, 45) facing E, stand: watches the road through a brass spyglass
- `hoa-spotter` at (272, 30) facing E, stand: lies low on the ridge with a whistle in his teeth
- `pip` at (278, 56) facing NE, stand: circles the parked whirligig with a spanner, checking the rotor
- `player` at (272, 50) facing N, stand: steps out of the safehouse hut into the dust

**What they do while idle (walks):**
- `tansy` (back and forth, 2 points, 1 m/s, 4 s stops): checks the map on the table, then walks to the hut door and back
- `pip` (loop, 4 points, 1.1 m/s, 3 s stops): circles the parked whirligig, tapping the rotor for a rattle

**Vehicles:**
- `safehouse-whirligig`: parked whirligig at (282, 50) facing S: landed beside the hut, rotor folded
- `crew-plane`: parked plane at (240, 40) facing E: parked on open ground west of the highway
- `dust-safehouse-pull-up`: pull-up lowrider at (286, 29) facing E: the highway bend, a car stops on the dust shoulder
- `dust-safehouse-exit`: exit lowrider at (288, 40) facing N: the shoulder by the ring road, ready to go north

**Drive paths:**
- `approach`: approach, lowrider, (180, 0) to (286, 29) (3 points): along the east highway from the west
- `getaway`: getaway, lowrider, (288, 40) to (289, -165) (4 points): north up ring-ne

**Cameras:** `wide` (establishing: the rise, the hut and tent, the highway bending past and the fort walls beyond); `two-shot` (over the player's shoulder onto Tansy at the map table); `overhead` (high above the map table, looking down on the crew).

**Set dressing (prefabs):** `adobe-hut`, `table`, `rolled-scroll`, `hq-tent`, 3 x `crate`, 2 x `gta-dew-barrel`, `campfire`, `team-banner`.

### Desert Airfield apron `airfield-apron`

**Where:** The Dust Flats, centre (450, -96), radius 40 m, facing E. **Default time:** day. **Built:** in the world, plus stage set dressing. **Used by:** `ch4-runway-flares`.

**Looks:** A desert airfield: an east-west asphalt runway, a Crop Duster and a few parked planes on the north apron, a lawn chair and a windsock at the far east end, a chili pot on a campfire under a sun-bleached sky.

**Sounds:** A windsock snapping, a Crop Duster ticking as it cools, Wally reading the wind out loud, distant hot-air whine from the spur.

**Who is there (marks):**
- `wally` at (565, -110) facing W, sit (0.4 m up): in his lawn chair at the runway's east end, binoculars up, reading the windsock aloud
- `spade-guard` at (430, -85) facing NE, stand: patrols the apron, rifle slung, checking the planes' tie-downs
- `spade-guard` at (450, -95) facing SW, stand: waves a flag at a taxiing Crop Duster
- `player` at (456, -84) facing NW, stand: climbs off the spur onto the apron, eyes on the Crop Duster

**What they do while idle (walks):**
- `spade-guard` (loop, 4 points, 1.1 m/s, 4 s stops): loops the apron, checking tie-downs and chocks
- `wally` (back and forth, 2 points, 1.1 m/s, 6 s stops): walks to the chili pot to stir it, then back to his chair

**Vehicles:**
- `wally-crop-duster`: parked plane at (440, -92) facing E, Wind-Sock Wally's: the Crop Duster on the north apron, nose to the runway, fuel can on the wing
- `airfield-apron-pull-up`: pull-up lowrider at (500, -70) facing E: the end of the airfield spur, a car pulls up at the apron edge
- `airfield-apron-exit`: exit lowrider at (470, -72) facing N: on the spur, ready to head back out to the highway

**Drive paths:**
- `approach`: approach, lowrider, (180, 0) to (500, -70) (7 points): east highway, then the airfield spur
- `getaway`: getaway, lowrider, (470, -72) to (180, 0) (7 points): back down the spur to the highway
- `takeoff`: getaway, plane, (420, -110) to (560, -110) (2 points): the runway, west to east

**Cameras:** `wide` (establishing: the apron, the parked Crop Duster and the runway beyond); `two-shot` (over the player's shoulder onto the nearest Spade Guard); `arrival` (watching the spur pull-up mark from the apron side).

**Set dressing (prefabs):** `campfire`, `cauldron`, `deck-chair`, `signpost`.

### Fort Sandpit gate `fort-sandpit-gate`

**Where:** The Dust Flats, centre (374, 44), radius 20 m, facing N. **Default time:** day. **Built:** in the world, plus stage set dressing. **Used by:** `ch4-spade-truce`, `ch4-sandpit-drop`.

**Looks:** The gatehouse of a walled square fort: sandbag lines along the wall, a gsr toll booth on the road, team banners on poles and crates stacked by the gap in the wall, the fort-gate road running up to it under a hard sun.

**Sounds:** Boots on gravel, the flap of a team banner, a sawhorse scraping, a radio squawking inside the gatehouse.

**Who is there (marks):**
- `diggs` at (374, 38) facing S, stand: stands at the gate with a trowel under his arm, glaring down the road
- `lockout-enforcer` at (368, 42) facing SE, stand: arms crossed, checking the cars on the fort-gate road
- `lockout-enforcer` at (380, 42) facing SW, stand: holds a clipboard of lockout notices
- `lockout-enforcer` at (374, 52) facing N, stand: blocks the middle of the road with a painted sawhorse
- `spade-guard` at (352, 24) facing SE, stand: sights along the wall at the road
- `spade-guard` at (392, 24) facing SW, stand: leans on the parapet with a spyglass
- `player` at (382, 58) facing NW, stand: walks up the fort-gate road from the east with the plan in hand

**What they do while idle (walks):**
- `diggs` (back and forth, 2 points, 1 m/s, 4 s stops): walks the sandbag line outside the wall, checking each bag with a trowel
- `spade-guard` (loop, 2 points, 1 m/s, 3 s stops): paces the parapet, watching the gate
- `lockout-enforcer` (back and forth, 2 points, 1 m/s, 4 s stops): stands guard on the road, turning cars away

**Vehicles:**
- `diggs-zero-turn`: parked zero-turn at (364, 60) facing N, Commander Diggs's: parked outside the gate, roo-bar up, engine ticking
- `fort-sandpit-gate-pull-up`: pull-up zero-turn at (374, 56) facing N: stops on the fort-gate road, outside the gatehouse
- `fort-sandpit-gate-exit`: exit zero-turn at (380, 64) facing S: off the road, ready to tear back down to the highway

**Drive paths:**
- `diggs-to-gate`: chase, zero-turn, (300, 40) to (374, 44) (4 points): the chase: off the highway and up to the gate
- `approach`: approach, zero-turn, (180, 0) to (374, 56) (5 points): east highway, then the fort-gate road
- `getaway`: getaway, zero-turn, (380, 64) to (180, 0) (5 points): back down the gate road to the highway

**Cameras:** `wide` (establishing: the gate, the wall and the road bending in from the highway); `two-shot` (over the player's shoulder onto Diggs at the gate); `arrival` (watching the gate pull-up mark from the road).

**Set dressing (prefabs):** `gsr-toll-booth`, 2 x `team-banner`, 2 x `crate`.

### Fort Sandpit Whirligig pad `fort-sandpit-pad`

**Where:** The Dust Flats, centre (362, -2), radius 15 m, facing S. **Default time:** day. **Built:** already in the world. **Used by:** `ch4-sandpit-drop`, `ch4-spade-truce`.

**Looks:** The inside of Fort Sandpit: a flat concrete Whirligig pad with the craft folded on it, sniper nests along the walls, the armory behind a low block wall, all under a hard sun and a sky full of dust.

**Sounds:** A rifle bolt racked somewhere up the wall, wind in the gaps of the walls, a Whirligig rotor ticking as it cools.

**Who is there (marks):**
- `spade-guard-sniper` at (348, 6) facing NE, kneel: keeps a long-barrelled rifle on the wall, eye on the pad
- `spade-guard-sniper` at (368, 20) facing N, kneel: sights down the pad from the armory side
- `player` at (364, 4) facing NW, stand: drops out of the sky on a parachute and lands on the pad

**What they do while idle (walks):**
- `spade-guard-sniper` (loop, 4 points, 1 m/s, 3 s stops): patrols the edge of the pad, checking the sights

**Vehicles:**
- `fort-whirligig`: parked whirligig at (358, -8) facing E: landed on the pad, rotor folded
- `fort-sandpit-pad-pull-up`: pull-up whirligig at (376, 18) facing N: inside the gate, on the armory side of the gate road
- `fort-sandpit-pad-exit`: exit whirligig at (370, 20) facing N: inside the wall, ready to lift off

**Drive paths:**
- `approach`: approach, whirligig, (180, 0) to (376, 18) (6 points): in over the highway and through the gate
- `getaway`: getaway, whirligig, (370, 20) to (180, 0) (6 points): out through the gate and away

**Cameras:** `wide` (establishing: the pad inside the walls, the whirligig and the armory beyond); `two-shot` (over the player's shoulder towards the pad); `overhead` (high over the pad, looking straight down on the whirligig).

### Lost & Found Speedway, pit lane and grid `speedway-pits`

**Where:** The Dust Flats, centre (742, -380), radius 45 m, facing S. **Default time:** day. **Built:** already in the world. **Quest giver marker:** `speedway`. **Used by:** `race-rookie-mowdown`, `race-lowrider-derby`, `race-snail-endurance`, `race-fizz-cup-final`.

**Looks:** A paved circuit on the alkali pan: a chequered gantry over the start line, a Tall-One ruler for a pit wall, pit garages and a pink Pay 'n' Glaze on the apron, a podium behind the race desk, and grandstands built from a giant book stack and a sneaker packed with fans.

**Sounds:** Crowd murmur from the grandstands, idling mowers on the grid, Burdock's whistle, tyres squealing out of the last corner.

**Who is there (marks):**
- `burdock` at (742, -393) facing S, stand: at the race desk with his chequered tea towel over one shoulder
- `player` at (742, -388) facing N, stand: walks up the pit lane to the desk
- `pit-crew` at (723, -393) facing S, work: kneels by a tyre stack in front of a garage

**What they do while idle (walks):**
- `pit-crew` (back and forth, 2 points, 1.1 m/s, 4 s stops): rolls a tyre between two garages

**Vehicles:**
- `speedway-pull-up`: pull-up ride-on at (760, -386) facing E: stops in the pit lane by the garages
- `speedway-exit`: exit ride-on at (800, -384) facing E: out of the pit lane towards turn one

**Drive paths:**
- `approach`: approach, ride-on, (790, 48) to (783, -355) (5 points, off-road): north up the dirt road from the east-outer highway onto the main straight

**Cameras:** `desk` (from the pit lane onto Burdock at the desk, the podium behind him); `grid` (from the outside of the main straight down the grid to the gantry).

### Pebblewick, the dry plots on Weeping Lane `pebblewick-plots`

**Where:** The Dust Flats, centre (612, 140), radius 16 m, facing N. **Default time:** day. **Built:** already in the world. **Quest giver marker:** `pebblewick-plots`. **Used by:** `sq-weeping-line`.

**Looks:** Furrowed pepper plots behind wattle fences, a dark tube weeping along each bed, a scarecrow and a windmill turning over adobe roofs.

**Sounds:** Windmill creak, a rake in dry soil, a hen somewhere, the drip of the Weeping Line.

**Who is there (marks):**
- `purslane` at (612, 147) facing N, stand: leaning on her rake at the edge of the plots
- `player` at (612, 141) facing S, stand: walks down the gap between the houses from Weeping Lane

**Cameras:** `plots` (from Weeping Lane down the gap onto Purslane and the plots).

### Pebblewick, the foot of the water tower `pebblewick-tower`

**Where:** The Dust Flats, centre (708, 170), radius 10 m, facing E. **Default time:** day. **Built:** already in the world. **Quest giver marker:** `pebblewick-tower`. **Used by:** `sq-hum-at-three`.

**Looks:** A tin water tower on four legs over the hen pen, Mallow's map of arrows pinned to a leg, the dunes beyond the fence to the east.

**Sounds:** Hens, the tank ticking in the heat, wind over the dunes.

**Who is there (marks):**
- `mallow` at (712, 171) facing W, stand: at the foot of the tower with her map of arrows
- `player` at (706, 170) facing E, stand: comes round the Green to the tower

**Cameras:** `tower` (from the edge of the Green onto Mallow under the tower).

## Loch Moss

### Loch Moss dock `loch-dock`

**Where:** Loch Moss, centre (-722, -552), radius 25 m, facing N. **Default time:** golden. **Built:** in the world, plus stage set dressing. **Quest giver marker:** `loch-driftwood`. **Used by:** `sq-tessie`.

**Looks:** A weathered wooden dock off the end of the loch-spur track: a timber jetty into the reeds, a fishing rod leaning on a deck chair, a tin pail and a NO MONSTERS signpost on the shore, the dark loch and its reeds beyond.

**Sounds:** Lapping water against the jetty, reeds rattling, a gull, Driftwood muttering at the water.

**Who is there (marks):**
- `driftwood` at (-722, -556) facing N, stand: stands on the shore with a hand over his eyes, watching the water for Tessie
- `tattler-reporter` at (-702, -544) facing NW, stand: holds a camera up by the tabloid ring, shutter ready
- `player` at (-720, -545) facing N, stand: stands at the giver marker, facing the dock

**What they do while idle (walks):**
- `driftwood` (back and forth, 2 points, 1 m/s, 5 s stops): watches the water along the shore, then walks back

**Vehicles:**
- `driftwood-dinghy`: parked walnut-dinghy at (-726, -574) facing N, Driftwood's: tied to the dock on the water, oars in the bottom
- `tessie-arrival`: parked tessie at (-713, -590) facing S: surfacing off the loch, where she is ridden back to
- `loch-dock-pull-up`: pull-up lowrider at (-720, -478) facing S: the road end at the top of the loch track
- `loch-dock-exit`: exit lowrider at (-716, -484) facing N: the road end, ready to head back north

**Drive paths:**
- `approach`: approach, lowrider, (-720, -30) to (-720, -478) (4 points): down loch-spur from the north
- `getaway`: getaway, lowrider, (-716, -484) to (-720, -30) (5 points): back up loch-spur
- `dock-to-loch`: chase, walnut-dinghy, (-726, -572) to (-700, -650) (3 points): the dinghy out onto the loch

**Cameras:** `wide` (establishing: the shore, the dock and the loch beyond); `two-shot` (over the player's shoulder onto Driftwood on the shore); `arrival` (watching the road-end pull-up mark from the bank).

**Set dressing (prefabs):** `deck-chair`, `fishing-rod`, `tin-pail`, `signpost`.

### Tessie's island nest `tessie-nest`

**Where:** Loch Moss, centre (-748, -714), radius 25 m, facing E, boat scene. **Default time:** golden. **Built:** in the world, plus stage set dressing. **Used by:** `sq-tessie`.

**Looks:** A small dry island in Loch Moss: rough grass and reeds, rocks round a turtle-egg clutch in a scraped nest on its east slope, the loch black and flat all round.

**Sounds:** Water slapping the shingle, a heron somewhere in the reeds, the dinghy bumping its gunwale.

**Who is there (marks):**
- `player` at (-756, -714) facing E, stand: wades up the little island to the nest, boots squelching

**Vehicles:**
- `nest-dinghy`: parked walnut-dinghy at (-734, -716) facing E: drifting just off the east shore, oars shipped
- `tessie-nest-pull-up`: pull-up walnut-dinghy at (-734, -708) facing N: the east water, where the escort boat comes in
- `tessie-nest-exit`: exit walnut-dinghy at (-735, -727) facing W: the east water, ready to leave for the loch

**Drive paths:**
- `nest-run`: approach, walnut-dinghy, (-690, -600) to (-734, -708) (4 points): the escort route, out from the loch to the island
- `getaway`: getaway, walnut-dinghy, (-735, -727) to (-690, -600) (4 points): back out onto the loch

**Cameras:** `wide` (establishing: the island and its nest on the loch, the dinghy off the east shore); `two-shot` (over the player's shoulder onto the nest); `overhead` (high over the island, looking down on the nest and rocks).

**Set dressing (prefabs):** `turtle-egg-clutch`, 4 x `garden-rock`.

### Open water, Loch Moss `loch-open-water`

**Where:** Loch Moss, centre (-700, -680), radius 150 m, facing S, boat scene. **Default time:** golden. **Built:** already in the world. **Used by:** `sq-tessie`.

**Looks:** The open middle of Loch Moss: black water, reeds at the margins, an HOA patrol boat and a dredger boat working the middle, a spare walnut dinghy bobbing on its rope.

**Sounds:** Water slapping hulls, an outboard idling, a dredger chain clanking, something large turning over far out.

**Who is there (marks):**
- `player` at (-690, -684) facing W, drive: at the tiller of a walnut dinghy, scanning the water for Tessie

**Vehicles:**
- `hoa-patrol`: parked hoa-patrol-boat at (-680, -700) facing E: the HOA patrol boat idling in the middle of the loch
- `hoa-dredger-boat`: parked hoa-patrol-boat at (-650, -690) facing W: the dredger boat, its net trailing
- `loch-dinghy`: parked walnut-dinghy at (-712, -668) facing S: a spare walnut dinghy drifting on its rope
- `loch-open-water-pull-up`: pull-up walnut-dinghy at (-620, -700) facing E: the water off the eastern reeds, where the escort boat ties up
- `loch-open-water-exit`: exit walnut-dinghy at (-640, -694) facing W: the water by the dredger, ready to leave

**Drive paths:**
- `hoa-patrol-loop`: patrol, hoa-patrol-boat, (-672, -720) to (-722, -700) (8 points): the patrol loop round the middle of the loch
- `approach`: approach, walnut-dinghy, (-566, -660) to (-620, -700) (2 points): in from the eastern reeds
- `getaway`: getaway, walnut-dinghy, (-640, -694) to (-566, -660) (3 points): back out to the eastern reeds

**Cameras:** `wide` (establishing: the loch, the patrol boats and the dinghy in the middle of the water); `two-shot` (over the player's shoulder towards the HOA patrol); `low` (low over the water, the surface almost at eye level).

## Tallgrass Commons

### Tallgrass Commons hive `commons-hive`

**Where:** Tallgrass Commons, centre (-742, 624), radius 20 m, facing N. **Default time:** day. **Built:** already in the world. **Used by:** `future`.

**Looks:** The far end of the Tallgrass Commons trail: giant grass taller than a gnome closing in on a dirt track, a beekeeper's hive of stacked boxes on a stand, the trail ending in a clearing.

**Sounds:** Bees humming over the grass, grass whispering in the wind, a far-off cow.

**Who is there (marks):**
- `beekeeper` at (-748, 622) facing SE, work: lifts a hive frame to the light, veil pushed back
- `player` at (-736, 626) facing NW, stand: steps off the trail into the giant grass, bees humming overhead

**What they do while idle (walks):**
- `beekeeper` (loop, 4 points, 1 m/s, 4 s stops): walks round the hive, checking each frame

**Vehicles:**
- `commons-hive-pull-up`: pull-up lowrider at (-742, 628) facing S: the trail end, a car turns on the grass
- `commons-hive-exit`: exit lowrider at (-739, 616) facing N: on the trail, ready to head back north

**Drive paths:**
- `approach`: approach, lowrider, (-720, -30) to (-742, 626) (6 points): commons-spur, then the trail
- `getaway`: getaway, lowrider, (-739, 616) to (-720, -30) (6 points): the trail, then back up commons-spur

**Cameras:** `wide` (establishing: giant grass, the trail winding in and the hive beyond); `two-shot` (over the player's shoulder onto the beekeeper); `arrival` (watching the trail-end pull-up mark from the trail).

## Built for these stages (prefab parts lists)

The stages marked new were built in the world from `@lawn/prefabs` set dressing (`src/stageSets.ts` builds every stage's `set`; solid props get colliders):

- **Turfton City Hall Steps** `city-hall-steps` at (14, -69): `stone-plaque` x1.6, `lectern` x1.4, `capture-flagpole` x1.6, `capture-flagpole` x1.6, `flower-pot` x3, `flower-pot` x3, `bench` x1.5
- **Shelldon's Dumpster Alley** `shelldon-alley` at (-80, 72): `compost-bin` x3, `compost-bin` x3, `veggie-bed` x1.5, `wicker-basket`, `crate`, `crate`
- **The Downtown Slug Paddock** `snail-paddock` at (26, -12): `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `picket-fence` x1.5, `veggie-bed` x1.5, `market-stall` x1.5, `crate`
- **Vesper's Patio Heights gallery** `patio-gallery` at (150, -152): `lobby-pedestal`, `lobby-pedestal`, `lobby-pedestal`, `porcelain-cat`, `golden-remote`, `stopping-stone` x3, `painting` x2, `gsr-gazebo-urn` x1.6, `gsr-topiary-hedge` x1.5, `gsr-topiary-hedge` x1.5, `gsr-topiary-hedge` x1.5, `gsr-topiary-hedge` x1.5
- **Vesper's Putting-Green Country Club** `putting-green` at (198, -198): `capture-flagpole` x1.2, `capture-flagpole` x1.2, `gsr-cafe-table` x1.2, `chair`, `chair`, `bench` x1.5, `lawn-sprinkler` x2, `lawn-sprinkler` x2, `gsr-topiary-hedge` x1.5, `gsr-topiary-hedge` x1.5
- **The Kerbside Exchange, Central Bus Stop** `kerb-exchange` at (-14, 45): `notice-board`, `office-desk`, `chair`, `flower-pot`, `bench` x1.2
- **The Route South Acorn Diner** `south-highway-diner` at (16, 264): `gsr-bldg-acorn-diner` x5, `gsr-roadside-diner-sign` x3, `gsr-cafe-table` x1.2, `chair` x1.4, `chair` x1.4, `gta-vending-cola` x1.4, `signpost` x2
- **Rooster Weatherby's windmill** `rooster-windmill` at (9, 402): `gta-windmill` x5, `water-trough` x2, `hay-bale` x2, `hay-bale` x2, `hay-bale` x2, `lawn-sprinkler` x2, `lawn-sprinkler` x2
- **Cloverfield South Barn** `south-barn` at (30, 446): `barn` x4, `silo` x4, `hay-bale` x2, `hay-bale` x2, `wooden-fence` x2
- **Driftwood's lawn-boat trailer** `driftwood-trailer` at (26, 458): `wooden-cart` x3, `walnut-dinghy` x1.2, `deck-chair` x1.4, `fishing-rod` x2, `tin-pail`
- **88.7 Fescue Public Radio booth** `sorrel-radio-booth` at (-380, 58): `table` x1.4, `gsr-cassette-deck` x1.4, `gsr-boombox` x1.4, `chair` x1.4, `gsr-radio-dish` x1.6, `gsr-tape-bank` x1.4, `crate` x1.6, `crate` x1.6, `crate` x1.6
- **The Overlook safehouse, Dust Flats** `dust-safehouse` at (276, 44): `adobe-hut`, `table` x1.4, `rolled-scroll` x2, `hq-tent` x3, `crate` x1.6, `crate` x1.6, `crate` x1.6, `gta-dew-barrel` x1.4, `gta-dew-barrel` x1.4, `campfire` x2, `team-banner` x1.6
- **The Skyway Foot, the organiser's pitch** `street-skyway-foot` at (-293, -64): 
- **Quai de la Boucle, the closed road** `street-pardonlin` at (-1728, -93): 
- **The Saltbucket Lay-By, the sand pitch** `street-saltbucket` at (979, 141): 
