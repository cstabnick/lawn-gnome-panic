# Gnome Theft Auto: guns, a big varied world, planes and parachutes

Goal: real guns that hit what is under the crosshair; much bigger buildings; a 1200 x 1200 world with a grid city centre
and four organic biomes (desert with Fort Sandpit and an airfield, forest, tundra, farmland); a flyable plane; bailing out
with an automatic parachute. Lore: R-016.

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | contracts in `types.ts`, `config.ts`, spatial-grid `collide.ts`, stubs; `tsc` passes | written directly |
| 1 Modules | `tsc`, `npm test -w packages/prefabs` | 13 parallel (1A, 1B1, 1B2, 1C-1L), one file each |
| 2 Wiring | `npm run build`, smoke check | 1 (2A, `main.ts`) |

Issue files: `docs/roadmaps/gnome-theft-auto-expansion/`. Online: planes and parachutes are synced (`net.ts`, `remotes.ts`).
Party slice: still later (see `packages/party/README.md`).
