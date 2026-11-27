# FX13 Capwood forest and run, the Hatbrim, Mittenholt and the High Tarn
Wave: 6 · Depends on: FX06, FX12 · Kind: Fix (content)
Findings: 15 (G4#17, G4#18, G4#19, G4#20, G4#21, G4#22, G4#23, G4#24, G4#25, G4#26, G4#27, G4#28, G4#29, G4#30, G4#31) · Decisions: D13, D25, D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Capwood is a forest you drive through (D13): clumped stems, giants that close overhead, a moss floor, faint glow at night, a real Great Ring and Gill Ford; the Capwood Run climbs as one flowing route; the Hatbrim's cuts are dressed rock, its paths are trodden snow, the Keyhole is a rock arch, and the running gags thin out (D25).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- capwood/** (forestPlan.ts, forest.ts, run.ts, runPlan.ts, spots.ts)
- raceTrack/defs/capwoodRun.ts, raceTrack/trackDef.ts ribbon params for `capwood-run`, `brim-gap-road`, `brim-walk`, defs/hatbrimPads.ts
- the ford visual (raceTrack fords / water.ts ford mesh)
- mountainRoutes/** (spinePlan, brimGapPlan, hatbrimPlan)
- living/hamletMittenholt.ts, living/highTarn.ts
- the High Tarn water marker shape (in north-highlands.level.json; FX12 has merged by now)
- packages/prefabs: `keyhole-arch`
- docs/lore Capwood entries

### Findings (15)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G4#17** (polish, spirit · **should (rock part: must, FX06)**, D13, D58) The Capwood Run climbs as a trombone of parallel straights that leave stair-step scars
  - What: The first ~2 km of `CAPWOOD_RUN` is four ruler-straight north-south legs (x 94, 124, 152, 182, 208, 236, each about 250-300 m long) joined by 10-15 m hairpins, laid side by side about 28 m apart (minimap in `runMid`, `ring`, `paddock`). The ribbon cut leaves …
  - Where: `raceTrack/defs/capwoodRun.ts` `control`.
  - Editor's fix: Re-lay the climb as one flowing route: an S-bend up the south face, a long sweeping traverse with a crest, two hairpins at most, the summit, and the descent as already drawn (the second half, from (238, -872) on, is good). Keep the length with sweepers instead of straights. Check cut depth so the scar stays under about 3 m (the E33 geometry tests show the method), and paint cut faces `rock` with snow on the top edge …
  - Decision: D13, D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Split: D58: rock rule for cut faces. FX13 re-lays the climb (D13). (part done by FX06)
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#18** (polish, spirit · **should**, D13) Capwood reads as a lawn with toadstools, not a forest
  - What: The toadstools stand evenly spaced on bright, open daisy meadow under full sky (`ring`, `cwInside`, `hut`, `ford2`). There is no undergrowth, no moss, no fallen logs, no shade, and the giant caps are few. The lore says "tall enough that gnomes walk under the …
  - Where: `capwood/forestPlan.ts` (scatter density, size mix, KEEP radii); ground paint in the site.
  - Editor's fix: Double the density in the core with clumps (3-7 stems) rather than even spacing, and more 8-12 m giants so the caps close overhead in places. Paint the floor darker: a moss and leaf-litter paint kind (a forest floor inside the site, bright meadow only in the clearings and at the Great Ring). Add fallen half-buried logs (the woodpile lore), fern and moss tufts, and a light mist or fog-density bump inside the site. …
  - Decision: D13 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#19** (polish, craft · **should**) The night glow is opaque mint balls, not a faint glow
  - What: At `?time=night` every cap gets an additive sphere shell (`capwood/forest.ts:103-116`, opacity 0.15). The shells overlap and stack into solid pale-green balls that hide the caps (`nightRing`). The lore (R-192) says the caps "glow faintly after dark", with the …
  - Where: `capwood/forest.ts` glow `InstancedMesh`.
  - Editor's fix: Drop the sphere shells. Use an emissive tint on the cap underside and gills (vertex colour or a second emissive material on the merged caps), plus a few soft billboard sprites under the Great Ring only. Or shrink the shells to the cap's underside and cut the opacity to about 0.05, using the cap colour, not pale mint.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#20** (polish, craft · **should**) The Great Ring is a flat dark-green blob
  - What: The ring of dark grass is a uniform dark-green flat shape that reads as a shadow or a hole. The ring's toadstools look like the rest of the forest (`ring`).
  - Where: `capwood/forestPlan.ts` (Great Ring decal and its toadstools).
  - Editor's fix: Make the ring a thin annulus (1.5-2 m wide) of darker, lusher grass with a mottled edge. Ring it with small, uniform, pale-capped toadstools in a clear circle (the folk image of a fairy ring), and leave the inside lighter meadow.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#21** (polish, craft · **should**) The Gill Ford is a dark rectangle, not water
  - What: At the Gill Ford the "water" is a dark, translucent, straight-edged rectangle laid over the road and well out onto the grass. It reads as a shadow (`ford2`, `gillFord`). E14's own pass noted it ("a pale translucent sheet ... may want a richer water look").
  - Where: The ford water mesh (raceTrack fords / `water.ts` ford visual).
  - Editor's fix: Cut the sheet to the road width plus a short curved overflow, with a shaped outline instead of a rectangle. Use the stream water material with a light flow scroll and foam at the edges, add stepping stones on one side, and connect a visible stream bed (a dip with reeds) on both sides so the ford crosses something.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#22** (nit, craft · **could**) The run's road-edge seam and the meadow trenches
  - What: Where the Capwood Run crosses flat meadow, the ribbon leaves the road about 0.5-1 m below grade with steep grass banks, like a dug channel (`run2Hair`). A thin bright yellow-green line runs along the road edges (`gillFord`, `runMid`).
  - Where: `raceTrack/trackDef.ts` ribbon relief (`fade`, `shoulder`) for `capwood-run`; terrain/road paint blend.
  - Editor's fix: Widen `fade` on flat ground so the road sits flush. Blend the verge paint (dirt to grass dither) instead of the hard bright edge.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#23** (nit, craft · **could**) Paddock clutter on the Fells snow
  - What: Small crates and hay bales are scattered one at a time across the snow around the paddock with no arrangement (`paddock`). They read as litter.
  - Where: `capwood/runPlan.ts` (paddock dressing) or the Fells' scatter.
  - Editor's fix: Group them: a stacked bale wall along the grid, a tyre stack, crates by the pavilion.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#24** (nit, craft · **could**) Lore: Capwood's caps are "grey on top", but the game has red, orange and brown caps
  - What: `apocrypha/capwood.md`: "Pink under the cap, grey on top." The game's caps are red, orange, maroon and brown (all Capwood shots).
  - Where: Lore entry vs `capwood/forestPlan.ts` tints.
  - Editor's fix: Change the saying to match the game (for example "Red on top, pink beneath. Never eat one ..."). Under R-236, the game wins.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#25** (polish, craft · **should**) The Keyhole looks like a concrete footbridge, not a rock arch
  - What: The arch is an 18 m flat box lintel on box pillars 12.5 m tall, standing on the road bed of a 25 m-deep gorge. Its top floats halfway up the cut and does not meet the gorge rims. Flat dark grey with a green underside, it reads as an overpass (`keyhole` …
  - Where: Prefab `keyhole-arch` (`packages/prefabs/src/catalog/gta-mountain-places.ts:105`); `mountainRoutes/spinePlan.ts` (`ARCH_SCALE 1.1`).
  - Editor's fix: Rebuild the arch from irregular stacked rock blobs (balls and rotated boxes in the stone, slate and moss palette) with a curved soffit. Scale it (about 2.2) or set it higher so the lintel's top joins both gorge rims, so it reads as the ridge left standing. Keep the 8.5 m clearance. Put the ribbon and nest on top where the camera sees them.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#26** (polish, craft · **should**) The High Tarn is a rectangle
  - What: The tarn's water is a 130 x 80 m axis-aligned rectangle (`north-highlands.level.json` marker `water/high-tarn` `w`/`d`). The minimap shows a perfect blue rectangle, and the shore runs straight (`tarn`, `tarnLay`).
  - Where: `data/levels/north-highlands.level.json` `water/high-tarn`; the water body builder.
  - Editor's fix: Give the water marker an ellipse or polygon shape (as other lochs use, if supported; otherwise add an `ellipse` option), with a shingle beach on the near shore and a rocky back wall under the Bobble.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#27** (polish, craft · **must**, D58) Ribbon cut-and-fill leaves raw, faceted grey walls along the Brim Gap Road
  - What: Below the lower hairpins the fill and cut are large flat grey faceted slopes, with big flat polygons visible from the band road (`passHair`). The snow on Old Pate is in clean horizontal bands that follow the terrace steps.
  - Where: Ribbon relief for `brim-gap-road`; slope paint (`gravel` above 0.3 slope).
  - Editor's fix: Paint cut faces `rock` with a darker band and scree at the toe. Scatter `scree-pile` and boulders on the fills (outside the road). Use drystone retaining walls on the tallest fills at the hairpins. Add a noise wobble to the snow line instead of the pure height threshold.
  - Decision: D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Split: D58: the rock-paint rule (rock only where the lore says rock: the Hatbrim is one). FX13 does the Brim Gap scree, walls and batters. (part done by FX06)
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#28** (polish, craft · **must**, D58) The Brim Walk and the summit pads look bulldozed
  - What: On the Bobble the 2.5 m trail and the summit platform pad cut flat brown rectangles and steps into the snow dome (`register`). The trail reads as a vehicle track, not a footpath, and the "yard's highest point" ends in a levelled lot.
  - Where: `brim-walk` ribbon (`width`, `shoulder`, `fade`); `defs/hatbrimPads.ts` `summit-platform`.
  - Editor's fix: Narrow the paint to about 1.2 m with a worn-snow (`trodden snow`) paint on top rather than dirt, keep the relief shallow (`fade` wide, cut at most 0.3 m), make the summit pad small and round, and pile the cairn on natural ground.
  - Decision: D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Split: D58: rock rule and smoothed lips. FX13 does the Brim Walk ribbon and the summit pads. (part done by FX06)
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#29** (nit, craft · **could**) The Top Hat lookout looks like a car park
  - What: The lookout pad is dark asphalt with white edge lines (`cafeView`). It reads as parking, not a terrace.
  - Where: `defs/hatbrimPads.ts` (`cafe-terrace`), pad surface.
  - Editor's fix: Flagstone or gravel paint on the terrace, a timber rail on the drop side, the telescope and the bench at the edge, and no road markings.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#30** (nit, spirit · **should**, D25) Two photographers waiting for the same shot, 1 km apart
  - What: Capwood's photographer at the Great Ring ("waiting for the caps to glow in one frame") and Snapper Lensley at the tarn lay-by ("Forty photos of the tarn. Same tarn. Different clouds.") are the same character beat.
  - Where: `capwood/forestPlan.ts:127-132`; `mountainRoutes/brimGapPlan.ts:291`.
  - Editor's fix: Keep Snapper, who has a name and a line. Turn the Capwood spot into something only Capwood has, for example a spore-sweeper's abandoned broom and a jar of collected glow, or an HOA surveyor fined mid-measurement.
  - Decision: D25 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#31** (nit, spirit · **should**, D25) Running gags are too dense in the Hatbrim and Mittenholt: "41", "two hats", "since Tuesday"
  - What: Within about 1 km: "FOUND: 41 left mittens", "Sheep: 41", "BUNS: 41", "ear tag, no. 41", "Sheep 41 is thinking about it". "Two hats" appears in "Two hats essential", "Hats: two", "Wear two hats" (twice) and the lore's "Two hats, one spare". "Back in five …
  - Where: `living/hamletMittenholt.ts:187`, `living/highTarn.ts`, `mountainRoutes/brimGapPlan.ts:82-83,160,242`, `mountainRoutes/hatbrimPlan.ts:170`, `mountainRoutes/spinePlan.ts:173`, `winter/pond.ts`.
  - Editor's fix: Keep "41" on the sheep (tag and tally) and Velma's buns. Change the mittens count, and keep "two hats" on one road sign and the lore. Rewrite the camper's note (for example "WENT FOR HELP. HELP WENT TOO.").
  - Decision: D25 (quoted in full under "Decisions this epic applies").
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

#### D13. Capwood: the forest and the run — G4#17, #18 · **should**
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

#### D25. Running gags repeated until they become tics — G4#30, G4#31, G10#31, G11#11, G11#12, G11#30 · **should**
- **Rule:** a running gag appears **once per place**, and at most about three times per region, except where it is a
  planted ladder (the story's code words, "Okay, hear me out": see D57).
- **Fix round:**
  - G4#31: keep "41" on the sheep (tag and tally) and on Velma's buns. Change the mittens count. Keep "two hats" on one
    road sign. Rewrite the camper's note.
  - G4#30: the Capwood photographer becomes something only Capwood has: a spore-sweeper's broom and a jar of glow.
  - G10#31: "Tuesday" is used only in the betrayal code and in the prologue's "Must be Tuesday". #9 and #31 use other
    days.
  - G11#11, #12, #30: thin out reused bible lines, "eleven" and "so it is stood" in the act III voice pass (GR4).

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Grey stair-stepped rock on cuts | G4#27, G4#28, G5#1, G5#2, G6#11, G4#17 | Rock paint only where the lore says rock (the Hatbrim, the Spine Cut, the Keyhole). Every other cut or fill is painted dirt or grass, with a wider batter. Site exemptions: `observatory-mound`, `dirt-track`, the Unmown trails. Smooth the stepped lips. |


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX06 rock rule and route clearance test (G4#16). FX12 snow paint and the Capwood thaw.

## Online / mobile / achievements / prefabs / lore notes

- D13: the climb (first ~2 km) re-laid; total length ≥2.5 km; cut depth ≤3 m with rock paint and a snow edge; fords capped at `WATERLOG.fordCap`; descent from (238, -872) unchanged; re-run drive-along tests and re-record best times.
- Do not edit `assembly/kernel.ts` in this wave (FX15 owns it): the forest floor is a flat-layer decal inside the site.
- GR9 density at the Capwood core.

## Risks and open questions (with the decision taken)

- Re-laying the run changes `capwoodRun.test.ts` and the race times: update the expected bests deliberately.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX13/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Drive-along and race tests green; perf at the Capwood core within GR9.
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
