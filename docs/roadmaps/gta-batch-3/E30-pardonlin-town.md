# E30 The European town: Pardonlin build-out, environmental storytelling, classical radio
Wave: 4 · Depends on: E28 (land, streets, sites), E29 (European kit), E05 (interiors), E06 (weather) · Kind: Content
Source items: L99 (the town part): "...i think that the next yard should have a more european style city with closer
buildings and ambling paths and make them a bit stereotypical in the satirical way we are already doing. kind of a
parondonlin type of deal. ... be ambitious and make sure to spend a lot of time detailing and environmentally story
telling (add success criteira for that as part of AC for that task). ... eorpean platns and backyard styling too. and
include a new radio station for them that is just classical music or something."

## Goal
Pardonlin stops being bare blocks between E28's streets. It becomes a dense, ambling continental town in four districts,
told through props, signs and people in the game's own satirical-but-affectionate voice, with its own classical radio
station (Radio Adagio), two walk-in rooms and three small town activities.

## Scope
In:
- **Four districts** (`src/pardonlin/layout.ts DISTRICTS`), each a pure plan (`src/pardonlin/districts/*.ts`) of kit
  buildings, props, text signs, vignettes and residents that `src/pardonlin/town.ts` builds:
  - **the Old Town** (east bank, north of the Hatwheel): the Bean Tower landmark (a giant bean-pole wigwam) with its
    tourist queue, the Grand Platz (paved square, fountain, bandstand, café terraces, boules, the mime, the painter,
    pigeons), terraces both sides of the Rue Haute and along the cross streets.
  - **Teacup Row and the Quays** (east bank, south of the Hatwheel): the café street with terraces spilling onto the
    pavement and the bakery queue, the east quay along the Thymes Walk (railings, bookstalls, an accordion, anglers),
    Place du Pot, terraces down to it.
  - **the Left Bank** (west bank): Radio Adagio in the Opera Hall facing the Boulevard, the Beetle Market, artists'
    terraces, and the backyards strip (European backyard styling: pergolas, washing lines, espaliers, water butts).
  - **the Jardin and the Basin**: the Jardin's parterre (box hedges, topiary, gravel), the Little Gardens allotments and
    Basin Quay (a boathouse, a swan pedalo).
- `setEuroZone(insideEuroYard)` over the town (town.ts).
- **Life**: ~20 named Continentals standing about doing place-specific things (createAmbientGnomes defs per district),
  pigeons that scatter, swans and ducks on the Thymes, cyclists and strollers on the footpaths (`life.ts`); town sounds
  (`sound.ts`): steeple bell, accordion, café cups, pigeons, boules.
- **Radio Adagio** (96.1): a bonus station on the dial (DIAL and STATION_CODES appended), 12+ original classical pieces
  as SongSpecs (new voices: harpsichord, cello, violin, oboe), a pompous host (Maestro Ottavio Lento) with idents,
  banter, ads and calls; heard on foot from town loudspeakers and gramophones (`speakers.ts`).
- **Interiors** (`interiors.ts`): Café Pardon on Teacup Row and the Radio Adagio studio foyer in the Opera Hall.
- **Activities** (`activities.ts`, not journal quests, so the side-quest caps are untouched): the Grand Platz queue
  ("Queued for Nothing"), the Baguette Round (deliveries for the baker), the Portrait Sitting (the painter), plus the
  Flâneur walk (all four districts on foot).
- Achievements with wearable rewards; new prefabs; lore entries for every new named place and person; Pardonlin
  residents in the character bible.

Out: new story quests (E20-E22 own the outline), the nature preserve and more birds/animals everywhere (E31), trams,
glaze mounts for the rides (deferred by E29), shared online rooms, roof access.

## Code pointers (confirmed)
- `src/pardonlin/layout.ts` (E30 foundation, written by the lead): `pl()`, `DISTRICTS`, `districtAt`, `insideEuroYard`,
  `frontage(pathId, side, offset, gap, from, to)`, `footprintProblem`, `footprintsOverlap`, `pathPoints`, `roadClearance`.
- `src/pardonlin/plan.ts`: `DistrictPlan`, `PlanProp`, `PlanSign`, `Vignette`, `buildingFootprint`, `keepClear`, `local`.
- `src/pardonlin/plans.ts`, `town.ts` (merged static cells via `buildStaticCells`, colliders, sign text atlases on the
  decal layer culled as 'detail'), `layout.test.ts` (clearance and the AC counts per district).
- E29 kit: `src/eurokit/street.ts planStreetRow`, `catalog.ts EURO_BUILDINGS`, `signs.ts SIGN_FACE`.
- E28: roads in `src/data/levels/pardonlin.level.json` (doc origin world (-1600, 100)), sites in `src/sites.ts`.
- E05: `defineInterior` (`src/interiors/`). Radio: `src/radio/content.ts STATIONS`, `adagioStation.ts`,
  `music/songs/adagio.ts`, `music/build.ts` voices, `schedule.ts DIAL`, `net.ts STATION_CODES`.
