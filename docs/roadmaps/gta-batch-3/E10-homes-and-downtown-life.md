# E10 Homes and downtown life
Wave: 4 · Depends on: E01 (site registry: character-home slots, downtown restructure), E04 (character bible: who lives where), E05 (interior system), E08 (property purchase with debt) · Kind: Content
Source items:
- L21 introduce the player's own home. make it one of hte earlier quests and have it be loaned to them increasing their debt
- L22 allow player to customize it. for now just make an apartment in the downtown available but we will have future options like for those out in the field
- L58 introduce buildings or apartments or stuff wher ethe main characters and side characteres live and work. Right now we have just work in most cses ,but no homes. I'd like to have it be that we can recognize special aplces where people live and groudn us in the world. all characters should have a home. some may never be acknolwedged. some quests should be rew-written or extended to have us pick up or drop people off at homes, places of work, etc.
  (E10 builds the homes and workplaces; E04 wrote who lives where; E20 rewrites the pickup/drop-off quests.)

## Goal
The player gets a loaned downtown apartment early in the story (it raises Kiln-Debt), can walk into it and furnish it, and
every named character has a home that exists in the world as a recognisable place (some only a door, some a full
interior), so the world feels lived in and quests can use homes as stops.

## Scope
In:
- **Player home quest**: a short early quest that offers the apartment and books the loan through E08's property API; a
  furnished-by-default one-room apartment (E05 interior), a bed to save/sleep (advance time if E06 allows), a door on the downtown block.
- **Apartment customization**: placing and moving furniture from `@lawn/prefabs` (catalog `furniture.ts`: bed, table, chair,
  armchair, rug, lamp, bookshelf, plant, painting, wardrobe, ...) within slots, wall/floor colour, saved per player;
  furniture bought with Acorns (E08 catalogue). Data model leaves room for other home types later (field cabin), not built.
- **Homes and workplaces for every character** in the E04 bible: a registry (`homes.ts`) mapping character id -> home
  site, door position, visibility ("acknowledged" or hidden), mailbox/door-plate and a lit window at night; built as small
  facade-and-door buildings (interior only where E04 marks a home as story-relevant, using E05).
- Pickup/drop-off support: each home registers a `Place` so quest objectives and the jobs/taxi system can target it (`PLACES`), and
  a "home" pose/route for the character's ambient routine.
- Map: homes as a map POI category (hidden until acknowledged).
Out: rewriting the quests that use homes (E20/E21); the interior engine (E05); property purchase (E08); farm and field homes (E16); new districts (E01).

## Code pointers (confirmed)
All under `games/gnome-theft-auto/src/`.
- Cast and "home" today: `quests/stages.ts` `CAST: readonly CastMember[]` (l.30; `CastMember { id, name, preset?, home: stage id, haunts, routine, vehicle }`), `STAGES` (l.247), `stageById`, `castById`, `stagesFor`; stage shape in `quests/stages/kit.ts` (`Stage`: `center`, `radius`, `facing`, `built: existing|dressed|new`, `room`, `givers`, `set: SetProp[]`, `marks`). Region stage files: `quests/stages/turfton.ts`, `turftonB.ts`, `turftonC.ts`, `cloverfield.ts`, `wilds.ts`, `east.ts`, `speedway.ts`, `pebblewick.ts`. Stage-set colliders: `stageSetBoxes()`.
- City cast: `city/cityCast.ts` `CITY_CAST: CityCastMember[]` (`key`, `home` = stage id, `district`, `givers`, `clientOf`, `lore`), `clientOf(questId)`. Voices: `voice/voices.ts` `VOICES`, `voiceFor`. Cutscene looks: `cutscene/cast.ts` `CAST` presets (~29 named speakers), `castOf`.
- Existing off-map story rooms: `cutscene/rooms.ts` (`ROOM_ORIGIN` (3000, 0, 3000), `ROOM_THEMES`, `CutsceneRoom`). Not walkable; E05's interior system replaces the need to teleport there. Do not edit it; consume E05.
- Ambient residents: `ambientGnomes.ts` `AMBIENT_GNOMES`, `vibeNpcs.ts` `createVibeNpcs`, `npcs.ts`. Settlements: `settlements.ts` `planSettlements` / `buildSettlements` (outer-region houses, uses `REGION_THEMES`); do not add named homes there, add them via E01's site slots.
- Downtown: `districts.ts` (`DistrictId`, `districtAt`, `buildDistrictDressing`), `towers/` (`index.ts` `buildTowers`, `LANDMARKS`; `landmarkPlaces()` ~l.100), `config.ts` `PLACES` (~l.572, `Place { id, name, reason, x, z, weight }`) used by taxi and jobs.
- Quests: `quests/defs.ts` `GIVERS` / `QUESTS`, `quests/chapter1.ts` (`prologue-fresh-kiln`, `first-contract`, ... : the home quest slots in as a new early entry; keep ids stable), `quests/unlocks.ts` `SIDE_UNLOCKS`, `quests/types.ts` `QuestDef`, `quests/objectivesCity.ts` (`probe` objectives; probes registered in `city/probes.ts`).
- Prefabs: `packages/prefabs/src/catalog/furniture.ts` (33 defs, uses `place`/`sit`), `gta-houses.ts`, `gta-towers.ts`, `gta-street-kit.ts`; resolve via `resolvePrefab`/`buildPrefab`.
- Saves: `saveIO.ts` `GTA_SAVE_KEYS`, `cloudSave.ts` `MERGES`, `saveIO.test.ts` for a `gta-home-v1` key (apartment owned, furniture layout, wall/floor colours).

