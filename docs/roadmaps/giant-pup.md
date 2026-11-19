# Giant Pup roadmap

Goal: a pet-care game (pet, feed, water, bath, fetch, tricks) starring Gnome Company's Giant Goofy Fetch Dog, playable on a phone.

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | scaffold, `config.ts`, `sim.ts`, `save.ts`, `brain.ts`, `main.ts`, stubs for the rest; `npm run build -w games/giant-pup` passes | written directly |
| 2 Fill the modules | dog rig, yard + fx, HUD, audio; build passes, smoke check at phone and desktop sizes | 4 in parallel |

Online: skipped. Caring for one pet is a solo loop; a shared dog park would double the game.
Party slice: later (see the backlog row in `packages/party/README.md`).

Issues (each one file under `docs/roadmaps/giant-pup/`):

- `2A-dog-rig.md`: `src/dog.ts`
- `2B-yard-fx.md`: `src/scene.ts`, `src/fx.ts`
- `2C-ui.md`: `src/ui.ts`
- `2D-audio.md`: `src/audio.ts`
