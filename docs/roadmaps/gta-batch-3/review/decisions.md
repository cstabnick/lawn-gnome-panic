# R1 decisions (round 1)

Decider's rulings on every spirit finding in `G1`–`G12`, and on the craft findings that several editors raised with
different fixes. These rulings are final for batch 3. Fix epics follow them; if a fix turns out impossible as ruled,
the fix lead takes the listed fallback (or the cheaper option named here) and records it in `rounds.md`. They do not
reopen the question.

Sources weighed: the user's words (L04, L68, L83, L94, L95, L99, **L104** "don't lose all its charm but grow it and
improve it where growing pains appear", **L117** "hand crafted ... iterative adjustments until it all feels just
right"), the standing decisions and the storytelling AC in `gta-batch-3.md`, the context rule
(`direction/batch-3-notes.md`, `E04/spine.md`), `docs/lore/canon.md` and the entries, and `SOUL.md`. SOUL says
playable over polished, but the user has asked for polish now. So the bar is: polish what the player sees, and do not
destabilise systems that work.

Priority: **must** = the fix round does it, and R1 round 2 checks it. **should** = do it in the fix round unless it
blocks a must (then it carries to round 2). **could** = only if a fix lead has room. Otherwise leave it, and list it
as deferred in the PR.

---

## Global rules

These apply to every fix epic. Each one settles a question that several editors raised separately.

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

**GR2. World-change timing: a place exists before the story founds it, in its *before* state.**
- Places stay **playable from the start**. Content epics (court, bowls, estates) must not be locked behind story
  beats. Locking them would cut fun the player already has (L104).
- Until the world change fires, the place's **name, map label, hints, bulletins, toasts and dressing** show the
  before state. When the change fires, it visibly transforms the place (signs off, name on, crowd for a day).
- After the payoff, the "event" dressing (crowds, ribbons, bands) **settles into an everyday state**. It does not stay
  as a permanent party.
- No text before the beat may use the after-name: hint, bulletin, side-quest `why`, app label, map POI or runtime
  toast. Add a test that greps the before-beat quest text for after-names (`Founders' Green` before
  `ch1-founders-boot`, at least).

**GR3. Stage sets are quest-scoped, and never sit on a road.**
- A story stage set is hidden outside its row's window: shown when the row becomes active (or when its scene plays),
  and removed when the row is done, unless a world change deliberately keeps it.
