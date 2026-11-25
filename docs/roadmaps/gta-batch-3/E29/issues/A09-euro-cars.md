Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Three drivable European car prefabs exist in `packages/prefabs/src/catalog/gta-euro-fleet.ts`: the Petit Pois (a tiny
city hatchback), the Deux-Pots (a boxy corrugated car with a roll-back canvas roof) and the Crepe Van (a corrugated food van).

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts` (`pivots`, `seat`, `DamageStage`), `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-odd-rides.ts` (vehicle prefabs: `wheel-<n>` pivots with a wheel part in each group,
  `steer` group, `seat`, two damage stages, a `smoke()` helper; copy that pattern)
- `packages/prefabs/src/catalog/gta-story.ts` lines 150-200 (`hoa-van`: a closed van with `door-left` / `door-right` pivots
  hinged at the door's front edge and a door panel part in each group)

## Change
- `packages/prefabs/src/catalog/gta-euro-fleet.ts`: the file exists with `export const GTA_EURO_FLEET: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with three prefabs. Each: `category: 'prop'`, `uses: ['place', 'sit']`, tags include
  `'vehicle'`, `'gta'`, `'euro'`; body panels `c: 'tint'` (set `tint`), front nose toward +z, two damage stages
  (`dented`: darken 0.25, one dent part, one small morph; `wrecked`: darken 0.6, sink 0.04, hide one wheel group,
  smoke puffs), as in gta-odd-rides.ts. Modelled small (the game scales them, see scale below). Max 40 parts.
  The game's config (already written) relies on these EXACT numbers: seat, pivots, door pivots and sizes.

### `gta-euro-hatch` — name 'Petit Pois' (game scale 1.8)
- Size: 0.7 wide (x -0.35..0.35), 0.75 tall, 1.1 long (z -0.55..0.55). tint 0x8fbf4a (pea green), trim 0xf3efe6.
- `seat: [0.15, 0.22, -0.08]` (driver on the left, +x; a passenger seat box mirrored at -0.15).
- `pivots`: `'wheel-0': [-0.33, 0.1, -0.36]`, `'wheel-1': [0.33, 0.1, -0.36]`, `'wheel-2': [-0.33, 0.1, 0.36]`,
  `'wheel-3': [0.33, 0.1, 0.36]` (one tyre cyl r 0.1, 0.07 wide, `rot: [0, 0, 90]`, in each group; the tyre's outer
  face may poke 0.02 past the body side, that is fine), `'door-left': [0.355, 0.32, 0.17]`,
  `'door-right': [-0.355, 0.32, 0.17]` (hinges at the door's front edge).
- Door panels: in group `door-left` a box `d: [0.03, 0.3, 0.34]` at `[0.36, 0.32, 0]` (tint) with a little window box
  0.04 proud; the same mirrored at x -0.36 in group `door-right` (write both, do not use `mirror` on grouped parts).
- Look: a rounded little two-box hatchback: lower body box, a narrower glass cabin (`'glass'`) with a roof panel (trim
  white roof), a short sloped bonnet (wedge), round headlamps, a stripe, a tiny spare wheel on the tailgate, a pea-pod
  shaped roof box with three peas (green balls) poking out as a joke. A steering wheel inside: a ring r 0.07 at
  `[0.15, 0.42, 0.1]`, `rot: [-60, 0, 0]` (no group; the driver's hands are not posed in this car).
- No part from the body may sit flush with a door panel: the body side faces are at x = +-0.35, the door panels'
  outer faces at +-0.375.

### `gta-deux-pots` — name 'Deux-Pots' (game scale 1.7)
- Size: 0.75 wide, 0.85 tall to the top of the furled roof, 1.3 long (z -0.65..0.65). tint 0x9aa3ab (grey), trim 0xb0372f.
- Open top: a roll-back canvas roof furled at the back (a fat pill along x, trim colour) behind the seats.
- `seat: [0.16, 0.24, -0.12]`. Seats: two front seat boxes (driver +x, passenger -x at -0.16) and a rear bench at z -0.44.
- `pivots`: wheels like the hatch but at x +-0.36, y 0.11 (r 0.11), z +-0.42: `'wheel-0': [-0.36, 0.11, -0.42]`,
  `'wheel-1': [0.36, 0.11, -0.42]`, `'wheel-2': [-0.36, 0.11, 0.42]`, `'wheel-3': [0.36, 0.11, 0.42]`;
  `steer: [0.16, 0.45, 0.15]` with the steering parts in group `steer`: a thin column cyl and a ring r 0.08 at
  `[0.16, 0.45, 0.15]`, `rot: [-60, 0, 0]`, colour black.
- Look: the boxy corrugated tin-snail car: a tall narrow body with ribbed bonnet (four thin boxes 0.02 proud along the
  bonnet), big round headlamps on stalks, bulging front wings over the front wheels (squashed balls), flat windscreen
  (glass, thin box) on a frame, a canvas rear, skinny bicycle-like wheels, a wicker basket of onions strapped to the back
  (a story detail). Its body should look soft and leaning.

### `gta-crepe-van` — name 'Crepe Van' (game scale 1.8)
- Size: 0.86 wide (x -0.43..0.43), 1.0 tall, 1.5 long (z -0.75..0.75). tint 0x7d8a93 (corrugated grey), trim 0xe8c547.
- `seat: [0.18, 0.3, 0.42]` (driver in the front cab, +x).
- `pivots`: `'wheel-0': [-0.4, 0.11, -0.5]`, `'wheel-1': [0.4, 0.11, -0.5]`, `'wheel-2': [-0.4, 0.11, 0.5]`,
  `'wheel-3': [0.4, 0.11, 0.5]` (r 0.11), `'door-left': [0.445, 0.42, 0.62]`, `'door-right': [-0.445, 0.42, 0.62]`.
- Door panels: group `door-left` a box `d: [0.03, 0.34, 0.34]` at `[0.45, 0.42, 0.45]` (tint), mirrored by hand at
  x -0.45 in `door-right`. Body side faces at x = +-0.43; door outer faces at +-0.465.
- Look: the ribbed boxy food van: a body box with vertical corrugation ribs (thin boxes 0.02 proud, at least six per side,
  generated by a helper), a short snub nose with a bonnet and two round lamps, a wide windscreen (glass), a serving hatch
  on the -x side (the +x side has the driver door) with a propped-up yellow flap (trim) and a counter, a big crepe on a
  griddle visible in the hatch, a hand-painted menu board on the roof (a box), a small striped bunting along the flap.
  No steering wheel parts needed (closed cab).

## Contract
Prefab ids `gta-euro-hatch`, `gta-deux-pots`, `gta-crepe-van`; the `seat`, `wheel-<n>`, `steer` (Deux-Pots only) and
`door-left` / `door-right` (Petit Pois and Crepe Van) pivot positions above are fixed: `games/gnome-theft-auto/src/config.ts`
`VEHICLES` already uses them times the scale.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your three ids (the catalog test, and `damage.test.ts`: stage
  names exist in the base prefab, every level builds and stands on the ground, each level differs).

## Out of scope
Every other file, including `gta-euro-fleet-b.ts`, `catalog/index.ts` and anything under `games/`.
