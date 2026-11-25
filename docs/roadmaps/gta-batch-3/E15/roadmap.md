# E15 Golf course: Hedgeworth Links (roadmap)

Brief: [../E15-golf-course.md](../E15-golf-course.md) (source item L85: "add a golf course. should have a club house
interior. player can actually play golf using improted mechanics from gnome golf. will need a lot of new land space.
add by breaking through a fence into someone elses yard. with big hedges and tall grass and large plants that line the
course. still letp layer drive through it. add some quests and make owenr and pro and groundskeeper fun people with
interesting stuff going on."), adjusted to the merged contracts: E01 site `golf-yard` (x -1360..-1000, z 410..830,
flat), E05 `defineInterior` (the clubhouse), E04 cast (Dame Peony Gravelrake, Basil Divot, Thrift Hosepipe), E07
Gnomlet apps, E09 intro cards and sound ids, E10 `registerHome`, E27 mowable plants. Contracts this epic gives later
epics: [contracts.md](contracts.md). Environment for every issue: [issues/_env.md](issues/_env.md).

## Decisions

- **Shared code: `@lawn/golf`** (`packages/golf`). Gnome Golf's pure golf maths moved there: club and lie tuning,
  `simulateShot(env, ...)` against any course given as plain functions (`CourseEnv`), the three-tap swing meter
  (`swingTap` / `swingStep`), score names, seeded wind, water drops, `featureLie` for courses without an island. Gnome
  Golf re-exports it (its imports are unchanged), its controls use the package's swing meter, and a new
  `shot.golden.test.ts` (25 shots, captured before the move, never recaptured) proves the ball flies the same.
- **Gnome yards.** Hedgeworth is played in the package's yards on a frame shifted to the site centre and scaled by
  `YD` = 0.5 m (R-189): a driver carries 205 gnome yards (102 m), and four holes fit the 360 x 420 m yard. Greens really
  rise and tilt (`greenRise`), and the green meshes are built on the same heights the ball rolls on.
- **Four holes, nine on the card** (R-190): 1 The Mortgage (par 4), 2 Vesper's Patience (par 3), 3 The Long Week
  (par 5, Hosepipe Pond), 9 The Ninth (par 4). Par 16. The brief's 3-6 holes, and the old lore's "nine-hole course"
  survives as Peony's mortgage joke.
- **The fence**: E01's breach anchor (-895, 640) was inside the old square, east of the road; the Kicked Board now
  sits on the yard's own east fence at (-1001, 640) (anchor moved, `sites.test.ts` updated). It breaks for a vehicle at
  5 m/s or a kick and stays broken (saved). The Members' Gate at the cart-path approach is always locked (R-191), so
  the Kicked Board is the way in: L85's "breaking through a fence into someone else's yard".
- **Driving through**: hedge walls are solid (with arches you can drive through); tall grass is E27 mowable flora
  (drive through and cut it); giant plants have no collider and slow you with a rustle (`SOFT_SLOW_PER_S`).
- **A round** is local and single-player: walk or cart to the ball, "Address the ball", aim (stick/keys/touch), club
  (up/down), three taps of jump/fire or the SWING button; the address camera and a ball-flight camera; a scorecard.
  Online (`docs/roadmaps/gta-online-sync.md`): rounds and strokes are not relayed (others see the golfer and the carts
  as ordinary relayed vehicles); the board's state is per save. A shared-ball relay would double the epic: deferred.
- **Side quests** (side-quest schedule rows): Lost Balls (Thrift), A Lesson from the Pro (Basil), The Ninth Green
  (Thrift), Members' Cup (Peony, ends in the clubhouse). They unlock after existing story quests until E20/E21 build
  #29/#49/#50/#52 and move them. `sq-hedgeworth-reseed` (needs E21's mown scar) is deferred to E21.
- **Party slice**: none (Gnome Golf already has `golf-hole`).

## Shape

| Epic | Issues | Worker | Done when |
|---|---|---|---|
| 0 Package + foundation | [P1](issues/P1-golf-package.md) `@lawn/golf`; lead: `golf/types.ts`, `course.ts`, stubs, app.ts wiring, catalog files | Sonnet + lead | golf package + Gnome Golf tests/build, game tsc |
| A parallel (15) | [A2](issues/A2-round.md) round, [A3](issues/A3-save-probes.md) save + probes, [A4](issues/A4-hud.md) HUD, [A5](issues/A5-course-ground.md) greens, [A6](issues/A6-yard.md) yard, [A7](issues/A7-clubhouse.md) buildings + interior, [A8](issues/A8-life.md) storytelling + residents, [A9](issues/A9-prefabs-structures.md) [A10](issues/A10-prefabs-plants.md) [A16](issues/A16-prefabs-props.md) prefabs, [A11](issues/A11-gear-achievements.md) gear + achievements, [A12](issues/A12-lore.md) lore, [A13](issues/A13-cast-sounds.md) cast + sounds, [A14](issues/A14-golf-app.md) Gnomlet app, [A15](issues/A15-view.md) ball view + camera | Haiku x11, Sonnet x4 | per-issue tests, tsc |
| B (2) | [B1](issues/B1-runtime.md) runtime, [B2](issues/B2-quests.md) side quests | Sonnet x2 | golf tests, quest sim |
| C lead | integration, build, full tests, smoke, zfight, screenshots, contracts, AGENT_INDEX | lead | all checks |

20 issues. The one dependency (B after A) is because the runtime integrates every A module and the quests need the
save's probes.

## Result (lead)

- All 20 issues landed (A13 and B2 started late: the shared subagent limit was full).
- Lead fixes: wheat beds swapped for reeds in the rough and more giant plants (110) in the middle of the course; z-fighting
  (cups to `LAYER.marker`, stacked vignette decals, a café table foot, and the shared `golf-flagstick` prefab's cloth moved
  off the pole); the HUD's hole strip and Card/Quit move below the game's top HUD on phone portrait; golden layout
  regenerated (new giver markers, the breach anchor).
- Checks: GTA build + `npm test` (3764 passed), Gnome Golf build + tests (24, incl. the shot golden), `@lawn/golf` (15),
  prefabs (3126), achievements (22), `npm run lore`, side-suite sim 4/4 for the Hedgeworth quests, smoke on the course
  (`gta-gnomlet`, `golf-hud`), zfight there (no Hedgeworth pairs left; 13 older ones elsewhere). Screens: [screens.md](screens.md).

## Deferred / known issues

- `sq-hedgeworth-reseed` (needs E21's mown scar); quests unlock after existing story beats until E20/E21 re-time them.
- Online: rounds and the board are local; a shared ball relay is deferred.
- Not played by hand on a real phone; the round was checked by unit tests, smoke and screenshots only.
- No mole prefab (the popping mole is skipped); hedgerow scales uniformly, so hedge walls are ~2.8 m thick.
