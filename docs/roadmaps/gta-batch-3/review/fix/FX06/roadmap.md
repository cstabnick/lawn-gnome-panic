# FX06 roadmap: ground paint, route clearance, residents on decks, speech bubbles

Brief: `../FX06-ground-placement-residents.md`. Findings G2#20, G3#1, G3#2, G3#3, G4#16, G5#1, G5#2, G5#3, G6#3, G6#11 (D58).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 0 Foundation (lead) | `AmbientGnomeDef.y` / `surface: 'rooftop'` + `ambientFeetY()` in ambientGnomes.ts; `placeSolid` keeps off every ground track (G4#16) + scenery test + golden regenerated | build, scenery + golden tests | 0 (lead) |
| 1 Fixes | five parallel issues, one file set each | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, re-shots | 5 |

No dependencies inside epic 1: each issue owns its files (table below). All issues are taste work (tuning by screenshot), so they run on Sonnet general-purpose agents, not Haiku.

| Issue | Findings | Owns | Dev port |
|---|---|---|---|
| A bubbles | G2#20, G6#3 | `src/ambientGnomes.ts` (bubble part only), new `src/bubbleClamp.ts` + `src/bubbleClamp.test.ts` | 5516 |
| B paint rule + feathered edges | G5#1 (paint), G5#2 (paint), G5#3, D58 rock rule | `src/terrainPaint.ts`, new `src/terrainPaint.test.ts`, `src/wasm/gtaWasm.test.ts`, `src/landforms.test.ts`, `src/campus/mound.test.ts` | 5517 |
| C mound blend + Rutbottom batter | G5#1 (shape), G5#2 (shape) | `src/data/levels/east-campus.level.json` (flatten stamp only), `src/campus/types.ts` (OBSERVATORY comment), `src/raceTrack/defs/rutbottom.ts`, tests next to them | 5518 |
| D Unmown trail ribbon | G6#11 | `src/unmown/trails.ts`, `src/unmown/trails.test.ts` | 5519 |
| E coast decks + one look per character | G3#1, G3#2, G3#3 | `src/coast/boardwalk.ts`, `src/coast/life.ts`, `src/coast/config.ts` (deckLift only), `src/cutscene/cast.ts`, `src/quests/coastQuests.ts`, `src/coast/pirateShip.ts`, tests next to them, `docs/lore/` (ruling + reel-ruth entry) | 5520 |

Issue texts are in `issues/A.md` .. `issues/E.md`.
