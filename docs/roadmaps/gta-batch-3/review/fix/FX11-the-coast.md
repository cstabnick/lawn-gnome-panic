# FX11 The coast: the bucket, dunes and sand, the boardwalk, pier, wheel, Queen and beach
Wave: 4 · Depends on: FX01, FX06 · Kind: Fix (content)
Findings: 24 (G3#4, G3#5, G3#6, G3#7, G3#8, G3#9, G3#12, G3#13, G3#14, G3#15, G3#16, G3#17, G3#18, G3#19, G3#20, G3#21, G3#22, G3#23, G3#24, G3#26, G3#29, G3#30, G3#31, G3#32) · Decisions: D14, D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Saltbucket is a bucket-and-spade town (D14): the giant bucket rim and handle gateway, a dune band with marram grass, sand under the boardwalk, a narrower dressed promenade, stalls with keepers, a spoon-shaped pier, a bath-toy Queen, a lit seaside at night, beach scenes along the strand, and quests that match their places.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- coast/** (boardwalk.ts, life.ts, spokewheel.ts, pirateShip.ts, sign.ts, config.ts, index.ts)
- quests/coastQuests.ts (side quests), quests/stages/coast.ts
- tubing/view.ts, tubing/runtime.ts (ski pose; the seat-pose hook in app.ts, one branch)
- boatTraffic.ts (sea routes)
- the Saltcut water path, terrain theme `south-shore` paint
- packages/prefabs/src/catalog/gta-coast.ts (`giant-bucket-rim`, `marram-grass`, `bathtub-queen`, pier, stalls)
- docs/lore coast entries

### Findings (24)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G3#4** (polish, craft · **should**) Captain Bilge loiters on the dunes, 100 m from her ship, and is also in her cabin
  - What: Resident `coast-captain-bilge` is at (262, 1160), facing west into the dunes. At the same time she is the cabin NPC. The stage `coast-pier` and the lore put her at the head of the pier with a chalk board of tour times. There is no chalk board.
  - Where: `src/coast/life.ts`; `src/quests/stages/coast.ts` (`coast-pier` marks).
  - Editor's fix: Move the resident to (300, 1168), facing up the beach, beside a chalk tour board (`PIRATE TOURS AT NOON` is on the bowl now; a second board can sit here). Hide her while the player is in the cabin, or drop the resident and keep the deck crew from #2.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#5** (polish, spirit · **must**, D14) Saltbucket has no bucket, no dunes and no marram grass; the boardwalk sits on mown lawn
  - What: The lore's central image is "a bucket-and-spade town built round a giant sunk Tall-One bucket", "past a line of dunes", with motifs "dunes and marram grass". In game the boardwalk is a plank strip laid on bright lawn: the lawn runs right up to its north edge …
  - Where: `src/coast/boardwalk.ts`, terrain theme `south-shore`; shots `a01-entr`, `a04-bwwest`, `a05-wheel`, `b02`–`b04`.
  - Editor's fix: (a) A landmark: the rim of a giant tin bucket breaking the sand behind the boardwalk, perhaps 40 m across, with its handle arching over the coast spur as a gateway ("seen above the sand once, in a dry year"), and a spade stuck in a dune beside it. (b) A dune band (z about 1060–1090) with a `marram-grass` tuft prefab and a weathered picket fence, as the lore motifs say. (c) Sand (not lawn) under and around the …
  - Decision: D14 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G3/`: `a01-entr`, `a04-bwwest`, `a05-wheel`, `b02`, `b04`
- **G3#6** (polish, craft · **must**, D14) The promenade is a 420 x 46 m empty plank field
  - What: Six stalls stand on the north edge. The other 40 m of deck holds only lamps, five benches and three small vignettes. The plank texture uses 1.2 m boards with very dark seams, so at eye height it reads as a ploughed field.
  - Where: `src/coast/boardwalk.ts` (`deckSlabs`, `plankTexture(25, ...)`); shots `a02-bwmid`, `a03-bweast`, `p01-phone-bw`.
  - Editor's fix: Fill the middle: a second row of kiosks or rides on the south side (a small carousel, a helter-skelter, coin-op telescopes facing the sea, a Punch-and-Judy-style booth), bunting strung between the lamps, bins, a deckchair stack, and 4–6 strolling gnomes. Use thinner boards (about 0.3 m) with softer seams. If that is too much, narrow the rect to about 24 m and give the freed ground back to sand and dunes (#5).
  - Decision: D14 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G3/`: `a02-bwmid`, `a03-bweast`, `p01-phone-bw`
- **G3#7** (polish, craft · **should**) The six stalls are one empty booth in six tints
  - What: Every stall is `boardwalk-stall` with a tint and a name board. Counters are empty and only Sal has a keeper. The lore (`the-boardwalk-stalls.md`) gives each stall its wares, a sign and a keeper: Plank & Pickle's barrel and its "Ask about the brine" sign …
  - Where: `src/coast/boardwalk.ts` stall loop; shots `b02-pickle`, `b03-scoop`, `b04-office`.
  - Editor's fix: Per-stall counter dressing (existing prefabs or new kit pieces), each stall's lore sign, and one keeper gnome per stall using the lore lines.
  - Re-check: `review/shots/G3/`: `b02-pickle`, `b03-scoop`, `b04-office`
- **G3#8** (polish, craft · **should**) Long Spoon Pier does not read as a spoon
  - What: The handle is a brown plank walkway with a 1.2 m steel strip down the middle. The silver bowl oval can only be seen from above, so from the beach it is an ordinary pier.
  - Where: `src/coast/boardwalk.ts` `buildPier`; shots `a07-pierbeach`, `b01-ship`, `b08-underpier`.
  - Editor's fix: Make the handle polished silver (the `silver` material already exists), with a raised rim along both edges and a rounded handle end coming up out of the sand at the beach (half-buried, as the lore says). Give the bowl a visible lip and a slight dish. Keep the planks on the spur only.
  - Re-check: `review/shots/G3/`: `a07-pierbeach`, `b01-ship`, `b08-underpier`
- **G3#9** (polish, craft · **should**) The Bathtub Queen reads as a red box barge, and is dark at night
  - What: The 3 m toy prefab, scaled about 16 times, is a flat red box hull with two small sails. From the shore the sails are edge-on and grey. The duck figurehead is one yellow ball. There is no flag colour and no lanterns.
  - Where: `packages/prefabs/src/catalog/gta-coast.ts` `bathtub-queen`, `src/coast/pirateShip.ts`; shots `a07-pierbeach`, `b01-ship`, `c02-night-pier`.
  - Editor's fix: Give it a bath-toy silhouette. Round the bow and stern (bathtub roll-top rim, a plug-chain anchor line). Make the sails bigger and slightly billowed, with the skull facing the beach. Add a real duck head (bill and eye), a Jolly Roger, and emissive stern windows and lanterns at night. A prefab change, so it is allowed under the prefab rule.
  - Re-check: `review/shots/G3/`: `a07-pierbeach`, `b01-ship`, `c02-night-pier`
- **G3#12** (polish, craft · **should**) The seaside is dead at night
  - What: The lamp heads glow, but the deck stays black (`lights: false`, no light pools). The Spokewheel, Marram's hut lamp ("lit at dusk", per the lore) and the Queen are all unlit.
  - Where: `src/coast/boardwalk.ts` (lamps), `src/coast/spokewheel.ts`, `src/coast/pirateShip.ts`; shots `c01-night-bw`, `c02-night-pier`.
  - Editor's fix: Emissive bulb strings on the wheel rim and spokes (maybe chasing), bunting bulbs between the lamps, light-pool decals under the lamps, an emissive window in Marram's hut after dusk, and lanterns on the Queen.
  - Re-check: `review/shots/G3/`: `c01-night-bw`, `c02-night-pier`
- **G3#13** (polish, craft · **should**) Two kilometres of empty beach; the quest and tour spots are bare
  - What: All the dressing sits between x −300 and 300. The west strand (`a10-beachW`) and the east end (`a11-headlandE`) are bare sand and sea. The treasure X at (−520, 1170) has nothing on it, and neither does the Saltcut mouth (770, 1185), stop 3 of the Pirate Tours …
  - Where: `src/coast/boardwalk.ts` beach dressing, `src/coast/life.ts` vignettes, `src/quests/coastQuests.ts` (`CHART_X`, `SALTCUT_MOUTH`).
  - Editor's fix: Add 6–10 small hand-placed beach scenes along the strand: groynes, a rowing boat pulled up, rock pools with a crab, windbreaks round a picnic, a shipwreck rib, lifebuoy posts every 150 m, a fisherman's winch, and Dunelow's stretch of beach (its deckchair hire). Dress the X and the Saltcut mouth: a marker post, and a tiny lighthouse or daymark ("where the Puddle Sea learned to run downhill").
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#14** (polish, craft · **should**) The Queen's Treasure contradicts itself
  - What: - Step 1 says "Dig on the western beach". Nothing marks the spot. The toast "Only a boot." appears, but there is no boot. - Step 2 says "Open the sea chest where Bilge sleeps", and the finale says "Under my own bed, the whole time". The chest is at cabin …
  - Where: `src/quests/coastQuests.ts` (`CHART_X`, steps, done lines), `src/coast/pirateShip.ts` (`treasureLocal`, `kit.put('bed')`, the `queen-treasure` spot).
  - Editor's fix: Add an X decal, a dug hole and a boot prop at `CHART_X`. Move the chest to the foot of or under the bed. Play the "tourists" line only when the quest is not on that step.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#15** (polish, craft · **should**) Plank & Pickle is Sal's in quest text; Marram's free-ride reward does not exist
  - What: "The Wobbly Gondola" sends you to Plank & Pickle with "Sal swears it is a pickle fork", and the toast says "Sal looks innocent". Sal runs **Spun Sugar Sal's**, two stalls west. The done line "Ride free, any time" is not implemented: `start()` always charges …
  - Where: `src/quests/coastQuests.ts` lines 86–101, `src/coast/spokewheel.ts` `start()`.
  - Editor's fix: Name the pickle keeper (a new lore person), or send the player to Sal's ("a candyfloss fork"). Make the wheel free after `coast-spokewheel-gondola` is done, or change the line to "Ride on me next time".
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#16** (nit, craft · **could**) "Tubing the Long Spoon" is nowhere near the Long Spoon
  - What: The title and Driftwood's line "a new slalom out past the pier" do not match the course. The slalom runs x −380 to −30 at z 1312, west of the boardwalk and 330+ m from the pier (x 300).
  - Where: `src/quests/coastQuests.ts` (`coast-boardwalk-tubing`), `COAST.slalom`.
  - Editor's fix: Retitle it (e.g. "The Buoy Run") and change the line to "out past the boardwalk". Keep the course where it is: it stays clear of the ship.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#17** (polish, craft · **should**) The Spokewheel has no bell, ejects the rider, and has no leg colliders
  - What: The signs, Marram, the lore and the stage ("a brass bell on the boarding platform") all say "wait for the bell", but there is no bell prop and no bell sound. At the end of a full turn the rider is thrown out (`throwPlayer(v, 0, 2, 3)`) instead of stepping off …
  - Where: `src/coast/spokewheel.ts` (`stepRider`, `installSpokewheel`); shots `a05-wheel`, `b05-wheelS`.
  - Editor's fix: Add a bell prop and ring it at boarding and at the end of the ride (and three times in m43, as the lore says). Set the rider down on the platform facing the boardwalk. Add four leg colliders. Dress the platform (rope queue posts, Marram's stool, a fare tin).
  - Re-check: `review/shots/G3/`: `a05-wheel`, `b05-wheelS`
