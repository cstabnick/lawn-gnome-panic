# G4 The north: editorial review, round 1

Editor: G4 (Snowcap Rise, Snowdrop Slope and the Woolly Sock Lodge, sledding and skiing, Pail Pond, the polar bears,
Capwood and the Capwood Run, the Hatbrim routes, Mittenholt and the High Tarn, Frostbite Fells, snow weather).
Method: dev server on :5404, `tools/gta-shots.mjs` at 39 spots (desktop 960x600, phone 390x844, `?time=night`,
`?weather=snow`, `?winter=wool-run|tea-tray-run`). Shots are in [shots/G4/](shots/G4/). I also read the code and data for
E12, E14, E31 and E33 and the lore entries, and ran a scratch probe that matched `planScenery()` placements against every
`GROUND_TRACKS` road (script kept outside the repo).

## Verdict

The north has real charm. The writing is strong all through: the sign jokes, Cass Pedal at the World's Edge, Snapper
Lensley, "BEAR DECK / They are not asleep.", the Warden's fines. The Spine Cut gorge is the best set piece in the group,
and from the Top Hat lookout the Hatbrim reads as a real range. Most of the problems are in the ground, not the writing:

- **Snowcap Rise is mostly a green daisy meadow.** Pail Pond's ice sits in summer grass, the ski hill is a white strip
  with a ruler-straight edge, and falling snow never settles anywhere.
- **The Capwood Run is laid out as a trombone.** Four parallel 300 m straights with tight hairpins leave stair-step
  scars on the Fells mountain. Its road also has pines and boulders standing on it (a blocker).
- **Capwood reads as a lawn with toadstools, not a forest.** At night its glow becomes opaque mint balls.
- **Some set pieces lose their look in 3D.** The Keyhole looks like a concrete footbridge, the High Tarn is a
  rectangle, and the Gill Ford is a dark rectangle.

None of this needs a system rewrite. It needs paint rules, placement keep-outs and a re-laid route.

Counts: **2 blockers, 19 polish, 12 nits** (33 findings). **25 craft, 8 spirit.**

---

## Snowcap Rise as a whole

### 1. Snowcap Rise is green: Pail Pond is ice in a daisy meadow
- **What:** The paint rule `landforms/northHighlands.ts` paints snow only above 32 m, the `snowfield` capsule and the
  `pond` disc. Everything else on the Rise is `meadow` with yellow and white flowers. Pail Pond's ice disc ends at a grey
  rim and green grass with daisies starts right outside it. Snowdrop Slope is a white band in grass. With
  `?weather=snow` heavy snow falls on the daisies (shots `pond`, `snowPond`, `phonePond`, `slopeSide`, `ring`, `mitten`).
  The lore says the Rise is "the high country ... where the snow stops melting at the edges", and it is meant to be
  snowier than Frostbite Fells. In the game the Fells are white and the Rise is greener.
- **Where:** `landforms/northHighlands.ts` `paint()`; the Wasm mirror `assembly/kernel.ts evalRegionPaint`;
  `data/levels/north-highlands.level.json` features.
- **Why it matters:** This is the first thing a player sees in the winter region, and it breaks the place. An ice-fishing
  pond in a summer meadow reads as a bug.
- **Proposed fix:** Add a `snowApron` margin to `pond` and `snowfield` features: snow within r + 25-40 m, edged with fbm
  noise and a `frost` meadow transition band (pale grass with white patches). Lower the Rise's snow height with noise
  (for example snow above 18-22 m, patchy between 10 and 22 m). Keep Capwood's floor and Mittenholt's green as
  deliberate clearings (a `thaw` exclusion around them), or give them patchy frost too. Mirror the change in the kernel
  and add a parity test. Also check `snow lumps` in Mittenholt so they no longer sit on daisies.
- **Severity:** blocker · **Type:** craft (the overall snow line is a spirit question, see 2)

