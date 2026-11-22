Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Other workers are editing game code, `docs/lore/` and `packages/` at the same time. You own exactly the four files
below. Plain, short, concrete writing; no marketing words. No code changes.

## Goal
The docs say what the Wild World roadmap built: the game README, the agent index, the roadmap (every epic marked done,
with its deviations) and a party backlog row for a boat regatta slice.

## Read first
- `games/gnome-theft-auto/README.md`: the section list (`## Controls`, `## Quests & Story`, `## Turfton FM`, `## Mowers`,
  `## Online`, `## Testing`, ...). Keep its style.
- `AGENT_INDEX.md`: the `gnome-theft-auto` row of the games table (line ~57), the roadmap row
  `docs/roadmaps/gnome-theft-auto-wild-world.md` (line ~112), the tools table (`record-demo.mjs`, `smoke.sh`,
  `zfight.mjs`, line ~141).
- `docs/roadmaps/gnome-theft-auto-wild-world.md`: the intro ("Nothing here is built yet."), `## Shape`, and each
  `## Epic N` section (Epics 1-5 and 7 have a `**Decomposed:**` line; 6 and 8 do not).
- `packages/party/README.md` `## Backlog` table (columns Slice | Game | Idea | Status).

## Change
- `games/gnome-theft-auto/README.md`: add a `## Wild World` section after `## Mowers` with short subsections:
  - **Regions:** seven regions on an 1800 x 1800 map (Turfton, the Dust Flats, Mossy Wood, Frostbite Fells, Cloverfield
    Farms, Loch Moss, Tallgrass Commons), one level document each in `src/data/levels/`; hills from `src/terrain.ts`
    and `src/landforms/`.
  - **Water and boats:** the Everspring river from the Fells through Loch Moss and Mossy Wood to the Puddle Sea, the
    Southern Drainage Canal, five road bridges (Fellsmelt, Ravine, Bracken, Culvert, Clover), New Puddle Marina and the
    Loch Moss dock. Five boats (Walnut Dinghy, Gravy Boat, Clog Cruiser, Watering-Can Steamer, HOA Patrol Boat),
    driven with the mower controls; gnomes bob in water and cannot fire; mowers stall in deep water.
  - **Wildlife** (`src/critters.ts`, `src/critters/`, local to each browser): Cloverfield herds (tip a cow on foot, herd
    with the Combine or Mulch Spreader), the Drey Gang squirrels (raids, stolen mowers, scatter them by shooting),
    Fells snowmen, sgnowmes and polar bears who only shrug, Tallgrass Commons giant grass (hides you from the Hat
    Watch) and bees (knock a hive, lose the swarm). Animals are knocked over and run off; they never die.
  - **Tessie** (`src/tessie.ts`, `src/quests/tessieQuest.ts`): the side quest unlocks at a random story beat, then
    Driftwood waits on the Loch Moss shore; afterwards Tessie surfaces now and then and can be ridden.
  - **Achievements:** Herd It Through the Grapevine, Tipping Point, Drey Day, Snow Joke, Unbearably Chill, Bee Line,
    Captain Clay (every boat), plus the four Tessie ones; each gives gear.
  - **Dev and demo params:** `?at=x,z[,yaw]`, `?terrain=hill`, `?tessie=now` (unlock the quest), `?tessie=surface`
    (Tessie surfaces near you after 2.5 s), `?mount=<kind>&mountat=x,z[,yaw]` (start at the wheel of that vehicle at
    that spot; works for boats), `?debug` (`window.__gta`).
  - **Demos:** `demos/boat-river-run.json`, `demos/drey-raid.json`, `demos/tessie-surfacing.json`,
    `demos/hills-drive.json` (`npm run demo -- games/gnome-theft-auto/demos/<name>.json --gif` with the dev server on
    5198).
  - **Perf check:** `node tools/gta-perf.mjs [url]` drives across every region at a 390x844 phone viewport and prints
    frame times and draw calls per region.
