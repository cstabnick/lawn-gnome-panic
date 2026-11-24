# E05 Interiors and rooftops
Wave: 2 · Depends on: E01 · Kind: Engine
Source items: L36, L75

- L36 start developing the interiors of some of these buildings
- L75 allow landing on top of buildings in helicopter and letting me run around.

## Goal
One generic way to walk through a door into a furnished, walkable interior and back out (used by homes, the golf
clubhouse, university halls, the mansion, mole tunnels, shops), and walkable rooftops that a helicopter can land on.
E05 builds the system and proves it on a small set of real buildings; E10, E13, E15, E17, E18 fill it.

## Scope
In: the interior registry and runtime, an interior kit (shell + furniture from prefabs), door prompts, the camera and
atmosphere switch inside, minimap/pause/save behaviour while inside, rooftop surfaces for towers, the mega-block roof
(E01) and chosen buildings, helicopter landing and on-foot roof walking with parapets, and **4 proof interiors**:
the player's downtown apartment shell (furnishing is E10), Bodega & Sons, the Mulch Club lobby, one rooftop-access tower
with a helipad. Out: furniture customisation and ownership (E08/E10), quests, per-building content for the new areas
(their epics call the API), walk-in versions of the existing showroom stages (Ammu-Gnation back room, Pay 'n' Glaze
bay keep their camera-only stages), online shared interiors (see Risks).

## Code pointers (confirmed)
- There is no walkable interior today. Three "inside" mechanisms exist, none generic:
  - Off-map stages: `glazeStage.ts` `STAGE_CENTRE` (4000,0); `gunStore.ts` `STAGE` (4000,900), a hidden group shown by `open()` plus a showroom camera;
    cutscene rooms `cutscene/rooms.ts` `ROOM_ORIGIN` (3000,3000), `ROOM_THEMES`, `buildRoom(room)`, `fitPrefab(id,size,by)`, `roomColliders(room)`
    (seven themed rooms for cutscenes only; reuse its shell/theme helpers).
  - The crossover door `portal/gnomecinoDoor.ts` (`GNOMECINO_DOOR`, `createGnomecinoDoor`: `prompt(heat)`, `interact`, `idle(dt)`) via `packages/portal`
    (README: stack of frames, ledger, return point). That is a different game's page; it is the model for door prompt + fade + return stack, not a place to build GTA interiors.
  - Culvert teleports `CULVERT_PORTALS` (`config.ts:148`, handled `app.ts:~1825`): a plain `teleport(x,z,yaw)` (`app.ts:400`, `player.respawn`).
- Door prompts: `interactables.ts` `addInteractSpot({x,z,prompt,run})` (used by `parks/life.ts`), plus the per-module `prompt(player)` / `interact(player)` pattern wired in `app.ts` (~1504-1518 for the gun store).
- Collision: `collide.ts` boxes are `{minX,maxX,minZ,maxZ,h}` in one array `world.boxes` with a lazily rebuilt spatial grid (CELL 32; keys `i*65536+j`, negative j is ambiguous,
  so keep pockets at positive coords). `pushOutOfBoxes(x,z,r,boxes,y)` ignores boxes whose top `h <= y`; `groundHeight(x,z,r,boxes,maxY)` lets a body stand on a box top within
  `maxY + 0.35`; `insideBox`. `clampToWorld(x,z,world.half,r)` is applied to player (`player.ts:124,207,286`), NPCs, police, vehicles, boats, aircraft: **an interior at x >= 5000 would be clamped back to the map**, so
  exempt interior coordinates there (one helper `isInteriorPoint` used by `clampToWorld`).