### 2. How white should the Rise be? (decide once)
- **What:** Because of 1, Capwood and Mittenholt are also summer-green. That may be wanted, since a toadstool forest
  glowing in snow is odd. But the lore, the region's name and the "Above the Fells" achievement ("Climb past Frostbite
  Fells to Snowcap Rise") promise a colder place than the Fells.
- **Where:** Lore `apocrypha/snowcap-rise.md`; region theme `north-highlands` in `regionThemes.json`.
- **Why it matters:** The decision sets the palette for every fix in this group.
- **Proposed fix (options for the decider):** (a) Snow on everything above the band road, with Capwood as a warm
  "spore-thawed" hollow (lore hook: the rotting woodpile warms the ground). (b) A frost-meadow look: pale, patchy snow,
  white on the high ground only. (c) Keep it as it is and rewrite the lore. I recommend (a) with Capwood thawed: it
  gives the forest a reason to exist and keeps the Rise wintry.
- **Severity:** polish · **Type:** spirit

### 3. Snow particles render as hard white squares
- **What:** `weather/render.ts:104` uses a `PointsMaterial` with no sprite map. Near the camera, flakes become flat
  white squares, up to about 100 px (bottom-right of `ford2`, `pondMid`, `tarn`, `deckClose`).
- **Where:** `weather/render.ts` `snowMat`.
- **Why it matters:** It looks like a rendering glitch over every northern view, and the north is where the snow is.
- **Proposed fix:** Give the material a small radial-gradient `CanvasTexture` (round, soft edge) with `alphaTest` or
  premultiplied alpha. Clamp the near size (fade out flakes within about 1.5 m of the camera). Shared with G9.
- **Severity:** polish · **Type:** craft

### 4. Falling snow never settles and does not change the ground
- **What:** Snow weather is particles only. Nothing whitens, even on the Fells' edge or the Rise's meadow (`snowPond`).
- **Where:** `weather/`, terrain paint.
- **Why it matters:** "Snow weather" is in scope for this group. Without some settling it feels like a screen effect.
- **Proposed fix:** A cheap pass: during snow, lerp the meadow and grass terrain colour towards white by intensity in
  the north band regions (a uniform on the ground material, region-masked). No new geometry. Do it after 1.
- **Severity:** nit (polish if 1 lands) · **Type:** spirit

### 5. The minimap shows the snowfield and Pail Pond as green
- **What:** The minimap is white on the Fells but green over Snowdrop Slope and Pail Pond (`slopeFoot`, `pond`).
- **Where:** Minimap ground colour source (biome ground, not the painted surface).
- **Why it matters:** The player cannot see the ski hill or the pond on the map.
- **Proposed fix:** Sample painted surface kinds (`snow`, `ice`) into the minimap ground tile for the north band.
- **Severity:** nit · **Type:** craft

---

## Snowdrop Slope and the Woolly Sock Lodge

### 6. The Woolly Sock Lodge sinks into the slope
- **What:** The lodge stands on unlevelled ground. The snow surface climbs diagonally across its east wall and buries
  the north end of the base, porch included (`lodge`, `nightLodge`).
- **Where:** `winter/hill.ts` `buildSnowdropSlope` (lodge piece at `LODGE` (-449, -1020)). There is no pad or flat site
  under it.
- **Why it matters:** The hub of the winter sports looks dropped in by hand.
- **Proposed fix:** Level a pad under the lodge and its porch (as E33's `applyPadRelief` does, or a flat-site marker in
  `north-highlands.level.json`), with a short snow berm on the uphill side. Or set it on a log plinth with steps on the
  downhill side.
- **Severity:** polish · **Type:** craft

### 7. Snowdrop Slope is an empty white plane, and the snow-to-grass edge is ruler-straight
- **What:** The slope is 220 x 300 m of untextured white with 11 framing pines, the small gates and a finish banner
  (`slopeFoot`, `slopeTop`, `tow`). The snowfield is a capsule of radius 108 m, so its sides are dead-straight lines
  against the meadow (`slopeSide`). No groomer tracks, no other skiers, no piste markers, no snow-fence, no lift hut at
  the top.
