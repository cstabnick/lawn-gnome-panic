# Prefab adoption push

Goal: every game moves its hand-built objects (furniture, props, vehicles, held items, creatures, emoji items) onto
`@lawn/prefabs`, reusing existing prefabs where they fit and adding new ones where they do not, so the shared library
grows and games can pull from it. Characters, terrain, sky and effects stay in their games, and the PR says why.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0. Foundation (planner, done) | `packages/prefabs` tests pass; one stub catalog file per game exists and is registered in `packages/prefabs/src/catalog/index.ts` | 0 |
| 1. Adoption, one issue per game | each game builds (`npm run build -w games/<name>`), its own tests pass, prefab tests pass for new ids | 18, all in parallel |
| 2. Check (planner) | all builds, `npm test -w packages/prefabs`, the smoke check on each touched game, one PR | 0 |

No issue in epic 1 depends on another. Every new prefab lives in the owning game's stub file (listed in its issue), so no two
workers edit the same file. `packages/prefabs/src/catalog/index.ts` and `packages/prefabs/src/types.ts` are read-only in epic 1.

## Epic 1 issues

Each issue is in its own section below. Shared rules are in the Environment block of every issue; they are repeated on purpose so each worker reads one section only.

- 1.01 sample-3d: scenery and indoors (`house.ts`, `scenery.ts`, `lobbyStage.ts`)
- 1.02 sample-3d: held weapons (`weapons/*.ts`, `items.ts`, `mushrooms.ts`)
- 1.03 gnaft
- 1.04 lawn-prix
- 1.05 gnome-golf
- 1.06 aether-board
- 1.07 giant-pup
- 1.08 tribute-schedule
- 1.09 gnomeokemon
- 1.10 paragnormal
- 1.11 gnome-company
- 1.12 gnomylpics
- 1.13 gnome-bowling
- 1.14 gnome-blackjack
- 1.15 gnomes-of-gnomomia
- 1.16 gnome-front
- 1.17 gnome-party
- 1.18 peak-climb

---