- Levels: `terrain.ts` `groundAt(x,z,y)` = land or `deckSurfaceBelow` (skyway decks, `highways/deck.ts:208`, `deckCeilingAbove:218`, `pushOutOfDecks:269`); `craft/aircraft.ts` `floorUnder(x,z,y)` (heightAt + `deckSurfaceBelow` + water)
  is what aircraft land on, and `sweepCircleBoxes(..., v.y)` lets a flyer pass over any box lower than its altitude. Vehicle kinds with `spec.air`: `hedge-hopper`, `sycamore-copter` (the helicopter, `config.ts:396`), `dandelion-drifter` (`craft/spawns.ts AIR_KINDS`).
  Tower colliders are exactly the tower footprint at full height (`world.ts addTower`, `TowerSpec` in `towers/types.ts`, `lastTowerSpecs` in `towers/index.ts`); roofs and crowns are drawn by `towers/crowns.ts`; rooftop billboards in `brands.ts` (`rooftop: true`, e.g. (-90,-30) y 48).
  Player stepping up is capped at 0.35 m (`groundHeight`), so a roof is reachable only from a landed aircraft, a jump onto a low box, or a stair/ramp prop.
- Quest gates already allow a height: `quests/types.ts:200` (gate hung at a height, "a Skyway deck, a rooftop"), `questSim/checks.ts:103`.
- Atmosphere/lighting: `atmosphere.ts` (night factor, `BIOME_PROFILES`), `sound/bus.ts:245` can force the ambience bed to `silent` (its comment names interiors), and `cutscene/los.ts` already handles room shots.
- NPCs inside: `outskirts/npcs.ts` and `ambientGnomes.ts` place townsgnomes; `src/gnomes.ts makeGnome`.