- **Where:** `winter/hill.ts`; the `snowfield/snowdrop-slope` feature.
- **Why it matters:** "Hand-crafted" fails here first. It reads as a placeholder.
- **Proposed fix:** Noisy snowfield edge (see 1). Piste poles every 30 m along both runs, a top station hut at the tow
  top, an orange snow-fence along the Tea-Tray lane, and corduroy groomer stripes as a flat-layer decal on the Wool Run.
  Add 2-3 ambient skiers or sledders using the slide rider on autopilot (the E12 brief allowed this), Gentian's learners
  on the nursery strip, and pine clumps instead of single pines.
- **Severity:** polish · **Type:** craft

### 8. The Wool Run is about 18 s long; the brief asked for 60-80 s
- **What:** The start is at z -1255 and the finish at z -1045 (210 m). `BLACK_DIAMOND_S = 18`. The slope continues to
  about z -1340 (the 65 m peak) and is not used. The E12 brief asked for "a tall enough gradient for a 60-80 s run".
- **Where:** `winter/types.ts` `WOOL_RUN`, `TEA_TRAY_RUN`, `BLACK_DIAMOND_S`.
- **Why it matters:** A run that ends before it gets going makes the ski hill feel slight.
- **Proposed fix:** Start the Wool Run at the summit (raise the tow top or add a second "upper" tow). Give it
  10-12 gates with a traverse or chicane across the slope and one jump lip. Retune `BLACK_DIAMOND_S` (about 35-45 s).
  Keep the short run as "the Nursery" for learners.
- **Severity:** polish · **Type:** spirit

### 9. No run-out: you finish and slide onto the band road
- **What:** After the finish line (z -1045) nothing slows the rider. The north-band road crosses about 40 m further
  south. In `phoneSki` the skier coasted off the snow to the road edge. Nothing in `winter/runtime.ts finishRun` brakes
  or stops the rider.
- **Where:** `winter/runtime.ts` `finishRun`; the foot of the slope (-400..-300, -1045..-1000).
- **Why it matters:** Traffic plus a skier at speed is a cheap death. The finish should feel like an arrival.
- **Proposed fix:** Add a run-out: a flat snow apron with a curved hay-bale or snow-fence corral before the road, and an
  auto snowplough (raise friction) for 3 s after the finish. Make sure the foot of the snowfield stops short of the road.
- **Severity:** polish · **Type:** craft

### 10. The lodge looks like a plain shed, and it is dark at night
- **What:** The lodge is a brown box with a blank north gable (`lodgeNorth`). The "giant sock over the door" is barely
  readable at normal camera distance. At `?time=night` the snow turns blue but the lodge gives no warm light: the
  windows are flat yellow quads with no glow or spill, and there is no porch lamp (`nightLodge`).
- **Where:** Prefab `woolly-sock-lodge`; `winter/hill.ts`.
- **Why it matters:** A ski lodge at dusk with lit windows and smoke from the chimney is the classic image of the place.
- **Proposed fix:** Windows on every side, a stone chimney with a smoke puff, and a larger striped sock hung from the
  ridge so it reads from the slope. At night: emissive windows, one point light on the porch (within the light budget),
  and a lantern on the tow base.
- **Severity:** nit · **Type:** craft

### 11. Phone: starting a ride drops a desktop key card over the rider, with three more toasts stacked on it
- **What:** At 390x844 with `?winter=tea-tray-run`, a "WASD / Click / Shift / Space / H / B / N" help card covers the
  middle of the screen and the gnome, while the achievement banner, the "contract waiting" toast and the radio
  "Now playing" strip all show at once (`phoneSled`). The headless browser has no touch, so the touch build may hide the
  card: **verify on touch emulation.** Even so, the stacking is real.
- **Where:** The vehicle help card shown on entering a vehicle (HUD); the winter ride start.
- **Why it matters:** The first second of a sled run on a phone is unreadable.
- **Proposed fix:** Do not show the vehicle key card for `tea-tray-sled` and `snow-skis` (show "steer / brake" touch
  hints instead). Queue toasts during a run's countdown. Hand this to G9 for the global queue.
