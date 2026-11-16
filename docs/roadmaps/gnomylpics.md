# Gnomylpics: party-only games and the Gnome Olympics

Goal: a game can be **party-only** (it exists only to surface Gnome Party slices, so it is not on the landing page), and the first one, `games/gnomylpics`, adds six olympic-style events to Gnome Party.

Question it answers: do two-key, everyone-at-once track events (and a rhythm jam) make good 20-45 s party minigames?

Decisions (2026-11-15):
- Party-only = `"lawn": { "partyOnly": true }` in the game's `package.json`. `tools/build-site.mjs` and `tools/thumbnails.cjs` skip it; `npm run new -- <name> --party-only` makes one. Gnome Party needs no change: it already finds every `games/*/src/minigames/index.ts`.
- The olympics are Three.js slices. The Phaser proof of concept on `feature/gnomylpics` gave the tuning (tap boost, drag, stumble, triple-jump windows, toss needle), not code.
- Shared game modules in `src/olympic/` (the tap model, the tapper, the stadium kit, ranking), so each event is one file of rules + view.
- Taps are read from key events, not `PadState.x`: the pad sums A and D, so a fast overlapping alternate would read 0.
- Gnome Hero judges hits on the player's own screen (local clock, ±60/150 ms windows) and sends cumulative score counters; CPUs are judged by the host from the seeded chart. Friendly party, so client scores are trusted.

| Epic | Done when | Issues |
|---|---|---|
| 0. Foundation (planner) | `games/gnomylpics` scaffold (package.json with `lawn.partyOnly`, dev page listing the events, `#minigame=<id>`), six template stubs via `npm run new-mini`, `src/olympic/rank.ts`, stubs for `run.ts`, `taps.ts`, `field.ts`, `hero/audio.ts`; build and 48 contract tests pass | 0 (direct) |
| 1. Capability + shared modules | Party-only skipped by site/thumbnails, `--party-only` in new-game, docs; tap model + tests, tapper, stadium kit | 4, parallel |
| 2. The six events | Each `src/minigames/oly-*.ts` real, with its own test; Gnome Hero's chart and audio | 7, parallel |
| 3. Integration (planner) | `npm run build` + `npm test` for gnomylpics and gnome-party; smoke both pages; PR | fixes |

Issues: `docs/roadmaps/gnomylpics/` (`_common.md` for every worker, `_slices.md` for slice workers, one file per issue). Each issue owns its files only; no two issues share a file, port or output folder. Nobody runs vite during an epic.

## Outcome (2026-11-15)

All 11 worker issues landed. Fixes made while integrating:

- **Mower Toss spin was too punishing**: with `SPIN` = boost 0.9 / drag 2.5 / slip ×0.5, CPUs (and humans) rarely got past ~8 rad/s, so many throws landed under 10 m. Now boost 1.2, drag 1.8, slip ×0.7, stun 0.3 s, cap 30 rad/s, `REL_PER_SPIN` 1.1 (top throw still ~115 m); CPUs release from `1.6 + 2·skill` s. CPU marks over 20 seeds now spread from short to ~115 m instead of piling at 0-7 m or at the cap.
- **Gnome Hero chart was sparse** (42-83 notes, ~1.6/s): on-beat chance now 0.75→0.95, off-beat 0.25→0.7 across the song.
- **Triple Jump**: a JUMP press past the red line is a foul (it was silently ignored); CPUs look one step ahead before taking off (worker fix; seed 12 stalled).
- **Lawn Dart**: a throw only counts behind the foul line (worker fix).
- **Grass Mowing**: mowers are clamped to the lawn after the push-apart.
- **Gnome Hero view**: guitar at chest height with the neck across the body; stage order mirrored so seat 0 stands on the left, as on the scoreboard.
- Spectators get no tap / action buttons.

Checked: `npm test` + `npm run build` for gnomylpics (117 tests), gnome-party (15) and `packages/party` (15); `tools/smoke.sh` clean for the event list page, all six `#minigame=<id>` pages and all six `#mini=<id>` loops inside gnome-party; screenshots of sprint, mower toss, grass mowing, Gnome Hero and lawn dart (in the party) look right.

Not checked: online play with two browsers, touch devices, how the tap events feel at full speed with a real keyboard, the Gnome Hero audio by ear.
