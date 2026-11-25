# E07 roadmap: map, options, mobile UI, loading and the Gnomlet

Brief: [../E07-map-options-mobile-ui-loading.md](../E07-map-options-mobile-ui-loading.md). Contracts for later epics:
[contracts.md](contracts.md).

## Shape

| Step | What | Done when | Issues |
|---|---|---|---|
| 0 (lead) | Fix the dead More menu (L94 bug), then the foundation: Options registry, Gnomlet shell + app registry, phone shim, save keys, stubs | build + focused tests; Options tappable at 390x844 and 844x390 | written by the lead (commits `c6fb17ad`, `ca7732e0`) |
| 1 | Everything else, in parallel | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, smoke desktop + phone | 7 issues below |

Step 1 issues (each owns its files; no file is under two issues):

| Issue | Items | Worker | Owns |
|---|---|---|---|
| [01-big-map.md](01-big-map.md) | L26, L27 | Sonnet | `src/hud.ts`, new `src/bigMapView.ts` (+test), new `src/mapViewPrefs.ts`, `src/mapIcons.ts` |
| [02-bird-toggles.md](02-bird-toggles.md) | L34, L65 | Haiku | new `src/birdPrefs.ts` (+test), `src/birding/birding.ts`, `src/sound/ambience.ts` |
| [03-marker-height.md](03-marker-height.md) | L48 | Haiku | new `src/questMarkerPrefs.ts` (+test), `src/quests/quests.ts`, `src/quests/objectivesAction.ts`, `src/quests/objectivesCity.ts`, `src/quests/objectivesTessie.ts` |
| [04-position-save.md](04-position-save.md) | L70 | Haiku | new `src/positionSave.ts` (+test), `src/app.ts` |
| [05-loading-screen.md](05-loading-screen.md) | L87 | Sonnet | `index.html`, `src/main.ts`, `src/loading/*` |
| [06-comms-mobile.md](06-comms-mobile.md) | L89 | Haiku | `src/briefing/briefing.ts` |
| [07-gnomey-bird.md](07-gnomey-bird.md) | L94 (toy) | Sonnet | `src/gnomlet/apps/*`, `packages/achievements/src/catalog.ts`, `packages/prefabs/src/catalog/cosmetics-head-b.ts` |

The lead does the end checks (build, full tests, smoke at 1280x800, 390x844, 844x390), the E23 evade-meter check at
390x844 and `AGENT_INDEX.md`.

Online: none of this is online (options, map view, tablet and Gnomey Bird are local; position restore is skipped when
joining a room). Mobile: every issue checks 390x844 and 844x390.
