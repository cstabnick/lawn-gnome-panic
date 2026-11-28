Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-anthill-field.ts` holds the Anthill Observatory (dome building and its big telescope),
the ants' kit (a door into the mound, a sugar sack, a sugar-cube crate, an ant) and Rootwell Field's airfield kit (control
tower, windsock mast, runway edge light, runway number board, fuel cart).

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, shapes, `footprint`, `Category`, `Use`) and
  `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: finished GTA scenery prefabs to copy the style of (a building and
  small props, `footprint`, examine lines).
- `packages/prefabs/src/catalog/gta-anthill-field.ts`: the empty file you fill (already registered).

## Change
`GTA_ANTHILL_FIELD` gets (ids exact; all category 'prop', uses ['place'] unless said; life-size metres, i.e. game scale 1;
`footprint: { r, h }` on everything larger than 1 m; tags incl. 'gta' and 'rootwell'; 5 examine lines each in the house
voice: the ants are Rootwell's landlords, paid in sugar, they close their doors when the rent is late, they never speak,
"Not termites. Do not call them termites. They know.")
- `anthill-observatory`: the Anthill Observatory, round, 18 across, ~12 tall: a drum of pale stone (a `cyl` r 8.6, 5
  tall) under a white dome (a sphere/`ball` half above the drum: build it from a `cyl` + a squashed ball so the lowest
  point stays y = 0 and nothing is coplanar), a dark observing slit running up the dome toward +z (a thin dark box 0.04
  proud, tilted to follow the dome), a short brass telescope tube poking out of the slit, a door on +z in a small porch
  (a box 2.4 wide, 3 tall, 1.5 deep) with a brass star over it, three small round windows on the drum. Front (door) +z.
- `anthill-telescope`: the great telescope for inside the dome, ~6 long: a heavy cast pier (a stepped dark-green `cyl`),
  a fork mount, a long brass tube tilted ~35 degrees up toward +z with an eyepiece at the low end and a dew cap at the high
  end, a little step ladder beside the eyepiece. Footprint r ~3.
- `ant-door`: a round wooden door set into the side of the mound, ~2.2 tall: a dark earth frame ring (a `cyl` short and
  wide, stood upright so its face points +z and its lowest point is y = 0), a round plank door in it (a thinner disc 0.04
  proud), iron hinges, a tiny knocker shaped like a sugar cube (a small white box), a small brass letterbox slot.
- `sugar-sack`: a fat hessian sack ~0.9 tall (squashed ball + a tied neck), tied with string, a few white sugar cubes
  spilled at its foot. Also uses ['place', 'hold'] is NOT needed: just 'place'.
- `sugar-cube-crate`: an open wooden crate ~0.8 x 0.6 x 0.5 filled to the top with white sugar cubes (a grid of small
  white boxes standing 0.02 above the crate's inner floor, not coplanar with its rim).
- `rootwell-ant`: one garden ant, small (largest side ~0.3): three body segments (head, thorax, big abdomen: balls in a
  row along z, dark red-brown 0x5a1f12), six thin legs (mirror pairs), two bent antennae, carrying a white sugar cube on
  its back (a small white box). Category 'critter' if `Category` has it, else 'prop'. No footprint.
- `rootwell-control-tower`: "a very small tower": a square brick stalk 3 x 3, 7 tall, topped by a glazed cab 4 x 4 x 2.4
  (dark glass panes 0.03 proud on all four sides, white frame), a flat roof with a little radio mast and a beacon (a small
  `glow: true` red ball). A door on +z at the bottom. Footprint r ~2.5.
- `windsock-mast`: a 6 m pole on a concrete base with a swivel at the top and an orange-and-white striped cone windsock
  streaming toward +x (4-5 short cylinders getting thinner, alternating orange/white, each tilted a little down).
- `runway-edge-light`: a squat runway edge light ~0.45 tall: a short grey frangible post and a clear dome (a small
  `glow: true` pale-yellow ball). Tint optional. No footprint.
- `runway-number-board`: a painted board on two legs, ~2.4 wide, 1.2 tall, white with a dark border, standing beside a
  runway threshold (the game writes the numbers on it with a text plate: leave the face plain).
- `fuel-cart`: a little aviation fuel trailer ~2.6 long: a red tank (a `cyl` lying along z), two wheels, a tow bar, a
  coiled hose reel on the back, a 'no smoking' disc (a small white disc with a red ring, 0.03 proud).

## Contract
Ids exactly: `anthill-observatory`, `anthill-telescope`, `ant-door`, `sugar-sack`, `sugar-cube-crate`, `rootwell-ant`,
`rootwell-control-tower`, `windsock-mast`, `runway-edge-light`, `runway-number-board`, `fuel-cart`. All life-size
(largest side under 30; `anthill-observatory` is about 18 across), front +z.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your eleven ids (failures in other workers' ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (including `catalog/index.ts`, other catalog files, anything under `games/`).
