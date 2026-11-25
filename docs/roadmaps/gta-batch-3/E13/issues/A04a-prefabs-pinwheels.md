Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-pinwheel-campus-props.ts` holds Pinwheel Ridge's kit: a giant garden
pinwheel's mast and its rotor (separate, so the game can spin the rotor), Ragwort Coilspring's control hut, the
substation and a cable drum.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, shapes, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: finished GTA scenery prefabs to copy the style of.
- `packages/prefabs/src/catalog/gta-pinwheel-campus-props.ts`: the empty file you fill (`GTA_PINWHEEL_CAMPUS_PROPS`,
  already registered in `catalog/index.ts`).

## Change
In `GTA_PINWHEEL_CAMPUS_PROPS` (ids exact; category 'prop', uses ['place'], `footprint`; tags incl. 'gta', 'pinwheel', 'wind', 'ridge';
5 examine lines each, house voice: the pinwheels light Turfton's lamps and neon, never an engine; the HOA re-cabled the
Ridge; Ragwort Coilspring names each one):
- `giant-pinwheel-mast`: **authored at HALF size** (the game places it with `scale: 2`; game hub height 24 → author 12).
  A tall slender pole (white with red bands, a `cyl` 0.35 radius going thinner via two stacked cyls) on a square
  concrete plinth (2 x 2 x 0.5), a small maintenance door at the foot (+z), a ladder up one side (two thin rails and a
  few rungs), and at the top (centre at y 12) a round hub housing (a short fat `cyl` lying along z, front face at local
  z ~ +0.6) with a cap. No vanes (the rotor is separate). Largest side under 30.
- `giant-pinwheel-rotor`: **HALF size** (game radius 9 → author 4.5). The vanes of a giant garden pinwheel, lying in
  the x-y plane facing +z: four curled vanes (each two or three thin boxes at angles, like a folded paper pinwheel),
  alternating `tint` and `trim` colours (default tint 'red', trim 'yellow'), around a central pin cap (a small white
  ball). The rotor turns about its centre, **which must be at local (0, 4.5, 0)**: author it so its lowest point is
  y = 0 and its centre is exactly y = 4.5, x = 0, z = 0 (the game offsets it). Thickness (z) under 0.5.
- `pinwheel-control-hut`: life-size, ~3 x 3 x 2.6: a little tin hut with a pent roof, a door on +z, a window with a
  dial-covered control panel visible inside (two small coloured discs 0.03 behind the glass), a tiny pinwheel on the roof
  corner, a cable conduit running out of the back wall into the ground.
- `pinwheel-substation`: life-size, ~4 x 3 x 3: a grey transformer box with cooling fins (thin boxes 0.03 proud), three
  ceramic insulators on top (stacks of small discs), inside a chain-link fence (four thin frame posts and two thin rails
  per side, no panels touching the box), a yellow warning plate on the fence (blank; the game writes on it).
- `cable-drum`: life-size, a wooden cable spool ~1.3 tall on its rim: two big discs (flanges) and a core, wound with
  black cable (a slightly smaller dark `cyl` between the flanges), one loose end trailing.

## Contract
Ids exactly: `giant-pinwheel-mast`, `giant-pinwheel-rotor`, `pinwheel-control-hut`, `pinwheel-substation`, `cable-drum`.
The mast's hub centre is at local (0, 12, ~0.6) and the rotor's centre at local (0, 4.5, 0); both half size.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your five ids.
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (including `catalog/index.ts` and `gta-campus-props.ts`, another worker's).
