# Gnome Theft Auto

Goal: an open-town gnome crime sandbox (three.js). Third-person floating chase camera behind the player's own gnome;
five mower models to steal and drive; water guns whose soaked targets put their hands up and run; the Hat Watch
(heat) and Fort Sandpit, a military base holding the Whirligig flying mower. Lore: apocrypha (parody), R-015.

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | scaffold, `types.ts`, `config.ts`, `collide.ts`, `gnomes.ts`, `main.ts`, stubs, lore; `tsc` passes | written directly |
| 1 Modules | `npm run build -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, smoke check | 12 parallel (one file each) |
| 2 Online + polish | `@lawn/mp` free roam (players see each other, squirt each other), achievements, demo | planner + 1 |

Epic 1 issues (full text in `docs/roadmaps/gnome-theft-auto/`, each pastes `_env.md`):
1A world · 1B input · 1C camera · 1D player · 1E vehicles · 1F traffic · 1G npcs · 1H police · 1I weapons+fx ·
1J hud · 1K audio · 1L prefabs. No dependencies inside the epic: every module is a stub with its final signature,
and new prefab ids are fixed in the issues.

Party slice: later (backlog row in `packages/party/README.md`).
