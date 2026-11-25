# DayG — Mossgrave Environmental Lore & World Expansion

Written in Mossgrave canon (`docs/lore/entries/apocrypha/mossgrave.md`):
- **Scale**: 1 Tall metre = 11 gm. A Tall One cemetery, ~1.45 km across, seen at gnome height.
- **Eras**: *The Long Quiet* (pre-breakout tending of Tall One graves) → *The Greying* (first autumn-to-spring moss bloom, the Pile waking, Bell Night) → *The Scatter* (the Shed fire, broken factions) → *The Holding* (the seven havens, the Truce of the Tap, Verge traders returning) → *Now* (Spring of Year 3).
- **Material culture**: Clay, glaze, limestone, rusted iron railings, acorns as currency, chalk tallies, candle wax, and scavenged Tall One garden hardware.

---

## Section 1: 26 Unique Landmark Buildings & Structures (`packages/prefabs/src/catalog/dayg-buildings.ts`)

Each structure is a full `@lawn/prefabs` architectural `PrefabDef` with a solid `footprint`, placed across Mossgrave's 12 slice regions (and mirrored into full-map districts), offering both visual identity and survival interactions.

| # | Prefab ID | Name | Region | Role | Pre-Breakout Purpose & Post-Breakout Adaptation |
|---|---|---|---|---|---|
| 1 | `dayg-greenhouse-ruin` | Shattered Glasshouse | `ornament-lawn` / `forecourt` | `apothecary` | Pre-breakout: A Tall One cloche-frame glasshouse where winter herbs were forced. Post-breakout: Half its panes are gone, but mossy benches still sprout medicinal sage and feverfew. |
| 2 | `dayg-bell-belfry` | Little Bell Belfry | `angel-square` | `monument` | Pre-breakout: A bronze-capped garden bell-frame rung at closing time. Post-breakout: Its clapper was lashed silent with twine after Bell Night; scouts use its stone base as a rendezvous cairn. |
| 3 | `dayg-caretaker-cottage` | Caretaker's Tool Cottage | `masons-corner` | `shelter` | Pre-breakout: Brick-and-slate lodge for the groundskeeper's tea kettle and ledger. Post-breakout: Barred shutters and a dry hearth make it a prized warm refuge during rainstorms. |
| 4 | `dayg-columbarium-alcove` | Urn-Wall Alcove | `leaning-rows` | `shelter` | Pre-breakout: Recessed limestone niches holding brass memorial urns. Post-breakout: Survivors wedged cedar planks across the arch to create a dry sleeping shelf above Hatless reach. |
| 5 | `dayg-stone-wellhouse` | Roofed Stone Wellhouse | `the-tap` | `water` | Pre-breakout: Deep stone well with a shingled hood feeding the yew hedges. Post-breakout: Maintained under the Truce of the Tap; its oak bucket still draws cold, unclouded water. |
| 6 | `dayg-tool-shack` | Timber Tool Shack | `bin-corner` | `workshop` | Pre-breakout: Cedar shed storing spades, twine, and whetstones. Post-breakout: A Shelf Wright outpost with a bolted vice where gnomes grind chipped trowels back to an edge. |
| 7 | `dayg-quarantine-booth` | Chalk-Marked Sentry Booth | `verge-path` | `apothecary` | Pre-breakout: Ticket and flower-check booth beside the outer railings. Post-breakout: Turned into a Verge-entry inspection box where traders scrub moss dust off their boots. |
| 8 | `dayg-kiln-oven` | Clay-Patch Kiln | `masons-corner` | `workshop` | Pre-breakout: Groundskeeper's brick incinerator for dry leaves and cracked pots. Post-breakout: Fired with twigs to bake pitch-wax over hairline cracks in survivor glaze. |
| 9 | `dayg-water-tower` | Stilted Cistern Tower | `the-sinks` | `water` | Pre-breakout: Elevated timber tank supplying pressure to the lower standpipes. Post-breakout: Its copper tap drips clean rainwater high above the flooded basin. |
| 10 | `dayg-radio-shack` | Root-Wire Radio Shack | `gate-roof` | `radio` | Pre-breakout: Brick cable-junction hut for the cemetery floodlights. Post-breakout: Copper coils rigged to the iron railings let survivors scan Mossgrave FM and locate supply drops. |
| 11 | `dayg-watch-bunker` | Sandbagged Watch Bunker | `forecourt` | `shelter` | Pre-breakout: Low limestone storm-cellar entrance. Post-breakout: Stacked with burlap sandbags and iron slit-shutters to hold the Forecourt approach. |
| 12 | `dayg-gate-archway` | Iron Lychgate Arch | `verge-path` | `monument` | Pre-breakout: Twin stone piers supporting the wrought-iron Verge entrance. Post-breakout: Marked with trader chalk-sigils showing which days the Verge road is clear. |
| 13 | `dayg-mausoleum-crypt` | Moss-Capped Crypt | `child-graves` | `monument` | Pre-breakout: Pedimented family vault of weathered granite. Post-breakout: Its bronze doors are wedged shut from the outside; flowers still appear on the step every dawn. |
| 14 | `dayg-covered-bridge` | Plank Footbridge | `the-sinks` | `shelter` | Pre-breakout: Arched cedar span crossing a drainage gulley. Post-breakout: Side-planks nailed high turn the span into a windbreak above the damp sinkhole mist. |
| 15 | `dayg-garden-gazebo` | Octagon Garden Gazebo | `angel-square` | `monument` | Pre-breakout: Whitewashed lattice pavilion for summer memorial recitals. Post-breakout: A neutral parley ring where rival factions trade acorns without drawing trowels. |
| 16 | `dayg-compost-silo` | Slatted Compost Silo | `bin-corner` | `workshop` | Pre-breakout: Tall slatted oak bin steaming with grass clippings. Post-breakout: Scavengers pry rusted nails and dry kindling from its sheltered leeward frame. |
| 17 | `dayg-funeral-pavilion` | Slate Canopy Pavilion | `leaning-rows` | `shelter` | Pre-breakout: Open-sided slate canopy sheltering mourners from autumn drizzle. Post-breakout: Canvas tarps lashed between its posts keep a campfire dry in heavy storms. |
| 18 | `dayg-survivor-lean-to` | Salvage Lean-To | `ivy-rows` | `shelter` | Pre-breakout: Did not exist. Post-breakout: Slanted corrugated tin and headstone-propped beams built during the Scatter by runners fleeing the Ivy Rows. |
| 19 | `dayg-signal-pylon` | Lantern Signal Pylon | `yew-edge` | `radio` | Pre-breakout: Tall iron lamp-standard at the yew avenue bend. Post-breakout: Retrofitted with brass reflector dishes and a hand-crank beacon to warn of Hatless surges. |
| 20 | `dayg-rain-cistern` | Copper-Hoop Rain Cistern | `ivy-rows` | `water` | Pre-breakout: Terracotta catchment barrel set beneath a chapel gutter. Post-breakout: Fitted with a cloth charcoal filter so runners can refill canteens mid-patrol. |
| 21 | `dayg-apothecary-stall` | Moss-Herb Apothecary Stall | `yew-edge` | `apothecary` | Pre-breakout: Wooden flower-seller's cart parked beside the yew hedge. Post-breakout: Hung with dried yarrow, salt-pouches, and boiled glaze-salve jars. |
| 22 | `dayg-tinker-garage` | Tinker's Axle Bay | `forecourt` | `workshop` | Pre-breakout: Gravel-floored handcart repair bay near the forecourt gate. Post-breakout: Equipped with jack-blocks, oil tins, and spare belts for franken-vehicle builders. |
| 23 | `dayg-soup-kitchen-tent` | Hearth-Canvas Broth Tent | `the-tap` | `ration` | Pre-breakout: Grounds-crew tea marquee. Post-breakout: Simmers nettle-and-acorn broth over an iron brazier for any gnome who brings dry twigs. |
| 24 | `dayg-barricaded-chapel` | Boarded Side-Chapel | `angel-square` | `ration` | Pre-breakout: Small limestone side-oratory for quiet vigils. Post-breakout: Pews stacked across the stained glass; inside, a tin ration locker still holds emergency biscuits. |
| 25 | `dayg-clock-obelisk` | Sundial Clock Obelisk | `child-graves` | `monument` | Pre-breakout: Tall limestone gnomon shaft marking the cemetery hours. Post-breakout: Its brass shadow-plate is scratched with survivors' birthdays and days-since-the-Greying. |
| 26 | `dayg-bone-ossuary` | Chalk-Stone Ossuary | `the-sinks` | `monument` | Pre-breakout: Low vaulted stone alcove storing cleared Victorian kerbs. Post-breakout: Gnomes lay fallen hats along its ledge as a silent roll call of the lost. |

