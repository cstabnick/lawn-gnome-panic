Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Vehicle modelling and tuning issue. You may run ONE dev server on
port **5351** only (e.g. `npm run dev -w games/prefab-gallery -- --port 5351 --strictPort`, background) to look at
your prefabs; stop it after.

## Goal
The two E25 work vehicles exist and drive: the **Bin Lorry** (`bin-lorry`, prefab `gta-bin-lorry`) and the
**Watering-Can Pumper** fire engine (`fire-engine`, prefab `gta-fire-engine`), garden-scale and gnome-satirical, with the
moving parts the jobs animate, their engine sounds, horns, handling, driver pose, and a siren hook.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: PrefabDef rules.
- `packages/prefabs/src/catalog/gta-euro-fleet.ts`: `gta-crepe-van` (~l.165) is the model to follow: `uses: ['place',
  'sit']`, `tint`, `trim`, `seat`, `pivots` (`wheel-0..3`, `door-left`, `door-right`), parts with `group: '<pivot>'`,
  `damage` stages (dented, wrecked). Nose +z, right-hand side is -x.
- `games/gnome-theft-auto/src/config.ts`: the `'bin-lorry'` and `'fire-engine'` entries at the end of `VEHICLES`
  (placeholders for seat, doors, scale; tune them to your models: seat and door `at` are prefab numbers times `scale`).
  Compare `'hoa-van'` and `'crepe-van'`.
- `games/gnome-theft-auto/src/handling.ts` (`PROFILES`, the `'hoa-van'` row), `src/sound/engines.ts` (the `'hoa-van'`
  and `'crepe-van'` rows), `src/driveGrips.ts` (`DRIVE_CONTROLS`, the comment ~l.87 about closed cabs),
  `src/anim/rideAuto.ts` (~l.44), `src/audio.ts` (horn switch ~l.415), `src/sound/watchVehicles.ts` (`hornFor`, and the
  ambulance siren loop ~l.293: `addSource(key, 'siren-ambulance', x, z, 1)`).

## Change
- `packages/prefabs/src/catalog/gta-jobs3-fleet.ts`: fill `GTA_JOBS3_FLEET` with two vehicle prefabs (category
  'prop', uses ['place', 'sit'], tags include 'gta', 'vehicle', 'ride', 'seat'), each with 5 examine lines and
  `damage` stages like the crepe van:
  - `gta-bin-lorry` "Bin Lorry": a stubby cab-over lorry whose back is a big green **garden compost bin** (ribbed,
    a flip lid named `lid` on top), body ~1.0 wide (x -0.5..0.5) x 2.0 long x 1.1 tall in prefab units, `tint` the bin
    green, `trim` hi-vis yellow stripes, amber beacon on the cab roof (glow). **Lift arm: pivot `arm` at [-0.52, 0.62,
    -0.45]** (kerb side, beside the hopper). Arm parts are `group: 'arm'`, drawn hanging straight DOWN from the pivot:
    a 0.5-long yellow arm with a two-prong claw at local [0, -0.5, 0] (the claw is what grabs a bin: keep the claw at
    exactly that offset). At `arm.rotation.z = 2.4` the arm must point up and over the hopper toward +x (check by
    eye in the gallery or reason it out: rotating about z by +theta moves (0,-L) to (L sin theta, -L cos theta)).
    A "BIN DAY IS EVERY DAY" style plate on the back as a box part (no text needed).
  - `gta-fire-engine` "Watering-Can Pumper": a red fire engine whose body is a big **watering can** on its side on a
    chassis (round can body, the handle arching over the top, the spout forward and up over the cab with the rose as
    the nozzle), ~1.0 wide x 2.1 long x 1.2 tall, `tint` red, `trim` brass/chrome, blue-and-red light bar (glow),
    a coiled hose reel on the side. **Pivot `nozzle`** at the spout tip (front top, around [0, 1.0, 1.0]): parts
    `group: 'nozzle'` = the rose, pointing +z at rotation 0. **Pivot `ladder`** on the roof near the back (around
    [0, 1.15, -0.5]): parts `group: 'ladder'` = a 1.0-long two-rail ladder lying flat along +z from the pivot, with
    rungs every 0.12.
  - Both: four wheels (`wheel-0..3`), `door-left` / `door-right` pivots like the crepe van, `seat` in the cab.
- `games/gnome-theft-auto/src/config.ts`: tune ONLY the `'bin-lorry'` and `'fire-engine'` entries (seat, doors `at`,
  scale, radius, maxSpeed/accel/turnRate if needed: the lorry is slow and heavy, the Pumper brisk). Do not touch
  other entries.
- `games/gnome-theft-auto/src/handling.ts`: `PROFILES` rows for both (lorry: grippy, understeery, high comHeight; the
  Pumper: like hoa-van, a bit livelier).
- `games/gnome-theft-auto/src/sound/engines.ts`: rows for both (lorry: low diesel rumble, rough; Pumper: rumble with
  more bright).
- `games/gnome-theft-auto/src/driveGrips.ts`: closed cabs (add both names to the closed-cab comment; add rows only if
  the other closed cabs have rows).
- `games/gnome-theft-auto/src/anim/rideAuto.ts`: `'bin-lorry': 'drive-casual'`, `'fire-engine': 'drive-white-knuckle'`
  (if the table is a Partial record; match how other kinds are listed).
- `games/gnome-theft-auto/src/audio.ts`: horn cases: the lorry a low two-note truck parp; the Pumper a bright
  three-note "dee-da-dee" bell-like horn.
- `games/gnome-theft-auto/src/sound/watchVehicles.ts`: `hornFor` returns 'horn-truck' for both. Add an exported
  siren hook: `export const SIREN_VEHICLES = new Set<number>();` (vehicle ids) and, next to the ambulance loop, for
  every vehicle in the frame whose id is in the set and is not exploded, `addSource('fire-siren' + v.id,
  'siren-ambulance', v.x, v.z, 1)` (find where the frame's vehicles are iterated; include the player's vehicle).
  The fire job adds its engine's id while on a call.

## Contract
Prefab ids `gta-bin-lorry`, `gta-fire-engine`; pivots `arm` (claw at local [0, -0.5, 0]; rotation.z 0 = down, 2.4 =
over the hopper), `lid`, `nozzle` (points +z), `ladder` (lies along +z), wheels, doors. `SIREN_VEHICLES: Set<number>`
exported from `sound/watchVehicles.ts`. VehicleKind strings `'bin-lorry'`, `'fire-engine'` (already in types.ts and
net.ts: do not edit those).

## Done when
- `npm test -w packages/prefabs` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `cd games/gnome-theft-auto && npx vitest run src/handling.test.ts src/driveGrips.test.ts src/net.test.ts` pass.
- You looked at both models (gallery on 5351, or reasoned carefully) and the arm/ladder/nozzle pivots behave as stated.

## Out of scope
`types.ts`, `net.ts`, other catalog files, every `workplaces/` file, any other VEHICLES entry.
