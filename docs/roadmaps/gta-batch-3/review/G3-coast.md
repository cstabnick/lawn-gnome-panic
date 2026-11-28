# G3 The coast: editorial review, round 1

Editor: G3 (Saltbucket Shore, the Saltwater and the Saltcut, Saltbucket Boardwalk, Long Spoon Pier, the Spokewheel, the
Bathtub Queen and her cabin, tubing and water-skiing, the Saltbucket Lay-By, Dunelow, the coast side quests).
Method: read E11 (roadmap, screens, issues), E26/E31 screen notes, the lore entries for every coast place and person,
`src/coast/*`, `src/tubing/{runtime,view}.ts`, `src/quests/coastQuests.ts`, `src/quests/stages/coast.ts`,
`src/boatTraffic.ts`, `src/living/hamletDunelow.ts`, `src/streetRace/meets.ts`; 29 screenshots with `tools/gta-shots.mjs`
(desktop 960x600, phone 390x844, day and `?time=night`) in [shots/G3/](shots/G3/). Not done by hand: riding the wheel,
skiing behind Driftwood, the quests (the screenshot tool always puts the gnome on the ground, so I took no shots from the
deck).

## Verdict

The writing has the charm: the signs, names and dialogue are funny, and they follow the lore ("It is real. Stop asking.",
"Candyfloss is a vegetable", "Tours at noon. Cargo at midnight."). The world under the writing does not yet feel made
by hand. The boardwalk is a 420 m plank field with six identical empty booths along one edge. The pier does not read as
a spoon, and the Queen does not read as a toy pirate ship. The town has no bucket, no dunes and no marram grass. Two
kilometres of beach are bare. The sea looks like the loch. At night the coast goes dark except for a glowing foam strip.
People sink into the decks or are hidden under them, and Driftwood, Marram and Bilge each wear two or three different
outfits. None of this breaks the fun, but all of it shows. Fix the two blockers (people sunk into or hidden under the
decks) and the high-value polish items (1–14), and the coast will feel like a seaside town.

Severity: **blocker** = visibly broken / wrong in normal play; **polish** = clearly below the hand-crafted bar;
**nit** = small. Type: *craft* (bug, inconsistency, rough edge) or *spirit* (taste, tone, direction: for the decider).

---

### 1. Everyone on the boardwalk walks 22 cm inside the planks — **blocker**, *craft*
- **What:** The deck top is `heightAt + deckLift (0.22)`. Nothing raises the walking height, so the player, ambient
  gnomes (Spun Sugar Sal) and vehicles all stand at `heightAt`. On every boardwalk shot the gnome's boots are cut off by
  the planks.
