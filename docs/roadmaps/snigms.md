# Snigms: a gnome life sim

Question the prototype answers: is it fun to build a little house wall by wall, furnish it, and keep one gnome's needs met while they hold down a job?

Inspired by The Sims. One gnome per household for now. Single-player, saved in localStorage. Three.js, 3/4 top-down camera, 24 x 18 tile lot.

Online: not planned (a one-gnome life sim has nothing to sync yet; a later "visit a neighbour's house" could use `@lawn/mp`). Party slice: backlog row, "later". Mobile: touch for everything, see Common.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (written by the planner, already in the branch) | `npm run build -w games/snigms` passes with stub modules | scaffold, `src/types.ts`, `src/config.ts`, stubs of every module, `src/main.ts`, `src/save.ts` |
| 2 Build it | each module filled; build, tests, smoke pass | 2A prefabs + furniture test, 2B world, 2C sim + actions, 2D brain, 2E view, 2F tools, 2G ui, 2H create + audio, 2I docs + lore, 2J achievements |

No dependency inside epic 2: every worker owns files nobody else touches and codes against the stub signatures already in `games/snigms/src/`.

## File ownership (epic 2)

| Issue | Owns (may edit) |
|---|---|
| 2A | `packages/prefabs/src/catalog/snigms.ts` (new), `packages/prefabs/src/catalog/index.ts`, `games/snigms/src/furniture.test.ts` (new), the `w`/`d` numbers of `FURNITURE` in `games/snigms/src/config.ts` |
| 2B | `games/snigms/src/world.ts`, `world.test.ts` (new) |
| 2C | `games/snigms/src/sim.ts`, `actions.ts`, `sim.test.ts`, `actions.test.ts` (new) |
| 2D | `games/snigms/src/brain.ts`, `brain.test.ts` (new) |
| 2E | `games/snigms/src/view.ts` (and new files `view-*.ts`) |
| 2F | `games/snigms/src/tools.ts` |
| 2G | `games/snigms/src/ui.ts` (and new files `ui-*.ts`) |
| 2H | `games/snigms/src/create.ts`, `audio.ts` |
| 2I | `games/snigms/README.md` (new), `AGENT_INDEX.md`, `docs/lore/settings.md`, `docs/lore/entries/...` (new), `packages/party/README.md` |
| 2J | `games/snigms/src/achievements.ts`, `games/snigms/src/main.ts`, `packages/achievements/src/catalog.ts` |

## Common (every issue starts with this)

~~~~text
## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\hydroid (a git worktree; stay in it). Use Git Bash or PowerShell.
- If `node` is not found in Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` is already done.
- Other workers are editing OTHER files in games/snigms/src at the same moment. Edit only the files your issue owns. Do not run `npm run build`, `vite`, `npm run dev` or any server (they write dist/ or open ports). Do not commit, push or open PRs.
- Check types of the whole game with: `npx tsc --noEmit -p games/snigms`. Other workers' files are stubs or mid-edit: only errors in YOUR files matter. If an error in your file comes from another file's signature, the signature in the stub is the contract: do not change it, adapt your code.
- Run only your own tests: `npm test -w games/snigms -- src/<yourfile>.test.ts` (vitest). Tests must be pure (no DOM, no WebGL) unless your issue says otherwise.
- Repo rules: free assets only (generate everything in code, no downloads). Do not edit any game other than games/snigms. No emoji in code comments.

## What Snigms is
A gnome life sim. The player makes a household (one gnome), builds walls by dragging on a tile grid, buys furniture for a bedroom, bathroom, kitchen and living room, and the gnome looks after its own needs (hunger, energy, bladder, hygiene, fun) using that furniture and goes to a job (gardener, mailgnome, mushroom chef, mower mechanic) for acorns (money) to buy more.

## Read first (all issues)
- games/snigms/src/types.ts: every shared type. Coordinates: x east, z south, y up; tile (tx, ty) covers x in [tx, tx+1], z in [ty, ty+1]; edge keys 'h:x,y' / 'v:x,y' sit between grid vertices; rot 0 faces +z.
- games/snigms/src/config.ts: all tuning numbers and tables (FURNITURE, JOBS, TRAITS, SPEEDS, costs). Read values from it; never hard-code them.
- The stub for your own file(s) in games/snigms/src/: its exported signatures are FINAL. Keep every export name, parameter list and return type; replace the bodies. Keep the doc comments' meaning (they are the spec); you may add exports and helpers.
- games/snigms/src/main.ts: how everything is wired (read only, unless you own it).

## Done (every issue)
- `npx tsc --noEmit -p games/snigms` shows no error in your files.
- Your own tests pass (if your issue has them).
- Reply with: files changed, what is done, what is not, any contract you had to interpret.
~~~~

## Issues

### 2A prefabs + furniture test

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
Six new furniture prefabs exist (toilet, sink, bathtub, shower, stove, tv) so every FURNITURE entry in games/snigms/src/config.ts has a real prefab, and a test proves each prefab fits its footprint.

## Read first
- packages/prefabs/README.md ("Add a prefab") and docs/roadmaps/prefab-library/_common.md (format, examine voice, checks).
- packages/prefabs/src/catalog/furniture.ts: look at 'armchair' and 'bed' for exact PrefabDef style (parts, tint/trim, examine). Furniture is room-sized, so the "gnome-sized" size limits for hand items do not apply; the existing test treats furniture accordingly (check packages/prefabs/src/catalog.test.ts).
- packages/prefabs/src/catalog/tribute-schedule.ts: 'fridge' and 'couch' are defined there (used by Snigms as they are).
- packages/prefabs/src/catalog/index.ts: where catalog arrays are registered.

## Change
- packages/prefabs/src/catalog/snigms.ts (new): `export const SNIGMS: PrefabDef[]` with ids exactly: `toilet` (also uses 'sit' and a `seat`), `sink`, `bathtub`, `shower`, `stove`, `tv`. category 'furniture', uses ['place'] (plus 'sit' for toilet), tags include the id and 'snigms' and 'bathroom'/'kitchen'/'living' as fits, emoji [] (do not claim an emoji another prefab uses). Chunky primitive style like the others, gnome-made from garden scraps (a bathtub from a plant saucer, a telly from a seed-packet frame). Front faces +z. Footprints at scale 1 must fit inside: toilet 0.7 x 0.8, sink 0.7 x 0.6 (counter-height pedestal basin with a tap), bathtub 0.95 x 1.9, shower 0.9 x 0.9 and 1.9 tall (tray, glass-ish panels with 'glass' colour parts, a head and pipe), stove 0.9 x 0.8 with 0.9 height (hob with 4 burner rings, oven door, knobs; glow:true embers allowed), tv 0.8 x 0.5 (box set on a stand, a bright screen part with glow:true). Each has `about` and 6 examine lines in the voice of furniture.ts (max 160 chars each).
- packages/prefabs/src/catalog/index.ts: import SNIGMS and add `...SNIGMS` to CATALOG. That is the only edit there.
- games/snigms/src/furniture.test.ts (new, pure vitest): for every FURNITURE entry in config.ts assert `getPrefab(def.prefab)` exists (import from '@lawn/prefabs'), and that `buildPrefab(def.prefab)` bounding box (THREE.Box3.setFromObject) is at most def.w + 0.15 wide and def.d + 0.15 deep (skip the 'rug' entry for the upper bound, but it must be at least 1 wide). Also assert every entry with `use` has a use.rates with at least one positive rate, and that every key equals its entry's `kind`.
- games/snigms/src/config.ts: if furniture.test.ts reports an existing prefab (couch, fridge, bed, counter...) that does not fit its w x d, change ONLY that entry's `w`/`d` numbers (whole tiles, rot 0, w across x, d along z). Tell me which you changed.

## Contract
Prefab ids above are the ones config.ts already references. Do not rename them.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w games/snigms -- src/furniture.test.ts` passes.
- `npx tsc --noEmit -p games/snigms` shows no error in your files.