- **G3#18** (polish, craft · **should**) The player water-skis sitting down
  - What: This was deferred in E11 and is still open. The app seats the driver, so the player's gnome sits on the skis while NPC skiers stand.
  - Where: `src/tubing/runtime.ts`, `src/app.ts` seat pose; E11 roadmap "Deferred".
  - Editor's fix: A standing pose hook for `tow-ski`: knees bent and arms forward to the handle, lean shown by the hips.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#19** (polish, craft · **must**, D58) The Last Tube turns a blank wall and a blank board to the sea
  - What: The hut is the stock blue `beach-hut` (the stage says "Driftwood's driftwood hut") and it faces north, so from the beach and the water it is a plain blue back wall. The price sign also faces north, so from the beach its back is a large grey board. None of the …
  - Where: `src/tubing/view.ts` `buildLastTube`; shots `a09-lasttube`, `p03-phone-tube`.
  - Editor's fix: Turn the hut to face the sea (customers come back from the water) or give it a sea-side hatch. Dress it with driftwood planks, nets, oars and a lawn-shark fin on the roof. Use double-sided signs: `coastSign` backs are plain boards everywhere, so give them a wood back. Place the lore notices.
  - Decision: D58 row "Free-standing signs blank from behind" (quoted in full under "Decisions this epic applies").
  - Split: D58: free-standing boards print both faces (the shared helper). FX11 turns the Last Tube and dresses it. (part done by FX01)
  - Re-check: `review/shots/G3/`: `a09-lasttube`, `p03-phone-tube`
