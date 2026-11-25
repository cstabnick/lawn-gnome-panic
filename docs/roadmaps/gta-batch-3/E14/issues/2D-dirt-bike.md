Epic: E14-2 (content on the track registry)
Depends on: none
Worker: Sonnet (general-purpose) — vehicle registration and tuning

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules).

## Goal
A new two-wheeled vehicle, the **Knobbly** dirt bike (`VehicleKind` `'dirt-bike'`, name "Knobbly Dirt-Mower", prefab
`dirt-mower-bike`): a push-mower bike rebuilt for the dirt with knobbly tyres, long-travel forks and a number plate.
Light, quick to turn, floats over bumps and lands jumps; registered everywhere a vehicle kind must be, sold by the
dealer, synced online, and parked at the Rutbottom Dirt Bowl.

## Read first
- `games/gnome-theft-auto/src/config.ts` `VEHICLES` (`'push-bike'` ~282 is the model; `'wespa'` ~456 is the most recent
  two-wheeler added) and `SIM_AIR` / airtime constants (grep `SIM_AIR`)
- `src/handling.ts` (per-kind profiles, `'push-bike'` ~66), `src/driveGrips.ts` (~88, handlebar grips) + `driveGrips.test.ts`
- `packages/prefabs/src/catalog/lawn-prix.ts` (`push-mower-bike` prefab, ~44) and `docs/roadmaps/prefab-library/_common.md`
- Every place a kind is listed: run `grep -rn "'wespa'" games/gnome-theft-auto/src --include=*.ts` and
  `grep -rn "'push-bike'" games/gnome-theft-auto/src --include=*.ts | grep -v stages` (types.ts, config.ts, audio.ts,
  sound/engines.ts, sound/watchVehicles.ts, net.ts, glazeStore.ts, errands.ts, brands.ts, dealers/config.ts, fleet.ts,
  vehicles.ts TINTED_KINDS, vibeNpcs.ts, glazeMounts.ts ...). `tsc` lists every `Record<VehicleKind, ...>` that needs a row.

## Change
- `src/types.ts`: add `'dirt-bike'` to `VehicleKind`.
- `src/config.ts` `VEHICLES['dirt-bike']`: `mountStyle: 'hop'`, `prefab: 'dirt-mower-bike'`, scale like push-bike,
  maxSpeed ~27 (between push-bike 20 and zero-turn 34), accel ~22, turnRate ~3.1, radius 0.9, mass 1, seat and
  passengerSeats like push-bike (adjust to the prefab). Any other per-kind tables `tsc` flags: add the row, modelled on
  push-bike.
- `src/handling.ts`: a `'dirt-bike'` profile: more grip on `dirt`/`mud`/`gravel` than push-bike, less on asphalt, softer
  landings (if the profile has suspension/landing fields), quicker steering. Find how surfaces scale grip
  (`surfaces.ts` `SurfaceSpec`) and keep within the existing fields; do not add new physics.
- `src/driveGrips.ts`: `'dirt-bike'` handlebar grips (copy push-bike's pattern; the test must pass).
- Sound: `src/sound/engines.ts` a small buzzy two-stroke engine (not silent; model on the smallest engine there),
  `src/sound/watchVehicles.ts` and `src/audio.ts` as push-bike/wespa have.
- Online: `src/net.ts` kind list gets `'dirt-bike'` (append; never reorder: indices may be on the wire), and
  `glazeStore.ts` kind list if it is a plain list of kinds. Pay 'n' Glaze: if `src/glazeMounts.ts` must list every kind,
  exclude the dirt bike the same way other unsupported rides are excluded and update `glazeMounts.test.ts` /
  `vehicles.glaze.test.ts` accordingly.
- Economy: `src/dealers/config.ts`: stock row `{ id: 'dirt-bike', kind: 'dirt-bike', price: 650, blurb: ... }` with the
  push-bikes (a dry gnome joke). `src/brands.ts`: give it a maker if every kind needs one (a mud-loving brand; reuse one
  that fits).
- Other lists (`errands.ts`, `fleet.ts`, `vehicles.ts` `TINTED_KINDS`, `jobs/gen.ts` bike capacity, `critters/dreyGang.ts`
  steal kinds, `vibeNpcs.ts` gate guard line): add the dirt bike wherever push-bike appears as "a small two-wheeler", not
  in story stages or cutscenes.
- Parked at the bowl: in `src/app.ts` find the parked-vehicle spots list (~2575, `const spots: [VehicleKind, number,
  number][]`) or the code that spawns parked vehicles at the start and add two dirt bikes parked at (1030, -672) and
  (1034, -672), yaw 0 (beside the Dirt Bowl entrance). Only that edit in `app.ts`.
- Prefab `dirt-mower-bike` in `packages/prefabs/src/catalog/lawn-prix.ts` (after `push-mower-bike`): same size and
  forward axis as `push-mower-bike` (so seats and grips match), but knobbly fat tyres (rings of small boxes on the tread),
  long telescopic forks, a high front mudguard, a raised exhaust, a white number plate with a black "7" on the front, a
  tint for the frame. Fill `about` and five `examine` lines (tone: dry gnome joke). `npm test -w packages/prefabs` must pass.
- Lore: none here (the lore worker writes it).

## Contract
`VehicleKind` `'dirt-bike'`, `VEHICLES['dirt-bike'].name` = `'Knobbly Dirt-Mower'`, prefab `dirt-mower-bike`. Quests in
the next epic race it (`vehicle: 'dirt-bike'`) and rivals ride it.

## Done when
- `npx tsc --noEmit -p .` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/driveGrips.test.ts src/handling.test.ts src/sound src/net src/vehicles src/dealers src/glaze src/fleet.test.ts src/brands.test.ts src/mount.test.ts` passes
  (skip paths that do not exist).
- `npm test -w packages/prefabs` passes (from the repo root).
- Report every file you touched and the final stats.

## Out of scope
`src/raceTrack/*`, `src/quests/*`, area modules (`rutbottom/`, `capwood/`, `dirtCountry/`), `packages/prefabs/src/catalog/gta-dirt-rally*.ts`.
