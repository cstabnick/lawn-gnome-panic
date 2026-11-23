Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (it lists the track API you use).

## Goal
Free-roam lap timing at the Lost & Found Speedway: `createLapTimer(ui, onLap)` in
`games/gnome-theft-auto/src/raceTrack/lapTimer.ts` times any ground vehicle the player drives over the start line,
through every checkpoint in order and back over the line, shows a small timer while a lap runs, saves the best lap per
vehicle model and overall in localStorage, and reports each finished lap through `onLap`.

## Read first
- `games/gnome-theft-auto/src/raceTrack/lapTimer.ts` (the stub: keep every export and signature)
- `games/gnome-theft-auto/src/raceTrack/track.ts` (`GateTracker`, `gates`, `onTrack`)
- `games/gnome-theft-auto/src/raceTrack/state.ts` (`raceActive()`)
- `games/gnome-theft-auto/src/types.ts`: `Vehicle` (fields `x`, `z`, `kind`, `spec.flies`, `spec.boat`, `spec.name`)
- `games/gnome-theft-auto/src/stunts.ts` lines 85-115: storage wrapped in try/catch (localStorage may throw)

## Change
`games/gnome-theft-auto/src/raceTrack/lapTimer.ts`:
- One `GateTracker`. Each `update(dt, v)`: if `raceActive()`, or no `v`, or `v.spec.flies` or `v.spec.boat`, reset the
  tracker and hide the panel. If the player swaps vehicles mid-lap, reset. Otherwise `tracker.update(dt, v.x, v.z)`:
  - 'start': show the panel, `LAP 0:00.0` counting up.
  - 'gate': flash the checkpoint split briefly (`CP 4/12  0:17.3`, green if ahead of the vehicle's best lap's split at
    that gate, red if behind; keep the best lap's gate splits in the save).
  - 'lap': the lap time is `tracker.lapTime` read BEFORE the next update (save it as soon as the event comes back; the
    tracker restarts its clock on the next frame). Compare to the saved best for `v.kind` and overall, save if better,
    call `onLap({ time, kind, personalBest, overallBest })`, show `LAP 41.27  (BEST 40.90)` for 4 s, then keep timing the
    next lap.
  - If the vehicle goes more than 60 m off the track (`!onTrack` and no gate for 20 s) reset quietly.
- Save format under `LAP_SAVE_KEY` (`'gta-speedway-laps-v1'`): `{ best: { [kind]: { time, splits: number[] } } }`.
  Wrap every storage access in try/catch; work without storage.
- `best(kind?)`: that kind's best, or the lowest of all, or null.
- Panel: one `div#gta-lap-timer` appended to `ui`, small, `pointer-events: none`, top-left under the safe area
  (`top: calc(env(safe-area-inset-top) + 64px); left: calc(env(safe-area-inset-left) + 12px)`), monospace digits,
  dark translucent background; CSS in one `<style id="gta-lap-timer-css">`. Must not cover the minimap (top right).
- Add `games/gnome-theft-auto/src/raceTrack/lapTimer.test.ts` (vitest; set up `document` with
  `installFakeDom()` from `src/testing/fakeDom` if the DOM is needed, and a `localStorage` stub on globalThis):
  drive a fake vehicle object (`{ x, z, kind: 'zero-turn', spec: { flies: false, boat: false } } as unknown as Vehicle`)
  along `trackSamples()` from 20 m before the line, 2 m per 0.1 s step, for two full laps; assert `onLap` fired twice
  with `time` close to `trackLength() / 20` and the best is saved; then assert skipping a gate (jumping the car past
  gate 3 to gate 5) does not count a lap.

## Contract
The stub's exports (`LAP_SAVE_KEY`, `LapInfo`, `LapTimer`, `createLapTimer`), unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/raceTrack/lapTimer.test.ts` (from `games/gnome-theft-auto`) passes

## Out of scope
Every other file.