- **G3#20** (nit, craft · **could**) Speech bubbles repeat the sign next to the speaker
  - What: Each of these says the sign standing beside it: Marram ("Hat on, hands in, wait for the bell"), Driftwood ("Lawn sharks... Mostly grass") and Sal ("Candyfloss is a vegetable"). Meanwhile good lore lines go unused: "Driftwood has a hut now. We do not mention …
  - Where: `src/coast/life.ts` `COAST_RESIDENTS`.
  - Editor's fix: Swap in the unused lore lines, so each joke lands once.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#21** (polish, craft · **should**) Several vignettes use the wrong props, so their story does not read
  - What: - `candyfloss-dropped`: a beach ball, two gulls and a construction cone. There is no candyfloss. - `souvenir-crates`: uses `mower-scrap-panel`. - `tour-rope-and-a-hat`: a `site-barrier`, building-site tape on a pirate deck. - `boots-by-the-bowl` …
  - Where: `src/coast/life.ts` `COAST_VIGNETTES`.
  - Editor's fix: A dropped candyfloss on its stick, with gulls fighting over it (add a prefab if needed). The lore's souvenir stall: tin hooks, a rubber seagull, "Authentic" hats. A rope stanchion pair. Wellies.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#22** (nit, craft · **could**) The lost-property sign and the pile of hats are 20 m apart
  - What: The sign is at (155, 1106) by Marram's Office; the hats are at (176–180, 1120).
  - Where: `src/coast/boardwalk.ts` (LOST PROPERTY sign), `src/coast/life.ts` `lost-property`.
  - Editor's fix: Pile the hats against the office counter, under the sign.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#23** (nit, craft · **could**) Notices from the lore are missing on the pier, the wheel and the beach
  - What: These lore notices are not placed: "FISHING FROM THE HANDLE ONLY. THE BOWL IS NOT AVAILABLE.", "PLEASE DO NOT STIR", "DO NOT RISE FROM YOUR TEACUP", "Children free. Gulls not.", "THE TOP IS FOR LOOKING. THE BOTTOM IS FOR PAYING", "MARRAM'S WHEEL, MARRAM'S …
  - Where: `src/coast/boardwalk.ts`, `src/coast/spokewheel.ts`.
  - Editor's fix: Place them. They are cheap, already written, and make the place.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#24** (polish, craft · **should**) The ambient sound is thin and patchy
  - What: Each surf tick picks one of three spots (x −400, 0, 400) at random and plays only if that spot is within 120 m. Standing at one spot, you hear surf about every 40 s, and gulls about as rarely. The bell plays only near two buoys. There is no boardwalk crowd or …
  - Where: `src/coast/life.ts` `installCoastLife` update, `src/coast/pirateShip.ts` (`ambience`).
  - Editor's fix: A continuous surf bed scaled by distance to `COAST.shoreZ`. A boardwalk murmur loop with a fairground organ near the wheel, a wheel creak, rigging and halyard ticks near the Queen, and creaking timbers plus muffled surf in the cabin.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#26** (polish, craft · **should**) The Saltcut is a ruler-straight ditch with nothing at its mouth
  - What: A straight 14 m channel with hard, uniform pale banks, no reeds, posts or moorings, and nothing to mark where it meets the sea. Pirate Tours makes this a tour stop.
  - Where: water path `saltcut`; shot `a12-saltcut`; `SALTCUT_MOUTH` (770, 1185).
  - Editor's fix: A gentle bend or two (keep the bridge), reeds and mooring posts on the banks, and a daymark or small light at the mouth with a sign.
  - Re-check: `review/shots/G3/`: `a12-saltcut`
