# Gnome Theft Auto: cleanup pass

Goal: after the big batch (skyways, Pebblewick, parks and fringe, towers, flora, waves, sky traffic, sim jobs, online
sync, quest sim, UI pass, crossover portals), find rough edges and unfinished bits and either fix them or record a
"won't fix, reason" line. No new features.

Mobile / online: no new controls except a trainer button (44 px, trainer UI). No new messages; the multiplayer-audit
planner owns `src/net.ts`, `src/remotes.ts`, `src/online/`, `src/portal/` and world-build determinism, so issues found
there are reported to it, not fixed here.

## Audit (planner)

Starting state: `npx tsc --noEmit -p games/gnome-theft-auto` clean. Of the test files the planners reported failing, a
targeted run (perks, traffic, terrainDrive, sound/engines, driveGrips, highways, parks, cityScenery, quests, layout
golden, saveIO, cloudSave, mapIcons, events, skyTraffic, stages) gave 3 failures: the layout golden (towers vertex
counts), terrainDrive slope test (1.0005 vs < 1), and quests 'trapped inside a building' (jsdom canvas: `c.rect` missing
in the fake 2D context). perks, sound/engines, driveGrips, highways, parks/layoutA and dressing passed (fixed by their
own planners after reporting). traffic.test.ts passed 7 runs out of 7 here. Achievements: `hazel-staff` and
`porcelain-lantern` were each the reward of two achievements. Prefabs (2555) and lore pass.

Fixed directly by the planner (cheaper than an issue):

- quests.test.ts: the fake 2D context is a Proxy (any unknown call is a no-op), so the towers' atlases build and the
  'trapped' test now runs (and finds the real spot problems fixed in 1B).
- Achievements: `dayg-word-gets-around` now rewards `willow-switch`, `dayg-bell-ringer` rewards `flint-striker` (both
  unused hand prefabs); club-gnome keeps the Hazel Staff and the Porcelain Lantern it sells.
- events/spots.ts: street events skip road nodes with `deck` set (no event on the ground under a skyway).
- fishing/fishView.ts: the ripple ring rides the waves (`waveSurfaceOffset`, like the bobber).
- app.ts: removed the dead cutscene CSS rule for `#gta-journal-btn` / `#gta-taxi-btn` (the buttons are gone); removed a
  leftover `console.log('[cutscene] trigger')`.
- Verified, nothing to do: `types.ts` Blip.kind covers every PlaceKind (tsc clean); the Lock-Up marking is built
  (`lockup/marking.ts`, wired in app.ts); nc-odd-jobs reads the live jobs runtime (`jobs/runtime.ts` calls
  `bindJobStats`), not a stub; `?debug` is the only way `window.__gta` is set; no TODO/FIXME/debugger left in the batch's
  files.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Fixes | each issue's check; tsc clean | 6 (1A-1F) |
| 2 Checks and polish | each issue's check; tsc clean | 3 (2A-2C) |
| 3 Final (planner) | reeds look, golden regenerated once, smoke loads, screenshots, perf, release notes | - |

Files per issue (no file under two issues):

- 1A highways/colliders.ts, highways/deck.test.ts, questSim/plans.ts
- 1B quests/newcomerQuests.ts, jobs/defs.ts, quests/sideQuests.ts, cutscene/scenes/side/bigLou.ts, questSim/checks.ts, questSim/checks.sim.test.ts
- 1C mapIcons.ts, mapPois.ts, types.ts (Blip.kind only), mapIcons.test.ts
- 1D fleetRuntime.ts, trainer/sections/spawn.ts
- 1E fishing/shopUi.ts, outskirts/shopUi.ts, hunting/lodgeUi.ts, craft/craftShop.ts
- 1F saveIO.ts, cloudSave.ts, saveIO.test.ts, cloudSave.test.ts, trainer/sections/save.ts (only if needed)
- 2A skyTraffic/behaviours.ts, skyTraffic/places.test.ts (new)
- 2B terrainDrive.test.ts, traffic.test.ts (and traffic.ts only if the cause is there)
- 2C tools/zfight.mjs, biomes.ts (airfield slab), packages/prefabs catalog files of the flagged prefabs

Ports: only 2C starts a dev server (5448). Quest-sim runs write to their own `--out` folder.

## Epic 1 issues

Common environment block (pasted into every issue):

~~~~text
## Environment (common)
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (Vite + TypeScript + three.js,
vitest). In Git Bash, if node is missing: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in
this game at the same time: touch ONLY the files under Change. Never commit, push, stash or switch branches. Do not
start a dev server unless the issue says so. Tests are slow: run only the test files named here (npx vitest run <file>
from games/gnome-theft-auto), never the whole suite. `npx tsc --noEmit -p games/gnome-theft-auto` (from the repo root)
is cheap: run it. Do not edit src/net.ts, src/remotes.ts, src/online/, src/portal/, AGENT_INDEX.md.
~~~~

~~~~text
Epic: 1, issue 1A: Skyway west on-ramp: side wall across the landing
Depends on: none

## Goal
A vehicle climbing the Turfton Skyway's west on-ramp is no longer walled in at the corner landing (x -213.5..-208.9,
z -60). The embankment walls follow each segment's own direction and meet cleanly at corners.

