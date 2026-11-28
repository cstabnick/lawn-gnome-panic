# FX19 HUD, map and phone layout
Wave: 7 · Depends on: FX03, FX12, FX11 · Kind: Fix (UI)
Findings: 20 (G3#25, G4#5, G4#33, G6#30, G7#22, G7#23, G7#25, G9#1, G9#2, G9#3, G9#11, G9#12, G9#13, G9#14, G9#15, G9#16, G9#17, G9#18, G9#19, G9#31) · Decisions: D12, D14, D38, D39, D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The HUD gets out of the way on every screen: nothing overlaps on a landscape or portrait phone, the map labels lay out, the minimap and the stats card show only what matters now (D38, D39), and every layer has a place on one z-order scale.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- hud.ts (stats card, meters, minimap, big map, legend, labels, vehicle pill, near-miss banner, region card)
- a new ui/layers.ts (z-order scale) migrated in hud.ts, briefing/briefing.ts (CSS only), birding/* pill
- ui/dock.ts
- mapIcons.ts, bigMapView.ts, mapPois.ts (label case only)
- loading/loader.ts (`hideLoading` hand-off only)
- stunts.ts near-miss banner position (if not in hud.ts)

### Findings (20)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G3#25** (nit, craft · **must**, D14) The minimap paints the south band as sand, but the ground is lawn
  - What: At the boardwalk entrance and in Dunelow the minimap is beige sand while the 3D ground is bright green lawn.
  - Where: minimap theme for `south-shore`; shots `a01-entr`, `a13-dunelow`.
  - Editor's fix: Fixed for free by #5 (sand and dunes). Otherwise, make the map lawn-coloured north of the beach.
  - Decision: D14 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G3/`: `a01-entr`, `a13-dunelow`
- **G4#5** (nit, craft · **must**, D12) The minimap shows the snowfield and Pail Pond as green
  - What: The minimap is white on the Fells but green over Snowdrop Slope and Pail Pond (`slopeFoot`, `pond`).
  - Where: Minimap ground colour source (biome ground, not the painted surface).
  - Editor's fix: Sample painted surface kinds (`snow`, `ice`) into the minimap ground tile for the north band.
  - Decision: D12 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#33** (nit, craft · **could**) Map blip labels mix "the" and "The"
  - What: The blips are labelled 'the Capwood Run' (`capwood/run.ts:137`), 'the High Tarn' (`living/config.ts`), but 'The Top Hat', 'The Bobble', 'The Keyhole' (`mountainRoutes/*.ts`).
  - Where: As listed.
  - Editor's fix: Pick one style for map labels (sentence-start capital "The ..."). If the decider prefers it, a tiny `labelCase()` helper in the map layer can apply it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G6#30** (nit, craft · **must**, D58) The interior minimap still shows the surface.
  - What: Inside Loamdeep, the burrow, the tent and the halls, the minimap shows the lawn outside (`shots/G6/int-loamdeep`).
  - Where: shared HUD (G9).
  - Editor's fix: Hide the minimap, or show a simple room plan, while inside an interior.
  - Decision: D58 row "The minimap inside interiors" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `int-loamdeep`
- **G7#22** (nit, craft · **could**) The vehicle name pill sits on top of small vehicles
  - What: the bottom-centre name + health pill ("Wespa", "Petit Pois") overlaps the vehicle itself on screen for every small vehicle at the default drive distance, desktop and phone.
  - Where: `hud.ts` vehicle name/health pill. Shots: `euro-hatch-960-rest.png`, `euro-hatch-390-drive.png`.
  - Editor's fix: move it below the vehicle (lower third), or fade it after 3 s of driving. Pairs with #2.
  - Re-check: `review/shots/G7/`: `euro-hatch-960-rest.png`, `euro-hatch-390-drive.png`
- **G7#23** (nit, craft · **could**) "NEAR MISS!" collides with the top button row on a phone
  - What: at 390x844 the near-miss banner and its "+15 Acorns" draw over the Gnomlet/taxi/quest buttons.
  - Where: stunt/near-miss banner in `hud.ts` / `stunts.ts`. Shot: `euro-hatch-390-drive.png`. (Hand to G9 if they own the HUD layout.)
  - Re-check: `review/shots/G7/`: `euro-hatch-390-drive.png`
- **G7#25** (nit, craft · **could**) Lock-Up map label is the odd one out
  - What: map legend: "Hangar Two (your aircraft)", "Mossbank Boathouse (your boats)", but "Side-Valve Lock-Up" (no "(your vehicles)"); L25 asked for the storage spot to be marked clearly.
  - Where: `mapIcons.ts` `lockup` name.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#1** (blocker, craft · **must**) Landscape phone: the 🔭 binoculars button covers the Drive / Steal button
  - What: at 844x390 on foot, the dock button `.gta-dock-btn` (🔭, x 324..368, y 318..362) is drawn on top of the context button that appears left of Jump when you are near a vehicle ("Drive" / "Steal"). The word "Drive" shows through under the binoculars icon. In …
  - Where: `land-41-heat.png` (Drive under 🔭), `land-rects.json`; the dock layout is in `ui/dock.ts`, and the touch cluster is in the HUD bottom row.
  - Editor's fix: in landscape, put dock buttons into the cluster's flow (one row left of the context button), or move the dock column above the cluster's top-left corner. Add a rect-overlap assertion for the 844x390 cluster to the smoke run.
  - Re-check: `review/shots/G9/`: `land-41-heat.png`
- **G9#2** (blocker, craft · **must**) Big map: landmark names skip the label layout and print on top of each other
  - What: `drawBig` sends PlaceKind blips and quest blips through `layoutMapLabels`, which skips colliding names. Any other blip with a `label` falls into the "another player's name" branch (`hud.ts` ~1546-1560). That branch draws its text with no collision check. …
  - Where: `desk-17-app-map.png`, `port-17-app-map.png`, `land-17-app-map.png`.
  - Editor's fix: keep the player-name branch for `b.player` only. Every other labelled blip becomes a wish (give the coast and mountain places a PlaceKind, e.g. `landmark` / `ride`). At the fitted zoom, show only quest names, region names and service names. Show the others from about 1.6x zoom (wish `minZoom`).
  - Re-check: `review/shots/G9/`: `desk-17-app-map.png`, `port-17-app-map.png`, `land-17-app-map.png`
- **G9#3** (blocker, craft · **must**) Portrait phone: the objective text runs under the pinned shortcut buttons
  - What: at 390x844 the top-left card grows with the active objective ("Follow Pip Potsworth past The Gnomecino to Side-Valve Salvage"). It reaches x ~200. The pins row (`#gta-more-pins`, 📜 🚕 at x 136..232, y 122..166) is drawn over that text.
  - Where: `port-50-comms-0.png`, `port-53-map-zoom.png` (background), `gnomlet.ts` `#gta-more-pins` CSS, and the `.gta-tl` card in `hud.ts`.
  - Editor's fix: in portrait, either cap `.gta-tl` at `max-width: calc(100vw - 190px)` so it wraps, or move the pins into the right-hand column under ☰ (it has room above the gun block). Hiding pins while an objective shows is the cheaper option.
  - Re-check: `review/shots/G9/`: `port-50-comms-0.png`, `port-53-map-zoom.png`
- **G9#11** (polish, craft · **should**, D39) The birding pill ("0/36 · Blustery") draws over the big map and over every panel
  - What: the life-list and wind pill in `birding/scopeUi.ts:116-130` is `position:fixed; z-index:40`. The big map overlay is z 30, and the Jobs drawer and journals sit at similar levels. The pill appears on top of the map (`port-17`, `port-54`) and the Jobs drawer …
  - Editor's fix: hide the pill and the call arrow while `body[data-more="open"]`, the big map or any panel is open (or drop both below the panel layer; see finding 12). Spirit side, for the decider: the pill is always on screen for a side hobby. Show it only with the binoculars up or within ~60 m of a hide or birding spot.
  - Decision: D39 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `port-19-app-jobs.png`, `land-54-map-legend.png`, `land-50-comms-1.png`
- **G9#12** (polish, craft · **should**) There is no z-order scale, so layers fight
  - What: z-index values across `src/` run from 6 to 70 with no shared table (10 modules at 60, 9 at 40, 8 at 30). The results include: the comms card (45) on top of the open big map (30) (`desk-53-map-zoom.png`), the achievement toast over the minimap and pins …
  - Where: `grep -o "z-index:[0-9]*" src` across `hud.ts`, `briefing/briefing.ts`, `gnomlet/gnomlet.ts`, `birding/*`, `city/exchangeApp.ts`, `ledger.ts` and the others.
  - Editor's fix: one `ui/layers.ts` with named layers: world-HUD 10, prompts 20, HUD-chrome 30, toasts 35, big-map 40, panels/tablet 50, comms 55, cutscene 60, modal-confirm 70. Each module imports its layer. While the map or tablet is open, the comms card collapses to a one-line strip at the top ("📞 Pip Potsworth · tap to read").
  - Re-check: `review/shots/G9/`: `desk-53-map-zoom.png`, `desk-22-app-birdJournal.png`
- **G9#13** (polish, craft · **should**) On phones the big map uses a third of the screen
  - What: the map is a square `px = min(innerWidth-24, innerHeight-120)`. In portrait that is about 370x370 with the lower half of the screen empty (`port-17`). In landscape it is about 300x300 in the middle of an 844 px wide screen (`land-17`). Labels, controls and …
  - Editor's fix: on coarse pointers, make the map viewport the full safe area (a rectangle, not a square; `bigMapView.ts` already handles pan and zoom). Float the ✕, +/− and 3D controls in the corners, and make the legend a bottom sheet over it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#14** (polish, craft · **should**) Desktop legend: one long column that clips and runs off the screen
  - What: at 1280x800 the legend is a single column of about 20 chips from y 45 to the bottom edge. "Mossbank Boathouse (your boat" is cut at the right, and the column overlaps the minimap's x range.
  - Where: `desk-17-app-map.png`, `desk-53-map-zoom.png`; `hud.ts` `drawLegend` / `paintLegend`.
  - Editor's fix: group the chips (Services, Shops, Sport, Your things, Story), use two columns when the height runs out, set `max-height` with scroll, and list only the kinds in view. Never let a chip run past the viewport.
  - Re-check: `review/shots/G9/`: `desk-17-app-map.png`, `desk-53-map-zoom.png`
- **G9#15** (polish, craft · **should**) The minimap is a wall of icons downtown
  - What: `drawMap` draws every PlaceKind blip in range as a 6-7 px badge, with no cap and no priority. In downtown Turfton the 128 px minimap holds about 25 badges (towers, shops, services), with the player arrow and objective lost among them.
  - Where: `desk-01-hud.png`, `port-01-hud.png` (the 96 px phone minimap is worse); `hud.ts` ~1140-1152.
  - Editor's fix: on the minimap, draw quest and objective pins, services (`RIM_PLACES`), and at most the six nearest other places. Never draw `tower` landmarks. Fade badges toward the edge.
  - Re-check: `review/shots/G9/`: `desk-01-hud.png`, `port-01-hud.png`
- **G9#16** (polish, craft · **should**) Heat and health meters look like buttons, and the heat level is unreadable
  - What: the wanted meter (a cop face in a ring) and the life meter (your gnome in a ring) sit in the same row and the same round chrome as the tappable pins (📜 🚕) and ☰. Heat shows only as a blue arc around the cop. There are no pips and no number. The evade state is …
  - Where: `desk-41-heat.png`, `port-41-heat.png`, `land-41-heat.png`; `hud.ts` `.gta-meters`, `.gta-evade`.
  - Editor's fix: give the meters a distinct, borderless shape, put heat on its own line as 1-5 hat pips (GTA stars, gnome style), and put the evade label and bar right under the pips at readable size (13 px, bar 96 px). Keep the pins as the only round buttons.
  - Re-check: `review/shots/G9/`: `desk-41-heat.png`, `port-41-heat.png`, `land-41-heat.png`
- **G9#17** (polish, spirit · **should**, D38) The top-left stats card is always on and growing
  - What: "🌰 50 / Kiln-Debt: 5,000 / Cracked: 0 / Noon Stunts: 0/13" is always shown, with the objective block under it. "Noon" (the time) and "Stunts: 0/13" share a line and read as "Noon Stunts". "Cracked: 0" is on screen from minute one.
  - Where: `desk-01-hud.png`, `port-01-hud.png`; `hud.ts` ~940-960, 1797-1810.
  - Editor's fix: keep acorns always. Show debt only in the Ledger and for 4 s after a payment. Show "Cracked" only while heat > 0. Show stunts only for 5 s after one lands or in a stunt area. Put the time on its own line (or in the Gnomlet bar; see 27).
  - Decision: D38 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-01-hud.png`, `port-01-hud.png`
- **G9#18** (polish, craft · **should**) Phone HUD overlaps around the gun block
  - What: in landscape the gun block (x 718..810, y 222..303) overlaps the Fire button (x 684..768, y 290..374) by 13 px, and "Pistol" sits right on Fire's rim. In portrait the toast line (x 55..336, y 210..240) runs across the gun block (x 280..372, y 174..255), so "A …
  - Where: `land-rects.json`, `port-rects.json`; `land-01-hud.png`, `port-01-hud.png`.
  - Editor's fix: in landscape, lift `.gta-gunblock` so its bottom clears the cluster top (`bottom: cluster + 8px`). In portrait, cap `.gta-toasts` at `right: 100px`, or move toasts to y ≥ 270.
  - Re-check: `review/shots/G9/`: `land-01-hud.png`, `port-01-hud.png`
- **G9#19** (polish, craft · **should**) The portrait comms card covers the ammo and the objective
  - What: in portrait the comms card starts at `map + 60px` (about y 178) and spans the full width, up to 28vh (to about y 414). It covers the gun block and the lower part of the objective block, which is exactly when the objective is being explained.
  - Where: `briefing/briefing.ts` CSS (`@media (max-width:700px) and (orientation:portrait)`); compare `port-50-comms-*`.
  - Editor's fix: anchor it under the gun block (`top: map + 140px`), or at the bottom just above the touch cluster (the thumbs are already there to tap Next). Keep the 44 px icon buttons.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#31** (nit, craft · **could**) The arrival title card is spent behind the loading fade
  - What: the region card "Turfton · Downtown Turfton", the welcome line and the first toast all start while the loading screen is still fading out, so the texts stack (`port-00-loading.png`). The label also repeats the town name.
  - Where: `hud.ts` `showBiome`, `loading/loader.ts` `hideLoading`.
  - Editor's fix: start the HUD's first region card after the fade ends. Drop the biome when the district name already contains it ("Downtown Turfton").
  - Re-check: `review/shots/G9/`: `port-00-loading.png`

### Decisions this epic applies (quoted from decisions.md)

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

#### D38. The top-left stats card — G9#17 · **should**
- **Decision:**
  - Acorns are always shown.
  - Kiln-Debt shows in the Ledger, for 4 s after any change, and while a debt-related row is active.
  - "Cracked" shows only while heat > 0.
  - Stunts show for 5 s after a landing, or inside a stunt area.
  - The time gets its own line, or moves to the Gnomlet bar.
- **Reason:** the world is the charm. The debt motif is kept, but it shows when it matters.

#### D39. The birding pill is always on screen — G9#11 (spirit side) · **should**
- **Decision:** show the pill only with the binoculars up, or within about 60 m of a hide or birding spot. Never above
  the map or open panels (that part is craft).

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| The minimap inside interiors | G6#30 | Hide the minimap, or show a room plan, while `currentInterior()` is set. |


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `ui/layers.ts` named layers (world-HUD 10, prompts 20, HUD chrome 30, toasts 35, big map 40, panels/tablet 50, comms 55, cutscene 60, modal 70). FX20 moves the Gnomlet and its panels onto it.
- The minimap background samples painted surface kinds (snow, ice, sand) generically (G4#5, G3#25).

## Contracts this epic consumes from earlier epics

- FX03 activity HUD slot and toast stack. FX11/FX12 paint (map follows it).

## Online / mobile / achievements / prefabs / lore notes

- D38: the time gets its own line or moves to the Gnomlet bar (FX20 shows game time on the Gnomlet clock).
- Mobile is the point: 390x844, 844x390 and desktop for every change. Add rect-overlap assertions for the 844x390 cluster to the smoke run.

## Risks and open questions (with the decision taken)

- hud.ts is the largest hot file: one owner in this wave; keep the edits sectioned.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX19/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Rect-overlap checks at 390x844 and 844x390 pass for the HUD, the dock and the comms card.
- All 6 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX03 (orchestrator)

- From FX03: a global toast queue (toasts stack and collide; G9), the duplicate vehicle-name toast and the 'Entering Mossy Wood' district toast in `hud.ts`. Use `node tools/gta-touch-check.mjs` for overlap checks.
