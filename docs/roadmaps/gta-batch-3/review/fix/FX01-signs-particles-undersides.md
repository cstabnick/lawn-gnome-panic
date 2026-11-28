# FX01 Signs, plates, particles, water and undersides (shared render)
Wave: 1 · Depends on: none · Kind: Fix (shared, GR8)
Findings: 14 (G1#5, G1#17, G2#11, G2#12, G2#30, G3#10, G3#11, G3#28, G4#3, G6#2, G6#13, G6#26, G6#29, G9#26) · Decisions: D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Make every sign in the game readable and every particle, underside and shoreline look finished, once, in shared code, so the region epics only place content. This is GR8: no region builds its own workaround.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- homes/pieces.ts (`textPlate`, plate helpers) and a new `signBoard()` helper next to it
- pardonlin/town.ts `plate()` / `paint()` (cell size only), the plate call sites named in the findings (societies/underspan/build.ts posters, homes/saucerCourt.ts, homes/townHomes.ts plates, country/trellisLife.ts SIGNS and PLATE_OFF, golf/bottomGarden.ts `sign()`, living/hamletEspalier.ts board, living/hamletDunelow.ts)
- weather/render.ts, weather/config.ts, atmosphere.ts (`applyWeatherLook`, far fog)
- waterMesh.ts, waves.ts, the `WATER` block in config.ts (per-body colour, crest colour, foam)
- city/megaBlock.ts slab material and tunnel lamps, highways/ deck material, the sky firefly emitter

### Findings (14)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#5** (polish, craft · **must**, D58) Elevated undersides render as a flat black-green ceiling
  - What: downward faces take the hemisphere light's ground colour and no direct light. The Double Pot tunnel slab (grey `0x8d8f93`) reads as a near-black green lid. The downtown skyway does the same: it crosses the z = -50 corridor, so City Hall, the Mulch Club and …
  - Where: `city/megaBlock.ts buildMegaBlock` (slab material), `highways/` deck mesh, the Span over `societies/underspan`. Shots `dpot-tunnel.png`, `dpot-far.png`, `underspan-road.png`, `n-tunnel.png`.
  - Editor's fix: give underside materials a small emissive floor (or a lighter base colour with `side` faces split off), and add tunnel dressing: a strip of warm tunnel lamps every 6 m on the slab underside (emissive, on a draw layer), "DOUBLE POT TUNNEL / HEADROOM 8 M" portal plates at both mouths, a THORNE logo, and a "SALES FLOOR →" sign by the door at (112.4, -84). Under the skyway, add column bents with posters. Under the Span …
  - Decision: D58 row "Elevated undersides as black voids" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `dpot-tunnel.png`, `dpot-far.png`, `underspan-road.png`, `n-tunnel.png`
- **G1#17** (polish, craft · **must**, D58) The Underspan's manifesto jokes cannot be read
  - What: the two manifesto boards carry 3-4 A4-sized posters each ("THE GROUND IS ALREADY OBSOLETE", "FORM 7 IS A SUGGESTION"). From the follow camera they are white specks. The same goes for Saucer Court's 0.6–0.95 m plates ("STAIRWELL RULES", "SAUCER COURT residents …
  - Where: `societies/underspan/build.ts:212-221`, `homes/saucerCourt.ts:75-81`, `homes/townHomes.ts` plates. Shots `underspan-road.png`, `saucer-stair.png`.
  - Editor's fix: double poster and plate sizes (one joke per board-half, 1.2 x 0.8 m, bigger type). For dense notice boards, add an `addInteractSpot` "Read the notices" that toasts the lines in turn (as Hyssop's wall does). Rule of thumb: legible at 6 m on a 390-px-wide screen.
  - Decision: D58 row "Long signs unreadable" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `underspan-road.png`, `saucer-stair.png`
