Epic: E31 wave 2 (building the places)
Depends on: wave 1 (vehicle kinds and prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Parked vehicles you can take sit where people would leave them in the outer bands and the Unmown: the ranger buggy at
the station, campers at the High Tarn path start and a couple of lay-bys, a cone van in Dunelow, local cars in each hamlet,
European rides near Pardonlin's gates.

## Read first
- `games/gnome-theft-auto/src/living/parked.ts` (your stub: keep `livingParked(boxes: readonly Box[]): ParkedSpot[]`;
  world.ts calls it once after all colliders are built and adds the spots to `world.parked`)
- `games/gnome-theft-auto/src/types.ts` `ParkedSpot` = `{ x, z, yaw, kind: VehicleKind }`
- `games/gnome-theft-auto/src/living/config.ts` (`STATION` (-1560,-1150) site x -1585..-1535 z -1170..-1130; `HAMLETS`;
  `HIGH_TARN`)
- `games/gnome-theft-auto/src/living/place.ts` (`roadDist`)
- `games/gnome-theft-auto/src/fleet.ts` (how parked spots become vehicles: a spot's kind may be swapped for a named
  variant)

## Change
- `games/gnome-theft-auto/src/living/parked.ts`: a fixed list of 14-20 candidate spots, each returned only if it is not
  inside any box in `boxes` (point test plus a 2 m margin), not in water (`waterAt` null), and 5.5-9 m from the nearest
  road centre line (`roadDist`) — or on the station yard. Spots:
  - 'ranger-buggy' at (-1575, -1135) yaw 0 (the station yard) and one at the Unmown gate (-1420, -1040) facing the lane.
  - 'shell-camper' at the High Tarn path start (about (1070, -1315)), at two lay-bys on `north-band` (around
    (-480, -945) and (-150, -950), north side), and one on `south-band-east` near (400, 1010).
  - 'cone-van' in Dunelow near (-545, 990) facing the road, and one near the Saltbucket boardwalk car park (about
    (-60, 1060) — check it is not inside a box).
  - Hamlets: 2 spots each from ['golf-cart', 'deux-pots', 'euro-hatch'] in Espalier End (around (-1080, -495) north of
    the z -500 road), ['ride-on', 'zero-turn', 'dirt-bike'] in Mittenholt (north of the road near (550, -1325)),
    ['wespa', 'push-bike', 'golf-cart'] in Dunelow.
  - 2 European rides ('deux-pots', 'wespa') beside the Grand Wicket approach (`vineyard-lane` near (-1350, -20)).
  Yaw: parallel to the nearest road (compute from the nearest road segment's direction) unless given.
  Fine-tune the coordinates so every candidate passes the checks against an EMPTY boxes array (the test) — the real
  world may still drop a few that a hamlet built over; that is fine.
- NEW `games/gnome-theft-auto/src/living/parked.test.ts`: `livingParked([])` returns at least 14 spots including at least
  one of each of 'ranger-buggy', 'shell-camper', 'cone-van'; every spot is 5.5-9 m from a road (except the station yard
  spot), not in water, and at least 6 m from every other spot; with a box covering (-1575, -1135) the station spot is dropped.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/parked.test.ts src/parkedRoads.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`world.ts`, `fleet.ts`, other `living/*` files.
