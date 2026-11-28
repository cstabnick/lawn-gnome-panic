# E19 Courts and skate park
Wave: 6 · Depends on: E01 (basketball court and skate park sites; downtown park L92) · Kind: Content

Source items:
- L59 "add public basketball court"
- L60 "add ability to play basketball (steal mechanics from GBA GJAMj, share code if possible)"
- L61 "add public skate park"
- L62 "add ability to skateboard (ather board tie in)"

## Goal
Two public sports places, each with a way to play: a basketball court where the player can shoot hoops or play a
short 1v1/2v2 game against gnome NPCs, using GBA GJAM's simulation through a shared package; and a skate park where the
player can ride a skateboard, do tricks, grind rails and score, tied to Aether Board's trick system.

## Scope
In:
- Public basketball court (surface, hoops, benches, fence, lights) in the E01 `basketball-court` site, with regulars (ambient gnomes) and a challenger NPC.
- Playable basketball: an on-court mode (first to N points or timed) using the extracted GJAM simulation, plus free-shoot mode. Entry by the interact key at a ball or a court marker.
- Skate park in the E01 `skate-park` site (bowl or quarter pipes, rails, ledges, stairs, kickers), likely part of the new downtown park (L92); a skateboard the player can pick up and ride on foot-sized terrain and on streets.
- Trick scoring, combo, bail, using Aether Board's modules through a package; a leaderboard-style best score; achievements.
- A small quest or two (a challenge from a regular) each; map POIs.

Out: full 2v2 pro-league/season, teams and announcer (GJAM); snowboard descent and floods (Aether Board); an in-game skateboard as a street vehicle for long travel (see risks).

## Code pointers (confirmed)
GBA GJAM (`games/gba-gjam/src/`):
- `sim.ts` (1594 lines): `class JamSimulation` (constructor `(config: MatchConfig, cb: SimCallbacks, botOpts)`, `step(dt, p1In, p2In)`, `setBot`, `getSnapshot`, `dispose`); imports `THREE` (Vector3 math), `COURT_HALF_X/Z`, `HOOP_X/Y`, `THREE_PT_RADIUS` from `arena.ts` (which also builds the scene with `buildPrefab`, so it is not importable in a headless package: move the constants out), `balance.ts` (`DEFAULT_BALANCE_CONFIG`), `types.ts` and `ai/`. Callbacks `SimCallbacks` (`onSound`, `onBurst`, `onRimShake`, `onAchievement`, `onMatchEnd`) are already an adapter seam. Input `PlayerControlInput` (`moveX`, `moveZ`, `turbo`, `shootDown/Pressed/Released`, `passPressed`, `fakePressed`) lives in `input.ts` beside DOM `JamInput` (keyboard and touch): extract only the type.
- Extractable: `sim.ts`, `balance.ts`, `ai/` (`ai/types.ts`, `snapshot.ts`, `classicBot.ts`, `eval.ts`; `ai/index.ts` imports `?raw` bot scripts via Vite, keep that file in the game), the court constants, `types.ts`. Tangled: `renderer.ts`, `ui.ts`, `audio.ts`, `music.ts`, `net.ts`, `cloud.ts` stay. Tests to keep green: `sim.test.ts`, `ai/ai.test.ts`, `teams.test.ts`, `balance` via those.
- Package decision: `packages/jam` (`@lawn/jam`) with `sim`, `balance`, `types`, `court` constants, `ai`; `games/gba-gjam` re-exports from it. If moving `arena.ts` constants forces a change to Gnome-GJAM behaviour, apply the master-plan fallback: write GTA basketball against the package API and leave GJAM alone.
- Prefabs: `gba-basketball`, `gba-hoop`, `gba-trophy`, `gba-headband`, `gba-whistle`, `gba-foam-finger`, `gba-gym-bag` (`packages/prefabs/src/catalog/gnome-jam.ts`) for the court and rewards.

Aether Board (`games/aether-board/src/`):
- Snowboard physics tied to a generated `World` (`world.ts`: `Island`, `Kicker`, `Rail`, `Pipe`, `groundAt`, `surfaceY`, `nearestOnRail`, `pipeLocal`). `physics.ts` (812 lines): `stepPlayer(p, inp, cmd, world, dt, ev)` fixed 120 Hz (`SIM_HZ`), modes `'ground' | 'air' | 'grind' | 'bail'`; hooks `setGroundModifier`, `setExternalForces`. It is built for downhill speed, not flat concrete (no pushing).
- Trick layer, easier to share: `tricks.ts` (388 lines: `createRecognizer`, `createCombo` from stick gestures), `config.ts` (`BOARD_TRICKS`, `GRABS`, `GRINDS`, `GROUND_GESTURES`, `AIR_GESTURES`, `zoneOf`, `Input`, `TrickCmd`, `PhysEvent`, `Player`), `trickbook.ts` (DOM UI, stays in the game); bail handling is inside `physics.ts` (mode `'bail'`). `config.ts` imports THREE for the palette: split palette from tables.
- Package decision: `packages/trickboard` (`@lawn/trickboard`) with trick tables, recognizer, combo and scoring; GTA writes its own `skate` controller (push, brake, ollie, rail snap) against the GTA ground and a small park-collision set, calling the package for tricks and points. Aether Board re-exports the package; `physics.test.ts`, `tricks.test.ts`, `cheat.test.ts` stay green. Reusing `stepPlayer` itself is deferred unless a ground adapter proves cheap.

