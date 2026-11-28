# G5 The east: editorial review, round 1

Editor: G5 (Opus). Branch `gta-batch-3` at 6d217da8. Covers Rootwell University (quad, halls, interiors), the Anthill,
its observatory and Dean's Leap, Rootwell Field, Pinwheel Ridge, the Rutbottom Dirt Bowl and the Knobbly, the Dust Flats
edge and the east edge (Rootwell Field Station slot). Gnomazon FC-1 sits at (300, 97) on the west edge of the Dust Flats,
not in the east, so it is left to G8.

Method: dev server, about 60 headless screenshots (desktop 960x600, phone 390x844, noon and night), a scripted drive off
Dean's Leap in a lowrider, two scripted runs down the Rutbottom start straight on the Knobbly, the four Rootwell interiors
via `?interior=`, terrain height probes round the Anthill summit and along `trail/anthill-road`, and reading `src/campus/*`,
`src/rutbottom/*`, `raceTrack/defs/rutbottom.ts`, the prefab catalogue and the lore entries. Evidence images:
[shots/G5/](shots/G5/). Not done: no real phone or touch, no full lap of Rutbottom (I could not steer through corners
from a script), no flight from Rootwell Field, quests 41/42/45/46 were not played (G11 owns them).

## Verdict

The east has good bones and good jokes. The signs are funny and on-lore ("THE GRASS IS STUDYING", "LANDING: OPTIONAL",
"WHOOPS (not an apology)"), the residents have lines, Dean's Leap works (39 m, "Not Termites" pops on landing), and the
Clod's pitch, the Long Shelf and the Sneaker Stands read well. It does not feel hand-crafted yet, though. Three things
let it down, and each shows up all over the region:

1. **Terrain edges.** Every steep cut or fill is painted grey rock with stair-stepped edges. The Anthill wears a 12 m
   grey cliff crown, and Rutbottom's raised corners sit on grey rock walls.
2. **Scale and emptiness.** The quad, the apron, the Bowl's infield, the Anthill's flanks and the whole Field Station
   band are large, flat and bare.
3. **Unfinished signature objects.** The pinwheels' vanes are loose sticks, the observatory is a grey drum, the jumps
   can't be seen, the Clod's back is a 50 m black wall, and the Impound has no tape.

None of this breaks the game, but together it is what makes the region feel generated rather than made. 2 blockers,
26 polish, 7 nits.

## Findings

### Landforms and terrain

**1. The Anthill wears a grey rock cliff crown.**
- **What:** the summit flatten blends from 47 m to 35 m within about 4 m (probe: S r36 = 46.7, r40 = 34.9; E r32 = 46.6,
  r40 = 35.8). The rock-slope paint turns that ring into a sheer grey cliff. From afar the mound reads as a mesa with a
  stone cap, not an ant mound. Up close a gnome who walks round the summit edge drops off a wall (`a-summit.png`, at
  1238,188, faces a 12 m rock face).
- **Where:** `OBSERVATORY.flatR` 30 with a blend of flatR+12 (campus/types.ts, the flatten stamp); `terrainPaint.ts`
  rock rule. Shots `a-road.png`, `x-mound-n.png`, `c-quads.png`, `n-obs.png`.
- **Why:** the Anthill is the east's skyline landmark, and lore and R-200 say "earth-coloured flanks". The crown is the
  first thing you see from the campus and the road.