## Out of scope
Every other file in games/snigms/src, other catalog files, the gnome package.
~~~~

### 2B world

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/world.ts holds the real lot logic (edges, furniture placement, paths, rooms, the starter house), with tests.

## Read first
- games/snigms/src/world.ts: the stub; every doc comment is the spec.
- games/snigms/src/types.ts (Lot, PlacedItem, EdgeKey, Room, Rot) and the FURNITURE table in config.ts.

## Change
- games/snigms/src/world.ts: implement every stub body. Details:
  - Tile (tx, ty) edges: north 'h:tx,ty', south 'h:tx,ty+1', west 'v:tx,ty', east 'v:tx+1,ty'. Dir 0 north, 1 east, 2 south, 3 west.
  - edgeInBounds: 'h:x,y' needs 0<=x<lot.w and 0<=y<=lot.h; 'v:x,y' needs 0<=x<=lot.w and 0<=y<lot.h.
  - edgesBetween(a, b): along the longer of |dx|,|dy| (tie: horizontal) from a toward b, one key per unit step, in order from a. Same vertex: [].
  - setEdges: writes lot.edges[key] = kind or deletes it (null); returns the number of keys whose value actually changed; skips out-of-bounds keys.
  - itemSize/itemTiles/itemCenter use FURNITURE[kind] from config.ts and the item's rot (rot 1 and 3 swap w and d). Unknown kind: treat as 1x1.
  - canPlace/placeItem/moveItem/removeItem/itemAt as documented. Solid items may not overlap each other or leave the lot; a flat item (def.flat) may sit under a solid item but not on another flat item. A solid item is refused if a wall or window edge runs through its footprint (an edge between two tiles of the same footprint); touching walls on its outside is fine. placeItem assigns id = lot.nextId++. moveItem re-checks with ignoreId.
  - isWalkable(tile): in bounds and not covered by a solid item.
  - findPath: A* (Manhattan heuristic), 4 neighbours, a step is allowed if the target tile isWalkable and edgeBlocks is false for the crossed edge. The start tile is always allowed even if not walkable. allowGoalSolid lets the goal be a solid tile. Returns tiles from `from` to `to` inclusive, or null.
  - approachTile: item's front direction from rot (rot 0 south, 1 west, 2 north, 3 east). Candidates, in order: the walkable tiles directly in front of the footprint (nearest the footprint centre first), then any other walkable tile adjacent to the footprint; skip a candidate if a wall/window edge lies between it and the footprint.
  - detectRooms: label connected regions of tiles (neighbours join unless edgeBlocks; doors join). A region is enclosed=false when any of its tiles has an unblocked lot-border edge (north of ty=0, south of ty=h-1, west of tx=0, east of tx=w-1). Return every region (outside included, enclosed false). roomKind per the doc comment (counts of FURNITURE[kind].counts).
  - lotValue: sum of FURNITURE price of items.
  - starterLot(): a lot (newLot()) with a cottage: outer walls around tiles x 8..15, y 6..11 (vertex rectangle (8,6)-(16,12)); a door on the south wall at 'h:11,12'; a window at 'h:13,6' and at 'v:16,8'; an interior wall on 'v:12,y' for y 6..9 and a door at 'v:12,10' (splits a narrow west room from the main room); wood floor on every interior tile (floors['tx,ty'] = 'wood'), tile floor for the narrow west room (x 8..11). Nothing else.
