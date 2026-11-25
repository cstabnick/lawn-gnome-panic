# E13 Campus and skyline: roadmap

Brief: [../E13-campus-and-skyline.md](../E13-campus-and-skyline.md) (L52 research university with an observatory on a
giant ant hill and a drive-off ramp, L74 a new runway in a new area, L82 wind turbines), adjusted to the merged contracts:
E01 sites `campus`, `observatory-mound`, `runway-2`, `wind-farm` and `AIRFIELDS[]`; E04/lore names (Rootwell University's
twelve buildings, the Anthill, Dean's Leap, Rootwell Field, Pinwheel Ridge, Dean Lovage Inkwell, Professor Betony
Sextant, Ragwort Coilspring); E05 `defineInterior` / `addRooftop`; E02 ramps and airtime; E09 sounds; E10 `registerHome`;
side-quest schedule rows `sq-rootwell-lost-essay`, `sq-anthill-rent`.

## Decisions

- **One contract file**, `src/campus/types.ts`: every place, id, size and spot (`CAMPUS`, `CAMPUS_BUILDINGS`,
  `OBSERVATORY`, `ROOTWELL_FIELD`, `WIND_FARM`, `PINWHEEL_SIZE`, `ROOTWELL_ROOMS`, `ROOTWELL_ACH`, ...). world.ts calls
  `buildRootwell(scene, boxes)` (static scenery), app.ts `installRootwell(jobDeps)` (residents, rotors, sounds,
  achievements); one module per part (`buildings`, `grounds`, `story`, `interiors`, `observatory`, `observatoryInterior`,
  `field`, `windFarm`, `life`, `achievements`).
- **Runway 2 is data**: a `site/rootwell-field` marker in `east-campus.level.json` (same shape as the desert `airfield`);
  `config.ts` `AIRFIELDS[1]` / `ROOTWELL_AIRFIELD` reads it. The runway-2 slot is already a flat E01 site, so terrain,
  macro and the Wasm kernel need no airfield change (the golden stays the same for the desert). Converted consumers:
  plane spawns (app.ts, now by `planeSpots[].kind`), surfaces (asphalt), the map runway (hud), map POIs, sky traffic (a
  second circuit), pilot charters and pads (jobs). Lock-up aircraft storage stays at the desert strip.
- **Big buildings are half-size prefabs** placed with `scale: 2` (the catalogue test caps a prefab at 30 on a side);
  colliders come from the contract footprints, not prefab bounds (porticoes and steps stay walkable).
- **The Anthill** = the E01 macro hill + a document `flatten` stamp on the summit + a new landform feature kind `anthill`
  (code 13, JS and kernel) painting the flanks dirt and the forecourt gravel + `trail/anthill-road` spiralling up.
  **Dean's Leap** is a `STUNT_RAMPS` entry on the summit's north rim; `onStuntLanded` (new in stunts.ts) tells the
  achievements module.
- **Pinwheels**: the lore makes the turbines giant garden pinwheels (red, yellow, blue). Masts are one static batch;
  ten rotors are small groups culled as landmarks and spun from the game clock (the only per-frame work).
- **Side quests** unlock after `ch4-spade-truce` until E21 builds m47/m48. Online: nothing new on the wire (aircraft are
  ordinary vehicles; rotors spin from the clock; quests and tour progress are local, like other activities).
  Mobile: no new controls (doors, spots and the telescope use the existing action button).
- Lore: rulings R-189..R-192; new entry `deans-leap`.

## Shape

| Epic | Issues | Done when |
|---|---|---|
| E13-0 foundation (lead) | `campus/types.ts`, stubs for every campus module, `buildRootwell`/`installRootwell` wiring in world.ts/app.ts, `site/rootwell-field` + `AIRFIELDS[1]`, giver markers, `deans-leap` ramp + `onStuntLanded`, prefab catalogue stubs | tsc, levels/sites/stunts tests |
| E13-A parallel (25) | A01-A05 prefabs + rewards/achievements, A06 Anthill terrain + ramp, A07a/b runway surface + map, A08a/b sky traffic + charters, A09 sounds, A10 lore, A11 buildings, A12 grounds, A13 campus story, A14 interiors + roofs, A15a/b observatory + interior, A16 Rootwell Field, A17 Pinwheel Ridge, A18 campus life, A19 achievements runtime, A20 side quests, A21 contract test | per-issue tests |
| E13-C integration (lead) | save key wiring, golden regen, tuning, screenshot pass, smoke, zfight, contracts, AGENT_INDEX | all checks |

Issue files (each is the full text a worker got) are in [issues/](issues/); shared environment: issues/_env.md.

## AC evidence

- Storytelling and 3-spot screenshot pass per area: [screenshot-pass.md](screenshot-pass.md), images in [screens/](screens/).