- **G3#29** (nit, craft · **could**) The beach dressing looks stamped
  - What: - Four identical huts stand in a row. - Each umbrella has a deckchair at the same +3/+3 offset and the same yaw (0.3 / 3.3), five times over. - Each sandcastle has a bucket-and-spade at the same (+3, +1.5) offset and yaw, four times over.
  - Where: `src/coast/boardwalk.ts` beach dressing.
  - Editor's fix: Vary yaw, scale and offset per group, break the hut row (one hut set back, one with its door open and towels on a line), and group chairs in pairs and families.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#30** (polish, craft · **should**) Sea traffic is inland boats, and the Saltcut cruiser runs at the moored Queen
  - What: The Saltwater only has clog cruisers, gravy boats and walnut dinghies, the same as the canal. The lore's HOA barges appear only in cutscenes. The Saltcut route ends at (300, 1300), just off the Queen's hull (deck to z 1276).
  - Where: `src/boatTraffic.ts` `allRoutes`.
  - Editor's fix: End the Saltcut run further out, at about (450, 1330). Add one sea-going silhouette far out: a fishing smack, or a distant HOA barge after m44, as a reminder of the story.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#31** (nit, craft · **could**) The pier tour step's text and spot disagree; no patrol appears
  - What: "A patrol is nosing about the gangplank" fires at (300, 1185), about 70 m up the handle from the gangplank (z 1255). The step gives heat 1, but no patrol boat or gnome shows up near the pier to "draw off".
  - Where: `src/quests/coastQuests.ts` (`coast-bathtub-tours`, step 4).
  - Editor's fix: Move the spot to the bowl (on the deck) or reword it to "at the foot of the pier". Ideally spawn a Hat Watch dinghy alongside the Queen for the step.
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#32** (nit, craft · **could**) Stale placeholder constant
  - What: `COAST_UNLOCK_AFTER = 'ch4-runway-flares'` is still exported with a "placeholder" comment. The real unlocks (`quests/unlocks.ts`) use m45 and m46.
  - Where: `src/coast/config.ts:136`, `src/coast/index.ts`.
  - Editor's fix: Delete it, or point it at the m45 row, so later epics do not read the wrong beat. ---
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

