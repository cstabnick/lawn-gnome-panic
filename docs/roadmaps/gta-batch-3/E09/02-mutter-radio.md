Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. This issue edits the shared package `packages/mutter`, used by other
games: the change must be additive and optional, with every existing behaviour unchanged.

## Goal
`SayOptions.radio` (already declared in `packages/mutter/src/index.ts`, no behaviour yet) makes a line sound over the
air: the phone band plus a soft crackle of static under the line.

## Read first
- `packages/mutter/src/index.ts`: `SayOptions` (the `radio?: boolean` field is declared), `PHONE_HIGHPASS_HZ`,
  `PHONE_LOWPASS_HZ`, `PHONE_CLIP`, `softClipCurve`, `buildLine(c, out, opts, v)` (~line 450) which builds the per-line
  chain, and `createMutter` `say()` which calls it and stops/disconnects nodes when the line ends.
- `packages/mutter/src/index.test.ts`: how lines are tested without audio (`say` returns 0 with no context).

## Change
- `packages/mutter/src/index.ts`:
  - `buildLine`: treat `opts.radio` as implying the phone band (`if (!opts?.phone && !opts?.radio)` for the plain
    branch). For radio, use a slightly narrower band (`RADIO_HIGHPASS_HZ = 450`, `RADIO_LOWPASS_HZ = 2800`) and
    `RADIO_CLIP = 6`.
  - Static: when `opts.radio`, add a looping noise source (a 1 s white-noise AudioBuffer made once per context and
    cached) through a bandpass at 2200 Hz (Q 0.8) and a gain of 0.035 times `opts.gain ?? 1`, connected to the same
    output as the line (after the pan). Return it so `say()` starts it with the line and stops it when the line ends
    (use whatever end time `say()` already computes; stop it with the oscillators). Its nodes must be disconnected at
    the end like the others (the existing `nodes` list).
  - Keep `estimate()` unchanged: radio does not change timing.
- `packages/mutter/src/index.test.ts`: add a test that `planMutter`/`estimate` give the same duration with
  `{ radio: true }` as without, and that `say(..., { radio: true })` returns 0 without an audio context (like the
  existing phone test at ~line 114).

## Contract
```ts
interface SayOptions { /* ... */ phone?: boolean; radio?: boolean; gain?: number; pan?: number }
```
No other API change. Lines without `radio` build exactly the same nodes as before.

## Done when
- `npm test -w packages/mutter` passes (from the worktree root).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.

## Out of scope
Every file outside `packages/mutter/src/`. Do not change defaults, voice timing or the phone branch's numbers.