~~~~text
Epic: 1.01 sample-3d: scenery and indoors
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)` (from
  `@lawn/prefabs`); `buildHeld` for things a hand holds. Do not hand-build a one-off mesh for a furniture or prop piece.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/<stub>.ts` (named below). Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id` (kebab-case, unique), `name`, `category` (one of the
  Category values in `types.ts`), `uses`, `tags`, `emoji` (may be []), `about`, `examine` (4 to 6 lines, each at most 160
  characters, all different, in the voice described in `docs/roadmaps/prefab-library/_common.md`), `parts`.
  Units: 1 = one gnome's height. The validator requires the largest side of the prefab to be between 0.03 and 3, so author at
  natural prefab size and let the game pass `scale` to `buildPrefab` when it needs more. Check it with
  `npm test -w packages/prefabs -- -t "<your id>"`.
- Characters (gnomes, player-controlled animals), terrain, water, sky and effects stay in the game. Say why in your report.
- Mobile and online rules do not change in this issue. Do not change gameplay.
- Do not commit. Do not start a dev server or any `npm run dev` or smoke run. Do not write under `dist/` except through the build.

## Goal
The sample-3d indoor furniture, outdoor scenery and lobby stage are built from prefabs, not hand-built meshes, and the
game looks the same or better than before.

## Read first
- `games/sample-3d/src/house.ts`: `buildHouse(scene)` builds hand-made furniture and walls. List each object and find its
  matching prefab. Walls, floors and the roof are structure, not furniture: leave them in the game.
- `games/sample-3d/src/scenery.ts`: `buildScenery(scene)`. Match each piece to a prefab (fence, signpost, bush, pine,
  rock, fountain, hay, stump, flower pot, birdbath, mailbox, wheelbarrow are likely). Terrain and sky stay.
- `games/sample-3d/src/lobbyStage.ts`: 3 hand-built calls. Use a prefab if one fits, otherwise leave and say why.
- `games/sample-3d/src/props.ts` and `games/sample-3d/src/world.ts`: already use prefabs. Read to see the existing pattern
  (`buildPrefab`, scale, tint) and copy that pattern, not a new one.
- `packages/prefabs/src/catalog/furniture.ts` and `props.ts`: the ids and the `parts` you need to know are there.

## Change
- `games/sample-3d/src/house.ts`: replace each furniture object with `buildPrefab(<id>, { ... })` placed where the old mesh
  was. Keep the same position, rotation and scale.
- `games/sample-3d/src/scenery.ts`: same for scenery pieces.
- `games/sample-3d/src/lobbyStage.ts`: same, only where a prefab fits.
- `packages/prefabs/src/catalog/sample-3d-scenery.ts`: add a new prefab for each piece that no existing prefab covers
  (`SAMPLE_3D_SCENERY` array, one entry per new id). Do not add an entry if an existing prefab fits.

## Contract
- `buildHouse(scene: THREE.Scene): HouseLights` and `buildScenery(scene: THREE.Scene): Scenery` keep their exported
  signatures and return types. Only their bodies change.
- New prefab ids added to `SAMPLE_3D_SCENERY` must be unique across the catalog.

## Done when
- `npx tsc --noEmit -p games/sample-3d` passes.
- `npm run build -w games/sample-3d` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: which hand-built pieces became prefabs (existing id or new id), which stayed and why, and the commands you ran with
  their results.

## Out of scope
- `games/sample-3d/src/weapons/*`, `items.ts`, `mushrooms.ts`, `mowerModels.ts`: another issue owns them.
- `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `sample-3d-scenery.ts`.
- Any other game.
~~~~

~~~~text
Epic: 1.02 sample-3d: held weapons
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Use `buildHeld(id, opts)` for anything a hand
  holds (the origin moves to the grip), `buildPrefab` for anything standing in the world. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/sample-3d-weapons.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id` (kebab-case, unique), `name`, `category`, `uses`
  (include `'hold'` and a `grip` for a held thing), `tags`, `emoji` (may be []), `about`, `examine` (4 to 6 lines, each at most
  160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side must be 0.03 to 3. Check with
  `npm test -w packages/prefabs -- -t "<your id>"`.
- Effects (wind, storms, haboobs, fireballs, lullaby rings, glows) stay in the game. Say why in your report.
- Do not change gameplay, damage, timings or hit boxes.
- Do not commit. Do not start a dev server or any smoke run.

## Goal
The sample-3d held weapons (slingshot, sprinkler, pitchfork, leaf blower, hose, shooting props) use prefabs for the physical
objects in the player's hand or in the world, and the effects stay in the game.

## Read first
- `games/sample-3d/src/weapons/slingshot.ts`: 1 hand-built call. Likely `twig-slingshot`.
- `games/sample-3d/src/weapons/sprinkler.ts`: 1 call. Likely `lawn-sprinkler`.
- `games/sample-3d/src/weapons/pitchfork.ts`: 3 calls. Closest existing ids are `hand-fork` and `hay-hook`; check the parts.
- `games/sample-3d/src/weapons/leafBlower.ts`: 2 calls. No exact prefab; the blower body is a candidate for a new prefab.
- `games/sample-3d/src/weapons/hoseMissile.ts`, `saguaroSpines.ts`, `leafPileFireball.ts`: 1 or 2 calls each. Physical
  objects (the hose nozzle, spines) may be prefabs; the flame, spray and burst stay.
- `games/sample-3d/src/weapons/haboob.ts`, `stormOfDaggers.ts`, `windChimeLullaby.ts`: effects. Read them to confirm, then
  leave them, but still check whether a dagger or chime body is a prefab (`iron-sword`, `thorn-dagger`, `wind chime` if any).
- `games/sample-3d/src/weapons/mushrooms.ts`, `games/sample-3d/src/items.ts`: `mushrooms.ts` already imports `buildPrefab`; read
  to confirm it is complete, and check `items.ts` for its 3 hand-built calls.
- `packages/prefabs/src/build.ts`: confirm `buildHeld` signature and how the grip is applied.

## Change
- Each file above: replace the hand-built physical object with `buildHeld` or `buildPrefab` (same position, rotation and
  scale). Keep the existing weapon factory signatures and the timing and damage code untouched.
- `packages/prefabs/src/catalog/sample-3d-weapons.ts`: add a new prefab only for a physical object no existing prefab covers.

## Contract
- Every `createXxx(scene: THREE.Scene): Weapon` in `games/sample-3d/src/weapons/` keeps its exported name and signature.
- `WEAPON_FACTORIES` in `games/sample-3d/src/weapons/` keeps its shape.

## Done when
- `npx tsc --noEmit -p games/sample-3d` passes.
- `npm run build -w games/sample-3d` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: which objects became prefabs (existing or new id), which stayed and why, and the commands you ran with results.

## Out of scope
- `games/sample-3d/src/house.ts`, `scenery.ts`, `lobbyStage.ts`, `world.ts`, `props.ts`: another issue owns them.
- `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `sample-3d-weapons.ts`.
- Any other game.
~~~~

~~~~text
Epic: 1.03 gnaft
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `createDrop` for pickups. Do not hand-build a one-off mesh for a prop, vehicle or item.
- Mowers: the mower prefabs are in `packages/prefabs/src/catalog/mowers.ts` (see `games/sample-3d/src/mowerModels.ts` for how
  sample-3d uses them with tier and named pivots `wheel-<n>`, `reel`, `engine`, `body`). Reuse them; do not copy the mower code.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnaft.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`,
  `about`, `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height;
  largest side 0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnaft is a raft game on water: water, sky, waves and the sea are terrain or effects and stay in the game. Gnaft's own
  seagull, shark and player stay (creatures and characters), and say why in your report.
- Emoji items: if the game has an emoji item table, route it through `resolvePrefab({ icon, name, prefer })` as the README shows.
- Do not change gameplay. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnaft's mowers, raft pieces, buildings and fishing gear are built from prefabs, and its emoji items resolve through prefabs.

## Read first
- `games/gnaft/src/mowerModels.ts`: 17 hand-built calls with no prefab import. Replace with the mower prefabs for the matching
  tiers. Keep the pivot names the game animates.
- `games/gnaft/src/building.ts`: 33 calls, one prefab import. Find furniture, props and containers; leave walls and structure.
- `games/gnaft/src/fishing.ts`: 13 calls, one prefab import. Rod, bait, hook and fish-container parts are candidates.
- `games/gnaft/src/raft.ts`: 10 calls, no prefab import. Crate, barrel and plank pieces are candidates; the hull stays.
- `games/gnaft/src/navigation.ts`: 12 calls, no prefab import. Buoys, markers and signs are candidates; the sea stays.
- `games/gnaft/src/seagull.ts`, `shark.ts`, `player.ts`: creatures and characters. Leave them and say why.
- `games/gnaft/src/ocean.ts`, `daynight.ts`: terrain and sky. Leave them.
- Search `games/gnaft/src` for emoji items (`icon:` or emoji strings). If found, route them through `resolvePrefab`.

## Change
- `games/gnaft/src/mowerModels.ts`: use the mower prefabs for each tier.
- `games/gnaft/src/building.ts`, `fishing.ts`, `raft.ts`, `navigation.ts`: replace matching hand-built objects with `buildPrefab` or
  `buildHeld`, keeping the same position, rotation and scale.
- `packages/prefabs/src/catalog/gnaft.ts`: add a new prefab only for an object no existing one covers.

## Contract
- Exported names and signatures of every module above stay the same.

## Done when
- `npx tsc --noEmit -p games/gnaft` passes.
- `npm run build -w games/gnaft` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement (existing id or new id), each thing left in the game and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnaft.ts`.
~~~~

~~~~text
Epic: 1.04 lawn-prix
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `createDrop` for pickups, `buildPrefabInstances` for many copies. Do not hand-build a one-off mesh.
- Mowers: the mower prefabs are in `packages/prefabs/src/catalog/mowers.ts` (see `games/sample-3d/src/mowerModels.ts` for the
  pivot names `wheel-<n>`, `reel`, `engine`, `body`). Reuse them; do not copy the mower code.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/lawn-prix.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`,
  `about`, `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height;
  largest side 0.03 to 3; scale up in the game with `buildPrefab`'s `scale`. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Terrain, track surface, sky and effects (hazard glows, speed lines) stay in the game. Racing gnomes and characters stay.
  Say why in your report.
- Do not change gameplay, lap logic or collision. Do not commit. Do not start a dev server or any smoke run.

## Goal
Lawn Prix's mowers, track props, course dressing and item pickups are built from prefabs.

## Read first
- `games/lawn-prix/src/scene/mower.ts`: 6 hand-built calls, no prefab import. Replace with the mower prefab for each tier.
  Keep the pivots the game animates.
- `games/lawn-prix/src/scene/trackView.ts`: 11 calls, no prefab import. Find barriers, cones, banners, signs; leave the track
  surface.
- `games/lawn-prix/src/scene/courses/golf.ts`: 8 calls. Flags, tee markers and bunkers: check `golf.ts` and `golf-cart.ts` in
  the catalog (`tee-marker`, `golf-flagstick`) before adding anything.
- `games/lawn-prix/src/scene/courses/front.ts`, `garden.ts`, `panic.ts`: already import prefabs. Read to confirm any remaining
  hand-built props.
- `games/lawn-prix/src/scene/hazardView.ts`: 4 calls, no prefab import. Hazards that are physical objects (a sprinkler, a
  rock, a hose) are candidates; glows and spray stay.
- `games/lawn-prix/src/scene/itemView.ts`: already imports prefabs. Confirm no hand-built item remains.
- `games/lawn-prix/src/scene/racer.ts`: 1 call. A racer is a gnome or a player; leave it and say why.

## Change
- Each file above: replace matching hand-built objects with prefabs, same position, rotation and scale.
- `packages/prefabs/src/catalog/lawn-prix.ts`: add a new prefab only for an object no existing one covers.

## Contract
- Exported names and signatures of every module above stay the same.

## Done when
- `npx tsc --noEmit -p games/lawn-prix` passes.
- `npm run build -w games/lawn-prix` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement (existing or new id), each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `lawn-prix.ts`.
~~~~

~~~~text
Epic: 1.05 gnome-golf
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `createDrop` for pickups, `buildPrefabInstances` for many copies. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-golf-props.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`,
  `about`, `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height;
  largest side 0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Terrain, grass, water, sky, the course layout and effects (splashes, trails) stay in the game. Gnome characters stay on
  `@lawn/gnome`. Say why in your report.
- Do not change gameplay, physics or hole layout. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Golf's ambient props, ball and disc pieces, and the remaining hand-built world objects are built from prefabs.

## Read first
- `games/gnome-golf/src/ambient.ts`: 16 calls. Flora, rocks and props are candidates (`broadleaf-tree`, `round-bush`,
  `garden-rock`, `flower-pot`, `dandelion`-style ids: check `props.ts` and `furniture.ts`). Leave sky and ground.
- `games/gnome-golf/src/ball.ts`: 5 calls. The ball is a golf ball; check `golf.ts` for `golf-ball`-type ids before adding.
- `games/gnome-golf/src/disc.ts`: 12 calls, 1 prefab import. A disc-golf disc and basket: `disc-golf-basket` exists; check the
  disc.
- `games/gnome-golf/src/world.ts`: 10 calls, 1 prefab import. Find remaining hand-built objects; leave terrain.
- `games/gnome-golf/src/z33Model.ts`: 15 calls, no prefab import. A mower-style cart model: compare it with the mower and golf
  cart prefabs (`catalog/mowers.ts`, `catalog/golf-cart.ts`). Replace with a prefab if one matches the look.
- `games/gnome-golf/src/splash.ts`, `remotes.ts`, `party.ts`, `minigames/golf-hole.ts`: small counts. Check for objects.
- `games/gnome-golf/src/models/mowerModels.ts`: already imports a prefab. Confirm nothing hand-built is left.

## Change
- Each file above: replace matching hand-built objects with prefabs, same position, rotation and scale.
- `packages/prefabs/src/catalog/gnome-golf-props.ts`: add a new prefab only for an object no existing one covers.

## Contract
- Exported names and signatures of every module above stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-golf` passes.
- `npm run build -w games/gnome-golf` passes.
- `npm test -w games/gnome-golf` passes if the game has a test script (check `games/gnome-golf/package.json`).
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-golf-props.ts`.
~~~~

~~~~text
Epic: 1.06 aether-board
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts` lists them; ids are the `id:` fields,
  and `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)` and `buildPrefabInstances`
  for many copies. Do not hand-build a one-off mesh for a vehicle, prop or item.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/aether-board.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category` (one of the Category values in
  `types.ts`; use `'prop'` for a vehicle), `uses`, `tags`, `emoji`, `about`, `examine` (4 to 6 lines, each at most 160
  characters, all different), `parts`. Units: 1 = one gnome's height; the prefab's largest side must be 0.03 to 3, even if the
  game uses a longer train. The game scales it: see `makeTrainCar()` for the 11 m length (`TRAIN_HALF_LEN = 5.5`). Author the
  car at natural size and pass `scale` to `buildPrefab`. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnome characters (spectators, riders) stay on `@lawn/gnome` (`createGnomeModel`), never prefabs. Terrain, islands, water,
  sky and the chain layout stay in the game. Effects stay in the game. Say why in your report.
- Do not change flight, landing, scoring or chain logic. Do not commit. Do not start a dev server or any smoke run.

## Goal
Aether Board's train car, spectator toadstools and island props are built from prefabs. The train car is a new prefab.

## Read first
- `games/aether-board/src/view/train.ts`: `makeTrainCar(): THREE.Group` with 9 hand-built calls and no prefab import, plus the
  exported dimensions (`TRAIN_HALF_LEN`, `TRAIN_HALF_W`, `TRAIN_ROOF_Y`, `TRAIN_RIDER_OFFSET`). Keep those constants.
- `games/aether-board/src/view/crowd.ts`: spectator gnomes (leave, use `@lawn/gnome`) and the giant spotted toadstools. The
  toadstools are objects: match them to `red-mushroom` or `toadstool-seat` in `props.ts`/`materials.ts`/`furniture.ts`, or add
  a new prefab for the spotted giant toadstool in `aether-board.ts`.
- `games/aether-board/src/view/world.ts`: 9 calls. Islands are terrain; find props and leave terrain.
- `games/aether-board/src/view/rider.ts`: 1 call. A rider is a character; leave it and say why.
- `games/aether-board/src/view/crowd.ts`'s `dispose()` removes its own scene objects. If you replace meshes with prefabs, keep
  `dispose()` working and do not dispose prefab geometry (the README forbids it); remove the root only.

## Change
- `games/aether-board/src/view/train.ts`: rebuild `makeTrainCar()` from a new prefab (the train car) via `buildPrefab` with
  the scale needed to reach the existing dimensions. Keep the exported constants and the function signature.
- `games/aether-board/src/view/crowd.ts`: replace the toadstool meshes with `buildPrefab`. Keep spectators on `@lawn/gnome`.
- `games/aether-board/src/view/world.ts`: replace matching prop meshes.
- `packages/prefabs/src/catalog/aether-board.ts`: the train car prefab and the giant toadstool only if no existing prefab fits.

## Contract
- `makeTrainCar(): THREE.Group` keeps its name and return type.
- `TRAIN_HALF_LEN`, `TRAIN_HALF_W`, `TRAIN_ROOF_Y`, `TRAIN_RIDER_OFFSET` keep their names and values.
- `createCrowd(...)` (or whatever `crowd.ts` exports) keeps its signature and the `Crowd` interface unchanged.

## Done when
- `npx tsc --noEmit -p games/aether-board` passes.
- `npm run build -w games/aether-board` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, the new train prefab id, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `aether-board.ts`.
~~~~

~~~~text
Epic: 1.07 giant-pup
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`. Do not hand-build a
  one-off mesh for a prop, furniture piece or item.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/giant-pup.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Emoji items: if the game has an emoji item table, route it through `resolvePrefab({ icon, name, prefer })`.
- The giant pup is the player's dog: a character that the player drives. It stays in the game. Say so in your report.
  Terrain, sky, lawn and effects stay too.
- Do not change gameplay. Do not commit. Do not start a dev server or any smoke run.

## Goal
Giant Pup's scenery and props (and any emoji items) are built from prefabs. The player's dog stays in the game.

## Read first
- `games/giant-pup/src/scene.ts`: 12 hand-built calls, no prefab import. Find props (fences, bushes, rocks, bowls, toys,
  signs); leave the lawn and sky.
- `games/giant-pup/src/main.ts`: 1 call. Check whether it is a prop.
- `games/giant-pup/src/dog.ts`: 11 calls, no prefab import. The dog is a player character. Leave it and say why.
- Search `games/giant-pup/src` for emoji items. If found, route them through `resolvePrefab`.

## Change
- `games/giant-pup/src/scene.ts` and `main.ts`: replace matching props with `buildPrefab`, same position, rotation and scale.
- Emoji items if any: use `resolvePrefab`.
- `packages/prefabs/src/catalog/giant-pup.ts`: add a new prefab only for a prop no existing one covers.

## Contract
- Exported names and signatures of the modules above stay the same.

## Done when
- `npx tsc --noEmit -p games/giant-pup` passes.
- `npm run build -w games/giant-pup` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, the dog and anything else left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `giant-pup.ts`.
~~~~

~~~~text
Epic: 1.08 tribute-schedule
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`. Do not hand-build a
  one-off mesh for a prop, furniture piece or item.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/tribute-schedule.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Characters and creatures stay in the game (say why). Terrain, sky and effects stay too.
- Do not change behaviour or the schedule logic. Do not commit. Do not start a dev server or any smoke run.

## Goal
Tribute Schedule's scene objects are built from prefabs where a prefab fits. Today the game imports no prefabs at all.

## Read first
- `games/tribute-schedule/src/view/scene.ts`: 26 hand-built calls, no prefab import. Read the whole file. List each object
  and its matching prefab (furniture, props, containers, documents, banners, a desk, a clock are likely). Leave walls, the
  floor and the sky as structure.
- Check `games/tribute-schedule/package.json` for its scripts; `npm test` may not exist for it.

## Change
- `games/tribute-schedule/src/view/scene.ts`: replace each matching object with `buildPrefab`, same position, rotation and scale.
  Add `import { buildPrefab } from '@lawn/prefabs';` at the top.
- `packages/prefabs/src/catalog/tribute-schedule.ts`: add a new prefab only for an object no existing one covers.

## Contract
- Exported names and signatures of `scene.ts` stay the same.

## Done when
- `npx tsc --noEmit -p games/tribute-schedule` passes.
- `npm run build -w games/tribute-schedule` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `tribute-schedule.ts`.
~~~~

~~~~text
Epic: 1.09 gnomeokemon
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`. Gnomokemon creatures
  already live in `packages/prefabs/src/catalog/gnomeokemon.ts` (42 entries) and are built by `games/gnomeokemon/src/prefabs/registry.ts`.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnomeokemon-world.ts`. Do not edit
  `catalog/gnomeokemon.ts`, `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`,
  `tags`, `emoji`, `about`, `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's
  height; largest side 0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Effects, terrain and the world floor stay in the game. Say why for anything left.
- Do not change gameplay, catching or battle logic. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnomeokemon's world props and its giant dog (the photographer's mount) come from prefabs, not hand-built meshes. Every
creature the game shows should come from a prefab.

## Read first
- `games/gnomeokemon/src/snap/models.ts`: `createGiantDog()` builds the Giant Goofy Fetch Dog by hand. First search
  `packages/prefabs/src/catalog/gnomeokemon.ts` for a dog or hound entry. If one exists, use it and delete the hand-built
  function (or make it a thin wrapper). If none exists, add a new creature prefab to `gnomeokemon-world.ts` with
  `category: 'gnomeokemon'`, using `PrefabDef.pivots` for the legs, head and tail the game animates (read how
  `snap/game.ts` moves them and keep the same pivot names).
- `games/gnomeokemon/src/snap/world.ts`: 51 hand-built calls with 2 prefab imports. Find props (fences, trees, rocks, signs,
  lamps, benches, flowers); leave terrain and effects.
- `games/gnomeokemon/src/snap/game.ts`, `viewer.ts`, `menu.ts`: 2, 5 and 1 hand-built calls. Check for objects.
- Search `games/gnomeokemon/src` for emoji items. If found, route them through `resolvePrefab`.

## Change
- `games/gnomeokemon/src/snap/models.ts`: use the prefab for the dog (existing or new).
- `games/gnomeokemon/src/snap/world.ts` and the other files above: replace matching props with `buildPrefab`, same position,
  rotation and scale.
- `packages/prefabs/src/catalog/gnomeokemon-world.ts`: new prefabs only where no existing one covers the object.

## Contract
- Exported names and signatures of every module above stay the same, including `createGiantDog(): THREE.Group`.

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` passes.
- `npm run build -w games/gnomeokemon` passes.
- `npm test -w games/gnomeokemon` passes (it has `catalog.test.ts`).
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, `catalog/gnomeokemon.ts`, and every catalog file except `gnomeokemon-world.ts`.
~~~~

~~~~text
Epic: 1.10 paragnormal
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, passing `tint` and
  `trim` for per-kind colours. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/paragnormal.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category` (use `'prop'` if none fits
  better), `uses`, `tags`, `emoji`, `about`, `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`.
  Units: 1 = one gnome's height; largest side 0.03 to 3. Articulated parts use `Part.group` names and
  `PrefabDef.pivots` (see `packages/prefabs/src/types.ts`): the game then addresses a part by its group name. Check with
  `npm test -w packages/prefabs -- -t "<your id>"`.
- Characters: a monster is a creature. A creature that a prefab can express (body, head, legs, tail, and their colours) goes
  to a prefab. Effects (aura lights, floating motes, glows) stay in the game. Say why for anything left.
- Do not change gameplay, AI, sight, or the monster state machine. Do not commit. Do not start a dev server or any smoke run.

## Goal
Paragnormal's monsters are built from prefabs with named pivots the game already animates, and its scene props come from
prefabs. Aura lights, motes and hover bobbing stay in the game.

## Read first
- `packages/prefabs/src/types.ts`: confirm `PrefabDef.pivots`, `Part.group` and `Part.name` semantics, and how
  `packages/prefabs/src/build.ts` attaches a group under the root (confirm by reading `build.ts`).
- `games/paragnormal/src/view/monsters.ts`: `createMonsterMesh(m: MonsterState): MonsterMesh`. Five kinds: gardener, watcher,
  lamplighter, crawler, hush. Read the `MonsterMesh` interface: `root`, `head`, `eyeMat`, `auraLight`, `motes`, `calmEye`,
  `calmAura`, `hoverAmp`, `legs`. The game reads these fields, so keep them meaningful: `head` must be the pivot group for
  the head, `legs` must be the leg meshes for the crawler, and `eyeMat` must still control the eyes.
- Use a per-kind colour set: cloak colour as `tint`, porcelain as `trim` (see `CALM`).
- `games/paragnormal/src/view/scene.ts`: 20 hand-built calls, 2 prefab imports. Find props (lamps, benches, gravestones,
  furniture, boxes, plants) and leave the ground, walls and sky.
- Read the sim (`games/paragnormal/src/sim/types.ts`) only for `MonsterKind` and `MonsterState` names.

## Change
- `packages/prefabs/src/catalog/paragnormal.ts`: one prefab per monster kind (`PARAGNORMAL` array) if no existing creature fits.
  Give named groups for `head`, and for the crawler `leg-<n>` groups. Keep the eyes as a part named `eye` so the game can
  find it, or use a pivot. Read `build.ts` and confirm the group naming is what `monsters.ts` expects.
- `games/paragnormal/src/view/monsters.ts`: build each kind with `buildPrefab(id, { tint, trim })` and rewire `head`, `legs`,
  `eyeMat` and `motes` to the prefab's named parts. Keep the aura light, motes and hover code.
- `games/paragnormal/src/view/scene.ts`: replace matching props with `buildPrefab`.

## Contract
- `createMonsterMesh(m: MonsterState): MonsterMesh` keeps its signature and the `MonsterMesh` interface unchanged.
- The `MonsterMesh` fields keep their meanings (above).

## Done when
- `npx tsc --noEmit -p games/paragnormal` passes.
- `npm run build -w games/paragnormal` passes.
- `npm test -w games/paragnormal` passes if the game has a test script.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: which monster parts are prefab parts and which stayed as game effects, each scene prop replaced, and the commands run with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `paragnormal.ts`.
~~~~

~~~~text
Epic: 1.11 gnome-company
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `buildPrefabInstances` for many copies. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-company.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnomes, the dog and other characters stay in the game (`@lawn/gnome` for gnomes). Terrain, zone ground and sky stay. Say why.
- Do not change gameplay or the simulation. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Company's zone props and office/field objects come from prefabs. Its characters and terrain stay in the game.

## Read first
- `games/gnome-company/src/zones.ts`: `buildAllZones()` with 27 hand-built calls and 1 prefab import. Find props (fences,
  bushes, rocks, sheds, signs, lamps, benches) and leave ground and sky.
- `games/gnome-company/src/models.ts`: 41 hand-built calls, 1 prefab import. Separate characters (leave them) from objects
  (replace them). Read the exports and check which ones build objects, for example a mower, a cart, a crate or a tool.
- `games/gnome-company/src/` (any other file with `Geometry` calls): run `grep -rn "Geometry" games/gnome-company/src` to find them.

## Change
- `games/gnome-company/src/zones.ts` and `models.ts`: replace object builders with `buildPrefab` where a prefab fits. Keep
  exported names and signatures.
- `packages/prefabs/src/catalog/gnome-company.ts`: new prefabs only where no existing one covers the object.

## Contract
- `buildAllZones(): Record<ZoneId, ZoneSceneData>` and every exported model builder keep their names and signatures.

## Done when
- `npx tsc --noEmit -p games/gnome-company` passes.
- `npm run build -w games/gnome-company` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-company.ts`.
~~~~

~~~~text
Epic: 1.12 gnomylpics
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `createDrop` for pickups. Do not hand-build a one-off mesh.
- Mowers: the mower prefabs are in `packages/prefabs/src/catalog/mowers.ts`. Reuse them for any mower.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnomylpics.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnome Olympics is a party-only game (`package.json` has `"lawn": { "partyOnly": true }`). Its minigame slices live in
  `src/minigames/`; keep them working: `npm test -w games/gnomylpics` must pass if it has a test script.
- Characters, terrain, track and sky stay in the game. Say why.
- Do not change the minigame rules or scoring. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Olympics' mower toss, field, sprint and jump scenery come from prefabs. Its minigames keep working.

## Read first
- `games/gnomylpics/src/minigames/oly-mower-toss.ts`: 7 hand-built calls, no prefab import. The mower is a mower prefab; the
  thrown object and the field props are candidates.
- `games/gnomylpics/src/minigames/oly-sprint.ts`, `oly-triple-jump.ts`: 2 and 1 hand-built calls. Hurdles, pits, markers:
  check the catalog.
- `games/gnomylpics/src/minigames/oly-gnome-hero.ts`, `oly-grass-mow.ts`: already import prefabs. Confirm nothing hand-built
  is left.
- `games/gnomylpics/src/olympic/field.ts`: 5 hand-built calls, no prefab import. Field props (flags, cones, banners, stands,
  signs) are candidates; the ground and the sky stay.

## Change
- The files above: replace matching objects with prefabs, same position, rotation and scale.
- `packages/prefabs/src/catalog/gnomylpics.ts`: new prefabs only where no existing one covers the object.

## Contract
- Every minigame's exported definition (`MinigameDef` shape) and the `minigames` export stay unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomylpics` passes.
- `npm run build -w games/gnomylpics` passes.
- `npm test -w games/gnomylpics` passes if the script exists.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnomylpics.ts`.
~~~~

~~~~text
Epic: 1.13 gnome-bowling
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/bowling.ts` has the bowling set:
  `bowling-pin`, `bowling-ball`, `bowling-shoes`, `ball-return`, `ball-rack`, `bowling-bench`, `scoring-console`,
  `overhead-scoreboard`). Build with `buildPrefab(id, opts)`, `createDrop` for pickups. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-bowling-lane.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Emoji items: if the game has an emoji item table, route it through `resolvePrefab({ icon, name, prefer })`.
- The lane surface, gutters, walls and the ambient room are structure and stay. Gnome bowlers stay on `@lawn/gnome`.
- Do not change scoring, frames or pin physics. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Bowling's lane props, scoring and ambient objects come from prefabs, and its emoji items resolve through prefabs.

## Read first
- `games/gnome-bowling/src/lane.ts`: 19 hand-built calls, 1 prefab import. Find props (ball return, rack, seating, scoreboards,
  signs, pins if not already prefabs); leave the lane surface and gutters.
- `games/gnome-bowling/src/ambient.ts`: 1 call. Check for an object.
- `games/gnome-bowling/src/minigames/bowl-frame.ts`: 2 calls. Check for an object.
- `games/gnome-bowling/src/pins.ts`: already imports prefabs twice. Confirm nothing hand-built is left.
- Search `games/gnome-bowling/src` for emoji items. Two files match; route them through `resolvePrefab`.

## Change
- `games/gnome-bowling/src/lane.ts`, `ambient.ts`, `minigames/bowl-frame.ts`: replace matching objects with prefabs.
- Emoji item tables: use `resolvePrefab`.
- `packages/prefabs/src/catalog/gnome-bowling-lane.ts`: new prefabs only where no existing one covers the object.

## Contract
- Exported names and signatures of every module above stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-bowling` passes.
- `npm run build -w games/gnome-bowling` passes.
- `npm test -w games/gnome-bowling` passes if the script exists.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-bowling-lane.ts`.
~~~~

~~~~text
Epic: 1.14 gnome-blackjack
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/casino.ts` has the casino set: `slot-machine-*`,
  `bar-counter`, `bar-stool`, `cocktail-table`, `neon-sign`, `vending-machine`, `arcade-cabinet`; check the others in that file).
  Build with `buildPrefab(id, opts)`. Do not hand-build a one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-blackjack.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Dealers, players and gnome characters stay on `@lawn/gnome`. The room, floor, walls and lighting stay. Effects stay. Say why.
- Do not change game rules, betting or payouts. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Blackjack's table, chips, lamps and ambient objects come from prefabs wherever a prefab fits.

## Read first
- `games/gnome-blackjack/src/ambience.ts`: 15 hand-built calls, 2 prefab imports. Find objects (lamps, props, plants, signs,
  stools, chairs, bottles); leave the room, floor, walls and lighting.
- `games/gnome-blackjack/src/scene.ts`: 11 hand-built calls, 1 prefab import. Table, cards, chip stacks and seating are
  candidates; the room stays.
- `games/gnome-blackjack/src/slots/view.ts`: 3 hand-built calls, 2 prefab imports. Confirm the remaining calls.

## Change
- `games/gnome-blackjack/src/ambience.ts`, `scene.ts`, `slots/view.ts`: replace matching objects with `buildPrefab`, same
  position, rotation and scale.
- `packages/prefabs/src/catalog/gnome-blackjack.ts`: new prefabs only where no existing one covers the object (e.g. a card
  table or a chip stack, if no existing prefab fits).

## Contract
- Exported names and signatures of every module above stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes.
- `npm run build -w games/gnome-blackjack` passes.
- `npm test -w games/gnome-blackjack` passes if the script exists.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-blackjack.ts`.
~~~~

~~~~text
Epic: 1.15 gnomes-of-gnomomia
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`, `buildHeld` for held
  things, `createDrop` for pickups. Do not hand-build a one-off mesh.
- This game already uses the library heavily (`src/itemArt.ts`, `src/interiors.ts`, furniture from `catalog/furniture.ts`).
  Follow that pattern.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnomes-of-gnomomia.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnomes (the player, NPCs, workers, bosses and their gear on the body) stay on `@lawn/gnome` or in the game. Worn gear that is
  an item (a hat, a bag) should be a prefab if one exists. Terrain, rock, tunnels and effects stay.
- Do not change the sim, combat, crafting or economy. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnomes of Gnomomia's remaining hand-built objects (furniture, workstations, world props, mower, objects) come from prefabs.
Gnome bodies and terrain stay in the game.

## Read first
- `games/gnomes-of-gnomomia/src/models.ts`: 82 hand-built calls, 1 prefab import. Most are probably gnome bodies (leave them).
  Read the exports, classify each builder as a body or an object, and replace only the object builders.
- `games/gnomes-of-gnomomia/src/dressing.ts`: 44 calls, 1 prefab import. Gear on a gnome: a hat, a bag or a tool that is an
  item should be a prefab; the gnome's own body parts stay.
- `games/gnomes-of-gnomomia/src/world.ts`: 5 calls, no prefab import. Find props; leave terrain and rock.
- `games/gnomes-of-gnomomia/src/mower.ts`: 5 calls, no prefab import. A mower is a mower prefab from `catalog/mowers.ts`.
- `games/gnomes-of-gnomomia/src/objects.ts`: 4 calls, 1 prefab import. Confirm the remaining calls.
- `games/gnomes-of-gnomomia/src/combat.ts`: 5 calls, no prefab import. Weapons and shields the gnomes hold are items: check
  `catalog/weapons.ts` and `armor.ts`. Effects stay.
- `games/gnomes-of-gnomomia/src/sim/visualizer.ts`: 4 calls, no prefab import. Check for objects.
- `games/gnomes-of-gnomomia/src/bossmoves.ts`, `input.ts`, `interiors.ts`, `player.ts`: 2, 1, 1, 1 calls. Check and leave bodies.

## Change
- The files above: replace matching object builders with `buildPrefab`, `buildHeld` or `createDrop`, same position, rotation
  and scale. Keep exported names and signatures.
- `packages/prefabs/src/catalog/gnomes-of-gnomomia.ts`: new prefabs only where no existing one covers the object.

## Contract
- Every exported builder keeps its name and signature. Bodies keep their existing code.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes.
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm test -w games/gnomes-of-gnomomia` passes if the script exists.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnomes-of-gnomomia.ts`.
~~~~

~~~~text
Epic: 1.16 gnome-front
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/front.ts` and `front-weapons.ts` already hold
  the battlefield props and guns). Build with `buildPrefab`, `buildHeld` for guns (they are turned to point down -z), and
  `prefabIcon` for UI. Do not hand-build a one-off mesh.
- Mowers: the mower prefabs are in `packages/prefabs/src/catalog/mowers.ts`. Reuse them.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-front-battle.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnomes and soldiers stay in the game. Explosions, tracers, smoke and muzzle flashes are effects and stay. Say why.
- Do not change combat, damage or the battle state. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Front's remaining battlefield objects (cover, crates, debris, vehicles) come from prefabs. Its guns and mowers already do.

## Read first
- `games/gnome-front/src/combat.ts`: 4 hand-built calls, no prefab import. Check whether these are effects (leave) or objects.
- `games/gnome-front/src/world.ts`: 3 calls, 1 prefab import. Find the remaining objects.
- `games/gnome-front/src/models/mowerModels.ts`: already imports a prefab. Confirm nothing hand-built is left.

## Change
- `games/gnome-front/src/combat.ts` and `world.ts`: replace objects with prefabs (`front.ts` props, `front-weapons.ts` guns,
  or mowers), same position, rotation and scale.
- `packages/prefabs/src/catalog/gnome-front-battle.ts`: new prefabs only where no existing one covers the object.

## Contract
- Exported names and signatures stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-front` passes.
- `npm run build -w games/gnome-front` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-front-battle.ts`.
~~~~

~~~~text
Epic: 1.17 gnome-party
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`. Do not hand-build a
  one-off mesh.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/gnome-party.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- Gnome Party is the party hub. It never edits another game (AGENTS.md). Its own board objects (the board, tokens, dice,
  tiles' props) are its own. Gnome characters on the board stay on `@lawn/gnome`.
- Do not change the board rules, turn order or the party state. Do not commit. Do not start a dev server or any smoke run.

## Goal
Gnome Party's board objects (board props, markers, dice, tokens if they are objects) come from prefabs.

## Read first
- `games/gnome-party/src/board/view.ts`: 3 hand-built calls, no prefab import. Find objects; leave the board surface and sky.
- Check `games/gnome-party/src/` for any other hand-built object (`grep -rn "Geometry" games/gnome-party/src`).

## Change
- `games/gnome-party/src/board/view.ts` (and any other file the grep finds): replace matching objects with `buildPrefab`,
  same position, rotation and scale.
- `packages/prefabs/src/catalog/gnome-party.ts`: new prefabs only where no existing one covers the object. If the board has no
  objects beyond the surface, add nothing and say so.

## Contract
- Exported names and signatures stay the same.

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- `npm run build -w games/gnome-party` passes.
- `npm test -w games/gnome-party` passes if the script exists.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added.
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `gnome-party.ts`.
~~~~

~~~~text
Epic: 1.18 peak-climb
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\tilefish (run commands from there in Git Bash).
Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Dependencies are already installed.
Other workers are editing other games and `packages/prefabs/src/catalog/<their file>.ts` at the same time. Touch only the files listed here.

Repo rules that apply:
- Prefab rule: use an existing prefab if one fits (`packages/prefabs/src/catalog/*.ts`; ids are the `id:` fields, and
  `resolvePrefab`/`getPrefab` are exported from `@lawn/prefabs`). Build with `buildPrefab(id, opts)`. Do not hand-build a
  one-off mesh for a prop or item.
- New prefab: append a `PrefabDef` to THIS game's stub file `packages/prefabs/src/catalog/peak-climb.ts`. Do not edit
  `catalog/index.ts`, `types.ts` or any other catalog file. Fields: `id`, `name`, `category`, `uses`, `tags`, `emoji`, `about`,
  `examine` (4 to 6 lines, each at most 160 characters, all different), `parts`. Units: 1 = one gnome's height; largest side
  0.03 to 3. Check with `npm test -w packages/prefabs -- -t "<your id>"`.
- The mountain is terrain and stays. The climber is a character and stays on its own model. Say why.
- Do not change climbing physics or the route. Do not commit. Do not start a dev server or any smoke run.

## Goal
Peak Climb's remaining objects (pitons, ropes, markers, flags, signs, camp props) come from prefabs. If there are none beyond
the terrain and the climber, the issue ends with no code change and the report says so.

## Read first
- `games/peak-climb/src/main.ts`: 2 hand-built calls. Check whether they are objects.
- `games/peak-climb/src/mountain.ts`: 7 calls, 1 prefab import. Terrain stays; find any props (flags, signs, ropes, camps).
- `games/peak-climb/src/playerModel.ts`: 3 calls. The climber is a character; leave it and say why.

## Change
- `games/peak-climb/src/main.ts` and `mountain.ts`: replace any objects with prefabs, same position, rotation and scale.
- `packages/prefabs/src/catalog/peak-climb.ts`: new prefabs only where no existing one covers the object.

## Contract
- Exported names and signatures stay the same.

## Done when
- `npx tsc --noEmit -p games/peak-climb` passes.
- `npm run build -w games/peak-climb` passes.
- `npm test -w packages/prefabs -- -t "<each new id>"` passes for every id you added (if none, say so).
- Report: each replacement, each thing left and why, and the commands you ran with results.

## Out of scope
- Any other game. `packages/prefabs/src/catalog/index.ts`, `types.ts`, and every catalog file except `peak-climb.ts`.
~~~~
