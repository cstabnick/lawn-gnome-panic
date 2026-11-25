Epic: E25-2 (jobs III, parallel build)
Depends on: none (Gnomazon prefabs are made in parallel: guard every one with `getPrefab(id)`)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Environmental-storytelling and dressing issue. You may run ONE dev
server on port **5355** only (`cd games/gnome-theft-auto && npx vite --port 5355 --strictPort`, background); stop it after.

## Goal
Gnomazon Fulfilment Centre FC-1 in the Dust Flats (site `gnomazon-fc`, rect x 215..285, z 72..108): the big shed with
loading docks, a lot and its stories outside, and the walk-in packing floor interior `gnomazon-floor` with shelving,
conveyors, packing stations (one is the player's "Clock in" spot), associates at work and KPI-9 on patrol.

## Read first
- `games/gnome-theft-auto/src/workplaces/gnomazon/warehouse.ts`: the stub (`warehouseDoor`, `buildWarehouseOutside`;
  this file is imported once by `workplaces/index.ts`, so `defineInterior` at module top level runs at start).
- `games/gnome-theft-auto/src/workplaces/gnomazon/types.ts`: `GNOMAZON_FLOOR_ID`, `GNOMAZON_START_EVENT`.
- `docs/roadmaps/gta-batch-3/E05/contracts.md` "Defining an interior": `defineInterior({ id, name, door, exit, size,
  theme, ambience, prompt, build(kit) })`, the kit (`room`, `door`, `put`, `block`, `window`, `sign`, `npc`, `spot`),
  large rooms, `gta:interior-say`.
- `games/gnome-theft-auto/src/workplaces/chef/kitchen.ts`: a finished E24 interior with `putIf` (skip missing prefabs).
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: exterior props on clear ground, colliders, `coastSign`.

## Change
- `games/gnome-theft-auto/src/workplaces/gnomazon/warehouse.ts`:
  - `buildWarehouseOutside(scene, world)` (idempotent): `gnomazon-warehouse` (modelled at HALF size, 25 x 13 x 4.5 with
    its front on +z: build it with `buildPrefab('gnomazon-warehouse', { scale: 2 })` for 50 x 26 x 9 m) centred in the
    site with its front (logo, door, docks) facing east (+x) toward the road at x ~302 (rotation.y = pi/2); the door at
    `warehouseDoor()` (the `door` anchor: keep the interior door prompt there, on walkable ground just outside the
    front); colliders for the shed (leave the door spot outside them); the lot at the `lot` anchor with a few parked
    vans/cars as props if a prefab fits (grep 'van'), `gnomazon-returns-pile` by the docks.
  - Signs (`coastSign`): "GNOMAZON FC-1 - EVERYTHING, EVENTUALLY", "NOW HIRING (ALWAYS)", "ASSOCIATE PARKING (ALL 4
    SPACES)", "SAFETY IS OUR #2 PRIORITY".
  - Three outside vignettes (props only): (1) the drone in the hedge: `gnomazon-delivery-drone` stuck in a bush beside
    the lot, its box on the ground; (2) a lonely picnic bench marked by a sign "BREAK AREA (PILOT)" with one cold cup;
    (3) a tall stack of identical returned hats in boxes (`gnomazon-returns-pile`) with one box opened and the hat on a
    traffic cone.
  - Interior: `defineInterior({ id: GNOMAZON_FLOOR_ID, name: 'Gnomazon FC-1', prompt: 'Clock in at Gnomazon',
    door: warehouseDoor(), exit: 2 m further out from the door, size: { w: 36, d: 24, h: 8 }, theme: cool warehouse
    (pale grey floor, grey walls, orange trim, white light), ambience: 'silent' or an office-like bed if listed,
    build(kit) { ... } })`:
    - Rows of `gnomazon-shelf-rack` (aisles 3 m wide), two `gnomazon-conveyor` lines (end to end) with boxes, a row of
      four `gnomazon-packing-station`s facing the conveyor; station 1 is the player's: `kit.spot({ id: 'gnomazon-pack',
      x, z, prompt: 'Clock in (pack parcels)', run: () => window.dispatchEvent(new CustomEvent(GNOMAZON_START_EVENT)) })`.
    - Associates: three `kit.npc` gnomes at the other stations (orange vests, lanyard-coloured shirts), each with a
      `line` when talked to ("Day 900 of my seasonal contract.", "I packed a box inside a box once. Kippy loved it.",
      "The break room is coming soon. I have seen the plans. It is a chair."); one more pushing a tote in an aisle.
    - KPI-9: `kit.put('kpi-9-manager-bot', ...)` near the stations (a prop; the runtime may move it later), plus a
      big wall screen block (glowing, `kit.block` with an emissive colour if the kit allows, else a sign) showing
      "UNITS PER HOUR: GREAT!".
    - Signs: "SMILE: YOU ARE ON KPI", "BREAK ROOM: COMING SOON" (`gnomazon-break-room-sign` beside a door outline),
      "IF IT FITS, IT SHIPS. IF IT DOES NOT FIT, ALSO SHIPS.", "ASSOCIATE OF THE MONTH: KPI-9".
    - Three inside vignettes: (1) the box-in-a-box tower: nested open boxes small to large on a pallet; (2) the
      birthday at station 4: one cupcake with a candle on a packing bench and a single "HAPPY BIRTHDAY" streamer;
      (3) the suggestion box: an overflowing `gnomazon-box-m` labelled "SUGGESTIONS" sealed with a lot of tape.
- Check it: temporarily call `buildWarehouseOutside(deps.scene, deps.world)` from `gnomazon/runtime.ts`'s stub
  `update` (first frame), dev server on 5355, then from the repo root
  `node tools/gta-shots.mjs "http://localhost:5355/?offline&no-intro" C:/Users/cpsai/AppData/Local/Temp/e25-fc front:300,84,-1.57 lot:290,60,-0.8`
  and `node tools/gta-shots.mjs "http://localhost:5355/?offline&no-intro&interior=gnomazon-floor" C:/Users/cpsai/AppData/Local/Temp/e25-fc floor:0,0,0`
  (interior shot spots are local; adjust after reading how E24 shot `le-petit-groan`), look at the PNGs. **Revert
  `gnomazon/runtime.ts` to the stub** before you finish.

## Contract
`warehouseDoor()`, `buildWarehouseOutside(scene, world)`; interior id `GNOMAZON_FLOOR_ID`; the spot dispatches
`GNOMAZON_START_EVENT`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `warehouse.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/interiors` passes.
- Screenshots looked at; `bash tools/smoke.sh "http://localhost:5355/?offline&no-intro&interior=gnomazon-floor" gta-gnomlet`
  reports no console errors; runtime.ts back to the stub; server stopped.

## Out of scope
`gnomazon/runtime.ts` (except the temporary line), `gnomazon/types.ts`, prefab catalogs, every other file.