---

## Section 2: 26 New Environmental Storytelling Moments (`packages/prefabs/src/catalog/dayg-story-props.ts`)

Combined with the original 16 vignettes, Mossgrave now holds **42 inspectable lore moments**, each rendered as a bespoke `@lawn/prefabs` diorama with era badge, named author, narrative note, and optional clue/acorn reward.

1. **`dayg-story-hearse-cart` — *The Last Flower-Hearse*** (`pre-breakout`, `forecourt`, Author: *Carriage-Master Bram*)
   - **Scene**: An overturned oak handcart with one spoked wheel snapped and spilled terracotta pots.
   - **Note**: *"Oct 19 — Axle sheared on the Forecourt cobbles. Left three crates of autumn chrysanthemums by the plinth; the new clay batch smells strangely sweet, like wet cellar brick."*
   - **Clue**: Check the Forecourt sandbag bunker for left-behind glaze sealants.

2. **`dayg-story-chalk-wall` — *Thirty-One Tally Marks*** (`post-breakout`, `gate-roof`, Author: *Watch-Captain Pip*)
   - **Scene**: A weathered limestone slab scarred with white chalk strokes and a stubby chalk stick.
   - **Note**: *"Day 31 of the Holding — Counted forty-two Hatless circling the outer arch at dusk. None climbed the ironwork while the oil lamp stayed shuttered."*
   - **Clue**: Shuttered lanterns keep the Verge Path quiet after 22:00.

