Epic: E06-2 Fill (Sky, weather and time), issue 2G cutscene holds its first shot for the time-lapse (L11)
Depends on: none
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto`. Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the file listed under Change. Do not commit. Keep LF line endings.

## Goal
User request (L11): "add a neat transition where time speeds up rapidly when a cutscene is expected to start during a
different time of day; this shouldn't affect the overall world unless intentional". The game side already exists: when a
world-stage scene has `sky: 'noon'|'golden'|'night'`, the director calls `hooks.setSky(script.sky)`, and app.ts now starts
a visual time-lapse of the sky and returns how many seconds it takes (0 when the sky is already right). This issue makes
the director hold the scene's first shot for those seconds (the clock of the scene does not run), with a small
"time passes" badge, so the player watches the sun race to the scene's hour before anyone speaks.

## Read first
- `games/gnome-theft-auto/src/cutscene/director.ts`: the `hooks` interface (`setSky?(mode: 'noon' | 'golden' | 'night' | null): void;` ~line 41), the overlay elements built round line 114-132 (`titleEl`, `captionEl`, `skipBtn`, `fadeEl`), the `Playing` interface, `play()` (line ~330: `if (!room && script.sky) hooks.setSky?.(script.sky);` near the end), `update()` (the block `if (phase === 'in' || phase === 'play') { let next = c.pendingJump ?? c.clock + dt; ... }`), `skip()` and `finish()`.

## Change
- `games/gnome-theft-auto/src/cutscene/director.ts` only:
  - Hook type: `setSky?(mode: 'noon' | 'golden' | 'night' | null): number | void;` with the doc: "World stages with `sky`: time-lapse the sky to that hour; returns the seconds the director holds the first shot while it runs (0 or nothing: no hold). null scrubs the sky back to world time."
  - `Playing` gains `holdT: number` (seconds of first-shot hold left), initialised to 0 in the object literal in `play()`.
  - In `play()`, replace `if (!room && script.sky) hooks.setSky?.(script.sky);` with: `if (!room && script.sky) { const s = hooks.setSky?.(script.sky); c.holdT = typeof s === 'number' && s > 0 ? s : 0; }` (keep it where it is: `c` already exists there).
  - In `update()`, inside `if (phase === 'in' || phase === 'play')`: when `c.holdT > 0`, do `c.holdT = Math.max(0, c.holdT - dt); c.pendingJump = null;` and do not advance the clock (no `fireRange`, `c.clock` unchanged) but still let the `'in'` -> `'play'` switch happen when `phaseT >= fadeIn`. Otherwise run the existing code unchanged. Make sure steps at clock 0 have still fired once (they fire through `fireRange` when the clock first moves; if anything at time 0 must show during the hold, such as actors' first poses, that already comes from `sampleFrame(c.tl, c.clock, ...)` below, which keeps running every frame).
  - A badge element made once next to the other overlay elements: a pill at the top centre below the letterbox bar, text `⏩ Time passes…`, white on `rgba(0,0,0,.45)`, `border-radius: 999px`, `padding: 6px 14px`, `font: 600 14px system-ui`, `pointer-events: none`, `opacity` 0 by default with `transition: opacity .3s`. Each update set its opacity to `c.holdT > 0 ? '1' : '0'`; hide it in `finish()` and in `skip()`.
  - `skip()`: also set `cur.holdT = 0` (skipping a scene skips its hold).
  - `tap()` during the hold does nothing (return early when `cur.holdT > 0`).

## Contract
`setSky?(mode): number | void` as above. app.ts already returns `atmosphere.timeLapseTo(mode, 2.6).seconds` for a mode and `0` for null; do not edit app.ts.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/cutscene` passes.

## Out of scope
`app.ts`, `atmosphere.ts`, scene scripts, every other file.
