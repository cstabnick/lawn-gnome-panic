Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. This is a game-feel issue: the cooking must be FUN and juicy on a
phone (it is the whole point of the chef job, "should be fun").

## Goal
`workplaces/chef/stepWidgets.ts` builds one playable touch mini-game per cooking step kind (chop, stir, pour, heat,
flip, plate), each returning a 0..100 score when finished. DOM + CSS only (no canvas libraries; a `<canvas>` 2D context
is fine), pointer events so mouse and touch both work.

## Read first
- `games/gnome-theft-auto/src/workplaces/chef/types.ts`: `CookStep`, `CookStepKind` (the comment defines each kind's
  rules and what `target` means), `StepWidget`.
- `games/gnome-theft-auto/src/workplaces/chef/stepWidgets.ts`: the stub; keep `makeStepWidget(step): StepWidget`.
- `games/gnome-theft-auto/src/workplaces/sounds.ts`: `WORK_SOUND_IDS` ('chef-chop', 'chef-stir', 'chef-pour',
  'chef-sizzle'...). Play with `play2d(id)` from `games/gnome-theft-auto/src/sound/bus.ts` (it returns false and does
  nothing when the sound is not registered yet: fine).

## Change
- `games/gnome-theft-auto/src/workplaces/chef/stepWidgets.ts`: `makeStepWidget(step)` returns a `StepWidget` whose
  `el` is a self-contained block (min 260 x 240 px, `width: min(360px, 92vw)`), with the step `label` on top, the play
  area, and a small progress/feedback line. Inject one `<style id="gta-chef-steps-css">` once. Use `pointerdown` /
  `pointermove` / `pointerup` (and `touch-action: none` on the play area) so a drag never scrolls the page;
  `e.stopPropagation()` on pointerdown so the game behind ignores it. Every widget:
  - **chop**: a cutting board with the ingredient (`step.emoji`, big). Each tap = a knife chop (a knife emoji 🔪 drops,
    the ingredient splits into more, smaller pieces, a tiny shake), play 'chef-chop'. Done after `target` taps. Score:
    100 minus time over `step.seconds` (-10 per second over, min 30).
  - **stir**: a pot seen from above with the ingredient floating; the player drags round the pot; count the angle
    swept around the pot centre (sum of signed angle deltas, either direction); one full turn = 2*PI. A spoon follows
    the finger, the contents swirl (rotate) with progress, 'chef-stir' every half turn. Done at `target` turns.
    Score: as chop, from time.
  - **pour**: hold (pointerdown) to pour: a jug tilts, a bar fills at 0.45 per second while held; release to stop. A
    marked band at `target` +- 0.08. Done on the first release after fill > 0.05. Score: 100 inside the band, else
    100 - 400 * distance outside the band (min 0); overfill above 1 spills (score 0, a little "SPLOSH").
  - **heat**: a dial with a needle sweeping 0..1..0 (period 1.6 s); a green zone of width 0.2 centred on `target`; tap
    once (anywhere on the play area) to stop it: 'chef-sizzle'. Score: 100 at the centre, 60 at the zone edge, falling
    to 0 at 0.3 away.
  - **flip**: a pan with the item; a ring fills over 1.2 s; tap when it is full (within 0.35 s after it fills) for a
    perfect flip (the item flips with a hop), early = undercooked, late = a burnt edge (darker). `target` flips. Score:
    mean per flip: perfect 100, early or late 55, missed (ring empties after 1 s past full) 20.
  - **plate**: a plate and `target` numbered garnish buttons (use the step emoji plus 🌿 🍅 🧀 🫘 🌰 for variety)
    scattered around it; tap them in order 1..n: each flies onto the plate. A wrong tap shakes red (-15). Score:
    100 - 15 per wrong tap - 5 per second over `seconds`, min 20.
  - `update(dt)` drives the animations and timers; `result()` is null until finished, then the score (integer
    0..100); after finishing, show a one-word verdict ("Perfect!", "Nice", "Fine", "Oops") for feedback.
  - `destroy()` removes window-level listeners and cancels timers (the caller removes `el`).
- Targets and buttons at least 44 px. Bright, warm diner colours (cream, tomato red, mustard, pale green); big emoji.

## Contract
`export function makeStepWidget(step: CookStep): StepWidget` (types from `./types`). Nothing else is imported by other
modules. The widget must not depend on any game object (no three.js, no app state).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/chef/stepWidgets.ts`.
- Optional self-check: a vitest with `// @vitest-environment jsdom` is NOT required (jsdom may not be installed);
  instead read your code once for each kind: it can finish, `result()` becomes a number, `destroy()` leaves no
  listeners.

## Out of scope
`chef/types.ts`, `chef/menu.ts`, `chef/kitchenUi.ts` (another worker builds the screen that hosts your widgets), every
other file.
