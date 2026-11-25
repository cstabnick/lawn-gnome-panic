Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. No audio files: every sound is synthesized with Web Audio.

## Goal
`workplaces/sounds.ts` registers a synthesized recipe for every id in `WORK_SOUND_IDS` (kitchen, garage, comedy crowd)
on the world sound bus, so the job runtimes can `play2d(id)`.

## Read first
- `games/gnome-theft-auto/src/workplaces/sounds.ts`: the stub (`WORK_SOUND_IDS`, `registerWorkSounds`).
- `games/gnome-theft-auto/src/pardonlin/sounds.recipes.ts`: a complete example of registering procedural recipes
  (`registerSound`, `hasSound` from `../sound/bus`; `burst`, `tone`, `voiced` from `../sound/synth`; the `Recipe`
  signature `(ctx, out, t, info) => ...`, `PEAK_MAX`, `pitch(info)`, `lvl(info, peak)`).
- `games/gnome-theft-auto/src/sound/synth.ts`: the helper signatures.
- `games/gnome-theft-auto/src/sound/recipes/recipes.test.ts`: how recipes are tested with a fake AudioContext (if a
  helper exists there, reuse it).

## Change
- `games/gnome-theft-auto/src/workplaces/sounds.ts`: keep `WORK_SOUND_IDS` and `registerWorkSounds()` (idempotent);
  add a `RECIPES: Record<WorkSoundId, Recipe>` and register each with `registerSound(id, recipe)` (skip ids already
  `hasSound`). Peaks <= 0.25. Each short (0.1-1.5 s):
  - chef-chop: a dry knife-on-board knock (short filtered noise burst + low thud). chef-sizzle: 0.8 s hissing high
    noise with crackle pops. chef-stir: a soft wooden scrape. chef-pour: a 0.6 s gurgle (noise through a wobbling
    band-pass). chef-bell: a bright counter bell "ding" (two inharmonic partials, 1.2 s decay). chef-ticket: a paper
    rustle + a tiny printer chirp.
  - mech-air-wrench: a 0.5 s brrrt (pulsed noise at ~30 Hz). mech-spray: 0.8 s hiss with a rattle at the start.
    mech-keys: a jingle (3-4 small metallic tinks).
  - crowd-groan: 1.2 s of several low voiced "ohhh" voices falling in pitch (use `voiced` or detuned tones through a
    formant-ish band-pass). crowd-boo: 1.4 s of several "boo" voices. crowd-cough: one cough (noise burst, two
    pulses). crowd-sigh: a breathy falling noise. pity-clap: ONE clap (a sharp noise burst), then 0.5 s, then a second
    smaller, hesitant clap. comedy-rimshot: a snare hit then a cymbal (badum-tss). tomato-splat: a wet squelch
    (low-passed noise with a fast pitch drop). tomato-whoosh: a short rising whoosh.
- `games/gnome-theft-auto/src/workplaces/sounds.test.ts` (new): after `registerWorkSounds()`, `hasSound(id)` is true
  for every id; if recipes.test.ts has a fake-context helper, also render each recipe once without throwing.

## Contract
`WORK_SOUND_IDS`, `WorkSoundId`, `registerWorkSounds()` unchanged in name and type.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/sounds.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/sounds*.ts`.

## Out of scope
`sound/` (do not edit), every other file.
