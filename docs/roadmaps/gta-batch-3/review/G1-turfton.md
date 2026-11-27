# G1 Turfton: editorial review, round 1

Editor: G1 (Turfton). Branch `gta-batch-3` at 6d217da8. Dev server `:5405`, headless Edge, `tools/gta-shots.mjs`
(960x600 and 390x844), interiors with `?interior=<id>` and a save that owns Flat 3B (eight pieces placed), world
changes forced with `?worldchange=`, night with `?time=night`, and `tools/zfight.mjs`. Shots: `shots/G1/` (paths
below are relative to this folder). Not done: a real phone, a real drive through the tunnel with traffic, story
playthroughs of #6/#7/#15/#21/#62 (G10–G12 own those).

## Verdict

The writing is good. Turfton's signs and lines land: "PLEASE DO NOT ENJOY THE WALLS", "NO SONS, JUST JOHN", the
cleaning rota of nobody, "PLOTS FROM 1 TO 1", the Underspan manifesto. The new places carry real vignettes. The
problems are in the craft around them, and they are the kind a player notices in the first ten minutes:

- **Story buildings that are not there.** City Hall is a podium in front of a Buck-Iron store. The Double Pot is two
  plain office blocks with a grey slab between them.
- **Story dressing that is always on.** The HOA's cell and the penthouse table stand in the Double Pot Tunnel road
  from the first minute. The Even-Estates sites are up before #7 and still up after the finale. Founders' Green has
  its name and its court before it "opens" in #15.
- **The dollhouse interiors leak.** Wall signs float in mid-air when their wall is cut away. The roof lift drops the
  camera inside the kiosk.
- **Undersides render as black-green voids.** The skyway, the Double Pot slab and the Unfinished Span all look like
  a hole in the sky.

None of this needs a rewrite. The charm is in the details, and these findings are about details. The one spirit
question worth the decider's time is #6: Turfton's homes and towers read as a human city in European clothes, not
the garden town of pots, sheds and birdbaths that the lore describes.

Counts: 3 blockers, 19 polish, 8 nits. 24 craft, 6 spirit.

## Findings

### 1. The HOA cell and a café table stand in the Double Pot Tunnel's traffic lanes, solid, from game start
- **What:** stage sets are built once at game start as permanent solid props (`stageSets.ts buildStageSets`). Row 62's
  set puts the chain-link HOA pen and the cell bunk at x 114.6..118.5, which is the west lane of the tunnel road
  (x 115..125). Row 21's set puts a table and two chairs at (123.8..125.4, -99), on the east kerb line. Both have
  colliders. Before #62 the HOA lockup is already visible and blocks a lane. After #62 it never goes away.
- **Where:** `quests/stages/story/s62-cams-cell.ts` set (lines ~48-57), `s21-penthouse-viewing.ts` set (lines ~61-64);
  world (116.5, -98) and (125, -99). Shot `dpot-tunnel.png` (pen on the left, table on the right), `n-tunnel.png`.
- **Why:** this is Turfton's signature street, and cars and traffic drive straight into a jail pen. It also spoils
  #62: the reveal is sitting in the road from the first minute.
- **Fix:** lay the lockup out the way the lore entry `hoa-lockup` says: a door in the tunnel wall leading into a
  walk-in interior (E05 `defineInterior`, like the sales floor), not a pen in the road. Move the s21 table onto the
  sales floor or the slab. Add a check, as a test, that no solid stage-set prop overlaps a road rectangle
  (`world.layout` roads) unless it is marked `overRoad`. Also gate story-only dressing on its world change
  (W05 / a new W-row for the lockup) rather than on the permanent stage-set batch.
- **Severity:** blocker. **Type:** craft.

### 2. City Hall does not exist: the civic forecourt sits in front of a Buck-Iron store
- **What:** the `city-hall-steps` stage (centre (14, -69)) describes "a new stone City Hall built on the north-east
  block". In the world there is a podium, a flagpole and a lectern on the grass in front of a generic green glass
  tower with a **BUCK-IRON** sign. The lore (`turfton-city-hall`) says City Hall is an upside-down ceramic planter with
  astroturf steps.