- **Severity:** polish · **Type:** craft

---

## Pail Pond and the polar bears

### 12. Pail Pond is a vast, empty ice plain, and the pail does not read as a pail
- **What:** The ice disc is 124 m across, with three small shanties, Theo and four bears spread over it (`shanty`,
  `pondMid`). The "galvanized rim" is a dark grey kerb about 0.5 m high (`pond`) and looks like concrete. The handle is
  not visible from the shore.
- **Where:** `winter/pond.ts`; `pond/pail-pond` r 62.
- **Why it matters:** The best joke of the place ("everyone knows it is a pail") needs the pail to read. The emptiness
  makes the pond feel unfinished.
- **Proposed fix:** Make the rim a taller, brighter metal band (light zinc with ribbing and a rolled lip, 1.2-1.5 m) and
  raise the handle arc so it clears the horizon from the road. Cluster the shanties into a small "village" near Theo,
  with a sled path of footprints between them, a few marker flags, and a gnome or two on stools. Alternatively, shrink
  the disc to about r 45 and ring it with snowbank (see 1).
- **Severity:** polish · **Type:** craft

### 13. The napping bear lies on its back with its legs out and looks dead
- **What:** The `pond-nap` bear (-662, -1078) lies flat with its legs splayed (`pondMid`). From the shore it reads as a
  carcass on the ice.
- **Where:** `critters/snowcap.ts` `addPoseProps` `'nap'` (no props); the critter's nap pose.
- **Why it matters:** The lore is strict: "nothing dies", the bears are "really chill". A dead-looking bear is the one
  image this place must never give.
- **Proposed fix:** Curl the bear on its side or belly with its head on its paws. Add a small "Zzz" puff, a scarf or
  sunglasses pushed up, and a folded newspaper or towel under it, so it reads as napping.
- **Severity:** polish · **Type:** spirit

### 14. The Bear Deck has no deck, and its sign hides the middle bear
- **What:** The five bears sit in deck chairs on bare snow. No planking, rail or parasols. The new BEAR DECK sign
  stands right in front of the centre bear and hides it from the approach (`deckClose`).
- **Where:** `critters/fells.ts` deck; `critters/snowcap.ts addBearDeck` (sign at `BEAR_DECK.z + 9`).
- **Why it matters:** It is the signature L38 joke, and the "Bear Deck" label promises a deck.
- **Proposed fix:** Lay a timber deck (flat layer plus a low rail) under the chairs, with two parasols and a cool box of
  sardines. Move the sign 6-8 m to the side of the approach path, angled towards it.
- **Severity:** polish · **Type:** craft

### 15. The mug bear's cocoa mug is too small to see
- **What:** This was noted by E12 itself. The mug is a scaled prefab (0.3) and invisible at 960x600 and on a phone.
- **Where:** `critters/snowcap.ts` `'mug'` pose.
- **Why it matters:** The pose is the vignette, and without the mug it is just a bear on a bench.
- **Proposed fix:** Scale the mug to bear scale (about 0.6) and put it in the paw. Add a steam puff.
- **Severity:** nit · **Type:** craft

---

## Capwood and the Capwood Run

### 16. Pines and boulders stand on the Capwood Run's road (including the summit)
- **What:** The landscape belts in `scenery.ts planScenery` (step 3) never check `nearTrack`. My probe found 9 solid
  placements on the Capwood Run's road surface: snow pines (with trunk colliders) at (180, -843), (179, -838),
  (180, -830), (180, -812), (232, -875), (250, -871), (343, -876), and garden rocks at (270, -874) and (330, -874).
  Shots `summit` and `summitSign` show two boulders and a full-size pine in the driving line at the summit. The Hatbrim
  routes came out clean in the same probe.
- **Where:** `scenery.ts` `placeSolid` (it checks `highwayGap` but not `nearTrack`); compare `biomes.ts:241`, which does.
- **Why it matters:** A race road with trees on it stops AI rivals and players dead. It also looks broken at the
  route's showpiece.
