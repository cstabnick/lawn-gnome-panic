Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. The comedy set is watched, not played: this overlay is what makes
it read as a painful live set (subtitles, heckles popping in, a cringe meter) while the 3D stage plays behind it.

## Goal
`workplaces/comedy/stageUi.ts`: the overlay for a comedy set: typed-out subtitles, heckle bubbles, stage-direction
captions, a cringe meter, a tomato splat on the screen, and two buttons: Double Down (enabled only at the right moment)
and Walk off.

## Read first
- `games/gnome-theft-auto/src/workplaces/comedy/types.ts`: `StageUi`, `StageUiOpts`, `CrowdReaction` (the comments
  say what each method does).
- `games/gnome-theft-auto/src/workplaces/comedy/stageUi.ts`: the stub; keep `openStageUi(ui, opts): StageUi`.
- `games/gnome-theft-auto/src/workplaces/shiftCard.ts`: CSS-injection pattern and look of the game's cards.

## Change
- `games/gnome-theft-auto/src/workplaces/comedy/stageUi.ts`: `openStageUi(ui, opts)` appends `<div id="gta-stage-ui">`
  to `ui` (CSS injected once, id `gta-stage-ui-css`; z-index 38; the root itself `pointer-events:none`, only its
  buttons `pointer-events:auto`):
  - Top: a small title "Tonight at Le Petit Groan: <opts.title>" and a cringe meter (a bar 0..100 with a label
    "CRINGE", green to red; tiny wobble animation above 80).
  - Bottom centre: the subtitle box (max-width min(560px, 92vw), safe-area padded): the speaker name in small caps
    ("YOU" for the player's gnome, "MIREILLE" for the booker) and the text typed out letter by letter so the whole
    line is typed by 70% of `s` seconds, held until the next call.
  - `heckle(name, text)`: a speech bubble sliding in from the left or right edge (alternate), name in bold, held
    2.5 s, then fades; at most 2 on screen (the oldest goes).
  - `reaction(kind)`: a centred italic stage direction for 1.8 s, words per kind: silence "*silence*", cricket
    "*a cricket, somewhere*", cough "*one cough*", groan "*a long groan*", sigh "*the room sighs*", boo "*booing*",
    heckle "*a voice from the dark*", tomato "*a tomato*", walkout "*a chair scrapes. Someone leaves.*", pity-clap
    "*one person claps. Then stops.*".
  - `meter(n)`: sets the bar.
  - `setDoubleDown(on)`: the right-hand button "🎤 Double down" (min 56 px tall, bold, pulsing gently while enabled,
    greyed and `disabled` when not). Click / tap -> `opts.onDoubleDown()`. Keyboard: Space or D also triggers it while
    enabled.
  - A small "Walk off" button (44 px, top-right under the safe area) -> `opts.onLeave()`. Keyboard: Escape.
  - `splat()`: a red tomato splat (radial-gradient blob with seeds, random position in the middle third) that slides
    down 60 px over 1.5 s and fades out; can stack.
  - `close()`: removes the root and key listeners; idempotent.
  - Fits 390x844 portrait and 844x390 landscape (subtitle above the buttons, buttons never overlap the subtitle).
- `pointerdown` on the buttons calls `stopPropagation()` (the game behind must not see it).

## Contract
`export function openStageUi(ui: HTMLElement, opts: StageUiOpts): StageUi`; every `StageUi` method as in types.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/comedy/stageUi.ts`.
- Reading the code: `close()` twice is safe and removes every listener it added.

## Out of scope
`comedy/types.ts`, every other file.