3. **`dayg-story-picnic` — *Unfinished Harvest Spread*** (`pre-breakout`, `verge-path`, Author: *Auntie Marrow*)
   - **Scene**: A gingham cloth weighted by four stones, a chipped teapot, and two half-eaten seed cakes.
   - **Note**: *"Left the kettle cooling while we ran to hear the Bell Chapel rehearsal. Whoever finds the spare thimble-cups, please return them to the Tap before frost."*

4. **`dayg-story-last-stand` — *The Sandbag Breach*** (`post-breakout`, `bin-corner`, Author: *Corporal Thistle*)
   - **Scene**: Slumped sandbags, a snapped trowel blade wedged in timber, and scattered iron nails.
   - **Note**: *"They pushed right over the compost rail when the rain softened the mud. Dropped my spare pouch behind the silo—if you're reading this, take the nails and run north."*
   - **Clue**: Spare nails and timber can be salvaged at the Compost Silo.

5. **`dayg-story-kiln-stack` — *Cracked Seconds Stack*** (`pre-breakout`, `masons-corner`, Author: *Kiln-Master Orin*)
   - **Scene**: Three warped clay flowerpots stacked beside a soot-blackened brick tray.
   - **Note**: *"Batch 14 came out porous again. Told the Yard Council twice: unglazed clay drinks groundwater like a sponge. If the moss reaches these, they'll split by November."*

6. **`dayg-story-evac-luggage` — *Tied-Up Tin Trunks*** (`post-breakout`, `verge-path`, Author: *Trader Lyra*)
   - **Scene**: Two strapped canvas packs and a dented tin suitcase abandoned beside the Verge kerb.
   - **Note**: *"Gate closed early during the Scatter. Left the heavy lead weights behind so our cart could clear the ditch. Meet at the Lychgate Arch on the third bell."*

7. **`dayg-story-candle-ring` — *The Vigil of Seven Wicks*** (`post-breakout`, `child-graves`, Author: *Sister Wren*)
   - **Scene**: Seven beeswax stubs arranged in a stone ring around an empty pointed hat.
   - **Note**: *"For the seven who stayed at the Sinks to hold the sluice gate. Someone still replaces the candles before dawn—no footprints in the moss, only fresh petal dust."*

