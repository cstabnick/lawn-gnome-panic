# FX06 Ground paint, route clearance, residents on decks and speech bubbles
Wave: 2 · Depends on: FX01 · Kind: Fix (shared, GR8)
Findings: 10 (G2#20, G3#1, G3#2, G3#3, G4#16, G5#1, G5#2, G5#3, G6#3, G6#11) · Decisions: D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The ground under the world reads right: earth and grass where the lore has no rock, soft paint edges, no trees or boulders on a road, residents standing on the decks they belong to, bubbles that stay on screen, and one look per character.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- terrainPaint.ts (the rock rule, site exemptions, feathered paint edges) and its Wasm mirror in assembly/kernel.ts if the rule is mirrored there (keep parity)
- scenery.ts (`placeSolid` and route clearance), scenery.test.ts
- campus/types.ts `OBSERVATORY` flatten blend (G5#1), raceTrack/defs/rutbottom.ts and the trackMesh batter (G5#2)
- unmown/trails.ts paint mask (G6#11)
- ambientGnomes.ts (`y` / `surface`, bubble clamp)
- coast/boardwalk.ts deck height and coast/config.ts `deckLift` (G3#1 only), coast/life.ts resident positions (G3#2 only)
- cutscene/cast.ts presets as the one source of character looks, quests/coastQuests.ts `*_LOOK`, coast/pirateShip.ts NPC look (G3#3)

### Findings (10)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G2#20** (polish, craft · **must**, D58) Speech bubbles run off screen and swamp the phone view
  - What: Resident speech bubbles grow as the player gets close. They are not clamped to the viewport, so they are cut off at the screen edge (`terrace`, `marrow`: "Wilhelmina Mar...") and cover the minimap and HUD. At 390x844 the Sips' bubble covers about half the …
  - Where: the ambient-gnome bubble (`ambientGnomes.ts`). It shows up most in Pardonlin because the residents talk most there.
  - Editor's fix: Clamp bubbles inside the safe area, cap their scale and font size (smaller on phone), and keep them clear of the HUD corners. Flag this to G9 (UI).
  - Decision: D58 row "Speech bubbles off screen or covering the screen" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#1** (blocker, craft · **must**, D58) Everyone on the boardwalk walks 22 cm inside the planks
  - What: The deck top is `heightAt + deckLift (0.22)`. Nothing raises the walking height, so the player, ambient gnomes (Spun Sugar Sal) and vehicles all stand at `heightAt`. On every boardwalk shot the gnome's boots are cut off by the planks.
  - Where: `src/coast/boardwalk.ts` (`deckTop = y0 + bw.deckLift`), `src/coast/config.ts` `boardwalk.deckLift`, `src/ambientGnomes.ts` (poses at `heightAt`). Shots `a02-bwmid`, `a03-bweast`, `b02`–`b04`, `b09-sal` (Sal's hem gone), `p01-phone-bw`.
  - Editor's fix: Make the deck the ground. Either register the promenade as a walkable rooftop at `deckTop` (as the pier is; stairs and ends need a lip players can step up), or flatten the terrain under the rect to `deckTop - 0.3` and set `deckLift` to about 0. Check Sal, the vignettes and parked cars afterwards.
  - Decision: D58 row "Ambient gnomes can't stand on decks" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G3/`: `a02-bwmid`, `a03-bweast`, `b02`, `b04`, `b09-sal`
- **G3#2** (blocker, craft · **must**, D58) Reel Ruth is buried under the pier spur; deck residents cannot stand on decks
  - What: The angler stands at (232, 1125), inside the spur rect (x 210–304, z 1120–1130), where the deck is at y −3.0. Ambient gnomes are posed on the terrain (about y −4.2), so she is under the planks and only her speech bubble comes up through the deck. The same …
  - Where: `src/coast/life.ts` `COAST_RESIDENTS` (`coast-angler-spur`), `src/ambientGnomes.ts` (`heightAt` only). Shot `a06-spur` (bubble, no gnome).
  - Editor's fix: Give `AmbientGnomeDef` an optional `y` (or `surface: 'rooftop'` that reads `rooftopAt`). Then put Ruth on the handle rail with her rod over the side, put one or two crew on the Queen's deck (a mop, a lookout), and put Marram at her hut door at dusk.
  - Decision: D58 row "Ambient gnomes can't stand on decks" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G3/`: `a06-spur`
- **G3#3** (polish, craft · **must**, D58) Driftwood, Marram and Bilge each wear 2–3 different outfits; the angler wears Driftwood's
  - What: - Driftwood: cutscene cast `driftwood` is teal hat and sand shirt. Quest dialogue `DRIFTWOOD_LOOK` is khaki 0x8a7a55 and 0xb0a07a. The beach resident is a sand hat and a green shirt. **Reel Ruth** wears exactly Driftwood's cast colours (0x4f9d92 / 0xd9c79e). …
  - Where: `src/cutscene/cast.ts` (presets `driftwood`, `marram`, `samphire`), `src/quests/coastQuests.ts` (`*_LOOK`), `src/coast/life.ts` `COAST_RESIDENTS`, `src/coast/pirateShip.ts` (`kit.npc` look).
  - Editor's fix: One source of truth: import the cast presets wherever these three appear. Recolour Ruth (and check her against the cast list).
  - Decision: D58 row "The same character, many outfits" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#16** (blocker, craft · **must**) Pines and boulders stand on the Capwood Run's road (including the summit)
  - What: The landscape belts in `scenery.ts planScenery` (step 3) never check `nearTrack`. My probe found 9 solid placements on the Capwood Run's road surface: snow pines (with trunk colliders) at (180, -843), (179, -838), (180, -830), (180, -812), (232, -875), (250 …
  - Where: `scenery.ts` `placeSolid` (it checks `highwayGap` but not `nearTrack`); compare `biomes.ts:241`, which does.
  - Editor's fix: In `placeSolid`, `if (nearTrack(x, z, ROAD_CLEAR)) return;` (GROUND_TRACKS covers all routes). Add a test: no `planScenery` placement is `onRoad` (or within `barrierOffset`) for any `GROUND_TRACKS` entry. Regenerate `layout.golden.json` if it changes.
  - Re-check: `review/shots/G4/`: `summit`, `summitSign`
- **G5#1** (blocker, craft · **must**, D58) The Anthill wears a grey rock cliff crown.
  - What: the summit flatten blends from 47 m to 35 m within about 4 m (probe: S r36 = 46.7, r40 = 34.9; E r32 = 46.6, r40 = 35.8). The rock-slope paint turns that ring into a sheer grey cliff. From afar the mound reads as a mesa with a stone cap, not an ant mound. Up …
  - Where: `OBSERVATORY.flatR` 30 with a blend of flatR+12 (campus/types.ts, the flatten stamp); `terrainPaint.ts` rock rule. Shots `a-road.png`, `x-mound-n.png`, `c-quads.png`, `n-obs.png`.
  - Editor's fix: widen the blend so the summit eases into the flank (blend 25-30 m; the grade stays under the road's 20%). Also, or instead, exempt the `observatory-mound` site from the rock paint and paint the shoulder dirt with small crumbly ledges (a few `garden-rock` and dirt-clod props). Re-check that the run-up and the road end still reach the summit.
  - Decision: D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G5/`: `a-road.png`, `x-mound-n.png`, `c-quads.png`, `n-obs.png`, `a-summit.png`
- **G5#2** (polish, craft · **must**, D58) Rutbottom's raised corners stand on grey rock walls with sawtooth edges.
  - What: the 'raise' relief makes 4-5 m embankments with steep faces. They are painted rock and their top edges step in a sawtooth. Hay bales line the lip like battlements.
  - Where: north side of the start straight and the east loop: `b-stands.png` (1215,-560 facing N), `b-start.png`, `bike-1`; `raceTrack/defs/rutbottom.ts` lifts 1-3.5 m and `trackMesh` batters.
  - Editor's fix: give raised sections a wider batter (1:2 or gentler) painted dirt or grass, not rock. Exempt the `dirt-track` site from rock paint. Smooth the lip so it stops stair-stepping.
  - Decision: D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G5/`: `b-stands.png`, `b-start.png`
- **G5#3** (polish, craft · **should**) Dirt and gravel patches have blocky stair-step edges.
  - What: painted dirt and gravel areas end in square, pixel-stepped edges on the grass: the Rutbottom gate lane, the Pinwheel service track start, the gravel pads round the masts and the hut, the Anthill road's verge.
  - Where: `b-gate.png`, `r-track.png`, `r-hut.png`, `x-pin2` (mast 4 pad), `x-mound-n.png`.
  - Editor's fix: feather terrain-paint borders (dither or a blend band), or round the stamp shapes. At minimum, give lanes and pads soft or irregular outlines.
  - Re-check: `review/shots/G5/`: `b-gate.png`, `r-track.png`, `r-hut.png`, `x-mound-n.png`
- **G6#3** (blocker, craft · **must**, D58) Speech bubbles fill the whole screen when the camera is inside the Flock's ring.
  - What: Ambient bubbles are world sprites at a fixed 3.4 x 1.18 m, drawn with `depthTest: false` and render order 20. At Wader's Rest, the five ring members stand 6 m round the circle centre. Stand in the circle (which is exactly what the sermon hold and m25/m51 ask …
  - Where: `ambientGnomes.ts:382` (`makeBubbleSprite`, used by every ambient gnome), `societies/flock/life.ts` RING_FIVE (Sister Spoonbill at angle 0 sits on the south approach).
  - Editor's fix: - Fade and hide a bubble when the camera is within about 3 m of it, or clamp its screen size: scale by camera distance with a maximum. - Show at most one or two bubbles at a time in a crowd (the nearest one the player faces). - Move Spoonbill off the south entry line.
  - Decision: D58 row "Speech bubbles off screen or covering the screen" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `waders-circle`
- **G6#11** (polish, craft · **must**, D58) The Unmown's trails have stair-stepped edges.
  - What: The trail dirt is painted on the terrain grid, so every diagonal trail shows square 90° steps several metres across (`shots/G6/reedmere-hide`).
  - Where: The Unmown loop and the Reedmere trail (`unmown/trails.ts` lines painted into the surface map).
  - Editor's fix: - Draw trails as a soft-edged ribbon decal along the polyline (like the roads) in `LAYER.road`, or smooth the paint mask. - Add worn grass edges.
  - Decision: D58 row "Grey stair-stepped rock on cuts" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `reedmere-hide`

### Decisions this epic applies (quoted from decisions.md)

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Speech bubbles off screen or covering the screen | G2#20, G6#3 | Clamp bubbles to the safe area, cap their scale (smaller on phones), keep them clear of the HUD corners, and hide them when the camera is inside the speaker's ring. |
| Ambient gnomes can't stand on decks | G3#1, G3#2 | Boardwalk deck height fixed. `AmbientGnomeDef.y` / `surface: 'rooftop'`. |
| The same character, many outfits | G3#3 | One source of truth: the cutscene cast presets imported everywhere the character appears. |
| Grey stair-stepped rock on cuts | G4#27, G4#28, G5#1, G5#2, G6#11, G4#17 | Rock paint only where the lore says rock (the Hatbrim, the Spine Cut, the Keyhole). Every other cut or fill is painted dirt or grass, with a wider batter. Site exemptions: `observatory-mound`, `dirt-track`, the Unmown trails. Smooth the stepped lips. |


### Also does (a part of a finding owned by another epic)

- **G4#27** (owned by FX13): D58: the rock-paint rule (rock only where the lore says rock: the Hatbrim is one). FX13 does the Brim Gap scree, walls and batters.
- **G4#28** (owned by FX13): D58: rock rule and smoothed lips. FX13 does the Brim Walk ribbon and the summit pads.
- **G4#17** (owned by FX13): D58: rock rule for cut faces. FX13 re-lays the climb (D13).

### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `AmbientGnomeDef.y?: number` and `surface?: 'rooftop'` (reads `rooftopAt`): FX10, FX11, FX14 use it.
- Bubble rules: clamp to the safe area, cap screen size (smaller on phones), clear of the HUD corners, hide within ~3 m of the camera or when the camera is inside the speaker ring, at most two bubbles at once.
- Rock paint only in rock sites (the Hatbrim, the Spine Cut, the Keyhole); everything else dirt or grass with a wider batter; exemptions `observatory-mound`, `dirt-track`, the Unmown trails. FX13 applies it to the north routes.
- A scenery test: no `planScenery` solid within `ROAD_CLEAR` of any ground track or road (G4#16).
- Cast presets exported for import wherever a story character appears.

## Contracts this epic consumes from earlier epics

- FX01 is not required but merge after it (both touch plates near the boardwalk).

## Online / mobile / achievements / prefabs / lore notes

- Mobile: bubbles at 390x844 in Pardonlin (Platz) and in the Flock ring. Online: none.

## Risks and open questions (with the decision taken)

- Terrain paint has a JS and a Wasm path: a parity test must stay green.
- Moving the boardwalk deck: re-check Sal, the vignettes and parked cars; E11 tests.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX06/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Tests: route clearance, bubble clamp (pure function), cast single source (the three coast characters resolve to the cast preset in all four places).
- All 9 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