- **G2#11** (polish, craft · **must**, D58) Poster boards are blank from behind
  - What: Free-standing `euro-poster-board`s have text on one face only. From the other side they are a blank grey panel. In open squares, half the approaches see a blank board.
  - Where: `gd1` (Jardin), `boules` (Platz), `marketin` (the chalkboards at the market).
  - Editor's fix: Print double-sided signs for free-standing boards (a second text plane at yaw+π, which can carry a second joke). Or stand them against walls, facing the approach.
  - Decision: D58 row "Free-standing signs blank from behind" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#12** (polish, craft · **must**, D58) Long sign texts are unreadable; Radio Adagio's own banner can't be read
  - What: Each sign gets a 256 px atlas cell (`town.ts CELL = 256`), so long jokes on banners and plaques shrink to a blur. The Opera Hall's roof banner ("RADIO ADAGIO 96.1 — Now broadcasting: silence (scheduled)") and the door plaque are unreadable from the forecourt.
  - Where: `operabanner`, `adagiofront` (-1700,-100). `town.ts plate()/paint()`.
  - Editor's fix: Use 512 px cells (or a cell size scaled to the plate's width) for banners and plaques. Make the Opera banner larger and lower, over the door, with the long joke on a separate poster at eye level. Cap the length of text that goes on high banners.
  - Decision: D58 row "Long signs unreadable" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#30** (nit, craft · **must**, D58) Untextured white squares drift across the sky in "Blustery" weather
  - What: Small flat white quads float about the sky in many shots (`adagiofront`, `gd1`, `operabanner`). They look like weather debris without a texture.
  - Where: weather particles (E06). Flag this to G9.
  - Editor's fix: Give the debris a leaf or petal sprite, or tint it, or hide the particles above the horizon line.
  - Decision: D58 row "Weather particles drawn as hard squares" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#10** (polish, craft · **should**) The sea looks like the loch, with streaks that read as sandbars
  - What: The Saltwater uses the shared `WATER.colour`/`deepColour` (teal-green), the same as Loch Moss. Across the whole sea, pale foam streaks read as beige sand ripples. Close to shore there are sharp-edged tan patches: the sea bed shows through the wave troughs on …
  - Where: `src/config.ts` `WATER` (colour, `bodies['water/saltwater']` shelf 0.5), `src/waterMesh.ts`, `src/waves.ts`; shots `a08-beachE`, `a10-beachW`, `a11-headlandE` (streaks), `a07-pierbeach`, `b01-ship` (tan patches).
  - Editor's fix: A per-body colour override (a deeper blue for the Saltwater), white (not beige) crests, and a surf line that breaks. Deepen the shelf, or cap trough depth near the shore, so the bed never pokes through.
  - Re-check: `review/shots/G3/`: `a08-beachE`, `a10-beachW`, `a11-headlandE`
- **G3#11** (polish, craft · **should**) The shore foam strip glows at night and is a constant-width ribbon
  - What: `foamMat` is a `MeshBasicMaterial`, so it ignores lighting. At night it is a bright blue-white band along the whole shore. By day it is a flat, uniform pale ribbon (pale green along the Saltcut).
  - Where: `src/waterMesh.ts` (`foamMat`); shots `c02-night-pier`, `a12-saltcut`.
  - Editor's fix: Use a lit material (or dim the colour with sun intensity), and vary width and opacity along the shore. Ideally animate a slow wash in and out. This is shared water code, so check the lochs too.
  - Re-check: `review/shots/G3/`: `c02-night-pier`, `a12-saltcut`
