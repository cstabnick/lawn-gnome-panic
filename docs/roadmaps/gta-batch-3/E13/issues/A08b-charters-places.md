Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Wally's Charters (the pilot job) and the taxi/courier jobs know Rootwell: a fixed-wing charter can fly to Rootwell Field
and land there, copter charters can land on the Rootwell Field pad, scenic flights can pass the Anthill Observatory and
Pinwheel Ridge, and land jobs can drive to Rootwell University's gate and the Field.

## Background (confirmed)
- `src/jobs/places.ts`: `PlaceArea` union, `LAND_PLACES` (taxi/courier destinations; gen.ts snaps them to the nearest
  road node), `AIR_PADS` (copter/balloon pads, flat and dry, the desert apron first; charters pick `AIR_PADS.slice(1)`),
  `SKY_SIGHTS` (scenic flight gates), all checked by `src/jobs/places.test.ts` (land places dry, pads flat and dry...).
- `src/jobs/gen.ts` `makePilotGig(c, kind)`: for `kind === 'charter'`, a fixed-wing plane (`v.fixedWing`) flies
  `[stand, gateStop(sight), airfield()]` titled 'Charter to Airfield' (it always comes home to `c.home`, the desert
  airfield), a copter flies `[stand, landStop(pad.id, pad.name, pad.x, pad.z, P.landRadius)]` titled `Charter to <pad>`.
  `landStop(id, name, x, z, radius)` and `pick(list, c)` are helpers in the same file; `c.rng()` is the seeded random.
- Rootwell places (`src/campus/types.ts`): `CAMPUS.gate` (982, -200); `ROOTWELL_FIELD.runway` (1300, 600, along z,
  420 long, 24 wide), `ROOTWELL_FIELD.pad` (1245, 640, r 7), `ROOTWELL_FIELD.access.from` (1180, 580) (the end of the
  runway-spur road); `OBSERVATORY.dome` (1258, 158); Pinwheel Ridge at (850, -1200).

## Read first
- `games/gnome-theft-auto/src/jobs/places.ts`, `src/jobs/places.test.ts`.
- `games/gnome-theft-auto/src/jobs/gen.ts` (`makePilotGig` and its helpers), `src/jobs/gen.test.ts`.
- `games/gnome-theft-auto/src/campus/types.ts` (read only).

## Change
- `src/jobs/places.ts`:
  - `PlaceArea` gains `'campus'` (fix any `Record<PlaceArea, ...>` tsc then reports, in the files listed here only; if one
    is in another file, tell the lead instead).
  - `LAND_PLACES`: `{ id: 'rootwell-gate', name: 'Rootwell University gate', x: 960, z: -200, area: 'campus' }` and
    `{ id: 'rootwell-field-gate', name: 'Rootwell Field', x: 1185, z: 582, area: 'campus' }`.
  - `AIR_PADS` (append, never first): `{ id: 'rootwell-field-pad', name: 'Rootwell Field Pad', x: 1245, z: 640, area:
    'campus' }`.
  - `SKY_SIGHTS`: `{ id: 'sight-anthill', name: 'The Anthill Observatory', x: 1258, z: 158, area: 'campus' }` and
    `{ id: 'sight-pinwheel-ridge', name: 'Pinwheel Ridge', x: 850, z: -1200, area: 'campus' }`.
- `src/jobs/gen.ts` `makePilotGig`, charter branch for fixed-wing planes: with probability 0.4 (`c.rng() < 0.4`) the
  charter flies to Rootwell Field instead: stops `[stand, landStop('rootwell-field', 'Rootwell Field runway', 1300, 600,
  P.landRadius * 2), airfield()]`, title 'Charter to Rootwell Field' (a visiting professor; the pay follows the existing
  `pathLength` formula). Keep the old branch otherwise. If gen tests pin exact gig sequences for a fixed seed and the
  extra `c.rng()` call shifts them, draw the 0.4 roll only after the existing picks, or update the pinned expectation
  and say so in your report.
- `src/jobs/places.test.ts`: only if the new places fail its checks for a reason that is not theirs (e.g. the test lists
  areas): adjust the list; never move a check.

## Contract
Place ids `rootwell-gate`, `rootwell-field-gate`, `rootwell-field-pad`, `sight-anthill`, `sight-pinwheel-ridge`; stop id
`rootwell-field`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/jobs` passes. (Rootwell's buildings are being added by other workers
  right now; if a place test fails because a new collider covers one of your points, report the point and the box to the
  lead instead of moving it into the road.)
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/jobs/`.

## Out of scope
Every file outside `src/jobs/`.