- games/snigms/src/world.test.ts (new): tests for edgesBetween (both axes, diagonal snap, reverse), setEdges counts, canPlace (overlap, bounds, flat vs solid, wall through a bed), findPath (around a wall, through a door, blocked by a window, unreachable returns null), approachTile (front tile and the boxed-in case), detectRooms (a closed 4x3 box is enclosed with kind from its furniture; one open gap makes it not enclosed; a door keeps two rooms joined), starterLot (two enclosed regions joined by the interior door; a path exists from carpoolTile to a tile inside through 'h:11,12').

## Contract
All exported names and signatures in world.ts stay exactly as in the stub (Tile, Vertex, Dir too). world.ts imports only from ./config and ./types.

## Done when
- `npm test -w games/snigms -- src/world.test.ts` passes.
- `npx tsc --noEmit -p games/snigms` shows no error in world.ts or world.test.ts.

## Out of scope
Everything except world.ts and world.test.ts.
~~~~

### 2C sim + actions

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/sim.ts (needs, mood, clock, bills, jobs, save sanitising) and games/snigms/src/actions.ts (buying, selling, building with acorns) work, with tests.

## Read first
- games/snigms/src/sim.ts and actions.ts: the stubs; doc comments are the spec.
- games/snigms/src/config.ts: DECAY, TRAITS, NEEDS, ACT_BELOW, CRITICAL, MOOD_WEIGHT, BILLS_PER_DAY, WORK_NEED_RATE, COST, SELL_RATIO, START_FUNDS, JOBS, GOOD_SHIFT_MOOD, FURNITURE.
- games/snigms/src/types.ts; games/snigms/src/world.ts (other worker is filling it; use only these exports: newLot, starterLot, edgeInBounds, setEdges, canPlace, placeItem, removeItem, moveItem, itemTiles). Do not edit world.ts.

## Change
- games/snigms/src/sim.ts, bodies:
  - newHousehold: funds START_FUNDS[o.lot]; lot starterLot() when o.lot === 'starter' else newLot(); needs all 80; clock 7*60.
  - moodOf: weighted mean of needs with MOOD_WEIGHT, minus 8 for every need under CRITICAL, clamped 0..100, rounded to 1 decimal.
  - decayNeeds / applyUse / pickNeed as the doc comments say (traits multiply DECAY per need, default 1).
  - advance(h, simMinutes, using): always decayNeeds first (atWork = gnome.workUntil !== null and clock < workUntil, evaluated at the start), then if `using` applyUse. While at work add to gnome.shiftMood: sum += mood * simMinutes, n += simMinutes. Then move the clock. For each midnight crossed charge BILLS_PER_DAY: funds -= amount, push {type:'bills', amount, paid: fundsBefore >= amount}; and push {type:'newDay', day}. Handle several days in one call (a big simMinutes).
  - isWorkDay: JOBS[job].workdays includes dayOfWeek(clock); false with no job. shiftDue per its doc (window startHour*60 .. +60). startShift/finishShift per docs: pay = round(level.pay * (0.5 + 0.5 * meanMood/100) * (TRAITS[trait].pay ?? 1)) where meanMood = shiftMood.sum / max(1, shiftMood.n); good = meanMood >= GOOD_SHIFT_MOOD; a good shift counts (shifts += 1) and promotes when shifts >= shiftsToPromote and a next level exists (jobLevel += 1, shifts = 0); a bad shift pays but does not count. finishShift adds the pay to h.funds, sets workUntil null, resets shiftMood, and returns the event with the title of the (new) level.
  - sanitize: accept only an object with version 1, a string name, numeric funds/clock, a gnome object and a lot object; clamp needs to 0..100, drop edges with a kind not in wall/door/window, drop items whose kind is not in FURNITURE, fix nextId to max(id)+1, default missing fields. Return null for anything else.
- games/snigms/src/actions.ts, bodies, per its header comment. Use world.ts functions. Raise app.event('first-wall') the first time the lot gains a wall edge from none, app.event('first-furniture') when buying the first item on a lot with no items, app.event('spent-big') when one purchase costs >= 150. Every success: app.sfx ('place' item, 'wall' edges, 'sell', 'coin' refund...), then app.lotChanged() (lot edits) ; refusals: app.toast('Not enough acorns') / 'Cannot place there', app.sfx('deny'), return null/false/0.
- games/snigms/src/sim.test.ts and games/snigms/src/actions.test.ts (new): cover decay with traits, use, advance across midnight (bills, newDay, two days), shift start/end/pay/promotion/bad shift, sanitize good and bad input, and each action's happy path and refusals (a hand-made fake App object with vi.fn callbacks).

## Contract
Exports and signatures in sim.ts and actions.ts stay exactly as in the stubs (SimEvent too). sim.ts never imports DOM or three.

