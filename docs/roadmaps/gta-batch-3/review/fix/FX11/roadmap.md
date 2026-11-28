# FX11 roadmap: the coast (Saltbucket Shore, boardwalk, pier, wheel, Queen, beach)

Brief: `../FX11-the-coast.md`. Findings G3#4-9, 12-24, 26, 29-32 (24). Decisions D14 (bucket, dunes, sand, narrowed
promenade) and D58 (signs print both faces). Issue texts: `issues/` (environment shared by all: `issues/_env.md`).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 0 Foundation (lead) | `coast/deckKit.ts` (helpers split out of boardwalk.ts), `coast/pier.ts`, `coast/stalls.ts` (stall loop moved), stubs `dunes.ts`, `promenade.ts`, `beachScenes.ts`, `ambience.ts`, real `nightLights.ts` (night glow materials, light pools, eased night from the time label), `COAST.boardwalk.rect` narrowed to z 1102..1132 (D14), `COAST.bucket/spade/dunes/spokewheel.bell`, `COAST_UNLOCK_AFTER` deleted (G3#32), three new prefab catalog files registered | tsc, coast tests | 0 |
| A Fixes and kit | 15 parallel issues, one file set each | build, tests, re-shots | 15 |
| B Placement | dunes + bucket, stalls, promenade, residents and vignettes, beach scenes + Saltcut + X, lore | build, tests, re-shots | 6 |

Epic B places the prefabs epic A makes, so it waits for A (each B worker can then see the props it places).

### Epic A (parallel; no file under two issues)

| Issue | Findings | Owns | Agent | Port |
|---|---|---|---|---|
| A1 town prefabs | G3#5, #7, #17, #21 kit | `packages/prefabs/src/catalog/gta-coast-town.ts` | Sonnet | - |
| A2 fair prefabs | G3#6 kit | `.../gta-coast-fair.ts` | Sonnet | - |
| A3 beach prefabs | G3#13, #19, #26, #29, #30 kit | `.../gta-coast-beach.ts` | Sonnet | - |
| A4 Queen prefab | G3#9 | `.../gta-coast.ts` (`bathtub-queen`) | Sonnet | 5524 |
| A5 coast signs | D58, G3#19 | `coast/sign.ts` (+test) | Haiku | 5525 |
| A6 terrain | G3#5 (sand, dunes), G3#26 (bend) | `landforms/southShore.ts`, `assembly/kernel.ts`, `wasm/kernelBytes.ts`, `data/levels/south-shore.level.json`, goldens if needed | Sonnet | 5526 |
| A7 quests | G3#14 text, #15, #16, #31 | `quests/coastQuests.ts`, `quests/stages/coast.ts` | Haiku | - |
| A8 Spokewheel | G3#17, #12, #15, #23 | `coast/spokewheel.ts` (+test) | Sonnet | 5528 |
| A9 Queen runtime | G3#9, #12, #14, #24 cabin | `coast/pirateShip.ts` (+test), `config.ts` `ship.treasureLocal` | Sonnet | 5529 |
| A10 Last Tube | G3#19 | `tubing/view.ts` `buildLastTube` | Sonnet | 5530 |
| A11 ski pose | G3#18 | `config.ts` (`tow-ski` stand), `tubing/skiPose.ts`, `tubing/runtime.ts` | Haiku | 5531 |
| A12 sea traffic | G3#30 | `boatTraffic.ts` (+test) | Haiku | 5532 |
| A13 pier | G3#8, #4 board, #12, #23 | `coast/pier.ts` (+test) | Sonnet | 5533 |
| A14 ambience | G3#24 | `coast/ambience.ts` (+test), `coast/life.ts` (sound timers only) | Sonnet | 5534 |
| A15 boardwalk | G3#6 boards, #12 pools, #29, #23 tide, FX06 west end | `coast/boardwalk.ts`, `coast/deckKit.ts`, `coast/config.ts` `boardwalk.rect.minX` | Sonnet | 5535 |

### Epic B (after A)

| Issue | Findings | Owns |
|---|---|---|
| B1 dunes + bucket | G3#5 (a, b) | `coast/dunes.ts` |
| B2 stalls | G3#7, #22 sign | `coast/stalls.ts` |
| B3 promenade | G3#6 (D14 dressing), #12 bunting | `coast/promenade.ts` |
| B4 residents + vignettes | G3#4, #20, #21, #22 | `coast/life.ts` |
| B5 beach scenes | G3#13, #14 X, #26 dressing | `coast/beachScenes.ts` |
| B6 lore | rulings + entries | `docs/lore/` |

Keeper names decided by the lead (B2, B6, A7): Plank & Pickle **Gil Brinewater**, Tin Shy **Tam Tinsley** (sulks),
Scoop & Spade **Dot Scoopwell**, The Lucky Limpet **Madame Limpet**, Marram's Office **Penny Stubbs** (counts the change).

Online: the coast is already shared (the wheel turns on `waveTime()`); nothing new needs syncing (the smack's pose is a
pure function of time). Mobile: no new controls; phone-size shots per issue.