- **Fix:** widen the blend so the summit eases into the flank (blend 25-30 m; the grade stays under the road's 20%).
  Also, or instead, exempt the `observatory-mound` site from the rock paint and paint the shoulder dirt with small
  crumbly ledges (a few `garden-rock` and dirt-clod props). Re-check that the run-up and the road end still reach the
  summit.
- **Severity:** blocker. **Type:** craft.

**2. Rutbottom's raised corners stand on grey rock walls with sawtooth edges.**
- **What:** the 'raise' relief makes 4-5 m embankments with steep faces. They are painted rock and their top edges step
  in a sawtooth. Hay bales line the lip like battlements.
- **Where:** north side of the start straight and the east loop: `b-stands.png` (1215,-560 facing N), `b-start.png`,
  `bike-1`; `raceTrack/defs/rutbottom.ts` lifts 1-3.5 m and `trackMesh` batters.
- **Why:** a dirt bowl should be all dirt: earth banks, ruts, mud. Grey quarry walls belong to a different place and look
  like a terrain bug.
- **Fix:** give raised sections a wider batter (1:2 or gentler) painted dirt or grass, not rock. Exempt the
  `dirt-track` site from rock paint. Smooth the lip so it stops stair-stepping.
- **Severity:** polish (high). **Type:** craft.

**3. Dirt and gravel patches have blocky stair-step edges.**
- **What:** painted dirt and gravel areas end in square, pixel-stepped edges on the grass: the Rutbottom gate lane, the
  Pinwheel service track start, the gravel pads round the masts and the hut, the Anthill road's verge.
- **Where:** `b-gate.png`, `r-track.png`, `r-hut.png`, `x-pin2` (mast 4 pad), `x-mound-n.png`.
- **Why:** this edge appears everywhere in the region and reads as unfinished terrain paint.
- **Fix:** feather terrain-paint borders (dither or a blend band), or round the stamp shapes. At minimum, give lanes and
  pads soft or irregular outlines.
- **Severity:** polish. **Type:** craft.

**4. The Anthill's flanks are a featureless dirt cone.**
- **What:** 120 m of uniform brown slope with nothing on it: no ant trails worn into it, no tufts, no vent holes, no
  sugar crumbs, no stones. The three doors and their ant lines are the only detail. The north door looks like a disc
  laid on the slope rather than set into it.
- **Where:** `a-side.png` (1150,150), `a-below.png`, `a-ndoor.png`; `campus/observatory.ts`.
- **Why:** "a giant ant mound where the ants still live". It should feel inhabited. Right now it is a heightmap.
- **Fix:** scatter worn ant paths spiralling to the doors (flat decal strips, like the skid strips), small vent holes
  and grit heaps, a few dropped sugar cubes on the paths, and grass tufts low on the flank. Sink the doors into a small
  cut with a lintel of packed earth.
- **Severity:** polish. **Type:** craft.

**5. The Dust Flats end at the east-band road in a ruler-straight seam.**
- **What:** sand meets lawn along one straight north-south line by the road at x ~900. There is no scrub, no transition,
  and no change in planting.
- **Where:** `x-flats.png` (850,60 facing E); region boundary east-campus / dust-flats.
- **Why:** this is the gateway to Rootwell, where "past the Dust Flats" should feel like arriving somewhere greener.
  A straight seam reads as two tiles butted together.
- **Fix:** a 40-80 m ecotone: irregular blend of the paint, sparse dry grass, a few cacti giving way to hedges, and an
  "ROOTWELL: IRRIGATED SINCE TUESDAY"-type sign.
- **Severity:** polish. **Type:** craft.

**6. Rootwell Field Station and the east edge are empty.**
- **What:** R-177 and the lore say "Rootwell reaches the east edge (Rootwell Field Station)". The `rootwell-field-station`
  slot (1600, -300, 240x300) and the band from x 1400 to the fence at 1795 are bare mown grass to a wooden fence. E31
  deferred the slot.
- **Where:** `x-fstation.png`, `x-edge.png`; sites.ts, E31 contracts.
- **Why:** a named place in canon with nothing there, and a large dead zone right next to the runway.
- **Fix:** either build a small field station (a hut, weather mast, rain gauges, a soil-core rack, a student asleep in
  a deck chair, one sign) or rewrite the lore and R-177 to say the edge is "the university's experimental meadow" and
  scatter test plots, labelled stakes and a few bee boxes. Decider: build or retcon.
- **Severity:** polish. **Type:** spirit.

### Rootwell University

**7. The quad is too big and too empty for gnome scale.**
- **What:** the quad lawn is 130 x 125 m with only the statue and a sundial in the middle. Benches, lamps and planters
  sit on the ring, and students walk the ring edges. From any side the far buildings look small and distant, and the
  middle of the picture is striped grass (`c-quadw.png`, `c-quadn.png`, `c-quads.png`).
- **Where:** `CAMPUS.quad` (types.ts), `campus/grounds.ts`, `campus/life.ts` (6 walkers, one mower).
- **Why:** a quad is the campus's living room. At 1 m gnomes this one is a parade ground, and it makes all twelve halls
  feel scattered.
- **Fix:** keep the footprint but break the lawn up: two crossing tree-lined walks (the diagonals exist as gravel,
  so plant them), a few big shade trees with students under them, a reading lawn with rugs and books, a croquet or
  hoop game, a bicycle on its side, and more idlers in groups on the lawn rather than on the ring. Planting alone would
  make it feel half the size.
- **Severity:** polish (high). **Type:** craft.

**8. The Clod shows a 50 m blank black wall to the campus.**
- **What:** the north grandstand's back (stone-dark, 6 m high, 50 m long) faces the quad and the car park. Its entrance
  is a small signpost in front of a black slab (`c-clod.png`, `c-park.png`). Inside, the pitch looks good (`y-pitch`).
- **Where:** `campus/buildings.ts` lines 66-79; prefab `rootwell-grandstand` back wall.
- **Why:** it is the largest surface on campus and it reads as a warehouse.
- **Fix:** a lighter stone back with pilasters, a "THE CLOD" lettered fascia, a turnstile gate in the middle,
  fixture posters ("ROOTWELL v. THE ANTS: POSTPONED (RENT)") and a ticket hatch.
- **Severity:** polish. **Type:** craft.

**9. Building backs and campus edges are blank.**
- **What:** seen from outside the campus (north, east), the halls show plain walls with no doors, bins, pipes, bike
  sheds or windows (`x-campusN.png`). The railing only runs 133 m each side of the gate on the west edge. Elsewhere the
  campus just stops into open lawn.
- **Where:** prefabs `rootwell-*` rear faces; `grounds.ts` railing runs.
- **Why:** players arrive from the Anthill (south), Rutbottom (north) and the runway road (east), not only through the
  gate. Lore motif: "iron railings round old learned halls".
- **Fix:** carry the railings (or a clipped hedge) round the whole site with two side gates. Dress the backs with bins,
  a kitchen door at the Trencher, a coal chute, ivy decals and window rows on the long faces.
- **Severity:** polish. **Type:** craft.

**10. The main gate is two plain pillars with taped-on paper notices.**
- **What:** lore speaks of "the gate arch: ROOTWELL UNIVERSITY". The build has two bare 3.2 m stone pillars, each with a
  1.0 x 0.7 m cream paper plate that reads like a flyer (`c-gate.png`). The drive through it has highway centre dashes
  all the way to the quad.
- **Where:** `grounds.ts` 256-270.
- **Why:** the front door of the region. It should read as an old university.
- **Fix:** an iron arch over the drive with the name in letters, carved stone plates (stone-coloured with dark text) on
  the pillars, and gate leaves swung open. Drop the centre line inside the gate (gravel or setts).
- **Severity:** polish. **Type:** craft.

**11. The Tilth Hall interior is unreadable from the door.**
- **What:** entering Tilth Hall you face a wall of dark brown tier slabs. Dr Furrow, the lectern and the "THE PHYSICS OF
  GNOMES" board are hidden behind them (`int-lecture.png`).
- **Where:** `campus/interiors.ts` `uni-lecture` (door at +z, lectern at -6, tiers between).
- **Why:** the interior's whole joke (the same lecture on repeat) is invisible on entry.
- **Fix:** rake the tiers the other way (high at the door, low at the lectern), so you enter at the top and look down
  at the professor. Or put the door at the lectern end. Lighten the wood and add the board's light.
- **Severity:** polish. **Type:** craft.

**12. The bell doesn't stop anyone.**
- **What:** lore says that at the bell the quad stops and every hat is tipped to the founder's statue. In the game the
  bell is only a sound (`life.ts` 217-220). Students and the mower carry on.
- **Why:** a cheap, very charming bit of life that is already written into canon.
- **Fix:** on `campus-bell`, every campus walker pauses 2 s, faces the statue and plays a hat-tip (the Dean's `bow`
  already exists).
- **Severity:** polish. **Type:** spirit.

**13. Night on campus is dark and lifeless.**
- **What:** at night the halls show only a few faint windows, the garden lamps throw no visible pools, and the quad is
  a black field (`n-quad.png`).
- **Why:** night play is a big part of the game (Neon Night), and the observatory quest is a night quest.
- **Fix:** lit lamp heads with ground glow decals along the ring and the drive, warm windows in the dorm and the
  library, and a lit clock face on Plumbob Hall.
- **Severity:** polish. **Type:** craft.

**14. The Bedstraw House door looks broken.**
- **What:** the dorm's door shows a lighter translucent rectangle above it and dithered noise at its foot
  (`c-bedstraw.png`, 1030,-292 facing N). It looks like the door plate is fighting the frame, or the camera fade is
  applied to the door.
- **Where:** prefab `rootwell-dorm` at scale 2, door plate (buildings.ts PLATE) at 0.25 proud.
- **Why:** a visible artefact right where players walk.
- **Fix:** check for coplanar door, frame and plinth faces in the prefab (z-fight scan at close range), and give the
  door its own depth step.
- **Severity:** polish. **Type:** craft.

**15. The sugar store vignette is hard to find.**
- **What:** the store (sacks, cubes, ant line) is tucked in the 19 m gap between the Trencher's back wall and the
  Cloche, with its sign on the Trencher's back wall. From the quad nothing points to it. Walking round the Trencher's
  south end, I faced a brown wall (`c-sugar.png`).
- **Why:** it is both a quest spot (sq-anthill-rent, m46 p2) and the best vignette on campus.
- **Fix:** a small "SUGAR STORE (ANTS ONLY) →" finger sign at the Trencher's south-east corner, and the ant line
  continuing out of the gap toward the Anthill so it leads the eye.
- **Severity:** nit. **Type:** craft.

**16. The car park is empty.**
- **What:** 40 marked bays, no cars (`c-park.png`).
- **Fix:** park 4-6 parked civilian cars (`parking.ts` / parked vehicles), including the Dean's car in a DEAN bay, which
  sets up the "plenty have seen his car" Dean's Leap joke.
- **Severity:** nit. **Type:** craft.

**17. The lodge's name plate is redundant, and the giant cheque isn't giant.**
- **What:** the lodge's name plate reads "THE DEAN'S LODGE / THE DEAN'S HOUSE". The vignette called the "giant HOA
  cheque" in the screenshot pass is a 0.9 x 0.5 m plate on a table.
- **Fix:** give the lodge role a joke ("THE DEAN'S LODGE / RESIDENCE AND APOLOGIES"), and make the cheque a 2.4 x 1.1 m
  presentation cheque leaning on the table.
- **Severity:** nit. **Type:** craft.

**18. The founder's sundial is a giant witch's hat.**
- **What:** `quad-sundial` (size 1.6) beside the statue reads as a dark green cone, as tall as a gnome
  (`y-statue.png`, right edge). The statue's plumb bob doesn't read at any distance.
- **Fix:** check the sundial prefab's proportions (a low plinth and a flat dial) and enlarge the plumb bob, or give it
  gold.
- **Severity:** nit. **Type:** craft.

### The Anthill, the observatory, Dean's Leap

**19. The observatory dome is a dull grey drum.**
- **What:** the landmark on top of the landmark reads as a grey octagonal tank with a flat lid and a small dark box on
  top (`a-obsdoor.png`). It has no sign by the door, no slit glow, and no colour.
- **Where:** prefab `anthill-observatory`; `campus/observatory.ts`.
- **Why:** it should be the postcard of the east, visible from the campus and the road.
- **Fix:** a white or verdigris copper hemisphere with a visible open slit and the telescope tube poking out, lit at
  night, a stone drum with a door canopy, and a name plate on the drum.
- **Severity:** polish (high). **Type:** craft.

**20. Dean's Leap looks like a generic stunt ramp.**
- **What:** the ramp is the standard black wedge with cyan neon edges and yellow stripes (`leap-2`, `x-mound-n.png`).
  The jump itself works (39 m, achievement fires).
- **Why:** lore says it was "a ramp cut for a stunt nobody remembers" and the Dean claims it was a "wheelchair ramp for a
  very ambitious professor". The neon kit look throws away that story.
- **Fix (decider):** keep the stunt-ramp colour coding if it is a game-wide readability rule. Otherwise build it from
  old planks and packed earth, with a faded painted wheelchair symbol and a brass plate ("DONATED BY THE CLASS OF ——").
- **Severity:** polish. **Type:** spirit.

**21. Paying the rent changes nothing in the world.**
- **What:** `sq-anthill-rent` ends "The door is open. The lights are on." But the north door stays shut, the "SUGAR RENT
  OVERDUE (AGAIN)" post stays up, and there are no lights below. `ant-door` has no open state (grep: nothing reads the
  quest).
