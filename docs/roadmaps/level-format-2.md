# Level format, stage 2: the other games, the engine gaps, a multi-game editor

Stacked on `docs/roadmaps/level-format.md` (PR #235). That stage built `@lawn/level`, Gnomomia's terrain layers, the baked walk
grid and a Gnomomia-only editor. This stage finishes the plan: the other games adopt the format, the engine items that were
left are built, and the editor stops being Gnomomia-only.

## Decisions

- **Parity first.** Before any game is touched, a golden fixture is captured from its original code (`arena.golden.json`,
  `course.golden.json`, `maps.golden.json`; Gnomomia has `terrain.golden.json`). A migration is done when the fixture still passes,
  unedited.
- **Data moves, code stays.** Gnome Front's and Gnome Golf's ground formulas stay in code (they multiply and blend in ways the generic
  stamp does not express); the numbers they use (mounds, flatten radii, holes, island) move into the document, and so do the cover
  rules and the landmarks. Club Gnome's maps are pure data and move whole.
- **Off by default where it changes play.** The pathfinding cost layer exists and is tested but `TUNING.roadPathBias` is `1` (no change).
- **Not built here** (see the end): zone create/resize, multi-select, walls editing, road graph for long routes, editor profiles for
  Gnome Front and Gnome Golf.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner, committed) | golden fixtures for the three games; `PaintGrid`; `PrefabDef.footprint`; authored roads + paint in `terrainCore.ts` | none |
| 2. Game side (parallel) | each game's golden test and the named tests pass; builds pass | C1 F1 G1 P1 F2 PG |
| 3. Editor (planner, then parallel) | the editor runs Gnomomia and Club Gnome from one codebase; Paint tool; roads-mode UI; e2e passes | adapter refactor (planner), then the issues listed under it |
| 4. Wire-up (planner) | full checks, e2e, docs, PR on top of #235 | none |

## Issues

| Id | Owns | What |
|---|---|---|
| C1 | `games/club-gnome` maps, `levelDocs.ts` | Club Gnome maps become level documents |
| F1 | `games/gnome-front` arena | Gnome Front's arena becomes a level document |
| G1 | `games/gnome-golf` course | Gnome Golf's island and holes become a level document |
| P1 | `pathfind.ts`, `player.ts`, `TUNING` | a road cost layer for click-to-move, off by default |
| F2 | `packages/prefabs` catalog | prefab footprints (default solid radius and height) |
| PG | `worldPaint.ts`, bake hash and scripts | load surface paint; the bake knows about it |

## Status

Built: everything in the shape table. The three games' parity fixtures pass unmodified; Gnomomia has authored-roads mode (with a
one-click conversion in the Road tool), surface paint (loader, bake fingerprint, Paint tool, Save), prefab footprints (the editor
defaults a prop's solid radius from them), and a road cost layer in click-to-move that is off by default. The editor is
multi-game through `GameAdapter`: Gnomomia, Club Gnome, Gnome Front (arena, flags, bases, mounds, vehicles, landmarks and the cover
rules) and Gnome Golf (tees, greens, pins, fairway corners, bunkers, ponds, par, the island). Both games' ground and object builders were
turned into factories so the editor runs the game's own code on live data; the golden fixtures still pass.

Not built:
- Terrain brushing in Gnome Front and Gnome Golf (their ground is mounds plus formulas, with no height raster; mounds, greens and
  the island numbers are the terrain controls).
- A road graph for long click-to-move routes; `TUNING.roadPathBias` is `1` until someone has playtested a value below it.
- Zone create/resize, multi-select and copy/paste across zones, wall editing, house interiors and NPC/enemy placement (those live in
  the content packs, not the level files).
- Generator registry and `scatter` layer in `@lawn/level` (Gnome Front's cover rules are data now, run by its own generator).
