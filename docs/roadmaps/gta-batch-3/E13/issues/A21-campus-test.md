Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
A new test `src/campus/campus.test.ts` guards Rootwell's contract data: every building, door and place sits inside its
E01 site and off the roads, the second runway's data is valid and matches its site, and an aircraft can take off from
Rootwell Field's runway and land on it again in a flight simulation.

## Background (confirmed)
- `src/campus/types.ts`: `CAMPUS` (site, quad, drive, parking, sugarStore, pitch), `CAMPUS_BUILDINGS` (w along x and d
  along z when yaw is 0 or PI, swapped when +-PI/2), `OBSERVATORY` (site, summit, dome, door, runUp, leapClear,
  roadStart, roadEnd, antDoors), `ROOTWELL_FIELD` (runway { x 1300, z 600, yaw 0, length 420, width 24 }, apron,
  taxiway, access, hangar, tower, windsock, pad), `WIND_FARM` (site, pinwheels, hut, substation, trackStart).
- `src/sites.ts`: `siteRect(id)` → `{ minX, maxX, minZ, maxZ }` for 'campus', 'observatory-mound', 'runway-2',
  'wind-farm', 'aircraft-dealer', 'construction-3'; `inSite(id, x, z, margin?)`.
- `src/config.ts`: `HIGHWAYS` (each `{ id, points: [x, z][], width }`), `ROAD_WIDTH`, `AIRFIELDS` (two entries) and
  `ROOTWELL_AIRFIELD` (= `AIRFIELDS[1]`, id 'rootwell-field', `planeSpots` with kinds 'plane', 'hedge-hopper',
  'sycamore-copter').
- `src/stunts.ts`: `STUNT_RAMPS` contains `deans-leap`.
- Flight: `src/craft/flight.ts` `initAir()`, `stepAir(body, state, spec, controls, { floorY, water }, dt)` with an
  `AirBody { x, y, z, yaw, speed, vy }`; `VEHICLES['hedge-hopper'].air` is a fixed-wing spec. `src/planeReverse.test.ts`
  shows how to drive it in a test (throttle, steer, lift, powered; 60 Hz steps). The legacy Crop Duster ('plane') uses
  `stepVehicle` (same file shows that too).

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`, `src/sites.ts` (exports), `src/planeReverse.test.ts`,
  `src/craft/flight.ts` (the `stepAir` signature and what `lift`/`throttle` do).

## Change
New `src/campus/campus.test.ts` (vitest; pure data, no scene):
1. Every `CAMPUS_BUILDINGS` footprint lies inside `siteRect('campus')`; no two footprints overlap; none overlaps
   `CAMPUS.quad`, `CAMPUS.parking` or the drive (x 946..1080, z -204..-196); each `door` spot lies outside every footprint
   and inside the site (the gate lodge and the Clod doors may sit within 2 m of the site edge); twelve rows have
   `tour: true`.
2. No footprint, the quad, the parking or `CAMPUS.sugarStore` is within `ROAD_WIDTH / 2 + 2` m of any `HIGHWAYS` segment.
3. `OBSERVATORY`: summit, dome, door, runUp ends, roadEnd and every ant door lie inside `siteRect('observatory-mound')`;
   the dome circle lies within `flatR` of the summit; `runUp` stays 4 m clear of the dome circle; `STUNT_RAMPS` has
   `deans-leap` with yaw PI, its centre within `flatR` of the summit, and its lip (z - length/2) north of the summit;
   `leapClear` does not contain the dome, the door or any ant door.
4. Rootwell Field: `AIRFIELDS.length === 2`; `ROOTWELL_AIRFIELD` equals `ROOTWELL_FIELD.runway` in x, z, yaw, length,
   width; the runway rectangle, the apron, the taxiway, the pad and every `planeSpots` point lie inside
   `siteRect('runway-2')`; no plane spot is within 12 m of another or on the runway; no plane spot is inside
   `siteRect('aircraft-dealer')`.
5. `WIND_FARM`: ten pinwheels inside `siteRect('wind-farm')`, 30 m apart in x; hut and substation inside the site and at
   least 10 m from every pinwheel.
6. Take-off and landing on Rootwell Field (fixed-wing `hedge-hopper` air spec, `stepAir`, floorY 0, water false, 60 Hz):
   start at the runway's north end (x 1300, z 400) facing yaw 0 (south) at speed 0; full throttle until airborne
   (`state.airborne` or y > 2), asserting the take-off point is still on the runway (z < 810); climb to ~20 m, then
   throttle back and descend straight ahead (a simple controller: lift/pitch control so y falls about 2-3 m/s, throttle
   low), and assert it touches down (y <= 0.1, airborne false) somewhere; then run the same simulation starting further
   north so that the touchdown point falls inside the runway rectangle — i.e. find, by trying start points along the
   runway, at least one take-off + landing that both happen on the runway (its 420 m length is plenty for this plane:
   the desert strip is 170 m). If the plane's control model cannot be steered this way, write the landing half as:
   start at y 15 over the north threshold, speed at the plane's cruise, controls for a gentle descent, and assert it
   lands and stops before z 810. Keep the test under ~2 s.

## Contract
None new (a test only).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/campus.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/campus.test.ts`.
- If a data check fails because `src/campus/types.ts` itself is wrong (a building overlaps a road, a spot is outside its
  site), do not change `types.ts`: report the failing check and numbers to the lead.

## Out of scope
Every other file.