- **Where:** `quests/rootwellQuests.ts` 127; `campus/observatory.ts` 148-160.
- **Why:** the world doesn't answer the player. That is exactly the "growing pain" kind of gap.
- **Fix:** after the quest, swap to an open door with a warm glow inside, remove the invoice, and put a "PAID" stamp
  with a single dot (lore: "the ants sign with a single dot").
- **Severity:** polish. **Type:** craft.

**22. Lore details on the mound are missing or mismatched.**
- **What:**
  - Lore says students leave a sugar cube on the lowest step at night "for the night shift": not in the world.
  - The screenshot pass calls Sextant's kit a "deck chair": it is a bench.
  - Her "star charts" are `essay-page` props.
  - The ramp is 6 m high where the lore says about 4.5 m.
- **Fix:** a cube on the south door's step (night only), a real deck chair, rolled charts (paper cylinders), and
  align the lore's ramp height to the build.
- **Severity:** nit. **Type:** craft.

### Rootwell Field

**23. Plates float above signposts across E13 and E14.**
- **What:** text plates 1.4-2.4 m wide are hung at 1.0-1.9 m beside the 1 m `signpost` prefab (a thin stick with two
  little arrow boards). They hover in the air above or in front of the post, and the arrows poke out behind them.
  Seen at:
  - "OVERRUN (PROFESSOR'S PARKING)" (`f-north.png`)
  - "PINWHEEL RIDGE / TURFTON'S LIGHTS…" (`r-track.png`)
  - "THE CLOD" (`c-clod.png`)
  - the Anthill observatory, Dean's Leap, "THIS WAY DOWN", "LANDING: OPTIONAL", "LEVEL LINE: NEARLY" and the north
    door invoice
  - the field's tower, students' and records signs
  - the three Pinwheel signs and the HOA stakes

  `field.ts` `plateOn` also passes an absolute y (1.9) instead of `heightAt + y`. It only works because the field is at
  0 m.
