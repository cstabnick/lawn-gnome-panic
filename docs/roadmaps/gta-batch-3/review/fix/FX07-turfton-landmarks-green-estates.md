# FX07 Turfton landmarks, Founders' Green before and after, the Even-Estates
Wave: 3 · Depends on: FX01, FX04, FX05 · Kind: Fix (content, story-world)
Findings: 10 (G1#2, G1#7, G1#8, G1#9, G1#10, G1#23, G1#25, G1#26, G1#29, G10#2) · Decisions: D1, D2, D4, D8

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The places the story is about exist and change with it: City Hall is the upside-down planter, the Double Pot is two pots, Founders' Green is a condemned squat until #15 and an everyday green after it, and the Even-Estates go from survey pegs to a build to a cancelled (or beige) estate (D1, D2, D4, D8 landmarks).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- the City Hall block: a new City Hall landmark replacing the tower slot behind (14, -72), quests/stages/turfton.ts forecourt marks, mapPois.ts (City Hall POI, Founders' Green labels)
- city/megaBlock.ts (the Double Pot halves as tapered terracotta pots, street door), world.ts `buildThorneTower` ground floor
- parks/blocks.ts, worldChanges/rows/greenAndBarn.ts (W03 split), court/runtime.ts and skate/runtime.ts (place-name toasts only), sports/app.ts (title)
- quests/story/09-where-asphalt-sleeps.ts and 14-drainpipe-court.ts (hints and bulletins only), quests/unlocks.ts (`sq-court-regulars`, `sq-gutter-bowls-sessions` why text only)
- country/estates.ts, country/estatesLife.ts, worldChanges/rows/estates.ts, worldChanges/defs.ts (W02/W03/W05/W17 rows only), scatter exclusion for the site rects (biomes.ts / sites.ts)
- docs/lore: founders-green.md, downtown-turfton.md, turfton-city-hall.md, rulings.md (append)
- packages/prefabs: City Hall, terracotta pot halves, survey kit, condemned notice

### Findings (10)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#2** (blocker, craft · **must**, D8) City Hall does not exist: the civic forecourt sits in front of a Buck-Iron store
  - What: the `city-hall-steps` stage (centre (14, -69)) describes "a new stone City Hall built on the north-east block". In the world there is a podium, a flagpole and a lectern on the grass in front of a generic green glass tower with a **BUCK-IRON** sign. The lore …
  - Where: world (14, -63) facing north. Shot `cityhall-close.png`. `quests/stages/turfton.ts:151`, `docs/lore/entries/apocrypha/turfton-city-hall.md`.
  - Editor's fix: replace the tower on that block (the `towers/` slot behind (14, -72)) with a City Hall landmark: an inverted planter of 2-3 tiers, a stone CITY HALL plaque over the steps, green astroturf steps, two flagpoles, the Zoning Board's bench on the top step, and the "THIS RIBBON CUT BY MAYOR MULCH (THIRD COAT)" podium. Use a new `gta-city-hall` prefab or a landmark entry. Give it a map POI and a district sign. Keep the …
  - Decision: D8 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `cityhall-close.png`
- **G1#7** (polish, spirit · **must**, D1) Founders' Green is named, mapped and playable before it "opens" in #15
  - What: the lore and W03 say the Green is three condemned blocks that Juniper rezones in #15 (ribbon, crowd, condemned signs gone; "before the ribbon came down, the blocks carried condemned signs so old that a bird nested in one"). In the game the court and skate …
  - Where: `parks/blocks.ts:25-26`, `mapPois.ts:62`, `court/runtime.ts:102`, `skate/runtime.ts:356`, `sports/app.ts:48`, `worldChanges/rows/greenAndBarn.ts` (W03). Shots `gnorwin.png`, `w03-green.png`.
  - Editor's fix: before W03, show the two blocks as "the condemned blocks": THORNE LAWN & ORDER CONDEMNED notices on stakes (one with the nest), chalk crosses on the paving, and the map label "Condemned blocks". Keep the court and bowls playable, as a squat the regulars run ("COURT CLOSED (WE ARE PLAYING ANYWAY)"), so E19's content is not locked. W03 removes the notices, and the name and blips switch to Founders' Green. Update …
  - Decision: D1 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `gnorwin.png`, `w03-green.png`
- **G1#8** (polish, craft · **must**, D2) The Even-Estates sites are always up: before #7 and after the finale
  - What: E16 builds hoardings, gates, crane, crews and show-homes on all three sites permanently. W02's bulletin says "building starts on three fringe sites" after #7, but they were already there. W17 ("After the Even Cut", `hides: ['W02']`) only removes W02's extra …
  - Where: `country/estates.ts`, `worldChanges/rows/estates.ts` header comment, `worldChanges/defs.ts` W02/W17. Shots `estates1.png`, `estates1b.png`, `estates2.png`.
  - Editor's fix: before W02, the sites are surveyed plots: pegs and string, one Levelright survey tripod, a "PLOT ACQUIRED" board, no hoarding. With W02 (or W18), the E16 build appears. With W17, the hoardings come down (keep the empty show-homes per W18), add wildflowers through the cones, and change the gate board to "SAMENESS: CANCELLED". Ending B instead gets beige paint over everything and a single lit window. …
  - Decision: D2 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `estates1.png`, `estates1b.png`, `estates2.png`
