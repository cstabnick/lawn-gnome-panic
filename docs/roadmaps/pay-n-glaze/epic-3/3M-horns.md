Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: 3A

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/audio.ts` and a new `games/gnome-theft-auto/src/horns.ts` and `horns.test.ts`.

## Goal
Seven horn sounds for the Horn shelf: `stock` (the game's current honk), `squeak` (rubber duck), `moo` (cow), `trumpet` (party trumpet), `siren` (sheriff siren), `bell` (bicycle ding) and `kazoo`.

## Read first
`games/gnome-theft-auto/src/audio.ts` (all: how sounds are synthesised with WebAudio, `playHorn(kind)`, and the stub `playHornVariant(id)` at the end), `packages/glaze/src/ids.ts` (`HORN_IDS`).

## Change
- `horns.ts` (pure data and maths, no WebAudio): `export interface HornNote { freq: number; start: number; dur: number; type: 'sine' | 'square' | 'sawtooth' | 'triangle'; gain: number; slideTo?: number; vibrato?: number }`, `export function hornNotes(id: string): HornNote[]` returning the note list for each horn (all times in seconds from 0, total length at most 1.2 s, gains at most 0.35; unknown ids give the `stock` notes). Sketches: `stock` two short low square notes (the existing honk: copy its numbers from `playHorn`), `squeak` a rising sine 900 to 1700 Hz over 0.12 s then a short 1400 Hz blip, `moo` a sawtooth sliding 160 to 120 Hz over 0.9 s with vibrato 6, `trumpet` three square notes 392, 392, 523 Hz (0.12 s, 0.12 s, 0.4 s), `siren` a triangle sliding 600 to 900 to 600 Hz over 1.0 s, `bell` two sine pings 1760 Hz and 2349 Hz decaying over 0.5 s, `kazoo` a sawtooth 330 Hz with vibrato 30 for 0.5 s.
- `horns.test.ts`: every id in `HORN_IDS` gives at least 1 note, all fields finite, gains at most 0.35, total length (max of `start + dur`) at most 1.2, unknown id falls back to the stock notes, `moo` has a `slideTo`.
- `audio.ts`: make `playHornVariant(id)` play `hornNotes(id)` with the same WebAudio context and master gain the other sounds use (a note = oscillator + gain envelope with a 10 ms attack and exponential release; `slideTo` ramps the frequency; `vibrato` adds a low-frequency oscillator on the frequency), guarded for a missing AudioContext (never throw). Change `playHorn(kind: VehicleKind, horn?: string)`: when `horn` is given and not `'stock'` play that variant, else the existing sound (keep the existing per-kind behaviour exactly). Keep every other export unchanged.

## Contract
`hornNotes(id): HornNote[]`, `playHornVariant(id: string): void`, `playHorn(kind, horn?)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in your files.
- `npx vitest run games/gnome-theft-auto/src/horns.test.ts` passes.

## Out of scope
Every other file (`app.ts` passes `v.look.horn` to `playHorn`: the planner does that).