- **Where:** world (14, -63) facing north. Shot `cityhall-close.png`. `quests/stages/turfton.ts:151`,
  `docs/lore/entries/apocrypha/turfton-city-hall.md`.
- **Why:** City Hall hosts #6, #7, #28, the finale #70 and three side quests. In free roam it reads as a hardware
  shop. Players cannot find "the council" the story keeps sending them to.
- **Fix:** replace the tower on that block (the `towers/` slot behind (14, -72)) with a City Hall landmark: an
  inverted planter of 2-3 tiers, a stone CITY HALL plaque over the steps, green astroturf steps, two flagpoles, the
  Zoning Board's bench on the top step, and the "THIS RIBBON CUT BY MAYOR MULCH (THIRD COAT)" podium. Use a new
  `gta-city-hall` prefab or a landmark entry. Give it a map POI and a district sign. Keep the forecourt marks where
  they are.
- **Severity:** blocker. **Type:** craft.

### 3. Taking the lift up to the Thorne Helipad puts the camera inside the lift kiosk
- **What:** `DOUBLE_POT_ROOF_ARRIVAL` (120, 9, -75) faces north, and the kiosk (a scaled `cab-rank-booth`) stands at
  z -71.7, right where the follow camera sits behind the player. On arrival the whole screen is mustard yellow until
  the player walks away.
- **Where:** `interiors/showcase/doublePot.ts` lines 12-14 and 40-50; `?interior=double-pot-sales&roof=1`. Shot
  `i-roof.png`.