- **Where:** `campus/field.ts` 90-94, 177-233; `campus/observatory.ts` 28-33 and all `signpost` uses;
  `campus/windFarm.ts` 107-138; `campus/buildings.ts` 75-78.
- **Why:** this is the single most repeated "unfinished" look in the region, and fixing it is cheap.
- **Fix:** use a proper board prefab: a two-leg notice board, or the `notice-board` / `speedway-banner` already used
  elsewhere. Or add a post of the plate's height (two legs for plates over 1.2 m wide) and drop the arrow signpost.
  Add `heightAt` in `field.ts`.
- **Severity:** polish (high). **Type:** craft.

**24. The apron is a bare concrete plain.**
- **What:** 47 x 160 m of flat grey with one Crop Duster in view, a fuel trailer and a wing on crates far off
  (`f-apron.png`). It has no tie-downs, chocks, painted taxi lines, cones, tool carts, hangar clutter or people
  between planes.
- **Fix:** yellow taxi and parking lines (decal layer), wheel chocks and tie-down ropes at each plane spot, a tool cart,
  a fuel bowser by the hangar, an oil-stained patch, and one student pushing a plane by hand.
- **Severity:** polish. **Type:** craft.

**25. The tower and runway at night are too dim.**
- **What:** at night the runway edge lights are tiny dots, the tower cab is dark (`n-field.png`), and the hangar is
  unlit.