**GR1. Lore and the game disagree: which one changes.**
- If the disagreement is about **what a place's name or lore promises it looks like** (its signature image: Saltbucket's
  bucket and dunes, Snowcap's snow, the Unmown's tall grass, the Double Pot's two pots, City Hall's upside-down planter,
  Pardonlin's queues and pavements), **the game changes**. Canon 1 ("every landmark is an ordinary yard object at giant
  scale") is the game's best visual joke, and the name is the promise.
- If it is about **positions, coordinates, counts, who stands where, colours, small facts or "Planned" markers**, **the
  lore changes** to match the build. The cast tables and the code are the fixed points (G2#23, G4#24, G4#32, G12#15–20,
  G1#29).
- Where the lore and the build both fall short of the brief (for example Espalier End's twelve houses, or Capwood's
  "gnomes walk under the caps"), build towards the lore.
- Every ruling below that changes the lore is recorded as a new ruling in `docs/lore/rulings.md`, numbered from
  R-237 in the order the fix epics merge. `npm run lore` must pass.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D14. Saltbucket: bucket, dunes, sand — G3#5, G3#25, G3#6 · **must**
- **Options:**
  - (a) Build all three: the bucket rim, the dune band, sand under the boardwalk.
  - (b) Sand and dunes only.
  - (c) Change the lore.
- **Lore:** `saltbucket-shore.md` ("a bucket-and-spade town built round a giant sunk Tall-One bucket ... past a line of
  dunes"). GR1 applies.
- **Decision:** (a).
- **Reason:** the town's name is the object. Canon 1.
- **Fix round:**
  - A `giant-bucket-rim` prefab: a rim arc about 40 m across breaking the sand behind the boardwalk, and its handle
    arching over the coast spur as a gateway. Add a giant spade in a dune.
  - A dune band at z ≈ 1060–1090 with a `marram-grass` tuft prefab and a weathered picket fence.
  - Sand paint under and around the boardwalk and the wheel. This also fixes the minimap (G3#25).
  - Then G3#6: rather than filling all 46 m of the deck, narrow the promenade rect to about 24–30 m, give the strip
    back to sand, and dress what remains (kiosks, bunting, strollers).

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Free-standing signs blank from behind | G2#11, G3#19 | Free-standing boards print both faces. The back face may carry a second joke. Wall signs face their approach. |


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX01 sea colour and foam, plates and double-sided boards. FX06 deck height, `y`/`surface` for Ruth and the Queen's crew, cast looks.

## Online / mobile / achievements / prefabs / lore notes

- Also: FX01 does the shared two-faced board for G3#19; here the Last Tube turns to the sea and is dressed.
- GR10 keeps the moored-only Bathtub Queen (R-185) and "Tours at noon. Cargo at midnight."
- GR9 density at the boardwalk: measure before and after.
- Mobile: the boardwalk at 390x844.

## Risks and open questions (with the decision taken)

- The promenade narrowing (D14) changes the boardwalk rect: re-check Sal, the vignettes, parked cars, E11 tests and the tubing course.

## Rules for every fix epic (from decisions.md)

- Decisions are final for batch 3. If a ruled fix proves impossible, take the ruling's fallback (or its cheaper
  option), and record it in `review/rounds.md`. Do not reopen the question.
- **GR9 scope guard:** no new systems (the only exceptions: the `previously` field, the reward chip, scene weather, the
  Gnomlet `mount(root)` adapter, the ambient-gnome `y`/`surface` field, the vehicle capsule, quest-scoped stage sets,
  choice-gated outro steps). No new online modes. Density passes are measured with `node tools/gta-perf.mjs --cpu 4` at
  the densest spot before and after, and may raise phone frame time there by at most 15%.
- **GR10 keep list:** the sign and dialogue voice, the HOA as the butt of the jokes, the gentle Flock, the kind moles,
  act IV's voices, Radio Adagio, the Spine Cut and the World's Edge, Casual handling and Casual-chassis traffic, the
  comms card on desktop, Gnomey Bird, the moored-only Bathtub Queen, "Tours at noon. Cargo at midnight." Rewrites add a
  clause; they do not replace a scene.
- **GR1 lore:** signature images change the game; positions, counts, colours and small facts change the lore. Every
  lore change gets a ruling appended to `docs/lore/rulings.md` (use the next free number on your branch; the
  orchestrator renumbers from R-237 in merge order). `npm run lore` must pass.
- Priorities: **must** is done this round and checked in R1 round 2; **should** is done unless it blocks a must;
  **could** only if there is room. Nits without a decision are *could*: do them where cheap, bundle several per issue.
- Edit only the files this brief owns. Hot files (`config.ts`, `app.ts`, `hud.ts`, save keys, the prefab catalog
  index, `rulings.md`, `AGENT_INDEX.md`) take small, additive edits only; conflicts are resolved at merge.
- Prefab rule for every new object (`@lawn/prefabs`), z-fight rule for anything flat (`flatLayer`), mobile by default
  (390x844 and 844x390, 44 px targets), keep LF line endings. Workers never commit; the lead commits on its branch.
- Load: at most ~30 worker issues. If decompose finds more, do the musts first, commit a working state, and report
  the rest as deferred.

## Done when

- `npm run build -w games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass (rerun a timing-sensitive file alone before calling it a regression).
- With the dev server up: `bash tools/smoke.sh <url> #ui canvas` reports no console errors.
- Any 3D scenery or prop change: `npm run zfight -- <url>` at each changed spot is clean.
- Prefabs added or changed: `npm test -w packages/prefabs` passes. Lore changed: `npm run lore` passes.
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX11/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Shots `a01-entr`, `a02-bwmid`, `a04-bwwest`, `a05-wheel`, `a07-pierbeach`, `b01-ship`, `c01-night-bw`, `c02-night-pier` re-shot and resolved.
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
