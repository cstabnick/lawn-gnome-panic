# E31 Living world: the Unmown preserve, birds and animals, more vehicles, pushing places out
Wave: 5 · Depends on: E28, E29 (plus E06 weather, E07 Gnomlet/map, E09 sound, E10 homes, E27 mowables) · Kind: Content
Source items: L99 (this epic's share), verbatim: "The world should feel alive, the player should have the experience to
visit a lot of areas. include a nature preserve too somewhere. continuing pushign existing environments out. ... be
ambitious and make sure to spend a lot of time detailing and environmentally story telling (add success criteira for that
as part of AC for that task). more birds and animals too. more veicles as well. especially if we can start adopting
european type vehicles."

## Goal

Make the map between the set pieces feel lived in: build the Unmown nature preserve into a place worth a visit (ranger
station, trails, a boardwalk over a marsh, three bird hides, rangers, a spot-the-species checklist), put more birds and
small animals in every region, widen the traffic mix with three new civilian vehicles and regional mixes, and fill the
empty outer bands (Trellisdown, Snowcap Rise outskirts, the Saltbucket hinterland) with hamlets, houses and roadside life.

## Scope

In:
- **The Unmown** (sites `unmown-*` from E28): ranger station (exterior + walk-in interior), the Reedmere marsh (a shallow
  still-water body) with a raised boardwalk and a viewing platform, three bird hides, trail furniture (waymarkers,
  fingerposts, rules boards, benches, interpretive panels), Oldroot Wood dressing, at least 6 vignettes, 2 rangers and
  3 visitors with lines, a checklist activity (12 species: birds, animals, one plant), preserve wildlife, point sounds,
  map pins.
- **Birds:** about 8 new species (bittern, marsh harrier, cuckoo, kingfisher, mallard, cormorant, Snowcap eagle, a diver
  on the High Tarn), region weights for every band region, no new owls (the Night Owl achievement counts three).
- **Animals (not deer):** new critter kinds hare/rabbit, hedgehog, fox, frog, duck, crab, butterfly, dragonfly; two new
  `RegionLife`s (the Unmown; the bands) plus a few additions to old regions through the bands life.
- **Vehicles:** three new civilian kinds with full registration: `ranger-buggy` (Unmown Ranger Buggy), `shell-camper`
  (Snail-Shell Camper, tourists on band roads), `cone-van` (Saltbucket ice-cream van); regional traffic mixes; new
  `FLEET` variants; parked spots in the hamlets, trailheads and the ranger station; NPC boat routes on the sea and the
  Thymes; 2-3 sky-traffic behaviours over the new regions.
- **Pushing out:** settlements extended into the outer bands (houses along band roads); three named hamlets with signs,
  a centre piece, vignettes and residents; the High Tarn (`snowcap-high-tarn`, E31 slot); roadside life along band roads
  (lay-bys, fingerposts, milestones, bus shelters, wayside shrines).
- Achievements (6, each with a wearable reward), lore (entries, rulings from R-199), perf before/after on a new
  `--route outer` in `tools/gta-perf.mjs`.

Out (owned elsewhere): deer and "more fauna" as a farm topic (E16 L39), construction sites (L12), vineyard and mansion
(L37), the farm (L69), hunter shacks and tents in sparse parts (L72), Rootwell and its `rootwell-field-station` slot
(E13 is building the campus now: deferred to a later pass), Pardonlin's own life and town (E30), the coast set pieces
(E11), story quests (E20-E22).

## Code pointers (confirmed)

- Sites: `src/sites.ts` (`siteById`, `anchorOf`, `reservedRects`); E31 slots `unmown-ranger-station` (-1560, -1150) 50x40
  door (-1540, -1130) trailhead (-1560, -1172); `unmown-wetland` Reedmere (-1150, -1650) 320x160; `unmown-meadow`
  (-560, -1640) 440x240; `unmown-old-wood` (-1670, -1560) 220x300; `unmown-hide-1..3` (-1050, -1550), (-560, -1490),
  (-1700, -1330) 12x12; `snowcap-high-tarn` (1000, -1600) 240x160.
- Paths (world): `unmown-lane` (-1400,-1020)→(-1480,-1060)→(-1540,-1120); `trail/unmown-loop` (-1560,-1172)
  (-1600,-1350) (-1500,-1500) (-1300,-1460) (-1150,-1470) (-900,-1560) (-750,-1460) (-550,-1440) (-330,-1560)
  (-300,-1460); `trail/reedmere-boardwalk` (-1300,-1460) (-1200,-1520) (-1100,-1560) (-1000,-1520) (-900,-1560).
- `src/unmownGate.ts` (E28: entrance sign + swallowed mower, pattern for placing prefabs + colliders).
- World build: `src/world.ts` (~line 1100, after `buildCoast`); per-frame runtimes in `src/app.ts`.
- Critters: `src/critters.ts` (`CritterKind`, `CRITTER_SPECS`, `RegionLife`, `CritterRuntime.spawn`, `critterMesh`),
  `src/critters/index.ts` `REGION_LIFE`, examples `critters/snowcap.ts`, `critters/commons.ts`.
- Birding: `src/birding/species.ts` (`BIRDS`, 28 today; `species.test.ts` counts), `types.ts` (`BirdSpecies`,
  `BIRD_ACHIEVEMENTS`), `hide.ts` (Reedwatch hide pattern), sounds registered from `BIRDS` automatically.
- Residents: `src/ambientGnomes.ts` `createAmbientGnomes(scene, defs)` with `AmbientGnomeDef` (bubble line, idle anim).
- Text signs: `homes/pieces.ts` `textPlate(text, x, y, z, yaw, opts)`; E29 `eurokit/signs.ts`.
- Interiors: `interiors/registry.ts` `defineInterior`; examples `interiors/showcase/bodega.ts`, `golf/clubhouse.ts`.
- Settlements: `src/settlements.ts` `planSettlements` (stops at `MAP_EDGE` 860: the bands have no houses today).
- Traffic: `traffic.ts` `pickKind`, `config.ts` `TRAFFIC`, `fleet.ts` `FLEET`, `boatTraffic.ts`, `skyTraffic/`.
- Vehicle registration checklist (E14 brief): `types.ts` VehicleKind; `config.ts` VEHICLES; `handling.ts`;
  `driveGrips.ts`; `sound/engines.ts`, `sound/watchVehicles.ts`; `audio.ts`; `net.ts` VEHICLE_CODES / `glazeStore.ts`;
  `fleet.ts`; `errands.ts`; `brands.ts`; `anim/rideAuto.ts`; glaze mounts or exclusion (`glazeMounts.ts`).
- Perf: `src/cull.ts` (`buildStaticCells`), `src/quality.ts`, `tools/gta-perf.mjs --route outer` (added by E31).

## Contracts this epic provides

Written to `E31/contracts.md` at the end: `src/unmown/` (preserve build + runtime), `src/living/` (bands life, hamlets,
roadside), new critter kinds and `RegionLife`s, new bird species ids, new vehicle kinds, checklist save key
`gta-unmown-checklist-v1`, achievements ids, hamlet names and positions (for story epics), what was deferred.

## Contracts consumed

E28 sites/paths/gate; E29 rides and `setEuroZone`; E06 weather; E07 `registerGnomletApp`, map POIs; E09 sound ids and
region beds; E10 `registerHome`; E27 mowable plants (`flora/world.test.ts` guard); E05 `defineInterior`.

## Online / mobile / achievements / prefabs / lore

- Online: critters, birds, the checklist and hamlet life stay local per browser (as today). The three vehicle kinds are
  appended to `VEHICLE_CODES` so remote players see them. No new messages.
- Mobile: no new keys. The checklist is a Gnomlet app (touch list, 44 px rows); the ranger station uses the existing
  interior prompt; hides use the existing birding scope.
- Achievements (wearable rewards): Every Last Tick (checklist), Dry Feet (boardwalk end to end), Hide and Seek (all three
  hides), Fresh Feathers (5 of the new birds), Off the Beaten Lane (all hamlets + the High Tarn), Weekend Away (drive all
  three new vehicles).
- Prefabs: preserve kit, trail furniture, three vehicles, new critters and birds, six reward gear items.
- Lore: entries for the ranger station, rangers, Reedmere, the hamlets and the High Tarn; rulings from R-199.

## Environmental storytelling AC (a)-(e), per area (the Unmown; each hamlet; the High Tarn)

(a) >= 3 vignettes per area (the Unmown: 6); (b) satirical signage per area (rules boards, fingerposts, hamlet signs,
notice boards); (c) at least one resident doing something specific (ranger counting reeds with a clicker; hamlet locals);
(d) ambient sound and life (frog chorus, preserve birds, critters; hamlet pigeons); (e) screenshots, 3 spots per area,
in `E31/screens/`.

## Risks and open questions (decisions taken)

- Perf on a phone: all new scenery goes through static batched cells (`buildStaticCells` / `buildStaticPrefabs`); critters
  build meshes only near the player (existing runtime); settlement house caps per band. Measured before and after.
- Marsh water: added as a still-water marker `water/reedmere` (shallow, 0.5 m) like `water/pardonlin-basin`; the golden
  layout is regenerated deliberately.
- Rootwell field station is deferred (E13 owns Rootwell right now).
- New species make "The Full Life List" longer for players who have not finished it; accepted (earned rewards stay).

## Done when

The checks in the process doc pass (build, tests, lore, smoke in the Unmown and a hamlet, zfight there), perf before/after
reported, screenshots recorded, contracts written.
