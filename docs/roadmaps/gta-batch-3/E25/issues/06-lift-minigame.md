Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Minigame-feel issue: the rules are fixed below, the feel (timing,
readability, juice) is yours to get right. No dev server needed (the runtime that opens this UI comes later); test the
UI with a tiny throwaway HTML harness only if you want, and delete it.

## Goal
The bin lorry's lift-arm minigame: a pure state machine (`lift.ts`) and its on-screen controls (`liftUi.ts`): one big
hold button and a side-view gauge, playable with touch, keyboard and gamepad, fun for the 10-15 seconds a bin takes.

## Read first
- `games/gnome-theft-auto/src/workplaces/garbage/types.ts`: `LiftPhase` (the rules, in its comment), `LiftState`,
  `LiftEvent`, `LiftInput`, `LiftResult`, `LIFT` tuning.
- `games/gnome-theft-auto/src/workplaces/garbage/lift.ts` and `liftUi.ts`: the stubs (signatures to keep).
- `games/gnome-theft-auto/src/workplaces/chef/stepWidgets.ts`: E24's touch step widgets (hold buttons, DOM + CSS
  injected once by id, pointer handling, `data-gnl-touch`, how they read keys and `firstPad()` from '@lawn/gamepad').
- `games/gnome-theft-auto/src/keys.ts` (`isTyping`, `KEYS`) for key handling.

## Change
- `games/gnome-theft-auto/src/workplaces/garbage/lift.ts`: implement exactly these rules (dt in seconds):
  - Every step: `t += dt; phaseT += dt`. Swing clock: `hz = LIFT.swingHz * (heavy ? LIFT.heavySwing : 1)`.
  - **grab**: `swing = sin(2*pi*hz*phaseT)`. On `press`: if `|swing| <= LIFT.grabWindow` -> phase 'lift', phaseT 0,
    event 'grabbed'; else `misses++`, event 'grab-miss', and if `misses >= LIFT.maxMisses` -> grabbed anyway (phase
    'lift', event 'grabbed').
  - **lift**: swing eases to 0. While `hold`: `tilt += LIFT.liftRate * (heavy ? LIFT.heavyLift : 1) * dt`; if tilt >=
    `LIFT.spillAt` -> tilt = 1, `spilled = emptied = true`, phase 'lower', phaseT 0, event 'spill'. On release
    (`wasHeld && !hold`): tilt in [tipMin, tipMax] -> `emptied = true`, phase 'lower', phaseT 0, event 'tipped'; tilt
    below tipMin -> nothing (the player holds again).
  - **lower**: `swing = LIFT.lowerSwing * sin(2*pi*hz*phaseT)`. While `hold`: `tilt -= LIFT.lowerRate * dt`; when tilt
    <= 0: tilt 0, `neat = clamp(1 - |swing|, 0, 1)`, phase 'done', event 'set-down'. Letting go pauses the lowering
    but the swing keeps going, so the skill is to stop and time the last bit of lowering to a swing zero crossing.
  - `wasHeld = hold` at the end of every step. 'done' ignores input.
  - `liftResult`: stars start at 5, -1 per miss, -1 if neat < 0.5, capped at 2 when spilled, minimum 1;
    `seconds = t`.
- `games/gnome-theft-auto/src/workplaces/garbage/lift.test.ts` (new): a grab press at swing 0 grabs; a press at a
  peak misses; 3 misses grab anyway; holding to 1 spills; releasing inside the tip zone tips; lowering to 0 at a
  swing zero crossing gives neat >= 0.9; stars rules; deterministic with fixed dt.
- `games/gnome-theft-auto/src/workplaces/garbage/liftUi.ts`: `openLiftUi(ui, opts)` builds its own container
  (id `gta-lift-ui`, appended to `ui`, CSS injected once) at the bottom of the screen (safe-area aware), above the
  touch driving controls' area, fitting 390x844 and landscape phones:
  - A side-view gauge (inline SVG or a small canvas, ~260 x 140 px): the lorry's side in silhouette, the arm drawn at
    `tilt`, the bin on the claw swinging by `swing`, a green **tip zone** wedge (tipMin..tipMax) and a red spill mark
    at the top during 'lift'; in 'grab' a centre tick the swinging claw must pass; in 'lower' the kerb mark under the
    bin. Smooth, readable at a glance.
  - One big round hold button (>= 88 px) labelled by phase: "Grab" (tap), "Lift" (hold), "Lower" (hold); a small
    hint line under it ("Let go in the green", "Stop when it swings to the middle"); a 44 px "Leave it" button.
  - Input: the button (pointerdown/up/cancel/leave, `data-gnl-touch="none"`), Space or the job-action key `KEYS.jobAction`
    (keydown/keyup, ignore repeats and `isTyping`), gamepad A or RT (poll `firstPad()` in update). `press` = edge down
    this frame, `hold` = any held.
  - `update(dt)`: build the LiftInput, `stepLift`, forward events to `opts.onEvent`, redraw, and on 'done' close itself
    and call `opts.onDone(liftResult(s))`. "Leave it" / Escape: close and `opts.onCancel()`.
  - Juice: a brief shake of the gauge on a miss or spill, a flash on a clean tip, the button pulses in the zone.
  - `close()` removes every listener and the container.

## Contract
`createLift(heavy)`, `stepLift(s, dt, input)`, `liftResult(s)` and `openLiftUi(ui, opts): LiftUi` exactly as in the
stubs; `LiftUiOpts` and `LiftUi` unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/garbage/lift.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- Layout reasoned (or checked in a throwaway harness) at 390x844 and 844x390: nothing off screen, buttons >= 44 px.

## Out of scope
`garbage/types.ts` (if a LIFT number must change, say so in your report instead), every other file.