## Done when
- `npm test -w games/snigms -- src/sim.test.ts src/actions.test.ts` passes (the world.ts functions you call may still be stubs if the other worker has not landed: if so, run once more at the end; if world.ts is still a stub, state that in your reply).
- `npx tsc --noEmit -p games/snigms` shows no error in your files.

## Out of scope
world.ts, config.ts, types.ts and every other file.
~~~~

### 2D brain

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/brain.ts: the gnome looks after itself. It picks its lowest need, walks to the furniture that fixes it, uses it, goes to work on work days, comes home paid, wanders when content.

## Read first
- games/snigms/src/brain.ts (stub, the Brain interface is final) and types.ts (App, GnomePuppet, UseDef, Pose).
- games/snigms/src/sim.ts (stub, another worker fills it; use these exports: advance, pickNeed, shiftDue, startShift, endShiftDue, finishShift, moodOf, SimEvent) and games/snigms/src/world.ts (stub, another worker fills it; use: findPath, approachTile, itemCenter, facingYaw, carpoolTile, isWalkable, Tile). Their doc comments are the contracts. Do not edit them.
- games/snigms/src/config.ts: FURNITURE, WALK_SPEED, SPEEDS, ACT_BELOW, NEED_LABEL.

## Change
- games/snigms/src/brain.ts: `createBrain(app, puppet)`. State machine (BrainState): idle, walking, using, working. Rules:
  - The gnome starts on a walkable tile near the lot centre; puppet.setPosition/setFacing/setPose('stand').
  - Every update(dt, simMinutes): if the gnome is at work (h.gnome.workUntil !== null): state 'working', puppet hidden, call advance(h, simMinutes, null); if endShiftDue: result = finishShift(h); toast `Back from work: +N acorns` (add ` Promoted to <title>!` when promoted, and app.event('promoted')); app.sfx('coin'); puppet visible at carpoolTile; app.stateChanged(). First ever shift: app.event('first-shift').
  - Otherwise: if shiftDue(h): walk to carpoolTile (activity 'Heading to work'); on arrival startShift, hide puppet, activity 'At work'. This beats needs.
  - Else when idle: n = pickNeed; find the reachable FURNITURE item whose use.rates[n] > 0, affordable (use.cost <= funds), with the shortest findPath from the gnome's tile to approachTile; walk there, then use it. Nothing available: toast once per need per sim day ('Need a toilet!' / 'So hungry... a fridge would help' — write one short line per need) and wander.
  - Wandering when idle and nothing needed: every 4 to 8 real seconds pick a random walkable tile within 5 tiles and walk to it. activity 'Hanging around'.
  - Walking: move along the path at WALK_SPEED tiles per real second, multiplied by max(1, (simMinutes / dt) / SPEEDS[1]) so fast-forward walks faster (only when dt > 0). Face the travel direction (yaw = Math.atan2(dx, dz)). pose 'walk'. While walking call advance(h, simMinutes, null).
  - Using: at 'on' items stand at itemCenter(item) with facingYaw(item.rot); at 'front' items stand on the approach tile centre facing the item (yaw = facingYaw(rot) + Math.PI). puppet.setPose(use.pose). Charge use.cost on arrival (if it can no longer be afforded, abort with toast). Each update call advance(h, simMinutes, use). Stop when elapsed sim minutes >= use.maxMinutes or every need with a positive rate is >= 95. Play app.sfx(use.sfx) on start. app.event('first-bath') when action is 'bath'. After a bed (action 'sleep') the gnome stays until energy >= 95 or maxMinutes. Afterwards put the gnome on a walkable tile (the approach tile) and pose 'stand'.
  - commandUse(itemId): like choosing that item now (cancel what is happening unless working or using a bed with energy < 20; toast 'Busy' then). Items without `use`: toast `${def.name} does nothing yet`.
  - replan(): if walking, recompute the path to the target; if the target item is gone or unreachable, stop and idle; if using an item that was removed, stand on the nearest walkable tile.
  - app.activity is updated every state change ('Walking to the toilet', use.verb, 'Heading to work', 'At work', 'Hanging around'). Handle SimEvents: 'bills' -> toast `Bills: -N acorns` (+ ' (can't pay!)' when !paid); 'newDay' -> nothing. Call app.stateChanged() when funds change.
  - Call puppet.update(dt) every frame.
- games/snigms/src/brain.test.ts (new, pure vitest, fake puppet and a fake App): a household with a fridge and the gnome's hunger at 10 gets hunger above 50 after enough simulated seconds of update(0.1, 0.2); a bed fixes energy; no toilet -> toast; a job with shiftDue walks to the carpool tile and ends the shift paid. These tests need world.ts and sim.ts implemented by other workers: write them against the documented behaviour; if the stubs are still stubs when you finish, say the tests could not run.

## Contract
`createBrain`, `Brain`, `BrainState` exactly as in the stub. brain.ts imports only ./config, ./types, ./sim, ./world (no three, no DOM).

## Done when
- `npx tsc --noEmit -p games/snigms` shows no error in brain.ts or brain.test.ts.
- `npm test -w games/snigms -- src/brain.test.ts` passes if world.ts and sim.ts are already implemented; otherwise say so (the planner re-runs it at the end of the epic).

## Out of scope
Every other file.
~~~~

### 2E view

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/view.ts renders the lot in 3D: grass, floors, walls with doors and windows, furniture prefabs, the player's gnome, a tilted orbiting camera, ghosts for building, picking from the pointer.