## Contracts this epic provides
- `homes.ts`: `HOMES: HomeDef[]` (`{ characterId, site, door: [x,z,yaw], kind: 'facade' | 'interior', acknowledged: boolean, interiorId? }`), `homeOf(characterId)`, `registerHome(def)`; each home also registers a `Place` for quest and taxi targeting.
- `playerHome`: `ownsHome()`, `enterHome()`, `furnish(layout)`, `FURNITURE_SHOP` stock list; event `onHomeChange`.
- Probes `home-owned`, `home-furnished` for quests (E20).

## Contracts this epic consumes
- E01: site-registry entries for the character-home slots and the downtown apartment block (rects, doors); the restructured downtown (3 blocks to a park, 2x1 mega block). Until it lands the lead reads `docs/roadmaps/gta-batch-3/E01-*.md`; if the registry is missing, stop and report rather than inventing coordinates.
- E04: character bible table with home and workplace per character and which are acknowledged, plus lore entries for the homes.
- E05: `enterInterior(id)` / interior definition format and a furniture-slot mechanism if it has one (else this epic adds a thin `FurnitureLayer` on top of E05's room, not its own interior engine).
- E08: `registerProperty`, `buyProperty` (loan on the home), `ITEMS`/catalogue for furniture purchase.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): homes are private per player; other players do not enter your apartment (door shows "locked"). Character homes are shared static world, built from site data, identical for all clients. No new net messages; layout is local save.
- Mobile: furniture placement uses tap-select, drag or arrow nudge buttons, rotate button, 44 px targets; no keyboard-only rotate.
- Achievements: "Home Sweet Loan" (take the apartment), "Interior Decorator" (place N pieces), "House Call" (visit N character homes); cosmetic rewards from `gta-houses` style gear (head/back/neck/hand). `npm test -w packages/achievements`.
- Prefabs: use furniture prefabs; add missing ones (kitchenette, window, door-plate, mailbox) to `furniture.ts` or `gta-houses.ts`; `npm test -w packages/prefabs`. No hand-built meshes.
- Lore: `npm run lore -- find <name>` for every character before a home gets a name or door-plate; one lore entry per notable home, and a ruling for the Kiln-Debt loan terms. Respect "some may never be acknowledged": hidden homes exist in data but have no marker.

## Risks and open questions (decisions taken)
- Dependency on E05's API shape and E01's registry: the lead must read both before decompose. Decision: if E05 has no per-room furniture slots, build a `FurnitureLayer` (grid snap, 12 slots per room) here.
- Home count: every character gets a data row; only "acknowledged" ones are built as visible places, hidden ones get a door-plate prop at most. Cap built homes at ~25, others share a facade type (E04 decides which).
- Story quest ordering: the home quest is added right after `prologue-fresh-kiln`; E20 owns quest numbering, so this epic adds it as a side-style unlocked entry plus `SIDE_UNLOCKS` row and tells E20 in the report.
- Loan terms: apartment costs 1200 Acorns equivalent added to Kiln-Debt, with no monthly interest (decision; keeps debt UI unchanged).
- Interiors render and collide inside the main scene; performance risk with many interiors. Decision: build an interior only on entry, dispose on exit (E05 contract).

## Done when
- `npm run build -w games/gnome-theft-auto`
- `npm test -w games/gnome-theft-auto` (new `homes.test.ts`: every `CAST`/`CITY_CAST` id has a home row, every home site is inside E01's registry and clear of colliders; `saveIO.test.ts` updated)
- `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...` clean; `npm run zfight -- <url>` shows no flicker at the apartment block and character homes; phone viewport 390x844: take the apartment, enter, place three pieces, leave, reload and see the layout restored.
