# E13 contracts: Rootwell (campus, the Anthill, Rootwell Field, Pinwheel Ridge)

What E13 gives later epics (E17/E18 jobs, E20-E22 story). Code: `games/gnome-theft-auto/src/campus/`. World metres,
+x east, +z south. All positions below are constants in `src/campus/types.ts`: import them, never copy numbers.

## Places

- `CAMPUS`: site x 980..1300, z -350..-50; `quad` x 1080..1210, z -265..-140 with the founder's statue at
  `quadCentre` (1145, -202); `gate` (982, -200); `drive` from the east-band road (946, -200) to (1080, -200); `parking`;
  `sugarStore` (1265, -224) behind the Trencher; `pitch` (1040, -95) (the Clod).
- `CAMPUS_BUILDINGS`: 13 rows (the twelve lore buildings + the Dean's lodge) `{ id, name, role, prefab, x, z, yaw, w, d,
  h, door, interior?, roof?, tour }`. `door` is a walkable spot outside the front door. `buildingFootprint(b)` in
  `buildings.ts` gives the collider rectangle. Prefabs `rootwell-*` are half size: place with `scale: 2`.
- `ROOTWELL_ROOMS`: interiors `uni-library` (librarian, essayDesk), `uni-lab` (bench), `uni-lecture` (lectern,
  roofStairs), `anthill-observatory` (telescope, desk): local spots for quest `visit`s with `interior: <id>`.
- Rooftops: `plumbob-roof` (Plumbob Hall, helipad pad r 5, in `landingPads()`), `tilth-roof` (stairs from `uni-lecture`).
- `OBSERVATORY`: summit (1240, 150) flattened r 30 (stamp in `east-campus.level.json`); dome (1258, 158) r 9, door
  (1247.5, 158) facing west; `antDoors` north/east/south; `runUp`, `leapClear`; the ramp `deans-leap` (z 126.5, 14 long, 6 high, lip z 119.5); `trail/anthill-road` from `roadStart`
  (948, 110) to `roadEnd` (1238, 182). Stunt ramp `deans-leap` (`STUNT_RAMPS`); `onStuntLanded(cb)` in `stunts.ts`
  reports every qualifying landing `(rampId, dist, airTime)`.
- `TELESCOPE_EVENT` ('gta:rootwell-telescope', detail `{ night }`) fires when the observatory telescope is used.
  The lens is still in the telescope: row 46's "The Lens" (E21) takes it; W12 leaves the dome open and empty.
- `ROOTWELL_FIELD` / `config.ts ROOTWELL_AIRFIELD` (= `AIRFIELDS[1]`, from the `site/rootwell-field` marker): runway
  (1300, 600), yaw 0 (take-off south), 420 x 24; apron, taxiway, access, hangar, tower, windsock, copter `pad`
  (1245, 640). Parked: Crop Dusters, a Hedge-Hopper, a Sycamore Copter (`planeSpots[].kind`). Asphalt for driving, drawn
  on the map, sky traffic `rootwell-circuit`, charters to `rootwell-field` / pad `rootwell-field-pad`, scenic sights
  `sight-anthill`, `sight-pinwheel-ridge`. `world.airfield` and `AIRFIELD` stay the desert strip.
- `WIND_FARM`: ten `pinwheels` (`pinwheel-1`..`10`, x 715..985, z ~-1202, colour red/yellow/blue), `PINWHEEL_SIZE`
  (hub 24 m, rotor 9 m, spin 0.9 rad/s), Ragwort's `hut` (860, -1234) and the `substation`; tracks
  `trail/pinwheel-track` and `trail/pinwheel-track-east` in `north-highlands.level.json`. Rotor groups are named
  `pinwheel-rotor` (row 41's "free three pinwheels" can stop/start them through `windFarm.ts`; add an API there).

## People and homes

`registerHome` done for `lovage` (Dean's lodge door), `betony` (observatory door), `ragwort` (control hut). Residents:
students, the groundsman and the Dean walking (`life.ts`), Sextant on the summit (`observatory.ts`), two aeronautics
students (`field.ts`), Ragwort on the ridge (`windFarm.ts`). Professor "Dr Clod Furrow" lectures in Tilth Hall (new
name, interior only).

## Quests, achievements, save

- Side quests `sq-rootwell-lost-essay` (giver `lovage`) and `sq-anthill-rent` (giver `betony`) in
  `src/quests/rootwellQuests.ts`, stages `src/quests/stages/rootwell.ts`; both unlock after `ch4-spade-truce` until E21
  moves them to m47/m48. `sq-pinwheel-linemen` (schedule: E14) is not built.
- Achievements: `gta-deans-leap` (Not Termites), `gta-first-class-honours` (12 campus doors), `gta-stargazer`,
  `gta-touch-and-go`, `gta-windfall`, rewards `ant-antenna-headband`, `rootwell-college-scarf`, `star-chart-tube`,
  `rootwell-flight-goggles`, `pinwheel-hat`. Save key `gta-rootwell-v1` `{ v: 1, doors }` (in `GTA_SAVE_KEYS`).
- Sounds: `turbine-whoosh`, `ant-skitter`, `telescope-whirr`. Map kinds `campus`, `observatory`, `windfarm`.
- Lore: R-199..R-202, entry `deans-leap`.
