Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. No audio files: every sound is synthesized with Web Audio.

## Goal
`workplaces/sounds3.ts` registers a synthesized recipe for every id in `JOBS3_SOUND_IDS` (bin round, fire brigade,
Gnomazon) on the world sound bus, so the job runtimes can `play2d(id)` / `playAt(id, pos)`.

## Read first
- `games/gnome-theft-auto/src/workplaces/sounds3.ts`: the stub (`JOBS3_SOUND_IDS`, `registerJobs3Sounds`).
- `games/gnome-theft-auto/src/workplaces/sounds.ts`: E24's finished version of exactly this (the `Recipe` signature
  `(ctx, out, t, info) => seconds`, `pitch(info)`, `lvl(info, peak)`, `PEAK_MAX`, `burst`, `tone`, `voiced` from
  '../sound/synth', `registerSound` / `hasSound` from '../sound/bus'). Follow it.
- `games/gnome-theft-auto/src/workplaces/sounds.test.ts`: the test to mirror.
- `games/gnome-theft-auto/src/sound/synth.ts`: helper signatures.

## Change
- `games/gnome-theft-auto/src/workplaces/sounds3.ts`: keep `JOBS3_SOUND_IDS` and `registerJobs3Sounds()` (idempotent:
  skip ids already `hasSound`); add `export const JOBS3_RECIPES: Record<Jobs3SoundId, Recipe>`. Peaks <= 0.25, each
  0.1-1.5 s:
  - bin-arm-hydraulic: a 0.9 s whine rising in pitch with a hiss. bin-clank: a hollow plastic-and-metal clonk.
    bin-tip: rubbish tumbling (a rumble of noise bursts, 0.8 s). bin-spill: a clatter of cans and paper (several
    short bright ticks + rustle). bin-set-down: a soft plastic thud. lorry-reverse-beep: three beeps (1 kHz square).
  - fire-bell: a brass hand bell rung fast (several inharmonic dings, 1.2 s). fire-crackle: 0.8 s of random crackle
    pops over a low roar. hose-spray: a 1 s white-noise hiss with a slight flutter (loopable by replaying).
    hose-splash: wet splatter. steam-hiss: a fast hiss falling off. ladder-clunk: a metal clunk-clank. rescue-cheer:
    a short rising "hooray" (two voiced notes). cat-meow: a little falling meow (voiced, formant-ish).
  - tape-screech: the long screech of a tape gun (0.6 s, band-passed noise sweeping up). scanner-beep: one clean
    high beep. box-thud: a cardboard thump. conveyor-clunk: a roller clunk. kippy-chime: a friendly two-note rising
    chime (sine). kippy-error: a polite two-note falling "bwoop". quota-fanfare: a tiny 4-note major arpeggio.
- `games/gnome-theft-auto/src/workplaces/sounds3.test.ts` (new): after `registerJobs3Sounds()`, `hasSound(id)` for
  every id; render each recipe once with the same fake-context approach as sounds.test.ts.

## Contract
`JOBS3_SOUND_IDS`, `Jobs3SoundId`, `registerJobs3Sounds()` unchanged in name and type.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/sounds3.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/sounds3*.ts`.

## Out of scope
`sound/` (do not edit), `workplaces/sounds.ts`, every other file.