- **Where:** `src/coast/boardwalk.ts` (`deckTop = y0 + bw.deckLift`), `src/coast/config.ts` `boardwalk.deckLift`,
  `src/ambientGnomes.ts` (poses at `heightAt`). Shots `a02-bwmid`, `a03-bweast`, `b02`–`b04`, `b09-sal` (Sal's hem gone),
  `p01-phone-bw`.
- **Why:** The most-walked surface on the coast looks broken from the first step, on phone as well as desktop.
- **Fix:** Make the deck the ground. Either register the promenade as a walkable rooftop at `deckTop` (as the pier is;
  stairs and ends need a lip players can step up), or flatten the terrain under the rect to `deckTop - 0.3` and set
  `deckLift` to about 0. Check Sal, the vignettes and parked cars afterwards.

### 2. Reel Ruth is buried under the pier spur; deck residents cannot stand on decks — **blocker**, *craft*
- **What:** The angler stands at (232, 1125), inside the spur rect (x 210–304, z 1120–1130), where the deck is at
  y −3.0. Ambient gnomes are posed on the terrain (about y −4.2), so she is under the planks and only her speech bubble
  comes up through the deck. The same limit is why the Queen has no crew on deck, though the lore has one singing at
  noon, and why Captain Bilge stands on the dunes (#4).
- **Where:** `src/coast/life.ts` `COAST_RESIDENTS` (`coast-angler-spur`), `src/ambientGnomes.ts` (`heightAt` only). Shot
  `a06-spur` (bubble, no gnome).
- **Why:** An invisible talking resident. The pier and the ship are the two showpiece decks, and both are empty of
  people.
- **Fix:** Give `AmbientGnomeDef` an optional `y` (or `surface: 'rooftop'` that reads `rooftopAt`). Then put Ruth on the
  handle rail with her rod over the side, put one or two crew on the Queen's deck (a mop, a lookout), and put Marram at
  her hut door at dusk.

### 3. Driftwood, Marram and Bilge each wear 2–3 different outfits; the angler wears Driftwood's — **polish**, *craft*
- **What:**
  - Driftwood: cutscene cast `driftwood` is teal hat and sand shirt. Quest dialogue `DRIFTWOOD_LOOK` is khaki 0x8a7a55
    and 0xb0a07a. The beach resident is a sand hat and a green shirt. **Reel Ruth** wears exactly Driftwood's cast
    colours (0x4f9d92 / 0xd9c79e).
  - Marram: cast and quest have a gold hat, teal shirt, pigtails and no beard. The Spokewheel resident has a blue hat, a
    white shirt, a **grey beard** and glasses (the lore calls her "she").
  - Bilge: cast has a brown shirt. Quest and cabin NPC have a red shirt. The beach resident has a brown shirt.
- **Where:** `src/cutscene/cast.ts` (presets `driftwood`, `marram`, `samphire`), `src/quests/coastQuests.ts` (`*_LOOK`),
  `src/coast/life.ts` `COAST_RESIDENTS`, `src/coast/pirateShip.ts` (`kit.npc` look).
- **Why:** These are named story characters. A player meets "Marram" with a beard at the wheel, then a pigtailed Marram
  in the dialogue card.
- **Fix:** One source of truth: import the cast presets wherever these three appear. Recolour Ruth (and check her
  against the cast list).

### 4. Captain Bilge loiters on the dunes, 100 m from her ship, and is also in her cabin — **polish**, *craft*
- **What:** Resident `coast-captain-bilge` is at (262, 1160), facing west into the dunes. At the same time she is the
  cabin NPC. The stage `coast-pier` and the lore put her at the head of the pier with a chalk board of tour times. There
  is no chalk board.
- **Where:** `src/coast/life.ts`; `src/quests/stages/coast.ts` (`coast-pier` marks).
- **Fix:** Move the resident to (300, 1168), facing up the beach, beside a chalk tour board (`PIRATE TOURS AT NOON` is
  on the bowl now; a second board can sit here). Hide her while the player is in the cabin, or drop the resident and
  keep the deck crew from #2.

### 5. Saltbucket has no bucket, no dunes and no marram grass; the boardwalk sits on mown lawn — **polish**, *spirit*
- **What:** The lore's central image is "a bucket-and-spade town built round a giant sunk Tall-One bucket", "past a
  line of dunes", with motifs "dunes and marram grass". In game the boardwalk is a plank strip laid on bright lawn: the
  lawn runs right up to its north edge and round the Spokewheel. There is no bucket rim anywhere (`grep` finds none), no
  dune grass prefab, and no dune line between the band road and the shore. The m32 and m64 stage notes also promise
  "bleached marram grass".
- **Where:** `src/coast/boardwalk.ts`, terrain theme `south-shore`; shots `a01-entr`, `a04-bwwest`, `a05-wheel`,
  `b02`–`b04`.
- **Why:** The name and the joke of the place are missing. The coast reads as "a pier in a park".
- **Fix:** (a) A landmark: the rim of a giant tin bucket breaking the sand behind the boardwalk, perhaps 40 m across,
  with its handle arching over the coast spur as a gateway ("seen above the sand once, in a dry year"), and a spade
  stuck in a dune beside it. (b) A dune band (z about 1060–1090) with a `marram-grass` tuft prefab and a weathered picket
  fence, as the lore motifs say. (c) Sand (not lawn) under and around the boardwalk and the wheel. This is a direction
  call, so it goes to the decider. Recommended.

### 6. The promenade is a 420 x 46 m empty plank field — **polish**, *craft*
- **What:** Six stalls stand on the north edge. The other 40 m of deck holds only lamps, five benches and three small
  vignettes. The plank texture uses 1.2 m boards with very dark seams, so at eye height it reads as a ploughed field.
- **Where:** `src/coast/boardwalk.ts` (`deckSlabs`, `plankTexture(25, ...)`); shots `a02-bwmid`, `a03-bweast`,
  `p01-phone-bw`.
- **Why:** This is the biggest "unfinished" read on the coast, and the first thing a player sees.
- **Fix:** Fill the middle: a second row of kiosks or rides on the south side (a small carousel, a helter-skelter,
  coin-op telescopes facing the sea, a Punch-and-Judy-style booth), bunting strung between the lamps, bins, a deckchair
  stack, and 4–6 strolling gnomes. Use thinner boards (about 0.3 m) with softer seams. If that is too much, narrow the
  rect to about 24 m and give the freed ground back to sand and dunes (#5).

### 7. The six stalls are one empty booth in six tints — **polish**, *craft*
- **What:** Every stall is `boardwalk-stall` with a tint and a name board. Counters are empty and only Sal has a keeper.
  The lore (`the-boardwalk-stalls.md`) gives each stall its wares, a sign and a keeper: Plank & Pickle's barrel and its
  "Ask about the brine" sign, Scoop & Spade's cones in tin buckets, the Lucky Limpet's shell of fortunes, the ledger
  shelf in Marram's Office, and Tin Shy's sulking keeper.
- **Where:** `src/coast/boardwalk.ts` stall loop; shots `b02-pickle`, `b03-scoop`, `b04-office`.
- **Fix:** Per-stall counter dressing (existing prefabs or new kit pieces), each stall's lore sign, and one keeper gnome
  per stall using the lore lines.

### 8. Long Spoon Pier does not read as a spoon — **polish**, *craft*
- **What:** The handle is a brown plank walkway with a 1.2 m steel strip down the middle. The silver bowl oval can only
  be seen from above, so from the beach it is an ordinary pier.
- **Where:** `src/coast/boardwalk.ts` `buildPier`; shots `a07-pierbeach`, `b01-ship`, `b08-underpier`.
- **Fix:** Make the handle polished silver (the `silver` material already exists), with a raised rim along both edges
  and a rounded handle end coming up out of the sand at the beach (half-buried, as the lore says). Give the bowl a
  visible lip and a slight dish. Keep the planks on the spur only.

### 9. The Bathtub Queen reads as a red box barge, and is dark at night — **polish**, *craft*
- **What:** The 3 m toy prefab, scaled about 16 times, is a flat red box hull with two small sails. From the shore the
  sails are edge-on and grey. The duck figurehead is one yellow ball. There is no flag colour and no lanterns.
- **Where:** `packages/prefabs/src/catalog/gta-coast.ts` `bathtub-queen`, `src/coast/pirateShip.ts`; shots
  `a07-pierbeach`, `b01-ship`, `c02-night-pier`.
- **Fix:** Give it a bath-toy silhouette. Round the bow and stern (bathtub roll-top rim, a plug-chain anchor line).
  Make the sails bigger and slightly billowed, with the skull facing the beach. Add a real duck head (bill and eye), a
  Jolly Roger, and emissive stern windows and lanterns at night. A prefab change, so it is allowed under the prefab
  rule.

### 10. The sea looks like the loch, with streaks that read as sandbars — **polish**, *craft*
- **What:** The Saltwater uses the shared `WATER.colour`/`deepColour` (teal-green), the same as Loch Moss. Across the
  whole sea, pale foam streaks read as beige sand ripples. Close to shore there are sharp-edged tan patches: the sea bed
  shows through the wave troughs on the 0.5 m shelf, because `bodyGain` is 1.6.
- **Where:** `src/config.ts` `WATER` (colour, `bodies['water/saltwater']` shelf 0.5), `src/waterMesh.ts`, `src/waves.ts`;
  shots `a08-beachE`, `a10-beachW`, `a11-headlandE` (streaks), `a07-pierbeach`, `b01-ship` (tan patches).
- **Why:** "The Big Puddle" has to feel like something more than a puddle when the player finally reaches it.
- **Fix:** A per-body colour override (a deeper blue for the Saltwater), white (not beige) crests, and a surf line
  that breaks. Deepen the shelf, or cap trough depth near the shore, so the bed never pokes through.

### 11. The shore foam strip glows at night and is a constant-width ribbon — **polish**, *craft*
- **What:** `foamMat` is a `MeshBasicMaterial`, so it ignores lighting. At night it is a bright blue-white band along
  the whole shore. By day it is a flat, uniform pale ribbon (pale green along the Saltcut).
- **Where:** `src/waterMesh.ts` (`foamMat`); shots `c02-night-pier`, `a12-saltcut`.
- **Fix:** Use a lit material (or dim the colour with sun intensity), and vary width and opacity along the shore. Ideally
  animate a slow wash in and out. This is shared water code, so check the lochs too.

### 12. The seaside is dead at night — **polish**, *craft*
- **What:** The lamp heads glow, but the deck stays black (`lights: false`, no light pools). The Spokewheel, Marram's
  hut lamp ("lit at dusk", per the lore) and the Queen are all unlit.
- **Where:** `src/coast/boardwalk.ts` (lamps), `src/coast/spokewheel.ts`, `src/coast/pirateShip.ts`; shots
  `c01-night-bw`, `c02-night-pier`.
- **Why:** A lit-up seafront and wheel is the classic night picture of a seaside town. Lighting it is cheap with
  emissive bulbs and costs few real lights.
- **Fix:** Emissive bulb strings on the wheel rim and spokes (maybe chasing), bunting bulbs between the lamps,
  light-pool decals under the lamps, an emissive window in Marram's hut after dusk, and lanterns on the Queen.

### 13. Two kilometres of empty beach; the quest and tour spots are bare — **polish**, *craft*
- **What:** All the dressing sits between x −300 and 300. The west strand (`a10-beachW`) and the east end
  (`a11-headlandE`) are bare sand and sea. The treasure X at (−520, 1170) has nothing on it, and neither does the
  Saltcut mouth (770, 1185), stop 3 of the Pirate Tours quest.
- **Where:** `src/coast/boardwalk.ts` beach dressing, `src/coast/life.ts` vignettes, `src/quests/coastQuests.ts`
  (`CHART_X`, `SALTCUT_MOUTH`).
- **Fix:** Add 6–10 small hand-placed beach scenes along the strand: groynes, a rowing boat pulled up, rock pools with
  a crab, windbreaks round a picnic, a shipwreck rib, lifebuoy posts every 150 m, a fisherman's winch, and Dunelow's
  stretch of beach (its deckchair hire). Dress the X and the Saltcut mouth: a marker post, and a tiny lighthouse or
  daymark ("where the Puddle Sea learned to run downhill").

### 14. The Queen's Treasure contradicts itself — **polish**, *craft*
- **What:**
  - Step 1 says "Dig on the western beach". Nothing marks the spot. The toast "Only a boot." appears, but there is no
    boot.
  - Step 2 says "Open the sea chest where Bilge sleeps", and the finale says "Under my own bed, the whole time". The
    chest is at cabin local (3, −2), but the bed is at (−5.6, 2.8), in the opposite corner.
  - The chest spot always says "Not that one. That one is for the tourists." Opening it during the quest therefore
    plays that line and then, at once, "You found it."
- **Where:** `src/quests/coastQuests.ts` (`CHART_X`, steps, done lines), `src/coast/pirateShip.ts` (`treasureLocal`,
  `kit.put('bed')`, the `queen-treasure` spot).
- **Fix:** Add an X decal, a dug hole and a boot prop at `CHART_X`. Move the chest to the foot of or under the bed.
  Play the "tourists" line only when the quest is not on that step.

### 15. Plank & Pickle is Sal's in quest text; Marram's free-ride reward does not exist — **polish**, *craft*
- **What:** "The Wobbly Gondola" sends you to Plank & Pickle with "Sal swears it is a pickle fork", and the toast says
  "Sal looks innocent". Sal runs **Spun Sugar Sal's**, two stalls west. The done line "Ride free, any time" is not
  implemented: `start()` always charges the fare.
- **Where:** `src/quests/coastQuests.ts` lines 86–101, `src/coast/spokewheel.ts` `start()`.
- **Fix:** Name the pickle keeper (a new lore person), or send the player to Sal's ("a candyfloss fork"). Make the wheel
  free after `coast-spokewheel-gondola` is done, or change the line to "Ride on me next time".

### 16. "Tubing the Long Spoon" is nowhere near the Long Spoon — **nit**, *craft*
- **What:** The title and Driftwood's line "a new slalom out past the pier" do not match the course. The slalom runs
  x −380 to −30 at z 1312, west of the boardwalk and 330+ m from the pier (x 300).
- **Where:** `src/quests/coastQuests.ts` (`coast-boardwalk-tubing`), `COAST.slalom`.
- **Fix:** Retitle it (e.g. "The Buoy Run") and change the line to "out past the boardwalk". Keep the course where it
  is: it stays clear of the ship.

### 17. The Spokewheel has no bell, ejects the rider, and has no leg colliders — **polish**, *craft*
- **What:** The signs, Marram, the lore and the stage ("a brass bell on the boarding platform") all say "wait for the
  bell", but there is no bell prop and no bell sound. At the end of a full turn the rider is thrown out
  (`throwPlayer(v, 0, 2, 3)`) instead of stepping off at the platform. The stand legs still have no colliders (a
  deferred item from E11), so cars drive through them. The boarding platform is a bare frame on the lawn.
- **Where:** `src/coast/spokewheel.ts` (`stepRider`, `installSpokewheel`); shots `a05-wheel`, `b05-wheelS`.
- **Fix:** Add a bell prop and ring it at boarding and at the end of the ride (and three times in m43, as the lore
  says). Set the rider down on the platform facing the boardwalk. Add four leg colliders. Dress the platform (rope
  queue posts, Marram's stool, a fare tin).

### 18. The player water-skis sitting down — **polish**, *craft*
- **What:** This was deferred in E11 and is still open. The app seats the driver, so the player's gnome sits on the
  skis while NPC skiers stand.
- **Where:** `src/tubing/runtime.ts`, `src/app.ts` seat pose; E11 roadmap "Deferred".
- **Why:** Water-skiing is the headline coast activity, and sitting on skis looks like a bug.
- **Fix:** A standing pose hook for `tow-ski`: knees bent and arms forward to the handle, lean shown by the hips.

### 19. The Last Tube turns a blank wall and a blank board to the sea — **polish**, *craft*
- **What:** The hut is the stock blue `beach-hut` (the stage says "Driftwood's driftwood hut") and it faces north, so
  from the beach and the water it is a plain blue back wall. The price sign also faces north, so from the beach its
  back is a large grey board. None of the lore notices are placed: "Refunds: stories only", "NO TUBES IN THE BOWL",
  "IF YOU LOSE YOUR HAT, I'LL LOOK FIRST", the driftwood rack tags.
- **Where:** `src/tubing/view.ts` `buildLastTube`; shots `a09-lasttube`, `p03-phone-tube`.
- **Fix:** Turn the hut to face the sea (customers come back from the water) or give it a sea-side hatch. Dress it with
  driftwood planks, nets, oars and a lawn-shark fin on the roof. Use double-sided signs: `coastSign` backs are plain
  boards everywhere, so give them a wood back. Place the lore notices.

### 20. Speech bubbles repeat the sign next to the speaker — **nit**, *craft*
- **What:** Each of these says the sign standing beside it: Marram ("Hat on, hands in, wait for the bell"), Driftwood
  ("Lawn sharks... Mostly grass") and Sal ("Candyfloss is a vegetable"). Meanwhile good lore lines go unused: "Driftwood
  has a hut now. We do not mention the sharks.", "I tow. You hold on.", "Eight acorns for a tube. Eleven if you want it
  to come back with you."
- **Where:** `src/coast/life.ts` `COAST_RESIDENTS`.
- **Fix:** Swap in the unused lore lines, so each joke lands once.

### 21. Several vignettes use the wrong props, so their story does not read — **polish**, *craft*
- **What:**
  - `candyfloss-dropped`: a beach ball, two gulls and a construction cone. There is no candyfloss.
  - `souvenir-crates`: uses `mower-scrap-panel`.
  - `tour-rope-and-a-hat`: a `site-barrier`, building-site tape on a pirate deck.
  - `boots-by-the-bowl`: `court-boots`, which are basketball boots.
- **Where:** `src/coast/life.ts` `COAST_VIGNETTES`.
- **Fix:** A dropped candyfloss on its stick, with gulls fighting over it (add a prefab if needed). The lore's souvenir
  stall: tin hooks, a rubber seagull, "Authentic" hats. A rope stanchion pair. Wellies.

### 22. The lost-property sign and the pile of hats are 20 m apart — **nit**, *craft*
- **What:** The sign is at (155, 1106) by Marram's Office; the hats are at (176–180, 1120).
- **Where:** `src/coast/boardwalk.ts` (LOST PROPERTY sign), `src/coast/life.ts` `lost-property`.
- **Fix:** Pile the hats against the office counter, under the sign.

### 23. Notices from the lore are missing on the pier, the wheel and the beach — **nit**, *craft*
- **What:** These lore notices are not placed: "FISHING FROM THE HANDLE ONLY. THE BOWL IS NOT AVAILABLE.", "PLEASE DO
  NOT STIR", "DO NOT RISE FROM YOUR TEACUP", "Children free. Gulls not.", "THE TOP IS FOR LOOKING. THE BOTTOM IS FOR
  PAYING", "MARRAM'S WHEEL, MARRAM'S RULES", and the tide table on a beach hut with "(approx.)" chalked under each line.
- **Where:** `src/coast/boardwalk.ts`, `src/coast/spokewheel.ts`.
- **Fix:** Place them. They are cheap, already written, and make the place.

### 24. The ambient sound is thin and patchy — **polish**, *craft*
- **What:** Each surf tick picks one of three spots (x −400, 0, 400) at random and plays only if that spot is within
  120 m. Standing at one spot, you hear surf about every 40 s, and gulls about as rarely. The bell plays only near two
  buoys. There is no boardwalk crowd or organ, no wheel creak, no rigging or creak on the ship, and the cabin is
  `ambience: 'silent'`.
- **Where:** `src/coast/life.ts` `installCoastLife` update, `src/coast/pirateShip.ts` (`ambience`).
- **Fix:** A continuous surf bed scaled by distance to `COAST.shoreZ`. A boardwalk murmur loop with a fairground organ
  near the wheel, a wheel creak, rigging and halyard ticks near the Queen, and creaking timbers plus muffled surf in the
  cabin.

### 25. The minimap paints the south band as sand, but the ground is lawn — **nit**, *craft*
- **What:** At the boardwalk entrance and in Dunelow the minimap is beige sand while the 3D ground is bright green
  lawn.
- **Where:** minimap theme for `south-shore`; shots `a01-entr`, `a13-dunelow`.
- **Fix:** Fixed for free by #5 (sand and dunes). Otherwise, make the map lawn-coloured north of the beach.

### 26. The Saltcut is a ruler-straight ditch with nothing at its mouth — **polish**, *craft*
- **What:** A straight 14 m channel with hard, uniform pale banks, no reeds, posts or moorings, and nothing to mark
  where it meets the sea. Pirate Tours makes this a tour stop.
- **Where:** water path `saltcut`; shot `a12-saltcut`; `SALTCUT_MOUTH` (770, 1185).
- **Fix:** A gentle bend or two (keep the bridge), reeds and mooring posts on the banks, and a daymark or small light
  at the mouth with a sign.

### 27. The Saltbucket Lay-By is neither at Saltbucket nor a lay-by — **polish**, *spirit*
- **What:**
  - The meet is at (975, 140) on the East Band, about 1 km from the coast. It sits on open lawn, with no tarmac
    pull-in and no sand drift (`a14-layby`; E26's own notes say "reads sparse").
  - The Saltbucket Dash ends at (150, 975) on the band road and never reaches the sea.
  - The lore says the meet is "on the band road out to the coast" and that the Dash "runs from here to the sea".
- **Where:** `src/streetRace/meets.ts` `saltbucket`, `src/raceTrack/defs/streets.ts` `SALTBUCKET_DASH`,
  `docs/lore/entries/apocrypha/saltbucket-lay-by.md`.
- **Fix:** At minimum, lay a tarmac pull-in pad with sand-drift decals under the meet. Then extend the Dash down the
  coast spur to finish at the boardwalk entrance sign (0, 1072), so it really ends at the sea. Moving the meet itself
  is the decider's call.

### 28. Dunelow prices in pence, and its notice board is unreadable — **nit**, *craft*
- **What:** "DECKCHAIRS HIRE 50p", but the currency everywhere else is Acorns. The village notice puts seven lines on a
  1.3 x 0.8 m plate.
- **Where:** `src/living/hamletDunelow.ts` (around line 162 and line 156).
- **Fix:** Change it to "HIRE 1 ACORN". Split the notice board onto two plates, or cut it to four lines.

### 29. The beach dressing looks stamped — **nit**, *craft*
- **What:**
  - Four identical huts stand in a row.
  - Each umbrella has a deckchair at the same +3/+3 offset and the same yaw (0.3 / 3.3), five times over.
  - Each sandcastle has a bucket-and-spade at the same (+3, +1.5) offset and yaw, four times over.
- **Where:** `src/coast/boardwalk.ts` beach dressing.
- **Fix:** Vary yaw, scale and offset per group, break the hut row (one hut set back, one with its door open and towels
  on a line), and group chairs in pairs and families.

### 30. Sea traffic is inland boats, and the Saltcut cruiser runs at the moored Queen — **polish**, *craft*
- **What:** The Saltwater only has clog cruisers, gravy boats and walnut dinghies, the same as the canal. The lore's
  HOA barges appear only in cutscenes. The Saltcut route ends at (300, 1300), just off the Queen's hull (deck to
  z 1276).
- **Where:** `src/boatTraffic.ts` `allRoutes`.
- **Fix:** End the Saltcut run further out, at about (450, 1330). Add one sea-going silhouette far out: a fishing
  smack, or a distant HOA barge after m44, as a reminder of the story.

### 31. The pier tour step's text and spot disagree; no patrol appears — **nit**, *craft*
- **What:** "A patrol is nosing about the gangplank" fires at (300, 1185), about 70 m up the handle from the gangplank
  (z 1255). The step gives heat 1, but no patrol boat or gnome shows up near the pier to "draw off".
- **Where:** `src/quests/coastQuests.ts` (`coast-bathtub-tours`, step 4).
- **Fix:** Move the spot to the bowl (on the deck) or reword it to "at the foot of the pier". Ideally spawn a Hat Watch
  dinghy alongside the Queen for the step.

### 32. Stale placeholder constant — **nit**, *craft*
- **What:** `COAST_UNLOCK_AFTER = 'ch4-runway-flares'` is still exported with a "placeholder" comment. The real unlocks
  (`quests/unlocks.ts`) use m45 and m46.
- **Where:** `src/coast/config.ts:136`, `src/coast/index.ts`.
- **Fix:** Delete it, or point it at the m45 row, so later epics do not read the wrong beat.

---

## Counts

| Severity | craft | spirit | total |
|---|---|---|---|
| blocker | 2 | 0 | 2 |
| polish | 19 | 2 | 21 |
| nit | 9 | 0 | 9 |
| **total** | 30 | 2 | 32 |

For the decider: **#5** (build the bucket, dunes and marram grass, putting sand under the boardwalk) and **#27** (whether
the Lay-By moves to the coast or just gets a pull-in and a Dash that finishes at the sea).

Keep as they are (the charm): the signs' voice, the wheel turning on `waveTime()` (shared online for free), Driftwood's
tow loop through the gates, the moored-only Queen (R-185), the stall names, and the "Tours at noon. Cargo at midnight."
running joke.