## Read first
- games/snigms/src/view.ts (stub; View, Ghost and createView are final) and types.ts (Lot, EdgeKey, GnomePuppet, Pose, WallsMode).
- games/snigms/src/config.ts: LOT_W, LOT_H, WALL_HEIGHT, WALL_THICK, FLOOR_COLOR, FURNITURE.
- games/snigms/src/world.ts: use only parseEdge, itemSize, itemCenter, facingYaw, carpoolTile (stub now, another worker implements it; their doc comments are the contract).
- packages/prefabs/README.md (buildPrefab, `lights`), packages/gnome/README.md and packages/gnome/src/model.ts (createGnomeModel(look), createGnome(), GnomeModel.update(PlayerState, dt)).
- games/giant-pup/src/scene.ts for a three scene in this repo's style (renderer, shadows, lights).

## Change
- games/snigms/src/view.ts (you may add view-*.ts helper files):
  - Renderer on the canvas (antialias, pixel ratio <= 2, soft shadows), sky colour background, camera PerspectiveCamera(40). Orbit camera: target point (starts at the lot centre), yaw, fixed pitch about 52 degrees, distance default 24 (clamp 8..45). pan(dxPx, dyPx) moves the target along the camera's ground-projected right and forward axes so the world follows the pointer (scale by distance / canvas height); clamp the target to within 4 tiles of the lot. zoom(f) multiplies distance; orbit(d) adds to yaw.
  - Ground: a big lawn plane (colour of FLOOR_COLOR.lawn, extends well past the lot), faint grid lines over the lot (LineSegments), no per-frame allocations.
  - setLot(lot): rebuild a `lotGroup` (dispose old geometry and materials you created; NEVER dispose prefab meshes, drop them: see the prefabs README) with: floor tiles painted by lot.floors (one merged or instanced mesh per FloorKind, slightly above the lawn); walls: for every edge a box along the edge, length 1 + WALL_THICK (so corners meet), thickness WALL_THICK, height per wall mode; 'door' edges: two short posts and a lintel with a clear opening about 0.8 wide and 1.3 high; 'window' edges: a sill, a lintel and a see-through pane (alpha 0.35). Furniture: for each lot.items buildPrefab(def.prefab, { tint: def.tint, lights: false }) positioned at itemCenter(item) with rotation.y = facingYaw(item.rot); name the root's userData.itemId = item.id (put it on every mesh too so raycasts can find it); items cast shadows. A carpool stop at carpoolTile: a flat coloured plate plus buildPrefab('mailbox').
  - setWalls(mode): 'up' all walls WALL_HEIGHT; 'down' all walls 0.25 high; 'cut' a wall drops to 0.25 high when it lies between the camera and the camera target (dot of (wallMidpoint - target) with the horizontal direction toward the camera > 0.5), re-evaluated on orbit and when the mode changes (rebuild scale only, do not rebuild geometry: scale the wall meshes' y).
  - setDaylight(minuteOfDay): hemisphere/ambient + a directional sun whose colour, intensity and direction follow the hour (warm at 6-8 and 17-19, bright white midday, dim blue night); sky/background colour matches. Cheap, no shadow map resize.
  - setGhost(g): green (valid) or red translucent preview. 'edges': a thin translucent box per edge key (colour by kind: wall, door, window; 'erase' red). 'item': the item's prefab plus a translucent footprint plate under it (itemSize at rot). 'tiles': a translucent plate per tile. null clears. Reuse meshes where you can.
  - setSelected(id): a yellow ring or plate around that item's footprint.
  - pickGround/pickTile/pickVertex/pickItem: raycast from client pixel coordinates (use canvas.getBoundingClientRect). pickTile returns null off the lot; pickVertex rounds the ground point to the nearest vertex and returns null only when more than 1 tile outside the lot (clamp inside otherwise); pickItem raycasts the items group and reads userData.itemId.
  - gnome: GnomePuppet. Model from createGnomeModel(getMyGnome()?.look) when the player made a gnome (import getMyGnome from '@lawn/gnome'), else createGnome(). Add its `object` to the scene; shadows on. setPosition/setFacing move/rotate it (facing yaw 0 = +z). setPose: 'walk' animates the limbs (use GnomeModel.update with a PlayerState whose velocity is non-zero and grounded true; read model.ts to see how it swings), 'stand' idle, 'sit' (PlayerState.sitting = true, lower the body to a seat height of about 0.3), 'lie' (rotate the rig about x so it lies on its back, body at about 0.45 high, head toward -z), 'bathe' (lowered, only the upper half visible: lower the whole model by 0.4 and add a pale blue translucent disc of bubbles), 'cook' (stand, arms swing slowly). setVisible hides it for work. update(dt) animates.
  - resize(): set the renderer size from canvas.clientWidth/Height (pixel ratio aware), update the camera aspect (on portrait phones widen the FOV so the lot still fits). render(dt) updates the camera from target/yaw/distance and renders.
  - Console must stay clean (no WebGL errors, no unhandled promise errors).

## Contract
Exports `createView`, `View` and `Ghost` exactly as in the stub (the View interface already includes pickGround). view.ts may import three, @lawn/gnome, @lawn/prefabs, ./config, ./types, ./world.

## Done when
- `npx tsc --noEmit -p games/snigms` shows no error in your files.
- You cannot run the game (no servers); re-read your code for per-frame allocations and for disposal of what you create. Say what you could not check visually.

## Out of scope
Every other file.
~~~~

### 2F tools

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/tools.ts turns pointer, touch and keyboard input into camera moves, wall dragging, door and window placing, floor painting, furniture placing, moving and selling, and live-mode clicks.

## Read first
- games/snigms/src/tools.ts (stub, `createTools` is final), types.ts (App, Mode, ToolState, Tool), view.ts (the View interface and Ghost: another worker fills the bodies; code against the doc comments), brain.ts (Brain.commandUse), actions.ts (buyItem, sellItem, relocateItem, buildEdges, paintFloor: another worker fills them), world.ts (edgesBetween, edgeKey, canPlace, itemSize, itemAt, Tile; another worker fills them).
- games/snigms/src/config.ts: FURNITURE, COST.

## Change
- games/snigms/src/tools.ts: `createTools(app, view, brain, canvas)` registers pointer events on the canvas (pointerdown/move/up/cancel, wheel, contextmenu prevented) and keydown/keyup on window (ignore keys while an input or textarea has focus). Behaviours:
  - Camera: mouse wheel zooms (view.zoom(1.1 or 1/1.1)); right or middle mouse drag pans (view.pan); Shift + right drag, or the Q and E keys, orbit (view.orbit); WASD and arrow keys pan smoothly in update(dt); + and - zoom. Two fingers on touch: pinch zooms, moving both pans, twisting orbits. A second finger arriving cancels any one-finger drag in progress and clears the ghost. In mode 'live', and when tool is 'select', a one-finger drag on empty ground also pans.
  - mode 'live': a tap (down and up within 8 px, under 400 ms) on an item (view.pickItem) calls brain.commandUse(id); nothing else.
  - mode 'build', tool 'wall': pointerdown takes the vertex view.pickVertex; while dragging, ghost = { type: 'edges', keys: edgesBetween(start, current), kind: 'wall', valid: funds >= COST.wall * count }; on pointerup call buildEdges(app, keys, 'wall') and clear the ghost. Tool 'door' and 'window': a tap/click on the edge nearest the pointer (use view.pickGround: candidates 'h:floor(x),round(z)' and 'v:round(x),floor(z)', choose the nearer by distance to the point; ghost on hover) calls buildEdges(app, [key], 'door' | 'window'). Tool 'erase' (in build and furnish): pointerdown on an item (view.pickItem !== null) -> sellItem(app, id); otherwise drag edges like the wall tool with ghost kind 'erase' and buildEdges(app, keys, null) on release. Tool 'floor': dragging collects the distinct tiles under the pointer, ghost = { type: 'tiles' ... }, on release paintFloor(app, tiles, app.tool.floor).
  - mode 'furnish', tool 'place' (app.tool.kind is a FURNITURE key): ghost = { type: 'item', kind, tx, ty, rot: app.tool.rot, valid: canPlace(...) } follows the pointer (mouse hover; on touch it follows the finger while down). The footprint is centred on the pointer tile: tx = tile.tx - Math.floor(size.w / 2), ty = tile.ty - Math.floor(size.d / 2) with size = itemSize(def, rot). On pointerup (touch) or click (mouse) call buyItem(app, kind, tx, ty, rot); the tool stays 'place' so the player can keep buying. Escape or right click (without drag) sets app.tool.tool = 'select' and clears the ghost.
  - mode 'furnish', tool 'select': tap an item sets app.selected = its id (empty ground clears it); dragging a selected item shows an item ghost and on release calls relocateItem(app, id, tx, ty, rot); Keys: R turns the selected item (relocateItem with rot+1 mod 4, same tile) or, with the 'place' tool, app.tool.rot = (rot + 1) % 4; Delete or Backspace sells the selected item; Escape deselects. When app.mode or app.tool changes (poll app.mode/app.tool.tool/app.tool.kind in update) clear the ghost.
  - Always pointer capture on the canvas for drags; use the `touch-action: none` the page already sets. Mouse position is remembered for hover ghosts. No allocations in per-move paths beyond the ghost key arrays.

## Contract
`createTools` and `Tools` exactly as in the stub. tools.ts imports only ./config, ./types, ./world, ./actions and the types of ./view and ./brain.

## Done when
- `npx tsc --noEmit -p games/snigms` shows no error in tools.ts.
- State in your reply which behaviours you could not run.

## Out of scope
Every other file (the toolbar buttons are another worker's ui.ts).
~~~~

### 2G ui

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
games/snigms/src/ui.ts: the on-screen HUD for desktop and phone: clock, speed, funds, the gnome's mood and five need bars, mode tabs, build and furniture panels, selected-item card, careers panel, toasts.

## Read first
- games/snigms/src/ui.ts (stub; `createUi` and `Ui` are final), types.ts (App, Mode, Tool, ToolState, FurnitureRoom), config.ts (FURNITURE, FURNITURE_TABS, FLOORS, FLOOR_COLOR, NEEDS, NEED_LABEL, NEED_ICON, JOBS, JOB_IDS, TRAITS, COST, SELL_RATIO).
- games/snigms/src/sim.ts (stub; another worker fills it; use: moodOf, formatClock, dayOfWeek, setJob), actions.ts (sellItem, relocateItem), world.ts (detectRooms, lotValue, itemSize).
- packages/prefabs/README.md: `prefabIconElement(id, '🪑', 40)` gives the furniture icon (call prewarmPrefabIcons for the catalogue ids once, idle).
- games/giant-pup/src/ui.ts for how a DOM HUD is built in this repo (own container appended to #ui, inline styles / injected <style>).

## Change
- games/snigms/src/ui.ts (you may add ui-*.ts helpers): `createUi(root, app, hooks)` appends ONE container (id `snigms-ui`, pointer-events none, children pointer-events auto) to `root`; never restyle or hide `root`. It mutates `app` directly for its buttons (app.mode, app.speed, app.tool, app.selected, app.walls), calls the helpers above (setJob, sellItem, relocateItem) and then app.stateChanged() / app.lotChanged() as appropriate. Only `hooks.newGame()` is external.
  - Top bar: household name, `formatClock(app.h.clock)`, funds `🌰 N` (red when negative), speed buttons Pause / 1x / 2x / 3x setting app.speed 0..3, a menu button with "New household" (confirm dialog) calling hooks.newGame().
  - Gnome card (top-left, collapsible on small screens): gnome name and trait, mood face emoji and bar from moodOf, five need bars (icon, label, fill coloured red under CRITICAL, amber under ACT_BELOW, else green), `app.activity` line, job line (title, shifts to next rank) or 'Unemployed'.
  - Bottom bar mode tabs Live | Build | Furnish setting app.mode (also reset app.tool to { tool: 'select', ... } and app.selected = null).
  - Build mode toolbar: Wall, Door, Window, Floor, Erase (each sets app.tool.tool; show the cost from COST), a row of floor swatches (FLOORS, FLOOR_COLOR) when Floor is active, and a walls-view button cycling app.walls up / cut / down.
  - Furnish mode: catalogue tabs from FURNITURE_TABS, a scrollable row/grid of cards (prefabIconElement for FURNITURE[kind].prefab, name, price, greyed out when funds < price); tapping a card sets app.tool = { tool: 'place', kind, floor: app.tool.floor, rot: app.tool.rot }; a Rotate button (rot + 1 mod 4); an Erase tool button; a "House" line: lotValue and the kinds of enclosed rooms from detectRooms (for example '2 rooms: bedroom, kitchen').
  - Selected-item card (when app.selected !== null, furnish mode): name, what it does (use.verb and the needs it raises), buttons Rotate (relocateItem rot+1) and Sell (+N acorns).
  - Live mode: a Careers button opens a panel: the four JOBS (name, blurb, start hour and length, work days as Mon..Sun, the three rank titles with pay), buttons Take job / Quit (setJob + app.stateChanged()); the current job highlighted with progress.
  - toast(msg): stacked at top centre, fade after 3 s, max 3 at once.
  - Touch and phones: every button at least 44 x 44 px, no hover-only UI, respect env(safe-area-inset-*), layout works at 390x844 portrait and 844x390 landscape (panels dock at the bottom and scroll horizontally; the gnome card is collapsible), and the whole HUD must leave most of the canvas visible. Use readable font sizes (>= 13px).
  - refresh() only touches the DOM when text or classes actually change (it runs 4 times a second).

## Contract
`createUi` and `Ui` exactly as in the stub. ui.ts imports from ./config, ./types, ./sim, ./actions, ./world and @lawn/prefabs only.

## Done when
- `npx tsc --noEmit -p games/snigms` shows no error in your files.
- State in your reply what you could not check visually (the planner runs the smoke check and a phone-viewport check).

## Out of scope
Every other file.
~~~~

### 2H create + audio

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
The "make your household" start screen (create.ts) and the synthesized sound effects (audio.ts).

## Read first
- games/snigms/src/create.ts and audio.ts (stubs; all exports are final), types.ts (NewHouseholdOptions, TraitId, SfxId), config.ts (TRAITS, START_FUNDS).
- games/giant-pup/src/audio.ts for a Web Audio synth in this repo's style.

## Change
- games/snigms/src/create.ts: `runCreate(root, input)` appends a full-screen overlay container (id `snigms-create`, pointer-events auto, own <style> scoped by that id) to `root` and resolves with the choice, removing the overlay. Content: the title "Snigms" and a one-line tagline; a household-name input (prefilled with a random 'The <Surname>s' from a list of 8 gnome surnames you write, e.g. Mossbottom, Burrowby); a gnome-name input (prefilled input.defaultGnomeName ?? a random gnome name); five trait cards from TRAITS (name, blurb; one selected, default 'neat'); two lot cards: 'Starter cottage' (a ready two-room cottage, START_FUNDS.starter acorns to furnish it) and 'Empty lot' (START_FUNDS.empty acorns, build it all yourself); a 'Move in' button resolving { householdName, gnomeName, trait, lot }; names trimmed, max 24 characters, empty falls back to the default. When input.saved is set, also a prominent 'Continue: <household>, <gnome>, day N' button resolving 'continue' (the form below it creates a new household and replaces the save). Works on a phone: scrollable, 44 px targets, inputs at font-size 16px (no zoom on focus), safe-area padding. Friendly gnomey look (warm greens, a big cone-hat icon drawn with CSS or emoji).
- games/snigms/src/audio.ts: `createSfx()`: one AudioContext created lazily on unlock(); play(id) for every SfxId in types.ts: short synthesized blips with oscillators and envelopes (click: tick; place: wooden thunk; sell/coin: two rising pings; deny: low buzz; wall: scrape-thud; flush: filtered noise sweep; splash: noise burst; yawn: slow falling tone; ding: bell; door: knock). setMuted persists in localStorage key 'snigms.muted' (wrap storage in try/catch); `muted` getter reflects it. play() while locked or muted does nothing and never throws. Keep each sound under 0.6 s and quiet (gain <= 0.2).

## Contract
Exports exactly as in the stubs. No imports beyond ./config and ./types.

## Done when
- `npx tsc --noEmit -p games/snigms` shows no error in create.ts or audio.ts.
- State what you could not check visually or audibly.

## Out of scope
Every other file.
~~~~

### 2I docs + lore

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
Snigms is documented where this repo expects it: its README, the agent index, the lore settings, and the party slice backlog.

## Read first
- AGENT_INDEX.md (the Games table row format), docs/lore/settings.md and docs/lore/canon.md, docs/lore/entries/ (look at two small entries in docs/lore/entries/the-yard/ for the fact-sheet format; `npm run lore -- find home` and `-- find house` to see what is already canon), packages/party/README.md (the slice backlog table and the size rules), games/giant-pup/README.md (style of a game README).
- games/snigms/src/config.ts and docs/roadmaps/snigms.md (what the game is).

## Change
- games/snigms/README.md (new): what it is, how to run (`npm run dev -w games/snigms`, port 5203), controls (desktop and touch: build wall by dragging, doors and windows by tapping an edge, furnish tab, select and move, camera), the needs, traits and four jobs (read the tables from config.ts), file map of games/snigms/src (types, config, world, sim, actions, brain, view, tools, ui, create, audio, achievements, main, save), what is not done (one gnome only, no visitors, no online, no second floor), mobile: yes, online: not yet and why.
- AGENT_INDEX.md: add one row to the Games table for `snigms` (Title 'Snigms', three, port 5203, online blank, slice blank, a one-line summary), keep alphabetical-ish placement near the other games; no other edits.
- docs/lore/settings.md: add `snigms` to the `the-yard` row's game list (a gnome's home life belongs to the Yard) and a one-line mention under the `the-yard` section if it lists games there. Add a small fact-sheet entry in docs/lore/entries/the-yard/ named `snigms-households.md` in the same format as the neighbours, with canon-safe facts the game uses: a household is one gnome and a cottage on a lawn plot, acorns are the money, the Tall Ones' "rent" arrives as snail-mail bills, the four jobs (Gardener, Mailgnome, Mushroom Chef at the Spore & Sprout, Mower Mechanic), the carpool stop with a mailbox. Do not contradict canon.md.
- packages/party/README.md: add a backlog row for `snigms` in the same format: why a party slice does not fit yet (a slow solo life sim; a 'furnish a room in 45 s, best vibes wins' round could work later) and "later".
- Run `npm run lore` and make it pass.

## Done when
- `npm run lore` passes.
- No file outside the list above is changed.

## Out of scope
All code files.
~~~~

### 2J achievements

~~~~text
Epic: 2 Build it
Depends on: none
(First read the Common section of docs/roadmaps/snigms.md.)

## Goal
Snigms has achievements with gnome-wearable rewards, and main.ts raises them.

## Read first
- packages/achievements/README.md (adding achievements for a new game), packages/achievements/src/catalog.ts (AchievementDef shape and the existing entries for another game, e.g. a game with rewards), docs/design/achievement-system.md only if needed.
- games/snigms/src/config.ts: the EVENTS list; achievements.ts (stub; `createAchievementSink(ui)` returns `(name, n?) => void`), main.ts (the loop that you will extend) and types.ts (App).
- Rewards need a @lawn/prefabs item with a matching wear-* use tag (head, back, neck or hand slot). Search packages/prefabs/src/catalog/*.ts with Grep for `wear-head` / `wear-neck` / `wear-back` / hold items and reuse fitting ones (a hat, a scarf, a watering can, a tool).

## Change
- packages/achievements/src/catalog.ts: add AchievementDefs for game 'snigms' (gameTitle 'Snigms'), ids prefixed `snigms-`, one per event in EVENTS: first-wall, first-room (build an enclosed room), first-furniture, first-shift, promoted, full-house (all five needs at 90+ at once), first-bath, spent-big, week-survived (reach day 8), all-jobs-tried (hold each of the four jobs once; use `target: 4` with increment). Give at least six of them a cosmetic `reward` ({ slot, prefabId, label }) from existing prefabs; use short gnomey names and descriptions.
- games/snigms/src/achievements.ts: `createAchievementSink(ui)` creates ONE tracker `createAchievementTracker({ game: 'snigms', ui })` and returns a sink that maps event names to `unlock` / `increment` (ignore unknown names, swallow promise rejections).
- games/snigms/src/main.ts: inside the frame loop (or small helper functions called from it), derive the events the game does not raise itself and call `app.event(name, n?)` once each: 'first-room' when detectRooms(app.h.lot) (from ./world) has an enclosed room with at least 4 tiles, checked whenever the lot changed (hook it in app.lotChanged); 'full-house' when all five needs >= 90; 'week-survived' when dayOf(app.h.clock) >= 8; 'all-jobs-tried' with n = 1 each time app.h.gnome.job changes to a job not tried before (keep a Set in memory seeded from nothing; it only counts per session, fine). Keep every other line of main.ts as it is. (actions.ts raises first-wall, first-furniture, spent-big; brain.ts raises first-shift, promoted, first-bath.)

## Contract
Event names exactly those in EVENTS in config.ts.

## Done when
- `npm test -w packages/achievements` passes.
- `npx tsc --noEmit -p games/snigms` shows no error in your files.

## Out of scope
All other files.
~~~~