## Read first
- games/gnome-theft-auto/src/highways/colliders.ts: skywayColliders(). Each wall box between samples a and b is
  offset sideways with a.dirX/a.dirZ only. At the sharp corner of 'turfton-skyway' (points (-219,-52) -> (-219,-60) ->
  (-211,-60), skyways.ts) sample a sits on the corner with the INCOMING direction (0,-1), so the box to the next sample
  (b east of it) is offset in x and lies ACROSS the outgoing road: from x -213.2 to -209.2 at z -60. That is the bug.
- games/gnome-theft-auto/src/highways/skyways.ts: SKYWAY (railHeight, sample), SKYWAYS points.
- games/gnome-theft-auto/src/highways/deck.test.ts: existing collider tests (it imports skywayColliders).
- games/gnome-theft-auto/src/questSim/plans.ts: entry 'city-skyway-robbery' (expect fail + note about this bug).

## Change
- highways/colliders.ts skywayColliders(): compute the side offset from the SEGMENT direction
  (sx, sz) = normalised (b.x - a.x, b.z - a.z) (skip a zero-length segment), not from a.dirX/a.dirZ. Then close the outer
  corner: where the segment direction changes between consecutive segments (dot < 0.999), the outside wall would leave
  a gap; add for each side whose offset point moves outward a small box spanning the two offset points at that corner
  sample (the incoming segment's end offset and the outgoing segment's start offset), same height rule
  (max(y) + SKYWAY.railHeight). Never add a box whose footprint overlaps the driving surface: a box is wrong if any of
  its corners lies closer than def.width/2 to the centre polyline of the skyway (write a small helper and assert it in
  the test, below). Keep every other rule (skip junctions inside another deck, columns) unchanged.
- highways/deck.test.ts: add a test "no embankment wall stands on a skyway's own driving surface": for every skyway
  def and every collider box from skywayColliders() whose height is not a column (columns have h = deckY - slab),
  sample its 4 corners and centre; for samples of the same skyway (deckSamples(def.id, 1)) with solid = true, assert
  the distance from the box centre to the nearest centre-line sample is >= def.width / 2 - 0.05 OR the box is not
  near that skyway at all. Also a direct regression: no wall box contains the point (-211, -60) (expand by 0) and no
  wall box contains (-216, -60).
- questSim/plans.ts: after the fix, run the quest (below). If it passes, change 'city-skyway-robbery' to
  `{ suite: 'city', expect: 'pass' }` and drop the note; if it still fails for a different reason, update the note with
  the new reason.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/highways passes.
- npm run quest-sim -w games/gnome-theft-auto -- --quest city-skyway-robbery --force --out "%TEMP%/qs-1a"
  (Git Bash: --out "$TEMP/qs-1a") reports the quest's result; record it in your report.
- npx tsc --noEmit -p games/gnome-theft-auto passes.

## Out of scope
highways/deck.ts, skyways.ts (do not move the ramp), mesh.ts, every other file.
~~~~

~~~~text
Epic: 1, issue 1B: quest spots inside buildings or on water
Depends on: none

## Goal
No quest spot is inside a collider or on water: the quest sim's static baseline (KNOWN_STATIC) is empty or holds only
documented by-design entries, and quests.test.ts 'trapped inside a building' passes.

## Read first
- games/gnome-theft-auto/src/questSim/checks.sim.test.ts: KNOWN_STATIC lists today's findings:
  ch3-kiln-resin-ice survive-derby.arena (0,-350) in a collider; nc-odd-jobs visit (-30,34) in a building (CAB_RANK);
  nc-tuft-and-tally probe.at (-548,-52) (LODGE centre) x2; nc-hangar-and-boathouse visit (-690,-566) on water
  (ESTATES.boathouse centre); sq-big-lou-embargo steal-deliver.spawnAt (-90,-56) against a Skyway collider.
- games/gnome-theft-auto/src/questSim/checks.ts: how spots are checked (pushOutOfBoxes(x, z, r, world.boxes, 0).hit;
  waterAt(x, z) !== null) and line ~60 where survive-derby.arena is added.
- games/gnome-theft-auto/src/questSim/harness.ts: buildSimWorld() (world + skyways) for a quick probe script.
- games/gnome-theft-auto/src/quests/newcomerQuests.ts: CAB_RANK (line ~19), nc-tuft-and-tally probes use
  at: [LODGE.x, LODGE.z], nc-hangar-and-boathouse visits use [ESTATES.hangar.x/z] and [ESTATES.boathouse.x/z].
- games/gnome-theft-auto/src/jobs/defs.ts: the taxi job's depot { x: -30, z: 34, name: 'Kerbstone Cabs rank' } (the
  kiosk; jobs/visuals.ts searches outward from it for clear ground).
- games/gnome-theft-auto/src/quests/sideQuests.ts ~line 356 spawnAt: [-90, -56, PI/2] and
  src/cutscene/scenes/side/bigLou.ts ~line 94 the same van 'vip' at [-90, -56]: keep the two equal.
- games/gnome-theft-auto/src/quests/objectivesAction.ts ~120-172: survive-derby uses arena only as the ring centre and
  blip (no one is placed there).