8. **`dayg-story-rope-cache` — *Knotted Hedge-Rope Coil*** (`post-breakout`, `ivy-rows`, Author: *Climber Finch*)
   - **Scene**: A damp hemp coil looped around an iron stake with a brass carabiner hook.
   - **Note**: *"Hid forty feet of dry hemp under the ivy overhang. If the Hatless pack the lower lane, hook the high kerb and haul up to the Columbarium shelf."*
   - **Clue**: High kerbs break Hatless line-of-sight in the Ivy Rows.

9. **`dayg-story-radio-bench` — *101.7 FM Bench*** (`post-breakout`, `the-tap`, Author: *Sparks Hollis*)
   - **Scene**: A splintered wooden bench holding a copper-coil crystal set and headphones.
   - **Note**: *"Picked up a clear voice from under the oak roots at 03:00! Not static—someone reading weather reports and old garden songs. Keep tuning past the hum."*

10. **`dayg-story-statue-plinth` — *Missing Cherub Plinth*** (`pre-breakout`, `angel-square`, Author: *Mason Vane*)
    - **Scene**: A carved limestone pedestal topped only by two snapped stone ankles and chisel dust.
    - **Note**: *"Order #88: Cherub removed for winter lime-wash. Found green veins threading deep inside the pedestal seam—far older than last autumn's damp."*

11. **`dayg-story-warning-post` — *Painted Hatless Signpost*** (`post-breakout`, `leaning-rows`, Author: *Scout Kestrel*)
    - **Scene**: A crooked timber post nailed with three arrows and a smeared red hat-sigil.
    - **Note**: *"EAST: THE TAP (CLEAN WATER). WEST: THE SINKS (FLOODED—STAY HIGH). If the red cloth is missing from this post, do not enter the Leaning Rows alone."*

12. **`dayg-story-rain-rig` — *Gutter Funnel Contraption*** (`post-breakout`, `ivy-rows`, Author: *Tinker Moss*)
    - **Scene**: A tilted tin funnel feeding an oak keg through a cloth-wrapped copper pipe.
    - **Note**: *"Boil everything from the Sinks, but anything caught off clean slate roofs is sweet enough to drink straight. Wipe the moss off the mesh every Tuesday."*

13. **`dayg-story-scaffolding` — *Half-Struck Limewash Scaffold*** (`pre-breakout`, `masons-corner`, Author: *Apprentice Cob*)
    - **Scene**: Two lashed cedar poles, a swaying plank catwalk, and a dried lime-bucket.
    - **Note**: *"Master Vane called us down early when the mist rolled in at noon. Funny—the birds went dead quiet twenty minutes before the first Bell."*

14. **`dayg-story-herb-planter` — *Apothecary's Cold Frame*** (`pre-breakout`, `yew-edge`, Author: *Herbalist Rue*)
    - **Scene**: A cedar box-planter with propped glass lid, mossy soil, and copper plant tags.
    - **Note**: *"Yarrow, feverfew, and crushed charcoal slow clay-rot better than any Tall One varnish. Keep a pot on your belt if you work the wet basins."*
    - **Clue**: Visit the Apothecary Stall along Yew Edge for fresh moss-rot salve.

15. **`dayg-story-ration-stack` — *Marked Ration Crates*** (`post-breakout`, `forecourt`, Author: *Quartermaster Oats*)
    - **Scene**: Stenciled pine crates bound with iron strapping and an open crowbar resting atop.
    - **Note**: *"Half the acorn-flour tins went mouldy in the cellar damp. Salvaged six good biscuit packs for the Watch Bunker—leave one behind if you aren't starving."*

16. **`dayg-story-lantern-shrine` — *Hollow-Trunk Lamp Niche*** (`post-breakout`, `yew-edge`, Author: *Lamplighter Bell*)
    - **Scene**: A mossy stone arch housing a brass storm lantern and three spare glass chimneys.
    - **Note**: *"Lit at dusk for anyone lost in the Yew Walk fog. If the flame burns green instead of amber, back away slowly—the Hatless are breathing near the hedge."*

