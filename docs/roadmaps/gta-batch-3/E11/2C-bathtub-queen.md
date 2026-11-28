Epic: 2 Places and rides
Depends on: epic 1 (prefabs `bathtub-queen`, `ship-cannon`, `ship-anchor`, `wooden-chest` exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. Other workers edit `src/coast/boardwalk.ts`
(it builds Long Spoon Pier: walkable rooftops `long-spoon-handle` and `long-spoon-bowl` at `COAST.pier.deckY`, with a
6 m rail gap on the bowl's south side at x 297..303), `src/coast/spokewheel.ts`, `src/tubing/*`, `packages/achievements`,
`src/mapPois.ts` at the same time. You own only the files listed under Change.

## Goal
The Bathtub Queen lies moored south of Long Spoon Pier: a big toy pirate ship you walk aboard over a gangplank, with a
walkable deck, solid masts, cabin and cannons, Captain Samphire Bilge's cabin as an interior, and the treasure chest the
treasure quest needs.

## Read first
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.ship`: deck rect, `deckY`, gangplank rect, `cabinDoor`,
  `treasureLocal`, `cannons`; `COAST.pier`).
- `games/gnome-theft-auto/src/coast/pirateShip.ts` (stub: keep both signatures) and `src/coast/types.ts` (`CoastPart`).
- `packages/prefabs/src/catalog/gta-coast.ts` `bathtub-queen`: **bow at +z, deck top at y 0.4, hull 3.0 long (z) x 1.0
  beam (x), stern cabin box at local z -1.45..-0.85, y 0.4..0.75**.
- `games/gnome-theft-auto/src/pardonlin/wickets.ts`: `place()` / `solid()` pattern and `boxes.push({ minX, maxX, minZ,
  maxZ, h })` (h = top of the collider in world y; a collider stands from far below up to h).
- `games/gnome-theft-auto/src/interiors/rooftops.ts` `addRooftop({ id, name, minX, maxX, minZ, maxZ, y, solid: false,
  parapet: false })`: a walkable deck the player stands on when the feet are at most 2 m below it.
- `docs/roadmaps/gta-batch-3/E05/contracts.md` "Defining an interior" (`defineInterior({ id, name, door, exit, size,
  theme, ambience, prompt, build(kit) })`, `kit.room()`, `kit.door()`, `kit.put(prefabId, x, z, yaw, opts)`,
  `kit.sign()`, `kit.npc({ id, name, x, z, yaw, line })`, `kit.spot({ id, x, z, prompt, run })`), and one showcase room
  for style: `games/gnome-theft-auto/src/interiors/showcase/` (pick the smallest file).
- `docs/lore/entries/apocrypha/the-bathtub-queen.md`, `samphire-bilge.md` (tone: tours by day, smuggling by night).
- `games/gnome-theft-auto/src/coast/sign.ts` `coastSign`.

## Change
1. `src/coast/pirateShip.ts`:
   - `buildPirateShip(scene, boxes)`: place `bathtub-queen` (`buildPrefab(id, { lights: false })`) scaled **S = 16**,
     `rotation.y = Math.PI / 2` (bow to +x), at (COAST.ship.x, deckY - 0.4 * S, COAST.ship.z): its deck top is then at
     `COAST.ship.deckY` and it spans the `COAST.ship.deck` rect. Check by computing the Box3 and adjust x/z if the prefab is
     off-centre. Add a gentle visual-only roll is NOT wanted (the deck is a static rooftop): keep it still.
   - Walkable deck: `addRooftop({ id: 'bathtub-queen-deck', name: 'The Bathtub Queen', ...COAST.ship.deck, y: deckY,
     solid: false, parapet: false })` and the gangplank `addRooftop({ id: 'bathtub-queen-gangplank', ...COAST.ship.gangplank,
     y: deckY, ... })` drawn as a plank box (0.25 thick, top at deckY + 0.01 so it is not coplanar with the bowl or deck)
     with two rope rails.
   - Colliders (`boxes.push`): the rails round the deck edge (thin boxes, h = deckY + 1.1) with a gap at the gangplank
     (x 297..303 on the north edge); the stern cabin as a box (world x from the prefab's cabin part: roughly 276..286,
     z 1261..1275, h = deckY + 0.35 * S); each mast as a 1 x 1 m box (h = deckY + 30); the hull below the deck as one box
     per side so swimmers and boats bump it (h = deckY - 0.1, so it never blocks walking on the deck).
   - Cannons: `ship-cannon` (scale ~3) at each `COAST.ship.cannons` spot on the deck, muzzle facing south (+z, out to sea),
     y = deckY; small solid colliders (h = deckY + 1). An `ship-anchor` (scale ~3) hanging off the bow on a rope (a thin
     cylinder down to the water), and one lying on the beach at (360, 1175) for the beach vignette.
   - Signs: on the bowl by the gangplank `coastSign('PIRATE TOURS AT NOON\nCargo at midnight.\nDo not mix them up.', ...)`,
     and on the deck `coastSign('MIND THE RAIL\nIt is not a real rail.\nIt is mine. - Capt. S. Bilge', ...)`.
   - `installPirateShip(deps)`: define the interior `bathtub-queen-cabin` with `defineInterior` (call it once, at install),
     name "Captain Bilge's Cabin", door `COAST.ship.cabinDoor` (the door prompt shows on the deck in front of the cabin; the
     interior system puts the player back at `exit`; give `exit` = 2 m in front of the door, on the deck, and if the exit
     lands the player on the ground below instead of the deck, set the leave point with `leaveInterior({ x, y: deckY, z, yaw })`
     from `onLeave` or the exit's own y if the contract supports it — read `src/interiors/types.ts` for the exact fields),
     size about 14 x 10 x 4, theme 'club' or custom warm wood colours, ambience 'silent'. Furnish with prefabs (a table,
     chairs, a `barrel` or two, `rope-coil`, maps on the wall with `kit.sign`, a bunk) and a `wooden-chest` at
     `COAST.ship.treasureLocal`. Put `kit.npc({ id: 'samphire', name: 'Captain Samphire Bilge', ..., line: 'Every cargo is honest. Some of it was just not yet yours.' })`.
     Add `kit.spot({ id: 'queen-treasure', x, z (next to the chest), prompt: 'Open the sea chest', run })`: dispatch
     `window.dispatchEvent(new CustomEvent('gta:queen-chest'))` and toast through `gta:interior-say` with Samphire's name
     and a line ("Not that one. That one is for the tourists."). The quest issue listens for `'gta:queen-chest'`.
   - `blips()`: `{ x: COAST.ship.x, z: COAST.ship.z, color: '#d8342c', label: 'The Bathtub Queen' }`.
2. `src/coast/pirateShip.test.ts` (new): after `buildPirateShip(new THREE.Scene(), boxes)`, `rooftopById('bathtub-queen-deck')`
   exists at `deckY`; `rooftopSurfaceBelow(300, 1268, deckY + 1)` is deckY; the gangplank rooftop joins the pier bowl
   (its minZ <= `COAST.pier.bowl.maxZ` and maxZ >= `COAST.ship.deck.minZ`); no rail collider overlaps the gangplank rect;
   `waterDepthAt(COAST.ship.x, COAST.ship.z) > 1` (the ship floats in water).

## Contract
`buildPirateShip(scene, boxes): void`, `installPirateShip(deps: JobsDeps): CoastPart`; interior id `bathtub-queen-cabin`;
rooftop ids `bathtub-queen-deck`, `bathtub-queen-gangplank`; window event `'gta:queen-chest'` when the chest is opened.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/coast/pirateShip.test.ts
  src/interiors` passes.

## Out of scope
`src/coast/config.ts` (report if a number must change), `index.ts`, `types.ts`, `sign.ts`, other coast modules,
`src/interiors/*` (use their API only), `app.ts`, `world.ts`, the prefab catalog.
