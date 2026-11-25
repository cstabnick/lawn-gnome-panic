Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/croft.ts` builds Windfall Croft's static scenery: the run-down fence with its gate,
the farmhouse and barn, eight soil beds, the stall, the seed rack, the For Sale board, the water butt, the orchard with
its windfalls over the south wall, a scarecrow, and three vignettes, with colliders. (Plants in the beds, the oak and
the For Sale text are another worker's: they change as the player farms.)

## Read first
- `games/gnome-theft-auto/src/farm/types.ts`: `CROFT` (site x 60..140, z 505..565; `gate` (60.5, 535) facing west;
  `forSale` (64, 541); `stall` (68, 526); `seedRack` (69, 547); `waterButt` (77, 532); `oak` (118, 534) with 8 m
  clear; `farmhouse` (128, 513) 14 x 10 door west; `barn` (128, 553) 14 x 12 doors west; `orchard` x 66..116,
  z 556..563; `story` spots (110, 512), (80, 510), (135, 534)), `BEDS` (8 beds, 3 x 8 m, centres x 84/91/98/105,
  z 522 and 542), `BED`.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `HomePiece`, `textPlate`.
- Prefabs (`packages/prefabs/src/catalog/gta-country-croft.ts`, read sizes): `croft-farmhouse` (14 x 10, door +z),
  `croft-barn` (14 x 12, doors +z), `croft-bed` (3 x 8 x 0.25, soil top at 0.22), `croft-stall`, `croft-seed-rack`,
  `croft-for-sale`, `croft-water-butt`, `croft-apple-tree`, `croft-fence` (4 m along local x), `croft-scarecrow`;
  existing `hay-bale`, `wheelbarrow`, `watering-can`, `crab-apple`, `cart` or `hay-cart` (grep), `bench`.

## Change
`src/country/croft.ts` (keep `export function buildCroft(scene, boxes): void`):
- Fence: `croft-fence` runs round the site 1 m inside its edge (yaw 0 along x sides, PI/2 along z sides), leaving an
  8 m gap at the gate (x 61, z 531..539). One thin collider per fence side (0.2 thick, h 1.1), none across the gate.
  A gate sign on a post outside the gap: `textPlate` "WINDFALL CROFT" (cream on faded green).
- Farmhouse at `CROFT.farmhouse` with yaw -PI/2 (front faces west). A quarter turn swaps the prefab's 14 x 10 plan to
  10 along x and 14 along z: collider x 123..133, z 506..520, h 7; keep its west door spot (121.5, 513) clear. Barn at
  `CROFT.barn` with yaw -PI/2: collider x 122..134, z 546..560, h 8.
- Beds: `croft-bed` at every `BEDS[i]` (yaw 0: its 8 m runs along z), `solid: false` (the player walks onto beds to
  plant; no colliders).
- `croft-stall` at `stall` (yaw -PI/2), `croft-seed-rack` at `seedRack` (yaw -PI/2), `croft-for-sale` at `forSale`
  (yaw -PI/2: its face looks west to the road), `croft-water-butt` at `waterButt`; small colliders from `buildPieces`.
- Orchard: five `croft-apple-tree`s along the south wall inside `orchard` (x 70, 82, 94, 106, 114; z ~559), colliders
  for their trunks only (0.8 x 0.8, h 3); and 8-10 `crab-apple` prefabs lying OUTSIDE the south fence (z 566..570) and a
  few inside (windfalls rolling over the wall), `solid: false`.
- Oak spot: a small ring of stones or a bare soil patch decal at `CROFT.oak` (`flatLayer(material, LAYER.decal)`,
  radius 1.2, its own material, 0.03 above ground); nothing else within 8 m of it.
- A worn dirt track decal from the gate to the beds and the farmhouse door (`LAYER.road`, its own material, 0.04 above
  ground), and a farmyard patch decal in front of the barn (`LAYER.area`, its own material, 0.03).
- `croft-scarecrow` at (78, 540) facing west (the Levelright hard hat it wears is the joke).
- Vignettes (readable without text, within 4 m of each `CROFT.story` spot, existing prefabs):
  1. (110, 512) "The last owner left": a hand cart loaded with a trunk, a lamp and a birdcage, one wheel off and lying
     beside it, a hat on the handle (they left in a hurry and did not come back for the cart).
  2. (80, 510) "The bargain is the weeds": a wheelbarrow overflowing with pulled weeds, a fork stuck in the ground, and
     a patch of weeds (small green tufts or `dandelion`-like plants, NOT mowable kinds with colliders) still standing in
     a perfect ring around it.
  3. (135, 534) "The apples stayed": three crates stacked by the farmhouse's south-east corner, all full of apples, with
     a hand-written price board (`textPlate` "APPLES FREE. PLEASE.") leaning on them.
- Push every collider into `boxes`.

## Contract
`buildCroft(scene, boxes)` unchanged. Nothing solid on any bed, within 8 m of `CROFT.oak`, within 1.5 m of `stall`,
`seedRack`, `forSale` fronts (the player stands there to press E), or in the gate gap.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/flora src/sites.test.ts` passes.
- A temporary vitest file (deleted afterwards) runs `buildCroft(new THREE.Scene(), boxes)` and asserts no box covers a
  bed centre, the oak spot, the gate (61, 535) or the points 1.5 m west of the stall, seed rack and For Sale board.

## Out of scope
`src/farm/*` (the living farm: plants, the oak, prompts, the For Sale text), `src/country/types.ts`, every other file.