- **Proposed fix:** In `placeSolid`, `if (nearTrack(x, z, ROAD_CLEAR)) return;` (GROUND_TRACKS covers all routes). Add a
  test: no `planScenery` placement is `onRoad` (or within `barrierOffset`) for any `GROUND_TRACKS` entry. Regenerate
  `layout.golden.json` if it changes.
- **Severity:** blocker · **Type:** craft

### 17. The Capwood Run climbs as a trombone of parallel straights that leave stair-step scars
- **What:** The first ~2 km of `CAPWOOD_RUN` is four ruler-straight north-south legs (x 94, 124, 152, 182, 208, 236,
  each about 250-300 m long) joined by 10-15 m hairpins, laid side by side about 28 m apart (minimap in `runMid`,
  `ring`, `paddock`). The ribbon cut leaves grey stepped terraces on the Fells mountain that look like a quarry from the
  Bear Deck, Capwood and the Rise (`bearDeck`, `deckClose`, `cwInside`, `gillFord`). Driving it means straight, hairpin,
  straight, the same thing six times.
- **Where:** `raceTrack/defs/capwoodRun.ts` `control`.
- **Why it matters:** The user's L81 asked for a rally that "goes up and down the mountain through toadstool stuff". A
  rally lives on varied corners and crests, and this is the most visible man-made scar in the north.
- **Proposed fix:** Re-lay the climb as one flowing route: an S-bend up the south face, a long sweeping traverse with a
  crest, two hairpins at most, the summit, and the descent as already drawn (the second half, from (238, -872) on, is
  good). Keep the length with sweepers instead of straights. Check cut depth so the scar stays under about 3 m (the E33
  geometry tests show the method), and paint cut faces `rock` with snow on the top edge instead of flat grey gravel.
- **Severity:** polish · **Type:** spirit

### 18. Capwood reads as a lawn with toadstools, not a forest
- **What:** The toadstools stand evenly spaced on bright, open daisy meadow under full sky (`ring`, `cwInside`, `hut`,
  `ford2`). There is no undergrowth, no moss, no fallen logs, no shade, and the giant caps are few. The lore says "tall
  enough that gnomes walk under the caps", but most caps are 2-4 m.
- **Where:** `capwood/forestPlan.ts` (scatter density, size mix, KEEP radii); ground paint in the site.
- **Why it matters:** L17 asked for "a toadstool forest", and it should feel like stepping into another world.
- **Proposed fix:** Double the density in the core with clumps (3-7 stems) rather than even spacing, and more 8-12 m
  giants so the caps close overhead in places. Paint the floor darker: a moss and leaf-litter paint kind (a forest floor
  inside the site, bright meadow only in the clearings and at the Great Ring). Add fallen half-buried logs (the
  woodpile lore), fern and moss tufts, and a light mist or fog-density bump inside the site. Keep the race road's
  sightlines with the existing keep-outs.
- **Severity:** polish · **Type:** spirit

### 19. The night glow is opaque mint balls, not a faint glow
- **What:** At `?time=night` every cap gets an additive sphere shell (`capwood/forest.ts:103-116`, opacity 0.15). The
  shells overlap and stack into solid pale-green balls that hide the caps (`nightRing`). The lore (R-192) says the caps
  "glow faintly after dark", with the Great Ring the brightest.
- **Where:** `capwood/forest.ts` glow `InstancedMesh`.
- **Why it matters:** This is the forest's signature moment, and it currently looks like a rendering error.
- **Proposed fix:** Drop the sphere shells. Use an emissive tint on the cap underside and gills (vertex colour or a
  second emissive material on the merged caps), plus a few soft billboard sprites under the Great Ring only. Or shrink
  the shells to the cap's underside and cut the opacity to about 0.05, using the cap colour, not pale mint.
- **Severity:** polish · **Type:** craft

### 20. The Great Ring is a flat dark-green blob
- **What:** The ring of dark grass is a uniform dark-green flat shape that reads as a shadow or a hole. The ring's
  toadstools look like the rest of the forest (`ring`).
