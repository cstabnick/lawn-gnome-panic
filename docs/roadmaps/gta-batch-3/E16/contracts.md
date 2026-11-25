# E16 contracts: the countryside, the deer and Windfall Croft

What E16 gives later epics (E18 activities and the chef, E20-E22 story, R1). Code: `games/gnome-theft-auto`. World
coordinates: +x east, +z south, metres.

## Places (`src/country/types.ts`)

| Place | Where | Built by |
|---|---|---|
| Thorne Even-Estates Plot 1 (Chard's caravan, giver `chard`) | (-295, -120), gate west at (-320, -120) | `country/estates.ts`, `estatesLife.ts` |
| Plot 2 | (195, 325), gate east at (220, 325) | same |
| Plot 3 | (1050, 250), gate west at (1020, 250) | same |
| Trellisdown Vineyard (gate, Chicory's lodge, press-house, first vine, crooked row) | x -1290..-990, z -280..-60; gate (-1140, -61) | `country/vineyard.ts`, `trellisLife.ts` |
| Brassknock Manor (front knocker at (-1150, 20.5), back door (-1150, 41.5) into interior `brassknock-manor`, terrace rooftop `brassknock-terrace`) | x -1210..-1090, z -10..90 | `country/manor.ts`, `manorInterior.ts`, `trellisLife.ts` |
| Windfall Croft (gate (60.5, 535), For Sale board, stall, seed rack, 8 beds, oak spot (118, 534)) | x 60..140, z 505..565 | `country/croft.ts` (static), `farm/runtime.ts` (living) |
| 26 hunter camps (`CAMPS`, ids `camp-<region>-<n>`) | outer regions | `country/camps.ts`, `campsBuild.ts` |

`EVEN_ESTATES[i]` gives every site's `gate`, `hoarding`, `homes`, `halfBuilt`, `crane`, `yard`, `caravan`, `story`,
`crewLoop` in world coordinates (`estateLocal(site, lx, lz)` turns a local point). World change W02/W17 (hoardings up
after #7, down after the finale) is not wired: the sites are always up; a story epic can hide them by id.

## Wiring

- `buildCountryside(scene, boxes)` (world.ts) and `installCountryside(jobDeps): Countryside` (app.ts: `update`,
  `blips`, `prompt(x, z)`, `interact(x, z)`, chained after golf in the on-foot E prompt).
- A new part: a module returning `CountryPart { update?, blips?, prompt?, interact? }`, added in `country/index.ts`.
- Homes: `registerCountryHomes()` registers doors for `wisteria` (interior `brassknock-manor`), `chicory` (lodge),
  `chard` (caravan).

## Farm (`src/farm/`)

```ts
CROPS: CropDef[]            // radish, carrot, cabbage, pumpkin, oak: { id, seedCost, stageS, growS, yield, sell, item, heal, prefabStages, produce, needsWater }
FARM                        // propertyId 'windfall-croft', price 2200, down 300, interest 0.1, offlineCapS 7200, oakShakeS 600, oakShakeAcorns 40, saveKey 'gta-farm-v1'
// state.ts (pure): newFarm, plantCrop, waterBed, harvest, plantOak, shakeOak, oakReady, stepFarm, applyOffline,
//   bedStatus, bedSecondsLeft, oakSecondsLeft, serializeFarm, parseFarm, mergeFarm
onHarvest(cb: ({ crop, n, bed }) => void): () => void   // farm/events.ts: every harvest and oak shake (E18 chef ingredients)
farmState(): FarmState | null                            // farm/runtime.ts
```

Produce items (`produce-radish`, `-carrot`, `-cabbage`, `-pumpkin`) are registered snacks (heal 0.08-0.35), not sold by
the bag shop. The Farm app (Gnomlet id `farm`, group money) shows beds, the oak, the crate and the seed picker.

## Fauna

- `CritterKind` + 'deer' | 'stag' | 'fawn' | 'goat' (prefabs `deer-hind`, `deer-stag`, `deer-fawn`, `goat`);
  `critters/countryside.ts`: `HERDS` (6 deer herds, 2 goat flocks), `spawnHerd(rt, kind, x, z, n, group, leash)`
  (reusable: 'deer' makes a stag + hinds + fawns), `deerWithin(x, z, r)`, `countrysideLife`. `CritterCtx.ammo`
  (optional) lets any RegionLife react to gunshots.
- Hunting species `deer` ("Trellisdown Red Deer", tuft `tuft-deer`, keepsake `keep-deer`, call `hunt-deer`) at
  (-1290, -440) and (-1240, -840). The Field Guide achievement now needs it too.
- Critter calls `deer-bark`, `goat-bleat` (sound/ids.ts `CRITTER_SOUNDS`).

## Quests, achievements, saves, sounds

- Side quests `sq-levelright-night-shift` (giver `chard`, marker `giver/chard`) and `sq-windfall-croft-deed` (giver
  `bramble`, marker `giver/bramble`), temporarily unlocked after existing story quests: E20 re-times them to #7 / #31.
- Achievements: `gta-first-sprout` (hand `croft-trowel`), `gta-oak-patience` (head `croft-straw-hat`),
  `gta-mansion-on-the-hill` (neck `brass-knocker-pendant`), `gta-deer-me` (12, head `antler-headband`),
  `gta-camp-crasher` (10, back `camp-kettle-pack`), `gta-level-best` (3, hand `spirit-level`).
- Save keys (all "newer side wins" in cloudSave): `gta-farm-v1`, `gta-country-v1`, `gta-camp-loot-v1`.
- Sounds (`COUNTRY_SOUNDS`, registered by `country/sounds.ts`): campfire, site hammer/mixer/crane, vine snip, deer
  bark, goat bleat, manor knocker, snore, farm plant/water/harvest/sell/oak shake.
- Lore: rulings R-203..R-207 (renumber at merge if taken); entries `red-deer`, `hunters-camps`, `footman-pell`.

## Hooks for story epics

- Manor: the ledger room is a locked door spot in the tasting hall (#50 / #65 can add an interior and swap the line).
- Chicory's frost-pots burn the stolen Black Dew (vignette by the lodge) for #17.
- Even-Estates: Chard at Plot 1; the plans table at Plot 1 ("Read the plans"); the show-home door ("Knock").