- **G3#28** (nit, craft · **must**, D58) Dunelow prices in pence, and its notice board is unreadable
  - What: "DECKCHAIRS HIRE 50p", but the currency everywhere else is Acorns. The village notice puts seven lines on a 1.3 x 0.8 m plate.
  - Where: `src/living/hamletDunelow.ts` (around line 162 and line 156).
  - Editor's fix: Change it to "HIRE 1 ACORN". Split the notice board onto two plates, or cut it to four lines.
  - Decision: D58 row "Long signs unreadable" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G4#3** (polish, craft · **must**, D58) Snow particles render as hard white squares
  - What: `weather/render.ts:104` uses a `PointsMaterial` with no sprite map. Near the camera, flakes become flat white squares, up to about 100 px (bottom-right of `ford2`, `pondMid`, `tarn`, `deckClose`).
  - Where: `weather/render.ts` `snowMat`.
  - Editor's fix: Give the material a small radial-gradient `CanvasTexture` (round, soft edge) with `alphaTest` or premultiplied alpha. Clamp the near size (fade out flakes within about 1.5 m of the camera). Shared with G9.
  - Decision: D58 row "Weather particles drawn as hard squares" (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G6#2** (blocker, craft · **must**, D58) Long single-line signs are unreadable: the jokes don't reach the player.
  - What: `textPlate` draws on a 256 px canvas, puts each `\n` line on one row, and shrinks the font until the widest line fits. A 50–80 character line ends up at about 5–7 px of canvas, which is a grey smear even from 2 m (`shots/G6/sign-pickers`: the PICKERS sign …
  - Where: - Vineyard and manor (`country/trellisLife.ts` SIGNS): - "PICKERS: ONE GRAPE FOR THE BASKET, NONE FOR THE MOUTH" - "THE FIRST VINE: DO NOT TOUCH, PRUNE, ADMIRE OR LEAN" - "DELIVERIES: ROUND THE BACK. EVERYONE: ROUND THE BACK" - "HOA PAMPHLETS: TAKE ONE. THE …
  - Editor's fix: - In `homes/pieces.ts` `textPlate`, word-wrap each line to the plate's aspect before sizing, raise the canvas to 512 (1024 for plates over 1.5 m wide), and set a minimum font size. - Add a test that fails when any plate's computed font is below the minimum. - Then sweep every caller in the group for plates that need more height.
  - Decision: D58 row "Long signs unreadable" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `waders-gate`, `sign-pickers`
- **G6#13** (polish, craft · **must**, D58) Text plates float off their boards and posts.
  - What: - Vineyard and manor signs are put 0.3 m in front of a `signpost` at 1.35 m, so the yellow plate hovers beside the post's own arm (`shots/G6/sign-pickers`). - On the golf `garden-sign`s the plate sits 1.4 m up, above the board, so from behind you see an empty …
  - Where: `country/trellisLife.ts:116` (PLATE_OFF), `golf/bottomGarden.ts:104` (`sign()`), and similar helpers.
  - Editor's fix: - Read the board's face height and offset from `prefabBox` and seat the plate on it. - Give plates a back (a wood-coloured backing box), so the reverse side isn't empty.
  - Decision: D58 row "Long signs unreadable" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `sign-pickers`, `drip-sign`
- **G6#26** (nit, craft · **could**) Turfton's skyline shows as ghostly see-through towers from Windfall Croft.
  - What: From the croft (and the Cloverfield fields) a row of pale blue, semi-transparent tower silhouettes hangs in the sky over the farm (`shots/G6/croft-orchard`, `croft-phone`).
  - Where: far-distance fog and the skyline (shared, G1/G9).
  - Editor's fix: Either fade them fully into fog, or keep them opaque with atmospheric tint. Half-transparent reads as a rendering bug.
  - Re-check: `review/shots/G6/`: `croft-orchard`
- **G6#29** (nit, craft · **must**, D58) Blustery weather particles are flat untextured squares.
  - What: The blowing "debris" shows as pale, flat squares up to 30 px across in every outdoor shot (e.g. `shots/G6/station`, `camp-tent`).
  - Where: weather (G9's area, seen throughout G6).
  - Editor's fix: A leaf or petal texture with a soft alpha, smaller and tumbling.
  - Decision: D58 row "Weather particles drawn as hard squares" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `station`
- **G9#26** (polish, craft · **should**) Rain falls from a blue sky
  - What: `WEATHER_LOOK.rain.overcast` 0.75 is scaled by intensity, so light-to-mid rain gives a clear blue sky, hard sun shadows and long white rain streaks.
  - Where: `desk-41-heat.png`, `land-41-heat.png`, `port-41-heat.png`; `weather/config.ts:24-29`, `atmosphere.ts` `applyWeatherLook`.
  - Editor's fix: give rain an overcast floor (e.g. `0.45 + 0.4 * i`) and soften the sun shadow with overcast. Use shorter, thinner streaks on small screens.
  - Re-check: `review/shots/G9/`: `desk-41-heat.png`, `land-41-heat.png`, `port-41-heat.png`

### Decisions this epic applies (quoted from decisions.md)

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Elevated undersides as black voids | G1#5, G6#15 | An emissive floor on underside materials, plus tunnel and deck lamps (G1#5's dressing). |
| Long signs unreadable | G1#17, G2#12, G3#28, G6#2, G6#13 | `textPlate` wraps words to the plate's aspect and sizes its canvas cell to the plate width (512 px for plates over 1.5 m). Legible at 6 m on a 390 px screen. Dense notice boards get a "Read the notices" interact spot. Plates sit flush on their boards. |
| Free-standing signs blank from behind | G2#11, G3#19 | Free-standing boards print both faces. The back face may carry a second joke. Wall signs face their approach. |
| Weather particles drawn as hard squares | G2#30, G4#3, G5 note, G6#29 | Soft round sprites for snow. Leaf and petal sprites for blustery debris. Near-camera fade. `?weather=off` hides the chip. |


### Also does (a part of a finding owned by another epic)

- **G3#19** (owned by FX11): D58: free-standing boards print both faces (the shared helper). FX11 turns the Last Tube and dresses it.
- **G6#15** (owned by FX16): D58: the emissive underside floor material. FX16 builds the Loamdeep ceiling, props and lamps.
- **G1#26** (owned by FX07): Soft round firefly points with size falloff (the sky emitter). FX07 lights the site cabin, flood lamps and the watchman's lantern.

### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `textPlate(text, w, h, opts)` wraps words to the plate aspect, sizes its canvas to the plate (512 px cells for plates over 1.5 m, 1024 for over 3 m), minimum glyph height so it reads at 6 m on a 390 px screen.
- `signBoard({ front, back?, w, h, board })`: free-standing board that prints both faces (the back may carry a second joke), plate seated flush on the board face read from `prefabBox`, with a backing box.
- `addNoticeSpot(pos, lines)`: a "Read the notices" interact spot that toasts the lines of a dense board.
- An underside material option (`undersideMat(base)`, emissive floor) for slabs, decks and ceilings.
- Per-body water colour and crest colour in `WATER.bodies[...]`.

## Contracts this epic consumes from earlier epics

- None.

## Online / mobile / achievements / prefabs / lore notes

- Mobile: legibility is judged on a 390x844 shot at 6 m. Online: none. Prefabs: a golf umbrella or board prefab, if needed, goes through `packages/prefabs` (prefab rule).
- G9#26 overcast rain: clamp so night scenes are not darker than today (GR6 key frames rely on it).

## Risks and open questions (with the decision taken)

- Bigger canvases cost texture memory: cache plates by text+size, and cap at 1024. Measure with `node tools/gta-perf.mjs --cpu 4` downtown and in Pardonlin before and after (GR9, ≤+15%).
- Water colour is shared by the loch, the canals and the Thymes: the sea override is per body, default unchanged.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX01/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- A unit test: a 70-character single-line plate wraps to at least 2 rows and its glyph height is at least 18 canvas px at 512.
- The long signs listed in G6#2, G1#17 and G2#12 read in a 390x844 shot from 6 m.
- All 10 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