- **Where:** `capwood/forestPlan.ts` (Great Ring decal and its toadstools).
- **Why it matters:** It is a named landmark with an achievement.
- **Proposed fix:** Make the ring a thin annulus (1.5-2 m wide) of darker, lusher grass with a mottled edge. Ring it with
  small, uniform, pale-capped toadstools in a clear circle (the folk image of a fairy ring), and leave the inside lighter
  meadow.
- **Severity:** polish · **Type:** craft

### 21. The Gill Ford is a dark rectangle, not water
- **What:** At the Gill Ford the "water" is a dark, translucent, straight-edged rectangle laid over the road and well
  out onto the grass. It reads as a shadow (`ford2`, `gillFord`). E14's own pass noted it ("a pale translucent sheet ...
  may want a richer water look").
- **Where:** The ford water mesh (raceTrack fords / `water.ts` ford visual).
- **Why it matters:** Water crossings are one of the three things L81 asked for.
- **Proposed fix:** Cut the sheet to the road width plus a short curved overflow, with a shaped outline instead of a
  rectangle. Use the stream water material with a light flow scroll and foam at the edges, add stepping stones on one
  side, and connect a visible stream bed (a dip with reeds) on both sides so the ford crosses something.
- **Severity:** polish · **Type:** craft

### 22. The run's road-edge seam and the meadow trenches
- **What:** Where the Capwood Run crosses flat meadow, the ribbon leaves the road about 0.5-1 m below grade with steep
  grass banks, like a dug channel (`run2Hair`). A thin bright yellow-green line runs along the road edges (`gillFord`,
  `runMid`).
- **Where:** `raceTrack/trackDef.ts` ribbon relief (`fade`, `shoulder`) for `capwood-run`; terrain/road paint blend.
- **Why it matters:** This is the small roughness the user's "hand-crafted" ask is about.
- **Proposed fix:** Widen `fade` on flat ground so the road sits flush. Blend the verge paint (dirt to grass dither)
  instead of the hard bright edge.
- **Severity:** nit · **Type:** craft

### 23. Paddock clutter on the Fells snow
- **What:** Small crates and hay bales are scattered one at a time across the snow around the paddock with no
  arrangement (`paddock`). They read as litter.
- **Where:** `capwood/runPlan.ts` (paddock dressing) or the Fells' scatter.
- **Why it matters:** Small, but it is the first view of the rally.
- **Proposed fix:** Group them: a stacked bale wall along the grid, a tyre stack, crates by the pavilion.
- **Severity:** nit · **Type:** craft

### 24. Lore: Capwood's caps are "grey on top", but the game has red, orange and brown caps
- **What:** `apocrypha/capwood.md`: "Pink under the cap, grey on top." The game's caps are red, orange, maroon and
  brown (all Capwood shots).
- **Where:** Lore entry vs `capwood/forestPlan.ts` tints.
- **Why it matters:** It is a direct contradiction between lore and game.
- **Proposed fix:** Change the saying to match the game (for example "Red on top, pink beneath. Never eat one ...").
  Under R-236, the game wins.
- **Severity:** nit · **Type:** craft

---

## The Hatbrim, Mittenholt and the High Tarn

### 25. The Keyhole looks like a concrete footbridge, not a rock arch
- **What:** The arch is an 18 m flat box lintel on box pillars 12.5 m tall, standing on the road bed of a 25 m-deep
  gorge. Its top floats halfway up the cut and does not meet the gorge rims. Flat dark grey with a green underside, it
  reads as an overpass (`keyhole`, `phoneKey`).
- **Where:** Prefab `keyhole-arch` (`packages/prefabs/src/catalog/gta-mountain-places.ts:105`); `mountainRoutes/spinePlan.ts`
  (`ARCH_SCALE 1.1`).
- **Why it matters:** The Keyhole is the Spine Cut's named landmark and its achievement. The lore calls it "a rock arch
  left standing over the road", meaning part of the ridge.
