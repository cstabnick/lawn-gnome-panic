# Roadmap: Gnomes of Gnomomia, world 1 (Fescue)

Goal: grow `games/gnomes-of-gnomomia` from a five-quest intro into the full first world described in [docs/design/gnomomia/](../design/gnomomia/README.md):

- seven zones plus a three-wing dungeon, levels 1-30
- three classes with talent trees
- the combat and progression redesign
- the 8-chapter main story
- 14 side storylines
- the Battle of the Verge against the Mower

## How to run this plan

1. **Epic 1** is written by the implementing planner directly from [e1-foundation.md](gnomomia-fescue/e1-foundation.md). It's verbatim types, tables and stubs (the decompose skill's rule for foundations). It ends with `src/data/README.md` holding the canonical ids and zone layouts that every later issue reads.
2. **Epics 2-6:** for each epic, launch one `haiku-worker` per issue **in a single message**. Each prompt is the full text of [_common.md](gnomomia-fescue/_common.md) followed by the full issue file. Workers can't see this roadmap.
3. **After each epic**, run the end-of-epic check below yourself, fix small breakage directly, and re-read the next epic's issues against the code as it now stands (step 4 of the decompose skill). Content issues reference ids and helpers from earlier epics, so correct any that drifted.
4. **Branch:** work on a branch off `main`. One PR per epic keeps reviews small.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner) | New types, `content.ts` registry, packs and zones split out, stubs for every later file, canonical ids and layouts. Builds, and the intro plays unchanged. | 0 (direct) |
| 2. Systems | Combat redesign, XP levels, zones and travel, objects, classes/talents/abilities, new quest types, HUD/hotbar/panels/talents UI, dialogue actions, save v2, boss moves, Mossbottom retuned. The intro plays on the new rules, and the north road opens after Grubthorn. | 16 |
| 3. Thatchford and the Calling | Thatchford Downs zone, Chapter 2 (class choice), storylines 01-03 | 5 |
| 4. Keep, Gutters, Cloverfield | Keep and Deeps zones, Cloverfield zone, Chapters 3-4, storylines 04, 07, 08 | 8 |
| 5. Hedgewood and the Rockery | Two zones, Chapters 5-6 (Cistern and Backflow wings), storylines 05, 06, 09, 10, 11, 12, 14 | 11 |
| 6. The Verge and the Mower | Verge zone, Chapter 7, storyline 13, the finale data, the Mower battle script, the epilogue | 5 |

45 worker issues in all. There are no dependencies inside any epic. Every issue owns its files, and shared contracts are fixed in epic 1.

## File ownership (collision check)

| Epic | Issue → files |
|---|---|
| 2 | 01 `rules.ts` `combat.ts` · 02 `progression.ts` `state.ts` · 03 `world.ts` `zones.ts` `main.ts` · 04 `entities.ts` · 05 `models.ts` · 06 `objects.ts` · 07 `data/classes.ts` · 08 `talents.ts` `abilities.ts` · 09 `quests.ts` · 10 `input.ts` `player.ts` · 11 `ui/hud.ts` `ui/hotbar.ts` · 12 `ui/panels.ts` `ui/talents.ts` · 13 `ui/dialogue.ts` `ui/shop.ts` · 14 `save.ts` · 15 `bossmoves.ts` · 16 `data/packs/mossbottom.ts` |
| 3 | 01 `data/zones/thatchford.ts` · 02 `packs/ch2-thatchford.ts` · 03 `packs/s01-*` · 04 `packs/s02-*` · 05 `packs/s03-*` |
| 4 | 01 `zones/keep.ts` · 02 `zones/deeps.ts` · 03 `zones/cloverfield.ts` · 04 `packs/ch3-keep.ts` · 05 `packs/ch4-cloverfield.ts` · 06 `packs/s04-*` · 07 `packs/s07-*` · 08 `packs/s08-*` |
| 5 | 01 `zones/hedgewood.ts` · 02 `zones/rockery.ts` · 03 `packs/ch5-hedgewood.ts` · 04 `packs/ch6-rockery.ts` · 05 `s05` · 06 `s06` · 07 `s09` · 08 `s10` · 09 `s11` · 10 `s12` · 11 `s14` |
| 6 | 01 `zones/verge.ts` · 02 `packs/ch7-verge.ts` · 03 `packs/s13-*` · 04 `packs/ch8-finale.ts` · 05 `mower.ts` `ui/epilogue.ts` |

Each worker's check is `npx tsc --noEmit -p games/gnomes-of-gnomomia`, read only for its own files. No worker starts a server or runs `vite build`.

## End-of-epic checks (the planner runs these)

Every epic:
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm run dev -w games/gnomes-of-gnomomia`, then `bash tools/smoke.sh http://localhost:5291 game ui`: no console errors. Loading `content.ts` throws on a duplicate id, so the smoke test catches id collisions between packs.

Plus a short playtest per epic, using a debug save if needed (set `state.level`, `state.flags` and quest states in devtools):

| Epic | Playtest |
|---|---|
| 2 | New game: Fernwick → slugs (hitsplats single digits, 3-4 hits) → Grubthorn (moves telegraph, last words) → the north exit appears. An old v1 save loads and migrates. |
| 3 | Walk to Thatchford. Pick each class through its trial (three saves). Spend talent points. Hotbar abilities work. Rotgut. The letter. The Keep exit appears. |
| 4 | Keep court → Archive → Gutters (Clogmaw) → Ledger → Cloverfield. Both ant choices. Gleaner fed and killed. Great Haul escort. The Queen's day out. |
| 5 | Hedgewood both Heartwood outcomes. Cistern. Rockery: Mudtooth truth and lie, the Kiln Warden kneels, the trowel reforge, the Backflow, Gromwell. The storylines' flags show up in later dialogue. |
| 6 | Muster supply lines. No Hats. The Level. The Mower in three phases with the minimum allies and with all allies. Epilogue cards match the flags. |

## Notes for the implementer

- **Balance lives in two places:** `rules.ts` formulas (combat.md §4-9) and pack overrides. Tune formulas first. Use overrides only for set pieces.
- **Lore checks:** any line a worker invents should pass the 6-question checklist in `docs/design/gnomomia/lore-rules.md`. Spot-check each content epic's dialogue for loose threads that got answered (the player's origin, who lit the Kiln, the Tall Ones).
- **Party slice:** `packages/party/README.md` has the backlog row `gnomomia-skirmish` (a 45 s click-to-move arena) marked **later**, so this plan adds no slice. After epic 2, combat is pure functions in `rules.ts` plus `combat.ts`. That makes the skirmish slice a small issue whenever someone picks it up.
