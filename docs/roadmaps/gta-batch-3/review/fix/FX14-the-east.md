# FX14 The east: Rootwell campus, the Anthill, Rootwell Field, Pinwheel Ridge, Rutbottom
Wave: 5 · Depends on: FX01, FX04, FX06 · Kind: Fix (content)
Findings: 31 (G5#4, G5#5, G5#6, G5#7, G5#8, G5#9, G5#10, G5#11, G5#12, G5#13, G5#14, G5#15, G5#16, G5#17, G5#18, G5#19, G5#21, G5#22, G5#23, G5#24, G5#25, G5#26, G5#27, G5#28, G5#29, G5#30, G5#31, G5#32, G5#33, G5#34, G5#35) · Decisions: D17, D22, D23

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The east looks made by hand: a lived-in quad with a bell that stops people (D23), dressed backs and gates, a readable lecture hall, a lit campus at night, a real observatory and ant paths, a Field Station (D17), pinwheels that look like pinwheels, an apron and a lit runway, and a dirt bowl with ruts, names and jumps that throw you.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- campus/** (grounds.ts, buildings.ts, life.ts, interiors.ts, observatory.ts, observatoryInterior.ts, field.ts, windFarm.ts, story.ts)
- rutbottom/**, raceTrack/defs/rutbottom.ts (jumps, surface dressing)
- quests/rootwellQuests.ts (after-quest world swap)
- parking.ts (campus car park only)
- sites.ts (the field station site)
- packages/prefabs: `giant-pinwheel-rotor`, `anthill-observatory`, `rootwell-*`, `rootwell-grandstand`, the sundial
- docs/lore east entries

### Findings (31)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G5#4** (polish, craft · **should**) The Anthill's flanks are a featureless dirt cone.
  - What: 120 m of uniform brown slope with nothing on it: no ant trails worn into it, no tufts, no vent holes, no sugar crumbs, no stones. The three doors and their ant lines are the only detail. The north door looks like a disc laid on the slope rather than set into …
  - Where: `a-side.png` (1150,150), `a-below.png`, `a-ndoor.png`; `campus/observatory.ts`.
  - Editor's fix: scatter worn ant paths spiralling to the doors (flat decal strips, like the skid strips), small vent holes and grit heaps, a few dropped sugar cubes on the paths, and grass tufts low on the flank. Sink the doors into a small cut with a lintel of packed earth.
  - Re-check: `review/shots/G5/`: `a-side.png`, `a-below.png`, `a-ndoor.png`
- **G5#5** (polish, craft · **should**) The Dust Flats end at the east-band road in a ruler-straight seam.
  - What: sand meets lawn along one straight north-south line by the road at x ~900. There is no scrub, no transition, and no change in planting.
  - Where: `x-flats.png` (850,60 facing E); region boundary east-campus / dust-flats.
  - Editor's fix: a 40-80 m ecotone: irregular blend of the paint, sparse dry grass, a few cacti giving way to hedges, and an "ROOTWELL: IRRIGATED SINCE TUESDAY"-type sign.
  - Re-check: `review/shots/G5/`: `x-flats.png`
- **G5#6** (polish, spirit · **should**, D17) Rootwell Field Station and the east edge are empty.
  - What: R-177 and the lore say "Rootwell reaches the east edge (Rootwell Field Station)". The `rootwell-field-station` slot (1600, -300, 240x300) and the band from x 1400 to the fence at 1795 are bare mown grass to a wooden fence. E31 deferred the slot.
  - Where: `x-fstation.png`, `x-edge.png`; sites.ts, E31 contracts.
  - Editor's fix: either build a small field station (a hut, weather mast, rain gauges, a soil-core rack, a student asleep in a deck chair, one sign) or rewrite the lore and R-177 to say the edge is "the university's experimental meadow" and scatter test plots, labelled stakes and a few bee boxes. Decider: build or retcon.
  - Decision: D17 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G5/`: `x-fstation.png`, `x-edge.png`
- **G5#7** (polish, craft · **should**) The quad is too big and too empty for gnome scale.
  - What: the quad lawn is 130 x 125 m with only the statue and a sundial in the middle. Benches, lamps and planters sit on the ring, and students walk the ring edges. From any side the far buildings look small and distant, and the middle of the picture is striped …
  - Where: `CAMPUS.quad` (types.ts), `campus/grounds.ts`, `campus/life.ts` (6 walkers, one mower).
  - Editor's fix: keep the footprint but break the lawn up: two crossing tree-lined walks (the diagonals exist as gravel, so plant them), a few big shade trees with students under them, a reading lawn with rugs and books, a croquet or hoop game, a bicycle on its side, and more idlers in groups on the lawn rather than on the ring. Planting alone would make it feel half the size.
  - Re-check: `review/shots/G5/`: `c-quadw.png`, `c-quadn.png`, `c-quads.png`
- **G5#8** (polish, craft · **should**) The Clod shows a 50 m blank black wall to the campus.
  - What: the north grandstand's back (stone-dark, 6 m high, 50 m long) faces the quad and the car park. Its entrance is a small signpost in front of a black slab (`c-clod.png`, `c-park.png`). Inside, the pitch looks good (`y-pitch`).
  - Where: `campus/buildings.ts` lines 66-79; prefab `rootwell-grandstand` back wall.
  - Editor's fix: a lighter stone back with pilasters, a "THE CLOD" lettered fascia, a turnstile gate in the middle, fixture posters ("ROOTWELL v. THE ANTS: POSTPONED (RENT)") and a ticket hatch.
  - Re-check: `review/shots/G5/`: `c-clod.png`, `c-park.png`
- **G5#9** (polish, craft · **should**) Building backs and campus edges are blank.
  - What: seen from outside the campus (north, east), the halls show plain walls with no doors, bins, pipes, bike sheds or windows (`x-campusN.png`). The railing only runs 133 m each side of the gate on the west edge. Elsewhere the campus just stops into open lawn.
  - Where: prefabs `rootwell-*` rear faces; `grounds.ts` railing runs.
  - Editor's fix: carry the railings (or a clipped hedge) round the whole site with two side gates. Dress the backs with bins, a kitchen door at the Trencher, a coal chute, ivy decals and window rows on the long faces.
  - Re-check: `review/shots/G5/`: `x-campusN.png`
- **G5#10** (polish, craft · **should**) The main gate is two plain pillars with taped-on paper notices.
  - What: lore speaks of "the gate arch: ROOTWELL UNIVERSITY". The build has two bare 3.2 m stone pillars, each with a 1.0 x 0.7 m cream paper plate that reads like a flyer (`c-gate.png`). The drive through it has highway centre dashes all the way to the quad.
  - Where: `grounds.ts` 256-270.
  - Editor's fix: an iron arch over the drive with the name in letters, carved stone plates (stone-coloured with dark text) on the pillars, and gate leaves swung open. Drop the centre line inside the gate (gravel or setts).
  - Re-check: `review/shots/G5/`: `c-gate.png`
- **G5#11** (polish, craft · **should**) The Tilth Hall interior is unreadable from the door.
  - What: entering Tilth Hall you face a wall of dark brown tier slabs. Dr Furrow, the lectern and the "THE PHYSICS OF GNOMES" board are hidden behind them (`int-lecture.png`).
  - Where: `campus/interiors.ts` `uni-lecture` (door at +z, lectern at -6, tiers between).
  - Editor's fix: rake the tiers the other way (high at the door, low at the lectern), so you enter at the top and look down at the professor. Or put the door at the lectern end. Lighten the wood and add the board's light.
  - Re-check: `review/shots/G5/`: `int-lecture.png`
- **G5#12** (polish, spirit · **should**, D23) The bell doesn't stop anyone.
  - What: lore says that at the bell the quad stops and every hat is tipped to the founder's statue. In the game the bell is only a sound (`life.ts` 217-220). Students and the mower carry on.
  - Editor's fix: on `campus-bell`, every campus walker pauses 2 s, faces the statue and plays a hat-tip (the Dean's `bow` already exists).
  - Decision: D23 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#13** (polish, craft · **should**) Night on campus is dark and lifeless.
  - What: at night the halls show only a few faint windows, the garden lamps throw no visible pools, and the quad is a black field (`n-quad.png`).
  - Editor's fix: lit lamp heads with ground glow decals along the ring and the drive, warm windows in the dorm and the library, and a lit clock face on Plumbob Hall.
  - Re-check: `review/shots/G5/`: `n-quad.png`
- **G5#14** (polish, craft · **should**) The Bedstraw House door looks broken.
  - What: the dorm's door shows a lighter translucent rectangle above it and dithered noise at its foot (`c-bedstraw.png`, 1030,-292 facing N). It looks like the door plate is fighting the frame, or the camera fade is applied to the door.
  - Where: prefab `rootwell-dorm` at scale 2, door plate (buildings.ts PLATE) at 0.25 proud.
  - Editor's fix: check for coplanar door, frame and plinth faces in the prefab (z-fight scan at close range), and give the door its own depth step.
  - Re-check: `review/shots/G5/`: `c-bedstraw.png`
- **G5#15** (nit, craft · **could**) The sugar store vignette is hard to find.
  - What: the store (sacks, cubes, ant line) is tucked in the 19 m gap between the Trencher's back wall and the Cloche, with its sign on the Trencher's back wall. From the quad nothing points to it. Walking round the Trencher's south end, I faced a brown wall …
  - Editor's fix: a small "SUGAR STORE (ANTS ONLY) →" finger sign at the Trencher's south-east corner, and the ant line continuing out of the gap toward the Anthill so it leads the eye.
  - Re-check: `review/shots/G5/`: `c-sugar.png`
- **G5#16** (nit, craft · **could**) The car park is empty.
  - What: 40 marked bays, no cars (`c-park.png`).
  - Editor's fix: park 4-6 parked civilian cars (`parking.ts` / parked vehicles), including the Dean's car in a DEAN bay, which sets up the "plenty have seen his car" Dean's Leap joke.
  - Re-check: `review/shots/G5/`: `c-park.png`
- **G5#17** (nit, craft · **could**) The lodge's name plate is redundant, and the giant cheque isn't giant.
  - What: the lodge's name plate reads "THE DEAN'S LODGE / THE DEAN'S HOUSE". The vignette called the "giant HOA cheque" in the screenshot pass is a 0.9 x 0.5 m plate on a table.
  - Editor's fix: give the lodge role a joke ("THE DEAN'S LODGE / RESIDENCE AND APOLOGIES"), and make the cheque a 2.4 x 1.1 m presentation cheque leaning on the table.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#18** (nit, craft · **could**) The founder's sundial is a giant witch's hat.
  - What: `quad-sundial` (size 1.6) beside the statue reads as a dark green cone, as tall as a gnome (`y-statue.png`, right edge). The statue's plumb bob doesn't read at any distance.
  - Editor's fix: check the sundial prefab's proportions (a low plinth and a flat dial) and enlarge the plumb bob, or give it gold.
  - Re-check: `review/shots/G5/`: `y-statue.png`
- **G5#19** (polish, craft · **should**) The observatory dome is a dull grey drum.
  - What: the landmark on top of the landmark reads as a grey octagonal tank with a flat lid and a small dark box on top (`a-obsdoor.png`). It has no sign by the door, no slit glow, and no colour.
  - Where: prefab `anthill-observatory`; `campus/observatory.ts`.
  - Editor's fix: a white or verdigris copper hemisphere with a visible open slit and the telescope tube poking out, lit at night, a stone drum with a door canopy, and a name plate on the drum.
  - Re-check: `review/shots/G5/`: `a-obsdoor.png`
- **G5#21** (polish, craft · **should**) Paying the rent changes nothing in the world.
  - What: `sq-anthill-rent` ends "The door is open. The lights are on." But the north door stays shut, the "SUGAR RENT OVERDUE (AGAIN)" post stays up, and there are no lights below. `ant-door` has no open state (grep: nothing reads the quest).
  - Where: `quests/rootwellQuests.ts` 127; `campus/observatory.ts` 148-160.
  - Editor's fix: after the quest, swap to an open door with a warm glow inside, remove the invoice, and put a "PAID" stamp with a single dot (lore: "the ants sign with a single dot").
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#22** (nit, craft · **could**) Lore details on the mound are missing or mismatched.
  - What: - Lore says students leave a sugar cube on the lowest step at night "for the night shift": not in the world. - The screenshot pass calls Sextant's kit a "deck chair": it is a bench. - Her "star charts" are `essay-page` props. - The ramp is 6 m high where the …
  - Editor's fix: a cube on the south door's step (night only), a real deck chair, rolled charts (paper cylinders), and align the lore's ramp height to the build.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#23** (polish, craft · **should**) Plates float above signposts across E13 and E14.
  - What: text plates 1.4-2.4 m wide are hung at 1.0-1.9 m beside the 1 m `signpost` prefab (a thin stick with two little arrow boards). They hover in the air above or in front of the post, and the arrows poke out behind them. Seen at: - "OVERRUN (PROFESSOR'S PARKING)" …
  - Where: `campus/field.ts` 90-94, 177-233; `campus/observatory.ts` 28-33 and all `signpost` uses; `campus/windFarm.ts` 107-138; `campus/buildings.ts` 75-78.
  - Editor's fix: use a proper board prefab: a two-leg notice board, or the `notice-board` / `speedway-banner` already used elsewhere. Or add a post of the plate's height (two legs for plates over 1.2 m wide) and drop the arrow signpost. Add `heightAt` in `field.ts`.
  - Re-check: `review/shots/G5/`: `f-north.png`, `r-track.png`, `c-clod.png`
- **G5#24** (polish, craft · **should**) The apron is a bare concrete plain.
  - What: 47 x 160 m of flat grey with one Crop Duster in view, a fuel trailer and a wing on crates far off (`f-apron.png`). It has no tie-downs, chocks, painted taxi lines, cones, tool carts, hangar clutter or people between planes.
  - Editor's fix: yellow taxi and parking lines (decal layer), wheel chocks and tie-down ropes at each plane spot, a tool cart, a fuel bowser by the hangar, an oil-stained patch, and one student pushing a plane by hand.
  - Re-check: `review/shots/G5/`: `f-apron.png`
- **G5#25** (polish, craft · **should**) The tower and runway at night are too dim.
  - What: at night the runway edge lights are tiny dots, the tower cab is dark (`n-field.png`), and the hangar is unlit.
  - Editor's fix: brighter edge-light sprites with a glow halo, a lit tower cab with a figure in it, a hangar door light, and a rotating beacon.
  - Re-check: `review/shots/G5/`: `n-field.png`
- **G5#26** (blocker, craft · **must**) The pinwheel rotors look like loose boxes.
  - What: each rotor is eight separate 0.8 m-wide sticks: four roots and four "curled tips" at angles, with gaps between them. From below and close up they read as scattered planks round a pin, not a garden pinwheel's four folded triangular sails (`pinup-0.png`). E13 …
  - Where: `packages/prefabs/src/catalog/gta-pinwheel-campus-props.ts` `giant-pinwheel-rotor`.
  - Editor's fix: rebuild the rotor as four broad triangular sails (thin wedges or custom triangles) folded toward the pin, each with a contrasting inner face (tint and white). Make the pin cap larger.
  - Re-check: `review/shots/G5/`: `pinup-0.png`
- **G5#27** (polish, craft · **should**) The ridge is grey scree and the masts are bare grey poles.
  - What: the crest and the south flank are all rock-paint gravel (`r-ridgeE.png`, `x-pin.png`). The masts are plain grey cylinders with red bands, and their plinths are square concrete slabs. From the road below the ridge looks like a quarry with poles.
  - Editor's fix: grass the crest where the slope allows (see #1 and #2: the rock rule), and paint the masts white per R-202 ("white-and-red mast"; they render grey). Add a small cable trench line between the plinths and wind-bent grass.
  - Re-check: `review/shots/G5/`: `r-ridgeE.png`, `x-pin.png`
- **G5#28** (polish, craft · **should**) Ridge signs disagree with the lore, and Ragwort is "he" in prefab text.
  - What: - Lore signs: hut "KNOCK TWICE. I CANNOT HEAR ONCE.", substation "HIGH VOLTAGE. HIGHER WIND.", and the HOA tag "PROPERTY OF THE ASSOCIATION" with "(IT IS MY CABLE. - R.C.)" scratched under it. - The build uses "CONTROL HUT / KNOCK. LOUDLY. (WIND)", "HIGH WIND …
  - Editor's fix: use the lore texts (keep "HOLD ON TO EVERYTHING…" as an extra sign), and fix the pronouns.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#29** (nit, spirit · **could**, D22) The pinwheel names clash with the lore and with their own colours.
  - What: lore says "every pinwheel has a name known only to her", but all ten masts carry name plates. Pinwheel 6 is plated "BIG RED" but is blue (colour cycles red, yellow, blue; index 5 is blue). The rotor's examine text names vanes "Red One" and "Yellow Two".
  - Editor's fix: either keep plates and amend the lore ("she paints the names on; only she knows why"), or remove them. If kept, fix BIG RED (swap with a red one).
  - Decision: D22 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#30** (polish, craft · **should**) The jumps don't throw you, and you can't see them.
  - What: on the Knobbly at full speed (26.9) down the start straight, the bike went over Clary's Hump (s 150, rise 1.5 m) with y going from 2.8 to 3.0 to 2.9. It didn't leave the ground, and no lip, colour change or marker shows where it is (`bike-hump.png`). The …
  - Where: `raceTrack/defs/rutbottom.ts` 41-49.
  - Editor's fix: raise the jumps to about 2.5-3 m with a sharper up-ramp (6-7 m) so a full-speed Knobbly gets 0.6-1 s of air. Mark each lip with a tyre-wall face, a painted white lip line and a named board ("CLARY'S HUMP / she built it, you jump it"). Whoops amp 0.5. Tune with a scripted lap and an airtime readout.
  - Re-check: `review/shots/G5/`: `bike-hump.png`
- **G5#31** (polish, craft · **should**) The track surface is a smooth brown ribbon.
  - What: one flat brown with no ruts, tyre lines, puddles, darker wet patches in the dips or loose clods (`bike-5`, `bike-7`). Hay bales every few metres make every stretch look the same.
  - Editor's fix: rut decals along the racing line, darker mud in Mudguard Dip with a splash effect, scattered clods. Break the bale rows with tyre walls, sponsor boards and marshal posts at intervals.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#32** (polish, craft · **should**) Corner names aren't in the world.
  - What: lore names every corner: Hay Fever, the Berm, Gravel Hat, Mudguard Dip, Cowpat Corner, Last Orders. Only "THE BERM REMEMBERS" has a board.
  - Editor's fix: a small hand-painted board at each corner's apex, and at Cowpat Corner a cow-pat decal.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#33** (polish, craft · **should**) The Impound has no tape and no taped rides.
  - What: lore (rutbottom-impound.md) and m42 banter ("Taped up like a parcel") describe six Carburettor rides taped in the pits with beige HOA tape reading "IMPOUNDED. DO NOT TOUCH. THIS MEANS YOU." The world has none of it. m42's objective spawns one plain lowrider …
  - Editor's fix: while m42 is open, place six lowriders in the pits wrapped in beige tape bands (box strips) with the tape text. The quest car is one of them. After m42, the tape is gone and one strip hangs on Clary's tower as the winner's scarf. Coordinate with G11.
  - Re-check: the spot and file named in Where (no editor shot)
- **G5#34** (polish, craft · **should**) The gate is just a lane, and the infield is an empty field.
  - What: the "gate" from the east-band road is a dirt lane between a sponsor board and bunting, with no gateposts and no hut (`b-gate.png`). The 300 x 150 m infield is bare lawn with a few tyre stacks (`b-infield.png`). The Bowl is not a named map POI either …
  - Editor's fix: a timber gate frame with the "RUTBOTTOM DIRT BOWL" board on it and a ticket barrel. In the infield, parked trailers and vans of the Carburettors' summer camp (lore: "summer home"), a tent, a washing line and a campfire ring. Add `at('raceway', 1200, -650, 'Rutbottom Dirt Bowl')` (or the right kind).
  - Re-check: `review/shots/G5/`: `b-gate.png`, `b-infield.png`
- **G5#35** (nit, craft · **could**) The bike-wash bucket is full of pink paint.
  - What: `glaze-stage-bucket` (Pay 'n' Glaze's paint bucket) is reused as the bike wash, with pink contents (`b-pits` area). The lore says "a bucket for the bike wash".
  - Editor's fix: tint the liquid muddy brown or water, or use a plain bucket and hose.
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

#### D17. Rootwell Field Station: build it or retcon it — G5#6 · **should**
- **Decision:** build a small station:
  - a hut and a weather mast;
  - rain gauges and a soil-core rack;
  - a student asleep in a deck chair;
  - one sign;
  - test plots with labelled stakes and two bee boxes across the empty band.
- **Reason:** GR1 (a named place in canon). It is cheap, and it fills a dead zone next to the runway.

#### D22. Pinwheel name plates — G5#29 · **could**
- **Decision:** keep the plates and change the lore ("she paints the names on; only she knows what they mean"). Swap
  BIG RED onto a red pinwheel.
- **Reason:** the plates are readable charm. The lore line is cheaper to change.

#### D23. The campus bell stops nobody — G5#12 · **should**
- **Decision:** on `campus-bell`, every campus walker pauses for 2 s, faces the statue and tips their hat (reuse the
  Dean's `bow`).
- **Reason:** it is cheap, it is canon, and it is exactly the kind of hand-placed life L117 asks for.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX06 rock rule (the Anthill, Rutbottom, the ridge crest). FX04 Dean's Leap ramp skin. FX01 `signBoard` for G5#23 (seat every plate on a board).

## Online / mobile / achievements / prefabs / lore notes

- Bundle the nits (G5#15-18, #22, #35) into one or two issues.
- D22 (could): keep the pinwheel plates and change the lore; swap BIG RED onto a red pinwheel.
- Mobile: the jumps and bowl at 390x844.

## Risks and open questions (with the decision taken)

- Raising the Rutbottom jumps changes the dirt race times and tests: update them.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX14/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Rutbottom jumps give a full-speed Knobbly 0.6-1 s of air (test).
- All 1 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX02 (orchestrator)

- `uni-lecture` (lecture hall interior): `campus/interiors.ts` scales the bench rows to 18 m wide, so each row stands
  ~4 m tall right in front of the spawn. FX02's entry-view test (`interiors/entryView.test.ts`) exempts it for now;
  fix the benches and remove the exemption.

## Added after FX06 (orchestrator)

- G5#1 (partly fixed by FX06): the Anthill's stepped top tier remains; widening the summit blend broke the Anthill road grade tests and hid a shot target in the m46 outro, so reshape it together with those.
