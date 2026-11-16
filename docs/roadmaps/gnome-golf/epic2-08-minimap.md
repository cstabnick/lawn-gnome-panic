Epic: 2 Systems · Issue 8: hole minimap
Depends on: none

## Goal
`src/minimap.ts` draws a small top-down map of the current hole in the top-right corner, rotated so the tee is at the bottom and the green at the top, with the ball, the aim line and the selected club's landing point, like the hole map in PGA golf games.

## Read first
- `games/gnome-golf/src/config.ts`: `HOLES`, `LOOK`, `GameState`
- `games/gnome-golf/src/course.ts`: `lieAt`
- `games/gnome-golf/src/physics.ts`: `previewLanding`
- `games/gnome-golf/src/round.ts`: `currentHole`
- `games/gnome-golf/src/minimap.ts` (stub)

## Change
- `games/gnome-golf/src/minimap.ts`: implement `createMinimap(ctx: Ctx): System`. A `<canvas id="gm-map">` inside `<div id="gm-root">` appended to `ctx.ui`, top-right, 110 x 150 CSS px (canvas pixel size x devicePixelRatio, capped at 2), with `env(safe-area-inset-top/right)` margins, rounded corners, a 2px white-ish border, `rgba(10,30,20,0.55)` background.
  - **Per hole background** (rebuild when `state.holeIndex` changes, into an offscreen canvas): rotation angle so that the vector tee -> green points up on the map. Frame: the bounding box of the hole's path, tee and green, padded by 40 yd, in the rotated frame; uniform scale to fit 110 x 150. Fill every map pixel by sampling `lieAt(x, z)` at the world point under it (map pixel -> rotated frame -> world) and colouring with `LOOK` colours (fairway, rough, green, fringe, tee, sand, water = `LOOK.pond`). At devicePixelRatio 2 that is ~66k lieAt calls: fine once per hole.
  - **Each frame** (skip redraw unless something drawn changed: ball position, aimYaw, club, phase, flight progress): draw the background, then the pin (a red flag on a tiny white pole), the tee (small white square), the ball as a white dot with a dark outline (during 'flight' at the interpolated flight point from `state.flight.points[floor(phaseTime / sampleDt)]`), and, in 'aim'/'swing', a dashed white line from the ball along the aim to the landing point `previewLanding(state.ball, state.club, state.lie, state.aimYaw, currentHole(state).pin)` (cache by ball x/z + club + lie + aimYaw.toFixed(3)) with a small white circle there.
  - Tapping the map (`pointerdown`, pointer-events:auto on the canvas) toggles `state.view` between 'behind' and 'overhead' during 'aim'.
  - Hidden in 'title', 'card' and 'final'.

## Contract
`export function createMinimap(ctx: Ctx): System` (signature unchanged). The only state it writes is `state.view`. Element ids start with `gm-`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/minimap.ts`.
- The map shows the current hole with the tee at the bottom and the green at the top, the ball, and the aim line to the landing point.

## Out of scope
Every other file.
