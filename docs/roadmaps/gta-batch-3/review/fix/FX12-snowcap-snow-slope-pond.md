# FX12 Snowcap Rise snow, Snowdrop Slope, the Wool Run and Pail Pond
Wave: 5 · Depends on: FX01, FX03, FX06 · Kind: Fix (content)
Findings: 14 (G4#1, G4#2, G4#4, G4#6, G4#7, G4#8, G4#9, G4#10, G4#12, G4#13, G4#14, G4#15, G4#32, G8#22) · Decisions: D12, D24, D26

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Snowcap Rise is white above the band road (D12) with a thawed green Capwood hollow, the slope is a place (lodge on a pad, piste dressing), the Wool Run starts at the summit for 35-45 s (D26), you stop in a run-out, the pail reads as a pail, and the bears are chill, never dead (D24).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- landforms/northHighlands.ts `paint()` and the Wasm mirror `assembly/kernel.ts evalRegionPaint` (north band only) with a parity test
- data/levels/north-highlands.level.json (snowfield / pond features, the lodge pad)
- winter/** (hill.ts, types.ts, course.ts, runtime.ts `finishRun`, tow.ts, pond.ts, save.ts)
- critters/snowcap.ts, critters/fells.ts (the bears)
- docs/lore snowcap-rise.md
- packages/prefabs: `woolly-sock-lodge`, piste poles, snow fence

### Findings (14)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G4#1** (blocker, craft · **must**, D12) Snowcap Rise is green: Pail Pond is ice in a daisy meadow
  - What: The paint rule `landforms/northHighlands.ts` paints snow only above 32 m, the `snowfield` capsule and the `pond` disc. Everything else on the Rise is `meadow` with yellow and white flowers. Pail Pond's ice disc ends at a grey rim and green grass with daisies …
  - Where: `landforms/northHighlands.ts` `paint()`; the Wasm mirror `assembly/kernel.ts evalRegionPaint`; `data/levels/north-highlands.level.json` features.
  - Editor's fix: Add a `snowApron` margin to `pond` and `snowfield` features: snow within r + 25-40 m, edged with fbm noise and a `frost` meadow transition band (pale grass with white patches). Lower the Rise's snow height with noise (for example snow above 18-22 m, patchy between 10 and 22 m). Keep Capwood's floor and Mittenholt's green as deliberate clearings (a `thaw` exclusion around them), or give them patchy frost too. Mirror …
  - Decision: D12 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G4/`: `pond`, `snowPond`, `phonePond`, `slopeSide`, `ring`, `mitten`
- **G4#2** (polish, spirit · **must**, D12) How white should the Rise be? (decide once)
  - What: Because of 1, Capwood and Mittenholt are also summer-green. That may be wanted, since a toadstool forest glowing in snow is odd. But the lore, the region's name and the "Above the Fells" achievement ("Climb past Frostbite Fells to Snowcap Rise") promise a …
  - Where: Lore `apocrypha/snowcap-rise.md`; region theme `north-highlands` in `regionThemes.json`.
  - Editor's fix: (a) Snow on everything above the band road, with Capwood as a warm "spore-thawed" hollow (lore hook: the rotting woodpile warms the ground). (b) A frost-meadow look: pale, patchy snow, white on the high ground only. (c) Keep it as it is and rewrite the lore. I recommend (a) with Capwood thawed: it gives the forest a reason to exist and keeps the Rise wintry.
  - Decision: D12 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#4** (nit, spirit · **could**, D12) Falling snow never settles and does not change the ground
  - What: Snow weather is particles only. Nothing whitens, even on the Fells' edge or the Rise's meadow (`snowPond`).
  - Where: `weather/`, terrain paint.
  - Editor's fix: A cheap pass: during snow, lerp the meadow and grass terrain colour towards white by intensity in the north band regions (a uniform on the ground material, region-masked). No new geometry. Do it after 1.
  - Decision: D12 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#6** (polish, craft · **should**) The Woolly Sock Lodge sinks into the slope
  - What: The lodge stands on unlevelled ground. The snow surface climbs diagonally across its east wall and buries the north end of the base, porch included (`lodge`, `nightLodge`).
  - Where: `winter/hill.ts` `buildSnowdropSlope` (lodge piece at `LODGE` (-449, -1020)). There is no pad or flat site under it.
  - Editor's fix: Level a pad under the lodge and its porch (as E33's `applyPadRelief` does, or a flat-site marker in `north-highlands.level.json`), with a short snow berm on the uphill side. Or set it on a log plinth with steps on the downhill side.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#7** (polish, craft · **should**) Snowdrop Slope is an empty white plane, and the snow-to-grass edge is ruler-straight
  - What: The slope is 220 x 300 m of untextured white with 11 framing pines, the small gates and a finish banner (`slopeFoot`, `slopeTop`, `tow`). The snowfield is a capsule of radius 108 m, so its sides are dead-straight lines against the meadow (`slopeSide`). No …
  - Where: `winter/hill.ts`; the `snowfield/snowdrop-slope` feature.
  - Editor's fix: Noisy snowfield edge (see 1). Piste poles every 30 m along both runs, a top station hut at the tow top, an orange snow-fence along the Tea-Tray lane, and corduroy groomer stripes as a flat-layer decal on the Wool Run. Add 2-3 ambient skiers or sledders using the slide rider on autopilot (the E12 brief allowed this), Gentian's learners on the nursery strip, and pine clumps instead of single pines.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#8** (polish, spirit · **should**, D26) The Wool Run is about 18 s long; the brief asked for 60-80 s
  - What: The start is at z -1255 and the finish at z -1045 (210 m). `BLACK_DIAMOND_S = 18`. The slope continues to about z -1340 (the 65 m peak) and is not used. The E12 brief asked for "a tall enough gradient for a 60-80 s run".
  - Where: `winter/types.ts` `WOOL_RUN`, `TEA_TRAY_RUN`, `BLACK_DIAMOND_S`.
  - Editor's fix: Start the Wool Run at the summit (raise the tow top or add a second "upper" tow). Give it 10-12 gates with a traverse or chicane across the slope and one jump lip. Retune `BLACK_DIAMOND_S` (about 35-45 s). Keep the short run as "the Nursery" for learners.
  - Decision: D26 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#9** (polish, craft · **should**) No run-out: you finish and slide onto the band road
  - What: After the finish line (z -1045) nothing slows the rider. The north-band road crosses about 40 m further south. In `phoneSki` the skier coasted off the snow to the road edge. Nothing in `winter/runtime.ts finishRun` brakes or stops the rider.
  - Where: `winter/runtime.ts` `finishRun`; the foot of the slope (-400..-300, -1045..-1000).
  - Editor's fix: Add a run-out: a flat snow apron with a curved hay-bale or snow-fence corral before the road, and an auto snowplough (raise friction) for 3 s after the finish. Make sure the foot of the snowfield stops short of the road.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#10** (nit, craft · **could**) The lodge looks like a plain shed, and it is dark at night
  - What: The lodge is a brown box with a blank north gable (`lodgeNorth`). The "giant sock over the door" is barely readable at normal camera distance. At `?time=night` the snow turns blue but the lodge gives no warm light: the windows are flat yellow quads with no …
  - Where: Prefab `woolly-sock-lodge`; `winter/hill.ts`.
  - Editor's fix: Windows on every side, a stone chimney with a smoke puff, and a larger striped sock hung from the ridge so it reads from the slope. At night: emissive windows, one point light on the porch (within the light budget), and a lantern on the tow base.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#12** (polish, craft · **should**) Pail Pond is a vast, empty ice plain, and the pail does not read as a pail
  - What: The ice disc is 124 m across, with three small shanties, Theo and four bears spread over it (`shanty`, `pondMid`). The "galvanized rim" is a dark grey kerb about 0.5 m high (`pond`) and looks like concrete. The handle is not visible from the shore.
  - Where: `winter/pond.ts`; `pond/pail-pond` r 62.
  - Editor's fix: Make the rim a taller, brighter metal band (light zinc with ribbing and a rolled lip, 1.2-1.5 m) and raise the handle arc so it clears the horizon from the road. Cluster the shanties into a small "village" near Theo, with a sled path of footprints between them, a few marker flags, and a gnome or two on stools. Alternatively, shrink the disc to about r 45 and ring it with snowbank (see 1).
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#13** (polish, spirit · **must**, D24) The napping bear lies on its back with its legs out and looks dead
  - What: The `pond-nap` bear (-662, -1078) lies flat with its legs splayed (`pondMid`). From the shore it reads as a carcass on the ice.
  - Where: `critters/snowcap.ts` `addPoseProps` `'nap'` (no props); the critter's nap pose.
  - Editor's fix: Curl the bear on its side or belly with its head on its paws. Add a small "Zzz" puff, a scarf or sunglasses pushed up, and a folded newspaper or towel under it, so it reads as napping.
  - Decision: D24 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#14** (polish, craft · **should**) The Bear Deck has no deck, and its sign hides the middle bear
  - What: The five bears sit in deck chairs on bare snow. No planking, rail or parasols. The new BEAR DECK sign stands right in front of the centre bear and hides it from the approach (`deckClose`).
  - Where: `critters/fells.ts` deck; `critters/snowcap.ts addBearDeck` (sign at `BEAR_DECK.z + 9`).
  - Editor's fix: Lay a timber deck (flat layer plus a low rail) under the chairs, with two parasols and a cool box of sardines. Move the sign 6-8 m to the side of the approach path, angled towards it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#15** (nit, craft · **could**) The mug bear's cocoa mug is too small to see
  - What: This was noted by E12 itself. The mug is a scaled prefab (0.3) and invisible at 960x600 and on a phone.
  - Where: `critters/snowcap.ts` `'mug'` pose.
  - Editor's fix: Scale the mug to bear scale (about 0.6) and put it in the paw. Add a steam puff.
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#32** (nit, craft · **could**) Lore: "no shops on the Rise", but the Top Hat café sells tea and buns
  - What: `apocrypha/snowcap-rise.md` Everyday: "Shops. None on the Rise itself: the Lodge ... sells the cocoa, Mittenholt sells nothing". The Top Hat on Brim Gap (R-230s) serves Gap Tea and Hairpin Buns.
  - Where: `docs/lore/entries/apocrypha/snowcap-rise.md`.
  - Editor's fix: Add "and Velma Crown's Top Hat at Brim Gap, which sells tea, buns and the view" to the Everyday line. Also refresh the "In the games" region bounds (z to -1800 since the second expansion).
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#22** (polish, spirit · **should**, D26) Ski and sled runs are 15-20 seconds
  - What: the Wool Run and the Tea-Tray Run are about 280 m of slope (E12 note). With a rope tow back up, the ride is shorter than the walk to it.
  - Where: `winter/course.ts`, `winter/hill.ts`.
  - Editor's fix: a third, longer run from the Snowcap Rise side (E33's routes reach it) of 45-60 s with a mid-run shortcut, or chain the two runs into one "Top to Cocoa" run with a split time.
  - Decision: D26 (quoted in full under "Decisions this epic applies").
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

#### D12. How white is Snowcap Rise — G4#1, #2, #4, #5 · **must** (settling snow #4: **could**)
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

#### D24. The napping polar bear looks dead — G4#13 · **must**
- **Decision:** curl the bear on its side or belly with its head on its paws. Add a "Zzz" puff and a towel or a folded
  newspaper.
- **Reason:** "nothing dies" (R-021, R-049) and L38's "really chill" bears. This is the one image the place must never
  give.

#### D26. Ski and sled runs are 15–20 s — G4#8, G8#22 (two editors, two fixes) · **should**
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


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- The snow paint rule and the Capwood thaw (FX13 adds Capwood's floor decals on top).

## Contracts this epic consumes from earlier epics

- FX03 activity mode for sleds and skis (do not re-add buttons). FX06 paint rules.

## Online / mobile / achievements / prefabs / lore notes

- D26: the old course becomes "the Nursery" with its bests on a separate key; the Tea-Tray Run stays short.
- D12: G4#4 settling snow is a could, only after the paint lands. Lore ruling: "Capwood's rotting woodpile warms the hollow".
- G4#5 (minimap follows the paint) is FX19's: it samples painted kinds generically.

## Risks and open questions (with the decision taken)

- The Wasm mirror must match the JS paint (parity test).
- Retuning `BLACK_DIAMOND_S` and the tow changes winter tests and best-time saves: migrate, do not wipe.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX12/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- A Wool Run from the new tow top takes 35-45 s in a scripted run (test).
- Pail Pond from the band road reads as ice in snow; the napping bear reads as asleep at 390x844.
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