17. **`dayg-story-fallen-bell` — *Cracked Bronze Bell Cradle*** (`post-breakout`, `angel-square`, Author: *Belfry-Keeper Sol*)
    - **Scene**: A heavy green-patina bronze bell resting crookedly in shattered oak beams.
    - **Note**: *"Dropped her intentionally on Bell Night so nobody could ring the whole cemetery awake again. The bronze still hums when thunder rolls over Mossgrave."*

18. **`dayg-story-sunken-boat` — *Half-Swamped Cedar Skiff*** (`post-breakout`, `the-sinks`, Author: *Willow-Fisher Reed*)
    - **Scene**: A weathered wooden skiff nose-down in silt with a single snapped oar across the thwart.
    - **Note**: *"Tried poling across the Sinks after the October storm. Something bumped the keel from below—not a log, and it wore a chipped garden hat."*

19. **`dayg-story-quarantine-tape` — *Red-Cloth Boundary Stake*** (`post-breakout`, `bin-corner`, Author: *Warden Briar*)
    - **Scene**: Two iron pickets linked by frayed crimson cloth strips and a chalked warning board.
    - **Note**: *"Bin Corner compost warmth keeps the Hatless sluggish by day and frantic by night. Cross only with a lit torch or a sharp sprint."*

20. **`dayg-story-gravedigger-barrow` — *Rusted Iron Wheelbarrow*** (`pre-breakout`, `leaning-rows`, Author: *Sexton Grubb*)
    - **Scene**: A heavy iron barrow tipped sideways, spilling dark loam and a brass pocket-compass.
    - **Note**: *"Found three ceramic gnomes standing upright in Row 9 where nobody placed them. Locked the tool shack early and went home—let the morning shift sort it out."*

21. **`dayg-story-map-table` — *Chalked Slate Survey Table*** (`post-breakout`, `gate-roof`, Author: *Cartographer Quill*)
    - **Scene**: A flat slate slab on trestles etched with Mossgrave districts and pebble markers.
    - **Note**: *"White pebbles mark clean taps; black pebbles mark Hatless nests. Updated every third sunrise by whoever returns from the Lawn Section alive."*

22. **`dayg-story-herb-rack` — *Willow-Twine Drying Rack*** (`post-breakout`, `the-tap`, Author: *Cook Nettle*)
    - **Scene**: An A-frame cedar rack hung with bundled sage, garlic braids, and tin mugs.
    - **Note**: *"Boiled rainwater plus dried sage keeps the winter shakes away. Trade two bundles of dry twigs at the Soup Tent for a hot bowl."*

23. **`dayg-story-mower-wreck` — *Seized Brass Hand-Mower*** (`pre-breakout`, `forecourt`, Author: *Mechanic Sprocket*)
    - **Scene**: A rusted reel-mower wedged against a kerbstone with its drive chain hanging loose.
    - **Note**: *"Blade jammed on an iron grave-marker. Left it for parts—someone with a wrench could pull a decent drive belt and two bearings off the axle."*
    - **Clue**: Vehicle tinkerers can salvage parts from wrecks like this for Franken-Builds.

24. **`dayg-story-shard-pile` — *Glazed Porcelain Cairn*** (`post-breakout`, `child-graves`, Author: *Mender Clay*)
    - **Scene**: A neat pyramid of cobalt and terracotta shards topped with a single intact brass button.
    - **Note**: *"We gather every unbroken piece we find in the grass. Even a shattered gnome deserves a cairn where the moss cannot swallow the glaze."*

25. **`dayg-story-bonfire-cairn` — *Ashes of the Scatter*** (`post-breakout`, `leaning-rows`, Author: *Runner Ash*)
    - **Scene**: Charred timber ends, blackened stones, and a melted pewter mug in cold grey ash.
    - **Note**: *"Fourteen strangers shared one fire here the night the Shed burned. By morning, half went to the Tap and half vanished into the fog."*

26. **`dayg-story-pigeon-coop` — *Lofted Messenger Coop*** (`post-breakout`, `the-tap`, Author: *Keeper Lark*)
    - **Scene**: A slatted pine birdhouse on stilts with a tiny landing perch and rolled paper tubes.
    - **Note**: *"The sparrows still carry rolled notes between the Tap and the Columbarium when the ground lanes are choked. Leave a pinch of seed on the sill."*
