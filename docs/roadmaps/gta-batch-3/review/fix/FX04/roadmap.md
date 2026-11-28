# FX04 roadmap: vehicle capsule collision, drive camera, handling feel and stunt ramps

Brief: `docs/roadmaps/gta-batch-3/review/fix/FX04-vehicle-collision-camera-feel.md` (G1#16, G5#20, G7#1, G7#2, G7#6,
G7#7, G7#8, G7#14, G7#15, G7#19, G7#20; D21, D31, D36).

## Foundation (lead, before the epic)

- `types.ts` `VehicleSpec.halfWidth?` and `config.ts` `VEHICLES[*].halfWidth` for every ground vehicle, measured from the
  built prefab (`buildPrefab(spec.prefab, { scale })`, max |x| of the mesh bounds). Flyers and boats get none (flyers keep
  the circle, boats keep `BOAT_HIT_RADIUS_FRAC`). The Combine uses 3.0 (its header is 4.1 wide but only at the very front).
- `handling.ts` `VehicleProfile.roll?` (D31) with values; the three two-wheelers' rider `lean` cut to 0.5 (the rider banks
  with the bike now).
- `bodyRoll.ts` stub (`stepBodyRoll`, `bodyRollOf`) and its wiring in `vehicles.ts` `syncVehicleMesh` (bank on the whole
  object, shell added to the rig's suspension roll).
- G7#19 stale comments (`simdrive.ts`, `app.ts`), G7#20 explicit 120 s timeouts (`canalCruise.test.ts`, `sandpitJump.test.ts`).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Fixes | tsc, `npm test -w games/gnome-theft-auto`, quest-sim suites x2 | 5 (parallel, no shared files) |
| Lead pass | G7#14 arcade gravity + `RAMP_LAUNCH` retune, ramp-side walls use the capsule, re-shoots at 960x600 and 390x844, iterate | lead |

Online: the capsule runs for every locally stepped vehicle; remote vehicles keep their sync path. Mobile: the drive camera
is checked at 390x844.

## Epic 1 issues

| Issue | Worker | Owns |
|---|---|---|
| I1 capsule collision (G7#1, G7#15) | Sonnet | `collide.ts`, `collide.test.ts`, `vehicles.ts` (moveVehicle, collideVehicles, stepKnock only), `simdrive.ts` (stepChassis sweep), `bump.test.ts` |
| I2 drive camera by size (G7#2) | Haiku | `camera.ts`, one argument in `app.ts` `chase.update(...)`, a new `camera.size.test.ts` |
| I3 handling feel and profiles (G7#6, G7#8) | Sonnet | `handling.ts` (TUNES, PROFILES rows), `handling.test.ts` |
| I4 body roll (G7#7, D31) | Haiku | `bodyRoll.ts`, new `bodyRoll.test.ts` |
| I5 ramp skins (G1#16, G5#20, D21) | Sonnet | `stunts.ts` mesh building only, new `rampSkins.ts`, `districts.ts` flower-bed line |

The full issue texts are the worker prompts in `I1.md` .. `I5.md`.