- No solid stage-set prop may overlap a road rectangle unless it is marked `overRoad` and is scene-only. Add the
  check as a test over `quests/stages/**` against `world.layout` roads (G1#1).
- Permanent traces of a beat (a door, a sign, a scar) go through `worldChanges`, not through the stage-set batch.

**GR4. Briefing style: no spoken "Previously:" label (all acts).**
- Characters never say the word "Previously" as a label. This overrides G12's "what works" note. The context rule
  asks for the recap "in the speaker's voice ... not a system note", and a spoken label is a system note.
- The quest def gets an optional `previously` field. The journal's Active card shows it in the narrator's voice,
  which is the spine's journal line.
- Comms step 0 opens with an **in-voice clause** only where the player needs the context. Example: "Last time you
  brought my raft home. The chart says..." The clause must only refer to things the speaker could know, and to
  scenes the player cannot have skipped (G10#8: #29, #32; G11#8: Betony; G12#25: the Countess).
- One shared pass covers all 70 rows. The writer does a voice pass on the same lines (G11#10: contractions, and Pip's
  run-ons and self-undoing second sentences).

**GR5. Fees: shown, not said (all acts).**
- The context rule says what the player gets must be "said **or shown**". From now on it is shown: a reward chip on
  the comms card (or a briefing header) and on the journal card, built from the quest's reward data.
- The amount stays in dialogue **only where money is the story or the speaker's trait**: #2 (the loan), #3 (the
  Don's debt), #11 (Brenda's toll), #16 (clearing the Kiln-Debt), #21 ("for your time"), and Sal, Samphire,
  Chanterelle and Betony's "as I was saying". Betony keeps her trait but loses the number.
- Everywhere else the line is cut, or turned into a favour ("Granny would say pie.").
- Sincere and crisis rows must never carry a spoken fee: #26, #31, #34, #35, #52, the act IV finale.

**GR6. Story scenes pin their weather and light their key frames.**
- The scene runner gets a scene-level `weather` override. The default for story scenes is `clear`, unless the scene's
  direction note asks for rain.
- Night and dusk scenes get a warm key light: a point light on the campfire, lantern or lamp prop, or a rim light on
  the speaker in close-ups.
- An intro card or a sincere close-up must never play over a near-black frame, or show the back of the speaker's
  head. Add both checks to `npm run cutscene-report` if they can be measured (mean luminance of key frames; speaker
  facing the camera). If not, cover them in the screenshot pass.
- Covers G10#3, G10#25, G11#16, G11#18, G12#10.

**GR7. Objective variety in the main story.**
- No more than **two consecutive main rows** whose main objective is a passenger run.
- No row has more than two passenger legs unless the legs are the point (#68's goodnights are; #67's are not).
- "Search three spots" never runs twice in a row in the same place.
- Fixes reuse existing objective kinds only (`chase-follow`, `checkpoints`, `convoy-ambush`, `race`, timers,
  `maxDamage`). No new kinds in the fix round.

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

**GR9. Scope and safety guard for the fix round.**
- **No new systems.** The exceptions are the small ones these rulings name: the `previously` field, the reward chip,
  scene weather, the Gnomlet `mount(root)` adapter, the `y`/surface field for ambient gnomes, the vehicle capsule,
  quest-scoped stage sets, and choice-gated outro steps.
- **No new online modes in R1** (D28).
- **Density passes** (Pardonlin lanes and pavements, the Unmown grass, Capwood, the west, coast dressing) must be
  measured with `node tools/gta-perf.mjs --cpu 4` at the densest spot, before and after. A pass may raise phone-viewport
  frame time there by at most 15% over its own before-measurement. Otherwise it instances, merges or cuts until it
  fits.
- Every touched game area keeps `npm run build`, `npm test`, `npm run zfight` and `tools/smoke.sh` green.

**GR10. Keep list (L104).** Every editor praised these. Fix rounds must not flatten them:
- the sign and dialogue voice in every region;
- the HOA as the butt of the jokes, the gentle Flock, and the kind, misunderstood moles;
- the cast's distinct voices in act IV;
- Radio Adagio;
- the Spine Cut and the World's Edge;
- Casual handling and NPC traffic on the Casual chassis;
- the comms card on desktop;
- Gnomey Bird;
- the moored-only Bathtub Queen (R-185);
- "Tours at noon. Cargo at midnight."

Rewrites add a clause. They do not replace a scene.

---

## A. World-change timing and stage sets

### D1. Founders' Green before #15 — G1#7, G10#2, G1#29 · **must**
- **Question:** the court and the bowls carry the name "Founders' Green" from minute one, so #15's rezoning changes
  nothing. Should the place be a squat or locked before #15?
- **Options:**
  - (a) Lock the court and the bowls until #15. Pro: the payoff is clean. Con: it hides E19's content for 15 quests
    and contradicts L104.
  - (b) A squat: playable, but labelled and dressed as the condemned blocks. Pro: keeps the fun and gives the beat
    stakes. Con: needs new text and props.
  - (c) Leave it, and rewrite #15 as "making it official". Con: it throws away the act I climax.
- **Lore:** `founders-green.md` (condemned signs, the bird's nest), W03, GR2.
- **Decision:** (b), the squat.
- **Reason:** the rezoning should save a place the player already loves (G10#2's own argument), and nothing gets
  locked.
- **Fix round:**
  - Before W03:
    - The map label and POIs read "Gnorwin Park" for the park, and "the condemned blocks" for the court and skate
      blocks.
    - The court and skate runtime toasts, the `sports/app.ts` title and the hints of #9, #14 and `sq-court-regulars`
      / `sq-gutter-bowls-sessions` all say "the condemned blocks" (or "behind the HOA hoarding").
    - THORNE LAWN & ORDER CONDEMNED notices stand on stakes, one of them with the bird's nest, with chalk crosses on
      the paving and a "COURT CLOSED (WE ARE PLAYING ANYWAY)" board.
    - Plant lines in #9 (Fennel: "They want the bowls flat by Trim Day.") and #14 (Swish).
  - W03 removes the notices, switches the names and blips, and repaves the x = -60 street strip.
  - Lore ruling: the three condemned blocks were the court block, the skate block and the street strip between them,
    and Gnorwin Park joined them as the fourth piece. Update `founders-green.md`, `downtown-turfton.md` (the Green,
    the Double Pot, the skyway, the City Hall coordinates) and the `greenAndBarn.ts` header comment.
  - Add the GR2 test.

### D2. Even-Estates sites: always up — G1#8, G1#9 · **must**
- **Question:** the sites are fully built before #7 and stay up after the finale. Should they change with the story?
- **Options:**
  - (a) Three states: surveyed plot, then build, then cancelled. Pro: L68, and the world answers its two biggest
    beats. Con: E16's build has to be split into groups.
  - (b) Leave them up and change only the signs. Con: the finale still reads unchanged.
- **Decision:** (a).
- **Fix round:**
  - `country/estates.ts` builds into named groups.
  - Before W02: pegs and string, a Levelright survey tripod and a "PLOT ACQUIRED" board.
  - At W02: today's build.
  - At W17 ending A: the hoardings come down, the empty show-homes stay (W18), wildflowers grow through the cones,
    and the gate board reads "SAMENESS: CANCELLED".
  - At W17 ending B: everything is painted beige, with one lit window.
  - Also G1#9's craft items: scatter exclusion for the site rects (the boulder), joke boards on the outer hoarding
    faces, identical doors, windows, doormats and shrubs on the show-homes, and a mud floor inside the sites.

### D3. Stage sets in the Double Pot Tunnel (the HOA cell, the café table) — G1#1, G1#21 · **must**
- **Question:** the stage sets are permanent solid props in the traffic lanes, and they spoil #62.
- **Options:**
  - (a) Make the lockup a walk-in interior behind a door, as the lore says. Con: E21 found that scenes can't play
    inside interiors.
  - (b) Quest-scoped sets (GR3), moved off the road, with a permanent door in the tunnel wall. Pro: works with today's
    scene runner.
- **Lore:** `hoa-lockup.md`: "entered by a door in the Double Pot Tunnel".
- **Decision:** (b) now. The cells interior (a) is a **could**.
- **Fix round:**
  - Move the s62 lockup set behind the tunnel's west wall line (a recess, or the slab side), never in x 115..125, and
    show it only while #62 is active.
  - A permanent beige door with "HOA HOLDING (WAIT HERE)" and a speaker over it goes in the tunnel wall.
  - The s21 table moves to the Double Pot roof (see D5).
  - Pull every remaining set 0.15 m off façades (the zfight flicker).
  - Apply GR3 to every stage set in `quests/stages/story/` and add the road-overlap test.

### D4. The W03 opening crowd stands forever — G1#23 · **should**
- **Decision:** split W03 into "opening day" (crowd, brass trio, ribbon) and "open" (bandstand, council notice board,
  booking sheet, lost-boot card).
- **Reason:** GR2, everyday state after the payoff. It also frees the space for W19 and W07.
- **Fix round:**
  - Opening day lasts until the next in-game dawn after #15, or 20 minutes of play, whichever comes first.
  - After that, the band plays only on the in-game weekend slot of `worldEvents`.

### D5. "Penthouse Viewing" has no penthouse, and the key is never hung — G10#6 · key **must**, set **should**
- **Options:**
  - (a) Build a beige one-room interior. Con: scenes can't play inside interiors.
  - (b) A beige roof-garden set on the Double Pot helipad roof (E05 walkable roof), quest-scoped (GR3).
  - (c) Change the lines only.
- **Decision:** (b) for the set. For the key: hang it in flat 3B.
- **Reason:** the user asked for new buildings and environmental storytelling. The roof already exists, and a
  promise in a choice must be kept.
- **Fix round:**
  - #21's tour plays on the roof set (a beige table, beige chairs, a beige pot, a view), with the lift kiosk fixed
    per G1#3.
  - A key prop on a hook by flat 3B's door, gated on `choiceOf('m21...') === 'A'`.
  - If the set cannot work, fall back to (c): change both lines to "the key is yours".

### D6. Flat 3B when Pip moves in — G1#19 · **should**
- **Decision:** yes. Fixed dressing on W09:
  - a bedroll by the door (outside the decorate layout);
  - a toolbox;
  - two mugs;
  - the note "I PAY IN FIXING THINGS — P.".
- **Reason:** the player's home is the most-visited interior, so the story beat should show most there.
- **Fix round:**
  - Remove the dressing if a later story beat moves Pip out. Check the outline, and gate on that row if one exists.
  - Move the outside hammock to the courtyard washing-line poles (G1#18). Do not add a balcony.

### D7. Veteran saves play act IV after the old finale — G12#4 · **should**
- **Options:**
  - (a) Frame those rows as "Before the Even Cut".
  - (b) A "Retold" chain started from the journal.
  - (c) Leave as is.
- **Decision:** (a).
- **Reason:** keeps "nothing hides or resets", costs one helper, and protects the players who already love the game.
- **Fix round:**
  - When a row's old-chain successor is already done, the journal files the row under "Before the Even Cut". With
    GR4 this becomes the `previously` text ("Before the Even Cut: ..."), not a spoken label.
  - Skip that row's world change and its Turfton FM bulletins while W17 is on.
  - A mid-act-IV save gets m54, m56 and m58 one at a time, in order (chain them through the chain queue).

---

## B. What each region must look like (GR1 applied)

### D8. Turfton: garden town or a European city in pots' clothing — G1#6, with G1#2, G1#10, G1#30 · City Hall and Double Pot **must**, homes **should**
- **Question:** the batch-3 homes reuse Pardonlin's euro kit, the Double Pot is two office slabs, and City Hall is a
  Buck-Iron store. The lore says Turfton is pots, sheds and birdbaths.
- **Options:**
  - (a) Add garden-object cues to what is built (pot-rim cornices, terracotta, drainage-hole windows), and make the
    named landmarks into their objects.
  - (b) A new Turfton kit for the homes (`turf-pot-house`, `shed-terrace`, `birdbath-flat`).
  - (c) Rule the new districts "Tall-One style" in the lore.
- **Lore:**
  - `turfton.md` ("flower pots, sheds and birdbaths that the gnomes live in");
  - `turfton-towers.md` ("a pot on a pot" ... "their looks are not fixed here: they are shaped by the game's own
    models");
  - `turfton-city-hall.md` (an upside-down planter);
  - the Double Pot's own name.
- **Decision:**
  - **Named landmarks become their objects (must):**
    - City Hall: an inverted terracotta planter of 2–3 tiers with astroturf steps, a CITY HALL plaque, two flagpoles
      and the Zoning Board bench, replacing the Buck-Iron tower on that block, with a map POI.
    - The Double Pot: the two halves become two tapered terracotta pots with rims, and the slab between them stays.
      The street-level sales door gets a canopy, a sign and a window, per G1#10. Scaffold and a crane stand before
      W05.
  - **Batch-3 homes, option (a) (should):** Kerb Row and Patio Heights keep their buildings but lose the Pardonlin
    look:
    - a Turfton palette (terracotta, glaze colours, not Continental pastels);
    - a pot-rim cornice part;
    - a drainage-hole round window;
    - scale Kerb Row to S = 1.3.
    - Saucer Court gets a saucer-rim roof edge and a watering-can water tank. Add the parts as prefab options or
      variants (prefab rule), not one-off meshes.
  - **Pre-batch downtown towers: no change.** The lore explicitly leaves their looks to the game, and they are part
    of the charm the user already likes.
- **Reason:**
  - The landmarks' names are the joke (GR1).
  - A full new kit (b) is more than a fix round should take on.
  - (c) would give away the game's signature for nothing.
- **Fix round:**
  - Also G1#30's street life: the kerb painter on Kerb Row, and on Patio Heights a press photographer and an HOA
    caliper inspector.
  - Lore ruling: newer terraces are "pots in Continental hats, because the Mayor went on holiday once".

### D9. Pardonlin's ground: pavements, lanes, the Platz, the Thymes — G2#1, #2, #3, #4, #10, #26 (perf: #25) · **must**
- **Question:** the user asked for "closer buildings and ambling paths" (L99). What shipped is a wide grid with lawn
  verges and empty block interiors. How far should the fix go?
- **Options:**
  - (a) Full re-layout of the town. Con: high risk, and E30's 33 vignettes would need re-placing.
  - (b) Keep the road grid and lay the ground properly:
    - pavements;
    - lanes cut through the blocks, built up on both sides;
    - a Platz with a dense core;
    - a stone-walled river.
  - (c) Pavements only.
- **Decision:** (b).
- **Reason:** it answers L99's exact words without throwing away E28's traffic, roundabouts and E30's writing.
  Pavements alone would still leave "kit houses round a field".
- **Fix round:**
  1. **Pavements (must):** a kerb plus a stone or cobble band from every town road to the building fronts. Use a
     ground paint or a flat-layer decal, not tile props. Cobble or gravel the squares where the lore says so. Grass
     stays only in the Jardin, the gardens and the backyards. Also fix the G2#10 tile seams and texture, and pave the
     Opera forecourt to the kerb (G2#26).
  2. **Lanes (must, Old Town and Left Bank; should, Teacup Row):** 1–3 crooked walk-only lanes per block, 3–4 m wide,
     cobbled, sometimes stepped. Build both sides at 0–1 m gaps with `frontage()`, add at least two courtyards or
     passages per district, and register the lanes as `trail/pl-*` footpaths.
  3. **The Grand Platz (must):** keep the footprint. Give the outer ring to a plane-tree quincunx on gravel with
     benches. Make a paved core of about 45 m that is dense: a carousel, a flower market, newspaper kiosks, café
     terraces spilling 10 m out, a crowd round the mime, toy boats in the fountain. Move Le Petit Groan's entrance to a
     building edge (G2#15).
  4. **The Thymes (must):** stone quay walls with railings and stair cuts, 6–10 moored boats, bouquinistes on the
     Thymes Walk, visible swans, and bridge parapets with lamps and a padlock-railing vignette. Sink the channel
     1.5–2 m **only if** the water body takes a per-body level offset without kernel changes. Otherwise fake the
     depth with a wall face down to the water line.
  5. **Perf (must):** measure per GR9 at the Platz, Rue Ouest and the market, before and after. G2#25's low-end phone
     check is part of this item.

### D10. Pardonlin's life: queues, population, the race crowd — G2#5, #6, #16 · queues **must**, the rest **should**
- **Decision:**
  - **Queues (must):** 8–15 gnomes in the Bean Tower and Platz queues, with idle variety. The "Queued for Nothing"
    queue moves. 4–6 gnomes queue at Brigitte's bakery at dawn. The queue is Pardonlin's defining joke (GR1).
  - **Population and cyclists (should):** cyclists that lap the Hatwheel 1–3 times, more strollers on the Rue Haute
    and in the new lanes, window-leaners, doorway shopkeepers and a sweeper. Aim for 12–15 visible Continentals per
    district, within GR9.
  - **The race meet (should):**
    - each meet gets its own cheers, with the flagger's name taken from `cast.ts`;
    - Pardonlin's cheers get a Continental flavour;
    - Pardonlin's crowd shows only while a race is offered, so the Opera forecourt belongs to the Opera.
- **Reason:** the user's brief was a lived-in town.

### D11. Pardonlin details: shop mix, roundabouts, the Wickets, the warden — G2#14, #21, #22, #29 · **should**
- **Decision:**
  - Side and back rows become residential (doors, shutters, window boxes), and shopfronts are rationed to the high
    streets, Teacup Row and the market. New kit pieces (a narrow house, a corner turret, an arcade) are a **could**.
  - The Hatwheel gets a bronze hat on a plinth and an "Allow Several Laps" sign. Place du Pot gets an empty plinth with
    "Pot Not Included". Lay a cobbled belt round both rings. The other bands keep their planters.
  - A customs gnome stands in the Grand Wicket hut with the hat and the stamp, plus a "PARDONLIN. Pardon?" board and a
    short queue at the boom.
  - The Pardonlin warden gets a navy Continental uniform, white gloves and a taller hat.
- **Reason:** all of these are cheap and already written in the lore (GR1). R-183 says Pardonlin is not an HOA town.

### D12. How white is Snowcap Rise — G4#1, #2, #4, #5 · **must** (settling snow #4: **could**)
- **Options:**
  - (a) Snow everywhere above the band road, with Capwood as a warm, thawed hollow.
  - (b) A pale frost meadow.
  - (c) Keep it green and rewrite the lore.
- **Lore:** `snowcap-rise.md` ("the snow stops melting at the edges"); the region's name; the "Above the Fells"
  achievement. GR1 applies.
- **Decision:** (a).
  - Snow above the band road, with an fbm-noised edge and a frost transition band.
  - Pail Pond and Snowdrop Slope get snow aprons of r + 25–40 m.
  - Capwood is a spore-thawed hollow: green, with a frost ring at its edge.
  - Mittenholt's green stays green inside a patchy-frost band. It is a hamlet that clears its own green.
- **Reason:** a winter region that is greener than the Fells reads as a bug (G4#1). The thaw gives Capwood a reason to
  exist.
- **Fix round:**
  - Paint rule in `northHighlands.ts` and the Wasm mirror, plus a parity test.
  - The minimap follows the paint (G4#5).
  - No snow lumps on daisies in Mittenholt.
  - Lore ruling: "Capwood's rotting woodpile warms the hollow, so the caps grow where the snow won't lie".
  - G4#4 (settling snow during snow weather, region-masked) only after this lands.

### D13. Capwood: the forest and the run — G4#17, #18 · **should**
- **Decision:**
  - **#18, forest (should):**
    - stems in clumps of 3–7;
    - double the density in the core;
    - more 8–12 m giants, so caps close overhead in places;
    - a moss and leaf-litter floor paint inside the site;
    - fallen logs, ferns and a light fog bump inside the site.
    - Keep the race keep-outs.
  - **#17, the run (should):** re-lay only the climb (the first ~2 km) as a flowing route: an S-bend, a sweeping
    traverse with a crest, at most two hairpins. Keep the descent from (238, -872) as it is.
- **Reason:** L17 and L81. The trombone is the most visible scar in the north.
- **Fix round:**
  - The total length stays at 2.5 km or more.
  - The cut depth stays at 3 m or less, with rock paint and a snow edge on the cut faces (GR8 rock rule).
  - Fords stay capped at `WATERLOG.fordCap`.
  - Re-run the drive-along tests and re-record the best times.
  - Fix the blocker G4#16 (trees on the road) in the same pass.

### D14. Saltbucket: bucket, dunes, sand — G3#5, G3#25, G3#6 · **must**
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

### D15. The Saltbucket Lay-By — G3#27 · **should**
- **Options:**
  - (a) Move the meet to the coast. Con: it reworks E26's meet, routes and tests.
  - (b) Keep the meet's position, give it a pull-in, and extend the Dash to the sea.
- **Decision:** (b).
- **Reason:** the lore says "on the band road out to the coast", which the current spot is. The Dash's promise ("runs
  from here to the sea") is the part that breaks.
- **Fix round:**
  - A tarmac pull-in with sand-drift decals under the meet.
  - Extend `SALTBUCKET_DASH` down the coast spur to finish at the boardwalk entrance sign (0, 1072).
  - Update the lore coordinates.

### D16. The Unmown and the west — G6#1 (craft blocker), G6#22, G6#8, G6#9 · Unmown **must**, west **should**
- **Decision:**
  - The Unmown gets a dense instanced tall-grass field (1.2–2 m) over the Long Meadow and the preserve margins, culled
    per cell like the golf grass.
  - A mown 2 m strip runs only along the trails.
  - The ground paint turns straw and olive.
  - Oldroot Wood becomes a wood, and Wader's Rest becomes reedy (G6#8, #9).
  - **West of Trellisdown (should):**
    - hedgerows and dry-stone walls following the land;
    - copses, stiles and field gates;
    - unmown field margins;
    - a lone oak with a bench;
    - a deer pond;
    - hunter camps moved into copses and hedge corners;
    - mow stripes fading out west of x -1000.
- **Reason:** GR1. "The corner the Tall One stopped mowing" is the place's premise, and the user called the west "the
  wild".
- **Fix round:** re-check the mower vignette and the HOA-survey vignette against the new grass height. GR9 perf.

### D17. Rootwell Field Station: build it or retcon it — G5#6 · **should**
- **Decision:** build a small station:
  - a hut and a weather mast;
  - rain gauges and a soil-core rack;
  - a student asleep in a deck chair;
  - one sign;
  - test plots with labelled stakes and two bee boxes across the empty band.
- **Reason:** GR1 (a named place in canon). It is cheap, and it fills a dead zone next to the runway.

### D18. Espalier End — G6#20 · **should**
- **Decision:** build to the lore:
  - twelve houses, jittered off the circle, each with a different, lopsided topiary entry;
  - a long, wobbly hedge, with No. 3 and No. 4 at two heights;
  - pear trees in every garden, and pears "in transit" at the road edge;
  - a pear stand with a pear-shaped honesty box by the pump.
  - Fix the thatched-cottage roof proportions in the prefab.
- **Reason:** the joke ("symmetry is for the HOA") must not be told by the most symmetric layout in the game.

### D19. DJ Moleman's burrow — G6#14 · **should**
- **Decision:**
  - About 8 m across and round, with curved wall segments or a ring of earth posts.
  - The decks and Moleman at the middle of the north wall, under a warm lamp.
  - Stacked records, a kettle, a supper plate under a cloche, cables into the ceiling, and a hat stand with no hats.
  - The pole becomes a thin root with a large "NOT THE TRANSMITTER" sign.
- **Reason:** L50 ("cute but misunderstood ... make DJ Moleman make an appearance"). This should be the warmest
  reveal in the game.

### D20. Giant deer — G6#28 · **no change**
- **Options:**
  - (a) Scale the ambient herds 3–4x as "the Tall Ones' deer". Pro: a wonder moment. Con: breaks R-212 (ambient herd
    and quarry are one animal), and needs new collision and hunting balance.
  - (b) Keep them as they are.
- **Decision:** (b).
- **Reason:**
  - The game's fauna (bears in deck chairs, flamingos, moles) all live at gnome-world scale. Canon 1 covers objects,
    not animals.
  - A one-off scale change is new scope, with risk, in a fix round.
  - L39 asked for "more fauna and deer", not bigger deer.
- **Fix round:** nothing. The idea can go in the next batch's backlog.

### D21. Stunt ramps: the neon kit look — G1#16, G5#20 · **should**
- **Question:** should the game-wide black-and-cyan stunt ramp stay as a readability rule?
- **Options:**
  - (a) Keep the neon everywhere.
  - (b) Skin every ramp to its place.
  - (c) Skin ramps to their place, but keep one small readable cue.
- **Decision:** (c).
- **Fix round:**
  - The ramp body takes a place skin:
    - parks get timber and turf with a "NO RAMPING (PLEASE)" sign;
    - Dean's Leap gets old planks and packed earth, a faded wheelchair symbol and a "DONATED BY THE CLASS OF ——" brass
      plate;
    - dirt and rally ramps get earth and tyres.
  - Every ramp keeps a painted white lip line and yellow chevrons, so players can still read it.
  - Cyan appears only as the HUD ring while a stunt is active.
  - Fix the pink coplanar strip next to the park ramp.

### D22. Pinwheel name plates — G5#29 · **could**
- **Decision:** keep the plates and change the lore ("she paints the names on; only she knows what they mean"). Swap
  BIG RED onto a red pinwheel.
- **Reason:** the plates are readable charm. The lore line is cheaper to change.

### D23. The campus bell stops nobody — G5#12 · **should**
- **Decision:** on `campus-bell`, every campus walker pauses for 2 s, faces the statue and tips their hat (reuse the
  Dean's `bow`).
- **Reason:** it is cheap, it is canon, and it is exactly the kind of hand-placed life L117 asks for.

### D24. The napping polar bear looks dead — G4#13 · **must**
- **Decision:** curl the bear on its side or belly with its head on its paws. Add a "Zzz" puff and a towel or a folded
  newspaper.
- **Reason:** "nothing dies" (R-021, R-049) and L38's "really chill" bears. This is the one image the place must never
  give.

### D25. Running gags repeated until they become tics — G4#30, G4#31, G10#31, G11#11, G11#12, G11#30 · **should**
- **Rule:** a running gag appears **once per place**, and at most about three times per region, except where it is a
  planted ladder (the story's code words, "Okay, hear me out": see D57).
- **Fix round:**
  - G4#31: keep "41" on the sheep (tag and tally) and on Velma's buns. Change the mittens count. Keep "two hats" on one
    road sign. Rewrite the camper's note.
  - G4#30: the Capwood photographer becomes something only Capwood has: a spore-sweeper's broom and a jar of glow.
  - G10#31: "Tuesday" is used only in the betrayal code and in the prologue's "Must be Tuesday". #9 and #31 use other
    days.
  - G11#11, #12, #30: thin out reused bible lines, "eleven" and "so it is stood" in the act III voice pass (GR4).

---

## C. Activities and jobs

### D26. Ski and sled runs are 15–20 s — G4#8, G8#22 (two editors, two fixes) · **should**
- **Options:**
  - (a) Start the Wool Run at the summit with an upper tow, 10–12 gates, a traverse and a jump, for about 35–45 s
    (G4).
  - (b) A third, long run from the Rise (G8).
  - (c) Chain the two runs into one.
- **Decision:** (a). The current short course becomes "the Nursery". The Tea-Tray Run stays short, because sledding
  should be short.
- **Reason:** (a) uses the slope that already exists (it reaches about z -1340) and only adds a tow. (b) needs new
  terrain.
- **Fix round:**
  - Raise the tow top, or add a second tow.
  - Retune `BLACK_DIAMOND_S`, and keep the old bests on a separate "Nursery" key.
  - Add a run-out corral before the band road (G4#9).

### D27. Jobs as 2D forms over a hidden 3D place — G8#5, #27, #28, #29 · #5 **should**, the others **could**
- **Options:**
  - (a) Keep the full-screen forms. Pro: readability. Con: the vignettes are never seen.
  - (b) Compact, translucent panels over a fixed workstation camera.
- **Decision:** (b).
  - Chef: the pass and the hob in view, with the order slips as a bottom sheet on phones.
  - Gnomazon: the station and the shelf in view.
  - Bin lift: a lower-third strip on desktop, with the 2D diagram kept only on portrait phones (#27).
- **Reason:** a GTA job should feel like being somewhere. The widgets stay as they are.
- **Fix round:**
  - Keep every widget and every score.
  - #28: the diner pass strip with a plated icon and a one-line customer reaction. **could**.
  - #29: a conveyor tote and Kippy's countdown. **could**.

### D28. No new activity is online — G8#24 · **must** (documentation only)
- **Options:**
  - (a) 2v2 court online in R1.
  - (b) Shared golf.
  - (c) None in R1, and state why.
- **Decision:** (c).
- **Reason:**
  - AGENTS.md allows "keep it single-player and say why" when online play would add a lot of work.
  - A host-run GJAM relay is a new system, and GR9 rules out new systems in a fix round.
  - Race modes already relay.
- **Fix round:** the PR description lists each activity as "local", with its reason. Add the 2v2 court as the first
  item in the online backlog.

### D29. Comedy's level curve — G8#30 · **could**
- **Decision:** keep the pay joke. A bigger name on the "TONIGHT:" poster per level. At Cult Disappointment, a small
  crowd that comes to boo on purpose.

### D30. The pistol indoors, at golf and on stage — G1#12, G8#2 · **must**
- **Decision:**
  - Holster and hide the combat buttons:
    - in interiors flagged `peaceful` (flat 3B, the townhouse, Diggs's bungalow, the Bodega, the sales floor, Café
      Pardon, the clubhouse, the Moleman burrow, the Flock's tent);
    - during golf, stand-up comedy and every workplace shift.
  - Show the context buttons (Decorate, Sleep, Swing) in their place.
  - Golf gets a club and a swing (G8#2, craft).
- **Reason:** the home should feel safe, and phone screens are where it hurts most.

---

## D. Vehicles

### D31. Two-wheelers and soft cars don't lean — G7#7 · **should**
- **Decision:** a visual body roll per kind (a `roll` gain in `PROFILES`, fed from lateral acceleration): the
  Deux-Pots 8–10°, two-wheelers banking into the turn 10–15°, vans a little. No physics change.

### D32. The Cone Van's chime and its errand — G7#9 **should**, G7#26 **could**
- **Decision:**
  - A synthesised 4–6 note "slightly wrong" chime as the Cone Van's horn.
  - A two-tone parp for the Ranger Buggy and a low hoot for the camper.
  - #26: one errand: the Cone Van parks by the boardwalk with its hatch open and plays the chime.

### D33. The Petit Pois's driver pokes through the roof — G7#11 · **must**
- **Options:**
  - (a) A sunroof sized to the hat, which owns the joke.
  - (b) Lower the seat and squash the cabin.
- **Decision:** (a) for the Petit Pois. For the other closed cabs (Crepe Van, Cone Van, Shell Camper, HOA van, Taxi),
  check with the tallest creator hat and lower the seat where they clip.
- **Reason:** the first European car clips on frame one. The sunroof turns a bug into a Continental gag, at prefab
  cost.

### D34. Lock-Up capacity: 5 ground slots — G7#16 · **could**
- **Decision:** a buyable second ground lock-up (a Pardonlin mews, 6 slots, about 1,500 Acorns) through the existing
  `ESTATES` pattern.

### D35. The Pot Rod's "hot engine" — G7#17 · **could**
- **Options:**
  - (a) Make it fast and twitchy.
  - (b) Keep it slow, and own the joke.
- **Decision:** (b).
  - The blurb becomes "All flame decals, no engine. No regrets."
  - The price drops to about 600.
- **Reason:** odd rides are slow by design, and retuning touches handling tests for no gain.

### D36. L01: the vehicle collides as one long circle — G7#1, G7#15 (craft; ruled because of its risk) · **must**
- **Decision:**
  - Vehicles collide as a short capsule: 2–3 circles along the heading, radius = body half-width + 5 cm, from a new
    `spec.halfWidth`. This applies against boxes and vehicle-to-vehicle.
  - `spec.radius` stays for culling, the camera, spawn spacing and bump damage thresholds.
- **Reason:** it is the user's own complaint, and the capsule changes the least code.
- **Fix round:**
  - The tests G7 proposes: a dirt bike through a 1.2 m gap, a van along a wall within 0.15 m.
  - The full traffic and quest-sim suites must stay green, run twice.
  - Boats keep their own fraction.

---

## E. UI and feel

### D37. The Gnomlet: launcher or tablet — G9#5 (blocker), G9#6, G9#28 · **must** (journals and the regroup: **should**)
- **Question:** L94 asked for "a tablet with apps that give the different options ... more real GTA like". Today 15 of
  24 apps close the tablet and open an older panel.
- **Options:**
  - (a) Every menu-like panel renders inside the tablet through a `mount(root)` adapter.
  - (b) Keep it as a launcher, and only restyle the panels.
- **Decision:** (a).
- **Reason:** L94's words.
- **Fix round:**
  - `mount(root)`: the panel drops its own backdrop and close button, and Back and ⌂ then work everywhere.
  - **Must:** Bag, Ledger, Kiln-Shield, Jobs, Kerbside Exchange, the Quest Journal.
  - **Should:** the Field, Hunting and Catch journals.
  - The map, the taxi and Sling-Lift stay `run()`. They are actions, not menus.
  - The shared `.gnl-*` kit (G9#6, craft) is a must alongside, so the panels mounted in the tablet look like one
    product.
  - Regroup the tiles per G9#28 (Calls / Work / Money and home / Sport and places / Journals / Fun / Settings).
  - Rename "Turfton Taxi" to "Kerbstone Cabs" (lore: `kerbstone-cabs.md`).
  - Sentence case for detail lines.
  - The Gnomlet clock shows game time (G9#27).

### D38. The top-left stats card — G9#17 · **should**
- **Decision:**
  - Acorns are always shown.
  - Kiln-Debt shows in the Ledger, for 4 s after any change, and while a debt-related row is active.
  - "Cracked" shows only while heat > 0.
  - Stunts show for 5 s after a landing, or inside a stunt area.
  - The time gets its own line, or moves to the Gnomlet bar.
- **Reason:** the world is the charm. The debt motif is kept, but it shows when it matters.

### D39. The birding pill is always on screen — G9#11 (spirit side) · **should**
- **Decision:** show the pill only with the binoculars up, or within about 60 m of a hide or birding spot. Never above
  the map or open panels (that part is craft).

### D40. The UI is silent — G9#25 · **should**
- **Decision:**
  - The tablet makes a soft clay "tok" when it opens.
  - Taps make a tap tick.
  - Calls ring with a "burr-burr" through the radio filter.
  - Gnomey Bird gets a flap sound and a point sound.
  - All on the player SFX path, within the mix table, following the sound bible's "a little too earnest" rule.

### D41. The profiler and "Cheats" in Options — G9#29 · **should**
- **Decision:**
  - Profiler stays reachable, because the user uses it (L88). It moves into a collapsed "For developers" disclosure at
    the bottom, closed by default.
  - "Cheats" is renamed "Handling", with "Silly handling (cheats)" as a sub-head.

### D42. The loading screen stops at the old world — G9#30 · **should**
- **Decision:**
  - About 12 new facts from batch-3 lore, one per new place.
  - 3 new pages: the Anthill Observatory, Pardonlin's rooftops, the Unmown from a hide. Code-drawn, like the existing
    pages.
  - The stage text becomes "Building the Yard".
  - Cut the garbled fact.

### D43. Locked contracts show story titles hours ahead — G9#33 · **should**
- **Decision:** list the next two locked contracts, then "and N more". Name an unlocking mission only if the player
  has seen it in the journal.

---

## F. Story

### D45. "Previously:" spoken aloud — G10#8, G11#8, G12#3a, G12#25 (and G12's opposite "what works" note) · **must**
- **The disagreement:** G10 and G11 say the spoken label breaks the fourth wall and flattens every voice. G12 lists
  "every brief opens with Previously: in the caller's voice" as working.
- **Options:**
  - (a) Keep the spoken label.
  - (b) A journal field plus in-voice clauses (GR4).
  - (c) A UI header line on the comms card, with no clause.
- **Decision:** (b), applied to all 70 rows (GR4).
- **Reason:** the context rule asks for the journal line "in the speaker's voice ... not a system note". The spoken
  label is a system note, and it hands characters knowledge they cannot have (Betony, the Countess, #32's skippable
  side quest).
- **Fix round:**
  - Add `previously` to the quest def and show it in the journal's Active card, filled for every row from the
    outline's "Previously" column, which already exists for each row.
  - Rewrite every comms step 0 that starts with the label.
  - Fix #29 (Frank), #32 (point at #25, not the side quest), #63 (choice-aware), #65 (the Countess).
  - Add a test: no comms line starts with "Previously".

### D46. Every briefing ends on a price — G10#9, G11#9 · **must**
- **Options:**
  - (a) Keep the spoken fees.
  - (b) Show fees in a reward chip and keep them in dialogue only where money is the story (GR5).
  - (c) Remove fees from the briefing entirely.
- **Decision:** (b).
- **Reason:** the context rule is satisfied by "shown". The warm beats stop turning friends into clients. (c) would
  break the "what the player gets" item of the context rule.
- **Fix round:**
  - The reward chip goes on the comms card and the journal card.
  - Cut the spoken fees except in GR5's list.
  - Fix the odd payers: broke Cam (#30) pays in "the entry money back, someday"; Sorrel (#24) gives a favour.
  - Do this in the same pass as D45.

### D47. The crew vanishes in act III; Tansy's break — G11#1 (blocker), G11#32 · #1 **must**, #32 **should**
- **Decision:** G11's fix, as comms and short scene beats only:
  - one call per part cut (Tansy after #41 and #50, Pip after #44 and #46), each saying what the caller did with their
    share of the split;
  - Pip's reason for being at Rootwell, in the #46 p2 intro;
  - Pip's one act III "Okay, hear me out" (D57).
  - #32: Tansy's one raised-voice beat about the bay ("They chained my bay. MY bay."), in the #39 culvert after the hug.
- **Reason:** "more character development" is the user's first story ask (L84), and it is Tansy's bible arc ("never
  raises her voice until act III").

### D48. Both endings get the same epilogue; Cam's choice is forgotten — G12#5, G12#3 · **must**
- **Options:**
  - (a) Two outro variants per option, as #62 already does.
  - (b) A choice-gated step inside one outro.
- **Decision:** whichever the scene runner already supports. #62's per-option `outro` is (a), so prefer (a). Add
  (b) only if (a) would duplicate 92 s of steps.
- **Fix round:**
  - **Ending shots:** A, clover through the stripe at dusk with Bracken kneeling; B, the neon grid at night with
    Lulu's horn.
  - **Cam's line, after Reginald:** if freed, "Cameron. You missed a leaf."; if left, Juniper picks the leaf off the
    broom's bench and says nothing.
  - **Text:** `bulletinB` for W19. #63's brief becomes choice-aware. The doneText follows the ending.

### D49. Dark and rainy key frames — G10#3, G10#25, G11#16, G11#18, G12#10 · **must**
- **Decision:** GR6.
- **Fix round, per scene:**
  - #14: the bench close-up is reframed onto Pip's face. Dusk, not night, or a court floodlight on the bench.
  - #15 outro: 8–12 extras on the tiers, plus bunting.
  - #50 mid: Vesper's turn and the Countess's card, with a lantern key light.
  - #44 outro, the #39 culvert and the All Hats count: firelight on faces, pinned clear weather.
  - #50 (and others): fix the shots that show the back of a head.

### D50. Objective variety — G10#17, G12#14, G11#19 · **should**
- **Decision:** GR7, with the editors' fixes:
  - #33: tow the lock home on Hogweed's trailer as a checkpoint run, and drop the return passenger leg.
  - #34: Granny drives herself and needs escorting past an HOA van (a convoy).
  - #10: the scrap bins move to the Underspan heaps.
  - #67: the last step becomes an on-foot escort through the Green.
  - #44: the run home becomes a pursuit by an HOA gunboat using the existing boat chasers, or a timer as the fallback.
  - #45: "cross the quad with your cap down" becomes a short checkpoint route.

### D51. The Buck-Iron Combine as every job's vehicle — G10#18 · **should**
- **Decision:**
  - #15's getaway is in Pip's Zero-Turn, the vehicle act II ends on.
  - #25's tow is cut to the loch shore: the Flock punt the raft across, and the player tows it from the shore with the
    barrow buggy to the canal mooring that #32 starts from. That also fixes G10#8's #32 recap.
  - #8 and #16 keep their combines.
- **Reason:** "Combine" must stay the villain's word, and the 1.6 km empty tow is dead time.

### D52. Six quests without a mention of the Grand Combine — G10#19 · **should**
- **Decision:** add one line each to two existing comms or banter lines, with no new scenes. Frank in #13 ("Something
  the size of a block came down Route South on a low-loader."). Hogweed in #10 ("Somebody's ordering blades by the
  thousand.").

### D53. #46 ends on foot — G11#14 · **should**
- **Decision:**
  - The player flies out: take off from Rootwell Field with Wally on the radio, and reach one air checkpoint over the
    open dome (W12).
  - Add the outro beat: "Where to, kid?" / "The lodge."
  - Plane quests already exist, so this uses an existing kind.
  - Fallback if the air checkpoint is unreliable in the quest sim: Wally flies, and the player rides as a passenger
    over the Anthill (a scene).

### D54. The #50 heist has no stakes — G11#15 · **should**
- **Decision:**
  - One real constraint: a timed photograph of the ledger while Chicory's lantern circles. A failed attempt restarts
    the step, with the checkpoint auto-retry.
  - The ledger moves to a guarded side table under the terrace awning.
  - Use the tray-level `maxDamage` variant only if a timer is not available on the probe or inspect kind.
- **Reason:** tension 7 must be playable, and it should stay light.

### D55. All Hats leaves out the Don, Samphire, Brenda and Wally — G12#9 · **should**
- **Decision:** add two pitches. Big Lou hangs the Don's hat (Lou: "Don's. ...Borrowed."). Samphire's tricorn hangs
  with Brenda's flamingo feather. Tansy counts to nine.
- **Fix round:** W16 and `coalition-of-all-hats.md` follow. Wally's "By Air" is honoured by his flypast in the count
  scene, not by a hat: he keeps his own.

### D56. Tansy's "Go." is undone in #57 — G12#26 · **could**
- **Decision:** the second variant. "Don't." / "You said go last time." / "That was a board. This is a parachute."

### D57. "Okay, hear me out": too often in acts I–II, missing in act III — G10#7, G11#1c (the two editors agree; a ruling makes it binding) · **should**
- **Decision:** exactly one per act, per the direction notes:
  - Act I: #15 p1.
  - Act II: one, at the writer's choice, from the existing six (keep #22's).
  - Act III: Pip in #46 (the ramp).
  - Act IV: as built (#54, #57 fixed per D56, #70).
  - Replace the rest with Pip's self-undoing second sentence.

### D59. G10's act-turn blockers that touch spirit — G10#1, G10#4 (craft; noted for order) · **must**
- **Decision:** these are craft fixes, and they stay with G10's proposals. They are listed here only so the fix lead
  does them together with D1 and D45: #15's plan and the tribunal move into the p1 brief, and #35 spends its reveal
  once.

---

## G. Shared craft fixes (GR8): one fix each, in shared code

### D58. Defects found by several groups — **must** (each one item, one owner)

| Defect | Found in | The one fix |
|---|---|---|
| Long signs unreadable | G1#17, G2#12, G3#28, G6#2, G6#13 | `textPlate` wraps words to the plate's aspect and sizes its canvas cell to the plate width (512 px for plates over 1.5 m). Legible at 6 m on a 390 px screen. Dense notice boards get a "Read the notices" interact spot. Plates sit flush on their boards. |
| Free-standing signs blank from behind | G2#11, G3#19 | Free-standing boards print both faces. The back face may carry a second joke. Wall signs face their approach. |
| Interior cutaway: floating signs, sky band, camera in walls | G1#4, G1#11, G6#18, G1#14, G8#11 | Wall decor culls with its wall. Interiors use a dark warm background and less fog. An entry-view check for every interior: nothing taller than 1.2 m within 3 m in front of the spawn, and camera clearance on `stairsTo` arrivals. |
| Weather particles drawn as hard squares | G2#30, G4#3, G5 note, G6#29 | Soft round sprites for snow. Leaf and petal sprites for blustery debris. Near-camera fade. `?weather=off` hides the chip. |
| Speech bubbles off screen or covering the screen | G2#20, G6#3 | Clamp bubbles to the safe area, cap their scale (smaller on phones), keep them clear of the HUD corners, and hide them when the camera is inside the speaker's ring. |
| Grey stair-stepped rock on cuts | G4#27, G4#28, G5#1, G5#2, G6#11, G4#17 | Rock paint only where the lore says rock (the Hatbrim, the Spine Cut, the Keyhole). Every other cut or fill is painted dirt or grass, with a wider batter. Site exemptions: `observatory-mound`, `dirt-track`, the Unmown trails. Smooth the stepped lips. |
| Elevated undersides as black voids | G1#5, G6#15 | An emissive floor on underside materials, plus tunnel and deck lamps (G1#5's dressing). |
| The minimap inside interiors | G6#30 | Hide the minimap, or show a room plan, while `currentInterior()` is set. |
| Ambient gnomes can't stand on decks | G3#1, G3#2 | Boardwalk deck height fixed. `AmbientGnomeDef.y` / `surface: 'rooftop'`. |
| The same character, many outfits | G3#3 | One source of truth: the cutscene cast presets imported everywhere the character appears. |

---

## Count

59 entries:
- 57 rulings (D1–D43 and D45–D57, D59; there is no D44, because the taxi brand is ruled inside D37);
- one shared-fix table (D58).

By priority:
- **must:** 23 (D1, D2, D3, D5 key, D8 landmarks, D9, D10 queues, D12, D14, D16 Unmown, D24, D28, D30, D33, D36,
  D37, D45, D46, D47 #1, D48, D49, D58, D59);
- **should:** about 30;
- **could:** 6;
- **no change:** 1 (D20).

Every spirit finding of G1–G12 is covered by one of these entries.
