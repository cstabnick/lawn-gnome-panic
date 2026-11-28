# FX08 Turfton homes, Flat 3B, the Bodega, the Underspan and street life
Wave: 4 · Depends on: FX01, FX02, FX03, FX07 · Kind: Fix (content)
Findings: 10 (G1#6, G1#15, G1#18, G1#19, G1#20, G1#22, G1#27, G1#28, G1#30, G8#25) · Decisions: D5, D6, D8

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Turfton's homes read as a garden town (D8 homes, option a), the player's flat answers the story (D5 key, D6), and its streets and the Underspan have life and light.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- homes/townHomes.ts, homes/saucerCourt.ts (Turfton palette, pot-rim cornice, drainage-hole window, Kerb Row S = 1.3, saucer-rim roof edge, watering-can tank)
- interiors/showcase/flat3b.ts, interiors/showcase/bodega.ts
- worldChanges/rows/saucerCourt.ts (W09 hammock and flat dressing)
- skate/build.ts (the Gutter Bowls street wall)
- societies/underspan/build.ts (lights, gliders, dumbwaiter, ground)
- towers/facadeAtlas.ts, towers/dress.ts (ground-floor night glazing)
- districts.ts / the district name for the bin depot (G8#25)
- packages/prefabs: the Turfton home parts as prefab options or variants, `shop-shelf-stocked`

### Findings (10)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#6** (polish, spirit · **should**, D8) Turfton's homes and towers read as a human European city, not a gnome garden town (spirit)
  - What: the lore says Turfton is "lined with giant flower pots, sheds and birdbaths that the gnomes live in", that "every tower in Turfton is a pot on a pot", and that the Double Pot is "two giant flower pots side by side". What is built: Kerb Row is three Pardonlin …
  - Where: `homes/townHomes.ts` (juniper(), mayor(), townhouse), `homes/saucerCourt.ts`, `city/megaBlock.ts`. Shots `kerbrow.png`, `patio.png`, `saucer-stair.png`, `dpot-far.png`, `dpot-side.png`, `tower.png`.
  - Decision: D8 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `kerbrow.png`, `patio.png`, `saucer-stair.png`, `dpot-far.png`, `dpot-side.png`, `tower.png`
- **G1#15** (polish, craft · **should**) The Gutter Bowls show the street a blank 3 m concrete wall
  - What: from the south road (z ≈ 114) the skate park is a long grey skirt wall with one small "GB". Nothing of the bowls is visible, and there is no sign or entrance on that side.
  - Where: `skate/build.ts` (skirt walls, graffiti at `buildGraffiti`). Shot `skate.png`.
  - Editor's fix: paint it: a full-length mural of 3-4 graffiti pieces (acorn, crown, "THE GUTTER BOWLS est. the day it rained"), a stair cut in the middle with a handrail (doubles as a skate line entry), two benches with spectators, and a "NO SKATING ON THE WALL (SKATE IN THE WALL)" plate.
  - Re-check: `review/shots/G1/`: `skate.png`
- **G1#18** (polish, craft · **should**) Saucer Court W09: Pip's hammock floats on the façade
  - What: W09 puts `fennel-hammock` at (32.2, 79.5) 4.6 m up "across flat 3B's window". It hangs flat against the wall with nothing to tie to: no balcony, hooks or posts.
  - Where: `worldChanges/rows/saucerCourt.ts` W09. Shot `w09-saucer.png` (upper middle).
  - Editor's fix: add a short balcony slab and railing under 3B's window (only flat 3B has one, a joke in itself), sling the hammock between the railing and a hook, and let a sock hang off it. Or move the hammock to the courtyard between the washing-line poles.
  - Re-check: `review/shots/G1/`: `w09-saucer.png`
- **G1#19** (polish, spirit · **should**, D6) Flat 3B does not change when Pip moves in (W09)
  - What: W09 adds a toolbox and a hammock outside, but the flat interior has no trace of a second tenant: no bedroll, no toolbox, no second mug. The stairwell rules say "3. NO LODGERS" and the outside adds "NO LODGERS" again.
  - Where: `interiors/showcase/flat3b.ts` build (no world-change hooks).
  - Editor's fix: when W09 is on, add fixed dressing: Pip's bedroll in the corner by the door (not in the layout, so it does not take a decorate slot), a toolbox, two mugs on whatever table exists, and a sticky note "I PAY IN FIXING THINGS — P." Remove it if a later story beat moves Pip out.
  - Decision: D6 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G1#20** (polish, craft · **should**) The Bodega reads as a living room, not a shop
  - What: Bodega & Sons is a counter, two bookshelves, a fallen crate tower and a rug. There are no shop shelves, cooler, snack rack or price tags. The giant "Tall One's pencil" vignette is repeated on the Even-Estates sales floor.
  - Where: `interiors/showcase/bodega.ts`. Shots `i-bodega.png`, `i-dpot.png`.
  - Editor's fix: replace the bookshelves with 2 shop-shelf prefabs stocked with cans and boxes (add a `shop-shelf-stocked` prefab if none fits), an Acorn-Cola cooler with a "LUKEWARM AS ADVERTISED" sticker (move the sign onto it), a lottery-card stand and a newspaper rack with the Tattler. Swap the sales floor's pencil for a Levelright spirit level 2 m long, "CALIBRATED TO THORNE".
  - Re-check: `review/shots/G1/`: `i-bodega.png`, `i-dpot.png`
- **G1#22** (polish, craft · **should**) The Underspan is a raw building site under a void; the ground is desert sand
  - What: under the black Span deck (#5) the Underspan is scaffold towers, bare plank tables and two notice boards on yellow sand. The residents and vignettes are there (Nettle's bark, the glider) but read small. Nothing hangs from the deck: no bunting, bulbs or …
  - Where: `societies/underspan/build.ts`, site x 560..600, z -51..-1. Shots `underspan-road.png`, `underspan-in.png`.
  - Editor's fix: string festoon bulbs and pulley lines from the Span's underside to the scaffolds. Hang two umbrella-glider prototypes from the deck on ropes. Add a hand-cranked dumbwaiter between the ground and the Roost (decor), a chalk "ALTITUDE RECORD" board, and a workbench with tools on each plank table. Ground: a packed-earth patch with oil stains and sawdust, not dune sand.
  - Re-check: `review/shots/G1/`: `underspan-road.png`, `underspan-in.png`
- **G1#27** (nit, craft · **could**) Ground-floor glazing glows flat cyan at night
  - What: at night the Double Pot and downtown shop fronts glow as uniform pale-cyan slabs, brighter than any street lamp.
  - Where: `towers/facadeAtlas.ts` / `towers/dress.ts` ground-floor material. Shot `n-tunnel.png`.
  - Editor's fix: warm tint (0xffd9a0), 30–60% of panes lit at random per block, and darker mullions.
  - Re-check: `review/shots/G1/`: `n-tunnel.png`
- **G1#28** (nit, craft · **could**) Flat 3B's dressing is oversized
  - What: the three sealed letters by the door are about 0.6 m long (forearm-length on a gnome). The moving crates are taller than the player.
  - Where: `interiors/showcase/flat3b.ts` (sealed-letter, crate). Shot `i-flat-empty.png`.
  - Editor's fix: sealed-letter at scale 0.5, fanned in a pile of 6-8 with one opened, and crates at 0.75.
  - Re-check: `review/shots/G1/`: `i-flat-empty.png`
- **G1#30** (nit, spirit · **should**, D8) Kerb Row and Patio Heights are quiet: one resident each, no street life
  - What: Juniper reads on her step and Reginald measures indoors, but the two streets have no passing neighbours, no window life by day, and no bins or kids. The terraces are 20 m tall (S = 1.7 scaling), which dwarfs the "narrow terrace".
  - Where: `homes/townHomes.ts`. Shots `kerbrow.png`, `patio.png`.
  - Editor's fix: add a neighbour on each street with a place-specific habit: on Kerb Row a gnome repainting the kerb ("kerbs: yes, row: ongoing"); on Patio Heights a press photographer camped opposite the Mayor's red villa, and an HOA inspector measuring Reginald's lawn with calipers (ties to #12). Scale Kerb Row to S = 1.3 so it reads as a terrace, not a tower row.
  - Decision: D8 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `kerbrow.png`, `patio.png`
- **G8#25** (nit, craft · **could**) The bin round starts in "Mossy Wood"
  - What: the Bin Depot is "by the Compost Heap" in Turfton (job place text), but driving out of it fires the "Entering Mossy Wood" banner (`binD-4.png`), and the fire station on the Mossy Wood edge shows it too.
  - Where: biome / district at (-218, -89) and (-221, 135); `jobs/workDefs.ts` place names.
  - Editor's fix: either give the depot and station their own named district ("the Compost Yards") or rename the place text to match the banner. G1 may own the district map.
  - Re-check: `review/shots/G8/`: `binD-4.png`

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

#### D5. "Penthouse Viewing" has no penthouse, and the key is never hung — G10#6 · key **must**, set **should**
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

#### D6. Flat 3B when Pip moves in — G1#19 · **should**
- **Decision:** yes. Fixed dressing on W09:
  - a bedroll by the door (outside the decorate layout);
  - a toolbox;
  - two mugs;
  - the note "I PAY IN FIXING THINGS — P.".
- **Reason:** the player's home is the most-visited interior, so the story beat should show most there.
- **Fix round:**
  - Remove the dressing if a later story beat moves Pip out. Check the outline, and gate on that row if one exists.
  - Move the outside hammock to the courtyard washing-line poles (G1#18). Do not add a balcony.

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


### Also does (a part of a finding owned by another epic)

- **G10#6** (owned by FX05): D5 key: the key prop on a hook by flat 3B's door, gated on choiceOf('m21...') === 'A' (flat3b.ts is FX08's file).

### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX02 interior culling and background. FX03 peaceful-interior list (Bodega, flat 3B). FX07's W-row split (do not edit greenAndBarn.ts).

## Online / mobile / achievements / prefabs / lore notes

- Also does (split): G10#6 key prop on a hook by flat 3B's door, gated on `choiceOf('m21...') === 'A'` (D5 key, must).
- D6: remove Pip's dressing if a later row moves him out (check the outline; gate on it).
- Pre-batch downtown towers: no change (D8). Lore ruling D8: "pots in Continental hats".

## Risks and open questions (with the decision taken)

- Decorate layout: the W09 bedroll and toolbox are outside the decorate layout and take no slot.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX08/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Flat 3B with and without `?worldchange=W09`, and with choice A set, shows the right dressing and key.
- All 0 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX05 (orchestrator)

- D5: the key that "will hang in flat 3B" (from #21) belongs to you (FX05 left it).