- **Why:** R-201 makes the edge lights a feature, and m46 ends with a flight from here.
- **Fix:** brighter edge-light sprites with a glow halo, a lit tower cab with a figure in it, a hangar door light, and a
  rotating beacon.
- **Severity:** polish. **Type:** craft.

### Pinwheel Ridge

**26. The pinwheel rotors look like loose boxes.**
- **What:** each rotor is eight separate 0.8 m-wide sticks: four roots and four "curled tips" at angles, with gaps
  between them. From below and close up they read as scattered planks round a pin, not a garden pinwheel's four folded
  triangular sails (`pinup-0.png`). E13 already noted this.
- **Where:** `packages/prefabs/src/catalog/gta-pinwheel-campus-props.ts` `giant-pinwheel-rotor`.
- **Why:** this is the ridge's whole identity. Lore says "giant garden pinwheels", and they are a skyline element from
  Turfton.
- **Fix:** rebuild the rotor as four broad triangular sails (thin wedges or custom triangles) folded toward the pin,
  each with a contrasting inner face (tint and white). Make the pin cap larger.
- **Severity:** blocker. **Type:** craft.

**27. The ridge is grey scree and the masts are bare grey poles.**
- **What:** the crest and the south flank are all rock-paint gravel (`r-ridgeE.png`, `x-pin.png`). The masts are plain
  grey cylinders with red bands, and their plinths are square concrete slabs. From the road below the ridge looks like a
  quarry with poles.
