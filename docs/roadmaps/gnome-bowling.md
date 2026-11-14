# Gnome Bowling

Goal: a motion-control-style ten-pin bowling game (move, aim, swipe up to bowl, hook the ball) with bowl-cut gnomes, 1-4 players on one device or 2-4 online through the shared server, gnome voice lines on every hit and miss, and big silly result screens (STRIKE!, TURKEY!, GUTTER BALL…).

Question it answers: does a swipe-to-bowl gesture on a phone feel as good as swinging a motion controller?

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | Scaffold, `config.ts` contracts, `scoring.ts` (+ tests), `game.ts` phase machine, bowl cut in `models/gnome.ts`, stubs for every system, `gnome-bowling` in the server's `GAMES`; `npm run build -w games/gnome-bowling` passes | 0 (direct) |
| 2. Systems | Every system filled in, one file per worker; build passes; smoke test clean | 11 |

Epic 2 issues (each in `docs/roadmaps/gnome-bowling/`, all parallel, each owns exactly one source file; shared brief in `_common.md`):

| Issue | File |
|---|---|
| epic2-01-physics | `src/physics.ts` (+ `physics.test.ts`) |
| epic2-02-lane | `src/lane.ts` |
| epic2-03-pins | `src/pins.ts` |
| epic2-04-bowler | `src/bowler.ts` |
| epic2-05-camera | `src/camera.ts` |
| epic2-06-controls | `src/controls.ts` |
| epic2-07-hud | `src/hud.ts` |
| epic2-08-celebrate | `src/celebrate.ts` |
| epic2-09-menu | `src/menu.ts` |
| epic2-10-audio | `src/audio.ts` |
| epic2-11-net | `src/net.ts` |

Ports: only epic2-11 may start a server (mp-server on 8787). Nobody runs vite.