## Proposed design
- `src/interiors/` : `registry.ts` (`defineInterior`), `runtime.ts` (`createInteriors(deps)`), `kit.ts` (room shell, door frame, windows, `furnish(room, list)` from `buildPrefab` ids), `rooftops.ts`, `index.ts`.
- Pocket allocator: interior `n` gets origin `(5000 + (n % 8) * 200, 0, 5000 + floor(n / 8) * 200)`, each pocket up to 120 x 120 and 12 m high; ids are stable so saves and online refer to ids, not slots.
- The pocket's meshes live in the main scene, hidden until entered; their boxes are pushed once into `world.boxes` (far from the city so they never matter outside).
- Entering: fade (the portal door's fade/`setGain` pattern), `player.respawn` to the pocket spawn, `atmosphere` override (flat warm light, no sun shadow, fog off), traffic/NPC updates keep running (cheap), world draw hidden by distance; leaving: respawn at the building's `exit` point in the world and fade back.
- Rooftops: `rooftops.ts` keeps a list of `Rooftop { id, x, z, w, d, y, parapet: boolean, pad?: {x,z,r} }` built from `lastTowerSpecs` (roof height = spec.h) and extra entries (E01 mega-block roof, E13 buildings). It plugs into `groundAt` and `floorUnder` as a second "deck" source (`rooftopSurfaceBelow(x,z,maxY)`) and adds thin parapet boxes (h = roof + 1.1) around the rim except on `pad` edges; a heli landing needs `pad` flat within 6 m radius free of crown gear (skip `towers/crowns.ts` gear inside a pad circle).
- Falling off the rim is allowed (no wall at gaps); fall damage follows existing `player.ts` rules.

## Contracts this epic provides
- `defineInterior({ id, name, door: {x,z,yaw}, exit: {x,z,yaw}, size: {w,d,h}, theme, build(kit): {spawn, boxes, props, exitDoor, spots, npcSlots}, locked?(state): string|null })`.
- `enterInterior(id)`, `leaveInterior()`, `currentInterior(): string|null`, `onInteriorChange(cb)`; door prompt appears via `addInteractSpot` automatically for every defined interior (text "Enter <name>").
- `kit`: `kit.room({w,d,h,theme})`, `kit.door(x,z,yaw)`, `kit.put(prefabId,x,z,yaw,{solid})`, `kit.stairsTo(upperInteriorId)`, `kit.window(...)`, `kit.spot({id,x,z,prompt,run})` for the in-room actions (bed, wardrobe, counter).
- `ROOFTOPS: Rooftop[]`, `rooftopAt(x,z,y)`, `addRooftop(def)` for later epics; `landingPads()` for the map and for missions ("land on the Thorne roof").
- Quest hooks: objective gates already accept `y`; add `interior: id` to gate/giver positions so a quest can place a giver or marker inside (E10, E18, E20 use it); `questSim` treats an interior id as reachable.
- `isInteriorPoint(x,z)` for modules that bound-check (net, spawns, critters, cull).

## Contracts this epic consumes
- E01: the reserved off-map coordinate list and `sites.ts` anchors (door and exit points reference a site's anchor), the mega-block roof slab, `POS_BOUND`/`WORLD_HALF` constants.
- Later epics supply content only through `defineInterior`/`addRooftop`.

## Online / mobile / achievements / prefabs / lore
- Online: the host-relay model (`docs/roadmaps/gta-online-sync.md`) sends world positions. Decision: a player inside an interior is relayed as "inside <id>" and shown to others standing at the door's exit point (no shared rooms yet); `net.ts` `POS_BOUND` is not raised for pockets. Rooftop landings sync as normal poses (y up to 400 allowed).
- Mobile: the door prompt uses the existing action button; no new keys; interiors must fit a phone portrait view (camera inside is the follow camera with a lower pitch cap and wall-ignoring raycast).
- Achievements: "Home Sweet Hovel" (first interior), "Roof Rat" (land the copter on a roof), "Rooftop Run" (reach 5 roofs); rewards are `head`/`back` prefab gear, added to `packages/achievements/src/catalog.ts`, `npm test -w packages/achievements`.
- Prefabs: furniture only from `@lawn/prefabs` (`bed`, `armchair`, `bookshelf`, `lamp`, `table` exist in `packages/prefabs/src/catalog/furniture.ts`; browse `games/prefab-gallery`); add missing pieces to `packages/prefabs/src/catalog/` with `npm test -w packages/prefabs`. Helipad is a new prefab. No one-off meshes.
- Lore: each proof interior needs a lore entry or ruling (`npm run lore -- find <building>`); the apartment follows E04's home table.

## Risks and open questions (decisions taken)
- Culling and shadow cost of pockets: hidden groups are skipped by `cull.ts` (`visible=false` is honoured); pockets are not registered as cull objects.
- `clampToWorld` exemption must also cover vehicles so a mis-driven car cannot enter a pocket; vehicles are blocked at doors (doors need `player.vehicle == null`).
- Seat-based aircraft: the player exits a landed copter through the normal exit logic (`seats.ts exitLocal`); verify `groundHeight` uses `rooftopSurfaceBelow` so the exit y is the roof.
- Rooftop surfaces must not double-count with the tower box (`groundHeight` already stands you on a box top within 0.35 m): the roof entry wins only above `box.h - 0.05`. A unit test checks stand/fall/land at 4 corners.
- Save/resume (L70, E07): while inside, persist `interior: id`; on load, place the player at the door if it is gone.
- Interiors do not support vehicles, weapons drawn are holstered (no gunfights in homes), police ignore pockets; decided, can be relaxed by E18.
- Three.js lights: keep to one hemisphere + one point light per room to stay mobile-safe.

## Done when
`npm run build -w games/gnome-theft-auto`; `npm test -w games/gnome-theft-auto` (new `interiors.test.ts`: pocket allocation unique, `clampToWorld` exemption, rooftop stand/land, door enter/leave round trip); `npm test -w packages/prefabs`, `-w packages/achievements`;
`npm run lore`; `bash tools/smoke.sh`; `npm run zfight -- <url>` (floors, rugs, roof pads); manual: walk into the proof apartment and Bodega, leave, fly the copter onto the Thorne roof and run along the parapet, phone viewport 390x844.