GTA side (`games/gnome-theft-auto/src/`):
- Existing hooks: `parks/layoutA.ts` (Kilnside Rec at (-150,-30): `skate-quarter-pipe` x2 at ~line 96, `grind-rail`, tag decals; lore "a skate corner the Hat Watch pretends not to see"), `parks/blocks.ts` (`PARKS`), `parks/kit.ts`, `parks/life.ts`; `ambientGnomes.ts` (`amb-fells-skater`). The new downtown park from L92 comes from E01 and takes the court and the skate park as sub-sites.
- Player locomotion: `src/mount.ts` (`beginMount`, `stepMount`, `mountStyleOf`) is for vehicles; a skateboard fits better as a new vehicle kind in `config.ts` (like `'tow-tube'` ~line 415 or `'golf-cart'` ~380) with a custom step, or a player "mode" like `swim.ts`. `src/handling.ts`, `src/driveGrips.ts` for feel; `src/anim/ride.ts` and `anim/rideAuto.ts` for the rider pose; `src/bail.ts` for existing fall/ragdoll behaviour (GTA's own `bail.ts` and `bail.test.ts`).
- Runtime wiring: pattern of `installTubing` (`app.ts` ~line 869) and `jobs/`; new `src/sports/` (court, skate) installed from `app.ts` with a HUD module; HUD uses the shared `#ui` element (append your own container, do not restyle `#ui`).
- Achievements: `packages/achievements/src/catalog.ts`; quests: `quests/sideQuests.ts`.

## Contracts this epic provides
- `@lawn/jam` and `@lawn/trickboard` packages, each with a README and tests.
- `COURT` and `SKATE_PARK` exports (bounds, hoops, rails) for E18 and E21; a `sports` quest objective kind (`basketball-score`, `skate-score`).
- Skateboard item/vehicle kind and basketball item, as inventory-ready definitions for E08.

## Contracts this epic consumes
- E01: `basketball-court` and `skate-park` sites (court at least 28 x 15 m with run-off; skate park about 40 x 30 m flat); the downtown park from L92.
- E08 (if merged): inventory for the board and ball. Otherwise the board is a world pickup at the park.
- E04: names and a regular or two for each place.

## Online / mobile / achievements / prefabs / lore notes
- Online (`docs/roadmaps/gta-online-sync.md`): skating is just pose relay (the board as a vehicle kind relays like others); basketball is single-player vs NPCs, other players see the ball and gnomes as ordinary entities. Do not add a new sync system. Say so in the PR.
- Mobile: GJAM already has a touch layout (`JamInput` joystick, shoot, pass, turbo): reproduce as touch buttons >= 44 px in GTA; skateboard needs push, brake, ollie and a trick stick (stick gesture from `zoneOf`); both fit portrait and landscape with safe-area insets.
- Achievements: dunk, three-pointer, win a game; first ollie, 5-trick combo, grind a full rail; cosmetics: headband (prefab exists), a skate helmet (new).
- Prefabs: reuse `gba-*`; `skate-quarter-pipe`, `grind-rail` exist. New: skateboard, ledge, stairs, bowl, hoop and backboard at street scale, bench, scoreboard. `flatLayer` for court paint and park decals; `npm run zfight -- <url>`.
- Lore: `npm run lore -- find basketball` finds nothing; `find skate` finds Kilnside Rec (skate corner), the Aether's Splash-Back Skaters (a different setting). Add entries for the court, the park and regulars; a ruling that the court uses GJAM's gnome-sized hoop prefab (`gba-hoop`) and that the skateboard is a wood board with wheels.

## Risks and open questions (decision taken)
- GJAM `arena.ts` mixes constants with scene building. Decision: move constants to the package and have `arena.ts` import them, without altering values.
- A full 2v2 sim in a street scene is heavy. Decision: GTA mode runs `JamSimulation` in a 1v1 or 2v2 half-court-sized court with the sim's own court bounds, rendered with GTA meshes through the `onBurst`/`onSound` callbacks; no season, no announcer.
- Skate physics: Aether Board's is slope-driven. Decision: share tricks/scoring only; the controller is GTA-side and small. Push/brake/ollie tuning is data in one `SKATE` block.
- Skateboard as a street vehicle on traffic roads. Decision: the board works anywhere on the ground but is slower than any vehicle and gets no traffic-physics hand-off; entering a vehicle stows it.
- Overlap with Kilnside Rec's existing skate corner. Decision: keep it; the new park is larger and E01-owned.

## Done when
- `npm run build -w games/gba-gjam`, `npm test -w games/gba-gjam`, `npm run build -w games/aether-board`, `npm test -w games/aether-board`, `npm test -w packages/jam`, `npm test -w packages/trickboard`.
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`.
- Tests: a seeded GJAM match gives identical results from the package and the game; trick recognition parity; a GTA skate step test (push, ollie, grind snap, bail); sports quest defs.
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...`, `npm run zfight -- <url>`; manual: shoot and score a basket, ride the park and land a combo, at desktop and 390x844.
