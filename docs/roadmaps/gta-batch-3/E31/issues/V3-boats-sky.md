Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
More life on the water and in the sky over the batch-3 regions: NPC boats on the Saltwater sea (south coast), the river
Thymes in Pardonlin and the High Tarn, and three new NPC flights over the outer regions.

## Read first
- `games/gnome-theft-auto/src/boatTraffic.ts` (`createBoatTraffic`: `allRoutes` with `npcRoute(kind, route, throttle,
  waterway)`, `loopRoute(bodyId, frac, n)`, `waterwayRoute(courseIds, {from, to})`, `pingPong`, `SEA_LOOP`; boats only
  run within ACTIVE_RANGE of the player)
- `games/gnome-theft-auto/src/boatTraffic.test.ts`
- `games/gnome-theft-auto/src/skyTraffic/behaviours.ts` (SKY_BEHAVIOURS table: id, title, kind, sound, anchor, radius,
  cooldown, presence, priority, repeat, route builders `polyRoute(points, altitude, speed)` / `orbitRoute`)
- `games/gnome-theft-auto/src/skyTraffic/types.ts` (the `SkyBehaviourId` union — add your ids there)
- `games/gnome-theft-auto/src/skyTraffic/runtime.test.ts` and `routes.test.ts` (what is checked per behaviour)

## Water facts
- `water/saltwater`: the sea along the whole south edge, z ~1190..1790, x -1790..1790 (deep away from the beach).
  The Saltbucket boardwalk and pier are around x -210..210, z 1090..1180: keep routes south of z 1300 there.
- `thymes`: Pardonlin's river (course id 'thymes', 16 m wide, 1.4 m deep), (-1620, -880) to (-1600, 1020); low bridges
  at z -300, -30, 250 (clearance 1.6 m: small boats only: 'walnut-dinghy').
- `water/high-tarn`: still water x 910..1040, z -1650..-1570, 2.5 m deep.
- `water/pardonlin-basin`: still water 90 x 60 at (-1600, 1040).

## Change
- `games/gnome-theft-auto/src/boatTraffic.ts`: append to `allRoutes`:
  - two sea boats: a 'clog-cruiser' running a long east-west line far out (z ~1450, x -1500..1500, pingPong) and a
    'walnut-dinghy' fishing loop off Dunelow (around (-560, 1350), 4-6 points, radius ~60 m);
  - a 'walnut-dinghy' on the Thymes (`waterwayRoute(['thymes'], ...)` pingPong between z -600 and z 900; waterway true);
  - a 'walnut-dinghy' slow loop on the High Tarn (`loopRoute('water/high-tarn', 0.5, 6)`, throttle 0.3);
  - a 'gravy-boat' loop in the Pardonlin basin (`loopRoute('water/pardonlin-basin', 0.5, 6)`, throttle 0.4).
  Keep the existing routes unchanged and in the same order (append only).
- `games/gnome-theft-auto/src/skyTraffic/types.ts` + `behaviours.ts`: three new behaviours (append; reuse existing kinds
  and sounds):
  - 'preserve-survey': a 'dandelion-drifter' (or the slowest existing kind) drifting slowly over the Unmown in a lazy
    loop (points around (-1300,-1550), (-800,-1600), (-500,-1500), (-1000,-1450)), low altitude (~40), title
    "Unmown Bird Survey".
  - 'coast-patrol': a 'hedge-hopper' flying along the Saltbucket coast z ~1250 from x -1400 to 1400 and back, altitude
    ~60, title "Saltbucket Coast Patrol".
  - 'snowcap-sightseer': a 'sycamore-copter' orbit (`orbitRoute` if it exists, else a polyRoute circle) round the High Tarn
    (1000, -1600), radius ~250, altitude ~90, title "Snowcap Sightseeing".
  Choose `anchor` at the route's middle and `radius` so the flight only runs when the player is in that part of the map;
  presence and cooldown like the existing scenic flights.
- Update the tests that count behaviours or routes, if any, to the new totals (do not weaken other assertions).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/boatTraffic.test.ts src/skyTraffic` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Anything outside `boatTraffic.ts`, `boatTraffic.test.ts` and `skyTraffic/`.
