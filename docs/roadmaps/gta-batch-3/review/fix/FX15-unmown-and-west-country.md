# FX15 The Unmown's tall grass and the west country
Wave: 6 · Depends on: FX01, FX06, FX16 · Kind: Fix (content, density)
Findings: 10 (G6#1, G6#4, G6#8, G6#9, G6#10, G6#12, G6#20, G6#22, G6#23, G6#27) · Decisions: D16, D18

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The Unmown is the corner the Tall One stopped mowing (D16): waist-high grass with mown trails only; Oldroot is a wood, Wader's Rest is reedy; the west between the set pieces has hedgerows, walls, copses and a deer pond; Espalier End is built to the lore (D18); the manor has a back; the vineyard and croft read right.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- landforms/theUnmown.ts (ground paint straw and olive; the Wasm mirror in `assembly/kernel.ts` if mirrored)
- unmown/** (vignettes.ts, marsh.ts, hides.ts, station.ts dressing outside the interior), living/config.ts (UNMOWN_HIDES)
- a new tall-grass instancer (reusing the golf grass cell culling, imported read-only from golf/)
- societies/flock/build.ts (Wader's Rest reed wall and path)
- living/hamletEspalier.ts
- country/manor.ts and the manor prefab back facade, country/vineyard.ts, country/types.ts VINEYARD, country/croft.ts, country/camps.ts, country/campsBuild.ts
- a new west-country dressing module
- docs/lore west entries

### Findings (10)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G6#1** (blocker, craft · **must**, D16) The Unmown is a mown lawn.
  - What: The preserve whose whole identity is "the corner the Tall One stopped mowing" (lore: "the opposite of the Even Cut", "the Long Meadow (waist-high grass)", "where the grass takes things") is short, bright meadow paint with a few ankle-high tufts. The Long …
  - Where: `shots/G6/meadow`, `station`, `wood`, `reedmere-hide`; `landforms/theUnmown.ts` (paint only, no cover), `unmown/vignettes.ts`.
  - Editor's fix: - Fill the Long Meadow rectangle (x -780..-340, z -1760..-1520) and the preserve's margins with a dense instanced tall-grass field: `ornamental-grass`, `giant-grass-blade` and seed heads at 1.2–2 m, culled per cell like the golf grass. - Keep a mown 2 m strip only along the trails, so the paths read as the only cut ground. - Darken and warm the preserve's ground paint (straw / olive) so it reads differently from the …
  - Decision: D16 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `meadow`
- **G6#4** (blocker, craft · **must**) "Round the back" leads to a blank wall: Brassknock Manor has no back door, and no back at all.
  - What: - Three signs and Footman Pell tell visitors to go round the back, and the interior is entered by "the BACK door" (`country/manorInterior.ts:45`, door spot (-1150, 41.5), prompt "Go in round the back"). But the `brassknock-manor` prefab has no door, windows …
  - Where: (-1150, 40), the gardens side.
  - Editor's fix: - Add a back facade to the prefab, mirroring the front windows (both rows): a modest servants' door with a step, a boot scraper and a bell pull, and a small "TRADESMEN · VISITORS · EVERYONE" plate. - Add a gravel apron that meets `manor-path-back`. - Optionally add a lean-to or glasshouse on one end, so the back looks lived in and less formal than the front.
  - Re-check: `review/shots/G6/`: `manor-back`
- **G6#8** (polish, craft · **should**, D16) Wader's Rest is not reedy, and the gate stands in an open field.
  - What: - Lore: "a reedy camp… on a firm gravel spit… the reeds there are tall… the only dry patch for a mile". - In the game: - The site is ordinary mown lawn. - 150 reed and bulrush clumps are spread over 180 x 180 m. The "dense band" along the west and south edges …
  - Where: `societies/flock/build.ts:112`; WADERS_REST site (-1220..-1040, -730..-550).
  - Editor's fix: - Ring the site with a real reed wall (3–5 deep, 1.5–2.5 m tall) broken only at the gate. - Run a gravel path (a pale decal in its own draw layer) from the gate through the reeds to the circle. - Lay a pale gravel paint under the camp itself (the "spit"), plus a couple of shallow pools with lily pads in the reed margin. - Add a low reed fence and a "PLEASE STAND ON ONE LEG" bell or rope at the gate.
  - Decision: D16 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `waders-gate`
- **G6#9** (polish, craft · **should**, D16) Oldroot Wood is not a wood, and the Wood Hide looks at nothing.
  - What: - 34 trees are spread over 220 x 300 m (x -1780..-1560, z -1710..-1410), about one tree per 1,900 m². - The Wood Hide at (-1700, -1330) "looks north into Oldroot Wood", but the wood's south edge is 80 m away, so the hide's window looks onto open meadow …
  - Where: `unmown/vignettes.ts:124`, `living/config.ts:60`.
  - Editor's fix: - Pull the wood's south edge to about z -1360. - Triple the trunk count, with clearings. - Add undergrowth (fern, bramble, fallen logs) between the trunks. - Keep one sightline from the hide to a clearing with the fairy ring, so the hide frames the Unmown's cutest vignette.
  - Decision: D16 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `wood`
- **G6#10** (polish, craft · **should**) Reedmere Hide is 55 m from the water.
  - What: The hide at (-1050, -1550) "looks south over the marsh". The water starts at z -1605, so the window frames a trail and lawn (`shots/G6/reedmere-hide`). The marsh itself is a flat water plane with sparse reeds (`shots/G6/boardwalk`).
  - Where: `living/config.ts` UNMOWN_HIDES, `unmown/marsh.ts`.
  - Editor's fix: - Move the hide to the shore (z about -1598), or extend the reed beds and shallow water north to it. - Densify the reeds round the water's edge. - Add a few lily pads and a heron.
  - Re-check: `review/shots/G6/`: `reedmere-hide`, `boardwalk`
- **G6#12** (polish, craft · **should**) The vineyard gate opens onto 50 m of empty lawn, along a 12 m dirt slab.
  - What: - The gate arch is at z -61, but the first vine row is at z -112. - The "path up the middle" is a 12 m wide brown sheet (x -1146..-1134) that starts at the arch and climbs bare grass (`shots/G6/vine-gate`, `vine-rows`). - Lore promises "terraced slopes, stone …
  - Where: `country/types.ts` VINEYARD (rows.maxZ -112, path), `country/vineyard.ts:132`.
  - Editor's fix: - Start the rows about 8 m inside the gate (rows.maxZ to about -70, keeping Chicory's lodge and the press-house clear). - Narrow the path to 3–4 m of pale gravel with grass verges. - Add two or three dry-stone terrace walls across the hill (`drystone-wall` exists) with the rows stepping between them. - Fill row-end gaps with posts, baskets and frost-pots. - The known "vines thin from afar" issue would also benefit …
  - Re-check: `review/shots/G6/`: `vine-gate`
- **G6#20** (polish, spirit · **should**, D18) Espalier End falls short of its lore and reads as a ring of tombstones.
  - What: - Lore: twelve houses, "a very long hedge", "more pear trees than gnomes", a pear stand by the pump, and hedges kept "a little untidy to show they chose to". - Code: 10 houses, one hedgerow piece, 4 espalier pears, no pear stand. - Every house has the same …
  - Where: `living/hamletEspalier.ts` (HOUSE_COUNT, planEspalierEnd).
  - Editor's fix: - Twelve houses, not on a perfect ring (jitter radius and angle), each with a different, slightly lopsided topiary entry. - A long, wobbly hedge along the road, with the No. 3 / No. 4 hedge visibly two heights. - Pear trees in every garden, plus pears "in transit" at the road edge. - A pear stand with a pear-shaped honesty box by the pump. - Check the thatched cottage's roof proportions.
  - Decision: D18 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `espalier-2`
- **G6#22** (polish, spirit · **should**, D16) The open country between the west set pieces is empty, flat, mown lawn.
  - What: The gaps between the vineyard, the manor, Wader's Rest, the deer, the hunter camps and the Unmown are hundreds of metres of identical striped lawn, with the board fence at the edge (`shots/G6/vine-far`, `deer`, `camp-tent`, `waders-gate`).
  - Where: Trellisdown and the west fringe, x -1400..-950.
  - Editor's fix: - Add a west-of-Trellisdown dressing pass: hedgerows and dry-stone field walls following the land, copses, a few stiles and field gates, unmown field margins, a lone oak with a bench, and a pond for the deer. - Put the hunter camps in copses or hedge corners, not on open lawn. - Fade the mow stripes out west of x -1000.
  - Decision: D16 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `vine-far`
- **G6#23** (polish, craft · **should**) Windfall Croft is not run-down.
  - What: Lore: "a small, run-down croft… an orchard whose fruit keeps falling over the wall". The unbought croft has crisp mown stripes, eight neat empty beds and a post-and-rail fence instead of a wall (`shots/G6/croft-beds`, `croft-orchard`).
  - Where: `country/croft.ts`.
  - Editor's fix: - Before purchase: weeds in the beds, long grass inside the fence, a sagging gate and a broken pane in the farmhouse. - After purchase (farm state): tidy them away. - Make the orchard's south boundary a low stone wall, so the windfalls go over a wall.
  - Re-check: `review/shots/G6/`: `croft-beds`
- **G6#27** (nit, craft · **could**) Names are reused across the region.
  - What: - Teasel's Tent (hunter camp) vs Teasel Gimbal (Underspan welder), plus a Teasel on the court and a Teasel in traffic. - Old Burdock's Shack vs Burdock Flywheel (Underspan) vs Burdock Haybright (Unmown). - Chicory Snips vs Chicory Waymark vs Chicory Sprocket. …
  - Where: `country/camps.ts`, `societies/config.ts`, lore entries.
  - Editor's fix: Rename the hunter camps' owners to fresh plant names (lore check), and rename `camp-north-2`.
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

#### D16. The Unmown and the west — G6#1 (craft blocker), G6#22, G6#8, G6#9 · Unmown **must**, west **should**
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

#### D18. Espalier End — G6#20 · **should**
- **Decision:** build to the lore:
  - twelve houses, jittered off the circle, each with a different, lopsided topiary entry;
  - a long, wobbly hedge, with No. 3 and No. 4 at two heights;
  - pear trees in every garden, and pears "in transit" at the road edge;
  - a pear stand with a pear-shaped honesty box by the pump.
  - Fix the thatched-cottage roof proportions in the prefab.
- **Reason:** the joke ("symmetry is for the HOA") must not be told by the most symmetric layout in the game.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX06 feathered trails (G6#11). FX01 plates. FX16 golf grass (cell culling) has merged.

## Online / mobile / achievements / prefabs / lore notes

- GR9 density: measure at the Long Meadow and the west fringe before and after.
- D16: re-check the mower vignette and the HOA-survey vignette against the new grass height.
- D20: the deer stay as they are.

## Risks and open questions (with the decision taken)

- Tall grass over hides and trails: keep sight lines from each hide (G6#10).

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX15/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Perf numbers in the report. The `meadow`, `station`, `wood`, `reedmere-hide` spots read as tall grass with paths.
- All 2 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX06 (orchestrator)

- Move Spoonbill off the Flock ring's south entry (carried from FX06).
