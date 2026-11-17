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

Code: `world.ts` (generation, heights), `physics.ts` (the board), `tricks.ts` (flicks, combos), `camera.ts`,
`view/*` (toon look, world, rider, effects), `hud.ts`, `audio.ts`, `input.ts`, `app.ts` (loop). Tuning: `TUNE` in
`config.ts`. Plan: `docs/roadmaps/aether-board.md`.
