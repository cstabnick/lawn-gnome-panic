# FX09 Pardonlin's ground: pavements, lanes, the Grand Platz, the Thymes
Wave: 3 · Depends on: FX01, FX06 · Kind: Fix (content, density)
Findings: 11 (G2#1, G2#2, G2#3, G2#4, G2#7, G2#8, G2#9, G2#10, G2#15, G2#25, G2#26) · Decisions: D9

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

L99 in its own words: closer buildings and ambling paths. Keep the road grid, lay the ground properly (D9): pavements to the building fronts, crooked lanes through the blocks, a dense Platz core, a stone-walled river, and fit it in the phone frame budget.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- pardonlin/districts/** (ROWS, frontages, lanes), pardonlin/plan.ts, pardonlin/plans.ts, pardonlin/layout.ts, pardonlin/town.ts (ground and paving; not its plate code, that is FX01's)
- data/levels/pardonlin.level.json (paths, `trail/pl-*` footpaths)
- the Thymes water body (per-body level offset only if the kernel allows it), the Basin, the Jardin (gardens.ts ground and walks)
- workplaces/comedy/club.ts `CLUB_DOOR` (move the entrance to a building edge)
- packages/prefabs: `euro-paving-tile` texture, quay wall, bouquiniste stall, boats

### Findings (11)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G2#1** (blocker, spirit · **must**, D9) The streets have lawn verges, not pavements
  - What: Every street in town runs between grass strips about 3–4.5 m wide. The shopfronts, café tables, plane trees and lamps stand on lawn. Paving exists only as patches of tiles in the squares and Teacup Row. A European town is wall to wall: kerb, pavement, then …
  - Where: `ot3` (Rue Haute), `rueouest`, `pontneuf`, `tq2`, `warden2`, `hatwheel`. Cause: rows at `off: 8` from a 7 m road (`districts/*.ts ROWS`), with nothing laid between the road edge and the fronts.
  - Editor's fix: Lay a pavement band along both sides of every road in town: a kerb line plus a flat paving or cobble strip out to the building fronts. Use a flat decal on `LAYER` (or a ground-paint pass on the terrain mesh for the town rect), not thousands of tile props. Make the squares cobbled or gravel where the lore says so. Keep grass only in the Jardin, the gardens and the backyards.
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#2** (blocker, spirit · **must**, D9) No ambling paths: big grid blocks with lawn inside
  - What: Pardonlin is 23 straight roads (most have 3 points) plus 4 footpaths. Two of the footpaths are the river walks and two are in the Jardin. The blocks are about 115–140 m on a side, built only along their frontages, so the inside of each block is an empty …
  - Where: `src/data/levels/pardonlin.level.json` paths. Block interiors at `ot1` (-1520,-318), `lb3` (-1740,600) and behind the Rue Haute rows.
  - Editor's fix: Cut each block with 1–3 crooked pedestrian lanes (3–4 m wide, cobbled, bending, sometimes stepped) and build both sides of each lane with kit buildings at 0–1 m gaps (`frontage()` already takes footpaths). Put small courtyards and passages through the rows. Keep the big roads for traffic. Lanes are walk-only and add no traffic cost. Add the lanes as `trail/pl-*` footpaths so the clearance test still holds. Start …
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#3** (blocker, spirit · **must**, D9) The Grand Platz is huge and bare
  - What: The town's heart is about 100 x 120 m of identical tiles. The bandstand, the mime and the boules sit far apart, with acres of empty paving between them. At gnome scale it reads as a car park.
  - Where: `ot2`, `platzc`, `groan`, `odile` (-1500,-200 facing north). Lead's own note in the E30 roadmap: "the Grand Platz centre was bare".
  - Editor's fix: Shrink the paved square to about 40–50 m: give the rest to a plane-tree quincunx with benches and gravel, a market corner and café terraces spilling 10 m out. Or keep the size and fill it: a carousel, a flower market, newspaper kiosks, more terraces, a crowd round the mime, and children's boats in the fountain. Move the cellar entrance to a building edge (see 15).
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#4** (blocker, craft · **must**, D9) The Thymes reads as a painted road
  - What: The river is a flat teal strip with a light kerb edge, level with the lawn on both sides. It has no quay walls, no drop, no steps down, no moored boats, no barges, no bookstalls on the parapet and no visible swans. The bridges are flat grey slabs. In the …
  - Where: `thymes` (-1597,-100), `jardinfountain` (-1600,-690), `tq2`. Water config from E28. Quay props are kept 12.5 m from the centre line (`RIVER_KEEP`).
  - Editor's fix: Sink the channel 1.5–2 m between stone quay walls with railings and stair cuts. Moor 6–10 boats (a houseboat, a péniche with washing on it, a sunk rowing boat with a "for sale" sign). Put bouquiniste boxes on the parapet along the Thymes Walk. Make the swans visible. Give the bridges parapets, lamps and a padlock-railing vignette.
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#7** (polish, craft · **should**) The Beetle Market is bare stall frames on a lawn
  - What: 61 `market-stall`s in a uniform grid, standing on grass with one tile aisle. They have no canopies and few goods, and the stalls cannot be told apart. From the street it reads as an empty frame yard.
  - Where: `lb2`, `marketin`, `stall` (-1733,124..160). `leftBank.ts`.
  - Editor's fix: Cobble the market square. Give the stalls striped canopies (tinted per stall) and pile goods by trade: cheese, bric-a-brac, books, beetles. Break the grid into crooked rows, add 4–6 stallholders and shoppers, and put a haggling vignette at every few stalls.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#8** (polish, craft · **should**) Basin Quay and the Basin are empty
  - What: Basin Quay is a large lawn with a distant boathouse and a pedalo on the grass. The Basin is an open sheet of water with one boat, and the world wall is right behind it.
  - Where: `gd3` (-1495,1045 facing west), `basin` (-1560,1040).
  - Editor's fix: Build a stone quay edge with bollards and moored boats. Add a harbourmaster's hut with notices, crates and nets, a short pontoon and two or three boats on the water. Plant trees or a terrace row to hide the world wall.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#9** (polish, craft · **should**) The Jardin stops being a garden past the parterre
  - What: The parterre square works (`gd1`). Beyond it there are only lawns and straight tree rows, crossed by the flat river. The lore calls for "gravel walks, clipped limes, terracotta pots, a long ornamental rill".
  - Where: `gd1`, `jardinfountain`. `gardens.ts`. Lore: `pardonlin.md`, `the-jardin.md`.
  - Editor's fix: Gravel the walks (paint, not props). Use pleached limes on the axis, put pots on the balustrades and add an ornamental rill or a basin on the cross axis. Make the river edge a stone bank here (see 4).
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#10** (polish, craft · **must**, D9) Paving: grass in the seams, tiles that look like wood, raised slab edges
  - What: (a) Tiles 2.94 m wide on a 3 m grid leave 6 cm gaps that show grass. The seam under the camera reads as a green line across every square (`ot2`, `platzc`, `towerqueue`, `platz-nodebug` without `&debug`). (b) The tile texture is streaky and reads as timber …
  - Where: `oldTown.ts TILE / TILE_SCALE`, the equivalents in the other districts, and the `euro-paving-tile` prefab.
  - Editor's fix: Put one flat stone-coloured decal under each paved area (`flatLayer`, decal layer) so the seams show stone. Change the tile texture to stone flags or setts. Finish patch edges with a kerb prop, or feather them with a border strip. This combines well with finding 1.
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#15** (polish, craft · **should**) Le Petit Groan is a grey hole in the middle of the Platz
  - What: The comedy cellar is meant to be "off the Grand Platz". Instead it is a free-standing grey stair well in the open square at (-1498,-209), with no readable name over it, and its chalkboard shows no text. The lore entry still says "In the games: Planned (E24)".
  - Where: `groan`, `ot2`. `workplaces/comedy/club.ts CLUB_DOOR`. `docs/lore/entries/apocrypha/le-petit-groan.md`.
  - Editor's fix: Move the door to a cellar hatch or doorway in a Platz-side building front, with a hanging sign ("LE PETIT GROAN. Laughter by appointment") and tonight's bill on the chalkboard. Update the lore's "In the games" section.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#25** (polish, craft · **must**, D9) Low-end phone performance was never checked on the densest districts
  - What: E30 deferred the low-end phone run. The Left Bank alone has 848 buildings and the town 1709 buildings plus about 7,500 props. Desktop numbers are fine (7.4 ms at the Platz).
  - Where: E30 roadmap, "Deferred / known".
  - Editor's fix: Run `node tools/gta-perf.mjs --cpu 4` at the Platz, Rue Ouest and the market before merge. Pardonlin's fixes (pavements, lanes) add geometry, so measure after them too.
  - Decision: D9 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#26** (polish, craft · **must**, D9) A wide strip of lawn around the Opera Hall
  - What: Radio Adagio's Opera Hall sits on a paved forecourt marooned in lawn. Between the Boulevard and the forecourt is a 10 m grass strip with no path. Forecourt dressing is light: a horn speaker, a chalkboard and two benches, plus the race crowd from finding 16.
  - Where: `lb1`, `adagiofront`, `operabanner`.
  - Editor's fix: Pave from the kerb to the steps. Add a ticket kiosk and posters for "the Fifth, Act 1 of 3, of 3", a stage door with a queue of one cellist, and the Maestro's parked scooter.
  - Decision: D9 (quoted in full under "Decisions this epic applies").
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

#### D9. Pardonlin's ground: pavements, lanes, the Platz, the Thymes — G2#1, #2, #3, #4, #10, #26 (perf: #25) · **must**
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


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- Lane polylines registered as `trail/pl-*` footpaths (FX10 walks residents and strollers along them).
- Queue post positions unchanged (FX10 fills the queues).

## Contracts this epic consumes from earlier epics

- FX01 plates and double-sided boards. FX06 `AmbientGnomeDef.y`.

## Online / mobile / achievements / prefabs / lore notes

- GR9 density: measure with `node tools/gta-perf.mjs --cpu 4` at the Platz, Rue Ouest and the market before and after; ≤+15% phone frame time, else instance, merge or cut. This is G2#25.
- Le Petit Groan: lore `le-petit-groan.md`. E30's 33 vignettes stay where they are unless a lane cuts one; then move it a few metres and keep its text.

## Risks and open questions (with the decision taken)

- Pavement decals must use `flatLayer(material, LAYER.<x>)`, not a lift (z-fight rule).
- Lanes must not cut E28 traffic, roundabouts or the race routes.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX09/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Perf numbers before and after are in the lead's report and in `review/rounds.md`.
- The `ot3`, `rueouest`, `ot2`, `platzc`, `thymes`, `lb2` spots read as a town with pavements and lanes.
- All 7 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
