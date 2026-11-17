# Aether Board

Goal: a high-fluidity movement game. A gnome snowboards an ethereal plane of floating islands: carve down sloped islands,
launch kickers across the gaps, grind ley-lines through the sky, and flick skate-style tricks with the mouse (a springy
virtual right stick) or a gamepad's right stick. Bright, saturated, cel-shaded, Jet Set Radio-ish. Mechanics, fluidity
and vibe first; no goals or menus yet.

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | contracts (`config.ts`), world generation + height queries (`world.ts`), the board physics (`physics.ts`, autopilot tests ride 10+ islands), chase camera, toon helpers, loop with interpolation, stubs; builds | 0 |
| 2 Modules | build + tests pass; the game plays end to end with every module real | 7 |

Epic 2 issues (each file is the full issue; `_env.md` is the shared environment section):

- [2A tricks](aether-board/2A-tricks.md): flick recognizer + combo scoring (`tricks.ts`, tests)
- [2B input](aether-board/2B-input.md): keyboard, pointer-lock mouse stick, gamepad (`input.ts`)
- [2C world view](aether-board/2C-world-view.md): sky, islands, kickers, rails, ley-lines, gate, decor (`view/world.ts`)
- [2D rider](aether-board/2D-rider.md): toon gnome + board, poses, trail, shadow (`view/rider.ts`)
- [2E fx](aether-board/2E-fx.md): speed lines, streaks, bursts, sparks, flashes (`view/fx.ts`)
- [2F hud](aether-board/2F-hud.md): title/controls card, JSR trick text, combo, speed, flow, stick display (`hud.ts`)
- [2G audio](aether-board/2G-audio.md): wind, hiss, pops, landings, grinds, music (`audio.ts`)

## Epic 3: more tricks, halfpipes, no death, personality (after playtest feedback)

Planner (foundation): gamepad start fix (button edges were always false), pause only on leaving pointer lock, ollie
fixes (a pull-back stays armed 0.5 s, a fast down-up passes through centre, a plain flick up ollies), touch controls,
18 board tricks + 10 grabs + 9 grinds as shared tables (`GROUND_GESTURES`, `AIR_GESTURES`, `GRABS`, `GRINDS`), grab
and grind selection and switching in the physics, halfpipe chutes in the world (`Pipe`, `pipeY`) with an in-air
assist back into the pipe, the sky-fall (fall off and you drop onto the next island), the trick-book toggle.

- [3A tricks](aether-board/3A-tricks.md): recognizer from the tables, mod (grab held) versions, new combo lines
- [3B trick book](aether-board/3B-trickbook.md): the trick book overlay (`trickbook.ts`)
- [3C pipes view](aether-board/3C-pipes-view.md): halfpipe rendering (`view/world.ts`)
- [3D rider personality](aether-board/3D-rider-personality.md): grabs that connect, grind stances, personality (`view/rider.ts`)

Party slice: later (see `packages/party/README.md`).
