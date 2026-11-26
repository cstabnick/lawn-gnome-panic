# E32 roadmap: Hedgeworth Links to nine holes

Brief: [../E32-golf-nine-holes.md](../E32-golf-nine-holes.md). Shared issue context: [issues/_env.md](issues/_env.md)
(environment + foundation facts) and [issues/_canon.md](issues/_canon.md) (names and story for every writer).

| Epic | What | Done when | Issues |
|---|---|---|---|
| A | Foundation (lead): site grown south, nine holes' data, play order, save field, stubs, prefab catalog files, `?golf=1..9` | `tsc --noEmit` clean | written by the lead |
| B | Build in parallel: save, app, HUD, course physics + greens, yard structures, Bottom Garden dressing, life + mole, achievements, runtime, quest, lore | game build + golf tests | 11 |
| C | Proof and polish: scripted nine-hole playthrough test, screenshot pass of every tee, polish rounds, full checks | all checks in the brief | 1 + lead |

## Epic A (lead, done in code)

- `west-estates.level.json` slot `golf-yard`: z 620 → 692, hd 210 → 282 (z 410..974), anchors kept in world space.
- `golf/types.ts`: YARD, BOTTOM_GARDEN, OLD_FENCE, TURN_GATE, POTTING_SHED, holes 4..8 (+ `teeY`), HOLE_ORDER,
  holeIndexOfNumber, nextHoleIndex, MAZE_HEDGES/MAZE_H, CART_PATHS, GOLF_ACH/PROBES/QUESTS, `GolfSave.bestNine`.
- `golf/round.ts`: nextHole and cardView in card order. `app.ts`: `?golf=N` by card number.
- `golf/bottomGarden.ts` stub wired in `runtime.ts`; four empty prefab catalog files registered in the catalog index.

## Epic B issues (all parallel; one owner per file)

| Issue | Worker | Owns |
|---|---|---|
| [B1 save](issues/B1-save.md) | haiku | golf/save.ts, save.test.ts |
| [B2 app](issues/B2-app.md) | haiku | golf/golfApp.ts, golfApp.test.ts |
| [B3 HUD](issues/B3-hud.md) | haiku | golf/hud.ts, hud.test.ts |
| [B4 course](issues/B4-course.md) | sonnet | golf/course.ts, course.test.ts, greens.ts, greens.test.ts |
| [B5 yard](issues/B5-yard.md) | sonnet | golf/yard.ts, yard.test.ts, places.test.ts, prefabs gta-golf-nine-garden.ts |
| [B6 Bottom Garden](issues/B6-bottom-garden.md) | sonnet | golf/bottomGarden.ts (+test), prefabs gta-golf-nine-props.ts |
| [B7 life](issues/B7-life.md) | sonnet | golf/life.ts, life.test.ts, prefabs gta-golf-nine-critters.ts |
| [B8 achievements](issues/B8-achievements.md) | haiku | achievements catalog.ts, prefabs gta-golf-nine-gear.ts |
| [B9 runtime](issues/B9-runtime.md) | haiku | golf/runtime.ts, runtime.test.ts |
| [B10 quest](issues/B10-quest.md) | sonnet | quests/golfQuests.ts, quests/stages/golf.ts, city/probes.ts, id lists |
| [B11 lore](issues/B11-lore.md) | sonnet | docs/lore/ (Hedgeworth entries, R-218) |

No dependency inside B: shared names are fixed in types.ts by Epic A; the shed rooftop (B6) and `putPlayer` on
`groundAt` (B9) meet through `addRooftop`; the maze walls are drawn by B5 and stop the ball in B4 from the same
`MAZE_HEDGES` table.

## Epic C

- C1 (sonnet): `golf/nine.test.ts`, a scripted bot plays a full nine through the pure round API and holes every hole
  within par + 3 (total within par + 12). See [issues/C1-playthrough.md](issues/C1-playthrough.md).
- Lead: screenshot pass of every tee under [screens/](screens/) ([screens.md](screens.md)), polish rounds, smoke, zfight,
  all checks.
