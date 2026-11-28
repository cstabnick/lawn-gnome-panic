# E19 Courts and skate park: Drainpipe Court and the Gutter Bowls (roadmap)

Brief: [../E19-courts-and-skate-park.md](../E19-courts-and-skate-park.md) (source items L59 "add public basketball
court", L60 "add ability to play basketball (steal mechanics from GBA GJAMj, share code if possible)", L61 "add public
skate park", L62 "add ability to skateboard (ather board tie in)"), adjusted to the merged contracts: E01 sites
`basketball-court` (Drainpipe Court, (-90, 30), 40 x 28 m) and `skate-park` (the Gutter Bowls, (-30, 90), 40 x 40 m)
inside Founders' Green (E01 2B park blocks `gnorwin-courts`/`gnorwin-skate` dress the margins); E04 cast (Cardoon
"Swish" Trowelly, Fennel Gripwax) and the side-quest schedule (`sq-court-regulars`, `sq-gutter-bowls-sessions`); E07
Gnomlet apps; E09 sound bus, cast intros and voices. Contracts for later epics: [contracts.md](contracts.md).
Environment for every issue: [issues/_env.md](issues/_env.md).

## Decisions

- **`@lawn/jam`** (`packages/jam`): GBA GJAM's headless basketball (`JamSimulation`, balance, match types, the court
  constants out of `arena.ts`, the control-input type, the pure bots, `mulberry32`). GJAM re-exports it; the game's
  Vite-only bot sources (`?raw` scripts, Worker loader, remote HTTP bot) stay in the game and register through
  `setBotFactory`. A 9-match seeded golden (`sim.golden.test.ts`) captured before the move proves the sim unchanged.
- **`@lawn/trickboard`** (`packages/trickboard`): Aether Board's trick layer without three.js (trick/grab/grind tables,
  gestures, `zoneOf`/`grabFor`/`grindFor`, the recognizer, the combo scorer taking a `{ t, mode }` player). Aether
  Board re-exports it; `tricks.golden.test.ts` (recognizer commands and combo views) captured before the move.
- **Court scale** (R-215): GJAM's court and hoop scaled by 0.8 (`COURT_SCALE`): GJAM's gnomes are 1.25x a street gnome,
  so every proportion holds (rim 2.44 m). The sim runs 2v2 in its own frame; GTA draws it (`court/render.ts`) with a
  broadcast camera from the south. Pickup games go to 11, a Swish grudge match to 7; a shootaround is GTA's own small
  shot model.
- **Skateboard** (R-216): a vehicle kind `skateboard` stepped by `skate/runtime.ts` like winter's skis, on GTA's own
  controller `skate/board.ts` (winter's `stepSlide` for rolling and flying, plus ollie, vert, walls, grinds, bails),
  scored by `@lawn/trickboard`'s `createCombo` from the same `PhysEvent`s Aether Board emits (R-217: trick names and
  scoring are the same everywhere). Keyboard: Space ollie, F/click + direction flip, right click + direction grab;
  touch OLLIE/FLIP/GRAB. Rides anywhere on paved ground (grass is rough and slow); slower than any vehicle; getting
  off stows your own board in the bag. Aether's `stepPlayer` is not reused (slope-driven, no pushing).
- **The park's shape is data** (`SKATE_PIECES`): one height function (`skate/park.ts`) is what the board rides, what
  the surface meshes are built from (`skate/build.ts`) and what the stepped walker colliders follow. Ridable gutter
  and concrete surfaces are built in code (terrain-like); rails, ledge, deck, props are prefabs.
- **Online** (`docs/roadmaps/gta-online-sync.md`): the skateboard relays as an ordinary vehicle kind (added to `net.ts`;
  untracked by parkSync like skis); pickup games, shootarounds, combos and lines are local. No new sync system.
- **Party slice**: none (GBA GJAM owns basketball slices; a skate slice would need the park in the party scene).

## Shape

