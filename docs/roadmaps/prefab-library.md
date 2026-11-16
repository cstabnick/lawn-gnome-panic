# Prefab library (`packages/prefabs`)

Goal: a shared library of small 3D prefabs (items, gear, food, documents, furniture, props) drawn from primitives, with UI icons, world drops, emoji lookup and plenty of examine text. Gnomes of Gnomomia first: every item emoji it uses gets a model, and house furniture becomes prefabs.

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (done by the planner) | `npm test -w packages/prefabs` and `npm run build -w games/prefab-gallery` pass | 0 (written directly) |
| 2. Catalog (done) | Every catalog file filled; tests pass; contact sheet (`/?sheet` on the gallery) reviewed | 7, parallel, one file each |
| 3. Gnomomia adoption (done) | Inventory, shop and equipment show prefab icons; interiors build furniture from prefabs; furniture is examinable | done by the planner |

Epic 2 issues: `docs/roadmaps/prefab-library/2A-weapons.md` … `2G-furniture.md`. Each pastes the rules in `docs/roadmaps/prefab-library/_common.md`.
