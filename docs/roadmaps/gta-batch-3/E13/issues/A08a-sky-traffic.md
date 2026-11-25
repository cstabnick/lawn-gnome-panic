Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
NPC sky traffic uses the second runway: a new behaviour `rootwell-circuit` flies the aeronautics department's
Hedge-Hopper round Rootwell Field (take off, circuit, land, park, repeat), on the same intermittent cadence as the
desert airfield's flight-school circuit.

## Background (confirmed)
- `src/skyTraffic/behaviours.ts` `SKY_BEHAVIOURS`: the entry `airfield-circuit` (Flight School Circuit, kind
  'hedge-hopper', anchor (480, -110), radius 600, cooldown 60, presence { onFor: [150, 240], offFor: [90, 180] },
  priority 6, repeat 'loop', startAirborne false, route `(c) => airfieldCircuit(c.airfield, { x: c.airfield.x - 40,
  z: c.airfield.z - 22, yaw: c.airfield.yaw })`). `airfieldCircuit(af: { x, z, yaw, length }, apron: { x, z, yaw })` is in
  `routes.ts`.
- `src/skyTraffic/types.ts`: `SkyBehaviourId` is a union of the ids.
- `src/config.ts` exports `ROOTWELL_AIRFIELD` `{ id: 'rootwell-field', x: 1300, z: 600, yaw: 0, length: 420, width: 24,
  planeSpots }` (runway along z, take-off heading south). Its apron is west of the runway: x 1215..1262, z 520..680
  (`src/campus/types.ts ROOTWELL_FIELD.apron`); parked planes stand at x 1238, z 570 / 592 / 614 and a copter at
  (1245, 640): park the NPC away from them, e.g. at (1250, 545) facing east.
- `src/skyTraffic/places.test.ts` checks that ground points the flights use are on legal ground (no box, no water, no
  deck), with `buildSimWorld()`.

## Read first
- `games/gnome-theft-auto/src/skyTraffic/behaviours.ts`, `src/skyTraffic/types.ts` (`SkyBehaviourDef`,
  `SkyBehaviourId`), `src/skyTraffic/routes.ts` (`airfieldCircuit`), `src/skyTraffic/places.test.ts`.

## Change
- `src/skyTraffic/types.ts`: add `'rootwell-circuit'` to `SkyBehaviourId`.
- `src/skyTraffic/behaviours.ts`: a new entry after `airfield-circuit`: id `rootwell-circuit`, title 'Rootwell
  Aeronautics Circuit', kind 'hedge-hopper', sound `SKY_SOUNDS.sport`, anchor `{ x: ROOTWELL_AIRFIELD.x, z:
  ROOTWELL_AIRFIELD.z }`, radius 600, cooldown 75, presence `{ onFor: [120, 200], offFor: [120, 240] }`, priority 6,
  repeat 'loop', startAirborne false, route `() => airfieldCircuit(ROOTWELL_AIRFIELD, { x: 1250, z: 545, yaw: Math.PI / 2 })`.
  Import `ROOTWELL_AIRFIELD` from `../config`.
- `src/skyTraffic/places.test.ts`: a test 'rootwell-circuit parking (r 3)' for (1250, 545) like the airfield one.
  (The world builds with Rootwell's scenery stubbed or partly built while other workers run; if the spot fails because
  of a new box, report it to the lead instead of moving the spot.)
- If any other test in `src/skyTraffic/` enumerates every behaviour id (search the folder for `airfield-circuit`), add
  the new id there too.

## Contract
Behaviour id `rootwell-circuit`; parking at (1250, 545).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skyTraffic` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/skyTraffic/`.

## Out of scope
Every file outside `src/skyTraffic/`.
