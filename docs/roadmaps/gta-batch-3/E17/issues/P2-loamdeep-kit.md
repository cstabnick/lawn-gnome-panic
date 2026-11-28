Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first. For the prefab format read `docs/roadmaps/prefab-library/_common.md`
(IGNORE its "Environment" section).

## Goal
The architecture kit of Loamdeep (the moles' underground town) and the Burrow Door on the surface exists as prefabs.

## Read first
- `docs/roadmaps/prefab-library/_common.md`
- `packages/prefabs/src/types.ts` (PrefabDef, Part shapes; `emissive` / glow fields if present: grep `emissive`)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (a recent GTA kit file: copy its structure)
- `packages/prefabs/src/catalog/gta-loamdeep.ts` (yours: empty `GTA_LOAMDEEP`, already registered)

## Change
- `packages/prefabs/src/catalog/gta-loamdeep.ts`: fill `GTA_LOAMDEEP` with exactly these ids (tags include 'loamdeep',
  'mole', 'gta'; earthy browns, pale root wood, brass; warm and tidy, never grim). Front faces +z.
  - `burrow-mound` "Burrow Mound": a grassy dome 11 m across, 2.6 m tall, with a flattened bare-earth face on its +z
    side (2.4 m wide, 2.2 m tall) where the door sits; a few roots poking out. category 'prop' (scenery).
  - `burrow-door-round` "The Burrow Door": a round stone door 1.9 m across in a ring frame of root wood, slightly ajar
    (turned ~10 degrees), a small brass knocker low down (mole height). 0.4 m deep.
  - `root-arch` "Root Arch": an arch of gnarled pale roots framing a tunnel mouth, 4.4 m wide, 3.8 m tall, 0.6 m deep,
    open in the middle (two root posts and a curved top of several root pieces).
  - `mole-lamp` "Mole Lamp (unlit)": a small brass lantern with clear glass on a curled root bracket, as fixed to a
    wall: 0.35 m wide, 0.6 m tall, 0.35 m deep (back of the bracket at local z -0.17). Wick dark.
  - `mole-lamp-lit` "Mole Lamp (lit)": the same shape exactly, with warm glowing glass and a flame (emissive warm amber,
    if the format supports emissive; otherwise a bright pale-yellow glass).
  - `lamp-taper` "Lamp Taper": a long thin taper on a brass holder, 0.8 m long, for lighting lamps.
  - `root-bundle` "Bundle of Roots": pale roots tied with twine, 0.6 m long (something a gnome carries).
  - `root-crate` "Root Crate": a slatted crate 1 x 0.6 x 0.7 m full of sorted pale roots, a chalk tag on the front.
  - `dug-speaker` "Dug-In Speaker": a big black speaker cone half-sunk into a mound of packed earth, cable going into
    the ground, 1.2 m wide, 1.1 m tall (DJ Moleman's speakers: "a speaker in the soil is a fact").
  - `dig-face` "Dig Face": a patch of loose, freshly turned soil on a wall, 2 m wide, 1.8 m tall, 0.4 m deep, with a
    wooden peg sign stuck in it (the game writes "DIG HERE, IF IT PLEASES YOU" itself) and a small trowel leaning on it.
  Each with `about` ("Gnome Theft Auto: ...") and 4-6 gently funny `examine` lines.

## Contract
Prefab ids exactly as above. `mole-lamp` and `mole-lamp-lit` have identical bounds (the game swaps one for the other).

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Other catalog files, `catalog/index.ts`, anything under `games/`.