- **Proposed fix:** Rebuild the arch from irregular stacked rock blobs (balls and rotated boxes in the stone, slate and
  moss palette) with a curved soffit. Scale it (about 2.2) or set it higher so the lintel's top joins both gorge rims,
  so it reads as the ridge left standing. Keep the 8.5 m clearance. Put the ribbon and nest on top where the camera sees
  them.
- **Severity:** polish · **Type:** craft

### 26. The High Tarn is a rectangle
- **What:** The tarn's water is a 130 x 80 m axis-aligned rectangle (`north-highlands.level.json` marker `water/high-tarn`
  `w`/`d`). The minimap shows a perfect blue rectangle, and the shore runs straight (`tarn`, `tarnLay`).
- **Where:** `data/levels/north-highlands.level.json` `water/high-tarn`; the water body builder.
- **Why it matters:** A tarn is a round cirque lake. A rectangle reads as a reservoir or a pool and undercuts the place.
- **Proposed fix:** Give the water marker an ellipse or polygon shape (as other lochs use, if supported; otherwise add an
  `ellipse` option), with a shingle beach on the near shore and a rocky back wall under the Bobble.
- **Severity:** polish · **Type:** craft

### 27. Ribbon cut-and-fill leaves raw, faceted grey walls along the Brim Gap Road
- **What:** Below the lower hairpins the fill and cut are large flat grey faceted slopes, with big flat polygons visible
  from the band road (`passHair`). The snow on Old Pate is in clean horizontal bands that follow the terrace steps.
- **Where:** Ribbon relief for `brim-gap-road`; slope paint (`gravel` above 0.3 slope).
- **Why it matters:** The pass is meant to feel like a hand-made mountain road. Raw cut faces make it look generated.
- **Proposed fix:** Paint cut faces `rock` with a darker band and scree at the toe. Scatter `scree-pile` and boulders on
  the fills (outside the road). Use drystone retaining walls on the tallest fills at the hairpins. Add a noise wobble to
  the snow line instead of the pure height threshold.
- **Severity:** polish · **Type:** craft

### 28. The Brim Walk and the summit pads look bulldozed
- **What:** On the Bobble the 2.5 m trail and the summit platform pad cut flat brown rectangles and steps into the snow
  dome (`register`). The trail reads as a vehicle track, not a footpath, and the "yard's highest point" ends in a
  levelled lot.
- **Where:** `brim-walk` ribbon (`width`, `shoulder`, `fade`); `defs/hatbrimPads.ts` `summit-platform`.
- **Why it matters:** The walk is the quiet, hand-made route. It should feel trodden, not cut.
- **Proposed fix:** Narrow the paint to about 1.2 m with a worn-snow (`trodden snow`) paint on top rather than dirt, keep
  the relief shallow (`fade` wide, cut at most 0.3 m), make the summit pad small and round, and pile the cairn on
  natural ground.
- **Severity:** polish · **Type:** craft

### 29. The Top Hat lookout looks like a car park
- **What:** The lookout pad is dark asphalt with white edge lines (`cafeView`). It reads as parking, not a terrace.
- **Where:** `defs/hatbrimPads.ts` (`cafe-terrace`), pad surface.
- **Why it matters:** It is the money view of the whole Hatbrim.
- **Proposed fix:** Flagstone or gravel paint on the terrace, a timber rail on the drop side, the telescope and the
  bench at the edge, and no road markings.
- **Severity:** nit · **Type:** craft

### 30. Two photographers waiting for the same shot, 1 km apart
- **What:** Capwood's photographer at the Great Ring ("waiting for the caps to glow in one frame") and Snapper Lensley
  at the tarn lay-by ("Forty photos of the tarn. Same tarn. Different clouds.") are the same character beat.
- **Where:** `capwood/forestPlan.ts:127-132`; `mountainRoutes/brimGapPlan.ts:291`.
- **Why it matters:** Repetition in one region is what makes a world feel generated.
- **Proposed fix:** Keep Snapper, who has a name and a line. Turn the Capwood spot into something only Capwood has, for
  example a spore-sweeper's abandoned broom and a jar of collected glow, or an HOA surveyor fined mid-measurement.