- **G1#9** (polish, craft · **must**, D2) Estates: the boulder still blocks construction-1's gate; the show-homes read as unfinished boxes from outside
  - What: (a) The general scatter's boulder stands in the gate of construction-1. E16's own screenshot pass noted it and it was not fixed. (b) From the road the hoardings are blank grey walls (the jokes are on the gate face only), and the show-homes behind are beige …
  - Where: construction-1 gate (≈(-295, -145)), `estates1b.png`; outside faces `estates1.png`, `estates2.png`; `country/estates.ts`, scatter exclusion in `biomes.ts`/`sites.ts`.
  - Editor's fix: add the estate site rects to the scatter exclusion (or a `clearScatter(site)` pass). Put one joke board every ~15 m on the outer hoarding faces, reusing the existing gag list ("MIND THE HOUSES", "PLEASE DO NOT MOVE THE HOUSES"). Give the show-homes identical doors, two identical windows, an identical doormat and an identical potted shrub each (prefab reuse is the joke). Paint the site interior with a `mud`/`gravel` …
  - Decision: D2 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `estates1b.png`, `estates1.png`, `estates2.png`
- **G1#10** (polish, craft · **must**, D8) The Double Pot has no presence at street level
  - What: the sales-floor door in the tunnel (112.4, -84) has no sign, canopy or window display. The outer faces of both halves are anonymous shop glazing (`dpot-side.png`). W05 ("tops out") adds a banner on the south face, but there is nothing for it to top out …
  - Where: `interiors/showcase/doublePot.ts`, `worldChanges/rows/estates.ts` W05, `city/megaBlock.ts`.
  - Editor's fix: add a beige canopy and "THORNE EVEN-ESTATES · SALES · BY APPOINTMENT" over the door, a window with the model estate, and an A-board "NOW SELLING PHASE 3". Before W05, a tower crane on the east half's roof and scaffold on the top two floors. W05 removes them and adds the banner (as today).
  - Decision: D8 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `dpot-side.png`
- **G1#23** (polish, spirit · **should**, D4) The W03 opening crowd stands forever after #15
  - What: W03's eight flag-waving gnomes and the brass trio on the bandstand are permanent once #15 is done, and so are the cut ribbon stakes. They bob in place for the rest of the game.
  - Where: `worldChanges/rows/greenAndBarn.ts` W03. Shot `w03-green.png`.
  - Editor's fix: split W03 into "opening day" (crowd, band, ribbon: shown until the next in-game dawn after #15, or for 20 minutes of play) and "open" (the bandstand stays with a council notice board "dawn to dusk, hats on", the booking sheet "always booked, never used" and the lost boot card from `founders-green.md`'s Everyday). The band plays only Saturdays (`worldEvents`).
  - Decision: D4 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `w03-green.png`
- **G1#25** (nit, craft · **could**) Thorne Tower's base and the Mulch Club are lightless black blocks at street level
  - What: Thorne Tower's obsidian window texture reads as a black void from the pavement, with no lobby, doors or name. The Mulch Club exterior from (-30, -40) fills the screen pure black.
  - Where: `world.ts buildThorneTower` (391-436); the Mulch Club building near (-30, -30). Shot `tower.png`.
  - Editor's fix: add a ground-floor lobby band to Thorne Tower: gold revolving door, "THORNE LAWN & ORDER" lettering, two beige-uniform doormen, and topiary cubes clipped to exactly 1 m with a measuring stick. Give the Mulch Club a door with no handle (lore), a velvet rope and Big Lou. Lift both blacks to a deep charcoal with a rim light.
  - Re-check: `review/shots/G1/`: `tower.png`
- **G1#26** (nit, craft · **could**) Building-site nights are dark and the night watchman is not visible; firefly sprites read as green squares
  - What: at night construction-1 is unlit: no site lamps and no watchman's lantern in view. "Fireflies" render as hard green squares across the whole sky.
  - Where: `country/estatesLife.ts` (Night Watch), the firefly emitter (sky). Shot `n-estates.png`.
  - Editor's fix: add a lit site cabin window, two flood-lamp posts and the watchman's swinging lantern (emissive). Render fireflies as soft round points with size falloff, kept below tree-top height.
  - Split: Soft round firefly points with size falloff (the sky emitter). FX07 lights the site cabin, flood lamps and the watchman's lantern. (part done by FX01)
  - Re-check: `review/shots/G1/`: `n-estates.png`
