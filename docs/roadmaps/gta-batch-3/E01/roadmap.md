# E01 World expansion and site plan: roadmap

Brief: [../E01-world-expansion.md](../E01-world-expansion.md). Contracts for later epics: [contracts.md](contracts.md).

Goal: grow Gnome Theft Auto's map from 1800 to 2800 square, with four new band regions round the old square, reserve a
named footprint (a *site*) for every later batch-3 epic, and rebuild downtown for L92 (three blocks into one park, a
2x1 mega block over a tunnel).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 1 Foundation | written by the lead: layout 1400/1395, the four band documents with their highways, `slot` marker kind, `src/sites.ts` registry + `sites.test.ts`, `reservedRects()` in the five keep-out loops, per-biome tables for the four new biomes, `AIRFIELDS`, `POS_BOUND`, landscape features (ski hill, highland spine, wind-farm ridge, observatory mound, vineyard slope), test updates | build + all tests but the golden pass | 0 (lead) |
| 2 Fill | six parallel issues, disjoint files | each issue's own checks; then the lead runs build, full tests, regenerates the golden on purpose | 6 |
| 3 Close | lead: golden regenerated and reviewed, smoke, zfight, AGENT_INDEX, contracts.md, commit | all checks | 0 (lead) |

Online: only `POS_BOUND` changes (remote players in the bands are believed). Mobile: no new UI; the map picture is capped
at 2048 px (issue 2A). Party slice: none (no new activity; the slots' epics decide theirs).

## Epic 2 issues (all parallel)

| Issue | Worker | Files it owns |
|---|---|---|
| [2A map picture scale](epic-2/2A-map-picture-scale.md) | haiku | `src/hud.ts` |
| [2B downtown park and mega block (L92)](epic-2/2B-downtown-l92.md) | sonnet | `src/world.ts`, `src/parks/blocks.ts`, `src/parks/layouts.ts`, `src/parks/layoutC.ts` (new), `src/city/megaBlock.ts` (new) |
| [2C band landforms](epic-2/2C-band-landforms.md) | haiku | `src/landforms/{northHighlands,southShore,eastCampus,westEstates}.ts` (new), `src/landforms/index.ts`, `src/landforms.test.ts`, `data.terrain` of the four band documents |
| [2D band scenery](epic-2/2D-band-scenery.md) | haiku | `src/biomes.ts` |
| [2E band achievements](epic-2/2E-band-achievements.md) | haiku | `packages/achievements/src/catalog.ts`, `src/bandAchievements.ts` (new), `src/app.ts` (one block) |
| [2F band lore](epic-2/2F-band-lore.md) | haiku | `docs/lore/**` |

No two issues share a file. The golden layout test (`src/layout.golden.test.ts`) fails on purpose until the lead
regenerates it after epic 2: workers never update `src/data/layout.golden.json`.

## How it went

- All six issues landed. 2E was blocked (every head/neck/back gear prefab is already some achievement's reward, and the
  achievements test allows one achievement per gear): the lead added four prefabs (`snowcap-tuque`,
  `saltbucket-boater`, `rootwell-mortarboard`, `trellisdown-cravat`) and pointed the rewards at them.
- 2B moved a few cutscene stage marks out of the Double Pot's east half (`quests/stages/turftonB.ts`, `ch1d.ts`) and
  gave `mapPois.ts` one blip per park name. The lead fixed two z-fights it found (slab ends, promenade corners).
- 2C widened `landforms.test.ts` sampling to the whole map so the band tests see their land.
- E04 merged mid-epic: site ids stay, each slot carries E04's name as `label`; region names are E04's.

## Deferred (not in E01)

- Content of every slot (the epic named in each slot's `epic`).
- Ocean water body, waves and `WATER.order` entries (E11), ice-lake water (E12), observatory summit levelling and ramp
  (E13), runway 2 in `AIRFIELDS` and its consumers (E13).
- Map zoom and legend growth for the bigger map (E07).
- Settlements and fringe belts in the bands (no epic owns them yet; regionThemes has their looks).
