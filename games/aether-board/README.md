# Aether Board

A gnome snowboards the ethereal plane. Carve down floating islands, launch the kickers across the gaps, grind the
glowing ley-lines through the sky, and flick skate-style tricks. Fluid movement first: the board simulates at a fixed
120 Hz and the renderer interpolates, speed is kept through terrain changes and landings, and a chase camera follows
your travel (not your board, so spins never whip it).

- Run: `npm run dev -w games/aether-board` (port 5195). `?seed=N` picks another world.
- Tests: `npm test -w games/aether-board` (an autopilot rides the island chain; the trick recognizer and scoring).
- Controls: see the title card, and the **trick book** (T / Tab, pad View, 📖 on touch) for every trick. Mouse =
  trick stick under pointer lock (pull back then flick forward to ollie; flick up-left for a kickflip, ...). A gamepad's
  right stick does the same, Skate style (A also ollies and starts the game). Hold a grab while you pop for the harder
  versions (double flips, 360 shove-its, ...). In the air, hold grab and point the stick to pick the grab; on a rail,
  the stick picks the grind. Phones: left-thumb joystick, swipe tricks on the right, tap to ollie, BOOST / GRAB buttons.
- The world: islands (some long), kickers, rails, ley-lines through the sky, halfpipe chutes between some islands.
  Fall off and you drop out of the sky onto the next island: no dead ends.

## Descent (roguelite mode)

`?mode=descent` (or the **DESCENT MODE** pill on the title card). Inspired by Descenders: a run is 12 hills. Before
each one you pick one of three hill cards, each with three sliders (0-5). Descent hills are snowy pine mountains:
**hazard** (glades of trees to weave through, rock gardens, aether spikes, narrower runs, more gaps), **steep**
(grade, so speed, and cliff drops, some you can ride round) and **tricky** (more and bigger kickers, rails,
ley-lines, chutes, and forks where a tree strip splits the run into a safe line and a trick line). Ride the hill to
the gate (or off the end of the last run) to clear it. Risky riding pays: a clean landing right next to a hazard is a
**Close Call** and a long air is **Big Air**, both scored in the combo. Harder hills multiply your trick score more and pay perk picks,
crash shields and 1-up lives; every hill also has a bonus trick-score target. A crash (any bail, or falling off)
costs a shield if you have one, else a life; at zero lives the run is over. Every 4th hill is a boss hill. Perks
(attributes) stack up to a few levels: push, pop, spin, landing tolerance, boost, bail recovery, grinds, score,
shields per hill, +1 max life, and three landing perks: **Guardian Gnome** (a bad landing per hill is saved),
**Soft Knees** (wider landing tolerance on big airs) and **Daredevil** (more Close Call points).
`?mode=descent&autopick=1` skips the picker (takes the first card; for smoke tests and demos). Free ride is unchanged. Tuning: `DESCENT` in `src/descent/types.ts`. Plan:
`docs/roadmaps/aether-descent.md`.

Code: `world.ts` (generation, heights), `physics.ts` (the board), `tricks.ts` (flicks, combos), `camera.ts`,
`view/*` (toon look, world, rider, effects), `hud.ts`, `audio.ts`, `input.ts`, `app.ts` (loop). Tuning: `TUNE` in
`config.ts`. Plan: `docs/roadmaps/aether-board.md`.