- Wiring (lead): `world.ts` calls `buildPardonlinTown`; `app.ts` creates residents, life, sound, activities, town
  speakers fallback in the radio section, imports `pardonlin/interiors`.

## Contracts this epic provides
- `DistrictPlan` data per district; `pardonlinVignettes()` for the screenshot pass; `TOWN_SPEAKERS`.
- Station id `'adagio'` (wire code 4), `ChordVoice 'harpsichord'`, `BassVoice 'cello'`, `LeadVoice 'violin' | 'oboe'`.
- Interiors `pl-cafe-pardon`, `pl-adagio-foyer`. Achievements `gta-pl-queue`, `gta-pl-baguette-round`,
  `gta-pl-portrait`, `gta-pl-flaneur`, `gta-pl-adagio`.

## Contracts consumed
E28 streets/sites/contracts, E29 kit and `setEuroZone`, E05 `defineInterior`, E06 weather (drizzle is ambient; no
code needed), `createAmbientGnomes(scene, defs)`.

## Online / mobile / achievements / prefabs / lore notes
- Online: the town is static and local; residents and pigeons are local decoration like other ambient gnomes. The only
  wire change is the appended station code. Activities are single-player (each browser runs its own).
- Mobile: activities use `addInteractSpot` (touch action button) and walking; no new keys.
- Prefabs: new `pl-*` props and four gear rewards in `packages/prefabs/src/catalog/gta-pardonlin*.ts`.
- Lore: places (Bean Tower, Grand Platz, Teacup Row, Radio Adagio, Beetle Market, the Jardin, the Little Gardens,
  Basin Quay, Café Pardon), people (the cast below), rulings for the town's rules of satire.

## Risks and decisions
- Buildings blocking streets or the river: every plan is checked by `layout.test.ts` (road edge + 1.5 m pavement,
  footpath edge + 0.5 m, river centre 12.5 m, district rects, no overlaps). Decision: plans are pure data so this is
  testable without a browser.
- Draw calls: all placements go through `buildStaticCells` (96 m cells); sign text is one atlas mesh per cell.
- Side-quest caps: the town jobs are activities, not quests (decision), so the schedule's caps do not change.
- Satire: affectionate, gnome-scale, no real nationality named (lore: Pardonlin entry, "Paris, London and Berlin mash").

## The cast (fixed, used by districts, lore and dialogue)
| id | name | district | doing |
|---|---|---|---|
| pl-mime | Marcel Muet | old-town | the Grand Platz mime, stuck in an invisible box |
| pl-painter | Odile Easelby | old-town | painting the Bean Tower (it comes out as a croissant) |
| pl-boules-a / pl-boules-b | Gaston Plonque and the other Gaston | old-town | arguing over a measured boule |
| pl-tower-guide | Fifi Haricot | old-town | Bean Tower guide with a flag, the queue behind her |
| pl-baker | Brigitte Levain | teacup-quays | the baker, the bread queue |
| pl-cafe-a / pl-cafe-b | Jean-Pot and Sabine Sip | teacup-quays | café philosophers on one espresso since Tuesday |
| pl-waiter | Hector Disdain | teacup-quays | the waiter who does not see you |
| pl-accordion | Anatole Bellows | teacup-quays | accordion on the quay |
| pl-bouquiniste | Prudence Spine | teacup-quays | riverside bookstall keeper |
| pl-maestro | Maestro Ottavio Lento | left-bank | Radio Adagio's host, outside the Opera Hall between sets |
| pl-cheesemonger | Roquette Fromage | left-bank | Beetle Market cheese stall |
| pl-poet | Sartorius Gloom | left-bank | existential poet |
| pl-laundry | Greta Clothespeg | left-bank | hanging washing in the backyards |
| pl-gardener | Aurèle Clippe | gardens | clipping the parterre with nail scissors |
| pl-marrow | Wilhelmina Marrow | gardens | measuring her marrow, rival allotments |
| pl-harbourmaster | Captain Anchois | gardens | Basin Quay harbourmaster |

## Done when (the AC, recorded in `E30/screens.md`)
Per district (4): (a) ≥3 vignettes, (b) ≥6 jokey signs/posters, (c) ≥3 residents doing place-specific things, (d)
ambient life and sound, (e) a 3-spot screenshot pass in `E30/screens/`. Plus: Radio Adagio on the dial with ≥12 pieces,
2 interiors, 3 activities + the Flâneur walk, achievements with rewards, lore passing, build/tests/smoke/zfight/perf.
