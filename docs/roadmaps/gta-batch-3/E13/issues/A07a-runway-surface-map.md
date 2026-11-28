Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Rootwell Field's runway (the second airstrip) drives as asphalt like the Desert Airfield's, and the minimap / big map
draw it as a runway like the desert one.

## Background (confirmed)
- `src/config.ts` exports `AIRFIELDS: readonly Airfield[]` = [the desert strip, Rootwell Field] and
  `ROOTWELL_AIRFIELD: Airfield` (= `AIRFIELDS[1]`): `{ id: 'rootwell-field', x: 1300, z: 600, yaw: 0, length: 420,
  width: 24, planeSpots }` (yaw = take-off heading; forward = (sin yaw, cos yaw); the runway runs along z here).
  `AIRFIELD` (the desert strip) is unchanged and is still `world.airfield`.
- `src/surfaces.ts`: `surfaceAt(x, z, world, vehicleKind?)` picks 'asphalt' when
  `onAirfieldRunway(x, z, world.airfield ?? AIRFIELD)` among other things.
- `src/hud.ts` (around line 820): the map picture draws the runway polygon from `world.airfield` with `MAP.runway` fill
  and `MAP.runwayEdge` outline, using a local `poly(points, fill, stroke)` helper.

## Read first
- `games/gnome-theft-auto/src/surfaces.ts` (`onAirfieldRunway`, `surfaceAt`).
- `games/gnome-theft-auto/src/hud.ts` lines ~800-845 (the runway block of the map drawing).
- `games/gnome-theft-auto/src/surfaces.test.ts` (how surfaces are tested).
- `games/gnome-theft-auto/src/config.ts` lines ~100-140 (`AIRFIELD`, `Airfield`, `AIRFIELDS`, `ROOTWELL_AIRFIELD`).

## Change
- `src/surfaces.ts`: Rootwell Field's runway is asphalt too: keep the existing `world.airfield ?? AIRFIELD` check and add
  `|| onAirfieldRunway(x, z, ROOTWELL_AIRFIELD)` (import `ROOTWELL_AIRFIELD` from `./config`).
- `src/hud.ts`: draw both runways: turn the runway block into a loop over `[world.airfield, ROOTWELL_AIRFIELD]` (same
  polygon code, same colours). Do not change anything else in the map drawing.
- `src/surfaces.test.ts`: one new test: `surfaceAt(1300, 600, {})` and `surfaceAt(1300, 780, {})` are asphalt (kind
  'asphalt'); `surfaceAt(1340, 600, {})` is not. Use the same call shape the file's other tests use.

## Contract
No new exports. `world.airfield` stays the desert strip.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/surfaces.test.ts src/hud.evade.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `surfaces.ts` or `hud.ts`.

## Out of scope
Every other file (`mapPois.ts`, `mapIcons.ts` are another worker's).
