# E19 contracts: Drainpipe Court and the Gutter Bowls

What E19 gives later epics (E18 activities, E20 story quests #9 `m09-where-asphalt-sleeps` and #14
`m14-drainpipe-court`, E21, E22 lore). Code under `games/gnome-theft-auto/src/court/`, `src/skate/`, `src/sports/`,
`packages/jam/`, `packages/trickboard/`. World: +x east, +z south; yaw 0 faces +z.

## Shared packages

- `@lawn/jam` (packages/jam): GBA GJAM's headless basketball. `new JamSimulation(config, callbacks)`,
  `step(dt, p1In, p2In)`, `score`, `phase`, `players`, `ball`; court constants `COURT_HALF_X/Z`, `HOOP_X/Y`,
  `THREE_PT_RADIUS`; `setBotFactory` (GJAM registers its script/remote bots; other games get the classic and pure
  preset bots). README in the package. GJAM re-exports it; `sim.golden.test.ts` guards behaviour.
- `@lawn/trickboard` (packages/trickboard): Aether Board's trick layer, no three.js: `BOARD_TRICKS`, `GRABS`,
  `GRINDS`, `AIR_GESTURES`, `GROUND_GESTURES`, `zoneOf`, `grabFor`, `grindFor`, `PhysEvent`, `ComboView`,
  `createRecognizer`, `createCombo` (feed it your own `PhysEvent`s with a `{ t, mode }` player). Aether Board
  re-exports it; `tricks.golden.test.ts` guards behaviour.

## Places

| What | Where | Notes |
|---|---|---|
| Drainpipe Court | `COURT` in court/types.ts: centre (-90, 30), court 18.4 x 9.9 m, rims 2.44 m at x -98.08 / -81.92 | E01 site `basketball-court`; GJAM court x 0.8 (R-210) |
| Chalk scoreboard | `SCOREBOARD` (-90, 37.5) | E: pickup game (to 11) |
| Ball cage | `BALL_CAGE` (-77.5, 22) | E: shootaround |
| Swish's spot | `COURT_PEOPLE.cardoon.spot` (-84.5, 30) | E after one win: Swish and Lintel to 7 |
| The Gutter Bowls | `SKATE_ORIGIN` (-30, 90), `SKATE_SITE` x -50..-10, z 70..110 | E01 site `skate-park`; pieces `SKATE_PIECES`, rails `SKATE_RAILS` |
| The Board Library | `BOARD_LIBRARY` (-36, 71.5) | E: take a board (kept) or borrow one |
| Fennel's deck | piece `fennel-deck` (u -17.75, v 12), top 2 m | hammock under it |

Ground for anything that rides the park: `skateGround()` / `parkHeight(x, z)` in skate/park.ts.

## Hooks for story quests

```ts
import { courtApi } from '../court/runtime';
courtApi()?.startGame({ target: 7, opponents: 'swish' })   // null = started, else why not (must be within 60 m)
courtApi()?.onGame((r: { won, score, target, opponents }) => ...)   // m14: win back Pip's toolbox
courtApi()?.startShootaround(); courtApi()?.inGame(); courtApi()?.quitGame()

import { skateApi } from '../skate/runtime';
skateApi()?.startLine('asphalt-line')   // m09 "skate one line to get the cap back": puts the player on a board at it
skateApi()?.onLine((r: { id, ok, time }) => ...); skateApi()?.giveBoard(); skateApi()?.dropBoard()
```

- Objective kinds `jam-game` / `skate-line` (E04 names) = `probe` objectives on the `gta-sports-v1` save
  (city/probes.ts): `jam-games`, `jam-wins`, `jam-threes`, `jam-dunks`, `jam-swish-beaten`, `jam-shoot-makes`,
  `skate-board-owned`, `skate-ollies`, `skate-best-combo` (absolute), `skate-lines`, `skate-full-rails`, and
  `skate-line-<id>` (0/1) for `first-push`, `bowl-line`, `long-gutter-line`, `asphalt-line`. The quest sim solves them
  through the store (`questSim/solvers/probe.ts`).
- Side quests `sq-court-regulars` (Cardoon) and `sq-gutter-bowls-sessions` (Fennel) (`quests/sportsQuests.ts`),
  temporarily after `ch1-founders-boot`; E20 moves them to after #14 / #15.

## Save, achievements, app, map, items

- `gta-sports-v1` (`sports/save.ts`, `sportsStore()` is the one shared store; in `GTA_SAVE_KEYS`, cloud MERGES with
  `mergeSportsSave`).
- Achievements: `gta-drainpipe-dunk` (head: drainpipe-sweatband), `gta-drainpipe-three` (hand: spare-basketball),
  `gta-drainpipe-win` (neck: swish-net-scarf), `gta-first-ollie` (head: gutter-skate-helmet), `gta-five-trick-combo`
  (back: gutter-deck-sling), `gta-full-rail` (neck: skate-tool-lanyard).
- Gnomlet app `founders-green`. Map place kinds `court` and `skate`. Inventory item `skateboard` (Use: drop and ride).
- Vehicle kind `skateboard` (prefab `gta-skateboard`), relayed online like any vehicle, untracked by parkSync.
- Cast keys `cardoon`, `lintel`, `pansy`, `benchley` (Old Burdock Benchley: `burdock` was taken by the Speedway's
  Big Flag), `fennel`, `moss`, `pebble` with voices and intro cards.
- Sounds: `jam-bounce`, `jam-swish`, `jam-clang`, `jam-dunk`, `jam-whistle`, `jam-cheer`, `jam-drainpipe`,
  `skate-roll`, `skate-pop`, `skate-land`, `skate-grind`, `skate-bail`, `skate-push`.
- Dev: `?court=game|swish|shoot`, `?skate=board|<line id>`.

## Lore

R-210 (the court's scale and rules), R-211 (the skateboard, the Board Library), R-212 (tricks are the same as in the
Aether); entries `lintel-crossover`, `pansy-rebound`, `burdock-benchley`, `moss-squeegee`, `pebble-nollie`,
`the-board-library`, `lather-and-lint`; Drainpipe Court, the Gutter Bowls, Cardoon and Fennel updated as built.
