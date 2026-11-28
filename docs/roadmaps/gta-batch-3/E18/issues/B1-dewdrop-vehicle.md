Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first. This issue touches many small vehicle tables; that is
expected (it is plumbing for one new kind).

## Goal
A new ground vehicle kind `'bubble-mobile'`, **the Dewdrop**: a clear hamster ball (about 2.2 m across) the gnome sits
upright inside and rolls, hamster style. Its own feel: slow to turn, gentle top speed (~10 m/s), soft acceleration, a
bouncy rebound off kerbs and walls, and a ball mesh that visibly rolls (pitch with distance travelled, around the
vehicle's right axis) while the gnome stays upright. Registered fully as a vehicle kind (spec, handling, grips, anim,
sound, online sync, map icon if kinds need one), plus its prefab and the Roll With It reward prefab.

## Read first
- `games/gnome-theft-auto/src/types.ts` (`VehicleKind` already has `'bubble-mobile'`).
- `games/gnome-theft-auto/src/config.ts` `VEHICLES['bubble-mobile']` (a STUB copied from barrow-buggy, prefab
  'gta-barrow-buggy': replace it), `VehicleSpec` fields.
- `games/gnome-theft-auto/src/handling.ts` `PROFILES` (~l.138, see 'barrow-buggy'), `driveGrips.ts` (~l.156 and its
  comment block ~l.90 on vehicles whose rider holds nothing, e.g. skateboard), `anim/rideAuto.ts` (~l.46), `net.ts`
  (~l.23 synced kinds), `sound/engines.ts` (~l.58 silent kinds, ~l.93 barrow-buggy), `mapIcons.ts` (only if it needs
  a per-kind entry), `vehicles.ts` (`createVehicle` ~l.298, `stepVehicle` ~l.359, `syncVehicleMesh` ~l.573: where a
  per-kind visual can spin a sub-group).
- Failing tests to fix: `npx vitest run src/fleet.test.ts src/net.test.ts src/handling.test.ts src/driveGrips.test.ts src/oddRides.test.ts`
  (e.g. "covers every kind but the ones with a recorded reason", grips at 0.6..1.6 arm lengths).
- Prefab rules: `docs/roadmaps/prefab-library/_common.md`; example vehicle prefab `packages/prefabs/src/catalog/gta-odd-rides.ts`
  (`seat`, `pivots`, `group`), example wearable `packages/prefabs/src/catalog/gta-societies-gear.ts`.

## Change
- `packages/prefabs/src/catalog/gta-dewdrop.ts` (stub array `GTA_DEWDROP`, already registered in the catalog index):
  - `gta-dewdrop`: category 'prop', uses ['place', 'sit'], a clear sphere shell (`s: 'ball'`, `alpha` ~0.25, light
    blue tint) in a part `group: 'ball'` with a few visible seams/rings and a brass seal-ring band also in group 'ball'
    (so the roll is visible), a small seat/harness frame NOT in the group (stays upright), `seat` at the frame, tags,
    `about`, five `examine` lines in the house style (Hogweed built it; "Permission is a prototype nobody tested").
  - `gta-bubble-visor`: a wearable head item (uses ['wear-head'], `wear: { at: [...] }`), a clear bubble visor with a
    brass rim; the Roll With It achievement reward (`packages/achievements` already references id 'gta-bubble-visor').
- `config.ts`: real spec: prefab 'gta-dewdrop', name 'The Dewdrop', mountStyle as fits (a climb-in: check the
  existing MountStyle values), maxSpeed ~10, accel ~4, turnRate ~1.2, radius ~1.2, seat matching the prefab, mass ~1.2,
  no passengers.
- `handling.ts`: a 'bubble-mobile' profile: low grip / long slide, soft steering, high restitution feel. If a bounce
  needs code, add the smallest branch in `vehicles.ts` (e.g. on a wall/kerb hit keep ~45% of speed reflected instead of
  stopping) keyed on `v.kind === 'bubble-mobile'`.
- `vehicles.ts`: roll the prefab's 'ball' group by `distance / radius` each frame around the local x axis (find the
  group with `getObjectByName` or the prefab pivot API used for wheels, e.g. how 'wheel-0' groups are spun) in
  `syncVehicleMesh`. The rider stays upright.
- `driveGrips.ts`: the rider holds the frame bars (or nothing, like the skateboard, with the recorded-reason mechanism).
  `anim/rideAuto.ts`: an anim fitting a gnome running in a wheel ('drive-casual' is fine). `sound/engines.ts`: a soft
  rumble or silent with a rolling sound if one exists. `net.ts`: add to the synced kinds. Any other `Record`/list that
  tests say must cover every kind.
- Do not add it to traffic, dealers or odd-ride lists: it is only obtained through Hogweed's quests.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files.
- `npx vitest run src/fleet.test.ts src/net.test.ts src/handling.test.ts src/driveGrips.test.ts src/oddRides.test.ts src/vehicleSync.test.ts` pass.
- `npm test -w packages/prefabs` passes (from the repo root).

## Out of scope
`src/dewdrop/*`, `src/quests/*`, `packages/achievements`.