- **Why:** this is the arrival moment on a story rooftop (#21) and a helipad, and the first thing the player sees is
  a solid yellow screen.
- **Fix:** put the player 3 m south of the kiosk, facing south (toward the pad, yaw 0), or put the kiosk against
  the parapet at the north end with the arrival in front of it facing away. Swap the taxi booth for a proper lift
  housing (a beige box with a THORNE lift door; add a prefab `even-lift-kiosk`). Add a camera-clearance assert to
  the interiors test for every `stairsTo` world target.
- **Severity:** blocker. **Type:** craft.

### 4. Interior wall signs float in the air when their wall is cut away
- **What:** interior walls are single-sided planes, so they vanish when the follow camera is outside them
  (dollhouse view). The signs (`kit.sign`) on those walls still render, so they hang in mid-air at the edge of the
  screen, often over the HUD. Seen in Flat 3B (the bank notice and both sticky notes), the sales floor (two
  posters), Hogweed's Workshop (two posters), Diggs' bungalow ("DO NOT DIG INDOORS") and the townhouse.
- **Where:** `interiors/kit.ts` (`sign`, `frontPlane` walls). Shots `i-flat.png` (left and right edges),
  `i-dpot.png`, `i-workshop.png`, `i-diggs.png`.
- **Why:** it shows up in every walk-in, including the player's home, and makes the rooms look broken.
- **Fix:** build signs as front-facing single-sided planes on the room side, like the walls (`frontPlane` plus the
  wall's facing), so they cull with their wall. Do the same for any `kit.put` wall piece (paintings, the flat's
  `wall` stock): put them on the wall's layer and hide them with it. Check it with the same five `?interior=` shots.
- **Severity:** polish (high). **Type:** craft.

### 5. Elevated undersides render as a flat black-green ceiling
- **What:** downward faces take the hemisphere light's ground colour and no direct light. The Double Pot tunnel slab
  (grey `0x8d8f93`) reads as a near-black green lid. The downtown skyway does the same: it crosses the z = -50
  corridor, so City Hall, the Mulch Club and the Double Pot approach all have a dark band across the top of the
  screen. So does the Unfinished Span over the Underspan.
- **Where:** `city/megaBlock.ts buildMegaBlock` (slab material), `highways/` deck mesh, the Span over
  `societies/underspan`. Shots `dpot-tunnel.png`, `dpot-far.png`, `underspan-road.png`, `n-tunnel.png`.
- **Why:** the Double Pot tunnel is a set piece (a lockup, a helipad overhead), and right now it is an unlit box.
  From the street the dark slabs look like a missing texture.
- **Fix:** give underside materials a small emissive floor (or a lighter base colour with `side` faces split off),
  and add tunnel dressing: a strip of warm tunnel lamps every 6 m on the slab underside (emissive, on a draw
  layer), "DOUBLE POT TUNNEL / HEADROOM 8 M" portal plates at both mouths, a THORNE logo, and a "SALES FLOOR →"
  sign by the door at (112.4, -84). Under the skyway, add column bents with posters. Under the Span, the Underspan's
  own bulbs on strings.
- **Severity:** polish. **Type:** craft.

### 6. Turfton's homes and towers read as a human European city, not a gnome garden town (spirit)
- **What:** the lore says Turfton is "lined with giant flower pots, sheds and birdbaths that the gnomes live in",
  that "every tower in Turfton is a pot on a pot", and that the Double Pot is "two giant flower pots side by side".
  What is built: Kerb Row is three Pardonlin `euro-townhouse-tall` prefabs, and Patio Heights is
  `euro-townhouse-mansard` (E29's Pardonlin kit). Saucer Court is a 4-storey concrete slab block with shop-front
  glazing on the ground floor. The Double Pot is two plain office slabs. Downtown towers are brick and glass
  high-rises with chain-store signs.
- **Where:** `homes/townHomes.ts` (juniper(), mayor(), townhouse), `homes/saucerCourt.ts`, `city/megaBlock.ts`.
  Shots `kerbrow.png`, `patio.png`, `saucer-stair.png`, `dpot-far.png`, `dpot-side.png`, `tower.png`.
- **Why:** Pardonlin's identity is its European kit. Re-using that kit in Turfton blurs the two towns. The lore's
  garden-object houses are the game's best visual joke, and the batch-3 homes walked away from it.
- **Options for the decider:** (a) keep the buildings and add garden-object cues: pot rims as cornices, terracotta
  bands, drainage-hole windows, a watering-can water tower on Saucer Court, and turn the Double Pot halves into two
  tapered terracotta pots with a rim (as the lore says). (b) Re-skin the Turfton homes with a Turfton kit (a
  `turf-pot-house`, a `shed-terrace`, a `birdbath-flat`) and keep the euro kit for Pardonlin. (c) Rule that
  Turfton's newer districts are "Tall-One style" and write it into the lore. My recommendation is (a) for the
  Double Pot and Saucer Court, (b) for Kerb Row and Patio Heights.
- **Severity:** polish. **Type:** spirit.

### 7. Founders' Green is named, mapped and playable before it "opens" in #15
- **What:** the lore and W03 say the Green is three condemned blocks that Juniper rezones in #15 (ribbon, crowd,
  condemned signs gone; "before the ribbon came down, the blocks carried condemned signs so old that a bird nested in
  one"). In the game the court and skate blocks are called "Founders' Green" from the first minute
  (`parks/blocks.ts`, map blips, the court/skate "far away" toasts, the Gnomlet app). Drainpipe Court and the Gutter
  Bowls are open. No condemned signs exist anywhere.
- **Where:** `parks/blocks.ts:25-26`, `mapPois.ts:62`, `court/runtime.ts:102`, `skate/runtime.ts:356`,
  `sports/app.ts:48`, `worldChanges/rows/greenAndBarn.ts` (W03). Shots `gnorwin.png`, `w03-green.png`.
- **Why:** #15's payoff ("Founders' Green. Signed, stamped, and open.") has nothing to change. The best lore beat
  (condemned signs with a bird's nest) is missing.
- **Fix:** before W03, show the two blocks as "the condemned blocks": THORNE LAWN & ORDER CONDEMNED notices on stakes
  (one with the nest), chalk crosses on the paving, and the map label "Condemned blocks". Keep the court and bowls
  playable, as a squat the regulars run ("COURT CLOSED (WE ARE PLAYING ANYWAY)"), so E19's content is not
  locked. W03 removes the notices, and the name and blips switch to Founders' Green. Update `downtown-turfton.md`,
  which still lists only "Gnorwin Clayfoot Park: the small green square".
- **Severity:** polish. **Type:** spirit (it touches E19's open-from-start access; the decider picks squat vs locked).

### 8. The Even-Estates sites are always up: before #7 and after the finale
- **What:** E16 builds hoardings, gates, crane, crews and show-homes on all three sites permanently. W02's bulletin
  says "building starts on three fringe sites" after #7, but they were already there. W17 ("After the Even Cut",
  `hides: ['W02']`) only removes W02's extra signs: the hoardings ("COMING SOON: SAMENESS"), crane and crews stay up
  forever after the finale. E16's contract flagged this as "not wired".
- **Where:** `country/estates.ts`, `worldChanges/rows/estates.ts` header comment, `worldChanges/defs.ts` W02/W17.
  Shots `estates1.png`, `estates1b.png`, `estates2.png`.
- **Why:** the world does not answer the story at its two biggest beats (the start of the Even-Estates plot and its
  end).
- **Fix:** before W02, the sites are surveyed plots: pegs and string, one Levelright survey tripod, a "PLOT
  ACQUIRED" board, no hoarding. With W02 (or W18), the E16 build appears. With W17, the hoardings come down (keep the
  empty show-homes per W18), add wildflowers through the cones, and change the gate board to "SAMENESS: CANCELLED".
  Ending B instead gets beige paint over everything and a single lit window. `country/estates.ts` builds into named
  groups that the world-change runtime can toggle.
- **Severity:** polish. **Type:** craft.

### 9. Estates: the boulder still blocks construction-1's gate; the show-homes read as unfinished boxes from outside
- **What:** (a) The general scatter's boulder stands in the gate of construction-1. E16's own screenshot pass noted
  it and it was not fixed. (b) From the road the hoardings are blank grey walls (the jokes are on the gate face
  only), and the show-homes behind are beige flat-roofed boxes with no visible windows or doors. That reads as
  untextured, not as "ALL HOMES IDENTICAL". (c) Inside the hoarding the ground is forest floor with a small dirt
  patch, not a site.
- **Where:** construction-1 gate (≈(-295, -145)), `estates1b.png`; outside faces `estates1.png`, `estates2.png`;
  `country/estates.ts`, scatter exclusion in `biomes.ts`/`sites.ts`.
- **Why:** these are first impressions from the road. The satire needs the houses to look deliberately identical,
  not unfinished.
- **Fix:** add the estate site rects to the scatter exclusion (or a `clearScatter(site)` pass). Put one joke board
  every ~15 m on the outer hoarding faces, reusing the existing gag list ("MIND THE HOUSES", "PLEASE DO NOT MOVE THE
  HOUSES"). Give the show-homes identical doors, two identical windows, an identical doormat and an identical potted
  shrub each (prefab reuse is the joke). Paint the site interior with a `mud`/`gravel` patch over the whole rect.
- **Severity:** polish. **Type:** craft.

### 10. The Double Pot has no presence at street level
- **What:** the sales-floor door in the tunnel (112.4, -84) has no sign, canopy or window display. The outer faces of
  both halves are anonymous shop glazing (`dpot-side.png`). W05 ("tops out") adds a banner on the south face, but
  there is nothing for it to top out *from*: no crane or scaffolding before it ("No crane... skipped").
- **Where:** `interiors/showcase/doublePot.ts`, `worldChanges/rows/estates.ts` W05, `city/megaBlock.ts`.
- **Why:** the Even-Estates showroom should sell itself from the street. The player has to be told where the door is.
- **Fix:** add a beige canopy and "THORNE EVEN-ESTATES · SALES · BY APPOINTMENT" over the door, a window with the
  model estate, and an A-board "NOW SELLING PHASE 3". Before W05, a tower crane on the east half's roof and scaffold
  on the top two floors. W05 removes them and adds the banner (as today).
- **Severity:** polish. **Type:** craft.

### 11. Every walk-in shows the sky or void above the cut-away ceiling, and it is inconsistent
- **What:** Flat 3B, the townhouse and Diggs' bungalow show a band of light-blue sky above the room. The Mulch Club
  and the workshop show black. It depends on the theme and time.
- **Where:** `interiors/runtime.ts` / `kit.ts room()`. Shots `i-flat.png`, `i-townhouse.png` (top band),
  `i-mulch.png`.
- **Why:** the blue sky band makes the rooms look like boxes floating in space. Black reads as "inside".
- **Fix:** while inside, set the scene background to a dark warm neutral (or the theme's ceiling colour, darkened
  60%) and turn the fog down. Restore both on leaving.
- **Severity:** nit. **Type:** craft.

### 12. Weapons and combat buttons inside the player's own flat
- **What:** inside Flat 3B on a phone, the touch layout shows Guns / Reload / Aim / Fire next to Leave / Jump. On
  desktop the pistol is in hand. E05 left holstering "for E18". It was not done.
- **Where:** `?interior=flat-3b` at 390x844 touch. Shot `i-flat-phone.png`.
- **Why:** home is the one place that should feel safe. Four combat buttons cover a third of the phone screen and
  hide the room.
- **Fix:** holster on `onInteriorChange(id)` for interiors flagged `peaceful: true` (flat-3b, townhouse-404,
  diggs-bungalow, bodega, the sales floor), and hide the combat buttons. Show "Decorate" / "Sleep" as context
  buttons instead.
- **Severity:** polish. **Type:** spirit.

### 13. Street barks and quest toasts play inside the flat
- **What:** inside Flat 3B: "Buck-Iron driver: 'Over-caffeinated blender!'". The world runs round the interior's exit
  (E05), so street NPC barks still toast.
- **Where:** shots `i-flat.png`, `i-flat-empty.png`.
- **Why:** it breaks the indoors. Hyssop through the wall is the right kind of noise; a driver's shout from the street
  is not.
- **Fix:** while `currentInterior()` is set, drop ambient NPC bark toasts, or prefix them "(outside) ..." and halve
  their rate. Keep quest comms.
- **Severity:** nit. **Type:** craft.

### 14. Diggs' bungalow: the spawn faces the back of a wardrobe
- **What:** on entry the camera looks straight at a large dark-brown cabinet back that fills the middle of the screen.
- **Where:** `homes/interiors.ts` (diggs-bungalow build). Shot `i-diggs.png`.
- **Why:** the first view of a walk-in should frame its story (the jars, the "REAL MAP"), not a plank.
- **Fix:** move the cabinet against the west wall facing into the room, or move the door spawn. Run the entry-view
  check for every interior: nothing taller than 1.2 m within 3 m in front of the spawn.
- **Severity:** polish. **Type:** craft.

### 15. The Gutter Bowls show the street a blank 3 m concrete wall
- **What:** from the south road (z ≈ 114) the skate park is a long grey skirt wall with one small "GB". Nothing of
  the bowls is visible, and there is no sign or entrance on that side.
- **Where:** `skate/build.ts` (skirt walls, graffiti at `buildGraffiti`). Shot `skate.png`.
- **Why:** the place is invisible from the road most players arrive on.
- **Fix:** paint it: a full-length mural of 3-4 graffiti pieces (acorn, crown, "THE GUTTER BOWLS est. the day it
  rained"), a stair cut in the middle with a handrail (doubles as a skate line entry), two benches with spectators,
  and a "NO SKATING ON THE WALL (SKATE IN THE WALL)" plate.
- **Severity:** polish. **Type:** craft.

### 16. The park-fountain stunt ramp is an undressed black wedge with neon-cyan edges in Gnorwin Clayfoot Park
- **What:** the stunt `park-fountain` (-42, 36) draws a black slab with a bright cyan outline across the civic lawn.
  zfight also reports a coplanar pink strip next to it (`#d94e7a` at (-42, 0.03, 46.9) against the cab-rank booth).
- **Where:** `stunts.ts:27`, the ramp mesh in `ramps.ts`. Shots `gnorwin.png`, `w03-green.png`, `bowls-in.png`.
- **Why:** it is the most debug-looking object in downtown, and it sits in the park that the story's #15 celebrates.
- **Fix:** skin stunt ramps by biome: in parks, a timber-and-turf ramp (wood boards, grass top, a "NO RAMPING
  (PLEASE)" council sign). Keep the cyan only as a faint HUD-ring when the stunt is active. Fix the pink strip's
  draw layer.
- **Severity:** polish. **Type:** craft.

### 17. The Underspan's manifesto jokes cannot be read
- **What:** the two manifesto boards carry 3-4 A4-sized posters each ("THE GROUND IS ALREADY OBSOLETE", "FORM 7 IS A
  SUGGESTION"). From the follow camera they are white specks. The same goes for Saucer Court's 0.6–0.95 m plates
  ("STAIRWELL RULES", "SAUCER COURT residents only (and the bank)", the rota) and Kerb Row's street sign.
- **Where:** `societies/underspan/build.ts:212-221`, `homes/saucerCourt.ts:75-81`, `homes/townHomes.ts` plates.
  Shots `underspan-road.png`, `saucer-stair.png`.
- **Why:** these are the place's best jokes. Signage is acceptance criterion (b), and unreadable signage does not
  meet it.
- **Fix:** double poster and plate sizes (one joke per board-half, 1.2 x 0.8 m, bigger type). For dense notice
  boards, add an `addInteractSpot` "Read the notices" that toasts the lines in turn (as Hyssop's wall does).
  Rule of thumb: legible at 6 m on a 390-px-wide screen.
- **Severity:** polish. **Type:** craft.

### 18. Saucer Court W09: Pip's hammock floats on the façade
- **What:** W09 puts `fennel-hammock` at (32.2, 79.5) 4.6 m up "across flat 3B's window". It hangs flat against the
  wall with nothing to tie to: no balcony, hooks or posts.
- **Where:** `worldChanges/rows/saucerCourt.ts` W09. Shot `w09-saucer.png` (upper middle).
- **Why:** it reads as a floating prop, and it is the only outside sign of a story beat (#39).
- **Fix:** add a short balcony slab and railing under 3B's window (only flat 3B has one, a joke in itself), sling the
  hammock between the railing and a hook, and let a sock hang off it. Or move the hammock to the courtyard between
  the washing-line poles.
- **Severity:** polish. **Type:** craft.

### 19. Flat 3B does not change when Pip moves in (W09)
- **What:** W09 adds a toolbox and a hammock outside, but the flat interior has no trace of a second tenant: no
  bedroll, no toolbox, no second mug. The stairwell rules say "3. NO LODGERS" and the outside adds "NO LODGERS" again.
- **Where:** `interiors/showcase/flat3b.ts` build (no world-change hooks).
- **Why:** the player's home is the place they visit most. The story beat should be most visible there.
- **Fix:** when W09 is on, add fixed dressing: Pip's bedroll in the corner by the door (not in the layout, so it does
  not take a decorate slot), a toolbox, two mugs on whatever table exists, and a sticky note "I PAY IN FIXING THINGS
  — P." Remove it if a later story beat moves Pip out.
- **Severity:** polish. **Type:** spirit.

### 20. The Bodega reads as a living room, not a shop
- **What:** Bodega & Sons is a counter, two bookshelves, a fallen crate tower and a rug. There are no shop shelves,
  cooler, snack rack or price tags. The giant "Tall One's pencil" vignette is repeated on the Even-Estates sales
  floor.
- **Where:** `interiors/showcase/bodega.ts`. Shots `i-bodega.png`, `i-dpot.png`.
- **Why:** a bodega needs stock to be a bodega. Re-using a vignette across two rooms weakens both.
- **Fix:** replace the bookshelves with 2 shop-shelf prefabs stocked with cans and boxes (add a `shop-shelf-stocked`
  prefab if none fits), an Acorn-Cola cooler with a "LUKEWARM AS ADVERTISED" sticker (move the sign onto it), a
  lottery-card stand and a newspaper rack with the Tattler. Swap the sales floor's pencil for a Levelright spirit
  level 2 m long, "CALIBRATED TO THORNE".
- **Severity:** polish. **Type:** craft.

### 21. A stage set is coplanar with the Double Pot façade (large flicker in the tunnel)
- **What:** zfight: `towers-facade` (x 111) vs the `lockup-row` stage set (back face at x 111, (111, 1.8, -94.3)),
  `kind: flicker`, 3,657 px at the default view. Smaller ones in Turfton: the city-hall forecourt paving vs terrain
  at (6.25, -80.25) (buried), Kilnside parks props vs terrain at (-164, -37) and (-141.5, -26), and the boot-parade
  float's glaze at (-73.4, -75.6).
- **Where:** `quests/stages/story/s62-cams-cell.ts:49`; run `npm run zfight -- "http://localhost:<port>/?offline&no-intro&at=30,100,3.14"`.
- **Why:** AGENTS.md rule. The tunnel one flickers at normal viewing distance.
- **Fix:** resolved by #1 if the lockup moves indoors. Otherwise pull it 0.15 m off the wall. Give the forecourt
  paving and the park patches a `flatLayer`.
- **Severity:** polish. **Type:** craft.

### 22. The Underspan is a raw building site under a void; the ground is desert sand
- **What:** under the black Span deck (#5) the Underspan is scaffold towers, bare plank tables and two notice boards
  on yellow sand. The residents and vignettes are there (Nettle's bark, the glider) but read small. Nothing hangs
  from the deck: no bunting, bulbs or hammocks, and the deck is the obvious thing for a society of up-builders to
  hang off.
- **Where:** `societies/underspan/build.ts`, site x 560..600, z -51..-1. Shots `underspan-road.png`,
  `underspan-in.png`.
- **Why:** the inventors' society should look busy and ingenious, not abandoned. "Lived-in" comes from hung and
  strung things.
- **Fix:** string festoon bulbs and pulley lines from the Span's underside to the scaffolds. Hang two umbrella-glider
  prototypes from the deck on ropes. Add a hand-cranked dumbwaiter between the ground and the Roost (decor), a
  chalk "ALTITUDE RECORD" board, and a workbench with tools on each plank table. Ground: a packed-earth patch with
  oil stains and sawdust, not dune sand.
- **Severity:** polish. **Type:** craft.

### 23. The W03 opening crowd stands forever after #15
- **What:** W03's eight flag-waving gnomes and the brass trio on the bandstand are permanent once #15 is done, and so
  are the cut ribbon stakes. They bob in place for the rest of the game.
- **Where:** `worldChanges/rows/greenAndBarn.ts` W03. Shot `w03-green.png`.
- **Why:** after a few in-game days it becomes a waxwork. A permanent party also crowds out W19 (Cam's broom) and
  W07's own party later.
- **Fix:** split W03 into "opening day" (crowd, band, ribbon: shown until the next in-game dawn after #15, or for
  20 minutes of play) and "open" (the bandstand stays with a council notice board "dawn to dusk, hats on", the
  booking sheet "always booked, never used" and the lost boot card from `founders-green.md`'s Everyday). The band
  plays only Saturdays (`worldEvents`).
- **Severity:** polish. **Type:** spirit.

### 24. Decorate panel on a phone: the room is hidden and the plan's labels are clipped
- **What:** at 390x844 the bottom sheet takes about 60% of the height, and the room behind it shows only ceiling and
  walls, so a nudge cannot be seen in 3D. Plan labels use only the first word and are squashed into the piece width:
  "Pot" for Pot Plant, an unreadable lamp label, and the wall bookshelf's label is cut at the edge.
- **Where:** `home/decorUi.ts:118-144`, `?interior=flat-3b&decor=room` at 390x844 touch. Shot
  `i-flat-decor-phone.png`.
- **Why:** decorating the flat is a phone-friendly cosy loop and should show the result.
- **Fix:** on portrait phones, raise the camera to a top-down view of the room while the panel is open and shrink the
  sheet to about 45% (plan above the buttons, collapse the storage strip into a row). Plan labels: use a short-name
  field on `FurnitureStock` ("Plant", "Lamp", "Shelf"), draw them outside the piece when it is narrower than the
  text, and never clip them at the plan edge.
- **Severity:** polish. **Type:** craft.

### 25. Thorne Tower's base and the Mulch Club are lightless black blocks at street level
- **What:** Thorne Tower's obsidian window texture reads as a black void from the pavement, with no lobby, doors or
  name. The Mulch Club exterior from (-30, -40) fills the screen pure black.
- **Where:** `world.ts buildThorneTower` (391-436); the Mulch Club building near (-30, -30). Shot `tower.png`.
- **Why:** the villain's tower should be imposing, not missing. At ground level it gives nothing to look at.
- **Fix:** add a ground-floor lobby band to Thorne Tower: gold revolving door, "THORNE LAWN & ORDER" lettering, two
  beige-uniform doormen, and topiary cubes clipped to exactly 1 m with a measuring stick. Give the Mulch Club a door
  with no handle (lore), a velvet rope and Big Lou. Lift both blacks to a deep charcoal with a rim light.
- **Severity:** nit. **Type:** craft.

### 26. Building-site nights are dark and the night watchman is not visible; firefly sprites read as green squares
- **What:** at night construction-1 is unlit: no site lamps and no watchman's lantern in view. "Fireflies" render as
  hard green squares across the whole sky.
- **Where:** `country/estatesLife.ts` (Night Watch), the firefly emitter (sky). Shot `n-estates.png`.
- **Why:** the night watchman is listed as an acceptance-criterion resident. The square fireflies read as a render
  bug.
- **Fix:** add a lit site cabin window, two flood-lamp posts and the watchman's swinging lantern (emissive). Render
  fireflies as soft round points with size falloff, kept below tree-top height.
- **Severity:** nit. **Type:** craft.

### 27. Ground-floor glazing glows flat cyan at night
- **What:** at night the Double Pot and downtown shop fronts glow as uniform pale-cyan slabs, brighter than any street
  lamp.
- **Where:** `towers/facadeAtlas.ts` / `towers/dress.ts` ground-floor material. Shot `n-tunnel.png`.
- **Why:** it flattens the night look and makes the tunnel look like a fridge.
- **Fix:** warm tint (0xffd9a0), 30–60% of panes lit at random per block, and darker mullions.
- **Severity:** nit. **Type:** craft.

### 28. Flat 3B's dressing is oversized
- **What:** the three sealed letters by the door are about 0.6 m long (forearm-length on a gnome). The moving crates
  are taller than the player.
- **Where:** `interiors/showcase/flat3b.ts` (sealed-letter, crate). Shot `i-flat-empty.png`.
- **Why:** scale mistakes in the player's own room are noticed.
- **Fix:** sealed-letter at scale 0.5, fanned in a pile of 6-8 with one opened, and crates at 0.75.
- **Severity:** nit. **Type:** craft.

### 29. Lore drift in Turfton entries
- **What:** `downtown-turfton.md` still lists "Gnorwin Clayfoot Park: the small green square at the Downtown edge"
  and the "City Hall steps (0, -72)" (the stage is at (14, -69)). It never mentions Founders' Green, the Double Pot
  or the skyway over the z = -50 corridor. `founders-green.md` says "three blocks Vesper Thorne had condemned", but
  the built Green is Gnorwin Park plus two blocks (court and skate), and one of the three was never condemned. The
  `greenAndBarn.ts` header calls it "Gnorwin Statue Park".
- **Where:** `docs/lore/entries/apocrypha/downtown-turfton.md`, `founders-green.md`, `turfton-city-hall.md`;
  `worldChanges/rows/greenAndBarn.ts:2`.
- **Why:** editors and future epics read the lore as the source of truth.
- **Fix:** rule which three blocks were condemned (proposal: the court block, the skate block and the strip of the
  x = -60 street between them, which W03 "repaves"; Gnorwin Park joined them). Update the three entries with the
  built coordinates and the skyway, and fix the comment. `npm run lore` must pass.
- **Severity:** nit. **Type:** craft.

### 30. Kerb Row and Patio Heights are quiet: one resident each, no street life
- **What:** Juniper reads on her step and Reginald measures indoors, but the two streets have no passing neighbours,
  no window life by day, and no bins or kids. The terraces are 20 m tall (S = 1.7 scaling), which dwarfs the
  "narrow terrace".
- **Where:** `homes/townHomes.ts`. Shots `kerbrow.png`, `patio.png`.
- **Why:** criterion (c) is met to the letter but not in spirit. The two most political homes in the story deserve a
  street that reacts to them.
- **Fix:** add a neighbour on each street with a place-specific habit: on Kerb Row a gnome repainting the kerb
  ("kerbs: yes, row: ongoing"); on Patio Heights a press photographer camped opposite the Mayor's red villa, and an
  HOA inspector measuring Reginald's lawn with calipers (ties to #12). Scale Kerb Row to S = 1.3 so it reads as a
  terrace, not a tower row.
- **Severity:** nit. **Type:** spirit.

## Top five for the fix round

1. #1 HOA cell and table in the tunnel road (blocker).
2. #2 City Hall is a Buck-Iron store (blocker).
3. #3 the roof lift camera inside the kiosk (blocker).
4. #4 floating interior signs, systemic (polish, high).
5. #8 + #7 world changes that do not change the world (Even-Estates sites, Founders' Green).
