Epic: E17 wave 2 (living parts)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (mobile rules matter here; who the Flock are).

## Goal
"Stand for the sermon": at Wader's Rest's ritual circle the player presses and holds (a 88 px on-screen button, or
holds E / Space) and stands on one leg while Mother Saxifrage's sermon scrolls by. Let go early and you wobble (you
have had a thought; Sister Sedge pours you a cup of reed tea). Hold to the end and it is stood (counted in the save).
At night the sermon is longer and ends with the prophecy.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`WADERS_REST.circle`, `SOCIETY_EVENTS.sermon`, `SocietyDeps`,
  `SocietyPart`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/interactables.ts` lines 60-90 (`addInteractSpot`)
- `games/gnome-theft-auto/src/societies/loamdeep/digUi.ts` (a full-screen hold game already in this epic: copy its DOM
  approach, pointer and key handling and cleanup)
- `games/gnome-theft-auto/src/jobs/types.ts` lines 315-345 (`JobsDeps.timeLabel()`, `hud`)
- `games/gnome-theft-auto/src/societies/flock/sermon.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/flock/sermon.ts`: `installSermon(deps)` returns a `SocietyPart`.
  - `addInteractSpot({ x: WADERS_REST.circle.x, z: WADERS_REST.circle.z, prompt: 'Stand for the sermon', run })`: refuse
    with a toast if `deps.blocked()` returns a reason; else open the overlay.
  - Pure exports: `SERMON_DAY: readonly string[]` (8 lines, ~2.5 s each, ~20 s) and `SERMON_NIGHT` (12 lines, ~30 s),
    in Saxifrage's voice (slow, sing-song, a list of gentle absurd rules, "so it is stood"); the night one's last line is
    "And on the longest day comes the Even Cut. I do not know why I know it. So it is stood." (funny first, a little
    ominous at the end). `sermonLength(night: boolean): number` (seconds) and `sermonLine(lines, elapsed, total)`.
    Night = `deps.timeLabel()` says night or dusk (check the TimeLabel values in atmosphere.ts).
  - The overlay (one container appended to `deps.ui`, fixed, inset 0, z-index ~60, safe-area padding, a panel max 440 px,
    `pointer-events: auto`): title "Stand on one leg", the current sermon line big and readable, a progress bar, and a
    big round button "HOLD" (>= 88 x 88 px, `touch-action: none`, `user-select: none`). Hold starts on pointerdown (or
    keydown E/Space, ignoring repeats); release (pointerup/cancel/leave, keyup) before the end = wobble: show "You
    wobbled. You have had a thought. Sister Sedge pours you a cup of reed tea." for ~1.5 s, close, nothing counted.
    Holding to the end: show "So it is stood." ~1.2 s, close, `updateSocietySave((s) => { s.sermonsStood++; })`,
    dispatch `new CustomEvent(SOCIETY_EVENTS.sermon, { detail: { long: night } })` on `window`,
    `playAt('flock-hum', circle)`. A 44 px "Step out" button and Escape close without counting. Before the first press,
    the text says "Press and hold to stand." Fits 390 x 844 portrait and landscape.
  - `isOpen()`: true while the overlay is up.
- `games/gnome-theft-auto/src/societies/flock/sermon.test.ts` (new): node tests for `SERMON_DAY`/`SERMON_NIGHT` (counts,
  the night's last line mentions the Even Cut), `sermonLength`, and `sermonLine` (first line at 0, last line near the end,
  clamped past the end).

## Contract
`installSermon(deps): SocietyPart` keeps its signature; the save field `sermonsStood`; the event
`SOCIETY_EVENTS.sermon` with detail `{ long: boolean }`; spot prompt exactly 'Stand for the sermon'.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/flock/sermon.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
