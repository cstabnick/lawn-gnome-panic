# E29 roadmap: European kit (buildings, vehicles, plants, backyard styling)

Brief: `../E29-european-kit.md`. Contracts for E30/E31: `contracts.md`. Shared worker rules: `_common.md`. Issues: `issues/`.

## Goal

A modular, satirical "Paris-London-Berlin" kit at garden scale: 16 buildings with fixed footprints that pack into dense
streets, 13 street-furniture pieces with blank sign faces and satirical lines, 14 European plants and backyard pieces,
five drivable European rides fully registered (traffic, dealer, online, sound, handling, hands, achievements, lore), a
pure street composer, and a `?eurokit` lab that shows it all. Nothing is placed in the normal world (E30 does that).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| E29-0 foundation (lead) | `tsc` clean; stubs, registration, contracts in place | written by the lead |
| E29-A build (all parallel) | prefabs, achievements, GTA tests on own files, lore | 13 |
| E29-B wiring (parallel, after A) | GTA build + tests, prefab-gallery build, smoke + zfight on `?eurokit` | 2 |

## Foundation (lead)

- Prefab catalog: 11 empty `gta-euro-*.ts` files registered in `catalog/index.ts` (one owner each).
- GTA: `VehicleKind` (+5), `VEHICLES` entries (seats and doors fixed from the prefab specs times scale), `VEHICLE_CODES`
  appended, `TRAFFIC.euroZoneChance` / `euroTownChance`, `euroRides.ts` (zone registry, achievements, `recordEuroRide` via
  the shared `recordRideIn` in `oddRides.ts`), `traffic.ts` `pickKind` + `?traffic=euro`, `errands.ts` `TOWN_ONLY`,
  `anim/rideAuto.ts` styles, `dealers/config.ts` forecourt stock, `app.ts` hooks (achievements on enter, `?eurokit`).
- `eurokit/catalog.ts` (`EURO_BUILDINGS` sizes: the contract between the prefab issues, the composer and the test),
  stubs `eurokit/street.ts`, `eurokit/signs.ts`, `eurokit/showcase.ts`.
- `packages/achievements` catalog: `gta-grand-tour`, `gta-baguette-run`, `gta-petit-pois`.

## Issues

| Issue | Files | Model |
|---|---|---|
| A01 terrace houses | `gta-euro-buildings-a.ts` | Sonnet |
| A02 shops and booths | `gta-euro-buildings-b.ts` | Sonnet |
| A03 landmarks | `gta-euro-buildings-c.ts` | Sonnet |
| A04 opera, boathouse, shopfronts | `gta-euro-buildings-d.ts` | Sonnet |
| A05 street furniture | `gta-euro-street.ts` | Haiku |
| A06 cafe kit and signs | `gta-euro-street-b.ts`, `eurokit/signs.ts`, `signs.test.ts` | Haiku |
| A07 European plants | `gta-euro-garden.ts` | Haiku |
| A08 backyard styling | `gta-euro-garden-b.ts` | Haiku |
| A09 European cars | `gta-euro-fleet.ts` | Sonnet |
| A10 scooter, trike, reward gear | `gta-euro-fleet-b.ts`, `gta-euro-gear.ts` | Sonnet |
| A11 handling, engines, horns | `handling.ts`, `sound/engines.ts`, `audio.ts` | Haiku |
| A12 street composer | `eurokit/street.ts`, `street.test.ts` | Haiku |
| A13 lore and flora | `docs/lore/entries/apocrypha/*` (5 new), `flora/kinds.ts` | Haiku |
| B01 drive grips | `driveGrips.ts`, `driveGrips.test.ts` | Haiku |
| B02 showcase | `eurokit/showcase.ts`, `eurokit/catalog.test.ts` | Sonnet |

The issue texts are the files in `issues/` (each worker was given its file).

## Online / mobile

Online: the five kinds are appended to `VEHICLE_CODES`, so remote players see them; no new messages. Mobile: no new UI;
the rides use the existing drive controls and dock.

## Checks (end of epic)

- `npm test -w packages/prefabs` 2846 pass; `npm test -w packages/achievements` 22 pass; `npm run lore` OK (592).
- `npm run build -w games/gnome-theft-auto` and `-w games/prefab-gallery` OK; `npm test -w games/gnome-theft-auto`
  3188 pass (296 files).
- Smoke `?offline&eurokit` (markers `game`, `ui`) OK. zfight on `?offline&eurokit`: no E29 pairs (the 11 left are
  older world scenery). The showcase is one merged static batch, which the scene audit cannot look inside, so every kit
  prefab was also audited part by part (a throwaway `auditCoplanar` run per prefab): 28 coplanar pairs found and fixed.
- Screenshot pass (headless Edge, `?offline&eurokit`, `?no-intro` is implied): the street from its start (1280x800), the
  same at phone size (390x844). Looked right: packed irregular fronts, awnings, lamps, cafe tables, parked rides.
  Not done: a real phone, the back garden and landmark close-ups (E30 does the per-area screenshot pass where it places them).

## Deferred

- Pay 'n' Glaze mounts (lamps, spoilers, decals) for the five rides (the odd rides have none either).
- A tram or bendy bus.
- Parked-spot `FLEET` entries (the rides are reachable through traffic, the forecourt and `?mount=<kind>`).
- Placing the kit in the world, the town's vignettes, its posters' text on faces, and its screenshot pass: E30.
