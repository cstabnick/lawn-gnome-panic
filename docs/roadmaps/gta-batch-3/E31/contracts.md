# E31 contracts: the living world

What E31 gives later epics (E16 countryside, E18 activities, E20-E22 story). Code: `games/gnome-theft-auto`.

## Places (world metres; `src/living/config.ts`)

| Place | Where | Code |
|---|---|---|
| Unmown Ranger Station (walk-in, interior `unmown-ranger-station`) | (-1560, -1150), door (-1540, -1130) | `src/unmown/station.ts` |
| Reedmere marsh (`water/reedmere`, still, 0.7 m) + boardwalk + viewing platform | water x -1260..-1040 z -1705..-1605; `BOARDWALK`, `PLATFORM`; walkable rooftops `reedmere-walk-1..3`, `reedmere-platform`, `reedmere-step-1..4` | `src/unmown/marsh.ts` |
| Bird hides: Reedmere / Meadow / Wood Hide | `UNMOWN_HIDES` | `src/unmown/hides.ts` |
| Trail dressing (boards, panels, benches) | trail/unmown-loop, trail/reedmere-boardwalk | `src/unmown/trails.ts` |
| Vignettes, Oldroot Wood, the Last Dandelion (-600, -1660), Unmown people | | `src/unmown/vignettes.ts` |
| Espalier End (Trellisdown) | (-1080, -420) r 75 | `src/living/hamletEspalier.ts` |
| Mittenholt (Snowcap Rise) | (550, -1375) r 75 | `src/living/hamletMittenholt.ts` |
| Dunelow (Saltbucket hinterland) | (-560, 965) r 75 | `src/living/hamletDunelow.ts` |
| The High Tarn (`water/high-tarn`, bothy, jetty rooftop `high-tarn-jetty`), `trail/high-tarn-path` | (1000, -1600) | `src/living/highTarn.ts` |
| Roadside stops along the band roads | | `src/living/roadside.ts` |
| Band settlements (second pass, `BAND_SETTLEMENTS`) | Trellisdown, Snowcap, Saltbucket, beyond 905 m | `src/settlements.ts` |

All static scenery is in culled cell batches (`placePieces` in `src/living/place.ts` wraps `buildStaticCells`).
World build entry: `buildLivingWorld(scene, boxes)` (`src/living/build.ts`, called from world.ts after the coast).
Per-frame: `createLivingWorld(deps)` (`src/living/runtime.ts`, app.ts): people, sounds, checklist, achievement watches,
map pins. Parked spots: `livingParked(boxes)` (`src/living/parked.ts`).

## Wildlife and birds

- `CritterKind` + 'hare', 'hedgehog', 'fox', 'frog', 'duck', 'crab', 'butterfly', 'dragonfly' (no deer: E16).
  `CritterSpec.swims` (on water), `hop` (bounce). RegionLifes `critters/unmown.ts`, `critters/bands.ts`.
- Birds (`birding/species.ts`, 36): + `reedmere-bittern`, `marsh-harrier`, `meadow-cuckoo`, `thymes-kingfisher`,
  `pond-mallard`, `shore-cormorant`, `snowcap-eagle`, `tarn-diver`; batch-3 regions have >= 5 species each.

## Vehicles

`ranger-buggy` (Unmown Ranger Buggy), `shell-camper` (Snail-Shell Camper), `cone-van` (Ninety-Nine Cone Van): full
registration, appended to `VEHICLE_CODES`. Regional traffic mixes `src/living/trafficMix.ts` (`REGION_TRAFFIC`). Fleet
variants `ranger-buggy-head`, `shell-camper-grand-spiral`, `cone-van-soft-serve`. New boat routes (sea, Thymes, tarn,
basin) and sky behaviours `preserve-survey`, `coast-patrol`, `snowcap-sightseer`.

## Activity, saves, achievements

- Unmown checklist (12 entries, `unmown/checklist.ts`), Gnomlet app 'unmown-checklist'; save `gta-unmown-checklist-v1`.
- Progress save `gta-living-v1` (hides, places, rides, new birds).
- Achievements: `gta-unmown-checklist`, `gta-dry-feet`, `gta-hide-and-seek` (3), `gta-fresh-feathers` (5),
  `gta-off-the-beaten-lane` (4), `gta-weekend-away` (3); rewards `ranger-campaign-hat`, `reed-whistle`, `hide-camo-cape`,
  `bird-call-whistle`, `milestone-medal`, `camping-roll`.

## Deferred

- Rootwell's `rootwell-field-station` slot (E13 owns Rootwell during this wave).
- A guided ranger walk; story quests in the preserve and the hamlets (E20-E22).
- Snow-white hares on Snowcap (one hare prefab), a Turfton pond duck group (Mallard Mere is not terrain water).
- Prefab gaps (no rosette, carrot, folded chair, chip paper): stand-ins used; `bird-hide` is a solid mesh (its inside is
  collider-only).