- **G1#29** (nit, craft · **must**, D1) Lore drift in Turfton entries
  - What: `downtown-turfton.md` still lists "Gnorwin Clayfoot Park: the small green square at the Downtown edge" and the "City Hall steps (0, -72)" (the stage is at (14, -69)). It never mentions Founders' Green, the Double Pot or the skyway over the z = -50 corridor. …
  - Where: `docs/lore/entries/apocrypha/downtown-turfton.md`, `founders-green.md`, `turfton-city-hall.md`; `worldChanges/rows/greenAndBarn.ts:2`.
  - Editor's fix: rule which three blocks were condemned (proposal: the court block, the skate block and the strip of the x = -60 street between them, which W03 "repaves"; Gnorwin Park joined them). Update the three entries with the built coordinates and the skyway, and fix the comment. `npm run lore` must pass.
  - Decision: D1 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#2** (blocker, craft · **must**, D1) Founders' Green is on the map, in hints and bulletins before #15 creates it
  - What: #15's payoff is Juniper rezoning "three condemned blocks" as Founders' Green (W03). But the map blip says Founders' Green from minute one (`mapPois.ts` from `parks/blocks.ts`), #9's hint is "The Gutter Bowls, Founders' Green", #14's bulletin says "the …
  - Where: `quests/story/09-where-asphalt-sleeps.ts` (hint), `14-drainpipe-court.ts` (bulletin), `unlocks.ts` (`sq-court-regulars`, `sq-gutter-bowls-sessions` why), `mapPois.ts`, `court/runtime.ts`; W03 in `worldChanges/rows/greenAndBarn.ts`. G1 found the same from the …
  - Editor's fix: before `ch1-founders-boot` is done, call the place "Gnorwin Park and the condemned blocks" (map label gated on W03, hints "The Gutter Bowls, behind the HOA hoarding"), put HOA CONDEMNED notices on the court and bowls (W03 already removes them), and give #9 and #14 one line each that plants it (Fennel: "They want the bowls flat by Trim Day."; Swish: "Last season, chief. Then it's a car park."). The rezoning then …
  - Decision: D1 (quoted in full under "Decisions this epic applies").
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

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D1. Founders' Green before #15 — G1#7, G10#2, G1#29 · **must**
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

#### D2. Even-Estates sites: always up — G1#8, G1#9 · **must**
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

#### D4. The W03 opening crowd stands forever — G1#23 · **should**
- **Decision:** split W03 into "opening day" (crowd, brass trio, ribbon) and "open" (bandstand, council notice board,
  booking sheet, lost-boot card).
- **Reason:** GR2, everyday state after the payoff. It also frees the space for W19 and W07.
- **Fix round:**
  - Opening day lasts until the next in-game dawn after #15, or 20 minutes of play, whichever comes first.
  - After that, the band plays only on the in-game weekend slot of `worldEvents`.

#### D8. Turfton: garden town or a European city in pots' clothing — G1#6, with G1#2, G1#10, G1#30 · City Hall and Double Pot **must**, homes **should**
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


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- GR2 test: before-beat quest text, hints, bulletins, unlock `why`, map POIs and runtime toasts contain no after-name (`Founders' Green` before `ch1-founders-boot`). FX22-FX24 keep it green.
- Estates build groups: `survey`, `build`, `cancelledA`, `beigeB` switched by W02/W17.
- W03 split into `opening-day` (until the next in-game dawn after #15 or 20 min of play) and `open` (bandstand, council board, booking sheet, lost-boot card; band only on the weekend `worldEvents` slot).

## Contracts this epic consumes from earlier epics

- FX01 `textPlate` / `signBoard` for every new board. FX05 quest-scoped sets (the #15 outro extras).
- FX04 ramp skins (the park ramp is already skinned there).

## Online / mobile / achievements / prefabs / lore notes

- GR2: places stay playable from the start (no locks). The rezoning visibly transforms the place.
- Lore: record D1 and D8 rulings (the three condemned blocks; "pots in Continental hats") in rulings.md, numbered after the last one on the branch (the orchestrator renumbers from R-237 in merge order). `npm run lore`.
- Prefab rule: every new landmark and part through `@lawn/prefabs`.

## Risks and open questions (with the decision taken)

- The Double Pot slab and tunnel must keep their colliders and the tunnel road clear (FX05's road test).
- Map POI rename must not break saved waypoints: keep the POI ids, change labels.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX07/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- The GR2 test passes. `?worldchange=W03` and without it show the two states; `?worldchange=W02` / W17 A / B show the estate states.
- City Hall reads as an inverted planter from (14, -63) facing north at 960x600 and 390x844 (G1 `cityhall-close.png`).
- All 7 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
