# E16 Countryside, fauna and the farm
Wave: 6 · Depends on: E01 (site registry: construction sites, vineyard + mansion, farm plot, sparse-area slots), E08 (property purchase with debt, inventory) · Kind: Content
Source items:
- L12 add some construction sites. make them gnome themed and lore appropriate
- L37 add a vineyard and mansion somewhere appropriate
- L39 make sure we have more fauna and deer
- L69 add the ability to buy a farm and start growing produce/farming/whatever as a way to make money. player can farm and sell stuff or just straightu p grow an oak tree and get acorns (though it takes awhile)
- L72 add like little random hunter shacks and tents and other stuff to the more sparse parts of the map so they are less sparse.

## Goal
Make the countryside feel inhabited: construction sites with a gnome-scale logic, a vineyard with a mansion that has a
story, a real spread of animals including deer, hunter camps in empty ground, and a farm the player buys with a loan and
grows for money, including a slow oak that drops Acorns.

## Scope
In:
- **Construction sites** (L12): several sites (fenced plot, scaffolding, crane, half-built gnome house, cement mixer, hard-hat gnomes who work in a loop), gnome-themed (acorn-cap hard hats, bucket-crane, mushroom-stem girders), placed in E01 slots; at least one active site in town outskirts and one near the new areas. Decorative plus a few interactables; one hook for quests.
- **Vineyard and mansion** (L37): a vineyard of grapevine rows on a hill and the mansion with grounds, gate, driveway, gardener; exterior in this epic, interior through E05 if E04 wants it. Lore: owner and reason, decided by E04's bible.
- **Fauna** (L39): add deer (hind, stag, fawn; graze in herds, flee from vehicles and gunfire, huntable through the existing hunting system) and a few more species (e.g. rabbits, ducklings at water, goats on hills, crows) spread over regions; reduce the sparse feeling; keep chill polar bears (E12 owns bears).
- **Farm** (L69): buy a farm plot (E08 `buyProperty`, loan), plant produce in beds (several crops with different grow times and values), water/tend, harvest, sell at a stall or Cloverfield market; plant an oak that takes a long time (several real-time minutes of play, offline-capped growth) and then drops Acorns; save and cloud-save the field. Items go through E08's inventory.
- **Hunter shacks, tents, camps** (L72): 15 to 30 small sites (shack, tent + fire, drying rack, deer stand, duck blind) in sparse regions, each with loot (Acorns, a snack), a campfire sound, optional sleeping hunter NPC; placed from `HUNT_SPOTS`-aware data so they sit near wildlife.
Out: hunting mechanics (exists), polar bears and winter fauna (E12), new region land (E01), farm interiors (E05), chef (E18).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`.
- Fauna: `critters.ts` (`CritterKind = 'cow' | 'sheep' | 'pig' | 'hen' | 'squirrel' | 'polar-bear' | 'bee'`, `CRITTER_SPECS`, `RegionLife { id, groups, init, update, onHit, hitTest }`, `CritterRuntime.spawn/scare/knock/moveToward/nearest`, `critterMesh`, `openSpot`, `isOpen`, `createCritters(scene, world, deps, lives)`), `critters/index.ts` (`REGION_LIFE = [cloverfieldLife, dreyGangLife, fellsLife, commonsLife]`; add a life per new region or one `countrysideLife`), `critters/cloverfield.ts` (herd/pen/herding behaviour template: `HERDABLE`, `buildPen`, `isHerder`), `critters/commons.ts`, `critters/fells.ts`. No deer exists today. Prefabs: `packages/prefabs/src/catalog/gta-farm-critters.ts`, `gta-wild-life.ts`, `critters.ts`. Add a `deer` entry to `CritterKind` + `CRITTER_SPECS` and prefabs.
- Hunting (deer as quarry): `hunting/species.ts` (`SpeciesId`, `SPECIES`, `HuntSpecies`, `HUNT_SPOTS`, `HUNT`, `LODGE`, `HUNT_ACHIEVEMENTS`), `hunting/hunting.ts`, `hunting/quarry.ts`, `hunting/lodge.ts` (`LODGE_PROPS`, `createLodge`), `hunting/huntSave.ts` (key `gta-hunting-v1`). Decision below on whether deer are ambient critters or quarry.
- Sparse-area dressing: `fringe/belt.ts` (`FRINGE`, `FRINGE_THEMES` per `RegionId`, `bandAt`), `fringe/lots.ts` (`planLots`, `BONEYARDS`), `fringe/plan.ts` (`planFringe`), `scenery.ts` (`planScenery`, `SceneryPlacement`), `settlements.ts` (`planSettlements`, `MAX_HOUSES = 140`; outer-region house clusters), `cityScenery/` (`site.ts` footprint helpers `footprintRect`, `prefabBox`, `Site`), `regionThemes.ts` (`REGION_THEMES`, `themeAt`). Prefab kits: `gta-fringe-kit.ts`, `gta-fringe-kit-b.ts`, `gta-fringe-yard.ts`, `gta-hunt-gear.ts`, `gta-pebblewick*.ts`, `gta-world.ts`, `gta-world-green.ts`.
- Regions/farmland: `levels.ts` (`RegionId` includes `cloverfield-farms`; `RegionBiome` 'farmland'; marker kinds `'site' | 'reserve' | 'setpiece' | 'area'`; `GtaRegionDoc`), region doc `data/levels/cloverfield-farms.level.json` (markers, props, stamps; base generator `gta-farmland-scatter`). New plots are reserved by E01 as `site`/`reserve` markers: read them with `markersOf` / `marker('site', id)`.
- Plants: `flora/kinds.ts` (`FLORA`, `PLANT_KINDS`, `plantKind`, `giant-oak` entry with `mowable: false`), `flora/state.ts` (`mowPlant`, `stepPlants`, `regrowCurve`: the regrow state machine is for mowing, not crops; do not repurpose, write a separate `farm/` module), `flora/rewards.ts` (Acorn payouts; save key `gta-mowing-v1`), `flora/runtime.ts` (`createFlora`).
- Economy and items: E08 `registerProperty`/`buyProperty`/`ITEMS`/`addItem`; `economy.ts` `earn`; `outskirts/shopItems.ts` and `outskirts/shopUi.ts` as the pattern for a stall UI.
- Saves: `saveIO.ts` `GTA_SAVE_KEYS`, `cloudSave.ts` `MERGES` (a `gta-farm-v1` key needs a merge entry), `saveIO.test.ts`.
- Lore: `docs/lore/entries/apocrypha/cloverfield-farms.md`, `cloverfield-dew-wells.md`, `cloverfield-south-barn.md`, `combine-harvester.md`; setting file `docs/lore/settings.md`.

## Contracts this epic provides
- `farm/`: `FarmDef`, `CROPS` registry (`{ id, seedCost, growS, yield, sell, prefabStages }`), `plantCrop`, `harvest`, `farmState()`; the oak crop is one `CropDef` with `growS` very long and an `acorns` yield. Event `onHarvest` for E18 (chef ingredients) and achievements.
- `CritterKind 'deer'` and a `spawnHerd(kind, x, z, n)` helper reusable by E12/E17 if they want herds.
- A `camps.ts` data table (`CAMPS: { id, kind, x, z, yaw, loot }`) that E20-E22 quests can reference.

## Contracts this epic consumes
- E01 site registry: construction-site slots, vineyard + mansion footprint, farm plot(s), and the extended region markers; if a slot is missing the lead stops and reports.
- E08: property API with loan, inventory (`addItem` for produce, `ITEMS` registration), shop catalogue.
- E04: lore for the mansion owner, vineyard name, construction company; writer-chosen names must pass `npm run lore`.
- E05: optional mansion interior entry.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): critters are per-client ambient (check how `createCritters` is synced, if at all, before adding deer; match the existing cow/sheep pattern). The farm is private per player and saved locally; other players do not see crop growth. Construction sites and camps are deterministic static world from seeded data (same on every client).
- Mobile: planting, watering, harvesting and selling use on-screen action buttons / tap on a bed, 44 px; no hover prompts. Stall UI as a bottom sheet.
- Achievements: "First Sprout", "Oak Patience" (oak yields), "Mansion on the Hill" (visit), "Deer Me" (see N deer), "Camp Crasher" (visit N camps); cosmetic rewards (hand: trowel, head: straw hat via `gta-hunt-gear`/`gta-wild-gear` style prefabs).
- Prefabs: all new objects through `@lawn/prefabs`: deer, crops (3 growth stages each), scaffolding, crane, mixer, vine rows, mansion, shack, tent, drying rack, deer stand; add to `gta-farm-critters.ts` / `gta-wild-life.ts` / a new `gta-countryside.ts` catalog file registered like the others; `npm test -w packages/prefabs`.
- Lore: construction firm, vineyard, mansion owner and the farmland's market need entries; search `npm run lore -- find farm|vineyard|mansion|construction` first; follow `docs/lore/canon.md`.

## Risks and open questions (decisions taken)
- Deer as critters or as quarry: decision, both. Ambient `deer` critters (calm, flee at range) in woods and farmland; `hunting/species.ts` gets a `deer` species with the same spawn points so hunters can knock them over for tufts; do not make two separate animals sharing a prefab.
- Crop growth while the game is closed: decision, grow on a wall-clock timestamp capped at 2 hours of offline growth (oak: 20 minutes of play-time-equivalent per stage, 3 stages), so there is no endless grind and no exploit; cloud-save merges take the later timestamp.
- Performance with many camps and critters: cap camps at 30, deer herds at 4 x 6, use `cull.ts` (`buildStaticCells`) for static camp props.
- Farm and Cloverfield region doc conflict with E01 edits: this epic does not edit region JSON geometry; it places things only in E01-reserved slots.
- Size: this is five features. If decompose exceeds about 30 issues, defer the vineyard interior and extra crops and report.

## Done when
- `npm run build -w games/gnome-theft-auto`
- `npm test -w games/gnome-theft-auto` (new `farm.test.ts` growth/offline cap, `camps.test.ts` no camp in water/road/collider, critter spawn test for deer, `saveIO.test.ts`)
- `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...` clean; `npm run zfight -- <url>` clean at the sites; phone 390x844: buy farm, plant, wait, harvest, sell, see deer and a hunter camp.
