Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/hud.ts` shows a classic bowling score sheet for every player, the "whose turn" banner, a pin diagram, and the final standings with Play Again.

## Read first
- `games/gnome-bowling/src/config.ts`: `GameState`, `Player`, `ROUND`, `Ctx`
- `games/gnome-bowling/src/scoring.ts`: `frameMarks`, `frameScores`, `totalScore`, `maxPossible`, `cursor`
- `games/gnome-bowling/src/game.ts`: `currentPlayer`, `newGame`, `toTitle`, `makePlayer`

## Change
- `games/gnome-bowling/src/hud.ts`: `createHud(ctx): System`. Container `#bh-root` in `ctx.ui`; all CSS selectors start with `#bh-`.

## What to build
Rebuild DOM text only when something changed (keep a key string such as players' rolls + current + phase), not every frame.

- **Scoreboard** (top strip, phases intro/aim/approach/roll/result): one row per player: colour chip + name (max 10 chars shown), then 10 frame boxes, then the total. Each frame box: the ball marks on top in small squares (frames 1-9: 2 slots, frame 10: 3 slots; use `frameMarks`: 'X' in bold gold, '/' cyan, '-' grey), the running total from `frameScores` underneath (blank when null). The current bowler's row is highlighted (border in their colour, slightly brighter) and the current frame box outlined. Players with `gone` are greyed with "left".
  - Phones: the full sheet is too wide at 390px. In portrait show only the current bowler's row full-width plus a compact list of the others (name + total); in landscape / ≥ 700px wide show all rows. Rows ~30px high; whole strip ≤ 25% of the viewport height (`max-height:25vh; overflow:hidden`).
- **Pin diagram** (top-right below the scoreboard, ≤ 90x90 px): ten dots in the triangle (pin 7 top-left … pin 10 top-right, head pin at the bottom, as seen from the bowler: pin 1 bottom centre; pins 2,4,7 on the LEFT of the diagram). Dot filled white = `state.standing[p]`, hollow = down. During 'roll' keep showing the standing set from before the throw; update in 'result'.
- **Turn banner** (centre, phase 'intro' only): big italic "**GNANCY**" in the player's colour, under it "Frame 3" (`state.frame + 1`) and, for the 10th frame, "FINAL FRAME"; slide in from the left, out to the right over `ROUND.introSeconds`. In online mode add "(you)" for the local player and "Waiting for <name>…" text at the bottom centre while a remote player is in 'aim'.
- **Ball speed** (small, top-left under the scoreboard, phases 'roll' and 'result'): `state.input.speed` as km/h (`speed * 3.6`, one decimal), e.g. "27.0 km/h".
- **Final standings** (phase 'final', full-screen overlay `rgba(20,10,40,0.85)`): title "FINAL SCORES", players sorted by `totalScore` (ties share a place), each row: place (1st with a 👑), name in colour, total, and their full score sheet row. A fun line under the winner by score: 300 "PERFECT GAME!!!", ≥ 200 "Gnome Legend", ≥ 150 "Lane Gnome", ≥ 100 "Weekend Gnome", else "Gutter Gnome". Buttons (≥ 48px, pointer events): **PLAY AGAIN** (local mode only: `newGame(state, state.players.map(p => makePlayer(p.name, p.look, p.color)), 'local')`) and **MENU** (`toTitle(state)`). In online mode only MENU.
- Hide everything in 'title' and 'lobby' (menu.ts owns those screens).

## Contract
`export function createHud(ctx: Ctx): System`. Nothing else exported.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in hud.ts
- With a game running, the score sheet, pin diagram and turn banner show and update; 'final' shows the standings with working buttons.

## Out of scope
Result screens (celebrate.ts), the title menu (menu.ts), controls. Do not edit any other file.