- **Fix:** grass the crest where the slope allows (see #1 and #2: the rock rule), and paint the masts white per R-202
  ("white-and-red mast"; they render grey). Add a small cable trench line between the plinths and wind-bent grass.
- **Severity:** polish. **Type:** craft.

**28. Ridge signs disagree with the lore, and Ragwort is "he" in prefab text.**
- **What:**
  - Lore signs: hut "KNOCK TWICE. I CANNOT HEAR ONCE.", substation "HIGH VOLTAGE. HIGHER WIND.", and the HOA tag
    "PROPERTY OF THE ASSOCIATION" with "(IT IS MY CABLE. - R.C.)" scratched under it.
  - The build uses "CONTROL HUT / KNOCK. LOUDLY. (WIND)", "HIGH WIND / HOLD ON TO EVERYTHING INCLUDING OPINIONS" and
    "PROPERTY OF THE HOA / DO NOT UNPLUG (WE WILL KNOW)" (`windFarm.ts` 109, 133, 139).
  - Ragwort is "she" in lore, but `gta-campus-gear.ts` 96-97 (pinwheel-hat) and `gta-pinwheel-campus-props.ts` 13 (mast)
    say "he".
- **Why:** consistency with canon. The lore's "(IT IS MY CABLE. - R.C.)" is also the better joke, because it gives
  Ragwort a voice.
- **Fix:** use the lore texts (keep "HOLD ON TO EVERYTHING…" as an extra sign), and fix the pronouns.
- **Severity:** polish. **Type:** craft.

**29. The pinwheel names clash with the lore and with their own colours.**
- **What:** lore says "every pinwheel has a name known only to her", but all ten masts carry name plates. Pinwheel 6 is
  plated "BIG RED" but is blue (colour cycles red, yellow, blue; index 5 is blue). The rotor's examine text names vanes
  "Red One" and "Yellow Two".
- **Fix (decider):** either keep plates and amend the lore ("she paints the names on; only she knows why"), or remove
  them. If kept, fix BIG RED (swap with a red one).
- **Severity:** nit. **Type:** spirit.

### Rutbottom Dirt Bowl and the Knobbly

**30. The jumps don't throw you, and you can't see them.**
- **What:** on the Knobbly at full speed (26.9) down the start straight, the bike went over Clary's Hump (s 150,
  rise 1.5 m) with y going from 2.8 to 3.0 to 2.9. It didn't leave the ground, and no lip, colour change or marker shows
  where it is (`bike-hump.png`). The whoops are 0.3 m amplitude: barely felt. Lore promises "two jumps … named for the
  marshal and the rival".
- **Where:** `raceTrack/defs/rutbottom.ts` 41-49.
- **Why:** the user asked for a bumpy track with big banked turns. The jumps are the fun, and right now they are
  invisible.
