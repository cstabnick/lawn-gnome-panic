# Gnome Theft Auto: World & Area Lore Gazetteer

> **Companion to:** [story.md](story.md)  
> **Setting:** `apocrypha` ([docs/lore/settings.md](../../lore/settings.md), [R-015](../../lore/rulings.md#r-015), [R-016](../../lore/rulings.md#r-016))  
> **Map Reference:** `games/gnome-theft-auto/src/config.ts` (`WORLD_HALF = 600`, `CITY_HALF = 215`, `ROAD_LINES`, `HIGHWAYS`, `BASE`, `AIRFIELD`)

Every region in *Gnome Theft Auto* is built in four **time layers** (*Long Ago*, *Not Too Distant*, *Recent*, *Unfolding Now*) and four **knowledge tiers** (*Globally Known*, *City/Region-Known*, *Locality-Known*, and *Special-Character / Vibe Lore*—the quiet background gnomes who just exist, 24/7, giving Turfton a pulse).

---

## Part I: Existing Areas (In-Game Today)

### 1. Turfton (The City Grid — `|x| <= 215, |z| <= 215`)
*A 60-unit grid of terracotta-pot high-rises, upside-down bucket towers, and unlocked ride-on mowers.*

- **How It Came To Be:**
  - **Long Ago:** Before the Grid, Turfton was just "The Flat Patch"—a suspiciously level square of clover where early earthenware gnomes stacked discarded garden pots to stay out of the morning dew.
  - **Not Too Distant:** A mysterious, perfectly straight chalk-and-gravel grid (`ROAD_PITCH = 60`) appeared overnight. Nobody saw who laid it. Rather than panic, Turfton gnomes immediately invented **parallel parking** and **real estate speculation**.
  - **Recently:** **The Hat Watch** unionized, **The Gnomecino** opened its neon doors downtown, **The Mulch Club** (`x: -16, z: -30`, block `(-30, -30)`) became **Don Compost**'s silent members-only syndicate headquarters (R-025), and **Vesper Thorne**'s *Thorne Lawn & Order LLC* began buying up corner flowerpots through shell HOAs.
  - **Unfolding Now:** Turf wars between Red/Blue Cap corners have escalated into Black Dew hoarding, HOA foreclosures are spiking, and a certain "gnormal" newcomer just boosted a Ride-On Mower in broad daylight.
- **Knowledge Tiers:**
  - **Globally Known:** *"Nobody in Turfton locks their mower, and nobody ever asks who paved the 60-unit grid."*
  - **City-Known:** Downtown's tallest terracotta tower has a penthouse suite where Vesper Thorne keeps a spotless porcelain tea set—and zero grass.
  - **Locality-Known:** The median at `x: 60, z: -60` is legally "neutral picnic ground," though Red Caps and Blue Caps still throw acorns across it whenever the wind blows east.
  - **Vibe / Background Character — John Bodega & Asphalt (The Cat):**  
    At the corner of `x: -60, z: 60`, **John Bodega** runs *Bodega & Sons (No Sons, Just John)*, a 24-hour corner shop inside an overturned watering can. He wears a faded paper-cup visor and sells lukewarm acorn-cola, spare spark plugs, and single cigarettes made of dried dandelion silk. Sitting on the counter every hour of every day—rain, shine, 3-Hat Watch shootout, or midnight—is **Asphalt**, a small, unbothered clay-dust tabby cat. John has zero main-story quests. However, in at least three late-night story cutscenes (driving past after a heist, fleeing the Watch, or watching the Grand Combine roll in), the camera lingers on his neon-lit window where John is calmly sweeping clay dust while Asphalt bats at a bottlecap.

### 2. The Dust Flats, Fort Sandpit & The Airfield (`x > 215`, East Biome)
*Sun-baked sand, giant plastic buckets the size of warehouses, the Spade Guard's walled sandbox (`BASE`), and the 170-unit Desert Airfield (`AIRFIELD`).*

- **How It Came To Be:**
  - **Long Ago:** A Tall One left a giant wooden sandbox and two house-sized toy buckets in the eastern yard. Generations of gnomes treated the sandpit as a cursed wasteland where glaze peeled off in the dry wind.
  - **Not Too Distant:** The **Spade Guard** marched out of Turfton during the "Great Sprinkler Scare," fortified the sandbox walls (`wallHeight: 3`), and declared **Fort Sandpit** a sovereign military zone. Shortly after, they dragged a rusty **Crop Duster** onto the flattest alkali pan (`x: 480, z: -110`) and called it an Airfield.
  - **Recent:** A Spade Guard tinkerer accidentally inverted a mower's blades and created **The Whirligig**—then got court-martialed for "unauthorized verticality" and the prototype was locked on Pad 1 (`padX: 358, padZ: -8`).
  - **Unfolding Now:** Vesper's HOA shell companies have been quietly buying the Spade Guard's fuel contracts, starving the base of Black Dew right before the player drops in from a stolen Crop Duster.
- **Knowledge Tiers:**
  - **Globally Known:** *"Step past Fort Sandpit's north gate and the Spade Guard sprays first and asks what hat you're wearing never."*
  - **Region-Known:** Pilots at the Desert Airfield swear there's a half-buried, chrome-plated **Old Combine** out in the dunes that hums by itself at 3:00 AM.
  - **Locality-Known:** The sandbag wall on the west side of Fort Sandpit has a loose brick where off-duty guards trade rations for Gnoma's acorn-flour cake.
  - **Vibe / Background Character — Wind-Sock Wally:**  
    An ancient, sun-bleached gnome in a leather aviator cap who sits in a folding lawn chair at the end of the `AIRFIELD` runway (`x: 565, z: -110`) with a pair of binoculars. He never stops you from stealing the Crop Duster. He just logs your takeoff speed on a clipboard, mutters *"Stall speed's 22, kid, don't embarrass yourself,"* and goes back to eating sunflower seeds.

### 3. Mossy Wood (`x < -215`, West Biome)
*Dense pine-needle canopy, towering toadstools, the Unmowed's hidden hollow, and a boarded-up Tall House porch on the far western edge.*

- **How It Came To Be:**
  - **Long Ago:** When **The Unmowed** (Fescue exiles) slipped through a knot-hole in the Fence centuries ago, they settled under the deepest shade where no mower had ever rolled. They planted moss-bridges and swore never to touch an engine.
  - **Not Too Distant:** A rusty van belonging to the **Chapel of Mulch** (*Gnome Company* apocrypha) broke an axle on the `west` highway and was abandoned behind a stand of ferns—becoming a weird roadside shrine for mulch-obsessed squatters.
  - **Recent:** Rumors spread of a **boarded-up Tall House porch** at the far western border where porcelain gnomes occasionally stumble out into the dirt, terrified of lanterns.
  - **Unfolding Now:** Vesper's HOA surveyors have started tagging old-growth toadstools with orange "DEMOLITION PENDING" tape, pushing the peaceful Unmowed toward open sabotage.
- **Knowledge Tiers:**
  - **Globally Known:** *"Mossy Wood is where Fescue gnomes go when they can't stand the sound of a two-stroke engine."*
  - **Region-Known:** Don't follow floating lantern-light near the western tree-line; even Turfton's hardest gangsters turn their mowers around when the birds go quiet.
  - **Locality-Known:** The Unmowed hide spare **Stopping Stone** shards inside hollow acorns along the `west` highway.
  - **Vibe / Background Character — Moss-Watcher Merle:**  
    Sits cross-legged on a giant tree root just off the `west` highway, slowly painting tiny moss landscapes onto pebbles. He greets every passing player—whether they're cruising in a stolen Ride-On or fleeing 3-Hat Watch—with the same serene nod: *"You're in a hurry. The moss isn't."*

### 4. Frostbite Fells (`z < -215`, North Biome)
*Frozen birdbaths, icy pine ridges, black-ice highway hairpins (`north`), and a glowing blue ley-line ramp on the highest peak.*

- **How It Came To Be:**
  - **Long Ago:** A leaky outdoor spigot froze over during a brutal winter, turning the northern slope into permanent permafrost—and trapping a dozen early explorer gnomes' hats in solid ice.
  - **Not Too Distant:** **The Carburettors** discovered that frozen birdbaths make flawless drift-arenas for Zero-Turn Racers, while smugglers realized ice-packed **Black Dew** stays volatile longer.
  - **Recent:** A strange blue crack—an **Aether ley-line** (*Aether Board* nod)—opened on the northernmost ridge, launching anyone who hits it at speed into brief, sparkling zero-gravity.
  - **Unfolding Now:** After the Chapter 3 ambush, Frostbite Fells becomes the protagonist's exile hideout—where Kiln-Resin is harvested to glue Pip back together.
- **Knowledge Tiers:**
  - **Globally Known:** *"Nothing freezes clay faster than Frostbite Fells—chip a boot up there and you'll rattle all the way home."*
  - **Region-Known:** Every Friday at midnight, the Carburettors run an illegal figure-eight drift derby inside the **Frozen Birdbath Basin**.
  - **Locality-Known:** There's an abandoned **Kiln-Resin Shrine** behind the northernmost snowbank that still stays warm enough to melt frost off a hat.
  - **Vibe / Background Character — Thermos Theo:**  
    Stands beside a burning barrel of pine-cones on the `north` highway bend (`x: 40, z: -330`), perpetually pouring steaming acorn-broth into a tin cup that never empties. If you crash your mower into his snowbank, he calmly hands you a cup: *"Roads are slick, friend. Clay's brittle in the cold."*

### 5. Cloverfield Farms (`z > 215`, South Biome)
*Rolling clover pastures, giant pumpkin silos, Granny Gnertrude's farmhouse, Biscuit's Pawprint Crater, and the Southern Drainage Canal.*

- **How It Came To Be:**
  - **Long Ago:** The richest soil in the yard. Early gnomes terraced the clover hills and bred giant, slow-moving snails to haul acorn harvests north to Turfton.
  - **Not Too Distant:** A giant dog named **Biscuit** (*Incregnomtal*) wandered over from the Bare Patch one afternoon, took a single nap in the middle of Cloverfield, and left a 40-unit mud crater (**Biscuit's Nap**) that now yields double-sized acorns.
  - **Recent:** **Granny Gnertrude** turned her innocent-looking farmhouse into the south's premiere Black Dew taproom and illicit parts depot.
  - **Unfolding Now:** HOA "Code Enforcement" convoys are rolling down the `south` highway to seize Cloverfield's Dew-Wells—kicking off Chapter 2's highway blockades.
- **Knowledge Tiers:**
  - **Globally Known:** *"Cloverfield feeds Turfton's stomachs—and fuels half its chop-shops."*
  - **Region-Known:** A castaway gnome named **Driftwood** washed up in the Southern Drainage Canal on a raft made of popsicle sticks, raving about "lawn sharks."
  - **Locality-Known:** Never park a Combine near Granny's prize pumpkins; she has a loaded shotgun and zero sense of humor about squash.
  - **Vibe / Background Character — Fence-Post Frank:**  
    Leans against the `south` highway welcome sign (`x: 0, z: 260`) chewing on a blade of timothy grass, watching traffic pass. He knows every tractor model by the sound of its rattle and will quietly mutter *"That's a stolen rig"* under his breath as you speed past—never snitching, just appreciating the craftsmanship.

---

## Part II: Daily Life, Stakes, Weather & Wildlife

- **Housing & Arrival:** Turfton gnomes live in stacked terracotta pot-apartments downtown, shed lofts, and converted birdbaths. Newcomers either arrive on the *Snail-Coach* through the Fence-Line or—so the rumor goes—step straight out of a *Clay-Mart* garden-centre crate with a fresh coat of glaze and a pre-approved Kiln-Debt.
- **What Gnomes Fear Losing (Non-Lethal Stakes):** Under [R-021–R-024](../../lore/rulings.md#r-021), nobody bleeds—shot gnomes crack into clay shards that sit on the pavement all session, shot mowers explode and char, and a cracked player is picked up by a **Glaze Clinic Ambulance** and glued back together outside the **Glaze Clinic Hospital** (east of the park). Real mob power comes from **acorn liens**, **impounded mowers**, **shattered pride**, and the HOA's ultimate threat: **forced beige re-glazing** (stripping your custom hat/coat colours into regulation uniformity).
- **Day/Night & Rainstorms:** At night, Turfton's neon (*The Gnomecino*, *John Bodega*, *Pay 'n' Glaze*) lights up the grid while street races fire up. When **rain** hits, fired-clay gnomes panic—streets empty, `?drive=sim` roads turn slick, and puddles slow pursuing mowers.
- **Garden Wildlife & Pests (`canon.md`):** Following core canon (*"every pest wants something"*), the outer biomes aren't empty: **burrowing moles** pop up as sudden highway potholes, **acorn-hoarding squirrels** mug unattended pickups in Mossy Wood, **territorial robins** dive-bomb slow Push-Mower Bikes, and **canal frogs** heckle racers in Cloverfield.

---

## Part III: Areas Yet to Exist (Proposed Expansions & Interiors)

> **Terrain Note:** `games/gnome-theft-auto/src/config.ts` currently uses flat `y = 0` ground everywhere. Areas marked *(Requires `world.ts` heightmap)* either need a terrain/elevation pass or can be adapted to `y = 0` (e.g., surface culvert pipes and walled ground-level compounds).

### 6. The Under-Deck (Sub-Turfton Storm Drains) *(Requires `world.ts` heightmap or surface culvert adaptation)*
*A damp, echoing network of corrugated drainpipes and brick culverts running directly beneath Turfton's 60-unit grid.*
- **Origin:** Built by the Tall Ones for rainwater runoff; colonized **Not Too Distantly** by Carburettor smugglers and Fescue tunnelers avoiding Hat Watch patrols. **Recently**, Vesper's crews sealed off the main grates to hide underground power cables feeding **The Grand Combine**.
- **Knowledge Tiers:**
  - **Globally:** *"If you vanish from a 3-Hat chase, you either flew or you went Under-Deck."*
  - **City-Known:** The pipe under `x: 0, z: 0` leads straight to a buried **Tall-One Pencil** the size of a redwood.
  - **Locality-Known:** Damp air makes clay heavy; don't linger without a lantern.
  - **Vibe Character — Silt-Diver Sal:** A gnome in rubber waders and a colander helmet who fishes lost acorns and dropped pistol magazines out of the storm grates with a magnet on a string.

### 7. Patio Heights (Vesper's Gated Flagstone Terrace) *(Requires `world.ts` heightmap or walled `y = 0` slab)*
*An elevated, impeccably swept flagstone plateau overlooking Turfton's northeast corner, walled off by miniature wrought-iron fencing.*
- **Origin:** **Long Ago**, it was a Tall-One patio where dropped sunglasses were worshipped as skylights. **Recently**, Vesper Thorne bought the whole slab, evicted the pigeons, and turned it into **HOA Central**—complete with manicured astro-turf and silent electric golf-carts.
- **Knowledge Tiers:**
  - **Globally:** *"Porcelain gnomes and HOA lawyers live up there; earthenware gnomes only go up to mow it."*
  - **City-Known:** Every brick in Patio Heights is pressure-washed daily at 6:00 AM sharp.
  - **Vibe Character — Gate-Guard Gary:** Stands in a tiny sentry box reading a 900-page HOA binder. If you pull up in a luxury Zero-Turn, he waves you through without looking up; if you're on a smoking Push-Mower Bike, he sighs and reaches for his citation pad.

### 8. The Compost Heap (Industrial Badlands — Turfton / Mossy Wood Border)
*Steaming mounds of mulch, rusted wheelbarrow cranes, and acid-amber Black Dew refineries.*
- **Origin:** **Not Too Distantly**, Turfton's waste had to go somewhere. Entrepreneurial gnomes realized rotting clippings generate heat—and heat distills crude **Black Dew**. **Unfolding Now**, Vesper's lieutenants are using the Heap as a chop-shop to weld armor plates onto the Grand Combine.
- **Knowledge Tiers:**
  - **Globally:** *"You can smell the Compost Heap from Frostbite Fells when the wind shifts."*
  - **Locality-Known:** The steam vents launch lightweight Push-Mower Bikes 20 feet into the air if you hit them at full throttle.
  - **Vibe Character — Ash-Shovel Ernie:** Stands by a glowing mulch furnace roasting chestnuts on a trowel, humming old Fescue work-songs without knowing what the words mean anymore.

### 9. The Greenhouse Strip (Turfton's Neon Botany District)
*A humid, glass-roofed alleyway downtown lit by grow-lamps, home to *The Gnomecino* back-door tables, custom paint bays (**Pay 'n' Glaze**), and exotic fern dealers.*
- **Origin:** Built inside a cracked glass cold-frame **Not Too Distantly**; **Recently** became Turfton's 24-hour nightlife hub where Red Caps, Blue Caps, and off-duty Watch officers call a truce over fermented dandelion wine.
- **Knowledge Tiers:**
  - **City-Known:** *"What happens under the grow-lamps stays under the grow-lamps—unless Big Lou throws you out."*
  - **Locality-Known:** The neon sign above *Pay 'n' Glaze* flickers in Morse code whenever a Hat Watch raid is two blocks away.
  - **Vibe Character — Neon-Moth Nina:** Sits on a flowerpot stoop selling glow-stick hat-bands to late-night racers, forever trying to shoo a giant moth away from the *Gnomecino* sign.

### 10. The Fence-Line Overlook (The World's Edge — `|x|, |z| = 600`)
*A windswept dirt ridge along the outer wooden fence posts where the 1200×1200 map ends.*
- **Origin:** **Long Ago**, the Fence was the edge of the known universe—what Fescue's histories call the boundary between lawns. **Recently**, Pip and Tansy used a knot-hole near the southwest post to smuggle Fescue relics into Turfton. **Unfolding Now**, cracks in the boards show blurry, impossibly huge shapes moving in the yard next door.
- **Knowledge Tiers:**
  - **Globally:** *"Don't drive past the Fence-Line. There's nothing out there but the Neighbour's Lawn."*
  - **Locality-Known:** Every few nights, you can hear a distant, muffled *thrum* from beyond the boards—like a Mower ten times the size of Turfton's.
  - **Vibe Character — Knot-Hole Nora:** Sits on an overturned thimble beside the western fence, staring through a knot-hole with a brass spyglass. She never says what she sees, only: *"They've got pink flamingos over there. Huge ones. Don't tell Turfton."*