| Epic | Issues | Worker | Done when |
|---|---|---|---|
| 0 Packages + foundation | [P1](issues/P1-jam-package.md) `@lawn/jam`, [P2](issues/P2-trickboard-package.md) `@lawn/trickboard`; lead: court/skate/sports types, runtime stubs, `skateboard` kind, app.ts wiring, catalog files | Sonnet x2 + lead | package + source-game tests/builds, GTA tsc |
| A parallel (19) | [A1](issues/A1-court-game.md) game, [A2](issues/A2-shootaround.md) shootaround, [A3](issues/A3-court-build.md) court build, [A4](issues/A4-court-life.md) court life, [A5](issues/A5-court-hud.md) court HUD, [A6](issues/A6-court-render-view.md) render + camera, [A7](issues/A7-skate-park-shape.md) park shape, [A8](issues/A8-skate-board.md) board, [A9](issues/A9-skate-score-lines.md) score + lines, [A10](issues/A10-skate-build.md) park build, [A11](issues/A11-skate-life.md) park life, [A12](issues/A12-skate-hud.md) skate HUD, [A13](issues/A13-prefabs-court.md) [A14](issues/A14-prefabs-skate.md) prefabs, [A15](issues/A15-gear-achievements.md) gear + achievements, [A16](issues/A16-lore.md) lore, [A17](issues/A17-save-probes.md) save + probes, [A18](issues/A18-cast-sounds.md) cast + sounds, [A19](issues/A19-app-map.md) app + map | Haiku x10, Sonnet x9 | per-issue tests, tsc |
| B (3) | [B1](issues/B1-court-runtime.md) court runtime, [B2](issues/B2-skate-runtime.md) skate runtime, [B3](issues/B3-quests.md) side quests | Sonnet x3 | court/skate tests, quest sim |
| C lead | integration, build, full tests, smoke, zfight, screenshots, contracts, AGENT_INDEX | lead | all checks |

24 issues. The one dependency (B after A) is because each runtime wires every module of its place.

## Result (lead)

- All 24 issues landed. Lead fixes: the sports regular `burdock` cast key clashed with the Speedway's Big Flag (renamed
  `benchley`, old voice row restored); a shared `sportsStore()` so both runtimes write one save; `skateboard` exempted in
  `driveGrips.test.ts`; the skate HUD strips moved off the stats panel; z-fighting (coping tube caps against skirts,
  park surfaces on `LAYER.road` 0.03 proud with the board drawn to match, court repair patches on their own layer, the
  ball cage lifted); the `?skate=board` dev spawn moved out of the bowl.
- Checks: GTA build + `npm test` (4236 passed), GBA GJAM build + tests (75, incl. the sim golden), Aether Board build +
  tests (134, incl. the tricks golden), `@lawn/jam` (4), `@lawn/trickboard` (39), prefabs (3592), achievements (22),
  gnome (503), `npm run lore`, side-suite sim for both new quests, smoke at the court (`?court=game`) and the park
  (`?skate=board`) with `gta-gnomlet`, zfight there (no E19 pairs left; the rest are older).
- Screens (`screens/`): court-wide, court-bench (Old Burdock, Pip's toolbox), court-hoop, court-game (a pickup game
  with the broadcast camera and touch buttons); bowls-entrance, bowls-gutter (the Long Gutter, NPC skater, leaf pile),
  bowls-bowl, skate-ride (on a board by the stairs and handrail).

## Deferred / known issues

- Not hand-played on a real phone; touch layouts checked by tests and screenshots only. In landscape the court
  buttons may overlap the game's own bottom-right buttons.
- Online: games, shootarounds, combos and lines are local; the board relays as a vehicle.
- Free-shoot dunks are not modelled (only in pickup games); grinds are always along the rail (no slides pose).
- Some vignette props are stand-ins (no trainers, pump, plaster, milk saucer, Gnomlet or Hat Watch hat prefab).
- Side quests unlock after `ch1-founders-boot` until E20 builds #14/#15.