- **Fix:** raise the jumps to about 2.5-3 m with a sharper up-ramp (6-7 m) so a full-speed Knobbly gets 0.6-1 s of
  air. Mark each lip with a tyre-wall face, a painted white lip line and a named board ("CLARY'S HUMP / she built it,
  you jump it"). Whoops amp 0.5. Tune with a scripted lap and an airtime readout.
- **Severity:** polish (high). **Type:** craft.

**31. The track surface is a smooth brown ribbon.**
- **What:** one flat brown with no ruts, tyre lines, puddles, darker wet patches in the dips or loose clods
  (`bike-5`, `bike-7`). Hay bales every few metres make every stretch look the same.
- **Why:** "rough on purpose", "mud in the hat". It needs texture to read as dirt and to show speed.
- **Fix:** rut decals along the racing line, darker mud in Mudguard Dip with a splash effect, scattered clods. Break
  the bale rows with tyre walls, sponsor boards and marshal posts at intervals.
- **Severity:** polish. **Type:** craft.

**32. Corner names aren't in the world.**
- **What:** lore names every corner: Hay Fever, the Berm, Gravel Hat, Mudguard Dip, Cowpat Corner, Last Orders. Only
  "THE BERM REMEMBERS" has a board.
- **Fix:** a small hand-painted board at each corner's apex, and at Cowpat Corner a cow-pat decal.
- **Severity:** polish. **Type:** craft.

**33. The Impound has no tape and no taped rides.**
- **What:** lore (rutbottom-impound.md) and m42 banter ("Taped up like a parcel") describe six Carburettor rides taped
  in the pits with beige HOA tape reading "IMPOUNDED. DO NOT TOUCH. THIS MEANS YOU." The world has none of it. m42's
  objective spawns one plain lowrider (`42-rutbottom-impound.ts` 57-62), and "IMPOUNDED" appears nowhere in code.
- **Why:** a story set piece the outline and lore call for (standing decision: scripted set pieces). The
  win-then-drive-out beat loses its picture.
- **Fix:** while m42 is open, place six lowriders in the pits wrapped in beige tape bands (box strips) with the tape
  text. The quest car is one of them. After m42, the tape is gone and one strip hangs on Clary's tower as the winner's
  scarf. Coordinate with G11.
- **Severity:** polish (high). **Type:** craft.

**34. The gate is just a lane, and the infield is an empty field.**
- **What:** the "gate" from the east-band road is a dirt lane between a sponsor board and bunting, with no gateposts
  and no hut (`b-gate.png`). The 300 x 150 m infield is bare lawn with a few tyre stacks (`b-infield.png`). The Bowl is
  not a named map POI either (Rootwell's places are, in `mapPois.ts` 76-80).
- **Fix:** a timber gate frame with the "RUTBOTTOM DIRT BOWL" board on it and a ticket barrel. In the infield, parked
  trailers and vans of the Carburettors' summer camp (lore: "summer home"), a tent, a washing line and a campfire ring.
  Add `at('raceway', 1200, -650, 'Rutbottom Dirt Bowl')` (or the right kind).
- **Severity:** polish. **Type:** craft.

**35. The bike-wash bucket is full of pink paint.**
- **What:** `glaze-stage-bucket` (Pay 'n' Glaze's paint bucket) is reused as the bike wash, with pink contents
  (`b-pits` area). The lore says "a bucket for the bike wash".
- **Fix:** tint the liquid muddy brown or water, or use a plain bucket and hose.
- **Severity:** nit. **Type:** craft.

## Cross-group notes (for other editors, not counted)

- G9: `?weather=off` still shows the "Blustery" chip and drifting square particles. The particles read as floating grey
  squares in almost every shot.
- G9: the achievement toast and the "INSANE STUNT BONUS" banner stack over the minimap at the same moment (`leap-air.png`).
- G7: the Dean's Leap flight felt short for a 6 m ramp at 25 m/s (39 m), but that may be intended.

## Counts

- Blockers: 2 (#1 Anthill cliff crown, #26 pinwheel rotors).
- Polish: 26.
- Nits: 7 (#15, #16, #17, #18, #22, #29, #35).
- Craft: 31.
- Spirit: 4 (#6, #12, #20, #29).
