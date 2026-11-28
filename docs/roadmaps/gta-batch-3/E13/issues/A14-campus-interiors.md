Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): interiors and roofs

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Three Rootwell buildings can be walked into (E05 interiors): the Long Shelf library (`uni-library`), the Crucible Block
labs (`uni-lab`) and Tilth Hall's lecture theatre (`uni-lecture`), each a small furnished story with a resident; and two
roofs are walkable: Plumbob Hall's flat roof with its helipad (`plumbob-roof`, a landing pad for aircraft) and Tilth
Hall's roof (`tilth-roof`), reached by stairs from inside the lecture theatre.

## Background (confirmed)
- E05 contract (`docs/roadmaps/gta-batch-3/E05/contracts.md`, read the "Defining an interior" and "Rooftops" sections):
  `defineInterior({ id, name, door, exit, size: { w, d, h }, theme, ambience?, prompt?, build(kit) })` at import time;
  the kit: `room()`, `door(x, z, yaw)`, `put(prefab, x, z, yaw, opts?)`, `block(w, h, d, x, z, { y, color, solid })`,
  `window(x, z, yaw)`, `sign(text, x, y, z, yaw, { w, h })`, `npc({ id, name, x, z, yaw, line })`,
  `spot({ id, x, z, prompt, run })`, `stairsTo(x, z, target, prompt)` where target is another interior id or a world
  point `{ x, y, z, yaw }`. Room local coordinates: origin at the room centre on the floor. `addRooftop(def)` from
  `../interiors` (or `../interiors/rooftops`): `{ id, name?, minX, maxX, minZ, maxZ, y, solid, parapet, pad? }`;
  `addInteractSpot({ x, z, y, prompt, run })` from `../interactables` for the way back down from a roof (its `y` keeps
  people on the ground from seeing the prompt); `enterInterior(id)` from `../interiors`.
- A finished example of several interiors with stories: `src/pardonlin/interiors.ts` (themes, `putIf` for prefabs that
  may still be missing, a resident's rotating lines via `gta:interior-say`).
- Contract places (`src/campus/types.ts`): `CAMPUS_BUILDINGS` rows `long-shelf` (door (1110, -277.5) yaw 0),
  `crucible-block` (door (1180, -122.5) yaw PI), `tilth-hall` (door (1110, -125.5) yaw PI; centre (1110, -112), w 36,
  d 24, h 11, yaw PI), `plumbob-hall` (centre (1180, -292), w 28, d 24, h 10, yaw 0). `ROOTWELL_ROOMS` gives each
  room's size and named local spots: `uni-library` { size 24 x 16 x 6, door [0, 7.8], librarian [0, -4],
  essayDesk [7, 3] }, `uni-lab` { 20 x 14 x 5, door [0, 6.8], bench [-5, -2] }, `uni-lecture` { 24 x 18 x 7, door [0, 8.8],
  lectern [0, -6], roofStairs [-10, -7] }. **Quests visit `librarian` and `essayDesk` (another worker): keep them free
  and reachable** (no prop within 1.2 m).
- The buildings are prefabs placed with `scale: 2`; the world collider of each building is its footprint, top at
  ground + h. Plumbob Hall's flat roof top is at ground + 10 (footprint x 1166..1194, z -304..-280; a helipad circle is
  painted at its centre), Tilth Hall's at ground + 11 (footprint x 1092..1128, z -124..-100; a 2.4 m stair hut stands on
  the roof near its north-east corner at about (1124, -104): put your roof arrival point beside it, e.g. (1121, -107)).
  Both prefabs have their own 1 m parapets: `parapet: false`.
- Prefabs: existing `bookshelf`, `library-ladder`, `reception-desk`, `office-desk`, `filing-cabinet`, `lectern`,
  `pendant-lamp`, `lamp`, `crate`, `bench`; new E13 ones being added now (use `putIf`): `book-pile`, `lab-bench`,
  `lecture-bench-row`, `chalk-equation-board`, `essay-page`.

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md` (sections above).
- `games/gnome-theft-auto/src/pardonlin/interiors.ts` (style and helpers).
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/interiors.ts` (stub: keep `addCampusRooftops(): void`).
- `games/gnome-theft-auto/src/interiors/types.ts` (`InteriorKit`, `InteriorTheme`, the rooftop type).

## Change
`src/campus/interiors.ts`:
- `uni-library` "The Long Shelf" (theme: warm wood and green-shaded lamps): rows of `bookshelf`s (the long shelf the
  library is named after: one shelf run along the whole north wall), a `library-ladder`, reading tables with `book-pile`s,
  the librarian at `librarian` (npc, name 'The Librarian', rotating lines on talk via `say`, e.g. "Shh. That was the
  quiet part."; "Overdue? Everything here is overdue. The building is overdue."), a sign "SILENCE\n(EXCEPT THE ANTS)",
  `essayDesk` left clear with a lamp beside it.
- `uni-lab` "the Crucible Block" (theme: white tiles, black benches): `lab-bench`es in rows with flasks, a scorched patch
  on the ceiling (a dark block on the ceiling), a `chalk-equation-board` with a sign "GRAVITY: PROVISIONAL", a student
  npc at `bench` ('A Chemistry Student': "It was supposed to go up. It went sideways. Sideways is still a result.").
- `uni-lecture` "Tilth Hall" (theme: stone and oak): tiers of `lecture-bench-row` stepping up toward the door end (use
  `block` daises for the tiers so the rows sit on them; no shared faces), the `lectern` at `lectern`, a big
  `chalk-equation-board` behind it, a professor npc ('Dr Clod Furrow' or a name you check with `npm run lore -- find`
  first; if you invent one, say so in your report) mid-lecture on "the physics of gnomes: why we fall over and how to
  do it better", and the roof stairs at `roofStairs`: `kit.stairsTo(-10, -7, { x: 1121, y: <Tilth roof y>, z: -107,
  yaw: Math.PI }, 'Up to the roof')`. The roof y is `heightAt(1110, -112) + 11` computed at run time (inside `build`,
  not at module top level).
- `addCampusRooftops()` (called while the world is built, before `buildRooftops`): `addRooftop` for
  `plumbob-roof` { name 'Plumbob Hall roof', x 1166..1194, z -304..-280, y ground + 10, solid true, parapet false,
  pad { x 1180, z -292, r 5 } } and `tilth-roof` { name 'Tilth Hall roof', x 1092..1128, z -124..-100, y ground + 11,
  solid true, parapet false } (ground = `heightAt` at the centre). Also an `addInteractSpot` on the Tilth roof at
  (1121, -107) with `y` = the roof y, prompt 'Go back down', run: `enterInterior('uni-lecture')`.
- Doors: each interior's `door` (world) = its building's `door` spot, `exit` = the same spot; inside, `kit.door(...)` at
  the room's `door` local point facing into the room.
- New `src/campus/interiors.test.ts` (vitest; see `src/interiors/interiors.test.ts` for how interiors are built in a test):
  the three ids are defined (`interiorById`); building each room's kit works without throwing; `addCampusRooftops()`
  makes `rooftopById('plumbob-roof')` with a pad and `rooftopById('tilth-roof')`; `landingPads()` includes
  `plumbob-roof`.

## Contract
Interior ids `uni-library`, `uni-lab`, `uni-lecture`; rooftop ids `plumbob-roof`, `tilth-roof`; the `ROOTWELL_ROOMS`
spots kept clear; `addCampusRooftops(): void`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/interiors.test.ts src/interiors` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/interiors*.ts`.

## Out of scope
Every other file (the observatory interior is another worker's: `src/campus/observatoryInterior.ts`).
