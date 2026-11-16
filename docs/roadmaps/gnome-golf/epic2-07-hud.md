Epic: 2 Systems · Issue 7: HUD (title, hole info, wind, banners, scorecard)
Depends on: none

## Goal
`src/hud.ts` shows everything the player reads but does not steer with: the title screen, hole and score info, distance to the pin, lie, wind, shot banners, and the scorecard between holes and at the end of the round.

## Read first
- `games/gnome-golf/src/config.ts`: `GameState`, `HOLES`, `LIES`, `ROUND`
- `games/gnome-golf/src/round.ts`: `newRound`, `nextHole`, `currentHole`, `distanceToPin`, `roundTotals`, `fmtDistance`, `scoreName`
- `games/gnome-golf/src/course.ts`: `holeLength`
- `games/gnome-golf/src/hud.ts` (stub)

## Change
- `games/gnome-golf/src/hud.ts`: implement `createHud(ctx: Ctx): System`. One root `<div id="gh-root">` appended to `ctx.ui`; all CSS selectors start with `#gh-`. Only touch the DOM when a displayed value changes (cache the last strings).
  1. **Title overlay** (phase 'title'): full screen, a soft dark-to-transparent gradient at the bottom, big title "GNOME GOLF" (white, heavy, letter-spaced, a small red ▲ gnome hat over the first O), subtitle "Gnome Island Links · 9 holes", a large "TEE OFF" button (pointer-events:auto, `pointerdown`) that calls `startAudio()` then `newRound(state)`. Under it a short how-to in small text: "Drag to aim · ◀ ▶ clubs · tap SWING three times: start, power, accuracy". Enter key also starts.
  2. **Hole info** (top-left panel, all phases except title): "Hole 3" big, "Par 5 · 467 yd" (`Math.round(holeLength(hole))`), "Stroke 2" (= state.strokes + 1 while aiming; state.strokes otherwise), and the round to-par from `roundTotals` ("E", "+2", "-1") with total strokes.
  3. **Shot info** (under the hole info): lie name (`LIES[state.lie].name`), "To pin: 143 yd" via `fmtDistance(distanceToPin(state), state.lie)`, and a **wind** indicator: an arrow (a CSS-rotated "➤" or an inline SVG arrow) plus "8 mph". The arrow is relative to the aim: rotate it by `(state.wind.yaw - state.aimYaw)` so pointing up means the wind blows toward the target (helping), down = into the player's face; right of the aim is clockwise on screen. Hide shot info in 'title', 'card', 'final'.
  4. **Banners** (top-centre, big text with a dark pill background, fade in/out with a CSS transition):
     - 'intro': "Hole N" over "Par P · Y yd" and below it "Tap to skip" in small text.
     - 'result': `state.banner` (e.g. "Fairway · 212 yd", "Splash! +1 penalty, drop").
     - 'holed': `state.banner` (score name like "Birdie!") extra big; gold for birdie or better.
     - Hidden otherwise.
  5. **Scorecard** (phases 'card' and 'final'): centred full-screen overlay panel (pointer-events:auto), a table with rows Hole (1-9), Par, Score (blank if null), colour-coded score cells (circle-ish highlight for under par, square-ish for over par), an OUT/total column, and the to-par total. Under it a button: 'card' -> "NEXT HOLE" calls `nextHole(state)`; 'final' -> big "Round complete: 38 (+2)" heading and a "PLAY AGAIN" button that calls `newRound(state)`. Enter key presses the button. Make it fit a 390px-wide portrait screen (smaller font, the table may scroll horizontally inside its own panel).
- Use `import { startAudio } from './audio'`.

## Contract
`export function createHud(ctx: Ctx): System` (signature unchanged). The only state changes it makes are via `newRound` and `nextHole`. Element ids start with `gh-`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/hud.ts`.
- The title shows a TEE OFF button with id `gh-start` that starts the round; the scorecard root has id `gh-card`; the hole info panel has id `gh-info`.

## Out of scope
Every other file. Club selector, swing meter and VIEW/SWING buttons are controls.ts; the minimap is minimap.ts.