- `AGENT_INDEX.md`:
  - `gnome-theft-auto` row: replace "and the (still empty) Loch Moss and Tallgrass Commons corners" with "Loch Moss
    (Tessie the giant turtle, `src/tessie.ts`, side quest `sq-tessie`) and Tallgrass Commons"; replace "five boat kinds"
    with "five boats"; add "demos in `demos/` (boat river run, Drey Gang raid, Tessie surfacing, hills drive)". Keep the
    rest of the row.
  - roadmap row: "Gnome Theft Auto Wild World, 8 epics, done (issues in `gnome-theft-auto-wild-world/epic-1/` to
    `epic-8/`): world as level docs, terrain heights, 1800 m map, river/loch/boats, per-region landforms, wildlife,
    Tessie side quest, integration".
  - tools table: add `| \`gta-perf.mjs\` | Gnome Theft Auto phone-viewport frame-time and draw-call check, driving across every region (\`node tools/gta-perf.mjs [url]\`, dev server running) |` after `record-demo.mjs`.
- `docs/roadmaps/gnome-theft-auto-wild-world.md`:
  - Replace "Nothing here is built yet." with "All eight epics are built; each epic's `_foundation.md` records what
    was built and what changed from this plan."
  - Add a `**Status:** done.` line under every `## Epic N` heading (1 to 8). Add a `**Decomposed:**` line to Epic 6
    (`[gnome-theft-auto-wild-world/epic-6/](gnome-theft-auto-wild-world/epic-6/)`, `_foundation.md` and `_runtime.md`;
    issues 6A farm critter prefabs, 6B wild life prefabs, 6C Cloverfield animals, 6D Drey Gang, 6E Fells locals, 6F
    Commons grass and bees) and Epic 8 (`epic-8/`; issues 8A radio, 8B gear and achievements, 8C achievement hooks and
    demo params, 8D perf hot spots, 8E lore, 8F docs, 8G synced achievement store).
  - Add a `## Deviations from the plan` section just before `## Open questions for you`, one bullet per epic:
    - Epic 1: scatter (trees, villages, farms) stays procedural, one seeded generator per region; only hand-placed
      things moved into the documents, and many old placements the code silently rejected are simply absent.
    - Epic 3: five bridges, not four (the farm river has to leave the ring road).
    - Epic 4: boat and water achievements were left to Epic 8; the river source stays an uncarved ice bowl; bridge
      decks, docks and wharves stand a step proud of the ground to avoid z-fighting.
    - Epic 5: `TERRAIN.amplitude` ships at 1; road ribbons have five vertices across; the Fells' base swell is calmed
      near highways; dirt trails are not drawn on the minimap yet.
    - Epic 6: wildlife is local to each browser (no networking).
    - Epic 7: Tessie's island did not exist (the loch carve ran over it) and was fixed in `water.ts`; the achievement
      store lost one of two same-moment unlocks (fixed); NPC boat loops avoid islands.
    - Epic 8: the boat regatta is a backlog row, not a slice yet; the perf pass fixed CPU hot spots (townsgnome walk
      points, route planning) and doubled the ground chunk size rather than adding new LOD systems.
  - In `## Shape`, append " (done)" to each epic's Name cell.
- `packages/party/README.md` `## Backlog`: add a row after `gta-getaway`:
  `| boat-regatta | gnome-theft-auto | 45 s regatta on Loch Moss: four gnomes in Walnut Dinghies round three buoys and Tessie's island, first back to the dock wins (one verb: steer; reuses boats.ts stepBoat and waterAt) | later |`

## Contract
Names verbatim: bridges Fellsmelt, Ravine, Bracken, Culvert, Clover; demo files and `tools/gta-perf.mjs` as above
(the planner creates them after this issue; they need not exist when you finish).

## Done when
- `git diff --stat` shows exactly these four files changed by you.
- Every Markdown table you touched still has the same number of `|` cells in every row as its header (check by eye).

## Out of scope
All code, `docs/lore/`, `docs/roadmaps/gnome-theft-auto-wild-world/epic-*/`, other games' README files.