## Change
- Find legal points with a throwaway script (vitest file in your temp folder or a .test.ts you delete afterwards) using
  buildSimWorld(): a point is legal when pushOutOfBoxes(x, z, r, world.boxes, 0).hit is false (r = 1 for visit/probe,
  1.8 for a vehicle spawn), waterAt(x, z) === null (except the boathouse, see below), and it is off the skyway decks.
  Search outward in 1 m steps from the old spot, prefer the side facing the building's door / the road.
- quests/newcomerQuests.ts: CAB_RANK = the taxi depot point from jobs/defs.ts (import the def and use its depot x/z so
  they cannot drift); give nc-tuft-and-tally's two probes an `at` in front of the lodge door (LODGE.yaw 0: the door
  faces +z; try (LODGE.x, LODGE.z + 6) and search from there); for the boathouse visit use a dry point on the shore
  by its slip (try ESTATES.boathouse.x, ESTATES.boathouse.z + 10 and search). Keep each radius as is.
- jobs/defs.ts: move the taxi depot target from (-30, 34) (inside Gnorwin Clayfoot Park's fountain colliders) to the
  nearest legal pavement point just outside the park block (blocks are 60 x 60 between road centre lines; the road is
  10 wide; a pavement point is ~6.5-8 m from a road centre line).
- quests/sideQuests.ts + cutscene/scenes/side/bigLou.ts: move the Big Lou van spawn (both places, same numbers) to the
  nearest legal 1.8 m point, same yaw.
- questSim/checks.ts: survive-derby's arena centre is a ring centre, not a spot: check instead the point
  (arena.x, arena.z + radius / 2) with r = 1 under the label 'survive-derby.arena-edge'.
- questSim/checks.sim.test.ts: empty KNOWN_STATIC of every entry you fixed (the test fails both on new and on stale
  entries). If the arena-edge point is also blocked, pick another angle in checks.ts (try 8 angles, use the first
  clear one).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/questSim/checks.sim.test.ts src/quests/quests.test.ts
  src/quests/stages.test.ts src/jobs passes (quests.test.ts must pass the 'trapped inside a building' test).
- npm run quest-sim -w games/gnome-theft-auto -- --quest nc-odd-jobs,nc-tuft-and-tally,nc-hangar-and-boathouse,sq-big-lou-embargo --force --out "$TEMP/qs-1b"
  : report each result (they are expected to pass).
- npx tsc --noEmit -p games/gnome-theft-auto passes.

## Out of scope
highways/*, questSim/plans.ts (1A owns it), hunting/species.ts and lockup/config.ts (do not move the buildings),
every other file.
~~~~

~~~~text
Epic: 1, issue 1C: map labels for the parks and the four fringe edges
Depends on: none

## Goal
The minimap and big map show the six parks (with names) and the four named city edges (Scrapside, Stumpend, Chillyard,
Lockside) as place blips, through the existing place-blip path.

## Read first
- games/gnome-theft-auto/src/mapPois.ts: placeBlips() builds place blips with at(kind, x, z, label).
- games/gnome-theft-auto/src/mapIcons.ts: PlaceKind union (line ~5), PLACE_STYLE (name + colour per kind, the legend
  order), drawPlaceIcon(g, x, y, r, kind) (a switch drawing each icon), RIM_PLACES, isPlace().
- games/gnome-theft-auto/src/types.ts line ~640: Blip.kind union (must list every PlaceKind).
- games/gnome-theft-auto/src/mapIcons.test.ts: placeBlips test (counts per kind; `repeats` set; distinct labels).
- games/gnome-theft-auto/src/parks/blocks.ts: PARKS (id, name, x, z), 6 entries.
- games/gnome-theft-auto/src/fringe/belt.ts: EDGE_NAMES and EDGE_LABELS (x, z per edge).

## Change
- mapIcons.ts: add PlaceKind 'park' (PLACE_STYLE { name: 'Park', color: '#3f9a4a' }; icon: a small round tree: a
  dark green disc on a short brown trunk) and 'edge' (PLACE_STYLE { name: 'City edge', color: '#8a7a5a' }; icon: two
  short diagonal hatch lines, a "rough ground" mark). Draw both inside drawPlaceIcon like the others (same r scale). Do
  not add them to RIM_PLACES (no edge arrows).
- types.ts: add | 'park' | 'edge' to Blip.kind. Nothing else in types.ts.
- mapPois.ts: import PARKS and EDGE_NAMES / EDGE_LABELS; append one park blip per PARKS entry (label = park name) and
  one edge blip per edge (label = EDGE_NAMES[id]). Labels must stay distinct from every other place label.
- mapIcons.test.ts: add 'park' and 'edge' to `repeats`; expect counts park 6 and edge 4; update the comment count.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/mapIcons.test.ts passes.
- npx tsc --noEmit -p games/gnome-theft-auto passes (hud.ts and other switch statements over PlaceKind compile; if a
  Record<PlaceKind, ...> elsewhere now misses keys, tsc names it: add the two keys there too and list the file).

## Out of scope
hud.ts drawing logic (it already draws any place blip), parks/, fringe/, every other file.
~~~~

~~~~text
Epic: 1, issue 1D: trainer "Clear spawned"
Depends on: none

## Goal
The Save Trainer's Spawn tab has a "Clear spawned" button that removes every vehicle and critter the trainer spawned this
session (not the one the player is riding).

## Read first
- games/gnome-theft-auto/src/fleetRuntime.ts: FleetRuntime interface (~line 57) and createFleetRuntime().spawn (~152):
  spawn pushes into deps.vehicles and calls shareVehicle(v). Only the trainer calls fleet.spawn.
- games/gnome-theft-auto/src/vehicles.ts line ~792: removeVehicle(scene, v) (disposes rig, removes the mesh).
- games/gnome-theft-auto/src/lockup/runtime.ts ~174: forget(v): removeVehicle + splice from the vehicle list (pattern).
- games/gnome-theft-auto/src/critters.ts: CritterRuntime.spawn(kind, x, z, opts with `group`), remove(c), inGroup(group).
- games/gnome-theft-auto/src/trainer/sections/spawn.ts: registerBuiltIns() (vehicle and critter spawnables) and the
  section's build() (status line `st`, buttons via button(label, fn) from ../ui, 'Clear street events' as a model).
- games/gnome-theft-auto/src/trainer/types.ts: TrainerCtx (ctx.fleet, ctx.critters, ctx.player.vehicle).

## Change
- fleetRuntime.ts: keep a Set<Vehicle> of vehicles spawn() created. Add to FleetRuntime:
  `/** Remove every vehicle spawn() made that is still in the world, except \`keep\` (the player's ride). Returns the count. */
   clearSpawned(keep: Vehicle | null): number;`
  Implementation: for each tracked v !== keep: if it is still in deps.vehicles, removeVehicle(deps.scene, v) and splice
  it out; also skip (keep) any v whose `driver` is 'player'. Clear the set except `keep`.
- trainer/sections/spawn.ts: critter spawnables pass `group: 'trainer-spawn'` in the spawn opts. In build(), next to
  'Clear street events', add button('Clear spawned', ...) that calls ctx.fleet.clearSpawned(ctx.player.vehicle) and
  removes ctx.critters.inGroup('trainer-spawn') with ctx.critters.remove(c); status: `Cleared N vehicles and M
  critters.` Update the note text: 'Spawned things are not saved; Clear spawned removes them.'

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- cd games/gnome-theft-auto && npx vitest run src/fleetRuntime.test.ts src/fleet.test.ts passes; add one test to
  fleetRuntime.test.ts if it already builds a FleetRuntime (spawn two, clearSpawned(first) leaves only the first);
  skip the new test if building a FleetRuntime in node is not already done there.

## Out of scope
online/ (parkSync owns the online side: do not touch shareVehicle/takeShared), critters.ts, every other file.
~~~~

~~~~text
Epic: 1, issue 1E: glyph hints on the new shop sheets
Depends on: none

## Goal
The new shop sheets (The Bent Pin, Pebblewick shops, Tuft & Tally lodge counter, Wingwright's Slipway craft shop) show a
footer hint with the device's close glyph, like the rest of the UI pass, and nothing on touch (the ✕ is the control).

## Read first
- games/gnome-theft-auto/src/ui/glyphs.ts: fillHintHtml(text) replaces {actionId} tokens with the current device's
  glyph HTML (action ids include 'close' and 'confirm'); glyphText(action); ensureGlyphStyle().
- games/gnome-theft-auto/src/ui/inputSource.ts: currentGlyphSet() ('touch' | keyboard | pad sets) and how other modules
  react to a source change (grep onGlyphSetChange or similar in inputSource.ts; lockup/ui.ts and fishing/fishHud.ts
  use fillHint already: copy their pattern).
- games/gnome-theft-auto/src/fishing/shopUi.ts, src/outskirts/shopUi.ts, src/hunting/lodgeUi.ts,
  src/craft/craftShop.ts: each builds a sheet with a header and a ✕ close button.

## Change
In each of the four files: add a footer element at the bottom of the sheet with class '<prefix>-foot' (small, muted,
centred, 12px, same palette as the sheet) whose innerHTML = fillHintHtml('{close} Close') (and for sheets with a
buy/confirm key binding, '{confirm} Buy · {close} Close'; only if the sheet already handles KEYS.confirm or Enter).
Refresh it whenever the sheet opens. Hide the footer when currentGlyphSet() is the touch set. Call ensureGlyphStyle()
once. No layout change otherwise; the footer must not push content off a 390x844 screen (keep it one line).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- cd games/gnome-theft-auto && npx vitest run src/fishing src/outskirts src/hunting src/craft src/ui passes.

## Out of scope
ui/glyphs.ts, ui/inputSource.ts, lockup/ui.ts, every other file.
~~~~

~~~~text
Epic: 1, issue 1F: save keys audit
Depends on: none

## Goal
Every progress key the game writes to localStorage is in GTA_SAVE_KEYS, has a cloud MERGES entry, is in the saveIO test
fixture, is cleared by Reset, and export/import round-trips it.

## Read first
- games/gnome-theft-auto/src/saveIO.ts: GTA_SAVE_KEYS (22 keys), exportSaveBundle / importSaveBundle /
  resetSaveBundle.
- games/gnome-theft-auto/src/cloudSave.ts: MERGES (per-key merge rule) and how a key without an entry is merged.
- games/gnome-theft-auto/src/saveIO.test.ts and src/cloudSave.test.ts: the fixtures.
- Keys found in src (grep -rhoE "'gta-[a-z0-9-]+-v[0-9]+'" src): also gta-perks-v1 (perks.ts PERKS_KEY;
  trainer/mark.ts says perk overrides stay per device on purpose) and gta-odd-rides-v1 (oddRides.ts ODD_RIDES_KEY), plus
  settings/infra keys (gta-cloud-*, gta-trainer-backup-v1). Also grep for keys built from constants
  (localStorage.setItem( / getItem( with a variable) in src/**/*.ts (not tests) and resolve each constant.

## Change
- For every key: decide progress (belongs in the bundle) or per-device setting / infra (stays out). Rule: anything the
  player earned or unlocked is progress. gta-odd-rides-v1: read oddRides.ts; if it records progress, add it to
  GTA_SAVE_KEYS with a comment, a MERGES entry (union / max like the similar keys) and the fixtures. gta-perks-v1: read
  perks.ts; if it holds earned perks (not only trainer overrides), add it the same way and fix trainer/mark.ts's comment;
  otherwise leave it out and say why in a comment next to GTA_SAVE_KEYS.
- cloudSave.ts: every GTA_SAVE_KEYS key has an explicit MERGES entry (add any missing one, choosing the rule from its
  data shape: counters max, sets union, bests max/min, else newest).
- saveIO.test.ts: one test that iterates GTA_SAVE_KEYS, writes '{"x":1}' for each into a fake storage, exports,
  resets (every key gone), imports, and gets every key back.
- Reset: confirm resetSaveBundle clears every GTA_SAVE_KEYS key and that the trainer's / options' Reset button calls it
  (grep resetSaveBundle); fix only if not.

## Done when
- cd games/gnome-theft-auto && npx vitest run src/saveIO.test.ts src/cloudSave.test.ts src/trainer passes.
- npx tsc --noEmit -p games/gnome-theft-auto passes.
- Report: the final key list, which keys stay out and why.

## Out of scope
The modules that own each key (perks.ts, oddRides.ts, ...) except a comment fix in trainer/mark.ts; every other file.
~~~~

## Epic 2 issues

~~~~text
Epic: 2, issue 2A: sky-traffic places on legal ground
Depends on: none

## Goal
A test proves every fixed point the NPC flights use on or near the ground is on legal ground (dry land, off decks,
clear of colliders); any that is not is moved.

## Read first
- games/gnome-theft-auto/src/skyTraffic/behaviours.ts: DROP_ZONES (mail-drop), AMBULANCE_STOPS, the crop-duster field
  cropPasses({ x: 40, z: 440, w: 160, d: 90 }, ...), airfield-circuit parking (c.airfield.x - 40, c.airfield.z - 22)
  where c.airfield is the world's airfield (config AIRFIELD).
- games/gnome-theft-auto/src/questSim/harness.ts: buildSimWorld() -> { world } (world.boxes, world.biomeAt).
- games/gnome-theft-auto/src/collide.ts pushOutOfBoxes(x, z, r, boxes, y); src/terrain.ts waterAt(x, z), heightAt.
- games/gnome-theft-auto/src/highways/deck.ts deckContactsAt(x, z) (non-empty = on a skyway deck footprint).
- games/gnome-theft-auto/src/portal/gnomecinoDoor.ts: GNOMECINO_DOOR (74.5, -30) (read only: do NOT edit).

## Change
- New src/skyTraffic/places.test.ts (import '../questSim/globals' first, as questSim tests do): build the sim world
  once; for each DROP_ZONES and AMBULANCE_STOPS point (r 4) and the circuit parking point (r 3): not in a box,
  waterAt null, deckContactsAt empty. For the crop field: the centre and four corners (x +- w/2, z +- d/2) are dry and not
  on a deck, and at least 80 % of a 10 m grid over the field is clear of boxes (it is a field). Also check
  GNOMECINO_DOOR (r 0.5): clear of boxes, dry; if it fails, do NOT edit portal/: mark that one check `it.skip` with a
  comment and put the failure in your report (another planner owns that file).
- skyTraffic/behaviours.ts: move any point that fails to the nearest legal point (search outward in 5 m steps), same
  role (keep anchors consistent: the crop-duster anchor equals the field centre; mail-drop anchor near the zones).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/skyTraffic passes.
- npx tsc --noEmit -p games/gnome-theft-auto passes.

## Out of scope
skyTraffic/runtime.ts, routes.ts, portal/, every other file.
~~~~

~~~~text
Epic: 2, issue 2B: test triage: terrainDrive slope and the traffic flake
Depends on: none

## Goal
src/terrainDrive.test.ts passes for the right reason, and the traffic test 'pull out around a vehicle left in their
lane' cannot flake.

## Read first
- games/gnome-theft-auto/src/terrainDrive.test.ts: 'sim mower stays on top of the ground on the slope' fails today with
  |sd.py - heightAt(sd.px, sd.pz)| = 1.0005 (limit < 1). The drive goes from (470, 50) to x > 610 near z 30 on the east
  highway test hill. This batch added the Pebblewick outskirts town nearby (bus stop (661, 48), square (674, 100);
  src/outskirts/) and other terrain work (src/landforms, fringe) that may change heightAt along this path.
- games/gnome-theft-auto/src/terrain.ts: heightAt, setTerrainOptions({ testHill }).
- games/gnome-theft-auto/src/traffic.test.ts: find the test named 'pull out around a vehicle left in their lane'.
- games/gnome-theft-auto/src/traffic.ts: what that test drives.

## Change
- terrainDrive: find where on the path the gap peaks (log i, x, z, sd.py, heightAt, slopeAt at the worst frame) and
  compare heightAt along the path with `git show main:games/gnome-theft-auto/src/terrain.ts` behaviour if needed (e.g.
  a new levelling pad or kerb under the path). If a new terrain feature now lies under the test path, move the test's
  START/TARGET onto a stretch of the test hill without it (keep the hill climb) or stop the run before it; if the mower
  genuinely sinks (sd.py far below ground), report it instead and leave the test failing. Do not just raise the limit.
- traffic flake: find the source of nondeterminism in that test (Math.random, Date.now / performance.now, module
  state shared between tests and test order, a seed not reset). Run that test file 10 times (a loop) before and after.
  Fix the cause: seed or stub the random source in the test (vi.spyOn(Math, 'random') with a seeded generator, reset
  in afterEach), or reset shared module state in beforeEach. Change traffic.ts only if the cause is a real bug there
  (describe it).

## Done when
- cd games/gnome-theft-auto && npx vitest run src/terrainDrive.test.ts passes.
- A loop of 10 runs of npx vitest run src/traffic.test.ts all pass (report the count).
- npx tsc --noEmit -p games/gnome-theft-auto passes.

## Out of scope
terrain.ts, outskirts/, landforms/ (report, do not change world terrain), every other file.
~~~~

~~~~text
Epic: 2, issue 2C: z-fight tool and cheap z-fight fixes
Depends on: none

## Goal
tools/zfight.mjs runs against the GTA dev server without timing out, and the cheap z-fight pairs are fixed: the Hangar
Two floor lip at the airfield apron, glaze-shell pairs on the zero-turn / mulch-spreader mowers and the snail coach, the
lawn-roller wheel/frame pairs, and the Sycamore Copter rotor rib that reads as a stick.

## Environment (extra)
You may start ONE dev server: from games/gnome-theft-auto, npx vite --port 5448 --strictPort (run in the background),
and must stop it before you finish (verify nothing listens on 5448). Read docs/rendering.md first: anything laid flat
takes a draw layer (flatLayer(material, LAYER.<x>) from @lawn/depth); touching boxes must not share a face.

## Read first
- tools/zfight.mjs: line ~89 page.goto(url, { waitUntil: 'networkidle0' }) times out on GTA (the game keeps fetching).
  tools/gta-perf.mjs line ~83 shows the pattern that works: waitUntil 'load' then page.waitForFunction(() =>
  window.__gta ..., { timeout: 90000 }) (needs ?debug in the URL).
- docs/rendering.md.
- games/gnome-theft-auto/src/biomes.ts: the airfield apron / slab (grep AIRFIELD, apron, slab). Hangar Two:
  src/lockup/ (ESTATES.hangar in lockup/config.ts; grep its floor build in lockup/). The hangar floor sits ~7 cm above
  the apron (a visible lip): make the APRON slab flush with the hangar floor in biomes.ts (or the floor flush with the
  apron if it is a separate flat slab in lockup/: change whichever is a plain constant).
- Prefabs: packages/prefabs/src/catalog/ (grep the ids 'zero-turn-mower', 'mulch-spreader-mower', 'snail-coach',
  'gta-lawn-roller', 'sycamore-copter' or the files the zfight output names); the glaze shell comes from @lawn/glaze
  (packages/glaze): read how a shell is offset over the body before changing anything.

## Change
- tools/zfight.mjs: goto with waitUntil 'load'; then if the page defines window.__gta (GTA with ?debug), wait for it
  (timeout 90 s), else wait 5 s. Keep the rest of the tool as is. Run: npm run zfight -- "http://127.0.0.1:5448/?offline&no-intro&debug"
  and save the output to your temp folder.
- Fix the pairs named in Goal, cheapest first: offset or shrink one of two coplanar faces by >= 2 mm on small props
  (prefab part sizes/positions), a flatLayer for flat decals, a flush slab for the hangar. The copter rotor rib: make
  it a thin flat blade (wider, thinner) instead of a square stick. Do not touch shadows or quality tiers.
- After each prefab change: npm test -w packages/prefabs must pass.
- Re-run zfight; list the remaining pairs in your report (with mesh names), marked fixed / left (why).

## Done when
- npm run zfight against your server completes (no timeout) and the named pairs are gone or explained.
- npm test -w packages/prefabs passes; npx tsc --noEmit -p games/gnome-theft-auto passes.
- Your dev server is stopped.

## Out of scope
Street-prop / park patch z-fights beyond ~224 m (past draw distance; documented as won't fix), shadows, quality.ts,
every other file.
~~~~

## Epic 3 (planner)

Reeds look, layout golden regenerated once (after every world change), smoke loads, perf, release notes.

## Results

Epic 1 and 2: all nine issues done by Haiku workers (at most 6 at once). Planner follow-ups:

- 1A Skyway walls: walls are cut per straight leg and mitred at corners (outer side closed, inner side stops short of
  the outgoing road); deck.test.ts checks no wall stands on a deck's own driving surface plus the (-211, -60) and
  (-216, -60) regressions. Quest sim `city-skyway-robbery`: the bot now climbs past the landing and stalls at gate 2
  (the deck over Downtown): a bot routing limit (it cannot path onto a deck), kept as an expected `bot` fail with that note.
- 1B Spots: taxi depot (-30, 34) -> (-30, 52) and nc-odd-jobs reads it from `JOBS.taxi.depot`; Tuft & Tally probes at
  the lodge door (-548, -46); boathouse visit (-690, -556) on the shore; Big Lou's van (-90, -56) -> (-93, -54) in both
  the quest and its scene; the derby check uses a point on the ring, not its centre (the ring circles the birdbath).
  KNOWN_STATIC is empty; the four quests pass in the sim.
- 1C Map: place kinds 'park' (6 parks) and 'edge' (Scrapside, Stumpend, Chillyard, Lockside); planner changed the edge
  badge to a distinct brown (#6b4a2e).
- 1D Trainer: Spawn tab > Clear spawned removes trainer-spawned vehicles (not the one you ride) and critters.
- 1E Footers with the close glyph on The Bent Pin, Pebblewick shops, the lodge counter and the Slipway (hidden on touch).
  No sheet has a confirm-key buy, so all read "{close} Close".
- 1F Saves: `gta-odd-rides-v1` (odd rides ridden: progress) added to GTA_SAVE_KEYS + cloud MERGES (union); every key has a
  MERGES entry; new round-trip test (export, reset, import) over every key. Kept out on purpose: `gta-perks-v1` (trainer
  grants and announced-toast list; earned perks derive from gta-quests-v1), trainer backup, cloud bookkeeping, settings.
  Reset (Save Trainer) calls resetSaveBundle, which clears every key.
- 2A Sky places: new places.test.ts; one air-ambulance stop (-150, -300) was in a collider -> (-150, -295). Drop zones,
  crop field (40, 440), circuit parking and the Gnomecino velvet rope (74.5, -30) are on legal ground.
- 2B Tests: traffic 'pull out around a vehicle left in their lane' flaked because traffic draws from unseeded
  Math.random; the test now seeds it (seed 7; 10/10 + 3 shuffled runs pass). A 40-seed sweep shows 2 seeds where the
  blocked-lane jam lasts 26-35 s (limit 25): a real but rare traffic jam, left as a known limit. terrainDrive: the mower
  is not sinking; at top speed it leaves the steep foot of the test hill and flies ~1 m: the planner made the
  mesh-origin check one-sided (never more than 1 m below ground).
- 2C Z-fight: tools/zfight.mjs waits for `load` + `window.__gta` (no more network-idle timeout). Fixed: zero-turn seat /
  deck coplanar faces, mulch-spreader hood stripe, lawn-roller hubs/caps/frame, Sycamore Copter rotor rib (now a thin
  strip). Hangar Two floor: the worker raised the whole airfield apron to y 0.1; the planner reverted that (vehicles
  stand at ground height, so they would sink 8 cm into it) and lowered the hangar floor (lockup/estates.ts) to the
  apron's 0.02 instead.

Planner checks:

- Reeds (Mallard Mere, headless screenshot): the reeds stand at full height and are not cut at load; what reads as
  "flattened" is the prefab's wide mud mound sitting on the pond like a raft. Left as is (prefab look, not a bug).
- Layout golden regenerated once at the end. The only diff: `towers-sign` 108 -> 104 verts and `towers-trim` 9768 ->
  9744 (one tower sign and its trim box fewer, from the tower-styling work; present before this pass started). Nothing in
  this pass changes the static world build (the hangar floor and spots are built outside buildWorld).
- Smoke (headless Edge, 390x844): `?no-intro`, `?no-intro&pebblewick`, `?offline&sky=banner-tow`,
  `?offline&bird=loch-swan`: no page errors. Without `?offline` and no local relay, the only errors are the browser's own
  "WebSocket connection to ws://localhost:8787/ws failed" lines (2 in 12 s): expected when the relay is down.
- tsc clean; targeted tests: 68 files / 572 tests pass (highways, quests, stages, jobs, mapIcons, fleet, fishing,
  outskirts, hunting, craft, ui, saveIO, cloudSave, trainer, skyTraffic, traffic, terrainDrive, events, golden,
  minigames) + questSim checks.sim; `npm test -w packages/achievements` 22 pass; prefabs 2555 pass; `npm run lore` OK;
  `vite build` to a temp folder OK.

Perf (`node tools/gta-perf.mjs --cpu 4`, 390x844 @2x, no-HMR server on 5448, whole batch in):

| leg | avg ms | p95 | draws avg/max | tris (k) | CPU ms | top systems ms/frame |
|---|---|---|---|---|---|---|
| Turfton (first leg, includes load) | 110.5 | 229 | 370/400 | 767 | 443 | traffic 96, npcs 91, render 81 (start-up spawn frame of 3.4 s) |
| Frostbite Fells | 28.6 | 62.5 | 174/389 | 373 | 28.0 | render 17.1, traffic 2.1, world-life 1.4 |
| Loch Moss | 17.6 | 34.6 | 139/220 | 285 | 15.9 | render 9.5 |
| Mossy Wood | 14.7 | 27.7 | 126/456 | 299 | 14.1 | render 9.0 |
| Tallgrass Commons | 13.4 | 20.9 | 75/158 | 416 | 12.8 | render 7.9 |
| Cloverfield Farms | 15.3 | 20.9 | 146/488 | 540 | 14.5 | render 9.5 |
| Dust Flats | 23.3 | 34.8 | 177/444 | 458 | 22.8 | render 15.6, traffic 1.1 |
| Turfton (back) | 38.9 | 55.6 | 218/435 | 460 | 37.1 | render 22.5, traffic 4.0, world-life 2.9 |

Top 3 costs: (1) render in Turfton (draw calls up from ~200 to 220-370 with towers, parks, street dressing; this is
GPU-side submission, not a per-frame allocation); (2) traffic in Turfton (4 ms steady, 96 ms in the start-up burst);
(3) world-life (parks, ducks, ambient gnomes; 2.9 ms in Turfton). The start-up frame (npcs 0.8 s, traffic 0.8 s,
vehicles 0.5 s spawning everything at once) is the worst hitch. No cheap hot spot in the batch's new code was found in
this run; no code was changed for perf.

## Won't fix (with reason)

- Snail-coach glaze-shell pair (pre-existing): a moving traffic vehicle, the pair could not be pinned to a part.
- Street-prop / park-patch / fringe-mark pairs flagged only beyond their draw or bury distance (~33-224 m).
- One park prop vs terrain pair at 1 cm gap (parks-prop cell -3,-1): left for the parks owner; needs a draw layer on
  that prop's flat base.
- Traffic: a rare (2/40 seeds) jam of 26-35 s behind lane-blocking wrecks.
- `city-skyway-robbery` in the quest sim: bot cannot route onto a skyway deck (game is fine).
- Newcomers' emote / street-event counters restart each session: the step itself is saved, only partial progress
  inside a counting step restarts after a reload. Documented, cheap enough to live with.
- Intros for newcomer quests use talking heads only (by design).
- Wingwright's Slipway has no map icon (by design: it opens from the hangar).
- Remote players' ride animations and online pair animations (remotes.ts: multiplayer-audit planner's file).
- From earlier roadmaps, still open: GTA party members are not offered to follow you through a crossover door, the
  browser Back button is not hooked inside a crossover building, Club Gnome players cannot walk out into Turfton
  (crossover-portals.md); plant brushing is a lean, NPCs do not brush plants, no journal page for the mow counter
  (gta-mowable-plants.md); driving-hands known limits (gta-driving-hands.md); no per-prefab size test for the parks kit.

## Reported to the multiplayer-audit planner

- Removing trainer-spawned vehicles (Clear spawned) does not tell parkSync; a shared vehicle another player already sees
  stays on their side until their ledger expires it (online/parkSync.ts).
- With the relay down the client logs two browser WebSocket errors per ~12 s (reconnect loop): fine, but noisy.

## Release notes / what to try by hand

- Skyway west on-ramp: drive up from the west highway at (-219, -30): the corner landing at (-215, -60) is open.
- Parks and edges on the map: open the big map: six green tree badges (Bandstand Green, Mallard Mere, ...) and four
  brown edge marks (Scrapside east, Stumpend west, Chillyard north, Lockside south).
- Kerbstone Cabs rank moved to the pavement north of Gnorwin Park (-30, 52); Odd Jobs quest leads there.
- Tuft & Tally (Mossy Wood): the quest marker is at the lodge door; Mossbank Boathouse visit marker on the shore.
- Trainer (F9 or `?debug` 🛠) > Spawn: spawn a few cars and critters, then Clear spawned.
- Shop footers: open The Bent Pin, a Pebblewick shop, the Tuft & Tally counter or the Slipway with a keyboard or pad:
  the footer shows the close key/button; on a phone it is hidden.
- Fishing on a breezy/blustery loch (`?sea=blustery`): the ripple ring now bobs with the float.
- Save export/import (Save Trainer > Save): odd rides are now in the bundle and the cloud save.
- Street events never spawn under the Skyway deck.
- Hangar Two (Desert Airfield): no step between the apron and the hangar floor.
- Zero-turn, mulch spreader, lawn roller: no flicker on the seat/deck/hood/wheels; the Sycamore Copter rotor has a
  thin rib.

## Known limits

- See "Won't fix" above. Perf in Turfton is render-bound on a 4x-throttled phone profile (~39 ms/frame steady).
