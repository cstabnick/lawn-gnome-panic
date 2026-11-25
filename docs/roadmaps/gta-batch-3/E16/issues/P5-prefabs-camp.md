Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-camp.ts` holds the hunter-camp kit: a canvas tent, a plank shack, a deer
stand, a duck blind, a kettle on a tripod, a bedroll, a camp stool, a game feeder, a shed antler and a lantern post.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-hunt-gear.ts` and `gta-hunt-quarry-b.ts` (hunting style: tufts, the Tuft & Tally
  lodge's kit) and `packages/prefabs/src/catalog/gta-fringe-kit-b.ts` (rough fringe props).
- `packages/prefabs/src/catalog/gta-country-camp.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_CAMP` gets (category 'prop', uses ['place'], tags incl. 'camp', 'hunter', 'gta'; `emoji: []`; 5 examine lines
each in the house voice: Turfton's hunters hold a Tuft & Tally licence: they knock an animal over in a puff, comb a tuft
of fur from it and let it run off; nothing is hurt; their camps are untidy, cosy and full of tea). Colours: canvas
(0xc9b98f), olive (0x6b7a3a), weathered plank (0x7a6248), tin (0x9aa0a6). Lowest point y = 0, centred, front +z.
- `hunter-tent` "Hunter's tent": an A-frame canvas tent 2.6 long (z) x 2 wide, ridge ~1.5, two tilted canvas panels
  meeting at the ridge (they must not overlap each other's faces: leave a 0.02 gap at the ridge and cover it with a
  thin ridge pole), the +z end flap tied open showing a dark inside panel, guy lines (thin boxes) to pegs.
- `hunter-shack` "Hunter's shack" (`footprint`): exactly 4 x 3, plank walls 2.4, a sloped tin roof (high at the front),
  a plank door on +z with a set of shed antlers nailed above it, a small window with a sacking curtain, a stovepipe on
  the roof, a woodpile against the -x wall.
- `deer-stand` "Deer stand": a raised wooden platform 1.6 x 1.6 at 3 m on four posts with diagonal braces, a waist-high
  rail on three sides, a camo skirt (olive thin boxes) round the rail, a ladder up the +z side, a thermos on the deck.
- `duck-blind` "Duck blind": a low hide 2.5 wide x 1.6 deep x 1.4 tall of reed bundles (many thin tilted tan cylinders)
  with a long viewing slot on +z and a duck decoy (a small duck shape: a flattened ball body and a ball head) in front.
- `camp-tripod-kettle` "Kettle on a tripod": three poles leaning together to ~1.4 with a chain and a black kettle
  hanging at ~0.6 (the game puts a `campfire` under it).
- `camp-bedroll` "Bedroll": a rolled-out sleeping bag 1.9 x 0.7 x 0.12 (olive) with a pillow end and a tartan blanket
  folded on it; flat on y = 0 (not coplanar with the ground: lowest point exactly 0, thickness 0.12).
- `camp-stool` "Camp stool": a folding stool ~0.5 tall with a canvas seat.
- `game-feeder` "Game feeder": a wooden hopper box on four legs ~1.5 tall with a little tin roof and spilled corn on a
  tray below.
- `antler-shed` "Shed antler": one cast antler ~0.9 long lying on the ground (a curved beam of 3 tilted cylinders with
  3 tines), bone colour.
- `camp-lantern-post` "Lantern post": a stick ~1.6 tall pushed into the ground with a hanging tin lantern (warm yellow
  'glow' pane allowed) on a hook.

## Contract
Ids exactly: `hunter-tent`, `hunter-shack` (4 x 3 plan, door on +z), `deer-stand` (platform at 3 m, ladder on +z),
`duck-blind`, `camp-tripod-kettle`, `camp-bedroll`, `camp-stool`, `game-feeder`, `antler-shed`, `camp-lantern-post`.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