- **Severity:** nit · **Type:** spirit

### 31. Running gags are too dense in the Hatbrim and Mittenholt: "41", "two hats", "since Tuesday"
- **What:** Within about 1 km: "FOUND: 41 left mittens", "Sheep: 41", "BUNS: 41", "ear tag, no. 41", "Sheep 41 is
  thinking about it". "Two hats" appears in "Two hats essential", "Hats: two", "Wear two hats" (twice) and the lore's
  "Two hats, one spare". "Back in five (since Tuesday)" at Theo's is repeated as "BACK IN 5 MINS (WENT FOR HELP)
  (TUESDAY)" at the camper hairpin.
- **Where:** `living/hamletMittenholt.ts:187`, `living/highTarn.ts`, `mountainRoutes/brimGapPlan.ts:82-83,160,242`,
  `mountainRoutes/hatbrimPlan.ts:170`, `mountainRoutes/spinePlan.ts:173`, `winter/pond.ts`.
- **Why it matters:** A running gag works when it is rare. Five in one valley turns it into a tic.
- **Proposed fix:** Keep "41" on the sheep (tag and tally) and Velma's buns. Change the mittens count, and keep "two
  hats" on one road sign and the lore. Rewrite the camper's note (for example "WENT FOR HELP. HELP WENT TOO.").
- **Severity:** nit · **Type:** spirit

### 32. Lore: "no shops on the Rise", but the Top Hat café sells tea and buns
- **What:** `apocrypha/snowcap-rise.md` Everyday: "Shops. None on the Rise itself: the Lodge ... sells the cocoa,
  Mittenholt sells nothing". The Top Hat on Brim Gap (R-230s) serves Gap Tea and Hairpin Buns.
- **Where:** `docs/lore/entries/apocrypha/snowcap-rise.md`.
- **Why it matters:** It is a small contradiction that the lore check will not catch.
- **Proposed fix:** Add "and Velma Crown's Top Hat at Brim Gap, which sells tea, buns and the view" to the Everyday line.
  Also refresh the "In the games" region bounds (z to -1800 since the second expansion).
- **Severity:** nit · **Type:** craft

### 33. Map blip labels mix "the" and "The"
- **What:** The blips are labelled 'the Capwood Run' (`capwood/run.ts:137`), 'the High Tarn' (`living/config.ts`), but
  'The Top Hat', 'The Bobble', 'The Keyhole' (`mountainRoutes/*.ts`).
- **Where:** As listed.
- **Why it matters:** The labels sit side by side on the big map.
- **Proposed fix:** Pick one style for map labels (sentence-start capital "The ..."). If the decider prefers it, a tiny
  `labelCase()` helper in the map layer can apply it.
- **Severity:** nit · **Type:** craft

---

## What works (keep it)

- The sign writing in every area ("GRADIENT: YES", "HOLD ON. LET GO. IN THAT ORDER.", "THIN ICE: NONE", the Warden's
  fines, "FALLING ROCKS (it is the goat)", "Twinned with nowhere, by request").
- The Spine Cut gorge: walls, verges, marker posts and traffic in the cut. Only the arch (25) lets it down.
- The World's Edge: the Tall-One fence as the horizon, with Cass Pedal's line, is the best "small world" moment in the
  group.
- The Top Hat lookout view over Mittenholt, the switchbacks and Pinwheel Ridge.
- Mittenholt's green, cairns, phone box and woodpiles: a believable hamlet.
- Calm bears in deck chairs, and the yawn call.

## Not checked

Sound and ambience (headless, no audio). Real touch controls: the headless browser has no touch, so the touch steer
buttons on rides were not seen (see 11). Online sync of rides. Ski and sled feel by hand: the screenshot tool cannot
steer, but `?winter=` auto-runs finished cleanly. The Hatband shelf drive-along and Brim Gap traffic on hairpins (E33's
tests cover these).
